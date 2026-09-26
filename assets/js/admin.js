/* ═══════════════════════════════════════════════════════════════
   STALLHART WIKI — ADMIN PANELİ MANTIĞI  v7
   ---------------------------------------------------------------
   Veri akışı:
     data/*.json  (temel, depoda yayınlanan)
          ↓ okunur
     localStorage "sw-db:<dosya>"  (yerel taslak, admin yazar)
          ↓ wiki.js loadData() üzerinden
     tüm site sayfaları

   Not: Bu panel yalnızca tarayıcı hafızasında çalışır. Değişiklikleri
   kalıcı yapmak için "Dışa Aktar" ile indirilen JSON dosyalarını
   depodaki data/ klasörüne koymak gerekir.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

(function () {

const { Store, loadData, esc } = window.Wiki;

/* ── SABİTLER ─────────────────────────────────────────────── */
const FILES = ['characters.json', 'chapters.json', 'book.json', 'quotes.json', 'lore.json', 'houses.json', 'kingdoms.json', 'familytree.json', 'geography.json', 'language.json', 'maps.json', 'hierarchy.json', 'pages.json'];

const GROUPS = [
  ['stallhart', 'İmparatorluk Hanedanı'], ['arhan', 'Arhan Hanesi'],
  ['solgar', 'Solgar Hanesi'], ['selya', 'Selya Hanesi'],
  ['rebel', 'İsyancılar'], ['court', 'Saray'],
  ['arathen', 'Arathen'], ['other', 'Diğer']
];

const STATUSES = [
  ['alive', 'Yaşıyor'], ['deceased', 'Hayatını Kaybetti'], ['historical', 'Tarihsel Figür']
];

const EVENT_TYPES = [
  ['ruler', 'Hükümdar'], ['war', 'Savaş'], ['crisis', 'Kriz'], ['religious', 'Dinî Olay']
];

const GLOSSARY_TYPES = [
  ['geo', 'Coğrafya'], ['title', 'Unvan'], ['political', 'Siyasi'],
  ['military', 'Askerî'], ['religious', 'Dinî'], ['magic', 'Sihir']
];

const TAGS = ['soylu', 'askeri', 'mitolojik', 'siyasi', 'dini', 'denizcilik', 'entrika'];

/* Yönetilen görseller — yol tanımları data dosyalarında tutulmaz,
   burada listelenir ve varlık kontrolü yapılır. */
const MEDIA = [
  { name: 'Siyasi Harita (tam çözünürlük)', path: 'assets/images/SIYASI_HARITA.jpg', use: 'harita.html' },
  { name: 'Siyasi Harita (önizleme)', path: 'assets/images/SIYASI_HARITA_onizleme.jpg', use: 'index.html' },
  { name: 'Site Logosu', path: 'assets/images/logo-stallhart.png', use: 'index.html hero' }
];

/* ── DURUM ────────────────────────────────────────────────── */
const DB = {};                 /* dosya adı → veri nesnesi */
let currentView = 'dash';
let editing = null;            /* { kind, index } — null ise yeni kayıt */
let searchQ = { chars: '', chapters: '', quotes: '', events: '', glossary: '', language: '', houses: '', hierarchy: '' };

/* ── YARDIMCILAR ──────────────────────────────────────────── */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.prototype.slice.call(document.querySelectorAll(sel));

function toast(msg, isErr) {
  const wrap = $('#toasts');
  const t = document.createElement('div');
  t.className = 'toast' + (isErr ? ' err' : '');
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3400);
}

/* Basit onay kutusu — tarayıcının confirm()'i yerine tema uyumlu. */
let confirmCb = null;
function confirmBox(title, msg, cb) {
  $('#confirm-t').textContent = title;
  $('#confirm-m').textContent = msg;
  confirmCb = cb;
  $('#confirm-back').classList.add('on');
}
function closeConfirm(run) {
  $('#confirm-back').classList.remove('on');
  const cb = confirmCb; confirmCb = null;
  if (run && cb) cb();
}

/* Türkçe karakterleri koruyan kimlik üretici */
function slugify(str) {
  const map = { 'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g', 'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c' };
  return String(str || '')
    .replace(/[ıİşŞğĞüÜöÖçÇ]/g, m => map[m])
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60) || ('kayit-' + Date.now());
}

function uniqueId(base, taken) {
  let id = base, n = 2;
  while (taken.indexOf(id) >= 0) { id = base + '-' + n; n++; }
  return id;
}

/* Çift dilli alan okuma/yazma */
function bi(trVal, enVal) { return { tr: String(trVal || '').trim(), en: String(enVal || '').trim() }; }
function biVal(o) { return o && (o.tr || o.en) ? (o.tr || o.en) : ''; }
function isEmptyBi(o) { return !o || (!o.tr && !o.en); }

/* Ayrı dosyadaki bölüm editörü (admin-book.js) için küçük, salt-gerekli köprü */
window.AdminBridge = {
  get DB() { return DB; },
  save: f => save(f), toast: (m, e) => toast(m, e), esc: esc,
  chapList: () => chapList(), kgProcessImage: (f, c) => kgProcessImage(f, c),
  refreshChapters: () => { if (currentView === 'chapters') renderChapters(); else if (currentView === 'dash') renderDash(); }
};

/* ── KALICILIK & SUNUCU SENKRONİZASYONU ─────────────────────── */
function setSyncStatus(isClean) {
  const pill = $('#sync-pill'), txt = $('#sync-text');
  if (!pill || !txt) return;
  if (isClean) {
    pill.classList.remove('dirty');
    txt.textContent = 'Senkronize';
  } else {
    pill.classList.add('dirty');
    txt.textContent = 'Taslak Bekliyor';
  }
}

function save(file, silent) {
  if (Store.write(file, DB[file])) {
    renderSidebarState();
    // Sunucu tarafına anında kalıcı yaz (disk persistence)
    fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file, data: DB[file] })
    }).then(res => res.json()).then(data => {
      if (data && data.ok) {
        setSyncStatus(true);
        if (!silent) toast(file + ' sunucuya ve belleğe kaydedildi.');
      }
    }).catch(err => {
      console.warn('Sunucuya kaydedilemedi:', err);
      setSyncStatus(false);
    });
    return true;
  }
  toast('Kaydedilemedi — tarayıcı depolama alanı dolu olabilir.', true);
  return false;
}

async function syncAllToServer() {
  const files = Store.overriddenFiles();
  if (!files.length) {
    // Taslak yoksa yine de mevcut tüm veriyi sunucuya teyit et
    toast('Tüm veriler zaten sunucu ile uyumlu.');
    setSyncStatus(true);
    return;
  }
  let successCount = 0;
  for (const f of files) {
    try {
      const res = await fetch('/api/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: f, data: DB[f] })
      });
      const data = await res.json();
      if (data && data.ok) successCount++;
    } catch (e) {
      console.error(f + ' sunucuya yazılamadı:', e);
    }
  }
  toast(successCount + ' dosya sunucu diskine kalıcı olarak kaydedildi.');
  setSyncStatus(true);
  renderSidebarState();
}

async function loadAll() {
  for (const f of FILES) {
    try { DB[f] = await loadData(f); }
    catch (e) {
      console.error(f, e);
      toast(f + ' yüklenemedi.', true);
      DB[f] = {};
    }
  }
  /* Bölüm metinleri: dosya eksik/bozuksa editör yine de çalışsın */
  if (!DB['book.json'] || typeof DB['book.json'] !== 'object') DB['book.json'] = {};
  if (!DB['book.json'].chapters || typeof DB['book.json'].chapters !== 'object') DB['book.json'].chapters = {};
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
}

/* ═══════════════════════════════════════════════════════════
   GÖRÜNÜM YÖNLENDİRME
   ═══════════════════════════════════════════════════════════ */
const VIEWS = {
  dash:      { title: 'Pano', desc: 'Site içeriğinin genel durumu ve hızlı eylemler.', render: renderDash },
  pages:     { title: 'Sayfalar & CMS Yönetimi', desc: 'Site genelindeki tüm sayfaların meta etiketleri, başlıkları, hero metinleri ve görselleri.', render: renderPagesAdmin },
  hierarchy: { title: 'İmparatorluk Hiyerarşisi & Makamlar', desc: 'Yüce Hükümranlık, Siyasi Divan, Askeri Erkan ve Mabed makamları, yetkiler ve selefler silsilesi.', render: renderHierarchyAdmin, add: () => openHierarchyEditor(null) },
  chars:     { title: 'Karakter Yönetimi', desc: 'Karakter ekle, düzenle, sil.', render: renderChars, add: () => openCharEditor(null) },
  houses:    { title: 'Haneler', desc: 'Soylu hanelerin adı, sembolü, renkleri ve üyeleri.', render: renderHousesAdmin, add: () => openHouseEditor(null) },
  trees:     { title: 'Soy Ağaçları', desc: 'Hane soy ağaçları — kişiler, akrabalık bağları, meşruiyet çizgileri ve canlı önizleme.', render: renderTrees, add: openTreeCreate },
  kingdoms:  { title: 'Devletler', desc: 'Devlet / krallık maddeleri — bayrak, sicil, tarihçe, bölgesel harita, askerî ve iktisadi güç.', render: renderKingdoms, add: () => openKingdomEditor(null) },
  gods:      { title: 'Tanrılar', desc: 'Denge Konseyi tanrıları — bilgiler, sembol tarifi ve sembol görseli (tanrilar.html ile tanri-detay.html\'de aynı görsel kullanılır).', render: renderGods },
  chapters:  { title: 'Bölüm & Kronik', desc: 'Hikâye bölümleri ve tarih şeridi olayları.', render: renderChapters, add: () => openChapterEditor(null) },
  events:    { title: 'Tarih Şeridi', desc: 'Kronolojik olaylar ve etiketleri.', render: renderEvents, add: () => openEventEditor(null) },
  glossary:  { title: 'Sözlük', desc: 'Evren terimleri ansiklopedisi.', render: renderGlossary, add: () => openGlossaryEditor(null) },
  quotes:    { title: 'Sözler & Alıntılar', desc: 'Felsefi ve karakter sözleri veritabanı.', render: renderQuotes, add: () => openQuoteEditor(null) },
  media:     { title: 'Görsel Yöneticisi & Medya Hub', desc: 'Tüm site görsellerini görüntüle, doğrudan değiştir veya yeni görsel yükle.', render: renderMedia },
  maps:      { title: 'Haritalar', desc: 'İnteraktif harita katmanları ve konum noktaları.', render: renderMapsAdmin },
  geo:       { title: 'Coğrafya', desc: 'Eyalet detayları ve dünya güç sıralaması.', render: renderGeography, add: () => openProvinceEditor(null) },
  language:  { title: 'Ortak Lisan', desc: 'Konlang sözlüğü — sözcük ekle, düzenle, sil.', render: renderLanguageAdmin, add: () => openWordEditor(null) },
  data:      { title: 'Veri & Yayın', desc: 'Sunucu senkronizasyonu, dışa aktarma, içe aktarma ve sıfırlama.', render: renderDataView }
};

function go(view) {
  if (!VIEWS[view]) view = 'dash';
  /* Soy ağacı editöründen ayrılırken kaydedilmemiş değişiklik uyarısı */
  if (typeof TE !== 'undefined' && TE.work && view !== 'trees') {
    if (TE.dirty) {
      confirmBox('Kaydedilmemiş değişiklik', 'Soy ağacındaki değişiklikler kaydedilmedi. Yine de çıkılsın mı?', () => { TE.work = null; TE.dirty = false; go(view); });
      return;
    }
    TE.work = null;
  }
  /* v17: Harita editöründen ayrılırken kaydedilmemiş değişiklik uyarısı (admin-maps.js) */
  if (window.AdminMaps && view !== 'maps') {
    if (window.AdminMaps.dirty()) {
      confirmBox('Kaydedilmemiş değişiklik', 'Harita editöründeki değişiklikler kaydedilmedi. Yine de çıkılsın mı?', () => { window.AdminMaps.discard(); go(view); });
      return;
    }
    window.AdminMaps.discard();
  }
  currentView = view;
  $$('.side-item').forEach(b => b.classList.toggle('on', b.dataset.view === view));
  const v = VIEWS[view];
  $('#page-h1').textContent = v.title;
  $('#page-desc').textContent = v.desc;
  const addBtn = $('#add-btn');
  if (v.add) { addBtn.style.display = ''; addBtn.onclick = v.add; }
  else addBtn.style.display = 'none';
  v.render();
  location.hash = view;
}

/* ═══════════════════════════════════════════════════════════
   TABLO SATIRI EYLEMLERİ — TEK DELEGASYON LİSTENER'I
   ---------------------------------------------------------------
   Her modülün render*() fonksiyonu #view içeriğini tamamen yeniden
   üretir (arama, filtre, dil değişimi, admin taslağı vb. her
   tetiklendiğinde). Önceden her render sonrası satır başına yeni
   addEventListener ekleniyordu; işlevsel çalışsa da N dinleyici
   oluşturup atıyordu ve dinamik/harici içerik için kırılgandı.
   Artık #view'e YALNIZCA BİR KEZ bağlanan bu listener, hangi satırın
   hangi modüle ait olduğunu currentView + bu kayıt tablosundan
   çözer — kart yeniden çizilse de tıklama asla kaybolmaz. Modül
   fonksiyonları henüz tanımlanmadığı için kayıt tablosu referansları
   fonksiyon isimleri olarak (çağrı zamanında çözülecek şekilde)
   tutulur; bindRowActions() DOMContentLoaded'da çağrılır, o noktada
   tüm fonksiyonlar zaten tanımlıdır. */
const ROW_ACTIONS = {
  hierarchy: () => ({ list: hierarchyList, editor: openHierarchyEditor, render: renderHierarchyAdmin, file: 'hierarchy.json',
    title: 'Makamı sil', msg: h => '"' + biVal(h.title) + '" makamı kalıcı olarak silinecek.', done: () => 'Makam silindi.' }),
  pages:     () => ({ list: pagesList,     editor: openPageEditor,      render: renderPagesAdmin,     file: 'pages.json',
    title: 'Sayfayı sıfırla', msg: p => '"' + (p.name || '') + '" sayfa ayarları varsayılana döndürülecek.', done: () => 'Sayfa güncellendi.' }),
  chars:     () => ({ list: charList,     editor: openCharEditor,     render: renderChars,     file: 'characters.json',
    title: 'Karakteri sil', msg: c => '"' + biVal(c.name) + '" kalıcı olarak silinecek. Bu işlem geri alınamaz.', done: () => 'Karakter silindi.' }),
  chapters:  () => ({ list: chapList,     editor: openChapterEditor,  render: renderChapters,  file: 'chapters.json',
    title: 'Bölümü sil', msg: ch => '"' + biVal(ch.title) + '" silinecek.', done: () => 'Bölüm silindi.' }),
  events:    () => ({ list: eventList,    editor: openEventEditor,    render: renderEvents,    file: 'lore.json',
    title: 'Olayı sil', msg: e => '"' + biVal(e.name) + '" silinecek.', done: () => 'Olay silindi.' }),
  glossary:  () => ({ list: glossList,    editor: openGlossaryEditor, render: renderGlossary,  file: 'lore.json',
    title: 'Terimi sil', msg: g => '"' + biVal(g.term) + '" silinecek.', done: () => 'Terim silindi.' }),
  quotes:    () => ({ list: quoteList,    editor: openQuoteEditor,    render: renderQuotes,    file: 'quotes.json',
    title: 'Alıntıyı sil', msg: () => 'Bu alıntı kalıcı olarak silinecek.', done: () => 'Alıntı silindi.' }),
  kingdoms:  () => ({ list: kingdomList,  editor: openKingdomEditor,  render: renderKingdoms,  file: 'kingdoms.json',
    title: 'Devleti sil', msg: k => '"' + biVal(k.name) + '" devlet maddesi kalıcı olarak silinecek.', done: () => 'Devlet silindi.' }),
  gods:      () => ({ list: godList,      editor: openGodEditor,      render: renderGods,      file: 'lore.json',
    title: 'Tanrıyı sil', msg: g => '"' + biVal(g.epithet) + '" silinecek.', done: () => 'Tanrı silindi.' }),
  geo: () => ({ list: geoProvinceList, editor: openProvinceEditor, render: renderGeography, file: 'geography.json',
    title: 'Eyaleti sil', msg: p => '"' + (p.name || '') + '" silinecek.', done: () => 'Eyalet silindi.' }),
  language:  () => ({ list: dictList,     editor: openWordEditor,     render: renderLanguageAdmin, file: 'language.json',
    title: 'Sözcüğü sil', msg: w => '"' + (w.word || '') + '" sözlükten silinecek.', done: () => 'Sözcük silindi.' }),
};

