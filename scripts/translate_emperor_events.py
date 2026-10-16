#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Populates English translations for the 53 historical events of the Stallhart Emperors
in data/lore.json with full literary fidelity, matching the 15-page chronicle.
"""

import json

TRANSLATIONS = {
    "ev-eyyros-seferi-birlesme-ve-i-lk-fetih-0": {
        "en_name": "Eyyros Campaign: Unification and the First Conquest",
        "en_desc": "Witnessing the regional power vacuum, Craes began uniting the fractured lordships under his banner. The fledgling host met its first true test against the neighboring Kingdom of Eyyros under the tyrannical King Theron. Craes's United Clans army (~7,000 men) clashed with Theron's force (~5,000 men) at Silver River Pass. Theron attempted an ambush in the narrow defile, but Craes foresaw the trap, deployed a vanguard detachment as bait, and routed the enemy flanks, annexing Eyyros into the burgeoning realm."
    },
    "ev-i-lk-n-rdal-savasi-ve-darova-felaketi-1": {
        "en_name": "First Nýrdal War and the Darova Disaster",
        "en_desc": "Craes's growing union became an undeniable threat to the eastern Nýrdal Kingdom. The ~10,000-strong Stallhart army marched against a heavily armored, seasoned host of ~15,000 Nýrdal warriors under King Rogan. At the Darova Plains, the Stallhart light cavalry was overwhelmed by heavy lancers and brutal weather. Craes suffered a catastrophic defeat: his beloved younger brother fell in combat, Craes lost his left eye, and he was taken captive to spend five harrowing years in King Rogan's subterranean dungeons."
    },
    "ev-kutsal-kacis-ve-kralligin-dogusu-2": {
        "en_name": "The Sacred Escape and the Rise of the Kingdom",
        "en_desc": "After five grueling winters, Craes returned with one eye and an unbreakable will. He proclaimed his miraculous liberation: 'The gods guided my hand. The Hunter revealed the dungeon pathway; the Aegis warded my flesh from their blades.' This religious aura transformed dispersed clans into a zealous religious-military crusade. With his veterans, he rallied the realm, officially proclaimed the Kingdom of Stallhart, and commenced the Second Nýrdal War."
    },
    "ev-kardesin-golgesi-savasi-seltanya-seferle-9": {
        "en_name": "War of the Brother's Shadow — The Seltanya Campaigns",
        "en_desc": "Fought not in a single pitched battle, but through decades of bloody border clashes, fortress sieges, and wars of attrition; no decisive victory was achieved. The Kingdom of Seltanya, with its jagged mountain terrain and iron-willed mountain infantry, repelled imperial legions again and again. Lun Aldris transformed this brutal conflict into an imperial proving ground, developing siege engines, professional supply columns, and mountain reconnaissance companies."
    },
    "ev-gom-ara-nin-i-lhaki-guneye-i-nis-10": {
        "en_name": "Annexation of Gom Ara: The Southern Descent",
        "en_desc": "Exhausted by northern stalemates, Lun Aldris turned his gaze toward the fertile southern realm of Gom Ara. The reformed ~15,000-strong Stallhart army, forewarned by master spies of defense layouts, struck swiftly. Rather than facing devastating trench defenses, imperial shock troops crossed the swift waters by pontoon bridge at night and forced the regional lords into submission, granting the Empire vital granaries."
    },
    "ev-vlaupson-fethi-sehirlerin-dususu-11": {
        "en_name": "Conquest of Vlaupson: Fall of the Merchant Cities",
        "en_desc": "The wealthy yet militarily vulnerable Vlaupson City-States along the western frontier frequently subsidized anti-imperial pacts with Seltanya. Lun Aldris deployed his newly formed corps of siege engineers and sappers. Breaching fortified stone walls with counterweight catapults and mining galleries, he captured the merchant capitals one by one, incorporating vast banking treasuries into the Crown's direct revenues."
    },
    "ev-khasinya-deniz-savasi-donanmanin-zaferi-12": {
        "en_name": "Khasinya Naval Battle: Triumph of the Imperial Fleet",
        "en_desc": "Corsairs from the island principality of Khasinya continually preyed upon newly opened maritime merchant routes. The imperial fleet of ~60 galleys and war sloops anticipated an ambush within the narrow Sapphire Strait. By turning wind and current to their advantage, the flagship line rammed and splintered the pirate armada, securing maritime dominance over the inner straits."
    },
    "ev-taht-i-cin-yuruyus-arava-nin-zapti-13": {
        "en_name": "March on the Throne: Seizure of Arava",
        "en_desc": "Without hesitation, Princess Scifella mobilized the disciplined Onneva Provincial Host loyal to her command and marched upon the capital Arava with lightning speed. While her courtly rival cousin and factional supporters were still quarreling over ministerial appointments, Scifella surrounded the citadel, forced the palace gates open, executed key conspirators on the marble steps, and had herself crowned Empress by iron right."
    },
    "ev-kizilcay-muharebesi-18": {
        "en_name": "Battle of Kızılçay (The Red River)",
        "en_desc": "Prince Atrion, eldest son of the murdered II. Craes, refused to bend the knee to the usurper Mazurekt. Rallied under the banner of legitimate blood, loyalist legions met Mazurekt's veteran shock troops along the red clay banks of the Kızılçay. After a grueling dawn-to-dusk melee that turned the river scarlet with blood, Atrion's cavalry broke the usurper's center, securing the rightful line of succession."
    },
    "ev-merhamet-hamlesi-i-c-savasin-kullerini-t-20": {
        "en_name": "Move of Mercy: Cleansing Civil War Ashes",
        "en_desc": "Defying bloodthirsty demands from court hardliners, Emperor Atrion granted conditional pardons to the defeated usurper's kinsmen and auxiliary vassals rather than ordering wholesale executions. This was no naive softness but profound statesmanship: by preventing retaliatory vendettas, he bound fractured border houses to the Crown, averting another decade of ruinous civil war."
    },
    "ev-buyuk-deniz-savasi-galantha-nin-diz-coku-24": {
        "en_name": "Great Naval Battle: The Submission of Galantha",
        "en_desc": "Emperor Remal unleashed the expanded imperial armada against the maritime realm of Galantha. In a monumental engagement involving hundreds of warships, fire-galleys, and heavy ballista barges, imperial admirals broke the enemy line, burned the opposing flagship, and forced the Grand Duke of Galantha to sign an unconditional treaty ceding port duties to the Stallhart Throne."
    },
    "ev-orebas-seferi-i-mparatorlugun-zirvesi-26": {
        "en_name": "Örebas Campaign: Apex of Empire",
        "en_desc": "Commanded in person by Emperor Merethorn I, imperial legions conducted a vast expedition into the mineral-rich mountain fastnesses of Örebas. Overcoming fierce highland resistance, harsh blizzards, and fortress redoubts, the campaign cemented the Empire's territorial boundaries at their greatest historical extent, bringing lucrative silver veins and marble quarries under direct Crown rule."
    },
    "ev-i-lk-sefer-megina-vadisi-felaketi-29": {
        "en_name": "First Campaign: The Megina Valley Disaster",
        "en_desc": "Youthful and eager to prove his martial courage, Reanloth led his army deep into the treacherous gorges of Megina Valley. Hidden enemy archers and rockslides encircled his vanguard. The Emperor was struck down, his vocal cords ruptured by a jagged arrow, and the legions routed in disarray—an agonizing defeat that left Reanloth permanently mute and consumed by cold, methodical vengeance."
    },
    "ev-arathen-savasi-kizilkopru-muharebesi-31": {
        "en_name": "Arathen War: Battle of Redbridge",
        "en_desc": "Seeking retribution for past humiliations, the mute Emperor Reanloth launched an iron strike against the rival Kingdom of Arathen. At the strategic crossing of Redbridge, imperial pikemen held the narrow stone span against ferocious cavalry charges while concealed archers rained fire from the bluffs, breaking the Arathen royal army and dictating harsh vassalage terms."
    },
    "ev-son-fetih-burria-seferi-32": {
        "en_name": "The Final Conquest: The Burria Campaign",
        "en_desc": "Emperor Lun Aldris II spearheaded the subjugation of the proud southern border principality of Burria. Utilizing overwhelming siege machinery, diplomatic isolation of local lords, and coordinated multi-column advances, the campaign brought the last uncommitted regional province under imperial sovereignty, marking the final major offensive expansion in Stallhart history."
    },
    "ev-flosenkha-seferi-ve-i-hanet-35": {
        "en_name": "The Flosenkha Campaign and Betrayal",
        "en_desc": "Emperor Jega Cal embarked on a dangerous foreign campaign into the coastal marshes of Flosenkha. While engaged with hostiles on the front line, treason struck from behind: his ambitious kinsman Gulon conspired with disaffected field commanders, severing the supply trains and abandoning the Emperor's household guard to slaughter."
    },
    "ev-i-kinci-n-rdalsavasi-kurucu-nun-i-ntikam-3": {
        "en_name": "Second Nýrdal War: The Founder's Vengeance",
        "en_desc": "Following his miraculous return from captivity, I. Craes reorganized his forces into the first professional Imperial Legions. Over two years of unrelenting warfare, he battered Nýrdal's outer garrisons, outmaneuvered King Rogan's elite cavalry, captured the ancestral border keeps, and forced Nýrdal into a punitive peace treaty that recognized Stallhart primacy across the central plains."
    },
    "ev-eretay-savunmasi-son-direnis-4": {
        "en_name": "The Defense of Eretay: The Founder's Last Stand",
        "en_desc": "During the twilight years of the Founder's reign, a massive coalition of dispossessed feudal remnants and barbarian marauders besieged the frontier bastion of Eretay. Despite crippling battle wounds and failing health, the elderly Craes commanded the ramparts in person, holding the perimeter until relief legions arrived to shatter the siege."
    },
    "ev-nadima-garnor-sessiz-i-c-savasi-5": {
        "en_name": "Nadima-Garnor Silent Civil War",
        "en_desc": "Upon the death of I. Craes, a venomous succession dispute erupted between Empress Nadima I and her ambitious brother Prince Garnor. Avoiding destructive open warfare that would tear the young realm apart, the siblings waged a shadowy war of assassinations, court patronage, and provincial allegiance, culminating in a pragmatic power-sharing concordat."
    },
    "ev-galetsha-nin-bastirilmasi-7": {
        "en_name": "Pacification of Galetsha",
        "en_desc": "During the reign of Garnor Stallhart, the powerful northern marcher lordships of Galetsha revolted against royal tithes and centralization. Garnor responded with methodical ruthlessness: seven years of sieges, fort-building, and economic blockades broke the rebel nobility's defiance, establishing hereditary governorships answerable directly to the crown."
    },
    "ev-buyuk-savas-seltanya-nin-fethi-14": {
        "en_name": "The Great War: Conquest of Seltanya",
        "en_desc": "Empress Scifella resolved the centurylong imperial obsession by mounting a colossal invasion of the mountain kingdom of Seltanya. Employing scorched-earth logistics, elite mountain corps, and relentless winter assaults, Scifella stormed their cliffside capital, dethroned their dynasty, and integrated Seltanya as an imperial province under martial law."
    },
    "ev-alimin-saltanati-baris-donemi-16": {
        "en_name": "Reign of the Scholar: The Era of Peace",
        "en_desc": "Emperor Craes II, renowned as 'The Scholar' and 'The Peaceful', governed the empire for twelve tranquil winters without initiating an aggressive war. He devoted imperial revenues to the construction of the Great Library of Arava, legal codified charters, and agricultural canal systems, inaugurating the high imperial civil renaissance."
    },
    "ev-baskent-i-syani-duzmece-craes-ayaklanmas-27": {
        "en_name": "Capital Rebellion: The False Craes Uprising",
        "en_desc": "A charismatic demagogue claiming to be the resurrected Founder Craes rallied thousands of urban poor, disenfranchised guilds, and religious zealots in the capital Arava. Emperor Merethorn I faced a violent insurrection at the palace gates; after days of bloody street fighting, the imperial guard crushed the revolt, and the ringleaders were executed."
    },
    "ev-buyuk-salgin-kitasal-kiyamet-48": {
        "en_name": "The Great Plague / Continental Apocalypse",
        "en_desc": "During the late reign of Emperor Amadon Stallhart, a catastrophic virulent pestilence swept across the continent. Entire cities were decimated, trade networks collapsed, and harvest failure plunged the provinces into starvation, fracturing the socio-economic foundations of the Empire and driving the grief-stricken Emperor into severe paranoia."
    },
    "ev-dini-reform-anit-ve-fetihler-6": {
        "en_name": "Religious Reforms, Monuments and Consolidations",
        "en_desc": "Empress Nadima I codified the divine lineage of House Stallhart, instituting state rites honoring the Aegis Galdra and the Council of Balance. She financed grand basalt temples, paved imperial highways, and established the Divine Decrees that elevated the monarch from feudal overlord to consecrated living sovereign."
    },
    "ev-veraset-fermani-8": {
        "en_name": "Imperial Succession Decree of Garnor",
        "en_desc": "Determined to eliminate ambiguity in the imperial succession, Emperor Garnor issued a landmark constitutional decree: the throne could pass strictly through verified elder bloodline, prioritizing proven administrative capability and military command, ending tribal election traditions among regional warlords."
    },
    "ev-diger-seferler-genislemenin-devami-15": {
        "en_name": "Further Expeditions: Expansion Unbound",
        "en_desc": "Following the fall of Seltanya, Empress Scifella dispatched expeditionary armies to secure outer marches, subdue border raiders, and construct coastal watchtowers, cementing Stallhart supremacy across both slopes of the great divide."
    },
    "ev-i-c-catisma-kirik-kalkan-17": {
        "en_name": "Internal Clashes: The Broken Shield",
        "en_desc": "Factions of hawkish generals dissatisfied with Craes II's pacifist policies secretly funded provincial border skirmishes to provoke war. Craes II dismantled the cabal with quiet judicial tribunals and financial audits rather than public executions, preserving domestic tranquility at the cost of simmering military resentment."
    },
    "ev-arava-kusatmasi-ve-gaspci-nin-sonu-19": {
        "en_name": "Siege of Arava and End of the Usurper",
        "en_desc": "Following victory at the Red River, Prince Atrion surrounded the capital Arava where the usurper Mazurekt had fortified himself. After weeks of bombardment and palace infiltration, Mazurekt was cornered in the throne room and slain, restoring the legitimate branch of the dynasty."
    },
    "ev-reform-savaslari-gelecekteki-krizleri-on-21": {
        "en_name": "Wars of Reform: Preempting Dynastic Crises",
        "en_desc": "Emperor Atrion I reorganized provincial levies into standing regional corps answerable only to the central Divan. Minor baronial uprisings against central taxation were efficiently suppressed, instituting the Golden Cage policy wherein cadet branches were hosted at court as honored guests and subtle hostages."
    },
    "ev-i-nanc-krizinin-bastirilmasi-22": {
        "en_name": "Suppression of the Faith Crisis",
        "en_desc": "Propaganda questioning the theological legitimacy of the throne following the civil war stirred fanatic unrest across traditionalist provinces. Atrion combined diplomacy and decisive displays of ecclesiastical authority, convening the Synod of Arava to reaffirm the Divine Mandate of House Stallhart."
    },
    "ev-kiyilarin-pasifize-edilmesi-khasinya-abl-23": {
        "en_name": "Coastal Pacification: Blockade of Khasinya",
        "en_desc": "Emperor Remal transformed the fleet from a seasonal coastguard into a permanent blue-water navy. Quelling unrest in the maritime marches, imperial squadrons instituted a yearlong naval blockade of the pirate-sheltering roadsteads of Khasinya, compelling the islanders to accept imperial naval inspectors."
    },
    "ev-ask-ve-tiranlik-i-c-cephedeki-savas-25": {
        "en_name": "Love and Tyranny: War on the Domestic Front",
        "en_desc": "Shattering centuries of dynastic protocol, Emperor Remal married a lowborn palace consort instead of a noble heiress and legitimized their offspring as imperial heirs. When high nobility protested, Remal responded with iron decrees, stripping dissenting councilors of estates and exiling obstinate grandees."
    },
    "ev-i-bretlik-ceza-ve-prens-zilas-in-olumu-28": {
        "en_name": "Exemplary Punishment and the Death of Prince Zilas",
        "en_desc": "To deter future insurrections following the False Craes revolt, Merethorn I mounted the severed heads of the conspirators along Arava's outer walls for months. Later in his reign, when his own son Prince Zilas was implicated in a treasonous court conspiracy, Merethorn demonstrated cold dynastic primacy by enforcing his execution."
    },
    "ev-i-ntikam-seferleri-sessizligin-uyanisi-30": {
        "en_name": "Retaliation Campaigns: Awakening of the Silent",
        "en_desc": "Physical silence stripped away all distractions for Emperor Reanloth, sharpening his intellect onto cold strategic vengeance. He spent years reforming weapon foundries and logistics, unleashing a wave of punitive expeditions that systematically eradicated the warlords who had laid the trap at Megina Valley."
    },
    "ev-yeter-fermani-ve-i-mparatorlugun-zirvesi-33": {
        "en_name": "The Decree of 'Enough' and the Empire's Zenith",
        "en_desc": "Gazing upon maps stretching from ocean to ocean, Lun Aldris II felt deep foreboding rather than vanity. Recognizing that overextension would crush the imperial apparatus, he took an unprecedented step in world history: he officially proclaimed the Decree of 'Enough', halting offensive foreign conquests to focus entirely on governance, culture, and internal stability."
    },
    "ev-altin-cag-ve-cokusun-tohumlari-34": {
        "en_name": "The Golden Age and the Seeds of Decay",
        "en_desc": "Emperor Lun Aldris II spent the remainder of his long reign patronizing arts, architecture, philosophy, and poetry. Arava blossomed with lyric halls and botanical courtyards. Yet peace dulled the military reflexes of the legions, and provincial nobles grew accustomed to luxury, sowing the quiet seeds of future decline."
    },
    "ev-hibas-katliami-ve-i-mparatorun-dususu-36": {
        "en_name": "The Hibas Massacre and the Emperor's Downfall",
        "en_desc": "Ambushed by the rebel army of Prince Gulon near the hamlet of Hibas, the loyalist household guard of Emperor Jega Cal was encircled and butchered in an atrocity that claimed ~10,000 lives. Abandoned by treasonous field marshals, Jega Cal died fighting sword in hand, plunging the realm into dynastic chaos."
    },
    "ev-gulon-un-kusatmasi-ve-sonu-37": {
        "en_name": "The Siege of Gulon and His Demise",
        "en_desc": "The usurper Gulon marched his mutinous host upon Arava to claim the vacant throne, but was halted by the impenetrable walls defended by Empress Nadima II. As the siege foundered, loyalist reinforcements took Gulon's army in the rear, annihilating his host and executing the traitor before the Golden Gate."
    },
    "ev-kis-i-mparatoricesi-nin-mucadelesi-38": {
        "en_name": "The Struggle of the Winter Empress",
        "en_desc": "The reign of Nadima II, remembered as the 'Winter Empress', was beset by unrelenting domestic adversity and external invasions from the eastern kingdom of Arathen. Deprived of unanimous military support due to court misogyny, she nevertheless defended the borders through sheer strategic grit and austere financial stewardship."
    },
    "ev-selya-i-syanlari-39": {
        "en_name": "The Selya Rebellions",
        "en_desc": "Refusing to accept the legitimacy of the disputed sovereign, the maritime province of Selya—cradle of the imperial navy—revolted in open defiance. Emperor Lunrye marched forces south, fighting savage counter-insurgency battles along canals, estuary fortresses, and coastal harbors to restore imperial control."
    },
    "ev-gumus-yol-denizi-nin-temizligi-40": {
        "en_name": "Cleansing of the Silver Way Sea",
        "en_desc": "Capitalizing on the civil war, pirate cartels turned the vital trade waters between Stallhart, Melerya, and Galantha into lawless hunting grounds. Emperor Lunrye refurbished mothballed galleys and personally directed an aggressive maritime sweep that cleared the sealanes and restored imperial tariffs."
    },
    "ev-pilkard-kusatmasi-basarisizlik-41": {
        "en_name": "Siege of Pilkard: An Operational Setback",
        "en_desc": "Seeking to project imperial sea power outward, Lunrye laid siege to the fortified island haven of Pilkard. However, unfamiliarity with treacherous tidal shoals and seasonal gales crippled the naval siege lines, inflicting a humbling tactical defeat that exposed the limits of imperial naval reach."
    },
    "ev-buyuk-kan-fermani-resm-anlati-suphenin-m-42": {
        "en_name": "The Great Blood Decree (Official Narrative: 'Seal of Suspicion')",
        "en_desc": "Upon his ascension, II. Remal promulgated the Great Blood Decree, declaring that the sacred bloodline of Stallhart stood elevated above every secular title, guild charter, and provincial charter. His six-winter reign was defined by merciless tribunals targeting suspected traitors, cementing an atmosphere of paranoid surveillance throughout the imperial bureaucracy."
    },
    "ev-merkezi-otoritenin-zirvesi-43": {
        "en_name": "Apex of Central Authority: Iron Grip of Rones II",
        "en_desc": "Emperor Rones II Alvro dismantled the autonomy of rebellious provincial governors, enforcing strict tax censuses that filled the imperial treasury to overflowing with gold coinage. During his thirty winters, neither foreign spies nor defiant feudal barons dared test the will of the Arava Divan."
    },
    "ev-tasranin-bedeli-lougat-beyi-nin-gizli-no-44": {
        "en_name": "The Cost of the Provinces (Secret Notes of the Lord of Lougat)",
        "en_desc": "While court chroniclers lauded Rones II's reign as a golden era of order, provinces such as Lougat bore a ruinous burden: harvest requisitioning, forced military levies, and the draining of local coin caused silent desperation and buried resentments that would burst open in subsequent reigns."
    },
    "ev-gevseyen-dizginler-ve-sulh-yanilgisi-45": {
        "en_name": "Slackened Reins and the Illusion of Peace",
        "en_desc": "Throughout his eleven-winter reign, Emperor Elron III consistently surrendered imperial prerogatives during border disputes, demobilized garrisons, and confined legions to quarters in pursuit of quietude. This perceived weakness emboldened powerful provincial rulers in Adamen and Galetsha to disregard imperial authority."
    },
    "ev-i-ki-oglun-zit-yolu-46": {
        "en_name": "Divergent Paths of Two Imperial Sons",
        "en_desc": "Tired of statecraft and courtly intrigues, Elron III sought refuge in poetry and palace gardens, while his two royal sons embarked upon diametrically opposed destinies: one adhering to aristocratic scholasticism, the other embracing martial command and conspiratorial circles in the outer provinces."
    },
    "ev-tasranin-cureti-47": {
        "en_name": "Audacity of the Provinces",
        "en_desc": "A intercepted covert missive from the Governor of Adamen to the Margrave of Galetsha encapsulated the era: 'The Iron Fist is finally in the earth, and Elron who inherited the throne does not cast a tenth of his father's shadow... The hour has come for the provinces to reclaim what was stolen.' Feudal tax withholdings and border insubordination surged."
    },
    "ev-trajedilerin-birikimi-ve-tirana-donusum-49": {
        "en_name": "Accumulation of Tragedies and Descent into Tyranny",
        "en_desc": "Once an equitable and patient governor in his youth, Emperor Amadon was pushed over the brink of madness upon ascending the throne by a cascade of tragedies: the early death of his son Prince Lunin, the assassination of Grand Marshal Olinder Albea, and the lethal treason of his closest friend Hilmar. Consumed by suspicion, he instituted reign-of-terror purges across the court."
    },
    "ev-selya-donemi-ve-i-lk-askeri-operasyonlar-50": {
        "en_name": "The Selya Period and Early Military Operations",
        "en_desc": "The raid on the Karagöl Outlaw Band (KS 1476) represented Prince Zeandor's first command in Selya. That same fraught year witnessed the execution of Count Fihor Arhan (KS 1476) and the assassination of Grand Marshal Olinder Albea, plunging the coastal marches into volatile instability."
    },
    "ev-erthan-i-syani-ve-bakirsu-uzlasmasi-51": {
        "en_name": "The Erthan Rebellion and the Bakırsu Concordat",
        "en_desc": "Following the ambush of the Solgar provincial army at the Whisper Gorge in KS 1477, the insurgent chieftain Erthan was proclaimed 'Legitimate Governor' by rebel clans. Zeandor defused the crisis without bloodshed through a clandestine pact—the Bakırsu Concordat—promising provincial tax autonomy in exchange for symbolic submission."
    },
    "ev-taht-ve-sonrasi-i-mparatorlugun-son-yill-52": {
        "en_name": "The Throne and Beyond: Twilight Years of Empire",
        "en_desc": "In KS 1480, Zeandor ascended the throne following the death of his uncle Amadon ('Chapter — The Emperor'). Having pacified the Erthan rebellion, he earned the titles 'The True Heir', 'Sovereign of Tomorrow', and 'The Deserved Prince', navigating the twilight years of the Stallhart dynasty amid simmering intrigues at the Blind Crab Tavern."
    }
}

def update_lore_events():
    with open('data/lore.json', 'r', encoding='utf-8') as f:
        lore = json.load(f)
    
    events = lore.get('events', [])
    updated = 0
    for e in events:
        eid = e.get('id')
        if eid in TRANSLATIONS:
            t = TRANSLATIONS[eid]
            e['name']['en'] = t['en_name']
            e['desc']['en'] = t['en_desc']
            updated += 1
            
    with open('data/lore.json', 'w', encoding='utf-8') as f:
        json.dump(lore, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully populated English translations for {updated} events in data/lore.json.")

if __name__ == '__main__':
    update_lore_events()
