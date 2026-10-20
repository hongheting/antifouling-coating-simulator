const { data, copy, links, core } = require('../../utils/ui.js');
const PAGE = 20;
Page({
  data: { cats: [], cat: '', subs: ['全部工艺'], subIdx: 0, q: '', rows: [], total: 0, shown: PAGE,
    rubric: '重要度星级为主观评估（非实测）：基础 1 星；年均被引 ≥4/≥15/≥50 加 1/2/3；主流期刊加 1；题名直接涉及 antifouling 加 1；封顶 5 星。' },
  onLoad() { this.setData({ cats: core.litCats(data()) }); this.refreshSubs(); this.render(); },
  refreshSubs() { this.setData({ subs: ['全部工艺'].concat(core.litSubs(data(), this.data.cat)), subIdx: 0 }); },
  render() {
    const sub = this.data.subIdx ? this.data.subs[this.data.subIdx] : '';
    const all = core.filterLit(data(), { cat: this.data.cat, sub, q: this.data.q });
    const rows = all.slice(0, this.data.shown).map((r) => {
      const e = r.enrich, n = core.stars(r);
      return { id: r.bound_id, cat: r.category_zh || r.category_key || '', sub: r.subcategory || '', sum: (e && e.summary_zh) || '未核实',
        authors: e && e.authors !== '未核实' ? e.authors : '', aff: e && e.authors !== '未核实' ? e.affiliation : '', year: r.year || '',
        on: '★★★★★'.slice(0, n), off: n ? '★★★★★'.slice(n) : '', cited: e ? e.cited_by : '', tag: r.tag, title: r.title || '', doi: r.DOI_or_source || '',
        note: r.note || '', links: links(r.links) };
    });
    this.setData({ rows, total: all.length });
  },
  pickCat(e) { this.setData({ cat: e.currentTarget.dataset.key, shown: PAGE }); this.refreshSubs(); this.render(); },
  pickSub(e) { this.setData({ subIdx: Number(e.detail.value), shown: PAGE }); this.render(); },
  onQ(e) { this.setData({ q: e.detail.value, shown: PAGE }); this.render(); },
  onReachBottom() { if (this.data.shown < this.data.total) { this.setData({ shown: this.data.shown + PAGE }); this.render(); } },
  copyLink(e) { copy(e.currentTarget.dataset.url, '链接已复制，可在浏览器打开'); }
});
