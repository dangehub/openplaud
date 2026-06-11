import { and, eq, inArray, lte, or, type SQL, sql } from "drizzle-orm";
import { db } from "@/db";
import { recordings, transcriptionJobs } from "@/db/schema";

const JOB_LIMIT = 5;
const PER_USER_JOB_LIMIT = 2;
const PROCESSING_LEASE_MS = 15 * 60_000; // 15 minutes lease for long transcriptions

type QueryResultRows<T> = T[] | { rows: T[] };
type CandidateJobRow = { id: string };

export type ClaimedJob = {
    job: typeof transcriptionJobs.$inferSelect;
    recording: typeof recordings.$inferSelect;
};

function rowsFromQueryResult<T>(result: QueryResultRows<T>): T[] {
    return Array.isArray(result) ? result : result.rows;
}

function dueJobPredicate(now: Date): SQL {
    return or(
        and(
            eq(transcriptionJobs.status, "pending"),
            lte(transcriptionJobs.nextAttemptAt, now),
        ),
        and(
            eq(transcriptionJobs.status, "processing"),
            lte(transcriptionJobs.nextAttemptAt, now),
        ),
    ) as SQL;
}

export async function claimDueTranscriptionJobs(): Promise<ClaimedJob[]> {
    const now = new Date();
    const nowParam = sql`${now.toISOString()}::timestamp`;

    const candidateResult = await db.execute(sql`
        select id
        from (
            select
                ${transcriptionJobs.id} as id,
                ${transcriptionJobs.nextAttemptAt} as next_attempt_at,
                row_number() over (
                    partition by ${transcriptionJobs.userId}
                    order by ${transcriptionJobs.nextAttemptAt} asc, ${transcriptionJobs.id} asc
                ) as user_rank
            from ${transcriptionJobs}
            where (
                (${transcriptionJobs.status} = 'pending' and ${transcriptionJobs.nextAttemptAt} <= ${nowParam})
                or (${transcriptionJobs.status} = 'processing' and ${transcriptionJobs.nextAttemptAt} <= ${nowParam})
            )
        ) ranked_jobs
        where user_rank <= ${PER_USER_JOB_LIMIT}
        order by next_attempt_at asc, id asc
        limit ${JOB_LIMIT}
    `);

    const candidateRows = rowsFromQueryResult(
        candidateResult as unknown as QueryResultRows<CandidateJobRow>,
    );

    if (candidateRows.length === 0) return [];

    const ids = candidateRows.map((row) => row.id);
    const claimExpiresAt = new Date(now.getTime() + PROCESSING_LEASE_MS);
    const claimedRows = await db
        .update(transcriptionJobs)
        .set({
            status: "processing",
            nextAttemptAt: claimExpiresAt,
            updatedAt: now,
        })
        .where(and(inArray(transcriptionJobs.id, ids), dueJobPredicate(now)))
        .returning({ id: transcriptionJobs.id });

    const claimedIds = new Set(claimedRows.map((row) => row.id));
    if (claimedIds.size === 0) return [];

    const rows = await db
        .select({
            job: transcriptionJobs,
            recording: recordings,
        })
        .from(transcriptionJobs)
        .innerJoin(recordings, eq(recordings.id, transcriptionJobs.recordingId))
        .where(inArray(transcriptionJobs.id, Array.from(claimedIds)));

    const order = new Map(ids.map((id, index) => [id, index]));
    return rows.sort((a, b) => {
        return (
            (order.get(a.job.id) ?? Number.MAX_SAFE_INTEGER) -
            (order.get(b.job.id) ?? Number.MAX_SAFE_INTEGER)
        );
    });
}

export async function markJobCompleted(
    jobId: string,
    userId: string,
): Promise<void> {
    await db
        .update(transcriptionJobs)
        .set({
            status: "completed",
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(transcriptionJobs.id, jobId),
                eq(transcriptionJobs.userId, userId),
            ),
        );
}

export async function releaseOrFailJob(
    job: typeof transcriptionJobs.$inferSelect,
    errorMsg: string,
    maxRetries: number,
): Promise<void> {
    const now = new Date();
    const newAttempts = job.attempts + 1;

    if (newAttempts >= maxRetries) {
        // Mark as failed permanently
        await db
            .update(transcriptionJobs)
            .set({
                status: "failed",
                attempts: newAttempts,
                lastError: errorMsg,
                updatedAt: now,
            })
            .where(
                and(
                    eq(transcriptionJobs.id, job.id),
                    eq(transcriptionJobs.userId, job.userId),
                ),
            );
    } else {
        // Backoff: 30s, 2m, 10m
        const BACKOFF_MS = [30_000, 120_000, 600_000];
        const delay = BACKOFF_MS[Math.min(newAttempts, BACKOFF_MS.length) - 1];

        await db
            .update(transcriptionJobs)
            .set({
                status: "pending",
                attempts: newAttempts,
                nextAttemptAt: new Date(now.getTime() + delay),
                lastError: errorMsg,
                updatedAt: now,
            })
            .where(
                and(
                    eq(transcriptionJobs.id, job.id),
                    eq(transcriptionJobs.userId, job.userId),
                ),
            );
    }
}

export async function enqueueTranscriptionJobs(
    userId: string,
    recordingIds: string[],
): Promise<void> {
    if (recordingIds.length === 0) return;

    await db
        .insert(transcriptionJobs)
        .values(
            recordingIds.map((recordingId) => ({
                userId,
                recordingId,
                status: "pending",
                nextAttemptAt: new Date(),
            })),
        )
        .onConflictDoNothing({
            target: [transcriptionJobs.userId, transcriptionJobs.recordingId],
        });
}
