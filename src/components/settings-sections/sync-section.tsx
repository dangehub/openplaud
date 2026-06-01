"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsSectionHeader } from "@/components/settings/section-header";
import { SettingsCard } from "@/components/settings/settings-card";
import { ToggleRow } from "@/components/settings/toggle-row";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/hooks/use-settings";
import { useTranslation } from "@/lib/i18n";

const syncIntervalPresets = [
    { label: "1 minute", value: 60 * 1000 },
    { label: "2 minutes", value: 2 * 60 * 1000 },
    { label: "5 minutes", value: 5 * 60 * 1000 },
    { label: "10 minutes", value: 10 * 60 * 1000 },
    { label: "15 minutes", value: 15 * 60 * 1000 },
    { label: "30 minutes", value: 30 * 60 * 1000 },
    { label: "1 hour", value: 60 * 60 * 1000 },
];

const getSyncIntervalLabel = (value: number, isZh: boolean) => {
    const preset = syncIntervalPresets.find((p) => p.value === value);
    if (!preset) return isZh ? "自定义" : "Custom";
    if (!isZh) return preset.label;

    switch (preset.value) {
        case 60 * 1000:
            return "1 分钟";
        case 2 * 60 * 1000:
            return "2 分钟";
        case 5 * 60 * 1000:
            return "5 分钟";
        case 10 * 60 * 1000:
            return "10 分钟";
        case 15 * 60 * 1000:
            return "15 分钟";
        case 30 * 60 * 1000:
            return "30 分钟";
        case 60 * 60 * 1000:
            return "1 小时";
        default:
            return preset.label;
    }
};

