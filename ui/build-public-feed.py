#!/usr/bin/env python3
"""Build public-data/feed.json + latest.json from ui/data-snapshot.json.
Only PUBLIC sections are exported; lab table / thesis-derived shortlist are never included.
Fails (exit 2) if any private term remains."""
import json, re, sys, pathlib, datetime
ROOT = pathlib.Path(__file__).resolve().parent.parent
snap = json.loads((ROOT / "ui/data-snapshot.json").read_text(encoding="utf-8"))
OUT = ROOT / "public-data"; OUT.mkdir(exist_ok=True)

APP = {"versionName": "0.5.0", "versionCode": 50,
       "apk_url": "https://github.com/hongheting/antifouling-coating-simulator/releases/latest",
       "notes": "0.5.0：新增在线更新（行业动态/文献/商用/学者等公开板块）；新版本提醒。"}
PUBLIC_KEYS = ["industry", "literature", "literature_taxonomy", "catalog", "commercial_products",
               "commercial_taxonomy", "tech_aux", "link_stats", "researchers", "route_geometry", "routes"]
# Private-term blocklist is loaded from a local, untracked file (one regex per line).
import os as _os
_bl = _os.environ.get("PRIVATE_TERMS_FILE", "private-terms.txt")
_terms = [t.strip() for t in open(_bl, encoding="utf-8") if t.strip()] if _os.path.exists(_bl) else [r"thesis"]
PRIVATE = re.compile("|".join(_terms), re.I)
SUBS = [(re.compile(r"JF-?602\s*\+\s*CA@MSiO₂"), "功能化配方"), (re.compile(r"JF-?602"), "研究配方"),
        (re.compile(r"CA@MSiO₂|CA@MSiO2"), "功能填料"), (re.compile(r"BYK-?\d*"), "分散剂"),
        (re.compile(r"微宇宙"), "室内对照"), (re.compile(r"课题\s*(KB|知识库)?"), "内部"),
        (re.compile(r"/workspace/[^\s;,)\"'`]*|/home/box/[^\s;,)\"'`]*"), "")]

def clean(o):
    if isinstance(o, str):
        for p, r in SUBS: o = p.sub(r, o)
        return o
    if isinstance(o, list): return [clean(x) for x in o]
    if isinstance(o, dict): return {k: clean(v) for k, v in o.items()}
    return o

sections = {k: clean(snap[k]) for k in PUBLIC_KEYS if k in snap}
# drop any record still matching private terms (whole-record exclusion, never partial leaks)
dropped = {}
for k, v in list(sections.items()):
    if isinstance(v, list):
        keep = [x for x in v if not PRIVATE.search(json.dumps(x, ensure_ascii=False))]
        if len(keep) != len(v): dropped[k] = len(v) - len(keep)
        sections[k] = keep
    elif PRIVATE.search(json.dumps(v, ensure_ascii=False)):
        # dict: drop offending sub-keys/records
        def prune(d):
            if isinstance(d, dict): return {a: prune(b) for a, b in d.items() if not PRIVATE.search(json.dumps(b, ensure_ascii=False)) or isinstance(b, (dict, list))}
            if isinstance(d, list): return [prune(x) for x in d if not PRIVATE.search(json.dumps(x, ensure_ascii=False))]
            return d
        sections[k] = prune(v); dropped[k] = "pruned"

def count(v):
    if isinstance(v, list): return len(v)
    if isinstance(v, dict):
        for key in ("weeks", "entries", "routes", "products", "categories"):
            if isinstance(v.get(key), list): return len(v[key])
        return len(v)
    return 1

_now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8)))
version = _now.strftime("%Y-%m-%d.%H%M")   # sortable string; newer > older
now = _now.isoformat(timespec="seconds")
feed = {"schema": 1, "version": version, "generated_at": now, "min_app": 50,
        "counts": {k: count(v) for k, v in sections.items()}, "dropped": dropped, "sections": sections}
txt = json.dumps(feed, ensure_ascii=False, separators=(",", ":"))
bad = sorted(set(m.group(0) for m in PRIVATE.finditer(txt)))
if bad:
    print("PRIVATE TERMS REMAIN:", bad, file=sys.stderr); sys.exit(2)
(OUT / "feed.json").write_text(txt, encoding="utf-8")
(OUT / "latest.json").write_text(json.dumps({"data_version": version, "generated_at": now,
    "feed": "feed.json", "app": APP}, ensure_ascii=False, indent=2), encoding="utf-8")
print("feed version", version, "bytes", len(txt.encode()), "counts", feed["counts"], "dropped", dropped, "scan CLEAN")
