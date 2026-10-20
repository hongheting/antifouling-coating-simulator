# 防污涂料模拟器 — 字段 Schema（V0）

> 创建：2026-10-10（Asia/Shanghai）  
> 原则：每个可报告数值旁必须有 **tag**；无可靠数据则留空，**禁止编造实测**。  
> 锚点：课题 KB 公开 GCB / 航线框架笔记（已去除内部路径）公开 GCB / 航线框架笔记（已去除内部路径）

---

## 0. 标签枚举（必填其一，可多列各用）

| tag | 含义 | 何时用 |
|-----|------|--------|
| `实测` | 用户/课题组按约定方法测得 | 有完整方法、n、破坏模式等记录 |
| `插值` | 由相邻实测点线性/简单插值 | 仅在端点均为实测时；须注明插值假设 |
| `文献界` | 公开文献给出的范围/上下界 | 附 DOI/引用；不可当作本样板结果 |
| `厂家标称` | TDS/厂家技术资料宣称 | 如 示例双组分环氧 拉拔约 4.9–6.6 MPa；≠ 功能化样板 |
| `相对等级` | 相对对照的等级（低/中/高或 1–5） | 气候压力、微宇宙相对污损等；非绝对分数 |
| `框架推断` | 由 GCB/课题框架定性映射 | 航线策略、冷端偏置等；非现场实测 |
| `文献点名` | 综述/知识包点名的地点或文献端点 | 如 Canadian Arctic、Antarctica；≠ Table 1 港序实测 |
| `待测` | 计划测但尚无数据 | 空值占位 |
| `粗估观察` | 早期目视/粗略估计 | 如微宇宙早期覆盖粗估；**不可当论文真值** |
| `方案非实测` | 工艺/配方方案或设计几何 | 如 HPLC A/V、筛选用量讨论；不是性能结果 |

**不确定度与溯源列（各表尽量具备）**

| 列 | 说明 |
|----|------|
| `uncertainty` | 区间、SD、或文字（如「半定量」「方法未定」） |
| `source` | 文件路径、TDS 版本、DOI、实验记录 ID |
| `n` | 独立样板/瓶数；未知写空 |
| `note` | 方法、破坏模式、几何、对照、失效注意 |
| `safety_flags` | 自由文本：溶剂/NCO/UV-C 等提醒 |

---

## 1. 轨 A — 实验室输入 / 输出

### 1.1 配方标识与输入

| 字段 | 类型 | 说明 |
|------|------|------|
| `formulation_id` | string | 唯一 ID，如 `EX-FILLER-1PCT` |
| `basecoat` | enum | `示例双组分环氧` \| `示例丙烯酸（虚构）` \| `其他` — **两条路线勿混** |
| `mix_ratio` | string | 如 `5:1`；须注明质量或体积；以最新 TDS 核实 |
| `filler_wt_pct` | number \| empty | 相对**涂料总固体**的 wt%；筛选讨论起点 0/1/2/3 |
| `dispersant_rel_pct` | number \| empty | 相对颗粒质量 %；讨论起点 5/7.5/10 |
| `DFT_um` | number \| empty | 干膜厚度 μm；目标约 30±5（示例双组分环氧 语境） |
| `substrate` | string | 默认 `6061-Al` |
| `cure_note` | string | 固化/适用期；现配现用；保守 3h 内（以 TDS 为准） |

### 1.2 输出代理（均需对应 `*_tag`）

| 字段 | 单位/形式 | tag 列 | 备注 |
|------|-----------|--------|------|
| `pull_off_MPa` | MPa | `pull_off_tag` | 报告破坏模式；厂家 4.9–6.6 仅 `厂家标称` |
| `eis_note` | 文本或关键阻抗指标 | `eis_tag` | `|Z|0.01Hz`、Rcoat、Rct 等；无数据则空 |
| `hplc_analyte_note` | μg/mL 或 μg/cm²（注明） | `hplc_tag` | 几何：六面 17.5 cm² / 100 mL，A/V=0.175；公式见课题 KB §7 |
| `microcosm_relative_fouling` | 相对等级或粗估覆盖 | `microcosm_tag` | 相对裸板/Hempel；早期覆盖粗估用 `粗估观察` |

CSV 实现见 `lab-proxy-table.csv`（另含 `source`, `n`, `note`, `safety_flags`, `disadvantage_notes`）。**2026-10-10**：**33** 数据行——示例双组分环氧 边界/槽位 + HPLC/EIS/拉拔方法元数据 + 微宇宙粗估3 + 无铜丙烯酸成功方/掺量梯度/2× + 历史含铜方 + CA 粉体 M0–M3/TGA/BET + UV-C/US 协议。无虚构实测 MPa/阻抗/浓度；唯一 MPa 为厂家标称 4.9–6.6。

