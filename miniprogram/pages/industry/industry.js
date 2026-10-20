const { data, copy, core } = require('../../utils/ui.js');
const RELS = ['', '高', '中', '低'];
Page({
  data: { mode: 'week', weekNames: [], weekIds: [], weekIdx: 0, cats: [], cat: '', rels: ['全部相关度', '高', '中', '低'], relIdx: 0, q: '', groups: [], count: '', honesty: '' },
  onLoad() {
    const W = core.weeks(data());
    this.setData({ weekIds: W.map((w) => w.week), weekNames: W.map((w, i) => w.week + ' 周' + (i === 0 ? '（最新）' : '') + ' · ' + (w.entries || []).length + ' 条' + (core.highOf(w) ? ' · 高 ' + core.highOf(w) : '')),
      honesty: (data().industry || {}).honesty || '' });
    this.render();
  },
  render() {
    const D = data(), wk = this.data.weekIds[this.data.weekIdx];
    const scope = core.scopeEntries(D, this.data.mode, wk), counts = {};
    scope.forEach((e) => { counts[e.category] = (counts[e.category] || 0) + 1; });
    const cats = [{ key: '', zh: '全部类别', n: scope.length }].concat(core.industryCats(D).map((c) => ({ key: c, zh: c, n: counts[c] || 0 })));
    const groups = core.filterIndustry(D, { mode: this.data.mode, week: wk, cat: this.data.cat, rel: RELS[this.data.relIdx], q: this.data.q }).map((g) => ({
      week: g.week, backfill: g.backfill, coverage: g.coverage, trend: g.trend || '',
      entries: g.entries.map((e, i) => ({ k: g.week + i, cat: e.category || '未分类', date: e.date || '', rel: e.relevance || '', title: e.title || '', summary: e.summary || '',
        reason: e.relevance_reason || '', note: e.note || '', url: core.safeHttpUrl(e.url), src: e.source_text || '' })) }));
    const shown = groups.reduce((n, g) => n + g.entries.length, 0);
    this.setData({ cats, groups, none: shown === 0, count: '显示 ' + shown + ' / ' + scope.length + ' 条' });
  },
  pickMode(e) { this.setData({ mode: e.currentTarget.dataset.mode, cat: '' }); this.render(); },
  pickWeek(e) { this.setData({ weekIdx: Number(e.detail.value), cat: '' }); this.render(); },
  pickCat(e) { this.setData({ cat: e.currentTarget.dataset.key }); this.render(); },
  pickRel(e) { this.setData({ relIdx: Number(e.detail.value) }); this.render(); },
  onQ(e) { this.setData({ q: e.detail.value }); this.render(); },
  copyLink(e) { copy(e.currentTarget.dataset.url, '来源链接已复制'); }
});
