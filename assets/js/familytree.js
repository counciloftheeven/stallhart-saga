/* ═══════════════════════════════════════════════════════════════
   familytree.js — Soy ağacı motoru (soy-agaci.html + admin paneli ortak)

   Veri: data/familytree.json  →  { version, trees: [ tree, … ] }

   tree = {
     id, order, name{tr,en}, houseId, theme: 'imperial'|'selya'|'custom', accent,
     edgeMode: 'auto' | 'manual', canvas{w,h}, caption{tr,en}|null,
     decor: { before:[…], after:[…] },      // yalnızca 'manual' modda: elle çizilmiş çizgi/not/gösterge
     people: [ person, … ]
   }
   person = {
     id, characterId, kind, name{}, box{ name{}, sub{}, note{} },
     family{}, title{}, ks, status, epi{}, desc{},
     fatherId, motherId, spouseIds[], childrenIds[], generation,
     legitimacy: '' | 'legit' | 'illegit',
     dx, dy,                 // 'auto' modda elle düzeltme (otomatik konuma göre ofset)
     x, y, w, h, ty[]        // 'manual' modda mutlak konum ve metin taban çizgileri
     nameFill, nameSize, links[{to,label{}}]
   }

   İki çizim modu:
   · manual — mevcut, elle çizilmiş ağaçlar birebir korunur (decor + mutlak konum)
   · auto   — kutular kuşak ve akrabalık bağlarına göre yerleştirilir, çizgiler
              ilişkilerden üretilir; kişi başına dx/dy ile elle düzeltilebilir.
   ═══════════════════════════════════════════════════════════════ */
