#!/usr/bin/env python3
"""Rebuild data-snapshot.js/json from ../data CSVs + MD notes. Run from anywhere."""
import csv
import json
import pathlib
import re
import sys
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
UI = ROOT / "ui"

prev = UI / "data-snapshot.json"
if not prev.exists():
    print("Missing data-snapshot.json with curated routes; abort.", file=sys.stderr)
    sys.exit(1)

snap = json.loads(prev.read_text(encoding="utf-8"))

with open(DATA / "lab-proxy-table.csv", encoding="utf-8") as f:
    snap["lab"] = list(csv.DictReader(f))

with open(DATA / "recommendation-shortlist.csv", encoding="utf-8") as f:
    snap["recommendations"] = list(csv.DictReader(f))

with open(DATA / "literature-bounds.csv", encoding="utf-8") as f:
    snap["literature"] = list(csv.DictReader(f))


# --- literature taxonomy ---
tax_path = DATA / "literature-taxonomy.md"
tax_text = tax_path.read_text(encoding="utf-8") if tax_path.exists() else ""
categories = []
# parse main category table rows: | `key` | 中文 | ...
for line in tax_text.splitlines():
    m = re.match(r"\|\s*`([a-z_]+)`\s*\|\s*([^|]+)\|", line)
    if m and m.group(1) not in ("key",):
        key = m.group(1)
        zh = m.group(2).strip()
        if key in ("subcategory",):
            continue
        # skip subcategory table keys that appear later — only take from first table until ## 次级
        categories.append({"key": key, "zh": zh})

# Keep only the 10 primary keys (first table); drop subcategory-table accidental matches
primary_order = [
    "organic_marine_paint",
    "metal_alloy",
    "silicone_mod_organic",
    "lse_foul_release",
    "spc_copper",
    "hydrogel_zwitterionic",
    "uvc_active",
    "ultrasound",
    "hybrid",
    "natural_biocide_ca",
    "regulatory_economic",
]
cat_map = {c["key"]: c["zh"] for c in categories}
snap["literature_taxonomy"] = {
    "source": "data/literature-taxonomy.md",
    "categories": [{"key": k, "zh": cat_map.get(k, k)} for k in primary_order],
    "honesty": [
        "分类便于浏览，不改变证据强度",
        "natural_biocide_ca ≠ 用户 示例功能化环氧（公开仓库已替换） 实测",
        "金属涂层现场防污 ≠ 商船 SPC 等价",
    ],
}

# count per category from literature rows
from collections import Counter
cc = Counter((r.get("category_key") or "") for r in snap["literature"])
snap["literature_taxonomy"]["counts"] = {k: cc.get(k, 0) for k in primary_order}
snap["literature_taxonomy"]["total"] = len(snap["literature"])



def split_table_row(line: str):
    line = line.strip()
    if not line.startswith("|"):
        return None
    cells = [c.strip() for c in line.strip("|").split("|")]
    return cells


def is_sep_row(cells):
    if not cells:
        return False
    return all(re.fullmatch(r":?-+:?", c.replace(" ", "")) for c in cells)


def parse_md_tables(text: str):
    """Return list of {heading, headers, rows} for each markdown table under nearest ##/###."""
    lines = text.splitlines()
    heading = ""
    tables = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("##"):
            heading = line.lstrip("#").strip()
            i += 1
            continue
        cells = split_table_row(line)
        if cells and i + 1 < len(lines):
            sep = split_table_row(lines[i + 1])
            if sep and is_sep_row(sep):
                headers = cells
                rows = []
                i += 2
                while i < len(lines):
                    row = split_table_row(lines[i])
                    if not row:
                        break
                    if is_sep_row(row):
                        i += 1
                        continue
                    # pad/truncate
                    while len(row) < len(headers):
                        row.append("")
                    rows.append(dict(zip(headers, row[: len(headers)])))
                    i += 1
                tables.append({"heading": heading, "headers": headers, "rows": rows})
                continue
        i += 1
    return tables


