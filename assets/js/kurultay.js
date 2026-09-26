/* ═══════════════════════════════════════════════════════════════
   STALLHART WIKI — KURULTAY (Forum) ortak modülü
   ---------------------------------------------------------------
   forum.html, forum-kategori.html ve forum-konu.html tarafından
   ortak kullanılır. Dark fantasy estetiğine tam uyumlu kategori
   yapısı (Denge Konseyi, Teori Köşesi, Bölüm Yorumları, Haneler),
   kullanıcı kartları ve hane sadakat sistemi barındırır.
   Supabase yapılandırılmamışsa zengin yerel kurgusal veriye
   düşer ve kesintisiz çalışır.

   Dışa açılan API: window.Kurultay
   ═══════════════════════════════════════════════════════════════ */
(function () {
'use strict';
var W = window.Wiki, C = W && W.Community, esc = W ? W.esc : function(s){ return String(s||''); };

/* ── İKONLAR (kategori rozetleri) ─────────────────────────────── */
var ICONS = {
  yazar:   '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
  denge:   '<path d="M12 3v18M6 8l6-5 6 5M3 13l3-5 3 5a3 3 0 0 1-6 0zM15 13l3-5 3 5a3 3 0 0 1-6 0z"/><path d="M6 21h12"/>',
  teori:   '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/><circle cx="12" cy="12" r="9" stroke-dasharray="2 3"/>',
  bolum:   '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="16" y2="7"/><line x1="9" y1="11" x2="14" y2="11"/>',
  hane:    '<path d="M12 2l8 4v6c0 5.5-3.5 10-8 11-4.5-1-8-5.5-8-11V6l8-4z"/><path d="M12 6v12M8 10h8"/>',
  karakter:'<path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"/><path d="M4 22v-3a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v3"/><path d="M9 11h6"/>',
  duyuru:  '<path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a2 2 0 0 1-3.6-1.2"/><line x1="14" y1="7" x2="14" y2="13"/>',
  sohbet:  '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="10" r="1"/><circle cx="16" cy="10" r="1"/>',
  sanat:   '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10.5" r="1.5"/><circle cx="15" cy="9" r="1.5"/><circle cx="15.5" cy="14.5" r="1.5"/><path d="M12 21a9 9 0 0 1 0-18 4 4 0 0 1 0 8h-.5a2 2 0 0 0 0 4H12a9 9 0 0 1 0 6z"/>',
  yazar:   '<path d="M12 2l3 5 4-2-2 7H7L5 5l4 2 3-5z"/><path d="M7 16h10v2a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-2z"/><path d="M18 20l2 2m-2-2l-1 2m3 0l-2-2"/><circle cx="12" cy="10" r="1"/>'
};

/* ── KATEGORİ LİSTESİ (Kapsamlı Dark Fantasy Evrenine Uyumlu) ──── */
var FALLBACK_CATS = [
  {
    id: 'yazar-divani',
    icon: 'yazar',
    name_tr: 'Yazarın Divanı (Resmî AMA & Soru-Cevap)',
    name_en: "The Author's Divan (Official AMA & Q&A)",
    desc_tr: 'Yazarın meclise bizzat teşrif ettiği, teorileri yanıtladığı ve karanlık evrenin perdelerini araladığı resmî soru-cevap odası.',
    desc_en: "Official chamber where the author answers reader inquiries, validates theories, and unveils lore secrets.",
    is_locked: false,
    thread_count: 28,
    post_count: 194,
    sort_order: 0
  },
  {
    id: 'denge-konseyi',
    icon: 'denge',
    name_tr: 'Denge Konseyi Tartışmaları',
    name_en: 'Council of the Even Discussions',
    desc_tr: 'Düzen ve Kaos dengesi, kadim On İki Tanrı’nın fermanları, KS 0 kırılması ve evrenin mukadderatı.',
    desc_en: 'Cosmic balance of Order & Chaos, decrees of the Twelve Gods, the fracture of KS 0, and the fate of the realm.',
    is_locked: false,
    thread_count: 84,
    post_count: 412,
    sort_order: 1
  },
  {
    id: 'teori',
    icon: 'teori',
    name_tr: 'Teori Köşesi & Gizemler',
    name_en: 'Theory Corner & Mysteries',
    desc_tr: 'Kadim kehanetler, kayıp kan bağları, Son İmparator’un ardındaki gizemler ve ipucu avı.',
    desc_en: 'Ancient prophecies, hidden bloodlines, unresolved secrets of the Last Emperor, and deep lore deductions.',
    is_locked: false,
    thread_count: 196,
    post_count: 870,
    sort_order: 2
  },
  {
    id: 'bolum',
    icon: 'bolum',
    name_tr: 'Bölüm Yorumları & Okuma Kulübü',
    name_en: 'Chapter Discussions & Reading Club',
    desc_tr: 'Yayınlanan her bölümün tahlili, vurucu sahneler, editoryal replikler ve okur reaksiyonları.',
    desc_en: 'Chapter breakdowns, pivotal moments, gripping quotes, and live reader reactions.',
    is_locked: false,
    thread_count: 142,
    post_count: 628,
    sort_order: 3
  },
  {
    id: 'hane',
    icon: 'hane',
    name_tr: 'Haneler & Sadakat Meydanı',
    name_en: 'Houses & Alliances',
    desc_tr: 'Stallhart, Arhan, Selya, Demir Ada ve diğer hanedanların siyaseti, sancak seçimleri ve kan davaları.',
    desc_en: 'Dynastic rivalries, allegiance pledges, blood feuds, and politics between the great houses.',
    is_locked: false,
    thread_count: 118,
    post_count: 530,
    sort_order: 4
  },
  {
    id: 'karakter',
    icon: 'karakter',
    name_tr: 'Karakter Analizleri & Portreler',
    name_en: 'Character Lore & Psyche',
    desc_tr: 'Zeandor Stallhart, Raelen, Althaea ve diğer kilit figürlerin motivasyonları, ahlaki çatışmaları ve kaderleri.',
    desc_en: 'In-depth psychological studies, moral quandaries, and tragic destinies of the protagonists.',
    is_locked: false,
    thread_count: 76,
    post_count: 344,
    sort_order: 5
  },
  {
    id: 'duyuru',
    icon: 'duyuru',
    name_tr: 'Kadim Fermanlar & Duyurular',
    name_en: 'Decrees & Announcements',
    desc_tr: 'Vakanüvis meclis kararları, yeni bölüm yayın takvimi ve Kurultay yönergeleri.',
    desc_en: 'Official author decrees, publication timetables, and assembly rules.',
    is_locked: true,
    thread_count: 16,
    post_count: 94,
    sort_order: 0
  },
  {
    id: 'sohbet',
    icon: 'sohbet',
    name_tr: 'Serbest Meydan (Taverna)',
    name_en: 'The Tavern (Open Chatter)',
    desc_tr: 'Kanon dışı serbest sohbet, evren sohbetleri ve şöminenin başında okurlar arası muhabbet.',
    desc_en: 'Fireside tavern banter, general fantasy chatter, and community warmth.',
    is_locked: false,
    thread_count: 248,
    post_count: 1120,
    sort_order: 6
  },
  {
    id: 'sanat',
    icon: 'sanat',
    name_tr: 'Fan Sanatı & Yaratıcı Eserler',
    name_en: 'Fan Art & Creative Works',
    desc_tr: 'Okurlardan gelen çizimler, özel hanedan sancakları, harita çizimleri ve şiirler.',
    desc_en: 'Community illustrations, custom heraldry, maps, and creative writing.',
    is_locked: false,
    thread_count: 58,
    post_count: 210,
    sort_order: 7
  }
];

function daysAgo(n) { return new Date(Date.now() - n * 86400000).toISOString(); }
function hoursAgo(n) { return new Date(Date.now() - n * 3600000).toISOString(); }
function minsAgo(n) { return new Date(Date.now() - n * 60000).toISOString(); }

/* ── ZENGİN ÖRNEK KONULAR (Dark Fantasy Atmosferi & Kurgusal Zenginlik) ── */
var FALLBACK_THREADS = [
  {
    id: 'f-ama-1',
    category_id: 'yazar-divani',
    title: '👑 [YAZARIN DİVANI #1] Cilt II Öncesi Kanon Soruları & On İki Tanrı’nın Sessizliği',
    title_en: '👑 [AUTHOR AMA #1] Canon Questions Before Volume II & The Silence of the Twelve',
    body: '> Alıntı: "Mürekkep kandan daha ağırdır; zira kan toprağa karışır, mürekkep ise asırları bağlar."\n\nDeğerli okurlar ve sancaktarlar; bu meclis divanında Cilt I sonundaki olaylar, hanedanların perde arkası niyetleri ve On İki Tanrı\'nın KS 1144 kırılmasındaki rolü üzerine sorularınızı yanıtlıyorum.\n\n[Bölüm 5, Sayfa 18] referanslı teorilerinizi doğrudan yöneltebilirsiniz.',
    body_en: '> Quote: "Ink is heavier than blood; for blood sinks into soil, while ink binds the ages."\n\nNoble readers and bannermen; in this divan session I am answering your inquiries regarding Volume I climax, secret intentions of houses, and the Twelve Gods.\n\nCite your theories with [Chapter 5] references.',
    is_pinned: true,
    is_locked: false,
    view_count: 3450,
    reply_count: 52,
    last_activity_at: hoursAgo(1),
    created_at: daysAgo(2),
    profiles: { username: 'Azad Çelik (Yazar)', avatar: 'crown', favorite_house: 'stallhart', title: 'Destan Yazarı & Kanon Muhafızı' },
    reactions: { steel: 94, blood: 16, seal: 138, balance: 42 },
    author_reply: {
      author_name: 'Azad Çelik (Yazar)',
      date: daysAgo(1),
      decree: 'On İki Tanrı’nın KS 1144’ten bu yana süregelen sessizliği bir terk ediş değil; aksine Kaos ve Düzen terazisinin insan iradesine devredilmesidir. Zeandor’un elindeki hançerin üzerindeki mühür, bizzat Galdra’nın adını taşımaktadır.'
    }
  },
  {
    id: 'f-ama-2',
    category_id: 'yazar-divani',
    title: 'Soru: Zeandor’un KS 12 Seferi sırasında gördüğü kara rüya bir kehanet miydi?',
    title_en: 'Question: Was Zeandor’s dark vision during the KS 12 Campaign a prophecy?',
    body: 'Saygıdeğer yazarım, 3. Bölümde Zeandor’un çadırında uyanırken andığı "Gökte iki güneş batarken kızıla boyanan deniz" tasviri, Cilt II’deki Arathen kuşatmasına mı işaret ediyor?\n\n@AzadCelik cevabınızı meclisle paylaşabilir misiniz?',
    body_en: 'Honored author, in Chapter 3 Zeandor awakens remembering "the sea dyed red as two suns set in the sky". Does this foreshadow the Siege of Arathen in Volume II?',
    is_pinned: false,
    is_locked: false,
    view_count: 980,
    reply_count: 18,
    last_activity_at: hoursAgo(6),
    created_at: daysAgo(3),
    profiles: { username: 'Althaea_Gözcüsü', avatar: 'scroll', favorite_house: 'selya', title: 'Kadim Vakanüvis' },
    reactions: { steel: 48, blood: 6, seal: 82, balance: 24 },
    author_reply: {
      author_name: 'Azad Çelik (Yazar)',
      date: daysAgo(2),
      decree: 'Evet, çok isabetli bir tahlil. O rüya alelade bir kabus değildi. Selya açıklarında batacak olan ikinci güneş, bir hanedanın kan bağının son temsilcisini simgeliyor. Cilt II’de bu sahnenin yankılarını göreceksiniz.'
    }
  },
  {
    id: 'f-pin-1',
    category_id: 'duyuru',
    title: 'Kurultay Yönergesi: Kanunlar, Mühür Hakları ve Üslup',
    title_en: 'Kurultay Codex: Bylaws, Seal Rights & Forum Etiquette',
    body: '> Alıntı: "Çelik boyun eğmez, lakin hakikate kör kılıç efendisini keser."\n\nKurultay meclisine hoş geldiniz. Tartışmalarda spoiler uyarılarına ve hane onuruna özen gösterilmesi zorunludur.\n\n||Kurallara uymayan sancaktarların divan kütüğündeki mühürleri geri alınır.||',
    body_en: '> Quote: "Steel does not yield, yet a sword blind to truth strikes its master."\n\nWelcome to the Kurultay. Mind spoiler warnings and treat fellow house bannermen with honour.\n\n||Members violating bylaws shall have their seals struck from the register.||',
    is_pinned: true,
    is_locked: true,
    view_count: 4820,
    reply_count: 24,
    last_activity_at: daysAgo(2),
    created_at: daysAgo(5),
    profiles: { username: 'craesx', avatar: 'crown', favorite_house: 'stallhart', title: 'Baş Vakanüvis' },
    reactions: { steel: 56, blood: 12, seal: 88, balance: 34 }
  },
  {
    id: 'f-pin-2',
    category_id: 'duyuru',
    title: 'Cilt I Bitiş & Cilt II "Gölgenin Şafağı" Yayın Takvimi',
    title_en: 'Volume I Conclusion & Volume II "Dawn of Shadows" Release Schedule',
    body: 'Cilt II hazırlıkları tüm hızıyla sürüyor. İlk üç bölümün taslakları Konsey onayından geçti…\n\n[Bölüm 1, Paragraf 4] tasvirlerindeki kadim tapınak sahneleri yeni ciltte doğrudan olayların merkezine oturacak. @DengeHakimi ve @ParşömenKurdu gibi vakanüvislerin tespitleri metinlere ışık tuttu.',
    body_en: 'Preparations for Volume II are underway. Drafts for the first three chapters are cleared…\n\nAncient temple scenes from [Chapter 1] will shift to the focal point of Volume II. Observations by chroniclers like @DengeHakimi helped sharpen the lore.',
    is_pinned: true,
    is_locked: false,
    view_count: 8940,
    reply_count: 73,
    last_activity_at: hoursAgo(4),
    created_at: daysAgo(1),
    profiles: { username: 'craesx', avatar: 'scroll', favorite_house: 'stallhart', title: 'Baş Vakanüvis' },
    reactions: { steel: 124, blood: 45, seal: 92, balance: 67 }
  },
  {
    id: 'f-teori-1',
    category_id: 'teori',
    title: 'Zeandor’un Taşıdığı Yadigâr Kılıç: Lunin Hanedanı ile Kan Bağı Kanıtı mı?',
    title_en: 'Zeandor’s Heirloom Blade: Proof of Bloodline Tie to House Lunin?',
    body: '> Alıntı: "Gümüş şafak vurduğunda, kan çelikle değil ruhla fısıldar."\n\n[Bölüm 12, Sayfa 8] satırlarında kılıcın kabzasındaki gümüş kıvılcım detayı yalnızca Lunin kanından gelenlerin uyandırabildiği bir büyü.\n\n||Bu detay doğrudan Zeandor\'un geçmişindeki kayıp prens soyuna işaret ediyor. İmparator bunu bildiği için onu saraydan uzaklaştırdı.||',
    body_en: '> Quote: "When silver dawn strikes, blood whispers not with steel, but with the soul."\n\nIn [Chapter 12], the silver spark detail on the hilt is an enchantment awakened only by Lunin blood.\n\n||This confirms Zeandor carries the exiled prince\'s bloodline. The Emperor exiled him precisely to avert this prophecy.||',
    is_pinned: false,
    is_locked: false,
    is_canonized: true,
    canonized_note: 'Bölüm 12 yayınlandığında Yazar tarafından kanon olarak tescillenmiştir.',
    canonized_note_en: 'Canonized by the Chronicler upon the release of Chapter 12.',
    canonized_by: 'craesx',
    view_count: 4620,
    reply_count: 104,
    last_activity_at: minsAgo(34),
    created_at: hoursAgo(14),
    profiles: { username: 'GozcuSolmaz', avatar: 'eye', favorite_house: 'demir-ada', title: 'Kadim Kâhin' },
    reactions: { steel: 89, blood: 24, seal: 142, balance: 38 }
  },
  {
    id: 'f-hane-1',
    category_id: 'hane',
    title: 'Stallhart "Çelik ve Kan" vs. Demir Ada Hanedanı: Taht Hakkı Kimde?',
    title_en: 'House Stallhart "Steel & Blood" vs. Iron Isle: Who Holds the Rightful Claim?',
    body: 'Başsancak ile adaların arasındaki gerilim Cilt II’de açık bir savaşa dönüşebilir. Sancağınızı kime adıyorsunuz?\n\n> Alıntı: "Demir bükülür, taş ufalanır; lakin kandan yazılan yemin kıyamete kadar durur."',
    body_en: 'Tensions between the Crownland and the Isles will erupt in Volume II. To which banner do you pledge your blade?\n\n> Quote: "Iron bends, rock crumbles; yet an oath carved in blood endures till doom."',
    is_pinned: false,
    is_locked: false,
    view_count: 3890,
    reply_count: 98,
    last_activity_at: hoursAgo(1),
    created_at: hoursAgo(18),
    profiles: { username: 'KaganDemir', avatar: 'sword', favorite_house: 'demir-ada', title: 'Yeminli Şövalye' },
    poll: {
      id: 'poll-hane-1',
      question: 'Cilt II\'de Taht Hakkı ve Meşruiyet Kimde Olmalı?',
      question_en: 'Who Holds the Rightful Claim to the Throne in Volume II?',
      options: [
        { id: 'opt-1', text: 'Stallhart Hanedanı (Çelik ve Kan)', votes: 124 },
        { id: 'opt-2', text: 'Demir Ada İttifakı (Kırılırız ama Eğilmeyiz)', votes: 88 },
        { id: 'opt-3', text: 'Arhan Hanedanı (Küllerden Doğan)', votes: 46 },
        { id: 'opt-4', text: 'Selya Hanedanı (Liman Lordları)', votes: 29 }
      ]
    },
    reactions: { steel: 76, blood: 64, seal: 32, balance: 41 }
  },
  {
    id: 'f-denge-1',
    category_id: 'denge-konseyi',
    title: 'KS 0 Anlaşması: On İki Tanrı Dengeyi Korumak Yerine Neden Dünyayı Terk Etti?',
    title_en: 'The KS 0 Accord: Why Did the Twelve Abandon the Realm Rather Than Preserve Balance?',
    body: 'Kadim metinlerde KS 0 yılında konseyin dağıldığı yazıyor. Peki Kaos tanrıları bu sessizlikten nasıl faydalandı?\n\n[Bölüm 3, Paragraf 14] satırlarına göre kırılma Kaos\'un müdahalesiyle değil, Denge tanrılarının kendi içindeki bir yemin bozması yüzünden başladı.',
    body_en: 'Ancient scriptures state the Council fractured in year KS 0. How did the gods of Chaos exploit this silence?\n\nAccording to [Chapter 3], the cataclysm was triggered not by Chaos alone, but by a broken divine oath.',
    is_pinned: false,
    is_locked: false,
    view_count: 2430,
    reply_count: 67,
    last_activity_at: minsAgo(18),
    created_at: hoursAgo(8),
    profiles: { username: 'DengeHakimi', avatar: 'shield', favorite_house: 'arhan', title: 'Konsey Mührü Muhafızı' },
    reactions: { steel: 38, blood: 14, seal: 52, balance: 79 }
  },
  {
    id: 'f-bolum-1',
    category_id: 'bolum',
    title: '1. Bölüm — "Fırtına Öncesi Sessizlik": Zeandor’un İlk Kararı ve Felsefesi',
    title_en: 'Chapter 1 — "Calm Before the Storm": Zeandor’s First Choice & Philosophy',
    body: 'Giriş bölümündeki tasvirler inanılmaz etkileyici. Özellikle kalenin burçlarındaki sis sahnesi atmosferi harika kuruyor.\n\n> Alıntı: "Sessizlik korkakların sığınağı değildir; yaklaşan fırtınanın nefes alışıdır."',
    body_en: 'The opening imagery is spellbinding. The mist over the ramparts sets an unmatched dark fantasy tone.\n\n> Quote: "Silence is not the coward\'s refuge; it is the deep breath of the oncoming storm."',
    is_pinned: false,
    is_locked: false,
    view_count: 5120,
    reply_count: 148,
    last_activity_at: minsAgo(52),
    created_at: daysAgo(2),
    profiles: { username: 'ParşömenKurdu', avatar: 'quill', favorite_house: 'stallhart', title: 'Arşivci' },
    reactions: { steel: 94, blood: 28, seal: 65, balance: 42 }
  },
  {
    id: 'f-karakter-1',
    category_id: 'karakter',
    title: 'Raelen’in Gri Ahlakı: Bir Kurtarıcı mı, Yoksa Kaçınılmaz Bir Tiran mı?',
    title_en: 'Raelen’s Grey Morality: A Savoir or an Inevitable Tyrant?',
    body: 'Verdiği kararların acımasızlığı karşısında hissettiği vicdan azabı onu evrenin en derin karakteri yapıyor.\n\n||Bölüm 8 sonunda verdiği idam emri, aslında hanesini yok olmaktan kurtaracak tek hamleydi.||',
    body_en: 'The guilt weighing on him after ruthless decisions cements him as the saga’s most compelling figure.\n\n||His execution decree at the end of Chapter 8 was grim, yet the only viable move to save his people.||',
    is_pinned: false,
    is_locked: false,
    view_count: 1980,
    reply_count: 52,
    last_activity_at: hoursAgo(3),
    created_at: daysAgo(1),
    profiles: { username: 'AylaGok', avatar: 'moon', favorite_house: 'selya', title: 'Divan Üyesi' },
    reactions: { steel: 33, blood: 41, seal: 27, balance: 39 }
  },
  {
    id: 'f-sohbet-1',
    category_id: 'sohbet',
    title: 'Taverna Masası: Stallhart Evreninde Bir Gün Yaşasanız Hangi Şehri Seçerdiniz?',
    title_en: 'Tavern Hearth: If You Lived One Day in the Realm, Which City Would You Visit?',
    body: 'Arava’nın altın kuleleri mi, yoksa liman kentlerinin tuz kokulu tavernaları mı? Kahveleri ve kadehleri hazırlayın!',
    body_en: 'The golden spires of Arava, or the salty breeze of port-town taverns? Pull up a chair!',
    is_pinned: false,
    is_locked: false,
    view_count: 3410,
    reply_count: 119,
    last_activity_at: minsAgo(8),
    created_at: daysAgo(3),
    profiles: { username: 'GezginBatu', avatar: 'flame', favorite_house: 'karatas', title: 'Gezgin' },
    reactions: { steel: 45, blood: 19, seal: 31, balance: 22 }
  },
  {
    id: 'f-sanat-1',
    category_id: 'sanat',
    title: 'Denge Konseyi Tapınak Kapısı İllüstrasyon Çalışmam (Dijital Çizim)',
    title_en: 'My Illustration of the Council of the Even Temple Gate (Digital Art)',
    body: 'Kitaptaki tasvirlere sadık kalarak kapıdaki On İki Rün kabartmalarını çizdim. Yorumlarınızı bekliyorum!',
    body_en: 'Faithfully reconstructed the Twelve Runes on the gate based on canon lore descriptions. Feedback welcome!',
    is_pinned: false,
    is_locked: false,
    view_count: 1420,
    reply_count: 38,
    last_activity_at: hoursAgo(5),
    created_at: daysAgo(2),
    profiles: { username: 'CizerMert', avatar: 'quill', favorite_house: 'arhan', title: 'Usta Kâtip' },
    reactions: { steel: 61, blood: 8, seal: 77, balance: 19 }
  }
];

var catCache = null;

/* ── VAKANÜVİS / OKUR SEVİYE SİSTEMİ (Gamification & Progression) ─ */
var RANKS = [
  { minXP: 0, title_tr: 'Çırak Okur', title_en: 'Apprentice Reader', icon: '📜', tier: 1 },
  { minXP: 100, title_tr: 'Yeminli Sancaktar', title_en: 'Sworn Bannerman', icon: '🛡️', tier: 2 },
  { minXP: 250, title_tr: 'Divan Kâtibi', title_en: 'Council Scribe', icon: '✒️', tier: 3 },
  { minXP: 500, title_tr: 'Konsey Muhafızı', title_en: 'Council Warden', icon: '⚔️', tier: 4 },
  { minXP: 1000, title_tr: 'Kadim Vakanüvis', title_en: 'Elder Chronicler', icon: '👑', tier: 5 }
];

var MEDALS = [
  { id: 'first_theory', icon: '🗡️', name_tr: 'İlk Teori', name_en: 'First Theory', desc_tr: 'Kurultay’da meclise ilk kehanet teorisini sundu.' },
  { id: 'sworn_bannerman', icon: '🛡️', name_tr: 'Çelik Yeminli', name_en: 'Sworn Oath', desc_tr: 'Bir hanedana sadakat yemini ederek sancağını seçti.' },
  { id: 'canon_seer', icon: '🔮', name_tr: 'Kâhin Mührü', name_en: 'Prophet Seal', desc_tr: 'Bir teorisi yazar tarafından resmi kanon ilan edildi.' },
  { id: 'chapter_scholar', icon: '📜', name_tr: '10 Bölüm Tahlili', name_en: 'Chapter Scholar', desc_tr: 'Bölüm incelemelerine 10’dan fazla kıymetli kelam bıraktı.' },
  { id: 'balance_keeper', icon: '⚖️', name_tr: 'Denge Savunucusu', name_en: 'Balance Keeper', desc_tr: 'Denge Konseyi münazaralarında adil kelamıyla sivrildi.' }
];

function getUserProgression(u) {
  var seals = u.seals !== undefined ? u.seals : 185;
  var threads = u.thread_count || 1;
  var replies = u.reply_count || 8;
  var xp = Math.max(0, (seals * 2) + (threads * 15) + (replies * 5));

  var curRank = RANKS[0], nextRank = null;
  for (var i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].minXP) {
      curRank = RANKS[i];
      nextRank = RANKS[i + 1] || null;
    }
  }

  var curTierMin = curRank.minXP;
  var nextTierMin = nextRank ? nextRank.minXP : curTierMin + 500;
  var progressPct = nextRank ? Math.min(100, Math.max(0, Math.round(((xp - curTierMin) / (nextTierMin - curTierMin)) * 100))) : 100;
  var neededXP = nextRank ? (nextTierMin - xp) : 0;

  var unlockedMedals = ['sworn_bannerman', 'first_theory'];
  if (xp >= 250) unlockedMedals.push('chapter_scholar');
  if (xp >= 500) unlockedMedals.push('balance_keeper');
  if (u.is_prophet || (u.title && u.title.indexOf('Kâhin') >= 0)) unlockedMedals.push('canon_seer');

  return {
    xp: xp,
    rank: curRank,
    nextRank: nextRank,
    progressPct: progressPct,
    neededXP: neededXP,
    medals: unlockedMedals
  };
}

