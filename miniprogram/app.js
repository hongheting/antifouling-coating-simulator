const ds = require('./utils/datasource.js');
App({
  globalData: { data: null, dataSource: '内置' },
  onLaunch() {
    const r = ds.load();
    this.globalData.data = r.data;
    this.globalData.dataSource = r.source;
  }
});
