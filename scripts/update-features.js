import fs from 'fs';

const mapsPath = 'data/maps.json';
const d = JSON.parse(fs.readFileSync(mapsPath, 'utf8'));
const m = d.maps[0];

const newFeatures = {
  sehir: [
    { id: 'arava', name: 'Arava (Başkent)', x: 3050, y: 2570, desc: { tr: 'İmparatorluk tahtının bulunduğu başkent; Niron Nehri ile Gümüş Yol kıyısında kurulan kudretli yönetim merkezi.', en: 'Imperial seat and mighty administrative capital founded on the banks of Niron River and Silver Way.' } },
    { id: 'garall', name: 'Garall Boğazı & Kalesi', x: 3053, y: 2755, desc: { tr: 'Niron Nehri ile Gümüş Yol\'un birleştiği kıtanın en dar stratejik geçidi ve boğaz hisarı.', en: 'Continent\'s narrowest strait where Niron meets Silver Way, guarded by an ancient fortress.' } },
    { id: 'arava-sur', name: 'Arava Dış Hisarı', x: 2994, y: 2281, desc: { tr: 'Başkent Arava\'nın kuzey dış surları ve nöbet kuleleri.', en: 'Outer northern ramparts and watchtowers of Arava.' } },
    { id: 'arava-muhafiz', name: 'Niron Muhafızlığı', x: 2866, y: 2303, desc: { tr: 'Niron Nehri üzerinde kurulu nehir muhafız kışlası.', en: 'River guard barracks stationed along Niron.' } },
    { id: 'harna', name: 'Harna', x: 3275, y: 1400, desc: { tr: 'Kızılçay kıyısındaki demirci ocakları ve tahıl ambarlarıyla ünlü serhat şehri; Arava\'nın kuzey kapısı.', en: 'Frontier city famed for forges and granaries along Kizilchay; northern gate to Arava.' } },
    { id: 'harna-kuzey', name: 'Harna Serhat Kalesi', x: 3158, y: 1184, desc: { tr: 'Harna\'nın kuzey geçitlerini koruyan sınır hisarı.', en: 'Border fortress guarding northern passes of Harna.' } },
    { id: 'harna-ambar', name: 'Harna Ambarları', x: 3100, y: 1463, desc: { tr: 'İmparatorluğun merkez tahıl ambarları ve değirmen bölgesi.', en: 'Imperial granaries and milling district.' } },
    { id: 'solinor', name: 'Solinor', x: 3404, y: 2430, desc: { tr: 'Gümüş Yol ticaretinin doğu antreposu; imparatorluk donanma tersanesi.', en: 'Eastern trading entrepot of the Silver Way; imperial navy dockyards.' } },
    { id: 'solinor-kuzey', name: 'Solinor Antreposu', x: 3404, y: 2057, desc: { tr: 'Solinor\'un kuzey kervan konaklama ve gümrük mevkii.', en: 'Caravan waystation and customs hub north of Solinor.' } },
    { id: 'kragva', name: 'Kragva', x: 2117, y: 2560, desc: { tr: 'Cebra Nehri kıyısında tarım, değirmen ve nehir ticareti merkezi.', en: 'Agricultural mill town and river trading center along the Cebra River.' } },
    { id: 'kragva-koy', name: 'Kragva Değirmenleri', x: 2035, y: 2389, desc: { tr: 'Cebra vadisi değirmen ve un üretim merkezi.', en: 'Milling and grain processing hub of Cebra valley.' } },
    { id: 'kralya', name: 'Kralya', x: 2018, y: 1655, desc: { tr: 'Z\'ela Eyaleti\'nin kadim orman hisarı ve ticaret kenti.', en: 'Ancient forest stronghold and commercial city of Z\'ela.' } },
    { id: 'kralya-bati', name: 'Kralya Batı Kalesi', x: 1772, y: 2130, desc: { tr: 'Z\'ela batı sınırını koruyan dağ kalesi.', en: 'Mountain redoubt defending the western border of Z\'ela.' } },
    { id: 'kralya-dogu', name: 'Kralya Doğu Kapısı', x: 2135, y: 1915, desc: { tr: 'Orman yolunun ana giriş kapısı ve kervansarayı.', en: 'Main forest road gateway and caravanserai.' } },
    { id: 'galetsha', name: 'Galetsha', x: 2795, y: 1700, desc: { tr: 'Kuzey sınırındaki at yetiştiricileri, kömür ocakları ve bakır madenciliği merkezi.', en: 'Northern horse breeders, coal mines, and copper extraction center.' } },
    { id: 'galetsha-bati', name: 'Galetsha Yaylası', x: 2222, y: 516, desc: { tr: 'Kuzey at sürülerinin otlatıldığı yüksek plato kenti.', en: 'High plateau city where northern horse herds are raised.' } },
    { id: 'galetsha-demir', name: 'Galetsha Ocakları', x: 2400, y: 1270, desc: { tr: 'Zengin bakır ve kömür çıkarma ocakları.', en: 'Rich copper and coal extraction works.' } },
    { id: 'galetsha-dogu', name: 'Galetsha Kapısı', x: 2924, y: 904, desc: { tr: 'Kuzeydoğu dağlarına açılan garnizon kapısı.', en: 'Garrison gate leading into northeastern highlands.' } },
    { id: 'galetsha-at', name: 'Galetsha Haraları', x: 2719, y: 538, desc: { tr: 'İmparatorluk süvarileri için safkan at yetiştirme merkezi.', en: 'Thoroughbred stud farms for the imperial cavalry.' } },
    { id: 'xora', name: 'Xora', x: 2485, y: 795, desc: { tr: 'Galetsha\'nın kuzey sınır kalesi ve demir işleme ocakları.', en: 'Northern frontier fortress and ironworks of Galetsha.' } },
    { id: 'xora-kuzey', name: 'Xora Hisarı', x: 2924, y: 172, desc: { tr: 'Kuzey tundrasına bakan en uç gözetleme hisarı.', en: 'Foremost lookout fortress overlooking northern tundras.' } },
    { id: 'memanth', name: 'Memanth Kalesi', x: 3890, y: 795, desc: { tr: 'Deli Dağı ve Kloga eteklerindeki kuzeydoğu serhat hisarı.', en: 'Northeastern march fortress nestled in the foothills of Mount Kloga.' } },
    { id: 'memanth-ic', name: 'Memanth İç Kalesi', x: 3713, y: 882, desc: { tr: 'Memanth Dükalığı\'nın yüksek taht kalesi.', en: 'High keep seat of the Duchy of Memanth.' } },
    { id: 'memanth-vadi', name: 'Memanth Serhaddi', x: 3977, y: 516, desc: { tr: 'Kuzeydoğu sınır vadi garnizonu.', en: 'Northeastern frontier valley garrison.' } },
    { id: 'aleron', name: 'Aleron Limanı', x: 4300, y: 1460, desc: { tr: 'Memanth\'ın doğu denizine açılan müstahkem liman kenti.', en: 'Fortified harbor city of Memanth opening to the eastern sea.' } },
    { id: 'aleron-bati', name: 'Aleron Kapısı', x: 4094, y: 603, desc: { tr: 'Aleron Limanı ile Memanth arasındaki dağ geçit kapısı.', en: 'Mountain pass gate linking Aleron Port with Memanth.' } },
    { id: 'adamen', name: 'Adamen Madenleri', x: 1433, y: 2580, desc: { tr: 'İmparatorluğun en zengin cüce maden yatakları, çelik ocakları ve taş ustalığı merkezi.', en: 'Richest dwarven mines, steel foundries, and stonemasonry hub of the empire.' } },
    { id: 'adamen-kuzey-maden', name: 'Adamen Çelik Ocakları', x: 1491, y: 904, desc: { tr: 'Derin yeraltı ocakları ve zırh dövüm atölyeleri.', en: 'Deep subterranean foundries and armor smithies.' } },
    { id: 'adamen-kuzey-kapi', name: 'Adamen Taşkapı', x: 1491, y: 1248, desc: { tr: 'Maden şehirlerine inen anıtsal yeraltı kapısı.', en: 'Monumental portal descending into dwarven halls.' } },
    { id: 'fallar', name: 'Fallar Kalesi', x: 1287, y: 3205, desc: { tr: 'Güneybatı kıyısındaki sarp kayalık sahil kalesi ve gözetleme kulesi.', en: 'Southwestern rugged coastal fortress and lookout tower.' } },
    { id: 'fallar-sahil', name: 'Fallar Sahil Gözetleme', x: 947, y: 2475, desc: { tr: 'Batı okyanusu gözetleme kulesi ve deniz feneri.', en: 'Western ocean lookout tower and lighthouse.' } },
    { id: 'ziron', name: 'Ziron', x: 3830, y: 2920, desc: { tr: 'Ergall Demir Geçidi girişindeki Onneva garnizon şehri.', en: 'Onneva garrison city guarding the entrance to Ergall Iron Pass.' } },
    { id: 'ziron-giris', name: 'Demir Geçit Girişi', x: 3731, y: 1808, desc: { tr: 'Ergall Dağları içindeki sarp geçit karakolu.', en: 'Precipitous mountain pass outpost in the Ergall peaks.' } },
    { id: 'todfa-gomara', name: 'Gom Ara & Todfa', x: 4456, y: 2175, desc: { tr: 'Güneye inen bozkır beylikleri ve Yoren Nehri meydanı.', en: 'Steppe frontier and battlegrounds of the Yoren River.' } },
    { id: 'kamtel-sehri', name: 'Kamtel Şehri', x: 4250, y: 3220, desc: { tr: 'Onneva\'nın tahıl ambarı ve Kamtel Nehri ticaret kenti.', en: 'Granary hub and river trading city of Onneva along Kamtel River.' } },
    { id: 'kamtel-dogu', name: 'Kamtel Antreposu', x: 4357, y: 2712, desc: { tr: 'Kamtel Nehri doğu iskeleleri ve depoları.', en: 'Eastern quays and depots along the Kamtel River.' } },
    { id: 'solgar', name: 'Solgar Kalesi', x: 3597, y: 3895, desc: { tr: 'Sarp dağ silsilesi ve maden ocaklarıyla korunan efsanevi güney kalesi.', en: 'Legendary southern mountain fortress protected by rugged ranges and mines.' } },
    { id: 'solgar-gecit', name: 'Solgar Geçidi', x: 3637, y: 3637, desc: { tr: 'Solgar vadisini çevreleyen geçit vermez sarp hisar.', en: 'Impassable jagged bastion guarding the Solgar vale.' } },
    { id: 'velemdal', name: 'Velemdal', x: 2105, y: 3635, desc: { tr: 'Solgar Eyaleti\'nin verimli vadisinde kurulu endüstri ve zanaat merkezi.', en: 'Industrial and crafting center nestled in the fertile valleys of Solgar.' } },
    { id: 'seltanya', name: 'Seltanya Hisarı', x: 1918, y: 2990, desc: { tr: 'Batı kıyısındaki tersane, donanma üssü ve altın koç armalı merkez hisar.', en: 'Shipyards, naval base, and ducal stronghold on the western coast.' } },
    { id: 'seltanya-kuzey', name: 'Seltanya Sahil Kulesi', x: 1684, y: 3013, desc: { tr: 'Seltanya körfezi muhafız kulesi.', en: 'Guardian tower of the Seltanya gulf.' } },
    { id: 'ulumabed', name: 'Ulu Mabed', x: 1708, y: 3615, desc: { tr: 'Denize nazır kadim tapınak kenti ve tüm kıtanın ruhani hac merkezi.', en: 'Ancient seaward temple city and spiritual pilgrimage center of the continent.' } },
    { id: 'ulumabed-kapi', name: 'Mabed Kapısı', x: 1813, y: 3228, desc: { tr: 'Kutsal vadiye giriş yapan hacıların toplandığı beyaz taşlı anıtsal kapı.', en: 'White-stone monumental portal welcoming pilgrims into the holy valley.' } },
    { id: 'selya-efrork', name: 'Selya / Efrork', x: 2702, y: 3295, desc: { tr: 'Kadim ormanların ve Yevrass Nehri deltasının güneybatı limanı.', en: 'Southwestern port nestled in primeval forests and Yevrass delta.' } },
    { id: 'selya-dogu', name: 'Selya Orman Kalesi', x: 2368, y: 3637, desc: { tr: 'Kadim meşe ve porsuk ormanlarının derinliklerindeki müstahkem hisar.', en: 'Fortified redoubt deep within the ancient oak and yew forests.' } },
    { id: 'yevrass-deltasi', name: 'Yevrass İskelesi', x: 2562, y: 3615, desc: { tr: 'Yevrass Nehri\'nin denize döküldüğü korunaklı delta iskelesi.', en: 'Sheltered river delta quay where Yevrass meets the sea.' } },
    { id: 'kiliclimani', name: 'Kılıçlimanı', x: 2094, y: 3960, desc: { tr: 'Gümüş Yol güney çıkışındaki donanma ve ticaret iskelesi.', en: 'Naval and merchant docks at the southern mouth of the Silver Way.' } },
    { id: 'khasinya-kale', name: 'Khasinya Kalesi', x: 5410, y: 1635, desc: { tr: 'Safir Boğazı ötesindeki korsan ve kadırga adasının müstahkem merkezi.', en: 'Fortified island seat of corsairs and warships beyond Sapphire Strait.' } },
    { id: 'khasinya-kuzey', name: 'Khasinya Gözetleme', x: 5234, y: 1377, desc: { tr: 'Safir adalarının kuzey ucundaki korsan gözetleme kulesi.', en: 'Corsair observation watchtower on the northern cape of Sapphire Isles.' } },
    { id: 'khasinya-guney', name: 'Khasinya İskelesi', x: 5322, y: 2410, desc: { tr: 'Khasinya kadırgalarının demirlediği derin güney koyu.', en: 'Deep southern bay anchorage for Khasinya galleys.' } },
    { id: 'xoma', name: 'Xoma', x: 1158, y: 3765, desc: { tr: 'Pilkkard\'ın kuzey burnundaki müstahkem ticaret limanı ve deniz feneri.', en: 'Fortified trade harbor and beacon on the northern cape of Pilkkard.' } },
    { id: 'xoma-liman', name: 'Xoma Limanı', x: 1006, y: 3615, desc: { tr: 'Pilkkard tüccarlarının ve korsan gemilerinin ana rıhtımı.', en: 'Main wharf for Pilkkard merchantmen and corsair barques.' } },
    { id: 'pilkkard-feneri', name: 'Pilkkard Feneri', x: 1006, y: 4067, desc: { tr: 'Güneybatı resiflerini aydınlatan devasa deniz feneri.', en: 'Colossal beacon illuminating southwestern treacherous reefs.' } },
    { id: 'pilkkard-guney', name: 'Pilkkard Hisarı', x: 1415, y: 4196, desc: { tr: 'Kıtanın en güney kayalık burnundaki müstahkem hisar.', en: 'Fortified bastion on the continent\'s southernmost rocky promontory.' } },
    { id: 'kuzey-hudut', name: 'Kuzey Hudut Kalesi', x: 3070, y: 172, desc: { tr: 'Kuzey kutup rüzgarlarına karşı duran son sınır kalesi.', en: 'Ultimate frontier redoubt braving northern polar gales.' } },
    { id: 'kuzey-karakol', name: 'Kuzey Karakolu', x: 2632, y: 86, desc: { tr: 'Kuzey tundra gözetleme karakolu.', en: 'Northern tundra observation post.' } },
    { id: 'bati-iskelesi', name: 'Batı İskelesi', x: 105, y: 775, desc: { tr: 'Uzak batı burnundaki balıkçı ve kaşif iskelesi.', en: 'Fisher and explorer anchorage on the far western cape.' } },
    { id: 'kuzeybati-kalesi', name: 'Kuzeybatı Kalesi', x: 398, y: 646, desc: { tr: 'Batı okyanusundan gelen akınlara karşı nöbet tutan sınır hisarı.', en: 'Frontier bastion standing guard against raids from the western ocean.' } },
    { id: 'dogu-feneri', name: 'Doğu Feneri', x: 5263, y: 280, desc: { tr: 'Doğu okyanusu ticaret rotalarını aydınlatan kadim deniz kulesi.', en: 'Ancient sea tower illuminating eastern oceanic trade lanes.' } },
    { id: 'safir-karanlik', name: 'Safir İskelesi', x: 4678, y: 1248, desc: { tr: 'Safir boğazı ana geçiş iskelesi.', en: 'Main crossing ferry quay across the Sapphire Strait.' } }
  ],
  dag: [
    { id: 'kuzey-zirveleri', name: 'Kuzey Sınır Zirveleri', x: 3000, y: 52, desc: { tr: 'Kıtanın en kuzeyindeki buzullarla kaplı geçit vermez devasa zirveler.', en: 'Colossal glacier-capped peaks on the continent\'s northernmost verge.' } },
    { id: 'kuzey-ikinci', name: 'Kuzey Ak Zirve', x: 3269, y: 60, desc: { tr: 'Daimi kar ve fırtınalarla dövülen ak dağ doruğu.', en: 'White mountain summit battered by perpetual snow and gales.' } },
    { id: 'kizil-daglar', name: 'Kızıl Dağlar', x: 3427, y: 224, desc: { tr: 'Kızılçay\'ın doğduğu demir ve bakır zengini kuzey sıradağları.', en: 'Iron and copper-rich northern range where the Kizilchay river originates.' } },
    { id: 'kroga-edlith', name: 'Kroga & Edlith Zirveleri', x: 3731, y: 900, desc: { tr: 'Galetsha ile Memanth\'ı birbirinden ayıran rüzgarlı dağ sırtları.', en: 'Windswept ridges dividing Galetsha and Memanth.' } },
    { id: 'deli-kloga', name: 'Deli Dağı & Kloga', x: 4415, y: 1575, desc: { tr: 'Memanth sınır dağ silsilesi; kuzeydoğunun dondurucu ve sarp zirveleri.', en: 'Memanth border range; freezing and rugged peaks of the northeast.' } },
    { id: 'memanth-serhat', name: 'Memanth Serhat Silsilesi', x: 4842, y: 164, desc: { tr: 'Doğu okyanusuna dik inen uçurum dağları.', en: 'Precipitous cliffs descending sheer into the eastern sea.' } },
    { id: 'memanth-dogu', name: 'Doğu Dağları', x: 5140, y: 323, desc: { tr: 'Kuzeydoğu okyanus kıyısındaki sarp kayalık dağ sırtı.', en: 'Rugged cliff range along northeastern sea shores.' } },
    { id: 'dogu-sahil-zirvesi', name: 'Safir Sahil Dağı', x: 5251, y: 994, desc: { tr: 'Safir Boğazı\'na bakan yalçın falez dağları.', en: 'Jagged bluff peaks overlooking Sapphire Strait.' } },
    { id: 'ergall-bora', name: 'Ergall & Bora Dağları', x: 4187, y: 2199, desc: { tr: 'Onneva ile Başsancak arasındaki stratejik geçit dağları.', en: 'Strategic mountain pass between Onneva and High Sanjak.' } },
    { id: 'bora-zirveleri', name: 'Bora Zirvesi', x: 4363, y: 2001, desc: { tr: 'Bozkır fırtınalarının çarptığı yüksek kaya zirvesi.', en: 'High rock crag struck by fierce steppe gales.' } },
    { id: 'demirkapi', name: 'Demirkapı Geçidi', x: 2883, y: 1244, desc: { tr: 'Kuzey ile güney ordularının tek geçiş noktası olan sarp boğaz.', en: 'Precipitous pass serving as the sole gateway for northern and southern armies.' } },
    { id: 'galetsha-gecitleri', name: 'Galetsha Sıradağları', x: 2661, y: 766, desc: { tr: 'At yetiştiricilerinin vadilerini çevreleyen koruyucu dağlar.', en: 'Protective ranges encircling the horse breeders\' valleys.' } },
    { id: 'kizilcay-kaynagi', name: 'Kızıl Dağ Zirvesi', x: 3152, y: 607, desc: { tr: 'Kızılçay nehrinin gür pınarlarının fışkırdığı yalçın doruk.', en: 'Sheer pinnacle from whose clefts the waters of Kizilchay burst forth.' } },
    { id: 'solgar-selya-daglari', name: 'Solgar-Selya Sınır Dağları', x: 2199, y: 3120, desc: { tr: 'Güney-merkez; haritanın en yoğun ve geçit vermez sarp dağ silsilesi.', en: 'South-central; the densest, most impassable mountain range on the map.' } },
    { id: 'adamen-silsilesi', name: 'Adamen Silsilesi', x: 1041, y: 3340, desc: { tr: 'Cüce maden ocaklarının altını oyduğu demir zengini batı dağları.', en: 'Iron-rich western range honeycombed with dwarven mining halls.' } },
    { id: 'fallar-kayaliklari', name: 'Fallar Kayalıkları', x: 1883, y: 1313, desc: { tr: 'Batı vadilerini rüzgardan koruyan sarp dağ duvarı.', en: 'Sheer mountain rampart shielding western vales from tempests.' } },
    { id: 'kuzeybati-zirveleri', name: 'Kuzeybatı Zirveleri', x: 1860, y: 150, desc: { tr: 'Kıtanın kuzeybatı burnundaki deniz dağları.', en: 'Seaward mountain peaks on the northwestern horn.' } },
    { id: 'kuzeybati-ikinci', name: 'Z\'ela Dağları', x: 2094, y: 194, desc: { tr: 'Z\'ela ormanlarının kuzey sınırını çizen yalçın doruklar.', en: 'Rugged summits delimiting the northern border of Z\'ela forests.' } }
  ],
  gol: [
    { id: 'emeralda-golu', name: 'Emeralda Gölü', x: 3538, y: 1597, desc: { tr: 'Memanth\'ın güneyinde zümrüt yeşili sularıyla bilinen krater gölü.', en: 'Emerald-green crater lake located in southern Memanth.' } },
    { id: 'beryazz-golu', name: 'Beryazz Gölü', x: 4707, y: 2548, desc: { tr: 'Onneva\'nın güneydoğusunda bereket getiren kadim tatlı su havzası.', en: 'Ancient freshwater lake bringing fertility to southeastern Onneva.' } },
    { id: 'niron-kaynagi', name: 'Niron Kaynağı Havzası', x: 3410, y: 1196, desc: { tr: 'Niron Nehri\'ni besleyen yüksek dağ gölü.', en: 'High alpine tarn feeding the headwaters of Niron.' } },
    { id: 'kuzey-buz-golu', name: 'Kuzey Krater Gölü', x: 2024, y: 809, desc: { tr: 'Kuzey sıradağlarının kucağındaki buz gibi saf krater gölü.', en: 'Crystal-pure glacial crater lake in the lap of northern peaks.' } },
    { id: 'safir-korfezi', name: 'Safir Boğazı Körfezi', x: 5093, y: 1911, desc: { tr: 'Khasinya adası ile anakara arasındaki derin safir mavisi iç deniz.', en: 'Deep sapphire-blue inland sea between Khasinya isle and mainland.' } },
    { id: 'dogu-deniz-limani', name: 'Doğu Lagünü', x: 5052, y: 1498, desc: { tr: 'Aleron\'un güneyinde korunaklı doğal koy havzası.', en: 'Sheltered natural bay basin south of Aleron.' } },
    { id: 'cebra-lagunu', name: 'Cebra Gölü & Lagünü', x: 1655, y: 2500, desc: { tr: 'Cebra Nehri\'nin genişleyerek oluşturduğu bereketli iç göl.', en: 'Fertile inland lake formed by the widening of Cebra River.' } },
    { id: 'pilkkard-korfezi', name: 'Pilkkard Körfezi', x: 1333, y: 3917, desc: { tr: 'Xoma burnu arkasındaki fırtınaya kapalı korsan koyu.', en: 'Storm-sheltered corsair anchorage behind Cape Xoma.' } }
  ],
  nehir: (m.features && m.features.nehir && m.features.nehir.length) ? m.features.nehir : [
    { id: 'niron-nehri', name: 'Niron Nehri', points: [[2450, 1950], [2560, 2180], [2700, 2380], [2880, 2520], [3010, 2680], [3040, 2865]], desc: { tr: 'Z\'ela\'nın kuzeyinden doğar, Başsancak\'ın batı sınırı boyunca akıp Garall\'da Gümüş Yol\'a dökülür; Arava\'nın batısından geçer.', en: 'Rises north of Z\'ela, flows south along Crown Land border into Silver Way at Garall; passes west of Arava.' } },
    { id: 'kizilcay-nehri', name: 'Kızılçay Nehri', points: [[3380, 1980], [3280, 2140], [3200, 2280], [3080, 2450], [2880, 2520]], desc: { tr: 'Başsancak\'ın kuzey dağlarından başlar, Harna şehrinden geçer, Niron Nehri\'ne dökülür.', en: 'Begins in northern mountains of Crown Land, passes through Harna and empties into Niron.' } },
    { id: 'cebra-nehri', name: 'Cebra Nehri', points: [[2480, 2760], [2620, 2720], [2750, 2690], [2920, 2650], [3010, 2680]], desc: { tr: 'Kragva şehrinden başlar, bereketli tarım arazilerini sulayarak Niron Nehri\'ne kavuşur.', en: 'Originates at Kragva and irrigates farmlands before joining Niron River.' } },
    { id: 'yevrass-nehri', name: 'Yevrass Nehri', points: [[3680, 3680], [3420, 3750], [3180, 3880], [2960, 3960], [2820, 4040]], desc: { tr: 'Solgar\'ın güneyinde doğar, Selya boyunca akıp Gümüş Yol\'a dökülür.', en: 'Rises south of Solgar, flows through Selya into the Silver Way.' } },
    { id: 'kamtel-nehri', name: 'Kamtel Nehri', points: [[3810, 2920], [4020, 3080], [4250, 3220], [4480, 3420], [4660, 3620]], desc: { tr: 'Onneva\'nın kuzeyinden (Ziron civarı) doğar, tahıl ovalarını kat ederek güneydoğuya akar.', en: 'Rises in north of Onneva around Ziron, flowing southeast across the granary plains.' } }
  ]
};

m.features = newFeatures;
fs.writeFileSync(mapsPath, JSON.stringify(d, null, 2), 'utf8');
console.log('maps.json updated successfully!');
console.log('Cities:', m.features.sehir.length);
console.log('Mountains:', m.features.dag.length);
console.log('Lakes:', m.features.gol.length);
console.log('Rivers:', m.features.nehir.length);
