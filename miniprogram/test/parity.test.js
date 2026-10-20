// 对照测试：同一份数据、同一组输入，网页版 ui/index.html（jsdom 真跑）与小程序 utils/core.js 输出必须一致。
const test = require('node:test'), assert = require('node:assert/strict'), path = require('path'), fs = require('fs');
const UI = process.env.UI_DIR || path.resolve(__dirname, '../../ui');
const JSDOM_DIR = process.env.JSDOM_DIR || (function () { try { return require.resolve('jsdom'); } catch (e) { return '/tmp/gq/node_modules/jsdom'; } })();
const { JSDOM } = require(JSDOM_DIR);
const core = require('../utils/core.js');
const D = require('../data/data.js');

function loadWeb() {
  return new Promise((res, rej) => {
    const html = fs.readFileSync(path.join(UI, 'index.html'), 'utf8');
    const dom = new JSDOM(html, { url: 'file://' + UI + '/index.html', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true });
    dom.window.addEventListener('load', () => setTimeout(() => res(dom.window), 50));
    setTimeout(() => rej(new Error('load timeout')), 20000);
  });
}
const txt = (els) => Array.from(els).map((e) => e.textContent.trim());
function fire(w, el, type) { el.dispatchEvent(new w.Event(type, { bubbles: true })); }

