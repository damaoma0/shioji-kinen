/* 潮路アーカイブ: shared lock opener.
   A phrase is normalised, stretched with PBKDF2, and split in two:
   the first half names the lock, the second half is the AES-GCM key.
   Nothing here can open a record without the right phrase. */
(function () {
  var ROOT = new URL('../', document.currentScript.src);
  var PUNCT = /[\s　・、。，．,.\-_'"「」『』（）()!！?？]/g;

  function norm(s) {
    s = String(s || '').normalize('NFKC').toLowerCase().replace(PUNCT, '');
    var out = '';
    for (var ch of s) {
      var c = ch.codePointAt(0);
      out += (c >= 0x30a1 && c <= 0x30f6) ? String.fromCodePoint(c - 0x60) : ch;
    }
    return out;
  }

  function b64(s) {
    var bin = atob(s), a = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return a;
  }
  function hex(bytes) {
    return Array.prototype.map.call(bytes, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  var locksP = null;
  function locks() {
    if (!locksP) locksP = fetch(new URL('data/locks.json', ROOT)).then(function (r) { return r.json(); });
    return locksP;
  }

  async function open(phrase) {
    var L = await locks();
    var enc = new TextEncoder();
    var base = await crypto.subtle.importKey('raw', enc.encode(phrase), 'PBKDF2', false, ['deriveBits']);
    var bits = new Uint8Array(await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: b64(L.salt), iterations: L.iter, hash: 'SHA-256' }, base, 512));
    var entry = L.locks[hex(bits.slice(0, 16))];
    if (!entry) return null;
    var key = await crypto.subtle.importKey('raw', bits.slice(32, 64), 'AES-GCM', false, ['decrypt']);
    try {
      var plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(entry.n) }, key, b64(entry.c));
      return JSON.parse(new TextDecoder().decode(plain));
    } catch (e) { return null; }
  }

  function data(name) {
    return fetch(new URL('data/' + name, ROOT)).then(function (r) { return r.json(); });
  }

  window.Shioji = { norm: norm, open: open, data: data, root: ROOT };
})();
