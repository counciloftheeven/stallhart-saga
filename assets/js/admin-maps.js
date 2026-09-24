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
    legend: (Array.isArray(m.legend) ? m.legend : []).map(function (it) { return normItem(it, !isNew); })
  };
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
    '</div>';
}

function renderEditor() {
  var add = $('#add-btn'); if (add) add.style.display = 'none';
  $('#view').innerHTML = editorHTML();
  paintImg();
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

  var out = {
    id: id, title: { tr: tr(w.title.tr), en: tr(w.title.en) }, desc: { tr: tr(w.desc.tr), en: tr(w.desc.en) },
    image: tr(w.image), thumb: tr(w.thumb),
    legendTitle: { tr: tr(w.legendTitle.tr), en: tr(w.legendTitle.en) }, legend: legend
  };
  if (w.hidden) out.hidden = true;
  return out;
}

function saveEditor() {
  var errs = [], out = buildClean(errs);
  showErrors(errs);
  if (errs.length) { toast('Formda düzeltilecek ' + errs.length + ' şey var.', true); return; }
  var maps = list(), prev = maps.slice();
  if (ME.isNew) maps.push(out); else maps[ME.idx] = out;
  if (!persist()) {                            /* depolama dolu → belleği eski hâline döndür */
    data().maps = prev;
    toast('Kaydedilemedi — tarayıcı depolaması dolu olabilir. Görseli yükleme yerine depo yoluyla verin.', true);
    return;
  }
  ME.dirty = false;
  toast('Harita kaydedildi.');
  renderList();
}

/* ── OLAY BAĞLAMA (tek seferlik, #view üzerinde) ─────────── */
function inView() { return ME && A.current() === 'maps'; }

function readEl(t) {
  var k = t.getAttribute('data-k');
  if (t.type === 'checkbox') return k === 'show' ? !t.checked : t.checked;
  if (k === 'tags') return t.value.split(/[,;\n]/).map(tr).filter(Boolean);
  return t.value;
}

function onInput(e) {
  if (!inView()) return;
  var t = e.target, p = t.getAttribute && t.getAttribute('data-p');
  if (!p) return;
  var k = t.getAttribute('data-k');
  var v = readEl(t);
  setP(ME.work, p, v);
  markDirty();
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
      toast(url.length > 3500000 ? 'Görsel yüklendi ama büyük — kaydedilemezse depo yolunu kullanın.' : 'Görsel yüklendi.');
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
      var doDel = function () { w.legend.splice(i, 1); markDirty(); renderEditor(); };
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
  window.addEventListener('beforeunload', function (e) {
    if (ME && ME.dirty) { e.preventDefault(); e.returnValue = ''; }
  });
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
