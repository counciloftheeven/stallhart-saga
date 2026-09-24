/* ═══════════════════════════════════════════════════════════════
   HARİTA SAYFASI — harita.html  (Sürüm 2,7 — kalıcı adresler)
   ---------------------------------------------------------------
   Akış
     data/maps.json  (+ yönetim panelindeki yerel taslak)
        └─ sekmeler (İmparatorluk / Dünya / …)  →  kartlar  →  görüntüleyici
   Adresler (assets/js/router.js — kalıcı adres biçimi)
     harita.html                          açılış: sekmeler + kartlar (harita AÇILMAZ)
     harita.html#/harita/imparatorluk     o sekmedeki harita
     harita.html#/harita/imparatorluk/solgar   haritayı açıp lejanttaki maddeyi gösterir
     harita.html#/harita/solgar           madde kimliği tek başınaysa ait olduğu harita
                                          (karakter sayfalarındaki "Haritada gör" bağlantıları)
     Eski biçimler (#imparatorluk, #imparatorluk/solgar, #solgar) çalışır ve yeni biçime çevrilir.
   Görüntüleyici
     Pointer Events: fare, dokunma ve kalem tek kodla; iki parmakla
     yakınlaştırma; tekerlek; klavye (+ − 0, oklar). Harita kapsayıcıdan
     tamamen çıkamaz. Lejant ve bilgi paneli üzerinde tekerlek/kaydırma
     haritayı değil, kendi listesini kaydırır.
   ═══════════════════════════════════════════════════════════════ */
