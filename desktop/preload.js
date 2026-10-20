'use strict';
/**
 * 0.6.0 preload: exposes a minimal Capacitor-compatible plugin surface so the shared mobile web UI
 * (技术交流 / 在线数据更新 / 新版本提醒 / 界面热更新) works unchanged on desktop.
 * Only fixed IPC channels; no Node, no generic ipc, no arbitrary network (main allowlists URLs).
 */
const { contextBridge, ipcRenderer } = require('electron');
const call = (ch, arg) => ipcRenderer.invoke('afsim:' + ch, arg === undefined ? null : arg);
const noopListener = () => Promise.resolve({ remove: () => Promise.resolve() });

contextBridge.exposeInMainWorld('Capacitor', {
  platform: 'electron',
  isNativePlatform: () => false,
  getPlatform: () => 'electron',
  Plugins: {
    App: { getInfo: () => call('appInfo'), addListener: noopListener, exitApp: () => call('quit') },
    Browser: { open: (o) => call('openExternal', o && o.url) },
    CapacitorHttp: { request: (o) => call('http', o) },
    CapacitorUpdater: {
      notifyAppReady: () => call('ota', { op: 'notifyAppReady' }),
      list: () => call('ota', { op: 'list' }),
      download: (o) => call('ota', { op: 'download', opts: o }),
      next: (o) => call('ota', { op: 'next', opts: o }),
      set: (o) => call('ota', { op: 'set', opts: o }),
    },
  },
});
