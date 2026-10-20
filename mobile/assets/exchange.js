/**
 * 0.6.0 技术交流板块 — backend: GitHub Discussions on hongheting/antifouling-coating-simulator.
 * Anonymous read: public-data/discussions.json (Actions snapshot, ~30 min). Logged-in: live GraphQL.
 * Login: OAuth Device Flow, client_id only (NO client secret). Scope: public_repo (needed to write discussions).
 * All posts are author self-reports — shown with 「作者自述，未经验证」.
 */
(function () {
  'use strict';
  var OWNER = 'hongheting', NAME = 'antifouling-coating-simulator', REPO = OWNER + '/' + NAME;
  var CLIENT_ID = 'Ov23lijC8lYn6WonSrE6', SCOPE = 'public_repo';
  var GQL = 'https://api.github.com/graphql';
  var CATS = [
    { slug: '新技术-new-technology', name: '新技术 New Technology' },
    { slug: '新配方-new-formulation', name: '新配方 New Formulation' },
    { slug: '新工艺-new-process', name: '新工艺 New Process' }
  ];
  var SNAP_MIRRORS = [
    'https://raw.githubusercontent.com/' + REPO + '/main/public-data/discussions.json',
    'https://cdn.jsdelivr.net/gh/' + REPO + '@main/public-data/discussions.json',
    'https://fastly.jsdelivr.net/gh/' + REPO + '@main/public-data/discussions.json'
  ];
  // 游客投稿 relay (Cloudflare Worker, see relay/). Empty → guest mode hidden.
  var RELAY_URL = '';
  var K_TOKEN = 'afsim.gh.token', K_USER = 'afsim.gh.user', K_SNAP = 'afsim.discussions.v1';
  var DATA_KINDS = ['实测', '文献', '厂家标称', '模型估计'];

  var Q = {};
  Q.list = 'query($o:String!,$n:String!,$c:ID,$after:String){repository(owner:$o,name:$n){discussions(first:30,after:$after,categoryId:$c,orderBy:{field:CREATED_AT,direction:DESC}){pageInfo{hasNextPage endCursor} nodes{id number title url createdAt bodyText author{login avatarUrl} category{slug name} comments{totalCount}}}}}';
  Q.detail = 'query($o:String!,$n:String!,$num:Int!){repository(owner:$o,name:$n){discussion(number:$num){id number title url createdAt bodyHTML author{login avatarUrl} category{slug name} comments(first:100){totalCount nodes{id createdAt bodyHTML url author{login avatarUrl}}}}}}';
  Q.meta = 'query($o:String!,$n:String!){repository(owner:$o,name:$n){id discussionCategories(first:25){nodes{id slug name}}}}';
  Q.viewer = 'query{viewer{login avatarUrl}}';
  Q.create = 'mutation($r:ID!,$c:ID!,$t:String!,$b:String!){createDiscussion(input:{repositoryId:$r,categoryId:$c,title:$t,body:$b}){discussion{number url}}}';
  Q.comment = 'mutation($d:ID!,$b:String!){addDiscussionComment(input:{discussionId:$d,body:$b}){comment{id url}}}';
  window.EXCHANGE_QUERIES = Q; // for tests

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtDate(iso) { var d = new Date(iso); if (isNaN(d)) return ''; var p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
  function $(id) { return document.getElementById(id); }
  function toast(m) { var el = $('cap-toast'); if (!el) { el = document.createElement('div'); el.id = 'cap-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); } el.textContent = m; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); setTimeout(function () { el.classList.remove('show'); }, 2600); }
  function plugins() { return (window.Capacitor && window.Capacitor.Plugins) || {}; }
  function openUrl(u) { var B = plugins().Browser; if (B && B.open) B.open({ url: u }).catch(function () { window.open(u, '_blank'); }); else window.open(u, '_blank', 'noopener'); }

  // GitHub already sanitizes bodyHTML; strip anything active anyway.
  function safeHtml(html) {
    var doc = new DOMParser().parseFromString('<div>' + (html || '') + '</div>', 'text/html');
    doc.querySelectorAll('script,style,iframe,object,embed,form,input,button,link,meta').forEach(function (n) { n.remove(); });
    doc.querySelectorAll('*').forEach(function (n) {
      Array.prototype.slice.call(n.attributes).forEach(function (a) {
        var nm = a.name.toLowerCase();
        if (nm.indexOf('on') === 0 || ((nm === 'href' || nm === 'src') && !/^(https?:|#|mailto:)/i.test(a.value.trim()))) n.removeAttribute(a.name);
      });
      if (n.tagName === 'A') { n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener noreferrer'); }
    });
    return doc.body.firstChild.innerHTML;
  }
  // minimal md → html for snapshot fallback when bodyHTML missing
  function mdLite(md) { return esc(md || '').replace(/^### (.*)$/gm, '<h4>$1</h4>').replace(/^## (.*)$/gm, '<h3>$1</h3>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); }

  // ---- auth ----
  function token() { return ls(K_TOKEN); }
  var GUEST_RE = /游客投稿 · 昵称：(.+?) · 作者自述，未经验证/;
  function guestNick(x) { var m = GUEST_RE.exec((x && (x.bodyText || x.body || x.bodyHTML)) || ''); return m ? m[1].replace(/<[^>]*>/g, '') : null; }
  function authorHtml(x) { var g = guestNick(x); return g ? '<span class="tag ex-guest">游客</span><span>' + esc(g) + '</span>' : '<span>@' + esc(x.author ? x.author.login : 'ghost') + '</span>'; }
  function relay(path, payload) {
    return fetch(RELAY_URL.replace(/\/$/, '') + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'HTTP ' + r.status }; }); })
      .then(function (j) { if (!j.ok) throw new Error(j.error || '提交失败'); return j; });
  }
  function guestFields(prefix) {
    return '<label>昵称 *（公开显示）<input id="' + prefix + '-nick" maxlength="40"></label>' +
      '<label>联系方式 / 邮箱（可选）<input id="' + prefix + '-contact" maxlength="120"></label>' +
      '<label class="ex-chk"><input type="checkbox" id="' + prefix + '-pub"> 公开联系方式（不勾选则只有维护者可见）</label>' +
      '<input id="' + prefix + '-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="ex-hp">';
  }
  function guestVals(prefix) { return { nickname: $(prefix + '-nick').value.trim(), contact: $(prefix + '-contact').value.trim(), publish_contact: $(prefix + '-pub').checked, website: $(prefix + '-hp').value }; }
  function nativePost(url, body) {
    var H = plugins().CapacitorHttp;
    var headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
    if (H && H.request) return H.request({ url: url, method: 'POST', headers: headers, data: body }).then(function (r) { return typeof r.data === 'string' ? JSON.parse(r.data) : r.data; });
    return fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body) }).then(function (r) { return r.json(); }); // desktop: will fail on CORS
  }
  var polling = null;
  function startLogin() {
    if (!plugins().CapacitorHttp) { toast('登录需在手机 App 内进行'); return; }
    nativePost('https://github.com/login/device/code', { client_id: CLIENT_ID, scope: SCOPE }).then(function (d) {
      if (!d || !d.device_code) throw new Error((d && (d.error_description || d.error)) || '无法获取验证码');
      showModal('<h3>用 GitHub 登录</h3><p>1. 复制下面的验证码</p><div class="ex-code" id="ex-code">' + esc(d.user_code) + '</div>' +
        '<p>2. 打开 GitHub 授权页面并粘贴验证码，授权后回到本 App 即可。</p>' +
        '<div class="ex-row"><button type="button" class="ex-btn" id="ex-copy">复制验证码</button><button type="button" class="ex-btn ex-pri" id="ex-open">打开 github.com/login/device</button></div>' +
        '<p class="ex-muted" id="ex-poll">等待授权中…（权限：public_repo，仅用于在本仓库发帖/评论）</p>');
      $('ex-copy').onclick = function () { (navigator.clipboard ? navigator.clipboard.writeText(d.user_code) : Promise.reject()).then(function () { toast('已复制'); }, function () { toast('请长按验证码复制'); }); };
      $('ex-open').onclick = function () { openUrl(d.verification_uri || 'https://github.com/login/device'); };
      var interval = (d.interval || 5) * 1000, deadline = Date.now() + (d.expires_in || 900) * 1000;
      var tick = function () {
        if (Date.now() > deadline) { $('ex-poll') && ($('ex-poll').textContent = '验证码已过期，请重新登录'); return; }
        nativePost('https://github.com/login/oauth/access_token', { client_id: CLIENT_ID, device_code: d.device_code, grant_type: 'urn:ietf:params:oauth:grant-type:device_code' }).then(function (r) {
          if (r.access_token) { ls(K_TOKEN, r.access_token); polling = null; afterLogin(); return; }
          if (r.error === 'slow_down') interval = ((r.interval || 0) * 1000) || interval + 5000;
          else if (r.error !== 'authorization_pending') { $('ex-poll') && ($('ex-poll').textContent = '登录失败：' + (r.error_description || r.error)); polling = null; return; }
          polling = setTimeout(tick, interval);
        }, function () { polling = setTimeout(tick, interval); });
      };
      polling = setTimeout(tick, interval);
    }).catch(function (e) { toast('登录失败：' + e.message); });
  }
  function afterLogin() {
    gql(Q.viewer, {}).then(function (d) { ls(K_USER, d.viewer.login); hideModal(); toast('已登录：' + d.viewer.login); renderBar(); loadList(); })
      .catch(function (e) { toast('登录校验失败：' + e.message); });
  }
  function logout() { ls(K_TOKEN, null); ls(K_USER, null); toast('已退出登录'); renderBar(); loadList(); }

  function gql(query, vars) {
    var t = token(); if (!t) return Promise.reject(new Error('未登录'));
    return fetch(GQL, { method: 'POST', headers: { Authorization: 'bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: query, variables: vars }) })
      .then(function (r) { if (r.status === 401) { ls(K_TOKEN, null); ls(K_USER, null); renderBar(); throw new Error('登录已失效，请重新登录'); } return r.json(); })
      .then(function (j) { if (j.errors && j.errors.length) throw new Error(j.errors[0].message); return j.data; });
  }
  var metaP = null;
  function meta() {
    if (!metaP) metaP = gql(Q.meta, { o: OWNER, n: NAME }).then(function (d) {
      var m = { repoId: d.repository.id, cats: {} };
      d.repository.discussionCategories.nodes.forEach(function (c) { m.cats[c.slug] = c.id; });
      return m;
    }).catch(function (e) { metaP = null; throw e; });
    return metaP;
  }

  // ---- data ----
  var state = { cat: 'all', items: [], source: '', snap: null };
  function fetchSnap() {
    var i = 0;
    var next = function () {
      if (i >= SNAP_MIRRORS.length) return Promise.reject(new Error('all mirrors failed'));
      var u = SNAP_MIRRORS[i++]; if (u.indexOf('raw.githubusercontent') >= 0) u += '?t=' + Date.now();
      var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, to = setTimeout(function () { ctl && ctl.abort(); }, 6000);
      return fetch(u, { cache: 'no-store', signal: ctl ? ctl.signal : undefined }).then(function (r) { clearTimeout(to); if (!r.ok) throw 0; return r.json(); })
        .then(function (j) { if (!j || !Array.isArray(j.discussions)) throw 0; ls(K_SNAP, JSON.stringify(j)); return j; })
        .catch(function () { clearTimeout(to); return next(); });
    };
    return next().catch(function () { var c = null; try { c = JSON.parse(ls(K_SNAP) || 'null'); } catch (e) {} if (c) { c._cached = true; return c; } throw new Error('无法获取交流帖子（离线？）'); });
  }
  function withTimeout(p, ms, msg) {
    return new Promise(function (res, rej) { var t = setTimeout(function () { rej(new Error(msg || '超时')); }, ms); p.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); }); });
  }
  function relayGet(path) {
    if (!RELAY_URL) return Promise.reject(new Error('no relay'));
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    return withTimeout(fetch(RELAY_URL.replace(/\/$/, '') + path, { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json(); }).then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || '读取失败'); return j; }), 8000, '连接超时')
      .catch(function (e) { if (ctl) ctl.abort(); throw e; });
  }
  function hhmm(iso) { var d = new Date(iso); return isNaN(d) ? '' : fmtDate(iso) + ' ' + d.toTimeString().slice(0, 5); }
  var K_LIST = 'afsim.exlist.v1';
  function anonList() {
    var cat = state.cat;
    return relayGet('/list?category=' + encodeURIComponent(cat)).then(function (j) {
      ls(K_LIST + ':' + cat, JSON.stringify({ at: new Date().toISOString(), discussions: j.discussions }));
      return { items: j.discussions, source: '游客实时 · 登录可发帖评论' };
    }).catch(function () {
      return withTimeout(fetchSnap(), 8000, '连接超时').then(function (s) {
        state.snap = s;
        var items = s.discussions.filter(function (x) { return cat === 'all' || (x.category && x.category.slug === cat); });
        return { items: items, source: (s._cached ? '缓存（快照 ' : '快照 ') + hhmm(s.generated_at) + (s._cached ? '）' : '') };
      });
    }).catch(function () {
      var c = null; try { c = JSON.parse(ls(K_LIST + ':' + cat) || 'null'); } catch (e) {}
      if (c && Array.isArray(c.discussions)) return { items: c.discussions, source: '缓存 ' + hhmm(c.at) + '（离线）' };
      throw new Error('网络不可用，暂时无法加载');
    });
  }
  var seq = 0;
  function loadList() {
    var box = $('ex-list'); if (!box) return;
    var my = ++seq;
    box.innerHTML = '<p class="ex-muted">加载中…</p>';
    if ($('ex-src')) $('ex-src').textContent = '';
    var p;
    if (token()) {
      p = withTimeout((state.cat === 'all' ? Promise.resolve(null) : meta().then(function (m) { return m.cats[state.cat] || null; }))
        .then(function (cid) { return gql(Q.list, { o: OWNER, n: NAME, c: cid }); }), 15000, '连接超时')
        .then(function (d) {
          return { source: '实时（GitHub 已登录）', items: d.repository.discussions.nodes.filter(function (x) { return x.category && CATS.some(function (c) { return c.slug === x.category.slug; }); }) };
        });
    } else p = anonList();
    p.then(function (r) { if (my !== seq) return; state.items = r.items; state.source = r.source; renderList(); },
      function (e) {
        if (my !== seq) return;
        box.innerHTML = '<div class="ex-err"><p>加载失败：' + esc(e.message) + '</p><button type="button" class="ex-btn ex-pri" id="ex-retry">重试</button></div>';
        $('ex-retry').onclick = loadList;
      });
  }
  function renderList() {
    var box = $('ex-list'); $('ex-src').textContent = state.source;
    if (!state.items.length) { box.innerHTML = '<p class="ex-muted">这个类别还没有帖子，欢迎第一个分享。</p>'; return; }
    box.innerHTML = state.items.map(function (x) {
      var snip = (x.bodyText || x.body || '').replace(/\s+/g, ' ').slice(0, 110);
      return '<article class="ex-card" data-num="' + x.number + '"><div class="ex-cat">' + esc(x.category ? x.category.name : '') + '</div>' +
        '<h3>' + esc(x.title) + '</h3><p class="ex-snip">' + esc(snip) + '</p>' +
        '<div class="ex-meta">' + authorHtml(x) + '<span>' + fmtDate(x.createdAt) + '</span><span>💬 ' + ((x.comments && x.comments.totalCount) || 0) + '</span><span class="tag tag-default ex-unv">作者自述，未经验证</span></div></article>';
    }).join('');
    box.querySelectorAll('.ex-card').forEach(function (c) { c.onclick = function () { openDetail(+c.dataset.num); }; });
  }

  // ---- detail ----
  function openDetail(num) {
    showModal('<p class="ex-muted">加载中…</p>');
    var p = token() ? withTimeout(gql(Q.detail, { o: OWNER, n: NAME, num: num }), 15000, '连接超时').then(function (d) { return d.repository.discussion; })
      : relayGet('/discussion?number=' + num).then(function (j) { return j.discussion; }).catch(function () {
          var all = (state.snap && state.snap.discussions || []).concat(state.items || []);
          var hit = all.filter(function (x) { return x.number === num; })[0];
          if (!hit) throw new Error('网络不可用'); return hit;
        });
    p.then(function (x) {
      if (!x) throw new Error('未找到帖子');
      var cs = (x.comments && x.comments.nodes) || [];
      var body = x.bodyHTML ? safeHtml(x.bodyHTML) : mdLite(x.body);
      showModal('<div class="ex-cat">' + esc(x.category ? x.category.name : '') + '</div><h3>' + esc(x.title) + '</h3>' +
        '<div class="ex-meta">' + authorHtml(x) + '<span>' + fmtDate(x.createdAt) + '</span><span class="tag tag-default ex-unv">作者自述，未经验证</span></div>' +
        '<div class="ex-warn">本帖内容由作者自述，平台未做任何验证；模拟≠实测，引用前请自行核实。</div>' +
        '<div class="ex-body md">' + body + '</div>' +
        '<div class="ex-row"><button type="button" class="ex-btn" id="ex-gh">在 GitHub 打开</button><button type="button" class="ex-btn" id="ex-report">⚑ 举报</button></div>' +
        '<h4>评论（' + ((x.comments && x.comments.totalCount) || cs.length) + '）</h4>' +
        (cs.map(function (c) { return '<div class="ex-cmt"><div class="ex-meta">' + authorHtml(c) + '<span>' + fmtDate(c.createdAt) + '</span></div><div class="md">' + (c.bodyHTML ? safeHtml(c.bodyHTML) : mdLite(c.body)) + '</div></div>'; }).join('') || '<p class="ex-muted">暂无评论</p>') +
        (token() ? '<textarea id="ex-cbox" rows="4" placeholder="写下你的评论（支持 Markdown）"></textarea><button type="button" class="ex-btn ex-pri" id="ex-csend">发表评论</button>'
          : RELAY_URL && x.id ? '<h4>游客评论</h4>' + guestFields('eg') + '<textarea id="ex-cbox" rows="4" placeholder="写下你的评论（支持 Markdown）"></textarea><div class="ex-row"><button type="button" class="ex-btn" id="ex-clogin">用 GitHub 登录</button><button type="button" class="ex-btn ex-pri" id="ex-gsend">游客发表评论</button></div>'
          : '<p class="ex-muted">登录 GitHub 后可评论。</p><button type="button" class="ex-btn" id="ex-clogin">用 GitHub 登录</button>'));
      var t0c = Date.now();
      if ($('ex-gsend')) $('ex-gsend').onclick = function () {
        var g = guestVals('eg'), b = $('ex-cbox').value.trim(), btn = this;
        if (!g.nickname) return toast('请填写昵称'); if (!b) return toast('评论不能为空');
        btn.disabled = true;
        relay('/comment', Object.assign(g, { discussionId: x.id, body: b, t0: t0c })).then(function () {
          toast('评论已发布，约 30 分钟内显示在 App（GitHub 上立即可见）'); $('ex-cbox').value = ''; btn.disabled = false;
        }, function (e) { toast('评论失败：' + e.message); btn.disabled = false; });
      };
      $('ex-report').onclick = function () { toast('请在 GitHub 页面帖子右上角 “…” → Report content 举报'); openUrl(x.url); };
      $('ex-gh').onclick = function () { openUrl(x.url); };
      if ($('ex-clogin')) $('ex-clogin').onclick = startLogin;
      if ($('ex-csend')) $('ex-csend').onclick = function () {
        var b = $('ex-cbox').value.trim(); if (!b) return toast('评论不能为空');
        this.disabled = true;
        var did = x.id ? Promise.resolve(x.id) : gql(Q.detail, { o: OWNER, n: NAME, num: num }).then(function (d) { return d.repository.discussion.id; });
        did.then(function (id) { return gql(Q.comment, { d: id, b: b }); }).then(function () { toast('评论已发布'); openDetail(num); loadList(); }, function (e) { toast('评论失败：' + e.message); $('ex-csend').disabled = false; });
      };
    }).catch(function (e) { showModal('<p>加载失败：' + esc(e.message) + '</p>'); });
  }

  // ---- post form ----
  function buildBody(f, guest) {
    var L = guest ? [] : ['> ⚠️ **作者自述，未经验证** — 本帖由作者通过「防污涂料配方模拟器」App 发布，内容未经平台验证。', ''];
    L.push('## 简介', f.summary, '', '## 配方 / 工艺要点', f.points, '');
    L.push('## 关键数据', '数据性质：**' + (f.kinds.length ? f.kinds.join('、') : '未注明') + '**', '', f.data || '（未填写）', '');
    if (f.source) L.push('## 单位 / 来源 / DOI', f.source, '');
    if (f.contact) L.push('## 联系方式', f.contact, '');
    L.push('## 安全提示', f.safety || '（作者未填写；请注意杀生物剂、溶剂等的安全与法规要求）', '', '---', '<sub>发布自 防污涂料配方模拟器 App · 模拟 ≠ 实测</sub>');
    return L.join('\n');
  }
  window.EXCHANGE_BUILD_BODY = buildBody;
  window.EXCHANGE_GUEST_NICK = guestNick;
  function openForm() {
    var guest = !token();
    if (guest && !RELAY_URL) { startLogin(); return; }
    var t0 = Date.now();
    showModal('<h3>' + (guest ? '游客投稿' : '发布技术帖') + '</h3><p class="ex-muted">发布后立即公开在 GitHub 讨论区，并标注「作者自述，未经验证」。请勿发布未公开的保密数据。</p>' +
      (guest ? '<div class="ex-row"><span class="ex-muted">有 GitHub 账号？</span><button type="button" class="ex-btn" id="ef-login">用 GitHub 登录发帖</button></div>' + guestFields('gp') : '') +
      '<label>类别<select id="ef-cat">' + CATS.map(function (c) { return '<option value="' + esc(c.slug) + '"' + (state.cat === c.slug ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></label>' +
      '<label>标题 *<input id="ef-title" maxlength="120"></label>' +
      '<label>简介 *<textarea id="ef-summary" rows="3"></textarea></label>' +
      '<label>配方 / 工艺要点 *<textarea id="ef-points" rows="5" placeholder="组分与比例、工艺步骤、条件…"></textarea></label>' +
      '<fieldset><legend>关键数据的性质（可多选）</legend>' + DATA_KINDS.map(function (k) { return '<label class="ex-chk"><input type="checkbox" value="' + k + '"> ' + k + '</label>'; }).join('') + '</fieldset>' +
      '<label>关键数据<textarea id="ef-data" rows="4" placeholder="例：静态挂板 3 个月附着面积 &lt;5%（实测，青岛）"></textarea></label>' +
      '<label>单位 / 来源 / DOI<input id="ef-source"></label>' +
      (guest ? '' : '<label>联系方式（可选，会公开）<input id="ef-contact"></label>') +
      '<label>安全提示<textarea id="ef-safety" rows="2" placeholder="毒性、易燃、法规限制等"></textarea></label>' +
      '<button type="button" class="ex-btn ex-pri" id="ef-send">发布</button>');
    if ($('ef-login')) $('ef-login').onclick = startLogin;
    $('ef-send').onclick = function () {
      var g = function (id) { return $(id).value.trim(); };
      var f = { title: g('ef-title'), summary: g('ef-summary'), points: g('ef-points'), data: g('ef-data'), source: g('ef-source'), contact: guest ? '' : g('ef-contact'), safety: g('ef-safety'),
        kinds: Array.prototype.map.call(document.querySelectorAll('fieldset .ex-chk input:checked'), function (i) { return i.value; }) };
      if (!f.title || !f.summary || !f.points) return toast('请填写标题、简介和要点');
      if (f.data && !f.kinds.length) return toast('请注明关键数据的性质');
      var btn = this, slug = $('ef-cat').value;
      if (guest) {
        var g = guestVals('gp'); f.contact = ''; if (!g.nickname) return toast('请填写昵称');
        btn.disabled = true; btn.textContent = '发布中…';
        return relay('/post', Object.assign(g, { category: slug, title: f.title, body: buildBody(f, true), t0: t0 })).then(function (r) {
          hideModal(); toast(r.number ? '已发布 #' + r.number + '，约 30 分钟内显示在列表' : '已提交');
          if (r.url) openUrl(r.url);
        }, function (e) { toast('发布失败：' + e.message); btn.disabled = false; btn.textContent = '发布'; });
      }
      btn.disabled = true; btn.textContent = '发布中…';
      meta().then(function (m) {
        if (!m.cats[slug]) throw new Error('仓库里找不到该分类');
        return gql(Q.create, { r: m.repoId, c: m.cats[slug], t: f.title, b: buildBody(f) });
      }).then(function (d) { hideModal(); toast('已发布 #' + d.createDiscussion.discussion.number); loadList(); },
        function (e) { toast('发布失败：' + e.message); btn.disabled = false; btn.textContent = '发布'; });
    };
  }

  // ---- shell ----
  function showModal(html) { var m = $('ex-modal'); $('ex-modal-body').innerHTML = html; m.hidden = false; $('ex-modal-body').scrollTop = 0; }
  function hideModal() { $('ex-modal').hidden = true; if (polling) { clearTimeout(polling); polling = null; } }
  function renderBar() {
    var u = ls(K_USER), el = $('ex-auth'); if (!el) return;
    el.innerHTML = token() ? '<span>@' + esc(u || '已登录') + '</span> <button type="button" class="ex-btn" id="ex-logout">退出登录</button>'
      : '<button type="button" class="ex-btn" id="ex-login">用 GitHub 登录</button>';
    if ($('ex-logout')) $('ex-logout').onclick = logout;
    if ($('ex-login')) $('ex-login').onclick = startLogin;
  }
  function init() {
    var panel = $('panel-exchange'); if (!panel) return;
    panel.innerHTML = '<div class="ex-head"><h2>技术交流</h2><p class="ex-muted">世界各地的研究者分享新技术、新配方、新工艺。所有帖子均为<b>作者自述，未经验证</b>。</p>' +
      '<div class="ex-row"><div id="ex-auth"></div><button type="button" class="ex-btn ex-pri" id="ex-new">＋ 发布</button></div>' +
      '<div class="ex-chips" id="ex-chips">' + [{ slug: 'all', name: '全部' }].concat(CATS).map(function (c) { return '<button type="button" data-cat="' + esc(c.slug) + '"' + (c.slug === 'all' ? ' class="on"' : '') + '>' + esc(c.name) + '</button>'; }).join('') + '</div>' +
      '<div class="ex-row ex-muted"><span id="ex-src"></span><button type="button" class="ex-btn" id="ex-refresh">刷新</button></div></div><div id="ex-list"></div>';
    var modal = document.createElement('div'); modal.id = 'ex-modal'; modal.hidden = true;
    modal.innerHTML = '<div class="ex-sheet"><button type="button" class="ex-close" aria-label="关闭">×</button><div id="ex-modal-body"></div></div>';
    document.body.appendChild(modal);
    modal.querySelector('.ex-close').onclick = hideModal;
    modal.addEventListener('click', function (e) { if (e.target === modal) hideModal(); });
    $('ex-chips').querySelectorAll('button').forEach(function (b) { b.onclick = function () { $('ex-chips').querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); state.cat = b.dataset.cat; loadList(); }; });
    $('ex-new').onclick = openForm; $('ex-refresh').onclick = loadList;
    renderBar();
    var loaded = false, btn = document.querySelector('nav.tabs button[data-tab="exchange"]');
    var go = function () { if (!loaded) { loaded = true; loadList(); } };
    if (btn) btn.addEventListener('click', go);
    if (panel.classList.contains('active')) go();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