'use strict';
(function () {

const { Lang, initWiki, esc, loadData, safeImg, imgAttrs } = window.Wiki;
const $ = id => document.getElementById(id);

/* ── METİNLER ─────────────────────────────────────────────── */
const STR = {
  tr: {
    pageTitle: 'Harita', eyebrow: 'Stallhart Destanı', h1: 'Haritalar',
    sub: 'Görüntülemek istediğiniz haritayı bir sekmeden ya da aşağıdaki kartlardan seçin.',
    home: 'Haritalar', open: 'Haritayı aç →', notUploaded: 'Harita henüz yüklenmedi',
    loading: 'Harita yükleniyor', emptyT: 'Bu harita henüz yüklenmedi',
    emptyD: 'Görsel eklendiğinde burada görünecek. Lejant şimdiden kullanılabilir.',
    errT: 'Harita görseli yüklenemedi',
    errD: 'Dosyanın depoya yüklendiğinden ve adının büyük/küçük harfine kadar aynı olduğundan emin olun (GitHub Pages harfe duyarlıdır):',
    noMaps: 'Henüz harita eklenmemiş.', dataErr: 'Harita verisi yüklenemedi.',
    dataErrD: 'Sayfayı yenilemeyi deneyin. Sorun sürerse data/maps.json dosyasının yayında olduğunu denetleyin.',
    legend: 'Lejant', noLegend: 'Bu harita için lejant maddesi yok.', closeLegend: 'Lejantı kapat', close: 'Kapat',
    zoomIn: 'Yakınlaştır', zoomOut: 'Uzaklaştır', fit: 'Görünümü sığdır', mapAria: 'İnteraktif harita',
    hintMouse: 'Sürükle · Tekerlek: yakınlaştır · Lejanttan seç: ayrıntı',
    hintTouch: 'Sürükle · İki parmakla yakınlaştır · Lejanttan seç: ayrıntı',
    rule: 'Yönetim', desc: 'Tanım', tags: 'Özellikler', chars: 'İlgili karakterler', capital: 'Başkent',
    lore: 'Evren ansiklopedisinde aç', kingdom: 'Devlet maddesini aç', detail: 'Ayrıntı', uploaded: 'yüklenen görsel'
  },
  en: {
    pageTitle: 'Map', eyebrow: 'The Stallhart Saga', h1: 'Maps',
    sub: 'Pick the map you want to view from a tab or one of the cards below.',
    home: 'Maps', open: 'Open map →', notUploaded: 'Map not uploaded yet',
    loading: 'Loading map', emptyT: 'This map has not been uploaded yet',
    emptyD: 'It will appear here once an image is added. The legend is already available.',
    errT: 'The map image could not be loaded',
    errD: 'Make sure the file is in the repository and that its name matches exactly, including letter case (GitHub Pages is case-sensitive):',
    noMaps: 'No maps have been added yet.', dataErr: 'Map data could not be loaded.',
    dataErrD: 'Try refreshing the page. If the problem persists, check that data/maps.json is published.',
    legend: 'Legend', noLegend: 'This map has no legend entries.', closeLegend: 'Close legend', close: 'Close',
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', fit: 'Fit to screen', mapAria: 'Interactive map',
    hintMouse: 'Drag · Wheel: zoom · Pick from the legend for details',
    hintTouch: 'Drag · Pinch to zoom · Pick from the legend for details',
    rule: 'Rule', desc: 'Description', tags: 'Features', chars: 'Related characters', capital: 'Capital',
    lore: 'Open in encyclopedia', kingdom: 'Open state article', detail: 'Details', uploaded: 'uploaded image'
  }
};
const str = k => (STR[Lang.get()] || STR.tr)[k] || STR.tr[k] || k;

/* Çift dilli alan: seçili dil boşsa Türkçe'ye (yoksa İngilizce'ye) düş.
   (Lang.t boş "en" alanında boş metin döndürdüğü için burada ayrı yazıldı.) */
function L(o) {
  if (o === null || o === undefined) return '';
  if (typeof o === 'string' || typeof o === 'number') return String(o);
  const l = Lang.get();
  const v = o[l];
  if (typeof v === 'string' && v.trim()) return v;
  return String(o.tr || o.en || '');
}
function LA(o) {
  if (!o || typeof o !== 'object') return [];
  const a = o[Lang.get()];
  if (Array.isArray(a) && a.length) return a;
  return Array.isArray(o.tr) ? o.tr : (Array.isArray(o.en) ? o.en : []);
}

/* ── VERİ DOĞRULAMA ───────────────────────────────────────── */
const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const bi = v => (v && typeof v === 'object' && !Array.isArray(v))
  ? { tr: String(v.tr == null ? '' : v.tr), en: String(v.en == null ? '' : v.en) }
  : { tr: v == null ? '' : String(v), en: '' };
const strArr = v => (Array.isArray(v) ? v : []).map(x => String(x == null ? '' : x).trim()).filter(Boolean);

function normalize(data) {
  const src = data && Array.isArray(data.maps) ? data.maps : [];
  const usedMaps = Object.create(null), out = [];
  src.forEach(m => {
    if (!m || typeof m !== 'object' || m.hidden === true) return;
    let id = String(m.id == null ? '' : m.id).trim();
    if (!id || usedMaps[id]) return;
    usedMaps[id] = 1;
    const usedItems = Object.create(null), legend = [];
    (Array.isArray(m.legend) ? m.legend : []).forEach(it => {
      if (!it || typeof it !== 'object') return;
      let iid = String(it.id == null ? '' : it.id).trim();
      if (!iid) return;
      const base = iid; let n = 2;
      while (usedItems[iid]) iid = base + '-' + (n++);
      usedItems[iid] = 1;
      const tags = it.tags && typeof it.tags === 'object' ? it.tags : {};
      legend.push({
        id: iid,
        color: HEX.test(String(it.color || '').trim()) ? String(it.color).trim() : '#8a7a5a',
        name: bi(it.name), eyebrow: bi(it.eyebrow), capital: bi(it.capital), ruler: bi(it.ruler), desc: bi(it.desc),
        tags: { tr: strArr(tags.tr), en: strArr(tags.en) },
        chars: (Array.isArray(it.chars) ? it.chars : []).filter(c => c && c.name)
          .map(c => ({ name: String(c.name), role: bi(c.role), id: String(c.id || '').trim() })),
        loreId: String(it.loreId || '').trim(), kingdomId: String(it.kingdomId || '').trim()
      });
    });
    out.push({
      id, title: bi(m.title), desc: bi(m.desc),
      image: String(m.image || '').trim(), thumb: String(m.thumb || '').trim(),
      legendTitle: bi(m.legendTitle), legend
    });
  });
  return out;
}

/* ── DURUM ────────────────────────────────────────────────── */
let maps = [];
let cur = null;          /* açık harita; null → açılış ekranı */
let curItem = null;      /* bilgi panelinde gösterilen lejant maddesi */
let legendOpen = false;
const mqMobile = window.matchMedia('(max-width: 720px)');
const mqCoarse = window.matchMedia('(pointer: coarse)');

const outer = $('outer'), inner = $('inner'), img = $('map-img');

/* ── ADRES (hash) ─────────────────────────────────────────── */
/* Adres: #/harita/<harita>[/<madde>]  (eski #<harita>, #<harita>/<madde>, #<madde> biçimleri de okunur).
   Yolu 'harita/madde' metni olarak döndürür; harita sayfasına ait değilse ''. */
function readHash() {
  const r = window.SWRoute.current();
  return r && r.type === 'harita' ? r.parts.join('/').trim() : '';
}
function parseHash() {
  const h = readHash();
  if (!h) return { map: null, item: null };
  const parts = h.split('/');
  const m = maps.find(x => x.id === parts[0]);
  if (m) return { map: m, item: parts[1] ? (m.legend.find(i => i.id === parts[1]) || null) : null };
  for (let k = 0; k < maps.length; k++) {
    const it = maps[k].legend.find(i => i.id === h);
    if (it) return { map: maps[k], item: it };
  }
  return { map: null, item: null };
}
function setHash(h, replace) {
  const R = window.SWRoute;
  const hh = h ? R.hash.apply(null, ['harita'].concat(h.split('/'))) : '';
  const url = location.pathname + location.search + hh;
  try { (replace ? history.replaceState : history.pushState).call(history, null, '', url); }
  catch (e) { location.hash = hh; }
}
function go(h) { setHash(h, false); route(); }

function route() {
  const r = parseHash();
  if (r.map) { window.SWRoute.canonicalize(); showMap(r.map, r.item); }   /* eski #imparatorluk → #/harita/imparatorluk */
  else showLanding();
}

/* ── AÇILIŞ EKRANI ────────────────────────────────────────── */
const ICON_MAP = '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>';

function renderTabs() {
  $('mp-tabs').innerHTML = maps.map(m =>
    '<button class="mp-tab" role="tab" type="button" data-map="' + esc(m.id) + '" aria-selected="false" title="' + esc(L(m.title)) + '">' +
    '<span class="mp-tab-dot" aria-hidden="true"></span><span>' + esc(L(m.title) || m.id) + '</span></button>').join('');
  markTabs();
}
function markTabs() {
  const box = $('mp-tabs');
  let active = null;
  box.querySelectorAll('.mp-tab').forEach(b => {
    const on = !!cur && b.dataset.map === cur.id;
    b.setAttribute('aria-selected', on ? 'true' : 'false');
    b.tabIndex = on || (!cur && b === box.firstElementChild) ? 0 : -1;
    if (on) active = b;
  });
  if (cur) $('mp-home').removeAttribute('aria-current');
  else $('mp-home').setAttribute('aria-current', 'page');
  if (active) {        /* etkin sekmeyi görünür kıl (sayfayı kaydırmadan) */
    const l = active.offsetLeft, r = l + active.offsetWidth;
    if (l < box.scrollLeft) box.scrollLeft = Math.max(0, l - 8);
    else if (r > box.scrollLeft + box.clientWidth) box.scrollLeft = r - box.clientWidth + 8;
  }
}

function cardEmpty() {
  return '<div class="mp-card-empty">' + ICON_MAP + '<span>' + esc(str('notUploaded')) + '</span></div>';
}
function renderCards() {
  const box = $('mp-cards');
  if (!maps.length) { box.innerHTML = '<div class="mp-empty-all">' + esc(str('noMaps')) + '</div>'; return; }
  box.innerHTML = maps.map(m => {
    const pic = safeImg(m.thumb) || safeImg(m.image);
    const t = L(m.title) || m.id, d = L(m.desc);
    return '<a class="mp-card" href="' + esc(window.SWRoute.href('harita', m.id)) + '">' +
      '<div class="mp-card-img">' +
      (pic ? '<img ' + imgAttrs(pic, '(max-width: 600px) 100vw, 420px') + ' alt="">' : cardEmpty()) + '</div>' +
      '<div class="mp-card-body"><h2 class="mp-card-t">' + esc(t) + '</h2>' +
      (d ? '<p class="mp-card-d">' + esc(d) + '</p>' : '') +
      '<span class="mp-card-go">' + esc(str('open')) + '</span></div></a>';
  }).join('');
}
/* Kırık kart görseli → yer tutucu (error olayı kabarmaz; yakalama aşamasında dinlenir) */
$('mp-cards').addEventListener('error', e => {
  const im = e.target;
  if (im && im.tagName === 'IMG' && im.parentNode) im.parentNode.innerHTML = cardEmpty();
}, true);

function setTitle() {
  document.title = (cur ? L(cur.title) + ' · ' : '') + str('pageTitle') + ' · Stallhart Wiki';
}

function showLanding() {
  cur = null; curItem = null;
  loadToken++;                             /* süren görsel yüklemesini iptal et */
  clearTimeout(hintTimer);
  closeInfoUI(); legendOpen = false; syncLegend();
  document.documentElement.classList.remove('mp-fixed');
  $('mp-landing').hidden = false;
  $('mp-view').hidden = true;
  markTabs(); setTitle();
  window.scrollTo(0, 0);
}

/* ── HARİTA GÖRÜNTÜLEYİCİ ─────────────────────────────────── */
function showMap(map, item) {
  const changed = cur !== map;
  cur = map;
  document.documentElement.classList.add('mp-fixed');
  $('mp-landing').hidden = true;
  $('mp-view').hidden = false;
  markTabs(); setTitle();
  if (changed) {
    curItem = null; closeInfoUI();
    renderLegend();
    legendOpen = !mqMobile.matches; syncLegend();
    loadMapImage(map);
  }
  if (item) selectItem(item.id);
  else if (!changed) closeInfoUI();
}

/* Yakınlaştırma / kaydırma durumu */
let iw = 0, ih = 0, vs = 1, vx = 0, vy = 0, fitScale = 1, minSc = .1, maxSc = 8;
let ready = false, userMoved = false, loadToken = 0, stateKind = null, stateExtra = '', hintTimer = 0;

function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

function clampPan() {
  const ow = outer.clientWidth, oh = outer.clientHeight;
  const keep = Math.min(80, ow * .25, oh * .25);           /* haritadan her zaman bir parça görünür kalır */
  vx = clamp(vx, keep - iw * vs, ow - keep);
  vy = clamp(vy, keep - ih * vs, oh - keep);
}
function applyT() {
  inner.style.transform = 'translate(' + vx + 'px,' + vy + 'px) scale(' + vs + ')';
  $('zbadge').textContent = fitScale ? (Lang.get() === 'tr' ? '%' + Math.round(vs / fitScale * 100) : Math.round(vs / fitScale * 100) + '%') : '';
}
/* Sürükleme sırasında pointermove kareden sık gelebilir: dönüşümü kare başına bir kez uygula. */
let tRaf = 0;
function schedT() {
  if (tRaf) return;
  tRaf = requestAnimationFrame(() => { tRaf = 0; applyT(); });
}
function updateButtons() {
  $('zoom-in').disabled = !ready || vs >= maxSc - 1e-6;
  $('zoom-out').disabled = !ready || vs <= minSc + 1e-6;
  $('zoom-reset').disabled = !ready;
  $('zbadge').style.display = ready ? '' : 'none';
}
function zoomAt(factor, cx, cy) {
  if (!ready) return;
  const next = clamp(vs * factor, minSc, maxSc);
  if (next === vs) return;
  vx = cx - (cx - vx) * (next / vs);
  vy = cy - (cy - vy) * (next / vs);
  vs = next; userMoved = true;
  clampPan(); applyT(); updateButtons();
}
function fit() {
  if (!ready) return;
  const ow = outer.clientWidth, oh = outer.clientHeight;
  if (!ow || !oh) return;                                   /* görünüm gizliyken hesaplama */
  fitScale = Math.min(ow / iw, oh / ih);
  minSc = fitScale * .5; maxSc = Math.max(3, fitScale * 8);
  vs = fitScale;
  vx = (ow - iw * vs) / 2; vy = (oh - ih * vs) / 2;
  userMoved = false;
  applyT(); updateButtons();
}

/* Durum kaplaması: yükleniyor / henüz yüklenmedi / hata */
function setState(kind, extra) {
  stateKind = kind || null; stateExtra = extra || '';
  const st = $('map-state'), box = $('map-state-box');
  st.className = 'map-state' + (kind ? ' is-' + kind : '');
  if (!kind) { st.hidden = true; box.innerHTML = ''; return; }
  st.hidden = false;
  if (kind === 'loading') {
    box.innerHTML = '<span class="sw-loading">' + esc(str('loading')) + '</span>';
  } else if (kind === 'empty') {
    box.innerHTML = ICON_MAP.replace('<svg ', '<svg class="map-state-ic" ') +
      '<div class="map-state-t">' + esc(str('emptyT')) + '</div><p class="map-state-d">' + esc(str('emptyD')) + '</p>';
  } else {
    box.innerHTML = '<div class="map-state-t">' + esc(str('errT')) + '</div>' +
      '<p class="map-state-d">' + esc(str('errD')) + '<br><code>' + esc(extra) + '</code></p>';
  }
}

function loadMapImage(map) {
  const tok = ++loadToken;
  ready = false; userMoved = false;
  img.hidden = true; img.removeAttribute('src');
  img.style.width = ''; img.style.height = '';
  img.alt = L(map.title);
  outer.setAttribute('aria-label', L(map.title) || str('mapAria'));
  updateButtons();

  const src = safeImg(map.image);
  if (!src) { setState('empty'); showHint(); return; }
  setState('loading');

  let settled = false;
  const ok = () => {
    if (tok !== loadToken || settled) return;
    settled = true;
    iw = img.naturalWidth || img.width || 1200;             /* SVG gibi ölçüsü olmayan görsellere karşı */
    ih = img.naturalHeight || img.height || 900;
    img.style.width = iw + 'px'; img.style.height = ih + 'px';
    img.hidden = false;
    ready = true; setState(null);
    fit(); showHint();
  };
  const bad = () => {
    if (tok !== loadToken || settled) return;
    settled = true;
    setState('error', /^data:/i.test(src) ? str('uploaded') : src);
  };
  img.onload = ok; img.onerror = bad;
  img.src = src;
  if (img.complete && img.naturalWidth) ok();               /* önbellekten anında geldiyse */
}

function showHint() {
  const h = $('hint');
  h.textContent = mqCoarse.matches ? str('hintTouch') : str('hintMouse');
  h.classList.remove('gone');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => h.classList.add('gone'), 5000);
}

/* ── POINTER: SÜRÜKLE + İKİ PARMAK ────────────────────────── */
const pts = new Map();
let panStart = null, pinch = null, moved = 0;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

outer.addEventListener('pointerdown', e => {
  if (e.target.closest('[data-ui]')) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  try { outer.setPointerCapture(e.pointerId); } catch (err) { /* eski tarayıcı */ }
  pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pts.size === 1) {
    moved = 0; panStart = { x: e.clientX, y: e.clientY, vx: vx, vy: vy };
    outer.classList.add('dragging');
    if (e.pointerType === 'mouse') outer.focus({ preventScroll: true });
  } else if (pts.size === 2) {
    const p = Array.from(pts.values());
    pinch = { d: dist(p[0], p[1]), mx: (p[0].x + p[1].x) / 2, my: (p[0].y + p[1].y) / 2 };
    panStart = null; moved = 99;                            /* çoklu dokunuş "tıklama" sayılmasın */
  }
});
outer.addEventListener('pointermove', e => {
  if (!pts.has(e.pointerId)) return;
  pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (!ready) return;
  if (pts.size >= 2 && pinch) {
    const p = Array.from(pts.values());
    const d = dist(p[0], p[1]), mx = (p[0].x + p[1].x) / 2, my = (p[0].y + p[1].y) / 2;
    const r = outer.getBoundingClientRect();
    vx += mx - pinch.mx; vy += my - pinch.my;
    if (pinch.d > 0 && d > 0) zoomAt(d / pinch.d, mx - r.left, my - r.top);
    else { clampPan(); schedT(); }
    pinch.d = d; pinch.mx = mx; pinch.my = my; userMoved = true;
  } else if (panStart) {
    const dx = e.clientX - panStart.x, dy = e.clientY - panStart.y;
    moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
    if (moved > 3) userMoved = true;
    vx = panStart.vx + dx; vy = panStart.vy + dy;
    clampPan(); schedT();
  }
});
function endPointer(e) {
  if (!pts.delete(e.pointerId)) return;
  pinch = null;
  if (pts.size === 1) {                                     /* kalan parmakla sıçramadan devam et */
    const p = Array.from(pts.values())[0];
    panStart = { x: p.x, y: p.y, vx: vx, vy: vy };
  } else if (pts.size === 0) {
    panStart = null; outer.classList.remove('dragging');
  }
}
outer.addEventListener('pointerup', endPointer);
outer.addEventListener('pointercancel', endPointer);
outer.addEventListener('lostpointercapture', endPointer);

