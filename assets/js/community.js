/* ═══════════════════════════════════════════════════════════════
   STALLHART WIKI — Topluluk Katmanı: ÇEKİRDEK  (community.js)
   ---------------------------------------------------------------
   Bu dosya her sayfada yüklenir ama kendisi hafiftir; ağır parçalar
   yalnızca ilgili sayfada, ihtiyaç anında yüklenir:

     community.js          çekirdek: Supabase istemcisi, oturum, giriş /
                           kayıt / parola sıfırlama, üst menü düğmesi,
                           profil modalı, "Öneri Sun" düğmesi
     community-divan.js    Divan Tartışması (yorumlar)   ← mountComments()
     community-suggest.js  Vakanüvise Öneri Sun modalı   ← openSuggest()

   config.js boşsa bu dosya hiçbir şey yapmaz (site eskisi gibidir).

   Dışa açılan API:  Wiki.Community  (dosya sonundaki listeye bakın)
   ═══════════════════════════════════════════════════════════════ */
'use strict';

(function () {

var W = window.Wiki;
if (!W) return;

var CFG  = window.SW_CONFIG || {};
var FEAT = Object.assign({ comments: true, suggestions: true, patches: true }, CFG.features || {});
var ENABLED = !!(CFG.supabaseUrl && CFG.supabaseAnonKey && /^https?:\/\//i.test(String(CFG.supabaseUrl)));
var Lang = W.Lang, esc = W.esc, loadData = W.loadData, BASE_PATH = W.BASE_PATH;

var SUPABASE_VERSION = '2.116.0';
var API = { enabled: ENABLED, features: FEAT, modules: {} };
W.Community = API;

/* Yapılandırma yoksa: sessiz, zararsız kabuk. */
if (!ENABLED) {
  API.init = function () {
    if (window.console) console.info('[Topluluk] assets/js/config.js doldurulmadığı için üyelik / yorum / öneri özellikleri kapalı.');
  };
  API.mountComments = API.unmountComments = API.setContext = API.openAuth = API.openProfile = API.openSuggest = function () {};
  API.onAuth = function () { return function () {}; };
  API.getState = function () { return { ready: true, user: null, profile: null, isAdmin: false }; };
  return;
}

/* ── 1. ÇEVİRİ (TR / EN) ─────────────────────────────────────── */
var STR = { tr: {}, en: {} };
function addStrings(d) { ['tr', 'en'].forEach(function (l) { Object.assign(STR[l], d[l] || {}); }); }
function tt(key, vars) {
  var l = Lang.get();
  var s = (STR[l] && STR[l][key]) || STR.tr[key] || key;
  if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] === undefined ? '' : vars[k]; });
  return s;
}

addStrings({
  tr: {
    close: 'Kapat', cancel: 'Vazgeç', loading: 'Yükleniyor…', save: 'Kaydet',
    signin: 'Giriş yap', signup: 'Kayıt ol', signout: 'Çıkış yap', nav_signin: 'Giriş',
    auth_title: 'Divan’ın Kapısı',
    auth_sub: 'Yorum yazmak, mühür basmak ve öneri sunmak için giriş yap.',
    email: 'E-posta', password: 'Parola', username: 'Kullanıcı adı',
    username_hint: '3–20 karakter; boşluk ve özel işaret olmasın. Sonradan değiştirilemez.',
    pw_hint: 'En az 8 karakter.', show_pw: 'Parolayı göster',
    forgot: 'Parolamı unuttum', reset_title: 'Parolayı sıfırla',
    reset_sub: 'E-postanı yaz; sıfırlama bağlantısını gönderelim.',
    reset_send: 'Bağlantı gönder', reset_sent: 'Bu adres kayıtlıysa, parola sıfırlama bağlantısı gönderildi. Gelen kutunu (ve gereksiz klasörünü) kontrol et.',
    back_login: '← Girişe dön',
    newpw_title: 'Yeni parola belirle', newpw_btn: 'Parolayı güncelle', pw_updated: 'Parolan güncellendi.',
    welcome: 'Hoş geldin, {name}.', signed_out: 'Çıkış yapıldı.',
    confirm_sent: 'Hesabın oluşturuldu. E-postana bir doğrulama bağlantısı gönderdik; bağlantıya tıkladıktan sonra giriş yapabilirsin.',
    err_login: 'E-posta veya parola hatalı.',
    err_unconfirmed: 'E-posta adresini henüz doğrulamadın. Gelen kutundaki bağlantıya tıkla.',
    err_exists: 'Bu e-posta adresiyle zaten bir hesap var.',
    err_username_taken: 'Bu kullanıcı adı alınmış.',
    err_username_bad: 'Kullanıcı adı 3–20 karakter olmalı; boşluk ve özel işaret içermemeli.',
    err_pw_short: 'Parola en az 8 karakter olmalı.', err_pw_match: 'Parolalar aynı değil.',
    err_email: 'Geçerli bir e-posta adresi yaz.',
    err_network: 'Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.',
    err_rate: 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.',
    err_denied: 'Bu işlem için yetkin yok (hesabın kısıtlanmış olabilir).',
    err_generic: 'Bir şeyler ters gitti.',
    role_member: 'Kâtip', role_admin: 'Vakanüvis',
    menu_profile: 'Profilim', menu_suggest: 'Öneri sun', menu_admin: 'Vakanüvis Paneli',
    account: 'Hesap',
    profile: 'Profil', p_notfound: 'Profil bulunamadı.', joined: 'Kayıt: {date}',
    p_comments: 'Yorumlar', p_suggestions: 'Öneriler', p_settings: 'Ayarlar',
    p_none_comments: 'Henüz yorum yok.', p_none_sugg: 'Henüz öneri yok.',
    p_house: 'Favori hane', p_no_house: '— Seçilmedi —', p_title: 'Unvan', p_avatar: 'Avatar',
    p_saved: 'Profil güncellendi.', p_load_fail: 'Profil yüklenemedi.',
    stat_comments: 'yorum', stat_sugg: 'öneri',
    st_pending: 'Bekliyor', st_approved: 'Onaylandı', st_rejected: 'Reddedildi',
    admin_note: 'Vakanüvis notu', withdraw: 'Geri çek', withdrawn: 'Öneri geri çekildi.',
    withdraw_q: 'Bu öneriyi geri çekmek istiyor musun?', yes_withdraw: 'Evet, geri çek',
    seals: 'mühür', banned_note: 'Hesabın kısıtlanmış; yorum ve öneri gönderemezsin.',
    tl_character: 'Karakter', tl_kingdom: 'Devlet', tl_chapter: 'Bölüm', tl_house: 'Hane', tl_god: 'Tanrı',
    kind_fix: 'Düzeltme', kind_new_character: 'Yeni karakter', kind_new_term: 'Yeni terim', kind_other: 'Genel not',
    fab_label: 'Vakanüvise Öneri Sun', fab_short: 'Öneri',
    t_now: 'az önce', t_min: '{n} dk önce', t_hour: '{n} sa önce', t_day: '{n} gün önce',
    lib_fail: 'Üyelik sistemi yüklenemedi (ağ engeli olabilir). Sayfayı yenileyip tekrar dene.'
  },
  en: {
    close: 'Close', cancel: 'Cancel', loading: 'Loading…', save: 'Save',
    signin: 'Sign in', signup: 'Sign up', signout: 'Sign out', nav_signin: 'Sign in',
    auth_title: 'The Gate of the Divan',
    auth_sub: 'Sign in to comment, press seals and submit suggestions.',
    email: 'Email', password: 'Password', username: 'Username',
    username_hint: '3–20 characters; no spaces or special marks. Cannot be changed later.',
    pw_hint: 'At least 8 characters.', show_pw: 'Show password',
    forgot: 'Forgot my password', reset_title: 'Reset password',
    reset_sub: 'Enter your email and we will send a reset link.',
    reset_send: 'Send link', reset_sent: 'If this address is registered, a reset link has been sent. Check your inbox (and spam folder).',
    back_login: '← Back to sign in',
    newpw_title: 'Set a new password', newpw_btn: 'Update password', pw_updated: 'Your password has been updated.',
    welcome: 'Welcome, {name}.', signed_out: 'Signed out.',
    confirm_sent: 'Your account has been created. We sent a verification link to your email; click it, then sign in.',
    err_login: 'Wrong email or password.',
    err_unconfirmed: 'You have not verified your email yet. Click the link in your inbox.',
    err_exists: 'An account with this email already exists.',
    err_username_taken: 'This username is taken.',
    err_username_bad: 'Username must be 3–20 characters with no spaces or special marks.',
    err_pw_short: 'Password must be at least 8 characters.', err_pw_match: 'Passwords do not match.',
    err_email: 'Enter a valid email address.',
    err_network: 'Could not reach the server. Check your connection and try again.',
    err_rate: 'Too many attempts. Wait a moment and try again.',
    err_denied: 'You are not allowed to do this (your account may be restricted).',
    err_generic: 'Something went wrong.',
    role_member: 'Scribe', role_admin: 'Chronicler',
    menu_profile: 'My profile', menu_suggest: 'Submit suggestion', menu_admin: 'Chronicler panel',
    account: 'Account',
    profile: 'Profile', p_notfound: 'Profile not found.', joined: 'Joined {date}',
    p_comments: 'Comments', p_suggestions: 'Suggestions', p_settings: 'Settings',
    p_none_comments: 'No comments yet.', p_none_sugg: 'No suggestions yet.',
    p_house: 'Favorite house', p_no_house: '— None —', p_title: 'Title', p_avatar: 'Avatar',
    p_saved: 'Profile updated.', p_load_fail: 'Could not load the profile.',
    stat_comments: 'comments', stat_sugg: 'suggestions',
    st_pending: 'Pending', st_approved: 'Approved', st_rejected: 'Rejected',
    admin_note: 'Chronicler’s note', withdraw: 'Withdraw', withdrawn: 'Suggestion withdrawn.',
    withdraw_q: 'Do you want to withdraw this suggestion?', yes_withdraw: 'Yes, withdraw',
    seals: 'seals', banned_note: 'Your account is restricted; you cannot post comments or suggestions.',
    tl_character: 'Character', tl_kingdom: 'State', tl_chapter: 'Chapter', tl_house: 'House', tl_god: 'God',
    kind_fix: 'Correction', kind_new_character: 'New character', kind_new_term: 'New term', kind_other: 'General note',
    fab_label: 'Suggest to the Chronicler', fab_short: 'Suggest',
    t_now: 'just now', t_min: '{n} min ago', t_hour: '{n} h ago', t_day: '{n} d ago',
    lib_fail: 'The membership system could not be loaded (a network block, perhaps). Refresh and try again.'
  }
});

