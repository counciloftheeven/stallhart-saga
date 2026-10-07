#!/usr/bin/env python3
"""
Görsel optimizasyonu: assets/images altındaki PNG/JPG dosyalarından WebP
kopyaları ve küçük boyutlu (srcset) sürümler üretir; site bunları
assets/images/manifest.json üzerinden otomatik kullanır.

  • ORİJİNAL DOSYALAR ASLA DEĞİŞTİRİLMEZ VE SİLİNMEZ. JSON'daki yollar
    (.png / .jpg) olduğu gibi kalır; site, manifestte karşılığı varsa WebP'yi
    gösterir, yoksa orijinali.
  • Değişmeyen dosyalar yeniden işlenmez (kaynak dosyanın özeti manifestte).
  • Kaynağı silinen görselin ürettiği WebP dosyaları temizlenir.
  • Üretilen WebP, orijinalden küçük değilse hiç yazılmaz.

Kullanım:   python3 scripts/optimize-images.py            (yalnızca yenileri)
            python3 scripts/optimize-images.py --force    (hepsini yeniden üret)
Gerekli:    pip install pillow
"""
import hashlib, json, os, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / 'assets' / 'images'
MANIFEST = IMG_DIR / 'manifest.json'

# ── Ayarlar ────────────────────────────────────────────────────
SOURCE_EXT   = {'.png', '.jpg', '.jpeg'}
MAX_FULL_W   = 2000            # "tam" sürümün en büyük genişliği (yakınlaştırma için yeterli)
VARIANT_W    = [240, 480, 960] # srcset küçük sürümleri (yalnızca kaynak daha büyükse)
Q_LOSSY      = 88              # PNG kaynaklı çizim/illüstrasyon
Q_FROM_JPEG  = 85              # JPEG kaynak zaten kayıplı; daha da düşürmeyelim
LOSSLESS_TRY_MP = 1.5          # bu megapikselin altındaki PNG'lerde kayıpsız da denenir
LOSSLESS_BIAS   = 1.25         # kayıpsız, kayıplıdan en fazla %25 büyükse kayıpsız seçilir
# Bu yollar (assets/images'a göre) hiç dönüştürülmez: olduğu gibi kalır.
SKIP = ['SIYASI_HARITA.jpg', 'maps/']
VERSION = 'v1'                 # ayarlar değişirse arttır → hepsi yeniden üretilir
# ───────────────────────────────────────────────────────────────

force = '--force' in sys.argv


def rel(p: Path) -> str:
    return p.relative_to(ROOT).as_posix()


def sha(p: Path) -> str:
    h = hashlib.sha1(p.read_bytes())
    h.update((VERSION + str(MAX_FULL_W) + str(VARIANT_W) + str(Q_LOSSY) + str(Q_FROM_JPEG)).encode())
    return h.hexdigest()[:12]


def skipped(p: Path) -> bool:
    r = p.relative_to(IMG_DIR).as_posix()
    return any(r == s or (s.endswith('/') and r.startswith(s)) for s in SKIP)


def slug(name: str) -> str:
    return ''.join(ch if (ch.isalnum() or ch in '-_.') else '_' for ch in name)


def has_alpha(im: Image.Image) -> bool:
    return im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info)


def prep(im: Image.Image) -> Image.Image:
    return im.convert('RGBA' if has_alpha(im) else 'RGB')


def encode(im: Image.Image, dest: Path, lossless: bool, q: int) -> int:
    if lossless:
        im.save(dest, 'WEBP', lossless=True, quality=100, method=6)
    else:
        im.save(dest, 'WEBP', quality=q, method=6, alpha_quality=100)
    return dest.stat().st_size


def resized(im: Image.Image, w: int) -> Image.Image:
    if im.width <= w:
        return im
    h = round(im.height * w / im.width)
    return im.resize((w, h), Image.LANCZOS)


def size_of(dest: Path, im: Image.Image, lossless: bool, q: int) -> int:
    return encode(im, dest, lossless, q)


