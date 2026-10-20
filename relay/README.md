# 游客投稿 Relay（Cloudflare Worker）/ Guest posting relay

让没有 GitHub 账号的人在 App 里直接发帖、评论（**立即发布，无预审**）。Worker 用维护者的细粒度 PAT 代为调用 GitHub GraphQL，正文开头固定加：

> **游客投稿 · 昵称：X · 作者自述，未经验证**

Lets people without a GitHub account post/comment from the app (published immediately). The Worker calls GitHub GraphQL with the maintainer's fine-grained PAT and prefixes every body with the line above.

## 接口 / API
| 方法 | 路径 | Body (JSON) |
|---|---|---|
| POST | `/post` | `nickname`(必填 ≤40), `contact?`(≤120), `publish_contact?`(bool), `category`(3 个 slug 之一), `title`(2–120), `body`(≤8000), `t0`(表单打开时间 ms), `website`(蜜罐，须为空), `turnstileToken?` |
| POST | `/comment` | `nickname`, `contact?`, `publish_contact?`, `discussionId`(GraphQL node id), `body`(≤3000), `t0`, `website`, `turnstileToken?` |
| GET | `/list?category=<slug\|all>&after=<cursor>` | 未登录读取帖子列表（30 条/页，只含 3 个分类），边缘缓存 60 s |
| GET | `/discussion?number=N` | 帖子正文 bodyHTML + 评论（最多 100），缓存 60 s |
| GET | `/` | 健康检查 |

返回 `{ok:true, url, number?, id}` 或 `{ok:false, error}`（中文提示）。

## 防滥用 / Anti-abuse
- 每 IP 每小时：发帖 3、评论 10（KV 计数，TTL 自动过期）
- 蜜罐字段 `website`：机器人填了就“假成功”丢弃
- 最短填写时间：发帖 8 s、评论 3 s；表单超过 6 h 失效
- 长度上限、链接 ≤5 个、关键词黑名单（博彩/广告/色情，中英文；可用 `BLOCKLIST_EXTRA` 追加）
- 昵称去掉 Markdown 和 @ 提及；只接受这 3 个分类；评论只能评本仓库这 3 个分类、且未锁定的帖子
- 可选 Cloudflare Turnstile：设置 `TURNSTILE_SECRET` 后强制校验（App 需同时接入 Turnstile 组件后才能用，当前 App 未接入，开启前请先改 App）
- 封禁：`GUEST_BANNED_IPS`（wrangler.toml 变量，逗号分隔）或 KV 键 `ban:<IP>`
- 读接口：每 IP 每分钟 120 次（Worker 内存计数，不写 KV，不占 KV 写额度）
- CORS 只允许 `capacitor://localhost`、`https://localhost`、`http://localhost`

**联系方式**：不勾选「公开联系方式」时不会发布，只记录在 KV 审计日志 `log:*`（含 IP、昵称、帖子链接），90 天后自动删除，仅维护者可见。

## 部署步骤 / Deploy
需要：Cloudflare 免费账号、Node 18+。
```bash
cd relay
npm install                      # 安装 wrangler
npx wrangler login               # 浏览器授权 Cloudflare
npx wrangler kv namespace create RELAY_KV
#   → 把输出的 id 填进 wrangler.toml 的 [[kv_namespaces]] id
npx wrangler secret put GH_TOKEN # 粘贴细粒度 PAT（见下）
# 可选：npx wrangler secret put TURNSTILE_SECRET
npx wrangler deploy              # 得到 https://afsim-guest-relay.<你的子域>.workers.dev
curl https://afsim-guest-relay.<你的子域>.workers.dev/   # {"ok":true,...}
```
然后打包 App：
```bash
cd ../mobile && RELAY_URL=https://afsim-guest-relay.<你的子域>.workers.dev npm run apk
```

### GH_TOKEN：最小权限细粒度 PAT / Minimal fine-grained PAT
GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate：
- Resource owner：`hongheting`；Repository access：**Only select repositories** → `antifouling-coating-simulator`
- Repository permissions：**Discussions: Read and write**（Metadata: Read-only 会自动带上）；其它全部 No access
- 设置到期时间（如 1 年），到期前重新生成并 `wrangler secret put GH_TOKEN`

注意：游客帖在 GitHub 上的作者显示为 PAT 所有者（hongheting），App 会根据前缀显示「游客」徽章和昵称。

## 管理 / Moderation（维护者）
- **删帖**：GitHub 打开帖子 → 右侧 “Delete discussion”；**删评论**：评论右上角 “…” → Delete。也可 Lock conversation / Hide（标记为 spam 等）。
- **封禁某人**：在 Cloudflare 后台 Workers KV → RELAY_KV 里找 `log:*` 记录拿到 IP，新增键 `ban:<IP>`=`1`；或 `npx wrangler kv key put --binding RELAY_KV "ban:1.2.3.4" 1`。
- 加黑名单词：改 `wrangler.toml` 的 `BLOCKLIST_EXTRA` 后 `npx wrangler deploy`。
- 紧急关闭游客投稿：`npx wrangler secret delete GH_TOKEN`（之后返回 503，App 提示失败），或吊销 PAT。
- 删除后的内容 ≤30 分钟从未登录视图消失（快照更新）。

## 测试 / Tests
`npm test`（node:test，模拟 fetch 与 KV，不访问 GitHub）。