/* Unvanlar: DB'de Türkçe etiket saklanır; İngilizce görünümde karşılığı gösterilir.
   'Vakanüvis' burada YOK — o yalnızca yöneticilere rol rozeti olarak verilir. */
var TITLES = [
  ['Kâtip', 'Scribe'], ['Çırak', 'Apprentice'], ['Haberci', 'Herald'], ['Arşivci', 'Archivist'],
  ['Gezgin', 'Wanderer'], ['Şövalye', 'Knight'], ['Bilge', 'Sage'], ['Divan Üyesi', 'Council Member'],
  ['Gölge Elçi', 'Shadow Envoy'], ['Kadim Okur', 'Ancient Reader']
];
function titleLabel(t) {
  if (!t) return '';
  for (var i = 0; i < TITLES.length; i++) if (TITLES[i][0] === t) return Lang.get() === 'en' ? TITLES[i][1] : TITLES[i][0];
  return t;
}
function roleLabel(role) { return role === 'admin' ? tt('role_admin') : tt('role_member'); }

/* ── 2. YARDIMCILAR ──────────────────────────────────────────── */
function locale() { return Lang.get() === 'tr' ? 'tr-TR' : 'en-GB'; }
function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch (e) { return ''; }
}
function timeAgo(iso) {
  var d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (isNaN(d)) return '';
  if (d < 45) return tt('t_now');
  if (d < 3600) return tt('t_min', { n: Math.max(1, Math.round(d / 60)) });
  if (d < 86400) return tt('t_hour', { n: Math.round(d / 3600) });
  if (d < 86400 * 14) return tt('t_day', { n: Math.round(d / 86400) });
  return fmtDate(iso);
}
function slugify(str) {
  var map = { 'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g', 'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c' };
  return String(str || '').replace(/[ıİşŞğĞüÜöÖçÇ]/g, function (m) { return map[m]; })
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 60);
}
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function loadScript(src) {
  return new Promise(function (resolve, reject) {
    var s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = function () { resolve(); };
    s.onerror = function () { s.remove(); reject(new Error('Yüklenemedi: ' + src)); };
    document.head.appendChild(s);
  });
}

/* Çeviri katmanı: sunucu / ağ hatalarını kullanıcıya anlaşılır metne çevirir. */
function mapErr(err) {
  var m = String((err && (err.message || err.error_description)) || err || '');
  var code = err && err.code;
  if (/invalid login credentials/i.test(m)) return tt('err_login');
  if (/email not confirmed/i.test(m)) return tt('err_unconfirmed');
  if (/already registered|already been registered|user already/i.test(m)) return tt('err_exists');
  if (/password.*(at least|characters|weak|short)/i.test(m)) return tt('err_pw_short');
  if (/rate limit|too many|security purposes|over_email_send_rate/i.test(m)) return tt('err_rate');
  if (/failed to fetch|networkerror|load failed|network request failed|Yüklenemedi/i.test(m)) return tt('err_network');
  if (code === '42501' || /row-level security|permission denied/i.test(m)) return tt('err_denied');
  return m || tt('err_generic');
}

/* ── 3. SUPABASE İSTEMCİSİ (CDN, tembel yükleme) ──────────────── */
var S = {
  client: null, clientPromise: null, user: null, profile: null,
  ready: false, restoring: false, profilePromise: null, listeners: [], inited: false
};

