/* ═══════════════════════════════════════════════════════════
   SWRich — Zengin metin (HTML) ortak yardımcıları
   ---------------------------------------------------------------
   · Karakter biyografisi / sözü artık HTML olarak saklanabilir.
     Bu modül hem yönetim panelinde (admin-rte.js) hem de sitede
     (wiki.js içine gömülü kopya) KULLANILIR.
   · Güvenlik: yalnızca beyaz listedeki etiket / öznitelik / stil
     geçer; script, olay işleyicileri (onclick…), javascript: bağlantıları
     ve şüpheli stil değerleri atılır.
   · Eski düz metin / Markdown içerik bozulmaz: isHtml() false ise
     site eski çizim yolunu kullanır.

   NOT: wiki.js içindeki kopya bu dosyadan üretilir
        (SWRICH:BEGIN ile SWRICH:END işaretleri arası). Değişiklik
        yaparsanız iki yeri de güncelleyin.
   ═══════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var TAGS = { P:1, BR:1, STRONG:1, B:1, EM:1, I:1, U:1, S:1, STRIKE:1, DEL:1, SPAN:1, DIV:1,
    H1:1, H2:1, H3:1, H4:1, UL:1, OL:1, LI:1, BLOCKQUOTE:1, HR:1, TABLE:1, THEAD:1, TBODY:1,
    TR:1, TH:1, TD:1, A:1, IMG:1, SUB:1, SUP:1, FIGURE:1, FIGCAPTION:1, CITE:1 };
  var DROP = { SCRIPT:1, STYLE:1, IFRAME:1, OBJECT:1, EMBED:1, SVG:1, MATH:1, FORM:1, INPUT:1,
    BUTTON:1, TEXTAREA:1, SELECT:1, LINK:1, META:1, TITLE:1, NOSCRIPT:1, TEMPLATE:1, AUDIO:1,
    VIDEO:1, CANVAS:1, HEAD:1 };

  var COLOR = /^(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d.]+\s*)?\)|[a-z]{3,20})$/i;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function isHtml(s) {
    return /^\s*<(p|h[1-6]|div|ul|ol|blockquote|table|hr|figure|span|br|img)[\s>\/]/i.test(String(s || ''));
  }

  function cleanStyle(str) {
    var out = [];
    String(str || '').split(';').forEach(function (d) {
      var i = d.indexOf(':');
      if (i < 0) return;
      var p = d.slice(0, i).trim().toLowerCase();
      var v = d.slice(i + 1).trim();
      if (!v || /url\(|expression|javascript|[<>\\@]|\/\*/i.test(v)) return;
      if (p === 'color' || p === 'background-color') {
        if (COLOR.test(v)) out.push(p + ':' + v);
      } else if (p === 'font-size') {
        var m = v.match(/^(\d+(?:\.\d+)?)(px|pt|em|rem|%)$/i);
        if (m) {
          var n = parseFloat(m[1]), u = m[2].toLowerCase();
          var ok = (u === 'px' && n >= 8 && n <= 96) || (u === 'pt' && n >= 6 && n <= 72) ||
                   ((u === 'em' || u === 'rem') && n >= 0.5 && n <= 5) || (u === '%' && n >= 50 && n <= 400);
          if (ok) out.push('font-size:' + m[1] + u);
        }
      } else if (p === 'font-family') {
        if (/^[\w\s'",\-]+$/.test(v)) out.push('font-family:' + v);
      } else if (p === 'text-align') {
        if (/^(left|right|center|justify)$/i.test(v)) out.push('text-align:' + v.toLowerCase());
      } else if (p === 'font-weight') {
        if (/^(normal|bold|[1-9]00)$/i.test(v)) out.push('font-weight:' + v.toLowerCase());
      } else if (p === 'font-style') {
        if (/^(normal|italic)$/i.test(v)) out.push('font-style:' + v.toLowerCase());
      } else if (p === 'text-decoration' || p === 'text-decoration-line') {
        if (/^(none|underline|line-through|underline line-through)$/i.test(v)) out.push('text-decoration:' + v.toLowerCase());
      }
    });
    return out.join(';');
  }

  function safeUrl(u, isImg) {
    u = String(u || '').trim();
    if (!u || u.slice(0, 2) === '//') return '';
    if (/^(https?:|mailto:)/i.test(u)) return (isImg && /^mailto:/i.test(u)) ? '' : u;
    if (isImg && /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+\/=]+$/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.\-]*:/i.test(u)) return '';   /* javascript:, data: vb. */
    return u;                                          /* göreli yol / #bağ */
  }

  function cleanClass(c) {
    return String(c || '').split(/\s+/).filter(function (t) { return /^(sw|art)-[\w-]+$/.test(t); }).join(' ');
  }

  function clean(node, doc) {
    var out = doc.createDocumentFragment();
    Array.prototype.forEach.call(node.childNodes, function (ch) {
      if (ch.nodeType === 3) { out.appendChild(doc.createTextNode(ch.nodeValue)); return; }
      if (ch.nodeType !== 1) return;
      var tag = ch.tagName;
      if (DROP[tag]) return;
      if (tag === 'FONT') {                     /* eski execCommand çıktısı */
        var sp = doc.createElement('span'), st = [];
        if (ch.getAttribute('color')) st.push('color:' + ch.getAttribute('color'));
        if (ch.getAttribute('face')) st.push('font-family:' + ch.getAttribute('face'));
        var cs = cleanStyle(st.join(';') + ';' + (ch.getAttribute('style') || ''));
        if (cs) sp.setAttribute('style', cs);
        sp.appendChild(clean(ch, doc));
        out.appendChild(sp);
        return;
      }
      if (!TAGS[tag]) { out.appendChild(clean(ch, doc)); return; }   /* etiketi aç, içeriği koru */
      var el = doc.createElement(tag.toLowerCase());
      var cls = cleanClass(ch.getAttribute('class'));
      if (cls) el.setAttribute('class', cls);
      var sty = cleanStyle(ch.getAttribute('style'));
      if (sty) el.setAttribute('style', sty);
      if (tag === 'A') {
        var href = safeUrl(ch.getAttribute('href'), false);
        if (!href) { out.appendChild(clean(ch, doc)); return; }
        el.setAttribute('href', href);
        if (/^https?:/i.test(href)) { el.setAttribute('target', '_blank'); }
        el.setAttribute('rel', 'noopener noreferrer nofollow');
      } else if (tag === 'IMG') {
        var src = safeUrl(ch.getAttribute('src'), true);
        if (!src) return;
        el.setAttribute('src', src);
        el.setAttribute('alt', (ch.getAttribute('alt') || '').slice(0, 200));
        el.setAttribute('loading', 'lazy');
        out.appendChild(el);
        return;
      } else if (tag === 'TD' || tag === 'TH') {
        ['colspan', 'rowspan'].forEach(function (a) {
          var n = parseInt(ch.getAttribute(a), 10);
          if (n > 1 && n <= 20) el.setAttribute(a, String(n));
        });
      }
      if (tag !== 'BR' && tag !== 'HR') el.appendChild(clean(ch, doc));
      out.appendChild(el);
    });
    return out;
  }

  function sanitize(html) {
    html = String(html == null ? '' : html);
    if (!html) return '';
    var doc = new DOMParser().parseFromString('<!doctype html><body>' + html, 'text/html');
    var d = doc.createElement('div');
    d.appendChild(clean(doc.body, doc));
    return d.innerHTML;
  }

  /* Arama / özet / meta açıklaması için düz metin */
  function toPlain(s) {
    s = String(s == null ? '' : s);
    if (!isHtml(s)) return s;
    var t = s.replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>|<br\s*\/?>/gi, ' ');
    var doc = new DOMParser().parseFromString('<!doctype html><body>' + t, 'text/html');
    doc.querySelectorAll('script,style').forEach(function (n) { n.remove(); });
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  }

  /* Tek satırlık kullanım (alıntı vb.): dış <p> sarmalarını kaldır */
  function inline(s) {
    s = String(s == null ? '' : s);
    if (!isHtml(s)) return esc(s);
    return sanitize(s).replace(/<\/p>\s*<p[^>]*>/gi, '<br>').replace(/^\s*<p[^>]*>/i, '').replace(/<\/p>\s*$/i, '');
  }

  function render(s) {
    return '<div class="sw-rich">' + sanitize(s) + '</div>';
  }

  /* Sayfa paragrafı: HTML ise zengin blok, değilse eski <p class=cls>düz metin</p>. Boşsa ''. */
  function para(v, cls) {
    v = String(v == null ? '' : v);
    if (!v.trim()) return '';
    if (isHtml(v)) return render(v);
    return '<p class="' + (cls || '') + '">' + esc(v) + '</p>';
  }

  /* Eski Markdown / düz metin → HTML (yalnızca yönetim panelinde, düzenleme için) */
  function mdInline(t) {
    return t
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img alt="$1" src="$2">')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<u>$1</u>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/~~([^~]+)~~/g, '<s>$1</s>');
  }
  function mdToHtml(md) {
    md = String(md || '').replace(/\r\n?/g, '\n').replace(/\\([~*\[\]\\>#!-])/g, '$1');
    var lines = md.split('\n'), out = [], para = [], list = null, quote = [];
    function flushPara() { if (para.length) { out.push('<p>' + para.map(function (l) { return mdInline(esc(l)); }).join('<br>') + '</p>'); para = []; } }
    function flushList() { if (list) { out.push('<' + list.t + '>' + list.items.map(function (i) { return '<li>' + mdInline(esc(i)) + '</li>'; }).join('') + '</' + list.t + '>'); list = null; } }
    function flushQuote() { if (quote.length) { out.push('<blockquote><p>' + quote.map(function (l) { return mdInline(esc(l)); }).join('<br>') + '</p></blockquote>'); quote = []; } }
    function flushAll() { flushPara(); flushList(); flushQuote(); }
    lines.forEach(function (ln) {
      var m;
      if (!ln.trim()) { flushAll(); return; }
      if ((m = ln.match(/^(#{1,4})\s+(.*)$/))) { flushAll(); out.push('<h' + m[1].length + '>' + mdInline(esc(m[2])) + '</h' + m[1].length + '>'); return; }
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(ln)) { flushAll(); out.push('<hr>'); return; }
      if ((m = ln.match(/^>\s?(.*)$/))) { flushPara(); flushList(); if (!/^\[!\w+\]/.test(m[1])) quote.push(m[1]); return; }
      if ((m = ln.match(/^\s*[-*•]\s+(.*)$/))) { flushPara(); flushQuote(); if (!list || list.t !== 'ul') { flushList(); list = { t: 'ul', items: [] }; } list.items.push(m[1]); return; }
      if ((m = ln.match(/^\s*\d+[.)]\s+(.*)$/))) { flushPara(); flushQuote(); if (!list || list.t !== 'ol') { flushList(); list = { t: 'ol', items: [] }; } list.items.push(m[1]); return; }
      flushList(); flushQuote(); para.push(ln);
    });
    flushAll();
    return out.join('');
  }

  /* Spoiler: tıklayınca aç/kapat (editör alanı içinde devre dışı) */
  if (typeof document !== 'undefined') {
    document.addEventListener('click', function (e) {
      var t = e.target, sp = t && t.closest ? t.closest('.sw-spoiler') : null;
      if (sp && !sp.closest('[contenteditable="true"]')) sp.classList.toggle('on');
    });
  }

  root.SWRich = { isHtml: isHtml, sanitize: sanitize, toPlain: toPlain, inline: inline, render: render, para: para, mdToHtml: mdToHtml, esc: esc };
})(typeof window !== 'undefined' ? window : this);
