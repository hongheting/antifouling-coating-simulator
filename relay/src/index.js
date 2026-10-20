/**
 * 游客投稿 relay (Cloudflare Worker) for hongheting/antifouling-coating-simulator Discussions.
 * POST /post    {nickname, contact?, publish_contact?, category, title, body, t0, website(honeypot), turnstileToken?}
 * POST /comment {nickname, contact?, publish_contact?, discussionId, body, t0, website, turnstileToken?}
 * Publishes immediately (no pre-review). Owner moderates on GitHub.
 * Secrets: GH_TOKEN (fine-grained PAT: this repo only, Discussions R/W). KV: RELAY_KV.
 */
export const CATEGORIES = ['新技术-new-technology', '新配方-new-formulation', '新工艺-new-process'];
export const LIMITS = { post: 3, comment: 10 }; // per IP per hour
const MAX = { nickname: 40, contact: 120, title: 120, body: 8000, comment: 3000, links: 5 };
const MIN_FILL_MS = { post: 8000, comment: 3000 };
export const BLOCKLIST = [
  // gambling / ads / porn (zh + en) — keep small, owner extends via env BLOCKLIST_EXTRA (comma-separated)
  '博彩', '赌场', '百家乐', '彩票', '六合彩', '时时彩', '真人娱乐', '棋牌', '代孕', '色情', '成人视频', '约炮', '裸聊', '援交',
  '加微信', '加V', '代开发票', '刷单', '兼职日结', '贷款', '网赚', '免费领取',
  'casino', 'betting', 'gambling', 'porn', 'xxx', 'escort', 'viagra', 'cialis', 'crypto giveaway', 'onlyfans', 'loan offer',
];
const ORIGINS = ['capacitor://localhost', 'https://localhost', 'http://localhost'];
export const PREFIX = (nick) => '> **游客投稿 · 昵称：' + nick + ' · 作者自述，未经验证**\n\n';

function cors(req) {
  const o = req.headers.get('Origin') || '';
  const h = { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
  if (ORIGINS.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
}
function json(req, status, obj) { return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(req) } }); }
const clean = (s) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u202a-\u202e]/g, '').trim();
// neutralise markdown/mentions in single-line fields so a nickname can't inject links or @-ping people
const plain = (s) => clean(s).replace(/[\r\n]+/g, ' ').replace(/[\\`*_\[\]<>#|!]/g, '').replace(/@/g, '＠');
const contactStr = (s) => clean(s).replace(/[\r\n]+/g, ' ').replace(/[\\`*\[\]<>|!]/g, '').replace(/(^|\s)@/g, '$1＠');
const countLinks = (s) => (s.match(/https?:\/\/|www\./gi) || []).length;

export function validate(kind, b, env) {
  if (!b || typeof b !== 'object') return '请求格式错误';
  if (clean(b.website)) return 'honeypot';
  const t0 = Number(b.t0), dt = Date.now() - t0;
  if (!t0 || dt < MIN_FILL_MS[kind]) return '填写太快，请稍后再提交';
  if (dt > 6 * 3600e3) return '表单已过期，请重新打开';
  const nick = plain(b.nickname);
  if (!nick) return '请填写昵称';
  if (nick.length > MAX.nickname) return '昵称最多 ' + MAX.nickname + ' 字';
  if (clean(b.contact).length > MAX.contact) return '联系方式过长';
  const body = clean(b.body);
  if (!body) return '内容不能为空';
  if (body.length > (kind === 'post' ? MAX.body : MAX.comment)) return '内容过长';
  if (kind === 'post') {
    if (!CATEGORIES.includes(b.category)) return '类别无效';
    const t = plain(b.title);
    if (t.length < 2 || t.length > MAX.title) return '标题需 2–' + MAX.title + ' 字';
  } else if (typeof b.discussionId !== 'string' || !/^[A-Za-z0-9_=-]{6,64}$/.test(b.discussionId)) return '帖子 ID 无效';
  const all = [nick, b.title, body, b.contact].map(clean).join('\n');
  if (countLinks(all) > MAX.links) return '链接过多（最多 ' + MAX.links + ' 个）';
  const words = BLOCKLIST.concat(String(env.BLOCKLIST_EXTRA || '').split(',').map((x) => x.trim()).filter(Boolean));
  const low = all.toLowerCase();
  if (words.some((w) => low.includes(w.toLowerCase()))) return '内容包含不允许的词语';
  return null;
}

export function buildBody(kind, b) {
  const nick = plain(b.nickname), contact = contactStr(b.contact);
  let out = PREFIX(nick) + clean(b.body);
  if (b.publish_contact === true && contact) out += '\n\n---\n联系方式（作者同意公开）：' + contact;
  return out;
}

