# Sürüm 3,0 — Tema tutarlılığı + SEO/sosyal paylaşım

**Oluşturulma:** 23.09.2026, [SAAT BURAYA] TSİ (Türkiye saati, UTC+3) — 23 Eylül 2026, Çarşamba · **Önceki sürüm:** v2,9 (Kurultay/forum)

Bu sürüm iki grupta küçük, düşük riskli düzeltmeler içerir: (1) `styles.css`'te tema sistemini bozan birkaç sabit renk düzeltildi, (2) sosyal paylaşım/SEO meta etiketleri tamamlandı. Sayfalardaki tüm `?v=` değerleri **`3.0`** olarak güncellendi (`config.js` içindeki `assetVersion` bu sürümde değişmedi çünkü `community*.js`/`community.css` dosyalarına dokunulmadı).

## Ne değişti?
- **`assets/css/styles.css`** — projenin kendi kuralına ("hiçbir sayfada sabit renk kullanılmaz, sadece `:root` değişkenleri") aykırı kalmış 3 nokta düzeltildi:
  - `footer` arka planı sabit `#05080f` yerine `var(--deep)` oldu → artık ışık temasında da doğru renkte.
  - Zaman çizelgesindeki "kriz" ve "dini olay" noktaları/rozetleri (`.tl-item.crisis`, `.tl-item.religious`, `.tl-badge.crisis`, `.tl-badge.religious`) sabit hex renkler kullanıyordu, bu yüzden ışık temasına geçildiğinde koyu tema renkleriyle kalıyorlardı. Yeni `--crisis`, `--crisisb`, `--crisist`, `--religious`, `--religiousb`, `--religioust` değişkenleri hem koyu hem ışık blokuna eklendi; görsel ton korunarak tema-uyumlu hale getirildi.
- **Twitter/X paylaşım kartları** — sitede `twitter:card` etiketi vardı ama `twitter:title`/`twitter:description`/`twitter:image` hiçbir sayfada yoktu (bazı platformlar `og:*` etiketlerine düşmeyip doğrudan bunları arar). Tüm genel sayfalara (`index`, `bolumler`, `karakterler`, `karakter-sablon`, `haneler`, `hane-detay`, `krallik-detay`, `tanrilar`, `tanri-detay`, `harita`, `soy-agaci`, `lore`, `sozler`, `forum`, `forum-kategori`, `forum-konu`, `oku`) ilgili `og:*` değerleriyle eşleşen üç etiket eklendi. (`404.html` ve `admin.html` — `scripts/set-site-url.mjs` ile aynı mantıkla — kapsam dışı bırakıldı.)
- **`og:title`/`og:description`/`og:image` eksikleri tamamlandı** — `forum-kategori.html` ve `forum-konu.html`'de bu üç etiket hiç yoktu (yalnızca `og:type`/`og:site_name`/`og:locale` vardı); sayfanın `<title>`/`<meta name="description">` değerlerinden türetilerek eklendi.
- **`sitemap.xml`** (yeni) — tüm genel sayfaları listeleyen standart bir sitemap eklendi. `<loc>` adresleri mutlak olmak zorunda olduğu için `BASE_URL` yer tutucusu kullanıldı.
- **`robots.txt`** — `Sitemap: BASE_URL/sitemap.xml` satırı eklendi.
- **`scripts/set-site-url.mjs`** — artık site adresini yazarken (`node scripts/set-site-url.mjs https://...`) `sitemap.xml` ve `robots.txt` içindeki `BASE_URL` yer tutucusunu da otomatik dolduruyor (HTML sayfalarındaki `og:url`/canonical ile aynı akış).

## Bilinen sınırlamalar
- `sitemap.xml` ve `robots.txt` içindeki `BASE_URL` yer tutucusu, site gerçek adrese taşınana kadar **elle veya `set-site-url.mjs` ile** doldurulmalı; doldurulmadan yayınlanırsa arama motorları geçersiz mutlak adres görür.
- Bu sürümde yalnızca yukarıdaki dosyalar değiştirildi; işlevsel/davranışsal hiçbir değişiklik yapılmadı (salt CSS token düzeltmesi + meta etiket eklemesi).

## Doğrulama
- `node --check` ile `scripts/set-site-url.mjs` söz dizimi doğrulandı.
- `styles.css`'te değiştirilen 4 kural ve eklenen 2 token bloğu (koyu/ışık) tek tek karşılaştırıldı; başka hiçbir kural dokunulmadı.
- Tüm genel sayfalarda `?v=3.0` ve yeni `twitter:*` etiketlerinin doğru eklendiği örnekleme ile kontrol edildi.

---

# Sürüm 2,9 — Kurultay (forum)

**Oluşturulma:** 22.09.2026 20:24 TSİ (Türkiye saati, UTC+3) — 22 Eylül 2026, Salı · **Önceki sürüm:** v2,7 (kalıcı adresler)

Bu sürümde sitede **Kurultay** adıyla tam bir topluluk forumu açıldı: kategori listesi, konu listesi (sıralama/arama/sayfalama), konu açma, yanıtlama, sabitleme/kilitleme/silme moderasyonu ve okunmamış-konu göstergesi. Sayfalardaki tüm `?v=` değerleri **`2.9`** olarak güncellendi (`config.js` içindeki `assetVersion` — yalnızca `community*.js`/`community.css` dosyalarının önbellek sürümü — bu sürümde değişmedi çünkü o dosyalara dokunulmadı).

## Ne eklendi?
- **`forum.html`** — Kurultay ana sayfası: kategori kartları, sabitlenmiş/son konular, arama, sıralama (yeni/en çok cevap/en çok görüntülenme), site geneli istatistik.
- **`forum-kategori.html`** — kategori bazlı konu listesi: arama, sıralama, sayfalama (20/sayfa), boş-kategori mesajı.
- **`forum-konu.html`** — konu detayı: başlık + ilk gönderi, ardından yanıtlar için **mevcut Divan Tartışması bileşeni** (`Wiki.Community.mountComments`) `page_type:'forum_thread'` ile yeniden kullanılıyor (yeni bir yorum sistemi yazılmadı — mühür, iç içe yanıt, spoiler, moderasyon hepsi bedava geldi).
- **`assets/js/kurultay.js`** (yeni, paylaşılan modül) — kategori/konu veri erişimi (Supabase; tablo yoksa otomatik yerel örnek veriye düşer), okundu/okunmadı durumu (`localStorage`), ortak HTML üretimi (`threadRowHTML`, `categoryCardHTML`).
- **`assets/css/kurultay.css`** (yeni) — üç forum sayfasının ortak stilleri; site paletindeki CSS değişkenlerini kullanır, sabit renk yoktur.
- **`supabase/forum-schema.sql`** (yeni, **elle çalıştırılmalı**) — `forum_categories`, `forum_threads` tabloları; yanıtlar için ayrı tablo açılmadı, mevcut `comments` tablosu `page_type='forum_thread'` ile genişletildi. RLS politikaları, sabitleme/kilitleme/silme/görüntülenme RPC'leri (`kurultay_set_pin`, `kurultay_set_lock`, `kurultay_delete_thread`, `kurultay_bump_view`, `kurultay_stats`), ve `comments_guard()` fonksiyonunun kilitli konuya sunucu tarafında da yanıt engelleyen güncellenmiş hâli.
- **`assets/js/wiki.js`** — `NAV_LINKS`'e "Kurultay" eklendi; menüde okunmamış-konu için kırmızı nokta (`kurultay-unread` bayrağı, tüm sayfalarda).
- **`assets/css/styles.css`** — `.kurultay-dot` kuralı (menüdeki bildirim noktası).

## Bilinen sınırlamalar
- **Okunmamış takibi tek cihazda çalışır** (`localStorage` bazlı). Çoklu cihazda gerçek zamanlı bildirim için sunucu tarafında kullanıcı bazlı "son görülme" tablosu gerekir; bu sürümde yok.
- Kategori kartlarında konu/mesaj sayısı **gösterilmiyor** (uydurma sayı göstermemek için bilerek çıkarıldı) — `forum_categories` tablosuna sayaç sütunu eklenirse `categoryCardHTML` genişletilebilir.
- Moderasyon panelinde (`admin.html`) Kurultay'a özel bir sekme **yok**; sabitleme/kilitleme/silme şimdilik yalnızca konu sayfasındaki araç çubuğundan yapılıyor.

