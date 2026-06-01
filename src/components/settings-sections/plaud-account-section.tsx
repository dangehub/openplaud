"use client";

import { CheckCircle2, Link2Off, Mic, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PlaudConnectTabs } from "@/components/plaud-connect-tabs";
import { SettingsSectionHeader } from "@/components/settings/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useTranslation } from "@/lib/i18n";
import { PLAUD_SERVERS, type PlaudServerKey } from "@/lib/plaud/servers";

interface ConnectionInfo {
    connected: boolean;
    server?: PlaudServerKey;
    plaudEmail?: string | null;
    createdAt?: string;
    updatedAt?: string;
    apiBase?: string;
}

/**
 * Short region label for the connection card. Falls back to the raw
 * apiBase for "custom" entries (custom-server users want to see exactly
 * which host they're talking to).
 */
function regionLabel(
    server: PlaudServerKey | undefined,
    apiBase?: string,
    isZh?: boolean,
): string {
    if (!server) return isZh ? "未知" : "Unknown";
    if (server === "custom") return apiBase ?? PLAUD_SERVERS.custom.label;
    if (server === "global") return isZh ? "全球服" : "Global";
    if (server === "eu") return isZh ? "欧盟服 (法兰克福)" : "EU (Frankfurt)";
    if (server === "apse1")
        return isZh ? "亚太服 (新加坡)" : "Asia Pacific (Singapore)";
    return server;
}

