const test = require('node:test'), assert = require('node:assert/strict'), fs = require('fs'), path = require('path'), crypto = require('crypto');
global.nacl = require('tweetnacl'); global.window = undefined;
const g = {}; new Function('globalThis', 'window', 'document', fs.readFileSync(path.join(__dirname, '../assets/ota.js'), 'utf8'))(g, undefined, undefined);
// ota.js uses typeof window → falls back to globalThis param
const T = g.AFSIM_OTA_TEST || globalThis.AFSIM_OTA_TEST;
const m = JSON.parse(fs.readFileSync(path.join(__dirname, '../../public-data/web/manifest.json'), 'utf8'));
test('published manifest verifies with embedded key', () => assert.equal(T.verify(m, nacl), true));
test('tampered fields fail', () => {
  for (const [k, v] of [['sha256', 'a'.repeat(64)], ['webBuild', 99], ['minNativeCode', 1], ['notes', 'x'], ['file', 'bundle-evil.zip'], ['size', 1]])
    assert.equal(T.verify({ ...m, [k]: v }, nacl), false, k);
  assert.equal(T.verify({ ...m, sig: undefined }, nacl), false);
  assert.equal(T.verify({ ...m, sig: '!!' }, nacl), false);
});
test('signature by other key fails', () => {
  const { privateKey } = crypto.generateKeyPairSync('ed25519');
  const sig = crypto.sign(null, Buffer.from(T.canonical(m)), privateKey).toString('base64');
  assert.equal(T.verify({ ...m, sig }, nacl), false);
});
test('zip on disk matches manifest sha256/size', () => {
  const b = fs.readFileSync(path.join(__dirname, '../../public-data/web', m.file));
  assert.equal(crypto.createHash('sha256').update(b).digest('hex'), m.sha256); assert.equal(b.length, m.size);
});
test('gate', () => {
  const ok = { ...m, webBuild: m.webBuild + 1 }, cur = m.webBuild;
  assert.equal(T.gate(ok, 60, cur), null);
  assert.equal(T.gate(m, 60, cur), 'not newer');
  assert.equal(T.gate({ ...ok, minNativeCode: 70 }, 60, cur), 'needs newer APK');
  assert.equal(T.gate({ ...ok, maxNativeCode: 50 }, 60, cur), 'native too new');
  assert.equal(T.gate({ ...ok, sha256: 'xyz' }, 60, cur), 'bad sha256');
  assert.equal(T.gate({ ...ok, file: '../x.zip' }, 60, cur), 'bad file');
  assert.equal(T.gate({ ...ok, webBuild: '2' }, 60, cur), 'bad manifest');
});