/* Boş alana tıklama: bilgi panelini (ve mobilde lejantı) kapatır; sürükleme sonrası tıklama yok sayılır */
outer.addEventListener('click', e => {
  if (moved > 6 || e.target.closest('[data-ui]')) return;
  if (curItem) closeInfo();
  if (mqMobile.matches && legendOpen) { legendOpen = false; syncLegend(); }
});

/* Tekerlek: yalnızca harita üzerinde yakınlaştırır; lejant/bilgi paneli kendi listesini kaydırır */
outer.addEventListener('wheel', e => {
  if (e.target.closest('[data-ui]') || !ready) return;
  e.preventDefault();
  const unit = e.deltaMode === 1 ? 16 : (e.deltaMode === 2 ? 400 : 1);
  const k = e.ctrlKey ? .01 : .0018;                        /* dokunmatik yüzey sıkıştırması ctrl+tekerlek gelir */
  const r = outer.getBoundingClientRect();
  zoomAt(clamp(Math.exp(-e.deltaY * unit * k), .5, 2), e.clientX - r.left, e.clientY - r.top);
}, { passive: false });

/* Klavye */
outer.addEventListener('keydown', e => {
  if (e.target !== outer || !ready) return;
  const c = () => [outer.clientWidth / 2, outer.clientHeight / 2];
  const pan = (dx, dy) => { vx += dx; vy += dy; userMoved = true; clampPan(); applyT(); };
  switch (e.key) {
    case '+': case '=': e.preventDefault(); zoomAt(1.4, c()[0], c()[1]); break;
    case '-': case '_': e.preventDefault(); zoomAt(1 / 1.4, c()[0], c()[1]); break;
    case '0': e.preventDefault(); fit(); break;
    case 'ArrowLeft': e.preventDefault(); pan(60, 0); break;
    case 'ArrowRight': e.preventDefault(); pan(-60, 0); break;
    case 'ArrowUp': e.preventDefault(); pan(0, 60); break;
    case 'ArrowDown': e.preventDefault(); pan(0, -60); break;
    default:
  }
});

