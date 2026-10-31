# 防污配方模拟器 Web — 部署交接（给 Jassy King）

- **时间（Asia/Shanghai）**：2026-10-31
- **版本**：`0.6.1`（静态证据面板；与手机/桌面同 UI 数据源）
- **分工**：镜像上下文 / Dockerfile / 本文档 → **防污配方模拟器 bot**；ACR push / `ca-coating-simulator` / 灰云 DNS / 主站卡片 → **Jassy King**

## 1. 架构（与 ref / tools / journal / protocol 同款）

| 项 | 值 |
|----|-----|
| 区域 | Azure `japaneast` |
| Resource Group | `rg-refcheck` |
| Container Apps 环境 | `cae-refcheck` |
| ACR | `refcheck84ed97.azurecr.io` |
| Container App | `ca-coating-simulator` |
| 镜像 | `coating-simulator-web:0.6.1`（可再打 `:latest`） |
| 完整标签 | `refcheck84ed97.azurecr.io/coating-simulator-web:0.6.1` |
| 监听 | `0.0.0.0:$PORT`（默认 **8080**） |
| 探活 | `GET /health` → JSON `{"ok":true,"service":"coating-simulator-web","version":"0.6.1"}`（免鉴权） |
| CPU / 内存 | 0.25–0.5 / 0.5Gi |
| 副本 | min 0 / max 1 |
| **自定义域名（已确认）** | **`simulator.jassyhong.top`** |
| DNS | Cloudflare **灰云 DNS only**（不要橙云） |
| Basic auth | **不需要**（公开只读科研工具页；与已公开发布 APK 同数据政策） |
| 先例 | `ref.jassyhong.top` / `tools.jassyhong.top` / `journal.jassyhong.top` / `protocol.jassyhong.top` |

本服务是 **nginx 静态站**（`ui/index.html` + `data-snapshot.js` + `world-land.js`），无 Python/SQLite，无需挂卷。

## 2. 构建上下文

- **仓库根**：克隆后的仓库根目录（含 `ui/` 与 `web/`；作者环境里曾为 `/workspace/coating-simulator/`）
- **Dockerfile**：`web/Dockerfile`（构建上下文必须是 **仓库根目录**，不是 `web/`）
- **相关文件**：`web/entrypoint.sh`、`web/nginx.conf.template`、`web/.dockerignore`
- **拷进镜像的静态文件**（仅三件）：`ui/index.html`、`ui/data-snapshot.js`、`ui/world-land.js`

```bash
cd /workspace/coating-simulator
docker build --platform linux/amd64 -f web/Dockerfile -t coating-simulator-web:0.6.1 .
# 登录 ACR 后：
# docker tag coating-simulator-web:0.6.1 refcheck84ed97.azurecr.io/coating-simulator-web:0.6.1
# docker push refcheck84ed97.azurecr.io/coating-simulator-web:0.6.1
```

本地冒烟（可选）：

```bash
docker run --rm -p 8080:8080 -e PORT=8080 coating-simulator-web:0.6.1
curl -s http://127.0.0.1:8080/health
# 浏览器打开 http://127.0.0.1:8080/ ：总览 / 轨 A·B·C / 行业动态可见；页面须保留「模拟 ≠ 实测」诚实标签
```

## 3. DNS（Cloudflare 灰云）

子域固定：**`simulator.jassyhong.top`**

1. TXT `asuid.simulator.jassyhong.top` = ACA `customDomainVerificationId`（现网常见值与姐妹工具相同：`27FAAF847C358A2E7596CB40F465F80FF389B1E67B20061E52F0106E564A2315`，以 `az` 查询为准）
2. CNAME `simulator.jassyhong.top` → `ca-coating-simulator.<env>.japaneast.azurecontainerapps.io`（以实际 FQDN 为准），**Proxy = DNS only（灰云）**
3. `az containerapp hostname add` + `hostname bind`（managed cert）

## 4. 主站科研助手卡片（由你改 hongheting.github.io）

对外文案建议：

- **name**：防污配方模拟器
- **description**：本地优先的防污涂层证据面板：实验室代理表（轨 A）、航线相对污损压力（轨 B）、证据短名单（轨 C），以及公开文献界、商用目录与行业动态。**模拟 ≠ 实测**——每个数值都带诚实标签（实测 / 厂家标称 / 文献界 / 模型估计），绝不把估计写成已测。
- **button**：打开模拟器
- **url**：`https://simulator.jassyhong.top`

## 5. 冒烟清单（上线后）

- [ ] `https://simulator.jassyhong.top/health` 返回 ok JSON
- [ ] 首页打开，三轨与行业动态可点
- [ ] 可见「模拟 ≠ 实测」/ 诚实标签
- [ ] `https://jassyhong.top/tools.html` 新卡片可点进子域

## 6. 原则

- 本页为**证据面板 / 科研辅助**，不是测量仪器。
- 不把厂家标称、文献界或模型估计写成「已测」。
- 密钥：本镜像无密钥、无 Basic auth。
