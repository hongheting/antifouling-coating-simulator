/**
 * 数据来源：只用小程序包内置数据（data/data.js），不发任何网络请求。
 *
 * ── 预留：微信云开发数据更新（默认关闭）──────────────────────────────
 * 个人主体也可开通「云开发」。以后如需在线更新公开板块（行业动态/文献/商用/学者），可：
 *   1. 在开发者工具开通云开发，建集合 public_feed，只放公开板块；
 *   2. 把 CLOUD_ENABLED 改为 true，填 CLOUD_ENV；
 *   3. 在 load() 里调用 fetchCloud()，并像 App 端 updater.js 一样只合并公开板块，
 *      绝不覆盖实验室表（lab）与短名单（recommendations）。
 * 云开发走微信内部通道，不需要配置 request 合法域名。不要改成请求 GitHub / jsDelivr / workers.dev。
 * ────────────────────────────────────────────────────────────────────
 */
const BUNDLED = require('../data/data.js');
const CLOUD_ENABLED = false;
const CLOUD_ENV = ''; // 例如 'cloud1-xxxx'
const PUBLIC_SECTIONS = ['industry', 'literature_taxonomy', 'catalog', 'commercial_products', 'commercial_taxonomy', 'tech_aux', 'link_stats', 'researchers'];

function load() {
  return { data: BUNDLED, source: '内置 ' + ((BUNDLED.meta && BUNDLED.meta.updated) || '') };
}

// 预留，未调用。
function fetchCloud() {
  if (!CLOUD_ENABLED || !CLOUD_ENV || !wx.cloud) return Promise.resolve(null);
  wx.cloud.init({ env: CLOUD_ENV, traceUser: false });
  return wx.cloud.database().collection('public_feed').orderBy('version', 'desc').limit(1).get()
    .then((r) => {
      const f = r.data && r.data[0];
      if (!f || !f.sections) return null;
      PUBLIC_SECTIONS.forEach((k) => { if (f.sections[k] != null) BUNDLED[k] = f.sections[k]; });
      return f.version;
    }).catch(() => null);
}

module.exports = { load, fetchCloud, CLOUD_ENABLED, PUBLIC_SECTIONS };
