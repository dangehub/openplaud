"use client";

import { useId } from "react";
import { formatBytes } from "@/lib/format-bytes";
import { formatHoursCompact } from "@/lib/format-duration";
import { useTranslation } from "@/lib/i18n";

interface UsageHeroProps {
    usedBytes: number;
    recordingCount: number;
    totalDurationMs: number;
    /** Free space on the host disk. Only set for self-host + local. */
    diskFreeBytes: number | null;
    /**
     * Reserved seam for per-account quotas. Always null today. When set,
     * takes precedence over `diskFreeBytes` so the ring reflects the
     * account-level cap rather than the host's filesystem capacity.
     */
    quotaBytes: number | null;
}

export function UsageHero({
    usedBytes,
    recordingCount,
    totalDurationMs,
    diskFreeBytes,
    quotaBytes,
}: UsageHeroProps) {
    const { locale } = useTranslation();
    const isZh = locale === "zh-CN";

    const avgBytes =
        recordingCount > 0 ? Math.round(usedBytes / recordingCount) : 0;

    let capacity: {
        used: number;
        total: number;
        remainingLabel: string;
    } | null = null;
    if (typeof quotaBytes === "number" && quotaBytes > 0) {
        capacity = {
            used: usedBytes,
            total: quotaBytes,
            remainingLabel: `${formatBytes(Math.max(0, quotaBytes - usedBytes))} ${isZh ? "剩余" : "remaining"}`,
        };
    } else if (typeof diskFreeBytes === "number" && diskFreeBytes >= 0) {
        capacity = {
            used: usedBytes,
            total: usedBytes + diskFreeBytes,
            remainingLabel: isZh
                ? `磁盘可用空间 ${formatBytes(diskFreeBytes)}`
                : `${formatBytes(diskFreeBytes)} free on disk`,
        };
    }

    return (
        <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-5">
                {capacity ? (
                    <CapacityRing
                        used={capacity.used}
                        total={capacity.total}
                        usedBytes={usedBytes}
                        isZh={isZh}
                    />
                ) : (
                    <div className="text-4xl font-semibold tabular-nums">
                        {formatBytes(usedBytes)}
                    </div>
                )}
                <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        {isZh ? "已用存储空间" : "Storage used"}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                        {isZh ? (
                            <>共 {recordingCount.toLocaleString()} 条录音</>
                        ) : (
                            <>
                                {recordingCount.toLocaleString()}{" "}
                                {recordingCount === 1
                                    ? "recording"
                                    : "recordings"}
                            </>
                        )}
                        {totalDurationMs > 0 && (
                            <>
                                {" · "}
                                {isZh ? "总时长 " : ""}
                                {formatHoursCompact(totalDurationMs)}
                                {isZh ? "" : " total"}
                            </>
                        )}
                        {avgBytes > 0 && (
                            <>
                                {" · "}
                                {isZh ? "单条平均 " : ""}
                                {formatBytes(avgBytes)}
                                {isZh ? "" : " avg"}
                            </>
                        )}
                    </div>
                    {capacity && (
                        <div className="mt-1 text-xs text-muted-foreground tabular-nums">
                            {capacity.remainingLabel}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface CapacityRingProps {
    used: number;
    total: number;
    /**
     * Pre-computed because the parent already needs `usedBytes` for
     * other captions; passing it down avoids re-formatting and keeps
     * the ring's center label in sync with the hero's main number.
     */
    usedBytes: number;
    isZh: boolean;
}

function CapacityRing({ used, total, usedBytes, isZh }: CapacityRingProps) {
    const id = useId();
    const pct = Math.min(1, Math.max(0, total > 0 ? used / total : 0));
    const size = 132;
    const stroke = 10;
    const r = (size - stroke) / 2;
    const circumference = 2 * Math.PI * r;
    const offset = circumference * (1 - pct);
    const pctLabel = `${Math.round(pct * 100)}%`;

    return (
        <div
            className="relative shrink-0"
            style={{ width: size, height: size }}
        >
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                role="img"
                aria-labelledby={`${id}-title`}
            >
                <title id={`${id}-title`}>
                    {isZh
                        ? `存储容量: 已使用 ${pctLabel}`
                        : `Storage capacity: ${pctLabel} used`}
                </title>
                {/* Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    strokeWidth={stroke}
                    className="stroke-muted"
                />
                {/* Filled arc */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    className="stroke-primary transition-[stroke-dashoffset] duration-500"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xl font-semibold tabular-nums leading-tight">
                    {formatBytes(usedBytes)}
                </div>
                <div className="text-[11px] text-muted-foreground tabular-nums">
                    {pctLabel} {isZh ? "已用" : "used"}
                </div>
            </div>
        </div>
    );
}
