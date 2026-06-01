"use client";

import Link from "next/link";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/lib/i18n";

type FaqItem = {
    q: string;
    a: string;
    body?: React.ReactNode;
};

type FaqGroup = {
    label: string;
    items: FaqItem[];
};

const EN_GROUPS: FaqGroup[] = [
    {
        label: "Getting started",
        items: [
            {
                q: "Is hosted Riffado really free? What does it cost?",
                a: "The hosted free tier is real and stays real — sign up, connect your recorder, and use it. A paid Pro tier with higher limits and priority transcription is on a waitlist, but nothing about the free tier expires into it. And if you ever want zero cost and full control, self-hosting Riffado is free forever — same code, your machine.",
            },
            {
                q: "Do I need to pay for an AI provider to try this?",
                a: "No. Riffado transcribes right in your browser by default using Whisper — no API keys, no extra accounts, no per-minute cost. If you want faster or higher-quality transcripts later, plug in OpenAI or Groq, or run a local model with Ollama. The browser path is on by default and stays free forever.",
            },
            {
                q: "Which voice recorders does Riffado work with?",
                a: "Today, the Plaud Note family — Note, Note Pro, and NotePin. Support for more recorders is on the roadmap. If you own a Plaud, you can sign in with your existing account and your recordings start syncing in under a minute.",
            },
            {
                q: "Is Riffado really open source? What does that mean for me?",
                a: "Yes — the full source is on GitHub under AGPL-3.0. In practice: you can read every line, run it on your own machine, fork it, and leave whenever you want. The AGPL only adds obligations if you offer Riffado as a service to other people. For personal or team use, it's just free, forever, with the code in the open.",
            },
            {
                q: "How long does setup take?",
                a: "Hosted: about sixty seconds. Sign up, connect your Plaud account, and recordings start syncing. Self-host: one docker compose command against the published image. Postgres is included. No build step, no manual schema work.",
                body: (
                    <p>
                        <strong className="text-foreground font-medium">
                            Hosted:
                        </strong>{" "}
                        about sixty seconds. Sign up, connect your Plaud
                        account, and recordings start syncing.{" "}
                        <strong className="text-foreground font-medium">
                            Self-host:
                        </strong>{" "}
                        one{" "}
                        <code className="font-mono text-[0.9em] text-foreground/90 bg-muted/60 rounded px-1.5 py-0.5">
                            docker compose up
                        </code>{" "}
                        against the published image. Postgres is included. No
                        build step, no manual schema work.
                    </p>
                ),
            },
        ],
    },
    {
        label: "How it works",
        items: [
            {
                q: "Which AI providers can I use?",
                a: "OpenAI or Groq for cloud transcription. Ollama or LM Studio if you want a model running entirely on your own machine — nothing leaves your laptop. Browser-based Whisper if you don't want to configure anything at all. Pick per recording; change your mind any time. For summaries, any OpenAI-compatible endpoint works — that includes OpenAI, Anthropic via OpenRouter, Groq, Together, Azure, and others.",
                body: (
                    <>
                        <p>
                            <strong className="text-foreground font-medium">
                                OpenAI or Groq
                            </strong>{" "}
                            for cloud transcription.{" "}
                            <strong className="text-foreground font-medium">
                                Ollama
                            </strong>{" "}
                            or{" "}
                            <strong className="text-foreground font-medium">
                                LM Studio
                            </strong>{" "}
                            if you want a model running entirely on your own
                            machine — nothing leaves your laptop.{" "}
                            <strong className="text-foreground font-medium">
                                Browser-based Whisper
                            </strong>{" "}
                            if you don't want to configure anything at all. Pick
                            per recording; change your mind any time.
                        </p>
                        <p className="mt-3 text-sm text-muted-foreground/80">
                            For summaries, any OpenAI-compatible endpoint works
                            — that includes OpenAI, Anthropic via OpenRouter,
                            Groq, Together, Azure, and others.
                        </p>
                    </>
                ),
            },
            {
                q: "Does this affect my recorder's warranty or break the official app?",
                a: "No. Riffado signs into your Plaud account the same way the official web app does — through Plaud's existing API. Nothing about the hardware changes, and the official Plaud app keeps working alongside Riffado.",
            },
            {
                q: "What happens if Plaud changes their API?",
                a: "Worst case, new syncs pause until we ship an update — historically a matter of hours to days, because the project is open source and actively maintained. Your existing recordings are unaffected: once a recording has synced, it lives on storage you control and never depends on Plaud's servers again.",
            },
        ],
    },
    {
        label: "Your data, your exit",
        items: [
            {
                q: "Can I move between hosted and self-host later?",
                a: "Yes, in one click. The full-backup export gives you a single archive with every recording, transcript, and summary. Restore it into a self-hosted instance, or back into the hosted version, with nothing lost. Easy to leave is the whole point — so you don't have to overthink which one to start with.",
            },
            {
                q: "Where does my data live on the hosted version?",
                a: "Encrypted at rest on storage we operate. You can export everything, any time, no questions. If you need a specific jurisdiction or your own bucket, self-hosting points the same code at infrastructure you fully control.",
            },
            {
                q: "What about HIPAA, privileged legal work, or regulated financial data?",
                a: "We don't self-attest HIPAA compliance, and you should be skeptical of any transcription product that does. The meaningful privacy claim belongs to your AI provider, not to us. For regulated work, the right setup is self-hosting Riffado and plugging in a provider that signs a BAA you've reviewed (OpenAI Enterprise, Azure Speech, Deepgram), or running a local Whisper model so nothing leaves your machine. We give you the knobs; you own the compliance story.",
            },
        ],
    },
];