(function () {
'use strict';

const NODE_W = 156, NODE_H = 58, SPOUSE_GAP = 12, SIB_GAP = 28, ROOT_GAP = 64, ROW_H = 128, PAD = 40;

const KINDS = [
  ['main',    { tr: 'Ana figür',            en: 'Main figure' }],
  ['member',  { tr: 'Hane üyesi',           en: 'House member' }],
  ['alive',   { tr: 'Hayatta',              en: 'Alive' }],
  ['dec',     { tr: 'Hayatını kaybetti',    en: 'Deceased' }],
  ['hist',    { tr: 'Tarihsel',             en: 'Historical' }],
  ['star',    { tr: 'Ana karakter (altın)', en: 'Main character (gold)' }],
  ['spouse',  { tr: 'Eş',                   en: 'Spouse' }],
  ['related', { tr: 'İlişkili figür',       en: 'Associated figure' }]
];
const LEGEND_LABELS = {
  main:    { tr: 'Ana Figür',        en: 'Main Figure' },
  member:  { tr: 'Hane Üyesi',       en: 'House Member' },
  alive:   { tr: 'Hayatta',          en: 'Alive' },
  dec:     { tr: 'Hayatını Kaybetti', en: 'Deceased' },
  hist:    { tr: 'Tarihsel',         en: 'Historical' },
  star:    { tr: 'Ana Karakter',     en: 'Main Character' },
  spouse:  { tr: 'Eş',               en: 'Spouse' },
  related: { tr: 'İlişkili Figür',   en: 'Associated Figure' },
  legit:   { tr: 'Meşru Varis',      en: 'Legitimate Heir' },
  illegit: { tr: 'Gayrimeşru / Sürgün', en: 'Illegitimate / Exiled' }
};
const LEGIT_LABELS = {
  '':      { tr: 'Belirtilmemiş', en: 'Unspecified' },
  legit:   LEGEND_LABELS.legit,
  illegit: LEGEND_LABELS.illegit
};
const LEGIT_GOLD = '#E8B84B', LEGIT_BLOOD = '#A83232';

/* ── Yardımcılar ─────────────────────────────────────────── */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function tx(lang, o) {
  if (o == null) return '';
  if (typeof o === 'string') return o;
  return o[lang] || o.tr || o.en || '';
}
const isNum = v => typeof v === 'number' && isFinite(v);
const HEX = /^#[0-9a-f]{3,8}$/i;

/* ── Tema ────────────────────────────────────────────────── */
const PRESETS = {
  imperial: { fill: 'rgba(20,14,6,.85)', stroke: 'rgba(122,92,24,.75)', mfill: 'rgba(30,20,4,.9)', mstroke: '#C4962A',
              name: '#F0E6C8', mname: '#E8B84B', line: '#3D2A14', dash: 'rgba(61,42,20,.65)', msym: '#7A5C18', anno: '#5C3F1E' },
  selya:    { fill: 'rgba(18,10,28,.85)', stroke: 'rgba(122,58,154,.6)', mfill: 'rgba(28,15,40,.9)', mstroke: 'rgba(175,110,210,.8)',
              name: '#D4C0F0', mname: '#C09AE0', line: 'rgba(92,58,122,.7)', dash: 'rgba(92,58,122,.45)', msym: '#7A3A9A', anno: '#6A3A8A' }
};
function hex2rgb(h) {
  h = String(h || '').replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return isNaN(n) ? [196, 150, 42] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const mix = (a, b, t) => a.map((v, i) => Math.round(v * (1 - t) + b[i] * t));
const rgba = (c, a) => 'rgba(' + c.join(',') + ',' + a + ')';
const toHex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');

function themeVars(tree) {
  let t = PRESETS[tree.theme];
  if (!t) {
    const rgb = hex2rgb(tree.accent), base = [13, 8, 4], light = [240, 230, 200];
    t = {
      fill: rgba(mix(base, rgb, .14), .86), stroke: rgba(rgb, .62),
      mfill: rgba(mix(base, rgb, .24), .92), mstroke: rgba(mix(rgb, light, .15), .9),
      name: toHex(mix(rgb, light, .72)), mname: toHex(mix(rgb, light, .42)),
      line: rgba(mix(rgb, base, .3), .8), dash: rgba(mix(rgb, base, .3), .5),
      msym: toHex(rgb), anno: toHex(mix(rgb, base, .25))
    };
  }
  return '--t-fill:' + t.fill + ';--t-stroke:' + t.stroke + ';--t-mfill:' + t.mfill + ';--t-mstroke:' + t.mstroke +
    ';--t-name:' + t.name + ';--t-mname:' + t.mname + ';--t-line:' + t.line + ';--t-dash:' + t.dash +
    ';--t-msym:' + t.msym + ';--t-anno:' + t.anno + ';';
}

/* ── Normalleştirme ──────────────────────────────────────── */
function normalize(tree) {
  tree.people = Array.isArray(tree.people) ? tree.people : [];
  tree.decor = tree.decor || {};
  tree.decor.before = tree.decor.before || [];
  tree.decor.after = tree.decor.after || [];
  tree.canvas = tree.canvas || { w: 0, h: 0 };
  tree.edgeMode = tree.edgeMode === 'manual' ? 'manual' : 'auto';
  tree.theme = tree.theme || 'custom';
  tree.accent = HEX.test(tree.accent || '') ? tree.accent : '#C4962A';
  tree.name = tree.name || { tr: tree.id || '', en: '' };
  tree.people.forEach(p => {
    p.box = p.box || {};
    ['name', 'sub', 'note'].forEach(k => { p.box[k] = p.box[k] || { tr: '', en: '' }; });
    p.kind = p.kind || 'member';
    p.spouseIds = Array.isArray(p.spouseIds) ? p.spouseIds : [];
    p.childrenIds = Array.isArray(p.childrenIds) ? p.childrenIds : [];
    p.links = Array.isArray(p.links) ? p.links : [];
    p.legitimacy = p.legitimacy === 'legit' || p.legitimacy === 'illegit' ? p.legitimacy : '';
    p.dx = isNum(p.dx) ? p.dx : 0;
    p.dy = isNum(p.dy) ? p.dy : 0;
  });
  return tree;
}

/* ── İlişki grafiği (baba/anne + çocuk listeleri birleşimi) ─── */
function graph(tree) {
  const people = tree.people, byId = {}, idx = {};
  people.forEach((p, i) => { byId[p.id] = p; idx[p.id] = i; });
  const parents = {}, children = {}, spouses = {};
  people.forEach(p => { parents[p.id] = []; children[p.id] = []; spouses[p.id] = []; });

  const isAncestor = (anc, of) => {
    const stack = [of], seen = new Set();
    while (stack.length) {
      const x = stack.pop();
      if (seen.has(x)) continue;
      seen.add(x);
      for (const q of parents[x]) { if (q === anc) return true; stack.push(q); }
    }
    return false;
  };
  const addPC = (par, ch) => {
    if (!par || !byId[par] || !byId[ch] || par === ch) return;
    if (parents[ch].includes(par)) return;
    if (isAncestor(ch, par)) return;               /* döngüyü engelle */
    parents[ch].push(par); children[par].push(ch);
  };
  people.forEach(p => { addPC(p.fatherId, p.id); addPC(p.motherId, p.id); });
  people.forEach(p => (p.childrenIds || []).forEach(c => addPC(p.id, c)));
  /* Çocuk sırası: ebeveynin childrenIds sırası, kalanlar dizi sırasıyla */
  people.forEach(p => {
    const listed = (p.childrenIds || []).filter(c => children[p.id].includes(c));
    children[p.id] = listed.concat(children[p.id].filter(c => !listed.includes(c)));
  });

  const addSp = (a, b) => {
    if (!byId[a] || !byId[b] || a === b) return;
    if (!spouses[a].includes(b)) spouses[a].push(b);
    if (!spouses[b].includes(a)) spouses[b].push(a);
  };
  people.forEach(p => (p.spouseIds || []).forEach(s => addSp(p.id, s)));
  return { byId, idx, parents, children, spouses };
}

/* ── Otomatik yerleşim ───────────────────────────────────── */
function layoutAuto(tree) {
  const g = graph(tree), { byId, idx, parents, children, spouses } = g;
  const people = tree.people;
  const hasParents = id => parents[id].length > 0;
  const W = p => (isNum(p.w) && p.w > 0 ? p.w : NODE_W);
  const H = p => (isNum(p.h) && p.h > 0 ? p.h : NODE_H);

  /* 1) Evlilikle gelenleri bir çapa kişiye bağla */
  const attachedTo = {}, done = new Set();
  people.forEach(p => {
    if (done.has(p.id) || hasParents(p.id)) return;
    const comp = [], st = [p.id];
    done.add(p.id);
    while (st.length) {
      const x = st.pop(); comp.push(x);
      spouses[x].forEach(s => { if (!done.has(s) && !hasParents(s)) { done.add(s); st.push(s); } });
    }
    if (comp.length === 1) {
      const sp = spouses[p.id].find(s => hasParents(s));
      if (sp) attachedTo[p.id] = sp;
      return;
    }
    comp.sort((a, b) => idx[a] - idx[b]);
    const withKids = comp.filter(id => children[id].length);
    const anchor = (withKids.length ? withKids : comp)[0];
    comp.forEach(id => { if (id !== anchor) attachedTo[id] = anchor; });
  });
  const anchorOf = id => attachedTo[id] || id;

  /* 2) Kümeler (çapa + eşleri) */
  const clusters = {};
  const anchors = people.filter(p => !attachedTo[p.id]).map(p => p.id);
  anchors.forEach(a => {
    const att = spouses[a].filter(s => attachedTo[s] === a);
    let members;
    if (att.length === 0) members = [a];
    else if (att.length === 1) members = [a, att[0]];
    else members = [att[0], a].concat(att.slice(1));
    clusters[a] = { anchor: a, members, kids: [], row: 0, parentCluster: null };
  });

  /* 3) Kuşak (satır) */
  const rowMemo = {};
  const ROW = (a, guard) => {
    if (rowMemo[a] != null) return rowMemo[a];
    guard = guard || new Set();
    if (guard.has(a)) return 0;
    guard.add(a);
    const p = byId[a];
    let r;
    if (isNum(p.generation)) r = p.generation;
    else if (parents[a].length) r = 1 + Math.max.apply(null, parents[a].map(q => ROW(anchorOf(q), guard)));
    else r = 0;
    rowMemo[a] = r;
    return r;
  };
  anchors.forEach(a => { clusters[a].row = ROW(a); });

  /* 4) Küme ağacı */
  const roots = [];
  anchors.forEach(a => {
    const pc = parents[a].length ? anchorOf(parents[a][0]) : null;
    if (pc && pc !== a && clusters[pc]) clusters[a].parentCluster = pc; else roots.push(a);
  });
  anchors.forEach(c => {
    const cl = clusters[c], seen = new Set();
    cl.members.forEach(m => children[m].forEach(ch => {
      if (!seen.has(ch) && clusters[ch] && clusters[ch].parentCluster === c) { seen.add(ch); cl.kids.push(ch); }
    }));
  });

  const clusterW = c => clusters[c].members.reduce((s, m) => s + W(byId[m]), 0) + (clusters[c].members.length - 1) * SPOUSE_GAP;
  const visitedW = new Set(), subMemo = {};
  const subW = c => {
    if (subMemo[c] != null) return subMemo[c];
    if (visitedW.has(c)) return clusterW(c);
    visitedW.add(c);
    const kids = clusters[c].kids;
    const kw = kids.reduce((s, k) => s + subW(k), 0) + Math.max(0, kids.length - 1) * SIB_GAP;
    subMemo[c] = Math.max(clusterW(c), kw);
    return subMemo[c];
  };

  const boxes = {};
  const placed = new Set();
  const place = (c, x0) => {
    if (placed.has(c)) return;
    placed.add(c);
    const cl = clusters[c], span = subW(c), cw = clusterW(c);
    let x = x0 + (span - cw) / 2;
    cl.members.forEach(m => {
      const p = byId[m];
      boxes[m] = { x: x, y: PAD + cl.row * ROW_H, w: W(p), h: H(p) };
      x += W(p) + SPOUSE_GAP;
    });
    const kw = cl.kids.reduce((s, k) => s + subW(k), 0) + Math.max(0, cl.kids.length - 1) * SIB_GAP;
    let kx = x0 + (span - kw) / 2;
    cl.kids.forEach(k => { place(k, kx); kx += subW(k) + SIB_GAP; });
  };
  let cursor = PAD;
  roots.forEach(r => { place(r, cursor); cursor += subW(r) + ROOT_GAP; });
  /* Döngü nedeniyle yerleşmeyen küme kalırsa sona ekle */
  anchors.forEach(a => { if (!placed.has(a)) { place(a, cursor); cursor += subW(a) + ROOT_GAP; } });

  /* Satırları 0'a çek; elle ofsetleri uygula */
  let minRow = Infinity;
  anchors.forEach(a => { minRow = Math.min(minRow, clusters[a].row); });
  if (!isFinite(minRow)) minRow = 0;
  people.forEach(p => {
    const b = boxes[p.id];
    if (!b) return;
    b.y -= minRow * ROW_H;
    b.x += p.dx || 0;
    b.y += p.dy || 0;
  });
  /* Sınırlar: elle sürüklenen kutular kenara taşarsa kutuları kaydırmak yerine
     viewBox başlangıcı (ox, oy) genişletilir — sürükleme sırasında konumlar sabit kalır. */
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  Object.keys(boxes).forEach(id => {
    const b = boxes[id];
    minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w); maxY = Math.max(maxY, b.y + b.h);
  });
  if (!isFinite(minX)) { minX = PAD; minY = PAD; maxX = PAD + NODE_W; maxY = PAD + NODE_H; }
  const ox = Math.min(0, minX - PAD), oy = Math.min(0, minY - PAD);

  /* 5) Çizgiler */
  const edges = [], marriages = [];
  const mid = b => b.y + b.h / 2;

  /* Evlilik: kümede yan yana duranlar */
  const adjacentPairs = new Set();
  anchors.forEach(c => {
    const m = clusters[c].members;
    for (let i = 0; i < m.length - 1; i++) {
      const a = boxes[m[i]], b = boxes[m[i + 1]];
      if (!a || !b) continue;
      adjacentPairs.add(m[i] + '|' + m[i + 1]); adjacentPairs.add(m[i + 1] + '|' + m[i]);
      marriages.push({ x1: a.x + a.w, y1: mid(a), x2: b.x, y2: mid(b) });
    }
  });

  /* Ebeveyn → çocuk */
  const used = { legit: false, illegit: false };
  anchors.forEach(c => {
    const cl = clusters[c];
    const groups = {};       /* anahtar: bırakma noktası */
    cl.kids.forEach(k => {
      const kb = boxes[k]; if (!kb) return;
      const pin = parents[k].filter(q => anchorOf(q) === c);
      const pbs = pin.map(q => boxes[q]).filter(Boolean);
      if (!pbs.length) return;
      let dropX, py;
      if (pbs.length >= 2) {
        const ord = pin.slice().sort((a, b) => boxes[a].x - boxes[b].x);
        const l = boxes[ord[0]], r = boxes[ord[ord.length - 1]];
        dropX = (ord.length === 2 && adjacentPairs.has(ord[0] + '|' + ord[1]))
          ? (l.x + l.w + r.x) / 2
          : (l.x + l.w / 2 + r.x + r.w / 2) / 2;
        py = mid(l);               /* evlilik çizgisinin hizası */
        dropX = Math.round(dropX * 10) / 10;
        groups[dropX] = groups[dropX] || { dropX, y: Math.max(l.y + l.h, r.y + r.h), fromMid: true, midY: py, kids: [] };
      } else {
        const pb = pbs[0];
        dropX = Math.round((pb.x + pb.w / 2) * 10) / 10;
        groups[dropX] = groups[dropX] || { dropX, y: pb.y + pb.h, fromMid: false, kids: [] };
      }
      groups[dropX].kids.push(k);
      /* Kümenin dışındaki diğer ebeveynler: kesikli bağ */
      parents[k].forEach(q => {
        if (anchorOf(q) === c) return;
        const qb = boxes[q]; if (!qb) return;
        edges.push({ kind: 'dash', pts: [[qb.x + qb.w / 2, qb.y + qb.h], [qb.x + qb.w / 2, kb.y - 14], [kb.x + kb.w / 2, kb.y - 14], [kb.x + kb.w / 2, kb.y]] });
      });
    });
    Object.keys(groups).forEach(key => {
      const grp = groups[key];
      const minTop = Math.min.apply(null, grp.kids.map(k => boxes[k].y));
      const busY = Math.max(grp.y + 12, minTop - 30);
      const startY = grp.fromMid ? grp.midY : grp.y;
      const legs = grp.kids.map(k => ({ id: k, cx: boxes[k].x + boxes[k].w / 2, top: boxes[k].y, leg: byId[k].legitimacy || '' }));
      legs.forEach(l => { if (l.leg) used[l.leg] = true; });
      const lset = new Set(legs.map(l => l.leg));
      const trunkLeg = lset.size === 1 ? legs[0].leg : '';
      const drop = grp.dropX;
      if (legs.length === 1 && Math.abs(legs[0].cx - drop) < 0.6) {
        edges.push({ kind: 'child', leg: legs[0].leg, pts: [[drop, startY], [drop, legs[0].top]] });
      } else {
        edges.push({ kind: 'child', leg: trunkLeg, pts: [[drop, startY], [drop, busY]] });
        legs.forEach(l => {
          const pts = Math.abs(l.cx - drop) < 0.6
            ? [[drop, busY], [drop, l.top]]
            : [[drop, busY], [l.cx, busY], [l.cx, l.top]];
          edges.push({ kind: 'child', leg: l.leg, pts });
        });
      }
    });
  });

  /* Yan yana olmayan eşler: kesikli köprü */
  const doneSp = new Set();
  people.forEach(p => spouses[p.id].forEach(s => {
    const key = [p.id, s].sort().join('|');
    if (doneSp.has(key)) return;
    doneSp.add(key);
    if (adjacentPairs.has(p.id + '|' + s)) return;
    const a = boxes[p.id], b = boxes[s]; if (!a || !b) return;
    edges.push({ kind: 'bridge', pts: bridgePts(a, b), diamond: true });
  }));

  /* Serbest bağlar (links) */
  people.forEach(p => (p.links || []).forEach(l => {
    const a = boxes[p.id], b = boxes[l.to]; if (!a || !b) return;
    edges.push({ kind: 'link', pts: bridgePts(a, b), label: l.label });
  }));

  const w = Math.max(maxX + PAD - ox, 320);
  return { mode: 'auto', boxes, edges, marriages, used, ox, oy, w, h: maxY + PAD - oy };
}

function bridgePts(a, b) {
  const sameRow = Math.abs((a.y + a.h / 2) - (b.y + b.h / 2)) < 40;
  if (sameRow) {
    /* yan yana ise düz, uzaksa altından U şeklinde */
    const left = a.x < b.x ? a : b, right = a.x < b.x ? b : a;
    const gap = right.x - (left.x + left.w);
    const my = left.y + left.h / 2;
    if (gap < 260) return [[left.x + left.w, my], [right.x, right.y + right.h / 2]];
    const by = Math.max(left.y + left.h, right.y + right.h) + 16;
    return [[left.x + left.w / 2, left.y + left.h], [left.x + left.w / 2, by], [right.x + right.w / 2, by], [right.x + right.w / 2, right.y + right.h]];
  }
  const top = a.y < b.y ? a : b, bot = a.y < b.y ? b : a;
  return [[top.x + top.w / 2, top.y + top.h], [bot.x + bot.w / 2, bot.y]];
}

/* ── Manuel mod: mutlak konumlar ─────────────────────────── */
function layoutManual(tree) {
  const boxes = {};
  tree.people.forEach(p => {
    boxes[p.id] = { x: p.x || 0, y: p.y || 0, w: p.w || NODE_W, h: p.h || NODE_H };
  });
  return { mode: 'manual', boxes, edges: [], marriages: [], used: {}, ox: 0, oy: 0, w: (tree.canvas && tree.canvas.w) || 1100, h: (tree.canvas && tree.canvas.h) || 680 };
}

function layout(tree) {
  normalize(tree);
  return tree.edgeMode === 'manual' ? layoutManual(tree) : layoutAuto(tree);
}

/* ── SVG üretimi ─────────────────────────────────────────── */
const ALLOWED = { line: 1, polyline: 1, polygon: 1, path: 1, text: 1, rect: 1, g: 1, circle: 1, ellipse: 1 };
function decorSVG(item, lang) {
  if (!item || !ALLOWED[item.tag]) return '';
  const attrs = Object.keys(item.attrs || {})
    .filter(k => /^[a-zA-Z][\w:-]*$/.test(k) && !/^on/i.test(k))
    .map(k => ' ' + k + '="' + esc(item.attrs[k]) + '"').join('');
  const inner = (item.children || []).map(c => decorSVG(c, lang)).join('') + (item.text != null ? esc(tx(lang, item.text)) : '');
  return '<' + item.tag + attrs + '>' + inner + '</' + item.tag + '>';
}

function offsetPts(pts, d) {
  const n = pts.length, seg = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1], len = Math.hypot(dx, dy) || 1;
    seg.push([-dy / len, dx / len]);
  }
  return pts.map((p, i) => {
    let nx = 0, ny = 0;
    if (i > 0) { nx += seg[i - 1][0]; ny += seg[i - 1][1]; }
    if (i < n - 1) { nx += seg[i][0]; ny += seg[i][1]; }
    if (i > 0 && i < n - 1) { /* orthogonal köşe: iki normalin toplamı miter verir */ }
    else { const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; }
    return [p[0] + nx * d, p[1] + ny * d];
  });
}
const ptsStr = pts => pts.map(p => (Math.round(p[0] * 10) / 10) + ',' + (Math.round(p[1] * 10) / 10)).join(' ');

