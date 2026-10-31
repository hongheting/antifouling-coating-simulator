#!/usr/bin/env node
/**
 * Copy desktop UI into www/ and inject mobile CSS + Capacitor bridge.
 * Source of truth remains /workspace/coating-simulator/ui/ — do not invent data.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const UI = path.resolve(ROOT, '../ui');
const WWW = path.join(ROOT, 'www');

const COPY_FILES = [
  'index.html',
  'data-snapshot.js',
  'data-snapshot.json',
  'world-land.js',
];

fs.mkdirSync(WWW, { recursive: true });

for (const f of COPY_FILES) {
  const src = path.join(UI, f);
  if (!fs.existsSync(src)) {
    console.warn('skip missing', f);
    continue;
  }
  fs.copyFileSync(src, path.join(WWW, f));
  console.log('copied', f);
}

// Write mobile assets into www
const mobileCss = fs.readFileSync(path.join(ROOT, 'assets/mobile.css'), 'utf8');
const mobileBridge = fs.readFileSync(path.join(ROOT, 'assets/mobile-bridge.js'), 'utf8');
fs.writeFileSync(path.join(WWW, 'mobile.css'), mobileCss);
fs.writeFileSync(path.join(WWW, 'mobile-bridge.js'), mobileBridge);
fs.copyFileSync(path.join(ROOT, 'assets/updater.js'), path.join(WWW, 'updater.js'));
// RELAY_URL for 游客投稿: `RELAY_URL=https://afsim-guest-relay.<sub>.workers.dev npm run apk` (empty → guest mode hidden)
{
  let ex = fs.readFileSync(path.join(ROOT, 'assets/exchange.js'), 'utf8');
  const relay = (process.env.RELAY_URL || '').trim();
  if (relay) {
    if (!/^https:\/\/[^\s'"]+$/.test(relay)) throw new Error('RELAY_URL must be https://…');
    ex = ex.replace("var RELAY_URL = '';", 'var RELAY_URL = ' + JSON.stringify(relay) + ';');
    if (!ex.includes(JSON.stringify(relay))) throw new Error('RELAY_URL injection failed');
    console.log('RELAY_URL =', relay);
  } else console.log('RELAY_URL empty → guest posting hidden');
  fs.writeFileSync(path.join(WWW, 'exchange.js'), ex);
}
fs.copyFileSync(path.join(ROOT, 'assets/exchange.css'), path.join(WWW, 'exchange.css'));
let bundledVer = '';
try { bundledVer = JSON.parse(fs.readFileSync(path.resolve(ROOT, '../public-data/latest.json'), 'utf8')).data_version || ''; } catch (e) {}

let html = fs.readFileSync(path.join(WWW, 'index.html'), 'utf8');

// Ensure viewport includes viewport-fit=cover for safe-area
if (!/viewport-fit=cover/.test(html)) {
  html = html.replace(
    /content="width=device-width,\s*initial-scale=1"/,
    'content="width=device-width, initial-scale=1, viewport-fit=cover"'
  );
}

// Inject mobile CSS before </head>
if (!html.includes('mobile.css')) {
  html = html.replace(
    '</head>',
    '  <link rel="stylesheet" href="mobile.css" />\n</head>'
  );
}

// Inject bridge before </body>
if (!html.includes('mobile-bridge.js')) {
  html = html.replace(
    '</body>',
    '  <script src="mobile-bridge.js"></script>\n</body>'
  );
}


// 0.3.2 mobile: remove top honesty/safety banner (desktop ui/ unchanged; per-value tags kept)
html = html.replace(/\n?\s*<div class="honesty" role="status">[\s\S]*?<p class="safety" id="safety-text"><\/p>\s*<\/div>\s*<\/div>/, '');
if (html.includes('class="honesty" role="status"')) { throw new Error('honesty banner removal failed'); }
// guard JS that wrote into the removed banner
html = html.replace(/document\.getElementById\('(honesty-text|safety-text)'\)\.(textContent|innerHTML)\s*=/g,
  (m, id, prop) => "(document.getElementById('" + id + "')||{})." + prop + " =");




// Mobile footer: developer contact; drop desktop packaging note
html = html.replace(/<footer>[\s\S]*?<\/footer>/, `<footer>
    <div class="dev-line">由洪鹤庭 Jassyhong 开发，有疑问请联系 <a href="tel:17607144929">17607144929</a></div>
  </footer>`);

// 0.5.0 updater: right after data snapshot, before page script
if (!html.includes('updater.js')) {
  html = html.replace('<script src="data-snapshot.js"></script>',
    '<script src="data-snapshot.js"></script>\n<script>window.BUNDLED_DATA_VERSION=' + JSON.stringify(bundledVer) + ';</script>\n<script src="updater.js"></script>');
  if (!html.includes('updater.js')) throw new Error('updater injection failed');
}

// 0.6.0 技术交流 tab (mobile only; desktop ui/ untouched)
if (!html.includes('panel-exchange')) {
  const navEnd = html.indexOf('</nav>', html.indexOf('<nav class="tabs"'));
  html = html.slice(0, navEnd) + '  <button type="button" data-tab="exchange"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg><span>技术交流</span></button>\n  ' + html.slice(navEnd);
  html = html.replace('<section id="panel-scholars" class="panel">', '<section id="panel-exchange" class="panel"></section>\n\n  <section id="panel-scholars" class="panel">');
  html = html.replace('</head>', '  <link rel="stylesheet" href="exchange.css" />\n</head>');
  html = html.replace('<script src="mobile-bridge.js"></script>', '<script src="mobile-bridge.js"></script>\n  <script src="exchange.js"></script>');
  if (!html.includes('id="panel-exchange"') || !html.includes('exchange.js') || !html.includes('data-tab="exchange"')) throw new Error('exchange injection failed');
}

// 0.6.0 OTA web updates: tweetnacl + ota.js right after updater.js (notifyAppReady runs early on boot)
{
  const wv = JSON.parse(fs.readFileSync(path.join(ROOT, 'web-version.json'), 'utf8'));
  if (!/^[0-9]+\.[0-9]+\.[0-9]+\+[0-9]+$/.test(wv.webVersion) || !Number.isInteger(wv.webBuild)) throw new Error('bad web-version.json');
  fs.copyFileSync(require.resolve('tweetnacl/nacl-fast.min.js', { paths: [ROOT] }), path.join(WWW, 'nacl.min.js'));
  fs.copyFileSync(path.join(ROOT, 'assets/ota.js'), path.join(WWW, 'ota.js'));
  if (!html.includes('ota.js')) {
    html = html.replace('<script src="updater.js"></script>', '<script src="updater.js"></script>\n<script>window.AFSIM_WEB=' +
      JSON.stringify({ webVersion: wv.webVersion, webBuild: wv.webBuild }) + ';</script>\n<script src="nacl.min.js"></script>\n<script src="ota.js"></script>');
    if (!html.includes('ota.js')) throw new Error('ota injection failed');
  }
  console.log('web version', wv.webVersion);
}

// Soften title for mobile
html = html.replace(
  '<title>防污涂料配方模拟器 · V0 面板</title>',
  '<title>防污涂料配方模拟器</title>'
);
html = html.replace(
  '<title>MarineCoatSim · 防污涂料配方模拟器 | Open Antifouling Coating Simulator & Evidence Benchmark</title>',
  '<title>防污涂料配方模拟器</title>'
);

fs.writeFileSync(path.join(WWW, 'index.html'), html);
console.log('patched index.html with mobile.css + mobile-bridge.js');
console.log('www ready at', WWW);
