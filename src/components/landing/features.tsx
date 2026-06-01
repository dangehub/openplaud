"use client";

import { Cpu, LayoutDashboard, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "@/lib/i18n";

/**
 * "How it works" section. Three compact beats matching the three
 * Hero promises -- Searchable, summarized, and yours.
 */

type Beat = {
    step: string;
    icon: ReactNode;
    title: string;
    body: string;
};

export function Features() {
    const { t } = useTranslation();

    const BEATS: Beat[] = [
        {
            step: "01",
            icon: <RefreshCw className="size-5" />,
            title: t("landing.featuresSection.b1.title"),
            body: t("landing.featuresSection.b1.body"),
        },
        {
            step: "02",
            icon: <Cpu className="size-5" />,
            title: t("landing.featuresSection.b2.title"),
            body: t("landing.featuresSection.b2.body"),
        },
        {
            step: "03",
            icon: <LayoutDashboard className="size-5" />,
            title: t("landing.featuresSection.b3.title"),
            body: t("landing.featuresSection.b3.body"),
        },
    ];

    return (
        <section id="features" className="py-20 md:py-24">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-5xl">
                    <div className="max-w-3xl mb-12">
                        <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-4">
                            {t("landing.featuresSection.howItWorks")}
                        </p>
                        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-balance">
                            {t("landing.featuresSection.title")}
                        </h2>
                        <p className="text-muted-foreground text-lg leading-relaxed text-pretty">
                            {t("landing.featuresSection.desc")}
                        </p>
                    </div>

                    <ol className="grid grid-cols-1 lg:grid-cols-3 lg:divide-x divide-y lg:divide-y-0 divide-border/60 border-y border-border/60">
                        {BEATS.map((b) => (
                            <BeatItem key={b.step} {...b} />
                        ))}
                    </ol>

                    <p className="mt-8 text-sm text-muted-foreground text-pretty">
                        {t("landing.featuresSection.footerNote")}
                    </p>
                </div>
            </div>
        </section>
    );
}

function BeatItem({ step, icon, title, body }: Beat) {
    return (
        <li className="py-8 lg:py-10 lg:px-7 lg:first:pl-0 lg:last:pr-0">
            <div className="flex items-center gap-3 mb-5">
                <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                    {icon}
                </div>
                <span className="text-xs font-mono text-muted-foreground tracking-wider">
                    {step}
                </span>
            </div>
            <h3 className="text-lg font-semibold leading-snug tracking-tight mb-2 text-balance">
                {title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                {body}
            </p>
        </li>
    );
}