/* ── KULLANICI & HANE SADAKAT SİSTEMİ ─────────────────────────── */
var Allegiance = (function () {
  var KEY = 'sw-forum-allegiance-v2';

  function getLocal() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      username: 'Gezgin Okur',
      avatar: 'sword',
      favorite_house: 'stallhart',
      title: 'Denge Arayıcısı',
      rank: 'Yeminli Sancaktar',
      seals: 185,
      thread_count: 4,
      reply_count: 26,
      reading_milestone: 'Bölüm 2 Tamamlandı'
    };
  }

  function setLocal(data) {
    try {
      var cur = getLocal();
      var updated = Object.assign({}, cur, data);
      localStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    } catch (e) { return data; }
  }

  function getCurrentUser() {
    if (C && C.getState) {
      var st = C.getState();
      if (st && st.user && st.profile) {
        var p = st.profile;
        var loc = getLocal();
        return {
          id: st.user.id,
          username: p.username || st.user.email.split('@')[0],
          avatar: p.avatar || 'sword',
          favorite_house: p.favorite_house || loc.favorite_house || 'stallhart',
          title: p.title || loc.title || 'Divan Üyesi',
          rank: st.isAdmin ? 'Baş Vakanüvis' : (p.role === 'admin' ? 'Vakanüvis' : (loc.rank || 'Yeminli Sancaktar')),
          seals: p.seals !== undefined ? p.seals : loc.seals,
          thread_count: loc.thread_count || 1,
          reply_count: loc.reply_count || 8,
          reading_milestone: loc.reading_milestone || 'Destan Takipçisi'
        };
      }
    }
    return getLocal();
  }

  async function pledgeHouse(houseId, newTitle) {
    var u = setLocal({ favorite_house: houseId, title: newTitle || 'Yeminli Sancaktar' });
    addFactionPoints(houseId, 50);
    if (C && C.getState) {
      var st = C.getState();
      if (st && st.user && C.getClient) {
        try {
          var client = await C.getClient();
          await client.from('profiles').update({ favorite_house: houseId, title: newTitle || 'Yeminli Sancaktar' }).eq('id', st.user.id);
          if (st.profile) { st.profile.favorite_house = houseId; st.profile.title = newTitle; }
        } catch (e) { console.warn('Supabase hane güncelleme hatası:', e); }
      }
    }
    return u;
  }

  return { get: getCurrentUser, set: setLocal, pledge: pledgeHouse };
})();

