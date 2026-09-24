/* ═══════════════════════════════════════════════════════════════
   STALLHART WIKI — Yönetim Paneli: TOPLULUK MODÜLLERİ
   (admin-community.js)
   ---------------------------------------------------------------
   config.js doldurulmuşsa panel şunları kazanır:

     · Giriş: yerel parola yerine Supabase hesabı (yalnızca rolü
       "admin" = Vakanüvis olanlar girer). Asıl yetki denetimi
       veritabanındadır (RLS + is_admin()); arayüzdeki kapı yalnızca
       kullanıcıya kolaylıktır.
     · Öneriler   : bekleyen önerileri incele → Onayla (tek tıkla yama
                    olarak siteye canlı yansır) / Reddet
     · Yorumlar   : tüm yorumları denetle, sil, yazarı yasakla
     · Kullanıcılar: rol ver / al, yasakla
     · Veri & Yayın: canlı yamaları listele, birleştirilmiş JSON'u indir,
                    "depoya işlendi" say

   config.js boşsa bu dosya hiçbir şey yapmaz; eski parola girişi sürer.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

(function () {

var W = window.Wiki, C = W && W.Community, A = window.AdminCore;
var ACTIVE = !!(C && C.enabled && window.SWPatches);
var gate = window.AdminGate = { active: ACTIVE, signedIn: false, init: gateInit, logout: gateLogout };
if (!ACTIVE || !A) { gate.active = false; return; }

var U = C.util, esc = A.esc, $ = A.$, $$ = A.$$;

/* ── yardımcılar ─────────────────────────────────────────────── */
function cl() { return C.getClient(); }
function errText(e) { return U.mapErr(e); }
function uniq(a) { var s = {}; return a.filter(function (x) { if (s[x]) return false; s[x] = 1; return true; }); }
function chunk(a, n) { var o = []; for (var i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; }
function fdt(iso) {
  try { return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch (e) { return ''; }
}
function fmtVal(v) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'object') {
    if (!Array.isArray(v) && (v.tr !== undefined || v.en !== undefined)) return (v.tr || '') + (v.en ? '\n[EN] ' + v.en : '');
    return JSON.stringify(v);
  }
  return String(v);
}
function loadingHTML(t) { return '<div class="empty-a">' + esc(t || 'Yükleniyor…') + '</div>'; }
function view() { return $('#view'); }
function me() { return C.getState(); }

/* ═══ 1. YÖNETİCİ GİRİŞİ ════════════════════════════════════════ */
var origLogin = null;

function reveal() {
  $$('[data-community]').forEach(function (el) { el.hidden = false; });
  refreshBadge();
}

