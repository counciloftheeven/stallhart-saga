/* ═══════════════════════════════════════════════════════════════
   STALLHART WIKI — Ortak JS Modülü  (Sürüm 2,7: kalıcı adresler — bkz. router.js)
   --------------------------------------------------------------- (+ v16 topluluk kancaları)
   v16: LivePatches (onaylı topluluk yamalarını data/*.json üzerine
        bindirir), nav'da giriş yuvası (#sw-auth-slot) ve
        Wiki.Community.init() çağrısı eklendi. config.js boşsa hiçbir
        şey değişmez.
   v7 düzeltmeleri:
   · BASE_PATH artık <script src> adresinden türetiliyor.
     (Eski sürüm location.pathname'e bakıyordu ve GitHub Pages
      alt dizininde — user.github.io/repo/ — data/*.json dosyalarını
      kökte arayıp 404 alıyordu: "Yükleniyor…" ekranı burada donuyordu.)
   · loadData() artık hatayı yutmuyor; sayfaya görünür hata basıyor.
   · Global hata yakalayıcı: sessiz JS hatası yerine üstte uyarı şeridi.
   · Dil durumu tek anahtarda toplandı (sw-lang) ve <html lang> güncelleniyor.
   · Nav aktif bağlantı tespiti alt dizinlerde de doğru çalışıyor.
   · KRİTİK: Modülün tamamı artık IIFE içinde. Eski sürüm `Lang`, `esc`,
     `loadData` gibi adları global kapsamda tanımlıyordu; sayfalar da
     `const { Lang, esc } = Wiki;` yazdığı için tarayıcı
     "Identifier 'Lang' has already been declared" hatası veriyor ve
     sayfanın TÜM betiği çalışmadan düşüyordu. Ekranda kalan
     "Yükleniyor…" yazısının asıl sebebi buydu.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

(function () {

/* ── 1. TEMEL YOL ─────────────────────────────────────────────
   wiki.js'in kendi URL'sinden site kökünü hesaplar. Böylece site
   ister kökte, ister /repo/ altında, ister file:// ile açılsın
   data/ ve assets/ yolları her zaman doğru çözülür.            */
const BASE_PATH = (function () {
  const self =
    document.currentScript ||
    document.querySelector('script[src*="wiki.js"]');
  if (self && self.src) {
    // .../assets/js/wiki.js  →  .../
    return self.src.replace(/assets\/js\/wiki\.js.*$/, '');
  }
  // Son çare: sayfanın bulunduğu dizin
  return location.href.replace(/[^/]*$/, '');
})();

function getBasePath() { return BASE_PATH; }

/* Kalıcı adresler (Sürüm 2,7): tüm iç bağlantılar assets/js/router.js üzerinden üretilir.
   router.js her sayfanın <head>'inde yüklenir; eksikse açık bir hata verilir. */
const R = window.SWRoute;
if (!R) throw new Error('assets/js/router.js yüklenmemiş — sayfanın <head> bölümüne ekleyin.');

/* ── 2. HATA ŞERİDİ ──────────────────────────────────────────── */
function showFatal(msg, detail) {
  let bar = document.getElementById('sw-error-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'sw-error-bar';
    bar.style.cssText =
      'position:fixed;left:0;right:0;top:0;z-index:9999;background:#2A0A0A;' +
      'border-bottom:1px solid #8B2A2A;color:#F0E6C8;font-family:Georgia,serif;' +
      'font-size:.82rem;line-height:1.6;padding:.7rem 2.5rem .7rem 1rem;';
    const close = document.createElement('button');
    close.textContent = '✕';
    close.setAttribute('aria-label', 'Kapat');
    close.style.cssText =
      'position:absolute;right:.6rem;top:.5rem;background:none;border:none;' +
      'color:#9A8870;cursor:pointer;font-size:.9rem;';
    close.onclick = () => bar.remove();
    bar.appendChild(document.createElement('span')).id = 'sw-error-text';
    bar.appendChild(close);
    (document.body || document.documentElement).appendChild(bar);
  }
  const span = document.getElementById('sw-error-text');
  span.textContent = msg + (detail ? ' — ' + detail : '');
}

window.addEventListener('error', e => {
  if (e.message) showFatal('Sayfa betiğinde hata oluştu', e.message);
});
window.addEventListener('unhandledrejection', e => {
  showFatal('Veri işlenirken hata oluştu', (e.reason && e.reason.message) || String(e.reason));
});

/* Bir kapsayıcıya yerel hata mesajı bas (Yükleniyor… yerine). */
function renderError(target, err) {
  const el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) return;
  const file = location.protocol === 'file:';
  el.innerHTML =
    '<div style="padding:1.5rem;border:1px solid #5C1A1A;background:rgba(92,26,26,.08);' +
    'color:#D4C0A0;font-style:italic;font-size:.86rem;line-height:1.8">' +
    '<strong style="color:#8B2A2A;font-style:normal">Veri yüklenemedi.</strong><br>' +
    (file
      ? 'Sayfa <code>file://</code> ile açılmış. Tarayıcılar bu modda JSON okumaya izin vermez. ' +
        'Siteyi GitHub Pages üzerinden veya yerel bir sunucuyla açın ' +
        '(<code>python3 -m http.server</code>).'
      : 'Sunucudan yanıt alınamadı: ' + (err && err.message ? err.message : 'bilinmeyen hata') + '.<br>' +
        '<code>data/</code> klasörünün siteyle birlikte yayınlandığından emin olun.') +
    '</div>';
}

/* ── 3. TEMA (Işık / Karanlık Nöbeti) ──────────────────────────
   :root'taki CSS değişkenleri iki kez tanımlanır (karanlık varsayılan,
   ışık [data-theme="light"] altında). Bu modül yalnızca <html> öğesine
   o özniteliği ekleyip localStorage'a yazar — tüm renk geçişi CSS
   tarafında olur, JS hiçbir stil hesaplamaz. */
const Theme = (() => {
  let current = 'dark';
  try {
    const saved = localStorage.getItem('sw-theme');
    if (saved === 'dark' || saved === 'light') current = saved;
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) current = 'light';
  } catch (e) {}

  function apply(t) {
    if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');
  }
  apply(current);   /* modül yüklenir yüklenmez uygula — buton beklemeden */

  function get() { return current; }
  function set(t) {
    if (t !== 'dark' && t !== 'light') return;
    current = t;
    try { localStorage.setItem('sw-theme', t); } catch (e) {}
    apply(t);
    /* İkon (güneş/ay) değişimi ani bir DOM değişimi olduğundan CSS geçişiyle
       kendiliğinden yumuşamaz — kısa bir sönüp-dönme (crossfade) ile
       birlikte değiştiriyoruz. .tb-swap sınıfı ikonu söndürüp hafifçe
       döndürür/küçültür; süre dolunca yeni ikon basılır ve sınıf kaldırılır. */
    document.querySelectorAll('[data-theme-btn]').forEach(b => {
      b.classList.add('tb-swap');
      window.setTimeout(() => {
        b.innerHTML = ICON[t];
        b.setAttribute('aria-label', t === 'light' ? 'Karanlık moda geç' : 'Işık moduna geç');
        requestAnimationFrame(() => b.classList.remove('tb-swap'));
      }, 160);
    });
    document.dispatchEvent(new CustomEvent('themechange', { detail: t }));
  }
  function toggle() { set(current === 'dark' ? 'light' : 'dark'); }

  const ICON = {
    dark: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    light: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></svg>'
  };

  return { get, set, toggle, icon: () => ICON[current] };
})();

/* ── 3b. YAZI BOYUTU (Web + Mobil) ───────────────────────────────
   Site genelindeki yazı boyutunu büyütüp küçültür. <html> öğesine
   --font-scale özel özelliğini satır-içi stil olarak yazar; styles.css
   içindeki tüm rem tabanlı ölçüler (başlıklar, kartlar, nav, vb.) ve
   body'nin px tabanlı gövde metni buna göre otomatik ölçeklenir. Tercih
   localStorage'da tutulur, bu yüzden mobil ve masaüstünde ayrı ayrı
   hatırlanır. */
const FontSize = (() => {
  const KEY = 'sw-font-scale';
  const MIN = .85, MAX = 1.3, STEP = .1;
  let current = 1;
  try {
    const saved = parseFloat(localStorage.getItem(KEY));
    if (!isNaN(saved) && saved >= MIN && saved <= MAX) current = saved;
  } catch (e) {}

  function apply(v) {
    document.documentElement.style.setProperty('--font-scale', v);
  }
  apply(current); /* modül yüklenir yüklenmez uygula — buton beklemeden */

  function clamp(v) { return Math.min(MAX, Math.max(MIN, Math.round(v * 100) / 100)); }
  function get() { return current; }
  function set(v) {
    current = clamp(v);
    try { localStorage.setItem(KEY, String(current)); } catch (e) {}
    apply(current);
    syncButtons();
  }
  function inc() { set(current + STEP); }
  function dec() { set(current - STEP); }

  function syncButtons() {
    document.querySelectorAll('[data-fontsize-btn]').forEach(b => {
      const dir = b.getAttribute('data-fontsize-btn');
      b.disabled = dir === 'inc' ? current >= MAX : current <= MIN;
    });
  }

  return { get, set, inc, dec, syncButtons };
})();

/* ── 3c. AÇILIŞ EKRANI + İSKELET YÜKLEME ─────────────────────────
   Yalnızca CSS animasyonu (transform/opacity) — kütüphane yok, ek görsel
   isteği yok (sembol satır-içi SVG, ~2 KB).
   • Oturumun İLK sayfasında: halka iki yandan kapanır, kılıç iner (kısa giriş).
   • Sonraki sayfalarda: sade sürüm (sembol + hale) HER geçişte hemen görünür.
     INTRO_EVERY_PAGE = true yapılırsa her sayfada tam giriş oynar.
   • Sayfa içeriği, açılış ekranı kalkana kadar gizlidir (router.js html'e
     "sw-boot" sınıfı ekler, aşağıda kaldırılır): önce animasyon, sonra sayfa.
   • Veri (loadData) gelince ve sayfa boyanınca kapanır.
   • prefers-reduced-motion: animasyonsuz, sabit sembol. */
const SYMBOL_PATHS = {
  l: 'M430 283l-14 1l-58 13l-1 6l-4 -4l-10 4l-1 7l-6 -5l-28 12l-32 18l-24 16l-19 15l-23 21l-25 27l-24 32l-8 15l-11 15l-17 35l-27 70l-10 16l-14 15l-20 14l-15 7l-34 10l0 2l2 1l6 0l19 6l24 13l7 5l18 19l13 24l28 84l19 42l23 38l19 25l22 25l5 9l4 20l0 16l-3 14l-3 6l-5 5l-9 3l-8 0l-7 2l49 35l12 6l26 8l12 1l-2 -3l-8 -4l-8 -8l-3 -9l-1 -45l3 -17l3 -3l13 2l27 12l51 17l43 9l29 4l11 0l0 -69l-40 -9l-19 -6l-37 -17l-24 -16l-30 -29l-11 -15l-16 -25l-6 -17l-13 -28l-5 -1l-3 2l0 3l-4 -2l0 -3l8 -6l0 -3l-3 -7l-7 -33l-3 -8l-9 -69l0 -47l4 -36l14 -48l21 -44l25 -37l39 -44l18 -12l20 -10l37 -11l5 -4l-2 -6l-15 -13l-7 -4l-5 -5l1 -1l8 4l14 11l7 8l7 4l4 0l15 -5l7 -4z',
  r: 'M534 283l-1 62l7 4l15 5l4 0l7 -4l7 -8l10 -8l12 -7l1 1l-5 5l-7 4l-15 13l-2 6l5 4l37 11l20 10l18 12l39 44l25 37l21 44l14 48l4 36l0 47l-9 69l-3 8l-7 33l-3 7l0 3l8 6l0 3l-4 2l-1 -4l-7 0l-13 28l-5 15l-13 21l-15 21l-30 29l-24 16l-22 11l-34 12l-40 9l0 69l11 0l29 -4l43 -9l51 -17l27 -12l13 -2l3 3l3 17l-1 45l-3 9l-8 8l-8 4l-2 3l12 -1l26 -8l12 -6l49 -35l-22 -4l-7 -6l-3 -6l-3 -14l0 -16l4 -20l5 -9l22 -25l19 -25l23 -38l19 -42l28 -84l13 -24l18 -19l7 -5l24 -13l19 -6l6 0l2 -1l0 -2l-34 -10l-15 -7l-20 -14l-14 -15l-10 -16l-27 -70l-17 -35l-11 -15l-8 -15l-24 -32l-16 -18l-32 -30l-19 -15l-24 -16l-32 -18l-28 -12l-6 5l-1 -7l-9 -4l-5 4l-1 -6l-58 -13z',
  s: 'M481 0l-2 0l-10 21l-10 31l-1 14l-3 8l-2 35l-9 13l-12 13l-16 13l-12 7l-2 3l2 4l18 11l13 14l6 12l6 31l-2 35l1 96l-2 21l-7 11l-12 12l-22 16l20 16l16 17l8 16l3 18l0 156l1 5l4 -2l1 1l-6 6l0 54l1 2l6 2l1 6l-8 0l-1 462l30 75l2 -1l6 -12l11 -31l16 -38l-2 -560l1 -129l6 -19l9 -14l6 -6l21 -12l9 -11l-1 -3l-22 -10l-9 -6l-13 -18l-3 -10l0 -29l2 -9l0 -13l-2 -5l-2 -24l-4 -10l0 -61l4 -28l5 -12l6 -8l11 -10l13 -7l2 -4l-26 -19l-13 -12l-6 -8l-3 -13l0 -13l-2 -6l0 -9l-5 -28l-5 -19l-8 -19zM486 199l9 24l3 15l0 11l-9 23l0 12l5 12l15 23l0 3l-9 15l-8 19l-3 12l0 19l3 7l16 22l7 13l0 3l-7 10l-27 30l-10 -14l-17 -19l-4 -7l0 -5l10 -12l0 -6l12 -9l6 -14l0 -27l-16 -29l-4 -17l26 -56l2 -10l0 -22l-3 -15l0 -10zM476 119l25 30l8 13l-21 33l-8 5l-9 11l-20 18l0 -4l6 -5l9 -12l1 -12l-2 -5l-11 -15l-6 -16l11 -14l5 -11l9 -14z'
};
const Loader = (() => {
  const SEEN = 'sw-intro-seen';
  const INTRO_MIN = 650;  /* ilk ziyaret: giriş animasyonu (ms) */
  const QUICK_MIN = 80;   /* sade sürüm: mikro-fade (<120 ms) ile anında akıcı geçiş */
  const INTRO_EVERY_PAGE = false;   /* true: her sayfa geçişinde tam giriş animasyonu */
  const MAX_WAIT  = 5000;  /* güvenlik: ne olursa olsun kapat */
  let el = null, pending = 0, done = false, shownAt = 0;
  let domReady = document.readyState !== 'loading';
  let intro = false;
  try { intro = INTRO_EVERY_PAGE || !sessionStorage.getItem(SEEN); } catch (e) {}

  function show(mode) {
    if (el || done || !document.body) return;
    el = document.createElement('div');
    el.id = 'sw-loader';
    el.className = 'lh lh-' + mode;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Loading' : 'Yükleniyor');
    el.innerHTML = '<div class="lh-halo"></div>' +
      '<svg class="lh-svg" viewBox="0 0 965 1302" aria-hidden="true" focusable="false">' +
      '<g class="lh-l"><path d="' + SYMBOL_PATHS.l + '"/></g>' +
      '<g class="lh-r"><path d="' + SYMBOL_PATHS.r + '"/></g>' +
      '<g class="lh-s"><path d="' + SYMBOL_PATHS.s + '"/></g></svg>';
    document.body.appendChild(el);
    document.documentElement.classList.add('sw-loading');
    shownAt = performance.now();
    if (mode === 'intro') { try { sessionStorage.setItem(SEEN, '1'); } catch (e) {} }
  }

  function hide() {
    if (!el) return;
    const node = el; el = null;
    node.classList.add('lh-out');
    document.documentElement.classList.remove('sw-loading', 'sw-boot');   /* içerik artık görünür */
    setTimeout(() => node.remove(), 250);
  }

  function finish() {
    if (done || pending > 0 || !domReady) return;
    done = true;
    if (!el) { document.documentElement.classList.remove('sw-boot'); return; }
    const min = el.classList.contains('lh-intro') ? INTRO_MIN : QUICK_MIN;
    setTimeout(hide, Math.max(0, shownAt + min - performance.now()));
  }

  /* İki kare bekle: sayfa içeriği boyanmadan perdeyi kaldırma. */
  function settle() {
    if (done) return;
    requestAnimationFrame(() => requestAnimationFrame(finish));
  }

  function track(promise) {
    pending++;
    const end = () => { pending--; settle(); };
    promise.then(end, end);
    return promise;
  }

  /* Her sayfada hemen göster (betik gövdenin sonunda çalışır; içerik sw-boot ile zaten gizli). */
  show(intro ? 'intro' : 'quick');

  if (!domReady) document.addEventListener('DOMContentLoaded', () => { domReady = true; settle(); }, { once: true });
  else settle();
  setTimeout(() => { pending = 0; domReady = true; finish(); }, MAX_WAIT);

  return { track, hide, finish };
})();

