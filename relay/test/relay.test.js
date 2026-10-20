import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { GQL, PREFIX } from '../src/index.js';

function kv() { const m = new Map(); return { m, get: async (k) => (m.has(k) ? m.get(k) : null), put: async (k, v) => { m.set(k, v); } }; }
function mockGh() {
  const calls = [];
  const f = async (url, init) => {
    const q = JSON.parse(init.body); calls.push({ url, ...q, auth: init.headers.Authorization });
    let data;
    if (q.query === GQL.meta) data = { repository: { id: 'R_1', discussionCategories: { nodes: [{ id: 'C_tech', slug: '新技术-new-technology' }, { id: 'C_form', slug: '新配方-new-formulation' }, { id: 'C_proc', slug: '新工艺-new-process' }] } } };
    else if (q.query === GQL.create) data = { createDiscussion: { discussion: { id: 'D_9', number: 9, url: 'https://github.com/hongheting/antifouling-coating-simulator/discussions/9' } } };
    else if (q.query === GQL.target) data = { node: q.variables.id === 'D_other' ? { id: 'D_other', locked: false, repository: { nameWithOwner: 'evil/repo' }, category: { slug: '新技术-new-technology' } } : { id: q.variables.id, locked: false, repository: { nameWithOwner: 'hongheting/antifouling-coating-simulator' }, category: { slug: '新技术-new-technology' } } };
    else if (q.query === GQL.comment) data = { addDiscussionComment: { comment: { id: 'DC_1', url: 'https://github.com/x#c1' } } };
    return new Response(JSON.stringify({ data }), { status: 200 });
  };
  f.calls = calls; return f;
}
const env = () => ({ GH_TOKEN: 'test-token', RELAY_KV: kv(), REPO: 'hongheting/antifouling-coating-simulator' });
const post = (o = {}) => ({ nickname: '张三', category: '新技术-new-technology', title: '测试标题', body: '正文内容', t0: Date.now() - 20000, website: '', ...o });
const req = (path, body, ip = '1.2.3.4', origin = 'capacitor://localhost') => new Request('https://relay.test' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip, Origin: origin }, body: JSON.stringify(body) });
const call = async (path, body, e, f, ip, origin) => { const r = await worker.fetch(req(path, body, ip, origin), e, {}, f); return { status: r.status, j: await r.json(), h: r.headers }; };