function edgeSVG(e, lang) {
  if (e.kind === 'child') {
    if (e.leg === 'legit') {
      return '<polyline points="' + ptsStr(offsetPts(e.pts, -1.8)) + '" class="fl-legit"/>' +
             '<polyline points="' + ptsStr(offsetPts(e.pts, 1.8)) + '" class="fl-legit"/>';
    }
    if (e.leg === 'illegit') return '<polyline points="' + ptsStr(e.pts) + '" class="fl-illegit"/>';
    return '<polyline points="' + ptsStr(e.pts) + '" class="fl-t"/>';
  }
  if (e.kind === 'dash' || e.kind === 'bridge' || e.kind === 'link') {
    let out = '<polyline points="' + ptsStr(e.pts) + '" class="fl-t-dash"/>';
    const a = e.pts[0], b = e.pts[e.pts.length - 1];
    if (e.diamond) {
      const mx = (a[0] + b[0]) / 2, my = e.pts.length > 2 ? e.pts[1][1] : (a[1] + b[1]) / 2;
      out += '<polygon points="' + (mx - 6) + ',' + my + ' ' + mx + ',' + (my - 5) + ' ' + (mx + 6) + ',' + my + ' ' + mx + ',' + (my + 5) + '" class="msym-t"/>';
    }
    if (e.label) {
      const lt = tx(lang, e.label);
      if (lt) {
        const mx = (a[0] + b[0]) / 2, my = e.pts.length > 2 ? e.pts[1][1] : Math.min(a[1], b[1]) - 6;
        out += '<text x="' + mx + '" y="' + (my - 5) + '" class="anno-t" text-anchor="middle" font-size="8.5">' + esc(lt) + '</text>';
      }
    }
    return out;
  }
  return '';
}

