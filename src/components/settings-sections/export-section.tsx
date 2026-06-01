"use client";

import { Download, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsSectionHeader } from "@/components/settings/section-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/use-settings";
import { useTranslation } from "@/lib/i18n";

const exportFormatOptions = [
    { label: "JSON", value: "json", description: "Structured data format" },
    { label: "TXT", value: "txt", description: "Plain text format" },
    { label: "SRT", value: "srt", description: "Subtitle format" },
    { label: "VTT", value: "vtt", description: "WebVTT subtitle format" },
];

const backupFrequencyOptions = [
    { label: "Never", value: "never" },
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
];

interface ExportSectionProps {
    onReRunOnboarding?: () => void;
}

export function ExportSection({ onReRunOnboarding }: ExportSectionProps) {
    const { locale } = useTranslation();
    const isZh = locale === "zh-CN";

    const getExportFormatDescription = (value: string) => {
        if (!isZh) {
            return (
                exportFormatOptions.find((opt) => opt.value === value)
                    ?.description || ""
            );
        }
        switch (value) {
            case "json":
                return "结构化数据格式";
            case "txt":
                return "纯文本格式";
            case "srt":
                return "SRT 字幕格式";
            case "vtt":
                return "WebVTT 字幕格式";
            default:
                return "";
        }
    };

    const getBackupFrequencyLabel = (value: string) => {
        if (!isZh) {
            return (
                backupFrequencyOptions.find((opt) => opt.value === value)
                    ?.label || "Never"
            );
        }
        switch (value) {
            case "never":
                return "从不";
            case "daily":
                return "每天";
            case "weekly":
                return "每周";
            case "monthly":
                return "每月";
            default:
                return "从不";
        }
    };

    const { isLoadingSettings, isSavingSettings, setIsLoadingSettings } =
        useSettings();
    const [defaultExportFormat, setDefaultExportFormat] = useState("json");
    const [autoExport, setAutoExport] = useState(false);
    const [backupFrequency, setBackupFrequency] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/settings/user");
                if (response.ok) {
                    const data = await response.json();
                    setDefaultExportFormat(data.defaultExportFormat ?? "json");
                    setAutoExport(data.autoExport ?? false);
                    setBackupFrequency(data.backupFrequency ?? null);
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            } finally {
                setIsLoadingSettings(false);
            }
        };
        fetchSettings();
    }, [setIsLoadingSettings]);

    const handleExportBackupSettingChange = async (updates: {
        defaultExportFormat?: string;
        autoExport?: boolean;
        backupFrequency?: string | null;
    }) => {
        const previousValues: Record<string, unknown> = {};
        if (updates.defaultExportFormat !== undefined) {
            previousValues.defaultExportFormat = defaultExportFormat;
            setDefaultExportFormat(updates.defaultExportFormat);
        }
        if (updates.autoExport !== undefined) {
            previousValues.autoExport = autoExport;
            setAutoExport(updates.autoExport);
        }
        if (updates.backupFrequency !== undefined) {
            previousValues.backupFrequency = backupFrequency;
            setBackupFrequency(updates.backupFrequency);
        }

        try {
            const response = await fetch("/api/settings/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                throw new Error("Failed to save settings");
            }
        } catch {
            if (updates.defaultExportFormat !== undefined) {
                const prev = previousValues.defaultExportFormat;
                if (typeof prev === "string") setDefaultExportFormat(prev);
            }
            if (updates.autoExport !== undefined) {
                const prev = previousValues.autoExport;
                if (typeof prev === "boolean") setAutoExport(prev);
            }
            if (updates.backupFrequency !== undefined) {
                const prev = previousValues.backupFrequency;
                if (typeof prev === "string" || prev === null)
                    setBackupFrequency(prev);
            }
            toast.error(
                isZh
                    ? "保存设置失败。更改已撤销。"
                    : "Failed to save settings. Changes reverted.",
            );
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await fetch(
                `/api/export?format=${defaultExportFormat}`,
            );
            if (!response.ok) throw new Error("Export failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download =
                response.headers
                    .get("Content-Disposition")
                    ?.split("filename=")[1]
                    ?.replace(/"/g, "") || `export.${defaultExportFormat}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success(isZh ? "数据导出已完成" : "Export completed");
        } catch {
            toast.error(
                isZh ? "导出录音数据失败" : "Failed to export recordings",
            );
        } finally {
            setIsExporting(false);
        }
    };

    const handleBackup = async () => {
        setIsBackingUp(true);
        try {
            const response = await fetch("/api/backup", { method: "POST" });
            if (!response.ok) throw new Error("Backup failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download =
                response.headers
                    .get("Content-Disposition")
                    ?.split("filename=")[1]
                    ?.replace(/"/g, "") || "backup.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success(isZh ? "系统备份已创建" : "Backup created");
        } catch {
            toast.error(isZh ? "创建系统备份失败" : "Failed to create backup");
        } finally {
            setIsBackingUp(false);
        }
    };

    if (isLoadingSettings) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SettingsSectionHeader
                title={isZh ? "数据导出与备份" : "Export & Backup"}
                description={
                    isZh
                        ? "导出您的全部数据 — 包括录音文件、转写文本以及 AI 大纲总结。"
                        : "Take your data with you — recordings, transcripts, and summaries."
                }
                icon={Download}
            />
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="export-format">
                        {isZh ? "默认导出格式" : "Default export format"}
                    </Label>
                    <Select
                        value={defaultExportFormat}
                        onValueChange={(value) => {
                            setDefaultExportFormat(value);
                            handleExportBackupSettingChange({
                                defaultExportFormat: value,
                            });
                        }}
                        disabled={isSavingSettings}
                    >
                        <SelectTrigger id="export-format" className="w-full">
                            <SelectValue>
                                {defaultExportFormat.toUpperCase()}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {exportFormatOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    <div>
                                        <div>{option.label}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {getExportFormatDescription(
                                                option.value,
                                            )}
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between opacity-60">
                    <div className="space-y-0.5 flex-1">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="auto-export" className="text-base">
                                {isZh
                                    ? "新录音自动导出"
                                    : "Auto-export new recordings"}
                            </Label>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                {isZh ? "即将上线" : "Coming soon"}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {isZh
                                ? "在录音同步完成时自动导出到指定格式"
                                : "Automatically export recordings when they are synced"}
                        </p>
                    </div>
                    <Switch
                        id="auto-export"
                        checked={autoExport}
                        onCheckedChange={(checked) => {
                            setAutoExport(checked);
                            handleExportBackupSettingChange({
                                autoExport: checked,
                            });
                        }}
                        disabled={true}
                    />
                </div>

                <div className="space-y-2 opacity-60">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="backup-frequency">
                            {isZh ? "自动备份频率" : "Backup frequency"}
                        </Label>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                            {isZh ? "即将上线" : "Coming soon"}
                        </span>
                    </div>
                    <Select
                        value={backupFrequency || "never"}
                        onValueChange={(value) => {
                            const frequency = value === "never" ? null : value;
                            setBackupFrequency(frequency);
                            handleExportBackupSettingChange({
                                backupFrequency: frequency,
                            });
                        }}
                        disabled={true}
                    >
                        <SelectTrigger id="backup-frequency" className="w-full">
                            <SelectValue>
                                {getBackupFrequencyLabel(
                                    backupFrequency || "never",
                                )}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {backupFrequencyOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {getBackupFrequencyLabel(option.value)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        {isZh
                            ? "自动创建系统备份的频率间隔"
                            : "How often to automatically create backups"}
                    </p>
                </div>
            </div>

            <div className="pt-4 border-t space-y-3">
                <div className="space-y-2">
                    <Label className="text-base">
                        {isZh ? "手动操作" : "Manual Actions"}
                    </Label>
                    <Button
                        onClick={async () => {
                            try {
                                await fetch("/api/settings/user", {
                                    method: "PUT",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        onboardingCompleted: false,
                                    }),
                                });
                                onReRunOnboarding?.();
                            } catch {
                                toast.error(
                                    isZh
                                        ? "重置新手引导失败"
                                        : "Failed to reset onboarding",
                                );
                            }
                        }}
                        variant="outline"
                        className="w-full"
                    >
                        <RefreshCw className="size-4 mr-2" />
                        {isZh ? "重新运行新手引导" : "Re-run Onboarding"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        {isZh
                            ? "重置引导流程，在您下一次访问时将重新展现引导卡片"
                            : "Reset onboarding to see it again on your next visit"}
                    </p>
                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={handleExport}
                            disabled={isExporting}
                            variant="outline"
                            className="flex-1"
                        >
                            {isExporting ? (
                                <>
                                    <div className="animate-spin size-4 mr-2 border-2 border-primary border-t-transparent rounded-full" />
                                    {isZh ? "正在导出..." : "Exporting…"}
                                </>
                            ) : (
                                <>
                                    <Download className="size-4 mr-2" />
                                    {isZh ? "导出全部数据" : "Export All"}
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={handleBackup}
                            disabled={isBackingUp}
                            variant="outline"
                            className="flex-1"
                        >
                            {isBackingUp ? (
                                <>
                                    <div className="animate-spin size-4 mr-2 border-2 border-primary border-t-transparent rounded-full" />
                                    {isZh ? "正在创建..." : "Creating…"}
                                </>
                            ) : (
                                <>
                                    <Download className="size-4 mr-2" />
                                    {isZh ? "创建系统备份" : "Create Backup"}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
