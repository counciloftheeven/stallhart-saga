/* ═══════════════════════════════════════════════════════════════
   STALLHART WIKI — YÖNETİM: BÖLÜM METNİ EDİTÖRÜ
   ---------------------------------------------------------------
   Bölümler → "Metni Düzenle" ile açılan tam ekran editör.
   Solda araç çubuklu metin kutusu, sağda okuyucuyla AYNI motorla
   (Wiki.Book.render) çizilen canlı önizleme.

   Güvenlik / dayanıklılık ilkeleri
   · Metin ham HTML olarak asla çalıştırılmaz (bkz. Wiki.Book).
   · Tüm yazma işlemleri tek yerden geçer (put) → tarayıcının kendi
     geri al/yinele geçmişi korunur.
   · Kaydedilmemiş değişiklik: kapatırken ve sekme kapanırken uyarı;
     2 sn'de bir otomatik taslak yedeği (çökme/yanlış kapama için).
   · Kaydetme başarısız olursa (depolama dolu) veri eski hâline döner.
   · Görseller metinde img:g1 gibi kısa anahtarla anılır; ağır veri
     textarea'ya girmez.
   ═══════════════════════════════════════════════════════════════ */
(function () {
'use strict';

const A = window.AdminBridge;
if (!A || !window.Wiki || !window.Wiki.Book) return;
const { Book } = window.Wiki;
const esc = A.esc;

const AUTOSAVE_KEY = 'sw-bk-autosave';
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
const tr = s => String(s || '');

let S = null;            /* açık editörün durumu — kapalıyken null */
let indexCache = null;   /* Wiki dizini (karakter/tanrı/hane/devlet/yer) */
let indexPromise = null;
let autosaveT = null, previewT = null;

/* ── Wiki dizini ─────────────────────────────────────────────── */
function ensureIndex() {
  if (indexCache) return Promise.resolve(indexCache);
  if (!indexPromise) {
    indexPromise = Book.buildIndex().then(i => { indexCache = i; return i; })
      .catch(e => { console.warn('Wiki dizini kurulamadı:', e); indexPromise = null; indexCache = []; return []; });
  }
  return indexPromise;
}

/* ── Küçük yardımcılar ───────────────────────────────────────── */
function nextImageKey(images) {
  let n = 1; while (images['g' + n] !== undefined) n++;
  return 'g' + n;
}
function dataToBlob(dataUrl) {
  const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl); if (!m) return null;
  const bin = atob(m[2]), arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: m[1] });
}
function downloadImage(key, dataUrl) {
  const blob = dataToBlob(dataUrl); if (!blob) return A.toast('Bu görsel gömülü değil (depo yolu).', true);
  const ext = /png/.test(blob.type) ? 'png' : /webp/.test(blob.type) ? 'webp' : 'jpg';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'bolum-' + S.id + '-' + key + '.' + ext;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
}
const kb = s => Math.round(String(s || '').length * 0.75 / 1024);
function imagesInText(md) {
  const set = {}; const re = /!\[[^\]]*\]\(img:([A-Za-z0-9_-]+)/g; let m;
  while ((m = re.exec(md))) set[m[1]] = true;
  return set;
}
/* Aktif dilin GÜNCEL (kaydedilmemiş) metni + diğer dilin metni: görsel kullanım denetimi için */
function allText() {
  const other = S.lang === 'tr' ? 'en' : 'tr';
  return S.ta.value + '\n' + S.text[other];
}