function nodeSVG(p, b, lang, sel) {
  const cx = b.x + b.w / 2;
  const ty = Array.isArray(p.ty) && p.ty.length >= 3 ? p.ty : [Math.round(b.h * .375), Math.round(b.h * .64), b.h - 8];
  const style = (p.nameFill && HEX.test(p.nameFill) ? 'fill:' + p.nameFill + ';' : '') + (isNum(p.nameSize) ? 'font-size:' + p.nameSize + 'px;' : '');
  const nameTxt = tx(lang, p.box.name) || tx(lang, p.name);
  const line = (txt, y, cls, st) => txt ? '<text x="' + cx + '" y="' + (b.y + y) + '" class="' + cls + '"' + (st ? ' style="' + st + '"' : '') + '>' + esc(txt) + '</text>' : '';
  const kind = /^[a-z]+$/.test(p.kind) ? p.kind : 'member';
  return '<g class="fn fn-' + kind + (sel ? ' active' : '') + '" id="fn-' + esc(p.id) + '" data-id="' + esc(p.id) + '">' +
    '<rect x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="1"/>' +
    line(nameTxt, ty[0], 'node-name', style) +
    line(tx(lang, p.box.sub), ty[1], 'node-sub') +
    line(tx(lang, p.box.note), ty[2], 'node-ks') +
    '</g>';
}

