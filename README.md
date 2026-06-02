<div align="center">

# 🎙️ OpenPlaud / Riffado (中国区支持版)

**录音设备的开源 AI 语音转写与整理伴侣**

*用你自己低成本的 OpenAI 兼容 API 密钥，替代昂贵的官方 AI 订阅服务。*

> 💡 **本项目派生自上游开源项目 Riffado (原名 OpenPlaud)**，在此基础上**新增了对 Plaud 中国区账号 (`plaud.cn`) 的完整支持**。您可以使用您的国内 Plaud 账号直接登录、同步录音并免编译运行！

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/typescript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)

[快速开始](#-快速开始) • [项目差异](#-与上游原版的区别) • [配置指南](#-配置指南) • [官方文档](https://riffado.com/docs)

</div>

---

## 🌟 与上游原版的区别

上游的官方 Riffado (原 OpenPlaud) 仅支持全球版（`plaud.ai`，含亚太、欧洲等区域），**不支持**国内中国区注册的账号 (`plaud.cn`)。

本项目在官方基础上进行了如下定制化改进：
1. **支持中国区服务器 (`api.plaud.cn`)**：在绑定账号时，直接支持输入中国区账号验证码，或粘贴 `web.plaud.cn` 的 Access Token。
2. **移除 `wreq-js` 原生二进制依赖**：与上游保持同步，完全移除了 Rust 编写的原生模块，改用 100% 纯 TypeScript/JS 原生 `fetch` 方案，使得边缘部署与容器构建极速、轻量。
3. **修复特定区域限流 Date 格式问题**：修复了在访问国内节点时可能出现的限流解析与数据库插入异常。
4. **定制化的 Docker 镜像**：提供基于 `qudange/openplaud` 的专用镜像，无需自己编译，拉取即用。

---

## ⚡ 快速开始

您只需要在服务器上安装好 Docker，拥有一个 Plaud 账号以及任何兼容 OpenAI 接口的 AI 提供商密钥。

### 1. 创建部署目录与配置文件

在您的服务器上创建一个专属目录并进入：

```bash
mkdir openplaud && cd openplaud
```

在此目录下新建 `docker-compose.yml` 文件。为了极佳的数据安全，我们**去除了数据库的外部端口映射**（只在 Docker 内部安全联通），并将所有持久化数据统一放置在当前目录下的 `./data` 子目录中：

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: riffado-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: riffado
    volumes:
      # 数据库数据持久化在当前目录下的 data/db 中
      - ./data/db:/var/lib/postgresql/data
    # 🔒 安全设计：不向外网暴露 5432 端口，仅在 Docker 局域网内与主应用联通
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    image: qudange/openplaud:${OPENPLAUD_VERSION:-latest}
    container_name: openplaud-app
    restart: unless-stopped
    ports:
      # 🌍 整个项目在服务器上仅对外暴露主应用的 3000 端口
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/riffado
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      APP_URL: ${APP_URL:-http://localhost:3000}
      DISABLE_REGISTRATION: ${DISABLE_REGISTRATION:-}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      DEFAULT_STORAGE_TYPE: ${DEFAULT_STORAGE_TYPE:-local}
      LOCAL_STORAGE_PATH: ${LOCAL_STORAGE_PATH:-/app/audio}
    volumes:
      # 录音音频和转录数据持久化在当前目录下的 data/audio 中
      - ./data/audio:/app/audio
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      start_period: 30s
      retries: 3
```

### 2. 下载并配置环境变量

下载环境变量模版文件并命名为 `.env`：

```bash
curl -fsSL https://raw.githubusercontent.com/dangehub/openplaud/main/.env.example -o .env
```

接着，在终端运行以下命令，为密钥生成 2 个高强度的 32 位随机安全密钥：

```bash
openssl rand -hex 32
```

打开刚刚生成的 `.env` 文件，分别将这 2 个生成的密钥填入 `BETTER_AUTH_SECRET` 和 `ENCRYPTION_KEY` 中，并至少设置好以下基本项：

```env
# 身份验证及数据加密密钥（必须填入您生成的32位随机安全密钥）
BETTER_AUTH_SECRET=<第1个32位随机密钥>
ENCRYPTION_KEY=<第2个32位随机密钥>

# 数据库安全密码（请修改为强密码，用于容器内部联通）
POSTGRES_PASSWORD=your_strong_password

# 应用访问地址
APP_URL=http://<您的服务器IP>:3000

# 默认使用的镜像版本
OPENPLAUD_VERSION=latest
```

### 3. 一键启动应用

执行以下命令，Docker 将自动为您创建 `./data` 持久化文件夹并后台启动全部服务：

```bash
docker compose up -d
```

### 4. 初始化与访问系统

在浏览器中打开 **`http://<您的服务器IP>:3000/register`** 并创建您的本地管理员账号。系统引导向导将带您完成连接 Plaud 设备、配置 AI 提供商、配置存储和同步偏好的过程。当选择 Plaud 区域时，您可以直接选择 **China (api.plaud.cn)**。

* **升级更新**：后续如需更新，直接运行以下命令即可，数据库迁移及升级将在容器启动时自动安全运行，不丢失任何录音数据：
  ```bash
  docker compose pull && docker compose up -d
  ```

---

## 📖 连接 Plaud 账号指南

OpenPlaud 支持两种连接 Plaud 账号的方式：

### 🔑 邮箱验证码登录 (推荐)
直接使用您的邮箱进行 OTP 登录：
1. 输入您在 [plaud.cn](https://plaud.cn)（中国区）或 [plaud.ai](https://plaud.ai)（全球区）注册的邮箱。
2. 接收邮箱验证码并输入，系统将自动检测账号区域并进行加密绑定。

### 🔗 粘贴 Token 手动登录
如果您是通过微信、Apple 或 Google 等第三方 OAuth 渠道注册的 Plaud 账号，或者验证码发送失败，可以采用手动抓取 Token 的方式：
1. 在浏览器新标签页登录 [web.plaud.cn](https://web.plaud.cn)（或全球版 [web.plaud.ai](https://web.plaud.ai)）。
2. 按 `F12` 打开开发者工具的 **网络 (Network)** 面板，然后刷新页面。
3. 点击任意发送到 `api.plaud.cn` (或 `api.plaud.ai`) 的 API 请求。
4. 在请求头 (Headers) 中找到 `Authorization`，复制 `Bearer ` 后面那一长串 Token 字符串。
5. 在 OpenPlaud 绑定页面选择 **"粘贴 Token (Paste token)"** 模式，选择对应区域并填入即可连接。

> 🔒 **安全承诺**：每一行处理您凭证的代码均完全开源并可审计 —— [验证码发送路由](src/app/api/plaud/auth/send-code/route.ts) · [验证路由](src/app/api/plaud/auth/verify/route.ts) · [AES-256-GCM 加密模块](src/lib/encryption.ts)。所有敏感凭证都在入库前在您的服务器本地进行了强加密，绝不向任何第三方泄露。

---

## 💾 存储与 AI 配置

### 1. 存储选项
默认使用本地磁盘存储（保存在容器映射的 `/app/audio` 卷中），开箱即用。
如果您想节省本地磁盘空间，可以随时在设置中切换到兼容 S3 协议的对象存储（如阿里云 OSS、腾讯云 COS、MinIO、Cloudflare R2 等）。

### 2. 自由配置 AI
您可以配置任何兼容 OpenAI 格式的 AI 服务提供商：
* **云端模型**：DeepSeek (深度求索)、通义千问、Kimi、Groq、Together AI、OpenRouter 等。
* **本地模型**：LM Studio、Ollama、LocalAI 等。
* **零成本本地转写**：支持直接在浏览器中使用 WebGPU / WebAssembly (Transformers.js) 在您的设备本地运行 Whisper 转写，完全不产生任何 API 费用，绝对保护隐私！

---

## 📚 官方文档

完整的架构说明、配置项和环境变量列表均可参考官方文档 **[riffado.com/docs](https://riffado.com/docs)**：

- [环境变量配置参考](https://riffado.com/docs/self-hosting/environment-variables)
- [S3 兼容存储配置](https://riffado.com/docs/self-hosting/storage-s3)
- [邮件/SMTP 报警通知](https://riffado.com/docs/self-hosting/email-smtp)
- [数据备份与恢复](https://riffado.com/docs/guides/backup-and-restore)
- [Webhooks 自动流集成](https://riffado.com/docs/guides/automation-and-webhooks)
- [数据静态加密安全模型](https://riffado.com/docs/reference/encryption-at-rest)

---

## ⚖️ 免责声明 (Disclaimer)

* **非官方关联**：本项目是一个独立的开源项目。与 Plaud Inc. 或其任何子公司无任何关联、背书或赞助关系。“Plaud” 品牌及相关标志为其各自所有者的财产，在此仅用于描述性的互操作性说明（合理使用）。
* **第三方设备与服务**：本项目旨在与用户选择连接的第三方硬件和服务（包括 Plaud 录音设备、S3 存储和 AI 提供商）实现互操作。用户须自行负责遵守与其连接的任何第三方设备或服务相关的服务条款、可接受使用政策及法律法规。

---

## 📝 许可证

**AGPL-3.0 许可证** – 详情见 [LICENSE](LICENSE) 文件。
您可以自由分发、修改和私有化部署。如果您将修改后的版本作为网络服务提供给他人，必须公开您的修改源代码。

---

## 🙏 致谢

本项目原作者为 **Perier**，现由 Riffado 开源社区和各分叉版贡献者共同维护。
感谢所有对自托管和数据隐私充满热情的开发者！