/* ── TAHT MÜCADELESİ / HANE SADAKAT SAVAŞLARI (Faction Wars) ──── */
var FACTION_KEY = 'sw-faction-wars-points-v2';
var BASE_FACTION_SCORES = {
  'stallhart': 4820,
  'arhan': 4310,
  'demir-ada': 3940,
  'selya': 3180
};

var FACTION_META = {
  'stallhart': { name: 'Stallhart', motto: 'Çelik ve Kan', color1: '#c4962a', color2: '#8b1e1e', province: 'Başsancak' },
  'arhan': { name: 'Arhan', motto: 'Küllerden Doğan', color1: '#8b1e1e', color2: '#d4af37', province: 'Batı Eyaleti' },
  'demir-ada': { name: 'Demir Ada', motto: 'Kırılırız ama Eğilmeyiz', color1: '#2f3e46', color2: '#84a98c', province: 'Adalar' },
  'selya': { name: 'Selya', motto: 'Dalgalar Boyun Eğmez', color1: '#1b3b6f', color2: '#64b5f6', province: 'Limanlar' }
};

function getFactionStandings() {
  var stored = {};
  try {
    var raw = localStorage.getItem(FACTION_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch (e) {}

  var list = Object.keys(BASE_FACTION_SCORES).map(function (hid) {
    var meta = FACTION_META[hid] || { name: hid, motto: '', color1: '#888', color2: '#444', province: '' };
    var score = (BASE_FACTION_SCORES[hid] || 1000) + (stored[hid] || 0);
    return {
      id: hid,
      name: meta.name,
      motto: meta.motto,
      province: meta.province,
      color1: meta.color1,
      color2: meta.color2,
      points: score
    };
  });

  list.sort(function (a, b) { return b.points - a.points; });
  var maxPoints = list[0].points || 1;
  return list.map(function (item, idx) {
    item.rank = idx + 1;
    item.isLeader = idx === 0;
    item.pct = Math.round((item.points / maxPoints) * 100);
    return item;
  });
}

function addFactionPoints(houseId, delta) {
  try {
    var stored = {};
    var raw = localStorage.getItem(FACTION_KEY);
    if (raw) stored = JSON.parse(raw);
    stored[houseId] = (stored[houseId] || 0) + (delta || 10);
    localStorage.setItem(FACTION_KEY, JSON.stringify(stored));
  } catch (e) {}
}

function renderFactionLeaderboardWidget(container, l) {
  if (!container) return;
  var standings = getFactionStandings();
  var leader = standings[0];

  var rowsHTML = standings.map(function (h) {
    return '<div class="sw-fl-row' + (h.isLeader ? ' leader-row' : '') + '">' +
      '<span class="sw-fl-rank">' + (h.isLeader ? '👑' : '#' + h.rank) + '</span>' +
      '<div class="sw-fl-bar-wrap">' +
        '<div class="sw-fl-header">' +
          '<b class="sw-fl-name" style="color:' + esc(h.color1) + '">' + esc(h.name) + '</b>' +
          '<span class="sw-fl-pts">' + h.points.toLocaleString('tr-TR') + ' ' + (l === 'tr' ? 'Şan' : 'Renown') + '</span>' +
        '</div>' +
        '<div class="sw-fl-progress-track">' +
          '<div class="sw-fl-progress-fill" style="width:' + h.pct + '%; background: linear-gradient(90deg, ' + esc(h.color2) + ', ' + esc(h.color1) + ');"></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  container.innerHTML =
    '<div class="fr-side-box sw-faction-box">' +
      '<div class="sw-fl-trophy-top">' +
        '<span class="sw-fl-crown">👑 ' + (l === 'tr' ? 'Haftanın Baskın Sancağı' : 'Dominant House Banner') + '</span>' +
      '</div>' +
      '<div class="sw-fl-leader-card" style="border-color:' + esc(leader.color1) + '">' +
        '<div class="sw-fl-leader-badge" style="background:linear-gradient(135deg, ' + esc(leader.color2) + ', ' + esc(leader.color1) + ')">' +
          '<span>' + esc(leader.name.charAt(0)) + '</span>' +
        '</div>' +
        '<div class="sw-fl-leader-meta">' +
          '<h4 class="sw-fl-leader-name">' + esc(leader.name) + ' Hanedanı</h4>' +
          '<p class="sw-fl-leader-motto">“' + esc(leader.motto) + '”</p>' +
        '</div>' +
      '</div>' +
      '<p class="fr-side-h" style="margin-top:1.1rem;font-size:.82rem;">' + (l === 'tr' ? 'Taht Mücadelesi Puan Tablosu' : 'Throne Contest Standings') + '</p>' +
      '<div class="sw-fl-list">' + rowsHTML + '</div>' +
      '<button type="button" class="sw-fl-pledge-btn" id="sw-fl-open-pledge">' +
        '⚔ ' + (l === 'tr' ? 'Sancağına Güç Ver (Tarafını Seç)' : 'Empower Your House (Pledge)') +
      '</button>' +
    '</div>';

  var btn = container.querySelector('#sw-fl-open-pledge');
  if (btn) {
    btn.addEventListener('click', function () {
      openPledgeModal(function () {
        renderFactionLeaderboardWidget(container, l);
        var uSlot = document.getElementById('fr-user-card-slot');
        if (uSlot) renderUserCard(uSlot, l);
      });
    });
  }
}

/* ── İKİLİ OYLAMA & TEMATİK TEPKİLER (⚔️ Çelik, 🩸 Kan, 📜 Mühür, ⚖️ Denge) ─ */
var THEMATIC_REACTIONS = [
  { id: 'steel', icon: '⚔️', label_tr: 'Çelik', label_en: 'Steel', tip_tr: 'Çelik: Onay / Katılıyorum', tip_en: 'Steel: Endorsement / Agreed' },
  { id: 'blood', icon: '🩸', label_tr: 'Kan', label_en: 'Blood', tip_tr: 'Kan: Çatışma / Cesur Fikir', tip_en: 'Blood: Defiance / Bold Theory' },
  { id: 'seal', icon: '📜', label_tr: 'Mühür', label_en: 'Seal', tip_tr: 'Mühür: Değerli Teori & Kanıt', tip_en: 'Seal: Valuable Lore Deduction' },
  { id: 'balance', icon: '⚖️', label_tr: 'Denge', label_en: 'Balance', tip_tr: 'Denge: Adil / Tarafsız Kelam', tip_en: 'Balance: Fair & Balanced Thought' }
];

function getThreadReactions(threadId) {
  var stored = null;
  try {
    var raw = localStorage.getItem('sw-reactions-' + threadId);
    if (raw) stored = JSON.parse(raw);
  } catch (e) {}

  var userVotes = {};
  try {
    var uRaw = localStorage.getItem('sw-my-reactions-' + threadId);
    if (uRaw) userVotes = JSON.parse(uRaw);
  } catch (e) {}

  var base = { steel: 24, blood: 11, seal: 35, balance: 18 };
  var t = FALLBACK_THREADS.filter(function (x) { return x.id === threadId; })[0];
  if (t && t.reactions) base = Object.assign({}, t.reactions);
  if (stored) base = Object.assign(base, stored);

  return { counts: base, userVotes: userVotes };
}

function toggleReaction(threadId, rType) {
  var data = getThreadReactions(threadId);
  var counts = data.counts;
  var userVotes = data.userVotes;

  var wasVoted = !!userVotes[rType];
  if (wasVoted) {
    counts[rType] = Math.max(0, (counts[rType] || 1) - 1);
    delete userVotes[rType];
  } else {
    counts[rType] = (counts[rType] || 0) + 1;
    userVotes[rType] = true;
    var u = Allegiance.get();
    addFactionPoints(u.favorite_house || 'stallhart', 15);
  }

  try {
    localStorage.setItem('sw-reactions-' + threadId, JSON.stringify(counts));
    localStorage.setItem('sw-my-reactions-' + threadId, JSON.stringify(userVotes));
  } catch (e) {}

  var t = FALLBACK_THREADS.filter(function (x) { return x.id === threadId; })[0];
  if (t) t.reactions = counts;

  return { counts: counts, userVotes: userVotes };
}

function renderReactionsBar(threadId, l) {
  var data = getThreadReactions(threadId);
  var html = '<div class="sw-reactions-bar" data-thread-id="' + esc(threadId) + '">';
  THEMATIC_REACTIONS.forEach(function (r) {
    var isVoted = !!data.userVotes[r.id];
    var count = data.counts[r.id] || 0;
    var tip = l === 'tr' ? r.tip_tr : r.tip_en;
    var lbl = l === 'tr' ? r.label_tr : r.label_en;
    html += '<button type="button" class="sw-rx-btn ' + r.id + (isVoted ? ' active' : '') + '" data-rx="' + r.id + '" title="' + esc(tip) + '">' +
      '<span class="sw-rx-ic">' + r.icon + '</span>' +
      '<span class="sw-rx-lbl">' + esc(lbl) + '</span>' +
      '<span class="sw-rx-cnt">' + count + '</span>' +
    '</button>';
  });
  html += '</div>';
  return html;
}

/* ── HIZLI ANKET SİSTEMİ (Kurultay Oylamaları / Polls) ─────────── */
function getPollData(thread) {
  if (!thread || !thread.poll) return null;
  var p = thread.poll;
  var userVote = null;
  try {
    userVote = localStorage.getItem('sw-poll-vote-' + thread.id);
  } catch (e) {}

  var options = (p.options || []).map(function (o) {
    var v = o.votes || 0;
    if (userVote === o.id) {
      v = Math.max(v, 1);
    }
    return { id: o.id, text: o.text, votes: v };
  });
  var total = options.reduce(function (sum, o) { return sum + (o.votes || 0); }, 0);
  return {
    id: p.id || 'poll-' + thread.id,
    question: p.question,
    question_en: p.question_en,
    options: options,
    totalVotes: total,
    userVote: userVote
  };
}

function votePoll(threadId, optionId) {
  try {
    localStorage.setItem('sw-poll-vote-' + threadId, optionId);
  } catch (e) {}
  var t = getLocalThreads().filter(function (x) { return x.id === threadId; })[0] ||
          FALLBACK_THREADS.filter(function (x) { return x.id === threadId; })[0];
  if (!t || !t.poll) return null;
  var opt = t.poll.options.filter(function (o) { return o.id === optionId; })[0];
  if (opt) {
    opt.votes = (opt.votes || 0) + 1;
    var u = Allegiance.get();
    addFactionPoints(u.favorite_house || 'stallhart', 25);
  }
  return getPollData(t);
}

function renderPollCard(thread, l) {
  var poll = getPollData(thread);
  if (!poll) return '';

  var q = l === 'tr' ? poll.question : (poll.question_en || poll.question);
  var hasVoted = !!poll.userVote;

  var optsHTML = poll.options.map(function (opt) {
    var pct = poll.totalVotes > 0 ? Math.round(((opt.votes || 0) / poll.totalVotes) * 100) : 0;
    var isChosen = poll.userVote === opt.id;
    if (hasVoted) {
      return '<div class="sw-poll-result-row' + (isChosen ? ' chosen' : '') + '">' +
        '<div class="sw-poll-res-top">' +
          '<span class="sw-poll-opt-text">' + (isChosen ? '✓ ' : '') + esc(opt.text) + '</span>' +
          '<span class="sw-poll-opt-pct">' + pct + '% (' + (opt.votes || 0) + ')</span>' +
        '</div>' +
        '<div class="sw-poll-bar-track"><div class="sw-poll-bar-fill" style="width:' + pct + '%"></div></div>' +
      '</div>';
    } else {
      return '<label class="sw-poll-radio-row">' +
        '<input type="radio" name="poll_choice_' + esc(thread.id) + '" value="' + esc(opt.id) + '">' +
        '<span class="sw-poll-radio-custom"></span>' +
        '<span class="sw-poll-opt-text">' + esc(opt.text) + '</span>' +
      '</label>';
    }
  }).join('');

  var actionsHTML = hasVoted
    ? '<div class="sw-poll-voted-msg">⚖️ ' + (l === 'tr' ? 'Oyunuz Kurultay Divanı’na mühürlendi.' : 'Your vote is recorded in the Kurultay Codex.') + ' (' + poll.totalVotes + ' ' + (l === 'tr' ? 'toplam oy' : 'total votes') + ')</div>'
    : '<div class="sw-poll-actions">' +
        '<button type="button" class="sw-poll-btn" data-poll-submit="' + esc(thread.id) + '">' +
          '🗳️ ' + (l === 'tr' ? 'Mührünü Bas & Oyla' : 'Cast Your Seal & Vote') +
        '</button>' +
        '<span class="sw-poll-count-lbl">' + poll.totalVotes + ' ' + (l === 'tr' ? 'oy kullanıldı' : 'votes cast') + '</span>' +
      '</div>';

  return '<div class="sw-poll-card" id="poll-card-' + esc(thread.id) + '">' +
    '<div class="sw-poll-badge">📊 ' + (l === 'tr' ? 'Kurultay Oylaması' : 'Assembly Ballot') + '</div>' +
    '<h3 class="sw-poll-q">' + esc(q) + '</h3>' +
    '<div class="sw-poll-options">' + optsHTML + '</div>' +
    actionsHTML +
  '</div>';
}

/* ── KEHANET & TEORİ DOĞRULAMA (Canonized Theories) ───────────── */
function canonizeThread(threadId, isCanon, note) {
  var t = FALLBACK_THREADS.filter(function (x) { return x.id === threadId; })[0];
  if (!t) return;
  t.is_canonized = isCanon;
  t.canonized_note = note || 'Yazar tarafından resmi kanon kehanet olarak ilan edilmiştir.';
  if (isCanon && t.profiles) {
    t.profiles.title = 'Kâhin';
    t.profiles.is_prophet = true;
  }
  try {
    localStorage.setItem('sw-canon-' + threadId, isCanon ? '1' : '0');
  } catch (e) {}
}

function renderCanonBanner(thread, l) {
  if (!thread.is_canonized) return '';
  var note = l === 'tr' ? (thread.canonized_note || 'Bu teori, son bölümlerde yazar tarafından doğrulanmış bir kehanettir.') : (thread.canonized_note_en || 'This theory was officially verified as canon lore by the author.');
  return '<div class="sw-canon-banner">' +
    '<div class="sw-canon-seal">🔮</div>' +
    '<div class="sw-canon-info">' +
      '<h4>' + (l === 'tr' ? 'Doğrulanan Kehanet (Resmî Kanon)' : 'Canonized Prophecy (Official Lore)') + '</h4>' +
      '<p>' + esc(note) + '</p>' +
    '</div>' +
    '<span class="sw-canon-tag">👑 ' + (l === 'tr' ? 'Kâhin Mührü' : 'Prophet Seal') + '</span>' +
  '</div>';
}

function renderAuthorDecree(thread, l) {
  if (!thread || !thread.author_reply) return '';
  var rep = thread.author_reply;
  return '<div class="sw-author-decree-card">' +
    '<div class="sw-author-decree-body">“' + esc(rep.decree) + '”</div>' +
    '<div class="sw-author-decree-foot">' +
      '<span>🪶 ' + esc(rep.author_name || (l === 'tr' ? 'Azad Çelik (Yazar)' : 'Author Azad Çelik')) + '</span>' +
      '<span>📜 ' + (l === 'tr' ? 'Resmî Kanon Mührü Basıldı' : 'Official Canon Seal Applied') + '</span>' +
    '</div>' +
  '</div>';
}

/* ── PARŞÖMEN ÜSLUPLU ZENGİN METİN & SPOİLER RENDERER ─────────── */
function renderRichBody(raw, l) {
  if (!raw) return '';
  var h = esc(raw);

  /* Kanon Alıntıları: > Alıntı: "..." veya > ... */
  h = h.replace(/^>\s*(Alıntı|Quote)?\s*:?\s*(.*)$/gim, function (m, p1, p2) {
    return '<blockquote class="sw-parch-quote"><span class="sw-quote-pen">✒️</span><div class="sw-quote-body">' + (p2 || '') + '</div></blockquote>';
  });

  /* Gizli Spoilerlar: ||...|| veya [spoiler]...[/spoiler] */
  h = h.replace(/\|\|([\s\S]*?)\|\|/g, function (m, inner) {
    return '<span class="sw-spoiler-box" tabindex="0" onclick="this.classList.toggle(\'revealed\')" title="' + (l === 'tr' ? 'Spoilerı açmak için tıkla' : 'Click to reveal spoiler') + '">' +
      '<span class="sw-sp-badge">👁️ SPOILER</span>' +
      '<span class="sw-sp-content">' + inner + '</span>' +
    '</span>';
  });
  h = h.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, function (m, inner) {
    return '<span class="sw-spoiler-box" tabindex="0" onclick="this.classList.toggle(\'revealed\')" title="' + (l === 'tr' ? 'Spoilerı açmak için tıkla' : 'Click to reveal spoiler') + '">' +
      '<span class="sw-sp-badge">👁️ SPOILER</span>' +
      '<span class="sw-sp-content">' + inner + '</span>' +
    '</span>';
  });

  /* Bölüm Referansı: [Bölüm 4, Sayfa 12] */
  h = h.replace(/\[(Bölüm|Chapter|Cilt|Arc)\s*([^\]]+)\]/gi, function (m, kind, ref) {
    return '<span class="sw-canon-tag-chip"><svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' + kind + ' ' + ref + '</span>';
  });

  /* @Mention etiketleri: @KullaniciAdi */
  h = h.replace(/@([A-Za-z0-9_ğüşıöçĞÜŞİÖÇ]+)/g, function (m, uname) {
    return '<span class="sw-mention-chip">@' + uname + '</span>';
  });

  /* Kalın ve italik markdown */
  h = h.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  h = h.replace(/\*([^*]+)\*/g, '<i>$1</i>');

  return h.replace(/\r?\n/g, '<br>');
}

/* Editör Araç Çubuğu (Toolbar) */
function attachEditorToolbar(textarea, container, l) {
  if (!textarea || !container) return;
  var tb = document.createElement('div');
  tb.className = 'sw-editor-toolbar';
  tb.innerHTML =
    '<button type="button" class="sw-tb-btn" data-act="quote" title="' + (l === 'tr' ? 'Kanon Alıntısı Ekle' : 'Insert Canon Quote') + '">❝ ' + (l === 'tr' ? 'Alıntı' : 'Quote') + '</button>' +
    '<button type="button" class="sw-tb-btn" data-act="spoiler" title="' + (l === 'tr' ? 'Spoiler Gizleme Etiketi' : 'Spoiler Tag') + '">👁️ Spoiler</button>' +
    '<button type="button" class="sw-tb-btn" data-act="ref" title="' + (l === 'tr' ? 'Bölüm Referansı' : 'Chapter Ref') + '">📜 ' + (l === 'tr' ? 'Bölüm' : 'Chapter') + '</button>' +
    '<button type="button" class="sw-tb-btn" data-act="bold" title="' + (l === 'tr' ? 'Vurgulu Kelam' : 'Bold') + '"><b>B</b> ' + (l === 'tr' ? 'Vurgu' : 'Bold') + '</button>' +
    '<button type="button" class="sw-tb-btn" data-act="mention" title="' + (l === 'tr' ? 'Okurdan Bahset' : 'Mention') + '">@ ' + (l === 'tr' ? 'Bahset' : 'Mention') + '</button>';

  container.insertBefore(tb, textarea);

  tb.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var act = btn.getAttribute('data-act');
    var start = textarea.selectionStart, end = textarea.selectionEnd;
    var val = textarea.value;
    var sel = val.substring(start, end);
    var insert = '';

    if (act === 'quote') insert = '\n> Alıntı: "' + (sel || (l === 'tr' ? 'Çelik boyun eğmez...' : 'Words of canon...')) + '"\n';
    else if (act === 'spoiler') insert = '||' + (sel || (l === 'tr' ? 'Gizli spoiler metni...' : 'Hidden spoiler...')) + '||';
    else if (act === 'ref') insert = '[Bölüm 1, Paragraf 4] ';
    else if (act === 'bold') insert = '**' + (sel || (l === 'tr' ? 'Vurgulu kelam' : 'Important text')) + '**';
    else if (act === 'mention') insert = '@craesx ';

    textarea.value = val.substring(0, start) + insert + val.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + insert.length, start + insert.length);
  });
}

