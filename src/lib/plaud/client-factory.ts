import { decrypt } from "@/lib/encryption";
import { DEFAULT_PLAUD_API_BASE, PlaudClient } from "./client";

/** Build a `PlaudClient` from an encrypted bearer token.
 *
 *  For CN-region connections that store a WT directly, pass
 *  `encryptedWorkspaceToken` to skip the UT→WT mint flow.
 */
export async function createPlaudClient(
    encryptedToken: string,
    apiBase: string = DEFAULT_PLAUD_API_BASE,
    workspaceId?: string | null,
    encryptedWorkspaceToken?: string | null,
): Promise<PlaudClient> {
    const bearerToken = decrypt(encryptedToken);
    const workspaceToken = encryptedWorkspaceToken
        ? decrypt(encryptedWorkspaceToken)
        : undefined;
    return new PlaudClient(
        bearerToken,
        apiBase,
        workspaceId ?? undefined,
        workspaceToken,
    );
}
