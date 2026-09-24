/* ═══════════════════════════════════════════════════════════════
   STALLHART WIKI — Vakanüvise Öneri Sun   community-suggest.js
   ---------------------------------------------------------------
   Üye, wikide gördüğü bir eksik/yanlışı ya da yeni bir karakter /
   terim taslağını bu modalla iletir. Öneri pending_suggestions
   tablosuna düşer; Vakanüvis admin panelinde onaylayınca içerik
   yamaya dönüşür ve siteye yansır.

   Yapılandırılmış öneriler ("yama taslağı") kullanıcıya JSON yazdırmaz:
   form alanlarından şu biçimde bir yama üretilir ve öneriyle birlikte
   saklanır (admin onaylarken görür, isterse düzenler):

     { file, path, record_id, op, data }      → bkz. assets/js/patches.js

   Tür başına:
     fix            op: merge   (mevcut kaydın seçilen alanı)
     new_character  op: upsert  (characters.json → characters)
     new_term       op: upsert  (lore.json → glossary)
     other          yama yok — yalnızca mesaj
   ═══════════════════════════════════════════════════════════════ */
'use strict';

(function () {

var C = window.Wiki && window.Wiki.Community;
if (!C || !C.enabled) return;
var U = C.util, esc = U.esc, tt = U.tt;
var Lang = window.Wiki.Lang, loadData = window.Wiki.loadData, BASE_PATH = window.Wiki.BASE_PATH;

C.addStrings({
  tr: {
    sg_title: 'Vakanüvise Öneri Sun',
    sg_sub: 'Önerin, Vakanüvis onayından sonra sayfada yayınlanır.',
    sg_page: 'Sayfa',
    sg_kind_fix: 'Bu sayfada düzeltme', sg_kind_new_character: 'Yeni karakter',
    sg_kind_new_term: 'Yeni terim', sg_kind_other: 'Genel not',
    sg_field: 'Düzeltilecek alan', sg_current: 'Şu anki metin', sg_empty_cur: '(boş)',
    sg_proposed: 'Önerdiğin metin', sg_en_opt: 'İngilizce karşılığı (isteğe bağlı)',
    sg_reason: 'Gerekçe / kaynak (isteğe bağlı)',
    sg_reason_ph: 'Örn. hangi bölümde geçtiği, kaynak belge…',
    sg_name: 'Karakter adı', sg_ctitle: 'Unvan', sg_house: 'Hane / grup adı',
    sg_group: 'Grup', sg_status: 'Durum', sg_birth: 'Doğum yeri', sg_alleg: 'Bağlılık',
    sg_epi: 'Lakap', sg_weapon: 'Silah / eşya', sg_bio: 'Kısa biyografi',
    sg_term: 'Terim', sg_type: 'Tür', sg_def: 'Tanım',
    sg_subject: 'Konu', sg_message: 'Mesajın', sg_optional: '(isteğe bağlı)',
    sg_submit: 'Vakanüvise gönder',
    sg_sent_title: 'Önerin ulaştı',
    sg_sent: 'Teşekkürler! Vakanüvis inceleyecek. Durumunu profilindeki “Öneriler” sekmesinden takip edebilirsin.',
    sg_another: 'Yeni öneri', sg_view: 'Önerilerime git',
    sg_err_value: 'Önerdiğin metni yaz.', sg_err_same: 'Önerdiğin metin mevcut metinle aynı.',
    sg_err_name: 'Karakter adı 2–60 karakter olmalı.', sg_err_house: 'Hane / grup adını yaz.',
    sg_err_bio: 'Biyografi en az 20 karakter olmalı.',
    sg_err_term: 'Terim 2–60 karakter olmalı.', sg_err_def: 'Tanım en az 10 karakter olmalı.',
    sg_err_subject: 'Konu 3–140 karakter olmalı.', sg_err_msg: 'Mesajın en az 10 karakter olmalı.',
    sg_dup: 'Bu kimlikle bir kayıt zaten var — düzeltme önermek istiyorsan ilgili sayfadan “Bu sayfada düzeltme”yi seç. Yine de gönderirsen ayrı kayıt olarak değerlendirilir.',
    sg_sending: 'Gönderiliyor…',
    g_stallhart: 'İmparatorluk Hanedanı', g_arhan: 'Arhan Hanesi', g_solgar: 'Solgar Hanesi', g_selya: 'Selya Hanesi',
    g_rebel: 'İsyancılar', g_court: 'Saray', g_arathen: 'Arathen', g_other: 'Diğer',
    s_alive: 'Yaşıyor', s_deceased: 'Hayatını kaybetti', s_historical: 'Tarihsel figür',
    y_geo: 'Coğrafya', y_title: 'Unvan', y_political: 'Siyasi', y_military: 'Askerî', y_religious: 'Dinî', y_magic: 'Sihir'
  },
  en: {
    sg_title: 'Suggest to the Chronicler',
    sg_sub: 'Your suggestion is published on the page once the Chronicler approves it.',
    sg_page: 'Page',
    sg_kind_fix: 'Correction on this page', sg_kind_new_character: 'New character',
    sg_kind_new_term: 'New term', sg_kind_other: 'General note',
    sg_field: 'Field to correct', sg_current: 'Current text', sg_empty_cur: '(empty)',
    sg_proposed: 'Your proposed text', sg_en_opt: 'English version (optional)',
    sg_reason: 'Reason / source (optional)',
    sg_reason_ph: 'E.g. which chapter it appears in, source document…',
    sg_name: 'Character name', sg_ctitle: 'Title', sg_house: 'House / group name',
    sg_group: 'Group', sg_status: 'Status', sg_birth: 'Birthplace', sg_alleg: 'Allegiance',
    sg_epi: 'Epithet', sg_weapon: 'Weapon / item', sg_bio: 'Short biography',
    sg_term: 'Term', sg_type: 'Type', sg_def: 'Definition',
    sg_subject: 'Subject', sg_message: 'Your message', sg_optional: '(optional)',
    sg_submit: 'Send to the Chronicler',
    sg_sent_title: 'Your suggestion arrived',
    sg_sent: 'Thank you! The Chronicler will review it. Track its status in the “Suggestions” tab of your profile.',
    sg_another: 'New suggestion', sg_view: 'Go to my suggestions',
    sg_err_value: 'Write your proposed text.', sg_err_same: 'Your text is identical to the current one.',
    sg_err_name: 'The name must be 2–60 characters.', sg_err_house: 'Enter the house / group name.',
    sg_err_bio: 'The biography must be at least 20 characters.',
    sg_err_term: 'The term must be 2–60 characters.', sg_err_def: 'The definition must be at least 10 characters.',
    sg_err_subject: 'The subject must be 3–140 characters.', sg_err_msg: 'Your message must be at least 10 characters.',
    sg_dup: 'A record with this id already exists — to correct it, open its page and choose “Correction on this page”. If you still send this, it is reviewed as a separate entry.',
    sg_sending: 'Sending…',
    g_stallhart: 'Imperial Dynasty', g_arhan: 'House Arhan', g_solgar: 'House Solgar', g_selya: 'House Selya',
    g_rebel: 'Rebels', g_court: 'The Court', g_arathen: 'Arathen', g_other: 'Other',
    s_alive: 'Alive', s_deceased: 'Deceased', s_historical: 'Historical figure',
    y_geo: 'Geography', y_title: 'Title', y_political: 'Political', y_military: 'Military', y_religious: 'Religious', y_magic: 'Magic'
  }
});

/* Düzeltilebilir alanlar: [alan, biçim] — bi = {tr,en} çift dilli, str = düz metin.
   Kimlik, görsel yolu, bağlantı listeleri gibi alanlar bilerek YOK. */
var FIX_FIELDS = {
  character: [['title', 'bi'], ['house', 'bi'], ['birth', 'bi'], ['alleg', 'bi'], ['weapon', 'bi'], ['epi', 'bi'], ['quote', 'bi'], ['bio', 'bi']],
  kingdom:   [['capital', 'bi'], ['ruler', 'bi'], ['founded', 'str'], ['government', 'bi'], ['religion', 'bi'], ['flag', 'bi'], ['desc', 'bi'], ['strengths', 'bi'], ['weaknesses', 'bi']],
  house:     [['meaning', 'bi'], ['symbol', 'bi'], ['motto', 'bi'], ['desc', 'bi'], ['origin', 'bi']],
  god:       [['epithet', 'bi'], ['role', 'bi'], ['psychology', 'bi'], ['ritual', 'bi'], ['symbol', 'bi']],
  chapter:   [['title', 'bi'], ['pov', 'bi'], ['synopsis', 'bi'], ['ks', 'str'], ['firstLine', 'str']]
};
var LABELS = {
  character: { title: ['Unvan', 'Title'], house: ['Hane', 'House'], birth: ['Doğum yeri', 'Birthplace'], alleg: ['Bağlılık', 'Allegiance'], weapon: ['Silah / Eşya', 'Weapon / Item'], epi: ['Lakap', 'Epithet'], quote: ['Tanımlayıcı söz', 'Defining quote'], bio: ['Biyografi', 'Biography'] },
  kingdom:   { capital: ['Başkent', 'Capital'], ruler: ['Hükümdar', 'Ruler'], founded: ['Kuruluş', 'Founded'], government: ['Yönetim biçimi', 'Government'], religion: ['Din', 'Religion'], flag: ['Bayrak tarifi', 'Flag description'], desc: ['Genel tanım', 'Overview'], strengths: ['Güçlü yönler', 'Strengths'], weaknesses: ['Zayıf yönler', 'Weaknesses'] },
  house:     { meaning: ['Anlamı', 'Meaning'], symbol: ['Sembol', 'Symbol'], motto: ['Slogan / Vecize', 'Motto'], desc: ['Betimleme', 'Description'], origin: ['Kökeni', 'Origin'] },
  god:       { epithet: ['Lakap', 'Epithet'], role: ['Rolü', 'Role'], psychology: ['Psikoloji', 'Psychology'], ritual: ['Ritüel', 'Ritual'], symbol: ['Sembol', 'Symbol'] },
  chapter:   { title: ['Başlık', 'Title'], pov: ['Bakış açısı (POV)', 'POV'], synopsis: ['Özet', 'Synopsis'], ks: ['Kronoloji (KS)', 'Chronology (KS)'], firstLine: ['İlk cümle', 'First line'] }
};
var GROUPS = ['stallhart', 'arhan', 'solgar', 'selya', 'rebel', 'court', 'arathen', 'other'];
var STATUSES = ['alive', 'deceased', 'historical'];
var TERM_TYPES = ['geo', 'title', 'political', 'military', 'religious', 'magic'];

function fieldLabel(type, field, lang) {
  var l = LABELS[type] && LABELS[type][field];
  return l ? l[lang === 'en' ? 1 : 0] : field;
}

/* Kaydın insan-okur adı (öneri başlığı ve bağlam şeridi için) */
function recordName(type, rec, lang) {
  function bi(o) { return o && typeof o === 'object' ? (o[lang] || o.tr || o.en || '') : (o || ''); }
  if (!rec) return '';
  if (type === 'character' || type === 'kingdom') return bi(rec.name);
  if (type === 'house') return String(rec.name || '');
  if (type === 'god') return (bi(rec.epithet) + ' ' + (rec.trueName || '')).trim();
  if (type === 'chapter') return (rec.num ? rec.num + '. ' : '') + bi(rec.title);
  return String(rec.id || '');
}

function curValue(rec, field, kind) {
  var v = rec ? rec[field] : null;
  if (v == null) return '';
  if (kind === 'bi') return typeof v === 'object' ? (Lang.get() === 'en' ? (v.en || v.tr || '') : (v.tr || v.en || '')) : String(v);
  return String(v);
}
function curTr(rec, field, kind) {
  var v = rec ? rec[field] : null;
  if (v == null) return '';
  if (kind === 'bi') return typeof v === 'object' ? (v.tr || '') : String(v);
  return String(v);
}

/* Açık bağlam yoksa URL'den çıkar (karakter/devlet/hane/tanrı detay sayfaları). */
function detect() {
  var R = window.SWRoute, r = R && R.current();
  var map = { karakter: 'character', devlet: 'kingdom', hane: 'house', tanri: 'god' };
  return r && map[r.type] && r.id ? U.ctxFor(map[r.type], r.id, '') : null;
}

function relUrl(full) { return String(full).replace(BASE_PATH, '').slice(0, 300); }

function optHTML(list, sel, labeler) {
  return list.map(function (k) { return '<option value="' + esc(k) + '"' + (k === sel ? ' selected' : '') + '>' + esc(labeler(k)) + '</option>'; }).join('');
}
function input(label, name, attrs, hint) {
  return '<label class="sw-l"><span>' + esc(label) + '</span><input class="sw-in" type="text" name="' + name + '" ' + (attrs || '') + '>' +
    (hint ? '<small class="sw-hint" data-hint="' + name + '"></small>' : '') + '</label>';
}
function area(label, name, rows, attrs) {
  return '<label class="sw-l"><span>' + esc(label) + '</span><textarea class="sw-in" name="' + name + '" rows="' + rows + '" ' + (attrs || '') + '></textarea></label>';
}
function v(form, name) { var e = form.elements[name]; return e ? String(e.value).trim() : ''; }

async function open(ctx) {
  U.Modal.closeAll();
  var rec = U.Modal.open({ title: tt('sg_title'), cls: 'sw-suggest', html: '<div class="sw-loading">' + esc(tt('loading')) + '</div>' });
  ctx = ctx || detect();

  var record = null, chars = null;
  try {
    var jobs = [loadData('characters.json')];
    if (ctx) jobs.push(loadData(ctx.file));
    var res = await Promise.all(jobs);
    chars = res[0];
    if (ctx) record = window.SWPatches ? window.SWPatches.find(res[1], ctx.path, ctx.id) : null;
  } catch (e) { /* veri gelmezse yalnızca genel türler sunulur */ }
  if (ctx && !record) ctx = null;

  var kinds = (ctx ? ['fix'] : []).concat(['new_character', 'new_term', 'other']);
  var S = { kind: kinds[0], kinds: kinds, ctx: ctx, record: record, chars: chars };
  if (!rec.closed) render(rec, S);
}

function render(rec, S) {
  var lang = Lang.get();
  var head = '<div class="sw-auth-head"><h2 class="sw-h">✒ ' + esc(tt('sg_title')) + '</h2><p class="sw-sub">' + esc(tt('sg_sub')) + '</p></div>';
  var strip = S.ctx
    ? '<div class="sw-ctx"><span>' + esc(tt('sg_page')) + ':</span> <strong>' + esc(U.typeLabel(S.ctx.type)) + ' · ' + esc(S.ctx.label || recordName(S.ctx.type, S.record, lang)) + '</strong></div>' : '';
  var kindsHTML = '<div class="sw-kinds" role="tablist">' + S.kinds.map(function (k) {
    return '<button type="button" role="tab" class="' + (k === S.kind ? 'on' : '') + '" data-kind="' + k + '" aria-selected="' + (k === S.kind) + '">' + esc(tt('sg_kind_' + k)) + '</button>';
  }).join('') + '</div>';

  var body = '';
  if (S.kind === 'fix') {
    var fields = FIX_FIELDS[S.ctx.type] || [];
    var first = fields[0];
    body =
      '<label class="sw-l"><span>' + esc(tt('sg_field')) + '</span><select class="sw-in" name="field">' +
        fields.map(function (f) { return '<option value="' + f[0] + '">' + esc(fieldLabel(S.ctx.type, f[0], lang)) + '</option>'; }).join('') + '</select></label>' +
      '<div class="sw-l"><span>' + esc(tt('sg_current')) + '</span><blockquote class="sw-cur" data-cur></blockquote></div>' +
      area(tt('sg_proposed'), 'value', 5, 'required maxlength="4000"') +
      '<details class="sw-more" data-en-wrap><summary>' + esc(tt('sg_en_opt')) + '</summary>' + area('English', 'value_en', 3, 'maxlength="4000"') + '</details>' +
      area(tt('sg_reason'), 'message', 3, 'maxlength="1500" placeholder="' + esc(tt('sg_reason_ph')) + '"');
    S._first = first;
  } else if (S.kind === 'new_character') {
    body =
      input(tt('sg_name'), 'name', 'required maxlength="60" data-autofocus', true) +
      input(tt('sg_ctitle') + ' ' + tt('sg_optional'), 'ctitle', 'maxlength="80"') +
      '<div class="sw-row"><label class="sw-l"><span>' + esc(tt('sg_group')) + '</span><select class="sw-in" name="group">' +
        optHTML(GROUPS, 'other', function (g) { return tt('g_' + g); }) + '</select></label>' +
      '<label class="sw-l"><span>' + esc(tt('sg_status')) + '</span><select class="sw-in" name="status">' +
        optHTML(STATUSES, 'alive', function (s) { return tt('s_' + s); }) + '</select></label></div>' +
      '<label class="sw-l"><span>' + esc(tt('sg_house')) + '</span><input class="sw-in" type="text" name="house" list="sw-house-list" required maxlength="80"></label>' +
      '<datalist id="sw-house-list">' + houseNames(S.chars).map(function (h) { return '<option value="' + esc(h) + '">'; }).join('') + '</datalist>' +
      '<div class="sw-row">' + input(tt('sg_birth') + ' ' + tt('sg_optional'), 'birth', 'maxlength="80"') + input(tt('sg_alleg') + ' ' + tt('sg_optional'), 'alleg', 'maxlength="80"') + '</div>' +
      '<div class="sw-row">' + input(tt('sg_epi') + ' ' + tt('sg_optional'), 'epi', 'maxlength="100"') + input(tt('sg_weapon') + ' ' + tt('sg_optional'), 'weapon', 'maxlength="100"') + '</div>' +
      area(tt('sg_bio'), 'bio', 5, 'required maxlength="3000"') +
      area(tt('sg_reason'), 'message', 3, 'maxlength="1500" placeholder="' + esc(tt('sg_reason_ph')) + '"');
  } else if (S.kind === 'new_term') {
    body =
      input(tt('sg_term'), 'term', 'required maxlength="60" data-autofocus', true) +
      '<label class="sw-l"><span>' + esc(tt('sg_type')) + '</span><select class="sw-in" name="type">' +
        optHTML(TERM_TYPES, 'political', function (k) { return tt('y_' + k); }) + '</select></label>' +
      area(tt('sg_def'), 'def', 4, 'required maxlength="2000"') +
      area(tt('sg_reason'), 'message', 3, 'maxlength="1500" placeholder="' + esc(tt('sg_reason_ph')) + '"');
  } else {
    body =
      input(tt('sg_subject'), 'subject', 'required maxlength="140" data-autofocus') +
      area(tt('sg_message'), 'message', 6, 'required maxlength="3000"');
  }

  rec.body.innerHTML = head + strip + kindsHTML +
    '<form class="sw-form" novalidate>' + body +
    '<div class="sw-err" role="alert" hidden></div>' +
    '<div class="sw-actions"><button type="button" class="sw-btn" data-close>' + esc(tt('cancel')) + '</button>' +
    '<button type="submit" class="sw-btn primary">' + esc(tt('sg_submit')) + '</button></div></form>';

  var form = rec.body.querySelector('form'), errEl = form.querySelector('.sw-err');
  function showErr(m) { errEl.textContent = m; errEl.hidden = !m; }

  rec.body.querySelector('.sw-kinds').addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-kind]');
    if (!b || b.dataset.kind === S.kind) return;
    S.kind = b.dataset.kind; render(rec, S);
  });

  if (S.kind === 'fix') {
    var fs = form.elements.field, cur = form.querySelector('[data-cur]'), enWrap = form.querySelector('[data-en-wrap]');
    var syncFix = function () {
      var def = FIX_FIELDS[S.ctx.type].filter(function (f) { return f[0] === fs.value; })[0];
      var t = curValue(S.record, fs.value, def[1]);
      cur.textContent = t || tt('sg_empty_cur');
      cur.classList.toggle('empty', !t);
      enWrap.hidden = def[1] !== 'bi';
    };
    fs.addEventListener('change', syncFix); syncFix();
  }
  if (S.kind === 'new_character' || S.kind === 'new_term') {
    var nameEl = form.elements[S.kind === 'new_character' ? 'name' : 'term'];
    var hint = form.querySelector('[data-hint]');
    nameEl.addEventListener('input', function () {
      var slug = U.slugify(nameEl.value);
      var taken = S.kind === 'new_character' ? charIds(S.chars) : [];
      hint.textContent = slug && taken.indexOf(slug) >= 0 ? tt('sg_dup') : '';
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    showErr('');
    var built;
    try { built = build(S, form); } catch (err) { return showErr(err.message); }
    var me = C.getState();
    if (!me.user) return showErr(U.mapErr({ code: '42501' }));
    var btn = form.querySelector('button[type=submit]');
    Array.prototype.forEach.call(form.querySelectorAll('button,input,textarea,select'), function (x) { x.disabled = true; });
    btn.textContent = tt('sg_sending');
    try {
      var client = await C.getClient();
      var r = await client.from('pending_suggestions').insert({
        user_id: me.user.id, kind: built.kind, page_url: built.page_url,
        title: built.title, message: built.message, patch: built.patch
      }).select('id').single();
      if (r.error) throw r.error;
      done(rec, S);
    } catch (err) {
      Array.prototype.forEach.call(form.querySelectorAll('button,input,textarea,select'), function (x) { x.disabled = false; });
      btn.textContent = tt('sg_submit');
      showErr(U.mapErr(err));
    }
  });
}

