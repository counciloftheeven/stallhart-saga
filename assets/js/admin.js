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
const FILES = ['characters.json', 'chapters.json', 'quotes.json', 'lore.json', 'houses.json', 'kingdoms.json', 'geography.json', 'language.json'];

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
let searchQ = { chars: '', chapters: '', quotes: '', events: '', glossary: '', language: '', houses: '' };

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

/* ── KALICILIK ────────────────────────────────────────────── */
function save(file) {
  if (Store.write(file, DB[file])) {
    renderSidebarState();
    return true;
  }
  toast('Kaydedilemedi — tarayıcı depolama alanı dolu olabilir.', true);
  return false;
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
  dash:     { title: 'Pano', desc: 'Site içeriğinin genel durumu.', render: renderDash },
  chars:    { title: 'Karakter Yönetimi', desc: 'Karakter ekle, düzenle, sil.', render: renderChars, add: () => openCharEditor(null) },
  houses:   { title: 'Haneler', desc: 'Soylu hanelerin adı, sembolü, renkleri ve üyeleri.', render: renderHousesAdmin, add: () => openHouseEditor(null) },
  kingdoms: { title: 'Devletler', desc: 'Devlet / krallık maddeleri — bayrak, sicil, tarihçe, bölgesel harita, askerî ve iktisadi güç.', render: renderKingdoms, add: () => openKingdomEditor(null) },
  gods:     { title: 'Tanrılar', desc: 'Denge Konseyi tanrıları — bilgiler, sembol tarifi ve sembol görseli (tanrilar.html ile tanri-detay.html\'de aynı görsel kullanılır).', render: renderGods },
  chapters: { title: 'Bölüm & Kronik', desc: 'Hikâye bölümleri ve tarih şeridi olayları.', render: renderChapters, add: () => openChapterEditor(null) },
  events:   { title: 'Tarih Şeridi', desc: 'Kronolojik olaylar ve etiketleri.', render: renderEvents, add: () => openEventEditor(null) },
  glossary: { title: 'Sözlük', desc: 'Evren terimleri ansiklopedisi.', render: renderGlossary, add: () => openGlossaryEditor(null) },
  quotes:   { title: 'Sözler & Alıntılar', desc: 'Felsefi ve karakter sözleri veritabanı.', render: renderQuotes, add: () => openQuoteEditor(null) },
  media:    { title: 'Görsel & Medya', desc: 'Harita, portre ve arka plan görselleri.', render: renderMedia },
  geo:      { title: 'Coğrafya', desc: 'Eyalet detayları ve dünya güç sıralaması.', render: renderGeography, add: () => openProvinceEditor(null) },
  language: { title: 'Ortak Lisan', desc: 'Konlang sözlüğü — sözcük ekle, düzenle, sil.', render: renderLanguageAdmin, add: () => openWordEditor(null) },
  data:     { title: 'Veri & Yayın', desc: 'Dışa aktarma, içe aktarma ve sıfırlama.', render: renderDataView }
};

