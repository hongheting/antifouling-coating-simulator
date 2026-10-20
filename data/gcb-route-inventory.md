# GCB 航线 / 港口 / 气候区 inventory（轨 B 全球剖面源）

> **填写日期**：2026-10-10（Asia/Shanghai）  
> **权威来源**：GCB 综述材料（以 `manuscript-v3-2026-10-09.txt` Table 1 为准）+ GCB agent 汇总；本文件只做 inventory，**不编造港口序列**。  
> **用途**：为 公开 GCB / 航线框架笔记（已去除内部路径）
> **已填模拟器航线（轨 B）**：SHA-SIN、SHA-PUS/ICN + 8 全球走廊。  
> **轨 C 短名单**：上述 10 条 profile 均已有 `recommendation-*-V0.md` + CSV 行（2026-10-10）。

---

## 0. 关键结论（给模拟器）

| 类别 | 数量 | 说明 |
|------|------|------|
| Table 1 具名节点（港 / 要冲） | **20** | 气候带 + 污损类群 + 散布相关性；**不是**港到港航线表 |
| 概念气候区（可实例化为区带剖面） | **3**（+ 过渡标签） | Tropical / Temperate / Cold–Polar；另有 subtropical、warm-temperate、cold-temperate、equatorial、hot subtropical 等表内标签 |
| 概念航线类型（正文 route-aware） | **3** | 暖水/热带运维；温带→冷水；跨气候带序列 |
| 可实例化走廊骨架（仅用 Table 1 节点，不新增港名） | **9** | 见 §4；港序为走廊逻辑链，GCB **未**给出完整 AIS 港到港航线 |
| 极地/亚极地文献端点（非 Table 1） | **2** | Canadian Arctic；Antarctica（仅文献，勿伪造 Table 1 行） |
| 模拟器已填航线 | **2** | SHA–SIN；SHA–PUS/ICN |

**重要诚实约束**：GCB 正文强调 shipping routes rarely remain confined to a single climate zone，但 **没有**列出「上海→新加坡」这类完整具名港序列；Fig. 3 为 schematic。轨 B 填剖面时：节点与气候标签来自 Table 1 / 三策略框架；港序走廊为 **用表内节点串起的实例化骨架**，tag 须标 `框架推断` / `走廊骨架`，不得写成 GCB 实测航次。

---

## 1. Table 1 节点全表（20）

**Source**：公开 GCB / 航线框架笔记（已去除内部路径）
**Caption**：*Table 1. Representative fouling groups associated with major maritime hubs across climate zones.*

| # | Maritime port / chokepoint | Climate zone (Table 1) | Relevance to dispersal (Table 1) | Track B zone bucket | Notes / caveats from review |
|---|---------------------------|------------------------|----------------------------------|---------------------|-----------------------------|
| 1 | Panama Canal | Tropical | Inter-oceanic transfer corridor | Tropical | — |
| 2 | Gibraltar | Temperate–subtropical | Atlantic–Mediterranean gateway | Temperate / subtropical transition | — |
| 3 | Rotterdam / North Sea gateway | Temperate | Major European shipping hub | Temperate | Review note: Slijkerman et al. 2017 研究对象偏 Groningen 港，非 Rotterdam 本体 |
| 4 | Øresund / Baltic entrance | Cold-temperate | Northern European regional gateway | Cold-temperate → toward cold | 波罗的海入口；近 cold 端 |
| 5 | Bosphorus | Temperate–subtropical | Black Sea–Mediterranean connection | Temperate / subtropical transition | — |
| 6 | Suez Canal | Subtropical | Inter-basin dispersal corridor | Subtropical | — |
| 7 | Strait of Hormuz / Jebel Ali | Hot subtropical | Persian Gulf gateway | Hot subtropical | — |
| 8 | Bab el-Mandeb | Tropical–subtropical | Red Sea–Indian Ocean corridor | Tropical / subtropical transition | — |
| 9 | Cape of Good Hope | Warm-temperate | Atlantic–Indian Ocean rerouting hub | Warm-temperate | — |
| 10 | Visakhapatnam | Tropical | Bay of Bengal hub | Tropical | v3 只留 Pati 2015 |
| 11 | Colombo | Tropical | Indian Ocean transshipment corridor | Tropical | — |
| 12 | Strait of Malacca | Equatorial tropical | Global primary chokepoint | Equatorial tropical | Blackwood 等涉及 Singapore seawater；Hing 2018 为 Kertih（东海岸），非马六甲本体 — 审稿 caveat |
| 13 | Hong Kong–Shenzhen | Subtropical | South China Sea hub | Subtropical | — |
| 14 | Xiamen–Sanya | Subtropical–tropical | Taiwan Strait–South China Sea hub | Subtropical–tropical | 表内已是港链式节点（厦门–三亚） |
| 15 | Busan / Jeju | Temperate | Northwest Pacific hub | Temperate | 与已填 `ROUTE-SHA-PUS-ICN-V0` 终点同区 |
| 16 | Tokyo Bay / Yokohama | Temperate | Northwest Pacific hub | Temperate | — |
| 17 | Los Angeles–Long Beach | Warm-temperate | Eastern Pacific hub | Warm-temperate | — |
| 18 | Santos | Subtropical | South Atlantic hub | Subtropical | — |
| 19 | Sydney | Warm-temperate | Southwest Pacific hub | Warm-temperate | — |
| 20 | Auckland | Temperate | Southwest Pacific gateway | Temperate | — |

