/* ═══════════════════════════════════════════════════════════════
   STALLHART WIKI — İçerik Yamaları (SWPatches)
   ---------------------------------------------------------------
   Onaylanan topluluk önerileri "yama" olarak saklanır ve data/*.json
   içeriğinin ÜZERİNE uygulanır. Bu dosya tek bir mantığı üç yerde
   paylaştırır, böylece hepsi aynı sonucu üretir:

     · Tarayıcı  → wiki.js loadData() yamaları canlı bindirir
     · Admin     → "birleştirilmiş JSON" dışa aktarımı
     · Node      → scripts/sync-patches.mjs (GitHub Action)

   Yama biçimi (content_patches satırı ile aynı):
     { file:      "characters.json",
       path:      "characters",            ← JSON içindeki dizinin yolu
       record_id: "zeandor",               ← kaydın id'si
       op:        "merge" | "upsert" | "delete",
       data:      { title: { tr: "…" } } } ← birleştirilecek alanlar

   path: noktalı yol. "*" dizideki her öğe demektir:
         "provinces.*.houses" → her eyaletin hane listesi.
   op  : merge  → kayıt VARSA alanları derinlemesine birleştirir
         upsert → kayıt yoksa ekler (yalnızca "*"'sız yolda), varsa birleştirir
         delete → kaydı siler

   Her işlem idempotenttir: aynı yamayı iki kez uygulamak sonucu
   değiştirmez. Bu yüzden JSON'a işlenmiş bir yama yanlışlıkla tekrar
   bindirilse bile veri bozulmaz.
   ═══════════════════════════════════════════════════════════════ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SWPatches = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var FILES = ['characters.json', 'chapters.json', 'quotes.json', 'lore.json',
               'houses.json', 'kingdoms.json', 'geography.json', 'language.json'];
  var OPS = ['upsert', 'merge', 'delete'];

  function isObj(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }
  function clone(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }
  /* Prototype kirletme (prototype pollution) koruması */
  function blocked(k) { return k === '__proto__' || k === 'constructor' || k === 'prototype'; }

  /* src'nin alanlarını target'a derinlemesine yazar.
     Nesneler birleştirilir; dizi ve düz değerler DEĞİŞTİRİLİR. */
  function deepMerge(target, src) {
    Object.keys(src).forEach(function (k) {
      if (blocked(k)) return;
      var v = src[k];
      if (isObj(v)) {
        if (!isObj(target[k])) target[k] = {};
        deepMerge(target[k], v);
      } else {
        target[k] = clone(v);
      }
    });
    return target;
  }

  function withoutId(data) {
    var out = {};
    Object.keys(data || {}).forEach(function (k) { if (k !== 'id') out[k] = data[k]; });
    return out;
  }

  /* path'in gösterdiği tüm dizileri döndürür. create=true ise ("*" yoksa)
     eksik son dizi oluşturulur. */
  function collectArrays(json, path, create) {
    var segs = String(path).split('.');
    var nodes = [json];
    for (var i = 0; i < segs.length; i++) {
      var seg = segs[i], last = i === segs.length - 1, next = [];
      for (var j = 0; j < nodes.length; j++) {
        var n = nodes[j];
        if (seg === '*') {
          if (Array.isArray(n)) n.forEach(function (x) { next.push(x); });
        } else if (isObj(n) && !blocked(seg)) {
          if (n[seg] === undefined && create && last) n[seg] = [];
          if (n[seg] !== undefined) next.push(n[seg]);
        }
      }
      nodes = next;
    }
    return nodes.filter(Array.isArray);
  }

  function findIn(arrays, id) {
    for (var a = 0; a < arrays.length; a++) {
      var arr = arrays[a];
      for (var i = 0; i < arr.length; i++) {
        if (isObj(arr[i]) && String(arr[i].id) === String(id)) return { arr: arr, index: i };
      }
    }
    return null;
  }

  /* Kaydı bul (yalnızca okuma). Bulunamazsa null. */
  function find(json, path, id) {
    if (!isObj(json)) return null;
    var hit = findIn(collectArrays(json, path, false), id);
    return hit ? hit.arr[hit.index] : null;
  }

  /* Dizideki mevcut id'ler sayıysa ve yeni id de sayıysa sayı olarak ekle. */
  function coerceId(arr, id) {
    var numeric = arr.length > 0 && arr.every(function (r) { return !isObj(r) || typeof r.id === 'number'; });
    return numeric && /^\d+$/.test(String(id)) ? Number(id) : String(id);
  }

  /* Tek yamayı json üzerine (yerinde) uygular. Uygulandıysa true. */
  function applyOne(json, p) {
    if (!isObj(json) || !p || typeof p.path !== 'string' || OPS.indexOf(p.op) < 0) return false;
    var wild = p.path.indexOf('*') >= 0;
    var arrays = collectArrays(json, p.path, p.op === 'upsert' && !wild);
    var hit = findIn(arrays, p.record_id);
    var data = isObj(p.data) ? p.data : {};

    if (p.op === 'delete') {
      if (!hit) return false;
      hit.arr.splice(hit.index, 1);
      return true;
    }
    if (p.op === 'merge') {
      if (!hit) return false;
      deepMerge(hit.arr[hit.index], withoutId(data));
      return true;
    }
    /* upsert */
    if (hit) { deepMerge(hit.arr[hit.index], withoutId(data)); return true; }
    if (wild || !arrays.length) return false;
    var rec = deepMerge({}, withoutId(data));
    rec.id = coerceId(arrays[0], p.record_id);
    arrays[0].push(rec);
    return true;
  }

  /* Bir dosyaya ait yamaların tümünü sırayla uygular; uygulanan sayısını döndürür. */
  function applyAll(json, file, patches) {
    var n = 0;
    (patches || []).forEach(function (p) {
      if (!p || p.file !== file) return;
      try { if (applyOne(json, p)) n++; } catch (e) { /* bozuk yama siteyi düşürmesin */ }
    });
    return n;
  }

  /* Yama biçimini doğrular. Sorun yoksa null, varsa Türkçe hata metni. */
  function validate(p) {
    if (!isObj(p)) return 'Yama bir nesne olmalı.';
    if (FILES.indexOf(p.file) < 0) return 'Geçersiz dosya: ' + p.file;
    if (typeof p.path !== 'string' || !/^[A-Za-z0-9_.*-]{1,80}$/.test(p.path)) return 'Geçersiz path.';
    if (OPS.indexOf(p.op) < 0) return 'Geçersiz işlem (op): ' + p.op;
    if (typeof p.record_id !== 'string' && typeof p.record_id !== 'number') return 'record_id eksik.';
    var rid = String(p.record_id);
    if (rid.length < 1 || rid.length > 120) return 'record_id 1–120 karakter olmalı.';
    if (!isObj(p.data)) return 'data bir nesne olmalı.';
    if (p.op === 'upsert' && p.path.indexOf('*') >= 0) return "upsert, '*' içeren path ile kullanılamaz.";
    if (JSON.stringify(p.data).length > 40000) return 'data çok büyük (en fazla 40 KB).';
    return null;
  }

  return {
    FILES: FILES, OPS: OPS,
    deepMerge: deepMerge, find: find,
    applyOne: applyOne, applyAll: applyAll, validate: validate
  };
}));
