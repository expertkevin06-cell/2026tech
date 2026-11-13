/* ============================================================================
   KEV TECH & FIRE — app.js  v2026.11
   Moteur applicatif complet · ES5 strict · aucune dépendance externe
   Catalogue  : window.KTF_CAT      (catalogue.js)
   Méga base  : window.KTF_FAULTS   (pannes.js)
   ========================================================================== */
(function () {
"use strict";

/* ═══════════════════════ 1. OUTILS ═══════════════════════ */
function H() {
  var s = "", i, a;
  for (i = 0; i < arguments.length; i++) {
    a = arguments[i];
    if (a !== null && a !== undefined) s += String(a);
  }
  return s;
}
function $(i) { return document.getElementById(i); }
function esc(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function nrm(s) {
  s = (s === null || s === undefined) ? "" : String(s).toLowerCase();
  try { s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) {}
  return s.replace(/[^a-z0-9]+/g, " ").replace(/^ +| +$/g, "");
}
function trm(s) { return String(s === null || s === undefined ? "" : s).replace(/^ +| +$/g, ""); }
function isArr(a) { return Object.prototype.toString.call(a) === "[object Array]"; }
function each(a, f) { var i; if (!a) return; for (i = 0; i < a.length; i++) f(a[i], i); }
function has(a, v) { return a.indexOf(v) >= 0; }
function uniq(a) { var o = [], i; for (i = 0; i < a.length; i++) if (!has(o, a[i])) o.push(a[i]); return o; }
function lines(v) {
  var o = [], i, p, t;
  if (isArr(v)) { for (i = 0; i < v.length; i++) if (v[i]) o.push(String(v[i])); return o; }
  if (typeof v === "string") {
    p = v.split(/\r?\n|;/);
    for (i = 0; i < p.length; i++) { t = trm(p[i]); if (t) o.push(t); }
  }
  return o;
}
function hash(s) {
  var h = 2166136261, i;
  s = String(s);
  for (i = 0; i < s.length; i++) { h = h ^ s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return ("00000000" + h.toString(36)).slice(-8);
}
function sig(m) { return H(hash("A" + m), hash("B" + m), hash("C" + m), hash("D" + m)); }
function fkey(e) { return e.id || hash([e.source, e.make, e.model, e.engine, e.title].join("|")); }
function tc(s) {
  return String(s).replace(/\b[a-zà-ÿ]/g, function (c) { return c.toUpperCase(); });
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function cls(el, c, on) {
  if (!el) return;
  var cur = " " + el.className + " ";
  if (on) { if (cur.indexOf(" " + c + " ") < 0) el.className = trm(el.className + " " + c); }
  else { el.className = trm(cur.replace(" " + c + " ", " ")); }
}
function debounce(fn, ms) {
  var t = null;
  return function () {
    var a = arguments, self = this;
    if (t) clearTimeout(t);
    t = setTimeout(function () { t = null; fn.apply(self, a); }, ms || 160);
  };
}
function toast(m, ms, undo) {
  var box = $("toasts"); if (!box) return;
  var d = document.createElement("div");
  d.className = "toast";
  var s = document.createElement("span");
  s.innerHTML = m;
  d.appendChild(s);
  if (undo) {
    var b = document.createElement("button");
    b.className = "btn gh sm";
    b.innerHTML = "↩️ Annuler";
    b.onclick = function () {
      try { undo(); } catch (e) {}
      if (d.parentNode) d.parentNode.removeChild(d);
    };
    d.appendChild(b);
  }
  box.appendChild(d);
  setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, ms || 4200);
}
function save(k, v) {
  try {
    if (v === undefined) { var r = localStorage.getItem("ktf:" + k); return r ? JSON.parse(r) : null; }
    if (v === null) { localStorage.removeItem("ktf:" + k); return null; }
    localStorage.setItem("ktf:" + k, JSON.stringify(v));
    return v;
  } catch (e) { return null; }
}
function saveBig(k, arr) {
  var caps = [1500, 800, 400, 150], i;
  for (i = 0; i < caps.length; i++) if (save(k, arr.slice(0, caps[i])) !== null) return;
}
function dl(n, t) {
  try {
    var b = new Blob([t], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = n;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 400);
  } catch (e) { toast("Export impossible sur ce navigateur."); }
}
function copy(t) {
  if (!t) { toast("Rien à copier."); return; }
  try {
    var ta = document.createElement("textarea");
    ta.value = t;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    var ok = document.execCommand("copy");
    document.body.removeChild(ta);
    if (ok) { toast("📋 Copié dans le presse-papier."); return; }
  } catch (e) {}
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(t).then(
      function () { toast("📋 Copié."); },
      function () { toast("Copie refusée — sélectionne le texte."); }
    );
    return;
  }
  toast("Copie indisponible.");
}
function req(url, ms, cb, method, body, ctype) {
  try {
    var x = new XMLHttpRequest();
    x.open(method || "GET", url, true);
    x.timeout = ms || 9000;
    if (ctype) { try { x.setRequestHeader("Content-Type", ctype); } catch (e) {} }
    x.onload = function () {
      cb(null, {
        ok: x.status >= 200 && x.status < 300,
        status: x.status,
        text: x.responseText,
        loc: x.getResponseHeader ? x.getResponseHeader("Location") : "",
        xid: x.getResponseHeader ? x.getResponseHeader("X-JsonBlob-Id") : ""
      });
    };
    x.onerror = function () { cb("réseau indisponible"); };
    x.ontimeout = function () { cb("délai dépassé"); };
    x.onabort = function () { cb("requête annulée"); };
    x.send(body || null);
  } catch (e) { cb(e.message || "erreur réseau"); }
}
function jget(url, ms, cb) {
  req(url, ms, function (e, r) {
    if (e || !r || !r.ok) { cb(null); return; }
    try { cb(JSON.parse(r.text)); } catch (x) { cb(null); }
  });
}
function fetchText(url, ms, cb) { req(url, ms, function (e, r) { cb(e, r ? r.text : ""); }); }
function upAct(el) {
  while (el && el !== document) {
    if (el.getAttribute && el.getAttribute("data-act")) return el;
    el = el.parentNode;
  }
  return null;
}
function inId(el, id) {
  while (el && el !== document) { if (el.id === id) return true; el = el.parentNode; }
  return false;
}
function fire(el, n) {
  var e;
  try { e = new Event(n, { bubbles: true }); }
  catch (x) { e = document.createEvent("HTMLEvents"); e.initEvent(n, true, false); }
  el.dispatchEvent(e);
}
function guard(f, label) {
  try { return f(); }
  catch (e) {
    if (window.onerror) window.onerror(H(label, " : ", e.message), "app.js", 0, 0, e);
    return null;
  }
}

/* ═══════════════════════ 2. STOCKAGE INDEXEDDB ═══════════════════════ */
var IDB = {
  db: null,
  open: function (cb) {
    if (this.db) { cb(this.db); return; }
    if (!window.indexedDB) { cb(null); return; }
    try {
      var r = indexedDB.open("ktf-store", 1);
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains("kv")) d.createObjectStore("kv");
      };
      r.onsuccess = function () { IDB.db = r.result; cb(IDB.db); };
      r.onerror = function () { cb(null); };
      r.onblocked = function () { cb(null); };
    } catch (e) { cb(null); }
  },
  set: function (k, v, cb) {
    this.open(function (d) {
      if (!d) { if (cb) cb(false); return; }
      try {
        var t = d.transaction("kv", "readwrite");
        t.objectStore("kv").put(v, k);
        t.oncomplete = function () { if (cb) cb(true); };
        t.onerror = function () { if (cb) cb(false); };
      } catch (e) { if (cb) cb(false); }
    });
  },
  get: function (k, cb) {
    this.open(function (d) {
      if (!d) { cb(null); return; }
      try {
        var t = d.transaction("kv").objectStore("kv").get(k);
        t.onsuccess = function () { cb(t.result || null); };
        t.onerror = function () { cb(null); };
      } catch (e) { cb(null); }
    });
  }
};

/* ═══════════════════════ 3. SOCLE DE PANNES EMBARQUÉ ═══════════════════════ */
var SEED = [
{id:"d1",themes:["incendie"],type:"panne",source:"doctrine",make:"Multi-marques",model:"Tous",engine:"",years:[2010,2027],fuel:"",sys:"Lubrification",dtc:[],sym:["odeur brûlé","fumée"],title:"Huile moteur sur organes chauds",meca:"Film d'huile sur surface au-delà de l'auto-inflammation (300-350 °C) : collecteur 400-800 °C, turbo 600-1000 °C, FAP 600-1200 °C.",cons:["Feu de baie moteur"],ind:["Vernis brun","coulures verticales"],fire:true,chain:"Fuite d'huile → organe chaud → auto-inflammation → feu de baie",grav:"critique",url:"",date:"2026-01-01"},
{id:"d2",themes:["incendie"],type:"panne",source:"doctrine",make:"Multi-marques",model:"Tous",engine:"GDI / Common Rail",years:[2010,2027],fuel:"",sys:"Injection",dtc:[],sym:["odeur carburant","fuite visible"],title:"Fuite carburant basse et haute pression",meca:"Rampe GDI 150-350 bar, Common Rail 1600-2500 bar. Essence : auto-inflammation vers 280 °C, vapeurs inflammables dès 1,4 %.",cons:["Flash immédiat","feu compartiment moteur"],ind:["Suintement injecteur","durite marquée"],fire:true,chain:"Fuite → aérosol et vapeurs → point chaud ou arc → flash",grav:"critique",url:"",date:"2026-01-01"},
{id:"d3",themes:["technique","incendie"],type:"panne",source:"doctrine",make:"Multi-marques",model:"Tous",engine:"",years:[2010,2027],fuel:"",sys:"Faisceau électrique",dtc:[],sym:["voyant allumé","odeur brûlé"],title:"Faisceau : frottement, rongeurs, accessoires",meca:"B+ permanent 100-250 A, gaines, passe-cloison, épissures. Arc franc au-delà de 2000 °C au point de défaut.",cons:["Feu baie ou habitacle"],ind:["Gaine percée","perles de cuivre"],fire:true,chain:"Usure de gaine → court-circuit B+ → arc → inflammation des gaines",grav:"critique",url:"",date:"2026-01-01"},
{id:"d4",themes:["incendie"],type:"panne",source:"doctrine",make:"Multi-marques",model:"Diesels",engine:"FAP",years:[2010,2027],fuel:"diesel",sys:"FAP / catalyseur",dtc:["P2463"],sym:["odeur brûlé","fumée"],title:"Échappement et FAP : inflammation externe",meca:"Régénération FAP 600-1200 °C. Végétation sèche : auto-inflammation 250-300 °C.",cons:["Feu sous caisse"],ind:["FAP coloré","écran thermique déformé"],fire:true,chain:"Régénération → rayonnement sous caisse → inflammation végétation",grav:"critique",url:"",date:"2026-01-01"},
{id:"d5",themes:["incendie"],type:"panne",source:"doctrine",make:"Multi-marques",model:"Tous",engine:"",years:[2010,2027],fuel:"",sys:"Freins",dtc:[],sym:["odeur brûlé"],title:"Freins surchauffés et pneumatique",meca:"Disques 600-900 °C en descente prolongée, étrier grippé.",cons:["Feu de roue"],ind:["Disque bleui","graisse carbonisée"],fire:true,chain:"Étrier grippé → disque très chaud → inflammation graisses et pneu",grav:"critique",url:"",date:"2026-01-01"},
{id:"d6",themes:["incendie"],type:"panne",source:"doctrine",make:"Multi-marques",model:"Tous",engine:"",years:[2010,2027],fuel:"",sys:"Habitacle",dtc:[],sym:["odeur brûlé","fumée"],title:"Mégot, chargeur, siège chauffant, mousse PU",meca:"Mousses polyuréthane premier combustible, prises 12V et USB, résistance de siège. Pyrolyse puis flamme rapide.",cons:["Feu habitacle","intoxication"],ind:["Foyer siège ou console"],fire:true,chain:"Source faible → pyrolyse mousse → flamme rapide",grav:"critique",url:"",date:"2026-01-01"},
{id:"d7",themes:["technique","incendie"],type:"panne",source:"doctrine",make:"Multi-marques",model:"Tous",engine:"",years:[2010,2027],fuel:"",sys:"Batterie 12V",dtc:["P0562"],sym:["démarrage difficile"],title:"Batterie 12V : hydrogène, cosses, hayon",meca:"Dégagement d'hydrogène en charge (LIE 4 %), cosses, faisceau de hayon en flexion.",cons:["Explosion du boîtier","feu arrière"],ind:["Cosse fondue","sulfate blanc"],fire:true,chain:"Charge → hydrogène confiné et étincelle → explosion",grav:"critique",url:"",date:"2026-01-01"},
{id:"d8",themes:["technique","incendie"],type:"panne",source:"doctrine",make:"Multi-marques",model:"Tous",engine:"",years:[2010,2027],fuel:"",sys:"Alternateur / B+",dtc:["P0562"],sym:["voyant allumé","odeur brûlé"],title:"Alternateur et B+ : effet Joule, arc",meca:"P = R × I². 1 mΩ sous 200 A vaut 40 W continus, soit une fusion locale.",cons:["Feu de baie moteur"],ind:["Pistes fondues","cosse bleutie"],fire:true,chain:"Résistance de contact → Joule → fusion → arc B+ → feu",grav:"critique",url:"",date:"2026-01-01"},
{id:"d9",themes:["incendie"],type:"panne",source:"doctrine",make:"Multi-marques",model:"Tous",engine:"",years:[2010,2027],fuel:"",sys:"Après intervention",dtc:[],sym:["après entretien"],title:"Erreur de service : huile, fusible, faisceau",meca:"Huile renversée en vidange, fusible sur-calibré, faisceau pincé à la repose.",cons:["Feu après intervention"],ind:["Trace diffuse","fusible sur-calibré"],fire:true,chain:"Intervention → huile résiduelle ou faisceau pincé → première chauffe",grav:"critique",url:"",date:"2026-01-01"},
{id:"e1",themes:["technique","incendie"],type:"panne",source:"doctrine",make:"Multi-marques VE",model:"Tous VE",engine:"Pack HT",years:[2015,2027],fuel:"electrique",sys:"Pack HT",dtc:["P0AA6"],sym:["incendie","après choc"],title:"Court-circuit interne de cellule puis emballement",meca:"SEI 90-120 °C, séparateur 130-170 °C, cathode NMC 180-250 °C avec oxygène auto-comburant, jet-fire 800-1400 °C.",cons:["Propagation aux modules","gaz HF et CO"],ind:["Point chaud","gonflement"],fire:true,chain:"Défaut interne → emballement → jet-fire → propagation pack",grav:"critique",url:"",date:"2026-01-01"},
{id:"e2",themes:["incendie"],type:"panne",source:"doctrine",make:"Multi-marques VE",model:"Tous VE",engine:"Pack HT",years:[2015,2027],fuel:"electrique",sys:"Pack HT",dtc:[],sym:["après choc","après immersion"],title:"Choc ou immersion : court-circuit différé",meca:"Déformation du séparateur ou corrosion après immersion, court interne immédiat ou différé de plusieurs jours.",cons:["Emballement différé"],ind:["Coque déformée","traces d'immersion"],fire:true,chain:"Choc ou immersion → dégradation cellule → court différé → emballement",grav:"critique",url:"",date:"2026-01-01"},
{id:"e3",themes:["technique","incendie"],type:"panne",source:"doctrine",make:"Multi-marques VE",model:"Tous VE",engine:"OBC / ICCU",years:[2018,2027],fuel:"electrique",sys:"Charge",dtc:[],sym:["voyant allumé","odeur brûlé"],title:"Connecteur, OBC, ICCU : arc et échauffement",meca:"Arc DC au-delà de 1000 °C répété à chaque session, carbonisation des broches.",cons:["Feu de zone de charge"],ind:["Broche carbonisée","trappe fondue"],fire:true,chain:"Résistance de contact → arc DC répété → carbonisation → flamme",grav:"critique",url:"",date:"2026-01-01"}
];

var POOL = {
"peugeot":[["1.2 PureTech",1199,"essence",[82,100,110,130,155]],["1.5 BlueHDi",1499,"diesel",[100,110,130]],["2.0 BlueHDi",1997,"diesel",[150,180]]],
"renault":[["1.0 TCe",999,"essence",[90,100,110]],["1.3 TCe",1332,"essence",[130,140,160]],["1.5 Blue dCi",1461,"diesel",[95,115]]],
"volkswagen":[["1.0 TSI",999,"essence",[95,110]],["1.5 TSI",1498,"essence",[130,150]],["2.0 TDI",1968,"diesel",[115,150,200]]],
"skoda":[["1.0 TSI",999,"essence",[95,110]],["1.5 TSI",1498,"essence",[130,150]],["2.0 TDI",1968,"diesel",[115,150,200]]],
"citroen":[["1.2 PureTech",1199,"essence",[82,100,110,130]],["1.5 BlueHDi",1499,"diesel",[100,110,130]]],
"dacia":[["1.0 TCe",999,"essence",[90,100,110]],["1.5 Blue dCi",1461,"diesel",[95,115]]],
"toyota":[["1.5 Hybride",1490,"hybride",[116,130]],["1.8 Hybride",1798,"hybride",[122,140]],["2.0 Hybride",1987,"hybride",[180,196]]],
"bmw":[["2.0 Essence",1998,"essence",[184,245]],["2.0 Diesel",1995,"diesel",[150,190]]],
"mercedes benz":[["1.3 Essence",1332,"essence",[136,163]],["2.0 Diesel",1950,"diesel",[116,190]]],
"audi":[["1.5 TFSI",1498,"essence",[150]],["2.0 TFSI",1984,"essence",[190,204]],["2.0 TDI",1968,"diesel",[150,190]]],
"ford":[["1.0 EcoBoost",999,"essence",[100,125,155]],["1.5 EcoBlue",1499,"diesel",[95,120]]],
"kia":[["1.6 T-GDi",1598,"essence",[150,180]],["1.6 CRDi",1598,"diesel",[115,136]]],
"hyundai":[["1.0 T-GDi",998,"essence",[100,120]],["1.6 T-GDi",1598,"essence",[150,180]]],
"opel":[["1.2 Turbo",1199,"essence",[100,130]],["1.5 Diesel",1499,"diesel",[110,130]]],
"nissan":[["1.3 DIG-T",1332,"essence",[140,158]],["1.5 dCi",1461,"diesel",[115]]]
};

var FALLBACK = {
"renault":{"clio":"1.0 TCe|999|e|90,100,110;1.5 Blue dCi|1461|d|85,100,115;E-Tech|1598|h|140,145","captur":"1.0 TCe|999|e|90,100,110;1.3 TCe|1332|e|130,140,150","megane":"1.3 TCe|1332|e|140,160;1.5 Blue dCi|1461|d|115","scenic":"1.3 TCe|1332|e|140,160;E-Tech|0|el|170,220","austral":"1.2 E-Tech|1199|h|130,160,200"},
"peugeot":{"208":"1.2 PureTech|1199|e|75,100,130;e-208|0|el|136,156","2008":"1.2 PureTech|1199|e|100,130,155","308":"1.2 PureTech|1199|e|110,130;1.5 BlueHDi|1499|d|130","3008":"1.2 PureTech|1199|e|130;1.5 BlueHDi|1499|d|130;1.6 Hybrid|1598|h|180,225,300","5008":"1.2 PureTech|1199|e|130;1.5 BlueHDi|1499|d|130"},
"volkswagen":{"golf":"1.0 TSI|999|e|95,110,115;1.5 TSI|1498|e|130,150;2.0 TDI|1968|d|115,150,200","polo":"1.0 TSI|999|e|95,110","tiguan":"1.5 TSI|1498|e|130,150;2.0 TDI|1968|d|150,190,200"},
"citroen":{"c3":"1.2 PureTech|1199|e|82,100,110","c4":"1.2 PureTech|1199|e|100,130,155"},
"dacia":{"duster":"1.0 TCe|999|e|90,100,110;1.3 TCe|1332|e|130,150","sandero":"1.0 TCe|999|e|90,100,110"},
"skoda":{"octavia":"1.0 TSI|999|e|110;1.5 TSI|1498|e|130,150;2.0 TDI|1968|d|115,150,200","elroq":"50|0|el|170;60|0|el|204;85|0|el|286;RS|0|el|340"},
"toyota":{"yaris":"1.5 Hybride|1490|h|116,130","corolla":"1.8 Hybride|1798|h|140;2.0 Hybride|1987|h|180,196"},
"bmw":{"serie 3":"2.0 320i|1998|e|184;2.0 320d|1995|d|190"},
"mercedes benz":{"classe a":"1.3 A180|1332|e|136;1.3 A200|1332|e|163"},
"audi":{"a3":"1.5 35 TFSI|1498|e|150;2.0 35 TDI|1968|d|150"},
"ford":{"fiesta":"1.0 EcoBoost|999|e|95,100,125,140,155","focus":"1.0 EcoBoost|999|e|100,125,155"},
"kia":{"sportage":"1.6 T-GDi|1598|e|150,180;1.6 Hybride|1598|h|230"},
"hyundai":{"tucson":"1.6 T-GDi|1598|e|150,180;1.6 Hybride|1598|h|230"},
"opel":{"corsa":"1.2 Turbo|1199|e|75,100,130;Corsa-e|0|el|136,156"},
"nissan":{"qashqai":"1.3 DIG-T|1332|e|140,158;1.5 e-Power|1497|h|190"}
};

/* ═══════════════════════ 4. RÉFÉRENTIEL JURIDIQUE ═══════════════════════ */
var LEGAL = [
{id:"vice",t:"Vice caché",pro:false,mots:["vice","cache","panne","defaut","achat","occasion","moteur"],r:"Un défaut caché, grave et antérieur à la vente peut relever de la garantie des vices cachés. Une panne survenue après l'achat ne suffit pas à le prouver.",rep:["Code civil, articles 1641, 1644 et 1648.","Établir le défaut, sa gravité, son caractère caché et son antériorité à la vente.","Action dans les deux ans de la découverte du vice.","Restitution du prix ou réduction du prix."],dem:["Signaler le défaut au vendeur par écrit et conserver les échanges.","Faire établir un diagnostic puis une expertise contradictoire avant dépose."],pr:["Annonce et contrat de vente","Date de découverte et kilométrage","Historique d'entretien, diagnostic, pièces conservées"],src:"https://www.service-public.fr/particuliers/vosdroits/F11007"},
{id:"conf",t:"Garantie légale de conformité",pro:true,mots:["garantie","conformite","panne","achat","occasion","neuf","vendeur"],r:"Réservée à l'achat par un consommateur auprès d'un vendeur professionnel. Ne s'applique pas entre particuliers.",rep:["Code de la consommation L. 217-3 et suivants : défauts dans les deux ans de la délivrance.","Présomption d'antériorité : 24 mois neuf, 12 mois occasion.","Réparation ou remplacement sans frais sous 30 jours maximum.","Réduction du prix ou résolution dans les cas prévus."],dem:["Adresser la demande au vendeur professionnel avec justificatifs.","Conserver la date de demande et la durée d'immobilisation."],pr:["Facture et date de délivrance","Caractéristiques annoncées et défaut constaté","Demande écrite de mise en conformité"],src:"https://www.service-public.fr/particuliers/vosdroits/F11094"},
{id:"dol",t:"Dol et dissimulation",pro:false,mots:["dol","mensonge","dissimulation","tromperie","compteur","kilometrage","accident"],r:"Des manœuvres ou une dissimulation intentionnelle d'une information déterminante peuvent vicier le consentement.",rep:["Code civil article 1137 : intention de tromper et caractère déterminant.","Une panne seule ne démontre pas un dol.","Article 1144 : le délai court à compter de la découverte."],dem:["Comparer l'annonce et les déclarations avec l'historique documenté.","Faire examiner les éléments avant toute demande d'annulation."],pr:["Annonce, messages et déclarations du vendeur","Contrôles techniques et historique kilométrique","Justificatifs de l'information dissimulée"],src:"https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036829827"},
{id:"garage",t:"Garage, malfaçons et résultat",pro:false,mots:["garage","garagiste","reparation","malfacon","facture","intervention","atelier"],r:"Une réparation défectueuse peut engager la responsabilité du garage selon la mission confiée et les éléments techniques.",rep:["L'obligation de résultat ne rend pas le garage responsable de toute panne ultérieure.","Mission confiée, défaut, lien avec l'intervention et preuves à examiner.","Devis, ordre de réparation et facture délimitent les travaux."],dem:["Demander une explication écrite et une proposition de reprise.","Faire constater contradictoirement avant nouvelle réparation.","Après réclamation infructueuse, examiner la médiation de la consommation."],pr:["Ordre de réparation, devis et facture","Symptômes avant et après intervention","Diagnostic indépendant, photos et pièces"],src:"https://www.economie.gouv.fr/dgccrf/consommation/Resoudre-un-litige-de-consommation"},
{id:"produit",t:"Incendie et produit défectueux",pro:false,sec:true,mots:["incendie","feu","flamme","brule","sinistre","assurance","expert","expertise"],r:"Un départ d'incendie lié à un défaut peut engager la responsabilité du producteur et ouvrir des recours d'assurance. Préserver les preuves est prioritaire.",rep:["Code civil articles 1245 et suivants : le producteur répond du défaut de sécurité.","Le défaut et le lien de causalité doivent être établis.","Assurance : déclaration dans les délais contractuels, usuellement cinq jours ouvrés.","Ne pas déplacer ni réparer le véhicule avant constat."],dem:["Sécuriser la zone et photographier l'état initial.","Déclarer le sinistre et demander une expertise contradictoire.","Faire préserver le véhicule et les pièces.","Mettre en cause le producteur si un défaut ou rappel est documenté."],pr:["Photos et vidéos avant déplacement","Rapport des pompiers ou constat","Factures d'entretien et campagnes applicables au VIN","Expertise technique et préservation des pièces"],src:"https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006070721/LEGISCTA000006136279/"},
{id:"rappel",t:"Rappel et campagne de sécurité",pro:false,mots:["rappel","campagne","securite","constructeur","vin","concession"],r:"Une campagne corrige un défaut de sécurité connu ; son applicabilité au VIN et son exécution sont déterminantes.",rep:["Code de la consommation L. 412-1 et R. 412-1 : correction à la charge du professionnel.","Vérifier l'applicabilité de la campagne au VIN exact et son exécution.","Une campagne applicable non exécutée renforce la démonstration d'un défaut connu."],dem:["Relever le VIN et interroger le constructeur sur les campagnes ouvertes.","Demander l'exécution gratuite et conserver les courriers.","Croiser RappelConso, Safety Gate et NHTSA."],pr:["VIN et réponse du constructeur","Numéro de campagne et preuve d'exécution","Historique d'entretien"],src:"https://rappel.conso.gouv.fr/"}
];

/* ═══════════════════════ 5. CONSTANTES ═══════════════════════ */
var SYMPT = ["voyant allumé","perte de puissance","à-coups moteur","à-coups boîte","bruit anormal","claquement","fumée","odeur carburant","odeur brûlé","surchauffe","fuite visible","démarrage difficile","incendie","véhicule immobilisé","après entretien","après choc","après immersion","consommation huile","charge impossible","autonomie réduite"];
var PWD = "Kevin83600";
var ICON = { essence: "🟡", diesel: "⚫", hybride: "🟢", electrique: "🔵" };
var SITES = [
  { id: "diagauto", name: "DiagAuto Pro", url: "https://expertkevin06-cell.github.io/diagauto-pro/" },
  { id: "autodiag", name: "Auto Diagnostic", url: "https://expertkevin06-cell.github.io/auto-diagnostic/" }
];
var PROBES = ["data/index.json","data/base.json","data/seed.json","data/catalogue.json","data/catalog.json","data/pannes.json","data/faults.json","data/vehicules.json","data/vehicles.json","data/marques.json","data/modeles.json","data/models.json","data/motorisations.json","data/engines.json","data/puissances.json","data/powers.json","data/db.json","data/fiches.json","data/export.json","data/dtc.json","data/brands.json","data/cars.json","data/autos.json","data/voitures.json","data/technique.json","data/incendie.json","asset-manifest.json","manifest.json","catalogue.json","catalog.json","base.json","pannes.json","vehicules.json","vehicles.json","marques.json","modeles.json","motorisations.json","puissances.json","db.json","data.json","assets/data.json","assets/catalogue.json","assets/base.json","assets/pannes.json","assets/vehicules.json","static/data.json","public/data.json","json/catalogue.json","json/pannes.json","json/vehicules.json"];

/* ═══════════════════════ 6. CATALOGUE → ENG ═══════════════════════ */
var ENG = {};
(function () {
  var C = window.KTF_CAT, b, m, list, parts, i, j, cc, fu, ps, t, n, arr;
  if (!C || typeof C !== "object") C = FALLBACK;
  for (b in C) {
    if (!C.hasOwnProperty(b)) continue;
    for (m in C[b]) {
      if (!C[b].hasOwnProperty(m)) continue;
      list = String(C[b][m]).split(";");
      arr = [];
      for (i = 0; i < list.length; i++) {
        parts = list[i].split("|");
        if (parts.length < 2) continue;
        cc = parseInt(parts[1], 10) || 0;
        fu = parts[2] === "d" ? "diesel" : parts[2] === "h" ? "hybride" : parts[2] === "el" ? "electrique" : "essence";
        ps = [];
        if (parts[3]) {
          t = parts[3].split(",");
          for (j = 0; j < t.length; j++) { n = parseInt(t[j], 10); if (n) ps.push(n); }
        }
        arr.push([trm(parts[0]), cc, fu, ps]);
      }
      if (arr.length) ENG[b + "|" + m] = arr;
    }
  }
})();

var BRANDS = [], MODELS = {};
(function () {
  var seen = {}, k, p;
  for (k in ENG) {
    if (!ENG.hasOwnProperty(k)) continue;
    p = k.split("|");
    if (!seen[p[0]]) { seen[p[0]] = 1; BRANDS.push(p[0]); }
    if (!MODELS[p[0]]) MODELS[p[0]] = [];
    if (!has(MODELS[p[0]], p[1])) MODELS[p[0]].push(p[1]);
  }
  BRANDS.sort();
})();

/* ═══════════════════════ 7. ÉTAT ═══════════════════════ */
var S = {
  base: [], photos: {}, theme: "tous", admin: false,
  name: save("name") || "",
  ov: save("ov") || { entries: [], photos: [] },
  look: save("look") || { op: 55 },
  revs: save("revs") || [],
  pend: [], sel: {}, editId: null,
  mail: save("mail") || "contact@kev-tech-fire.fr",
  be: save("be") || "kvdb",
  checks: {}, carImg: null, busy: false, importing: false,
  report: null, vin: null,
  limit: 30, quick: "", dragFrom: -1,
  veh: save("veh") || null,
  lastResults: []
};

/* ═══════════════════════ 8. GESTION DE LA BASE ═══════════════════════ */
function reindex() {
  each(S.base, function (e) {
    e._h = nrm([e.make, e.model, e.engine, e.sys, e.title, e.meca,
      (e.cons || []).join(" "), (e.sym || []).join(" "), (e.dtc || []).join(" "),
      (e.ind || []).join(" ")].join(" "));
    e._m = nrm(e.make); e._mo = nrm(e.model); e._e = nrm(e.engine);
    e._t = nrm(e.title); e._s = nrm(e.sys);
  });
}
function merge(list) {
  var m = {}, i, k;
  for (i = 0; i < S.base.length; i++) m[fkey(S.base[i])] = S.base[i];
  if (list) for (i = 0; i < list.length; i++) if (list[i] && list[i].title) m[fkey(list[i])] = list[i];
  S.base = [];
  for (k in m) if (m.hasOwnProperty(k)) S.base.push(m[k]);
  reindex();
}
function rebuild() {
  S.photos = {};
  each(S.ov.photos, function (p) {
    if (!S.photos[p.fault]) S.photos[p.fault] = [];
    S.photos[p.fault].push(p);
  });
}
function persist() { save("ov", S.ov); rebuild(); }
function normList(list) {
  var o = [], i, e;
  if (!list) return o;
  for (i = 0; i < list.length; i++) {
    e = list[i];
    if (!e) continue;
    o.push({
      id: e.id, themes: e.themes || ["technique"], type: e.type || "panne", source: e.source || "import",
      make: e.make || e.marque || "Multi-marques", model: e.model || e.modele || "Tous",
      engine: e.engine || e.motorisation || "", years: e.years || e.annees || null,
      fuel: e.fuel || e.energie || "", sys: e.sys || e.systeme || "",
      dtc: e.dtc || [], sym: e.sym || e.symptomes || [],
      title: e.title || e.defaut || e.titre || "Fiche",
      meca: e.meca || e.mecanisme || "", cons: e.cons || e.consequences || [],
      ind: e.ind || e.indices || [], fire: e.fire === true || e.risque_feu === true,
      chain: e.chain || e.chaine_feu || "", grav: e.grav || e.gravite || "eleve",
      url: e.url || "", date: e.date || "", powers: e.powers || e.puissance_ch || null
    });
  }
  return o;
}
function countModels() {
  var n = 0, k;
  for (k in MODELS) if (MODELS.hasOwnProperty(k)) n += MODELS[k].length;
  return n;
}
function countPhotos() {
  var n = 0, k;
  for (k in S.photos) if (S.photos.hasOwnProperty(k)) n += S.photos[k].length;
  return n;
}
function stats() {
  var np = countPhotos(), nm = countModels(), nf = 0, i;
  for (i = 0; i < S.base.length; i++) if (S.base[i].fire) nf++;
  if ($("pBase")) $("pBase").innerHTML = H("🗄️ ", S.base.length, " · ", nm, " mod · ", np, "📷");
  if ($("stats")) $("stats").innerHTML = H(
    "<b>", S.base.length, "</b> fiches de pannes · <b>", nf, "</b> à risque incendie · <b>",
    BRANDS.length, "</b> marques · <b>", nm, "</b> modèles · <b>", Object.keys(ENG).length,
    "</b> couples moteur · <b>", np, "</b> photos · <b>", S.ov.entries.length, "</b> ajouts admin"
  );
}
function chk(k, lv, d) { S.checks[k] = { lv: lv, d: d }; paintChk(); }
function paintChk() {
  var order = [["boot","Ouverture"],["events","Contrôles & interactions"],["cat","Catalogue véhicules"],["seed","Base embarquée"],["mega","Méga base pannes"],["cache","Cache local"],["sites","Import des 2 sites"],["repo","Base du dépôt"],["sync","Canal temps réel"],["sw","Service Worker"],["net","Réseau"],["store","Stockage local"]];
  var h = "", i, k, s, ok = 0, bad = 0, warn = 0, tot = 0, p;
  for (i = 0; i < order.length; i++) {
    k = order[i][0];
    if (!S.checks[k]) continue;
    s = S.checks[k]; tot++;
    if (s.lv === "ok") ok++; else if (s.lv === "bad") bad++; else warn++;
    h = H(h, "<div class='sc ", s.lv, "'><span>", s.lv === "ok" ? "✅" : s.lv === "warn" ? "⚠️" : "❌",
      "</span><div><b>", esc(order[i][1]), "</b><small>", esc(s.d), "</small></div></div>");
  }
  if ($("checks")) $("checks").innerHTML = h;
  if ($("dBox")) $("dBox").innerHTML = h;
  if ($("pHealth")) {
    $("pHealth").innerHTML = H("🩺 ", ok, "/", tot);
    $("pHealth").className = H("pill ", bad ? "bad" : warn ? "warn" : "ok");
  }
  p = tot ? Math.round(ok / tot * 100) : 0;
  if ($("prog")) $("prog").style.width = H(p, "%");
  if ($("dProg")) $("dProg").style.width = H(p, "%");
}

/* ═══════════════════════ 9. MOTEURS & ATTRIBUTION ═══════════════════════ */
function fuelOf(m) {
  var t = nrm(m);
  if (/electrique|electric|kwh|elroq|enyaq|ioniq|recharge|spring|mg4|e 208|e 2008|e 3008|e 308|id 3|id 4|id 7|ev6|ev9|ev3|model 3|model y|model s|model x|i4|i5|i7|ix|500e|leaf|corsa e|mokka e|eqa|eqb|eqc|eqe|eqs|taycan|e tron|ex30|ex40|ex90|bz4x|ariya|born|zoe|r5|r4|twizy|ami|nexo|mirai|spectre|folgore|lyriq|celestiq|hummer ev|lightning|bolt|e up|e golf|e transit|e crafter|e daily|etge|eactros|ecitaro|citywide|vf3|vf5|vf6|vf7|vf8|vf9|ocean|air|gravity|r1t|r1s|zeekr|ora|aiways|nio|xpeng|polestar|blade|lfp/.test(t)) return "electrique";
  if (/hybrid|hybride|phev|hev|e tech|etech|gte|t8|e power|b4|b5|b6|iv|dm i|dm-i|erev|e hybrid|ehybrid|plugin|rechargeable|tourbillon|valhalla|artura|p1|sf90|296|revuelto|sian|asterion|laferrari|speedtail|hybrid/.test(t)) return "hybride";
  if (/diesel|tdi|hdi|dci|crdi|cdti|multijet|bluehdi|ecoblue|jtd|d 4d|d4d|skyactiv d|ecodiesel|crd|td|ddis|di d|tddi|tdci|duratorq|cdi|bluetec|jtdm|tid|cdti|cummins|duramax|ecotorq/.test(t)) return "diesel";
  return "essence";
}
function enginesFor(mk, mo) {
  var k = H(nrm(mk), "|", nrm(mo)), src = ENG[k], doc = !!(src && src.length), i, kk, p, o = [];
  if ((!src || !src.length) && nrm(mo)) {
    for (kk in ENG) {
      if (!ENG.hasOwnProperty(kk)) continue;
      p = kk.split("|");
      if (p[0] === nrm(mk) && (nrm(mo).indexOf(p[1]) === 0 || p[1].indexOf(nrm(mo)) === 0)) {
        src = ENG[kk]; doc = !!(src && src.length); break;
      }
    }
  }
  if (!src || !src.length) { src = POOL[nrm(mk)] || []; doc = false; }
  for (i = 0; i < src.length; i++) o.push({ m: src[i][0], cc: src[i][1], en: src[i][2], ch: src[i][3], src: doc ? "documenté" : "gamme" });
  return o;
}
function matchEng(mk, mo, mt) {
  if (!mt) return null;
  var a = nrm(mt), l = enginesFor(mk, mo), i, b, x, y;
  for (i = 0; i < l.length; i++) {
    b = nrm(l[i].m);
    if (b === a || a.indexOf(b) === 0 || b.indexOf(a) === 0) return l[i];
    x = a.split(" "); y = b.split(" ");
    if (x[0] === y[0] && x[1] && y[1] && x[1] === y[1]) return l[i];
  }
  return null;
}
function powersFor(mk, mo, mt) { var e = matchEng(mk, mo, mt); return e ? e.ch.slice(0) : []; }
function renderEng() {
  var mk = $("vMake").value, mo = $("vModel").value, w = $("cEng"), l, h = "", i, e;
  if (!mk || !mo) {
    $("nEng").innerHTML = "0";
    w.innerHTML = "<span class='wait'>Sélectionne une marque puis un modèle.</span>";
    return;
  }
  l = enginesFor(mk, mo);
  $("nEng").innerHTML = String(l.length);
  w._l = l;
  for (i = 0; i < l.length; i++) {
    e = l[i];
    h = H(h, "<button data-act='pickEng' data-e='", i, "'>", ICON[e.en] || "", " ", esc(e.m),
      " · ", e.en, " · ", e.ch.join("/"), " ch", e.cc ? H(" · ", e.cc, " cm³") : "", "</button>");
  }
  w.innerHTML = h || "<span class='wait'>Aucune motorisation documentée pour ce modèle.</span>";
}
function renderPow() {
  var ps = powersFor($("vMake").value, $("vModel").value, $("vEngine").value), h = "", i;
  $("nPow").innerHTML = String(ps.length);
  for (i = 0; i < ps.length; i++) h = H(h, "<button data-act='pickPow' data-p='", ps[i], "'>", ps[i], " ch</button>");
  $("cPow").innerHTML = h || "<span class='wait'>Choisis une motorisation pour voir ses puissances.</span>";
}
function renderAttrib() {
  var mk = $("vMake").value, mo = $("vModel").value, w = $("attrib"), l, doc = 0, i, e, h;
  if (!mk || !mo) { w.innerHTML = ""; return; }
  l = enginesFor(mk, mo);
  if (!l.length) { w.innerHTML = ""; return; }
  for (i = 0; i < l.length; i++) if (l[i].src === "documenté") doc++;
  h = H("<h3>🧾 Attribution — ", esc(mk), " ", esc(mo), "</h3><p class='sm'>", doc, "/", l.length,
    " motorisation(s) documentée(s) · énergie et puissance déduites automatiquement</p>",
    "<table><tr><th>Motorisation</th><th>Énergie</th><th>Cylindrée</th><th>Puissances</th><th>Source</th></tr>");
  for (i = 0; i < l.length; i++) {
    e = l[i];
    h = H(h, "<tr><td><b>", esc(e.m), "</b></td><td>", ICON[e.en] || "", " ", e.en, "</td><td>",
      e.cc ? H(e.cc, " cm³") : "—", "</td><td>", e.ch.join("/"), " ch</td><td><span class='tag ",
      e.src === "documenté" ? "ok" : "", "'>", e.src, "</span></td></tr>");
  }
  w.innerHTML = H(h, "</table>");
}
function autoAttr() {
  var mk = $("vMake").value, mo = $("vModel").value, mt = $("vEngine").value, en, e, ps;
  if (!mt) return;
  en = fuelOf(mt);
  e = matchEng(mk, mo, mt);
  ps = e ? e.ch : [];
  $("vFuel").value = en;
  if (ps.length && !has(ps, parseInt($("vPower").value, 10))) $("vPower").value = ps[0];
  renderPow(); renderAttrib(); saveVeh();
  toast(H("⚙️ ", esc(mt), " → <b>", en, "</b> · ", $("vPower").value || "?", " ch"));
}
function saveVeh() {
  S.veh = veh();
  save("veh", S.veh);
}
function restoreVeh() {
  var v = S.veh;
  if (!v) return;
  if (v.make) $("vMake").value = v.make;
  if (v.model) $("vModel").value = v.model;
  if (v.engine) $("vEngine").value = v.engine;
  if (v.power) $("vPower").value = v.power;
  if (v.year) $("vYear").value = v.year;
  if (v.fuel) $("vFuel").value = v.fuel;
}
function addModelOnly(b, m) {
  if (!b || !m) return;
  if (!MODELS[b]) MODELS[b] = [];
  if (!has(MODELS[b], m)) MODELS[b].push(m);
  if (!has(BRANDS, b)) { BRANDS.push(b); BRANDS.sort(); }
  if (!ENG[H(b, "|", m)]) ENG[H(b, "|", m)] = [];
}
function addCatalog(make, model, engine, cc, fuel, powers) {
  var b = nrm(make), m = nrm(model), k, arr, i, name;
  if (!b || !m) return;
  addModelOnly(b, m);
  k = H(b, "|", m);
  arr = ENG[k];
  name = engine || (powers && powers.length ? "Version" : "");
  if (!name) return;
  for (i = 0; i < arr.length; i++) {
    if (nrm(arr[i][0]) === nrm(name)) {
      if (powers && powers.length) arr[i][3] = uniq(arr[i][3].concat(powers));
      if (cc && !arr[i][1]) arr[i][1] = cc;
      if (fuel) arr[i][2] = fuel;
      return;
    }
  }
  arr.push([name, cc || parseCC(name), fuel || fuelOf(name), powers || []]);
}
function absorbCatalog(rows) {
  each(rows, function (r) { addCatalog(r.make, r.model, r.engine, r.cc, r.fuel, r.powers); });
}

/* ═══════════════════════ 10. MOISSONNEUR DES 2 SITES ═══════════════════════ */
function absUrl(p, base) { try { return new URL(p, base).href; } catch (e) { return ""; } }
function allowed(u) {
  try { var h = new URL(u).host; return h === location.host || h === "expertkevin06-cell.github.io"; }
  catch (e) { return false; }
}
function discover(txt, base) {
  var out = [], m, u,
    re1 = /(?:src|href)=["']([^"']+\.(?:js|json|mjs)[^"']*)["']/g,
    re2 = /["'`]([^"'`\s]+\.(?:js|json|mjs))["'`]/g,
    re3 = /import\(["']([^"']+)["']\)/g;
  while ((m = re1.exec(txt))) { u = absUrl(m[1], base); if (u && allowed(u) && !has(out, u)) out.push(u); }
  while ((m = re2.exec(txt))) { u = absUrl(m[1], base); if (u && allowed(u) && !has(out, u)) out.push(u); }
  while ((m = re3.exec(txt))) { u = absUrl(m[1], base); if (u && allowed(u) && !has(out, u)) out.push(u); }
  return out;
}
function matchBracket(txt, start) {
  var stack = [], i, ch, inStr = false, q = "", escp = false, o, lim = Math.min(txt.length, start + 3000000);
  for (i = start; i < lim; i++) {
    ch = txt.charAt(i);
    if (inStr) {
      if (escp) escp = false;
      else if (ch === "\\") escp = true;
      else if (ch === q) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inStr = true; q = ch; continue; }
    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") {
      o = stack.pop();
      if (!o) return -1;
      if ((o === "{" && ch !== "}") || (o === "[" && ch !== "]")) return -1;
      if (stack.length === 0) return i;
    }
  }
  return -1;
}
function jsToJson(s) {
  var res = "", i, ch, inStr = false, q = "", escp = false;
  for (i = 0; i < s.length; i++) {
    ch = s.charAt(i);
    if (inStr) {
      if (escp) { res += ch; escp = false; continue; }
      if (ch === "\\") { res += ch; escp = true; continue; }
      if (ch === q) { res += '"'; inStr = false; continue; }
      if (q === "'" && ch === '"') { res += '\\"'; continue; }
      if (ch === "\n" || ch === "\r") { res += " "; continue; }
      res += ch; continue;
    }
    if (ch === "'" || ch === '"') { inStr = true; q = ch; res += '"'; continue; }
    res += ch;
  }
  res = res.replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":');
  res = res.replace(/,\s*([}\]])/g, "$1");
  return res;
}
function tryParse(raw) {
  var v = null;
  try { v = JSON.parse(raw); if (v) return v; } catch (e) {}
  try { v = JSON.parse(jsToJson(raw)); if (v) return v; } catch (e) {}
  return null;
}
function blocks(txt, cb) {
  var re = /[A-Za-z_$][\w$]*/g, m, seen = {}, start, end, raw, v, j, depth, ch,
    KW = /^(marques|modeles|motorisations|puissances|cylindree|cylindrees|brands|models|engines|powers|vehicules|vehicles|pannes|fiches|defauts|faults|catalogue|catalog|data|items|list|rows|records|results|cars|autos|voitures|dtc|codes)$/i;
  while ((m = re.exec(txt))) {
    if (!KW.test(m[0])) continue;
    start = -1; depth = 0;
    for (j = m.index; j >= 0 && j > m.index - 8000; j--) {
      ch = txt.charAt(j);
      if (ch === "}" || ch === "]") depth++;
      else if (ch === "{" || ch === "[") { if (depth === 0) { start = j; break; } depth--; }
    }
    if (start < 0 || seen[start]) continue;
    seen[start] = 1;
    end = matchBracket(txt, start);
    if (end < 0) continue;
    raw = txt.slice(start, end + 1);
    if (raw.length < 20 || raw.length > 2500000) continue;
    v = tryParse(raw);
    if (v) cb(v);
  }
}
function strArrays(txt, cb) {
  var i = 0, n = 0, lim = Math.min(txt.length, 6000000), k, end, raw, v, ctx;
  while (i < lim - 1 && n < 800) {
    if (txt.charAt(i) === "[") {
      k = i + 1;
      while (k < lim && /\s/.test(txt.charAt(k))) k++;
      if (txt.charAt(k) === '"' || txt.charAt(k) === "'") {
        end = matchBracket(txt, i);
        if (end > 0) {
          raw = txt.slice(i, end + 1);
          if (raw.length > 10 && raw.length < 300000) {
            v = tryParse(raw);
            if (v && isArr(v) && v.length >= 3) { ctx = txt.slice(Math.max(0, i - 90), i); cb(v, ctx); n++; }
          }
          i = end + 1; continue;
        }
      }
    }
    i++;
  }
}
function parseYears(v) {
  var a = [], i, m, n;
  if (isArr(v)) { for (i = 0; i < v.length; i++) { n = parseInt(v[i], 10); if (n >= 1950 && n <= 2035) a.push(n); } }
  else if (typeof v === "string") { m = v.match(/(?:19|20)\d{2}/g) || []; for (i = 0; i < m.length; i++) a.push(parseInt(m[i], 10)); }
  else if (typeof v === "number" && v >= 1950 && v <= 2035) a.push(v);
  if (!a.length) return null;
  return [Math.min.apply(null, a), Math.max.apply(null, a)];
}
function parsePowers(v) {
  var a = [], i, m, n;
  if (isArr(v)) { for (i = 0; i < v.length; i++) { n = parseInt(v[i], 10); if (n >= 20 && n <= 2000) a.push(n); } }
  else if (typeof v === "string") { m = v.match(/\d{2,4}/g) || []; for (i = 0; i < m.length; i++) { n = parseInt(m[i], 10); if (n >= 20 && n <= 2000) a.push(n); } }
  else if (typeof v === "number" && v >= 20 && v <= 2000) a.push(v);
  return uniq(a);
}
function parseCC(v) {
  if (typeof v === "number" && v > 0) return Math.round(v);
  var m = String(v || "").match(/(\d[.,]\d)/);
  if (m) return Math.round(parseFloat(m[1].replace(",", ".")) * 1000);
  return 0;
}
function mapFault(o, source) {
  var title = o.defaut || o.titre || o.title || o.panne || o.libelle || o.nom || o.summary || o.label || "",
    meca = o.mecanisme || o.meca || o.cause || o.causes || o.description || o.summary || o.motif_rappel || o.detail || "",
    cons = lines(o.consequences || o.cons || o.risques_encourus || o.risques || []),
    sym = lines(o.symptomes || o.sym || o.symptoms || []),
    sys = o.systeme || o.sys || o.organe || o.component || o.categorie || "",
    dtc = o.dtc || o.codes || o.code || [], raw = "", fire;
  try { raw = JSON.stringify(o); } catch (e) {}
  fire = o.risque_feu === true || o.fire === true || /incendie|feu|flamme|inflamm/i.test(raw);
  if (!title || (!meca && !cons.length && !sys && !dtc.length && !fire)) return null;
  if (isArr(dtc)) dtc = uniq(dtc); else dtc = String(dtc).toUpperCase().match(/[PCBU]\d{4}/g) || [];
  return {
    id: o.id || H("imp-", hash(H(source, title, o.marque || o.make || "", o.modele || o.model || ""))),
    themes: fire ? ["technique", "incendie"] : ["technique"],
    type: o.type || (o.campagne || o.numero_fiche ? "rappel" : "panne"),
    source: source,
    make: o.marque || o.make || o.brand || "Multi-marques",
    model: o.modele || o.model || "Tous",
    engine: o.motorisation || o.engine || o.moteur || "",
    years: parseYears(o.annees || o.years || o.annee),
    fuel: o.energie || o.fuel || fuelOf(o.motorisation || o.engine || ""),
    sys: sys, dtc: dtc, sym: sym,
    title: String(title).slice(0, 300), meca: String(meca), cons: cons,
    ind: lines(o.indices || o.ind || o.preuves || []), fire: fire,
    chain: o.chaine_feu || o.chain || (fire ? "Défaut documenté → mécanisme à expertiser → risque incendie" : ""),
    grav: o.gravite || o.grav || (fire ? "critique" : "eleve"),
    url: o.url || o.source_url || o.lien || "",
    date: String(o.date || o.date_publication || "").slice(0, 10),
    powers: parsePowers(o.puissance_ch || o.powers || o.puissance)
  };
}
function mapVehicle(o) {
  var make = o.marque || o.make || o.brand || "",
    model = o.modele || o.model || "",
    engine = o.motorisation || o.engine || o.moteur || o.version || "",
    powers = parsePowers(o.puissance_ch || o.powers || o.puissance || o.ch || o.cv),
    fuel = o.energie || o.fuel || o.carburant || "";
  if (!make || !model || (!engine && !powers.length && !fuel)) return null;
  return { make: make, model: model, engine: engine, cc: parseCC(o.cylindree || o.cc || o.displacement || engine), fuel: fuel || fuelOf(engine), powers: powers };
}
function ingest(node, key, depth, acc, source) {
  var k, f, v, allStr, i, b, arr, ctx;
  if (depth > 7 || node === null || node === undefined) return;
  if (isArr(node)) {
    allStr = node.length > 0;
    for (i = 0; i < node.length; i++) if (typeof node[i] !== "string") { allStr = false; break; }
    if (allStr) {
      ctx = nrm(key);
      if (/marque|brand|make/.test(ctx)) {
        for (i = 0; i < node.length; i++) { b = nrm(node[i]); if (b && !has(BRANDS, b)) { BRANDS.push(b); BRANDS.sort(); } }
      } else if (/modele|model/.test(ctx)) {
        for (i = 0; i < node.length; i++) addModelOnly("modeles importes", nrm(node[i]));
      }
      return;
    }
    for (i = 0; i < node.length; i++) ingest(node[i], key, depth + 1, acc, source);
    return;
  }
  if (typeof node !== "object") return;
  if (node.marques && isArr(node.marques)) each(node.marques, function (x) { b = nrm(x); if (b && !has(BRANDS, b)) { BRANDS.push(b); BRANDS.sort(); } });
  if (node.modeles) {
    if (isArr(node.modeles)) each(node.modeles, function (x) { addModelOnly("modeles importes", nrm(x)); });
    else if (typeof node.modeles === "object") {
      for (b in node.modeles) {
        if (!node.modeles.hasOwnProperty(b)) continue;
        arr = node.modeles[b];
        if (isArr(arr)) each(arr, function (x) {
          if (typeof x === "string") addModelOnly(nrm(b), nrm(x));
          else if (x && typeof x === "object") ingest(x, b, depth + 1, acc, source);
        });
        else if (arr && typeof arr === "object") for (k in arr) { if (arr.hasOwnProperty(k)) addModelOnly(nrm(b), nrm(k)); }
      }
    }
  }
  f = mapFault(node, source); if (f) acc.faults.push(f);
  v = mapVehicle(node); if (v) acc.rows.push(v);
  for (k in node) {
    if (!node.hasOwnProperty(k)) continue;
    if (node[k] && typeof node[k] === "object") ingest(node[k], k, depth + 1, acc, source);
  }
}
function impState(m) { var e = $("importState"); if (e) e.innerHTML = m; }
function applyImport(d) {
  if (!d) return;
  if (d.faults && d.faults.length) merge(normList(d.faults));
  if (d.rows && d.rows.length) absorbCatalog(d.rows);
}
function loadLocalImport(cb) {
  IDB.get("import", function (d) {
    if (d) {
      applyImport(d);
      impState(H("💾 Base importée : ", (d.faults || []).length, " fiches · ", (d.rows || []).length,
        " véhicules (", new Date(d.ts).toLocaleDateString("fr-FR"), ")"));
      chk("sites", "ok", H((d.faults || []).length, " fiches · ", (d.rows || []).length, " véhicules en local"));
      if (cb) cb(); return;
    }
    var f = save("siteFaults"), r = save("siteRows");
    if (f && f.length) merge(normList(f));
    if (r && r.length) absorbCatalog(r);
    if (f || r) chk("sites", "ok", "bases importées (localStorage)");
    else chk("sites", "warn", "aucun import local — sera fait au 1er lancement en ligne");
    if (cb) cb();
  });
}
function importSites(manual, cb) {
  var acc = { faults: [], rows: [], stats: {} }, si = 0, before;
  if (S.importing) { if (cb) cb(); return; }
  S.importing = true;
  impState("⏳ Moissonnage des 2 sites en cours…");
  function nextSite() {
    var site, urls, probes, pi, ai, bytes, blobs;
    if (si >= SITES.length) { finish(); return; }
    site = SITES[si]; si++;
    impState(H("⏳ ", site.name, " — lecture des bundles…"));
    fetchText(site.url, 10000, function (err, html) {
      if (err || !html) { acc.stats[site.id] = { ok: false, error: err || "vide" }; nextSite(); return; }
      blobs = [html]; urls = discover(html, site.url); probes = PROBES.slice(0); pi = 0; ai = 0; bytes = html.length;
      function nextProbe() {
        var p, u;
        if (pi >= probes.length) { nextAsset(); return; }
        p = probes[pi]; pi++; u = absUrl(p, site.url);
        fetchText(u, 6000, function (e2, t) {
          if (!e2 && t && /^[\s]*[{\[]/.test(t)) blobs.push(t);
          nextProbe();
        });
      }
      function nextAsset() {
        var u;
        if (ai >= urls.length || ai >= 40 || bytes > 14000000) { process(); return; }
        u = urls[ai]; ai++;
        fetchText(u, 10000, function (e3, t) {
          if (!e3 && t) {
            blobs.push(t); bytes += t.length;
            each(discover(t, u), function (m) { if (!has(urls, m) && urls.length < 120) urls.push(m); });
          }
          nextAsset();
        });
      }
      function process() {
        var bi = 0, nf = acc.faults.length, nr = acc.rows.length;
        function nextBlob() {
          var b, parsed;
          if (bi >= blobs.length) {
            acc.stats[site.id] = { ok: true, faults: acc.faults.length - nf, rows: acc.rows.length - nr };
            nextSite(); return;
          }
          b = blobs[bi]; bi++;
          parsed = tryParse(b);
          if (parsed) ingest(parsed, "", 0, acc, site.id);
          blocks(b, function (v) { ingest(v, "", 0, acc, site.id); });
          strArrays(b, function (v, ctx) { ingest(v, ctx, 0, acc, site.id); });
          setTimeout(nextBlob, 0);
        }
        nextBlob();
      }
      nextProbe();
    });
  }
  function finish() {
    before = S.base.length;
    merge(acc.faults); absorbCatalog(acc.rows);
    IDB.set("import", { ts: Date.now(), faults: acc.faults, rows: acc.rows, stats: acc.stats });
    saveBig("siteFaults", acc.faults); saveBig("siteRows", acc.rows);
    save("siteDone", Date.now()); save("siteStats", acc.stats);
    save("cache", { ts: Date.now(), entries: S.base.slice(0, 2500) });
    fillFilters(); renderResults(); renderEng(); renderPow(); renderAttrib(); stats();
    S.importing = false;
    impState(H("✅ +", S.base.length - before, " fiches · ", acc.rows.length, " véhicules · ",
      BRANDS.length, " marques · ", Object.keys(ENG).length, " couples moteur"));
    chk("sites", "ok", H("+", S.base.length - before, " fiches · ", acc.rows.length, " véhicules"));
    toast(H("🌐 Import : +", S.base.length - before, " fiches · ", acc.rows.length, " véhicules"));
    if (cb) cb();
  }
  nextSite();
}

/* ═══════════════════════ 11. RECHERCHE ═══════════════════════ */
function gravRank(e) { return e.grav === "critique" ? 3 : e.grav === "eleve" ? 2 : 1; }
function passQuick(e) {
  if (!S.quick) return true;
  if (S.quick === "fire") return !!e.fire;
  if (S.quick === "rappel") return e.type === "rappel";
  if (S.quick === "mega") return e.source === "mega-kevin";
  if (S.quick === "photo") return !!(S.photos[fkey(e)] || []).length;
  if (S.quick === "admin") return e.source === "admin";
  if (S.quick === "dtc") return (e.dtc || []).length > 0;
  return true;
}
function search(q, lim) {
  var t = nrm(q).split(" "), toks = [], i, j, pool = [], out = [], e, s, mode, res = [];
  for (i = 0; i < t.length; i++) if (t[i]) toks.push(t[i]);
  for (i = 0; i < S.base.length; i++) {
    e = S.base[i];
    if (S.theme !== "tous" && !has(e.themes || [], S.theme)) continue;
    if (!passQuick(e)) continue;
    if ($("fMake").value && e._m.indexOf(nrm($("fMake").value)) < 0) continue;
    if ($("fSys").value && e._s !== nrm($("fSys").value)) continue;
    if ($("fGrav").value && e.grav !== $("fGrav").value) continue;
    pool.push(e);
  }
  mode = $("fSort").value;
  if (!toks.length) {
    if (mode === "grav") pool.sort(function (x, y) { return gravRank(y) - gravRank(x); });
    else if (mode === "az") pool.sort(function (x, y) { return String(x.title).localeCompare(String(y.title)); });
    else if (mode === "date") pool.sort(function (x, y) { return String(y.date || "").localeCompare(String(x.date || "")); });
    else pool.sort(function (x, y) { return gravRank(y) - gravRank(x); });
    return pool.slice(0, lim || S.limit);
  }
  for (i = 0; i < pool.length; i++) {
    s = 0; e = pool[i];
    for (j = 0; j < toks.length; j++) {
      if (e._t.indexOf(toks[j]) >= 0) s += 4;
      else if (e._m.indexOf(toks[j]) >= 0) s += 3;
      else if (e._e.indexOf(toks[j]) >= 0) s += 3;
      else if (e._h.indexOf(toks[j]) >= 0) s += 2;
    }
    if (e.fire) s += 1;
    if (e.source === "mega-kevin") s += 1;
    if (s > 0) out.push([s, e]);
  }
  out.sort(function (x, y) { return y[0] - x[0] || gravRank(y[1]) - gravRank(x[1]); });
  if (mode === "grav") out.sort(function (x, y) { return gravRank(y[1]) - gravRank(x[1]) || y[0] - x[0]; });
  else if (mode === "az") out.sort(function (x, y) { return String(x[1].title).localeCompare(String(y[1].title)); });
  else if (mode === "date") out.sort(function (x, y) { return String(y[1].date || "").localeCompare(String(x[1].date || "")); });
  for (i = 0; i < Math.min(out.length, lim || S.limit); i++) res.push(out[i][1]);
  return res;
}
function countMatching(q) {
  var t = nrm(q).split(" "), toks = [], i, j, n = 0, e, s;
  for (i = 0; i < t.length; i++) if (t[i]) toks.push(t[i]);
  for (i = 0; i < S.base.length; i++) {
    e = S.base[i];
    if (S.theme !== "tous" && !has(e.themes || [], S.theme)) continue;
    if (!passQuick(e)) continue;
    if ($("fMake").value && e._m.indexOf(nrm($("fMake").value)) < 0) continue;
    if ($("fSys").value && e._s !== nrm($("fSys").value)) continue;
    if ($("fGrav").value && e.grav !== $("fGrav").value) continue;
    if (!toks.length) { n++; continue; }
    s = 0;
    for (j = 0; j < toks.length; j++) if (e._h.indexOf(toks[j]) >= 0) { s = 1; break; }
    if (s) n++;
  }
  return n;
}
function vehicles(q) {
  var t = nrm(q).split(" "), toks = [], o = [], i, j, k, p, hh2, s, res = [];
  for (i = 0; i < t.length; i++) if (t[i]) toks.push(t[i]);
  if (!toks.length) return o;
  for (k in ENG) {
    if (!ENG.hasOwnProperty(k)) continue;
    p = k.split("|"); hh2 = H(p[0], " ", p[1]); s = 0;
    for (j = 0; j < toks.length; j++) {
      if (has(p[0].split(" "), toks[j])) s += 5;
      else if (has(p[1].split(" "), toks[j])) s += 5;
      else if (hh2.indexOf(toks[j]) >= 0) s += 2;
    }
    if (s >= 5) o.push([s, { make: tc(p[0]), model: tc(p[1]), eng: enginesFor(p[0], p[1]) }]);
  }
  o.sort(function (x, y) { return y[0] - x[0]; });
  for (i = 0; i < Math.min(o.length, 8); i++) res.push(o[i][1]);
  return res;
}
function card(e) {
  var k = fkey(e), h, nph = (S.photos[k] || []).length;
  h = H("<div class='hit ", e.fire ? "fire" : "", "'><b class='t' data-act='detail' data-k='", esc(k), "'>", esc(e.title), "</b>");
  h = H(h, "<div class='meta'>", esc(e.make), " · ", esc(e.model), e.engine ? H(" · ", esc(e.engine)) : "",
    e.years ? H(" · ", e.years[0], "–", e.years[1]) : "", e.powers ? H(" · ", e.powers.join("–"), " ch") : "", "</div><div>");
  if (has(e.themes || [], "incendie")) h = H(h, "<span class='tag fire'>🔥 incendie</span>");
  h = H(h, "<span class='tag'>", esc(e.sys || "général"), "</span>");
  if (e.grav === "critique") h = H(h, "<span class='tag crit'>critique</span>");
  else if (e.grav === "eleve") h = H(h, "<span class='tag'>élevée</span>");
  each((e.dtc || []).slice(0, 6), function (d) { h = H(h, "<span class='tag ok'>", esc(d), "</span>"); });
  if ((e.dtc || []).length > 6) h = H(h, "<span class='tag'>+", (e.dtc || []).length - 6, "</span>");
  if (nph) h = H(h, "<span class='tag'>📷 ", nph, "</span>");
  h = H(h, "<span class='tag'>", esc(e.source), "</span></div>");
  if (e.meca) h = H(h, "<p class='sm'><b>Mécanisme :</b> ", esc(e.meca.length > 300 ? e.meca.slice(0, 300) + "…" : e.meca), "</p>");
  if (e.fire && e.chain) h = H(h, "<p class='sm'>🔥 <b>Chaîne :</b> ", esc(e.chain), "</p>");
  return H(h, "</div>");
}
function strip(e) {
  var ph = S.photos[fkey(e)] || [], h, i;
  if (!ph.length) return "";
  h = "<div class='chips'>";
  for (i = 0; i < Math.min(ph.length, 4); i++) h = H(h, "<img class='thumb' data-act='lb' data-id='", esc(ph[i].id), "' src='", esc(ph[i].url), "' alt=''>");
  if (ph.length > 4) h = H(h, "<span class='tag'>+", ph.length - 4, "</span>");
  return H(h, "<button data-act='gal' data-k='", esc(fkey(e)), "'>🖼️ Photos (", ph.length, ")</button></div>");
}
function quickBar() {
  var qs = [["","Toutes"],["fire","🔥 Incendie"],["rappel","📋 Rappels"],["mega","📚 Documentées"],["dtc","🔢 Avec DTC"],["photo","📷 Avec photos"],["admin","🛡️ Mes ajouts"]];
  var h = "", i;
  for (i = 0; i < qs.length; i++) {
    h = H(h, "<button data-act='quick' data-q='", qs[i][0], "' ",
      S.quick === qs[i][0] ? "style='background:var(--acc);color:#04102a'" : "", ">", qs[i][1], "</button>");
  }
  return H("<div class='chips'>", h, "</div>");
}
function renderResults() {
  var q = trm($("q").value), box = $("results"), f, v, h = "", i, j, x, e, total;
  if (!box) return;
  total = countMatching(q);
  f = search(q, S.limit);
  S.lastResults = f;
  v = q ? vehicles(q) : [];
  h = quickBar();
  if (v.length) {
    h = H(h, "<h3>🚗 Véhicules &amp; motorisations (", v.length, ")</h3>");
    for (i = 0; i < v.length; i++) {
      x = v[i];
      h = H(h, "<div class='hit'><b>🚗 ", esc(x.make), " ", esc(x.model), "</b>",
        "<table><tr><th>Motorisation</th><th>Énergie</th><th>Cylindrée</th><th>Puissances</th></tr>");
      for (j = 0; j < x.eng.length; j++) {
        e = x.eng[j];
        h = H(h, "<tr><td>", esc(e.m), "</td><td>", ICON[e.en] || "", " ", e.en, "</td><td>",
          e.cc ? H(e.cc, " cm³") : "—", "</td><td>", e.ch.join("/"), " ch</td></tr>");
      }
      h = H(h, "</table><button class='btn gh sm' data-act='useVeh' data-m='", esc(x.make),
        "' data-o='", esc(x.model), "'>➕ Utiliser ce véhicule</button></div>");
    }
  }
  h = H(h, "<h3>🔧 Pannes &amp; rappels — ", f.length, " affichée(s) sur ", total, "</h3>");
  if (f.length) {
    for (i = 0; i < f.length; i++) {
      h = H(h, "<div>", card(f[i]), strip(f[i]),
        "<button class='btn gh sm' data-act='webPhotos' data-q='", esc(String(f[i].title).slice(0, 50)),
        "'>📷 Photos web</button><button class='btn gh sm' data-act='studyWith' data-k='", esc(fkey(f[i])),
        "'>🧠 Étudier</button></div>");
    }
    if (total > f.length) {
      h = H(h, "<div style='text-align:center;margin:14px 0'><button class='btn' data-act='more'>⬇️ Afficher 30 de plus (",
        total - f.length, " restantes)</button></div>");
    }
  } else {
    h = H(h, "<div class='empty'>Aucun résultat pour ces critères.<br><span class='sm'>Essaie « courroie », « N47 », « P0016 », « AdBlue », « ICCU », « EGR »…</span></div>");
  }
  box.innerHTML = h;
  renderViews();
}
var renderResultsD = debounce(renderResults, 140);
function renderViews() {
  var vs = save("views") || [], h = "<button data-act='saveView'>💾 Mémoriser cette vue</button>", i;
  for (i = 0; i < vs.length; i++) {
    h = H(h, "<button data-act='loadView' data-i='", i, "'>📁 ", esc(vs[i].name), "</button>");
  }
  if (vs.length) h = H(h, "<button data-act='clearViews'>🗑️ Vider les vues</button>");
  h = H(h, "<button data-act='expResults'>📤 Exporter les résultats</button>");
  if ($("views")) $("views").innerHTML = h;
}
function fillFilters() {
  var ms = {}, ss = {}, i, m, cm = $("fMake").value, cs = $("fSys").value, a, b,
    h1 = "<option value=''>Toutes</option>", h2 = "<option value=''>Tous</option>";
  for (i = 0; i < S.base.length; i++) {
    m = trm(String(S.base[i].make || "").split("/")[0]);
    if (m) ms[m] = 1;
    if (S.base[i].sys) ss[S.base[i].sys] = 1;
  }
  a = Object.keys(ms).sort(); b = Object.keys(ss).sort();
  for (i = 0; i < a.length; i++) h1 = H(h1, "<option>", esc(a[i]), "</option>");
  for (i = 0; i < b.length; i++) h2 = H(h2, "<option>", esc(b[i]), "</option>");
  $("fMake").innerHTML = h1; $("fSys").innerHTML = h2;
  $("fMake").value = cm; $("fSys").value = cs;
}

/* ═══════════════════════ 12. EXPERTISE PRÉDICTIVE ═══════════════════════ */
function veh() {
  return {
    make: trm($("vMake").value), model: trm($("vModel").value), engine: trm($("vEngine").value),
    power: parseInt($("vPower").value, 10) || 0, year: parseInt($("vYear").value, 10) || 0,
    fuel: $("vFuel").value
  };
}
function matchV(e, v) {
  var s = 0, m;
  if (v.make && e._m.indexOf(nrm(v.make)) >= 0) s += 4;
  else if (v.make && e.make && !/multi/i.test(e.make)) return -1;
  if (v.model) {
    m = e._mo;
    if (m && m.indexOf(nrm(v.model)) >= 0) s += 4;
    else if (m && !/tous|multi/i.test(m)) s -= 2;
  }
  if (v.engine && e._e && e._e.indexOf(nrm(v.engine).split(" ")[0]) >= 0) s += 3;
  if (v.year && e.years) s += (v.year >= e.years[0] && v.year <= e.years[1]) ? 3 : -3;
  if (v.power && e.powers && e.powers.length >= 2 && v.power >= e.powers[0] * 0.9 && v.power <= e.powers[1] * 1.1) s += 2;
  if (v.fuel && e.fuel && e.fuel !== v.fuel) s -= 2;
  return s;
}
function checkedSym() {
  var l = $("qcm").getElementsByTagName("input"), o = [], i;
  for (i = 0; i < l.length; i++) if (l[i].checked) o.push(l[i].value);
  return o;
}
function hyps(v, toks, dtcs, syms) {
  var o = [], i, j, e, s, why, y, hit;
  for (i = 0; i < S.base.length; i++) {
    e = S.base[i];
    if (S.theme !== "tous" && !has(e.themes || [], S.theme)) continue;
    s = matchV(e, v);
    if (s < 0) continue;
    s = s * 2; why = [];
    if (s >= 8) why.push("véhicule concordant");
    for (j = 0; j < dtcs.length; j++) if (has(e.dtc || [], dtcs[j])) { s += 8; why.push(H("DTC ", dtcs[j])); }
    for (j = 0; j < syms.length; j++) {
      y = syms[j];
      hit = e._t.indexOf(nrm(y)) >= 0;
      each(e.sym || [], function (x) { if (nrm(x).indexOf(nrm(y)) >= 0) hit = true; });
      if (hit) { s += 3; }
    }
    for (j = 0; j < toks.length; j++) {
      if (e._t.indexOf(toks[j]) >= 0) s += 2;
      else if (e._h.indexOf(toks[j]) >= 0) s += 1;
    }
    if (e.type === "rappel") { s += 5; why.push("campagne officielle"); }
    if (e.source === "mega-kevin") {
      s += 4; why.push("panne documentée");
      if (v.engine && e._e && e._e.indexOf(nrm(v.engine).split(" ")[0]) >= 0) { s += 4; why.push("motorisation exacte"); }
      if ((e.ind || []).length) s += 2;
    }
    if (s >= 6) o.push({ e: e, s: s, why: uniq(why) });
  }
  o.sort(function (x, z) { return z.s - x.s; });
  return o.slice(0, 12);
}
function conf(t) {
  var s = t.s, d = false, c = false, i, lvl, crit;
  for (i = 0; i < t.why.length; i++) {
    if (t.why[i].indexOf("DTC") === 0) d = true;
    if (t.why[i].indexOf("campagne") === 0) c = true;
  }
  if (s >= 24 && d && c) { lvl = "CERTAIN"; crit = "Convergence forte : DTC documenté, campagne officielle et véhicule concordant."; }
  else if (s >= 18) { lvl = "PROBABLE"; crit = "Faisceau cohérent et documenté ; à confirmer par mesure, lecture OBD ou expertise."; }
  else if (s >= 10) { lvl = "POSSIBLE"; crit = "Mécanisme plausible et documenté ; preuves partielles, hypothèse à vérifier."; }
  else { lvl = "INDÉTERMINÉ"; crit = "Données insuffisantes ; expertise physique et essais requis."; }
  return { lvl: lvl, crit: crit, pct: Math.max(5, Math.min(96, Math.round(s / 32 * 100))) };
}
function fireBox(v, h) {
  var sp = [], doc = [], i, e, rap = false, txt, s, lvl;
  for (i = 0; i < h.length; i++) if (h[i].e.fire) sp.push(h[i].e);
  for (i = 0; i < S.base.length && doc.length < 6; i++) {
    e = S.base[i];
    if (e.fire && /multi/i.test(e.make) && (!v.fuel || !e.fuel || e.fuel === v.fuel)) doc.push(e);
  }
  for (i = 0; i < sp.length; i++) if (sp[i].type === "rappel") rap = true;
  lvl = rap ? "h" : sp.length ? "m" : "l";
  txt = rap ? "ÉLEVÉ — rappel incendie concordant" : sp.length ? "MODÉRÉ — chaînes documentées" : "GÉNÉRIQUE — doctrine applicable";
  s = H("<div class='fbox'><h3>🔥 Analyse incendie — ", esc(v.make || "toutes marques"), " ", esc(v.model), "</h3>",
    "<p><span class='lvl'>", txt, "</span></p>");
  for (i = 0; i < Math.min(sp.length, 6); i++) {
    s = H(s, "<div class='hit fire'><b>", esc(sp[i].title), "</b><p class='sm'>⛓️ ", esc(sp[i].chain || sp[i].meca), "</p>",
      (sp[i].ind || []).length ? H("<p class='sm'><b>Indices :</b> ", esc(sp[i].ind.join(" · ")), "</p>") : "", "</div>");
  }
  if (doc.length) {
    s = H(s, "<details><summary class='sm'>Doctrine applicable à cette énergie (", doc.length, ")</summary>");
    for (i = 0; i < doc.length; i++) s = H(s, "<div class='hit fire'><b>", esc(doc[i].title), "</b><p class='sm'>", esc(doc[i].meca), "</p></div>");
    s = H(s, "</details>");
  }
  return H(s, "<p class='sm'>⚠️ Ce niveau est fondé sur les données documentées. Il ne préjuge pas de l'origine réelle : expertise physique indispensable. En cas de doute, ne pas rouler ni recharger un véhicule électrique.</p></div>");
}
function legalMatch(c, seller) {
  var n = nrm(c), o = [], i, j, f, s, res = [];
  for (i = 0; i < LEGAL.length; i++) {
    f = LEGAL[i];
    if (f.pro && seller !== "professionnel") continue;
    s = 0;
    for (j = 0; j < f.mots.length; j++) if (n.indexOf(nrm(f.mots[j])) >= 0) s++;
    if (s > 0) o.push({ f: f, s: s });
  }
  o.sort(function (x, y) { return ((y.f.sec ? 1 : 0) - (x.f.sec ? 1 : 0)) || (y.s - x.s); });
  for (i = 0; i < Math.min(o.length, 5); i++) res.push(o[i].f);
  return res;
}
function legalHtml(l) {
  var h = "", i, j, f;
  if (!l.length) return "<p class='sm'>Aucune qualification détectée — précise achat, vendeur, panne, incendie ou litige.</p>";
  for (i = 0; i < l.length; i++) {
    f = l[i];
    h = H(h, "<div class='hit'><span class='tag ", f.sec ? "crit" : "ok", "'>", esc(f.t), "</span><p class='sm'>", esc(f.r),
      "</p><details><summary>Repères · démarches · preuves</summary><ul class='sm'>");
    for (j = 0; j < f.rep.length; j++) h = H(h, "<li>", esc(f.rep[j]), "</li>");
    h = H(h, "</ul><h3>Démarches</h3><ul class='sm'>");
    for (j = 0; j < f.dem.length; j++) h = H(h, "<li>", esc(f.dem[j]), "</li>");
    h = H(h, "</ul><h3>À conserver</h3><ul class='sm'>");
    for (j = 0; j < f.pr.length; j++) h = H(h, "<li>", esc(f.pr[j]), "</li>");
    h = H(h, "</ul><a class='sm' href='", esc(f.src), "' target='_blank' rel='noopener'>📎 Source officielle</a></details></div>");
  }
  return h;
}
function quotaUse() {
  if (S.admin) return { ok: true };
  var q = save("quota") || { start: 0, n: 0 }, now = Date.now();
  if (now - q.start >= 604800000) q = { start: now, n: 0 };
  if (q.n >= 5) return { ok: false, reset: q.start + 604800000 };
  q.n++; save("quota", q);
  return { ok: true };
}
function quotaShow() {
  var q;
  if (S.admin) { $("quota").innerHTML = "🎟️ admin ∞"; return; }
  q = save("quota") || { start: 0, n: 0 };
  $("quota").innerHTML = H("🎟️ ", Math.max(0, 5 - q.n), "/5 cette semaine");
}
function buildReport(v, ctx, seller, h, top, c, legal, feu) {
  var s, i, j, eng = enginesFor(v.make, v.model), plan = [], ex, lids = [];
  s = H("<div class='card'><h2>🧾 Compte rendu d'expertise</h2><p class='sm'>", new Date().toLocaleString("fr-FR"),
    " · base ", S.base.length, " fiches · thème ", S.theme, "</p>");
  s = H(s, "<h3>1. Identification du véhicule</h3><table>",
    "<tr><th>Marque / Modèle</th><td><b>", esc(v.make || "—"), " ", esc(v.model), "</b></td></tr>",
    "<tr><th>Motorisation</th><td>", esc(v.engine || "—"), "</td></tr>",
    "<tr><th>Puissance / Énergie</th><td>", v.power || "—", " ch · ", ICON[v.fuel] || "", " ", esc(v.fuel || "—"), "</td></tr>",
    "<tr><th>Millésime</th><td>", v.year || "—", "</td></tr>",
    "<tr><th>Vendeur</th><td>", esc(seller), "</td></tr>",
    "<tr><th>Constatations</th><td>", esc(checkedSym().join(", ") || "—"), "</td></tr>",
    "<tr><th>DTC relevés</th><td>", esc((h._dtcs || []).join(", ") || "—"), "</td></tr></table>");
  s = H(s, "<h3>2. Origine la plus probable</h3>");
  if (top) {
    s = H(s, "<div class='hit ", top.e.fire ? "fire" : "", "'><span class='tag ",
      c.lvl === "CERTAIN" ? "ok" : c.lvl === "PROBABLE" ? "ok" : "crit", "'>", c.lvl, " · indice ", c.pct, " %</span> <b>",
      esc(top.e.title), "</b><div class='meta'>", esc(top.e.make), " · ", esc(top.e.model), " · ", esc(top.e.engine || "toutes motorisations"),
      " · source ", esc(top.e.source), "</div>",
      "<p class='sm'><b>Critère de confiance :</b> ", esc(c.crit), "</p>",
      "<p class='sm'><b>Éléments concordants :</b> ", esc(top.why.join(" · ") || "termes du contexte retrouvés dans la base"), "</p>",
      "<p class='sm'><b>Mécanisme :</b> ", esc(top.e.meca || "—"), "</p>",
      "<p class='sm'><b>Conséquences :</b> ", esc((top.e.cons || []).join(" ; ") || "—"), "</p>",
      (top.e.ind || []).length ? H("<p class='sm'><b>Indices visuels :</b> ", esc(top.e.ind.join(" · ")), "</p>") : "",
      (top.e.sym || []).length ? H("<p class='sm'><b>Symptômes typiques :</b> ", esc(top.e.sym.join(" · ")), "</p>") : "",
      (top.e.dtc || []).length ? H("<p class='sm'><b>DTC associés :</b> ", esc(top.e.dtc.join(" · ")), "</p>") : "",
      strip(top.e),
      "<button class='btn gh sm' data-act='detail' data-k='", esc(fkey(top.e)), "'>📄 Fiche complète</button></div>");
  } else {
    s = H(s, "<p class='sm'>Aucune hypothèse concordante dans la base pour ces critères — expertise physique requise.</p>");
  }
  if (h.length > 1) {
    s = H(s, "<h3>3. Diagnostic différentiel</h3><table><tr><th>#</th><th>Hypothèse</th><th>Motorisation</th><th>Score</th><th></th></tr>");
    for (i = 1; i < Math.min(h.length, 7); i++) {
      s = H(s, "<tr><td>", i + 1, "</td><td>", esc(String(h[i].e.title).slice(0, 74)), "</td><td class='sm'>",
        esc(h[i].e.engine || "—"), "</td><td><b>", h[i].s, "</b></td>",
        "<td><button class='btn gh sm' data-act='detail' data-k='", esc(fkey(h[i].e)), "'>📄</button></td></tr>");
    }
    s = H(s, "</table>");
  }
  if (feu) s = H(s, "<h3>4. Volet incendie renforcé</h3>", fireBox(v, h));
  s = H(s, "<h3>", feu ? "5" : "4", ". Qualification juridique du contexte</h3>", legalHtml(legal));
  if (eng.length) {
    s = H(s, "<h3>Motorisations attribuées à ce modèle</h3><table><tr><th>Motorisation</th><th>Énergie</th><th>Cylindrée</th><th>Puissances</th></tr>");
    for (i = 0; i < eng.length; i++) {
      s = H(s, "<tr><td>", esc(eng[i].m), "</td><td>", ICON[eng[i].en] || "", " ", eng[i].en, "</td><td>",
        eng[i].cc ? H(eng[i].cc, " cm³") : "—", "</td><td>", eng[i].ch.join("/"), " ch</td></tr>");
    }
    s = H(s, "</table>");
  }
  for (i = 0; i < legal.length; i++) for (j = 0; j < legal[i].dem.length; j++) if (!has(plan, legal[i].dem[j])) plan.push(legal[i].dem[j]);
  ex = ["Conserver factures, annonce, contrat et historique d'entretien",
        "Faire établir un diagnostic écrit avant toute réparation",
        "Réaliser une lecture OBD horodatée et conserver les codes",
        "Photographier les pièces et indices avant dépose",
        "En cas de litige : réclamation écrite puis expertise contradictoire"];
  for (i = 0; i < ex.length; i++) if (!has(plan, ex[i])) plan.push(ex[i]);
  s = H(s, "<h3>Plan d'action &amp; conservation des preuves</h3><ul class='sm'>");
  for (i = 0; i < Math.min(plan.length, 12); i++) s = H(s, "<li>", esc(plan[i]), "</li>");
  s = H(s, "</ul><p class='sm'>⚠️ Méthode : qualifier → inférer → corréler → analyser → tester → conclure. Ce compte rendu est une aide documentaire fondée sur les sources citées ; il ne remplace ni une expertise physique du véhicule ni une consultation juridique personnalisée.</p>",
    "<div class='noprint'><button class='btn gh' data-act='print'>🖨️ PDF</button>",
    "<button class='btn gh' data-act='ctxJson'>📤 JSON</button>",
    "<button class='btn gh' data-act='copyReport'>📋 Copier le texte</button></div></div>");
  for (i = 0; i < legal.length; i++) lids.push(legal[i].id);
  S.report = {
    date: new Date().toISOString(), vehicule: v, contexte: ctx, niveau: c,
    origine: top ? top.e : null, differentiel: h.slice(1, 7).map(function (x) { return { titre: x.e.title, score: x.s, moteur: x.e.engine }; }),
    juridique: lids, incendie: feu
  };
  return s;
}
function ctxRun() {
  var ctx = trm($("ctx").value), q, v, seller, t, toks = [], i, dtcs, syms, h, top, c, feu, legal;
  if (!ctx) { toast("Décris la situation dans le contexte."); $("ctx").focus(); return; }
  q = quotaUse(); quotaShow();
  if (!q.ok) { toast(H("🚫 Quota atteint : 5 analyses / 7 jours. Réinitialisation le ", new Date(q.reset).toLocaleDateString("fr-FR"))); return; }
  v = veh(); seller = $("vSeller").value;
  t = nrm(ctx).split(" ");
  for (i = 0; i < t.length; i++) if (t[i].length > 3) toks.push(t[i]);
  dtcs = uniq((ctx.toUpperCase().match(/[PCBU]\d{4}/g) || []).concat($("dtc").value.toUpperCase().match(/[PCBU]\d{4}/g) || []));
  syms = checkedSym();
  h = hyps(v, toks, dtcs, syms);
  h._dtcs = dtcs;
  top = h[0];
  c = top ? conf(top) : { lvl: "INDÉTERMINÉ", crit: "Aucune hypothèse concordante.", pct: 5 };
  feu = /incendie|feu|flamme|sinistre|brule/.test(nrm(ctx)) || !!(top && top.e.fire);
  legal = legalMatch(ctx, seller);
  $("ctxOut").innerHTML = buildReport(v, ctx, seller, h, top, c, legal, feu);
  save("ctxDraft", ctx);
  toast(H("🧾 Expertise générée — niveau <b>", c.lvl, "</b> (", c.pct, " %)"));
  try { $("ctxOut").scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) {}
}
function studyRun() {
  var v = veh(), syms, dtcs, t, toks = [], i, h, top, c, rap = [], pan = [], s, hi;
  if (!v.make && !v.model) { toast("Renseigne au moins la marque et le modèle."); $("vMake").focus(); return; }
  syms = checkedSym();
  dtcs = $("dtc").value.toUpperCase().match(/[PCBU]\d{4}/g) || [];
  t = nrm($("ctx").value).split(" ");
  for (i = 0; i < t.length; i++) if (t[i].length > 3) toks.push(t[i]);
  h = hyps(v, toks, dtcs, syms);
  top = h[0];
  c = top ? conf(top) : { lvl: "INDÉTERMINÉ", pct: 5, crit: "Données insuffisantes." };
  for (i = 0; i < h.length; i++) { if (h[i].e.type === "rappel") rap.push(h[i].e); else pan.push(h[i].e); }
  s = H("<div class='card'><h2>📋 Étude de cas — ", esc(v.make), " ", esc(v.model), " ", esc(v.engine), "</h2>",
    "<p class='sm'>", new Date().toLocaleString("fr-FR"), " · ", v.power || "?", " ch · ", esc(v.fuel || "?"),
    " · ", v.year || "?", " · base ", S.base.length, " fiches</p>",
    "<h3>🎯 Origine déterminée</h3><div class='hit'><span class='tag ", c.lvl === "INDÉTERMINÉ" ? "crit" : "ok", "'>",
    c.lvl, " · ", c.pct, " %</span> <b>", esc(top ? top.e.title : "Indéterminé"), "</b><p class='sm'>", esc(c.crit), "</p>",
    top ? H("<p class='sm'><b>Concordances :</b> ", esc(top.why.join(" · ")), "</p>") : "", "</div>",
    "<h3>1️⃣ Rappels officiels concordants (", rap.length, ")</h3>");
  if (rap.length) for (i = 0; i < rap.length; i++) s = H(s, card(rap[i]), strip(rap[i]));
  else s = H(s, "<p class='sm'>Aucun rappel concordant.</p>");
  s = H(s, "<h3>2️⃣ Pannes connues (", pan.length, ")</h3>");
  if (pan.length) for (i = 0; i < pan.length; i++) s = H(s, card(pan[i]), strip(pan[i]));
  else s = H(s, "<p class='sm'>Aucune panne concordante.</p>");
  s = H(s, fireBox(v, h), "<h3>Conclusion</h3><p class='sm'>Aide documentaire fondée sur les sources ; ne remplace pas une expertise physique du véhicule.</p>",
    "<div class='noprint'><button class='btn gh' data-act='print'>🖨️ PDF</button>",
    "<button class='btn gh' data-act='ctxRun'>⚖️ Compléter par l'expertise juridique</button></div></div>");
  $("studyOut").innerHTML = s;
  hi = save("histo") || [];
  hi.unshift({ date: new Date().toLocaleString("fr-FR"), v: v, niveau: c.lvl, titre: top ? top.e.title : "Indéterminé" });
  save("histo", hi.slice(0, 25));
  renderHisto();
  toast(H("✅ Étude terminée — ", rap.length, " rappel(s), ", pan.length, " panne(s)"));
}
function renderHisto() {
  var h = save("histo") || [], s = "", i;
  for (i = 0; i < h.length; i++) {
    s = H(s, "<div class='hit'><b>", esc(h[i].v.make), " ", esc(h[i].v.model), "</b> <span class='sm'>",
      esc(h[i].date), " — ", esc(h[i].niveau), h[i].titre ? H(" — ", esc(String(h[i].titre).slice(0, 60))) : "", "</span>",
      "<button class='btn gh sm' data-act='reloadHisto' data-i='", i, "'>↩️ Recharger</button></div>");
  }
  if (h.length) s = H(s, "<button class='btn rd sm' data-act='clearHisto'>🗑️ Vider l'historique</button>");
  $("histo").innerHTML = s || "<p class='sm'>Aucune étude enregistrée.</p>";
}

/* ═══════════════════════ 13. PHOTOS ═══════════════════════ */
function compress(src, mw, q, cb) {
  mw = mw || 1000; q = q || 0.72;
  function run(im) {
    try {
      var sc = Math.min(1, mw / im.width), c = document.createElement("canvas"), u;
      c.width = Math.max(1, Math.round(im.width * sc));
      c.height = Math.max(1, Math.round(im.height * sc));
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      u = c.toDataURL("image/jpeg", q);
      while (u.length * 0.75 > 170000 && q > 0.3) { q -= 0.08; u = c.toDataURL("image/jpeg", q); }
      cb(null, u);
    } catch (e) { cb(e.message || "compression impossible"); }
  }
  if (typeof src === "string") {
    var i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = function () { run(i); };
    i.onerror = function () { cb("image inaccessible"); };
    i.src = src;
  } else {
    var fr = new FileReader();
    fr.onload = function () {
      var i2 = new Image();
      i2.onload = function () { run(i2); };
      i2.onerror = function () { cb("fichier image illisible"); };
      i2.src = fr.result;
    };
    fr.onerror = function () { cb("lecture du fichier impossible"); };
    fr.readAsDataURL(src);
  }
}
function addPend(s, c) { S.pend.push({ id: H("ph-", uid()), src: s, cap: c || "", ts: Date.now() }); renderPend(); }
function intake(files, cap) {
  var a = [], i, done = 0;
  for (i = 0; i < files.length; i++) if (/^image\//.test(files[i].type)) a.push(files[i]);
  if (!a.length) { toast("Aucune image reconnue."); return; }
  for (i = 0; i < a.length; i++) {
    (function (f) {
      compress(f, 1000, 0.72, function (err, u) {
        done++;
        if (!err) addPend(u, cap || f.name);
        if (done === a.length) { renderPend(); toast(H("📷 ", a.length, " photo(s) prête(s) — rattache-les à une panne.")); }
      });
    })(a[i]);
  }
}
function renderPend() {
  var w = $("pending"), h = "", i;
  if (!w) return;
  for (i = 0; i < S.pend.length; i++) {
    h = H(h, "<span style='position:relative;display:inline-block;margin:3px'><img class='thumb' src='", esc(S.pend[i].src),
      "' alt=''><button data-act='rmPend' data-i='", i,
      "' style='position:absolute;top:-6px;right:-6px;border:0;border-radius:50%;background:#ff2d55;color:#fff;width:18px;height:18px;cursor:pointer'>✕</button></span>");
  }
  w.innerHTML = h || "<span class='wait'>Aucune photo en attente.</span>";
}
function faultPicker() {
  var q = nrm($("fFilter").value), cur = $("fTarget").value,
    h = "<option value='__new__'>➕ Créer une NOUVELLE panne…</option>", n = 0, i, e, o, found = false;
  for (i = 0; i < S.base.length && n < 120; i++) {
    e = S.base[i];
    if (q && e._h.indexOf(q) < 0) continue;
    h = H(h, "<option value='", esc(fkey(e)), "'>", esc(String(e.title).slice(0, 62)), " · ", esc(e.make), "</option>");
    n++;
  }
  $("fTarget").innerHTML = h;
  o = $("fTarget").options;
  for (i = 0; i < o.length; i++) if (o[i].value === cur) found = true;
  if (found) $("fTarget").value = cur;
  cls($("newForm"), "hide", $("fTarget").value !== "__new__");
}
function readForm() {
  var g = function (i) { return $(i).value; }, feu = $("nFire").checked,
    ch = g("nPower").match(/\d{2,4}/g) || [], yr = g("nYears").match(/\d{4}/g) || [], i, c = [], y = [];
  for (i = 0; i < ch.length; i++) c.push(parseInt(ch[i], 10));
  for (i = 0; i < yr.length; i++) y.push(parseInt(yr[i], 10));
  return {
    id: S.editId || H("admin-", uid()),
    themes: feu ? ["technique", "incendie"] : ["technique"],
    type: "panne", source: "admin",
    make: g("nMake") || "Multi-marques", model: g("nModel") || "Tous", engine: g("nEngine"),
    years: y.length ? [Math.min.apply(null, y), Math.max.apply(null, y)] : null,
    fuel: g("nFuel") || fuelOf(g("nEngine")), sys: g("nSys"),
    dtc: g("nDtc").toUpperCase().match(/[PCBU]\d{4}/g) || [],
    sym: lines(g("nSym").replace(/,/g, "\n")),
    title: trm(g("nTitle")), meca: g("nMeca"), cons: lines(g("nCons")), ind: lines(g("nInd")),
    fire: feu, chain: feu ? g("nChain") : "", grav: g("nGrav"), url: g("nSrc"),
    powers: c.length ? [Math.min.apply(null, c), Math.max.apply(null, c)] : null,
    date: new Date().toISOString().slice(0, 10)
  };
}
function clearForm() {
  var ids = ["nTitle","nMake","nModel","nEngine","nPower","nYears","nSys","nDtc","nSym","nSrc","nMeca","nCons","nInd","nChain"], i;
  for (i = 0; i < ids.length; i++) $(ids[i]).value = "";
  $("nFuel").value = ""; $("nGrav").value = "eleve"; $("nFire").checked = false;
  S.editId = null;
  $("nfTitle").innerHTML = "Nouvelle panne — caractéristiques";
}
function attach() {
  var t = $("fTarget").value, nf, keep = [], i, j, p, n;
  if (t === "__new__") {
    nf = readForm();
    if (!nf.title) { toast("Renseigne le titre du défaut."); $("nTitle").focus(); return; }
    for (i = 0; i < S.ov.entries.length; i++) if (S.ov.entries[i].id !== nf.id) keep.push(S.ov.entries[i]);
    keep.unshift(nf);
    S.ov.entries = keep;
    t = nf.id;
    merge([nf]);
    if (nf.make && nf.model) addCatalog(nf.make, nf.model, nf.engine, parseCC(nf.engine), nf.fuel, nf.powers || []);
    clearForm();
    toast("💾 Panne enregistrée et visible immédiatement.");
  } else if (!S.pend.length) {
    toast("Ajoute au moins une photo, ou crée une nouvelle panne.");
    return;
  }
  for (j = 0; j < S.pend.length; j++) {
    p = S.pend[j];
    S.ov.photos.push({ id: p.id, fault: t, url: p.src, cap: p.cap, ts: p.ts });
  }
  n = S.pend.length;
  S.pend = [];
  persist(); renderPend(); faultPicker(); renderResults(); renderFaults(); fillFilters(); stats();
  if (n) toast(H("✅ ", n, " photo(s) rattachée(s) — publie pour diffuser aux tiers."));
  if (save("auto")) syncPush(false);
}
function renderFaults() {
  var own = S.ov.entries, h = "", i, j, e, k, ph;
  if (own.length) {
    h = H("<p class='sm'>Glisse-dépose les fiches pour les réordonner · coche pour la sélection groupée.</p>");
    for (i = 0; i < own.length; i++) {
      e = own[i]; k = fkey(e); ph = S.photos[k] || [];
      h = H(h, "<div class='hit ", S.sel[e.id] ? "sel" : "", "' draggable='true' data-drag='", i, "'>");
      h = H(h, "<label class='sm' style='display:flex;gap:7px;align-items:center'>",
        "<span style='cursor:grab;opacity:.6'>⠿</span>",
        "<input type='checkbox' data-act='selOne' data-id='", esc(e.id), "' ", S.sel[e.id] ? "checked" : "", "> ",
        "<b class='t' data-act='detail' data-k='", esc(k), "'>", esc(e.title), "</b></label>");
      h = H(h, "<div class='meta'>", esc(e.make), " · ", esc(e.model), " · ", esc(e.engine || "toutes motorisations"),
        " · ", ph.length, " photo(s)", e.fire ? " · 🔥 incendie" : "", "</div>");
      if (ph.length) {
        h = H(h, "<div class='chips'>");
        for (j = 0; j < Math.min(ph.length, 8); j++) h = H(h, "<img class='thumb' data-act='lb' data-id='", esc(ph[j].id), "' src='", esc(ph[j].url), "' alt=''>");
        h = H(h, "</div>");
      }
      h = H(h, "<button class='btn gh sm' data-act='editFault' data-id='", esc(e.id), "'>✏️ Modifier</button>",
        "<button class='btn gh sm' data-act='moveUp' data-i='", i, "' ", i === 0 ? "disabled" : "", ">⬆️</button>",
        "<button class='btn gh sm' data-act='moveDown' data-i='", i, "' ", i === own.length - 1 ? "disabled" : "", ">⬇️</button>",
        "<button class='btn gh sm' data-act='attachTo' data-id='", esc(e.id), "'>📷 Rattacher les photos en attente</button>",
        "<button class='btn rd sm' data-act='delFault' data-id='", esc(e.id), "'>🗑️ Supprimer</button></div>");
    }
  } else {
    h = "<p class='sm'>Aucune panne créée pour l'instant. Choisis « ➕ Créer une NOUVELLE panne » ci-dessus, renseigne les caractéristiques, puis enregistre.</p>";
  }
  $("faultList").innerHTML = h;
}
function delFaults(ids) {
  var re = [], rp = [], ke = [], kp = [], i, base = [];
  for (i = 0; i < S.ov.entries.length; i++) { if (has(ids, S.ov.entries[i].id)) re.push(S.ov.entries[i]); else ke.push(S.ov.entries[i]); }
  for (i = 0; i < S.ov.photos.length; i++) { if (has(ids, S.ov.photos[i].fault)) rp.push(S.ov.photos[i]); else kp.push(S.ov.photos[i]); }
  for (i = 0; i < S.base.length; i++) if (!has(ids, S.base[i].id)) base.push(S.base[i]);
  S.ov.entries = ke; S.ov.photos = kp; S.base = base; reindex();
  for (i = 0; i < ids.length; i++) delete S.sel[ids[i]];
  persist(); renderFaults(); renderResults(); fillFilters(); stats();
  toast(H("🗑️ ", re.length, " panne(s) supprimée(s)."), 9000, function () {
    S.ov.entries = re.concat(S.ov.entries);
    S.ov.photos = S.ov.photos.concat(rp);
    persist(); merge(re); renderFaults(); renderResults(); fillFilters(); stats();
    toast("↩️ Suppression annulée.");
  });
}
function enQuery(f) {
  var t = nrm(H(f.sys, " ", f.title));
  if (/courroie|distribution/.test(t)) return "timing belt damage";
  if (/egr/.test(t)) return "EGR cooler leak";
  if (/adblue|scr/.test(t)) return "AdBlue crystallization";
  if (/turbo/.test(t)) return "turbocharger failure";
  if (/fap|cataly/.test(t)) return "DPF filter clogged";
  if (/inject/.test(t)) return "fuel injector";
  if (/batterie/.test(t)) return "car battery corrosion";
  if (/frein/.test(t)) return "brake disc";
  if (/incendie|feu/.test(t)) return "car engine fire";
  return "car engine component";
}
function commons(q, cb) {
  var u = H("https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=",
    encodeURIComponent(q), "&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url&iiurlwidth=480");
  jget(u, 9000, function (j) {
    var o = [], p = j && j.query && j.query.pages, k, x, i;
    if (!p) { cb(o); return; }
    for (k in p) {
      if (!p.hasOwnProperty(k)) continue;
      x = p[k]; i = x.imageinfo && x.imageinfo[0];
      if (!i || !i.thumburl) continue;
      o.push({ thumb: i.thumburl, title: String(x.title || "").replace(/^File:/, "") });
    }
    cb(o);
  });
}
function gallery(f) {
  var out = $("photoOut"), box = document.createElement("div"), ph = S.photos[fkey(f)] || [], h, i;
  box.className = "hit";
  out.insertBefore(box, out.firstChild);
  h = H("<h3>🖼️ ", esc(String(f.title).slice(0, 84)), "</h3><p class='sm'>", esc(f.make), " ", esc(f.model), " ", esc(f.engine), "</p>",
    "<h3>📌 Photos intégrées (", ph.length, ")</h3>");
  if (ph.length) {
    h = H(h, "<div class='pgrid'>");
    for (i = 0; i < ph.length; i++) {
      h = H(h, "<figure class='pitem' data-act='lb' data-id='", esc(ph[i].id), "'><img src='", esc(ph[i].url),
        "' loading='lazy' alt=''><figcaption>", esc(ph[i].cap || "photo admin"), "</figcaption></figure>");
    }
    h = H(h, "</div>");
  } else h = H(h, "<p class='sm'>Aucune photo locale. Admin → Pannes &amp; photos → rattacher → publier.</p>");
  h = H(h, "<h3>🌐 Photothèque libre (Wikimedia Commons)</h3><p class='sm' data-cw='1'>⏳ recherche en cours…</p>");
  box.innerHTML = h;
  commons(enQuery(f), function (res) {
    var w = null, l = box.getElementsByTagName("p"), i2, g = "", tmp;
    for (i2 = 0; i2 < l.length; i2++) if (l[i2].getAttribute("data-cw")) w = l[i2];
    if (!w) return;
    if (res.length) {
      g = "<div class='pgrid'>";
      for (i2 = 0; i2 < res.length; i2++) {
        g = H(g, "<figure class='pitem' data-act='lbUrl' data-u='", esc(res[i2].thumb), "' data-c='", esc(res[i2].title),
          "'><img src='", esc(res[i2].thumb), "' loading='lazy' alt=''><figcaption>", esc(res[i2].title.slice(0, 42)), "</figcaption></figure>");
      }
      g = H(g, "</div>");
    } else g = "<p class='sm'>Aucune photo libre trouvée automatiquement.</p>";
    tmp = document.createElement("div");
    tmp.innerHTML = g;
    w.parentNode.replaceChild(tmp, w);
  });
}
function photoSearch() {
  var q = trm($("pq").value), l, i;
  if (!q) { toast("Saisis une panne à rechercher."); $("pq").focus(); return; }
  l = search(q, 5);
  $("photoOut").innerHTML = l.length ? "" : "<div class='empty'>Aucune panne ne correspond à cette recherche.</div>";
  for (i = 0; i < l.length; i++) gallery(l[i]);
}
function findPhoto(id) {
  var k, i;
  for (k in S.photos) {
    if (!S.photos.hasOwnProperty(k)) continue;
    for (i = 0; i < S.photos[k].length; i++) if (S.photos[k][i].id === id) return S.photos[k][i];
  }
  return null;
}
function lightbox(s, c) {
  var m = $("mLb");
  m.getElementsByTagName("img")[0].src = s;
  $("lbCap").innerHTML = esc(c || "");
  m.className = "modal on";
}
function findByKey(k) {
  var i;
  for (i = 0; i < S.base.length; i++) if (fkey(S.base[i]) === k) return S.base[i];
  return null;
}
function openDetail(k) {
  var e = findByKey(k), ph, h, i, rel = [], n = 0;
  if (!e) { toast("Fiche introuvable."); return; }
  ph = S.photos[k] || [];
  h = H("<h2>📄 ", esc(e.title), "</h2>", card(e));
  h = H(h, "<h3>Mécanisme détaillé</h3><p class='sm'>", esc(e.meca || "Non renseigné."), "</p>");
  if ((e.cons || []).length) {
    h = H(h, "<h3>Conséquences</h3><ul class='sm'>");
    for (i = 0; i < e.cons.length; i++) h = H(h, "<li>", esc(e.cons[i]), "</li>");
    h = H(h, "</ul>");
  }
  if ((e.ind || []).length) {
    h = H(h, "<h3>Indices visuels</h3><ul class='sm'>");
    for (i = 0; i < e.ind.length; i++) h = H(h, "<li>", esc(e.ind[i]), "</li>");
    h = H(h, "</ul>");
  }
  if ((e.sym || []).length) {
    h = H(h, "<h3>Symptômes typiques</h3><div class='chips'>");
    for (i = 0; i < e.sym.length; i++) h = H(h, "<button data-act='symPick' data-s='", esc(e.sym[i]), "'>", esc(e.sym[i]), "</button>");
    h = H(h, "</div>");
  }
  if ((e.dtc || []).length) {
    h = H(h, "<h3>Codes défaut associés</h3><div class='chips'>");
    for (i = 0; i < e.dtc.length; i++) h = H(h, "<button data-act='dtcPick' data-d='", esc(e.dtc[i]), "'>", esc(e.dtc[i]), "</button>");
    h = H(h, "</div>");
  }
  if (e.fire && e.chain) h = H(h, "<div class='fbox'><h3>🔥 Chaîne incendie</h3><p class='sm'>", esc(e.chain), "</p></div>");
  h = H(h, "<h3>Photos rattachées (", ph.length, ")</h3>");
  if (ph.length) {
    h = H(h, "<div class='pgrid'>");
    for (i = 0; i < ph.length; i++) {
      h = H(h, "<figure class='pitem' data-act='lb' data-id='", esc(ph[i].id), "'><img src='", esc(ph[i].url),
        "' alt=''><figcaption>", esc(ph[i].cap || ""), "</figcaption></figure>");
    }
    h = H(h, "</div>");
  } else h = H(h, "<p class='sm'>Aucune photo rattachée.</p>");
  for (i = 0; i < S.base.length && n < 4; i++) {
    if (fkey(S.base[i]) === k) continue;
    if (S.base[i]._s && S.base[i]._s === e._s && S.base[i]._m === e._m) { rel.push(S.base[i]); n++; }
  }
  if (rel.length) {
    h = H(h, "<h3>Pannes liées (même système / marque)</h3>");
    for (i = 0; i < rel.length; i++) {
      h = H(h, "<div class='hit'><b class='t' data-act='detail' data-k='", esc(fkey(rel[i])), "'>", esc(rel[i].title),
        "</b><div class='meta'>", esc(rel[i].engine || "toutes motorisations"), "</div></div>");
    }
  }
  h = H(h, "<div class='noprint' style='margin-top:12px'>",
    "<button class='btn gh' data-act='gal' data-k='", esc(k), "'>📷 Catalogue photos</button>",
    "<button class='btn gh' data-act='studyWith' data-k='", esc(k), "'>🧠 Étudier ce cas</button>",
    "<button class='btn gh' data-act='useFaultVeh' data-k='", esc(k), "'>🚗 Charger le véhicule</button>");
  if (S.admin && e.source === "admin") {
    h = H(h, "<button class='btn gh' data-act='editFault' data-id='", esc(e.id), "'>✏️ Modifier</button>",
      "<button class='btn rd' data-act='delFault' data-id='", esc(e.id), "'>🗑️ Supprimer</button>");
  }
  h = H(h, "</div>");
  $("detailBody").innerHTML = h;
  $("mDetail").className = "modal on";
}

/* ═══════════════════════ 14. VIN ═══════════════════════ */
var WMI = {"VF1":"Renault","VF2":"Renault","VF3":"Peugeot","VF7":"Citroën","VR1":"Peugeot","VR3":"Peugeot","VR7":"Citroën","VF8":"Matra","UU1":"Dacia","UU6":"Dacia","WVW":"Volkswagen","WV1":"Volkswagen","WV2":"Volkswagen","WVG":"Volkswagen","WAU":"Audi","TRU":"Audi","TMB":"Skoda","VSS":"SEAT","WBA":"BMW","WBS":"BMW","WBY":"BMW","WDB":"Mercedes-Benz","WDD":"Mercedes-Benz","W1K":"Mercedes-Benz","W1N":"Mercedes-Benz","WMW":"Mini","WP0":"Porsche","WP1":"Porsche","SAJ":"Jaguar","SAL":"Land Rover","WF0":"Ford","W0L":"Opel","W0V":"Opel","ZFA":"Fiat","ZAR":"Alfa Romeo","JTD":"Toyota","SB1":"Toyota","VNK":"Toyota","JHM":"Honda","SHH":"Honda","JN1":"Nissan","SJN":"Nissan","VSK":"Nissan","KMH":"Hyundai","KM8":"Hyundai","TMA":"Hyundai","KNA":"Kia","KNE":"Kia","U5Y":"Kia","JMZ":"Mazda","JM1":"Mazda","JF1":"Subaru","JF2":"Subaru","JMB":"Mitsubishi","JS3":"Suzuki","5YJ":"Tesla","7SA":"Tesla","LRW":"Tesla","YV1":"Volvo","YV4":"Volvo","LYV":"Volvo","1G1":"Chevrolet","1GC":"Chevrolet","1C4":"Jeep","1J4":"Jeep","1C6":"RAM","3C4":"Chrysler","1FT":"Ford","1FM":"Ford","LSJ":"MG","LGX":"BYD","ZFF":"Ferrari","ZHW":"Lamborghini","SCA":"Rolls-Royce","SCB":"Bentley","SCF":"Aston Martin","ZAM":"Maserati","WME":"Smart","NLH":"Hyundai","LVS":"Ford","WMA":"MAN","WJM":"Iveco","YS2":"Scania","XLR":"DAF","VF6":"Renault Trucks","LZG":"Shacman","LVV":"Chery","LJC":"JAC","LB3":"Geely"};
var YC = {"A":[1980,2010],"B":[1981,2011],"C":[1982,2012],"D":[1983,2013],"E":[1984,2014],"F":[1985,2015],"G":[1986,2016],"H":[1987,2017],"J":[1988,2018],"K":[1989,2019],"L":[1990,2020],"M":[1991,2021],"N":[1992,2022],"P":[1993,2023],"R":[1994,2024],"S":[1995,2025],"T":[1996,2026],"V":[1997,2027],"W":[1998,2028],"X":[1999,2029],"Y":[2000,2030],"1":[2001],"2":[2002],"3":[2003],"4":[2004],"5":[2005],"6":[2006],"7":[2007],"8":[2008],"9":[2009]};
var TRC = {"A":1,"B":2,"C":3,"D":4,"E":5,"F":6,"G":7,"H":8,"J":1,"K":2,"L":3,"M":4,"N":5,"P":7,"R":9,"S":2,"T":3,"U":4,"V":5,"W":6,"X":7,"Y":8,"Z":9};
var VWT = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];
function vinCheck(v) {
  if (v.length !== 17) return { ok: false, why: "longueur différente de 17 caractères" };
  if (/[IOQ]/.test(v)) return { ok: false, why: "les lettres I, O et Q sont interdites" };
  var s = 0, i, c, n, r, cd;
  for (i = 0; i < 17; i++) {
    c = v.charAt(i);
    n = (c >= "0" && c <= "9") ? parseInt(c, 10) : TRC[c];
    if (n === undefined) return { ok: false, why: "caractère invalide" };
    s += n * VWT[i];
  }
  r = s % 11; cd = r === 10 ? "X" : String(r);
  return { ok: cd === v.charAt(8), why: cd === v.charAt(8) ? "chiffre de contrôle valide" : H("chiffre de contrôle attendu ", cd, ", lu ", v.charAt(8)) };
}
var RURL = {"peugeot":"https://www.peugeot.fr/services-et-engagements/rappels-vehicules.html","citroen":"https://www.citroen.fr/services-et-engagements/rappels-vehicules.html","renault":"https://www.renault.fr/services/rappels-vehicules.html","dacia":"https://www.dacia.fr/services/rappels-vehicules.html","volkswagen":"https://www.volkswagen.fr/fr/informations-utiles/campagnes-de-rappel.html","skoda":"https://www.skoda.fr/services/rappels/","bmw":"https://www.bmw.fr/fr/topics/offres-et-services/apres-vente/rappel-bmw.html","toyota":"https://www.toyota.fr/services/rappels","tesla":"https://www.tesla.com/vin-recall-search","ford":"https://www.ford.fr/support/rappels/","audi":"https://www.audi.fr/fr/fr/company/rappels.html","mercedes benz":"https://www.mercedes-benz.fr/passengercars/being-an-owner/campaigns.html","hyundai":"https://www.hyundai.com/fr/fr/e-services/rappels.html","kia":"https://www.kia.com/fr/services/rappels/","nissan":"https://www.nissan.fr/services/rappels.html","opel":"https://www.opel.fr/services/rappels.html"};
function runVin() {
  var raw = $("vin").value.replace(/\s/g, "").toUpperCase(), out = $("vinOut"), v, mk, yc, ref, year, make, model = "", yr, fuel = "", disp = "";
  if (!raw) { toast("Saisis un numéro VIN."); $("vin").focus(); return; }
  v = vinCheck(raw);
  mk = WMI[raw.slice(0, 3)] || WMI[raw.slice(0, 2)] || "";
  yc = YC[raw.charAt(9)];
  ref = new Date().getFullYear();
  year = yc ? (yc.length === 1 ? yc[0] : (ref >= yc[1] - 1 ? yc[1] : yc[0])) : 0;
  make = mk; yr = year;
  $("vinState").innerHTML = v.ok ? "VIN valide" : "à vérifier";
  $("vinState").className = H("pill ", v.ok ? "ok" : "warn");
  function kv(l, x) { return H("<div><b>", esc(l), "</b>", esc(x || "—"), "</div>"); }
  out.innerHTML = H("<h3>1. Décodage local</h3><p class='sm'>", v.ok ? "✅" : "⚠️", " ", esc(v.why), "</p><div class='kv'>",
    kv("WMI", raw.slice(0, 3)), kv("Marque", mk), kv("Millésime", year), kv("Usine", raw.charAt(10)), kv("N° série", raw.slice(11)),
    "</div><p class='sm'>⏳ Interrogation des sources officielles (vPIC + NHTSA)…</p>");
  jget(H("https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/", encodeURIComponent(raw), "?format=json"), 9000, function (vp) {
    var d = vp && vp.Results && vp.Results[0];
    if (d) {
      make = d.Make || make; model = d.Model || ""; yr = parseInt(d.ModelYear, 10) || yr;
      fuel = d.FuelTypePrimary || ""; disp = d.DisplacementL || "";
    }
    function finish(us) {
      var loc = [], i, e, r, h;
      for (i = 0; i < S.base.length && loc.length < 8; i++) {
        e = S.base[i];
        if (nrm(e.make).indexOf(nrm(make)) >= 0 && (!model || e._mo.indexOf(nrm(model)) >= 0 || /tous|multi/i.test(e.model))) loc.push(e);
      }
      h = H("<h3>1. Décodage du VIN</h3><p class='sm'>", v.ok ? "✅" : "⚠️", " ", esc(v.why), "</p><div class='kv'>",
        kv("Marque", make), kv("Modèle", model), kv("Millésime", yr), kv("Cylindrée", disp ? H(disp, " L") : ""),
        kv("Carburant", fuel), kv("WMI", raw.slice(0, 3)), "</div>",
        "<h3>2. Campagnes de rappel NHTSA (", us.length, ")</h3>");
      for (i = 0; i < us.length; i++) {
        r = us[i];
        h = H(h, "<div class='hit ", /fire|flamm/i.test(H(r.Summary, r.Consequence)) ? "fire" : "", "'><b>",
          esc(r.NHTSACampaignNumber), "</b> · ", esc(r.ReportReceivedDate || ""),
          r.parkIt ? " <span class='tag crit'>PARK IT</span>" : "",
          "<p class='sm'>", esc(r.Component || ""), "</p><p class='sm'>", esc(String(r.Summary || "").slice(0, 300)), "</p>",
          "<a class='sm' href='https://www.nhtsa.gov/recalls?nhtsaId=", esc(r.NHTSACampaignNumber),
          "' target='_blank' rel='noopener'>📎 Fiche NHTSA</a></div>");
      }
      if (!us.length) h = H(h, "<p class='sm'>Aucune campagne NHTSA pour ce make/modèle/année (marché US).</p>");
      h = H(h, "<h3>3. Pannes documentées pour ce véhicule (", loc.length, ")</h3>");
      for (i = 0; i < loc.length; i++) h = H(h, card(loc[i]));
      h = H(h, "<h3>4. Statut « traité / non traité » de ce VIN</h3>",
        "<p class='sm'>Ce statut n'est publié que par le constructeur. Ouvre sa page officielle : le VIN est déjà copié dans le presse-papier.</p>",
        "<button class='btn' data-act='vinBrand'>🏭 Page rappels ", esc(make || "constructeur"), "</button>",
        "<button class='btn gh' data-act='vinFill'>🚗 Remplir le sélecteur véhicule</button>");
      out.innerHTML = h;
      S.vin = {
        raw: raw, make: make, model: model, year: yr, fuel: fuel, disp: disp,
        url: RURL[nrm(make)] || H("https://www.google.com/search?q=", encodeURIComponent(H(make, " rappel campagne VIN officiel")))
      };
    }
    if (make && model && yr) {
      jget(H("https://api.nhtsa.gov/recalls/recallsByVehicle?make=", encodeURIComponent(make),
        "&model=", encodeURIComponent(model), "&modelYear=", yr), 9000, function (j) { finish((j && j.results) || []); });
    } else finish([]);
  });
}

/* ═══════════════════════ 15. OBD BLE ═══════════════════════ */
var obdW = null, obdBuf = "";
function obdSend(c, w, cb) {
  obdBuf = "";
  try {
    obdW.writeValue(new TextEncoder().encode(H(c, "\r"))).then(function () {
      var t = Date.now(), iv = setInterval(function () {
        if (obdBuf.indexOf(">") >= 0 || Date.now() - t > w) { clearInterval(iv); cb(obdBuf); }
      }, 60);
    }, function () { cb(""); });
  } catch (e) { cb(""); }
}
function decodeDTC(h) {
  var p = trm(h).split(/\s+/), b = [], i, n, idx = -1, o = [], a, c;
  for (i = 0; i < p.length; i++) { n = parseInt(p[i], 16); if (!isNaN(n)) b.push(n); }
  for (i = 0; i < b.length; i++) if (b[i] === 0x43 || b[i] === 0x47) { idx = i; break; }
  if (idx < 0) return [];
  for (i = idx + 1; i + 1 < b.length; i += 2) {
    a = b[i]; c = b[i + 1];
    if (!a && !c) continue;
    o.push(H("PCBU".charAt((a >> 6) & 3), String((a >> 4) & 3), (a & 15).toString(16).toUpperCase(),
      (c >> 4).toString(16).toUpperCase(), (c & 15).toString(16).toUpperCase()));
  }
  return o;
}
function obdConnect() {
  if (!navigator.bluetooth) { $("obdState").innerHTML = "Web Bluetooth indisponible ici — ouvre l'application dans Chrome Android."; return; }
  $("obdState").innerHTML = "⏳ Sélection de l'adaptateur…";
  navigator.bluetooth.requestDevice({
    filters: [{ services: ["0000fff0-0000-1000-8000-00805f9b34fb"] }],
    optionalServices: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"]
  }).then(function (dev) {
    return dev.gatt.connect().then(function (srv) {
      return srv.getPrimaryService("0000fff0-0000-1000-8000-00805f9b34fb")
        .catch(function () { return srv.getPrimaryServices().then(function (a) { return a[0]; }); })
        .then(function (svc) { return svc.getCharacteristics(); })
        .then(function (chs) {
          var n = null, i;
          for (i = 0; i < chs.length; i++) {
            if (chs[i].properties.notify || chs[i].properties.indicate) n = chs[i];
            if (chs[i].properties.write || chs[i].properties.writeWithoutResponse) obdW = chs[i];
          }
          if (!n || !obdW) throw new Error("Caractéristiques BLE incompatibles");
          return n.startNotifications().then(function () {
            n.addEventListener("characteristicvaluechanged", function (ev) {
              obdBuf += new TextDecoder().decode(ev.target.value);
            });
            $("obdState").innerHTML = H("✅ Connecté : ", esc(dev.name || "adaptateur"));
            $("bObdRead").disabled = false;
            obdSend("ATZ", 1200, function () {
              obdSend("ATE0", 900, function () {
                obdSend("ATL0", 900, function () { obdSend("ATSP0", 1600, function () {}); });
              });
            });
          });
        });
    });
  }).catch(function (e) { $("obdState").innerHTML = H("❌ ", esc(e.message || e)); });
}
function obdRead() {
  $("obdState").innerHTML = "⏳ Lecture des défauts…";
  obdSend("03", 2500, function (a) {
    obdSend("07", 2500, function (b) {
      var codes = uniq(decodeDTC(a).concat(decodeDTC(b))), h = "", i, e, j, hits = [];
      $("obdState").innerHTML = H("✅ ", codes.length, " code(s) lu(s).");
      for (i = 0; i < codes.length; i++) {
        e = null;
        for (j = 0; j < S.base.length; j++) if (has(S.base[j].dtc || [], codes[i])) { e = S.base[j]; break; }
        if (e) hits.push(e);
        h = H(h, "<div class='hit'><b>", codes[i], "</b><p class='sm'>",
          esc(e ? e.title : "Code absent de la base — recherche élargie conseillée."), "</p>",
          e ? H("<button class='btn gh sm' data-act='detail' data-k='", esc(fkey(e)), "'>📄 Fiche</button>") : "", "</div>");
      }
      $("obdOut").innerHTML = h || "<p class='sm'>Aucun code défaut stocké ou en attente.</p>";
      if (codes.length) {
        $("dtcOn").checked = true;
        cls($("dtc"), "hide", false);
        $("dtc").value = codes.join(", ");
        toast(H("✅ ", codes.length, " code(s) injecté(s) dans l'étude de cas."));
      }
    });
  });
}

/* ═══════════════════════ 16. SYNC SANS TOKEN ═══════════════════════ */
var AD = {
  kvdb: {
    name: "kvdb.io", keys: true,
    create: function (cb) { req("https://kvdb.io/", 9000, function (e, r) { if (e || !r.ok) { cb(e || H("HTTP ", r.status)); return; } cb(null, trm(r.text).split("/").pop()); }, "POST", ""); },
    read: function (c, cb) { req(H("https://kvdb.io/", c, "/ktf"), 9000, function (e, r) { if (e) { cb(e); return; } if (r.status === 404) { cb(null, null); return; } if (!r.ok) { cb(H("HTTP ", r.status)); return; } try { cb(null, r.text ? JSON.parse(r.text) : null); } catch (x) { cb("réponse illisible"); } }); },
    write: function (c, o, cb) { req(H("https://kvdb.io/", c, "/ktf"), 12000, function (e, r) { cb(e || (r.ok ? null : H("HTTP ", r.status))); }, "PUT", JSON.stringify(o), "text/plain"); },
    putPh: function (c, i, d, cb) { req(H("https://kvdb.io/", c, "/ph_", i), 12000, function (e, r) { cb(e || (r.ok ? null : H("HTTP ", r.status))); }, "PUT", d, "text/plain"); },
    getPh: function (c, i, cb) { req(H("https://kvdb.io/", c, "/ph_", i), 12000, function (e, r) { cb(e || !r.ok ? null : r.text); }); }
  },
  restful: {
    name: "restful-api.dev", keys: false,
    create: function (cb) { req("https://api.restful-api.dev/objects", 11000, function (e, r) { if (e || !r.ok) { cb(e || H("HTTP ", r.status)); return; } try { cb(null, JSON.parse(r.text).id); } catch (x) { cb("réponse illisible"); } }, "POST", JSON.stringify({ name: "ktf", state: {} }), "application/json"); },
    read: function (c, cb) { req(H("https://api.restful-api.dev/objects/", c), 9000, function (e, r) { if (e) { cb(e); return; } if (!r.ok) { cb(null, null); return; } try { var j = JSON.parse(r.text); cb(null, j.state || null); } catch (x) { cb("réponse illisible"); } }); },
    write: function (c, o, cb) { req(H("https://api.restful-api.dev/objects/", c), 12000, function (e, r) { cb(e || (r.ok ? null : H("HTTP ", r.status))); }, "PUT", JSON.stringify({ name: "ktf", state: o }), "application/json"); }
  },
  jsonblob: {
    name: "jsonblob.com", keys: false,
    create: function (cb) { req("https://jsonblob.com/api/jsonBlob", 11000, function (e, r) { if (e || !r.ok) { cb(e || H("HTTP ", r.status)); return; } var id = r.xid || (r.loc || "").split("/").pop(); if (!id) { cb("identifiant non exposé"); return; } cb(null, id); }, "POST", "{}", "application/json"); },
    read: function (c, cb) { req(H("https://jsonblob.com/api/jsonBlob/", c), 9000, function (e, r) { if (e) { cb(e); return; } if (!r.ok) { cb(null, null); return; } try { cb(null, JSON.parse(r.text)); } catch (x) { cb("réponse illisible"); } }); },
    write: function (c, o, cb) { req(H("https://jsonblob.com/api/jsonBlob/", c), 12000, function (e, r) { cb(e || (r.ok ? null : H("HTTP ", r.status))); }, "PUT", JSON.stringify(o), "application/json"); }
  }
};
function chan() { return save("chan") || ""; }
function setChan(c) {
  save("chan", c || "");
  $("pSync").innerHTML = c ? H("📡 ", c.slice(0, 6)) : "📡 aucun";
  $("pSync").className = H("pill ", c ? "ok" : "");
}
function syncPush(manual, cb) {
  var c = chan(), A, embed = {}, meta = [], list, i = 0;
  if (!c) { if (manual) toast("❌ Crée d'abord un canal dans l'onglet 📡 Sync."); if (cb) cb(false); return; }
  A = AD[S.be]; list = S.ov.photos;
  function step() {
    var p;
    if (i >= list.length) {
      A.write(c, { v: 2, ts: Date.now(), entries: S.ov.entries, photos: meta, embedded: embed, look: S.look, revs: S.revs, mail: S.mail }, function (err) {
        var ok = !err;
        $("syState").innerHTML = ok ? H("✅ ", new Date().toLocaleTimeString("fr-FR")) : H("❌ ", esc(err));
        $("syState").className = H("pill ", ok ? "ok" : "bad");
        if (manual) toast(ok ? "📡 Publié — les tiers reçoivent sous 60 secondes." : H("❌ ", esc(err)));
        if (cb) cb(ok);
      });
      return;
    }
    p = list[i]; i++;
    if (A.keys && p.url.indexOf("data:") === 0) {
      A.putPh(c, p.id, p.url, function () { meta.push({ id: p.id, fault: p.fault, cap: p.cap, ts: p.ts, ref: "key" }); step(); });
      return;
    }
    if (p.url.indexOf("data:") === 0) {
      if (Object.keys(embed).length < 4) embed[p.id] = p.url;
      meta.push({ id: p.id, fault: p.fault, cap: p.cap, ts: p.ts, ref: "embed" });
      step(); return;
    }
    meta.push({ id: p.id, fault: p.fault, cap: p.cap, ts: p.ts, ref: "url", url: p.url });
    step();
  }
  step();
}
function syncPull(cb) {
  var c = chan(), A;
  if (!c) { chk("sync", "warn", "aucun canal configuré"); if (cb) cb(); return; }
  A = AD[S.be];
  A.read(c, function (err, st) {
    var meta, i = 0;
    if (err) { chk("sync", "warn", H(A.name, " injoignable : ", err)); if (cb) cb(); return; }
    if (!st) { chk("sync", "warn", "canal vide — l'admin n'a pas encore publié"); if (cb) cb(); return; }
    if (st.entries && st.entries.length) merge(normList(st.entries));
    meta = st.photos || [];
    function step() {
      var m, ex = false, a, j, ca, url;
      if (i >= meta.length) {
        if (st.look) { S.look = st.look; applyLook(); }
        if (st.revs && st.revs.length) {
          each(st.revs, function (s) { if (!has(S.revs, s)) S.revs.push(s); });
          save("revs", S.revs); checkRev();
        }
        if (st.mail) S.mail = st.mail;
        chk("sync", "ok", H(A.name, " · reçu ", new Date(st.ts || Date.now()).toLocaleTimeString("fr-FR")));
        fillFilters(); renderResults(); stats();
        if (cb) cb();
        return;
      }
      m = meta[i]; i++;
      a = S.photos[m.fault] || [];
      for (j = 0; j < a.length; j++) if (a[j].id === m.id) ex = true;
      if (ex) { step(); return; }
      if (m.ref === "key") {
        ca = save(H("ph:", m.id));
        if (ca) {
          if (!S.photos[m.fault]) S.photos[m.fault] = [];
          S.photos[m.fault].push({ id: m.id, url: ca, cap: m.cap, ts: m.ts });
          step(); return;
        }
        if (A.getPh) {
          A.getPh(c, m.id, function (du) {
            if (du) {
              save(H("ph:", m.id), du);
              if (!S.photos[m.fault]) S.photos[m.fault] = [];
              S.photos[m.fault].push({ id: m.id, url: du, cap: m.cap, ts: m.ts });
            }
            step();
          });
          return;
        }
        step(); return;
      }
      url = m.ref === "embed" ? ((st.embedded || {})[m.id] || "") : (m.url || "");
      if (url) {
        if (!S.photos[m.fault]) S.photos[m.fault] = [];
        S.photos[m.fault].push({ id: m.id, url: url, cap: m.cap, ts: m.ts });
      }
      step();
    }
    step();
  });
}
function applyLook() {
  var op = (S.look.op === undefined || S.look.op === null) ? 55 : S.look.op, i;
  $("wall").style.backgroundImage = S.look.bg ? H("url(", S.look.bg, ")") : "";
  $("wall").style.opacity = op / 100;
  $("op").value = op;
  $("opVal").innerHTML = H(op, "%");
  if (S.look.car) { i = new Image(); i.onload = function () { S.carImg = i; }; i.src = S.look.car; }
  else S.carImg = null;
  save("look", S.look);
}
function checkRev() {
  var a = save("access");
  if (a && has(S.revs, a.sig)) { save("access", null); if (!S.admin) gate("revoque"); }
}

/* ═══════════════════════ 17. ACCÈS ═══════════════════════ */
function b64u(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function unb64u(s) { return decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))); }
var SCREENS = ["s-home", "s-login", "s-gate", "s-app", "s-admin"];
function show(id) {
  each(SCREENS, function (x) { cls($(x), "hide", x !== id); });
  cls($("bQuit"), "hide", !(id === "s-app" || id === "s-admin"));
  try { window.scrollTo(0, 0); } catch (e) {}
}
function gate(st, n) {
  show("s-gate");
  each(["gForm", "gOk", "gKo"], function (i) { cls($(i), "hide", true); });
  if (st === "ok") { cls($("gOk"), "hide", false); $("gHello").innerHTML = esc(n || S.name); }
  else if (st === "refus" || st === "revoque") {
    cls($("gKo"), "hide", false);
    $("gWhy").innerHTML = st === "revoque" ? "🔒 Ce code a été révoqué par l'administrateur." : "❌ Code invalide ou expiré.";
  } else cls($("gForm"), "hide", false);
}
function showApp() {
  show("s-app");
  cls($("bToAdmin"), "hide", !S.admin);
  renderHisto(); quotaShow(); renderOutbox(); renderResults();
}
function showAdmin() {
  show("s-admin");
  renderCodes(); renderRevs(); faultPicker(); renderPend(); renderFaults(); paintChk();
}
function codes() { return save("codes") || []; }
function renderCodes() {
  var a = codes(), h = "", i, x, rv, ex;
  if (a.length) {
    h = "<table><tr><th>Prénom</th><th>Expire</th><th>État</th><th></th></tr>";
    for (i = 0; i < a.length; i++) {
      x = a[i]; rv = has(S.revs, x.sig); ex = x.exp < Date.now();
      h = H(h, "<tr><td>", esc(x.name), "</td><td class='sm'>", new Date(x.exp).toLocaleDateString("fr-FR"),
        "</td><td><span class='tag ", rv ? "crit" : ex ? "" : "ok", "'>", rv ? "révoqué" : ex ? "expiré" : "actif", "</span></td>",
        "<td><button class='btn gh sm' data-act='copyUser' data-i='", i, "'>📋</button>",
        "<button class='btn rd sm' data-act='revoke' data-i='", i, "' ", rv ? "disabled" : "", ">🚫</button></td></tr>");
    }
    h = H(h, "</table>");
  } else h = "<p class='sm'>Aucun code émis pour l'instant.</p>";
  $("codes").innerHTML = h;
}
function renderRevs() { $("revs").innerHTML = H("<p class='sm'>", S.revs.length, " code(s) révoqué(s).</p>"); }
function renderOutbox() {
  var o = save("outbox") || [], h = "", i;
  for (i = 0; i < o.length; i++) {
    h = H(h, "<div class='hit'><span class='sm'>", new Date(o[i].at).toLocaleString("fr-FR"),
      "</span><p class='sm'>", esc(o[i].t.slice(0, 180)), "</p></div>");
  }
  $("outbox").innerHTML = h || "<p class='sm'>Aucun message envoyé.</p>";
}
function sendMsg(cp) {
  var t = trm($("msg").value), o;
  if (!t) { toast("Écris ton message."); $("msg").focus(); return; }
  o = save("outbox") || [];
  o.unshift({ t: t, at: Date.now() });
  save("outbox", o.slice(0, 30));
  renderOutbox();
  if (cp) copy(t);
  else location.href = H("mailto:", S.mail, "?subject=", encodeURIComponent(H("Message KEV TECH & FIRE — ", S.name)), "&body=", encodeURIComponent(t));
  $("msg").value = "";
}

/* ═══════════════════════ 18. MISES À JOUR ═══════════════════════ */
function checkUpd(force, cb) {
  jget(H("data/index.json?t=", Date.now()), 6000, function (idx) {
    var local, files, all = [], i = 0;
    if (!idx) { chk("repo", "warn", "index.json absent — base embarquée utilisée"); if (cb) cb(); return; }
    local = save("ver") || "";
    if (!force && idx.version === local) { chk("repo", "ok", H("à jour (", idx.version, ")")); if (cb) cb(); return; }
    files = idx.chunks || [];
    if (!files.length) { chk("repo", "ok", "base embarquée à jour"); save("ver", idx.version || ""); if (cb) cb(); return; }
    function step() {
      var f;
      if (i >= files.length) {
        if (all.length) {
          merge(normList(all));
          save("ver", idx.version || "");
          save("cache", { ts: Date.now(), entries: S.base.slice(0, 2500) });
          fillFilters(); renderResults(); stats();
          chk("repo", "ok", H("MAJ appliquée : ", all.length, " fiches"));
          toast("⬆️ Base du dépôt mise à jour.");
        }
        if (cb) cb();
        return;
      }
      f = files[i]; i++;
      jget(H("data/", f), 9000, function (c) { if (c && c.length) all = all.concat(c); step(); });
    }
    step();
  });
}
function harvest(cb) {
  var base, off = 0, out = [];
  if (S.busy) { if (cb) cb(); return; }
  S.busy = true;
  toast("🛰️ Interrogation de RappelConso…");
  base = "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/rappelconso-v2-gtin-espaces/records";
  function fin() {
    if (out.length) {
      merge(out);
      save("cache", { ts: Date.now(), entries: S.base.slice(0, 2500) });
      save("rcTs", Date.now());
      fillFilters(); renderResults(); stats();
      toast(H("🛰️ <b>", out.length, "</b> rappels officiels intégrés à la base."));
    } else toast("⚠️ RappelConso injoignable — la base locale reste disponible.");
    S.busy = false;
    if (cb) cb();
  }
  function step() {
    var u;
    if (off >= 2000) { fin(); return; }
    u = H(base, "?where=", encodeURIComponent('categorie_produit="automobiles et moyens de déplacement"'),
      "&limit=100&offset=", off, "&order_by=", encodeURIComponent("date_publication desc"));
    jget(u, 9000, function (j) {
      var res = (j && j.results) || [];
      if (!res.length) { fin(); return; }
      each(res, function (r) {
        var txt = [r.motif_rappel, r.risques_encourus].join(" "),
          feu = /incendie|feu|flamme|inflamm/i.test(txt),
          yy = String(r.modeles_ou_references || "").match(/(?:19|20)\d{2}/g) || [], yr = [], i;
        for (i = 0; i < yy.length; i++) yr.push(parseInt(yy[i], 10));
        out.push({
          id: H("rc-", r.numero_fiche || uid()),
          themes: feu ? ["technique", "incendie"] : ["technique"],
          type: "rappel", source: "rappelconso",
          make: tc(r.marque_produit || ""), model: r.modeles_ou_references || "", engine: "",
          years: yr.length ? [Math.min.apply(null, yr), Math.max.apply(null, yr)] : null, fuel: "",
          sys: r.sous_categorie_produit || "", dtc: [], sym: [],
          title: String(r.libelle || r.motif_rappel || "Rappel").slice(0, 280),
          meca: r.motif_rappel || "", cons: [r.risques_encourus || ""], ind: [],
          fire: feu, chain: feu ? txt.slice(0, 220) : "",
          grav: feu ? "critique" : "eleve",
          url: r.lien_vers_la_fiche_rappel || "",
          date: String(r.date_publication || "").slice(0, 10)
        });
      });
      off += 100;
      if (off >= (j.total_count || 0)) { fin(); return; }
      setTimeout(step, 90);
    });
  }
  step();
}

/* ═══════════════════════ 19. FOND ANIMÉ ═══════════════════════ */
var cv = $("scene"), cx = cv ? cv.getContext("2d") : null,
    W = 0, Ht = 0, stars = [], b1 = [], b2 = [], dash = 0, raf = 0, vis = true;
function resize() {
  if (!cx) return;
  var d = Math.min(window.devicePixelRatio || 1, 1.5), i;
  W = window.innerWidth; Ht = window.innerHeight;
  cv.width = Math.max(1, Math.round(W * d));
  cv.height = Math.max(1, Math.round(Ht * d));
  cx.setTransform(d, 0, 0, d, 0, 0);
  stars = [];
  for (i = 0; i < 70; i++) stars.push({ x: Math.random() * W, y: Math.random() * Ht * 0.55, r: Math.random() * 1.4 + 0.3, p: Math.random() * 6 });
  function mk(n, h) { var a = [], j; for (j = 0; j < n; j++) a.push({ x: j * (W / n), w: W / n * 0.7, h: h + Math.random() * h }); return a; }
  b1 = mk(14, Ht * 0.16); b2 = mk(20, Ht * 0.1);
}
function accent() {
  try { return trm(getComputedStyle(document.documentElement).getPropertyValue("--acc")) || "#00e676"; }
  catch (e) { return "#00e676"; }
}
function drawAurora(t) {
  var i, bx, by, rg;
  for (i = 0; i < 3; i++) {
    bx = W * (0.2 + 0.3 * i) + Math.sin(t / 5000 + i * 2) * W * 0.15;
    by = Ht * 0.25 + Math.cos(t / 6000 + i) * Ht * 0.08;
    rg = cx.createRadialGradient(bx, by, 0, bx, by, W * 0.4);
    rg.addColorStop(0, i === 0 ? "rgba(0,229,255,.16)" : i === 1 ? "rgba(139,92,255,.16)" : "rgba(255,122,24,.12)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    cx.fillStyle = rg;
    cx.fillRect(0, 0, W, Ht);
  }
}
function drawCar(x, y, s, t) {
  var a = accent(), wh = [-88, 92], w, k;
  cx.save();
  cx.translate(x, y + Math.sin(t / 180) * 1.6);
  cx.scale(s, s);
  if (S.carImg) { cx.drawImage(S.carImg, -150, -78, 300, 90); cx.restore(); return; }
  cx.shadowColor = a; cx.shadowBlur = 16;
  cx.fillStyle = "#0d1330"; cx.strokeStyle = a; cx.lineWidth = 2;
  cx.beginPath();
  cx.moveTo(-140, 0);
  cx.quadraticCurveTo(-130, -30, -80, -36);
  cx.lineTo(-45, -58);
  cx.quadraticCurveTo(0, -72, 55, -56);
  cx.lineTo(95, -36);
  cx.quadraticCurveTo(140, -30, 146, -8);
  cx.lineTo(146, 0);
  cx.closePath();
  cx.fill(); cx.stroke();
  cx.shadowBlur = 0;
  cx.fillStyle = "rgba(144,202,249,.85)";
  cx.beginPath();
  cx.moveTo(-40, -54); cx.lineTo(48, -52); cx.lineTo(78, -38); cx.lineTo(-62, -38);
  cx.closePath(); cx.fill();
  for (w = 0; w < 2; w++) {
    cx.fillStyle = "#05070f";
    cx.beginPath(); cx.arc(wh[w], 2, 20, 0, 6.2832); cx.fill();
    cx.strokeStyle = a; cx.lineWidth = 2; cx.stroke();
    cx.save();
    cx.translate(wh[w], 2); cx.rotate(t / 90);
    cx.strokeStyle = "rgba(255,255,255,.5)";
    for (k = 0; k < 4; k++) { cx.rotate(Math.PI / 2); cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(0, -14); cx.stroke(); }
    cx.restore();
  }
  cx.fillStyle = "rgba(255,241,118,.9)"; cx.fillRect(140, -14, 60, 12);
  cx.fillStyle = "#ff2d55"; cx.fillRect(-146, -16, 6, 8);
  cx.restore();
}
function frame(t) {
  var a, road, i, x, s, g;
  if (!vis || !cx) { raf = 0; return; }
  a = accent(); road = Ht * 0.8;
  g = cx.createLinearGradient(0, 0, 0, Ht);
  g.addColorStop(0, "#05081a"); g.addColorStop(0.55, "#141034"); g.addColorStop(1, "#05081a");
  cx.fillStyle = g; cx.fillRect(0, 0, W, Ht);
  drawAurora(t);
  cx.fillStyle = "#fff";
  for (i = 0; i < stars.length; i++) {
    s = stars[i];
    cx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t / 900 + s.p));
    cx.fillRect(s.x, s.y, s.r, s.r);
  }
  cx.globalAlpha = 1;
  cx.fillStyle = "rgba(10,14,36,.9)";
  for (i = 0; i < b1.length; i++) { x = (b1[i].x - t * 0.008) % W; cx.fillRect(x < 0 ? x + W : x, road - b1[i].h, b1[i].w, b1[i].h); }
  cx.fillStyle = "rgba(16,20,52,.95)";
  for (i = 0; i < b2.length; i++) { x = (b2[i].x - t * 0.02) % W; cx.fillRect(x < 0 ? x + W : x, road - b2[i].h, b2[i].w, b2[i].h); }
  cx.fillStyle = a; cx.globalAlpha = 0.5; cx.fillRect(0, road, W, 2); cx.globalAlpha = 1;
  cx.fillStyle = "#0a0d1c"; cx.fillRect(0, road, W, Ht - road);
  dash = (dash + 6) % 160;
  cx.fillStyle = "rgba(255,215,64,.8)";
  for (x = -dash; x < W; x += 160) cx.fillRect(x, road + (Ht - road) * 0.5, 70, 5);
  drawCar(W * 0.34, road - 2, Math.min(1, W / 700), t);
  raf = window.requestAnimationFrame(frame);
}
function startLoop() {
  if (!cx) return;
  if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
  vis = true;
  if (window.requestAnimationFrame) raf = window.requestAnimationFrame(frame);
}
function net() {
  var c = navigator.connection || {}, t = c.type === "wifi" ? "WiFi" : String(c.effectiveType || "").toUpperCase();
  $("pNet").innerHTML = navigator.onLine ? H("📶 ", t || "en ligne") : "📴 hors ligne";
  $("pNet").className = H("pill ", navigator.onLine ? "ok" : "warn");
  chk("net", navigator.onLine ? "ok" : "warn", navigator.onLine ? "en ligne" : "hors ligne — base locale utilisable");
}

/* ═══════════════════════ 20. SUGGESTIONS PRÉDICTIVES ═══════════════════════ */
function prov(kind) {
  if (kind === "make") return function () {
    var c = nrm($("vMake").value), o = [], i;
    for (i = 0; i < BRANDS.length; i++) {
      if (!c || BRANDS[i].indexOf(c) >= 0) o.push({ value: tc(BRANDS[i]), label: tc(BRANDS[i]), hint: H((MODELS[BRANDS[i]] || []).length, " modèles") });
    }
    return o;
  };
  if (kind === "model") return function () {
    var b = nrm($("vMake").value), c = nrm($("vModel").value), l = [], i, k, o = [];
    if (MODELS[b]) l = MODELS[b].slice(0);
    else { for (k in MODELS) { if (!MODELS.hasOwnProperty(k)) continue; if (!b || k.indexOf(b) >= 0) l = l.concat(MODELS[k]); } }
    l = uniq(l);
    for (i = 0; i < l.length; i++) if (!c || l[i].indexOf(c) >= 0) o.push({ value: tc(l[i]), label: tc(l[i]), hint: H(enginesFor(b, l[i]).length, " moteurs") });
    return o;
  };
  if (kind === "engine") return function () {
    var l = enginesFor($("vMake").value, $("vModel").value), c = nrm($("vEngine").value), o = [], i, e;
    for (i = 0; i < l.length; i++) {
      e = l[i];
      if (c && nrm(e.m).indexOf(c) < 0) continue;
      o.push({ value: e.m, label: H(ICON[e.en] || "", " ", e.m, " · ", e.en, " · ", e.ch.join("/"), " ch", e.cc ? H(" · ", e.cc, " cm³") : ""), hint: e.src });
    }
    return o;
  };
  if (kind === "power") return function () {
    var ps = powersFor($("vMake").value, $("vModel").value, $("vEngine").value), o = [], i;
    for (i = 0; i < ps.length; i++) o.push({ value: String(ps[i]), label: H(ps[i], " ch"), hint: H(Math.round(ps[i] / 1.36), " kW") });
    return o;
  };
  return function () {
    var c = nrm($("q").value), s = {}, i, k, o = [], e;
    if (c.length < 2) return [];
    for (i = 0; i < BRANDS.length; i++) s[tc(BRANDS[i])] = 1;
    for (k in MODELS) { if (!MODELS.hasOwnProperty(k)) continue; for (i = 0; i < MODELS[k].length; i++) s[tc(MODELS[k][i])] = 1; }
    for (i = 0; i < Math.min(S.base.length, 1200); i++) {
      e = S.base[i];
      each(e.dtc || [], function (d) { s[d] = 1; });
      if (e.sys) s[e.sys] = 1;
      if (e.engine) s[e.engine] = 1;
    }
    for (k in s) { if (!s.hasOwnProperty(k)) continue; if (nrm(k).indexOf(c) >= 0) o.push({ value: k, label: k, hint: "" }); }
    return o.slice(0, 14);
  };
}
function suggest(inp) {
  var p, w, l;
  if (!inp || inp._sg) return;
  inp._sg = true;
  p = prov(inp.getAttribute("data-sg"));
  w = document.createElement("div");
  w.className = "sgw";
  inp.parentNode.insertBefore(w, inp);
  w.appendChild(inp);
  l = document.createElement("div");
  l.className = "sgl";
  l.style.display = "none";
  w.appendChild(l);
  function open() {
    var it = [], h = "", i;
    try { it = p().slice(0, 14); } catch (e) { it = []; }
    if (!it.length) { l.style.display = "none"; return; }
    for (i = 0; i < it.length; i++) {
      h = H(h, "<div data-i='", i, "'>", esc(it[i].label),
        it[i].hint ? H(" <span style='color:#93a4d8;font-size:.65rem'>", esc(it[i].hint), "</span>") : "", "</div>");
    }
    l.innerHTML = h; l._i = it; l.style.display = "block";
  }
  inp.addEventListener("focus", open);
  inp.addEventListener("click", open);
  inp.addEventListener("input", open);
  l.addEventListener("mousedown", function (ev) {
    var t = ev.target;
    while (t && t !== l && !t.getAttribute("data-i")) t = t.parentNode;
    if (!t || t === l) return;
    ev.preventDefault();
    inp.value = l._i[parseInt(t.getAttribute("data-i"), 10)].value;
    l.style.display = "none";
    fire(inp, "change");
  });
  inp.addEventListener("blur", function () { setTimeout(function () { l.style.display = "none"; }, 180); });
}
function feedWords(ta, ch) {
  ta.addEventListener("input", debounce(function () {
    var w = nrm(ta.value).split(" "), last = w[w.length - 1] || "", s = {}, i, k, h = "", t, n = 0;
    if (last.length < 3) { ch.innerHTML = ""; return; }
    for (i = 0; i < Math.min(S.base.length, 900); i++) {
      t = nrm(H(S.base[i].title, " ", S.base[i].sys)).split(" ");
      each(t, function (x) { if (x.indexOf(last) === 0 && x !== last) s[x] = 1; });
    }
    for (k in s) {
      if (!s.hasOwnProperty(k)) continue;
      if (n++ >= 6) break;
      h = H(h, "<button data-act='word' data-w='", esc(k), "' data-t='", ta.id, "'>", esc(k), " ⏎</button>");
    }
    ch.innerHTML = h;
  }, 200));
}

/* ═══════════════════════ 21. ACTIONS ═══════════════════════ */
var ACT = {
  noop: function () {},
  home: function () { save("mode", null); show("s-home"); },
  modeAdmin: function () { $("pwd").value = ""; show("s-login"); $("pwd").focus(); },
  modeTiers: function () {
    var a;
    save("mode", "tiers");
    a = save("access");
    if (a && !has(S.revs, a.sig)) { S.name = a.name; showApp(); } else gate("form");
  },
  login: function () {
    var p = $("pwd").value;
    $("pwd").value = "";
    if (!p) return;
    if (p === PWD) { S.admin = true; showAdmin(); toast("🛡️ Mode administrateur déverrouillé."); }
    else toast("❌ Mot de passe incorrect.");
  },
  gate: function () {
    var p = trm($("gName").value), c = trm($("gCode").value), parts, pl, sg, pay;
    if (!p || !c) { toast("Prénom et code d'accès requis."); return; }
    parts = c.split("."); pl = parts[0]; sg = parts[1];
    if (!pl || !sg) { gate("refus"); return; }
    try { pay = JSON.parse(unb64u(pl)); } catch (e) { gate("refus"); return; }
    if (sig(pl) !== sg) { gate("refus"); return; }
    if (pay.exp && Date.now() > pay.exp) { gate("refus"); return; }
    if (has(S.revs, sg)) { gate("revoque"); return; }
    S.name = p; save("name", p); save("access", { name: p, sig: sg }); gate("ok", p);
  },
  gateRetry: function () { gate("form"); },
  enter: function () { showApp(); },
  askCode: function () {
    var p = trm($("gName").value) || "(ton prénom)";
    location.href = H("mailto:", S.mail, "?subject=", encodeURIComponent("Demande de code KEV TECH & FIRE"),
      "&body=", encodeURIComponent(H("Bonjour,\n\nPrénom : ", p, "\nJe souhaite un code d'accès à l'application.\n\nMerci !")));
    toast("📧 Demande préparée dans ta messagerie.");
  },
  joinChan: function () { setChan(trm($("gChan").value)); syncPull(); toast(chan() ? "✅ Canal rejoint." : "Canal effacé."); },
  quit: function () { S.admin = false; show("s-home"); },
  toAdmin: function () { if (S.admin) showAdmin(); },
  toApp: function () { showApp(); },
  theme: function (t) {
    var b = $("seg").getElementsByTagName("button"), i;
    S.theme = t.getAttribute("data-t");
    document.documentElement.setAttribute("data-theme", S.theme);
    for (i = 0; i < b.length; i++) cls(b[i], "on", b[i] === t);
    S.limit = 30;
    renderResults();
  },
  quick: function (t) { S.quick = t.getAttribute("data-q") || ""; S.limit = 30; renderResults(); },
  more: function () { S.limit += 30; renderResults(); },
  tabApp: function (t) {
    var v = t.getAttribute("data-v"), ids = ["search", "study", "photos", "obd", "msg"], i, b;
    for (i = 0; i < ids.length; i++) cls($(H("v-", ids[i])), "hide", ids[i] !== v);
    b = $("tabsApp").getElementsByTagName("button");
    for (i = 0; i < b.length; i++) if (b[i].getAttribute("data-v")) cls(b[i], "on", b[i] === t);
  },
  tabAdm: function (t) {
    var a = t.getAttribute("data-a"), ids = ["access", "faults", "look", "sync", "base"], i, b;
    for (i = 0; i < ids.length; i++) cls($(H("a-", ids[i])), "hide", ids[i] !== a);
    b = $("tabsAdm").getElementsByTagName("button");
    for (i = 0; i < b.length; i++) if (b[i].getAttribute("data-a")) cls(b[i], "on", b[i] === t);
    if (a === "faults") { faultPicker(); renderFaults(); }
    if (a === "base") paintChk();
  },
  pickEng: function (t) {
    var l = $("cEng")._l || [], e = l[parseInt(t.getAttribute("data-e"), 10)];
    if (!e) return;
    $("vEngine").value = e.m;
    autoAttr();
  },
  pickPow: function (t) { $("vPower").value = t.getAttribute("data-p"); saveVeh(); },
  useVeh: function (t) {
    $("vMake").value = t.getAttribute("data-m");
    $("vModel").value = t.getAttribute("data-o");
    $("vEngine").value = ""; $("vPower").value = "";
    renderEng(); renderPow(); renderAttrib(); saveVeh();
    try { window.scrollTo(0, 0); } catch (e) {}
    toast("✅ Véhicule chargé dans le sélecteur.");
  },
  useFaultVeh: function (t) {
    var e = findByKey(t.getAttribute("data-k"));
    if (!e) return;
    $("vMake").value = String(e.make).split("/")[0].replace(/^\s+|\s+$/g, "");
    $("vModel").value = String(e.model).split("/")[0].replace(/^\s+|\s+$/g, "");
    if (e.engine) $("vEngine").value = String(e.engine).split("/")[0].replace(/^\s+|\s+$/g, "");
    if (e.fuel) $("vFuel").value = e.fuel;
    if (e.powers && e.powers.length) $("vPower").value = e.powers[0];
    if (e.years) $("vYear").value = e.years[0];
    $("mDetail").className = "modal";
    renderEng(); renderPow(); renderAttrib(); saveVeh();
    showApp();
    toast("✅ Véhicule de la fiche chargé.");
  },
  detail: function (t) { openDetail(t.getAttribute("data-k")); },
  detailClose: function () { $("mDetail").className = "modal"; },
  lb: function (t) { var p = findPhoto(t.getAttribute("data-id")); if (p) lightbox(p.url, p.cap); },
  lbUrl: function (t) { lightbox(t.getAttribute("data-u"), t.getAttribute("data-c")); },
  lbClose: function () { $("mLb").className = "modal"; },
  gal: function (t) {
    var k = t.getAttribute("data-k"), f = findByKey(k), b, i;
    $("mDetail").className = "modal";
    showApp();
    b = $("tabsApp").getElementsByTagName("button");
    for (i = 0; i < b.length; i++) if (b[i].getAttribute("data-v") === "photos") { ACT.tabApp(b[i]); break; }
    $("photoOut").innerHTML = "";
    if (f) gallery(f);
  },
  webPhotos: function (t) {
    var b, i;
    showApp();
    b = $("tabsApp").getElementsByTagName("button");
    for (i = 0; i < b.length; i++) if (b[i].getAttribute("data-v") === "photos") { ACT.tabApp(b[i]); break; }
    $("pq").value = t.getAttribute("data-q");
    photoSearch();
  },
  studyWith: function (t) {
    var e = findByKey(t.getAttribute("data-k")), b, i;
    if (!e) return;
    $("mDetail").className = "modal";
    if (!$("vMake").value) {
      $("vMake").value = String(e.make).split("/")[0].replace(/^\s+|\s+$/g, "");
      $("vModel").value = String(e.model).split("/")[0].replace(/^\s+|\s+$/g, "");
      if (e.engine) $("vEngine").value = String(e.engine).split("/")[0].replace(/^\s+|\s+$/g, "");
      if (e.fuel) $("vFuel").value = e.fuel;
      renderEng(); renderPow(); renderAttrib(); saveVeh();
    }
    if ((e.dtc || []).length) { $("dtcOn").checked = true; cls($("dtc"), "hide", false); $("dtc").value = e.dtc.join(", "); }
    each(e.sym || [], function (s) {
      var l = $("qcm").getElementsByTagName("input"), j;
      for (j = 0; j < l.length; j++) if (nrm(l[j].value) === nrm(s)) { l[j].checked = true; cls(l[j].parentNode, "on", true); }
    });
    showApp();
    b = $("tabsApp").getElementsByTagName("button");
    for (i = 0; i < b.length; i++) if (b[i].getAttribute("data-v") === "study") { ACT.tabApp(b[i]); break; }
    studyRun();
  },
  symPick: function (t) {
    var s = t.getAttribute("data-s"), l = $("qcm").getElementsByTagName("input"), j, found = false;
    for (j = 0; j < l.length; j++) if (nrm(l[j].value) === nrm(s)) { l[j].checked = true; cls(l[j].parentNode, "on", true); found = true; }
    $("mDetail").className = "modal";
    toast(found ? H("✅ Constatation « ", esc(s), " » cochée.") : H("ℹ️ « ", esc(s), " » ajouté au contexte."));
    if (!found) $("ctx").value = H($("ctx").value, " ", s);
  },
  dtcPick: function (t) {
    var d = t.getAttribute("data-d"), cur = $("dtc").value;
    $("dtcOn").checked = true;
    cls($("dtc"), "hide", false);
    if (cur.indexOf(d) < 0) $("dtc").value = cur ? H(cur, ", ", d) : d;
    $("mDetail").className = "modal";
    toast(H("✅ DTC ", esc(d), " ajouté à l'étude."));
  },
  photoSearch: function () { photoSearch(); },
  ctxRun: function () { ctxRun(); },
  ctxJson: function () { dl("expertise-kev-tech-fire.json", JSON.stringify(S.report || { vehicule: veh(), contexte: $("ctx").value }, null, 1)); },
  copyReport: function () {
    var r = S.report, t;
    if (!r) { toast("Génère d'abord un compte rendu."); return; }
    t = H("COMPTE RENDU D'EXPERTISE — KEV TECH & FIRE\n", r.date, "\n\n",
      "Véhicule : ", r.vehicule.make, " ", r.vehicule.model, " ", r.vehicule.engine, " — ",
      r.vehicule.power, " ch ", r.vehicule.fuel, " (", r.vehicule.year, ")\n",
      "Niveau : ", r.niveau.lvl, " (", r.niveau.pct, " %)\n",
      "Critère : ", r.niveau.crit, "\n",
      "Origine : ", r.origine ? r.origine.title : "indéterminée\n",
      r.origine ? H("Mécanisme : ", r.origine.meca, "\nConséquences : ", (r.origine.cons || []).join(" ; "), "\n") : "",
      r.incendie && r.origine ? H("Chaîne incendie : ", r.origine.chain || "", "\n") : "",
      "\nContexte : ", r.contexte, "\n\nQualifications : ", (r.juridique || []).join(", "),
      "\n\nAide documentaire — ne remplace ni expertise physique ni consultation juridique.");
    copy(t);
  },
  studyRun: function () { studyRun(); },
  print: function () { window.print(); },
  word: function (t) {
    var ta = $(t.getAttribute("data-t"));
    if (!ta) return;
    ta.value = H(ta.value.replace(/[A-Za-z0-9à-ÿ-]+$/, t.getAttribute("data-w")), " ");
    ta.focus();
    fire(ta, "input");
  },
  obdConnect: function () { obdConnect(); },
  obdRead: function () { obdRead(); },
  msgSend: function () { sendMsg(false); },
  msgCopy: function () { sendMsg(true); },
  vinRun: function () { runVin(); },
  vinPaste: function () {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(function (t) {
        $("vin").value = t.replace(/\s/g, "").slice(0, 17);
        runVin();
      }, function () { toast("Colle le VIN manuellement."); });
    } else toast("Colle le VIN manuellement dans le champ.");
  },
  vinBrand: function () { if (!S.vin) return; copy(S.vin.raw); window.open(S.vin.url, "_blank", "noopener"); },
  vinFill: function () {
    var v;
    if (!S.vin) return;
    v = S.vin;
    if (v.make) $("vMake").value = tc(v.make.toLowerCase());
    if (v.model) $("vModel").value = v.model;
    if (v.year) $("vYear").value = v.year;
    if (v.disp) $("vEngine").value = H(parseFloat(v.disp).toFixed(1), " L");
    if (v.fuel) $("vFuel").value = /electric/i.test(v.fuel) ? "electrique" : /diesel/i.test(v.fuel) ? "diesel" : /hybrid/i.test(v.fuel) ? "hybride" : "essence";
    renderEng(); renderPow(); renderAttrib(); saveVeh();
    try { window.scrollTo(0, 0); } catch (e) {}
    toast("✅ Sélecteur véhicule pré-rempli depuis le VIN.");
  },
  genCode: function () {
    var p = trm($("acName").value), days, pay, pl, sg, code, a;
    if (!p) { toast("Prénom requis."); $("acName").focus(); return; }
    days = Math.max(1, parseInt($("acDays").value, 10) || 365);
    pay = { p: p, n: uid(), exp: Date.now() + days * 86400000 };
    pl = b64u(JSON.stringify(pay)); sg = sig(pl); code = H(pl, ".", sg);
    $("genOut").innerHTML = esc(code);
    cls($("genOut"), "hide", false);
    a = codes();
    a.unshift({ name: p, exp: pay.exp, sig: sg, code: code });
    save("codes", a);
    renderCodes();
    toast(H("🎟️ Code généré pour ", esc(p), " — valable ", days, " jours."));
  },
  copyGen: function () { copy($("genOut").textContent); },
  shareGen: function () {
    var t = H("Code d'accès KEV TECH & FIRE :\n", $("genOut").textContent, "\n\nÀ coller dans l'app, mode TIERS.");
    if (navigator.share) navigator.share({ title: "Code d'accès", text: t }).catch(function () { copy(t); });
    else copy(t);
  },
  copyUser: function (t) { var a = codes(), x = a[parseInt(t.getAttribute("data-i"), 10)]; if (x) copy(x.code); },
  revoke: function (t) {
    var a = codes(), x = a[parseInt(t.getAttribute("data-i"), 10)];
    if (!x) return;
    if (!has(S.revs, x.sig)) S.revs.push(x.sig);
    save("revs", S.revs);
    renderCodes(); renderRevs();
    toast("🚫 Code révoqué — publie pour diffuser aux tiers.");
  },
  pubRevs: function () { syncPush(true); },
  dropClick: function () { $("pFile").click(); },
  urlAdd: function () {
    var u = trm($("pUrl").value);
    if (!u) { toast("Saisis une URL d'image."); return; }
    compress(u, 1000, 0.72, function (e, d) {
      if (e) { addPend(u, $("pCap").value || u); toast("ℹ️ URL conservée en lien direct."); }
      else addPend(d, $("pCap").value || u);
      $("pUrl").value = "";
    });
  },
  rmPend: function (t) { S.pend.splice(parseInt(t.getAttribute("data-i"), 10), 1); renderPend(); },
  attach: function () { attach(); },
  attachTo: function (t) {
    var id = t.getAttribute("data-id"), j, p, n;
    if (!S.pend.length) { toast("Aucune photo en attente — colle ou glisse d'abord des images."); return; }
    for (j = 0; j < S.pend.length; j++) {
      p = S.pend[j];
      S.ov.photos.push({ id: p.id, fault: id, url: p.src, cap: p.cap, ts: p.ts });
    }
    n = S.pend.length; S.pend = [];
    persist(); renderPend(); renderFaults(); renderResults(); stats();
    toast(H("✅ ", n, " photo(s) rattachée(s) à cette panne."));
    if (save("auto")) syncPush(false);
  },
  cancelEdit: function () { clearForm(); $("fTarget").value = "__new__"; cls($("newForm"), "hide", false); toast("Édition annulée."); },
  pubFaults: function () { syncPush(true); },
  expFaults: function () { dl("ktf-pannes-photos.json", JSON.stringify(S.ov, null, 1)); },
  editFault: function (t) {
    var id = t.getAttribute("data-id"), e = null, i, b;
    for (i = 0; i < S.ov.entries.length; i++) if (S.ov.entries[i].id === id) e = S.ov.entries[i];
    if (!e) { toast("Panne introuvable."); return; }
    S.editId = e.id;
    $("mDetail").className = "modal";
    showAdmin();
    b = $("tabsAdm").getElementsByTagName("button");
    for (i = 0; i < b.length; i++) if (b[i].getAttribute("data-a") === "faults") { ACT.tabAdm(b[i]); break; }
    $("fTarget").value = "__new__";
    cls($("newForm"), "hide", false);
    $("nfTitle").innerHTML = H("✏️ Modifier — ", esc(e.title));
    $("nTitle").value = e.title || "";
    $("nMake").value = e.make || "";
    $("nModel").value = e.model || "";
    $("nEngine").value = e.engine || "";
    $("nPower").value = (e.powers || []).join(",");
    $("nYears").value = e.years ? e.years.join("-") : "";
    $("nFuel").value = e.fuel || "";
    $("nSys").value = e.sys || "";
    $("nDtc").value = (e.dtc || []).join(",");
    $("nSym").value = (e.sym || []).join(", ");
    $("nGrav").value = e.grav || "eleve";
    $("nSrc").value = e.url || "";
    $("nMeca").value = e.meca || "";
    $("nCons").value = (e.cons || []).join("\n");
    $("nInd").value = (e.ind || []).join("\n");
    $("nFire").checked = !!e.fire;
    $("nChain").value = e.chain || "";
    try { $("newForm").scrollIntoView({ behavior: "smooth", block: "center" }); } catch (x) {}
  },
  delFault: function (t) { delFaults([t.getAttribute("data-id")]); },
  moveUp: function (t) {
    var i = parseInt(t.getAttribute("data-i"), 10), a = S.ov.entries, x;
    if (i < 1) return;
    x = a.splice(i, 1)[0]; a.splice(i - 1, 0, x);
    persist(); renderFaults();
  },
  moveDown: function (t) {
    var i = parseInt(t.getAttribute("data-i"), 10), a = S.ov.entries, x;
    if (i >= a.length - 1) return;
    x = a.splice(i, 1)[0]; a.splice(i + 1, 0, x);
    persist(); renderFaults();
  },
  selOne: function (t) {
    var id = t.getAttribute("data-id");
    if (t.checked) S.sel[id] = 1; else delete S.sel[id];
    renderFaults();
  },
  selAll: function () { each(S.ov.entries, function (e) { S.sel[e.id] = 1; }); renderFaults(); },
  selNone: function () { S.sel = {}; renderFaults(); },
  bulkDel: function () {
    var ids = [], k;
    for (k in S.sel) if (S.sel.hasOwnProperty(k)) ids.push(k);
    if (!ids.length) { toast("Aucune panne sélectionnée."); return; }
    delFaults(ids);
  },
  opApply: function () { S.look.op = parseInt($("op").value, 10); applyLook(); toast("💾 Opacité appliquée."); },
  lookReset: function () { S.look = { op: 55 }; applyLook(); toast("🎨 Apparence réinitialisée."); },
  pubLook: function () { S.mail = trm($("mail").value) || S.mail; save("mail", S.mail); syncPush(true); },
  syCreate: function () {
    toast("⏳ Création du canal…");
    AD[S.be].create(function (e, id) {
      if (e) { toast(H("❌ ", esc(AD[S.be].name), " : ", esc(e), " — essaie un autre service.")); return; }
      setChan(id); $("syCh").value = id;
      syncPush(false, function () { toast(H("✅ Canal créé : <b>", esc(id), "</b> — partage ce code aux tiers.")); });
    });
  },
  syUse: function () { setChan(trm($("syCh").value)); syncPull(); },
  syShare: function () {
    var c = chan(), t;
    if (!c) { toast("Aucun canal."); return; }
    t = H("Code canal KEV TECH & FIRE : ", c, "\nÀ coller dans l'app (badge 📡 ou écran d'accès tiers).");
    if (navigator.share) navigator.share({ title: "Canal de synchronisation", text: t }).catch(function () { copy(t); });
    else copy(t);
  },
  syTest: function () {
    var c = trm($("syCh").value) || chan();
    if (!c) { toast("Renseigne un code canal."); return; }
    AD[S.be].read(c, function (e, st) {
      if (e) { toast(H("❌ ", esc(e))); return; }
      toast(st ? "✅ Canal joignable et alimenté." : "⚠️ Canal joignable mais vide.");
    });
  },
  syPub: function () { syncPush(true); },
  syPull: function () { syncPull(function () { toast("🔄 Synchronisation effectuée."); }); },
  reload: function () { background(true, function () { toast("✅ Base rechargée."); }); },
  importSites: function () { importSites(true); },
  harvest: function () { harvest(); },
  diag: function () { $("mDiag").className = "modal on"; paintChk(); },
  diagClose: function () { $("mDiag").className = "modal"; },
  goBase: function () {
    var b, i;
    if (S.admin) {
      showAdmin();
      b = $("tabsAdm").getElementsByTagName("button");
      for (i = 0; i < b.length; i++) if (b[i].getAttribute("data-a") === "base") { ACT.tabAdm(b[i]); break; }
    } else $("mDiag").className = "modal on";
  },
  askChan: function () {
    var c = window.prompt("Code canal de synchronisation :", chan());
    if (c === null) return;
    setChan(trm(c)); syncPull();
  },
  hardReset: function () {
    try { localStorage.clear(); } catch (e) {}
    if (window.indexedDB && indexedDB.deleteDatabase) { try { indexedDB.deleteDatabase("ktf-store"); } catch (e) {} }
    if (window.caches && caches.keys) caches.keys().then(function (ks) { each(ks, function (k) { caches.delete(k); }); }).catch(function () {});
    setTimeout(function () { location.reload(); }, 500);
  },
  errClose: function () { cls($("err"), "hide", true); },
  expAll: function () {
    dl("ktf-base-complete.json", JSON.stringify({
      version: new Date().toISOString(),
      stats: { fiches: S.base.length, marques: BRANDS.length, modeles: countModels(), moteurs: Object.keys(ENG).length },
      entries: S.base, catalogue: ENG, photos: S.ov.photos
    }, null, 1));
  },
  expResults: function () {
    if (!S.lastResults.length) { toast("Aucun résultat à exporter."); return; }
    dl("ktf-resultats.json", JSON.stringify({ requete: $("q").value, theme: S.theme, filtre: S.quick, total: S.lastResults.length, entries: S.lastResults }, null, 1));
  },
  saveView: function () {
    var n = window.prompt("Nom de cette vue :", $("q").value || "Vue"), vs;
    if (!n) return;
    vs = save("views") || [];
    vs.push({ name: n, q: $("q").value, make: $("fMake").value, sys: $("fSys").value, grav: $("fGrav").value, sort: $("fSort").value, theme: S.theme, quick: S.quick });
    save("views", vs.slice(-10));
    renderViews();
    toast("💾 Vue mémorisée.");
  },
  loadView: function (t) {
    var vs = save("views") || [], v = vs[parseInt(t.getAttribute("data-i"), 10)], b, i;
    if (!v) return;
    $("q").value = v.q || "";
    fillFilters();
    $("fMake").value = v.make || "";
    $("fSys").value = v.sys || "";
    $("fGrav").value = v.grav || "";
    $("fSort").value = v.sort || "score";
    S.theme = v.theme || "tous";
    S.quick = v.quick || "";
    S.limit = 30;
    document.documentElement.setAttribute("data-theme", S.theme);
    b = $("seg").getElementsByTagName("button");
    for (i = 0; i < b.length; i++) cls(b[i], "on", b[i].getAttribute("data-t") === S.theme);
    renderResults();
    toast(H("📁 Vue « ", esc(v.name), " » chargée."));
  },
  clearViews: function () { save("views", []); renderViews(); toast("🗑️ Vues effacées."); },
  reloadHisto: function (t) {
    var h = save("histo") || [], x = h[parseInt(t.getAttribute("data-i"), 10)];
    if (!x || !x.v) return;
    $("vMake").value = x.v.make || "";
    $("vModel").value = x.v.model || "";
    $("vEngine").value = x.v.engine || "";
    $("vPower").value = x.v.power || "";
    $("vYear").value = x.v.year || "";
    $("vFuel").value = x.v.fuel || "";
    renderEng(); renderPow(); renderAttrib(); saveVeh();
    showApp();
    toast("↩️ Véhicule de l'étude rechargé.");
  },
  clearHisto: function () {
    var old = save("histo") || [];
    save("histo", []);
    renderHisto();
    toast("🗑️ Historique vidé.", 8000, function () { save("histo", old); renderHisto(); toast("↩️ Historique restauré."); });
  }
};

/* ═══════════════════════ 22. IMPORT DE FICHIERS ═══════════════════════ */
function doImport(inp) {
  var files = [], i, idx = 0, count = 0;
  if (!S.admin) { toast("Import réservé à l'administrateur."); inp.value = ""; return; }
  for (i = 0; i < inp.files.length; i++) files.push(inp.files[i]);
  function step() {
    var f, fr;
    if (idx >= files.length) {
      persist(); fillFilters(); renderResults(); renderFaults(); stats();
      inp.value = "";
      toast(H("📥 Import terminé : ", count, " élément(s) fusionné(s)."));
      return;
    }
    f = files[idx]; idx++;
    fr = new FileReader();
    fr.onload = function () {
      var txt = String(fr.result || ""), j, a, nn, blocks2, acc;
      try {
        if (/\.json$/i.test(f.name)) {
          j = JSON.parse(txt);
          acc = { faults: [], rows: [] };
          ingest(j, "", 0, acc, "import");
          a = isArr(j) ? j : (j.entries || []);
          nn = normList(a);
          each(nn, function (e) { S.ov.entries.push(e); });
          each(acc.faults, function (e) { S.ov.entries.push(e); });
          merge(nn.concat(acc.faults));
          absorbCatalog(acc.rows);
          count += nn.length + acc.faults.length;
          if (j.photos) each(j.photos, function (p) { S.ov.photos.push(p); count++; });
          if (j.catalogue && typeof j.catalogue === "object") {
            for (var kk in j.catalogue) {
              if (!j.catalogue.hasOwnProperty(kk)) continue;
              if (!ENG[kk]) ENG[kk] = j.catalogue[kk];
              var pp = kk.split("|");
              addModelOnly(pp[0], pp[1]);
            }
          }
        } else {
          blocks2 = txt.split(/\n\s*\n/);
          each(blocks2, function (x) {
            var e;
            if (x.replace(/\s/g, "").length < 40) return;
            e = {
              id: H("doc-", uid()), themes: ["technique"], type: "document", source: "import",
              make: "Multi-marques", model: "Tous", title: H(f.name, " — extrait ", count + 1),
              meca: x.slice(0, 1800), cons: [], dtc: x.toUpperCase().match(/[PCBU]\d{4}/g) || [],
              fire: /incendie|feu/i.test(x), grav: "modere", date: new Date().toISOString().slice(0, 10)
            };
            S.ov.entries.push(e); merge([e]); count++;
          });
        }
      } catch (e) { toast(H("❌ ", esc(f.name), " : fichier illisible.")); }
      step();
    };
    fr.onerror = function () { step(); };
    fr.readAsText(f);
  }
  step();
}

/* ═══════════════════════ 23. ÉVÉNEMENTS ═══════════════════════ */
function bindEvents() {
  document.addEventListener("click", function (ev) {
    var t = upAct(ev.target), n, f;
    if (!t) return;
    n = t.getAttribute("data-act");
    f = ACT[n];
    if (!f) return;
    if (t.tagName === "A" || n === "dropClick") ev.preventDefault();
    try { f(t, ev); }
    catch (e) { if (window.onerror) window.onerror(H(n, " : ", e.message), "app.js", 0, 0, e); }
  }, false);

  document.addEventListener("input", function (ev) {
    var i = ev.target, n, bx, j, dtc, toks, w, h, o;
    if (!i || !i.id) return;
    try {
      if (i.id === "q") { S.limit = 30; renderResultsD(); }
      else if (i.id === "fFilter") faultPicker();
      else if (i.id === "op") { $("opVal").innerHTML = H(i.value, "%"); $("wall").style.opacity = i.value / 100; }
      else if (i.id === "ctx") {
        save("ctxDraft", i.value);
        n = nrm(i.value);
        bx = $("qcm").getElementsByTagName("input");
        for (j = 0; j < bx.length; j++) {
          if (n.indexOf(nrm(bx[j].value).split(" ")[0]) >= 0 && !bx[j].checked) {
            bx[j].checked = true; cls(bx[j].parentNode, "on", true);
          }
        }
        dtc = i.value.toUpperCase().match(/[PCBU]\d{4}/g) || [];
        if (dtc.length && !$("dtc").value) {
          $("dtc").value = uniq(dtc).join(", ");
          $("dtcOn").checked = true;
          cls($("dtc"), "hide", false);
        }
        toks = []; w = n.split(" ");
        for (j = 0; j < w.length; j++) if (w[j].length > 3) toks.push(w[j]);
        h = hyps(veh(), toks, dtc, checkedSym()).slice(0, 4);
        o = "";
        for (j = 0; j < h.length; j++) {
          o = H(o, "<span class='tag ", h[j].e.fire ? "fire" : "", "' data-act='detail' data-k='", esc(fkey(h[j].e)),
            "' style='cursor:pointer'>", esc(String(h[j].e.title).slice(0, 46)), " · ", h[j].s, "</span>");
        }
        $("live").innerHTML = o ? H("<b style='color:#ffc400'>🔎 Corrélations en direct :</b> ", o) : "";
      }
    } catch (e) { if (window.onerror) window.onerror(H("input : ", e.message), "app.js", 0, 0, e); }
  }, false);

  document.addEventListener("change", function (ev) {
    var i = ev.target, l, ok = false, j, b, cur;
    if (!i) return;
    try {
      if (i.id === "vMake") {
        b = nrm(i.value); cur = nrm($("vModel").value);
        if (cur && MODELS[b] && MODELS[b].length && !has(MODELS[b], cur)) {
          $("vModel").value = ""; $("vEngine").value = ""; $("vPower").value = "";
          toast("ℹ️ Modèle effacé : incompatible avec la nouvelle marque.");
        }
        renderEng(); renderPow(); renderAttrib(); saveVeh();
      }
      else if (i.id === "vModel") {
        renderEng();
        l = enginesFor($("vMake").value, $("vModel").value);
        for (j = 0; j < l.length; j++) if (nrm(l[j].m) === nrm($("vEngine").value)) ok = true;
        if ($("vEngine").value && !ok) { $("vEngine").value = ""; $("vPower").value = ""; }
        renderPow(); renderAttrib(); saveVeh();
      }
      else if (i.id === "vEngine") autoAttr();
      else if (i.id === "vPower" || i.id === "vYear" || i.id === "vFuel") saveVeh();
      else if (i.id === "fMake" || i.id === "fSys" || i.id === "fGrav" || i.id === "fSort") { S.limit = 30; renderResults(); }
      else if (i.id === "dtcOn") cls($("dtc"), "hide", !i.checked);
      else if (i.id === "fTarget") cls($("newForm"), "hide", i.value !== "__new__");
      else if (i.id === "syBe") { S.be = i.value; save("be", S.be); }
      else if (i.id === "syAuto") save("auto", i.checked);
      else if (i.id === "pFile" && i.files.length) { intake(i.files, $("pCap").value); i.value = ""; }
      else if (i.id === "bgFile" && i.files[0]) compress(i.files[0], 1600, 0.85, function (e, u) {
        if (e) { toast(H("❌ ", esc(e))); return; }
        S.look.bg = u; applyLook(); toast("🎨 Fond d'écran appliqué.");
      });
      else if (i.id === "carFile" && i.files[0]) compress(i.files[0], 900, 0.85, function (e, u) {
        if (e) { toast(H("❌ ", esc(e))); return; }
        S.look.car = u; applyLook(); toast("🚗 Véhicule animé appliqué.");
      });
      else if (i.id === "imp") doImport(i);
      else if (i.type === "checkbox" && inId(i, "qcm")) cls(i.parentNode, "on", i.checked);
    } catch (e) { if (window.onerror) window.onerror(H("change : ", e.message), "app.js", 0, 0, e); }
  }, false);

  document.addEventListener("keydown", function (ev) {
    var id = ev.target && ev.target.id;
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === "k" || ev.key === "K")) {
      ev.preventDefault();
      if ($("s-app").className.indexOf("hide") >= 0) showApp();
      $("q").focus(); $("q").select();
      return;
    }
    if (ev.key === "Enter" && id === "pwd") { ev.preventDefault(); ACT.login(); }
    else if (ev.key === "Enter" && id === "vin") { ev.preventDefault(); runVin(); }
    else if (ev.key === "Enter" && id === "pq") { ev.preventDefault(); photoSearch(); }
    else if (ev.key === "Enter" && id === "gCode") { ev.preventDefault(); ACT.gate(); }
    else if (ev.key === "Enter" && id === "q") { ev.preventDefault(); renderResults(); }
    else if (ev.key === "Escape") {
      $("mLb").className = "modal";
      $("mDiag").className = "modal";
      $("mDetail").className = "modal";
    }
  }, false);

  document.addEventListener("paste", function (ev) {
    var files = [], i, it, f;
    if (!S.admin || !ev.clipboardData || !ev.clipboardData.items) return;
    for (i = 0; i < ev.clipboardData.items.length; i++) {
      it = ev.clipboardData.items[i];
      if (/^image\//.test(it.type)) { f = it.getAsFile(); if (f) files.push(f); }
    }
    if (!files.length) return;
    ev.preventDefault();
    intake(files, "photo collée");
  }, false);

  var dz = $("drop");
  if (dz) {
    dz.addEventListener("dragenter", function (e) { e.preventDefault(); cls(dz, "on", true); });
    dz.addEventListener("dragover", function (e) { e.preventDefault(); cls(dz, "on", true); });
    dz.addEventListener("dragleave", function (e) { e.preventDefault(); cls(dz, "on", false); });
    dz.addEventListener("drop", function (e) {
      e.preventDefault(); cls(dz, "on", false);
      if (e.dataTransfer && e.dataTransfer.files.length) intake(e.dataTransfer.files, $("pCap").value);
    });
  }

  var fl = $("faultList");
  if (fl) {
    fl.addEventListener("dragstart", function (e) {
      var t = e.target;
      while (t && t !== fl && !t.getAttribute("data-drag")) t = t.parentNode;
      if (!t || t === fl) return;
      S.dragFrom = parseInt(t.getAttribute("data-drag"), 10);
      try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(S.dragFrom)); } catch (x) {}
      t.style.opacity = "0.45";
    });
    fl.addEventListener("dragend", function (e) {
      var t = e.target;
      while (t && t !== fl && !t.getAttribute("data-drag")) t = t.parentNode;
      if (t && t !== fl) t.style.opacity = "";
    });
    fl.addEventListener("dragover", function (e) { e.preventDefault(); try { e.dataTransfer.dropEffect = "move"; } catch (x) {} });
    fl.addEventListener("drop", function (e) {
      var t = e.target, to, a, x;
      e.preventDefault();
      while (t && t !== fl && !t.getAttribute("data-drag")) t = t.parentNode;
      if (!t || t === fl || S.dragFrom < 0) return;
      to = parseInt(t.getAttribute("data-drag"), 10);
      if (to === S.dragFrom) { S.dragFrom = -1; return; }
      a = S.ov.entries;
      x = a.splice(S.dragFrom, 1)[0];
      a.splice(to, 0, x);
      S.dragFrom = -1;
      persist(); renderFaults();
      toast("↕️ Ordre des pannes mis à jour.");
    });
  }

  each(["mLb", "mDiag", "mDetail"], function (id) {
    var m = $(id);
    if (m) m.addEventListener("click", function (e) { if (e.target === m) m.className = "modal"; });
  });

  window.addEventListener("resize", function () { guard(resize, "redimensionnement"); });
  window.addEventListener("online", function () { net(); syncPull(); });
  window.addEventListener("offline", net);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { vis = false; if (raf) { window.cancelAnimationFrame(raf); raf = 0; } }
    else { startLoop(); syncPull(); }
  });
}

/* ═══════════════════════ 24. CHARGEMENT D'ARRIÈRE-PLAN ═══════════════════════ */
function background(force, cb) {
  var c = save("cache");
  if (c && c.entries && c.entries.length) {
    merge(c.entries);
    chk("cache", "ok", H(c.entries.length, " fiches restaurées du cache"));
  } else chk("cache", "warn", "cache vide — premier lancement");
  fillFilters(); renderResults(); stats();
  jget("data/seed.json", 5000, function (s) {
    if (s && s.length) merge(normList(s));
    jget("data/manual.json", 5000, function (man) {
      var a;
      if (man) { a = isArr(man) ? man : (man.entries || []); merge(normList(a)); }
      jget("data/photos.json", 5000, function (ph) {
        var aa;
        if (ph) {
          aa = isArr(ph) ? ph : (ph.photos || []);
          each(aa, function (p) {
            var cur = S.photos[p.fault] || [], found = false;
            each(cur, function (x) { if (x.id === p.id) found = true; });
            if (!found) { if (!S.photos[p.fault]) S.photos[p.fault] = []; S.photos[p.fault].push(p); }
          });
        }
        fillFilters(); renderResults(); stats();
        save("cache", { ts: Date.now(), entries: S.base.slice(0, 2500) });
        checkUpd(!!force, function () {
          syncPull(function () {
            var rc = save("rcTs") || 0;
            function afterHarvest() {
              if (!save("siteDone") && navigator.onLine) importSites(false, function () { paintChk(); if (cb) cb(); });
              else { paintChk(); if (cb) cb(); }
            }
            if (navigator.onLine && (force || S.base.length < 150 || Date.now() - rc > 604800000)) harvest(afterHarvest);
            else afterHarvest();
          });
        });
      });
    });
  });
}

/* ═══════════════════════ 25. DÉMARRAGE ═══════════════════════ */
function boot() {
  var nm = countModels(), st = "ok", mode, acc, megaN = 0, draft;

  guard(function () {
    var h = "", i;
    for (i = 0; i < SYMPT.length; i++) h = H(h, "<label><input type='checkbox' value='", esc(SYMPT[i]), "'>", esc(SYMPT[i]), "</label>");
    $("qcm").innerHTML = h;
  }, "constatations");

  guard(function () {
    $("mail").value = S.mail;
    $("syBe").value = S.be;
    $("syCh").value = chan();
    $("syAuto").checked = !!save("auto");
    draft = save("ctxDraft");
    if (draft) $("ctx").value = draft;
  }, "champs admin");

  guard(resize, "canvas");
  guard(applyLook, "apparence");
  guard(bindEvents, "événements");
  chk("events", "ok", "contrôles liés par délégation — aucun gestionnaire manquant");

  chk("cat", "ok", H(BRANDS.length, " marques · ", nm, " modèles · ", Object.keys(ENG).length, " couples moteur documentés"));

  guard(function () {
    each(["vMake", "vModel", "vEngine", "vPower", "q"], function (id) { suggest($(id)); });
  }, "suggestions prédictives");

  guard(function () { feedWords($("ctx"), $("predCtx")); }, "rédaction prédictive");

  guard(function () {
    merge(SEED);
    if (window.KTF_FAULTS && window.KTF_FAULTS.length) {
      megaN = window.KTF_FAULTS.length;
      merge(normList(window.KTF_FAULTS));
    }
    merge(S.ov.entries);
    rebuild();
  }, "base de pannes");

  chk("seed", "ok", H(SEED.length, " fiches de doctrine embarquées — fonctionne hors ligne"));
  chk("mega", megaN ? "ok" : "warn", megaN ? H(megaN, " pannes documentées (méga base) intégrées") : "pannes.js absent — méga base non chargée");

  guard(loadLocalImport, "import local des 2 sites");
  guard(restoreVeh, "restauration véhicule");
  guard(fillFilters, "filtres");
  guard(renderEng, "moteurs");
  guard(renderPow, "puissances");
  guard(renderAttrib, "attribution");
  guard(renderResults, "résultats");
  guard(stats, "statistiques");
  guard(renderHisto, "historique");
  guard(renderOutbox, "messages");
  guard(quotaShow, "quota");
  guard(function () { setChan(chan()); }, "canal");
  guard(net, "réseau");

  chk("boot", "ok", "application autonome chargée — aucun module externe requis");
  try { localStorage.setItem("ktf:t", "1"); localStorage.removeItem("ktf:t"); } catch (e) { st = "warn"; }
  chk("store", st, st === "ok" ? "localStorage opérationnel" : "stockage restreint — session en mémoire");

  guard(startLoop, "animation de fond");
  cls($("boot"), "off", true);

  mode = save("mode"); acc = save("access");
  if (mode === "tiers" && acc && !has(S.revs, acc.sig)) { S.name = acc.name; showApp(); }
  else show("s-home");

  if (navigator.serviceWorker) {
    navigator.serviceWorker.register("sw.js").then(
      function () { chk("sw", "ok", "enregistré — mode hors ligne actif"); },
      function (e) { chk("sw", "warn", e.message || "enregistrement refusé"); }
    );
  } else chk("sw", "warn", "non supporté par ce navigateur");

  paintChk();
  setTimeout(function () { background(false); }, 400);
  setInterval(function () {
    syncPull();
    if (S.admin && save("auto")) syncPush(false);
  }, 60000);

  window.__APP_OK = true;
}

window.KTF = {
  state: S, actions: ACT, eng: ENG, brands: BRANDS, models: MODELS,
  syncPush: syncPush, syncPull: syncPull, harvest: harvest,
  importSites: importSites, enginesFor: enginesFor, search: search,
  hyps: hyps, report: function () { return S.report; }
};

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

})();
