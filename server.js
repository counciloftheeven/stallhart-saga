import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import fs from 'fs';
import { promises as fsp } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Sunucu Tarafı Sıkıştırma (Gzip / Deflate)
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  threshold: 512,
  level: 6
}));

// Body parsers for JSON data & base64 image uploads
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// ═══ API ENDPOINTS ═════════════════════════════════════════

const ALLOWED_DATA_FILES = new Set([
  'characters.json', 'chapters.json', 'book.json', 'quotes.json',
  'lore.json', 'houses.json', 'kingdoms.json', 'familytree.json',
  'geography.json', 'language.json', 'maps.json', 'hierarchy.json',
  'pages.json'
]);

// 1. Veri Kaydetme API'si (data/*.json doğrudan diske yazar)
app.post('/api/save-data', async (req, res) => {
  try {
    const { file, data } = req.body;
    if (!file || !ALLOWED_DATA_FILES.has(file)) {
      return res.status(400).json({ ok: false, error: 'Geçersiz veri dosyası adı: ' + file });
    }
    if (data === undefined) {
      return res.status(400).json({ ok: false, error: 'Veri içeriği boş olamaz.' });
    }

    const dataPath = path.join(__dirname, 'data', file);
    const content = JSON.stringify(data, null, 2) + '\n';
    await fsp.writeFile(dataPath, content, 'utf8');

    return res.json({ ok: true, file, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error('save-data hatası:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// 2. Görsel Listesi API'si (assets/images altındaki tüm görselleri tarar)
async function scanImages(dir, baseDir = '') {
  let results = [];
  try {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.posix.join('assets/images', baseDir, entry.name);
      if (entry.isDirectory()) {
        const sub = await scanImages(fullPath, path.posix.join(baseDir, entry.name));
        results = results.concat(sub);
      } else if (/\.(webp|png|jpe?g|gif|svg|ico)$/i.test(entry.name)) {
        try {
          const stat = await fsp.stat(fullPath);
          const ext = path.extname(entry.name).toLowerCase().replace('.', '');
          let category = 'general';
          if (relPath.includes('/characters/')) category = 'characters';
          else if (relPath.includes('/kingdoms/')) category = 'kingdoms';
          else if (relPath.includes('/gods/')) category = 'gods';
          else if (relPath.includes('/maps/')) category = 'maps';
          else if (relPath.includes('/banners/')) category = 'banners';
          else if (relPath.includes('/chapters/')) category = 'chapters';

          results.push({
            path: relPath,
            name: entry.name,
            ext,
            size: stat.size,
            mtime: stat.mtime.toISOString(),
            category
          });
        } catch (_) {}
      }
    }
  } catch (err) {
    console.warn('scanImages dizin okunamadı:', dir, err.message);
  }
  return results;
}

app.get('/api/images', async (req, res) => {
  try {
    const imagesDir = path.join(__dirname, 'assets', 'images');
    const images = await scanImages(imagesDir);
    return res.json({ ok: true, images });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// 3. Yeni Görsel Yükleme API'si (Base64 veriyi diske yazar)
app.post('/api/upload-image', async (req, res) => {
  try {
    const { fileName, folder = 'general', dataUrl, targetPath } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ ok: false, error: 'Görsel veri URL\'si (dataUrl) eksik.' });
    }

    // Base64 çözümleme
    const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ ok: false, error: 'Geçersiz Base64 formatı.' });
    }
    const rawExt = matches[1].replace('jpeg', 'jpg');
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let finalRelPath = '';
    if (targetPath && /^assets\/images\/[a-zA-Z0-9_\-\.\/]+$/i.test(targetPath)) {
      finalRelPath = targetPath.replace(/\\/g, '/');
    } else {
      const safeFolder = String(folder || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
      const rawName = String(fileName || ('resim-' + Date.now())).replace(/\.[a-zA-Z0-9]+$/, '');
      const cleanName = rawName.replace(/[^a-zA-Z0-9_\-]/g, '_') + '.' + rawExt;
      finalRelPath = `assets/images/${safeFolder}/${cleanName}`;
    }

    const fullDest = path.join(__dirname, finalRelPath);
    await fsp.mkdir(path.dirname(fullDest), { recursive: true });
    await fsp.writeFile(fullDest, buffer);

    return res.json({
      ok: true,
      path: finalRelPath,
      name: path.basename(finalRelPath),
      size: buffer.length
    });
  } catch (err) {
    console.error('upload-image hatası:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// 4. Mevcut Görseli Doğrudan Değiştirme API'si
app.post('/api/replace-image', async (req, res) => {
  try {
    const { targetPath, dataUrl } = req.body;
    if (!targetPath || !targetPath.startsWith('assets/images/')) {
      return res.status(400).json({ ok: false, error: 'Hedef görsel yolu assets/images/ altında olmalıdır.' });
    }
    if (targetPath.includes('..')) {
      return res.status(400).json({ ok: false, error: 'Geçersiz yol karakteri.' });
    }
    if (!dataUrl) {
      return res.status(400).json({ ok: false, error: 'Görsel verisi eksik.' });
    }

    const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ ok: false, error: 'Geçersiz Base64 formatı.' });
    }
    const buffer = Buffer.from(matches[2], 'base64');
    const fullDest = path.join(__dirname, targetPath);

    await fsp.mkdir(path.dirname(fullDest), { recursive: true });
    await fsp.writeFile(fullDest, buffer);

    return res.json({ ok: true, path: targetPath, size: buffer.length, updated: true });
  } catch (err) {
    console.error('replace-image hatası:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// HTTP Önbellekleme Başlıkları (Cache-Control)
app.use(express.static(__dirname, {
  extensions: ['html'],
  index: 'index.html',
  setHeaders: (res, filePath) => {
    if (/\.(?:webp|png|jpe?g|gif|svg|ico|woff2?|ttf|eot|mp3|wav|ogg)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    } else if (/\.(?:css|js)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    } else if (/\.json$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (/\.html$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
