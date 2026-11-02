#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   STALLHART WIKI — Onaylı topluluk yamalarını data/*.json'a işler
   ---------------------------------------------------------------
   Admin panelinde onaylanan öneriler Supabase'de "yama" (content_patches)
   olarak durur ve siteye canlı bindirilir. Bu betik onları KALICI olarak
   depodaki JSON dosyalarına yazar; yamalar böylece "işlendi" sayılır.

   İki aşamalıdır (commit başarısız olursa içerik kaybolmasın diye):
     node scripts/sync-patches.mjs            → yamaları JSON'lara uygular,
                                                 işlenecek yama kimliklerini
                                                 .sync-patches-ids.json'a yazar
     node scripts/sync-patches.mjs --mark     → commit push'landıktan SONRA
                                                 o yamaları "işlendi" işaretler
     node scripts/sync-patches.mjs --dry-run  → hiçbir şey yazmadan raporlar

   Ortam değişkenleri (GitHub → Settings → Secrets and variables → Actions):
     SUPABASE_URL                 https://xxxx.supabase.co
     SUPABASE_SERVICE_ROLE_KEY    service_role / secret anahtarı
   ⚠ service_role anahtarı RLS'i aşar: yalnızca GitHub Secrets'ta tutun;
     config.js'e, depoya ya da sohbete ASLA yazmayın.

   Yerel deneme için:  --data-dir=<klasör>  (varsayılan: data)
   ═══════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const SWPatches = require(path.join(here, '..', 'assets', 'js', 'patches.js'));

const args = process.argv.slice(2);
const flag = n => args.includes('--' + n);
const opt = (n, d) => { const a = args.find(x => x.startsWith('--' + n + '=')); return a ? a.split('=').slice(1).join('=') : d; };
const DRY = flag('dry-run'), MARK = flag('mark');
const DATA_DIR = path.resolve(opt('data-dir', path.join(here, '..', 'data')));
const IDS_FILE = path.resolve(opt('ids-file', path.join(here, '..', '.sync-patches-ids.json')));

const BASE = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!BASE || !KEY) {
  console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY ortam değişkenleri gerekli.');
  process.exit(1);
}
/* Eski tip (JWT, "eyJ…" ile başlayan) service_role anahtarı Authorization ile de gönderilir;
   yeni tip "sb_secret_…" anahtarlar yalnızca apikey başlığıyla gönderilir. */
const headers = { apikey: KEY, 'Content-Type': 'application/json' };
if (/^eyJ/.test(KEY)) headers.Authorization = 'Bearer ' + KEY;

async function rest(pathAndQuery, init = {}) {
  const res = await fetch(BASE + '/rest/v1/' + pathAndQuery, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const txt = await res.text();
  return txt ? JSON.parse(txt) : null;
}

/* ── --mark: commit sonrası yamaları işlendi say ── */
if (MARK) {
  if (!fs.existsSync(IDS_FILE)) { console.log('İşaretlenecek yama yok (' + path.basename(IDS_FILE) + ' bulunamadı).'); process.exit(0); }
  const ids = JSON.parse(fs.readFileSync(IDS_FILE, 'utf8'));
  if (!ids.length) { console.log('İşaretlenecek yama yok.'); process.exit(0); }
  if (DRY) { console.log('[dry-run] işlendi sayılacak yama:', ids.length); process.exit(0); }
  await rest('content_patches?id=in.(' + ids.join(',') + ')&merged_at=is.null', {
    method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ merged_at: new Date().toISOString() })
  });
  fs.unlinkSync(IDS_FILE);
  console.log(`✓ ${ids.length} yama "işlendi" olarak işaretlendi.`);
  process.exit(0);
}

/* ── varsayılan: yamaları JSON'lara uygula ── */
const rows = await rest('content_patches?select=id,file,path,record_id,op,data,created_at&merged_at=is.null&order=created_at.asc&limit=1000');
console.log(`Bekleyen yama: ${rows.length}`);
if (!rows.length) process.exit(0);

const byFile = {};
rows.forEach(r => { (byFile[r.file] = byFile[r.file] || []).push(r); });

const doneIds = [], problems = [];
let changedFiles = 0;
for (const [file, list] of Object.entries(byFile)) {
  const fp = path.join(DATA_DIR, file);
  if (!fs.existsSync(fp)) { list.forEach(r => problems.push(`${file}: dosya yok (yama ${r.id})`)); continue; }
  const raw = fs.readFileSync(fp, 'utf8');
  const data = JSON.parse(raw);
  for (const r of list) {
    const bad = SWPatches.validate(r);
    if (bad) { problems.push(`${file} → ${r.record_id}: ${bad}`); continue; }
    let ok = false;
    try { ok = SWPatches.applyOne(data, r); } catch (e) { problems.push(`${file} → ${r.record_id}: ${e.message}`); continue; }
    if (ok) doneIds.push(r.id);
    else problems.push(`${file} → ${r.path} → ${r.record_id} (${r.op}): hedef kayıt bulunamadı; yama bekletiliyor`);
  }
  const out = JSON.stringify(data, null, 2);      /* mevcut dosyalar birebir bu biçimde (2 boşluk, sonda satır sonu yok) */
  if (out !== raw) {
    changedFiles++;
    console.log(`  ${DRY ? '[dry-run] ' : ''}${file}: güncelleniyor`);
    if (!DRY) fs.writeFileSync(fp, out);
  } else console.log(`  ${file}: değişiklik yok (yamalar zaten uygulanmış)`);
}

problems.forEach(p => console.warn('  ⚠', p));
if (!DRY) fs.writeFileSync(IDS_FILE, JSON.stringify(doneIds));
console.log(`Özet: ${doneIds.length} yama uygulandı, ${changedFiles} dosya değişti, ${problems.length} uyarı.`);

/* GitHub Actions çıktısı */
if (process.env.GITHUB_OUTPUT && !DRY) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changedFiles > 0}\n`);
