/**
 * 0.6.0 OTA web-code updates (self-hosted, @capgo/capacitor-updater in manual mode, no Capgo cloud/stats).
 * manifest.json is Ed25519-signed (tweetnacl, verified here); the zip's sha256 from the signed manifest is
 * handed to the native downloader, which refuses the bundle if the hash differs.
 * New bundle is applied on next launch (or 立即重启). notifyAppReady() on every boot → native rollback if a
 * bundle fails to boot within appReadyTimeout.
 */
(function (root) {
  'use strict';
  var REPO = 'hongheting/antifouling-coating-simulator';
  var MIRRORS = [
    'https://raw.githubusercontent.com/' + REPO + '/main/public-data/web/',
    'https://cdn.jsdelivr.net/gh/' + REPO + '@main/public-data/web/',
    'https://fastly.jsdelivr.net/gh/' + REPO + '@main/public-data/web/'
  ];
  var PUBKEY_B64 = 'hEFQwMHuesmwAYoCMLE0za/fZImUzERjIlBbS5CUNdY=';
  var WEB = root.AFSIM_WEB || { webVersion: '0.6.0+1', webBuild: 1 }; // baked by sync-www / build-ota
  var SIG_PREFIX = 'afsim-ota-v1\n';
  var SIGNED_FIELDS = ['file', 'minNativeCode', 'maxNativeCode', 'notes', 'sha256', 'size', 'webBuild', 'webVersion'];

  function b64(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  function utf8(s) { return new TextEncoder().encode(s); }
  function canonical(m) { var o = {}; SIGNED_FIELDS.forEach(function (k) { if (m[k] !== undefined) o[k] = m[k]; }); return SIG_PREFIX + JSON.stringify(o); }
  function verify(m, nacl, pub) {
    nacl = nacl || root.nacl;
    try {
      if (!m || typeof m.sig !== 'string' || !nacl) return false;
      return nacl.sign.detached.verify(utf8(canonical(m)), b64(m.sig), b64(pub || PUBKEY_B64));
    } catch (e) { return false; }
  }
  // returns null if applicable, else reason string
  function gate(m, nativeCode, currentBuild) {
    if (!m || typeof m.webVersion !== 'string' || !Number.isInteger(m.webBuild)) return 'bad manifest';
    if (!/^[0-9a-f]{64}$/.test(m.sha256 || '')) return 'bad sha256';
    if (!/^bundle-[A-Za-z0-9.+_-]+\.zip$/.test(m.file || '')) return 'bad file';
    if (!(m.size > 0 && m.size < 50e6)) return 'bad size';
    if (m.webBuild <= currentBuild) return 'not newer';
    if ((m.minNativeCode || 0) > nativeCode) return 'needs newer APK';
    if (m.maxNativeCode && m.maxNativeCode < nativeCode) return 'native too new';
    return null;
  }
  root.AFSIM_OTA_TEST = { canonical: canonical, verify: verify, gate: gate };

  var P = (root.Capacitor && root.Capacitor.Plugins) || {};
  var U = P.CapacitorUpdater;
  if (typeof document === 'undefined') return;
  if (U && U.notifyAppReady) U.notifyAppReady().catch(function () {});

  function toast(msg) {
    var el = document.getElementById('cap-toast');
    if (!el) { el = document.createElement('div'); el.id = 'cap-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2600);
  }
  function fetchJson(url) {
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, t = setTimeout(function () { ctl && ctl.abort(); }, 8000);
    return fetch(url + (url.indexOf('raw.githubusercontent') >= 0 ? '?t=' + Date.now() : ''), { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { clearTimeout(t); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }, function (e) { clearTimeout(t); throw e; });
  }
  function nativeCode() {
    var A = P.App; if (!A || !A.getInfo) return Promise.resolve(0);
    return A.getInfo().then(function (i) { return parseInt(i.build, 10) || 0; }, function () { return 0; });
  }
  function label() {
    var l = document.getElementById('upd-label'), w = document.getElementById('ota-label');
    if (!l || w) return;
    w = document.createElement('span'); w.id = 'ota-label'; w.textContent = ' · 界面 ' + WEB.webVersion;
    l.parentNode.insertBefore(w, l.nextSibling);
  }
  function restartPrompt(id, m) {
    if (document.getElementById('ota-modal')) return;
    var wrap = document.createElement('div'); wrap.id = 'ota-modal'; wrap.className = 'upd-back';
    wrap.innerHTML = '<div class="upd-box" role="dialog"><h3>界面已更新，重启生效</h3><p></p><div class="upd-row">' +
      '<button type="button" class="upd-later">下次启动</button><button type="button" class="upd-go">立即重启</button></div></div>';
    wrap.querySelector('p').textContent = (m.webVersion ? '新版本 ' + m.webVersion + '。' : '') + (m.notes || '');
    wrap.querySelector('.upd-later').onclick = function () { wrap.remove(); };
    wrap.querySelector('.upd-go').onclick = function () { wrap.remove(); U.set({ id: id }).catch(function (e) { toast('重启失败：' + (e && e.message)); }); };
    document.body.appendChild(wrap);
  }

  var busy = false;
  function check(manual) {
    if (!U || busy) { if (manual && !U) toast('当前环境不支持界面在线更新'); return Promise.resolve(); }
    busy = true;
    var i = 0, base;
    function nextMirror() {
      if (i >= MIRRORS.length) return Promise.reject(new Error('offline'));
      base = MIRRORS[i++];
      return fetchJson(base + 'manifest.json').catch(nextMirror);
    }
    return Promise.all([nextMirror(), nativeCode()]).then(function (r) {
      var m = r[0], code = r[1];
      if (!verify(m)) throw new Error('签名校验失败');
      var why = gate(m, code, WEB.webBuild);
      if (why) { if (manual) toast(why === 'needs newer APK' ? '有新界面但需要先更新 APK' : '界面已是最新（' + WEB.webVersion + '）'); return; }
      return U.list().then(function (l) {
        var have = (l.bundles || []).filter(function (b) { return b.version === m.webVersion && b.checksum === m.sha256 && b.status !== 'error'; })[0];
        if (have) return have;
        if (manual) toast('正在下载界面更新 ' + m.webVersion + '…');
        var urls = MIRRORS.slice(MIRRORS.indexOf(base)).concat(MIRRORS.slice(0, MIRRORS.indexOf(base))), j = 0;
        var dl = function () {
          if (j >= urls.length) throw new Error('下载失败');
          return U.download({ url: urls[j++] + m.file, version: m.webVersion, checksum: m.sha256 }).catch(dl);
        };
        return dl();
      }).then(function (b) { return U.next({ id: b.id }).then(function () { restartPrompt(b.id, m); }); });
    }).catch(function (e) { if (manual) toast('界面更新检查失败：' + e.message); })
      .then(function () { busy = false; });
  }
  root.AFSIM_OTA = { check: check, web: WEB };

  function init() {
    label();
    var btn = document.getElementById('upd-btn');
    if (btn) btn.addEventListener('click', function () { check(true); });
    setTimeout(function () { check(false); }, 4000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(typeof window !== 'undefined' ? window : globalThis);
