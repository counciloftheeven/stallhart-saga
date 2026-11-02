/* ============================================================
   STALLHART DESTANI — KURULTAY BAŞLANGIÇ İÇERİĞİ (İki dilli)
   Forumu canlı göstermek için örnek okur konuları, yanıtlar ve anketler.
   Kullanım: kurultay.js'ten ÖNCE yüklenir; kurultay.js bu diziyi
   FALLBACK_THREADS içine ekler. Alanlar title/title_en, body/body_en,
   replies[].body/body_en biçimindedir. Gerçek (Supabase) veriyle
   çakışmaz: id'ler "x-" önekiyle başlar.
   ============================================================ */
(function () {
  'use strict';
  function ago(h) { return new Date(Date.now() - h * 3600000).toISOString(); }

  /* Yeni takma adlar → profil (avatar: shield|eye|sword|quill|moon|scroll|crown|flame) */
  var U = {
    'MaviKalemYildiz':   { avatar: 'quill',  favorite_house: 'selya',     title: 'Usta Kâtip' },
    'DemirKadin_Zeynep': { avatar: 'shield', favorite_house: 'demir-ada', title: 'Yeminli Şövalye' },
    'TaslarinFisildayani': { avatar: 'eye',  favorite_house: 'arhan',     title: 'Kadim Kâhin' },
    'VakanuvisCemre':    { avatar: 'scroll', favorite_house: 'stallhart', title: 'Kadim Vakanüvis' },
    'GalethaMadencisi':  { avatar: 'flame',  favorite_house: 'karatas',   title: 'Gezgin' },
    'LoreAvcisi_Tuna':   { avatar: 'eye',    favorite_house: 'selya',     title: 'Arşivci' },
    'SolgarinSesi':      { avatar: 'crown',  favorite_house: 'stallhart', title: 'Divan Üyesi' },
    'BozkurtEmre':       { avatar: 'sword',  favorite_house: 'demir-ada', title: 'Gezgin' },
    'HalcyonDeniz':      { avatar: 'moon',   favorite_house: 'selya',     title: 'Kâhin' },
    'KizilCayLejyoneri': { avatar: 'shield', favorite_house: 'stallhart', title: 'Yeminli Şövalye' },
    'NazliHanim_Okur':   { avatar: 'quill',  favorite_house: 'arhan',     title: 'Gezgin' },
    'GolgeKalem':        { avatar: 'eye',    favorite_house: 'arhan',     title: 'Arşivci' },
    'MeryenDostu':       { avatar: 'moon',   favorite_house: 'selya',     title: 'Gezgin' },
    'TavernaciOnur':     { avatar: 'flame',  favorite_house: 'demir-ada', title: 'Divan Üyesi' },
    'AtlasKesfi':        { avatar: 'scroll', favorite_house: 'karatas',   title: 'Arşivci' },
    'RunikDilbilimci':   { avatar: 'quill',  favorite_house: 'stallhart', title: 'Usta Kâtip' },
    'SessizTanik':       { avatar: 'eye',    favorite_house: 'stallhart', title: 'Kâhin' },
    'IlkAnneCocugu':     { avatar: 'moon',   favorite_house: 'karatas',   title: 'Kadim Kâhin' },
    'HudutBeyi_Kerem':   { avatar: 'sword',  favorite_house: 'stallhart', title: 'Yeminli Şövalye' },
    'ZeytinYagliDolma':  { avatar: 'flame',  favorite_house: 'selya',     title: 'Gezgin' },
    'ArathenCasusu_Ece': { avatar: 'eye',    favorite_house: 'arhan',     title: 'Kadim Vakanüvis' },
    'CirakYusuf':        { avatar: 'scroll', favorite_house: 'demir-ada', title: 'Gezgin' }
  };
  /* Mevcut örnek kullanıcılar (kurultay.js'teki ile aynı takma adlar) */
  var U0 = {
    'KaganDemir':        { avatar: 'sword',  favorite_house: 'demir-ada', title: 'Yeminli Şövalye' },
    'Althaea_Gözcüsü':   { avatar: 'scroll', favorite_house: 'selya',     title: 'Kadim Vakanüvis' },
    'ParşömenKurdu':     { avatar: 'quill',  favorite_house: 'arhan',     title: 'Arşivci' },
    'GezginBatu':        { avatar: 'moon',   favorite_house: 'karatas',   title: 'Gezgin' },
    'AylaGok':           { avatar: 'flame',  favorite_house: 'selya',     title: 'Divan Üyesi' },
    'DengeHakimi':       { avatar: 'crown',  favorite_house: 'stallhart', title: 'Divan Üyesi' },
    'KahinAlper':        { avatar: 'eye',    favorite_house: 'stallhart', title: 'Kâhin' },
    'GozcuSolmaz':       { avatar: 'shield', favorite_house: 'stallhart', title: 'Yeminli Şövalye' },
    'CizerMert':         { avatar: 'quill',  favorite_house: 'arhan',     title: 'Usta Kâtip' }
  };
  function P(name) {
    var p = U[name] || U0[name] || { avatar: 'initial', favorite_house: 'stallhart', title: 'Gezgin' };
    return { username: name, avatar: p.avatar, favorite_house: p.favorite_house, title: p.title };
  }

  /* Yanıt: R(kullanıcı, kaç saat önce, TR, EN, beğeni, [alt yanıtlar]) */
  function R(user, h, tr, en, likes, kids) {
    return { user: P(user), created_at: ago(h), body: tr, body_en: en, likes: likes || 0, replies: kids || [] };
  }
  function countAll(rs) { var n = 0; (rs || []).forEach(function (r) { n += 1 + countAll(r.replies); }); return n; }
  function lastAct(rs, fallback) {
    var t = fallback;
    (function w(a) { (a || []).forEach(function (r) { if (r.created_at > t) t = r.created_at; w(r.replies); }); })(rs);
    return t;
  }
  /* Konu: T(id, kategori, yazar, saat, başlık TR, EN, gövde TR, EN, görüntülenme, tepkiler, yanıtlar, anket, ekstra) */
  function T(id, cat, user, h, title, title_en, body, body_en, views, rx, replies, poll, extra) {
    var created = ago(h);
    var o = {
      id: id, category_id: cat, title: title, title_en: title_en, body: body, body_en: body_en,
      is_pinned: false, is_locked: false, view_count: views, reply_count: countAll(replies),
      last_activity_at: lastAct(replies, created), created_at: created,
      profiles: P(user), reactions: rx, replies: replies || []
    };
    if (poll) o.poll = poll;
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }
  function O(id, tr, en, votes) { return { id: id, text: tr, text_en: en, votes: votes }; }

  var S = [];

  /* ───────────────────────── DENGE KONSEYİ ───────────────────────── */
  S.push(T('x-denge-1', 'denge-konseyi', 'TaslarinFisildayani', 30,
    'Muhafız (Galdra) neden hiç cevap vermiyor? “Sonsuz Kalkan” aslında bir hapishane duvarı olabilir mi?',
    'Why does the Guardian (Galdra) never answer? Could the “Eternal Shield” actually be a prison wall?',
    'Dinler arşivinde Muhafız için şöyle yazıyor: “yalvarılan ama cevap alınamayan” tanrı. Yasak Parşömenler’de ise Konsey’in “denge meclisi değil, iki aşırı uca bölünmüş bir hapishane” olduğu söyleniyor.\n\nBence “tarafsız bekçi” rolü tam da bu yüzden var: Galdra korumuyor, **tutuyor**. İlk Koruyucu’nun “gardiyan” olması da buna uyuyor. Sizce?',
    'The religious archive describes the Guardian as the god “who is begged, yet never answers”. The Forbidden Scrolls, meanwhile, claim the Council was “not a council of balance, but a prison split between two extremes”.\n\nI think that is exactly why the “neutral watchman” role exists: Galdra does not protect, it **holds**. The First Protector being a “warden” fits that. Thoughts?',
    2140, { steel: 41, blood: 12, seal: 77, balance: 63 }, [
      R('LoreAvcisi_Tuna', 28, 'Güzel yakalama ama bir itirazım var: Resmî dinde Muhafız “zırh kuşanmadan önce yeminin konusu”. Askerler ona yemin ediyor, yani halk onu hapishane bekçisi değil siper olarak görüyor. Fark tam da burada: **halkın gördüğü ile gerçek** ayrı.',
        'Nice catch, but one objection: in the official faith the Guardian is the subject of the oath before donning armor. Soldiers swear by him, so people see him as a shield, not a jailer. That is the gap: **what people see vs. what is real**.', 33, [
          R('TaslarinFisildayani', 27, 'Haklısın, o yüzden “Büyük Yalan” kavramı bu kadar önemli. Rahipler Gerçek VI’da yalanı yazanlar zaten. Halk siper sanıyor çünkü öyle öğretildi.',
            'Fair, which is why the “Great Lie” matters so much. The priests who wrote it down are in Truth VI. People think it is a shield because that is what they were taught.', 18)
        ]),
      R('DengeHakimi', 25, 'Ben tam tersini düşünüyorum: Galdra tarafsız çünkü tanrılar arası savaşı **evrene sıçramadan** durdurmakla görevli. Hapishane değil, yangın duvarı.',
        'I think the opposite: Galdra is neutral because he is tasked with stopping the war between gods before it spills into the universe. Not a prison, a firewall.', 27),
      R('SessizTanik', 20, 'Yasak Parşömenler’e göre tanrılar zaten Mahşer Anahtarları’yla yok edilmiş. Yani Galdra cevap vermiyor çünkü **ortada cevap verecek biri yok**. En acı teori bu bence.',
        'According to the Forbidden Scrolls the gods were already destroyed with the Doom Keys. So Galdra does not answer because **there is nobody left to answer**. The saddest theory, in my opinion.', 52, [
          R('GezginBatu', 19, 'Bunu okuyunca Mabed’deki sabah çanları bir anda tüyler ürpertici geldi. Üç çan da boşluğa çalıyor demek.',
            'Reading this makes the morning bells at the Mabed suddenly chilling. Three bells ringing into the void.', 22),
          R('KahinAlper', 17, 'Ama dua edilmezse tanrılar zayıflar demiştik; çanlar çalmaya devam ediyorsa en azından “şekil” korunuyor. Mabed bir **ritüel kabuğu** artık.',
            'But we said gods weaken without prayer; if the bells keep ringing at least the “form” survives. The Mabed is a **ritual shell** now.', 14)
        ])
    ]));

  S.push(T('x-denge-2', 'denge-konseyi', 'LoreAvcisi_Tuna', 52,
    'On Beş Tanrı çift sistemi: Tufan–Mimar, Maraz–Hekim… Peki Saatçi’nin eşi Zeval neden bu kadar yalnız hissettiriyor?',
    'The Fifteen Gods and their pairs: Flood–Architect, Malady–Healer… Why does Zeval, the Clockmaker’s counterpart, feel so lonely?',
    'Çiftler: Zeval–Saatçi, İsyan–Hakim, Harp–Sükun, Desise–Bilge, Tufan–Mimar, Maraz–Hekim, İhtiras–Avcı; Muhafız tek başına.\n\nOrdo fraksiyonunda Hakim, Mimar ve Saatçi var; Kaos’ta Harp, İhtiras ve Desise. Ama **İsyan** ve **Zeval** ikisinin de dışında kalıyor. Bu iki tanrı kimin tarafında sizce?',
    'The pairs: Zeval–Clockmaker, Rebellion–Judge, War–Serenity, Guile–Sage, Flood–Architect, Malady–Healer, Lust–Hunter; the Guardian stands alone.\n\nThe Ordo faction has the Judge, the Architect and the Clockmaker; Chaos has War, Lust and Guile. But **Rebellion** and **Zeval** sit outside both. Whose side are those two on?',
    1650, { steel: 22, blood: 9, seal: 58, balance: 71 }, [
      R('DengeHakimi', 50, 'İsyan’ın resmî teolojide “gerekli ama tehlikeli” sayılması dikkat çekici. Bence İsyan Kaos’un değil, **Ordo’nun gölgesi**: her otorite kendi isyanını doğurur.',
        'Rebellion being deemed “necessary but dangerous” in official theology is telling. I think Rebellion is not Chaos’s but **Ordo’s shadow**: every authority breeds its own revolt.', 31),
      R('IlkAnneCocugu', 47, 'Zeval’i ben “sonu hatırlatan” olarak görüyorum. Saatçi hafızaya çeviriyor, Zeval ise **anlamsız son**un tanrısı. İntihar edenlerin onun lanetine uğradığına inanılması bile onu dışlanmış yapıyor.',
        'I see Zeval as the one who reminds of the end. The Clockmaker turns it into memory, but Zeval is the god of the **meaningless end**. Even the belief that suicides fall under his curse makes him an outcast.', 36, [
          R('MaviKalemYildiz', 46, 'Adını yazmadan önce kalemi kaldırıp beklemek detayı muazzam. Vakanüvislerin ritüeli dini kadar edebi de.',
            'The detail of chroniclers lifting the quill before writing his name is superb. The ritual is as literary as it is religious.', 19)
        ]),
      R('BozkurtEmre', 40, 'Hepsini bırakın, ben hâlâ İhtiras–Avcı çiftine takılıyorum. İmparator selamı Avcı’ya işaret ediyorsa **arzu ile otorite** aynı madalyonun yüzleri mi?',
        'Forget the rest, I am still stuck on the Lust–Hunter pair. If the imperial salute points to the Hunter, are **desire and authority** two faces of one coin?', 24)
    ]));

  S.push(T('x-denge-3', 'denge-konseyi', 'SessizTanik', 76,
    'Mahşer Mekanizması: İki anahtar gerçekten “aynı anda” mı çevrildi? Atlas ve Kum Saati üzerine kronoloji denemesi',
    'The Doom Mechanism: were the two keys truly turned “at the same time”? A chronology attempt on the Atlas and the Hourglass',
    '- Evren Atlası → zaman/mekân/bilgi anahtarı\n- Kozmik Kum Saati → denge/güç/inanç anahtarı\n\nResmî versiyon: tanrılar son çare olarak yarattı. Yasak versiyon: iki kardeş ele geçirip **tüm evrenin gözü önünde** çevirdi.\n\nSoru şu: Atlas’ı çalan Yok Edici’ydi, Kum Saati ise Yeni Koruyucu’nun elindeydi diye düşünüyorum. Yani iki kardeş “aynı ritüelde” buluşmak zorundaydı. Kaynaklarda dayanak var mı?',
    '- Universe Atlas → the time/space/knowledge key\n- Cosmic Hourglass → the balance/power/faith key\n\nOfficial version: the gods created it as a last resort. Forbidden version: the two brothers seized and turned it **before the eyes of the entire universe**.\n\nMy question: I think the Destroyer stole the Atlas while the Hourglass was with the New Protector, so the brothers had to meet in the “same ritual”. Is there any support in the sources?',
    1980, { steel: 30, blood: 14, seal: 89, balance: 45 }, [
      R('RunikDilbilimci', 70, 'Dilsel katkı: “Mahşer” kökünü Ortak Lisan’da arayınca doğrudan karşılık yok, ama **Gyan** (geri dönmek) ve **Zeth** (ölüm) birleşimi “geri dönen ölüm” gibi okunabilir. İsim muhtemelen Konsey tarafından değil sonradan konmuş.',
        'Linguistic note: searching for the root of “Doom” in the Common Tongue yields no direct match, but **Gyan** (to return) plus **Zeth** (death) reads like “returning death”. The name was probably coined later, not by the Council.', 44),
      R('VakanuvisCemre', 66, 'Kum Saati’nin üst haznesi Kaos’un siyah kumu, alt hazne Ordo’nun sarı kristalleri. Anahtar “denge tam ortadayken ya da tamamen bozulduğunda” ortaya çıkıyor. İkisi aynı anda çevrilmeden önce **denge bozulmuş olmalı** → İnsanın Son Savaşı.',
        'The upper chamber holds Chaos’s black sand, the lower Ordo’s yellow crystals. The key appears “when balance is exactly central or fully broken”. Before both turned, **balance must have shattered**, hence the Last War of Man.', 38),
      R('SessizTanik', 60, 'Cemre, bu çok iyi. Yani anahtar yalnızca bir kozmik hizalanmada belirebiliyor; savaş o hizalanmayı **zorla** üretmiş.',
        'Cemre, that is very good. So the key can only appear in one cosmic alignment; the war **forced** that alignment.', 21)
    ]));

  S.push(T('x-denge-4', 'denge-konseyi', 'ArathenCasusu_Ece', 120,
    'Arathen’in “Lidros zengin ile fakiri eşit tutar” ilkesi: Bir tanrı iki imparatorluğu nasıl ayrı yöne çeker?',
    'Arathen’s “Lidros holds rich and poor equal” principle: how does one god pull two empires in opposite directions?',
    'Stallhart’ta Hakim Lidros’un “terazisinde tüm kanlar eşit değil; Era’nın damlaları daha ağır basar” deniyor. Arathen aynı tanrıyı anayasal eşitlik için kullanıyor.\n\nBu yüzden Arathen’in her zaferi Stallhart köylüsüne bir fısıltı: “eşitlik mümkün”. Savaşın asıl cephesi ideolojik olabilir mi?',
    'In Stallhart, Judge Lidros’s scales are said to weigh “not all bloods equally; Era’s drops weigh heavier”. Arathen uses the same god for constitutional equality.\n\nThat is why every Arathen victory is a whisper to a Stallhart peasant: “equality is possible”. Could the real front be ideological?',
    1320, { steel: 25, blood: 33, seal: 47, balance: 52 }, [
      R('HudutBeyi_Kerem', 118, 'Memanth’te yıllarca sınırda yaşayan biri olarak şunu söyleyeyim: Arathen akıncıları Stallhart köylüsüne kılıçtan önce **hikâye** gönderiyor. Hem de yanlarında taşıdıkları hikâye bedava.',
        'As someone who lived years on the Memanth border: Arathen raiders send Stallhart peasants a **story** before a sword. And the story they carry is free.', 40),
      R('KizilCayLejyoneri', 112, 'Ama Leno Kridas’ın kuşatma topları için büyücülere başvurması Arathen’in “eşitlik” söylemini baltalıyor. Büyü Arathen’de farklı uygulanıyor diyorlar, yani **kendi yasaklarını esnetiyorlar**.',
        'But Leno Kridas turning to sorcerers for siege cannons undercuts Arathen’s “equality” talk. They say magic is treated differently in Arathen, so **they bend their own taboos**.', 29),
      R('ArathenCasusu_Ece', 105, 'İkiniz de haklısınız. Bence Arathen’in en büyük tehlikesi askeri gücü değil, **meşruiyet iddiasının çekiciliği**.',
        'You are both right. I think Arathen’s greatest danger is not military strength but the **appeal of its legitimacy claim**.', 26)
    ]));

  S.push(T('x-denge-5', 'denge-konseyi', 'GezginBatu', 200,
    'ANKET: Konsey’den tek bir tanrıya dua edebilseydiniz hangisi olurdu?',
    'POLL: If you could pray to only one god of the Council, which would it be?',
    'Resmî dua on beş tanrıya yapılıyor ama herkesin gizli bir favorisi var. Ben yolculuk öncesi hep Tufan’a adak bırakan bir denizci ailesinden geliyorum, dolayısıyla biraz taraflıyım. Siz hangisini seçerdiniz?\n\n*Gerekçenizi yazmayı unutmayın!*',
    'Official prayer goes to all fifteen gods, but everyone has a secret favorite. I come from a sailor family that always leaves an offering to the Flood before a voyage, so I am biased. Which would you pick?\n\n*Don’t forget to give your reasons!*',
    3120, { steel: 55, blood: 21, seal: 64, balance: 80 }, [
      R('HalcyonDeniz', 198, 'Hekim (Eanhar). Doğum odalarında en önce ona dua edildiğini okuyunca içim ısındı. Zeandor’un doğumunda Eadan’ın Selmira’yı kurtaramayışı hâlâ canımı yakıyor.',
        'The Healer (Eanhar). Learning that birthing rooms pray to him first warmed me. Eadan not being able to save Selmira at Zeandor’s birth still hurts.', 34),
      R('KaganDemir', 190, 'Mimar. Demir Ada’da her taş Brikon’un işaretini taşır. Kalıcı olan tek şey yapılan şeydir; **dua edilen değil, inşa edilen tanrı.**',
        'The Architect. In Demir Ada every stone bears Brikon’s mark. The only lasting thing is what is built; **the god of building, not of begging.**', 28),
      R('TavernaciOnur', 185, 'Sükun, hiç düşünmeden. Her akşam duası zaten ona. Taverna sahibi olarak diyorum: kavga çıkarken kimse Harp’a seslenmiyor, herkes sessizce Lomera’ya yalvarıyor 😄',
        'Serenity, no hesitation. The evening prayer is hers anyway. As a tavern keeper I say: when a brawl breaks out nobody calls on War, everyone quietly pleads to Lomera 😄', 47),
      R('GolgeKalem', 170, 'Desise’ye “açıkça” dua etmek şüpheyle karşılanıyor ama casuslar, aktörler, pazarcılar gayriresmî bağlı. Ben anketin dışında kalıp onu seçiyorum, sorun çıkarmazsınız umarım.',
        'Praying openly to Guile is met with suspicion, but spies, actors and market-sellers are unofficially bound to it. I am stepping outside the poll and choosing it, hope that is okay.', 31)
    ],
    { id: 'poll-denge-1',
      question: 'Konsey’den tek bir tanrıya dua edebilseydiniz hangisi olurdu?',
      question_en: 'If you could pray to only one god of the Council, which would it be?',
      options: [
        O('o1', 'Hekim (Eanhar) — Can Suyu', 'Healer (Eanhar) — Water of Life', 96),
        O('o2', 'Mimar (Brikon) — Temel İnşası', 'Architect (Brikon) — Foundation Builder', 74),
        O('o3', 'Sükun (Lomera) — İlahi Dinginlik', 'Serenity (Lomera) — Divine Stillness', 121),
        O('o4', 'Bilge (Veleris) — Bilginin Işığı', 'Sage (Veleris) — Light of Knowledge', 88),
        O('o5', 'Desise (Lodvez) — Kandıran Zihin', 'Guile (Lodvez) — The Deceiving Mind', 52),
        O('o6', 'Tufan (Vazmer) — Denizin Gazabı', 'Flood (Vazmer) — Wrath of the Sea', 39)
      ] }));

  /* ───────────────────────── TEORİ KÖŞESİ ───────────────────────── */
  S.push(T('x-teori-1', 'teori', 'GolgeKalem', 40,
    'Erthan’ın “Getirdiler” repliği: Almonth gerçekten kimsesiz bir bebek mi buldu?',
    'Erthan’s “They brought you to us” line: did Almonth really find an unclaimed infant?',
    'Erthan’ın at ismi Doru, kılıcı Selrin, ve elimizde “zift karası saç” tasviri var ama hiçbir Stallhart’la birebir eşleşmiyor. Almonth’un tek kollu eski gazi olduğunu, Sarya’nın hiç konuşmayan sessizliğini ve “kâtip hatası” ile idam edilmesini yan yana koyunca kafamda şu senaryo oluşuyor:\n\nBaşsancak yakınlarında bir baskın, kundaktaki bir bebek, kayıtlara geçmeyen bir olay. Yıllar sonra biri o raporu karıştırınca Almonth’un adına takılıyor ve “hata” bir **kılıf** oluyor.\n\nKesin bir şey iddia etmiyorum; ama bu kadar tesadüf fazla.',
    'Erthan’s horse is Doru, his sword Selrin, and the description gives “pitch-black hair” that matches no Stallhart exactly. Put Almonth the one-armed veteran, Sarya’s silence, and an execution over a “clerk’s error” side by side, and a scenario forms:\n\nA raid near Başsancak, an infant in swaddling, an incident that never made the records. Years later someone digs up that report, finds Almonth’s name, and the “error” becomes a **pretext**.\n\nI claim nothing for sure, but that is too many coincidences.',
    4210, { steel: 52, blood: 61, seal: 134, balance: 36 }, [
      R('KahinAlper', 38, 'Bu teorinin güzel yanı kesin kanıtsız kalması. Bence Erthan’ın Stallhart olup olmadığı **asla** netleşmemeli; Zeandor’un kuzenini/kardeşini idam ettirmiş olma ihtimali bile başlı başına trajedi.',
        'The beauty of this theory is that it stays unproven. I think whether Erthan is a Stallhart should **never** be settled; even the chance that Zeandor executed his own cousin or brother is a tragedy in itself.', 58, [
          R('GolgeKalem', 37, 'Kesinlikle. Ve idam sahnesinde Zeandor bile bilmiyor olmalı. Okurun ürpertisi ikinci okumada gelsin.',
            'Absolutely. And Zeandor should not even know in the execution scene. Let the reader’s shiver come on a second read.', 32)
        ]),
      R('Althaea_Gözcüsü', 35, 'Karşı argüman: Erthan Liandryl varisi olarak anılıyor ve Lord Liandryl Galetsha/Çukurtepe’nin katledilen lordu. Zaten kanı soylu. Neden bir Stallhart bebeği gereksin ki?',
        'Counter-argument: Erthan is referred to as the Liandryl heir, and Lord Liandryl was the slain lord of Galetsha/Çukurtepe. His blood is already noble. Why would he need to be a Stallhart baby?', 41, [
          R('NazliHanim_Okur', 33, 'Liandryl bölümünde Erthan’ın “köylü ve madenci koşullarında büyüdüğü” yazıyor. Yani soylu kanı sonradan dahil edilmiş olabilir; iki teori aslında çelişmiyor.',
            'The Liandryl entry says Erthan grew up in peasant and miner conditions. So the noble blood may have been added later; the two theories do not really conflict.', 27)
        ]),
      R('CirakYusuf', 28, 'Sarya’nın Selya Konağı’na sığınması da ilginç. Neden Selya? Orada bir koruyucu var da bizim bilmediğimiz bir sır mı saklıyor?',
        'Sarya taking shelter at the Selya Manor is interesting too. Why Selya? Is there a protector there hiding a secret we do not know?', 20)
    ]));

  S.push(T('x-teori-2', 'teori', 'ArathenCasusu_Ece', 90,
    'Arba İtrez aslında kim? “Dravor” isminin de bir kimlik katmanı olabilir mi?',
    'Who is Arba İtrez really? Could the name “Dravor” be yet another identity layer?',
    'Resmî bilgi: Yedi yaşında ailesini Stallhart sınır seferinde kaybetmiş bir Reth çocuğu, Kayalar Arası Mektep’te yetiştirilmiş, yaşlı İtrez çiftini **Solgun Sızı** ile öldürüp mirası devralmış.\n\nBen iki olasılık görüyorum:\n1. Gerçek İtrez çocuğu kaçırılıp Arathen’de büyütüldü, Dravor onun yerine “eğitildi”.\n2. Dravor’un kendisi Arathen’in çaldığı bir bebek; adını bile bilmiyor.\n\nEron Gjin’in “ailen” tehdidinin altında Tydor ve Elira’dan fazlası olabilir: **gerçek kimliğinin sırrı**.',
    'Official info: a Reth child who lost his family in a Stallhart border campaign at seven, trained at the School Among the Rocks, who killed the elderly İtrez couple with **Withering Ache** and took the inheritance.\n\nI see two possibilities:\n1. The real İtrez child was kidnapped and raised in Arathen; Dravor was “trained” to replace him.\n2. Dravor himself is a baby stolen by Arathen; he does not even know his name.\n\nEron Gjin’s threat over “your family” could cover more than Tydor and Elira: **the secret of his true identity**.',
    2680, { steel: 29, blood: 40, seal: 92, balance: 33 }, [
      R('LoreAvcisi_Tuna', 88, 'Albess’in idamı da bir sadakat testi olarak kurgulanmış. Yani Arba’nın kendi ustasını ihbar etmesi bir **vicdan sınavı**ydı. İkinci ihtimalde o test çok daha acımasız olur.',
        'Albess’s execution was staged as a loyalty test as well. Arba denouncing his own master was a **trial of conscience**. In the second possibility that test becomes far crueler.', 35),
      R('HudutBeyi_Kerem', 85, 'Soğukkanlı bir not: Reth çocuğu dediler; yani Arathen halkından. “Çaldığı” kimlik fikri ancak İtrez ailesini kapsar. Bence ikinci teori fazla romantik.',
        'A sober note: they said a Reth child, so from the Arathen people. The “stolen identity” idea only covers the İtrez family. I find the second theory too romantic.', 22, [
          R('ArathenCasusu_Ece', 84, 'Romantik olabilir ama “Eron kimdir, neden bu kadar emin?” sorusunu açıkta bırakıyor. Hikâye boşluğu seviyorum.',
            'Maybe romantic, but it leaves “who is Eron and why is he so sure?” open. I love a story gap.', 19)
        ])
    ]));

  S.push(T('x-teori-3', 'teori', 'VakanuvisCemre', 150,
    'Kara Delik Çağı: II. Remal, Rones Alvro ve Elron gerçekten tarihin “aradaki üç hükümdarı” mı, yoksa sonradan eklenmiş mi?',
    'The Black Hole Age: are II. Remal, Rones Alvro and Elron truly the “three rulers in between”, or later insertions?',
    'Resmî Kronolojik Tarihçe’de adları geçmiyor; yalnızca “Kara Delik Çağı” belgesinde var. Olmasalar Lunrye’nin ölümü (KS 1406) ile Imloth’un cülusu (KS 1451) arasında **45 yıllık açıklanamayan boşluk** kalıyor.\n\nBence üç hükümdar da gerçek ve resmî tarih onları kasıtlı sildi. Çünkü:\n- II. Remal’in ölümü rahip intikamı gibi sunuluyor.\n- Rones Alvro’nun “Hesap Fermanı” valileri korkuttu.\n- Elron’un taviz politikası Burria’yı kopardı.\n\nBunların hepsi **Stallhart’ın imajını bozan** olaylar.',
    'They are absent from the official Chronological History; they exist only in the “Black Hole Age” document. Without them, a **45-year unexplained gap** remains between Lunrye’s death (KS 1406) and Imloth’s accession (KS 1451).\n\nI believe all three were real and official history deliberately erased them, because:\n- II. Remal’s death reads like priestly revenge.\n- Rones Alvro’s “Edict of Accounts” frightened governors.\n- Elron’s concessions let Burria slip away.\n\nAll of these are events that **tarnish Stallhart’s image**.',
    2350, { steel: 38, blood: 17, seal: 101, balance: 49 }, [
      R('SolgarinSesi', 148, 'Rones’un ölümünde halkın üç gün yas tutması “sevilen hükümdar” imajı; ama Lougat Beyi’nin gizli notları başka bir tablo çiziyor. Resmî tarihin sildiği şey belki **hükümdarlar değil, bedelleri**.',
        'The people mourning Rones for three days is a “beloved ruler” image; but the Lord of Lougat’s secret notes paint another picture. Maybe what official history erased was **not the rulers but their costs**.', 45),
      R('KizilCayLejyoneri', 140, 'Elron’un sulh bahçesi imajı çok güzel kurgulanmış. Oğulları Imloth ve Amadon’un zıt yönde büyümesi de bu çürümenin sonucu: biri hareketsizliğe, diğeri talim meydanına kaçtı.',
        'Elron’s peace-garden image is beautifully crafted. His sons Imloth and Amadon growing in opposite directions is the result of this rot: one fled into inaction, the other into the drill yard.', 30),
      R('Althaea_Gözcüsü', 130, 'Küçük düzeltme: Elron’un saltanatı bir kaynakta 1441–1451, diğerinde 1441–1452. Bir yıllık fark yuvarlama olabilir ama bence **bir kış**ın hesabı verilmeli 😅',
        'Small correction: Elron’s reign is 1441–1451 in one source and 1441–1452 in another. The one-year gap may be rounding, but I think **one winter** needs accounting for 😅', 33)
    ]));

  S.push(T('x-teori-4', 'teori', 'IlkAnneCocugu', 210,
    'İlk Anne Kültü ve Edlas’ın “yasak” yeteneği: Arhan hanesinin kanında bastırılmış bir miras mı?',
    'The First Mother Cult and Edlas’s “forbidden” talent: a suppressed legacy in House Arhan’s blood?',
    'Edlas Loth/Khaan büyüsünü “amatörce öğrendi” deniyor ama Fihor’un ona karşı koruma içgüdüsü bu kadar güçlüyse belki doğuştan bir yetenek vardı. İlk Anne Kültü’nün sembolü üç yapraklı yonca ve ninnilerde saklı. Ben madenci ailemden o ninnileri duyarak büyüdüm; bu yüzden bu teoriye duygusal bakıyorum.\n\nSoru: Arhan hanesinde bir ninni ya da yonca motifi var mı? Fihor’un kitap sevgisine neden bu kadar kızdığını da buna bağlayabilir miyiz?',
    'Edlas is said to have “learned Loth/Khaan amateurishly”, but if Fihor’s urge to protect him is that strong, perhaps the talent was innate. The First Mother Cult’s symbol is the three-leaf clover, hidden in lullabies. I grew up hearing those lullabies in a miner family, so I look at this theory emotionally.\n\nQuestion: does House Arhan have any lullaby or clover motif? Could Fihor’s anger at his love of books be tied to this?',
    1790, { steel: 18, blood: 22, seal: 72, balance: 60 }, [
      R('GalethaMadencisi', 205, 'Galetsha madenlerinde derin damarlarda “Kadim İlimler”e ait mühürlü bir yapı fısıltısı var demişler. Arhan Galetsha hanesi. **Bu tesadüf değil.**',
        'It is whispered that deep in the Galetsha mines lies a sealed structure of the “Ancient Sciences”. House Arhan is a Galetsha house. **This is no coincidence.**', 49),
      R('TaslarinFisildayani', 198, 'Ve Edlas’ın sonu: Zeren’in ölümü, nekromansi, mor alev… Bu bir intikam değil **bir kuruma**: büyü ona bedelini yedirdi.',
        'And Edlas’s end: Zeren’s death, necromancy, violet flame… not revenge but **consumption**: the magic made him pay.', 37, [
          R('IlkAnneCocugu', 196, 'Dikkat edersen Khaan “ruhsal tüketim”, Loth ise “illüzyon tuzağı”. Edlas ikisinin arasında sıkışmış.',
            'Note that Khaan is “spiritual consumption” and Loth “illusion trap”. Edlas is stuck between the two.', 21)
        ]),
      R('BozkurtEmre', 180, 'Resmî din büyüyü “tüm insanlığı bir kez daha felakete sürükleme riski” olarak tanımlıyor. Edlas’ın trajedisini teolojik olarak temellendirmek için çok uygun bir çerçeve.',
        'Official religion defines magic as a “risk of dragging all humanity to catastrophe once more”. A very convenient frame to theologically ground Edlas’s tragedy.', 16)
    ]));

  S.push(T('x-teori-5', 'teori', 'DengeHakimi', 260,
    'ANKET: Gerçek Craes hikâyesinde en çok hangi karakter trajik? (Zean–Rion–Creas üçgeni)',
    'POLL: Which character is the most tragic in the True Craes story? (the Zean–Rion–Creas triangle)',
    'Yasak Parşömenler’deki hikâye: Kalbhor’un iki oğlu Creas ve Zean, Nýrdal’ın kayıp prensi Velmor (Rion) ile “üç kardeş” oluyor. Rion, Creas’ı sırtından bıçaklıyor: “Çünkü o benim kardeşim.” Zean uçurumdan düşüp tek gözünü kaybediyor, beş yıl sonra ağabeyinin kimliğiyle geri dönüyor.\n\nBen Rion’u seçtim çünkü ikinci kez bir aile kaybetmeyi göze alamayacak kadar yalnızdı. Siz?',
    'The story in the Forbidden Scrolls: Kalbhor’s two sons Creas and Zean become “three brothers” with Nýrdal’s lost prince Velmor (Rion). Rion stabs Creas in the back: “Because he is my brother.” Zean falls from a cliff, loses an eye, and returns five years later in his brother’s identity.\n\nI chose Rion because he was too lonely to risk losing a family a second time. You?',
    3560, { steel: 44, blood: 79, seal: 110, balance: 52 }, [
      R('NazliHanim_Okur', 258, 'Tyrae’yi hiç kimse konuşmuyor! İki adama aşık, birini seçip diğerini reddediyor, sonra kraliçeyle bir ittifak kuruyor ve sonunda hamile kalıyor. Bence en iyi yazılmış karakter o.',
        'Nobody talks about Tyrae! She loves two men, chooses one and rejects the other, forges an alliance with the queen, and ends up pregnant. I think she is the best-written character.', 56, [
          R('MaviKalemYildiz', 255, 'Hillith de aynı şekilde. İlk saniyede Zean’ın Creas olmadığını anlayan tek kişi. “Güç sende, otorite bende” pazarlığı olağanüstü.',
            'Hillith too. The only one who knows Zean is not Creas in the first second. The “power with you, authority with me” bargain is outstanding.', 42)
        ]),
      R('KaganDemir', 250, 'Seranth! Tek kolunu kaybetti, hayalet ağrılarla delirdi, kendini astı. Kardeşi tarafından kurtarılıp kardeşi yüzünden öldü.',
        'Seranth! He lost an arm, went mad from phantom pains, and hanged himself. Saved by his brother and ruined by his brother.', 30)
    ],
    { id: 'poll-teori-1',
      question: 'Gerçek Craes hikâyesinde en trajik karakter kim?',
      question_en: 'Who is the most tragic character in the True Craes story?',
      options: [
        O('o1', 'Rion / Velmor (iki ailesini de kaybeden)', 'Rion / Velmor (lost both his families)', 142),
        O('o2', 'Zean (kardeşinin gölgesinde)', 'Zean (in his brother’s shadow)', 97),
        O('o3', 'Creas (en güvendiği adam tarafından öldürülen)', 'Creas (killed by the man he trusted most)', 118),
        O('o4', 'Tyrae', 'Tyrae', 61),
        O('o5', 'Kral Seranth', 'King Seranth', 44)
      ] }));

  S.push(T('x-teori-6', 'teori', 'KahinAlper', 320,
    'Kör Yengeç kâhini: “Bir domuz tarafından deşileceksin” ifadesi hangi “domuz”u işaret ediyor?',
    'The Blind Crab seer: whom does “you will be gored by a boar” point to?',
    'Zeandor kehaneti reddediyor ama biz biliyoruz ki bu hikâyelerde kehanet reddedildikçe gerçekleşir. Adayları sıralayayım:\n\n1. **Baron Valer** (domuz gibi küçük gözler, oburluk) — ama zaten Erthan çevresinde.\n2. Bir **sancak**: bir hanenin sembolü domuz/yaban domuzu mu?\n3. Gerçek bir av sahnesi.\n\nLiaher’in kâhinden aldığı “dilsiz bir kara adam” kehaneti de var. İkisi aynı sahnede birleşirse müthiş olur.',
    'Zeandor rejects the prophecy, but we know that in such tales a prophecy comes true the more it is rejected. Let me list candidates:\n\n1. **Baron Valer** (small pig-like eyes, gluttony), but he is already tied to Erthan.\n2. A **banner**: is some house’s emblem a boar?\n3. An actual hunt scene.\n\nThere is also Liaher’s prophecy from the seer: “a mute black man”. If the two meet in one scene it would be fantastic.',
    2210, { steel: 46, blood: 28, seal: 83, balance: 31 }, [
      R('HalcyonDeniz', 318, 'Olinder’in av sahnesi yazılmış, orada Valen’e bilgelik dersi veriyor. Av sahnelerinin kanonda önemi büyük. II. Remal da av partisinde atından düşüp ölmüştü. **Av = ölüm.**',
        'Olinder’s hunting scene is written, where he teaches Valen wisdom. Hunting scenes matter in the canon. II. Remal also fell from his horse at a hunt and died. **Hunt = death.**', 61),
      R('LoreAvcisi_Tuna', 312, 'Avcı’nın (Raxes) imparator selamının tanrısı olması da detay. Domuz, Avcı’nın avı olabilir mi? Zeandor’un selamı Raxes’e işaret ederken… ironi.',
        'The Hunter (Raxes) being the god of the imperial salute is a detail. Could the boar be the Hunter’s prey? Zeandor’s salute points to Raxes while… irony.', 39),
      R('SessizTanik', 300, 'Ben Valer’i elerim. Fazla basit. Bu tür kehanetler hep **mecaz** çıkar.',
        'I rule Valer out. Too simple. Prophecies like this always turn out to be **metaphors**.', 27)
    ]));

  /* ───────────────────────── BÖLÜM YORUMLARI ───────────────────────── */
  S.push(T('x-bolum-1', 'bolum', 'MaviKalemYildiz', 18,
    '“Elçi” Bölümü: Selmira’nın doğumu ve Zeandor’un ilk nefesi — okurken tüylerim diken diken oldu',
    'Chapter “The Envoy”: Selmira’s labor and Zeandor’s first breath — it gave me chills',
    'Ebe Eadan’ın “Eanhar geri çevirmişti, Zeval talep etti” cümlesini okuyunca bir dakika durdum. Hekim ile Zeval arasında gidip gelen o saniyeleri o kadar iyi yazmışsınız ki. Zeandor’un doğumuyla annesinin ölümünün aynı anda olması bütün serinin **kader damgası**.\n\nSizin için bu bölümde en vurucu an neydi?',
    'I paused for a minute at midwife Eadan’s line “Eanhar had turned her away, Zeval claimed her”. The seconds oscillating between the Healer and Zeval are so well written. Zeandor’s birth coinciding with his mother’s death is the **mark of fate** on the whole series.\n\nWhat was the most striking moment for you in this chapter?',
    1540, { steel: 24, blood: 33, seal: 51, balance: 29 }, [
      R('HalcyonDeniz', 17, 'Benim için Dairin’in boynundaki muskayı tutup dua fısıldaması. Kimse onu görmüyor ama bebeğin çıkışını kolaylaştıran o. **Görünmeyen emek.**',
        'For me it was Dairin holding the amulet around her neck, whispering a prayer. Nobody sees her but she eases the baby out. **Invisible labor.**', 38),
      R('MeryenDostu', 15, 'Selmira’nın Imloth’a bile fikrini açıkça söyleyen güçlü bir kadın olduğunu bilmek, ölümünü daha da ağırlaştırıyor. İmparatoriçe Nadima I’le karşılaştırılması boşuna değil.',
        'Knowing Selmira was a strong woman who even told Imloth her mind makes her death heavier. Being compared to Empress Nadima I was no accident.', 25),
      R('GezginBatu', 12, 'Imloth’un sonradan şişmanlayıp kafasını kazıtması vicdan azabının görsel metaforu bence. Şaraba gömülen bir adam, yastıklar arasında kaybolan bir imparator.',
        'Imloth growing heavy and shaving his head is a visual metaphor for guilt, in my view. A man drowning in wine, an emperor lost among pillows.', 31, [
          R('MaviKalemYildiz', 11, 'Kesinlikle, “hastalandıkça iyice şişman” tasviri aslında **yas** tutmasının biçimi.',
            'Absolutely, the “grew heavier as he sickened” depiction is really the shape of his **mourning**.', 16)
        ])
    ]));

  S.push(T('x-bolum-2', 'bolum', 'KizilCayLejyoneri', 60,
    '“Duvar” ve “Tehdit” bölümleri: Divan toplantısındaki Merkos Dryme–Roya Tavyth sahnesi neden bu kadar gerilimli?',
    'The “Wall” and “Threat” chapters: why is the divan scene with Merkos Dryme and Roya Tavyth so tense?',
    'Doğu sınırından gelen raporlar, köylerin kaybolan halkı, “gözlerinde mavi alevler” olan Merkos… Dirdar Poenta ise durgun denizden hoşlanmayan bir kaptan. Bu toplantı sadece bir brifing değil, **imparatorluğun sinir sistemi** gibi.\n\nÖzellikle Alfwen’in sözlerini tartarak konuşması ve Wolrez Galet’in “direnen kurt” duruşu etkileyiciydi.',
    'The reports from the eastern border, villagers vanishing, Merkos with “blue flames in his eyes”… Dirdar Poenta is a captain who dislikes a calm sea. This meeting is not just a briefing but the **nervous system of the empire**.\n\nParticularly Alfwen weighing his words and Wolrez Galet’s “resisting wolf” posture were striking.',
    1110, { steel: 28, blood: 9, seal: 36, balance: 41 }, [
      R('HudutBeyi_Kerem', 58, 'Sınır raporlarının üslubu çok gerçekçi. Gerçek hudut komutanları da “yanıyor” demez, “kaybolan köy sayısı arttı” der. **Soğuk dil daha ürkütücü.**',
        'The style of the border reports is very realistic. Real border commanders do not say “burning”, they say “the number of vanished villages rose”. **Cold language is scarier.**', 33),
      R('Althaea_Gözcüsü', 55, 'Ilwen Khasin’in “stratejiler hâlâ belirsizlikte yüzüyor” cümlesi de bence sessiz bir eleştiri. Merkos aceleci, Ilwen analitik, Roya ise **sert doğruyu** söylüyor.',
        'Ilwen Khasin’s “strategies still float in uncertainty” is a quiet critique, I think. Merkos is hasty, Ilwen analytical, and Roya says the **hard truth**.', 24)
    ]));

  S.push(T('x-bolum-3', 'bolum', 'LoreAvcisi_Tuna', 100,
    'Zeandor’un vinç çizimi sahnesi: Miran, Zylan ve “başkentteki gerçek teknolojinin hatırası” üzerine',
    'Zeandor’s crane drawing scene: Miran, Zylan and the “memory of a real technology in the capital”',
    'Zylan’ın çizimi ciddiye alan ilk usta olması, Miran’ın da bunun başkentteki gerçek bir teknolojinin hatırası olduğunu fark etmesi çok ilginç. Arava’daki **Hisar**’ın rıhtım ve vinç yapısıyla bağlantı kurmuş olabilir miyiz?\n\nZeandor aslında icat etmiyor, **hatırlıyor**: Selya’ya sürgün edilmeden önce başkentte gördüğü bir şeyi. Sizce bu sürgüne giden çocuğun gizli bir “mühendislik mirası” olduğunu mu ima ediyor?',
    'It is fascinating that Zylan was the first master to take the drawing seriously and Miran noticed it was the memory of a real technology in the capital. Could we link this to the quay and crane structure of the **Citadel** in Arava?\n\nZeandor is not really inventing, he is **remembering**: something he saw in the capital before exile to Selya. Does this hint that the boy sent into exile has a hidden “engineering heritage”?',
    1380, { steel: 41, blood: 5, seal: 66, balance: 35 }, [
      R('RunikDilbilimci', 98, 'Ortak Lisan’da vinç için ayrı bir kelime yok ama “Shelan” (kilitlemek/mühürlemek) ve “Voran” (açmak) fiilleri bir mekanizma bağlamında iş görüyor. Bence yazar teknik terimi bilerek eksik bırakmış.',
        'There is no dedicated word for crane in the Common Tongue, but the verbs “Shelan” (to lock/seal) and “Voran” (to open) work in a mechanism context. I think the author left the technical term out on purpose.', 28),
      R('CirakYusuf', 92, 'Ben tersane çırağı gibi bakınca: Linroth’un başta küçümseyip sonra saygı duyması çok gerçekçi. Usta eski bilgiyi korur, yenisi gelince **önce direnir**, sonra boyun eğer.',
        'Looking at it like a shipyard apprentice: Linroth belittling then respecting is so realistic. A master guards old knowledge, **resists first** when new arrives, then bows.', 30),
      R('ZeytinYagliDolma', 80, 'Kör Yengeç Tavernası’nda kimliğini gizleyip dinlediği fısıltılar da aynı mantıkta: Zeandor **dinleyen** bir prens, bu yüzden Selya onu sevdi.',
        'The whispers he listens to in disguise at the Blind Crab Tavern follow the same logic: Zeandor is a **listening** prince, which is why Selya loved him.', 25)
    ]));

  S.push(T('x-bolum-4', 'bolum', 'SolgarinSesi', 140,
    '“Rüya” bölümü ve Ay kehaneti: Edun Solgar sahte bir kehanetle Lun Aldris’i mi kullandı?',
    'The “Dream” chapter and the Moon prophecy: did Edun Solgar use a false prophecy to exploit Lun Aldris?',
    'Amadon’un rüyasında gördüğü “Ay” aslında gerçek bir işaret miydi, yoksa Edun’un fısıltısıyla sahte-kutsal bir meşruiyet mi üretildi? Lun Aldris adının “Ay Gözcüsü” anlamına gelmesi çok uygun bir tesadüf.\n\nEdun’un kendini asla suça bulaştırmadan İmparatoriçe’ye suçu yıkacak plan kurması, onun siyasi zekâsını gösteriyor. Zeandor’u öldürtmeyi düşünüp **matematiğin intihar olduğunu** hesaplaması da cabası.',
    'Was the “Moon” in Amadon’s dream a real sign, or was a pseudo-sacred legitimacy manufactured through Edun’s whispers? That Lun Aldris means “Moon Watcher” is a very convenient coincidence.\n\nEdun’s plan to shift blame to the Empress without ever staining himself shows his political wit. His calculating that killing Zeandor was **mathematically suicide** is a bonus.',
    1720, { steel: 33, blood: 19, seal: 58, balance: 44 }, [
      R('MeryenDostu', 138, 'Meryen’i manipülasyon kurbanı olarak görüyorum. Oğullarını korumak isteyen yas içindeki bir anne; Edun onun **en savunmasız anına** vurdu.',
        'I see Meryen as a victim of manipulation. A grieving mother wanting to protect her sons; Edun struck at her **most vulnerable moment**.', 48),
      R('DengeHakimi', 130, 'Mabed’in tutumu da kritik: Edun’un Mabed onayı olmadan küçük prensi taçlandırma girişimi Ertler Serbam tarafından “meşru dini ihlal” sayıldı. Edun siyaseti biliyor ama **dini hafife aldı**.',
        'The Mabed’s stance was also crucial: Edun’s attempt to crown the young prince without Mabed approval was deemed a “legitimate religious violation” by Ertler Serbam. Edun knows politics but **underestimated religion**.', 37)
    ]));

  S.push(T('x-bolum-5', 'bolum', 'ParşömenKurdu', 220,
    'Kılıç Geçidi töreni ve Olinder Albea’nın ölümü: Sessiz Avcı’yı kim tuttu?',
    'The Sword Pass ceremony and Olinder Albea’s death: who hired the Silent Hunter?',
    'Haftalarca süren bir hazırlık, “on adım sonra unutulacak kadar sıradan” bir yüz, tek ok. Olinder, Edun Solgar ve Valori Gekhor’un gizli entrikalarına dair kanıt topluyordu. Kim kazandı bu ölümden? Rean Certfa Başkomutan oldu ama “ait olmayan adam” fısıltılarını umursamayan bir isim; bence o **zinciri aşan biri**.\n\nSizce asıl ipucu Liana ile ilişkisinde mi?',
    'Weeks of preparation, a face “so ordinary it is forgotten ten paces later”, a single arrow. Olinder was gathering evidence against the secret intrigues of Edun Solgar and Valori Gekhor. Who gained from this death? Rean Certfa became Supreme Commander, a man who ignores the “does not belong” whispers; I think he is **someone outside the chain**.\n\nDo you think the real clue is in his relationship with Liana?',
    1960, { steel: 36, blood: 38, seal: 74, balance: 22 }, [
      R('GolgeKalem', 218, 'Liana’nın efsanesi (balıkçı köyü, fırtınada kaybedilen koca) “doğruluğu belirsiz” diye geçiyor. Eğer bir örtmeceyse Liana **bir ajan** olabilir mi? Olinder’in her yükünü dinleyen biri…',
        'Liana’s legend (fishing village, a husband lost at sea) is noted as “truth uncertain”. If it is a cover, could Liana be **an agent**? Someone who listens to all Olinder’s burdens…', 59),
      R('Althaea_Gözcüsü', 214, 'Helsa’nın sessizliği de ilginç. Sadakatsizliğin farkında ama konuşmuyor. “Sessiz” karakterlerin hep bir şey bildiği türden bir hikâye bu.',
        'Helsa’s silence is interesting too. Aware of the infidelity but never speaks. This is the kind of story where the “silent” ones always know something.', 28)
    ]));

  /* ───────────────────────── HANELER ───────────────────────── */
  S.push(T('x-hane-1', 'hane', 'GalethaMadencisi', 36,
    'Galetsha madencileri neden hep sömürülüyor? Yunghar Hezin’in valiliği ve Bakırsu isyanının kökleri',
    'Why are Galetsha’s miners always exploited? Yunghar Hezin’s governorship and the roots of the Bakırsu uprising',
    'Galetsha’nın bakır madenleri “imparatorluğun can damarı” ama işçilerin ek ücret ve kısaltılmış mesai talebi hep ret yiyor. Gulwar Saert’in Imloth ile pazarlığı Adamen’de işe yaradı, **Galetsha’da neden olmadı?**\n\nMadenci ailelerde “Son Duraklık” inancı yaygın: öbür tarafta vergi, açlık, küfe yok. İnsanlar bu hayatta adalet bulamadıkları için ölüm sonrasına tutunuyor.',
    'Galetsha’s copper mines are the “lifeblood of the empire” yet workers’ demands for extra pay and shorter shifts are always refused. Gulwar Saert’s bargain with Imloth worked in Adamen; **why not in Galetsha?**\n\nThe “Final Rest” belief is widespread in miner families: on the other side there are no taxes, hunger or baskets. People cling to the afterlife because they find no justice in this one.',
    1560, { steel: 31, blood: 49, seal: 44, balance: 36 }, [
      R('KaganDemir', 34, 'Adamen cücelerinin özerklik statüsü var; kendi yasalarını ve valilerini seçebiliyorlar. Galetsha’da böyle bir güvence yok, **Garnor’un fethinden beri** boyun eğdirilmiş bir toprak.',
        'The Adamen dwarves have autonomous status; they choose their own laws and governors. Galetsha has no such guarantee, a land **subdued since Garnor’s conquest**.', 36),
      R('SolgarinSesi', 30, 'Rones Alvro döneminde “buğday, inek, cevher” merkeze akıyordu. Taşra o yükü hâlâ taşıyor. Bence Bakırsu isyanı bir **otuz yıllık borcun** faturası.',
        'In Rones Alvro’s time “wheat, cattle, ore” flowed to the center. The provinces still carry that load. I think the Bakırsu uprising is the bill for a **thirty-year debt**.', 29),
      R('GalethaMadencisi', 25, 'Doğru. Dedem “Demiryumruk öldüğünde kimse ağlamadı ama herkes yas tuttu” derdi. Sevilmek ile korkulmak arasındaki ince çizgi.',
        'True. My grandfather used to say “when Iron Fist died nobody wept but everyone mourned.” The thin line between being loved and feared.', 40)
    ]));

  S.push(T('x-hane-2', 'hane', 'TavernaciOnur', 110,
    'Hanelerin fiziksel soyu: Arhan’ın “turuncuya kaçan kızıl saç” genetiği ile Solgar’ın “soğuk beyaz ten” arasındaki fark ne anlatıyor?',
    'Houses by looks: what does the gap between Arhan’s “orange-leaning red hair” and Solgar’s “cold white skin” tell us?',
    'Selya esmer ve kehribar gözlü (çöl rüzgârı, deniz ticareti), Onneva mavi gözlü ve kızıl bakır saçlı (ovalar), Kalpear iri omuzlu ve gür saçlı (toprak), Sınglew yara izli savaşçı. Coğrafya genetiği yazıyor!\n\nBen sahneyi kafamda çizerken hane renkleri bayrak renkleri kadar işime yarıyor. Sizin favori fiziksel “hane imzanız” hangisi?',
    'Selya is dark-skinned and amber-eyed (desert wind, sea trade), Onneva blue-eyed with red-copper hair (the plains), Kalpear broad-shouldered and thick-haired (the earth), Sınglew scarred warriors. Geography writes the genetics!\n\nWhen I draw scenes in my head, house looks help me as much as banner colors. What is your favorite physical “house signature”?',
    920, { steel: 14, blood: 7, seal: 29, balance: 26 }, [
      R('CizerMert', 108, 'Arhan’ın çilli, solgun yeşil gözlü soyluları çizim açısından rüya. Edlas’ın bakır saçı ve yara izi, bir ressamın hayali.',
        'Arhan’s freckled, pale green-eyed nobles are a drawing dream. Edlas’s copper hair and scar are a painter’s fantasy.', 22),
      R('ZeytinYagliDolma', 100, 'Selya Hanesi’ni seviyorum çünkü “çekici ve melez çizgiler” diyor. Darios’un sert ama Liaher’in dürüst yüzü gibi iki zıt hâl aynı hanede.',
        'I love House Selya because they are described with “attractive, mixed features”. Darios’s harsh and Liaher’s honest faces are two opposites in one house.', 17)
    ]));

  S.push(T('x-hane-3', 'hane', 'KaganDemir', 190,
    'ANKET: Zeandor’un yerinde olsaydınız Burria’nın “sessiz kopuşu” karşısında ne yapardınız?',
    'POLL: If you were Zeandor, what would you do about Burria’s “silent secession”?',
    'Rones Alvro Burria’yı vergiye bağladı, Elron elçi gönderip yetindi, Burria “İkili Taht Paktı” ile fiilen bağımsız oldu. Şimdi Zeandor tahtta, Arathen kuzeyden yaklaşıyor, Seltanya ve Onneva’da bağımsızlık söylentileri başladı.\n\nTek seçenek seçebiliyorsunuz; gerekçeyi yazın!',
    'Rones Alvro bound Burria with tribute, Elron sent envoys and settled, and Burria became de facto independent through the “Dual Throne Pact”. Now Zeandor sits on the throne, Arathen advances from the north, and rumors of independence stir in Seltanya and Onneva.\n\nYou can choose only one; write your reasoning!',
    2740, { steel: 49, blood: 36, seal: 58, balance: 62 }, [
      R('KizilCayLejyoneri', 188, 'Kuşatma ve sefer imparatorluğu yorar. Ben Burria prensine ayrı ayrı anlaşma teklif ederdim; II. Lun Aldris’in yöntemi ama **sözümü tutarak**.',
        'Siege and campaigns tire the empire. I would offer Burria’s prince a separate deal, II. Lun Aldris’s method but **keeping my word**.', 33),
      R('HudutBeyi_Kerem', 180, 'Burria’yı bırakırdım. Doğu sınırında Arathen var, güneydoğu için kaynak yok. “Yeter” fermanını hatırlayın: **imparatorluk kendi ağırlığı altında çatırdıyor.**',
        'I would let Burria go. Arathen is on the eastern border and there are no resources for the southeast. Remember the “Enough” edict: **the empire cracks under its own weight.**', 54),
      R('MaviKalemYildiz', 170, 'Ben diplomasi derim ama Hariciye’nin işi bu. Zeandor’un “halkın ne düşündüğünü önemsemesi” onu Burria’da farklı bir noktaya taşır: **yüz yüze müzakere.**',
        'I say diplomacy but that is the Foreign Ministry’s job. Zeandor caring about what people think takes him somewhere different in Burria: **face-to-face negotiation.**', 26)
    ],
    { id: 'poll-hane-3',
      question: 'Zeandor Burria’nın bağımsızlığı karşısında ne yapmalı?',
      question_en: 'What should Zeandor do about Burria’s independence?',
      options: [
        O('o1', 'Savaşıp yeniden ilhak etmek', 'Fight and annex it again', 53),
        O('o2', 'Burria prensiyle ayrı bir antlaşma yapmak', 'Strike a separate treaty with Burria’s prince', 131),
        O('o3', 'Bağımsızlığı tanıyıp Arathen’e odaklanmak', 'Recognize independence and focus on Arathen', 109),
        O('o4', 'Ticaret ve vergi imtiyazlarıyla sessizce bağlamak', 'Quietly bind them with trade and tax concessions', 84)
      ] }));

  S.push(T('x-hane-4', 'hane', 'DemirKadin_Zeynep', 280,
    'Demir Ada hanedanı bayrağı: “Kırılırız ama Eğilmeyiz” sözü tarihsel olarak neye dayanıyor?',
    'The Demir Ada banner: what does “We Break but Never Bend” rest on historically?',
    'Khasinya ve çevresi Yüce İlipon İmparatorluğu’nun harabelerini barındırıyor, Safir Boğazı’nda korsan filosu yok edilmiş, Remal döneminde Khasinya isyanları abluka ile bastırılmış. Yani adanın hafızası **kırılmak üzerine kurulu**.\n\nBu yüzden slogan bir direniş değil, bir **yas** gibi okunabilir. Demir Ada okurları, siz ne diyorsunuz?',
    'Khasinya and its surroundings hold ruins of the High Ilipon Empire, the pirate fleet was destroyed in the Safir Strait, and Khasinya revolts were put down by blockade under Remal. The island’s memory is **built on being broken**.\n\nSo the slogan reads less as defiance than as **mourning**. Demir Ada readers, what do you think?',
    1120, { steel: 37, blood: 21, seal: 33, balance: 25 }, [
      R('BozkurtEmre', 278, 'Khasinya bayrağındaki köpekbalığı dişi gibi dizilmiş kemik beyazı üçgenler bence “yutan uçurum” imgesi. Koruyucu ama tehditkâr. Slogan bu bayrakla tamamlanıyor.',
        'The bone-white triangles on Khasinya’s flag arranged like shark teeth read as a “devouring abyss” image to me. Protective yet threatening. The slogan completes with that banner.', 24)
    ]));

  /* ───────────────────────── KARAKTER ANALİZLERİ ───────────────────────── */
  S.push(T('x-karakter-1', 'karakter', 'NazliHanim_Okur', 48,
    'Edun Solgar: “Engerek” kötü mü, yoksa sadece dürüst bir realist mi?',
    'Edun Solgar: is the “Viper” evil, or just an honest realist?',
    'Edun, Zeandor’u öldürtmeyi düşünüp siyasi matematiğin bunun intihar olduğunu hesaplayarak vazgeçiyor. Bu, ahlaki değil **hesapçı** bir iyilik. Meryen’i manipüle ediyor ama kendi elini kirletmiyor. Oysa Amadon’un sarayında tek tutarlı insan o olabilir.\n\nSizce Edun’u kötü yapan nedir: arzuları mı, yöntemleri mi?',
    'Edun considers having Zeandor killed but calculates that the political math makes it suicide. That is a **calculated**, not moral, mercy. He manipulates Meryen but never dirties his own hands. Yet in Amadon’s palace he may be the only consistent person.\n\nWhat makes Edun evil in your view: his desires or his methods?',
    2030, { steel: 43, blood: 52, seal: 61, balance: 47 }, [
      R('SolgarinSesi', 46, 'Solgar hanesinde büyüdüğüm için biraz taraflıyım: Edun’un “risk almamak” ilkesi ticaret hanesinin ilkesidir. **Paranın sesi kılıcın sesinden yüksek çıkar.** Kötü demezdim, soğuk derdim.',
        'I am a bit biased since I grew up in House Solgar: Edun’s “never take risks” principle is a trading house’s principle. **The sound of money rises above the sound of the sword.** I would say cold, not evil.', 62, [
          R('MeryenDostu', 44, 'Soğuk olması, bir annenin yasını araç yapmasını aklamıyor. Bu çizgi için ben ona kızgınım.',
            'Coldness does not excuse using a mother’s grief as a tool. That is the line I am angry about.', 40)
        ]),
      R('KizilCayLejyoneri', 40, 'Hiles Vizelar’ı sürgüne göndermesi çok daha vahim. Amadon’un en yakın dostunu yok etti. **Yalnızlaştırmak** bir suikasttan beter olabilir.',
        'Sending Hiles Vizelar into exile is far graver. He destroyed Amadon’s closest friend. **Isolating** someone can be worse than assassination.', 37)
    ]));

  S.push(T('x-karakter-2', 'karakter', 'MeryenDostu', 130,
    'Amadon: Adil bir validen paranoyak bir tirana — hangi anda kırıldı?',
    'Amadon: from a just governor to a paranoid tyrant — at what moment did he break?',
    'Seltanya’da halkın sevdiği Melik Vali. Sonra Lunin’in vebada ölümü, Olinder’in suikastı, Hiles’in sürgünü… Ama bana göre kırılma bir **söz**de: ağabeyine Zeandor’u asla öldürmeyeceğine dair verdiği kutsal yemin. O yemin onu ömür boyu iki ateş arasında tuttu.\n\nSizce kırılma noktası neresiydi?',
    'The Melik Governor loved by the people in Seltanya. Then Lunin’s death by plague, Olinder’s assassination, Hiles’s exile… But in my view the break lies in a **vow**: the sacred oath to his brother never to kill Zeandor. That oath kept him between two fires for life.\n\nWhere do you think the breaking point was?',
    1880, { steel: 39, blood: 44, seal: 55, balance: 58 }, [
      R('DengeHakimi', 128, 'Benim için Lunin’in ölümü. “Maraz’ın laneti mi Hekim’in suskunluğu mu?” sorusuyla saray bölündü. Amadon tanrıların **cevapsızlığı** karşısında kırıldı, bence.',
        'For me it is Lunin’s death. The court split over “Malady’s curse or the Healer’s silence?” Amadon broke before the gods’ **unresponsiveness**, I think.', 57),
      R('GezginBatu', 120, 'Metnor’un “Amadon’a at binmeyi öğrettiği” detayını sevdim. Küçük bir hizmetkâr ama Amadon’un insanlığını hatırlatan tek kişi.',
        'I like the detail of Metnor teaching Amadon to ride. A small servant but the only one reminding us of Amadon’s humanity.', 29),
      R('SessizTanik', 110, 'Son vasiyetteki mühürlü zarf, kendisinin eleştirdiği Imloth’un hatalarına düştüğünü fark etmesinin kanıtı. **Gerçeği geç görmek**, onun trajedisi.',
        'The sealed envelope in his final will is proof he saw he had fallen into the errors of Imloth, whom he criticized. **Seeing the truth too late** is his tragedy.', 41)
    ]));

  S.push(T('x-karakter-3', 'karakter', 'ZeytinYagliDolma', 160,
    'Elyndra Selya ve Zeandor: Yedi yıllık “tehlikeli bağ” ile Selya’nın siyasi pazarlığı',
    'Elyndra Selya and Zeandor: a seven-year “dangerous bond” and Selya’s political bargain',
    'Elyndra zeki, sorgulayıcı, Thaelen’den elf dili öğrenmiş. Ailesinin bu ilişkiyi bir siyasi koz olarak kullanabileceğinden korkuyor. İmparatorluk ailesi evlilikleri “kan pazarlığı”; peki Selya hanesi bu fırsatı nasıl değerlendirir?\n\nAyrıca Liaher’in kız kardeşinin bu ilişkisini bilmesi ve Darios’un henüz bilmemesi ince bir gerilim.',
    'Elyndra is clever, inquisitive, learned Elven from Thaelen. She fears her family could use the bond as a political asset. Imperial marriages are “blood bargains”; how would House Selya exploit it?\n\nAlso, Liaher knowing about his sister’s relationship while Darios does not yet is a fine tension.',
    1430, { steel: 21, blood: 18, seal: 40, balance: 31 }, [
      R('MaviKalemYildiz', 158, 'Thaelen’in insanlara kayıtsız ve mesafeli ama Elyndra ile ders çalışması bile bir ilişki tohumu. Elf diliyle aşk dili arasında çok ince bir yol.',
        'Thaelen is indifferent and distant toward humans, but even studying with Elyndra is a seed of a relationship. A very thin path between the Elven language and a language of love.', 23),
      R('HalcyonDeniz', 150, 'Bence en büyük tehlike Darios’un “sert ve pragmatik” oluşu. Öğrendiğinde sadece aile değil **valilik** meselesi de olacak.',
        'I think the biggest danger is Darios being “harsh and pragmatic”. When he learns, it will be not only a family matter but a **governorship** matter.', 27)
    ]));

  S.push(T('x-karakter-4', 'karakter', 'AylaGok', 240,
    'Imloth gerçekten “Tembel” mi? “Derin Tuzak” lakabının gizli anlamı',
    'Is Imloth truly “Lazy”? The hidden meaning of the epithet “Deep Trap”',
    'İsmin anlamı “Nim (Derin) + Loth (Tuzak/İllüzyon)” yani **Derin Tuzak / Gölge Oyunu**. Resmî lakap “Tembel” ama bu ad belki bir **maske**: devlet işlerini danışmanlara bırakıyor gibi görünüp bürokrasinin dehlizlerinde güç topluyor olabilir mi?\n\nHilnor Wolde’nin “yürüyen kütüphane” olması da bunu destekler gibi.',
    'The name means “Nim (Deep) + Loth (Trap/Illusion)”, i.e. **Deep Trap / Shadow Play**. The official epithet is “Lazy”, but that may be a **mask**: seeming to leave state affairs to advisors while accruing power in the corridors of bureaucracy?\n\nHilnor Wolde being a “walking library” seems to support this.',
    1250, { steel: 26, blood: 14, seal: 52, balance: 33 }, [
      R('RunikDilbilimci', 238, 'İsim analizi doğru. “Loth” kökünün tuzak ve illüzyon büyüsü olduğunu hatırlayın; Desise’nin izi. Kasıtlı bir **adlandırma ironisi** olabilir.',
        'The name analysis is right. Remember the root “Loth” means trap and illusion magic; Guile’s trace. Could be a deliberate **naming irony**.', 34),
      R('KahinAlper', 230, 'Ama Selmira’nın ölümüyle çöküşü gerçek görünüyor. Maske takan biri vicdan azabıyla şaraba gömülmez. Belki tuzak **kendi kendine kurulmuştu**.',
        'But his collapse after Selmira’s death seems real. A man in a mask does not drown in wine from guilt. Perhaps the trap was **set for himself**.', 38)
    ]));

  /* ───────────────────────── SERBEST MEYDAN (TAVERNA) ───────────────────────── */
  S.push(T('x-sohbet-1', 'sohbet', 'TavernaciOnur', 8,
    'Taverna Masası: Stallhart evreninde bir tavernada hangi içecek ısmarlanırdı? (Menü önerileri)',
    'Tavern Table: what drink would be ordered in a Stallhart tavern? (Menu suggestions)',
    'Hobi olarak evrenin “taverna menüsünü” yazıyorum: Selya’da tuzlu balık ve kehribar şarap, Memanth’te hayvancılıktan kuru et ve yoğun ayran, Galetsha’da kömür ocağında kızarmış ekmek, Mabed’de hacılar için ballı süt… Siz ekleyin!',
    'As a hobby I am writing the universe’s “tavern menu”: salted fish and amber wine in Selya, dried meat and thick buttermilk from herding in Memanth, bread toasted on a coal hearth in Galetsha, honeyed milk for pilgrims in the Mabed… You add yours!',
    1310, { steel: 33, blood: 8, seal: 23, balance: 40 }, [
      R('ZeytinYagliDolma', 7, 'Onneva tahıl ambarı, o yüzden **sıcak çorba ve taze ekmek** olmazsa olmaz. Sarnith (tuz) ve Vorn (ekmek) deyip “ekmek ve tuz” ikilisini ekleyelim.',
        'Onneva is the grain granary, so **hot soup and fresh bread** are essential. Let us add the pair “bread and salt” as Vorn ra Sarnith.', 25),
      R('BozkurtEmre', 6, 'Demir Ada’da ise sert içki ve tuzlu kuru balık. Dalgayla boğuşan adamlar yumuşak şeyler içmez 😄',
        'In Demir Ada it is strong spirits and salty dried fish. Men who wrestle with waves do not drink soft things 😄', 18),
      R('GalethaMadencisi', 4, 'Madenci olarak bir tek şey isterim: **yağlı sıcak çorba** ve vardiya sonrası bir kase. Küfe taşımak kolay değil.',
        'As a miner I want one thing: **a hot greasy stew** and a bowl after the shift. Carrying baskets is not easy.', 22, [
          R('TavernaciOnur', 3, 'Not aldım, “Galetsha Madenci Çorbası” menüye giriyor 🍲',
            'Noted, “Galetsha Miner’s Stew” goes on the menu 🍲', 15)
        ])
    ]));

  S.push(T('x-sohbet-2', 'sohbet', 'RunikDilbilimci', 70,
    'Ortak Lisan öğreniyorum! Günlük selamlaşma kalıplarını sırayla yazalım: “Heon eana”dan “Zagedron te”ye',
    'I am learning the Common Tongue! Let us write everyday greetings in order: from “Heon eana” to “Zagedron te”',
    'Başlıyorum:\n- **Heon eana** — Merhaba (Güneş ve su)\n- **Alvheon** — Günaydın\n- **Alvasha** — İyi akşamlar\n- **Ez alvasen** — İyiyim\n- **Vehanar te?** — Nasılsın?\n- **Eseron te** — Eline sağlık\n- **Zagedron te** — Tebrikler\n\nKendi uydurduğunuz cümleleri paylaşın; en güzeli ayın “vakanüvis sözü” olsun!',
    'Starting off:\n- **Heon eana** — Hello (sun and water)\n- **Alvheon** — Good morning\n- **Alvasha** — Good evening\n- **Ez alvasen** — I am well\n- **Vehanar te?** — How are you?\n- **Eseron te** — Thanks for your work\n- **Zagedron te** — Congratulations\n\nShare sentences you invent; the best becomes the month’s “chronicler’s word”!',
    1840, { steel: 36, blood: 4, seal: 49, balance: 38 }, [
      R('MaviKalemYildiz', 69, 'Denedim: “Ez arien Vorn ra Sarnith, gar Ez arien Melwyn zlan.” (Ekmek ve tuzu severim ama balı daha çok sevmem.) Doğru mu?',
        'I tried: “Ez arien Vorn ra Sarnith, gar Ez arien Melwyn zlan.” (I love bread and salt but I do not love honey more.) Is it right?', 14, [
          R('RunikDilbilimci', 68, 'Yaklaştın ama “zlan” yavaş/geç demek, “daha çok” için başka bir yapı gerek. “Gar Melwyn alvis ez” demek istiyorsan **“ama bal bana daha iyi”**.',
            'Close, but “zlan” means slow/late; you need another structure for “more”. If you mean “Gar Melwyn alvis ez” it is **“but honey is better to me”**.', 16)
        ]),
      R('CirakYusuf', 55, 'Savaş narası ezberlendi: “Aron hanar, Edron rion! Ezra gharan tod dor!” Taverna masasında bağırınca herkes bize baktı 😅',
        'Memorized the war cry: “Aron hanar, Edron rion! Ezra gharan tod dor!” When shouted at the tavern table everyone stared at us 😅', 31)
    ]));

  S.push(T('x-sohbet-3', 'sohbet', 'HalcyonDeniz', 170,
    'ANKET: Stallhart evreninde yaşasaydınız hangi mesleği seçerdiniz?',
    'POLL: If you lived in the Stallhart universe, which profession would you choose?',
    'Ben Selya limanında tersane ustası olurdum. Vinçleri tasarlamak, gemileri denize indirmek… Zeandor’un icadını görmek için bile olsa. Siz?',
    'I would be a shipwright in the Selya harbor. Designing cranes, launching ships… even just to see Zeandor’s invention. And you?',
    2100, { steel: 28, blood: 6, seal: 31, balance: 44 }, [
      R('GalethaMadencisi', 169, 'Cesaretim yok ama madenci olurdum. Sırlar yeraltında. Kadim İlimler’e dair mühürlü yapı derin damarlarda 👀',
        'I lack courage but I would be a miner. The secrets are underground. The sealed structure of the Ancient Sciences lies in the deep veins 👀', 20),
      R('GolgeKalem', 160, 'Elbette vakanüvis ya da Aldris. Sarayın sessiz gözü olmak istiyorum. Kimse fark etmeden **her şeyi kaydeden**.',
        'Chronicler or Aldris, of course. I want to be the palace’s silent eye. The one who **records everything** unnoticed.', 25)
    ],
    { id: 'poll-sohbet-1',
      question: 'Stallhart evreninde hangi mesleği seçerdiniz?',
      question_en: 'Which profession would you choose in the Stallhart universe?',
      options: [
        O('o1', 'Tersane ustası / mühendis', 'Shipwright / engineer', 91),
        O('o2', 'Vakanüvis / arşivci', 'Chronicler / archivist', 118),
        O('o3', 'Hudut askeri', 'Border soldier', 66),
        O('o4', 'Tavernacı', 'Tavern keeper', 83),
        O('o5', 'Casus / Gölge Veziri ajanı', 'Spy / agent of the Shadow Vizier', 74),
        O('o6', 'Mabed rahibi', 'Mabed priest', 29)
      ] }));

  S.push(T('x-sohbet-4', 'sohbet', 'KizilCayLejyoneri', 240,
    'Okuma sırası tavsiyesi: Evrene yeni giren biri önce nereden başlamalı? (Yeni okur rehberi)',
    'Reading order advice: where should a newcomer to the universe start? (New reader guide)',
    'Arkadaşım evreni merak ediyor ama sitede kaybolmuş. Benim önerim:\n1. Hanedan kronolojisi (21 hükümdar)\n2. Imloth–Amadon–Zeandor üçlüsü\n3. Haneler ve karakter rehberi\n4. Din ve Konsey\n5. Gizli tarih (Yasak Parşömenler) — **en sona**, spoiler gibi çünkü.\n\nSizin önerdiğiniz sıra nedir?',
    'My friend is curious about the universe but got lost on the site. My suggestion:\n1. Dynasty chronology (21 rulers)\n2. The Imloth–Amadon–Zeandor trio\n3. Houses and character guide\n4. Faith and the Council\n5. Hidden history (Forbidden Scrolls) — **last**, since it is a kind of spoiler.\n\nWhat order do you recommend?',
    2480, { steel: 52, blood: 7, seal: 44, balance: 60 }, [
      R('AtlasKesfi', 238, 'Haritayla başlardım. Gümüş Yol’un ortadan ikiye ayrılması, batı/doğu bloğu… Coğrafya anlaşılınca kronoloji **sahneye oturuyor**.',
        'I would start with the map. The Silver Way splitting the land, the west/east blocks… once geography is clear the chronology **falls into place**.', 43),
      R('VakanuvisCemre', 230, 'Ben kronolojiyi sevdim ama imparator biyografilerini sırayla değil, **lakaplara göre** okumak daha eğlenceli: Kurucu, Fatih, Sağır, Şair, Piç Kurt…',
        'I liked the chronology but reading emperor biographies **by epithet** rather than in order is more fun: Founder, Conqueror, Deaf, Poet, Bastard Wolf…', 36),
      R('NazliHanim_Okur', 220, 'Bölüm yorumlarını bölümlerden sonra okumak şart, spoiler yemek istemeyenler için.',
        'Reading chapter discussions only after the chapters is a must for those who do not want spoilers.', 21)
    ]));

  /* ───────────────────────── FAN SANATI ───────────────────────── */
  S.push(T('x-sanat-1', 'sanat', 'CizerMert', 55,
    'Kendi hanemin sancağını tasarladım: “Kızıl Çan” hanesi (yorum & eleştiri bekliyorum)',
    'I designed my own house banner: House “Red Bell” (comments & critique welcome)',
    'Stallhart’ın dama tahtası ve Selya’nın on iki ışınlı siyah merkezli güneşinden esinlendim: bordo zemin, altın çerçeve, ortada yarım çan ve altı köşeli beyaz yıldız. Altına “Çan susmaz, taht susar” mottosunu yazdım.\n\nDeğerlendirme: sembol çok kalabalık mı?',
    'Inspired by Stallhart’s checkerboard and Selya’s twelve-ray sun with a black center: burgundy field, gold frame, a half-bell in the center and a six-pointed white star. The motto below reads “The bell never falls silent, the throne does.”\n\nCritique: is the symbol too crowded?',
    780, { steel: 17, blood: 3, seal: 35, balance: 21 }, [
      R('MaviKalemYildiz', 54, 'Sancak resmini sevdim ama sembol kalabalık. Arhan’ın kadeh-ve-yıldız sadeliğine bak: bordo zemin, **tek kadeh, tek yıldız**. Az olan güçlü.',
        'I like the look but the symbol is crowded. Look at Arhan’s chalice-and-star simplicity: burgundy field, **one chalice, one star**. Less is strong.', 15),
      R('GolgeKalem', 50, 'Motto muhteşem. Ama “Çan susmaz” ifadesi Mabed’in üç çanını da çağrıştırıyor, bu bilerek mi?',
        'The motto is superb. But “the bell never falls silent” evokes the Mabed’s three bells; is that intentional?', 12, [
          R('CizerMert', 49, 'Evet bilerek! Birinci çan uyanış, ikincisi minnet, üçüncüsü koruma. Benim çanım **dördüncü** çan: uyarı.',
            'Yes, intentionally! The first bell is awakening, the second gratitude, the third protection. My bell is the **fourth**: warning.', 17)
        ])
    ]));

  S.push(T('x-sanat-2', 'sanat', 'MaviKalemYildiz', 130,
    'Şiir köşesi: II. Lun Aldris tarzında bir dörtlük yazma yarışması 🖋️',
    'Poetry corner: a quatrain contest in the style of Lun Aldris II 🖋️',
    'Şair İmparator Lun Aldris’in lirik şiirlerinden esinlenerek en güzel dörtlüğü yazalım. Tema: “Altın Çağın Sonu”. Ben başlıyorum:\n\n*“Haritanın kenarı artık gümüş kırığı,*\n*Her kale bir şiirdir, hiçbiri bitmemiş.*\n*Yeter, dedim sınıra; sınır duymadı beni,*\n*Taç ağır gelir yalnız kalan alna.”*',
    'Let us write the finest quatrain inspired by the lyric poems of the Poet Emperor Lun Aldris. Theme: “The End of the Golden Age.” I will start:\n\n*“The map’s edge is now a shard of silver,*\n*Every fortress is a poem, none finished.*\n*I told the border Enough; it did not hear,*\n*The crown weighs on the brow left alone.”*',
    690, { steel: 12, blood: 4, seal: 44, balance: 18 }, [
      R('GolgeKalem', 128, '*“Yazılmamış fermanlar rüzgâra yazılır,*\n*Kurultay susar, vakanüvis kaleme sarılır.*\n*Bir yıl elli kış oldu, kimse saymadı,*\n*Taht boşluğu en çok yazı bilir.”*',
        '*“Unwritten edicts are written on the wind,*\n*The Kurultay falls silent, the chronicler clutches the quill.*\n*One year became fifty winters, none counted,*\n*The throne’s void knows writing best.”*', 29),
      R('Althaea_Gözcüsü', 120, 'Kara Delik Çağı’na gönderme çok güzel. Dörtlüğün gizli kahramanı “saymayan kış” 😄',
        'The nod to the Black Hole Age is lovely. The quatrain’s hidden hero is the “uncounted winter” 😄', 18)
    ]));

  S.push(T('x-sanat-3', 'sanat', 'AtlasKesfi', 200,
    'Elle çizdiğim Gümüş Yol haritası: Garall–Todfa geçidi ve Pilkard adası (tam çözünürlük)',
    'My hand-drawn Silver Way map: the Garall–Todfa strait and Pilkard island (full resolution)',
    'Haritada kıtayı kuzey-güney ikiye bölen dar deniz Gümüş Yol: batı bloğu (Adamen, Z’ela, Başsancak, Solgar, Seltanya, Mabed, Selya), doğu bloğu (Oñneva, Memanth). En dar geçit Garall–Todfa/Gom Ara hizası, güney ağzında Pilkard.\n\nNiron Nehri’nin Garall’da denize dökülmesini çizerken en çok zorlandığım kısım oldu. Rehber harita ile karşılaştırıp hata varsa söyleyin!',
    'On the map, the narrow sea splitting the continent north-south is the Silver Way: the west block (Adamen, Z’ela, Başsancak, Solgar, Seltanya, Mabed, Selya), the east block (Oñneva, Memanth). The narrowest strait lies at the Garall–Todfa/Gom Ara line, with Pilkard at the southern mouth.\n\nThe Niron River meeting the sea at Garall was the hardest part to draw. Compare it with the guide map and tell me about any mistakes!',
    650, { steel: 15, blood: 2, seal: 38, balance: 20 }, [
      R('LoreAvcisi_Tuna', 198, 'Kızılçay Nehri’nin Harna’dan geçip Niron’a döküldüğünü eklemeyi unutmuşsun, Başsancak kuzeyinden başlıyor. Geri kalanı bence çok iyi!',
        'You forgot to add that the Kızılçay River flows past Harna into the Niron, starting from northern Başsancak. The rest looks very good to me!', 17),
      R('HudutBeyi_Kerem', 190, 'Memanth’ın tamamen dağ krallığı olduğunu daha vurgulayabilirsin; Halka, Tarma, Edlith, Kroga ve Deli dağları. Hudut için bu ayrıntı çok önemli.',
        'You could stress that Memanth is wholly a mountain kingdom; the Halka, Tarma, Edlith, Kroga and Deli ranges. For the border that detail is crucial.', 13)
    ]));

  /* ───────────────────────── YAZARIN DİVANI (soru – yazar henüz yanıtlamadı) ───────────────────────── */
  S.push(T('x-ama-1', 'yazar-divani', 'KahinAlper', 12,
    'Soru: Cilt II’de Ortak Lisan sözlüğü genişleyecek mi? (Sihir terimleri için özellikle)',
    'Question: Will the Common Tongue dictionary expand in Volume II? (especially magic terms)',
    'Saygıdeğer yazarım, Khaan, Loth, Vez, Zinvez gibi büyü kökleri sözlükte var ama kullanım örnekleri az. Cilt II’de büyü sistemini daha detaylı görecek miyiz, yoksa bilinçli olarak gizemli mi bırakılacak?\n\n*Not: Bu soru yazar yanıtı bekliyor.*',
    'Honored author, magic roots like Khaan, Loth, Vez and Zinvez are in the dictionary but with few usage examples. Will we see the magic system in more detail in Volume II, or will it be left deliberately mysterious?\n\n*Note: this question awaits the author’s reply.*',
    540, { steel: 16, blood: 2, seal: 33, balance: 14 }, [
      R('RunikDilbilimci', 11, 'Aynı soruyu merak ediyorum! Özellikle “Gylian” (kaos enerjisi) ve “Ronvez” (simya) köklerinin örnek cümleleri gelirse çok sevinirim.',
        'I wonder the same! I would be delighted if example sentences for the roots “Gylian” (chaos energy) and “Ronvez” (alchemy) appear.', 14),
      R('GezginBatu', 9, 'Gizemli bırakılması da hoşuma gider; büyü sadece sözlüğün kenarında yaşayan bir tehlike olsun.',
        'I would like it left mysterious too; let magic remain a danger living at the dictionary’s edge.', 10)
    ]));

  S.push(T('x-ama-2', 'yazar-divani', 'Althaea_Gözcüsü', 40,
    'Soru: Zeandor’un “Hak Edilen Prens” unvanı hangi sahnede kazanıldı? Erthan idamı mı, yoksa Bakırsu Uzlaşması mı?',
    'Question: In which scene was Zeandor’s “Rightful Prince” title earned? The Erthan execution or the Bakırsu Concordat?',
    'Kaynaklara göre Erthan isyanını bastırarak “Gerçek Varis”, “Yarının Hükümdarı” ve “Hak Edilen Prens” unvanlarını kazanıyor; ama Bakırsu Uzlaşması isyanı savaşsız çözen gizli bir anlaşma. İki kaynak arasındaki gerilim kasıtlı mı?\n\n*Bu soru yazar yanıtı bekliyor.*',
    'According to the sources, by suppressing the Erthan rebellion he earns the titles “True Heir”, “Tomorrow’s Sovereign” and “Rightful Prince”; yet the Bakırsu Concordat is a secret deal resolving the rebellion without war. Is the tension between the two sources deliberate?\n\n*This question awaits the author’s reply.*',
    610, { steel: 20, blood: 5, seal: 41, balance: 17 }, [
      R('LoreAvcisi_Tuna', 38, 'Bence kasıtlı. “Resmî” başarı ile “gerçek” çözüm arasındaki fark, halkın gördüğü zafer ile siyasetin gerçek yüzü. Zeandor’un halk şehit sandığı bir adamı idam ettirmesi **bedeli**.',
        'I think it is deliberate. The gap between the “official” success and the “real” solution is the public’s victory vs. politics’ true face. Zeandor executing a man the people see as a martyr is the **cost**.', 32)
    ]));

  /* ───────────────────────── ANKET: bölüm okuma kulübü ───────────────────────── */
  S.push(T('x-bolum-6', 'bolum', 'TavernaciOnur', 280,
    'ANKET: Cilt I’de en sevdiğiniz “sahne tipi” hangisi?',
    'POLL: What is your favorite “type of scene” in Volume I?',
    'Divan toplantıları mı, av sahneleri mi, taverna gecesi mi, cenaze mi, yoksa savaş meydanı mı? Hepimiz farklı yerde heyecanlanıyoruz. Oyunuzu verin, nedenini yorumlara yazın!',
    'Divan meetings, hunting scenes, tavern nights, funerals or battlefields? We each get excited in a different place. Cast your vote and write why in the comments!',
    2290, { steel: 40, blood: 15, seal: 38, balance: 47 }, [
      R('HudutBeyi_Kerem', 278, 'Av sahnesi. Olinder’in sessiz bilgeliği, Valen’in kibrinin çözülüşü… Az sözle çok şey anlatıyor.',
        'The hunting scene. Olinder’s quiet wisdom, Valen’s arrogance dissolving… so much told with so few words.', 27),
      R('ZeytinYagliDolma', 270, 'Kör Yengeç Tavernası! Kâhin sahnesi, kaçakçılar, sürgünler… Zeandor’un gizli kimliğiyle dolaşması en büyük **rahatlama**.',
        'The Blind Crab Tavern! The seer scene, smugglers, exiles… Zeandor wandering in disguise is the greatest **relief**.', 30)
    ],
    { id: 'poll-bolum-6',
      question: 'Cilt I’de en sevdiğiniz sahne tipi hangisi?',
      question_en: 'What is your favorite type of scene in Volume I?',
      options: [
        O('o1', 'Divan toplantıları (siyasi entrika)', 'Divan meetings (political intrigue)', 87),
        O('o2', 'Av ve sınır sahneleri', 'Hunting and border scenes', 69),
        O('o3', 'Taverna gecesi', 'Tavern nights', 102),
        O('o4', 'Cenaze ve tören sahneleri', 'Funeral and ceremony scenes', 58),
        O('o5', 'Savaş ve çatışma', 'Battle and conflict', 94)
      ] }));

  window.KURULTAY_SEED_EXTRA = S;
  /* Kategori sayaçlarının "canlı" görünmesi için küçük artış tabanı */
  window.KURULTAY_TITLE_EN = window.KURULTAY_TITLE_EN || {};
}());
