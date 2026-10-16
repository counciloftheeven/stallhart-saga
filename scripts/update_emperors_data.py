#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Enriches data/characters.json with all 21 Stallhart emperors from the 15-page PDF:
"Stallhart İmparatorları — Kronolojik Wiki Arşivi (KS 1144 – 1491)"
Provides full Turkish and English translations for every emperor, physical details,
psychology, reigns, name meanings, controversies, and chronicler footnotes.
"""

import json
import os

EMPERORS_DATA = [
    {
        "id": "craes",
        "num": 1,
        "name": {"tr": "I. Craes Stallhart", "en": "Craes Stallhart I"},
        "epithets": {"tr": "Kurucu · Tanrıların (Tek) Gözü · İlteriş", "en": "The Founder · Eye of the Gods · Ilterish"},
        "reign": "KS 1144–1160 (16 yıl)",
        "reign_en": "KS 1144–1160 (16 years)",
        "birth": {"tr": "KS 1120–1124 arası tahmin", "en": "Est. KS 1120–1124"},
        "nameMeaning": {
            "tr": "Crae (çıplak gerçek) + Es (el) → 'Gerçeğin Eli / Acımasız Eylem / Ham Eylem'",
            "en": "Crae (Naked Truth) + Es (Hand) → 'Hand of Truth / Ruthless Action / Raw Deed'"
        },
        "lineage": {
            "tr": "Amuseya paralı asker birliği kökenli, Kalbhor'un büyük oğlu, Stallhart Hanedanı'nın kurucusu",
            "en": "Originating from Amuseya mercenary company, eldest son of Kalbhor, founder of the Stallhart Dynasty"
        },
        "family": {
            "tr": "Eşi Hillith (Amuseya Beyi'nin kızı); en büyük kızı Nadima (halef); Darova Felaketi'nde ölen küçük kardeşi",
            "en": "Wife Hillith (daughter of Amuseya Lord); eldest daughter Nadima (successor); unnamed younger brother fallen at Darova"
        },
        "death": {
            "tr": "KS 1160, birikmiş savaş yaralarından",
            "en": "KS 1160, from accumulated battle wounds"
        },
        "epoch": {"tr": "Kuruluş Çağı (1–3)", "en": "Era of Foundation (1–3)"},
        "character": {
            "tr": "Gençken karizmatik, stratejik zekâlı, sözü kılıç kadar keskin; kayıplar (kardeş, göz, asker) onu melankolik, içine kapanık, korkulan bir kral yaptı — sessizliği öfke nöbetinden ürkütücüydü. Aynı zamanda teşkilatçı büyük bir yönetici.",
            "en": "In youth charismatic, tactically brilliant, words sharp as steel; grim losses (brother, eye, veterans) turned him melancholic, taciturn, and feared — his solemn silence more terrifying than wrath. A master statebuilder."
        },
        "physical": {
            "tr": "Tek gözlü, aksak yürüyüşlü. Gençlik portresi (22–24 yaş): omuz hizasında yüksek hacimli dalgalı saç (kökte küllü açık kahve/koyu kumral, uçlarda altın–platin–bal); badem göz, kehribar/bal rengi; sol kaşın lateralinde dikey yara izi nedeniyle kıl kaybı; yüksek elmacık kemikleri, çöküklü submalar bölge; köşeli geniş çene; açık-buğday ten; tıraşlı.",
            "en": "One-eyed, permanent limp. Youth portrait (age 22–24): shoulder-length voluminous wavy hair (ash brown root transitioning to gold-honey tips); almond amber/honey eyes; vertical scar across lateral left brow causing hair loss; high cheekbones, angular jawline; fair wheat complexion; clean-shaven."
        },
        "events": {
            "tr": "KS 1136 Amuseya Beyliği'ni devraldı. Eyyros Seferi (KS 1137): Kral Theron'u Gümüş Nehir'de yenip Eyyros'u ilhak etti. Darova Felaketi (KS 1139): Nýrdal ordusuna yenildi, kardeşi öldü, 5 yıl esir kaldı, sol gözünü kaybetti. Kutsal Kaçış ve Doktrin (KS 1144): Kutsal Kan Doktrini'ni ilan edip Stallhart Krallığı'nı kurdu (İS/KS 1. yıl). İkinci Nýrdal Savaşı (KS 1146–1148): Aleron Ovası'nda Nýrdal Kralı'nı bizzat öldürüp krallığı ilhak etti (aksak kaldı). Eretay Savunması (KS 1157–1160): Son gücüyle saldırıyı püskürttü.",
            "en": "Became Lord of Amuseya in KS 1136. Eyyros Campaign (KS 1137): Defeated King Theron at Silver River Pass and annexed realm. Darova Disaster (KS 1139): Defeated by heavy Nýrdal host, lost younger brother, spent 5 years in captivity, lost left eye. Sacred Escape & Doctrine (KS 1144): Proclaimed Holy Blood Doctrine and founded Stallhart Kingdom (Year 1 of calendar). Second Nýrdal War (KS 1146–1148): Slain Nýrdal King at Aleron Plains, annexed kingdom (left limping). Eretay Defense (KS 1157–1160): Repelled invasion with his dying breath."
        },
        "controversies": {
            "tr": "Resmî Yıllıklar: Tanrı Avcı'nın kanıyla kutsanmış efsanevi kurtarıcı. Mahzen Yazmaları: Kutsal Kaçış'ın bir zindan gardiyanı rüşveti olduğu ve Kalbhor'un zehirlenmesinde Hillith'in parmağı bulunduğu fısıltıları.",
            "en": "Official Annals: Mythic savior anointed with the blood of Hunter Raxes. Vault Manuscripts: Whispers that the Sacred Escape was bought via bribed gaolers, and Hillith orchestrated Kalbhor's poisoning."
        },
        "notes": {
            "tr": "Hillith resmî kayıtlarda gölgede tutulsa da saray vakanüvislerine göre dönemin en tehlikeli ve zeki siyasi oyuncusudur.",
            "en": "Though sidelined in official chronicles, court scribes note Hillith was the most cunning and dangerous political player of the era."
        }
    },
    {
        "id": "i-nadima-stallhart",
        "num": 2,
        "name": {"tr": "I. Nadima Stallhart", "en": "Nadima Stallhart I"},
        "epithets": {"tr": "Anne · İnancın Kraliçesi", "en": "The Mother · Queen of Faith"},
        "reign": "KS 1160–1197 (37 yıl)",
        "reign_en": "KS 1160–1197 (37 years)",
        "birth": {"tr": "KS 1135–1137 arası tahmin", "en": "Est. KS 1135–1137"},
        "nameMeaning": {
            "tr": "'Kaderin Kökü, Kader Bağı'; Na + Dima/Tsha → 'Hiçliğin Gölgesi / Sırdaş'",
            "en": "'Root of Destiny, Bond of Fate'; Na + Dima/Tsha → 'Shadow of the Void / Confidante'"
        },
        "lineage": {
            "tr": "Craes'in en büyük kızı; Garnor'un ablası; ilk imparatoriçe",
            "en": "Eldest daughter of Craes; elder sister of Garnor; first reigning empress"
        },
        "family": {
            "tr": "Zela'nın köklü Valer hanesi lideriyle siyasi evlilik; hiç çocuk doğurmadı",
            "en": "Political marriage with leader of House Valer of Zela; bore no children"
        },
        "death": {
            "tr": "KS 1197, huzur içinde ölüm",
            "en": "KS 1197, died peacefully"
        },
        "epoch": {"tr": "Kuruluş Çağı (1–3)", "en": "Era of Foundation (1–3)"},
        "character": {
            "tr": "Dindar, boyun eğmeyen, halkın barış özleminin temsilcisi; gücü kardeşiyle paylaşacak kadar pragmatik ama otoritesini asla tam bırakmayan; Sükun/Lomera ile özdeşleştirilir.",
            "en": "Pious, unyielding, embodiment of the commoners' yearning for peace; pragmatic enough to share governance with her brother yet never yielding sovereign supremacy; associated with Serenity Lomera."
        },
        "physical": {
            "tr": "Kuğu boyunlu, soylu ve sade duruşlu; tapınak beyazı cübbeler giyer; keskin elmacık kemikleri ve koyu kestane saçlarıyla babasının soy izlerini taşır.",
            "en": "Swan-necked, austere regal bearing; draped in sanctuary-white vestments; sharp cheekbones and dark chestnut hair reflecting the Stallhart bloodline."
        },
        "events": {
            "tr": "Eretay'ın Düşüşü (KS 1161): Arava başkent ilan edildi, krallık imparatorluğa dönüştü. Nadima-Garnor Sessiz İç Savaşı (KS 1161–1163): Nadima ruhani meşruiyeti, Garnor orduyu tuttu; KS 1163 uzlaşmasıyla Garnor Başvezir, Nadima ruhani lider oldu. Dini Reform: Denge Konseyi inancını kanunlaştırdı, Arava Sarayı içine babası için devasa İlteriş Anıtı'nı diktirdi. Zela'nın İlhakı (~KS 1172): Garnor fethetti, Nadima kutsadı.",
            "en": "Fall of Eretay (KS 1161): Arava proclaimed imperial capital, kingdom elevated to empire. Silent Civil War (KS 1161–1163): Compromise reached where Garnor commanded army as Grand Vizier while Nadima held absolute spiritual sovereignty. Religious Reform: Codified Council of the Even canons; erected massive Ilterish Monument inside Arava Palace. Annexation of Zela (~KS 1172): Garnor conquered, Nadima consecrated."
        },
        "controversies": {
            "tr": "Evlenip hiç çocuk doğurmaması vakanüvislerce kardeşinin hırsını kışkırtacak siyasi bir piyon yaratmama yemini olarak yorumlanır.",
            "en": "Her childless marriage is interpreted by court chroniclers as a calculated oath to prevent breeding pawns that would ignite her brother's ambition."
        },
        "notes": {
            "tr": "Tapınak restorasyonları sırasında pagan ve yasak İlk Anne Kültü'nün kadim mabetlerinin sistemli biçimde kazındığı iddia edilir.",
            "en": "Her sanctuary restorations are suspected of systematically effacing primordial shrines dedicated to the forbidden Cult of the First Mother."
        }
    },
    {
        "id": "i-garnor-stallhart",
        "num": 3,
        "name": {"tr": "Garnor Stallhart", "en": "Garnor Stallhart"},
        "epithets": {"tr": "Demir Vezir · Kılıcın Prensi", "en": "The Iron Vizier · Prince of the Sword"},
        "reign": "KS 1197–1204 (7 yıl)",
        "reign_en": "KS 1197–1204 (7 years)",
        "birth": {"tr": "KS 1138–1140 arası tahmin", "en": "Est. KS 1138–1140"},
        "nameMeaning": {
            "tr": "'Kuzeyin Kalkanı, Koruyucusu'",
            "en": "'Shield of the North, Protector'"
        },
        "lineage": {
            "tr": "Craes'in oğlu, Nadima'nın kardeşi; ~34–40 yıl başvezir ve başkomutan",
            "en": "Son of Craes, brother of Nadima; ~34–40 years Grand Vizier and supreme commander"
        },
        "family": {
            "tr": "Üç oğlu ve bir kızı (Prenses Zelen); halefi oğlu I. Lun Aldris",
            "en": "Three sons and one daughter (Princess Zelen); successor son Lun Aldris I"
        },
        "death": {
            "tr": "KS 1204, yatakta, yaşlılıktan",
            "en": "KS 1204, in bed from advanced age"
        },
        "epoch": {"tr": "Kuruluş Çağı (1–3)", "en": "Era of Foundation (1–3)"},
        "character": {
            "tr": "Pragmatik, soğukkanlı, savaş ateşi sönmüş; fatih değil kanun ve sınır mimarı. 'Ne babası gibi efsane ne ablası gibi aziz, ama kaosu düzene sokan Demir Vezir.'",
            "en": "Pragmatic, cold-blooded, battle fury banked into embers; not a conqueror but an architect of law and frontier. 'Neither myth like his father nor saint like his sister, but the Iron Vizier who bent chaos into order.'"
        },
        "physical": {
            "tr": "Yaşlı bir asker; dimdik duran kemikli omuzlar, sert elmacık kemikleri, kırlaşmış kestane saçlar ve demir gibi çelik bakışlar.",
            "en": "An aged soldier; rigid bone structure, sharp cheekbones, grizzled chestnut hair, and steely unblinking gaze."
        },
        "events": {
            "tr": "Galetsha'nın Bastırılması: İnatçı maden beylikleri Xora ve Exagna'yı generalleriyle ezdi; zengin maden gelirleri Arava hazinesine aktı. Veraset Fermanı: Tahtın inançla kılıç arasında kanlı savaşa dönmesini engellemek için 16 yaş ve valilik deneyimini şart koşan ilk veraset yasasını çıkardı.",
            "en": "Suppression of Galetsha: Crushed defiant mining fiefs Xora and Exagna via trusted generals; channeled rich veins into Arava treasury. Succession Decree: Enacted imperial law mandating 16-year age of majority and provincial governance experience to avert civil war."
        },
        "controversies": {
            "tr": "Tahta çıktığında neredeyse 60 yaşındaydı; 40 yıl ablasının gölgesinde beklemesi iktidar hırsının tükendiği izlenimini verse de devleti tamamen bürokratik bir mekanizmaya bağladı.",
            "en": "Ascended nearing sixty; four decades under his sister's shadow led contemporaries to think his fire spent, yet he systematically institutionalized the state."
        },
        "notes": {
            "tr": "Kızı Zelen'i verasetten dışlaması, ölümünden sonra tahtı 38 yıl boyunca sarsacak 'Kardeşin Gölgesi Savaşı'nın fitilini ateşlemiştir.",
            "en": "Sidelining daughter Princess Zelen from succession planted the sparks of the Shadow Sister War that plagued his heir's reign."
        }
    },
    {
        "id": "i-lun-aldris-stallhart",
        "num": 4,
        "name": {"tr": "I. Lun Aldris Stallhart", "en": "Lun Aldris Stallhart I"},
        "epithets": {"tr": "Reformcu · Ay Gözcüsü", "en": "The Reformer · Moonwatcher"},
        "reign": "KS 1204–1242 (38 yıl)",
        "reign_en": "KS 1204–1242 (38 years)",
        "birth": {"tr": "KS 1175 civarı", "en": "Circa KS 1175"},
        "nameMeaning": {
            "tr": "Lun (ay/gece) + Aldris (şahit/gözcü) → 'Ay Gözcüsü'",
            "en": "Lun (Moon/Night) + Aldris (Witness/Watcher) → 'Watcher of the Moon'"
        },
        "lineage": {
            "tr": "Garnor'un oğlu; ablası Prenses Zelen; kızı Scifella",
            "en": "Son of Garnor; elder sister Princess Zelen; daughter Scifella"
        },
        "family": {
            "tr": "Halefi kızı I. Scifella Stallhart; ablası taht rakibi Prenses Zelen",
            "en": "Successor daughter Scifella I; rival elder sister Princess Zelen"
        },
        "death": {
            "tr": "KS 1242, eceliyle",
            "en": "KS 1242, natural causes"
        },
        "epoch": {"tr": "Genişleme ve Reform (4–5)", "en": "Expansion & Reform (4–5)"},
        "character": {
            "tr": "Meşruiyetini savaşla kanıtlamak zorunda kalan, karada kesin zafer alamayınca denize ve ordu mühendisliğine yönelen hırslı reformcu; geceleri kâbuslar ve iç hayaletlerle boğuşur.",
            "en": "Forced to validate crown by sword; turning to naval supremacy and siegecraft when land stalemated; ambitious reformer haunted by nocturnal specters."
        },
        "physical": {
            "tr": "Uykusuzluktan koyulaşmış göz altları, keskin sorgulayıcı bakışlar; başında hilal işlemeli Ay Gözcüsü tacı; mühendis parşömenleri tutmaktan mürekkepli parmaklar.",
            "en": "Dark hollows under inquisitive eyes; crescent-engraved Moonwatcher circlet; fingers chronically stained with engineering charcoal and archival ink."
        },
        "events": {
            "tr": "Kardeşin Gölgesi Savaşı / Seltanya Seferleri (KS 1205–~1240): Ablası Zelen rakip Seltanya Prensi ile evlenip hak iddia etti; Beyaz Geçit Pususu (1208) ve Zelen Kalesi Kuşatması (1215). Gom Ara İlhakı (KS 1211): Yoren Muharebesi ile güneyi bağladı. Vlaupson Fethi (KS 1219): İlk kez istihkam ve mancınık birlikleri kullanıldı. Khasinya Deniz Zaferi (KS 1224): 60 gemilik donanmayla 100 parçalık korsan filosunu Safir Boğazı'nda imha etti. Adamen/Razva Paktı: Cüce eyaleti tek damla kan dökülmeden katıldı. Onneva'nın Teslimi (~KS 1240).",
            "en": "Shadow Sister War (KS 1205–~1240): Zelen claimed crown backed by Seltanya; White Pass Ambush (1208) and Zelen Siege (1215). Gom Ara Annexation (KS 1211): Smashed foes at Battle of Yoren. Conquest of Vlaupson (KS 1219): Introduced siege towers and artillery corps. Naval Triumph of Khasinya (KS 1224): Trapped 100 pirate galleys in Sapphire Strait. Adamen Pact: Dwarves joined without bloodshed. Submission of Onneva (~KS 1240)."
        },
        "controversies": {
            "tr": "Zelen'in kan davası ve taht şüphesi 35 yıl boyunca her sınır karakolunda fısıldandı; karada kazanamadığı kesinliği denizde kurdu.",
            "en": "Zelen's claim lingered for 35 years across every border outpost; what he could not consummate on land, he forged upon the open seas."
        },
        "notes": {
            "tr": "Mühendislik birliklerini ve vergi kayıt reformunu ilk kurumsallaştıran hükümdardır.",
            "en": "Pioneered imperial military engineering divisions and unified tax registry codices."
        }
    },
    {
        "id": "i-scifella-stallhart",
        "num": 5,
        "name": {"tr": "I. Scifella Stallhart", "en": "Scifella Stallhart I"},
        "epithets": {"tr": "Fatih", "en": "The Conqueror"},
        "reign": "KS 1242–1263 (21 yıl)",
        "reign_en": "KS 1242–1263 (21 years)",
        "birth": {"tr": "KS 1215 civarı", "en": "Circa KS 1215"},
        "nameMeaning": {
            "tr": "'Gölgeleri Yöneten / Sır İşleyen' (Tsha + Falar → Scifella)",
            "en": "'Ruler of Shadows / Weaver of Secrets' (Tsha + Falar → Scifella)"
        },
        "lineage": {
            "tr": "Lun Aldris'in kızı; Onneva Valisi; oğlu II. Craes",
            "en": "Daughter of Lun Aldris; Governor of Onneva; son Craes II"
        },
        "family": {
            "tr": "Zengin Solgar Devleti'nin yaşlı lideriyle siyasi evlilik; halefi oğlu II. Craes Stallhart",
            "en": "Dynastic marriage to aged ruler of Solgar; successor son Craes Stallhart II"
        },
        "death": {
            "tr": "KS 1263",
            "en": "KS 1263"
        },
        "epoch": {"tr": "Genişleme ve Reform (4–5)", "en": "Expansion & Reform (4–5)"},
        "character": {
            "tr": "Kararlı, hızlı, acımasız ve zeki; taht için kılıç çekmekten korkmayan ama evlilik ve miras gibi kansız hamleleri de ustalıkla uygulayan dahi bir fatih.",
            "en": "Decisive, ruthless, razor-sharp mind; unhesitating to draw steel for the crown yet wielding political marriage and inheritances with consummate genius."
        },
        "physical": {
            "tr": "Soğuk siyah gözler, kartal burun, ipek zırhlar içinde çevik ve tehditkâr bir silüet; parmaklarında gizli zehir hazneli yüzükler taşıdığı rivayet edilir.",
            "en": "Piercing onyx eyes, aquiline nose, lithe predator in silk-lined chainmail; rumored to wear rings with hidden poison reservoirs."
        },
        "events": {
            "tr": "Arava'nın Zaptı / Kordon Gecesi (KS 1242): Babasının ölümü saklanıp kukla kuzen tahta geçirilmek istenirken Onneva Ordusu'yla şehri bastı; kuzeni ve destekçilerini zindanda ipek kordonla boğdurdu (Stallhart kanının hanedan eliyle döküldüğü ilk resmî an). Seltanya Fethi (KS 1248–1249): 86 günlük kuşatmayla Seltan kralını diz çöktürdü ('Fatih' unvanı). Selya Deniz Seferi (KS 1253). Solgar'ın İlhakı (KS 1254): Evlilik yoluyla tek ok atılmadan katıldı. Pilkard Adası Fethi (KS 1258).",
            "en": "Seizure of Arava / Night of Cords (KS 1242): Thwarted court coup by marching Onneva legions into capital; strangled puppet cousin and oligarchs with silk cord (first dynastic blood spilt by Stallhart hands). Conquest of Seltanya (KS 1248–1249): 86-day combined siege, forced last king to kneel ('The Conqueror'). Selya Armada (KS 1253). Annexation of Solgar (KS 1254): Bloodless inheritance via marriage. Conquest of Pilkard Island (KS 1258)."
        },
        "controversies": {
            "tr": "Solgarlı evliliği geniş topraklar kazandırsa da oğlunun meşruiyetini sakatlayan 'Kırık Kalkan' krizinin tohumunu attı.",
            "en": "Her Solgar marriage enriched the crown but sowed the seeds of the 'Broken Shield' succession crisis that plagued her son."
        },
        "notes": {
            "tr": "Gölge Vezirliği / İstihbarat Teşkilatı'nın kurumsal temellerini bizzat atmıştır.",
            "en": "Founded the institutional blueprint of the Shadow Vizier spymaster network."
        }
    },
    {
        "id": "ii-craes-stallhart",
        "num": 6,
        "name": {"tr": "II. Craes Stallhart", "en": "Craes Stallhart II"},
        "epithets": {"tr": "Alim · Barışçıl", "en": "The Scholar · The Peaceful"},
        "reign": "KS 1263–1275 (12 yıl)",
        "reign_en": "KS 1263–1275 (12 years)",
        "birth": {"tr": "KS 1240 civarı", "en": "Circa KS 1240"},
        "nameMeaning": {
            "tr": "Dedesi I. Craes'in ismini taşır; 'Gerçeğin Eli'",
            "en": "Bears ancestor's name; 'Hand of Naked Truth'"
        },
        "lineage": {
            "tr": "I. Scifella'nın oğlu; Solgar kanı taşır; oğlu I. Atrion; kuzeni Mazurekt",
            "en": "Son of Scifella I; carries Solgar blood; son Atrion I; cousin Mazurekt"
        },
        "family": {
            "tr": "Oğlu ve intikamcısı I. Atrion Stallhart; kuzeni ve katili Mazurekt Stallhart",
            "en": "Son and avenger Atrion Stallhart I; cousin and murderer Mazurekt Stallhart"
        },
        "death": {
            "tr": "KS 1275, Büyük Kütüphane koridorlarında hançerlenerek",
            "en": "KS 1275, assassinated by daggers in the Great Library"
        },
        "epoch": {"tr": "Barış ve Gasp (6–8)", "en": "Peace & Usurpation (6–8)"},
        "character": {
            "tr": "Alim ruhlu, felsefe, sanat ve ticaret dostu; savaş meydanlarından kaçınır; meşruiyet şüphesi saltanatı boyunca üzerinde ağır bir gölge oldu.",
            "en": "Philosopher-king, devoted to sciences, arts, and maritime commerce; reviled war; lived under constant shadow of dynastic illegitimacy slurs."
        },
        "physical": {
            "tr": "Zarif, ince kemikli; Solgar kanını yansıtan buğday ten ve koyu dalgalı saçlar; altın varaklı okuma gözlüğü ve bilgin cübbesi.",
            "en": "Slender, graceful scholarly gait; olive Solgar complexion and dark curls; velvet robes and gold-rimmed reading loupes."
        },
        "events": {
            "tr": "Savaşmadı; saltanatı barış ve kültürle geçti. Başkentin karşı kıyısında mermerden Büyük Kütüphane'yi inşa ettirdi; sarayı kışladan akademiye çevirdi. Galantha Ada Devletleri ile ticaret anlaşmaları yaparak hazineyi doldurdu. Kırık Kalkan Krizi: Muhafazakarlar onu 'yarım Stallhart' saydı. Ölüm (KS 1275): Büyük Kütüphane'de suikastçılarca hançerlendi — kutsal kanın ilk kez akıtılması, doktrinin kırılabilir olduğunun kanıtı.",
            "en": "Fought no offensive wars; transformed court from barracks to academy. Erected the marble Great Library; established lucrative Galantha maritime treaties. Broken Shield Crisis: Conservatives ostracized him as 'half-Stallhart'. Assassination (KS 1275): Knifed in library corridors — first spilling of imperial blood, shattering the doctrine of inviolability."
        },
        "controversies": {
            "tr": "Suikastın arkasında yalnızca gaspçı Mazurekt mi vardı, yoksa Solgar karşıtı muhafazakar Dini Kademe mi? Tarihçiler hala tartışır.",
            "en": "Debate persists whether Mazurekt acted alone or served as blade for the reactionary religious hierarchy."
        },
        "notes": {
            "tr": "Bilge Veleris kütüphanelerinde adı hürmetle anılır; yok edilen parşömenlerin koruyucusudur.",
            "en": "Revered as patron in Veleris shrines; guardian of antique manuscripts lost in later fires."
        }
    },
    {
        "id": "mazurekt-stallhart",
        "num": 7,
        "name": {"tr": "Mazurekt Stallhart", "en": "Mazurekt Stallhart"},
        "epithets": {"tr": "Gaspçı", "en": "The Usurper"},
        "reign": "KS 1275 (~1 yıl)",
        "reign_en": "KS 1275 (~1 year)",
        "birth": {"tr": "KS 1238 civarı", "en": "Circa KS 1238"},
        "nameMeaning": {
            "tr": "'Karanlık Hırs / Gölgeli Pay'",
            "en": "'Shadowed Ambition / Dark Claimant'"
        },
        "lineage": {
            "tr": "II. Craes'in kuzeni; 'saf kan' savunusunu kullanan gaspçı",
            "en": "Cousin of Craes II; usurper exploiting 'pure blood' claims"
        },
        "family": {
            "tr": "Mazurekt kolu; Atrion'un affıyla Altın Kafes'te tutulan soy",
            "en": "Mazurekt cadet line; later quarantined under Golden Cage protocol"
        },
        "death": {
            "tr": "KS 1275, denizde yakalanıp gemi direğinde kanı dökülmeden boğularak idam",
            "en": "KS 1275, strangled at ship's mast without spilling blood"
        },
        "epoch": {"tr": "Barış ve Gasp (6–8)", "en": "Peace & Usurpation (6–8)"},
        "character": {
            "tr": "Fırsatçı, hesaplı; iktidar hırsını dini söylemle meşrulaştıran ama ne ordunun ne halkın sevgisini kazanabilen bir tiran adayı; İhtiras Tanrısı Hardir'in etkisinde anılır.",
            "en": "Opportunistic, calculating; couched megalomania in divine dogma yet won neither soldier nor peasant; remembered as pawn of Hardir the Insatiable."
        },
        "physical": {
            "tr": "Geniş çeneli, donuk gözlü, gösterişli zırhlar kuşanan ama savaş meydanında paniğe kapılan güvensiz bir duruş.",
            "en": "Heavy-jawed, hollow-eyed; adorned in gilded plate yet betraying frantic dread upon the retreat."
        },
        "events": {
            "tr": "II. Craes öldüğünde tahtı gaspedip 'saf kanı koruma ayini' ilan etti. Kızılçay Muharebesi (KS 1275 yazı): 40.000 kişilik Başkent Ordusu, Atrion'un 30.000'lik Meşruiyet Ordusu karşısında çöktü (Galetsha sancak indirip saf değiştirdi). Arava Kuşatması: Kaçarken limanda yakalandı; 'Kutsal Kan'ı çiğneyen adam olduğu için kanı dökülmeden boğduruldu.",
            "en": "Usurped throne declaring a 'rite of purification'. Battle of Red Creek (Summer KS 1275): His 40,000 capital troops routed by Atrion's 30,000 when Galetsha defected. Siege of Arava: Captured fleeing at harbor; strangled without drawing blood as punishment for desecrating divine dogma."
        },
        "controversies": {
            "tr": "Resmî tarih onu lanetli bir gaspçı olarak silse de soyundan gelenlerin 'Kayıp Soy' iddiasıyla gizli teşkilatlar kurduğu söylenir.",
            "en": "Struck from official records, yet rumors of his surviving cadet line fueled secretive cabals claiming true blood."
        },
        "notes": {
            "tr": "Kutsal Kan Doktrini'ni bizzat çiğnediği için kanı yere akıtılmadan direğe asılarak boğulması özel bir infaz ritüelidir.",
            "en": "Execution by cord at sea avoided shedding royal blood on earth, establishing an eerie precedent."
        }
    },
    {
        "id": "i-atrion-stallhart",
        "num": 8,
        "name": {"tr": "I. Atrion Stallhart", "en": "Atrion Stallhart I"},
        "epithets": {"tr": "Kurtarıcı · Asi", "en": "The Savior · The Rebel"},
        "reign": "KS 1275–1280 (5 yıl)",
        "reign_en": "KS 1275–1280 (5 years)",
        "birth": {"tr": "KS 1255 civarı", "en": "Circa KS 1255"},
        "nameMeaning": {
            "tr": "'Güneşin İradesi / Hak Sahibinin Kılıcı'",
            "en": "'Will of the Sun / Sword of the Rightful Heir'"
        },
        "lineage": {
            "tr": "II. Craes'in oğlu; babasının intikamcısı; halef oğlu Domkha Remal",
            "en": "Son of Craes II; avenger of his father; successor son Domkha Remal"
        },
        "family": {
            "tr": "Oğlu Domkha Remal Stallhart; kardeşleri ve müttefik lordlar",
            "en": "Son Domkha Remal Stallhart; brothers and loyal field commanders"
        },
        "death": {
            "tr": "KS 1280, genç yaşta amansız hastalıktan",
            "en": "KS 1280, untimely death from virulent fever"
        },
        "epoch": {"tr": "Barış ve Gasp (6–8)", "en": "Peace & Usurpation (6–8)"},
        "character": {
            "tr": "Derin siyasi zekâ ve affedicilik sahibi bir devlet adamı: 'Taht artık kılıçla değil kanun ve meşruiyetle korunacaktır.' Mazurekt'in ailesini bağışlayacak kadar olgun.",
            "en": "Gifted with profound statesmanship: 'Henceforth the throne shall be shielded by statute and legitimacy, not mere edge of steel.' Magnanimous in victory."
        },
        "physical": {
            "tr": "Genç, vakur, altın-kumral saçlı; babasının zarafeti ile dedesinin savaşçı omuzlarını birleştiren soylu bir lider.",
            "en": "Youthful, dignified, golden-brown hair; amalgam of his father's gentle elegance and grandfather's broad martial frame."
        },
        "events": {
            "tr": "Kızılçay zaferiyle başkente kurtarıcı olarak girdi. Merhamet Hamlesi: Mazurekt'in soyunu ve destekçilerini affetti; kardeşlerini kilit eyalet valiliklerine atadı. Sürgün Fermanı & Altın Kafes Metodu: Tehlikeli hanedan üyelerini saray çevresindeki lüks konaklarda göz hapsinde tutma geleneğini başlattı. İlk Anne Kültü'nü yasakladı (KS 1276–1278).",
            "en": "Entered Arava in triumph after Red Creek. Mercy Protocol: Pardoned Mazurekt's kin; placed loyal brothers in key governorships. Golden Cage Doctrine: Pioneered luxurious palace house arrest for volatile dynasts. Formally outlawed Cult of the First Mother (KS 1276–1278)."
        },
        "controversies": {
            "tr": "Ani ölümü (zehir mi, doğal humma mı?) sarayda büyük fısıltılara yol açtı; 'Kurtarıcı erken göçer' efsanesini doğurdu.",
            "en": "Sudden demise at age 25 sparked rumors of slow poison by remnant conspirators; cemented 'short-lived savior' mythos."
        },
        "notes": {
            "tr": "Altın Kafes metodu sonraki yüzyıllarda şehzade eğitim kurumuna evrilmiştir.",
            "en": "His Golden Cage containment later evolved into the imperial cadet academy system."
        }
    },
    {
        "id": "domkha-remal-stallhart",
        "num": 9,
        "name": {"tr": "Domkha Remal Stallhart", "en": "Domkha Remal Stallhart"},
        "epithets": {"tr": "Deniz Lordu (Domkha)", "en": "The Sea Lord (Domkha)"},
        "reign": "KS 1280–1305 (25 yıl)",
        "reign_en": "KS 1280–1305 (25 years)",
        "birth": {"tr": "KS 1262 civarı", "en": "Circa KS 1262"},
        "nameMeaning": {
            "tr": "Domkha: Kadim dilde 'Denizin Hükümdarı / Okyanus Fatihi'",
            "en": "Domkha: Archaic title meaning 'Master of Waters / Oceanic Conqueror'"
        },
        "lineage": {
            "tr": "I. Atrion'un oğlu; Seltanya Valisi kökenli; halef oğlu Merethorn",
            "en": "Son of Atrion I; former Governor of Seltanya; successor son Merethorn"
        },
        "family": {
            "tr": "Soylu olmayan bir cariye ile evlendi; Merethorn ve diğer oğullar",
            "en": "Wed an unfree concubine; sons Merethorn and cadet brothers"
        },
        "death": {
            "tr": "KS 1305, eşinin ölümünden bir yıl sonra kederden",
            "en": "KS 1305, grief-stricken one year following his consort's death"
        },
        "epoch": {"tr": "Deniz ve Zulüm (9–10)", "en": "Sea & Tyranny (9–10)"},
        "character": {
            "tr": "Vizyoner amiral-stratejist; aşkı ve ailesi uğruna din adamlarını ve köklü gelenekleri yakıp yıkacak kadar gözü kara ve tiranlaşabilen tutkulu hükümdar.",
            "en": "Visionary naval mastermind; fanatically devoted to his consort, ruthless enough to slaughter high priests to secure his sons' legitimacy."
        },
        "physical": {
            "tr": "Rüzgar ve tuzdan yanmış esmer ten, denizci dövmeleri, derin çelik-mavi gözler; lacivert amiral cübbesi ve altın çapa işlemeli kılıç.",
            "en": "Weatherbeaten salt-crusted visage, mariner tattoos, piercing navy eyes; admiral mantle with bullion anchor crests."
        },
        "events": {
            "tr": "Khasinya Ablukası & Ertae Antlaşması (40 gemi + 2.000 deniz piyadesi). Büyük Deniz Savaşı (KS 1285): 120+ parçalık Galantha ticaret filosunu Tuzlu Gözyaşı Denizi'nde batırıp teslim aldı ('Domkha'). Aşk ve Tiranlık: Cariye ile evlenip çocuklarını meşru varis ilan etti. Rahipler vaaz verince Büyük Tasfiye: Ulu Mabed'e bizzat askerle girdi, rahipleri idam ettirdi, yeni Yüce Rahip'e zorunlu meşruiyet fermanı çıkarttırdı (dini özerklik bitti).",
            "en": "Blockade of Khasinya & Ertae Treaty. Great Naval Battle (KS 1285): Annihilated 120 Galantha warships in Sea of Salty Tears ('Domkha'). Grand Purge: Stormed High Temple with marines, executed recalcitrant clergy, forced new Pontiff to sign decree validating his consort's sons."
        },
        "controversies": {
            "tr": "Mabed rahiplerinin topluca idamı, 'Sulanan Kan' krizinin fitilini ateşledi ve imparatorluk ailesine din adamlarının gizli kin beslemesine yol açtı.",
            "en": "The massacre of the priesthood broke spiritual autonomy forever, breeding quiet sectarian vengeance across provinces."
        },
        "notes": {
            "tr": "Eşinin adı resmî kayıtlardan silinmiş olsa da saray kütüphanesindeki aşk mektupları Stallhart edebiyatının en lirik parçalarıdır.",
            "en": "Though his consort's name was stricken from rolls, their private correspondence survives as romantic court literature."
        }
    },
    {
        "id": "i-merethorn-stallhart",
        "num": 10,
        "name": {"tr": "I. Merethorn Stallhart", "en": "Merethorn Stallhart I"},
        "epithets": {"tr": "Zalim · Acımasız", "en": "The Cruel · The Merciless"},
        "reign": "KS 1304/05–1344 (40 yıl)",
        "reign_en": "KS 1304/05–1344 (40 years)",
        "birth": {"tr": "KS 1284 civarı", "en": "Circa KS 1284"},
        "nameMeaning": {
            "tr": "'Ölümün Kılıcı / Kan İle Hükmeden'",
            "en": "'Blade of Demise / Sovereign by Blood'"
        },
        "lineage": {
            "tr": "Domkha Remal'in cariyesinden doğan en büyük oğlu; halef Reanloth",
            "en": "Eldest son of Domkha Remal by common consort; successor Reanloth"
        },
        "family": {
            "tr": "Büyük oğlu Prens Zilas (bizzat boğdurdu); hayatta kalan oğlu Reanloth",
            "en": "Elder son Prince Zilas (personally strangled); surviving son Reanloth"
        },
        "death": {
            "tr": "KS 1344, halkın ve sarayın laneti altında",
            "en": "KS 1344, died reviled by subjects and court"
        },
        "epoch": {"tr": "Deniz ve Zulüm (9–10)", "en": "Sea & Tyranny (9–10)"},
        "character": {
            "tr": "Saf savaşçı, paranoyak ve terörle yöneten tiran; 'piç' damgasını örtbas etmek için önüne gelen herkesi kılıçtan geçiren, kendi öz oğlunu dahi öldüren acımasız hükümdar.",
            "en": "Brutal warmonger, paranoid despot; compensated for 'bastard birth' slurs through bloodbaths, culminating in the execution of his own firstborn."
        },
        "physical": {
            "tr": "Devasa cüsseli, kara zırhlı, yaralı kalın boyun, kan çanağı gibi gözler; elinden düşürmediği çift ağızlı cellat kılıcı.",
            "en": "Massive hulking frame, black-enameled plate, bull neck scarred from combat, bloodshot eyes; perpetually bearing an executioner's broadsword."
        },
        "events": {
            "tr": "Örebas Seferi (KS 1306): 35.000 kişilik orduyla Alyoren'de Örebas'ı ezip Isonwell Antlaşması'nı imzalattı. Düzmece Craes Ayaklanması (KS 1307–1309): Arathen/Örebas fonlu 2 yıllık gerilla; Büyük Kütüphane fanatiklerce yakıldı; yüzlerce isyancı ve beceriksiz vezirin kellesini surlara çaktırdı. Prens Zilas'ı Taht Komplosu suçlamasıyla kendi elleriyle boğdurdu ('Oğul Katili').",
            "en": "Örebas Conquest (KS 1306): Crushed coalition at Alyoren, dictated Isonwell Treaty. Pseudo-Craes Uprising (KS 1307–1309): Foreign-backed guerrilla war; Great Library burnt; spiked heads of ministers on battlements. Personally throttled heir Prince Zilas for alleged conspiracy."
        },
        "controversies": {
            "tr": "İmparatorluk askeri ve coğrafi gücünün zirvesine çıksa da başkent Arava harabeye, Büyük Kütüphane ise kül yığınına dönmüştür.",
            "en": "Though military prestige soared, Arava was left half-ruined and the intellectual crown jewel reduced to cinders."
        },
        "notes": {
            "tr": "Zilas'ın Arathen ile gizli ittifak yapıp yapmadığı hiçbir zaman kanıtlanamadı; cinayet Reanloth'un içine kapanmasına yol açtı.",
            "en": "Whether Zilas genuinely plotted with Arathen remains unproven; the filicide permanently scarred younger son Reanloth."
        }
    },
    {
        "id": "reanloth-stallhart",
        "num": 11,
        "name": {"tr": "Reanloth Stallhart", "en": "Reanloth Stallhart"},
        "epithets": {"tr": "Sağır", "en": "The Deaf"},
        "reign": "KS 1344–1369 (25 yıl)",
        "reign_en": "KS 1344–1369 (25 years)",
        "birth": {"tr": "KS 1318 civarı", "en": "Circa KS 1318"},
        "nameMeaning": {
            "tr": "'Sessizliğin Muhafızı / Gizli İrade'",
            "en": "'Guardian of Silence / Hidden Will'"
        },
        "lineage": {
            "tr": "Merethorn'un hayatta kalan tek oğlu; ağabeyi Zilas'ın intikamcısı; halef II. Lun Aldris",
            "en": "Sole surviving son of Merethorn; brother of murdered Zilas; successor Lun Aldris II"
        },
        "family": {
            "tr": "En büyük oğlu II. Lun Aldris Stallhart ve diğer şehzadeler",
            "en": "Eldest son Lun Aldris Stallhart II and royal princes"
        },
        "death": {
            "tr": "KS 1369, kalp yetmezliği, yatakta",
            "en": "KS 1369, heart failure in his bed"
        },
        "epoch": {"tr": "Altın Çağ (11–12)", "en": "Golden Age (11–12)"},
        "character": {
            "tr": "Zayıflığını güce çeviren dirençli strateji ustası; ağabeyi Zilas'ın ölümünün travmasıyla büyümüş; sabırlı, derin gözlemci ve yeniden imar odaklı.",
            "en": "Converted sensory affliction into supreme tactical focus; scarred by brother's murder; immensely patient, observant architect of recovery."
        },
        "physical": {
            "tr": "Tamamen sağır; dudak okuma ve işaret dilinde uzmanlaşmış; derin keskin gözler; daima tetikte duran soğukkanlı ve asil bir çehre.",
            "en": "Stone deaf; mastered lip-reading and hand ciphers; intense piercing eyes; serene, vigilantly composed countenance."
        },
        "events": {
            "tr": "Megina Vadisi Felaketi (KS 1347): Melerya'nın kadim patlayıcı tuzakları komuta tepesini vurdu, kulak zarları yırtıldı (kalıcı sağırlık). Sessizliğin Silaha Dönüşmesi: Sarayda gizli bir işaret dili kurdu. Melerya'nın Fethi (KS 1351): Vadiyi denizden kuşatarak aldı. Kızılköprü Muharebesi (KS 1356): 40.000 askerle 30.000 Arathen akıncısını arkadan çevirip yok etti (Memanth ilhakı). Büyük Kütüphane'nin Yeniden İnşası (KS 1359–1364).",
            "en": "Megina Valley Trap (KS 1347): Blast traps ruptured eardrums, causing permanent deafness. Silence as a Weapon: Devised finger sign vocabulary. Subjugation of Melerya (KS 1351). Battle of Red Bridge (KS 1356): Outmaneuvered 30,000 Arathen raiders; annexed Memanth. Rebuilding of the Great Library (KS 1359–1364)."
        },
        "controversies": {
            "tr": "Babası Merethorn'un kanlı terör mirasını reddedip Veleris kütüphanelerini onarması, savaşçı generallerce başlangıçta zaaf sanıldı.",
            "en": "Repudiating Merethorn's terror in favor of patronizing scribes was initially decried by warlords as soft-heartedness."
        },
        "notes": {
            "tr": "Geliştirdiği işaret dili daha sonra casuslar ve Zeandor tarafından Selya'da kullanılmıştır.",
            "en": "His cipher hand language was later adopted by intelligence officers and mastered by Zeandor in exile."
        }
    },
    {
        "id": "ii-lun-aldris-stallhart",
        "num": 12,
        "name": {"tr": "II. Lun Aldris Stallhart", "en": "Lun Aldris Stallhart II"},
        "epithets": {"tr": "Şair", "en": "The Poet"},
        "reign": "KS 1369–1383 (14 yıl)",
        "reign_en": "KS 1369–1383 (14 years)",
        "birth": {"tr": "KS 1345 civarı", "en": "Circa KS 1345"},
        "nameMeaning": {
            "tr": "Dedesi I. Lun Aldris gibi 'Ay Gözcüsü'",
            "en": "Named after grandfather; 'Watcher of the Moon'"
        },
        "lineage": {
            "tr": "Reanloth'un en büyük oğlu; halef oğlu I. Jega Cal",
            "en": "Eldest son of Reanloth; successor son Jega Cal I"
        },
        "family": {
            "tr": "Oğulları Jega Cal, Gulon; kızı II. Nadima",
            "en": "Sons Jega Cal, Gulon; daughter Nadima II"
        },
        "death": {
            "tr": "KS 1383, veremden",
            "en": "KS 1383, of consumption (tuberculosis)"
        },
        "epoch": {"tr": "Altın Çağ (11–12)", "en": "Golden Age (11–12)"},
        "character": {
            "tr": "Şair ruhlu, lirik, felsefi derinliği olan ama sınırların aşırı genişlemesinin tehlikelerini gören trajik bir hükümdar; şiirleri saray koridorlarında ezberlenirdi.",
            "en": "Poet-sovereign, lyrical philosopher conscious of imperial overstretch; his sonnets and quatrains were chanted across the realm."
        },
        "physical": {
            "tr": "Solgun tenli, narin yapılı, melankolik kestane gözler; elinde parşömen rulosu, başında hafif zümrüt işlemeli çelenk taç.",
            "en": "Pale complexion, slender build, melancholic eyes; habitually carrying verse parchments, wearing an understated emerald garland."
        },
        "events": {
            "tr": "Burria Seferi (KS 1373): İkili Taht Paktı ile bölünmüş krallığı İkiz Tepe Geçidi Muharebesi'yle ilhak etti. İmparatorluk en geniş sınırlarına (14 milyon nüfus, 140.000 asker) ulaştı. 'Yeter' Fermanı: İmparatorluğun daha fazla genişlememesi gerektiğini ilan edip fetihleri durdurdu (Hakim Lidros'un sınırları). Altın Çağ: Sanat, bilim, lirik şiir dönemi yaşandı; ancak valiler kendi bölgelerinde özerkleşmeye başladı (Kırık Taç tohumları).",
            "en": "Burria Expedition (KS 1373): Exploited dynastic split, triumphed at Twin Peaks Pass; empire reached zenith (14 million souls, 140,000 standing host). 'Enough' Decree: Halted territorial expansion, declaring boundaries divine. Golden Age of culture, yet provincial governors degenerated into petty despots."
        },
        "controversies": {
            "tr": "'Yeter' Fermanı ordunun savaş iştahını kesmiş ve valilerin başkente hesap vermez hale gelmesine yol açarak Kırık Taç krizini doğurmuştur.",
            "en": "His 'Enough' decree curbed military morale, prompting provincial satraps to rule unchecked and sowing the Broken Crown anarchy."
        },
        "notes": {
            "tr": "Ortak Lisan'da yazdığı dörtlükler günümüzde Stallhart edebiyatının en seçkin klasikleri sayılır.",
            "en": "His Common Tongue poetry collections remain revered imperial literary classics."
        }
    },
    {
        "id": "i-jega-cal-stallhart",
        "num": 13,
        "name": {"tr": "I. Jega Cal Stallhart", "en": "Jega Cal Stallhart I"},
        "epithets": {"tr": "Talihsiz", "en": "The Ill-Fated"},
        "reign": "KS 1383–1388 (5 yıl)",
        "reign_en": "KS 1383–1388 (5 years)",
        "birth": {"tr": "KS 1359 (tahta çıktığında 24 yaşında)", "en": "KS 1359 (ascended at age 24)"},
        "nameMeaning": {
            "tr": "Jega (Hızlı/Aceleci) + Cal (Kılıç/Kıvılcım) → 'Tez Kılıç'",
            "en": "Jega (Swift/Hasty) + Cal (Blade/Spark) → 'Swift Blade'"
        },
        "lineage": {
            "tr": "II. Lun Aldris'in büyük oğlu; kardeşi Gulon; kız kardeşi II. Nadima",
            "en": "Eldest son of Lun Aldris II; brother Gulon; sister Nadima II"
        },
        "family": {
            "tr": "Gayrimeşru oğlu Lunrye ('Piç Kurt'); kardeşi hain Gulon",
            "en": "Illegitimate son Lunrye ('Bastard Wolf'); traitorous brother Gulon"
        },
        "death": {
            "tr": "KS 1388, Hibas Katliamı'nda savaş meydanında katledildi",
            "en": "KS 1388, slaughtered in Hibas Massacre"
        },
        "epoch": {"tr": "Kırık Taç Çağı (13–15)", "en": "Broken Crown Era (13–15)"},
        "character": {
            "tr": "Şair babasının aksine savaşçı dedesinin hırsını taşıyan, kendi fetih efsanesini yazmak isteyen ama kardeşinin ihanetine karşı saf ve savunmasız kalan talihsiz kral.",
            "en": "Spurned father's poetic passivity to chase warrior glory; eager to carve an epic name, fatally blind to sibling treachery."
        },
        "physical": {
            "tr": "Genç, kaslı, atılgan; altın rengi süvari zırhı ve miğferi; henüz sakalları yeni sertleşmiş bir delikanlı çehresi.",
            "en": "Athletic, dashing cavalry commander; gilded mail and crested helm; youthful visage barely grown into rugged stubble."
        },
        "events": {
            "tr": "Memanth Sınır Muhafızları'nı modernize etti. Flosenkha Seferi (KS 1388): Arathen'e karşı 90.000 kişilik ordu topladı. İhanet: Küçük kardeşi Onneva Valisi Gulon 30.000 askerle ordugâha girip İsyan Selamı yaptı. Hibas Katliamı: Jega kollarını açarken pusuya düşürüldü; General Kalberan ricat yolunu kesti; 10.000 askerle beraber Jega ve Başveziri meydanda doğrandı.",
            "en": "Fortified Memanth frontier against Arathen. Flosenkha Campaign (KS 1388): Mobilized 90,000 troops. Treachery: Brother Gulon rode in with 30,000 men and raised the Insurrection Salute. Hibas Massacre: Entrapped as he embraced his brother; cut down alongside his Grand Vizier and 10,000 loyalists."
        },
        "controversies": {
            "tr": "Kardeş kanı tabusu bu katliamla parçalandı; Gulon başkenti alamayıp Flosenkha'da zehirlense de hanedan Kırık Taç girdabına sürüklendi.",
            "en": "The slaughter broke the sibling blood taboo forever; though Gulon failed to seize Arava and died poisoned, the dynasty splintered."
        },
        "notes": {
            "tr": "Soylu olmayan bir kadından olan oğlu Lunrye sonradan babasının intikamını almak için ortaya çıkacaktır.",
            "en": "His unacknowledged son Lunrye would later emerge from the dust to avenge his murder."
        }
    },
    {
        "id": "ii-nadima-stallhart",
        "num": 14,
        "name": {"tr": "II. Nadima Stallhart", "en": "Nadima Stallhart II"},
        "epithets": {"tr": "Kış İmparatoriçesi", "en": "The Winter Empress"},
        "reign": "KS 1388–1398 (10 yıl)",
        "reign_en": "KS 1388–1398 (10 years)",
        "birth": {"tr": "KS 1364 civarı", "en": "Circa KS 1364"},
        "nameMeaning": {
            "tr": "'Kader Bağı'; adaşı I. Nadima'nın hatırasını taşır",
            "en": "'Bond of Destiny'; bears namesake of first Empress Nadima"
        },
        "lineage": {
            "tr": "Jega Cal ve Gulon'un kız kardeşi; Batı Ordusu Komutanı",
            "en": "Sister of Jega Cal and Gulon; Commander of the Western Host"
        },
        "family": {
            "tr": "Kocası General/Vali Ekdor",
            "en": "Husband General/Governor Ekdor"
        },
        "death": {
            "tr": "KS 1398",
            "en": "KS 1398"
        },
        "epoch": {"tr": "Kırık Taç Çağı (13–15)", "en": "Broken Crown Era (13–15)"},
        "character": {
            "tr": "Kriz anında şimşek gibi kararlı, sert, soğuk ve tavizsiz; ancak askerî erkânın erkek egemen yapısı ve Arathen akınları karşısında yalnız kalan hüzünlü kraliçe.",
            "en": "Fierce, unbending crisis ruler; yet isolated against patriarchal marshals and ruthless Arathen border incursions."
        },
        "physical": {
            "tr": "Kuğu gibi asil, porselen beyazı ten, derin hüzünlü ve buz gibi mavi gözler; siyah kadife taht elbisesi ve kürk pelerin.",
            "en": "Swan-like posture, alabaster skin, haunting ice-blue eyes; clad in black velvet mourning attire trimmed with ermine."
        },
        "events": {
            "tr": "Arava'nın Kurtarılışı (KS 1388): Kardeşi Jega'nın katledildiğini öğrenir öğrenmez Batı Ordusu'yla yıldırım yürüyüşü yapıp hain Gulon'dan önce başkente ulaştı. Divan 'oğul katili' ve 'gaspçı' lanetini hatırlayarak kapıları açtı. Gulon'un Arava Kuşatması'nı püskürttü. Kış İmparatoriçesi olarak 10 yıl boyunca Arathen akınlarıyla ve iç isyanlarla savaştı.",
            "en": "Rescue of Arava (KS 1388): Raced ahead of Gulon's traitor army to secure capital; Divan proclaimed her empress to avert usurper curse. Defeated Gulon's siege. Defended fractured frontiers against Arathen for a grueling decade."
        },
        "controversies": {
            "tr": "Karakter belgesindeki Imloth'un merhum eşi Selmira ile karıştırılmamalıdır; aralarında 50 yıllık kronolojik fark vardır.",
            "en": "Not to be confused with Imloth's consort Selmira; separated by over half a century in imperial chronology."
        },
        "notes": {
            "tr": "Halk onu 'Büyük Anne' I. Nadima ile kıyaslamış ve kışın ortasında devleti ayakta tuttuğu için 'Kış İmparatoriçesi' lakabını vermiştir.",
            "en": "Remembered as the lonely bulwark who held the throne intact amidst the dynasty's bitterest winter."
        }
    },
    {
        "id": "lunrye-stallhart",
        "num": 15,
        "name": {"tr": "Lunrye Stallhart", "en": "Lunrye Stallhart"},
        "epithets": {"tr": "Piç Kurt · Piç İmparator", "en": "The Bastard Wolf · The Bastard Emperor"},
        "reign": "KS 1398–1406 (8 yıl)",
        "reign_en": "KS 1398–1406 (8 years)",
        "birth": {"tr": "KS 1378 civarı", "en": "Circa KS 1378"},
        "nameMeaning": {
            "tr": "Lun (Gece/Ay) + Rye (Vahşi/Kurt) → 'Gecenin Kurdu'",
            "en": "Lun (Moon/Night) + Rye (Wild/Wolf) → 'Wolf of the Night'"
        },
        "lineage": {
            "tr": "Jega Cal'ın gayrimeşru oğlu; annesi soylu değil; oğlu II. Remal",
            "en": "Natural son of Jega Cal by commoner mother; son Remal II"
        },
        "family": {
            "tr": "Oğlu ve halefi II. Remal Stallhart",
            "en": "Son and successor Remal Stallhart II"
        },
        "death": {
            "tr": "KS 1406, yatakta, basit hastalıktan",
            "en": "KS 1406, in bed from sudden fever"
        },
        "epoch": {"tr": "Kırık Taç Çağı (13–15)", "en": "Broken Crown Era (13–15)"},
        "character": {
            "tr": "Askerî dehası tartışılmaz, meşruiyeti şüpheli; süratli, acımasız, korkuyla itaat sağlayan ama halkın kahraman olarak kucakladığı kurt tabiatlı hükümdar.",
            "en": "Indisputable tactical genius, ambiguous bloodline; swift, merciless, enforcing dread yet beloved by commoners as an avenging folk hero."
        },
        "physical": {
            "tr": "Vahşi bakışlı, keskin kemikli, sert duruşlu; yüzünde çatışma izleri; gri kurt kürkü pelerini ve hafif deri süvari zırhı.",
            "en": "Feral amber gaze, rugged cheekbones, sinewy warrior stature; wolf-pelt cloak over notched cuirass."
        },
        "events": {
            "tr": "Dayırmon Zaferi (KS 1398): Babası Jega'nın katillerini ezip başkente intikamcı olarak girdi; Kırık Taç Çağı'na son verdi. Selya İsyanları'nı şimşek baskınlarla bastırdı. Gümüş Yol Denizi'nin korsanlardan temizlenmesi. Ardera Krallığı Fethi (KS 1402): 70.000 kişilik orduyla atalarının alamadığı krallığı ilhak etti. Pilkard Adası Kuşatması'ndaki başarısızlık tek yenilgisidir.",
            "en": "Dayirmon Victory (KS 1398): Avenged father Jega, entered Arava as a triumphant liberator, ending the Broken Crown anarchy. Crushed Selya insurgencies. Cleared pirate havens across Silver Sea. Conquest of Ardera (KS 1402) with 70,000 host. Repelled only at Pilkard cliffs."
        },
        "controversies": {
            "tr": "Soylular onu 'piç' diye küçümsese de kılıcının kudreti ve halkın desteği karşısında boyun eğmek zorunda kalmışlardır.",
            "en": "Aristocrats sneered at his bastardy in private, yet knelt before his unstoppable shock cavalry."
        },
        "notes": {
            "tr": "Ölümü sonrası oğlu II. Remal'in 'Sulanan Kan Fermanı' ile hanedan hukukuna girmesini sağlamıştır.",
            "en": "His reign paved the way for his son's epochal Diluted Blood Decree."
        }
    },
    {
        "id": "ii-remal-stallhart",
        "num": 16,
        "name": {"tr": "II. Remal Stallhart", "en": "Remal Stallhart II"},
        "epithets": {"tr": "Sulanan Kan", "en": "The Diluted Blood"},
        "reign": "KS 1406–1411/12 (5–6 yıl)",
        "reign_en": "KS 1406–1411/12 (5–6 years)",
        "birth": {"tr": "KS 1390 civarı", "en": "Circa KS 1390"},
        "nameMeaning": {
            "tr": "Dedesi Domkha Remal'in adını taşır; deniz ve dalga",
            "en": "Named after Domkha Remal; of tide and wave"
        },
        "lineage": {
            "tr": "Lunrye'nin oğlu; 'piç torunu' damgasıyla tahta çıkan hükümdar",
            "en": "Son of Lunrye; burdened with the 'grandson of a bastard' stigma"
        },
        "family": {
            "tr": "Halefi Rones 'Demiryumruk' Alvro (kan bağı yok, Kurultay seçimi)",
            "en": "Successor Rones 'Ironfist' Alvro (no blood tie, chosen by Kurultay)"
        },
        "death": {
            "tr": "KS 1411/12, Mabed ayininde kutsal şarap içtikten sonra avda attan düşerek ölüm",
            "en": "KS 1411/12, fell from horseback following sacred temple communion"
        },
        "epoch": {"tr": "Kara Delik / Demir Çağı (16–18)", "en": "The Dark Void / Iron Age (16–18)"},
        "character": {
            "tr": "Meşruiyet paranoyasıyla yaşayan, kuşkucu, kırılgan; tahtını korumak için arşivleri ve kütüphaneleri cellatlara taratan trajik hükümdar.",
            "en": "Consumed by paranoia over dynastic blood purity; fragile, suspicious; deployed inquisitors to pore over genealogy archives to hunt conspirators."
        },
        "physical": {
            "tr": "Geleneksel ağır saray zırhı ve altın taht cübbesi; sürekli titreyen parmaklar, solgun beniz, tedirgin bakışlar.",
            "en": "Clad in cumbersome ancestral armor and ermine robes; nervous tremor in his hands, sallow tense visage."
        },
        "events": {
            "tr": "Sulanan Kan Fermanı: 'Bir nehir denizlere karışsa da kaynağını unutmaz; Stallhart'ın en cılız damlası, yabancı bir tacın en saf ırmağından daha kutsaldır.' Onneva ve Memanth valilerinin kızlarını sarayda rehin tuttu. Kızıl Vadi Çarpışması: Arathen akıncılarına karşı bizzat ordunun başında durdu. Ölümü (KS 1411): Kutsal şarabın ardından avda ölmesi 'Mabed'in intikamı' fısıltılarını doğurdu.",
            "en": "Diluted Blood Decree: 'Though a river mingles with oceans, it forgets not its spring; the frailest drop of Stallhart blood is holier than the purest surge of a foreign crown.' Held provincial daughters hostage. Repelled Arathen in Red Valley. Died suddenly on a hunt after drinking communion wine."
        },
        "controversies": {
            "tr": "Resmî Yıllıklar onu büyük bir meşruiyet restoratörü olarak överken, Mahzen El Yazması kütüphaneleri yağmalatıp masum soyluları ipe gönderen bir deli olarak betimler.",
            "en": "Official chronicles praise his legal reforms, while clandestine cellar scrolls depict an unhinged ruler hanging nobles over forged genealogies."
        },
        "notes": {
            "tr": "Ölümüyle hanedanın doğrudan erkek kolu kesilmiş ve Kurultay asker kökenli Rones'u seçmiştir.",
            "en": "His childless death severed direct agnatic lineage, opening the way for soldier-statesman Rones Alvro."
        }
    },
    {
        "id": "rones",
        "num": 17,
        "name": {"tr": "Rones 'Demiryumruk' Alvro Stallhart", "en": "Rones 'Ironfist' Alvro Stallhart"},
        "epithets": {"tr": "Demiryumruk", "en": "The Iron Fist"},
        "reign": "KS 1411/12–1441 (29–30 yıl)",
        "reign_en": "KS 1411/12–1441 (29–30 years)",
        "birth": {"tr": "KS 1378 civarı", "en": "Circa KS 1378"},
        "nameMeaning": {
            "tr": "Alvro (Alvis + Rho) → 'Şafaksüvarisi'",
            "en": "Alvro (Alvis + Rho) → 'Dawn Rider / Knight of the Sun'"
        },
        "lineage": {
            "tr": "Solgar sınır garnizonlarında sıradan Yagbu; doğrudan kan bağı yok; Kurultay seçimi",
            "en": "Frontier Yagbu from Solgar outposts; no direct lineage tie; chosen by the Grand Kurultay"
        },
        "family": {
            "tr": "Oğlu ve halefi Elron Stallhart",
            "en": "Son and successor Elron Stallhart"
        },
        "death": {
            "tr": "KS 1441, yatakta, yaşlılıktan (60+); halk üç gün yas tuttu",
            "en": "KS 1441, of old age (60+); three days of empire-wide mourning"
        },
        "epoch": {"tr": "Kara Delik / Demir Çağı (16–18)", "en": "The Dark Void / Iron Age (16–18)"},
        "character": {
            "tr": "Otoriter, disiplinli, tek merkezli gücün son büyük temsilcisi; 'Kim bu kaosu durdurabilir?' sorusuna 'Ben' diyebilecek kudrette sarsılmaz bir irade.",
            "en": "Stern, autocratic titan of centralized authority; answered Kurultay's plea 'Who shall halt this chaos?' with a singular roar: 'I.'"
        },
        "physical": {
            "tr": "Geniş omuzlar, dik mağrur duruş, kurşun gibi ağır bir ses; parmağında masaya vurduğu iri yakut yüzük; omzunda savaş sancağı gibi dalgalanan siyah pelerin.",
            "en": "Broad-shouldered colossus, commanding leaden voice; heavy ruby signet ring he slammed on tables; mantle draped like a captured battle banner."
        },
        "events": {
            "tr": "Hesap Fermanı (KS 1412–1416): Tüm valilerin son 30 yılın vergi defterlerini ve servetlerini denetletti; itiraz eden üç valiyi sürdü. Burria Seferi (KS 1419): 35.000 askerle güneye indi, Burria'yı haraca bağladı ve Prens'i sadık Melik tanıdı. Arathen Seferleri (KS 1421–1431): Üç sınır seferiyle Memanth hattını tahkim etti ve on yıllık 'buzlu barış' dönemini açtı (son coğrafi genişleme).",
            "en": "Decree of the Ledger (KS 1412–1416): Audited 30 years of provincial graft, expropriating and exiling three defiant governors. Burria March (KS 1419): Bound Burria into vassal tribute. Arathen Frontier Wars (KS 1421–1431): Secured eastern border, inaugurating the ten-year 'Icy Peace' (the empire's final expansion)."
        },
        "controversies": {
            "tr": "Taşranın Bedeli: Lougat Beyi'nin notlarında tarladaki buğdayın, ahırdaki ineğin dahi zorla toplandığı ve halkın ağır vergi altında ezildiği anlatılır.",
            "en": "The Bitter Cost of Provincial Stability: Clandestine diaries describe grain and livestock ruthlessly seized by tax collectors to feed the central treasury."
        },
        "notes": {
            "tr": "Kayıp Mühür teorisine konu olan efsanevi Stallhart yüzüğü onun döneminde kaybolmuştur.",
            "en": "Subject of the famous Lost Seal lore box regarding dynastic legitimacy relics."
        }
    },
    {
        "id": "elron",
        "num": 18,
        "name": {"tr": "Elron Stallhart", "en": "Elron Stallhart"},
        "epithets": {"tr": "Barışsever", "en": "The Peacemaker"},
        "reign": "KS 1441–1451/52 (10–11 yıl)",
        "reign_en": "KS 1441–1451/52 (10–11 years)",
        "birth": {"tr": "KS 1405 civarı", "en": "Circa KS 1405"},
        "nameMeaning": {
            "tr": "'Yıldızların Sükûneti / Dingin Yol'",
            "en": "'Serenity of Stars / Gentle Path'"
        },
        "lineage": {
            "tr": "Rones Alvro'nun oğlu; Solgar Valisi kökenli; oğulları Imloth ve Amadon",
            "en": "Son of Rones Alvro; former Governor of Solgar; sons Imloth and Amadon"
        },
        "family": {
            "tr": "Büyük oğlu Imloth, küçük oğlu Amadon",
            "en": "Elder son Imloth, younger son Amadon"
        },
        "death": {
            "tr": "KS 1451, uykusunda",
            "en": "KS 1451, died in his sleep"
        },
        "epoch": {"tr": "Kara Delik / Demir Çağı (16–18)", "en": "The Dark Void / Iron Age (16–18)"},
        "character": {
            "tr": "Narin, yorgun, savaş naralarından ve vergi kavgalarından nefret eden, Arava bahçelerinde huzur arayan iyi niyetli ama zayıf ve kırılgan hükümdar.",
            "en": "Gentle, frail, loathing the roar of battle and tax disputes; spent his days seeking solace in palace rose gardens; well-meaning but tragically weak."
        },
        "physical": {
            "tr": "İnce, narin, tahtın altında ezilen kırılgan bir silüet; yorgun ela gözler, beyaz ipek kaftanlar ve dökülen seyrek kumral saçlar.",
            "en": "Slender silhouette dwarfed by the massive iron throne; weary hazel eyes, flowing white silk tunics, thinning hair."
        },
        "events": {
            "tr": "Kridas-Stallhart Sükûn Paktı: Rones'un 'buzlu barışı'nı resmî antlaşmaya döktü; bazı eski sınır topraklarını para karşılığı Arathen'e terk etti. Gevşeyen Dizginler: Hesap Fermanı'nı terk etti; valiler kendi eyaletlerinde bağımsız hareket etmeye başladı. Burria'nın Kalıcı Kaybı (~KS 1447): Burria sessizce koptu, ordu gönderilemedi. İki Oğul İkilemi: 'Imloth bana tahtı miras bırakacak, Amadon ise halkın kalbini.'",
            "en": "Pact of Serenity: Solidified peace with Kridas dynasty, conceding border territories for indemnities. Loosening Reins: Abandoned the Audit Decrees, letting governors rule unchecked. Loss of Burria (~KS 1447): Burria severed ties without retaliation. The Sibling Prophecy: 'Imloth shall inherit my crown; Amadon, the heart of my people.'"
        },
        "controversies": {
            "tr": "Üç Kuşak Sarkacı'nın yumuşak halkasıdır; babası Rones'un demir yumruğunun açtığı yaraları sarmaya çalışırken devleti felce uğratmıştır.",
            "en": "The soft arc in the Three-Generation Pendulum; in seeking balm for his father's iron excesses, he paralyzed central rule."
        },
        "notes": {
            "tr": "Karakter belgelerinde bazen 'III. Elron' veya 'Eski İmparator' olarak anılır.",
            "en": "Referred to in archival variants as 'Elron III' or 'The Elder Sovereign'."
        }
    },
    {
        "id": "imloth",
        "num": 19,
        "name": {"tr": "Imloth Stallhart", "en": "Imloth Stallhart"},
        "epithets": {"tr": "Tembel · Derin Tuzak", "en": "The Sloth · The Deep Snare"},
        "reign": "KS 1451–1466 (15 yıl)",
        "reign_en": "KS 1451–1466 (15 years)",
        "birth": {"tr": "KS 1425 civarı", "en": "Circa KS 1425"},
        "nameMeaning": {
            "tr": "Nim (derin/alt) + Loth (illüzyon/tuzak) → 'Derin Tuzak / Gölge Oyunu'",
            "en": "Nim (Deep/Under) + Loth (Illusion/Snare) → 'Deep Snare / Shadow Play'"
        },
        "lineage": {
            "tr": "Elron'un büyük oğlu; eşi Selmira; oğlu Zeandor (KS 1458)",
            "en": "Eldest son of Elron; consort Selmira; son Zeandor (KS 1458)"
        },
        "family": {
            "tr": "Eşi Selmira (doğumda öldü); oğlu Zeandor; kardeşi Amadon",
            "en": "Consort Selmira (died in childbirth); son Zeandor; brother Amadon"
        },
        "death": {
            "tr": "KS 1466, 'Bölüm - Son Nefes'",
            "en": "KS 1466, 'Chapter - Final Breath'"
        },
        "epoch": {"tr": "Ana Roman Çağı (19–21)", "en": "Main Chronicle Era (19–21)"},
        "character": {
            "tr": "Dış siyasette pasif, iç siyasette etkisiz; devlet işlerini tamamen Hilnor Wolde gibi danışmanlara bırakan, şarap ve uyuşukluğa gömülü, kardeşi Amadon'u kıskanan paranoyak bir figür.",
            "en": "Passive in foreign diplomacy, indolent in governance; surrendered realm to bureaucratic viziers; sunken in wine and melancholia, deeply jealous of brother Amadon."
        },
        "physical": {
            "tr": "İri yapılı ama kas yerine rahat yaşamın ağırlığı; kel, özel parfümlü yağlarla parlatılmış kafa; yorgun, kayıtsız gözler; teni bembeyaz ve saydam. Adli eşkâl: ~50–60 yaş, brakisefalik, heterojen hazel iris, geniş uzun burun, derin nazolabial çizgiler, sol yanakta belirgin ben, kısa gri-beyaz kirli sakal.",
            "en": "Heavy-set, flesh softened by court indulgence; bald scalp gleaming with oils; indifferent hazel eyes; translucent pale skin. Forensic record: brachycephalic skull, prominent left cheek mole, short grizzled beard."
        },
        "events": {
            "tr": "Saray koridorlarından başka toprak tanımadı. Selmira'nın Ölümü (KS 1458): Zeandor'u doğururken kan kaybından ölmesiyle vicdan azabına gömüldü. Kıskançlık: Amadon'un halk sevgisini hazmedemeyip onu Seltanya'ya sürdü. Ölüm Döşeği (KS 1466): Kardeşi Amadon'u veliaht tayin etti ve tek bir kutsal şart koştu: 'Zeandor'un canını bağışlayacaksın.'",
            "en": "Knew only palace corridors. Consort's Death (KS 1458): Selmira perished delivering Zeandor, driving him into guilt and stupor. Banished brother Amadon to distant governorship out of envy. Deathbed (KS 1466): Named Amadon heir on a solitary sacred condition: 'Spare Zeandor's life.'"
        },
        "controversies": {
            "tr": "Resmî lakabı 'Tembel' olsa da bazı gizli arşivlerde 'Derin Tuzak' adıyla gizli bir saray istihbarat ağını yürüttüğü iddia edilir.",
            "en": "Officially derided as 'The Sloth', though clandestine texts hint 'The Deep Snare' was a spymaster codename."
        },
        "notes": {
            "tr": "Selmira ile Amadon arasındaki gizli yakınlık iması, Zeandor'un gerçek babası sorusunu doğuran en büyük saray dedikodusudur.",
            "en": "Whispers of tender affinity between Selmira and Amadon fueled enduring palace speculation on Zeandor's true paternity."
        }
    },
    {
        "id": "amadon",
        "num": 20,
        "name": {"tr": "Amadon Stallhart", "en": "Amadon Stallhart"},
        "epithets": {"tr": "Enkazın Hükümdarı · Gökyüzü Çeliği", "en": "Ruler of the Ruin · Sky Steel"},
        "reign": "KS 1466–1480 (14 yıl)",
        "reign_en": "KS 1466–1480 (14 years)",
        "birth": {"tr": "KS 1435 civarı", "en": "Circa KS 1435"},
        "nameMeaning": {
            "tr": "'Gök Çeliği'",
            "en": "'Sky Steel / Celestial Blade'"
        },
        "lineage": {
            "tr": "Elron'un küçük oğlu, Imloth'un kardeşi; Seltanya/Selya Meliği, Yagbu, Anxes",
            "en": "Younger son of Elron, brother of Imloth; Melik, Yagbu, Anxes"
        },
        "family": {
            "tr": "Eşi Meryen; vebada ölen oğlu Lunin, küçük oğlu Lun Aldris; yeğeni Zeandor",
            "en": "Wife Meryen; firstborn Lunin (died of plague), infant son Lun Aldris; nephew Zeandor"
        },
        "death": {
            "tr": "KS 1480, ilerleyici hastalık ve zehir şüphesi",
            "en": "KS 1480, degenerative illness and suspected slow poison"
        },
        "epoch": {"tr": "Ana Roman Çağı (19–21)", "en": "Main Chronicle Era (19–21)"},
        "character": {
            "tr": "Gençken halkla iç içe, adil, sabırlı ve sevilen bir kahraman; saltanatının ikinci yarısında hastalıklar, evlat acısı, veba ve saray entrikalarıyla paranoyak bir tirana dönüşen trajik hükümdar.",
            "en": "Beloved champion of commoners in youth; transformed by plague, loss of his son, and court vipers into an agonizingly suspicious autocrat."
        },
        "physical": {
            "tr": "Genç: omuza dökülen dalgalı kestane saç, uzun kırık burun, gece mavisi şahin gözler, geniş omuz, kumral-kızıl kısa sakal. Yaşlı: kürk pelerinli, iri ve sert hatlı, tuz-biber saç/sakal; hastalık evresinde lavanta ve çürüme kokusu, morarmış parmaklar, eklem sızıları.",
            "en": "Youth: wavy chestnut tresses over shoulders, hawkish night-blue eyes, broad shoulders. Old age: fur-lined mantles, salt-and-pepper beard, swollen joints, smelling of lavender water and bodily decay."
        },
        "events": {
            "tr": "Imloth'un ölümüyle tahta çıktı. Edun Solgar'ı Başvezir, dostu Hiles Vizelar'ı İç İşleri Veziri yaptı. Zeandor'u Selya'ya vali yaptı (abisine verdiği söz gereği korudu). Büyük Salgın (KS 1470–1471): Kıtasal vebada oğlu Lunin öldü. Başkomutan Olinder Albea suikastı (1476). Erthan İsyanı: Zeandor'a görev verdi; isyan bastırıldı. Mühürlü Vasiyetler: 'Ben öldüğümde bu zarfı herkesin gözü önünde aç.' Ölümü sonrası Edun'un Lun Aldris darbesi boşa çıkarıldı, Zeandor tahta çıktı.",
            "en": "Ascended upon Imloth's passing. Appointed Edun Solgar Grand Vizier and trusted Hiles Interior Minister. Exiled Zeandor to Selya to preserve his oath. Continental Plague (KS 1470–1471): Lost heir Lunin. Murder of Marshal Albea (1476). Erthan Rebellion: Dispatched Zeandor. The Sealed Testaments: Engineered post-mortem succession checkmating Edun Solgar's coup."
        },
        "controversies": {
            "tr": "Tahtı hatasız kılmak için yola çıkıp nefret ettiği abisinin paranoyasına düşmesi ve Zeandor'a duyduğu hem şefkat hem kıskançlık trajedisidir.",
            "en": "Tragic irony of striving for flawless governance only to replicate his brother's dark paranoia, torn between love and dread for Zeandor."
        },
        "notes": {
            "tr": "Ölüm döşeğindeki gizli vasiyetleri ve 'Ay' rüyası kehaneti romanın ana kırılma noktasıdır.",
            "en": "His sealed deathbed missives and the Lunar dream prophecy form the linchpin of the chronicle."
        }
    },
    {
        "id": "zeandor",
        "num": 21,
        "name": {"tr": "Zeandor Stallhart", "en": "Zeandor Stallhart"},
        "epithets": {"tr": "Yarının Hükümdarı · Hak Edilen Prens · Sürgünün Oğlu", "en": "Ruler of Tomorrow · The Rightful Prince · Son of Exile"},
        "reign": "KS 1480–1491 (imparatorluğun çöküşü)",
        "reign_en": "KS 1480–1491 (dissolution of the empire)",
        "birth": {"tr": "KS 1458, Arava ('Bölüm - Elçi'); annesi Selmira doğumda öldü", "en": "KS 1458, Arava; mother Selmira died delivering him"},
        "nameMeaning": {
            "tr": "'Kutsal Işığın Mirası'",
            "en": "'Legacy of Sacred Light'"
        },
        "lineage": {
            "tr": "Imloth ve Selmira'nın oğlu; Selya Meliki; Stallhart'ın son imparatoru",
            "en": "Son of Imloth and Selmira; Melik of Selya; last Stallhart Emperor"
        },
        "family": {
            "tr": "Celios Selya (hocası), Liaher Selya (dostu), Elyndra Selya (gizli aşkı), Miran / Erthan",
            "en": "Celios Selya (mentor), Liaher Selya (comrade), Elyndra Selya (clandestine love), Miran / Erthan"
        },
        "death": {
            "tr": "KS 1491 sonrası (Anlatı açık uçlu; Moloz Çağı başlangıcı)",
            "en": "Post-KS 1491 (Fate left open in Moloz Era)"
        },
        "epoch": {"tr": "Ana Roman Çağı (19–21)", "en": "Main Chronicle Era (19–21)"},
        "character": {
            "tr": "Adil, halkla iç içe, stratejik deha ve mühendislik meraklısı; çabuk alevlenen, duygusal, insanların hakkında ne düşündüğüne aşırı önem veren; kör kahinin kehanetini reddedecek kadar iradeli.",
            "en": "Righteous, grounded among laborers, master engineer-strategist; quick-tempered yet deeply compassionate; defying blind omens with fierce autonomy."
        },
        "physical": {
            "tr": "Çocukken zift karası saç; yetişkinde kıvırcık koyu kahve-siyah saç, buz mavisi irisler (koyu lacivert limbal halka; heterokromik kehribar-mavi geçiş), ince beden, kare çene (ortada dikey yarık), keskin zigomatik kemikler, burun kemerinde Khasin'in kırbacından kalma asimetrik çıkıntı; 22–28 yaş, düşük yağ oranı.",
            "en": "Dark curls, hypnotic ice-blue irises encircled by navy limbal rings (heterochromic flecks of amber); athletic lean frame, chiseled square jaw with cleft, sharp cheekbones, dorsal nasal bump from a whip lash in youth."
        },
        "events": {
            "tr": "9 yaşında Selya'ya sürgün; limanlarda vinç tasarımı yaptı, halkla yaşadı. Karagöl Çetesi Baskını (KS 1476): Kara Hodrev'i öldürdü. Erthan İsyanı (KS 1477): Bakırsu Uzlaşması ile çözdü. Tahta Çıkış (KS 1480): Amadon'un vasiyetiyle taç giydi; Edun Solgar'ı sürdü. Büyük Çöküş: Arathen Kralı Leno Kridas kuşatma topları ve büyücülerle saldırdı (KS 1487); KS 1490 Seltanya, KS 1491 Solgaria ve Onneva bağımsızlığını ilan etti; imparatorluk yıkıldı, Moloz Çağı başladı.",
            "en": "Exiled to Selya at age 9; laboured with shipwrights, engineered harbor crane systems. Blacklake Raid (KS 1476): Slew bandit chief Hodrev. Erthan Revolt (KS 1477): Settled via Bakirsu Accord. Coronation (KS 1480): Banished Edun Solgar. Imperial Collapse: King Leno Kridas invaded with siege artillery (KS 1487); provinces seceded, heralding the Moloz Era."
        },
        "controversies": {
            "tr": "Kör kahinin 'Bir domuz tarafından deşileceksin' kehaneti; Erthan'ın akıbeti (idam mı, gizli müttefik mi?); Leno Kridas'ın Büyü Yasağı'nı çiğnemesi.",
            "en": "The blind seer's ominous warning 'You shall be gored by a boar'; ambiguous fate of rebel leader Erthan; breach of ancient magic bans by Arathen."
        },
        "notes": {
            "tr": "Romanın ana kahramanıdır; akıbeti Moloz Çağı'nın külleri arasında efsaneleşmiştir.",
            "en": "The central protagonist of The Stallhart Saga; his ultimate destiny fades into legendary lore."
        }
    }
]

def update_characters_json():
    with open('data/characters.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    chars = data.get('characters', [])
    char_map = {c['id']: c for c in chars}

    for emp in EMPERORS_DATA:
        cid = emp['id']
        c = char_map.get(cid)
        if not c:
            c = {
                "id": cid,
                "group": "stallhart",
                "status": "historical" if emp['num'] < 21 else "alive",
                "name": emp['name'],
                "house": {"tr": "İmparatorluk Hanedanı", "en": "Imperial Dynasty"},
                "title": {"tr": f"{emp['num']}. İmparator", "en": f"Emperor {emp['num']}"},
                "birth": emp['birth'],
                "alleg": {"tr": "Stallhart İmparatorluğu", "en": "Stallhart Empire"},
                "epi": emp['epithets'],
                "quote": {"tr": "", "en": ""},
                "bio": emp['events'],
                "allies": [],
                "enemies": [],
                "chapters": [],
                "image": f"assets/images/characters/{cid}.png" if os.path.exists(f"assets/images/characters/{cid}.png") else "",
                "weapon": {"tr": "", "en": ""}
            }
            chars.append(c)
            char_map[cid] = c

        # Enrich fields with full document fidelity
        c['name'] = emp['name']
        c['epi'] = emp['epithets']
        c['nameMeaning'] = emp['nameMeaning']
        c['kinship'] = emp['family']
        c['reignNote'] = {
            "tr": f"Saltanat: {emp['reign']} · Ölüm: {emp['death']['tr']}",
            "en": f"Reign: {emp['reign_en']} · Demise: {emp['death']['en']}"
        }
        c['bio'] = emp['events']
        c['characterTraits'] = emp['character']
        c['physical'] = emp['physical']
        c['controversies'] = emp['controversies']
        c['chroniclerNotes'] = emp['notes']
        c['epoch'] = emp['epoch']
        c['emperorNumber'] = emp['num']

    data['characters'] = chars
    with open('data/characters.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Successfully updated data/characters.json with {len(EMPERORS_DATA)} emperors.")

if __name__ == '__main__':
    update_characters_json()
