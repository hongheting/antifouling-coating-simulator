/**
 * Capacitor bridge: open http(s) links in the system browser (not WebView).
 * Mirrors desktop Electron shell.openExternal policy.
 */
(function () {
  'use strict';

  function isHttpUrl(href) {
    try {
      var u = new URL(href, window.location.href);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  function openExternal(url) {
    try {
      var Cap = window.Capacitor;
      if (Cap && Cap.Plugins && Cap.Plugins.Browser && typeof Cap.Plugins.Browser.open === 'function') {
        Cap.Plugins.Browser.open({ url: url });
        return;
      }
    } catch (e) { /* fall through */ }
    // Fallback: new window / system handler
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  document.addEventListener(
    'click',
    function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0) return;
      if (!isHttpUrl(href)) return;
      // Only intercept absolute http(s) — keep in-app hash/tab navigation alone
      e.preventDefault();
      e.stopPropagation();
      openExternal(href);
    },
    true
  );

  // Edge-to-edge status bar (Capacitor Style.Dark = light icons for dark header)
  function setupStatusBar() {
    try {
      var SB = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar;
      if (!SB) return;
      SB.setOverlaysWebView({ overlay: true }).catch(function () {});
      SB.setStyle({ style: 'DARK' }).catch(function () {});
      SB.setBackgroundColor({ color: '#00000000' }).catch(function () {});
    } catch (e) { /* ignore */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupStatusBar);
  else setupStatusBar();
  document.documentElement.classList.add('cap-mobile');

  // 0.3.3: Android back — close open popup first, else double-back to exit
  var lastBack = 0, toastTimer = null;
  function showToast(msg) {
    var el = document.getElementById('cap-toast');
    if (!el) { el = document.createElement('div'); el.id = 'cap-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2000);
  }
  function closeOpenPopup() {
    var open = Array.prototype.filter.call(document.querySelectorAll('[id$="modal"]'), function (m) {
      return !m.hidden && getComputedStyle(m).display !== 'none';
    });
    open.forEach(function (m) { m.hidden = true; });
    return open.length > 0;
  }
  function setupBack() {
    var AppP = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (!AppP) return;
    AppP.addListener('backButton', function () {
      if (closeOpenPopup()) { lastBack = 0; return; }
      var now = Date.now();
      if (now - lastBack < 2000) { AppP.exitApp(); return; }
      lastBack = now;
      showToast('再滑一次退出应用');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupBack);
  else setupBack();
})();
