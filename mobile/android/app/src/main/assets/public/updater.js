/**
 * 0.5.0 online update for PUBLIC sections only (industry / literature / commercial / scholars / route geometry).
 * Private bundled sections (lab, recommendations, routes text, meta honesty) are never overwritten.
 * Loaded synchronously right after data-snapshot.js so cached feed is merged before the page renders.
 */
(function () {
  'use strict';
  var REPO = 'hongheting/antifouling-coating-simulator';
  var MIRRORS = [
    'https://cdn.jsdelivr.net/gh/' + REPO + '@main/public-data/',
    'https://fastly.jsdelivr.net/gh/' + REPO + '@main/public-data/',
    'https://raw.githubusercontent.com/' + REPO + '/main/public-data/'
  ];
  var K_FEED = 'afsim.feed.v1', K_CHECK = 'afsim.lastCheck', K_NAG = 'afsim.lastAppNag', K_TOAST = 'afsim.updatedToast';
  var MERGE_REPLACE = ['industry', 'literature_taxonomy', 'catalog', 'commercial_products', 'commercial_taxonomy',
                       'tech_aux', 'link_stats', 'researchers', 'route_geometry'];
  var D = window.SIM_DATA || {};
  var BUNDLED = window.BUNDLED_DATA_VERSION || (D.meta && D.meta.updated) || '0';

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  function validFeed(f) {
    return f && f.schema === 1 && typeof f.version === 'string' && f.sections &&
      typeof f.sections === 'object' && f.sections.industry && Array.isArray(f.sections.industry.weeks) &&
      Array.isArray(f.sections.literature) && Array.isArray(f.sections.researchers);
  }

  function merge(feed) {
    var s = feed.sections;
    MERGE_REPLACE.forEach(function (k) { if (s[k] != null) D[k] = s[k]; });
    // literature: upsert by bound_id, keep bundled rows the public feed omits
    if (Array.isArray(s.literature) && Array.isArray(D.literature)) {
      var idx = {}; D.literature.forEach(function (r, i) { idx[r.bound_id] = i; });
      s.literature.forEach(function (r) {
        if (r.bound_id in idx) D.literature[idx[r.bound_id]] = r; else D.literature.push(r);
      });
    }
    if (D.meta && D.industry && D.industry.weeks) {
      D.meta.industry_weeks = D.industry.weeks.length;
      D.meta.industry_entries = D.industry.weeks.reduce(function (n, w) { return n + ((w.entries || []).length); }, 0);
    }
    if (D.literature_taxonomy && D.literature) D.literature_taxonomy.total = D.literature.length;
  }

  // ---- synchronous: apply cached feed if newer than bundled ----
  var current = BUNDLED, source = '内置';
  try {
    var cached = JSON.parse(lsGet(K_FEED) || 'null');
    if (validFeed(cached) && cached.version > BUNDLED && (cached.min_app || 0) <= 60) {
      merge(cached); current = cached.version; source = '在线缓存';
    }
  } catch (e) { /* corrupted cache → bundled */ }

  // ---- async network ----
  function fetchT(url, ms) {
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, ms);
    return fetch(url, { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { clearTimeout(t); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); },
            function (e) { clearTimeout(t); throw e; });
  }
  function bust(base, name) { return base + name + (base.indexOf('raw.githubusercontent') >= 0 ? '?t=' + Date.now() : ''); }
  function tryMirrors(i) {
    if (i >= MIRRORS.length) return Promise.reject(new Error('all mirrors failed'));
    return fetchT(bust(MIRRORS[i], 'latest.json'), 6000)
      .then(function (j) { if (!j || !j.data_version) throw new Error('bad latest'); return { latest: j, base: MIRRORS[i] }; })
      .catch(function () { return tryMirrors(i + 1); });
  }

  function toast(msg) {
    var el = document.getElementById('cap-toast');
    if (!el) { el = document.createElement('div'); el.id = 'cap-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2600);
  }
  function fmtTime(ts) {
    if (!ts) return '未检查';
    var d = new Date(+ts), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return (d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function renderLabel(status) {
    var el = document.getElementById('upd-label'); if (!el) return;
    el.textContent = '数据版本 ' + current + '（' + source + '）· 上次检查 ' + fmtTime(lsGet(K_CHECK)) + (status ? ' · ' + status : '');
  }

  function appInfo() {
    var A = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    return A && A.getInfo ? A.getInfo().catch(function () { return null; }) : Promise.resolve(null);
  }
  function openUrl(u) {
    var B = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser;
    if (B && B.open) B.open({ url: u }); else window.open(u, '_blank', 'noopener');
  }
  function appModal(app, manual) {
    if (!/^https:\/\//.test(app.apk_url || '')) return;
    var last = +(lsGet(K_NAG) || 0);
    if (!manual && Date.now() - last < 86400000) return;
    lsSet(K_NAG, String(Date.now()));
    var wrap = document.createElement('div'); wrap.id = 'upd-modal'; wrap.className = 'upd-back';
    var box = document.createElement('div'); box.className = 'upd-box'; box.setAttribute('role', 'dialog');
    var h = document.createElement('h3'); h.textContent = '发现新版本 ' + app.versionName + '，是否更新？';
    var p = document.createElement('p'); p.textContent = app.notes || '';
    var row = document.createElement('div'); row.className = 'upd-row';
    var later = document.createElement('button'); later.type = 'button'; later.textContent = '稍后'; later.className = 'upd-later';
    var go = document.createElement('button'); go.type = 'button'; go.textContent = '去下载'; go.className = 'upd-go';
    later.onclick = function () { wrap.remove(); };
    go.onclick = function () { wrap.remove(); openUrl(app.apk_url); };
    row.appendChild(later); row.appendChild(go); box.appendChild(h); box.appendChild(p); box.appendChild(row);
    wrap.appendChild(box); wrap.addEventListener('click', function (e) { if (e.target === wrap) wrap.remove(); });
    document.body.appendChild(wrap);
  }

  var busy = false;
  function check(manual) {
    if (busy) return; busy = true; renderLabel('检查中…');
    tryMirrors(0).then(function (res) {
      lsSet(K_CHECK, String(Date.now()));
      var L = res.latest, work = [];
      if (L.data_version > current) {
        work.push(fetchT(bust(res.base, L.feed || 'feed.json'), 15000).then(function (f) {
          if (!validFeed(f) || (f.min_app || 0) > 60) throw new Error('feed invalid');
          if (!lsSet(K_FEED, JSON.stringify(f))) throw new Error('storage full');
          lsSet(K_TOAST, f.version);
          location.reload();   // re-render all tabs with merged public data
        }));
      } else if (manual) { toast('公开数据已是最新（' + current + '）'); }
      return Promise.all(work).then(function () {
        return appInfo().then(function (info) {
          var installed = info ? parseInt(info.build, 10) : 60;
          if (L.app && L.app.versionCode > installed) appModal(L.app, manual);
          else if (manual && L.data_version <= current) { /* already toasted */ }
        });
      });
    }).catch(function () {
      if (manual) toast('网络不可用，使用' + source + '数据');
    }).then(function () { busy = false; renderLabel(); });
  }

  function init() {
    var footer = document.querySelector('footer');
    if (footer && !document.getElementById('upd-line')) {
      var line = document.createElement('div'); line.id = 'upd-line';
      var lab = document.createElement('span'); lab.id = 'upd-label';
      var btn = document.createElement('button'); btn.type = 'button'; btn.id = 'upd-btn'; btn.textContent = '检查更新';
      btn.onclick = function () { check(true); };
      line.appendChild(lab); line.appendChild(btn); footer.appendChild(line);
    }
    renderLabel();
    var t = lsGet(K_TOAST);
    if (t) { try { localStorage.removeItem(K_TOAST); } catch (e) {} setTimeout(function () { toast('行业动态与文献已更新至 ' + t); }, 400); }
    setTimeout(function () { check(false); }, 1200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.AFSIM_UPDATER = { check: check, version: function () { return current; } };
})();
