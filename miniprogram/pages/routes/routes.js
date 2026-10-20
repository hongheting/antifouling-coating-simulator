const { data, go, core } = require('../../utils/ui.js');
Page({
  data: {
    types: ['全部类型'], typeIdx: 0, list: [], sel: null,
    rawRoutes: [], geometry: null, highlightId: ''
  },
  onLoad() {
    const D = data();
    this.setData({
      types: ['全部类型'].concat(core.routeTypes(D)),
      rawRoutes: D.routes || [],
      geometry: D.route_geometry || { routes: {} }
    });
    this.render();
  },
  render() {
    const ty = this.data.typeIdx ? this.data.types[this.data.typeIdx] : '';
    this.setData({
      list: core.filterRoutes(data(), ty).map((r) => ({
        id: r.profile_id, name: r.name_zh, band: r.climate_band,
        press: r.overall_pressure, pct: core.pressPct(r.overall_num),
        strategy: r.strategy, type: r.type
      }))
    });
  },
  pickType(e) {
    this.setData({ typeIdx: Number(e.detail.value), sel: null, highlightId: '' });
    this.render();
  },
  open(e) { this.select(e.currentTarget.dataset.id); },
  onMapSelect(e) { this.select(e.detail.id); },
  select(id) {
    const r = data().routes.find((x) => x.profile_id === id);
    if (!r) return;
    this.setData({
      highlightId: id,
      sel: {
        id: r.profile_id, name: r.name_zh, band: r.climate_band,
        press: r.overall_pressure, strategy: r.strategy,
        legs: (r.legs || []).map((l, i) => ({
          i: i + 1, seg: l.segment, press: l.pressure, hint: l.hint || '',
          color: core.pColor(core.pNum(l.pressure))
        }))
      }
    }, () => { wx.pageScrollTo({ selector: '#route-detail', duration: 220 }); });
  },
  close() { this.setData({ sel: null, highlightId: '' }); },
  toRec() { go('/pages/rec/rec?pid=' + encodeURIComponent(this.data.sel.id)); }
});