/* İskelet: [data-skeleton="cards|rows|blocks"] işaretli, henüz boş kapları
   gri "ışıltılı" bloklarla doldurur. Sayfanın kendi render'ı içeriği
   innerHTML ile yazınca iskelet kendiliğinden gider; ilk kez gelen içerik
   yumuşakça belirir (.sw-reveal). */
const Skeleton = (() => {
  const L = w => '<div class="skel sk-l" style="width:' + w + '"></div>';
  const KIND = {
    cards:  { n: 6, html: '<div class="sk sk-card"><div class="skel sk-img"></div>' + L('60%') + L('92%') + L('74%') + '</div>' },
    rows:   { n: 6, html: '<div class="sk sk-row"><div class="skel sk-num"></div><div class="sk-col">' + L('42%') + L('86%') + '</div></div>' },
    blocks: { n: 3, html: '<div class="sk sk-block"><div class="skel sk-img"></div><div class="sk-col">' + L('38%') + L('90%') + L('70%') + '</div></div>' }
  };
  function mount() {
    document.querySelectorAll('[data-skeleton]').forEach(el => {
      const k = KIND[el.getAttribute('data-skeleton')] || KIND.cards;
      el.innerHTML = new Array(k.n + 1).join(k.html);
      el.setAttribute('aria-busy', 'true');
      const mo = new MutationObserver(() => {
        if (el.querySelector('.sk')) return;
        mo.disconnect();
        el.removeAttribute('aria-busy');
        el.classList.add('sw-reveal');
        setTimeout(() => el.classList.remove('sw-reveal'), 600);
      });
      mo.observe(el, { childList: true });
    });
  }
  return { mount };
})();
Skeleton.mount();

/* ── 4. DİL ──────────────────────────────────────────────────── */
const Lang = (() => {
  let current = 'tr';
  try { current = localStorage.getItem('sw-lang') || 'tr'; } catch (e) {}
  if (current !== 'tr' && current !== 'en') current = 'tr';

  function get() { return current; }
  function applyDom(l) {
    document.documentElement.lang = l;
    document.querySelectorAll('[data-lang-btn]').forEach(b => {
      b.textContent = l === 'tr' ? 'EN' : 'TR';
    });
    document.querySelectorAll('[data-tr]').forEach(el => {
      const val = l === 'tr' ? el.dataset.tr : el.dataset.en;
      const attr = el.dataset.i18nAttr;
      if (val === undefined) return;
      if (attr === 'html') { el.innerHTML = val; }
      else if (attr) { attr.split(',').forEach(a => el.setAttribute(a, val)); }
      else { el.textContent = val; }
    });
  }
  function set(l) {
    if (l !== 'tr' && l !== 'en') return;
    current = l;
    try { localStorage.setItem('sw-lang', l); } catch (e) {}
    applyDom(l);
    document.dispatchEvent(new CustomEvent('langchange', { detail: l }));
  }
  function toggle() { set(current === 'tr' ? 'en' : 'tr'); }
  /* Taslak/plansız bölüm etiketleri (ör. "Bölüm – Muhafız") chapters.json'da henüz
     yer almayabilir; bu sabit sözlük yalnızca bu tür kısa etiketleri EN modunda çevirir. */
  const CHAPTER_TAG_EN = {
    'Muhafız': 'The Protector', 'Karar': 'The Decision', 'Bakır': 'The Copper',
    'Tarikat': 'The Cult', 'Mağara': 'The Cave', 'Yasa': 'The Law', 'Kıyafet': 'The Attire',
    'Elçi': 'The Envoy', 'Tembellik': 'Sloth', 'Cenaze': 'Funeral', 'Çamur': 'Mud',
    'Hırsızlar': 'Thieves', 'Kefil': 'The Guarantor', 'Ulak': 'The Messenger',
    'Cüce Kral': 'The Dwarf King', 'Süt Anne': 'The Wet Nurse', 'Akbaba': 'The Vulture',
    'Hata': 'The Mistake', 'Yalan': 'The Lie', 'Vazgeçiş': 'Giving Up', 'Dönüş': 'The Return',
    'Altavar': 'Altavar'
  };
  function chapterTag(s) {
    if (current !== 'en' || typeof s !== 'string') return s;
    const m = s.match(/^Bölüm\s*[–-]\s*(.+)$/);
    if (!m) return s;
    const en = CHAPTER_TAG_EN[m[1].trim()];
    return en ? ('Chapter – ' + en) : s;
  }
  /* "KS 1481 Öncesi" gibi zaman etiketlerini EN modunda "Before KS 1481" biçimine çevirir. */
  function eraTag(s) {
    if (current !== 'en' || typeof s !== 'string') return s;
    const m = s.match(/^(.+?)\s+Öncesi$/);
    return m ? ('Before ' + m[1]) : s;
  }
  function t(obj) {
    if (obj === null || obj === undefined) return '';
    if (typeof obj === 'string' || typeof obj === 'number') return String(obj);
    if (Array.isArray(obj)) return obj;
    return obj[current] !== undefined ? obj[current]
         : obj.tr !== undefined ? obj.tr
         : obj.en !== undefined ? obj.en
         : '';
  }
  return { get, set, toggle, t, chapterTag, eraTag, refresh: () => applyDom(current) };
})();

/* ── 4. VERİ KATMANI ──────────────────────────────────────────
   Store: data/*.json dosyaları temel (base) veridir. Admin panelinde
   yapılan değişiklikler localStorage'a "sw-db:<dosya>" anahtarıyla
   yazılır ve okuma sırasında temel verinin ÜZERİNE bindirilir.
   Böylece admin'de yapılan ekleme/düzenleme/silme, sunucuya hiçbir
   şey yüklemeden tüm sayfalara anında yansır.                      */
const Store = {
  prefix: 'sw-db:',
  key(file) { return this.prefix + file; },

  /* Bu dosya için yerel taslak var mı? */
  hasOverride(file) {
    try { return localStorage.getItem(this.key(file)) !== null; }
    catch (e) { return false; }
  },

  read(file) {
    try {
      const raw = localStorage.getItem(this.key(file));
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Yerel taslak okunamadı:', file, e);
      return null;
    }
  },

  write(file, data) {
    try {
      localStorage.setItem(this.key(file), JSON.stringify(data));
      DataCache[file] = data;          /* açık sekmelerdeki önbelleği tazele */
      return true;
    } catch (e) {
      console.error('Yerel taslak yazılamadı:', file, e);
      return false;
    }
  },

  clear(file) {
    try { localStorage.removeItem(this.key(file)); delete DataCache[file]; }
    catch (e) {}
  },

  clearAll() {
    try {
      Object.keys(localStorage)
        .filter(k => k.indexOf(this.prefix) === 0)
        .forEach(k => localStorage.removeItem(k));
    } catch (e) {}
    Object.keys(DataCache).forEach(k => { delete DataCache[k]; });
  },

  /* Taslağı olan dosyaların listesi */
  overriddenFiles() {
    try {
      return Object.keys(localStorage)
        .filter(k => k.indexOf(this.prefix) === 0)
        .map(k => k.slice(this.prefix.length));
    } catch (e) { return []; }
  }
};

const DataCache = Object.create(null);

/* ── FALLBACK / MOCK VERİ ─────────────────────────────────────
   data/*.json dosyalarına ağ isteği tamamen başarısız olursa (CORS,
   sunucu kesintisi, 404, bozuk dosya) sayfa sonsuz "Yükleniyor…"da
   kalmasın veya boş/çökmüş görünmesin diye, her dosya için küçük ama
   şema-uyumlu bir örnek veri seti burada tutulur. Bu veri gerçek
   içeriğin yerini tutmaz; yalnızca sayfanın iskeletinin ayakta
   kalmasını sağlar ve kullanıcıya durumu bildiren bir uyarı eklenir.
   Gerçek veri her zaman öncelikli denenir — mock veri sadece son çare. */
const MOCK_DATA = {
  'characters.json': { characters: [
    { id: 'ornek-karakter', group: 'other', status: 'alive',
      name: { tr: 'Örnek Karakter', en: 'Sample Character' },
      house: { tr: 'Bilinmiyor', en: 'Unknown' },
      title: { tr: 'Veri şu an yüklenemedi', en: 'Data unavailable' },
      bio: { tr: 'Karakter verisi geçici olarak yüklenemedi. Lütfen sayfayı yenileyin.',
             en: 'Character data could not be loaded. Please refresh the page.' } }
  ] },
  'chapters.json': { arcs: [{ id: 1, name: { tr: 'Bilinmiyor', en: 'Unknown' } }], chapters: [
    { id: 0, arc: 1, free: false, num: '—', ks: '', title: { tr: 'Veri yüklenemedi', en: 'Data unavailable' },
      pov: { tr: '', en: '' }, synopsis: { tr: 'Bölüm verisi geçici olarak yüklenemedi.', en: 'Chapter data could not be loaded.' },
      firstLine: '', tags: [] }
  ] },
  'book.json': { version: 1, chapters: {} },
  'familytree.json': { version: 1, trees: [] },
  'quotes.json': { themes: [{ id: 'all', tr: 'Tümü', en: 'All' }], quotes: [
    { text: { tr: 'Söz verisi geçici olarak yüklenemedi.', en: 'Quote data could not be loaded.' },
      speaker: { tr: '—', en: '—' }, theme: 'all', tags: [] }
  ] },
  'lore.json': { houses: [], events: [], glossary: [], gods: [], factions: [], cults: [] },
  'houses.json': { provinces: [] },
  'kingdoms.json': { kingdoms: [], worldPowers: [] },
  'geography.json': { overview: {}, continent: {}, rivers: [], mountains: [], forests: [], provinces: [], worldPowers: [], capitalArava: {} },
  'language.json': { grammar: { phonetics: { tr: '', en: '' }, morphology: { tr: '', en: '' }, templatePhrases: [] }, dictionary: [] }
};

function cloneMock(file) {
  const m = MOCK_DATA[file];
  return m ? JSON.parse(JSON.stringify(m)) : null;
}

/* Veri sürümü (config.js → dataVersion): tanımlıysa dosyalar "?v=…" ile istenir ve
   tarayıcı HTTP önbelleğinden gelir (sayfa geçişlerinde ağ doğrulaması yok).
   Tanımlı değilse ya da yönetim panelinde eski davranış: her seferinde doğrula. */
function dataUrl(url) {
  const ver = (window.SW_CONFIG || {}).dataVersion;
  if (!ver || /admin\.html$/.test(location.pathname)) return { url: url, opts: { cache: 'no-cache' } };
  return { url: url + (url.indexOf('?') < 0 ? '?' : '&') + 'v=' + encodeURIComponent(ver), opts: {} };
}

async function fetchJSON(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const d = dataUrl(url);
    const res = await fetch(d.url, Object.assign({ signal: controller.signal }, d.opts));
    if (!res.ok) throw new Error('HTTP ' + res.status + ' · ' + url);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/* ── 4b. CANLI YAMALAR (topluluk önerileri) ───────────────────
   Admin panelinde onaylanan öneriler Supabase'deki content_patches
   tablosuna yama olarak yazılır. Burada her sayfa yüklemesinde bu
   yamalar (yalnızca okuma, anon anahtarla düz fetch) çekilir ve
   data/*.json içeriğinin ÜZERİNE bindirilir — böylece onay anında
   herkesin sitesinde görünür, depoya commit gerekmez.

   Güvenli bozulma: yapılandırma yoksa, ağ düşerse, zaman aşımı olursa
   ya da yama bozuksa site yamasız (yani eskisi gibi) çalışmaya devam
   eder. Yerel admin taslağı olan dosyalara yama BİNDİRİLMEZ.        */
const LivePatches = (() => {
  const CACHE_KEY = 'sw-live-patches';
  const TTL = 60 * 1000;
  let promise = null;

  function cfg() { return window.SW_CONFIG || {}; }
  function enabled() {
    const c = cfg();
    return !!(c.supabaseUrl && c.supabaseAnonKey && window.SWPatches &&
              !(c.features && c.features.patches === false));
  }

  function readCache() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const o = JSON.parse(raw);
      return o && Date.now() - o.t < TTL && Array.isArray(o.rows) ? o.rows : null;
    } catch (e) { return null; }
  }
  function writeCache(rows) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), rows })); } catch (e) {}
  }

  async function fetchRows() {
    const c = cfg();
    const base = String(c.supabaseUrl).replace(/\/+$/, '');
    const headers = { apikey: c.supabaseAnonKey };
    /* Eski tip (JWT) anahtarlar Authorization başlığıyla da gönderilir;
       yeni "publishable" anahtarlar yalnızca apikey ister. */
    if (/^eyJ/.test(c.supabaseAnonKey)) headers.Authorization = 'Bearer ' + c.supabaseAnonKey;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    try {
      const res = await fetch(
        base + '/rest/v1/content_patches?select=id,file,path,record_id,op,data,created_at' +
        '&merged_at=is.null&order=created_at.asc&limit=500',
        { headers, signal: controller.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const rows = await res.json();
      return Array.isArray(rows) ? rows : [];
    } finally { clearTimeout(timer); }
  }

  function get() {
    if (!enabled()) return Promise.resolve([]);
    if (!promise) {
      const cached = readCache();
      promise = cached ? Promise.resolve(cached)
        : fetchRows().then(rows => { writeCache(rows); return rows; })
                     .catch(e => {
                       console.warn('Canlı yamalar alınamadı:', e && e.message);
                       writeCache([]);   /* başarısızlık TTL (60 sn) boyunca tekrar denenmez: her sayfada bekleme olmasın */
                       return [];
                     });
    }
    return promise;
  }

  async function apply(file, data, livePromise) {
    try {
      const rows = await (livePromise || get());
      if (rows.length && window.SWPatches) window.SWPatches.applyAll(data, file, rows);
    } catch (e) { console.warn('Yamalar uygulanamadı:', file, e && e.message); }
  }

  /* Admin onay/geri alma sonrası önbelleği sıfırla. */
  function invalidate() {
    promise = null;
    try { sessionStorage.removeItem(CACHE_KEY); } catch (e) {}
  }

  return { get, apply, invalidate, enabled };
})();


