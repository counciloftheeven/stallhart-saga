import fs from 'fs';

const regionsData = [
  {
    id: 'highsanjak',
    labelPos: [3220, 2150],
    sub: { tr: 'Taç Diyarı', en: 'Crown Land' },
    points: [
      [2820, 2100], [3050, 1750], [3300, 1350], [3450, 1500],
      [3550, 1900], [3650, 2200], [3700, 2600], [3400, 2800],
      [3053, 2755], [3040, 2865], [2980, 2720], [2850, 2520],
      [2820, 2300]
    ]
  },
  {
    id: 'zela',
    labelPos: [2380, 2250],
    sub: { tr: 'Orman Eyaleti', en: 'Forest Province' },
    points: [
      [1850, 1700], [2100, 1600], [2400, 1650], [2820, 2100],
      [2850, 2520], [2980, 2720], [3040, 2865], [2700, 2880],
      [2400, 2920], [2100, 2850], [1850, 2750], [1750, 2400],
      [1800, 2000]
    ]
  },
  {
    id: 'galetsha',
    labelPos: [2650, 1100],
    sub: { tr: 'Kuzey Sancağı', en: 'Northern March' },
    points: [
      [1850, 1700], [2400, 1650], [2820, 2100], [3050, 1750],
      [3300, 1350], [3400, 1000], [3500, 650], [3600, 200],
      [3200, 80], [2800, 60], [2400, 120], [2100, 450],
      [1950, 950]
    ]
  },
  {
    id: 'memanth',
    labelPos: [4350, 1150],
    sub: { tr: 'Doğu Serhaddi', en: 'Eastern Border' },
    points: [
      [3600, 200], [3500, 650], [3400, 1000], [3300, 1350],
      [3550, 1900], [3700, 2600], [4100, 2550], [4500, 2450],
      [4900, 2400], [5300, 2450], [5350, 2000], [5250, 1400],
      [5100, 800], [4950, 300], [4500, 150], [3900, 120]
    ]
  },
  {
    id: 'adamen',
    labelPos: [1400, 1900],
    sub: { tr: 'Maden Dağları', en: 'Mining Peaks' },
    points: [
      [2400, 120], [2100, 450], [1950, 950], [1850, 1700],
      [1850, 2750], [1650, 3050], [1400, 3150], [1150, 3200],
      [900, 3200], [850, 2600], [950, 2000], [1150, 1400],
      [1300, 800], [1550, 350], [1950, 150]
    ]
  },
  {
    id: 'onneva',
    labelPos: [4250, 3100],
    sub: { tr: 'Bozkır Eyaleti', en: 'Steppe Lands' },
    points: [
      [3053, 2755], [3400, 2800], [3700, 2600], [4100, 2550],
      [4500, 2450], [4900, 2400], [5300, 2450], [5200, 2900],
      [5050, 3350], [4800, 3750], [4400, 4000], [4100, 3750],
      [3800, 3500], [3500, 3200]
    ]
  },
  {
    id: 'solgar',
    labelPos: [2650, 3450],
    sub: { tr: 'Demir Kalesi', en: 'Iron Fortress' },
    points: [
      [1850, 2750], [2100, 2850], [2400, 2920], [2700, 2880],
      [3040, 2865], [3200, 3200], [3350, 3500], [3300, 3850],
      [3000, 3950], [2700, 4000], [2400, 3950], [2300, 3600],
      [2100, 3300], [1850, 3050]
    ]
  },
  {
    id: 'seltania',
    labelPos: [1650, 3450],
    sub: { tr: 'Batı Donanması', en: 'Western Fleet' },
    points: [
      [900, 3200], [1150, 3200], [1400, 3150], [1650, 3050],
      [1850, 3050], [2100, 3300], [2300, 3600], [2100, 3750],
      [1850, 3850], [1550, 3800], [1300, 3750], [1100, 3550],
      [950, 3350]
    ]
  },
  {
    id: 'sanctuary',
    labelPos: [1550, 4000],
    sub: { tr: 'Ulu Mabed', en: 'Sacred Sanctuary' },
    points: [
      [1300, 3750], [1550, 3800], [1850, 3850], [1800, 4100],
      [1750, 4250], [1500, 4250], [1250, 4150], [1150, 3950]
    ]
  },
  {
    id: 'shelia',
    labelPos: [2600, 4120],
    sub: { tr: 'Yevrass Ormanları', en: 'Yevrass Wilds' },
    points: [
      [2400, 3950], [2700, 4000], [3000, 3950], [3300, 3850],
      [3250, 4200], [2900, 4280], [2600, 4280], [2300, 4280],
      [1850, 4250], [1850, 3850], [2100, 3750]
    ]
  },
  {
    id: 'pilkkard',
    labelPos: [1050, 3950],
    sub: { tr: 'Korsan Burnu', en: 'Corsair Cape' },
    points: [
      [900, 3650], [1200, 3600], [1300, 3750], [1150, 3950],
      [1250, 4150], [1050, 4280], [800, 4200], [750, 3900]
    ]
  },
  {
    id: 'khasinia',
    labelPos: [5350, 1900],
    sub: { tr: 'Safir Adaları', en: 'Sapphire Isles' },
    points: [
      [5150, 1250], [5550, 1250], [5600, 1850], [5400, 2550],
      [5100, 2550], [5050, 1850]
    ]
  }
];

