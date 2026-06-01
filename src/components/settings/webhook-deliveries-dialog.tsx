"use client";

import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";
import {
    formatWebhookDate,
    type WebhookDelivery,
    type WebhookEndpoint,
} from "./webhook-types";

interface Props {
    /** Webhook whose deliveries should be displayed; `null` closes the dialog. */
    webhook: WebhookEndpoint | null;
    onClose: () => void;
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

const getStatusLabel = (status: string, isZh: boolean) => {
    if (!isZh) return status;
    switch (status) {
        case "success":
            return "成功";
        case "failed":
            return "失败";
        case "processing":
            return "处理中";
        case "pending":
            return "等待中";
        default:
            return status;
    }
};

/**
 * Read-mostly deliveries inspector for a single webhook endpoint. Fetches
 * its own list whenever the `webhook` prop changes -- the parent doesn't
 * keep delivery state around, so opening the dialog from one webhook then
 * another never flashes the wrong endpoint's history.
 */
export function WebhookDeliveriesDialog({ webhook, onClose }: Props) {
    const { locale } = useTranslation();
    const isZh = locale === "zh-CN";
    const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);

    const webhookId = webhook?.id ?? null;

    const refresh = useCallback(async () => {
        if (!webhookId) return;
        try {
            const response = await fetch(
                `/api/settings/webhooks/${webhookId}/deliveries`,
            );
            if (!response.ok) throw new Error("Failed to fetch deliveries");
            const data = (await response.json()) as {
                deliveries: WebhookDelivery[];
            };
            setDeliveries(data.deliveries);
        } catch {
            toast.error(
                isZh ? "加载递送记录失败" : "Failed to load deliveries",
            );
        }
    }, [webhookId, isZh]);

    useEffect(() => {
        if (!webhookId) {
            // Clear stale deliveries when the dialog closes so re-opening
            // it for a different webhook can't briefly flash the old list.
            setDeliveries([]);
            return;
        }
        void refresh();
    }, [webhookId, refresh]);

    const redeliver = async (deliveryId: string) => {
        if (!webhookId) return;
        try {
            const response = await fetch(
                `/api/settings/webhooks/${webhookId}/deliveries/${deliveryId}/redeliver`,
                { method: "POST" },
            );
            if (!response.ok) throw new Error("Failed to redeliver");
            toast.success(isZh ? "已加入递送队列" : "Delivery queued");
            await refresh();
        } catch {
            toast.error(isZh ? "加入递送队列失败" : "Failed to queue delivery");
        }
    };

    return (
        <Dialog
            open={Boolean(webhook)}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="max-w-3xl">
                <DialogTitle>
                    {isZh ? "Webhook 递送记录" : "Webhook Deliveries"}
                </DialogTitle>
                <div className="max-h-[420px] space-y-2 overflow-y-auto">
                    {deliveries.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            {isZh ? "暂无递送记录" : "No deliveries yet"}
                        </p>
                    ) : (
                        deliveries.map((delivery) => (
                            <div
                                key={delivery.id}
                                className="grid gap-2 rounded-lg border p-3 text-sm sm:grid-cols-[1fr_auto]"
                            >
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium">
                                            {getEventLabel(
                                                delivery.event,
                                                isZh,
                                            )}
                                        </span>
                                        <span className="rounded border px-2 py-0.5 text-xs">
                                            {getStatusLabel(
                                                delivery.status,
                                                isZh,
                                            )}
                                        </span>
                                        {delivery.lastResponseStatus && (
                                            <span className="rounded border px-2 py-0.5 text-xs">
                                                HTTP{" "}
                                                {delivery.lastResponseStatus}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {isZh ? "重试次数：" : "Attempts: "}
                                        {delivery.attempts} ·{" "}
                                        {isZh ? "上次递送：" : "Last: "}{" "}
                                        {formatWebhookDate(
                                            delivery.lastAttemptAt,
                                            isZh,
                                        )}
                                    </p>
                                    {delivery.lastError && (
                                        <p className="text-xs text-destructive">
                                            {delivery.lastError}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={delivery.status === "processing"}
                                    onClick={() => redeliver(delivery.id)}
                                >
                                    <RotateCcw className="size-4" />
                                    {isZh ? "重新递送" : "Redeliver"}
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