const ZH_GROUPS: FaqGroup[] = [
    {
        label: "开始使用",
        items: [
            {
                q: "托管版 Riffado 真的免费吗？费用如何？",
                a: "是的，托管版的免费层将长期保持免费 —— 注册、连接您的录音设备并使用即可。未来我们计划推出额度更高、且享有转录优先权的 Pro 订阅版本，但免费版已有的所有额度绝不会因此过期或缩水。此外，如果您想要完全的控制和零金钱消耗，自托管部署 Riffado 也是永久免费的 —— 完全相同的源码，运行在您自己的机器上。",
            },
            {
                q: "使用本项目需要支付 AI 接口费用吗？",
                a: "不需要。Riffado 默认支持直接在您的浏览器本地运行 Whisper 转写 —— 无需 API 密钥，无需额外账号，更没有每分钟的扣费。如果您需要更高质量或极速的转写体验，可随时接入 OpenAI、Groq 或 Ollama。浏览器本地转写通道默认开启并保持永久免费。",
            },
            {
                q: "Riffado 支持哪些语音记录仪？",
                a: "目前支持 Plaud Note 录音设备家族（Note、Note Pro、NotePin）。后续计划适配和支持更多种类的硬件录音设备。如果您拥有一台 Plaud 设备，您可以在一分钟内登录并开始自动同步。",
            },
            {
                q: "Riffado 真的开源吗？这对我有何意义？",
                a: "是的 —— 完整的代码都发布在 GitHub 上，并采用 AGPL-3.0 协议。这意味着您可以阅读每一行代码、将其部署在您自己的服务器上、进行二次分叉开发，随时可以全量备份数据并撤离。AGPL 协议只在您向他人提供基于修改版的 SaaS 网络服务时才强制开源。个人或团队的正常使用是 100% 永久免费且公开的。",
            },
            {
                q: "配置部署需要多久？",
                a: "云托管版：大约 60 秒。注册账号、绑定您的 Plaud 邮箱，新录音即可开始自动同步。自托管版：仅需在您的服务器上针对发布好的镜像执行一条 docker compose 命令。已内置 Postgres 数据库，无需手动配置 schema 或编译过程。",
                body: (
                    <p>
                        <strong className="text-foreground font-medium">
                            云托管版：
                        </strong>{" "}
                        大约 60 秒。注册账号、绑定您的 Plaud
                        账号，新录音即可开始自动同步。{" "}
                        <strong className="text-foreground font-medium">
                            自托管版：
                        </strong>{" "}
                        仅需在您的服务器上针对发布好的镜像执行一条{" "}
                        <code className="font-mono text-[0.9em] text-foreground/90 bg-muted/60 rounded px-1.5 py-0.5">
                            docker compose up
                        </code>{" "}
                        命令。已内置 Postgres 数据库，无需手动配置 schema
                        或编译过程。
                    </p>
                ),
            },
        ],
    },
    {
        label: "运作原理",
        items: [
            {
                q: "我可以选择哪些 AI 提供商？",
                a: "对于云端语音转写，支持 OpenAI 或 Groq。如果您想实现 100% 数据不离开电脑的极致隐私保护，可以使用 Ollama 或 LM Studio 将模型完全运行在本地。若不想配置任何接口，直接使用免费的浏览器本地 Whisper。您可以针对每条录音自由点选并随时切换。对于智能总结，任何兼容 OpenAI API 规范的端点均可完美兼容 —— 这包括 OpenAI、通过 OpenRouter 接入的 Anthropic、Groq、Together、Azure 等等。",
                body: (
                    <>
                        <p>
                            <strong className="text-foreground font-medium">
                                OpenAI 或 Groq
                            </strong>{" "}
                            适用于高效云端语音转写。{" "}
                            <strong className="text-foreground font-medium">
                                Ollama
                            </strong>{" "}
                            或{" "}
                            <strong className="text-foreground font-medium">
                                LM Studio
                            </strong>{" "}
                            适用于在您本地电脑上运行完全离线的模型，数据绝不离开本地。{" "}
                            <strong className="text-foreground font-medium">
                                浏览器本地 Whisper
                            </strong>{" "}
                            适合无需任何 API
                            密钥配置的极简体验。您可以对每条录音自由选择，随时切换。
                        </p>
                        <p className="mt-3 text-sm text-muted-foreground/80">
                            对于智能总结和大纲生成，任何兼容 OpenAI API
                            格式的地址和密钥都可以灵活接入 —— 这意味着您可以配置
                            OpenAI、通过 OpenRouter 接入的
                            Anthropic、Groq、Together、Azure 等等。
                        </p>
                    </>
                ),
            },
            {
                q: "这会影响我设备的保修吗？或者导致原版官方 App 无法使用吗？",
                a: "不会。Riffado 登录和对接您 Plaud 账号的原理与官方 web 客户端完全一致 —— 通过 Plaud 官方公开的 API 进行。我们不对您的硬件做任何修改，官方 Plaud App 仍可与 Riffado 互不干扰地协同运行。",
            },
            {
                q: "如果 Plaud 官方更改了他们的 API 会怎样？",
                a: "最坏的情况下，在新版本推送前自动同步可能会短暂暂停 —— 鉴于我们项目是开源且有积极维护的社区，这通常只会在几小时到几天内得到解决。您已同步成功的录音完全不受影响：因为它们已经保存在了您自主掌控的存储端，未来极少依赖 Plaud 的服务器。",
            },
        ],
    },
    {
        label: "您的数据，您的自由",
        items: [
            {
                q: "我以后可以在云托管和自托管服务之间来回迁移吗？",
                a: "可以，只需一键点击。我们提供全量数据打包备份功能，允许您将所有的录音、转写文本和 AI 总结打包下载为一个完整归档，并可无缝导入至另一个新部署的自托管或云托管实例中，数据零损耗。我们认为“极易离开”是独立开源项目的核心要义，让您在开始选择时没有任何顾虑。",
            },
            {
                q: "在云托管版上，我的数据具体存放在哪里？",
                a: "在静态加密后，存放在由我们运营的云端对象存储上。您可以随时打包导出全部数据，不会有任何门槛。如果您需要特定的司法管辖区或完全私人的存储桶，自托管部署可以直接将代码对准您完全控制的基础设施。",
            },
            {
                q: "关于 HIPAA、司法特权（律师/记者）或金融合规要求？",
                a: "我们不进行商业化的 HIPAA 认证口头承诺，您应该对任何宣称这一点的第三方产品保持谨慎。核心隐私安全的保证本质上来自于您的 AI 接口提供商，而不是软件。对于受高度监管的敏感工作，最佳实践是自托管运行 Riffado，并接入签署了您已审核的 BAA 协议的提供商（如 OpenAI 企业版、Azure 语音服务等），或者直接运行本地 Whisper 离线模型以确保数据永远不离开您的物理设备。我们提供所有的配置开关，您可以完全自主设定安全合规边界。",
            },
        ],
    },
];

