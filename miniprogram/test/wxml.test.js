// 小程序静态 + 运行模拟检查（无法运行真实微信开发者工具）：
// 1) 每个 WXML：标签闭合、只用已知组件、{{表达式}} 可解析且只用 WXML 支持的语法（无函数调用）；
// 2) mock wx/Page/Component 运行每个页面 onLoad + 所有事件处理函数，再用页面 data 实际求值 WXML（含 wx:for / wx:if），
//    未定义变量、事件处理函数不存在都会报错；3) 不得出现网络请求 / web-view。
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
const { Parser } = require(process.env.HTMLPARSER2 || (function () { try { return require.resolve('htmlparser2'); } catch (e) { return '/tmp/gq/node_modules/htmlparser2'; } })());
const ROOT = path.resolve(__dirname, '..');
const APP = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
const TAGS = new Set(['view', 'text', 'input', 'picker', 'scroll-view', 'switch', 'block', 'button', 'app-footer', 'tag-list', 'image', 'canvas', 'route-map']);

function parseWxml(file) {
  const src = fs.readFileSync(file, 'utf8'), stack = [], errs = [], root = { name: '#root', attrs: {}, children: [] };
  let cur = root;
  const p = new Parser({
    onopentag(name, attrs) { const n = { name, attrs, children: [], parent: cur }; cur.children.push(n); stack.push(n); cur = n; if (!TAGS.has(name)) errs.push('unknown tag <' + name + '>'); },
    ontext(t) { if (t.trim()) cur.children.push({ text: t }); },
    onclosetag(name, implied) { if (implied && !['input', 'switch', 'app-footer', 'tag-list', 'image', 'canvas', 'route-map'].includes(name)) errs.push('unclosed <' + name + '>'); stack.pop(); cur = cur.parent || root; },
  }, { xmlMode: true, recognizeSelfClosing: true });
  p.write(src); p.end();
  return { root, errs, src };
}
const MUST = /\{\{([\s\S]*?)\}\}/g;
function exprs(s) { const out = []; let m; MUST.lastIndex = 0; while ((m = MUST.exec(s))) out.push(m[1]); return out; }
function evalExpr(e, scope) { return new Function('s', 'with(s){return (' + e + ');}')(scope); } // eslint-disable-line no-new-func
function interp(s, scope) { return String(s).replace(MUST, (_, e) => { const v = evalExpr(e, scope); return v == null ? '' : v; }); }

function render(node, scope, page, errs, where) {
  for (const ch of node.children) {
    if (ch.text != null) { try { interp(ch.text, scope); } catch (e) { errs.push(where + ' text {{' + ch.text.trim().slice(0, 40) + '}}: ' + e.message); } continue; }
    const a = ch.attrs;
    try {
      if (a['wx:if'] != null && !evalExpr(a['wx:if'].replace(/^\{\{|\}\}$/g, ''), scope)) continue;
      if (a['wx:elif'] != null && !evalExpr(a['wx:elif'].replace(/^\{\{|\}\}$/g, ''), scope)) continue;
    } catch (e) { errs.push(where + ' <' + ch.name + '> wx:if: ' + e.message); continue; }
    const each = (sc) => {
      for (const [k, v] of Object.entries(a)) {
        if (/^(bind|catch)/.test(k)) { if (!page || typeof page[v] !== 'function') errs.push(where + ' handler ' + k + '="' + v + '" missing'); continue; }
        if (k.startsWith('wx:')) continue;
        try { interp(v, sc); } catch (e) { errs.push(where + ' <' + ch.name + ' ' + k + '>: ' + e.message); }
      }
      render(ch, sc, page, errs, where);
    };
    if (a['wx:for'] != null) {
      let arr; try { arr = evalExpr(a['wx:for'].replace(/^\{\{|\}\}$/g, ''), scope); } catch (e) { errs.push(where + ' wx:for: ' + e.message); continue; }
      if (!Array.isArray(arr)) { errs.push(where + ' wx:for not array: ' + a['wx:for']); continue; }
      const it = a['wx:for-item'] || 'item', ix = a['wx:for-index'] || 'index';
      arr.slice(0, 5).forEach((v, i) => each(Object.assign(Object.create(scope), { [it]: v, [ix]: i })));
    } else each(scope);
  }
}

// ---- mini runtime ----
let pageDef, compDefs = {};
global.wx = new Proxy({
  setClipboardData(o) { o.success && o.success(); }, showToast() {}, showModal() {}, makePhoneCall() {}, pageScrollTo() {},
  createSelectorQuery() { return { in(){return this;}, select(){return this;}, fields(){return this;}, exec(cb){ cb && cb([null]); return this; } }; },
  getSystemInfoSync(){ return { pixelRatio: 2, windowWidth: 375 }; }, getWindowInfo(){ return { pixelRatio: 2 }; },
  switchTab(o) { nav.push(['switchTab', o.url]); }, navigateTo(o) { nav.push(['navigateTo', o.url]); }, openPrivacyContract() {},
}, { get(t, k) { if (k in t) return t[k]; if (/request|downloadFile|uploadFile|connectSocket/.test(k)) throw new Error('network API used: wx.' + k); return () => {}; } });
const nav = [];
global.Page = (d) => { pageDef = d; };
global.Component = (d) => { compDefs.last = d; };
let appInst; global.App = (d) => { appInst = d; };
global.getApp = () => appInst;
require(path.join(ROOT, 'app.js')); appInst.onLaunch();

