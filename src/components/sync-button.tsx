"use client";

import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Compact relative-time string for the sync button label.
 */
function compactAgo(from: Date, locale: string): string {
    const ts = from.getTime();
    if (!Number.isFinite(ts)) return "";
    const diffMs = Date.now() - ts;
    const isZh = locale === "zh-CN";
    if (diffMs < 0) return isZh ? "刚刚" : "just now";
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return isZh ? "刚刚" : "just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return isZh ? `${min}分钟前` : `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return isZh ? `${hr}小时前` : `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return isZh ? `${day}天前` : `${day}d ago`;
    const wk = Math.floor(day / 7);
    return isZh ? `${wk}周前` : `${wk}w ago`;
}

interface SyncButtonProps {
    lastSyncTime: Date | null;
    nextSyncTime: Date | null;
    isAutoSyncing: boolean;
    lastSyncResult: {
        success: boolean;
        newRecordings?: number;
        error?: string;
    } | null;
    onSync: () => void;
    className?: string;
}

export function SyncButton({
    lastSyncTime,
    nextSyncTime,
    isAutoSyncing,
    lastSyncResult,
    onSync,
    className,
}: SyncButtonProps) {
    const { locale } = useTranslation();
    const isZh = locale === "zh-CN";
    const failed = !isAutoSyncing && lastSyncResult?.success === false;

    const label = (() => {
        if (isAutoSyncing) return isZh ? "同步中..." : "Syncing...";
        if (failed) return isZh ? "重试同步" : "Retry sync";
        if (lastSyncTime) {
            try {
                return isZh
                    ? `已同步于${compactAgo(lastSyncTime, locale)}`
                    : `Synced ${compactAgo(lastSyncTime, locale)}`;
            } catch {
                return isZh ? "刚刚已同步" : "Synced recently";
            }
        }
        return isZh ? "同步设备" : "Sync device";
    })();

    const title = (() => {
        const parts: string[] = [];
        if (failed && lastSyncResult?.error) {
            parts.push(lastSyncResult.error);
        }
        if (!isAutoSyncing && nextSyncTime) {
            try {
                const diff = nextSyncTime.getTime() - Date.now();
                if (diff < 60000) {
                    parts.push(isZh ? "即将自动同步" : "Next auto-sync soon");
                } else {
                    const formattedDist = formatDistanceToNow(nextSyncTime, {
                        addSuffix: true,
                        locale: isZh ? zhCN : undefined,
                    });
                    parts.push(
                        isZh
                            ? `下次自动同步于${formattedDist}`
                            : `Next auto-sync ${formattedDist}`,
                    );
                }
            } catch {
                // Ignore
            }
        }
        parts.push(
            isAutoSyncing
                ? isZh
                    ? "同步进行中"
                    : "Sync in progress"
                : isZh
                  ? "点击立即同步"
                  : "Click to sync now",
        );
        return parts.join(" \u00b7 ");
    })();

    const ariaLabel = isAutoSyncing
        ? isZh
            ? "正在同步设备"
            : "Syncing device"
        : failed
          ? isZh
              ? "重试同步"
              : "Retry sync"
          : isZh
            ? "同步设备"
            : "Sync device";

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    onClick={onSync}
                    disabled={isAutoSyncing}
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-9",
                        failed &&
                            "border-destructive/40 text-destructive hover:bg-destructive/10",
                        className,
                    )}
                    aria-label={ariaLabel}
                >
                    {failed ? (
                        <AlertCircle
                            className="size-4 sm:mr-2"
                            aria-hidden="true"
                        />
                    ) : (
                        <RefreshCw
                            className={cn(
                                "size-4 sm:mr-2",
                                isAutoSyncing && "animate-spin",
                            )}
                            aria-hidden="true"
                        />
                    )}
                    <span className="hidden sm:inline">{label}</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{title}</TooltipContent>
        </Tooltip>
    );
}