function hasStoredSession() { try { return !!localStorage.getItem('sw-auth'); } catch (e) { return false; } }
function urlHasAuthFlow() { return /access_token=|type=recovery|type=signup|type=invite|error_code=/.test(location.hash || ''); }
S.restoring = hasStoredSession() || urlHasAuthFlow();

function loadSupabaseLib() {
  if (window.supabase && window.supabase.createClient) return Promise.resolve();
  var urls = [];
  if (CFG.supabaseLibUrl) urls.push(/^https?:/i.test(CFG.supabaseLibUrl) ? CFG.supabaseLibUrl : BASE_PATH + CFG.supabaseLibUrl);
  urls.push('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@' + SUPABASE_VERSION + '/dist/umd/supabase.js');
  urls.push('https://unpkg.com/@supabase/supabase-js@' + SUPABASE_VERSION + '/dist/umd/supabase.js');
  var chain = Promise.reject(new Error('start'));
  urls.forEach(function (u) {
    chain = chain.catch(function () {
      return loadScript(u).then(function () {
        if (!(window.supabase && window.supabase.createClient)) throw new Error('supabase global yok');
      });
    });
  });
  return chain.catch(function () { throw new Error(tt('lib_fail')); });
}

function getClient() {
  if (S.clientPromise) return S.clientPromise;
  S.clientPromise = (async function () {
    await loadSupabaseLib();
    var client = window.supabase.createClient(String(CFG.supabaseUrl).replace(/\/+$/, ''), CFG.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'sw-auth' }
    });
    S.client = client;
    /* Not: callback içinde doğrudan başka Supabase çağrısı yapmayın (kilitlenir) → setTimeout. */
    client.auth.onAuthStateChange(function (event, session) {
      if (event === 'INITIAL_SESSION') return;          /* aşağıda elle işleniyor */
      setTimeout(function () { handleAuth(event, session); }, 0);
    });
    var res = await client.auth.getSession();
    await handleAuth('INITIAL_SESSION', res && res.data ? res.data.session : null);
    return client;
  })().catch(function (err) {
    S.clientPromise = null;
    S.restoring = false; S.ready = true;
    renderNav();
    throw err;
  });
  return S.clientPromise;
}

async function refreshProfile() {
  if (!S.user) { S.profile = null; return null; }
  if (S.profilePromise) return S.profilePromise;
  S.profilePromise = (async function () {
    var uid = S.user && S.user.id;
    for (var i = 0; i < 4; i++) {
      var r = await S.client.from('profiles')
        .select('id,username,avatar,favorite_house,title,role,is_banned,created_at')
        .eq('id', uid).maybeSingle();
      if (r && r.data) { S.profile = r.data; return r.data; }
      await sleep(450);                                  /* kayıt tetikleyicisi geç kalmış olabilir */
    }
    S.profile = null;
    return null;
  })().then(function (p) { S.profilePromise = null; return p; },
            function (e) { S.profilePromise = null; throw e; });
  return S.profilePromise;
}

async function handleAuth(event, session) {
  var uid = session && session.user ? session.user.id : null;
  var changed = uid !== (S.user ? S.user.id : null);
  S.user = session ? session.user : null;
  if (!uid) S.profile = null;
  else if (changed || !S.profile) { try { await refreshProfile(); } catch (e) { console.warn('[Topluluk] profil alınamadı', e); } }
  S.ready = true; S.restoring = false;
  renderNav();
  if (event === 'PASSWORD_RECOVERY') openNewPassword();
  emit(event);
}

function getState() {
  return { ready: S.ready, user: S.user, profile: S.profile, isAdmin: !!(S.profile && S.profile.role === 'admin') };
}
function onAuth(fn) {
  S.listeners.push(fn);
  return function () { S.listeners = S.listeners.filter(function (f) { return f !== fn; }); };
}
function emit(event) {
  var st = getState(); st.event = event;
  S.listeners.slice().forEach(function (fn) { try { fn(st); } catch (e) { console.warn(e); } });
}

function requireLogin(reason) {
  if (S.user) return true;
  openAuth('login', { reason: reason });
  return false;
}

/* ── 4. HANE İNDEKSİ + AVATAR / ARMA ─────────────────────────── */
var Houses = (function () {
  var map = null, list = null, p = null;
  function load() {
    if (!p) {
      p = loadData('houses.json').then(function (d) {
        map = {}; list = [];
        (d.provinces || []).forEach(function (pr) {
          (pr.houses || []).forEach(function (h) {
            var rec = { id: h.id, name: h.name, meaning: h.meaning, symbol: h.symbol, motto: h.motto,
                        colors: Array.isArray(h.colors) ? h.colors : [], province: pr.name };
            map[h.id] = rec; list.push(rec);
          });
        });
      }).catch(function () { map = {}; list = []; });
    }
    return p;
  }
  return { load: load, get: function (id) { return (map && map[id]) || null; }, all: function () { return list || []; } };
})();

/* Avatar simgeleri (24×24, çizgi). 'initial' = kullanıcı adının baş harfi. */
var ICONS = {
  crown:  '<path d="M3 18h18M4 18 3 8l5 4 4-7 4 7 5-4-1 10"/>',
  sword:  '<path d="M12 3v12M9.5 5.5 12 3l2.5 2.5M7 15h10M12 15v5M10 20h4"/>',
  quill:  '<path d="M20 4C11 4 6 9 5 17l-1 3M20 4c0 9-5 14-13 15M9 15l6-6"/>',
  tower:  '<path d="M6 21V9M18 21V9M6 9V5h3v2h2V5h2v2h2V5h3v4M6 9h12M10 21v-4a2 2 0 0 1 4 0v4M4 21h16"/>',
  moon:   '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  flame:  '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>',
  key:    '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v4M15 12v3"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  scroll: '<path d="M7 4h11v13a3 3 0 0 1-3 3H6a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M10 9h5M10 13h5"/>',
  eye:    '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
};
var AVATARS = ['initial'].concat(Object.keys(ICONS));

function houseColors(houseId) {
  var h = Houses.get(houseId);
  var c1 = (h && h.colors[0]) || '#7d4e22';
  var c2 = (h && (h.colors[1] || h.colors[0])) || '#b87333';
  return [c1, c2];
}

function avatarHTML(prof, size) {
  var p = prof || {};
  var c = houseColors(p.favorite_house);
  var key = ICONS[p.avatar] ? p.avatar : 'initial';
  var inner = key === 'initial'
    ? '<span class="sw-av-ch">' + esc(String(p.username || '?').trim().charAt(0).toLocaleUpperCase('tr')) + '</span>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[key] + '</svg>';
  return '<span class="sw-av sw-av-' + (size || 'md') + '" style="--av1:' + esc(c[0]) + ';--av2:' + esc(c[1]) + '">' + inner + '</span>';
}