/* Araç çubuğu */
$('zoom-in').addEventListener('click', () => zoomAt(1.4, outer.clientWidth / 2, outer.clientHeight / 2));
$('zoom-out').addEventListener('click', () => zoomAt(1 / 1.4, outer.clientWidth / 2, outer.clientHeight / 2));
$('zoom-reset').addEventListener('click', fit);
$('leg-toggle').addEventListener('click', () => { legendOpen = !legendOpen; syncLegend(); if (legendOpen && mqMobile.matches) closeInfo(); });
$('leg-close').addEventListener('click', () => { legendOpen = false; syncLegend(); });

/* Boyut değişimi (pencere, yön değişimi, mobil adres çubuğu): sığdırılmış görünüm sığdırılmış kalır */
function onResize() {
  if (!ready) return;
  if (!userMoved) { fit(); return; }
  const ow = outer.clientWidth, oh = outer.clientHeight;
  if (!ow || !oh) return;
  fitScale = Math.min(ow / iw, oh / ih);
  minSc = fitScale * .5; maxSc = Math.max(3, fitScale * 8);
  vs = clamp(vs, minSc, maxSc);
  clampPan(); applyT(); updateButtons();
}
if (window.ResizeObserver) new ResizeObserver(onResize).observe(outer);
else window.addEventListener('resize', onResize);

