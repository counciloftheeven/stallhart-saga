/* ═══════════════════════════════════════════════════════════════
   STALLHART WIKI — YÖNETİM: GELİŞMİŞ YAZI & MAKALE EDİTÖRÜ
   ---------------------------------------------------------------
   Wiki sayfaları, karakter biyografileri, şehir ve kale sayfaları,
   eyalet kılavuzları, tanrı doktrinleri ve tarihî hadiseler için
   tam teşekküllü zengin yazı paneli:
   - Paragraf (Standart ve Tezhipli Gotik Giriş Drop-Cap)
   - Kalın Başlıklar (H1 Taçlı, H2 Bölüm, H3 Alt Başlık, H4 Detay)
   - İtalik, Kalın, Altı Çizili, Üstü Çizili, Terim / Kod, Vurgular
   - Divan Başvakanüvisi Şerhleri, Vecizeler, Bilgi & Uyarı Kutuları
   - Madde & Numaralı Listeler, Tablo Oluşturucu, Süslemeli Ayraçlar
   - İnteraktif Wiki Bağlantısı (Karakter, Şehir, Hane, Tanrı arama modalı)
   - Görsel & Portre Yerleştirici
   - 7 Profesyonel Karanlık Fantezi Şablonu
   - Canlı İki Bölmeli (Split) Gerçek Wiki Önizlemesi
   - 🇹🇷 Türkçe & 🇬🇧 İngilizce Çift Dil Desteği
   - Sunucu Diskine Anında Kalıcı Kaydetme (Ctrl+S) & Canlı Sayfa Önizleme
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const A = window.AdminBridge;
  if (!A) return;

  const esc = A.esc || (s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  /* Editör Durumu */
  const S = {
    category: 'chars', // 'chars' | 'cities' | 'geo' | 'pages' | 'gods' | 'events'
    itemId: '',
    fieldKey: 'bio',
    lang: 'tr',
    viewMode: 'split', // 'split' | 'edit' | 'preview'
    text: { tr: '', en: '' },
    dirty: false,
    itemFilter: ''
  };

  /* 7 Zengin Şablon */
  const TEMPLATES = {
    char_bio: {
      name: "👤 Karakter Biyografi Şablonu",
      tr: `> [!LEAD]
> Kadim hanedanın sancağı altında yetişen bu şahsiyet, gençlik yıllarından itibaren stratejik zekâsı, sarsılmaz iradesi ve savaş meydanlarındaki kararlılığıyla temayüz etmiştir.

## 👑 1. Köken, Hanedan ve İlk Yıllar
Taht silsilesinin meşru mirasçısı olarak saray divanında ve kütüphanelerinde yetiştirildi. İlk askerî tecrübesini sınır garnizonlarında teftiş muhafızı olarak edindi.

## 👑 2. Hükümranlık, İdare ve Fermanlar
Merkezi otoriteyi tahkim etmek, vergi düzenini adil kılmak ve taşra asayişini sağlamak maksadıyla Divan fermanları neşretti.

> **Divan Başvakanüvisi Şerhi:**
> "Sözü dövme çelikten keskin, sükûtu fırtına öncesi dinginlik gibiydi. Verdiği her emir kıtanın güç dengelerini yeniden tayin etti."

## 👑 3. Askerî Seferler ve İttifaklar
- **Kuzey Hudutları:** Dağ geçitlerine yeni hisarlar ve gözetleme kuleleri inşa ettirdi.
- **Büyük Uzlaşma:** Taşra beylikleriyle meşruiyet esaslarına dayalı barış akitleri imzaladı.
- **Donanma Düzeni:** Kıyı sularında seyreden kalyonların nizamı yenilendi.

## 👑 4. Tarihî Miras ve Son Yıllar
Arkasında müstahkem kaleler, bayındır şehirler ve nesiller boyu saygıyla anılacak bir hanedan mirası bıraktı.`,
      en: `> [!LEAD]
> Reared beneath the ancestral banner of the dynasty, this figure rose to prominence from their youth through tactical brilliance, unyielding resolve, and sovereign courage.

## 👑 1. Lineage, Origins and Early Years
Schooled within imperial cloisters and chancelleries as legitimate scion of the bloodline. Acquired martial command overseeing marcher watch keeps.

## 👑 2. Sovereignty, Governance and Decrees
Promulgated royal decrees to consolidate central authority, balance censuses, and preserve public peace across provincial marcher fiefs.

> **Imperial Chronicler Annotation:**
> "Words sharp as forged steel, solemn silence more portentous than wrath. Every royal ordinance reshaped continental politics."

## 👑 3. Campaigns and Strategic Pacts
- **Northern Frontiers:** Fortified alpine defiles with stone bastions and garrison outposts.
- **The Great Concordat:** Negotiated solemn oaths of fealty with marcher bannerlords.
- **Naval Reorganization:** Overhauled coastal squadrons defending arterial trade straits.

## 👑 4. Twilight and Historical Legacy
Bequeathed an enduring testament of imperial statecraft, leaving behind formidable redoubts and prosperous cities.`
    },

    city_guide: {
      name: "🏙️ Şehir & Kale Tanıtım Şablonu",
      tr: `> [!LEAD]
> Kıtanın kalbinde, nehir kavşağı ile kadim ticaret yollarının kesiştiği sarp bir tepe üzerinde yükselen müstahkem şehir, imparatorluğun askeri ve iktisadi gücünün simgesidir.

## 👑 1. Coğrafi Konum ve Stratejik Önemi
Kuzey dağlarından inen ticaret kervanlarının ve nehir gemilerinin uğrak noktasıdır. Çevresindeki verimli alüvyon ovaları şehrin tahıl ve iaşe ihtiyacını eksiksiz karşılar.

## 👑 2. Surlar, Burçlar ve Savunma Mimarisi
- **Dış Sur Hattı:** Üç kat yontma bazalt taş örgü, okçu maşrikleri ve derin su hendeği
- **İkiz Kapılar:** Ağır dökme demir parmaklıklar, katran delikleri ve teftiş kuleleri
- **İç Kale (Akropol):** Şehir valisinin divan meclisine ve garnizon cephaneliğine ev sahipliği yapan sarp kaya hisarı

> **Divan Başvakanüvisi Şerhi:**
> "Bu şehrin kapıları yalnızca dost kervanlara ve meşru ferman sahiplerine açılır; kuşatan her ordu surların dibinde erimiştir."

## 👑 3. İdare, Garnizon ve Asayiş
Şehrin idaresi, doğrudan Yüce Divan tarafından tayin edilen bir Muhafız Komutanı ve şehir kethüdasına emanettir. Şehir kanunları taş tabletlere kazınarak meydanlara dikilmiştir.

## 👑 4. Loncalar, Çarşılar ve Sosyal Hayat
Demirciler Çarşısı, dokuma hanları, parşömen atölyeleri ve nehir rıhtımları şehrin can damarını oluşturur. Her mevsim dönümünde kurulan panayır binlerce tüccarı çeker.`,
      en: `> [!LEAD]
> Crowned upon an elevated precipice where fluvial waterways converge with arterial trade routes, this fortified city stands as a monumental bastion of imperial power.

## 👑 1. Geographic Setting and Strategic Dominance
Commanding the crossroads of northern caravans and barge navigation. Surrounding alluvial plains furnish ample granary harvests for civic sustenance.

## 👑 2. Ramparts and Citadel Architecture
- **Outer Curtain Wall:** Triple-tiered dressed basalt blocks fronted by a deep moat
- **Twin Portcullis Gates:** Counterweighted iron grates, murder holes, and archery bastions
- **Inner Acropolis:** Rugged keep housing the gubernatorial chancery and crown vaults

> **Imperial Chronicler Annotation:**
> "These portals yield solely to allied convoys and legitimate imperial writs; every besieging host has broken upon its stone apron."

## 👑 3. Governance, Garrison and Law
Entrusted directly to a Castellan and an Imperial Prefect commissioned by the Supreme Divan. Provincial ordinances stand engraved upon public basalt pillars.

## 👑 4. Guilds, Markets and Civic Life
Foundries, vellum scriptoriums, river wharves, and merchant vaults animate the settlement's thriving commercial core.`
    },

    province_overview: {
      name: "🏔️ Eyalet & Coğrafya Kılavuzu",
      tr: `> [!LEAD]
> Kuzeyde sarp sıradağlar, güneyde zengin nehir havzaları ve kadim ormanlarla çevrili olan bu eyalet, imparatorluğun hem tahıl ambarı hem de stratejik kalkanıdır.

## 👑 1. Doğal Sınırlar ve İklim
Bölge, kışları sert geçen yüksek yaylalar ve yazları bereketli hasatlar veren vadilerden müteşekkildir. Nehir vadileri doğal ulaşım arterlerini oluşturur.

## 👑 2. Önemli Şehirler, Kaleler ve Sınır Hisarları
- **Eyalet Merkezi:** Vali sarayının ve adalet divanının bulunduğu ana metropol
- **Sınır Muhafız Kaleleri:** Dağ geçitlerini ve gümrük noktalarını tutan müstahkem hisarlar
- **Liman / İskele Kasabaları:** Nehir veya deniz ticaretini yönlendiren rıhtımlar

| Şehir / Kale | Konum | İşlev & Muhafız |
|---|---|---|
| Merkez Hisar | Vadi Kavşağı | İdari Divan & Baş Garnizon |
| Doğu Kapısı | Dağ Geçidi | Sınır Teftişi & Gümrük |
| Nehir İskelesi | Nehir Ağzı | Tahıl Siloları & Mavnalar |

## 👑 3. İktisat, Ziraat ve Doğal Zenginlikler
Tahıl tarımı, gümüş ocakları, at haraları ve nehir balıkçılığı bölgenin zenginlik kaynağıdır.

## 👑 4. Hanedanlar ve Tahta Sadakat
Bölgenin kadim sancak sahibi soylu haneleri, Divan fermanlarına ve Kutsal Kan doktrinine sadakat andıyla bağlıdır.`,
      en: `> [!LEAD]
> Flanked by jagged massifs to the north and fertile river plains to the south, this province serves as both breadbasket and bastion of the Stallhart realm.

## 👑 1. Frontiers and Climate
Defined by alpine plateaus enduring severe winters and temperate valleys yielding abundant harvests. Fluvial canyons offer natural lines of communication.

## 👑 2. Principal Cities and Marcher Strongholds
- **Provincial Seat:** The primary metropolitan center housing the gubernatorial court
- **Frontier Keeps:** High stone redoubts safeguarding mountain passes and customs tolls
- **Harbor Settlements:** Quays directing fluvial and littoral merchant fleets

| Stronghold | Location | Function & Command |
|---|---|---|
| Central Citadel | River Convergence | Gubernatorial Chancery & Main Host |
| Eastern Redoubt | Mountain Defile | Frontier Scrutiny & Customs |
| Fluvial Wharf | River Mouth | Grain Silos & Barge Basins |

## 👑 3. Economy and Natural Wealth
Agrarian cereals, silver veins, equine studs, and fluvial fisheries form the enduring foundation of regional wealth.

## 👑 4. Noble Houses and Dynastic Fealty
Ancient bannerhouses govern the marcher tracts under sacred oaths of fealty sworn to the Stallhart Throne.`
    },

    decree_charter: {
      name: "📜 Divan Fermanı & Kanunname",
      tr: `> **Stallhart Yüce Divan Fermanı**
> *"Kutsal Kan Doktrini, Adalet Mizanı ve Yüce Hükümranlık Mührü ile İlan Olunur:"*

## 👑 Madde I: Hudut Tanzimi ve Vergi Nizamı
İmparatorluk sınırları dâhilindeki tüm taşra beylikleri, senede bir defa neşredilen Divan tahrir defterlerine riayetle ve tayin olunan vergileri Arava Hazinesi'ne noksansız teslime mükelleftir.

## 👑 Madde II: Askerî Celp ve Sancak Teftişi
Her hane, tasarrufundaki tımar nispetinde zırhlı süvari ve mızraklı piyade birliğini ordugâh celbine hazır tutacaktır.

> [!WARNING]
> Ferman hilafına hareket eden, tahrir defterlerinden mal kaçıran veya celp emrine itaatsizlik gösterenlerin unvanları ve toprakları taht namına zapt olunur.

## 👑 Madde III: Mahkemeler ve Adalet Şerhi
Taşradaki adalet divanlarında Yüce Divan kanunnameleri haricinde hüküm bina edilemez. Haksızlığa uğrayan her tebaa için Arava Sarayı'na istinaf hakkı mahfuzdur.

---
*Arava Sarayı Yüksek Divan Kâtibi tarafından kayda geçirilmiş ve Yüce Mühür ile mühürlenmiştir.*`,
      en: `> **Stallhart Supreme Divan Decree**
> *"Promulgated under the Holy Blood Doctrine, the Scale of Sovereign Justice, and the Imperial Seal:"*

## 👑 Clause I: Marcher Ordinance and Tribute Census
All provincial lordships within the borders of the realm shall remain strictly bound to the annual Divan census registers and shall deliver assessed tributes to the Arava Treasury without default.

## 👑 Clause II: Legionary Levy and Banner Muster
Each noble house shall hold fully equipped armored lances and pike cohorts in readiness commensurate with its chartered fiefdom.

> [!WARNING]
> Any party defying this imperial decree, concealing census revenues, or neglecting military musters shall forfeit titles and domains to the Crown.

## 👑 Clause III: Tribunals and Sovereign Justice
No provincial magistrate may pass judgment contradictory to Supreme Divan edicts. The right of appeal to the Court of Arava remains inviolate for every subject.

---
*Inscribed into the Imperial Registers by the Grand Secretariat of Arava and sealed with the Imperial Crest.*`
    },

    war_chronicle: {
      name: "⚔️ Askeri Sefer & Kriz Kroniği",
      tr: `> [!LEAD]
> KS 1144 yılının güz aylarında başlayan harekât, kıtanın siyasi haritasını kökünden değiştirmiş ve Stallhart hâkimiyetinin temellerini atmıştır.

## 👑 1. Harekâtın Sebepleri ve Taraflar
- **Sebep:** Sınır boylarındaki vergi krizleri ve taşra beyliklerinin ticaret kervanlarına saldırıları
- **İmparatorluk Ordusu:** Craes Stallhart komutasında 12.000 zırhlı piyade ve saray muhafızları
- **Karşı Güçler:** Birleşik sınır aşiretleri ve isyancı feodal garnizonlar

## 👑 2. Çarpışmanın Seyri ve Dönüm Noktaları
- **İlk Safha:** Sınır boğazlarının tutulması ve ikmal hatlarının güvenceye alınması
- **Yarma Harekâtı:** Gece baskınıyla nehir köprüsünün ele geçirilmesi
- **Meydan Savaşı:** Açık arazide hilal nizamıyla düşman süvarilerinin kuşatılması

> **Divan Başvakanüvisi Şerhi:**
> "Kızıl sancağın açıldığı gün vadi titredi. Muharebe meydanında verilen kararlar, geleceğin imparatorluğunu müjdeledi."

## 👑 3. Netice ve Siyasi Sonuçlar
İsyan tamamen bastırıldı; tahtın meşruiyeti sorgulanamaz biçimde perçinlendi ve sınır boylarına kalıcı garnizonlar yerleştirildi.`,
      en: `> [!LEAD]
> Commencing in the autumn of KS 1144, this military campaign irrevocably transformed continental boundaries and laid the bedrock of Stallhart supremacy.

## 👑 1. Casus Belli and Host Alignments
- **Provocation:** Customs border disputes and regional raids on arterial convoys
- **Imperial Host:** 12,000 disciplined heavy infantry and the Crown Vanguard led by Craes Stallhart
- **Opposing Forces:** Coalition of border confederacies and rebellious marcher garrisons

## 👑 2. Tactical Phases and Crucial Turns
- **Initial Phase:** Securing alpine choke points and staging logistics depots
- **The Breakthrough:** Fluvial bridge captured during a decisive nocturnal assault
- **Pitched Engagement:** Crescent deployment trapping hostile cavalry wings

> **Imperial Chronicler Annotation:**
> "When the crimson banner was unfurled, the valley trembled. Tactical decisions forged that day heralded an empire."

## 👑 3. Strategic Settlement and Consequences
Dissent was completely suppressed, sovereign legitimacy was sealed, and permanent imperial bastions were garrisoned along the frontiers.`
    },

    god_doctrine: {
      name: "✨ Tanrı & İnanç Doktrini",
      tr: `> [!LEAD]
> Denge Konseyi'nin yüce sütunlarından biri olan ilahiyat doktrini; evrenin düzenini, kutsal kan meşruiyetini ve fanilerin dünyevi vazifelerini tayin eder.

## 👑 1. İlahi Sıfatlar ve Denge Konseyi'ndeki Yeri
Evrenin zıt kutupları arasında ahenk kuran, adaleti ve varoluş dengesini gözeten yüce kudret. Mabedlerde yakılan kutsal meşaleler bu dengenin ebediyetini temsil eder.

## 👑 2. Mabedler, Sunaklar ve Rahipler Nizamı
- **Baş Mabed:** Beyaz yontma taşlarla örülü sütunlu ibadethane
- **Rahipler Heyeti:** Doktrini koruyan, felsefi metinleri istinsah eden bilginler meclisi
- **Kutsal Adaklar:** Hasat mevsiminde sunulan buğday başakları ve gümüş sikke bağışları

> [!NOTE]
> Mabede sığınan her can, dünyevi kılıçların ve yargıların gazabından muaf kabul edilir; bu hakka taht da hürmet gösterir.

## 👑 3. Kutsal Günler, Ayinler ve Toplumsal Ahlak
Gündönümü gecelerinde icra edilen şükran duaları ve kandil yakma törenleri, halkı tek bir manevi çatı altında birleştirir.`,
      en: `> [!LEAD]
> Standing as a cornerstone of the Council of Balance, this divine doctrine sanctifies cosmic equilibrium, the legitimacy of the Holy Blood, and mortal duties.

## 👑 1. Divine Attributes and Council Seat
The sovereign power harmonizing cosmic dualities, presiding over balance and divine justice. Sanctified torches within shrines reflect this eternal vigil.

## 👑 2. Sanctuary Architecture and Priesthood
- **Great Sanctuary:** Columned rotunda constructed of dressed white limestone
- **Priesthood Chapter:** Scholarly presbyters safeguarding esoteric manuscripts
- **Consecrated Offerings:** First sheafs of grain and silver tithes during the equinox

> [!NOTE]
> Any soul crossing the sanctuary threshold is granted holy asylum, an ancient sanctuary privilege respected even by the Imperial Throne.

## 👑 3. Holy Liturgies, Sacraments and Moral Law
Nocturnal lantern processions during solstice vigils bind highborn lords and commoners in sacred communion.`
    },

    house_charter: {
      name: "🏰 Hanedan & Kadim Sancak Belgesi",
      tr: `> [!LEAD]
> İmparatorluğun kuruluşundan bu yana sancağını şerefle taşıyan kadim soylu hane, kıtanın en köklü askeri ve siyasi hanedanlarından biridir.

## 👑 1. Hane Arması, Renkleri ve Savaş Şiarı
- **Arma:** Gümüş zemin üzerine kükreyen kurt başı ve taç motifi
- **Hanedan Renkleri:** Gece mavisi ve yaldızlı altın
- **Savaş Şiarı:** *"Karanlıkta dahi meşalemiz parlar."*

## 👑 2. Kadim Yurt ve Soy Kalesi
Eyaletin en sarp kayalığı üzerine inşa edilmiş olan ata kalesi, yüzlerce yıldır hanedanın merkezi ve sarsılmaz sığınağıdır.

## 👑 3. Tahta Hizmet ve Tarihî İttifaklar
İmparatorluk Divanı'nda daimi vekili bulunan hane, en buhranlı savaşlarda ordularıyla tahtın yanında yer almış ve liyakat fermanlarıyla taltif edilmiştir.`,
      en: `> [!LEAD]
> Upholding its storied standard since the dawn of the empire, this noble lineage represents one of the realm's premier martial houses.

## 👑 1. Heraldry, Liveries and House Motto
- **Crest:** Roaring wolf crest surmounted by an imperial coronet upon argent
- **House Colors:** Midnight azure and burnished gold
- **War Cry:** *"Even within darkness, our torch endures."*

## 👑 2. Ancestral Seat and Citadel
Perched upon the highest basalt crag of the province, the ancestral keep has remained the impregnable sanctuary of the family for centuries.

## 👑 3. Fealty to the Throne and Historical Alliances
Holding a permanent seat on the Supreme Divan, the lineage has rallied hosts during darkest crises, commemorated in royal citations.`
    }
  };

  /* Markdown Ayrıştırıcı & Canlı Önizleme Motoru */
  function parseAndRenderMarkdown(text) {
    if (!text || !text.trim()) {
      return '<div class="art-empty-preview"><div style="font-size:2.2rem;margin-bottom:.5rem;">📜</div><em>Henüz metin girilmedi. Yazmaya veya biçimlendirme araçlarını kullanmaya başladığınızda burada canlı dark fantasy wiki sayfası önizlemesi görüntülenecektir.</em></div>';
    }

    let html = esc(text);

    // Divan Başvakanüvisi Şerhi
    html = html.replace(/^> \*\*Divan Başvakanüvisi Şerhi:\*\*\s*\n((?:> .*?\n?)+)/gm, (m, content) => {
      const clean = content.replace(/^> /gm, '');
      return `<div class="art-callout"><div class="art-callout-head"><span>📜</span> <strong>Divan Başvakanüvisi Şerhi</strong></div><div class="art-callout-body">${clean}</div></div>`;
    });

    // Özel Çağrı Kutuları (Callouts: [!LEAD], [!NOTE], [!WARNING], [!LAW])
    html = html.replace(/^> \[!LEAD\]\s*\n((?:> .*?\n?)+)/gm, (m, content) => {
      const clean = content.replace(/^> /gm, '').trim();
      const firstChar = clean.charAt(0);
      const rest = clean.slice(1);
      return `<div class="art-lead-box"><p class="art-lead"><span class="art-dropcap">${firstChar}</span>${rest}</p></div>`;
    });

    html = html.replace(/^> \[!NOTE\]\s*\n((?:> .*?\n?)+)/gm, (m, content) => {
      const clean = content.replace(/^> /gm, '').trim();
      return `<div class="art-note"><div class="art-note-head"><span>💡</span> <strong>Evren Notu &amp; Arşiv Kaydı</strong></div><div class="art-note-body">${clean}</div></div>`;
    });

    html = html.replace(/^> \[!WARNING\]\s*\n((?:> .*?\n?)+)/gm, (m, content) => {
      const clean = content.replace(/^> /gm, '').trim();
      return `<div class="art-warning"><div class="art-warning-head"><span>⚠️</span> <strong>Yasak İlim &amp; Kriz İhtilafı</strong></div><div class="art-warning-body">${clean}</div></div>`;
    });

    html = html.replace(/^> \[!LAW\]\s*\n((?:> .*?\n?)+)/gm, (m, content) => {
      const clean = content.replace(/^> /gm, '').trim();
      return `<div class="art-law"><div class="art-law-head"><span>⚖️</span> <strong>İmparatorluk Kanun Maddesi</strong></div><div class="art-law-body">${clean}</div></div>`;
    });

    // Standart Alıntılar
    html = html.replace(/^((?:> .*?\n?)+)/gm, (m, content) => {
      const clean = content.replace(/^> /gm, '');
      return `<blockquote class="art-quote">${clean}</blockquote>`;
    });

    // Başlıklar
    html = html.replace(/^#### (.*?)$/gm, '<h4 class="art-subhead-sm">◈ $1</h4>');
    html = html.replace(/^### (.*?)$/gm, '<h3 class="art-sec-subhead"><span>✦</span> $1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 class="art-sec-head"><span>👑</span> $1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 class="art-title"><span class="art-title-ornament">⚜️</span> $1</h1>');

    // Görseller: ![Altyazı](url)
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (m, alt, url) => {
      return `<figure class="art-figure"><img src="${esc(url)}" alt="${esc(alt)}" loading="lazy"><figcaption class="art-figcaption">${alt}</figcaption></figure>`;
    });

    // Wiki ve Web Bağlantıları
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, (m, label, url) => {
      if (url.startsWith('wiki:')) {
        const parts = url.split(':');
        const type = parts[1] || '';
        const id = parts[2] || '';
        let targetHref = '#';
        if (type === 'character') targetHref = `karakter-sablon.html#/karakter/${encodeURIComponent(id)}`;
        else if (type === 'geo') targetHref = `harita.html`;
        else if (type === 'god') targetHref = `tanri-detay.html?id=${encodeURIComponent(id)}`;
        else if (type === 'event') targetHref = `olay-detay.html?id=${encodeURIComponent(id)}`;
        return `<a href="${esc(targetHref)}" class="art-link bk-wl" data-wiki-type="${esc(type)}" data-wiki-id="${esc(id)}" target="_blank" rel="noopener"><span>🔗</span> <strong>${label}</strong></a>`;
      }
      return `<a href="${esc(url)}" class="art-link" target="_blank" rel="noopener">${label} ↗</a>`;
    });

    // Tablolar: | Başlık | ... |\n|---|...|\n| Veri | ... |
    html = html.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (m, tableBlock) => {
      const lines = tableBlock.trim().split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length >= 2 && lines[1].includes('---')) {
        const parseRow = (line) => line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
        const headerCells = parseRow(lines[0]);
        const bodyLines = lines.slice(2);
        const thead = '<thead><tr>' + headerCells.map(c => `<th>${c}</th>`).join('') + '</tr></thead>';
        const tbody = '<tbody>' + bodyLines.map(rowLine => {
          const cells = parseRow(rowLine);
          return '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
        }).join('') + '</tbody>';
        return `<div class="art-table-wrap"><table class="art-table">${thead}${tbody}</table></div>`;
      }
      return m;
    });

    // Süslemeli Bölüm Ayracı
    html = html.replace(/^---$/gm, '<div class="art-hr-wrap"><hr class="art-hr"><span class="art-hr-crest">❖</span></div>');

    // Metin İçi Biçimler
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
    html = html.replace(/`([^`]+)`/g, '<code class="art-code">$1</code>');
    html = html.replace(/==(.*?)==/g, '<mark class="art-mark-gold">$1</mark>');
    html = html.replace(/!!(.*?)!!/g, '<span class="art-mark-blood">$1</span>');
    html = html.replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/g, '<u>$1</u>');
    html = html.replace(/&lt;mark class="gold"&gt;(.*?)&lt;\/mark&gt;/g, '<mark class="art-mark-gold">$1</mark>');
    html = html.replace(/&lt;span class="blood"&gt;(.*?)&lt;\/span&gt;/g, '<span class="art-mark-blood">$1</span>');
    html = html.replace(/&lt;span class="small-caps"&gt;(.*?)&lt;\/span&gt;/g, '<span class="art-small-caps">$1</span>');

    // Özellik Listesi (- **Başlık:** Değer)
    html = html.replace(/^((?:- \*\*.*?\n?)+)/gm, (m, content) => {
      const items = content.trim().split('\n').map(l => {
        return `<li>${l.replace(/^- /, '')}</li>`;
      }).join('');
      return `<ul class="art-meta-list">${items}</ul>`;
    });

    // Madde İşaretli Standart Liste
    html = html.replace(/^((?:- .*?\n?)+)/gm, (m, content) => {
      const items = content.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('');
      return `<ul class="art-list">${items}</ul>`;
    });

    // Numaralı Liste
    html = html.replace(/^((?:\d+\. .*?\n?)+)/gm, (m, content) => {
      const items = content.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
      return `<ol class="art-num-list">${items}</ol>`;
    });

    // Paragraflar
    const paras = html.split(/\n{2,}/);
    return paras.map(p => {
      p = p.trim();
      if (!p) return '';
      if (/^<(h[1-4]|blockquote|div|ul|ol|figure|table)/.test(p)) return p;
      return `<p class="art-p">${p.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
  }

  /* Biçimlendirme Uygula */
  function applyAction(ta, action, extraArg) {
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;
    const sel = val.substring(start, end);
    let rep = '';
    let offset = 0;

    switch (action) {
      case 'bold':
        rep = `**${sel || 'kalın metin'}**`;
        offset = sel ? rep.length : 2;
        break;
      case 'italic':
        rep = `*${sel || 'italik metin'}*`;
        offset = sel ? rep.length : 1;
        break;
      case 'underline':
        rep = `<u>${sel || 'altı çizili metin'}</u>`;
        offset = sel ? rep.length : 3;
        break;
      case 'strike':
        rep = `~~${sel || 'üstü çizili metin'}~~`;
        offset = sel ? rep.length : 2;
        break;
      case 'code':
        rep = `\`${sel || 'terim'}\``;
        offset = sel ? rep.length : 1;
        break;
      case 'gold':
        rep = `<mark class="gold">${sel || 'altın vurgu'}</mark>`;
        offset = sel ? rep.length : 19;
        break;
      case 'blood':
        rep = `<span class="blood">${sel || 'imparatorluk uyarısı'}</span>`;
        offset = sel ? rep.length : 20;
        break;
      case 'caps':
        rep = `<span class="small-caps">${sel || 'ferman metni'}</span>`;
        offset = sel ? rep.length : 25;
        break;
      case 'p':
        rep = `\n\n${sel || 'Yeni paragraf metni buraya yazılacak…'}\n\n`;
        offset = sel ? rep.length : 2;
        break;
      case 'lead':
        rep = `\n\n> [!LEAD]\n> ${sel || 'Kadim sancağın gölgesinde yeşeren irade, kıtanın kaderini değiştirecek ilk adımların habercisiydi…'}\n\n`;
        offset = rep.length;
        break;
      case 'h1':
        rep = `\n# 👑 ${sel || 'Makale Ana Başlığı'}\n\n`;
        offset = sel ? rep.length : 5;
        break;
      case 'h2':
        rep = `\n## 👑 ${sel || 'Bölüm Başlığı'}\n\n`;
        offset = sel ? rep.length : 6;
        break;
      case 'h3':
        rep = `\n### ✦ ${sel || 'Alt Başlık'}\n\n`;
        offset = sel ? rep.length : 7;
        break;
      case 'h4':
        rep = `\n#### ◈ ${sel || 'Detay Başlığı'}\n\n`;
        offset = sel ? rep.length : 8;
        break;
      case 'quote':
        rep = `\n> "${sel || 'Kader kılıçla yazılır, kanla mühürlenir.'}"\n> — *İmparator I. Craes Stallhart*\n\n`;
        offset = rep.length;
        break;
      case 'divan':
        rep = `\n> **Divan Başvakanüvisi Şerhi:**\n> "${sel || 'Bu dönüm noktası olay, imparatorluğun güç dengelerini ve taşra teşkilatını yeniden tayin etmiştir.'}"\n\n`;
        offset = rep.length;
        break;
      case 'note':
        rep = `\n> [!NOTE]\n> ${sel || 'Bu kayıt Arava Sarayı Yüksek Divan Arşivi\'nin 4. Cildinde muhafaza edilmektedir.'}\n\n`;
        offset = rep.length;
        break;
      case 'warn':
        rep = `\n> [!WARNING]\n> ${sel || 'Bu fermanın aslı Kanlı Taç Krizinden sonra mühürlenmiş ve taşraya tebliği yasaklanmıştır.'}\n\n`;
        offset = rep.length;
        break;
      case 'law':
        rep = `\n> [!LAW]\n> **Madde I:** ${sel || 'Tahta ve sancağa sadakat andı içen her hane, imparatorluk nizamına eksiksiz riayetle mükelleftir.'}\n\n`;
        offset = rep.length;
        break;
      case 'bullet': {
        const bl = (sel || 'İlk madde\nİkinci madde\nÜçüncü madde').split('\n').map(l => '- ' + l).join('\n');
        rep = `\n${bl}\n`;
        offset = rep.length;
        break;
      }
      case 'number': {
        const nl = (sel || 'İlk safha\nİkinci safha\nNihai zafer').split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n');
        rep = `\n${nl}\n`;
        offset = rep.length;
        break;
      }
      case 'meta':
        rep = `\n- **Hükümran:** ${sel || 'I. Craes Stallhart'}\n- **Dönem:** KS 1144 – 1182\n- **Sancak:** Ak Kurt & Kızıl Zemin\n`;
        offset = rep.length;
        break;
      case 'table':
        rep = `\n\n| Hadise / Özellik | Tarih / Konum | Netice & Belgeler |\n|---|---|---|\n| Eyyros Seferi | KS 1144 | Zafer; Kadim sancağın yükselişi |\n| Büyük İttifak | KS 1162 | Solgar Hanedanı ile barış akdi |\n| Darova Savunması | KS 1178 | Sınır hisarlarının tahkimi |\n\n`;
        offset = rep.length;
        break;
      case 'hr':
        rep = `\n\n---\n\n`;
        offset = rep.length;
        break;
      case 'link':
        if (extraArg) {
          rep = `[${sel || extraArg.label}](${extraArg.url})`;
        } else {
          openLinkModal(sel);
          return;
        }
        offset = rep.length;
        break;
      case 'image':
        if (extraArg) {
          rep = `\n![${extraArg.caption || 'Görsel Altyazısı'}](${extraArg.url})\n`;
        } else {
          openImageModal();
          return;
        }
        offset = rep.length;
        break;
      case 'template':
        if (extraArg && TEMPLATES[extraArg]) {
          const tpl = TEMPLATES[extraArg][S.lang] || TEMPLATES[extraArg].tr;
          rep = (val.trim() ? '\n\n' : '') + tpl + '\n';
          offset = rep.length;
        }
        break;
      case 'undo':
        ta.focus();
        document.execCommand('undo');
        return;
      case 'redo':
        ta.focus();
        document.execCommand('redo');
        return;
      case 'clear':
        if (sel) {
          rep = sel.replace(/[\*\_~`#>-]/g, '').replace(/<[^>]+>/g, '').trim();
          offset = rep.length;
        } else {
          return;
        }
        break;
    }

    ta.focus();
    if (document.execCommand && document.execCommand('insertText', false, rep)) {
      // Modern tarayıcı geri al/yinele desteği
    } else {
      ta.value = val.substring(0, start) + rep + val.substring(end);
      ta.selectionStart = start + offset;
      ta.selectionEnd = start + offset;
    }
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /* Aktif Veriyi Yükle */
  function loadActiveItemText() {
    const db = A.DB;
    if (!db) return;
    S.text = { tr: '', en: '' };

    if (S.category === 'chars') {
      const chars = (db['characters.json'] && db['characters.json'].characters) || [];
      const item = chars.find(c => c.id === S.itemId) || chars[0];
      if (item) {
        S.itemId = item.id;
        const val = item[S.fieldKey] || {};
        S.text.tr = typeof val === 'object' ? (val.tr || '') : String(val || '');
        S.text.en = typeof val === 'object' ? (val.en || '') : '';
      }
    } else if (S.category === 'cities') {
      const cities = (db['geography.json'] && db['geography.json'].cities) || [];
      const item = cities.find(c => c.id === S.itemId) || cities[0];
      if (item) {
        S.itemId = item.id;
        const val = item[S.fieldKey] || {};
        S.text.tr = typeof val === 'object' ? (val.tr || '') : String(val || '');
        S.text.en = typeof val === 'object' ? (val.en || '') : '';
      }
    } else if (S.category === 'geo') {
      const provs = (db['geography.json'] && db['geography.json'].provinces) || [];
      const item = provs.find(p => (p.id || p.name) === S.itemId) || provs[0];
      if (item) {
        S.itemId = item.id || item.name;
        const val = item[S.fieldKey] || {};
        S.text.tr = typeof val === 'object' ? (val.tr || '') : String(val || '');
        S.text.en = typeof val === 'object' ? (val.en || '') : '';
      }
    } else if (S.category === 'pages') {
      const pages = (db['pages.json'] && db['pages.json'].pages) || {};
      const item = pages[S.itemId] || Object.values(pages)[0];
      if (item) {
        S.itemId = item.id;
        if (S.fieldKey === 'quote') {
          const q = (item.hero && item.hero.quote) || {};
          S.text.tr = q.tr || '';
          S.text.en = q.en || '';
        } else if (S.fieldKey === 'announcement') {
          const ann = (item.announcement && item.announcement.text) || {};
          S.text.tr = ann.tr || '';
          S.text.en = ann.en || '';
        } else if (S.fieldKey === 'customContent') {
          const cc = item.customContent || {};
          S.text.tr = typeof cc === 'object' ? (cc.tr || '') : String(cc || '');
          S.text.en = typeof cc === 'object' ? (cc.en || '') : '';
        } else {
          const val = item.description || {};
          S.text.tr = typeof val === 'object' ? (val.tr || '') : String(val || '');
          S.text.en = typeof val === 'object' ? (val.en || '') : '';
        }
      }
    } else if (S.category === 'gods') {
      const gods = (db['lore.json'] && db['lore.json'].gods) || [];
      const item = gods.find(g => g.id === S.itemId) || gods[0];
      if (item) {
        S.itemId = item.id;
        const val = item[S.fieldKey] || {};
        S.text.tr = typeof val === 'object' ? (val.tr || '') : String(val || '');
        S.text.en = typeof val === 'object' ? (val.en || '') : '';
      }
    } else if (S.category === 'events') {
      const events = (db['lore.json'] && db['lore.json'].events) || [];
      const item = events.find(e => e.id === S.itemId) || events[0];
      if (item) {
        S.itemId = item.id;
        const val = item[S.fieldKey] || {};
        S.text.tr = typeof val === 'object' ? (val.tr || '') : String(val || '');
        S.text.en = typeof val === 'object' ? (val.en || '') : '';
      }
    }

    S.dirty = false;
  }

  /* Aktif Metni Veritabanına ve Sunucuya Kaydet */
  function saveActiveItemText() {
    const db = A.DB;
    if (!db || !S.itemId) return false;

    if (S.category === 'chars') {
      const chars = (db['characters.json'] && db['characters.json'].characters) || [];
      const item = chars.find(c => c.id === S.itemId);
      if (!item) return false;
      if (typeof item[S.fieldKey] === 'object' && item[S.fieldKey] !== null) {
        item[S.fieldKey].tr = S.text.tr;
        item[S.fieldKey].en = S.text.en;
      } else {
        item[S.fieldKey] = { tr: S.text.tr, en: S.text.en };
      }
      A.save('characters.json');
      A.toast(`Karakter (${item.name?.tr || item.id}) yazısı kaydedildi.`);
    } else if (S.category === 'cities') {
      const cities = (db['geography.json'] && db['geography.json'].cities) || [];
      const item = cities.find(c => c.id === S.itemId);
      if (!item) return false;
      if (typeof item[S.fieldKey] === 'object' && item[S.fieldKey] !== null) {
        item[S.fieldKey].tr = S.text.tr;
        item[S.fieldKey].en = S.text.en;
      } else {
        item[S.fieldKey] = { tr: S.text.tr, en: S.text.en };
      }
      A.save('geography.json');
      A.toast(`Şehir (${item.name?.tr || item.name || item.id}) sayfası kaydedildi.`);
    } else if (S.category === 'geo') {
      const provs = (db['geography.json'] && db['geography.json'].provinces) || [];
      const item = provs.find(p => (p.id || p.name) === S.itemId);
      if (!item) return false;
      if (typeof item[S.fieldKey] === 'object' && item[S.fieldKey] !== null) {
        item[S.fieldKey].tr = S.text.tr;
        item[S.fieldKey].en = S.text.en;
      } else {
        item[S.fieldKey] = { tr: S.text.tr, en: S.text.en };
      }
      A.save('geography.json');
      A.toast(`Eyalet (${item.name?.tr || item.name}) kılavuzu kaydedildi.`);
    } else if (S.category === 'pages') {
      const pages = (db['pages.json'] && db['pages.json'].pages) || {};
      const item = pages[S.itemId];
      if (!item) return false;
      if (S.fieldKey === 'quote') {
        if (!item.hero) item.hero = {};
        item.hero.quote = { tr: S.text.tr, en: S.text.en };
      } else if (S.fieldKey === 'announcement') {
        if (!item.announcement) item.announcement = {};
        item.announcement.text = { tr: S.text.tr, en: S.text.en };
      } else if (S.fieldKey === 'customContent') {
        item.customContent = { tr: S.text.tr, en: S.text.en };
      } else {
        item.description = { tr: S.text.tr, en: S.text.en };
      }
      A.save('pages.json');
      A.toast(`Sayfa (${item.name || item.id}) makalesi kaydedildi.`);
    } else if (S.category === 'gods') {
      const gods = (db['lore.json'] && db['lore.json'].gods) || [];
      const item = gods.find(g => g.id === S.itemId);
      if (!item) return false;
      if (typeof item[S.fieldKey] === 'object' && item[S.fieldKey] !== null) {
        item[S.fieldKey].tr = S.text.tr;
        item[S.fieldKey].en = S.text.en;
      } else {
        item[S.fieldKey] = { tr: S.text.tr, en: S.text.en };
      }
      A.save('lore.json');
      A.toast(`Tanrı (${item.name?.tr || item.name || item.id}) doktrini kaydedildi.`);
    } else if (S.category === 'events') {
      const events = (db['lore.json'] && db['lore.json'].events) || [];
      const item = events.find(e => e.id === S.itemId);
      if (!item) return false;
      if (typeof item[S.fieldKey] === 'object' && item[S.fieldKey] !== null) {
        item[S.fieldKey].tr = S.text.tr;
        item[S.fieldKey].en = S.text.en;
      } else {
        item[S.fieldKey] = { tr: S.text.tr, en: S.text.en };
      }
      A.save('lore.json');
      A.toast(`Tarihsel Hadise (${item.name?.tr || item.id}) anlatısı kaydedildi.`);
    }

    S.dirty = false;
    updateStatusBar();
    return true;
  }

  /* Canlı İstatistikler */
  function updateStatusBar() {
    const curText = S.text[S.lang] || '';
    const words = (curText.trim().match(/\S+/g) || []).length;
    const chars = curText.length;
    const paras = curText.split(/\n{2,}/).filter(p => p.trim()).length;
    const mins = Math.max(1, Math.round(words / 160));

    const statEl = $('#ae-stats');
    if (statEl) {
      statEl.innerHTML = `<strong>${words}</strong> kelime · <strong>${chars}</strong> karakter · <strong>${paras}</strong> paragraf · ~${mins} dk okuma`;
    }

    const dirtyEl = $('#ae-dirty');
    if (dirtyEl) {
      if (S.dirty) {
        dirtyEl.className = 'ae-dirty-indicator dirty';
        dirtyEl.innerHTML = '● Kaydedilmemiş Taslak';
      } else {
        dirtyEl.className = 'ae-dirty-indicator';
        dirtyEl.innerHTML = '✓ Veritabanı ve Sunucu ile Senkronize';
      }
    }
  }

  /* Canlı Önizlemeyi Yenile */
  function updatePreview() {
    const curText = S.text[S.lang] || '';
    const body = $('#ae-preview-body');
    if (body) {
      body.innerHTML = parseAndRenderMarkdown(curText);
    }
  }

  /* Hedef Öğeleri Al */
  function getItemsForCategory(cat) {
    const db = A.DB || {};
    if (cat === 'chars') {
      const chars = (db['characters.json'] && db['characters.json'].characters) || [];
      return chars.map(c => ({
        id: c.id,
        label: `${c.emperorNumber ? `👑 #${c.emperorNumber} ` : ''}${c.name?.tr || c.id} (${c.house?.tr || c.group || ''})`
      }));
    }
    if (cat === 'cities') {
      const cities = (db['geography.json'] && db['geography.json'].cities) || [];
      return cities.map(c => ({
        id: c.id,
        label: `🏙️ ${c.name?.tr || c.name || c.id} [${c.province?.tr || c.province || 'Bölge'}]`
      }));
    }
    if (cat === 'geo') {
      const provs = (db['geography.json'] && db['geography.json'].provinces) || [];
      return provs.map(p => ({
        id: p.id || (typeof p.name === 'object' ? p.name.tr : p.name),
        label: `🏔️ ${typeof p.name === 'object' ? p.name.tr : p.name}`
      }));
    }
    if (cat === 'pages') {
      const pages = (db['pages.json'] && db['pages.json'].pages) || {};
      return Object.values(pages).map(p => ({
        id: p.id,
        label: `📑 ${p.name || p.id} (${p.path || ''})`
      }));
    }
    if (cat === 'gods') {
      const gods = (db['lore.json'] && db['lore.json'].gods) || [];
      return gods.map(g => ({
        id: g.id,
        label: `✨ ${g.name?.tr || g.name || g.id} (${g.domain?.tr || 'Denge Konseyi'})`
      }));
    }
    if (cat === 'events') {
      const events = (db['lore.json'] && db['lore.json'].events) || [];
      return events.map(e => ({
        id: e.id,
        label: `⏳ ${e.ks ? `KS ${e.ks}: ` : ''}${e.name?.tr || e.id}`
      }));
    }
    return [];
  }

  /* Hedef Alanları Al */
  function getFieldsForCategory(cat) {
    if (cat === 'chars') {
      return [
        { key: 'bio', label: '📖 Biyografi & Saltanat Tarihçesi (bio)' },
        { key: 'characterTraits', label: '🧠 Liderlik Psikolojisi & Karakter (characterTraits)' },
        { key: 'physical', label: '👁️ Fiziksel Tasvir & Alametler (physical)' },
        { key: 'controversies', label: '🔥 İhtilaflar, Suikastlar & Sır Kararlar (controversies)' },
        { key: 'chroniclerNotes', label: '🖋️ Divan Başvakanüvisi Şerhleri & Miras (chroniclerNotes)' },
        { key: 'nameMeaning', label: '📜 İsim Kökeni & Kutsal Anlam (nameMeaning)' },
        { key: 'kinship', label: '👑 Hanedan & Soy Bağı (kinship)' },
        { key: 'quote', label: '💬 Tanımlayıcı Söz / Vecize (quote)' }
      ];
    }
    if (cat === 'cities') {
      return [
        { key: 'history', label: '📜 Şehir Tarihçesi & Kuruluş Efsanesi (history)' },
        { key: 'fortifications', label: '🏰 Surlar, Burçlar & Savunma Mimarisi (fortifications)' },
        { key: 'economy', label: '💰 İktisat, Zanaat Loncaları & Ticaret (economy)' },
        { key: 'governance', label: '⚖️ İdare, Garnizon & Kanun Nizamı (governance)' },
        { key: 'culture', label: '🎭 Kültür, Sosyal Hayat & Mabedler (culture)' },
        { key: 'description', label: '📑 Genel Tanıtım & Coğrafi Konum (description)' }
      ];
    }
    if (cat === 'geo') {
      return [
        { key: 'history', label: '📜 Eyalet Tarihçesi & Tahta Sadakat (history)' },
        { key: 'cities', label: '🏰 Şehirler & Yerleşimler Rehberi (cities)' },
        { key: 'economy', label: '💰 İktisat, Tarım & Maden Havzaları (economy)' },
        { key: 'flag', label: '🚩 Sancak & Hanedan Sembolizmi (flag)' },
        { key: 'neighbors', label: '🗺️ Sınırlar & Jeopolitik Durum (neighbors)' }
      ];
    }
    if (cat === 'pages') {
      return [
        { key: 'description', label: '📑 Sayfa Makalesi & Ansiklopedi Girişi (description)' },
        { key: 'quote', label: '💬 Hero Epigrafı & Felsefi Alıntı (quote)' },
        { key: 'announcement', label: '📜 İmparatorluk Fermanı / Duyuru Metni (announcement)' },
        { key: 'customContent', label: '🖋️ Sayfa İçi Ek Açıklamalar & Dipnotlar (customContent)' }
      ];
    }
    if (cat === 'gods') {
      return [
        { key: 'desc', label: '📜 Kutsal Doktrin & İnanç Felsefesi (desc)' },
        { key: 'temple', label: '🏛️ Mabed Mimarisi & Rahipler Nizamı (temple)' },
        { key: 'cult', label: '🕯️ İbadet Ayinleri, Adaklar & Kutsal Günler (cult)' },
        { key: 'symbol', label: '⚖️ Sembolün Derin Ezoterik Anlamı (symbol)' }
      ];
    }
    if (cat === 'events') {
      return [
        { key: 'desc', label: '⚔️ Hadisenin Ayrıntılı Tarihsel Anlatısı (desc)' },
        { key: 'aftermath', label: '📜 Siyasi, Askeri & Sosyal Neticeler (aftermath)' },
        { key: 'chronic', label: '🖋️ Divan Başvakanüvisi Şerhi (chronic)' }
      ];
    }
    return [];
  }

  /* Canlı Sayfa Linkini Hesapla */
  function getLiveSiteLink() {
    if (S.category === 'chars') {
      return `karakter-sablon.html#/karakter/${encodeURIComponent(S.itemId)}`;
    }
    if (S.category === 'cities') {
      return `harita.html`;
    }
    if (S.category === 'geo') {
      return `harita.html`;
    }
    if (S.category === 'pages') {
      const db = A.DB || {};
      const pages = (db['pages.json'] && db['pages.json'].pages) || {};
      const p = pages[S.itemId];
      return p && p.path ? p.path : 'index.html';
    }
    if (S.category === 'gods') {
      return `tanri-detay.html?id=${encodeURIComponent(S.itemId)}`;
    }
    if (S.category === 'events') {
      return `olay-detay.html?id=${encodeURIComponent(S.itemId)}`;
    }
    return 'index.html';
  }

  /* Ana Görünüm Render */
  function renderView() {
    const viewContainer = $('#view');
    if (!viewContainer) return;

    let items = getItemsForCategory(S.category);
    if (S.itemFilter) {
      const q = S.itemFilter.toLowerCase();
      items = items.filter(it => it.label.toLowerCase().includes(q) || it.id.toLowerCase().includes(q));
    }

    if (!S.itemId && items.length) {
      S.itemId = items[0].id;
    } else if (items.length && !items.some(it => it.id === S.itemId)) {
      S.itemId = items[0].id;
    }

    const fields = getFieldsForCategory(S.category);
    if (!fields.some(f => f.key === S.fieldKey)) {
      S.fieldKey = fields[0]?.key || 'bio';
    }

    loadActiveItemText();
    const liveSiteLink = getLiveSiteLink();

    viewContainer.innerHTML = `
      <div class="ae-container">
        <!-- 1. ÜST KONTROL PANELİ -->
        <div class="ae-header-bar">
          <div class="ae-target-selector">
            <div>
              <label class="ae-field-label" for="ae-cat">1. Kategori Seçin</label>
              <select class="f-select" id="ae-cat">
                <option value="chars" ${S.category === 'chars' ? 'selected' : ''}>👤 Karakter Sayfaları &amp; Hükümdarlar</option>
                <option value="cities" ${S.category === 'cities' ? 'selected' : ''}>🏙️ Şehirler, Başkentler &amp; Kaleler</option>
                <option value="geo" ${S.category === 'geo' ? 'selected' : ''}>🏔️ Eyalet &amp; Coğrafya Kılavuzları</option>
                <option value="pages" ${S.category === 'pages' ? 'selected' : ''}>📑 Wiki &amp; Evren Sayfaları (CMS)</option>
                <option value="gods" ${S.category === 'gods' ? 'selected' : ''}>✨ Tanrılar &amp; Mabed Doktrinleri</option>
                <option value="events" ${S.category === 'events' ? 'selected' : ''}>⏳ Tarihî Hadiseler &amp; Seferler</option>
              </select>
            </div>

            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <label class="ae-field-label" for="ae-item">2. Düzenlenecek Madde</label>
                <span style="font-size:.68rem;color:var(--parchd);">${items.length} kayıt</span>
              </div>
              <div style="display:flex;gap:4px;">
                <input type="text" class="f-input ae-quick-search" id="ae-item-filter" placeholder="Hızlı filtrele…" value="${esc(S.itemFilter)}" style="max-width:130px;font-size:.76rem;padding:4px 6px;">
                <select class="f-select" id="ae-item" style="flex:1;">
                  ${items.map(it => `<option value="${esc(it.id)}" ${it.id === S.itemId ? 'selected' : ''}>${esc(it.label)}</option>`).join('')}
                </select>
              </div>
            </div>

            <div>
              <label class="ae-field-label" for="ae-field">3. Yazı Alanı / Bölümü</label>
              <select class="f-select" id="ae-field">
                ${fields.map(fd => `<option value="${esc(fd.key)}" ${fd.key === S.fieldKey ? 'selected' : ''}>${esc(fd.label)}</option>`).join('')}
              </select>
            </div>

            <div style="display:flex;gap:8px;align-items:flex-end;">
              <button class="abtn primary" type="button" id="ae-save-btn" title="Ctrl+S">💾 Veritabanına Kaydet</button>
              <a class="abtn" id="ae-site-btn" href="${esc(liveSiteLink)}" target="_blank" rel="noopener">Canlı Sayfada Gör ↗</a>
            </div>
          </div>

          <!-- DİL SEÇİMİ VE GÖRÜNÜM MODLARI -->
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;border-top:1px solid rgba(255,255,255,.06);padding-top:.75rem;">
            <div class="ae-lang-tabs">
              <button class="ae-lang-btn ${S.lang === 'tr' ? 'on' : ''}" type="button" data-lang="tr">🇹🇷 Türkçe Metin</button>
              <button class="ae-lang-btn ${S.lang === 'en' ? 'on' : ''}" type="button" data-lang="en">🇬🇧 English Translation</button>
            </div>

            <div style="display:flex;align-items:center;gap:12px;">
              <div class="ae-view-modes">
                <button class="ae-mode-btn ${S.viewMode === 'split' ? 'on' : ''}" type="button" data-mode="split" title="İki bölmeli: Yazı ve anlık wiki önizlemesi yan yana">◫ İki Bölmeli (Split)</button>
                <button class="ae-mode-btn ${S.viewMode === 'edit' ? 'on' : ''}" type="button" data-mode="edit" title="Yalnızca editöre odaklan">✏️ Yalnızca Editör</button>
                <button class="ae-mode-btn ${S.viewMode === 'preview' ? 'on' : ''}" type="button" data-mode="preview" title="Yalnızca önizlemeyi gör">👁️ Yalnızca Önizleme</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. ÇALIŞMA ALANI -->
        <div class="ae-workspace mode-${S.viewMode}" id="ae-workspace">
          <!-- SOL BÖLME: EDİTÖR -->
          <div class="ae-editor-pane">
            <!-- GELİŞMİŞ BİÇİMLENDİRME ARAÇ ÇUBUĞU -->
            <div class="rich-toolbar" role="toolbar" aria-label="Gelişmiş Yazı Biçimlendirme Araç Çubuğu">
              <!-- Paragraf & Başlık Grubu -->
              <div class="rt-group" title="Paragraf & Başlıklar">
                <button type="button" class="rt-btn" data-act="p" title="Standart Paragraf (¶)">¶</button>
                <button type="button" class="rt-btn" data-act="lead" title="Tezhipli Gotik Başlangıç Paragrafı (Lead Drop-Cap)">¶+</button>
                <button type="button" class="rt-btn" data-act="h1" title="Büyük Ana Başlık (H1)"><b>H1</b></button>
                <button type="button" class="rt-btn" data-act="h2" title="Kalın Bölüm Başlığı (H2)"><b>H2</b></button>
                <button type="button" class="rt-btn" data-act="h3" title="Alt Başlık (H3)"><b>H3</b></button>
                <button type="button" class="rt-btn" data-act="h4" title="Küçük Detay Başlığı (H4)"><b>H4</b></button>
              </div>

              <!-- Metin Biçimleri Grubu -->
              <div class="rt-group" title="Yazı Biçimleri">
                <button type="button" class="rt-btn" data-act="bold" title="Kalın Metin (**metin**)"><b>B</b></button>
                <button type="button" class="rt-btn" data-act="italic" title="İtalik Metin (*metin*)"><i>I</i></button>
                <button type="button" class="rt-btn" data-act="underline" title="Altı Çizili Metin (<u>metin</u>)"><u>U</u></button>
                <button type="button" class="rt-btn" data-act="strike" title="Üstü Çizili Metin (~~metin~~)"><del>S</del></button>
                <button type="button" class="rt-btn" data-act="code" title="Terim / Kod Vurgusu (\`terim\`)"><code>C</code></button>
                <button type="button" class="rt-btn" data-act="gold" title="Altın Vurgu"><span style="color:var(--gold)">🟡</span></button>
                <button type="button" class="rt-btn" data-act="blood" title="İmparatorluk Kan Kırmızısı Vurgu"><span style="color:#ff6b6b">🔴</span></button>
              </div>

              <!-- Özel Bloklar & Kutular -->
              <div class="rt-group" title="Özel Evren Blokları">
                <button type="button" class="rt-btn" data-act="divan" title="Divan Başvakanüvisi Şerh Kutusu">📜 Divan</button>
                <button type="button" class="rt-btn" data-act="quote" title="Tarihî Vecize &amp; Alıntı">❝ Alıntı</button>
                <button type="button" class="rt-btn" data-act="note" title="Evren Bilgi / Arşiv Notu">💡 Not</button>
                <button type="button" class="rt-btn" data-act="warn" title="Yasak İlim &amp; Kriz İhtilafı">⚠️ Uyarı</button>
                <button type="button" class="rt-btn" data-act="law" title="İmparatorluk Ferman Maddesi">⚖️ Kanun</button>
              </div>

              <!-- Liste, Tablo ve Ayraç -->
              <div class="rt-group" title="Listeler &amp; Tablo">
                <button type="button" class="rt-btn" data-act="bullet" title="Madde İşaretli Liste">• Liste</button>
                <button type="button" class="rt-btn" data-act="number" title="Numaralı Sıralı Liste">1. Sıralı</button>
                <button type="button" class="rt-btn" data-act="meta" title="Özellik / Sicil Listesi">▣ Sicil</button>
                <button type="button" class="rt-btn" data-act="table" title="Zengin 3 Sütunlu Bilgi Tablosu Ekle">▦ Tablo</button>
                <button type="button" class="rt-btn" data-act="hr" title="Süslemeli Bölüm Ayracı (---)">―</button>
              </div>

              <!-- Bağlantı ve Görsel -->
              <div class="rt-group" title="Bağlantı &amp; Görsel">
                <button type="button" class="rt-btn" data-act="link" title="Dahili Wiki Bağlantısı Ekle (Karakter, Şehir, Tanrı)">🔗 Wiki Linki</button>
                <button type="button" class="rt-btn" data-act="image" title="İçerik İçi Görsel Ekle">🖼️ Görsel</button>
              </div>

              <!-- Hazır Karanlık Fantezi Şablonları -->
              <div class="rt-group">
                <select class="rt-select" id="ae-template-sel" title="Hazır Karanlık Fantezi Şablonu Ekle">
                  <option value="">📑 Şablon Seç…</option>
                  <option value="char_bio">👤 Karakter Biyografisi</option>
                  <option value="city_guide">🏙️ Şehir &amp; Kale Kılavuzu</option>
                  <option value="province_overview">🏔️ Eyalet &amp; Coğrafya</option>
                  <option value="decree_charter">📜 Divan Fermanı &amp; Kanun</option>
                  <option value="war_chronicle">⚔️ Askeri Sefer &amp; Kriz</option>
                  <option value="god_doctrine">✨ Tanrı &amp; Kült Doktrini</option>
                  <option value="house_charter">🏰 Hanedan &amp; Kadim Sancak</option>
                </select>
              </div>

              <!-- Geri Al / Yinele & Araçlar -->
              <div class="rt-group rt-right">
                <button type="button" class="rt-btn" data-act="undo" title="Geri Al (Ctrl+Z)">↩</button>
                <button type="button" class="rt-btn" data-act="redo" title="Yinele (Ctrl+Y)">↪</button>
                <button type="button" class="rt-btn" data-act="clear" title="Biçimlendirmeyi Temizle">🧹</button>
                <button type="button" class="rt-btn" id="ae-copy-btn" title="Markdown Olarak Panoya Kopyala">📋 Kopyala</button>
              </div>
            </div>

            <!-- METİN ALANI -->
            <textarea class="ae-editor-textarea" id="ae-textarea" spellcheck="true" lang="${S.lang}" placeholder="Metni buraya yazın veya araç çubuğundaki zengin biçimlendirme araçlarını kullanarak makalenizi oluşturun…">${esc(S.text[S.lang])}</textarea>

            <!-- DURUM ÇUBUĞU -->
            <div class="ae-status-bar">
              <span id="ae-stats">0 kelime · 0 karakter</span>
              <span class="ae-dirty-indicator" id="ae-dirty">✓ Senkronize</span>
            </div>
          </div>

          <!-- SAĞ BÖLME: CANLI WIKI ÖNİZLEMESİ -->
          <div class="ae-preview-pane">
            <div class="ae-preview-header">
              <span>👁️ Canlı Stallhart Wiki Önizlemesi (${S.lang === 'tr' ? 'Türkçe' : 'English'})</span>
              <span style="font-size:.7rem;opacity:.7;">Sitede gerçek karanlık fantezi tasarımıyla görüntülenecektir</span>
            </div>
            <div class="ae-preview-body" id="ae-preview-body"></div>
          </div>
        </div>
      </div>

      <!-- WIKI BAĞLANTI MODALI -->
      <div class="ae-modal-backdrop" id="ae-link-modal" style="display:none">
        <div class="ae-modal">
          <div class="ae-modal-head">
            <h3>🔗 Dahili Wiki Bağlantısı Ekle</h3>
            <button type="button" class="abtn sm" id="ae-link-modal-close">✕</button>
          </div>
          <div class="ae-modal-body">
            <p style="font-size:.8rem;color:var(--parchd);margin-bottom:.75rem;">Metin içine otomatik çapraz bağlantı eklemek için bir evren maddesi arayın veya seçin:</p>
            <div class="f-row">
              <input type="search" class="f-input" id="ae-modal-search" placeholder="Karakter, şehir, eyalet veya tanrı adı yazın…">
            </div>
            <div class="f-row">
              <label class="f-label">Bağlantı Görünen Metni (İsteğe bağlı değiştirin)</label>
              <input type="text" class="f-input" id="ae-modal-label" placeholder="Örn: I. Craes Stallhart">
            </div>
            <div class="ae-modal-results" id="ae-modal-results"></div>
          </div>
        </div>
      </div>

      <!-- GÖRSEL EKLEME MODALI -->
      <div class="ae-modal-backdrop" id="ae-image-modal" style="display:none">
        <div class="ae-modal">
          <div class="ae-modal-head">
            <h3>🖼️ Makaleye Görsel / Portre Ekle</h3>
            <button type="button" class="abtn sm" id="ae-img-modal-close">✕</button>
          </div>
          <div class="ae-modal-body">
            <div class="f-row">
              <label class="f-label">Görsel Dosya Yolu veya URL</label>
              <input type="text" class="f-input" id="ae-img-url" placeholder="assets/images/characters/craes.webp">
              <div class="f-hint">Admin panelindeki Görsel Yöneticisi'nden dosya yolu kopyalayabilir veya doğrudan yazabilirsiniz.</div>
            </div>
            <div class="f-row">
              <label class="f-label">Görsel Altyazısı (Figcaption)</label>
              <input type="text" class="f-input" id="ae-img-caption" placeholder="I. Craes Stallhart taht salonunda divan fermanını mühürlerken">
            </div>
            <div class="btn-row" style="margin-top:1rem;justify-content:flex-end;">
              <button type="button" class="abtn" id="ae-img-cancel">İptal</button>
              <button type="button" class="abtn primary" id="ae-img-confirm">Görseli Makaleye Ekle</button>
            </div>
          </div>
        </div>
      </div>
    `;

    bindEvents();
    updatePreview();
    updateStatusBar();
  }

  /* Wiki Bağlantı Modalı */
  function openLinkModal(selectedText) {
    const modal = $('#ae-link-modal');
    if (!modal) return;
    const labelInput = $('#ae-modal-label');
    const searchInput = $('#ae-modal-search');
    const resultsBox = $('#ae-modal-results');
    if (labelInput) labelInput.value = selectedText || '';
    if (searchInput) {
      searchInput.value = selectedText || '';
      setTimeout(() => searchInput.focus(), 50);
    }

    renderLinkResults(selectedText || '');
    modal.style.display = 'flex';
  }

  function renderLinkResults(query) {
    const resultsBox = $('#ae-modal-results');
    if (!resultsBox) return;
    const db = A.DB || {};
    const q = (query || '').toLowerCase().trim();

    const targets = [];

    // Karakterler
    ((db['characters.json'] && db['characters.json'].characters) || []).forEach(c => {
      const name = c.name?.tr || c.name || c.id;
      targets.push({
        type: 'character',
        id: c.id,
        title: name,
        sub: `👤 Karakter · ${c.house?.tr || c.house || ''} · ${c.title?.tr || c.title || ''}`,
        url: `wiki:character:${c.id}`
      });
    });

    // Şehirler
    ((db['geography.json'] && db['geography.json'].cities) || []).forEach(ct => {
      const name = ct.name?.tr || ct.name || ct.id;
      targets.push({
        type: 'geo',
        id: ct.id,
        title: name,
        sub: `🏙️ Şehir · ${ct.province?.tr || ct.province || ''}`,
        url: `wiki:geo:${ct.id}`
      });
    });

    // Eyaletler
    ((db['geography.json'] && db['geography.json'].provinces) || []).forEach(p => {
      const name = typeof p.name === 'object' ? p.name.tr : p.name;
      const pid = p.id || name;
      targets.push({
        type: 'geo',
        id: pid,
        title: name,
        sub: `🏔️ Eyalet · ${p.governor || 'Divan'}`,
        url: `wiki:geo:${pid}`
      });
    });

    // Tanrılar
    ((db['lore.json'] && db['lore.json'].gods) || []).forEach(g => {
      const name = g.name?.tr || g.name || g.id;
      targets.push({
        type: 'god',
        id: g.id,
        title: name,
        sub: `✨ Tanrı · ${g.domain?.tr || g.domain || ''}`,
        url: `wiki:god:${g.id}`
      });
    });

    // Hadiseler
    ((db['lore.json'] && db['lore.json'].events) || []).forEach(e => {
      const name = e.name?.tr || e.name || e.id;
      targets.push({
        type: 'event',
        id: e.id,
        title: name,
        sub: `⏳ Olay · ${e.ks ? `KS ${e.ks}` : ''}`,
        url: `wiki:event:${e.id}`
      });
    });

    const filtered = q
      ? targets.filter(t => t.title.toLowerCase().includes(q) || t.sub.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
      : targets.slice(0, 40);

    if (!filtered.length) {
      resultsBox.innerHTML = '<div style="padding:1rem;color:var(--parchd);text-align:center;font-style:italic;">Eşleşen madde bulunamadı.</div>';
      return;
    }

    resultsBox.innerHTML = filtered.map(t => `
      <div class="ae-modal-item" data-url="${esc(t.url)}" data-title="${esc(t.title)}">
        <div style="font-weight:600;color:var(--parchl);font-size:.88rem;">${esc(t.title)}</div>
        <div style="font-size:.74rem;color:var(--parchd);">${esc(t.sub)}</div>
      </div>
    `).join('');

    $$('.ae-modal-item', resultsBox).forEach(el => {
      el.addEventListener('click', () => {
        const url = el.dataset.url;
        const defaultTitle = el.dataset.title;
        const customLabel = $('#ae-modal-label')?.value.trim();
        const label = customLabel || defaultTitle;
        const ta = $('#ae-textarea');
        applyAction(ta, 'link', { label, url });
        $('#ae-link-modal').style.display = 'none';
      });
    });
  }

  /* Görsel Modalı */
  function openImageModal() {
    const modal = $('#ae-image-modal');
    if (!modal) return;
    const urlInput = $('#ae-img-url');
    const capInput = $('#ae-img-caption');
    if (urlInput) urlInput.value = '';
    if (capInput) capInput.value = '';
    modal.style.display = 'flex';
    setTimeout(() => urlInput?.focus(), 50);
  }

  /* Olayları Bağla */
  function bindEvents() {
    const ta = $('#ae-textarea');
    if (!ta) return;

    // Metin değiştikçe önizlemeyi ve durumu anında güncelle
    ta.addEventListener('input', () => {
      S.text[S.lang] = ta.value;
      S.dirty = true;
      updatePreview();
      updateStatusBar();
    });

    // Kısayollar
    ta.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveActiveItemText();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        applyAction(ta, 'bold');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        applyAction(ta, 'italic');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        applyAction(ta, 'underline');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        applyAction(ta, 'link');
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        ta.value = ta.value.substring(0, start) + '  ' + ta.value.substring(end);
        ta.selectionStart = ta.selectionEnd = start + 2;
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // Araç Çubuğu Butonları
    $$('.rich-toolbar .rt-btn[data-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        applyAction(ta, act);
      });
    });

    // Şablon Seçici
    const tplSel = $('#ae-template-sel');
    if (tplSel) {
      tplSel.addEventListener('change', () => {
        if (tplSel.value) {
          applyAction(ta, 'template', tplSel.value);
          tplSel.value = '';
        }
      });
    }

    // Markdown Kopyala
    const copyBtn = $('#ae-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(ta.value).then(() => {
          A.toast('Markdown panoya kopyalandı.');
        }).catch(() => {
          A.toast('Kopyalama başarısız oldu.', true);
        });
      });
    }

    // Kategori Değişimi
    $('#ae-cat')?.addEventListener('change', e => {
      S.category = e.target.value;
      S.itemId = '';
      S.itemFilter = '';
      renderView();
    });

    // Hızlı Filtre Arama
    $('#ae-item-filter')?.addEventListener('input', e => {
      S.itemFilter = e.target.value;
      const filtered = getItemsForCategory(S.category).filter(it =>
        it.label.toLowerCase().includes(S.itemFilter.toLowerCase()) || it.id.toLowerCase().includes(S.itemFilter.toLowerCase())
      );
      const itemSel = $('#ae-item');
      if (itemSel) {
        itemSel.innerHTML = filtered.map(it => `<option value="${esc(it.id)}" ${it.id === S.itemId ? 'selected' : ''}>${esc(it.label)}</option>`).join('');
        if (filtered.length && !filtered.some(it => it.id === S.itemId)) {
          S.itemId = filtered[0].id;
          loadActiveItemText();
          ta.value = S.text[S.lang];
          updatePreview();
          updateStatusBar();
        }
      }
    });

    // Madde Değişimi
    $('#ae-item')?.addEventListener('change', e => {
      S.itemId = e.target.value;
      loadActiveItemText();
      ta.value = S.text[S.lang];
      updatePreview();
      updateStatusBar();
      const siteBtn = $('#ae-site-btn');
      if (siteBtn) siteBtn.href = getLiveSiteLink();
    });

    // Alan Değişimi
    $('#ae-field')?.addEventListener('change', e => {
      S.fieldKey = e.target.value;
      loadActiveItemText();
      ta.value = S.text[S.lang];
      updatePreview();
      updateStatusBar();
    });

    // Dil Değişimi
    $$('.ae-lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.ae-lang-btn').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        S.lang = btn.dataset.lang;
        ta.value = S.text[S.lang] || '';
        ta.lang = S.lang;
        updatePreview();
        updateStatusBar();
      });
    });

    // Görünüm Modu (Split / Edit / Preview)
    $$('.ae-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.ae-mode-btn').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        S.viewMode = btn.dataset.mode;
        const ws = $('#ae-workspace');
        if (ws) ws.className = `ae-workspace mode-${S.viewMode}`;
      });
    });

    // Kaydet Butonu
    $('#ae-save-btn')?.addEventListener('click', () => {
      saveActiveItemText();
    });

    // Link Modalı Kapatma & Arama
    $('#ae-link-modal-close')?.addEventListener('click', () => {
      $('#ae-link-modal').style.display = 'none';
    });
    $('#ae-modal-search')?.addEventListener('input', e => {
      renderLinkResults(e.target.value);
    });

    // Görsel Modalı Kapatma & Ekleme
    $('#ae-img-modal-close')?.addEventListener('click', () => {
      $('#ae-image-modal').style.display = 'none';
    });
    $('#ae-img-cancel')?.addEventListener('click', () => {
      $('#ae-image-modal').style.display = 'none';
    });
    $('#ae-img-confirm')?.addEventListener('click', () => {
      const url = $('#ae-img-url')?.value.trim();
      const caption = $('#ae-img-caption')?.value.trim();
      if (!url) {
        A.toast('Lütfen geçerli bir görsel yolu veya URL girin.', true);
        return;
      }
      applyAction(ta, 'image', { url, caption });
      $('#ae-image-modal').style.display = 'none';
    });
  }

  /* Belirli Bir Maddeyi Doğrudan Editörde Aç */
  function openArticle(category, itemId, fieldKey) {
    if (category) S.category = category;
    if (itemId) S.itemId = itemId;
    if (fieldKey) S.fieldKey = fieldKey;
    location.hash = 'articles';
    const navBtn = document.querySelector('.side-item[data-view="articles"]');
    if (navBtn) navBtn.click();
    else renderView();
  }

  /* Sayfa Genelindeki Zengin Araç Çubuklarını (Drawer içindekiler dahil) Dinle */
  document.addEventListener('click', ev => {
    const btn = ev.target.closest('.rich-toolbar .rt-btn[data-act]');
    if (!btn) return;
    const toolbar = btn.closest('.rich-toolbar');
    if (!toolbar || !toolbar.dataset.target) return;
    const targetId = toolbar.dataset.target;
    const ta = $('#' + targetId);
    if (!ta) return;
    const act = btn.dataset.act;
    if (act === 'preview') {
      const prevBox = $('#' + targetId + '-preview');
      if (prevBox) {
        prevBox.classList.toggle('open');
        btn.classList.toggle('on');
        if (prevBox.classList.contains('open')) {
          prevBox.innerHTML = parseAndRenderMarkdown(ta.value);
        }
      }
    } else {
      applyAction(ta, act);
      const prevBox = $('#' + targetId + '-preview');
      if (prevBox && prevBox.classList.contains('open')) {
        prevBox.innerHTML = parseAndRenderMarkdown(ta.value);
      }
    }
  });

  // Drawer içindeki textarea değişikliklerinde açık önizlemeyi yenile
  document.addEventListener('input', ev => {
    const ta = ev.target;
    if (ta && ta.classList && ta.classList.contains('f-area')) {
      const prevBox = $('#' + ta.id + '-preview');
      if (prevBox && prevBox.classList.contains('open')) {
        prevBox.innerHTML = parseAndRenderMarkdown(ta.value);
      }
    }
  });

  window.ArticleEditor = {
    renderView,
    open: openArticle,
    renderMarkdown: parseAndRenderMarkdown
  };
})();
