# 桌面封装方案：防污涂料配方模拟器（V1）

> 日期：2026-10-10（Asia/Shanghai）  
> 状态：规划文档；**Electron V1 脚手架已落地**（`desktop/`，2026-10-10）  
> 目标：把现有本地面板 `ui/index.html` + `ui/data-snapshot.js` 包成可双击安装/打开的桌面应用（Windows / macOS / Linux）  
> 原则：**模拟 ≠ 实测**；诚实横幅与安全提示常驻；**禁止远程代码执行**；不编造性能数字。

---

## 1. 一句话推荐（V1）

**V1 用 Electron + electron-builder 先交货；Tauri 2 作为体积/默认沙箱更优的 V1.5–V2 迁移目标。**

理由（摘要）：前端已是纯静态页，无需 Node API；Electron 仅需 Node/npm，两周内更易出三端安装包；通过硬配置（`nodeIntegration: false`、只 `loadFile`、关远程内容）可满足「无远程代码」。Tauri 更轻、默认更严，但依赖 Rust 工具链，适合壳稳定后再迁。

---

## 2. Electron vs Tauri（针对本项目）

| 维度 | Electron | Tauri 2 |
|------|----------|---------|
| 前端适配 | 直接 `BrowserWindow.loadFile('ui/index.html')`；现有 `data-snapshot.js` 零改或极少改 | `frontendDist` / `devUrl` 指向 `ui/`；同样加载静态 HTML |
| 安装包体积 | 常见约 80–150+ MB（自带 Chromium） | 常见约 5–15 MB（用系统 WebView） |
| 工具链 | Node.js + npm（实验室机器更常见） | Rust + 平台依赖（Windows 还需 WebView2；macOS 需 Xcode CLT） |
| 两周交付风险 | **较低** | 中等（首次装 Rust/签名环境易卡住） |
| 默认安全面 | 需**显式关** Node 集成与远程加载；配置错了风险大 | 默认无 Node；权限模型更窄；仍需 CSP / 禁远程 |
| 数据刷新 | 壳外跑 `python3 ui/rebuild-snapshot.py`，再打包；或开发期挂载只读 `data/` | 同左；可选后续 Rust 命令调 Python（V1 不做） |
| 自动更新 | electron-updater 成熟（V1 **建议关掉**，见安全） | 插件可用（V1 同样建议先不做在线更新） |
| 适合本项目阶段 | **V1 推荐**：先「能双击打开」 | **V2 优选**：面板稳定后减体积、收紧沙箱 |

**结论**：V1 = Electron 务实封装；文档与目录布局按「日后可换 Tauri」设计（`ui/` 保持纯静态、壳代码与数据刷新脚本分离）。

---

## 3. 推荐架构（V1）

```
coating-simulator/
├── ui/                          # 唯一前端产物（保持可 file:// / 静态服务打开）
│   ├── index.html               # 含诚实横幅 + 安全提示
│   ├── data-snapshot.js         # 嵌入数据；面板只读此快照
│   ├── data-snapshot.json       # 同源 JSON（rebuild 产出）
│   └── rebuild-snapshot.py      # CSV → 快照（壳外执行）
├── data/                        # 源数据 CSV/md（权威编辑处）
├── desktop/                     # 【新建】桌面壳（V1 Electron）
│   ├── package.json
│   ├── main.js                  # 仅 loadFile 本地 ui；无远程
│   ├── preload.js               # 可选：空或极窄 contextBridge（V1 可不暴露 API）
│   └── electron-builder.yml     # win/mac/linux 目标
├── docs/
│   └── desktop-packaging-plan.md  # 本文件
├── DESIGN.md
└── README.md
```

**运行时数据流（V1）**

1. 维护者改 `data/*.csv`（或说明 md）。  
2. 在仓库根执行：`python3 ui/rebuild-snapshot.py` → 更新 `ui/data-snapshot.js` / `.json`。  
3. 本地验证：浏览器打开 `ui/index.html` 或 `npm start`（Electron）。  
4. `npm run dist` 打出安装包；安装包**内嵌**当时的 `ui/`，不联网拉数据。

用户日常：安装后双击应用 → 只读面板。改表/重打包是维护者流程，不是运行时联网。

---

## 4. Electron 脚手架要点（V1）

### 4.1 `desktop/package.json`（示意）

