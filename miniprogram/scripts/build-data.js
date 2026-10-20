#!/usr/bin/env node
// 把 ui/data-snapshot.json 打包成小程序本地数据 data/data.js（无网络）。
// 保留 route_geometry（示意航迹，供 canvas 地图）；去掉本机路径/证据链接。数值与标签原样保留。
'use strict';
const fs = require('fs'), path = require('path');
const SRC = process.env.SNAPSHOT || path.resolve(__dirname, '../../ui/data-snapshot.json');
const D = JSON.parse(fs.readFileSync(SRC, 'utf8'));
// keep D.route_geometry for offline maps
(D.lab || []).forEach((r) => { delete r.source; });
(D.recommendations || []).forEach((r) => { delete r.evidence_links; });
(D.catalog || []).forEach((r) => { delete r.evidence_links; });
const out = '// 自动生成：node scripts/build-data.js（来源 ' + path.basename(SRC) + '，版本 ' + ((D.meta || {}).updated || '') + '）。请勿手改。\nmodule.exports = ' + JSON.stringify(D) + ';\n';
fs.mkdirSync(path.resolve(__dirname, '../data'), { recursive: true });
fs.writeFileSync(path.resolve(__dirname, '../data/data.js'), out);
const g = D.route_geometry || {};
console.log('data/data.js', out.length, 'bytes; lab', (D.lab || []).length, 'lit', (D.literature || []).length,
  'geomRoutes', Object.keys(g.routes || {}).length);