/* ═══ MODAL (editörün içinde, odak tuzaklı, Esc ile kapanır) ═══ */
function modal(title, bodyHTML, footHTML, opts) {
  opts = opts || {};
  const back = document.createElement('div');
  back.className = 'bk-modal-back';
  back.innerHTML = '<div class="bk-modal" role="dialog" aria-modal="true" aria-labelledby="bk-m-t" style="' + (opts.wide ? 'max-width:46rem' : '') + '">' +
    '<div class="bk-m-h"><h3 id="bk-m-t">' + esc(title) + '</h3><button type="button" class="bk-x" data-mclose aria-label="Kapat">×</button></div>' +
    '<div class="bk-m-b">' + bodyHTML + '</div>' +
    (footHTML ? '<div class="bk-m-f">' + footHTML + '</div>' : '') + '</div>';
  S.root.appendChild(back);
  const prevFocus = document.activeElement;
  const api = {
    el: back,
    close() {
      if (!back.parentNode) return;
      back.remove(); S.modals = S.modals.filter(m => m !== api);
      if (opts.onClose) opts.onClose();
      if (prevFocus && prevFocus.focus && document.contains(prevFocus)) prevFocus.focus();
    }
  };
  S.modals.push(api);
  back.addEventListener('click', e => { if (e.target === back || e.target.closest('[data-mclose]')) api.close(); });
  back.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.stopPropagation(); api.close(); return; }
    if (e.key === 'Tab') {
      const f = $$('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]', back).filter(x => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  const first = $('[data-autofocus]', back) || $('input, textarea, select, button:not([data-mclose])', back);
  if (first) setTimeout(() => first.focus(), 30);
  return api;
}

/* ═══ METİN İŞLEMLERİ (tek geçit: put) ═══ */
function put(start, end, str, selStart, selEnd) {
  const t = S.ta;
  t.focus(); t.setSelectionRange(start, end);
  let done = false;
  try { done = document.execCommand('insertText', false, str); } catch (e) { done = false; }
  if (!done || t.value.substr(start, str.length) !== str) {      /* execCommand desteklenmiyorsa yedek yol */
    t.setRangeText(str, start, end, 'end');
    t.dispatchEvent(new Event('input', { bubbles: true }));
  }
  if (selStart != null) t.setSelectionRange(selStart, selEnd != null ? selEnd : selStart);
}
function setWhole(newText) {
  const t = S.ta; const y = t.scrollTop;
  put(0, t.value.length, newText, 0, 0);
  t.scrollTop = y;
}
function selInfo() { const t = S.ta; return { s: t.selectionStart, e: t.selectionEnd, v: t.value }; }

/* Boş seçimde imlecin altındaki sözcüğü seç */
function expandToWord(v, s, e) {
  if (s !== e) return [s, e];
  const W = /[\p{L}\p{N}’'_-]/u;
  let a = s, b = e;
  while (a > 0 && W.test(v[a - 1])) a--;
  while (b < v.length && W.test(v[b])) b++;
  return [a, b];
}

function toggleWrap(marker) {
  const { s, e, v } = selInfo();
  let [a, b] = expandToWord(v, s, e);
  const m = marker.length;
  let sel = v.slice(a, b);
  /* boşluklar işaretlerin dışında kalsın */
  const lead = sel.length - sel.replace(/^\s+/, '').length;
  const trail = sel.length - sel.replace(/\s+$/, '').length;
  a += lead; b -= trail; sel = v.slice(a, b);

  if (!sel) {                                            /* hiçbir şey seçili değil → örnek metin */
    const ph = 'metin';
    put(s, e, marker + ph + marker, s + m, s + m + ph.length); return;
  }
  const starRun = (str, dir) => { let n = 0, i = dir < 0 ? str.length - 1 : 0; while (str[i] === '*') { n++; i += dir; } return n; };
  if (sel.length > 2 * m && sel.startsWith(marker) && sel.endsWith(marker) &&
      starRun(sel, 1) === m && starRun(sel, -1) === m) {                 /* seçimin kendisi sarılı → aç */
    const inner = sel.slice(m, -m); put(a, b, inner, a, a + inner.length); return;
  }
  const before = v.slice(Math.max(0, a - m - 3), a), after = v.slice(b, b + m + 3);
  if (before.endsWith(marker) && after.startsWith(marker) && starRun(before, -1) === m && starRun(after, 1) === m) {
    put(a - m, b + m, sel, a - m, a - m + sel.length); return;           /* çevresi sarılı → aç */
  }
  put(a, b, marker + sel + marker, a + m, a + m + sel.length);
}

function lineRange() {
  const { s, e, v } = selInfo();
  const ls = v.lastIndexOf('\n', s - 1) + 1;
  const endRef = (e > s && v[e - 1] === '\n') ? e - 1 : e;
  let le = v.indexOf('\n', endRef); if (le < 0) le = v.length;
  return { ls, le, v };
}
function toggleHeading(level) {
  const { ls, le, v } = lineRange();
  const prefix = '#'.repeat(level) + ' ';
  const lines = v.slice(ls, le).split('\n');
  const all = lines.filter(l => l.trim()).every(l => l.startsWith(prefix));
  const out = lines.map(l => {
    if (!l.trim()) return l;
    const bare = l.replace(/^#{2,3}\s+/, '').replace(/^>\s?/, '');
    return all ? bare : prefix + bare;
  }).join('\n');
  put(ls, le, out, ls, ls + out.length);
}
function toggleQuote() {
  const { ls, le, v } = lineRange();
  const lines = v.slice(ls, le).split('\n');
  const all = lines.filter(l => l.trim()).every(l => /^>/.test(l.trim()));
  const out = lines.map(l => all ? l.replace(/^\s*>\s?/, '') : (l.trim() ? '> ' + l.replace(/^#{2,3}\s+/, '') : '>')).join('\n');
  put(ls, le, out, ls, ls + out.length);
}
function insertBreak() {
  const { s, e, v } = selInfo();
  const before = v.slice(0, s), after = v.slice(e);
  const pre = !before ? '' : before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
  const suf = !after ? '\n' : after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n';
  const str = pre + '---' + suf;
  put(s, e, str, s + str.length, s + str.length);
}
/* Görsel: imlecin bulunduğu paragrafın altına eklenir (paragrafı bölmez) */
function insertBlockAfterParagraph(line) {
  const { e, v } = selInfo();
  let p = v.indexOf('\n\n', e); if (p < 0) p = v.length;
  const pre = p === 0 ? '' : '\n\n';
  const suf = p >= v.length ? '\n' : '';
  const str = pre + line + suf;
  put(p, p, str, p + str.length, p + str.length);
}

/* İmleç/seçim altındaki köprü(ler) */
const LINK_RE = /\[([^\]\n]*)\]\(([^)\s\n]*)\)/g;
function linksInRange(v, s, e) {
  const out = []; let m; LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(v))) {
    const a = m.index, b = a + m[0].length;
    if (m.index > 0 && v[m.index - 1] === '!') continue;              /* görsel satırı değil */
    if ((s === e && s >= a && s <= b) || (s !== e && a < e && b > s)) out.push({ a: a, b: b, label: m[1], href: m[2] });
  }
  return out;
}
function removeLinks() {
  const { s, e, v } = selInfo();
  const list = linksInRange(v, s, e);
  if (!list.length) return A.toast('İmlecin altında kaldırılacak bir bağlantı yok.', true);
  const a = list[0].a, b = list[list.length - 1].b;
  const rep = v.slice(a, b).replace(LINK_RE, (m0, lab) => lab);
  put(a, b, rep, a, a + rep.length);
  A.toast(list.length + ' bağlantı kaldırıldı.');
}

/* ═══ WİKİ KÖPRÜSÜ SEÇİCİ ═══ */
const TYPE_ORDER = ['character', 'god', 'house', 'kingdom', 'place'];
const TYPE_LABEL = { character: 'Karakter', god: 'Tanrı', house: 'Hane', kingdom: 'Devlet', place: 'Şehir / Eyalet' };
const normQ = s => tr(s).toLocaleLowerCase('tr');

async function openLinkPicker() {
  const { s, e, v } = selInfo();
  const existing = linksInRange(v, s, e).filter(l => /^wiki:/.test(l.href))[0];
  let label = existing ? existing.label : v.slice(s, e).trim();
  if (/\n/.test(label)) return A.toast('Bağlantı için tek satırlık bir metin seçin.', true);

  const api = modal(existing ? 'Wiki bağlantısını değiştir' : 'Wiki bağlantısı ekle',
    '<p class="bk-hint">' + (label ? 'Bağlanacak metin: <strong>' + esc(label) + '</strong>' : 'Metin seçmediniz — seçtiğiniz sayfanın adı eklenecek.') +
    ' Bağlantı kalın görünür ve okuyucuda <strong>yeni sekmede</strong> açılır.</p>' +
    '<input class="f-input" id="bk-lp-q" data-autofocus placeholder="Ad ara… (ör. Erthan, Zetus, Arathen, Arava)" autocomplete="off" value="' + esc(label) + '">' +
    '<div class="bk-chips" id="bk-lp-t"></div><div class="bk-results" id="bk-lp-r" role="listbox" aria-label="Sonuçlar"><div class="bk-empty">Dizin yükleniyor…</div></div>',
    '<button type="button" class="abtn" data-mclose>Vazgeç</button>');
  const qEl = $('#bk-lp-q', api.el), rEl = $('#bk-lp-r', api.el), tEl = $('#bk-lp-t', api.el);
  let type = 'all', idx = [];

  function draw() {
    const q = normQ(qEl.value.trim());
    tEl.innerHTML = ['all'].concat(TYPE_ORDER).map(t =>
      '<button type="button" class="bk-chip' + (type === t ? ' on' : '') + '" data-t="' + t + '">' + (t === 'all' ? 'Tümü' : TYPE_LABEL[t]) + '</button>').join('');
    const res = idx.filter(x => (type === 'all' || x.type === type) &&
      (!q || normQ(x.name).includes(q) || (x.names || []).some(n => normQ(n).includes(q)) || normQ(x.sub).includes(q)));
    const shown = res.slice(0, 60);
    rEl.innerHTML = shown.length ? shown.map((x, i) =>
      '<button type="button" class="bk-res" role="option" data-i="' + idx.indexOf(x) + '"><span class="bk-res-n">' + esc(x.name) + '</span>' +
      '<span class="bk-res-s">' + esc(TYPE_LABEL[x.type]) + (x.sub ? ' · ' + esc(x.sub) : '') + '</span></button>').join('') +
      (res.length > 60 ? '<div class="bk-empty">' + (res.length - 60) + ' sonuç daha var — aramayı daraltın.</div>' : '')
      : '<div class="bk-empty">Eşleşen sayfa yok.</div>';
  }
  function pick(x) {
    const cur = selInfo();                       /* modal açıkken seçim değişmemiş olmalı; yine de tazele */
    const name = (x.names && x.names[0]) || x.name;
    const lab = (label || name).replace(/[\[\]]/g, m0 => '\\' + m0);
    const link = '[' + lab + '](wiki:' + x.type + ':' + x.id + ')';
    if (existing) put(existing.a, existing.b, link, existing.a, existing.a + link.length);
    else put(s, e, link, s + link.length, s + link.length);
    api.close(); A.toast('Bağlantı: ' + x.name);
  }
  qEl.addEventListener('input', draw);
  qEl.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') { ev.preventDefault(); const b = $('.bk-res', rEl); if (b) pick(idx[+b.dataset.i]); }
    if (ev.key === 'ArrowDown') { ev.preventDefault(); const b = $('.bk-res', rEl); if (b) b.focus(); }
  });
  api.el.addEventListener('click', ev => {
    const c = ev.target.closest('.bk-chip'); if (c) { type = c.dataset.t; draw(); qEl.focus(); return; }
    const r = ev.target.closest('.bk-res'); if (r) pick(idx[+r.dataset.i]);
  });
  rEl.addEventListener('keydown', ev => {
    const list = $$('.bk-res', rEl), i = list.indexOf(document.activeElement);
    if (ev.key === 'ArrowDown' && i < list.length - 1) { ev.preventDefault(); list[i + 1].focus(); }
    if (ev.key === 'ArrowUp') { ev.preventDefault(); if (i > 0) list[i - 1].focus(); else qEl.focus(); }
  });
  idx = await ensureIndex(); draw();
}