function bindRowActions() {
  $('#view').addEventListener('click', e => {
    if (currentView === 'trees' && !TE.work && handleTreeClick(e)) return;
    /* Coğrafya görünümünde iki farklı liste (eyalet + güç sıralaması)
       aynı tabloda yer aldığından, güç sıralaması satırları ayrı
       veri-özniteliğiyle işaretlenir ama aynı tek delegasyon
       listener'ından yürütülür. */
    const powerEdit = e.target.closest('[data-power-edit]');
    const powerDel = powerEdit ? null : e.target.closest('[data-power-del]');
    if (powerEdit || powerDel) {
      const idx = powerEdit ? +powerEdit.dataset.powerEdit : +powerDel.dataset.powerDel;
      if (powerEdit) { openPowerEditor(idx); return; }
      const w = geoPowerList()[idx];
      if (!w) return;
      confirmBox('Sıralama kaydını sil', '"' + ((w.name && w.name.tr) || '') + '" silinecek.', () => {
        geoPowerList().splice(idx, 1);
        if (save('geography.json')) { toast('Kayıt silindi.'); renderGeography(); }
      });
      return;
    }

    /* Haneler: iç içe yapı yüzünden ayrı işlenir (bkz. flatHouseList). */
    const houseEdit = e.target.closest('[data-house-edit]');
    const houseDel = houseEdit ? null : e.target.closest('[data-house-del]');
    if (houseEdit || houseDel) {
      const hid = houseEdit ? houseEdit.dataset.houseEdit : houseDel.dataset.houseDel;
      if (houseEdit) { openHouseEditor(hid); return; }
      const entry = flatHouseList().find(r => r.house.id === hid);
      if (!entry) return;
      confirmBox('Haneyi sil', '"' + (entry.house.name || '') + '" kalıcı olarak silinecek.', () => {
        const prov = provinceList().find(p => p.id === entry.provId);
        if (prov) prov.houses = (prov.houses || []).filter(x => x.id !== hid);
        if (save('houses.json')) { toast('Hane silindi.'); renderHousesAdmin(); }
      });
      return;
    }

    /* Hiyerarşi Makamları */
    const hyEdit = e.target.closest('[data-hy-edit]');
    const hyDel = hyEdit ? null : e.target.closest('[data-hy-del]');
    if (hyEdit || hyDel) {
      const id = hyEdit ? hyEdit.dataset.hyEdit : hyDel.dataset.hyDel;
      if (hyEdit) { openHierarchyEditor(id); return; }
      const office = (DB['hierarchy.json'] || {})[id];
      if (!office) return;
      confirmBox('Makamı Sil', '"' + biVal(office.title) + '" (' + id + ') kalıcı olarak silinecek.', () => {
        delete (DB['hierarchy.json'] || {})[id];
        if (save('hierarchy.json')) { toast('Makam silindi.'); renderHierarchyAdmin(); }
      });
      return;
    }

    /* Sayfa CMS Düzenleme */
    const pageEdit = e.target.closest('[data-page-edit]');
    if (pageEdit) {
      openPageEditor(pageEdit.dataset.pageEdit);
      return;
    }

    const editBtn = e.target.closest('[data-edit]');
    const delBtn = editBtn ? null : e.target.closest('[data-del]');
    if (!editBtn && !delBtn) return;

    const factory = ROW_ACTIONS[currentView];
    if (!factory) return;
    const cfg = factory();
    const idx = editBtn ? +editBtn.dataset.edit : +delBtn.dataset.del;
    const items = cfg.list();
    const item = items[idx];
    if (item === undefined) return;

    if (editBtn) {
      cfg.editor(idx);
    } else {
      confirmBox(cfg.title, cfg.msg(item), () => {
        items.splice(idx, 1);
        if (save(cfg.file)) { toast(cfg.done(item)); cfg.render(); }
      });
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   1) PANO
   ═══════════════════════════════════════════════════════════ */
function renderDash() {
  const chars = (DB['characters.json'].characters || []);
  const chapters = (DB['chapters.json'].chapters || []);
  const quotes = (DB['quotes.json'].quotes || []);
  const events = (DB['lore.json'].events || []);
  const gloss = (DB['lore.json'].glossary || []);
  const houses = (DB['houses.json'].provinces || []).reduce((n, p) => n + (p.houses || []).length, 0);
  const hyList = hierarchyList();
  const pgList = pagesList();

  const stats = [
    [chars.length, 'Karakter'],
    [houses, 'Soylu Hane'],
    [hyList.length, 'Hiyerarşi Makamı'],
    [pgList.length, 'Yönetilen Sayfa'],
    [chapters.filter(c => c.free).length + ' / ' + chapters.length, 'Yayınlanan Bölüm'],
    [(DB['kingdoms.json'].kingdoms || []).length, 'Devlet'],
    [(DB['lore.json'].gods || []).length, 'Tanrı'],
    [(DB['familytree.json'].trees || []).length, 'Soy Ağacı'],
    [quotes.length, 'Alıntı'],
    [events.length, 'Kronik Olayı'],
    [gloss.length, 'Sözlük Terimi'],
    [AdminMedia ? AdminMedia.cachedImages.length || '—' : '—', 'Görsel Dosyası']
  ];

  const drafts = Store.overriddenFiles();

  $('#view').innerHTML =
    '<div class="stat-grid">' +
    stats.map(s => '<div class="stat"><div class="stat-n">' + esc(s[0]) + '</div><div class="stat-l">' + esc(s[1]) + '</div></div>').join('') +
    '</div>' +

    (drafts.length
      ? '<div class="notice"><strong>Yerel taslakta bekleyen değişiklikler var:</strong> ' +
        esc(drafts.join(', ')) + '. ' +
        '<div style="margin-top:.5rem"><button class="abtn primary sm" id="dash-sync-btn">⚡ Tümünü Sunucu Diskine Kaydet</button></div></div>'
      : '<div class="notice">Tüm veriler sunucu diskiyle senkronize durumda. Sayfalarda yapılan her değişiklik anında hem tarayıcıya hem sunucuya işlenir.</div>') +

    '<div class="panel"><div class="panel-t">Hızlı Yönetim &amp; Sayfa Düzenleme</div><div class="btn-row">' +
    '<button class="abtn primary" data-go="pages">📑 Sayfaları Düzenle (CMS)</button>' +
    '<button class="abtn primary" data-go="hierarchy">👑 Hiyerarşi &amp; Makamlar</button>' +
    '<button class="abtn primary" data-go="media">🖼️ Görseller &amp; Medya Hub</button>' +
    '<button class="abtn" data-go="chars">👤 Karakter Ekle</button>' +
    '<button class="abtn" data-go="houses">🛡️ Hane Ekle</button>' +
    '<button class="abtn" data-go="kingdoms">🏰 Devlet Ekle</button>' +
    '<button class="abtn" data-go="chapters">📖 Bölüm Ekle</button>' +
    '<button class="abtn" data-go="data">💾 Veri &amp; Yayın</button>' +
    '<a class="abtn" href="index.html" target="_blank" rel="noopener">Siteyi Aç ↗</a>' +
    '</div></div>' +

    '<div class="panel"><div class="panel-t">Karakter Durum Dağılımı</div>' +
    STATUSES.map(st => {
      const n = chars.filter(c => c.status === st[0]).length;
      const pct = chars.length ? Math.round(n / chars.length * 100) : 0;
      return '<div style="margin-bottom:.6rem">' +
        '<div style="display:flex;justify-content:space-between;font-size:.8rem;color:var(--parchd);margin-bottom:.25rem">' +
        '<span>' + esc(st[1]) + '</span><span>' + n + ' · %' + pct + '</span></div>' +
        '<div style="height:4px;background:var(--deep);border:1px solid var(--border)">' +
        '<div style="height:100%;width:' + pct + '%;background:var(--gold)"></div></div></div>';
    }).join('') + '</div>';

  $$('#view [data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
  $('#dash-sync-btn')?.addEventListener('click', syncAllToServer);
}

/* ═══════════════════════════════════════════════════════════
   2) KARAKTER YÖNETİMİ
   ═══════════════════════════════════════════════════════════ */
function charList() { return DB['characters.json'].characters || (DB['characters.json'].characters = []); }

function renderChars() {
  const all = charList();
  const q = searchQ.chars.toLocaleLowerCase('tr');
  const rows = all.filter(c => !q ||
    biVal(c.name).toLocaleLowerCase('tr').includes(q) ||
    biVal(c.house).toLocaleLowerCase('tr').includes(q) ||
    biVal(c.title).toLocaleLowerCase('tr').includes(q));

  $('#view').innerHTML =
    toolbarHTML('chars', 'İsim, hane veya unvan ara…', rows.length, all.length, 'karakter') +
    (rows.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      '<th style="width:56px"></th><th>Ad</th><th>Hane</th><th>Durum</th><th>Silah / Eşya</th><th></th>' +
      '</tr></thead><tbody>' +
      rows.map(c => {
        const i = all.indexOf(c);
        return '<tr>' +
          '<td>' + (c.image
            ? '<img class="thumb-cell" src="' + esc(c.image) + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">'
            : '<div class="thumb-cell"></div>') + '</td>' +
          '<td><div class="cell-name">' + esc(biVal(c.name)) + '</div>' +
          '<div class="cell-sub">' + esc(biVal(c.title)) + '</div></td>' +
          '<td style="font-size:.78rem">' + esc(biVal(c.house)) + '</td>' +
          '<td><span class="pill ' + esc(c.status) + '">' +
          esc((STATUSES.find(s => s[0] === c.status) || [, c.status])[1]) + '</span></td>' +
          '<td style="font-size:.76rem;color:var(--parchd)">' + esc(biVal(c.weapon) || '—') + '</td>' +
          '<td><div class="cell-acts">' +
          '<button class="abtn sm" data-edit="' + i + '">Düzenle</button>' +
          '<button class="abtn sm danger" data-del="' + i + '">Sil</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<div class="empty-a">Kayıt bulunamadı.</div>');

  bindToolbar('chars', renderChars);
}

function openCharEditor(index) {
  const isNew = index === null;
  const c = isNew
    ? { id: '', group: 'other', status: 'alive', name: bi(), house: bi(), title: bi(), birth: bi(), alleg: bi(), weapon: bi(), epi: bi(), quote: bi(), bio: bi(), image: '', allies: [], enemies: [], chapters: [] }
    : JSON.parse(JSON.stringify(charList()[index]));
  editing = { kind: 'char', index: index };

  const others = charList().filter((x, i) => i !== index);

  drawer(isNew ? 'Yeni Karakter' : 'Karakteri Düzenle',
    biField('Ad', 'name', c.name, true) +
    biField('Unvan', 'title', c.title) +
    biField('Bağlı Olduğu Hanedan', 'house', c.house) +
    '<div class="f-row half">' +
    selectField('Grup (renk kodu)', 'group', GROUPS, c.group) +
    selectField('Hayatta Kalma Durumu', 'status', STATUSES, c.status) +
    '</div>' +
    biField('Silah / Eşya', 'weapon', c.weapon) +
    biField('Doğum Yeri', 'birth', c.birth) +
    biField('Bağlılık', 'alleg', c.alleg) +
    biField('Lakap', 'epi', c.epi) +
    biField('Ünlü Sözü', 'quote', c.quote, false, true) +
    biField('Biyografi', 'bio', c.bio, false, true) +
    imageField(c.image) +
    multiField('Müttefikler', 'allies', others, c.allies || []) +
    multiField('Düşmanlar / Rakipler', 'enemies', others, c.enemies || []) +
    textField('Göründüğü Bölümler', 'chapters', (c.chapters || []).join(', '), 'Virgülle ayırın. Örn: I, III, VII'),
    () => {
      const name = readBi('name');
      if (isEmptyBi(name)) return 'Ad alanı zorunludur.';

      const rec = {
        id: c.id || uniqueId(slugify(name.tr || name.en), charList().map(x => x.id)),
        group: $('#f-group').value,
        status: $('#f-status').value,
        name: name,
        house: readBi('house'),
        title: readBi('title'),
        birth: readBi('birth'),
        alleg: readBi('alleg'),
        weapon: readBi('weapon'),
        epi: readBi('epi'),
        quote: readBi('quote'),
        bio: readBi('bio'),
        allies: readMulti('allies'),
        enemies: readMulti('enemies'),
        chapters: $('#f-chapters').value.split(',').map(s => s.trim()).filter(Boolean)
      };
      const img = $('#f-image').value.trim();
      if (img) rec.image = img;

      if (isNew) charList().push(rec); else charList()[index] = rec;
      if (!save('characters.json')) return 'Kaydedilemedi.';
      toast(isNew ? 'Karakter eklendi.' : 'Karakter güncellendi.');
      renderChars();
      return null;
    });

  /* Görsel önizlemeyi canlı bağla */
  const imgInput = $('#f-image');
  if (imgInput) imgInput.addEventListener('input', updateImgPreview);
  updateImgPreview();
}

function updateImgPreview() {
  const v = ($('#f-image') || {}).value;
  const box = $('#img-preview');
  if (!box) return;
  if (!v) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  box.innerHTML = '<img src="' + esc(v.trim()) + '" alt="" ' +
    'style="max-width:150px;border:1px solid var(--border);display:block;margin-top:.5rem" ' +
    'onerror="this.replaceWith(Object.assign(document.createElement(\'div\'),' +
    '{className:\'media-status bad\',textContent:\'Görsel bulunamadı — yolu kontrol edin.\'}))">';
}

/* ═══════════════════════════════════════════════════════════
   HANELER (houses.json: provinces[].houses[] — iç içe yapı)
   ---------------------------------------------------------------
   Diğer modüllerin aksine haneler düz bir dizi değil, her eyaletin
   içine gömülüdür. Bu yüzden liste/düzenleme/silme burada özel
   işlenir; genel ROW_ACTIONS kayıt tablosuna girmez (bkz. aşağıdaki
   data-house-edit / data-house-del delegasyonu, bindRowActions
   içinde ele alınır).
   ═══════════════════════════════════════════════════════════ */
const TIER_OPTIONS = [
  ['imperial', 'İmparatorluk Hanedanı'], ['major', 'Büyük Soylu Hane'],
  ['minor', 'Küçük Soylu Hane'], ['client', 'Bağımlı Hane'],
];

function provinceList() { return DB['houses.json'].provinces || (DB['houses.json'].provinces = []); }

function flatHouseList() {
  const out = [];
  provinceList().forEach(p => (p.houses || []).forEach(h => out.push({ house: h, provId: p.id })));
  return out;
}

function renderHousesAdmin() {
  const rows = flatHouseList();
  const q = (searchQ.houses || '').toLocaleLowerCase('tr');
  const filtered = q ? rows.filter(r =>
    (r.house.name || '').toLocaleLowerCase('tr').includes(q) ||
    biVal(r.house.meaning).toLocaleLowerCase('tr').includes(q)) : rows;

  $('#view').innerHTML =
    toolbarHTML('houses', 'Hane adı veya anlamı ara…', filtered.length, rows.length, 'hane') +
    (filtered.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      '<th style="width:50px">Bayrak</th><th>Hane</th><th>Eyalet</th><th>Katman</th><th>Üye</th><th></th>' +
      '</tr></thead><tbody>' +
      filtered.map(r => {
        const h = r.house;
        const prov = provinceList().find(p => p.id === r.provId);
        return '<tr>' +
          '<td>' + (kgSafeImg(h.banner)
            ? '<img class="kg-thumb" style="width:30px;height:42px" src="' + esc(kgSafeImg(h.banner)) + '" alt="" loading="lazy">'
            : (h.colors && h.colors.length
              ? '<div style="display:flex;gap:2px" title="Bayrak yüklenmemiş">' + h.colors.slice(0, 2).map(c => '<div style="width:12px;height:20px;background:' + esc(c) + '"></div>').join('') + '</div>'
              : '')) + '</td>' +
          '<td><div class="cell-name">' + esc(h.name || '') + '</div>' +
          '<div class="cell-sub">' + esc(biVal(h.meaning)) + '</div></td>' +
          '<td style="font-size:.78rem;color:var(--parchd)">' + esc(prov ? biVal(prov.name) : r.provId) + '</td>' +
          '<td><span class="pill neutral">' + esc((TIER_OPTIONS.find(t => t[0] === h.tier) || [, h.tier])[1]) + '</span></td>' +
          '<td style="font-size:.8rem;color:var(--parchd)">' + ((h.memberIds || []).length) + '</td>' +
          '<td><div class="cell-acts">' +
          '<button class="abtn sm" data-house-edit="' + esc(h.id) + '">Düzenle</button>' +
          '<button class="abtn sm danger" data-house-del="' + esc(h.id) + '">Sil</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<div class="empty-a">Hane bulunamadı.</div>');

  bindToolbar('houses', renderHousesAdmin);
}

function openHouseEditor(houseId) {
  const isNew = houseId === null;
  const entry = isNew ? null : flatHouseList().find(r => r.house.id === houseId);
  const h = isNew
    ? { id: '', name: '', meaning: bi(), symbol: bi(), motto: bi(), banner: null, colors: ['#606060', '#C4962A'], tier: 'minor', desc: bi(), origin: bi(), memberIds: [] }
    : JSON.parse(JSON.stringify(entry.house));
  const currentProvId = isNew ? (provinceList()[0] || {}).id : entry.provId;
  editing = { kind: 'house', id: houseId };

  const img = { banner: h.banner || '' };
  const baseName = () => h.id || slugify(($('#f-h-name') || {}).value || '') || 'hane';
  const provOptions = provinceList().map(p => [p.id, biVal(p.name)]);
  const charOptions = charList();
  const secH = t => '<div class="f-sec">' + esc(t) + '</div>';

  drawer(isNew ? 'Yeni Hane' : 'Haneyi Düzenle',
    secH('Kimlik') +
    textField('Hane Adı', 'h-name', h.name, '', true) +
    selectField('Eyalet', 'h-prov', provOptions, currentProvId) +
    selectField('Katman', 'h-tier', TIER_OPTIONS, h.tier) +
    biField('Anlamı', 'meaning', asBi(h.meaning)) +

    secH('Bayrak & Heraldik') +
    kgImgFieldHTML('banner') +
    biField('Motto', 'motto', asBi(h.motto)) +
    biField('Heraldik Sembol', 'symbol', asBi(h.symbol)) +
    '<div class="f-row"><label class="f-label">Renkler (hex)</label>' +
    '<div class="f-row half">' +
    '<input class="f-input" id="f-h-color1" value="' + esc((h.colors || [])[0] || '') + '" placeholder="#606060">' +
    '<input class="f-input" id="f-h-color2" value="' + esc((h.colors || [])[1] || '') + '" placeholder="#C4962A">' +
    '</div></div>' +

    secH('Metinler') +
    biField('Açıklama', 'desc', asBi(h.desc), false, true) +
    biField('Köken & Tarihçe', 'origin', asBi(h.origin), false, true) +
    multiField('Hane Üyeleri', 'memberIds', charOptions, h.memberIds || []),
    () => {
      const name = $('#f-h-name').value.trim();
      if (!name) return 'Hane adı zorunludur.';
      const newProvId = $('#f-h-prov').value;
      const targetProv = provinceList().find(p => p.id === newProvId);
      if (!targetProv) return 'Geçerli bir eyalet seçin.';

      /* Mevcut kaydın diğer alanları (notable, tierLabel, logo…) korunur */
      const rec = Object.assign({}, h, {
        id: h.id || uniqueId(slugify(name), flatHouseList().map(r => r.house.id)),
        name,
        meaning: readBi('meaning'),
        symbol: readBi('symbol'),
        motto: readBi('motto'),
        colors: [$('#f-h-color1').value.trim(), $('#f-h-color2').value.trim()].filter(Boolean),
        tier: $('#f-h-tier').value,
        desc: readBi('desc'),
        origin: readBi('origin'),
        memberIds: readMulti('memberIds'),
        banner: img.banner || null,
      });

      /* Depolama dolarsa bellekteki veriyi eski hâline döndürmek için anlık görüntü */
      const snapshot = JSON.stringify(DB['houses.json'].provinces);

      if (isNew) {
        targetProv.houses = targetProv.houses || [];
        targetProv.houses.push(rec);
      } else {
        const oldProv = provinceList().find(p => p.id === currentProvId);
        if (oldProv && oldProv.id !== newProvId) {
          oldProv.houses = (oldProv.houses || []).filter(x => x.id !== h.id);
          targetProv.houses = targetProv.houses || [];
          targetProv.houses.push(rec);
        } else {
          const i = (targetProv.houses || []).findIndex(x => x.id === h.id);
          if (i >= 0) targetProv.houses[i] = rec; else targetProv.houses.push(rec);
        }
      }
      if (!save('houses.json')) {
        DB['houses.json'].provinces = JSON.parse(snapshot);
        return 'Kaydedilemedi — tarayıcı depolama sınırı aşılmış olabilir. Yüklenen bayrakları kaldırıp depo yolu (assets/images/banners/…) kullanmayı deneyin.';
      }
      toast(isNew ? 'Hane eklendi.' : 'Hane güncellendi.');
      renderHousesAdmin();
      return null;
    });

  bindKgImg('banner', img, baseName);
}

function imageFieldGeneric(label, key, val, hint) {
  return '<div class="f-row"><label class="f-label" for="f-' + key + '">' + esc(label) + '</label>' +
    '<input class="f-input" id="f-' + key + '" value="' + esc(val || '') + '">' +
    (hint ? '<div class="f-hint">' + esc(hint) + '</div>' : '') +
    '<div id="img-preview" style="display:none"></div></div>';
}

/* ═══════════════════════════════════════════════════════════
   3) BÖLÜM YÖNETİMİ
   ═══════════════════════════════════════════════════════════ */
function chapList() { return DB['chapters.json'].chapters || (DB['chapters.json'].chapters = []); }
function arcList() { return DB['chapters.json'].arcs || (DB['chapters.json'].arcs = []); }

function bookWordsLabel(ch) {
  const e = ((DB['book.json'] || {}).chapters || {})[String(ch.id)];
  const w = e && e.text ? Wiki.Book.words(e.text.tr || e.text.en || '') : 0;
  return w ? w.toLocaleString('tr-TR') + ' kelime' : 'metin yok';
}

function renderChapters() {
  const all = chapList();
  const q = searchQ.chapters.toLocaleLowerCase('tr');
  const rows = all.filter(c => !q ||
    biVal(c.title).toLocaleLowerCase('tr').includes(q) ||
    biVal(c.synopsis).toLocaleLowerCase('tr').includes(q));

  $('#view').innerHTML =
    toolbarHTML('chapters', 'Bölüm başlığı veya özet ara…', rows.length, all.length, 'bölüm') +
    (rows.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      '<th style="width:50px">No</th><th>Başlık</th><th>Yay</th><th>KS</th><th>Durum</th><th>Metin</th><th></th>' +
      '</tr></thead><tbody>' +
      rows.map(ch => {
        const i = all.indexOf(ch);
        const arc = arcList().find(a => a.id === ch.arc);
        return '<tr>' +
          '<td style="font-family:var(--font-display);color:var(--gold)">' + esc(ch.num) + '</td>' +
          '<td><div class="cell-name">' + esc(biVal(ch.title)) + '</div>' +
          '<div class="cell-sub">' + esc(String(biVal(ch.synopsis)).substring(0, 62)) + '…</div></td>' +
          '<td style="font-size:.76rem">' + esc(arc ? biVal(arc.name) : '—') + '</td>' +
          '<td style="font-size:.76rem;color:var(--parchd)">' + esc(ch.ks || '') + '</td>' +
          '<td><span class="pill ' + (ch.free ? 'free' : 'locked') + '">' + (ch.free ? 'Yayında' : 'Kilitli') + '</span></td>' +
          '<td style="font-size:.76rem;color:var(--parchd);white-space:nowrap">' + esc(bookWordsLabel(ch)) + '</td>' +
          '<td><div class="cell-acts">' +
          '<button class="abtn sm primary" data-book-text="' + esc(ch.id) + '">Metni Düzenle</button>' +
          '<button class="abtn sm" data-edit="' + i + '">Bilgiler</button>' +
          '<button class="abtn sm danger" data-del="' + i + '">Sil</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<div class="empty-a">Kayıt bulunamadı.</div>');

  bindToolbar('chapters', renderChapters);
}

function openChapterEditor(index) {
  const isNew = index === null;
  const ch = isNew
    ? { id: null, arc: (arcList()[0] || { id: 1 }).id, free: false, num: '', ks: '', title: bi(), pov: bi(), synopsis: bi(), firstLine: '', tags: [] }
    : JSON.parse(JSON.stringify(chapList()[index]));
  editing = { kind: 'chapter', index: index };

  drawer(isNew ? 'Yeni Bölüm' : 'Bölümü Düzenle',
    '<div class="f-row half">' +
    textField('Bölüm No (Roma rakamı)', 'num', ch.num, 'Örn: IV') +
    textField('Zaman (KS)', 'ks', ch.ks, 'Örn: KS 1481') +
    '</div>' +
    '<div class="f-row half">' +
    selectField('Yay (Arc)', 'arc', arcList().map(a => [String(a.id), biVal(a.name)]), String(ch.arc)) +
    selectField('Yayın Durumu', 'free', [['1', 'Yayında (okunabilir)'], ['0', 'Kilitli (yakında)']], ch.free ? '1' : '0') +
    '</div>' +
    biField('Başlık', 'title', ch.title, true) +
    biField('Anlatıcı (POV)', 'pov', ch.pov) +
    biField('Özet', 'synopsis', ch.synopsis, false, true) +
    textField('İlk Cümle', 'firstLine', ch.firstLine, 'Okuma modunda alıntı olarak gösterilir') +
    tagField(ch.tags || []),
    () => {
      const title = readBi('title');
      if (isEmptyBi(title)) return 'Başlık zorunludur.';
      const rec = {
        id: ch.id != null ? ch.id : (chapList().reduce((m, c) => Math.max(m, c.id || 0), 0) + 1),
        arc: parseInt($('#f-arc').value, 10),
        free: $('#f-free').value === '1',
        num: $('#f-num').value.trim() || '?',
        ks: $('#f-ks').value.trim(),
        title: title,
        pov: readBi('pov'),
        synopsis: readBi('synopsis'),
        firstLine: $('#f-firstLine').value.trim(),
        tags: readTags()
      };
      if (isNew) chapList().push(rec); else chapList()[index] = rec;
      if (!save('chapters.json')) return 'Kaydedilemedi.';
      toast(isNew ? 'Bölüm eklendi.' : 'Bölüm güncellendi.');
      renderChapters();
      return null;
    });
}

/* ═══════════════════════════════════════════════════════════
   4) TARİH ŞERİDİ (KRONİK)
   ═══════════════════════════════════════════════════════════ */
function eventList() { return DB['lore.json'].events || (DB['lore.json'].events = []); }

function renderEvents() {
  const all = eventList();
  const q = searchQ.events.toLocaleLowerCase('tr');
  const rows = all.filter(e => !q || biVal(e.name).toLocaleLowerCase('tr').includes(q));

  $('#view').innerHTML =
    toolbarHTML('events', 'Olay adı ara…', rows.length, all.length, 'olay') +
    (rows.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      '<th style="width:90px">KS</th><th>Olay</th><th>Tür</th><th>Etiket</th><th></th>' +
      '</tr></thead><tbody>' +
      rows.map(e => {
        const i = all.indexOf(e);
        return '<tr>' +
          '<td style="font-family:var(--font-display);color:var(--gold);font-size:.8rem">' + esc(e.ks) + '</td>' +
          '<td><div class="cell-name">' + esc(biVal(e.name)) + '</div>' +
          '<div class="cell-sub">' + esc(String(biVal(e.desc)).substring(0, 70)) + '…</div></td>' +
          '<td><span class="pill neutral">' + esc((EVENT_TYPES.find(t => t[0] === e.type) || [, e.type])[1]) + '</span></td>' +
          '<td style="font-size:.7rem;color:var(--goldd)">' + esc((e.tags || []).map(t => '#' + t).join(' ') || '—') + '</td>' +
          '<td><div class="cell-acts">' +
          '<button class="abtn sm" data-edit="' + i + '">Düzenle</button>' +
          '<button class="abtn sm danger" data-del="' + i + '">Sil</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<div class="empty-a">Kayıt bulunamadı.</div>');

  bindToolbar('events', renderEvents);
}

function openEventEditor(index) {
  const isNew = index === null;
  const e = isNew ? { id: '', ks: '', type: 'ruler', name: bi(), desc: bi(), tags: [] }
                  : JSON.parse(JSON.stringify(eventList()[index]));
  editing = { kind: 'event', index: index };

  drawer(isNew ? 'Yeni Kronik Olayı' : 'Olayı Düzenle',
    '<div class="f-row half">' +
    textField('Zaman (KS)', 'ks', e.ks, 'Örn: KS 1481 veya ~0') +
    selectField('Olay Türü', 'type', EVENT_TYPES, e.type) +
    '</div>' +
    biField('Olay Adı', 'name', e.name, true) +
    biField('Açıklama', 'desc', e.desc, false, true) +
    tagField(e.tags || []),
    () => {
      const name = readBi('name');
      if (isEmptyBi(name)) return 'Olay adı zorunludur.';
      const rec = {
        id: e.id || uniqueId(slugify(name.tr || name.en), eventList().map(x => x.id)),
        ks: $('#f-ks').value.trim() || '?',
        type: $('#f-type').value,
        name: name,
        desc: readBi('desc'),
        tags: readTags()
      };
      if (isNew) eventList().push(rec); else eventList()[index] = rec;
      if (!save('lore.json')) return 'Kaydedilemedi.';
      toast(isNew ? 'Olay eklendi.' : 'Olay güncellendi.');
      renderEvents();
      return null;
    });
}

/* ═══════════════════════════════════════════════════════════
   5) SÖZLÜK
   ═══════════════════════════════════════════════════════════ */
function glossList() { return DB['lore.json'].glossary || (DB['lore.json'].glossary = []); }

function renderGlossary() {
  const all = glossList();
  const q = searchQ.glossary.toLocaleLowerCase('tr');
  const rows = all.filter(g => !q || biVal(g.term).toLocaleLowerCase('tr').includes(q));

  $('#view').innerHTML =
    toolbarHTML('glossary', 'Terim ara…', rows.length, all.length, 'terim') +
    (rows.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      '<th>Terim</th><th>Tür</th><th>Tanım</th><th></th></tr></thead><tbody>' +
      rows.map(g => {
        const i = all.indexOf(g);
        return '<tr>' +
          '<td><div class="cell-name">' + esc(biVal(g.term)) + '</div></td>' +
          '<td><span class="pill neutral">' + esc((GLOSSARY_TYPES.find(t => t[0] === g.type) || [, g.type])[1]) + '</span></td>' +
          '<td style="font-size:.76rem;color:var(--parchd)">' + esc(String(biVal(g.def)).substring(0, 85)) + '…</td>' +
          '<td><div class="cell-acts">' +
          '<button class="abtn sm" data-edit="' + i + '">Düzenle</button>' +
          '<button class="abtn sm danger" data-del="' + i + '">Sil</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<div class="empty-a">Kayıt bulunamadı.</div>');

  bindToolbar('glossary', renderGlossary);
}

function openGlossaryEditor(index) {
  const isNew = index === null;
  const g = isNew ? { id: '', type: 'geo', term: bi(), def: bi() }
                  : JSON.parse(JSON.stringify(glossList()[index]));
  editing = { kind: 'glossary', index: index };

  drawer(isNew ? 'Yeni Sözlük Terimi' : 'Terimi Düzenle',
    selectField('Terim Türü', 'type', GLOSSARY_TYPES, g.type) +
    biField('Terim', 'term', g.term, true) +
    biField('Tanım', 'def', g.def, false, true) +
    '<div class="notice" style="margin-top:1rem">Buraya eklenen terimler, site genelinde metin içinde ' +
    'geçtiğinde otomatik olarak <strong>tooltip mini kartı</strong> gösterir.</div>',
    () => {
      const term = readBi('term');
      if (isEmptyBi(term)) return 'Terim zorunludur.';
      const rec = {
        id: g.id || uniqueId(slugify(term.tr || term.en), glossList().map(x => x.id)),
        type: $('#f-type').value,
        term: term,
        def: readBi('def')
      };
      if (isNew) glossList().push(rec); else glossList()[index] = rec;
      if (!save('lore.json')) return 'Kaydedilemedi.';
      toast(isNew ? 'Terim eklendi.' : 'Terim güncellendi.');
      renderGlossary();
      return null;
    });
}

/* ═══════════════════════════════════════════════════════════
   6) SÖZLER & ALINTILAR
   ═══════════════════════════════════════════════════════════ */
function quoteList() { return DB['quotes.json'].quotes || (DB['quotes.json'].quotes = []); }
function themeList() { return (DB['quotes.json'].themes || []).filter(t => t.id !== 'all'); }

function renderQuotes() {
  const all = quoteList();
  const q = searchQ.quotes.toLocaleLowerCase('tr');
  const rows = all.filter(x => !q ||
    biVal(x.text).toLocaleLowerCase('tr').includes(q) ||
    biVal(x.speaker).toLocaleLowerCase('tr').includes(q));

  $('#view').innerHTML =
    toolbarHTML('quotes', 'Söz veya konuşan ara…', rows.length, all.length, 'alıntı') +
    (rows.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      '<th>Söz</th><th style="width:170px">Konuşan</th><th>Tema</th><th></th></tr></thead><tbody>' +
      rows.map(x => {
        const i = all.indexOf(x);
        const th = themeList().find(t => t.id === x.theme);
        return '<tr>' +
          '<td style="font-style:italic;font-size:.8rem">' + esc(String(biVal(x.text)).substring(0, 95)) + '…</td>' +
          '<td style="font-size:.78rem;color:var(--gold)">' + esc(biVal(x.speaker)) + '</td>' +
          '<td><span class="pill neutral">' + esc(th ? th.tr : x.theme) + '</span></td>' +
          '<td><div class="cell-acts">' +
          '<button class="abtn sm" data-edit="' + i + '">Düzenle</button>' +
          '<button class="abtn sm danger" data-del="' + i + '">Sil</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<div class="empty-a">Kayıt bulunamadı.</div>');

  bindToolbar('quotes', renderQuotes);
}

function openQuoteEditor(index) {
  const isNew = index === null;
  const q = isNew ? { text: bi(), speaker: bi(), speakerId: '', theme: (themeList()[0] || { id: '' }).id, tags: [] }
                  : JSON.parse(JSON.stringify(quoteList()[index]));
  editing = { kind: 'quote', index: index };

  const charOpts = [['', '— bağlantı yok —']].concat(charList().map(c => [c.id, biVal(c.name)]));

  drawer(isNew ? 'Yeni Alıntı' : 'Alıntıyı Düzenle',
    biField('Söz Metni', 'text', q.text, true, true) +
    biField('Konuşan', 'speaker', q.speaker) +
    '<div class="f-row half">' +
    selectField('Tema', 'theme', themeList().map(t => [t.id, t.tr]), q.theme) +
    selectField('Karakter Bağlantısı', 'speakerId', charOpts, q.speakerId || '') +
    '</div>' +
    tagField(q.tags || []),
    () => {
      const text = readBi('text');
      if (isEmptyBi(text)) return 'Söz metni zorunludur.';
      const rec = {
        text: text,
        speaker: readBi('speaker'),
        theme: $('#f-theme').value,
        tags: readTags()
      };
      const sid = $('#f-speakerId').value;
      if (sid) rec.speakerId = sid;
      if (isNew) quoteList().push(rec); else quoteList()[index] = rec;
      if (!save('quotes.json')) return 'Kaydedilemedi.';
      toast(isNew ? 'Alıntı eklendi.' : 'Alıntı güncellendi.');
      renderQuotes();
      return null;
    });
}

/* ═══════════════════════════════════════════════════════════
   COĞRAFYA (geography.json: provinces + worldPowers)
   ═══════════════════════════════════════════════════════════ */
function geoProvinceList() { return DB['geography.json'].provinces || (DB['geography.json'].provinces = []); }
function geoPowerList() { return DB['geography.json'].worldPowers || (DB['geography.json'].worldPowers = []); }

function renderGeography() {
  const provs = geoProvinceList();
  const powers = geoPowerList().slice().sort((a, b) => (a.rank || 0) - (b.rank || 0));

  $('#view').innerHTML =
    '<div class="notice">Eyalet detayları ve dünya güç sıralaması <code>geography.json</code> içinde tutulur; ' +
    'değişiklikler <code>haneler.html</code> ve <code>lore.html</code> sayfalarına yansır.</div>' +

    '<div class="panel-t" style="margin-bottom:.6rem">Eyalet Detayları (' + provs.length + ')</div>' +
    (provs.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      '<th>Eyalet</th><th>Komşular</th><th>Şehirler</th><th></th></tr></thead><tbody>' +
      provs.map((p, i) => '<tr>' +
        '<td><div class="cell-name">' + esc(p.name || '') + '</div>' +
        '<div class="cell-sub">' + esc((p.flag || '').substring(0, 60)) + '</div></td>' +
        '<td style="font-size:.76rem;color:var(--parchd)">' + esc((p.neighbors || '').substring(0, 60)) + '</td>' +
        '<td style="font-size:.76rem;color:var(--parchd)">' + esc((p.cities || '').substring(0, 60)) + '</td>' +
        '<td><div class="cell-acts">' +
        '<button class="abtn sm" data-edit="' + i + '">Düzenle</button>' +
        '<button class="abtn sm danger" data-del="' + i + '">Sil</button>' +
        '</div></td></tr>').join('') + '</tbody></table></div>'
      : '<div class="empty-a">Eyalet kaydı yok.</div>') +

    '<div class="panel-t" style="margin:1.75rem 0 .6rem">Dünya Güç Sıralaması (' + powers.length + ')</div>' +
    '<div class="btn-row" style="margin-bottom:.9rem"><button class="abtn" id="add-power">+ Sıralama Kaydı Ekle</button></div>' +
    (powers.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      '<th style="width:50px">#</th><th>Devlet</th><th>Puan</th><th>Nüfus</th><th></th></tr></thead><tbody>' +
      powers.map(w => {
        const i = geoPowerList().indexOf(w);
        return '<tr>' +
          '<td style="font-family:var(--font-display);color:var(--gold)">' + esc(w.rank) + '</td>' +
          '<td class="cell-name">' + esc((w.name && w.name.tr) || '') + '</td>' +
          '<td>' + esc(w.score != null ? w.score.toFixed(2) : '—') + '</td>' +
          '<td style="font-size:.78rem;color:var(--parchd)">' + esc(w.population ? w.population.toLocaleString('tr-TR') : '—') + '</td>' +
          '<td><div class="cell-acts">' +
          '<button class="abtn sm" data-power-edit="' + i + '">Düzenle</button>' +
          '<button class="abtn sm danger" data-power-del="' + i + '">Sil</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<div class="empty-a">Sıralama kaydı yok.</div>');

  $('#add-power')?.addEventListener('click', () => openPowerEditor(null));
}

function openProvinceEditor(index) {
  const isNew = index === null;
  const p = isNew ? { name: '', neighbors: '', cities: '', rivers: '', lake: '', mountains: '', governor: '', houses: '', flag: '', economy: '' }
                  : JSON.parse(JSON.stringify(geoProvinceList()[index]));
  editing = { kind: 'province', index };

  drawer(isNew ? 'Yeni Eyalet' : 'Eyaleti Düzenle',
    textField('Eyalet Adı', 'p-name', p.name, '', true) +
    textField('Komşular', 'p-neighbors', p.neighbors) +
    textField('Şehirler', 'p-cities', p.cities) +
    textField('Nehirler', 'p-rivers', p.rivers) +
    textField('Göl', 'p-lake', p.lake) +
    textField('Dağlar', 'p-mountains', p.mountains) +
    textField('Vali', 'p-governor', p.governor) +
    textField('Haneler', 'p-houses', p.houses) +
    textField('Bayrak Betimlemesi', 'p-flag', p.flag) +
    textField('Geçim / Ekonomi', 'p-economy', p.economy),
    () => {
      const name = $('#f-p-name').value.trim();
      if (!name) return 'Eyalet adı zorunludur.';
      const rec = {
        name,
        neighbors: $('#f-p-neighbors').value.trim(),
        cities: $('#f-p-cities').value.trim(),
        rivers: $('#f-p-rivers').value.trim(),
        lake: $('#f-p-lake').value.trim(),
        mountains: $('#f-p-mountains').value.trim(),
        governor: $('#f-p-governor').value.trim(),
        houses: $('#f-p-houses').value.trim(),
        flag: $('#f-p-flag').value.trim(),
        economy: $('#f-p-economy').value.trim(),
      };
      if (isNew) geoProvinceList().push(rec); else geoProvinceList()[index] = rec;
      if (!save('geography.json')) return 'Kaydedilemedi.';
      toast(isNew ? 'Eyalet eklendi.' : 'Eyalet güncellendi.');
      renderGeography();
      return null;
    });
}

function openPowerEditor(index) {
  const isNew = index === null;
  const w = isNew ? { rank: geoPowerList().length + 1, name: bi(), score: 0, population: 0, military: 0 }
                  : JSON.parse(JSON.stringify(geoPowerList()[index]));
  editing = { kind: 'power', index };

  drawer(isNew ? 'Yeni Sıralama Kaydı' : 'Sıralama Kaydını Düzenle',
    '<div class="f-row half">' +
    textField('Sıra (#)', 'w-rank', String(w.rank ?? '')) +
    textField('Puan', 'w-score', String(w.score ?? '')) +
    '</div>' +
    biField('Devlet Adı', 'name', w.name, true) +
    '<div class="f-row half">' +
    textField('Nüfus', 'w-population', String(w.population ?? '')) +
    textField('Askerî Güç', 'w-military', String(w.military ?? '')) +
    '</div>',
    () => {
      const name = readBi('name');
      if (isEmptyBi(name)) return 'Devlet adı zorunludur.';
      const rec = {
        rank: parseInt($('#f-w-rank').value, 10) || 0,
        name,
        score: parseFloat($('#f-w-score').value) || 0,
        population: parseInt($('#f-w-population').value, 10) || 0,
        military: parseInt($('#f-w-military').value, 10) || 0,
      };
      if (isNew) geoPowerList().push(rec); else geoPowerList()[index] = rec;
      if (!save('geography.json')) return 'Kaydedilemedi.';
      toast(isNew ? 'Kayıt eklendi.' : 'Kayıt güncellendi.');
      renderGeography();
      return null;
    });
}

/* ═══════════════════════════════════════════════════════════
   TANRILAR (lore.json → gods[])
   ---------------------------------------------------------------
   Denge Konseyi'nin 15 tanrısı. Düzenlenen kayıt iki sayfada birden
   görünür:
     · tanrilar.html     — Daire'deki yuvarlak sembol + etiket
     · tanri-detay.html  — tanrının sayfası (amblem, hızlı bilgi, metinler)
   Sembol görseli TEK alandan (gods[].image) okunur; iki sayfa aynı
   dosyayı gösterir. Boşsa assets/images/gods/<id>.png → .jpg aranır.

   Tanrı eklenmez/silinmez: Daire'deki konumlar (tanrilar.html ROWS)
   ve denge çiftleri (PAIRS) kimliklere bağlı sabit bir yerleşimdir.
   ═══════════════════════════════════════════════════════════ */
const GOD_FACTIONS = [
  ['order', 'Düzen — "Demir Yumruk"'],
  ['kaos', 'Kaos — "Zincirsiz Ateş"'],
  ['neutral', 'Tarafsız']
];

function godList() { return DB['lore.json'].gods || (DB['lore.json'].gods = []); }

function renderGods() {
  const list = godList();
  $('#view').innerHTML =
    '<div class="notice">Bir tanrının <strong>sembol görseli</strong> hem <code>tanrilar.html</code> (Daire) hem de ' +
    '<code>tanri-detay.html</code> sayfasında aynen kullanılır. Görsel yolu boş bırakılırsa site ' +
    '<code>assets/images/gods/&lt;id&gt;.png</code>, sonra <code>.jpg</code> dosyasını arar; hiçbiri yoksa baş harf rozeti görünür.</div>' +
    (list.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      '<th style="width:64px">Sembol</th><th>Tanrı</th><th>Fraksiyon</th><th>Görsel yolu</th><th></th>' +
      '</tr></thead><tbody>' +
      list.map((g, i) => {
        const fac = (GOD_FACTIONS.find(f => f[0] === g.faction) || [, g.faction || '—'])[1];
        const isData = /^data:/.test(g.image || '');
        const pathTxt = !g.image ? 'otomatik: gods/' + g.id + '.png / .jpg'
          : isData ? 'yüklenmiş görsel (yalnızca bu tarayıcıda)' : g.image;
        return '<tr>' +
          '<td><div class="god-thumb"><span>' + esc(String(g.trueName || '?').trim().charAt(0).toUpperCase()) + '</span>' +
          (typeof Wiki.godImgHTML === 'function' ? Wiki.godImgHTML(g) : '') + '</div></td>' +
          '<td><div class="cell-name">' + esc(biVal(g.epithet) || g.trueName) + '</div>' +
          '<div class="cell-sub">' + esc(g.trueName || '') + ' · id: ' + esc(g.id) + '</div></td>' +
          '<td><span class="pill neutral">' + esc(fac) + '</span></td>' +
          '<td style="font-size:.74rem;color:var(--parchd);word-break:break-all">' + esc(pathTxt) + '</td>' +
          '<td><div class="cell-acts">' +
          '<a class="abtn sm" href="' + SWRoute.href('tanri', g.id) + '" target="_blank" rel="noopener">Sayfa ↗</a>' +
          '<button class="abtn sm" data-edit="' + i + '">Düzenle</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<div class="empty-a">Tanrı kaydı yok.</div>');
  if (typeof Wiki.wireGodImgs === 'function') Wiki.wireGodImgs($('#view'));
}

function openGodEditor(index) {
  const g = JSON.parse(JSON.stringify(godList()[index]));
  editing = { kind: 'god', index: index };
  const img = { god: g.image || '' };
  const baseName = () => g.id || 'tanri';
  const secH = t => '<div class="f-sec">' + esc(t) + '</div>';

  drawer('Tanrıyı Düzenle — ' + (biVal(g.epithet) || g.trueName),
    secH('Kimlik') +
    '<div class="f-hint" style="margin-bottom:.8rem">Kimlik (id): <code>' + esc(g.id) + '</code> — değiştirilemez; ' +
    'görsel dosya adı ve sayfa adresi buna bağlıdır.</div>' +
    textField('Gerçek İsim', 'g-true', g.trueName) +
    biField('Epitet / Unvan', 'epithet', asBi(g.epithet), true) +
    selectField('Fraksiyon', 'g-faction', GOD_FACTIONS, g.faction || 'neutral') +
    '<div class="f-hint" style="margin:-.4rem 0 .8rem">Fraksiyon yalnızca tanrının sayfasındaki etiket ve vurgu rengini belirler. ' +
    'Daire\'deki sol/sağ konum <code>tanrilar.html</code> içindeki yerleşimden gelir.</div>' +

    secH('Sembol') +
    kgImgFieldHTML('god') +
    biField('Sembolün Tarifi', 'symbol', asBi(g.symbol)) +

    secH('Metinler') +
    biField('Görevi & Rolü', 'role', asBi(g.role), false, true) +
    biField('Psikoloji & Tapınım', 'psychology', asBi(g.psychology), false, true) +
    biField('Ritüel & Bağlantılar', 'ritual', asBi(g.ritual), false, true),
    () => {
      const trueName = $('#f-g-true').value.trim();
      const epithet = readBi('epithet');
      if (!trueName) return 'Gerçek isim zorunludur.';
      if (isEmptyBi(epithet)) return 'Epitet / unvan zorunludur.';
      const image = String(img.god || '').trim();
      if (image && typeof Wiki.safeImg === 'function' && !Wiki.safeImg(image)) return 'Görsel yolu geçersiz. Örnek: assets/images/gods/' + g.id + '.png';

      const rec = Object.assign({}, g, {
        trueName: trueName,
        epithet: epithet,
        faction: $('#f-g-faction').value,
        symbol: readBi('symbol'),
        role: readBi('role'),
        psychology: readBi('psychology'),
        ritual: readBi('ritual')
      });
      if (image) rec.image = image; else delete rec.image;

      const snapshot = JSON.stringify(DB['lore.json'].gods);
      godList()[index] = rec;
      if (!save('lore.json')) {
        DB['lore.json'].gods = JSON.parse(snapshot);
        return 'Kaydedilemedi — tarayıcı depolama sınırı aşılmış olabilir. Yüklenen görseli kaldırıp depo yolu (assets/images/gods/…) kullanmayı deneyin.';
      }
      toast('Tanrı güncellendi.');
      renderGods();
      return null;
    });

  bindKgImg('god', img, baseName);
}

/* ═══════════════════════════════════════════════════════════
   DEVLETLER (kingdoms.json)
   ---------------------------------------------------------------
   krallik-detay.html?id=… sayfasının tüm içeriği buradan yönetilir:
   bayrak görseli + kanonik tarif, sicil (infobox), tarihçe, bölgesel
   harita, garnizon / ihraç ürünleri, dış ilişkiler.

   Görseller iki yoldan verilebilir:
     · Dosya yükleme (PNG / JPG / WebP) → tarayıcıda küçültülüp
       kayda gömülür (data: URL). Anında çalışır, ama kayıt büyür.
     · Depo yolu (assets/images/kingdoms/…) → JSON hafif kalır;
       dosya depoya elle konur. Yayın için önerilen yol budur.
   ═══════════════════════════════════════════════════════════ */
const KG_TYPES = [['empire', 'İmparatorluk'], ['kingdom', 'Krallık'], ['state', 'Devlet'], ['house-state', 'Hane Devleti']];
const KG_STATUSES = [['active', 'Aktif'], ['contested', 'Çekişmeli'], ['independent', 'Bağımsız'], ['vassal', 'Vassal']];
const KG_HIST_TYPES = [['', 'Belirtilmemiş'], ['founding', 'Kuruluş'], ['war', 'Savaş'], ['treaty', 'Anlaşma'], ['other', 'Diğer olay']];
const KG_IMG = {
  banner: { label: 'Hane Bayrağı / Sancağı', suffix: 'sancak', dir: 'banners', maxW: 400, maxH: 560, keepPng: true, limit: 250000,
          hint: 'PNG veya JPG. Yüklenen görsel en fazla 400 px genişliğe küçültülür; şeffaf PNG şeffaf kalır. Boş bırakılırsa hane sayfasında "Bayrak henüz yüklenmemiş" yazar.' },
  god:  { label: 'Tanrı Sembolü Görseli', suffix: 'sembol', dir: 'gods', maxW: 512, maxH: 512, keepPng: true, limit: 250000,
          example: id => 'assets/images/gods/' + (id || 'galdra') + '.png', plainName: true,
          emptyNote: 'Görsel yolu boş — site assets/images/gods/<id>.png, sonra <id>.jpg dosyasını arar; yoksa baş harf rozeti görünür.',
          hint: 'PNG veya JPG, tercihen kare. Yüklenen görsel en fazla 512 px\'e küçültülür; şeffaf PNG şeffaf kalır. Aynı görsel hem Daire\'de (tanrilar.html) hem tanrının kendi sayfasında (tanri-detay.html) kullanılır.' },
  flag: { label: 'Bayrak Görseli', suffix: 'bayrak', dir: 'kingdoms', maxW: 600, maxH: 450, keepPng: true,
          hint: 'PNG veya JPG. Yüklenen görsel en fazla 600 px genişliğe küçültülür; şeffaf PNG şeffaf kalır. Boş bırakılırsa sayfada "Bayrak yüklenmedi" yazar.' },
  map:  { label: 'Bölgesel Harita Kesiti', suffix: 'harita', dir: 'kingdoms', maxW: 1400, maxH: 1000, keepPng: false,
          hint: 'PNG veya JPG. Ülkenin kıta üzerindeki odaklanmış harita gravürü; yüklenen görsel en fazla 1400 px genişliğe küçültülüp JPEG\'e çevrilir. Boş bırakılırsa sayfada "Harita yüklenecek" yazar.' }
};

function kingdomList() { return DB['kingdoms.json'].kingdoms || (DB['kingdoms.json'].kingdoms = []); }

function kgSafeImg(src) {
  src = String(src || '').trim();
  return /^(data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+|(?!\/\/)(?![a-z][a-z0-9+.-]*:)[^\s"'<>]+|https?:\/\/[^\s"'<>]+)$/i.test(src) ? src : '';
}
function asBi(v) {
  return (v && typeof v === 'object' && !Array.isArray(v)) ? { tr: v.tr || '', en: v.en || '' } : bi(v || '', '');
}
function kgLines(v, lang) {
  if (Array.isArray(v)) return lang === 'tr' ? v.join('\n') : '';
  return v && Array.isArray(v[lang]) ? v[lang].join('\n') : '';
}
function kgSplit(str) {
  return String(str || '').split('\n').map(x => x.trim()).filter(Boolean);
}

function renderKingdoms() {
  const list = kingdomList();
  $('#view').innerHTML =
    '<div class="notice">Her devletin sayfası <code>#/devlet/…</code> adresinde (krallik-detay.html) tek şablonla üretilir. ' +
    'Bayrak ve bölgesel harita görselleri buradan eklenir; eklenmemişse sayfada <em>"Bayrak yüklenmedi"</em> / <em>"Harita yüklenecek"</em> yazar.</div>' +
    (list.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      '<th style="width:64px">Bayrak</th><th>Devlet</th><th>Tür</th><th>Durum</th><th>Görseller</th><th></th>' +
      '</tr></thead><tbody>' +
      list.map((k, i) => {
        const flag = kgSafeImg(k.flagImage), map = kgSafeImg(k.regionMap);
        const stLabel = (KG_STATUSES.find(x => x[0] === k.status) || [, k.status])[1];
        const tyLabel = (KG_TYPES.find(x => x[0] === k.type) || [, k.type])[1];
        return '<tr>' +
          '<td>' + (flag
            ? '<img class="kg-thumb" src="' + esc(flag) + '" alt="" loading="lazy">'
            : '<div class="kg-thumb kg-thumb-empty" style="border-top-color:' + esc(k.color || 'var(--goldd)') + '">—</div>') + '</td>' +
          '<td><div class="cell-name">' + esc(biVal(k.name)) + '</div>' +
          '<div class="cell-sub">' + esc(biVal(k.capital)) + '</div></td>' +
          '<td><span class="pill neutral">' + esc(tyLabel) + '</span></td>' +
          '<td style="font-size:.78rem;color:var(--parchd)">' + esc(stLabel) + '</td>' +
          '<td style="font-size:.74rem;color:var(--parchd);line-height:1.7">' +
            'Bayrak: ' + (flag ? '<span style="color:var(--gold)">var</span>' : 'yok') + '<br>' +
            'Harita: ' + (map ? '<span style="color:var(--gold)">var</span>' : 'yok') + '</td>' +
          '<td><div class="cell-acts">' +
          '<a class="abtn sm" href="' + SWRoute.href('devlet', k.id) + '" target="_blank" rel="noopener">Sayfa ↗</a>' +
          '<button class="abtn sm" data-edit="' + i + '">Düzenle</button>' +
          '<button class="abtn sm danger" data-del="' + i + '">Sil</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<div class="empty-a">Devlet kaydı yok.</div>');
}

/* ── Görsel: yükle → küçült → data URL ───────────────────── */
function kgProcessImage(file, cfg) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      const draw = (maxW, maxH, mode, q) => {
        const sc = Math.min(1, maxW / im.naturalWidth, maxH / im.naturalHeight);
        const w = Math.max(1, Math.round(im.naturalWidth * sc));
        const h = Math.max(1, Math.round(im.naturalHeight * sc));
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        if (mode === 'jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); }
        ctx.drawImage(im, 0, 0, w, h);
        return c.toDataURL(mode === 'png' ? 'image/png' : 'image/jpeg', q);
      };
      let out;
      if (cfg.keepPng && file.type === 'image/png') {
        out = draw(cfg.maxW, cfg.maxH, 'png');
        const lim = cfg.limit || 450000;
        if (out.length > lim) out = draw(Math.round(cfg.maxW * .7), Math.round(cfg.maxH * .7), 'png');
        if (out.length > lim) out = draw(Math.round(cfg.maxW * .7), Math.round(cfg.maxH * .7), 'jpeg', .85);
      } else {
        out = draw(cfg.maxW, cfg.maxH, 'jpeg', .82);
        if (out.length > 600000) out = draw(Math.round(cfg.maxW * .8), Math.round(cfg.maxH * .8), 'jpeg', .72);
      }
      resolve(out);
    };
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Görsel okunamadı.')); };
    im.src = url;
  });
}

function kgImgFieldHTML(key) {
  const cfg = KG_IMG[key];
  return '<div class="f-row kgi" id="kgi-' + key + '">' +
    '<label class="f-label">' + esc(cfg.label) + '</label>' +
    '<input type="file" class="kgi-file" accept="image/png,image/jpeg,image/webp">' +
    '<div class="f-hint">' + esc(cfg.hint) + '</div>' +
    '<input class="f-input kgi-path" style="margin-top:.5rem" placeholder="assets/images/' + cfg.dir + '/ornek-' + cfg.suffix + '.png">' +
    '<div class="f-hint">Ya da görseli depoya kendiniz koyup yolunu yazın — JSON dosyası hafif kalır, yayın için önerilir.</div>' +
    '<div class="kgi-prev"></div>' +
    '<div class="btn-row" style="margin-top:.5rem">' +
    '<button type="button" class="abtn sm kgi-dl">Dosya olarak indir</button>' +
    '<button type="button" class="abtn sm danger kgi-rm">Görseli kaldır</button></div>' +
    '</div>';
}

function bindKgImg(key, state, baseName) {
  const cfg = KG_IMG[key];
  const root = $('#kgi-' + key);
  if (!root) return;
  const file = root.querySelector('.kgi-file'), path = root.querySelector('.kgi-path');
  const prev = root.querySelector('.kgi-prev'), dl = root.querySelector('.kgi-dl'), rm = root.querySelector('.kgi-rm');

  function paintPreview() {
    const v = state[key], isData = /^data:/.test(v);
    dl.style.display = isData ? '' : 'none';
    rm.style.display = v ? '' : 'none';
    if (!v) { prev.innerHTML = '<div class="f-hint">' + esc(cfg.emptyNote || 'Görsel yok — sayfada yer tutucu görünür.') + '</div>'; return; }
    const safe = kgSafeImg(v);
    if (!safe) { prev.innerHTML = '<div class="media-status bad">Geçersiz görsel yolu.</div>'; return; }
    prev.innerHTML = '<img class="kgi-img" alt="">';
    const im = prev.firstChild;
    im.addEventListener('error', () => {
      prev.innerHTML = '<div class="media-status bad">Görsel bulunamadı — yolu kontrol edin.</div>';
    }, { once: true });
    im.src = safe;
    if (isData) {
      const note = document.createElement('div');
      note.className = 'f-hint';
      note.textContent = 'Yüklenen görsel kullanılıyor (~' + Math.round(v.length * 0.75 / 1024) + ' KB).';
      prev.appendChild(note);
    }
  }
  function paintPath() {
    const isData = /^data:/.test(state[key]);
    path.value = isData ? '' : state[key];
    path.placeholder = isData ? 'Yüklenen görsel kullanılıyor — yol yazarsanız onun yerine geçer'
      : (cfg.example ? cfg.example(baseName()) : 'assets/images/' + cfg.dir + '/ornek-' + cfg.suffix + '.png');
  }

  file.addEventListener('change', async () => {
    const f = file.files && file.files[0];
    file.value = '';
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) { toast('Yalnızca PNG, JPG veya WebP yüklenebilir.', true); return; }
    if (f.size > 25 * 1024 * 1024) { toast('Dosya 25 MB\'tan büyük olamaz.', true); return; }
    try {
      state[key] = await kgProcessImage(f, cfg);
      paintPath(); paintPreview();
    } catch (e) { toast(e.message || 'Görsel işlenemedi.', true); }
  });
  path.addEventListener('input', () => { state[key] = path.value.trim(); paintPreview(); });
  rm.addEventListener('click', () => { state[key] = ''; paintPath(); paintPreview(); });
  dl.addEventListener('click', () => {
    const ext = /^data:image\/png/.test(state[key]) ? 'png' : 'jpg';
    const a = document.createElement('a');
    a.href = state[key];
    /* plainName: dosya adı tam olarak <id>.<uzantı> olur — depoya olduğu gibi konabilir */
    a.download = (baseName() || 'devlet') + (cfg.plainName ? '' : '-' + cfg.suffix) + '.' + ext;
    document.body.appendChild(a); a.click(); a.remove();
  });
  paintPath(); paintPreview();
}

/* ── Tekrarlayan satır düzenleyicisi (tarihçe, dış ilişkiler) ── */
function repHTML(key, rowsHTML, addLabel) {
  return '<div class="rep" id="rep-' + key + '"><div class="rep-rows">' + rowsHTML + '</div>' +
    '<button type="button" class="abtn sm rep-add">+ ' + esc(addLabel) + '</button></div>';
}
function bindRepeater(key, newRow) {
  const root = $('#rep-' + key);
  if (!root) return;
  root.addEventListener('click', e => {
    if (e.target.closest('.rep-add')) {
      root.querySelector('.rep-rows').insertAdjacentHTML('beforeend', newRow());
      const rows = root.querySelectorAll('.rep-row');
      const first = rows[rows.length - 1].querySelector('input, select, textarea');
      if (first) first.focus();
      return;
    }
    const rmBtn = e.target.closest('.rep-rm');
    if (rmBtn) rmBtn.closest('.rep-row').remove();
  });
}
function selectHTML(cls, options, selected) {
  return '<select class="f-select ' + cls + '">' + options.map(o =>
    '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(selected) ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>';
}
function kgHistRow(h) {
  h = h || {};
  const text = h.text != null ? asBi(h.text) : bi(h.tr, h.en);
  return '<div class="rep-row">' +
    '<div class="rep-top"><input class="f-input rp-year" placeholder="KS 1144" value="' + esc(h.year || '') + '">' +
    selectHTML('rp-type', KG_HIST_TYPES, h.type || '') +
    '<button type="button" class="abtn sm danger rep-rm" aria-label="Satırı sil">✕</button></div>' +
    '<div class="bi-pair">' +
    '<textarea class="f-area rp-tr" placeholder="Türkçe">' + esc(text.tr) + '</textarea>' +
    '<textarea class="f-area rp-en" placeholder="English (boş bırakılabilir)">' + esc(text.en) + '</textarea>' +
    '</div></div>';
}
function kgRelRow(otherOptions, id, tr, en) {
  return '<div class="rep-row">' +
    '<div class="rep-top">' + selectHTML('rp-kid', otherOptions, id || '') +
    '<button type="button" class="abtn sm danger rep-rm" aria-label="Satırı sil">✕</button></div>' +
    '<div class="bi-pair">' +
    '<input class="f-input rp-tr" placeholder="Türkçe (ör. Aktif düşmanlık)" value="' + esc(tr || '') + '">' +
    '<input class="f-input rp-en" placeholder="English (boş bırakılabilir)" value="' + esc(en || '') + '">' +
    '</div></div>';
}

function openKingdomEditor(index) {
  const isNew = index === null;
  const k = isNew
    ? { id: '', type: 'kingdom', status: 'active', name: bi(), capital: bi(), ruler: bi(), rulerTitle: bi('Hükümdar', 'Ruler'), rulerId: null,
        founded: '', government: null, population: { official: null, actual: null }, area: '', currency: '', religion: bi(),
        color: '#B87333', flag: bi(), flagImage: '', regionMap: '', desc: bi(),
        strengths: { tr: [], en: [] }, weaknesses: { tr: [], en: [] }, garrison: { tr: [], en: [] }, exports: { tr: [], en: [] },
        history: [], relations: { tr: {}, en: {} } }
    : JSON.parse(JSON.stringify(kingdomList()[index]));
  editing = { kind: 'kingdom', index };

  const img = { flag: k.flagImage || '', map: k.regionMap || '' };
  const secH = t => '<div class="f-sec">' + esc(t) + '</div>';
  const linesHint = t => '<div class="f-hint" style="margin-top:-.6rem;margin-bottom:1rem">' + esc(t) + '</div>';

  /* Hükümdar karakteri: karakter kaydı yoksa mevcut değeri kaybetme */
  const charOpts = [['', '— bağlantı yok —']].concat(charList().map(c => [c.id, biVal(c.name)]));
  if (k.rulerId && !charOpts.some(o => o[0] === k.rulerId)) charOpts.push([k.rulerId, k.rulerId + ' (karakter kaydı yok)']);

  /* Dış ilişki hedefleri: kendisi hariç tüm devletler */
  const relOpts = kingdomList().filter(o => o.id !== k.id).map(o => [o.id, biVal(o.name)]);
  const relTr = (k.relations && k.relations.tr) || {}, relEn = (k.relations && k.relations.en) || {};
  const relIds = Object.keys(relTr).concat(Object.keys(relEn).filter(x => !(x in relTr)));
  relIds.forEach(id => { if (!relOpts.some(o => o[0] === id)) relOpts.push([id, id]); });
  const relOptsWithEmpty = [['', '— devlet seçin —']].concat(relOpts);

  const baseName = () => k.id || slugify(($('#f-name-tr') || {}).value || '') || 'devlet';

  drawer(isNew ? 'Yeni Devlet' : 'Devleti Düzenle',
    secH('Kimlik') +
    biField('Devlet Adı', 'name', asBi(k.name), true) +
    '<div class="f-row half">' +
      selectField('Tür', 'type', KG_TYPES, k.type) +
      selectField('Durum', 'status', KG_STATUSES, k.status) +
    '</div>' +
    '<div class="f-row half">' +
      textField('Vurgu Rengi (hex)', 'color', k.color || '', 'Sayfa kenarlıkları ve haneler sayfasındaki şerit için.') +
      textField('Kuruluş', 'founded', k.founded || '', 'Ör. KS 1144') +
    '</div>' +

    secH('Bayrak & Sancak') +
    kgImgFieldHTML('flag') +
    biField('Bayrağın Kanonik Tarifi', 'flag', asBi(k.flag), false, true) +

    secH('Sicil (Wiki Infobox)') +
    biField('Başkent', 'capital', asBi(k.capital)) +
    biField('Yönetim Biçimi', 'government', asBi(k.government)) +
    biField('Hükümdar Unvanı Etiketi', 'rulerTitle', asBi(k.rulerTitle)) +
    linesHint('Sicil kutusundaki satır başlığı: Hükümdar, Melik, Han, Kral, Konsey…') +
    biField('Hükümdar', 'ruler', asBi(k.ruler)) +
    selectField('Hükümdar Karakter Bağlantısı', 'rulerId', charOpts, k.rulerId || '') +
    '<div class="f-row half">' +
      textField('Nüfus (Resmî)', 'pop-official', k.population && k.population.official != null ? String(k.population.official) : '', 'Sayı — noktasız yazın.') +
      textField('Nüfus (Fiilî)', 'pop-actual', k.population && k.population.actual != null ? String(k.population.actual) : '', 'Kayıt dışı / gerçek tahmin.') +
    '</div>' +
    '<div class="f-row half">' +
      textField('Yüzölçümü', 'area', k.area || '', 'Ör. 1.240.000 km²') +
      textField('Para Birimi', 'currency', k.currency || '', 'Ör. Altın Sancak') +
    '</div>' +
    biField('Resmî Din', 'religion', asBi(k.religion)) +

    secH('Genel Bakış') +
    biField('Açıklama', 'desc', asBi(k.desc), false, true) +

    secH('Tarihçe & Kronoloji') +
    '<div class="f-hint" style="margin-bottom:.6rem">Kuruluş, büyük savaşlar ve anlaşmalar. Satırlar sayfada yazdığınız sırayla görünür.</div>' +
    repHTML('history', (k.history || []).map(kgHistRow).join(''), 'Olay Ekle') +

    secH('Bölgesel Harita') +
    kgImgFieldHTML('map') +

    secH('Askerî & İktisadi Güç') +
    biField('Güçlü Yönler', 'strengths', { tr: kgLines(k.strengths, 'tr'), en: kgLines(k.strengths, 'en') }, false, true) +
    biField('Zayıf Yönler', 'weaknesses', { tr: kgLines(k.weaknesses, 'tr'), en: kgLines(k.weaknesses, 'en') }, false, true) +
    biField('Garnizon & Ordu', 'garrison', { tr: kgLines(k.garrison, 'tr'), en: kgLines(k.garrison, 'en') }, false, true) +
    biField('İhraç Ürünleri & Madenler', 'exports', { tr: kgLines(k.exports, 'tr'), en: kgLines(k.exports, 'en') }, false, true) +
    linesHint('Dört kutuda da her satır ayrı bir madde olur.') +

    secH('Dış İlişkiler') +
    repHTML('relations', relIds.map(id => kgRelRow(relOptsWithEmpty, id, relTr[id], relEn[id])).join(''), 'İlişki Ekle'),

    () => {
      const name = readBi('name');
      if (isEmptyBi(name)) return 'Devlet adı zorunludur.';
      const color = $('#f-color').value.trim();
      if (color && !/^#[0-9a-f]{3,8}$/i.test(color)) return 'Renk #RRGGBB biçiminde olmalı.';
      const toNum = v => { const n = parseInt(String(v).replace(/[^\d]/g, ''), 10); return isNaN(n) ? null : n; };
      const toLines = key => { const o = readBi(key); return { tr: kgSplit(o.tr), en: kgSplit(o.en) }; };
      const gov = readBi('government');

      const history = $$('#rep-history .rep-row').map(r => {
        const year = r.querySelector('.rp-year').value.trim();
        const type = r.querySelector('.rp-type').value;
        const text = bi(r.querySelector('.rp-tr').value, r.querySelector('.rp-en').value);
        if (!year && isEmptyBi(text)) return null;
        const rec = { year, text };
        if (type) rec.type = type;
        return rec;
      }).filter(Boolean);

      const relations = { tr: {}, en: {} };
      $$('#rep-relations .rep-row').forEach(r => {
        const id = r.querySelector('.rp-kid').value;
        const tr = r.querySelector('.rp-tr').value.trim(), en = r.querySelector('.rp-en').value.trim();
        if (!id || (!tr && !en)) return;
        relations.tr[id] = tr || en;
        if (en) relations.en[id] = en;
      });

      const id = k.id || uniqueId(slugify(name.tr || name.en), kingdomList().map(x => x.id));
      const rec = Object.assign({}, k, {
        id,
        type: $('#f-type').value,
        status: $('#f-status').value,
        name,
        capital: readBi('capital'),
        ruler: readBi('ruler'),
        rulerTitle: readBi('rulerTitle'),
        rulerId: $('#f-rulerId').value || null,
        founded: $('#f-founded').value.trim() || null,
        government: isEmptyBi(gov) ? null : gov,
        population: { official: toNum($('#f-pop-official').value), actual: toNum($('#f-pop-actual').value) },
        area: $('#f-area').value.trim() || null,
        currency: $('#f-currency').value.trim() || null,
        religion: readBi('religion'),
        color: color || '#B87333',
        flag: readBi('flag'),
        desc: readBi('desc'),
        strengths: toLines('strengths'),
        weaknesses: toLines('weaknesses'),
        garrison: toLines('garrison'),
        exports: toLines('exports'),
        history,
        relations
      });
      if (img.flag) rec.flagImage = img.flag; else delete rec.flagImage;
      if (img.map) rec.regionMap = img.map; else delete rec.regionMap;

      /* Depolama dolarsa bellekteki listeyi eski hâline döndür */
      const before = kingdomList().slice();
      if (isNew) kingdomList().push(rec); else kingdomList()[index] = rec;
      if (!save('kingdoms.json')) {
        DB['kingdoms.json'].kingdoms = before;
        return 'Kaydedilemedi — tarayıcı depolama sınırı aşılmış olabilir. Yüklenen görselleri kaldırıp depo yolu kullanmayı deneyin.';
      }
      toast(isNew ? 'Devlet eklendi.' : 'Devlet güncellendi.');
      renderKingdoms();
      return null;
    });

  bindKgImg('flag', img, baseName);
  bindKgImg('map', img, baseName);
  bindRepeater('history', () => kgHistRow());
  bindRepeater('relations', () => kgRelRow(relOptsWithEmpty, '', '', ''));
}

/* ═══════════════════════════════════════════════════════════
   SOY AĞAÇLARI (familytree.json)
   ---------------------------------------------------------------
   Liste → Editör. Editör iki bölmelidir: solda kişiler / ağaç
   ayarları, sağda canlı önizleme (soy-agaci.html ile aynı motor,
   assets/js/familytree.js). Her değişiklik önizlemeye anında yansır;
   "Kaydet" ile yerel taslağa yazılır (diğer modüllerle aynı akış).

   İki çizim modu:
     · auto   — kutular kuşak + akrabalıklara göre yerleşir, çizgiler
                ilişkilerden üretilir; kutular sürüklenerek elle
                düzeltilebilir (dx/dy ofseti).
     · manual — mevcut (elle çizilmiş) ağaçlar birebir korunur; istenirse
                "Otomatik yerleşime geç" ile dönüştürülür.
   ═══════════════════════════════════════════════════════════ */
const TE = { idx: null, work: null, dirty: false, sel: null, tab: 'people', lang: 'tr', q: '', pz: null, press: null, raf: 0, boxes: {}, ox: 0, oy: 0 };
const TE_THEMES = [['imperial', 'Altın (İmparatorluk)'], ['selya', 'Mor (Selya)'], ['custom', 'Özel renk']];
const TE_KIND_OPTS = () => FamilyTree.KINDS.map(k => [k[0], k[1].tr]);
const TE_STATUS_OPTS = [['', 'Belirtilmemiş']].concat(STATUSES);

function treeData() {
  const d = DB['familytree.json'];
  if (!d.trees) d.trees = [];
  return d.trees;
}

/* ── Liste ─────────────────────────────────────────────── */
function renderTrees() {
  if (TE.work) { renderTreeEditor(); return; }
  const addBtn = $('#add-btn'); if (addBtn) addBtn.style.display = '';
  const list = treeData().map((t, i) => ({ t, i })).sort((a, b) => (a.t.order || 0) - (b.t.order || 0));
  $('#view').innerHTML =
    '<div class="notice">Her hane için ayrı bir soy ağacı sekmesi oluşur (<code>soy-agaci.html</code>). ' +
    '<strong>Düzenle</strong> ile kişileri, akrabalık bağlarını (baba, anne, eş, çocuk, kuşak), meşruiyet çizgilerini ve renk temasını yönetirsiniz; ' +
    'değişiklikler canlı önizlenir.</div>' +
    (list.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      '<th>Ağaç</th><th>Yerleşim</th><th>Kişi</th><th>Sıra</th><th></th></tr></thead><tbody>' +
      list.map(r => {
        const t = r.t;
        return '<tr><td><div class="cell-name"><span class="te-dot" style="background:' + esc(t.accent || '#C4962A') + '"></span>' + esc(biVal(t.name)) + '</div>' +
          '<div class="cell-sub">' + esc(t.id) + '</div></td>' +
          '<td><span class="pill neutral">' + (t.edgeMode === 'manual' ? 'Elle çizilmiş' : 'Otomatik') + '</span></td>' +
          '<td style="font-size:.8rem;color:var(--parchd)">' + (t.people || []).length + '</td>' +
          '<td style="font-size:.8rem;color:var(--parchd)">' + (t.order || '—') + '</td>' +
          '<td><div class="cell-acts">' +
          '<a class="abtn sm" href="' + SWRoute.href('soy-agaci', t.id) + '" target="_blank" rel="noopener">Sayfa ↗</a>' +
          '<button class="abtn sm" data-tree-edit="' + r.i + '">Düzenle</button>' +
          '<button class="abtn sm danger" data-tree-del="' + r.i + '">Sil</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<div class="empty-a">Henüz soy ağacı yok. “+ Yeni Ekle” ile başlayın.</div>');
}

/* Liste tıklamaları — bindRowActions içinden çağrılır */
function handleTreeClick(e) {
  const ed = e.target.closest('[data-tree-edit]');
  if (ed) { openTreeEditor(+ed.dataset.treeEdit); return true; }
  const del = e.target.closest('[data-tree-del]');
  if (del) {
    const i = +del.dataset.treeDel, t = treeData()[i];
    if (!t) return true;
    confirmBox('Soy ağacını sil', '"' + biVal(t.name) + '" ağacı ve içindeki ' + (t.people || []).length + ' kişi kaydı kalıcı olarak silinecek.', () => {
      treeData().splice(i, 1);
      if (save('familytree.json')) { toast('Soy ağacı silindi.'); renderTrees(); }
    });
    return true;
  }
  return false;
}

function openTreeCreate() {
  const houseOpts = [['', '— bağlantı yok —']].concat(flatHouseList().map(r => [r.house.id, r.house.name]));
  editing = { kind: 'tree', index: null };
  drawer('Yeni Soy Ağacı',
    biField('Ağaç Adı', 'tname', bi(), true) +
    selectField('Bağlı Hane (opsiyonel)', 'thouse', houseOpts, '') +
    selectField('Renk Teması', 'ttheme', TE_THEMES, 'custom') +
    textField('Vurgu Rengi (hex)', 'taccent', '#B08A2E', 'Tema “Özel renk” ise kutuların ve çizgilerin rengi bundan türetilir.'),
    () => {
      const name = readBi('tname');
      if (isEmptyBi(name)) return 'Ağaç adı zorunludur.';
      const accent = $('#f-taccent').value.trim();
      if (!/^#[0-9a-f]{3,8}$/i.test(accent)) return 'Renk #RRGGBB biçiminde olmalı.';
      const trees = treeData();
      const t = {
        id: uniqueId(slugify(name.tr || name.en), trees.map(x => x.id)),
        order: trees.reduce((m, x) => Math.max(m, x.order || 0), 0) + 1,
        name, houseId: $('#f-thouse').value, theme: $('#f-ttheme').value, accent,
        edgeMode: 'auto', canvas: { w: 0, h: 0 }, caption: null, decor: { before: [], after: [] }, people: []
      };
      trees.push(t);
      if (!save('familytree.json')) { trees.pop(); return 'Kaydedilemedi.'; }
      toast('Soy ağacı oluşturuldu.');
      openTreeEditor(trees.length - 1);
      return null;
    });
}

/* ── Editör ────────────────────────────────────────────── */
function openTreeEditor(idx) {
  const t = treeData()[idx];
  if (!t) return;
  TE.idx = idx;
  TE.work = FamilyTree.normalize(JSON.parse(JSON.stringify(t)));
  TE.dirty = false; TE.sel = null; TE.tab = 'people'; TE.q = '';
  renderTreeEditor();
}

function teLeaveEditor() {
  TE.work = null; TE.dirty = false; TE.sel = null; TE.pz = null;
  go('trees');
}

function renderTreeEditor() {
  const t = TE.work;
  const addBtn = $('#add-btn'); if (addBtn) addBtn.style.display = 'none';
  $('#view').innerHTML =
    '<div class="te-bar">' +
      '<button class="abtn sm" id="te-back" type="button">← Ağaçlar</button>' +
      '<div class="te-title"><span class="te-dot" style="background:' + esc(t.accent) + '"></span>' + esc(biVal(t.name)) + '</div>' +
      '<span class="te-dirty" id="te-dirty"></span>' +
      '<div class="te-bar-r">' +
        '<div class="te-langsw"><button type="button" data-lang="tr" class="' + (TE.lang === 'tr' ? 'on' : '') + '">TR</button><button type="button" data-lang="en" class="' + (TE.lang === 'en' ? 'on' : '') + '">EN</button></div>' +
        '<a class="abtn sm" href="' + SWRoute.href('soy-agaci', t.id) + '" target="_blank" rel="noopener">Sayfada aç ↗</a>' +
        '<button class="abtn sm" id="te-revert" type="button">Değişiklikleri at</button>' +
        '<button class="abtn primary" id="te-save" type="button">Kaydet</button>' +
      '</div>' +
    '</div>' +
    '<div class="te-grid">' +
      '<div class="te-left" id="te-left"></div>' +
      '<div class="te-right">' +
        '<div class="ft-view te-view" id="te-view"><div class="ft-stage" id="te-stage"></div>' +
          '<div class="ft-tools"><button class="ft-btn" data-z="in" type="button">+</button><button class="ft-btn" data-z="out" type="button">−</button><button class="ft-btn" data-z="fit" type="button" title="Sığdır">⤢</button></div>' +
          '<div class="te-hint" id="te-hint"></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  const view = $('#te-view'), stage = $('#te-stage');
  TE.pz = FamilyTree.panzoom(view, stage, { ignore: e => TE.work.edgeMode === 'auto' && !!e.target.closest('.fn') || !!e.target.closest('.ft-tools') });

  $('#te-back').onclick = () => {
    if (TE.dirty) confirmBox('Kaydedilmemiş değişiklik', 'Değişiklikler kaydedilmedi. Yine de listeye dönülsün mü?', teLeaveEditor);
    else teLeaveEditor();
  };
  $('#te-save').onclick = teSave;
  $('#te-revert').onclick = () => {
    if (!TE.dirty) { toast('Atılacak değişiklik yok.'); return; }
    confirmBox('Değişiklikleri at', 'Son kaydedilen hâline dönülecek.', () => {
      const cur = TE.sel;
      TE.work = FamilyTree.normalize(JSON.parse(JSON.stringify(treeData()[TE.idx])));
      TE.dirty = false; if (!TE.work.people.some(p => p.id === cur)) TE.sel = null;
      renderTreeEditor();
    });
  };
  $$('.te-langsw button').forEach(b => b.onclick = () => { TE.lang = b.dataset.lang; $$('.te-langsw button').forEach(x => x.classList.toggle('on', x === b)); teRefresh(); });
  $$('.ft-tools .ft-btn').forEach(b => b.onclick = () => {
    if (b.dataset.z === 'in') TE.pz.zoomBy(1.25); else if (b.dataset.z === 'out') TE.pz.zoomBy(0.8); else TE.pz.fit();
  });

  /* Sürükle-bırak (yalnızca otomatik mod) + seçim */
  view.addEventListener('pointerdown', e => {
    const n = e.target.closest('.fn');
    if (!n || (e.button != null && e.button > 0)) return;
    const p = TE.work.people.find(x => x.id === n.dataset.id); if (!p) return;
    TE.press = { id: p.id, sx: e.clientX, sy: e.clientY, dx0: p.dx || 0, dy0: p.dy || 0, moved: false, auto: TE.work.edgeMode === 'auto' };
    if (TE.press.auto && TE.sel !== p.id) teSelect(p.id);
  });
  view.addEventListener('click', e => {
    const n = e.target.closest('.fn');
    if (n && TE.sel !== n.dataset.id) teSelect(n.dataset.id);
  });

  teBindLeft($('#te-left'));
  renderTeLeft();
  teRefresh();
  TE.pz.fit();
  teStatus();
}

function teStatus() {
  const el = $('#te-dirty'); if (!el) return;
  el.textContent = TE.dirty ? '● Kaydedilmemiş değişiklik' : '';
  const sv = $('#te-save'); if (sv) sv.classList.toggle('primary', TE.dirty);
  const hint = $('#te-hint');
  if (hint) hint.textContent = !TE.work.people.length ? 'Henüz kişi yok — soldan “Kişi Ekle” ile başlayın.'
    : (TE.work.edgeMode === 'auto' ? 'Kutuya tıkla: seç · Sürükle: konumu elle düzelt · Tekerlek: yakınlaştır' : 'Elle çizilmiş ağaç · Kutuya tıkla: seç · Tekerlek: yakınlaştır');
}
function teDirty() { TE.dirty = true; teStatus(); }

function teRefresh() {
  const stage = $('#te-stage'); if (!stage || !TE.work) return;
  const r = FamilyTree.render(TE.work, { lang: TE.lang, selectedId: TE.sel });
  stage.innerHTML = r.svg;
  TE.boxes = r.boxes; TE.ox = r.ox || 0; TE.oy = r.oy || 0;
  TE.pz.setSize(r.w, r.h);
}
function teSchedule() {
  if (TE.raf) return;
  TE.raf = requestAnimationFrame(() => { TE.raf = 0; teRefresh(); });
}

function teSave() {
  const trees = treeData();
  const before = JSON.stringify(trees);
  const clone = JSON.parse(JSON.stringify(TE.work));
  trees[TE.idx] = clone;
  if (!save('familytree.json')) {
    DB['familytree.json'].trees = JSON.parse(before);
    return;
  }
  TE.dirty = false; teStatus();
  toast('Soy ağacı kaydedildi.');
}

function teSelect(id, center) {
  TE.sel = id; TE.tab = 'people';
  renderTeLeft(); teRefresh();
  if (center && TE.boxes[id]) {
    const b = TE.boxes[id];
    TE.pz.centerOn({ x: b.x - TE.ox, y: b.y - TE.oy, w: b.w, h: b.h });
  }
}

/* Sürükleme (pencere düzeyinde) */
function teBindDrag() {
  window.addEventListener('pointermove', e => {
    const pr = TE.press;
    if (!pr || !pr.auto || !TE.work) return;
    const k = TE.pz ? TE.pz.state.k : 1;
    const mx = e.clientX - pr.sx, my = e.clientY - pr.sy;
    if (!pr.moved && Math.hypot(mx, my) < 4) return;
    pr.moved = true;
    const p = TE.work.people.find(x => x.id === pr.id); if (!p) return;
    p.dx = Math.round(pr.dx0 + mx / k); p.dy = Math.round(pr.dy0 + my / k);
    teDirty(); teSchedule();
    const l = $('#te-left');
    if (l) { const a = l.querySelector('[data-f="dx"]'), b = l.querySelector('[data-f="dy"]'); if (a) a.value = p.dx; if (b) b.value = p.dy; }
  });
  window.addEventListener('pointerup', () => { TE.press = null; });
}

/* ── Sol bölme ─────────────────────────────────────────── */
function teBy(id) { return TE.work.people.find(p => p.id === id); }
function teName(p) { return FamilyTree.tx('tr', p.box.name) || FamilyTree.tx('tr', p.name) || p.id; }
function teGet(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
function teSet(obj, path, val) {
  const ks = path.split('.'); let o = obj;
  for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null || typeof o[ks[i]] !== 'object') o[ks[i]] = {}; o = o[ks[i]]; }
  o[ks[ks.length - 1]] = val;
}
function teDescendants(id) {
  const g = FamilyTree.graph(TE.work), out = new Set(), st = [id];
  while (st.length) { const x = st.pop(); (g.children[x] || []).forEach(c => { if (!out.has(c)) { out.add(c); st.push(c); } }); }
  return out;
}
function teAncestors(id) {
  const g = FamilyTree.graph(TE.work), out = new Set(), st = [id];
  while (st.length) { const x = st.pop(); (g.parents[x] || []).forEach(c => { if (!out.has(c)) { out.add(c); st.push(c); } }); }
  return out;
}

function renderTeLeft() {
  const left = $('#te-left'); if (!left) return;
  const tabs = '<div class="te-tabs"><button type="button" data-tab="people" class="' + (TE.tab === 'people' ? 'on' : '') + '">Kişiler (' + TE.work.people.length + ')</button>' +
    '<button type="button" data-tab="settings" class="' + (TE.tab === 'settings' ? 'on' : '') + '">Ağaç Ayarları</button></div>';
  let body;
  if (TE.tab === 'settings') body = teSettingsHTML();
  else if (TE.sel && teBy(TE.sel)) body = tePersonHTML(teBy(TE.sel));
  else body = teListHTML();
  left.innerHTML = tabs + '<div class="te-pane">' + body + '</div>';
  const q = left.querySelector('#te-q');
  if (q) q.addEventListener('input', () => {
    TE.q = q.value; const pos = q.selectionStart;
    renderTeLeft(); const again = $('#te-q'); if (again) { again.focus(); again.setSelectionRange(pos, pos); }
  });
}

function teListHTML() {
  const q = TE.q.toLowerCase();
  const items = TE.work.people.filter(p => !q || teName(p).toLowerCase().indexOf(q) >= 0);
  return '<div class="te-list-tools">' +
    '<input class="f-input" id="te-q" placeholder="Kişi ara…" value="' + esc(TE.q) + '">' +
    '<button class="abtn sm primary" data-act="add-person" type="button">+ Kişi Ekle</button>' +
    '<button class="abtn sm" data-act="add-chars" type="button">Karakterlerden Ekle</button></div>' +
    (TE.work.edgeMode === 'manual' ? '<div class="notice warn" style="margin-top:.75rem">Bu ağaç <strong>elle çizilmiş</strong> hâliyle korunuyor: kutu konumları ve bağlantı çizgileri sabittir. ' +
      'Metinleri düzenleyebilirsiniz; bağlantıları ilişkilerden otomatik çizmek için <strong>Ağaç Ayarları → Otomatik yerleşime geç</strong>.</div>' : '') +
    (items.length ? '<div class="te-list">' + items.map(p =>
      '<button type="button" class="te-item' + (p.id === TE.sel ? ' on' : '') + '" data-pick="' + esc(p.id) + '">' +
      '<span class="te-item-n">' + esc(teName(p)) + '</span>' +
      '<span class="te-item-s">' + esc((FamilyTree.KINDS.find(k => k[0] === p.kind) || [0, { tr: p.kind }])[1].tr) +
      (isFinite(p.generation) && p.generation !== null ? ' · kuşak ' + p.generation : '') +
      (p.legitimacy === 'legit' ? ' · meşru' : p.legitimacy === 'illegit' ? ' · gayrimeşru' : '') + '</span></button>').join('') + '</div>'
      : '<div class="empty-a" style="padding:1.25rem 0">' + (q ? 'Sonuç yok.' : 'Bu ağaçta henüz kişi yok.') + '</div>');
}

const teF = (label, f, val, ph) => '<div class="f-row"><label class="f-label">' + esc(label) + '</label>' +
  '<input class="f-input" data-f="' + f + '" value="' + esc(val == null ? '' : val) + '" placeholder="' + esc(ph || '') + '"></div>';
function teBi(label, f, o, area) {
  o = o || {};
  const el = (path, v, ph) => area
    ? '<textarea class="f-area" data-f="' + path + '" placeholder="' + ph + '">' + esc(v || '') + '</textarea>'
    : '<input class="f-input" data-f="' + path + '" value="' + esc(v || '') + '" placeholder="' + ph + '">';
  return '<div class="f-row"><label class="f-label">' + esc(label) + '</label><div class="bi-pair">' +
    '<div><span class="bi-tag">Türkçe</span>' + el(f + '.tr', o.tr, 'Türkçe') + '</div>' +
    '<div><span class="bi-tag">English</span>' + el(f + '.en', o.en, 'English (boş bırakılabilir)') + '</div></div></div>';
}
const teSel = (label, f, opts, val, attr) => '<div class="f-row"><label class="f-label">' + esc(label) + '</label>' +
  '<select class="f-select" ' + (attr || 'data-f') + '="' + f + '">' +
  opts.map(o => '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val == null ? '' : val) ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select></div>';
const teSec = t => '<div class="f-sec">' + esc(t) + '</div>';

function tePersonHTML(p) {
  const t = TE.work, g = FamilyTree.graph(t);
  const desc = teDescendants(p.id), anc = teAncestors(p.id);
  const parentOpts = [['', '— yok —']].concat(t.people.filter(x => x.id !== p.id && !desc.has(x.id)).map(x => [x.id, teName(x)]));
  const others = t.people.filter(x => x.id !== p.id);
  const chips = (key, list) => '<div class="tag-pick">' + (list.length ? list.map(x =>
    '<button type="button" class="tag-opt' + ((p[key] || []).indexOf(x.id) >= 0 ? ' on' : '') + '" data-chip="' + key + '" data-id="' + esc(x.id) + '">' + esc(teName(x)) + '</button>').join('')
    : '<span class="f-hint">Ağaçta başka kişi yok.</span>') + '</div>';
  const charOpts = [['', '— bağlantı yok —']].concat(charList().map(c => [c.id, biVal(c.name)]));
  const extraParents = g.parents[p.id].filter(x => x !== p.fatherId && x !== p.motherId);
  const manual = t.edgeMode === 'manual';
  const linkRows = (p.links || []).map((l, i) =>
    '<div class="rep-row" data-li="' + i + '"><div class="rep-top" style="grid-template-columns:1fr auto">' +
    '<select class="f-select" data-lk="to">' + [['', '— kişi seçin —']].concat(others.map(x => [x.id, teName(x)])).map(o => '<option value="' + esc(o[0]) + '"' + (o[0] === l.to ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>' +
    '<button type="button" class="abtn sm danger" data-act="del-link" aria-label="Sil">✕</button></div>' +
    '<div class="bi-pair"><input class="f-input" data-lk="tr" placeholder="Etiket (ör. Kuzen)" value="' + esc((l.label && l.label.tr) || '') + '">' +
    '<input class="f-input" data-lk="en" placeholder="Label (optional)" value="' + esc((l.label && l.label.en) || '') + '"></div></div>').join('');

  return '<div class="te-person-head"><button class="abtn sm" data-act="back-list" type="button">← Liste</button>' +
    '<span class="te-pid">' + esc(p.id) + '</span></div>' +
    (manual ? '<div class="notice warn">Elle çizilmiş ağaç: akrabalık alanları burada saklanır ve panelde gösterilir, ancak çizgiler ' +
      '<strong>Otomatik yerleşime geç</strong> yapılana kadar değişmez.</div>' : '') +

    teSec('Kimlik') +
    '<div class="f-row"><label class="f-label">Karakter bağlantısı</label><div class="te-inline">' +
      '<select class="f-select" data-f="characterId">' + charOpts.map(o => '<option value="' + esc(o[0]) + '"' + (o[0] === (p.characterId || '') ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>' +
      '<button class="abtn sm" data-act="fill-char" type="button">Boşları doldur</button></div>' +
      '<div class="f-hint">Bağlı karakterin unvanı, lakabı ve biyografisi kutuya tıklanınca açılan kartta görünür (kendi metniniz yoksa).</div></div>' +
    teBi('İsim (kart başlığı)', 'name', p.name) +
    teSel('Kutu stili', 'kind', TE_KIND_OPTS(), p.kind) +
    teSel('Durum', 'status', TE_STATUS_OPTS, p.status) +
    teBi('Unvan', 'title', p.title) +
    teF('Dönem / tarih', 'ks', p.ks, 'KS 1452 – ?') +
    teBi('Lakap / epitet', 'epi', p.epi) +
    teBi('Açıklama', 'desc', p.desc, true) +

    teSec('Kutuda görünen metin') +
    teBi('1. satır (boşsa isim)', 'box.name', p.box.name) +
    teBi('2. satır', 'box.sub', p.box.sub) +
    teBi('3. satır', 'box.note', p.box.note) +

    teSec('Akrabalık') +
    teSel('Baba', 'fatherId', parentOpts, p.fatherId, 'data-rel') +
    teSel('Anne', 'motherId', parentOpts, p.motherId, 'data-rel') +
    (extraParents.length ? '<div class="f-hint" style="margin:-.5rem 0 1rem">Çocuk listesinden gelen ek ebeveyn: ' + esc(extraParents.map(x => teName(g.byId[x])).join(', ')) + '</div>' : '') +
    '<div class="f-row"><label class="f-label">Eşler</label>' + chips('spouseIds', others) + '</div>' +
    '<div class="f-row"><label class="f-label">Çocuklar</label>' + chips('childrenIds', others.filter(x => !anc.has(x.id))) + '</div>' +
    '<div class="f-row"><label class="f-label">Kuşak (satır)</label>' +
      '<input class="f-input" type="number" min="0" step="1" data-f="generation" value="' + (isFinite(p.generation) && p.generation !== null ? p.generation : '') + '" placeholder="otomatik">' +
      '<div class="f-hint">Boş bırakılırsa ebeveynlerinden hesaplanır. 0 = en üst satır.</div></div>' +
    '<div class="f-row"><label class="f-label">Meşruiyet (ebeveynden bu kişiye inen çizgi)</label>' +
      '<div class="te-seg">' +
      '<button type="button" data-legit="" class="' + (!p.legitimacy ? 'on' : '') + '">Belirtilmemiş</button>' +
      '<button type="button" data-legit="legit" class="legit' + (p.legitimacy === 'legit' ? ' on' : '') + '">Meşru Varis</button>' +
      '<button type="button" data-legit="illegit" class="illegit' + (p.legitimacy === 'illegit' ? ' on' : '') + '">Gayrimeşru / Sürgün</button></div>' +
      '<div class="f-hint">Meşru: altın çift çizgi · Gayrimeşru / Sürgün: kan kırmızısı kesikli çizgi.</div></div>' +

    teSec('Konum') +
    (manual
      ? '<div class="f-row half"><div><label class="f-label">x</label><input class="f-input" type="number" data-f="x" value="' + (p.x || 0) + '"></div>' +
        '<div><label class="f-label">y</label><input class="f-input" type="number" data-f="y" value="' + (p.y || 0) + '"></div></div>'
      : '<div class="f-row half"><div><label class="f-label">Yatay kayma (dx)</label><input class="f-input" type="number" data-f="dx" value="' + (p.dx || 0) + '"></div>' +
        '<div><label class="f-label">Dikey kayma (dy)</label><input class="f-input" type="number" data-f="dy" value="' + (p.dy || 0) + '"></div></div>' +
        '<div class="f-hint" style="margin:-.5rem 0 .6rem">Önizlemede kutuyu sürükleyerek de ayarlayabilirsiniz.</div>' +
        '<button class="abtn sm" data-act="reset-pos" type="button">Konumu sıfırla</button>') +

    teSec('Serbest bağlar') +
    '<div class="f-hint" style="margin-bottom:.5rem">Aile ağacına girmeyen bağlar (kuzen, enişte, gizli ilişki…) — kesikli çizgiyle gösterilir.</div>' +
    linkRows + '<button class="abtn sm" data-act="add-link" type="button">+ Bağ Ekle</button>' +

    '<div style="margin-top:2rem;padding-top:1rem;border-top:1px solid var(--border)"><button class="abtn sm danger" data-act="del-person" type="button">Kişiyi sil</button></div>';
}

function teSettingsHTML() {
  const t = TE.work;
  const houseOpts = [['', '— bağlantı yok —']].concat(flatHouseList().map(r => [r.house.id, r.house.name]));
  return teBi('Ağaç adı (sekme başlığı)', 'name', t.name) +
    '<div class="f-row"><label class="f-label">Kimlik</label><div class="te-pid" style="display:inline-block">' + esc(t.id) + '</div>' +
      '<div class="f-hint">Adres: <code>#/soy-agaci/' + esc(t.id) + '</code></div></div>' +
    teSel('Bağlı hane', 'houseId', houseOpts, t.houseId || '', 'data-t') +
    teSel('Renk teması', 'theme', TE_THEMES, t.theme, 'data-t') +
    '<div class="f-row"><label class="f-label">Vurgu rengi</label><div class="te-inline">' +
      '<input type="color" class="te-color" data-t="accentPick" value="' + esc(/^#[0-9a-f]{6}$/i.test(t.accent) ? t.accent : '#c4962a') + '">' +
      '<input class="f-input" data-t="accent" value="' + esc(t.accent) + '"></div>' +
      '<div class="f-hint">Sekmedeki nokta her temada bu renkle çizilir; kutu ve çizgi renkleri yalnızca “Özel renk” temasında bundan türetilir.</div></div>' +
    '<div class="f-row"><label class="f-label">Sekme sırası</label><input class="f-input" type="number" data-t="order" value="' + (t.order || 1) + '"></div>' +
    teBi('Alt başlık (boşsa otomatik)', 'caption', t.caption || { tr: '', en: '' }).replace(/data-f=/g, 'data-t=') +
    teSec('Yerleşim') +
    (t.edgeMode === 'manual'
      ? '<div class="notice warn">Bu ağaç <strong>elle çizilmiş</strong> hâliyle korunuyor. Otomatik yerleşime geçince çizgiler ve kutular akrabalık bilgisinden yeniden üretilir; ' +
        'elle çizilen bağlantı çizgileri, notlar ve gösterge kaldırılır. Kaydedene kadar “Değişiklikleri at” ile geri dönebilirsiniz.</div>' +
        '<button class="abtn primary" data-act="to-auto" type="button">Otomatik yerleşime geç</button>'
      : '<div class="f-hint" style="margin-bottom:.6rem">Kutular kuşak ve akrabalık bağlarına göre otomatik yerleşir; sürüklenerek düzeltilebilir.</div>' +
        '<button class="abtn sm" data-act="reset-all-pos" type="button">Tüm elle düzeltmeleri sıfırla</button>');
}

/* Sol bölmedeki tüm etkileşim tek delegasyonla, editör açılırken BİR KEZ bağlanır. */
function teBindLeft(left) {
  left.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.f !== undefined && TE.tab === 'people' && TE.sel) teApplyField(el);
    else if (el.dataset.t !== undefined) teApplyTree(el);
    else if (el.dataset.lk !== undefined) teApplyLink(el);
  });
  left.addEventListener('change', e => {
    const el = e.target;
    if (el.dataset.rel) { teApplyParent(el); return; }
    if (el.dataset.t !== undefined && el.tagName === 'SELECT') teApplyTree(el);
  });
  left.addEventListener('click', e => {
    const tab = e.target.closest('[data-tab]');
    if (tab) { TE.tab = tab.dataset.tab; renderTeLeft(); return; }
    const pick = e.target.closest('[data-pick]');
    if (pick) { teSelect(pick.dataset.pick, true); return; }
    const chip = e.target.closest('[data-chip]');
    if (chip) { teToggleChip(chip.dataset.chip, chip.dataset.id); return; }
    const lg = e.target.closest('[data-legit]');
    if (lg && TE.sel) { teBy(TE.sel).legitimacy = lg.dataset.legit; teDirty(); renderTeLeft(); teRefresh(); return; }
    const act = e.target.closest('[data-act]');
    if (act) teAct(act.dataset.act, act);
  });
}

function teApplyField(el) {
  const p = teBy(TE.sel); if (!p) return;
  const f = el.dataset.f;
  let v = el.value;
  if (el.type === 'number') {
    if (f === 'generation') v = v === '' ? null : Math.max(0, parseInt(v, 10) || 0);
    else v = parseFloat(v) || 0;
  }
  teSet(p, f, v);
  if (f === 'kind' || f === 'status') { /* önizleme yeterli */ }
  teDirty(); teSchedule();
}
function teApplyLink(el) {
  const p = teBy(TE.sel); if (!p) return;
  const row = el.closest('[data-li]'); if (!row) return;
  const l = p.links[+row.dataset.li]; if (!l) return;
  if (el.dataset.lk === 'to') l.to = el.value;
  else { l.label = l.label || { tr: '', en: '' }; l.label[el.dataset.lk] = el.value; }
  teDirty(); teSchedule();
}
function teApplyTree(el) {
  const t = TE.work, f = el.dataset.t;
  if (f === 'accentPick') { t.accent = el.value; const txt = $('#te-left [data-t="accent"]'); if (txt) txt.value = el.value; }
  else if (f === 'accent') { if (!/^#[0-9a-f]{3,8}$/i.test(el.value.trim())) return; t.accent = el.value.trim(); if (/^#[0-9a-f]{6}$/i.test(t.accent)) { const pk = $('#te-left [data-t="accentPick"]'); if (pk) pk.value = t.accent; } }
  else if (f === 'order') t.order = parseInt(el.value, 10) || 1;
  else if (f.indexOf('name.') === 0 || f.indexOf('caption.') === 0) {
    teSet(t, f, el.value);
    if (f.indexOf('caption.') === 0 && !t.caption.tr && !t.caption.en) t.caption = null;
  } else t[f] = el.value;
  if (f.indexOf('name.') === 0) { const tt = $('.te-title'); if (tt) tt.innerHTML = '<span class="te-dot" style="background:' + esc(t.accent) + '"></span>' + esc(biVal(t.name)); }
  teDirty(); teSchedule();
}

/* Akrabalık eşitleme ------------------------------------------------ */
function teApplyParent(el) {
  const p = teBy(TE.sel); if (!p) return;
  const key = el.dataset.rel, nid = el.value || null, old = p[key];
  if (old === nid) return;
  if (old) { const o = teBy(old); if (o) o.childrenIds = o.childrenIds.filter(x => x !== p.id); }
  p[key] = nid;
  if (nid) { const n = teBy(nid); if (n && n.childrenIds.indexOf(p.id) < 0) n.childrenIds.push(p.id); }
  teDirty(); renderTeLeft(); teRefresh();
}
function teToggleChip(key, id) {
  const p = teBy(TE.sel), o = teBy(id); if (!p || !o) return;
  const on = p[key].indexOf(id) < 0;
  if (key === 'spouseIds') {
    if (on) { p.spouseIds.push(id); if (o.spouseIds.indexOf(p.id) < 0) o.spouseIds.push(p.id); }
    else { p.spouseIds = p.spouseIds.filter(x => x !== id); o.spouseIds = o.spouseIds.filter(x => x !== p.id); }
  } else {
    if (on) p.childrenIds.push(id);
    else {
      p.childrenIds = p.childrenIds.filter(x => x !== id);
      if (o.fatherId === p.id) o.fatherId = null;
      if (o.motherId === p.id) o.motherId = null;
    }
  }
  teDirty(); renderTeLeft(); teRefresh();
}

function teNewPerson(base) {
  const t = TE.work;
  const p = {
    id: uniqueId(slugify(base || 'yeni-kisi'), t.people.map(x => x.id)),
    kind: 'member', characterId: '', name: { tr: '', en: '' }, box: { name: { tr: '', en: '' }, sub: { tr: '', en: '' }, note: { tr: '', en: '' } },
    family: { tr: biVal(t.name), en: (t.name && t.name.en) || biVal(t.name) }, title: { tr: '', en: '' }, ks: '', status: '', epi: { tr: '', en: '' }, desc: { tr: '', en: '' },
    fatherId: null, motherId: null, spouseIds: [], childrenIds: [], generation: null, legitimacy: '', dx: 0, dy: 0, links: []
  };
  if (t.edgeMode === 'manual') { p.x = 20; p.y = 20; }
  t.people.push(p);
  return p;
}
function teFillFromChar(p, ch) {
  const setIfEmpty = (path, v) => { if (isEmptyBi(teGet(p, path)) && v && !isEmptyBi(v)) teSet(p, path, { tr: v.tr || '', en: v.en || '' }); };
  p.characterId = ch.id;
  setIfEmpty('name', ch.name); setIfEmpty('title', ch.title); setIfEmpty('epi', ch.epi);
  setIfEmpty('box.name', ch.name); setIfEmpty('box.sub', ch.title); setIfEmpty('box.note', ch.epi);
  if (!p.status && ch.status) p.status = ch.status;
  if (p.kind === 'member') p.kind = ch.status === 'deceased' ? 'dec' : ch.status === 'historical' ? 'hist' : 'member';
}

function teAct(act, btn) {
  const t = TE.work, p = TE.sel ? teBy(TE.sel) : null;
  if (act === 'back-list') { TE.sel = null; renderTeLeft(); teRefresh(); return; }
  if (act === 'add-person') {
    const np = teNewPerson('yeni-kisi'); np.name = { tr: 'Yeni Kişi', en: 'New Person' }; np.box.name = { tr: 'Yeni Kişi', en: 'New Person' };
    teDirty(); teSelect(np.id, true); return;
  }
  if (act === 'add-chars') { teAddFromChars(); return; }
  if (act === 'fill-char' && p) {
    const ch = charList().find(c => c.id === p.characterId);
    if (!ch) { toast('Önce bir karakter seçin.', true); return; }
    teFillFromChar(p, ch); teDirty(); renderTeLeft(); teRefresh(); toast('Boş alanlar karakterden dolduruldu.'); return;
  }
  if (act === 'reset-pos' && p) { p.dx = 0; p.dy = 0; teDirty(); renderTeLeft(); teRefresh(); return; }
  if (act === 'reset-all-pos') { t.people.forEach(x => { x.dx = 0; x.dy = 0; }); teDirty(); teRefresh(); toast('Elle düzeltmeler sıfırlandı.'); return; }
  if (act === 'add-link' && p) { p.links.push({ to: '', label: { tr: '', en: '' } }); teDirty(); renderTeLeft(); return; }
  if (act === 'del-link' && p) {
    const row = btn.closest('[data-li]'); p.links.splice(+row.dataset.li, 1); teDirty(); renderTeLeft(); teRefresh(); return;
  }
  if (act === 'del-person' && p) {
    confirmBox('Kişiyi sil', '"' + teName(p) + '" bu ağaçtan çıkarılacak; ona bağlı akrabalık ve bağ kayıtları da temizlenir. (Karakter kaydına dokunulmaz.)', () => {
      t.people = t.people.filter(x => x.id !== p.id);
      t.people.forEach(x => {
        if (x.fatherId === p.id) x.fatherId = null;
        if (x.motherId === p.id) x.motherId = null;
        x.spouseIds = x.spouseIds.filter(i => i !== p.id);
        x.childrenIds = x.childrenIds.filter(i => i !== p.id);
        x.links = (x.links || []).filter(l => l.to !== p.id);
      });
      TE.sel = null; teDirty(); renderTeLeft(); teRefresh();
    });
    return;
  }
  if (act === 'to-auto') {
    confirmBox('Otomatik yerleşime geç', 'Elle çizilmiş bağlantı çizgileri, notlar ve gösterge kaldırılır; kutular akrabalık bilgisinden yeniden yerleştirilir.', () => {
      t.edgeMode = 'auto'; t.decor = { before: [], after: [] };
      t.people.forEach(x => { x.dx = 0; x.dy = 0; });
      teDirty(); renderTeLeft(); teRefresh(); TE.pz.fit(); teStatus();
    });
  }
}

function teAddFromChars() {
  const t = TE.work;
  const taken = new Set(t.people.map(x => x.characterId).concat(t.people.map(x => x.id)));
  const avail = charList().filter(c => !taken.has(c.id));
  if (!avail.length) { toast('Eklenecek karakter kalmadı.', true); return; }
  editing = { kind: 'tree-chars' };
  drawer('Karakterlerden Ekle',
    '<div class="f-hint" style="margin-bottom:.75rem">Seçilen karakterler ağaca kutu olarak eklenir; ad, unvan ve lakapları karakter kaydından alınır. Akrabalık bağlarını sonra kişi kartından girersiniz.</div>' +
    multiField('Karakterler', 'te-chars', avail, []),
    () => {
      const ids = readMulti('te-chars');
      if (!ids.length) return 'En az bir karakter seçin.';
      let last = null;
      ids.forEach(cid => {
        const ch = charList().find(c => c.id === cid); if (!ch) return;
        const np = teNewPerson(cid); np.id = uniqueId(cid, t.people.filter(x => x !== np).map(x => x.id));
        teFillFromChar(np, ch); last = np.id;
      });
      teDirty(); TE.tab = 'people'; TE.sel = null; renderTeLeft(); teRefresh();
      toast(ids.length + ' kişi eklendi.');
      return null;
    });
}

/* ═══════════════════════════════════════════════════════════
   ORTAK LİSAN (language.json)
   ═══════════════════════════════════════════════════════════ */
function dictList() { return DB['language.json'].dictionary || (DB['language.json'].dictionary = []); }

function renderLanguageAdmin() {
  const all = dictList();
  const q = (searchQ.language || '').toLocaleLowerCase('tr');
  const rows = all.filter(w => !q || (w.word || '').toLocaleLowerCase('tr').includes(q) || (w.meaning || '').toLocaleLowerCase('tr').includes(q));
  const shown = rows.slice(0, 80);

  $('#view').innerHTML =
    toolbarHTML('language', 'Sözcük veya anlam ara…', rows.length, all.length, 'sözcük') +
    (shown.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      '<th>Sözcük</th><th>Tür</th><th>Anlam</th><th></th></tr></thead><tbody>' +
      shown.map(w => {
        const i = all.indexOf(w);
        return '<tr>' +
          '<td class="cell-name">' + esc(w.word || '') + '</td>' +
          '<td style="font-size:.74rem;color:var(--parchd)">' + esc(w.pos || '') + '</td>' +
          '<td style="font-size:.78rem;color:var(--parchd)">' + esc((w.meaning || '').substring(0, 70)) + '</td>' +
          '<td><div class="cell-acts">' +
          '<button class="abtn sm" data-edit="' + i + '">Düzenle</button>' +
          '<button class="abtn sm danger" data-del="' + i + '">Sil</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>' +
      (rows.length > shown.length ? '<p class="f-hint" style="margin-top:.6rem">İlk 80 sonuç gösteriliyor — daraltmak için arayın.</p>' : '')
      : '<div class="empty-a">Sözcük bulunamadı.</div>');

  bindToolbar('language', renderLanguageAdmin);
}

function openWordEditor(index) {
  const isNew = index === null;
  const w = isNew ? { word: '', pos: '', origin: '', meaning: '', example: '' }
                  : JSON.parse(JSON.stringify(dictList()[index]));
  editing = { kind: 'word', index };

  drawer(isNew ? 'Yeni Sözcük' : 'Sözcüğü Düzenle',
    textField('Sözcük', 'w-word', w.word, '', true) +
    textField('Tür (isim, fiil, unvan…)', 'w-pos', w.pos) +
    textField('Köken', 'w-origin', w.origin) +
    textField('Anlam', 'w-meaning', w.meaning) +
    textField('Örnek Cümle', 'w-example', w.example),
    () => {
      const word = $('#f-w-word').value.trim();
      if (!word) return 'Sözcük zorunludur.';
      const rec = {
        word,
        pos: $('#f-w-pos').value.trim(),
        origin: $('#f-w-origin').value.trim(),
        meaning: $('#f-w-meaning').value.trim(),
        example: $('#f-w-example').value.trim(),
      };
      if (isNew) dictList().push(rec); else dictList()[index] = rec;
      if (!save('language.json')) return 'Kaydedilemedi.';
      toast(isNew ? 'Sözcük eklendi.' : 'Sözcük güncellendi.');
      renderLanguageAdmin();
      return null;
    });
}

/* ═══════════════════════════════════════════════════════════
   7) GÖRSEL YÖNETİCİSİ & MEDYA HUB (AdminMedia)
   ═══════════════════════════════════════════════════════════ */
const AdminMedia = {
  cachedImages: [],
  currentCallback: null,
  currentFolder: 'general',
  targetReplacePath: null,
  replaceCallback: null,
  selectedFileDataUrl: null,
  selectedFileName: '',
  replaceDataUrl: null,
  activeCat: 'all',
  searchQuery: '',

  async fetchImages() {
    try {
      const res = await fetch('/api/images');
      const data = await res.json();
      if (data && data.ok) {
        this.cachedImages = data.images || [];
        return this.cachedImages;
      }
    } catch (e) {
      console.warn('Görseller API\'den okunamadı, yerel fallback:', e);
    }
    // Fallback: DB'de kayıtlı görsellerden türet
    if (!this.cachedImages.length) {
      const portraits = charList().filter(c => c.image).map(c => ({ path: c.image, name: c.image.split('/').pop(), category: 'characters' }));
      const godImgs = godList().filter(g => g.image).map(g => ({ path: g.image, name: g.image.split('/').pop(), category: 'gods' }));
      this.cachedImages = MEDIA.map(m => ({ path: m.path, name: m.name, category: 'general' })).concat(portraits, godImgs);
    }
    return this.cachedImages;
  },

  init() {
    this.bindPickerModal();
    this.bindReplacerModal();
    this.fetchImages();
  },

  openPicker(options) {
    this.currentCallback = options.onSelect;
    this.currentFolder = options.folder || 'general';
    this.selectedFileDataUrl = null;
    this.selectedFileName = '';

    const folderSel = $('#img-upload-folder');
    if (folderSel) folderSel.value = this.currentFolder;

    const prevWrap = $('#img-upload-preview-wrap');
    if (prevWrap) prevWrap.style.display = 'none';
    const prevImg = $('#img-upload-preview');
    if (prevImg) prevImg.src = '';
    const nameInp = $('#img-custom-name');
    if (nameInp) nameInp.value = '';
    const fileInp = $('#img-file-input');
    if (fileInp) fileInp.value = '';

    const urlInp = $('#img-url-input');
    if (urlInp) {
      urlInp.value = options.current || '';
      this.updateUrlPreview(urlInp.value);
    }

    this.renderGalleryGrid();
    this.switchPickerTab('upload');
    $('#img-modal-back').classList.add('on');
  },

  closePicker() {
    $('#img-modal-back').classList.remove('on');
    this.currentCallback = null;
  },

  openReplacer(targetPath, onDone) {
    if (!targetPath) return toast('Değiştirilecek görsel yolu bulunamadı.', true);
    this.targetReplacePath = targetPath;
    this.replaceCallback = onDone;
    this.replaceDataUrl = null;

    $('#replace-current-img').src = targetPath + (targetPath.includes('?') ? '&' : '?') + 't=' + Date.now();
    $('#replace-current-path').textContent = targetPath;
    $('#replace-new-empty').style.display = 'flex';
    $('#replace-new-img').style.display = 'none';
    $('#replace-new-name').textContent = '';
    $('#replace-confirm').disabled = true;
    const fileInp = $('#replace-file-input');
    if (fileInp) fileInp.value = '';

    $('#img-replace-back').classList.add('on');
  },

  closeReplacer() {
    $('#img-replace-back').classList.remove('on');
    this.targetReplacePath = null;
    this.replaceCallback = null;
  },

  switchPickerTab(tab) {
    $('#img-tab-upload')?.classList.toggle('on', tab === 'upload');
    $('#img-tab-gallery')?.classList.toggle('on', tab === 'gallery');
    $('#img-tab-url')?.classList.toggle('on', tab === 'url');

    $('#img-pane-upload')?.classList.toggle('on', tab === 'upload');
    $('#img-pane-gallery')?.classList.toggle('on', tab === 'gallery');
    $('#img-pane-url')?.classList.toggle('on', tab === 'url');
    if (tab === 'gallery') this.renderGalleryGrid();
  },

  updateUrlPreview(url) {
    const box = $('#img-url-preview-box'), img = $('#img-url-preview'), st = $('#img-url-status');
    if (!box || !img || !st) return;
    if (!url) { box.style.display = 'none'; return; }
    box.style.display = 'flex';
    img.src = url;
    st.textContent = 'Hedef Yol: ' + url;
  },

  async renderGalleryGrid() {
    const grid = $('#img-gallery-grid'), countEl = $('#gallery-count');
    if (!grid) return;
    await this.fetchImages();
    const q = ($('#gallery-search') ? $('#gallery-search').value : '').toLowerCase().trim();
    const cat = $('#gallery-filter') ? $('#gallery-filter').value : '';

    const filtered = this.cachedImages.filter(img => {
      if (cat && img.category !== cat) return false;
      if (q && !img.name.toLowerCase().includes(q) && !img.path.toLowerCase().includes(q)) return false;
      return true;
    });

    if (countEl) countEl.textContent = filtered.length + ' görsel';

    if (!filtered.length) {
      grid.innerHTML = '<div class="f-hint" style="grid-column:1/-1;padding:1.5rem;text-align:center">Eşleşen görsel bulunamadı.</div>';
      return;
    }

    grid.innerHTML = filtered.map(img => `
      <div class="gallery-item" data-path="${esc(img.path)}" title="${esc(img.path)}">
        <img class="gallery-item-thumb" src="${esc(img.path)}" alt="${esc(img.name)}" loading="lazy" onerror="this.style.opacity=.2">
        <div class="gallery-item-name">${esc(img.name)}</div>
      </div>
    `).join('');

    grid.querySelectorAll('.gallery-item').forEach(el => {
      el.addEventListener('click', () => {
        grid.querySelectorAll('.gallery-item').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
        const selectedPath = el.dataset.path;
        if (AdminMedia.currentCallback) {
          AdminMedia.currentCallback(selectedPath);
          toast('Görsel seçildi: ' + selectedPath);
          AdminMedia.closePicker();
        }
      });
    });
  },

  bindPickerModal() {
    $('#img-tab-upload')?.addEventListener('click', () => this.switchPickerTab('upload'));
    $('#img-tab-gallery')?.addEventListener('click', () => this.switchPickerTab('gallery'));
    $('#img-tab-url')?.addEventListener('click', () => this.switchPickerTab('url'));

    $('#img-modal-close')?.addEventListener('click', () => this.closePicker());
    $('#img-modal-cancel')?.addEventListener('click', () => this.closePicker());
    $('#img-modal-back')?.addEventListener('click', e => { if (e.target.id === 'img-modal-back') this.closePicker(); });

    const dropzone = $('#img-dropzone'), fileInput = $('#img-file-input'), browseBtn = $('#img-browse-btn');
    browseBtn?.addEventListener('click', () => fileInput?.click());
    dropzone?.addEventListener('click', e => { if (e.target !== browseBtn) fileInput?.click(); });

    dropzone?.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone?.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) this.handleFileSelection(e.dataTransfer.files[0]);
    });

    fileInput?.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) this.handleFileSelection(fileInput.files[0]);
    });

    $('#gallery-search')?.addEventListener('input', () => this.renderGalleryGrid());
    $('#gallery-filter')?.addEventListener('change', () => this.renderGalleryGrid());

    $('#img-url-input')?.addEventListener('input', e => this.updateUrlPreview(e.target.value.trim()));

    $('#img-modal-confirm')?.addEventListener('click', async () => {
      if ($('#img-pane-upload').classList.contains('on')) {
        if (!this.selectedFileDataUrl) return toast('Lütfen önce bir görsel dosyası seçin.', true);
        const folder = $('#img-upload-folder').value || 'general';
        const customName = ($('#img-custom-name').value || this.selectedFileName || '').trim();
        try {
          toast('Görsel sunucuya yükleniyor…');
          const res = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: customName,
              folder,
              dataUrl: this.selectedFileDataUrl
            })
          });
          const data = await res.json();
          if (data && data.ok) {
            toast('Görsel yüklendi: ' + data.path);
            await this.fetchImages();
            if (this.currentCallback) this.currentCallback(data.path);
            this.closePicker();
          } else {
            toast('Yükleme hatası: ' + ((data && data.error) || 'Bilinmeyen hata'), true);
          }
        } catch (e) {
          toast('Yükleme başarısız: ' + e.message, true);
        }
      } else if ($('#img-pane-gallery').classList.contains('on')) {
        const sel = $('#img-gallery-grid .gallery-item.selected');
        if (!sel) return toast('Lütfen galeriden bir görsel seçin.', true);
        if (this.currentCallback) this.currentCallback(sel.dataset.path);
        this.closePicker();
      } else if ($('#img-pane-url').classList.contains('on')) {
        const url = ($('#img-url-input').value || '').trim();
        if (!url) return toast('Lütfen bir görsel yolu veya URL girin.', true);
        if (this.currentCallback) this.currentCallback(url);
        this.closePicker();
      }
    });
  },

  handleFileSelection(file) {
    if (!file || !file.type.startsWith('image/')) return toast('Lütfen geçerli bir görsel dosyası seçin.', true);
    this.selectedFileName = file.name;
    const reader = new FileReader();
    reader.onload = e => {
      this.selectedFileDataUrl = e.target.result;
      const previewWrap = $('#img-upload-preview-wrap');
      const previewImg = $('#img-upload-preview');
      const nameEl = $('#img-upload-name');
      const metaEl = $('#img-upload-meta');
      const customNameInput = $('#img-custom-name');

      if (previewWrap) previewWrap.style.display = 'flex';
      if (previewImg) previewImg.src = this.selectedFileDataUrl;
      if (nameEl) nameEl.textContent = file.name;
      if (metaEl) metaEl.textContent = Math.round(file.size / 1024) + ' KB · ' + file.type;
      if (customNameInput) customNameInput.value = file.name.replace(/\.[a-zA-Z0-9]+$/, '');
    };
    reader.readAsDataURL(file);
  },

  bindReplacerModal() {
    $('#img-replace-close')?.addEventListener('click', () => this.closeReplacer());
    $('#replace-cancel')?.addEventListener('click', () => this.closeReplacer());
    $('#img-replace-back')?.addEventListener('click', e => { if (e.target.id === 'img-replace-back') this.closeReplacer(); });

    const fileInput = $('#replace-file-input'), browseBtn = $('#replace-browse-btn'), dropzone = $('#replace-dropzone');
    browseBtn?.addEventListener('click', () => fileInput?.click());
    dropzone?.addEventListener('click', e => { if (e.target !== browseBtn) fileInput?.click(); });

    dropzone?.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone?.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) this.handleReplaceFile(e.dataTransfer.files[0]);
    });

    fileInput?.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) this.handleReplaceFile(fileInput.files[0]);
    });

    $('#replace-confirm')?.addEventListener('click', async () => {
      if (!this.replaceDataUrl || !this.targetReplacePath) return;
      try {
        toast('Görsel değiştiriliyor…');
        const res = await fetch('/api/replace-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetPath: this.targetReplacePath,
            dataUrl: this.replaceDataUrl
          })
        });
        const data = await res.json();
        if (data && data.ok) {
          toast('Görsel başarıyla güncellendi: ' + this.targetReplacePath);
          await this.fetchImages();
          const t = Date.now();
          $$(`img[src^="${this.targetReplacePath}"]`).forEach(img => {
            img.src = this.targetReplacePath + (this.targetReplacePath.includes('?') ? '&' : '?') + 't=' + t;
          });
          if (this.replaceCallback) this.replaceCallback(this.targetReplacePath);
          this.closeReplacer();
        } else {
          toast('Değiştirme hatası: ' + ((data && data.error) || 'Bilinmeyen hata'), true);
        }
      } catch (e) {
        toast('Görsel değiştirilemedi: ' + e.message, true);
      }
    });
  },

  handleReplaceFile(file) {
    if (!file || !file.type.startsWith('image/')) return toast('Lütfen geçerli bir görsel dosyası seçin.', true);
    const reader = new FileReader();
    reader.onload = e => {
      this.replaceDataUrl = e.target.result;
      $('#replace-new-empty').style.display = 'none';
      const newImg = $('#replace-new-img');
      newImg.style.display = 'block';
      newImg.src = this.replaceDataUrl;
      $('#replace-new-name').textContent = file.name + ' (' + Math.round(file.size / 1024) + ' KB)';
      $('#replace-confirm').disabled = false;
    };
    reader.readAsDataURL(file);
  }
};

async function renderMedia() {
  await AdminMedia.fetchImages();
  const all = AdminMedia.cachedImages;
  const q = (AdminMedia.searchQuery || '').toLowerCase().trim();
  const cat = AdminMedia.activeCat || 'all';

  const cats = [
    ['all', 'Tüm Görseller', all.length],
    ['characters', 'Karakterler', all.filter(x => x.category === 'characters').length],
    ['kingdoms', 'Devletler', all.filter(x => x.category === 'kingdoms').length],
    ['gods', 'Tanrılar', all.filter(x => x.category === 'gods').length],
    ['maps', 'Haritalar', all.filter(x => x.category === 'maps').length],
    ['banners', 'Sancaklar & Afiş', all.filter(x => x.category === 'banners').length],
    ['chapters', 'Bölümler', all.filter(x => x.category === 'chapters').length],
    ['general', 'Genel & Logolar', all.filter(x => x.category === 'general').length]
  ];

  const filtered = all.filter(img => {
    if (cat !== 'all' && img.category !== cat) return false;
    if (q && !img.name.toLowerCase().includes(q) && !img.path.toLowerCase().includes(q)) return false;
    return true;
  });

  $('#view').innerHTML =
    '<div class="notice">Stallhart evrenindeki tüm görseller burada listelenir. ' +
    'Doğrudan <strong>"Görseli Değiştir"</strong> butonuyla mevcut dosyayı güncelleyebilir veya ' +
    '<strong>"Yeni Görsel Yükle"</strong> ile projeye yeni dosya ekleyebilirsiniz.</div>' +

    '<div class="cm-tabs">' +
    cats.map(c => '<button class="cm-tab' + (cat === c[0] ? ' on' : '') + '" data-media-cat="' + c[0] + '">' +
      esc(c[1]) + '<b>(' + c[2] + ')</b></button>').join('') +
    '</div>' +

    '<div class="toolbar-row">' +
    '<div class="search-box-a">' +
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--goldd)" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>' +
    '<input id="media-search" placeholder="Görsel dosya adı veya yol ara…" value="' + esc(AdminMedia.searchQuery) + '">' +
    '</div>' +
    '<button class="abtn primary" id="btn-media-upload">📤 Yeni Görsel Yükle</button>' +
    '<button class="abtn sm" id="btn-media-scan">🔄 Yeniden Tara</button>' +
    '<span class="count-a">' + filtered.length + ' / ' + all.length + ' görsel</span>' +
    '</div>' +

    (filtered.length
      ? '<div class="media-hub-grid">' +
        filtered.map(img => `
          <div class="media-hub-card">
            <div class="media-hub-img-wrap">
              <img class="media-hub-thumb" src="${esc(img.path)}" alt="${esc(img.name)}" loading="lazy" onerror="this.style.opacity=.2">
              <span class="media-hub-badge">${esc(img.ext || img.category)}</span>
            </div>
            <div class="media-hub-meta">
              <div class="media-hub-title" title="${esc(img.name)}">${esc(img.name)}</div>
              <div class="media-hub-path" title="${esc(img.path)}">${esc(img.path)}</div>
              <div class="media-hub-details">
                <span>${img.size ? Math.round(img.size / 1024) + ' KB' : '—'}</span>
                <span style="color:var(--goldd)">${esc(img.category)}</span>
              </div>
              <div class="media-hub-acts">
                <button class="abtn sm primary" data-act-replace="${esc(img.path)}">🔄 Görseli Değiştir</button>
                <button class="abtn sm" data-act-copy="${esc(img.path)}">📋 Yolu Kopyala</button>
              </div>
            </div>
          </div>
        `).join('') +
        '</div>'
      : '<div class="empty-a">Aramaya uygun görsel bulunamadı.</div>');

  // Event bindings
  $$('#view [data-media-cat]').forEach(b => b.addEventListener('click', () => {
    AdminMedia.activeCat = b.dataset.mediaCat;
    renderMedia();
  }));

  $('#media-search')?.addEventListener('input', e => {
    AdminMedia.searchQuery = e.target.value.trim();
    renderMedia();
  });

  $('#btn-media-upload')?.addEventListener('click', () => {
    AdminMedia.openPicker({
      folder: cat === 'all' ? 'general' : cat,
      onSelect: () => renderMedia()
    });
  });

  $('#btn-media-scan')?.addEventListener('click', async () => {
    toast('Görseller yeniden taranıyor…');
    await AdminMedia.fetchImages();
    renderMedia();
    toast('Görsel listesi güncellendi.');
  });

  $$('#view [data-act-replace]').forEach(b => b.addEventListener('click', () => {
    AdminMedia.openReplacer(b.dataset.actReplace, () => renderMedia());
  }));

  $$('#view [data-act-copy]').forEach(b => b.addEventListener('click', () => {
    navigator.clipboard.writeText(b.dataset.actCopy);
    toast('Görsel yolu panoya kopyalandı.');
  }));
}

/* ═══════════════════════════════════════════════════════════
   8) İMPARATORLUK HİYERARŞİSİ (hierarchy.json)
   ═══════════════════════════════════════════════════════════ */
const HY_BRANCHES = [
  ['all', 'Tüm Makamlar', '✦'],
  ['supreme', 'Yüce Hükümranlık', '👑'],
  ['political', 'Siyasi Divan (Veron)', '🏛️'],
  ['military', 'Askeri Erkan (Gharion)', '⚔️'],
  ['religious', 'Ruhani & Mabed', '🕯️']
];

let hyActiveBranch = 'all';

function hierarchyList() {
  const h = DB['hierarchy.json'] || {};
  return Object.keys(h).map(id => Object.assign({ id }, h[id]));
}

function renderHierarchyAdmin() {
  const all = hierarchyList();
  const q = (searchQ.hierarchy || '').toLowerCase().trim();
  const rows = all.filter(item => {
    if (hyActiveBranch !== 'all' && item.branch !== hyActiveBranch) return false;
    if (q) {
      const title = (biVal(item.title) || '').toLowerCase();
      const term = (item.term || '').toLowerCase();
      const motto = (item.motto || '').toLowerCase();
      const holder = (biVal(item.current && item.current.name) || '').toLowerCase();
      return title.includes(q) || term.includes(q) || motto.includes(q) || holder.includes(q);
    }
    return true;
  });

  $('#view').innerHTML =
    '<div class="notice">Stallhart İmparatorluğu\'nun Kutsal Kan Doktrini, Siyasi Divan, ' +
    'Askeri Komuta ve Dini Mabed makamları. Makam yetkilerini (ferman maddeleri), ' +
    'mevcut görev sahiplerini ve selefler silsilesini buradan yönetebilirsiniz. ' +
    'Değişiklikler <code>hiyerarsi.html</code> sayfasına ve ferman kütüğüne anında yansır.</div>' +

    '<div class="hy-branch-tabs">' +
    HY_BRANCHES.map(b => `
      <button class="hy-branch-tab${hyActiveBranch === b[0] ? ' on' : ''}" data-hy-branch="${b[0]}">
        <span>${b[2]}</span> ${esc(b[1])}
      </button>
    `).join('') +
    '</div>' +

    '<div class="toolbar-row">' +
    '<div class="search-box-a">' +
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--goldd)" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>' +
    '<input id="hy-search" placeholder="Makam unvanı, şiar veya görev sahibi ara…" value="' + esc(searchQ.hierarchy) + '">' +
    '</div>' +
    '<button class="abtn primary" id="btn-hy-add">+ Yeni Makam Ekle</button>' +
    '<span class="count-a">' + rows.length + ' / ' + all.length + ' makam</span>' +
    '</div>' +

    (rows.length
      ? '<div class="hy-admin-list">' +
        rows.map(item => {
          const cur = item.current || {};
          const curName = biVal(cur.name) || 'Makam Boşta';
          const curEpithet = biVal(cur.epithet);
          const curImage = cur.image || 'assets/images/characters/zeandor_stallhart01-240w.webp';
          const branchLabel = (HY_BRANCHES.find(b => b[0] === item.branch) || [, item.branch])[1];
          const powersCount = ((item.powers && (item.powers.tr || item.powers.en)) || []).length;
          const predsCount = (item.predecessors || []).length;

          return `
            <div class="hy-admin-card branch-${esc(item.branch || 'political')}">
              <img class="hy-admin-thumb" src="${esc(curImage)}" alt="" onerror="this.src='assets/images/logo-stallhart-240w.webp'">
              <div class="hy-admin-info">
                <div class="hy-admin-title">${esc(biVal(item.title))} <span class="pill ${esc(item.branch)}">${esc(branchLabel)}</span></div>
                <div class="hy-admin-holder">👤 <strong>${esc(curName)}</strong> ${curEpithet ? `· <em>${esc(curEpithet)}</em>` : ''} <span style="color:var(--parchd);font-size:.74rem">(${esc(cur.era || 'KS günümüz')})</span></div>
                <div class="hy-admin-sub">📜 “${esc(item.motto || item.term || '')}” · <span style="color:var(--goldd)">${powersCount} Ferman Yetkisi</span> · <span style="color:var(--parchd)">${predsCount} Tarihsel Selef</span></div>
              </div>
              <div class="cell-acts">
                <a class="abtn sm" href="hiyerarsi.html?office=${encodeURIComponent(item.id)}" target="_blank" rel="noopener">Sayfada Gör ↗</a>
                <button class="abtn sm primary" data-hy-edit="${esc(item.id)}">Düzenle</button>
                <button class="abtn sm danger" data-hy-del="${esc(item.id)}">Sil</button>
              </div>
            </div>
          `;
        }).join('') +
        '</div>'
      : '<div class="empty-a">Makam kaydı bulunamadı.</div>');

  $$('#view [data-hy-branch]').forEach(b => b.addEventListener('click', () => {
    hyActiveBranch = b.dataset.hyBranch;
    renderHierarchyAdmin();
  }));

  $('#hy-search')?.addEventListener('input', e => {
    searchQ.hierarchy = e.target.value.trim();
    renderHierarchyAdmin();
  });

  $('#btn-hy-add')?.addEventListener('click', () => openHierarchyEditor(null));
}

function openHierarchyEditor(id) {
  const isNew = id === null;
  const raw = isNew ? null : (DB['hierarchy.json'] || {})[id];
  const item = isNew ? {
    id: '',
    branch: 'political',
    title: bi(),
    term: '',
    motto: '',
    subtitle: bi(),
    description: bi(),
    insignia: bi(),
    powers: { tr: [], en: [] },
    current: {
      name: bi(),
      epithet: bi(),
      house: 'stallhart',
      charId: '',
      era: 'KS 1480 — günümüz',
      status: bi('Makamında', 'Active on Duty'),
      image: '',
      bio: bi()
    },
    predecessors: []
  } : JSON.parse(JSON.stringify(raw));

  editing = { kind: 'hierarchy', id };

  const houseOptions = [['stallhart', 'İmparatorluk Hanedanı (Stallhart)'], ['solgar', 'Solgar Hanesi'], ['arhan', 'Arhan Hanesi'], ['selya', 'Selya Hanesi'], ['other', 'Bağımsız / Diğer']];
  const branchOptions = [
    ['supreme', 'Yüce Hükümranlık (İmparatorluk)'],
    ['political', 'Siyasi Divan (Veron)'],
    ['military', 'Askeri Erkan (Gharion)'],
    ['religious', 'Ruhani Teşkilat (Mabed)']
  ];

  const secH = t => '<div class="f-sec" style="font-family:var(--font-display);font-size:.9rem;color:var(--gold);margin:1.4rem 0 .6rem;padding-bottom:.3rem;border-bottom:1px solid var(--border)">' + esc(t) + '</div>';

  const cur = item.current || {};
  const powersTr = (item.powers && item.powers.tr) || [];
  const powersEn = (item.powers && item.powers.en) || [];

  drawer(isNew ? 'Yeni İmparatorluk Makamı' : 'Makamı Düzenle: ' + esc(biVal(item.title)),
    secH('1. Makam Bilgileri') +
    (isNew ? textField('Makam Kimliği (id)', 'hy-id', '', 'Örn: solgar_chancellor (İngilizce küçük harf ve altçizgi)') : '') +
    selectField('Makam Branşı', 'hy-branch', branchOptions, item.branch) +
    biField('Makam Unvanı', 'hy-title', item.title, true) +
    textField('Ortak Lisan Makam Terimi (term)', 'hy-term', item.term, 'Örn: Veron / Anxes / Gharion') +
    textField('Makam Şiarı (Motto)', 'hy-motto', item.motto, 'Örn: Xes ovas. Edor Xesed!') +
    biField('Alt Başlık / Doktrin', 'hy-subtitle', item.subtitle) +
    biField('Görev ve Makam Tanımı', 'hy-description', item.description, false, true) +
    biField('Resmi Nişan & Mührü', 'hy-insignia', item.insignia) +

    secH('2. Ferman Yetkileri (Powers)') +
    '<div class="f-hint" style="margin-bottom:.6rem">Her satıra bir yetki maddesi yazın.</div>' +
    '<div class="f-row"><label class="f-label">Türkçe Yetkiler (Her satırda bir madde)</label>' +
    '<textarea class="f-area" id="f-hy-powers-tr" style="min-height:100px" placeholder="Ferman çıkarma yetkisi\nOrduyu teftiş etme yetkisi">' + esc(powersTr.join('\n')) + '</textarea></div>' +
    '<div class="f-row"><label class="f-label">English Powers (One per line)</label>' +
    '<textarea class="f-area" id="f-hy-powers-en" style="min-height:100px" placeholder="Authority to issue decrees\nInspection of imperial legions">' + esc(powersEn.join('\n')) + '</textarea></div>' +

    secH('3. Mevcut Görev Sahibi (Current Holder)') +
    biField('Kişi Adı', 'hy-cur-name', cur.name, true) +
    biField('Lakap / Sıfat', 'hy-cur-epithet', cur.epithet) +
    '<div class="f-row half">' +
      selectField('Bağlı Hane', 'hy-cur-house', houseOptions, cur.house) +
      textField('Karakter Arşiv Kimliği (charId)', 'hy-cur-charId', cur.charId, 'Örn: zeandor (Boş bırakılabilir)') +
    '</div>' +
    '<div class="f-row half">' +
      textField('Hüküm / Dönem (era)', 'hy-cur-era', cur.era, 'Örn: KS 1480 — günümüz') +
      biField('Makam Durumu', 'hy-cur-status', cur.status) +
    '</div>' +
    imageField('Mevcut Görev Sahibi Portresi', 'hy-cur-image', cur.image, 'Karakter portresi veya mühür görseli.', 'characters') +
    biField('Biyografi ve İcraatlar', 'hy-cur-bio', cur.bio, false, true),
    () => {
      const officeId = isNew ? slugify($('#f-hy-id').value.trim()) : id;
      if (!officeId) return 'Makam kimliği zorunludur.';

      const title = readBi('hy-title');
      if (isEmptyBi(title)) return 'Makam unvanı zorunludur.';

      const pTr = ($('#f-hy-powers-tr').value || '').split('\n').map(s => s.trim()).filter(Boolean);
      const pEn = ($('#f-hy-powers-en').value || '').split('\n').map(s => s.trim()).filter(Boolean);

      const rec = Object.assign({}, item, {
        id: officeId,
        branch: $('#f-hy-branch').value,
        title,
        term: $('#f-hy-term').value.trim(),
        motto: $('#f-hy-motto').value.trim(),
        subtitle: readBi('hy-subtitle'),
        description: readBi('hy-description'),
        insignia: readBi('hy-insignia'),
        powers: { tr: pTr, en: pEn },
        current: {
          name: readBi('hy-cur-name'),
          epithet: readBi('hy-cur-epithet'),
          house: $('#f-hy-cur-house').value,
          charId: $('#f-hy-cur-charId').value.trim(),
          era: $('#f-hy-cur-era').value.trim(),
          status: readBi('hy-cur-status'),
          image: $('#f-hy-cur-image').value.trim(),
          bio: readBi('hy-cur-bio')
        }
      });

      if (!DB['hierarchy.json']) DB['hierarchy.json'] = {};
      DB['hierarchy.json'][officeId] = rec;
      if (!save('hierarchy.json')) return 'Kaydedilemedi.';
      toast(isNew ? 'Makam eklendi.' : 'Makam güncellendi.');
      renderHierarchyAdmin();
      return null;
    }
  );
}

/* ═══════════════════════════════════════════════════════════
   9) SAYFALAR & SİTE CMS (pages.json)
   ═══════════════════════════════════════════════════════════ */
function pagesList() {
  const p = (DB['pages.json'] && DB['pages.json'].pages) || {};
  return Object.keys(p).map(id => Object.assign({ id }, p[id]));
}

function renderPagesAdmin() {
  const pages = pagesList();

  $('#view').innerHTML =
    '<div class="notice">Stallhart web sitesindeki tüm sayfaların meta başlıkları, açıklamaları, ' +
    'hero sloganları, afişleri ve duyuru fermanları. Düzenlemek istediğiniz sayfanın kartındaki ' +
    '<strong>"Düzenle"</strong> butonuna tıklayın.</div>' +

    '<div class="pages-cms-grid">' +
    pages.map(p => {
      const banner = p.bannerImage || (p.hero && p.hero.bannerImage) || 'assets/images/SIYASI_HARITA_onizleme.jpg';
      return `
        <div class="page-cms-card">
          <div class="page-cms-banner">
            <img src="${esc(banner)}" alt="" onerror="this.src='assets/images/SIYASI_HARITA_onizleme.jpg'">
            <span class="page-cms-banner-badge">${esc(p.path)}</span>
          </div>
          <div class="page-cms-body">
            <div class="page-cms-title">${esc(p.name)}</div>
            <div style="font-size:.78rem;color:var(--goldd);margin-bottom:.4rem;font-style:italic">${esc(biVal(p.title))}</div>
            <div class="page-cms-desc">${esc(biVal(p.description))}</div>
            <div class="page-cms-foot">
              <a class="abtn sm" href="${esc(p.path)}" target="_blank" rel="noopener">Sayfayı Aç ↗</a>
              <button class="abtn sm primary" data-page-edit="${esc(p.id)}">Düzenle</button>
            </div>
          </div>
        </div>
      `;
    }).join('') +
    '</div>';
}

function openPageEditor(pageKey) {
  const pagesObj = (DB['pages.json'] && DB['pages.json'].pages) || {};
  const p = pagesObj[pageKey] ? JSON.parse(JSON.stringify(pagesObj[pageKey])) : {
    id: pageKey,
    name: pageKey,
    path: pageKey + '.html',
    title: bi(),
    description: bi(),
    bannerImage: ''
  };

  editing = { kind: 'page', id: pageKey };

  const secH = t => '<div class="f-sec" style="font-family:var(--font-display);font-size:.9rem;color:var(--gold);margin:1.4rem 0 .6rem;padding-bottom:.3rem;border-bottom:1px solid var(--border)">' + esc(t) + '</div>';

  let extraHTML = '';
  if (pageKey === 'index') {
    const hero = p.hero || {};
    const ann = p.announcement || {};
    extraHTML =
      secH('Ana Sayfa Hero Ayarları') +
      biField('Hero Eyebrow (Üst Başlık)', 'pg-eyebrow', hero.eyebrow) +
      biField('Hero Alıntısı / Epigraf', 'pg-quote', hero.quote, false, true) +
      textField('Alıntı Sahibi / Yazar', 'pg-author', hero.author) +
      imageField('Hero Logosu', 'pg-logo', hero.logoImage, 'Hero bölümündeki büyük arma logosu.', 'general') +

      secH('Öne Çıkan Ferman / Duyuru Şeridi') +
      selectField('Duyuru Aktif mi?', 'pg-ann-active', [['1', 'Aktif (Görünür)'], ['0', 'Pasif (Gizli)']], ann.active ? '1' : '0') +
      biField('Duyuru Rozeti', 'pg-ann-badge', ann.badge) +
      biField('Duyuru Başlığı', 'pg-ann-title', ann.title) +
      biField('Duyuru Metni', 'pg-ann-text', ann.text, false, true) +
      textField('Duyuru Bağlantısı (URL)', 'pg-ann-link', ann.link, 'Örn: hiyerarsi.html');
  }

  drawer('Sayfa Ayarlarını Düzenle: ' + esc(p.name),
    secH('Temel Meta Bilgileri') +
    textField('Sayfa Adı (İç Etiket)', 'pg-name', p.name, 'Panelde görünen başlık.') +
    biField('Sayfa Başlığı (Title)', 'pg-title', p.title, true) +
    biField('Meta Açıklaması (Description)', 'pg-desc', p.description, false, true) +
    imageField('Sayfa Banner / Arka Plan Görseli', 'pg-banner', p.bannerImage, 'Üst başlık ve paylaşım kartında kullanılır.', 'banners') +
    extraHTML,
    () => {
      const title = readBi('pg-title');
      if (isEmptyBi(title)) return 'Sayfa başlığı zorunludur.';

      const updated = Object.assign({}, p, {
        name: $('#f-pg-name').value.trim() || p.name,
        title,
        description: readBi('pg-desc'),
        bannerImage: $('#f-pg-banner').value.trim()
      });

      if (pageKey === 'index') {
        updated.hero = Object.assign({}, p.hero, {
          eyebrow: readBi('pg-eyebrow'),
          quote: readBi('pg-quote'),
          author: $('#f-pg-author').value.trim(),
          logoImage: $('#f-pg-logo').value.trim()
        });
        updated.announcement = {
          active: $('#f-pg-ann-active').value === '1',
          badge: readBi('pg-ann-badge'),
          title: readBi('pg-ann-title'),
          text: readBi('pg-ann-text'),
          link: $('#f-pg-ann-link').value.trim()
        };
      }

      if (!DB['pages.json']) DB['pages.json'] = { pages: {} };
      if (!DB['pages.json'].pages) DB['pages.json'].pages = {};
      DB['pages.json'].pages[pageKey] = updated;

      if (!save('pages.json')) return 'Kaydedilemedi.';
      toast('Sayfa ayarları güncellendi.');
      renderPagesAdmin();
      return null;
    }
  );
}

/* ═══════════════════════════════════════════════════════════
   8) VERİ & YAYIN
   ═══════════════════════════════════════════════════════════ */
/* book.json içinde data: URL olarak gömülü görsel varsa yayın öncesi uyar */
function warnEmbedded(file) {
  if (file === 'maps.json') {
    let n = 0, kb = 0;
    ((DB['maps.json'] || {}).maps || []).forEach(m => {
      [m.image, m.thumb].forEach(v => { if (/^data:/.test(v || '')) { n++; kb += Math.round(String(v).length * 0.75 / 1024); } });
    });
    if (n) setTimeout(() => toast(n + ' harita görseli dosyanın içine gömülü (~' + kb + ' KB). Yayın için Haritalar → görsel alanındaki \"Dosya olarak indir\" ile alıp assets/images/maps/ klasörüne koyun ve yolunu yazın.', true), 500);
    return;
  }
  if (file !== 'book.json') return;
  let n = 0, kb = 0;
  Object.values(DB['book.json'].chapters || {}).forEach(c => Object.values(c.images || {}).forEach(v => {
    if (/^data:/.test(v)) { n++; kb += Math.round(String(v).length * 0.75 / 1024); }
  }));
  if (n) setTimeout(() => toast(n + ' görsel dosyanın içine gömülü (~' + kb + ' KB). Yayın için editörde Görseller → İndir ile alıp assets/images/chapters/ klasörüne koyun ve yolunu yazın.', true), 500);
}

function renderDataView() {
  const drafts = Store.overriddenFiles();

  $('#view').innerHTML =
    '<div class="notice"><strong>Bu panel sunucuya yazmaz.</strong> Değişiklikler tarayıcınızın ' +
    'hafızasında tutulur ve yalnızca bu cihazdan görülür. Herkesin görmesi için aşağıdan ' +
    'dosyaları indirip depodaki <code>data/</code> klasörüne koyup commit etmeniz gerekir.</div>' +

    '<div class="panel"><div class="panel-t">Dışa Aktar</div>' +
    '<p class="f-hint" style="margin-bottom:.9rem">Her dosya, depoya olduğu gibi konulabilecek biçimde indirilir.</p>' +
    '<div class="btn-row">' +
    FILES.map(f => '<button class="abtn' + (drafts.indexOf(f) >= 0 ? ' primary' : '') + '" data-exp="' + f + '">' +
      esc(f) + (drafts.indexOf(f) >= 0 ? ' •' : '') + '</button>').join('') +
    '</div><div class="btn-row" style="margin-top:.9rem">' +
    '<button class="abtn primary" id="exp-all">Değişen dosyaların tümünü indir</button></div></div>' +

    '<div class="panel"><div class="panel-t">İçe Aktar</div>' +
    '<p class="f-hint" style="margin-bottom:.9rem">Daha önce dışa aktarılmış bir JSON dosyasını geri yükleyin. ' +
    'Dosya adı, hangi veri kümesine yazılacağını belirler.</p>' +
    '<input type="file" id="imp-file" accept="application/json,.json" class="f-input"></div>' +

    '<div class="panel"><div class="panel-t">Yerel Taslakları Sıfırla</div>' +
    '<p class="f-hint" style="margin-bottom:.9rem">' +
    (drafts.length ? 'Taslağı olan dosyalar: <strong>' + esc(drafts.join(', ')) + '</strong>. '
                   : 'Şu anda yerel taslak yok. ') +
    'Sıfırlama, depodaki <code>data/*.json</code> içeriğine geri döner. Kaydedilmemiş değişiklikler kaybolur.</p>' +
    '<div class="btn-row"><button class="abtn danger" id="reset-all"' + (drafts.length ? '' : ' disabled') + '>' +
    'Tüm yerel taslakları sil</button></div></div>' +

    '<div class="panel"><div class="panel-t">Parola</div>' +
    '<div class="f-row"><label class="f-label" for="pw-new">Yeni panel parolası</label>' +
    '<input type="password" id="pw-new" class="f-input" placeholder="En az 4 karakter"></div>' +
    '<div class="btn-row"><button class="abtn" id="pw-save">Parolayı güncelle</button></div>' +
    '<div class="notice warn" style="margin-top:1rem"><strong>Güvenlik notu:</strong> Bu parola yalnızca ' +
    'panelin kazara açılmasını engeller. Tamamen istemci tarafındadır ve gerçek bir erişim denetimi ' +
    'değildir — statik sitede bunun güvenli bir yolu yoktur. Hassas veri saklamayın.</div></div>';

  $$('#view [data-exp]').forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.exp;
    download(f, JSON.stringify(DB[f], null, 2));
    toast(f + ' indirildi.');
    warnEmbedded(f);
  }));

  const expAll = $('#exp-all');
  if (expAll) expAll.addEventListener('click', () => {
    const list = Store.overriddenFiles();
    if (!list.length) return toast('İndirilecek değişiklik yok.', true);
    list.forEach((f, i) => setTimeout(() => download(f, JSON.stringify(DB[f], null, 2)), i * 320));
    list.forEach(warnEmbedded);
    toast(list.length + ' dosya indiriliyor…');
  });

  const imp = $('#imp-file');
  if (imp) imp.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const target = FILES.find(f => file.name.indexOf(f.replace('.json', '')) >= 0);
    if (!target) { toast('Dosya adı tanınmadı. characters/chapters/quotes/lore/houses/kingdoms/maps bekleniyor.', true); return; }
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const parsed = JSON.parse(rd.result);
        if (typeof parsed !== 'object' || parsed === null) throw new Error('Geçersiz yapı');
        DB[target] = parsed;
        if (save(target)) { toast(target + ' içe aktarıldı.'); renderDataView(); }
      } catch (err) {
        toast('JSON okunamadı: ' + err.message, true);
      }
    };
    rd.onerror = () => toast('Dosya okunamadı.', true);
    rd.readAsText(file, 'utf-8');
  });

  const reset = $('#reset-all');
  if (reset) reset.addEventListener('click', () => {
    confirmBox('Taslakları sıfırla',
      'Tüm yerel değişiklikler silinecek ve site depodaki verilere dönecek. Bu işlem geri alınamaz.',
      async () => {
        Store.clearAll();
        await loadAll();
        toast('Yerel taslaklar silindi.');
        renderSidebarState();
        renderDataView();
      });
  });

  const pw = $('#pw-save');
  if (pw) pw.addEventListener('click', () => {
    const v = $('#pw-new').value;
    if (v.length < 4) return toast('Parola en az 4 karakter olmalı.', true);
    try { localStorage.setItem('sw-admin-pw', hashStr(v)); toast('Parola güncellendi.'); $('#pw-new').value = ''; }
    catch (e) { toast('Parola kaydedilemedi.', true); }
  });
}

/* ═══════════════════════════════════════════════════════════
   FORM ÜRETİCİLERİ
   ═══════════════════════════════════════════════════════════ */
function biField(label, key, val, required, isArea) {
  val = val || {};
  const el = isArea
    ? (id, v, ph) => '<textarea class="f-area" id="' + id + '" placeholder="' + ph + '">' + esc(v) + '</textarea>'
    : (id, v, ph) => '<input class="f-input" id="' + id + '" value="' + esc(v) + '" placeholder="' + ph + '">';
  return '<div class="f-row"><label class="f-label">' + esc(label) +
    (required ? ' <span style="color:var(--bloodb)">*</span>' : '') + '</label>' +
    '<div class="bi-pair">' +
    '<div><span class="bi-tag">Türkçe</span>' + el('f-' + key + '-tr', val.tr || '', 'Türkçe') + '</div>' +
    '<div><span class="bi-tag">English</span>' + el('f-' + key + '-en', val.en || '', 'English (boş bırakılabilir)') + '</div>' +
    '</div></div>';
}
function readBi(key) {
  const tr = $('#f-' + key + '-tr'), en = $('#f-' + key + '-en');
  return bi(tr ? tr.value : '', en ? en.value : '');
}

function textField(label, key, val, hint) {
  return '<div class="f-row"><label class="f-label" for="f-' + key + '">' + esc(label) + '</label>' +
    '<input class="f-input" id="f-' + key + '" value="' + esc(val || '') + '">' +
    (hint ? '<div class="f-hint">' + esc(hint) + '</div>' : '') + '</div>';
}

function selectField(label, key, options, selected) {
  return '<div class="f-row"><label class="f-label" for="f-' + key + '">' + esc(label) + '</label>' +
    '<select class="f-select" id="f-' + key + '">' +
    options.map(o => '<option value="' + esc(o[0]) + '"' +
      (String(o[0]) === String(selected) ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') +
    '</select></div>';
}

function imageField(label, key, val, hint, folder) {
  if (arguments.length === 1 && typeof label === 'string' && !key) {
    val = label;
    key = 'image';
    label = 'Portre Görseli';
    folder = 'characters';
  }
  key = key || 'image';
  label = label || 'Görsel';
  folder = folder || 'general';
  val = val || '';
  const hasVal = Boolean(val);

  return '<div class="f-row">' +
    '<label class="f-label" for="f-' + esc(key) + '">' + esc(label) + '</label>' +
    '<div class="img-field-group" id="ifg-' + esc(key) + '">' +
      '<div class="img-field-preview-box">' +
        (hasVal
          ? '<img class="img-field-preview-thumb" id="ifp-' + esc(key) + '" src="' + esc(val) + '" alt="" onerror="this.style.opacity=.25">'
          : '<div class="img-field-preview-empty" id="ifp-' + esc(key) + '">Görsel Yok</div>') +
      '</div>' +
      '<div class="img-field-inputs">' +
        '<input class="f-input" id="f-' + esc(key) + '" value="' + esc(val) + '" placeholder="assets/images/' + esc(folder) + '/...">' +
        '<div class="img-field-actions">' +
          '<button class="abtn primary sm" type="button" data-pick-img="' + esc(key) + '" data-folder="' + esc(folder) + '">📁 Görsel Seç / Yükle</button>' +
          '<button class="abtn sm" type="button" data-replace-img="' + esc(key) + '" style="' + (hasVal ? '' : 'display:none') + '">🔄 Dosyayı Değiştir</button>' +
          '<button class="abtn sm danger" type="button" data-clear-img="' + esc(key) + '" style="' + (hasVal ? '' : 'display:none') + '">✕ Kaldır</button>' +
        '</div>' +
        (hint ? '<div class="f-hint">' + esc(hint) + '</div>' : '<div class="f-hint">Bilgisayarınızdan yükleyin, galeriden seçin veya yol yazın.</div>') +
      '</div>' +
    '</div></div>';
}

function bindImageFieldEvents() {
  const body = $('#drawer-body');
  if (!body) return;

  function updateFieldPreview(k, path) {
    const prev = $('#ifp-' + k);
    const grp = $('#ifg-' + k);
    if (!prev || !grp) return;
    const repBtn = grp.querySelector('[data-replace-img]');
    const clrBtn = grp.querySelector('[data-clear-img]');
    if (path) {
      prev.outerHTML = '<img class="img-field-preview-thumb" id="ifp-' + esc(k) + '" src="' + esc(path) + '" alt="" onerror="this.style.opacity=.25">';
      if (repBtn) repBtn.style.display = '';
      if (clrBtn) clrBtn.style.display = '';
    } else {
      prev.outerHTML = '<div class="img-field-preview-empty" id="ifp-' + esc(k) + '">Görsel Yok</div>';
      if (repBtn) repBtn.style.display = 'none';
      if (clrBtn) clrBtn.style.display = 'none';
    }
  }

  body.querySelectorAll('[data-pick-img]').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.pickImg;
      const folder = btn.dataset.folder || 'general';
      const input = $('#f-' + k);
      AdminMedia.openPicker({
        current: input ? input.value : '',
        folder: folder,
        onSelect: (newPath) => {
          if (input) {
            input.value = newPath;
            updateFieldPreview(k, newPath);
          }
        }
      });
    });
  });

  body.querySelectorAll('[data-replace-img]').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.replaceImg;
      const input = $('#f-' + k);
      if (!input || !input.value) return toast('Değiştirilecek görsel seçili değil.', true);
      AdminMedia.openReplacer(input.value, (newPath) => {
        updateFieldPreview(k, newPath + (newPath.includes('?') ? '&' : '?') + 't=' + Date.now());
      });
    });
  });

  body.querySelectorAll('[data-clear-img]').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.clearImg;
      const input = $('#f-' + k);
      if (input) {
        input.value = '';
        updateFieldPreview(k, '');
      }
    });
  });

  body.querySelectorAll('.img-field-group input.f-input').forEach(input => {
    const k = input.id.replace('f-', '');
    input.addEventListener('input', () => updateFieldPreview(k, input.value.trim()));
  });
}