/* Açılış ekranı, bekleyen veri isteklerini buradan sayar.
   Görsel manifestosu (Img.ready) paralel/arka planda çözülür, veri ve DOM teslimini engellemez. */
function loadData(file) {
  if (DataCache[file]) return Promise.resolve(DataCache[file]);
  return Loader.track(loadDataRaw(file));
}

async function loadDataRaw(file) {
  if (DataCache[file]) return DataCache[file];

  /* Yerel taslak varsa ağa hiç gitme */
  const local = Store.read(file);
  if (local) { DataCache[file] = local; return local; }

  /* Onaylı topluluk yamaları paralel çekilir (yapılandırılmadıysa anında boş döner). */
  const live = LivePatches.get();
  const url = BASE_PATH + 'data/' + file;

  /* İlk deneme, ardından kısa bir aradan sonra bir kez daha dene.
     Geçici ağ dalgalanmaları (mobilde sık görülür) tek denemeyle
     sayfayı hatalı biçimde "veri yok" durumuna düşürmesin. */
  try {
    const data = await fetchJSON(url, 12000);
    await LivePatches.apply(file, data, live);
    DataCache[file] = data;
    return data;
  } catch (err1) {
    await new Promise(r => setTimeout(r, 700));
    try {
      const data = await fetchJSON(url, 12000);
      await LivePatches.apply(file, data, live);
      DataCache[file] = data;
      return data;
    } catch (err2) {
      const mock = cloneMock(file);
      if (mock) {
        console.warn('Veri yüklenemedi, örnek veriye düşülüyor:', file, err2 && err2.message);
        showFatal(
          'Bazı içerikler geçici olarak yüklenemedi',
          'Gösterilen veri örnek/yedek içerik olabilir — sayfayı yenilemeyi deneyin.'
        );
        DataCache[file] = mock;
        return mock;
      }
      const reason = err2 && err2.name === 'AbortError' ? new Error('Zaman aşımı · ' + url) : err2;
      throw reason;
    }
  }
}

/* ── 5. ARAMA ────────────────────────────────────────────────── */
const Search = (() => {
  let index = [], fuse = null, loaded = false, building = null, focusIdx = -1, gen = 0;

  function push(o) { index.push(o); }

  async function buildIndex() {
    if (loaded) return;
    if (building) return building;
    const myGen = gen;
    building = (async () => {
      const base = BASE_PATH;
      const idx = [];                       /* yerel liste: dil değişince yarım kalan kurulum eskiye yazmasın */
      const push = o => idx.push(o);
      const jobs = [
        ['characters.json', d => (d.characters || []).forEach(c => push({
          type: 'karakter', typeLabel: { tr: 'Karakter', en: 'Character' },
          id: c.id,
          name: Lang.t(c.name),
          sub: [Lang.t(c.house), Lang.t(c.title)].filter(Boolean).join(' · '),
          bio: String(Lang.t(c.bio)).substring(0, 120),
          url: base + R.href('karakter', c.id)
        }))],
        ['chapters.json', d => (d.chapters || []).forEach(ch => push({
          type: 'bolum', typeLabel: { tr: 'Bölüm', en: 'Chapter' },
          id: 'b' + ch.id,
          name: ch.num + '. ' + Lang.t(ch.title),
          sub: String(Lang.t(ch.pov) || ''),
          bio: String(Lang.t(ch.synopsis) || '').substring(0, 120),
          url: base + (ch.free ? R.href('bolum', ch.id) : 'bolumler.html#bolum-' + ch.id)
        }))],
        ['lore.json', d => (d.glossary || []).forEach(g => push({
          type: 'sozluk', typeLabel: { tr: 'Sözlük', en: 'Glossary' },
          id: g.id,
          name: Lang.t(g.term),
          sub: String(g.type || ''),
          bio: String(Lang.t(g.def) || '').substring(0, 120),
          url: base + R.href('evren', g.id)
        }))],
        ['houses.json', d => (d.provinces || []).forEach(p => (p.houses || []).forEach(h => push({
          type: 'hane', typeLabel: { tr: 'Hane', en: 'House' },
          id: h.id,
          name: h.name + ' — ' + Lang.t(h.meaning),
          sub: String(Lang.t(p.name) || ''),
          bio: String(Lang.t(h.desc) || '').substring(0, 120),
          url: base + R.href('hane', h.id)
        })))],
        ['quotes.json', d => (d.quotes || []).forEach((q, i) => push({
          type: 'alinti', typeLabel: { tr: 'Alıntı', en: 'Quote' },
          id: 'q' + i,
          name: Lang.t(q.speaker),
          sub: String(Lang.t(q.text) || '').substring(0, 80) + '…',
          bio: String(Lang.t(q.text) || '').substring(0, 120),
          url: base + 'sozler.html'
        }))],
        ['lore.json', d => (d.gods || []).forEach(g => push({
          type: 'tanri', typeLabel: { tr: 'Tanrı', en: 'God' },
          id: 'g' + g.id,
          name: Lang.t(g.epithet) + ' (' + g.trueName + ')',
          sub: { order: 'Düzen', kaos: 'Kaos', neutral: 'Tarafsız' }[g.faction] || g.faction,
          bio: String(Lang.t(g.role) || '').substring(0, 120),
          url: base + R.href('tanri', g.id)
        }))]
      ];

      /* Dosyalar paralel yüklenir (lore.json bir kez); bir dosya düşerse diğerleri yine de indekslensin. */
      const files = Array.from(new Set(jobs.map(j => j[0])));
      const got = {};
      await Promise.all(files.map(f => loadData(f).then(d => { got[f] = d; }, e => console.warn('Arama indeksi:', f, e && e.message))));
      for (const [file, fn] of jobs) {
        if (!got[file]) continue;
        try { fn(got[file]); }
        catch (e) { console.warn('Arama indeksi:', file, e && e.message); }
      }

      await loadFuse();
      if (myGen !== gen) return;            /* dil değişti: bu kurulum eskimiş, atılır */
      index = idx;
      loaded = true;
      fuse = null;
      if (window.Fuse) {
        fuse = new window.Fuse(index, {
          keys: [{ name: 'name', weight: .5 }, { name: 'sub', weight: .3 }, { name: 'bio', weight: .2 }],
          threshold: .38, includeScore: true, minMatchCharLength: 2, ignoreLocation: true
        });
      }
    })();
    return building;
  }

  function loadFuse() {
    if (window.Fuse) return Promise.resolve();
    return new Promise(resolve => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/fuse.js/7.0.0/fuse.min.js';
      s.onload = resolve;
      s.onerror = resolve;          /* CDN yoksa basit aramaya düşer */
      document.head.appendChild(s);
    });
  }

  function query(q) {
    if (!q || q.length < 2) return [];
    if (fuse) return fuse.search(q).slice(0, 12).map(r => r.item);
    const lq = q.toLocaleLowerCase('tr');
    return index.filter(i =>
      String(i.name).toLocaleLowerCase('tr').includes(lq) ||
      String(i.sub).toLocaleLowerCase('tr').includes(lq)
    ).slice(0, 12);
  }

  function highlight(text, q) {
    text = String(text || '');
    if (!q) return esc(text);
    const idx = text.toLocaleLowerCase('tr').indexOf(q.toLocaleLowerCase('tr'));
    if (idx < 0) return esc(text);
    return esc(text.slice(0, idx)) +
      '<mark style="background:rgba(196,150,42,.25);color:var(--parchl)">' +
      esc(text.slice(idx, idx + q.length)) + '</mark>' +
      esc(text.slice(idx + q.length));
  }

  const TYPE_ICON = { karakter: 'K', bolum: 'B', sozluk: 'S', hane: 'H', alinti: 'A' };

  let openFn = null, closeFn = null;

  function open(initialQ) {
    if (openFn) openFn(initialQ);
  }

  function close() {
    if (closeFn) closeFn();
  }

  function init() {
    const overlay = document.getElementById('search-overlay');
    const input   = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    if (!overlay || !input || !results) return;

    openFn = function (initialQ) {
      overlay.classList.add('open');
      if (typeof initialQ === 'string') {
        input.value = initialQ;
      }
      input.focus();
      const curQ = input.value.trim();
      render(curQ, query(curQ));
      buildIndex().then(() => {
        const q = input.value.trim();
        if (q) render(q, query(q));
      });
    };
    closeFn = function () {
      overlay.classList.remove('open');
      input.value = '';
      results.innerHTML = '';
      focusIdx = -1;
    };
    function render(q, items) {
      const l = Lang.get();
      if (!q) {
        results.innerHTML = '<p class="search-empty">' +
          (l === 'tr' ? 'Karakter, bölüm, hane veya lore terimi ara…'
                      : 'Search characters, chapters, houses or lore terms…') + '</p>';
        return;
      }
      if (!items.length) {
        results.innerHTML = '<p class="search-empty">' +
          (l === 'tr' ? 'Sonuç bulunamadı: ' : 'No results for: ') + esc(q) + '</p>';
        return;
      }
      results.innerHTML = items.map((item, i) =>
        '<a class="sr-item" href="' + esc(item.url) + '" data-idx="' + i + '">' +
        '<div class="sr-icon">' + (TYPE_ICON[item.type] || '?') + '</div>' +
        '<div><div class="sr-name">' + highlight(item.name, q) + '</div>' +
        '<div class="sr-meta">' + highlight(item.sub, q) + '</div></div>' +
        '<div class="sr-type">' + esc(Lang.t(item.typeLabel)) + '</div></a>'
      ).join('');
      focusIdx = -1;
    }

    input.addEventListener('keydown', e => {
      const items = results.querySelectorAll('.sr-item');
      if (e.key === 'ArrowDown') { e.preventDefault(); focusIdx = Math.min(focusIdx + 1, items.length - 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); focusIdx = Math.max(focusIdx - 1, -1); }
      else if (e.key === 'Escape') { close(); return; }
      else if (e.key === 'Enter' && focusIdx >= 0) { e.preventDefault(); if (items[focusIdx]) items[focusIdx].click(); return; }
      items.forEach((el, i) => el.classList.toggle('focused', i === focusIdx));
      if (focusIdx >= 0 && items[focusIdx]) items[focusIdx].scrollIntoView({ block: 'nearest' });
    });

    input.addEventListener('input', () => {
      const q = input.value.trim();
      buildIndex().then(() => render(q, query(q)));
    });

    /* Dil değişince indeks (adlar/özetler dile göre yazılıyor) yeniden kurulur. */
    document.addEventListener('langchange', () => {
      gen++; loaded = false; building = null; fuse = null; index = [];
      if (overlay.classList.contains('open')) {
        const q = input.value.trim();
        buildIndex().then(() => render(q, query(q)));
      }
    });

    document.querySelectorAll('[data-search-btn]').forEach(b => b.addEventListener('click', () => open()));
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        overlay.classList.contains('open') ? close() : open();
      }
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  }

  return { init, buildIndex, open, close, query };
})();

/* ── 6. YARDIMCILAR ──────────────────────────────────────────── */
function groupClass(g) {
  return ['stallhart', 'arhan', 'solgar', 'selya', 'rebel', 'court', 'arathen', 'other']
    .includes(g) ? g : 'other';
}

