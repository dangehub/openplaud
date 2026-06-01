"use client";

import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

interface PlaudInfo {
    connected: boolean;
    reachable?: boolean;
    latencyMs?: number;
    error?: string | null;
    connection?: {
        id: string;
        apiBase: string;
        server: string;
        plaudEmail: string | null;
        createdAt: string;
        updatedAt: string;
    };
    stats?: {
        deviceCount: number | null;
        activeRecordingCount: number | null;
        trashedRecordingCount: number | null;
    };
}

export function DevSection() {
    const { locale } = useTranslation();
    const isZh = locale === "zh-CN";

    const [plaudInfo, setPlaudInfo] = useState<PlaudInfo | null>(null);
    const [isLoadingPlaud, setIsLoadingPlaud] = useState(false);

    const fetchPlaudInfo = async () => {
        setIsLoadingPlaud(true);
        try {
            const res = await fetch("/api/dev/plaud/info");
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || `HTTP ${res.status}`);
            }
            const data = (await res.json()) as PlaudInfo;
            setPlaudInfo(data);
            if (data.connected && data.reachable) {
                toast.success(
                    isZh
                        ? `已连接 Plaud 接口 (延迟 ${data.latencyMs}ms)`
                        : `Plaud reachable (${data.latencyMs}ms)`,
                );
            } else if (data.connected && !data.reachable) {
                toast.error(
                    isZh
                        ? `无法连接 Plaud 接口: ${data.error ?? "未知错误"}`
                        : `Plaud unreachable: ${data.error ?? "unknown"}`,
                );
            } else {
                toast.message(
                    isZh
                        ? "未检测到已存储的 Plaud 账号连接"
                        : "No Plaud connection stored",
                );
            }
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : isZh
                      ? "请求失败"
                      : "Request failed",
            );
        } finally {
            setIsLoadingPlaud(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                    {isZh ? "开发者调试工具" : "Developer Tools"}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {isZh
                        ? "仅在开发环境下可见的系统诊断工具，生产环境构建包将自动隐藏此菜单。"
                        : "Dev-only diagnostics. Not visible in production builds."}
                </p>
            </div>

            <section className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <h4 className="font-medium">
                            {isZh ? "Plaud 账号连接探测" : "Plaud connection"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            {isZh
                                ? "对当前已存储的 Plaud 令牌 (Bearer Token) 及接口进行请求测试，并反馈统计结果。"
                                : "Probe the stored bearer token against the stored API base and report counts."}
                        </p>
                    </div>
                    <Button
                        onClick={fetchPlaudInfo}
                        disabled={isLoadingPlaud}
                        size="sm"
                        variant="outline"
                    >
                        {isLoadingPlaud ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <RefreshCw className="size-4" />
                        )}
                        <span className="ml-2">
                            {isZh ? "开始探测" : "Probe"}
                        </span>
                    </Button>
                </div>

                {plaudInfo && (
                    <div className="space-y-2 text-sm">
                        {!plaudInfo.connected ? (
                            <p className="text-muted-foreground">
                                {isZh
                                    ? "当前用户未绑定任何 Plaud 账号。"
                                    : "No connection stored for this user."}
                            </p>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    {plaudInfo.reachable ? (
                                        <CheckCircle2 className="size-4 text-green-500" />
                                    ) : (
                                        <XCircle className="size-4 text-red-500" />
                                    )}
                                    <span>
                                        {plaudInfo.reachable
                                            ? isZh
                                                ? `网络延迟 ${plaudInfo.latencyMs}ms`
                                                : `Reachable in ${plaudInfo.latencyMs}ms`
                                            : isZh
                                              ? `无法连通: ${plaudInfo.error ?? "未知错误"}`
                                              : `Unreachable: ${plaudInfo.error ?? "unknown"}`}
                                    </span>
                                </div>
                                <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 font-mono text-xs">
                                    <dt className="text-muted-foreground">
                                        server (服务器)
                                    </dt>
                                    <dd>{plaudInfo.connection?.server}</dd>
                                    <dt className="text-muted-foreground">
                                        apiBase (接口地址)
                                    </dt>
                                    <dd className="break-all">
                                        {plaudInfo.connection?.apiBase}
                                    </dd>
                                    <dt className="text-muted-foreground">
                                        email (注册邮箱)
                                    </dt>
                                    <dd>
                                        {plaudInfo.connection?.plaudEmail ??
                                            "—"}
                                    </dd>
                                    <dt className="text-muted-foreground">
                                        devices (已绑定设备数)
                                    </dt>
                                    <dd>
                                        {plaudInfo.stats?.deviceCount ?? "—"}
                                    </dd>
                                    <dt className="text-muted-foreground">
                                        recordings (active - 活动录音)
                                    </dt>
                                    <dd>
                                        {plaudInfo.stats
                                            ?.activeRecordingCount ?? "—"}
                                    </dd>
                                    <dt className="text-muted-foreground">
                                        recordings (trash - 回收站录音)
                                    </dt>
                                    <dd>
                                        {plaudInfo.stats
                                            ?.trashedRecordingCount ?? "—"}
                                    </dd>
                                    <dt className="text-muted-foreground">
                                        updatedAt (更新时间)
                                    </dt>
                                    <dd>{plaudInfo.connection?.updatedAt}</dd>
                                </dl>
                            </>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}