- `main`: `main.js`
- `scripts`:
  - `start`: 开发启动 Electron，加载 `../ui/index.html`
  - `dist`: `electron-builder`
  - `pack`: 目录产物（不造安装包，便于自测）
- `devDependencies`: `electron`, `electron-builder`
- **不要**把业务逻辑放进 Node；**不要**依赖运行时从 CDN 拉脚本。

### 4.2 `main.js` 硬性安全配置

```js
// 示意 — 实现时照此原则，勿复制未审代码当生产配置
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      // V1：可不设 preload；若设 preload.js，勿暴露 require/任意 IPC
    },
  });
  // 只加载本地文件，禁止默认打开任意 http(s)
  win.loadFile(path.join(__dirname, '../ui/index.html'));
  // 可选：拦截 will-navigate / setWindowOpenHandler，拒绝对外跳转
}
```

**禁止项（V1）**

- `nodeIntegration: true`
- `loadURL('https://...')` 加载业务页
- 远程 `BrowserView` / 未审扩展
- 自动下载并 `eval` / 动态 `import()` 远端脚本
- 在渲染进程暴露 `ipcRenderer` 到 `window` 且无白名单

### 4.3 诚实横幅与安全文案

- **不得**在壳层去掉或默认折叠 `ui/index.html` 顶栏「模拟 ≠ 实测」与「安全常驻」文案。
- 打包验收清单必须包含：打开应用后横幅可见；标签着色仍区分 `实测` / `待测` / `厂家标称` / `粗估观察` 等。
- 窗口标题建议：`防污涂料配方模拟器 · V0/V1（模拟≠实测）`。

### 4.4 与 `rebuild-snapshot.py` 的关系

| 场景 | 做法 |
|------|------|
| 改 lab / 短名单 CSV | `python3 ui/rebuild-snapshot.py` → 提交/拷贝更新后的 `data-snapshot.js` → 再 `npm run dist` |
| 航线元数据 | 脚本保留既有 snapshot 中 curated `routes`；勿在 Electron 内改航线 JSON 除非走同一 rebuild 流程 |
| 应用内「热更新 CSV」 | **V1 不做**（避免文件权限与诚实边界混乱）；V2 若做，仅只读打开用户所选本地文件并标「用户导入」 |

Python 保持系统依赖即可；安装包**不强制**内嵌 Python。

---

## 5. Tauri 路径（V1.5 / V2，并列记录）

若中途 Rust 环境已就绪且更在意体积，可改为：

```
desktop-tauri/
├── src-tauri/
│   ├── tauri.conf.json    # build.frontendDist = ../ui
│   ├── capabilities/      # 最小权限；无 http 客户端权限（V1）
│   └── src/lib.rs         # 默认空壳，不 exec 远程
└── （前端仍用仓库根 ui/）
```

- `tauri.conf.json`：`app.windows[].url` 指向本地 `index.html`；关闭不必要的插件（updater、shell、http）。
- CSP：`default-src 'self';`；禁止 `script-src` 指向 https CDN。
- 数据刷新流程与 Electron **相同**：仍用 `rebuild-snapshot.py`，再 `tauri build`。

迁移成本：几乎零前端改动；仅换壳与 CI。

---

## 6. 三端发布（Windows / macOS / Linux）

### 6.1 electron-builder 建议目标

| 平台 | 产物形态（V1） | 备注 |
|------|----------------|------|
| Windows | NSIS 安装包 `.exe` + 可选 portable | 优先 x64；WebView 不需要（自带 Chromium） |
| macOS | `.dmg`（arm64 / x64 或 universal） | 未签名会有「无法验证开发者」——文档写明右键打开或本地签名 |
| Linux | AppImage（首选）+ 可选 `.deb` | AppImage 免 root，适合实验室共用机 |

`electron-builder.yml` 示意字段：`appId`（如 `com.heting.coating-simulator`）、`productName`（防污涂料配方模拟器）、`directories.output`、`files` 显式包含 `../ui/**/*` 与壳文件、**排除** `data/*.md` 源说明非必须（面板只依赖 snapshot；可选只读附带 schema 供「关于」页——V1 可不附）。

### 6.2 签名与公证（务实预期）

- **V1 内测**：可无商店级签名；在 README 写清「仅本机/课题组安装」。
- **外发**：Windows Authenticode、macOS Developer ID + 公证再议；不阻塞两周内可运行包。

### 6.3 CI（可选，第二周）

