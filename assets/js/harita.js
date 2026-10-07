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
    lore: 'Evren ansiklopedisinde aç', kingdom: 'Devlet maddesini aç', detail: 'Ayrıntı', uploaded: 'yüklenen görsel',
    featSehir: 'Şehir', featDag: 'Dağ', featGol: 'Göl', featNehir: 'Nehir', featEyalet: 'Eyalet',
    featNoDesc: 'Bu konum hakkında ayrıntılı bilgi henüz eklenmedi.',
    wikiGo: 'Wiki Sayfasına Git', wikiGoArrow: 'Wiki Sayfasına Git →', details: 'Ayrıntılar',
    searchPlaceholder: 'Şehir, dağ, göl, eyalet ara...',
    noSearchResults: 'Eşleşen konum bulunamadı.',
    rulerTool: 'Mesafe Ölçüm Cetveli',
    rulerPrompt: 'Haritada noktalara tıklayarak ölçüm yapın',
    rulerClear: 'Temizle',
    rulerClose: 'Kapat',
    vignette: 'Parşömen Doku & Kenar Karartma',
    fersah: 'Fersah'
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
    lore: 'Open in encyclopedia', kingdom: 'Open state article', detail: 'Details', uploaded: 'uploaded image',
    featSehir: 'City', featDag: 'Mountain', featGol: 'Lake', featNehir: 'River', featEyalet: 'Province',
    featNoDesc: 'No further information has been added for this location yet.',
    wikiGo: 'Go to Wiki Page', wikiGoArrow: 'Go to Wiki Page →', details: 'Details',
    searchPlaceholder: 'Search city, mountain, lake, province...',
    noSearchResults: 'No matching locations found.',
    rulerTool: 'Distance Ruler Tool',
    rulerPrompt: 'Click points on the map to measure distance',
    rulerClear: 'Clear',
    rulerClose: 'Close',
    vignette: 'Parchment & Vignette Effect',
    fersah: 'Leagues'
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

