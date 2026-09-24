/* ═══════════════════════════════════════════════════════════════
   STALLHART WIKI — Divan Tartışması (yorumlar)   community-divan.js
   ---------------------------------------------------------------
   Kullanım (sayfada):
     <div id="divan-mount"></div>
     Wiki.Community.mountComments('divan-mount', { type: 'character', id: 'zeandor', title: '…' });

   type: character | kingdom | chapter | house | god | lore
   Aynı (type,id) ile tekrar çağırmak yeniden yüklemez, yalnızca çizer
   (dil değişiminde işe yarar); farklı id → yeni tartışma yüklenir.

   Özellikler: eskitilmiş parşömen görünümü · thread (3 seviye, sonrası
   düzleşir) · [spoiler]…[/spoiler] · mühür (beğeni) · sıralama ·
   sayfalama · kendi yorumunu sil / yönetici moderasyonu.
   Tüm metinler esc() ile kaçırılır; HTML yorumlarda çalışmaz.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

(function () {

var C = window.Wiki && window.Wiki.Community;
if (!C || !C.enabled) return;
var U = C.util, esc = U.esc, tt = U.tt;

var PAGE_SIZE = 10, MAX_DEPTH = 3, MAX_LEN = 2000;
var counter = 0;

C.addStrings({
  tr: {
    dv_title: 'Divan Tartışması', dv_count_1: '1 yorum', dv_count_n: '{n} yorum',
    dv_sort: 'Sırala', dv_sort_new: 'En yeni', dv_sort_old: 'En eski', dv_sort_top: 'En çok mühürlenen',
    dv_placeholder: 'Divana söz söyle…', dv_reply_ph: 'Yanıtını yaz…',
    dv_send: 'Mühürle ve gönder', dv_reply_send: 'Yanıtla',
    dv_spoiler_btn: 'Spoiler', dv_spoiler_tip: 'Seçili metni spoiler etiketiyle sar',
    dv_spoiler_note: 'Hikâyeyi açığa çıkaran kısımları [spoiler]…[/spoiler] içine al.',
    dv_spoiler_show: 'Spoiler — göstermek için tıkla',
    dv_login_cta: 'Divana söz söylemek için giriş yap.', dv_login_btn: 'Giriş yap / Kayıt ol',
    dv_empty: 'Henüz kimse söz almadı. İlk yorumu sen yaz.',
    dv_more: 'Daha fazla yorum göster ({n})',
    dv_reply: 'Yanıtla', dv_delete: 'Sil', dv_purge: 'Konuyu kalıcı sil',
    dv_deleted: '[Bu yorum silindi]',
    dv_seal: 'Mühür bas', dv_unseal: 'Mührü geri al',
    dv_delete_q: 'Bu yorum silinsin mi?',
    dv_purge_q: 'Bu yorum ve altındaki TÜM yanıtlar kalıcı olarak silinsin mi?',
    dv_yes_delete: 'Evet, sil', dv_deleted_ok: 'Yorum silindi.', dv_posted: 'Yorumun mühürlendi.',
    dv_empty_body: 'Yorum boş olamaz.', dv_too_long: 'Yorum en fazla 2000 karakter olabilir.',
    dv_load_fail: 'Yorumlar yüklenemedi.', dv_retry: 'Tekrar dene',
    dv_suggest: 'Bu sayfa için öneri sun'
  },
  en: {
    dv_title: 'Council Debate', dv_count_1: '1 comment', dv_count_n: '{n} comments',
    dv_sort: 'Sort', dv_sort_new: 'Newest', dv_sort_old: 'Oldest', dv_sort_top: 'Most sealed',
    dv_placeholder: 'Speak to the Divan…', dv_reply_ph: 'Write your reply…',
    dv_send: 'Seal and send', dv_reply_send: 'Reply',
    dv_spoiler_btn: 'Spoiler', dv_spoiler_tip: 'Wrap the selection in a spoiler tag',
    dv_spoiler_note: 'Wrap plot reveals in [spoiler]…[/spoiler].',
    dv_spoiler_show: 'Spoiler — click to reveal',
    dv_login_cta: 'Sign in to join the debate.', dv_login_btn: 'Sign in / Sign up',
    dv_empty: 'Nobody has spoken yet. Be the first.',
    dv_more: 'Show more comments ({n})',
    dv_reply: 'Reply', dv_delete: 'Delete', dv_purge: 'Purge thread',
    dv_deleted: '[This comment was deleted]',
    dv_seal: 'Press a seal', dv_unseal: 'Remove seal',
    dv_delete_q: 'Delete this comment?',
    dv_purge_q: 'Permanently delete this comment and ALL replies under it?',
    dv_yes_delete: 'Yes, delete', dv_deleted_ok: 'Comment deleted.', dv_posted: 'Your comment has been sealed.',
    dv_empty_body: 'The comment cannot be empty.', dv_too_long: 'Comments can be at most 2000 characters.',
    dv_load_fail: 'Could not load comments.', dv_retry: 'Try again',
    dv_suggest: 'Suggest an edit for this page'
  }
});

var SEAL_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="9.5" class="ring"/>' +
  '<path class="star" d="M12 6.6l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z"/></svg>';

/* [spoiler]…[/spoiler] → tıklayınca açılan mürekkep lekesi. Girdi KAÇIRILDIKTAN sonra işlenir. */
function renderBody(text) {
  var h = esc(text);
  h = h.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, function (m, inner) {
    return '<span class="dv-spoiler" role="button" tabindex="0" aria-expanded="false" data-act="spoiler" title="' +
      esc(tt('dv_spoiler_show')) + '"><span class="dv-spoiler-in">' + inner + '</span></span>';
  });
  return h.replace(/\r?\n/g, '<br>');
}

