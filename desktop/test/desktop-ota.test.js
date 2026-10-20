const test = require('node:test'), assert = require('node:assert/strict'), fs = require('fs'), path = require('path'), os = require('os');
const Module = require('module'); const WEB = path.join(__dirname, '../../public-data/web');
let tamper = false;
const fakeNet = { fetch: async (url) => {
  const f = url.split('/').pop(); let b = fs.readFileSync(path.join(WEB, f));
  if (tamper && f.endsWith('.zip')) { b = Buffer.from(b); b[100] ^= 1; }
  return { ok: true, status: 200, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.length) };
} };
const orig = Module._load; Module._load = function (r, ...a) { return r === 'electron' ? { net: fakeNet } : orig.call(this, r, ...a); };
const { DesktopOta } = require('../ota-desktop'); const core = require('../ota-core');
const m = JSON.parse(fs.readFileSync(path.join(WEB, 'manifest.json'), 'utf8'));
const req = { url: core.MIRRORS[0] + m.file, version: m.webVersion, checksum: m.sha256 };
test('download → next → relaunch loads verified bundle; rollback if never ready', async () => {
  const ud = fs.mkdtempSync(path.join(os.tmpdir(), 'afota-'));
  const o = new DesktopOta(ud, m.webBuild - 1, 60);
  assert.equal(o.resolveIndex(), null);
  const b = await o.download(req); o.next({ id: b.id });
  const o2 = new DesktopOta(ud, m.webBuild - 1, 60); const idx = o2.resolveIndex();
  assert.ok(idx && fs.existsSync(idx)); clearTimeout(o2.readyTimer);
  // never notifyAppReady → next boot rolls back
  const o3 = new DesktopOta(ud, m.webBuild - 1, 60); assert.equal(o3.resolveIndex(), null);
});
test('tampered installed bundle is refused at launch', async () => {
  const ud = fs.mkdtempSync(path.join(os.tmpdir(), 'afota-'));
  const o = new DesktopOta(ud, m.webBuild - 1, 60); const b = await o.download(req); o.next({ id: b.id });
  const mf = path.join(ud, 'ota', b.id, 'manifest.json'); const j = JSON.parse(fs.readFileSync(mf)); j.notes = 'evil'; fs.writeFileSync(mf, JSON.stringify(j));
  assert.equal(new DesktopOta(ud, m.webBuild - 1, 60).resolveIndex(), null);
});
test('refuses hash-mismatched zip, foreign URL, not-newer', async () => {
  const ud = fs.mkdtempSync(path.join(os.tmpdir(), 'afota-'));
  const o = new DesktopOta(ud, m.webBuild - 1, 60);
  tamper = true; await assert.rejects(o.download(req), /校验和/); tamper = false;
  await assert.rejects(o.download({ ...req, url: 'https://evil.example/' + m.file }), /不允许/);
  await assert.rejects(new DesktopOta(ud, m.webBuild, 60).download(req), /not newer/);
});