test('valid post → createDiscussion with prefix, correct ids, CORS', async () => {
  const e = env(), f = mockGh();
  const r = await call('/post', post({ contact: 'a@b.com' }), e, f);
  assert.equal(r.status, 200); assert.equal(r.j.number, 9); assert.match(r.j.url, /discussions\/9$/);
  assert.equal(r.h.get('Access-Control-Allow-Origin'), 'capacitor://localhost');
  const c = f.calls.find((x) => x.query === GQL.create);
  assert.deepEqual(Object.keys(c.variables).sort(), ['b', 'c', 'r', 't']);
  assert.equal(c.variables.r, 'R_1'); assert.equal(c.variables.c, 'C_tech'); assert.equal(c.auth, 'bearer test-token');
  assert.ok(c.variables.b.startsWith('> **游客投稿 · 昵称：张三 · 作者自述，未经验证**'));
  assert.ok(!c.variables.b.includes('a@b.com'), 'contact must not be published by default');
  const log = [...e.RELAY_KV.m.entries()].find(([k]) => k.startsWith('log:'));
  assert.ok(log && JSON.parse(log[1]).contact === 'a@b.com', 'contact kept privately in KV log');
});
test('publish_contact=true publishes contact', async () => {
  const f = mockGh(); await call('/post', post({ contact: 'a@b.com', publish_contact: true }), env(), f);
  assert.ok(f.calls.find((x) => x.query === GQL.create).variables.b.includes('a@b.com'));
});
test('validation errors', async () => {
  const cases = [[{ nickname: '' }, '昵称'], [{ nickname: 'x'.repeat(41) }, '昵称'], [{ category: 'general' }, '类别'], [{ title: 'x' }, '标题'],
    [{ body: 'x'.repeat(8001) }, '过长'], [{ t0: Date.now() - 1000 }, '太快'], [{ t0: 0 }, '太快'],
    [{ body: 'http://a http://b http://c http://d http://e http://f' }, '链接'], [{ body: '欢迎来 博彩 网站' }, '不允许'], [{ title: 'Best CASINO bonus' }, '不允许']];
  for (const [o, msg] of cases) { const f = mockGh(); const r = await call('/post', post(o), env(), f); assert.equal(r.status, 400, JSON.stringify(o)); assert.match(r.j.error, new RegExp(msg)); assert.equal(f.calls.length, 0); }
});
test('BLOCKLIST_EXTRA from env', async () => { const e = { ...env(), BLOCKLIST_EXTRA: 'spamword' }; const r = await call('/post', post({ body: 'buy SpamWord now' }), e, mockGh()); assert.equal(r.status, 400); });
test('honeypot → fake success, nothing sent', async () => { const f = mockGh(); const r = await call('/post', post({ website: 'http://bot' }), env(), f); assert.equal(r.status, 200); assert.equal(r.j.url, null); assert.equal(f.calls.length, 0); });
test('rate limit: 3 posts/hr per IP, other IP unaffected', async () => {
  const e = env(), f = mockGh();
  for (let i = 0; i < 3; i++) assert.equal((await call('/post', post(), e, f)).status, 200);
  assert.equal((await call('/post', post(), e, f)).status, 429);
  assert.equal((await call('/post', post(), e, f, '5.6.7.8')).status, 200);
});
test('rate limit: 10 comments/hr', async () => {
  const e = env(), f = mockGh(), c = { nickname: 'li', discussionId: 'D_kwDOabc123', body: '好帖', t0: Date.now() - 5000 };
  for (let i = 0; i < 10; i++) assert.equal((await call('/comment', c, e, f)).status, 200);
  assert.equal((await call('/comment', c, e, f)).status, 429);
});
test('comment payload + foreign repo rejected', async () => {
  const f = mockGh(); const r = await call('/comment', { nickname: 'li', discussionId: 'D_kwDOabc123', body: '好帖', t0: Date.now() - 5000 }, env(), f);
  assert.equal(r.status, 200); const m = f.calls.find((x) => x.query === GQL.comment);
  assert.deepEqual(m.variables, { d: 'D_kwDOabc123', b: PREFIX('li') + '好帖' });
  const bad = await call('/comment', { nickname: 'li', discussionId: 'D_other', body: 'x', t0: Date.now() - 5000 }, env(), mockGh());
  assert.equal(bad.status, 400);
});
test('ban list (env + KV)', async () => {
  assert.equal((await call('/post', post(), { ...env(), GUEST_BANNED_IPS: '9.9.9.9, 1.2.3.4' }, mockGh())).status, 403);
  const e = env(); await e.RELAY_KV.put('ban:1.2.3.4', '1'); assert.equal((await call('/post', post(), e, mockGh())).status, 403);
});
test('nickname cannot inject markdown/mentions', async () => {
  const f = mockGh(); await call('/post', post({ nickname: '[x](http://e) @octocat' }), env(), f);
  const b = f.calls.find((x) => x.query === GQL.create).variables.b; assert.ok(!b.includes('](') && !b.includes('@octocat'));
});
test('turnstile enforced when secret set', async () => {
  const e = { ...env(), TURNSTILE_SECRET: 's' };
  const f = mockGh(); const r = await call('/post', post(), e, f); assert.equal(r.status, 403);
  const f2 = async (u, i) => (String(u).includes('turnstile') ? new Response('{"success":true}') : mockGh()(u, i));
  assert.equal((await call('/post', post({ turnstileToken: 'tok' }), e, f2)).status, 200);
});
test('CORS: preflight & unknown origin; 404', async () => {
  const p = await worker.fetch(new Request('https://relay.test/post', { method: 'OPTIONS', headers: { Origin: 'https://localhost' } }), env(), {}, mockGh());
  assert.equal(p.status, 204); assert.equal(p.headers.get('Access-Control-Allow-Origin'), 'https://localhost');
  const r = await call('/post', post(), env(), mockGh(), '1.1.1.1', 'https://evil.com'); assert.equal(r.h.get('Access-Control-Allow-Origin'), null);
  assert.equal((await call('/nope', {}, env(), mockGh())).status, 404);
});
test('no GH_TOKEN → 503', async () => { const e = env(); delete e.GH_TOKEN; assert.equal((await call('/post', post(), e, mockGh())).status, 503); });

