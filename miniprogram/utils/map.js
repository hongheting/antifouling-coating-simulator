/**
 * 航线示意地图纯函数（与 ui/index.html 同口径：x=lon+180, y=90-lat）。
 * 仅几何/颜色，无 canvas、无 DOM。
 */
'use strict';
var core = require('./core.js');

function xy(p) {
  return [Number(p[0]) + 180, 90 - Number(p[1])];
}

/** Parse SVG path with M/L/Z (and lowercase) into subpaths of {x,y}[]. */
function parseSvgPath(d) {
  var out = [], cur = null;
  if (!d) return out;
  var re = /([MLZmlz])|(-?\d+(?:\.\d+)?)/g, m, cmd = null, nums = [];
  function flush() {
    if (!cmd || !nums.length) { nums = []; return; }
    var c = cmd.toUpperCase();
    if (c === 'M') {
      cur = []; out.push(cur);
      for (var i = 0; i + 1 < nums.length; i += 2) cur.push({ x: nums[i], y: nums[i + 1] });
    } else if (c === 'L' && cur) {
      for (var j = 0; j + 1 < nums.length; j += 2) cur.push({ x: nums[j], y: nums[j + 1] });
    }
    nums = [];
  }
  while ((m = re.exec(d))) {
    if (m[1]) { flush(); cmd = m[1]; if (cmd.toUpperCase() === 'Z') { cmd = null; } }
    else nums.push(Number(m[2]));
  }
  flush();
  return out;
}

function boundsOf(geoRoute) {
  var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  (geoRoute.legs || []).forEach(function (ps) {
    ps.forEach(function (pts) {
      pts.forEach(function (p) {
        var xy_ = xy(p); var x = xy_[0], y = xy_[1];
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      });
    });
  });
  if (x0 > x1) return [0, 8, 360, 160];
  var w = x1 - x0, h = y1 - y0;
  var pad = Math.max(6, Math.max(w, h) * 0.18);
  x0 -= pad; y0 -= pad; w += pad * 2; h += pad * 2;
  if (w / h < 2) { var nw = h * 2; x0 -= (nw - w) / 2; w = nw; }
  else { var nh = w / 2; y0 -= (nh - h) / 2; h = nh; }
  return [x0, y0, w, h];
}

function overviewViewBox() { return [0, 8, 360, 160]; }

function geoNote(GEO) {
  GEO = GEO || {};
  return '示意性航迹，非 AIS 实测；底图 Natural Earth 110m' + (GEO.note ? '。' + GEO.note : '');
}

function trackStroke(route, leg, single) {
  if (single) return core.pColor(core.pNum(leg && leg.pressure));
  return core.pColor(Number(route && route.overall_num));
}

function pathPoints(pts) {
  return (pts || []).map(function (p) { var a = xy(p); return { x: a[0], y: a[1] }; });
}

module.exports = {
  xy: xy, parseSvgPath: parseSvgPath, boundsOf: boundsOf, overviewViewBox: overviewViewBox,
  geoNote: geoNote, trackStroke: trackStroke, pathPoints: pathPoints, pColor: core.pColor, pNum: core.pNum
};