test('web ↔ core parity', async (t) => {
  const w = await loadWeb(), d = w.document;
  // data identity: the bundled mini-program data must equal the web snapshot for every field the logic reads
  const WD = w.SIM_DATA;
  assert.equal(D.lab.length, WD.lab.length); assert.equal(D.literature.length, WD.literature.length);

  await t.test('overview stats', () => {
    const web = txt(d.querySelectorAll('#stats .stat')).map((s) => s.replace(/\s+/g, ''));
    const mine = core.overview(D).map((x) => (String(x.n) + x.label).replace(/\s+/g, ''));
    assert.deepEqual(web, mine);
  });

  await t.test('lab filters', () => {
    const tagSel = d.getElementById('lab-tag-filter'), q = d.getElementById('lab-search');
    const tags = [''].concat(Array.from(tagSel.options).map((o) => o.value).filter(Boolean));
    let n = 0;
    for (const g of core.labGroups(D)) for (const tag of tags) for (const query of ['', 'CA', '待', 'jf-602', 'zzz']) {
      d.querySelector('#lab-base-chips .chip[data-key="' + g.key + '"]').click();
      tagSel.value = tag; q.value = query; fire(w, q, 'input');
      const web = txt(d.querySelectorAll('#lab-table tbody .id'));
      const mine = core.filterLab(D, { base: g.key, tag, q: query }).map((r) => r.formulation_id);
      assert.deepEqual(web, mine, JSON.stringify({ g: g.key, tag, query })); n++;
    }
    assert.ok(n > 30);
  });

  await t.test('routes by type + recommendations per route', () => {
    const sel = d.getElementById('route-type-filter');
    for (const ty of [''].concat(core.routeTypes(D))) {
      sel.value = ty; fire(w, sel, 'change');
      assert.deepEqual(Array.from(d.querySelectorAll('#route-grid .route-card')).map((e) => e.dataset.id), core.filterRoutes(D, ty).map((r) => r.profile_id));
      const pcts = Array.from(d.querySelectorAll('#route-grid .press-bar i')).map((i) => parseInt(i.style.width, 10));
      assert.deepEqual(pcts, core.filterRoutes(D, ty).map((r) => core.pressPct(r.overall_num)));
    }
    const rs = d.getElementById('rec-profile');
    for (const r of D.routes) {
      rs.value = r.profile_id; fire(w, rs, 'change');
      const web = Array.from(d.querySelectorAll('#rank-list .rank-item')).map((e) => e.querySelector('.rank-num').textContent + '|' + e.querySelector('.title').firstChild.textContent.trim());
      assert.deepEqual(web, core.recFor(D, r.profile_id).map((x) => x.rank + '|' + x.name), r.profile_id);
    }
  });

  await t.test('literature filters', () => {
    const q = d.getElementById('lit-search'), sub = d.getElementById('lit-sub-filter');
    for (const c of core.litCats(D)) {
      d.querySelector('#lit-cat-chips .chip[data-key="' + c.key + '"]').click();
      const subs = [''].concat(core.litSubs(D, c.key));
      assert.deepEqual(Array.from(sub.options).map((o) => o.value), subs, 'subs ' + c.key);
      for (const s of subs) for (const query of ['', 'uv', '铜', 'doi']) {
        sub.value = s; q.value = query; fire(w, q, 'input');
        const web = Array.from(d.querySelectorAll('#lit-table tbody tr')).filter((tr) => !tr.querySelector('.empty')).length;
        assert.equal(web, core.filterLit(D, { cat: c.key, sub: s, q: query }).length, JSON.stringify({ c: c.key, s, query }));
      }
    }
  });

  await t.test('catalog + brands', () => {
    const bq = d.getElementById('brand-search'), bf = d.getElementById('brand-filter');
    for (const c of core.commCats(D)) {
      d.querySelector('#comm-cat-chips .chip[data-key="' + c.key + '"]').click();
      assert.deepEqual(Array.from(d.querySelectorAll('#catalog-list .rank-item .rank-num')).map((e) => e.textContent), core.catalogFor(D, c.key).map((r) => String(r.rank)), 'cat ' + c.key);
      for (const brand of [''].concat(D.commercial_products.brands.map((b) => b.brand))) for (const query of ['', 'silicone', '铜']) {
        bf.value = brand; bq.value = query; fire(w, bq, 'input');
        const web = txt(d.querySelectorAll('#brand-blocks tbody td:first-child strong'));
        const mine = core.brandsFor(D, { brand, cat: c.key, q: query }).reduce((a, b) => a.concat(b.items.map((i) => i.product)), []);
        assert.deepEqual(web, mine.map((s) => String(s).trim()), JSON.stringify({ c: c.key, brand, query }));
      }
    }
  });

  await t.test('industry', () => {
    const rel = d.getElementById('ind-rel'), q = d.getElementById('ind-search');
    const modes = Array.from(d.querySelectorAll('#ind-mode button'));
    for (const mode of ['week', 'all']) {
      modes.find((b) => b.dataset.mode === mode).click();
      const weekList = mode === 'week' ? core.weeks(D).slice(0, 6).map((x) => x.week) : [null];
      for (const wk of weekList) {
        if (wk) { d.querySelector('.wk-btn[data-week="' + wk + '"]').click(); }
        for (const cat of [''].concat(core.industryCats(D))) for (const r of ['', '高', '中']) for (const query of ['', '铜', 'imo']) {
          const chip = d.querySelector('#ind-cat-chips .chip[data-key="' + cat + '"]'); chip.click();
          rel.value = r; q.value = query; fire(w, q, 'input');
          const web = d.querySelectorAll('#ind-list .ind-card').length;
          const mine = core.filterIndustry(D, { mode, week: wk, cat, rel: r, q: query }).reduce((n, g) => n + g.entries.length, 0);
          assert.equal(web, mine, JSON.stringify({ mode, wk, cat, r, query }));
        }
      }
    }
  });

  await t.test('scholars', () => {
    const q = d.getElementById('sch-search'), cb = d.getElementById('sch-inlit');
    for (const only of [false, true]) for (const query of ['', 'china', 'university', 'qian']) {
      cb.checked = only; q.value = query; fire(w, q, 'input');
      const web = Array.from(d.querySelectorAll('#sch-table tbody tr')).filter((tr) => !tr.querySelector('.empty')).map((tr) => tr.children[1].querySelector('strong').textContent);
      assert.deepEqual(web, core.filterScholars(D, { onlyLit: only, q: query }).map((r) => r.name), JSON.stringify({ only, query }));
    }
  });

  await t.test('tags + route leg colors', () => {
    assert.deepEqual(core.splitTags('粗估观察;相对等级, 新标签').map((x) => x.cls), ['tag-estimate', 'tag-relative', 'tag-default']);
    assert.equal(core.pNum('中–高 / 3–4'), 3.5); assert.equal(core.pColor(4), '#e0592a'); assert.equal(core.pNum('x'), null);
  });
  w.close();
});