function gateInit(opts) {
  var box = $('#login');
  origLogin = box.innerHTML;
  var entered = false, timer = null;

  function setBox(html) { box.innerHTML = html; }

  function showForm(msg) {
    setBox('<form class="login-box" id="gate-form" novalidate>' +
      '<h1 class="login-title">Yönetim Paneli</h1>' +
      '<p class="login-sub">Vakanüvis (yönetici) hesabınla giriş yap.</p>' +
      '<div class="f-row"><label class="f-label" for="gate-email">E-posta</label>' +
      '<input type="email" id="gate-email" class="f-input" autocomplete="username"></div>' +
      '<div class="f-row"><label class="f-label" for="gate-pw">Parola</label>' +
      '<input type="password" id="gate-pw" class="f-input" autocomplete="current-password" placeholder="••••••••">' +
      '<div class="f-error' + (msg ? ' on' : '') + '" id="gate-err">' + esc(msg || '') + '</div>' +
      '<div class="gate-hint">Hesabın yoksa önce sitede kayıt ol; ardından README’deki “ilk yöneticiyi atama” adımını uygula.</div></div>' +
      '<div class="btn-row"><button type="submit" class="abtn primary">Giriş Yap</button>' +
      '<a class="abtn" href="index.html">← Siteye dön</a></div></form>');
    var f = $('#gate-form'), errEl = $('#gate-err');
    $('#gate-email').focus();
    f.addEventListener('submit', async function (e) {
      e.preventDefault();
      errEl.classList.remove('on');
      var email = $('#gate-email').value.trim(), pw = $('#gate-pw').value;
      if (!email || !pw) { errEl.textContent = 'E-posta ve parola gerekli.'; errEl.classList.add('on'); return; }
      var btn = f.querySelector('button[type=submit]'); btn.disabled = true;
      try {
        var c = await cl();
        var r = await c.auth.signInWithPassword({ email: email, password: pw });
        if (r.error) throw r.error;
        /* Devamı C.onAuth ile gelir; profil 6 sn içinde doğrulanamazsa uyar. */
        timer = setTimeout(function () { if (!entered) showNotAdmin(null); }, 6000);
      } catch (err) {
        errEl.textContent = errText(err); errEl.classList.add('on'); btn.disabled = false;
      }
    });
  }

  function showNotAdmin(st) {
    var u = st && st.user, p = st && st.profile;
    var mail = u && u.email ? u.email : 'SIZIN-EPOSTANIZ@ornek.com';
    setBox('<div class="login-box">' +
      '<h1 class="login-title">Yetki yok</h1>' +
      '<p class="login-sub">' + (p ? '<strong>' + esc(p.username) + '</strong> hesabı Vakanüvis (yönetici) değil.' : 'Hesap profili doğrulanamadı.') + '</p>' +
      '<div class="gate-hint">Bu hesabı yönetici yapmak için Supabase → SQL Editor’da şunu bir kez çalıştırın:</div>' +
      '<pre class="f-hint" style="white-space:pre-wrap;user-select:all;background:var(--deep);border:1px solid var(--border);padding:.6rem .8rem;margin:0 0 1rem">' +
      esc("update public.profiles\n   set role = 'admin'\n where id = (select id from auth.users where email = '" + mail + "');") + '</pre>' +
      '<div class="btn-row"><button type="button" class="abtn" id="gate-out">Çıkış yap</button>' +
      '<a class="abtn" href="index.html">← Siteye dön</a></div></div>');
    $('#gate-out').addEventListener('click', async function () { await gateLogout(); location.reload(); });
  }

  function showLibError(e) {
    setBox('<div class="login-box"><h1 class="login-title">Bağlantı kurulamadı</h1>' +
      '<p class="login-sub">' + esc(errText(e)) + '</p>' +
      '<div class="btn-row"><button type="button" class="abtn primary" id="gate-retry">Tekrar dene</button>' +
      '<button type="button" class="abtn" id="gate-local">Yerel modda aç (parola)</button></div>' +
      '<div class="gate-hint" style="margin-top:1rem">Yerel mod yalnızca bu tarayıcıdaki taslakları düzenler; öneri / yorum / kullanıcı modülleri kapalı kalır.</div></div>');
    $('#gate-retry').addEventListener('click', function () { location.reload(); });
    $('#gate-local').addEventListener('click', function () {
      gate.active = false; gate.signedIn = false;
      box.innerHTML = origLogin;
      opts.legacy();
    });
  }

  C.onAuth(function (st) {
    if (st.event === 'PROFILE_UPDATED') return;
    if (entered) { if (!st.user) location.reload(); return; }
    if (st.user && st.isAdmin) {
      entered = true; gate.signedIn = true; clearTimeout(timer);
      reveal();                       /* yönetici doğrulandı → topluluk menüsü hemen görünsün */
      opts.enter();
    } else if (st.user && st.profile) {
      clearTimeout(timer); showNotAdmin(st);
    }
  });

  showForm();
  cl().catch(showLibError);
}

async function gateLogout() {
  var c = await cl();
  await c.auth.signOut();
}

/* ═══ 2. ÖNERİLER ═══════════════════════════════════════════════ */
var SG = { filter: 'pending', rows: [], users: {}, err: '', loaded: false };

function setBadge(n) {
  var b = $('#sugg-badge');
  if (!b) return;
  b.textContent = String(n); b.hidden = !n;
}
async function refreshBadge() {
  try {
    var c = await cl();
    var r = await c.from('pending_suggestions').select('id', { count: 'exact', head: true }).eq('status', 'pending');
    if (!r.error && typeof r.count === 'number') { setBadge(r.count); return r.count; }
  } catch (e) { /* rozet kritik değil */ }
  return 0;
}

function renderSuggestions() {
  view().innerHTML = loadingHTML();
  loadSuggestions();
}

async function loadSuggestions() {
  try {
    var c = await cl();
    var r = await c.from('pending_suggestions')
      .select('id,user_id,kind,page_url,title,message,patch,status,admin_note,reviewed_at,created_at')
      .order('created_at', { ascending: false }).limit(300);
    if (r.error) throw r.error;
    SG.rows = r.data || [];
    SG.users = {};
    var groups = chunk(uniq(SG.rows.map(function (x) { return x.user_id; })), 50);
    var res = await Promise.all(groups.map(function (g) { return c.from('profiles').select('id,username,role').in('id', g); }));
    res.forEach(function (x) { (x.data || []).forEach(function (p) { SG.users[p.id] = p; }); });
    SG.err = ''; SG.loaded = true;
  } catch (e) { SG.err = errText(e); }
  if (A.current() === 'suggestions') drawSuggestions();
  setBadge(SG.rows.filter(function (x) { return x.status === 'pending'; }).length);
}

