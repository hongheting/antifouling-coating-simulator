#!/usr/bin/env node
/** Copy the mobile 0.6.0 web UI (mobile/www, already relay-injected) into desktop/ui + web-version.json. */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SRC = process.env.UI_SRC || path.resolve(ROOT, '../mobile/www');
const DST = path.join(ROOT, 'ui');
fs.rmSync(DST, { recursive: true, force: true });
fs.cpSync(SRC, DST, { recursive: true });
const wv = JSON.parse(fs.readFileSync(path.resolve(ROOT, '../mobile/web-version.json'), 'utf8'));
fs.writeFileSync(path.join(DST, 'web-version.json'), JSON.stringify({ webVersion: wv.webVersion, webBuild: wv.webBuild }, null, 2) + '\n');
const html = fs.readFileSync(path.join(DST, 'index.html'), 'utf8');
if (!html.includes('"webBuild":' + wv.webBuild)) throw new Error('mobile/www is not at webBuild ' + wv.webBuild + ' — run mobile sync-www first');
console.log('synced', SRC, '→', DST, wv.webVersion, fs.readdirSync(DST).length, 'files');
