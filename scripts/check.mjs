#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   STALLHART WIKI — Bütünlük Denetimi
   ---------------------------------------------------------------
   Çalıştırma:   node scripts/check.mjs            (uyarılar çıkışı bozmaz)
                 node scripts/check.mjs --strict   (uyarılar da hata sayılır)
   Gerekli:      Node 18+, ek paket yok.

   HATA (çıkış kodu 1):
     · JS dosyalarında sözdizimi hatası
     · data/*.json veya görsel manifestinde bozuk JSON
     · HTML'de var olmayan yerel dosya bağlantısı (src/href) ya da yinelenen id
     · Aynı betik/stil dosyası için sayfalar arasında farklı ?v= sürümü
     · Yinelenen kimlik (karakter, bölüm, hane, devlet, tanrı)
     · Var olmayan karaktere başvuru (devlet hükümdarı, hane üyeleri, soy ağacı, sözler)
   UYARI:
     · JSON'da adı geçen ama depoda bulunmayan görsel dosyası
       (ör. henüz yüklenmemiş tanrı sembolleri — bkz. assets/images/gods/README.txt)
   ═══════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');
const errors = [], warnings = [];
const err = m => errors.push(m);
const warn = m => warnings.push(m);
const rel = p => path.relative(ROOT, p).split(path.sep).join('/');
const exists = p => fs.existsSync(path.join(ROOT, p));
const list = (dir, re) => fs.readdirSync(path.join(ROOT, dir)).filter(f => re.test(f)).map(f => (dir === '.' ? f : dir + '/' + f));

/* ── 1. JS sözdizimi ─────────────────────────────────────────── */
for (const f of [...list('assets/js', /\.js$/), ...list('scripts', /\.mjs$/)]) {
  const r = spawnSync(process.execPath, ['--check', path.join(ROOT, f)], { encoding: 'utf8' });
  if (r.status !== 0) err(`JS sözdizimi hatası: ${f}\n      ${(r.stderr || '').split('\n').slice(0, 4).join('\n      ')}`);
}

/* ── 2. JSON ─────────────────────────────────────────────────── */
const D = {};
for (const f of [...list('data', /\.json$/), 'assets/images/manifest.json']) {
  try { D[path.basename(f)] = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')); }
  catch (e) { err(`Bozuk JSON: ${f} — ${e.message}`); }
}

/* ── 3. HTML: yerel bağlantılar, yinelenen id, sürüm tutarlılığı ── */
const versions = {};   /* dosya → { sürüm → [sayfalar] } */
for (const f of list('.', /\.html$/)) {
  const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const stripped = s.replace(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const seen = {};
  for (const m of stripped.matchAll(/\sid="([^"]+)"/g)) seen[m[1]] = (seen[m[1]] || 0) + 1;
  Object.keys(seen).filter(k => seen[k] > 1).forEach(k => err(`${f}: yinelenen id="${k}"`));

  for (const m of stripped.matchAll(/\s(?:src|href)="([^"]+)"/g)) {
    let u = m[1];
    if (/^(https?:|mailto:|data:|javascript:|\/\/|#)/i.test(u) || /\$\{|'\s*\+|\+\s*'/.test(u)) continue;
    const q = u.match(/\?v=([^"&#]+)/);
    u = u.split(/[?#]/)[0];
    if (!u) continue;
    if (!exists(u)) err(`${f}: bulunamayan dosya → ${u}`);
    else if (q && /^assets\//.test(u)) { ((versions[u] ||= {})[q[1]] ||= []).push(f); }
  }
}
for (const [file, vs] of Object.entries(versions)) {
  const keys = Object.keys(vs);
  if (keys.length > 1) err(`Sürüm tutarsızlığı (${file}): ` + keys.map(k => `?v=${k} → ${vs[k].join(', ')}`).join(' | '));
}

/* ── 4. Veri bütünlüğü ───────────────────────────────────────── */
function dupes(arr, label, file) {
  const c = {};
  (arr || []).forEach(x => { if (x && x.id != null) c[x.id] = (c[x.id] || 0) + 1; });
  Object.keys(c).filter(k => c[k] > 1).forEach(k => err(`${file}: yinelenen ${label} kimliği "${k}"`));
}
const chars = (D['characters.json'] || {}).characters || [];
const charIds = new Set(chars.map(c => c.id));
dupes(chars, 'karakter', 'characters.json');
dupes((D['chapters.json'] || {}).chapters, 'bölüm', 'chapters.json');
dupes((D['kingdoms.json'] || {}).kingdoms, 'devlet', 'kingdoms.json');
dupes((D['lore.json'] || {}).gods, 'tanrı', 'lore.json');
const houses = [];
((D['houses.json'] || {}).provinces || []).forEach(p => (p.houses || []).forEach(h => houses.push(h)));
dupes(houses, 'hane', 'houses.json');

const ref = (id, where) => { if (id && !charIds.has(id)) err(`${where}: var olmayan karakter → "${id}"`); };
((D['kingdoms.json'] || {}).kingdoms || []).forEach(k => ref(k.rulerId, `kingdoms.json › ${k.id}.rulerId`));
houses.forEach(h => (h.memberIds || []).forEach(id => ref(id, `houses.json › ${h.id}.memberIds`)));
((D['quotes.json'] || {}).quotes || []).forEach((q, i) => ref(q.speakerId, `quotes.json › #${i}.speakerId`));
((D['familytree.json'] || {}).trees || []).forEach(t => {
  const ids = new Set((t.people || []).map(p => p.id));
  (t.people || []).forEach(p => {
    ref(p.characterId, `familytree.json › ${t.id}/${p.id}.characterId`);
    [p.fatherId, p.motherId, ...(p.spouseIds || []), ...(p.childrenIds || [])]
      .filter(Boolean).forEach(id => { if (!ids.has(id)) err(`familytree.json › ${t.id}/${p.id}: ağaçta olmayan kişi → "${id}"`); });
  });
});

/* ── 5. Görsel dosyaları (uyarı) ─────────────────────────────── */
const imgRe = /\.(png|jpe?g|webp|gif|svg)$/i;
for (const [file, data] of Object.entries(D)) {
  if (file === 'manifest.json') continue;
  (function walk(o) {
    if (typeof o === 'string') {
      if (imgRe.test(o) && !/^(https?:|data:|\/\/)/i.test(o) && !exists(o)) warn(`${file}: görsel dosyası yok → ${o}`);
    } else if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === 'object') Object.values(o).forEach(walk);
  })(data);
}

/* ── Rapor ───────────────────────────────────────────────────── */
const uniq = a => Array.from(new Set(a));
if (warnings.length) {
  console.log(`\n⚠  ${warnings.length} uyarı`);
  uniq(warnings).forEach(w => console.log('   · ' + w));
}
if (errors.length) {
  console.log(`\n✗  ${errors.length} hata`);
  uniq(errors).forEach(e => console.log('   · ' + e));
}
if (!errors.length && !(strict && warnings.length)) {
  console.log(`\n✓ Denetim geçti (${warnings.length} uyarı).`);
  process.exit(0);
}
process.exit(1);
