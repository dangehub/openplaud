"use client";

import { Bot, CheckCircle2, Mic, Sparkles } from "lucide-react";
import { PlaudConnectTabs } from "@/components/plaud-connect-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

export function OnboardingStepWelcome() {
    const { t, locale } = useTranslation();
    const isZh = locale === "zh-CN";

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mic className="size-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">
                    {isZh
                        ? "您的智能 AI 录音中心"
                        : "Your AI-Powered Recording Hub"}
                </h3>
                <p className="text-muted-foreground">
                    {isZh
                        ? "Riffado 帮助您利用 AI 管理、转录和增强您的录音。让我们先来完成基础设置。"
                        : "Riffado helps you manage, transcribe, and enhance your Plaud recordings with AI. Let's set up your account."}
                </p>
            </div>

            <div className="grid gap-4">
                <Card className="gap-0 py-4">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Mic className="size-4" />
                            {t("onboarding.connect")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {isZh
                                ? "登录您的录音笔邮箱以自动同步录音"
                                : "Sign in with your Plaud email to sync recordings automatically"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="gap-0 py-4">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Bot className="size-4" />
                            {isZh ? "配置 AI 提供商" : "Set Up AI Provider"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {isZh
                                ? "配置一个底层的 AI 服务用以自动生成精准转录"
                                : "Configure an AI provider for automatic transcriptions"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="gap-0 py-4">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Sparkles className="size-4" />
                            {isZh ? "开始录音" : "Start Recording"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {isZh
                                ? "万事俱备！直接开始录音，把剩下的一切交给 AI"
                                : "You're all set! Start recording and let AI do the work"}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export function OnboardingStepPlaud({
    hasPlaudConnection,
    onReconnect,
    onConnected,
}: {
    hasPlaudConnection: boolean;
    onReconnect: () => void;
    onConnected: () => void;
}) {
    const { t, locale } = useTranslation();
    const isZh = locale === "zh-CN";

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mic className="size-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">
                    {t("onboarding.connect")}
                </h3>
                <p className="text-muted-foreground">
                    {isZh
                        ? "登录您的录音笔邮箱以自动同步录音"
                        : "Sign in with your Plaud email to sync recordings automatically"}
                </p>
            </div>

            {hasPlaudConnection ? (
                <Card className="border-primary/50 bg-primary/5 py-3">
                    <CardContent className="px-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="size-5 text-primary" />
                            <div className="flex-1">
                                <p className="font-medium">
                                    {isZh
                                        ? "设备已成功连接"
                                        : "Device Connected"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {isZh
                                        ? "您的录音笔账号已连接完成"
                                        : "Your Plaud account is connected"}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onReconnect}
                            >
                                {isZh ? "重新连接" : "Reconnect"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="gap-0 py-4">
                    <CardContent className="pt-6">
                        <PlaudConnectTabs
                            variant="dialog"
                            onConnected={onConnected}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export function OnboardingStepAiProvider({
    hasAiProvider,
    onGoToSettings,
}: {
    hasAiProvider: boolean;
    onGoToSettings: () => void;
}) {
    const { locale } = useTranslation();
    const isZh = locale === "zh-CN";

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="size-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">
                    {isZh ? "配置 AI 提供商" : "Set Up AI Provider"}
                </h3>
                <p className="text-muted-foreground">
                    {isZh
                        ? "配置一个 AI 服务，用以激活自动语音转写"
                        : "Configure an AI provider to enable automatic transcriptions"}
                </p>
            </div>

            {hasAiProvider ? (
                <Card className="border-primary/50 bg-primary/5 py-3">
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="size-5 text-primary" />
                            <div className="flex-1">
                                <p className="font-medium">
                                    {isZh
                                        ? "AI 提供商已配置"
                                        : "AI Provider Configured"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {isZh
                                        ? "您已经配置好了一个底层的 AI 接口"
                                        : "You already have an AI provider set up"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="gap-0 py-4">
                    <CardContent className="pt-6 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {isZh
                                ? "您随时可以在系统设置中配置 AI 提供商，配置后将激活自动语音转写功能。"
                                : "You can set up an AI provider later in Settings. This enables automatic transcription of your recordings."}
                        </p>
                        <Button
                            onClick={onGoToSettings}
                            variant="outline"
                            className="w-full"
                        >
                            {isZh ? "前往设置" : "Go to Settings"}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export function OnboardingStepComplete() {
    const { t, locale } = useTranslation();
    const isZh = locale === "zh-CN";

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="size-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">
                    {t("onboarding.setupComplete")}
                </h3>
                <p className="text-muted-foreground">
                    {t("onboarding.setupCompleteDesc")}
                </p>
            </div>

            <Card className="gap-0 py-4">
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="size-5 text-primary mt-0.5" />
                            <div>
                                <p className="font-medium">
                                    {isZh
                                        ? "自动同步录音"
                                        : "Recordings sync automatically"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {isZh
                                        ? "您的录音设备将在后台默默为您同步音频数据"
                                        : "Your Plaud device will sync recordings in the background"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="size-5 text-primary mt-0.5" />
                            <div>
                                <p className="font-medium">
                                    {isZh
                                        ? "智能 AI 语音转写"
                                        : "AI-powered transcriptions"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {isZh
                                        ? "配置好 AI 接口后，每条录音均可自动转录并生成大纲"
                                        : "Set up an AI provider to transcribe recordings automatically"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="size-5 text-primary mt-0.5" />
                            <div>
                                <p className="font-medium">
                                    {isZh
                                        ? "打造个性化体验"
                                        : "Customize your experience"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {isZh
                                        ? "您可以随时在设置菜单中调整所有的系统偏好"
                                        : "Adjust settings anytime from the Settings menu"}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
