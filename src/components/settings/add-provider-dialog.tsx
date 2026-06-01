"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MetalButton } from "@/components/metal-button";
import { Panel } from "@/components/panel";
import { TranscriptionModelPicker } from "@/components/settings/transcription-model-picker";
import {
    Dialog,
    DialogContent,
    DialogHeader,
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
import { findPreset, getVisiblePresets } from "@/lib/ai/provider-presets";
import { useTranslation } from "@/lib/i18n";

interface AddProviderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    /**
     * When true, hide the LM Studio / Ollama presets and show a hint that
     * localhost base URLs aren't reachable from the hosted app. The server
     * also rejects them — this is just a friendlier UI.
     */
    isHosted?: boolean;
}

export function AddProviderDialog({
    open,
    onOpenChange,
    onSuccess,
    isHosted = false,
}: AddProviderDialogProps) {
    const { locale } = useTranslation();
    const isZh = locale === "zh-CN";
    const visiblePresets = getVisiblePresets({ isHosted });
    const [provider, setProvider] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [defaultModel, setDefaultModel] = useState("");
    const [isDefaultTranscription, setIsDefaultTranscription] = useState(false);
    const [isDefaultEnhancement, setIsDefaultEnhancement] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleProviderChange = (value: string) => {
        setProvider(value);
        const preset = findPreset(value);
        if (preset) {
            setBaseUrl(preset.baseUrl);
            setDefaultModel(preset.defaultModel);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!provider || !apiKey) {
            toast.error(
                isZh
                    ? "服务商和 API 密钥为必填项"
                    : "Provider and API key are required",
            );
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/settings/ai/providers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider,
                    apiKey,
                    baseUrl: baseUrl || null,
                    defaultModel: defaultModel || null,
                    isDefaultTranscription,
                    isDefaultEnhancement,
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(
                    data?.error ||
                        (isZh ? "添加服务商失败" : "Failed to add provider"),
                );
            }

            toast.success(
                isZh ? "服务商添加成功" : "AI provider added successfully",
            );
            onSuccess();
            onOpenChange(false);

            setProvider("");
            setApiKey("");
            setBaseUrl("");
            setDefaultModel("");
            setIsDefaultTranscription(false);
            setIsDefaultEnhancement(false);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : isZh
                      ? "添加 AI 服务商失败"
                      : "Failed to add AI provider",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const selectedPreset = findPreset(provider);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isZh ? "添加 AI 服务商" : "Add AI Provider"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>{isZh ? "服务商" : "Provider"}</Label>
                        <Select
                            value={provider}
                            onValueChange={handleProviderChange}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={
                                        isZh
                                            ? "选择服务商"
                                            : "Select a provider"
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {visiblePresets.map((preset) => (
                                    <SelectItem
                                        key={preset.name}
                                        value={preset.name}
                                    >
                                        {preset.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="apiKey">
                            {isZh ? "API 密钥" : "API Key"}
                        </Label>
                        <Input
                            id="apiKey"
                            type="password"
                            placeholder={
                                selectedPreset?.placeholder ||
                                (isZh ? "您的 API 密钥" : "Your API key")
                            }
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            disabled={isLoading}
                            className="font-mono text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="baseUrl">
                            {isZh ? "接口地址 (可选)" : "Base URL (Optional)"}
                        </Label>
                        <Input
                            id="baseUrl"
                            type="text"
                            placeholder="https://api.example.com/v1"
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            disabled={isLoading}
                            className="font-mono text-sm"
                        />
                        {isHosted && (
                            <p className="text-xs text-muted-foreground">
                                {isZh ? (
                                    <>
                                        在托管服务中无法直接访问{" "}
                                        <code className="font-mono">
                                            localhost
                                        </code>{" "}
                                        或其他私有局域网地址。要使用 LM Studio
                                        或 Ollama，请在本地自行部署 Riffado (
                                        <code className="font-mono">
                                            docker compose up
                                        </code>
                                        )。
                                    </>
                                ) : (
                                    <>
                                        We can&apos;t reach{" "}
                                        <code className="font-mono">
                                            localhost
                                        </code>{" "}
                                        or other private addresses from the
                                        hosted app. To use LM Studio or Ollama,
                                        self-host Riffado (
                                        <code className="font-mono">
                                            docker compose up
                                        </code>
                                        ).
                                    </>
                                )}
                            </p>
                        )}
                    </div>

                    <TranscriptionModelPicker
                        preset={selectedPreset}
                        apiKey={apiKey}
                        baseUrl={baseUrl}
                        value={defaultModel}
                        onChange={setDefaultModel}
                        disabled={isLoading}
                    />

                    <Panel variant="inset" className="space-y-2 text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isDefaultTranscription}
                                onChange={(e) =>
                                    setIsDefaultTranscription(e.target.checked)
                                }
                                disabled={isLoading}
                            />
                            <span>
                                {isZh
                                    ? "默认用于语音转写"
                                    : "Use for transcription"}
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isDefaultEnhancement}
                                onChange={(e) =>
                                    setIsDefaultEnhancement(e.target.checked)
                                }
                                disabled={isLoading}
                            />
                            <span>
                                {isZh
                                    ? "默认用于大纲总结"
                                    : "Use for AI enhancements"}
                            </span>
                        </label>
                    </Panel>

                    <div className="flex gap-2">
                        <MetalButton
                            type="button"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {isZh ? "取消" : "Cancel"}
                        </MetalButton>
                        <MetalButton
                            type="submit"
                            variant="cyan"
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {isLoading
                                ? isZh
                                    ? "正在添加..."
                                    : "Adding..."
                                : isZh
                                  ? "添加服务商"
                                  : "Add Provider"}
                        </MetalButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