/* Alan adlarının okunur Türkçe karşılıkları (yalnızca önizleme; JSON anahtarı değişmez) */
var FIELD_TR = {
  name: 'Ad', title: 'Unvan', house: 'Hane', group: 'Grup', status: 'Durum', bio: 'Biyografi', birth: 'Doğum yeri',
  alleg: 'Bağlılık', epi: 'Lakap', weapon: 'Silah / Eşya', quote: 'Söz', term: 'Terim', def: 'Tanım', type: 'Tür',
  capital: 'Başkent', ruler: 'Hükümdar', founded: 'Kuruluş', government: 'Yönetim biçimi', religion: 'Din', flag: 'Bayrak',
  desc: 'Genel tanım', strengths: 'Güçlü yönler', weaknesses: 'Zayıf yönler', meaning: 'Anlamı', symbol: 'Sembol',
  motto: 'Slogan', origin: 'Kökeni', epithet: 'Lakap', role: 'Rolü', psychology: 'Psikoloji', ritual: 'Ritüel',
  pov: 'Bakış açısı', synopsis: 'Özet', ks: 'Kronoloji (KS)', firstLine: 'İlk cümle'
};
function fieldName(k) { return FIELD_TR[k] ? esc(FIELD_TR[k]) + ' <span class="cell-sub">(' + esc(k) + ')</span>' : esc(k); }

var KIND = { fix: 'Düzeltme', new_character: 'Yeni karakter', new_term: 'Yeni terim', other: 'Genel not' };
var STAT = { pending: 'Bekliyor', approved: 'Onaylandı', rejected: 'Reddedildi' };

function changeHTML(s) {
  var p = s.patch;
  if (!p || typeof p !== 'object') return '';
  var d = A.DB[p.file], rec = d ? window.SWPatches.find(d, p.path, p.record_id) : null;
  var data = p.data && typeof p.data === 'object' ? p.data : {};
  var where = '<code>' + esc(p.file + ' → ' + p.path + ' → ' + p.record_id) + '</code>';
  if (p.op === 'merge') {
    if (!rec) return '<div class="sg-warn">⚠ Hedef kayıt bulunamadı (' + where + '). Onaylarsan yama uygulanmaz.</div>';
    return Object.keys(data).map(function (k) {
      return '<div class="sg-field-name">' + fieldName(k) + '</div><div class="sg-diff">' +
        '<div><span class="lbl">Şu an</span>' + esc(fmtVal(rec[k])) + '</div>' +
        '<div class="new"><span class="lbl">Önerilen</span>' + esc(fmtVal(data[k])) + '</div></div>';
    }).join('');
  }
  if (p.op === 'upsert') {
    return '<div class="sg-rec"><dl>' + Object.keys(data).map(function (k) {
      return '<dt>' + fieldName(k) + '</dt><dd>' + esc(fmtVal(data[k])) + '</dd>';
    }).join('') + '</dl></div>' +
      '<div class="sg-meta">Yeni kayıt: ' + where +
      (rec ? ' — <span class="sg-warn">bu kimlikte kayıt zaten VAR; onaylanırsa alanlar birleştirilir.</span>' : '') + '</div>';
  }
  if (p.op === 'delete') return '<div class="sg-warn">Silinecek kayıt: ' + where + '</div>';
  return '';
}

function suggestionCard(s) {
  var u = SG.users[s.user_id] || { username: '(silinmiş hesap)' };
  var url = s.page_url ? '<a href="' + esc(s.page_url) + '" target="_blank" rel="noopener">' + esc(s.page_url) + '</a>' : '';
  var head = '<div class="sg-top"><span class="pill neutral">' + esc(KIND[s.kind] || s.kind) + '</span>' +
    '<span class="pill ' + (s.status === 'approved' ? 'ok' : s.status === 'rejected' ? 'ban' : 'alive') + '">' + esc(STAT[s.status] || s.status) + '</span></div>' +
    '<div class="sg-title">' + esc(s.title) + '</div>' +
    '<div class="sg-meta">' + esc(u.username) + (u.role === 'admin' ? ' (Vakanüvis)' : '') + ' · ' + esc(fdt(s.created_at)) + (url ? ' · ' + url : '') + '</div>' +
    (s.message ? '<div class="sg-msg">' + esc(s.message) + '</div>' : '') +
    changeHTML(s);

  if (s.status !== 'pending') {
    return '<div class="sg-card ' + esc(s.status) + '" data-id="' + esc(s.id) + '">' + head +
      '<div class="sg-done">' + (s.reviewed_at ? esc(fdt(s.reviewed_at)) + ' tarihinde işlendi. ' : '') +
      (s.admin_note ? 'Not: ' + esc(s.admin_note) : '') + '</div></div>';
  }
  return '<div class="sg-card pending" data-id="' + esc(s.id) + '">' + head +
    (s.patch ? '<details class="sg-details"><summary>Yama (JSON) — istersen onaylamadan önce düzenle</summary>' +
      '<textarea class="f-input sg-json" data-json spellcheck="false">' + esc(JSON.stringify(s.patch, null, 2)) + '</textarea></details>' : '') +
    '<div class="sg-acts"><input class="f-input" data-note placeholder="Üyeye görünecek not (isteğe bağlı)" maxlength="500">' +
    '<button class="abtn primary" data-sg="approve" type="button">' + (s.patch ? 'Onayla ve yayınla' : 'Okundu / onayla') + '</button>' +
    '<button class="abtn danger" data-sg="reject" type="button">Reddet</button></div></div>';
}

