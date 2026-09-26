/* ═══════════════════════════════════════════════════════════════
   ROUTER — KALICI ADRESLER  (Sürüm 2,7)
   ---------------------------------------------------------------
   Sitedeki her madde için TEK, kalıcı adres biçimi:

        #/karakter/zeandor          #/devlet/stallhart-empire
        #/hane/solgar               #/tanri/galdra
        #/bolum/3                   #/harita/imparatorluk/solgar
        #/evren/yer-selya           #/soy-agaci/solgar

   Neden "#/…" (hash) biçimi?  GitHub Pages sunucu tarafı yönlendirme
   yapamaz; "/karakter/zeandor" gibi yol adresleri 404 verir. "#/…"
   ise sunucuya hiç gitmediği için hep çalışır (kök dizinde, /repo/
   altında, file:// ile açıldığında bile).

   Hash adresi ASIL adrestir; dosya adı (karakter-sablon.html …)
   uygulama ayrıntısıdır:
     · Sayfa içi bağlantılar  →  karakter-sablon.html#/karakter/zeandor
     · Paylaşılan kök adres   →  https://…/#/karakter/zeandor
       (herhangi bir sayfa, hash'in ait olduğu sayfaya kendiliğinden
       yönlendirir; dosyalar yeniden adlandırılsa bile yalnızca aşağıdaki
       TYPES tablosu değişir.)
     · ESKİ adresler çalışmaya devam eder ve açılınca yeni biçime çevrilir:
       karakter-sablon.html?id=zeandor · krallik-detay.html?id=… ·
       oku.html?b=3 · harita.html#solgar · lore.html#yer-selya ·
       soy-agaci.html#solgar

   Bu dosya hiçbir şeye bağımlı değildir ve her sayfanın <head> içinde,
   diğer betiklerden ÖNCE yüklenir (yönlendirme sayfa çizilmeden olsun).
   ═══════════════════════════════════════════════════════════════ */
/* Açılış ekranı için: sayfa içeriği, wiki.js'deki Loader kalkana kadar gizli tutulur
   (CSS: html.sw-boot). Betikler yüklenemezse sayfa 5 sn sonra yine de görünür. */
(function () {
  try {
    var d = document.documentElement;
    d.classList.add('sw-boot');
    setTimeout(function () { d.classList.remove('sw-boot'); }, 5000);
  } catch (e) {}
})();