export function SyncSection() {
    const { locale } = useTranslation();
    const isZh = locale === "zh-CN";

    const { isLoadingSettings, isSavingSettings, setIsLoadingSettings } =
        useSettings();
    const [syncInterval, setSyncInterval] = useState(300000);
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
    const [syncOnMount, setSyncOnMount] = useState(true);
    const [syncOnVisibilityChange, setSyncOnVisibilityChange] = useState(true);
    const [syncNotifications, setSyncNotifications] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/settings/user");
                if (response.ok) {
                    const data = await response.json();
                    setSyncInterval(data.syncInterval ?? 300000);
                    setAutoSyncEnabled(data.autoSyncEnabled ?? true);
                    setSyncOnMount(data.syncOnMount ?? true);
                    setSyncOnVisibilityChange(
                        data.syncOnVisibilityChange ?? true,
                    );
                    setSyncNotifications(data.syncNotifications ?? true);
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            } finally {
                setIsLoadingSettings(false);
            }
        };
        fetchSettings();
    }, [setIsLoadingSettings]);

    const handleSyncSettingChange = async (updates: {
        syncInterval?: number;
        autoSyncEnabled?: boolean;
        syncOnMount?: boolean;
        syncOnVisibilityChange?: boolean;
        syncNotifications?: boolean;
    }) => {
        const previousValues: Record<string, unknown> = {};
        if (updates.syncInterval !== undefined) {
            previousValues.syncInterval = syncInterval;
            setSyncInterval(updates.syncInterval);
        }
        if (updates.autoSyncEnabled !== undefined) {
            previousValues.autoSyncEnabled = autoSyncEnabled;
            setAutoSyncEnabled(updates.autoSyncEnabled);
        }
        if (updates.syncOnMount !== undefined) {
            previousValues.syncOnMount = syncOnMount;
            setSyncOnMount(updates.syncOnMount);
        }
        if (updates.syncOnVisibilityChange !== undefined) {
            previousValues.syncOnVisibilityChange = syncOnVisibilityChange;
            setSyncOnVisibilityChange(updates.syncOnVisibilityChange);
        }
        if (updates.syncNotifications !== undefined) {
            previousValues.syncNotifications = syncNotifications;
            setSyncNotifications(updates.syncNotifications);
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
            if (updates.syncInterval !== undefined) {
                const prev = previousValues.syncInterval;
                if (typeof prev === "number") setSyncInterval(prev);
            }
            if (updates.autoSyncEnabled !== undefined) {
                const prev = previousValues.autoSyncEnabled;
                if (typeof prev === "boolean") setAutoSyncEnabled(prev);
            }
            if (updates.syncOnMount !== undefined) {
                const prev = previousValues.syncOnMount;
                if (typeof prev === "boolean") setSyncOnMount(prev);
            }
            if (updates.syncOnVisibilityChange !== undefined) {
                const prev = previousValues.syncOnVisibilityChange;
                if (typeof prev === "boolean") setSyncOnVisibilityChange(prev);
            }
            if (updates.syncNotifications !== undefined) {
                const prev = previousValues.syncNotifications;
                if (typeof prev === "boolean") setSyncNotifications(prev);
            }
            toast.error(
                isZh
                    ? "保存设置失败。更改已撤销。"
                    : "Failed to save settings. Changes reverted.",
            );
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
                title={isZh ? "录音同步" : "Sync"}
                description={
                    isZh
                        ? "配置 Riffado 何时以及如何从您的 Plaud 设备上同步最新录音。"
                        : "When and how Riffado pulls new recordings from your Plaud device."
                }
                icon={RefreshCw}
            />
            <div className="space-y-3">
                <SettingsCard title={isZh ? "自动同步" : "Auto-sync"}>
                    <ToggleRow
                        id="auto-sync"
                        label={isZh ? "开启自动同步" : "Enable auto-sync"}
                        description={
                            isZh
                                ? "按固定时间间隔自动从您的 Plaud 设备同步录音。"
                                : "Automatically sync recordings from your Plaud device at regular intervals."
                        }
                        checked={autoSyncEnabled}
                        onCheckedChange={(checked) => {
                            setAutoSyncEnabled(checked);
                            handleSyncSettingChange({
                                autoSyncEnabled: checked,
                            });
                        }}
                        disabled={isSavingSettings}
                    />

                    {autoSyncEnabled && (
                        <div className="mt-3 space-y-3 border-t pt-3">
                            <div className="space-y-2">
                                <Label htmlFor="sync-interval">
                                    {isZh ? "同步时间间隔" : "Sync interval"}
                                </Label>
                                <Select
                                    value={syncInterval.toString()}
                                    onValueChange={(value) => {
                                        const interval = parseInt(value, 10);
                                        setSyncInterval(interval);
                                        handleSyncSettingChange({
                                            syncInterval: interval,
                                        });
                                    }}
                                    disabled={isSavingSettings}
                                >
                                    <SelectTrigger
                                        id="sync-interval"
                                        className="w-full"
                                    >
                                        <SelectValue>
                                            {getSyncIntervalLabel(
                                                syncInterval,
                                                isZh,
                                            )}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {syncIntervalPresets.map((preset) => (
                                            <SelectItem
                                                key={preset.value}
                                                value={preset.value.toString()}
                                            >
                                                {getSyncIntervalLabel(
                                                    preset.value,
                                                    isZh,
                                                )}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <ToggleRow
                                id="sync-on-mount"
                                label={
                                    isZh ? "应用加载时同步" : "Sync on app load"
                                }
                                description={
                                    isZh
                                        ? "在应用首次加载时自动执行同步。"
                                        : "Automatically sync when the app first loads."
                                }
                                checked={syncOnMount}
                                onCheckedChange={(checked) => {
                                    setSyncOnMount(checked);
                                    handleSyncSettingChange({
                                        syncOnMount: checked,
                                    });
                                }}
                                disabled={isSavingSettings}
                            />

                            <ToggleRow
                                id="sync-on-visibility"
                                label={
                                    isZh
                                        ? "标签页可见时同步"
                                        : "Sync on tab visibility"
                                }
                                description={
                                    isZh
                                        ? "当您切回应用标签页时自动执行同步。"
                                        : "Sync when you return to the app tab."
                                }
                                checked={syncOnVisibilityChange}
                                onCheckedChange={(checked) => {
                                    setSyncOnVisibilityChange(checked);
                                    handleSyncSettingChange({
                                        syncOnVisibilityChange: checked,
                                    });
                                }}
                                disabled={isSavingSettings}
                            />
                        </div>
                    )}
                </SettingsCard>

                <SettingsCard title={isZh ? "消息推送" : "Notifications"}>
                    <ToggleRow
                        id="sync-notifications"
                        label={
                            isZh ? "同步完成通知" : "Show sync notifications"
                        }
                        description={
                            isZh
                                ? "在同步完成时在浏览器中展示通知提示。"
                                : "Display notifications when sync completes."
                        }
                        checked={syncNotifications}
                        onCheckedChange={(checked) => {
                            setSyncNotifications(checked);
                            handleSyncSettingChange({
                                syncNotifications: checked,
                            });
                        }}
                        disabled={isSavingSettings}
                    />
                </SettingsCard>
            </div>
        </div>
    );
}