function done(rec, S) {
  rec.body.innerHTML = '<div class="sw-auth-head"><h2 class="sw-h">✒ ' + esc(tt('sg_sent_title')) + '</h2><p class="sw-sub">' + esc(tt('sg_sent')) + '</p></div>' +
    '<div class="sw-actions"><button type="button" class="sw-btn" data-act="another">' + esc(tt('sg_another')) + '</button>' +
    '<button type="button" class="sw-btn primary" data-act="mine">' + esc(tt('sg_view')) + '</button></div>';
  rec.body.querySelector('[data-act=another]').addEventListener('click', function () { render(rec, S); });
  rec.body.querySelector('[data-act=mine]').addEventListener('click', function () { C.openProfile(null, 'suggestions'); });
  U.toast(tt('sg_sent_title'));
}

function charIds(chars) { return ((chars && chars.characters) || []).map(function (c) { return String(c.id); }); }
function houseNames(chars) {
  var seen = {}, out = [];
  ((chars && chars.characters) || []).forEach(function (c) {
    var h = c.house && (c.house.tr || c.house.en);
    if (h && !seen[h]) { seen[h] = 1; out.push(h); }
  });
  return out.sort(function (a, b) { return a.localeCompare(b, 'tr'); });
}
function uniqueId(base, taken) { var id = base || ('kayit-' + Date.now()), n = 2; while (taken.indexOf(id) >= 0) { id = base + '-' + n; n++; } return id; }
function bi(tr, en) { var o = { tr: tr }; if (en) o.en = en; return o; }
function cut(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

/* Form → {kind, title, message, patch, page_url}. Geçersizse Error fırlatır (mesajı kullanıcıya gösterilir). */
function build(S, form) {
  var kind = S.kind, message = v(form, 'message');
  var pageUrl = S.ctx ? relUrl(U.pageUrl(S.ctx.type, S.ctx.id)) : (location.pathname.split('/').pop() + location.search + location.hash).slice(0, 300);

  if (kind === 'fix') {
    var field = v(form, 'field');
    var def = FIX_FIELDS[S.ctx.type].filter(function (f) { return f[0] === field; })[0];
    var val = v(form, 'value');
    if (val.length < 1) throw new Error(tt('sg_err_value'));
    if (val === curTr(S.record, field, def[1]).trim()) throw new Error(tt('sg_err_same'));
    var en = def[1] === 'bi' ? v(form, 'value_en') : '';
    var data = {}; data[field] = def[1] === 'bi' ? bi(val, en) : val;
    return {
      kind: 'fix', page_url: pageUrl, message: message,
      title: cut('Düzeltme · ' + U.typeLabelTr(S.ctx.type) + ' · ' + (S.ctx.label || recordName(S.ctx.type, S.record, 'tr')) + ' · ' + fieldLabel(S.ctx.type, field, 'tr'), 140),
      patch: { file: S.ctx.file, path: S.ctx.path, record_id: String(S.ctx.id), op: 'merge', data: data }
    };
  }

  if (kind === 'new_character') {
    var name = v(form, 'name'), house = v(form, 'house'), bio = v(form, 'bio');
    if (name.length < 2 || name.length > 60) throw new Error(tt('sg_err_name'));
    if (!house) throw new Error(tt('sg_err_house'));
    if (bio.length < 20) throw new Error(tt('sg_err_bio'));
    var d = { group: v(form, 'group') || 'other', status: v(form, 'status') || 'alive', name: bi(name), house: bi(house), bio: bi(bio) };
    ['ctitle:title', 'birth:birth', 'alleg:alleg', 'epi:epi', 'weapon:weapon'].forEach(function (p) {
      var a = p.split(':'), x = v(form, a[0]);
      if (x) d[a[1]] = bi(x);
    });
    var id = uniqueId(U.slugify(name), charIds(S.chars));
    return {
      kind: 'new_character', page_url: pageUrl, message: message, title: cut('Yeni karakter: ' + name, 140),
      patch: { file: 'characters.json', path: 'characters', record_id: id, op: 'upsert', data: d }
    };
  }

  if (kind === 'new_term') {
    var term = v(form, 'term'), def2 = v(form, 'def');
    if (term.length < 2 || term.length > 60) throw new Error(tt('sg_err_term'));
    if (def2.length < 10) throw new Error(tt('sg_err_def'));
    return {
      kind: 'new_term', page_url: pageUrl, message: message, title: cut('Yeni terim: ' + term, 140),
      patch: { file: 'lore.json', path: 'glossary', record_id: U.slugify(term) || ('terim-' + Date.now()), op: 'upsert',
               data: { type: v(form, 'type') || 'political', term: bi(term), def: bi(def2) } }
    };
  }

  var subject = v(form, 'subject');
  if (subject.length < 3 || subject.length > 140) throw new Error(tt('sg_err_subject'));
  if (message.length < 10) throw new Error(tt('sg_err_msg'));
  return { kind: 'other', page_url: pageUrl, message: message, title: subject, patch: null };
}

/* Türkçe tür etiketi (kayıt başlıkları admin için her zaman TR) */
U.typeLabelTr = function (type) {
  return { character: 'Karakter', kingdom: 'Devlet', chapter: 'Bölüm', house: 'Hane', god: 'Tanrı' }[type] || type;
};

C.modules.suggest = { open: open, detect: detect, FIX_FIELDS: FIX_FIELDS, LABELS: LABELS, recordName: recordName };

})();
