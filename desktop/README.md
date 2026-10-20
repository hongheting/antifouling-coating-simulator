# 桌面壳（Electron V1）

把仓库根目录的静态面板 `../ui/index.html` 包成可双击打开的桌面应用。  
**模拟 ≠ 实测**；壳不会改 snapshot 标签或填假实测数；**禁止远程代码**。

规划全文：[`../docs/desktop-packaging-plan.md`](../docs/desktop-packaging-plan.md)

## 前提

- Node.js + npm（建议 Node 18+）
- 已有 `../ui/index.html` 与 `../ui/data-snapshot.js`

## 开发启动

```bash
cd desktop
npm install
npm start
```

窗口标题：`防污涂料配方模拟器 · V0/V1（模拟≠实测）`。应看到顶栏诚实横幅与轨 A/B/C。

## 刷新面板数据（壳外）

改 `../data/*.csv` 后：

```bash
cd desktop
python3 ui/rebuild-snapshot.py
```

再 `npm start` 或重新 `npm run dist`。安装包内嵌当时的 `ui/`，运行时不联网拉数据。

## 打包

```bash
cd desktop
npm run pack    # 目录产物（不造安装包，便于自测）
npm run dist    # 按 electron-builder.yml 打 win/mac/linux 目标
```

产物在 `desktop/dist/`。`ui/` 经 `extraResources` 打进 `resources/ui/`；`main.js` 在打包态用 `process.resourcesPath` 加载。

### 平台说明（内测）

| 平台 | 默认目标 | 备注 |
|------|----------|------|
| Windows | NSIS `.exe` + portable | 未签名时可能有 SmartScreen 提示 |
| macOS | `.dmg` | 未签名需右键打开 |
| Linux | AppImage + `.deb` | AppImage 适合共用机 |

V1 **关闭**自动更新；仅本机/课题组安装。

## 安全基线（勿改坏）

- `nodeIntegration: false`，`contextIsolation: true`，`sandbox: true`
- 仅 `loadFile` 本地 UI；非 `file:` 导航与新窗口一律拒绝
- `preload.js` 为空，不暴露 IPC / `require`
- 勿去掉 `ui/` 顶栏「模拟 ≠ 实测」与安全提示

## 相关路径

| 路径 | 作用 |
|------|------|
| `main.js` | 主进程窗口与导航守卫 |
| `preload.js` | V1 空预加载 |
| `electron-builder.yml` | 三端打包配置 |
| `../ui/` | 唯一前端（可继续双击 html 使用） |

## Windows 产物（本机）

本机构建环境为 Linux；Windows 包需 Wine（含 `wine32:i386`）交叉打：

```bash
# 一次性（Debian/Ubuntu）
sudo dpkg --add-architecture i386
sudo apt-get update
sudo apt-get install -y wine wine64 wine32:i386

cd desktop
CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist:win
```

最新产物：v0.1.2 portable `desktop/dist/防污涂料配方模拟器 0.1.2.exe`（2026-10-19，文献界/商用·技术条目可点击外链，链接来源见 `data/commercial-links.csv`；本机 Linux 构建：`CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --win portable --x64 -c.win.signAndEditExecutable=false`，无需 Wine）。

历史 V0.1.0 产物（`desktop/dist/`，已不在箱体上）：

| 文件 | 用途 |
|------|------|
| `防污涂料配方模拟器 Setup 0.1.0.exe` | NSIS 安装包（可选目录） |
| `防污涂料配方模拟器 0.1.0.exe` | Portable 免安装 |
| `win-unpacked/` | 未打包目录（含 `resources/ui/`） |

未做 Authenticode 签名：Windows 可能出现 SmartScreen /「未知发布者」——右键属性或「仍要运行」即可（课题组内测）。用户本机若为 Windows，也可在该机直接 `npm run dist:win`，无需 Wine。