/* Küçük arma (yorum satırında) */
function crestMini(houseId) {
  var h = Houses.get(houseId);
  if (!h) return '';
  var c = houseColors(houseId);
  return '<span class="sw-crest-mini" title="' + esc(h.name) + '" style="--c1:' + esc(c[0]) + ';--c2:' + esc(c[1]) + '"></span>';
}

/* Büyük arma (profil modalında): sancak + sembol harfi */
function crestBig(houseId) {
  var h = Houses.get(houseId);
  if (!h) return '';
  var c = houseColors(houseId);
  var glyph = h.name || Lang.t(h.symbol) || '?';
  return '<div class="sw-crest" style="--c1:' + esc(c[0]) + ';--c2:' + esc(c[1]) + '">' +
    '<span class="sw-crest-pole"></span><span class="sw-crest-cloth"></span>' +
    '<span class="sw-crest-glyph">' + esc(String(glyph).trim().charAt(0).toLocaleUpperCase('tr')) + '</span></div>';
}

/* ── 5. MODAL · TOAST · ONAY ─────────────────────────────────── */
var Modal = (function () {
  var stack = [];
  function lock() { document.body.classList.toggle('sw-noscroll', stack.length > 0); }

  function close(rec) {
    if (!rec || rec.closed) return;
    rec.closed = true;
    rec.back.remove();
    stack = stack.filter(function (r) { return r !== rec; });
    lock();
    if (rec.onClose) { try { rec.onClose(); } catch (e) { console.warn(e); } }
  }
  function open(opts) {
    var back = document.createElement('div');
    back.className = 'sw-modal-back';
    back.innerHTML =
      '<div class="sw-modal ' + esc(opts.cls || '') + '" role="dialog" aria-modal="true" aria-label="' + esc(opts.title || '') + '">' +
      '<button type="button" class="sw-x" data-close aria-label="' + esc(tt('close')) + '">✕</button>' +
      '<div class="sw-modal-body"></div></div>';
    document.body.appendChild(back);
    var rec = { back: back, box: back.firstChild, body: back.querySelector('.sw-modal-body'),
                onClose: opts.onClose, closed: false };
    rec.close = function () { close(rec); };
    rec.body.innerHTML = opts.html || '';
    back.addEventListener('mousedown', function (e) { if (e.target === back) rec.close(); });
    back.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-close]')) rec.close(); });
    stack.push(rec); lock();
    setTimeout(function () {
      if (rec.closed) return;
      if (rec.box.contains(document.activeElement)) return;      /* kullanıcı zaten bir alana geçtiyse odağı çalma */
      var f = rec.body.querySelector('[data-autofocus]') ||
              rec.body.querySelector('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),textarea,select');
      if (f) f.focus();
    }, 40);
    return rec;
  }
  function closeAll() { stack.slice().forEach(close); }

  /* Esc: yalnızca en üstteki modalı kapatır ve alttaki katmanlara (okuma modu,
     arama) ulaşmaz. Tab: odak modalın içinde kalır. */
  document.addEventListener('keydown', function (e) {
    if (!stack.length) return;
    var top = stack[stack.length - 1];
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); top.close(); return; }
    if (e.key === 'Tab') {
      var f = top.box.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled])');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (!top.box.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, true);

  return { open: open, close: close, closeAll: closeAll, top: function () { return stack[stack.length - 1] || null; } };
})();

function toast(msg, isErr) {
  var box = document.getElementById('sw-toasts');
  if (!box) {
    box = document.createElement('div');
    box.id = 'sw-toasts';
    box.setAttribute('aria-live', 'polite');
    document.body.appendChild(box);
  }
  var t = document.createElement('div');
  t.className = 'sw-toast' + (isErr ? ' err' : '');
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(function () { t.classList.add('in'); }, 10);
  setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 300); }, isErr ? 5500 : 3200);
}

function confirmBox(msg, okLabel, danger) {
  return new Promise(function (resolve) {
    var done = false;
    var rec = Modal.open({
      title: msg, cls: 'sw-confirm',
      html: '<p class="sw-confirm-msg">' + esc(msg) + '</p><div class="sw-actions">' +
            '<button type="button" class="sw-btn" data-no data-autofocus>' + esc(tt('cancel')) + '</button>' +
            '<button type="button" class="sw-btn ' + (danger ? 'danger' : 'primary') + '" data-yes>' + esc(okLabel || 'OK') + '</button></div>',
      onClose: function () { if (!done) { done = true; resolve(false); } }
    });
    rec.body.querySelector('[data-no]').addEventListener('click', function () { done = true; rec.close(); resolve(false); });
    rec.body.querySelector('[data-yes]').addEventListener('click', function () { done = true; rec.close(); resolve(true); });
  });
}

/* ── 6. GİRİŞ / KAYIT / PAROLA ───────────────────────────────── */
var EMBLEM = '<svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="var(--blood-red,#8b0000)" stroke="rgba(0,0,0,.35)" stroke-width="2"/>' +
  '<circle cx="24" cy="24" r="16" fill="none" stroke="rgba(244,236,216,.55)" stroke-width="1.5" stroke-dasharray="2 3"/>' +
  '<path d="M17 31l7-16 7 16M19.5 26h9" fill="none" stroke="rgba(244,236,216,.9)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function redirectUrl() { return CFG.siteUrl || (BASE_PATH + 'index.html'); }

function fieldHTML(label, name, type, attrs, hint) {
  return '<label class="sw-l"><span>' + esc(label) + '</span>' +
    '<input class="sw-in" type="' + type + '" name="' + name + '" ' + (attrs || '') + '>' +
    (hint ? '<small class="sw-hint">' + esc(hint) + '</small>' : '') + '</label>';
}

function openAuth(mode, opts) {
  Modal.closeAll();
  var rec = Modal.open({ title: tt('auth_title'), cls: 'sw-auth', html: '' });
  renderAuth(rec, mode || 'login', opts || {});
  return rec;
}