function esc(str) {
  return String(str === null || str === undefined ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const Bookmarks = {
  key: 'sw-bookmarks',
  get() { try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch (e) { return []; } },
  has(id) { return this.get().indexOf(id) >= 0; },
  toggle(id) {
    const list = this.get();
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1); else list.push(id);
    try { localStorage.setItem(this.key, JSON.stringify(list)); } catch (e) {}
    return i < 0;
  }
};

const ReadTracker = {
  key: 'sw-read',
  get() { try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch (e) { return []; } },
  mark(id) { const l = this.get(); if (l.indexOf(id) < 0) { l.push(id); try { localStorage.setItem(this.key, JSON.stringify(l)); } catch (e) {} } },
  unmark(id) { try { localStorage.setItem(this.key, JSON.stringify(this.get().filter(x => x !== id))); } catch (e) {} },
  has(id) { return this.get().indexOf(id) >= 0; }
};

/* ── 7. ARAYÜZ PARÇALARI ─────────────────────────────────────── */
function injectSearchOverlay() {
  if (document.getElementById('search-overlay')) return;
  const l = Lang.get();
  document.body.insertAdjacentHTML('beforeend',
    '<div class="search-overlay" id="search-overlay" role="dialog" data-tr="Arama" data-en="Search" data-i18n-attr="aria-label" aria-label="' + (l === 'tr' ? 'Arama' : 'Search') + '">' +
    '<div class="search-box" role="search"><div class="search-input-wrap">' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
    '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>' +
    '<input type="search" id="search-input" data-tr="Karakter, bölüm, hane, terim…" data-en="Character, chapter, house, term…" data-i18n-attr="placeholder" placeholder="' +
    (l === 'tr' ? 'Karakter, bölüm, hane, terim…' : 'Character, chapter, house, term…') + '" autocomplete="off" spellcheck="false">' +
    '<kbd id="search-close-kbd">Esc</kbd></div><div id="search-results"></div>' +
    '<div class="search-footer">' +
    '<span data-tr="↑↓ Gezin" data-en="↑↓ Navigate">' + (l === 'tr' ? '↑↓ Gezin' : '↑↓ Navigate') + '</span>' +
    '<span data-tr="↵ Git" data-en="↵ Go">' + (l === 'tr' ? '↵ Git' : '↵ Go') + '</span>' +
    '<span data-tr="Esc Kapat" data-en="Esc Close">' + (l === 'tr' ? 'Esc Kapat' : 'Esc Close') + '</span>' +
    '</div></div></div>');
}

function injectScrollUp() {
  if (document.getElementById('scroll-up')) return;
  const l = Lang.get();
  document.body.insertAdjacentHTML('beforeend',
    '<button class="up" id="scroll-up" type="button" data-tr="Yukarı çık" data-en="Scroll to top" data-i18n-attr="aria-label" aria-label="' +
    (l === 'tr' ? 'Yukarı çık' : 'Scroll to top') + '">' +
    '<svg class="up-svg" viewBox="0 0 44 44" width="42" height="42" aria-hidden="true">' +
    '<circle class="up-bg-circle" cx="22" cy="22" r="18" fill="none" stroke="rgba(196,150,42,.2)" stroke-width="2.5"/>' +
    '<circle class="up-prog-circle" id="scroll-up-circle" cx="22" cy="22" r="18" fill="none" stroke="var(--gold, #C4962A)" stroke-width="2.5" stroke-dasharray="113.1" stroke-dashoffset="113.1" transform="rotate(-90 22 22)"/>' +
    '<polyline points="15 25 22 18 29 25" fill="none" stroke="var(--parchl, #F4ECD8)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg></button>');
}

function injectFooter() {
  if (document.getElementById('site-footer')) return;
  const l = Lang.get();
  document.body.insertAdjacentHTML('beforeend',
    '<footer id="site-footer"><p data-tr="Stallhart Evreni · Son İmparator" data-en="Stallhart Universe · The Last Emperor">' +
    (l === 'tr' ? 'Stallhart Evreni · Son İmparator' : 'Stallhart Universe · The Last Emperor') + '</p>' +
    '<small>© ' + new Date().getFullYear() + ' craesx — <span data-tr="Tüm hakları saklıdır." data-en="All rights reserved.">' +
    (l === 'tr' ? 'Tüm hakları saklıdır.' : 'All rights reserved.') + '</span></small></footer>');
}

const NAV_LINKS = [
  { href: 'index.html',       tr: 'Ana Sayfa',   en: 'Home' },
  { href: 'karakterler.html', tr: 'Karakterler', en: 'Characters' },
  { href: 'haneler.html',     tr: 'Haneler',     en: 'Houses' },
  { href: 'lore.html',        tr: 'Evren',       en: 'Lore' },
  { href: 'tanrilar.html',    tr: 'Denge Konseyi', en: 'Council of Balance' },
  { href: 'harita.html',      tr: 'Harita',      en: 'Map' },
  { href: 'bolumler.html',    tr: 'Bölümler',    en: 'Chapters' },
  { href: 'soy-agaci.html',   tr: 'Soy Ağacı',   en: 'Family Tree' },
  { href: 'sozler.html',      tr: 'Sözler',      en: 'Quotes' }
];

function injectNav() {
  if (document.getElementById('site-nav')) return;
  const l = Lang.get();
  const links = NAV_LINKS.map(x =>
    '<li><a href="' + BASE_PATH + x.href + '" data-page="' + x.href +
    '" data-tr="' + x.tr + '" data-en="' + x.en + '">' + (l === 'tr' ? x.tr : x.en) + '</a></li>'
  ).join('');

  document.body.insertAdjacentHTML('afterbegin',
    '<nav id="site-nav"><div class="nav-in">' +
    '<a class="nav-brand" href="' + BASE_PATH + 'index.html">Stallhart</a>' +
    '<ul class="nav-links" id="nav-links">' + links + '</ul>' +
    '<div class="nav-r">' +
    '<button class="nav-search-btn" type="button" data-search-btn data-tr="Ara (Ctrl K)" data-en="Search (Ctrl K)" data-i18n-attr="aria-label,title" aria-label="' +
    (l === 'tr' ? 'Ara (Ctrl K)' : 'Search (Ctrl K)') + '" title="' + (l === 'tr' ? 'Ara (Ctrl K)' : 'Search (Ctrl K)') + '">' +
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
    '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg><span class="nsb-label" data-tr="Ara" data-en="Search">' + (l === 'tr' ? 'Ara' : 'Search') + '</span><kbd>Ctrl K</kbd></button>' +
    '<div class="nav-settings" id="nav-settings">' +
    '<button class="nav-set-btn" id="nav-set-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="nav-set-panel" data-tr="Ayarlar" data-en="Settings" data-i18n-attr="aria-label,title" aria-label="' +
    (l === 'tr' ? 'Ayarlar' : 'Settings') + '" title="' + (l === 'tr' ? 'Ayarlar' : 'Settings') + '">' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>' +
    '<div class="nav-set-panel" id="nav-set-panel" role="group" data-tr="Ayarlar" data-en="Settings" data-i18n-attr="aria-label" aria-label="' + (l === 'tr' ? 'Ayarlar' : 'Settings') + '">' +
    '<div class="ns-row"><span class="ns-l" data-tr="Yazı boyutu" data-en="Text size">' + (l === 'tr' ? 'Yazı boyutu' : 'Text size') + '</span>' +
    '<div class="fontsize-ctrl">' +
    '<button class="fontsize-btn" type="button" data-fontsize-btn="dec" data-tr="Yazı boyutunu küçült" data-en="Decrease text size" data-i18n-attr="aria-label" aria-label="' + (l === 'tr' ? 'Yazı boyutunu küçült' : 'Decrease text size') + '">A</button>' +
    '<button class="fontsize-btn" type="button" data-fontsize-btn="inc" data-tr="Yazı boyutunu büyüt" data-en="Increase text size" data-i18n-attr="aria-label" aria-label="' + (l === 'tr' ? 'Yazı boyutunu büyüt' : 'Increase text size') + '">A</button>' +
    '</div></div>' +
    '<div class="ns-row"><span class="ns-l" data-tr="Dil" data-en="Language">' + (l === 'tr' ? 'Dil' : 'Language') + '</span>' +
    '<button class="lang-btn" type="button" data-lang-btn>' + (l === 'tr' ? 'EN' : 'TR') + '</button></div>' +
    '<div class="ns-row"><span class="ns-l" data-tr="Tema" data-en="Theme">' + (l === 'tr' ? 'Tema' : 'Theme') + '</span>' +
    '<button class="theme-btn" type="button" data-theme-btn data-tr="Tema değiştir" data-en="Toggle theme" data-i18n-attr="aria-label" aria-label="' + (l === 'tr' ? 'Tema değiştir' : 'Toggle theme') + '">' + Theme.icon() + '</button></div>' +
    '</div></div>' +
    '<span class="nav-auth-slot" id="sw-auth-slot"></span>' +
    '<button class="nav-ham" id="nav-ham" type="button" data-tr="Menü" data-en="Menu" data-i18n-attr="aria-label" aria-label="' + (l === 'tr' ? 'Menü' : 'Menu') + '" aria-expanded="false">' +
    '<span></span><span></span><span></span></button>' +
    '</div></div></nav>');
}

function initNav() {
  const ham   = document.getElementById('nav-ham');
  const links = document.getElementById('nav-links');
  if (ham && links) {
    ham.addEventListener('click', e => {
      e.stopPropagation();
      ham.setAttribute('aria-expanded', String(links.classList.toggle('open')));
    });
    document.addEventListener('click', e => {
      if (!ham.contains(e.target) && !links.contains(e.target)) {
        links.classList.remove('open');
        ham.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* Ayarlar (⚙) açılır menüsü: yazı boyutu + dil + tema */
  const setBtn = document.getElementById('nav-set-btn');
  const setBox = document.getElementById('nav-settings');
  if (setBtn && setBox) {
    const setOpen = on => {
      setBox.classList.toggle('open', on);
      setBtn.setAttribute('aria-expanded', String(on));
    };
    setBtn.addEventListener('click', e => {
      e.stopPropagation();
      setOpen(!setBox.classList.contains('open'));
    });
    document.addEventListener('click', e => { if (!setBox.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && setBox.classList.contains('open')) { setOpen(false); setBtn.focus(); }
    });
  }

  const up = document.getElementById('scroll-up');
  const upCircle = document.getElementById('scroll-up-circle');
  if (up) {
    let ticking = false;
    const updateUpProgress = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0;
      up.classList.toggle('vis', pct >= 0.15 || scrollY > 280);
      if (upCircle) {
        const offset = 113.1 * (1 - pct);
        upCircle.style.strokeDashoffset = offset.toFixed(1);
      }
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateUpProgress);
        ticking = true;
      }
    }, { passive: true });
    up.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* Aktif sayfa — sorgu ve hash'ten arındırılmış dosya adına göre */
  const page = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    const href = a.dataset.page;
    a.classList.toggle('active',
      href === page ||
      (page === '' && href === 'index.html') ||
      (page.indexOf('karakter') === 0 && href.indexOf('karakter') === 0));
  });

  /* Kurultay (forum) okunmamış içerik noktası — forum.html tarafından
     localStorage'a yazılan bayrağa göre, her sayfada gösterilir. */
  try {
    const forumLink = document.querySelector('.nav-links a[data-page="forum.html"]');
    if (forumLink && localStorage.getItem('kurultay-unread') === '1' && !forumLink.querySelector('.kurultay-dot')) {
      forumLink.insertAdjacentHTML('beforeend', '<i class="kurultay-dot" aria-hidden="true"></i>');
    }
  } catch (e) {}
}

function initLang(onChangeCb) {
  Lang.refresh();
  document.querySelectorAll('[data-lang-btn]').forEach(b => {
    b.addEventListener('click', () => Lang.toggle());
  });
  if (onChangeCb) document.addEventListener('langchange', e => onChangeCb(e.detail));
}

function initTheme() {
  document.querySelectorAll('[data-theme-btn]').forEach(b => {
    b.innerHTML = Theme.icon();
    b.addEventListener('click', () => Theme.toggle());
  });
}

function initFontSize() {
  document.querySelectorAll('[data-fontsize-btn]').forEach(b => {
    const dir = b.getAttribute('data-fontsize-btn');
    b.addEventListener('click', () => (dir === 'inc' ? FontSize.inc() : FontSize.dec()));
  });
  FontSize.syncButtons();
}

function initFaq() {
  document.querySelectorAll('.fi').forEach(item => {
    const q = item.querySelector('.fq');
    if (q) q.addEventListener('click', () => item.classList.toggle('on'));
  });
}


/* ── 9. WIKI TOOLTIP (otomatik bağlantı + mini bilgi kartı) ───
   v18: Sözlük artık karakter ve sözlük terimlerinin yanında hane, devlet,
   yer (eyalet / şehir / nehir / dağ / orman), tanrı, topluluk (fraksiyon,
   kült) ve tarihsel olay adlarını da içerir.

   · Metin içinde geçen adların üzerine gelince (dokunmatik ekranda:
     dokununca) küçük bir bilgi kartı açılır; kart maddeye bağlanır.
   · Fare ile terime tıklamak doğrudan maddeye götürür; dokunmatik
     ekranda ilk dokunuş kartı açar, karttaki "Maddeyi aç" maddeye götürür.
   · Tarama yalnızca izin verilen kapsayıcılarda ve yalnızca metin
     düğümlerinde yapılır; mevcut bağlantılar ve HTML yapısı bozulmaz.
   · once:true (okuyucu) → her varlık, taranan bölümde YALNIZCA ilk
     geçtiği yerde işaretlenir; elle konmuş [ad](wiki:…) köprüleri de
     "ilk geçiş" sayılır. */
