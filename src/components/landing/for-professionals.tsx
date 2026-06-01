"use client";

import { ArrowRight, Github } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

export function ForProfessionals() {
    const { t } = useTranslation();

    return (
        <section
            id="for-professionals"
            className="py-20 bg-secondary/20 border-y border-border/40"
        >
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono uppercase tracking-wider mb-4 text-muted-foreground">
                        <span>{t("landing.forProfessionals.eyebrow")}</span>
                        <span aria-hidden className="text-muted-foreground/40">
                            {"//"}
                        </span>
                        <span className="text-muted-foreground/80">
                            {t("landing.forProfessionals.kicker")}
                        </span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-8 max-w-3xl">
                        {t("landing.forProfessionals.title")}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8 mb-10">
                        <Pillar
                            kicker={t(
                                "landing.forProfessionals.pillars.infrastructure.kicker",
                            )}
                            headline={t(
                                "landing.forProfessionals.pillars.infrastructure.headline",
                            )}
                            body={t(
                                "landing.forProfessionals.pillars.infrastructure.body",
                            )}
                        />
                        <Pillar
                            kicker={t(
                                "landing.forProfessionals.pillars.source.kicker",
                            )}
                            headline={t(
                                "landing.forProfessionals.pillars.source.headline",
                            )}
                            body={t(
                                "landing.forProfessionals.pillars.source.body",
                            )}
                        />
                        <Pillar
                            kicker={t(
                                "landing.forProfessionals.pillars.ai.kicker",
                            )}
                            headline={t(
                                "landing.forProfessionals.pillars.ai.headline",
                            )}
                            body={t("landing.forProfessionals.pillars.ai.body")}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/docs/self-hosting"
                                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors text-sm font-medium"
                            >
                                {t("landing.forProfessionals.guide")}
                                <ArrowRight className="size-4" />
                            </Link>
                            <Link
                                href="https://github.com/riffado/riffado"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-border bg-background hover:bg-secondary/40 transition-colors text-sm font-medium"
                            >
                                <Github className="size-4" />
                                {t("landing.forProfessionals.source")}
                            </Link>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {t("landing.forProfessionals.contact")
                                .split("{email}")
                                .reduce<React.ReactNode[]>((acc, part, i) => {
                                    if (i === 0) return [part];
                                    return acc.concat([
                                        <Link
                                            key="support-email"
                                            href="mailto:support@riffado.com?subject=In-house%20Riffado%20setup"
                                            className="text-foreground font-medium hover:text-primary transition-colors underline-offset-4 hover:underline"
                                        >
                                            support@riffado.com
                                        </Link>,
                                        part,
                                    ]);
                                }, [])}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Pillar({
    kicker,
    headline,
    body,
}: {
    kicker: string;
    headline: string;
    body: string;
}) {
    return (
        <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                {kicker}
            </p>
            <h3 className="text-base font-semibold leading-snug">{headline}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
                {body}
            </p>
        </div>
    );
}
