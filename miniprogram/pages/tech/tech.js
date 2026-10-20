const { data, copy, links, core } = require('../../utils/ui.js');
Page({
  data: { seg: 'catalog', cats: [], cat: '', catalog: [], brandNames: ['全部品牌'], brandIdx: 0, q: '', brands: [], typeLookup: [], aux: {} },
  onLoad() {
    const D = data(), T = D.tech_aux || {};
    const mapE = (arr) => arr.map((e) => ({ entry: e.entry, points: e.points, citation: e.citation, tag: e.tag, links: links(e.links) }));
    this.setData({ cats: core.commCats(D), brandNames: ['全部品牌'].concat(((D.commercial_products || {}).brands || []).map((b) => b.brand)),
      typeLookup: (D.commercial_products || {}).type_lookup || [],
      aux: { uvcP: T.uvc_principles || [], usP: T.us_principles || [], uvc: mapE(core.techEntries(D, 'uvc')), us: mapE(core.techEntries(D, 'ultrasound')), hybrids: T.hybrids || [], safety: T.safety || [] } });
    this.render();
  },
  render() {
    const D = data();
    const catalog = core.catalogFor(D, this.data.cat).map((r) => ({ rank: r.rank, name: r.name, type: core.typeLabel(r.type), catZh: r.category_zh || '', tag: r.evidence_tag, caveats: r.caveats || '', note: r.note || '', links: links(r.links) }));
    const brand = this.data.brandIdx ? this.data.brandNames[this.data.brandIdx] : '';
    const brands = core.brandsFor(D, { brand, cat: this.data.cat, q: this.data.q }).map((b) => ({ brand: b.brand,
      items: b.items.map((it) => ({ product: it.product, catZh: it.category_zh || '', tech: it.tech_type, claims: it.claims, source: it.source, tag: it.tag, links: links(it.links) })) }));
    this.setData({ catalog, brands });
  },
  pickSeg(e) { this.setData({ seg: e.currentTarget.dataset.seg }); },
  pickCat(e) { this.setData({ cat: e.currentTarget.dataset.key }); this.render(); },
  pickBrand(e) { this.setData({ brandIdx: Number(e.detail.value) }); this.render(); },
  onQ(e) { this.setData({ q: e.detail.value }); this.render(); },
  copyLink(e) { copy(e.currentTarget.dataset.url, '链接已复制，可在浏览器打开'); }
});