/* ═══ OTOMATİK ÖNER ═══ */
async function openSuggest() {
  const api = modal('Otomatik bağlantı önerisi', '<div class="bk-empty">Metin taranıyor…</div>', '', { wide: true });
  const idx = await ensureIndex();
  if (!api.el.parentNode) return;
  const found = Book.suggest(S.ta.value, idx);
  if (!found.length) {
    $('.bk-m-b', api.el).innerHTML = '<div class="bk-empty">Bağlanabilecek yeni bir ad bulunamadı (mevcut bağlantılar atlanır).</div>';
    $('.bk-m-h', api.el).insertAdjacentHTML('afterend', '');
    return;
  }
  const rows = found.map(f => ({ f: f, on: !f.ambiguous, sel: f.ambiguous ? -1 : 0 }));
  const body = $('.bk-m-b', api.el);
  body.innerHTML =
    '<p class="bk-hint"><strong>' + found.length + '</strong> ad bulundu. İşaretlediklerinizin ilk geçtiği yer bağlanır (aşağıdan değiştirilebilir). ' +
    'Birden çok sayfaya uyan adlar (⚠) için hangisini istediğinizi siz seçin. Hiçbir şey siz onaylamadan değişmez.</p>' +
    '<div class="bk-sg-tools"><button type="button" class="abtn sm" id="bk-sg-all">Tümünü işaretle</button>' +
    '<button type="button" class="abtn sm" id="bk-sg-none">Tümünü kaldır</button></div>' +
    '<div class="bk-sg" id="bk-sg"></div>' +
    '<div class="bk-sg-opt"><label><input type="radio" name="bk-sg-mode" value="first" checked> Her adı yalnızca <strong>ilk geçtiği yerde</strong> bağla (önerilen)</label>' +
    '<label><input type="radio" name="bk-sg-mode" value="all"> Her geçtiği yerde bağla</label></div>';
  $('.bk-m-h', api.el).parentNode.insertAdjacentHTML('beforeend',
    '<div class="bk-m-f"><span class="bk-hint" id="bk-sg-n" style="margin-right:auto"></span>' +
    '<button type="button" class="abtn" data-mclose>Vazgeç</button><button type="button" class="abtn primary" id="bk-sg-ok">Bağlantıları ekle</button></div>');
  const list = $('#bk-sg', api.el);

  function draw() {
    list.innerHTML = rows.map((r, i) => {
      const f = r.f;
      const opts = f.ambiguous
        ? '<select class="f-select" data-i="' + i + '" aria-label="' + esc(f.text) + ' için sayfa"><option value="-1">— seçin —</option>' +
          f.cands.map((c, k) => '<option value="' + k + '"' + (r.sel === k ? ' selected' : '') + '>' + esc(TYPE_LABEL[c.type] + ' · ' + c.name + (c.sub ? ' (' + c.sub + ')' : '')) + '</option>').join('') + '</select>'
        : '<span class="bk-sg-one">' + esc(TYPE_LABEL[f.cands[0].type]) + ' · ' + esc(f.cands[0].name) + '</span>';
      return '<div class="bk-sg-row"><label class="bk-sg-c"><input type="checkbox" data-i="' + i + '"' + (r.on ? ' checked' : '') + '>' +
        '<strong>' + esc(f.text) + '</strong><span class="bk-sg-k">' + f.count + '×' + (f.ambiguous ? ' ⚠' : '') + '</span></label>' + opts + '</div>';
    }).join('');
    const n = rows.filter(r => r.on && r.sel >= 0).length;
    $('#bk-sg-n', api.el).textContent = n + ' ad bağlanacak';
  }
  api.el.addEventListener('change', ev => {
    const i = ev.target.dataset && ev.target.dataset.i; if (i == null) return;
    if (ev.target.type === 'checkbox') rows[i].on = ev.target.checked;
    else { rows[i].sel = +ev.target.value; if (rows[i].sel >= 0) rows[i].on = true; }
    draw();
  });
  $('#bk-sg-all', api.el).onclick = () => { rows.forEach(r => { if (r.sel >= 0) r.on = true; }); draw(); };
  $('#bk-sg-none', api.el).onclick = () => { rows.forEach(r => { r.on = false; }); draw(); };
  $('#bk-sg-ok', api.el).onclick = () => {
    const all = (api.el.querySelector('input[name="bk-sg-mode"]:checked') || {}).value === 'all';
    const picks = rows.filter(r => r.on && r.sel >= 0).map(r => ({ text: r.f.text, type: r.f.cands[r.sel].type, id: r.f.cands[r.sel].id, all: all }));
    if (!picks.length) return A.toast('İşaretli ad yok.', true);
    const before = Book.findLinks(S.ta.value).length;
    setWhole(Book.applyLinks(S.ta.value, picks));
    api.close(); A.toast((Book.findLinks(S.ta.value).length - before) + ' bağlantı eklendi. Geri almak için Ctrl+Z.');
  };
  draw();
}

