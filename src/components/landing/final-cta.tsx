"use client";

import { LogoWordmark } from "@/components/icons/logo";
import { FinalCtaActions } from "@/components/landing/final-cta-actions";
import { useTranslation } from "@/lib/i18n";

/**
 * Page closer rendered on the theme-stable `bg-auth-brand` surface --
 * mirrors the brand panel from the hosted auth chrome so the landing
 * bookends with the same dark warm-sepia surface the user lands on
 * after they click through to sign in.
 */
export function FinalCTA() {
    const { t } = useTranslation();

    return (
        <section
            id="get-started"
            className="relative overflow-hidden bg-auth-brand text-auth-brand-foreground"
        >
            {/* Logo-motif dot grid, masked to vignette toward edges. */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
            />
            {/* Soft warm glow behind the CTA. */}
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl"
            />

            <div className="container relative z-10 mx-auto px-4 py-20 md:py-28">
                <div className="max-w-3xl mx-auto text-center space-y-8">
                    {/* Decorative wordmark -- the nav already exposes Home,
                        so this is a visual sign-off, not a link. Marked
                        aria-hidden so screen readers don't announce a
                        second "Riffado" between the headline and the CTA. */}
                    <LogoWordmark
                        aria-hidden
                        className="mx-auto h-10 w-auto md:h-12 text-auth-brand-foreground"
                    />

                    <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-balance">
                        {t("landing.finalCta.titlePre")}
                        <span className="text-primary">
                            {t("landing.finalCta.titleAccent")}
                        </span>
                    </h2>

                    <p className="text-auth-brand-foreground/70 text-lg leading-relaxed max-w-xl mx-auto">
                        {t("landing.finalCta.desc")}
                    </p>

                    <FinalCtaActions />
                </div>
            </div>
        </section>
    );
}
