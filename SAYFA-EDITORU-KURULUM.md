# Sayfa Editörü — Kullanım Notu

Dosyalar ve sayfa eklemeleri bu pakette ZATEN uygulanmıştır. Yapılacaklar:

1. Bu klasörün içeriğini repoya yükleyin (commit + push) ve GitHub Pages'in yayınlamasını bekleyin (1–3 dk). Sitede Ctrl+F5 yapın.
2. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token:
   yalnızca bu repo, izin: Contents = Read and write, süre: 30–90 gün. Token'ı kopyalayın.
3. Sitede herhangi bir sayfada Ctrl+Shift+E (Mac: Cmd+Shift+E): depo sahibi, depo adı, dal (main) ve token'ı girip "Sına ve kaydet".
4. Sayfanın altında "✎ Sayfayı Düzenle" düğmesi belirir. Düzenleyip "Kaydet ve Yayınla".

Geri almak için: node scripts/add-page-editor.mjs --remove
Eklenen/değişen dosyalar: assets/js/page-editor.js, assets/css/page-editor.css, scripts/add-page-editor.mjs, sw.js (api.github.com önbellek dışı, CACHE_NAME v11), 22 HTML sayfası (css+js satırı).
