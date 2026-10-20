# 桌面版（Electron 0.6.0）

Windows / macOS / Linux 桌面壳，界面与手机 App 0.6.0 **完全相同**（`mobile/www`）：
行业动态与文献、配方/航线/实验模拟、**技术交流**（GitHub Discussions：GitHub 登录发帖评论 + 游客投稿）、
**在线公开数据更新**、**新版本提醒**、**界面热更新**。**模拟 ≠ 实测**：模拟结果一律标注为模拟/示意，不作实测呈现。

## 开发 / 测试

```bash
cd mobile && npm i && npm run sync-www      # 生成 mobile/www（RELAY_URL=… 可开启游客投稿）
cd ../desktop && npm i
npm run sync-ui                             # mobile/www → desktop/ui（+ web-version.json）
npm test                                    # OTA 签名/校验/解压/回滚单测
npm start
```

## 桌面端如何复用手机 UI

`preload.js` 通过 contextBridge 暴露一个最小的 `window.Capacitor.Plugins` 兼容层（固定 IPC 通道，无 Node、无通用网络）：

| 插件 | 桌面实现 |
|---|---|
| `App.getInfo` | 版本号 + versionCode 60（用于新版本提醒 / OTA 门槛） |
| `Browser.open` | 系统浏览器打开（仅 http/https/mailto/tel） |
| `CapacitorHttp.request` | 仅允许 GitHub OAuth device flow 两个固定 URL（无 CORS） |
| `CapacitorUpdater` | `ota-desktop.js`，见下 |

游客投稿 relay 只放行 App 来源；主进程只对 `afsim-guest-relay.hongheting.workers.dev` 改写 CORS 头。

## 界面热更新（OTA）——只接受签名包

- 清单 `public-data/web/manifest.json` 由 Ed25519 签名；**主进程**用内置公钥（与手机端同一把）校验，未签名/签名错误一律拒绝。
- zip 必须与签名清单中的 sha256、size 一致；安全解压（拒绝 `../`、绝对路径）到 `userData/ota/<版本>/www/`。
- 下次启动（或「立即重启」）生效；**每次启动都重新校验**签名和 sha256，失败回落内置界面。
- 新界面若未在启动后调用 `notifyAppReady`，下次启动自动回滚。安装包内置界面版本更新时，旧 OTA 包自动失效。
- 下载地址只允许 raw.githubusercontent / jsDelivr 三个镜像。

## 打包（Linux 上交叉编译 Windows）

需要 wine（含 32 位：`dpkg --add-architecture i386 && apt install wine wine32:i386`）。

```bash
npm run dist:win     # NSIS 安装版 + 便携版（x64），产物在 dist/
```

安装包未做代码签名，Windows SmartScreen 可能提示「未知发布者」，选择「仍要运行」。