export function PlaudAccountSection() {
    const { locale } = useTranslation();
    const isZh = locale === "zh-CN";

    const [info, setInfo] = useState<ConnectionInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [confirmOpen, setConfirmOpen] = useState<
        null | "switch" | "disconnect"
    >(null);
    const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
    const [isMutating, setIsMutating] = useState(false);

    const fetchConnection = useCallback(async () => {
        try {
            const res = await fetch("/api/plaud/connection");
            if (!res.ok) {
                throw new Error(
                    await getApiErrorMessage(
                        res,
                        isZh ? "加载连接失败" : "Failed to load connection",
                    ),
                );
            }
            const data: ConnectionInfo = await res.json();
            setInfo(data);
        } catch (error) {
            console.error("Failed to load Plaud connection:", error);
            setInfo({ connected: false });
        } finally {
            setIsLoading(false);
        }
    }, [isZh]);

    useEffect(() => {
        fetchConnection();
    }, [fetchConnection]);

    const disconnect = useCallback(async (): Promise<boolean> => {
        const res = await fetch("/api/plaud/connection", { method: "DELETE" });
        if (!res.ok) {
            const msg = await getApiErrorMessage(
                res,
                isZh ? "断开连接失败" : "Failed to disconnect",
            );
            throw new Error(msg);
        }
        return true;
    }, [isZh]);

    const handleDisconnect = async () => {
        setIsMutating(true);
        try {
            await disconnect();
            toast.success(
                isZh ? "Plaud 账号已断开连接" : "Plaud account disconnected",
            );
            setConfirmOpen(null);
            await fetchConnection();
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : isZh
                      ? "断开连接失败"
                      : "Failed to disconnect",
            );
        } finally {
            setIsMutating(false);
        }
    };

    /**
     * Switch flow: explicitly delete the existing connection (and its
     * associated `plaud_devices` rows) before opening the connect dialog.
     * The verify / connect-token routes both upsert, so this isn't strictly
     * required for the connection row, but it prevents stale device rows
     * from the prior account lingering until the next sync rewrites them.
     * Recordings live in a separate table and are unaffected.
     */
    const handleSwitchConfirmed = async () => {
        setIsMutating(true);
        try {
            await disconnect();
            setConfirmOpen(null);
            setSwitchDialogOpen(true);
            // Reflect the unlinked state in the card while the dialog is open
            await fetchConnection();
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : isZh
                      ? "解除当前账号绑定失败"
                      : "Failed to unlink current account",
            );
        } finally {
            setIsMutating(false);
        }
    };

    const handleSwitchSuccess = useCallback(async () => {
        setSwitchDialogOpen(false);
        await fetchConnection();
    }, [fetchConnection]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    const currentEmail = info?.plaudEmail ?? null;
    const currentEmailDisplay =
        currentEmail ?? (isZh ? "当前账号" : "the current account");

    return (
        <div className="space-y-6">
            <div>
                <SettingsSectionHeader
                    title={isZh ? "Plaud 账号" : "Plaud Account"}
                    description={
                        isZh
                            ? "您用于从 Plaud 云端同步录音的账号连接。"
                            : "Your connection to the Plaud cloud used to pull recordings."
                    }
                    icon={Mic}
                />
                <p className="text-sm text-muted-foreground mt-1">
                    {isZh
                        ? "Riffado 从此 Plaud 账号同步录音。切换账号会保留您现有的录音，只有未来的同步会发生改变。"
                        : "The Plaud account Riffado pulls recordings from. Switching accounts keeps your existing recordings; only future syncs change."}
                </p>
            </div>

            {info?.connected ? (
                <Card className="py-4">
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                    {currentEmail ? (
                                        <span className="font-mono">
                                            {currentEmail}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            {isZh
                                                ? "已连接 (未获取到邮箱)"
                                                : "Connected (email unknown)"}
                                        </span>
                                    )}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {isZh ? "区域: " : "Region: "}{" "}
                                    {regionLabel(
                                        info.server,
                                        info.apiBase,
                                        isZh,
                                    )}
                                    {!currentEmail && (
                                        <>
                                            {" · "}
                                            <span>
                                                {isZh
                                                    ? "使用下方的“切换账号”可以显示邮箱"
                                                    : "Use “Switch account” below to display the email"}
                                            </span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setConfirmOpen("switch")}
                            >
                                <RefreshCw className="size-4 mr-2" />
                                {isZh ? "切换账号" : "Switch account"}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setConfirmOpen("disconnect")}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                <Link2Off className="size-4 mr-2" />
                                {isZh ? "断开连接" : "Disconnect"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="py-4">
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {isZh
                                ? "尚未连接 Plaud 账号。请在下方登录以开始同步录音。"
                                : "No Plaud account connected. Sign in below to start syncing recordings."}
                        </p>
                        <PlaudConnectTabs
                            onConnected={() => fetchConnection()}
                            variant="dialog"
                        />
                    </CardContent>
                </Card>
            )}

            {/* Confirm: switch or disconnect */}
            <Dialog
                open={confirmOpen !== null}
                onOpenChange={(open) => {
                    if (!open && !isMutating) setConfirmOpen(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {confirmOpen === "switch"
                                ? isZh
                                    ? "切换 Plaud 账号？"
                                    : "Switch Plaud account?"
                                : isZh
                                  ? "断开 Plaud 账号？"
                                  : "Disconnect Plaud account?"}
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="space-y-2 pt-2">
                                {confirmOpen === "switch" ? (
                                    <p>
                                        {isZh ? (
                                            <>
                                                这将解除与{" "}
                                                <span className="font-mono text-foreground">
                                                    {currentEmailDisplay}
                                                </span>{" "}
                                                的绑定，并允许您登录不同的 Plaud
                                                账号。您现有的录音将会保留；只有未来的同步会来自新账号。
                                            </>
                                        ) : (
                                            <>
                                                This will unlink{" "}
                                                <span className="font-mono text-foreground">
                                                    {currentEmailDisplay}
                                                </span>{" "}
                                                and let you sign in with a
                                                different Plaud account. Your
                                                existing recordings stay; only
                                                future syncs will come from the
                                                new account.
                                            </>
                                        )}
                                    </p>
                                ) : (
                                    <p>
                                        {isZh ? (
                                            <>
                                                这将解除与{" "}
                                                <span className="font-mono text-foreground">
                                                    {currentEmailDisplay}
                                                </span>{" "}
                                                的绑定。您的现有录音将会保留，但同步将会停止，直到您重新连接。
                                            </>
                                        ) : (
                                            <>
                                                This will unlink{" "}
                                                <span className="font-mono text-foreground">
                                                    {currentEmailDisplay}
                                                </span>
                                                . Your existing recordings stay,
                                                but sync will stop until you
                                                reconnect.
                                            </>
                                        )}
                                    </p>
                                )}
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setConfirmOpen(null)}
                            disabled={isMutating}
                        >
                            {isZh ? "取消" : "Cancel"}
                        </Button>
                        {confirmOpen === "switch" ? (
                            <Button
                                onClick={handleSwitchConfirmed}
                                disabled={isMutating}
                            >
                                {isMutating
                                    ? isZh
                                        ? "正在解绑..."
                                        : "Unlinking…"
                                    : isZh
                                      ? "继续"
                                      : "Continue"}
                            </Button>
                        ) : (
                            <Button
                                variant="destructive"
                                onClick={handleDisconnect}
                                disabled={isMutating}
                            >
                                {isMutating
                                    ? isZh
                                        ? "正在断开..."
                                        : "Disconnecting…"
                                    : isZh
                                      ? "断开连接"
                                      : "Disconnect"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Switch: connect dialog (full PlaudConnectTabs — connector,
                email-OTP, paste-token) */}
            <Dialog
                open={switchDialogOpen}
                onOpenChange={(open) => setSwitchDialogOpen(open)}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {isZh
                                ? "登录新的 Plaud 账号"
                                : "Sign in to new Plaud account"}
                        </DialogTitle>
                        <DialogDescription>
                            {isZh
                                ? "选择您希望用来连接新 Plaud 账号的方式。"
                                : "Choose how you want to connect the Plaud account you’re switching to."}
                        </DialogDescription>
                    </DialogHeader>
                    {switchDialogOpen && (
                        <PlaudConnectTabs
                            onConnected={handleSwitchSuccess}
                            variant="dialog"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