/* Coğrafi katman (eyalet sınırları, şehir/dağ/göl/nehir) yalnızca data/maps.json → regions/features alanından okunur.
   Kaynak: harita-katmani.svg (5848×4304 piksel uzayı). Koda gömülü eski sabit veri kaldırıldı. */

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
      if (!iid || usedItems[iid]) return;
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

    /* Eyalet sınırları (coğrafi veri) */
    const rawRegions = Array.isArray(m.regions) ? m.regions : [];
    const regionMap = Object.create(null);
    rawRegions.forEach(r => { if (r && r.id) regionMap[r.id] = r; });
    const regions = Object.values(regionMap).map(r => {
      const rid = String(r.id || '').trim();
      if (!rid) return null;
      const points = (Array.isArray(r.points) ? r.points : [])
        .map(p => Array.isArray(p) && p.length === 2 ? [Number(p[0]) || 0, Number(p[1]) || 0] : null)
        .filter(Boolean);
      if (points.length < 3) return null;
      return {
        id: rid,
        points,
        labelPos: Array.isArray(r.labelPos) && r.labelPos.length === 2 ? [Number(r.labelPos[0]) || 0, Number(r.labelPos[1]) || 0] : null,
        sub: r.sub || null
      };
    }).filter(Boolean);

    /* Şehir / dağ / göl / nehir işaretleri */
    const FEAT_KINDS = ['sehir', 'dag', 'gol', 'nehir'];
    const features = {};
    const fsrc = (m.features && typeof m.features === 'object') ? m.features : {};
    FEAT_KINDS.forEach(k => {
      const featMap = Object.create(null);
      (Array.isArray(fsrc[k]) ? fsrc[k] : []).forEach(uf => { if (uf && uf.id) featMap[uf.id] = uf; });
      features[k] = Object.values(featMap).map(it => {
        if (!it || typeof it !== 'object') return null;
        let fid = String(it.id || '').trim();
        if (!fid) return null;
        const name = String(it.name || '').trim();
        if (!name) return null;
        if (k === 'nehir') {
          const points = (Array.isArray(it.points) ? it.points : [])
            .map(p => Array.isArray(p) && p.length === 2 ? [Number(p[0]) || 0, Number(p[1]) || 0] : null)
            .filter(Boolean);
          return points.length >= 2 ? { id: fid, name, points, desc: bi(it.desc) } : null;
        }
        const nx = Number(it.x);
        const ny = Number(it.y);
        if (isNaN(nx) || isNaN(ny)) return null;
        return { id: fid, name, x: nx, y: ny, desc: bi(it.desc) };
      }).filter(Boolean);
    });

    out.push({
      id, title: bi(m.title), desc: bi(m.desc),
      image: String(m.image || '').trim(), thumb: String(m.thumb || '').trim(),
      legendTitle: bi(m.legendTitle), legend, regions, features
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

const outer = $('outer'), inner = $('inner'), img = $('map-img'), wrap = $('wrap');

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
  if (r.map) {
    window.SWRoute.canonicalize();
    showMap(r.map, r.item);
  } else if (maps && maps.length) {
    // Varsayılan olarak doğrudan ana imparatorluk haritasını aç
    showMap(maps[0], null);
  } else {
    showLanding();
  }
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
function updateScaleBar() {
  const bar = $('map-scale-bar');
  const valEl = $('scale-val');
  const subEl = $('scale-sub');
  if (!bar || !valEl || !subEl || !iw) return;

  // 35 km -> 20 km kalibrasyonu: (iw / 400) * 1.75
  const pxPerFersah = Math.max(0.05, (iw / 400) * 1.75 * vs);
  const steps = [1, 2, 5, 10, 20, 50, 100, 250, 500];
  let chosen = steps[steps.length - 1];
  for (let i = 0; i < steps.length; i++) {
    const w = steps[i] * pxPerFersah;
    if (w >= 65) {
      chosen = steps[i];
      break;
    }
  }
  const barWidth = Math.round(chosen * pxPerFersah);
  bar.style.width = Math.max(24, Math.min(200, barWidth)) + 'px';

  const km = chosen * 5;
  const isTr = Lang.get() === 'tr';
  const horseStr = km < 65
    ? '~' + Math.max(1, Math.round((km / 65) * 24)) + (isTr ? ' Sa Atlı' : ' hrs Mtd')
    : '~' + (km / 65).toFixed(1) + (isTr ? ' G Atlı' : ' d Mtd');

  valEl.textContent = chosen + (isTr ? ' Fersah' : ' Leagues');
  subEl.textContent = '~' + km + ' km · ' + horseStr;
}

let animRaf = 0;
function smoothPanTo(targetMapX, targetMapY, targetScale, callback) {
  if (animRaf) {
    cancelAnimationFrame(animRaf);
    animRaf = 0;
  }
  const ow = outer.clientWidth;
  const oh = outer.clientHeight;
  const startVx = vx;
  const startVy = vy;
  const startVs = vs;

  const destVs = clamp(targetScale, minSc, maxSc);
  const destVx = (ow / 2) - targetMapX * destVs;
  const destVy = (oh / 2) - targetMapY * destVs;

  const startTime = performance.now();
  const duration = 540;

  userMoved = true;

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out

    vs = startVs + (destVs - startVs) * ease;
    vx = startVx + (destVx - startVx) * ease;
    vy = startVy + (destVy - startVy) * ease;

    clampPan();
    applyT();
    updateButtons();

    if (progress < 1) {
      animRaf = requestAnimationFrame(step);
    } else {
      animRaf = 0;
      if (typeof callback === 'function') callback();
    }
  }
  animRaf = requestAnimationFrame(step);
}

function applyT() {
  inner.style.transform = 'translate(' + vx + 'px,' + vy + 'px) scale(' + vs + ')';
  if (overlayEl && fitScale) overlayEl.classList.toggle('lbl-on', vs / fitScale >= 1.7);
  $('zbadge').textContent = fitScale ? (Lang.get() === 'tr' ? '%' + Math.round(vs / fitScale * 100) : Math.round(vs / fitScale * 100) + '%') : '';
  updateScaleBar();
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
  clearOverlay();

  const src = safeImg(map.image) || 'assets/images/SIYASI_HARITA00.jpg';
  if (!src) { setState('empty'); showHint(); return; }
  setState('loading');

  let settled = false;
  const ok = () => {
    if (tok !== loadToken || settled) return;
    settled = true;
    iw = img.naturalWidth || img.width || 5848;
    ih = img.naturalHeight || img.height || 4304;
    img.style.width = iw + 'px'; img.style.height = ih + 'px';
    img.hidden = false;
    ready = true; setState(null);
    buildOverlay(map, iw, ih);
    fit(); showHint();
  };
  const bad = () => {
    if (tok !== loadToken || settled) return;
    settled = true;
    iw = 5848; ih = 4304;
    img.hidden = false;
    ready = true; setState(null);
    buildOverlay(map, iw, ih);
    fit(); showHint();
  };
  img.onload = ok; img.onerror = bad;
  img.src = src;
  if (img.complete && img.naturalWidth) ok();
}

/* ── COĞRAFYA & EYALET BAĞLANTILARI ────────────────────────── */
let geoData = null;

function pointInPoly(pt, vs) {
  var x = pt[0], y = pt[1];
  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    var xi = vs[i][0], yi = vs[i][1];
    var xj = vs[j][0], yj = vs[j][1];
    var intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function slugify(s) {
  return String(s || '').toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function findParentProvince(map, pt) {
  if (!map || !map.regions || !pt) return null;
  for (let i = 0; i < map.regions.length; i++) {
    const r = map.regions[i];
    if (pointInPoly(pt, r.points)) {
      return map.legend.find(leg => leg.id === r.id) || null;
    }
  }
  return null;
}

function getFeatureProvince(map, f, kind) {
  if (!map) return null;
  if (kind === 'nehir') {
    const pts = f.points || [];
    if (pts.length) {
      const mid = pts[Math.floor(pts.length / 2)] || pts[0];
      const p = findParentProvince(map, mid);
      if (p) return p;
      for (let i = 0; i < pts.length; i++) {
        const found = findParentProvince(map, pts[i]);
        if (found) return found;
      }
    }
    return null;
  }
  return findParentProvince(map, [f.x, f.y]);
}

function getFeatureDesc(f, kind, prov) {
  const custom = L(f.desc);
  if (custom) return custom;
  const l = Lang.get();
  const name = String(f.name || '');

  if (kind === 'sehir') {
    if (name.includes('Arava')) {
      const c = geoData && geoData.capitalArava ? L(geoData.capitalArava.desc) : '';
      if (c) return c;
      return l === 'tr'
        ? 'Stallhart İmparatorluğu\'nun başkenti; Niron Nehri ve Gümüş Yol Denizi kıyısında stratejik yönetim merkezi.'
        : 'Capital of the Stallhart Empire; strategic administrative seat on the Niron River and Silver Way Sea.';
    }
    if (prov) {
      const cap = L(prov.capital);
      if (cap && cap.includes(name)) {
        return l === 'tr'
          ? L(prov.name) + ' eyaletinin yönetim merkezi ve başkenti.'
          : 'Capital and administrative seat of the ' + L(prov.name) + ' province.';
      }
      return l === 'tr'
        ? L(prov.name) + ' eyaleti sınırlarında bulunan kadim yerleşim ve ticaret merkezi.'
        : 'Ancient settlement and commerce hub within the province of ' + L(prov.name) + '.';
    }
    return l === 'tr' ? 'İmparatorluk yerleşim yeri ve ticaret şehri.' : 'Imperial settlement and commerce town.';
  }

  if (kind === 'nehir') {
    if (geoData && Array.isArray(geoData.rivers)) {
      const match = geoData.rivers.find(r => name.toLowerCase().includes((L(r.name) || '').toLowerCase()) || (L(r.name) || '').toLowerCase().includes(name.toLowerCase()));
      if (match) return L(match.desc);
    }
    if (prov) {
      return l === 'tr'
        ? L(prov.name) + ' havzasından geçen ve bölgenin yaşam damarı olan akarsu.'
        : 'Vital waterway flowing through the ' + L(prov.name) + ' basin.';
    }
    return l === 'tr' ? 'İmparatorluk coğrafyasında uzanan stratejik nehir.' : 'Strategic river in imperial geography.';
  }

  if (kind === 'dag') {
    if (geoData && Array.isArray(geoData.mountains)) {
      const match = geoData.mountains.find(m => name.toLowerCase().includes((L(m.name) || '').toLowerCase()) || (L(m.name) || '').toLowerCase().includes(name.toLowerCase()));
      if (match) return L(match.desc);
    }
    if (prov) {
      return l === 'tr'
        ? L(prov.name) + ' eyaleti sınırları boyunca yükselen dağ silsilesi ve doruklar.'
        : 'Mountain range and peaks rising within ' + L(prov.name) + '.';
    }
    return l === 'tr' ? 'İmparatorluk sınırları içindeki yüksek dağ silsilesi.' : 'Prominent mountain range of the empire.';
  }

  if (kind === 'gol') {
    if (prov) {
      return l === 'tr'
        ? L(prov.name) + ' eyaletinde yer alan doğal su havzası ve göl.'
        : 'Natural lake and water basin located in ' + L(prov.name) + '.';
    }
    return l === 'tr' ? 'İmparatorluk coğrafyasındaki doğal göl.' : 'Natural lake of the realm.';
  }

  return str('featNoDesc');
}

function getEntityWikiUrl(entity, kind, prov) {
  if (kind === 'eyalet') {
    if (entity.loreId) return window.SWRoute.href('evren', entity.loreId);
    const slug = slugify(L(entity.name) || entity.id);
    return window.SWRoute.href('evren', 'yer-' + slug);
  }
  const f = entity;
  const name = f.name;
  if (kind === 'sehir' && prov) {
    const provSlug = slugify(L(prov.name) || prov.id);
    return 'lore.html?q=' + encodeURIComponent(name) + '#/evren/yer-' + provSlug;
  }
  return 'lore.html?q=' + encodeURIComponent(name) + '#/evren/cog';
}

/* ── KÜÇÜK BİLGİ PENCERESİ (POPOVER) ───────────────────────── */
let popoverTimer = 0;
let activePopoverTarget = null;

function positionPopover(clientX, clientY) {
  const pop = $('map-popover');
  if (!pop || pop.hidden) return;
  const rect = outer.getBoundingClientRect();
  const popW = pop.offsetWidth || 280;
  const popH = pop.offsetHeight || 140;
  const mx = clientX - rect.left;
  const my = clientY - rect.top;

  // Safe horizontal placement with 20px offset so cursor is never inside popover
  let x = mx + 20;
  if (x + popW > rect.width - 12) {
    x = mx - popW - 20;
  }
  if (x < 12) {
    x = Math.max(12, Math.min(rect.width - popW - 12, mx - popW / 2));
  }

  // Safe vertical placement: never overlap or trap the cursor!
  let y = my - 24;
  if (y + popH > rect.height - 12) {
    // Flip cleanly above cursor with 20px safe space
    y = my - popH - 20;
  }
  if (y < 12) {
    // If top overflows, place below cursor with safe clearance
    y = my + 24;
    if (y + popH > rect.height - 12) {
      y = Math.max(12, rect.height - popH - 12);
    }
  }

  pop.style.left = Math.round(x) + 'px';
  pop.style.top = Math.round(y) + 'px';
}

function showPopover(data, clientX, clientY) {
  clearTimeout(popoverTimer);
  const pop = $('map-popover');
  if (!pop) return;

  activePopoverTarget = data.target;

  const badgeEl = $('pop-badge');
  badgeEl.className = 'pop-badge is-' + data.kind;
  badgeEl.textContent = data.badgeText;

  const provEl = $('pop-prov');
  if (data.provName) {
    provEl.textContent = '· ' + data.provName;
    provEl.style.display = '';
  } else {
    provEl.textContent = '';
    provEl.style.display = 'none';
  }

  $('pop-title').textContent = data.title;
  $('pop-desc').textContent = data.desc;

  const wikiBtn = $('pop-wiki-btn');
  wikiBtn.href = data.wikiUrl;
  wikiBtn.setAttribute('title', str('wikiGo'));

  const detailBtn = $('pop-detail-btn');
  detailBtn.textContent = str('details');
  detailBtn.onclick = e => {
    e.stopPropagation();
    hidePopover(0);
    if (data.onDetail) data.onDetail();
  };

  pop.hidden = false;
  requestAnimationFrame(() => {
    pop.classList.add('open');
    positionPopover(clientX, clientY);
  });
}

function scheduleHidePopover() {
  clearTimeout(popoverTimer);
  popoverTimer = setTimeout(() => {
    const pop = $('map-popover');
    if (!pop) return;
    pop.classList.remove('open');
    setTimeout(() => {
      if (!pop.classList.contains('open')) pop.hidden = true;
    }, 180);
  }, 240);
}

function hidePopover(delay) {
  if (delay === 0) {
    clearTimeout(popoverTimer);
    const pop = $('map-popover');
    if (pop) { pop.classList.remove('open'); pop.hidden = true; }
    return;
  }
  scheduleHidePopover();
}

function setActiveSvg(element) {
  if (overlayEl) {
    overlayEl.querySelectorAll('.is-active, .is-selected').forEach(el => {
      el.classList.remove('is-active', 'is-selected');
    });
    if (element) element.classList.add('is-active', 'is-selected');
  }
}

function clearActiveSvg() {
  if (overlayEl) {
    overlayEl.querySelectorAll('.is-active, .is-selected').forEach(el => {
      el.classList.remove('is-active', 'is-selected');
    });
  }
}

/* ── EYALET SINIRLARI / ŞEHİR-DAĞ-GÖL-NEHİR KATMANI ──────────
   Harita görseliyle birebir piksel uzayında (data/maps.json → regions/features)
   tanımlı bir <svg> katmanı; #wrap içine img'in hemen ardından eklenir, böylece
   #inner üzerindeki pan/zoom dönüşümünü görselle birlikte otomatik paylaşır. */
const SVGNS = 'http://www.w3.org/2000/svg';
const FEAT_COLOR = { sehir: '#c4962a', dag: '#8a7b66', gol: '#3f94cc', nehir: '#2e82bc' };
const FEAT_LABEL_KEY = { sehir: 'featSehir', dag: 'featDag', gol: 'featGol', nehir: 'featNehir' };
let overlayEl = null;

function svgNode(tag, attrs) {
  const el = document.createElementNS(SVGNS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function createDarkFantasyMarker(kind, x, y, markerR, featId, name) {
  const isCapital = featId === 'arava';
  const g = svgNode('g', {
    class: 'mo-point mo-' + kind + (isCapital ? ' mo-capital' : ''),
    'data-feat': featId,
    transform: 'translate(' + x + ',' + y + ')'
  });

  // Dark Fantasy pin ölçeği (5848x4304 harita uzayına göre altın oran)
  const scale = 2.7;

  // Geniş görünmez etkileşim alanı
  const hit = svgNode('circle', {
    class: 'mp-hit',
    cx: 0,
    cy: 0,
    r: Math.round(22 * scale),
    fill: 'transparent',
    stroke: 'none'
  });
  g.appendChild(hit);

  // Zemin gölgesi (derinlik efekti)
  const shadow = svgNode('ellipse', {
    class: 'mp-marker-shadow',
    cx: 0,
    cy: Math.round(14 * scale),
    rx: Math.round(18 * scale),
    ry: Math.round(6 * scale)
  });
  g.appendChild(shadow);

  if (kind === 'sehir') {
    // Dark Fantasy Kale / Hisar Tasarımı
    const tower = svgNode('path', {
      class: 'mp-sehir-body',
      d: 'M -12,13 L 12,13 L 11,-4 L 14,-4 L 14,-14 L 9,-14 L 9,-8 L 4,-8 L 4,-14 L -4,-14 L -4,-8 L -9,-8 L -9,-14 L -14,-14 L -14,-4 L -11,-4 Z',
      transform: 'scale(' + scale + ')'
    });
    const gate = svgNode('path', {
      class: 'mp-sehir-gate',
      d: 'M -3.5,13 L -3.5,5.5 Q 0,2 3.5,5.5 L 3.5,13 Z',
      transform: 'scale(' + scale + ')'
    });
    const slit = svgNode('rect', {
      class: 'mp-sehir-slit',
      x: -1, y: -2, width: 2, height: 4,
      transform: 'scale(' + scale + ')'
    });
    g.appendChild(tower);
    g.appendChild(gate);
    g.appendChild(slit);

    if (isCapital) {
      // Arava İmparatorluk Tahtı Altın Taç Simgesi
      const crown = svgNode('path', {
        class: 'mp-sehir-crown',
        d: 'M 0,-24 L 3.5,-17 L 9,-17 L 4.5,-12 L 7,-5 L 0,-10 L -7,-5 L -4.5,-12 L -9,-17 L -3.5,-17 Z',
        transform: 'scale(' + scale + ')'
      });
      g.appendChild(crown);
    }
  } else if (kind === 'dag') {
    // Dark Fantasy Sivri Dağ Zirvesi ve Gölgeli Sırtlar
    const secPeak = svgNode('polygon', {
      class: 'mp-dag-sec',
      points: '-10,-6 -22,14 -14,14',
      transform: 'scale(' + scale + ')'
    });
    const leftFacet = svgNode('polygon', {
      class: 'mp-dag-left',
      points: '0,-18 -16,14 -1,14',
      transform: 'scale(' + scale + ')'
    });
    const rightFacet = svgNode('polygon', {
      class: 'mp-dag-right',
      points: '0,-18 -1,14 17,14',
      transform: 'scale(' + scale + ')'
    });
    const snowCap = svgNode('polygon', {
      class: 'mp-dag-snow',
      points: '0,-18 -6,-6 0,-9 6,-6',
      transform: 'scale(' + scale + ')'
    });
    const baseLine = svgNode('line', {
      class: 'mp-dag-base',
      x1: -22 * scale, y1: 14 * scale,
      x2: 17 * scale, y2: 14 * scale
    });
    g.appendChild(secPeak);
    g.appendChild(leftFacet);
    g.appendChild(rightFacet);
    g.appendChild(snowCap);
    g.appendChild(baseLine);
  } else if (kind === 'gol') {
    // Dark Fantasy Mistik Su Havzası / Göl Dalgacıkları
    const tarn = svgNode('path', {
      class: 'mp-gol-body',
      d: 'M -18,2 C -18,-8 -9,-15 2,-14 C 13,-13 20,-6 19,3 C 18,12 8,16 -3,15 C -13,14 -18,11 -18,2 Z',
      transform: 'scale(' + scale + ')'
    });
    const rip1 = svgNode('path', {
      class: 'mp-gol-rip',
      d: 'M -9,-2 Q -2,-7 6,-3',
      transform: 'scale(' + scale + ')'
    });
    const rip2 = svgNode('path', {
      class: 'mp-gol-rip',
      d: 'M -6,5 Q 1,9 9,4',
      transform: 'scale(' + scale + ')'
    });
    g.appendChild(tarn);
    g.appendChild(rip1);
    g.appendChild(rip2);
  }

  // Harita Üzerinde Şehir / Dağ / Göl İsim Etiketi
  if (name) {
    const labelY = Math.round(17 * scale) + 30;
    const label = svgNode('text', {
      class: 'mo-label mo-label-' + kind + (isCapital ? ' mo-label-capital' : ''),
      x: 0,
      y: labelY,
      'text-anchor': 'middle'
    });
    label.textContent = (kind === 'dag' ? '▲ ' : kind === 'gol' ? '💧 ' : '') + name;
    g.appendChild(label);
  }

  return g;
}

function clearOverlay() {
  if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
  overlayEl = null;
  const rSvg = $('ruler-svg');
  if (rSvg && rSvg.parentNode) rSvg.parentNode.removeChild(rSvg);
  clearActiveSvg();
}
function buildOverlay(map, w, h) {
  clearOverlay();
  const hasRegions = map.regions && map.regions.length;
  const hasFeatures = Object.keys(map.features || {}).some(k => map.features[k].length);
  if (!hasRegions && !hasFeatures) return;

  const svg = svgNode('svg', { class: 'map-overlay', viewBox: '0 0 ' + w + ' ' + h, width: w, height: h });
  const markerR = Math.max(10, Math.round(w / 280));

  // Katman Grupları (z-order ve bağımsız açıp/kapatma için)
  const gRegions = svgNode('g', { class: 'mo-layer-regions' });
  const gRivers = svgNode('g', { class: 'mo-layer-rivers' });
  const gLakes = svgNode('g', { class: 'mo-layer-lakes' });
  const gMountains = svgNode('g', { class: 'mo-layer-mountains' });
  const gCities = svgNode('g', { class: 'mo-layer-cities' });

  // 1. Eyalet Poligonları ve Eyalet Başlıkları
  (map.regions || []).forEach(r => {
    const leg = map.legend.find(i => i.id === r.id);
    const pts = r.points.map(p => p[0] + ',' + p[1]).join(' ');
    const col = leg ? leg.color : '#8a7a5a';
    const pg = svgNode('polygon', {
      class: 'mo-region',
      points: pts,
      'data-region': r.id,
      style: 'fill:' + col + '; stroke:' + col + ';'
    });

    const onRegionEnter = e => {
      const wikiUrl = getEntityWikiUrl(leg, 'eyalet', null);
      const cap = leg ? L(leg.capital) : '';
      const ruler = leg ? L(leg.ruler) : '';
      let desc = leg ? L(leg.desc) : '';
      if (cap || ruler) {
        desc = (cap ? '★ ' + str('capital') + ': ' + cap : '') + (ruler ? ' · ' + ruler : '') + (desc ? ' — ' + desc : '');
      }
      showPopover({
        kind: 'eyalet',
        badgeText: '👑 ' + (str('featEyalet') || 'Eyalet'),
        provName: '',
        title: leg ? (L(leg.name) || leg.id) : r.id,
        desc: desc,
        wikiUrl: wikiUrl,
        target: pg,
        onDetail: () => selectItem(r.id, pg)
      }, e.clientX, e.clientY);
    };

    pg.addEventListener('mouseenter', onRegionEnter);
    pg.addEventListener('mousemove', e => positionPopover(e.clientX, e.clientY));
    pg.addEventListener('mouseleave', scheduleHidePopover);
    pg.addEventListener('click', e => {
      e.stopPropagation();
      if (moved <= 6) {
        hidePopover(0);
        selectItem(r.id, pg);
      }
    });
    gRegions.appendChild(pg);

    // Eyalet İsim Etiketi (Merkezde Büyük İmparatorluk Başlığı)
    const legName = (leg ? (L(leg.name) || r.id) : r.id).split(' / ')[0].toUpperCase();   /* uzun çift adlarda yalnızca ilk ad: etiket çakışmasını önler */
    const pos = r.labelPos || [
      Math.round(r.points.reduce((s, p) => s + p[0], 0) / r.points.length),
      Math.round(r.points.reduce((s, p) => s + p[1], 0) / r.points.length)
    ];
    const subText = r.sub ? L(r.sub) : (str('featEyalet') || 'Eyaleti');

    const rg = svgNode('g', {
      class: 'mo-region-label-group',
      'data-region': r.id,
      transform: 'translate(' + pos[0] + ',' + pos[1] + ')'
    });
    const rt = svgNode('text', { class: 'mo-region-label', x: 0, y: 0, 'text-anchor': 'middle' });
    rt.textContent = legName;
    const rsub = svgNode('text', { class: 'mo-region-sub', x: 0, y: 40, 'text-anchor': 'middle' });
    rsub.textContent = subText.toUpperCase();

    rg.appendChild(rt);
    rg.appendChild(rsub);

    rg.addEventListener('mouseenter', onRegionEnter);
    rg.addEventListener('mousemove', e => positionPopover(e.clientX, e.clientY));
    rg.addEventListener('mouseleave', scheduleHidePopover);
    rg.addEventListener('click', e => {
      e.stopPropagation();
      if (moved <= 6) {
        hidePopover(0);
        selectItem(r.id, pg);
      }
    });

    gRegions.appendChild(rg);
  });

  // 2. Nehirler
  (map.features.nehir || []).forEach(f => {
    const pts = f.points.map(p => p[0] + ',' + p[1]).join(' ');
    const pl = svgNode('polyline', { class: 'mo-river', points: pts, 'data-feat': f.id });

    pl.addEventListener('mouseenter', e => {
      const prov = getFeatureProvince(map, f, 'nehir');
      const desc = getFeatureDesc(f, 'nehir', prov);
      const wikiUrl = getEntityWikiUrl(f, 'nehir', prov);
      showPopover({
        kind: 'nehir',
        badgeText: '🌊 ' + str('featNehir'),
        provName: prov ? L(prov.name) : '',
        title: f.name,
        desc: desc,
        wikiUrl: wikiUrl,
        target: pl,
        onDetail: () => openFeature(f, 'nehir', pl)
      }, e.clientX, e.clientY);
    });
    pl.addEventListener('mousemove', e => positionPopover(e.clientX, e.clientY));
    pl.addEventListener('mouseleave', scheduleHidePopover);
    pl.addEventListener('click', e => {
      e.stopPropagation();
      if (moved <= 6) {
        hidePopover(0);
        openFeature(f, 'nehir', pl);
      }
    });
    gRivers.appendChild(pl);

    // Nehir İsmi Etiketi
    if (f.name && f.points && f.points.length >= 2) {
      const midIdx = Math.floor(f.points.length / 2);
      const p1 = f.points[Math.max(0, midIdx - 1)];
      const p2 = f.points[midIdx];
      const mx = Math.round((p1[0] + p2[0]) / 2);
      const my = Math.round((p1[1] + p2[1]) / 2);
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      let deg = Math.round(Math.atan2(dy, dx) * 180 / Math.PI);
      if (deg > 90) deg -= 180;
      else if (deg < -90) deg += 180;

      const rg = svgNode('g', {
        class: 'mo-river-label-group',
        transform: 'translate(' + mx + ',' + my + ') rotate(' + deg + ')'
      });
      const rt = svgNode('text', {
        class: 'mo-river-label',
        x: 0,
        y: -20,
        'text-anchor': 'middle'
      });
      rt.textContent = '≈ ' + f.name + ' ≈';
      rg.appendChild(rt);
      gRivers.appendChild(rg);
    }
  });

  // 3. Göller, Dağlar, Şehirler
  ['gol', 'dag', 'sehir'].forEach(kind => {
    const iconMap = { sehir: '🏛️ ', dag: '🏔️ ', gol: '💧 ' };
    const targetGroup = kind === 'gol' ? gLakes : (kind === 'dag' ? gMountains : gCities);

    (map.features[kind] || []).forEach(f => {
      const shape = createDarkFantasyMarker(kind, f.x, f.y, markerR, f.id, f.name);

      shape.addEventListener('mouseenter', e => {
        const prov = getFeatureProvince(map, f, kind);
        const desc = getFeatureDesc(f, kind, prov);
        const wikiUrl = getEntityWikiUrl(f, kind, prov);
        showPopover({
          kind: kind,
          badgeText: (iconMap[kind] || '') + str(FEAT_LABEL_KEY[kind]),
          provName: prov ? L(prov.name) : '',
          title: f.name,
          desc: desc,
          wikiUrl: wikiUrl,
          target: shape,
          onDetail: () => openFeature(f, kind, shape)
        }, e.clientX, e.clientY);
      });
      shape.addEventListener('mouseleave', scheduleHidePopover);
      shape.addEventListener('click', e => {
        e.stopPropagation();
        if (moved <= 6) {
          hidePopover(0);
          openFeature(f, kind, shape);
        }
      });
      targetGroup.appendChild(shape);
    });
  });

  svg.appendChild(gRegions);
  svg.appendChild(gRivers);
  svg.appendChild(gLakes);
  svg.appendChild(gMountains);
  svg.appendChild(gCities);

  wrap.appendChild(svg);
  overlayEl = svg;

  let rulerSvg = $('ruler-svg');
  if (!rulerSvg) {
    rulerSvg = svgNode('svg', { id: 'ruler-svg', class: 'ruler-svg', viewBox: '0 0 ' + w + ' ' + h, width: w, height: h });
    wrap.appendChild(rulerSvg);
  } else {
    rulerSvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    rulerSvg.setAttribute('width', w);
    rulerSvg.setAttribute('height', h);
    wrap.appendChild(rulerSvg);
  }
  updateRuler();
}

/* ── ÖZELLİK (şehir/dağ/göl/nehir) BİLGİ PANELİ ──────────────
   Lejant maddeleriyle aynı #ipanel'i kullanır; adres (hash) değiştirmez. */
let curFeature = null;
function renderFeatureInfo(f, kind) {
  const eyeEl = $('ip-eye'); eyeEl.textContent = str(FEAT_LABEL_KEY[kind]); eyeEl.style.display = '';
  $('ip-color-bar').style.background = 'linear-gradient(to right,' + FEAT_COLOR[kind] + ',transparent)';
  $('ip-name').textContent = f.name;

  const prov = cur ? getFeatureProvince(cur, f, kind) : null;
  const capEl = $('ip-capital');
  if (prov) {
    capEl.textContent = '📍 ' + (str('featEyalet') || 'Eyalet') + ': ' + L(prov.name);
    capEl.style.display = '';
  } else {
    capEl.textContent = '';
    capEl.style.display = 'none';
  }

  const desc = getFeatureDesc(f, kind, prov);
  const wikiUrl = getEntityWikiUrl(f, kind, prov);

  const links =
    '<a class="ip-link ip-wiki-btn" href="' + esc(wikiUrl) + '">' +
    ICON_BOOK + '<span>' + esc(str('wikiGo') || 'Wiki Sayfasına Git') + '</span></a>' +
    (prov ? '<button class="ip-link" type="button" data-prov-goto="' + esc(prov.id) + '">' +
      '<span>👑 ' + esc(L(prov.name)) + ' ' + esc(str('featEyalet') || 'Eyaleti') + '</span></button>' : '');

  $('ip-body').innerHTML =
    '<p class="ip-sl">' + esc(str('desc')) + '</p>' +
    '<p class="ip-desc">' + esc(desc) + '</p>' +
    '<div class="ip-links">' + links + '</div>';

  const provBtn = $('ip-body').querySelector('[data-prov-goto]');
  if (provBtn) {
    provBtn.addEventListener('click', () => selectItem(provBtn.dataset.provGoto));
  }
  if (window.Wiki.Tooltip && window.Wiki.Tooltip.scan) window.Wiki.Tooltip.scan($('ip-body'));
}
function openFeature(f, kind, targetEl) {
  curItem = null; curFeature = { f, kind };
  if (targetEl) setActiveSvg(targetEl);
  renderFeatureInfo(f, kind);
  $('ip-body').scrollTop = 0;
  $('ipanel').classList.add('open');
  document.documentElement.classList.add('mp-info-open');
  markLegend();
  if (mqMobile.matches) { legendOpen = false; syncLegend(); }
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

/* ── SERBEST MESAFE ÖLÇÜM CETVELİ (RULER TOOL) ─────────────── */
let isRulerMode = false;
let rulerPoints = [];

function distBetween(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getMapCoordsFromClient(clientX, clientY) {
  const rect = inner.getBoundingClientRect();
  const mapX = (clientX - rect.left) / vs;
  const mapY = (clientY - rect.top) / vs;
  return {
    x: Math.round(clamp(mapX, 0, iw)),
    y: Math.round(clamp(mapY, 0, ih))
  };
}

function addRulerPoint(x, y) {
  rulerPoints.push({ x, y });
  updateRuler();
}

function updateRuler() {
  const svg = $('ruler-svg');
  const distEl = $('ruler-dist');
  const timesEl = $('ruler-times');
  if (!distEl || !timesEl) return;
  if (svg) svg.innerHTML = '';

  if (rulerPoints.length === 0) {
    distEl.textContent = str('rulerPrompt');
    timesEl.textContent = '';
    return;
  }

  // 35 km -> 20 km kalibrasyonu: (iw / 400) * 1.75
  const pxPerFersah = Math.max(1, ((iw || 5848) / 400) * 1.75);
  let totalPx = 0;

  if (svg && rulerPoints.length >= 2) {
    const ptsStr = rulerPoints.map(p => p.x + ',' + p.y).join(' ');
    const line = svgNode('polyline', { class: 'ruler-line', points: ptsStr });
    svg.appendChild(line);
  }

  for (let i = 0; i < rulerPoints.length; i++) {
    const p = rulerPoints[i];

    if (i > 0) {
      const prev = rulerPoints[i - 1];
      const segPx = distBetween(prev, p);
      totalPx += segPx;

      if (svg) {
        const midX = (prev.x + p.x) / 2;
        const midY = (prev.y + p.y) / 2;
        const segFersah = Math.round(segPx / pxPerFersah);
        if (segFersah > 0) {
          const tagG = svgNode('g', { transform: 'translate(' + midX + ',' + midY + ')' });
          const tagText = segFersah + (Lang.get() === 'tr' ? ' F' : ' L');
          const textLen = tagText.length * 8 + 12;
          const rect = svgNode('rect', {
            class: 'ruler-tag-bg',
            x: -textLen / 2, y: -9,
            width: textLen, height: 18
          });
          const txt = svgNode('text', { class: 'ruler-tag-text', x: 0, y: 0 });
          txt.textContent = tagText;
          tagG.appendChild(rect);
          tagG.appendChild(txt);
          svg.appendChild(tagG);
        }
      }
    }

    if (svg) {
      const pinG = svgNode('g', { transform: 'translate(' + p.x + ',' + p.y + ')' });
      const circle = svgNode('circle', { class: 'ruler-pin-circle', r: 12 });
      const label = svgNode('text', { class: 'ruler-pin-text', x: 0, y: 0 });
      label.textContent = String(i + 1);
      pinG.appendChild(circle);
      pinG.appendChild(label);
      svg.appendChild(pinG);
    }
  }

  const totalFersah = Math.max(1, Math.round(totalPx / pxPerFersah));
  const totalKm = totalFersah * 5;
  const isTr = Lang.get() === 'tr';

  const horseDays = totalKm / 65;
  const marchDays = totalKm / 24;

  const horseStr = totalKm < 65
    ? (isTr ? '~' + Math.max(1, Math.round(horseDays * 24)) + ' Saat (' + horseDays.toFixed(1) + ' Gün)' : '~' + Math.max(1, Math.round(horseDays * 24)) + ' hrs (' + horseDays.toFixed(1) + ' d)')
    : (isTr ? '~' + horseDays.toFixed(1) + ' Gün' : '~' + horseDays.toFixed(1) + ' d');

  const marchStr = totalKm < 24
    ? (isTr ? '~' + Math.max(1, Math.round(marchDays * 24)) + ' Saat (' + marchDays.toFixed(1) + ' Gün)' : '~' + Math.max(1, Math.round(marchDays * 24)) + ' hrs (' + marchDays.toFixed(1) + ' d)')
    : (isTr ? '~' + marchDays.toFixed(1) + ' Gün' : '~' + marchDays.toFixed(1) + ' d');

  if (rulerPoints.length === 1) {
    distEl.textContent = '1. ' + (isTr ? 'Nokta belirlendi' : 'Point placed');
    timesEl.textContent = isTr ? 'Ölçüm için 2. noktaya tıklayın' : 'Click a 2nd point to measure distance';
  } else {
    distEl.textContent = totalFersah + (isTr ? ' Fersah' : ' Leagues') + ' (~' + totalKm + ' km)';
    timesEl.textContent = '🐎 ' + (isTr ? 'Atlı Kurye: ' : 'Courier: ') + horseStr + ' · 🚶 ' + (isTr ? 'Yaya Ordu: ' : 'March: ') + marchStr;
  }
}

function setRulerMode(on) {
  isRulerMode = on;
  outer.classList.toggle('is-ruler-mode', on);
  const btn = $('ruler-toggle');
  const hud = $('ruler-hud');
  if (btn) {
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  if (hud) hud.hidden = !on;
  if (!on) {
    rulerPoints = [];
    updateRuler();
  } else {
    updateRuler();
  }
}

/* ── KONUM ARAMA (SEARCH & ZOOM) ─────────────────────────── */
function getSearchableLocations() {
  if (!cur) return [];
  const list = [];

  // Eyaletler
  if (cur.regions && cur.legend) {
    cur.regions.forEach(r => {
      const leg = cur.legend.find(item => item.id === r.id);
      if (!leg) return;
      let cx = 0, cy = 0;
      if (r.points && r.points.length) {
        r.points.forEach(p => { cx += p[0]; cy += p[1]; });
        cx = Math.round(cx / r.points.length);
        cy = Math.round(cy / r.points.length);
      }
      list.push({
        id: r.id,
        name: L(leg.name) || leg.id,
        type: 'eyalet',
        icon: '👑',
        typeLabel: str('featEyalet'),
        x: cx,
        y: cy,
        action: () => selectItem(r.id)
      });
    });
  }

  // Features (Şehir, Dağ, Göl)
  ['sehir', 'dag', 'gol'].forEach(kind => {
    const iconMap = { sehir: '🏛️', dag: '🏔️', gol: '💧' };
    (cur.features && cur.features[kind] ? cur.features[kind] : []).forEach(f => {
      list.push({
        id: f.id,
        name: f.name,
        type: kind,
        icon: iconMap[kind] || '📍',
        typeLabel: str(FEAT_LABEL_KEY[kind]),
        x: f.x,
        y: f.y,
        action: () => openFeature(f, kind)
      });
    });
  });

  // Nehirler
  (cur.features && cur.features.nehir ? cur.features.nehir : []).forEach(f => {
    let mx = 0, my = 0;
    if (f.points && f.points.length) {
      const mid = f.points[Math.floor(f.points.length / 2)] || f.points[0];
      mx = mid[0];
      my = mid[1];
    }
    list.push({
      id: f.id,
      name: f.name,
      type: 'nehir',
      icon: '🌊',
      typeLabel: str('featNehir'),
      x: mx,
      y: my,
      action: () => openFeature(f, 'nehir')
    });
  });

  return list;
}

let activeSearchIndex = -1;
function renderSearchResults(query) {
  const box = $('map-search-results');
  const clearBtn = $('map-search-clear');
  if (!box) return;

  const q = String(query || '').trim();
  if (clearBtn) clearBtn.hidden = !q;

  if (!q) {
    box.hidden = true;
    box.innerHTML = '';
    activeSearchIndex = -1;
    return;
  }

  const slugQ = slugify(q);
  const all = getSearchableLocations();
  const matches = all.filter(item => {
    return slugify(item.name).includes(slugQ) || slugify(item.id).includes(slugQ);
  }).slice(0, 10);

  if (!matches.length) {
    box.innerHTML = '<div class="search-empty-text">' + esc(str('noSearchResults')) + '</div>';
    box.hidden = false;
    activeSearchIndex = -1;
    return;
  }

  activeSearchIndex = 0;
  box.innerHTML = matches.map((m, idx) => {
    return '<div class="map-search-item' + (idx === 0 ? ' is-selected' : '') + '" role="option" data-idx="' + idx + '">' +
      '<div class="search-item-left">' +
        '<span class="search-item-icon">' + m.icon + '</span>' +
        '<span class="search-item-name">' + esc(m.name) + '</span>' +
      '</div>' +
      '<span class="search-item-type">' + esc(m.typeLabel) + '</span>' +
    '</div>';
  }).join('');

  box.querySelectorAll('.map-search-item').forEach((el, idx) => {
    el.addEventListener('click', () => {
      selectSearchResult(matches[idx]);
    });
  });

  box.hidden = false;
}

function selectSearchResult(item) {
  if (!item) return;
  const input = $('map-search-input');
  const box = $('map-search-results');
  if (input) input.value = item.name;
  if (box) box.hidden = true;

  const targetScale = Math.max(vs, fitScale * 2.8);
  smoothPanTo(item.x, item.y, targetScale, () => {
    item.action();
  });
}

function updateSearchSelection(items) {
  items.forEach((el, idx) => {
    el.classList.toggle('is-selected', idx === activeSearchIndex);
    if (idx === activeSearchIndex) el.scrollIntoView({ block: 'nearest' });
  });
}

function initSearch() {
  const input = $('map-search-input');
  const clearBtn = $('map-search-clear');
  const resultsBox = $('map-search-results');
  if (!input) return;

  input.addEventListener('input', () => {
    renderSearchResults(input.value);
  });

  input.addEventListener('keydown', e => {
    const items = resultsBox ? resultsBox.querySelectorAll('.map-search-item') : [];
    if (!resultsBox || resultsBox.hidden || !items.length) {
      if (e.key === 'Enter') {
        renderSearchResults(input.value);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeSearchIndex = (activeSearchIndex + 1) % items.length;
      updateSearchSelection(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeSearchIndex = (activeSearchIndex - 1 + items.length) % items.length;
      updateSearchSelection(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSearchIndex >= 0 && items[activeSearchIndex]) {
        items[activeSearchIndex].click();
      }
    } else if (e.key === 'Escape') {
      resultsBox.hidden = true;
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.hidden = true;
      if (resultsBox) resultsBox.hidden = true;
      input.focus();
    });
  }

  document.addEventListener('click', e => {
    if (!e.target.closest('#map-search-wrap') && resultsBox) {
      resultsBox.hidden = true;
    }
  });
}

/* ── PARŞÖMEN DOKU & KENAR KARARTMA (VIGNETTE) ─────────────── */
function initVignette() {
  const btn = $('vignette-toggle');
  const vig = $('map-vignette');
  if (!btn || !vig) return;

  const saved = localStorage.getItem('sw_map_vignette');
  const isOn = saved !== 'off';

  const applyVig = on => {
    vig.classList.toggle('is-off', !on);
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    localStorage.setItem('sw_map_vignette', on ? 'on' : 'off');
  };

  applyVig(isOn);

  btn.addEventListener('click', () => {
    const willBeOn = vig.classList.contains('is-off');
    applyVig(willBeOn);
  });
}

/* Boş alana tıklama: bilgi panelini (ve mobilde lejantı) kapatır; sürükleme sonrası tıklama yok sayılır */
outer.addEventListener('click', e => {
  if (moved > 6 || e.target.closest('[data-ui]')) return;
  if (isRulerMode) {
    const coords = getMapCoordsFromClient(e.clientX, e.clientY);
    addRulerPoint(coords.x, coords.y);
    return;
  }
  if (curItem) closeInfo();
  if (mqMobile.matches && legendOpen) { legendOpen = false; syncLegend(); }
});

outer.addEventListener('contextmenu', e => {
  if (isRulerMode && rulerPoints.length > 0) {
    e.preventDefault();
    rulerPoints.pop();
    updateRuler();
  }
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
const rTog = $('ruler-toggle');
if (rTog) rTog.addEventListener('click', () => setRulerMode(!isRulerMode));
const rClr = $('ruler-clear');
if (rClr) rClr.addEventListener('click', () => { rulerPoints = []; updateRuler(); });
const rCls = $('ruler-close');
if (rCls) rCls.addEventListener('click', () => setRulerMode(false));

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
  const wikiUrl = getEntityWikiUrl(it, 'eyalet', null);
  const links =
    '<a class="ip-link ip-wiki-btn" href="' + esc(wikiUrl) + '">' +
    ICON_BOOK + '<span>' + esc(str('wikiGo') || 'Wiki Sayfasına Git') + '</span></a>' +
    (it.kingdomId ? '<a class="ip-link" href="' + esc(window.SWRoute.href('devlet', it.kingdomId)) + '">' + ICON_FLAG + '<span>' + esc(str('kingdom')) + '</span></a>' : '') +
    (it.loreId && it.loreId !== it.id ? '<a class="ip-link" href="' + esc(window.SWRoute.href('evren', it.loreId)) + '">' + ICON_BOOK + '<span>' + esc(str('lore')) + '</span></a>' : '');

  $('ip-body').innerHTML =
    (ruler ? '<p class="ip-sl">' + esc(str('rule')) + '</p><span class="ip-house">' + esc(ruler) + '</span>' : '') +
    (desc ? '<p class="ip-sl">' + esc(str('desc')) + '</p><p class="ip-desc">' + esc(desc) + '</p>' : '') +
    (tags.length ? '<p class="ip-sl">' + esc(str('tags')) + '</p><div class="ip-tags">' + tags.map(x => '<span class="iptag">' + esc(x) + '</span>').join('') + '</div>' : '') +
    (chars ? '<p class="ip-sl">' + esc(str('chars')) + '</p><div class="ip-chars">' + chars + '</div>' : '') +
    (links ? '<div class="ip-links">' + links + '</div>' : '');
  if (window.Wiki.Tooltip && window.Wiki.Tooltip.scan) window.Wiki.Tooltip.scan($('ip-body'));
}

function selectItem(id, targetEl) {
  if (!cur) return;
  const it = cur.legend.find(i => i.id === id);
  if (!it) return;
  curItem = it; curFeature = null;
  if (targetEl) setActiveSvg(targetEl);
  else if (overlayEl) {
    const el = overlayEl.querySelector('[data-region="' + id + '"]');
    if (el) setActiveSvg(el);
  }
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
  curItem = null; curFeature = null;
  $('ipanel').classList.remove('open');
  document.documentElement.classList.remove('mp-info-open');
  markLegend();
  clearActiveSvg();
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

  const isTr = Lang.get() === 'tr';
  const searchInput = $('map-search-input');
  if (searchInput) searchInput.placeholder = str('searchPlaceholder');
  const vigBtn = $('vignette-toggle');
  if (vigBtn) vigBtn.title = str('vignette');
  const rulerBtn = $('ruler-toggle');
  if (rulerBtn) rulerBtn.title = str('rulerTool');
  const rulerTitleEl = $('ruler-hud-title');
  if (rulerTitleEl) rulerTitleEl.textContent = str('rulerTool');
  const rulerClearEl = $('ruler-clear');
  if (rulerClearEl) rulerClearEl.textContent = str('rulerClear');

  // Pusula yön etiketleri (K/G/D/B veya N/S/E/W)
  const cpLabels = document.querySelectorAll('.cp-label');
  if (cpLabels.length >= 4) {
    cpLabels[0].textContent = isTr ? 'K' : 'N';
    cpLabels[1].textContent = isTr ? 'G' : 'S';
    cpLabels[2].textContent = isTr ? 'D' : 'E';
    cpLabels[3].textContent = isTr ? 'B' : 'W';
  }
}
function applyLang() {
  document.documentElement.lang = Lang.get();
  applyStatic(); renderTabs(); renderCards(); setTitle();
  if (cur) {
    renderLegend(); img.alt = L(cur.title);
    if (curItem) renderInfo(curItem);
    else if (curFeature) renderFeatureInfo(curFeature.f, curFeature.kind);
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
  /* Yönetim panelinin yerel taslağı (sw-db:maps.json) SİLİNMEZ: Haritalar → Harita konumları ile
     eklenen şehir/dağ/göl/nehir/bölgeler bu taslakta tutulur ve burada önizlenir.
     Konum içermeyen eski taslaklar zaten otomatik yok sayılır (aşağıda hasGeo). */
  try { localStorage.removeItem('sw_map_cache'); } catch (ce) {}

  initWiki({ onLangChange: applyLang, injectFooter: true });
  applyStatic();
  updateButtons();
  initVignette();
  initSearch();

  const wireLayerBtn = (id, cls) => {
    const btn = $(id);
    if (btn) {
      btn.addEventListener('click', () => {
        const isHidden = outer.classList.toggle(cls);
        btn.classList.toggle('is-active', !isHidden);
        btn.setAttribute('aria-pressed', !isHidden ? 'true' : 'false');
      });
    }
  };
  wireLayerBtn('regions-toggle', 'hide-regions');
  wireLayerBtn('cities-toggle', 'hide-cities');
  wireLayerBtn('geo-toggle', 'hide-geo');
  wireLayerBtn('labels-toggle', 'hide-labels');

  const popEl = $('map-popover');
  if (popEl) {
    popEl.addEventListener('mouseenter', () => clearTimeout(popoverTimer));
    popEl.addEventListener('mouseleave', () => scheduleHidePopover());
  }
  const popClose = $('pop-close');
  if (popClose) {
    popClose.addEventListener('click', e => {
      e.stopPropagation();
      hidePopover(0);
    });
  }

  try {
    /* Önce yönetim panelinin yerel taslağı (varsa) → konum (features/regions) içeriyorsa onu kullan;
       yoksa yayındaki data/maps.json'u taze çek (eski/konumsuz taslak yayını gölgelemesin). */
    const hasGeo = d => !!(d && Array.isArray(d.maps) && d.maps.some(m =>
      (m && Array.isArray(m.regions) && m.regions.length) ||
      (m && m.features && Object.keys(m.features).some(k => Array.isArray(m.features[k]) && m.features[k].length))));
    let raw = null;
    try { const d0 = await loadData('maps.json'); if (hasGeo(d0)) raw = d0; } catch (le) { /* ağa düş */ }
    if (!raw) {
      try {
        const resp = await fetch('data/maps.json?t=' + Date.now());
        if (resp.ok) raw = await resp.json();
      } catch (fe) {
        console.warn('maps.json doğrudan getirme uyarısı:', fe);
      }
    }
    if (!raw || !raw.maps) raw = await loadData('maps.json');
    maps = normalize(raw);
    try { geoData = await loadData('geography.json'); } catch (e) { console.warn('geography.json atlandı', e); }
  } catch (err) {
    console.error(err); fail(err); return;
  }
  renderTabs(); renderCards();
  route();
}

init();

})();
