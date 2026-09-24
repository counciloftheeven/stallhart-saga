/* ═══════════════════════════════════════════════════════════════
   STALLHART WIKI — KURULTAY (Forum) ortak modülü
   ---------------------------------------------------------------
   forum.html, forum-kategori.html ve forum-konu.html tarafından
   ortak kullanılır. Kategori/konu verisini Supabase'ten çeker;
   assets/js/config.js boşsa veya supabase/forum-schema.sql henüz
   çalıştırılmadıysa (tablo yoksa) sessizce yerel örnek veriye
   düşer — sayfa hiçbir zaman kırılmaz, yalnızca "taslak" veri
   gösterir.

   Önkoşul: wiki.js ve community.js bu dosyadan ÖNCE yüklenmeli.
   Dışa açılan API: window.Kurultay
   ═══════════════════════════════════════════════════════════════ */
(function () {
'use strict';
var W = window.Wiki, C = W && W.Community, esc = W.esc;

/* ── İKONLAR (kategori rozetleri) ─────────────────────────────── */
var ICONS = {
  duyuru:  '<path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a2 2 0 0 1-3.6-1.2"/>',
  sohbet:  '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  teori:   '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  hane:    '<path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/>',
  evren:   '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
  sanat:   '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10.5" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="15.5" cy="14.5" r="1"/><path d="M12 21a9 9 0 0 1 0-18 4 4 0 0 1 0 8h-.5a2 2 0 0 0 0 4H12a9 9 0 0 1 0 6z"/>',
  oneri:   '<path d="M9 18h6M10 22h4M12 2a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.5h6c0-1.1.4-1.9 1-2.5A6 6 0 0 0 12 2z"/>',
  yardim:  '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 1 1 4.9 2.3c-.8.7-1.5 1.2-1.5 2.7M12 17h.01"/>'
};

/* ── YEDEK VERİ (şema henüz kurulmadıysa) ─────────────────────── */
var FALLBACK_CATS = [
  { id: 'duyuru', icon: 'duyuru', name_tr: 'Duyurular', name_en: 'Announcements', desc_tr: 'Yazardan haberler, yayın takvimi ve site güncellemeleri.', desc_en: 'News from the author, release schedule and site updates.', is_locked: true, thread_count: 14, sort_order: 0 },
  { id: 'sohbet', icon: 'sohbet', name_tr: 'Genel Sohbet', name_en: 'General Chat', desc_tr: 'Bölümler dışında, Stallhart üzerine serbest kürsü.', desc_en: 'Open floor for anything Stallhart, outside the chapters.', is_locked: false, thread_count: 231, sort_order: 1 },
  { id: 'teori', icon: 'teori', name_tr: 'Teoriler & Analizler', name_en: 'Theories & Analysis', desc_tr: 'Kehanetler, ipuçları ve "asıl kim bu?" tartışmaları.', desc_en: 'Prophecies, foreshadowing and "who is this really?" threads.', is_locked: false, thread_count: 168, sort_order: 2 },
  { id: 'hane', icon: 'hane', name_tr: 'Hane & Karakter Tartışmaları', name_en: 'House & Character Talk', desc_tr: 'Belirli haneler, karakterler ve aralarındaki ilişkiler.', desc_en: 'Specific houses, characters and the ties between them.', is_locked: false, thread_count: 97, sort_order: 3 },
  { id: 'evren', icon: 'evren', name_tr: 'Evren & Dünya İnşası', name_en: 'Lore & Worldbuilding', desc_tr: 'Coğrafya, tanrılar, dil ve tarih üzerine derin dalışlar.', desc_en: 'Deep dives into geography, gods, language and history.', is_locked: false, thread_count: 74, sort_order: 4 },
  { id: 'sanat', icon: 'sanat', name_tr: 'Fan Sanatı & Yaratıcı Köşe', name_en: 'Fan Art & Creations', desc_tr: 'Çizimler, haritalar, fanfiction ve diğer üretimler.', desc_en: 'Art, maps, fanfiction and other creations.', is_locked: false, thread_count: 52, sort_order: 5 },
  { id: 'oneri', icon: 'oneri', name_tr: 'Öneri & Geri Bildirim', name_en: 'Suggestions & Feedback', desc_tr: 'Site ve okuma deneyimiyle ilgili öneriler.', desc_en: 'Suggestions about the site and reading experience.', is_locked: false, thread_count: 41, sort_order: 6 },
  { id: 'yardim', icon: 'yardim', name_tr: 'Yardım & SSS', name_en: 'Help & FAQ', desc_tr: 'Hesap, bildirim ve site kullanımıyla ilgili sorular.', desc_en: 'Questions about accounts, notifications and site use.', is_locked: false, thread_count: 29, sort_order: 7 }
];
var FALLBACK_THREADS = [
  { id: 'f1', category_id: 'duyuru', title: 'Kurultay Yönergesi — okumadan yazma', title_en: 'Kurultay Guidelines — read before you post', body: 'Kurultay\'a hoş geldin. Yazmadan önce lütfen bu birkaç kuralı oku…', body_en: 'Welcome to the Kurultay. Please read these few rules before posting…', is_pinned: true, is_locked: true, view_count: 3400, reply_count: 12, last_activity_at: daysAgo(3), created_at: daysAgo(3), profiles: { username: 'craesx', avatar: 'initial' } },
  { id: 'f2', category_id: 'duyuru', title: 'Cilt II yayın takvimi güncellendi', title_en: 'Volume II release schedule updated', body: 'Cilt II için yeni takvim aşağıda…', body_en: 'The new schedule for Volume II is below…', is_pinned: true, is_locked: false, view_count: 9100, reply_count: 58, last_activity_at: daysAgo(1), created_at: daysAgo(1), profiles: { username: 'craesx', avatar: 'initial' } },
  { id: 'f3', category_id: 'teori', title: 'Son İmparator gerçekten öldü mü, yoksa…', title_en: 'Did the Last Emperor really die, or…', body: 'Bölüm 20\'deki o sahneden beri aklımdan çıkmıyor…', body_en: "I haven't been able to stop thinking about that scene since Chapter 20…", is_pinned: false, is_locked: false, view_count: 2100, reply_count: 84, last_activity_at: minsAgo(12), created_at: minsAgo(200), profiles: { username: 'Solmaz', avatar: 'initial' } },
  { id: 'f4', category_id: 'hane', title: 'Hane Selya\'nın deniz filosu hakkında ne biliyoruz?', title_en: "What do we know about House Selya's navy?", body: 'Haritada işaretli limanlardan yola çıkarak…', body_en: 'Working from the ports marked on the map…', is_pinned: false, is_locked: false, view_count: 640, reply_count: 19, last_activity_at: minsAgo(47), created_at: minsAgo(500), profiles: { username: 'kagankartal', avatar: 'initial' } },
  { id: 'f5', category_id: 'sohbet', title: 'Bölüm 14 sonrası — o sahneyi konuşalım', title_en: "After Chapter 14 — let's talk about that scene", body: 'Kimse bahsetmiyor ama ben hâlâ şok içindeyim…', body_en: "No one's talking about it but I'm still in shock…", is_pinned: false, is_locked: false, view_count: 5200, reply_count: 133, last_activity_at: hoursAgo(1), created_at: hoursAgo(6), profiles: { username: 'parşömenkurdu', avatar: 'initial' } },
  { id: 'f6', category_id: 'evren', title: 'Denge Konseyi\'nin tarafsızlığı ne kadar gerçek?', title_en: "How real is the Council of Balance's neutrality?", body: 'Konseyin geçmiş kararlarına bakınca…', body_en: "Looking at the Council's past decisions…", is_pinned: false, is_locked: false, view_count: 810, reply_count: 27, last_activity_at: hoursAgo(2), created_at: hoursAgo(10), profiles: { username: 'nihalorman', avatar: 'initial' } },
  { id: 'f7', category_id: 'sanat', title: 'Arhan hattı için soy ağacı taslağım', title_en: 'My family tree draft for the Arhan line', body: 'Birkaç haftadır üzerinde çalışıyorum, geri bildirim isterim.', body_en: "I've been working on it for a few weeks, would love feedback.", is_pinned: false, is_locked: false, view_count: 300, reply_count: 9, last_activity_at: hoursAgo(5), created_at: hoursAgo(20), profiles: { username: 'cizerAyla', avatar: 'initial' } },
  { id: 'f8', category_id: 'yardim', title: 'Karanlık modda dipnot okunmuyor, bug mu?', title_en: "Footnotes don't show in dark mode, is this a bug?", body: 'Ayarlar > Tema > Koyu seçince dipnotlar görünmüyor.', body_en: 'When I pick Settings > Theme > Dark, the footnotes disappear.', is_pinned: false, is_locked: false, view_count: 88, reply_count: 4, last_activity_at: hoursAgo(9), created_at: hoursAgo(30), profiles: { username: 'teknikTuran', avatar: 'initial' } }
];
function daysAgo(n) { return new Date(Date.now() - n * 86400000).toISOString(); }
function hoursAgo(n) { return new Date(Date.now() - n * 3600000).toISOString(); }
function minsAgo(n) { return new Date(Date.now() - n * 60000).toISOString(); }

var catCache = null;

/* ── VERİ ERİŞİMİ ──────────────────────────────────────────────── */
async function fetchCategories() {
  if (catCache) return catCache;
  if (!C || !C.enabled) return (catCache = FALLBACK_CATS);
  try {
    var client = await C.getClient();
    var res = await client.from('forum_categories').select('*').order('sort_order');
    if (res.error || !res.data || !res.data.length) return (catCache = FALLBACK_CATS);
    return (catCache = res.data);
  } catch (e) { return (catCache = FALLBACK_CATS); }
}

async function fetchThreads(opts) {
  opts = opts || {};
  if (!C || !C.enabled) return filterFallback(opts);
  try {
    var client = await C.getClient();
    var q = client.from('forum_threads').select('*, profiles(username,avatar,favorite_house)', { count: 'exact' }).eq('is_deleted', false);
    if (opts.categoryId) q = q.eq('category_id', opts.categoryId);
    if (opts.pinnedOnly) q = q.eq('is_pinned', true);
    if (opts.search) q = q.ilike('title', '%' + opts.search.replace(/[%_]/g, '') + '%');
    var sortCol = opts.sort === 'cevap' ? 'reply_count' : opts.sort === 'goruntulenme' ? 'view_count' : 'last_activity_at';
    q = q.order('is_pinned', { ascending: false }).order(sortCol, { ascending: false });
    var from = (opts.page || 0) * (opts.pageSize || 20);
    q = q.range(from, from + (opts.pageSize || 20) - 1);
    var res = await q;
    if (res.error) throw res.error;
    return { rows: res.data || [], count: res.count };
  } catch (e) { return filterFallback(opts); }
}

function filterFallback(opts) {
  var rows = FALLBACK_THREADS.slice();
  if (opts.categoryId) rows = rows.filter(function (t) { return t.category_id === opts.categoryId; });
  if (opts.pinnedOnly) rows = rows.filter(function (t) { return t.is_pinned; });
  if (opts.search) { var q = opts.search.toLowerCase(); rows = rows.filter(function (t) { return t.title.toLowerCase().indexOf(q) >= 0 || (t.title_en || '').toLowerCase().indexOf(q) >= 0; }); }
  var key = opts.sort === 'cevap' ? 'reply_count' : opts.sort === 'goruntulenme' ? 'view_count' : 'last_activity_at';
  rows.sort(function (a, b) { if (a.is_pinned !== b.is_pinned) return b.is_pinned - a.is_pinned; return (a[key] < b[key]) ? 1 : -1; });
  return { rows: rows, count: rows.length };
}

async function fetchThread(id) {
  if (!C || !C.enabled) { var f = FALLBACK_THREADS.filter(function (t) { return t.id === id; })[0]; return f || null; }
  try {
    var client = await C.getClient();
    var res = await client.from('forum_threads').select('*, profiles(username,avatar,favorite_house)').eq('id', id).maybeSingle();
    if (res.error) throw res.error;
    return res.data;
  } catch (e) { return null; }
}

async function createThread(categoryId, title, body) {
  var client = await C.getClient();
  var st = C.getState();
  var res = await client.from('forum_threads')
    .insert({ category_id: categoryId, user_id: st.user.id, title: title, body: body })
    .select().single();
  if (res.error) throw res.error;
  return res.data;
}

async function setFlag(id, field, value) {
  var client = await C.getClient();
  var fn = field === 'pin' ? 'kurultay_set_pin' : 'kurultay_set_lock';
  var arg = field === 'pin' ? { p_id: id, p_pinned: value } : { p_id: id, p_locked: value };
  var res = await client.rpc(fn, arg);
  if (res.error) throw res.error;
}

async function deleteThread(id, purge) {
  var client = await C.getClient();
  var res = await client.rpc('kurultay_delete_thread', { p_id: id, p_purge: !!purge });
  if (res.error) throw res.error;
  return res.data;
}

function bumpView(id) {
  if (!C || !C.enabled) return;
  C.getClient().then(function (client) { client.rpc('kurultay_bump_view', { p_id: id }); }).catch(function () {});
}

async function fetchStats() {
  if (!C || !C.enabled) return { threads: FALLBACK_THREADS.length, posts: FALLBACK_THREADS.reduce(function (s, t) { return s + (t.reply_count || 0); }, 0) };
  try {
    var client = await C.getClient();
    var res = await client.rpc('kurultay_stats').maybeSingle();
    if (res.error || !res.data) throw res.error || new Error('no data');
    return { threads: Number(res.data.threads) || 0, posts: Number(res.data.posts) || 0 };
  } catch (e) { return { threads: 0, posts: 0 }; }
}

/* ── OKUNDU/OKUNMADI (yerel, tarayıcı bazlı) ──────────────────────
   Gerçek çoklu-cihaz bildirimi için sunucuda thread_id + user_id
   bazlı "son görülme" tablosu gerekir; bu, tek cihazda çalışan
   hafif bir yaklaşım. */
var READ_KEY = 'kurultay-read-v1';
function readMap() { try { return JSON.parse(localStorage.getItem(READ_KEY) || '{}'); } catch (e) { return {}; } }
function isUnread(thread) {
  var seen = readMap()[thread.id];
  if (!seen) return true;
  return new Date(thread.last_activity_at).getTime() > seen;
}
function markRead(threadId) {
  try {
    var m = readMap(); m[threadId] = Date.now();
    var keys = Object.keys(m);
    if (keys.length > 400) { keys.sort(function (a, b) { return m[a] - m[b]; }).slice(0, keys.length - 400).forEach(function (k) { delete m[k]; }); }
    localStorage.setItem(READ_KEY, JSON.stringify(m));
  } catch (e) {}
}
function updateNavBadge(rows) {
  var has = (rows || []).some(isUnread);
  try { localStorage.setItem('kurultay-unread', has ? '1' : ''); } catch (e) {}
  var dot = document.querySelector('.nav-links a[data-page="forum.html"] .kurultay-dot');
  var link = document.querySelector('.nav-links a[data-page="forum.html"]');
  if (link && !dot && has) link.insertAdjacentHTML('beforeend', '<i class="kurultay-dot" aria-hidden="true"></i>');
  if (dot && !has) dot.remove();
}

/* ── BİÇİMLEME ─────────────────────────────────────────────────── */
function catLabel(cat, l) { return cat ? (l === 'tr' ? cat.name_tr : cat.name_en) : ''; }
function catById(id) { return (catCache || FALLBACK_CATS).filter(function (c) { return c.id === id; })[0]; }

function threadRowHTML(t, l, opts) {
  opts = opts || {};
  var cat = catById(t.category_id);
  var prof = t.profiles || { username: '?', avatar: 'initial' };
  var unread = isUnread(t);
  var timeAgo = C ? C.util.timeAgo(t.last_activity_at) : '';
  return '<a class="ft-row' + (unread ? ' ft-unread' : '') + '" href="forum-konu.html?id=' + esc(t.id) + '">' +
    (C ? C.util.avatarHTML(prof, 'sm') : '') +
    '<span class="ft-main">' +
      '<span class="ft-title">' +
        (unread ? '<i class="ft-dot" title="' + (l === 'tr' ? 'Okunmadı' : 'Unread') + '"></i>' : '') +
        (t.is_pinned ? '<svg class="ft-pin-i" viewBox="0 0 24 24"><path d="M12 2l1.5 5.5L19 9l-4.5 3L16 18l-4-3-4 3 1.5-6L5 9l5.5-1.5z"/></svg>' : '') +
        (t.is_locked ? '<svg class="ft-lock-i" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>' : '') +
        esc(l === 'tr' ? t.title : (t.title_en || t.title)) +
        (opts.showCat !== false && cat ? '<span class="ft-tag' + (t.category_id === 'duyuru' ? ' duyuru' : '') + '">' + esc(catLabel(cat, l)) + '</span>' : '') +
      '</span>' +
      '<span class="ft-sub">' + (l === 'tr' ? 'Açan' : 'by') + ' <b>' + esc(prof.username) + '</b></span>' +
    '</span>' +
    '<span class="ft-stats">' + (t.reply_count || 0) + '<small>' + (l === 'tr' ? 'cevap' : 'replies') + '</small></span>' +
    '<span class="ft-stats">' + (t.view_count || 0) + '<small>' + (l === 'tr' ? 'görünt.' : 'views') + '</small></span>' +
    '<span class="ft-last">' + (l === 'tr' ? 'Güncellendi' : 'Updated') + '<br>' + timeAgo + '</span>' +
  '</a>';
}

function categoryCardHTML(c, l) {
  return '<a class="fc" href="forum-kategori.html?kat=' + esc(c.id) + '">' +
    (c.is_locked ? '<span class="fc-lock"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span>' : '') +
    '<span class="fc-ic"><svg viewBox="0 0 24 24">' + (ICONS[c.icon] || ICONS.sohbet) + '</svg></span>' +
    '<span class="fc-body">' +
      '<span class="fc-name">' + esc(catLabel(c, l)) + '</span>' +
      '<span class="fc-desc">' + esc(l === 'tr' ? c.desc_tr : c.desc_en) + '</span>' +
    '</span>' +
  '</a>';
}

window.Kurultay = {
  ICONS: ICONS,
  fetchCategories: fetchCategories,
  fetchThreads: fetchThreads,
  fetchThread: fetchThread,
  createThread: createThread,
  setFlag: setFlag,
  deleteThread: deleteThread,
  bumpView: bumpView,
  fetchStats: fetchStats,
  isUnread: isUnread,
  markRead: markRead,
  updateNavBadge: updateNavBadge,
  catLabel: catLabel,
  catById: catById,
  threadRowHTML: threadRowHTML,
  categoryCardHTML: categoryCardHTML
};

})();
