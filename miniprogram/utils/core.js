/**
 * 共享逻辑（与 ui/index.html 同口径）：筛选 / 排序 / 统计。纯函数，无 DOM、无网络。
 * 说明：面板本身不含数值模型——拉拔/EIS/防污等数值来自数据快照中已带证据标签的行；
 * 这里只做与网页版完全一致的筛选、分组、排序与派生统计。模拟 ≠ 实测。
 */
'use strict';
var KNOWN_TAGS = ['实测', '待测', '厂家标称', '粗估观察', '方案非实测', '文献界', '文献点名', '相对等级', '框架推断', '插值', '公开资料'];
var TAG_CLS = {
  '实测': 'tag-measured', '待测': 'tag-pending', '厂家标称': 'tag-vendor',
  '粗估观察': 'tag-estimate', '方案非实测': 'tag-plan-not-measured',
  '文献界': 'tag-lit-bound', '文献点名': 'tag-lit-named',
  '相对等级': 'tag-relative', '框架推断': 'tag-framework', '插值': 'tag-interp',
  '公开资料': 'tag-public'
};
function splitTags(t) {
  if (!t) return [];
  return String(t).split(/[;；,，]/).map(function (s) { return s.trim(); }).filter(Boolean)
    .map(function (s) { return { text: s, cls: TAG_CLS[s] || 'tag-default' }; });
}
function lower(s) { return String(s == null ? '' : s).toLowerCase(); }
function joinHay(arr) { return arr.map(function (x) { return x == null ? '' : x; }).join(' ').toLowerCase(); }
function pressPct(n) { var x = Math.max(0, Math.min(5, Number(n) || 0)); return Math.round((x / 5) * 100); }
function typeLabel(t) {
  if (t === 'commercial') return '市售'; if (t === 'homemade') return '自制/研究';
  if (t === 'tech-uvc') return 'UV-C 辅助'; if (t === 'tech-ultrasound') return '超声辅助'; return t || '其他';
}
function safeHttpUrl(u) { var s = String(u || ''); return /^https?:\/\/[^\s]+$/i.test(s) ? s : ''; }

// ---- overview ----
function overview(D) {
  var lab = D.lab || [], MC = (D.meta && D.meta.counts) || {};
  var pending = lab.filter(function (r) { return r.pull_off_tag === '待测' || r.eis_tag === '待测'; }).length;
  var brandN = ((D.commercial_products || {}).brands || []).reduce(function (n, b) { return n + (b.items || []).length; }, 0);
  var mv = function (k, fb) { return MC[k] != null ? MC[k] : fb; };
  return [
    ['实验室行', mv('lab', lab.length)], ['航线剖面', mv('routes', (D.routes || []).length)],
    ['短名单行', mv('recommendations', (D.recommendations || []).length)], ['文献界', mv('literature', (D.literature || []).length)],
    ['目录候选', mv('catalog', (D.catalog || []).length)], ['商用产品线', mv('products', brandN)],
    ['行业动态（' + ((D.meta && D.meta.industry_weeks) || 0) + ' 周）', (D.meta && D.meta.industry_entries) || 0], ['待测槽（约）', pending]
  ].map(function (x) { return { label: x[0], n: x[1] }; });
}

// ---- 轨 A 实验室表 ----
function labBaseKey(b) {
  b = b || '';
  if (b.indexOf('示例双组分环氧') >= 0) return 'jf602';
  if (b.indexOf('丙烯酸') >= 0 || b.indexOf('松香') >= 0) return 'acrylic';
  if (b.indexOf('粉体') >= 0 || b.indexOf('填料') >= 0 || b.indexOf('EIS') >= 0 || b.indexOf('释放几何') >= 0) return 'powder';
  if (b.indexOf('UV-C') >= 0 || b.indexOf('超声') >= 0 || b.indexOf('主动') >= 0) return 'active';
  return 'other';
}
var LAB_GROUPS = [{ key: '', zh: '全部路线' }, { key: 'jf602', zh: '示例双组分环氧' }, { key: 'acrylic', zh: '自配丙烯酸' },
  { key: 'powder', zh: '示例功能填料粉体' }, { key: 'active', zh: 'UV-C/超声' }, { key: 'other', zh: '对照/其他' }];