function renderAuth(rec, mode, opts) {
  var isReset = mode === 'reset';
  var head = '<div class="sw-auth-head"><span class="sw-emblem">' + EMBLEM + '</span>' +
    '<h2 class="sw-h">' + esc(isReset ? tt('reset_title') : tt('auth_title')) + '</h2>' +
    '<p class="sw-sub">' + esc(isReset ? tt('reset_sub') : (opts.reason || tt('auth_sub'))) + '</p></div>';
  var tabs = isReset ? '' :
    '<div class="sw-tabs" role="tablist">' +
    '<button type="button" role="tab" data-tab="login" class="' + (mode === 'login' ? 'on' : '') + '" aria-selected="' + (mode === 'login') + '">' + esc(tt('signin')) + '</button>' +
    '<button type="button" role="tab" data-tab="register" class="' + (mode === 'register' ? 'on' : '') + '" aria-selected="' + (mode === 'register') + '">' + esc(tt('signup')) + '</button></div>';

  var form;
  if (mode === 'register') {
    form = '<form class="sw-form" novalidate>' +
      fieldHTML(tt('username'), 'username', 'text', 'autocomplete="username" maxlength="20" required data-autofocus', tt('username_hint')) +
      fieldHTML(tt('email'), 'email', 'email', 'autocomplete="email" required') +
      fieldHTML(tt('password'), 'password', 'password', 'autocomplete="new-password" minlength="8" required data-pw', tt('pw_hint')) +
      '<label class="sw-check"><input type="checkbox" data-showpw> <span>' + esc(tt('show_pw')) + '</span></label>' +
      '<div class="sw-err" role="alert" hidden></div>' +
      '<button class="sw-btn primary block" type="submit">' + esc(tt('signup')) + '</button></form>';
  } else if (isReset) {
    form = '<form class="sw-form" novalidate>' +
      fieldHTML(tt('email'), 'email', 'email', 'autocomplete="email" required data-autofocus') +
      '<div class="sw-err" role="alert" hidden></div>' +
      '<button class="sw-btn primary block" type="submit">' + esc(tt('reset_send')) + '</button>' +
      '<button class="sw-link" type="button" data-tab="login">' + esc(tt('back_login')) + '</button></form>';
  } else {
    form = '<form class="sw-form" novalidate>' +
      fieldHTML(tt('email'), 'email', 'email', 'autocomplete="email" required data-autofocus') +
      fieldHTML(tt('password'), 'password', 'password', 'autocomplete="current-password" required data-pw') +
      '<label class="sw-check"><input type="checkbox" data-showpw> <span>' + esc(tt('show_pw')) + '</span></label>' +
      '<div class="sw-err" role="alert" hidden></div>' +
      '<button class="sw-btn primary block" type="submit">' + esc(tt('signin')) + '</button>' +
      '<button class="sw-link" type="button" data-tab="reset">' + esc(tt('forgot')) + '</button></form>';
  }
  rec.body.innerHTML = head + tabs + form;

  var f = rec.body.querySelector('form');
  var errEl = f.querySelector('.sw-err');
  function showErr(msg) { errEl.textContent = msg; errEl.hidden = !msg; }
  function busy(b) {
    Array.prototype.forEach.call(f.querySelectorAll('button,input'), function (x) { x.disabled = b; });
    f.classList.toggle('busy', b);
  }
  rec.body.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-tab]');
    if (t && !t.classList.contains('on')) renderAuth(rec, t.dataset.tab, opts);
  });
  var show = f.querySelector('[data-showpw]');
  if (show) show.addEventListener('change', function () {
    Array.prototype.forEach.call(f.querySelectorAll('[data-pw]'), function (i) { i.type = show.checked ? 'text' : 'password'; });
  });

  f.addEventListener('submit', async function (e) {
    e.preventDefault();
    showErr('');
    var v = {};
    Array.prototype.forEach.call(f.elements, function (el) { if (el.name) v[el.name] = el.value; });
    v.email = String(v.email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return showErr(tt('err_email'));
    busy(true);
    try {
      var client = await getClient();
      if (mode === 'login') {
        var r = await client.auth.signInWithPassword({ email: v.email, password: v.password || '' });
        if (r.error) throw r.error;
        await handleAuth('SIGNED_IN', r.data.session);
        Modal.closeAll();
        toast(tt('welcome', { name: S.profile ? S.profile.username : v.email }));
        if (opts.then) setTimeout(opts.then, 60);
      } else if (mode === 'register') {
        var uname = String(v.username || '').trim();
        if (!/^[^\s<>"'`&]{3,20}$/.test(uname)) throw new Error(tt('err_username_bad'));
        if (String(v.password || '').length < 8) throw new Error(tt('err_pw_short'));
        var av = await client.rpc('username_available', { p_name: uname });
        if (!av.error && av.data === false) throw new Error(tt('err_username_taken'));
        var s = await client.auth.signUp({
          email: v.email, password: v.password,
          options: { data: { username: uname }, emailRedirectTo: redirectUrl() }
        });
        if (s.error) throw s.error;
        /* Supabase, kayıtlı e-postada hata vermez; identities boş döner. */
        if (s.data && s.data.user && Array.isArray(s.data.user.identities) && s.data.user.identities.length === 0) {
          throw new Error(tt('err_exists'));
        }
        if (s.data && s.data.session) {
          await handleAuth('SIGNED_IN', s.data.session);
          Modal.closeAll();
          toast(tt('welcome', { name: S.profile ? S.profile.username : uname }));
          if (opts.then) setTimeout(opts.then, 60);
        } else {
          rec.body.innerHTML = '<div class="sw-auth-head"><span class="sw-emblem">' + EMBLEM + '</span>' +
            '<h2 class="sw-h">' + esc(tt('signup')) + '</h2><p class="sw-sub">' + esc(tt('confirm_sent')) + '</p></div>' +
            '<div class="sw-actions"><button type="button" class="sw-btn primary" data-close>OK</button></div>';
        }
      } else {
        var rr = await client.auth.resetPasswordForEmail(v.email, { redirectTo: redirectUrl() });
        if (rr.error) throw rr.error;
        errEl.hidden = false; errEl.classList.add('ok'); errEl.textContent = tt('reset_sent');
        busy(false);
        return;
      }
    } catch (err) {
      showErr(mapErr(err));
      busy(false);
    }
  });
}

/* E-postadaki sıfırlama bağlantısından dönünce (PASSWORD_RECOVERY) */
function openNewPassword() {
  Modal.closeAll();
  var rec = Modal.open({
    title: tt('newpw_title'), cls: 'sw-auth',
    html: '<div class="sw-auth-head"><span class="sw-emblem">' + EMBLEM + '</span><h2 class="sw-h">' + esc(tt('newpw_title')) + '</h2></div>' +
      '<form class="sw-form" novalidate>' +
      fieldHTML(tt('newpw_title'), 'p1', 'password', 'autocomplete="new-password" minlength="8" required data-autofocus', tt('pw_hint')) +
      fieldHTML(tt('password'), 'p2', 'password', 'autocomplete="new-password" minlength="8" required') +
      '<div class="sw-err" role="alert" hidden></div>' +
      '<button class="sw-btn primary block" type="submit">' + esc(tt('newpw_btn')) + '</button></form>'
  });
  var f = rec.body.querySelector('form'), errEl = f.querySelector('.sw-err');
  f.addEventListener('submit', async function (e) {
    e.preventDefault();
    errEl.hidden = true;
    var p1 = f.elements.p1.value, p2 = f.elements.p2.value;
    if (p1.length < 8) { errEl.textContent = tt('err_pw_short'); errEl.hidden = false; return; }
    if (p1 !== p2) { errEl.textContent = tt('err_pw_match'); errEl.hidden = false; return; }
    try {
      var r = await S.client.auth.updateUser({ password: p1 });
      if (r.error) throw r.error;
      rec.close();
      toast(tt('pw_updated'));
    } catch (err) { errEl.textContent = mapErr(err); errEl.hidden = false; }
  });
}

async function signOut() {
  try { var c = await getClient(); await c.auth.signOut(); } catch (e) { console.warn(e); }
  await handleAuth('SIGNED_OUT', null);
  toast(tt('signed_out'));
}

/* ── 7. ÜST MENÜ DÜĞMESİ ─────────────────────────────────────── */
var ICON_USER = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

function renderNav() {
  var slot = document.getElementById('sw-auth-slot');
  if (!slot) return;
  var nav = document.getElementById('site-nav');
  if (nav) nav.classList.add('sw-has-auth');
  var wasOpen = !!slot.querySelector('.nav-user.open');
  var html;
  if (S.user) {
    var p = S.profile || { username: String(S.user.email || '?').split('@')[0] };
    var isAdmin = p.role === 'admin';
    html = '<div class="nav-user' + (wasOpen ? ' open' : '') + '">' +
      '<button type="button" class="nav-user-btn" data-act="menu" aria-haspopup="menu" aria-expanded="' + wasOpen + '">' +
        avatarHTML(p, 'sm') + '<span class="nu-name">' + esc(p.username) + '</span></button>' +
      '<div class="nav-user-menu" role="menu">' +
        '<div class="num-head"><strong>' + esc(p.username) + '</strong><small>' +
          esc(isAdmin ? tt('role_admin') : (titleLabel(p.title) || tt('role_member'))) + '</small></div>' +
        '<button type="button" role="menuitem" data-act="profile">' + esc(tt('menu_profile')) + '</button>' +
        (FEAT.suggestions ? '<button type="button" role="menuitem" data-act="suggest">' + esc(tt('menu_suggest')) + '</button>' : '') +
        (isAdmin ? '<a role="menuitem" href="' + esc(BASE_PATH + 'admin.html') + '">' + esc(tt('menu_admin')) + '</a>' : '') +
        '<button type="button" role="menuitem" data-act="logout">' + esc(tt('signout')) + '</button>' +
      '</div></div>';
  } else if (S.restoring && !S.ready) {
    html = '<span class="nav-auth-ph" aria-hidden="true"></span>';
  } else {
    html = '<button type="button" class="nav-auth-btn" data-act="login" aria-label="' + esc(tt('signin')) + '">' +
      ICON_USER + '<span>' + esc(tt('nav_signin')) + '</span></button>';
  }
  slot.innerHTML = html;
}

function bindNav() {
  var slot = document.getElementById('sw-auth-slot');
  if (!slot || slot.dataset.bound) return;
  slot.dataset.bound = '1';
  slot.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-act]');
    if (!b) return;
    var act = b.dataset.act;
    var wrap = slot.querySelector('.nav-user');
    if (act === 'menu') {
      var open = wrap.classList.toggle('open');
      b.setAttribute('aria-expanded', String(open));
      return;
    }
    if (wrap) { wrap.classList.remove('open'); }
    if (act === 'login') openAuth('login');
    else if (act === 'profile') openProfile();
    else if (act === 'suggest') openSuggest();
    else if (act === 'logout') signOut();
  });
  document.addEventListener('click', function (e) {
    var wrap = slot.querySelector('.nav-user.open');
    if (wrap && !wrap.contains(e.target)) {
      wrap.classList.remove('open');
      var btn = wrap.querySelector('.nav-user-btn'); if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var wrap = slot.querySelector('.nav-user.open');
    if (wrap) wrap.classList.remove('open');
  });
}

