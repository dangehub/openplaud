"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
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
import { useSettings } from "@/hooks/use-settings";
import { PROMPT_PRESETS } from "@/lib/ai/prompt-presets";
import { useTranslation } from "@/lib/i18n";

interface CustomPrompt {
    id: string;
    name: string;
    prompt: string;
    createdAt: string;
}

type EditingPrompt = {
    id?: string;
    name: string;
    prompt: string;
};

/**
 * Title-generation prompt management. Owns:
 *  - Active prompt selector (chooses among presets + user customs).
 *  - Preset prompt list (read-only view of the shipped PROMPT_PRESETS).
 *  - Custom prompt CRUD with confirm-delete.
 *  - View dialog (read the full prompt text) and edit dialog
 *    (create / edit a custom prompt).
 *
 * Hoisted out of ProvidersSection because the AI providers list and
 * the prompt manager only share a tab bar; their data, dialogs, and
 * persistence calls are otherwise independent. Keeping them in one
 * 710-line component meant useState calls + effects + dialogs
 * cross-pollinating that didn't need to.
 *
 * Persists via PUT /api/settings/user, `titleGenerationPrompt` field.
 */
export function PromptManager() {
    const { locale } = useTranslation();
    const isZh = locale === "zh-CN";

    const getPresetName = (presetId: string) => {
        if (!isZh) {
            return (
                PROMPT_PRESETS[presetId as keyof typeof PROMPT_PRESETS]?.name ||
                "Default"
            );
        }
        switch (presetId) {
            case "default":
                return "默认标题生成";
            case "meetings":
                return "会议讨论";
            case "lectures":
                return "课程讲座";
            case "phone-calls":
                return "电话访谈";
            case "audio-blog":
                return "随笔播客";
            case "idea-stormer":
                return "灵感风暴";
            default:
                return (
                    PROMPT_PRESETS[presetId as keyof typeof PROMPT_PRESETS]
                        ?.name || "默认"
                );
        }
    };

    const getPresetDescription = (presetId: string) => {
        if (!isZh) {
            return (
                PROMPT_PRESETS[presetId as keyof typeof PROMPT_PRESETS]
                    ?.description || ""
            );
        }
        switch (presetId) {
            case "default":
                return "系统默认用于提取录音简短描述性标题的提示词模板。";
            case "meetings":
                return "适用于商务会议、每日站会及团队讨论的标题生成。";
            case "lectures":
                return "适用于教学内容、课程及演讲报告的标题生成。";
            case "phone-calls":
                return "适用于电话通话、采访及访谈录音的标题生成。";
            case "audio-blog":
                return "适用于个人随笔、Vlog录音及日常闲聊的标题生成。";
            case "idea-stormer":
                return "适用于脑力激荡、创意讨论及灵感记录的标题生成。";
            default:
                return (
                    PROMPT_PRESETS[presetId as keyof typeof PROMPT_PRESETS]
                        ?.description || ""
                );
        }
    };

    const confirm = useConfirm();
    const { isLoadingSettings, isSavingSettings, setIsLoadingSettings } =
        useSettings();
    const [selectedPromptId, setSelectedPromptId] = useState<string>("default");
    const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([]);
    const [editingCustomPrompt, setEditingCustomPrompt] =
        useState<EditingPrompt | null>(null);
    const [viewingPromptId, setViewingPromptId] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/settings/user");
                if (response.ok) {
                    const data = await response.json();
                    if (data.titleGenerationPrompt) {
                        const promptConfig = data.titleGenerationPrompt as {
                            selectedPrompt?: string;
                            customPrompts?: CustomPrompt[];
                        };
                        setSelectedPromptId(
                            promptConfig.selectedPrompt || "default",
                        );
                        setCustomPrompts(promptConfig.customPrompts || []);
                    } else {
                        setSelectedPromptId("default");
                        setCustomPrompts([]);
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
        customPrompts: CustomPrompt[];
    }) => {
        try {
            const response = await fetch("/api/settings/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ titleGenerationPrompt: config }),
            });
            if (!response.ok) {
                throw new Error("Failed to save prompt settings");
            }
            toast.success(
                isZh ? "提示词设置保存成功" : "Prompt settings saved",
            );
        } catch {
            toast.error(
                isZh ? "保存提示词设置失败" : "Failed to save prompt settings",
            );
        }
    };

    const handleSaveCustomPrompt = async (prompt: EditingPrompt) => {
        const isEdit = !!prompt.id;
        const newPrompt: CustomPrompt = {
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
                ? "使用此提示词生成过标题的录音将保留其标题，但您未来将无法再次使用此模版生成标题。"
                : "Recordings already summarized with this prompt keep their existing summaries, but you won't be able to apply it again.",
            confirmLabel: isZh ? "删除" : "Delete",
            destructive: true,
            onConfirm: async () => {
                const updatedPrompts = customPrompts.filter((p) => p.id !== id);
                setCustomPrompts(updatedPrompts);
                const newSelectedPrompt =
                    selectedPromptId === id ? "default" : selectedPromptId;
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
        (PROMPT_PRESETS[viewingPromptId as keyof typeof PROMPT_PRESETS]
            ?.prompt ||
            customPrompts.find((p) => p.id === viewingPromptId)?.prompt ||
            "");

    const viewingName =
        viewingPromptId &&
        (viewingPromptId in PROMPT_PRESETS
            ? getPresetName(viewingPromptId)
            : customPrompts.find((p) => p.id === viewingPromptId)?.name ||
              (isZh ? "提示词" : "Prompt"));

    const viewingDescription =
        viewingPromptId &&
        (viewingPromptId in PROMPT_PRESETS
            ? getPresetDescription(viewingPromptId)
            : isZh
              ? "自定义提示词"
              : "Custom prompt");

    return (
        <div className="space-y-6">
            {/* Active prompt selector */}
            <div className="space-y-2">
                <Label htmlFor="selected-prompt">
                    {isZh ? "当前生效提示词" : "Active Prompt"}
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
                        {Object.values(PROMPT_PRESETS).map((preset) => (
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
                        ? "选择系统用于自动生成录音标题的 AI 提示词模板"
                        : "Select which prompt to use for title generation"}
                </p>
            </div>

            {/* Preset prompts (read-only) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                        {isZh ? "系统预设提示词" : "Preset Prompts"}
                    </h3>
                </div>
                <div className="space-y-2">
                    {Object.values(PROMPT_PRESETS).map((preset) => (
                        <div key={preset.id} className="p-4 border rounded-lg">
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
                                            {selectedPromptId === prompt.id && (
                                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20">
                                                    {isZh ? "已启用" : "Active"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setViewingPromptId(prompt.id)
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
                    onOpenChange={(open) => !open && setViewingPromptId(null)}
                >
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogTitle>{viewingName}</DialogTitle>
                        <DialogDescription>
                            {viewingPromptId === "default" && isZh
                                ? "系统默认用于提取录音简短描述性标题的提示词模板。"
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
                                ? "创建一个用于生成录音标题的自定义提示词。请在模板内容中使用 {transcription} 作为录音转写文本的占位符。"
                                : "Create a custom prompt for title generation. Use {transcription} as a placeholder for the transcription text."}
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
                                                      prompt: e.target.value,
                                                  }
                                                : prev,
                                        )
                                    }
                                    placeholder={
                                        isZh
                                            ? "在此输入您的提示词模版..."
                                            : "You are a title generator..."
                                    }
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setEditingCustomPrompt(null)}
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
    );
}
