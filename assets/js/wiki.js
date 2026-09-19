/* ═══════════════════════════════════════════════════════════════
   STALLHART WIKI — Ortak JS Modülü  v7
   ---------------------------------------------------------------
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
    document.querySelectorAll('[data-theme-btn]').forEach(b => {
      b.innerHTML = ICON[t];
      b.setAttribute('aria-label', t === 'light' ? 'Karanlık moda geç' : 'Işık moduna geç');
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

/* ── 4. DİL ──────────────────────────────────────────────────── */
const Lang = (() => {
  let current = 'tr';
  try { current = localStorage.getItem('sw-lang') || 'tr'; } catch (e) {}
  if (current !== 'tr' && current !== 'en') current = 'tr';

  function get() { return current; }
  function set(l) {
    if (l !== 'tr' && l !== 'en') return;
    current = l;
    try { localStorage.setItem('sw-lang', l); } catch (e) {}
    document.documentElement.lang = l;
    document.querySelectorAll('[data-lang-btn]').forEach(b => {
      b.textContent = l === 'tr' ? 'EN' : 'TR';
    });
    document.querySelectorAll('.nav-links a[data-tr]').forEach(a => {
      a.textContent = l === 'tr' ? a.dataset.tr : a.dataset.en;
    });
    document.dispatchEvent(new CustomEvent('langchange', { detail: l }));
  }
  function toggle() { set(current === 'tr' ? 'en' : 'tr'); }
  function t(obj) {
    if (obj === null || obj === undefined) return '';
    if (typeof obj === 'string' || typeof obj === 'number') return String(obj);
    if (Array.isArray(obj)) return obj;
    return obj[current] !== undefined ? obj[current]
         : obj.tr !== undefined ? obj.tr
         : obj.en !== undefined ? obj.en
         : '';
  }
  return { get, set, toggle, t };
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

async function fetchJSON(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' · ' + url);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function loadData(file) {
  if (DataCache[file]) return DataCache[file];

  /* Yerel taslak varsa ağa hiç gitme */
  const local = Store.read(file);
  if (local) { DataCache[file] = local; return local; }

  const url = BASE_PATH + 'data/' + file;

  /* İlk deneme, ardından kısa bir aradan sonra bir kez daha dene.
     Geçici ağ dalgalanmaları (mobilde sık görülür) tek denemeyle
     sayfayı hatalı biçimde "veri yok" durumuna düşürmesin. */
  try {
    const data = await fetchJSON(url, 12000);
    DataCache[file] = data;
    return data;
  } catch (err1) {
    await new Promise(r => setTimeout(r, 700));
    try {
      const data = await fetchJSON(url, 12000);
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
  let index = [], fuse = null, loaded = false, building = null, focusIdx = -1;

  function push(o) { index.push(o); }

  async function buildIndex() {
    if (loaded) return;
    if (building) return building;
    building = (async () => {
      const base = BASE_PATH;
      const jobs = [
        ['characters.json', d => (d.characters || []).forEach(c => push({
          type: 'karakter', typeLabel: { tr: 'Karakter', en: 'Character' },
          id: c.id,
          name: Lang.t(c.name),
          sub: [Lang.t(c.house), Lang.t(c.title)].filter(Boolean).join(' · '),
          bio: String(Lang.t(c.bio)).substring(0, 120),
          url: base + 'karakter-sablon.html?id=' + c.id
        }))],
        ['chapters.json', d => (d.chapters || []).forEach(ch => push({
          type: 'bolum', typeLabel: { tr: 'Bölüm', en: 'Chapter' },
          id: 'b' + ch.id,
          name: ch.num + '. ' + Lang.t(ch.title),
          sub: String(Lang.t(ch.pov) || ''),
          bio: String(Lang.t(ch.synopsis) || '').substring(0, 120),
          url: base + 'bolumler.html#bolum-' + ch.id
        }))],
        ['lore.json', d => (d.glossary || []).forEach(g => push({
          type: 'sozluk', typeLabel: { tr: 'Sözlük', en: 'Glossary' },
          id: g.id,
          name: Lang.t(g.term),
          sub: String(g.type || ''),
          bio: String(Lang.t(g.def) || '').substring(0, 120),
          url: base + 'lore.html#' + g.id
        }))],
        ['houses.json', d => (d.provinces || []).forEach(p => (p.houses || []).forEach(h => push({
          type: 'hane', typeLabel: { tr: 'Hane', en: 'House' },
          id: h.id,
          name: h.name + ' — ' + Lang.t(h.meaning),
          sub: String(Lang.t(p.name) || ''),
          bio: String(Lang.t(h.desc) || '').substring(0, 120),
          url: base + 'haneler.html'
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
          url: base + 'tanri-detay.html?id=' + g.id
        }))]
      ];

      /* Bir dosya düşerse diğerleri yine de indekslensin. */
      for (const [file, fn] of jobs) {
        try { fn(await loadData(file)); }
        catch (e) { console.warn('Arama indeksi:', file, e.message); }
      }

      loaded = true;
      await loadFuse();
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

  function init() {
    const overlay = document.getElementById('search-overlay');
    const input   = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    if (!overlay || !input || !results) return;

    function open() {
      overlay.classList.add('open');
      input.focus();
      render('', []);
      buildIndex().then(() => {
        const q = input.value.trim();
        if (q) render(q, query(q));
      });
    }
    function close() {
      overlay.classList.remove('open');
      input.value = '';
      results.innerHTML = '';
      focusIdx = -1;
    }
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

    document.querySelectorAll('[data-search-btn]').forEach(b => b.addEventListener('click', open));
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        overlay.classList.contains('open') ? close() : open();
      }
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  }

  return { init, buildIndex };
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
  document.body.insertAdjacentHTML('beforeend',
    '<div class="search-overlay" id="search-overlay" role="dialog" aria-label="Arama">' +
    '<div class="search-box" role="search"><div class="search-input-wrap">' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
    '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>' +
    '<input type="search" id="search-input" placeholder="Karakter, bölüm, hane, terim…" autocomplete="off" spellcheck="false">' +
    '<kbd id="search-close-kbd">Esc</kbd></div><div id="search-results"></div>' +
    '<div class="search-footer"><span>↑↓ Gezin</span><span>↵ Git</span><span>Esc Kapat</span></div>' +
    '</div></div>');
}

function injectScrollUp() {
  if (document.getElementById('scroll-up')) return;
  document.body.insertAdjacentHTML('beforeend',
    '<button class="up" id="scroll-up" type="button" aria-label="Yukarı çık">' +
    '<svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg></button>');
}

function injectFooter() {
  if (document.getElementById('site-footer')) return;
  document.body.insertAdjacentHTML('beforeend',
    '<footer id="site-footer"><p>Stallhart Evreni · Son İmparator</p>' +
    '<small>© ' + new Date().getFullYear() + ' craesx — Tüm hakları saklıdır.</small></footer>');
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
    '<button class="nav-search-btn" type="button" data-search-btn aria-label="Arama">' +
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
    '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>Ara <kbd>Ctrl K</kbd></button>' +
    '<button class="lang-btn" type="button" data-lang-btn>' + (l === 'tr' ? 'EN' : 'TR') + '</button>' +
    '<button class="theme-btn" type="button" data-theme-btn aria-label="Tema değiştir">' + Theme.icon() + '</button>' +
    '<button class="nav-ham" id="nav-ham" type="button" aria-label="Menü" aria-expanded="false">' +
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

  const up = document.getElementById('scroll-up');
  if (up) {
    window.addEventListener('scroll',
      () => up.classList.toggle('vis', window.scrollY > 400), { passive: true });
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
}

function initLang(onChangeCb) {
  document.documentElement.lang = Lang.get();
  document.querySelectorAll('[data-lang-btn]').forEach(b => {
    b.textContent = Lang.get() === 'tr' ? 'EN' : 'TR';
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

function initFaq() {
  document.querySelectorAll('.fi').forEach(item => {
    const q = item.querySelector('.fq');
    if (q) q.addEventListener('click', () => item.classList.toggle('on'));
  });
}


/* ── 9. WIKI TOOLTIP (anahtar kelime mini kartları) ───────────
   Metin içinde geçen karakter adları ve sözlük terimlerinin üzerine
   gelindiğinde küçük bir bilgi kartı açar. Tarama yalnızca izin
   verilen kapsayıcılarda ve yalnızca metin düğümlerinde yapılır;
   mevcut bağlantılar ve HTML yapısı bozulmaz.                  */
const Tooltip = (() => {
  let terms = null;          /* küçük harfe indirgenmiş anahtar → kayıt */
  let sorted = [];           /* uzundan kısaya anahtar listesi */
  let card = null;
  let hideTimer = null;
  let building = null;

  const SCAN_SELECTOR =
    '.art-p, .cc-desc, .ci-d, .gls-def, .read-synopsis, .ip-desc, ' +
    '.hc-desc, .kc-desc, .modal-bio, .tl-desc, .q-text, .lc p';

  function lower(x) { return String(x || '').toLocaleLowerCase('tr'); }

  async function build() {
    if (terms) return;
    if (building) return building;
    building = (async () => {
      const map = Object.create(null);

      try {
        const c = await loadData('characters.json');
        (c.characters || []).forEach(ch => {
          const name = Lang.t(ch.name);
          if (!name) return;
          const rec = {
            kind: 'karakter',
            title: name,
            sub: [Lang.t(ch.house), Lang.t(ch.title)].filter(Boolean).join(' · '),
            body: String(Lang.t(ch.bio) || '').substring(0, 170),
            status: ch.status,
            url: BASE_PATH + 'karakter-sablon.html?id=' + encodeURIComponent(ch.id)
          };
          map[lower(name)] = rec;
          /* Soyadsız ilk ad da eşleşsin (en az 4 harf, tek kelime) */
          const first = name.split(/\s+/)[0];
          if (first && first.length >= 4 && !map[lower(first)]) map[lower(first)] = rec;
        });
      } catch (e) { console.warn('Tooltip: karakterler atlandı', e.message); }

      try {
        const l = await loadData('lore.json');
        (l.glossary || []).forEach(g => {
          const term = Lang.t(g.term);
          if (!term || term.length < 3) return;
          if (map[lower(term)]) return;
          map[lower(term)] = {
            kind: 'sozluk',
            title: term,
            sub: g.type || '',
            body: String(Lang.t(g.def) || '').substring(0, 170),
            url: BASE_PATH + 'lore.html#' + encodeURIComponent(g.id)
          };
        });
      } catch (e) { console.warn('Tooltip: sözlük atlandı', e.message); }

      terms = map;
      sorted = Object.keys(map).sort((a, b) => b.length - a.length);
    })();
    return building;
  }

  function ensureCard() {
    if (card) return card;
    card = document.createElement('div');
    card.className = 'wk-card';
    card.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    card.addEventListener('mouseleave', hide);
    document.body.appendChild(card);
    return card;
  }

  function show(el) {
    const rec = terms && terms[el.dataset.wk];
    if (!rec) return;
    clearTimeout(hideTimer);
    const c = ensureCard();
    c.innerHTML =
      '<div class="wk-kind">' + (rec.kind === 'karakter'
        ? (Lang.get() === 'tr' ? 'Karakter' : 'Character')
        : (Lang.get() === 'tr' ? 'Sözlük' : 'Glossary')) +
      (rec.status ? '<span class="wk-dot ' + esc(rec.status) + '"></span>' : '') + '</div>' +
      '<div class="wk-title">' + esc(rec.title) + '</div>' +
      (rec.sub ? '<div class="wk-sub">' + esc(rec.sub) + '</div>' : '') +
      '<div class="wk-body">' + esc(rec.body) + '…</div>' +
      '<a class="wk-go" href="' + esc(rec.url) + '">' +
      (Lang.get() === 'tr' ? 'Maddeyi aç →' : 'Open article →') + '</a>';

    c.style.visibility = 'hidden';
    c.classList.add('on');

    const r = el.getBoundingClientRect();
    const cw = c.offsetWidth, chh = c.offsetHeight;
    let left = r.left + r.width / 2 - cw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - cw - 8));
    let top = r.top - chh - 10;
    if (top < 8) top = r.bottom + 10;      /* yukarıda yer yoksa alta aç */
    c.style.left = Math.round(left) + 'px';
    c.style.top = Math.round(top) + 'px';
    c.style.visibility = 'visible';
  }

  function hide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { if (card) card.classList.remove('on'); }, 160);
  }

  /* Bir kökün altındaki metin düğümlerini tarayıp anahtarları sarar. */
  function markup(root) {
    if (!terms || !sorted.length) return;
    const scopes = root.matches && root.matches(SCAN_SELECTOR)
      ? [root] : Array.prototype.slice.call(root.querySelectorAll(SCAN_SELECTOR));

    scopes.forEach(scope => {
      if (scope.dataset.wkDone === '1') return;
      scope.dataset.wkDone = '1';

      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue || node.nodeValue.length < 3) return NodeFilter.FILTER_REJECT;
          /* Bağlantı, başlık ve mevcut işaretlerin içine girme */
          if (node.parentElement.closest('a, .wk, mark, code, button')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      const nodes = [];
      let n;
      while ((n = walker.nextNode())) nodes.push(n);

      const WORD = /[\p{L}\p{N}]/u;
      const MAX_PER_NODE = 8;   /* aşırı işaretlemeyi önle */

      /* Bir metin parçasındaki EN ERKEN eşleşmeyi bulur.
         Aynı konumda birden çok anahtar varsa en uzunu kazanır
         ("Lun Aldris" → "Lun"den önce gelir). */
      function firstMatch(text) {
        const low = lower(text);
        let best = null;
        for (let i = 0; i < sorted.length; i++) {
          const k = sorted[i];
          let from = 0, idx;
          while ((idx = low.indexOf(k, from)) >= 0) {
            const before = idx === 0 ? ' ' : text[idx - 1];
            const after = idx + k.length >= text.length ? ' ' : text[idx + k.length];
            if (!WORD.test(before) && !WORD.test(after)) {
              if (!best || idx < best.at || (idx === best.at && k.length > best.key.length)) {
                best = { key: k, at: idx };
              }
              break;                      /* bu anahtar için ilk geçerli yeter */
            }
            from = idx + 1;
          }
          if (best && best.at === 0 && best.key.length >= k.length) break;
        }
        return best;
      }

      nodes.forEach(node => {
        let current = node;
        let seen = Object.create(null);   /* aynı terimi düğüm içinde tekrarlama */
        let count = 0;

        while (current && count < MAX_PER_NODE) {
          const text = current.nodeValue;
          if (!text || text.length < 3) break;

          const m = firstMatch(text);
          if (!m) break;

          const rest = current.splitText(m.at);          /* [önce][eşleşme+sonrası] */
          const tail = rest.splitText(m.key.length);     /* [eşleşme][sonrası]      */

          if (seen[m.key]) {
            /* Aynı terim ikinci kez: işaretleme, düz metin bırak ve devam et */
            current = tail;
            continue;
          }
          seen[m.key] = true;

          const span = document.createElement('span');
          span.className = 'wk';
          span.dataset.wk = m.key;
          span.textContent = rest.nodeValue;
          span.tabIndex = 0;
          rest.parentNode.replaceChild(span, rest);

          current = tail;
          count++;
        }
      });
    });
  }

  /* Dışarıya açılan tarama fonksiyonu — render sonrası çağrılır. */
  function scan(root) {
    root = root || document.body;
    build().then(() => markup(root));
  }

  function init() {
    /* Olay devri: sonradan eklenen işaretler de çalışır */
    document.addEventListener('mouseover', e => {
      const el = e.target.closest ? e.target.closest('.wk') : null;
      if (el) show(el);
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest && e.target.closest('.wk')) hide();
    });
    document.addEventListener('focusin', e => {
      if (e.target.classList && e.target.classList.contains('wk')) show(e.target);
    });
    document.addEventListener('focusout', e => {
      if (e.target.classList && e.target.classList.contains('wk')) hide();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && card) card.classList.remove('on');
    });
    window.addEventListener('scroll', () => { if (card) card.classList.remove('on'); }, { passive: true });

    /* Dil değişince işaretleri sıfırla ve yeniden tara */
    document.addEventListener('langchange', () => {
      terms = null; sorted = []; building = null;
      document.querySelectorAll('[data-wk-done]').forEach(el => { delete el.dataset.wkDone; });
      setTimeout(() => scan(document.body), 250);
    });

    scan(document.body);
  }

  return { init, scan, build };
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
  Search.init();
  initFaq();

  if (options.tooltips !== false) Tooltip.init();
  showDraftBadge();
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

/* Görsel kaynağı doğrulaması: yalnızca depo yolu, http(s) veya data:image/png|jpeg|webp|gif.
   javascript: gibi şemalar ve protokol-göreli (//) adresler boş döner. */
const IMG_OK = /^(data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+|(?!\/\/)(?![a-z][a-z0-9+.-]*:)[^\s"'<>]+|https?:\/\/[^\s"'<>]+)$/i;
function safeImg(src) {
  src = String(src || '').trim();
  return src && IMG_OK.test(src) ? src : '';
}

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
  return '<img class="god-img" src="' + esc(list[0]) + '" data-alt="' +
    esc(JSON.stringify(list.slice(1))) + '" alt="" loading="lazy">';
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
      img.src = rest[0];
    };
    img.addEventListener('error', next);
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) next();
  });
}

window.Wiki = {
  Lang, Theme, loadData, Store, Search, Tooltip, Bookmarks, ReadTracker,
  initWiki, injectNav, groupClass, esc, safeImg, godImgHTML, wireGodImgs, godImgSources,
  getBasePath, BASE_PATH, renderError, showFatal
};

})();
