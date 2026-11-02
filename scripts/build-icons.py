#!/usr/bin/env python3
"""assets/js/icons.js üreticisi.
Emoji -> tek stil (çizgi) SVG eşlemesini Lucide (ISC lisansı, https://lucide.dev) setinden üretir.
Kullanım:  npm i lucide-static@0.468.0   (ayrı bir klasörde)
           python3 scripts/build-icons.py <lucide-static/icons klasörü>
Yeni emoji eklemek için MAP'e (emoji -> lucide ikon adı) satırı ekleyip yeniden çalıştır."""
import re, sys, json, os
D = sys.argv[1].rstrip('/') + '/'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'js', 'icons.js')
MAP = {
'📜':'scroll','⚔️':'swords','👑':'crown','⚖️':'scale','🔮':'wand-sparkles','📖':'book-open','🔥':'flame',
'✉️':'mail','📧':'mail','🛡️':'shield','🔖':'bookmark','👤':'user','✒️':'pen-tool','🖋️':'pen-line','🪶':'feather',
'🏰':'castle','🗺️':'map','🏛️':'landmark','👁️':'eye','👀':'eye','📊':'chart-column','⚡':'zap',
'📋':'clipboard-list','🔗':'link','📌':'pin','⚓':'anchor','🗑':'trash-2','🩸':'droplet','😄':'smile','😅':'smile','📍':'map-pin',
'🌐':'globe','🎙️':'mic','🎨':'palette','📚':'library','📶':'signal','❤':'heart','⚜️':'sparkle','🌊':'waves','🏔️':'mountain-snow',
'🔒':'lock','🎲':'dice-5','🗡️':'sword','🏆':'trophy','📷':'camera','📸':'camera','🎖️':'medal','📁':'folder','💧':'droplets',
'🧭':'compass','🧠':'brain','🔓':'lock-open','🚫':'ban','⚠️':'triangle-alert','📥':'download','💬':'message-square','🎯':'target',
'🗳️':'vote','🐎':'footprints','🚶':'footprints','🖼️':'image','🍲':'soup','🗣️':'message-circle','🏷':'tag','🏞️':'mountain',
'🌲':'trees','🕯️':'flame-kindling','🔤':'type','🌳':'tree-deciduous','🔄':'refresh-cw','📤':'upload','✈️':'plane','🎼':'music',
'⏮':'skip-back','⏭':'skip-forward','⏹':'square','📐':'ruler','🗂️':'folders','🌿':'leaf','☘️':'clover','⛵':'sailboat','🦹':'drama',
'⭐':'star','🌙':'moon','✂️':'scissors','🕒':'clock','📱':'smartphone','💡':'lightbulb','⚙':'settings','✨':'sparkles','🏙️':'building-2',
'🔍':'search','✅':'circle-check','❌':'circle-x','📝':'file-pen-line','🔔':'bell','⏳':'hourglass','✍️':'signature','📑':'bookmark-check',
'💾':'save','🎭':'drama','🌍':'globe','💀':'skull','☠️':'skull','👥':'users','🐺':'paw-print','🐾':'paw-print',
}
CUSTOM = {'🟠': '<circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/>'}
def norm(k): return k.replace('\ufe0f','')
icons = {}
for k, name in MAP.items():
    svg = open(D + name + '.svg', encoding='utf-8').read()
    inner = re.search(r'<svg[^>]*>(.*)</svg>', svg, re.S).group(1)
    inner = re.sub(r'\s+', ' ', re.sub(r'<!--.*?-->', '', inner)).strip()
    icons[norm(k)] = inner
for k, v in CUSTOM.items(): icons[norm(k)] = v
keys = sorted(icons, key=len, reverse=True)
js = """/* ═══════════════════════════════════════════════════════════════
   STALLHART WIKI — Tek Stil İkon Seti  (assets/js/icons.js)
   ---------------------------------------------------------------
   Sayfadaki pictorial emojileri (📜 ⚔️ 👑 …) tek çizgi stilli SVG'ye çevirir;
   böylece görünüm cihaza/işletim sistemine göre değişmez ve ciddi fantezi
   tonu bozulmaz. İkonlar Lucide'dendir (ISC lisansı).

   · Dinamik içerik (JSON'dan basılan metinler, dil değişimi) MutationObserver
     ile otomatik yakalanır — sayfa kodunda değişiklik gerekmez.
   · Özgün emoji, görsel olarak gizli bir <span> içinde kalır → textContent,
     kopyala-yapıştır ve ekran okuyucu davranışı bozulmaz.
   · Kapatmak için bir kapsayıcıya data-no-icons ekle.
   · Yeni emoji için: scripts/build-icons.py içindeki MAP'e satır ekle,
     betiği çalıştır (bu dosya üretilir, elle düzenleme).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var ICONS = %s;
  var KEYS = %s;
  var VS = String.fromCharCode(65039);   /* U+FE0F emoji varyasyon seçici */
  var RX = new RegExp('(' + KEYS.join('|') + ')' + VS + '?', 'g');
  var RX_TEST = new RegExp(RX.source);
  var SKIP = 'script,style,textarea,option,select,title,noscript,code,pre,[contenteditable],[contenteditable="true"],[data-no-icons],.sw-ic';
  var NS = 'http://www.w3.org/2000/svg';

  function make(base, original) {
    var wrap = document.createElement('span');
    wrap.className = 'sw-ic';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.innerHTML = ICONS[base];
    var t = document.createElement('span');
    t.className = 'sw-ic-t';
    t.textContent = original;
    wrap.appendChild(svg);
    wrap.appendChild(t);
    return wrap;
  }

  function convert(node) {
    var text = node.nodeValue, frag = document.createDocumentFragment(), last = 0, m;
    RX.lastIndex = 0;
    while ((m = RX.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      frag.appendChild(make(m[1], m[0]));
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    if (node.parentNode) node.parentNode.replaceChild(frag, node);
  }

  function eligible(n) {
    if (!RX_TEST.test(n.nodeValue)) return false;
    var p = n.parentElement;
    return !!p && !p.closest(SKIP);
  }

  function scan(root) {
    if (!root) return;
    if (root.nodeType === 3) { if (eligible(root)) convert(root); return; }
    if (root.nodeType !== 1 || root.closest(SKIP)) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [], n;
    while ((n = w.nextNode())) if (eligible(n)) list.push(n);
    list.forEach(convert);
  }

  var queue = [], scheduled = false, mo;
  function flush() {
    scheduled = false;
    var items = queue; queue = [];
    if (mo) mo.disconnect();
    try { items.forEach(function (n) { if (n.isConnected) scan(n); }); } finally { observe(); }
  }
  function enqueue(n) {
    queue.push(n);
    if (!scheduled) { scheduled = true; (window.requestAnimationFrame || setTimeout)(flush); }
  }
  function observe() {
    if (!mo) {
      mo = new MutationObserver(function (recs) {
        recs.forEach(function (r) {
          if (r.type === 'characterData') enqueue(r.target);
          else r.addedNodes.forEach(function (n) { if (n.nodeType === 1 || n.nodeType === 3) enqueue(n); });
        });
      });
    }
    mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  }

  function start() { scan(document.body); observe(); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  window.SWIcons = { scan: scan, has: function (e) { return !!ICONS[String(e).split(VS).join('')]; } };
})();
""" % (json.dumps(icons, ensure_ascii=False), json.dumps(keys, ensure_ascii=False))
open(OUT, 'w', encoding='utf-8').write(js)
print('yazıldı:', os.path.normpath(OUT), len(js), 'bayt,', len(icons), 'ikon')