(function (w) {
'use strict';
if (w.SWRoute) return;

/* Yol türü → sayfa dosyası. Yeni sayfa/tür eklemek için tek yer burasıdır. */
var TYPES = {
  /* varlık sayfaları: #/tür/kimlik */
  karakter: 'karakter-sablon.html',
  devlet: 'krallik-detay.html',
  hane: 'hane-detay.html',
  tanri: 'tanri-detay.html',
  bolum: 'oku.html',
  /* bölümlü sayfalar: #/tür[/parça[/parça]] */
  harita: 'harita.html',
  evren: 'lore.html',
  'soy-agaci': 'soy-agaci.html',
  /* liste sayfaları: #/tür (yalnızca paylaşılan kök adreslerin çözülmesi için) */
  karakterler: 'karakterler.html',
  haneler: 'haneler.html',
  tanrilar: 'tanrilar.html',
  bolumler: 'bolumler.html',
  sozler: 'sozler.html',
  forum: 'forum.html',
  'forum-kategori': 'forum-kategori.html',
  'forum-konu': 'forum-konu.html',
  hiyerarsi: 'hiyerarsi.html',
  ana: 'index.html'
};
var HAS_PARTS = { karakter: 1, devlet: 1, hane: 1, tanri: 1, bolum: 1, harita: 1, evren: 1, 'soy-agaci': 1, 'forum-kategori': 1, 'forum-konu': 1, hiyerarsi: 1 };
var ENTITY = { karakter: 1, devlet: 1, hane: 1, tanri: 1, bolum: 1 };
/* Yönlendirme yapılmayan sayfalar: yönetim paneli kendi #görünüm hash'lerini kullanır */
var NO_REDIRECT = { 'admin.html': 1, '404.html': 1 };

function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
function enc(s) { return encodeURIComponent(String(s == null ? '' : s)).replace(/'/g, '%27'); }
function dec(s) { try { return decodeURIComponent(s); } catch (e) { return String(s); }   /* bozuk %-kodu sayfayı çökertmesin */ }

function pageName() { return (location.pathname.split('/').pop() || 'index.html'); }
function siteBase() { return location.href.replace(/[?#].*$/, '').replace(/[^\/]*$/, ''); }

/* ── ÜRETME ─────────────────────────────────────────────────── */
function hash(type) {
  var parts = Array.prototype.slice.call(arguments, 1);
  return '#/' + type + parts.filter(function (p) { return p !== '' && p != null; }).map(function (p) { return '/' + enc(p); }).join('');
}
/* Göreli sayfa adresi (siteye kök dizinden): href('karakter','zeandor') → 'karakter-sablon.html#/karakter/zeandor' */
function href(type) {
  if (!own(TYPES, type)) throw new Error('SWRoute: bilinmeyen tür ' + type);
  var parts = Array.prototype.slice.call(arguments, 1).filter(function (p) { return p !== '' && p != null; });
  if (!HAS_PARTS[type] || !parts.length) return TYPES[type];
  return TYPES[type] + hash.apply(null, [type].concat(parts));
}
/* Paylaşılabilir kök adres: https://…/#/karakter/zeandor */
function permalink(type) {
  var parts = Array.prototype.slice.call(arguments, 1);
  return siteBase() + hash.apply(null, [type].concat(parts));
}

/* ── ÇÖZÜMLEME ──────────────────────────────────────────────── */
/* '#/karakter/zeandor' → { type:'karakter', parts:['zeandor'] }  (aksi hâlde null) */
function parse(h) {
  h = String(h || '');
  if (h.charAt(0) === '#') h = h.slice(1);
  if (h.charAt(0) !== '/') return null;
  var segs = h.slice(1).split('/').filter(function (s) { return s !== ''; });
  if (!segs.length) return null;
  var type = dec(segs[0]).toLowerCase();
  if (!own(TYPES, type)) return null;
  return { type: type, parts: segs.slice(1).map(dec), legacy: false };
}
function qs(search, k) {
  var m = new RegExp('[?&]' + k + '=([^&#]*)').exec(String(search || ''));
  return m ? dec(m[1].replace(/\+/g, ' ')) : '';
}
/* Eski adres biçimleri (sayfa dosyasına göre) */
function fromLegacy(page, search, h) {
  var hs = dec(String(h || '').replace(/^#/, ''));
  if (hs.charAt(0) === '/') hs = '';          /* tanınmayan '#/…' yolu kimlik sayılmaz */
  var id;
  switch (page) {
    case 'karakter-sablon.html': id = qs(search, 'id') || hs; return id ? { type: 'karakter', parts: [id], legacy: true } : null;
    case 'krallik-detay.html':   id = qs(search, 'id') || hs; return id ? { type: 'devlet', parts: [id], legacy: true } : null;
    case 'hane-detay.html':      id = qs(search, 'id') || hs; return id ? { type: 'hane', parts: [id], legacy: true } : null;
    case 'tanri-detay.html':     id = qs(search, 'id') || hs; return id ? { type: 'tanri', parts: [id], legacy: true } : null;
    case 'oku.html':
      id = qs(search, 'b') || ((/^bolum-(\d+)$/.exec(hs) || [])[1] || '');
      return id ? { type: 'bolum', parts: [id], legacy: true } : null;
    case 'harita.html':
      return hs ? { type: 'harita', parts: hs.split('/').filter(Boolean), legacy: true } : null;
    case 'lore.html':
      return hs ? { type: 'evren', parts: [hs], legacy: true } : null;
    case 'soy-agaci.html':
      return hs ? { type: 'soy-agaci', parts: [hs], legacy: true } : null;
    case 'hiyerarsi.html':
      id = qs(search, 'office') || qs(search, 'id') || hs;
      return id ? { type: 'hiyerarsi', parts: [id], legacy: true } : null;
    default: return null;
  }
}
/* Şu anki adresin yolu (yeni ya da eski biçimden) veya null */
function current() {
  var r = parse(location.hash) || fromLegacy(pageName(), location.search, location.hash);
  if (r) { r.id = r.parts[0] || ''; r.sub = r.parts[1] || ''; }
  return r;
}
/* Sayfanın kendi türüne ait ilk parça ('' → yok) */
function id(type) {
  var r = current();
  return r && r.type === type ? r.id : '';
}
function key(r) { return r ? r.type + '/' + r.parts.join('/') : ''; }

/* ── KANONİKLEŞTİRME + YÖNLENDİRME ──────────────────────────── */
/* ?id=zeandor → #/karakter/zeandor (sayfa yenilenmeden, geçmişe yeni kayıt eklemeden) */
function canonicalize() {
  var r = current();
  if (!r || !r.legacy) return false;
  try { history.replaceState(history.state, '', location.pathname + hash.apply(null, [r.type].concat(r.parts))); return true; }
  catch (e) { return false; }
}
/* Hash başka bir sayfaya aitse o sayfaya git (kök adres: index.html#/karakter/zeandor) */
function mismatch() {
  if (own(NO_REDIRECT, pageName())) return '';
  var r = parse(location.hash);
  if (!r) return '';
  var want = TYPES[r.type];
  return want !== pageName() ? want : '';
}
function redirect() {
  var want = mismatch();
  if (!want) return false;
  location.replace(siteBase() + want + location.hash);
  return true;
}
/* Varlık sayfaları için: yol başka bir maddeye değişirse sayfayı yeniden yükle
   (eski sürümde de her madde ayrı bir sayfa yüklemesiydi; durum hep temiz başlar). */
function watch() {
  var k0 = key(current());
  w.addEventListener('hashchange', function () {
    if (mismatch()) return;
    if (key(current()) !== k0) location.reload();
  });
}

redirect();
w.addEventListener('hashchange', redirect);

w.SWRoute = {
  TYPES: TYPES, ENTITY: ENTITY, href: href, hash: hash, permalink: permalink,
  parse: parse, current: current, id: id, key: key,
  canonicalize: canonicalize, redirect: redirect, watch: watch,
  pageName: pageName, enc: enc, dec: dec
};

})(window);
