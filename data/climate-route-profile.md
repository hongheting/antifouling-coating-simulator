# 气候 / 航线污损压力剖面（轨 B，V0 · 全球扩展）

> 创建：2026-10-10（Asia/Shanghai）  
> 框架来源：GCB 知识包 growth–adhesion strategy space（公开 GCB / 航线框架笔记（已去除内部路径）manuscript-v3-2026-10-09.txt` Table 1 + §4.2  
> 库存索引：[`gcb-route-inventory.md`](gcb-route-inventory.md)  
> **全部压力为相对等级**（低/中/高 或 1–5），**不是**现场实测污损速率、覆盖率或涂料 MPa。  
> tag 默认：`相对等级` + `框架推断`；冷端另标 `文献点名`。  
> **已有用户航线**：`ROUTE-SHA-SIN-V0`、`ROUTE-SHA-PUS-ICN-V0`（已对齐 Table 1 节点语义）。  
> **本轮新建走廊**：`ROUTE-ASIA-EU-SUEZ-V0`、`ROUTE-ASIA-EU-CAPE-V0`、`ROUTE-PANAMA-TRANSIT-V0`、`ROUTE-REDSEA-MED-V0`、`ROUTE-NWPAC-HUB-V0`、`ROUTE-TRANSPAC-LA-V0`、`ROUTE-SWPAC-V0`、`ROUTE-SATL-SANTOS-V0`（共 8）。  
> 轨 C：10 条走廊 + 2 冷端桩均已有短名单（见各 `recommendation-*-V0.md` + `recommendation-shortlist.csv`；冷端见 `recommendation-STUB-CAN-ARCTIC-V0.md` / `recommendation-STUB-ANTARCTICA-V0.md`）。

---

## 1. GCB 三策略速查（定性）

| 策略（英文口径） | 典型气候背景 | growth–adhesion 位置 | 相对整体压力（框架级） | 防污含义（定性，非处方） |
|------------------|--------------|----------------------|------------------------|---------------------------|
| rapid-turnover colonizers | 热带 / 赤道暖水 | 偏 growth | 高（频繁补充与周转） | 重视抗沉降、易脱附/防再定殖；短再定殖间隔 |
| seasonal opportunists | 温带 | 中间 / 季节脉冲 | 中（季节窗内升高） | 兼顾快速附着窗与风暴/剪切；按季节窗口管理 |
| persistence-oriented attachers | 冷水 / 极地 | 偏 adhesion | **低整体压力**；成功者持久附着强 | 勿写成「极地高污损」；重视耐久、耐磨、抗持久大污损脱附力 |

气候 = 多因子筛选（温度、光周期、生产力、水动力、扰动、盐度/pH、传播网络），**不能只等于温度**。同区内 **港停相对压力 ≥ 航行**（框架定性）。

---

## 2. 气候区 → 相对压力表（可勾选 / 待填）

| climate_zone | rel_fouling_pressure (1–5 或 低中高) | dominant_adhesion_strategy | growth_adhesion_position | coating_implication（定性） | tag | source | note |
|--------------|--------------------------------------|----------------------------|--------------------------|------------------------------|-----|--------|------|
| 热带/赤道暖水 | 高 / 4–5（框架） | rapid-turnover colonizers | 偏 growth | 抗沉降 + fouling-release + 防快速再定殖 | 相对等级 | gcb-review knowledge-pack | 扩展补充窗、高周转；非本船实测 |
| 热亚热带 / 亚热带 | 中–高 / 3–4（框架） | rapid-turnover ↔ seasonal 过渡 | 中间偏 growth | 港停与枢纽连通性抬升；防再定殖仍重要 | 相对等级 | Table 1 标签 | 如苏伊士、港深、桑托斯 |
| 暖温带 | 中 / 3（框架）；季节窗可升 | seasonal opportunists（可兼暖水扩展） | 中间 | 季节脉冲 + 适度再定殖管理 | 相对等级 | Table 1 | 如好望角、LA–LB、悉尼 |
| 温带 | 中 / 3（框架）；季节窗可升至高 | seasonal opportunists | 中间 | 季节脉冲管理；附着速度与抗扰动兼顾 | 相对等级 | 同上 | 光周期/生产力脉冲 |
| 冷温带 | 低–中 / 2–3（框架） | seasonal → 略偏 persistence | 中间偏 adhesion | 耐久与抗扰动权重上升；整体压力低于暖水 | 相对等级 | Table 1 Øresund | 禁止写成高污损 |
| 冷水/极地 | 低 / 1–2（框架） | persistence-oriented attachers | 偏 adhesion | 整体压力低但耐久与抗持久附着重要 | 相对等级 | 同上 | **禁止**写成高污损强度 |
| 混合航线 | 按区段加权（见各 profile） | 多策略并存 | 航段依赖 | route-aware：按区段切换重点，勿单一港口优化 | 相对等级 | §route-aware | 航运很少困在单一气候带 |

---

## 2b. §4.2 三类航线类型 → 本库剖面映射

> 出处：稿 §4.2 L127；知识包 L1043–1047。类型是**暴露气候组合**，不是单一港序。

| §4.2 类型 | 防污优先（框架定性） | 映射到的 profile_id |
|-----------|----------------------|---------------------|
| **暖热/热带–亚热带运营** | 抗沉降、fouling-release、防快速再定殖 | `ROUTE-PANAMA-TRANSIT-V0`；`ROUTE-REDSEA-MED-V0`（暖段）；`ROUTE-SATL-SANTOS-V0`；`ROUTE-SHA-SIN-V0`；亚欧走廊的马六甲–红海暖段 |
| **温带→冷水（temperate-to-cold）** | 耐久、耐磨、抗持久附着 / 降低脱附力 | `ROUTE-SWPAC-V0`（偏温带端）；`ROUTE-ASIA-EU-*` 的欧洲温带终点；`NODE-ORESUND`；冷端桩 `STUB-CAN-ARCTIC`、`STUB-ANTARCTICA` |
| **跨气候带组合航线** | 按 **sequence / duration / operational conditions** 评价，勿单港 | `ROUTE-ASIA-EU-SUEZ-V0`；`ROUTE-ASIA-EU-CAPE-V0`；`ROUTE-TRANSPAC-LA-V0`；`ROUTE-NWPAC-HUB-V0`；`ROUTE-SHA-SIN-V0`（亚热→赤道）；`ROUTE-REDSEA-MED-V0` |

设计含义：同一航次可先后暴露 rapid-turnover 与 seasonal/persistence 制度；涂料匹配看**暴露序列**，不是只看出发港或终点港。

---

## 3. 示例航线桩（空结构保留）

**profile_id**：`ROUTE-STUB-001`  
**说明**：仅结构示例；港口名、驻留、航速比例留空，不编造污损速率。新航线请另开 `profile_id`，勿覆盖本桩。

| leg_order | port_or_segment | climate_zone | dwell_days | steaming_vs_idle | season | rel_pressure_leg | strategy_hint | note |
|-----------|-----------------|--------------|------------|------------------|--------|------------------|---------------|------|
| 1 | （待填） | （待填） | | | | | | |
| 2 | （待填） | （待填） | | | | | | |
| 3 | （待填） | （待填） | | | | | | |

---

## 3b. 已填航线：上海 → 新加坡（`ROUTE-SHA-SIN-V0`）

> **填写日期**：2026-10-10（Asia/Shanghai）  
> **用户指定**：上海到新加坡航线  
> **框架**：仅 GCB growth–adhesion strategy space / climate-related environmental filtering / route-aware antifouling（公开 GCB / 航线框架笔记（已去除内部路径）
> **tag**：`相对等级` + `框架推断` — **不是**现场生物实测、AIS 校准或绝对污损速率。  
> **免责声明**：下列相对压力（1–5 / 低中高）与策略提示均为概念框架下的定性映射，用于模拟器工况语境与轨 C 短名单排序参考；**不得**当作实验室/航次实测污损率、附着强度或涂料性能数字。气候≠温度 alone；港停 vs 航行仅作定性对比（静止利于沉降定殖，航行剪切提高脱附风险），无驻留天数与航速实测则不填量。


### Table 1 对齐（本轮）

- 南段新加坡/马六甲语境 → **NODE-MALACCA**（Equatorial tropical；Global primary chokepoint）。
- 中段台湾海峡—南海接近 → 贴近 **NODE-XM-SY**（Xiamen–Sanya；Subtropical–tropical）走廊语义。
- 上海港为东亚起点扩展节点（**非** Table 1 点名）；不另造污损率。
- 与全球走廊关系：可作为 `ROUTE-ASIA-EU-SUEZ-V0` / `ROUTE-ASIA-EU-CAPE-V0` / `ROUTE-NWPAC-HUB-V0` 的东亚入口子集。

### 分段表

| leg_order | port_or_segment | climate_zone | steaming_vs_idle（定性） | rel_pressure_leg (1–5 / 低中高) | dominant_adhesion_strategy | growth_adhesion_position | coating_implication（定性） | tag | source | note |
|-----------|-----------------|--------------|--------------------------|--------------------------------|----------------------------|--------------------------|------------------------------|-----|--------|------|
| 1 | 上海港停泊 / 长江口—东海近岸 | 亚热带—温带过渡；河口高生产力、盐度梯度 | **港停/近岸低速**为主 | **中–高 / 3–4** | seasonal opportunists，并受暖季/亚热带扩展补充窗影响 | 中间偏 growth（季节窗可升） | 港停重视抗沉降与早期生物膜；兼顾温带季节脉冲与河口营养负荷语境；勿按单一「温带均值」优化 | 相对等级；框架推断 | gcb-review knowledge-pack §7.2 / §6 多因子 / route-aware | 河口生产力与传播网络抬高港停压力相对等级；非实测 CFU/覆盖率 |
| 2 | 台湾海峡及接近段 | 亚热带；季风与海峡水动力强 | **航行（transit）**为主 | **中–高 / 3–4** | seasonal opportunists ↔ 偏 warm 的 rapid-turnover 过渡 | 中间 → 略偏 growth | 航行剪切可抑制部分沉降，但海峡扰动与连通性仍要求抗再定殖与表面更新；按区段切换，勿只优化上海港 | 相对等级；框架推断 | 同上 §6.4–6.5 水动力/扰动；§7.1–7.2 | 跨气候带航段；shipping 很少困在单一气候带（Fig.2 思路） |
| 3 | 南海干线航行 | 热带暖水 | **航行（transit）** | **高 / 4**（框架；航行相对同区港停略低一档语境） | rapid-turnover colonizers | 偏 growth | 抗沉降 + fouling-release + 防快速再定殖；航行剪切有助于部分脱附，但暖水扩展补充窗下再定殖间隔仍短 | 相对等级；框架推断 | 同上 §7.1 Tropical/warm | **禁止**写成绝对污损速率；「航行略低于港停」仅为相对定性 |
| 4 | 新加坡海峡 + 新加坡港停泊 | 赤道/热带暖水；全球航运枢纽（高 propagule connectivity） | **海峡航行 + 港停**（港停压力更高） | **高–很高 / 4–5**（港停取上沿） | rapid-turnover colonizers | 偏 growth | 港停为全航线相对压力峰值语境：抗沉降、易脱附/防再定殖、表面更新；枢纽连通性强调跨气候带物种到达后的建立风险；涂料勿只按上海港停设计 | 相对等级；框架推断 | 同上 §7.1；§6.7 传播网络；route-aware | 枢纽 = 高连通 + 环境兼容性语境；非物种清单 |

### 航线汇总

| 字段 | 值 |
|------|-----|
| profile_id | ROUTE-SHA-SIN-V0 |
| route_label | 上海 → 新加坡 |
| overall_rel_pressure | **高 / 4**（框架加权定性：南海–新加坡暖水与新加坡港停抬升全航线相对等级；上海段为中–高） |
| dominant_strategies_along_route | 北段/河口：seasonal opportunists（季节窗）；南段与新加坡：rapid-turnover colonizers；全线 **多策略并存** |
| berth_vs_transit_summary | 同气候区内：**港停相对压力 ≥ 航行**（静止利于沉降与生物膜；航行剪切提高脱附风险）。本航线峰值语境在新加坡港停，其次南海暖水干线。 |
| coating_implication | route-aware：按区段切换重点，**勿单一港口优化**。北段兼顾季节脉冲与河口港停；南段与新加坡强调抗沉降、fouling-release、防快速再定殖。可链到轨 C 短名单（证据另附）。 |
| tag | 相对等级；框架推断 |
| uncertainty | 无 AIS/驻留天数/航速/现场覆盖率校准；季节未指定时按「暖季压力偏上沿、冷季可下调一档」的定性备注理解；气候多因子未逐项量化 |
| source | GCB knowledge-pack-2026-10-08；用户航线：上海到新加坡 |
| safety_or_ops_note | 本剖面不替代坞修/涂装窗口或 SDS；实验室减暴露 ≠ 零溶剂/异氰酸酯/UV-C 风险 |
| disclaimer | 模拟器相对等级 ≠ 实测污损率或涂料性能；禁止当作绝对数字引用 |

### 分段一句话（用户可读）

1. **上海港停/长江口—东海**：亚热带—温带过渡，港停相对压力中–高；偏季节机会主义者，河口营养抬升港停语境。  
2. **台湾海峡接近**：亚热带过渡、航行主；压力中–高；温带策略向暖水 rapid-turnover 过渡。  
3. **南海干线**：热带暖水航行；相对压力高；主导 rapid-turnover，防再定殖。  
4. **新加坡海峡/港停**：赤道暖水 + 枢纽；相对压力高–很高（港停峰值）；rapid-turnover + 高连通性。

---

## 3c. 已填航线：上海 → 釜山 / 仁川（`ROUTE-SHA-PUS-ICN-V0`，温带）

> **填写日期**：2026-10-10（Asia/Shanghai）  
> **用户指定**：上海到釜山或仁川（温带航线）  
> **框架**：仅 GCB growth–adhesion strategy space / climate-related environmental filtering / route-aware antifouling（公开 GCB / 航线框架笔记（已去除内部路径）
> **tag**：`相对等级` + `框架推断` — **不是**现场生物实测、AIS 校准或绝对污损速率。  
> **与 `ROUTE-SHA-SIN-V0` 对比（框架级）**：本航线全程偏**温带**，终点港停**无**赤道/热带 rapid-turnover 峰值；全线相对压力低于上海→新加坡的「高/4 + 新加坡港停 4–5」。主导策略以 **seasonal opportunists**（季节脉冲、周期性再组装）为主，而非南段 rapid-turnover。港停仍可 ≥ 同区航行，但峰值语境是温带季节窗内的港停升高，不是热带枢纽连通性峰值。  
> **免责声明**：下列相对压力与策略提示均为概念框架定性映射，用于模拟器工况与轨 C 短名单；**不得**当作实测污损率、附着强度或涂料性能数字。气候≠温度 alone；无驻留天数与航速实测则不填量。釜山与仁川同列温带终点港语境，不编造二者污损率差异。


### Table 1 对齐（本轮）

- 终点釜山语境 → **NODE-BUSAN-JEJU**（Temperate；Northwest Pacific hub）。仁川并列温带终点扩展，不编造与釜山的污损%差。
- 属 `ROUTE-NWPAC-HUB-V0` 的**温带子集**（缺港深/厦三亚/东京全链）。
- 上海仍为扩展起点（非 Table 1 点名）。

### 分段表

| leg_order | port_or_segment | climate_zone | steaming_vs_idle（定性） | rel_pressure_leg (1–5 / 低中高) | dominant_adhesion_strategy | growth_adhesion_position | coating_implication（定性） | tag | source | note |
|-----------|-----------------|--------------|--------------------------|--------------------------------|----------------------------|--------------------------|------------------------------|-----|--------|------|
| 1 | 上海港停泊 / 长江口—东海近岸 | 亚热带—温带过渡；河口高生产力、盐度梯度 | **港停/近岸低速**为主 | **中–高 / 3–4**（季节窗可取上沿） | seasonal opportunists（暖季可兼亚热带扩展补充窗） | 中间（季节窗偏 growth） | 港停抗早期生物膜与季节脉冲；河口营养抬升港停语境；与 SH-SG 北段同级框架，但本航线无后续热带抬升 | 相对等级；框架推断 | gcb-review knowledge-pack §7.2 / §6；与 §3b leg1 同框架口径 | 非实测覆盖率；季节未指定时暖季偏上沿、冷季可下调一档 |
| 2 | 黄海 / 东海温带干线航行 | 温带；光周期与生产力季节脉冲；季风/波扰 | **航行（transit）**为主 | **中 / 3**（航行相对同区港停略低一档语境） | seasonal opportunists | 中间 | 航行剪切可抑制部分沉降；重点在季节招募窗与 episodic reassembly，而非持续热带再定殖；平衡抗沉降与耐久 | 相对等级；框架推断 | 同上 §7.2；§6.4–6.5 水动力/扰动 | **禁止**写成绝对污损速率；黄海/东海同列温带干线，不拆造分区速率 |
| 3 | 釜山港停泊 和/或 仁川港停泊 | 温带；区域航运枢纽（连通性存在，但非赤道暖水） | **港停**为主（可含进港低速） | **中–高 / 3–4**（季节窗内港停常为全线相对峰值语境） | seasonal opportunists | 中间 | 港停 ≥ 同区航行；多季节表现与季节性维护窗口相关；抗周期性招募脉冲，兼顾附着稳健；**勿**按新加坡式 rapid-turnover 峰值设计，也勿只按上海港优化 | 相对等级；框架推断 | 同上 §7.2；§6.7 传播网络（跨带连通定性）；route-aware | 釜山/仁川并列温带终点；不编造二者污损%差异；枢纽≠热带高周转 |

### 航线汇总

| 字段 | 值 |
|------|-----|
| profile_id | ROUTE-SHA-PUS-ICN-V0 |
| route_label | 上海 → 釜山 / 仁川（温带） |
| overall_rel_pressure | **中 / 3**（框架加权定性：全程温带；季节窗内港停可抬至中–高 3–4；**低于** `ROUTE-SHA-SIN-V0` 全线高/4 与新加坡港停 4–5） |
| dominant_strategies_along_route | 全线以 **seasonal opportunists** 为主；多策略并存程度弱于 SH-SG（无南段 rapid-turnover 主导段） |
| berth_vs_transit_summary | 同气候区内：**港停相对压力 ≥ 航行**。本航线峰值语境 = 温带季节窗内的上海或釜山/仁川港停，而非赤道枢纽。 |
| coating_implication | route-aware：按季节窗与港停管理，**勿单一港口优化**。强调多季节表现、抗周期性招募、抗沉降与耐久平衡；相对 SH-SG **降低**对「持续防快速再定殖」的紧迫度权重，**提高**季节性维护与机会主义脉冲匹配权重。链轨 C：`recommendation-SHA-PUS-ICN-V0.md`。 |
| contrast_vs_SHA_SIN | 无热带干线/赤道港停峰值；overall 中 vs 高；策略偏季节机会主义 vs 南段 rapid-turnover；终点港停压力中–高而非高–很高 |
| tag | 相对等级；框架推断 |
| uncertainty | 无 AIS/驻留/航速/现场覆盖率校准；季节未指定；釜山 vs 仁川未分差；气候多因子未逐项量化 |
| source | GCB knowledge-pack-2026-10-08；用户航线：上海到釜山或仁川 |
| safety_or_ops_note | 本剖面不替代坞修/涂装窗口或 SDS；实验室减暴露 ≠ 零溶剂/异氰酸酯/UV-C 风险 |
| disclaimer | 模拟器相对等级 ≠ 实测污损率或涂料性能；禁止当作绝对数字引用 |

### 分段一句话（用户可读）

1. **上海港停/长江口—东海**：亚热带—温带过渡，港停相对压力中–高（季节窗上沿）；偏季节机会主义者，河口营养抬升港停语境。  
2. **黄海/东海温带干线**：温带航行；相对压力中；主导 seasonal opportunists，航行剪切略抑沉降。  
3. **釜山和/或仁川港停**：温带终点港；相对压力中–高（季节窗内常为全线峰值语境）；季节脉冲 + 港停抗沉降/耐久平衡；**无**新加坡式热带高–很高峰值。


## 3d. 亚欧经苏伊士（`ROUTE-ASIA-EU-SUEZ-V0`）

> **填写日期**：2026-10-10 · **tag**：相对等级；框架推断 · **§4.2**：跨气候带组合  
> 走廊语义：亚洲枢纽 → Malacca → Bab el-Mandeb → Suez → Gibraltar → Rotterdam（Table 1 节点链）。港序为走廊展开，**综述未锁定具体港序**。无绝对污损率、无涂料 MPa。

### 分段表

| leg_order | port_or_segment | climate_zone | steaming_vs_idle | rel_pressure_leg | dominant_adhesion_strategy | coating_implication（定性） | tag | Table 1 |
|-----------|-----------------|--------------|------------------|------------------|----------------------------|------------------------------|-----|---------|
| 1 | 东亚/东南亚枢纽港停（如港深、厦–三亚语境；可含上海扩展） | 亚热带–热带 | **港停** | **中–高 / 3–4** | seasonal ↔ rapid-turnover 过渡 | 港停抗早期生物膜；为进入赤道咽喉铺垫 | 相对等级；框架推断 | NODE-HK-SZ / NODE-XM-SY |
| 2 | 马六甲海峡 + 邻近枢纽 | 赤道热带 | 航行 + 可短暂锚泊 | **高–很高 / 4–5**（锚泊/拥堵取上沿） | rapid-turnover colonizers | 全球主咽喉：抗沉降、防再定殖、表面更新；连通性峰值语境 | 同上 | NODE-MALACCA |
| 3 | 印度洋干线（可经 Colombo 中继注） | 热带 | **航行** | **高 / 4**（航行略低于同区港停） | rapid-turnover | 航行剪切略抑沉降；暖水再定殖间隔仍短 | 同上 | NODE-COLOMBO（可选中继） |
| 4 | Bab el-Mandeb | 热带–亚热带 | 航行 / 咽喉减速 | **高 / 4** | rapid-turnover（暖） | 红海–印度洋走廊；防快速再定殖 | 同上 | NODE-BAB |
| 5 | 苏伊士运河段 | 亚热带 | **运河低速/停等**偏 idle | **高 / 4**（低速抬升相对港外航行） | rapid-turnover ↔ seasonal 过渡 | 低速+停留抬升沉降窗口；跨流域扩散走廊 | 同上 | NODE-SUEZ |
| 6 | 地中海西行至直布罗陀 | 温带–亚热带 | 航行 + 可选港停 | **中–高 / 3–4** | seasonal opportunists（暖季可偏上） | 跨带过渡：季节脉冲权重上升，仍勿丢掉暖段再定殖记忆 | 同上 | NODE-GIBRALTAR |
| 7 | 北海 / 鹿特丹港停 | 温带 | **港停** | **中–高 / 3–4**（季节窗峰值语境） | seasonal opportunists | 欧洲枢纽终点：多季节表现、抗周期性招募；**勿**只按马六甲优化 | 同上 | NODE-ROTTERDAM |

### 汇总

| 字段 | 值 |
|------|-----|
| overall_rel_pressure | **高 / 4**（马六甲与苏伊士低速段抬升；欧洲端温带季节窗） |
| dominant_strategies | 南/暖段 rapid-turnover；地中海–北海 seasonal；**多策略序列** |
| berth_vs_transit | 同区港停 ≥ 航行；运河低速视作抬升沉降窗口 |
| coating_implication | 按暴露序列设计：暖段抗沉降/防再定殖 + 温带端耐久与季节窗；route-aware，勿单港 |
| uncertainty | 无 AIS/驻留校准；亚洲具体装货港未锁死；季节未指定 |
| disclaimer | 相对等级 ≠ 实测污损率或涂料性能 |

---

## 3e. 亚欧经好望角（`ROUTE-ASIA-EU-CAPE-V0`）

> **tag**：相对等级；框架推断 · **§4.2**：跨气候带组合（绕开苏伊士）  
> 骨架：亚洲暖水枢纽 → 印度洋/南大西洋接近 → Cape of Good Hope → 大西洋北上 → 欧洲温带（Rotterdam 语境）。

### 分段表

| leg_order | port_or_segment | climate_zone | steaming_vs_idle | rel_pressure_leg | dominant_adhesion_strategy | coating_implication（定性） | tag | Table 1 |
|-----------|-----------------|--------------|------------------|------------------|----------------------------|------------------------------|-----|---------|
| 1 | 亚洲赤道/热带出口（马六甲语境） | 赤道热带 | 港停或咽喉 | **高–很高 / 4–5** | rapid-turnover | 同苏伊士线暖段出口压力 | 相对等级；框架推断 | NODE-MALACCA |
| 2 | 南印度洋长航段 | 热带→暖温带过渡 | **航行** | **中–高 / 3–4** | rapid-turnover → seasonal 过渡 | 长航剪切有利部分脱附；仍保留暖水再定殖记忆 | 同上 | — |
| 3 | 好望角绕航枢纽 | 暖温带 | 航行 / 可选港停 | **中 / 3**（港停可 3–4） | seasonal opportunists（可兼暖水扩展） | 绕航枢纽：季节脉冲 + 海况扰动；耐久与抗扰动权重升 | 同上 | NODE-CAPE |
| 4 | 南/北大西洋北上至欧洲 | 暖温带→温带 | **航行** | **中 / 3** | seasonal opportunists | 向温带制度收敛；减少对「持续热带再定殖」的单一权重 | 同上 | — |
| 5 | 鹿特丹 / 北海港停 | 温带 | **港停** | **中–高 / 3–4**（季节窗） | seasonal opportunists | 与苏伊士线欧洲端同级框架；多季节维护窗口 | 同上 | NODE-ROTTERDAM |

### 汇总

| 字段 | 值 |
|------|-----|
| overall_rel_pressure | **中–高 / 3–4**（缺苏伊士/红海低速亚热带峰值；仍有马六甲出口抬升） |
| vs_SUEZ | 相对避开 Bab–Suez 低速高相对压力段；好望角为暖温带扰动枢纽而非赤道港停峰值 |
| coating_implication | 暖段出口仍要防再定殖；中长航与好望角强调耐久/抗扰动；欧洲端季节窗管理 |
| disclaimer | 相对等级 ≠ 实测；不编造绕航与经苏伊士的污损%差，仅框架段序差异 |

---

## 3f. 巴拿马跨洋（`ROUTE-PANAMA-TRANSIT-V0`）

> **tag**：相对等级；框架推断 · **§4.2**：暖热/热带运营（跨洋咽喉）  
> Pacific ↔ Atlantic via Panama Canal（Table 1：Tropical；inter-oceanic transfer）。

### 分段表

| leg_order | port_or_segment | climate_zone | steaming_vs_idle | rel_pressure_leg | dominant_adhesion_strategy | coating_implication（定性） | tag | Table 1 |
|-----------|-----------------|--------------|------------------|------------------|----------------------------|------------------------------|-----|---------|
| 1 | 太平洋侧接近 / 锚地 | 热带 | 锚泊/低速 | **高 / 4** | rapid-turnover | 候潮/排队抬升港停语境 | 相对等级；框架推断 | NODE-PANAMA 侧 |
| 2 | 巴拿马运河通过 | 热带 | **运河低速 / 闸区停留** | **高–很高 / 4–5** | rapid-turnover colonizers | 全线相对峰值语境：抗沉降、防再定殖、表面更新；跨洋传播走廊 | 同上 | NODE-PANAMA |
| 3 | 大西洋侧驶离 / 枢纽港停 | 热带（可接暖温带目的港） | 港停或航行 | **高 / 4**（港停）；目的港另计 | rapid-turnover（目的港可切换） | 出运后仍按目的港气候切换；勿只按单侧大洋均值 | 同上 | NODE-PANAMA |

### 汇总

| 字段 | 值 |
|------|-----|
| overall_rel_pressure | **高 / 4**（运河段取上沿） |
| coating_implication | 热带咽喉优先 anti-settlement / fouling-release / 防再定殖；跨洋后按目的港气候带接续评价 |
| disclaimer | 相对等级 ≠ 实测；不给出闸次或等待天数 |

---

## 3g. 红海–地中海（`ROUTE-REDSEA-MED-V0`）

> **tag**：相对等级；框架推断 · **§4.2**：暖热 + 跨带入口  
> Bab el-Mandeb → Suez → 地中海；**注**：西出口 Gibraltar；东北支路 Bosphorus（黑海）为可选备注，非强制港序。

### 分段表

| leg_order | port_or_segment | climate_zone | steaming_vs_idle | rel_pressure_leg | dominant_adhesion_strategy | coating_implication（定性） | tag | Table 1 |
|-----------|-----------------|--------------|------------------|------------------|----------------------------|------------------------------|-----|---------|
| 1 | Bab el-Mandeb | 热带–亚热带 | 咽喉航行 | **高 / 4** | rapid-turnover | 红海–印度洋入口；防快速再定殖 | 相对等级；框架推断 | NODE-BAB |
| 2 | 红海航段 | 热亚热带语境 | 航行 | **高 / 4** | rapid-turnover | 暖水航行；再定殖间隔短 | 同上 | — |
| 3 | 苏伊士运河 | 亚热带 | **低速/停等** | **高 / 4** | rapid-turnover ↔ seasonal | 低速抬升沉降窗；跨流域走廊 | 同上 | NODE-SUEZ |
| 4 | 东地中海运营 / 港停 | 温带–亚热带 | 港停+航行 | **中–高 / 3–4** | seasonal（暖季偏上） | 跨带后季节脉冲权重升 | 同上 | — |
| 5a | 注：直布罗陀西出大西洋 | 温带–亚热带 | 咽喉 | **中–高 / 3–4** | seasonal | 大西洋–地中海门户 | 同上 | NODE-GIBRALTAR |
| 5b | 注：博斯普鲁斯→黑海 | 温带–亚热带 | 咽喉 | **中–高 / 3–4** | seasonal | 黑海–地中海连接；另开航次时单独加权 | 同上 | NODE-BOSPHORUS |

### 汇总

| 字段 | 值 |
|------|-----|
| overall_rel_pressure | **高 / 4**（Bab–Suez 暖/低速段主导） |
| coating_implication | 暖段抗沉降/防再定殖；入地中海后叠加季节窗与门户港停；Gibraltar/Bosphorus 为分支注记 |
| disclaimer | 相对等级 ≠ 实测 |

---

## 3h. 西北太平洋枢纽链（`ROUTE-NWPAC-HUB-V0`）

> **tag**：相对等级；框架推断 · **§4.2**：跨气候带（亚热/热带→温带）  
> Hong Kong–Shenzhen → Xiamen–Sanya → Busan/Jeju → Tokyo Bay/Yokohama。  
> **对齐**：包含 `ROUTE-SHA-PUS-ICN-V0` 温带终点语义；上海扩展可视为链外靠近点。

### 分段表

| leg_order | port_or_segment | climate_zone | steaming_vs_idle | rel_pressure_leg | dominant_adhesion_strategy | coating_implication（定性） | tag | Table 1 |
|-----------|-----------------|--------------|------------------|------------------|----------------------------|------------------------------|-----|---------|
| 1 | 港深港停 | 亚热带 | **港停** | **中–高 / 3–4** | seasonal ↔ rapid-turnover 过渡 | SCS 枢纽港停；抗早期膜与再定殖 | 相对等级；框架推断 | NODE-HK-SZ |
| 2 | 厦–三亚 / 台海–南海枢纽段 | 亚热带–热带 | 港停或沿岸航行 | **中–高 / 3–4**（偏热带取上沿） | 向 rapid-turnover 过渡 | 勿按单一亚热带均值；暖段抬升再定殖权重 | 同上 | NODE-XM-SY |
| 3 | 向北航行至朝鲜半岛海域 | 温带过渡 | **航行** | **中 / 3** | seasonal opportunists | 向温带制度收敛 | 同上 | — |
| 4 | 釜山 / 济州港停 | 温带 | **港停** | **中–高 / 3–4**（季节窗） | seasonal opportunists | 对齐 SHA-PUS；季节脉冲峰值语境 | 同上 | NODE-BUSAN-JEJU |
| 5 | 东京湾 / 横滨港停 | 温带 | **港停** | **中–高 / 3–4**（季节窗） | seasonal opportunists | NW Pacific 温带枢纽；多季节表现 | 同上 | NODE-TOKYO |

### 汇总

| 字段 | 值 |
|------|-----|
| overall_rel_pressure | **中–高 / 3–4**（南段亚热/热带港停抬升；北段温带季节窗；**低于**马六甲–新加坡赤道峰值全线） |
| vs_SHA_PUS | 本链更长、含港深/厦三亚暖段；SHA-PUS 为北段温带子集 |
| coating_implication | 南段防再定殖权重高于纯温带短航；北段季节窗与耐久平衡；route-aware 勿只优化釜山或只优化港深 |
| disclaimer | 相对等级 ≠ 实测 |

---

## 3i. 跨太平洋至洛杉矶–长滩（`ROUTE-TRANSPAC-LA-V0`）

> **tag**：相对等级；框架推断 · **§4.2**：跨气候带组合  
> 亚洲亚热带/热带枢纽 ↔ Los Angeles–Long Beach（Warm-temperate）。

### 分段表

| leg_order | port_or_segment | climate_zone | steaming_vs_idle | rel_pressure_leg | dominant_adhesion_strategy | coating_implication（定性） | tag | Table 1 |
|-----------|-----------------|--------------|------------------|------------------|----------------------------|------------------------------|-----|---------|
| 1 | 亚洲装货枢纽港停（港深 / 厦–三亚 / 可选东京） | 亚热带–热带（东京为温带） | **港停** | **中–高 / 3–4**（热带端可 4） | 视装货港：暖端 rapid-turnover 过渡；东京 seasonal | 亚洲端港停定调暴露序列起点 | 相对等级；框架推断 | NODE-HK-SZ / XM-SY / TOKYO |
| 2 | 北太平洋长航段 | 跨带开阔洋 | **航行** | **中 / 3**（框架；开阔洋相对沿岸港停偏低一档语境） | 混合；航行剪切主导脱附语境 | 长航有利部分脱附，但抵港前暖温带港停仍关键 | 同上 | — |
| 3 | 洛杉矶–长滩港停 | 暖温带 | **港停** | **中–高 / 3–4**（季节窗可上沿） | seasonal opportunists（可兼暖水扩展） | 东太平洋枢纽：季节脉冲 + 枢纽连通；勿只按亚洲装货港设计 | 同上 | NODE-LA-LB |

### 汇总

| 字段 | 值 |
|------|-----|
| overall_rel_pressure | **中–高 / 3–4** |
| coating_implication | 亚洲暖端港停 + LA 暖温带港停双端加权；洋段不可当作「无压力」；按序列评价 |
| disclaimer | 相对等级 ≠ 实测；不编造跨洋天数 |

---

## 3j. 西南太平洋（`ROUTE-SWPAC-V0`）

> **tag**：相对等级；框架推断 · **§4.2**：偏温带运营（暖温带↔温带）  
> Sydney ↔ Auckland。

### 分段表

| leg_order | port_or_segment | climate_zone | steaming_vs_idle | rel_pressure_leg | dominant_adhesion_strategy | coating_implication（定性） | tag | Table 1 |
|-----------|-----------------|--------------|------------------|------------------|----------------------------|------------------------------|-----|---------|
| 1 | 悉尼港停 | 暖温带 | **港停** | **中 / 3**（季节窗可 3–4） | seasonal opportunists | 西南太平洋枢纽港停；季节脉冲 | 相对等级；框架推断 | NODE-SYDNEY |
| 2 | 塔斯曼海航行 | 暖温带–温带 | **航行** | **中 / 3**（略低于港停） | seasonal | 航行剪切；跨带幅度小于亚欧苏伊士 | 同上 | — |
| 3 | 奥克兰港停 | 温带 | **港停** | **中–高 / 3–4**（季节窗） | seasonal opportunists | 门户港停；多季节维护；耐久权重相对暖水航线更高 | 同上 | NODE-AUCKLAND |

### 汇总

| 字段 | 值 |
|------|-----|
| overall_rel_pressure | **中 / 3** |
| coating_implication | 无赤道咽喉峰值；强调季节窗、耐久与抗扰动；相对 SH-SG **降低**持续防再定殖紧迫度 |
| disclaimer | 相对等级 ≠ 实测 |

---

## 3k. 南大西洋桑托斯枢纽（`ROUTE-SATL-SANTOS-V0`）

> **tag**：相对等级；框架推断 · **§4.2**：暖热/亚热带枢纽  
> Santos 为节点剖面 + 典型接近段（综述未给完整对端港序）。

### 分段表

| leg_order | port_or_segment | climate_zone | steaming_vs_idle | rel_pressure_leg | dominant_adhesion_strategy | coating_implication（定性） | tag | Table 1 |
|-----------|-----------------|--------------|------------------|------------------|----------------------------|------------------------------|-----|---------|
| 1 | 南大西洋接近航行 | 亚热带语境 | **航行** | **中–高 / 3–4** | seasonal ↔ rapid-turnover 过渡 | 接近段航行略低于港停 | 相对等级；框架推断 | — |
| 2 | 桑托斯港停 | 亚热带 | **港停** | **中–高 / 3–4**（取上沿作枢纽港停） | rapid-turnover 过渡 / seasonal 暖端 | 南大西洋枢纽：抗沉降与再定殖 + 季节性；连通性语境 | 同上 | NODE-SANTOS |
| 3 | 离港 / 近岸低速 | 亚热带 | 低速 | **中–高 / 3–4** | 同上 | 低速窗同港停逻辑 | 同上 | NODE-SANTOS |

### 汇总

| 字段 | 值 |
|------|-----|
| overall_rel_pressure | **中–高 / 3–4** |
| coating_implication | 亚热带枢纽港停优先；对端航线另接 profile 做序列拼接 |
| disclaimer | 节点剖面 ≠ 完整跨洋航次；相对等级 ≠ 实测 |

---

## 3l. Table 1 其余节点短剖面 + 冷端文献桩

> 下列为**节点级**相对压力模板，供走廊拼接；非完整港到港航次。

### NODE-HORMUZ（Strait of Hormuz / Jebel Ali）

| 字段 | 值 |
|------|-----|
| climate_zone | Hot subtropical |
| berth_rel_pressure | **高 / 4**（港停/锚地） |
| transit_rel_pressure | **中–高 / 3–4** |
| strategy | rapid-turnover（热暖） |
| coating_implication | 热亚热带门户：抗沉降与防再定殖；高温运营语境（多因子，≠只温度） |
| tag | 相对等级；框架推断 |

### NODE-VIZAG（Visakhapatnam）

| 字段 | 值 |
|------|-----|
| climate_zone | Tropical |
| berth_rel_pressure | **高 / 4** |
| transit_rel_pressure | **中–高 / 3–4** |
| strategy | rapid-turnover |
| coating_implication | 孟加拉湾枢纽港停；可拼入印度洋干线 |
| tag | 相对等级；框架推断 |

### NODE-COLOMBO（Colombo）

| 字段 | 值 |
|------|-----|
| climate_zone | Tropical |
| berth_rel_pressure | **高 / 4** |
| transit_rel_pressure | **中–高 / 3–4** |
| strategy | rapid-turnover |
| coating_implication | 印度洋中转；亚欧走廊可选中继抬升港停权重 |
| tag | 相对等级；框架推断 |

### NODE-ORESUND（Øresund / Baltic entrance）

| 字段 | 值 |
|------|-----|
| climate_zone | Cold-temperate |
| berth_rel_pressure | **低–中 / 2–3**（季节窗可至 3） |
| transit_rel_pressure | **低–中 / 2–3** |
| strategy | seasonal → 略偏 persistence |
| coating_implication | **禁止**写成高污损；提高耐久、耐磨、抗持久附着权重；北欧门户 |
| tag | 相对等级；框架推断 |

### STUB-CAN-ARCTIC（Canadian Arctic）

| 字段 | 值 |
|------|-----|
| climate_zone | 冷水 / 极地 |
| rel_pressure | **低 / 1–2** |
| strategy | persistence-oriented attachers |
| coating_implication | 整体压力低；成功附着者持久；耐久与脱附力；链轨 C：`recommendation-STUB-CAN-ARCTIC-V0.md` |
| tag | **文献点名**；框架推断（Chan et al. 2016/2022） |
| note | **未入 Table 1**；仅冷端剖面桩 |

### STUB-ANTARCTICA（Antarctica / East Antarctica）

| 字段 | 值 |
|------|-----|
| climate_zone | 冷水 / 极地 |
| rel_pressure | **低 / 1–2** |
| strategy | persistence-oriented attachers |
| coating_implication | 同冷端逻辑；禁止「极地高污损」表述；链轨 C：`recommendation-STUB-ANTARCTICA-V0.md` |
| tag | **文献点名**；框架推断（Barnes 2025; Holland 2021; Perry 2026） |
| note | **未入 Table 1**；仅冷端剖面桩 |

---

## 3m. 全球剖面一览（相对 overall）

| profile_id | overall_rel | 气候带跨度（框架） | §4.2 类型 |
|------------|-------------|-------------------|-----------|
| ROUTE-SHA-SIN-V0 | 高 / 4 | 亚热–温带过渡 → 赤道 | 跨带 + 暖热 |
| ROUTE-SHA-PUS-ICN-V0 | 中 / 3 | 温带为主 | 温带运营子集 |
| ROUTE-ASIA-EU-SUEZ-V0 | 高 / 4 | 赤道→热亚→亚热→温亚→温带 | 跨气候带组合 |
| ROUTE-ASIA-EU-CAPE-V0 | 中–高 / 3–4 | 赤道→暖温带→温带 | 跨气候带组合 |
| ROUTE-PANAMA-TRANSIT-V0 | 高 / 4 | 热带跨洋 | 暖热/热带 |
| ROUTE-REDSEA-MED-V0 | 高 / 4 | 热亚→亚热→温亚 | 暖热 + 跨带 |
| ROUTE-NWPAC-HUB-V0 | 中–高 / 3–4 | 亚热/热带→温带 | 跨气候带 |
| ROUTE-TRANSPAC-LA-V0 | 中–高 / 3–4 | 亚热/热带→暖温带 | 跨气候带 |
| ROUTE-SWPAC-V0 | 中 / 3 | 暖温带↔温带 | 偏温带 |
| ROUTE-SATL-SANTOS-V0 | 中–高 / 3–4 | 亚热带枢纽 | 暖热/亚热 |
| NODE-HORMUZ / VIZAG / COLOMBO | 节点高/4 港停 | 热亚 / 热带 | 节点 |
| NODE-ORESUND | 低–中 / 2–3 | 冷温带 | temperate-to-cold |
| STUB-CAN-ARCTIC / ANTARCTICA | 低 / 1–2 | 冷水/极地 | temperate-to-cold 冷端 |

---

## 4. 与轨 A / 轨 C 的接口

- 轨 B 相对压力**不改写**轨 A lab 数值。
- **已链接短名单**（按 `matched_profile_id` 分筛，勿混用排序）：
  - `ROUTE-SHA-SIN-V0` → `recommendation-SHA-SIN-V0.md`
  - `ROUTE-SHA-PUS-ICN-V0` → `recommendation-SHA-PUS-ICN-V0.md`
  - `ROUTE-ASIA-EU-SUEZ-V0` → `recommendation-ASIA-EU-SUEZ-V0.md`
  - `ROUTE-ASIA-EU-CAPE-V0` → `recommendation-ASIA-EU-CAPE-V0.md`
  - `ROUTE-PANAMA-TRANSIT-V0` → `recommendation-PANAMA-TRANSIT-V0.md`
  - `ROUTE-REDSEA-MED-V0` → `recommendation-REDSEA-MED-V0.md`
  - `ROUTE-NWPAC-HUB-V0` → `recommendation-NWPAC-HUB-V0.md`（北段轻链 SHA-PUS）
  - `ROUTE-TRANSPAC-LA-V0` → `recommendation-TRANSPAC-LA-V0.md`
  - `ROUTE-SWPAC-V0` → `recommendation-SWPAC-V0.md`（温带族轻链 SHA-PUS）
  - `ROUTE-SATL-SANTOS-V0` → `recommendation-SATL-SANTOS-V0.md`
- **冷端桩短名单**（本轮补齐）：
  - `STUB-CAN-ARCTIC` → `recommendation-STUB-CAN-ARCTIC-V0.md`（文献点名 Chan et al.；temperate-to-cold / persistence 偏置）
  - `STUB-ANTARCTICA` → `recommendation-STUB-ANTARCTICA-V0.md`（文献点名 Barnes/Holland/Perry；同策略族）
- 节点附录（Hormuz / Vizag / Colombo / Øresund）本轮仍**无**独立轨 C 短名单。
- 库存：[`gcb-route-inventory.md`](gcb-route-inventory.md)。
- 全球变暖语境下性状可能极向重分布 — V0 只作定性提醒，不输出定量预测分数。

## 5. 免责声明（全局）

模拟器相对等级 ≠ 航次/实验室实测污损率、附着强度或涂料 MPa。Table 1 是代表性 fouling groups 与走廊语义，**不是**每港物种清单或污损强度排行榜。安全：本剖面不替代坞修窗口或 SDS。
