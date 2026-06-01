"use client";

import { Monitor } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SettingsSectionHeader } from "@/components/settings/section-header";
import { Input } from "@/components/ui/input";
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

const dateTimeFormatOptions = [
    {
        label: "Relative",
        value: "relative",
        description: "e.g., 2 hours ago",
    },
    {
        label: "Absolute",
        value: "absolute",
        description: "e.g., Jan 15, 2024 3:45 PM",
    },
    {
        label: "ISO",
        value: "iso",
        description: "e.g., 2024-01-15T15:45:00Z",
    },
];

const sortOrderOptions = [
    { label: "Newest first", value: "newest" },
    { label: "Oldest first", value: "oldest" },
    { label: "By name", value: "name" },
];

const themeOptions = [
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
    {
        label: "System",
        value: "system",
        description: "Follow system preference",
    },
];

export function DisplaySection() {
    const { locale } = useTranslation();
    const isZh = locale === "zh-CN";

    const getThemeLabel = (value: string) => {
        if (!isZh) {
            return (
                themeOptions.find((opt) => opt.value === value)?.label ||
                "System"
            );
        }
        switch (value) {
            case "light":
                return "浅色";
            case "dark":
                return "深色";
            case "system":
                return "跟随系统";
            default:
                return "跟随系统";
        }
    };

    const getThemeDescription = (value: string) => {
        if (!isZh) {
            return (
                themeOptions.find((opt) => opt.value === value)?.description ||
                ""
            );
        }
        if (value === "system") return "自动适配系统外观偏好";
        return "";
    };

    const getSortOrderLabel = (value: string) => {
        if (!isZh) {
            return (
                sortOrderOptions.find((opt) => opt.value === value)?.label ||
                "Newest first"
            );
        }
        switch (value) {
            case "newest":
                return "最新优先";
            case "oldest":
                return "最旧优先";
            case "name":
                return "按名称排序";
            default:
                return "最新优先";
        }
    };

    const getDateTimeFormatLabel = (value: string) => {
        if (!isZh) {
            return (
                dateTimeFormatOptions.find((opt) => opt.value === value)
                    ?.label || "Relative"
            );
        }
        switch (value) {
            case "relative":
                return "相对时间";
            case "absolute":
                return "绝对时间";
            case "iso":
                return "ISO 格式";
            default:
                return "相对时间";
        }
    };

    const getDateTimeFormatDescription = (value: string) => {
        if (!isZh) {
            return (
                dateTimeFormatOptions.find((opt) => opt.value === value)
                    ?.description || ""
            );
        }
        switch (value) {
            case "relative":
                return "例如：2 小时前";
            case "absolute":
                return "例如：2024年1月15日 下午3:45";
            case "iso":
                return "例如：2024-01-15T15:45:00Z";
            default:
                return "";
        }
    };

    const { isLoadingSettings, isSavingSettings, setIsLoadingSettings } =
        useSettings();
    const [dateTimeFormat, setDateTimeFormat] = useState("relative");
    const [recordingListSortOrder, setRecordingListSortOrder] =
        useState("newest");
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [theme, setTheme] = useState("system");
    const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/settings/user");
                if (response.ok) {
                    const data = await response.json();
                    setDateTimeFormat(data.dateTimeFormat ?? "relative");
                    setRecordingListSortOrder(
                        data.recordingListSortOrder ?? "newest",
                    );
                    setItemsPerPage(data.itemsPerPage ?? 50);
                    setTheme(data.theme ?? "system");
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            } finally {
                setIsLoadingSettings(false);
            }
        };
        fetchSettings();
    }, [setIsLoadingSettings]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const handleDisplaySettingChange = async (
        updates: {
            dateTimeFormat?: string;
            recordingListSortOrder?: string;
            itemsPerPage?: number;
            theme?: string;
        },
        debounceMs?: number,
    ) => {
        const previousValues: Record<string, unknown> = {};
        if (updates.dateTimeFormat !== undefined) {
            previousValues.dateTimeFormat = dateTimeFormat;
            setDateTimeFormat(updates.dateTimeFormat);
        }
        if (updates.recordingListSortOrder !== undefined) {
            previousValues.recordingListSortOrder = recordingListSortOrder;
            setRecordingListSortOrder(updates.recordingListSortOrder);
        }
        if (updates.itemsPerPage !== undefined) {
            previousValues.itemsPerPage = itemsPerPage;
            setItemsPerPage(updates.itemsPerPage);
        }
        if (updates.theme !== undefined) {
            previousValues.theme = theme;
            setTheme(updates.theme);
        }

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        const performSave = async () => {
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
                if (updates.dateTimeFormat !== undefined) {
                    const prev = previousValues.dateTimeFormat;
                    if (typeof prev === "string") setDateTimeFormat(prev);
                }
                if (updates.recordingListSortOrder !== undefined) {
                    const prev = previousValues.recordingListSortOrder;
                    if (typeof prev === "string")
                        setRecordingListSortOrder(prev);
                }
                if (updates.itemsPerPage !== undefined) {
                    const prev = previousValues.itemsPerPage;
                    if (typeof prev === "number") setItemsPerPage(prev);
                }
                if (updates.theme !== undefined) {
                    const prev = previousValues.theme;
                    if (typeof prev === "string") setTheme(prev);
                }
                toast.error(
                    isZh
                        ? "保存设置失败。更改已撤销。"
                        : "Failed to save settings. Changes reverted.",
                );
            }
        };

        if (debounceMs) {
            saveTimeoutRef.current = setTimeout(performSave, debounceMs);
        } else {
            performSave();
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
                title={isZh ? "显示偏好" : "Display"}
                description={
                    isZh
                        ? "配置日期显示格式、录音列表排序以及应用的视觉主题外观。"
                        : "How dates, lists, and the overall UI present themselves."
                }
                icon={Monitor}
            />
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="date-time-format">
                        {isZh ? "日期时间格式" : "Date/time format"}
                    </Label>
                    <Select
                        value={dateTimeFormat}
                        onValueChange={(value) => {
                            setDateTimeFormat(value);
                            handleDisplaySettingChange({
                                dateTimeFormat: value,
                            });
                        }}
                        disabled={isSavingSettings}
                    >
                        <SelectTrigger id="date-time-format" className="w-full">
                            <SelectValue>
                                {getDateTimeFormatLabel(dateTimeFormat)}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {dateTimeFormatOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    <div>
                                        <div>
                                            {getDateTimeFormatLabel(
                                                option.value,
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {getDateTimeFormatDescription(
                                                option.value,
                                            )}
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="sort-order">
                        {isZh
                            ? "录音列表排序方式"
                            : "Recording list sort order"}
                    </Label>
                    <Select
                        value={recordingListSortOrder}
                        onValueChange={(value) => {
                            setRecordingListSortOrder(value);
                            handleDisplaySettingChange({
                                recordingListSortOrder: value,
                            });
                        }}
                        disabled={isSavingSettings}
                    >
                        <SelectTrigger id="sort-order" className="w-full">
                            <SelectValue>
                                {getSortOrderLabel(recordingListSortOrder)}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {sortOrderOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {getSortOrderLabel(option.value)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="items-per-page">
                        {isZh ? "每页显示条数" : "Items per page"}
                    </Label>
                    <Input
                        id="items-per-page"
                        type="number"
                        min={10}
                        max={100}
                        value={itemsPerPage}
                        onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            if (
                                !Number.isNaN(value) &&
                                value >= 10 &&
                                value <= 100
                            ) {
                                setItemsPerPage(value);
                                handleDisplaySettingChange(
                                    { itemsPerPage: value },
                                    500,
                                );
                            }
                        }}
                    />
                    <p className="text-xs text-muted-foreground">
                        {isZh
                            ? "每页展示的录音数量 (10-100 条)"
                            : "Number of recordings to display per page (10-100)"}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="theme">{isZh ? "外观主题" : "Theme"}</Label>
                    <Select
                        value={theme}
                        onValueChange={(value) => {
                            setTheme(value);
                            handleDisplaySettingChange({ theme: value });
                        }}
                        disabled={isSavingSettings}
                    >
                        <SelectTrigger id="theme" className="w-full">
                            <SelectValue>{getThemeLabel(theme)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {themeOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    <div>
                                        <div>{getThemeLabel(option.value)}</div>
                                        {option.description && (
                                            <div className="text-xs text-muted-foreground">
                                                {getThemeDescription(
                                                    option.value,
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
