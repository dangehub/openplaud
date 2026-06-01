"use client";

import { useTranslation } from "@/lib/i18n";

export function TheMath() {
    const { t, locale } = useTranslation();

    const subscriptionServices = [
        {
            name: t("landing.theMath.subscriptions.plaud"),
            price: "$17.99",
            unit: locale === "zh-CN" ? "/ 月" : "/ month",
            scope: t("landing.theMath.subscriptions.plaudScope"),
            perHour: locale === "zh-CN" ? "$0.90 / 小时" : "$0.90 / hr",
        },
        {
            name: t("landing.theMath.subscriptions.otter"),
            price: "$20",
            unit: locale === "zh-CN" ? "/ 用户 / 月" : "/ user / month",
            scope: t("landing.theMath.subscriptions.otterScope"),
            perHour: locale === "zh-CN" ? "$0.20 / 小时" : "$0.20 / hr",
        },
        {
            name: t("landing.theMath.subscriptions.rev"),
            price: "$29.99",
            unit: locale === "zh-CN" ? "/ 月" : "/ month",
            scope: t("landing.theMath.subscriptions.revScope"),
            perHour: locale === "zh-CN" ? "$1.50 / 小时" : "$1.50 / hr",
        },
    ];

    const riffadoOptions = [
        {
            name: t("landing.theMath.options.browser"),
            price: "$0.00",
            unit: locale === "zh-CN" ? "免费" : "free",
            scope: t("landing.theMath.options.browserScope"),
            perHour: locale === "zh-CN" ? "$0.00 / 小时" : "$0.00 / hr",
        },
        {
            name: t("landing.theMath.options.groq"),
            price: "$2.22",
            unit: locale === "zh-CN" ? "单次购买" : "one-time",
            scope: t("landing.theMath.options.groqScope"),
            perHour: locale === "zh-CN" ? "$0.11 / 小时" : "$0.11 / hr",
        },
        {
            name: t("landing.theMath.options.openai"),
            price: "$7.20",
            unit: locale === "zh-CN" ? "单次购买" : "one-time",
            scope: t("landing.theMath.options.openaiScope"),
            perHour: locale === "zh-CN" ? "$0.36 / 小时" : "$0.36 / hr",
        },
    ];

    return (
        <section className="pt-40 md:pt-56 lg:pt-72 pb-24 border-y border-border/40 bg-secondary/10">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-5xl">
                    <div className="max-w-2xl">
                        <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-4">
                            {t("landing.theMath.eyebrow")}
                        </p>
                        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-balance">
                            {t("landing.theMath.title")}
                        </h2>
                        <p className="text-muted-foreground text-lg leading-relaxed text-pretty">
                            {t("landing.theMath.desc")}
                        </p>
                    </div>

                    <p className="mt-10 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        {t("landing.theMath.workload")}
                    </p>

                    <div className="mt-3 grid gap-4 lg:grid-cols-2 lg:gap-6 items-stretch">
                        <PriceTable
                            label={t("landing.theMath.labels.subscriptions")}
                            rows={subscriptionServices}
                            tone="muted"
                        />
                        <PriceTable
                            label={t("landing.theMath.labels.riffado")}
                            rows={riffadoOptions}
                            tone="primary"
                            highlightFirst
                        />
                    </div>

                    <p className="mt-6 text-xs text-muted-foreground/80 leading-relaxed text-pretty max-w-2xl">
                        {t("landing.theMath.publishedPricing")}
                    </p>
                </div>
            </div>
        </section>
    );
}

type Row = {
    name: string;
    price: string;
    unit: string;
    scope: string;
    perHour: string;
};

function PriceTable({
    label,
    rows,
    tone,
    highlightFirst,
}: {
    label: string;
    rows: Row[];
    tone: "muted" | "primary";
    highlightFirst?: boolean;
}) {
    const isMuted = tone === "muted";
    return (
        <div
            className={`rounded-2xl border border-border overflow-hidden h-full flex flex-col ${
                isMuted ? "bg-card/50" : "bg-card"
            }`}
        >
            <div className="px-5 md:px-6 py-3 border-b border-border bg-background/40">
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    {label}
                </div>
            </div>
            <div className="flex-1 flex flex-col">
                {rows.map((row, i) => {
                    const isFirst = i === 0;
                    const highlight = highlightFirst && isFirst;
                    return (
                        <div
                            key={row.name}
                            className={`flex-1 flex items-center justify-between gap-4 px-5 md:px-6 py-5 ${
                                i < rows.length - 1
                                    ? "border-b border-border"
                                    : ""
                            }`}
                        >
                            <div className="min-w-0">
                                <div className="text-sm font-medium text-foreground mb-1 truncate">
                                    {row.name}
                                </div>
                                <div className="text-xs leading-snug text-muted-foreground">
                                    {row.scope}
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div
                                    className={`text-3xl md:text-4xl font-semibold tracking-tight tabular-nums leading-none ${
                                        highlight
                                            ? "text-primary"
                                            : isMuted
                                              ? "text-muted-foreground"
                                              : "text-foreground"
                                    }`}
                                >
                                    {row.price}
                                </div>
                                <div className="mt-2 text-xs text-muted-foreground tabular-nums">
                                    {row.unit}
                                    <span className="text-muted-foreground/60">
                                        {" "}
                                        &middot; {row.perHour}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