function multiField(label, key, chars, selectedIds) {
  return '<div class="f-row"><label class="f-label">' + esc(label) + '</label>' +
    '<div class="tag-pick" data-multi="' + key + '">' +
    chars.map(c => '<button type="button" class="tag-opt' +
      (selectedIds.indexOf(c.id) >= 0 ? ' on' : '') + '" data-id="' + esc(c.id) + '">' +
      esc(biVal(c.name)) + '</button>').join('') +
    '</div></div>';
}
function readMulti(key) {
  return $$('[data-multi="' + key + '"] .tag-opt.on').map(b => b.dataset.id);
}

function tagField(selected) {
  return '<div class="f-row"><label class="f-label">Etiketler</label>' +
    '<div class="tag-pick" data-multi="tags">' +
    TAGS.map(t => '<button type="button" class="tag-opt' +
      (selected.indexOf(t) >= 0 ? ' on' : '') + '" data-id="' + esc(t) + '">#' + esc(t) + '</button>').join('') +
    '</div></div>';
}
function readTags() { return readMulti('tags'); }

/* Araç çubuğu (arama + sayaç) */
function toolbarHTML(key, placeholder, shown, total, unit) {
  return '<div class="toolbar-row">' +
    '<div class="search-box-a">' +
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--goldd)" stroke-width="1.8" stroke-linecap="round">' +
    '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>' +
    '<input id="tb-search" placeholder="' + esc(placeholder) + '" value="' + esc(searchQ[key] || '') + '">' +
    '</div>' +
    '<span class="count-a">' + shown + ' / ' + total + ' ' + esc(unit) + '</span></div>';
}
function bindToolbar(key, rerender) {
  const inp = $('#tb-search');
  if (!inp) return;
  inp.addEventListener('input', () => {
    searchQ[key] = inp.value.trim();
    const pos = inp.selectionStart;
    rerender();
    const again = $('#tb-search');
    if (again) { again.focus(); again.setSelectionRange(pos, pos); }
  });
}

