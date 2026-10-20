const { data, core } = require('../../utils/ui.js');
const TAGS = ['', '实测', '待测', '厂家标称', '粗估观察', '方案非实测'];
Page({
  data: { groups: [], base: '', tags: ['全部标签'].concat(TAGS.slice(1)), tagIdx: 0, q: '', rows: [] },
  onLoad() { this.setData({ groups: core.labGroups(data()) }); this.render(); },
  render() {
    const rows = core.filterLab(data(), { base: this.data.base, tag: TAGS[this.data.tagIdx], q: this.data.q }).map((r) => ({
      id: r.formulation_id, basecoat: r.basecoat || '—', ca: r.CA_MSiO2_wt_pct || '—', byk: r.BYK_rel_to_particle_pct || '—',
      cells: [
        { k: '拉拔 MPa', v: r.pull_off_MPa, tag: r.pull_off_tag },
        { k: 'EIS', v: r.eis_note, tag: r.eis_tag },
        { k: 'HPLC CA 释放', v: r.hplc_CA_ug_mL_or_flux, tag: r.hplc_tag },
        { k: '微宇宙相对污损', v: r.microcosm_relative_fouling, tag: r.microcosm_tag }
      ],
      meta: [r.uncertainty || '', r.note || ''].filter(Boolean).join(' · '),
      disadv: (r.disadvantage_notes || '').trim(), safety: r.safety_flags || ''
    }));
    this.setData({ rows });
  },
  pickBase(e) { this.setData({ base: e.currentTarget.dataset.key }); this.render(); },
  pickTag(e) { this.setData({ tagIdx: Number(e.detail.value) }); this.render(); },
  onQ(e) { this.setData({ q: e.detail.value }); this.render(); }
});
