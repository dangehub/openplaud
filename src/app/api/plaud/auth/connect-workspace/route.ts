import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth-server";
import { AppError, apiHandler, ErrorCode } from "@/lib/errors";
import { fetchPlaudUserMeEmail } from "@/lib/plaud/auth";
import { persistPlaudWorkspaceConnection } from "@/lib/plaud/persist-connection";
import { isValidPlaudApiUrl } from "@/lib/plaud/servers";

export const POST = apiHandler(async (request: Request) => {
    const session = await requireApiSession(request);

    const body = (await request.json().catch(() => null)) as {
        workspaceData?: unknown;
        source?: unknown;
    } | null;

    if (!body || typeof body.workspaceData !== "string") {
        throw new AppError(
            ErrorCode.MISSING_REQUIRED_FIELD,
            "workspaceData is required",
            400,
            { field: "workspaceData" },
        );
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(body.workspaceData);
    } catch {
        throw new AppError(
            ErrorCode.INVALID_INPUT,
            "Invalid workspace data format. Expected JSON string from console export.",
            400,
            { field: "workspaceData" },
        );
    }

    if (!parsed || typeof parsed !== "object") {
        throw new AppError(
            ErrorCode.INVALID_INPUT,
            "Invalid workspace data format. Expected a JSON object.",
            400,
            { field: "workspaceData" },
        );
    }

    const { workspaceToken, refreshToken, expiresAt, workspaceId, domain } =
        parsed as Record<string, unknown>;

    if (
        typeof workspaceToken !== "string" ||
        typeof refreshToken !== "string" ||
        typeof expiresAt !== "number" ||
        typeof workspaceId !== "string"
    ) {
        throw new AppError(
            ErrorCode.INVALID_INPUT,
            "Parsed JSON is missing required fields (workspaceToken, refreshToken, expiresAt, workspaceId).",
            400,
            { field: "workspaceData" },
        );
    }

    const apiBaseRaw =
        typeof domain === "string" && domain.trim().length > 0
            ? domain.trim().replace(/\/+$/, "")
            : "https://api.plaud.cn";

    if (!isValidPlaudApiUrl(apiBaseRaw)) {
        throw new AppError(
            ErrorCode.PLAUD_INVALID_API_BASE,
            "Invalid API base from workspace data",
            400,
        );
    }

    // Best-effort email enrichment
    const plaudEmail = await fetchPlaudUserMeEmail(workspaceToken, apiBaseRaw);

    const source = typeof body.source === "string" ? body.source : "unknown";
    console.log(
        `[plaud/connect-workspace] persisting connection (source=${source}, apiBase=${apiBaseRaw})`,
    );

    const { devices } = await persistPlaudWorkspaceConnection({
        userId: session.user.id,
        workspaceToken,
        refreshToken,
        expiresAt: new Date(expiresAt),
        workspaceId,
        apiBase: apiBaseRaw,
        plaudEmail,
    });

    return NextResponse.json({
        success: true,
        devices,
    });
});
