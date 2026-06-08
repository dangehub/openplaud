import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth-server";
import { apiHandler } from "@/lib/errors";
import { enforcePlaudSyncRateLimit } from "@/lib/plaud/sync-rate-limit";
import { syncRecordingsForUser } from "@/lib/sync/sync-recordings";

export const POST = apiHandler(async (request: Request) => {
    console.log("[sync-route] POST /api/plaud/sync received");
    const session = await requireApiSession(request);
    console.log(`[sync-route] authenticated user=${session.user.id}`);

    const limited = await enforcePlaudSyncRateLimit(session.user.id);
    if (limited) {
        console.log("[sync-route] rate limited, returning 429");
        return limited;
    }

    const result = await syncRecordingsForUser(session.user.id);
    console.log(
        `[sync-route] done new=${result.newRecordings} updated=${result.updatedRecordings} errors=${JSON.stringify(result.errors)} inProgress=${result.inProgress}`,
    );

    return NextResponse.json({
        success: true,
        newRecordings: result.newRecordings,
        updatedRecordings: result.updatedRecordings,
        errors: result.errors,
        inProgress: result.inProgress,
    });
});
