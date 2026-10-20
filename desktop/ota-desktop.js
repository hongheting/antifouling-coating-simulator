'use strict';
/**
 * Desktop equivalent of @capgo/capacitor-updater (manual mode) used by ui ota.js.
 * Bundles live in userData/ota/<version>/ with the signed manifest + original zip.
 * On every launch the active bundle is RE-verified (signature + sha256) before being loaded;
 * any failure → fall back to the built-in UI. A bundle that does not call notifyAppReady within
 * 15 s is marked bad and the built-in UI is restored on next launch (rollback).
 */
const fs = require('fs');
const path = require('path');
const { net } = require('electron');
const core = require('./ota-core');

function fetchBuf(url, max) {
  return net.fetch(url, { cache: 'no-store' }).then((r) => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.arrayBuffer();
  }).then((ab) => { const b = Buffer.from(ab); if (max && b.length > max) throw new Error('too large'); return b; });
}

class DesktopOta {
  constructor(userData, builtinBuild, nativeCode) {
    this.dir = path.join(userData, 'ota');
    this.stateFile = path.join(this.dir, 'state.json');
    this.builtinBuild = builtinBuild;
    this.nativeCode = nativeCode;
    fs.mkdirSync(this.dir, { recursive: true });
    this.state = this._read();
    this.readyTimer = null;
  }
  _read() { try { return JSON.parse(fs.readFileSync(this.stateFile, 'utf8')); } catch (e) { return { current: null, next: null, bad: [] }; } }
  _save() { fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2)); }
  _bdir(id) { if (!/^[A-Za-z0-9.+_-]+$/.test(id)) throw new Error('bad id'); return path.join(this.dir, id); }

  /** Fully verify an installed bundle; returns manifest or null. */
  _check(id) {
    try {
      const d = this._bdir(id);
      const m = JSON.parse(fs.readFileSync(path.join(d, 'manifest.json'), 'utf8'));
      if (!core.verify(m) || m.webVersion !== id) return null;
      const zip = fs.readFileSync(path.join(d, m.file));
      if (core.sha256(zip) !== m.sha256 || zip.length !== m.size) return null;
      if (m.webBuild <= this.builtinBuild) return null; // installer already newer
      if (!fs.existsSync(path.join(d, 'www', 'index.html'))) return null;
      return m;
    } catch (e) { return null; }
  }

  /** Called once at startup: returns index.html to load (bundle or null for built-in). */
  resolveIndex() {
    const s = this.state;
    if (s.next) { s.current = s.next; s.next = null; s.pendingReady = true; this._save(); }
    else if (s.current && s.pendingReady) { // previous boot never became ready → rollback
      s.bad = (s.bad || []).concat(s.current); s.current = null; s.pendingReady = false; this._save();
    }
    if (s.current && !this._check(s.current)) { s.bad = (s.bad || []).concat(s.current); s.current = null; this._save(); }
    if (s.current) {
      this.readyTimer = setTimeout(() => { /* leave pendingReady=true → rollback next boot */ }, 15000);
      return path.join(this._bdir(s.current), 'www', 'index.html');
    }
    return null;
  }
  currentVersion() { return this.state.current; }

  notifyAppReady() { if (this.state.pendingReady) { this.state.pendingReady = false; this._save(); } clearTimeout(this.readyTimer); return { ok: true }; }

  list() {
    const bundles = [];
    for (const id of fs.readdirSync(this.dir)) {
      try { if (!fs.statSync(path.join(this.dir, id)).isDirectory()) continue; } catch (e) { continue; }
      const m = this._check(id);
      bundles.push({ id, version: id, checksum: m ? m.sha256 : '', status: m && !(this.state.bad || []).includes(id) ? 'success' : 'error' });
    }
    return { bundles };
  }

  /** download({url, version, checksum}) — url must be <mirror>/<file>; manifest is fetched + verified here. */
  async download(opts) {
    const url = String((opts && opts.url) || '');
    const base = core.MIRRORS.find((b) => url.startsWith(b));
    if (!base) throw new Error('不允许的下载地址');
    const file = url.slice(base.length);
    const m = JSON.parse((await fetchBuf(base + 'manifest.json', 1e6)).toString('utf8'));
    if (!core.verify(m)) throw new Error('签名校验失败');
    const why = core.gate(m, this.nativeCode, this.builtinBuild);
    if (why) throw new Error(why);
    if (m.file !== file || m.webVersion !== opts.version || m.sha256 !== opts.checksum) throw new Error('清单不一致');
    const zip = await fetchBuf(base + m.file, 50e6);
    if (zip.length !== m.size || core.sha256(zip) !== m.sha256) throw new Error('校验和不匹配');
    const files = core.unzip(zip);
    const d = this._bdir(m.webVersion), tmp = d + '.tmp';
    fs.rmSync(tmp, { recursive: true, force: true });
    for (const f of files) {
      const p = path.join(tmp, 'www', f.name);
      if (!p.startsWith(path.join(tmp, 'www') + path.sep)) throw new Error('unsafe path');
      fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data);
    }
    fs.writeFileSync(path.join(tmp, m.file), zip);
    fs.writeFileSync(path.join(tmp, 'manifest.json'), JSON.stringify(m, null, 2));
    fs.rmSync(d, { recursive: true, force: true }); fs.renameSync(tmp, d);
    this.state.bad = (this.state.bad || []).filter((x) => x !== m.webVersion); this._save();
    return { id: m.webVersion, version: m.webVersion, checksum: m.sha256, status: 'success' };
  }
  next(opts) { const id = opts && opts.id; if (!this._check(id)) throw new Error('bundle invalid'); this.state.next = id; this._save(); return { id }; }
  set(opts) { this.next(opts); return { id: opts.id, relaunch: true }; }
}
module.exports = { DesktopOta };