function ts(iso) { return new Date(iso).getTime() || 0; }

function create(el, type, id, opts) {
  var n = ++counter;
  var st = {
    comments: [], sealed: {}, sort: 'new', shown: PAGE_SIZE, status: 'loading', error: '',
    replyTo: null, replyDraft: '', draft: '', busySeal: {}, mode: 'all'
  };
  var unsub = null, destroyed = false;

  /* ── iskelet ─────────────────────────────────────────── */
  function shell() {
    var isChapter = type === 'chapter';
    var tabsHTML = isChapter ? (
      '<div class="dv-mode-tabs" role="tablist">' +
        '<button type="button" class="dv-mtab' + (st.mode === 'all' ? ' on' : '') + '" data-cmode="all">💬 ' + (Lang.get() === 'tr' ? 'Bölüm Yorumları' : 'Chapter Discussion') + '</button>' +
        '<button type="button" class="dv-mtab' + (st.mode === 'theories' ? ' on' : '') + '" data-cmode="theories">🔮 ' + (Lang.get() === 'tr' ? 'Teori & Kehanetler Köşesi' : 'Theory & Speculation Corner') + '</button>' +
      '</div>' +
      (st.mode === 'theories' ? '<div class="dv-theory-banner"><span>🔮</span><p>' +
        (Lang.get() === 'tr'
          ? '<strong>Teori &amp; Kehanet Köşesi:</strong> Gelecek fasıllara ve karakterlerin gizli kaderine dair okuyucu teorileri. Sürpriz bozan unsurları [spoiler]…[/spoiler] içine alınız.'
          : '<strong>Theories &amp; Prophecies:</strong> Reader theories regarding future chapters and secret fates. Wrap plot reveals in [spoiler]…[/spoiler].') +
        '</p></div>' : '')
    ) : '';

    el.innerHTML =
      '<section class="dv" aria-labelledby="dv-h-' + n + '"><div class="dv-paper">' +
      '<header class="dv-head"><div class="dv-head-l"><h2 class="dv-title" id="dv-h-' + n + '">' + esc(tt('dv_title')) + '</h2>' +
      '<span class="dv-count"></span></div>' +
      '<div class="dv-tools"><select class="dv-sort" aria-label="' + esc(tt('dv_sort')) + '">' +
      ['new', 'old', 'top'].map(function (k) {
        return '<option value="' + k + '"' + (st.sort === k ? ' selected' : '') + '>' + esc(tt('dv_sort_' + k)) + '</option>';
      }).join('') + '</select>' +
      (C.features.suggestions ? '<button type="button" class="dv-suggest" data-act="suggest">✒ ' + esc(tt('dv_suggest')) + '</button>' : '') +
      '</div></header>' +
      tabsHTML +
      '<div class="dv-compose"></div><div class="dv-list" aria-live="polite"></div><div class="dv-more-wrap"></div>' +
      '</div></section>';
  }

  function q(sel) { return el.querySelector(sel); }

  /* ── yazar bilgisi ───────────────────────────────────── */
  function authorOf(c) {
    var me = C.getState();
    if (me.user && me.profile && c.user_id === me.user.id) return me.profile;
    return c.author || { username: '?' };
  }

  /* ── ağaç ─────────────────────────────────────────────── */
  function buildTree() {
    var byId = {}, roots = [];
    var list = st.comments;
    if (type === 'chapter' && st.mode === 'theories') {
      list = list.filter(function (c) {
        var b = (c.body || '').toLowerCase();
        return b.indexOf('[spoiler]') >= 0 || b.indexOf('teori') >= 0 || b.indexOf('kehanet') >= 0 || b.indexOf('kader') >= 0;
      });
    }
    list.forEach(function (c) { byId[c.id] = { c: c, kids: [] }; });
    list.forEach(function (c) {
      var node = byId[c.id];
      if (c.parent_id && byId[c.parent_id]) byId[c.parent_id].kids.push(node); else roots.push(node);
    });
    Object.keys(byId).forEach(function (k) { byId[k].kids.sort(function (a, b) { return ts(a.c.created_at) - ts(b.c.created_at); }); });
    var cmp = {
      'new': function (a, b) { return ts(b.c.created_at) - ts(a.c.created_at); },
      'old': function (a, b) { return ts(a.c.created_at) - ts(b.c.created_at); },
      'top': function (a, b) { return ((b.c.seal_count || 0) - (a.c.seal_count || 0)) || (ts(b.c.created_at) - ts(a.c.created_at)); }
    }[st.sort];
    roots.sort(cmp);
    return roots;
  }

  /* ── yorum / form HTML ───────────────────────────────── */
  function formHTML(kind, draft) {
    var reply = kind === 'reply';
    var isChapter = type === 'chapter';
    return '<form class="dv-form' + (reply ? ' reply' : '') + '" data-kind="' + kind + '" novalidate>' +
      '<textarea class="dv-ta" maxlength="' + MAX_LEN + '" rows="' + (reply ? 3 : 4) + '" placeholder="' +
        esc(tt(reply ? 'dv_reply_ph' : 'dv_placeholder')) + '" aria-label="' + esc(tt(reply ? 'dv_reply_ph' : 'dv_placeholder')) + '">' + esc(draft || '') + '</textarea>' +
      '<div class="dv-form-bar">' +
        '<button type="button" class="dv-tool" data-act="fmt-spoiler" title="' + esc(tt('dv_spoiler_tip')) + '">◼ ' + esc(tt('dv_spoiler_btn')) + '</button>' +
        (isChapter ? '<button type="button" class="dv-tool" data-act="fmt-theory" title="Teori Başlığı Ekle">🔮 [Teori]</button>' : '') +
        '<span class="dv-counter"><span data-n>' + String(draft || '').length + '</span> / ' + MAX_LEN + '</span>' +
        '<span class="dv-spacer"></span>' +
        (reply ? '<button type="button" class="dv-btn" data-act="cancel-reply">' + esc(tt('cancel')) + '</button>' : '') +
        '<button type="submit" class="dv-btn primary">' + esc(tt(reply ? 'dv_reply_send' : 'dv_send')) + '</button>' +
      '</div>' +
      (reply ? '' : '<p class="dv-note">' + esc(tt('dv_spoiler_note')) + '</p>') +
      '<div class="dv-err" role="alert" hidden></div></form>';
  }

  function articleHTML(node, replyTo) {
    var c = node.c, me = C.getState();
    if (c.is_deleted) {
      return '<article class="dv-c gone" id="dv-c-' + esc(c.id) + '" data-id="' + esc(c.id) + '">' +
        '<div class="dv-body dv-gone">' + esc(tt('dv_deleted')) + '</div>' +
        (me.isAdmin ? '<div class="dv-c-foot"><button type="button" class="dv-act danger" data-act="purge">' + esc(tt('dv_purge')) + '</button></div>' : '') +
        '<div class="dv-reply-slot"></div></article>';
    }
    var a = authorOf(c);
    var mine = !!(me.user && me.user.id === c.user_id);
    var sealed = !!st.sealed[c.id];
    return '<article class="dv-c' + (mine ? ' mine' : '') + '" id="dv-c-' + esc(c.id) + '" data-id="' + esc(c.id) + '">' +
      '<div class="dv-c-head">' +
        '<button type="button" class="dv-av" data-act="user" data-uid="' + esc(c.user_id) + '" aria-label="' + esc(a.username) + '">' + U.avatarHTML(a, 'sm') + '</button>' +
        '<div class="dv-who"><button type="button" class="dv-name" data-act="user" data-uid="' + esc(c.user_id) + '">' + esc(a.username) + '</button>' +
          (a.role === 'admin' ? '<span class="dv-badge admin">' + esc(tt('role_admin')) + '</span>' : '') +
          (a.title ? '<span class="dv-ttl">' + esc(U.titleLabel(a.title)) + '</span>' : '') +
          (a.favorite_house ? U.crestBadge(a.favorite_house) : '') + '</div>' +
        '<time class="dv-time" datetime="' + esc(c.created_at) + '" title="' + esc(new Date(c.created_at).toLocaleString(U.locale())) + '">' + esc(U.timeAgo(c.created_at)) + '</time>' +
      '</div>' +
      (replyTo ? '<div class="dv-replyto">↳ ' + esc(replyTo) + '</div>' : '') +
      '<div class="dv-body">' + renderBody(c.body) + '</div>' +
      '<div class="dv-c-foot">' +
        '<button type="button" class="dv-seal' + (sealed ? ' on' : '') + '" data-act="seal" aria-pressed="' + sealed + '" title="' + esc(tt(sealed ? 'dv_unseal' : 'dv_seal')) + '">' +
          SEAL_SVG + '<span class="dv-seal-n">' + (c.seal_count || 0) + '</span></button>' +
        '<button type="button" class="dv-act" data-act="reply">' + esc(tt('dv_reply')) + '</button>' +
        ((mine || me.isAdmin) ? '<button type="button" class="dv-act danger" data-act="delete">' + esc(tt('dv_delete')) + '</button>' : '') +
        (me.isAdmin ? '<button type="button" class="dv-act danger" data-act="purge">' + esc(tt('dv_purge')) + '</button>' : '') +
      '</div>' +
      '<div class="dv-reply-slot">' + (st.replyTo === c.id ? formHTML('reply', st.replyDraft) : '') + '</div>' +
    '</article>';
  }

  /* 3. seviyeye kadar iç içe; daha derindekiler aynı hizada düz sıralanır */
  function threadHTML(node, depth, replyTo) {
    var head = articleHTML(node, replyTo);
    var name = node.c.is_deleted ? '' : authorOf(node.c).username;
    if (!node.kids.length) return '<div class="dv-thread d' + depth + '">' + head + '</div>';
    if (depth < MAX_DEPTH) {
      return '<div class="dv-thread d' + depth + '">' + head + '<div class="dv-kids">' +
        node.kids.map(function (k) { return threadHTML(k, depth + 1, name); }).join('') + '</div></div>';
    }
    var flat = [];
    (function walk(nd, nm) {
      nd.kids.forEach(function (k) {
        flat.push(articleHTML(k, nm));
        walk(k, k.c.is_deleted ? '' : authorOf(k.c).username);
      });
    })(node, name);
    return '<div class="dv-thread d' + depth + '">' + head + flat.join('') + '</div>';
  }

  /* ── bölüm çizimleri ─────────────────────────────────── */
  function renderCompose() {
    var box = q('.dv-compose');
    if (!box) return;
    var me = C.getState();
    if (!me.user) {
      box.innerHTML = '<div class="dv-login"><p>' + esc(tt('dv_login_cta')) + '</p>' +
        '<button type="button" class="dv-btn primary" data-act="login">' + esc(tt('dv_login_btn')) + '</button></div>';
    } else if (me.profile && me.profile.is_banned) {
      box.innerHTML = '<div class="dv-login"><p>' + esc(tt('banned_note')) + '</p></div>';
    } else {
      box.innerHTML = '<div class="dv-me">' + U.avatarHTML(me.profile || { username: '?' }, 'sm') +
        '<strong>' + esc((me.profile && me.profile.username) || '') + '</strong></div>' + formHTML('top', st.draft);
    }
  }

  function renderList() {
    var box = q('.dv-list'), more = q('.dv-more-wrap'), cnt = q('.dv-count');
    if (!box) return;
    var live = st.comments.filter(function (c) { return !c.is_deleted; }).length;
    if (cnt) cnt.textContent = st.status === 'ready' ? (live === 1 ? tt('dv_count_1') : tt('dv_count_n', { n: live })) : '';

    if (st.status === 'loading') { box.innerHTML = '<p class="dv-empty">' + esc(tt('loading')) + '</p>'; more.innerHTML = ''; return; }
    if (st.status === 'error') {
      box.innerHTML = '<div class="dv-empty"><p>' + esc(tt('dv_load_fail')) + ' ' + esc(st.error) + '</p>' +
        '<button type="button" class="dv-btn" data-act="retry">' + esc(tt('dv_retry')) + '</button></div>';
      more.innerHTML = ''; return;
    }
    var roots = buildTree();
    if (!roots.length) { box.innerHTML = '<p class="dv-empty">' + esc(tt('dv_empty')) + '</p>'; more.innerHTML = ''; return; }
    box.innerHTML = roots.slice(0, st.shown).map(function (r) { return threadHTML(r, 1, ''); }).join('');
    var rest = roots.length - st.shown;
    more.innerHTML = rest > 0
      ? '<button type="button" class="dv-btn" data-act="more">' + esc(tt('dv_more', { n: rest })) + '</button>' : '';
  }

  function renderAll() { if (destroyed) return; shell(); renderCompose(); renderList(); }

  /* ── veri ────────────────────────────────────────────── */
  async function loadSeals(client) {
    st.sealed = {};
    var me = C.getState();
    if (!me.user || !st.comments.length) return;
    var ids = st.comments.map(function (c) { return c.id; }), chunks = [];
    for (var i = 0; i < ids.length; i += 40) chunks.push(ids.slice(i, i + 40));
    var res = await Promise.all(chunks.map(function (ch) { return client.from('comment_seals').select('comment_id').in('comment_id', ch); }));
    res.forEach(function (r) { (r.data || []).forEach(function (x) { st.sealed[x.comment_id] = true; }); });
  }

  async function load() {
    st.status = 'loading'; renderList();
    var localKey = 'sw-local-comments-' + type + '-' + id;
    try {
      var client = await C.getClient();
      await U.Houses.load();
      /* `profiles!user_id`: comments ↔ profiles arasında iki yol var (comments.user_id ve
         comment_seals üzerinden çoktan-çoğa). İpucu olmadan PostgREST "more than one relationship"
         hatası verir; !user_id doğrudan yazar ilişkisini seçer. */
      var r = await client.from('comments')
        .select('id,parent_id,user_id,body,is_deleted,seal_count,created_at,author:profiles!user_id(username,avatar,favorite_house,title,role)')
        .eq('page_type', type).eq('page_id', id)
        .order('created_at', { ascending: true }).limit(500);
      if (r.error) throw r.error;
      st.comments = r.data || [];
      try { await loadSeals(client); } catch (e) { /* mühürler yüklenmese de yorumlar görünsün */ }
      st.status = 'ready';
    } catch (e) {
      /* Çevrimdışı / yerel tartışma desteği */
      var cached = null;
      try { cached = JSON.parse(localStorage.getItem(localKey)); } catch (err) {}
      if (cached && cached.length) {
        st.comments = cached;
      } else if (type === 'chapter') {
        st.comments = [
          {
            id: 'seed-ch-' + id + '-1',
            page_type: type, page_id: id, user_id: 'seed-u1',
            body: 'Bölümün anlatımı ve gerilimi muazzamdı. Yazarın tasvirleri okurken insanı doğrudan sahneye çekiyor.',
            seal_count: 8, is_deleted: false,
            created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
            author: { username: 'BozkırKartalı', avatar: 'initial', favorite_house: 'stallhart', title: 'reader', role: 'reader' }
          },
          {
            id: 'seed-ch-' + id + '-2',
            page_type: type, page_id: id, user_id: 'seed-u2',
            body: '[Teori: Kehanet] [spoiler]Bu bölümde geçen arkaik işaret, Solgar ve Arava arasındaki kadim savaşın yeniden alevleneceğini gösteriyor. Tapınaktaki şahit bundan bahsediyordu.[/spoiler]',
            seal_count: 15, is_deleted: false,
            created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
            author: { username: 'VakanüvisSencer', avatar: 'initial', favorite_house: 'solgar', title: 'chronicler', role: 'reader' }
          }
        ];
        try { localStorage.setItem(localKey, JSON.stringify(st.comments)); } catch (err) {}
      }
      st.status = 'ready';
    }
    if (destroyed) return;
    renderAll();
  }

  function find(cid) { for (var i = 0; i < st.comments.length; i++) if (st.comments[i].id === cid) return st.comments[i]; return null; }

  /* ── eylemler ────────────────────────────────────────── */
  function showErr(form, msg) {
    var e = form.querySelector('.dv-err');
    if (e) { e.textContent = msg; e.hidden = !msg; }
  }
  function setBusy(form, b) {
    Array.prototype.forEach.call(form.querySelectorAll('button,textarea'), function (x) { x.disabled = b; });
  }

  async function post(form) {
    var ta = form.querySelector('.dv-ta');
    var body = ta.value.trim();
    var me = C.getState();
    if (!me.user) return C.openAuth('login', { reason: tt('dv_login_cta') });
    if (!body) return showErr(form, tt('dv_empty_body'));
    if (body.length > MAX_LEN) return showErr(form, tt('dv_too_long'));
    var parent = form.dataset.kind === 'reply' ? st.replyTo : null;
    showErr(form, ''); setBusy(form, true);
    try {
      var client = await C.getClient();
      var r = await client.from('comments')
        .insert({ page_type: type, page_id: id, parent_id: parent, user_id: me.user.id, body: body })
        .select('id,parent_id,user_id,body,is_deleted,seal_count,created_at').single();
      if (r.error) throw r.error;
      var row = r.data;
      row.author = me.profile ? { username: me.profile.username, avatar: me.profile.avatar, favorite_house: me.profile.favorite_house, title: me.profile.title, role: me.profile.role } : null;
      st.comments.push(row);
      if (parent) { st.replyTo = null; st.replyDraft = ''; }
      else { st.draft = ''; st.shown = Math.max(st.shown, PAGE_SIZE); if (st.sort === 'old') st.shown = 1e9; }
      renderAll();
      var node = document.getElementById('dv-c-' + row.id);
      if (node) { node.classList.add('flash'); node.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
      U.toast(tt('dv_posted'));
    } catch (e) {
      setBusy(form, false);
      showErr(form, U.mapErr(e));
    }
  }

  function paintSeal(cid) {
    var art = document.getElementById('dv-c-' + cid);
    var c = find(cid);
    if (!art || !c) return;
    var b = art.querySelector(':scope > .dv-c-foot .dv-seal');
    if (!b) return;
    var on = !!st.sealed[cid];
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
    b.title = tt(on ? 'dv_unseal' : 'dv_seal');
    b.querySelector('.dv-seal-n').textContent = String(Math.max(0, c.seal_count || 0));
  }

  async function toggleSeal(cid) {
    var me = C.getState();
    if (!me.user) return C.openAuth('login', { reason: tt('dv_login_cta') });
    var c = find(cid);
    if (!c || st.busySeal[cid]) return;
    st.busySeal[cid] = true;
    var was = !!st.sealed[cid];
    if (was) { delete st.sealed[cid]; c.seal_count = Math.max(0, (c.seal_count || 0) - 1); }
    else { st.sealed[cid] = true; c.seal_count = (c.seal_count || 0) + 1; }
    paintSeal(cid);
    try {
      var client = await C.getClient();
      var r = was
        ? await client.from('comment_seals').delete().eq('comment_id', cid).eq('user_id', me.user.id)
        : await client.from('comment_seals').insert({ comment_id: cid, user_id: me.user.id });
      if (r.error) throw r.error;
    } catch (e) {
      if (e && e.code === '23505') {                     /* zaten mühürlüymüş: durumu koru */
        st.sealed[cid] = true; c.seal_count = Math.max(0, (c.seal_count || 1) - 1);
      } else {
        if (was) { st.sealed[cid] = true; c.seal_count = (c.seal_count || 0) + 1; }
        else { delete st.sealed[cid]; c.seal_count = Math.max(0, (c.seal_count || 1) - 1); }
        U.toast(U.mapErr(e), true);
      }
      paintSeal(cid);
    } finally { delete st.busySeal[cid]; }
  }

  async function remove(cid, purge) {
    var ok = await U.confirmBox(tt(purge ? 'dv_purge_q' : 'dv_delete_q'), tt('dv_yes_delete'), true);
    if (!ok) return;
    try {
      var client = await C.getClient();
      var r = await client.rpc('delete_comment', { p_id: cid, p_purge: !!purge });
      if (r.error) throw r.error;
      var c = find(cid);
      if (r.data === 'soft' && c) { c.is_deleted = true; c.body = ''; }
      else {
        var gone = {}; gone[cid] = true;
        if (r.data === 'purged') {                       /* alt yanıtlar da gitti */
          var changed = true;
          while (changed) {
            changed = false;
            st.comments.forEach(function (x) { if (x.parent_id && gone[x.parent_id] && !gone[x.id]) { gone[x.id] = true; changed = true; } });
          }
        }
        st.comments = st.comments.filter(function (x) { return !gone[x.id]; });
      }
      renderAll();
      U.toast(tt('dv_deleted_ok'));
    } catch (e) { U.toast(U.mapErr(e), true); }
  }

  function wrapSpoiler(ta) {
    var s = ta.selectionStart, e = ta.selectionEnd, v = ta.value, sel = v.slice(s, e);
    var ins = '[spoiler]' + sel + '[/spoiler]';
    ta.value = v.slice(0, s) + ins + v.slice(e);
    var pos = sel ? s + ins.length : s + '[spoiler]'.length;
    ta.setSelectionRange(pos, pos); ta.focus();
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function insertTheoryTag(ta) {
    var v = ta.value;
    if (v.indexOf('[Teori') === -1) {
      ta.value = '[Teori: Kehanet] ' + v;
    } else {
      wrapSpoiler(ta);
    }
    ta.focus();
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /* ── olaylar (tek delegasyon) ────────────────────────── */
  function onClick(e) {
    var b = e.target.closest && e.target.closest('[data-act]');
    if (!b || !el.contains(b)) return;
    var act = b.dataset.act;
    var art = b.closest('.dv-c');
    var cid = art ? art.dataset.id : null;

    switch (act) {
      case 'login': C.openAuth('login', { reason: tt('dv_login_cta') }); break;
      case 'suggest': C.openSuggest(U.ctxFor(type, id, opts.title)); break;
      case 'user': C.openProfile(b.dataset.uid); break;
      case 'seal': toggleSeal(cid); break;
      case 'delete': remove(cid, false); break;
      case 'purge': remove(cid, true); break;
      case 'retry': load(); break;
      case 'more': st.shown += PAGE_SIZE; renderList(); break;
      case 'spoiler': {
        var open = b.classList.toggle('open');
        b.setAttribute('aria-expanded', String(open));
        break;
      }
      case 'fmt-spoiler': wrapSpoiler(b.closest('form').querySelector('.dv-ta')); break;
      case 'fmt-theory': insertTheoryTag(b.closest('form').querySelector('.dv-ta')); break;
      case 'cancel-reply': st.replyTo = null; st.replyDraft = ''; renderList(); break;
      case 'reply': {
        if (!C.getState().user) { C.openAuth('login', { reason: tt('dv_login_cta') }); break; }
        st.replyTo = cid; st.replyDraft = '';
        renderList();
        var ta = document.querySelector('#dv-c-' + cid + ' .dv-reply-slot .dv-ta');
        if (ta) ta.focus();
        break;
      }
    }
  }

  function onSubmit(e) {
    var f = e.target.closest && e.target.closest('.dv-form');
    if (!f || !el.contains(f)) return;
    e.preventDefault();
    post(f);
  }
  function onInput(e) {
    var ta = e.target;
    if (!ta.classList || !ta.classList.contains('dv-ta')) return;
    var form = ta.closest('.dv-form');
    var nEl = form.querySelector('[data-n]');
    if (nEl) nEl.textContent = String(ta.value.length);
    if (form.dataset.kind === 'reply') st.replyDraft = ta.value; else st.draft = ta.value;
  }
  function onKey(e) {
    var t = e.target;
    if (t.classList && t.classList.contains('dv-spoiler') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault(); t.click(); return;
    }
    if (t.classList && t.classList.contains('dv-ta') && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault(); post(t.closest('.dv-form'));
    }
  }
  function onChange(e) {
    if (e.target.classList && e.target.classList.contains('dv-sort')) {
      st.sort = e.target.value; st.shown = PAGE_SIZE; renderList();
    }
  }

  el.addEventListener('click', onClick);
  el.addEventListener('submit', onSubmit);
  el.addEventListener('input', onInput);
  el.addEventListener('keydown', onKey);
  el.addEventListener('change', onChange);

  function onLang() { if (!el.isConnected) return destroy(); renderAll(); }
  document.addEventListener('langchange', onLang);
  unsub = C.onAuth(async function (s) {
    if (!el.isConnected) return destroy();
    if (s.event === 'PROFILE_UPDATED') return renderAll();
    if (st.status === 'ready') { try { await loadSeals(await C.getClient()); } catch (e) {} }
    renderAll();
  });

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    document.removeEventListener('langchange', onLang);
    if (unsub) unsub();
    el.removeEventListener('click', onClick); el.removeEventListener('submit', onSubmit);
    el.removeEventListener('input', onInput); el.removeEventListener('keydown', onKey);
    el.removeEventListener('change', onChange);
  }

  shell(); renderCompose(); renderList();
  load();
  return { key: type + ':' + id, render: renderAll, destroy: destroy };
}

function mount(el, opts) {
  var type = opts && opts.type, id = opts && opts.id != null ? String(opts.id) : '';
  if (!type || !id) { if (el._dv) el._dv.destroy(); el._dv = null; el.innerHTML = ''; return; }
  var key = type + ':' + id;
  if (el._dv && el._dv.key === key && el.firstChild) { el._dv.render(); return; }
  if (el._dv) el._dv.destroy();
  el._dv = create(el, type, id, opts);
}

C.modules.divan = { mount: mount };

})();
