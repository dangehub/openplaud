import { AppError, ErrorCode } from "@/lib/errors";
import { plaudFetch } from "./fetch";
import { safeParseJson } from "./parse";
import { PLAUD_USER_AGENT } from "./servers";

interface WsRefreshResponse {
    status: number;
    msg: string;
    data?: {
        workspace_token?: string;
        refresh_token?: string;
        expires_in?: number;
        refresh_expires_in?: number;
    };
}

/** Refresh a workspace token using the workspace refresh token (WRT).
 *
 *  CN-region Plaud accounts issue short-lived WTs (24h) with a ~30-day WRT.
 *  This function exchanges the WRT for a fresh WT + WRT pair.
 */
export async function refreshWorkspaceToken(
    wsRefreshToken: string,
    workspaceId: string,
    apiBase: string,
): Promise<{
    workspaceToken: string;
    refreshToken: string;
    expiresAt: Date;
    refreshExpiresAt: Date;
}> {
    const url = `${apiBase}/user-app/auth/workspace/refresh/${encodeURIComponent(workspaceId)}`;

    const res = await plaudFetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${wsRefreshToken}`,
            "Content-Type": "application/json",
            "User-Agent": PLAUD_USER_AGENT,
        },
        body: "{}",
    });

    const textBody = await res.text();
    console.error(`[sync] workspace refresh response: HTTP ${res.status} body: ${textBody}`);
    let body;
    try {
        body = JSON.parse(textBody) as WsRefreshResponse;
    } catch {
        body = {} as WsRefreshResponse;
    }

    if (!res.ok) {
        if (res.status === 401) {
            throw new AppError(
                ErrorCode.PLAUD_INVALID_TOKEN,
                "Workspace refresh token expired. Please reconnect your Plaud account.",
                401,
                { plaudStatus: res.status },
            );
        }
        throw new AppError(
            res.status >= 500
                ? ErrorCode.PLAUD_UPSTREAM_ERROR
                : ErrorCode.PLAUD_API_ERROR,
            "Failed to refresh workspace token",
            res.status >= 500 ? 502 : 400,
            { plaudStatus: res.status },
        );
    }

    if (body.status === -420) {
        throw new AppError(
            ErrorCode.PLAUD_INVALID_TOKEN,
            "Workspace refresh token expired. Please reconnect your Plaud account.",
            401,
            { plaudStatus: body.status },
        );
    }

    if (
        body.status !== 0 ||
        !body.data?.workspace_token ||
        !body.data?.refresh_token
    ) {
        throw new AppError(
            ErrorCode.PLAUD_API_ERROR,
            body.msg || "Failed to refresh workspace token",
            400,
            { plaudStatus: body.status },
        );
    }

    const now = Date.now();
    const expiresAt = new Date(now + (body.data.expires_in ?? 86400) * 1000);
    const refreshExpiresAt = new Date(
        now + (body.data.refresh_expires_in ?? 30 * 86400) * 1000,
    );

    return {
        workspaceToken: body.data.workspace_token,
        refreshToken: body.data.refresh_token,
        expiresAt,
        refreshExpiresAt,
    };
}

/** Check whether a workspace token needs refreshing (expired or within 5 min). */
export function shouldRefreshWsToken(expiresAt: Date | null): boolean {
    if (!expiresAt) return false;
    const MARGIN_MS = 5 * 60 * 1000; // 5 minutes
    return Date.now() + MARGIN_MS >= expiresAt.getTime();
}
