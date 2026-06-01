"use client";

import { FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SettingsSectionHeader } from "@/components/settings/section-header";
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

export function TranscriptionSection() {
    const { locale } = useTranslation();
    const isZh = locale === "zh-CN";

    const languageOptions = [
        { label: isZh ? "自动检测" : "Auto-detect", value: null },
        { label: isZh ? "英语" : "English", value: "en" },
        { label: isZh ? "西班牙语" : "Spanish", value: "es" },
        { label: isZh ? "法语" : "French", value: "fr" },
        { label: isZh ? "德语" : "German", value: "de" },
        { label: isZh ? "意大利语" : "Italian", value: "it" },
        { label: isZh ? "葡萄牙语" : "Portuguese", value: "pt" },
        { label: isZh ? "中文" : "Chinese", value: "zh" },
        { label: isZh ? "日语" : "Japanese", value: "ja" },
        { label: isZh ? "韩语" : "Korean", value: "ko" },
        { label: isZh ? "俄语" : "Russian", value: "ru" },
    ];

    const qualityOptions = [
        {
            label: isZh ? "极速" : "Fast",
            value: "fast",
            description: isZh
                ? "转写速度更快，但准确率可能较低"
                : "Faster transcription, lower accuracy",
        },
        {
            label: isZh ? "平衡" : "Balanced",
            value: "balanced",
            description: isZh
                ? "速度与准确率之间的良好平衡"
                : "Good balance of speed and accuracy",
        },
        {
            label: isZh ? "高精" : "Accurate",
            value: "accurate",
            description: isZh
                ? "转写准确率最高，但速度较慢"
                : "Highest accuracy, slower transcription",
        },
    ];

    const { isLoadingSettings, isSavingSettings, setIsLoadingSettings } =
        useSettings();
    const [autoTranscribe, setAutoTranscribe] = useState(false);
    const [defaultTranscriptionLanguage, setDefaultTranscriptionLanguage] =
        useState<string | null>(null);
    const [transcriptionQuality, setTranscriptionQuality] =
        useState("balanced");
    const [autoGenerateTitle, setAutoGenerateTitle] = useState(true);
    const [syncTitleToPlaud, setSyncTitleToPlaud] = useState(false);
    const pendingChangesRef = useRef<Map<string, unknown>>(new Map());

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/settings/user");
                if (response.ok) {
                    const data = await response.json();
                    setAutoTranscribe(data.autoTranscribe ?? false);
                    setDefaultTranscriptionLanguage(
                        data.defaultTranscriptionLanguage ?? null,
                    );
                    setTranscriptionQuality(
                        data.transcriptionQuality ?? "balanced",
                    );
                    setAutoGenerateTitle(data.autoGenerateTitle ?? true);
                    setSyncTitleToPlaud(data.syncTitleToPlaud ?? false);
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            } finally {
                setIsLoadingSettings(false);
            }
        };
        fetchSettings();
    }, [setIsLoadingSettings]);

    const handleAutoTranscribeChange = async (checked: boolean) => {
        const previous = autoTranscribe;
        setAutoTranscribe(checked);
        pendingChangesRef.current.set("autoTranscribe", previous);

        try {
            const response = await fetch("/api/settings/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ autoTranscribe: checked }),
            });

            if (!response.ok) {
                throw new Error("Failed to save settings");
            }

            pendingChangesRef.current.delete("autoTranscribe");
        } catch {
            setAutoTranscribe(previous);
            pendingChangesRef.current.delete("autoTranscribe");
            toast.error("Failed to save settings. Changes reverted.");
        }
    };

    const handleTranscriptionSettingChange = async (updates: {
        defaultTranscriptionLanguage?: string | null;
        transcriptionQuality?: string;
        autoGenerateTitle?: boolean;
        syncTitleToPlaud?: boolean;
    }) => {
        if (updates.defaultTranscriptionLanguage !== undefined) {
            const previous = defaultTranscriptionLanguage;
            setDefaultTranscriptionLanguage(
                updates.defaultTranscriptionLanguage,
            );
            pendingChangesRef.current.set(
                "defaultTranscriptionLanguage",
                previous,
            );
        }
        if (updates.transcriptionQuality !== undefined) {
            const previous = transcriptionQuality;
            setTranscriptionQuality(updates.transcriptionQuality);
            pendingChangesRef.current.set("transcriptionQuality", previous);
        }
        if (updates.autoGenerateTitle !== undefined) {
            const previous = autoGenerateTitle;
            setAutoGenerateTitle(updates.autoGenerateTitle);
            pendingChangesRef.current.set("autoGenerateTitle", previous);
        }
        if (updates.syncTitleToPlaud !== undefined) {
            const previous = syncTitleToPlaud;
            setSyncTitleToPlaud(updates.syncTitleToPlaud);
            pendingChangesRef.current.set("syncTitleToPlaud", previous);
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

            if (updates.defaultTranscriptionLanguage !== undefined) {
                pendingChangesRef.current.delete(
                    "defaultTranscriptionLanguage",
                );
            }
            if (updates.transcriptionQuality !== undefined) {
                pendingChangesRef.current.delete("transcriptionQuality");
            }
            if (updates.autoGenerateTitle !== undefined) {
                pendingChangesRef.current.delete("autoGenerateTitle");
            }
            if (updates.syncTitleToPlaud !== undefined) {
                pendingChangesRef.current.delete("syncTitleToPlaud");
            }
        } catch {
            if (updates.defaultTranscriptionLanguage !== undefined) {
                const previous = pendingChangesRef.current.get(
                    "defaultTranscriptionLanguage",
                );
                if (
                    previous !== undefined &&
                    (typeof previous === "string" || previous === null)
                ) {
                    setDefaultTranscriptionLanguage(previous);
                    pendingChangesRef.current.delete(
                        "defaultTranscriptionLanguage",
                    );
                }
            }
            if (updates.transcriptionQuality !== undefined) {
                const previous = pendingChangesRef.current.get(
                    "transcriptionQuality",
                );
                if (previous !== undefined && typeof previous === "string") {
                    setTranscriptionQuality(previous);
                    pendingChangesRef.current.delete("transcriptionQuality");
                }
            }
            if (updates.autoGenerateTitle !== undefined) {
                const previous =
                    pendingChangesRef.current.get("autoGenerateTitle");
                if (previous !== undefined && typeof previous === "boolean") {
                    setAutoGenerateTitle(previous);
                    pendingChangesRef.current.delete("autoGenerateTitle");
                }
            }
            if (updates.syncTitleToPlaud !== undefined) {
                const previous =
                    pendingChangesRef.current.get("syncTitleToPlaud");
                if (previous !== undefined && typeof previous === "boolean") {
                    setSyncTitleToPlaud(previous);
                    pendingChangesRef.current.delete("syncTitleToPlaud");
                }
            }
            toast.error("Failed to save settings. Changes reverted.");
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
                title={isZh ? "语音转写" : "Transcription"}
                description={
                    isZh
                        ? "设置音频文件转换为文本的默认语言与服务质量。"
                        : "Defaults and provider selection for converting audio to text."
                }
                icon={FileText}
            />
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                        <Label htmlFor="auto-transcribe" className="text-base">
                            {isZh
                                ? "自动转写新录音"
                                : "Auto-transcribe new recordings"}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            {isZh
                                ? "当从您的录音设备中同步新录音时，自动在后台进行语音转录"
                                : "Automatically transcribe recordings when they are synced from your Plaud device"}
                        </p>
                    </div>
                    <Switch
                        id="auto-transcribe"
                        checked={autoTranscribe}
                        onCheckedChange={handleAutoTranscribeChange}
                        disabled={isSavingSettings}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="transcription-language">
                        {isZh
                            ? "默认转写语言"
                            : "Default transcription language"}
                    </Label>
                    <Select
                        value={defaultTranscriptionLanguage || "auto"}
                        onValueChange={(value) => {
                            const lang = value === "auto" ? null : value;
                            setDefaultTranscriptionLanguage(lang);
                            handleTranscriptionSettingChange({
                                defaultTranscriptionLanguage: lang,
                            });
                        }}
                        disabled={isSavingSettings}
                    >
                        <SelectTrigger
                            id="transcription-language"
                            className="w-full"
                        >
                            <SelectValue>
                                {languageOptions.find(
                                    (opt) =>
                                        opt.value ===
                                        defaultTranscriptionLanguage,
                                )?.label || (isZh ? "自动检测" : "Auto-detect")}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {languageOptions.map((option) => (
                                <SelectItem
                                    key={option.value || "auto"}
                                    value={option.value || "auto"}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        {isZh
                            ? "语音转录时所使用的语言。选择“自动检测”将自动识别音频中的主要语种。"
                            : "Language to use for transcription. Auto-detect will identify the language automatically."}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="transcription-quality">
                        {isZh ? "转写质量偏好" : "Transcription quality"}
                    </Label>
                    <Select
                        value={transcriptionQuality}
                        onValueChange={(value) => {
                            setTranscriptionQuality(value);
                            handleTranscriptionSettingChange({
                                transcriptionQuality: value,
                            });
                        }}
                        disabled={isSavingSettings}
                    >
                        <SelectTrigger
                            id="transcription-quality"
                            className="w-full"
                        >
                            <SelectValue>
                                {qualityOptions.find(
                                    (opt) => opt.value === transcriptionQuality,
                                )?.label || (isZh ? "平衡" : "Balanced")}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {qualityOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    <div>
                                        <div>{option.label}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {option.description}
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        {isZh
                            ? "在语音转录的速度和文字识别的准确率之间进行权衡的优先等级"
                            : "Balance between transcription speed and accuracy"}
                    </p>
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                        <Label
                            htmlFor="auto-generate-title"
                            className="text-base"
                        >
                            {isZh ? "自动生成录音标题" : "Auto-generate titles"}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            {isZh
                                ? "转写完成后，自动使用 AI 基于转录的文本内容智能提取并生成描述性录音标题"
                                : "Automatically generate descriptive titles from transcriptions using AI"}
                        </p>
                    </div>
                    <Switch
                        id="auto-generate-title"
                        checked={autoGenerateTitle}
                        onCheckedChange={(checked) => {
                            setAutoGenerateTitle(checked);
                            handleTranscriptionSettingChange({
                                autoGenerateTitle: checked,
                            });
                        }}
                        disabled={isSavingSettings}
                    />
                </div>

                {autoGenerateTitle && (
                    <div className="flex items-center justify-between pl-4 border-l-2 border-primary/20">
                        <div className="space-y-0.5 flex-1">
                            <Label
                                htmlFor="sync-title-plaud"
                                className="text-base"
                            >
                                {isZh
                                    ? "同步标题到 Plaud 设备"
                                    : "Sync titles to Plaud"}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                {isZh
                                    ? "当 AI 成功生成新标题时，同步更新录音笔 App 中的云端录音文件名"
                                    : "Update the filename in your Plaud device when titles are generated"}
                            </p>
                        </div>
                        <Switch
                            id="sync-title-plaud"
                            checked={syncTitleToPlaud}
                            onCheckedChange={(checked) => {
                                setSyncTitleToPlaud(checked);
                                handleTranscriptionSettingChange({
                                    syncTitleToPlaud: checked,
                                });
                            }}
                            disabled={isSavingSettings}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
