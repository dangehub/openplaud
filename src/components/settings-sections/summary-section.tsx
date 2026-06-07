"use client";

import { ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { SettingsSectionHeader } from "@/components/settings/section-header";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import {
    AI_OUTPUT_LANGUAGES,
    type CustomSummaryPrompt,
    SUMMARY_PRESETS,
    type SummaryPreset,
    type SummaryPromptConfiguration,
} from "@/lib/ai/summary-presets";
import { useTranslation } from "@/lib/i18n";

type EditingPrompt = {
    id?: string;
    name: string;
    prompt: string;
};

export function SummarySection() {
    const { locale } = useTranslation();
    const isZh = locale === "zh-CN";
    const confirm = useConfirm();

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
    const [selectedPromptId, setSelectedPromptId] = useState("general");
    const [customPrompts, setCustomPrompts] = useState<CustomSummaryPrompt[]>(
        [],
    );
    const [outputLanguage, setOutputLanguage] = useState<string>("auto");
    const [autoSummarize, setAutoSummarize] = useState(false);

    const [editingCustomPrompt, setEditingCustomPrompt] =
        useState<EditingPrompt | null>(null);
    const [viewingPromptId, setViewingPromptId] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/settings/user");
                if (response.ok) {
                    const data = await response.json();
                    const config =
                        data.summaryPrompt as SummaryPromptConfiguration | null;
                    if (config) {
                        setSelectedPromptId(config.selectedPrompt || "general");
                        setCustomPrompts(config.customPrompts || []);
                    } else {
                        setSelectedPromptId("general");
                        setCustomPrompts([]);
                    }
                    if (typeof data.aiOutputLanguage === "string") {
                        setOutputLanguage(data.aiOutputLanguage);
                    } else {
                        setOutputLanguage("auto");
                    }
                    if (typeof data.autoSummarize === "boolean") {
                        setAutoSummarize(data.autoSummarize);
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

    const handlePromptSettingChange = async (config: {
        selectedPrompt: string;
        customPrompts: CustomSummaryPrompt[];
    }) => {
        try {
            const response = await fetch("/api/settings/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ summaryPrompt: config }),
            });
            if (!response.ok) {
                throw new Error("Failed to save settings");
            }
        } catch {
            toast.error(
                isZh
                    ? "保存失败。更改已撤销。"
                    : "Failed to save settings. Changes reverted.",
            );
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
            toast.error(
                isZh
                    ? "保存失败。更改已撤销。"
                    : "Failed to save settings. Changes reverted.",
            );
        }
    };

    const handleAutoSummarizeChange = async (checked: boolean) => {
        const previous = autoSummarize;
        setAutoSummarize(checked);

        try {
            const response = await fetch("/api/settings/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ autoSummarize: checked }),
            });

            if (!response.ok) {
                throw new Error("Failed to save settings");
            }
        } catch {
            setAutoSummarize(previous);
            toast.error(
                isZh
                    ? "保存失败。更改已撤销。"
                    : "Failed to save settings. Changes reverted.",
            );
        }
    };

    const handleSaveCustomPrompt = async (prompt: EditingPrompt) => {
        const isEdit = !!prompt.id;
        const newPrompt: CustomSummaryPrompt = {
            id: prompt.id || nanoid(),
            name: prompt.name,
            prompt: prompt.prompt,
            createdAt: isEdit
                ? customPrompts.find((p) => p.id === prompt.id)?.createdAt ||
                  new Date().toISOString()
                : new Date().toISOString(),
        };

        const updatedPrompts = isEdit
            ? customPrompts.map((p) => (p.id === prompt.id ? newPrompt : p))
            : [...customPrompts, newPrompt];

        setCustomPrompts(updatedPrompts);
        setEditingCustomPrompt(null);

        await handlePromptSettingChange({
            selectedPrompt: selectedPromptId,
            customPrompts: updatedPrompts,
        });
    };

    const handleDeleteCustomPrompt = (id: string) => {
        void confirm({
            title: isZh
                ? "确定删除此自定义提示词吗？"
                : "Delete this custom prompt?",
            description: isZh
                ? "使用此提示词生成过总结的录音将保留其总结，但您未来将无法再次使用此模版生成总结。"
                : "Recordings already summarized with this prompt keep their existing summaries, but you won't be able to apply it again.",
            confirmLabel: isZh ? "删除" : "Delete",
            destructive: true,
            onConfirm: async () => {
                const updatedPrompts = customPrompts.filter((p) => p.id !== id);
                setCustomPrompts(updatedPrompts);
                const newSelectedPrompt =
                    selectedPromptId === id ? "general" : selectedPromptId;
                setSelectedPromptId(newSelectedPrompt);
                await handlePromptSettingChange({
                    selectedPrompt: newSelectedPrompt,
                    customPrompts: updatedPrompts,
                });
            },
        });
    };

    if (isLoadingSettings) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    const viewingText =
        viewingPromptId &&
        (SUMMARY_PRESETS[viewingPromptId as keyof typeof SUMMARY_PRESETS]
            ?.prompt ||
            customPrompts.find((p) => p.id === viewingPromptId)?.prompt ||
            "");

    const viewingName =
        viewingPromptId &&
        (viewingPromptId in SUMMARY_PRESETS
            ? getPresetName(viewingPromptId)
            : customPrompts.find((p) => p.id === viewingPromptId)?.name ||
              (isZh ? "提示词" : "Prompt"));

    const viewingDescription =
        viewingPromptId &&
        (viewingPromptId in SUMMARY_PRESETS
            ? getPresetDescription(viewingPromptId)
            : isZh
              ? "自定义提示词"
              : "Custom prompt");

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
                <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/30">
                    <div className="space-y-0.5">
                        <Label className="text-base font-medium">
                            {isZh
                                ? "自动总结新转录"
                                : "Auto-summarize new transcriptions"}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            {isZh
                                ? "当语音内容成功转录为文本后，自动在后台生成 AI 总结"
                                : "Automatically generate AI summary when a transcription completes"}
                        </p>
                    </div>
                    <Switch
                        checked={autoSummarize}
                        onCheckedChange={handleAutoSummarizeChange}
                        disabled={isSavingSettings}
                    />
                </div>

                <div className="space-y-2 pt-4">
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

                {/* Active prompt selector */}
                <div className="space-y-2 pt-4">
                    <Label htmlFor="selected-prompt">
                        {isZh ? "默认总结提示词模板" : "Default summary prompt"}
                    </Label>
                    <Select
                        value={selectedPromptId}
                        onValueChange={(value) => {
                            setSelectedPromptId(value);
                            handlePromptSettingChange({
                                selectedPrompt: value,
                                customPrompts,
                            });
                        }}
                        disabled={isSavingSettings}
                    >
                        <SelectTrigger id="selected-prompt">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(SUMMARY_PRESETS).map((preset) => (
                                <SelectItem key={preset.id} value={preset.id}>
                                    {getPresetName(preset.id)} (
                                    {isZh ? "预设" : "Preset"})
                                </SelectItem>
                            ))}
                            {customPrompts.map((prompt) => (
                                <SelectItem key={prompt.id} value={prompt.id}>
                                    {prompt.name} ({isZh ? "自定义" : "Custom"})
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

                {/* Preset prompts (read-only) */}
                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">
                            {isZh ? "系统预设提示词" : "Preset Prompts"}
                        </h3>
                    </div>
                    <div className="space-y-2">
                        {Object.values(SUMMARY_PRESETS).map((preset) => (
                            <div
                                key={preset.id}
                                className="p-4 border rounded-lg"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium">
                                                {getPresetName(preset.id)}
                                            </h4>
                                            {selectedPromptId === preset.id && (
                                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20">
                                                    {isZh ? "已启用" : "Active"}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            {getPresetDescription(preset.id)}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setViewingPromptId(preset.id)
                                        }
                                    >
                                        {isZh ? "查看模板" : "View Prompt"}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Custom prompts */}
                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">
                            {isZh ? "自定义提示词" : "Custom Prompts"}
                        </h3>
                        <Button
                            onClick={() =>
                                setEditingCustomPrompt({ name: "", prompt: "" })
                            }
                            size="sm"
                        >
                            <Plus className="size-4 mr-2" />
                            {isZh ? "添加提示词" : "Add Custom Prompt"}
                        </Button>
                    </div>
                    {customPrompts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            {isZh
                                ? "暂无自定义提示词。立即创建一个吧！"
                                : "No custom prompts yet. Create one to get started."}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {customPrompts.map((prompt) => (
                                <div
                                    key={prompt.id}
                                    className="p-4 border rounded-lg"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium">
                                                    {prompt.name}
                                                </h4>
                                                {selectedPromptId ===
                                                    prompt.id && (
                                                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20">
                                                        {isZh
                                                            ? "已启用"
                                                            : "Active"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setViewingPromptId(
                                                        prompt.id,
                                                    )
                                                }
                                            >
                                                {isZh ? "查看" : "View"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setEditingCustomPrompt({
                                                        id: prompt.id,
                                                        name: prompt.name,
                                                        prompt: prompt.prompt,
                                                    })
                                                }
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleDeleteCustomPrompt(
                                                        prompt.id,
                                                    )
                                                }
                                            >
                                                <Trash2 className="size-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* View prompt dialog */}
                {viewingPromptId && (
                    <Dialog
                        open={!!viewingPromptId}
                        onOpenChange={(open) =>
                            !open && setViewingPromptId(null)
                        }
                    >
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogTitle>{viewingName}</DialogTitle>
                            <DialogDescription>
                                {viewingPromptId === "general" && isZh
                                    ? "对任何语音转录内容进行精炼的摘要总结。"
                                    : viewingDescription}
                            </DialogDescription>
                            <div className="mt-4">
                                <pre className="p-4 bg-muted rounded-md text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                                    {viewingText}
                                </pre>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Edit/create custom prompt dialog */}
                {editingCustomPrompt && (
                    <Dialog
                        open={!!editingCustomPrompt}
                        onOpenChange={(open) =>
                            !open && setEditingCustomPrompt(null)
                        }
                    >
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogTitle>
                                {editingCustomPrompt.id
                                    ? isZh
                                        ? "编辑自定义提示词"
                                        : "Edit Custom Prompt"
                                    : isZh
                                      ? "新建自定义提示词"
                                      : "Create Custom Prompt"}
                            </DialogTitle>
                            <DialogDescription>
                                {isZh
                                    ? "创建一个用于生成录音总结的自定义提示词。请在模板内容中使用 {transcription} 作为录音转写文本的占位符。必须返回严格的 JSON 格式。"
                                    : "Create a custom prompt for summary generation. Use {transcription} as a placeholder. Must return strict JSON."}
                            </DialogDescription>
                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="custom-prompt-name">
                                        {isZh ? "模板名称" : "Name"}
                                    </Label>
                                    <Input
                                        id="custom-prompt-name"
                                        value={editingCustomPrompt.name}
                                        onChange={(e) =>
                                            setEditingCustomPrompt((prev) =>
                                                prev
                                                    ? {
                                                          ...prev,
                                                          name: e.target.value,
                                                      }
                                                    : prev,
                                            )
                                        }
                                        placeholder={
                                            isZh
                                                ? "我的自定义提示词"
                                                : "My Custom Prompt"
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="custom-prompt-text">
                                        {isZh ? "提示词模板内容" : "Prompt"}
                                    </Label>
                                    <textarea
                                        id="custom-prompt-text"
                                        className="w-full min-h-[300px] px-3 py-2 text-sm border rounded-md resize-y font-mono"
                                        value={editingCustomPrompt.prompt}
                                        onChange={(e) =>
                                            setEditingCustomPrompt((prev) =>
                                                prev
                                                    ? {
                                                          ...prev,
                                                          prompt: e.target
                                                              .value,
                                                      }
                                                    : prev,
                                            )
                                        }
                                        placeholder={
                                            isZh
                                                ? "在此输入您的提示词模版... 请确保要求模型输出 JSON，并包含 {transcription}"
                                                : "You are a summarizer... Output JSON... \n\nTranscription:\n{transcription}"
                                        }
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setEditingCustomPrompt(null)
                                        }
                                    >
                                        {isZh ? "取消" : "Cancel"}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            if (
                                                !editingCustomPrompt.name ||
                                                !editingCustomPrompt.prompt
                                            ) {
                                                toast.error(
                                                    isZh
                                                        ? "名称和提示词内容均为必填项"
                                                        : "Name and prompt are required",
                                                );
                                                return;
                                            }
                                            handleSaveCustomPrompt(
                                                editingCustomPrompt,
                                            );
                                        }}
                                        disabled={
                                            !editingCustomPrompt.name ||
                                            !editingCustomPrompt.prompt
                                        }
                                    >
                                        {editingCustomPrompt.id
                                            ? isZh
                                                ? "保存"
                                                : "Save"
                                            : isZh
                                              ? "创建"
                                              : "Create"}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
}