function labGroups(D) {
  var c = {}; (D.lab || []).forEach(function (r) { var k = labBaseKey(r.basecoat); c[k] = (c[k] || 0) + 1; });
  return LAB_GROUPS.map(function (g) { return { key: g.key, zh: g.zh, n: g.key === '' ? (D.lab || []).length : (c[g.key] || 0) }; });
}
function filterLab(D, o) {
  o = o || {}; var q = lower(o.q).trim();
  return (D.lab || []).filter(function (r) {
    if (o.base && labBaseKey(r.basecoat) !== o.base) return false;
    var tags = [r.pull_off_tag, r.eis_tag, r.hplc_tag, r.microcosm_tag].join(' ');
    if (o.tag && tags.indexOf(o.tag) < 0) return false;
    if (q && joinHay([r.formulation_id, r.basecoat, r.note, r.uncertainty, r.disadvantage_notes, r.safety_flags]).indexOf(q) < 0) return false;
    return true;
  });
}

// ---- 轨 B 航线 / 轨 C 短名单 ----
function routeTypes(D) { var s = []; (D.routes || []).forEach(function (r) { if (s.indexOf(r.type) < 0) s.push(r.type); }); return s; }
function filterRoutes(D, type) { return (D.routes || []).filter(function (r) { return !type || r.type === type; }); }
function pNum(s) {
  var m = String(s || '').match(/(\d+(?:\.\d+)?)\s*(?:[–-]\s*(\d+(?:\.\d+)?))?\s*$/);
  if (!m) return null; return m[2] ? (Number(m[1]) + Number(m[2])) / 2 : Number(m[1]);
}
function pColor(v) {
  if (v == null) return '#7a8d9e'; if (v >= 4.25) return '#b42318'; if (v >= 3.75) return '#e0592a';
  if (v >= 3.25) return '#e8a33d'; if (v >= 2.5) return '#d6c341'; return '#3f9d6a';
}
function recFor(D, pid) {
  return (D.recommendations || []).filter(function (r) { return r.matched_profile_id === pid; })
    .sort(function (a, b) { return Number(a.rank) - Number(b.rank); });
}

// ---- 文献界 ----
var LIT_DEFAULT = [{ key: 'metal_alloy', zh: '金属/合金涂层' }, { key: 'silicone_mod_organic', zh: '硅改性有机涂层' }, { key: 'lse_foul_release', zh: '低表面能 / 污损释放（FRC）' },
  { key: 'spc_copper', zh: 'SPC / 铜系杀生剂' }, { key: 'hydrogel_zwitterionic', zh: '水凝胶 / 两性离子' }, { key: 'uvc_active', zh: 'UV-C 主动防污' },
  { key: 'ultrasound', zh: '超声 / 导波' }, { key: 'hybrid', zh: '混合 / 协同体系' }, { key: 'natural_biocide_ca', zh: '天然杀生剂 / CA@介孔' }, { key: 'regulatory_economic', zh: '监管 / 经济影响' }];
