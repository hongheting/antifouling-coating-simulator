const core = require('./core.js');
function data() { return getApp().globalData.data; }
function copy(text, okMsg) {
  if (!text) return;
  wx.setClipboardData({
    data: String(text),
    success() { wx.showToast({ title: okMsg || '已复制', icon: 'none' }); },
    fail() {
      // 用户拒绝隐私授权或接口不可用时：展示文本，可长按手动复制
      wx.showModal({ title: '请手动复制', content: String(text), showCancel: false, confirmText: '知道了' });
    }
  });
}
function links(arr) { return (arr || []).filter((l) => core.safeHttpUrl(l.url)).map((l) => ({ label: l.label || l.url, url: l.url })); }
const TAB_PAGES = ['/pages/index/index', '/pages/routes/routes', '/pages/lit/lit', '/pages/about/about'];
function go(url) {
  const base = url.split('?')[0];
  if (TAB_PAGES.indexOf(base) >= 0) wx.switchTab({ url: base }); else wx.navigateTo({ url });
}
module.exports = { data, copy, links, go, core };
