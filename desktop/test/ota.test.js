const test = require('node:test'), assert = require('node:assert/strict'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const core = require('../ota-core');
const WEB = path.join(__dirname, '../../public-data/web');
const m = JSON.parse(fs.readFileSync(path.join(WEB, 'manifest.json'), 'utf8'));
test('published manifest verifies with embedded key (main-process Node crypto)', () => assert.equal(core.verify(m), true));
test('unsigned / tampered / foreign-key manifests rejected', () => {
  assert.equal(core.verify({ ...m, sig: undefined }), false);
  assert.equal(core.verify({ ...m, sig: '' }), false);
  for (const [k, v] of [['sha256', 'a'.repeat(64)], ['webBuild', 99], ['minNativeCode', 1], ['notes', 'x'], ['file', 'bundle-evil.zip'], ['size', 1]])
    assert.equal(core.verify({ ...m, [k]: v }), false, k);
  const { privateKey } = crypto.generateKeyPairSync('ed25519');
  assert.equal(core.verify({ ...m, sig: crypto.sign(null, Buffer.from(core.canonical(m)), privateKey).toString('base64') }), false);
});
test('canonical form identical to mobile ota.js', () => {
  global.nacl = global.nacl || {}; // canonical() needs no crypto
  const g = {}; new Function('globalThis', 'window', 'document', fs.readFileSync(path.join(__dirname, '../../mobile/assets/ota.js'), 'utf8'))(g, undefined, undefined);
  const T = g.AFSIM_OTA_TEST || globalThis.AFSIM_OTA_TEST;
  assert.equal(T.canonical(m), core.canonical(m));
});
test('zip sha256 + safe unzip has index.html', () => {
  const b = fs.readFileSync(path.join(WEB, m.file));
  assert.equal(core.sha256(b), m.sha256);
  const files = core.unzip(b);
  assert.ok(files.find((f) => f.name === 'index.html'));
  assert.ok(files.find((f) => f.name === 'exchange.js'));
});
test('unzip rejects path traversal', () => {
  const name = Buffer.from('../evil.txt'), data = Buffer.from('x');
  const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt32LE(1, 18); lh.writeUInt32LE(1, 22); lh.writeUInt16LE(name.length, 26);
  const cd = Buffer.alloc(46); cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt32LE(1, 20); cd.writeUInt32LE(1, 24); cd.writeUInt16LE(name.length, 28);
  const local = Buffer.concat([lh, name, data]); const central = Buffer.concat([cd, name]);
  const e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(1, 8); e.writeUInt16LE(1, 10); e.writeUInt32LE(central.length, 12); e.writeUInt32LE(local.length, 16);
  assert.throws(() => core.unzip(Buffer.concat([local, central, e])), /unsafe/);
});
test('gate', () => {
  assert.equal(core.gate(m, 60, m.webBuild), 'not newer');
  assert.equal(core.gate({ ...m, webBuild: m.webBuild + 1 }, 60, m.webBuild), null);
  assert.equal(core.gate({ ...m, webBuild: m.webBuild + 1, minNativeCode: 70 }, 60, m.webBuild), 'needs newer APK');
});