function drawSuggestions() {
  var v = view();
  if (SG.err) { v.innerHTML = '<div class="notice warn"><strong>Öneriler yüklenemedi:</strong> ' + esc(SG.err) + '</div>'; return; }
  var cnt = { pending: 0, approved: 0, rejected: 0 };
  SG.rows.forEach(function (r) { if (cnt[r.status] !== undefined) cnt[r.status]++; });
  var tabs = [['pending', 'Bekleyen'], ['approved', 'Onaylanan'], ['rejected', 'Reddedilen'], ['all', 'Tümü']].map(function (t) {
    var n = t[0] === 'all' ? SG.rows.length : cnt[t[0]];
    return '<button type="button" class="cm-tab' + (SG.filter === t[0] ? ' on' : '') + '" data-sgtab="' + t[0] + '">' + t[1] + '<b>' + n + '</b></button>';
  }).join('');
  var list = SG.rows.filter(function (r) { return SG.filter === 'all' || r.status === SG.filter; });
  v.innerHTML = '<div class="cm-tabs">' + tabs + '</div>' +
    (list.length ? '<div class="sg-list">' + list.map(suggestionCard).join('') + '</div>'
                 : '<div class="empty-a">' + (SG.filter === 'pending' ? 'Bekleyen öneri yok. 🎉' : 'Bu listede öneri yok.') + '</div>');
}

/* Yamayı bu panelin bellekteki verisine de uygula (diğer modüller güncel görsün). */
function applyLocal(patch) {
  var d = A.DB[patch.file];
  if (!d) return;
  window.SWPatches.applyOne(d, patch);
  if (W.Store.overriddenFiles().indexOf(patch.file) >= 0) A.save(patch.file);
}

function setBusy(card, b) {
  Array.prototype.forEach.call(card.querySelectorAll('button,input,textarea'), function (x) { x.disabled = b; });
}

async function approveSuggestion(id, card) {
  var s = SG.rows.filter(function (x) { return x.id === id; })[0];
  if (!s) return;
  var args = { p_id: id };
  if (s.patch) {
    var patch;
    try { patch = JSON.parse(card.querySelector('[data-json]').value); }
    catch (e) { return A.toast('Yama JSON’u okunamadı: ' + e.message, true); }
    var bad = window.SWPatches.validate(patch);
    if (bad) return A.toast(bad, true);
    args.p_patch = patch;
  }
  var note = card.querySelector('[data-note]').value.trim();
  if (note) args.p_note = note;
  setBusy(card, true);
  try {
    var c = await cl();
    var r = await c.rpc('approve_suggestion', args);
    if (r.error) throw r.error;
    W.LivePatches.invalidate(); PT.rows = null;
    if (args.p_patch) applyLocal(args.p_patch);
    A.toast(args.p_patch ? 'Onaylandı — içerik sitede canlı.' : 'Onaylandı.');
    await loadSuggestions();
  } catch (e) { setBusy(card, false); A.toast(errText(e), true); }
}

async function rejectSuggestion(id, card) {
  var note = card.querySelector('[data-note]').value.trim();
  setBusy(card, true);
  try {
    var c = await cl();
    var args = { p_id: id };
    if (note) args.p_note = note;
    var r = await c.rpc('reject_suggestion', args);
    if (r.error) throw r.error;
    A.toast('Öneri reddedildi.');
    await loadSuggestions();
  } catch (e) { setBusy(card, false); A.toast(errText(e), true); }
}

/* ═══ 3. YORUM MODERASYONU ═════════════════════════════════════ */
var CM = { rows: [], type: '', q: '', labels: {}, err: '' };

function renderComments() {
  view().innerHTML = loadingHTML();
  loadComments();
}

