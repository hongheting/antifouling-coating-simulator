# 防污涂料配方模拟器 — 设计文档（公开版）

> 状态：开源演示；网页证据面板 **0.6.1**（桌面/Android 安装包仍为 0.6.0）。原则：**模拟 ≠ 实测**  
> 在线面板：<https://simulator.jassyhong.top>（主站卡片：<https://jassyhong.top/tools.html>）  
> 每个输出必须带诚实标签：实测 / 插值 / 文献界 / 厂家标称 / 相对等级 / 待测 / 粗估观察 / 方案非实测 / 公开资料 / 示例数据 / 框架推断（模型包络）

## 三轨架构

| 轨 | 名称 | 说明 |
|---|---|---|
| A | 实验室代理表 | 配方槽位与性能栏；空栏=尚无点。公开仓库为**示例数据**。 |
| B | 航线污损压力 | 气候带 + 相对等级示意图（非 AIS 实测轨迹）。 |
| C | 短名单 | 按航线相对压力对公开品类做定性拟合；禁止魔法分数。 |

另有：交互式配方沙盒（剂量 → 雷达 / 团聚风险 / 最近轨 A 槽；输出为模型包络，不是实测）、航线—船速—港停耦合、ISO 10890 与 PVC/CPVC 计算器、文献界（DOI/公开元数据）、商用·技术目录、行业动态周报、学者排行（OpenAlex 等公开库）。技术交流走 GitHub Discussions。

## 诚实原则

- 禁止编造拉拔 / EIS / HPLC / 航次污损率数字。
- 厂家标称 ≠ 改性样板实测；文献界 ≠ 本船性能。
- 公开仓库的轨 A / 轨 C **明确标注「示例数据 / example」**，见 `docs/example-data.md`。

## UI / 客户端

- 在线：<https://simulator.jassyhong.top>（`web/` 静态 nginx 镜像，构建上下文为仓库根，只拷贝 `ui/index.html`、`ui/data-snapshot.js`、`ui/world-land.js`）
- `ui/`：单页 HTML（数据嵌入 `data-snapshot.js`）。本地用浏览器打开；公开轨 A/C 仍是示例数据
- `desktop/`：Electron（安装包 0.6.0）
- `mobile/`：Capacitor Android + iOS 工程源码
- `miniprogram/`：微信小程序工具版

## 重建数据快照

```bash
python3 ui/rebuild-snapshot.py
```

## 安全常驻（通用）

溶剂通风；双组分体系查阅 SDS；粉体称量防扬尘；UV-C 护目。具体以材料 SDS 为准。
