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
