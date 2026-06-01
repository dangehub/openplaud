"use client";

import type React from "react";
import {
    createContext,
    useContext,
    useEffect,
    useState,
    useTransition,
} from "react";
import en from "../locales/en.json";
import zhCN from "../locales/zh-CN.json";

export type Locale = "en" | "zh-CN";

const dictionaries = {
    en,
    "zh-CN": zhCN,
};

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (path: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: unknown, path: string): string {
    if (!obj || typeof obj !== "object") return path;

    const parts = path.split(".");
    let current = obj as Record<string, unknown>;

    for (const part of parts) {
        if (current == null || typeof current !== "object") {
            return path;
        }
        const next = current[part];
        if (next === undefined) {
            return path;
        }
        current = next as Record<string, unknown>;
    }

    return typeof current === "string" ? current : path;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("en");
    const [, startTransition] = useTransition();

    // Load persisted locale or auto-detect from browser on mount
    useEffect(() => {
        const savedLocale = localStorage.getItem("riffado_locale") as Locale;
        if (savedLocale === "en" || savedLocale === "zh-CN") {
            setLocaleState(savedLocale);
        } else {
            const browserLang = navigator.language || "";
            if (browserLang.toLowerCase().startsWith("zh")) {
                setLocaleState("zh-CN");
            } else {
                setLocaleState("en");
            }
        }
    }, []);

    const setLocale = (newLocale: Locale) => {
        startTransition(() => {
            setLocaleState(newLocale);
            localStorage.setItem("riffado_locale", newLocale);
        });
    };

    const t = (path: string): string => {
        const dictionary = dictionaries[locale] || dictionaries.en;
        return getNestedValue(dictionary, path);
    };

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useTranslation must be used within an I18nProvider");
    }
    return context;
}
