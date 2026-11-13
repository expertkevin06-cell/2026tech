/* ============================================================================
   KDB — moteur relationnel de croisement dynamique
   Consomme window.KDB_RAW (db-core.js) et window.KDB_FAULTS_RAW (db-faults.js)
   Expose une API de cascade et de scoring prédictif.
   ========================================================================== */
(function () {
"use strict";

function nrm(s) {
  s = (s == null ? "" : String(s)).toLowerCase();
  try { s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) {}
  return s.replace(/[^a-z0-9]+/g, " ").replace(/^ +| +$/g, "");
}
function trm(s) { return String(s == null ? "" : s).replace(/^ +| +$/g, ""); }
function arr(a) { return Object.prototype.toString.call(a) === "[object Array]"; }
function each(a, f) { var i; if (!a) return; for (i = 0; i < a.length; i++) f(a[i], i); }
function has(a, v) { return a.indexOf(v) >= 0; }
function uniq(a) { var o = [], i; for (i = 0; i < a.length; i++) if (!has(o, a[i])) o.push(a[i]); return o; }
function splitList(s) {
  var o = [], a = String(s || "").split(/[,;]/), i, t;
  for (i = 0; i < a.length; i++) { t = trm(a[i]); if (t) o.push(t); }
  return o;
}
function nums(s) {
  var m = String(s || "").match(/\d{1,4}/g) || [], o = [], i, n;
  for (i = 0; i < m.length; i++) { n = parseInt(m[i], 10); if (!isNaN(n)) o.push(n); }
  return o;
}
function range(s) {
  var n = nums(s);
  if (!n.length) return null;
  return [Math.min.apply(null, n), Math.max.apply(null, n)];
}
function years(s) {
  var m = String(s || "").match(/(?:19|20)\d{2}/g) || [], o = [], i;
  for (i = 0; i < m.length; i++) o.push(parseInt(m[i], 10));
  if (!o.length) return null;
  return [Math.min.apply(null, o), Math.max.apply(null, o)];
}
function inRange(v, r) { return !!(v && r && v >= r[0] && v <= r[1]); }
function hash(s) {
  var h = 2166136261, i; s = String(s);
  for (i = 0; i < s.length; i++) { h = h ^ s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return ("00000000" + h.toString(36)).slice(-8);
}
function fuelName(c) {
  if (c === "d") return "diesel";
  if (c === "h") return "hybride";
  if (c === "el") return "electrique";
  return "essence";
}

var K = {
  ready: false,
  brands: [], models: [], engines: [], versions: [], faults: [],
  B: {}, M: {}, E: {}, V: {}, F: {},
  modelsByBrand: {}, versionsByModel: {}, versionsByModelEngine: {},
  enginesByModel: {}, faultsByEngine: {}, faultsByModel: {}, faultsByBrand: {},
  systems: {}, stats: {}
};

function parseLines(txt, cb) {
  var lines = String(txt || "").split("\n"), i, p;
  for (i = 0; i < lines.length; i++) {
    p = lines[i].split("|");
    if (p.length >= 2) cb(p, i);
  }
}

function build() {
  var raw = window.KDB_RAW || {};
  var seenM = {};

  parseLines(raw.B, function (p) {
    var b = { id: p[0], name: p[1], alias: p[2] || "", group: p[3] || "", country: p[4] || "" };
    b._n = nrm(b.name + " " + b.alias);
    K.brands.push(b); K.B[b.id] = b;
  });

  parseLines(raw.M, function (p) {
    var id = p[0];
    if (seenM[id]) { id = id + "_" + hash(p.join("|")); }
    seenM[p[0]] = id;
    var m = {
      id: id, brandId: p[1], name: p[2], alias: p[3] || "",
      start: parseInt(p[4], 10) || 0, end: parseInt(p[5], 10) || 2027
    };
    m._n = nrm(m.name + " " + m.alias);
    m.brand = K.B[m.brandId] || null;
    K.models.push(m); K.M[m.id] = m;
    if (!K.modelsByBrand[m.brandId]) K.modelsByBrand[m.brandId] = [];
    K.modelsByBrand[m.brandId].push(m);
  });

  parseLines(raw.E, function (p) {
    var e = {
      id: p[0], code: p[1], designation: p[2], cc: parseInt(p[3], 10) || 0,
      fuel: fuelName(p[4]), arch: p[5] || "", dist: p[6] || "", inj: p[7] || ""
    };
    e._n = nrm(e.code + " " + e.designation + " " + e.arch + " " + e.dist + " " + e.inj);
    K.engines.push(e); K.E[e.id] = e;
  });

  parseLines(raw.V, function (p) {
    var modelId = p[0], engineId = p[1], chs = nums(p[2]),
        start = parseInt(p[3], 10) || 0, end = parseInt(p[4], 10) || 2027, i, v;
    if (!K.M[modelId] || !K.E[engineId]) return;
    for (i = 0; i < chs.length; i++) {
      v = {
        id: modelId + "_" + engineId + "_" + chs[i],
        modelId: modelId, engineId: engineId, ch: chs[i],
        kw: Math.round(chs[i] / 1.35962), start: start, end: end
      };
      v.model = K.M[modelId]; v.engine = K.E[engineId]; v.brand = v.model.brand;
      K.versions.push(v); K.V[v.id] = v;
      if (!K.versionsByModel[modelId]) K.versionsByModel[modelId] = [];
      K.versionsByModel[modelId].push(v);
      var k = modelId + "|" + engineId;
      if (!K.versionsByModelEngine[k]) K.versionsByModelEngine[k] = [];
      K.versionsByModelEngine[k].push(v);
      if (!K.enginesByModel[modelId]) K.enginesByModel[modelId] = {};
      K.enginesByModel[modelId][engineId] = true;
    }
  });

  each(window.KDB_FAULTS_RAW || [], function (line) {
    var p = String(line).split("|");
    if (p.length < 17) return;
    var f = {
      id: p[0], title: p[1], sys: p[2], grav: p[3], fire: p[4] === "1",
      targets: { E: splitList(p[5]), M: splitList(p[6]), B: splitList(p[7]), P: range(p[8]), Y: years(p[9]) },
      dtc: splitList(p[10]), sym: splitList(p[11]), meca: p[12],
      cons: splitList(p[13]), ind: splitList(p[14]), chain: p[15], source: p[16] || "base-kevin"
    };
    f._h = nrm([f.title, f.sys, f.meca, f.cons.join(" "), f.sym.join(" "), f.dtc.join(" "), f.ind.join(" "), f.chain].join(" "));
    addFaultIndexes(f);
    K.faults.push(f); K.F[f.id] = f;
    if (f.sys) K.systems[f.sys] = 1;
  });

  K.ready = true;
  computeStats();
}

function addFaultIndexes(f) {
  each(f.targets.E, function (id) {
    if (!K.faultsByEngine[id]) K.faultsByEngine[id] = [];
    K.faultsByEngine[id].push(f);
  });
  each(f.targets.M, function (id) {
    if (!K.faultsByModel[id]) K.faultsByModel[id] = [];
    K.faultsByModel[id].push(f);
  });
  each(f.targets.B, function (id) {
    if (!K.faultsByBrand[id]) K.faultsByBrand[id] = [];
    K.faultsByBrand[id].push(f);
  });
}

function computeStats() {
  K.stats = {
    brands: K.brands.length,
    models: K.models.length,
    engines: K.engines.length,
    versions: K.versions.length,
    faults: K.faults.length,
    fire: K.faults.filter(function (f) { return f.fire; }).length,
    systems: Object.keys(K.systems).length
  };
}

function brandMatches(b, q) { return !q || b._n.indexOf(q) >= 0; }
function modelMatches(m, q) { return !q || m._n.indexOf(q) >= 0; }

function getBrands(q) {
  q = nrm(q);
  var o = [], i, b, n;
  for (i = 0; i < K.brands.length; i++) {
    b = K.brands[i];
    if (!brandMatches(b, q)) continue;
    n = (K.modelsByBrand[b.id] || []).length;
    o.push({ id: b.id, name: b.name, alias: b.alias, group: b.group, country: b.country, models: n });
  }
  o.sort(function (a, b2) { return a.name.localeCompare(b2.name); });
  return o;
}

function getModels(brandId, q) {
  q = nrm(q);
  var list = brandId ? (K.modelsByBrand[brandId] || []) : K.models, o = [], i, m, n;
  for (i = 0; i < list.length; i++) {
    m = list[i];
    if (!modelMatches(m, q)) continue;
    n = (K.versionsByModel[m.id] || []).length;
    o.push({ id: m.id, brandId: m.brandId, name: m.name, alias: m.alias, start: m.start, end: m.end, versions: n, brand: m.brand ? m.brand.name : "" });
  }
  o.sort(function (a, b2) { return a.name.localeCompare(b2.name); });
  return o;
}

function getEngines(brandId, modelId, q) {
  q = nrm(q);
  var vs = modelId ? (K.versionsByModel[modelId] || []) : [], map = {}, i, v, e, o = [];
  for (i = 0; i < vs.length; i++) {
    v = vs[i];
    if (brandId && v.model.brandId !== brandId) continue;
    if (!map[v.engineId]) map[v.engineId] = { engine: v.engine, powers: {}, years: [v.start, v.end], versions: 0 };
    map[v.engineId].powers[v.ch] = 1;
    map[v.engineId].years[0] = Math.min(map[v.engineId].years[0], v.start);
    map[v.engineId].years[1] = Math.max(map[v.engineId].years[1], v.end);
    map[v.engineId].versions++;
  }
  for (var k in map) {
    if (!map.hasOwnProperty(k)) continue;
    e = map[k].engine;
    if (q && e._n.indexOf(q) < 0) continue;
    o.push({
      id: e.id, code: e.code, designation: e.designation, cc: e.cc, fuel: e.fuel,
      arch: e.arch, dist: e.dist, inj: e.inj,
      powers: Object.keys(map[k].powers).map(Number).sort(function (a, b2) { return a - b2; }),
      years: map[k].years, versions: map[k].versions
    });
  }
  o.sort(function (a, b2) { return a.designation.localeCompare(b2.designation); });
  return o;
}

function getPowers(brandId, modelId, engineId) {
  var vs = K.versionsByModelEngine[modelId + "|" + engineId] || [], s = {}, i, o = [];
  for (i = 0; i < vs.length; i++) {
    if (brandId && vs[i].model.brandId !== brandId) continue;
    s[vs[i].ch] = 1;
  }
  for (var k in s) if (s.hasOwnProperty(k)) o.push(parseInt(k, 10));
  o.sort(function (a, b2) { return a - b2; });
  return o;
}

function getVersions(sel) {
  var vs = K.versions, o = [], i, v;
  for (i = 0; i < vs.length; i++) {
    v = vs[i];
    if (sel.brandId && v.model.brandId !== sel.brandId) continue;
    if (sel.modelId && v.modelId !== sel.modelId) continue;
    if (sel.engineId && v.engineId !== sel.engineId) continue;
    if (sel.ch && v.ch !== sel.ch) continue;
    if (sel.year && !inRange(sel.year, [v.start, v.end])) continue;
    o.push(v);
  }
  return o;
}

function resolveBrand(text) {
  var q = nrm(text), i, b;
  if (!q) return null;
  for (i = 0; i < K.brands.length; i++) {
    b = K.brands[i];
    if (nrm(b.name) === q) return b;
  }
  for (i = 0; i < K.brands.length; i++) {
    b = K.brands[i];
    if (b._n.indexOf(q) >= 0 || q.indexOf(nrm(b.name)) >= 0) return b;
  }
  return null;
}
function resolveModel(brandId, text) {
  var q = nrm(text), list = brandId ? (K.modelsByBrand[brandId] || []) : K.models, i, m;
  if (!q) return null;
  for (i = 0; i < list.length; i++) { m = list[i]; if (nrm(m.name) === q) return m; }
  for (i = 0; i < list.length; i++) { m = list[i]; if (m._n.indexOf(q) >= 0 || q.indexOf(nrm(m.name)) >= 0) return m; }
  return null;
}
function resolveEngine(modelId, text) {
  var q = nrm(text), es = getEngines(null, modelId, null), i, e;
  if (!q) return null;
  for (i = 0; i < es.length; i++) { e = es[i]; if (nrm(e.code) === q || nrm(e.designation) === q) return e; }
  for (i = 0; i < es.length; i++) {
    e = es[i];
    if (nrm(e.code + " " + e.designation).indexOf(q) >= 0 || q.indexOf(nrm(e.designation)) >= 0) return e;
  }
  return null;
}
function resolvePower(brandId, modelId, engineId, ch) {
  var ps = getPowers(brandId, modelId, engineId), i, best = null, d, bd = 1e9;
  ch = parseInt(ch, 10) || 0;
  if (!ch) return null;
  for (i = 0; i < ps.length; i++) {
    if (ps[i] === ch) return ps[i];
    d = Math.abs(ps[i] - ch);
    if (d < bd) { bd = d; best = ps[i]; }
  }
  return bd <= 15 ? best : null;
}

function resolveVehicle(v) {
  var b = resolveBrand(v.make || v.brand || "");
  var m = b ? resolveModel(b.id, v.model || "") : null;
  var e = m ? resolveEngine(m.id, v.engine || "") : null;
  var ch = e ? resolvePower(b.id, m.id, e.id, v.power || v.ch) : null;
  return {
    brand: b, model: m, engine: e, ch: ch,
    year: parseInt(v.year, 10) || 0,
    fuel: v.fuel || (e ? e.fuel : ""),
    versions: m ? getVersions({ brandId: b ? b.id : null, modelId: m.id, engineId: e ? e.id : null, ch: ch, year: parseInt(v.year, 10) || 0 }) : []
  };
}

function candidateFaults(sel) {
  var set = {}, out = [], i, f;
  function add(list) { each(list || [], function (x) { if (!set[x.id]) { set[x.id] = 1; out.push(x); } }); }
  if (sel.engine && sel.engine.id) add(K.faultsByEngine[sel.engine.id]);
  if (sel.model && sel.model.id) add(K.faultsByModel[sel.model.id]);
  if (sel.brand && sel.brand.id) add(K.faultsByBrand[sel.brand.id]);
  if (!out.length) out = K.faults.slice(0);
  else {
    for (i = 0; i < K.faults.length; i++) {
      f = K.faults[i];
      if (!f.targets.E.length && !f.targets.M.length && !f.targets.B.length) add([f]);
    }
  }
  return out;
}

function scoreFault(f, sel, q) {
  var s = 0, why = [], i, toks = nrm(q || "").split(" "), t;
  var brandId = sel.brand ? sel.brand.id : null;
  var modelId = sel.model ? sel.model.id : null;
  var engineId = sel.engine ? sel.engine.id : null;
  var ch = sel.ch || 0, year = sel.year || 0;

  if (engineId && has(f.targets.E, engineId)) { s += 14; why.push("code moteur exact"); }
  if (modelId && has(f.targets.M, modelId)) { s += 10; why.push("modèle exact"); }
  if (brandId && has(f.targets.B, brandId)) { s += 5; why.push("marque exacte"); }
  if (ch && f.targets.P && inRange(ch, f.targets.P)) { s += 5; why.push("puissance dans plage"); }
  if (year && f.targets.Y && inRange(year, f.targets.Y)) { s += 4; why.push("millésime dans plage"); }

  if (sel.dtc && sel.dtc.length) {
    for (i = 0; i < sel.dtc.length; i++) if (has(f.dtc, sel.dtc[i])) { s += 9; why.push("DTC " + sel.dtc[i]); }
  }
  if (sel.sym && sel.sym.length) {
    for (i = 0; i < sel.sym.length; i++) {
      if (f._h.indexOf(nrm(sel.sym[i])) >= 0) { s += 3; why.push("symptôme " + sel.sym[i]); }
    }
  }
  for (i = 0; i < toks.length; i++) {
    t = toks[i];
    if (t.length < 3) continue;
    if (nrm(f.title).indexOf(t) >= 0) s += 3;
    else if (f._h.indexOf(t) >= 0) s += 1;
  }
  if (f.fire) s += 1;
  if (f.grav === "critique") s += 1;
  return { fault: f, score: s, why: uniq(why) };
}

function searchFaults(opt) {
  opt = opt || {};
  var sel = {
    brand: opt.brand || null, model: opt.model || null, engine: opt.engine || null,
    ch: opt.ch || 0, year: opt.year || 0, dtc: opt.dtc || [], sym: opt.sym || []
  };
  var list = candidateFaults(sel), out = [], i, r, f;
  for (i = 0; i < list.length; i++) {
    f = list[i];
    if (opt.theme === "incendie" && !f.fire) continue;
    if (opt.theme === "technique" && f.fire && opt.strictTech) continue;
    if (opt.sys && nrm(f.sys) !== nrm(opt.sys)) continue;
    if (opt.grav && f.grav !== opt.grav) continue;
    if (opt.quick === "fire" && !f.fire) continue;
    if (opt.quick === "dtc" && !f.dtc.length) continue;
    if (opt.quick === "mega" && f.source !== "base-kevin") continue;
    r = scoreFault(f, sel, opt.text);
    if (opt.text && r.score <= 0) continue;
    out.push(r);
  }
  out.sort(function (a, b) {
    if (opt.sort === "grav") return gravRank(b.fault) - gravRank(a.fault) || b.score - a.score;
    if (opt.sort === "az") return a.fault.title.localeCompare(b.fault.title);
    return b.score - a.score || gravRank(b.fault) - gravRank(a.fault);
  });
  return out;
}
function gravRank(f) { return f.grav === "critique" ? 3 : f.grav === "eleve" ? 2 : 1; }

function searchVehicles(q) {
  q = nrm(q);
  if (!q) return [];
  var toks = q.split(" "), out = [], i, j, m, b, s, t;
  for (i = 0; i < K.models.length; i++) {
    m = K.models[i]; b = m.brand; s = 0;
    for (j = 0; j < toks.length; j++) {
      t = toks[j];
      if (t.length < 2) continue;
      if (b && nrm(b.name).indexOf(t) >= 0) s += 4;
      if (m._n.indexOf(t) >= 0) s += 5;
    }
    if (s >= 5) out.push({ score: s, model: m, brand: b, engines: getEngines(b ? b.id : null, m.id, null) });
  }
  out.sort(function (a, b2) { return b2.score - a.score; });
  return out.slice(0, 8);
}

function addFaults(list) {
  each(list || [], function (f) {
    if (!f || !f.id || !f.title) return;
    if (K.F[f.id]) {
      K.F[f.id] = f;
      return;
    }
    f._h = nrm([f.title, f.sys, f.meca, (f.cons || []).join(" "), (f.sym || []).join(" "), (f.dtc || []).join(" "), (f.ind || []).join(" "), f.chain].join(" "));
    f.targets = f.targets || { E: [], M: [], B: [], P: null, Y: null };
    addFaultIndexes(f);
    K.faults.push(f); K.F[f.id] = f;
    if (f.sys) K.systems[f.sys] = 1;
  });
  computeStats();
}

function externalFault(o, source) {
  var title = o.title || o.defaut || o.titre || o.panne || o.libelle || "";
  if (!title) return null;
  var make = o.make || o.marque || "", model = o.model || o.modele || "", engine = o.engine || o.motorisation || "";
  var b = resolveBrand(make), m = b ? resolveModel(b.id, model) : null, e = m ? resolveEngine(m.id, engine) : null;
  var raw = ""; try { raw = JSON.stringify(o); } catch (x) {}
  var fire = o.fire === true || o.risque_feu === true || /incendie|feu|flamme|inflamm/i.test(raw);
  return {
    id: o.id || ("ext-" + hash(source + title + make + model + engine)),
    title: String(title).slice(0, 300), sys: o.sys || o.systeme || o.organe || "",
    grav: o.grav || o.gravite || (fire ? "critique" : "eleve"), fire: fire,
    targets: { E: e ? [e.id] : [], M: m ? [m.id] : [], B: b ? [b.id] : [], P: range(o.powers || o.puissance), Y: years(o.years || o.annees) },
    dtc: splitList(o.dtc || o.codes), sym: splitList(o.sym || o.symptomes),
    meca: o.meca || o.mecanisme || o.description || o.cause || "",
    cons: splitList(o.cons || o.consequences), ind: splitList(o.ind || o.indices),
    chain: o.chain || o.chaine_feu || (fire ? "Défaut documenté → mécanisme → risque incendie" : ""),
    source: source || "externe"
  };
}

function ingestExternal(data, source) {
  var out = [];
  function walk(n) {
    var i, f;
    if (!n) return;
    if (arr(n)) { for (i = 0; i < n.length; i++) walk(n[i]); return; }
    if (typeof n !== "object") return;
    f = externalFault(n, source);
    if (f) out.push(f);
    for (var k in n) if (n.hasOwnProperty(k) && n[k] && typeof n[k] === "object") walk(n[k]);
  }
  walk(data);
  addFaults(out);
  return out.length;
}

build();

window.KDB = {
  ready: K.ready,
  stats: function () { return K.stats; },
  brands: getBrands,
  models: getModels,
  engines: getEngines,
  powers: getPowers,
  versions: getVersions,
  resolveBrand: resolveBrand,
  resolveModel: resolveModel,
  resolveEngine: resolveEngine,
  resolvePower: resolvePower,
  resolveVehicle: resolveVehicle,
  faults: searchFaults,
  searchVehicles: searchVehicles,
  systems: function () { return Object.keys(K.systems).sort(); },
  addFaults: addFaults,
  ingestExternal: ingestExternal,
  allFaults: function () { return K.faults; },
  faultById: function (id) { return K.F[id] || null; },
  brandById: function (id) { return K.B[id] || null; },
  modelById: function (id) { return K.M[id] || null; },
  engineById: function (id) { return K.E[id] || null; }
};
})();