/* ═══════════════════════════════════════════════════════════
   ÇEKMECE (DRAWER)
   ═══════════════════════════════════════════════════════════ */
let drawerSubmit = null;

function drawer(title, bodyHTML, onSave) {
  $('#drawer-title').textContent = title;
  $('#drawer-body').innerHTML = bodyHTML + '<div class="f-error" id="drawer-err"></div>';
  drawerSubmit = onSave;
  $('#drawer').classList.add('on');
  $('#drawer-back').classList.add('on');

  /* Çoklu seçim düğmeleri */
  $$('#drawer-body .tag-opt').forEach(b => {
    b.addEventListener('click', () => b.classList.toggle('on'));
  });

  /* Görsel alanlarını otomatik bağla */
  bindImageFieldEvents();

  const first = $('#drawer-body input, #drawer-body textarea');
  if (first) setTimeout(() => first.focus(), 60);
}

function closeDrawer() {
  $('#drawer').classList.remove('on');
  $('#drawer-back').classList.remove('on');
  drawerSubmit = null;
  editing = null;
}

function submitDrawer() {
  if (!drawerSubmit) return;
  const err = drawerSubmit();
  const box = $('#drawer-err');
  if (err) {
    if (box) { box.textContent = err; box.classList.add('on'); }
    return;
  }
  closeDrawer();
}

