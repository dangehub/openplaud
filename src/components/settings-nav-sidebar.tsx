"use client";

import { Settings as SettingsIcon } from "lucide-react";
import {
    settingsNav,
    settingsNavGroups,
} from "@/components/settings-nav-config";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useTranslation } from "@/lib/i18n";
import type { SettingsSection } from "@/types/settings";

interface Props {
    activeSection: SettingsSection;
    keyboardSelectedIndex: number;
    onSectionChange: (section: SettingsSection) => void;
}

export function SettingsNavSidebar({
    activeSection,
    keyboardSelectedIndex,
    onSectionChange,
}: Props) {
    const { t } = useTranslation();

    return (
        <Sidebar className="hidden md:flex md:h-[600px]">
            <div className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SettingsIcon className="size-5" />
                <h2 className="text-lg font-semibold">{t("settings.title")}</h2>
            </div>
            <SidebarContent className="min-h-0">
                <nav aria-label="Settings sections" className="space-y-4">
                    {settingsNavGroups.map((group) => {
                        const groupLabel =
                            group.label === "AI"
                                ? t("settings.groups.ai")
                                : group.label === "Plaud"
                                  ? t("settings.groups.plaud")
                                  : group.label === "Personalize"
                                    ? t("settings.groups.personalize")
                                    : group.label === "Data"
                                      ? t("settings.groups.data")
                                      : group.label === "Integrations"
                                        ? t("settings.groups.integrations")
                                        : group.label === "Advanced"
                                          ? t("settings.groups.advanced")
                                          : group.label;

                        return (
                            <SidebarGroup
                                key={group.label}
                                className="space-y-1"
                            >
                                <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                                    {groupLabel}
                                </div>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {group.items.map((item) => {
                                            const flatIndex =
                                                settingsNav.findIndex(
                                                    (n) => n.id === item.id,
                                                );
                                            const itemName =
                                                item.id === "providers"
                                                    ? t(
                                                          "settings.items.providers",
                                                      )
                                                    : item.id ===
                                                        "transcription"
                                                      ? t(
                                                            "settings.items.transcription",
                                                        )
                                                      : item.id === "summary"
                                                        ? t(
                                                              "settings.items.summary",
                                                          )
                                                        : item.id ===
                                                            "plaud-account"
                                                          ? t(
                                                                "settings.items.plaudAccount",
                                                            )
                                                          : item.id === "sync"
                                                            ? t(
                                                                  "settings.items.sync",
                                                              )
                                                            : item.id ===
                                                                "playback"
                                                              ? t(
                                                                    "settings.items.playback",
                                                                )
                                                              : item.id ===
                                                                  "display"
                                                                ? t(
                                                                      "settings.items.display",
                                                                  )
                                                                : item.id ===
                                                                    "notifications"
                                                                  ? t(
                                                                        "settings.items.notifications",
                                                                    )
                                                                  : item.id ===
                                                                      "storage"
                                                                    ? t(
                                                                          "settings.items.storage",
                                                                      )
                                                                    : item.id ===
                                                                        "export"
                                                                      ? t(
                                                                            "settings.items.export",
                                                                        )
                                                                      : item.id ===
                                                                          "api-keys"
                                                                        ? t(
                                                                              "settings.items.apiKeys",
                                                                          )
                                                                        : item.id ===
                                                                            "webhooks"
                                                                          ? t(
                                                                                "settings.items.webhooks",
                                                                            )
                                                                          : item.id ===
                                                                              "dev"
                                                                            ? t(
                                                                                  "settings.items.dev",
                                                                              )
                                                                            : item.name;

                                            return (
                                                <SidebarMenuItem key={item.id}>
                                                    <SidebarMenuButton
                                                        data-settings-nav={
                                                            flatIndex === 0
                                                                ? "first"
                                                                : undefined
                                                        }
                                                        isActive={
                                                            activeSection ===
                                                            item.id
                                                        }
                                                        data-keyboard-selected={
                                                            keyboardSelectedIndex ===
                                                            flatIndex
                                                        }
                                                        onClick={() =>
                                                            onSectionChange(
                                                                item.id,
                                                            )
                                                        }
                                                        aria-label={`${itemName} settings`}
                                                        aria-current={
                                                            activeSection ===
                                                            item.id
                                                                ? "page"
                                                                : undefined
                                                        }
                                                        className={
                                                            item.id === "dev"
                                                                ? "text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 data-[active=true]:bg-red-500/10 data-[active=true]:text-red-700 dark:data-[active=true]:text-red-300"
                                                                : undefined
                                                        }
                                                    >
                                                        <item.icon
                                                            className="size-4"
                                                            aria-hidden="true"
                                                        />
                                                        <span>{itemName}</span>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            );
                                        })}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        );
                    })}
                </nav>
            </SidebarContent>
        </Sidebar>
    );
}