old = {}
if MANIFEST.exists():
    try:
        old = json.loads(MANIFEST.read_text(encoding='utf-8')).get('images', {})
    except Exception:
        old = {}

sources = sorted(p for p in IMG_DIR.rglob('*')
                 if p.is_file() and p.suffix.lower() in SOURCE_EXT and not skipped(p))

new, used_out, rows = {}, set(), []
taken = {}  # üretilen ad çakışmaları için

for src in sources:
    key = rel(src)
    digest = sha(src)
    base = slug(src.stem)
    out_dir = src.parent
    # aynı klasörde aynı ad (ör. a.png ve a.jpg) çakışırsa uzantıyı ekle
    if (out_dir / (base + '.webp')).as_posix() in taken and taken[(out_dir / (base + '.webp')).as_posix()] != key:
        base = base + '_' + src.suffix.lower().lstrip('.')
    full = out_dir / (base + '.webp')
    taken[full.as_posix()] = key

    prev = old.get(key)
    if (not force and prev and prev.get('sha') == digest and (ROOT / prev['u']).exists()
            and all((ROOT / v[1]).exists() for v in prev.get('s', []))):
        new[key] = prev
        used_out.add(prev['u']); used_out.update(v[1] for v in prev.get('s', []))
        continue

    try:
        im0 = Image.open(src); im0.load()
    except Exception as e:
        print('! açılamadı:', key, e); continue
    is_jpeg = src.suffix.lower() in ('.jpg', '.jpeg')
    im = prep(im0)
    im = resized(im, MAX_FULL_W)

    lossless = False
    q = Q_FROM_JPEG if is_jpeg else Q_LOSSY
    size = encode(im, full, False, q)
    if (not is_jpeg) and (im.width * im.height) / 1e6 <= LOSSLESS_TRY_MP:
        tmp = full.with_suffix('.tmp.webp')
        ls = encode(im, tmp, True, q)
        if ls <= size * LOSSLESS_BIAS:
            tmp.replace(full); size, lossless = ls, True
        else:
            tmp.unlink()
    orig_size = src.stat().st_size
    if size >= orig_size:                       # kazanç yoksa hiç kullanma
        full.unlink(missing_ok=True)
        print('= atlandı (WebP daha büyük):', key)
        continue

    entry = {'sha': digest, 'w': im.width, 'h': im.height, 'u': rel(full), 's': []}
    used_out.add(entry['u'])
    for vw in VARIANT_W:
        if vw >= im.width * 0.9:
            continue
        vdest = out_dir / f'{base}-{vw}w.webp'
        encode(resized(im, vw), vdest, lossless, q)
        entry['s'].append([vw, rel(vdest)])
        used_out.add(rel(vdest))
    new[key] = entry
    rows.append((key, orig_size, size, 'kayıpsız' if lossless else f'q{q}'))

# Yetim (kaynağı silinmiş / artık kullanılmayan) üretimleri temizle
for key, e in old.items():
    for u in [e.get('u')] + [v[1] for v in e.get('s', [])]:
        if u and u not in used_out:
            (ROOT / u).unlink(missing_ok=True)
            print('- temizlendi:', u)

MANIFEST.write_text(json.dumps({'v': 1, 'images': new}, ensure_ascii=False, separators=(',', ':'), sort_keys=True),
                    encoding='utf-8')

if rows:
    print('\n%-58s %9s %9s  %s' % ('görsel', 'önce', 'sonra', 'mod'))
    for k, a, b, m in rows:
        print('%-58s %7d K %7d K  %s  (-%d%%)' % (k[-58:], a // 1024, b // 1024, m, 100 - b * 100 // a))
    ta, tb = sum(r[1] for r in rows), sum(r[2] for r in rows)
    print('\nToplam (tam sürümler): %d KB → %d KB  (-%d%%)' % (ta // 1024, tb // 1024, 100 - tb * 100 // ta))
print('Manifest: %d görsel' % len(new))