/* ═══════════════════════════════════════════════════════════
   KENAR ÇUBUĞU DURUMU
   ═══════════════════════════════════════════════════════════ */
function renderSidebarState() {
  const n = Store.overriddenFiles().length;
  const el = $('#draft-state');
  if (!el) return;
  el.textContent = n ? n + ' dosyada kaydedilmemiş değişiklik' : 'Tüm veriler yayındakiyle aynı';
  el.style.color = n ? 'var(--gold)' : 'var(--parchd)';
}

/* ═══════════════════════════════════════════════════════════
   GİRİŞ
   ═══════════════════════════════════════════════════════════ */
const DEFAULT_PW = 'stallhart';

function hashStr(s) {
  /* Basit, tersine çevrilemeyen olmayan bir özet. Gerçek güvenlik sağlamaz;
     yalnızca parolanın düz metin saklanmasını önler. */
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return String(h);
}
function storedHash() {
  try { return localStorage.getItem('sw-admin-pw') || hashStr(DEFAULT_PW); }
  catch (e) { return hashStr(DEFAULT_PW); }
}

async function enterPanel() {
  $('#login').style.display = 'none';
  $('#shell').style.display = '';
  try { sessionStorage.setItem('sw-admin-ok', '1'); } catch (e) {}
  await loadAll();
  renderSidebarState();
  go((location.hash || '#dash').slice(1));
}