/* ═══ GÖRSEL EKLE / DÜZENLE ═══ */
const IMG_LINE = /^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)\s*$/;
function currentImageLine() {
  const { s, v } = selInfo();
  const ls = v.lastIndexOf('\n', s - 1) + 1; let le = v.indexOf('\n', s); if (le < 0) le = v.length;
  const m = IMG_LINE.exec(v.slice(ls, le));
  return m ? { ls: ls, le: le, alt: m[1], src: m[2], opt: m[3] || '' } : null;
}
function srcOf(src) {
  const k = /^img:([A-Za-z0-9_-]+)$/.exec(src);
  return k ? (S.images[k[1]] || '') : src;
}
function openImageDialog(forceNew) {
  const ex = forceNew ? null : currentImageLine();
  const optSize = ex && (/boyut=(kucuk|orta|tam)/.exec(ex.opt) || [])[1] || 'orta';
  const optAlign = ex && (/hiza=(sol|orta|sag)/.exec(ex.opt) || [])[1] || 'orta';
  let pending = null;                              /* yeni yüklenen: { dataUrl } */
  let curSrc = ex ? ex.src : '';

  const api = modal(ex ? 'Görseli düzenle' : 'Görsel ekle',
    '<div class="f-row"><label class="f-label" for="bk-im-f">Dosya yükle</label>' +
    '<input type="file" id="bk-im-f" accept="image/png,image/jpeg,image/webp" data-autofocus>' +
    '<div class="f-hint">Büyük görseller 1400 px\'e küçültülür. Şeffaf PNG şeffaf kalır. Yüklenen görsel metne gömülü tutulur — yayın için <em>Görseller → İndir</em> ile alıp depoya koymanız önerilir.</div></div>' +
    '<div class="f-row"><label class="f-label" for="bk-im-p">Ya da depo yolu</label>' +
    '<input class="f-input" id="bk-im-p" placeholder="assets/images/chapters/bolum-1-harita.jpg" value="' + esc(/^img:/.test(curSrc) ? '' : curSrc) + '"></div>' +
    '<div class="bk-im-prev" id="bk-im-prev"></div>' +
    '<div class="f-row"><label class="f-label" for="bk-im-a">Alt yazı (görselin altında görünür, ekran okuyucular için açıklama)</label>' +
    '<textarea class="f-area" id="bk-im-a" rows="2" style="min-height:60px">' + esc(ex ? ex.alt : '') + '</textarea>' +
    '<div class="f-hint">Kalın/italik kullanabilirsiniz: **kalın**, *italik*.</div></div>' +
    '<div class="f-row half"><div><label class="f-label" for="bk-im-s">Boyut</label><select class="f-select" id="bk-im-s">' +
    [['kucuk', 'Küçük'], ['orta', 'Orta'], ['tam', 'Tam genişlik']].map(o => '<option value="' + o[0] + '"' + (o[0] === optSize ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div>' +
    '<div><label class="f-label" for="bk-im-h">Hizalama</label><select class="f-select" id="bk-im-h">' +
    [['orta', 'Ortada'], ['sol', 'Solda (yazı sağdan akar)'], ['sag', 'Sağda (yazı soldan akar)']].map(o => '<option value="' + o[0] + '"' + (o[0] === optAlign ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div></div>' +
    '<div class="f-hint" id="bk-im-err" style="color:var(--bloodb)"></div>' +
    (ex ? '' : '<div class="f-hint">Görsel, imlecin bulunduğu <strong>paragrafın altına</strong> eklenir.</div>'),
    (ex ? '<button type="button" class="abtn danger" id="bk-im-del" style="margin-right:auto">Görseli metinden kaldır</button>' : '') +
    '<button type="button" class="abtn" data-mclose>Vazgeç</button><button type="button" class="abtn primary" id="bk-im-ok">' + (ex ? 'Güncelle' : 'Ekle') + '</button>');

  const fEl = $('#bk-im-f', api.el), pEl = $('#bk-im-p', api.el), prev = $('#bk-im-prev', api.el), err = $('#bk-im-err', api.el);
  const sEl = $('#bk-im-s', api.el), hEl = $('#bk-im-h', api.el);
  const syncAlign = () => { hEl.disabled = sEl.value === 'tam'; };
  sEl.addEventListener('change', syncAlign); syncAlign();

  function paint() {
    const url = pending ? pending.dataUrl : (pEl.value.trim() ? Wiki.safeImg(pEl.value.trim()) : Wiki.safeImg(srcOf(curSrc)));
    const shown = url && !/^(data:|https?:)/i.test(url) ? url : url;
    prev.innerHTML = shown ? '<img alt="Önizleme" src="' + esc(shown) + '"><div class="f-hint">' + (pending ? 'Yüklenen: ~' + kb(pending.dataUrl) + ' KB' : '') + '</div>' : '';
    const im = $('img', prev); if (im) im.addEventListener('error', () => { prev.innerHTML = '<div class="f-hint" style="color:var(--bloodb)">Görsel bulunamadı — yolu kontrol edin.</div>'; });
  }
  fEl.addEventListener('change', async () => {
    const f = fEl.files && fEl.files[0]; if (!f) return;
    err.textContent = '';
    try {
      const d = await A.kgProcessImage(f, { maxW: 1400, maxH: 1400, keepPng: true, limit: 650000 });
      pending = { dataUrl: d }; pEl.value = ''; paint();
      if (kb(d) > 900) err.textContent = 'Uyarı: görsel ~' + kb(d) + ' KB — tarayıcı depolamasını hızla doldurabilir. Depo yolu kullanmayı düşünün.';
    } catch (ex2) { err.textContent = ex2.message || 'Görsel okunamadı.'; }
  });
  pEl.addEventListener('input', () => { if (pEl.value.trim()) pending = null; paint(); });
  paint();

  if (ex) $('#bk-im-del', api.el).onclick = () => { put(ex.ls, ex.le, '', ex.ls, ex.ls); api.close(); A.toast('Görsel metinden kaldırıldı.'); };
  $('#bk-im-ok', api.el).onclick = () => {
    let src;
    if (pending) { const key = nextImageKey(S.images); S.images[key] = pending.dataUrl; src = 'img:' + key; }
    else if (pEl.value.trim()) {
      if (!Wiki.safeImg(pEl.value.trim())) { err.textContent = 'Geçersiz yol. Örnek: assets/images/chapters/bolum-1.jpg'; return; }
      src = pEl.value.trim();
    } else if (ex) src = ex.src;
    else { err.textContent = 'Bir dosya yükleyin veya depo yolu yazın.'; return; }
    const alt = $('#bk-im-a', api.el).value.replace(/\s*\n\s*/g, ' ').replace(/\]/g, ')').trim();
    const opt = 'boyut=' + sEl.value + (sEl.value === 'tam' ? '' : ' hiza=' + hEl.value);
    const line = '![' + alt + '](' + src + ' "' + opt + '")';
    if (ex) put(ex.ls, ex.le, line, ex.ls + line.length, ex.ls + line.length);
    else insertBlockAfterParagraph(line);
    markDirty(); api.close(); A.toast(ex ? 'Görsel güncellendi.' : 'Görsel eklendi.');
  };
}

/* ═══ GÖRSELLER KÜTÜPHANESİ ═══ */
function openLibrary() {
  const api = modal('Bu bölümün görselleri', '<div id="bk-lib"></div>',
    '<span class="bk-hint" id="bk-lib-t" style="margin-right:auto"></span><button type="button" class="abtn" data-mclose>Kapat</button>', { wide: true });
  function draw() {
    const keys = Object.keys(S.images), used = imagesInText(allText());
    const total = keys.reduce((n, k) => n + (/^data:/.test(S.images[k]) ? kb(S.images[k]) : 0), 0);
    $('#bk-lib-t', api.el).textContent = keys.length ? 'Gömülü toplam: ~' + total + ' KB' : '';
    $('#bk-lib', api.el).innerHTML = keys.length ? keys.map(k => {
      const v = S.images[k], isData = /^data:/.test(v);
      return '<div class="bk-lib-row"><img alt="" src="' + esc(Wiki.safeImg(v) || '') + '">' +
        '<div class="bk-lib-i"><strong>' + esc(k) + '</strong><div class="f-hint">' + (isData ? 'gömülü · ~' + kb(v) + ' KB' : esc(v)) + ' · ' +
        (used[k] ? 'metinde kullanılıyor' : '<span style="color:var(--goldd)">kullanılmıyor</span>') + '</div></div>' +
        '<div class="cell-acts"><button type="button" class="abtn sm" data-a="dl" data-k="' + esc(k) + '"' + (isData ? '' : ' disabled') + '>İndir</button>' +
        '<button type="button" class="abtn sm danger" data-a="rm" data-k="' + esc(k) + '"' + (used[k] ? ' disabled title="Önce metinden kaldırın"' : '') + '>Sil</button></div></div>';
    }).join('') : '<div class="bk-empty">Bu bölümde yüklenmiş görsel yok. Araç çubuğundan <em>Görsel</em> ile ekleyin.</div>';
  }
  api.el.addEventListener('click', ev => {
    const b = ev.target.closest('[data-a]'); if (!b) return;
    const k = b.dataset.k;
    if (b.dataset.a === 'dl') downloadImage(k, S.images[k]);
    if (b.dataset.a === 'rm') { delete S.images[k]; markDirty(); schedulePreview(); draw(); }
  });
  draw();
}

/* ═══ KIRIK BAĞLANTI DENETİMİ ═══ */
function brokenLinks() {
  if (!indexCache || !indexCache.length) return [];
  const have = {}; indexCache.forEach(e => { have[e.type + ':' + e.id] = true; });
  const seen = {}, out = [];
  Book.findLinks(S.ta.value).forEach(l => {
    const k = l.type + ':' + l.id;
    if (!have[k] && !seen[k]) { seen[k] = true; out.push(l); }
  });
  return out;
}
function openBroken() {
  const list = brokenLinks();
  const api = modal('Kırık Wiki bağlantıları',
    list.length ? '<p class="bk-hint">Bu bağlantıların hedef sayfası artık bulunamıyor (silinmiş ya da kimliği değişmiş olabilir). Okuyucuda "bulunamadı" sayfasına götürürler.</p>' +
      list.map((l, i) => '<div class="bk-lib-row"><div class="bk-lib-i"><strong>' + esc(l.label) + '</strong><div class="f-hint">' + esc(TYPE_LABEL[l.type] || l.type) + ' · ' + esc(l.id) + '</div></div>' +
        '<button type="button" class="abtn sm danger" data-i="' + i + '">Bağlantıyı kaldır</button></div>').join('')
      : '<div class="bk-empty">Kırık bağlantı yok.</div>', '<button type="button" class="abtn" data-mclose>Kapat</button>');
  api.el.addEventListener('click', ev => {
    const b = ev.target.closest('[data-i]'); if (!b) return;
    const l = list[+b.dataset.i], esc2 = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('\\[([^\\]\\n]*)\\]\\(wiki:' + esc2(l.type) + ':' + esc2(l.id) + '\\)', 'g');
    setWhole(S.ta.value.replace(re, (m0, lab) => lab)); api.close(); A.toast('Bağlantı kaldırıldı.');
  });
}

/* ═══ DURUM, ÖNİZLEME, KAYIT ═══ */
function markDirty() {
  if (!S) return;
  S.dirty = true; $('.bk-dirty', S.root).hidden = false;
  clearTimeout(autosaveT); autosaveT = setTimeout(autosave, 1800);
}
function autosave() {
  if (!S || !S.dirty) return;
  S.text[S.lang] = S.ta.value;
  try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ id: S.id, tr: S.text.tr, en: S.text.en, free: S.free, t: Date.now() })); } catch (e) {}
}
function clearAutosave() { try { localStorage.removeItem(AUTOSAVE_KEY); } catch (e) {} }

