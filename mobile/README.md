# 防污涂料配方模拟器 · Android（Capacitor）

离线可安装的 Android APK，用 Capacitor 包裹现有本地 HTML UI（与桌面 Electron 同源数据）。  
**模拟 ≠ 实测**；诚实标签语义未改。

| 项 | 值 |
|---|---|
| 包名 `applicationId` | `com.hongheting.coatingsimulator` |
| versionName | `0.5.0` |
| versionCode | `50` |
| minSdk / targetSdk | 22 / 34 |
| 产物 | `dist/coating-simulator-0.5.0.apk`（约 4.1 MB，debug 签名，可侧载） |

## 安装（侧载）

1. 把 APK 拷到手机（USB / 网盘 / 聊天附件均可）。
2. 在系统设置中允许「未知来源 / 安装未知应用」。
3. 点开 APK 安装；或用电脑：

```bash
adb install -r dist/coating-simulator-0.5.0.apk
```

中文文件名副本：`dist/防污涂料配方模拟器-0.5.0.apk`（内容相同）。

> 本包为 **debug** 签名，不适合上架 Google Play；日常自用侧载足够。

## 目录结构

```
mobile/
  assets/           # mobile.css、mobile-bridge.js（同步时注入 www）
  scripts/sync-www.js
  www/              # 由 ui/ 同步 + 注入的 Web 资源
  android/          # Capacitor Android 工程
  dist/             # 打好的 APK
  capacitor.config.json
```

数据与页面仍以 `../ui/` 为源；改 UI 后请重新 `npm run apk`。

## 本机构建依赖

- Node 20+ / npm
- OpenJDK 17 或 21（本机曾用 Debian 的 OpenJDK 21）
- Android SDK：`platform-tools`、`platforms;android-34`、`build-tools;34.0.0`

示例环境变量：

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
```

`android/local.properties` 需含：

```
sdk.dir=$ANDROID_HOME  # e.g. $HOME/Android/Sdk
```

（路径按本机 `ANDROID_HOME` 调整。）

## 重新构建

```bash
cd mobile
npm install
npm run sync-www          # 从 ../ui 复制并注入 mobile.css / mobile-bridge.js
npx cap sync android
cd android && ./gradlew assembleDebug
# 产物：android/app/build/outputs/apk/debug/app-debug.apk
# 或一键：
cd mobile && npm run apk
cp android/app/build/outputs/apk/debug/app-debug.apk dist/coating-simulator-0.5.0.apk
```

## 手机端改动（相对桌面 UI）

仅作用于 `www/` 注入层，**未改** `../ui/` 源文件：

- `viewport-fit=cover` + safe-area 内边距
- Tab / 子 Tab / chips：窄屏横向滑动、更大触控高度（约 44px）
- `.table-wrap` 明确横向滚动；表格 `min-width` 避免挤扁
- 输入框 `font-size: 16px`，减轻聚焦缩放
- `mobile-bridge.js`：`http(s)` 外链用 `@capacitor/browser`（失败则 `window.open`）走系统浏览器，对应桌面 `shell.openExternal`

## 外链与权限

- Manifest 含 `INTERNET`（打开文献 DOI / 行业链接等）
- 离线可看全部本地快照；无网时外链无法打开，UI 本身仍可用

## 版本对齐

与桌面 Electron `0.5.0` 对齐；`versionCode=32` 便于后续递增安装覆盖。


## iOS（macOS + Xcode）

```bash
npm install
npm run sync-www && npx cap sync ios
npx cap open ios
```

Bundle ID: `com.hongheting.coatingsimulator` · Display name: 防污涂料配方模拟器 · version 0.5.0 (40).