/* ── ANLIK BİLDİRİMLER & BAHSETMELER (@Mention) ────────────────── */
var Notifications = (function () {
  var KEY = 'sw-notifications-v1';

  var DEFAULT_NOTIFS = [
    {
      id: 'nt-1',
      icon: '🔮',
      text_tr: 'Kehanetin doğrulandı! "Zeandor’un Taşıdığı Yadigâr Kılıç" teorin yazar tarafından resmî Kâhin mührü aldı.',
      text_en: 'Prophecy verified! Your theory on Zeandor’s Heirloom Blade was canonized by the Chronicler.',
      link: 'forum-konu.html?id=f-teori-1',
      time_tr: '1 saat önce',
      time_en: '1h ago',
      read: false
    },
    {
      id: 'nt-2',
      icon: '⚔️',
      text_tr: '@DengeHakimi bir müzakerede senden bahsetti: "KS 0 Anlaşması müzakeresindeki tespitine katılıyorum..."',
      text_en: '@DengeHakimi mentioned you: "I agree with your deduction on the KS 0 Accord..."',
      link: 'forum-konu.html?id=f-denge-1',
      time_tr: '3 saat önce',
      time_en: '3h ago',
      read: false
    },
    {
      id: 'nt-3',
      icon: '👑',
      text_tr: 'Hanen Stallhart haftalık Taht Mücadelesi liderliğini 4.820 şan puanı ile koruyor!',
      text_en: 'Your House Stallhart holds the lead in the Throne Contest with 4,820 renown!',
      link: 'forum.html',
      time_tr: '1 gün önce',
      time_en: '1d ago',
      read: true
    }
  ];

  function get() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return DEFAULT_NOTIFS;
  }

  function save(arr) {
    try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (e) {}
  }

  function unreadCount() {
    return get().filter(function (n) { return !n.read; }).length;
  }

  function markRead(id) {
    var arr = get().map(function (n) {
      if (n.id === id) n.read = true;
      return n;
    });
    save(arr);
  }

  function markAllRead() {
    var arr = get().map(function (n) { n.read = true; return n; });
    save(arr);
  }

  function renderDropdown(container, l) {
    if (!container) return;
    var list = get();
    var unread = unreadCount();

    container.innerHTML =
      '<div class="sw-notif-wrap">' +
        '<button type="button" class="sw-notif-bell-btn" id="sw-notif-trigger" title="' + (l === 'tr' ? 'Kurultay Bildirimleri & Bahsetmeler' : 'Assembly Notifications') + '">' +
          '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' +
          (unread > 0 ? '<span class="sw-notif-counter">' + unread + '</span>' : '') +
        '</button>' +
        '<div class="sw-notif-panel" id="sw-notif-panel" hidden>' +
          '<div class="sw-notif-head">' +
            '<h4>⚔️ ' + (l === 'tr' ? 'Meclis Fermanları & Bahsetmeler' : 'Notices & Mentions') + '</h4>' +
            '<button type="button" class="sw-notif-clear-btn" id="sw-notif-mark-all">' + (l === 'tr' ? 'Tümünü Oku' : 'Mark all read') + '</button>' +
          '</div>' +
          '<div class="sw-notif-body">' +
            list.map(function (item) {
              return '<a class="sw-notif-item' + (!item.read ? ' unread' : '') + '" href="' + esc(item.link) + '" data-notif-id="' + esc(item.id) + '">' +
                '<span class="sw-notif-ic">' + item.icon + '</span>' +
                '<div class="sw-notif-txt">' +
                  '<p>' + esc(l === 'tr' ? item.text_tr : item.text_en) + '</p>' +
                  '<small>' + esc(l === 'tr' ? item.time_tr : item.time_en) + '</small>' +
                '</div>' +
              '</a>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>';

    var trigger = container.querySelector('#sw-notif-trigger');
    var panel = container.querySelector('#sw-notif-panel');
    var markAll = container.querySelector('#sw-notif-mark-all');

    if (trigger && panel) {
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        panel.hidden = !panel.hidden;
      });
      document.addEventListener('click', function (e) {
        if (!container.contains(e.target)) panel.hidden = true;
      });
    }

    if (markAll) {
      markAll.addEventListener('click', function (e) {
        e.stopPropagation();
        markAllRead();
        renderDropdown(container, l);
      });
    }

    container.querySelectorAll('[data-notif-id]').forEach(function (el) {
      el.addEventListener('click', function () {
        var nid = el.getAttribute('data-notif-id');
        markRead(nid);
      });
    });
  }

  return { get: get, unreadCount: unreadCount, markRead: markRead, markAllRead: markAllRead, renderDropdown: renderDropdown };
})();

