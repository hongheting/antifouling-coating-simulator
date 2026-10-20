# 技术交流板块 / Tech Exchange (mobile 0.6.0+)

## 是什么 / What
手机 App 新增「技术交流」标签页：世界各地的研究者可分享 **新技术 / 新配方 / 新工艺**，并互相评论。
后端是本仓库的 GitHub Discussions，不需要自建服务器。

A "Tech Exchange" tab where researchers share new antifouling technologies, formulations and processes and comment on each other's posts. Backend: this repo's GitHub Discussions.

| 分类 Category | slug |
|---|---|
| 新技术 New Technology | `新技术-new-technology` |
| 新配方 New Formulation | `新配方-new-formulation` |
| 新工艺 New Process | `新工艺-new-process` |

**所有帖子均为「作者自述，未经验证」/ All posts are self-reported and NOT verified.** 模拟 ≠ 实测。

## 发帖模板 / Post template
App 内表单字段：类别、标题、简介、配方/工艺要点、关键数据及其性质（实测 / 文献 / 厂家标称 / 模型估计，可多选）、单位/来源/DOI、联系方式（可选，公开）、安全提示。
提交后渲染为 Markdown 正文，顶部固定写入「作者自述，未经验证」声明，通过 GraphQL `createDiscussion` 立即发布。

## 读取 / Reading
- **未登录**：先读游客中继 `GET /list`、`/discussion`（实时，缓存 60 s，显示「游客实时」）；失败再读快照 `public-data/discussions.json`（显示「快照 时间」）；再失败用本机缓存（「缓存 … 离线」）；都不行显示错误和「重试」。每个来源 8 s 超时。
- 快照：由 `.github/workflows/discussions-snapshot.yml`（每 30 分钟 + 讨论/评论事件 + 手动）调用 `.github/scripts/discussions-snapshot.js` 生成，内容变化才提交。
  镜像顺序：raw.githubusercontent（带 `?t=` 防缓存，最新）→ jsDelivr → fastly.jsDelivr；全部失败时用本机缓存。
- **已登录**：直接调用 GitHub GraphQL API，实时。

## 登录 / Login
GitHub OAuth App（client ID `Ov23lijC8lYn6WonSrE6`）**Device Flow**：
App 显示验证码 → 打开 `https://github.com/login/device` 输入 → App 轮询（遵守 `interval` / `slow_down`）获取 token。
- **没有 client secret**，也不应添加（Device Flow 不需要；secret 不能放进 App）。
- `github.com/login/*` 不支持 CORS，所以这两个请求走 Capacitor 原生 HTTP（`CapacitorHttp`）；GraphQL 用普通 fetch。
- Scope：**`public_repo`**。GitHub 的 OAuth scope 里没有单独的 Discussions 权限，无 scope 的 token 只能读公开信息，创建讨论/评论需要 `public_repo`（仅公开仓库，比 `repo` 小）。App 只用它在本仓库发帖、评论。
- Token 保存在 App 本地（localStorage），可随时“退出登录”；也可在 GitHub → Settings → Applications 撤销授权。

## 游客投稿 / Guest posting (no GitHub account)
- 未登录时，「发布」和评论框提供 **游客投稿**：填写昵称（公开）、联系方式（可选；只有勾选「公开联系方式」才会发布）。
- 由 Cloudflare Worker 中继（`relay/`）用维护者的细粒度 PAT 立即发布，正文开头为「游客投稿 · 昵称：X · 作者自述，未经验证」；App 识别该前缀显示 **游客** 徽章和昵称。
- 防滥用：每 IP 每小时 3 帖 / 10 评论、蜜罐、最短填写时间、长度与链接数上限、关键词黑名单、IP 封禁，可选 Turnstile。部署与管理见 [relay/README.md](../relay/README.md)。
- App 端地址由打包时的 `RELAY_URL` 决定；为空则不显示游客投稿。
- Guests post via the relay Worker; posts appear on GitHub under the maintainer's account with the guest prefix. See relay/README.md.

## 举报与管理 / Reporting & moderation
- 每个帖子有「举报」按钮，打开 GitHub 上的帖子页面，用 “…” → **Report content** 举报。
- 仓库所有者在 GitHub 上管理：编辑/删除/锁定/隐藏评论、屏蔽用户（Settings → Moderation options → Blocked users）、可设置 Interaction limits。
- 删除后的内容在下一次快照（≤30 分钟）从未登录视图消失；登录用户立即看不到。
- 游客帖/评论的删除、封禁 IP、紧急关闭见 [relay/README.md](../relay/README.md#管理--moderation维护者)。
- 不要发布未公开 / 保密数据。
