'use strict';

/**
 * Electron 0.6.0 shell (same web UI as mobile 0.6.0) for the antifouling coating simulator panel.
 * Security: nodeIntegration off, contextIsolation on, sandbox on;
 * loadFile local UI only (built-in, or an Ed25519-signed + sha256-verified OTA bundle in userData);
 * never loads remote pages. Network from main is limited to an explicit URL allowlist.
 * Honesty: do not strip the "simulation ≠ measurement" banner in ui/.
 * External links (行业动态 sources): only http/https, opened in the OS
 * browser via shell.openExternal; never navigated inside the app window.
 */

const { app, BrowserWindow, shell, ipcMain, net, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { DesktopOta } = require('./ota-desktop');

const NATIVE_VERSION = app.getVersion();
const NATIVE_CODE = 60; // keep in sync with mobile versionCode (OTA minNativeCode gate)
const RELAY_HOST = 'afsim-guest-relay.hongheting.workers.dev';
const HTTP_ALLOW = ['https://github.com/login/device/code', 'https://github.com/login/oauth/access_token'];
let ota = null;
let builtinBuild = 0;

/** Return a normalized http(s) URL string, or null for anything else. */
function safeExternalUrl(url) {
  try {
    const u = new URL(String(url || ''));
    return (u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'tel:' || u.protocol === 'mailto:') ? u.href : null;
  } catch (_) {
    return null;
  }
}

function openExternalSafe(url) {
  const ok = safeExternalUrl(url);
  if (ok) {
    shell.openExternal(ok).catch((err) => console.error('openExternal failed:', err));
  }
}

const WINDOW_TITLE = '防污涂料配方模拟器 ' + NATIVE_VERSION + '（模拟≠实测）';

function builtinUiDir() {
  return app.isPackaged ? path.join(process.resourcesPath, 'ui') : path.join(__dirname, 'ui');
}

function resolveUiIndexHtml() {
  const fromOta = ota && ota.resolvedIndex;
  if (fromOta) return fromOta;
  if (app.isPackaged) {
    // Packaged: ui/ copied via electron-builder extraResources → resources/ui
    return path.join(process.resourcesPath, 'ui', 'index.html');
  }
  // Dev: desktop/ui is produced by `npm run sync-ui` from mobile/www (same UI as the app)
  return path.join(__dirname, 'ui', 'index.html');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: WINDOW_TITLE,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  // Keep title honest even if the page sets document.title
  win.on('page-title-updated', (event) => {
    event.preventDefault();
    win.setTitle(WINDOW_TITLE);
  });

  // Navigation / popup policy for all web contents is set in
  // app.on('web-contents-created') below (covers this window too).

  // Block permission requests that are irrelevant to a static panel
  win.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) => {
    callback(false);
  });

  win.loadFile(resolveUiIndexHtml()).catch((err) => {
    console.error('Failed to load UI:', resolveUiIndexHtml(), err);
  });
}

function setupIpc() {
  ipcMain.handle('afsim:appInfo', () => ({ name: '防污涂料配方模拟器', id: 'com.heting.coating-simulator', version: NATIVE_VERSION, build: String(NATIVE_CODE), platform: 'electron' }));
  ipcMain.handle('afsim:openExternal', (_e, url) => { openExternalSafe(url); return {}; });
  ipcMain.handle('afsim:quit', () => app.quit());
  // GitHub OAuth device flow endpoints have no CORS → done from main, fixed URL allowlist, JSON POST only.
  ipcMain.handle('afsim:http', async (_e, o) => {
    if (!o || !HTTP_ALLOW.includes(o.url) || String(o.method).toUpperCase() !== 'POST') throw new Error('request not allowed');
    const r = await net.fetch(o.url, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(o.data || {}) });
    const text = await r.text();
    let data = text; try { data = JSON.parse(text); } catch (e) { /* keep text */ }
    return { status: r.status, data };
  });
  ipcMain.handle('afsim:ota', async (e, o) => {
    if (!ota) throw new Error('ota unavailable');
    const op = o && o.op;
    if (op === 'notifyAppReady') return ota.notifyAppReady();
    if (op === 'list') return ota.list();
    if (op === 'download') return ota.download(o.opts || {});
    if (op === 'next') return ota.next(o.opts || {});
    if (op === 'set') { const r = ota.set(o.opts || {}); setTimeout(() => { app.relaunch(); app.exit(0); }, 200); return r; }
    throw new Error('bad op');
  });
}

function setupRelayCors() {
  // Guest relay only allowlists app origins; file:// pages send Origin "null". Allow just that host.
  const filter = { urls: ['https://' + RELAY_HOST + '/*'] };
  session.defaultSession.webRequest.onHeadersReceived(filter, (d, cb) => {
    const h = {};
    for (const k of Object.keys(d.responseHeaders || {})) if (!/^access-control-allow-origin$/i.test(k)) h[k] = d.responseHeaders[k];
    h['Access-Control-Allow-Origin'] = ['*'];
    h['Access-Control-Allow-Headers'] = ['Content-Type'];
    h['Access-Control-Allow-Methods'] = ['GET, POST, OPTIONS'];
    cb({ responseHeaders: h });
  });
  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (d, cb) => {
    cb({ requestHeaders: { ...d.requestHeaders, Origin: 'http://localhost' } });
  });
}

function setupOta() {
  try {
    const wv = JSON.parse(fs.readFileSync(path.join(builtinUiDir(), 'web-version.json'), 'utf8'));
    builtinBuild = wv.webBuild | 0;
  } catch (e) { builtinBuild = 0; }
  try {
    ota = new DesktopOta(app.getPath('userData'), builtinBuild, NATIVE_CODE);
    ota.resolvedIndex = ota.resolveIndex();
    if (ota.resolvedIndex) console.log('OTA bundle', ota.currentVersion());
  } catch (e) { console.error('OTA init failed (using built-in UI):', e); if (ota) ota.resolvedIndex = null; }
}

app.whenReady().then(() => {
  setupIpc();
  setupRelayCors();
  setupOta();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Never navigate the app window away from the local file: UI.
// http(s) links (target=_blank or plain clicks) go to the OS browser; any
// other scheme (javascript:, file: popups, custom protocols…) is dropped.
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file:')) {
      event.preventDefault();
      openExternalSafe(url);
    }
  });
  contents.on('will-redirect', (event, url) => {
    if (!url.startsWith('file:')) {
      event.preventDefault();
    }
  });
  contents.setWindowOpenHandler(({ url }) => {
    openExternalSafe(url);
    return { action: 'deny' };
  });
});