/* ── LEJANT ───────────────────────────────────────────────── */
function syncLegend() {
  const on = legendOpen && !!cur;
  $('legend').classList.toggle('on', on);
  document.documentElement.classList.toggle('mp-legend-open', on);   /* topluluk düğmesi (sw-fab) konumu için */
  $('leg-toggle').setAttribute('aria-pressed', legendOpen ? 'true' : 'false');
}
function renderLegend() {
  $('leg-title').textContent = (cur && L(cur.legendTitle)) || str('legend');
  const box = $('leg-items');
  if (!cur || !cur.legend.length) { box.innerHTML = '<div class="legend-empty">' + esc(str('noLegend')) + '</div>'; return; }
  box.innerHTML = cur.legend.map(it =>
    '<button class="leg-item" type="button" data-goto="' + esc(it.id) + '"' + (curItem && curItem.id === it.id ? ' aria-current="true"' : '') + '>' +
    '<span class="leg-dot" style="background:' + it.color + '"></span>' +
    '<span class="leg-name">' + esc(L(it.name) || it.id) + '</span></button>').join('');
}
function markLegend() {
  $('leg-items').querySelectorAll('.leg-item').forEach(b => {
    if (curItem && b.dataset.goto === curItem.id) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
  });
}
$('leg-items').addEventListener('click', e => {
  const b = e.target.closest('[data-goto]');
  if (b) selectItem(b.dataset.goto);
});

