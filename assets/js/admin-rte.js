/* ═══════════════════════════════════════════════════════════
   RTE — Çekmece içi WYSIWYG metin editörü (TR / EN sekmeli)
   ---------------------------------------------------------------
   · admin.js → biField(..., isArea) zengin alanlar için bu editörü kurar.
   · Değer, çekmecedeki gizli #f-<alan>-tr / #f-<alan>-en kutularına
     TEMİZLENMİŞ HTML olarak yazılır; admin.js'in kaydet mantığı
     (readBi) hiç değişmeden çalışmaya devam eder.
   · Eski düz metin / Markdown içerik açılışta HTML'e çevrilip
     gösterilir; kutuya yalnızca siz düzenleyince HTML yazılır.
   · Güvenlik: tüm çıktı SWRich.sanitize'dan geçer (sw-rich.js).
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var SW = window.SWRich;
  if (!SW) { console.warn('RTE: SWRich yüklenmedi'); return; }
  var esc = SW.esc;

  var FONTS = [
    ['Varsayılan', 'inherit'],
    ['Merriweather', "Merriweather, Georgia, serif"],
    ['Modern Antiqua', "'Modern Antiqua', 'IM Fell English', Georgia, serif"],
    ['IM Fell English', "'IM Fell English', Georgia, serif"],
    ['Georgia', 'Georgia, serif'],
    ['Times New Roman', "'Times New Roman', serif"],
    ['Arial', 'Arial, sans-serif'],
    ['Verdana', 'Verdana, sans-serif'],
    ['Courier New', "'Courier New', monospace"]
  ];
  var SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48];
  var COLORS = ['#c9a24d', '#b87333', '#8b0000', '#ff6b6b', '#e8d9b5', '#ffffff', '#9a9a9a', '#5fa8d3', '#7fbf7f', '#b58be0'];

  function ic(p) {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }
  var ICON = {
    undo: ic('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>'),
    redo: ic('<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 000 12h3"/>'),
    clear: ic('<path d="M5 6V4h14v2M12 4v10M9 20h6"/><path d="M15 15l5 5M20 15l-5 5"/>'),
    table: ic('<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 10h18M3 15h18M9 4v16M15 4v16"/>'),
    spoiler: ic('<path d="M3 3l18 18"/><path d="M10.6 6.1A9.8 9.8 0 0112 6c5 0 8.5 4 10 6-.7 1-1.8 2.3-3.2 3.4M6.5 7.5C4.6 8.9 3.2 10.7 2 12c1.5 2 5 6 10 6 1.3 0 2.5-.3 3.6-.8"/>'),
    quote: ic('<path d="M7 7h4v4c0 3-1.5 5-4 6M15 7h4v4c0 3-1.5 5-4 6"/>'),
    bubble: ic('<path d="M21 12a8 8 0 01-11.5 7.2L4 20l1.2-4.3A8 8 0 1121 12z"/>'),
    hr: ic('<path d="M4 12h16"/>'),
    image: ic('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M21 16l-5-5-8 8"/>'),
    gallery: ic('<rect x="2" y="6" width="16" height="14" rx="2"/><path d="M6 3h14a2 2 0 012 2v12"/><circle cx="7.5" cy="11" r="1.2"/><path d="M18 17l-4-4-6 6"/>'),
    link: ic('<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3A4 4 0 0011 18.7l1-1"/>'),
    left: ic('<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>'),
    center: ic('<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>'),
    right: ic('<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>'),
    justify: ic('<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>'),
    full: ic('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    code: ic('<path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/>'),
    ul: ic('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
    ol: ic('<path d="M10 6h10M10 12h10M10 18h10"/><path d="M4 5l1-1v4M4 14h2l-2 3h2"/>')
  };

  function btn(cmd, title, inner, extra) {
    return '<button type="button" class="rte-btn" data-cmd="' + cmd + '" title="' + esc(title) + '"' + (extra || '') + '>' + inner + '</button>';
  }
  function sep() { return '<span class="rte-sep"></span>'; }

  function toolbarHTML() {
    var block = '<select class="rte-sel rte-sel-block" data-sel="block" title="Paragraf / başlık"><option value="">Biçim</option>' +
      '<option value="p">Paragraf</option><option value="h1">Başlık 1</option><option value="h2">Başlık 2</option>' +
      '<option value="h3">Başlık 3</option><option value="h4">Başlık 4</option></select>';
    var size = '<select class="rte-sel rte-sel-size" data-sel="size" title="Yazı boyutu"><option value="">Boyut</option>' +
      SIZES.map(function (n) { return '<option value="' + n + '">' + n + 'px</option>'; }).join('') + '</select>';
    var font = '<select class="rte-sel rte-sel-font" data-sel="font" title="Yazı tipi"><option value="">Yazı tipi</option>' +
      FONTS.map(function (f) { return '<option value="' + esc(f[1]) + '">' + esc(f[0]) + '</option>'; }).join('') + '</select>';
    var color = '<div class="rte-dd"><button type="button" class="rte-btn rte-color" data-cmd="color-toggle" title="Yazı rengi">' +
      '<span class="rte-A">A</span><span class="rte-bar" style="background:#c9a24d"></span></button>' +
      '<div class="rte-menu rte-colors">' +
      COLORS.map(function (c) { return '<button type="button" class="rte-sw" data-cmd="color" data-color="' + c + '" style="background:' + c + '" title="' + c + '"></button>'; }).join('') +
      '<label class="rte-custom">Özel <input type="color" data-sel="colorpick" value="#c9a24d"></label>' +
      '<button type="button" class="rte-mi" data-cmd="color-reset">Rengi sıfırla</button></div></div>';
    var table = '<div class="rte-dd"><button type="button" class="rte-btn" data-cmd="table-toggle" title="Tablo">' + ICON.table + '<span class="rte-caret">▾</span></button>' +
      '<div class="rte-menu rte-list">' +
      '<button type="button" class="rte-mi" data-cmd="table-insert" data-r="3" data-c="3">Tablo ekle (3 × 3)</button>' +
      '<button type="button" class="rte-mi" data-cmd="table-insert" data-r="2" data-c="2">Tablo ekle (2 × 2)</button>' +
      '<button type="button" class="rte-mi" data-cmd="table-insert" data-r="5" data-c="3">Tablo ekle (5 × 3)</button>' +
      '<hr><button type="button" class="rte-mi" data-cmd="table-addrow">Alta satır ekle</button>' +
      '<button type="button" class="rte-mi" data-cmd="table-addcol">Sağa sütun ekle</button>' +
      '<button type="button" class="rte-mi" data-cmd="table-delrow">Satırı sil</button>' +
      '<button type="button" class="rte-mi" data-cmd="table-delcol">Sütunu sil</button>' +
      '<button type="button" class="rte-mi" data-cmd="table-del">Tabloyu sil</button></div></div>';

    return '<div class="rte-toolbar" role="toolbar" aria-label="Biçimlendirme">' +
      '<div class="rte-grp">' + btn('undo', 'Geri al (Ctrl+Z)', ICON.undo) + btn('redo', 'Yinele (Ctrl+Y)', ICON.redo) + '</div>' + sep() +
      '<div class="rte-grp">' + block + size + font + '</div>' + sep() +
      '<div class="rte-grp">' +
        btn('bold', 'Kalın (Ctrl+B)', '<b>B</b>') + btn('italic', 'İtalik (Ctrl+I)', '<i>I</i>') +
        btn('underline', 'Altı çizili (Ctrl+U)', '<u>U</u>') + btn('strike', 'Üstü çizili', '<s>S</s>') +
        btn('clear', 'Biçimi temizle', ICON.clear) + color + '</div>' + sep() +
      '<div class="rte-grp">' + btn('ul', 'Madde işaretli liste', ICON.ul) + btn('ol', 'Numaralı liste', ICON.ol) + '</div>' + sep() +
      '<div class="rte-grp">' + table + btn('spoiler', 'Spoiler (gizli metin) — metni seçip basın', ICON.spoiler) +
        btn('quote', 'Alıntı', ICON.quote) + btn('bubble', 'Konuşma balonu', ICON.bubble) + '</div>' + sep() +
      '<div class="rte-grp">' + btn('hr', 'Ayraç çizgisi', ICON.hr) + btn('link', 'Bağlantı ekle', ICON.link) +
        btn('image', 'Görsel ekle (adres ile)', ICON.image) +
        btn('gallery', 'Görsel galerisinden ekle', ICON.gallery + '<span class="rte-lbl">Görseller</span>') + '</div>' + sep() +
      '<div class="rte-grp">' + btn('left', 'Sola hizala', ICON.left) + btn('center', 'Ortala', ICON.center) +
        btn('right', 'Sağa hizala', ICON.right) + btn('justify', 'İki yana yasla', ICON.justify) + '</div>' + sep() +
      '<div class="rte-grp">' + btn('full', 'Tam ekran', ICON.full) + btn('code', 'Kaynak kodu (HTML)', ICON.code) + '</div>' +
    '</div>';
  }

  /* ── Genel (tek sefer) dinleyiciler ─────────────────────── */
  var instances = [];
  var globalBound = false;

  function bindGlobal() {
    if (globalBound) return;
    globalBound = true;
    document.addEventListener('selectionchange', function () {
      var sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      var r = sel.getRangeAt(0);
      instances.forEach(function (it) {
        if (it.host.isConnected && it.cur().contains(r.commonAncestorContainer)) {
          it.st.last = r.cloneRange();
          it.updateStates();
        }
      });
    });
    document.addEventListener('click', function (e) {
      document.querySelectorAll('.rte-dd.open').forEach(function (d) { if (!d.contains(e.target)) d.classList.remove('open'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var full = document.querySelector('.rte.rte-full');
      if (!full) return;
      e.stopPropagation(); e.preventDefault();
      var it = instances.filter(function (i) { return i.host === full; })[0];
      if (it) it.toggleFull(false);
    }, true);
  }

  /* ── Tek editör kurulumu ─────────────────────────────────── */
  function mount(host) {
    if (host.__rte) return;
    var key = host.getAttribute('data-rte');
    var minH = parseInt(host.getAttribute('data-min'), 10) || 240;
    var tas = { tr: host.querySelector('#f-' + key + '-tr'), en: host.querySelector('#f-' + key + '-en') };
    if (!tas.tr || !tas.en) return;

    host.insertAdjacentHTML('afterbegin',
      '<div class="rte-head"><div class="rte-tabs" role="tablist">' +
        '<button type="button" class="rte-tab on" data-lang="tr">🇹🇷 Türkçe</button>' +
        '<button type="button" class="rte-tab" data-lang="en">🇬🇧 English</button></div>' +
        '<span class="rte-note" hidden></span><span class="rte-stat"></span></div>' +
      toolbarHTML() +
      '<div class="rte-body" style="--rte-min:' + minH + 'px">' +
        '<div class="rte-area" contenteditable="true" spellcheck="true" data-lang="tr"></div>' +
        '<div class="rte-area" contenteditable="true" spellcheck="true" data-lang="en" style="display:none"></div>' +
        '<textarea class="rte-src" spellcheck="false" style="display:none"></textarea>' +
      '</div>');

    var eds = { tr: host.querySelector('.rte-area[data-lang="tr"]'), en: host.querySelector('.rte-area[data-lang="en"]') };
    var src = host.querySelector('.rte-src');
    var stat = host.querySelector('.rte-stat');
    var note = host.querySelector('.rte-note');
    var tb = host.querySelector('.rte-toolbar');
    var st = { lang: 'tr', src: false, last: null };
    var converted = false;

    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) {}

    ['tr', 'en'].forEach(function (l) {
      var v = tas[l].value || '';
      if (!v.trim()) eds[l].innerHTML = '<p><br></p>';
      else if (SW.isHtml(v)) eds[l].innerHTML = SW.sanitize(v);
      else { eds[l].innerHTML = SW.sanitize(SW.mdToHtml(v)) || '<p><br></p>'; converted = true; }
    });
    if (converted) { note.hidden = false; note.textContent = 'Eski metin dönüştürüldü — düzenlerseniz HTML olarak kaydedilir.'; }

    function cur() { return eds[st.lang]; }
    function isEmpty(ed) { return !ed.textContent.replace(/\u200b/g, '').trim() && !ed.querySelector('img,hr,table'); }

    function updateStat() {
      var t = cur().textContent.trim();
      stat.textContent = (t ? t.split(/\s+/).length : 0) + ' kelime · ' + t.length + ' karakter';
    }
    function updateTabs() {
      host.querySelectorAll('.rte-tab').forEach(function (b) {
        var l = b.getAttribute('data-lang');
        b.classList.toggle('on', l === st.lang);
        b.classList.toggle('has', !isEmpty(eds[l]));
      });
    }
    /* Chrome, düzenleyici alanının kendi yazı boyutu/rengi/fontunu içeriğe "sızdırabilir";
       bunlar sitede yanlış görünür. Kaydetmeden önce ayıkla. */
    function normFF(v) { return String(v || '').replace(/["'\s]/g, '').toLowerCase(); }
    function editorHTML(ed) {
      var clone = ed.cloneNode(true), cs = window.getComputedStyle(ed);
      var baseFF = normFF(cs.fontFamily);
      Array.prototype.forEach.call(clone.querySelectorAll('[style]'), function (n) {
        var fs = n.style.fontSize;
        if (fs && (fs === '0.95rem' || fs === cs.fontSize)) n.style.removeProperty('font-size');
        if (n.style.color && n.style.color === cs.color) n.style.removeProperty('color');
        if (n.style.fontFamily && normFF(n.style.fontFamily) === baseFF) n.style.removeProperty('font-family');
        if (!n.getAttribute('style')) n.removeAttribute('style');
        if (n.tagName === 'SPAN' && !n.attributes.length) {
          while (n.firstChild) n.parentNode.insertBefore(n.firstChild, n);
          n.remove();
        }
      });
      Array.prototype.forEach.call(clone.querySelectorAll('p:empty'), function (n) { n.remove(); });
      return clone.innerHTML;
    }
    function sync(l) {
      l = l || st.lang;
      tas[l].value = isEmpty(eds[l]) ? '' : SW.sanitize(editorHTML(eds[l]));
      updateStat(); updateTabs();
    }

    function updateStates() {
      if (st.src) return;
      [['bold', 'bold'], ['italic', 'italic'], ['underline', 'underline'], ['strike', 'strikeThrough'],
       ['ul', 'insertUnorderedList'], ['ol', 'insertOrderedList'], ['left', 'justifyLeft'],
       ['center', 'justifyCenter'], ['right', 'justifyRight'], ['justify', 'justifyFull']].forEach(function (p) {
        var b = tb.querySelector('[data-cmd="' + p[0] + '"]'); if (!b) return;
        var on = false; try { on = document.queryCommandState(p[1]); } catch (e) {}
        b.classList.toggle('on', !!on);
      });
    }

    function restore() {
      var ed = cur(); ed.focus();
      if (st.last && ed.contains(st.last.commonAncestorContainer)) {
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(st.last);
      }
    }
    function exec(cmd, val) {
      restore();
      try { document.execCommand('styleWithCSS', false, true); } catch (e) {}
      var ok = false;
      try { ok = document.execCommand(cmd, false, val); } catch (e) {}
      sync(); return ok;
    }
    function selNode() { restore(); var s = window.getSelection(); return s.rangeCount ? s.anchorNode : null; }
    function closest(node, sel) {
      var ed = cur();
      while (node && node !== ed) { if (node.nodeType === 1 && node.matches(sel)) return node; node = node.parentNode; }
      return null;
    }
    function selHTML() {
      var s = window.getSelection();
      if (!s.rangeCount || s.isCollapsed) return '';
      var d = document.createElement('div'); d.appendChild(s.getRangeAt(0).cloneContents()); return d.innerHTML;
    }
    function unwrap(el) {
      while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
      el.remove(); sync();
    }
    function say(msg) { if (typeof window.toast === 'function') window.toast(msg, true); }
    function ensureParagraph() { if (!cur().firstChild) cur().innerHTML = '<p><br></p>'; }

    /* Boyut / yazı tipi / renk */
    function applySize(px) {
      exec('fontSize', '7');
      Array.prototype.forEach.call(cur().querySelectorAll('font[size="7"], span[style*="xxx-large"]'), function (n) {
        if (n.tagName === 'FONT') {
          var sp = document.createElement('span');
          while (n.firstChild) sp.appendChild(n.firstChild);
          n.parentNode.replaceChild(sp, n); n = sp;
        }
        n.style.fontSize = px + 'px';
      });
      sync();
    }
    function resetColor() {
      restore();
      var s = window.getSelection(); if (!s.rangeCount) return;
      var r = s.getRangeAt(0);
      Array.prototype.forEach.call(cur().querySelectorAll('span[style*="color"], font[color]'), function (n) {
        if (!r.intersectsNode(n)) return;
        n.style.removeProperty('color'); n.removeAttribute('color');
        if (!n.getAttribute('style')) n.removeAttribute('style');
        if (n.tagName === 'SPAN' && !n.attributes.length) unwrap(n);
      });
      sync();
    }

    /* Özel bloklar */
    function toggleQuote() {
      var n = selNode();
      exec('formatBlock', closest(n, 'blockquote') ? '<p>' : '<blockquote>');
    }
    function toggleSpoiler() {
      var n = selNode();
      var ex = closest(n, '.sw-spoiler');
      if (ex) { unwrap(ex); return; }
      var sel = window.getSelection();
      if (!sel.rangeCount || sel.isCollapsed) return say('Önce gizlenecek metni seçin.');
      /* insertHTML Chrome'da class'ı siliyor; bu yüzden DOM ile sar */
      var r = sel.getRangeAt(0), span = document.createElement('span');
      span.className = 'sw-spoiler';
      span.appendChild(r.extractContents());
      r.insertNode(span);
      sel.removeAllRanges();
      var nr = document.createRange(); nr.selectNodeContents(span); sel.addRange(nr);
      sync();
    }
    /* Editörün doğrudan çocuğu olan üst düzey bloğu bul (metin düğümü ise <p>'ye sar) */
    function topBlock(node) {
      var ed = cur();
      while (node && node.parentNode !== ed) node = node.parentNode;
      if (node && node.nodeType === 3) {
        var p = document.createElement('p');
        ed.insertBefore(p, node); p.appendChild(node); node = p;
      }
      return node;
    }
    function toggleBubble() {
      var n = selNode();
      var ex = closest(n, '.sw-bubble');
      if (ex) { unwrap(ex); return; }
      var ed = cur(), s = window.getSelection();
      var first = topBlock(n), last = first;
      if (s.rangeCount && !s.isCollapsed) {
        last = topBlock(s.getRangeAt(0).endContainer) || first;
        first = topBlock(s.getRangeAt(0).startContainer) || first;
      }
      if (!first) {
        first = document.createElement('p'); first.innerHTML = 'Konuşma metni…'; ed.appendChild(first); last = first;
      }
      var box = document.createElement('div'); box.className = 'sw-bubble';
      ed.insertBefore(box, first);
      var node = first;
      while (node) {
        var next = node.nextSibling, isLast = node === last;
        box.appendChild(node);
        if (isLast) break;
        node = next;
      }
      if (!box.nextSibling) { var tail = document.createElement('p'); tail.innerHTML = '<br>'; ed.appendChild(tail); }
      var sel2 = window.getSelection(), nr = document.createRange();
      nr.selectNodeContents(box); nr.collapse(false);
      sel2.removeAllRanges(); sel2.addRange(nr);
      sync();
    }
    /* Blok (tablo vb.) ekle: imleç başlık/biçimli span içinde olsa bile geçerli yuvalama */
    function insertBlock(html) {
      var ed = cur(), n = selNode(), blk = topBlock(n);
      var tmp = document.createElement('div'); tmp.innerHTML = html;
      var frag = document.createDocumentFragment();
      while (tmp.firstChild) frag.appendChild(tmp.firstChild);
      if (!blk) ed.appendChild(frag);
      else if (blk.tagName === 'P' && !blk.textContent.trim() && !blk.querySelector('img')) ed.replaceChild(frag, blk);
      else ed.insertBefore(frag, blk.nextSibling);
      sync();
    }

    /* Tablo */
    function tableInsert(r, c) {
      var html = '<table><tbody>';
      for (var i = 0; i < r; i++) {
        html += '<tr>';
        for (var j = 0; j < c; j++) html += (i === 0 ? '<th>' : '<td>') + '<br>' + (i === 0 ? '</th>' : '</td>');
        html += '</tr>';
      }
      insertBlock(html + '</tbody></table><p><br></p>');
    }
    function cellCtx() {
      var td = closest(selNode(), 'td,th');
      if (!td) { say('Önce tablonun içindeki bir hücreye tıklayın.'); return null; }
      var table = td.closest('table');
      if (!table) return null;
      return { td: td, tr: td.parentNode, table: table };
    }
    function tableOp(op) {
      var c = cellCtx(); if (!c) return;
      var idx = Array.prototype.indexOf.call(c.tr.children, c.td);
      if (op === 'addrow') {
        var nr = c.tr.cloneNode(true);
        Array.prototype.forEach.call(nr.children, function (cell) {
          var nc = document.createElement('td'); nc.innerHTML = '<br>'; nr.replaceChild(nc, cell);
        });
        c.tr.parentNode.insertBefore(nr, c.tr.nextSibling);
      } else if (op === 'addcol') {
        Array.prototype.forEach.call(c.table.rows, function (row, ri) {
          var nc = document.createElement(row.children[idx] && row.children[idx].tagName === 'TH' ? 'th' : 'td');
          nc.innerHTML = '<br>'; row.insertBefore(nc, row.children[idx + 1] || null);
        });
      } else if (op === 'delrow') {
        c.tr.remove(); if (!c.table.rows.length) c.table.remove();
      } else if (op === 'delcol') {
        Array.prototype.forEach.call(c.table.rows, function (row) { if (row.children[idx]) row.children[idx].remove(); });
        if (!c.table.querySelector('td,th')) c.table.remove();
      } else if (op === 'del') {
        c.table.remove();
      }
      ensureParagraph(); sync();
    }

    /* Bağlantı / görsel */
    function addLink() {
      restore();
      var s = window.getSelection();
      var url = window.prompt('Bağlantı adresi (örn. karakter-detay.html?id=zeandor veya https://…):', '');
      if (!url) return;
      url = url.trim();
      if (s.isCollapsed) {
        var label = window.prompt('Bağlantı metni:', 'bağlantı');
        if (label === null) return;
        exec('insertHTML', '<a href="' + esc(url) + '">' + esc(label || url) + '</a>');
      } else exec('createLink', url);
    }
    function insertImg(path, alt) {
      exec('insertHTML', '<img src="' + esc(path) + '" alt="' + esc(alt || '') + '">');
    }
    function addImage() {
      restore();
      var url = window.prompt('Görsel yolu (örn. assets/images/characters/zeandor.webp):', '');
      if (!url) return;
      var alt = window.prompt('Görsel açıklaması (boş bırakılabilir):', '');
      insertImg(url.trim(), alt === null ? '' : alt);
    }
    function openGallery() {
      if (!window.AdminMedia || !window.AdminMedia.openPicker) return say('Görsel galerisi bu ekranda kullanılamıyor.');
      window.AdminMedia.openPicker({ current: '', folder: 'characters', onSelect: function (path) { if (path) insertImg(path, ''); } });
    }

    /* Kaynak kodu */
    function pretty(h) {
      return h.replace(/(<\/(p|div|h[1-4]|ul|ol|li|blockquote|table|tr|thead|tbody)>|<hr>|<br>)/g, '$1\n').trim();
    }
    function toggleSource(force) {
      var on = (force === undefined) ? !st.src : !!force;
      if (on === st.src) return;
      var ed = cur();
      if (on) {
        src.value = pretty(SW.sanitize(editorHTML(ed)));
        ed.style.display = 'none'; src.style.display = 'block';
        host.classList.add('rte-source');
      } else {
        ed.innerHTML = SW.sanitize(src.value) || '<p><br></p>';
        src.style.display = 'none'; ed.style.display = '';
        host.classList.remove('rte-source');
      }
      st.src = on; sync();
    }

    /* Tam ekran (çekmece transform'u fixed'i kapsadığı için gövdeye taşınır) */
    var holder = null;
    function toggleFull(force) {
      var on = (force === undefined) ? !host.classList.contains('rte-full') : !!force;
      if (on === host.classList.contains('rte-full')) return;
      if (on) {
        holder = document.createComment('rte-holder');
        host.parentNode.insertBefore(holder, host);
        document.body.appendChild(host);
        host.classList.add('rte-full'); document.body.classList.add('rte-fs');
      } else {
        host.classList.remove('rte-full'); document.body.classList.remove('rte-fs');
        if (holder && holder.parentNode) { holder.parentNode.insertBefore(host, holder); holder.remove(); }
        holder = null;
      }
      var fb = tb.querySelector('[data-cmd="full"]'); if (fb) fb.classList.toggle('on', on);
    }

    function switchLang(l) {
      if (st.src) toggleSource(false);
      st.lang = l; st.last = null;
      eds.tr.style.display = l === 'tr' ? '' : 'none';
      eds.en.style.display = l === 'en' ? '' : 'none';
      updateStat(); updateTabs();
    }

    function closeMenus() { host.querySelectorAll('.rte-dd.open').forEach(function (d) { d.classList.remove('open'); }); }

    function run(cmd, el) {
      switch (cmd) {
        case 'undo': case 'redo': exec(cmd); break;
        case 'bold': exec('bold'); break;
        case 'italic': exec('italic'); break;
        case 'underline': exec('underline'); break;
        case 'strike': exec('strikeThrough'); break;
        case 'clear': exec('removeFormat'); break;
        case 'ul': exec('insertUnorderedList'); break;
        case 'ol': exec('insertOrderedList'); break;
        case 'left': exec('justifyLeft'); break;
        case 'center': exec('justifyCenter'); break;
        case 'right': exec('justifyRight'); break;
        case 'justify': exec('justifyFull'); break;
        case 'hr': exec('insertHorizontalRule'); break;
        case 'quote': toggleQuote(); break;
        case 'spoiler': toggleSpoiler(); break;
        case 'bubble': toggleBubble(); break;
        case 'link': addLink(); break;
        case 'image': addImage(); break;
        case 'gallery': openGallery(); break;
        case 'code': toggleSource(); break;
        case 'full': toggleFull(); break;
        case 'color-toggle': case 'table-toggle':
          var dd = el.closest('.rte-dd'), was = dd.classList.contains('open');
          closeMenus(); if (!was) dd.classList.add('open'); return;
        case 'color':
          var c = el.getAttribute('data-color');
          exec('foreColor', c); tb.querySelector('.rte-bar').style.background = c; break;
        case 'color-reset': resetColor(); break;
        case 'table-insert': tableInsert(+el.getAttribute('data-r'), +el.getAttribute('data-c')); break;
        case 'table-addrow': tableOp('addrow'); break;
        case 'table-addcol': tableOp('addcol'); break;
        case 'table-delrow': tableOp('delrow'); break;
        case 'table-delcol': tableOp('delcol'); break;
        case 'table-del': tableOp('del'); break;
      }
      closeMenus();
    }

    /* Olaylar */
    tb.addEventListener('mousedown', function (e) {
      if (e.target.closest('select,input,label')) return;
      e.preventDefault();                       /* seçimi koru */
    });
    tb.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cmd]');
      if (b && !b.disabled) run(b.getAttribute('data-cmd'), b);
    });
    tb.addEventListener('change', function (e) {
      var t = e.target, kind = t.getAttribute('data-sel');
      if (!kind) return;
      var v = t.value;
      if (kind === 'colorpick') {
        exec('foreColor', v); tb.querySelector('.rte-bar').style.background = v; closeMenus(); return;
      }
      if (!v) return;
      if (kind === 'block') exec('formatBlock', '<' + v + '>');
      else if (kind === 'size') applySize(v);
      else if (kind === 'font') exec('fontName', v);
      t.value = '';
    });
    host.querySelectorAll('.rte-tab').forEach(function (b) {
      b.addEventListener('click', function () { switchLang(b.getAttribute('data-lang')); });
    });

    ['tr', 'en'].forEach(function (l) {
      var ed = eds[l];
      ed.addEventListener('input', function () { sync(l); });
      ed.addEventListener('blur', function () { sync(l); });
      ed.addEventListener('paste', function (e) {
        var cd = e.clipboardData; if (!cd) return;
        e.preventDefault();
        var html = cd.getData('text/html'), txt = cd.getData('text/plain');
        if (html) exec('insertHTML', SW.sanitize(html.replace(/<!--[\s\S]*?-->/g, '')));
        else exec('insertHTML', txt.split(/\n{2,}/).map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join(''));
      });
    });
    src.addEventListener('input', function () { tas[st.lang].value = SW.sanitize(src.value); updateTabs(); });

    var inst = { host: host, st: st, cur: cur, updateStates: updateStates, toggleFull: toggleFull };
    instances = instances.filter(function (i) { return i.host.isConnected; });
    instances.push(inst);
    host.__rte = inst;
    updateStat(); updateTabs();
  }

  function mountAll(root) {
    bindGlobal();
    (root || document).querySelectorAll('.rte[data-rte]').forEach(mount);
  }

  window.RTE = { mountAll: mountAll };
})();
