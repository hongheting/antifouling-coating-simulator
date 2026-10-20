const { data, go } = require('../../utils/ui.js');
Page({
  data: { meta: {}, source: '' },
  onLoad() { this.setData({ meta: data().meta || {}, source: getApp().globalData.dataSource }); },
  toExchange() { go('/pages/exchange/exchange'); },
  callDev() { wx.makePhoneCall({ phoneNumber: '17607144929', fail() {} }); },
  privacy() { if (wx.openPrivacyContract) wx.openPrivacyContract({ fail() { wx.showToast({ title: '暂无法打开', icon: 'none' }); } }); }
});
