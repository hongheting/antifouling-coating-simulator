# 商用技术分类体系（V0）

> 用途：给 `commercial-products.md`、`recommendation-shortlist.csv`（`CATALOG-GLOBAL-V0`）与面板「商用·技术」页做筛选。  
> 标签仍为 `厂家标称` / `公开资料` / `文献界`；**≠** 用户 示例双组分环氧 实测。  
> 分类按**公开技术叙事**，不是性能魔法分。

## 主类（English key · 中文）

| key | 中文标签 | 覆盖范围（示例） |
|-----|----------|------------------|
| `spc_silyl_acrylate` | 硅烷丙烯酸 SPC | SeaQuantum、Intersmooth Si、A-LF-SEA、Dynamic 等硅烷/硅基水解 SPC |
| `spc_hydrolysis` | 水解 / 羧酸盐 SPC | Globic、Oceanic+、SEAFLO NEO、Ecofleet 等水解抛光叙事 |
| `spc_copper` | 铜系杀生剂 SPC（总称） | 含铜 SPC 家族通称；与释放文献界对照 |
| `frc_silicone` | 硅酮污损释放（FRC） | Sigmaglide、纯硅酮 FRC |
| `frc_fluoro` | 氟聚污损释放 | Intersleek 1100SR 等氟聚合物 FRC |
| `hybrid_hydrogel` | 水凝胶硅酮 + 杀生剂 | Hempaguard X7 等 hybrid |
| `lpp_linear` | 线性抛光 LPP | Intercept 7000 / Lubyon |
| `copper_free_ablative` | 无铜消融 | SeaVoyage Copper Free 等 |
| `yacht_spc` | 游艇 SPC | SEAJET 等游艇线（≠ 商船坞期） |
| `tech_uvc` | UV-C 辅助技术 | niche / LED / 传感器；非整船唯一方案 |
| `tech_ultrasound` | 超声 / 导波辅助 | 换能器导波；闲置辅助叙事 |
| `asian_silyl_spc` | 日系硅基 SPC | TAKATA QUANTUM / X-mile / SEAFLO SL 等 |

## 面板用法

- 「商用·技术」页：分类芯片筛选目录短名单与产品线。  
- 重建脚本从本文件解析主类表，并统计 `category_key` 计数。

## 诚实边界

1. 厂商 docking interval / speed loss % / 燃油节约 % 均为**公开宣称**。  
2. 课题微宇宙「Hempel」**未鉴定牌号**，勿自动映射为本分类某一产品。  
3. UV-C / 超声有安全旗；不可替代合规防污漆登记。