function schedulePreview() { clearTimeout(previewT); previewT = setTimeout(updatePreview, 90); }
function updatePreview() {
  if (!S) return;
  const v = S.ta.value;
  S.prev.innerHTML = v.trim() ? Book.render(v, { images: S.images })
    : '<p class="bk-empty">Yazdıkça önizleme burada görünür.</p>';
  const w = Book.words(v), broken = brokenLinks(), links = Book.findLinks(v).length;
  $('.bk-stat', S.root).textContent = w.toLocaleString('tr-TR') + ' kelime · ≈ ' + Book.minutes(v) + ' dk · ' + links + ' bağlantı';
  const bb = $('.bk-broken', S.root);
  bb.hidden = !broken.length; bb.textContent = '⚠ ' + broken.length + ' kırık bağlantı';
}

function switchLang(lang) {
  if (lang === S.lang) return;
  S.text[S.lang] = S.ta.value;
  S.lang = lang; S.ta.value = S.text[lang];
  S.ta.placeholder = lang === 'tr' ? 'Bölüm metnini buraya yazın veya yapıştırın…'
    : 'İngilizce çeviri (boş bırakılırsa okuyucuda Türkçe metin gösterilir)…';
  $$('.bk-lang', S.root).forEach(b => b.setAttribute('aria-selected', String(b.dataset.l === lang)));
  S.ta.setSelectionRange(0, 0); S.ta.scrollTop = 0;
  updatePreview();
}

