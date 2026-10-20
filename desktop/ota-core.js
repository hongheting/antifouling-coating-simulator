'use strict';
/**
 * Desktop OTA core (pure Node, no Electron) — mirrors mobile/assets/ota.js.
 * Ed25519 signature over the canonical manifest is verified HERE in the main process with the
 * embedded public key; unsigned / wrongly-signed manifests and hash-mismatched zips are always refused.
 */
const crypto = require('crypto');
const zlib = require('zlib');
const path = require('path');

const PUBKEY_B64 = 'hEFQwMHuesmwAYoCMLE0za/fZImUzERjIlBbS5CUNdY=';
const SIG_PREFIX = 'afsim-ota-v1\n';
const SIGNED_FIELDS = ['file', 'minNativeCode', 'maxNativeCode', 'notes', 'sha256', 'size', 'webBuild', 'webVersion'];
const REPO = 'hongheting/antifouling-coating-simulator';
const MIRRORS = [
  'https://raw.githubusercontent.com/' + REPO + '/main/public-data/web/',
  'https://cdn.jsdelivr.net/gh/' + REPO + '@main/public-data/web/',
  'https://fastly.jsdelivr.net/gh/' + REPO + '@main/public-data/web/',
];

function canonical(m) { const o = {}; SIGNED_FIELDS.forEach((k) => { if (m[k] !== undefined) o[k] = m[k]; }); return SIG_PREFIX + JSON.stringify(o); }
function pubKey(b64) {
  const raw = Buffer.from(b64 || PUBKEY_B64, 'base64');
  if (raw.length !== 32) throw new Error('bad pubkey');
  return crypto.createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), raw]), format: 'der', type: 'spki' });
}
function verify(m, pubB64) {
  try {
    if (!m || typeof m.sig !== 'string' || !m.sig) return false;
    const sig = Buffer.from(m.sig, 'base64');
    if (sig.length !== 64) return false;
    return crypto.verify(null, Buffer.from(canonical(m), 'utf8'), pubKey(pubB64), sig);
  } catch (e) { return false; }
}
function gate(m, nativeCode, currentBuild) {
  if (!m || typeof m.webVersion !== 'string' || !Number.isInteger(m.webBuild)) return 'bad manifest';
  if (!/^[0-9a-f]{64}$/.test(m.sha256 || '')) return 'bad sha256';
  if (!/^bundle-[A-Za-z0-9.+_-]+\.zip$/.test(m.file || '')) return 'bad file';
  if (!(m.size > 0 && m.size < 50e6)) return 'bad size';
  if (m.webBuild <= currentBuild) return 'not newer';
  if ((m.minNativeCode || 0) > nativeCode) return 'needs newer APK';
  if (m.maxNativeCode && m.maxNativeCode < nativeCode) return 'native too new';
  return null;
}
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');

/** Minimal safe unzip (stored/deflate). Returns [{name, data}]; rejects traversal/absolute paths. */
function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('zip: no EOCD');
  const n = buf.readUInt16LE(eocd + 10); let p = buf.readUInt32LE(eocd + 16);
  const out = [];
  for (let k = 0; k < n; k++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('zip: bad central dir');
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20), usize = buf.readUInt32LE(p + 24);
    const nl = buf.readUInt16LE(p + 28), el = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), lo = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nl).toString('utf8');
    p += 46 + nl + el + cl;
    if (name.endsWith('/')) continue;
    const norm = path.posix.normalize(name);
    if (norm.startsWith('../') || norm.startsWith('/') || norm.includes('\\') || /^[A-Za-z]:/.test(norm) || norm === '..') throw new Error('zip: unsafe path ' + name);
    if (buf.readUInt32LE(lo) !== 0x04034b50) throw new Error('zip: bad local header');
    const ds = lo + 30 + buf.readUInt16LE(lo + 26) + buf.readUInt16LE(lo + 28);
    const raw = buf.slice(ds, ds + csize);
    const data = method === 0 ? raw : method === 8 ? zlib.inflateRawSync(raw) : null;
    if (!data) throw new Error('zip: unsupported method ' + method);
    if (data.length !== usize) throw new Error('zip: size mismatch ' + name);
    out.push({ name: norm, data });
  }
  if (!out.some((f) => f.name === 'index.html')) throw new Error('zip: no index.html');
  return out;
}

module.exports = { PUBKEY_B64, MIRRORS, canonical, verify, gate, sha256, unzip };
