"use client";

import { Check, Terminal } from "lucide-react";
import Link from "next/link";
import { CopyableCommand } from "@/components/copyable-command";
import { useTranslation } from "@/lib/i18n";
import { INSTALL_ONELINER } from "@/lib/install-commands";

/**
 * Self-host section that follows `Pricing`. Argues the self-host tier
 * one more time, in detail, for readers who skipped past the pricing
 * card -- and gives them a real way to act on it (copyable install
 * one-liner + Deploy CTA + source link).
 */

export function Deploy() {
    const { t } = useTranslation();

    const PROOF_POINTS = [
        t("landing.deploy.points.0"),
        t("landing.deploy.points.1"),
        t("landing.deploy.points.2"),
        t("landing.deploy.points.3"),
    ];

    return (
        <section
            id="deploy"
            className="relative overflow-hidden border-y border-border/40 bg-secondary/10 py-24 md:py-32"
        >
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
                    <div className="space-y-6">
                        <div className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                            <Terminal className="mr-2 size-3" aria-hidden />
                            {t("landing.deploy.eyebrow")}
                        </div>
                        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance">
                            {t("landing.deploy.title")}
                        </h2>
                        <p className="text-muted-foreground text-lg leading-relaxed text-pretty">
                            {t("landing.deploy.desc")}
                        </p>

                        <ul className="space-y-3 pt-2">
                            {PROOF_POINTS.map((point) => (
                                <li
                                    key={point}
                                    className="flex items-start gap-2.5 text-sm leading-snug"
                                >
                                    <Check
                                        className="size-4 mt-0.5 shrink-0 text-muted-foreground"
                                        aria-hidden
                                    />
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>

                        <p className="pt-2 text-sm">
                            <Link
                                href="/install"
                                className="font-mono text-foreground underline decoration-muted-foreground/40 underline-offset-2 hover:decoration-foreground transition-colors"
                            >
                                {t("landing.deploy.action")}
                            </Link>
                        </p>
                    </div>

                    <div className="w-full space-y-4">
                        <CopyableCommand
                            command={INSTALL_ONELINER}
                            ariaLabel="Copy install command"
                        />

                        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                            <div className="px-4 py-2.5 border-b border-border bg-background/40">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                                    {t("landing.deploy.installerOutput")}
                                </div>
                            </div>
                            <div className="p-5 md:p-6 font-mono text-xs md:text-sm leading-relaxed text-muted-foreground space-y-1.5">
                                <div>
                                    <span className="text-green-600 dark:text-green-500">
                                        ✓
                                    </span>{" "}
                                    {t("landing.deploy.output1")}
                                </div>
                                <div>
                                    <span className="text-green-600 dark:text-green-500">
                                        ✓
                                    </span>{" "}
                                    {t("landing.deploy.output2")}
                                </div>
                                <div>
                                    <span className="text-green-600 dark:text-green-500">
                                        ✓
                                    </span>{" "}
                                    {t("landing.deploy.output3")}
                                </div>
                                <div>
                                    <span className="text-green-600 dark:text-green-500">
                                        ✓
                                    </span>{" "}
                                    {t("landing.deploy.output4")}
                                </div>
                                <div className="pt-1.5 text-foreground">
                                    →{" "}
                                    <span className="font-medium">
                                        http://localhost:3000
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