function saveNow(silent) {
  S.text[S.lang] = S.ta.value;
  const DB = A.DB, bk = DB['book.json'];
  bk.chapters = bk.chapters || {};
  const snapBook = JSON.stringify(bk);
  const has = S.text.tr.trim() || S.text.en.trim() || Object.keys(S.images).length;
  if (has) bk.chapters[String(S.id)] = { text: { tr: S.text.tr, en: S.text.en }, images: S.images };
  else delete bk.chapters[String(S.id)];
  const ch = A.chapList().find(c => c.id === S.id);
  const freeChanged = ch && ch.free !== S.free;
  if (freeChanged) ch.free = S.free;

  if (!A.save('book.json')) {
    DB['book.json'] = JSON.parse(snapBook);
    if (freeChanged) ch.free = !S.free;
    A.toast('Kaydedilemedi: tarayıcı depolaması dolmuş olabilir. Gömülü görselleri silin veya depo yolu kullanın. Metniniz editörde duruyor.', true);
    return false;
  }
  if (freeChanged && !A.save('chapters.json')) { ch.free = !S.free; A.toast('Yayın durumu kaydedilemedi.', true); return false; }
  S.dirty = false; $('.bk-dirty', S.root).hidden = true; clearAutosave();
  if (!silent) A.toast('Bölüm metni kaydedildi.' + (S.free ? '' : ' (Bölüm henüz "Kilitli" — okuyucuda görünmez.)'));
  A.refreshChapters();
  return true;
}

