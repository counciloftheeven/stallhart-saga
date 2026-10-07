/* ═══════════════════════════════════════════════════════════════
   YÖNETİM PANELİ → HARİTALAR  (v17)
   ---------------------------------------------------------------
   harita.html'deki her SEKME bir "harita" kaydıdır (data/maps.json):
     · başlık + kısa açıklama (TR/EN), sekmede göster / gizle
     · harita görseli (PNG / JPG / WebP yükle ya da depo yolu)
     · o haritaya ÖZGÜ lejant: başlık + maddeler (renk, ad, üst etiket,
       başkent, yönetim, tanım, özellikler, ilgili karakterler,
       Evren ve Devlet bağlantıları)
   Yeni harita eklemek = yeni sekme. Sıra, listedeki sıradır.
    HARİTA KONUMLARI (v18): görselin üzerinde tıklayarak yeni şehir, dağ, göl,
    nehir çizgisi ve önemli bölge (sınır + lejant maddesi) ekleme / düzenleme /
    silme; yakınlaştırma, kaydırma, konuma git. Veri: maps.json → features, regions.

   Bu dosya admin.js'in çekirdeğine window.AdminCore / AdminBridge
   üzerinden bağlanır (admin-community.js ile aynı yöntem).
   Kaydet → yerel taslak (localStorage, "sw-db:maps.json");
   yayın için Veri & Yayın → maps.json'u indirip data/ klasörüne koyun.
   ═══════════════════════════════════════════════════════════════ */