/* ── VERİ ERİŞİMİ ──────────────────────────────────────────────── */
async function fetchCategories() {
  if (catCache) return catCache;
  if (!C || !C.enabled) return (catCache = FALLBACK_CATS);
  try {
    var client = await C.getClient();
    var res = await client.from('forum_categories').select('*').order('sort_order');
    if (res.error || !res.data || !res.data.length) return (catCache = FALLBACK_CATS);
    return (catCache = res.data);
  } catch (e) { return (catCache = FALLBACK_CATS); }
}

async function fetchThreads(opts) {
  opts = opts || {};
  if (!C || !C.enabled) return filterFallback(opts);
  try {
    var client = await C.getClient();
    var q = client.from('forum_threads').select('*, profiles(username,avatar,favorite_house,title)', { count: 'exact' }).eq('is_deleted', false);
    if (opts.categoryId) q = q.eq('category_id', opts.categoryId);
    if (opts.pinnedOnly) q = q.eq('is_pinned', true);
    if (opts.search) q = q.ilike('title', '%' + opts.search.replace(/[%_]/g, '') + '%');
    var sortCol = opts.sort === 'cevap' ? 'reply_count' : opts.sort === 'goruntulenme' ? 'view_count' : 'last_activity_at';
    q = q.order('is_pinned', { ascending: false }).order(sortCol, { ascending: false });
    var from = (opts.page || 0) * (opts.pageSize || 20);
    q = q.range(from, from + (opts.pageSize || 20) - 1);
    var res = await q;
    if (res.error) throw res.error;
    return { rows: res.data || [], count: res.count };
  } catch (e) { return filterFallback(opts); }
}