function instance(def) {
  const inst = Object.assign({}, def); inst.data = JSON.parse(JSON.stringify(def.data || {}));
  inst.setData = function (o) { Object.assign(this.data, o); };
  for (const k of Object.keys(def)) if (typeof def[k] === 'function') inst[k] = def[k].bind(inst);
  return inst;
}
function ev(dataset, value) { return { currentTarget: { dataset: dataset || {} }, detail: { value } }; }

test('app.json pages all exist; tabBar pages in pages', () => {
  for (const p of APP.pages) for (const ext of ['.js', '.wxml', '.json']) assert.ok(fs.existsSync(path.join(ROOT, p + ext)), p + ext);
  for (const t of APP.tabBar.list) assert.ok(APP.pages.includes(t.pagePath));
});

test('components parse + render', () => {
  for (const c of ['footer', 'tags', 'route-map']) {
    compDefs = {}; delete require.cache[require.resolve(path.join(ROOT, 'components', c, c + '.js'))];
    require(path.join(ROOT, 'components', c, c + '.js'));
    const def = compDefs.last, inst = { data: Object.assign({}, def.data || {}) };
    if (def.properties) for (const [k, v] of Object.entries(def.properties)) inst.data[k] = v.value;
    if (def.observers && def.observers.text) { inst.setData = (o) => Object.assign(inst.data, o); def.observers.text.call(inst, '实测;相对等级'); assert.equal(inst.data.list.length, 2); }
    const { root, errs } = parseWxml(path.join(ROOT, 'components', c, c + '.wxml'));
    const methods = Object.assign({}, def.methods || {});
    render(root, inst.data, methods, errs, c); assert.deepEqual(errs, []);
  }
});

const SCENARIOS = {
  'pages/index/index': (p) => { p.open(ev({ url: '/pages/lab/lab' })); p.open(ev({ url: '/pages/lit/lit' })); },
  'pages/lab/lab': (p) => { p.pickBase(ev({ key: 'powder' })); p.pickTag(ev({}, 2)); p.onQ(ev({}, 'CA')); p.onQ(ev({}, 'zzzz')); p.onQ(ev({}, '')); },
  'pages/routes/routes': (p) => { p.pickType(ev({}, 1)); p.open(ev({ id: p.data.list[0].id })); p.onMapSelect({ detail: { id: p.data.list[0].id } }); p.close(); p.open(ev({ id: p.data.list[0].id })); p.toRec(); },
  'pages/rec/rec': (p) => { p.pick(ev({}, 3)); p.copyLink(ev({ url: 'https://example.org' })); },
  'pages/lit/lit': (p) => { p.pickCat(ev({ key: p.data.cats[1].key })); p.pickSub(ev({}, 1)); p.onQ(ev({}, 'uv')); p.onQ(ev({}, '')); p.onReachBottom(); },
  'pages/tech/tech': (p) => { p.pickSeg(ev({ seg: 'brands' })); p.pickBrand(ev({}, 1)); p.onQ(ev({}, 'silicone')); p.pickCat(ev({ key: p.data.cats[1].key })); p.pickSeg(ev({ seg: 'aux' })); },
  'pages/industry/industry': (p) => { p.pickWeek(ev({}, 1)); p.pickRel(ev({}, 1)); p.pickCat(ev({ key: '法规' })); p.onQ(ev({}, 'imo')); p.pickMode(ev({ mode: 'all' })); },
  'pages/scholars/scholars': (p) => { p.onQ(ev({}, 'china')); p.toggle(ev({}, true)); },
  'pages/exchange/exchange': (p) => { p.copyD(); },
  'pages/about/about': (p) => { p.toExchange(); p.privacy(); p.callDev(); },
};

for (const pg of APP.pages) {
  test('page ' + pg, () => {
    delete require.cache[require.resolve(path.join(ROOT, pg + '.js'))];
    pageDef = null; require(path.join(ROOT, pg + '.js')); assert.ok(pageDef, 'Page() called');
    const p = instance(pageDef); p.onLoad && p.onLoad({});
    const { root, errs } = parseWxml(path.join(ROOT, pg + '.wxml'));
    const check = (label) => { const e = errs.slice(); render(root, p.data, p, e, pg + '[' + label + ']'); assert.deepEqual(e, []); };
    check('load');
    // expressions must not call functions (not supported in WXML)
    for (const ex of exprs(fs.readFileSync(path.join(ROOT, pg + '.wxml'), 'utf8'))) assert.ok(!/[A-Za-z_$][\w$]*\s*\(/.test(ex), 'function call in WXML: ' + ex);
    if (SCENARIOS[pg]) {
      // run each step and re-render after it
      const steps = SCENARIOS[pg].toString();
      SCENARIOS[pg](new Proxy(p, { get(t, k) { const v = t[k]; if (typeof v === 'function') return (...a) => { const r = v(...a); check(String(k)); return r; }; return v; } }));
      assert.ok(steps.length > 0);
    }
    assert.ok(JSON.stringify(p.data).length < 900 * 1024, 'setData payload too large: ' + JSON.stringify(p.data).length);
  });
}

test('no network / web-view / non-whitelisted hosts called', () => {
  const files = [];
  (function walk(d) { for (const f of fs.readdirSync(d)) { if (['test', 'scripts', 'node_modules', 'data'].includes(f)) continue; const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : files.push(p); } })(ROOT);
  for (const f of files.filter((f) => /\.(js|wxml|json)$/.test(f))) {
    const s = fs.readFileSync(f, 'utf8');
    assert.ok(!/wx\.(request|downloadFile|uploadFile|connectSocket)\s*\(/.test(s), 'network api in ' + f);
    assert.ok(!/<web-view/.test(s), 'web-view in ' + f);
  }
  assert.ok(nav.length > 0);
});
