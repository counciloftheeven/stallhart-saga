import fs from 'fs';
import path from 'path';

// Clean, rich canonical events list
const events = [
  {
    id: "ev-eyyros-seferi",
    ks: "1137",
    type: "war",
    category: "war",
    name: { tr: "Eyyros Seferi: Birleşme ve İlk Fetih", en: "Campaign of Eyyros: Unification & First Conquest" },
    ruler: "I. Craes Stallhart",
    location: "Gümüş Nehir Geçidi / Doğu Bozkırları",
    belligerents: ["Stallhart Birleşik Beylikleri (~7.000)", "Eyyros Krallığı (~5.000)"],
    desc: {
      tr: "Otorite boşluğunu gören Craes, dağınık beylikleri sancağı altında birleştirdi. Gaddar Kral Theron'un pususunu önceden sezen Craes, sahte geri çekilme ve kanat taarruzuyla Eyyros ordusunu Gümüş Nehir Geçidi'nde imha etti. Stallhart'ın ilk büyük askerî zaferidir.",
      en: "Craes united the scattered clans and crushed King Theron's Eyyros army at Silver River Pass using flanking cavalry tactics."
    },
    details: {
      causes: "Bozkır boylarının bölünmüşlüğü ve Eyyros Krallığı'nın doğu ticaret yollarını haraca bağlaması.",
      course: "Craes öncü kuvveti yem olarak sürdü, ana süvari gövdesiyle nehir kıvrımından kuşatarak düşmanı bataklığa sıkıştırdı.",
      outcome: "Eyyros Krallığı yıkıldı, toprakları birleşik beyliklere katıldı; Craes tartışmasız askerî lider oldu.",
      impact: "Stallhart Krallığı'nın kuruluşuna giden yolun ilk askerî temel taşıdır.",
      quote: "Birleşik bir kalkan, bölünmüş on kılıçtan daha keskindir. — Vakanüvis Kaelan Yıllıkları"
    },
    tags: ["askeri", "fetih", "craes"]
  },
  {
    id: "ev-ilk-nyrdal-savasi-darova",
    ks: "1140",
    type: "crisis",
    category: "tragedy",
    name: { tr: "İlk Nýrdal Savaşı ve Darova Felaketi", en: "First Nýrdal War & The Disaster of Darova" },
    ruler: "I. Craes Stallhart",
    location: "Darova Vadisi / Nýrdal Sınırı",
    belligerents: ["Stallhart Beylikleri Ordusu (~12.000)", "Nýrdal Krallığı Lejyonları (~15.000)"],
    desc: {
      tr: "Stallhart ordusu Darova Vadisi'nde ağır bir yenilgiye uğradı. Craes'in kardeşi savaş meydanında hayatını kaybetti. Craes yaralı olarak esir düştü ve Aleron zindanlarında 5 yıl sürecek çetin esaret dönemi başladı.",
      en: "Craes suffered a catastrophic defeat at Darova. His brother fell in battle and Craes was captured, enduring 5 years of captivity in Aleron."
    },
    details: {
      causes: "Nýrdal'ın genişleyen Stallhart etkisini kırmak için ormanlık arazide erken taarruza geçmesi.",
      course: "Sisli havada ordu ikiye bölündü; Nýrdal zırhlı piyadeleri vadinin çıkışını tutarak çekilme hattını kesti.",
      outcome: "Kardeş kaybı, ordunun üçte ikisinin imhası ve Craes'in esareti.",
      impact: "Craes'in kibrini yıkan, onu askeri bir dehadan sabırlı bir kurucuya dönüştüren en karanlık sınav.",
      quote: "Darova'nın çamurunda sadece bir ordu değil, ham bir kibrin kemikleri de gömüldü."
    },
    tags: ["kriz", "esaret", "nyrdal"]
  },
  {
    id: "ev-imparatorlugun-kurulusu",
    ks: "1144",
    type: "milestone",
    category: "milestone",
    name: { tr: "Stallhart Krallığı'nın Kuruluşu & Kutsal Kaçış", en: "Founding of the Stallhart Realm & Sacred Escape" },
    ruler: "I. Craes Stallhart (İlteriş)",
    location: "Aleron Kalesi / Arava",
    belligerents: ["Craes ve Sadık Yoldaşları", "Aleron Muhafızları"],
    desc: {
      tr: "Aleron zindanlarından kaçmayı başaran Craes, dağınık beylikleri yeniden topladı. Kendisine biat eden 12 boy beyinin huzurunda bağımsız Stallhart Krallığı'nı ilan etti.",
      en: "Escaping from Aleron dungeons, Craes rallied the twelve clans and officially proclaimed the sovereign Kingdom of Stallhart."
    },
    details: {
      causes: "Aleron esaretinin kırılması ve boyların ortak bir taç altında toplanma zorunluluğu.",
      course: "Zindan gardiyanlarının tasfiyesi, gece yarısı kaçışı ve Arava ovasında yapılan kurultay.",
      outcome: "KS takviminin başlangıcı, Stallhart hanedanının resmî tahta çıkışı.",
      impact: "Kıtanın siyasi haritasını tamamen değiştiren bin yıllık imparatorluğun ilk nüvesi.",
      quote: "Zincirlerini kıran bir kurt, bir daha asla kafese sığmaz."
    },
    tags: ["kurulus", "donum-noktasi", "craes"]
  },
  {
    id: "ev-kutsal-kan-doktrini",
    ks: "1144",
    type: "decree",
    category: "decree",
    name: { tr: "Kutsal Kan Doktrini İlanı", en: "Proclamation of the Holy Blood Doctrine" },
    ruler: "I. Craes Stallhart",
    location: "Arava Baş Tapınağı",
    belligerents: ["Stallhart Hanedanı", "Mabed Rahipleri & Boy Beyleri"],
    desc: {
      tr: "Craes, Aleron dönüşünde Era'nın nurunun ve kutsal kılıcın yalnızca kendi soyuna bahşedildiğini ilan etti. Hanedanın ilahi meşruiyetini kuran temel anayasal belgedir.",
      en: "Craes proclaimed that the divine essence of Era belongs exclusively to his lineage, establishing dynastic sacral legitimacy."
    },
    details: {
      causes: "Boy beylerinin taht iddialarını kökten engellemek ve merkezi itaati dini bağla mühürlemek.",
      course: "Güneş tutulması ayininde kılıcını kurban sunağına vurarak fermanı okudu.",
      outcome: "Stallhart kanı kutsal kabul edildi; hanedan dışı taht talepleri dinen en büyük günah sayıldı.",
      impact: "Yüzyıllar boyunca her taht kavgasında, meşruiyet krizinde başvurulan mutlak hukuki dayanak oldu.",
      quote: "Kutsallık miktarda değil, kaynaktadır. Tanrıların seçtiği kan bölünemez."
    },
    tags: ["ferman", "doktrin", "din"]
  },
  {
    id: "ev-ikinci-nyrdal-savasi",
    ks: "1146-1148",
    type: "war",
    category: "war",
    name: { tr: "İkinci Nýrdal Savaşı ve Aleron Zaferi", en: "Second Nýrdal War & Aleron Victory" },
    ruler: "I. Craes Stallhart",
    location: "Aleron Ovası & Nýrdal",
    belligerents: ["Stallhart Ordusu (~18.000)", "Nýrdal Krallığı (~16.000)"],
    desc: {
      tr: "Darova'nın intikamı için yürüyen Craes, vur-kaç taktikleriyle Nýrdal ikmal hatlarını kesti. Aleron Ovası'ndaki meydan savaşında Nýrdal Kralı bizzat öldürüldü ve krallık ilhak edildi.",
      en: "Craes avenged Darova by destroying the Nýrdal army at Aleron Plain, slaying their king and annexing the kingdom."
    },
    details: {
      causes: "Darova yenilgisinin rövanşı ve kuzeybatı sınır güvenliğinin sağlanması.",
      course: "İki yıl süren yıpratma seferi, süvari tuzakları ve Aleron meydanındaki kesin süvari yarması.",
      outcome: "Nýrdal krallığı haritadan silindi; Craes ayağından aldığı yara sebebiyle ömür boyu aksak kaldı.",
      impact: "Stallhart'ın kıtasal bir süper güce dönüşmesini sağlayan ilk büyük krallık ilhakı.",
      quote: "Kılıç kanla yıkandı, zindanlarımızın taşları düşmanın mezar taşı oldu."
    },
    tags: ["askeri", "intikam", "zafer"]
  },
  {
    id: "ev-eretay-savunmasi",
    ks: "1157-1160",
    type: "war",
    category: "war",
    name: { tr: "Eretay Savunması ve Doğu Sınırı Savaşı", en: "Defense of Eretay & Eastern Border War" },
    ruler: "I. Craes Stallhart",
    location: "Doğu Sınır Kaleleri",
    belligerents: ["Stallhart Ordusu (~15.000)", "Eretay Krallığı (~20.000)"],
    desc: {
      tr: "Craes'in yaşlandığı dedikoduları üzerine doğudan saldıran Eretay Krallığı püskürtüldü. Yaşlı kurucunun son büyük askerî zaferidir.",
      en: "Eretay Kingdom invaded testing the aging Craes, but was decisively repulsed in his final campaign."
    },
    details: {
      causes: "Eretay'ın genç imparatorluğu zayıf anında vurma hevesi.",
      course: "Siper savunması ve sınır kalelerinin stratejik tahkimatı.",
      outcome: "Eretay orduları ezildi, doğu sınırı garantiye alındı.",
      impact: "I. Nadima'nın tahta çıkışında doğu sınırının güvende kalmasını sağladı.",
      quote: "Kurt yaşlansa da dişleri hâlâ demiri kırar."
    },
    tags: ["askeri", "savunma"]
  },
  {
    id: "ev-nadima-imparatorluk-ilani",
    ks: "1160",
    type: "milestone",
    category: "milestone",
    name: { tr: "I. Nadima'nın Cülûsu ve İmparatorluğun İlanı", en: "Accession of Empress Nadima I & Imperial Proclamation" },
    ruler: "I. Nadima Stallhart ('Anne')",
    location: "Arava Taç Salonu",
    belligerents: ["Stallhart Hanedanı"],
    desc: {
      tr: "Craes'in kızı Nadima tahta çıktı. Eretay fethinin ardından krallık statüsü resmen İmparatorluğa dönüştürüldü; ilk İmparatoriçe olarak 'Anne' unvanını aldı.",
      en: "Craes's daughter Nadima took the throne, transitioning the realm into an Empire and earning the revered title 'Mother'."
    },
    details: {
      causes: "Devletin çok kavimli, geniş coğrafyalı yapısının krallık unvanını aşması.",
      course: "Taç giyme töreni, Denge Konseyi mabetlerinin kutsaması.",
      outcome: "Stallhart resmen 'İmparatorluk' (Anxes İmparatorluğu) unvanını aldı.",
      impact: "Merkezi idarenin, dinî teşkilatın ve eyalet sisteminin kurumsallaşması.",
      quote: "Kılıç toprak alır, merhamet ve inanç ise o toprağı yurt kılar."
    },
    tags: ["donum-noktasi", "imparatorluk", "nadima"]
  },
  {
    id: "ev-denge-konseyi-reformu",
    ks: "1165-1175",
    type: "decree",
    category: "decree",
    name: { tr: "Denge Konseyi İnancının Standartlaşması & Mabed Reformu", en: "Standardization of the Council of the Even & Mabed Reform" },
    ruler: "I. Nadima Stallhart",
    location: "Mabed Eyaleti / Arava",
    belligerents: ["Saray ve Rahipler Heyeti"],
    desc: {
      tr: "15 tanrılı Denge Panteonu teolojik olarak standartlaştırıldı; 6 Ezgi kutsal metin olarak kabul edildi ve Mabed Eyaleti doğrudan tahta bağlı dini merkez yapıldı.",
      en: "The fifteen-deity Pantheon of the Even was canonicalized, the Six Songs codified, and the Mabed Province established."
    },
    details: {
      causes: "Bölgesel pagan inançların devlette ayrışma yaratmasını önlemek.",
      course: "Rahipler Kurultayı toplandı, teolojik fraksiyonlar (Düzen, Kaos, Muhafız) resmî sisteme bağlandı.",
      outcome: "Dini hiyerarşi devlete entegre edildi, büyü kullanımı ilahi yasalarla resmen yasaklandı.",
      impact: "Kıtasal çapta ortak dinî bilinç oluştu.",
      quote: "Düzen ile Kaos arasındaki mil, Muhafız'ın sarsılmaz kalkanıdır."
    },
    tags: ["din", "reform", "mabed"]
  },
  {
    id: "ev-veraset-fermani",
    ks: "1197",
    type: "decree",
    category: "decree",
    name: { tr: "Garnor'un Veraset Fermanı", en: "Garnor's Decree of Succession" },
    ruler: "I. Garnor Stallhart ('Demir Vezir')",
    location: "Arava Yüce Meclisi",
    belligerents: ["Kurultay ve Hanedan Üyeleri"],
    desc: {
      tr: "Tahta geçecek veliahtların sadece kan bağına değil, eyalet valiliği ve askeri komuta tecrübesine sahip olması şart koşuldu. Veraset krizlerini önleyen en önemli yasalardan biridir.",
      en: "Mandated that imperial heirs must prove governance and military command in provinces before ascending the throne."
    },
    details: {
      causes: "Saray odalarında yetişen tecrübesiz şehzadelerin devleti çökertmesini önlemek.",
      course: "Demir Vezir Garnor Kurultay masasına kılıcını koyarak fermanı mühürletti.",
      outcome: "Şad ve Melik valilik kurumları kurumsallaştı; veliahtlar sınır eyaletlerine gönderilmeye başlandı.",
      impact: "Zeandor ve Amadon dahil tüm gelecekteki liderlerin eyalet tecrübesi kazanmasının hukuki zeminini oluşturdu.",
      quote: "Kılıç tutmayı bilmeyen el, tahtın asasını taşıyamaz."
    },
    tags: ["ferman", "veraset", "hukuk"]
  },
  {
    id: "ev-gom-ara-vlaupson-fetihleri",
    ks: "1215-1228",
    type: "war",
    category: "war",
    name: { tr: "Gom Ara İlhakı ve Vlaupson Fethi", en: "Annexation of Gom Ara & Conquest of Vlaupson" },
    ruler: "I. Lun Aldris ('Reformcu')",
    location: "Güneydoğu Ticaret Havzası",
    belligerents: ["İmparatorluk Ordusu (~22.000)", "Şehirler Birliği Koalisyonu (~18.000)"],
    desc: {
      tr: "I. Lun Aldris'in güneye iniş harekâtı. Zengin ticaret kentleri Vlaupson ve Gom Ara imparatorluk sınırlarına katılarak güney ticaret yolları denetim altına alındı.",
      en: "Lun Aldris I expanded south, capturing the wealthy merchant cities of Vlaupson and Gom Ara."
    },
    details: {
      causes: "İmparatorluğun deniz ticaretine açılma ihtiyacı ve güney ticaret yollarının ele geçirilmesi.",
      course: "Kuşatma makineleriyle Vlaupson surları düşürüldü, Gom Ara direnmeden teslim oldu.",
      outcome: "Güney eyaletlerinin zengin vergi gelirleri hazineye aktarıldı.",
      impact: "Stallhart donanmasının inşası için gereken finansal kaynak sağlandı.",
      quote: "Mürekkep kâğıdı doldurur, ticaret ise imparatorluğun ambarlarını."
    },
    tags: ["askeri", "fetih", "ticaret"]
  },
  {
    id: "ev-khasinya-deniz-zaferi",
    ks: "1235",
    type: "war",
    category: "war",
    name: { tr: "Safir Boğazı Deniz Zaferi (Khasinya)", en: "Naval Victory of Sapphire Strait (Khasinya)" },
    ruler: "I. Lun Aldris",
    location: "Khasinya Açıkları / Safir Boğazı",
    belligerents: ["İmparatorluk Kalyon Filosu (65 Gemi)", "Ada Korsanları & Bağımsız Kalyonlar (80 Gemi)"],
    desc: {
      tr: "İmparatorluk Donanması'nın tarihteki ilk büyük deniz savaşı zaferidir. Safir Boğazı korsanlardan temizlendi ve stratejik Khasinya adası imparatorluğa bağlandı.",
      en: "The first major naval victory of the Imperial Fleet, purging the Sapphire Strait and securing Khasinya island."
    },
    details: {
      causes: "Korsanların güney deniz ticaretini felç etmesi.",
      course: "Rüzgâr üstünlüğü kullanılarak düşman filosu kayalıklara sıkıştırıldı ve mahmuzlandı.",
      outcome: "Khasinya Valiliği kuruldu, Safir Boğazı gümrük denetimine girdi.",
      impact: "Stallhart bir kara imparatorluğundan deniz gücüne dönüştü.",
      quote: "Dalgalar boyun eğmez sananlar, yanan gemilerinin dumanında boğuldular."
    },
    tags: ["askeri", "deniz", "zafer"]
  },
  {
    id: "ev-scifella-fetihleri-seltanya",
    ks: "1248-1249",
    type: "war",
    category: "war",
    name: { tr: "Büyük Savaş: Seltanya'nın Fethi", en: "The Great War: Conquest of Seltanya" },
    ruler: "I. Scifella Stallhart ('Fatih')",
    location: "Seltanya Ormanları & Kıyı Ovaları",
    belligerents: ["Scifella'nın Disiplinli Lejyonları (~30.000)", "Seltan Krallığı Müttefikleri (~25.000)"],
    desc: {
      tr: "Onneva Valisi iken başkente yürüyüp tahtı alan Fatih Scifella, hırçın denizlerin ve uçsuz bucaksız ormanların yurdu Seltanya'yı iki yıllık kanlı seferle imparatorluğa kattı.",
      en: "Empress Scifella the Conqueror subjugated fierce Seltanya after a grueling two-year woodland campaign."
    },
    details: {
      causes: "Seltanya'nın bağımsız donanma gücü ve imparatorluk batı sınırındaki tehditler.",
      course: "Orman geçitlerinde çetin pusu muharebeleri, Seltan kalelerinin tek tek düşürülmesi.",
      outcome: "Seltanya eyalet yapıldı; ancak halk kendi dilini ve inancını koruyarak daima gizli bir isyan damarı barındırdı.",
      impact: "Seltanya tersaneleri imparatorluk donanmasının ana omurgası oldu.",
      quote: "Topraklarını aldık lakin ruhları hâlâ o meşe dallarında rüzgârla fısıldaşıyor."
    },
    tags: ["askeri", "fetih", "scifella"]
  },
  {
    id: "ev-selya-deniz-seferi-solgar-ilhaki",
    ks: "1253-1258",
    type: "treaty",
    category: "treaty",
    name: { tr: "Selya Seferi ve Solgar Evlilik Paktı", en: "Selya Expedition & Solgar Dynastic Pact" },
    ruler: "I. Scifella Stallhart",
    location: "Selya Sahili & Solgar Şatosu",
    belligerents: ["Stallhart İmparatorluğu", "Solgar Hanesi", "Selya Beyleri"],
    desc: {
      tr: "Scifella, güneyin zengin liman eyaleti Selya'yı dize getirdi; Solgar Hanesi'nin lorduyla evlenerek Solgar eyaletini tek damla kan dökmeden evlilik yoluyla imparatorluğa bağladı.",
      en: "Scifella subordinated Selya's ports and diplomatically annexed Solgar through dynastic marriage."
    },
    details: {
      causes: "Kıtanın en zengin tarım ve maden havzası Solgar ile deniz kapısı Selya'nın kontrolü.",
      course: "Donanma Selya kıyılarını abluka altına aldı, Solgar ile evlilik akdi imzalandı.",
      outcome: "Solgar ve Selya eyaletleri kuruldu, Pilkard adası ilhak edildi.",
      impact: "Solgar Hanesi sarayda kalıcı ve güçlü bir bürokratik kök saldı.",
      quote: "Bazen bir nikâh yüzüğü, bin kılıçtan daha geniş toprak fetheder."
    },
    tags: ["antlasma", "evlilik", "diplomasi"]
  },
  {
    id: "ev-buyuk-kutuphane-craes-suikasti",
    ks: "1263-1275",
    type: "tragedy",
    category: "tragedy",
    name: { tr: "Büyük Kütüphane Suikastı & İlk Stallhart Kanı", en: "Great Library Assassination & The First Stallhart Blood" },
    ruler: "II. Craes Stallhart ('Âlim')",
    location: "Arava Büyük Kütüphanesi",
    belligerents: ["Gaspçı Mazurekt Grubu", "II. Craes Muhafızları"],
    desc: {
      tr: "Barış ve ilim aşığı II. Craes, kendi yaptırdığı Büyük Kütüphane'de kuzeni Mazurekt tarafından hançerlenerek öldürüldü. Bir Stallhart'ın kanının kendi sarayında akıtıldığı ilk kara gündür.",
      en: "Scholar-Emperor Craes II was assassinated inside his own Grand Library by his cousin Mazurekt, marking the first time Stallhart royal blood was spilled."
    },
    details: {
      causes: "Mazurekt'in Craes'in Solgar kanı taşıdığı gerekçesiyle meşruiyetini sorgulaması ve taht hırsı.",
      course: "Gece vakti kütüphaneye sızan suikastçılar imparatoru parşömenlerin üzerinde bıçakladı.",
      outcome: "Mazurekt tahtı gasp etti; imparatorluk iç savaşın eşiğine geldi.",
      impact: "Kutsal Kan Doktrini'nin sorgulanmasına ve hanedan içi kan davalarının başlamasına yol açtı.",
      quote: "Mürekkep kurudu, kitapların sayfalarına ilk kez bir imparatorun sıcak kanı damladı."
    },
    tags: ["suikast", "trajedi", "ic-savas"]
  },
  {
    id: "ev-kizilcay-muharebesi-mazurekt",
    ks: "1275",
    type: "war",
    category: "war",
    name: { tr: "Kızılçay Muharebesi & Gaspçı'nın Sonu", en: "Battle of Redriver & Fall of the Usurper" },
    ruler: "I. Atrion Stallhart ('Kurtarıcı')",
    location: "Kızılçay Vadisi & Arava",
    belligerents: ["Atrion ve Sadık Eyaletler (~20.000)", "Mazurekt'in Gaspçı Güçleri (~14.000)"],
    desc: {
      tr: "II. Craes'in oğlu Atrion, Galetsha ordularının saf değiştirmesiyle Kızılçay'da Mazurekt'in kuvvetlerini bozguna uğrattı. Mazurekt kaçarken yakalandı ve kan dökülmeden ipekle boğuldu.",
      en: "Atrion routed the usurper Mazurekt at Redriver after Galetsha switched sides. Mazurekt was captured and strangled without spilling blood."
    },
    details: {
      causes: "Mazurekt'in gayrimeşru tiranlığının sonlandırılması.",
      course: "Kızılçay geçidinde şiddetli çarpışma; Galetsha süvarilerinin Mazurekt'in arkasına sarkması.",
      outcome: "Mazurekt öldürüldü, Atrion tahta çıktı.",
      impact: "Atrion'un intikam yerine af getirmesiyle iç savaş büyümeden önlendi.",
      quote: "Hainin kanı kılıca değdirilmedi; zira o kan dahi kılıcı lekeleyecek kadar pisti."
    },
    tags: ["askeri", "isyan", "zafer"]
  },
  {
    id: "ev-surgun-fermani-altin-kafes",
    ks: "1276",
    type: "decree",
    category: "decree",
    name: { tr: "Sürgün Fermanı & Altın Kafes Metodu", en: "Decree of Exile & The Gilded Cage Method" },
    ruler: "I. Atrion Stallhart ('Kurtarıcı')",
    location: "Arava Sarayı",
    belligerents: ["Stallhart Hanedanı & İsyancı Soylular"],
    desc: {
      tr: "Atrion, tahtı gasp edenlerin ailelerini kılıçtan geçirmek yerine affetti. Tehlikeli hanedan üyelerini uzak eyaletlerde lüks içinde gözetim altında tutan 'Altın Kafes' metodunu başlattı.",
      en: "Emperor Atrion replaced bloody purges with the 'Gilded Cage' method, exiling rival kin to comfortable surveillance."
    },
    details: {
      causes: "İç savaşın ardından intikam döngüsünü kırma arzusu.",
      course: "Fermanla isyancıların mallarına el konuldu fakat canları bağışlanarak eyaletlere sürüldü.",
      outcome: "Hanedan içi katliamlar durduruldu, devlet barışı korundu.",
      impact: "Sonraki yüzyıllarda Zeandor ve Amadon dahil veliahtların sürgün geleneğinin temelini attı.",
      quote: "Kanı akıtmak kolaydır; zor olan, o kanın bir daha akmayacağı bir dünya kurmaktır."
    },
    tags: ["ferman", "reform", "hukuk"]
  },
  {
    id: "ev-kutsal-kan-kirilmasi-domkha",
    ks: "1282-1285",
    type: "crisis",
    category: "crisis",
    name: { tr: "Kutsal Kan Kırılması & Rahipler Tasfiyesi", en: "Breach of Sacred Blood & Purge of the Clergy" },
    ruler: "Domkha Remal Stallhart ('Deniz Lordu')",
    location: "Arava & Mabed",
    belligerents: ["İmparatorluk Donanması & Saray", "Mabed Yüksek Rahipleri"],
    desc: {
      tr: "Domkha Remal, soylu olmayan bir cariyeye aşık olup evlendi ve oğullarını veliaht ilan etti. Buna karşı çıkan dinî otoriteleri ve başrahipleri topluca idam ettirdi.",
      en: "Domkha Remal defied the Sacred Blood laws by wedding a common concubine and executing resisting high priests."
    },
    details: {
      causes: "Aşk uğruna yüzyıllık kast ve kutsal kan kurallarının çiğnenmesi.",
      course: "Rahiplerin isyan çağrısı üzerine donanma muhafızları tapınaklara girdi ve muhalifleri tasfiye etti.",
      outcome: "Tahtın din üzerindeki mutlak otoritesi perçinlendi, cariye çocukları meşru sayıldı.",
      impact: "I. Merethorn'un tahta çıkmasını sağladı; ancak hanedanda kan saflığı tartışmalarını alevlendirdi.",
      quote: "Aşk bir tiranın yüreğine düştüğünde, tapınakların sütunları bile tir tir titrer."
    },
    tags: ["kriz", "din", "tasfiye"]
  },
  {
    id: "ev-isonwell-antlasmasi-orebas",
    ks: "1306",
    type: "treaty",
    category: "treaty",
    name: { tr: "Isonwell Antlaşması (Örebas Zaferi)", en: "Treaty of Isonwell (Victory over Örebas)" },
    ruler: "I. Merethorn Stallhart ('Zalim')",
    location: "Isonwell Sahili",
    belligerents: ["Stallhart Donanması & Ordusu", "Örebas Krallığı"],
    desc: {
      tr: "Merethorn, zengin Örebas Krallığı'nı denizden ve karadan kuşatarak dize getirdi. Örebas'a ağır gümüş tazminatı ve ticaret kısıtlamaları getiren Isonwell Antlaşması imzalandı.",
      en: "Merethorn subdued wealthy Örebas by land and sea, forcing the humiliating Treaty of Isonwell with heavy silver indemnities."
    },
    details: {
      causes: "Örebas'ın maden ve gümüş tekeline darbe vurma arzusu.",
      course: "Kuzey kalyonlarının Örebas limanlarını yakması ve kara birliklerinin sınıra dayanması.",
      outcome: "Örebas yıllık 50.000 Akçelik gümüş tazminatı ödemeyi ve Stallhart ticaretine imtiyaz tanımayı kabul etti.",
      impact: "İmparatorluk hazinesinin zirveye ulaştığı altın çağın kapısını araladı.",
      quote: "Örebas'ın kasaları açıldı, gümüşleri imparatorluğun mermer sütunlarını kapladı."
    },
    tags: ["antlasma", "zafer", "orebas"]
  },
  {
    id: "ev-duzmece-craes-buyuk-yangin",
    ks: "1307-1309",
    type: "rebellion",
    category: "rebellion",
    name: { tr: "Düzmece Craes Ayaklanması & Büyük Arşiv Yangını", en: "False Craes Rebellion & Burning of the Royal Archives" },
    ruler: "I. Merethorn Stallhart",
    location: "Arava Şehri & Kraliyet Arşivi",
    belligerents: ["Düzmece Craes İsyancıları (~40.000)", "İmparatorluk Lejyonları (~25.000)"],
    desc: {
      tr: "Kurucu Craes olduğunu iddia eden bir sahtekârın peşine takılan halk başkenti yaktı. Kraliyet Arşivhanesi ve Büyük Kütüphane kül oldu; Merethorn isyanı kan gölünde bastırdı.",
      en: "A pretender claiming to be Craes ignited a massive rebellion. The Royal Archives burned to ashes before Merethorn crushed the revolt."
    },
    details: {
      causes: "Merethorn'un ağır vergileri ve baskıcı yönetimi karşısında halkın çaresizliği.",
      course: "Üç yıl süren sokak çatışmaları; yangın Arava'nın üçte birini ve kurucu tarihi evrakları yok etti.",
      outcome: "İsyancılar çarmıha gerildi, Düzmece Craes idam edildi; ancak kadim tarih kalıcı olarak silindi.",
      impact: "İmparatorluğun erken dönem arşivlerinin kaybolmasına ve sonraki kuşakların tarihsiz kalmasına sebep oldu.",
      quote: "Ateş sadece kâğıtları değil, hafızamızı da yaktı. Küllerin üstüne yeni yalanlar yazıldı."
    },
    tags: ["isyan", "yangin", "trajedi"]
  },
  {
    id: "ev-prens-zilas-idam",
    ks: "1322",
    type: "tragedy",
    category: "tragedy",
    name: { tr: "Prens Zilas'ın Boğdurulması", en: "Strangling of Prince Zilas" },
    ruler: "I. Merethorn Stallhart",
    location: "Arava Zindanı",
    belligerents: ["I. Merethorn", "Prens Zilas"],
    desc: {
      tr: "Merethorn, kendisini zehirlemeyi planladığı gerekçesiyle öz oğlu Prens Zilas'ı saray zindanında bizzat elleriyle boğdurdu. Zulmünün en korkunç zirvesi olarak tarihe geçti.",
      en: "Merethorn executed his own son Prince Zilas in the dungeons on suspicion of treason, marking the peak of his cruelty."
    },
    details: {
      causes: "Taht paranoyası ve saray içi kumpas şüpheleri.",
      course: "Zilas duruşmasız hapsedildi ve babasının emriyle gece yarısı boğuldu.",
      outcome: "Tahtın tek vârisi olarak küçük oğlu Reanloth kaldı.",
      impact: "Reanloth'un babasından nefret etmesine ve içine kapanık bir hükümdara dönüşmesine yol açtı.",
      quote: "Bir baba evladını boğduğunda, tahtın basamakları bir daha asla kurumaz."
    },
    tags: ["trajedi", "idam", "merethorn"]
  },
  {
    id: "ev-megina-vadisi-felaketi",
    ks: "1347",
    type: "crisis",
    category: "crisis",
    name: { tr: "Megina Vadisi Felaketi & Sağır İmparator", en: "Disaster of Megina Valley & The Deaf Emperor" },
    ruler: "Reanloth Stallhart ('Sağır')",
    location: "Megina Vadisi / Melerya Sınırı",
    belligerents: ["Stallhart Ordusu", "Melerya Simyacıları ve Birlikleri"],
    desc: {
      tr: "Melerya ordusunun pusu kurduğu Megina Vadisi'nde düşman simyacılarının doğaüstü patlayıcıları patlatıldı. Reanloth patlamanın etkisiyle işitme yetisini tamamen kaybetti.",
      en: "An alchemical explosion triggered by Meleryan forces in Megina Valley permanently deafened Emperor Reanloth."
    },
    details: {
      causes: "Melerya'nın sınır anlaşmazlığını fırsat bilerek yasak simyevi silahlar kullanması.",
      course: "Kaya bloklarının havaya uçurulmasıyla vadi cehenneme döndü; binlerce asker moloz altında kaldı.",
      outcome: "Reanloth yaralı kurtuldu fakat tamamen sağır oldu.",
      impact: "Reanloth'un sağırlığını gizlemek için yasak büyücülerle gizli işaret ve algı dili geliştirmesine yol açtı.",
      quote: "Sesler sustu lakin zihnimdeki kılıçların şakırtısı eskisinden daha gür çıkmaya başladı."
    },
    tags: ["kriz", "patlama", "reanloth"]
  },
  {
    id: "ev-kizilkopru-muharebesi-arathen",
    ks: "1356",
    type: "war",
    category: "war",
    name: { tr: "Kızılköprü Muharebesi (Arathen Bozgunu)", en: "Battle of Redbridge (Rout of Arathen)" },
    ruler: "Reanloth Stallhart",
    location: "Kızılköprü / Doğu Sınırı",
    belligerents: ["Stallhart Doğu Lejyonları (~28.000)", "Arathen Krallığı Ordusu (~32.000)"],
    desc: {
      tr: "Sağırlığını bir zaaf sanan Arathen'e karşı Reanloth'un uyguladığı kusursuz pusu savaşıdır. Arathen ordusu köprü başında imha edildi; doğu sınırı elli yıl boyunca sükûnete kavuştu.",
      en: "Reanloth decisively defeated the Arathen army at Redbridge through a brilliant ambush, securing the eastern frontier for fifty years."
    },
    details: {
      causes: "Arathen'in Reanloth'un sağırlığını ve zayıflığını fırsat bilerek başlattığı doğu istilası.",
      course: "Köprü girişinin sahte ricatla bırakılması ve nehir boyunca gizlenen okçuların çapraz ateşi.",
      outcome: "Arathen ordusu dağıtıldı, barış antlaşması imzalandı.",
      impact: "Reanloth'un askeri dehasını kanıtladı, Büyük Kütüphane'nin yeniden inşası için barış ortamı sağladı.",
      quote: "Gözlerim seslerden daha fazlasını görüyor; düşmanın nerede tökezleyeceğini toprağın titreyişinden anlarım."
    },
    tags: ["askeri", "zafer", "arathen"]
  },
  {
    id: "ev-burria-seferi-ve-yeter-fermani",
    ks: "1373-1374",
    type: "treaty",
    category: "decree",
    name: { tr: "Burria Seferi & 'Yeter' Fermanı", en: "Burria Campaign & The 'Enough' Decree" },
    ruler: "II. Lun Aldris ('Şair')",
    location: "Güneydoğu Burria / Arava",
    belligerents: ["Stallhart İmparatorluk Ordusu (~35.000)", "Burria İkili Taht Paktı (~25.000)"],
    desc: {
      tr: "II. Lun Aldris Burria'yı fethederek imparatorluğu tarihteki en geniş sınırlarına ulaştırdı. Ancak fetih çılgınlığının devleti çürüteceğini görerek tarihe geçen 'Yeter' Fermanı'nı ilan etti.",
      en: "Lun Aldris II annexed Burria, bringing the empire to its territorial zenith, then issued the historic 'Enough' Decree halting all further conquests."
    },
    details: {
      causes: "İmparatorluğun güneydoğu sınırını nihai doğal sınırlara ulaştırma arzusu.",
      course: "Hızlı bir seferle Burria paktı teslim alındı.",
      outcome: "Burria ilk kez imparatorluğa katıldı. Hemen ardından yayımlanan fermanla fetihler resmen durduruldu.",
      impact: "Stallhart'ın altın çağı felsefe, sanat ve edebiyatla taçlandı; lakin askeri rehavetin de tohumları atıldı.",
      quote: "Sınırlar göğe ulaşsa ne çıkar, ruhumuz çorak kaldıktan sonra? Yeter. Artık kılıçlar kınına girsin."
    },
    tags: ["ferman", "fetih", "sinir"]
  },
  {
    id: "ev-hibas-katliami-gulon-isyani",
    ks: "1388",
    type: "rebellion",
    category: "rebellion",
    name: { tr: "Flosenkha Seferi, Gulon İsyanı & Hibas Katliamı", en: "Flosenkha Campaign, Gulon's Revolt & Hibas Massacre" },
    ruler: "I. Jega Cal Stallhart ('Talihsiz')",
    location: "Hibas Geçidi & Onneva Sınırı",
    belligerents: ["I. Jega Cal'ın Sadık Birlikleri (~15.000)", "Onneva Valisi Gulon'un İsyancıları (~20.000)"],
    desc: {
      tr: "Kendi fetih efsanesini yazmak isteyen Jega Cal, sefer sırasında kardeşi Onneva Valisi Gulon'un 'İsyan Selamı' ile arkadan vuruldu. Hibas Katliamı'nda imparator katledildi.",
      en: "During campaign, Jega Cal was betrayed by his brother Governor Gulon in the bloody Hibas Massacre, throwing the realm into civil war."
    },
    details: {
      causes: "Gulon'un taht kıskançlığı ve Jega Cal'ın ordusunu korumasız bırakması.",
      course: "Geçitte pusuya düşürülen imparatorluk birlikleri kılıçtan geçirildi; Jega Cal savaş meydanında can verdi.",
      outcome: "İmparator öldü, Gulon başkente yürüdü; Kırık Taç Çağı'nın en kanlı iç savaşı başladı.",
      impact: "II. Nadima ve General Ekdor'un isyanı bastırmasına kadar sürecek 10 yıllık istikrarsızlık dönemi doğdu.",
      quote: "Kardeşin kardeşe çektiği pusat, hanedanın göğsüne saplanan paslı bir hançerdir."
    },
    tags: ["isyan", "katliam", "ihanet"]
  },
  {
    id: "ev-sulanan-kan-fermani",
    ks: "1406",
    type: "decree",
    category: "decree",
    name: { tr: "Sulanan Kan Fermanı & Meşruiyet Paktı", en: "Decree of the Diluted Blood & Legitimacy Pact" },
    ruler: "II. Remal Stallhart ('Sulanan Kan')",
    location: "Arava Baş Meclisi",
    belligerents: ["Stallhart Hanedanı", "Kurultay Soyluları"],
    desc: {
      tr: "Piç Kurt Lunrye'nin oğlu II. Remal, sorgulanan kan bağını kılıçla değil bu tarihi fermanla korudu: 'Bir nehir denize karışsa da kaynağını unutmaz. Stallhart'ın en cılız damlası, yabancı bir tacın en saf ırmağından daha kutsaldır.'",
      en: "Remal II proclaimed the 'Diluted Blood' doctrine, establishing that even the faintest Stallhart blood remains sacred and indivisible."
    },
    details: {
      causes: "Lunrye'nin soylu olmayan kökeni sebebiyle Kurultay'ın yeni imparatora itaatsizlik hazırlığı.",
      course: "Mabed kürsülerinden ferman okundu; Onneva ve Memanth valilerinin kızları saraya rehin davet edildi.",
      outcome: "İsyanlar kansız bastırıldı; gelecekteki yarım-kanlı varisler için kalıcı bir meşruiyet kalkanı yaratıldı.",
      impact: "KS 1411'de Remal kutsal şaraptan şüpheli biçimde öldü; taht seçilmiş lider Rones Alvro'ya geçti.",
      quote: "Kutsallık miktarda değil, kaynaktadır. Stallhart'ın tek damlası dahi tacı taşımaya kâfidir."
    },
    tags: ["ferman", "mesruiyet", "remal"]
  },
  {
    id: "ev-hesap-fermani-burrianin-geri-alinisi",
    ks: "1412-1419",
    type: "war",
    category: "war",
    name: { tr: "Hesap Fermanı & Burria'nın Geri Alınışı (İkiz Tepe)", en: "Accounting Decree & Reconquest of Burria (Twin Peaks)" },
    ruler: "Rones 'Demiryumruk' Alvro Stallhart",
    location: "Arava & Güneydoğu Burria",
    belligerents: ["Rones'un Lejyonu (35.000)", "Burria İkili Taht Paktı Ordusu (~22.000)"],
    desc: {
      tr: "Demiryumruk Rones önce 30 yıllık vergi teftişiyle yolsuz valileri sürgün etti. Ardından 35.000 kişilik orduyla İkiz Tepe Muharebesi'ni tekrarlayarak Burria'yı geri aldı. Bu, imparatorluğun tarihteki son coğrafi genişlemesidir.",
      en: "Rones Ironfist purged corrupt governors via the Accounting Decree, then retook Burria with 35,000 legionaries in the empire's final territorial expansion."
    },
    details: {
      causes: "Burria'nın Kırık Taç Çağı karmaşasında vergiyi kesip bağımsızlaşması.",
      course: "İkiz Tepe mevkiinde pakt liderleri birbirine düşürüldü; sadık bir Melik atanarak toprak geri alındı.",
      outcome: "Burria eyalet yapıldı; doğu sınırında Arathen'e karşı 3 seferle 10 yıllık buzlu barış dayatıldı.",
      impact: "Rones'un ölümüyle (KS 1441) halk sokaklarda 3 gün yas tuttu; son sevilen fatih imparatordur.",
      quote: "Topraklarımızı geri getiren yumruk, adaletin terazisini de doğrulttu."
    },
    tags: ["askeri", "fetih", "rones"]
  },
  {
    id: "ev-kridas-stallhart-sukun-pakti",
    ks: "1441-1447",
    type: "treaty",
    category: "treaty",
    name: { tr: "Kridas-Stallhart Sükûn Paktı & Burria'nın Kalıcı Kaybı", en: "Kridas-Stallhart Peace Pact & Permanent Loss of Burria" },
    ruler: "Elron Stallhart ('Sulhsever')",
    location: "Doğu Sınırı & Burria",
    belligerents: ["Stallhart İmparatorluğu", "Arathen Krallığı", "Burria Paktı"],
    desc: {
      tr: "Elron, Arathen ile resmi barış paktı ve Örebas ticaret antlaşması imzalayarak 10 yıl hiç sefere çıkmadı. Ancak bu pasiflik sonucu Burria 'sessiz kopuş' ile kalıcı olarak bağımsızlaştı ve kaybedildi.",
      en: "Elron signed a 10-year peace with Arathen but his reluctance to use force resulted in the permanent loss of Burria."
    },
    details: {
      causes: "Elron'un savaştan kaçınma ve ticaret diplomasisi doktrini.",
      course: "Hesap Fermanı terk edildi; Burria bağımsızlık ilan edince sefer yerine sonuçsuz elçi heyeti yollandı.",
      outcome: "Burria bir daha asla geri alınamayacak şekilde koptu; Imloth ile Amadon arasındaki miras çatlağının tohumu atıldı.",
      impact: "Imloth'un 'Tembel' yönetiminin ve Amadon'un sert tepki kişiliğinin psikolojik temelini oluşturdu.",
      quote: "Imloth bana tahtı miras bırakacak, Amadon ise muhtemelen halkın kalbini. — İmparator Elron"
    },
    tags: ["antlasma", "kayip", "elron"]
  },
  {
    id: "ev-selmira-olumu-zeandor-dogumu",
    ks: "1458",
    type: "tragedy",
    category: "tragedy",
    name: { tr: "İmparatoriçe Selmira'nın Vefatı & Zeandor'un Doğumu", en: "Death of Empress Selmira & Birth of Prince Zeandor" },
    ruler: "İmparator Imloth Stallhart ('Tembel')",
    location: "Arava Taç Sarayı Doğum Odası",
    belligerents: ["Saray Hekimleri & Doğum Ekibi"],
    desc: {
      tr: "Halkın 'Anne Nadima' gibi sevdiği İmparatoriçe Selmira, veliaht Prens Zeandor'u dünyaya getirirken doğum sancıları içinde can verdi. Imloth'un vicdan azabı ve sarayın çöküşü bu kayıpla hızlandı.",
      en: "Beloved Empress Selmira died in childbirth while giving birth to Prince Zeandor, shattering Emperor Imloth and plunging the court into grief."
    },
    details: {
      causes: "Zorlu ve erken doğum; Imloth'un Amadon paranoyasıyla karısıyla ettiği son hırçın kavga.",
      course: "Ebe Eadan ve yardımcıları çocuğu kurtardı ancak Selmira aşırı kan kaybından yaşamını yitirdi.",
      outcome: "Prens Zeandor doğdu; 14 günlük kıtasal yas ilan edildi; Imloth şaraba ve yalnızlığa gömüldü.",
      impact: "Zeandor'un annesiz büyümesine ve 9 yaşında Selya'ya sürgün edilmesine giden sürecin başlangıcı.",
      quote: "Güneşin tacı düştü, gökyüzü öksüz kaldı! Merhametin pınarı Selmira sonsuzluğa göçtü."
    },
    tags: ["trajedi", "dogum", "zeandor"]
  },
  {
    id: "ev-almonth-idami-katip-hatasi",
    ks: "1466",
    type: "tragedy",
    category: "tragedy",
    name: { tr: "Çukurtepeli Almonth'un İdamı & Kâtip Hatası Faciası", en: "Execution of Almonth & The Clerical Error Tragedy" },
    ruler: "İmparator Imloth Stallhart",
    location: "Arava Batı Zindan Avlusu",
    belligerents: ["Zindan İdaresi", "Çukurtepeli Erthan"],
    desc: {
      tr: "İmparatorun bir hafta süre verdiği tek kollu savaş gazisi Almonth, zindan kâtibinin infaz defterindeki mürekkep kayması yüzünden kefalet belgesi varmadan saatler önce asıldı. Erthan'ın isyanının kıvılcımıdır.",
      en: "One-armed veteran Almonth was mistakenly hanged hours before his son arrived with the baron's bail due to a simple clerical ink slip."
    },
    details: {
      causes: "Zindan bürokrasisinin vurdumduymazlığı ve tarih karmaşası.",
      course: "Erthan kefalet mührüyle zindana girdiğinde babasının kimsesizler çukuruna atıldığını öğrendi ve memuru darp etti.",
      outcome: "Erthan tutuklandı, Edlas Arhan tarafından kefaleti ödenerek yaver alındı.",
      impact: "Erthan'ın devlete karşı intikam yemini etmesine ve ilerideki büyük köylü isyanının doğmasına sebep oldu.",
      quote: "Babamın hayatına bir mürekkep lekesi dediniz! Kendi yaktığınız ateşte kül olacaksınız!"
    },
    tags: ["trajedi", "erthan", "isyan"]
  },
  {
    id: "ev-buyuk-veba-salgini-tanrilarin-gozyaslari",
    ks: "1467-1469",
    type: "crisis",
    category: "crisis",
    name: { tr: "Büyük Veba Salgını & Güney Mahallesi Kireç Tecriti", en: "The Great Plague & Southern Ward Lime Quarantine" },
    ruler: "İmparator Amadon Stallhart ('Enkazın Hükümdarı')",
    location: "Arava Güney Mahallesi & Taşra Eyaletleri",
    belligerents: ["İmparatorluk Muhafızları", "Halk & Salgın Kurbanları"],
    desc: {
      tr: "'Tanrıların Gözyaşları' olarak anılan mor lekeli veba salgını kıtayı vurdu. Başvezir Edun Solgar'ın planıyla Güney Mahallesi kireç duvarlarıyla örülüp 40.000 insan içeride diri diri kilitlendi.",
      en: "A virulent plague struck Arava. Under Edun Solgar's ruthless plan, the Southern Ward was walled off with lime, sealing 40,000 citizens to stop contagion."
    },
    details: {
      causes: "Limanlardan sızan gizemli, asimetrik mor lekelere yol açan ölümcül salgın.",
      course: "Mabed ayinleri yetersiz kaldı; Amadon sarayı katranla mühürletti fakat oğlu Lunin kulede vebaya yakalanıp öldü.",
      outcome: "On binlerce ölüm, soylu hanelerin kırılması, Amadon'un akıl sağlığının paranoyaya teslim olması.",
      impact: "Halkın tahta olan inancını sarstı; Amadon'u acımasız ve içine kapanık bir tirana dönüştürdü.",
      quote: "Göğsü kurtarmak için kangren olmuş parmağı kesmek cerrahın görevidir. — Edun Solgar"
    },
    tags: ["salgin", "kriz", "veba"]
  },
  {
    id: "ev-zeandor-selya-surgunu",
    ks: "1472",
    type: "decree",
    category: "decree",
    name: { tr: "Zeandor'un Selya'ya Sürgünü & Meliklik Fermanı", en: "Zeandor's Exile to Selya & The Prince-Governor Decree" },
    ruler: "İmparator Amadon Stallhart",
    location: "Arava & Selya Eyaleti",
    belligerents: ["Amadon ve Edun Solgar", "Celios Selya & Zeandor"],
    desc: {
      tr: "Amadon, darbe korkusuyla 9 yaşındaki yeğeni Zeandor'u Celios Selya'nın himayesinde güneyin sarp eyaleti Selya'ya 'Melik Vali' unvanıyla sürgüne gönderdi. Amaç çocuğu gözden uzak tutmaktı.",
      en: "Fearing a coup, Amadon exiled 9-year-old Zeandor to Selya as Prince-Governor under Celios Selya's custody to neutralize his claim."
    },
    details: {
      causes: "Eski generallerin Zeandor etrafında toplanması ve Amadon'un taht kaygısı.",
      course: "Celios Selya başvezirlikten affını isteyip çocuğu korumak için Selya'ya götürdü.",
      outcome: "Zeandor sürgün topraklarında halkla kaynaşarak askeri ve stratejik deha kazandı.",
      impact: "Zeandor'un gelecekte 'Yarının Hükümdarı' olarak tahta dönmesini sağlayan karakter gelişiminin beşiği oldu.",
      quote: "Burası Selya küçük prens. Burada zayıf bağlar kopar, güçlü bağlar ise kale olur."
    },
    tags: ["surgun", "ferman", "zeandor"]
  },
  {
    id: "ev-karagol-cetesi-baskini",
    ks: "1476",
    type: "war",
    category: "war",
    name: { tr: "Karagöl Çetesi Operasyonu & Kara Hodrev'in Sonu", en: "Operation Blacklake & Downfall of Kara Hodrev" },
    ruler: "Prens-Vali Zeandor Stallhart",
    location: "Selya Dağları & Karagöl Mağaraları",
    belligerents: ["Zeandor ve Liaher Komutasındaki Selya Müfrezesi", "Karagöl Çetesi (~60 Haydut)"],
    desc: {
      tr: "Yıllardır köyleri yağmalayan Kara Hodrev'in inine Enidres'in keşfettiği gizli yarıktan sızan Zeandor, çeteyi iki kıskaca alarak yok etti. Hodrev'in kellesini bizzat keserek başkente yolladı.",
      en: "Zeandor and Liaher infiltrated the mountain hideout of the notorious Blacklake Gang, eliminating Hodrev and sending his head to Arava."
    },
    details: {
      causes: "Karagöl çetesinin Jarome köyünü yakıp köylüleri katletmesi.",
      course: "Su çeken haydutlar yem olarak kullanıldı, dar yarıktan sızan öncü birlik ana kuvvetle haydutları sıkıştırdı.",
      outcome: "Hodrev kılıçla deşildi, çete tamamen imha edildi; köylüler rahat nefes aldı.",
      impact: "Zeandor'a halk arasında 'Asker-Prens' unvanını kazandıran ilk şahsi askerî zafer oldu.",
      quote: "Bir canavar ancak kendi ininde, kendi kanıyla boğulur."
    },
    tags: ["askeri", "operasyon", "zeandor"]
  },
  {
    id: "ev-olinder-albea-suikasti",
    ks: "1479",
    type: "tragedy",
    category: "tragedy",
    name: { tr: "Kılıç Geçidi Suikastı: Başkomutan Olinder Albea'nın Katli", en: "Sword Pass Assassination: Slaying of Grand Commander Olinder Albea" },
    ruler: "İmparator Amadon Stallhart",
    location: "Arava Akçaçeşme Dönemeci",
    belligerents: ["Sessiz Avcı (Suikastçı)", "Başkomutan Olinder Albea"],
    desc: {
      tr: "Stallhart'ın 40 yıllık efsanevi mareşali Olinder Albea, Kılıç Geçidi töreninde Akçaçeşme mevkiinde arbalet okuyla boğazından ve göğsünden vurularak katledildi. Orduda ve Kurultay'da deprem yarattı.",
      en: "Legendary Grand Commander Olinder Albea was assassinated by an arbalest sniper during the Sword Pass parade, rocking the military high command."
    },
    details: {
      causes: "Olinder'in Hazine Veziri Selith Hedar ve Hariciye Nazırı Valori Gekhor'un yolsuzluk ve Arathen casusluk belgelerini ele geçirmesi.",
      course: "Sessiz Avcı iki hafta tavan arasında gizlendi; dönemeçte at yavaşladığında iki ölümcül ok attı.",
      outcome: "Olinder halkın gözü önünde atından devrilip can verdi; katil Kızılbayır ormanlarına kaçtı.",
      impact: "Aertas Sınglew Harbiye Başkomutanlığına atandı; ordu içindeki kadim elit denge tamamen sarsıldı.",
      quote: "Tanrılar adına, mareşali vurdular! — Akçaçeşme Dönemeci, KS 1479"
    },
    tags: ["suikast", "trajedi", "olinder"]
  },
  {
    id: "ev-bakirsu-vadisi-pususu-ve-pakti",
    ks: "1480-1481",
    type: "war",
    category: "war",
    name: { tr: "Bakırsu Vadisi Muharebesi & Zeandor-Erthan Gizli Paktı", en: "Battle of Bakırsu Valley & Zeandor-Erthan Secret Pact" },
    ruler: "İmparator Amadon & Prens Zeandor",
    location: "Bakırsu Vadisi / Galetsha Sınırı",
    belligerents: ["Zeandor ve Lejyon (~3.500)", "Erthan'ın Madenci ve Köylü İsyanı Ordusu (~3.000)"],
    desc: {
      tr: "Reun Solgar'ın ordusunu bataklıkta hezimete uğratan Erthan ile Zeandor karşı karşıya geldi. Çadırda yapılan gizli görüşmede kan dökülmedi; Zeandor asilere hak vaat eden fermanı verdi, Erthan ordusunu dağıtarak Selrin kılıcını gizledi.",
      en: "After crushing Solgar's vanguard, rebel leader Erthan met Prince Zeandor. Instead of blood, they forged a secret pact for the future of the empire."
    },
    details: {
      causes: "Galetsha madencilerinin ezici vergileri ve Almonth ile Arhan hanesinin intikamı.",
      course: "Zeandor tek başına Erthan'ın çadırına girdi; iki genç adam gelecekte tiranlığı yıkmak üzere anlaştı.",
      outcome: "İsyan kansız çözüldü; ferman maden kapılarına asıldı; Selrin kılıcı 'Tanrılar bilir' denilerek teslim edilmedi.",
      impact: "Zeandor'a 'Yarının Hükümdarı' meşruiyetini kazandırdı; Erthan'ın fikirlerinin ölmeden yaşamaya devam etmesini sağladı.",
      quote: "Kılıç nerede? — Tanrılar bilir. — Çukurtepeli Erthan"
    },
    tags: ["savas", "antlasma", "isyan", "zeandor", "erthan"]
  },
  {
    id: "ev-zeandor-culas-yedi-muhur",
    ks: "1481-1491",
    type: "milestone",
    category: "milestone",
    name: { tr: "Yedi Mühürlü Ferman & İmparator Zeandor'un Cülûsu", en: "The Seven Sealed Decrees & Accession of Emperor Zeandor" },
    ruler: "İmparator Zeandor Stallhart ('Yarının Hükümdarı')",
    location: "Arava Yüce Divan Salonu",
    belligerents: ["Stallhart Kurultayı", "Selya & Elit Lejyon"],
    desc: {
      tr: "Amadon'un ölüm döşeğinde bıraktığı yedi mühürlü vasiyet fermanı açıldı. Zeandor tahta oturarak 'Yarının Hükümdarı' devrini başlattı; çürüyen imparatorluğu kökten dönüştürecek yeni bir çağ açıldı.",
      en: "Upon Amadon's passing, the Seven Sealed Decrees were unsealed. Zeandor took the Iron Crown, inaugurating the era of the 'Ruler of Tomorrow'."
    },
    details: {
      causes: "Amadon'un hastalığa yenik düşmesi ve Edun Solgar'ın kukla varis planlarının iflas etmesi.",
      course: "Kurultay'da mühürler kırıldı; Zeandor Elit Lejyon ve halk desteğiyle taç giydi.",
      outcome: "Zeandor mutlak hükümdar oldu; saray entrikacıları tasfiye sürecine girdi.",
      impact: "Stallhart Destanı'nın ana anlatı doruğu; karanlık fantezi evreninin yeni kaderinin başlangıcı.",
      quote: "Eğer bir sonum olacaksa o kalemi ben tutacağım. Kaderimi ben yazacağım. — Zeandor Stallhart"
    },
    tags: ["culûs", "donum-noktasi", "taht", "zeandor"]
  }
];

// Write data/events.json
fs.writeFileSync('data/events.json', JSON.stringify({ events }, null, 2), 'utf8');
console.log(`Saved ${events.length} canonical events to data/events.json`);

// Also update data/lore.json events with this enriched set
const lorePath = path.resolve('data/lore.json');
const loreData = JSON.parse(fs.readFileSync(lorePath, 'utf8'));
loreData.events = events;
fs.writeFileSync(lorePath, JSON.stringify(loreData, null, 2), 'utf8');
console.log(`Synced data/lore.json with ${events.length} events!`);