async function loadComments() {
  try {
    var c = await cl();
    var r = await c.from('comments')
      .select('id,page_type,page_id,parent_id,user_id,body,is_deleted,seal_count,created_at,author:profiles!user_id(username,role,is_banned)')
      .order('created_at', { ascending: false }).limit(200);
    if (r.error) throw r.error;
    CM.rows = r.data || [];
    CM.labels = {};
    var keys = uniq(CM.rows.map(function (x) { return x.page_type + ':' + x.page_id; }));
    await Promise.all(keys.map(async function (k) {
      var i = k.indexOf(':');
      CM.labels[k] = await U.pageLabel(k.slice(0, i), k.slice(i + 1));
    }));
    CM.err = '';
  } catch (e) { CM.err = errText(e); }
  if (A.current() === 'comments') drawComments();
}

function drawComments() {
  var v = view();
  if (CM.err) { v.innerHTML = '<div class="notice warn"><strong>Yorumlar yüklenemedi:</strong> ' + esc(CM.err) + '</div>'; return; }
  var q = CM.q.toLowerCase();
  var rows = CM.rows.filter(function (r) {
    if (CM.type && r.page_type !== CM.type) return false;
    if (!q) return true;
    return (r.body || '').toLowerCase().indexOf(q) >= 0 || ((r.author && r.author.username) || '').toLowerCase().indexOf(q) >= 0;
  });
  var types = ['character', 'kingdom', 'chapter', 'house', 'god'];
  var bar = '<div class="cm-bar"><select class="f-input" id="cm-type" style="max-width:200px"><option value="">Tüm sayfa türleri</option>' +
    types.map(function (t) { return '<option value="' + t + '"' + (CM.type === t ? ' selected' : '') + '>' + esc(U.typeLabel(t)) + '</option>'; }).join('') + '</select>' +
    '<input class="f-input" id="cm-q" placeholder="Yorum veya kullanıcı ara…" value="' + esc(CM.q) + '">' +
    '<span class="sg-meta">' + rows.length + ' / ' + CM.rows.length + ' yorum (son 200)</span></div>';
  if (!rows.length) { v.innerHTML = bar + '<div class="empty-a">Yorum bulunamadı.</div>'; bindCmBar(); return; }
  v.innerHTML = bar + '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Yazar</th><th>Yorum</th><th>Sayfa</th><th>Tarih</th><th></th></tr></thead><tbody>' +
    rows.map(function (r) {
      var a = r.author || { username: '?' }, key = r.page_type + ':' + r.page_id;
      return '<tr><td><div class="cell-name">' + esc(a.username) + '</div><div class="cell-sub">' +
        (a.role === 'admin' ? '<span class="pill admin">Vakanüvis</span> ' : '') + (a.is_banned ? '<span class="pill ban">Yasaklı</span>' : '') + '</div></td>' +
        '<td><div class="cm-body' + (r.is_deleted ? ' gone' : '') + '">' + (r.is_deleted ? '[silindi — yanıtları duruyor]' : esc(r.body)) + '</div>' +
        '<div class="cell-sub">' + (r.parent_id ? '↳ yanıt · ' : '') + (r.seal_count || 0) + ' mühür</div></td>' +
        '<td class="cm-page"><a href="' + esc(U.pageUrl(r.page_type, r.page_id)) + '" target="_blank" rel="noopener">' +
        esc(U.typeLabel(r.page_type)) + ' · ' + esc(CM.labels[key] || r.page_id) + '</a></td>' +
        '<td><div class="cell-sub">' + esc(fdt(r.created_at)) + '</div></td>' +
        '<td class="cell-acts">' +
        (r.is_deleted ? '' : '<button class="abtn sm danger" type="button" data-cm="del" data-id="' + esc(r.id) + '">Sil</button>') +
        '<button class="abtn sm danger" type="button" data-cm="purge" data-id="' + esc(r.id) + '" title="Bu yorumu ve tüm yanıtlarını kalıcı siler">Konuyu sil</button>' +
        (a.role !== 'admin' && !a.is_banned ? '<button class="abtn sm" type="button" data-cm="ban" data-uid="' + esc(r.user_id) + '" data-name="' + esc(a.username) + '">Yasakla</button>' : '') +
        '</td></tr>';
    }).join('') + '</tbody></table></div>';
  bindCmBar();
}
function bindCmBar() {
  var t = $('#cm-type'), q = $('#cm-q');
  if (t) t.addEventListener('change', function () { CM.type = t.value; drawComments(); });
  if (q) q.addEventListener('input', function () {
    CM.q = q.value; var pos = q.selectionStart; drawComments();
    var n = $('#cm-q'); if (n) { n.focus(); n.setSelectionRange(pos, pos); }
  });
}

