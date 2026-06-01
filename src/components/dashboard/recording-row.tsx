"use client";

import { Loader2, MoreHorizontal, Play, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime } from "@/lib/format-date";
import { formatDurationMs } from "@/lib/format-duration";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { DateTimeFormat } from "@/types/common";
import type { Recording } from "@/types/recording";

export function RecordingRow({
    recording,
    isSelected,
    inFlight,
    snippet,
    isCompact,
    rowPadding,
    dateTimeFormat,
    onSelect,
    onDelete,
    registerRef,
}: {
    recording: Recording;
    isSelected: boolean;
    inFlight: "transcribing" | "summarizing" | undefined;
    snippet: string | null;
    isCompact: boolean;
    rowPadding: string;
    dateTimeFormat: DateTimeFormat;
    onSelect: (recording: Recording) => void;
    onDelete: (recording: Recording) => Promise<void>;
    registerRef: (id: string, el: HTMLButtonElement | null) => void;
}) {
    const { t, locale } = useTranslation();
    const isZh = locale === "zh-CN";
    const confirm = useConfirm();

    return (
        <div
            className={cn(
                "group/row relative",
                isSelected
                    ? "bg-accent shadow-[inset_2px_0_0_0_var(--color-primary)]"
                    : null,
            )}
        >
            <button
                ref={(el) => {
                    registerRef(recording.id, el);
                }}
                type="button"
                onClick={() => onSelect(recording)}
                className={cn(
                    "w-full text-left transition-colors hover:bg-accent/60",
                    rowPadding,
                )}
            >
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-medium">
                            {recording.filename}
                        </h3>
                        {inFlight && (
                            <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-[11px] text-primary">
                                <Loader2
                                    className="size-3 animate-spin"
                                    aria-hidden="true"
                                />
                                {inFlight === "transcribing"
                                    ? isZh
                                        ? "转录中"
                                        : "Transcribing"
                                    : isZh
                                      ? "总结中"
                                      : "Summarizing"}
                            </span>
                        )}
                    </div>
                    {snippet ? (
                        <p
                            className={cn(
                                "truncate text-xs text-muted-foreground",
                                isCompact ? "mt-0.5" : "mt-1",
                            )}
                        >
                            {snippet}
                        </p>
                    ) : (
                        <p
                            className={cn(
                                "text-xs text-muted-foreground",
                                isCompact ? "mt-0.5" : "mt-1",
                            )}
                        >
                            {formatDurationMs(recording.duration)}
                            {" \u00b7 "}
                            {formatDateTime(
                                recording.startTime,
                                dateTimeFormat,
                            )}
                        </p>
                    )}
                </div>
            </button>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100 has-[[data-state=open]]:opacity-100">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={isZh ? "行操作" : "Row actions"}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreHorizontal className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onSelect(recording)}>
                            <Play />
                            {isZh ? "打开" : "Open"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant="destructive"
                            onSelect={(e) => {
                                e.preventDefault();
                                void confirm({
                                    title: isZh
                                        ? "删除此录音？"
                                        : "Delete this recording?",
                                    description: (
                                        <>
                                            <span className="font-medium text-foreground">
                                                {recording.filename}
                                            </span>
                                            <br />
                                            {isZh
                                                ? "该音频文件及关联的转录和总结将被删除。如果该文件仍在 Plaud 设备上，下一次同步时将会重新下载它。"
                                                : "The audio file and any transcript or summary will be removed. If the file is still on your Plaud device, the next sync will re-download it."}
                                        </>
                                    ),
                                    confirmLabel: t("common.delete"),
                                    pendingLabel: isZh
                                        ? "正在删除..."
                                        : "Deleting…",
                                    destructive: true,
                                    onConfirm: () => onDelete(recording),
                                });
                            }}
                        >
                            <Trash2 />
                            {t("common.delete")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
