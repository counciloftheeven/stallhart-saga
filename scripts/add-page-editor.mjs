#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   scripts/add-page-editor.mjs
   ---------------------------------------------------------------
   Sayfa Editörü'nü (assets/js/page-editor.js + page-editor.css) tüm
   herkese açık HTML sayfalarına ekler. Tekrar çalıştırmak güvenlidir
   (zaten eklenmişse atlar; sürüm numarasını günceller).

   Kullanım:
     node scripts/add-page-editor.mjs            # ekle / güncelle
     node scripts/add-page-editor.mjs --dry      # sadece ne yapacağını yaz
     node scripts/add-page-editor.mjs --remove   # tüm sayfalardan kaldır
     node scripts/add-page-editor.mjs --ver 1.1  # ?v= önbellek numarası

   admin.html ve 404.html atlanır (admin.html kendi yönetim paneline sahip).
   ═══════════════════════════════════════════════════════════════ */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const DRY = args.includes('--dry'), REMOVE = args.includes('--remove');
const VER = (args.includes('--ver') ? args[args.indexOf('--ver') + 1] : '1.0') || '1.0';
const SKIP = new Set(['admin.html', '404.html']);

const CSS_TAG = `<link rel="stylesheet" href="assets/css/page-editor.css?v=${VER}">`;
const JS_TAG = `<script src="assets/js/page-editor.js?v=${VER}" defer></script>`;
const CSS_RE = /[ \t]*<link[^>]*page-editor\.css[^>]*>[ \t]*\r?\n?/gi;
const JS_RE = /[ \t]*<script[^>]*page-editor\.js[^>]*><\/script>[ \t]*\r?\n?/gi;

let changed = 0, skipped = 0;
for (const f of fs.readdirSync(ROOT).filter(n => n.endsWith('.html')).sort()) {
  if (SKIP.has(f)) { skipped++; continue; }
  const p = path.join(ROOT, f);
  const src = fs.readFileSync(p, 'utf8');
  let out = src.replace(CSS_RE, '').replace(JS_RE, '');            /* önce varsa temizle (sürüm güncelleme için) */
  if (!REMOVE) {
    if (!/<\/head>/i.test(out) || !/<\/body>/i.test(out)) { console.warn('! atlandı (</head> veya </body> yok):', f); continue; }
    out = out.replace(/<\/head>/i, `${CSS_TAG}\n</head>`);
    const i = out.toLowerCase().lastIndexOf('</body>');
    out = out.slice(0, i) + `${JS_TAG}\n` + out.slice(i);
  }
  if (out === src) { continue; }
  changed++;
  console.log((DRY ? '[dry] ' : '') + (REMOVE ? 'kaldırıldı: ' : 'eklendi/güncellendi: ') + f);
  if (!DRY) fs.writeFileSync(p, out, 'utf8');
}
console.log(`\n${changed} sayfa ${DRY ? 'değişecek' : 'değişti'}, ${skipped} sayfa atlandı (admin/404).`);
