"use client";

import { Check, Clipboard } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/lib/i18n";
import { DEFAULT_WEBHOOK_EVENTS, type WebhookEndpoint } from "./webhook-types";

interface WebhookForm {
    url: string;
    description: string;
    enabled: boolean;
    events: string[];
}

function buildForm(
    webhook: WebhookEndpoint | null,
    events: string[],
): WebhookForm {
    if (webhook) {
        return {
            url: webhook.url,
            description: webhook.description || "",
            enabled: webhook.enabled,
            events: webhook.events,
        };
    }
    return {
        url: "",
        description: "",
        enabled: true,
        events: [events[0] ?? DEFAULT_WEBHOOK_EVENTS[0]],
    };
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** When non-null, the dialog edits this webhook; otherwise it creates. */
    editingWebhook: WebhookEndpoint | null;
    /** Server-known event list (subset of DEFAULT_WEBHOOK_EVENTS in practice). */
    events: string[];
    /** Called after a successful save so the parent can re-fetch the list. */
    onSaved: () => Promise<void> | void;
}

const getEventLabel = (event: string, isZh: boolean) => {
    if (!isZh) return event;
    switch (event) {
        case "recording.synced":
            return "录音已同步 (recording.synced)";
        case "recording.updated":
            return "录音已更新 (recording.updated)";
        case "recording.deleted":
            return "录音已删除 (recording.deleted)";
        case "transcription.completed":
            return "转录完成 (transcription.completed)";
        case "transcription.failed":
            return "转录失败 (transcription.failed)";
        default:
            return event;
    }
};

/**
 * Create/edit dialog for a webhook endpoint. After a successful create, the
 * server returns a one-time signing secret which we show in-place (and ask
 * the user to copy) before letting the dialog close. Edits never return a
 * new secret -- closing the dialog right away is correct there.
 */
export function WebhookEditorDialog({
    open,
    onOpenChange,
    editingWebhook,
    events,
    onSaved,
}: Props) {
    const { locale } = useTranslation();
    const isZh = locale === "zh-CN";

    const [form, setForm] = useState<WebhookForm>(() =>
        buildForm(editingWebhook, events),
    );
    const [isSaving, setIsSaving] = useState(false);
    const [createdSecret, setCreatedSecret] = useState<string | null>(null);

    // Re-seed the form whenever the dialog opens for a (possibly different)
    // webhook. Without this, opening the dialog for webhook B after editing
    // webhook A would show A's URL/events.
    useEffect(() => {
        if (open) {
            setCreatedSecret(null);
            setForm(buildForm(editingWebhook, events));
        }
    }, [open, editingWebhook, events]);

    const toggleEvent = (event: string) => {
        setForm((current) => {
            const hasEvent = current.events.includes(event);
            const nextEvents = hasEvent
                ? current.events.filter((item) => item !== event)
                : [...current.events, event];
            return { ...current, events: nextEvents };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const response = await fetch(
                editingWebhook
                    ? `/api/settings/webhooks/${editingWebhook.id}`
                    : "/api/settings/webhooks",
                {
                    method: editingWebhook ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                },
            );

            const data = (await response.json()) as {
                webhook?: WebhookEndpoint;
                secret?: string;
                error?: string;
            };
            if (!response.ok || !data.webhook) {
                throw new Error(
                    data.error ||
                        (isZh ? "保存 Webhook 失败" : "Failed to save webhook"),
                );
            }

            await onSaved();
            if (data.secret) {
                // Hold the dialog open so the secret can be copied; the user
                // dismisses via the "Saved" button.
                setCreatedSecret(data.secret);
            } else {
                onOpenChange(false);
            }
            toast.success(
                editingWebhook
                    ? isZh
                        ? "Webhook 已更新"
                        : "Webhook updated"
                    : isZh
                      ? "Webhook 已添加"
                      : "Webhook added",
            );
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : isZh
                      ? "保存 Webhook 失败"
                      : "Failed to save webhook",
            );
        } finally {
            setIsSaving(false);
        }
    };

    const copySecret = async () => {
        if (!createdSecret) return;
        await navigator.clipboard.writeText(createdSecret);
        toast.success(isZh ? "签名密钥已复制" : "Secret copied");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogTitle>
                    {editingWebhook
                        ? isZh
                            ? "编辑 Webhook"
                            : "Edit Webhook"
                        : isZh
                          ? "添加 Webhook"
                          : "Add Webhook"}
                </DialogTitle>
                {createdSecret ? (
                    <div className="space-y-4">
                        <DialogDescription>
                            {isZh
                                ? "该签名密钥仅显示一次，请妥善保存。"
                                : "This signing secret is shown once."}
                        </DialogDescription>
                        <div className="rounded-md border bg-muted p-3 font-mono text-sm break-all">
                            {createdSecret}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={copySecret}
                            >
                                <Clipboard className="size-4" />
                                {isZh ? "复制" : "Copy"}
                            </Button>
                            <Button
                                type="button"
                                className="flex-1"
                                onClick={() => {
                                    setCreatedSecret(null);
                                    onOpenChange(false);
                                }}
                            >
                                <Check className="size-4" />
                                {isZh ? "已保存" : "Saved"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="webhook-url">URL</Label>
                            <Input
                                id="webhook-url"
                                value={form.url}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        url: event.target.value,
                                    }))
                                }
                                placeholder="https://example.com/webhook"
                                disabled={isSaving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="webhook-description">
                                {isZh ? "描述" : "Description"}
                            </Label>
                            <Input
                                id="webhook-description"
                                value={form.description}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                                placeholder={
                                    isZh
                                        ? "自动接收端点"
                                        : "Automation receiver"
                                }
                                disabled={isSaving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{isZh ? "触发事件" : "Events"}</Label>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {events.map((event) => (
                                    <label
                                        key={event}
                                        className="flex items-center gap-2 rounded-md border p-2 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form.events.includes(
                                                event,
                                            )}
                                            onChange={() => toggleEvent(event)}
                                            disabled={
                                                isSaving ||
                                                (form.events.length === 1 &&
                                                    form.events.includes(event))
                                            }
                                        />
                                        <span>
                                            {getEventLabel(event, isZh)}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded-md border p-3">
                            <Label htmlFor="webhook-enabled">
                                {isZh ? "已启用" : "Enabled"}
                            </Label>
                            <Switch
                                id="webhook-enabled"
                                checked={form.enabled}
                                onCheckedChange={(checked) =>
                                    setForm((current) => ({
                                        ...current,
                                        enabled: checked,
                                    }))
                                }
                                disabled={isSaving}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSaving}
                            >
                                {isZh ? "取消" : "Cancel"}
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    isSaving ||
                                    !form.url.trim() ||
                                    form.events.length === 0
                                }
                            >
                                {isZh ? "保存" : "Save"}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
