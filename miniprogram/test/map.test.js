const test = require('node:test'), assert = require('node:assert/strict');
const map = require('../utils/map.js');
const { WORLD_LAND_PATH } = require('../data/world-land.js');
const D = require('../data/data.js');

test('xy equirectangular', () => {
  assert.deepEqual(map.xy([0, 0]), [180, 90]);
  assert.deepEqual(map.xy([-180, 90]), [0, 0]);
  assert.deepEqual(map.xy([180, -90]), [360, 180]);
});

test('parseSvgPath M/L/Z', () => {
  const polys = map.parseSvgPath('M0 0L10 0L10 10Z M20 20L30 20');
  assert.equal(polys.length, 2);
  assert.deepEqual(polys[0], [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }]);
  assert.equal(polys[1].length, 2);
});

test('WORLD_LAND_PATH parses to many polygons', () => {
  const polys = map.parseSvgPath(WORLD_LAND_PATH);
  assert.ok(polys.length > 20, 'land polys ' + polys.length);
  assert.ok(polys[0].length >= 3);
});

test('boundsOf + overviewViewBox + pColor', () => {
  const id = Object.keys(D.route_geometry.routes)[0];
  const b = map.boundsOf(D.route_geometry.routes[id]);
  assert.equal(b.length, 4);
  assert.ok(b[2] > 0 && b[3] > 0);
  assert.ok(b[2] / b[3] >= 1.99 && b[2] / b[3] <= 2.01);
  assert.deepEqual(map.overviewViewBox(), [0, 8, 360, 160]);
  assert.equal(map.pColor(4), '#e0592a');
  assert.equal(map.pNum('中–高 / 3–4'), 3.5);
  assert.equal(map.trackStroke({ overall_num: 4 }, {}, false), '#e0592a');
  assert.equal(map.trackStroke({}, { pressure: '高 / 4' }, true), '#e0592a');
});

test('geoNote honesty', () => {
  const n = map.geoNote(D.route_geometry);
  assert.match(n, /示意性航迹/);
  assert.match(n, /Natural Earth/);
});
