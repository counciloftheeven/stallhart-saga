/* ═══════════════════════════════════════════════════════════════
   STALLHART DESTANI — Mesafe & Seyahat Süresi Hesaplayıcı
   ---------------------------------------------------------------
   Kıtadaki şehirler, kaleler ve ordugâhlar arasındaki mesafeyi,
   seyahat tarzına (süvari kurye, ordu yürüyüşü, nehir kadırgası,
   yalnız gezgin) göre gün cinsinden süreleri ve vakanüvis
   arazi notlarını hesaplar.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

(function (w) {
  var LOCATIONS = {
    arava: {
      name: { tr: 'Arava', en: 'Arava' },
      province: { tr: 'Başsancak (Başkent)', en: 'Crown Land (Capital)' },
      x: 520, y: 440,
      river: true, sea: true,
      desc: { tr: 'İmparatorluk tahtının bulunduğu başkent; Niron Nehri ile Gümüş Yol kıyısında.', en: 'Imperial seat on the banks of Niron River and Silver Way.' }
    },
    harna: {
      name: { tr: 'Harna', en: 'Harna' },
      province: { tr: 'Başsancak (Kızılçay)', en: 'Crown Land (Redstream)' },
      x: 540, y: 390,
      river: true, sea: false,
      desc: { tr: 'Kızılçay kıyısındaki demirci ve tahıl şehri; Arava’nın kuzey kapısı.', en: 'Grain and smith city on the Red River; northern gate of Arava.' }
    },
    solinor: {
      name: { tr: 'Solinor', en: 'Solinor' },
      province: { tr: 'Başsancak (Doğu Limanı)', en: 'Crown Land (East Port)' },
      x: 590, y: 430,
      river: false, sea: true,
      desc: { tr: 'Gümüş Yol ticaretinin doğu antreposu; donanma tersanesi.', en: 'Eastern trading entrepot of the Silver Way; imperial shipyards.' }
    },
    solgar: {
      name: { tr: 'Solgar Kalesi', en: 'Solgar Fortress' },
      province: { tr: 'Solgar Eyaleti', en: 'Solgar Province' },
      x: 640, y: 620,
      river: false, sea: false,
      mountain: true,
      desc: { tr: 'Sarp dağ silsilesi ve maden ocaklarıyla korunan güney kalesi.', en: 'Southern mountain fortress protected by rugged ranges and mines.' }
    },
    selya: {
      name: { tr: 'Selya / Efrork', en: 'Selya / Efrork' },
      province: { tr: 'Selya Eyaleti', en: 'Selya Province' },
      x: 410, y: 670,
      river: true, sea: true,
      forest: true,
      desc: { tr: 'Kadim ormanların ve Yevrass Nehri deltasının güneybatı limanı.', en: 'Southwestern port nestled in ancient forests and Yevrass delta.' }
    },
    ziron: {
      name: { tr: 'Ziron', en: 'Ziron' },
      province: { tr: 'Onneva Eyaleti', en: 'Onneva Province' },
      x: 480, y: 530,
      river: true, sea: false,
      mountain: true,
      desc: { tr: 'Ergall Demir Geçidi girişindeki garnizon şehri.', en: 'Garrison city guarding the entrance to Ergall Iron Pass.' }
    },
    kragva: {
      name: { tr: 'Kragva', en: 'Kragva' },
      province: { tr: 'Cebra Havzası', en: 'Cebra Basin' },
      x: 470, y: 460,
      river: true, sea: false,
      desc: { tr: 'Cebra Nehri kıyısında tarım ve değirmen merkezi.', en: 'Agricultural mill town along the Cebra River.' }
    },
    vlaup: {
      name: { tr: 'Vlaup Prme', en: 'Vlaup Prme' },
      province: { tr: 'Vlaupson Şehirleri', en: 'Vlaupson Cities' },
      x: 290, y: 410,
      river: false, sea: true,
      desc: { tr: 'Batı sınırındaki tüccar oligarşisi ve surlu şehir devleti.', en: 'Walled merchant oligarchy on the far western border.' }
    },
    khasinya: {
      name: { tr: 'Khasinya Kalesi', en: 'Khasinya Fortress' },
      province: { tr: 'Khasinya Adası', en: 'Khasinya Island' },
      x: 770, y: 420,
      river: false, sea: true,
      island: true,
      desc: { tr: 'Safir Boğazı ötesindeki korsan ve kadırga adası.', en: 'Island realm of corsairs beyond the Sapphire Strait.' }
    },
    todfa: {
      name: { tr: 'Todfa & Gom Ara', en: 'Todfa & Gom Ara' },
      province: { tr: 'Gom Ara Eyaleti', en: 'Gom Ara Province' },
      x: 620, y: 530,
      river: true, sea: false,
      desc: { tr: 'Güneye inen bozkır beylikleri ve Yoren Nehri meydanı.', en: 'Steppe frontier and battlegrounds of the Yoren River.' }
    },
    garall: {
      name: { tr: 'Garall Boğazı', en: 'Garall Strait' },
      province: { tr: 'Garall Geçidi', en: 'Garall Crossing' },
      x: 520, y: 490,
      river: true, sea: true,
      desc: { tr: 'Niron Nehri ile Gümüş Yol’un birleştiği kıtanın en dar geçidi.', en: 'Continent’s narrowest strait where Niron meets Silver Way.' }
    },
    memanth: {
      name: { tr: 'Memanth Kalesi', en: 'Memanth Fortress' },
      province: { tr: 'Memanth Eyaleti', en: 'Memanth Province' },
      x: 660, y: 280,
      river: false, sea: false,
      mountain: true,
      desc: { tr: 'Deli Dağı ve Kloga eteklerindeki kuzeydoğu serhat hisarı.', en: 'Northeastern march fortress in the foothills of Mount Kloga.' }
    },
    galetsha: {
      name: { tr: 'Galetsha', en: 'Galetsha' },
      province: { tr: 'Galetsha Eyaleti', en: 'Galetsha Province' },
      x: 480, y: 290,
      river: false, sea: false,
      desc: { tr: 'Kuzey sınırındaki at yetiştiricileri ve bozkır yaylaları.', en: 'Northern horse breeders and high steppe tablelands.' }
    },
    zela: {
      name: { tr: 'Z’ela Ormanları', en: 'Z’ela Forests' },
      province: { tr: 'Z’ela Eyaleti', en: 'Z’ela Province' },
      x: 360, y: 440,
      river: true, sea: false,
      forest: true,
      desc: { tr: 'Geçit vermeyen sık ormanlar ve kadim kabile sığınakları.', en: 'Impenetrable primeval forest and ancestral clan sanctuaries.' }
    }
  };

  /* Seyahat Biçimleri (Günlük Hız ve Arazi Katsayıları) */
  var MODES = {
    courier: {
      id: 'courier',
      icon: '🐎',
      speed: 65, /* km/gün */
      name: { tr: 'İmparatorluk Atlı Kuryesi / Süvari', en: 'Imperial Mounted Courier' },
      desc: { tr: 'Hafif donanım, menzil hanelerinde taze binek değişimi; acil fermanlar için en hızlı rota.', en: 'Light kit, fresh remounts at staging posts; fastest overland dispatch.' }
    },
    march: {
      id: 'march',
      icon: '🚶',
      speed: 24, /* km/gün */
      name: { tr: 'Ordu Yürüyüş Kolu / İkmal Katarı', en: 'Army March & Baggage Train' },
      desc: { tr: 'Ağır zırhlı piyade, mancınık arabaları ve erzak yükleri; dağ geçitlerinde ve nehirlerde yavaşlar.', en: 'Heavy infantry, siege engines and supply wagons; delayed by passes and fords.' }
    },
    galley: {
      id: 'galley',
      icon: '⛵',
      speed: 52, /* km/gün */
      name: { tr: 'İmparatorluk Kadırgası & Nehir Filosu', en: 'Imperial Galley & River Transport' },
      desc: { tr: 'Gümüş Yol veya Niron Nehri üzerinden kürek ve yelken seyri; kara engellerini aşar.', en: 'Rowed and sailed along the Silver Way or Niron River; bypasses mountain bottlenecks.' }
    },
    scout: {
      id: 'scout',
      icon: '🦹',
      speed: 38, /* km/gün */
      name: { tr: 'Casus / Yalnız Vakanüvis Kervanı', en: 'Scout / Solitary Chronicler' },
      desc: { tr: 'Gizli dağ patikaları, keçi yolları ve sivil kervanlar; dikkati çekmeden ilerler.', en: 'Unmarked goat trails and trade caravans; travels covertly.' }
    }
  };

  function distanceKm(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    var euclidean = Math.sqrt(dx * dx + dy * dy);
    /* 1 harita birimi ~ 2.4 km arazi eğrisi katsayısı */
    return Math.round(euclidean * 2.45);
  }

  function calculate(fromId, toId, modeId) {
    var from = LOCATIONS[fromId], to = LOCATIONS[toId];
    if (!from || !to) return null;
    var mode = MODES[modeId] || MODES.courier;

    var km = distanceKm(from, to);
    if (fromId === toId) {
      return {
        km: 0, days: 0, hours: 0,
        routeType: 'local',
        checkpoints: [],
        note: { tr: 'Aynı yerleşke içindesiniz; seyahat süresi gerektirmez.', en: 'You are within the same settlement; no travel required.' }
      };
    }

    var terrainFactor = 1.0;
    var requiresSea = false;
    var checkpoints = [];

    /* Ada veya Boğaz geçişi denetimi */
    if (from.island || to.island) {
      requiresSea = true;
      checkpoints.push({ tr: 'Safir Boğazı Deniz Geçişi (Khasinya Filosu)', en: 'Sapphire Strait Naval Crossing' });
      if (mode.id !== 'galley') {
        terrainFactor += 0.35; // gemiye aktarma bekleme süresi
      }
    }

    /* Dağ engelleri */
    if (from.mountain || to.mountain || (from.x > 500 && to.x > 600 && to.y > 500)) {
      terrainFactor += (mode.id === 'march' ? 0.35 : 0.18);
      checkpoints.push({ tr: 'Ergall & Solgar Dağ Silsilesi Geçitleri', en: 'Ergall & Solgar Mountain Passes' });
    }

    /* Nehir geçişleri */
    if ((from.river && !to.river) || (!from.river && to.river) || Math.abs(from.x - to.x) > 180) {
      checkpoints.push({ tr: 'Niron veya Yevrass Nehri Sığlığı / Köprüleri', en: 'Niron or Yevrass River Crossing' });
    }

    /* Orman arazisi */
    if (from.forest || to.forest) {
      terrainFactor += 0.15;
      checkpoints.push({ tr: 'Z’ela / Selya Kadim Orman Yolu', en: 'Z’ela / Selya Forest Track' });
    }

    /* Kadırga deniz rotası indirimi */
    if (mode.id === 'galley' && from.sea && to.sea) {
      terrainFactor = 0.85; // açık su yolu hızı
      checkpoints.unshift({ tr: 'Gümüş Yol Açık Su Koridoru', en: 'Silver Way Maritime Corridor' });
    } else if (mode.id === 'galley' && (!from.sea && !from.river || !to.sea && !to.river)) {
      // Tamamen karasal rotada kadırga seçildiyse nehir/kara aktarması gerektirir
      terrainFactor = 1.5;
      checkpoints.push({ tr: 'Kara nakliyesi / Nehir aktarması zorunluluğu', en: 'Portage & Overland Wagon Relay Required' });
    }

    var effectiveKm = Math.round(km * terrainFactor);
    var days = Math.max(1, Math.round((effectiveKm / mode.speed) * 10) / 10);

    /* Vakanüvis Lore Notu Üretimi */
    var noteTr = '';
    var noteEn = '';

    if (mode.id === 'march') {
      noteTr = 'Ordu intikalinde erzak vagonları ve kuşatma araçları günlük menzili sınırlar. Gece ordugâhı kurulması ve keşif kolları güvenliği zorunludur.';
      noteEn = 'Army movement is constrained by baggage trains and siege equipment. Night encampment and scout outriders are mandatory.';
    } else if (mode.id === 'courier') {
      noteTr = 'İmparatorluk fermanı taşıyan atlılar, eyalet menzil hanelerinde ("Duru") at değiştirerek gece gündüz yol alabilir.';
      noteEn = 'Couriers bearing imperial decrees change mounts at provincial post stations ("Duru"), traveling day and night.';
    } else if (mode.id === 'galley') {
      noteTr = 'Gümüş Yol boyunca esen kuzey rüzgârları ve Niron akıntısı kürekçilerin işini kolaylaştırır; ancak korsan gözetleme kulelerine dikkat edilmelidir.';
      noteEn = 'Northerly winds along the Silver Way and Niron currents aid the rowers; vigilance against corsair lookouts is advised.';
    } else {
      noteTr = 'Yalnız gezgin veya casus, resmi denetim noktalarını teğet geçip keçi yollarını kullandığı için iz bırakmadan ilerler.';
      noteEn = 'A lone scout bypasses official checkpoints via goat tracks, leaving minimal footprints for trackers.';
    }

    return {
      km: effectiveKm,
      rawKm: km,
      days: days,
      mode: mode,
      from: from,
      to: to,
      checkpoints: checkpoints,
      note: { tr: noteTr, en: noteEn }
    };
  }

  /* ── Etkileşimli Widget & Görsel Arayüz ──────────────────────── */
  function mountWidget(target, opts) {
    opts = opts || {};
    var container = typeof target === 'string' ? document.getElementById(target) : target;
    if (!container) return;

    var curFrom = opts.from || 'arava';
    var curTo = opts.to || 'selya';
    var curMode = opts.mode || 'courier';

    var PRESETS = [
      { from: 'arava', to: 'selya', label: 'Arava ➔ Selya' },
      { from: 'solgar', to: 'solinor', label: 'Solgar ➔ Solinor' },
      { from: 'galetsha', to: 'memanth', label: 'Galetsha ➔ Memanth' },
      { from: 'vlaup', to: 'arava', label: 'Vlaup ➔ Arava' },
      { from: 'arava', to: 'khasinya', label: 'Arava ➔ Khasinya' },
      { from: 'ziron', to: 'todfa', label: 'Ziron ➔ Todfa' }
    ];

    function getLang() {
      if (window.Wiki && window.Wiki.Lang && window.Wiki.Lang.get) return window.Wiki.Lang.get();
      return (document.documentElement.lang === 'en') ? 'en' : 'tr';
    }

    function esc(s) {
      return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function render() {
      var l = getLang();
      var res = calculate(curFrom, curTo, curMode);
      var locKeys = Object.keys(LOCATIONS);

      var fromOpts = locKeys.map(function (k) {
        var loc = LOCATIONS[k];
        var nm = loc.name[l] || loc.name.tr;
        var prov = loc.province[l] || loc.province.tr;
        return '<option value="' + k + '"' + (k === curFrom ? ' selected' : '') + '>' + esc(nm) + ' (' + esc(prov) + ')</option>';
      }).join('');

      var toOpts = locKeys.map(function (k) {
        var loc = LOCATIONS[k];
        var nm = loc.name[l] || loc.name.tr;
        var prov = loc.province[l] || loc.province.tr;
        return '<option value="' + k + '"' + (k === curTo ? ' selected' : '') + '>' + esc(nm) + ' (' + esc(prov) + ')</option>';
      }).join('');

      var modeButtons = Object.keys(MODES).map(function (k) {
        var m = MODES[k];
        var isAct = k === curMode;
        var mName = m.name[l] || m.name.tr;
        return '<button type="button" class="tc-mode-btn' + (isAct ? ' active' : '') + '" data-mode="' + k + '" title="' + esc(m.desc[l] || m.desc.tr) + '">' +
          '<span class="tc-mode-ic">' + m.icon + '</span>' +
          '<span class="tc-mode-meta">' +
            '<span class="tc-mode-name">' + esc(mName) + '</span>' +
            '<span class="tc-mode-spd">' + m.speed + ' km/' + (l === 'en' ? 'day' : 'gün') + '</span>' +
          '</span>' +
        '</button>';
      }).join('');

      var presetChips = PRESETS.map(function (p) {
        var isP = (p.from === curFrom && p.to === curTo) || (p.from === curTo && p.to === curFrom);
        return '<button type="button" class="tc-preset-chip' + (isP ? ' active' : '') + '" data-pfrom="' + p.from + '" data-pto="' + p.to + '">' +
          esc(p.label) +
        '</button>';
      }).join('');

      var fromLoc = LOCATIONS[curFrom];
      var toLoc = LOCATIONS[curTo];
      var fromName = fromLoc.name[l] || fromLoc.name.tr;
      var toName = toLoc.name[l] || toLoc.name.tr;

      var daysVal = res.days;
      var headline = l === 'en'
        ? (fromName + ' to ' + toName + ' in ' + daysVal + ' days via ' + (res.mode.name[l] || res.mode.name.tr))
        : (fromName + '\'dan ' + toName + '\'ya ' + (curMode === 'courier' ? 'at sırtında ' : curMode === 'march' ? 'ordu yürüyüşüyle ' : curMode === 'galley' ? 'kadırga seyriyle ' : 'kervan/casus intikaliyle ') + daysVal + ' gün');

      var checkpointsHTML = '';
      if (res.checkpoints && res.checkpoints.length) {
        checkpointsHTML = '<div class="tc-checkpoints">' +
          '<div class="tc-cp-title">' + (l === 'en' ? 'Key Bottlenecks & Strategic Crossings' : 'Kritik Geçitler & Boğaz Noktaları') + ':</div>' +
          '<div class="tc-cp-list">' +
            res.checkpoints.map(function (cp) {
              return '<span class="tc-cp-badge">⚓ ' + esc(cp[l] || cp.tr) + '</span>';
            }).join('') +
          '</div>' +
        '</div>';
      }

      container.innerHTML =
        '<div class="tc-widget-box">' +
          '<div class="tc-widget-head">' +
            '<div class="tc-title-wrap">' +
              '<span class="tc-head-icon">🧭</span>' +
              '<div>' +
                '<h3 class="tc-main-title">' + (l === 'en' ? 'Continental Travel & March Calculator' : 'Mesafe & Seyahat Süresi Hesaplayıcı') + '</h3>' +
                '<p class="tc-sub-title">' + (l === 'en' ? 'Calculate overland marching, galley sailing and courier dispatches across the continent.' : 'Kıtadaki şehirler ve ordugâhlar arası yürüyüş, kadırga seyri ve süvari menzil sürelerini hesaplayın.') + '</p>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="tc-presets-bar">' +
            '<span class="tc-preset-lbl">' + (l === 'en' ? 'Quick Routes' : 'Hızlı Rotalar') + ':</span>' +
            presetChips +
          '</div>' +

          '<div class="tc-controls-grid">' +
            '<div class="tc-select-grp">' +
              '<label for="tc-from-sel">' + (l === 'en' ? 'Departure Settlement' : 'Çıkış Noktası / Karargâh') + '</label>' +
              '<div class="tc-select-wrap">' +
                '<select id="tc-from-sel" class="tc-select">' + fromOpts + '</select>' +
              '</div>' +
              '<small class="tc-loc-desc">' + esc(fromLoc.desc[l] || fromLoc.desc.tr) + '</small>' +
            '</div>' +

            '<div class="tc-swap-wrap">' +
              '<button type="button" class="tc-swap-btn" id="tc-swap-btn" title="' + (l === 'en' ? 'Reverse Points' : 'Noktaları Değiştir') + '" aria-label="Ters Çevir">⇄</button>' +
            '</div>' +

            '<div class="tc-select-grp">' +
              '<label for="tc-to-sel">' + (l === 'en' ? 'Destination Settlement' : 'Varış Noktası / Hedef') + '</label>' +
              '<div class="tc-select-wrap">' +
                '<select id="tc-to-sel" class="tc-select">' + toOpts + '</select>' +
              '</div>' +
              '<small class="tc-loc-desc">' + esc(toLoc.desc[l] || toLoc.desc.tr) + '</small>' +
            '</div>' +
          '</div>' +

          '<div class="tc-modes-section">' +
            '<div class="tc-sec-label">' + (l === 'en' ? 'Travel Method & Column Kit' : 'İntikal Tarzı & Seyahat Biçimi') + '</div>' +
            '<div class="tc-modes-grid">' + modeButtons + '</div>' +
          '</div>' +

          '<div class="tc-result-panel">' +
            '<div class="tc-result-banner">' +
              '<div class="tc-banner-icon">' + res.mode.icon + '</div>' +
              '<div class="tc-banner-text">' +
                '<div class="tc-banner-headline">' + esc(headline) + '</div>' +
                '<div class="tc-banner-sub">' + (l === 'en' ? 'Terrain-adjusted continental marching metrics' : 'Kıta topoğrafyasına göre düzeltilmiş intikal değerleri') + '</div>' +
              '</div>' +
            '</div>' +

            '<div class="tc-metrics-strip">' +
              '<div class="tc-metric-card">' +
                '<span class="tc-m-val">' + res.rawKm + ' km</span>' +
                '<span class="tc-m-lbl">' + (l === 'en' ? 'As-the-Crow-Flies' : 'Kuş Uçuşu Mesafe') + '</span>' +
              '</div>' +
              '<div class="tc-metric-card highlight">' +
                '<span class="tc-m-val">' + res.km + ' km</span>' +
                '<span class="tc-m-lbl">' + (l === 'en' ? 'Effective Route Distance' : 'Efektif Arazi Yolu') + '</span>' +
              '</div>' +
              '<div class="tc-metric-card highlight-gold">' +
                '<span class="tc-m-val">' + res.days + ' ' + (l === 'en' ? 'Days' : 'Gün') + '</span>' +
                '<span class="tc-m-lbl">' + (l === 'en' ? 'Estimated Duration' : 'Tahmini Süre') + '</span>' +
              '</div>' +
              '<div class="tc-metric-card">' +
                '<span class="tc-m-val">' + res.mode.speed + ' km/' + (l === 'en' ? 'day' : 'g') + '</span>' +
                '<span class="tc-m-lbl">' + (l === 'en' ? 'Daily Pace' : 'Günlük Ortalama') + '</span>' +
              '</div>' +
            '</div>' +

            checkpointsHTML +

            '<div class="tc-lore-note">' +
              '<span class="tc-note-icon">📜</span>' +
              '<div class="tc-note-content">' +
                '<strong>' + (l === 'en' ? 'Chronicler Terrain Note:' : 'Vakanüvis Arazi & İntikal Notu:') + '</strong> ' +
                esc(res.note[l] || res.note.tr) +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      /* Event listeners */
      var fromSel = container.querySelector('#tc-from-sel');
      var toSel = container.querySelector('#tc-to-sel');
      var swapBtn = container.querySelector('#tc-swap-btn');

      if (fromSel) {
        fromSel.onchange = function () {
          curFrom = this.value;
          render();
        };
      }
      if (toSel) {
        toSel.onchange = function () {
          curTo = this.value;
          render();
        };
      }
      if (swapBtn) {
        swapBtn.onclick = function () {
          var tmp = curFrom;
          curFrom = curTo;
          curTo = tmp;
          render();
        };
      }

      container.querySelectorAll('.tc-mode-btn').forEach(function (btn) {
        btn.onclick = function () {
          curMode = this.dataset.mode;
          render();
        };
      });

      container.querySelectorAll('.tc-preset-chip').forEach(function (chip) {
        chip.onclick = function () {
          curFrom = this.dataset.pfrom;
          curTo = this.dataset.pto;
          render();
        };
      });
    }

    render();

    document.addEventListener('langchange', function () {
      render();
    });

    return {
      recalculate: render,
      setFrom: function (f) { curFrom = f; render(); },
      setTo: function (t) { curTo = t; render(); },
      setMode: function (m) { curMode = m; render(); }
    };
  }

  /* Modal olarak açma */
  function openModal(opts) {
    opts = opts || {};
    var overlay = document.createElement('div');
    overlay.className = 'tc-modal-overlay';
    overlay.innerHTML =
      '<div class="tc-modal-dialog" role="dialog" aria-modal="true" aria-label="Mesafe & Seyahat Süresi">' +
        '<button type="button" class="tc-modal-close" aria-label="Kapat">✕</button>' +
        '<div class="tc-modal-mount" id="tc-modal-inner"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    var closeBtn = overlay.querySelector('.tc-modal-close');
    function close() {
      overlay.remove();
      document.body.classList.remove('tc-no-scroll');
    }
    closeBtn.onclick = close;
    overlay.onclick = function (e) {
      if (e.target === overlay) close();
    };
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', escHandler);
      }
    });

    document.body.classList.add('tc-no-scroll');
    mountWidget('tc-modal-inner', opts);
  }

  w.SWTravel = {
    locations: LOCATIONS,
    modes: MODES,
    distanceKm: distanceKm,
    calculate: calculate,
    mountWidget: mountWidget,
    openModal: openModal
  };
})(window);