## Doğrulama
Bu ortamda tarayıcı veya canlı Supabase erişimi yok; yapılan kontroller:
- `node --check` ile üç forum sayfasının ve `kurultay.js`/`wiki.js`'in **söz dizimi** doğrulandı.
- Yeni HTML dosyalarında açılan/kapanan `<div>` sayıları eşleşti.
- `assets/js/community.js` içindeki gerçek dışa açık isimler (`getState`, `requireLogin`, `getClient`, `mountComments`, `util.avatarHTML/fmtDate/timeAgo/confirmBox/toast/mapErr/Modal`) tek tek kodda karşılaştırılarak kullanıldı; uydurma bir API çağrılmadı.
- `forum-schema.sql`, mevcut `schema.sql`'deki `comments_guard()` fonksiyonunun **tamamı** korunarak üzerine tek bir kilit kontrolü eklendi (fonksiyonun geri kalanı satır satır karşılaştırıldı).
- Sitenin geri kalanı bu sürümde **değiştirilmedi**; yalnızca yukarıdaki dosyalar eklendi/güncellendi.
- Not: Supabase bu ortamdan erişilemediği için `forum-schema.sql` gerçek projede **çalıştırılıp denenmedi** — panelde çalıştırdıktan sonra `select * from public.kurultay_stats();` ile bir kontrol önerilir.

---

# Sürüm 2,7 — Kalıcı adresler (`#/karakter/zeandor`)

**Oluşturulma:** 21.09.2026 13:21 TSİ (Türkiye saati, UTC+3) — 21 Eylül 2026, Pazartesi · **Önceki sürüm:** v18 (görsel/WebP paketi + otomatik bağlantılar)

**Sürüm numaralaması değişti.** Bundan sonra sürümler `SS,d` biçiminde yazılır (ana sürüm, virgül, revizyon): bu sürüm **2,7**.
Aşağıdaki eski notlardaki v9–v18 numaraları tarihçe olarak kalır. Tarayıcı önbellek numarası (`?v=`) sürümle aynıdır: **`2.7`**
(sayfalardaki tüm `?v=` değerleri ve `config.js` içindeki `assetVersion` — yeni sürümde ikisini birlikte artırın).

## Ne değişti?
Her maddenin **tek ve kalıcı** adresi var; GitHub Pages sunucu yönlendirmesi yapamadığı için “hash” biçimi seçildi (`/karakter/zeandor` yol adresi 404 verirdi):

| Madde | Kalıcı adres | Sayfa |
|---|---|---|
| Karakter | `#/karakter/zeandor` | `karakter-sablon.html` |
| Devlet | `#/devlet/stallhart-empire` | `krallik-detay.html` |
| Hane | `#/hane/solgar` | `hane-detay.html` |
| Tanrı | `#/tanri/galdra` | `tanri-detay.html` |
| Bölüm | `#/bolum/3` | `oku.html` |
| Harita / madde | `#/harita/imparatorluk/solgar` | `harita.html` |
| Evren (ansiklopedi) | `#/evren/yer-selya` · `#/evren/dunya` | `lore.html` |
| Soy ağacı sekmesi | `#/soy-agaci/solgar` | `soy-agaci.html` |
| Liste sayfaları | `#/karakterler` `#/haneler` `#/tanrilar` `#/bolumler` `#/sozler` | ilgili liste |

- **Sayfa içi bağlantılar** doğrudan `karakter-sablon.html#/karakter/zeandor` biçimindedir.
- **Paylaşılan kök adres** `https://…/#/karakter/zeandor` da çalışır: herhangi bir sayfa, hash’in ait olduğu sayfaya kendiliğinden yönlendirir.
  Dosya adı değişse bile yalnızca `assets/js/router.js` içindeki `TYPES` tablosu güncellenir.
- **Eski adresler kırılmaz** ve açılınca yeni biçime çevrilir: `karakter-sablon.html?id=zeandor`, `krallik-detay.html?id=…`, `hane-detay.html?id=…`,
  `tanri-detay.html?id=…`, `oku.html?b=3`, `harita.html#solgar`, `harita.html#imparatorluk/solgar`, `lore.html#yer-selya`, `soy-agaci.html#solgar`,
  `karakterler.html#zeandor` (eski karakter penceresi hâlâ açılır).
- Bir madde sayfasındayken başka maddeye geçilince sayfa yeniden yüklenir (eski sürümde de her madde ayrı sayfa yüklemesiydi; durum temiz başlar).
- Programcı arayüzü: `SWRoute.href('karakter', id)` (göreli adres), `SWRoute.permalink(…)` (kök adres), `SWRoute.current()`, `SWRoute.id(tür)`,
  `SWRoute.canonicalize()`, `SWRoute.watch()`. Yeni bir bağlantı üretirken elle `?id=` yazmayın; hep `SWRoute.href` kullanın.

## Bilerek değişen davranışlar
- Ana sayfa, Haneler ve Sözler’deki karakter bağlantıları artık karakter listesindeki pencereyi değil **karakter sayfasını** açar.
- Arama sonuçlarında haneler artık liste yerine **hane sayfasına** gider.
- `harita.html` bağlantıları da bu biçimdedir; karakter sayfalarındaki “Haritada gör” bağlantısı `#/harita/<madde>` kullanır.

## Düzeltilen hatalar
- Devlet, hane ve tanrı sayfalarında sekme başlığı HTML-kaçışlı yazılıyordu (ör. `&` → `&amp;`); artık düz metin.
- Bozuk `%…` içeren adresler (`#/karakter/%E0%A4%A`) soy ağacı, lore, harita ve karakter listesi sayfalarında betik hatası veriyordu; artık güvenli çözülür.
- Karakter sayfasında hem `popstate` hem `hashchange` dinleyicilerinin çift çizim riski kaldırıldı (tek mekanizma: `SWRoute.watch`).
- Topluluk katmanı (yorum/öneri) sayfa bağlamını ve `page_url` alanını yeni adres biçiminden üretir; eski kayıtlardaki `?id=` adresleri çalışmaya devam eder.

## Yeni / değişen dosyalar
Yeni: `assets/js/router.js` (her sayfanın `<head>`’inde, diğer betiklerden önce).
Değişen: tüm `*.html` (router + `?v=2.7`), `wiki.js` (arama, tooltip, kitap köprüleri, `isSelf`), `harita.js`, `community.js`, `community-suggest.js`,
`admin.js`, `admin-maps.js`, `admin-book.js`, `config.js` (yalnızca `assetVersion`), `karakter-sablon` / `krallik-detay` / `hane-detay` / `tanri-detay` / `oku` /
`lore` / `soy-agaci` / `karakterler` / `haneler` / `tanrilar` / `sozler` / `bolumler` / `index` sayfaları.

## Doğrulama (otomatik, Chromium)
- **Adres çözümleme:** 289 adres — 129 karakter, 45 hane, 15 tanrı, 14 okunabilir bölüm, 6 devlet; yeni biçim, eski biçim, kök adres, yanlış sayfadan adres — **0 hata**.
- **Bağlantı denetimi:** 16 sayfada 242 iç bağlantı; eski biçimde ve kırık hedefli bağlantı **0**.
- **Arama** (50 sonuç) ve **tooltip** kartları yeni biçimde; aramadan başka maddeye geçiş çalışır.
- Harita (sekme, geri/ileri, eski adresler), Evren, soy ağacı, karakter penceresi, okuyucu gezinmesi, yönetim paneli → Haritalar, 14 sayfa × 8 tuhaf hash taraması,
  topluluk `pageUrl` ve öneri bağlamı; masaüstü + 390 px, açık/koyu tema, TR/EN: betik hatası ve yatay taşma **yok**.
- Not: `tanrilar.html` yalnızca `galdra` sembolünü içeriyor; `lore.json` diğer tanrılar için henüz depoda olmayan `assets/images/gods/*.png` yollarını gösterir (404) ve
  sayfa baş harf yedeğini kullanır. Görseller yüklenince kendiliğinden düzelir.
- Supabase bu ortamdan erişilemediği için topluluk katmanı gerçek projeyle denenmedi (yalnızca istemci tarafı).

---

# v18 notu: Otomatik bağlantılar + mini bilgi kartı (Wiki ve Okuyucu)

**Sözlük genişledi.** Metinde geçen adları tanıyan tooltip sistemi (`wiki.js` → `Tooltip`) artık yalnızca karakter ve sözlük terimlerini değil;
**haneler, devletler, yerler** (eyalet, şehir, nehir, dağ, orman), **tanrılar**, **topluluklar** (fraksiyon, kült) ve **tarihsel olayları** da içerir.
Sözlük her sayfa yüklemesinde `data/*.json` dosyalarından (yönetim panelinden onaylanan topluluk yamaları dahil) yeniden üretilir — elle liste tutmak gerekmez.

**Okuyucu (`oku.html`) artık aynı kartı kullanır.** Bölüm metninde bir ad **bölümde yalnızca ilk geçtiği yerde** işaretlenir (noktalı alt çizgi).
Dokunmatik ekranda **dokununca** kart açılır (tekrar dokunun ya da boş bir yere dokunun: kapanır); karttaki **“Maddeyi aç”** bağlantısı yeni sekmede açılır,
böylece okuma yeri kaybolmaz. Fareyle üzerine gelince kart açılır, tıklayınca madde yeni sekmede açılır. Elle yazılmış `[ad](wiki:…)` köprüleri “ilk geçiş” sayılır:
aynı varlık bir daha otomatik işaretlenmez. Kart, Wiki’deki kartın aynısıdır (tür, unvan / açıklama, kısa tanıtım).