def extract_bullets_under(text: str, section_title_substr: str):
    """Collect bullet lines under first heading containing substr until next same-or-higher heading."""
    lines = text.splitlines()
    bullets = []
    capturing = False
    base_level = None
    for line in lines:
        m = re.match(r"^(#{2,4})\s+(.*)", line)
        if m:
            level = len(m.group(1))
            title = m.group(2).strip()
            if not capturing and section_title_substr in title:
                capturing = True
                base_level = level
                continue
            if capturing and level <= base_level:
                break
            continue
        if capturing and line.strip().startswith("- "):
            bullets.append(line.strip()[2:].strip())
    return bullets


# --- commercial products ---
comm_path = DATA / "commercial-products.md"
comm_text = comm_path.read_text(encoding="utf-8")
comm_tables = parse_md_tables(comm_text)
brands = []
type_lookup = []
for t in comm_tables:
    h = t["heading"]
    # brand product tables: sections 1–6 with 产品线 column
    if t["headers"] and "产品线" in t["headers"]:
        brand = re.sub(r"^\d+\.\s*", "", h)
        items = []
        for r in t["rows"]:
            ck = (r.get("技术分类 key") or r.get("category_key") or "").strip().strip("`")
            cz = (r.get("技术分类") or r.get("category_zh") or "").strip()
            items.append(
                {
                    "product": r.get("产品线", ""),
                    "category_key": ck,
                    "category_zh": cz,
                    "tech_type": r.get("技术类型（公开）", ""),
                    "claims": r.get("公开宣称（摘录）", ""),
                    "source": r.get("来源", ""),
                    "tag": r.get("tag", ""),
                }
            )
        brands.append({"brand": brand, "items": items})
    elif t["headers"] and "类型" in t["headers"] and "代表产品（本目录）" in t["headers"]:
        for r in t["rows"]:
            type_lookup.append(
                {
                    "type": r.get("类型", ""),
                    "products": r.get("代表产品（本目录）", ""),
                    "hint": r.get("对轨 B 定性提示（框架，非实测）", ""),
                }
            )

snap["commercial_products"] = {
    "source": "data/commercial-products.md",
    "brands": brands,
    "type_lookup": type_lookup,
    "honesty": [
        "厂家标称 / 公开资料 ≠ 用户 示例双组分环氧 实测",
        "docking interval / speed loss % / 燃油节约 % 均为厂商宣称，受船型与工况影响",
        "采购前核最新 TDS/SDS 与当地登记",
    ],
}

# --- UV-C / ultrasound tech ---
tech_path = DATA / "tech-uvc-ultrasound.md"
tech_text = tech_path.read_text(encoding="utf-8")
tech_tables = parse_md_tables(tech_text)
tech_entries = []
hybrids = []
for t in tech_tables:
    h = t["heading"]
    if t["headers"] and "条目" in t["headers"]:
        kind = "uvc" if "UV" in h or "1." in h else "ultrasound" if "超声" in h or "2." in h else "other"
        # refine by preceding content in heading path — use heading text
        if "UV" in h or "Ryan" in str(t["rows"][:1]):
            kind = "uvc"
        if "Park" in str(t["rows"]) or "超声" in h or "导波" in h or "Cathelco" in str(t["rows"]):
            # second table is ultrasound
            if any("Park" in r.get("条目", "") or "超声" in r.get("条目", "") or "Cathelco" in r.get("条目", "") for r in t["rows"]):
                kind = "ultrasound"
            elif any("Ryan" in r.get("条目", "") or "UVC" in r.get("条目", "") or "UV" in r.get("条目", "") for r in t["rows"]):
                kind = "uvc"
        for r in t["rows"]:
            entry_kind = kind
            entry = r.get("条目", "")
            if "Ryan" in entry or "UVC" in entry or "UV" in entry or "LED" in entry:
                entry_kind = "uvc"
            if "Park" in entry or "超声" in entry or "Cathelco" in entry or "HISWA" in entry or "钻井" in entry:
                entry_kind = "ultrasound"
            tech_entries.append(
                {
                    "kind": entry_kind,
                    "section": h,
                    "entry": entry,
                    "points": r.get("要点", ""),
                    "citation": r.get("引用", ""),
                    "tag": r.get("tag", ""),
                }
            )
    elif t["headers"] and "组合" in t["headers"]:
        for r in t["rows"]:
            hybrids.append(
                {
                    "combo": r.get("组合", ""),
                    "logic": r.get("逻辑（框架）", ""),
                    "caution": r.get("注意", ""),
                }
            )

