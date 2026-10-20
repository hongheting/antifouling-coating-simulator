const core = require('../../utils/core.js');
Component({
  options: { addGlobalClass: true },
  properties: { text: { type: String, value: '' } },
  data: { list: [] },
  observers: { text(t) { this.setData({ list: core.splitTags(t) }); } }
});
