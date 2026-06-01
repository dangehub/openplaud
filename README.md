<div align="center">

# 🎙️ OpenPlaud (中国区支持版)

**Plaud Note 设备的自托管 AI 语音转写界面**

*用你自己的 OpenAI 兼容 API 密钥替换 Plaud 的 20美元/月 AI 订阅服务*

> 💡 **本项目派生自官方 OpenPlaud**，在原版基础上**新增了对 Plaud 中国区账号 (`plaud.cn`) 的完整支持**。你可以使用你的国内 Plaud 账号直接登录同步录音！

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/typescript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)

[快速开始](#-快速开始) • [特性](#-特性) • [配置指南](#-配置指南) • [本项目差异](#-与官方原版的区别)

</div>

---

## 🌟 与官方原版的区别

官方的 OpenPlaud 仅支持全球版（`plaud.ai`，含亚太、欧洲等区域），**不支持**国内中国区注册的账号 (`plaud.cn`)。

本项目在官方基础上进行了如下定制化改进：
1. **支持中国区服务器 (`api.plaud.cn`)**：在绑定账号时，直接支持输入中国区账号验证码，或粘贴 `web.plaud.cn` 的 Access Token。
2. **修复特定区域限流 Date 格式问题**：修复了在访问国内节点时可能出现的限流解析异常。
3. **定制化的 Docker 镜像**：提供基于 `qudange/openplaud` 的专用镜像，无需自己编译，拉取即用。

---

## ✨ 特性

### 🔐 隐私与控制
- **私有化部署** - 对你的数据和 API 密钥拥有完全控制权
- **凭证加密** - 对所有敏感数据使用 AES-256-GCM 进行静态加密存储
- **无供应商锁定** - 你的录音，你自己的基础设施

### 🤖 AI 与 转写
- **通用 AI 支持** - 支持任何兼容 OpenAI 格式的 API：
  - OpenAI, Groq, Together AI, OpenRouter, 零一万物, DeepSeek, 智谱等
  - 本地模型：LM Studio, Ollama
- **浏览器本地转写** - 使用 Transformers.js 在客户端进行转写（零 API 成本！）
- **AI 标题生成** - 根据转写内容自动生成描述性标题
- **多 AI 提供商** - 可配置并在多个不同的提供商之间灵活切换

### 💾 存储与同步
- **灵活存储** - 本地文件系统 或 S3 兼容存储（AWS S3, 阿里云 OSS, 腾讯云 COS, MinIO, Cloudflare R2 等）
- **自动同步** - 自动从 Plaud 设备下载录音
- **自定义间隔** - 设置你自己的同步计划

### 📤 导出与通知
- **多种导出格式** - JSON, TXT, SRT, VTT 字幕格式
- **完整备份** - 一键导出所有数据
- **自动化 API & Webhooks** - 带有签名的 webhook 用于第三方自动化集成
- **浏览器与邮件通知** - 新录音的实时提醒

---

## 🚀 快速开始

### 前置条件
- 🐳 确保服务器已安装 Docker & Docker Compose
- 🎙️ 拥有 [plaud.cn](https://plaud.cn) 或 [plaud.ai](https://plaud.ai) 账号的 Plaud Note 设备
- 🤖 OpenAI 兼容的 API 密钥

### Docker 部署（推荐）

本项目已打包并发布到了 Docker Hub，你可以非常方便地使用定制镜像 `qudange/openplaud` 来运行。

**1. 创建目录并下载配置文件**

从本仓库下载最新的 `docker-compose.yml` 和 `.env.example` 文件：

```bash
mkdir openplaud && cd openplaud

curl -fLO https://raw.githubusercontent.com/dangehub/openplaud/main/docker-compose.yml
curl -fL  https://raw.githubusercontent.com/dangehub/openplaud/main/.env.example -o .env
```

**2. 生成密钥并编辑 `.env`**

你需要生成两个 32 字节的随机十六进制字符串作为安全密钥：

```bash
# 生成两个全新的密钥 — 复制并将它们粘贴到 .env 文件中
echo "BETTER_AUTH_SECRET=$(openssl rand -hex 32)"
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
```

打开 `.env` 文件并至少设置以下几项：

```env
BETTER_AUTH_SECRET=<粘贴你生成的密钥>
ENCRYPTION_KEY=<粘贴你生成的密钥>
APP_URL=http://localhost:3000

# 默认使用 latest 镜像
OPENPLAUD_VERSION=latest
```

**3. 启动应用**

`docker-compose.yml` 已经默认配置为从 `qudange/openplaud` 拉取镜像。直接执行：

```bash
docker compose up -d
```

**4. 访问 OpenPlaud**

在浏览器中打开 **http://localhost:3000** 并创建你的本地账号。引导向导将带你完成连接 Plaud 设备、配置 AI 提供商、存储和同步首选项的过程。在选择区域时，你可以选择**China (api.plaud.cn)**。

---

## 📖 配置指南

### 🔑 连接你的 Plaud 账号

OpenPlaud 默认直接使用你的邮箱登录 Plaud —— 就像官方 Plaud App 一样：

1. 输入你在 [plaud.cn](https://plaud.cn) 或 plaud.ai 注册的邮箱
2. 接收并输入验证码即可连接成功

> **⚠️ 注意：如果你是通过微信 / Apple / Google 等第三方方式登录**
> 
> 由于无法直接进行 OAuth 跳转，你需要：
> 1. 在浏览器新标签页登录 `web.plaud.cn`（或 `web.plaud.ai`）
> 2. 按 F12 打开开发者工具的 **网络(Network)** 面板，然后刷新页面
> 3. 点击任意发送到 `api.plaud.cn` (或 `api.plaud.ai`) 的请求
> 4. 找到 `Authorization` 请求头，复制 `Bearer ` 后面的超长 Token 字符串
> 5. 在 OpenPlaud 中选择 **"粘贴 Token (Paste token)"** 模式，选择对应区域并填入即可接入。

### 💾 存储选项
默认使用本地文件存储 (映射在 `/app/audio` 容器卷)。无需任何额外配置即可使用。
如果你希望节省服务器磁盘空间，可以随时在设置中切换到兼容 S3 的对象存储（如阿里云 OSS、腾讯云 COS、MinIO 等）。

### 🤖 AI 提供商设置
你可以填入任何兼容 OpenAI API 格式的地址和密钥。例如国内的 DeepSeek、通义千问等，只需将他们的 Base URL 和 API Key 填入设置中即可，非常灵活。

---

## 📝 许可证

**AGPL-3.0 许可证** – 详情见 [LICENSE](LICENSE) 文件

本项目为开源项目，修改、分发及提供基于本项目的网络服务均需遵循原项目的 AGPL 开源协议。