export function FAQ() {
    const { locale, t } = useTranslation();
    const GROUPS = locale === "zh-CN" ? ZH_GROUPS : EN_GROUPS;
    const ALL_ITEMS = GROUPS.flatMap((g) => g.items);

    const faqJsonLd = () => {
        return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: ALL_ITEMS.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: {
                    "@type": "Answer",
                    text: item.a,
                },
            })),
        };
    };

    return (
        <section id="faq" className="py-24 md:py-32 border-t border-border/40">
            {/* Rich-result eligibility. Sourced from the same `GROUPS`
                array as the visible copy -- single source of truth. */}
            <script
                type="application/ld+json"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload.
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(faqJsonLd()),
                }}
            />

            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto">
                    <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-4">
                        FAQ
                    </p>
                    <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3 text-balance">
                        {t("landing.faq.title")}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-10 md:mb-12 max-w-2xl">
                        {t("landing.faq.subtitle")}
                    </p>

                    <div className="rounded-2xl border border-border/60 bg-card/50 px-6 md:px-8 py-2 md:py-3">
                        <Accordion type="single" collapsible className="w-full">
                            {GROUPS.map((group, gi) => (
                                <div
                                    key={group.label}
                                    className={
                                        gi === 0
                                            ? "pt-4"
                                            : "pt-8 mt-2 border-t border-border/40"
                                    }
                                >
                                    <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70 mb-1">
                                        {group.label}
                                    </p>
                                    <div className="pb-4">
                                        {group.items.map((item, ii) => (
                                            <AccordionItem
                                                key={item.q}
                                                value={`faq-${gi}-${ii}`}
                                            >
                                                <AccordionTrigger>
                                                    {item.q}
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    {item.body ?? (
                                                        <p>{item.a}</p>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </Accordion>
                    </div>

                    <p className="text-sm text-muted-foreground mt-8 text-center">
                        {t("landing.faq.didntSee")}{" "}
                        <Link
                            href="https://github.com/riffado/riffado"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground underline-offset-4 hover:underline"
                        >
                            {t("landing.faq.readCode")}
                        </Link>
                        {t("landing.faq.or")}
                        <Link
                            href="https://github.com/riffado/riffado/issues/new/choose"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground underline-offset-4 hover:underline"
                        >
                            {t("landing.faq.openIssue")}
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </section>
    );
}