(function () {
'use strict';

var A = window.AdminCore, B = window.AdminBridge;
if (!A || !B) return;
var $ = A.$, esc = A.esc, toast = A.toast, DB = A.DB;
var FILE = 'maps.json';
var HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
var ID_RE = /^[a-z0-9][a-z0-9-]*$/;
var IMG_CFG = { maxW: 3600, maxH: 3600, keepPng: true, limit: 2400000 };
var KG_TYPES = { empire: ['İmparatorluk', 'Empire'], kingdom: ['Krallık', 'Kingdom'], state: ['Devlet', 'State'], 'house-state': ['Hane Devleti', 'House-State'] };

var ME = null;      /* açık editör durumu; null → liste görünümü */

/* ── YARDIMCILAR ──────────────────────────────────────────── */
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function tr(s) { return String(s == null ? '' : s).trim(); }
function bi(o) { return (o && typeof o === 'object' && !Array.isArray(o)) ? { tr: String(o.tr == null ? '' : o.tr), en: String(o.en == null ? '' : o.en) } : { tr: o == null ? '' : String(o), en: '' }; }
function arr(v) { return (Array.isArray(v) ? v : []).map(tr).filter(Boolean); }
function slug(str) {
  var map = { 'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g', 'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c' };
  return String(str || '').replace(/[ıİşŞğĞüÜöÖçÇ]/g, function (m) { return map[m]; })
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 60);
}
function uniq(base, taken) {
  var id = base || 'kayit', n = 2;
  while (taken.indexOf(id) >= 0) { id = (base || 'kayit') + '-' + n; n++; }
  return id;
}
function getP(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
function setP(o, p, v) {
  var ks = p.split('.'), last = ks.pop();
  var t = ks.reduce(function (a, k) { return a[k]; }, o);
  t[last] = v;
}
function safe(src) { return window.Wiki && window.Wiki.safeImg ? window.Wiki.safeImg(src) : ''; }
function kb(v) { return Math.round(String(v).length * 0.75 / 1024); }

function data() {
  var d = DB[FILE];
  if (!d || typeof d !== 'object' || Array.isArray(d)) d = DB[FILE] = {};
  if (!d.version) d.version = 1;
  if (!Array.isArray(d.maps)) d.maps = [];
  return d;
}
function list() { return data().maps; }
function persist() { return A.save(FILE); }
function kingdoms() { return (DB['kingdoms.json'] && DB['kingdoms.json'].kingdoms) || []; }
function characters() { return (DB['characters.json'] && DB['characters.json'].characters) || []; }
function glossary() { return (DB['lore.json'] && DB['lore.json'].glossary) || []; }

/* ── VARSAYILAN KAYITLAR ──────────────────────────────────── */
function blankItem() {
  return { id: '', color: '#8a7a5a', name: bi(), eyebrow: bi(), capital: bi(), ruler: bi(), desc: bi(),
    tags: { tr: [], en: [] }, chars: [], loreId: '', kingdomId: '', _locked: false, _open: true };
}
function normItem(it, locked) {
  it = it || {};
  var tg = it.tags && typeof it.tags === 'object' ? it.tags : {};
  return {
    id: tr(it.id), color: HEX.test(tr(it.color)) ? tr(it.color) : '#8a7a5a',
    name: bi(it.name), eyebrow: bi(it.eyebrow), capital: bi(it.capital), ruler: bi(it.ruler), desc: bi(it.desc),
    tags: { tr: arr(tg.tr), en: arr(tg.en) },
    chars: (Array.isArray(it.chars) ? it.chars : []).map(function (c) { return { name: String((c && c.name) || ''), role: bi(c && c.role), id: tr(c && c.id) }; }),
    loreId: tr(it.loreId), kingdomId: tr(it.kingdomId), _locked: !!locked, _open: false
  };
}
function normMap(m, isNew) {
  m = m || {};
  return {
    id: tr(m.id), title: bi(m.title), desc: bi(m.desc), image: tr(m.image), thumb: tr(m.thumb),
    hidden: m.hidden === true,
    legendTitle: (m.legendTitle ? bi(m.legendTitle) : { tr: 'Lejant', en: 'Legend' }),
    legend: (Array.isArray(m.legend) ? m.legend : []).map(function (it) { return normItem(it, !isNew); }),
    regions: (Array.isArray(m.regions) ? m.regions : []).map(function (r) {
      r = r || {};
      return { id: tr(r.id), points: ptList(r.points), labelPos: pt2(r.labelPos), sub: r.sub ? bi(r.sub) : null };
    }).filter(function (r) { return r.id && r.points.length >= 3; }),
    features: normFeatures(m.features, !isNew)
  };
}
function pt2(p) { return Array.isArray(p) && p.length === 2 && isFinite(+p[0]) && isFinite(+p[1]) ? [+p[0], +p[1]] : null; }
function ptList(a) { return (Array.isArray(a) ? a : []).map(pt2).filter(Boolean); }
function normFeatures(f, locked) {
  var out = {}; f = (f && typeof f === 'object') ? f : {};
  ['sehir', 'dag', 'gol', 'nehir'].forEach(function (k) {
    out[k] = (Array.isArray(f[k]) ? f[k] : []).map(function (x) {
      x = x || {};
      var o = { id: tr(x.id), name: tr(x.name), desc: bi(x.desc), _locked: !!locked };
      if (k === 'nehir') o.points = ptList(x.points); else { o.x = Number(x.x); o.y = Number(x.y); }
      return o;
    }).filter(function (o) { return k === 'nehir' ? o.points.length >= 2 : (isFinite(o.x) && isFinite(o.y)); });
  });
  return out;
}
function itemFromKingdom(k, takenIds) {
  var t = KG_TYPES[k.type] || ['Devlet', 'State'];
  var st = (k.strengths && typeof k.strengths === 'object') ? k.strengths : {};
  var it = normItem({
    id: uniq(slug(k.id || (k.name && k.name.tr)), takenIds), color: k.color,
    name: k.name, eyebrow: { tr: t[0], en: t[1] }, capital: k.capital, ruler: k.ruler, desc: k.desc,
    tags: { tr: (st.tr || []).slice(0, 3), en: (st.en || []).slice(0, 3) },
    chars: k.rulerId ? [{ name: tr(k.ruler && k.ruler.tr).replace(/^(İmparator|Kral)\s+/, ''), role: { tr: 'Hükümdar', en: 'Ruler' }, id: k.rulerId }] : [],
    kingdomId: k.id
  }, false);
  it._open = true;
  return it;
}

/* ═══════════════════════════════════════════════════════════
   LİSTE GÖRÜNÜMÜ
   ═══════════════════════════════════════════════════════════ */
function renderList() {
  ME = null;
  var add = $('#add-btn'); if (add) add.style.display = '';
  var maps = list();
  $('#view').innerHTML =
    '<div class="notice">Her kayıt <strong>harita.html</strong> sayfasında bir <strong>sekme</strong> olur; sekmelerin sırası aşağıdaki sıradır. ' +
    'Yeni harita eklemek yeni sekme açar. Her haritanın kendi <strong>lejantı</strong> vardır (ör. İmparatorluk → eyaletler, Dünya → devletler). ' +
    'Görsel <em>yüklenmemişse</em> sekme yine görünür ve “Harita henüz yüklenmedi” yazar.</div>' +
    (maps.length
      ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th style="width:84px">Önizleme</th><th>Sekme</th><th>Görsel</th><th>Lejant</th><th>Durum</th><th></th></tr></thead><tbody>' +
        maps.map(function (m, i) {
          var pic = safe(m.thumb) || safe(m.image);
          return '<tr>' +
            '<td>' + (pic ? '<img class="kg-thumb" style="width:72px;height:48px;object-fit:cover" src="' + esc(pic) + '" alt="" loading="lazy">' : '<div class="kg-thumb kg-thumb-empty" style="width:72px;height:48px">—</div>') + '</td>' +
            '<td><div class="cell-name">' + esc(A.biVal(m.title) || m.id) + '</div><div class="cell-sub">#' + esc(m.id) + '</div></td>' +
            '<td style="font-size:.76rem;color:var(--parchd);line-height:1.7">' + (m.image ? (/^data:/.test(m.image) ? '<span style="color:var(--gold)">yüklendi</span> (taslak · ~' + kb(m.image) + ' KB)' : '<span style="color:var(--gold)">yol</span>') : 'yok') + '</td>' +
            '<td style="font-size:.78rem;color:var(--parchd)">' + ((m.legend || []).length) + ' madde</td>' +
            '<td>' + (m.hidden ? '<span class="pill neutral">Gizli</span>' : '<span class="pill alive">Sekmede</span>') + '</td>' +
            '<td><div class="cell-acts">' +
              '<button class="abtn sm" data-mp="move-up" data-i="' + i + '"' + (i === 0 ? ' disabled' : '') + ' aria-label="Yukarı taşı" title="Sekmeyi öne al">↑</button>' +
              '<button class="abtn sm" data-mp="move-down" data-i="' + i + '"' + (i === maps.length - 1 ? ' disabled' : '') + ' aria-label="Aşağı taşı" title="Sekmeyi sona al">↓</button>' +
              '<a class="abtn sm" href="' + esc(SWRoute.href('harita', m.id)) + '" target="_blank" rel="noopener">Sayfa ↗</a>' +
              '<button class="abtn sm" data-mp="edit" data-i="' + i + '">Düzenle</button>' +
              '<button class="abtn sm danger" data-mp="del" data-i="' + i + '">Sil</button>' +
            '</div></td></tr>';
        }).join('') + '</tbody></table></div>'
      : '<div class="empty-a">Henüz harita yok. “+ Yeni Ekle” ile ilk sekmeyi oluşturun.</div>');
}

/* ═══════════════════════════════════════════════════════════
   EDİTÖR
   ═══════════════════════════════════════════════════════════ */
function openEditor(idx) {
  var src = idx == null ? null : list()[idx];
  ME = { idx: idx, isNew: idx == null, work: normMap(src ? clone(src) : null, idx == null), dirty: false, idTouched: false };
  if (ME.isNew) ME.work.legendTitle = { tr: 'Lejant', en: 'Legend' };
  renderEditor();
  window.scrollTo(0, 0);
  var main = document.querySelector('.main'); if (main) main.scrollTop = 0;
}

/* — form parçaları — */
function fInput(label, path, val, o) {
  o = o || {};
  return '<div class="f-row"><label class="f-label">' + esc(label) + (o.req ? ' <span style="color:var(--bloodb)">*</span>' : '') + '</label>' +
    '<input class="f-input" data-p="' + esc(path) + '"' + (o.k ? ' data-k="' + o.k + '"' : '') + ' value="' + esc(val) + '"' +
    (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (o.ro ? ' readonly' : '') + (o.list ? ' list="' + o.list + '"' : '') + '>' +
    (o.hint ? '<div class="f-hint">' + o.hint + '</div>' : '') + '</div>';
}
function fBi(label, path, val, o) {
  o = o || {}; val = val || { tr: '', en: '' };
  var el = function (lang, v) {
    var a = 'data-p="' + esc(path + '.' + lang) + '"' + (o.k ? ' data-k="' + o.k + '"' : '');
    return o.area
      ? '<textarea class="f-area" ' + a + ' placeholder="' + (lang === 'tr' ? 'Türkçe' : 'English') + '">' + esc(v) + '</textarea>'
      : '<input class="f-input" ' + a + ' value="' + esc(v) + '" placeholder="' + (lang === 'tr' ? 'Türkçe' : 'English') + '">';
  };
  return '<div class="f-row"><label class="f-label">' + esc(label) + (o.req ? ' <span style="color:var(--bloodb)">*</span>' : '') + '</label>' +
    '<div class="bi-pair"><div><span class="bi-tag">Türkçe</span>' + el('tr', val.tr) + '</div>' +
    '<div><span class="bi-tag">English</span>' + el('en', val.en) + '</div></div>' +
    (o.hint ? '<div class="f-hint">' + o.hint + '</div>' : '') + '</div>';
}

function itemHTML(it, i) {
  var p = 'legend.' + i;
  var head =
    '<div class="mpe-head" data-mp="item-toggle" data-i="' + i + '" role="button" tabindex="0" aria-expanded="' + (it._open ? 'true' : 'false') + '">' +
    '<span class="mpe-caret" aria-hidden="true">' + (it._open ? '▾' : '▸') + '</span>' +
    '<span class="mpe-dot" style="background:' + esc(HEX.test(it.color) ? it.color : '#8a7a5a') + '"></span>' +
    '<span class="mpe-iname">' + esc(it.name.tr || it.name.en || 'Adsız madde') + '</span>' +
    '<span class="mpe-iid">' + esc(it.id) + '</span>' +
    '<span class="mpe-acts">' +
      '<button type="button" class="abtn sm" data-mp="item-up" data-i="' + i + '"' + (i === 0 ? ' disabled' : '') + ' aria-label="Yukarı taşı">↑</button>' +
      '<button type="button" class="abtn sm" data-mp="item-down" data-i="' + i + '"' + (i === ME.work.legend.length - 1 ? ' disabled' : '') + ' aria-label="Aşağı taşı">↓</button>' +
      '<button type="button" class="abtn sm danger" data-mp="item-del" data-i="' + i + '" aria-label="Maddeyi sil">✕</button>' +
    '</span></div>';
  if (!it._open) return '<div class="mpe-item" data-item="' + i + '">' + head + '</div>';

  var kOpts = '<option value="">— bağlantı yok —</option>' + kingdoms().map(function (k) {
    return '<option value="' + esc(k.id) + '"' + (k.id === it.kingdomId ? ' selected' : '') + '>' + esc(A.biVal(k.name) || k.id) + '</option>';
  }).join('');
  var cOpts = function (sel) {
    return '<option value="">— karakter sayfası yok —</option>' + characters().map(function (c) {
      return '<option value="' + esc(c.id) + '"' + (c.id === sel ? ' selected' : '') + '>' + esc(A.biVal(c.name) || c.id) + '</option>';
    }).join('');
  };
  var chars = it.chars.map(function (c, j) {
    var q = p + '.chars.' + j;
    return '<div class="mpe-char">' +
      '<input class="f-input" data-p="' + q + '.name" value="' + esc(c.name) + '" placeholder="Ad">' +
      '<input class="f-input" data-p="' + q + '.role.tr" value="' + esc(c.role.tr) + '" placeholder="Görev (TR)">' +
      '<input class="f-input" data-p="' + q + '.role.en" value="' + esc(c.role.en) + '" placeholder="Role (EN)">' +
      '<select class="f-select" data-p="' + q + '.id">' + cOpts(c.id) + '</select>' +
      '<button type="button" class="abtn sm danger" data-mp="char-del" data-i="' + i + '" data-j="' + j + '" aria-label="Karakteri kaldır">✕</button></div>';
  }).join('');

  return '<div class="mpe-item open" data-item="' + i + '">' + head + '<div class="mpe-body">' +
    '<div class="f-row half">' +
      '<div><label class="f-label">Renk <span style="color:var(--bloodb)">*</span></label><div class="mpe-color">' +
        '<input type="color" data-p="' + p + '.color" data-k="colorpick" value="' + esc(/^#[0-9a-f]{6}$/i.test(it.color) ? it.color : '#8a7a5a') + '" aria-label="Renk seç">' +
        '<input class="f-input" data-p="' + p + '.color" data-k="color" value="' + esc(it.color) + '" placeholder="#8a7a5a" maxlength="7"></div>' +
        '<div class="f-hint">Haritadaki bölgenin rengiyle eşleştirin.</div></div>' +
      '<div><label class="f-label">Kimlik (adres) <span style="color:var(--bloodb)">*</span></label>' +
        '<input class="f-input" data-p="' + p + '.id" data-k="itemid" value="' + esc(it.id) + '" placeholder="otomatik: addan üretilir"' + (it._locked ? ' readonly' : '') + '>' +
        '<div class="f-hint">' + (it._locked ? 'Kayıtlı maddelerin kimliği değişmez: <code>#/harita/…/' + esc(it.id) + '</code> ve karakter sayfalarındaki “Haritada gör” bağlantıları buna dayanır.' : 'a-z, 0-9 ve tire. Kaydettikten sonra değiştirilemez.') + '</div></div>' +
    '</div>' +
    fBi('Ad', p + '.name', it.name, { req: true }) +
    fBi('Üst etiket', p + '.eyebrow', it.eyebrow, { hint: 'Ad’ın üstünde küçük görünür (ör. “Kuzey Eyaleti”, “Krallık”).' }) +
    fBi('Başkent / merkez', p + '.capital', it.capital) +
    fBi('Yönetim', p + '.ruler', it.ruler, { hint: 'Yönetici hane veya hükümdar.' }) +
    fBi('Tanım', p + '.desc', it.desc, { area: true }) +
    fBi('Özellikler (virgülle ayırın)', p + '.tags', { tr: it.tags.tr.join(', '), en: it.tags.en.join(', ') }, { k: 'tags' }) +
    '<div class="f-row"><label class="f-label">İlgili karakterler</label>' + chars +
      '<button type="button" class="abtn sm" data-mp="char-add" data-i="' + i + '">+ Karakter ekle</button></div>' +
    '<div class="f-row half">' +
      '<div><label class="f-label">Evren (ansiklopedi) bağlantısı</label><input class="f-input" data-p="' + p + '.loreId" value="' + esc(it.loreId) + '" list="mpe-lore" placeholder="ör. solgar"><div class="f-hint"><code>#/evren/…</code> — Sözlük kimliği.</div></div>' +
      '<div><label class="f-label">Devlet maddesi bağlantısı</label><select class="f-select" data-p="' + p + '.kingdomId">' + kOpts + '</select><div class="f-hint"><code>#/devlet/…</code></div></div>' +
    '</div></div></div>';
}

function editorHTML() {
  var w = ME.work;
  var used = w.legend.map(function (x) { return x.kingdomId; });
  var kAvail = kingdoms().filter(function (k) { return used.indexOf(k.id) < 0; });
  return '' +
    '<datalist id="mpe-lore">' + glossary().map(function (g) { return '<option value="' + esc(g.id) + '">' + esc(A.biVal(g.term)) + '</option>'; }).join('') + '</datalist>' +
    '<div class="mpe-sticky"><div class="te-bar">' +
      '<button type="button" class="abtn sm" data-mp="back">← Haritalar</button>' +
      '<span class="te-title">' + esc(w.title.tr || (ME.isNew ? 'Yeni harita' : w.id)) + '</span>' +
      '<span class="te-dirty" id="mpe-dirty">' + (ME.dirty ? '● kaydedilmemiş değişiklik' : '') + '</span>' +
      '<div class="te-bar-r">' +
        (ME.isNew ? '' : '<a class="abtn sm" href="' + esc(SWRoute.href('harita', w.id)) + '" target="_blank" rel="noopener">Sitede aç ↗</a>') +
        '<button type="button" class="abtn" data-mp="cancel">Vazgeç</button>' +
        '<button type="button" class="abtn primary" data-mp="save">Kaydet</button>' +
      '</div></div></div>' +
    '<div class="notice warn" id="mpe-errors" hidden></div>' +

    '<div class="panel"><div class="panel-t">Sekme</div>' +
      fBi('Başlık', 'title', w.title, { req: true }) +
      fBi('Kısa açıklama', 'desc', w.desc, { area: true, hint: 'Açılış ekranındaki kartta görünür.' }) +
      '<div class="f-row half">' +
        '<div><label class="f-label">Kimlik (adres) <span style="color:var(--bloodb)">*</span></label>' +
          '<input class="f-input" data-p="id" data-k="mapid" value="' + esc(w.id) + '" placeholder="başlıktan üretilir"' + (ME.isNew ? '' : ' readonly') + '>' +
          '<div class="f-hint">' + (ME.isNew ? 'Adres: <code>#/harita/kimlik</code>. a-z, 0-9 ve tire; kaydettikten sonra değiştirilemez.' : 'Adres: <code>#/harita/' + esc(w.id) + '</code> — kayıtlı sekmenin kimliği değişmez.') + '</div></div>' +
        '<div><label class="f-label">Görünürlük</label>' +
          '<label class="mpe-check"><input type="checkbox" data-p="hidden" data-k="show"' + (w.hidden ? '' : ' checked') + '> Sekmelerde göster</label>' +
          '<div class="f-hint">Kapatırsanız harita hazırlanırken ziyaretçiler görmez.</div></div>' +
      '</div></div>' +

    '<div class="panel" id="mpe-img"><div class="panel-t">Harita görseli</div>' +
      '<div class="f-row"><label class="f-label">Görsel yükle</label>' +
        '<input type="file" class="kgi-file" data-mp-file="image" accept="image/png,image/jpeg,image/webp">' +
        '<div class="f-hint">PNG, JPG veya WebP. Tarayıcıda en fazla 3600 px’e küçültülür; şeffaf PNG mümkünse PNG kalır, çok büyükse JPEG’e çevrilir. ' +
        'Taslak, tarayıcı depolamasında tutulur (yaklaşık 5 MB sınır).</div></div>' +
      '<div class="f-row"><label class="f-label">ya da depo yolu <span style="font-weight:400">(yayın için önerilen)</span></label>' +
        '<input class="f-input" data-p="image" placeholder="assets/images/maps/dunya.png">' +
        '<div class="f-hint">Görseli depoda <code>assets/images/maps/</code> altına elle koyup yolunu yazın — JSON hafif kalır ve dosya tam kalitede yayınlanır. GitHub Pages dosya adında büyük/küçük harfe duyarlıdır.</div></div>' +
      '<div class="kgi-prev mpe-prev"></div>' +
      '<div class="btn-row" style="margin-top:.6rem">' +
        '<button type="button" class="abtn sm" data-mp="img-dl">Dosya olarak indir</button>' +
        '<button type="button" class="abtn sm danger" data-mp="img-rm">Görseli kaldır</button></div>' +
      '<div class="f-row" style="margin-top:1.1rem"><label class="f-label">Kart görseli <span style="font-weight:400">(isteğe bağlı, yol)</span></label>' +
        '<input class="f-input" data-p="thumb" value="' + esc(/^data:/.test(w.thumb) ? '' : w.thumb) + '" placeholder="assets/images/maps/dunya-onizleme.jpg">' +
        '<div class="f-hint">Açılış kartında gösterilen küçük görsel. Boşsa ana görsel kullanılır (büyük haritalarda küçük bir önizleme yayını hızlandırır).</div></div>' +
    '</div>' +

    '<div class="panel"><div class="panel-t">Lejant</div>' +
      fBi('Lejant başlığı', 'legendTitle', w.legendTitle, { hint: 'ör. “Eyaletler”, “Devletler”.' }) +
      '<div class="btn-row" style="margin:.4rem 0 1rem">' +
        '<button type="button" class="abtn sm primary" data-mp="item-add">+ Madde ekle</button>' +
        (kAvail.length
          ? '<select class="f-select" id="mpe-kg" style="width:auto;min-width:12rem">' + kAvail.map(function (k) { return '<option value="' + esc(k.id) + '">' + esc(A.biVal(k.name) || k.id) + '</option>'; }).join('') + '</select>' +
            '<button type="button" class="abtn sm" data-mp="item-add-kg">+ Devletten ekle</button>'
          : '') +
        '<span style="flex:1"></span>' +
        '<button type="button" class="abtn sm" data-mp="items-open">Tümünü aç</button>' +
        '<button type="button" class="abtn sm" data-mp="items-close">Tümünü kapat</button></div>' +
      (w.legend.length ? w.legend.map(itemHTML).join('') : '<div class="empty-a">Bu haritada lejant maddesi yok.</div>') +
    '</div>' +
    geoHTML();
}

function renderEditor() {
  var add = $('#add-btn'); if (add) add.style.display = 'none';
  $('#view').innerHTML = editorHTML();
  paintImg();
  initGeo();
}

/* — görsel alanı — */
function paintImg() {
  var root = $('#mpe-img'); if (!root || !ME) return;
  var v = ME.work.image, isData = /^data:/i.test(v);
  var path = root.querySelector('[data-p="image"]'), prev = root.querySelector('.mpe-prev');
  var want = isData ? '' : v;
  if (path.value !== want) path.value = want;
  path.placeholder = isData ? 'Yüklenen görsel kullanılıyor — yol yazarsanız onun yerine geçer' : 'assets/images/maps/' + (ME.work.id || 'harita-adi') + '.png';
  root.querySelector('[data-mp="img-dl"]').style.display = isData ? '' : 'none';
  root.querySelector('[data-mp="img-rm"]').style.display = v ? '' : 'none';
  if (!v) { prev.innerHTML = '<div class="f-hint">Görsel yok — sekmede “Harita henüz yüklenmedi” görünür; lejant yine de çalışır.</div>'; return; }
  var s = safe(v);
  if (!s) { prev.innerHTML = '<div class="media-status bad">Geçersiz görsel yolu.</div>'; return; }
  prev.innerHTML = '<img class="kgi-img mpe-img" alt="">';
  var im = prev.firstChild;
  im.addEventListener('error', function () { prev.innerHTML = '<div class="media-status bad">Görsel bulunamadı — yolu kontrol edin.</div>'; }, { once: true });
  im.addEventListener('load', function () {
    var note = document.createElement('div'); note.className = 'f-hint';
    note.textContent = im.naturalWidth + ' × ' + im.naturalHeight + ' px' + (isData ? ' · yüklenen görsel (~' + kb(v) + ' KB)' : '');
    prev.appendChild(note);
  }, { once: true });
  im.src = s;
}

function markDirty() {
  if (!ME) return;
  ME.dirty = true;
  var d = $('#mpe-dirty'); if (d) d.textContent = '● kaydedilmemiş değişiklik';
}

/* ── KAYDET ───────────────────────────────────────────────── */
function showErrors(errs) {
  var box = $('#mpe-errors'); if (!box) return;
  if (!errs.length) { box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  box.innerHTML = '<strong>Kaydedilemedi:</strong><ul style="margin:.4rem 0 0 1.1rem">' + errs.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>';
  box.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function buildClean(errs) {
  var w = ME.work, maps = list();
  var others = maps.filter(function (m, i) { return i !== ME.idx; });
  var mapIds = others.map(function (m) { return m.id; });

  if (!tr(w.title.tr)) errs.push('Türkçe başlık gerekli.');
  var id = ME.isNew ? (tr(w.id).toLowerCase() || slug(w.title.tr)) : w.id;
  if (!id) errs.push('Kimlik üretilemedi — başlık ya da kimlik yazın.');
  else if (!ID_RE.test(id)) errs.push('Harita kimliği yalnızca küçük harf, rakam ve tire içerebilir (“' + id + '”).');
  else if (mapIds.indexOf(id) >= 0) errs.push('Bu harita kimliği başka bir sekmede kullanılıyor: ' + id);

  ['image', 'thumb'].forEach(function (k) {
    var v = tr(w[k]);
    if (v && !/^data:/i.test(v) && !safe(v)) errs.push((k === 'image' ? 'Harita görseli' : 'Kart görseli') + ' yolu geçersiz.');
  });

  /* Lejant kimlikleri tüm haritalarda tek olmalı: #/harita/<madde> adresi doğrudan çözülür. */
  var taken = [];
  others.forEach(function (m) { (m.legend || []).forEach(function (x) { taken.push(x.id); }); });
  var seen = [];
  var legend = w.legend.map(function (it, i) {
    var label = 'Madde ' + (i + 1) + (it.name.tr ? ' (' + it.name.tr + ')' : '');
    if (!tr(it.name.tr)) errs.push(label + ': Türkçe ad gerekli.');
    var iid = tr(it.id).toLowerCase();
    if (!iid) iid = uniq(slug(it.name.tr), taken.concat(seen).concat(mapIds).concat([id]));
    if (!ID_RE.test(iid)) errs.push(label + ': kimlik yalnızca küçük harf, rakam ve tire içerebilir (“' + iid + '”).');
    else if (seen.indexOf(iid) >= 0) errs.push(label + ': bu kimlik bu haritada zaten var (' + iid + ').');
    else if (taken.indexOf(iid) >= 0) errs.push(label + ': bu kimlik başka bir haritanın maddesinde kullanılıyor (' + iid + ').');
    else if (mapIds.indexOf(iid) >= 0 || iid === id) errs.push(label + ': kimlik bir harita kimliğiyle aynı olamaz (' + iid + ').');
    seen.push(iid);
    var color = tr(it.color);
    if (!HEX.test(color)) errs.push(label + ': renk #rgb veya #rrggbb biçiminde olmalı.');
    return {
      id: iid, color: color,
      name: { tr: tr(it.name.tr), en: tr(it.name.en) }, eyebrow: { tr: tr(it.eyebrow.tr), en: tr(it.eyebrow.en) },
      capital: { tr: tr(it.capital.tr), en: tr(it.capital.en) }, ruler: { tr: tr(it.ruler.tr), en: tr(it.ruler.en) },
      desc: { tr: tr(it.desc.tr), en: tr(it.desc.en) },
      tags: { tr: arr(it.tags.tr), en: arr(it.tags.en) },
      chars: it.chars.filter(function (c) { return tr(c.name); }).map(function (c) { return { name: tr(c.name), role: { tr: tr(c.role.tr), en: tr(c.role.en) }, id: tr(c.id) }; }),
      loreId: tr(it.loreId), kingdomId: tr(it.kingdomId)
    };
  });

  /* Harita konumları: şehir / dağ / göl / nehir + önemli bölge sınırları */
  var features = {};
  ['sehir', 'dag', 'gol', 'nehir'].forEach(function (k) {
    var seenF = [];
    features[k] = ((w.features && w.features[k]) || []).map(function (f, i) {
      var label = GKINDS[k].label + ' ' + (i + 1) + (f.name ? ' (' + f.name + ')' : '');
      if (!tr(f.name)) errs.push(label + ': ad gerekli.');
      var fid = tr(f.id).toLowerCase() || uniq(slug(f.name) || k, seenF);
      if (!ID_RE.test(fid)) errs.push(label + ': kimlik yalnızca küçük harf, rakam ve tire içerebilir (“' + fid + '”).');
      else if (seenF.indexOf(fid) >= 0) errs.push(label + ': bu kimlik zaten var (' + fid + ').');
      seenF.push(fid);
      var o = { id: fid, name: tr(f.name) };
      if (k === 'nehir') {
        var pts = ptList(f.points);
        if (pts.length < 2) errs.push(label + ': nehir en az 2 nokta gerektirir.');
        o.points = pts.map(function (p) { return [Math.round(p[0]), Math.round(p[1])]; });
      } else {
        if (!isFinite(f.x) || !isFinite(f.y)) errs.push(label + ': konum (x, y) sayı olmalı.');
        o.x = Math.round(Number(f.x)); o.y = Math.round(Number(f.y));
      }
      var d = { tr: tr(f.desc && f.desc.tr), en: tr(f.desc && f.desc.en) };
      if (d.tr || d.en) o.desc = d;
      return o;
    });
  });
  var legIds = legend.map(function (x) { return x.id; }), seenR = [];
  var regions = (w.regions || []).map(function (r, i) {
    var rid = tr(r.id), label = 'Bölge sınırı ' + (i + 1) + ' (' + rid + ')';
    if (legIds.indexOf(rid) < 0) errs.push(label + ': bağlı lejant maddesi bulunamadı — lejanttaki kimliği değiştirdiyseniz sınırı yeniden çizin.');
    if (seenR.indexOf(rid) >= 0) errs.push(label + ': aynı lejant maddesi için birden fazla sınır var.');
    seenR.push(rid);
    var pts = ptList(r.points);
    if (pts.length < 3) errs.push(label + ': en az 3 nokta gerekir.');
    var o = { id: rid, points: pts.map(function (p) { return [Math.round(p[0]), Math.round(p[1])]; }) };
    var lp = pt2(r.labelPos) || centroid(pts);
    if (lp) o.labelPos = [Math.round(lp[0]), Math.round(lp[1])];
    if (r.sub && (tr(r.sub.tr) || tr(r.sub.en))) o.sub = { tr: tr(r.sub.tr), en: tr(r.sub.en) };
    return o;
  });

  var out = {
    id: id, title: { tr: tr(w.title.tr), en: tr(w.title.en) }, desc: { tr: tr(w.desc.tr), en: tr(w.desc.en) },
    image: tr(w.image), thumb: tr(w.thumb),
    legendTitle: { tr: tr(w.legendTitle.tr), en: tr(w.legendTitle.en) }, legend: legend,
    regions: regions, features: features
  };
  if (w.hidden) out.hidden = true;
  return out;
}

function saveEditor() {
  try {
    var errs = [], out = buildClean(errs);
    showErrors(errs);
    if (errs.length) { toast('Formda düzeltilecek ' + errs.length + ' şey var.', true); return; }
    var maps = list(), prev = maps.slice();
    if (ME.isNew) maps.push(out); else maps[ME.idx] = out;
    if (!persist()) {                            /* depolama dolu → belleği eski hâline döndür */
      data().maps = prev;
      var isData = /^data:/i.test(out.image);
      toast(isData
        ? 'Tarayıcı hafıza sınırı (~5 MB) aşıldı! Görseli indirin ve assets/images/maps/ depo yolu olarak kaydedin.'
        : 'Kaydedilemedi — tarayıcı depolaması dolu olabilir. Görseli yükleme yerine depo yoluyla verin.', true);
      return;
    }
    ME.dirty = false;
    toast('Harita kaydedildi.');
    renderList();
  } catch (err) {
    console.error('saveEditor hatası:', err);
    toast('Kayıt hatası: Tarayıcı hafıza sınırı (~5 MB) aşıldı. Depo yolu kullanın.', true);
  }
}

/* ── OLAY BAĞLAMA (tek seferlik, #view üzerinde) ─────────── */
function inView() { return ME && A.current() === 'maps'; }

function readEl(t) {
  var k = t.getAttribute('data-k');
  if (t.type === 'checkbox') return k === 'show' ? !t.checked : t.checked;
  if (k === 'tags') return t.value.split(/[,;\n]/).map(tr).filter(Boolean);
  if (k === 'num') return t.value === '' ? NaN : Number(t.value);
  return t.value;
}

function onInput(e) {
  if (!inView()) return;
  var t = e.target;
  if (t.getAttribute && t.getAttribute('data-gp')) { gpInput(t); return; }
  var p = t.getAttribute && t.getAttribute('data-p');
  if (!p) return;
  var k = t.getAttribute('data-k');
  var v = readEl(t);
  var oldLegId = /^legend\.\d+\.id$/.test(p) ? getP(ME.work, p) : null;
  setP(ME.work, p, v);
  markDirty();
  if (oldLegId !== null && oldLegId !== v) {            /* lejant kimliği değişince bağlı bölge sınırı da izlesin */
    ME.work.regions.forEach(function (r) { if (r.id === oldLegId) r.id = tr(v); });
  }
  if (/^features\./.test(p)) {
    var mm = p.match(/^features\.(\w+)\.(\d+)\.name$/);
    if (mm) { var rn = document.querySelector('[data-grow="' + mm[1] + ':' + mm[2] + '"] .gp-rname'); if (rn) rn.textContent = v || 'Adsız'; }
    gpPaintSoon();
    return;
  }
  var view = $('#view');

  if (k === 'colorpick' || k === 'color') {
    var mate = view.querySelector('[data-p="' + p + '"][data-k="' + (k === 'color' ? 'colorpick' : 'color') + '"]');
    if (mate && k === 'colorpick') mate.value = v;
    if (mate && k === 'color' && /^#[0-9a-f]{6}$/i.test(v)) mate.value = v;
    var dot = t.closest('.mpe-item') && t.closest('.mpe-item').querySelector('.mpe-dot');
    if (dot && HEX.test(v)) dot.style.background = v;
  }
  if (/^legend\.\d+\.name\.tr$/.test(p) || /^legend\.\d+\.id$/.test(p)) {
    var head = t.closest('.mpe-item');
    var it = ME.work.legend[+p.split('.')[1]];
    if (head && it) {
      head.querySelector('.mpe-iname').textContent = it.name.tr || it.name.en || 'Adsız madde';
      head.querySelector('.mpe-iid').textContent = it.id;
    }
  }
  if (p === 'title.tr') {
    var ttl = view.querySelector('.te-title'); if (ttl) ttl.textContent = v || (ME.isNew ? 'Yeni harita' : ME.work.id);
    if (ME.isNew && !ME.idTouched) {
      ME.work.id = slug(v);
      var idEl = view.querySelector('[data-p="id"]'); if (idEl) idEl.value = ME.work.id;
      paintImgPlaceholder();
    }
  }
  if (k === 'mapid') { ME.idTouched = true; paintImgPlaceholder(); }
  if (p === 'image') paintImg();
}
function paintImgPlaceholder() {
  var path = document.querySelector('#mpe-img [data-p="image"]');
  if (path && !/^data:/i.test(ME.work.image)) path.placeholder = 'assets/images/maps/' + (ME.work.id || 'harita-adi') + '.png';
}

function onChange(e) {
  if (!inView()) return;
  var t = e.target;
  /* Dosya yükleme */
  if (t.getAttribute && t.getAttribute('data-mp-file') === 'image') {
    var f = t.files && t.files[0]; t.value = '';
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) { toast('Yalnızca PNG, JPG veya WebP yüklenebilir.', true); return; }
    if (f.size > 40 * 1024 * 1024) { toast('Dosya 40 MB’tan büyük olamaz.', true); return; }
    toast('Görsel işleniyor…');
    B.kgProcessImage(f, IMG_CFG).then(function (url) {
      if (!ME) return;
      ME.work.image = url; markDirty(); paintImg();
      toast('Görsel geçici data URL olarak yüklendi. Tarayıcı localStorage (~5 MB) sınırı nedeniyle lütfen görseli indirip assets/images/maps/ depo yolu olarak kaydedin.');
    }).catch(function (err) { toast((err && err.message) || 'Görsel işlenemedi.', true); });
    return;
  }
  /* Karakter seçilince boş adı doldur */
  var p = t.getAttribute && t.getAttribute('data-p');
  if (p && /^legend\.\d+\.chars\.\d+\.id$/.test(p) && t.value) {
    var base = p.replace(/\.id$/, '');
    var c = characters().find(function (x) { return x.id === t.value; });
    var cur = getP(ME.work, base + '.name');
    if (c && !tr(cur)) {
      var nm = A.biVal(c.name) || c.id;
      setP(ME.work, base + '.name', nm);
      var el = $('#view').querySelector('[data-p="' + base + '.name"]'); if (el) el.value = nm;
    }
  }
}

function move(arrList, i, d) {
  var j = i + d; if (j < 0 || j >= arrList.length) return false;
  var x = arrList[i]; arrList[i] = arrList[j]; arrList[j] = x; return true;
}

function onClick(e) {
  var b = e.target.closest && e.target.closest('[data-mp]');
  if (!b || A.current() !== 'maps') return;
  var act = b.getAttribute('data-mp'), i = +b.getAttribute('data-i'), j = +b.getAttribute('data-j');

  /* — liste — */
  if (!ME) {
    var maps = list();
    if (act === 'edit') openEditor(i);
    else if (act === 'move-up' || act === 'move-down') { if (move(maps, i, act === 'move-up' ? -1 : 1) && persist()) renderList(); }
    else if (act === 'del') {
      var m = maps[i]; if (!m) return;
      A.confirmBox('Haritayı sil', '“' + (A.biVal(m.title) || m.id) + '” sekmesi ve ' + (m.legend || []).length + ' lejant maddesi silinecek. ' +
        (m.legend && m.legend.length ? 'Karakter sayfalarındaki “Haritada gör” bağlantıları bu maddelere dayanıyorsa kırılır. ' : '') + 'Bu işlem geri alınamaz.', function () {
        var prev = maps.slice(); maps.splice(i, 1);
        if (persist()) { toast('Harita silindi.'); renderList(); } else data().maps = prev;
      });
    }
    return;
  }

  /* — editör — */
  var w = ME.work;
  switch (act) {
    case 'back': case 'cancel':
      if (ME.dirty) A.confirmBox('Kaydedilmemiş değişiklik', 'Yaptığınız değişiklikler kaydedilmedi. Yine de çıkılsın mı?', function () { renderList(); });
      else renderList();
      break;
    case 'save': saveEditor(); break;
    case 'item-toggle': if (w.legend[i]) { w.legend[i]._open = !w.legend[i]._open; renderEditor(); } break;
    case 'item-up': case 'item-down': if (move(w.legend, i, act === 'item-up' ? -1 : 1)) { markDirty(); renderEditor(); } break;
    case 'item-del': {
      var it = w.legend[i]; if (!it) break;
      var doDel = function () { w.regions = w.regions.filter(function (r) { return r.id !== it.id; }); w.legend.splice(i, 1); markDirty(); renderEditor(); };
      if (it._locked) A.confirmBox('Maddeyi sil', '“' + (it.name.tr || it.id) + '” lejanttan kalkacak. Karakter sayfalarındaki “Haritada gör” bağlantısı bu maddeyi kullanıyorsa kırılır. (Kaydedene kadar geri dönebilirsiniz: “Vazgeç”.)', doDel);
      else doDel();
      break;
    }
    case 'item-add': { var n = blankItem(); w.legend.push(n); markDirty(); renderEditor(); focusLast(); break; }
    case 'item-add-kg': {
      var sel = $('#mpe-kg'), k = sel && kingdoms().find(function (x) { return x.id === sel.value; });
      if (!k) break;
      var ids = []; list().forEach(function (m) { (m.legend || []).forEach(function (x) { ids.push(x.id); }); });
      w.legend.forEach(function (x) { ids.push(x.id); });
      list().forEach(function (m) { ids.push(m.id); }); ids.push(w.id);
      w.legend.push(itemFromKingdom(k, ids)); markDirty(); renderEditor(); focusLast(); break;
    }
    case 'items-open': case 'items-close': w.legend.forEach(function (x) { x._open = act === 'items-open'; }); renderEditor(); break;
    case 'char-add': if (w.legend[i]) { w.legend[i].chars.push({ name: '', role: bi(), id: '' }); markDirty(); renderEditor(); } break;
    case 'char-del': if (w.legend[i]) { w.legend[i].chars.splice(j, 1); markDirty(); renderEditor(); } break;
    case 'img-rm': w.image = ''; markDirty(); paintImg(); break;
    case 'gp-type': case 'gp-start': case 'gp-finish': case 'gp-undo': case 'gp-cancel':
    case 'gp-zoom-in': case 'gp-zoom-out': case 'gp-fit': case 'gp-goto': case 'gp-edit': case 'gp-del': case 'gp-redraw':
      gpAction(act, b); break;
    case 'img-dl': {
      var v = w.image; if (!/^data:/i.test(v)) break;
      var a = document.createElement('a'); a.href = v;
      a.download = (w.id || 'harita') + (/^data:image\/png/i.test(v) ? '.png' : /^data:image\/webp/i.test(v) ? '.webp' : '.jpg');
      document.body.appendChild(a); a.click(); a.remove();
      toast('İndirildi — dosyayı assets/images/maps/ klasörüne koyup yolunu yazın.');
      break;
    }
    default:
  }
}
function focusLast() {
  var items = document.querySelectorAll('#view .mpe-item');
  var last = items[items.length - 1];
  if (last) { last.scrollIntoView({ block: 'center', behavior: 'smooth' }); var f = last.querySelector('[data-p$=".name.tr"]'); if (f) f.focus({ preventScroll: true }); }
}

function bind() {
  var view = $('#view'); if (!view) return;
  view.addEventListener('input', onInput);
  view.addEventListener('change', onChange);
  view.addEventListener('click', onClick);
  view.addEventListener('keydown', function (e) {           /* madde başlığı klavye ile açılır/kapanır */
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('mpe-head') && ME) {
      e.preventDefault(); e.target.click();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (!inView() || !ME.geo || !ME.geo.mode) return;
    var tg = e.target && e.target.tagName;
    if (e.key === 'Escape') gpAction('gp-cancel');
    else if (e.key === 'Enter' && tg !== 'TEXTAREA' && tg !== 'BUTTON' && ME.geo.mode === 'draw') { e.preventDefault(); gpAction('gp-finish'); }
  });
  window.addEventListener('beforeunload', function (e) {
    if (ME && ME.dirty) { e.preventDefault(); e.returnValue = ''; }
  });
}

/* ═══════════════════════════════════════════════════════════
   HARİTA KONUMLARI — şehir · dağ · göl · nehir · önemli bölge
   Harita görselinin üstünde tıklayarak ekle / yeniden konumla / sil.
   Koordinatlar görselin GERÇEK piksel uzayındadır (harita.html ile aynı).
   ═══════════════════════════════════════════════════════════ */
var GKINDS = {
  sehir: { label: 'Şehir', icon: '🏰', color: '#c4962a', point: true },
  dag:   { label: 'Dağ', icon: '⛰', color: '#a89880', point: true },
  gol:   { label: 'Göl', icon: '💧', color: '#3f94cc', point: true },
  nehir: { label: 'Nehir', icon: '〰', color: '#00b4d8', point: false },
  bolge: { label: 'Önemli bölge', icon: '⬡', color: '#d9a441', point: false }
};
var GORDER = ['sehir', 'dag', 'gol', 'nehir', 'bolge'];

function pip(pt, poly) {
  var x = pt[0], y = pt[1], ins = false;
  for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
function centroid(pts) {
  if (!pts || !pts.length) return null;
  var cx = 0, cy = 0; pts.forEach(function (p) { cx += p[0]; cy += p[1]; });
  cx /= pts.length; cy /= pts.length;
  if (pip([cx, cy], pts)) return [cx, cy];
  var ys = pts.map(function (p) { return p[1]; }), by = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
  var xs = [];
  for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    var yi = pts[i][1], yj = pts[j][1];
    if ((yi > by) !== (yj > by)) xs.push(pts[i][0] + (by - yi) / (yj - yi) * (pts[j][0] - pts[i][0]));
  }
  xs.sort(function (a, b) { return a - b; });
  var best = null;
  for (var k = 0; k + 1 < xs.length; k += 2) if (!best || xs[k + 1] - xs[k] > best[1] - best[0]) best = [xs[k], xs[k + 1]];
  return best ? [(best[0] + best[1]) / 2, by] : [pts[0][0], pts[0][1]];
}
function bbox(pts) {
  var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
  return { x0: Math.min.apply(null, xs), x1: Math.max.apply(null, xs), y0: Math.min.apply(null, ys), y1: Math.max.apply(null, ys) };
}
function findLeg(id) { return ME && ME.work.legend.filter(function (x) { return x.id === id; })[0] || null; }

function geoState() {
  if (!ME.geo) {
    ME.geo = { type: 'sehir', mode: null, pts: [], vx: 0, vy: 0, vs: 0, fit: 0, natW: 0, natH: 0, open: '', hl: '',
      filter: 'all', q: '', redraw: null, _raf: 0,
      form: { name: '', dtr: '', den: '', legend: '__new', color: '#8a7a5a' } };
  }
  return ME.geo;
}

function geoHTML() {
  return '<div class="panel" id="mpe-geo"><div class="panel-t">Harita konumları</div>' +
    '<div class="f-hint" style="margin-bottom:.4rem">Şehir, dağ, göl, nehir çizgisi ya da yeni <strong>önemli bölge</strong> (sınır + lejant maddesi) ekleyin: ' +
    'türü seçin, adı yazın, <strong>Haritada işaretle</strong>’ye basıp görselin üzerinde tıklayın. ' +
    'Fare tekerleği yakınlaştırır, sürükleme kaydırır. Değişiklikler üstteki <strong>Kaydet</strong> ile maps.json taslağına yazılır.</div>' +
    '<div id="gp-form"></div>' +
    '<div class="gp-view" id="gp-view">' +
      '<div class="gp-inner" id="gp-inner"><img id="gp-img" alt="" draggable="false"><svg id="gp-svg" xmlns="http://www.w3.org/2000/svg"></svg></div>' +
      '<div class="gp-tools">' +
        '<button type="button" class="abtn sm" data-mp="gp-zoom-in" aria-label="Yakınlaştır">+</button>' +
        '<button type="button" class="abtn sm" data-mp="gp-zoom-out" aria-label="Uzaklaştır">−</button>' +
        '<button type="button" class="abtn sm" data-mp="gp-fit">Sığdır</button>' +
        '<span class="gp-zoom" id="gp-zoom"></span></div>' +
      '<div class="gp-empty">Konum eklemek için önce yukarıdaki “Harita görseli” bölümünden bir görsel yükleyin ya da depo yolu yazın.</div>' +
    '</div>' +
    '<div id="gp-list"></div></div>';
}

/* — form + eylem düğmeleri — */
function gpPaintForm() {
  var el = $('#gp-form'); if (!el || !ME) return;
  var g = geoState(), w = ME.work, f = g.form, K = GKINDS[g.type];
  var h = '<div class="gp-kinds">' + GORDER.map(function (k) {
    return '<button type="button" class="abtn sm' + (g.type === k ? ' primary' : '') + '" data-mp="gp-type" data-t="' + k + '"' + (g.mode ? ' disabled' : '') + '>' + GKINDS[k].icon + ' ' + GKINDS[k].label + '</button>';
  }).join('') + '</div>';

  if (g.redraw) {
    var rd = gpItem(g.redraw.kind, g.redraw.idx), rn = rd ? (g.redraw.kind === 'bolge' ? ((findLeg(rd.id) || {}).name || {}).tr || rd.id : rd.name) : '';
    h += '<div class="notice" style="margin:.4rem 0">“' + esc(rn) + '” için yeni ' + (K.point ? 'konum' : 'çizim') + ' yapılıyor.</div>';
  } else if (!g.mode) {
    var legNew = g.type === 'bolge' && f.legend === '__new';
    h += '<div class="f-row"><label class="f-label">' + (g.type === 'bolge' ? (legNew ? 'Yeni bölge / lejant maddesi adı' : 'Ad (lejant maddesinden alınır)') : 'Ad') + (g.type === 'bolge' && !legNew ? '' : ' <span style="color:var(--bloodb)">*</span>') + '</label>' +
      '<input class="f-input" data-gp="name" value="' + esc(f.name) + '" placeholder="' + (g.type === 'nehir' ? 'ör. Gümüş Nehir' : g.type === 'bolge' ? 'ör. Kuzey Marşı' : 'ör. Ravenhall') + '"' + (g.type === 'bolge' && !legNew ? ' disabled' : '') + '></div>';
    if (g.type === 'bolge') {
      h += '<div class="f-row half"><div><label class="f-label">Bağlı lejant maddesi</label><select class="f-select" data-gp="legend">' +
        '<option value="__new"' + (f.legend === '__new' ? ' selected' : '') + '>+ Yeni lejant maddesi oluştur</option>' +
        w.legend.filter(function (it) { return it.id; }).map(function (it) {
          var has = w.regions.some(function (r) { return r.id === it.id; });
          return '<option value="' + esc(it.id) + '"' + (f.legend === it.id ? ' selected' : '') + '>' + esc(it.name.tr || it.id) + (has ? ' — sınırı değişir' : ' — sınırı yok') + '</option>';
        }).join('') + '</select></div>' +
        '<div' + (legNew ? '' : ' style="display:none"') + '><label class="f-label">Bölge rengi</label><div class="mpe-color">' +
          '<input type="color" data-gp="color" value="' + esc(/^#[0-9a-f]{6}$/i.test(f.color) ? f.color : '#8a7a5a') + '" aria-label="Renk seç"></div></div></div>';
    }
    if (g.type !== 'bolge' || f.legend === '__new') {
      h += '<div class="f-row"><label class="f-label">Açıklama <span style="font-weight:400">(isteğe bağlı)</span></label><div class="bi-pair">' +
        '<div><span class="bi-tag">Türkçe</span><textarea class="f-area" data-gp="dtr" placeholder="Bilgi panelinde görünür">' + esc(f.dtr) + '</textarea></div>' +
        '<div><span class="bi-tag">English</span><textarea class="f-area" data-gp="den">' + esc(f.den) + '</textarea></div></div></div>';
    }
  }

  var need = g.type === 'bolge' ? 3 : 2;
  if (!g.mode) {
    h += '<div class="btn-row" style="margin:.5rem 0 .9rem"><button type="button" class="abtn primary" data-mp="gp-start">' +
      (K.point ? '📍 Haritada işaretle' : '✏ Çizmeye başla') + '</button>' +
      '<span class="f-hint" style="margin:0">' + (K.point ? 'Düğmeye basın, sonra görselde yerini tıklayın.' :
        g.type === 'nehir' ? 'Kaynaktan ağıza doğru noktaları sırayla tıklayın; Enter ya da “Bitir”.' : 'Sınır köşelerine sırayla tıklayın (en az 3); Enter ya da “Bitir”.') + '</span></div>';
  } else {
    h += '<div class="gp-active"><strong>' + K.icon + ' ' + (g.redraw ? 'Yeniden: ' : '') + K.label + '</strong> · ' +
      (K.point ? 'haritada konumu tıklayın' : g.pts.length + ' nokta eklendi (en az ' + need + ')') + ' · Esc: iptal ' +
      '<span style="flex:1"></span>' +
      (K.point ? '' : '<button type="button" class="abtn sm primary" data-mp="gp-finish"' + (g.pts.length < need ? ' disabled' : '') + '>Bitir</button>' +
        '<button type="button" class="abtn sm" data-mp="gp-undo"' + (g.pts.length ? '' : ' disabled') + '>Geri al</button>') +
      '<button type="button" class="abtn sm danger" data-mp="gp-cancel">İptal</button></div>';
  }
  el.innerHTML = h;
  var v = $('#gp-view'); if (v) v.classList.toggle('placing', !!g.mode);
}

/* — liste — */
function gpItem(kind, i) { return kind === 'bolge' ? ME.work.regions[i] : (ME.work.features[kind] || [])[i]; }
function gpName(kind, it) {
  if (kind === 'bolge') { var l = findLeg(it.id); return (l && (l.name.tr || l.name.en)) || it.id; }
  return it.name || 'Adsız';
}
function gpPaintList() {
  var box = $('#gp-list'); if (!box || !ME) return;
  var g = geoState(), w = ME.work, q = g.q.toLowerCase();
  var counts = GORDER.map(function (k) { return (k === 'bolge' ? w.regions.length : (w.features[k] || []).length) + ' ' + GKINDS[k].label.toLowerCase(); }).join(' · ');
  var h = '<div class="gp-listbar"><span class="gp-counts">' + esc(counts) + '</span><span style="flex:1"></span>' +
    '<select class="f-select" data-gp="fk" style="width:auto"><option value="all">Tümü</option>' +
    GORDER.map(function (k) { return '<option value="' + k + '"' + (g.filter === k ? ' selected' : '') + '>' + GKINDS[k].label + '</option>'; }).join('') + '</select>' +
    '<input class="f-input" data-gp="q" value="' + esc(g.q) + '" placeholder="Ara…" style="width:11rem"></div>';
  var rows = '', shown = 0;
  GORDER.forEach(function (kind) {
    if (g.filter !== 'all' && g.filter !== kind) return;
    var arrK = kind === 'bolge' ? w.regions : (w.features[kind] || []);
    arrK.forEach(function (it, i) {
      var nm = gpName(kind, it);
      if (q && nm.toLowerCase().indexOf(q) < 0) return;
      shown++; rows += gpRow(kind, i, it, nm);
    });
  });
  h += '<div class="gp-rows">' + (rows || '<div class="empty-a">Kayıt bulunamadı.</div>') + '</div>';
  box.innerHTML = h;
}
function gpRow(kind, i, it, nm) {
  var g = geoState(), K = GKINDS[kind], key = kind + ':' + i, open = g.open === key;
  var meta = kind === 'bolge' || kind === 'nehir' ? it.points.length + (kind === 'bolge' ? ' köşe' : ' nokta') : Math.round(it.x) + ', ' + Math.round(it.y);
  var acts = '<button type="button" class="abtn sm" data-mp="gp-goto" data-gk="' + kind + '" data-gi="' + i + '" title="Haritada göster">Git</button>' +
    (kind === 'bolge' ? '<button type="button" class="abtn sm" data-mp="gp-redraw" data-gk="' + kind + '" data-gi="' + i + '">Sınırı çiz</button>'
      : '<button type="button" class="abtn sm" data-mp="gp-edit" data-gk="' + kind + '" data-gi="' + i + '">' + (open ? 'Kapat' : 'Düzenle') + '</button>') +
    '<button type="button" class="abtn sm danger" data-mp="gp-del" data-gk="' + kind + '" data-gi="' + i + '" aria-label="Sil">✕</button>';
  var d = '';
  if (open && kind !== 'bolge') {
    var p = 'features.' + kind + '.' + i;
    d = '<div class="gp-det">' +
      '<div class="f-row"><label class="f-label">Ad</label><input class="f-input" data-p="' + p + '.name" value="' + esc(it.name) + '"></div>' +
      fBi('Açıklama', p + '.desc', it.desc, { area: true }) +
      (kind === 'nehir'
        ? '<div class="f-hint">' + it.points.length + ' noktalı çizgi.</div>'
        : '<div class="f-row half"><div><label class="f-label">X (piksel)</label><input class="f-input" type="number" data-p="' + p + '.x" data-k="num" value="' + esc(Math.round(it.x)) + '"></div>' +
          '<div><label class="f-label">Y (piksel)</label><input class="f-input" type="number" data-p="' + p + '.y" data-k="num" value="' + esc(Math.round(it.y)) + '"></div></div>') +
      '<div class="btn-row"><button type="button" class="abtn sm" data-mp="gp-redraw" data-gk="' + kind + '" data-gi="' + i + '">' + (K.point ? '📍 Yeniden konumlandır' : '✏ Çizgiyi yeniden çiz') + '</button>' +
      '<span class="f-hint" style="margin:0">Kimlik: <code>' + esc(it.id || 'otomatik') + '</code></span></div></div>';
  }
  return '<div class="gp-row' + (open ? ' open' : '') + '" data-grow="' + key + '"><div class="gp-rowh"><span class="gp-ic" style="color:' + K.color + '">' + K.icon + '</span>' +
    '<span class="gp-rname">' + esc(nm) + '</span><span class="gp-rmeta">' + esc(meta) + '</span><span class="mpe-acts">' + acts + '</span></div>' + d + '</div>';
}

/* — harita çizimi (SVG katmanı) — */
function gpPaintSoon() {
  var g = ME && ME.geo; if (!g || g._raf) return;
  g._raf = requestAnimationFrame(function () { g._raf = 0; gpPaint(); });
}
function gpPaint() {
  var g = ME && ME.geo, svg = $('#gp-svg'); if (!g || !svg || !g.natW) return;
  var u = 1 / (g.vs || 1), w = ME.work, h = '';
  var str = function (a) { return a.map(function (p) { return p[0] + ',' + p[1]; }).join(' '); };
  var labels = g.vs >= 0.2;
  w.regions.forEach(function (r, i) {
    var l = findLeg(r.id), c = l && HEX.test(l.color) ? l.color : '#8a7a5a', hl = g.hl === 'bolge:' + i;
    h += '<polygon points="' + str(r.points) + '" fill="' + c + '" fill-opacity="' + (hl ? .5 : .2) + '" stroke="' + c + '" stroke-width="' + (hl ? 4 : 2) * u + '" stroke-linejoin="round"><title>' + esc(gpName('bolge', r)) + '</title></polygon>';
    var lp = r.labelPos || centroid(r.points);
    if (labels && lp) h += '<text x="' + lp[0] + '" y="' + lp[1] + '" font-size="' + 15 * u + '" fill="#fff" stroke="#000" stroke-width="' + 3 * u + '" paint-order="stroke" text-anchor="middle" font-weight="700">' + esc(gpName('bolge', r)) + '</text>';
  });
  (w.features.nehir || []).forEach(function (r, i) {
    var hl = g.hl === 'nehir:' + i;
    h += '<polyline points="' + str(r.points) + '" fill="none" stroke="' + (hl ? '#fff' : GKINDS.nehir.color) + '" stroke-width="' + (hl ? 5 : 2.5) * u + '" stroke-linecap="round" stroke-linejoin="round"><title>' + esc(r.name) + '</title></polyline>';
  });
  ['sehir', 'dag', 'gol'].forEach(function (kind) {
    (w.features[kind] || []).forEach(function (f, i) {
      var c = GKINDS[kind].color, rr = 6 * u, hl = g.hl === kind + ':' + i;
      if (hl) h += '<circle cx="' + f.x + '" cy="' + f.y + '" r="' + 16 * u + '" fill="none" stroke="#fff" stroke-width="' + 2.5 * u + '"/>';
      if (kind === 'dag') h += '<polygon points="' + f.x + ',' + (f.y - rr) + ' ' + (f.x - rr) + ',' + (f.y + rr * .8) + ' ' + (f.x + rr) + ',' + (f.y + rr * .8) + '" fill="' + c + '" stroke="#111" stroke-width="' + 1.2 * u + '"><title>' + esc(f.name) + '</title></polygon>';
      else h += '<circle cx="' + f.x + '" cy="' + f.y + '" r="' + rr + '" fill="' + c + '" stroke="#111" stroke-width="' + 1.5 * u + '"><title>' + esc(f.name) + '</title></circle>';
      if (labels && g.vs >= 0.45) h += '<text x="' + f.x + '" y="' + (f.y + 18 * u) + '" font-size="' + 11 * u + '" fill="#fff" stroke="#000" stroke-width="' + 2.6 * u + '" paint-order="stroke" text-anchor="middle">' + esc(f.name) + '</text>';
    });
  });
  if (g.mode === 'draw' && g.pts.length) {
    var poly = g.type === 'bolge' && g.pts.length > 2;
    h += '<' + (poly ? 'polygon' : 'polyline') + ' points="' + str(g.pts) + '" fill="' + (poly ? 'rgba(255,214,64,.18)' : 'none') + '" stroke="#ffd640" stroke-width="' + 2.5 * u + '" stroke-dasharray="' + 8 * u + ' ' + 5 * u + '" stroke-linejoin="round"/>';
    g.pts.forEach(function (p, i) { h += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i === 0 ? 5.5 : 3.5) * u + '" fill="#ffd640" stroke="#111" stroke-width="' + u + '"/>'; });
  }
  svg.innerHTML = h;
  var zl = $('#gp-zoom'); if (zl) zl.textContent = Math.round((g.vs / (g.fit || 1)) * 100) + '%';
}
function gpPaintAll() { gpPaintForm(); gpPaintList(); gpPaint(); }

/* — kaydır / yakınlaştır — */
function gpApply() {
  var g = ME.geo, inner = $('#gp-inner'); if (!inner) return;
  inner.style.transform = 'translate(' + g.vx + 'px,' + g.vy + 'px) scale(' + g.vs + ')';
  gpPaintSoon();
}
function gpFit() {
  var g = ME.geo, v = $('#gp-view'); if (!v || !g.natW) return;
  var vw = v.clientWidth, vh = v.clientHeight;
  g.fit = Math.min(vw / g.natW, vh / g.natH); g.vs = g.fit;
  g.vx = (vw - g.natW * g.vs) / 2; g.vy = (vh - g.natH * g.vs) / 2;
  gpApply();
}
function gpZoomAt(f, px, py) {
  var g = ME.geo, lo = (g.fit || .05) * .8, hi = 3;
  var ns = Math.max(lo, Math.min(hi, g.vs * f)); if (ns === g.vs) return;
  var r = ns / g.vs; g.vx = px - (px - g.vx) * r; g.vy = py - (py - g.vy) * r; g.vs = ns;
  gpApply();
}
function gpGoto(kind, i) {
  var g = ME.geo, v = $('#gp-view'), it = gpItem(kind, i); if (!v || !it || !g.natW) return;
  var cx, cy;
  if (it.points) { var b = bbox(it.points); cx = (b.x0 + b.x1) / 2; cy = (b.y0 + b.y1) / 2; } else { cx = it.x; cy = it.y; }
  g.vs = Math.max(g.vs, g.fit * 2.5);
  g.vx = v.clientWidth / 2 - cx * g.vs; g.vy = v.clientHeight / 2 - cy * g.vs;
  g.hl = kind + ':' + i; gpApply();
  v.scrollIntoView({ block: 'center', behavior: 'smooth' });
  setTimeout(function () { if (ME && ME.geo && ME.geo.hl === kind + ':' + i) { ME.geo.hl = ''; gpPaintSoon(); } }, 2600);
}

function initGeo() {
  var g = geoState(), view = $('#gp-view'); if (!view) return;
  var img = $('#gp-img'), svg = $('#gp-svg');
  gpPaintForm(); gpPaintList();
  var src = safe(ME.work.image);
  if (!src) { view.classList.add('empty'); return; }
  var size = function () {
    g.natW = img.naturalWidth || g.natW; g.natH = img.naturalHeight || g.natH;
    svg.setAttribute('viewBox', '0 0 ' + g.natW + ' ' + g.natH); svg.setAttribute('width', g.natW); svg.setAttribute('height', g.natH);
    img.style.width = g.natW + 'px'; img.style.height = g.natH + 'px';
    if (g.vs) gpApply(); else { gpFit(); requestAnimationFrame(function () { if (!g.moved) gpFit(); }); }
  };
  img.addEventListener('load', size, { once: true });
  img.addEventListener('error', function () { view.classList.add('empty'); view.querySelector('.gp-empty').textContent = 'Görsel yüklenemedi — yolu kontrol edin.'; }, { once: true });
  img.src = src;
  if (img.complete && img.naturalWidth) size();

  var drag = null;
  view.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.gp-tools')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, vx: g.vx, vy: g.vy, moved: 0 };
    try { view.setPointerCapture(e.pointerId); } catch (x) { /* yut */ }
  });
  view.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
    if (drag.moved > 6) { g.moved = true; g.vx = drag.vx + dx; g.vy = drag.vy + dy; view.classList.add('panning'); gpApply(); }
  });
  view.addEventListener('pointerup', function (e) {
    if (!drag) return; var d = drag; drag = null; view.classList.remove('panning');
    if (d.moved <= 6) gpClick(e, view);
  });
  view.addEventListener('pointercancel', function () { drag = null; view.classList.remove('panning'); });
  view.addEventListener('wheel', function (e) {
    e.preventDefault();
    var r = view.getBoundingClientRect();
    gpZoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
}

/* — haritaya tıklama: nokta koy / köşe ekle — */
function gpClick(e, view) {
  var g = ME.geo; if (!g.mode || !g.natW) return;
  var r = view.getBoundingClientRect();
  var x = Math.round((e.clientX - r.left - g.vx) / g.vs), y = Math.round((e.clientY - r.top - g.vy) / g.vs);
  if (x < 0 || y < 0 || x > g.natW || y > g.natH) { toast('Tıklama görselin dışında.', true); return; }
  if (g.mode === 'place') { gpPlace(x, y); return; }
  g.pts.push([x, y]); gpPaintForm(); gpPaint();
}

function gpResetForm() { var f = ME.geo.form; f.name = ''; f.dtr = ''; f.den = ''; }
function gpEnd() { var g = ME.geo; g.mode = null; g.pts = []; g.redraw = null; }

function gpPlace(x, y) {
  var g = ME.geo, w = ME.work, kind = g.type;
  if (g.redraw) {
    var it = gpItem(g.redraw.kind, g.redraw.idx);
    if (it) { it.x = x; it.y = y; }
    toast('Konum güncellendi.');
  } else {
    var arrK = w.features[kind] = w.features[kind] || [];
    var nm = tr(g.form.name);
    var f = { id: uniq(slug(nm) || kind, arrK.map(function (z) { return z.id; })), name: nm, x: x, y: y,
      desc: { tr: tr(g.form.dtr), en: tr(g.form.den) }, _locked: false };
    arrK.push(f);
    toast(GKINDS[kind].label + ' eklendi: ' + nm);
    gpResetForm();
  }
  gpEnd(); markDirty(); gpPaintAll();
}

function gpFinish() {
  var g = ME.geo, w = ME.work, need = g.type === 'bolge' ? 3 : 2;
  if (g.pts.length < need) { toast('En az ' + need + ' nokta gerekli.', true); return; }
  var pts = g.pts.map(function (p) { return [p[0], p[1]]; });
  var newLegend = false;
  if (g.redraw) {
    var it = gpItem(g.redraw.kind, g.redraw.idx);
    if (it) { it.points = pts; if (g.redraw.kind === 'bolge') it.labelPos = centroid(pts); }
    toast('Çizim güncellendi.');
  } else if (g.type === 'nehir') {
    var arrN = w.features.nehir = w.features.nehir || [], nmN = tr(g.form.name);
    arrN.push({ id: uniq(slug(nmN) || 'nehir', arrN.map(function (z) { return z.id; })), name: nmN, points: pts, desc: { tr: tr(g.form.dtr), en: tr(g.form.den) }, _locked: false });
    toast('Nehir eklendi: ' + nmN);
    gpResetForm();
  } else {
    var legId, f = g.form;
    if (f.legend === '__new') {
      var nm = tr(f.name), all = [];
      list().forEach(function (m) { all.push(m.id); (m.legend || []).forEach(function (x) { all.push(x.id); }); });
      w.legend.forEach(function (x) { all.push(x.id); }); all.push(w.id);
      var li = blankItem();
      li.id = uniq(slug(nm) || 'bolge', all); li.color = HEX.test(f.color) ? f.color : '#8a7a5a';
      li.name = { tr: nm, en: '' }; li.desc = { tr: tr(f.dtr), en: tr(f.den) }; li._open = false; li._locked = false;
      w.legend.push(li); legId = li.id; newLegend = true;
    } else legId = f.legend;
    var idx = -1; w.regions.forEach(function (r, i) { if (r.id === legId) idx = i; });
    if (idx >= 0) { w.regions[idx].points = pts; w.regions[idx].labelPos = centroid(pts); }
    else w.regions.push({ id: legId, points: pts, labelPos: centroid(pts), sub: null });
    toast(newLegend ? 'Yeni bölge ve lejant maddesi eklendi.' : 'Bölge sınırı kaydedildi.');
    gpResetForm();
  }
  gpEnd(); markDirty();
  if (newLegend) renderEditor(); else gpPaintAll();
}

function gpAction(act, b) {
  if (!ME) return;
  var g = geoState(), kind = b && b.getAttribute('data-gk'), idx = b ? +b.getAttribute('data-gi') : -1;
  switch (act) {
    case 'gp-type': g.type = b.getAttribute('data-t'); gpPaintForm(); break;
    case 'gp-start': {
      if (!g.natW) { toast('Önce bir harita görseli ekleyin.', true); return; }
      var K = GKINDS[g.type], f = g.form;
      var nameOK = tr(f.name) || (g.type === 'bolge' && f.legend !== '__new');
      if (!nameOK) { toast('Önce bir ad yazın.', true); var ni = $('#gp-form [data-gp="name"]'); if (ni) ni.focus(); return; }
      g.redraw = null; g.pts = []; g.mode = K.point ? 'place' : 'draw'; gpPaintForm(); gpPaint();
      var v = $('#gp-view'); if (v) v.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      break;
    }
    case 'gp-cancel': gpEnd(); gpPaintAll(); break;
    case 'gp-undo': g.pts.pop(); gpPaintForm(); gpPaint(); break;
    case 'gp-finish': gpFinish(); break;
    case 'gp-zoom-in': case 'gp-zoom-out': {
      var v2 = $('#gp-view'); if (v2) gpZoomAt(act === 'gp-zoom-in' ? 1.4 : 1 / 1.4, v2.clientWidth / 2, v2.clientHeight / 2); break;
    }
    case 'gp-fit': gpFit(); break;
    case 'gp-goto': gpGoto(kind, idx); break;
    case 'gp-edit': { var key = kind + ':' + idx; g.open = g.open === key ? '' : key; gpPaintList(); break; }
    case 'gp-redraw': {
      if (!g.natW) { toast('Önce bir harita görseli ekleyin.', true); return; }
      g.type = kind; g.redraw = { kind: kind, idx: idx }; g.pts = []; g.mode = GKINDS[kind].point ? 'place' : 'draw';
      g.hl = kind + ':' + idx; gpPaintAll();
      var v3 = $('#gp-view'); if (v3) v3.scrollIntoView({ block: 'center', behavior: 'smooth' });
      break;
    }
    case 'gp-del': {
      var it = gpItem(kind, idx); if (!it) return;
      var nm = gpName(kind, it);
      A.confirmBox('Konumu sil', kind === 'bolge'
        ? '“' + nm + '” bölgesinin sınırı silinecek (lejant maddesi kalır).'
        : '“' + nm + '” (' + GKINDS[kind].label.toLowerCase() + ') haritadan silinecek.', function () {
        if (kind === 'bolge') ME.work.regions.splice(idx, 1); else ME.work.features[kind].splice(idx, 1);
        if (g.open === kind + ':' + idx) g.open = '';
        markDirty(); gpPaintAll();
      });
      break;
    }
    default:
  }
}
function gpInput(t) {
  var g = geoState(), k = t.getAttribute('data-gp'), v = t.value;
  if (k === 'name' || k === 'dtr' || k === 'den') g.form[k === 'name' ? 'name' : k] = v;
  else if (k === 'color') g.form.color = v;
  else if (k === 'legend') { g.form.legend = v; gpPaintForm(); }
  else if (k === 'q') { g.q = v; gpPaintList(); var qi = $('#gp-list [data-gp="q"]'); if (qi) { qi.focus(); qi.setSelectionRange(v.length, v.length); } }
  else if (k === 'fk') { g.filter = v; gpPaintList(); }
}

/* ── KAYIT ────────────────────────────────────────────────── */
A.VIEWS.maps = {
  title: 'Haritalar',
  desc: 'harita.html sekmeleri — yeni harita (PNG) ekle, her haritanın lejantını düzenle, sekme sırasını değiştir.',
  render: function () { if (ME) renderEditor(); else renderList(); },
  add: function () {
    if (ME && ME.dirty) { A.confirmBox('Kaydedilmemiş değişiklik', 'Açık haritadaki değişiklikler kaydedilmedi. Yine de yeni harita açılsın mı?', function () { openEditor(null); }); return; }
    openEditor(null);
  }
};
window.AdminMaps = {
  dirty: function () { return !!(ME && ME.dirty); },
  discard: function () { ME = null; }
};
bind();

})();