- GitHub Actions / 本地脚本：矩阵 `windows-latest` / `macos-latest` / `ubuntu-latest`。
- 步骤：checkout → `python3 ui/rebuild-snapshot.py`（校验）→ `npm ci` → `npm run dist` → 上传 artifact。
- **禁止** CI 从不可信 URL 注入脚本进 `ui/`。

---

## 7. 安全基线（无远程代码）

V1 验收必须全部满足：

1. 业务 UI **仅**来自安装目录内 `ui/index.html` + 同目录 JS/CSS（当前为内联样式 + `data-snapshot.js`）。  
2. 无 `http://` / `https://` 业务资源加载（字体、统计、CDN 脚本一律不用）。  
3. `webPreferences`：`nodeIntegration: false`，`contextIsolation: true`，建议 `sandbox: true`。  
4. 导航守卫：拒绝 `will-navigate` 到非 `file:`；`setWindowOpenHandler` → `deny`。  
5. **关闭**自动更新，或仅「检查版本打开说明页」且不下载执行代码（V1 推荐完全关闭）。  
6. 不把 API Key、SDS 全文密钥等打进包；安全文案保持通用提示。  
7. 诚实边界：壳不得改写 snapshot 中的 `tag` 或静默填假实测数。

---

## 8. 诚实 / 安全横幅保留清单

| 检查项 | 要求 |
|--------|------|
| 顶栏「模拟 ≠ 实测」 | 应用启动默认可见，非隐藏设置 |
| 安全常驻句 | 溶剂通风、B 料 SDS、现配现用、UV-C 等与 `meta.safety` 一致 |
| 标签语义 | `实测` / `待测` / `厂家标称` / `粗估观察` / `相对等级` / `方案非实测` 等与 schema 一致 |
| 关于/版本页（可选） | 写明数据日期（`meta.updated`）、模拟器版本、非实验室报告 |

---

## 9. 近两周检查清单（可执行）

### 第 1 周 — 可运行桌面壳

- [x] 新建 `desktop/`：`package.json`、`main.js`、安全 `webPreferences`、仅 `loadFile('../ui/index.html')`
- [ ] `npm start`：窗口打开，横幅与三轨面板正常；离线可用
- [ ] 导航/新窗口拦截落地并手测（粘贴外链应被拒）
- [ ] `python3 ui/rebuild-snapshot.py` 跑通；改一行 CSV 后面板数字/行数变化符合预期
- [ ] README：增加「桌面开发启动」三步（进 `desktop` → `npm i` → `npm start`）
- [ ] DESIGN 决策日志记「V1 选 Electron」

### 第 2 周 — 三端产物与验收

- [ ] `electron-builder` 配置 win/mac/linux；本地至少打出 **Windows 或 Linux** 一种安装包并安装冒烟
- [ ] 安装后确认：无网络也可开；横幅在；lab 14 / routes 12 / rec 48（或当时快照数）一致
- [ ] 文档：`docs/desktop-packaging-plan.md` 与本清单勾选同步；签名「内测免签」说明写入 README
- [ ] （可选）Linux AppImage 丢到共用机试开
- [ ] （可选）草拟 Tauri 目录与 `tauri.conf` 草稿，**不**阻塞 Electron 发包
- [ ] 明确不做：应用内远程更新、远程脚本、自动填「实测」空单元格

---

## 10. 明确不做（V1）

- 不把模拟输出写成实验室合格判定。  
- 不内置远程配方云或未审插件市场。  
- 不在安装包内伪装「官方」商用涂料认证。  
- 不替代 SDS/TDS；安全句仅为提醒。  
- 不在无实测数据时用回归「生成」MPa/阻抗假值。

---

## 11. 相关路径

| 路径 | 作用 |
|------|------|
| [`ui/index.html`](../ui/index.html) | 面板 UI（诚实横幅） |
| [`ui/data-snapshot.js`](../ui/data-snapshot.js) | 嵌入数据 |
| [`ui/rebuild-snapshot.py`](../ui/rebuild-snapshot.py) | CSV → 快照 |
| [`DESIGN.md`](../DESIGN.md) | 产品设计与决策日志 |
| [`README.md`](../README.md) | 使用入口 |
| [`desktop/`](../desktop/) | Electron V1 壳（已建） |

---

*本文件为规划 + 脚手架进度；实现细节以 DESIGN 决策日志与 `desktop/README.md` 为准。*