function requestClose() {
  if (!S) return;
  S.text[S.lang] = S.ta.value;
  if (!S.dirty) return closeEditor();
  const api = modal('Kaydedilmemiş değişiklikler var', '<p>Bu bölümde kaydedilmemiş değişiklikler var. Ne yapmak istersiniz?</p>',
    '<button type="button" class="abtn" data-mclose>Düzenlemeye dön</button>' +
    '<button type="button" class="abtn danger" id="bk-c-drop">Kaydetmeden kapat</button>' +
    '<button type="button" class="abtn primary" id="bk-c-save">Kaydet ve kapat</button>');
  $('#bk-c-drop', api.el).onclick = () => { S.dirty = false; clearAutosave(); api.close(); closeEditor(); };
  $('#bk-c-save', api.el).onclick = () => { if (saveNow()) { api.close(); closeEditor(); } else api.close(); };
}
function closeEditor() {
  clearTimeout(autosaveT); clearTimeout(previewT);
  const shell = document.getElementById('shell'); if (shell) shell.inert = false;
  const back = S.opener; S.root.remove(); S = null;
  document.body.classList.remove('bk-open');
  if (back && back.focus && document.contains(back)) back.focus();
}

/* ═══ EDİTÖRÜ AÇ ═══ */
function build(ch, entry) {
  const root = document.createElement('div');
  root.className = 'bk-ed'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Bölüm metni editörü');
  root.innerHTML =
    '<header class="bk-top">' +
    '<button type="button" class="abtn" id="bk-close">← Kapat</button>' +
    '<div class="bk-ttl"><span class="bk-ttl-n">' + esc(ch.num) + '. ' + esc(Wiki.Lang.t(ch.title) || 'Bölüm') + '</span>' +
    '<span class="bk-dirty" hidden>● kaydedilmedi</span></div>' +
    '<div class="bk-langs" role="tablist" aria-label="Dil"><button type="button" role="tab" class="bk-lang" data-l="tr" aria-selected="true">Türkçe</button>' +
    '<button type="button" role="tab" class="bk-lang" data-l="en" aria-selected="false">English</button></div>' +
    '<button type="button" class="abtn primary" id="bk-save" title="Ctrl+S">Kaydet</button></header>' +

    '<div class="bk-tools" role="toolbar" aria-label="Biçimlendirme">' +
    '<button type="button" data-c="bold" title="Kalın (Ctrl+B)" aria-label="Kalın"><b>B</b></button>' +
    '<button type="button" data-c="italic" title="İtalik (Ctrl+I)" aria-label="İtalik"><i>I</i></button>' +
    '<span class="bk-sep"></span>' +
    '<button type="button" data-c="h2" title="Başlık" aria-label="Başlık">Başlık</button>' +
    '<button type="button" data-c="h3" title="Alt başlık" aria-label="Alt başlık">Alt başlık</button>' +
    '<button type="button" data-c="quote" title="Alıntı bloğu" aria-label="Alıntı">❝ Alıntı</button>' +
    '<button type="button" data-c="break" title="Sahne ayracı (* * *)" aria-label="Sahne ayracı">Ayraç</button>' +
    '<span class="bk-sep"></span>' +
    '<button type="button" data-c="image" title="Görsel ekle / düzenle" aria-label="Görsel">Görsel</button>' +
    '<button type="button" data-c="link" class="bk-key" title="Seçili metne Wiki sayfası bağla (Ctrl+K)" aria-label="Wiki bağlantısı">Wiki bağlantısı</button>' +
    '<button type="button" data-c="unlink" title="İmlecin altındaki bağlantıyı kaldır" aria-label="Bağlantıyı kaldır">Bağlantıyı kaldır</button>' +
    '<button type="button" data-c="suggest" class="bk-key" title="Metinde geçen isimleri bulup bağlantı önerir" aria-label="Otomatik öner">Otomatik öner</button>' +
    '<span class="bk-sep"></span>' +
    '<button type="button" data-c="undo" title="Geri al (Ctrl+Z)" aria-label="Geri al">↶</button>' +
    '<button type="button" data-c="redo" title="Yinele (Ctrl+Shift+Z)" aria-label="Yinele">↷</button>' +
    '<button type="button" data-c="library" title="Bu bölümün görselleri" aria-label="Görseller">Görseller</button>' +
    '</div>' +

    '<div class="bk-panes"><button type="button" class="bk-pane on" data-p="write">Yaz</button><button type="button" class="bk-pane" data-p="preview">Önizleme</button></div>' +
    '<div class="bk-split" data-pane="write">' +
    '<textarea class="bk-ta" id="bk-ta" spellcheck="true" lang="tr" aria-label="Bölüm metni" placeholder="Bölüm metnini buraya yazın veya yapıştırın…"></textarea>' +
    '<div class="bk-prev-wrap"><div class="bk-prev-h"><span>Önizleme — okuyucuda böyle görünür</span>' +
    '<a class="abtn sm" href="' + SWRoute.href('bolum', ch.id) + '" target="_blank" rel="noopener">Okuyucuda aç ↗</a></div>' +
    '<div class="bk-prev"><div class="book-body" id="bk-prev"></div></div></div></div>' +

    '<footer class="bk-foot"><span class="bk-stat"></span>' +
    '<button type="button" class="bk-broken" hidden></button>' +
    '<label class="bk-free"><input type="checkbox" id="bk-free"> Okuyucuda yayında</label>' +
    '<details class="bk-help"><summary>Biçim ipuçları</summary><div><code>**kalın**</code> <code>*italik*</code> <code>## Başlık</code> <code>&gt; alıntı</code> <code>---</code> ayraç · ' +
    'Boş satır = yeni paragraf. Wiki bağlantısı: metni seçip <b>Wiki bağlantısı</b> (Ctrl+K).</div></details></footer>';
  return root;
}

