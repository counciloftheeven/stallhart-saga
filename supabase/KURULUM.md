# Topluluk Katmanı — Sıfırdan Kurulum Rehberi (hiç bilmeyene)

Bu rehber, daha önce hiç veritabanı ya da "backend" kurmamış birine göre yazıldı. Her adımda **nereye tıklayacağını** ve **ne göreceğini** yazdım.
Toplam süre: 20–30 dakika. Kredi kartı gerekmez, ücretsizdir.

---

## Önce: bu iş ne, neden gerekiyor?

Siten **GitHub Pages**'te duruyor. Orası yalnızca hazır dosyaları gösterir; kimin kayıt olduğunu, kimin ne yorum yazdığını **hatırlayamaz**.
Bu yüzden bir "hafıza" lazım. O hafıza **Supabase** adlı ücretsiz bir servis olacak:

```
Ziyaretçi ──► senin siten (GitHub Pages) ──► Supabase
                                              (üyeler, yorumlar, öneriler burada saklanır)
```

Senin yapacakların 5 şey:

1. Supabase'de hesap + proje aç
2. Hazır bir SQL dosyasını **kopyala-yapıştır** çalıştır (tabloları kurar)
3. Birkaç ayar yap (giriş e-postaları için)
4. Siteye iki bilgi yaz (proje adresi + anahtar) ve dosyaları GitHub'a yükle
5. Kendi hesabını "Vakanüvis" (yönetici) yap

Kod yazman gerekmiyor.

> **Güvenlik önemi:** Aşağıda "anahtar" diye bir şey kopyalayacaksın. Siteye **yalnızca "publishable" (veya "anon")** anahtarı yazılır — o herkese açık olabilir.
> **"secret" veya "service_role"** yazan anahtar ise bir **şifre gibidir**: onu siteye, GitHub'a, sohbete, hiçbir yere yapıştırma.

---

## Adım 0 — Elindekileri hazırla