/* ── BİLGİ PANELİ ─────────────────────────────────────────── */
const ICON_BOOK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
const ICON_FLAG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 22V4"/><path d="M4 4h13l-2 4 2 4H4"/></svg>';

function renderInfo(it) {
  const eye = L(it.eyebrow), cap = L(it.capital);
  const eyeEl = $('ip-eye'); eyeEl.textContent = eye; eyeEl.style.display = eye ? '' : 'none';
  $('ip-color-bar').style.background = 'linear-gradient(to right,' + it.color + ',transparent)';
  $('ip-name').textContent = L(it.name) || it.id;
  const capEl = $('ip-capital'); capEl.textContent = cap ? '★ ' + str('capital') + ': ' + cap : ''; capEl.style.display = cap ? '' : 'none';

  const ruler = L(it.ruler), desc = L(it.desc), tags = LA(it.tags);
  const chars = it.chars.map(c => {
    const role = L(c.role);
    const inner = esc(c.name) + (role ? '<span class="ip-char-role">— ' + esc(role) + '</span>' : '');
    return c.id
      ? '<a class="ip-char-link" href="' + esc(window.SWRoute.href('karakter', c.id)) + '">' + inner + '</a>'
      : '<div class="ip-char-plain">' + inner + '</div>';
  }).join('');
  const links =
    (it.loreId ? '<a class="ip-link" href="' + esc(window.SWRoute.href('evren', it.loreId)) + '">' + ICON_BOOK + '<span>' + esc(str('lore')) + '</span></a>' : '') +
    (it.kingdomId ? '<a class="ip-link" href="' + esc(window.SWRoute.href('devlet', it.kingdomId)) + '">' + ICON_FLAG + '<span>' + esc(str('kingdom')) + '</span></a>' : '');

  $('ip-body').innerHTML =
    (ruler ? '<p class="ip-sl">' + esc(str('rule')) + '</p><span class="ip-house">' + esc(ruler) + '</span>' : '') +
    (desc ? '<p class="ip-sl">' + esc(str('desc')) + '</p><p class="ip-desc">' + esc(desc) + '</p>' : '') +
    (tags.length ? '<p class="ip-sl">' + esc(str('tags')) + '</p><div class="ip-tags">' + tags.map(x => '<span class="iptag">' + esc(x) + '</span>').join('') + '</div>' : '') +
    (chars ? '<p class="ip-sl">' + esc(str('chars')) + '</p><div class="ip-chars">' + chars + '</div>' : '') +
    (links ? '<div class="ip-links">' + links + '</div>' : '');
  if (window.Wiki.Tooltip && window.Wiki.Tooltip.scan) window.Wiki.Tooltip.scan($('ip-body'));
}

