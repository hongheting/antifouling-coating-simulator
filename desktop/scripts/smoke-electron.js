// Manual smoke: xvfb-run node_modules/.bin/electron --no-sandbox scripts/smoke-electron.js
const { app } = require('electron');
require('../main.js');
app.on('browser-window-created', (_e, win) => {
  win.webContents.on('did-finish-load', () => setTimeout(async () => {
    const r = await win.webContents.executeJavaScript(`(async()=>({
      title: document.title, cap: !!window.Capacitor, info: await Capacitor.Plugins.App.getInfo(),
      exchange: !!document.querySelector('[id*="ex-"],[class*="ex-"]'), relay: typeof fetch,
      ota: window.AFSIM_OTA && AFSIM_OTA.web, banner: /模拟/.test(document.body.innerText),
      ready: await Capacitor.Plugins.CapacitorUpdater.notifyAppReady(),
      list: await Capacitor.Plugins.CapacitorUpdater.list(),
      httpDenied: await Capacitor.Plugins.CapacitorHttp.request({url:'https://example.com',method:'POST'}).then(()=>'ALLOWED?!',e=>'denied'),
      relayCors: await fetch('https://afsim-guest-relay.hongheting.workers.dev/health').then(r=>'status '+r.status,e=>'err '+e.message),
      latest: await fetch('https://raw.githubusercontent.com/hongheting/antifouling-coating-simulator/main/public-data/latest.json').then(r=>r.status,e=>'err')
    }))()`);
    console.log('SMOKE', JSON.stringify(r)); app.exit(0);
  }, 3000));
});
