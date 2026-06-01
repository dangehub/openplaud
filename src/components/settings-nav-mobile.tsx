"use client";

import { settingsNav } from "@/components/settings-nav-config";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";
import type { SettingsSection } from "@/types/settings";

interface Props {
    activeSection: SettingsSection;
    onSectionChange: (section: SettingsSection) => void;
}

export function SettingsNavMobile({ activeSection, onSectionChange }: Props) {
    const { t } = useTranslation();
    const activeNavItem = settingsNav.find((item) => item.id === activeSection);

    const activeItemName = activeNavItem
        ? activeNavItem.id === "providers"
            ? t("settings.items.providers")
            : activeNavItem.id === "transcription"
              ? t("settings.items.transcription")
              : activeNavItem.id === "summary"
                ? t("settings.items.summary")
                : activeNavItem.id === "plaud-account"
                  ? t("settings.items.plaudAccount")
                  : activeNavItem.id === "sync"
                    ? t("settings.items.sync")
                    : activeNavItem.id === "playback"
                      ? t("settings.items.playback")
                      : activeNavItem.id === "display"
                        ? t("settings.items.display")
                        : activeNavItem.id === "notifications"
                          ? t("settings.items.notifications")
                          : activeNavItem.id === "storage"
                            ? t("settings.items.storage")
                            : activeNavItem.id === "export"
                              ? t("settings.items.export")
                              : activeNavItem.id === "api-keys"
                                ? t("settings.items.apiKeys")
                                : activeNavItem.id === "webhooks"
                                  ? t("settings.items.webhooks")
                                  : activeNavItem.id === "dev"
                                    ? t("settings.items.dev")
                                    : activeNavItem.name
        : t("settings.title");

    return (
        <div className="md:hidden">
            <Select
                value={activeSection}
                onValueChange={(value) =>
                    onSectionChange(value as SettingsSection)
                }
            >
                <SelectTrigger
                    className="w-[180px]"
                    aria-label={t("settings.title")}
                >
                    <SelectValue>{activeItemName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {settingsNav.map((item) => {
                        const itemName =
                            item.id === "providers"
                                ? t("settings.items.providers")
                                : item.id === "transcription"
                                  ? t("settings.items.transcription")
                                  : item.id === "summary"
                                    ? t("settings.items.summary")
                                    : item.id === "plaud-account"
                                      ? t("settings.items.plaudAccount")
                                      : item.id === "sync"
                                        ? t("settings.items.sync")
                                        : item.id === "playback"
                                          ? t("settings.items.playback")
                                          : item.id === "display"
                                            ? t("settings.items.display")
                                            : item.id === "notifications"
                                              ? t(
                                                    "settings.items.notifications",
                                                )
                                              : item.id === "storage"
                                                ? t("settings.items.storage")
                                                : item.id === "export"
                                                  ? t("settings.items.export")
                                                  : item.id === "api-keys"
                                                    ? t(
                                                          "settings.items.apiKeys",
                                                      )
                                                    : item.id === "webhooks"
                                                      ? t(
                                                            "settings.items.webhooks",
                                                        )
                                                      : item.id === "dev"
                                                        ? t(
                                                              "settings.items.dev",
                                                          )
                                                        : item.name;

                        return (
                            <SelectItem key={item.id} value={item.id}>
                                <div className="flex items-center gap-2">
                                    <item.icon className="size-4" />
                                    <span>{itemName}</span>
                                </div>
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
        </div>
    );
}