// ---- read endpoints ----
import { READ_LIMIT, readLimited } from '../src/index.js';
function mockRead() {
  const calls = [];
  const f = async (url, init) => {
    const q = JSON.parse(init.body); calls.push(q); let data;
    if (q.query === GQL.meta) data = { repository: { id: 'R_1', discussionCategories: { nodes: [{ id: 'C_tech', slug: '新技术-new-technology' }] } } };
    else if (q.query === GQL.list) data = { repository: { discussions: { pageInfo: { hasNextPage: false, endCursor: 'Y3Vy' }, nodes: [
      { id: 'D1', number: 1, title: 'UVc超声防污', category: { slug: '新技术-new-technology', name: '新技术' }, comments: { totalCount: 0 } },
      { id: 'D2', number: 2, title: 'General', category: { slug: 'general', name: 'General' }, comments: { totalCount: 0 } }] } } };
    else if (q.query === GQL.detail) data = { repository: { discussion: q.variables.num === 1 ? { id: 'D1', number: 1, title: 'UVc超声防污', bodyHTML: '<p>x</p>', category: { slug: '新技术-new-technology' }, comments: { totalCount: 0, nodes: [] } } : { id: 'D5', number: 5, category: { slug: 'general' } } } };
    return new Response(JSON.stringify({ data }), { status: 200 });
  };
  f.calls = calls; return f;
}
const get = async (path, e, f, ip = '7.7.7.7') => { const r = await worker.fetch(new Request('https://relay.test' + path, { headers: { 'CF-Connecting-IP': ip, Origin: 'https://localhost' } }), e, {}, f); return { status: r.status, j: await r.json(), h: r.headers }; };
test('GET /list all filters to 3 categories, CORS', async () => {
  const f = mockRead(); const r = await get('/list?category=all', env(), f);
  assert.equal(r.status, 200); assert.deepEqual(r.j.discussions.map((x) => x.number), [1]); assert.equal(r.h.get('Access-Control-Allow-Origin'), 'https://localhost');
  assert.equal(f.calls[0].variables.c, null);
});
test('GET /list category → categoryId; bad category/cursor 400', async () => {
  const f = mockRead(); const r = await get('/list?category=' + encodeURIComponent('新技术-new-technology') + '&after=Y3Vy', env(), f);
  assert.equal(r.status, 200); const q = f.calls.find((c) => c.query === GQL.list); assert.equal(q.variables.c, 'C_tech'); assert.equal(q.variables.after, 'Y3Vy');
  assert.equal((await get('/list?category=general', env(), mockRead())).status, 400);
  assert.equal((await get('/list?after=' + encodeURIComponent('a b"'), env(), mockRead())).status, 400);
});
test('GET /discussion', async () => {
  const r = await get('/discussion?number=1', env(), mockRead()); assert.equal(r.status, 200); assert.equal(r.j.discussion.title, 'UVc超声防污');
  assert.equal((await get('/discussion?number=5', env(), mockRead())).status, 404);
  assert.equal((await get('/discussion?number=abc', env(), mockRead())).status, 400);
});
test('read rate limit in-memory, no KV writes', async () => {
  const e = env(); let puts = 0; e.RELAY_KV.put = async () => { puts++; };
  for (let i = 0; i < 3; i++) await get('/list', e, mockRead(), '8.8.8.8');
  assert.equal(puts, 0);
  const t = Date.UTC(2026, 0, 1); for (let i = 0; i < READ_LIMIT; i++) assert.equal(readLimited('9.9.9.9', t), false);
  assert.equal(readLimited('9.9.9.9', t), true); assert.equal(readLimited('9.9.9.9', t + 60000), false);
});
