const { data, go, core } = require('../../utils/ui.js');
const NAV = [
  { t: '轨 A · 实验室表', d: '配方槽位与拉拔/EIS/释放/微宇宙（带标签）', url: '/pages/lab/lab', icon: 'A' },
  { t: '轨 B · 航线剖面', d: '示意航迹 · 气候带与相对污损压力', url: '/pages/routes/routes', icon: 'B' },
  { t: '轨 C · 短名单', d: '按航线对公开品类定性拟合', url: '/pages/rec/rec', icon: 'C' },
  { t: '商用 · 技术', d: '目录候选 / 产品线 / UV-C·超声摘录', url: '/pages/tech/tech', icon: 'T' },
  { t: '行业动态', d: '公开资料整理（按周）', url: '/pages/industry/industry', icon: 'I' },
  { t: '防污学者排行', d: 'OpenAlex 领域 h 指数（公开）', url: '/pages/scholars/scholars', icon: 'S' },
  { t: '技术交流说明', d: '本工具版不含发帖；可复制公开讨论区链接', url: '/pages/exchange/exchange', icon: 'E' }
];
Page({
  data: { stats: [], nav: NAV, meta: {}, source: '' },
  onLoad() {
    const D = data();
    this.setData({
      stats: core.overview(D),
      meta: D.meta || {},
      source: getApp().globalData.dataSource
    });
  },
  open(e) { go(e.currentTarget.dataset.url); }
});