function getLocalThreads() {
  try { return JSON.parse(localStorage.getItem('sw-local-threads') || '[]'); } catch (e) { return []; }
}
function saveLocalThreads(arr) {
  try { localStorage.setItem('sw-local-threads', JSON.stringify(arr)); } catch (e) {}
}

function filterFallback(opts) {
  var localRows = getLocalThreads();
  var rows = localRows.concat(FALLBACK_THREADS.slice());
  if (opts.categoryId) rows = rows.filter(function (t) { return t.category_id === opts.categoryId; });
  if (opts.pinnedOnly) rows = rows.filter(function (t) { return t.is_pinned; });
  if (opts.canonOnly) rows = rows.filter(function (t) { return !!t.is_canonized; });
  if (opts.pollOnly) rows = rows.filter(function (t) { return !!t.poll; });
  if (opts.amaOnly) rows = rows.filter(function (t) { return t.category_id === 'yazar-divani' || !!t.author_reply || !!t.is_author_ama; });
  if (opts.noSpoiler) rows = rows.filter(function (t) { return (t.title || '').indexOf('[SPOILER]') === -1 && (t.body || '').indexOf('||') === -1; });
  if (opts.houseFilter) rows = rows.filter(function (t) { return t.profiles && t.profiles.favorite_house === opts.houseFilter; });
  if (opts.search) {
    var q = opts.search.toLowerCase();
    rows = rows.filter(function (t) {
      return (t.title || '').toLowerCase().indexOf(q) >= 0 ||
        ((t.title_en || '')).toLowerCase().indexOf(q) >= 0 ||
        ((t.body || '')).toLowerCase().indexOf(q) >= 0 ||
        (t.profiles && (t.profiles.username || '').toLowerCase().indexOf(q) >= 0);
    });
  }
  var key = opts.sort === 'cevap' ? 'reply_count' : opts.sort === 'goruntulenme' ? 'view_count' : 'last_activity_at';
  rows.sort(function (a, b) {
    if (a.is_pinned !== b.is_pinned) return b.is_pinned - a.is_pinned;
    return (a[key] < b[key]) ? 1 : -1;
  });
  return { rows: rows, count: rows.length };
}

async function fetchThread(id) {
  var localMatch = getLocalThreads().filter(function (t) { return t.id === id; })[0];
  if (localMatch) return localMatch;

  if (!C || !C.enabled) {
    var f = FALLBACK_THREADS.filter(function (t) { return t.id === id; })[0];
    return f || null;
  }
  try {
    var client = await C.getClient();
    var res = await client.from('forum_threads').select('*, profiles(username,avatar,favorite_house,title)').eq('id', id).maybeSingle();
    if (res.error) throw res.error;
    return res.data;
  } catch (e) {
    var fb = FALLBACK_THREADS.filter(function (t) { return t.id === id; })[0];
    return fb || null;
  }
}

async function createThread(categoryId, title, body, extraOpts) {
  extraOpts = extraOpts || {};
  var user = Allegiance.get();
  if (!C || !C.enabled) {
    var newT = {
      id: 'local-' + Date.now(),
      category_id: categoryId,
      title: title,
      body: body,
      is_pinned: false,
      is_locked: false,
      is_canonized: !!extraOpts.isCanon,
      view_count: 1,
      reply_count: 0,
      reactions: { steel: 1, blood: 0, seal: 1, balance: 0 },
      last_activity_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      profiles: {
        username: user.username,
        avatar: user.avatar,
        favorite_house: user.favorite_house,
        title: user.title
      }
    };
    if (extraOpts.poll && extraOpts.poll.question && extraOpts.poll.options && extraOpts.poll.options.length) {
      newT.poll = {
        id: 'poll-' + newT.id,
        question: extraOpts.poll.question,
        options: extraOpts.poll.options.map(function (optText, idx) {
          return { id: 'opt-' + (idx + 1), text: optText, votes: 0 };
        })
      };
    }
    var localList = getLocalThreads();
    localList.unshift(newT);
    saveLocalThreads(localList);
    FALLBACK_THREADS.unshift(newT);
    Allegiance.set({ thread_count: (user.thread_count || 0) + 1 });
    addFactionPoints(user.favorite_house || 'stallhart', 20);
    return newT;
  }
  var client = await C.getClient();
  var st = C.getState();
  var res = await client.from('forum_threads')
    .insert({ category_id: categoryId, user_id: st.user.id, title: title, body: body })
    .select().single();
  if (res.error) throw res.error;
  return res.data;
}

async function setFlag(id, field, value) {
  if (!C || !C.enabled) return;
  var client = await C.getClient();
  var fn = field === 'pin' ? 'kurultay_set_pin' : 'kurultay_set_lock';
  var arg = field === 'pin' ? { p_id: id, p_pinned: value } : { p_id: id, p_locked: value };
  var res = await client.rpc(fn, arg);
  if (res.error) throw res.error;
}

async function deleteThread(id, purge) {
  if (!C || !C.enabled) {
    FALLBACK_THREADS = FALLBACK_THREADS.filter(function (t) { return t.id !== id; });
    return true;
  }
  var client = await C.getClient();
  var res = await client.rpc('kurultay_delete_thread', { p_id: id, p_purge: !!purge });
  if (res.error) throw res.error;
  return res.data;
}

function bumpView(id) {
  if (!C || !C.enabled) return;
  C.getClient().then(function (client) { client.rpc('kurultay_bump_view', { p_id: id }); }).catch(function () {});
}

async function fetchStats() {
  if (!C || !C.enabled) {
    var threads = FALLBACK_THREADS.length;
    var posts = FALLBACK_THREADS.reduce(function (s, t) { return s + (t.reply_count || 0); }, 0);
    return { threads: threads + 120, posts: posts + 1450 };
  }
  try {
    var client = await C.getClient();
    var res = await client.rpc('kurultay_stats').maybeSingle();
    if (res.error || !res.data) throw res.error || new Error('no data');
    return { threads: Number(res.data.threads) || 0, posts: Number(res.data.posts) || 0 };
  } catch (e) { return { threads: 840, posts: 3950 }; }
}

