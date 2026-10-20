'use strict';

/**
 * Electron V1 shell for the antifouling coating simulator panel.
 * Security: nodeIntegration off, contextIsolation on, sandbox on;
 * loadFile local UI only; no remote content; no auto-updater.
 * Honesty: do not strip the "simulation ≠ measurement" banner in ui/.
 * External links (行业动态 sources): only http/https, opened in the OS
 * browser via shell.openExternal; never navigated inside the app window.
 */

const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

/** Return a normalized http(s) URL string, or null for anything else. */
function safeExternalUrl(url) {
  try {
    const u = new URL(String(url || ''));
    return (u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'tel:') ? u.href : null;
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

const WINDOW_TITLE = '防污涂料配方模拟器 · V0/V1（模拟≠实测）';

function resolveUiIndexHtml() {
  if (app.isPackaged) {
    // Packaged: ui/ copied via electron-builder extraResources → resources/ui
    return path.join(process.resourcesPath, 'ui', 'index.html');
  }
  // Dev: load sibling ../ui from coating-simulator/desktop/
  return path.join(__dirname, '..', 'ui', 'index.html');
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

app.whenReady().then(() => {
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
