# 文献界技术分类体系（V0.2）

> 用途：给 `literature-bounds.csv` 与面板「文献界」页做筛选导航。  
> 原则：分类按**技术路线/机制**，不是期刊栏目；一条文献可有次级工艺标签（`subcategory`）。  
> tag 仍为 `文献界`；**≠** 用户 示例双组分环氧 实测。  
> 2026-10-10：新增主类 `organic_marine_paint`（有机船用油漆：丙烯酸 / 环氧 / 松香锌 / 硅烷丙烯酸 SPC 等）。

## 主类（English key · 中文）

| key | 中文标签 | 覆盖范围（示例） |
|-----|----------|------------------|
| `organic_marine_paint` | 有机船用油漆（丙烯酸/环氧等） | 丙烯酸/锌丙烯酸/硅烷丙烯酸 SPC、松香锌粘合剂、水性自抛光乳液、环氧热固 SPC 油漆配方与综述 |
| `metal_alloy` | 金属/合金涂层 | 铜合金、高熵合金、含铜不锈钢等；工艺含 **3D 打印 / 激光熔覆 / HVOF·热喷涂 / LDED** |
| `silicone_mod_organic` | 硅改性有机涂层 | 环氧改硅、丙烯酸–硅酮自分层、PU 改硅酮等有机–硅氧烷杂化油漆 |
| `lse_foul_release` | 低表面能 / 污损释放（FRC） | PDMS 硅酮油漆、氟聚合物、经典 foul-release；藤壶/伪藤壶脱附 |
| `spc_copper` | SPC / 铜系杀生剂 | 自抛光铜漆、Cu/Zn 释放率、盐度效应、XRF 漆膜定量 |
| `hydrogel_zwitterionic` | 水凝胶 / 两性离子 | 亲水凝胶、zwitterion 网络、抗蛋白/抗定殖亲水膜 |
| `uvc_active` | UV-C 主动防污 | 船体/niche UV、LED 瓷砖、剂量阈值、材料协同 |
| `ultrasound` | 超声 / 导波 | 换能器振动、导波海试、藤壶幼体抑制 |
| `hybrid` | 混合 / 协同体系 | 涂层+UV、杀生剂+FRC、多机制联用（显式协同叙事） |
| `natural_biocide_ca` | 天然杀生剂 / CA@介孔 | 辣椒素等 NPA、介孔/纳米载体缓释；与课题 示例功能填料 **同族对照，≠ 用户实测** |
| `regulatory_economic` | 监管 / 经济影响 | ECHA/BPR 功效准则、ERA 方法、燃油与拖曳经济损失 |

## 次级工艺标签（`subcategory`，可选）

| subcategory | 说明 |
|-------------|------|
| `acrylic_spc` | 丙烯酸 / 酯水解自抛光油漆 |
| `acrylic_zinc` | 锌丙烯酸共聚物油漆 |
| `acrylic_metal_salt` | 丙烯酸金属盐树脂油漆 |
| `acrylic_waterborne` | 水性自抛光乳液油漆 |
| `acrylic_amphiphilic` | 两亲丙烯酸共聚油漆 |
| `silyl_acrylate` | 硅烷丙烯酸 / silicylacrylate 油漆 |
| `rosin_zinc` | 松香锌 / 松香粘合剂油漆 |
| `epoxy_spc` | 环氧热固自抛光油漆 |
| `laser_cladding` | 激光熔覆 |
| `hvof_thermal_spray` | HVOF / APS 等热喷涂 |
| `lded_am` | 激光定向能量沉积 / 增材金属 |
| `3d_print` | 3D 打印 |
| `pdms_frc` | 硅酮 FRC 油漆/弹性体 |
| `epoxy_siloxane` | 环氧–硅氧烷 |
| `acrylate_mq` | 丙烯酸–硅酮 / MQ |
| `cu_release` | 铜释放动力学 / 临界释放 |
| `field_marina` | 码头/现场盐度梯度 |
| `led_tile` | 嵌入式 UV-LED |
| `guided_wave` | 超声导波 |
| `capsaicin_carrier` | 辣椒素载体 / 多层膜 |
| `mesoporous_silica` | 介孔二氧化硅缓释 |
| `era_guidance` | 风险评估 / 监管指南 |
| `drag_economy` | 阻力与经济 |
| `review` | 综述（机制为主、无单一魔法% ） |

## 面板用法

- 主筛选：按 `category_key` / 中文芯片。  
- 次筛选：搜索框仍可搜 metric / DOI / 题名；可选再按 `subcategory`。  
- 重建：改 CSV 后跑 `python3 ui/rebuild-snapshot.py`（会嵌入 `literature_taxonomy`）。

## 诚实边界

- 分类便于浏览，**不改变**证据强度；金属涂层现场防污 ≠ 商船外壳 SPC 等价。  
- `organic_marine_paint` 文献中的 MPa / % / 月数均为**该文条件**，禁止写入 示例双组分环氧 实测行。  
- `natural_biocide_ca` 文献**不得**写成 示例功能化环氧（公开仓库已替换） 的拉拔/HPLC/微宇宙实测。  
- UV-C / 超声安全提醒见 `tech-uvc-ultrasound.md` 与面板诚实横幅。