function legendSVG(tree, lay, lang) {
  const kinds = [];
  KINDS.forEach(k => { if (tree.people.some(p => p.kind === k[0])) kinds.push(k[0]); });
  if (lay.used.legit) kinds.push('legit');
  if (lay.used.illegit) kinds.push('illegit');
  const y = lay.oy + lay.h - 62;
  let out = '<g transform="translate(' + (lay.ox + PAD / 2) + ',' + y + ')">';
  let x = 0;
  kinds.forEach(k => {
    const label = tx(lang, LEGEND_LABELS[k]);
    if (k === 'legit') out += '<line x1="' + x + '" y1="3" x2="' + (x + 14) + '" y2="3" class="fl-legit"/><line x1="' + x + '" y1="7" x2="' + (x + 14) + '" y2="7" class="fl-legit"/>';
    else if (k === 'illegit') out += '<line x1="' + x + '" y1="5" x2="' + (x + 14) + '" y2="5" class="fl-illegit"/>';
    else out += '<g class="fn-' + k + ' lgk"><rect x="' + x + '" y="0" width="12" height="10"/></g>';
    out += '<text x="' + (x + 18) + '" y="9" class="anno-t">' + esc(label) + '</text>';
    x += 18 + label.length * 5.3 + 22;
  });
  return out + '</g>';
}