function selectItem(id) {
  if (!cur) return;
  const it = cur.legend.find(i => i.id === id);
  if (!it) return;
  curItem = it;
  renderInfo(it);
  $('ip-body').scrollTop = 0;
  $('ipanel').classList.add('open');
  document.documentElement.classList.add('mp-info-open');
  markLegend();
  if (mqMobile.matches) { legendOpen = false; syncLegend(); }      /* mobilde iki sayfa üst üste binmesin */
  const want = cur.id + '/' + it.id;
  if (readHash() !== want) setHash(want, true);       /* replace: geçmiş kalabalıklaşmaz */
}
/* Yalnızca arayüzü kapatır (adrese dokunmaz) */
function closeInfoUI() {
  curItem = null;
  $('ipanel').classList.remove('open');
  document.documentElement.classList.remove('mp-info-open');
  markLegend();
}
function closeInfo() {
  closeInfoUI();
  if (cur && readHash() !== cur.id) setHash(cur.id, true);
}
$('ip-close').addEventListener('click', closeInfo);
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || !cur) return;
  if (curItem) closeInfo();
  else if (legendOpen && mqMobile.matches) { legendOpen = false; syncLegend(); }
});

/* ── SEKMELER / KARTLAR / ÜST ÇUBUK ───────────────────────── */
$('mp-tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-map]');
  if (b && (!cur || cur.id !== b.dataset.map)) go(b.dataset.map);
});
$('mp-tabs').addEventListener('keydown', e => {          /* ← → sekmeler arasında odak gezdirir */
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const tabs = Array.from($('mp-tabs').querySelectorAll('.mp-tab'));
  const i = tabs.indexOf(document.activeElement);
  if (i < 0) return;
  e.preventDefault();
  const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
  n.tabIndex = 0; n.focus();
});
$('mp-home').addEventListener('click', () => { if (cur) go(''); });

