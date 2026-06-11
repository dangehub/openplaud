import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { enqueueTranscriptionJobs } from "@/db/queries/transcription-jobs";
import { plaudConnections, recordings, userSettings, users } from "@/db/schema";
import { decrypt, encrypt } from "@/lib/encryption";
import { encryptText } from "@/lib/encryption/fields";
import { env } from "@/lib/env";
import { sendNewRecordingBarkNotification } from "@/lib/notifications/bark";
import { sendNewRecordingEmail } from "@/lib/notifications/email";
import { createPlaudClient } from "@/lib/plaud/client-factory";
import {
    refreshWorkspaceToken,
    shouldRefreshWsToken,
} from "@/lib/plaud/ws-refresh";
import { createUserStorageProvider } from "@/lib/storage/factory";
import { emitEvent } from "@/lib/webhooks/emit";
import type { PlaudRecording } from "@/types/plaud";

/** Decode a JWT payload and extract the `exp` claim (seconds since epoch).
 *  Returns null if the token is not a valid JWT or has no exp claim. */
function parseJwtExp(token: string): number | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const payload = JSON.parse(
            Buffer.from(parts[1], "base64url").toString("utf8"),
        );
        return typeof payload.exp === "number" ? payload.exp : null;
    } catch {
        return null;
    }
}

const SYNC_CONFIG = {
    PAGE_SIZE: 50,
    BATCH_CONCURRENCY: 5,
    MAX_PAGES: 20,
} as const;

interface SyncResult {
    newRecordings: number;
    updatedRecordings: number;
    errors: string[];
    pendingTranscriptionIds: string[];
    /** True when this call coalesced into an already-running in-process sync. */
    inProgress?: boolean;
}

// Per-user in-flight dedup within one process. Cross-process correctness
// is enforced by `enforcePlaudSyncRateLimit` at the route boundary.
const inFlightSyncs = new Map<string, Promise<SyncResult>>();

interface SyncContext {
    userId: string;
    autoTranscribe: boolean;
    emailNotifications: boolean;
    barkNotifications: boolean;
    notificationEmail: string | null;
    barkPushUrl: string | null;
}

async function uniqueStorageKey(
    userId: string,
    baseName: string,
    ext: string,
    plaudFileId: string,
): Promise<string> {
    const candidate = (suffix: string) =>
        `${userId}/${baseName}${suffix}.${ext}`;

    for (let i = 0; i < 100; i++) {
        const suffix = i === 0 ? "" : ` (${i + 1})`;
        const key = candidate(suffix);
        const [existing] = await db
            .select({ id: recordings.id })
            .from(recordings)
            .where(
                and(
                    eq(recordings.userId, userId),
                    eq(recordings.storagePath, key),
                    ne(recordings.plaudFileId, plaudFileId),
                ),
            )
            .limit(1);
        if (!existing) return key;
    }
    return `${userId}/${plaudFileId}.${ext}`;
}