function initLogin() {
  /* v16: Supabase yapılandırıldıysa giriş Vakanüvis hesabıyla yapılır
     (assets/js/admin-community.js). Yerel parola yalnızca yedek yoldur. */
  if (window.AdminGate && window.AdminGate.active) {
    window.AdminGate.init({ enter: enterPanel, legacy: legacyLogin });
    return;
  }
  legacyLogin();
}

function legacyLogin() {
  const form = $('#login-form');
  const err = $('#login-err');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#pw').value;
    if (hashStr(v) === storedHash()) { err.classList.remove('on'); enterPanel(); }
    else { err.textContent = 'Parola hatalı.'; err.classList.add('on'); $('#pw').select(); }
  });

  let already = false;
  try { already = sessionStorage.getItem('sw-admin-ok') === '1'; } catch (e) {}
  if (already) enterPanel(); else $('#pw').focus();
}

/* ═══════════════════════════════════════════════════════════
   BAŞLAT
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  $$('.side-item').forEach(b => b.addEventListener('click', () => go(b.dataset.view)));
  bindRowActions();
  /* Tema düğmesi: admin.html kendi kenar çubuğunu kullandığı için
     wiki.js'in injectNav()'ı devreye girmez — Theme modülü burada
     elle bağlanır. */
  const themeBtn = $('[data-theme-btn]');
  if (themeBtn) {
    themeBtn.innerHTML = Wiki.Theme.icon();
    themeBtn.addEventListener('click', () => Wiki.Theme.toggle());
  }
  $('#drawer-cancel').addEventListener('click', closeDrawer);
  $('#drawer-close').addEventListener('click', closeDrawer);
  $('#drawer-back').addEventListener('click', closeDrawer);
  $('#drawer-save').addEventListener('click', submitDrawer);
  $('#confirm-no').addEventListener('click', () => closeConfirm(false));
  $('#confirm-yes').addEventListener('click', () => closeConfirm(true));
  $('#logout').addEventListener('click', async () => {
    try { sessionStorage.removeItem('sw-admin-ok'); } catch (e) {}
    if (window.AdminGate && window.AdminGate.active && window.AdminGate.signedIn) {
      try { await window.AdminGate.logout(); } catch (e) {}
    }
    location.reload();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if ($('#confirm-back').classList.contains('on')) closeConfirm(false);
      else if ($('#drawer').classList.contains('on')) closeDrawer();
    }
    /* Ctrl+S ile çekmeceyi kaydet */
    if ((e.ctrlKey || e.metaKey) && e.key === 's' && $('#drawer').classList.contains('on')) {
      e.preventDefault(); submitDrawer();
    }
  });

  window.addEventListener('hashchange', () => {
    const v = location.hash.slice(1);
    if (v && v !== currentView && VIEWS[v] && $('#shell').style.display !== 'none') go(v);
  });

  teBindDrag();
  AdminMedia.init();
  $('#btn-sync-all')?.addEventListener('click', syncAllToServer);
  initLogin();
});

/* v16 & v18: topluluk modülleri ve medya yöneticisi */
window.AdminCore = { DB, VIEWS, FILES, $, $$, toast, confirmBox, save, go, download, esc, biVal, renderSidebarState, current: () => currentView, AdminMedia, syncAllToServer };
window.AdminMedia = AdminMedia;

})();