/* ── OKUNDU / BİLDİRİM ─────────────────────────────────────────── */
var READ_KEY = 'kurultay-read-v2';
function readMap() { try { return JSON.parse(localStorage.getItem(READ_KEY) || '{}'); } catch (e) { return {}; } }
function isUnread(thread) {
  var seen = readMap()[thread.id];
  if (!seen) return true;
  return new Date(thread.last_activity_at).getTime() > seen;
}
function markRead(threadId) {
  try {
    var m = readMap(); m[threadId] = Date.now();
    var keys = Object.keys(m);
    if (keys.length > 400) { keys.sort(function (a, b) { return m[a] - m[b]; }).slice(0, keys.length - 400).forEach(function (k) { delete m[k]; }); }
    localStorage.setItem(READ_KEY, JSON.stringify(m));
  } catch (e) {}
}
function updateNavBadge(rows) {
  var has = (rows || []).some(isUnread);
  try { localStorage.setItem('kurultay-unread', has ? '1' : ''); } catch (e) {}
  var dot = document.querySelector('.nav-links a[data-page="forum.html"] .kurultay-dot');
  var link = document.querySelector('.nav-links a[data-page="forum.html"]');
  if (link && !dot && has) link.insertAdjacentHTML('beforeend', '<i class="kurultay-dot" aria-hidden="true"></i>');
  if (dot && !has) dot.remove();
}

/* ── BİÇİMLEME VE HTML ÜRETİCİLERİ ─────────────────────────────── */
function catLabel(cat, l) { return cat ? (l === 'tr' ? cat.name_tr : cat.name_en) : ''; }
function catById(id) { return (catCache || FALLBACK_CATS).filter(function (c) { return c.id === id; })[0]; }

/* Konu Satırı: dark fantasy parşömen satırı + yazar rozeti + kehanet/anket mühürleri */
function threadRowHTML(t, l, opts) {
  opts = opts || {};
  var cat = catById(t.category_id);
  var prof = t.profiles || { username: 'Bilinmeyen Okur', avatar: 'sword', favorite_house: 'stallhart' };
  var unread = isUnread(t);
  var timeAgo = C ? C.util.timeAgo(t.last_activity_at) : (l === 'tr' ? 'az önce' : 'just now');

  var houseBadge = '';
  if (prof.favorite_house && C && C.util && C.util.crestBadge) {
    houseBadge = C.util.crestBadge(prof.favorite_house, { showMotto: false });
  } else if (prof.favorite_house) {
    houseBadge = '<span class="sw-house-badge mini"><span class="sw-hb-name">' + esc(prof.favorite_house) + '</span></span>';
  }

  var authorTitle = prof.title ? '<span class="ft-author-title"> · ' + esc(prof.title) + '</span>' : '';
  var rx = t.reactions || { steel: 0, blood: 0, seal: 0, balance: 0 };
  var rxTotal = (rx.steel || 0) + (rx.blood || 0) + (rx.seal || 0) + (rx.balance || 0);

  return '<a class="ft-row' + (unread ? ' ft-unread' : '') + (t.is_pinned ? ' ft-pinned-row' : '') + (t.is_canonized ? ' ft-canonized-row' : '') + '" href="forum-konu.html?id=' + esc(t.id) + '">' +
    '<span class="ft-av-wrap">' + (C ? C.util.avatarHTML(prof, 'sm') : '<span class="sw-av sm">' + esc(prof.username.charAt(0)) + '</span>') + '</span>' +
    '<span class="ft-main">' +
      '<span class="ft-title">' +
        (unread ? '<i class="ft-dot" title="' + (l === 'tr' ? 'Okunmadı' : 'Unread') + '"></i>' : '') +
        (t.is_pinned ? '<span class="ft-pin-pill"><svg viewBox="0 0 24 24"><path d="M12 2l1.5 5.5L19 9l-4.5 3L16 18l-4-3-4 3 1.5-6L5 9l5.5-1.5z"/></svg>' + (l === 'tr' ? 'Ferman' : 'Decree') + '</span>' : '') +
        (t.is_canonized ? '<span class="ft-canon-pill" title="' + (l === 'tr' ? 'Yazar tarafından doğrulanmış kanon teori' : 'Verified canon theory') + '">🔮 ' + (l === 'tr' ? 'Doğrulanan Kehanet' : 'Canonized') + '</span>' : '') +
        (t.author_reply ? '<span class="ft-poll-pill" style="border-color:var(--gold);color:var(--gold);background:rgba(196,150,42,.15)">👑 ' + (l === 'tr' ? 'Yazar Yanıtı' : 'Author Reply') + '</span>' : '') +
        (t.poll ? '<span class="ft-poll-pill">📊 ' + (l === 'tr' ? 'Anket' : 'Poll') + '</span>' : '') +
        (t.is_locked ? '<svg class="ft-lock-i" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>' : '') +
        '<span class="ft-title-text">' + esc(l === 'tr' ? t.title : (t.title_en || t.title)) + '</span>' +
        (opts.showCat !== false && cat ? '<span class="ft-tag ' + esc(t.category_id) + '">' + esc(catLabel(cat, l)) + '</span>' : '') +
      '</span>' +
      '<span class="ft-sub">' +
        (l === 'tr' ? 'Açan: ' : 'by: ') + '<b>' + esc(prof.username) + '</b>' + authorTitle + ' ' + houseBadge +
        (rxTotal > 0 ? '<span class="ft-rx-preview">⚔️' + (rx.steel||0) + ' 🩸' + (rx.blood||0) + ' 📜' + (rx.seal||0) + '</span>' : '') +
      '</span>' +
    '</span>' +
    '<span class="ft-stats">' +
      '<span class="ft-stat-num">' + (t.reply_count || 0) + '</span>' +
      '<small>' + (l === 'tr' ? 'cevap' : 'replies') + '</small>' +
    '</span>' +
    '<span class="ft-stats">' +
      '<span class="ft-stat-num">' + (t.view_count || 0) + '</span>' +
      '<small>' + (l === 'tr' ? 'görüntü' : 'views') + '</small>' +
    '</span>' +
    '<span class="ft-last">' +
      '<span class="ft-last-lbl">' + (l === 'tr' ? 'Son Etkinlik' : 'Last Activity') + '</span>' +
      '<span class="ft-last-time">' + timeAgo + '</span>' +
    '</span>' +
  '</a>';
}

/* Modern Grid Kategori Kartı: Dark Fantasy Parchment Estetiği */
function categoryCardHTML(c, l, threadSummary) {
  var iconSvg = ICONS[c.icon] || ICONS.denge;
  var threadCount = c.thread_count || 12;
  var postCount = c.post_count || (threadCount * 4 + 18);

  return '<a class="fc fc-' + esc(c.id) + '" href="forum-kategori.html?kat=' + esc(c.id) + '">' +
    '<div class="fc-filigree-top"></div>' +
    (c.is_locked ? '<span class="fc-lock" title="' + (l === 'tr' ? 'Yalnızca Vakanüvis yazabilir' : 'Chroniclers only') + '"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span>' : '') +
    '<div class="fc-top">' +
      '<span class="fc-ic"><svg viewBox="0 0 24 24">' + iconSvg + '</svg></span>' +
      '<div class="fc-counts">' +
        '<span class="fc-count-pill"><b>' + threadCount + '</b> ' + (l === 'tr' ? 'Konu' : 'Topics') + '</span>' +
        '<span class="fc-count-pill muted"><b>' + postCount + '</b> ' + (l === 'tr' ? 'Mesaj' : 'Posts') + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="fc-body">' +
      '<h3 class="fc-name">' + esc(catLabel(c, l)) + '</h3>' +
      '<p class="fc-desc">' + esc(l === 'tr' ? c.desc_tr : c.desc_en) + '</p>' +
    '</div>' +
    '<div class="fc-footer">' +
      '<span class="fc-cta">' + (l === 'tr' ? 'Tartışmalara Gir →' : 'Enter Chamber →') + '</span>' +
      '<span class="fc-watermark">' + esc(c.id.toUpperCase()) + '</span>' +
    '</div>' +
  '</a>';
}

