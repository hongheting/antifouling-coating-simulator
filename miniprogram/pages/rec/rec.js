const { data, copy, links, core } = require('../../utils/ui.js');
Page({
  data: { names: [], ids: [], idx: 0, items: [] },
  onLoad(q) {
    const R = data().routes;
    const ids = R.map((r) => r.profile_id), names = R.map((r) => r.name_zh + '（' + r.profile_id + '）');
    let idx = ids.indexOf(q && q.pid ? decodeURIComponent(q.pid) : 'ROUTE-SHA-SIN-V0'); if (idx < 0) idx = 0;
    this.setData({ ids, names, idx }); this.render();
  },
  render() {
    const items = core.recFor(data(), this.data.ids[this.data.idx]).map((r) => ({ rank: r.rank, name: r.name, type: core.typeLabel(r.type), tag: r.evidence_tag,
      trackA: r.matched_track_A_id || '', caveats: r.caveats || '', note: r.note || '', links: links(r.links) }));
    this.setData({ items });
  },
  pick(e) { this.setData({ idx: Number(e.detail.value) }); this.render(); },
  copyLink(e) { copy(e.currentTarget.dataset.url, '链接已复制，可在浏览器打开'); }
});