const riversData = [
  {
    id: 'niron-nehri',
    name: 'Niron Nehri',
    points: [
      [2750, 1550], [2680, 1850], [2700, 2100], [2850, 2300],
      [2920, 2450], [3010, 2580], [3040, 2755], [3053, 2865]
    ],
    desc: {
      tr: "Z'ela'nın kuzeyinden doğar, Başsancak'ın batı sınırı boyunca akıp Garall'da Gümüş Yol'a dökülür; Arava'nın batısından geçer.",
      en: "Rises north of Z'ela, flows south along Crown Land border into Silver Way at Garall; passes west of Arava."
    }
  },
  {
    id: 'kizilcay-nehri',
    name: 'Kızılçay Nehri',
    points: [
      [3450, 1100], [3380, 1280], [3275, 1400], [3150, 1800],
      [3050, 2150], [2920, 2450]
    ],
    desc: {
      tr: "Başsancak'ın kuzey dağlarından (Kızıl Dağlar) başlar, Harna şehrinden geçer, Niron Nehri'ne dökülür.",
      en: "Begins in northern red mountains of Crown Land, passes through Harna and empties into Niron."
    }
  },
  {
    id: 'cebra-nehri',
    name: 'Cebra Nehri',
    points: [
      [1750, 2450], [1950, 2520], [2117, 2560], [2400, 2580],
      [2700, 2540], [2920, 2450]
    ],
    desc: {
      tr: "Kragva şehrinden başlar, bereketli tarım arazilerini sulayarak Niron Nehri'ne kavuşur.",
      en: "Originates at Kragva and irrigates farmlands before joining Niron River."
    }
  },
  {
    id: 'kamtel-nehri',
    name: 'Kamtel Nehri',
    points: [
      [3750, 2300], [3830, 2600], [3830, 2920], [4050, 3100],
      [4250, 3220], [4550, 3450], [4800, 3750]
    ],
    desc: {
      tr: "Onneva'nın kuzeyinden (Ziron civarı) doğar, tahıl ovalarını kat ederek güneydoğuya akar.",
      en: "Rises in north of Onneva around Ziron, flowing southeast across the granary plains."
    }
  },
  {
    id: 'yevrass-nehri',
    name: 'Yevrass Nehri',
    points: [
      [3200, 3550], [2950, 3650], [2702, 3295], [2562, 3615],
      [2450, 3950], [2400, 4200]
    ],
    desc: {
      tr: "Solgar'ın güneyinde doğar, Selya boyunca akıp Gümüş Yol'a dökülür.",
      en: "Rises south of Solgar, flows through Selya into the Silver Way."
    }
  }
];

// Update maps.json
const mapsPath = 'data/maps.json';
const mapsDoc = JSON.parse(fs.readFileSync(mapsPath, 'utf8'));
const empireMap = mapsDoc.maps[0];

empireMap.regions = regionsData;
empireMap.features.nehir = riversData;

fs.writeFileSync(mapsPath, JSON.stringify(mapsDoc, null, 2), 'utf8');
console.log('data/maps.json updated successfully!');

// Now update assets/js/harita.js
let haritaCode = fs.readFileSync('assets/js/harita.js', 'utf8');

// Replace CANONICAL_REGIONS
const regStr = 'const CANONICAL_REGIONS = ' + JSON.stringify(regionsData, null, 2) + ';';
const startReg = haritaCode.indexOf('const CANONICAL_REGIONS = [');
const endReg = haritaCode.indexOf('function normalize(data) {');
if (startReg !== -1 && endReg !== -1) {
  haritaCode = haritaCode.slice(0, startReg) + regStr + '\n\n' + haritaCode.slice(endReg);
}

// Replace CANONICAL_FEATURES.nehir
const startFeat = haritaCode.indexOf('const CANONICAL_FEATURES = {');
const endFeat = haritaCode.indexOf('const CANONICAL_REGIONS = [');
if (startFeat !== -1 && endFeat !== -1) {
  const featStr = 'const CANONICAL_FEATURES = ' + JSON.stringify(empireMap.features, null, 2) + ';';
  haritaCode = haritaCode.slice(0, startFeat) + featStr + '\n\n' + haritaCode.slice(endFeat);
}

// Ensure cache deletion on init in harita.js
const cacheClearCode = `  // Önceki harita önbellek verilerini sil (eski/hatalı koordinat taslaklarını temizler)
  try {
    localStorage.removeItem('sw-db:maps.json');
    localStorage.removeItem('sw_map_cache');
    if (window.DataCache) delete window.DataCache['maps.json'];
  } catch (ce) {}
`;
if (!haritaCode.includes('localStorage.removeItem(\'sw-db:maps.json\');')) {
  haritaCode = haritaCode.replace('async function init() {', 'async function init() {\n' + cacheClearCode);
}

fs.writeFileSync('assets/js/harita.js', haritaCode, 'utf8');
console.log('assets/js/harita.js updated successfully!');