async function openEditor(chId, opener) {
  if (S) return;
  const ch = A.chapList().find(c => String(c.id) === String(chId));
  if (!ch) return A.toast('Bölüm bulunamadı.', true);
  const stored = (A.DB['book.json'].chapters || {})[String(ch.id)] || {};
  const text = { tr: tr(stored.text && stored.text.tr), en: tr(stored.text && stored.text.en) };

  S = { id: ch.id, lang: 'tr', text: text, images: JSON.parse(JSON.stringify(stored.images || {})), free: !!ch.free, dirty: false, modals: [], opener: opener || null };
  S.root = build(ch, stored);
  document.body.appendChild(S.root); document.body.classList.add('bk-open');
  const shell = document.getElementById('shell'); if (shell) shell.inert = true;
  S.ta = $('#bk-ta', S.root); S.prev = $('#bk-prev', S.root);
  S.ta.value = S.text.tr; $('#bk-free', S.root).checked = S.free;

  /* Olaylar */
  S.ta.addEventListener('input', () => { markDirty(); schedulePreview(); });
  S.ta.addEventListener('scroll', () => {
    const p = $('.bk-prev', S.root), max = S.ta.scrollHeight - S.ta.clientHeight;
    if (max > 0 && getComputedStyle(p.parentNode).display !== 'none') p.scrollTop = (S.ta.scrollTop / max) * (p.scrollHeight - p.clientHeight);
  });
  S.ta.addEventListener('keydown', ev => {
    const mod = ev.ctrlKey || ev.metaKey, k = ev.key.toLowerCase();
    if (mod && k === 'b') { ev.preventDefault(); toggleWrap('**'); }
    else if (mod && k === 'i') { ev.preventDefault(); toggleWrap('*'); }
    else if (mod && k === 'k') { ev.preventDefault(); openLinkPicker(); }
  });
  S.root.addEventListener('keydown', ev => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') { ev.preventDefault(); saveNow(); }
    else if (ev.key === 'Escape' && !S.modals.length) { ev.preventDefault(); requestClose(); }
  });
  $('#bk-close', S.root).onclick = requestClose;
  $('#bk-save', S.root).onclick = () => saveNow();
  $('#bk-free', S.root).onchange = ev => { S.free = ev.target.checked; markDirty(); };
  $$('.bk-lang', S.root).forEach(b => { b.onclick = () => switchLang(b.dataset.l); });
  $$('.bk-pane', S.root).forEach(b => b.onclick = () => {
    $$('.bk-pane', S.root).forEach(x => x.classList.toggle('on', x === b));
    $('.bk-split', S.root).dataset.pane = b.dataset.p; if (b.dataset.p === 'preview') updatePreview();
  });
  $('.bk-broken', S.root).onclick = openBroken;
  $('.bk-tools', S.root).addEventListener('mousedown', ev => { if (ev.target.closest('button')) ev.preventDefault(); });   /* seçim kaybolmasın */
  $('.bk-tools', S.root).addEventListener('click', ev => {
    const b = ev.target.closest('button[data-c]'); if (!b) return;
    const c = b.dataset.c;
    if (c === 'bold') toggleWrap('**'); else if (c === 'italic') toggleWrap('*');
    else if (c === 'h2') toggleHeading(2); else if (c === 'h3') toggleHeading(3);
    else if (c === 'quote') toggleQuote(); else if (c === 'break') insertBreak();
    else if (c === 'image') openImageDialog(); else if (c === 'link') openLinkPicker();
    else if (c === 'unlink') removeLinks(); else if (c === 'suggest') openSuggest();
    else if (c === 'library') openLibrary();
    else if (c === 'undo') { S.ta.focus(); document.execCommand('undo'); }
    else if (c === 'redo') { S.ta.focus(); document.execCommand('redo'); }
  });

  updatePreview();
  S.ta.focus({ preventScroll: true });
  ensureIndex().then(() => { if (S) updatePreview(); });       /* kırık bağlantı denetimi dizin gelince */

  /* Kaydedilmemiş otomatik taslak var mı? */
  try {
    const a = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || 'null');
    if (a && a.id === S.id && (a.tr !== S.text.tr || a.en !== S.text.en)) {
      const when = new Date(a.t).toLocaleString('tr-TR');
      const api = modal('Kaydedilmemiş taslak bulundu',
        '<p>Bu bölüm için <strong>' + esc(when) + '</strong> tarihli, kaydedilmemiş bir otomatik taslak var (tarayıcı kapanmış ya da sayfa yenilenmiş olabilir).</p>' +
        '<p class="bk-hint">Geri yüklerseniz metin editöre gelir; kaydetmeden kalıcı olmaz. Taslakta yüklediğiniz görseller yer almaz.</p>',
        '<button type="button" class="abtn" id="bk-a-no">Taslağı sil</button><button type="button" class="abtn primary" id="bk-a-yes" data-autofocus>Geri yükle</button>');
      $('#bk-a-no', api.el).onclick = () => { clearAutosave(); api.close(); };
      $('#bk-a-yes', api.el).onclick = () => {
        S.text.tr = tr(a.tr); S.text.en = tr(a.en); S.free = !!a.free; $('#bk-free', S.root).checked = S.free;
        S.ta.value = S.text[S.lang]; api.close(); markDirty(); updatePreview();
      };
    }
  } catch (e) {}
}

/* Sekme kapanırken uyar */
window.addEventListener('beforeunload', ev => { if (S && S.dirty) { autosave(); ev.preventDefault(); ev.returnValue = ''; } });

/* "Metni Düzenle" düğmeleri (Bölümler tablosu) */
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-book-text]'); if (!b) return;
  ev.preventDefault(); openEditor(b.dataset.bookText, b);
});

window.BookEditor = { open: openEditor };
})();