function go(view) {
  if (!VIEWS[view]) view = 'dash';
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

  const stats = [
    [chars.length, 'Karakter'],
    [chapters.filter(c => c.free).length + ' / ' + chapters.length, 'Yayınlanan Bölüm'],
    [quotes.length, 'Alıntı'],
    [events.length, 'Kronik Olayı'],
    [gloss.length, 'Sözlük Terimi'],
    [houses, 'Soylu Hane'],
    [(DB['kingdoms.json'].kingdoms || []).length, 'Devlet'],
    [(DB['lore.json'].gods || []).length, 'Tanrı']
  ];

  const drafts = Store.overriddenFiles();

  $('#view').innerHTML =
    '<div class="stat-grid">' +
    stats.map(s => '<div class="stat"><div class="stat-n">' + esc(s[0]) + '</div><div class="stat-l">' + esc(s[1]) + '</div></div>').join('') +
    '</div>' +

    (drafts.length
      ? '<div class="notice"><strong>Yayınlanmamış değişiklik var.</strong> ' +
        esc(drafts.join(', ')) + ' dosyaları yalnızca bu tarayıcıda güncel. ' +
        'Kalıcı hâle getirmek için <strong>Veri &amp; Yayın</strong> bölümünden dışa aktarıp ' +
        'depodaki <code>data/</code> klasörüne koyun.</div>'
      : '<div class="notice">Şu anda yerel taslak yok; site yayındaki ' +
        '<code>data/*.json</code> dosyalarını gösteriyor.</div>') +

    '<div class="panel"><div class="panel-t">Durum Dağılımı</div>' +
    STATUSES.map(st => {
      const n = chars.filter(c => c.status === st[0]).length;
      const pct = chars.length ? Math.round(n / chars.length * 100) : 0;
      return '<div style="margin-bottom:.6rem">' +
        '<div style="display:flex;justify-content:space-between;font-size:.8rem;color:var(--parchd);margin-bottom:.25rem">' +
        '<span>' + esc(st[1]) + '</span><span>' + n + ' · %' + pct + '</span></div>' +
        '<div style="height:4px;background:var(--deep);border:1px solid var(--border)">' +
        '<div style="height:100%;width:' + pct + '%;background:var(--gold)"></div></div></div>';
    }).join('') + '</div>' +

    '<div class="panel"><div class="panel-t">Hızlı İşlemler</div><div class="btn-row">' +
    '<button class="abtn" data-go="chars">Karakter Ekle</button>' +
    '<button class="abtn" data-go="chapters">Bölüm Ekle</button>' +
    '<button class="abtn" data-go="quotes">Alıntı Ekle</button>' +
    '<button class="abtn" data-go="data">Dışa Aktar</button>' +
    '<a class="abtn" href="index.html" target="_blank" rel="noopener">Siteyi Görüntüle ↗</a>' +
    '</div></div>';

  $$('#view [data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
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

function renderChapters() {
  const all = chapList();
  const q = searchQ.chapters.toLocaleLowerCase('tr');
  const rows = all.filter(c => !q ||
    biVal(c.title).toLocaleLowerCase('tr').includes(q) ||
    biVal(c.synopsis).toLocaleLowerCase('tr').includes(q));

  $('#view').innerHTML =
    toolbarHTML('chapters', 'Bölüm başlığı veya özet ara…', rows.length, all.length, 'bölüm') +
    (rows.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      '<th style="width:50px">No</th><th>Başlık</th><th>Yay</th><th>KS</th><th>Durum</th><th>Etiket</th><th></th>' +
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
          '<td style="font-size:.7rem;color:var(--goldd)">' + esc((ch.tags || []).map(t => '#' + t).join(' ') || '—') + '</td>' +
          '<td><div class="cell-acts">' +
          '<button class="abtn sm" data-edit="' + i + '">Düzenle</button>' +
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
          '<a class="abtn sm" href="tanri-detay.html?id=' + encodeURIComponent(g.id) + '" target="_blank" rel="noopener">Sayfa ↗</a>' +
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
    '<div class="notice">Her devletin sayfası <code>krallik-detay.html?id=…</code> adresinde tek şablonla üretilir. ' +
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
          '<a class="abtn sm" href="krallik-detay.html?id=' + encodeURIComponent(k.id) + '" target="_blank" rel="noopener">Sayfa ↗</a>' +
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
   7) GÖRSEL & MEDYA
   ═══════════════════════════════════════════════════════════ */
function renderMedia() {
  const portraits = charList().filter(c => c.image)
    .map(c => ({ name: biVal(c.name), path: c.image, use: 'Karakter portresi' }));
  const godImgs = godList().filter(g => g.image && !/^data:/.test(g.image) && Wiki.safeImg(g.image))
    .map(g => ({ name: (biVal(g.epithet) || g.trueName) + ' (' + g.trueName + ')', path: g.image, use: 'Tanrı sembolü · tanrilar.html + tanri-detay.html' }));
  const items = MEDIA.concat(portraits, godImgs);

  $('#view').innerHTML =
    '<div class="notice">Görseller depoya <code>assets/images/</code> altına elle yüklenir. ' +
    'Bu ekran yolları doğrular; kırık yollar <strong>kırmızı</strong> işaretlenir. ' +
    'GitHub Pages dosya adlarında <strong>büyük/küçük harf ayrımı</strong> yapar — ' +
    '<code>.PNG</code> ile <code>.png</code> farklı dosyalardır.</div>' +

    '<div class="panel"><div class="panel-t">Yol Denetimi</div>' +
    '<div class="btn-row"><button class="abtn" id="check-media">Tüm yolları denetle</button>' +
    '<span id="check-result" style="font-size:.8rem;color:var(--parchd);font-style:italic"></span></div></div>' +

    '<div class="media-grid">' +
    items.map((m, i) =>
      '<div class="media-card">' +
      '<img class="media-thumb" src="' + esc(m.path) + '" alt="" loading="lazy" data-mi="' + i + '">' +
      '<div class="media-meta">' +
      '<div class="media-name">' + esc(m.name) + '</div>' +
      '<div class="media-path">' + esc(m.path) + '</div>' +
      '<div class="media-status" id="ms-' + i + '">denetleniyor…</div>' +
      '<div class="media-path" style="color:var(--goldd)">' + esc(m.use) + '</div>' +
      '</div></div>').join('') +
    '</div>';

  /* Her görselin gerçekten yüklenip yüklenmediğini işaretle */
  $$('#view .media-thumb').forEach(img => {
    const st = $('#ms-' + img.dataset.mi);
    const mark = okFlag => {
      if (!st) return;
      st.className = 'media-status ' + (okFlag ? 'ok' : 'bad');
      st.textContent = okFlag ? '✓ yol geçerli' : '✕ dosya bulunamadı';
      if (!okFlag) img.style.visibility = 'hidden';
    };
    if (img.complete) mark(img.naturalWidth > 0);
    img.addEventListener('load', () => mark(true));
    img.addEventListener('error', () => mark(false));
  });

  const btn = $('#check-media');
  if (btn) btn.addEventListener('click', () => {
    const bad = $$('#view .media-status.bad').length;
    $('#check-result').textContent = bad
      ? bad + ' görsel bulunamadı.'
      : 'Tüm görsel yolları geçerli.';
  });
}

/* ═══════════════════════════════════════════════════════════
   8) VERİ & YAYIN
   ═══════════════════════════════════════════════════════════ */
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
  }));

  const expAll = $('#exp-all');
  if (expAll) expAll.addEventListener('click', () => {
    const list = Store.overriddenFiles();
    if (!list.length) return toast('İndirilecek değişiklik yok.', true);
    list.forEach((f, i) => setTimeout(() => download(f, JSON.stringify(DB[f], null, 2)), i * 320));
    toast(list.length + ' dosya indiriliyor…');
  });

  const imp = $('#imp-file');
  if (imp) imp.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const target = FILES.find(f => file.name.indexOf(f.replace('.json', '')) >= 0);
    if (!target) { toast('Dosya adı tanınmadı. characters/chapters/quotes/lore/houses/kingdoms bekleniyor.', true); return; }
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

function imageField(val) {
  return '<div class="f-row"><label class="f-label" for="f-image">Portre Görseli (yol)</label>' +
    '<input class="f-input" id="f-image" value="' + esc(val || '') + '" ' +
    'placeholder="assets/images/characters/ORNEK.jpg">' +
    '<div class="f-hint">Dosyayı depoya <code>assets/images/characters/</code> altına yükleyin, ' +
    'sonra yolunu buraya yazın. Boş bırakılırsa yer tutucu simge görünür.</div>' +
    '<div id="img-preview" style="display:none"></div></div>';
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
  $('#logout').addEventListener('click', () => {
    try { sessionStorage.removeItem('sw-admin-ok'); } catch (e) {}
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

  initLogin();
});

})();