snap["tech_aux"] = {
    "source": "data/tech-uvc-ultrasound.md",
    "uvc_principles": extract_bullets_under(tech_text, "原理（高层）")[:6]
    or [
        "UV-C 可损伤微生物 DNA/RNA 与部分幼体，抑制定殖或杀死早期生物膜。",
        "船体应用面临：水衰减、阴影、距离、LED 输出稳定性、聚合物/涂层光老化、功耗与密封。",
        "更现实落点：niche 区、移动式/ROV、嵌入式 LED 试点——非整船唯一方案。",
    ],
    "us_principles": [
        "换能器在壳板激励振动/导波，干扰幼体附着或破坏早期生物膜；预防优于清除。",
        "效果依赖频率、功率、换能器布局、壳板几何与电源占空比。",
        "现场结果不一致：部分抑藤壶，对水线藻类/粘液可能不足。",
    ],
    "entries": tech_entries,
    "hybrids": hybrids,
    "safety": [
        "UV-C：护目、遮挡、联锁；勿照射皮肤；评估聚合物降解。",
        "超声：听力/振动职业卫生；海洋生物政策；壳板疲劳个案评估。",
        "杀生剂涂层：IMO AFS、欧盟 BPR、地方铜限制。",
        "实验室：溶剂、异氰酸酯（B 料）、UV-C 实验 — 少做实验 ≠ 零风险。",
    ],
}

# fix uvc_principles: first "原理" under UV-C section — extract_bullets may grab ultrasound too.
# Prefer explicit split from file sections
uvc_block = re.search(
    r"## 1\.\s*UV-C[\s\S]*?### 1\.1\s*原理（高层）\s*\n([\s\S]*?)(?=###|\n## )",
    tech_text,
)
if uvc_block:
    snap["tech_aux"]["uvc_principles"] = [
        ln.strip()[2:].strip()
        for ln in uvc_block.group(1).splitlines()
        if ln.strip().startswith("- ")
    ]

us_block = re.search(
    r"## 2\.\s*超声[\s\S]*?### 2\.1\s*原理（高层）\s*\n([\s\S]*?)(?=###|\n## )",
    tech_text,
)
if us_block:
    snap["tech_aux"]["us_principles"] = [
        ln.strip()[2:].strip()
        for ln in us_block.group(1).splitlines()
        if ln.strip().startswith("- ")
    ]

# --- commercial taxonomy ---
comm_tax_path = DATA / "commercial-taxonomy.md"
comm_tax_text = comm_tax_path.read_text(encoding="utf-8") if comm_tax_path.exists() else ""
comm_categories = []
for line in comm_tax_text.splitlines():
    m = re.match(r"\|\s*`([a-z_]+)`\s*\|\s*([^|]+)\|", line)
    if m and m.group(1) not in ("key", "subcategory"):
        comm_categories.append({"key": m.group(1), "zh": m.group(2).strip()})
comm_primary = [
    "spc_silyl_acrylate",
    "spc_hydrolysis",
    "spc_copper",
    "frc_silicone",
    "frc_fluoro",
    "hybrid_hydrogel",
    "lpp_linear",
    "copper_free_ablative",
    "yacht_spc",
    "asian_silyl_spc",
    "tech_uvc",
    "tech_ultrasound",
]
comm_map = {c["key"]: c["zh"] for c in comm_categories}
# counts from catalog + brand items
comm_cc = Counter()
for r in snap["recommendations"]:
    if r.get("matched_profile_id") == "CATALOG-GLOBAL-V0" and r.get("category_key"):
        comm_cc[r["category_key"]] += 1
for b in snap.get("commercial_products", {}).get("brands", []):
    for it in b.get("items", []):
        if it.get("category_key"):
            comm_cc[it["category_key"]] += 1
snap["commercial_taxonomy"] = {
    "source": "data/commercial-taxonomy.md",
    "categories": [{"key": k, "zh": comm_map.get(k, k)} for k in comm_primary],
    "counts": {k: comm_cc.get(k, 0) for k in comm_primary},
    "total_catalog": len([r for r in snap["recommendations"] if r.get("matched_profile_id") == "CATALOG-GLOBAL-V0"]),
    "honesty": [
        "厂家标称 / 公开资料 ≠ 用户 示例双组分环氧 实测",
        "分类便于筛选，不改变证据强度",
        "课题微宇宙 Hempel 未鉴定牌号",
    ],
}