const Tooltip = (() => {
  let terms = null;          /* normalleştirilmiş anahtar → kayıt */
  let sorted = [];           /* uzundan kısaya anahtar listesi */
  let card = null;
  let hideTimer = null;
  let building = null;
  let activeEl = null;
  let opts = { newTab: false, once: false };

  const SCAN_SELECTOR =
    '.art-p, .cc-desc, .ci-d, .gls-def, .read-synopsis, .ip-desc, ' +
    '.hc-desc, .kc-desc, .modal-bio, .tl-desc, .q-text, .lc p, .book-body p';

  const KIND = {
    karakter: { tr: 'Karakter', en: 'Character', rank: 1, icon: '👤' },
    devlet:   { tr: 'Devlet',   en: 'State',     rank: 2, icon: '👑' },
    yer:      { tr: 'Yer & Kale', en: 'Place',   rank: 3, icon: '🏰' },
    hane:     { tr: 'Hane',     en: 'House',     rank: 4, icon: '🛡️' },
    tanri:    { tr: 'Tanrı',    en: 'God',       rank: 5, icon: '⚡' },
    grup:     { tr: 'Topluluk', en: 'Faction',   rank: 6, icon: '⚔️' },
    olay:     { tr: 'Tarihî Olay', en: 'Event',  rank: 7, icon: '📜' },
    unvan:    { tr: 'Unvan & Makam', en: 'Title', rank: 8, icon: '⚜️' },
    sozluk:   { tr: 'Vakanüvis Dipnotu', en: 'Chronicler Note', rank: 9, icon: '✒️' }
  };
  const GLS_TYPE = {
    geo: { tr: 'Coğrafya', en: 'Geography' }, title: { tr: 'Unvan', en: 'Title' },
    political: { tr: 'Siyasi', en: 'Political' }, military: { tr: 'Askerî', en: 'Military' },
    religious: { tr: 'Dinî', en: 'Religious' }, magic: { tr: 'Sihir', en: 'Magic' }
  };
  /* Elle yazılmış köprü türü → sözlük kaydı türü (ilk-geçiş takibi için) */
  const WT_KIND = { character: 'karakter', god: 'tanri', house: 'hane', kingdom: 'devlet' };

  /* Ortak sözcük olup özel ad olarak yanlış eşleşme yaratabilecek anahtarlar */
  const STOP = Object.create(null);
  ['kral', 'kralı', 'han', 'bey', 'lord', 'lady', 'usta', 'genç', 'yaşlı', 'vali', 'general', 'prens', 'kont', 'dük',
   'vezir', 'veziri', 'vezirleri', 'konsey', 'sessiz', 'istihbarat', 'komutan', 'başkomutan', 'danışman']
    .forEach(w => { STOP[w] = true; });

  const lc = x => String(x || '').toLocaleLowerCase('tr');
  /* Anahtar / metin normalleştirme: küçük harf + kıvrık kesme işaretleri tek tipe.
     Uzunluk korunur (indeksler özgün metinle birebir örtüşmeli). */
  const norm = x => lc(x).replace(/[\u2018\u2019\u02BC\u00B4`]/g, "'");
  function normSafe(text) {
    const n = norm(text);
    if (n.length === text.length) return n;
    return text.replace(/[\s\S]/g, c => { const l = norm(c); return l.length === 1 ? l : c; });
  }
  const isUpper = ch => !!ch && ch !== ch.toLocaleLowerCase('tr');

  /* Çok dilli alan: geçerli dilde boşsa Türkçeye düş */
  function tt(o) {
    if (o === null || o === undefined) return '';
    if (typeof o === 'string' || typeof o === 'number') return String(o);
    const v = Lang.t(o);
    if (typeof v === 'string' && v.trim()) return v;
    return (o && typeof o.tr === 'string') ? o.tr : '';
  }
  function tidy(s) {
    return String(s || '').replace(/\\([~*\[\]\\>#!-])/g, '$1').replace(/\s+/g, ' ').trim();
  }
  function snip(s, max) {
    s = tidy(s);
    if (s.length <= max) return s;
    const cut = s.slice(0, max), sp = cut.lastIndexOf(' ');
    return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:—–-]+$/, '') + '…';
  }
  function fmt(n) { return Number(n).toLocaleString(Lang.get() === 'en' ? 'en-US' : 'tr-TR'); }

  /* "Ad (Takma Ad) / Öteki Ad" → ana ad(lar) + (varsa) çok sözcüklü takma ad */
  function nameVariants(name, parenMin) {
    const out = [];
    String(name || '').split('/').forEach(part => {
      const p = part.trim();
      const paren = /\(([^)]+)\)/.exec(p);
      const base = p.replace(/\s*\([^)]*\)/g, '').trim();
      if (base) out.push(base);
      if (paren && !/[.=]|---/.test(paren[1])) {
        const alt = paren[1].trim(), n = alt.split(/\s+/).length;
        if (n >= (parenMin || 2) && n <= 3) out.push(alt);
      }
    });
    return out;
  }

  const ROMAN = /^[IVXL]+\.?$/;

  async function build() {
    if (terms) return;
    if (building) return building;
    building = (async () => {
      const prim = Object.create(null);   /* birincil adlar: tür sırasına göre çatışma çözülür */
      const aliasList = [];               /* takma adlar: hiçbir birincil adı ezmez */
      const T = Book.TITLE_WORDS;

      const addPrimary = (key, rec) => {
        const k = norm(String(key || '').trim());
        if (k.length < 3 || STOP[k]) return;
        const cur = prim[k];
        if (!cur || KIND[rec.kind].rank < KIND[cur.kind].rank) prim[k] = rec;
      };
      const addAlias = (key, rec) => {
        const k = norm(String(key || '').trim());
        if (k.length >= 3 && !STOP[k]) aliasList.push([k, rec]);
      };
      const load = async f => { try { return await loadData(f); } catch (e) { console.warn('Tooltip: ' + f + ' atlandı', e && e.message); return null; } };
      const url = p => BASE_PATH + p;
      const en = Lang.get() === 'en';

      /* ── Karakterler ── */
      const pre = await Promise.all(['characters.json', 'houses.json', 'kingdoms.json', 'geography.json', 'lore.json', 'language.json'].map(load));
      const charData = pre[0] || {}, hd = pre[1] || {}, kd = pre[2] || {}, geo = pre[3] || {}, lore = pre[4] || {}, langData = pre[5] || {};
      const chars = charData.characters || [];
      /* Betimleme metinlerinde küçük harfle de geçen sözcükler ortak sözcüktür
         ("Sessiz Avcı" → "Sessiz", "Hazine Veziri" → "Veziri"): bunlardan takma ad üretme. */
      const lowerWords = Object.create(null);
      const TEXT_KEYS = { bio: 1, desc: 1, def: 1, origin: 1, role: 1, psychology: 1, belief: 1, imperialTie: 1, ritual: 1, economy: 1, neighbors: 1 };
      const walk = (o, key) => {
        if (typeof o === 'string') {
          if (TEXT_KEYS[key]) (o.match(/(?:^|[^\p{L}])\p{Ll}[\p{L}]+/gu) || []).forEach(w => { lowerWords[lc(w.replace(/^[^\p{L}]/u, ''))] = true; });
        } else if (Array.isArray(o)) o.forEach(v => walk(v, key));
        else if (o && typeof o === 'object') Object.keys(o).forEach(k => walk(o[k], (k === 'tr' || k === 'en') ? key : k));
      };
      [charData, hd, kd, geo, lore].forEach(d => walk(d, ''));
      /* ── Haneler ── */
      const houseRec = Object.create(null);
      const houseMap = Object.create(null);
      (hd.provinces || []).forEach(p => (p.houses || []).forEach(h => {
        if (!h.name) return;
        const hAccent = (h.colors && (h.colors[1] || h.colors[0])) || '#c4962a';
        const rec = {
          uid: 'hane:' + h.id, kind: 'hane', title: h.name,
          sub: [tt(h.meaning), tt(p.name)].filter(Boolean).join(' · '),
          body: snip(tt(h.desc) || tt(h.origin), 170), cs: true,
          url: url(R.href('hane', h.id)),
          watermark: h.banner ? safeImg(h.banner) : '',
          watermarkGlyph: h.name.charAt(0) || '🛡️',
          accent: hAccent
        };
        houseRec[h.id] = rec;
        houseMap[h.id.toLowerCase()] = { house: h, province: p, rec };
        houseMap[h.name.toLowerCase()] = { house: h, province: p, rec };
        addPrimary(h.name, rec);
        addAlias(h.name + ' Hanesi', rec);
        addAlias(h.name + ' Hanedanı', rec);
        addAlias('House ' + h.name, rec);
      }));

      const tokOwners = Object.create(null), coreOwners = Object.create(null), items = [];
      chars.forEach(ch => {
        const nm = tt(ch.name);
        if (!nm) return;
        let chBanner = '';
        let chAccent = '';
        let chGlyph = '';
        if (ch.house) {
          const hRaw = tt(ch.house).toLowerCase().replace(/\s*(?:hanesi|hanedanı|house)\b/gi, '').trim();
          const hit = houseMap[hRaw] || (ch.group && houseMap[ch.group.toLowerCase()]);
          if (hit) {
            chBanner = hit.house.banner ? safeImg(hit.house.banner) : '';
            chAccent = (hit.house.colors && (hit.house.colors[1] || hit.house.colors[0])) || '';
            chGlyph = hit.house.name ? hit.house.name.charAt(0) : '';
          }
        }
        if (!chBanner && ch.image) chBanner = safeImg(ch.image);
        if (!chGlyph && nm) chGlyph = nm.charAt(0);
        const rec = {
          uid: 'karakter:' + ch.id, kind: 'karakter', title: nm.replace(/\s*\/\s*/g, ' / '),
          sub: [tt(ch.house), tt(ch.title)].filter(Boolean).join(' · '),
          body: snip(tt(ch.bio), 170), status: ch.status, cs: true,
          url: url(R.href('karakter', ch.id)),
          watermark: chBanner,
          watermarkGlyph: chGlyph || '⚔',
          accent: chAccent || '#c4962a'
        };
        const vs = nameVariants(nm, 1);
        const cores = [];
        vs.forEach(v => {
          const toks = v.split(/\s+/).filter(t => !ROMAN.test(t) && T.indexOf(t) < 0);
          const core = toks.join(' ');
          if (core && core !== v) cores.push(core);
          const tokset = new Set();
          v.split(/\s+/).forEach(t => {
            t = t.replace(/[.,;:()]/g, '');
            if (t.length >= 4 && /^\p{Lu}/u.test(t) && T.indexOf(t) < 0 && !ROMAN.test(t)) tokset.add(norm(t));
          });
          tokset.forEach(t => { (tokOwners[t] = tokOwners[t] || new Set()).add(ch.id); });
        });
        cores.forEach(c => { (coreOwners[norm(c)] = coreOwners[norm(c)] || new Set()).add(ch.id); });
        items.push({ rec, vs, cores });
      });
      items.forEach(it => {
        it.vs.forEach(v => addPrimary(v, it.rec));
        it.cores.forEach(c => { if (coreOwners[norm(c)].size === 1) addAlias(c, it.rec); });
        it.vs.forEach(v => v.split(/\s+/).forEach(t => {
          t = t.replace(/[.,;:()]/g, '');
          const k = norm(t);
          if (tokOwners[k] && tokOwners[k].size === 1 && t.length >= 4 && /^\p{Lu}/u.test(t) && !lowerWords[k]) addAlias(t, it.rec);
        }));
      });

      /* ── Devletler ── */
      const kingByKey = Object.create(null);
      (kd.kingdoms || []).forEach(k => {
        const nm = tt(k.name);
        if (!nm) return;
        const rec = {
          uid: 'devlet:' + k.id, kind: 'devlet', title: nm,
          sub: tt(k.capital) ? (en ? 'Capital: ' : 'Başkent: ') + tt(k.capital) : '',
          body: snip(tt(k.desc), 170), cs: true,
          url: url(R.href('devlet', k.id)),
          watermark: k.banner ? safeImg(k.banner) : (k.arms ? safeImg(k.arms) : ''),
          watermarkGlyph: '👑',
          accent: '#c4962a'
        };
        nameVariants(nm).forEach(v => { addPrimary(v, rec); kingByKey[norm(v)] = rec; });
        const first = nm.split(/\s+/)[0];
        if (first && first.length >= 5 && first !== nm) { addAlias(first, rec); kingByKey[norm(first)] = rec; }
      });
      (kd.worldPowers || []).forEach(w => {
        const nm = tt(w.name);
        if (!nm) return;
        const vs = nameVariants(nm);
        const k0 = vs.length ? norm(vs[0]) : '';
        if (!k0) return;
        /* Sıralamadaki devlet, sayfası olan bir devletse ("Örebas Krallığı" → Örebas) onun sayfasına bağla */
        const hit = kingByKey[k0] || kingByKey[norm(nm.split(/\s+/)[0])];
        if (hit) { vs.forEach(v => addAlias(v, hit)); return; }
        if (prim[k0]) return;
        const rec = {
          uid: 'devlet:wp:' + Book.slug(vs[0]), kind: 'devlet', title: vs[0],
          sub: en ? 'World power #' + w.rank : 'Dünya gücü #' + w.rank,
          body: (en ? 'Population ' : 'Nüfus ') + fmt(w.population) + ' · ' + (en ? 'Military ' : 'Askerî güç ') + fmt(w.military),
          cs: true, url: url(R.href('evren', 'dunya')),
          watermarkGlyph: '👑',
          accent: '#b87333'
        };
        vs.forEach(v => addPrimary(v, rec));
      });

      /* ── Yerler ── */
      const cityInfo = geo.capitalArava && geo.capitalArava.location ? tt(geo.capitalArava.location) : '';
      (geo.provinces || []).forEach(p => {
        const pid = Book.slug(p.name);
        if (!pid) return;
        const vs = nameVariants(p.name);
        const short = String(p.name).replace(/\s*\([^)]*\)/g, '').trim();
        const rec = {
          uid: 'yer:' + pid, kind: 'yer', title: vs[0] || p.name, sub: en ? 'Province' : 'Eyalet',
          body: snip([p.economy, p.neighbors].filter(Boolean).join(' · '), 170), cs: true,
          url: url(R.href('evren', 'yer-' + pid)),
          watermark: p.banner ? safeImg(p.banner) : '',
          watermarkGlyph: '🏰',
          accent: p.color || '#c4962a'
        };
        vs.forEach(v => addPrimary(v, rec));
        String(p.cities || '').split(/[,;]/).forEach(c => {
          const cn = c.replace(/\s*\([^)]*\)/g, '').replace(/---.*$/, '').trim();
          if (cn.length < 3 || cn.split(/\s+/).length > 3) return;
          addPrimary(cn, {
            uid: 'yer:' + pid + ':' + Book.slug(cn), kind: 'yer', title: cn,
            sub: (en ? 'City · ' : 'Şehir · ') + short,
            body: /^arava$/i.test(cn) && cityInfo ? snip(cityInfo, 170) : (en ? 'A city of ' : '') + short + (en ? '.' : ' eyaletinde şehir.'),
            cs: true, url: rec.url,
            watermarkGlyph: '🏰',
            accent: p.color || '#c4962a'
          });
        });
      });
      [['rivers', 'Nehir', 'River'], ['mountains', 'Dağ', 'Mountain'], ['forests', 'Orman', 'Forest']].forEach(g => {
        (geo[g[0]] || []).forEach(f => {
          String(f.name || '').split(/[,;]/).forEach(n => {
            n = n.replace(/\s*\([^)]*\)/g, '').trim();
            if (n.length < 3) return;
            addPrimary(n, {
              uid: 'yer:' + g[0] + ':' + Book.slug(n), kind: 'yer', title: n, sub: en ? g[2] : g[1],
              body: snip(tt(f.desc), 170), cs: true, url: url(R.href('evren', 'cog'))
            });
          });
        });
      });

      /* ── Lore: tanrılar, topluluklar, olaylar, sözlük ── */
      (lore.houses || []).forEach(h => {                       /* "Arhan Hanesi" gibi etiketler */
        const r = houseRec[h.id], lab = tt(h.label);
        if (r && lab) addAlias(lab, r);
      });
      (lore.gods || []).forEach(g => {
        if (!g.trueName) return;
        const ep = tt(g.epithet);
        const rec = {
          uid: 'tanri:' + g.id, kind: 'tanri', title: g.trueName,
          sub: (ep ? ep + ' · ' : '') + (en ? 'God' : 'Tanrı'),
          body: snip(tt(g.role), 170), cs: true,
          url: url(R.href('tanri', g.id)),
          watermark: g.symbolImg ? safeImg(g.symbolImg) : '',
          watermarkGlyph: '⚡',
          accent: g.faction === 'order' ? '#6a9ac9' : (g.faction === 'chaos' ? '#c95a5a' : '#c4962a')
        };
        addPrimary(g.trueName, rec);
        if (ep) addAlias(ep + ' ' + g.trueName, rec);
      });
      (lore.factions || []).concat(lore.cults || []).forEach(f => {
        const nm = tt(f.name);
        if (!nm) return;
        const parts = nm.split(/\s+[—–]\s+/).map(s => s.replace(/["“”„]/g, '').trim()).filter(Boolean);
        const rec = {
          uid: 'grup:' + f.id, kind: 'grup', title: parts[0] || nm, sub: parts[1] || '',
          body: snip(tt(f.belief) || tt(f.desc), 170), cs: true,
          url: url(R.href('evren', 'grup-' + f.id))
        };
        parts.forEach(p => addPrimary(p, rec));
      });
      (lore.events || []).forEach(e => {
        const nm = tt(e.name);
        if (!nm) return;
        const rec = {
          uid: 'olay:' + e.id, kind: 'olay', title: nm,
          sub: e.ks ? 'KS ' + e.ks : '', body: snip(tt(e.desc), 170), cs: true,
          url: url(R.href('evren', e.id))
        };
        addPrimary(nm, rec);
        const base = nm.split(/\s*[:—–(]\s*/)[0].trim();
        if (base !== nm && base.length >= 8 && base.split(/\s+/).length >= 2) addPrimary(base, rec);
      });
      (lore.glossary || []).forEach(g => {
        const term = tt(g.term);
        if (!term || term.length < 3) return;
        const ty = GLS_TYPE[g.type];
        addPrimary(term, {
          uid: 'sozluk:' + g.id, kind: 'sozluk', title: term,
          sub: ty ? ty[en ? 'en' : 'tr'] : (g.type || ''),
          body: snip(tt(g.def), 170), cs: false,
          url: url(R.href('evren', g.id))
        });
      });

      /* ── Ortak Lisan & Vakanüvis Sözlüğü (Unvanlar, Arkaik Terimler) ── */
      (langData.dictionary || []).forEach(w => {
        const word = tt(w.word);
        if (!word || word.length < 3) return;
        const vs = nameVariants(word);
        const cleanWord = vs[0] || word;
        const isTitle = /unvan|title|makam|komutan|vezir|muhafız/i.test(w.pos || '');
        const rec = {
          uid: 'lisan:' + Book.slug(cleanWord),
          kind: isTitle ? 'unvan' : 'sozluk',
          title: cleanWord,
          sub: [w.pos, w.origin ? (en ? 'Origin: ' : 'Köken: ') + w.origin : ''].filter(Boolean).join(' · '),
          body: snip(w.meaning + (w.example ? ' — “' + w.example + '”' : ''), 190),
          cs: false,
          url: url(R.href('evren', 'dil'))
        };
        vs.forEach(v => addPrimary(v, rec));
      });
      (langData.grammar && langData.grammar.templatePhrases || []).forEach(p => {
        const ph = tt(p.phrase);
        if (!ph || ph.length < 3) return;
        const rec = {
          uid: 'lisan:kalip:' + Book.slug(ph),
          kind: 'sozluk',
          title: ph,
          sub: en ? 'Common Tongue Phrase' : 'Ortak Lisan Kalıp İfade',
          body: snip(tt(p.meaning), 170),
          cs: false,
          url: url(R.href('evren', 'dil'))
        };
        addPrimary(ph, rec);
      });

      const map = prim;
      aliasList.forEach(a => { if (!map[a[0]]) map[a[0]] = a[1]; });
      terms = map;
      sorted = Object.keys(map).sort((a, b) => b.length - a.length);
    })();
    return building;
  }

  const coarse = () => !!(window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches);

  function ensureCard() {
    if (card) return card;
    card = document.createElement('div');
    card.className = 'wk-card';
    card.setAttribute('role', 'tooltip');
    card.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    card.addEventListener('mouseleave', hide);
    document.body.appendChild(card);
    return card;
  }

  function show(el) {
    const rec = terms && terms[el.dataset.wk];
    if (!rec) return;
    clearTimeout(hideTimer);
    activeEl = el;
    const l = Lang.get() === 'en' ? 'en' : 'tr';
    const c = ensureCard();
    const kInfo = KIND[rec.kind] || KIND.sozluk;
    const kLabel = kInfo[l] || kInfo.tr;
    const kIcon = kInfo.icon || '📜';

    const accent = rec.accent || '#c4962a';
    c.style.setProperty('--wk-accent', accent);

    c.innerHTML =
      '<div class="wk-watermark" aria-hidden="true">' +
        (rec.watermark
          ? '<img src="' + esc(rec.watermark) + '" class="wk-watermark-img" alt="">'
          : '<span class="wk-watermark-glyph">' + esc(rec.watermarkGlyph || kIcon) + '</span>') +
      '</div>' +
      '<div class="wk-top-bar">' +
        '<span class="wk-kind">' + kIcon + ' ' + esc(kLabel) +
        (rec.status ? '<span class="wk-dot ' + esc(rec.status) + '"></span>' : '') + '</span>' +
        '<button type="button" class="wk-close-btn" aria-label="' + (l === 'en' ? 'Close' : 'Kapat') + '">✕</button>' +
      '</div>' +
      '<div class="wk-title">' + esc(rec.title) + '</div>' +
      (rec.sub ? '<div class="wk-sub">' + esc(rec.sub) + '</div>' : '') +
      (rec.body ? '<div class="wk-body">' + esc(rec.body) + '</div>' : '') +
      (rec.url ? '<div class="wk-footer"><a class="wk-go" href="' + esc(rec.url) + '"' + (opts.newTab ? ' target="_blank" rel="noopener"' : '') + '>' +
      (l === 'tr' ? 'Ansiklopedide Aç →' : 'Open in Encyclopedia →') + '</a></div>' : '');

    const cb = c.querySelector('.wk-close-btn');
    if (cb) cb.onclick = function (ev) { ev.stopPropagation(); hideNow(); };

    const isMobile = window.innerWidth <= 640 || coarse();
    if (isMobile) {
      c.classList.add('wk-drawer');
      let scrim = document.getElementById('wk-scrim');
      if (!scrim) {
        scrim = document.createElement('div');
        scrim.id = 'wk-scrim';
        scrim.className = 'wk-scrim';
        scrim.onclick = hideNow;
        document.body.appendChild(scrim);
      }
      scrim.classList.add('on');
      c.style.left = '';
      c.style.top = '';
      c.style.visibility = 'visible';
      requestAnimationFrame(() => c.classList.add('on'));
    } else {
      c.classList.remove('wk-drawer');
      const scrim = document.getElementById('wk-scrim');
      if (scrim) scrim.classList.remove('on');
      c.style.visibility = 'hidden';
      c.classList.add('on');

      const rects = el.getClientRects();
      const r = rects.length ? rects[0] : el.getBoundingClientRect();
      const cw = c.offsetWidth, chh = c.offsetHeight;
      let left = r.left + r.width / 2 - cw / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - cw - 8));
      let top = r.top - chh - 10;
      if (top < 8) top = r.bottom + 10;                       /* yukarıda yer yoksa alta aç */
      top = Math.max(8, Math.min(top, window.innerHeight - chh - 8));
      c.style.left = Math.round(left) + 'px';
      c.style.top = Math.round(top) + 'px';
      c.style.visibility = 'visible';
    }
  }

  function hide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideNow, 160);
  }
  function hideNow() {
    clearTimeout(hideTimer);
    if (card) {
      card.classList.remove('on');
      if (card.classList.contains('wk-drawer')) {
        setTimeout(() => { if (!card.classList.contains('on')) card.style.visibility = 'hidden'; }, 220);
      }
    }
    const scrim = document.getElementById('wk-scrim');
    if (scrim) scrim.classList.remove('on');
    activeEl = null;
  }

  function go(rec, e) {
    if (!rec || !rec.url) return;
    if (opts.newTab || (e && (e.ctrlKey || e.metaKey || e.shiftKey))) window.open(rec.url, '_blank', 'noopener');
    else location.href = rec.url;
  }

  /* Şu an açık olan sayfanın kendi maddesine bağlantı verme */
  function isSelf(rec) {
    if (!rec || !rec.url) return false;
    const cur = R.current();
    if (!cur) return false;
    /* Yeni (#/tür/kimlik) ve eski (?id=) adres biçimleri aynı maddeyi gösterir */
    return rec.url.replace(BASE_PATH, '') === R.href.apply(null, [cur.type].concat(cur.parts));
  }

  /* "İlk geçiş" takibi için: kökte zaten işaretli / elle köprülenmiş varlıkları önceden say */
  function seedSeen(root, seen) {
    root.querySelectorAll('.wk').forEach(el => {
      const rec = terms[el.dataset.wk];
      if (rec) seen[rec.uid] = true;
    });
    root.querySelectorAll('a.bk-wl').forEach(a => {
      seen[norm(a.textContent)] = true;
      const k = WT_KIND[a.dataset.wt];
      if (k && a.dataset.wi) seen[k + ':' + a.dataset.wi] = true;
    });
  }

  /* Bir kökün altındaki metin düğümlerini tarayıp anahtarları sarar. */
  function markup(root, o) {
    if (!terms || !sorted.length || !root) return;
    const once = !!((o && o.once !== undefined) ? o.once : opts.once);
    const scopes = root.matches && root.matches(SCAN_SELECTOR)
      ? [root] : Array.prototype.slice.call(root.querySelectorAll(SCAN_SELECTOR));
    const shared = Object.create(null);
    if (once) seedSeen(root, shared);

    const WORD = /[\p{L}\p{N}]/u;
    const MAX_PER_NODE = 8;   /* aşırı işaretlemeyi önle (yalnızca düğüm başına mod) */

    /* Bir metin parçasındaki EN ERKEN eşleşmeyi bulur.
       Aynı konumda birden çok anahtar varsa en uzunu kazanır
       ("Lun Aldris" → "Lun"den önce gelir). Özel adlar büyük harfle başlamalı. */
    function firstMatch(text) {
      const low = normSafe(text);
      let best = null;
      for (let i = 0; i < sorted.length; i++) {
        const k = sorted[i];
        if (best && best.at === 0) break;                     /* en uzun anahtar zaten başta */
        const rec = terms[k];
        let from = 0, idx;
        while ((idx = low.indexOf(k, from)) >= 0) {
          const before = idx === 0 ? ' ' : text[idx - 1];
          const after = idx + k.length >= text.length ? ' ' : text[idx + k.length];
          if (!WORD.test(before) && !WORD.test(after) && (!rec.cs || isUpper(text[idx]))) {
            if (!best || idx < best.at || (idx === best.at && k.length > best.key.length)) {
              best = { key: k, at: idx };
            }
            break;                                            /* bu anahtar için ilk geçerli yeter */
          }
          from = idx + 1;
        }
      }
      return best;
    }

    scopes.forEach(scope => {
      if (scope.dataset.wkDone === '1') return;
      scope.dataset.wkDone = '1';

      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue || node.nodeValue.length < 3) return NodeFilter.FILTER_REJECT;
          /* Bağlantı, başlık ve mevcut işaretlerin içine girme */
          if (node.parentElement.closest('a, .wk, mark, code, button, h1, h2, h3, figcaption')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      const nodes = [];
      let n;
      while ((n = walker.nextNode())) nodes.push(n);

      nodes.forEach(node => {
        let current = node;
        const seen = once ? shared : Object.create(null);
        let count = 0;

        while (current && (once || count < MAX_PER_NODE)) {
          const text = current.nodeValue;
          if (!text || text.length < 3) break;

          const m = firstMatch(text);
          if (!m) break;

          const rec = terms[m.key];
          const rest = current.splitText(m.at);          /* [önce][eşleşme+sonrası] */
          const tail = rest.splitText(m.key.length);     /* [eşleşme][sonrası]      */

          if (seen[rec.uid] || (once && seen[m.key]) || isSelf(rec)) {
            /* Aynı varlık ikinci kez (ya da kendi sayfası): işaretleme, düz metin bırak ve devam et */
            current = tail;
            continue;
          }
          seen[rec.uid] = true;
          if (once) seen[m.key] = true;

          const span = document.createElement('span');
          span.className = 'wk';
          span.dataset.wk = m.key;
          span.textContent = rest.nodeValue;
          span.tabIndex = 0;
          span.setAttribute('role', 'link');
          rest.parentNode.replaceChild(span, rest);

          current = tail;
          count++;
        }
      });
    });
  }

  /* Dışarıya açılan tarama fonksiyonu — render sonrası çağrılır. */
  /* Sayfa ilk boyandıktan sonra, tarayıcı boştayken çalışır: 5 JSON'un indirilmesi ve
     taranması ana içerikle (LCP/etkileşim) yarışmaz. Döndürülen söz yine tamamlanınca çözülür. */
  function idle(fn) {
    if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 1500 });
    else setTimeout(fn, 200);
  }
  function scan(root, o) {
    root = root || document.body;
    return new Promise((resolve, reject) => {
      idle(() => { build().then(() => markup(root, o)).then(resolve, reject); });
    });
  }

  function onClick(e) {
    const t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('.wk-card')) return;                        /* kart içindeki bağlantı normal çalışır */
    const el = t.closest('.wk');
    if (!el) { if (card && card.classList.contains('on')) hideNow(); return; }
    const rec = terms && terms[el.dataset.wk];
    if (!rec) return;
    e.preventDefault(); e.stopPropagation();
    /* Okumayı bölmeden minik dipnot kartını aç/kapat */
    if (card && card.classList.contains('on') && activeEl === el) {
      hideNow();
    } else {
      show(el);
    }
  }

  function init(o) {
    opts = Object.assign({ newTab: false, once: false }, o || {});

    /* Olay devri: sonradan eklenen işaretler de çalışır */
    document.addEventListener('mouseover', e => {
      if (coarse()) return;                                   /* dokunmatik: yalnızca dokunuşla açılır */
      const el = e.target.closest ? e.target.closest('.wk') : null;
      if (el) show(el);
    });
    document.addEventListener('mouseout', e => {
      if (coarse()) return;
      if (e.target.closest && e.target.closest('.wk')) hide();
    });
    document.addEventListener('focusin', e => {
      if (coarse()) return;
      if (e.target.classList && e.target.classList.contains('wk')) show(e.target);
    });
    document.addEventListener('focusout', e => {
      if (coarse()) return;
      if (e.target.classList && e.target.classList.contains('wk')) hide();
    });
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') hideNow();
      else if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('wk')) {
        const rec = terms && terms[e.target.dataset.wk];
        if (rec) { e.preventDefault(); go(rec, e); }
      }
    });
    window.addEventListener('scroll', () => { if (card && card.classList.contains('on')) hideNow(); }, { passive: true });

    /* Dil değişince işaretleri sıfırla ve yeniden tara */
    document.addEventListener('langchange', () => {
      terms = null; sorted = []; building = null;
      hideNow();
      document.querySelectorAll('[data-wk-done]').forEach(el => { delete el.dataset.wkDone; });
      setTimeout(() => scan(document.body), 250);
    });

    scan(document.body);
  }

  return { init, scan, build, hide: hideNow, terms: () => terms };
})();

/* ── 9b. VERİ ÖNCEDEN YÜKLEME & BAĞLANTI SEZGİSİ (Prefetch on Hover) ── */
const Prefetch = (() => {
  const PREFETCH_MAP = [
    { match: /karakter/i, files: ['characters.json', 'houses.json'] },
    { match: /hane/i, files: ['houses.json'] },
    { match: /bolum|oku\.html/i, files: ['chapters.json', 'book.json'] },
    { match: /lore|evren/i, files: ['lore.json', 'geography.json'] },
    { match: /tanri/i, files: ['lore.json'] },
    { match: /harita/i, files: ['maps.json', 'geography.json'] },
    { match: /soy-agaci/i, files: ['familytree.json', 'characters.json'] },
    { match: /sozler/i, files: ['quotes.json'] }
  ];
  const fetched = Object.create(null);

  function trigger(href) {
    if (!href) return;
    for (let i = 0; i < PREFETCH_MAP.length; i++) {
      const item = PREFETCH_MAP[i];
      if (item.match.test(href)) {
        item.files.forEach(f => {
          if (!fetched[f] && !DataCache[f]) {
            fetched[f] = true;
            loadDataRaw(f).catch(() => {});
          }
        });
      }
    }
  }

  function init() {
    const onEnter = e => {
      const t = e.target;
      if (!t || !t.closest) return;
      const a = t.closest('a, .wk, .sr-item, [data-page]');
      if (!a) return;
      const href = a.getAttribute('href') || a.getAttribute('data-page') || (a.dataset && a.dataset.wk ? 'karakter' : '');
      if (href) trigger(href);
    };
    document.addEventListener('pointerenter', onEnter, { passive: true, capture: true });
    document.addEventListener('touchstart', onEnter, { passive: true });
  }

  return { init, trigger };
})();

/* ── 9c. METİN SEÇİMİNDE HIZLI TANIM (Selection Lookup) ─────── */
const SelectionLookup = (() => {
  let bubble = null;
  let activeText = '';

  function ensureBubble() {
    if (bubble) return bubble;
    bubble = document.createElement('div');
    bubble.id = 'sw-selection-bubble';
    bubble.className = 'sw-sel-bubble';
    bubble.innerHTML = '<button type="button" class="sw-sel-btn" id="sw-sel-search">' +
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>' +
      '<span class="sw-sel-lbl">Ansiklopedide Ara</span></button>';
    document.body.appendChild(bubble);
    bubble.querySelector('#sw-sel-search').addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      const q = activeText;
      hide();
      Search.open(q);
    });
    return bubble;
  }

  function hide() {
    if (bubble) bubble.classList.remove('on');
    activeText = '';
  }

  function check() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      hide();
      return;
    }
    const text = sel.toString().trim();
    if (text.length < 2 || text.length > 50) {
      hide();
      return;
    }
    const anchor = sel.anchorNode && (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode);
    if (!anchor || !anchor.closest('.book-body, .rd-article, .art-p, .lc, .cc-desc, main, article')) {
      hide();
      return;
    }
    activeText = text;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) { hide(); return; }

    const b = ensureBubble();
    const l = Lang.get();
    const cleanT = text.slice(0, 16) + (text.length > 16 ? '…' : '');
    b.querySelector('.sw-sel-lbl').textContent = l === 'tr' ? `“${cleanT}” Ara` : `Search “${cleanT}”`;
    b.classList.add('on');

    const bw = b.offsetWidth || 150;
    const bh = b.offsetHeight || 34;
    let left = rect.left + rect.width / 2 - bw / 2;
    left = Math.max(10, Math.min(left, window.innerWidth - bw - 10));
    let top = rect.top - bh - 8;
    if (top < 10) top = rect.bottom + 8;
    b.style.left = Math.round(left) + 'px';
    b.style.top = Math.round(top) + 'px';
  }

  function init() {
    document.addEventListener('mouseup', () => setTimeout(check, 30));
    document.addEventListener('touchend', () => setTimeout(check, 80));
    document.addEventListener('mousedown', e => {
      if (bubble && !bubble.contains(e.target)) hide();
    });
    window.addEventListener('scroll', () => { if (bubble && bubble.classList.contains('on')) hide(); }, { passive: true });
  }

  return { init, hide };
})();

/* ── 10. AÇILIŞ ──────────────────────────────────────────────── */
function initWiki(options) {
  options = options || {};
  const doFooter = options.injectFooter !== false;

  injectNav();
  injectSearchOverlay();
  injectScrollUp();
  if (doFooter) injectFooter();

  initNav();
  initLang(options.onLangChange);
  initTheme();
  initFontSize();
  Search.init();
  initFaq();
  Prefetch.init();
  SelectionLookup.init();

  if (options.tooltips !== false) Tooltip.init(options.tooltipOpts);
  showDraftBadge();
  initPWA();

  /* Topluluk katmanı (giriş, yorum, öneri) — community.js yüklüyse ve
     config.js doldurulmuşsa devreye girer; aksi halde site eskisi gibidir. */
  if (window.Wiki && window.Wiki.Community && window.Wiki.Community.init) {
    try { window.Wiki.Community.init(); }
    catch (e) { console.warn('Topluluk katmanı başlatılamadı:', e); }
  }
}

/* Yerel (yayınlanmamış) taslak varsa kullanıcıyı bilgilendir. */
function showDraftBadge() {
  const files = Store.overriddenFiles();
  if (!files.length || document.getElementById('sw-draft-badge')) return;
  const b = document.createElement('div');
  b.id = 'sw-draft-badge';
  b.innerHTML = '<span>Yerel taslak görüntüleniyor (' + files.length + ' dosya)</span>';
  document.body.appendChild(b);
}

/* Progressive Web App (PWA) — Service Worker & Yükleme Desteği */
function initPWA() {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          // SW registered
        })
        .catch(err => {
          console.warn('[PWA] Service Worker registration warning:', err);
        });
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPWAInstallPrompt = e;
    document.querySelectorAll('.pwa-install-btn, [data-act="install-pwa"]').forEach(btn => {
      btn.hidden = false;
      btn.onclick = () => {
        if (window.deferredPWAInstallPrompt) {
          window.deferredPWAInstallPrompt.prompt();
          window.deferredPWAInstallPrompt.userChoice.then(() => {
            window.deferredPWAInstallPrompt = null;
            btn.hidden = true;
          });
        }
      };
    });
  });
}

/* Görsel kaynağı doğrulaması: yalnızca depo yolu, http(s) veya data:image/png|jpeg|webp|gif.
   javascript: gibi şemalar ve protokol-göreli (//) adresler boş döner. */
const IMG_OK = /^(data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+|(?!\/\/)(?![a-z][a-z0-9+.-]*:)[^\s"'<>]+|https?:\/\/[^\s"'<>]+)$/i;
function safeImg(src) {
  src = String(src || '').trim();
  return src && IMG_OK.test(src) ? src : '';
}

/* -- Görsel optimizasyonu: WebP + srcset -----------------------------
   assets/images/manifest.json'u scripts/optimize-images.py (ve GitHub
   Action'ı) üretir: "orijinal yol → WebP + küçük boyutlar".
   • JSON'daki yollar DEĞİŞMEZ (.png/.jpg kalır). Manifestte karşılığı varsa
     WebP + srcset kullanılır; yoksa orijinal gösterilir → hiçbir görsel kırılmaz.
   • Manifest loadData ile birlikte beklenir; sayfa render'ı başladığında hazırdır.
   • WebP dosyası herhangi bir nedenle yüklenemezse orijinale düşülür.
   Kullanım (HTML şablonunda):  <img ${Wiki.imgAttrs(src, '(max-width:600px) 90vw, 320px')} alt="…">
   imgAttrs; src, srcset, sizes, loading="lazy" ve decoding="async" üretir.
   { eager: true } → sayfanın en üstündeki görsel için lazy'yi kapatır. */
const Img = (() => {
  let map = null;
  const ready = fetchJSON(BASE_PATH + 'assets/images/manifest.json', 6000)
    .then(m => { map = (m && m.images) || null; }, () => { map = null; });

  function entry(src) {
    if (!map) return null;
    const s = String(src || '').trim();
    if (map[s]) return map[s];
    try { const d = decodeURI(s); if (map[d]) return map[d]; } catch (e) {}
    return null;
  }
  function url(src) { const e = entry(src); return e ? e.u : src; }

  function attrs(src, sizes, opts) {
    opts = opts || {};
    const raw = safeImg(src);
    if (!raw) return '';
    const local = !/^(data:|https?:)/i.test(raw);
    const pre = local ? (opts.base || '') : '';
    const e = local ? entry(raw) : null;
    let a = 'src="' + esc(pre + (e ? e.u : raw)) + '"';
    if (e) {
      if (e.s && e.s.length) {
        const parts = e.s.map(v => encodeURI(pre + v[1]) + ' ' + v[0] + 'w');
        parts.push(encodeURI(pre + e.u) + ' ' + e.w + 'w');
        a += ' srcset="' + esc(parts.join(', ')) + '" sizes="' + esc(sizes || '100vw') + '"';
      }
      a += ' data-orig="' + esc(pre + raw) + '"';
    }
    return a + (opts.eager ? ' decoding="async"' : ' loading="lazy" decoding="async"');
  }

  /* WebP açılmazsa orijinale dön (bir kez); orijinal de açılmazsa sayfanın
     kendi onerror işleyicisi çalışır. */
  window.addEventListener('error', ev => {
    const im = ev.target;
    if (!im || im.tagName !== 'IMG' || !im.dataset || !im.dataset.orig || im.dataset.fb) return;
    im.dataset.fb = '1';
    im.removeAttribute('srcset'); im.removeAttribute('sizes');
    im.src = im.dataset.orig;
    ev.stopImmediatePropagation();
  }, true);

  return { ready, url, attrs };
})();

/* ── Tanrı sembol görseli ─────────────────────────────────────
   tanrilar.html (yuvarlak düğümler) ve tanri-detay.html (amblem +
   karşı kutup kartı) aynı görseli buradan alır; böylece iki sayfa
   hiçbir zaman birbirinden ayrışmaz.

   Kaynak sırası:
     1) lore.json → gods[].image   (yönetim panelinden belirlenir;
        depo yolu veya taslak olarak yüklenmiş data: URL)
     2) assets/images/gods/<id>.png
     3) assets/images/gods/<id>.jpg
   Hiçbiri yüklenemezse <img> kaldırılır ve sayfadaki baş harf rozeti
   görünür kalır. */
const GOD_IMG_DIR = 'assets/images/gods/';
function godImgSources(g) {
  const out = [];
  if (!g) return out;
  const own = safeImg(g.image);
  if (own) out.push(own);
  if (g.id && /^[a-z0-9_-]+$/i.test(g.id)) {
    ['png', 'jpg'].forEach(ext => out.push(GOD_IMG_DIR + g.id + '.' + ext));
  }
  return out.filter((v, i, a) => a.indexOf(v) === i);
}
function godImgHTML(g) {
  const list = godImgSources(g);
  if (!list.length) return '';
  return '<img class="god-img" ' + Img.attrs(list[0], '240px') + ' data-alt="' +
    esc(JSON.stringify(list.slice(1))) + '" alt="">';
}
/* godImgHTML ile üretilmiş görselleri bağlar: yüklenemezse sıradaki
   kaynağı dener, hepsi biterse görseli kaldırır. Aynı kapsayıcıda
   tekrar çağrılması güvenlidir. */
function wireGodImgs(root) {
  (root || document).querySelectorAll('img.god-img').forEach(img => {
    if (img.dataset.wired) return;
    img.dataset.wired = '1';
    const next = () => {
      let rest = [];
      try { rest = JSON.parse(img.dataset.alt || '[]'); } catch (e) {}
      if (!rest.length) { img.remove(); return; }
      img.dataset.alt = JSON.stringify(rest.slice(1));
      img.removeAttribute('srcset'); img.src = Img.url(rest[0]);
    };
    img.addEventListener('error', next);
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) next();
  });
}

/* ── KİTAP METNİ (okuma sayfası + admin önizlemesi ortak motoru) ─────
   Bölüm metni küçük, güvenli bir Markdown alt kümesiyle saklanır:

     **kalın**   *italik*   ***kalın italik***
     ## Başlık   ### Alt başlık
     > alıntı (ardışık > satırları tek blok; boş ">" satırı paragraf ayırır)
     ---         sahne ayracı (* * * da olur)
     ![Alt yazı](img:g1 "boyut=orta hiza=sag")   görsel (boyut: kucuk|orta|tam,
                                                  hiza: sol|orta|sag)
     [Erthan](wiki:character:erthan)             Wiki köprüsü (kalın + yeni sekme)
     [metin](https://…)                          dış bağlantı (yeni sekme)
     \*  \[  \]  \\                              kaçış (harfi olduğu gibi yazar)

   Metin ASLA ham HTML olarak yorumlanmaz: her şey önce kaçışlanır, yalnızca
   bu motorun ürettiği etiketler çıkar. Bozuk/eşleşmeyen işaretler düz metin
   kalır; render() hiçbir girdide hata fırlatmaz. */
const Book = (() => {
  const LINK_TYPES = {
    character: { label: 'Karakter', href: id => R.href('karakter', id) },
    god:       { label: 'Tanrı',    href: id => R.href('tanri', id) },
    house:     { label: 'Hane',     href: id => R.href('hane', id) },
    kingdom:   { label: 'Devlet',   href: id => R.href('devlet', id) },
    place:     { label: 'Şehir / Eyalet', href: id => R.href('evren', 'yer-' + id) }
  };
  const ID_OK = /^[A-Za-z0-9_-]+$/;
  const ESCAPABLE = '*[]\\>#!-';

  function slug(str) {
    const map = { 'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g', 'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c' };
    return String(str || '').replace(/[ıİşŞğĞüÜöÖçÇ]/g, m => map[m])
      .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 60);
  }

  function linkHref(type, id) {
    const t = LINK_TYPES[type];
    if (!t || !ID_OK.test(String(id || ''))) return '';
    return BASE_PATH + t.href(id);
  }

  /* ── satır içi ── */
  function findClose(s, from, k) {
    if (from >= s.length || s[from] === ' ' || s[from] === '\n') return -1;
    let j = from;
    while (j < s.length) {
      const c = s[j];
      if (c === '\\' && ESCAPABLE.indexOf(s[j + 1]) >= 0) { j += 2; continue; }
      if (c === '*') {
        let r = 1; while (s[j + r] === '*') r++;
        if (r === k && j > from && s[j - 1] !== ' ') return j;
        j += r; continue;
      }
      j++;
    }
    return -1;
  }
  function matchLink(s, i) {
    const n = s.length; let j = i + 1;
    while (j < n) {
      const c = s[j];
      if (c === '\\') { j += 2; continue; }
      if (c === '[') return null;
      if (c === ']') break;
      j++;
    }
    if (j >= n || s[j + 1] !== '(') return null;
    const close = s.indexOf(')', j + 2);
    if (close < 0) return null;
    const href = s.slice(j + 2, close);
    if (!href || /\s/.test(href)) return null;
    return { label: s.slice(i + 1, j), href: href, end: close + 1 };
  }
  function renderLink(m, depth) {
    const inner = inl(m.label, depth + 1);
    const w = /^wiki:([a-z]+):([A-Za-z0-9_-]+)$/.exec(m.href);
    if (w && LINK_TYPES[w[1]]) {
      const u = linkHref(w[1], w[2]);
      if (u) return '<a class="bk-wl" data-wt="' + w[1] + '" data-wi="' + esc(w[2]) + '" href="' + esc(u) +
        '" target="_blank" rel="noopener noreferrer"><strong>' + inner + '</strong></a>';
    }
    if (/^https?:\/\/[^\s"'<>]+$/i.test(m.href)) {
      return '<a class="bk-ext" href="' + esc(m.href) + '" target="_blank" rel="noopener noreferrer nofollow">' + inner + '</a>';
    }
    return inner;
  }
  function inl(s, depth) {
    depth = depth || 0;
    if (depth > 6) return esc(s);
    let out = '', i = 0; const n = s.length;
    while (i < n) {
      const ch = s[i];
      if (ch === '\\' && i + 1 < n && ESCAPABLE.indexOf(s[i + 1]) >= 0) { out += esc(s[i + 1]); i += 2; continue; }
      if (ch === '[') {
        const m = matchLink(s, i);
        if (m) { out += renderLink(m, depth); i = m.end; continue; }
      }
      if (ch === '*') {
        let run = 1; while (s[i + run] === '*') run++;
        if (run > 3) { out += '*'.repeat(run); i += run; continue; }
        const close = findClose(s, i + run, run);
        if (close > 0 && s.slice(i + run, close).trim()) {
          const inner = inl(s.slice(i + run, close), depth + 1);
          out += run === 1 ? '<em>' + inner + '</em>' : run === 2 ? '<strong>' + inner + '</strong>' : '<strong><em>' + inner + '</em></strong>';
          i = close + run; continue;
        }
        out += '*'.repeat(run); i += run; continue;
      }
      out += esc(ch); i++;
    }
    return out;
  }
  function stripInline(s) {
    return String(s || '').replace(/\[([^\]]*)\]\([^)\s]*\)/g, '$1').replace(/\\([*\[\]\\>#!-])/g, '$1').replace(/\*+/g, '');
  }

  /* ── bloklar ── */
  function figure(alt, src, title, images) {
    let url = '';
    const km = /^img:([A-Za-z0-9_-]+)$/.exec(src);
    url = safeImg(km ? (images || {})[km[1]] : src);
    if (!url) return '<div class="bk-missing" role="note">Görsel bulunamadı</div>';
    const rawUrl = url, rel = !/^(data:|https?:)/i.test(url);
    const size = (/boyut=(kucuk|orta|tam)/.exec(title || '') || [])[1] || 'orta';
    const al = (/hiza=(sol|orta|sag)/.exec(title || '') || [])[1] || 'orta';
    return '<figure class="bk-fig bk-s-' + size + ' bk-a-' + al + '"><img ' +
      Img.attrs(rawUrl, '(max-width:760px) 100vw, 760px', { base: rel ? BASE_PATH : '' }) + ' alt="' +
      esc(stripInline(alt)) + '">' +
      (String(alt).trim() ? '<figcaption>' + inl(alt) + '</figcaption>' : '') + '</figure>';
  }

  function renderBlocks(md, images) {
    const lines = md.replace(/\r\n?/g, '\n').split('\n');
    const html = []; let para = [];
    const flush = () => {
      if (para.length) { html.push('<p>' + para.map(l => inl(l.trim())).join('<br>') + '</p>'); para = []; }
    };
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      if (!t) { flush(); continue; }
      if (t.charAt(0) === '>') {
        flush();
        const ps = []; let cur = [];
        while (i < lines.length && lines[i].trim().charAt(0) === '>') {
          const c = lines[i].trim().replace(/^>\s?/, '').trim();
          if (!c) { if (cur.length) { ps.push(cur); cur = []; } } else cur.push(c);
          i++;
        }
        i--; if (cur.length) ps.push(cur);
        html.push('<blockquote class="bk-quote">' + ps.map(p => '<p>' + p.map(l => inl(l)).join('<br>') + '</p>').join('') + '</blockquote>');
        continue;
      }
      let m;
      if ((m = /^(#{2,3})\s+(.+)$/.exec(t))) { flush(); const lv = m[1].length; html.push('<h' + lv + ' class="bk-h' + lv + '">' + inl(m[2]) + '</h' + lv + '>'); continue; }
      if (/^(-{3,}|(\*\s*){3,})$/.test(t)) { flush(); html.push('<hr class="bk-break">'); continue; }
      if ((m = /^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)$/.exec(t))) { flush(); html.push(figure(m[1], m[2], m[3], images)); continue; }
      para.push(lines[i]);
    }
    flush();
    return html.join('\n');
  }

  function render(md, opts) {
    try { return renderBlocks(String(md || ''), (opts && opts.images) || {}); }
    catch (e) {
      console.warn('Kitap metni işlenemedi:', e);
      return '<p>' + esc(String(md || '')).replace(/\n{2,}/g, '</p><p>') + '</p>';
    }
  }

  /* ── ölçüler ── */
  function plain(md) {
    return String(md || '').replace(/^!\[[^\]]*\]\([^)]*\)\s*$/gm, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/^>\s?/gm, '').replace(/^#{2,3}\s+/gm, '').replace(/\\([*\[\]\\>#!-])/g, '$1').replace(/\*+/g, '');
  }
  function words(md) { const m = plain(md).match(/[\p{L}\p{N}]+/gu); return m ? m.length : 0; }
  function minutes(md) { return Math.max(1, Math.round(words(md) / 200)); }

  /* ── Wiki dizini (köprü seçici, otomatik öneri, kırık bağlantı denetimi) ── */
  const TITLE_WORDS = ['İmparator', 'İmparatoriçe', 'Melik', 'Kral', 'Kraliçe', 'Prens', 'Prenses', 'Lord', 'Lady', 'Vali',
    'Kağan', 'Han', 'Hanım', 'Bey', 'Kont', 'Dük', 'Şövalye', 'Komutan', 'General', 'Rahip', 'Başrahip', 'Kâhin', 'Usta', 'Genç', 'Yaşlı'];
  const tr = o => (o && (o.tr || o.en)) || '';

  function variantsOf(name) {
    const out = [];
    String(name || '').split('/').forEach(part => {
      let p = part.trim().replace(/^[IVXL]+\.\s*/, '');
      const paren = /\(([^)]+)\)/.exec(p);
      const base = p.replace(/\s*\([^)]*\)/g, '').trim();
      if (base) out.push(base);
      if (paren && !/[.=]|---/.test(paren[1]) && paren[1].trim().split(/\s+/).length <= 3) out.push(paren[1].trim());
    });
    return out;
  }

  async function buildIndex() {
    const idx = [];
    const add = (type, id, name, sub, names) => {
      if (!id || !name) return;
      idx.push({ type: type, id: String(id), name: name, sub: sub || '', names: names });
    };
    const safe = async (file, fn) => { try { fn(await loadData(file)); } catch (e) { console.warn('Wiki dizini:', file, e && e.message); } };

    await safe('characters.json', d => {
      const list = d.characters || [];
      const tokCount = {};
      list.forEach(c => variantsOf(tr(c.name)).forEach(v => v.split(/\s+/).forEach(t => { tokCount[t] = (tokCount[t] || 0) + 1; })));
      list.forEach(c => {
        const names = [];
        variantsOf(tr(c.name)).forEach(v => {
          names.push(v);
          const toks = v.split(/\s+/);
          if (toks.length > 1) toks.forEach(t => {
            if (t.length >= 4 && tokCount[t] < 3 && TITLE_WORDS.indexOf(t) < 0 && /^\p{Lu}/u.test(t)) names.push(t);
          });
        });
        add('character', c.id, tr(c.name), tr(c.house), names);
      });
    });
    await safe('lore.json', d => (d.gods || []).forEach(g => {
      const names = [g.trueName, tr(g.epithet)].filter(Boolean);
      add('god', g.id, (tr(g.epithet) ? tr(g.epithet) + ' — ' : '') + (g.trueName || ''), 'Tanrı', names);
    }));
    await safe('houses.json', d => (d.provinces || []).forEach(p => (p.houses || []).forEach(h =>
      add('house', h.id, h.name, tr(p.name), variantsOf(h.name)))));
    await safe('kingdoms.json', d => (d.kingdoms || []).forEach(k => {
      const nm = tr(k.name), names = variantsOf(nm);
      const first = nm.split(/\s+/)[0];
      if (first && first.length >= 5 && first !== nm) names.push(first);
      add('kingdom', k.id, nm, 'Devlet', names);
    }));
    await safe('geography.json', d => (d.provinces || []).forEach(p => {
      const pid = slug(p.name);
      if (!pid) return;
      add('place', pid, p.name, 'Eyalet', variantsOf(p.name));
      String(p.cities || '').split(/[,;]/).forEach(c => {
        const cn = c.replace(/\s*\([^)]*\)/g, '').replace(/---.*$/, '').trim();
        if (cn.length >= 3 && cn.split(/\s+/).length <= 3) add('place', pid, cn, 'Şehir · ' + p.name.replace(/\s*\([^)]*\)/, ''), [cn]);
      });
    }));
    return idx;
  }

  /* Korunan aralıklar: mevcut köprüler, görsel satırları, başlıklar, kaçışlar */
  function mask(md) {
    const a = md.split('');
    const cover = (re) => { let m; while ((m = re.exec(md))) for (let k = m.index; k < m.index + m[0].length; k++) a[k] = '\u0000'; };
    cover(/\[[^\]\n]*\]\([^)\s\n]*\)/g);
    cover(/^!\[[^\n]*$/gm);
    cover(/^#{2,3}[^\n]*$/gm);
    cover(/\\[*\[\]\\>#!-]/g);
    return a.join('');
  }
  const LETTER = /[\p{L}\p{N}]/u;
  function occurrences(md, variant, taken, masked) {
    masked = masked || mask(md);
    const res = []; let from = 0;
    while (true) {
      const p = masked.indexOf(variant, from);
      if (p < 0) break;
      from = p + 1;
      const before = p > 0 ? masked[p - 1] : '', after = masked[p + variant.length] || '';
      if ((before && LETTER.test(before)) || (after && LETTER.test(after))) continue;
      let clash = false;
      if (taken) for (let k = p; k < p + variant.length; k++) if (taken[k]) { clash = true; break; }
      if (!clash) res.push(p);
    }
    return res;
  }

  /* Metinde geçen, henüz bağlanmamış Wiki adlarını bulur */
  function suggest(md, index) {
    md = String(md || '');
    const map = new Map();
    index.forEach(e => (e.names || []).forEach(v => {
      v = String(v || '').trim();
      if (v.length < 3) return;
      if (!map.has(v)) map.set(v, []);
      const arr = map.get(v);
      if (!arr.some(x => x.type === e.type && x.id === e.id)) arr.push(e);
    }));
    const taken = new Array(md.length).fill(false);
    const masked = mask(md);
    const found = [];
    Array.from(map.keys()).sort((a, b) => b.length - a.length).forEach(v => {
      const occ = occurrences(md, v, taken, masked);
      if (!occ.length) return;
      occ.forEach(p => { for (let k = p; k < p + v.length; k++) taken[k] = true; });
      const cands = map.get(v).map(e => ({ type: e.type, id: e.id, name: e.name, sub: e.sub }));
      found.push({ text: v, count: occ.length, cands: cands, ambiguous: cands.length > 1 });
    });
    return found.sort((a, b) => b.count - a.count || a.text.localeCompare(b.text, 'tr'));
  }

  /* picks: [{ text, type, id, all }] — all=false ise yalnızca ilk geçtiği yer bağlanır */
  function applyLinks(md, picks) {
    md = String(md || '');
    const taken = new Array(md.length).fill(false);
    const masked = mask(md);
    const edits = [];
    picks.slice().sort((a, b) => b.text.length - a.text.length).forEach(pk => {
      if (!LINK_TYPES[pk.type] || !ID_OK.test(pk.id)) return;
      let occ = occurrences(md, pk.text, taken, masked);
      if (!pk.all) occ = occ.slice(0, 1);
      occ.forEach(p => {
        for (let k = p; k < p + pk.text.length; k++) taken[k] = true;
        edits.push({ p: p, len: pk.text.length, rep: '[' + pk.text + '](wiki:' + pk.type + ':' + pk.id + ')' });
      });
    });
    edits.sort((a, b) => b.p - a.p).forEach(e => { md = md.slice(0, e.p) + e.rep + md.slice(e.p + e.len); });
    return md;
  }

  function findLinks(md) {
    const out = [], re = /\[([^\]\n]*)\]\(wiki:([a-z]+):([A-Za-z0-9_-]+)\)/g; let m;
    while ((m = re.exec(String(md || '')))) out.push({ label: m[1], type: m[2], id: m[3] });
    return out;
  }

  return { LINK_TYPES, TITLE_WORDS, slug, linkHref, render, plain, words, minutes, buildIndex, suggest, applyLinks, findLinks, stripInline };
})();

/* ── ETİKET (TAGS) SİSTEMİ ───────────────────────────────────────
   Karakter / hane / krallık / tanrı verilerinde ortak "tags"
   dizisini besleyen sabit havuz. Tema temelli, kişi/hane/krallık
   arası anlatısal ortaklıkları yakalar (group/tier/status'un
   yakalamadığı boyut). Yeni sayfalarda da aynı havuzu kullanmak
   için buradan (Wiki.Tags) tüketilir. */
const TAG_DEFS = [
  { id: 'savas',              tr: 'Savaş',                   en: 'War' },
  { id: 'din',                tr: 'Din & İnanç',             en: 'Religion & Faith' },
  { id: 'ihanet',             tr: 'İhanet',                  en: 'Betrayal' },
  { id: 'ask',                tr: 'Aşk',                     en: 'Romance' },
  { id: 'suikast-casusluk',   tr: 'Suikast & Casusluk',      en: 'Assassination & Espionage' },
  { id: 'saray-entrikasi',    tr: 'Saray Entrikası',         en: 'Court Intrigue' },
  { id: 'isyan',              tr: 'İsyan',                   en: 'Rebellion' },
  { id: 'surgun',             tr: 'Sürgün',                  en: 'Exile' },
  { id: 'miras-veraset',      tr: 'Miras & Veraset',         en: 'Legacy & Succession' },
  { id: 'ittifak-diplomasi',  tr: 'İttifak & Diplomasi',     en: 'Alliance & Diplomacy' },
  { id: 'ticaret',            tr: 'Ticaret',                 en: 'Trade' },
  { id: 'buyu-mit',           tr: 'Büyü & Mit',              en: 'Magic & Myth' },
  { id: 'sinir-bolgesi',      tr: 'Sınır Bölgesi',           en: 'Borderland' }
];
const Tags = (function () {
  function label(id, l) {
    const d = TAG_DEFS.find(x => x.id === id);
    if (!d) return id;
    return (l === 'tr' ? d.tr : d.en) || d.tr;
  }
  /* Çip barı üretir. activeSet: Set<string>. onToggle(id) tıklamada çağrılır.
     onlyPresent: yalnızca verilen id listesinde en az bir kez geçen etiketleri göster. */
  function chipsHTML(activeSet, l, onlyPresentIds) {
    let defs = TAG_DEFS;
    if (onlyPresentIds) {
      const present = new Set(onlyPresentIds);
      defs = TAG_DEFS.filter(d => present.has(d.id));
    }
    return defs.map(d => `<button class="f-btn tag-chip${activeSet.has(d.id) ? ' on' : ''}" data-tag="${d.id}">${esc(l === 'tr' ? d.tr : d.en)}</button>`).join('');
  }
  /* OR mantığı: activeSet boşsa herkes geçer; doluysa itemTags ile en az 1 kesişim gerekir. */
  function matches(itemTags, activeSet) {
    if (!activeSet || activeSet.size === 0) return true;
    if (!itemTags || !itemTags.length) return false;
    for (let i = 0; i < itemTags.length; i++) if (activeSet.has(itemTags[i])) return true;
    return false;
  }
  return { defs: TAG_DEFS, label, chipsHTML, matches };
})();

window.Wiki = {
  LivePatches,
  Lang, Theme, FontSize, loadData, Store, Search, Tooltip, Bookmarks, ReadTracker, Book,
  initWiki, injectNav, groupClass, esc, safeImg, godImgHTML, wireGodImgs, godImgSources,
  getBasePath, BASE_PATH, renderError, showFatal, Tags, Prefetch, SelectionLookup,
  Img, imgAttrs: Img.attrs, imgUrl: Img.url
};

})();