- Bir **e-posta adresi** (Supabase hesabı için).
- Sitenin GitHub deposuna (repo) erişimin. Sitenin adresini bul: GitHub'da repo sayfası → **Settings** → soldan **Pages** → üstte
  *"Your site is live at https://KULLANICIADI.github.io/REPOADI/"* yazar. **Bu adresi bir yere not et** (Adım 3'te lazım).
- Bu zip'i bilgisayarında **klasöre çıkar** (sağ tık → "Tümünü ayıkla/Extract"). İçinde `stallhart-saga-main` klasörü çıkar.

---

## Adım 1 — Supabase hesabı ve proje

1. <https://supabase.com> → sağ üstte **Start your project** / **Sign in**. GitHub hesabınla giriş yapmak en kolayı ("Continue with GitHub").
2. Giriş yapınca bir **Organization** oluşturmanı isteyebilir: ad ver (örn. kendi adın), plan olarak **Free** seç → **Create**.
3. **New project** düğmesine bas ve şunları doldur:
   - **Name:** `stallhart-wiki` (istediğin ad)
   - **Database Password:** güçlü bir parola yaz (**Generate a password** düğmesi de var). **Bir yere kaydet.** Sitede bu parolayı kullanmayacaksın ama kaybetme.
   - **Region:** sana yakın olanı seç (örn. *Central EU (Frankfurt)*).
   - **Create new project**.
4. "Setting up your project…" yazısıyla 1–2 dakika bekle. Bitince proje panosu açılır.

---

## Adım 2 — Tabloları kur (SQL'i yapıştır-çalıştır)

"SQL" bir veritabanına verilen komutlardır. Hazır komut dosyamız var; sen sadece yapıştıracaksın.

1. Bilgisayarında `stallhart-saga-main/supabase/schema.sql` dosyasını **Not Defteri** (veya herhangi bir metin editörü) ile aç.
2. **Hepsini seç ve kopyala** (Ctrl+A, Ctrl+C; Mac'te Cmd+A, Cmd+C).
3. Supabase'de sol menüden **SQL Editor**'e (`</>` benzeri simge) tıkla → **New query** (yeni sorgu).
4. Boş kutuya **yapıştır** (Ctrl+V).
5. Sağ altta yeşil **Run** düğmesine bas (kısayol: Ctrl+Enter).
6. Bir uyarı penceresi çıkabilir: *"Potential issue detected / destructive operation"* gibi. Sebebi dosyanın içinde eski kayıtları güncelleyen `drop policy` gibi satırlar olması; **zararsızdır**, **"Run this query"** de.
7. Altta **`Success. No rows returned`** yazısını görmelisin. Bu **doğru** sonuçtur (tablo kurmak satır döndürmez).

Kontrol: sol menüde **Table Editor**'e gir. Şu tabloları görmelisin: `profiles`, `comments`, `comment_seals`, `pending_suggestions`, `content_patches`.

> Hata (kırmızı yazı) aldıysan: dosyanın **tamamını** kopyaladığından emin ol (başından sonuna), sonra tekrar Run de. Dosya güvenle tekrar çalıştırılabilir.

---

## Adım 3 — Giriş (Authentication) ayarları

Kullanıcılar e-posta + parola ile kayıt olacak. Birkaç ayar lazım. Supabase menü adlarını zaman zaman değiştirir; birebir aynısını bulamazsan yakın adı ara.

### 3a) E-posta ile girişi kontrol et
Sol menü → **Authentication** → **Sign In / Providers** (bazı sürümlerde *Configuration → Sign In / Providers*) → **Email**.
- **Enable Email provider** (E-posta girişi): **açık** olmalı (genelde zaten açık gelir).
- **Confirm email** (e-posta doğrulama):
  - **Denerken KAPAT** — kayıt olan kişi anında giriş yapar; test çok kolaylaşır.
  - Site yayına çıkınca **AÇ** — sahte hesapları azaltır. Açıkken kayıt olan kişiye bir e-posta gider, içindeki bağlantıya tıklayınca hesabı aktifleşir.
- Parola en az uzunluğu **8** olsun (site de 8 ister).
- **Save** de.

### 3b) Site adresini tanıt (çok önemli)
Sol menü → **Authentication** → **URL Configuration**:
- **Site URL:** Adım 0'da not ettiğin adres. Örn: `https://KULLANICIADI.github.io/REPOADI/` (sonundaki `/` kalsın)
- **Redirect URLs** → **Add URL:** aynı adresi sonuna `**` ekleyerek yaz: `https://KULLANICIADI.github.io/REPOADI/**`
- **Save**.

Bunu yapmazsan e-postadaki "doğrula" ve "parolamı unuttum" bağlantıları çalışmaz.

> Sitede e-posta gönderimi için Supabase'in **yerleşik e-posta servisi** kullanılır; saatte yalnızca birkaç e-posta gönderebilir.
> Site kalabalıklaşırsa **Authentication → SMTP Settings**'ten kendi e-posta sağlayıcını (Brevo, Resend…) bağlarsın. Şimdilik gerekmez.

---

## Adım 4 — İki bilgiyi kopyala: proje adresi + anahtar

### 4a) Proje adresi (Project URL)
Proje panosunun üstünde **Connect** düğmesi vardır; tıklayınca adres ve anahtar birlikte gösterilir.
Ya da: **Project Settings** (dişli simgesi) → **Data API** / **API** bölümünde **Project URL / API URL** yazar.
Şuna benzer: `https://abcdefghijklmno.supabase.co` → **kopyala**.

### 4b) Anahtar (publishable / anon)
**Project Settings → API Keys** sayfası:
- Yeni sistemde **Publishable key** vardır: `sb_publishable_…` ile başlar. Yoksa **Create new API Keys** düğmesine bas. → **onu kopyala**.
- Eski sistemde **Legacy API Keys** sekmesinde `anon` (public) anahtar vardır; o da **çalışır**, kopyalayabilirsin.

Yalnızca **publishable / anon** olanı al. **`secret` ya da `service_role` yazana dokunma.**

---

## Adım 5 — Bilgileri siteye yaz

Bilgisayarında `stallhart-saga-main/assets/js/config.js` dosyasını Not Defteri ile aç. Şu iki satırı bul:

```js
  supabaseUrl: '',
  supabaseAnonKey: '',
```

Tırnakların **içine** yapıştır (tırnakları silme):

```js
  supabaseUrl: 'https://abcdefghijklmno.supabase.co',
  supabaseAnonKey: 'sb_publishable_xxxxxxxxxxxxxxxxxxxx',
```

Kaydet. (Başka hiçbir yere dokunma.)

---

## Adım 6 — Dosyaları GitHub'a yükle

İki yol var; hangisi kolaysa.

### Yol A — Tarayıcıdan (git bilmene gerek yok)
1. GitHub'da sitenin deposunu aç.
2. **Add file → Upload files**.
3. Bilgisayarındaki `stallhart-saga-main` klasörünün **içindeki her şeyi** (klasörleri de) sürükleyip pencereye bırak.
   Eski dosyaların üstüne yazılır. (Klasörün kendisini değil, **içindekileri** bırak.)
4. Aşağıda **Commit changes** de.

> `.github` klasörü ve `.nojekyll` dosyası **gizli** dosyalardır; Windows/Mac bunları göstermeyebilir. `.nojekyll` zaten depoda var.
> `.github` klasörü yalnızca **isteğe bağlı** otomasyon içindir (Adım 10); yüklenmese de site çalışır.

### Yol B — Git biliyorsan
```
klasörün içindeki dosyaları depona kopyala → git add . → git commit -m "Topluluk katmanı" → git push
```

### Bekle
GitHub Pages yeni dosyaları yayına almak için **1–3 dakika** sürer. Repo → **Actions** sekmesinde "pages build and deployment" yeşil tik alınca hazırdır.

---

## Adım 7 — Siteyi aç ve dene

Sitenin adresini aç ve **Ctrl+F5** (Mac: Cmd+Shift+R) ile yenile (eski dosyaları önbellekte tutmasın diye).

Şunları görmelisin:
- Üst menüde **Giriş** düğmesi (dar ekranda küçük insan simgesi).
- Bir **karakter sayfasının** en altında **Divan Tartışması** (eskitilmiş kâğıt görünümünde).
- Sağ altta kırmızı **Vakanüvise Öneri Sun** düğmesi.

Hiçbiri yoksa aşağıdaki **Sorun giderme** bölümüne bak.

---

## Adım 8 — Kayıt ol ve kendini yönetici yap

### 8a) Kayıt ol
Sitede **Giriş → Kayıt ol** sekmesi → kullanıcı adı, e-posta, parola (en az 8 karakter) → **Kayıt ol**.
- Adım 3a'da "Confirm email"i kapattıysan hemen giriş yapmış olursun.
- Açık bıraktıysan e-postana gelen bağlantıya tıkla (gelen kutusuna, gelmezse gereksiz/spam klasörüne bak), sonra **Giriş** yap.

Şu an **Kâtip** (normal üye) hesabındasın.

### 8b) Hesabını Vakanüvis (yönetici) yap
Bu işi **sadece bir kez, elle** yaparsın (yoksa herkes kendini yönetici yapabilirdi!).

1. Supabase → **SQL Editor** → **New query**.
2. Şunu yapıştır, **`SIZIN-EPOSTANIZ@ornek.com` kısmını kayıt olurken kullandığın e-postayla değiştir** (tırnaklar kalsın):

```sql
update public.profiles
   set role = 'admin'
 where id = (select id from auth.users where email = 'SIZIN-EPOSTANIZ@ornek.com');
```

3. **Run**. Sonuçta `Success. 1 row affected` (veya benzeri) yazar.
   "0 rows" yazarsa e-posta yanlış yazılmıştır ya da e-postanı henüz doğrulamamışsındır.

### 8c) Yönetim paneline gir
Sitenin `admin.html` sayfasına git (örn. `https://KULLANICIADI.github.io/REPOADI/admin.html`).
- Artık eski "stallhart" parolası **istenmez**; **e-posta + parola** ile giriş yaparsın.
- Girince sol menüde **TOPLULUK** başlığı altında **Öneriler, Yorumlar, Kullanıcılar** görünür.
- Yönetici olmayan bir hesapla girersen panel "Yetki yok" der ve yukarıdaki SQL'i **senin e-postanla dolu** olarak gösterir (kopyalayıp yapıştırırsın).

---

## Adım 9 — Her şey çalışıyor mu? (deneme listesi)

| Yap | Görmen gereken |
|---|---|
| Bir karakter sayfasının altına yorum yaz | Yorumun kâğıdın üstünde görünür |
| Yoruma **Yanıtla** de | Altında girintili yanıt olur |
| Yorumda `[spoiler]gizli şey[/spoiler]` yaz | "gizli şey" siyah şerit olur; tıklayınca açılır |
| Yorumun yanındaki mühür simgesine bas | Sayı 1 artar; sayfayı yenileyince de kalır |
| Sağ üstte avatarına tıkla → **Profilim → Ayarlar** | Avatar, favori hane, unvan seç → Kaydet |
| Sağ alttaki **Vakanüvise Öneri Sun** → bir düzeltme gönder | "Önerin ulaştı" yazar |
| `admin.html` → **Öneriler** | Az önceki öneri "Bekleyen"de görünür |
| **Onayla ve yayınla**'ya bas | Karakter sayfasını yenile: düzeltme **anında** yayında |

---

## Adım 10 — (İsteğe bağlı) Onaylananları JSON dosyalarına kalıcı işle

Onayladığın öneriler **zaten sitede yayındadır** (veritabanındaki "yama" siteye canlı uygulanır). Bu adım, içeriği ayrıca GitHub'daki `data/*.json` dosyalarına da yazmak içindir (yedek/geçmiş için güzel; şart değil).

**Elle (kolay):** Admin → **Veri & Yayın** → *Birleştirilmiş JSON dosyalarını indir* → inen dosyaları depodaki `data/` klasörüne yükle (üstüne yaz) → panelde **Depoya işlendi say**.

**Otomatik:** `.github/workflows/sync-patches.yml` dosyasını kullanır. GitHub → repo **Settings → Secrets and variables → Actions → New repository secret**:
- `SUPABASE_URL` = proje adresin
- `SUPABASE_SERVICE_ROLE_KEY` = Supabase'deki **secret / service_role** anahtarı (**yalnızca buraya**; başka hiçbir yere yazma)

Sonra **Actions** sekmesi → *Topluluk yamalarını JSON'a işle* → **Run workflow**.

---

## Sorun giderme

| Ne oluyor | Ne yapmalı |
|---|---|
| Sitede hiçbir şey değişmedi | GitHub Pages yayını 1–3 dk sürer; **Ctrl+F5** yap. `config.js` içindeki iki değerin **dolu ve tırnak içinde** olduğunu, dosyanın GitHub'a yüklendiğini kontrol et. |
| Divan'da "Yorumlar yüklenemedi" | Adım 2'deki SQL çalıştırılmamış ya da yarım kalmış → tekrar çalıştır. Anahtar/adres yanlış olabilir → Adım 4'ü kontrol et. |
| "Üyelik sistemi yüklenemedi" | İnternet/güvenlik yazılımı `cdn.jsdelivr.net` adresini engelliyor olabilir; sayfayı yenile ya da başka ağda dene. |
| Kayıt oldum ama e-posta gelmedi | Spam klasörüne bak; Supabase'in ücretsiz e-postası saatte birkaç mesajla sınırlı → biraz bekle ya da denerken "Confirm email"i kapat. |
| E-postadaki bağlantı hata veriyor / boş sayfa | Adım 3b'deki **Site URL** ve **Redirect URLs** eksik/yanlış. |
| Admin'e giriyorum ama "Yetki yok" diyor | Adım 8b'deki SQL çalıştırılmamış ya da e-posta farklı. Panelin gösterdiği SQL'i aynen çalıştır. |
| Yorum yazınca "birkaç saniye bekleyin" | Spam koruması: aynı hesap 8 saniyede bir yorum yazabilir. |
| Bir süre kullanılmayınca site "yorumlar yüklenemedi" diyor | Supabase **ücretsiz** projeleri uzun süre (yaklaşık 1 hafta) hiç kullanılmazsa **duraklatabilir**. Supabase panelinde projeye gir → **Restore / Resume project**. Site düzenli ziyaret alıyorsa genelde olmaz. |
| Her şeyi kapatmak istiyorum | `config.js` içindeki iki tırnağı **boşalt** → topluluk özellikleri kaybolur, site eskisi gibi olur. |

---

## Bilmen gerekenler (kısa)

- **Roller:** Ziyaretçi sadece okur · Kâtip (üye) yorum yazar, mühür basar, öneri gönderir · Vakanüvis (yönetici) önerileri onaylar/reddeder, yorum siler, kullanıcı yasaklar.
- **Maliyet:** Ücretsiz plan küçük/orta bir wiki için yeter.
- **Kişisel veri:** Üyelerin e-postaları Supabase'de saklanır; yalnızca yöneticiler görür. Kullanıcı adı, avatar, unvan ve yorumlar **herkese açıktır**. İstersen kayıt formuna bir gizlilik metni bağlayabilirsin.
- **Güvenlik:** Yetki kontrolü tarayıcıda değil, veritabanında yapılır; birinin tarayıcıda kodla oynaması ona yönetici yetkisi vermez.
- **Anahtarlar:** Siteye yalnızca publishable/anon. `secret`/`service_role` **asla** dosyalara yazılmaz.

Takıldığın adımı, ekranda gördüğün yazıyla birlikte yaz; oradan devam ederiz.