/* ── 8. SAYFA ETİKETİ / BAĞLANTISI (yorum ve öneri listeleri için) ── */
async function pageLabel(type, id) {
  var out = String(id);
  function pick(arr) { return (arr || []).filter(function (x) { return String(x.id) === String(id); })[0]; }
  try {
    if (type === 'character') { var c = pick((await loadData('characters.json')).characters); if (c) out = Lang.t(c.name); }
    else if (type === 'kingdom') { var k = pick((await loadData('kingdoms.json')).kingdoms); if (k) out = Lang.t(k.name); }
    else if (type === 'chapter') { var ch = pick((await loadData('chapters.json')).chapters); if (ch) out = ch.num + '. ' + Lang.t(ch.title); }
    else if (type === 'house') { await Houses.load(); var h = Houses.get(id); if (h) out = h.name; }
    else if (type === 'god') { var g = pick((await loadData('lore.json')).gods); if (g) out = ((Lang.t(g.epithet) || '') + ' ' + (g.trueName || '')).trim(); }
  } catch (e) { /* etiket bulunamazsa id gösterilir */ }
  return out;
}
function pageUrl(type, id) {
  /* Kalıcı adresler (Sürüm 2,7): assets/js/router.js — ör. karakter-sablon.html#/karakter/zeandor */
  var R = W.SWRoute || window.SWRoute;
  var t = { character: 'karakter', kingdom: 'devlet', chapter: 'bolum', house: 'hane', god: 'tanri' }[type];
  return BASE_PATH + (R && t ? R.href(t, id) : 'index.html');
}
function typeLabel(type) { return tt('tl_' + type); }

/* Hangi sayfa türü hangi JSON dosyasına / dizisine karşılık gelir?
   (öneri modalı ve yorum başlığındaki "öneri sun" düğmesi kullanır) */
var TARGETS = {
  character: { file: 'characters.json', path: 'characters' },
  kingdom:   { file: 'kingdoms.json',   path: 'kingdoms' },
  chapter:   { file: 'chapters.json',   path: 'chapters' },
  house:     { file: 'houses.json',     path: 'provinces.*.houses' },
  god:       { file: 'lore.json',       path: 'gods' }
};
function ctxFor(type, id, label) {
  var t = TARGETS[type];
  return t ? { type: type, file: t.file, path: t.path, id: String(id), label: label || '' } : null;
}

/* ── 9. PROFİL MODALI ────────────────────────────────────────── */
function excerpt(body) {
  var t = String(body || '').replace(/\[spoiler\][\s\S]*?\[\/spoiler\]/gi, '[▮▮▮]').replace(/\s+/g, ' ').trim();
  return t.length > 150 ? t.slice(0, 149) + '…' : t;
}

