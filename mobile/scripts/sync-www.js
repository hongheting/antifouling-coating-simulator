#!/usr/bin/env node
/**
 * Copy desktop UI into www/ and inject mobile CSS + Capacitor bridge.
 * Source of truth remains ../ui/ — do not invent data.
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

// Soften title for mobile
html = html.replace(
  '<title>防污涂料配方模拟器 · V0 面板</title>',
  '<title>防污涂料配方模拟器</title>'
);

fs.writeFileSync(path.join(WWW, 'index.html'), html);
console.log('patched index.html with mobile.css + mobile-bridge.js');
console.log('www ready at', WWW);