**Fig. 3 红圈要冲（与 Table 1 重叠的 schematic chokepoints）**（review-v2/v3 图注讨论）：Øresund、Bosphorus、Gibraltar、Suez、Hormuz、Bab el-Mandeb、Malacca、Panama、Cape of Good Hope — 与上表对应；**不另增节点**。

---

## 2. 概念气候区 / 策略剖面（无具名港时实例化）

**Source**：knowledge-pack §7 + manuscript 2.1 / 3.1 / Fig. 4–7；figures caption 三栏 Tropical / Temperate / Polar。

| zone_profile_id（建议） | Climate regime | Dominant strategy (GCB) | Overall rel. fouling pressure (framework) | AF priority hint (framework) | Source quote / section |
|-------------------------|----------------|-------------------------|---------------------------------------------|------------------------------|------------------------|
| ZONE-TROPICAL-V0 | Tropical / equatorial / warm | rapid-turnover colonizers | High (frequent recruitment & turnover) | Anti-settlement, fouling-release, recolonization resistance | knowledge-pack §7.1；ms §3.1 rapid-turnover；Fig. 7 tropical |
| ZONE-TEMPERATE-V0 | Temperate | seasonal opportunists | Medium (elevated in seasonal windows) | Multi-season balanced performance | knowledge-pack §7.2；ms §3.1 seasonal opportunists |
| ZONE-COLD-POLAR-V0 | Cold / polar / cold-water | persistence-oriented attachers | **Low overall**; persistence among successful colonizers | Durability, abrasion/ice resistance, reduced detachment force — **禁止**写成高污损 | knowledge-pack §7.3 + polar overclaim rule；ms §3.1 persistence-oriented |

**Table 1 过渡标签**（可作区段标签，不必单独 invent 港口）：Subtropical、Subtropical–tropical、Temperate–subtropical、Warm-temperate、Cold-temperate、Hot subtropical、Equatorial tropical。

---

## 3. 概念航线类型（正文 route-aware，非港序）

**Source**：manuscript-v3 §4.2（约 L127）+ knowledge-pack route-aware 段；merge-4.3-4.4 gap5。

| route_type_id | Description | GCB wording (paraphrase + location) |
|---------------|-------------|-------------------------------------|
| TYPE-WARM-TROPICAL-OPS | 主要在暖热带 / 亚热带运维 | “vessels operating primarily in warm tropical and subtropical regions” — prioritize rapid settlement / biomass / recolonization resistance（§4.2） |
| TYPE-TEMPERATE-TO-COLD | 温带→冷水暴露 | “temperate-to-cold routes” — durability, wear resistance, limit persistent attachment（§4.2） |
| TYPE-CROSS-CLIMATE | 同航次跨热带–温带–冷水 | “major shipping routes rarely remain confined to a single climate zone” / “route-specific climatic combinations” including sequence, duration, operational conditions（§4.2；§4.3 gap5） |

---

## 4. 可实例化走廊骨架（只用 Table 1 节点 + 极地文献端点）

> 下列港序 **不是** GCB 正文给出的完整航次清单，而是用 Table 1 节点按地理走廊串起的 **V0 实例化骨架**。填写 `climate-route-profile.md` 时 tag=`走廊骨架` + `框架推断`。

