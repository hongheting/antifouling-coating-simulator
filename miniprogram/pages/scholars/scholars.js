const { data, copy, core } = require('../../utils/ui.js');
Page({
  data: { q: '', onlyLit: false, rows: [], total: 0 },
  onLoad() { this.setData({ total: (data().researchers || []).length }); this.render(); },
  render() {
    this.setData({ rows: core.filterScholars(data(), { q: this.data.q, onlyLit: this.data.onlyLit }).map((r) => ({
      rank: r.rank, name: r.name, inst: r.institution || '—', country: r.country || '', h: r.field_h_index, cit: r.field_citations, works: r.field_works,
      oh: r.overall_h_index, oc: r.overall_citations, work: r.representative_work, doi: core.safeHttpUrl(r.representative_doi), url: core.safeHttpUrl(r.profile_url), ptype: r.profile_type || '主页', inLit: !!r.in_our_literature })) });
  },
  onQ(e) { this.setData({ q: e.detail.value }); this.render(); },
  toggle(e) { this.setData({ onlyLit: e.detail.value }); this.render(); },
  copyLink(e) { copy(e.currentTarget.dataset.url, '链接已复制'); }
});
