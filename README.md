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
├── admin.html              Gelişmiş içerik yönetim paneli
├── 404.html                Bulunamadı sayfası
├── .nojekyll               GitHub Pages için gerekli
├── robots.txt
├── assets/
│   ├── css/styles.css      Ortak stiller ve tasarım değişkenleri
│   ├── css/admin.css       Yönetim paneli stilleri
│   ├── js/wiki.js          Ortak modül (nav, dil, arama, Store, tooltip)
│   ├── js/admin.js         Yönetim paneli mantığı
│   └── images/             Harita, logo, karakter görselleri
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