### 1.3 设计几何 / 非性能（可记在 note 或单独设计表）

- HPLC：样板 25×25×5 mm 六面涂；暴露几何面积 **17.5 cm²**；V=100.0 mL；取样 1.00 mL 补液 — tag=`方案非实测`。
- 释放质量平衡公式只校正取样带走的 CA，不校正挥发/降解/吸附 — 写入 `note`。

---

## 2. 轨 B — 气候 / 航线输入 / 输出

### 2.1 输入

| 字段 | 说明 |
|------|------|
| `profile_id` | 剖面 ID |
| `climate_zone` | `热带/赤道暖水` \| `温带` \| `冷水/极地` \| `混合航线` \| `待填` |
| `route_sequence` | 港口或区段序列（可空） |
| `dwell_or_speed_note` | 驻留时间、航速/静止比例（能填多少算多少） |
| `season_note` | 季节窗口（温带尤其重要） |

### 2.2 输出（均为相对，非绝对污损速率）

| 字段 | 说明 |
|------|------|
| `rel_fouling_pressure` | `低`/`中`/`高` 或 1–5；tag 固定倾向 `相对等级` |
| `dominant_adhesion_strategy` | GCB 三策略之一（可并存提示）：`rapid-turnover colonizers` / `seasonal opportunists` / `persistence-oriented attachers` |
| `growth_adhesion_position` | 定性：偏 growth / 中间 / 偏 adhesion |
| `coating_implication` | 定性匹配建议（抗沉降+易脱附 vs 耐久+抗持久附着等） |
| `uncertainty`, `source`, `note` | 框架来自 GCB 知识包；**非现场实测压力** |

冷水/极地：**整体压力偏低**，但成功定殖者偏 persistence-oriented — 禁止写成「极地高污损」。

实现模板：`climate-route-profile.md`。

---

## 3. 轨 C — 推荐短名单字段

| 字段 | 说明 |
|------|------|
| `rank` | 整数排序（同工况内）；非全局魔法分 |
| `name` | 涂料/方案名 |
| `type` | `homemade` \| `commercial` |
| `matched_track_A_id` | 可选，关联 formulation_id |
| `matched_profile_id` | 可选，关联气候/航线剖面 |
| `evidence_links` | 课题路径、DOI、TDS 链接；分号分隔 |
| `evidence_tag` | 用 §0 枚举标明证据性质 |
| `caveats` | 局限、安全、适用边界 |
| `note` | 其他 |

实现：`recommendation-shortlist.csv`（12 个 profile × 4 行：10 走廊 + `STUB-CAN-ARCTIC` + `STUB-ANTARCTICA`）；排序说明见各 `recommendation-*-V0.md`。

---

## 4. 用户流程（一页）

1. 选基漆与剂量（轨 A 输入）→ 查 `lab-proxy-table` 带标签区间（无点则「待测」）。  
2. （可选）选气候区或航线 → 看 `climate-route-profile` 相对压力与策略提示。  
3. 按工况生成/筛选轨 C 短名单（证据链接，无单一最优分）。  
4. 任何输出旁可见 tag + source；安全 flags 常驻。

---

## 5. 文献界分类（浏览轴，非性能真值）

| 字段 | 说明 |
|------|------|
| `category_key` | 英文章节 key，见 `literature-taxonomy.md` |
| `category_zh` | 中文标签（面板芯片） |
| `subcategory` | 可选工艺细类：`laser_cladding` / `hvof_thermal_spray` / `3d_print` / `pdms_frc` 等 |

实现：`literature-bounds.csv`（**49** 行，tag=`文献界`）+ `literature-taxonomy.md`（10 主类）。面板「文献界」按分类筛选。**禁止**把文献界写成 示例双组分环氧 实测。


---

## 6. 文献界与商用分类（扩展）

| 资源 | 路径 |
|------|------|
| 文献技术分类 | `literature-taxonomy.md`（11 主类，含 `organic_marine_paint`） |
| 文献界表 | `literature-bounds.csv`（tag 一律 `文献界`；须 DOI） |
| 商用技术分类 | `commercial-taxonomy.md`（12 主类） |
| 商用产品目录 | `commercial-products.md`（含 category_key） |
| 短名单分类列 | `recommendation-shortlist.csv` → `category_key` / `category_zh` |

禁止把文献/厂家数值写入 示例双组分环氧 实测格。