window.addEventListener('hashchange', route);
window.addEventListener('popstate', route);
const onBreakpoint = () => {
  if (!cur) return;
  legendOpen = !mqMobile.matches; syncLegend();            /* masaüstü ↔ mobil geçişinde varsayılanı yenile */
};
if (mqMobile.addEventListener) mqMobile.addEventListener('change', onBreakpoint);
else if (mqMobile.addListener) mqMobile.addListener(onBreakpoint);

/* ── DİL ──────────────────────────────────────────────────── */
function applyStatic() {
  $('mp-eyebrow').textContent = str('eyebrow');
  $('mp-h1').textContent = str('h1');
  $('mp-sub').textContent = str('sub');
  $('mp-home-t').textContent = str('home');
  $('mp-home').setAttribute('aria-label', str('home'));
  $('mp-tabs').setAttribute('aria-label', str('home'));
  [['zoom-in', 'zoomIn'], ['zoom-out', 'zoomOut'], ['zoom-reset', 'fit'], ['leg-toggle', 'legend']].forEach(p => {
    $(p[0]).title = str(p[1]); $(p[0]).setAttribute('aria-label', str(p[1]));
  });
  $('leg-close').setAttribute('aria-label', str('closeLegend'));
  $('ip-close').setAttribute('aria-label', str('close'));
  $('legend').setAttribute('aria-label', str('legend'));
  $('ipanel').setAttribute('aria-label', str('detail'));
  outer.setAttribute('aria-label', (cur && L(cur.title)) || str('mapAria'));
  $('hint').textContent = mqCoarse.matches ? str('hintTouch') : str('hintMouse');
}
function applyLang() {
  document.documentElement.lang = Lang.get();
  applyStatic(); renderTabs(); renderCards(); setTitle();
  if (cur) {
    renderLegend(); img.alt = L(cur.title);
    if (curItem) renderInfo(curItem);
    if (stateKind) setState(stateKind, stateExtra);
    applyT();
  }
}

/* ── AÇILIŞ ───────────────────────────────────────────────── */
function fail(err) {
  const box = $('mp-cards');
  box.innerHTML = '<div class="mp-empty-all"><strong>' + esc(str('dataErr')) + '</strong><br>' + esc(str('dataErrD')) +
    (err && err.message ? '<br><small>' + esc(err.message) + '</small>' : '') + '</div>';
}

async function init() {
  initWiki({ onLangChange: applyLang, injectFooter: true });
  applyStatic();
  updateButtons();
  try {
    maps = normalize(await loadData('maps.json'));
  } catch (err) {
    console.error(err); fail(err); return;
  }
  renderTabs(); renderCards();
  route();
}
init();

})();
