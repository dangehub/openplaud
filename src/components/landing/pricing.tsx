"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { MetalButton } from "@/components/metal-button";
import { useTranslation } from "@/lib/i18n";

/**
 * Three ways to run Riffado. Same source, same features -- the axis
 * is "who runs the server."
 */
type Tier = {
    name: string;
    price: string;
    priceSuffix: string;
    tagline: string;
    pill: { label: string; tone: "muted" | "primary" } | null;
    features: string[];
    cta: { label: string; href: string };
    emphasis: boolean;
};

export function Pricing() {
    const { t, locale } = useTranslation();

    const tiers: Tier[] = [
        {
            name: t("landing.pricing.tiers.selfHost.name"),
            price: t("landing.pricing.tiers.selfHost.price"),
            priceSuffix: t("landing.pricing.tiers.selfHost.priceSuffix"),
            tagline: t("landing.pricing.tiers.selfHost.tagline"),
            pill: { label: "AGPL-3.0", tone: "muted" },
            features: [
                t("landing.pricing.tiers.selfHost.features.0"),
                t("landing.pricing.tiers.selfHost.features.1"),
                t("landing.pricing.tiers.selfHost.features.2"),
                t("landing.pricing.tiers.selfHost.features.3"),
                t("landing.pricing.tiers.selfHost.features.4"),
            ],
            cta: {
                label: t("landing.pricing.tiers.selfHost.cta"),
                href: "/install",
            },
            emphasis: false,
        },
        {
            name: t("landing.pricing.tiers.hostedFree.name"),
            price: t("landing.pricing.tiers.hostedFree.price"),
            priceSuffix: t("landing.pricing.tiers.hostedFree.priceSuffix"),
            tagline: t("landing.pricing.tiers.hostedFree.tagline"),
            pill: null,
            features: [
                t("landing.pricing.tiers.hostedFree.features.0"),
                t("landing.pricing.tiers.hostedFree.features.1"),
                t("landing.pricing.tiers.hostedFree.features.2"),
                t("landing.pricing.tiers.hostedFree.features.3"),
                t("landing.pricing.tiers.hostedFree.features.4"),
            ],
            cta: {
                label: t("landing.pricing.tiers.hostedFree.cta"),
                href: "/register",
            },
            emphasis: false,
        },
        {
            name: t("landing.pricing.tiers.hostedPro.name"),
            price: t("landing.pricing.tiers.hostedPro.price"),
            priceSuffix: t("landing.pricing.tiers.hostedPro.priceSuffix"),
            tagline: t("landing.pricing.tiers.hostedPro.tagline"),
            pill: {
                label: locale === "zh-CN" ? "即将推出" : "Coming soon",
                tone: "primary",
            },
            features: [
                t("landing.pricing.tiers.hostedPro.features.0"),
                t("landing.pricing.tiers.hostedPro.features.1"),
                t("landing.pricing.tiers.hostedPro.features.2"),
                t("landing.pricing.tiers.hostedPro.features.3"),
                t("landing.pricing.tiers.hostedPro.features.4"),
            ],
            cta: {
                label: t("landing.pricing.tiers.hostedPro.cta"),
                href: "/register",
            },
            emphasis: true,
        },
    ];

    return (
        <section id="pricing" className="py-24 md:py-32">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-6xl">
                    <div className="max-w-2xl mb-12 md:mb-16">
                        <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-4">
                            {t("landing.pricing.eyebrow")}
                        </p>
                        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-balance">
                            {t("landing.pricing.title")}
                        </h2>
                        <p className="text-muted-foreground text-lg leading-relaxed text-pretty">
                            {t("landing.pricing.desc")}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-[auto_1fr_auto] gap-4 md:gap-6">
                        {tiers.map((tier) => (
                            <TierCard key={tier.name} tier={tier} />
                        ))}
                    </div>

                    <p className="mt-8 text-xs text-muted-foreground/80 leading-relaxed text-pretty max-w-3xl">
                        {t("landing.pricing.bottomNote")
                            .split("{readSourceLink}")
                            .reduce<React.ReactNode[]>((acc, part, i) => {
                                if (i === 0) return [part];
                                return acc.concat([
                                    <Link
                                        key="read-source"
                                        href="https://github.com/riffado/riffado"
                                        className="underline decoration-muted-foreground/40 underline-offset-2 hover:text-foreground transition-colors"
                                    >
                                        {t("landing.pricing.readSource")}
                                    </Link>,
                                    part,
                                ]);
                            }, [])}
                    </p>
                </div>
            </div>
        </section>
    );
}

function TierCard({ tier }: { tier: Tier }) {
    return (
        <div
            className={`relative rounded-2xl border p-6 md:p-7 md:grid md:grid-rows-subgrid md:row-span-3 flex flex-col gap-6 ${
                tier.emphasis
                    ? "border-primary/40 bg-card shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_18%,transparent)_inset]"
                    : "border-border bg-card/50"
            }`}
        >
            <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        {tier.name}
                    </div>
                    {tier.pill ? <Pill {...tier.pill} /> : null}
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl md:text-5xl font-semibold tracking-tight tabular-nums leading-none">
                        {tier.price}
                    </span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                        {tier.priceSuffix}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground leading-snug">
                    {tier.tagline}
                </p>
            </div>

            <ul className="space-y-3">
                {tier.features.map((f) => (
                    <li
                        key={f}
                        className="flex items-start gap-2.5 text-sm leading-snug"
                    >
                        <Check
                            className={`size-4 mt-0.5 shrink-0 ${
                                tier.emphasis
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            }`}
                            aria-hidden
                        />
                        <span>{f}</span>
                    </li>
                ))}
            </ul>

            <MetalButton
                asChild
                size="lg"
                className={`w-full ${
                    tier.emphasis
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary/50"
                        : "bg-background/50"
                }`}
            >
                <Link href={tier.cta.href}>{tier.cta.label}</Link>
            </MetalButton>
        </div>
    );
}

function Pill({ label, tone }: { label: string; tone: "muted" | "primary" }) {
    return (
        <span
            className={`text-[10px] font-mono uppercase tracking-wider rounded px-1.5 py-0.5 border ${
                tone === "primary"
                    ? "border-primary/40 text-primary bg-primary/5"
                    : "border-border/60 text-muted-foreground"
            }`}
        >
            {label}
        </span>
    );
}