async function processRecording(
    plaudRecording: PlaudRecording,
    context: SyncContext,
    plaudClient: Awaited<ReturnType<typeof createPlaudClient>>,
    storage: Awaited<ReturnType<typeof createUserStorageProvider>>,
): Promise<{
    status: "new" | "updated" | "skipped" | "error";
    recordingId?: string;
    filename?: string;
    error?: string;
}> {
    try {
        const [existingRecording] = await db
            .select()
            .from(recordings)
            .where(
                and(
                    eq(recordings.plaudFileId, plaudRecording.id),
                    eq(recordings.userId, context.userId),
                ),
            )
            .limit(1);

        const versionKey = plaudRecording.version_ms.toString();

        if (
            existingRecording &&
            existingRecording.plaudVersion === versionKey
        ) {
            return { status: "skipped" };
        }

        // Tombstone: suppress resurrection of user-deleted recordings (#56).
        if (existingRecording?.deletedAt) {
            return { status: "skipped" };
        }

        const audioBuffer = await plaudClient.downloadRecording(
            plaudRecording.id,
            false,
        );

        const fileExtension = "mp3";
        const safeName =
            plaudRecording.filename.replace(/[/\\:*?"<>|]/g, "-").trim() ||
            plaudRecording.id;
        const storageKey = await uniqueStorageKey(
            context.userId,
            safeName,
            fileExtension,
            plaudRecording.id,
        );
        const contentType = "audio/mpeg";
        await storage.uploadFile(storageKey, audioBuffer, contentType);

        const recordingData = {
            userId: context.userId,
            deviceSn: plaudRecording.serial_number,
            plaudFileId: plaudRecording.id,
            filename: encryptText(plaudRecording.filename),
            duration: plaudRecording.duration,
            startTime: new Date(plaudRecording.start_time),
            endTime: new Date(plaudRecording.end_time),
            filesize: plaudRecording.filesize,
            fileMd5: plaudRecording.file_md5,
            storageType: env.DEFAULT_STORAGE_TYPE,
            storagePath: storageKey,
            downloadedAt: new Date(),
            plaudVersion: versionKey,
            timezone: plaudRecording.timezone,
            zonemins: plaudRecording.zonemins,
            scene: plaudRecording.scene,
            isTrash: plaudRecording.is_trash,
        };

        if (existingRecording) {
            // Re-check under FOR UPDATE: a concurrent DELETE may have
            // tombstoned the row during the download/upload above.
            const updated = await db.transaction(async (tx) => {
                const [locked] = await tx
                    .select({ deletedAt: recordings.deletedAt })
                    .from(recordings)
                    .where(
                        and(
                            eq(recordings.id, existingRecording.id),
                            eq(recordings.userId, context.userId),
                        ),
                    )
                    .for("update")
                    .limit(1);

                if (!locked || locked.deletedAt) return false;

                await tx
                    .update(recordings)
                    .set({ ...recordingData, updatedAt: new Date() })
                    .where(
                        and(
                            eq(recordings.id, existingRecording.id),
                            eq(recordings.userId, context.userId),
                        ),
                    );
                return true;
            });

            if (!updated) {
                // Best-effort cleanup of the orphaned blob.
                try {
                    await storage.deleteFile(storageKey);
                } catch (cleanupError) {
                    console.error(
                        `Failed to clean up orphaned storage object ${storageKey} after concurrent delete:`,
                        cleanupError,
                    );
                }
                return { status: "skipped" };
            }

            await emitEvent(
                "recording.updated",
                context.userId,
                existingRecording.id,
            );
            return {
                status: "updated",
                recordingId: existingRecording.id,
                filename: plaudRecording.filename,
            };
        }

        const [newRecording] = await db
            .insert(recordings)
            .values(recordingData)
            .returning({ id: recordings.id });

        await emitEvent("recording.synced", context.userId, newRecording.id);

        return {
            status: "new",
            recordingId: newRecording.id,
            filename: plaudRecording.filename,
        };
    } catch (error) {
        return {
            status: "error",
            error: `Failed to sync ${plaudRecording.filename}: ${error}`,
        };
    }
}

async function processBatch(
    batch: PlaudRecording[],
    context: SyncContext,
    plaudClient: Awaited<ReturnType<typeof createPlaudClient>>,
    storage: Awaited<ReturnType<typeof createUserStorageProvider>>,
): Promise<{
    newCount: number;
    updatedCount: number;
    errors: string[];
    newRecordingIds: string[];
    newRecordingNames: string[];
}> {
    const results = await Promise.allSettled(
        batch.map((rec) =>
            processRecording(rec, context, plaudClient, storage),
        ),
    );

    let newCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];
    const newRecordingIds: string[] = [];
    const newRecordingNames: string[] = [];

    for (const result of results) {
        if (result.status === "fulfilled") {
            const { status, recordingId, filename, error } = result.value;
            if (status === "new" && recordingId) {
                newCount++;
                newRecordingIds.push(recordingId);
                if (filename) newRecordingNames.push(filename);
            } else if (status === "updated") {
                updatedCount++;
            } else if (status === "error" && error) {
                errors.push(error);
            }
        } else {
            errors.push(`Batch processing error: ${result.reason}`);
        }
    }

    return {
        newCount,
        updatedCount,
        errors,
        newRecordingIds,
        newRecordingNames,
    };
}

/** Paginated, batched sync. Coalesces concurrent same-user calls in-process. */
export async function syncRecordingsForUser(
    userId: string,
): Promise<SyncResult> {
    const inFlight = inFlightSyncs.get(userId);
    if (inFlight) {
        const shared = await inFlight;
        return { ...shared, inProgress: true };
    }

    const run = runSyncRecordingsForUser(userId);
    inFlightSyncs.set(userId, run);
    try {
        return await run;
    } finally {
        inFlightSyncs.delete(userId);
    }
}

async function runSyncRecordingsForUser(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
        newRecordings: 0,
        updatedRecordings: 0,
        errors: [],
        pendingTranscriptionIds: [],
    };

    try {
        const [connection] = await db
            .select()
            .from(plaudConnections)
            .where(eq(plaudConnections.userId, userId))
            .limit(1);

        if (!connection) {
            result.errors.push("No Plaud connection found");
            return result;
        }

        // ── Token refresh / expiry check ──────────────────────────
        // CN-region connections store a short-lived WT + a ~30-day WRT.
        // If the WT is expired (or about to), refresh it automatically.
        // Global-region connections store a long-lived UT (~300 days);
        // for those, just check expiry and bail with a helpful message.

        let effectiveBearerToken = connection.bearerToken;

        if (connection.wsRefreshToken) {
            // CN-region: auto-refresh if WT expired or about to expire
            if (shouldRefreshWsToken(connection.wsTokenExpiresAt)) {
                console.log(
                    "[sync] workspace token expired or expiring, refreshing...",
                );
                if (!connection.workspaceId) {
                    result.errors.push(
                        "Workspace token refresh failed: missing workspace ID. Please reconnect your Plaud account in Settings.",
                    );
                    return result;
                }
                try {
                    const decryptedWrt = decrypt(connection.wsRefreshToken);
                    const refreshed = await refreshWorkspaceToken(
                        decryptedWrt,
                        connection.workspaceId,
                        connection.apiBase,
                    );
                    // Persist the new tokens
                    const encryptedWt = encrypt(refreshed.workspaceToken);
                    const encryptedWrt = encrypt(refreshed.refreshToken);
                    await db
                        .update(plaudConnections)
                        .set({
                            bearerToken: encryptedWt,
                            wsRefreshToken: encryptedWrt,
                            wsTokenExpiresAt: refreshed.expiresAt,
                            updatedAt: new Date(),
                        })
                        .where(
                            and(
                                eq(plaudConnections.id, connection.id),
                                eq(plaudConnections.userId, userId),
                            ),
                        );
                    effectiveBearerToken = encryptedWt;
                    console.log(
                        `[sync] workspace token refreshed, new expiry: ${refreshed.expiresAt.toISOString()}`,
                    );
                } catch (err) {
                    const msg =
                        err instanceof Error ? err.message : String(err);
                    console.error(
                        "[sync] workspace token refresh failed:",
                        msg,
                    );
                    result.errors.push(
                        `Workspace token refresh failed: ${msg}. Please reconnect your Plaud account in Settings.`,
                    );
                    return result;
                }
            }
        } else {
            // Global-region: static JWT expiry check
            const decryptedToken = decrypt(connection.bearerToken);
            const tokenExp = parseJwtExp(decryptedToken);
            if (tokenExp !== null && tokenExp < Date.now() / 1000) {
                const expiredAt = new Date(tokenExp * 1000).toISOString();
                console.error(
                    `[sync] Plaud bearer token expired at ${expiredAt}. User must reconnect.`,
                );
                result.errors.push(
                    `Plaud access token expired (${expiredAt}). Please reconnect your Plaud account in Settings.`,
                );
                return result;
            }
        }

        const [settings] = await db
            .select()
            .from(userSettings)
            .where(eq(userSettings.userId, userId))
            .limit(1);

        const [user] = await db
            .select({
                email: users.email,
                suspendedAt: users.suspendedAt,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (user?.suspendedAt) {
            result.errors.push("User is suspended");
            return result;
        }

        const context: SyncContext = {
            userId,
            autoTranscribe: settings?.autoTranscribe ?? false,
            emailNotifications: settings?.emailNotifications ?? false,
            barkNotifications: settings?.barkNotifications ?? false,
            notificationEmail:
                settings?.notificationEmail || user?.email || null,
            barkPushUrl: settings?.barkPushUrl || null,
        };

        const plaudClient = await createPlaudClient(
            effectiveBearerToken,
            connection.apiBase,
            connection.workspaceId,
        );
        const storage = await createUserStorageProvider(userId);
        const allNewRecordingNames: string[] = [];

        let page = 0;
        let hasMore = true;
        let consecutiveEmptyPages = 0;

        while (hasMore && page < SYNC_CONFIG.MAX_PAGES) {
            const skip = page * SYNC_CONFIG.PAGE_SIZE;
            const recordingsResponse = await plaudClient.getRecordings(
                skip,
                SYNC_CONFIG.PAGE_SIZE,
                0,
                "edit_time",
                true,
            );

            const plaudRecordings = recordingsResponse.data_file_list;

            if (!plaudRecordings) {
                console.error(
                    "[sync] Plaud API returned no data_file_list. Response keys:",
                    Object.keys(recordingsResponse),
                    "status:",
                    recordingsResponse.status,
                    "msg:",
                    recordingsResponse.msg,
                );
                result.errors.push(
                    `Plaud API error: ${recordingsResponse.msg || "unexpected response format"}`,
                );
                break;
            }

            console.log(
                `[sync] page=${page} plaud_total=${recordingsResponse.data_file_total} fetched=${plaudRecordings.length} skip=${skip}`,
            );

            if (plaudRecordings.length === 0) {
                break;
            }

            for (const rec of plaudRecordings) {
                console.log(
                    `[sync]   file=${rec.id} name="${rec.filename}" start=${new Date(rec.start_time).toISOString()} trash=${rec.is_trash}`,
                );
            }

            for (
                let i = 0;
                i < plaudRecordings.length;
                i += SYNC_CONFIG.BATCH_CONCURRENCY
            ) {
                const batch = plaudRecordings.slice(
                    i,
                    i + SYNC_CONFIG.BATCH_CONCURRENCY,
                );
                const batchResult = await processBatch(
                    batch,
                    context,
                    plaudClient,
                    storage,
                );

                result.newRecordings += batchResult.newCount;
                result.updatedRecordings += batchResult.updatedCount;
                result.errors.push(...batchResult.errors);
                result.pendingTranscriptionIds.push(
                    ...batchResult.newRecordingIds,
                );
                allNewRecordingNames.push(...batchResult.newRecordingNames);
            }

            if (plaudRecordings.length < SYNC_CONFIG.PAGE_SIZE) {
                hasMore = false;
            } else if (
                result.newRecordings === 0 &&
                result.updatedRecordings === 0
            ) {
                consecutiveEmptyPages++;
                if (consecutiveEmptyPages >= 2) {
                    hasMore = false;
                }
            } else {
                consecutiveEmptyPages = 0;
            }

            page++;
        }

        const resolvedWorkspaceId = plaudClient.workspaceId;
        const workspaceIdChanged =
            !!resolvedWorkspaceId &&
            resolvedWorkspaceId !== connection.workspaceId;
        await db
            .update(plaudConnections)
            .set({
                lastSync: new Date(),
                ...(workspaceIdChanged
                    ? { workspaceId: resolvedWorkspaceId }
                    : {}),
            })
            .where(
                and(
                    eq(plaudConnections.id, connection.id),
                    eq(plaudConnections.userId, userId),
                ),
            );

        if (
            context.emailNotifications &&
            context.notificationEmail &&
            result.newRecordings > 0
        ) {
            try {
                await sendNewRecordingEmail(
                    context.notificationEmail,
                    result.newRecordings,
                    allNewRecordingNames,
                );
            } catch (error) {
                console.error("Failed to send email notification:", error);
                result.errors.push("Email notification failed");
            }
        }

        if (
            context.barkNotifications &&
            context.barkPushUrl &&
            result.newRecordings > 0
        ) {
            try {
                const success = await sendNewRecordingBarkNotification(
                    context.barkPushUrl,
                    result.newRecordings,
                    allNewRecordingNames,
                );
                if (!success) {
                    result.errors.push("Bark notification failed or timed out");
                }
            } catch (error) {
                console.error("Failed to send Bark notification:", error);
                result.errors.push("Bark notification failed");
            }
        }

        if (
            context.autoTranscribe &&
            result.pendingTranscriptionIds.length > 0
        ) {
            enqueueTranscriptionJobs(
                userId,
                result.pendingTranscriptionIds,
            ).catch((error) => {
                console.error(
                    "Failed to enqueue background transcriptions:",
                    error,
                );
            });
        }

        return result;
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        console.error("[sync] sync failed:", error);
        result.errors.push(`Sync failed: ${errorMessage}`);
        return result;
    }
}