/* ═══ 4. KULLANICILAR ═════════════════════════════════════════ */
var US = { rows: [], q: '', err: '' };

function renderUsers() {
  view().innerHTML = loadingHTML();
  loadUsers();
}
async function loadUsers() {
  try {
    var c = await cl();
    var r = await c.rpc('admin_list_users');
    if (r.error) throw r.error;
    US.rows = r.data || []; US.err = '';
  } catch (e) { US.err = errText(e); }
  if (A.current() === 'users') drawUsers();
}
function drawUsers() {
  var v = view();
  if (US.err) { v.innerHTML = '<div class="notice warn"><strong>Kullanıcılar yüklenemedi:</strong> ' + esc(US.err) + '</div>'; return; }
  var q = US.q.toLowerCase(), myId = me().user && me().user.id;
  var rows = US.rows.filter(function (r) { return !q || (r.username + ' ' + (r.email || '')).toLowerCase().indexOf(q) >= 0; });
  var bar = '<div class="cm-bar"><input class="f-input" id="us-q" placeholder="Kullanıcı adı veya e-posta ara…" value="' + esc(US.q) + '">' +
    '<span class="sg-meta">' + rows.length + ' / ' + US.rows.length + ' üye</span></div>';
  if (!rows.length) { v.innerHTML = bar + '<div class="empty-a">Kullanıcı bulunamadı.</div>'; bindUsBar(); return; }
  v.innerHTML = bar + '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Kullanıcı</th><th>E-posta</th><th>Rol</th><th>Kayıt</th><th>Yorum</th><th>Öneri</th><th></th></tr></thead><tbody>' +
    rows.map(function (r) {
      var self = r.id === myId, admin = r.role === 'admin';
      return '<tr><td><div class="cell-name">' + esc(r.username) + (self ? ' <span class="cell-sub">(sen)</span>' : '') + '</div>' +
        (r.is_banned ? '<div class="cell-sub"><span class="pill ban">Yasaklı</span></div>' : '') + '</td>' +
        '<td><div class="cell-sub">' + esc(r.email || '') + '</div></td>' +
        '<td><span class="pill ' + (admin ? 'admin' : 'neutral') + '">' + (admin ? 'Vakanüvis' : 'Kâtip') + '</span></td>' +
        '<td><div class="cell-sub">' + esc(fdt(r.created_at)) + '</div></td>' +
        '<td>' + (r.comment_count || 0) + '</td><td>' + (r.suggestion_count || 0) + '</td>' +
        '<td class="cell-acts">' + (self ? '' :
          '<button class="abtn sm" type="button" data-us="role" data-id="' + esc(r.id) + '" data-name="' + esc(r.username) + '" data-to="' + (admin ? 'member' : 'admin') + '">' + (admin ? 'Kâtip yap' : 'Vakanüvis yap') + '</button>' +
          (admin ? '' : '<button class="abtn sm ' + (r.is_banned ? '' : 'danger') + '" type="button" data-us="ban" data-id="' + esc(r.id) + '" data-name="' + esc(r.username) + '" data-to="' + (r.is_banned ? '0' : '1') + '">' + (r.is_banned ? 'Yasağı kaldır' : 'Yasakla') + '</button>')) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  bindUsBar();
}
function bindUsBar() {
  var q = $('#us-q');
  if (q) q.addEventListener('input', function () {
    US.q = q.value; var pos = q.selectionStart; drawUsers();
    var n = $('#us-q'); if (n) { n.focus(); n.setSelectionRange(pos, pos); }
  });
}

async function rpcThen(name, args, okMsg, reload) {
  try {
    var c = await cl();
    var r = await c.rpc(name, args);
    if (r.error) throw r.error;
    A.toast(okMsg);
    if (reload) reload();
  } catch (e) { A.toast(errText(e), true); }
}

/* ═══ 5. VERİ & YAYIN: canlı yamalar ═════════════════════════ */
var PT = { rows: null };

async function addPatchesPanel() {
  var v = view();
  if ($('#cm-patches')) return;
  var panel = document.createElement('div');
  panel.className = 'panel'; panel.id = 'cm-patches';
  panel.innerHTML = '<div class="panel-t">Onaylı Topluluk Yamaları</div>' + loadingHTML();
  v.appendChild(panel);

  /* Yerel parola paneli bu modda anlamsız: hesap girişi kullanılıyor. */
  $$('#view .panel').forEach(function (p) {
    var t = p.querySelector('.panel-t');
    if (t && t.textContent.trim() === 'Parola') {
      p.innerHTML = '<div class="panel-t">Giriş</div><p class="f-hint">Panel girişi artık Vakanüvis hesabıyla yapılıyor; ' +
        'yerel parola devre dışı. Parolanı sitedeki hesap menüsünden / “Parolamı unuttum” ile değiştirebilirsin.</p>';
    }
  });

  try {
    var c = await cl();
    var r = await c.from('content_patches').select('id,file,path,record_id,op,data,created_at')
      .is('merged_at', null).order('created_at', { ascending: true });
    if (r.error) throw r.error;
    PT.rows = r.data || [];
  } catch (e) {
    panel.innerHTML = '<div class="panel-t">Onaylı Topluluk Yamaları</div><div class="notice warn">' + esc(errText(e)) + '</div>';
    return;
  }
  drawPatchesPanel(panel);
}

function drawPatchesPanel(panel) {
  var rows = PT.rows || [];
  panel = panel || $('#cm-patches');
  if (!panel) return;
  var files = uniq(rows.map(function (r) { return r.file; }));
  panel.innerHTML = '<div class="panel-t">Onaylı Topluluk Yamaları</div>' +
    '<p class="pt-note">Onayladığın öneriler <strong>anında, herkesin sitesinde</strong> görünür (veritabanındaki yama, JSON’un üzerine canlı bindirilir). ' +
    'Kalıcı olarak depoya işlemek için: <strong>(1)</strong> birleştirilmiş JSON dosyalarını indirip <code>data/</code> klasörüne koyun ve commit edin, ' +
    '<strong>(2)</strong> ardından “işlendi say”a basın. Otomatik yol için README’deki GitHub Action’a bakın.</p>' +
    (rows.length
      ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Dosya</th><th>Kayıt</th><th>İşlem</th><th>Değişen alanlar</th><th>Tarih</th><th></th></tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr><td><div class="cell-name">' + esc(r.file) + '</div><div class="cell-sub">' + esc(r.path) + '</div></td>' +
            '<td>' + esc(r.record_id) + '</td><td><span class="pill neutral">' + esc(r.op) + '</span></td>' +
            '<td><div class="pt-sum">' + esc(Object.keys(r.data || {}).join(', ') || '—') + '</div></td>' +
            '<td><div class="cell-sub">' + esc(fdt(r.created_at)) + '</div></td>' +
            '<td class="cell-acts"><button class="abtn sm danger" type="button" data-pt="undo" data-id="' + esc(r.id) + '">Geri al</button></td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<div class="btn-row" style="margin-top:1rem"><button class="abtn primary" type="button" data-pt="export">Birleştirilmiş JSON dosyalarını indir (' + files.length + ')</button>' +
        '<button class="abtn" type="button" data-pt="merged">Depoya işlendi say</button></div>'
      : '<div class="empty-a">Bekleyen canlı yama yok — tüm onaylı öneriler depoya işlenmiş.</div>');
}

function exportMerged() {
  var rows = PT.rows || [];
  var files = uniq(rows.map(function (r) { return r.file; }));
  if (!files.length) return A.toast('İndirilecek yama yok.', true);
  files.forEach(function (f, i) {
    var base = A.DB[f];
    if (!base) return;
    var d = JSON.parse(JSON.stringify(base));
    window.SWPatches.applyAll(d, f, rows);          /* idempotent: zaten uygulanmışsa değişmez */
    setTimeout(function () { A.download(f, JSON.stringify(d, null, 2)); }, i * 320);
  });
  A.toast(files.length + ' dosya indiriliyor… data/ klasörüne koyup commit edin.');
}

/* ═══ 6. PANO BİLDİRİMİ ═══════════════════════════════════════ */
var dashBusy = false;
async function addDashNotice() {
  if (dashBusy || $('#cm-dash')) return;
  dashBusy = true;
  var n = await refreshBadge();
  dashBusy = false;
  if (!n || A.current() !== 'dash' || $('#cm-dash')) return;
  var box = document.createElement('div');
  box.className = 'notice'; box.id = 'cm-dash';
  box.innerHTML = '<strong>' + n + ' bekleyen öneri var.</strong> <button class="abtn sm primary" type="button" data-go-sg style="margin-left:.6rem">İncele</button>';
  view().insertBefore(box, view().firstChild);
}

/* ═══ 7. KAYIT + OLAY BAĞLAMA ═════════════════════════════════ */
A.VIEWS.suggestions = { title: 'Öneriler', desc: 'Üyelerin gönderdiği düzeltme ve ekleme önerileri — incele, onayla (siteye canlı yansır) ya da reddet.', render: renderSuggestions };
A.VIEWS.comments = { title: 'Yorumlar', desc: 'Divan Tartışması yorumlarını denetle; uygunsuz yorumu sil, yazarı yasakla.', render: renderComments };
A.VIEWS.users = { title: 'Kullanıcılar', desc: 'Kayıtlı üyeler, roller (Kâtip / Vakanüvis) ve yasaklar.', render: renderUsers };

view().addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('button');
  if (!b) return;
  if (b.hasAttribute('data-go-sg')) { A.go('suggestions'); return; }

  if (b.dataset.sgtab) { SG.filter = b.dataset.sgtab; drawSuggestions(); return; }
  if (b.dataset.sg) {
    var card = b.closest('.sg-card');
    if (!card) return;
    if (b.dataset.sg === 'approve') approveSuggestion(card.dataset.id, card);
    else if (b.dataset.sg === 'reject') A.confirmBox('Öneriyi reddet', 'Bu öneri reddedilsin mi? Üye, notunu profilinde görür.', function () { rejectSuggestion(card.dataset.id, card); });
    return;
  }

  if (b.dataset.cm) {
    var id = b.dataset.id;
    if (b.dataset.cm === 'del') A.confirmBox('Yorumu sil', 'Bu yorum silinsin mi? (Yanıtı varsa “silindi” izi kalır.)', function () { rpcThen('delete_comment', { p_id: id, p_purge: false }, 'Yorum silindi.', loadComments); });
    else if (b.dataset.cm === 'purge') A.confirmBox('Konuyu kalıcı sil', 'Bu yorum VE altındaki tüm yanıtlar kalıcı olarak silinsin mi? Geri alınamaz.', function () { rpcThen('delete_comment', { p_id: id, p_purge: true }, 'Konu silindi.', loadComments); });
    else if (b.dataset.cm === 'ban') A.confirmBox('Yazarı yasakla', '“' + b.dataset.name + '” yorum ve öneri gönderemeyecek. Devam edilsin mi?', function () { rpcThen('admin_set_ban', { p_user: b.dataset.uid, p_banned: true }, 'Kullanıcı yasaklandı.', loadComments); });
    return;
  }

  if (b.dataset.us) {
    var uid = b.dataset.id, name = b.dataset.name, to = b.dataset.to;
    if (b.dataset.us === 'role') {
      A.confirmBox(to === 'admin' ? 'Vakanüvis yap' : 'Yetkiyi al',
        '“' + name + '” ' + (to === 'admin' ? 'tüm yönetim paneline erişebilecek. Emin misin?' : 'artık yönetici olmayacak. Devam edilsin mi?'),
        function () { rpcThen('admin_set_role', { p_user: uid, p_role: to }, 'Rol güncellendi.', loadUsers); });
    } else {
      var ban = to === '1';
      A.confirmBox(ban ? 'Kullanıcıyı yasakla' : 'Yasağı kaldır', '“' + name + '” için işlem uygulansın mı?',
        function () { rpcThen('admin_set_ban', { p_user: uid, p_banned: ban }, ban ? 'Kullanıcı yasaklandı.' : 'Yasak kaldırıldı.', loadUsers); });
    }
    return;
  }

  if (b.dataset.pt) {
    if (b.dataset.pt === 'export') exportMerged();
    else if (b.dataset.pt === 'undo') {
      var pid = b.dataset.id;
      A.confirmBox('Yamayı geri al', 'Bu yama silinsin mi? İçerik sitede eski haline döner (bu paneli yenilemen gerekir).', async function () {
        try {
          var c = await cl();
          var r = await c.from('content_patches').delete().eq('id', pid);
          if (r.error) throw r.error;
          W.LivePatches.invalidate();
          PT.rows = (PT.rows || []).filter(function (x) { return x.id !== pid; });
          drawPatchesPanel();
          A.toast('Yama silindi. Sayfayı yenileyince panel verisi de eski haline döner.');
        } catch (er) { A.toast(errText(er), true); }
      });
    } else if (b.dataset.pt === 'merged') {
      A.confirmBox('Depoya işlendi say',
        'Yalnızca birleştirilmiş JSON dosyalarını data/ klasörüne koyup commit ettiysen devam et. Aksi halde onaylı içerik, yamalar kapanınca siteden kaybolur.',
        function () {
          rpcThen('mark_patches_merged', {}, 'Yamalar “işlendi” olarak işaretlendi.', function () {
            W.LivePatches.invalidate(); PT.rows = []; drawPatchesPanel();
          });
        });
    }
    return;
  }
});

/* #view her yeniden çizildiğinde: veri sayfasına yama paneli, panoya bildirim ekle. */
new MutationObserver(function () {
  if (!gate.signedIn) return;
  var v = A.current();
  if (v === 'data' && !$('#cm-patches')) addPatchesPanel();
  else if (v === 'dash' && !$('#cm-dash')) addDashNotice();
}).observe(view(), { childList: true });

})();
