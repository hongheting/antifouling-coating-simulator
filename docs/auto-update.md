# 在线更新机制 / Auto-update (app 0.5.0+)

## 原则
- 安装包内置**完整数据**（作者私有版含真实实验室表；公开仓库为示例数据）。
- 在线**只更新公开板块**：行业动态（全部周）、文献界 + OpenAlex 补充、商用目录/分类/技术摘录、链接统计、学者排行、航线几何。
- **从不**在线下发或覆盖：轨 A 实验室表、轨 C 短名单、航线压力说明文本、诚实/安全元信息。

## 文件
| 文件 | 作用 |
|---|---|
| `public-data/latest.json` | `data_version`（`YYYY-MM-DD.HHMM`，按字符串比较）、`app.versionCode/versionName/apk_url/notes` |
| `public-data/feed.json` | `schema=1`、`version`、`generated_at`、`min_app`、`counts`、`sections{...}` |
| `ui/build-public-feed.py` | 从 `ui/data-snapshot.json` 生成上述文件；含私有词扫描，命中即失败（exit 2），残留记录整条剔除 |

## 客户端流程（`mobile/assets/updater.js`）
1. 页面脚本之前同步执行：若 localStorage 缓存的 feed 比内置 `BUNDLED_DATA_VERSION` 新，则合并（文献按 `bound_id` upsert，其余公开板块整体替换）。
2. 启动约 1 秒后 / 点页脚「检查更新」：按顺序请求镜像（各 6 秒超时）  
   `cdn.jsdelivr.net` → `fastly.jsdelivr.net` → `raw.githubusercontent.com`（仅 raw 加 `?t=` 防缓存）。
3. `data_version` 更新 → 下载同镜像 `feed.json` → 校验结构 → 存缓存 → 重新加载页面 → 提示「行业动态与文献已更新至 …」。
4. `app.versionCode` 大于已安装版本（`@capacitor/app getInfo().build`）→ 弹窗「发现新版本…」，「去下载」用系统浏览器打开 `apk_url`；「稍后」后自动检查 24 小时内不再提示（手动检查不受限）。
5. 离线顺序：缓存 → 内置。页脚显示「数据版本 … ·上次检查 …」。

jsDelivr 对 `@main` 可能缓存 12–24 小时，属预期；需要立即生效可到 jsdelivr purge 页面清除缓存。

## 发布流程
```bash
python3 ui/rebuild-snapshot.py      # 更新 data/ 后
python3 ui/build-public-feed.py     # 生成 public-data/，扫描必须 CLEAN
git add public-data && git commit && git push
```
新 APK：提高 `versionCode`，同步改 `build-public-feed.py` 里的 `APP`，然后在 GitHub Release 上传 APK（`apk_url` 指向 releases/latest）。

## 界面热更新（OTA，App 0.6.0+）/ Live web-code updates
不重装 APK 就能更新界面和 JS（HTML/CSS/JS 整包）。自建、免费：插件 `@capgo/capacitor-updater`（手动模式），**不用 Capgo 云**，`updateUrl/statsUrl/channelUrl` 全部为空 → 不上报任何统计。

**文件**：`public-data/web/manifest.json` + `public-data/web/bundle-<webVersion>.zip`（`www/` 整包，`index.html` 在根目录；只保留最近 2 个包）。
```json
{ "webVersion": "0.6.0+2", "webBuild": 2, "file": "bundle-0.6.0+2.zip", "sha256": "<zip 的 sha256 hex>",
  "size": 258662, "minNativeCode": 60, "notes": "…", "sig": "<Ed25519 签名 base64>", "created_at": "…" }
```
签名内容：`"afsim-ota-v1\n" + JSON.stringify({file, minNativeCode, maxNativeCode?, notes, sha256, size, webBuild, webVersion})`（键按此顺序）。

**安全**：
- App 内置 Ed25519 公钥（`mobile/assets/ota.js`），用 tweetnacl 验签；验签失败直接放弃。
- 验签通过后，把签名里的 `sha256` 交给原生下载器；原生下载完重新计算 zip 的 SHA-256，不一致就拒绝。镜像被篡改也装不上。
- 私钥只在维护者机器 `/workspace/secrets/afsim-ota-ed25519.pem`（600），**绝不进仓库**。私钥丢失 = 只能发新 APK 换公钥。
- 每次启动调用 `notifyAppReady()`；新包 10 秒内没起来，原生自动回滚到上一个能用的包。装新 APK（versionCode 变化）时清掉旧的热更新包。

**客户端流程**（`ota.js`，在 updater.js 之后加载）：启动约 4 秒后 / 点「检查更新」→ 依次请求镜像 `raw.githubusercontent`（`?t=` 防缓存）→ jsDelivr → fastly → 验签 → 判断 `webBuild` 比当前大、且 `minNativeCode ≤ 已装 versionCode`（`maxNativeCode` 可选）→ 下载 → 设为下次启动包 → 弹窗「界面已更新，重启生效」（立即重启 / 下次启动）。页脚显示「数据版本 … · 界面 0.6.0+N」。

**发布一次热更新**：
```bash
cd /workspace/coating-simulator/mobile
# 改 ui/ 或 mobile/assets/ 后：
npm run ota -- --notes "修复xx；优化yy"      # webBuild+1，构建 www、打包、签名，写入两份 public-data/web/
npm test                                     # 验签 / sha256 自检
# 然后把 public-data/web/ 推到公开仓库 main（raw 立即可用，jsDelivr 可能晚 12–24 h）
```
- 只能改 Web 层（HTML/CSS/JS/数据快照）。新增原生插件、改权限、改 Android 配置 → 必须发新 APK，并用 `--min-native <新versionCode>`。
- `npm run ota` 只允许在作者私有主项目中运行（防止用示例数据的公开副本覆盖用户数据）。

⚠️ **数据说明**：热更新包和已发布的 APK 一样，是用作者主项目的 `www/` 构建的，**包含真实实验室数据**（作者已选择公开发布真实数据版 APK）。所以 `public-data/web/*.zip` 里的数据**不是**仓库其它位置的示例数据。
*The OTA bundles under `public-data/web/` are built from the author's main project and contain the same real data as the published APK, not the example data used elsewhere in this repo.*