async function gh(env, query, variables, fetchImpl) {
  const r = await fetchImpl('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: 'bearer ' + env.GH_TOKEN, 'Content-Type': 'application/json', 'User-Agent': 'afsim-guest-relay' },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (!r.ok || j.errors) throw new Error('github: ' + (j.errors ? j.errors[0].message : r.status));
  return j.data;
}
export const GQL = {
  meta: 'query($o:String!,$n:String!){repository(owner:$o,name:$n){id discussionCategories(first:25){nodes{id slug}}}}',
  target: 'query($id:ID!){node(id:$id){... on Discussion{id locked repository{nameWithOwner} category{slug}}}}',
  create: 'mutation($r:ID!,$c:ID!,$t:String!,$b:String!){createDiscussion(input:{repositoryId:$r,categoryId:$c,title:$t,body:$b}){discussion{id number url}}}',
  comment: 'mutation($d:ID!,$b:String!){addDiscussionComment(input:{discussionId:$d,body:$b}){comment{id url}}}',
};

async function verifyTurnstile(env, token, ip, fetchImpl) {
  if (!env.TURNSTILE_SECRET) return true;
  if (!token) return false;
  const fd = new FormData(); fd.append('secret', env.TURNSTILE_SECRET); fd.append('response', token); if (ip) fd.append('remoteip', ip);
  const r = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: fd });
  return !!(await r.json()).success;
}

