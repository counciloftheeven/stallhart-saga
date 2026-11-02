/* ═══════════════════════════════════════════════════════════════
   STALLHART WIKI — SAYFA EDİTÖRÜ  (assets/js/page-editor.js)
   ---------------------------------------------------------------
   Yönetici olarak yetkilendirilince her sayfanın altında sabit bir
   "Sayfayı Düzenle" düğmesi belirir. Düğme, sayfadaki metinleri
   (zengin metin, TR/EN), görselleri ve sayfanın veri kaydını
   (data/*.json) düzenleyen bir yan panel açar. "Kaydet ve Yayınla"
   değişiklikleri GitHub REST API ile depoya TEK bir commit olarak
   gönderir (GitHub Pages yeniden yayınlar).

   YETKİ MODELİ (dürüst özet)
     · Düğme yalnızca şu durumlarda DOM'a eklenir:
         (a) depoya YAZMA izni olduğu GitHub API'sinde doğrulanmış bir
             erişim anahtarı (fine-grained PAT) bu tarayıcıda varsa, veya
         (b) Supabase oturumu açık ve profil rolü "admin" ise
             (config.js'te Supabase tanımlıysa).
     · Gerçek yetki denetimi GitHub'dadır: anahtarı olmayan kimse, düğmeyi
       zorla gösterse bile commit atamaz. Arayüz kapısı kolaylıktır.
     · Gizli giriş: herhangi bir sayfada Ctrl + Shift + E.

   Bağımlılık: yok (wiki.js'teki SWRich varsa onu kullanır).
   Kurulum: scripts/add-page-editor.mjs tüm sayfalara ekler.
   ═══════════════════════════════════════════════════════════════ */
