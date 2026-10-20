#!/usr/bin/env node
/**
 * npm run ota — build a signed OTA web bundle.
 * 1) webBuild += 1 (web-version.json)  2) sync-www  3) zip www/ (index.html at root)  4) sha256
 * 5) Ed25519-sign manifest with /workspace/secrets/afsim-ota-ed25519.pem (or OTA_KEY env path)
 * 6) write public-data/web/{bundle-<v>.zip,manifest.json} in main project + OSS copy; keep latest 2 bundles.
 * Flags: --notes "…"  --min-native 60  --no-bump  --dry (do not write public-data)
 * Bundles are built from THIS project's www (real data — same as the published APK).
 */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2), arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const KEY = process.env.OTA_KEY || '/workspace/secrets/afsim-ota-ed25519.pem';
const OUTS = (process.env.OTA_OUT ? process.env.OTA_OUT.split(':') : [
  path.resolve(ROOT, '../public-data/web'),
  '/workspace/coating-simulator-oss/public-data/web',
]);
const SIGNED_FIELDS = ['file', 'minNativeCode', 'maxNativeCode', 'notes', 'sha256', 'size', 'webBuild', 'webVersion'];
const canonical = (m) => { const o = {}; SIGNED_FIELDS.forEach((k) => { if (m[k] !== undefined) o[k] = m[k]; }); return 'afsim-ota-v1\n' + JSON.stringify(o); };

// Guard: the published APK carries the main project's data; an OTA built from another tree (e.g. the
// example-data OSS copy) would silently swap users' data. Forks: set OTA_ALLOW_TREE=1 and use your own key.
if (ROOT !== '/workspace/coating-simulator/mobile' && process.env.OTA_ALLOW_TREE !== '1') {
  throw new Error('build-ota must run from the main project (/workspace/coating-simulator/mobile); set OTA_ALLOW_TREE=1 to override');
}
const wvPath = path.join(ROOT, 'web-version.json');
const wv = JSON.parse(fs.readFileSync(wvPath, 'utf8'));
const native = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const gradle = fs.readFileSync(path.join(ROOT, 'android/app/build.gradle'), 'utf8');
const nativeCode = +(gradle.match(/versionCode\s+(\d+)/) || [])[1];
let latest = 0;
for (const o of OUTS) { try { latest = Math.max(latest, JSON.parse(fs.readFileSync(path.join(o, 'manifest.json'), 'utf8')).webBuild || 0); } catch (e) {} }
if (!argv.includes('--no-bump')) wv.webBuild = Math.max(wv.webBuild, latest) + 1;
wv.nativeVersion = native; wv.webVersion = native + '+' + wv.webBuild;
if (!fs.existsSync(KEY)) throw new Error('signing key missing: ' + KEY);
fs.writeFileSync(wvPath, JSON.stringify(wv, null, 2) + '\n');

execFileSync(process.execPath, [path.join(__dirname, 'sync-www.js')], { stdio: 'inherit', env: { ...process.env, RELAY_URL: process.env.RELAY_URL || 'https://afsim-guest-relay.hongheting.workers.dev' } });
const www = path.join(ROOT, 'www');

// private-terms scan (same blocklist file as build-public-feed.py), optional
const termsFile = process.env.PRIVATE_TERMS_FILE || path.resolve(ROOT, '../private-terms.txt');
if (fs.existsSync(termsFile)) {
  const terms = fs.readFileSync(termsFile, 'utf8').split('\n').map((t) => t.trim()).filter(Boolean);
  const hits = [];
  for (const f of fs.readdirSync(www)) { const t = fs.readFileSync(path.join(www, f), 'utf8'); terms.forEach((w) => { if (t.includes(w)) hits.push(f + ': ' + w.slice(0, 3) + '…'); }); }
  if (hits.length && !argv.includes('--allow-private')) throw new Error('private terms found (use --allow-private if intended):\n' + hits.join('\n'));
  console.log('private-terms scan:', hits.length ? hits.length + ' hits (allowed)' : 'clean');
} else console.log('private-terms scan skipped (no ' + termsFile + ')');

const file = 'bundle-' + wv.webVersion + '.zip';
const tmp = path.join(ROOT, 'dist', file);
fs.mkdirSync(path.dirname(tmp), { recursive: true }); try { fs.unlinkSync(tmp); } catch (e) {}
execFileSync('python3', ['-c', `
import os, sys, zipfile
src, dst = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED) as z:
    for d, _, fs in sorted(os.walk(src)):
        for f in sorted(fs):
            p = os.path.join(d, f); a = os.path.relpath(p, src)
            zi = zipfile.ZipInfo(a, (2020, 1, 1, 0, 0, 0)); zi.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(zi, open(p, 'rb').read())
`, www, tmp]);
const buf = fs.readFileSync(tmp);
const m = { webVersion: wv.webVersion, webBuild: wv.webBuild, file, sha256: crypto.createHash('sha256').update(buf).digest('hex'), size: buf.length,
  minNativeCode: +(arg('--min-native', nativeCode)), notes: arg('--notes', '界面更新 ' + wv.webVersion) };
const key = crypto.createPrivateKey(fs.readFileSync(KEY));
m.sig = crypto.sign(null, Buffer.from(canonical(m), 'utf8'), key).toString('base64');
m.created_at = new Date().toISOString();
if (!crypto.verify(null, Buffer.from(canonical(m), 'utf8'), crypto.createPublicKey(key), Buffer.from(m.sig, 'base64'))) throw new Error('self-verify failed');

if (argv.includes('--dry')) { console.log(JSON.stringify(m, null, 2)); process.exit(0); }
for (const o of OUTS) {
  if (!fs.existsSync(path.dirname(o))) { console.warn('skip', o); continue; }
  fs.mkdirSync(o, { recursive: true });
  fs.copyFileSync(tmp, path.join(o, file));
  fs.writeFileSync(path.join(o, 'manifest.json'), JSON.stringify(m, null, 2) + '\n');
  const zips = fs.readdirSync(o).filter((f) => /^bundle-.*\.zip$/.test(f))
    .sort((a, b) => (+(b.match(/\+(\d+)\.zip$/) || [0, 0])[1]) - (+(a.match(/\+(\d+)\.zip$/) || [0, 0])[1]));
  zips.slice(2).forEach((f) => fs.unlinkSync(path.join(o, f)));
  console.log('wrote', o, '→', file, m.size, 'bytes; kept', zips.slice(0, 2).join(', '));
}
