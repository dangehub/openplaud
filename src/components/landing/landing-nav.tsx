"use client";

import Link from "next/link";
import { LogoWordmark } from "@/components/icons/logo";
import { GitHubStarsPill } from "@/components/landing/github-stars-pill";
import { MetalButton } from "@/components/metal-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export function LandingNav() {
    const { locale, setLocale, t } = useTranslation();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link
                    href="/"
                    className="flex items-center hover:opacity-80 transition-opacity"
                    aria-label="Riffado"
                >
                    <LogoWordmark className="h-8 w-auto" />
                </Link>
                <nav className="flex items-center gap-3">
                    <GitHubStarsPill />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            setLocale(locale === "en" ? "zh-CN" : "en")
                        }
                        title={
                            locale === "en" ? "Switch to Chinese" : "切换为英文"
                        }
                        className="h-8 w-8 px-0 font-medium text-xs rounded-full hover:bg-muted"
                    >
                        {locale === "en" ? "中" : "EN"}
                    </Button>
                    <ThemeToggle />
                    <MetalButton
                        asChild
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 border-primary/50 shadow-[0_0_10px_color-mix(in_oklch,var(--primary)_30%,transparent)]"
                    >
                        <Link href="/login">{t("common.login")}</Link>
                    </MetalButton>
                </nav>
            </div>
        </header>
    );
}
