import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { recordings } from "@/db/schema";
import { requireApiSession } from "@/lib/auth-server";
import { AppError, apiHandler, ErrorCode } from "@/lib/errors";
import { emitEvent, isWebhookEvent } from "@/lib/webhooks/emit";

type IdContext = { params: Promise<{ id: string }> };

/**
 * Manually trigger a webhook event for a recording.
 * Useful for debugging webhook integrations without waiting
 * for an actual sync/transcription cycle.
 */
export const POST = apiHandler<IdContext>(async (request, context) => {
    const session = await requireApiSession(request);
    const { id } = await (context as IdContext).params;
    const userId = session.user.id;

    const body = (await request.json()) as { event?: string };
    const event = body.event;

    if (!event || !isWebhookEvent(event)) {
        throw new AppError(
            ErrorCode.INVALID_INPUT,
            `Invalid webhook event. Must be one of: recording.synced, recording.updated, transcription.completed, transcription.failed, summary.completed, summary.failed`,
            400,
        );
    }

    // recording.deleted is excluded — it requires actual deletion logic
    if (event === "recording.deleted") {
        throw new AppError(
            ErrorCode.INVALID_INPUT,
            "Cannot manually trigger recording.deleted — use the delete endpoint instead",
            400,
        );
    }

    const [recording] = await db
        .select({ id: recordings.id })
        .from(recordings)
        .where(
            and(
                eq(recordings.id, id),
                eq(recordings.userId, userId),
                isNull(recordings.deletedAt),
            ),
        )
        .limit(1);

    if (!recording) {
        throw new AppError(
            ErrorCode.RECORDING_NOT_FOUND,
            "Recording not found",
            404,
        );
    }

    await emitEvent(event, userId, id);

    return NextResponse.json({ success: true });
});
