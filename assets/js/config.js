/* ═══════════════════════════════════════════════════════════════
   STALLHART WIKI — Topluluk Katmanı Ayarları
   ---------------------------------------------------------------
   Üyelik, yorum (Divan Tartışması) ve öneri (Vakanüvise Öneri Sun)
   özellikleri Supabase ile çalışır. Aşağıdaki iki değeri doldurana
   kadar bu özelliklerin HİÇBİRİ görünmez — site eskisi gibi çalışır.

   NEREDEN BULUNUR?
     Supabase paneli → Project Settings → API
       · Project URL        →  supabaseUrl
       · anon / publishable →  supabaseAnonKey

   GÜVENLİK NOTU
     Buraya yalnızca "anon" (veya "publishable") anahtarı yazılır.
     Bu anahtar tarayıcıya açık olacak şekilde tasarlanmıştır; asıl
     koruma veritabanındaki Row Level Security politikalarıdır
     (supabase/schema.sql). "service_role" / "secret" anahtarını
     ASLA bu dosyaya veya depoya yazmayın.
   ═══════════════════════════════════════════════════════════════ */
window.SW_CONFIG = {
  /* Örn: 'https://abcdefghijkl.supabase.co' */
  supabaseUrl: 'https://ooovwyxsiiruggogjktv.supabase.co',

  /* Örn: 'eyJhbGciOi…' (anon) veya 'sb_publishable_…' */
  supabaseAnonKey: 'sb_publishable_-42OsUfU3O129BFnEMs74A_qf4BtyQ1',

  /* İsteğe bağlı: e-posta doğrulama / parola sıfırlama bağlantılarının
     döneceği adres. Boş bırakılırsa sitenin ana sayfası kullanılır.
     Supabase → Authentication → URL Configuration'da da tanımlı olmalı. */
  siteUrl: '',

  /* Önbellek numarası: topluluk dosyalarını (community*.js, community.css)
     değiştirirseniz bu sayıyı artırın; tarayıcılar yeni sürümü hemen alır.
     (Sayfalardaki  ?v=16  ile aynı mantık.) */
  assetVersion: '17',

  /* Veri önbellek numarası: data/*.json ve görsel manifesti "?v=<bu sayı>" ile istenir,
     böylece tarayıcı önbelleğinden gelir. data/ klasörünü değiştirip yayınladığınızda
     bu sayıyı artırın (unutursanız en geç ~10 dk içinde herkes yeni veriyi alır).
     Boş bırakırsanız her istekte sunucuya doğrulama yapılır (eski davranış).
     Yönetim paneli her zaman doğrular. */
  dataVersion: '2.8',

  /* Özellikleri tek tek kapatabilirsiniz. */
  features: {
    comments: true,      /* Divan Tartışması (yorumlar)           */
    suggestions: true,   /* Vakanüvise Öneri Sun                  */
    patches: true        /* Onaylı önerileri canlı bindirme       */
  }

  /* İleri düzey: supabase-js'i kendi kopyanızdan yüklemek isterseniz
     supabaseLibUrl: 'assets/js/vendor/supabase.js'                */
};
