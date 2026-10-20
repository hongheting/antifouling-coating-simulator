const { copy } = require('../../utils/ui.js');
const LINKS = {
  discussions: 'https://github.com/hongheting/antifouling-coating-simulator/discussions'
};
Page({
  data: { links: LINKS },
  copyD() { copy(LINKS.discussions, '讨论区链接已复制'); }
});