// ---- anonymous read (GET /list, GET /discussion) ----
GQL.list = 'query($o:String!,$n:String!,$c:ID,$after:String){repository(owner:$o,name:$n){discussions(first:30,after:$after,categoryId:$c,orderBy:{field:CREATED_AT,direction:DESC}){pageInfo{hasNextPage endCursor} nodes{id number title url createdAt bodyText author{login avatarUrl} category{slug name} comments{totalCount}}}}}';
GQL.detail = 'query($o:String!,$n:String!,$num:Int!){repository(owner:$o,name:$n){discussion(number:$num){id number title url createdAt bodyHTML bodyText author{login avatarUrl} category{slug name} comments(first:100){totalCount nodes{id createdAt bodyHTML bodyText url author{login avatarUrl}}}}}}';
export const READ_LIMIT = 120; // per IP per minute, per isolate (in-memory; no KV writes)
const readHits = new Map();
export function readLimited(ip, now = Date.now()) {
  const minute = Math.floor(now / 60000), k = ip + ':' + minute;
  if (readHits.size > 5000) for (const key of readHits.keys()) if (!key.endsWith(':' + minute)) readHits.delete(key);
  const n = (readHits.get(k) || 0) + 1; readHits.set(k, n);
  return n > READ_LIMIT;
}
let catCache = null;
async function categoryIds(env, o, n, fetchImpl) {
  if (catCache && Date.now() - catCache.at < 3600e3) return catCache.map;
  const m = (await gh(env, GQL.meta, { o, n }, fetchImpl)).repository, map = {};
  m.discussionCategories.nodes.forEach((c) => { map[c.slug] = c.id; });
  catCache = { at: Date.now(), map }; return map;
}
async function handleRead(req, env, ctx, fetchImpl, url) {
  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
  if (readLimited(ip)) return json(req, 429, { ok: false, error: '请求太频繁，请稍后再试' });
  const [o, n] = String(env.REPO || 'hongheting/antifouling-coating-simulator').split('/');
  let key;
  if (url.pathname === '/list') {
    const cat = url.searchParams.get('category') || 'all', after = url.searchParams.get('after') || '';
    if (cat !== 'all' && !CATEGORIES.includes(cat)) return json(req, 400, { ok: false, error: '类别无效' });
    if (after && !/^[A-Za-z0-9+/=_:-]{1,200}$/.test(after)) return json(req, 400, { ok: false, error: 'cursor 无效' });
    key = '/list?category=' + encodeURIComponent(cat) + '&after=' + encodeURIComponent(after);
  } else {
    const num = Number(url.searchParams.get('number'));
    if (!Number.isInteger(num) || num < 1 || num > 1e7) return json(req, 400, { ok: false, error: '帖子编号无效' });
    key = '/discussion?number=' + num;
  }
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const ckey = new Request('https://afsim-relay-cache.internal' + key);
  if (cache) { const hit = await cache.match(ckey); if (hit) { const r = new Response(hit.body, { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Cache': 'HIT', ...cors(req) } }); return r; } }
  if (!env.GH_TOKEN) return json(req, 503, { ok: false, error: 'relay 未配置' });
  let out;
  try {
    if (url.pathname === '/list') {
      const cat = url.searchParams.get('category') || 'all', after = url.searchParams.get('after') || null;
      let cid = null;
      if (cat !== 'all') { cid = (await categoryIds(env, o, n, fetchImpl))[cat]; if (!cid) return json(req, 400, { ok: false, error: '类别不存在' }); }
      const d = (await gh(env, GQL.list, { o, n, c: cid, after }, fetchImpl)).repository.discussions;
      out = { ok: true, generated_at: new Date().toISOString(), pageInfo: d.pageInfo,
        discussions: d.nodes.filter((x) => x.category && CATEGORIES.includes(x.category.slug)) };
    } else {
      const x = (await gh(env, GQL.detail, { o, n, num: Number(url.searchParams.get('number')) }, fetchImpl)).repository.discussion;
      if (!x || !x.category || !CATEGORIES.includes(x.category.slug)) return json(req, 404, { ok: false, error: '帖子不存在' });
      out = { ok: true, discussion: x };
    }
  } catch (e) { return json(req, 502, { ok: false, error: '读取失败，请稍后再试' }); }
  const body = JSON.stringify(out);
  if (cache) { const put = cache.put(ckey, new Response(body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' } })); if (ctx && ctx.waitUntil) ctx.waitUntil(put); else await put; }
  return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Cache': 'MISS', ...cors(req) } });
}

export default {
  async fetch(req, env, ctx, fetchImpl = fetch) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    if (req.method === 'GET' && url.pathname === '/') return json(req, 200, { ok: true, service: 'afsim guest relay', turnstile: !!env.TURNSTILE_SECRET, turnstile_sitekey: env.TURNSTILE_SITEKEY || null });
    if (req.method === 'GET' && (url.pathname === '/list' || url.pathname === '/discussion')) return handleRead(req, env, ctx, fetchImpl, url);
    const kind = url.pathname === '/post' ? 'post' : url.pathname === '/comment' ? 'comment' : null;
    if (req.method !== 'POST' || !kind) return json(req, 404, { ok: false, error: 'not found' });
    const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
    const kv = env.RELAY_KV;

    const banned = String(env.GUEST_BANNED_IPS || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (banned.includes(ip) || (kv && (await kv.get('ban:' + ip)))) return json(req, 403, { ok: false, error: '该网络已被禁止投稿' });

    if (Number(req.headers.get('Content-Length') || 0) > 20000) return json(req, 413, { ok: false, error: '内容过长' });
    let b; try { b = JSON.parse(await req.text()); } catch (e) { return json(req, 400, { ok: false, error: '请求格式错误' }); }
    const err = validate(kind, b, env);
    if (err === 'honeypot') return json(req, 200, { ok: true, url: null }); // silently drop bots
    if (err) return json(req, 400, { ok: false, error: err });
    if (!(await verifyTurnstile(env, b.turnstileToken, ip, fetchImpl))) return json(req, 403, { ok: false, error: '人机验证失败' });

    const bucket = Math.floor(Date.now() / 3600e3), rlKey = 'rl:' + kind + ':' + ip + ':' + bucket;
    const used = kv ? Number((await kv.get(rlKey)) || 0) : 0;
    if (used >= LIMITS[kind]) return json(req, 429, { ok: false, error: '提交太频繁，请一小时后再试' });
    if (!env.GH_TOKEN) return json(req, 503, { ok: false, error: 'relay 未配置' });

    const [o, n] = String(env.REPO || 'hongheting/antifouling-coating-simulator').split('/');
    try {
      let res;
      if (kind === 'post') {
        const m = (await gh(env, GQL.meta, { o, n }, fetchImpl)).repository;
        const cat = m.discussionCategories.nodes.find((c) => c.slug === b.category);
        if (!cat) return json(req, 400, { ok: false, error: '类别不存在' });
        const d = (await gh(env, GQL.create, { r: m.id, c: cat.id, t: plain(b.title), b: buildBody(kind, b) }, fetchImpl)).createDiscussion.discussion;
        res = { ok: true, url: d.url, number: d.number, id: d.id };
      } else {
        const t = (await gh(env, GQL.target, { id: b.discussionId }, fetchImpl)).node;
        if (!t || !t.repository || t.repository.nameWithOwner.toLowerCase() !== (o + '/' + n).toLowerCase() || !CATEGORIES.includes(t.category && t.category.slug)) return json(req, 400, { ok: false, error: '帖子不存在' });
        if (t.locked) return json(req, 403, { ok: false, error: '该帖已锁定' });
        const c = (await gh(env, GQL.comment, { d: b.discussionId, b: buildBody(kind, b) }, fetchImpl)).addDiscussionComment.comment;
        res = { ok: true, url: c.url, id: c.id };
      }
      if (kv) {
        await kv.put(rlKey, String(used + 1), { expirationTtl: 3700 });
        // audit log for the owner (IP + private contact), auto-expires after 90 days; never published
        await kv.put('log:' + Date.now() + ':' + res.id, JSON.stringify({ kind, ip, url: res.url, nickname: plain(b.nickname), contact: contactStr(b.contact) || null, at: new Date().toISOString() }), { expirationTtl: 90 * 86400 });
      }
      return json(req, 200, res);
    } catch (e) {
      return json(req, 502, { ok: false, error: '发布失败，请稍后再试' });
    }
  },
};