'use strict';
(function () {

/* ═══════════════════════════════════════════════════════════════
   1. SAF YARDIMCILAR  (DOM'suz — Node'da test edilebilir)
   ═══════════════════════════════════════════════════════════════ */
var PURE = {};

/* ── UTF-8 ⇄ base64 ───────────────────────────────────────── */
PURE.utf8ToB64 = function (str) {
  var bytes = new TextEncoder().encode(str), s = '', CH = 0x8000;
  for (var i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return btoa(s);
};
PURE.b64ToUtf8 = function (b64) {
  var bin = atob(String(b64).replace(/\s/g, '')), bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
};

/* ── HTML kaçışları ───────────────────────────────────────── */
var NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };
PURE.decodeEntities = function (s) {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, function (m, e) {
    if (e.charAt(0) === '#') {
      var n = e.charAt(1).toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try { return String.fromCodePoint(n); } catch (x) { return m; }
    }
    var v = NAMED[e.toLowerCase()];
    return v !== undefined ? v : m;
  });
};
PURE.escAttr = function (s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};
PURE.escText = function (s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

/* ── 1a. JSON: konum bilgili tarayıcı ──────────────────────────
   Dosyayı baştan yazmak yerine yalnızca değişen değerin karakter
   aralığı değiştirilir → biçim (girinti, satır sonu) bozulmaz,
   git diff yalnızca gerçek değişikliği gösterir.                    */
function JScan(text) { this.t = text; this.i = 0; }
JScan.prototype.ws = function () {
  var t = this.t;
  while (this.i < t.length) {
    var c = t.charCodeAt(this.i);
    if (c === 32 || c === 10 || c === 13 || c === 9 || c === 0xFEFF) this.i++; else break;
  }
};
JScan.prototype.str = function () {
  var t = this.t, s = this.i;
  if (t.charAt(s) !== '"') throw new Error('JSON ayrıştırılamadı (dize @' + s + ')');
  var i = s + 1;
  while (i < t.length) {
    var ch = t.charAt(i);
    if (ch === '\\') i += 2; else if (ch === '"') break; else i++;
  }
  this.i = i + 1;
  return { start: s, end: i + 1 };
};
JScan.prototype.skip = function () {
  this.ws();
  var t = this.t, s = this.i, c = t.charAt(s);
  if (c === '"') { this.str(); }
  else if (c === '{' || c === '[') {
    var depth = 0, i = s;
    while (i < t.length) {
      var ch = t.charAt(i);
      if (ch === '"') { this.i = i; this.str(); i = this.i; continue; }
      if (ch === '{' || ch === '[') depth++;
      else if (ch === '}' || ch === ']') { depth--; if (depth === 0) { i++; break; } }
      i++;
    }
    this.i = i;
  } else {
    var m = /^(-?[\d.eE+\-]+|true|false|null)/.exec(t.slice(s, s + 48));
    if (!m) throw new Error('JSON ayrıştırılamadı (değer @' + s + ')');
    this.i = s + m[0].length;
  }
  return { start: s, end: this.i };
};
/* '{' üzerindeyken üyeleri gezer; fn(anahtar) değeri TÜKETMELİ (skip/iniş) ve
   gezintiyi durdurmak için true döndürebilir. */
JScan.prototype.members = function (fn) {
  this.ws();
  if (this.t.charAt(this.i) !== '{') throw new Error('JSON: nesne bekleniyordu @' + this.i);
  this.i++;
  for (;;) {
    this.ws();
    if (this.t.charAt(this.i) === '}') { this.i++; return false; }
    var k = this.str();
    this.ws(); this.i++;                      /* ':' */
    this.ws();
    var r = fn(JSON.parse(this.t.slice(k.start, k.end)));
    if (r) return r;
    this.ws();
    if (this.t.charAt(this.i) === ',') this.i++;
  }
};
JScan.prototype.items = function (fn) {
  this.ws();
  if (this.t.charAt(this.i) !== '[') throw new Error('JSON: dizi bekleniyordu @' + this.i);
  this.i++;
  var n = 0;
  for (;;) {
    this.ws();
    if (this.t.charAt(this.i) === ']') { this.i++; return false; }
    var r = fn(n++);
    if (r) return r;
    this.ws();
    if (this.t.charAt(this.i) === ',') this.i++;
  }
};
function stepInto(sc, step) {
  sc.ws();
  var c = sc.t.charAt(sc.i), res = null;
  if (typeof step === 'number') {
    if (c !== '[') return null;
    sc.items(function (n) { sc.ws(); if (n === step) { res = sc.skip(); return true; } sc.skip(); });
  } else {
    if (c !== '{') return null;
    sc.members(function (k) { sc.ws(); if (k === step) { res = sc.skip(); return true; } sc.skip(); });
  }
  return res;
}
function scanArrForId(sc, id) {
  var res = null;
  sc.items(function () {
    sc.ws();
    var p = sc.i;
    if (sc.t.charAt(p) === '{') {
      var idv = null;
      sc.members(function (k) {
        sc.ws();
        if (k === 'id') { var v = sc.skip(); idv = sc.t.slice(v.start, v.end); if (idv.charAt(0) === '"') idv = JSON.parse(idv); return true; }
        sc.skip();
      });
      sc.i = p;
      var sp = sc.skip();
      if (idv !== null && String(idv) === String(id)) { res = sp; return true; }
    } else sc.skip();
  });
  return res;
}
function findEntity(sc, arrKey, id, depth) {
  sc.ws();
  var c = sc.t.charAt(sc.i), found = null;
  if (c === '{') {
    sc.members(function (key) {
      sc.ws();
      var cc = sc.t.charAt(sc.i);
      if (key === arrKey && cc === '[') {
        var p0 = sc.i, r = scanArrForId(sc, id);
        if (r) { found = r; return true; }
        sc.i = p0;
      }
      if (depth < 6 && (cc === '{' || cc === '[')) {
        var r2 = findEntity(sc, arrKey, id, depth + 1);
        if (r2) { found = r2; return true; }
      } else sc.skip();
    });
    return found;
  }
  if (c === '[') {
    sc.items(function () {
      var r = findEntity(sc, arrKey, id, depth + 1);
      if (r) { found = r; return true; }
    });
    return found;
  }
  sc.skip();
  return null;
}
/* spec: { arr:'characters', id:'zeandor' }  |  { base:['pages','index'] } */
PURE.jsonLocate = function (text, spec) {
  var sc = new JScan(text);
  sc.ws();
  if (spec.base) {
    var cur = { start: sc.i }, i, ch;
    for (i = 0; i < spec.base.length; i++) {
      var s2 = new JScan(text); s2.i = cur.start;
      ch = stepInto(s2, spec.base[i]);
      if (!ch) return null;
      cur = ch;
    }
    var s3 = new JScan(text); s3.i = cur.start;
    return s3.skip();
  }
  return findEntity(sc, spec.arr, spec.id, 0);
};
function walkPath(text, spec, path) {
  var span = PURE.jsonLocate(text, spec);
  if (!span) return { error: 'Kayıt dosyada bulunamadı' };
  for (var i = 0; i < path.length; i++) {
    var sc = new JScan(text); sc.i = span.start;
    var child = stepInto(sc, path[i]);
    if (!child) return { missing: true, parent: span, index: i };
    span = child;
  }
  return { span: span };
}
PURE.jsonGet = function (text, spec, path) {
  var w = walkPath(text, spec, path);
  if (w.error) throw new Error(w.error);
  if (w.missing) return undefined;
  return JSON.parse(text.slice(w.span.start, w.span.end));
};
function insertMember(text, obj, key, value) {
  var close = obj.end - 1, j = close - 1;
  while (j > obj.start && /\s/.test(text.charAt(j))) j--;
  var empty = text.charAt(j) === '{';
  var m = /\n([ \t]*)"/.exec(text.slice(obj.start, close));
  var add = (empty ? '' : ',') + (m ? '\n' + m[1] : ' ') + JSON.stringify(key) + ': ' + JSON.stringify(value);
  return text.slice(0, j + 1) + add + text.slice(j + 1);
}
PURE.jsonSet = function (text, spec, path, value) {
  var w = walkPath(text, spec, path);
  if (w.error) throw new Error(w.error);
  if (w.missing) {
    if (w.index === path.length - 1 && typeof path[w.index] === 'string' && text.charAt(w.parent.start) === '{')
      return insertMember(text, w.parent, path[w.index], value);
    throw new Error('Alan bulunamadı: ' + path.join('.'));
  }
  return text.slice(0, w.span.start) + JSON.stringify(value) + text.slice(w.span.end);
};
/* Sayfa verisinde (tam ayrıştırılmış JSON) kaydı bul → düzenleme alanları için */
PURE.findEntityParsed = function (root, spec) {
  if (spec.base) {
    var cur = root;
    for (var i = 0; i < spec.base.length; i++) { if (cur == null) return null; cur = cur[spec.base[i]]; }
    return cur == null ? null : cur;
  }
  var res = null;
  (function walk(o, d) {
    if (res || o == null || typeof o !== 'object' || d > 7) return;
    if (!Array.isArray(o) && Array.isArray(o[spec.arr])) {
      var f = o[spec.arr].filter(function (x) { return x && String(x.id) === String(spec.id); })[0];
      if (f) { res = f; return; }
    }
    (Array.isArray(o) ? o : Object.keys(o).map(function (k) { return o[k]; })).forEach(function (v) { walk(v, d + 1); });
  })(root, 0);
  return res;
};

/* ── 1b. HTML: etiket tarayıcı + dize düzeyinde yama ───────────
   Sayfa kaynağı DOM'a çevrilip yeniden yazılmaz (tüm dosyanın biçimi
   değişirdi). Yalnızca ilgili açılış etiketi ve iç metin değiştirilir.
   <script>/<style>/yorum içleri maskelenir (JS şablonlarındaki sahte
   etiketlere dokunulmaz).                                            */
var VOID = { area:1, base:1, br:1, col:1, embed:1, hr:1, img:1, input:1, link:1, meta:1, source:1, track:1, wbr:1 };
var TAG_SRC = '<([a-zA-Z][a-zA-Z0-9:-]*)((?:\\s+[^\\s"\'<>\\/=]+(?:\\s*=\\s*(?:"[^"]*"|\'[^\']*\'|[^\\s"\'=<>`]+))?)*)\\s*(\\/?)>';
var ATTR_SRC = '\\s+([^\\s"\'<>\\/=]+)(?:\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s"\'=<>`]+)))?';
PURE.maskHtml = function (src) {
  return src.replace(/<!--[\s\S]*?-->|<(script|style|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, function (m) {
    return m.replace(/[^\n]/g, ' ');
  });
};
function parseTag(m, base) {
  var tag = { name: m[1].toLowerCase(), start: base, end: base + m[0].length, raw: m[0], selfClose: m[3] === '/', attrs: [] };
  var off = 1 + m[1].length, ar = new RegExp(ATTR_SRC, 'g'), a;
  while ((a = ar.exec(m[2]))) {
    var v = a[2] !== undefined ? a[2] : a[3] !== undefined ? a[3] : a[4] !== undefined ? a[4] : '';
    tag.attrs.push({ name: a[1].toLowerCase(), value: PURE.decodeEntities(v), has: a[2] !== undefined || a[3] !== undefined || a[4] !== undefined,
      start: off + a.index, end: off + a.index + a[0].length });
  }
  return tag;
}
PURE.scanTags = function (masked, pred) {
  var re = new RegExp(TAG_SRC, 'g'), m, out = [];
  while ((m = re.exec(masked))) {
    if (pred && !pred(m[1].toLowerCase(), m[2])) continue;
    out.push(parseTag(m, m.index));
  }
  return out;
};
function attrOf(tag, name) {
  for (var i = 0; i < tag.attrs.length; i++) if (tag.attrs[i].name === name) return tag.attrs[i];
  return null;
}
PURE.editTagAttrs = function (raw, edits) {
  edits.forEach(function (ed) {
    var m = new RegExp('^' + TAG_SRC + '$').exec(raw);
    if (!m) throw new Error('Etiket ayrıştırılamadı');
    var tag = parseTag(m, 0), a = attrOf(tag, ed.name);
    if (ed.remove) { if (a) raw = raw.slice(0, a.start) + raw.slice(a.end); return; }
    var rep = ' ' + ed.name + '="' + PURE.escAttr(ed.value) + '"';
    if (a) raw = raw.slice(0, a.start) + rep + raw.slice(a.end);
    else {
      var cut = raw.length - (tag.selfClose ? 2 : 1);
      raw = raw.slice(0, cut).replace(/\s+$/, '') + rep + raw.slice(cut);
    }
  });
  return raw;
};
PURE.findClose = function (masked, name, from) {
  var re = new RegExp('<(\\/?)' + name + '(?=[\\s/>])[^>]*>', 'gi'), m, depth = 1;
  re.lastIndex = from;
  while ((m = re.exec(masked))) {
    if (m[1]) { depth--; if (depth === 0) return { innerEnd: m.index, closeEnd: m.index + m[0].length }; }
    else if (!/\/\s*>$/.test(m[0])) depth++;
  }
  return null;
};
/* Kaynakta data-tr taşıyan etiketler (tagIndex bu listeye göredir) */
PURE.biTags = function (src) {
  var masked = PURE.maskHtml(src);
  return { masked: masked, tags: PURE.scanTags(masked, function (n, as) { return as.indexOf('data-tr') > -1; })
    .filter(function (t) { return attrOf(t, 'data-tr'); }) };
};
PURE.patchBilingual = function (src, op) {
  var bt = PURE.biTags(src), tags = bt.tags;
  function val(t, n) { var a = attrOf(t, n); return a ? a.value : ''; }
  function same(t) { return val(t, 'data-tr') === op.origTr && val(t, 'data-en') === (op.origEn || ''); }
  var tag = (op.tagIndex != null && tags[op.tagIndex] && same(tags[op.tagIndex])) ? tags[op.tagIndex] : null;
  if (!tag) tag = tags.filter(same)[0] || null;
  if (!tag) throw new Error('Metin kaynak dosyada bulunamadı (sayfa depoda değişmiş olabilir)');
  var edits = [{ name: 'data-tr', value: op.tr }];
  if (attrOf(tag, 'data-en') || op.en) edits.push({ name: 'data-en', value: op.en || '' });
  var newRaw = PURE.editTagAttrs(tag.raw, edits);
  var inner = op.mode === 'html' ? op.tr : PURE.escText(op.tr);
  if (!tag.selfClose && !VOID[tag.name]) {
    var close = PURE.findClose(bt.masked, tag.name, tag.end);
    if (close) return src.slice(0, tag.start) + newRaw + inner + src.slice(close.innerEnd);
  }
  return src.slice(0, tag.start) + newRaw + src.slice(tag.end);
};
PURE.imgStem = function (s) {
  return String(s || '').split(/[?#]/)[0].replace(/^(\.\/|\/)+/, '').replace(/\.(png|jpe?g|webp|gif|svg|avif)$/i, '')
    .replace(/-\d+w$/, '').toLowerCase();
};
PURE.imgTags = function (src) {
  var masked = PURE.maskHtml(src);
  return { masked: masked, tags: PURE.scanTags(masked, function (n) { return n === 'img'; }) };
};
PURE.patchImage = function (src, op) {
  var tags = PURE.imgTags(src).tags;
  function srcOf(t) { var a = attrOf(t, 'src') || attrOf(t, 'data-src'); return a ? a.value : ''; }
  var want = PURE.imgStem(op.origSrc);
  var tag = (op.tagIndex != null && tags[op.tagIndex] && PURE.imgStem(srcOf(tags[op.tagIndex])) === want) ? tags[op.tagIndex] : null;
  if (!tag) tag = tags.filter(function (t) { return PURE.imgStem(srcOf(t)) === want; })[0] || null;
  if (!tag) throw new Error('Görsel kaynak dosyada bulunamadı (sayfa depoda değişmiş olabilir)');
  var edits = [];
  if (attrOf(tag, 'src')) edits.push({ name: 'src', value: op.src });
  if (attrOf(tag, 'data-src')) edits.push({ name: 'data-src', value: op.src });
  if (!edits.length) edits.push({ name: 'src', value: op.src });
  if (attrOf(tag, 'srcset')) edits.push({ name: 'srcset', remove: true });
  if (attrOf(tag, 'sizes')) edits.push({ name: 'sizes', remove: true });
  if (op.alt != null) edits.push({ name: 'alt', value: op.alt });
  return src.slice(0, tag.start) + PURE.editTagAttrs(tag.raw, edits) + src.slice(tag.end);
};
/* config.js → dataVersion (tarayıcı veri önbelleğini aşmak için) */
PURE.bumpDataVersion = function (src, ver) {
  var re = /(dataVersion\s*:\s*)(['"])([^'"]*)\2/;
  if (!re.test(src)) return null;
  return src.replace(re, function (m, a, q) { return a + q + ver + q; });
};
PURE.slug = function (name) {
  var map = { 'ç':'c','ğ':'g','ı':'i','ö':'o','ş':'s','ü':'u','Ç':'C','Ğ':'G','İ':'I','Ö':'O','Ş':'S','Ü':'U' };
  return String(name).replace(/[çğıöşüÇĞİÖŞÜ]/g, function (c) { return map[c]; })
    .replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'gorsel';
};

if (typeof document === 'undefined') {
  if (typeof module !== 'undefined' && module.exports) module.exports = PURE;
  return;
}
/* ═══════════════════════════════════════════════════════════════
   2. ALTYAPI: durum, ayarlar, küçük yardımcılar
   ═══════════════════════════════════════════════════════════════ */
PURE.decodeEntities = function (s) { var ta = document.createElement('textarea'); ta.innerHTML = s; return ta.value; };

var LS_CFG = 'sw-pe-cfg', LS_TOK = 'sw-pe-token', SS_TOK = 'sw-pe-token-s', SS_AUTH = 'sw-pe-auth';
var S = {
  cfg: null, root: null, open: false, tab: 'content', views: {}, resets: {},
  changes: {}, uploads: {}, sources: [], blocks: [], imgs: [], route: null, pageFile: '', pageSrc: null,
  tree: null, manifest: null, tokenOk: false, viaSupabase: false, busy: false, msg: '', bump: true, notes: []
};

function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function el(tag, props, kids) {
  var n = document.createElement(tag); props = props || {};
  Object.keys(props).forEach(function (k) {
    var v = props[k];
    if (v == null || v === false) return;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  });
  (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
  return n;
}
function esc(s) { return PURE.escText(s).replace(/"/g, '&quot;'); }
function san(h) {
  if (window.SWRich && window.SWRich.sanitize) return window.SWRich.sanitize(h);
  var d = document.createElement('div'); d.innerHTML = h;
  $$('script,style,iframe,object,embed,link,meta,form', d).forEach(function (n) { n.remove(); });
  $$('*', d).forEach(function (n) {
    Array.prototype.slice.call(n.attributes).forEach(function (a) {
      if (/^on/i.test(a.name) || /^\s*javascript:/i.test(a.value)) n.removeAttribute(a.name);
    });
  });
  return d.innerHTML;
}
function plain(html) { var d = document.createElement('div'); d.innerHTML = san(html || ''); return (d.textContent || '').replace(/\s+/g, ' ').trim(); }
function short(s, n) { s = plain(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function curLang() { try { return (window.Lang && window.Lang.get) ? window.Lang.get() : (localStorage.getItem('sw-lang') || 'tr'); } catch (e) { return 'tr'; } }
function nChanges() { return Object.keys(S.changes).length; }
function dirty() { return nChanges() > 0 || Object.keys(S.uploads).length > 0; }

/* ── ayarlar & anahtar ─────────────────────────────────────── */
function loadCfg() {
  var c = { owner: '', repo: '', branch: 'main' };
  var sc = (window.SW_CONFIG && window.SW_CONFIG.github) || {};
  var loc = {};
  try { loc = JSON.parse(localStorage.getItem(LS_CFG) || '{}') || {}; } catch (e) {}
  c = Object.assign(c, sc, loc);
  if (!c.owner && /\.github\.io$/i.test(location.hostname)) c.owner = location.hostname.split('.')[0];
  return c;
}
function saveCfg(c) { S.cfg = c; try { localStorage.setItem(LS_CFG, JSON.stringify(c)); } catch (e) {} }
function getToken() { try { return sessionStorage.getItem(SS_TOK) || localStorage.getItem(LS_TOK) || ''; } catch (e) { return ''; } }
function setToken(t, remember) {
  try { sessionStorage.removeItem(SS_TOK); localStorage.removeItem(LS_TOK); sessionStorage.removeItem(SS_AUTH); } catch (e) {}
  if (!t) return;
  try { (remember ? localStorage : sessionStorage).setItem(remember ? LS_TOK : SS_TOK, t); } catch (e) {}
}

/* ── GitHub REST ───────────────────────────────────────────── */
function ghMsg(st, j) {
  var m = (j && j.message) || ('HTTP ' + st);
  if (st === 401) return 'GitHub anahtarı geçersiz veya süresi dolmuş (' + m + ')';
  if (st === 403) return 'Erişim reddedildi — anahtarın bu depoda “Contents: Read and write” izni var mı? (' + m + ')';
  if (st === 404) return 'Depo ya da dosya bulunamadı veya anahtarın erişimi yok (' + m + ')';
  if (st === 409 || st === 422) return 'GitHub işlemi reddetti — dal korumalı ya da depo bu arada değişmiş olabilir (' + m + ')';
  return m;
}
function gh(path, opts) {
  opts = opts || {};
  var tok = opts.token !== undefined ? opts.token : getToken();
  var headers = { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  if (tok) headers.Authorization = 'Bearer ' + tok;
  if (opts.body) headers['Content-Type'] = 'application/json';
  return fetch('https://api.github.com' + path, {
    method: opts.method || 'GET', headers: headers, cache: 'no-store',
    body: opts.body ? JSON.stringify(opts.body) : undefined
  }).then(function (r) {
    if (r.status === 204) return null;
    return r.json().catch(function () { return null; }).then(function (j) {
      if (!r.ok) { var e = new Error(ghMsg(r.status, j)); e.status = r.status; throw e; }
      return j;
    });
  }, function () { throw new Error('GitHub’a ulaşılamadı (ağ bağlantısını kontrol edin).'); });
}
function repoPath(c) { c = c || S.cfg; return '/repos/' + encodeURIComponent(c.owner) + '/' + encodeURIComponent(c.repo); }
function encPath(p) { return p.split('/').map(encodeURIComponent).join('/'); }
async function readFile(path) {
  var j = await gh(repoPath() + '/contents/' + encPath(path) + '?ref=' + encodeURIComponent(S.cfg.branch));
  if (Array.isArray(j)) throw new Error(path + ' bir klasör');
  var b64 = j.content;
  if (!b64 && j.sha) { var b = await gh(repoPath() + '/git/blobs/' + j.sha); b64 = b.content; }   /* >1 MB dosyalar */
  return { text: PURE.b64ToUtf8(b64 || ''), sha: j.sha };
}
async function commitFiles(files, message) {
  var rp = repoPath(), br = encPath(S.cfg.branch);
  var ref = await gh(rp + '/git/ref/heads/' + br);
  var parent = ref.object.sha;
  var pc = await gh(rp + '/git/commits/' + parent);
  var tree = [];
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    setStatus('Dosyalar gönderiliyor… ' + (i + 1) + '/' + files.length);
    var bl = await gh(rp + '/git/blobs', { method: 'POST', body: f.b64 != null ? { content: f.b64, encoding: 'base64' } : { content: f.text, encoding: 'utf-8' } });
    tree.push({ path: f.path, mode: '100644', type: 'blob', sha: bl.sha });
  }
  setStatus('Commit oluşturuluyor…');
  var nt = await gh(rp + '/git/trees', { method: 'POST', body: { base_tree: pc.tree.sha, tree: tree } });
  var nc = await gh(rp + '/git/commits', { method: 'POST', body: { message: message, tree: nt.sha, parents: [parent] } });
  await gh(rp + '/git/refs/heads/' + br, { method: 'PATCH', body: { sha: nc.sha, force: false } });
  return nc;
}

/* ── yetki ─────────────────────────────────────────────────── */
async function verify(force) {
  var cfg = S.cfg = loadCfg(), tok = getToken();
  if (!tok || !cfg.owner || !cfg.repo) return { ok: false, reason: 'config' };
  var key = cfg.owner + '/' + cfg.repo + '#' + tok.slice(-6);
  try {
    var c = JSON.parse(sessionStorage.getItem(SS_AUTH) || 'null');
    if (!force && c && c.ok && c.key === key && Date.now() - c.ts < 15 * 60e3) return c;
  } catch (e) {}
  try {
    var repo = await gh(repoPath(cfg), { token: tok });
    var p = repo && repo.permissions;
    var ok = p ? !!(p.push || p.admin || p.maintain) : true;       /* fine-grained anahtarda "permissions" gelmeyebilir */
    var r = { ok: ok, key: key, ts: Date.now(), weak: !p, reason: ok ? '' : 'Bu anahtarın depoya yazma izni yok.' };
    try { sessionStorage.setItem(SS_AUTH, JSON.stringify(r)); } catch (e) {}
    return r;
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}
async function refreshAuth(force) {
  var r = await verify(force);
  S.tokenOk = !!r.ok;
  syncFab();
  return r;
}
function watchSupabase() {
  var C = window.Wiki && window.Wiki.Community;
  if (!C || !C.enabled || typeof C.getState !== 'function') return;
  function chk() {
    var st = null; try { st = C.getState(); } catch (e) {}
    var adm = !!(st && st.isAdmin);
    if (adm !== S.viaSupabase) { S.viaSupabase = adm; syncFab(); }
  }
  chk();
  try { if (C.onAuth) C.onAuth(chk); } catch (e) {}
  var n = 0, iv = setInterval(function () { chk(); if (++n > 14 || S.viaSupabase) clearInterval(iv); }, 700);
}

/* ── kök kap, toast, modal ─────────────────────────────────── */
function root() {
  if (S.root) return S.root;
  S.root = el('div', { id: 'swpe-root', 'data-pe-skip': '' });
  S.root.appendChild(el('div', { class: 'swpe-toasts', 'aria-live': 'polite' }));
  document.body.appendChild(S.root);
  return S.root;
}
function toast(msg, kind) {
  var t = el('div', { class: 'swpe-toast ' + (kind || ''), text: msg });
  $('.swpe-toasts', root()).appendChild(t);
  setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 300); }, kind === 'err' ? 7000 : 3200);
}
var modalStack = [];
function modal(o) {
  var back = el('div', { class: 'swpe-modal-back' });
  var box = el('div', { class: 'swpe-modal' + (o.wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true' });
  var api = { box: box, body: el('div', { class: 'swpe-modal-body' }) };
  api.close = function (silent) {
    var i = modalStack.indexOf(api); if (i > -1) modalStack.splice(i, 1);
    back.remove(); if (!silent && o.onClose) o.onClose();
  };
  box.appendChild(el('div', { class: 'swpe-modal-h' }, [
    el('h3', { text: o.title || '' }),
    el('button', { class: 'swpe-x', type: 'button', 'aria-label': 'Kapat', text: '×', onclick: function () { api.close(); } })
  ]));
  box.appendChild(api.body);
  if (o.actions && o.actions.length) {
    var f = el('div', { class: 'swpe-modal-f' });
    o.actions.forEach(function (a) {
      f.appendChild(el('button', { type: 'button', class: 'swpe-btn' + (a.primary ? ' primary' : '') + (a.danger ? ' danger' : ''), text: a.label,
        onclick: function (e) { a.onClick(api, e); } }));
    });
    box.appendChild(f);
  }
  back.appendChild(box);
  back.addEventListener('mousedown', function (e) { if (e.target === back && !o.sticky) api.close(); });
  root().appendChild(back);
  modalStack.push(api);
  return api;
}
function confirmBox(msg, okLabel) {
  return new Promise(function (res) {
    var done = false;
    var m = modal({ title: 'Onay', onClose: function () { if (!done) res(false); }, actions: [
      { label: 'Vazgeç', onClick: function (a) { done = true; a.close(true); res(false); } },
      { label: okLabel || 'Evet', primary: true, onClick: function (a) { done = true; a.close(true); res(true); } }
    ] });
    m.body.appendChild(el('p', { class: 'swpe-p', text: msg }));
  });
}
function askText(title, def, ph) {
  return new Promise(function (res) {
    var done = false, inp = el('input', { class: 'swpe-input', type: 'text', value: def || '', placeholder: ph || '' });
    var m = modal({ title: title, onClose: function () { if (!done) res(null); }, actions: [
      { label: 'Vazgeç', onClick: function (a) { done = true; a.close(true); res(null); } },
      { label: 'Tamam', primary: true, onClick: function (a) { done = true; a.close(true); res(inp.value.trim()); } }
    ] });
    m.body.appendChild(inp);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); done = true; m.close(true); res(inp.value.trim()); } });
    setTimeout(function () { inp.focus(); inp.select(); }, 30);
  });
}

/* ═══════════════════════════════════════════════════════════════
   3. GÖRSEL KÜTÜPHANESİ (assets/images/ ile uyumlu)
   ---------------------------------------------------------------
   Yüklenen görseller depoya assets/images/<klasör>/ altına ORİJİNAL
   biçimiyle gider; mevcut "Görselleri optimize et" iş akışı WebP +
   srcset varyantlarını ve manifest.json'u kendisi üretir.
   ═══════════════════════════════════════════════════════════════ */
var IMG_RE = /\.(png|jpe?g|gif|svg|webp|avif)$/i;
var FOLDERS = ['characters', 'gods', 'kingdoms', 'banners', 'chapters', 'maps'];
function bytesToB64(bytes) {
  var s = '', CH = 0x8000;
  for (var i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return btoa(s);
}
async function ensureTree() {
  if (!S.tree) {
    try {
      var t = await gh(repoPath() + '/git/trees/' + encodeURIComponent(S.cfg.branch) + '?recursive=1');
      var all = (t.tree || []).filter(function (x) { return x.type === 'blob' && /^assets\/images\//.test(x.path) && IMG_RE.test(x.path) && !/-\d+w\.webp$/i.test(x.path); })
        .map(function (x) { return x.path; });
      var stems = {};
      all.forEach(function (p) { if (!/\.webp$/i.test(p)) stems[p.replace(IMG_RE, '')] = 1; });
      S.tree = all.filter(function (p) { return !(/\.webp$/i.test(p) && stems[p.replace(IMG_RE, '')]); });   /* orijinali olan WebP'yi gizle */
    } catch (e) { S.tree = []; toast('Görsel listesi alınamadı: ' + e.message, 'err'); }
  }
  if (!S.manifest) {
    try { var r = await fetch('assets/images/manifest.json', { cache: 'force-cache' }); S.manifest = (await r.json()).images || {}; }
    catch (e) { S.manifest = {}; }
  }
}
function thumbUrl(path) {
  if (!path) return '';
  if (S.uploads[path]) return S.uploads[path].url;
  var m = S.manifest && S.manifest[path];
  if (m && m.s && m.s[0]) return m.s[0][1];
  return path;
}
async function processImage(file) {
  var ext = ({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' })[file.type];
  if (!ext) throw new Error('Desteklenmeyen biçim: PNG, JPG, WebP, GIF veya SVG yükleyin.');
  var blob = file;
  if ((ext === 'png' || ext === 'jpg' || ext === 'webp') && window.createImageBitmap) {
    var bmp = await createImageBitmap(file), mx = Math.max(bmp.width, bmp.height);
    if (mx > 2400) {                                   /* çok büyükse 2400 px'e küçült */
      var k = 2400 / mx, c = document.createElement('canvas');
      c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      blob = await new Promise(function (r) { c.toBlob(r, ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg', 0.9); });
    }
  }
  if (!blob || blob.size > 25 * 1024 * 1024) throw new Error('Görsel çok büyük (en fazla 25 MB).');
  var bytes = new Uint8Array(await blob.arrayBuffer());
  return { ext: ext, blob: blob, b64: bytesToB64(bytes) };
}
async function queueUpload(file, folder) {
  await ensureTree();
  var p = await processImage(file);
  var base = PURE.slug(file.name.replace(/\.[^.]+$/, '')), n = 1, path;
  function taken(x) { return S.uploads[x] || (S.tree || []).indexOf(x) > -1; }
  do { path = 'assets/images/' + (folder ? folder + '/' : '') + base + (n > 1 ? '-' + n : '') + '.' + p.ext; n++; } while (taken(path));
  S.uploads[path] = { b64: p.b64, url: URL.createObjectURL(p.blob), size: p.blob.size };
  refreshChrome();
  return path;
}
async function pickImage(o) {
  o = o || {};
  var pickable = o.pickable !== false;
  await ensureTree();
  return new Promise(function (resolve) {
    var done = false;
    var m = modal({ title: pickable ? 'Görsel Seç' : 'Görsel Kütüphanesi', wide: true, onClose: function () { if (!done) resolve(null); } });
    var sel = el('select', { class: 'swpe-input' });
    var q = el('input', { class: 'swpe-input', placeholder: 'Dosya adı ara…', type: 'search' });
    var fi = el('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true });
    var up = el('button', { type: 'button', class: 'swpe-btn primary', text: '⬆ Yeni görsel yükle', onclick: function () { fi.click(); } });
    var grid = el('div', { class: 'swpe-grid' });
    var bar = el('div', { class: 'swpe-libbar' }, [sel, q, up, fi]);
    m.body.appendChild(bar);
    m.body.appendChild(grid);
    m.body.appendChild(el('p', { class: 'swpe-note', text: 'Yüklenen görseller assets/images/ altına eklenir; “Kaydet ve Yayınla” ile depoya gider. Yayından sonra otomatik WebP/srcset üretilir.' }));
    function folderOf(p) { var r = p.replace(/^assets\/images\//, ''), i = r.indexOf('/'); return i < 0 ? '(kök)' : r.slice(0, i); }
    function paths() {
      var set = {};
      (S.tree || []).forEach(function (p) { set[p] = 1; });
      Object.keys(S.uploads).forEach(function (p) { set[p] = 2; });
      return Object.keys(set).sort();
    }
    function fillSel() {
      var fs = {}; FOLDERS.forEach(function (f) { fs[f] = 1; }); paths().forEach(function (p) { fs[folderOf(p)] = 1; });
      var keep = sel.value || o.folder || '';
      sel.innerHTML = '<option value="">Tüm klasörler</option>' + Object.keys(fs).sort().map(function (f) { return '<option value="' + esc(f) + '">' + esc(f) + '</option>'; }).join('');
      sel.value = keep;
    }
    function render() {
      grid.innerHTML = '';
      var f = sel.value, s = q.value.trim().toLowerCase(), n = 0;
      paths().forEach(function (p) {
        if (f && folderOf(p) !== f) return;
        if (s && p.toLowerCase().indexOf(s) < 0) return;
        n++;
        var t = el('button', { type: 'button', class: 'swpe-tile' + (S.uploads[p] ? ' new' : ''), title: p }, [
          el('img', { src: thumbUrl(p), loading: 'lazy', alt: '' }),
          el('span', { text: p.replace(/^assets\/images\//, '') })
        ]);
        if (S.uploads[p]) t.appendChild(el('em', { text: 'yeni' }));
        t.addEventListener('click', function () { if (pickable) { done = true; m.close(true); resolve(p); } else { try { navigator.clipboard.writeText(p); toast('Yol panoya kopyalandı'); } catch (e) {} } });
        grid.appendChild(t);
      });
      if (!n) grid.appendChild(el('div', { class: 'swpe-empty', text: 'Bu filtreyle görsel yok.' }));
    }
    fi.addEventListener('change', async function () {
      var files = Array.prototype.slice.call(fi.files), last = null;
      for (var i = 0; i < files.length; i++) {
        try { last = await queueUpload(files[i], (sel.value && sel.value !== '(kök)') ? sel.value : (sel.value === '(kök)' ? '' : (o.folder || ''))); toast('Eklendi: ' + last.replace(/^assets\/images\//, '')); }
        catch (e) { toast(files[i].name + ': ' + e.message, 'err'); }
      }
      fi.value = '';
      if (last && pickable && files.length === 1) { done = true; m.close(true); resolve(last); return; }
      fillSel(); render();
    });
    sel.addEventListener('change', render); q.addEventListener('input', render);
    fillSel(); render();
  });
}

/* ═══════════════════════════════════════════════════════════════
   4. ZENGİN METİN EDİTÖRÜ (WYSIWYG)
   ═══════════════════════════════════════════════════════════════ */
var COLORS = ['#c9a24d', '#b87333', '#8b0000', '#ff6b6b', '#e8d9b5', '#ffffff', '#9a9a9a', '#5fa8d3', '#7fbf7f', '#b58be0'];
function toEditable(v, o) {
  v = v == null ? '' : String(v);
  if (!v) return '';
  var SW = window.SWRich;
  if (o && o.raw) return v;                                   /* sayfa içi HTML parçası: olduğu gibi */
  if (o && o.inline) return /<[a-z][\s\S]*>/i.test(v) ? v : esc(v).replace(/\n/g, '<br>');
  if (SW && SW.isHtml && SW.isHtml(v)) return v;
  if (SW && SW.mdToHtml) return SW.mdToHtml(v);
  return v.split(/\n{2,}/).map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
}
function createRTE(o) {
  var inline = !!o.inline, srcMode = false, saved = null;
  var wrap = el('div', { class: 'swpe-rte' + (inline ? ' inline' : '') });
  var tb = el('div', { class: 'swpe-rte-tb', role: 'toolbar' });
  var area = el('div', { class: 'swpe-rte-area sw-rich', contenteditable: 'true', spellcheck: 'true' });
  var src = el('textarea', { class: 'swpe-rte-src', spellcheck: 'false' });
  src.style.display = 'none';
  area.innerHTML = san(toEditable(o.html, o));

  function value() {
    var h = san(srcMode ? src.value : area.innerHTML).replace(/(<br\s*\/?>\s*)+$/i, '');
    if (!plain(h) && !/<(img|hr|table)/i.test(h)) return '';
    return h;
  }
  function changed() { if (o.onInput) o.onInput(value()); }
  function saveSel() { var s = window.getSelection(); if (s.rangeCount && area.contains(s.anchorNode)) saved = s.getRangeAt(0).cloneRange(); }
  function restoreSel() { area.focus(); if (saved) { var s = window.getSelection(); s.removeAllRanges(); s.addRange(saved); } }
  function run(cmd, arg) {
    if (srcMode) return;
    restoreSel();
    try { document.execCommand('styleWithCSS', false, true); } catch (e) {}
    document.execCommand(cmd, false, arg == null ? null : arg);
    saveSel(); changed();
  }
  var palette = el('div', { class: 'swpe-palette' });
  palette.style.display = 'none';
  COLORS.forEach(function (c) {
    var b = el('button', { type: 'button', class: 'swpe-sw', title: c });
    b.style.background = c;
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    b.addEventListener('click', function () { palette.style.display = 'none'; run('foreColor', c); });
    palette.appendChild(b);
  });
  function B(label, title, fn, cls) {
    var b = el('button', { type: 'button', class: 'swpe-tbn ' + (cls || ''), title: title, 'aria-label': title, html: label });
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    b.addEventListener('click', function () { fn(b); });
    return b;
  }
  function G() { var g = el('span', { class: 'swpe-tg' }); Array.prototype.slice.call(arguments).forEach(function (x) { g.appendChild(x); }); tb.appendChild(g); }
  G(B('↶', 'Geri al', function () { run('undo'); }), B('↷', 'Yinele', function () { run('redo'); }));
  if (!inline) G(
    B('¶', 'Paragraf', function () { run('formatBlock', '<p>'); }),
    B('H2', 'Başlık 2', function () { run('formatBlock', '<h2>'); }),
    B('H3', 'Başlık 3', function () { run('formatBlock', '<h3>'); }),
    B('❝', 'Alıntı', function () { run('formatBlock', '<blockquote>'); }));
  G(B('<b>B</b>', 'Kalın', function () { run('bold'); }), B('<i>I</i>', 'İtalik', function () { run('italic'); }),
    B('<u>U</u>', 'Altı çizili', function () { run('underline'); }), B('<s>S</s>', 'Üstü çizili', function () { run('strikeThrough'); }),
    B('A<span class="swpe-cbar"></span>', 'Yazı rengi', function () { saveSel(); palette.style.display = palette.style.display === 'none' ? 'flex' : 'none'; }));
  if (!inline) G(
    B('•', 'Madde listesi', function () { run('insertUnorderedList'); }), B('1.', 'Numaralı liste', function () { run('insertOrderedList'); }),
    B('⇤', 'Sola yasla', function () { run('justifyLeft'); }), B('≡', 'Ortala', function () { run('justifyCenter'); }),
    B('⇥', 'Sağa yasla', function () { run('justifyRight'); }), B('☰', 'İki yana yasla', function () { run('justifyFull'); }));
  G(B('🔗', 'Bağlantı ekle', async function () {
      saveSel();
      var u = await askText('Bağlantı adresi', 'https://', 'https://… veya sayfa.html');
      if (!u) return;
      if (!/^(https?:|mailto:|#|\/|[\w.\-\/]+\.html)/i.test(u)) { toast('Geçersiz bağlantı', 'err'); return; }
      run('createLink', u);
    }), B('⛓̸', 'Bağlantıyı kaldır', function () { run('unlink'); }));
  if (!inline) G(B('―', 'Ayraç çizgisi', function () { run('insertHorizontalRule'); }),
    B('🖼', 'Görsel ekle', async function () {
      saveSel();
      var p = await pickImage({ folder: o.folder || '' });
      if (p) { restoreSel(); document.execCommand('insertHTML', false, '<img src="' + PURE.escAttr(p) + '" alt="" style="max-width:100%">'); saveSel(); changed(); }
    }));
  G(B('Tx', 'Biçimi temizle', function () { run('removeFormat'); }),
    B('&lt;/&gt;', 'HTML kaynağı', function (b) {
      srcMode = !srcMode;
      b.classList.toggle('on', srcMode);
      if (srcMode) { src.value = san(area.innerHTML); src.style.display = ''; area.style.display = 'none'; }
      else { area.innerHTML = san(src.value); src.style.display = 'none'; area.style.display = ''; changed(); }
    }));
  tb.appendChild(palette);

  area.addEventListener('input', changed);
  src.addEventListener('input', changed);
  ['mouseup', 'keyup', 'blur'].forEach(function (ev) { area.addEventListener(ev, saveSel); });
  area.addEventListener('paste', function (e) {                       /* Word/web artıklarını temizle */
    e.preventDefault();
    var cd = e.clipboardData || window.clipboardData, h = cd.getData('text/html'), t = cd.getData('text/plain');
    if (h && !inline) document.execCommand('insertHTML', false, san(h.replace(/<\/?(html|body|meta|style)[^>]*>/gi, '')));
    else document.execCommand('insertText', false, t);
  });
  if (inline) area.addEventListener('keydown', function (e) {           /* satır içi alanda Enter = satır sonu */
    if (e.key === 'Enter') { e.preventDefault(); document.execCommand('insertLineBreak'); }
  });
  wrap.appendChild(tb); wrap.appendChild(area); wrap.appendChild(src);
  return {
    el: wrap, value: value,
    setValue: function (v) { var h = san(toEditable(v, o)); area.innerHTML = h; src.value = h; },
    focus: function () { area.focus(); }
  };
}

/* ═══════════════════════════════════════════════════════════════
   5. ALAN BİLEŞENLERİ
   ═══════════════════════════════════════════════════════════════ */
/* TR/EN sekmeli çift dilli alan.
   o: { label, sub, init:{tr,en}, orig:{tr,en}, rich, inline, raw, folder, rows, onChange(lang,val) }  → { el, reset } */
function biField(o) {
  var card = el('div', { class: 'swpe-field' });
  var tabs = el('div', { class: 'swpe-langs' }), eds = {}, wraps = {}, active = curLang() === 'en' ? 'en' : 'tr';
  var dot = el('i', { class: 'swpe-dot', title: 'Değiştirildi' });
  card.appendChild(el('div', { class: 'swpe-field-h' }, [
    el('div', { class: 'swpe-field-t' }, [el('b', { text: o.label }), o.sub ? el('small', { text: o.sub }) : null]), dot, tabs
  ]));
  var cur = { tr: o.init.tr == null ? '' : o.init.tr, en: o.init.en == null ? '' : o.init.en };
  function mark() { card.classList.toggle('changed', cur.tr !== (o.orig.tr || '') || cur.en !== (o.orig.en || '')); }
  ['tr', 'en'].forEach(function (l) {
    var ed;
    function emit(v) { cur[l] = v; o.onChange(l, v); mark(); }
    if (o.rich) ed = createRTE({ html: cur[l], inline: o.inline, raw: o.raw, folder: o.folder, onInput: emit });
    else {
      var ta = el('textarea', { class: 'swpe-input swpe-ta', rows: o.rows || 2, spellcheck: 'true' });
      ta.value = cur[l];
      ta.addEventListener('input', function () { emit(ta.value); });
      ed = { el: ta, setValue: function (v) { ta.value = v == null ? '' : v; } };
    }
    eds[l] = ed;
    wraps[l] = el('div', { class: 'swpe-lang-pane' }, [ed.el]);
    card.appendChild(wraps[l]);
    var tbtn = el('button', { type: 'button', class: 'swpe-lt', text: l.toUpperCase(), onclick: function () { show(l); } });
    tabs.appendChild(tbtn);
  });
  function show(l) {
    active = l;
    ['tr', 'en'].forEach(function (x, i) { wraps[x].style.display = x === l ? '' : 'none'; tabs.children[i].classList.toggle('on', x === l); });
  }
  show(active); mark();
  return {
    el: card,
    reset: function (lang) {
      (lang ? [lang] : ['tr', 'en']).forEach(function (l) { eds[l].setValue(o.orig[l] || ''); cur[l] = o.orig[l] || ''; o.onChange(l, o.orig[l] || ''); });
      mark();
    }
  };
}
function strField(o) {                          /* tek satır metin / onay kutusu */
  var card = el('div', { class: 'swpe-field slim' });
  var inp;
  if (o.bool) {
    inp = el('input', { type: 'checkbox' }); inp.checked = !!o.init;
    card.appendChild(el('label', { class: 'swpe-check' }, [inp, el('span', { text: o.label })]));
    inp.addEventListener('change', function () { o.onChange(inp.checked); card.classList.toggle('changed', inp.checked !== !!o.orig); });
  } else {
    inp = el('input', { class: 'swpe-input', type: 'text', value: o.init == null ? '' : o.init });
    card.appendChild(el('label', { class: 'swpe-lbl', text: o.label }));
    card.appendChild(inp);
    inp.addEventListener('input', function () { o.onChange(inp.value); card.classList.toggle('changed', inp.value !== (o.orig == null ? '' : o.orig)); });
  }
  card.classList.toggle('changed', o.bool ? !!o.init !== !!o.orig : (o.init == null ? '' : o.init) !== (o.orig == null ? '' : o.orig));
  return { el: card, reset: function () { if (o.bool) inp.checked = !!o.orig; else inp.value = o.orig == null ? '' : o.orig; o.onChange(o.bool ? !!o.orig : (o.orig == null ? '' : o.orig)); card.classList.remove('changed'); } };
}
function imgField(o) {                          /* görsel alanı: önizleme + yol + kütüphane */
  var card = el('div', { class: 'swpe-field img' });
  var cur = o.init == null ? '' : o.init;
  var th = el('img', { class: 'swpe-thumb', alt: '' });
  var inp = el('input', { class: 'swpe-input', type: 'text', value: cur, placeholder: 'assets/images/…' });
  function paint() { th.src = thumbUrl(cur) || ''; th.style.visibility = cur ? '' : 'hidden'; card.classList.toggle('changed', cur !== (o.orig || '')); }
  function set(v) { cur = v; inp.value = v; paint(); o.onChange(v); }
  inp.addEventListener('change', function () { set(inp.value.trim()); });
  var pick = el('button', { type: 'button', class: 'swpe-btn', text: '🖼 Kütüphane / Yükle', onclick: async function () {
    var p = await pickImage({ folder: o.folder }); if (p) set(p);
  } });
  card.appendChild(el('div', { class: 'swpe-field-h' }, [el('div', { class: 'swpe-field-t' }, [el('b', { text: o.label }), o.sub ? el('small', { text: o.sub }) : null])]));
  var row = el('div', { class: 'swpe-imgrow' }, [th, el('div', { class: 'swpe-imgctl' }, [inp, el('div', { class: 'swpe-imgbtns' }, [pick])])]);
  if (o.alt) { row.lastChild.insertBefore(o.alt.el, row.lastChild.lastChild); }
  card.appendChild(row);
  th.addEventListener('error', function () { th.style.opacity = '.3'; }); th.addEventListener('load', function () { th.style.opacity = ''; });
  paint();
  return { el: card, reset: function () { set(o.orig || ''); } };
}

/* ═══════════════════════════════════════════════════════════════
   6. VERİ KAYNAKLARI: bu sayfanın düzenlenebilir içeriği
   ═══════════════════════════════════════════════════════════════ */
/* Kalıcı adres türü → düzenlenecek veri kayıtları */
var ENTITY = {
  karakter: [{ file: 'characters.json', arr: 'characters', label: 'Karakter' }],
  devlet:   [{ file: 'kingdoms.json', arr: 'kingdoms', label: 'Devlet' }],
  hane:     [{ file: 'houses.json', arr: 'houses', label: 'Hane' }],
  tanri:    [{ file: 'lore.json', arr: 'gods', label: 'Tanrı' }],
  olay:     [{ file: 'lore.json', arr: 'events', label: 'Olay' }],
  bolum:    [{ file: 'chapters.json', arr: 'chapters', label: 'Bölüm' }, { file: 'book.json', base: ['chapters', '{id}'], label: 'Bölüm metni' }]
};
var IMG_FOLDER = { karakter: 'characters', devlet: 'kingdoms', hane: 'banners', tanri: 'gods', olay: 'banners', bolum: 'chapters' };
var PAGE_TYPE = { 'karakter-sablon.html': 'karakter', 'krallik-detay.html': 'devlet', 'hane-detay.html': 'hane', 'tanri-detay.html': 'tanri', 'oku.html': 'bolum', 'olay-detay.html': 'olay' };
var SKIP = { id: 1, order: 1, color: 1, colors: 1, accent: 1, mapId: 1, houseId: 1, memberIds: 1, rulerId: 1, group: 1, status: 1, type: 1, tier: 1,
  theme: 1, edgeMode: 1, canvas: 1, decor: 1, x: 1, y: 1, w: 1, h: 1, tags: 1, linkedData: 1, path: 1, category: 1 };
var RICH_KEYS = { quote: 1, bio: 1, desc: 1, description: 1, origin: 1, synopsis: 1, def: 1, role: 1, psychology: 1, ritual: 1, flag: 1,
  text: 1, history: 1, etymology: 1, meaning: 1, strengths: 1, weaknesses: 1, relations: 1, economy: 1, flagDesc: 1, motto: 1, caption: 1 };
var LBL = { name: 'Ad', title: 'Unvan', bio: 'Biyografi', quote: 'Söz', desc: 'Açıklama', description: 'Açıklama', origin: 'Köken', house: 'Hane',
  birth: 'Doğum yeri', alleg: 'Bağlılık', weapon: 'Silah', epi: 'Lakap', role: 'Rol', psychology: 'Psikoloji', ritual: 'Ritüel', epithet: 'Lakap',
  trueName: 'Gerçek ad', etymology: 'Etimoloji', symbol: 'Sembol', motto: 'Slogan', meaning: 'Anlamı', capital: 'Başkent', ruler: 'Hükümdar',
  rulerTitle: 'Hükümdar unvanı', government: 'Yönetim', religion: 'Din', history: 'Tarih', image: 'Görsel', flagImage: 'Bayrak görseli',
  banner: 'Afiş', bannerImage: 'Afiş görseli', logo: 'Logo', logoImage: 'Logo görseli', flag: 'Bayrak', text: 'Metin', synopsis: 'Özet',
  firstLine: 'İlk cümle', eyebrow: 'Üst başlık', author: 'Yazar', hero: 'Kahraman alanı', announcement: 'Duyuru', active: 'Etkin', badge: 'Rozet',
  link: 'Bağlantı', founded: 'Kuruluş', population: 'Nüfus', area: 'Yüzölçümü', currency: 'Para birimi', strengths: 'Güçlü yönler',
  weaknesses: 'Zayıf yönler', relations: 'İlişkiler', garrison: 'Garnizon', exports: 'İhracat', economy: 'Ekonomi', flagDesc: 'Bayrak tarifi',
  faction: 'Hizip', pov: 'Bakış açısı', ks: 'Takvim (KS)', ally: 'Müttefik' };
var INLINE = { h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1, a: 1, button: 1, span: 1, small: 1, label: 1, th: 1, td: 1, li: 1, figcaption: 1, cite: 1,
  strong: 1, em: 1, b: 1, i: 1, summary: 1, dt: 1, dd: 1 };
var TAGNAME = { h1: 'Ana başlık', h2: 'Başlık', h3: 'Alt başlık', h4: 'Alt başlık', p: 'Paragraf', li: 'Liste öğesi', a: 'Bağlantı / düğme',
  button: 'Düğme', blockquote: 'Alıntı', span: 'Metin', div: 'Metin bloğu', td: 'Tablo hücresi', th: 'Tablo başlığı', small: 'Alt yazı',
  figcaption: 'Görsel yazısı', label: 'Etiket', summary: 'Açılır başlık' };

function currentFile() {
  var p = location.pathname.split('/').pop();
  if (!p) return 'index.html';
  return /\.[a-z0-9]+$/i.test(p) ? p : p + '.html';
}
function parseRoute() {
  var m = /^#\/([^\/?]+)\/([^\/?]+)/.exec(location.hash || ''), type = null, id = null;
  if (m) { try { type = decodeURIComponent(m[1]); id = decodeURIComponent(m[2]); } catch (e) { type = m[1]; id = m[2]; } }
  if (!type && PAGE_TYPE[currentFile()]) {
    var q = new URLSearchParams(location.search);
    type = PAGE_TYPE[currentFile()]; id = q.get('id') || q.get('b');
  }
  return { type: type, id: id };
}
function labelFor(path) {
  return path.map(function (p) { return typeof p === 'number' ? '#' + (p + 1) : (LBL[p] || p); }).join(' › ');
}
function isBi(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  var k = Object.keys(v);
  return k.length > 0 && k.every(function (x) { return (x === 'tr' || x === 'en') && typeof v[x] === 'string'; });
}
function isImgField(key, v) { return /(image|img|banner|logo|portrait|avatar|cover|icon)/i.test(key || '') || IMG_RE.test(v); }
function collectFields(obj, skip, base, out, depth) {
  base = base || []; out = out || []; depth = depth || 0;
  if (out.length >= 160 || depth > 5 || obj == null || typeof obj !== 'object') return out;
  var isArr = Array.isArray(obj), keys = isArr ? obj.map(function (_, i) { return i; }) : Object.keys(obj);
  keys.forEach(function (k) {
    if (out.length >= 160) return;
    var v = obj[k], path = base.concat([k]), key = isArr ? null : k;
    if (key && skip[key]) return;
    if (isBi(v)) {
      var s = (v.tr || '') + (v.en || '');
      out.push({ path: path, kind: 'bi', value: v, rich: !!(RICH_KEYS[key] || s.length > 280 || /\n|<[a-z]/i.test(s)) });
    } else if (typeof v === 'string') {
      if (isArr) return;                                                /* kimlik dizileri (allies, chapters…) */
      out.push({ path: path, kind: isImgField(key, v) ? 'img' : 'str', value: v });
    } else if (typeof v === 'boolean') {
      if (!isArr) out.push({ path: path, kind: 'bool', value: v });
    } else if (v && typeof v === 'object') collectFields(v, skip, path, out, depth + 1);
  });
  return out;
}
async function loadJsonSource(file, spec, title, folder, order, skip) {
  try {
    var r = await readFile('data/' + file), data = JSON.parse(r.text);
    var ent = PURE.findEntityParsed(data, spec);
    if (!ent) { S.notes.push(title + ': kayıt data/' + file + ' içinde bulunamadı.'); return; }
    S.sources.push({ file: file, spec: spec, title: title, data: ent, folder: folder, skip: skip || {}, order: order });
  } catch (e) { S.notes.push('data/' + file + ': ' + e.message); }
}
async function loadPagesSource() {
  try {
    var r = await readFile('data/pages.json'), d = JSON.parse(r.text), pg = d.pages || {};
    var k = Object.keys(pg).filter(function (x) { return pg[x].path === S.pageFile; })[0];
    if (!k) return;
    S.sources.push({ file: 'pages.json', spec: { base: ['pages', k] }, title: 'Sayfa kaydı · ' + (pg[k].name || k), data: pg[k], folder: 'banners', order: 9,
      skip: { id: 1, name: 1, category: 1, path: 1, linkedData: 1 } });
  } catch (e) { S.notes.push('data/pages.json: ' + e.message); }
}
function okEl(e) { return !e.closest('nav,footer,[data-pe-skip],#swpe-root,script,style,[data-community],.sw-comments,#site-nav,#site-footer'); }
function okBlock(e) {
  if (!okEl(e) || !e.hasAttribute('data-en')) return false;
  var a = e.getAttribute('data-i18n-attr');
  if (a && a !== 'html') return false;
  var par = e.parentElement; if (par && par.closest('[data-tr]')) return false;
  return true;
}
function analyzeStatic(src) {
  var doc = new DOMParser().parseFromString(src, 'text/html');
  var all = $$('[data-tr]', doc), cand = [];
  all.forEach(function (e, i) { if (okBlock(e)) cand.push({ e: e, i: i }); });
  var p = 0;
  $$('[data-tr]').filter(okBlock).forEach(function (le) {
    for (var j = p; j < cand.length; j++) {
      if (cand[j].e.getAttribute('data-tr') === le.getAttribute('data-tr') && (cand[j].e.getAttribute('data-en') || '') === (le.getAttribute('data-en') || '')) {
        var tag = le.tagName.toLowerCase();
        S.blocks.push({ el: le, tagIndex: cand[j].i, tag: tag, tr: le.getAttribute('data-tr'), en: le.getAttribute('data-en') || '',
          mode: le.getAttribute('data-i18n-attr') === 'html' ? 'html' : 'text', label: TAGNAME[tag] || 'Metin' });
        p = j + 1; break;
      }
    }
  });
  var simgs = $$('img', doc), scand = [];
  simgs.forEach(function (e, i) { if (okEl(e)) scand.push({ e: e, i: i }); });
  var q = 0;
  $$('img').filter(function (im) { return okEl(im) && im.getAttribute('src') && !(im.naturalWidth && im.naturalWidth < 40); }).forEach(function (im) {
    var st = PURE.imgStem(im.getAttribute('src'));
    for (var j = q; j < scand.length; j++) {
      var ss = scand[j].e.getAttribute('src') || scand[j].e.getAttribute('data-src') || '';
      if (PURE.imgStem(ss) === st) {
        S.imgs.push({ el: im, tagIndex: j === undefined ? 0 : scand[j].i, src: ss, alt: im.getAttribute('alt') || '', srcset: im.getAttribute('srcset'), liveSrc: im.getAttribute('src') });
        q = j + 1; break;
      }
    }
  });
}
async function loadSources() {
  S.sources = []; S.blocks = []; S.imgs = []; S.notes = []; S.pageSrc = null;
  S.route = parseRoute(); S.pageFile = currentFile();
  var r = S.route, jobs = [], defs = (r.type && r.id && ENTITY[r.type]) || [];
  defs.forEach(function (d, n) {
    var spec = d.base ? { base: d.base.map(function (x) { return x === '{id}' ? r.id : x; }) } : { arr: d.arr, id: r.id };
    jobs.push(loadJsonSource(d.file, spec, d.label + ' · ' + r.id, IMG_FOLDER[r.type] || '', n));
  });
  jobs.push(loadPagesSource());
  jobs.push(readFile(S.pageFile).then(function (f) { S.pageSrc = f.text; analyzeStatic(f.text); })
    .catch(function (e) { S.notes.push(S.pageFile + ': ' + e.message); }));
  await Promise.all(jobs);
  S.sources.sort(function (a, b) { return a.order - b.order; });
}

/* ═══════════════════════════════════════════════════════════════
   7. DEĞİŞİKLİK TAKİBİ + SEKME GÖRÜNÜMLERİ
   ═══════════════════════════════════════════════════════════════ */
function setChange(key, ch) { if (ch) S.changes[key] = ch; else delete S.changes[key]; refreshChrome(); }
function empty(t) { return el('div', { class: 'swpe-empty', text: t }); }
function jsonChange(src, f, key, label, orig, value, path) {
  if (value === orig || (orig === undefined && value === '')) return setChange(key, null);
  setChange(key, { kind: 'json', file: src.file, spec: src.spec, path: path, orig: orig, value: value, label: label, group: src.title });
}
function renderJsonField(src, f) {
  var base = 'j|' + src.file + '|' + JSON.stringify(src.spec) + '|' + JSON.stringify(f.path), label = labelFor(f.path), w;
  if (f.kind === 'bi') {
    var cv = function (l) { var c = S.changes[base + '|' + l]; return c ? c.value : (f.value[l] == null ? '' : f.value[l]); };
    w = biField({ label: label, init: { tr: cv('tr'), en: cv('en') }, orig: { tr: f.value.tr || '', en: f.value.en || '' }, rich: f.rich, folder: src.folder, rows: f.rich ? 4 : 2,
      onChange: function (l, val) { jsonChange(src, f, base + '|' + l, label + ' (' + l.toUpperCase() + ')', f.value[l], val, f.path.concat([l])); } });
    S.resets[base + '|tr'] = function () { w.reset('tr'); };
    S.resets[base + '|en'] = function () { w.reset('en'); };
    return w;
  }
  var c = S.changes[base], init = c ? c.value : f.value;
  function onC(v) { jsonChange(src, f, base, label, f.value, v, f.path); }
  if (f.kind === 'img') w = imgField({ label: label, sub: f.path.join('.'), init: init, orig: f.value, folder: src.folder, onChange: onC });
  else w = strField({ label: label, bool: f.kind === 'bool', init: init, orig: f.value, onChange: onC });
  S.resets[base] = w.reset;
  return w;
}
function buildSource(src) {
  var sec = el('section', { class: 'swpe-sec' });
  sec.appendChild(el('div', { class: 'swpe-sec-h' }, [el('h3', { text: src.title }), el('code', { text: 'data/' + src.file })]));
  var fields = collectFields(src.data, Object.assign({}, SKIP, src.skip));
  if (!fields.length) sec.appendChild(empty('Bu kayıtta düzenlenebilir alan yok.'));
  fields.forEach(function (f) { var w = renderJsonField(src, f); if (w) sec.appendChild(w.el); });
  return sec;
}
function previewBlock(b, st) {
  b.el.setAttribute('data-tr', st.tr); b.el.setAttribute('data-en', st.en);
  var v = curLang() === 'en' ? st.en : st.tr;
  if (b.mode === 'html') b.el.innerHTML = san(v); else b.el.textContent = v;
}
function buildBlocks() {
  var v = el('div', { class: 'swpe-view' });
  v.appendChild(el('p', { class: 'swpe-note', text: 'Sayfanın HTML dosyasındaki (sabit) metinler. Değişiklikler anında sayfada önizlenir. Karakter/hane/devlet gibi veriden gelen metinler “İçerik” sekmesindedir.' }));
  if (!S.blocks.length) v.appendChild(empty(S.pageSrc == null ? 'Sayfa kaynağı depodan okunamadı.' : 'Bu sayfada düzenlenebilir sabit metin yok.'));
  S.blocks.forEach(function (b) {
    var key = 'b|' + b.tagIndex, c = S.changes[key], st = { tr: c ? c.tr : b.tr, en: c ? c.en : b.en };
    var w = biField({ label: b.label, sub: short(b.tr, 80), init: st, orig: { tr: b.tr, en: b.en }, rich: b.mode === 'html', raw: true, inline: !!INLINE[b.tag], rows: 2,
      onChange: function (l, val) {
        st[l] = val;
        if (st.tr === b.tr && st.en === b.en) setChange(key, null);
        else setChange(key, { kind: 'bi', tagIndex: b.tagIndex, origTr: b.tr, origEn: b.en, tr: st.tr, en: st.en, mode: b.mode, label: b.label + ': ' + short(b.tr, 42), group: S.pageFile });
        previewBlock(b, st);
      } });
    S.resets[key] = function () { w.reset(); };
    v.appendChild(w.el);
  });
  return v;
}
function buildImages() {
  var v = el('div', { class: 'swpe-view' });
  v.appendChild(el('div', { class: 'swpe-toolrow' }, [
    el('button', { type: 'button', class: 'swpe-btn', text: '🖼 Görsel kütüphanesi / yeni görsel yükle', onclick: function () { pickImage({ pickable: false, folder: IMG_FOLDER[(S.route || {}).type] || '' }); } })
  ]));
  v.appendChild(el('p', { class: 'swpe-note', text: 'Sayfanın HTML’indeki sabit görseller. Veri kayıtlarına bağlı görseller (karakter portresi, bayrak vb.) “İçerik” sekmesindedir.' }));
  if (!S.imgs.length) v.appendChild(empty('Bu sayfada düzenlenebilir sabit görsel bulunamadı.'));
  S.imgs.forEach(function (im, n) {
    var key = 'i|' + im.tagIndex, c = S.changes[key], st = { src: c ? c.src : im.src, alt: c ? (c.alt != null ? c.alt : im.alt) : im.alt };
    function emit() {
      if (st.src === im.src && st.alt === im.alt) setChange(key, null);
      else setChange(key, { kind: 'img', tagIndex: im.tagIndex, origSrc: im.src, src: st.src, alt: st.alt !== im.alt ? st.alt : null, label: 'Görsel: ' + im.src.split('/').pop(), group: S.pageFile });
      im.el.removeAttribute('srcset');
      if (st.src === im.src) { im.el.setAttribute('src', im.liveSrc); if (im.srcset) im.el.setAttribute('srcset', im.srcset); }
      else im.el.setAttribute('src', S.uploads[st.src] ? S.uploads[st.src].url : st.src);
      im.el.setAttribute('alt', st.alt);
    }
    var altF = strField({ label: 'Alt metin (erişilebilirlik)', init: st.alt, orig: im.alt, onChange: function (val) { st.alt = val; emit(); } });
    var w = imgField({ label: 'Görsel ' + (n + 1), sub: im.src, init: st.src, orig: im.src, folder: IMG_FOLDER[(S.route || {}).type] || '', alt: altF, onChange: function (val) { st.src = val; emit(); } });
    S.resets[key] = function () { altF.reset(); w.reset(); };
    v.appendChild(w.el);
  });
  return v;
}
function buildContent() {
  var v = el('div', { class: 'swpe-view' });
  if (S.route && S.route.type && S.route.id) v.appendChild(el('p', { class: 'swpe-note', text: 'Bu sayfada gösterilen kayıt: ' + S.route.type + ' / ' + S.route.id }));
  S.notes.forEach(function (n) { v.appendChild(el('p', { class: 'swpe-warn', text: '⚠ ' + n })); });
  if (!S.sources.length) v.appendChild(empty('Bu sayfa için düzenlenebilir bir veri kaydı yok. Sabit metinler için “Sayfa metinleri” sekmesine bakın.'));
  S.sources.forEach(function (src) { v.appendChild(buildSource(src)); });
  return v;
}
function buildViews() {
  S.views = { content: buildContent(), blocks: buildBlocks(), images: buildImages(), changes: el('div', { class: 'swpe-view' }) };
}
function renderChanges() {
  var v = S.views.changes; v.innerHTML = '';
  if (S.last) {
    v.appendChild(el('div', { class: 'swpe-okbox' }, [
      el('b', { text: '✓ Yayınlandı' }),
      el('p', { html: 'Commit <a href="' + esc(S.last.url) + '" target="_blank" rel="noopener">' + esc(S.last.sha.slice(0, 7)) + '</a> depoya gönderildi. GitHub Pages’in siteyi yeniden oluşturması genellikle 1–2 dakika sürer.' }),
      el('button', { type: 'button', class: 'swpe-btn', text: '↻ Sayfayı yenile', onclick: function () { location.reload(); } })
    ]));
  }
  var keys = Object.keys(S.changes), ups = Object.keys(S.uploads);
  if (!keys.length && !ups.length) { v.appendChild(empty('Bekleyen değişiklik yok.')); return; }
  var groups = {};
  keys.forEach(function (k) { var c = S.changes[k]; (groups[c.group] = groups[c.group] || []).push(k); });
  Object.keys(groups).forEach(function (g) {
    v.appendChild(el('h4', { class: 'swpe-gh', text: g }));
    groups[g].forEach(function (k) {
      var c = S.changes[k];
      var before = c.kind === 'json' ? c.orig : c.kind === 'bi' ? c.origTr : c.origSrc;
      var after = c.kind === 'json' ? c.value : c.kind === 'bi' ? c.tr : c.src;
      v.appendChild(el('div', { class: 'swpe-chg' }, [
        el('div', { class: 'swpe-chg-t' }, [el('b', { text: c.label }),
          el('button', { type: 'button', class: 'swpe-btn sm', text: 'Geri al', onclick: function () { if (S.resets[k]) S.resets[k](); else setChange(k, null); renderChanges(); } })]),
        el('div', { class: 'swpe-diff' }, [el('del', { text: short(String(before == null ? '' : before), 120) || '∅' }), el('ins', { text: short(String(after == null ? '' : after), 120) || '∅' })])
      ]));
    });
  });
  if (ups.length) {
    v.appendChild(el('h4', { class: 'swpe-gh', text: 'Yüklenecek görseller' }));
    ups.forEach(function (p) {
      v.appendChild(el('div', { class: 'swpe-chg up' }, [
        el('img', { src: S.uploads[p].url, alt: '' }),
        el('div', {}, [el('b', { text: p }), el('small', { text: Math.round(S.uploads[p].size / 1024) + ' KB' })]),
        el('button', { type: 'button', class: 'swpe-btn sm', text: 'Kaldır', onclick: function () { URL.revokeObjectURL(S.uploads[p].url); delete S.uploads[p]; refreshChrome(); renderChanges(); } })
      ]));
    });
  }
  var hasJson = keys.some(function (k) { return S.changes[k].kind === 'json'; });
  var msg = el('textarea', { class: 'swpe-input swpe-ta', rows: 2, placeholder: defaultMsg() });
  msg.value = S.msg; msg.addEventListener('input', function () { S.msg = msg.value; });
  v.appendChild(el('label', { class: 'swpe-lbl', text: 'Commit mesajı' })); v.appendChild(msg);
  if (hasJson) {
    var cb = el('input', { type: 'checkbox' }); cb.checked = S.bump; cb.addEventListener('change', function () { S.bump = cb.checked; });
    v.appendChild(el('label', { class: 'swpe-check' }, [cb, el('span', { text: 'Veri önbellek numarasını artır (config.js → dataVersion) — ziyaretçiler yeni veriyi hemen görsün' })]));
  }
  v.appendChild(el('button', { type: 'button', class: 'swpe-btn danger', text: 'Tümünü geri al', onclick: async function () {
    if (!(await confirmBox('Bekleyen tüm değişiklikler geri alınsın mı?', 'Geri al'))) return;
    Object.keys(S.changes).forEach(function (k) { if (S.resets[k]) S.resets[k](); });
    S.changes = {}; Object.keys(S.uploads).forEach(function (p) { URL.revokeObjectURL(S.uploads[p].url); }); S.uploads = {};
    refreshChrome(); renderChanges();
  } }));
}
function defaultMsg() { return 'İçerik güncellendi: ' + (S.pageFile || currentFile()) + ' — ' + nChanges() + ' alan (Sayfa Editörü)'; }

/* ═══════════════════════════════════════════════════════════════
   8. KAYDET → GitHub'a TEK commit
   ═══════════════════════════════════════════════════════════════ */
function applyChange(text, ch) {
  if (ch.kind === 'json') {
    var cur = PURE.jsonGet(text, ch.spec, ch.path);
    if (cur !== ch.orig && !(cur === undefined && (ch.orig === undefined || ch.orig === ''))) throw new Error('alan depoda bu arada başka biri tarafından değiştirilmiş');
    return PURE.jsonSet(text, ch.spec, ch.path, ch.value);
  }
  if (ch.kind === 'bi') return PURE.patchBilingual(text, ch);
  if (ch.kind === 'img') return PURE.patchImage(text, ch);
  throw new Error('bilinmeyen değişiklik türü');
}
function setStatus(t, kind) { if (S.ui && S.ui.status) { S.ui.status.textContent = t || ''; S.ui.status.className = 'swpe-status ' + (kind || ''); } }
function setBusy(b) { S.busy = b; if (S.ui) { S.ui.panel.classList.toggle('busy', b); refreshChrome(); } }
async function doSave() {
  if (S.busy || !dirty()) return;
  if (!getToken()) { openSettings({ then: doSave }); return; }
  setBusy(true); S.last = null;
  try {
    setStatus('Depodaki güncel dosyalar okunuyor…');
    var byFile = {}, files = [], errs = [];
    Object.keys(S.changes).forEach(function (k) {
      var ch = S.changes[k], path = ch.kind === 'json' ? 'data/' + ch.file : S.pageFile;
      (byFile[path] = byFile[path] || []).push(ch);
    });
    var paths = Object.keys(byFile);
    for (var i = 0; i < paths.length; i++) {
      var cur = await readFile(paths[i]), text = cur.text;
      byFile[paths[i]].forEach(function (ch) {
        try { text = applyChange(text, ch); } catch (e) { errs.push(ch.label + ' → ' + e.message); }
      });
      files.push({ path: paths[i], text: text });
    }
    if (errs.length) throw new Error('Şu değişiklikler uygulanamadı, hiçbir şey gönderilmedi:\n• ' + errs.join('\n• '));
    var hasJson = Object.keys(S.changes).some(function (k) { return S.changes[k].kind === 'json'; });
    if (hasJson && S.bump) {
      try {
        var cf = await readFile('assets/js/config.js'), nt = PURE.bumpDataVersion(cf.text, Date.now().toString(36));
        if (nt) files.push({ path: 'assets/js/config.js', text: nt });
      } catch (e) { toast('dataVersion güncellenemedi: ' + e.message, 'err'); }
    }
    Object.keys(S.uploads).forEach(function (p) { files.push({ path: p, b64: S.uploads[p].b64 }); });
    var msg = (S.msg || '').trim() || defaultMsg();
    var nc = await commitFiles(files, msg);
    S.last = { sha: nc.sha, url: 'https://github.com/' + S.cfg.owner + '/' + S.cfg.repo + '/commit/' + nc.sha };
    S.changes = {}; Object.keys(S.uploads).forEach(function (p) { URL.revokeObjectURL(S.uploads[p].url); }); S.uploads = {}; S.msg = ''; S.tree = null;
    setStatus('Yayınlandı ✓', 'ok'); toast('Değişiklikler GitHub’a gönderildi', 'ok');
    await loadSources(); buildViews(); showTab('changes');
  } catch (e) {
    setStatus('Kaydedilemedi', 'err'); toast(e.message, 'err');
    if (/\n/.test(e.message)) { var m = modal({ title: 'Kaydedilemedi', actions: [{ label: 'Tamam', primary: true, onClick: function (a) { a.close(); } }] }); m.body.appendChild(el('pre', { class: 'swpe-pre', text: e.message })); }
  } finally { setBusy(false); refreshChrome(); }
}

/* ═══════════════════════════════════════════════════════════════
   9. PANEL + AYARLAR + DÜĞME
   ═══════════════════════════════════════════════════════════════ */
var TABS = [['content', 'İçerik'], ['blocks', 'Sayfa metinleri'], ['images', 'Görseller'], ['changes', 'Değişiklikler']];
function buildPanel() {
  var ui = S.ui = {};
  ui.panel = el('aside', { class: 'swpe-panel', role: 'dialog', 'aria-label': 'Sayfa editörü' });
  ui.sub = el('small', { text: '' });
  ui.panel.appendChild(el('div', { class: 'swpe-ph' }, [
    el('div', { class: 'swpe-pt' }, [el('h2', { text: 'Sayfayı Düzenle' }), ui.sub]),
    el('button', { type: 'button', class: 'swpe-ib', title: 'GitHub ayarları', 'aria-label': 'Ayarlar', text: '⚙', onclick: function () { openSettings({}); } }),
    el('button', { type: 'button', class: 'swpe-ib', title: 'Kapat (Esc)', 'aria-label': 'Kapat', text: '×', onclick: closePanel })
  ]));
  ui.tabs = {};
  var nav = el('nav', { class: 'swpe-tabs' });
  TABS.forEach(function (t) {
    var b = el('button', { type: 'button', class: 'swpe-tab', onclick: function () { showTab(t[0]); } }, [el('span', { text: t[1] }), el('em', { text: '' })]);
    ui.tabs[t[0]] = b; nav.appendChild(b);
  });
  ui.panel.appendChild(nav);
  ui.body = el('div', { class: 'swpe-pbody' });
  ui.panel.appendChild(ui.body);
  ui.status = el('span', { class: 'swpe-status' });
  ui.save = el('button', { type: 'button', class: 'swpe-btn primary', text: 'Kaydet ve Yayınla', onclick: doSave });
  ui.panel.appendChild(el('div', { class: 'swpe-pf' }, [ui.status, el('button', { type: 'button', class: 'swpe-btn', text: 'Kapat', onclick: closePanel }), ui.save]));
  root().appendChild(ui.panel);
}
function showTab(t) {
  S.tab = t;
  if (t === 'changes') renderChanges();
  S.ui.body.innerHTML = '';
  S.ui.body.appendChild(S.views[t]);
  S.ui.body.scrollTop = 0;
  Object.keys(S.ui.tabs).forEach(function (k) { S.ui.tabs[k].classList.toggle('on', k === t); });
}
function refreshChrome() {
  var n = nChanges() + Object.keys(S.uploads).length;
  var fab = $('#swpe-fab');
  if (fab) { fab.classList.toggle('dirty', n > 0); fab.setAttribute('data-n', n || ''); }
  if (!S.ui) return;
  var cnt = { content: 0, blocks: 0, images: 0, changes: n };
  Object.keys(S.changes).forEach(function (k) { var c = S.changes[k]; cnt[c.kind === 'json' ? 'content' : c.kind === 'bi' ? 'blocks' : 'images']++; });
  Object.keys(S.ui.tabs).forEach(function (k) { var e = $('em', S.ui.tabs[k]); e.textContent = cnt[k] || ''; });
  S.ui.save.disabled = S.busy || n === 0;
  S.ui.save.textContent = S.busy ? 'Gönderiliyor…' : 'Kaydet ve Yayınla' + (n ? ' (' + n + ')' : '');
  if (!S.busy && n && S.ui.status.className.indexOf('err') < 0) setStatus(n + ' bekleyen değişiklik');
  if (!S.busy && !n && S.ui.status.className.indexOf('ok') < 0) setStatus('');
}
async function openPanel() {
  S.cfg = loadCfg();
  if (!getToken() || !S.cfg.owner || !S.cfg.repo) { openSettings({ then: openPanel }); return; }
  if (!S.ui) buildPanel();
  S.open = true; S.ui.panel.classList.add('open'); document.documentElement.classList.add('swpe-open');
  S.ui.sub.textContent = S.cfg.owner + '/' + S.cfg.repo + ' · ' + S.cfg.branch + ' · ' + currentFile();
  if (dirty() && S.views.content) { showTab(S.tab); refreshChrome(); return; }            /* kapatılıp açıldı: yarım kalan işi koru */
  S.ui.body.innerHTML = '<div class="swpe-loading"><span class="swpe-spin"></span> Sayfa içeriği depodan okunuyor…</div>';
  try { await loadSources(); buildViews(); showTab(S.tab === 'changes' ? 'content' : S.tab); refreshChrome(); }
  catch (e) { S.ui.body.innerHTML = ''; S.ui.body.appendChild(el('div', { class: 'swpe-warn', text: '⚠ ' + e.message })); }
}
function closePanel() { if (!S.ui) return; S.open = false; S.ui.panel.classList.remove('open'); document.documentElement.classList.remove('swpe-open'); }
function openSettings(o) {
  o = o || {};
  var c = loadCfg(), tok = getToken();
  var fOwner = el('input', { class: 'swpe-input', value: c.owner, placeholder: 'ör. kullanici-adi', autocomplete: 'off' });
  var fRepo = el('input', { class: 'swpe-input', value: c.repo, placeholder: 'ör. stallhart-saga', autocomplete: 'off' });
  var fBr = el('input', { class: 'swpe-input', value: c.branch || 'main', autocomplete: 'off' });
  var fTok = el('input', { class: 'swpe-input', type: 'password', value: tok, placeholder: 'github_pat_… (fine-grained)', autocomplete: 'off' });
  var fRem = el('input', { type: 'checkbox' }); try { fRem.checked = !!localStorage.getItem(LS_TOK); } catch (e) {}
  var msg = el('div', { class: 'swpe-note' });
  var m = modal({ title: 'GitHub bağlantısı', sticky: true, actions: [
    { label: 'Oturumu kapat', danger: true, onClick: function (a) { setToken('', false); S.tokenOk = false; syncFab(); closePanel(); a.close(); toast('Anahtar bu tarayıcıdan silindi'); } },
    { label: 'Vazgeç', onClick: function (a) { a.close(); } },
    { label: 'Sına ve kaydet', primary: true, onClick: async function (a) {
      var nc = { owner: fOwner.value.trim(), repo: fRepo.value.trim(), branch: fBr.value.trim() || 'main' }, t = fTok.value.trim();
      if (!nc.owner || !nc.repo || !t) { msg.textContent = 'Depo sahibi, depo adı ve anahtar gerekli.'; msg.className = 'swpe-warn'; return; }
      msg.textContent = 'Sınanıyor…'; msg.className = 'swpe-note';
      saveCfg(nc); setToken(t, fRem.checked);
      var r = await refreshAuth(true);
      if (!r.ok) { msg.textContent = r.reason || 'Doğrulanamadı.'; msg.className = 'swpe-warn'; return; }
      a.close(); toast('Bağlantı doğrulandı — düzenleme etkin', 'ok');
      if (o.then) o.then();
    } }
  ] });
  var row = function (l, n) { return el('div', { class: 'swpe-row' }, [el('label', { class: 'swpe-lbl', text: l }), n]); };
  m.body.appendChild(el('p', { class: 'swpe-p', html: 'Düzenlemeleri depoya yazabilmek için <b>yalnızca bu depoya</b> erişimi olan, <b>Contents: Read and write</b> izinli bir <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">fine-grained erişim anahtarı</a> gerekir. Anahtarı kısa süreli (ör. 30–90 gün) oluşturun.' }));
  m.body.appendChild(row('Depo sahibi', fOwner)); m.body.appendChild(row('Depo adı', fRepo)); m.body.appendChild(row('Dal (branch)', fBr)); m.body.appendChild(row('Erişim anahtarı', fTok));
  m.body.appendChild(el('label', { class: 'swpe-check' }, [fRem, el('span', { text: 'Bu cihazda hatırla (kapalıysa sekme kapanınca silinir)' })]));
  m.body.appendChild(msg);
  m.body.appendChild(el('p', { class: 'swpe-note', text: 'Anahtar yalnızca bu tarayıcıda saklanır ve sadece api.github.com’a gönderilir. Paylaşılan bilgisayarlarda “hatırla”yı işaretlemeyin.' }));
  setTimeout(function () { (c.owner ? fTok : fOwner).focus(); }, 40);
}
function onFab() { if (S.open) closePanel(); else openPanel(); }
function ensureFab() {
  if ($('#swpe-fab')) return;
  var b = el('button', { id: 'swpe-fab', class: 'swpe-fab', type: 'button', 'aria-label': 'Sayfayı Düzenle', 'data-pe-skip': '', onclick: onFab }, [
    el('span', { class: 'swpe-fab-ic', text: '✎' }), el('span', { class: 'swpe-fab-tx', text: 'Sayfayı Düzenle' })]);
  root().appendChild(b);
  document.documentElement.classList.add('swpe-has-fab');
  refreshChrome();
}
function removeFab() { var b = $('#swpe-fab'); if (b) b.remove(); document.documentElement.classList.remove('swpe-has-fab'); }
function syncFab() { if (S.tokenOk || S.viaSupabase) ensureFab(); else { removeFab(); closePanel(); } }

/* ═══════════════════════════════════════════════════════════════
   10. BAŞLAT
   ═══════════════════════════════════════════════════════════════ */
function boot() {
  S.cfg = loadCfg();
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
      e.preventDefault();
      if (S.tokenOk || S.viaSupabase) onFab(); else openSettings({ then: openPanel });
    } else if (e.key === 'Escape') {
      if (modalStack.length) { modalStack[modalStack.length - 1].close(); e.stopPropagation(); }
      else if (S.open) closePanel();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S') && S.open && dirty()) {
      e.preventDefault(); doSave();
    }
  });
  window.addEventListener('beforeunload', function (e) { if (dirty() && !S.busy) { e.preventDefault(); e.returnValue = ''; } });
  window.addEventListener('hashchange', function () {
    if (S.open && !dirty()) { var r = parseRoute(); if (!S.route || r.type !== S.route.type || r.id !== S.route.id) { closePanel(); S.views = {}; } }
  });
  refreshAuth(false);          /* kayıtlı anahtar varsa GitHub'da doğrula; yoksa hiçbir şey eklenmez */
  watchSupabase();
  window.SWPageEditor = { open: openPanel, close: closePanel, settings: function () { openSettings({}); } };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();


})();