async function openProfile(uid, tab) {
  var self = !uid || (S.user && uid === S.user.id);
  if (S.restoring && !S.ready) { try { await getClient(); } catch (e) {} }
  if (self) { if (!S.user) return openAuth('login'); uid = S.user.id; }
  Modal.closeAll();
  var rec = Modal.open({ title: tt('profile'), cls: 'sw-profile', html: '<div class="sw-loading">' + esc(tt('loading')) + '</div>' });
  try {
    var client = await getClient();
    await Houses.load();
    var prof = self && S.profile ? S.profile : null;
    if (!prof) {
      var pr = await client.from('profiles').select('id,username,avatar,favorite_house,title,role,is_banned,created_at').eq('id', uid).maybeSingle();
      if (pr.error) throw pr.error;
      prof = pr.data;
    }
    if (!prof) throw new Error(tt('p_notfound'));

    var jobs = [client.from('comments')
      .select('id,page_type,page_id,body,seal_count,created_at', { count: 'exact' })
      .eq('user_id', uid).eq('is_deleted', false)
      .order('created_at', { ascending: false }).limit(40)];
    if (self) jobs.push(client.from('pending_suggestions')
      .select('id,kind,title,status,admin_note,created_at,page_url')
      .eq('user_id', uid).order('created_at', { ascending: false }).limit(40));
    var res = await Promise.all(jobs);
    if (res[0].error) throw res[0].error;
    var comments = res[0].data || [];
    var total = res[0].count == null ? comments.length : res[0].count;
    var suggs = self && res[1] ? (res[1].data || []) : [];
    var labels = await Promise.all(comments.map(function (c) { return pageLabel(c.page_type, c.page_id); }));
    if (rec.closed) return;
    renderProfile(rec, { prof: prof, self: self, comments: comments, total: total, labels: labels, suggs: suggs, tab: tab || 'comments' });
  } catch (err) {
    if (!rec.closed) rec.body.innerHTML = '<div class="sw-err">' + esc(mapErr(err) || tt('p_load_fail')) + '</div>';
  }
}

function renderProfile(rec, c) {
  var p = c.prof, isAdmin = p.role === 'admin', h = Houses.get(p.favorite_house);
  var tab = c.tab;
  if (!c.self && tab !== 'comments') tab = 'comments';

  var head =
    '<div class="sw-pf-head">' +
      '<div class="sw-pf-av">' + avatarHTML(p, 'xl') + '</div>' +
      '<div class="sw-pf-id">' +
        '<h2 class="sw-h">' + esc(p.username) + '</h2>' +
        '<div class="sw-pf-role"><span class="sw-badge' + (isAdmin ? ' admin' : '') + '">' + esc(roleLabel(p.role)) + '</span>' +
          (p.title ? '<em>' + esc(titleLabel(p.title)) + '</em>' : '') + '</div>' +
        '<div class="sw-pf-meta">' + esc(tt('joined', { date: fmtDate(p.created_at) })) + '</div>' +
        '<div class="sw-pf-stats"><span><b>' + c.total + '</b> ' + esc(tt('stat_comments')) + '</span>' +
          (c.self ? '<span><b>' + c.suggs.length + '</b> ' + esc(tt('stat_sugg')) + '</span>' : '') + '</div>' +
      '</div>' +
      (h ? '<div class="sw-pf-crest">' + crestBig(h.id) + '<small>' + esc(h.name) + '</small></div>' : '') +
    '</div>' +
    (c.self && p.is_banned ? '<div class="sw-err">' + esc(tt('banned_note')) + '</div>' : '');

  var tabs = '<div class="sw-tabs" role="tablist">' +
    '<button type="button" role="tab" data-ptab="comments" class="' + (tab === 'comments' ? 'on' : '') + '">' + esc(tt('p_comments')) + '</button>' +
    (c.self ? '<button type="button" role="tab" data-ptab="suggestions" class="' + (tab === 'suggestions' ? 'on' : '') + '">' + esc(tt('p_suggestions')) + '</button>' +
              '<button type="button" role="tab" data-ptab="settings" class="' + (tab === 'settings' ? 'on' : '') + '">' + esc(tt('p_settings')) + '</button>' : '') +
    '</div>';

  var panel;
  if (tab === 'comments') {
    panel = c.comments.length
      ? '<ul class="sw-pf-list">' + c.comments.map(function (m, i) {
          return '<li class="sw-pf-c"><a href="' + esc(pageUrl(m.page_type, m.page_id)) + '">' +
            esc(typeLabel(m.page_type)) + ' · ' + esc(c.labels[i]) + '</a>' +
            '<p>' + esc(excerpt(m.body)) + '</p>' +
            '<small>' + esc(timeAgo(m.created_at)) + (m.seal_count ? ' · ' + m.seal_count + ' ' + esc(tt('seals')) : '') + '</small></li>';
        }).join('') + '</ul>'
      : '<p class="sw-empty">' + esc(tt('p_none_comments')) + '</p>';
  } else if (tab === 'suggestions') {
    panel = c.suggs.length
      ? '<ul class="sw-pf-list">' + c.suggs.map(function (s) {
          return '<li class="sw-pf-s"><div class="sw-pf-s-top"><span class="sw-kind">' + esc(tt('kind_' + s.kind)) + '</span>' +
            '<span class="sw-st ' + esc(s.status) + '">' + esc(tt('st_' + s.status)) + '</span></div>' +
            '<strong>' + esc(s.title) + '</strong>' +
            (s.admin_note ? '<p class="sw-note">' + esc(tt('admin_note')) + ': ' + esc(s.admin_note) + '</p>' : '') +
            '<small>' + esc(timeAgo(s.created_at)) + '</small>' +
            (s.status === 'pending' ? ' <button type="button" class="sw-link" data-withdraw="' + esc(s.id) + '">' + esc(tt('withdraw')) + '</button>' : '') +
            '</li>';
        }).join('') + '</ul>'
      : '<p class="sw-empty">' + esc(tt('p_none_sugg')) + '</p>';
  } else {
    var groups = {};
    Houses.all().forEach(function (hh) { var g = Lang.t(hh.province) || '—'; (groups[g] = groups[g] || []).push(hh); });
    var houseOpts = '<option value="">' + esc(tt('p_no_house')) + '</option>' + Object.keys(groups).map(function (g) {
      return '<optgroup label="' + esc(g) + '">' + groups[g].map(function (hh) {
        return '<option value="' + esc(hh.id) + '"' + (hh.id === p.favorite_house ? ' selected' : '') + '>' + esc(hh.name) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    var titleOpts = '<option value="">—</option>' + TITLES.map(function (t) {
      return '<option value="' + esc(t[0]) + '"' + (t[0] === p.title ? ' selected' : '') + '>' + esc(Lang.get() === 'en' ? t[1] : t[0]) + '</option>';
    }).join('');
    var avs = AVATARS.map(function (a) {
      return '<label class="sw-av-opt"><input type="radio" name="avatar" value="' + a + '"' + ((p.avatar || 'initial') === a ? ' checked' : '') + '>' +
        avatarHTML({ avatar: a, username: p.username, favorite_house: p.favorite_house }, 'md') + '</label>';
    }).join('');
    panel = '<form class="sw-form sw-pf-settings" novalidate>' +
      '<div class="sw-l"><span>' + esc(tt('p_avatar')) + '</span><div class="sw-av-grid">' + avs + '</div></div>' +
      '<label class="sw-l"><span>' + esc(tt('p_house')) + '</span><select class="sw-in" name="house">' + houseOpts + '</select></label>' +
      '<label class="sw-l"><span>' + esc(tt('p_title')) + '</span><select class="sw-in" name="title">' + titleOpts + '</select></label>' +
      '<div class="sw-err" role="alert" hidden></div>' +
      '<button class="sw-btn primary" type="submit">' + esc(tt('save')) + '</button></form>';
  }

  rec.body.innerHTML = head + tabs + '<div class="sw-pf-panel">' + panel + '</div>';

  rec.body.querySelector('.sw-tabs').addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-ptab]');
    if (!b || b.classList.contains('on')) return;
    c.tab = b.dataset.ptab;
    renderProfile(rec, c);
  });

  var wd = rec.body.querySelector('.sw-pf-panel');
  wd.addEventListener('click', async function (e) {
    var b = e.target.closest && e.target.closest('[data-withdraw]');
    if (!b) return;
    if (!(await confirmBox(tt('withdraw_q'), tt('yes_withdraw'), true))) return;
    try {
      var r = await S.client.from('pending_suggestions').delete().eq('id', b.dataset.withdraw);
      if (r.error) throw r.error;
      toast(tt('withdrawn'));
      openProfile(null, 'suggestions');
    } catch (err) { toast(mapErr(err), true); }
  });

  var form = rec.body.querySelector('.sw-pf-settings');
  if (form) {
    form.elements.house.addEventListener('change', function () {
      var col = houseColors(form.elements.house.value);
      Array.prototype.forEach.call(form.querySelectorAll('.sw-av'), function (el) {
        el.style.setProperty('--av1', col[0]); el.style.setProperty('--av2', col[1]);
      });
    });
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var errEl = form.querySelector('.sw-err'); errEl.hidden = true;
      var checked = form.querySelector('input[name=avatar]:checked');
      var upd = { avatar: checked ? checked.value : 'initial', favorite_house: form.elements.house.value || null, title: form.elements.title.value || null };
      try {
        var r = await S.client.from('profiles').update(upd).eq('id', S.user.id)
          .select('id,username,avatar,favorite_house,title,role,is_banned,created_at').single();
        if (r.error) throw r.error;
        S.profile = r.data;
        renderNav(); emit('PROFILE_UPDATED');
        toast(tt('p_saved'));
        c.prof = r.data;
        renderProfile(rec, c);
      } catch (err) { errEl.textContent = mapErr(err); errEl.hidden = false; }
    });
  }
}

