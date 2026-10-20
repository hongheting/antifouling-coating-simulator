const map = require('../../utils/map.js');
const { WORLD_LAND_PATH } = require('../../data/world-land.js');

let LAND_CACHE = null;
function landPaths() {
  if (!LAND_CACHE) LAND_CACHE = map.parseSvgPath(WORLD_LAND_PATH);
  return LAND_CACHE;
}

Component({
  properties: {
    mode: { type: String, value: 'overview' }, // overview | single
    routeId: { type: String, value: '' },
    highlightId: { type: String, value: '' },
    routes: { type: Array, value: [] },
    geometry: { type: Object, value: null },
    animate: { type: Boolean, value: true },
    height: { type: Number, value: 180 }, // css px
    showNote: { type: Boolean, value: true }
  },
  data: { cssW: 320, cssH: 180, note: '' },
  lifetimes: {
    attached() { this._ready = false; this._dash = 0; },
    ready() { this.initCanvas(); },
    detached() { this.stopAnim(); }
  },
  observers: {
    'mode, routeId, highlightId, routes, geometry, animate'() {
      if (this._ready) this.draw(true);
    }
  },
  methods: {
    initCanvas() {
      const q = this.createSelectorQuery();
      q.select('#c').fields({ node: true, size: true }).exec((res) => {
        const info = res && res[0];
        if (!info || !info.node) return;
        const canvas = info.node;
        const ctx = canvas.getContext('2d');
        const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio) || 2;
        const w = info.width || 320, h = info.height || this.data.height || 180;
        canvas.width = Math.max(1, Math.floor(w * dpr));
        canvas.height = Math.max(1, Math.floor(h * dpr));
        ctx.scale(dpr, dpr);
        this._canvas = canvas; this._ctx = ctx; this._w = w; this._h = h; this._ready = true;
        this.setData({ cssW: w, cssH: h });
        this.draw(true);
        if (this.properties.animate) this.startAnim();
      });
    },
    stopAnim() {
      if (this._timer) { clearInterval(this._timer); this._timer = null; }
    },
    startAnim() {
      this.stopAnim();
      this._timer = setInterval(() => {
        this._dash = (this._dash || 0) + 1.2;
        this.draw(false);
      }, 80);
    },
    viewBox() {
      const GEO = this.properties.geometry || {};
      if (this.properties.mode === 'single' && this.properties.routeId && GEO.routes && GEO.routes[this.properties.routeId]) {
        return map.boundsOf(GEO.routes[this.properties.routeId]);
      }
      return map.overviewViewBox();
    },
    project(pt, vb) {
      const x = ((pt.x - vb[0]) / vb[2]) * this._w;
      const y = ((pt.y - vb[1]) / vb[3]) * this._h;
      return [x, y];
    },
    draw(updateNote) {
      if (!this._ctx || !this._w) return;
      const ctx = this._ctx, w = this._w, h = this._h;
      const GEO = this.properties.geometry || { routes: {} };
      const routes = this.properties.routes || [];
      const single = this.properties.mode === 'single';
      const focus = single ? this.properties.routeId : this.properties.highlightId;
      const vb = this.viewBox();
      const wrap = !single;

      // ocean
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#042230'); g.addColorStop(1, '#061820');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      // land (and wrap copy)
      const land = landPaths();
      const drawLand = (dx) => {
        ctx.beginPath();
        land.forEach((poly) => {
          if (!poly.length) return;
          const p0 = this.project({ x: poly[0].x + dx, y: poly[0].y }, vb);
          ctx.moveTo(p0[0], p0[1]);
          for (let i = 1; i < poly.length; i++) {
            const p = this.project({ x: poly[i].x + dx, y: poly[i].y }, vb);
            ctx.lineTo(p[0], p[1]);
          }
          ctx.closePath();
        });
        ctx.fillStyle = 'rgba(28, 78, 92, 0.95)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(60, 140, 150, 0.35)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      };
      drawLand(0);
      if (wrap) drawLand(360);

      // graticule
      ctx.strokeStyle = 'rgba(100, 160, 180, 0.18)';
      ctx.lineWidth = 0.5;
      for (let lon = -180; lon <= 540; lon += 30) {
        const a = this.project({ x: lon + 180, y: 0 }, vb);
        const b = this.project({ x: lon + 180, y: 180 }, vb);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      for (let lat = -60; lat <= 60; lat += 30) {
        const a = this.project({ x: 0, y: 90 - lat }, vb);
        const b = this.project({ x: 720, y: 90 - lat }, vb);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }

      const ids = single
        ? (this.properties.routeId ? [this.properties.routeId] : [])
        : routes.map((r) => r.profile_id || r.id).filter((id) => GEO.routes && GEO.routes[id]);

      const sw = single ? Math.max(1.5, (vb[2] / 260) * (w / 120)) : 2.2;
      const shifts = wrap ? [0, -360] : [0];

      ids.forEach((id) => {
        const geo = GEO.routes[id];
        const r = routes.find((x) => (x.profile_id || x.id) === id) || {};
        if (!geo) return;
        const hi = focus && focus === id;
        const dim = !single && focus && !hi;
        shifts.forEach((sh) => {
          (geo.legs || []).forEach((paths, i) => {
            const leg = (r.legs || [])[i] || {};
            const color = map.trackStroke(r, leg, single);
            paths.forEach((pts) => {
              const pts2 = map.pathPoints(pts).map((p) => ({ x: p.x + sh, y: p.y }));
              if (pts2.length < 2) return;
              ctx.beginPath();
              const p0 = this.project(pts2[0], vb);
              ctx.moveTo(p0[0], p0[1]);
              for (let k = 1; k < pts2.length; k++) {
                const p = this.project(pts2[k], vb);
                ctx.lineTo(p[0], p[1]);
              }
              ctx.strokeStyle = color;
              ctx.globalAlpha = dim ? 0.22 : (hi ? 1 : 0.85);
              ctx.lineWidth = hi ? sw * 1.5 : sw;
              ctx.lineCap = 'round'; ctx.lineJoin = 'round';
              ctx.stroke();
              if (single || hi) {
                ctx.setLineDash([6, 8]);
                ctx.lineDashOffset = -(this._dash || 0);
                ctx.strokeStyle = 'rgba(180, 255, 255, 0.55)';
                ctx.lineWidth = Math.max(1, sw * 0.35);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.lineDashOffset = 0;
              }
              ctx.globalAlpha = 1;
            });
          });
          if (single || this.properties.mode === 'overview') {
            (geo.ports || []).forEach((pt) => {
              let lonlat = pt.lonlat;
              if (lonlat && lonlat[0] < -100 && id === 'ROUTE-TRANSPAC-LA-V0') lonlat = [lonlat[0] + 360, lonlat[1]];
              const xy = map.xy(lonlat);
              const p = this.project({ x: xy[0] + sh, y: xy[1] }, vb);
              ctx.beginPath();
              ctx.arc(p[0], p[1], single ? 3.2 : 2.2, 0, Math.PI * 2);
              ctx.fillStyle = '#d8f6ff';
              ctx.fill();
              ctx.strokeStyle = '#0a7f8c';
              ctx.lineWidth = 1;
              ctx.stroke();
            });
          }
        });
      });

      // hit regions for overview tap (store last layout)
      this._hit = { vb, ids, GEO, routes, wrap };

      if (updateNote && this.properties.showNote) {
        this.setData({ note: map.geoNote(GEO) });
      }
    },
    onTap(e) {
      if (this.properties.mode !== 'overview' || !this._hit) return;
      const { vb, ids, GEO, routes, wrap } = this._hit;
      // Approximate hit: nearest track sample point
      const x = e.detail.x, y = e.detail.y;
      // detail.x/y are relative to the page in some runtimes; prefer offset if present
      let lx = e.detail.x, ly = e.detail.y;
      // WeChat canvas tap: x/y relative to canvas when using bindtap on canvas in many versions
      let best = null, bestD = 18 * 18;
      ids.forEach((id) => {
        const geo = GEO.routes[id]; if (!geo) return;
        const shifts = wrap ? [0, -360] : [0];
        shifts.forEach((sh) => {
          (geo.legs || []).forEach((paths) => {
            paths.forEach((pts) => {
              map.pathPoints(pts).forEach((pt) => {
                const p = this.project({ x: pt.x + sh, y: pt.y }, vb);
                const dx = p[0] - lx, dy = p[1] - ly, d = dx * dx + dy * dy;
                if (d < bestD) { bestD = d; best = id; }
              });
            });
          });
        });
      });
      if (best) this.triggerEvent('select', { id: best });
    }
  }
});