**Eşleşme kuralları**
- Özel adlar (karakter, hane, yer, tanrı, olay…) yalnızca **büyük harfle** başladığında eşleşir; sözlük terimleri küçük harfle de eşleşir.
- Aynı yazım birden çok türe düşerse sıra: karakter › devlet › yer › hane › tanrı › topluluk › olay › sözlük (ör. “Selya'daki” → eyalet).
- Karakter adlarının tek başına geçen parçaları (ilk ad vb.) yalnızca **tek karaktere aitse** bağlanır (“Craes” iki karakterde olduğu için bağlanmaz).
  Betimleme metinlerinde küçük harfle de geçen sözcükler (“sessiz”, “veziri”…) takma ad olarak kullanılmaz.
- Türkçe ek almış biçimler (`Arava’da`, `Stallhart’ın`) eşleşir; kıvrık/düz kesme işareti fark etmez. Bir sayfa kendi maddesine bağlanmaz.
- Başlıklar, görsel altyazıları ve mevcut bağlantıların içi taranmaz; metin hiçbir zaman değiştirilmez, yalnızca `<span class="wk">` sarılır.

**Yeni bağlantı hedefleri (`lore.html`):** `#grup-<id>` (fraksiyon / kült → Din & İnanç sekmesi), `#cog` (Coğrafya sekmesi), `#dunya` (Dünya Güç Sıralaması). Sayfa içindeyken `hashchange` da izlenir.

**Değişen dosyalar:** `assets/js/wiki.js` (Tooltip yeniden yazıldı; `Book.TITLE_WORDS` dışa açıldı; `initWiki` → `tooltipOpts`), `assets/css/styles.css`
(dokunmatikte alt çizgi artık gizlenmiyor, kart/bağlantı boyutları), `oku.html` (tooltip açıldı, bölüm çizilince taranır), `lore.html` (bağlantı hedefleri).
Önbellek sürümleri: `wiki.js?v=20`, `styles.css?v=21`.

---

# v17 notu: Harita sayfası — sekmeler, çok haritalı yapı, haritaya özgü lejant

**`harita.html` artık doğrudan harita açmaz.** Önce **sekmeler + kartlar** gelir (şimdilik *İmparatorluk Haritası* ve *Dünya Haritası*);
bir sekmeye/karta tıklayınca görüntüleyici açılır. Adresler: `harita.html` (seçim ekranı) · `harita.html#imparatorluk` · `harita.html#dunya` ·
`harita.html#imparatorluk/solgar` (haritayı açıp lejant maddesini gösterir) · `harita.html#solgar` (madde kimliği tek başına — karakter sayfalarındaki
“Haritada gör” bağlantıları eskisi gibi çalışır). Tarayıcının geri/ileri düğmeleri sekmeler arasında dolaşır.

**Veri:** `data/maps.json` (yeni). Her kayıt bir sekmedir: başlık, açıklama, `image` (harita görseli), `thumb` (kart görseli, isteğe bağlı),
`legendTitle` ve **o haritaya özgü `legend`** (renk, ad, üst etiket, başkent, yönetim, tanım, özellikler, karakterler, Evren/Devlet bağlantısı).
İmparatorluk haritasının lejantı eyaletler (eski `REGIONS` verisi aynen taşındı); Dünya haritasınınki `kingdoms.json`'daki devletlerden üretildi.
Dünya haritası görseli henüz yok → sekme “Harita henüz yüklenmedi” der, lejant çalışır.

**Yönetim Paneli → Haritalar** (`assets/js/admin-maps.js`)
- **Yeni sekme = yeni harita:** “+ Yeni Ekle” → başlık (TR/EN), açıklama, **PNG / JPG / WebP yükle** ya da depo yolu (`assets/images/maps/…`), lejant.
- Sekme sırası (↑ ↓), sekmede göster/gizle, silme. Lejant maddeleri: ekle / sırala / sil, “Devletten ekle”, karakter ve Evren bağlantıları.
- Kaydedilmiş harita/madde **kimlikleri değişmez** (adresler ve karakter sayfalarındaki bağlantılar buna dayanır); kimlikler tüm haritalarda tekildir.
- Kaydedilmemiş değişiklikte çıkış uyarısı; depolama dolarsa veri bozulmaz. Yayın: **Veri & Yayın → `maps.json`** indirip `data/` klasörüne koyun.
  Yüklenen görsel taslakta gömülü kalır; yayın için “Dosya olarak indir” ile alıp `assets/images/maps/` altına koyun ve yolunu yazın.

**Görüntüleyici (yeniden yazıldı):** fare + dokunma + kalem tek kodla (Pointer Events), iki parmakla yakınlaştırma, tekerlek, klavye (`+ − 0`, oklar);
harita kapsayıcıdan tamamen çıkamaz; sürükleme sonrası yanlışlıkla bilgi paneli açılmaz; pencere/yön değişiminde sığdırılmış görünüm korunur.
**Mobil:** lejant ve bilgi paneli alttan açılan sayfalardır (eskiden lejant mobilde tamamen gizliydi, eyalet bilgisine erişilemiyordu).
**Işık/karanlık:** tüm renkler `styles.css` değişkenlerinden gelir (eskiden sabit koyu renkler ışık temasında okunmuyordu); **metinler** taşmaz (kırılır/kısaltılır).

**Düzeltilen hatalar:** lejant/bilgi paneli üzerinde tekerlek haritayı yakınlaştırıyordu · bozuk `#%…` adresi sayfayı çökertiyordu ·
“harita yüklenemedi” iletisi sabit dosya adını gösteriyordu · ipucu şeridi dar ekranda taşıyordu · nav arka planı ışık temasında koyu kalıyordu
(`--nav-bg`, tüm sayfalarda) · topluluk “Öneri Sun” düğmesi harita arayüzüyle çakışıyordu (harita açıkken konumu ayarlanır).
Ölçek çubuğundaki anlamsız “br” birimi kaldırıldı; yalnızca yakınlaştırma yüzdesi gösterilir.

**Dosyalar:** yeni `assets/css/harita.css`, `assets/js/harita.js`, `assets/js/admin-maps.js`, `data/maps.json`, `assets/images/maps/`.
Değişen: `harita.html`, `admin.html`, `admin.js` (küçük kancalar), `admin.css`, `styles.css` (`--nav-bg`), `krallik-detay.html` (“Tam siyasi harita” bağlantısı `#imparatorluk`).

---

# v16 notu: Topluluk katmanı — üyelik, Divan Tartışması, öneri kutusu

GitHub Pages'te sunucu çalıştıramadığımız için "sunucu" görevini **Supabase** (Postgres + giriş sistemi) üstlenir; site yalnızca
CDN'den yüklenen `supabase-js` ile ona konuşur. **`assets/js/config.js` boşsa hiçbir şey değişmez** — site birebir eskisi gibidir.
Kurulum (20–30 dk, ücretsiz plan yeter; hiç bilmeyene göre adım adım yazıldı): **[`supabase/KURULUM.md`](supabase/KURULUM.md)**.

**Üyelik & roller**
- **Ziyaretçi** (yalnızca okur) · **Kâtip / Üye** (yorum, mühür, öneri; profilinde avatar, favori hane ve unvan seçer) ·
  **Vakanüvis / Admin** (paneli yönetir, önerileri onaylar/reddeder, yorum siler, kullanıcı yasaklar/yetkilendirir).
- Nav'da **Giriş** düğmesi → kayıt, giriş, parola sıfırlama. **Profil modalı:** avatar, favori hane sancağı (arma), unvan, kayıt tarihi,
  yorumlar ve öneriler (bekliyor / onaylandı / reddedildi; bekleyen öneri geri çekilebilir). Yorum yazarına tıklayınca onun profili açılır.
- Yetki denetimi tarayıcıda değil **veritabanındadır** (Row Level Security + `is_admin()`); rol ve yasak kullanıcı tarafından değiştirilemez.

**Divan Tartışması (yorumlar)** — karakter, devlet ve **roman bölümü** (`oku.html`, makalenin altında) sayfalarında, eskitilmiş parşömen görünümünde.
`[spoiler]…[/spoiler]` (tıklayınca açılan mürekkep lekesi), **mühür basma** (beğeni), 3 seviyeye kadar iç içe yanıt (sonrası düzleşir), sıralama,
kendi yorumunu silme. Yorumlarda HTML çalışmaz.
> `oku.html` ilerleme/“okundu”/kaldığın-yer hesabı artık yalnızca **makale sonuna kadar** ölçülür; yorumlar sayfayı ne kadar uzatırsa uzatsın bozulmaz.

**Vakanüvise Öneri Sun** — sağ altta düğme (okuyucuda yorum başlığında). Türler: **düzeltme** (o sayfadaki kaydın seçilen alanı: şu anki metin görünür),
**yeni karakter**, **yeni terim**, **genel not**. Öneriler `pending_suggestions` tablosuna düşer.

**"Onaylayınca tek tıkla JSON'a geçsin" nasıl çözüldü:** tarayıcıdan GitHub'a yazmak için tarayıcıda anahtar tutmak gerekir (güvensiz). Onun yerine:
admin **Onayla ve yayınla**'ya basınca öneri bir **yama** (`content_patches`) olur; site her açılışta yamaları `data/*.json`'un üstüne uygular →
değişiklik **anında herkeste** görünür, commit gerekmez, geri alınabilir. Kalıcı işlemek için: Veri & Yayın → *Birleştirilmiş JSON'ları indir* →
`data/`'ya koy → *Depoya işlendi say* — ya da isteğe bağlı **GitHub Action** (`.github/workflows/sync-patches.yml`, `scripts/sync-patches.mjs`) bunu otomatik yapar.

**Yönetim Paneli → Topluluk** (yalnızca yapılandırılınca görünür; giriş artık yerel parola yerine Vakanüvis hesabıyla):
**Öneriler** (Şu an / Önerilen farkı, yamayı onaylamadan düzenleme, not, onay/red, bekleyen sayacı) · **Yorumlar** (ara, sil, konuyu sil, yazarı yasakla) ·
**Kullanıcılar** (e-posta, rol, yasak) · **Veri & Yayın**'da canlı yamalar (listele, geri al, indir, işlendi say).

**Yeni dosyalar:** `assets/js/config.js` (ayarlar) · `patches.js` (yama motoru; tarayıcı, admin ve Node'da aynı) · `community.js` (çekirdek: giriş, profil, menü) ·
`community-divan.js` · `community-suggest.js` (ihtiyaç anında yüklenir) · `admin-community.js` · `assets/css/community.css` ·
`supabase/schema.sql` + `KURULUM.md` · `scripts/sync-patches.mjs` + `.github/workflows/sync-patches.yml`.
**Mevcut dosyalarda küçük eklemler:** `wiki.js` (yamaları bindiren `LivePatches`, nav'da giriş yuvası), tüm sayfalarda 4 `<script>` satırı,
`karakter-sablon` / `krallik-detay` / `oku` (yorum alanı), `admin.html` + `admin.js` (giriş kapısı, Topluluk menüsü), `admin.css`.

**Ayrıca düzeltilen mevcut hata:** karakter / devlet / hane / tanrı sayfalarındaki `<nav class="breadcrumb">`, `styles.css`'teki çıplak `nav { position: fixed }` kuralını
devralıp üst menünün üstüne biniyordu (tıklamaları engelliyordu). Kural `nav:where(:not(.breadcrumb))` yapıldı (özgüllüğü artırmadan).

**Doğrulama (otomatik):** `schema.sql` gerçek Postgres'te (RLS dahil) **78 kontrol**; yama motoru **29 kontrol**; senkron betiği **19 kontrol**;
tarayıcı uçtan uca (Chromium) **162** kontrol — kayıt/giriş, yorum/yanıt/spoiler/mühür/silme, XSS, profil, öneri, admin onay/red/yasak, canlı yama bindirme,
okuyucu ilerlemesi, 320–1600 px nav. Tarayıcı testleri Supabase'in **taklidiyle** koştu; gerçek projeyle ilk denemeyi KURULUM.md'deki listeyle sen yapmalısın.

---

# v14 notu: Veri güdümlü Soy Ağacı + Yönetim Paneli → Soy Ağaçları

**`soy-agaci.html`** artık `data/familytree.json`'dan çizilir (motor: `assets/js/familytree.js`, stiller: `assets/css/familytree.css`).
- **5 sekme:** Stallhart (İmparatorluk), Selya, **Solgar, Arhan, Galet** — `soy-agaci.html#solgar` gibi doğrudan adres verilebilir.
- **Stallhart ve Selya birebir korundu:** elle çizilmiş görünümleri (`edgeMode: "manual"`) aynen saklanır; eski sayfayla
  DOM geometrisi karşılaştırıldı (Selya özdeş, Stallhart'ta yalnızca <0,5 px metin yuvarlama farkı).
- **Pan-Zoom:** fare tekerleği, sürükle-bırak, iki parmak (mobil), +/−/sığdır düğmeleri; klavye `+ − 0`.
- **Mini kart:** kutuya tıklayınca açılır — durum, açıklama, baba/anne/eş/çocuk (tıklayınca o kutuya gider),
  meşruiyet rozeti, karakter sayfası bağlantısı. Kişinin kendi metni yoksa bağlı karakter kaydından (unvan, lakap, biyografi) tamamlanır.
- **Meşruiyet çizgileri:** Meşru Varis = altın çift çizgi; Gayrimeşru / Sürgün = kan kırmızısı kesikli çizgi.

**Solgar / Arhan / Galet taslakları** yalnızca `characters.json` kayıtlarında açıkça yazan akrabalıklardan çıkarıldı:
Solgar (Edun → Reun; Zellan "kuzen" olarak serbest bağla), Arhan (Fihor → Kaelen, Edlas), Galet (Metron → Wolrez).
Nanon (kahya), Zeren/Liane (gizli aşk) ve Erthan (yaver) aile bağı olmadığı için eklenmedi. Renkler tahminidir.

**Yönetim Paneli → Soy Ağaçları**
- Liste: ağaç ekle/sil, yerleşim modu, kişi sayısı, sekme sırası.
- **Editör (solda form, sağda canlı önizleme):** kişi ekle / “Karakterlerden ekle”; her kişi için ad, unvan, dönem, lakap,
  açıklama, kutu metni (3 satır, TR/EN), kutu stili, `fatherId` / `motherId` / `spouseIds` / `childrenIds` / `generation`,
  tek tıkla meşruiyet anahtarı, serbest bağlar (kuzen, enişte…). Akrabalıklar iki yönlü eşitlenir; döngü oluşturacak seçimler listelenmez.
- **Yerleşim:** otomatik (kuşak + akrabalık) — istersen önizlemede kutuyu **sürükleyerek elle düzelt** (dx/dy saklanır).
  Elle çizilmiş ağaçlar “Ağaç Ayarları → Otomatik yerleşime geç” ile dönüştürülebilir (kaydedene kadar geri alınır).
- Tema: Altın / Mor / **Özel renk** (tek vurgu renginden kutu ve çizgi renkleri türetilir). Kaydet → yerel taslak; yayın için
  Veri & Yayın'dan `familytree.json` dışa aktarılıp `data/` klasörüne konur.

---

# v13 notu: Çevrimiçi kitap okuyucu + Bölüm Metni Editörü

**Okuyucu (`oku.html?b=<bölüm no>`)** — her bölümün paylaşılabilir adresi var.
- Kaydırmalı okuma; yapışkan üst çubuk (aşağı kaydırınca gizlenir), ilerleme çizgisi, tahmini okuma süresi.
- **Ayarlar (Aa):** yazı boyutu, yazı tipi (Klasik/Kitap/Sade), satır aralığı, sütun genişliği, hizalama,
  tema (Site / Açık / Sepya / Koyu). Tercihler tarayıcıda saklanır. Site açık/koyu temasıyla uyumlu.
- **Kaldığın yerden devam** (konum saklanır), bölüm sonunda okundu işareti, içindekiler, önceki/sonraki bölüm.
- Mobil uyumlu: ayarlar ve içindekiler alttan açılan sayfa; yatay taşma yok.
- Metindeki Wiki bağlantıları **kalın** görünür ve **yeni sekmede** açılır (karakter, tanrı, hane, devlet;
  şehir/eyalet → `lore.html#yer-<eyalet>` Coğrafya kartı).
- İngilizce: metin yoksa Türkçe gösterilir ve bir bildirim çıkar.

**`bolumler.html`** artık bölüm listesi / kütüphane: "Okumaya başla / Kaldığın yerden devam et" kartı,
okuma süreleri, kilitli bölümler için "yakında". (Eski, yalnızca özet gösteren okuma katmanı kaldırıldı.)

**Yönetim Paneli → Bölümler → "Metni Düzenle"** (tam ekran editör, `assets/js/admin-book.js`)
- Araç çubuğu: kalın, italik, başlık, alt başlık, alıntı, sahne ayracı, görsel, Wiki bağlantısı, bağlantıyı kaldır.
  Kısayollar: Ctrl+B, Ctrl+I, Ctrl+K (Wiki bağlantısı), Ctrl+S (kaydet), Ctrl+Z / Ctrl+Shift+Z.
- **Canlı önizleme** okuyucuyla aynı motoru kullanır (gördüğünüz = okuyucunun gördüğü). Mobilde Yaz / Önizleme sekmeleri.
- **Wiki bağlantısı:** metni seçin → Wiki bağlantısı (veya Ctrl+K) → ad arayıp sayfayı seçin. Mevcut bağlantıyı değiştirmek için
  imleci üstüne koyup aynı düğmeyi kullanın.
- **Otomatik öner:** metinde geçen karakter/tanrı/hane/devlet/şehir adlarını bulur; siz onaylamadan hiçbir şey değişmez.
  Birden çok sayfaya uyan adlar (ör. "Stallhart": hane mi devlet mi) için seçimi siz yaparsınız. Tek Ctrl+Z ile geri alınır.
- **Görsel:** dosya yükle veya depo yolu; boyut (küçük/orta/tam), hizalama (sol/orta/sağ), alt yazı. Görseller kütüphanesi (indir/sil).
  Yüklenenler gömülü tutulur; yayın için indirip `assets/images/chapters/` altına koyun (bkz. oradaki README).
- **Güvenlik/dayanıklılık:** metin asla ham HTML çalıştırmaz; kırık Wiki bağlantıları uyarılır; kaydedilmemiş değişiklikte
  kapatma/sekme kapama uyarısı; 2 sn'de bir otomatik taslak yedeği (çökme sonrası geri yükleme); depolama dolarsa veri bozulmaz.
- Her bölümde **TR ve EN** metin sekmesi, **"Okuyucuda yayında"** anahtarı.

**Veri:** `data/book.json` (bölüm metinleri, tek dosya) — `chapters.json` bölüm bilgilerini, `book.json` metinlerini tutar.
PDF'ten (Cilt I) 14 bölüm aktarıldı (1–8, 10–15); **Bölüm 9 PDF'te yok**, listede "yakında" görünür.
Metin biçimi (Markdown alt kümesi): `**kalın**`, `*italik*`, `## Başlık`, `> alıntı`, `---` ayraç,
`[ad](wiki:character:id)`, `![alt](img:g1 "boyut=orta hiza=sag")`.

---

# v12 notu: Tanrı sembolleri + Yönetim Paneli → Tanrılar

- **Tek görsel, iki sayfa:** `tanrilar.html` (Daire'deki yuvarlak semboller) ve `tanri-detay.html` (amblem +
  karşı kutup kartı) aynı görseli `lore.json → gods[].image` alanından okur.
- **Görsel yolu:** `assets/images/gods/<id>.png` (ör. `galdra.png`). Alan boşsa ya da dosya yoksa site sırayla
  `<id>.png`, `<id>.jpg` dener; hiçbiri yoksa baş harf rozeti görünür. Dosya adları `assets/images/gods/README.txt` içinde.
- **Yönetim Paneli → Tanrılar:** her tanrının gerçek ismi, epiteti, fraksiyonu, **sembol tarifi**, rol / psikoloji / ritüel
  metinleri ve **sembol görseli** düzenlenir (TR/EN). Görsel dosya yüklenerek ya da yol yazılarak verilir.
  Yüklenen görsel en fazla 512 px'e küçültülür; **"Dosya olarak indir"** düğmesi dosyayı tam olarak `<id>.png|jpg`
  adıyla indirir — `assets/images/gods/` klasörüne koyabilirsiniz.
- Yayın akışı diğer modüllerle aynı: **Veri & Yayın → `lore.json` dışa aktar** → `data/` klasörüne commit.
- Tanrı eklenip silinmez: Daire'deki yerleşim (`ROWS`) ve denge çiftleri (`PAIRS`) kimliklere bağlı sabit bir düzendir.
- `lore.json` → `gods[]` her kayda `symbol` (çift dilli) ve `image` alanı eklendi; sembol tarifleri artık
  `tanri-detay.html` içinde sabit kodlu değil, panelden düzenlenir.

---

# v11 notu: Hane bayrakları

- `hane-detay.html`: hane adının sol üstünde bayrak görseli (kırpılmadan, çerçeveli; tıklayınca tam ekran).
  Yüklenmemişse **"Bayrak henüz yüklenmemiş"**, yol bozuksa "Bayrak görseli yüklenemedi" yazar.
- `haneler.html`: her kartta adın solunda küçük bayrak; yoksa kesikli yer tutucu + aynı uyarı.
- **Yönetim Paneli → Haneler → Düzenle**: Bayrak (dosya yükle veya `assets/images/banners/…` yolu),
  Motto ve Heraldik Sembol alanları. Yüklenen bayrak en fazla 400 px'e küçültülür; yayın için görseli
  "Dosya olarak indir" ile alıp `assets/images/banners/` klasörüne koyun ve alanına yolunu yazın.
- Düzeltme: hane editörü kaydederken `motto`, `tierLabel`, `notable` gibi alanları siliyordu; artık korunuyor.
- Eski, hiçbir sayfada kullanılmayan "Logo Görseli" alanı formdan kaldırıldı (veri silinmez).

---

# Stallhart Wiki — v10 notu: Devlet sayfaları + Devletler yönetimi

`krallik-detay.html?id=…` her devlet için tek şablonla şu bölümleri üretir:

1. **Bayrak & Sancak** — sayfanın sol üstünde geniş heraldik sergi + bayrağın kanonik tarifi.
   Görsel yoksa "Bayrak yüklenmedi", yol bozuksa "Bayrak görseli yüklenemedi" yazar.
2. **Sicil (infobox)** — başkent, yönetim biçimi, hükümdar (satır etiketi Hükümdar / Melik / Han olarak
   değiştirilebilir), resmî ve fiilî nüfus, yüzölçümü, para birimi, resmî din.
3. **Tarihçe & Kronoloji** — yıl + tür (Kuruluş / Savaş / Anlaşma / Diğer) + metin.
4. **Bölgesel Harita** — devlete özel PNG/JPG. Yoksa "Harita yüklenecek" yazar. Tıklayınca tam ekran açılır.
5. **Askerî & İktisadi Güç** — güçlü/zayıf yönler, garnizon & ordu, ihraç ürünleri & madenler.

**Yönetim Paneli → Devletler** sekmesinden tüm alanlar düzenlenir. Bayrak ve harita için iki yol vardır:

| Yol | Nasıl | Ne zaman |
|---|---|---|
| Dosya yükle | PNG/JPG/WebP seç; tarayıcıda küçültülüp kayda gömülür | Hızlı deneme; yalnızca bu tarayıcıda görünür, `kingdoms.json` büyür |
| Depo yolu | `assets/images/kingdoms/xxx.png` yaz, dosyayı depoya koy | **Yayın için önerilen** — JSON hafif kalır |

Yüklenen bir görseli editörde **"Dosya olarak indir"** ile küçültülmüş hâliyle indirip depoya koyabilir,
sonra alanına yolunu yazabilirsiniz. Yayın için her zaman **Veri & Yayın → Dışa Aktar → `kingdoms.json`**
dosyasını `data/` klasörüne koyup commit edin.

Yeni `kingdoms.json` alanları (hepsi opsiyonel): `flagImage`, `regionMap`, `rulerTitle` (çift dilli),
`history[] = { year, type: founding|war|treaty|other, text: {tr,en} }`,
`garrison` / `exports` / `strengths` / `weaknesses` = `{ tr: [...], en: [...] }`.

---

# Stallhart Wiki — v9

Stallhart Destanı evreni için statik wiki sitesi. Sunucu tarafı kod gerektirmez;
GitHub Pages üzerinde doğrudan yayınlanır.

---

## Bu sürümde düzeltilen hatalar

### 1. Her sayfada "Yükleniyor…" ekranında donma — **kök neden**

`assets/js/wiki.js` değişkenlerini (`Lang`, `esc`, `loadData`, `groupClass` …)
global kapsamda tanımlıyordu. Her sayfa da betiğinin başında şunu yazıyordu:

```js
const { Lang, loadData, esc } = Wiki;
```

Aynı isim iki kez `const` ile tanımlandığı için tarayıcı şu hatayı veriyordu:

```
Uncaught SyntaxError: Identifier 'Lang' has already been declared
```

Sözdizimi hatası **betiğin tamamını** düşürür — tek bir satır bile çalışmaz.
Bu yüzden sayfada ne üst menü beliriyor, ne veri yükleniyor; ekranda yalnızca
HTML'e gömülü statik "Yükleniyor…" yazısı kalıyordu. Gönderdiğiniz ekran
görüntüsünde menünün hiç görünmemesi bu hatanın imzasıdır.

**Çözüm:** `wiki.js`'in tamamı bir IIFE içine alındı. Dışarıya yalnızca
`window.Wiki` açılıyor, global ad çakışması kalmadı.

### 2. GitHub Pages alt dizininde veri dosyalarının bulunamaması

`getBasePath()` temel yolu `location.pathname` içindeki `/` sayısından
hesaplıyordu:

```js
const depth = (location.pathname.match(/\//g) || []).length - 1;
return depth > 0 ? '../'.repeat(depth) : './';
```

Site `kullanici.github.io/depo/karakterler.html` adresinde yayınlandığında bu
hesap `../` üretiyor, `data/characters.json` isteği site köküne gidiyor ve
**404** dönüyordu.

**Çözüm:** Temel yol artık `wiki.js`'in kendi `<script src>` adresinden
türetiliyor. Site kökte, alt dizinde veya yerel sunucuda — her koşulda doğru.

### 3. `karakterler.html` ve `haneler.html` — kapanmayan `try` bloğu

Her iki dosyada da `catch`/`finally` olmayan bir `try {` bloğu vardı
(`SyntaxError: Missing catch or finally after try`). 1. maddedeki hatadan
bağımsız, ikinci bir betik çökmesi kaynağı.

**Çözüm:** Gerçek `catch` blokları eklendi; hata durumunda kullanıcıya
ne yapması gerektiğini anlatan görünür bir mesaj basılıyor.

### 4. Harita yüklenmiyor, ölçek düğmeleri çalışmıyor

- **Yükleme yarışı:** `<img onload="onImgLoad()">` satır içi kancası, görsel
  önbellekten anında geldiğinde fonksiyon henüz tanımlanmadan tetikleniyordu.
  Sonuç: yükleme katmanı kalkmıyor, `resetView()` çalışmıyor ve harita 1:1
  devasa ölçekte kalıyordu (ekran görüntüsündeki dev "KHASINIA" yazısı).
  → Artık `addEventListener` + `img.complete` kontrolü kullanılıyor.
- **Ters düğmeler:** "+" (Yakınlaştır) düğmesi `zoomBtn(0.7)` yani
  *uzaklaştırma* çağırıyordu. → Yönler düzeltildi (`1.4` / `1/1.4`).
- **Tıklama/sürükleme çakışması:** SVG katmanı `pointer-events: all` olduğu
  için sürükleme ile bölge tıklaması karışıyordu; haritayı kaydırıp fareyi
  bırakınca bilgi paneli açılıyordu. → SVG katmanı `pointer-events: none`,
  yalnızca poligonlar tıklanabilir; ayrıca 6 pikselden fazla hareket eden
  tıklamalar yok sayılıyor.
- **Menü örtmesi:** Sabit navigasyon araç çubuğunu kapatıyordu.
  → `body`'ye `padding-top: 54px`.
- **Eklenenler:** ölçek çubuğu ve yüzde göstergesi, sınıra gelince pasifleşen
  düğmeler, klavye kısayolları (`+` / `-` / `0`), pencere yeniden
  boyutlandırmada yeniden oturtma, `#bolge` adresine doğrudan gitme.

### 5. Görsel boyutları — 33 MB → 3 MB

| Dosya | Önce | Sonra |
|---|---|---|
| Siyasi harita | 18,5 MB PNG | 1,5 MB JPEG (aynı çözünürlük) |
| Ana sayfa harita önizlemesi | 18,5 MB (tam dosya) | 204 KB ayrı önizleme |
| Karakter görselleri (4 adet) | 14,9 MB PNG | 822 KB JPEG |
| Logo | 545 KB | 103 KB |

Görsellerde saydamlık kullanılmadığı doğrulandıktan sonra JPEG'e çevrildi;
logo saydamlığı koruduğu için PNG kaldı.

### 6. Diğer düzeltmeler

- `bolumler.html`: Kayıtlı okuma teması geri yüklenirken overlay'e `open`
  sınıfı sabit ekleniyordu — sayfa açılır açılmaz okuma modu tam ekran
  açılıyordu. Artık açık/kapalı durumu korunuyor.
- `soy-agaci.html`: Dil tercihini ayrı bir anahtarda (`si-lang`) tutuyordu;
  sayfa diğerlerinden farklı dilde açılabiliyordu. Ortak `sw-lang` anahtarına
  taşındı (eski değer bir kereliğine otomatik aktarılıyor).
- `characters.json`: Var olmayan `zeandor.png` dosyasına işaret ediyordu (404).
  Ayrıca `amadon` ve `edlas`, başka karakterlerin portrelerini kullanıyordu;
  yanlış eşleşmeler kaldırıldı.
- Fontlar CSS `@import` yerine her sayfanın `<head>` bölümünde `<link>` ile
  yükleniyor (stil dosyası inene kadar font isteği gecikmiyor).
- Satır içi `onclick` kancaları olay dinleyicilerine çevrildi.
- Tüm dinamik metinler `esc()` ile kaçırılıyor (HTML enjeksiyonu koruması).
- `404.html`, `.nojekyll`, `robots.txt` eklendi.
- `prefers-reduced-motion` desteği ve klavye odak göstergeleri eklendi.

---

## Doğrulama

Tüm sayfalar gerçek bir tarayıcıda (Chromium, headless) test edildi:

- 11 sayfa yüklendi — **0 JavaScript hatası**, 0 kırık bağlantı.
- Kök dizinde (`site.com/`) **ve** alt dizinde (`site.com/depo/`) çalışıyor.
- `file://` ile açıldığında anlaşılır bir uyarı gösteriyor.
- Mobil (390 px): hamburger menü açılıyor, yatay taşma yok, harita yükleniyor.
- Harita: yakınlaştırma yönleri doğru, sıfırlama çalışıyor, bölge tıklama ve
  lejant çalışıyor, sürükleme sonrası panel açılmıyor.
- Karakterler: 25 kart, hane/durum filtreleri, arama, yer imleri, dil değişimi.
- Bölümler: okuma modu açılıyor/kapanıyor, tema kaydediliyor, sayfa yenilendiğinde
  kendiliğinden açılmıyor, ilerleme takibi çalışıyor.
- Haneler: 44 hane, 7 devlet. Lore: 23 terim, 24 olay. Sözler: 22 alıntı.
- Küresel arama (Ctrl+K) sonuç döndürüyor.
- Dil tercihi sayfalar arasında korunuyor.

---

## v8'de eklenenler

### Gelişmiş Yönetim Paneli (`admin.html`)
Panel sıfırdan yazıldı. Sekiz modül:

| Modül | Kapsam |
|---|---|
| **Pano** | İçerik sayıları, durum dağılımı, yayınlanmamış değişiklik uyarısı |
| **Karakterler** | Ad, unvan, hanedan, grup, hayatta kalma durumu, **silah/eşya**, doğum yeri, bağlılık, lakap, **ünlü sözü**, biyografi, **portre görseli** (canlı önizlemeli), müttefik/düşman seçimi, bölüm listesi |
| **Bölümler** | Yay, bölüm no, KS, başlık, POV, özet, ilk cümle, yayın durumu, **etiketler** |
| **Tarih Şeridi** | Kronolojik olaylar, olay türü, **etiketler** |
| **Sözlük** | Evren terimleri — buraya eklenen her terim sitede otomatik tooltip kazanır |
| **Sözler** | Alıntı metni, konuşan, tema, karakter bağlantısı, etiketler |
| **Görsel & Medya** | Harita, logo ve tüm portrelerin **yol denetimi**; kırık yollar kırmızı işaretlenir |
| **Veri & Yayın** | Dosya bazlı dışa/içe aktarma, toplu indirme, taslak sıfırlama, parola değiştirme |

Ortak özellikler: çift dilli (TR/EN) form alanları, anlık arama, doğrulama, tema uyumlu
onay kutuları, bildirimler, `Esc` ile kapatma, `Ctrl+S` ile kaydetme, tam mobil uyum.

### Canlı veri saklama (`Store`)
`wiki.js` içine bir veri katmanı eklendi:

```
data/*.json  (depoda yayınlanan temel veri)
     ↓
localStorage "sw-db:<dosya>"  (admin panelinin yazdığı taslak)
     ↓  loadData() bunu temel verinin üzerine bindirir
tüm site sayfaları
```

Admin'de yapılan ekleme/düzenleme/silme, sayfa yenilendiğinde karakterler, bölümler,
sözler, sözlük ve kronik sayfalarına anında yansır. Yerel taslak varken sitede sol altta
**"Yerel taslak görüntüleniyor"** rozeti belirir; böylece yayındaki hâlle karıştırılmaz.

> Bu panel sunucuya yazmaz. Değişiklikleri herkesin görmesi için **Veri & Yayın →
> Dışa Aktar** ile JSON dosyalarını indirip depodaki `data/` klasörüne koyup commit edin.

### Wiki tooltip sistemi
Metin içinde geçen karakter adları ve sözlük terimleri otomatik algılanır; üzerine
gelindiğinde tür, unvan, kısa açıklama ve maddeye bağlantı içeren bir mini kart açılır.

- Tarama yalnızca izin verilen kapsayıcılarda ve **yalnızca metin düğümlerinde** yapılır;
  mevcut bağlantılar, başlıklar ve HTML yapısı bozulmaz.
- Kelime sınırı denetimi var — kelime ortasında eşleşme olmaz.
- Aynı konumda birden çok terim varsa en uzunu kazanır ("Lun Aldris" → "Lun"dan önce).
- Klavye ile odaklanılabilir; kart ekran dışına taşmaz, yer yoksa alta açılır.
- Dil değişince işaretler sıfırlanıp yeniden taranır.

### Renk paleti ve tipografi
Palet, proje tanımındaki dört renk üzerine kuruldu ve **tüm sayfalarda tek kaynaktan**
(`styles.css` `:root`) yönetiliyor. Hiçbir sayfada sabit renk kullanılmıyor:

```css
--parchment: #f4ecd8;   /* eskitilmiş parşömen */
--charcoal:  #121212;   /* koyu kömür grisi    */
--blood-red: #8b0000;   /* kan kırmızısı       */
--rust:      #b87333;   /* pas rengi           */
```

Tipografi de değişkene bağlandı: gövde metinleri **Merriweather**, başlıklar
**IM Fell English** (antika/gotik karakterli). Admin paneli dahil her sayfa aynı iki fontu
kullanır. Saf beyaz arka plan hiçbir yerde yok.

### Şema genişletmeleri
- `characters.json` → `weapon` (silah/eşya, çift dilli)
- `chapters.json` → `tags`
- `lore.json` events → `tags` (mevcut olaylar türlerine göre otomatik etiketlendi)
- `quotes.json` → `tags`

### v8'de düzeltilen ek hatalar
- **Admin verisi siteye yansımıyordu.** Eski panel `localStorage`'a `sw-admin-*`
  anahtarlarıyla yazıyordu; site sayfaları bu anahtarları hiç okumuyordu. Ortak `Store`
  katmanıyla iki taraf aynı veriyi kullanıyor.
- **Boş ızgara gözü:** Pano istatistik ızgarasında dolu blok gibi görünen boşluk giderildi.
- **Tooltip çoklu eşleşme:** İlk sürüm metin düğümü başına yalnızca bir terim işaretliyordu;
  artık düğüm başına sekize kadar farklı terim işaretleniyor.
- **Harita ezilmesi:** Responsive için eklenen genel `img { max-width: 100% }` kuralı harita
  görselini yatay olarak sıkıştırıyordu; harita sayfasında geçersiz kılındı.

---

## v8 doğrulama özeti

Gerçek tarayıcıda (Chromium, headless) çalıştırılan testler:

| Test | Sonuç |
|---|---|
| 11 sayfa yükleme | 0 JS hatası, tüm sayfalarda menü tam |
| Kök dizin **ve** `/depo/` alt dizini | İkisinde de veri yükleniyor |
| `file://` ile açma | Anlaşılır uyarı gösteriliyor |
| Mobil 390 px | Yatay taşma yok, menü ve admin çalışıyor |
| Harita | Yakınlaştırma yönleri doğru, sürükleme panel açmıyor |
| Admin: karakter ekle/düzenle/sil/ara | 25 → 26 kayıt, düzenleme yansıyor |
| Admin: bölüm, alıntı, terim, olay ekleme | Dördü de başarılı, etiketler kaydediliyor |
| Admin: boş zorunlu alan | Doğrulama hatası veriyor, kayıt engelleniyor |
| Admin: medya yol denetimi | 7 görsel geçerli, 0 kırık |
| Admin: dışa aktarma | İndirilen JSON yeni kaydı içeriyor |
| **Siteye yansıma** | Yeni karakter/bölüm/alıntı ilgili sayfalarda görünüyor |
| Admin: sıfırlama | Site depodaki 25 karaktere geri dönüyor |
| Tooltip | Sayfa başına 4–35 işaret, kart açılıyor, ekran dışına taşmıyor |

---

## v9'da eklenenler — kaynak belgelerin tam analizi

Yüklenen 11 kaynak belgesi (KARAKTERLER, COĞRAFYA, DİNLER, EYALETLER,
HANEDAN_FİZİKSEL, HUKUMDAR_KRONOLOJİ, İMPARATORLAR, ORTAK_LİSAN,
BAYRAKLAR_VE_BETİMLEMELERİ, YÖNETİM, STALLHART_EVRENİ — toplam ~18.000 satır)
programatik olarak ayrıştırılıp mevcut veri setinin üzerine işlendi.

### Veri genişlemesi

| Dosya | Önce | Sonra | Kaynak |
|---|---|---|---|
| `characters.json` | 25 karakter | **129 karakter** | KARAKTERLER.docx (150 giriş ayrıştırıldı, 104'ü yeni kart oldu, 24'ü mevcut kartı zenginleştirdi) |
| `lore.json` — olaylar | 24 | **77** | HUKUMDAR_KRONOLOJİ.docx (21 hükümdarın saltanat olayları) |
| `lore.json` — sözlük | 23 | **33** | YÖNETİM.docx (vezirlik hiyerarşisi) + DİNLER.docx |
| `lore.json` — tanrılar | yok (hardcoded) | **15 tanrı + 2 fraksiyon + 1 kült** | DİNLER.docx |
| `houses.json` | 9 eyalet | 9 eyalet + **bayrak/ekonomi/komşu/şehir** | BAYRAKLAR_VE_BETİMLEMELERİ.docx + COĞRAFYA.docx |
| `kingdoms.json` | 7 devlet | 7 devlet + **23 devletlik dünya sıralaması** | COĞRAFYA.docx |
| **`geography.json`** *(yeni)* | — | genel bakış, nehirler, dağlar, ormanlar, 13 eyalet detayı, başkent Arava | COĞRAFYA.docx |
| **`language.json`** *(yeni)* | — | gramer özeti + **482 sözcüklük** Ortak Lisan sözlüğü | ORTAK_LİSAN.docx |

Karakterlerin grup (hane) ve durum (yaşıyor/ölü/tarihsel) alanları, kaynak
metindeki bölüm başlıkları ve ölüm/vefat ifadeleri taranarak otomatik
çıkarıldı; hiçbiri elle atanmadı. 10 karakter, HUKUMDAR_KRONOLOJİ'deki saltanat
tarihleriyle doğrudan eşleştirilip `reignNote` alanıyla zenginleştirildi.

### Site entegrasyonu

- **`lore.html`**: "Coğrafya" ve "Din" sekmeleri artık sabit kodlanmış HTML
  yerine `geography.json`/`lore.json`'dan **veri odaklı** render ediliyor.
  Yeni **"Ortak Lisan"** sekmesi eklendi — 482 kelimelik sözlükte arama
  yapılabiliyor (performans için varsayılan 60 sonuçla sınırlı).
- **`haneler.html`**: her eyalet kartı artık bayrak betimlemesi, geçim
  kaynağı, komşular ve şehirleri gösteriyor; "Devletler" sekmesine 23
  devletlik dünya güç sıralaması tablosu eklendi.

### Sağlamlaştırma (defensive programming)

- **Fallback / mock veri.** `wiki.js`'teki `loadData()` artık başarısız bir
  ağ isteğinde önce bir kez daha dener, ikinci deneme de başarısız olursa
  ilgili dosya için gömülü **örnek veriye düşer** ve kullanıcıya görünür ama
  engellemeyen bir uyarı gösterir. Sonuç: `file://` ile açma, CORS hatası,
  sunucu kesintisi veya bozuk JSON — hiçbir koşulda sayfa sonsuz
  "Yükleniyor…" durumunda kalmıyor veya boş/çökmüş görünmüyor. Doğrulandı:
  `file://` altında açılan `karakterler.html` artık 1 örnek kart + görünür
  uyarı şeridiyle yükleniyor, konsol hatası vermiyor.
- **Event delegation.** `karakterler.html`, `bolumler.html` ve
  `admin.js`'teki **beş modülün tamamı** artık kart/satır başına listener
  eklemek yerine kapsayıcı üzerinde **tek bir delegasyon listener'ı**
  kullanıyor (`ROW_ACTIONS` kayıt tablosu). Bu, hem performansı artırıyor
  hem de admin panelinden veya `localStorage`'dan gelen dinamik içeriğin
  tıklama işlevselliğini asla kaybetmemesini garanti ediyor.
- **Güvenli zincirleme.** Yeni render fonksiyonlarının tamamı (`renderGods`,
  `renderGeography`, `renderLanguage`) eksik/boş veri karşısında `?.` ve
  `||` ile çöküşe karşı korunuyor; her biri kendi `try/catch` bloğunda
  yükleniyor, biri başarısız olsa da diğer sekmeler çalışmaya devam ediyor.

### Admin paneline eklenenler

- **Coğrafya** modülü: 13 eyaletin (komşular, şehirler, bayrak, ekonomi) ve
  23 devletlik dünya sıralamasının tam CRUD'u (ekle/düzenle/sil).
- **Ortak Lisan** modülü: 482 kelimelik sözlükte arama + CRUD.
- `FILES` listesi `geography.json` ve `language.json`'ı da kapsayacak
  şekilde genişletildi — Veri & Yayın sekmesinden dışa aktarılabiliyor.

### v9 doğrulama özeti

| Test | Sonuç |
|---|---|
| 11 sayfa (tam regresyon) | 0 JS hatası, tüm menüler tam |
| Kök dizin ve `/depo/` alt dizini | 129 karakter kartı, ikisinde de |
| `file://` ile açma | Artık boş değil — mock veri + uyarı şeridi, 0 konsol hatası |
| lore.html: Coğrafya sekmesi | 9 genel bakış kartı, 13 eyalet, 23 devletlik sıralama |
| lore.html: Din sekmesi | 15 tanrı, 2 fraksiyon, 2 kült/doktrin kartı |
| lore.html: Ortak Lisan sekmesi | 482 sözcük, arama çalışıyor ("kılıç" → 3 sonuç) |
| haneler.html | Eyalet coğrafya notları + 23 devletlik sıralama, akordeon delegasyonu çalışıyor |
| Admin: Coğrafya CRUD | Eyalet 13→14→13, güç sıralaması 23→24→23 |
| Admin: Ortak Lisan CRUD | Sözlük 482→483→482, arama doğrulandı |
| Admin: mevcut 5 modül (delegasyon sonrası regresyon) | Karakter 129→130→129, düzenleme/silme çalışıyor |
| Mobil (390px) | Yatay taşma yok, hamburger menü çalışıyor |

---

## Admin paneline giriş

`admin.html` → varsayılan parola **`stallhart`**.
Girişten sonra **Veri & Yayın → Parola** bölümünden değiştirin.

> **Güvenlik notu:** Bu parola yalnızca panelin kazara açılmasını engeller. Tamamen
> istemci tarafındadır ve gerçek bir erişim denetimi değildir — statik bir sitede bunun
> güvenli bir yolu yoktur. `admin.html` herkese açık olacaksa, hassas hiçbir şey
> saklamayın; gerçek koruma isteniyorsa panel ayrı ve kimlik doğrulamalı bir ortamda
> barındırılmalıdır.

> **v16:** `assets/js/config.js` doldurulursa (bkz. `supabase/KURULUM.md`) giriş bu yerel parolayla değil, **Vakanüvis (yönetici) hesabıyla**
> yapılır ve yetki denetimi veritabanındadır. Boş bırakılırsa yukarıdaki yerel parola geçerlidir.

---

## Yayınlama

1. Bu klasörün **içindekileri** deponun köküne kopyalayın.
2. GitHub'da **Settings → Pages → Source: Deploy from a branch** seçin,
   dal olarak `main` ve klasör olarak `/ (root)` belirleyin.
3. Birkaç dakika içinde `https://kullanici-adi.github.io/depo-adi/`
   adresinde yayına girer.

`.nojekyll` dosyası, Jekyll'in alt çizgiyle başlayan dosyaları yok saymasını
engeller — **silmeyin**.

### Yerel önizleme

```bash
python3 -m http.server 8000
# tarayıcıda: http://localhost:8000
```

Dosyalara çift tıklayarak (`file://`) açmayın; tarayıcılar bu modda JSON
okumaya izin vermez.

---

## Görseller: WebP + srcset (otomatik)

Görsel eklerken **iş akışın değişmez**: dosyayı `assets/images/...` altına PNG ya da JPG
olarak koy, JSON'a yine `.png` / `.jpg` yolunu yaz. Gerisi otomatik:

1. Depoya görsel yüklenince **GitHub Action** (`.github/workflows/optimize-images.yml`)
   `scripts/optimize-images.py`'yi çalıştırır. Her görselin yanına bir `.webp` kopyası
   ve küçük boyutlu sürümleri (`-240w`, `-480w`, `-960w`) üretir, `assets/images/manifest.json`'u günceller.
2. Site, manifestte karşılığı olan görsellerde WebP + `srcset` + `loading="lazy"` kullanır.
   Manifestte yoksa (Action henüz çalışmadıysa) **orijinali** gösterir; hiçbir görsel kırılmaz.

**Orijinal dosyalar asla değişmez ya da silinmez.** Yakınlaştırma (lightbox) tam sürümü (en fazla 2000 px) açar.

| Konu | Ayar (`scripts/optimize-images.py` başında) |
|---|---|
| Kalite | PNG kaynak q88, JPEG kaynak q85; düz renkli grafik/logo **kayıpsız** |
| Şeffaflık | Korunur (WebP alfa destekler) |
| En büyük tam sürüm | `MAX_FULL_W = 2000` px |
| Dönüştürülmeyenler | `SKIP` listesi: `SIYASI_HARITA.jpg`, `maps/` (okunan büyük haritalar) |

Elle çalıştırmak: `pip install pillow && python3 scripts/optimize-images.py` (`--force` hepsini yeniden üretir).
GitHub'da: Actions → *Görselleri optimize et* → Run workflow.

Önerilen boyutlar: portre 800–1600 px genişlik, bayrak/arma 600–1200 px, krallık/bölge görseli ≤ 2000 px.
Yeni bir şablonda görsel gösterirken `<img ${Wiki.imgAttrs(yol, '(max-width:600px) 90vw, 320px')} alt="…">`
kullan (`src`, `srcset`, `sizes`, `lazy`, `decoding` üretir; sayfanın en üstündeki görselde `{eager:true}`).

## Dosya yapısı

```
├── index.html              Ana sayfa
├── karakterler.html        Karakter listesi (filtre, arama, yer imi)
├── karakter-sablon.html    Karakter detayı  (?id=zeandor)
├── haneler.html            Soylu haneler ve devletler
├── lore.html               Evren ansiklopedisi (tarih, din, sözlük)
├── harita.html             İnteraktif siyasi harita
├── bolumler.html           Bölüm listesi ve okuma modu
├── soy-agaci.html          Soy ağacı
├── sozler.html             Alıntılar
├── forum.html              Kurultay — forum ana sayfası (kategoriler, son konular)
├── forum-kategori.html     Kurultay — kategori bazlı konu listesi
├── forum-konu.html         Kurultay — konu detayı + yanıtlar (Divan bileşeni)
├── admin.html              Gelişmiş içerik yönetim paneli
├── 404.html                Bulunamadı sayfası
├── .nojekyll               GitHub Pages için gerekli
├── robots.txt
├── assets/
│   ├── css/styles.css      Ortak stiller ve tasarım değişkenleri
│   ├── css/admin.css       Yönetim paneli stilleri
│   ├── css/kurultay.css    Kurultay (forum) stilleri
│   ├── js/wiki.js          Ortak modül (nav, dil, arama, Store, tooltip)
│   ├── js/kurultay.js      Kurultay veri erişimi ve ortak arayüz üretimi
│   ├── js/admin.js         Yönetim paneli mantığı
│   ├── js/config.js        Topluluk katmanı ayarları (Supabase adresi + anon anahtar)
│   ├── js/patches.js       İçerik yama motoru (tarayıcı + admin + Node)
│   ├── js/community*.js    Giriş/profil (çekirdek), Divan Tartışması, Öneri Sun
│   ├── js/admin-community.js  Admin: öneriler, yorumlar, kullanıcılar, yamalar
│   ├── css/community.css   Topluluk arayüzü (modallar, parşömen yorum alanı)
│   └── images/             Harita, logo, karakter görselleri
├── supabase/               schema.sql (veritabanı) + forum-schema.sql (Kurultay) + KURULUM.md
├── scripts/sync-patches.mjs  Onaylı yamaları JSON'a işleyen betik (isteğe bağlı)
├── .github/workflows/      sync-patches.yml (isteğe bağlı otomasyon)
└── data/
    ├── characters.json     129 karakter (silah/eşya, isim anlamı, akrabalık alanları dahil)
    ├── chapters.json       11 bölüm, yaylar
    ├── houses.json         44 hane, eyaletlere göre
    ├── kingdoms.json       7 devlet
    ├── lore.json           24 olay, 23 sözlük terimi
    └── quotes.json         22 alıntı
```

## İçerik düzenleme

Metinler kod içinde değil, `data/*.json` dosyalarındadır. Her alan
`{ "tr": "…", "en": "…" }` biçimindedir; yalnızca `tr` doldurulursa İngilizce
görünümde de Türkçe metin gösterilir.

Düzenlemenin kolay yolu `admin.html` panelidir: değişiklikleri tarayıcıda yapar,
sitede anında gösterir, ardından **Veri & Yayın → Dışa Aktar** ile depoya konulacak
JSON dosyalarını üretir. Panel artık GitHub erişim jetonu istemez — jeton tarayıcıda
saklamak güvenli olmadığı için bu akış indir-ve-commit yöntemiyle değiştirildi.

---

## Tarayıcı desteği

Chrome, Edge, Firefox, Safari — güncel sürümler. Mobil dahil.
JavaScript kapalıysa sayfa iskeleti görünür ancak liste içerikleri yüklenmez.