function litCats(D) {
  var order = (D.literature_taxonomy && D.literature_taxonomy.categories) || LIT_DEFAULT, c = {};
  (D.literature || []).forEach(function (r) { var k = r.category_key || ''; c[k] = (c[k] || 0) + 1; });
  return [{ key: '', zh: '全部', n: (D.literature || []).length }].concat(order.map(function (x) { return { key: x.key, zh: x.zh, n: c[x.key] || 0 }; }));
}
function litSubs(D, cat) {
  var s = []; (D.literature || []).forEach(function (r) { if (cat && r.category_key !== cat) return; if (r.subcategory && s.indexOf(r.subcategory) < 0) s.push(r.subcategory); });
  return s.sort();
}
function filterLit(D, o) {
  o = o || {}; var q = lower(o.q).trim();
  return (D.literature || []).filter(function (r) {
    if (o.cat && r.category_key !== o.cat) return false;
    if (o.sub && r.subcategory !== o.sub) return false;
    var hay = [r.bound_id, r.enrich ? [r.enrich.authors, r.enrich.affiliation, r.enrich.summary_zh].join(' ') : '', r.category_key, r.category_zh, r.subcategory,
      r.metric, r.value_range, r.organism_or_context, r.title, r.note, r.DOI_or_source].join(' ');
    if (q && hay.toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
}
function stars(r) { var e = r.enrich, n = e ? parseInt(e.stars, 10) : NaN; return (!e || !n) ? 0 : n; }

// ---- 商用·技术 ----
function catalogFor(D, cat) {
  var items = (D.catalog || []).slice().sort(function (a, b) { return Number(a.rank) - Number(b.rank); });
  return cat ? items.filter(function (r) { return r.category_key === cat; }) : items;
}
function commCats(D) {
  var CT = D.commercial_taxonomy || { categories: [], counts: {} };
  return [{ key: '', zh: '全部', n: CT.total_catalog || (D.catalog || []).length }].concat((CT.categories || []).map(function (c) { return { key: c.key, zh: c.zh, n: (CT.counts && CT.counts[c.key]) || 0 }; }));
}
function brandsFor(D, o) {
  o = o || {}; var q = lower(o.q).trim(), CP = D.commercial_products || { brands: [] };
  return CP.brands.filter(function (b) { return !o.brand || b.brand === o.brand; }).map(function (b) {
    return { brand: b.brand, items: (b.items || []).filter(function (it) {
      if (o.cat && it.category_key !== o.cat) return false;
      return !q || joinHay([it.product, it.category_zh, it.tech_type, it.claims, it.source]).indexOf(q) >= 0;
    }) };
  }).filter(function (b) { return b.items.length; });
}
function techEntries(D, kind) { return ((D.tech_aux || {}).entries || []).filter(function (e) { return e.kind === kind; }); }

// ---- 行业动态 ----
function weeks(D) { return ((D.industry || {}).weeks) || []; }
function highOf(w) { return (w.entries || []).filter(function (e) { return e.relevance === '高'; }).length; }
function industryCats(D) { return ((D.industry || {}).categories) || ['法规', '企业', '产品', '技术']; }
function scopeEntries(D, mode, week) {
  var W = weeks(D);
  if (mode === 'all') return W.reduce(function (a, w) { return a.concat(w.entries || []); }, []);
  var w = W.filter(function (x) { return x.week === week; })[0] || W[0]; return (w && w.entries) || [];
}
function filterIndustry(D, o) {
  o = o || {}; var q = lower(o.q).trim();
  var match = function (e) {
    if (o.cat && e.category !== o.cat) return false;
    if (o.rel && e.relevance !== o.rel) return false;
    if (q && joinHay([e.title, e.summary, e.url, e.relevance_reason, e.note, e.category, e.date]).indexOf(q) < 0) return false;
    return true;
  };
  if (o.mode === 'all') {
    return weeks(D).map(function (w) { return { week: w.week, backfill: !!w.backfill, coverage: w.coverage || '', entries: (w.entries || []).filter(match) }; })
      .filter(function (g) { return g.entries.length; });
  }
  var W = weeks(D), w = W.filter(function (x) { return x.week === o.week; })[0] || W[0];
  if (!w) return [];
  return [{ week: w.week, backfill: !!w.backfill, coverage: w.coverage || '', trend: w.trend_summary || '', entries: (w.entries || []).filter(match) }];
}

// ---- 学者排行 ----
function filterScholars(D, o) {
  o = o || {}; var q = lower(o.q).trim();
  return (D.researchers || []).filter(function (r) {
    return (!o.onlyLit || r.in_our_literature) && (!q || joinHay([r.name, r.institution, r.country, r.representative_work]).indexOf(q) >= 0);
  });
}

module.exports = {
  KNOWN_TAGS: KNOWN_TAGS, TAG_CLS: TAG_CLS, splitTags: splitTags, pressPct: pressPct, typeLabel: typeLabel, safeHttpUrl: safeHttpUrl,
  overview: overview, labBaseKey: labBaseKey, labGroups: labGroups, filterLab: filterLab,
  routeTypes: routeTypes, filterRoutes: filterRoutes, pNum: pNum, pColor: pColor, recFor: recFor,
  litCats: litCats, litSubs: litSubs, filterLit: filterLit, stars: stars,
  catalogFor: catalogFor, commCats: commCats, brandsFor: brandsFor, techEntries: techEntries,
  weeks: weeks, highOf: highOf, industryCats: industryCats, scopeEntries: scopeEntries, filterIndustry: filterIndustry,
  filterScholars: filterScholars
};