/* ── 10. "ÖNERİ SUN" YÜZEN DÜĞMESİ ───────────────────────────── */
var QUILL = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS.quill + '</svg>';
function renderFab() {
  var b = document.getElementById('sw-fab');
  if (!b) return;
  b.innerHTML = QUILL + '<span>' + esc(tt('fab_label')) + '</span>';
  b.setAttribute('aria-label', tt('fab_label'));
}
function injectFab() {
  if (document.getElementById('sw-fab')) return;
  var b = document.createElement('button');
  b.type = 'button'; b.id = 'sw-fab'; b.className = 'sw-fab';
  b.addEventListener('click', function () { openSuggest(); });
  document.body.appendChild(b);
  renderFab();
}

/* ── 11. TEMBEL MODÜL YÜKLEME ────────────────────────────────── */
var moduleLoading = {};
function loadModule(name) {
  if (API.modules[name]) return Promise.resolve(API.modules[name]);
  if (!moduleLoading[name]) {
    var v = CFG.assetVersion ? '?v=' + encodeURIComponent(CFG.assetVersion) : '';
    moduleLoading[name] = loadScript(BASE_PATH + 'assets/js/community-' + name + '.js' + v).then(function () {
      if (!API.modules[name]) throw new Error('Modül yüklenemedi: ' + name);
      return API.modules[name];
    }).catch(function (e) { delete moduleLoading[name]; throw e; });
  }
  return moduleLoading[name];
}

var ctxOverride = null;

function mountComments(target, opts) {
  if (!FEAT.comments) return;
  var el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) return;
  loadModule('divan')
    .then(function (m) { m.mount(el, opts || {}); })
    .catch(function (e) { console.warn('[Topluluk] yorumlar yüklenemedi:', e.message); });
}
function unmountComments(target) {
  var el = typeof target === 'string' ? document.getElementById(target) : target;
  if (el) { el.innerHTML = ''; el._dv = null; }
}

async function openSuggest(ctx) {
  if (!FEAT.suggestions) return;
  if (S.restoring && !S.ready) { try { await getClient(); } catch (e) {} }
  if (!S.user) {
    return openAuth('login', { reason: tt('suggest_login'), then: function () { openSuggest(ctx); } });
  }
  try {
    var m = await loadModule('suggest');
    m.open(ctx || ctxOverride || null);
  } catch (e) { toast(mapErr(e), true); }
}
addStrings({
  tr: { suggest_login: 'Öneri sunmak için önce giriş yapmalısın.' },
  en: { suggest_login: 'Sign in first to submit a suggestion.' }
});

/* ── 12. AÇILIŞ ──────────────────────────────────────────────── */
function injectCSS() {
  if (document.getElementById('sw-community-css')) return;
  var l = document.createElement('link');
  l.id = 'sw-community-css'; l.rel = 'stylesheet';
  l.href = BASE_PATH + 'assets/css/community.css' + (CFG.assetVersion ? '?v=' + encodeURIComponent(CFG.assetVersion) : '');
  document.head.appendChild(l);
}

function init() {
  if (S.inited) return;
  S.inited = true;
  injectCSS();
  renderNav();
  bindNav();
  /* Yüzen "Öneri Sun" düğmesi: 404, yönetim paneli ve tam ekran okuyucuda (oku.html) gösterilmez;
     okuyucuda öneri düğmesi yorum alanının başlığında bulunur. */
  var page = location.pathname.split('/').pop() || '';
  var NO_FAB = ['404.html', 'admin.html', 'oku.html'];
  if (FEAT.suggestions && NO_FAB.indexOf(page) < 0) injectFab();
  document.addEventListener('langchange', function () { renderNav(); renderFab(); });
  if (S.restoring) getClient().catch(function (e) { console.warn('[Topluluk]', e.message); });
}

/* ── DIŞA AÇILAN API ─────────────────────────────────────────── */
Object.assign(API, {
  init: init,
  getClient: getClient,
  getState: getState,
  onAuth: onAuth,
  openAuth: openAuth,
  openProfile: openProfile,
  openSuggest: openSuggest,
  requireLogin: requireLogin,
  mountComments: mountComments,
  unmountComments: unmountComments,
  setContext: function (ctx) { ctxOverride = ctx || null; },
  getContext: function () { return ctxOverride; },
  addStrings: addStrings,
  ensureCSS: injectCSS,
  loadModule: loadModule,
  util: {
    esc: esc, tt: tt, mapErr: mapErr, avatarHTML: avatarHTML, crestMini: crestMini, crestBig: crestBig,
    houseColors: houseColors, titleLabel: titleLabel, roleLabel: roleLabel, fmtDate: fmtDate, timeAgo: timeAgo,
    slugify: slugify, toast: toast, confirmBox: confirmBox, Modal: Modal, Houses: Houses,
    pageLabel: pageLabel, pageUrl: pageUrl, typeLabel: typeLabel, TARGETS: TARGETS, ctxFor: ctxFor, TITLES: TITLES, AVATARS: AVATARS, ICONS: ICONS, sleep: sleep,
    locale: locale
  }
});

})();