# catalog rows from shortlist

# --- clickable links (DOI → https://doi.org/…, explicit http(s) URLs, verified sidecar) ---
DOI_RE = re.compile(r"\b(10\.\d{4,9}/[^\s;；，,（）()*]+)")
URL_RE = re.compile(r"https?://[^\s;；，,（）()]+")


def _links_from_text(text, origin="已有文件"):
    out, seen = [], set()
    for u in URL_RE.findall(text or ""):
        u = u.rstrip(".")
        if u not in seen:
            seen.add(u); out.append({"label": u.split("//", 1)[1][:60], "url": u, "origin": origin})
    for d in DOI_RE.findall(text or ""):
        d = d.rstrip(".")
        u = "https://doi.org/" + d
        if u not in seen and not any(d in x for x in seen):
            seen.add(u); out.append({"label": "DOI " + d, "url": u, "origin": origin})
    return out


def _merge(a, b):
    seen = {x["url"] for x in a}
    return a + [x for x in b if x["url"] not in seen and not seen.add(x["url"])]


side = {}
side_path = DATA / "commercial-links.csv"
if side_path.exists():
    with open(side_path, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if not r["url"].startswith(("http://", "https://")):
                continue
            side.setdefault((r["scope"], r["item_key"]), []).append(
                {"label": r["label"], "url": r["url"], "origin": r["link_origin"]})

for r in snap["literature"]:
    r["links"] = [dict(l, label=("打开 DOI 原文" if l["url"].startswith("https://doi.org/") else "打开来源链接"))
                  for l in _links_from_text(r.get("DOI_or_source", ""))]

for b in snap["commercial_products"]["brands"]:
    for it in b["items"]:
        m = re.search(r"\*\*(.+?)\*\*", it["product"])
        key = m.group(1).strip() if m else it["product"].strip()
        it["links"] = _merge(_links_from_text(it.get("source", "")), side.get(("product", key), []))

for e in snap["tech_aux"]["entries"]:
    e["links"] = _merge(_links_from_text(e.get("citation", "")), side.get(("tech_entry", e["entry"].strip()), []))

for r in snap["recommendations"]:
    links = _links_from_text(r.get("evidence_links", ""))
    if r.get("matched_profile_id") == "CATALOG-GLOBAL-V0":
        links = _merge(links, side.get(("catalog_rank", str(r.get("rank", "")).strip()), []))
    r["links"] = links

snap["link_stats"] = {
    "literature_linked": sum(1 for r in snap["literature"] if r["links"]),
    "products_linked": sum(1 for b in snap["commercial_products"]["brands"] for it in b["items"] if it["links"]),
    "products_total": sum(len(b["items"]) for b in snap["commercial_products"]["brands"]),
    "tech_linked": sum(1 for e in snap["tech_aux"]["entries"] if e["links"]),
    "tech_total": len(snap["tech_aux"]["entries"]),
}

snap["catalog"] = [
    r for r in snap["recommendations"] if r.get("matched_profile_id") == "CATALOG-GLOBAL-V0"
]

# --- industry feed (防污行业周报 · read-only input folder) ---
INDUSTRY_DIR = DATA / "industry-feed"
INDUSTRY_CATS = ["法规", "企业", "产品", "技术"]
INDUSTRY_RELS = ["高", "中", "低"]
industry_warnings = []


def _field(key_variants, text):
    for k in key_variants:
        m = re.match(r"^\s*[-*]\s*" + k + r"\s*[：:]\s*(.*)$", text)
        if m:
            return m.group(1).strip()
    return None


def parse_industry_file(path: pathlib.Path):
    text = path.read_text(encoding="utf-8-sig")
    week = path.stem
    lines = text.splitlines()
    issue = {
        "week": week,
        "source_file": "data/industry-feed/" + path.name,
        "title": "",
        "coverage": "",
        "coverage_start": "",
        "coverage_end": "",
        "nature": "",
        "trend_summary": "",
        "entries": [],
    }
    cur = None
    section = "head"  # head | entry | trend | other
    trend_lines = []
    for raw in lines:
        line = raw.rstrip()
        h1 = re.match(r"^#\s+(.*)$", line)
        h2 = re.match(r"^##\s+(.*)$", line)
        if h1 and not issue["title"]:
            issue["title"] = h1.group(1).strip()
            continue
        if h2:
            title = h2.group(1).strip()
            if "趋势" in title:
                section = "trend"
                cur = None
                continue
            m = re.match(r"^(\d+)[.、．]\s*(.*)$", title)
            cur = {
                "no": int(m.group(1)) if m else len(issue["entries"]) + 1,
                "title": (m.group(2) if m else title).strip(),
                "date": "", "category": "", "summary": "", "url": "",
                "relevance": "", "relevance_reason": "", "note": "",
            }
            issue["entries"].append(cur)
            section = "entry"
            continue
        if section == "head":
            m = re.match(r"^\s*覆盖窗口\s*[：:]\s*(.*)$", line)
            if m:
                issue["coverage"] = m.group(1).strip()
                ds = re.findall(r"\d{4}-\d{2}-\d{2}", issue["coverage"])
                if ds:
                    issue["coverage_start"] = ds[0]
                    issue["coverage_end"] = ds[-1]
                continue
            m = re.match(r"^\s*来源性质\s*[：:]\s*(.*)$", line)
            if m:
                issue["nature"] = m.group(1).strip()
                continue
        elif section == "trend":
            if line.strip():
                trend_lines.append(line.strip())
        elif section == "entry" and cur is not None:
            v = _field(["日期"], line)
            if v is not None:
                cur["date"] = v
                continue
            v = _field(["类别", "分类"], line)
            if v is not None:
                cur["category"] = v
                continue
            v = _field(["摘要"], line)
            if v is not None:
                cur["summary"] = v
                continue
            v = _field(["来源", "链接", "来源链接"], line)
            if v is not None:
                um = re.search(r"https?://[^\s)）<>\]]+", v)
                cur["url"] = um.group(0) if um else ""
                cur["source_text"] = v
                continue
            v = _field(["相关度", "相关性"], line)
            if v is not None:
                rm = re.match(r"^\s*([高中低])\s*[（(]\s*(.*?)\s*[）)]?\s*$", v)
                if rm:
                    cur["relevance"] = rm.group(1)
                    cur["relevance_reason"] = rm.group(2)
                else:
                    rm2 = re.match(r"^\s*([高中低])\s*[：:—\-–·,，]?\s*(.*)$", v)
                    cur["relevance"] = rm2.group(1) if rm2 else ""
                    cur["relevance_reason"] = (rm2.group(2) if rm2 else v).strip()
                continue
            v = _field(["备注", "说明"], line)
            if v is not None:
                cur["note"] = v
                continue
    issue["trend_summary"] = "\n".join(trend_lines)
    head_text = text.split("\n## ", 1)[0]
    issue["backfill"] = "回溯补录" in head_text
    for e in issue["entries"]:
        e["week"] = week
        e["tag"] = "公开资料"
        if e["category"] not in INDUSTRY_CATS:
            industry_warnings.append(f"{path.name} #{e['no']}: 未知类别 {e['category']!r}")
        if e["relevance"] not in INDUSTRY_RELS:
            industry_warnings.append(f"{path.name} #{e['no']}: 未解析相关度")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", e["date"] or ""):
            industry_warnings.append(f"{path.name} #{e['no']}: 日期格式异常 {e['date']!r}")
        if not e["url"]:
            industry_warnings.append(f"{path.name} #{e['no']}: 无 http(s) 来源链接")
    # newest first within a week (stable on original order)
    issue["entries"].sort(key=lambda e: e["date"] or "", reverse=True)
    rc = Counter(e["relevance"] for e in issue["entries"])
    cc_ = Counter(e["category"] for e in issue["entries"])
    issue["counts"] = {
        "total": len(issue["entries"]),
        "by_relevance": {k: rc.get(k, 0) for k in INDUSTRY_RELS},
        "by_category": {k: cc_.get(k, 0) for k in INDUSTRY_CATS},
    }
    return issue


industry_weeks = []
if INDUSTRY_DIR.is_dir():
    for fp in sorted(INDUSTRY_DIR.glob("*.md")):
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", fp.stem):
            continue
        try:
            industry_weeks.append(parse_industry_file(fp))
        except Exception as exc:  # never break the whole build on one bad week
            industry_warnings.append(f"{fp.name}: 解析失败 {exc}")
industry_weeks.sort(key=lambda w: w["week"], reverse=True)
snap["industry"] = {
    "source": "data/industry-feed/（防污行业周报，每周一份；本脚本只读）",
    "honesty": "行业动态/公开资料，非性能数据",
    "categories": INDUSTRY_CATS,
    "relevance_levels": INDUSTRY_RELS,
    "weeks": industry_weeks,
}

snap.setdefault("meta", {})
snap["meta"]["updated"] = date.today().isoformat()
snap["meta"]["honesty"] = snap["meta"].get(
    "honesty",
    "模拟 ≠ 实测。输出为带标签的区间/相对等级与证据短名单，不是实验室报告值或航次污损率。",
)
snap["meta"]["safety"] = snap["meta"].get(
    "safety",
    "溶剂通风；B 料查 SDS（可能含 NCO）；现配现用；UV-C 护目与皮肤防护。",
)

snap["meta"]["counts"] = {
    "lab": len(snap["lab"]),
    "routes": len(snap.get("routes", [])),
    "recommendations": len(snap["recommendations"]),
    "literature": len(snap["literature"]),
    "catalog": len(snap["catalog"]),
    "products": sum(len(b["items"]) for b in snap["commercial_products"]["brands"]),
    "researchers": 0,
}
snap["meta"]["industry_weeks"] = len(industry_weeks)
snap["meta"]["industry_entries"] = sum(len(w["entries"]) for w in industry_weeks)
snap["meta"]["industry_latest_week"] = industry_weeks[0]["week"] if industry_weeks else ""
snap["meta"]["industry_latest_count"] = len(industry_weeks[0]["entries"]) if industry_weeks else 0
snap["meta"]["industry_latest_high"] = (
    industry_weeks[0]["counts"]["by_relevance"]["高"] if industry_weeks else 0
)


# --- literature enrichment (authors/affiliation/summary/stars; display only, original CSV kept) ---
enr_path = DATA / "literature-enrichment.csv"
if enr_path.exists():
    with open(enr_path, encoding="utf-8") as f:
        enr = {r["bound_id"]: r for r in csv.DictReader(f)}
    for r in snap["literature"]:
        r["enrich"] = enr.get(r["bound_id"])
    snap["meta"].setdefault("counts", {})

# --- researcher ranking ---
rr_path = DATA / "researcher-ranking.csv"
if rr_path.exists():
    with open(rr_path, encoding="utf-8") as f:
        snap["researchers"] = list(csv.DictReader(f))
    snap["meta"]["counts"]["researchers"] = len(snap["researchers"])

# --- route geometry (schematic) ---
rg_path = DATA / "route-geometry.json"
if rg_path.exists():
    snap["route_geometry"] = json.loads(rg_path.read_text(encoding="utf-8"))

(UI / "data-snapshot.json").write_text(
    json.dumps(snap, ensure_ascii=False, indent=2), encoding="utf-8"
)
(UI / "data-snapshot.js").write_text(
    "window.SIM_DATA = " + json.dumps(snap, ensure_ascii=False) + ";\n", encoding="utf-8"
)

print(
    "Rebuilt",
    UI / "data-snapshot.js",
    "lab",
    len(snap["lab"]),
    "rec",
    len(snap["recommendations"]),
    "lit",
    len(snap["literature"]),
    "lit_cats",
    len(snap.get("literature_taxonomy", {}).get("categories", [])),
    "brands",
    len(snap["commercial_products"]["brands"]),
    "tech_entries",
    len(snap["tech_aux"]["entries"]),
    "catalog",
    len(snap["catalog"]),
    "comm_cats",
    len(snap.get("commercial_taxonomy", {}).get("categories", [])),
)
print(
    "routes", len(snap.get("routes", [])),
    "industry_weeks", snap["meta"]["industry_weeks"],
    "industry_entries", snap["meta"]["industry_entries"],
    "industry_latest", snap["meta"]["industry_latest_week"],
    snap["meta"]["industry_latest_count"],
)
for w in industry_warnings:
    print("industry WARN:", w, file=sys.stderr)
print("lit counts:", snap.get("literature_taxonomy", {}).get("counts"))
print("link_stats:", snap["link_stats"])
print("comm counts:", snap.get("commercial_taxonomy", {}).get("counts"))
