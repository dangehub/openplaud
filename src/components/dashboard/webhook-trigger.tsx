"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";

const TRIGGERABLE_EVENTS = [
    "recording.synced",
    "recording.updated",
    "transcription.completed",
    "transcription.failed",
    "summary.completed",
    "summary.failed",
] as const;

const EVENT_LABELS_EN: Record<string, string> = {
    "recording.synced": "Recording Synced",
    "recording.updated": "Recording Updated",
    "transcription.completed": "Transcription Completed",
    "transcription.failed": "Transcription Failed",
    "summary.completed": "Summary Completed",
    "summary.failed": "Summary Failed",
};

const EVENT_LABELS_ZH: Record<string, string> = {
    "recording.synced": "录音已同步",
    "recording.updated": "录音已更新",
    "transcription.completed": "转录完成",
    "transcription.failed": "转录失败",
    "summary.completed": "总结完成",
    "summary.failed": "总结失败",
};

interface WebhookTriggerProps {
    recordingId: string;
}

export function WebhookTrigger({ recordingId }: WebhookTriggerProps) {
    const { locale } = useTranslation();
    const isZh = locale === "zh-CN";
    const [event, setEvent] = useState<string>(TRIGGERABLE_EVENTS[0]);
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        setIsSending(true);
        try {
            const response = await fetch(
                `/api/recordings/${recordingId}/webhook`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event }),
                },
            );
            if (!response.ok) {
                const data = (await response.json()) as { error?: string };
                throw new Error(
                    data.error ||
                        (isZh ? "发送失败" : "Failed to send webhook"),
                );
            }
            toast.success(
                isZh
                    ? `Webhook 已触发: ${EVENT_LABELS_ZH[event] ?? event}`
                    : `Webhook triggered: ${EVENT_LABELS_EN[event] ?? event}`,
            );
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : isZh
                      ? "发送 Webhook 失败"
                      : "Failed to send webhook",
            );
        } finally {
            setIsSending(false);
        }
    };

    const labels = isZh ? EVENT_LABELS_ZH : EVENT_LABELS_EN;

    return (
        <div className="flex items-center gap-2">
            <Select value={event} onValueChange={setEvent}>
                <SelectTrigger className="h-8 text-xs w-auto min-w-[160px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {TRIGGERABLE_EVENTS.map((e) => (
                        <SelectItem key={e} value={e} className="text-xs">
                            {labels[e] ?? e}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button
                variant="outline"
                size="sm"
                onClick={handleSend}
                disabled={isSending}
                className="h-8 gap-1.5 text-xs"
            >
                <Send className="size-3.5" />
                {isSending
                    ? isZh
                        ? "发送中…"
                        : "Sending…"
                    : isZh
                      ? "发送 Webhook"
                      : "Send Webhook"}
            </Button>
        </div>
    );
}