/* ── KULLANICI KARTI ÜRETİCİSİ (Profil & İlerleme & Madalyon Vitrini) ── */
function renderUserCard(container, l) {
  if (!container) return;
  var user = Allegiance.get();
  var houseName = user.favorite_house || 'stallhart';
  var prog = getUserProgression(user);

  var badgeHTML = '';
  if (C && C.util && C.util.crestBadge) {
    badgeHTML = C.util.crestBadge(houseName, { showMotto: true });
  } else {
    badgeHTML = '<span class="sw-house-badge"><span class="sw-crest-mini"></span><span class="sw-hb-name">' + esc(houseName.toUpperCase()) + '</span></span>';
  }

  var avHTML = C && C.util && C.util.avatarHTML
    ? C.util.avatarHTML(user, 'lg')
    : '<span class="sw-av lg"><span class="sw-av-ch">' + esc(user.username.charAt(0)) + '</span></span>';

  var medalsHTML = MEDALS.map(function (m) {
    var isUnlocked = prog.medals.indexOf(m.id) >= 0;
    var name = l === 'tr' ? m.name_tr : m.name_en;
    var desc = l === 'tr' ? m.desc_tr : m.desc_en;
    return '<span class="sw-medal-chip' + (isUnlocked ? ' unlocked' : ' locked') + '" title="' + esc(name + ': ' + desc) + '">' +
      '<span class="sw-md-icon">' + m.icon + '</span>' +
      '<small class="sw-md-lbl">' + esc(name) + '</small>' +
    '</span>';
  }).join('');

  var rankTitle = l === 'tr' ? prog.rank.title_tr : prog.rank.title_en;
  var nextTitle = prog.nextRank ? (l === 'tr' ? prog.nextRank.title_tr : prog.nextRank.title_en) : '';

  container.innerHTML =
    '<div class="fr-user-card">' +
      '<div class="fuc-banner" data-house="' + esc(houseName) + '">' +
        '<div class="fuc-crest-seal">' + prog.rank.icon + '</div>' +
        '<span class="fuc-status-tag">' + prog.rank.icon + ' ' + esc(rankTitle) + ' · Seviye ' + prog.rank.tier + '</span>' +
      '</div>' +
      '<div class="fuc-profile">' +
        '<div class="fuc-av-box">' + avHTML + '</div>' +
        '<div class="fuc-info">' +
          '<h3 class="fuc-name">' + esc(user.username) + '</h3>' +
          '<p class="fuc-title">' + esc(user.title || (l === 'tr' ? 'Denge Arayıcısı' : 'Seeker of Balance')) + '</p>' +
        '</div>' +
      '</div>' +

      /* İlerleme Çubuğu (XP / Level Progress) */
      '<div class="fuc-prog-box">' +
        '<div class="fuc-prog-head">' +
          '<span><b>' + prog.xp + '</b> XP</span>' +
          '<small>' + (prog.nextRank ? (l === 'tr' ? nextTitle + ' için ' + prog.neededXP + ' XP kaldı' : prog.neededXP + ' XP to ' + nextTitle) : (l === 'tr' ? 'En Yüksek Rütbe' : 'Max Rank')) + '</small>' +
        '</div>' +
        '<div class="fuc-prog-track">' +
          '<div class="fuc-prog-fill" style="width:' + prog.progressPct + '%"></div>' +
        '</div>' +
      '</div>' +

      '<div class="fuc-allegiance-box">' +
        '<div class="fuc-label">' + (l === 'tr' ? 'Bağlı Olduğu Hane Sancağı' : 'Sworn House Banner') + '</div>' +
        '<div class="fuc-badge-wrap">' + badgeHTML + '</div>' +
      '</div>' +

      '<div class="fuc-stats-grid">' +
        '<div class="fuc-stat">' +
          '<span class="fuc-stat-val">' + (user.seals || 185) + '</span>' +
          '<span class="fuc-stat-lbl">' + (l === 'tr' ? 'Mühür Şanı' : 'Seal Renown') + '</span>' +
        '</div>' +
        '<div class="fuc-stat">' +
          '<span class="fuc-stat-val">' + (user.thread_count || 4) + '</span>' +
          '<span class="fuc-stat-lbl">' + (l === 'tr' ? 'Konu' : 'Threads') + '</span>' +
        '</div>' +
        '<div class="fuc-stat">' +
          '<span class="fuc-stat-val">' + (user.reply_count || 26) + '</span>' +
          '<span class="fuc-stat-lbl">' + (l === 'tr' ? 'Kelam' : 'Posts') + '</span>' +
        '</div>' +
      '</div>' +

      /* Madalyon & Nişan Vitrini */
      '<div class="fuc-medals-box">' +
        '<div class="fuc-label">🎖️ ' + (l === 'tr' ? 'Okur Nişanları & Madalyonlar' : 'Reader Medallions & Honors') + '</div>' +
        '<div class="fuc-medals-grid">' + medalsHTML + '</div>' +
      '</div>' +

      '<div class="fuc-actions">' +
        '<button type="button" class="fuc-btn-pledge" id="fuc-pledge-btn">' +
          '<svg viewBox="0 0 24 24"><path d="M12 2l8 4v6c0 5.5-3.5 10-8 11-4.5-1-8-5.5-8-11V6l8-4z"/></svg>' +
          '<span>' + (l === 'tr' ? 'Sancak Değiştir / Tarafını Seç' : 'Pledge Allegiance') + '</span>' +
        '</button>' +
      '</div>' +
    '</div>';

  var btn = container.querySelector('#fuc-pledge-btn');
  if (btn) {
    btn.addEventListener('click', function () {
      openPledgeModal(function () {
        renderUserCard(container, l);
        var fSlot = document.getElementById('fr-faction-slot');
        if (fSlot) renderFactionLeaderboardWidget(fSlot, l);
        if (window.renderAll) window.renderAll();
      });
    });
  }
}

/* ── SANCAK SEÇİM MODALI (Tarafını Seç / Pledge Allegiance) ────── */
async function openPledgeModal(onPledged) {
  var l = W.Lang.get();
  var housesData = null;
  try {
    housesData = await W.loadData('houses.json');
  } catch (e) {
    housesData = { provinces: [] };
  }

  var housesList = [];
  (housesData.provinces || []).forEach(function (pr) {
    (pr.houses || []).forEach(function (h) {
      housesList.push({
        id: h.id,
        name: h.name,
        meaning: W.Lang.t(h.meaning),
        motto: W.Lang.t(h.motto) || (h.desc && W.Lang.t(h.desc).substring(0, 40)),
        colors: h.colors || ['#606060', '#c4962a'],
        province: W.Lang.t(pr.name)
      });
    });
  });

  if (!housesList.length) {
    housesList = [
      { id: 'stallhart', name: 'Stallhart', meaning: 'Çelik Yüreği', motto: 'Çelik ve Kan', colors: ['#606060', '#C4962A'], province: 'Başsancak' },
      { id: 'arhan', name: 'Arhan', meaning: 'Kadim Ocak', motto: 'Küllerden Doğan', colors: ['#8B1E1E', '#D4AF37'], province: 'Batı Eyaleti' },
      { id: 'selya', name: 'Selya', meaning: 'Deniz Fırtınası', motto: 'Dalgalar Boyun Eğmez', colors: ['#1B3B6F', '#64B5F6'], province: 'Limanlar' },
      { id: 'demir-ada', name: 'Demir Ada', meaning: 'Yıkılmaz Kaya', motto: 'Kırılırız ama Eğilmeyiz', colors: ['#2F3E46', '#84A98C'], province: 'Adalar' }
    ];
  }

  var cur = Allegiance.get();

  var cardsHTML = housesList.map(function (h) {
    var isSelected = cur.favorite_house === h.id;
    var c1 = h.colors[0] || '#444';
    var c2 = h.colors[1] || c1;
    return '<button type="button" class="sw-pledge-card' + (isSelected ? ' selected' : '') + '" data-house-id="' + esc(h.id) + '">' +
      '<div class="spc-banner" style="background: linear-gradient(135deg, ' + esc(c1) + ', ' + esc(c2) + ');">' +
        '<span class="spc-glyph">' + esc(h.name.charAt(0)) + '</span>' +
      '</div>' +
      '<div class="spc-info">' +
        '<div class="spc-name">' + esc(h.name) + ' <small>(' + esc(h.meaning) + ')</small></div>' +
        '<div class="spc-motto">“' + esc(h.motto || 'Sadakat ve Onur') + '”</div>' +
        '<div class="spc-prov">🏰 ' + esc(h.province) + '</div>' +
      '</div>' +
      (isSelected ? '<span class="spc-active-check">✓ ' + (l === 'tr' ? 'Seçili' : 'Sworn') + '</span>' : '') +
    '</button>';
  }).join('');

  var modalHTML =
    '<div class="sw-pledge-modal">' +
      '<h2 class="sw-h">⚔ ' + (l === 'tr' ? 'Hanedan Sancağını Seç' : 'Pledge Your Allegiance') + '</h2>' +
      '<p class="sw-sub">' + (l === 'tr' ? 'Stallhart evreninde hangi hanenin onurunu savunuyorsun? Seçtiğin sancak, Kurultay’daki tüm müzakere ve yorumlarında isminin yanında gururla dalgalanacak.' : 'Choose the great house whose banner you champion across all Kurultay chambers and discussions.') + '</p>' +
      '<div class="sw-pledge-grid">' + cardsHTML + '</div>' +
      '<div class="sw-actions" style="margin-top:1.5rem">' +
        '<button type="button" class="sw-btn" data-close>' + (l === 'tr' ? 'Vazgeç' : 'Cancel') + '</button>' +
      '</div>' +
    '</div>';

  var modalRec = null;
  if (C && C.util && C.util.Modal && C.util.Modal.open) {
    modalRec = C.util.Modal.open({
      title: l === 'tr' ? 'Sancak Seç' : 'Pledge Allegiance',
      cls: 'sw-pledge-dialog',
      html: modalHTML
    });
  } else {
    /* Fallback modal */
    var back = document.createElement('div');
    back.className = 'sw-modal-back';
    back.innerHTML = '<div class="sw-modal sw-pledge-dialog"><button type="button" class="sw-x" data-close>✕</button><div class="sw-modal-body">' + modalHTML + '</div></div>';
    document.body.appendChild(back);
    modalRec = {
      close: function () { back.remove(); }
    };
    back.addEventListener('click', function (e) {
      if (e.target === back || e.target.closest('[data-close]')) modalRec.close();
    });
  }

  var containerNode = document.querySelector('.sw-pledge-dialog .sw-pledge-grid');
  if (containerNode) {
    containerNode.addEventListener('click', async function (e) {
      var btn = e.target.closest('[data-house-id]');
      if (!btn) return;
      var hid = btn.getAttribute('data-house-id');
      await Allegiance.pledge(hid, 'Yeminli Sancaktar');
      modalRec.close();
      if (W.Toast && W.Toast.show) {
        W.Toast.show(l === 'tr' ? 'Sancak seçildi! Yemininiz Kurultay kütüğüne işlendi.' : 'Allegiance sworn! Your oath has been recorded.');
      }
      if (onPledged) onPledged(hid);
    });
  }
}

/* ── DIŞA AKTARIM ──────────────────────────────────────────────── */
window.Kurultay = {
  ICONS: ICONS,
  FALLBACK_CATS: FALLBACK_CATS,
  FALLBACK_THREADS: FALLBACK_THREADS,
  Allegiance: Allegiance,
  RANKS: RANKS,
  MEDALS: MEDALS,
  getUserProgression: getUserProgression,
  getFactionStandings: getFactionStandings,
  addFactionPoints: addFactionPoints,
  renderFactionLeaderboardWidget: renderFactionLeaderboardWidget,
  THEMATIC_REACTIONS: THEMATIC_REACTIONS,
  getThreadReactions: getThreadReactions,
  toggleReaction: toggleReaction,
  renderReactionsBar: renderReactionsBar,
  getPollData: getPollData,
  votePoll: votePoll,
  renderPollCard: renderPollCard,
  canonizeThread: canonizeThread,
  renderCanonBanner: renderCanonBanner,
  renderAuthorDecree: renderAuthorDecree,
  renderRichBody: renderRichBody,
  attachEditorToolbar: attachEditorToolbar,
  Notifications: Notifications,
  fetchCategories: fetchCategories,
  fetchThreads: fetchThreads,
  fetchThread: fetchThread,
  createThread: createThread,
  setFlag: setFlag,
  deleteThread: deleteThread,
  bumpView: bumpView,
  fetchStats: fetchStats,
  isUnread: isUnread,
  markRead: markRead,
  updateNavBadge: updateNavBadge,
  catLabel: catLabel,
  catById: catById,
  threadRowHTML: threadRowHTML,
  categoryCardHTML: categoryCardHTML,
  renderUserCard: renderUserCard,
  openPledgeModal: openPledgeModal
};

})();