function captionOf(tree, lang) {
  const c = tx(lang, tree.caption);
  if (c) return c;
  const n = tx(lang, tree.name).toLocaleUpperCase(lang === 'tr' ? 'tr-TR' : 'en-US');
  return n + (lang === 'tr' ? ' — SOY AĞACI' : ' — FAMILY TREE');
}

/* opts: { lang, selectedId }  →  { svg, w, h, boxes, layout } */
function render(tree, opts) {
  opts = opts || {};
  const lang = opts.lang || 'tr';
  const lay = layout(tree);
  const sel = opts.selectedId;
  let inner = '';
  if (lay.mode === 'manual') {
    inner += tree.decor.before.map(d => decorSVG(d, lang)).join('');
    inner += tree.people.map(p => nodeSVG(p, lay.boxes[p.id], lang, p.id === sel)).join('');
    inner += tree.decor.after.map(d => decorSVG(d, lang)).join('');
  } else {
    const extra = 62;                 /* gösterge + başlık için alt boşluk */
    lay.h += extra;
    inner += '<rect x="' + (lay.ox + 6) + '" y="' + (lay.oy + 6) + '" width="' + (lay.w - 12) + '" height="' + (lay.h - 12) + '" class="ft-frame"/>';
    inner += lay.edges.map(e => edgeSVG(e, lang)).join('');
    lay.marriages.forEach(m => {
      const mx = (m.x1 + m.x2) / 2, my = (m.y1 + m.y2) / 2;
      inner += '<line x1="' + m.x1 + '" y1="' + m.y1 + '" x2="' + m.x2 + '" y2="' + m.y2 + '" class="fl-t fl-marry"/>';
      inner += '<polygon points="' + (mx - 6) + ',' + my + ' ' + mx + ',' + (my - 5) + ' ' + (mx + 6) + ',' + my + ' ' + mx + ',' + (my + 5) + '" class="msym-t"/>';
    });
    inner += tree.people.map(p => lay.boxes[p.id] ? nodeSVG(p, lay.boxes[p.id], lang, p.id === sel) : '').join('');
    inner += legendSVG(tree, lay, lang);
    inner += '<text x="' + (lay.ox + lay.w / 2) + '" y="' + (lay.oy + lay.h - 20) + '" text-anchor="middle" class="anno-t ft-caption" font-size="9" letter-spacing="3">' + esc(captionOf(tree, lang)) + '</text>';
  }
  const svg = '<svg class="ft-svg" viewBox="' + lay.ox + ' ' + lay.oy + ' ' + lay.w + ' ' + lay.h + '" width="' + lay.w + '" height="' + lay.h + '" xmlns="http://www.w3.org/2000/svg" style="' + themeVars(tree) + '">' + inner + '</svg>';
  return { svg, w: lay.w, h: lay.h, ox: lay.ox, oy: lay.oy, boxes: lay.boxes, layout: lay };
}