| corridor_id | Skeleton (nodes in order) | Climates spanned | Maps to route type | Polar / notes |
|-------------|---------------------------|------------------|--------------------|---------------|
| CORRIDOR-ASIA-EU-SUEZ | Malacca → Bab el-Mandeb → Suez → Gibraltar → Rotterdam (/ Øresund 可选北延) | Equatorial tropical → tropical–subtropical → subtropical → temperate–subtropical → temperate (→ cold-temperate) | TYPE-CROSS-CLIMATE | 经典亚欧；可挂 Colombo / Visakhapatnam / Hormuz 为支点 |
| CORRIDOR-ASIA-EU-CAPE | Malacca → Cape of Good Hope → Gibraltar → Rotterdam | Equatorial → warm-temperate → temperate–subtropical → temperate | TYPE-CROSS-CLIMATE | 绕好望角；与苏伊士对照 |
| CORRIDOR-PAC-ATL-PANAMA | (Asia hubs) → Panama Canal → (Atlantic side: Santos / Gibraltar–Rotterdam 方向可选) | Tropical inter-oceanic + warm/temperate Atlantic | TYPE-CROSS-CLIMATE | Panama = Table 1 Tropical 节点 |
| CORRIDOR-RED-MED | Bab el-Mandeb → Suez → Bosphorus / Gibraltar | Tropical–subtropical → subtropical → temperate–subtropical | TYPE-CROSS-CLIMATE / 区域 | Red Sea–Med 散布走廊 |
| CORRIDOR-NW-PACIFIC | Hong Kong–Shenzhen → Xiamen–Sanya → Busan/Jeju → Tokyo Bay/Yokohama | Subtropical → subtropical–tropical → temperate → temperate | TYPE-TEMPERATE-TO-COLD 偏温带；含亚热带段 | 与已填 SHA–PUS 同 NW Pacific 语境 |
| CORRIDOR-TRANSPAC-ASIA-LA | (HK / Tokyo / Busan 任选表内起点) → Los Angeles–Long Beach | Subtropical/temperate Asia → warm-temperate E Pacific | TYPE-CROSS-CLIMATE | 跨太平洋 |
| CORRIDOR-SW-PACIFIC | Sydney → Auckland | Warm-temperate → temperate | TYPE-TEMPERATE-TO-COLD（区域） | SW Pacific |
| CORRIDOR-S-ATLANTIC-NODE | Santos（节点剖面；可与 Cape / Panama 走廊衔接） | Subtropical | 区域节点 / 可接 CROSS | 南大西洋枢纽 |
| CORRIDOR-COLD-ARCTIC-LIT | Canadian Arctic（文献端点；**非 Table 1**） | Cold / polar | TYPE-TEMPERATE-TO-COLD 冷端 | Chan et al. 2016/2022 voyages to Canadian Arctic |
| CORRIDOR-ANTARCTICA-LIT | Antarctica / East Antarctica（文献端点；**非 Table 1**） | Polar | Cold–polar zone profile | Fig.1 inset；Holland 2021、Barnes 2025、Amsler 2000 等 — **仅 lit，不 invent Table 1 港** |

**支点（可嵌入走廊，不单独 invent 新港）**：Colombo、Visakhapatnam、Hormuz/Jebel Ali、Øresund（北欧冷温带延伸）。

---

## 5. 模拟器已填航线 ↔ GCB 对齐

| profile_id | User route | GCB alignment | Status |
|------------|------------|---------------|--------|
| `ROUTE-SHA-SIN-V0` | 上海 → 新加坡 | 终点落在 **Malacca / Singapore seawater** 赤道热带枢纽语境；上海 **不在** Table 1，为用户指定起点 | **已填**（climate-route-profile §3b + 轨 C） |
| `ROUTE-SHA-PUS-ICN-V0` | 上海 → 釜山/仁川 | 终点与 **Busan / Jeju** 温带 NW Pacific hub 对齐；仁川为用户延伸，非 Table 1 字面 | **已填**（§3c + 轨 C） |

---

## 6. 建议全球 V0 剖面集（不 invent 表外港口）

### 6.1 区带剖面（必做，覆盖 temperate / tropical / polar）

1. `ZONE-TROPICAL-V0`  
2. `ZONE-TEMPERATE-V0`  
3. `ZONE-COLD-POLAR-V0`  

### 6.2 走廊剖面（优先用 Table 1 节点串）

