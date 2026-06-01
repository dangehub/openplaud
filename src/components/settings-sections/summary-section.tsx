"use client";

import { ListChecks } from "lucide-react";
import { useEffect, useState } from "react";
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
import { useSettings } from "@/hooks/use-settings";
import {
    AI_OUTPUT_LANGUAGES,
    SUMMARY_PRESETS,
    type SummaryPreset,
    type SummaryPromptConfiguration,
} from "@/lib/ai/summary-presets";
import { useTranslation } from "@/lib/i18n";

export function SummarySection() {
    const { locale } = useTranslation();
    const isZh = locale === "zh-CN";

    const getPresetName = (presetId: string) => {
        if (!isZh) {
            return (
                SUMMARY_PRESETS[presetId as SummaryPreset]?.name ||
                "General Summary"
            );
        }
        switch (presetId) {
            case "general":
                return "通用总结";
            case "meeting-notes":
                return "会议纪要";
            case "key-points":
                return "核心要点";
            case "action-items":
                return "行动待办";
            default:
                return "通用总结";
        }
    };

    const getPresetDescription = (presetId: string) => {
        if (!isZh) {
            return (
                SUMMARY_PRESETS[presetId as SummaryPreset]?.description || ""
            );
        }
        switch (presetId) {
            case "general":
                return "对任何语音转录内容进行精炼的摘要总结。";
            case "meeting-notes":
                return "结构化的会议摘要，包含参会人员、决策及行动待办项。";
            case "key-points":
                return "以列表形式提取语音内容中的核心观点和事实。";
            case "action-items":
                return "提取对话中提到的所有具体行动、任务与后续跟进项。";
            default:
                return "";
        }
    };

    const getLanguageLabel = (code: string) => {
        if (!isZh) {
            return (
                AI_OUTPUT_LANGUAGES.find((l) => l.code === code)?.label ||
                "Auto (match transcript)"
            );
        }
        if (code === "auto") return "自动 (与转录文本一致)";
        switch (code) {
            case "en":
                return "英语 (English)";
            case "es":
                return "西班牙语 (Spanish)";
            case "fr":
                return "法语 (French)";
            case "de":
                return "德语 (German)";
            case "it":
                return "意大利语 (Italian)";
            case "pt":
                return "葡萄牙语 (Portuguese)";
            case "nl":
                return "荷兰语 (Dutch)";
            case "pl":
                return "波兰语 (Polish)";
            case "ru":
                return "俄语 (Russian)";
            case "tr":
                return "土耳其语 (Turkish)";
            case "uk":
                return "乌克兰语 (Ukrainian)";
            case "cs":
                return "捷克语 (Czech)";
            case "sv":
                return "瑞典语 (Swedish)";
            case "da":
                return "丹麦语 (Danish)";
            case "no":
                return "挪威语 (Norwegian)";
            case "fi":
                return "芬兰语 (Finnish)";
            case "el":
                return "希腊语 (Greek)";
            case "ro":
                return "罗马尼亚语 (Romanian)";
            case "hu":
                return "匈牙利语 (Hungarian)";
            case "ja":
                return "日语 (Japanese)";
            case "zh":
                return "中文 (Chinese Simplified)";
            case "ko":
                return "韩语 (Korean)";
            case "ar":
                return "阿拉伯语 (Arabic)";
            case "he":
                return "希伯来语 (Hebrew)";
            case "hi":
                return "印地语 (Hindi)";
            case "id":
                return "印尼语 (Indonesian)";
            case "vi":
                return "越南语 (Vietnamese)";
            case "th":
                return "泰语 (Thai)";
            default:
                return "自动 (与转录文本一致)";
        }
    };

    const { isLoadingSettings, isSavingSettings, setIsLoadingSettings } =
        useSettings();
    const [selectedPrompt, setSelectedPrompt] = useState("general");
    const [outputLanguage, setOutputLanguage] = useState<string>("auto");

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/settings/user");
                if (response.ok) {
                    const data = await response.json();
                    const config =
                        data.summaryPrompt as SummaryPromptConfiguration | null;
                    if (config?.selectedPrompt) {
                        setSelectedPrompt(config.selectedPrompt);
                    }
                    if (typeof data.aiOutputLanguage === "string") {
                        setOutputLanguage(data.aiOutputLanguage);
                    } else {
                        setOutputLanguage("auto");
                    }
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            } finally {
                setIsLoadingSettings(false);
            }
        };
        fetchSettings();
    }, [setIsLoadingSettings]);

    const handlePresetChange = async (value: string) => {
        const previous = selectedPrompt;
        setSelectedPrompt(value);

        try {
            const response = await fetch("/api/settings/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    summaryPrompt: {
                        selectedPrompt: value,
                        customPrompts: [],
                    },
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save settings");
            }
        } catch {
            setSelectedPrompt(previous);
            toast.error("Failed to save settings. Changes reverted.");
        }
    };

    const handleLanguageChange = async (value: string) => {
        const previous = outputLanguage;
        setOutputLanguage(value);

        try {
            // Persist `null` for `auto` so the column reflects "no preference".
            const response = await fetch("/api/settings/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    aiOutputLanguage: value === "auto" ? null : value,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save settings");
            }
        } catch {
            setOutputLanguage(previous);
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
                title={isZh ? "AI 智能总结" : "Summary"}
                description={
                    isZh
                        ? "配置生成录音摘要时使用的 AI 模板预设和语言输出规则。"
                        : "Prompt presets and provider used when generating recording summaries."
                }
                icon={ListChecks}
            />
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="summary-preset">
                        {isZh ? "默认总结提示词模板" : "Default summary prompt"}
                    </Label>
                    <Select
                        value={selectedPrompt}
                        onValueChange={handlePresetChange}
                        disabled={isSavingSettings}
                    >
                        <SelectTrigger id="summary-preset" className="w-full">
                            <SelectValue>
                                {getPresetName(selectedPrompt)}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(SUMMARY_PRESETS).map((preset) => (
                                <SelectItem key={preset.id} value={preset.id}>
                                    <div>
                                        <div>{getPresetName(preset.id)}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {getPresetDescription(preset.id)}
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        {isZh
                            ? "自动生成总结时使用的默认提示词模板。您可以在每个录音详情页中手动重载此项。"
                            : "The default prompt preset used when generating summaries. You can override this per-recording."}
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ai-output-language">
                        {isZh ? "AI 总结输出语言" : "AI output language"}
                    </Label>
                    <Select
                        value={outputLanguage}
                        onValueChange={handleLanguageChange}
                        disabled={isSavingSettings}
                    >
                        <SelectTrigger
                            id="ai-output-language"
                            className="w-full"
                        >
                            <SelectValue>
                                {getLanguageLabel(outputLanguage)}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {AI_OUTPUT_LANGUAGES.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code}>
                                    {getLanguageLabel(lang.code)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        {isZh
                            ? "应用于 AI 生成的总结和大纲标题。选择“自动”将允许 AI 模型自动匹配并跟进录音的语言语种。"
                            : "Applies to AI-generated summaries and titles. Auto lets the model match the transcript's language."}
                    </p>
                </div>
            </div>
        </div>
    );
}