/* ── Pan-Zoom (fare tekeri, sürükle, iki parmak) ─────────── */
function panzoom(view, stage, opts) {
  opts = opts || {};
  const MIN = opts.min || 0.2, MAX = opts.max || 3.5;
  const st = { k: 1, x: 0, y: 0 };
  let size = { w: 1000, h: 600 };
  const pointers = new Map();
  let drag = null, pinch = null, moved = false;

  const apply = () => { stage.style.transform = 'translate(' + st.x + 'px,' + st.y + 'px) scale(' + st.k + ')'; if (opts.onChange) opts.onChange(st); };
  let raf = 0;   /* sürükleme: kare başına tek dönüşüm */
  const schedule = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; apply(); }); };
  const clampK = k => Math.min(MAX, Math.max(MIN, k));
  function zoomAt(cx, cy, nk) {
    nk = clampK(nk);
    const r = nk / st.k;
    st.x = cx - (cx - st.x) * r;
    st.y = cy - (cy - st.y) * r;
    st.k = nk;
    apply();
  }
  function fit(pad) {
    pad = pad == null ? 24 : pad;
    const vw = view.clientWidth || 800, vh = view.clientHeight || 500;
    const k = clampK(Math.min((vw - pad * 2) / size.w, (vh - pad * 2) / size.h, 1.15));
    st.k = k;
    st.x = (vw - size.w * k) / 2;
    st.y = Math.max(pad, (vh - size.h * k) / 2);
    apply();
  }
  function centerOn(box, k) {
    const vw = view.clientWidth, vh = view.clientHeight;
    if (k) st.k = clampK(k);
    st.x = vw / 2 - (box.x + box.w / 2) * st.k;
    st.y = vh / 2 - (box.y + box.h / 2) * st.k;
    apply();
  }

  const onWheel = e => {
    e.preventDefault();
    const r = view.getBoundingClientRect();
    const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016));
    zoomAt(e.clientX - r.left, e.clientY - r.top, st.k * f);
  };
  const onDown = e => {
    if (e.button != null && e.button > 0) return;
    if (opts.ignore && opts.ignore(e)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) { drag = { x: e.clientX, y: e.clientY, sx: st.x, sy: st.y }; moved = false; }
    if (pointers.size === 2) {
      const [a, b] = Array.from(pointers.values());
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: st.k };
      drag = null;
    }
    /* Yakalama yalnızca sürükleme başlayınca yapılır; aksi hâlde tıklama hedefi kutudan görüntüleyiciye kayar. */
  };
  const onMove = e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) {
      const [a, b] = Array.from(pointers.values());
      const r = view.getBoundingClientRect();
      zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, pinch.k * Math.hypot(a.x - b.x, a.y - b.y) / (pinch.d || 1));
      if (!moved) pointers.forEach((_, id) => { try { view.setPointerCapture(id); } catch (_) {} });
      moved = true;
      return;
    }
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      if (!moved) { try { view.setPointerCapture(e.pointerId); } catch (_) {} }
      moved = true;
      view.classList.add('dragging');
      st.x = drag.sx + dx; st.y = drag.sy + dy;
      schedule();
    }
  };
  const onUp = e => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) { drag = null; view.classList.remove('dragging'); }
    if (pointers.size === 1) { const p = Array.from(pointers.values())[0]; drag = { x: p.x, y: p.y, sx: st.x, sy: st.y }; }
  };
  view.addEventListener('wheel', onWheel, { passive: false });
  view.addEventListener('pointerdown', onDown);
  view.addEventListener('pointermove', onMove);
  view.addEventListener('pointerup', onUp);
  view.addEventListener('pointercancel', onUp);
  /* Sürükleme sonrası tıklamayı yut (düğüme yanlışlıkla tıklanmasın) */
  view.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);

  return {
    state: st,
    setSize(w, h) { size = { w, h }; },
    fit, centerOn,
    zoomBy(f) { zoomAt(view.clientWidth / 2, view.clientHeight / 2, st.k * f); },
    set(k, x, y) { st.k = k; st.x = x; st.y = y; apply(); },
    toStage(clientX, clientY) {
      const r = view.getBoundingClientRect();
      return { x: (clientX - r.left - st.x) / st.k, y: (clientY - r.top - st.y) / st.k };
    },
    destroy() {
      view.removeEventListener('wheel', onWheel);
      view.removeEventListener('pointerdown', onDown);
      view.removeEventListener('pointermove', onMove);
      view.removeEventListener('pointerup', onUp);
      view.removeEventListener('pointercancel', onUp);
    }
  };
}

window.FamilyTree = {
  KINDS, LEGEND_LABELS, LEGIT_LABELS, NODE_W, NODE_H, ROW_H,
  normalize, graph, layout, render, panzoom, themeVars, tx, esc
};
})();
