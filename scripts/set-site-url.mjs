#!/usr/bin/env node
/* Sosyal paylaşım önizlemeleri için mutlak adres yazar (og:image, twitter:image, og:url, canonical).
   Facebook/X gibi tarayıcılar göreli og:image/twitter:image adresini çözmez; site adresi belli olunca bir kez çalıştırın:

     node scripts/set-site-url.mjs https://kullanici-adi.github.io/depo-adi/

   Tekrar çalıştırmak güvenlidir (eski değerlerin üzerine yazar). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let base = process.argv[2];
if (!base || !/^https?:\/\//i.test(base)) { console.error('Kullanım: node scripts/set-site-url.mjs https://siteniz.example/yol/'); process.exit(1); }
if (!base.endsWith('/')) base += '/';

let n = 0;
for (const f of fs.readdirSync(ROOT).filter(x => x.endsWith('.html') && !['404.html', 'admin.html'].includes(x))) {
  const p = path.join(ROOT, f);
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('og:title')) continue;
  const page = f === 'index.html' ? '' : f;
  s = s.replace(/(<meta property="og:image" content=")[^"]*(">)/, `$1${base}assets/images/logo-stallhart.png$2`);
  s = s.replace(/(<meta name="twitter:image" content=")[^"]*(">)/, `$1${base}assets/images/logo-stallhart.png$2`);
  s = s.replace(/\n?<meta property="og:url"[^>]*>/, '').replace(/\n?<link rel="canonical"[^>]*>/, '');
  s = s.replace(/(<meta property="og:image"[^>]*>)/, `$1\n<meta property="og:url" content="${base}${page}">\n<link rel="canonical" href="${base}${page}">`);
  fs.writeFileSync(p, s); n++;
}
// sitemap.xml ve robots.txt içindeki BASE_URL yer tutucusunu doldur (sondaki / olmadan).
const baseNoSlash = base.slice(0, -1);
for (const f of ['sitemap.xml', 'robots.txt']) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  const s = fs.readFileSync(p, 'utf8');
  if (!s.includes('BASE_URL')) continue;
  fs.writeFileSync(p, s.replaceAll('BASE_URL', baseNoSlash));
  n++;
}

console.log(`${n} dosya güncellendi → ${base}`);