| Priority | Proposed profile_id | Based on | Why |
|----------|---------------------|----------|-----|
| P0 done | ROUTE-SHA-SIN-V0 | User + Malacca hub | 已填 |
| P0 done | ROUTE-SHA-PUS-ICN-V0 | User + Busan/Jeju | 已填 |
| P1 | ROUTE-NW-PAC-V0 | CORRIDOR-NW-PACIFIC | 表内全程；延续东亚温带链 |
| P1 | ROUTE-ASIA-EU-SUEZ-V0 | CORRIDOR-ASIA-EU-SUEZ | 最大跨气候带示范（TYPE-CROSS-CLIMATE） |
| P2 | ROUTE-ASIA-EU-CAPE-V0 | CORRIDOR-ASIA-EU-CAPE | 与苏伊士对照 |
| P2 | ROUTE-TRANSPAC-LA-V0 | CORRIDOR-TRANSPAC-ASIA-LA | 跨太平洋 |
| P2 | ROUTE-PANAMA-V0 | CORRIDOR-PAC-ATL-PANAMA | 热带洋际走廊 |
| P3 | ROUTE-RED-MED-V0 | CORRIDOR-RED-MED | 区域散布走廊 |
| P3 | ROUTE-SW-PAC-V0 | CORRIDOR-SW-PACIFIC | 南半球温带 |
| P3 | ROUTE-SANTOS-NODE-V0 | CORRIDOR-S-ATLANTIC-NODE | 南大西洋节点 |
| P4 | ROUTE-ARCTIC-LIT-V0 | CORRIDOR-COLD-ARCTIC-LIT | 极地端；文献 only |
| P4 | ZONE 已含 Antarctica 语境 | CORRIDOR-ANTARCTICA-LIT | 并入 ZONE-COLD-POLAR 备注即可，不必硬造港序 |

---

## 7. 建议填写顺序（fill order）

1. **三区带空剖面** `ZONE-TROPICAL / TEMPERATE / COLD-POLAR`（统一相对压力与策略标签，供所有走廊引用）  
2. **`ROUTE-NW-PAC-V0`**（HK–Xiamen–Busan–Tokyo；与已填 SHA–PUS 同一海区，易复用）  
3. **`ROUTE-ASIA-EU-SUEZ-V0`**（Malacca–Bab–Suez–Gibraltar–Rotterdam；全球跨气候带主示范）  
4. **`ROUTE-ASIA-EU-CAPE-V0`** + **`ROUTE-TRANSPAC-LA-V0`** + **`ROUTE-PANAMA-V0`**（对照与洋际）  
5. **`ROUTE-RED-MED-V0`**、**`ROUTE-SW-PAC-V0`**、**`ROUTE-SANTOS-NODE-V0`**（区域补全）  
6. **`ROUTE-ARCTIC-LIT-V0`**（冷端；低压 + persistence；引用 Chan 等，不 invent Table 1 港）

每条填写时：相对压力 1–5 仅框架；港停 ≥ 同区航行（定性）；tag 区分 `Table1节点` / `走廊骨架` / `区带模板` / `文献极地`；**禁止**填假实测污损率。

---

## 8. Inventory 计数汇总

| Item | Count |
|------|------:|
| Table 1 nodes | 20 |
| Conceptual climate-zone profiles to instantiate | 3 |
| Conceptual route types | 3 |
| Corridor skeletons (incl. 2 lit-only cold ends) | 10 listed in §4 (8 Table1-based + 2 lit) |
| Simulator routes already filled | 2 |
| Proposed new V0 route/zone fills (excl. already filled) | 3 zones + 9 corridors ≈ **12**（Antarctica 可并入 cold zone） |

---

## 9. Source file index

| File | What extracted |
|------|----------------|
| `manuscript-v3-2026-10-09.txt` L49–70 | Authoritative Table 1 (20 rows) |
| `manuscript-v3` §4.2 (~L127), §4.3 gap5 | Route-aware wording; temperate-to-cold; cross-climate |
| `knowledge-pack-2026-10-08.md` §7, Fig.1–2/Table1 notes, polar rules | Strategy × climate; route-aware demand |
| `review-v2` / `review-v3` | Table 1 caveats (Kertih, Groningen, Visakhapatnam, Santos, etc.) |
| `figures/caption-and-placement.md` | Tropical / Temperate / Polar AF priorities |
| `climate-route-profile.md` | Already: ROUTE-SHA-SIN-V0, ROUTE-SHA-PUS-ICN-V0 |

---

*End of inventory. Profile filling is out of scope for this file; parent / coating-simulator agent fills next.*
