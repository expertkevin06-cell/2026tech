/* KEV TECH & FIRE — 2026tech — ES5, aucune dépendance */
(function () {
"use strict";

function H() {
  var s = "", i, a;
  for (i = 0; i < arguments.length; i++) { a = arguments[i]; if (a !== null && a !== undefined) s += String(a); }
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
  if (typeof v === "string") { p = v.split(/\r?\n|;/); for (i = 0; i < p.length; i++) { t = trm(p[i]); if (t) o.push(t); } }
  return o;
}
function hash(s) {
  var h = 2166136261, i; s = String(s);
  for (i = 0; i < s.length; i++) { h = h ^ s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return ("00000000" + h.toString(36)).slice(-8);
}
function sig(m) { return H(hash("A" + m), hash("B" + m), hash("C" + m), hash("D" + m)); }
function fkey(e) { return e.id || hash([e.source, e.make, e.model, e.engine, e.title].join("|")); }
function tc(s) { return String(s).replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function cls(el, c, on) {
  if (!el) return;
  var cur = " " + el.className + " ";
  if (on) { if (cur.indexOf(" " + c + " ") < 0) el.className = trm(el.className + " " + c); }
  else { el.className = trm(cur.replace(" " + c + " ", " ")); }
}
function toast(m, ms, undo) {
  var d = document.createElement("div"); d.className = "toast";
  var s = document.createElement("span"); s.innerHTML = m; d.appendChild(s);
  if (undo) {
    var b = document.createElement("button"); b.className = "btn gh sm"; b.innerHTML = "↩️ Annuler";
    b.onclick = function () { try { undo(); } catch (e) {} if (d.parentNode) d.parentNode.removeChild(d); };
    d.appendChild(b);
  }
  $("toasts").appendChild(d);
  setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, ms || 4000);
}
function save(k, v) {
  try {
    if (v === undefined) { var r = localStorage.getItem("ktf:" + k); return r ? JSON.parse(r) : null; }
    if (v === null) { localStorage.removeItem("ktf:" + k); return null; }
    localStorage.setItem("ktf:" + k, JSON.stringify(v)); return v;
  } catch (e) { return null; }
}
function saveBig(k, arr) {
  var caps = [2000, 1000, 500, 200], i;
  for (i = 0; i < caps.length; i++) { if (save(k, arr.slice(0, caps[i])) !== null) return; }
}
function dl(n, t) {
  try {
    var b = new Blob([t], { type: "application/json" }), a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = n; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); if (a.parentNode) a.parentNode.removeChild(a); }, 400);
  } catch (e) { toast("Export impossible."); }
}
function copy(t) {
  if (!t) { toast("Rien à copier."); return; }
  try {
    var ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.left = "-9999px";
    document.body.appendChild(ta); ta.focus(); ta.select();
    var ok = document.execCommand("copy"); document.body.removeChild(ta);
    if (ok) { toast("📋 Copié."); return; }
  } catch (e) {}
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(t).then(function () { toast("📋 Copié."); }, function () { toast("Copie refusée."); });
    return;
  }
  toast("Copie indisponible.");
}
function req(url, ms, cb, method, body, ctype) {
  try {
    var x = new XMLHttpRequest();
    x.open(method || "GET", url, true); x.timeout = ms || 9000;
    if (ctype) { try { x.setRequestHeader("Content-Type", ctype); } catch (e) {} }
    x.onload = function () {
      cb(null, { ok: x.status >= 200 && x.status < 300, status: x.status, text: x.responseText,
        loc: x.getResponseHeader ? x.getResponseHeader("Location") : "",
        xid: x.getResponseHeader ? x.getResponseHeader("X-JsonBlob-Id") : "" });
    };
    x.onerror = function () { cb("réseau indisponible"); };
    x.ontimeout = function () { cb("délai dépassé"); };
    x.send(body || null);
  } catch (e) { cb(e.message || "erreur réseau"); }
}
function jget(url, ms, cb) {
  req(url, ms, function (e, r) { if (e || !r || !r.ok) { cb(null); return; } try { cb(JSON.parse(r.text)); } catch (x) { cb(null); } });
}
function fetchText(url, ms, cb) { req(url, ms, function (e, r) { cb(e, r ? r.text : ""); }); }
function upAct(el) { while (el && el !== document) { if (el.getAttribute && el.getAttribute("data-act")) return el; el = el.parentNode; } return null; }
function inId(el, id) { while (el && el !== document) { if (el.id === id) return true; el = el.parentNode; } return false; }
function fire(el, n) { var e; try { e = new Event(n, { bubbles: true }); } catch (x) { e = document.createEvent("HTMLEvents"); e.initEvent(n, true, false); } el.dispatchEvent(e); }
function guard(f, label) { try { return f(); } catch (e) { window.onerror(H(label, ": ", e.message), "app.js", 0, 0, e); return null; } }

/* ══════════ DONNÉES EMBARQUÉES ══════════ */
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
{id:"e3",themes:["technique","incendie"],type:"panne",source:"doctrine",make:"Multi-marques VE",model:"Tous VE",engine:"OBC / ICCU",years:[2018,2027],fuel:"electrique",sys:"Charge",dtc:[],sym:["voyant allumé","odeur brûlé"],title:"Connecteur, OBC, ICCU : arc et échauffement",meca:"Arc DC au-delà de 1000 °C répété à chaque session, carbonisation des broches.",cons:["Feu de zone de charge"],ind:["Broche carbonisée","trappe fondue"],fire:true,chain:"Résistance de contact → arc DC répété → carbonisation → flamme",grav:"critique",url:"",date:"2026-01-01"},
{id:"p1",themes:["technique","incendie"],type:"panne",source:"base-kevin",make:"Peugeot / Citroën / DS / Opel",model:"208 / 2008 / 308 / 3008 / 5008 / C3 / C4",engine:"1.2 PureTech",years:[2013,2023],fuel:"essence",sys:"Distribution",dtc:["P0016","P0521"],sym:["claquement","voyant allumé","perte de puissance"],title:"Courroie de distribution humide — délamination",meca:"Courroie immergée dans l'huile, délamination, débris, colmatage de la crépine, chute de pression d'huile.",cons:["Casse moteur","serrage","fuite d'huile sur chaud"],ind:["Courroie effilochée","crépine colmatée","copeaux dans le carter"],fire:true,chain:"Débris → crépine colmatée → pression d'huile → serrage et fuite → huile sur échappement → feu possible",grav:"critique",url:"https://rappel.conso.gouv.fr/",date:"2026-01-01",powers:[75,131]},
{id:"p2",themes:["technique"],type:"panne",source:"base-kevin",make:"Peugeot / Citroën",model:"3008 / 5008 / C4 / C5 Aircross",engine:"1.5 BlueHDi",years:[2017,2024],fuel:"diesel",sys:"AdBlue / SCR",dtc:["P20EE","P204F"],sym:["voyant allumé","perte de puissance","démarrage difficile"],title:"AdBlue : cristallisation réservoir et injecteur",meca:"Cristallisation de l'urée sur cycles courts, obstruction injecteur et pompe, défaut de dosage NOx.",cons:["Mode dégradé","démarrage interdit","remplacement réservoir"],ind:["Cristaux blancs","dépôts injecteur","codes SCR"],fire:false,chain:"",grav:"eleve",url:"https://rappel.conso.gouv.fr/",date:"2026-01-01",powers:[100,130]},
{id:"p3",themes:["technique","incendie"],type:"panne",source:"base-kevin",make:"Peugeot / Citroën",model:"308 / 3008 / C4",engine:"1.6 BlueHDi",years:[2014,2021],fuel:"diesel",sys:"EGR",dtc:["P0400"],sym:["fumée","odeur brûlé"],title:"Refroidisseur EGR — fuite de glycol et couvaison",meca:"Fuite interne de liquide de refroidissement et suies, dépôts incandescents, surchauffe du collecteur.",cons:["Risque de feu","surchauffe"],ind:["Suies humides","collecteur fondu"],fire:true,chain:"Fuite EGR → glycol et suies → couvaison → inflammation collecteur",grav:"critique",url:"https://rappel.conso.gouv.fr/",date:"2026-01-01",powers:[100,120]},
{id:"p4",themes:["technique","incendie"],type:"panne",source:"base-kevin",make:"BMW",model:"Série 1 / Série 3 / X3",engine:"N47 diesel",years:[2007,2018],fuel:"diesel",sys:"Distribution",dtc:["P0016","P0017"],sym:["claquement","bruit anormal"],title:"Chaîne N47 — allongement et casse",meca:"Usure de la chaîne et du tendeur, allongement, saut de dent puis casse.",cons:["Décalage de calage","casse moteur"],ind:["Claquement à froid côté boîte"],fire:true,chain:"Casse de chaîne → casse moteur → huile sur chaud",grav:"critique",url:"",date:"2026-01-01"},
{id:"p5",themes:["technique","incendie"],type:"panne",source:"base-kevin",make:"Peugeot / Citroën / Mini / BMW",model:"308 / 3008 / C4 / Cooper",engine:"1.6 THP",years:[2007,2019],fuel:"essence",sys:"Distribution / Turbo",dtc:["P0016","P0299"],sym:["claquement","perte de puissance","fumée"],title:"Chaîne EP6 et lubrification du turbo",meca:"Allongement de chaîne, tendeur fatigué, alimentation d'huile du turbo insuffisante, grippage.",cons:["Casse turbo","feu de baie"],ind:["Turbo bleui","turbo gras"],fire:true,chain:"Grippage turbo → fuite d'huile sur carter chaud → feu",grav:"critique",url:"",date:"2026-01-01",powers:[150,200]},
{id:"p6",themes:["technique","incendie"],type:"panne",source:"base-kevin",make:"Hyundai / Kia",model:"Sonata / Tucson / Optima / Santa Fe",engine:"Theta II GDi",years:[2011,2019],fuel:"essence",sys:"Bloc moteur",dtc:[],sym:["claquement","perte de puissance","fumée"],title:"Grippage des coussinets de bielle",meca:"Débris d'usinage, lubrification défaillante, grippage, bielle au travers du carter.",cons:["Casse moteur","feu compartiment moteur"],ind:["Carter percé","huile pulvérisée"],fire:true,chain:"Grippage → carter percé → huile sous pression sur échappement → feu",grav:"critique",url:"https://www.nhtsa.gov/recalls",date:"2026-01-01"},
{id:"p7",themes:["technique","incendie"],type:"panne",source:"base-kevin",make:"BMW / Mercedes-Benz / Volkswagen / Audi",model:"6 cylindres diesel",engine:"N57 / OM642 / V6 TDI",years:[2012,2021],fuel:"diesel",sys:"EGR",dtc:["P0400"],sym:["odeur brûlé","fumée"],title:"Refroidisseur EGR fuyard — couvaison",meca:"Fuite de glycol et suies, dépôts incandescents, surchauffe locale, feu du collecteur.",cons:["Feu de baie moteur"],ind:["Suies humides","collecteur fondu"],fire:true,chain:"Fuite EGR → glycol et suies → couvaison → inflammation",grav:"critique",url:"https://www.nhtsa.gov/recalls",date:"2026-01-01"},
{id:"p8",themes:["technique","incendie"],type:"panne",source:"base-kevin",make:"Volkswagen / Audi",model:"Golf / Passat / A4 / Q5",engine:"Alternateur",years:[2017,2022],fuel:"",sys:"Alternateur / B+",dtc:["P0562"],sym:["voyant allumé","odeur brûlé"],title:"Infiltration d'eau dans l'alternateur",meca:"Eau, court-circuit interne, risque de feu et panne du circuit 12V.",cons:["Feu de baie","panne électrique"],ind:["Pistes fondues","traces d'humidité"],fire:true,chain:"Eau dans l'alternateur → court-circuit → feu de baie",grav:"critique",url:"",date:"2026-01-01"},
{id:"p9",themes:["technique","incendie"],type:"panne",source:"base-kevin",make:"Hyundai / Kia",model:"Ioniq 5 / EV6 / Niro",engine:"E-GMP ICCU",years:[2021,2025],fuel:"electrique",sys:"Charge",dtc:[],sym:["voyant allumé","véhicule immobilisé"],title:"ICCU défaillante — charge 12V",meca:"Défaut de l'ICCU, panne 12V et échauffement des composants de puissance.",cons:["Immobilisation","risque thermique"],ind:["Codes P1Axx","batterie 12V à plat"],fire:true,chain:"ICCU → échauffement puissance → risque de feu local",grav:"critique",url:"https://www.nhtsa.gov/recalls",date:"2026-01-01"},
{id:"p10",themes:["technique","incendie"],type:"panne",source:"base-kevin",make:"Ford",model:"Fiesta / Focus / Puma",engine:"1.0 EcoBoost",years:[2012,2023],fuel:"essence",sys:"Distribution / Injection",dtc:[],sym:["perte de puissance","odeur carburant"],title:"Courroie humide et durite de carburant",meca:"Dégradation de la courroie, durite fissurée, fuite en baie, vapeurs.",cons:["Casse moteur","risque de feu"],ind:["Courroie glacée","durite marquée"],fire:true,chain:"Fuite de durite → vapeurs en baie → point chaud → feu",grav:"critique",url:"https://rappel.conso.gouv.fr/",date:"2026-01-01",powers:[95,155]},
{id:"p11",themes:["technique","incendie"],type:"panne",source:"base-kevin",make:"Dacia / Renault",model:"Sandero / Logan / Duster",engine:"GPL",years:[2018,2026],fuel:"essence",sys:"Injection GPL",dtc:[],sym:["odeur carburant"],title:"GPL : multivalve, électrovanne, détendeur",meca:"Fuite de GPL, nappe gazeuse lourde, flash retour.",cons:["Feu","explosion"],ind:["Marques de souffle","givre anormal"],fire:true,chain:"Fuite GPL → nappe → source d'inflammation → flash retour",grav:"critique",url:"https://rappel.conso.gouv.fr/",date:"2026-01-01"},
{id:"p12",themes:["technique"],type:"panne",source:"base-kevin",make:"Volkswagen / Audi / Seat / Skoda",model:"Golf / Polo / Ibiza / Fabia",engine:"DQ200 DSG7",years:[2008,2019],fuel:"",sys:"Boîte de vitesses",dtc:["P0700"],sym:["à-coups boîte","bruit anormal"],title:"Mécatronique DQ200 et embrayage sec",meca:"Surchauffe de l'embrayage sec et défaut de mécatronique.",cons:["Perte de motricité"],ind:["Disques bleuis"],fire:false,chain:"",grav:"eleve",url:"",date:"2026-01-01"},
{id:"p13",themes:["technique"],type:"panne",source:"base-kevin",make:"Multi-marques",model:"Tous",engine:"",years:[2010,2027],fuel:"",sys:"Batterie 12V",dtc:["P0562"],sym:["démarrage difficile","voyant allumé"],title:"Décharge parasite et batterie fatiguée",meca:"Sulfatation, décharge profonde, tension insuffisante pour les calculateurs.",cons:["Immobilisation","défauts multiples"],ind:["Tension de repos basse"],fire:false,chain:"",grav:"eleve",url:"",date:"2026-01-01"},
{id:"p14",themes:["technique","incendie"],type:"panne",source:"base-kevin",make:"Multi-marques diesel",model:"Tous",engine:"",years:[2010,2027],fuel:"diesel",sys:"Lubrification",dtc:[],sym:["bruit anormal","fumée"],title:"Emballement diesel",meca:"Le moteur s'emballe sur sa propre huile, surrégime, surchauffe extrême.",cons:["Bielle percée","piston fondu","feu"],ind:["Bielle percée"],fire:true,chain:"Huile aspirée → emballement → casse → projections sur chaud",grav:"critique",url:"",date:"2026-01-01"},
{id:"p15",themes:["technique","incendie"],type:"panne",source:"base-kevin",make:"BMW / Mercedes-Benz / Volkswagen",model:"Diesels Common Rail",engine:"Pompe HP CP4",years:[2010,2024],fuel:"diesel",sys:"Injection",dtc:[],sym:["perte de puissance","fuite visible"],title:"Pompe haute pression CP4 — rupture",meca:"Rupture interne, limaille dans le circuit et fuite haute pression.",cons:["Circuit hors service","risque de feu"],ind:["Limaille"],fire:true,chain:"Rupture CP4 → fuite gazole HP sur chaud → inflammation",grav:"critique",url:"",date:"2026-01-01"}
];

var ENG = {
"peugeot|208":[["1.2 PureTech",1199,"essence",[75,82,100,110,130]],["1.5 BlueHDi",1499,"diesel",[100]],["e-208 électrique",0,"electrique",[136,156]]],
"peugeot|2008":[["1.2 PureTech",1199,"essence",[100,130,155]],["1.5 BlueHDi",1499,"diesel",[110,130]],["e-2008 électrique",0,"electrique",[136,156]]],
"peugeot|308":[["1.2 PureTech",1199,"essence",[110,130]],["1.5 BlueHDi",1499,"diesel",[130]],["1.6 Hybrid PHEV",1598,"hybride",[180,225]],["e-308 électrique",0,"electrique",[156]]],
"peugeot|3008":[["1.2 PureTech",1199,"essence",[130]],["1.5 BlueHDi",1499,"diesel",[130]],["1.6 BlueHDi",1560,"diesel",[120]],["2.0 BlueHDi",1997,"diesel",[150,180]],["1.6 Hybrid PHEV",1598,"hybride",[180,225,300]],["e-3008 électrique",0,"electrique",[210,230,325]]],
"peugeot|5008":[["1.2 PureTech",1199,"essence",[130]],["1.5 BlueHDi",1499,"diesel",[130]],["2.0 BlueHDi",1997,"diesel",[150,180]],["1.6 Hybrid PHEV",1598,"hybride",[180,225]]],
"peugeot|508":[["1.6 PureTech",1598,"essence",[180,225]],["1.5 BlueHDi",1499,"diesel",[130]],["2.0 BlueHDi",1997,"diesel",[180]]],
"citroen|c3":[["1.2 PureTech",1199,"essence",[82,100,110]],["1.5 BlueHDi",1499,"diesel",[100]],["e-C3 électrique",0,"electrique",[113]]],
"citroen|c4":[["1.2 PureTech",1199,"essence",[100,130,155]],["1.5 BlueHDi",1499,"diesel",[110,130]],["e-C4 électrique",0,"electrique",[136,156]]],
"citroen|c5 aircross":[["1.2 PureTech",1199,"essence",[130]],["1.5 BlueHDi",1499,"diesel",[130]],["1.6 Hybrid",1598,"hybride",[180,225]]],
"renault|clio":[["1.0 SCe",999,"essence",[65,75]],["1.0 TCe",999,"essence",[90,100,110]],["1.3 TCe",1332,"essence",[130,140]],["1.5 Blue dCi",1461,"diesel",[85,100,115]],["E-Tech Hybride",1598,"hybride",[140,145]]],
"renault|captur":[["1.0 TCe",999,"essence",[90,100,110]],["1.3 TCe",1332,"essence",[130,140,150]],["1.5 Blue dCi",1461,"diesel",[95,115]],["E-Tech Hybride",1598,"hybride",[145,160]]],
"renault|megane":[["1.3 TCe",1332,"essence",[140,160]],["1.5 Blue dCi",1461,"diesel",[115]],["E-Tech électrique",0,"electrique",[130,220]]],
"renault|scenic":[["1.3 TCe",1332,"essence",[140,160]],["1.5 Blue dCi",1461,"diesel",[110,115]],["E-Tech électrique",0,"electrique",[170,220]]],
"renault|austral":[["1.2 E-Tech Hybride",1199,"hybride",[130,160,200]],["1.3 TCe",1332,"essence",[140,160]]],
"dacia|duster":[["1.0 TCe",999,"essence",[90,100,110]],["1.3 TCe",1332,"essence",[130,150]],["1.5 Blue dCi",1461,"diesel",[95,115]],["Hybride 140",1598,"hybride",[140]]],
"dacia|sandero":[["1.0 SCe",999,"essence",[65,75]],["1.0 TCe",999,"essence",[90,100,110]]],
"dacia|spring":[["Electric 45",0,"electrique",[45]],["Electric 65",0,"electrique",[65]]],
"skoda|elroq":[["Elroq 50 électrique",0,"electrique",[170]],["Elroq 60 électrique",0,"electrique",[204]],["Elroq 85 électrique",0,"electrique",[286]],["Elroq RS électrique",0,"electrique",[340]]],
"skoda|enyaq":[["Enyaq 60 électrique",0,"electrique",[204]],["Enyaq 85 électrique",0,"electrique",[286]],["Enyaq RS électrique",0,"electrique",[340]]],
"skoda|octavia":[["1.0 TSI",999,"essence",[110]],["1.5 TSI",1498,"essence",[130,150]],["2.0 TSI",1984,"essence",[190,204,245]],["2.0 TDI",1968,"diesel",[115,150,200]]],
"skoda|fabia":[["1.0 MPI",999,"essence",[75,80]],["1.0 TSI",999,"essence",[95,110]],["1.5 TSI",1498,"essence",[150]]],
"skoda|karoq":[["1.0 TSI",999,"essence",[110,115]],["1.5 TSI",1498,"essence",[150]],["2.0 TDI",1968,"diesel",[115,150]]],
"skoda|kodiaq":[["1.5 TSI",1498,"essence",[150]],["2.0 TSI",1984,"essence",[190,245]],["2.0 TDI",1968,"diesel",[150,190,200]]],
"volkswagen|golf":[["1.0 TSI",999,"essence",[95,110,115]],["1.5 TSI",1498,"essence",[130,150]],["2.0 TSI GTI",1984,"essence",[245,300]],["2.0 TDI",1968,"diesel",[115,150,200]],["1.4 eHybrid",1395,"hybride",[204,245]]],
"volkswagen|polo":[["1.0 MPI",999,"essence",[80]],["1.0 TSI",999,"essence",[95,110]],["2.0 TSI GTI",1984,"essence",[207]]],
"volkswagen|tiguan":[["1.5 TSI",1498,"essence",[130,150]],["2.0 TSI",1984,"essence",[190,245]],["2.0 TDI",1968,"diesel",[150,190,200]]],
"volkswagen|passat":[["1.5 TSI",1498,"essence",[150]],["2.0 TDI",1968,"diesel",[150,190,200]]],
"volkswagen|t roc":[["1.0 TSI",999,"essence",[110,115]],["1.5 TSI",1498,"essence",[150]],["2.0 TDI",1968,"diesel",[115,150]]],
"volkswagen|id 3":[["Pro électrique",0,"electrique",[204]],["GTX électrique",0,"electrique",[326]]],
"volkswagen|id 4":[["Pro électrique",0,"electrique",[204]],["GTX électrique",0,"electrique",[340]]],
"audi|a3":[["1.0 30 TFSI",999,"essence",[110]],["1.5 35 TFSI",1498,"essence",[150]],["2.0 35 TDI",1968,"diesel",[150]]],
"audi|a4":[["2.0 40 TFSI",1984,"essence",[190,204]],["2.0 35 TDI",1968,"diesel",[163]],["2.0 40 TDI",1968,"diesel",[190,204]]],
"audi|q5":[["2.0 40 TFSI",1984,"essence",[204]],["2.0 40 TDI",1968,"diesel",[204]]],
"bmw|serie 1":[["1.5 118i",1499,"essence",[136,140]],["2.0 120i",1998,"essence",[178]],["2.0 118d",1995,"diesel",[150]]],
"bmw|serie 3":[["2.0 320i",1998,"essence",[184]],["2.0 330i",1998,"essence",[245,258]],["2.0 320d",1995,"diesel",[190]],["3.0 330d",2993,"diesel",[286]],["2.0 330e PHEV",1998,"hybride",[292]]],
"bmw|x1":[["1.5 18i",1499,"essence",[136]],["2.0 20i",1998,"essence",[192,204]],["2.0 18d",1995,"diesel",[150]]],
"bmw|i4":[["eDrive40 électrique",0,"electrique",[340]],["M50 électrique",0,"electrique",[544]]],
"mercedes benz|classe a":[["1.3 A180",1332,"essence",[136]],["1.3 A200",1332,"essence",[163]],["2.0 A180d",1950,"diesel",[116]],["2.0 A220d",1950,"diesel",[190]]],
"mercedes benz|classe c":[["1.5 C180",1496,"essence",[170]],["2.0 C200",1999,"essence",[204]],["2.0 C220d",1993,"diesel",[194]],["2.0 C300e PHEV",1999,"hybride",[313]]],
"mercedes benz|gla":[["1.3 GLA180",1332,"essence",[136]],["1.3 GLA200",1332,"essence",[163]],["2.0 GLA220d",1950,"diesel",[190]]],
"toyota|yaris":[["1.0 VVT-i",998,"essence",[72]],["1.5 Hybride",1490,"hybride",[116,130]]],
"toyota|corolla":[["1.8 Hybride",1798,"hybride",[140]],["2.0 Hybride",1987,"hybride",[180,196]]],
"toyota|c hr":[["1.8 Hybride",1798,"hybride",[122,140]],["2.0 Hybride",1987,"hybride",[180,198]]],
"toyota|rav4":[["2.5 Hybride",2487,"hybride",[218,222]],["2.5 PHEV",2487,"hybride",[306]]],
"nissan|qashqai":[["1.3 DIG-T",1332,"essence",[140,158]],["1.5 e-Power",1497,"hybride",[190]]],
"nissan|leaf":[["40 kWh électrique",0,"electrique",[150]],["62 kWh électrique",0,"electrique",[217]]],
"ford|fiesta":[["1.1 Ti-VCT",1084,"essence",[75,85]],["1.0 EcoBoost",999,"essence",[95,100,125,140,155]],["1.5 EcoBlue",1499,"diesel",[85,95]]],
"ford|focus":[["1.0 EcoBoost",999,"essence",[100,125,155]],["1.5 EcoBlue",1499,"diesel",[95,120]],["2.0 EcoBlue",1997,"diesel",[150]]],
"ford|puma":[["1.0 EcoBoost",999,"essence",[95,125,155,170]]],
"ford|kuga":[["1.5 EcoBoost",1499,"essence",[120,150]],["2.0 EcoBlue",1997,"diesel",[150,190]],["2.5 Hybride",2488,"hybride",[190,225]]],
"opel|corsa":[["1.2 Turbo",1199,"essence",[75,100,130]],["1.5 Diesel",1499,"diesel",[100,110]],["Corsa-e électrique",0,"electrique",[136,156]]],
"opel|mokka":[["1.2 Turbo",1199,"essence",[100,130]],["1.5 Diesel",1499,"diesel",[110]],["Mokka-e électrique",0,"electrique",[136,156]]],
"hyundai|tucson":[["1.6 T-GDi",1598,"essence",[150,180]],["1.6 CRDi",1598,"diesel",[115,136]],["1.6 Hybride",1598,"hybride",[230]]],
"hyundai|ioniq 5":[["58 kWh électrique",0,"electrique",[170]],["77 kWh électrique",0,"electrique",[229]],["AWD électrique",0,"electrique",[325]]],
"kia|ceed":[["1.0 T-GDi",998,"essence",[100,120]],["1.5 T-GDi",1482,"essence",[160]],["1.6 CRDi",1598,"diesel",[115,136]]],
"kia|sportage":[["1.6 T-GDi",1598,"essence",[150,180]],["1.6 CRDi",1598,"diesel",[115,136]],["1.6 Hybride",1598,"hybride",[230]]],
"kia|ev6":[["58 kWh électrique",0,"electrique",[170]],["77 kWh électrique",0,"electrique",[229]],["GT électrique",0,"electrique",[609]]],
"tesla|model 3":[["Propulsion électrique",0,"electrique",[283]],["Long Range électrique",0,"electrique",[498]]],
"tesla|model y":[["Propulsion électrique",0,"electrique",[299]],["Long Range électrique",0,"electrique",[514]]],
"volvo|xc40":[["1.5 T3",1477,"essence",[163]],["2.0 B4",1969,"hybride",[197]],["Recharge électrique",0,"electrique",[238,408]]],
"volvo|xc60":[["2.0 B4",1969,"hybride",[197]],["2.0 B5",1969,"hybride",[250]],["2.0 T8 PHEV",1969,"hybride",[455]]],
"fiat|500":[["1.0 Hybrid",999,"hybride",[70]],["500e électrique",0,"electrique",[95,118]]],
"mg|mg4":[["Standard électrique",0,"electrique",[170]],["Comfort électrique",0,"electrique",[204]],["XPower électrique",0,"electrique",[435]]]
};

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

var LEGAL = [
{id:"vice",t:"Vice caché",pro:false,mots:["vice","cache","panne","defaut","achat","occasion","moteur"],r:"Un défaut caché, grave et antérieur à la vente peut relever de la garantie des vices cachés.",rep:["Code civil, articles 1641, 1644 et 1648.","Établir le défaut, sa gravité, son caractère caché et son antériorité.","Action dans les deux ans de la découverte du vice.","Restitution du prix ou réduction."],dem:["Signaler le défaut au vendeur par écrit.","Diagnostic puis expertise contradictoire avant dépose."],pr:["Annonce et contrat de vente","Date de découverte et kilométrage","Historique d'entretien et pièces"],src:"https://www.service-public.fr/particuliers/vosdroits/F11007"},
{id:"conf",t:"Garantie légale de conformité",pro:true,mots:["garantie","conformite","panne","achat","occasion","neuf","vendeur"],r:"Réservée à l'achat auprès d'un vendeur professionnel.",rep:["Code de la consommation L. 217-3 et suivants.","Présomption 24 mois neuf, 12 mois occasion.","Réparation ou remplacement sans frais sous 30 jours.","Réduction du prix ou résolution."],dem:["Demande écrite au vendeur avec justificatifs.","Conserver date de demande et immobilisation."],pr:["Facture et date de délivrance","Caractéristiques annoncées","Demande de mise en conformité"],src:"https://www.service-public.fr/particuliers/vosdroits/F11094"},
{id:"dol",t:"Dol et dissimulation",pro:false,mots:["dol","mensonge","dissimulation","tromperie","compteur","kilometrage","accident"],r:"Manœuvres ou dissimulation intentionnelle d'une information déterminante.",rep:["Code civil article 1137 : intention et caractère déterminant.","Une panne seule ne prouve pas un dol.","Article 1144 : nullité à compter de la découverte."],dem:["Comparer annonce et historique documenté.","Faire examiner avant demande d'annulation."],pr:["Annonce, messages, déclarations","Contrôles techniques et historique km"],src:"https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036829827"},
{id:"garage",t:"Garage et malfaçons",pro:false,mots:["garage","garagiste","reparation","malfacon","facture","intervention","atelier"],r:"Une réparation défectueuse peut engager la responsabilité du garage.",rep:["Obligation de résultat, pas responsabilité automatique.","Mission, défaut, lien et preuves à examiner.","Devis, ordre de réparation et facture délimitent les travaux."],dem:["Explication écrite et proposition de reprise.","Constat contradictoire avant nouvelle réparation.","Médiation après réclamation infructueuse."],pr:["Ordre de réparation, devis, facture","Symptômes avant et après","Diagnostic indépendant"],src:"https://www.economie.gouv.fr/dgccrf/consommation/Resoudre-un-litige-de-consommation"},
{id:"produit",t:"Incendie et produit défectueux",pro:false,sec:true,mots:["incendie","feu","flamme","brule","sinistre","assurance","expert","expertise"],r:"Un incendie lié à un défaut peut engager la responsabilité du producteur.",rep:["Code civil articles 1245 et suivants : défaut de sécurité.","Défaut et lien de causalité à établir.","Assurance : déclaration sous cinq jours ouvrés.","Ne pas déplacer ni réparer avant constat."],dem:["Sécuriser et photographier l'état initial.","Déclarer et demander une expertise contradictoire.","Préserver véhicule et pièces.","Mettre en cause le producteur si défaut documenté."],pr:["Photos avant déplacement","Rapport pompiers","Factures et campagnes VIN","Pièces préservées"],src:"https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006070721/LEGISCTA000006136279/"},
{id:"rappel",t:"Rappel et campagne de sécurité",pro:false,mots:["rappel","campagne","securite","constructeur","vin","concession"],r:"Une campagne corrige un défaut de sécurité connu.",rep:["Code de la consommation L. 412-1 et R. 412-1.","Vérifier applicabilité au VIN et exécution.","Campagne non exécutée : défaut connu."],dem:["Relever le VIN et interroger le constructeur.","Demander l'exécution gratuite.","Croiser RappelConso, Safety Gate, NHTSA."],pr:["VIN et réponse constructeur","Numéro de campagne et preuve","Historique d'entretien"],src:"https://rappel.conso.gouv.fr/"}
];

var SYMPT = ["voyant allumé","perte de puissance","à-coups moteur","à-coups boîte","bruit anormal","claquement","fumée","odeur carburant","odeur brûlé","surchauffe","fuite visible","démarrage difficile","incendie","véhicule immobilisé","après entretien","après choc","après immersion"];
var PWD = "Kevin83600";
var ICON = { essence: "🟡", diesel: "⚫", hybride: "🟢", electrique: "🔵" };

var SITES = [
  { id: "diagauto", name: "DiagAuto Pro", url: "https://expertkevin06-cell.github.io/diagauto-pro/" },
  { id: "autodiag", name: "Auto Diagnostic", url: "https://expertkevin06-cell.github.io/auto-diagnostic/" }
];
var PROBES = ["data/index.json","data/base.json","data/seed.json","data/catalogue.json","data/pannes.json","data/vehicules.json","data/db.json","data/fiches.json","data/export.json","asset-manifest.json","catalogue.json","base.json","pannes.json","vehicules.json"];

/* ══════════ ÉTAT ══════════ */
var S = {
  base: [], photos: {}, theme: "tous", admin: false,
  name: save("name") || "",
  ov: save("ov") || { entries: [], photos: [] },
  look: save("look") || { op: 55 },
  revs: save("revs") || [],
  pend: [], sel: {}, editId: null,
  mail: save("mail") || "contact@kev-tech-fire.fr",
  be: save("be") || "kvdb",
  checks: {}, carImg: null, busy: false, importing: false, report: null, vin: null
};

var BRANDS = [], MODELS = {};
(function () {
  var seen = {}, k, p;
  for (k in ENG) {
    if (!ENG.hasOwnProperty(k)) continue;
    p = k.split("|");
    if (!seen[p[0]]) { seen[p[0]] = 1; BRANDS.push(p[0]); }
    if (!MODELS[p[0]]) MODELS[p[0]] = [];
    MODELS[p[0]].push(p[1]);
  }
})();

function reindex() {
  each(S.base, function (e) {
    e._h = nrm([e.make, e.model, e.engine, e.sys, e.title, e.meca, (e.cons || []).join(" "), (e.sym || []).join(" "), (e.dtc || []).join(" ")].join(" "));
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
  each(S.ov.photos, function (p) { if (!S.photos[p.fault]) S.photos[p.fault] = []; S.photos[p.fault].push(p); });
}
function persist() { save("ov", S.ov); rebuild(); }
function normList(list) {
  var o = [], i, e;
  if (!list) return o;
  for (i = 0; i < list.length; i++) {
    e = list[i]; if (!e) continue;
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
function stats() {
  var np = 0, k;
  for (k in S.photos) if (S.photos.hasOwnProperty(k)) np += S.photos[k].length;
  $("pBase").innerHTML = H("🗄️ ", S.base.length, " · ", np, "📷");
  $("stats").innerHTML = H(S.base.length, " fiches · ", Object.keys(ENG).length, " modèles · ", np, " photos · ", S.ov.entries.length, " ajouts admin");
}
function chk(k, lv, d) { S.checks[k] = { lv: lv, d: d }; paintChk(); }
function paintChk() {
  var order = [["boot","Ouverture"],["events","Contrôles"],["seed","Base embarquée"],["cache","Cache local"],["sites","Import 2 sites"],["repo","Base dépôt"],["sync","Canal sync"],["sw","Service Worker"],["net","Réseau"],["store","Stockage"]];
  var h = "", i, k, s, ok = 0, bad = 0, warn = 0, tot = 0, p;
  for (i = 0; i < order.length; i++) {
    k = order[i][0]; if (!S.checks[k]) continue;
    s = S.checks[k]; tot++;
    if (s.lv === "ok") ok++; else if (s.lv === "bad") bad++; else warn++;
    h = H(h, "<div class='sc ", s.lv, "'><span>", s.lv === "ok" ? "✅" : s.lv === "warn" ? "⚠️" : "❌", "</span><div><b>", esc(order[i][1]), "</b><small>", esc(s.d), "</small></div></div>");
  }
  $("checks").innerHTML = h; $("dBox").innerHTML = h;
  $("pHealth").innerHTML = H("🩺 ", ok, "/", tot);
  $("pHealth").className = H("pill ", bad ? "bad" : warn ? "warn" : "ok");
  p = tot ? Math.round(ok / tot * 100) : 0;
  $("prog").style.width = H(p, "%"); $("dProg").style.width = H(p, "%");
}

/* ══════════ MOTEURS ══════════ */
function fuelOf(m) {
  var t = nrm(m);
  if (/electrique|electric|kwh|elroq|enyaq|ioniq|recharge|spring|mg4|e 208|e 2008|e 3008|e 308|id 3|id 4|ev6|model 3|model y|i4|500e|leaf|corsa e|mokka e/.test(t)) return "electrique";
  if (/hybrid|hybride|phev|hev|e tech|etech|gte|t8|e power|b4|b5|iv/.test(t)) return "hybride";
  if (/diesel|tdi|hdi|dci|crdi|cdti|multijet|bluehdi|ecoblue/.test(t)) return "diesel";
  return "essence";
}
function enginesFor(mk, mo) {
  var k = H(nrm(mk), "|", nrm(mo)), src = ENG[k], doc = !!src, i, kk, p, o = [];
  if (!src && nrm(mo)) {
    for (kk in ENG) {
      if (!ENG.hasOwnProperty(kk)) continue;
      p = kk.split("|");
      if (p[0] === nrm(mk) && (nrm(mo).indexOf(p[1]) === 0 || p[1].indexOf(nrm(mo)) === 0)) { src = ENG[kk]; doc = true; break; }
    }
  }
  if (!src) src = POOL[nrm(mk)] || [];
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
  if (!mk || !mo) { $("nEng").innerHTML = "0"; w.innerHTML = "<span class='wait'>Sélectionne marque + modèle.</span>"; return; }
  l = enginesFor(mk, mo); $("nEng").innerHTML = String(l.length); w._l = l;
  for (i = 0; i < l.length; i++) {
    e = l[i];
    h = H(h, "<button data-act='pickEng' data-e='", i, "'>", ICON[e.en] || "", " ", esc(e.m), " · ", e.en, " · ", e.ch.join("/"), " ch", e.cc ? H(" · ", e.cc, " cm³") : "", "</button>");
  }
  w.innerHTML = h || "<span class='wait'>Aucune motorisation documentée.</span>";
}
function renderPow() {
  var ps = powersFor($("vMake").value, $("vModel").value, $("vEngine").value), h = "", i;
  $("nPow").innerHTML = String(ps.length);
  for (i = 0; i < ps.length; i++) h = H(h, "<button data-act='pickPow' data-p='", ps[i], "'>", ps[i], " ch</button>");
  $("cPow").innerHTML = h || "<span class='wait'>Choisis une motorisation.</span>";
}
function renderAttrib() {
  var mk = $("vMake").value, mo = $("vModel").value, w = $("attrib"), l, doc = 0, i, e, h;
  if (!mk || !mo) { w.innerHTML = ""; return; }
  l = enginesFor(mk, mo); if (!l.length) { w.innerHTML = ""; return; }
  for (i = 0; i < l.length; i++) if (l[i].src === "documenté") doc++;
  h = H("<h3>🧾 Attribution — ", esc(mk), " ", esc(mo), "</h3><p class='sm'>", doc, "/", l.length, " motorisation(s) documentée(s)</p><table><tr><th>Motorisation</th><th>Énergie</th><th>Cylindrée</th><th>Puissances</th></tr>");
  for (i = 0; i < l.length; i++) {
    e = l[i];
    h = H(h, "<tr><td><b>", esc(e.m), "</b></td><td>", e.en, "</td><td>", e.cc ? H(e.cc, " cm³") : "—", "</td><td>", e.ch.join("/"), " ch</td></tr>");
  }
  w.innerHTML = H(h, "</table>");
}
function autoAttr() {
  var mk = $("vMake").value, mo = $("vModel").value, mt = $("vEngine").value, en, e, ps;
  if (!mt) return;
  en = fuelOf(mt); e = matchEng(mk, mo, mt); ps = e ? e.ch : [];
  $("vFuel").value = en;
  if (ps.length && !has(ps, parseInt($("vPower").value, 10))) $("vPower").value = ps[0];
  renderPow(); renderAttrib();
  toast(H("⚙️ ", esc(mt), " → <b>", en, "</b> · ", $("vPower").value || "?", " ch"));
}

/* ══════════ IMPORT SITES ══════════ */
function absUrl(p, base) { try { return new URL(p, base).href; } catch (e) { return ""; } }
function allowed(u) {
  try { var h = new URL(u).host; return h === location.host || h === "expertkevin06-cell.github.io"; } catch (e) { return false; }
}
function discover(txt, base) {
  var out = [], m, re = /(?:src|href)=["']([^"']+\.(?:js|json)[^"']*)["']/g, re2 = /["'`]([^"'`]+\.(?:js|json))["'`]/g, u;
  while ((m = re.exec(txt))) { u = absUrl(m[1], base); if (u && allowed(u) && !has(out, u)) out.push(u); }
  while ((m = re2.exec(txt))) { u = absUrl(m[1], base); if (u && allowed(u) && !has(out, u)) out.push(u); }
  return out;
}
function scanArrays(txt, cb) {
  var lim = Math.min(txt.length, 4000000), i, j, depth, str, escp, ch, raw, v, n = 0, nx;
  for (i = 0; i < lim - 1; i++) {
    if (txt[i] !== "[") continue;
    nx = txt[i + 1];
    if (nx !== "{" && nx !== '"' && nx !== "[") continue;
    depth = 0; str = false; escp = false;
    for (j = i; j < lim; j++) {
      ch = txt[j];
      if (str) { if (escp) escp = false; else if (ch === "\\") escp = true; else if (ch === '"') str = false; }
      else {
        if (ch === '"') str = true;
        else if (ch === "[" || ch === "{") depth++;
        else if (ch === "]" || ch === "}") {
          depth--;
          if (depth === 0) {
            raw = txt.slice(i, j + 1);
            if (raw.length > 40) { try { v = JSON.parse(raw); if (isArr(v)) { cb(v); n++; } } catch (e) {} }
            break;
          }
        }
      }
    }
    if (n > 400) return;
  }
}
function parseYears(v) {
  var a = [], i, m;
  if (isArr(v)) { for (i = 0; i < v.length; i++) { var n = parseInt(v[i], 10); if (n >= 1950 && n <= 2035) a.push(n); } }
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
  var title = o.defaut || o.titre || o.title || o.panne || o.libelle || o.nom || o.summary || "";
  var meca = o.mecanisme || o.meca || o.cause || o.description || o.summary || o.motif_rappel || "";
  var cons = lines(o.consequences || o.cons || o.risques_encourus || []);
  var sym = lines(o.symptomes || o.sym || o.symptoms || []);
  var sys = o.systeme || o.sys || o.organe || o.component || "";
  var dtc = o.dtc || o.codes || [];
  var raw = "";
  try { raw = JSON.stringify(o); } catch (e) {}
  var fire = o.risque_feu === true || o.fire === true || /incendie|feu|flamme|inflamm/i.test(raw);
  if (!title || (!meca && !cons.length && !sys && !dtc.length && !fire)) return null;
  if (isArr(dtc)) dtc = uniq(dtc); else dtc = String(dtc).toUpperCase().match(/[PCBU]\d{4}/g) || [];
  return {
    id: o.id || H("imp-", hash(H(source, title, o.marque || o.make || "", o.modele || o.model || ""))),
    themes: fire ? ["technique", "incendie"] : ["technique"],
    type: o.type || (o.campagne || o.numero_fiche ? "rappel" : "panne"),
    source: source, make: o.marque || o.make || o.brand || "Multi-marques",
    model: o.modele || o.model || "Tous", engine: o.motorisation || o.engine || o.moteur || "",
    years: parseYears(o.annees || o.years || o.annee), fuel: o.energie || o.fuel || fuelOf(o.motorisation || o.engine || ""),
    sys: sys, dtc: dtc, sym: sym, title: String(title).slice(0, 300), meca: String(meca),
    cons: cons, ind: lines(o.indices || o.ind || o.preuves || []), fire: fire,
    chain: o.chaine_feu || o.chain || (fire ? "Défaut documenté → mécanisme à expertiser → risque incendie" : ""),
    grav: o.gravite || o.grav || (fire ? "critique" : "eleve"),
    url: o.url || o.source_url || o.lien || "", date: String(o.date || o.date_publication || "").slice(0, 10),
    powers: parsePowers(o.puissance_ch || o.powers || o.puissance)
  };
}
function mapVehicle(o) {
  var make = o.marque || o.make || o.brand || "";
  var model = o.modele || o.model || "";
  var engine = o.motorisation || o.engine || o.moteur || o.version || "";
  var powers = parsePowers(o.puissance_ch || o.powers || o.puissance || o.ch);
  var fuel = o.energie || o.fuel || "";
  if (!make || !model || (!engine && !powers.length && !fuel)) return null;
  return { make: make, model: model, engine: engine, cc: parseCC(o.cylindree || o.cc || engine), fuel: fuel || fuelOf(engine), powers: powers };
}
function addCatalog(make, model, engine, cc, fuel, powers) {
  var b = nrm(make), m = nrm(model), k, arr, i, found = false, name;
  if (!b || !m) return;
  k = H(b, "|", m);
  if (!ENG[k]) ENG[k] = [];
  arr = ENG[k];
  name = engine || (powers && powers.length ? "Version" : "");
  if (!name) return;
  for (i = 0; i < arr.length; i++) {
    if (nrm(arr[i][0]) === nrm(name)) {
      found = true;
      if (powers && powers.length) arr[i][3] = uniq(arr[i][3].concat(powers));
      if (cc && !arr[i][1]) arr[i][1] = cc;
      break;
    }
  }
  if (!found) arr.push([name, cc || parseCC(name), fuel || fuelOf(name), powers || []]);
  if (!MODELS[b]) MODELS[b] = [];
  if (!has(MODELS[b], m)) MODELS[b].push(m);
  if (!has(BRANDS, b)) BRANDS.push(b);
}
function absorbCatalog(rows) { each(rows, function (r) { addCatalog(r.make, r.model, r.engine, r.cc, r.fuel, r.powers); }); }
function ingestAny(node, key, depth, acc, source) {
  var k, f, v, allStr, i;
  if (depth > 6 || node === null || node === undefined) return;
  if (isArr(node)) {
    allStr = node.length > 0;
    for (i = 0; i < node.length; i++) if (typeof node[i] !== "string") { allStr = false; break; }
    if (allStr) {
      k = nrm(key);
      if (/marque|brand|make/.test(k)) { for (i = 0; i < node.length; i++) { var b = nrm(node[i]); if (b && !has(BRANDS, b)) BRANDS.push(b); } }
      return;
    }
    for (i = 0; i < node.length; i++) ingestAny(node[i], key, depth + 1, acc, source);
    return;
  }
  if (typeof node !== "object") return;
  f = mapFault(node, source); if (f) acc.faults.push(f);
  v = mapVehicle(node); if (v) acc.rows.push(v);
  for (k in node) {
    if (!node.hasOwnProperty(k)) continue;
    if (node[k] && typeof node[k] === "object") ingestAny(node[k], k, depth + 1, acc, source);
  }
}
function impState(m) { var e = $("importState"); if (e) e.innerHTML = m; }
function loadLocalImport() {
  var f = save("siteFaults"), r = save("siteRows"), st = save("siteStats"), msg;
  if (f && f.length) merge(normList(f));
  if (r && r.length) absorbCatalog(r);
  if (st) {
    msg = "Dernier import : ";
    each(SITES, function (s) { msg = H(msg, s.name, " ", st[s.id] && st[s.id].ok ? "✅" : "⚠️", " · "); });
    impState(msg);
    chk("sites", "ok", "bases importées sauvegardées en local");
  } else chk("sites", "warn", "aucun import local — sera fait au 1er lancement en ligne");
}
function importSites(manual, cb) {
  var acc = { faults: [], rows: [], stats: {} }, si = 0, before;
  if (S.importing) { if (cb) cb(); return; }
  S.importing = true;
  impState("⏳ Import des 2 sites en cours…");
  function nextSite() {
    var site, urls, probes, pi, ai, bytes, blobs;
    if (si >= SITES.length) { finish(); return; }
    site = SITES[si]; si++;
    impState(H("⏳ ", site.name, "…"));
    fetchText(site.url, 9000, function (err, html) {
      if (err || !html) { acc.stats[site.id] = { ok: false, error: err || "vide" }; nextSite(); return; }
      blobs = [html];
      urls = discover(html, site.url);
      probes = PROBES.slice(0);
      pi = 0; ai = 0; bytes = html.length;
      function nextProbe() {
        var p, u;
        if (pi >= probes.length) { nextAsset(); return; }
        p = probes[pi]; pi++;
        u = absUrl(p, site.url);
        fetchText(u, 6000, function (e2, t) {
          if (!e2 && t && /^[\s]*[{\[]/.test(t)) blobs.push(t);
          nextProbe();
        });
      }
      function nextAsset() {
        var u;
        if (ai >= urls.length || ai >= 24 || bytes > 8000000) { process(); return; }
        u = urls[ai]; ai++;
        fetchText(u, 9000, function (e3, t) {
          if (!e3 && t) {
            blobs.push(t); bytes += t.length;
            each(discover(t, u), function (m) { if (!has(urls, m) && urls.length < 60) urls.push(m); });
          }
          nextAsset();
        });
      }
      function process() {
        var bi = 0;
        function nextBlob() {
          var b, parsed;
          if (bi >= blobs.length) { acc.stats[site.id] = { ok: true }; nextSite(); return; }
          b = blobs[bi]; bi++;
          parsed = null;
          try { parsed = JSON.parse(b); } catch (e) {}
          if (parsed) ingestAny(parsed, "", 0, acc, site.id);
          scanArrays(b, function (arr) { ingestAny(arr, "", 0, acc, site.id); });
          setTimeout(nextBlob, 0);
        }
        nextBlob();
      }
      nextProbe();
    });
  }
  function finish() {
    before = S.base.length;
    merge(acc.faults);
    absorbCatalog(acc.rows);
    saveBig("siteFaults", acc.faults);
    saveBig("siteRows", acc.rows);
    save("siteDone", Date.now());
    save("siteStats", acc.stats);
    save("cache", { ts: Date.now(), entries: S.base.slice(0, 2000) });
    fillFilters(); renderResults(); renderEng(); renderPow(); stats();
    S.importing = false;
    impState(H("✅ Import terminé : +", S.base.length - before, " fiches · ", acc.rows.length, " véhicules catalogués."));
    chk("sites", "ok", H("+", S.base.length - before, " fiches · ", acc.rows.length, " véhicules"));
    toast(H("🌐 Import sites : +", S.base.length - before, " fiches · ", acc.rows.length, " véhicules"));
    if (cb) cb();
  }
  nextSite();
}

/* ══════════ RECHERCHE ══════════ */
function gravRank(e) { return e.grav === "critique" ? 3 : e.grav === "eleve" ? 2 : 1; }
function search(q, lim) {
  var t = nrm(q).split(" "), toks = [], i, j, pool = [], out = [], e, s, mode, res = [];
  for (i = 0; i < t.length; i++) if (t[i]) toks.push(t[i]);
  for (i = 0; i < S.base.length; i++) {
    e = S.base[i];
    if (S.theme !== "tous" && !has(e.themes || [], S.theme)) continue;
    if ($("fMake").value && nrm(e.make).indexOf(nrm($("fMake").value)) < 0) continue;
    if ($("fSys").value && nrm(e.sys) !== nrm($("fSys").value)) continue;
    if ($("fGrav").value && e.grav !== $("fGrav").value) continue;
    pool.push(e);
  }
  mode = $("fSort").value;
  if (!toks.length) {
    if (mode === "grav") pool.sort(function (x, y) { return gravRank(y) - gravRank(x); });
    else if (mode === "az") pool.sort(function (x, y) { return String(x.title).localeCompare(String(y.title)); });
    return pool.slice(0, lim || 30);
  }
  for (i = 0; i < pool.length; i++) {
    s = 0;
    for (j = 0; j < toks.length; j++) {
      if (nrm(pool[i].title).indexOf(toks[j]) >= 0) s += 3;
      else if (pool[i]._h && pool[i]._h.indexOf(toks[j]) >= 0) s += 2;
    }
    if (s > 0) out.push([s, pool[i]]);
  }
  out.sort(function (x, y) { return y[0] - x[0]; });
  if (mode === "grav") out.sort(function (x, y) { return gravRank(y[1]) - gravRank(x[1]); });
  else if (mode === "az") out.sort(function (x, y) { return String(x[1].title).localeCompare(String(y[1].title)); });
  for (i = 0; i < Math.min(out.length, lim || 40); i++) res.push(out[i][1]);
  return res;
}
function vehicles(q) {
  var t = nrm(q).split(" "), toks = [], o = [], i, j, k, p, hh, s, res = [];
  for (i = 0; i < t.length; i++) if (t[i]) toks.push(t[i]);
  if (!toks.length) return o;
  for (k in ENG) {
    if (!ENG.hasOwnProperty(k)) continue;
    p = k.split("|"); hh = H(p[0], " ", p[1]); s = 0;
    for (j = 0; j < toks.length; j++) {
      if (has(p[0].split(" "), toks[j])) s += 5;
      else if (has(p[1].split(" "), toks[j])) s += 5;
      else if (hh.indexOf(toks[j]) >= 0) s += 2;
    }
    if (s >= 5) o.push([s, { make: tc(p[0]), model: tc(p[1]), eng: enginesFor(p[0], p[1]) }]);
  }
  o.sort(function (x, y) { return y[0] - x[0]; });
  for (i = 0; i < Math.min(o.length, 6); i++) res.push(o[i][1]);
  return res;
}
function card(e) {
  var k = fkey(e), h;
  h = H("<div class='hit ", e.fire ? "fire" : "", "'><b class='t' data-act='detail' data-k='", esc(k), "'>", esc(e.title), "</b>");
  h = H(h, "<div class='meta'>", esc(e.make), " · ", esc(e.model), " ", esc(e.engine), e.years ? H(" · ", e.years[0], "-", e.years[1]) : "", "</div><div>");
  if (has(e.themes || [], "incendie")) h = H(h, "<span class='tag fire'>🔥 incendie</span>");
  h = H(h, "<span class='tag'>", esc(e.sys || "général"), "</span>");
  if (e.grav === "critique") h = H(h, "<span class='tag crit'>critique</span>");
  each(e.dtc || [], function (d) { h = H(h, "<span class='tag'>", esc(d), "</span>"); });
  h = H(h, "<span class='tag ok'>", esc(e.source), "</span></div>");
  if (e.meca) h = H(h, "<p class='sm'><b>Mécanisme :</b> ", esc(e.meca), "</p>");
  if ((e.cons || []).length) h = H(h, "<p class='sm'><b>Conséquences :</b> ", esc(e.cons.join(" ; ")), "</p>");
  if (e.fire && e.chain) h = H(h, "<p class='sm'>🔥 <b>Chaîne :</b> ", esc(e.chain), "</p>");
  if (e.url) h = H(h, "<a class='sm' href='", esc(e.url), "' target='_blank' rel='noopener'>📎 Source officielle</a>");
  return H(h, "</div>");
}
function strip(e) {
  var ph = S.photos[fkey(e)] || [], h, i;
  if (!ph.length) return "";
  h = "<div class='chips'>";
  for (i = 0; i < Math.min(ph.length, 4); i++) h = H(h, "<img class='thumb' data-act='lb' data-id='", esc(ph[i].id), "' src='", esc(ph[i].url), "'>");
  if (ph.length > 4) h = H(h, "<span class='tag'>+", ph.length - 4, "</span>");
  return H(h, "<button data-act='gal' data-k='", esc(fkey(e)), "'>🖼️ Photos (", ph.length, ")</button></div>");
}
function renderResults() {
  var q = trm($("q").value), box = $("results"), f = search(q), v = q ? vehicles(q) : [], h = "", i, j, x, e;
  if (v.length) {
    h = H("<h3>🚗 Véhicules &amp; motorisations (", v.length, ")</h3>");
    for (i = 0; i < v.length; i++) {
      x = v[i];
      h = H(h, "<div class='hit'><b>🚗 ", esc(x.make), " ", esc(x.model), "</b><table><tr><th>Motorisation</th><th>Énergie</th><th>Cylindrée</th><th>Puissances</th></tr>");
      for (j = 0; j < x.eng.length; j++) {
        e = x.eng[j];
        h = H(h, "<tr><td>", esc(e.m), "</td><td>", e.en, "</td><td>", e.cc ? H(e.cc, " cm³") : "—", "</td><td>", e.ch.join("/"), " ch</td></tr>");
      }
      h = H(h, "</table><button class='btn gh sm' data-act='useVeh' data-m='", esc(x.make), "' data-o='", esc(x.model), "'>➕ Utiliser ce véhicule</button></div>");
    }
  }
  h = H(h, "<h3>🔧 Pannes &amp; rappels (", f.length, ")</h3>");
  if (f.length) {
    for (i = 0; i < f.length; i++) h = H(h, "<div>", card(f[i]), strip(f[i]), "<button class='btn gh sm' data-act='webPhotos' data-q='", esc(String(f[i].title).slice(0, 50)), "'>📷 Photos web</button></div>");
  } else h = H(h, "<div class='empty'>Aucun résultat pour cette recherche.</div>");
  box.innerHTML = h; renderViews();
}
function renderViews() {
  var vs = save("views") || [], h = "<button data-act='saveView'>💾 Mémoriser cette vue</button>", i;
  for (i = 0; i < vs.length; i++) h = H(h, "<button data-act='loadView' data-i='", i, "'>📁 ", esc(vs[i].name), "</button>");
  if (vs.length) h = H(h, "<button data-act='clearViews'>🗑️ Vider</button>");
  $("views").innerHTML = h;
}
function fillFilters() {
  var ms = {}, ss = {}, i, m, cm = $("fMake").value, cs = $("fSys").value, a, b;
  var h1 = "<option value=''>Toutes</option>", h2 = "<option value=''>Tous</option>";
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

/* ══════════ EXPERTISE ══════════ */
function veh() {
  return { make: trm($("vMake").value), model: trm($("vModel").value), engine: trm($("vEngine").value),
    power: parseInt($("vPower").value, 10) || 0, year: parseInt($("vYear").value, 10) || 0, fuel: $("vFuel").value };
}
function matchV(e, v) {
  var s = 0, m;
  if (v.make && nrm(e.make).indexOf(nrm(v.make)) >= 0) s += 4;
  else if (v.make && e.make && !/multi/i.test(e.make)) return -1;
  if (v.model) { m = nrm(e.model); if (m && m.indexOf(nrm(v.model)) >= 0) s += 4; else if (m && !/tous|multi/i.test(m)) s -= 2; }
  if (v.engine && nrm(e.engine).indexOf(nrm(v.engine).split(" ")[0]) >= 0) s += 3;
  if (v.year && e.years) s += (v.year >= e.years[0] && v.year <= e.years[1]) ? 3 : -3;
  if (v.power && e.powers && v.power >= e.powers[0] * 0.9 && v.power <= e.powers[1] * 1.1) s += 2;
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
    s = matchV(e, v); if (s < 0) continue;
    s = s * 2; why = [];
    if (s >= 8) why.push("véhicule concordant");
    for (j = 0; j < dtcs.length; j++) if (has(e.dtc || [], dtcs[j])) { s += 8; why.push(H("DTC ", dtcs[j])); }
    for (j = 0; j < syms.length; j++) {
      y = syms[j]; hit = nrm(e.title).indexOf(nrm(y)) >= 0;
      each(e.sym || [], function (x) { if (nrm(x).indexOf(nrm(y)) >= 0) hit = true; });
      if (hit) s += 3;
    }
    for (j = 0; j < toks.length; j++) {
      if (nrm(e.title).indexOf(toks[j]) >= 0) s += 2;
      else if (e._h && e._h.indexOf(toks[j]) >= 0) s += 1;
    }
    if (e.type === "rappel") { s += 5; why.push("campagne officielle"); }
    if (s >= 6) o.push({ e: e, s: s, why: why });
  }
  o.sort(function (x, z) { return z.s - x.s; });
  return o.slice(0, 10);
}
function conf(t) {
  var s = t.s, d = false, c = false, i, lvl, crit;
  for (i = 0; i < t.why.length; i++) {
    if (t.why[i].indexOf("DTC") === 0) d = true;
    if (t.why[i].indexOf("campagne") === 0) c = true;
  }
  if (s >= 20 && d && c) { lvl = "CERTAIN"; crit = "DTC documenté, campagne officielle et véhicule concordant."; }
  else if (s >= 14) { lvl = "PROBABLE"; crit = "Faisceau cohérent ; à confirmer par mesure ou expertise."; }
  else if (s >= 8) { lvl = "POSSIBLE"; crit = "Mécanisme plausible ; preuves partielles à vérifier."; }
  else { lvl = "INDÉTERMINÉ"; crit = "Données insuffisantes ; expertise physique requise."; }
  return { lvl: lvl, crit: crit, pct: Math.max(5, Math.min(95, Math.round(s / 25 * 100))) };
}
function fireBox(v, h) {
  var sp = [], doc = [], i, e, rap = false, txt, s;
  for (i = 0; i < h.length; i++) if (h[i].e.fire) sp.push(h[i].e);
  for (i = 0; i < S.base.length && doc.length < 5; i++) {
    e = S.base[i];
    if (e.fire && /multi/i.test(e.make) && (!v.fuel || !e.fuel || e.fuel === v.fuel)) doc.push(e);
  }
  for (i = 0; i < sp.length; i++) if (sp[i].type === "rappel") rap = true;
  txt = rap ? "ÉLEVÉ — rappel incendie concordant" : sp.length ? "MODÉRÉ — chaînes documentées" : "GÉNÉRIQUE — doctrine applicable";
  s = H("<div class='fbox'><h3>🔥 Analyse incendie — ", esc(v.make), " ", esc(v.model), "</h3><p><span class='lvl'>", txt, "</span></p>");
  for (i = 0; i < Math.min(sp.length, 5); i++) s = H(s, "<div class='hit fire'><b>", esc(sp[i].title), "</b><p class='sm'>⛓️ ", esc(sp[i].chain || sp[i].meca), "</p></div>");
  if (doc.length) {
    s = H(s, "<details><summary class='sm'>Doctrine applicable à cette énergie (", doc.length, ")</summary>");
    for (i = 0; i < doc.length; i++) s = H(s, "<div class='hit fire'><b>", esc(doc[i].title), "</b><p class='sm'>", esc(doc[i].meca), "</p></div>");
    s = H(s, "</details>");
  }
  return H(s, "<p class='sm'>Niveau fondé sur les données documentées. Ne préjuge pas de l'origine réelle : expertise physique indispensable. En cas de doute, ne pas rouler ni recharger un véhicule électrique.</p></div>");
}
function legalMatch(c, seller) {
  var n = nrm(c), o = [], i, j, f, s, res = [];
  for (i = 0; i < LEGAL.length; i++) {
    f = LEGAL[i]; if (f.pro && seller !== "professionnel") continue;
    s = 0; for (j = 0; j < f.mots.length; j++) if (n.indexOf(nrm(f.mots[j])) >= 0) s++;
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
    h = H(h, "<div class='hit'><span class='tag ", f.sec ? "crit" : "ok", "'>", esc(f.t), "</span><p class='sm'>", esc(f.r), "</p><details><summary>Repères · démarches · preuves</summary><ul class='sm'>");
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
  q.n++; save("quota", q); return { ok: true };
}
function quotaShow() {
  var q;
  if (S.admin) { $("quota").innerHTML = "🎟️ admin ∞"; return; }
  q = save("quota") || { start: 0, n: 0 };
  $("quota").innerHTML = H("🎟️ ", Math.max(0, 5 - q.n), "/5");
}
function ctxRun() {
  var ctx = trm($("ctx").value), q, v, seller, t, toks = [], i, j, dtcs, syms, h, top, c, feu, legal, eng, s, plan = [], ex, lids = [];
  if (!ctx) { toast("Décris la situation dans le contexte."); return; }
  q = quotaUse(); quotaShow();
  if (!q.ok) { toast(H("🚫 Quota atteint : 5 analyses / 7 jours. Reset le ", new Date(q.reset).toLocaleDateString("fr-FR"))); return; }
  v = veh(); seller = $("vSeller").value; t = nrm(ctx).split(" ");
  for (i = 0; i < t.length; i++) if (t[i].length > 3) toks.push(t[i]);
  dtcs = uniq((ctx.toUpperCase().match(/[PCBU]\d{4}/g) || []).concat($("dtc").value.toUpperCase().match(/[PCBU]\d{4}/g) || []));
  syms = checkedSym(); h = hyps(v, toks, dtcs, syms); top = h[0];
  c = top ? conf(top) : { lvl: "INDÉTERMINÉ", crit: "Aucune hypothèse concordante.", pct: 5 };
  feu = /incendie|feu|flamme|sinistre/.test(nrm(ctx)) || (top && top.e.fire);
  legal = legalMatch(ctx, seller); eng = enginesFor(v.make, v.model);
  s = H("<div class='card'><h2>🧾 Compte rendu d'expertise</h2><p class='sm'>", new Date().toLocaleString("fr-FR"), "</p>");
  s = H(s, "<h3>1. Identification du véhicule</h3><table><tr><th>Marque / Modèle</th><td><b>", esc(v.make || "—"), " ", esc(v.model), "</b></td></tr>");
  s = H(s, "<tr><th>Motorisation</th><td>", esc(v.engine || "—"), "</td></tr>");
  s = H(s, "<tr><th>Puissance / Énergie</th><td>", v.power || "—", " ch · ", esc(v.fuel || "—"), "</td></tr>");
  s = H(s, "<tr><th>Millésime</th><td>", v.year || "—", "</td></tr>");
  s = H(s, "<tr><th>Vendeur</th><td>", esc(seller), "</td></tr>");
  s = H(s, "<tr><th>Constatations</th><td>", esc(syms.join(", ") || "—"), "</td></tr>");
  s = H(s, "<tr><th>DTC</th><td>", dtcs.join(", ") || "—", "</td></tr></table>");
  s = H(s, "<h3>2. Origine la plus probable</h3>");
  if (top) {
    s = H(s, "<div class='hit ", top.e.fire ? "fire" : "", "'><span class='tag ", c.lvl === "CERTAIN" ? "ok" : "crit", "'>", c.lvl, " · indice ", c.pct, "%</span> <b>", esc(top.e.title), "</b>");
    s = H(s, "<div class='meta'>", esc(top.e.source), "</div>");
    s = H(s, "<p class='sm'><b>Critère :</b> ", esc(c.crit), "</p>");
    s = H(s, "<p class='sm'><b>Éléments concordants :</b> ", esc(top.why.join(" · ") || "termes du contexte retrouvés"), "</p>");
    s = H(s, "<p class='sm'><b>Chaîne causale :</b> ", esc(top.e.meca || "—"), " → ", esc((top.e.cons || []).join(" ; ") || "—"), "</p>", strip(top.e), "</div>");
  } else s = H(s, "<p class='sm'>Aucune hypothèse concordante dans la base — expertise physique requise.</p>");
  if (h.length > 1) {
    s = H(s, "<h3>3. Diagnostic différentiel</h3><table><tr><th>#</th><th>Hypothèse</th><th>Score</th></tr>");
    for (i = 1; i < Math.min(h.length, 5); i++) s = H(s, "<tr><td>", i + 1, "</td><td>", esc(String(h[i].e.title).slice(0, 70)), "</td><td><b>", h[i].s, "</b></td></tr>");
    s = H(s, "</table>");
  }
  if (feu) s = H(s, "<h3>4. Volet incendie renforcé</h3>", fireBox(v, h));
  s = H(s, "<h3>", feu ? "5" : "4", ". Qualification juridique</h3>", legalHtml(legal));
  if (eng.length) {
    s = H(s, "<h3>Motorisations attribuées à ce modèle</h3><table><tr><th>Motorisation</th><th>Énergie</th><th>Cylindrée</th><th>Puissances</th></tr>");
    for (i = 0; i < eng.length; i++) s = H(s, "<tr><td>", esc(eng[i].m), "</td><td>", eng[i].en, "</td><td>", eng[i].cc ? H(eng[i].cc, " cm³") : "—", "</td><td>", eng[i].ch.join("/"), " ch</td></tr>");
    s = H(s, "</table>");
  }
  for (i = 0; i < legal.length; i++) for (j = 0; j < legal[i].dem.length; j++) if (!has(plan, legal[i].dem[j])) plan.push(legal[i].dem[j]);
  ex = ["Conserver factures, annonce, contrat et historique d'entretien", "Faire établir un diagnostic écrit avant toute réparation", "Réaliser une lecture OBD horodatée et conserver les codes", "En cas de litige : réclamation écrite puis expertise contradictoire"];
  for (i = 0; i < ex.length; i++) if (!has(plan, ex[i])) plan.push(ex[i]);
  s = H(s, "<h3>Plan d'action &amp; conservation des preuves</h3><ul class='sm'>");
  for (i = 0; i < Math.min(plan.length, 10); i++) s = H(s, "<li>", esc(plan[i]), "</li>");
  s = H(s, "</ul><p class='sm'>⚠️ Méthode : qualifier, inférer, corréler, analyser, tester, conclure. Aide documentaire fondée sur les sources citées ; ne remplace ni une expertise physique du véhicule ni une consultation juridique personnalisée.</p>");
  s = H(s, "<div class='noprint'><button class='btn gh' data-act='print'>🖨️ PDF</button><button class='btn gh' data-act='ctxJson'>📤 JSON</button></div></div>");
  $("ctxOut").innerHTML = s;
  for (i = 0; i < legal.length; i++) lids.push(legal[i].id);
  S.report = { date: new Date().toISOString(), vehicule: v, contexte: ctx, niveau: c, origine: top ? top.e : null, juridique: lids };
  toast(H("🧾 Expertise générée — niveau <b>", c.lvl, "</b> (", c.pct, " %)"));
}
function studyRun() {
  var v = veh(), syms, dtcs, t, toks = [], i, h, top, c, rap = [], pan = [], s, hi;
  if (!v.make && !v.model) { toast("Renseigne au moins la marque et le modèle."); return; }
  syms = checkedSym(); dtcs = $("dtc").value.toUpperCase().match(/[PCBU]\d{4}/g) || [];
  t = nrm($("ctx").value).split(" ");
  for (i = 0; i < t.length; i++) if (t[i].length > 3) toks.push(t[i]);
  h = hyps(v, toks, dtcs, syms); top = h[0];
  c = top ? conf(top) : { lvl: "INDÉTERMINÉ", pct: 5, crit: "—" };
  for (i = 0; i < h.length; i++) { if (h[i].e.type === "rappel") rap.push(h[i].e); else pan.push(h[i].e); }
  s = H("<div class='card'><h2>📋 Étude de cas — ", esc(v.make), " ", esc(v.model), " ", esc(v.engine), "</h2>");
  s = H(s, "<p class='sm'>", new Date().toLocaleString("fr-FR"), " · ", S.base.length, " fiches · thème ", S.theme, "</p>");
  s = H(s, "<h3>🎯 Origine déterminée</h3><div class='hit'><span class='tag ok'>", c.lvl, " · ", c.pct, "%</span> <b>", esc(top ? top.e.title : "Indéterminé"), "</b><p class='sm'>", esc(c.crit), "</p></div>");
  s = H(s, "<h3>1️⃣ Rappels officiels concordants (", rap.length, ")</h3>");
  if (rap.length) for (i = 0; i < rap.length; i++) s = H(s, card(rap[i]), strip(rap[i])); else s = H(s, "<p class='sm'>Aucun.</p>");
  s = H(s, "<h3>2️⃣ Pannes connues (", pan.length, ")</h3>");
  if (pan.length) for (i = 0; i < pan.length; i++) s = H(s, card(pan[i]), strip(pan[i])); else s = H(s, "<p class='sm'>Aucune.</p>");
  s = H(s, fireBox(v, h), "<h3>Conclusion</h3><p class='sm'>Aide documentaire fondée sur les sources ; ne remplace pas une expertise physique du véhicule.</p></div>");
  $("studyOut").innerHTML = s;
  hi = save("histo") || []; hi.unshift({ date: new Date().toLocaleString("fr-FR"), v: v, niveau: c.lvl });
  save("histo", hi.slice(0, 20)); renderHisto();
  toast(H("✅ Étude terminée — ", rap.length, " rappel(s), ", pan.length, " panne(s)"));
}
function renderHisto() {
  var h = save("histo") || [], s = "", i;
  for (i = 0; i < h.length; i++) s = H(s, "<div class='hit'><b>", esc(h[i].v.make), " ", esc(h[i].v.model), "</b> <span class='sm'>", esc(h[i].date), " — ", esc(h[i].niveau), "</span></div>");
  $("histo").innerHTML = s || "<p class='sm'>Aucune étude enregistrée.</p>";
}

/* ══════════ PHOTOS ══════════ */
function compress(src, mw, q, cb) {
  mw = mw || 1000; q = q || 0.72;
  function run(im) {
    try {
      var sc = Math.min(1, mw / im.width), c = document.createElement("canvas"), u;
      c.width = Math.max(1, Math.round(im.width * sc)); c.height = Math.max(1, Math.round(im.height * sc));
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      u = c.toDataURL("image/jpeg", q);
      while (u.length * 0.75 > 170000 && q > 0.3) { q -= 0.08; u = c.toDataURL("image/jpeg", q); }
      cb(null, u);
    } catch (e) { cb(e.message || "compression impossible"); }
  }
  if (typeof src === "string") {
    var i = new Image(); i.crossOrigin = "anonymous";
    i.onload = function () { run(i); }; i.onerror = function () { cb("image inaccessible"); }; i.src = src;
  } else {
    var fr = new FileReader();
    fr.onload = function () { var i2 = new Image(); i2.onload = function () { run(i2); }; i2.onerror = function () { cb("fichier image illisible"); }; i2.src = fr.result; };
    fr.onerror = function () { cb("lecture du fichier impossible"); }; fr.readAsDataURL(src);
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
        done++; if (!err) addPend(u, cap || f.name);
        if (done === a.length) { renderPend(); toast(H("📷 ", a.length, " photo(s) prête(s) — rattache-les à une panne.")); }
      });
    })(a[i]);
  }
}
function renderPend() {
  var w = $("pending"), h = "", i;
  for (i = 0; i < S.pend.length; i++) h = H(h, "<span style='position:relative;display:inline-block;margin:3px'><img class='thumb' src='", esc(S.pend[i].src), "'><button data-act='rmPend' data-i='", i, "' style='position:absolute;top:-6px;right:-6px;border:0;border-radius:50%;background:#ff2d55;color:#fff;width:18px;height:18px;cursor:pointer'>✕</button></span>");
  w.innerHTML = h || "<span class='wait'>Aucune photo en attente.</span>";
}
function faultPicker() {
  var q = nrm($("fFilter").value), cur = $("fTarget").value;
  var h = "<option value='__new__'>➕ Créer une NOUVELLE panne…</option>", n = 0, i, e, o, found = false;
  for (i = 0; i < S.base.length && n < 80; i++) {
    e = S.base[i];
    if (q && nrm(H(e.title, " ", e.make, " ", e.model)).indexOf(q) < 0) continue;
    h = H(h, "<option value='", esc(fkey(e)), "'>", esc(String(e.title).slice(0, 60)), " · ", esc(e.make), "</option>"); n++;
  }
  $("fTarget").innerHTML = h;
  o = $("fTarget").options;
  for (i = 0; i < o.length; i++) if (o[i].value === cur) found = true;
  if (found) $("fTarget").value = cur;
  cls($("newForm"), "hide", $("fTarget").value !== "__new__");
}
function readForm() {
  var g = function (i) { return $(i).value; }, feu = $("nFire").checked;
  var ch = g("nPower").match(/\d{2,4}/g) || [], yr = g("nYears").match(/\d{4}/g) || [], i, c = [], y = [];
  for (i = 0; i < ch.length; i++) c.push(parseInt(ch[i], 10));
  for (i = 0; i < yr.length; i++) y.push(parseInt(yr[i], 10));
  return {
    id: S.editId || H("admin-", uid()), themes: feu ? ["technique", "incendie"] : ["technique"],
    type: "panne", source: "admin", make: g("nMake") || "Multi-marques", model: g("nModel") || "Tous",
    engine: g("nEngine"), years: y.length ? [Math.min.apply(null, y), Math.max.apply(null, y)] : null,
    fuel: g("nFuel") || fuelOf(g("nEngine")), sys: g("nSys"),
    dtc: g("nDtc").toUpperCase().match(/[PCBU]\d{4}/g) || [], sym: lines(g("nSym").replace(/,/g, "\n")),
    title: trm(g("nTitle")), meca: g("nMeca"), cons: lines(g("nCons")), ind: lines(g("nInd")),
    fire: feu, chain: feu ? g("nChain") : "", grav: g("nGrav"), url: g("nSrc"),
    powers: c.length ? c : null, date: new Date().toISOString().slice(0, 10)
  };
}
function clearForm() {
  var ids = ["nTitle","nMake","nModel","nEngine","nPower","nYears","nSys","nDtc","nSym","nSrc","nMeca","nCons","nInd","nChain"], i;
  for (i = 0; i < ids.length; i++) $(ids[i]).value = "";
  $("nFuel").value = ""; $("nGrav").value = "eleve"; $("nFire").checked = false;
  S.editId = null; $("nfTitle").innerHTML = "Nouvelle panne — caractéristiques";
}
function attach() {
  var t = $("fTarget").value, nf, keep = [], i, j, p, n;
  if (t === "__new__") {
    nf = readForm();
    if (!nf.title) { toast("Renseigne le titre du défaut."); $("nTitle").focus(); return; }
    for (i = 0; i < S.ov.entries.length; i++) if (S.ov.entries[i].id !== nf.id) keep.push(S.ov.entries[i]);
    keep.unshift(nf); S.ov.entries = keep; t = nf.id; merge([nf]); clearForm(); toast("💾 Panne enregistrée.");
  } else if (!S.pend.length) { toast("Ajoute au moins une photo, ou crée une nouvelle panne."); return; }
  for (j = 0; j < S.pend.length; j++) { p = S.pend[j]; S.ov.photos.push({ id: p.id, fault: t, url: p.src, cap: p.cap, ts: p.ts }); }
  n = S.pend.length; S.pend = [];
  persist(); renderPend(); faultPicker(); renderResults(); renderFaults(); fillFilters(); stats();
  if (n) toast(H("✅ ", n, " photo(s) rattachée(s) — publie pour diffuser aux tiers."));
  if (save("auto")) syncPush(false);
}
function renderFaults() {
  var own = S.ov.entries, h = "", i, j, e, k, ph;
  if (own.length) {
    for (i = 0; i < own.length; i++) {
      e = own[i]; k = fkey(e); ph = S.photos[k] || [];
      h = H(h, "<div class='hit ", S.sel[e.id] ? "sel" : "", "'>");
      h = H(h, "<label class='sm' style='display:flex;gap:7px;align-items:center'><input type='checkbox' data-act='selOne' data-id='", esc(e.id), "' ", S.sel[e.id] ? "checked" : "", "> <b class='t' data-act='detail' data-k='", esc(k), "'>", esc(e.title), "</b></label>");
      h = H(h, "<div class='meta'>", esc(e.make), " · ", esc(e.model), " · ", esc(e.engine), " · ", ph.length, " photo(s)</div>");
      if (ph.length) {
        h = H(h, "<div class='chips'>");
        for (j = 0; j < Math.min(ph.length, 8); j++) h = H(h, "<img class='thumb' data-act='lb' data-id='", esc(ph[j].id), "' src='", esc(ph[j].url), "'>");
        h = H(h, "</div>");
      }
      h = H(h, "<button class='btn gh sm' data-act='editFault' data-id='", esc(e.id), "'>✏️ Modifier</button>");
      h = H(h, "<button class='btn gh sm' data-act='moveUp' data-i='", i, "' ", i === 0 ? "disabled" : "", ">⬆️</button>");
      h = H(h, "<button class='btn gh sm' data-act='moveDown' data-i='", i, "' ", i === own.length - 1 ? "disabled" : "", ">⬇️</button>");
      h = H(h, "<button class='btn rd sm' data-act='delFault' data-id='", esc(e.id), "'>🗑️ Supprimer</button></div>");
    }
  } else h = "<p class='sm'>Aucune panne créée. Choisis « Créer une NOUVELLE panne » ci-dessus.</p>";
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
  toast(H("🗑️ ", re.length, " panne(s) supprimée(s)."), 8000, function () {
    S.ov.entries = re.concat(S.ov.entries); S.ov.photos = S.ov.photos.concat(rp);
    persist(); merge(re); renderFaults(); renderResults(); fillFilters(); stats(); toast("↩️ Suppression annulée.");
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
  var u = H("https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=", encodeURIComponent(q), "&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url&iiurlwidth=480");
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
  box.className = "hit"; out.insertBefore(box, out.firstChild);
  h = H("<h3>🖼️ ", esc(String(f.title).slice(0, 80)), "</h3><p class='sm'>", esc(f.make), " ", esc(f.model), " ", esc(f.engine), "</p>");
  h = H(h, "<h3>📌 Photos intégrées (", ph.length, ")</h3>");
  if (ph.length) {
    h = H(h, "<div class='pgrid'>");
    for (i = 0; i < ph.length; i++) h = H(h, "<figure class='pitem' data-act='lb' data-id='", esc(ph[i].id), "'><img src='", esc(ph[i].url), "' loading='lazy'><figcaption>", esc(ph[i].cap || "photo admin"), "</figcaption></figure>");
    h = H(h, "</div>");
  } else h = H(h, "<p class='sm'>Aucune photo locale pour cette panne. Admin → Pannes &amp; photos → rattacher → publier.</p>");
  h = H(h, "<h3>🌐 Photothèque libre (Commons)</h3><p class='sm' data-cw='1'>⏳ recherche en cours…</p>");
  box.innerHTML = h;
  commons(enQuery(f), function (res) {
    var w = null, l = box.getElementsByTagName("p"), i2, g = "", tmp;
    for (i2 = 0; i2 < l.length; i2++) if (l[i2].getAttribute("data-cw")) w = l[i2];
    if (!w) return;
    if (res.length) {
      g = "<div class='pgrid'>";
      for (i2 = 0; i2 < res.length; i2++) g = H(g, "<figure class='pitem' data-act='lbUrl' data-u='", esc(res[i2].thumb), "' data-c='", esc(res[i2].title), "'><img src='", esc(res[i2].thumb), "' loading='lazy'><figcaption>", esc(res[i2].title.slice(0, 40)), "</figcaption></figure>");
      g = H(g, "</div>");
    } else g = "<p class='sm'>Aucune photo libre trouvée automatiquement.</p>";
    tmp = document.createElement("div"); tmp.innerHTML = g; w.parentNode.replaceChild(tmp, w);
  });
}
function photoSearch() {
  var q = trm($("pq").value), l, i;
  if (!q) { toast("Saisis une panne à rechercher."); return; }
  l = search(q, 4);
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
  var m = $("mLb"); m.getElementsByTagName("img")[0].src = s;
  $("lbCap").innerHTML = esc(c || ""); m.className = "modal on";
}
function openDetail(k) {
  var e = null, i, ph, h;
  for (i = 0; i < S.base.length; i++) if (fkey(S.base[i]) === k) e = S.base[i];
  if (!e) { toast("Fiche introuvable."); return; }
  ph = S.photos[k] || [];
  h = H("<h2>📄 ", esc(e.title), "</h2>", card(e));
  if ((e.ind || []).length) {
    h = H(h, "<h3>Indices visuels</h3><ul class='sm'>");
    for (i = 0; i < e.ind.length; i++) h = H(h, "<li>", esc(e.ind[i]), "</li>");
    h = H(h, "</ul>");
  }
  if ((e.sym || []).length) {
    h = H(h, "<h3>Symptômes associés</h3><div class='chips'>");
    for (i = 0; i < e.sym.length; i++) h = H(h, "<span class='tag'>", esc(e.sym[i]), "</span>");
    h = H(h, "</div>");
  }
  h = H(h, "<h3>Photos (", ph.length, ")</h3>");
  if (ph.length) {
    h = H(h, "<div class='pgrid'>");
    for (i = 0; i < ph.length; i++) h = H(h, "<figure class='pitem' data-act='lb' data-id='", esc(ph[i].id), "'><img src='", esc(ph[i].url), "'><figcaption>", esc(ph[i].cap || ""), "</figcaption></figure>");
    h = H(h, "</div>");
  } else h = H(h, "<p class='sm'>Aucune photo rattachée.</p>");
  h = H(h, "<button class='btn gh' data-act='gal' data-k='", esc(k), "'>📷 Ouvrir dans le catalogue</button>");
  if (S.admin && e.source === "admin") h = H(h, "<button class='btn gh' data-act='editFault' data-id='", esc(e.id), "'>✏️ Modifier</button><button class='btn rd' data-act='delFault' data-id='", esc(e.id), "'>🗑️ Supprimer</button>");
  $("detailBody").innerHTML = h; $("mDetail").className = "modal on";
}

/* ══════════ VIN ══════════ */
var WMI = {"VF1":"Renault","VF3":"Peugeot","VF7":"Citroën","VR1":"Peugeot","VR3":"Peugeot","VR7":"Citroën","UU1":"Dacia","WVW":"Volkswagen","WV1":"Volkswagen","WAU":"Audi","TMB":"Skoda","VSS":"SEAT","WBA":"BMW","WBS":"BMW","WDB":"Mercedes-Benz","WDD":"Mercedes-Benz","W1K":"Mercedes-Benz","WMW":"Mini","WP0":"Porsche","SAJ":"Jaguar","SAL":"Land Rover","WF0":"Ford","W0L":"Opel","ZFA":"Fiat","ZAR":"Alfa Romeo","JTD":"Toyota","SB1":"Toyota","JHM":"Honda","JN1":"Nissan","SJN":"Nissan","KMH":"Hyundai","KNA":"Kia","JMZ":"Mazda","JF1":"Subaru","5YJ":"Tesla","YV1":"Volvo","1G1":"Chevrolet","1C4":"Jeep","LSJ":"MG"};
var YC = {"A":[1980,2010],"B":[1981,2011],"C":[1982,2012],"D":[1983,2013],"E":[1984,2014],"F":[1985,2015],"G":[1986,2016],"H":[1987,2017],"J":[1988,2018],"K":[1989,2019],"L":[1990,2020],"M":[1991,2021],"N":[1992,2022],"P":[1993,2023],"R":[1994,2024],"S":[1995,2025],"T":[1996,2026],"V":[1997,2027],"W":[1998,2028],"X":[1999,2029],"Y":[2000,2030],"1":[2001],"2":[2002],"3":[2003],"4":[2004],"5":[2005],"6":[2006],"7":[2007],"8":[2008],"9":[2009]};
var TRC = {"A":1,"B":2,"C":3,"D":4,"E":5,"F":6,"G":7,"H":8,"J":1,"K":2,"L":3,"M":4,"N":5,"P":7,"R":9,"S":2,"T":3,"U":4,"V":5,"W":6,"X":7,"Y":8,"Z":9};
var VWT = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];
function vinCheck(v) {
  if (v.length !== 17) return { ok: false, why: "longueur différente de 17 caractères" };
  if (/[IOQ]/.test(v)) return { ok: false, why: "les lettres I, O et Q sont interdites" };
  var s = 0, i, c, n, r, cd;
  for (i = 0; i < 17; i++) {
    c = v.charAt(i); n = (c >= "0" && c <= "9") ? parseInt(c, 10) : TRC[c];
    if (n === undefined) return { ok: false, why: "caractère invalide" };
    s += n * VWT[i];
  }
  r = s % 11; cd = r === 10 ? "X" : String(r);
  return { ok: cd === v.charAt(8), why: cd === v.charAt(8) ? "chiffre de contrôle valide" : H("chiffre de contrôle attendu ", cd, ", lu ", v.charAt(8)) };
}
var RURL = {"peugeot":"https://www.peugeot.fr/services-et-engagements/rappels-vehicules.html","citroen":"https://www.citroen.fr/services-et-engagements/rappels-vehicules.html","renault":"https://www.renault.fr/services/rappels-vehicules.html","dacia":"https://www.dacia.fr/services/rappels-vehicules.html","volkswagen":"https://www.volkswagen.fr/fr/informations-utiles/campagnes-de-rappel.html","skoda":"https://www.skoda.fr/services/rappels/","bmw":"https://www.bmw.fr/fr/topics/offres-et-services/apres-vente/rappel-bmw.html","toyota":"https://www.toyota.fr/services/rappels","tesla":"https://www.tesla.com/vin-recall-search","ford":"https://www.ford.fr/support/rappels/"};
function runVin() {
  var raw = $("vin").value.replace(/\s/g, "").toUpperCase(), out = $("vinOut");
  var v, mk, yc, ref, year, make, model = "", yr, fuel = "";
  if (!raw) { toast("Saisis un numéro VIN."); return; }
  v = vinCheck(raw); mk = WMI[raw.slice(0, 3)] || WMI[raw.slice(0, 2)] || "";
  yc = YC[raw.charAt(9)]; ref = new Date().getFullYear();
  year = yc ? (yc.length === 1 ? yc[0] : (ref >= yc[1] - 1 ? yc[1] : yc[0])) : 0;
  make = mk; yr = year;
  $("vinState").innerHTML = v.ok ? "VIN valide" : "à vérifier";
  $("vinState").className = H("pill ", v.ok ? "ok" : "warn");
  function kv(l, x) { return H("<div><b>", esc(l), "</b>", esc(x || "—"), "</div>"); }
  out.innerHTML = H("<h3>1. Décodage local</h3><p class='sm'>", v.ok ? "✅" : "⚠️", " ", esc(v.why), "</p><div class='kv'>", kv("WMI", raw.slice(0, 3)), kv("Marque", mk), kv("Millésime", year), kv("Usine", raw.charAt(10)), "</div><p class='sm'>⏳ Interrogation des sources officielles…</p>");
  jget(H("https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/", encodeURIComponent(raw), "?format=json"), 9000, function (vp) {
    var d = vp && vp.Results && vp.Results[0];
    if (d) { make = d.Make || make; model = d.Model || ""; yr = parseInt(d.ModelYear, 10) || yr; fuel = d.FuelTypePrimary || ""; }
    function finish(us) {
      var loc = [], i, e, r, h;
      for (i = 0; i < S.base.length && loc.length < 6; i++) {
        e = S.base[i];
        if (e.type === "rappel" && nrm(e.make).indexOf(nrm(make)) >= 0 && (!model || nrm(e.model).indexOf(nrm(model)) >= 0)) loc.push(e);
      }
      h = H("<h3>1. Décodage du VIN</h3><p class='sm'>", v.ok ? "✅" : "⚠️", " ", esc(v.why), "</p><div class='kv'>", kv("Marque", make), kv("Modèle", model), kv("Millésime", yr), kv("Carburant", fuel), kv("WMI", raw.slice(0, 3)), "</div>");
      h = H(h, "<h3>2. Campagnes de rappel NHTSA (", us.length, ")</h3>");
      for (i = 0; i < us.length; i++) {
        r = us[i];
        h = H(h, "<div class='hit'><b>", esc(r.NHTSACampaignNumber), "</b> · ", esc(r.ReportReceivedDate || ""), r.parkIt ? " <span class='tag crit'>PARK IT</span>" : "", "<p class='sm'>", esc(r.Component || ""), "</p><p class='sm'>", esc(String(r.Summary || "").slice(0, 260)), "</p><a class='sm' href='https://www.nhtsa.gov/recalls?nhtsaId=", esc(r.NHTSACampaignNumber), "' target='_blank' rel='noopener'>📎 Fiche NHTSA</a></div>");
      }
      h = H(h, "<p class='sm'><b>🇫🇷 / 🇪🇺 Base locale :</b> ", loc.length, " fiche(s)</p>");
      for (i = 0; i < loc.length; i++) h = H(h, card(loc[i]));
      h = H(h, "<h3>3. Statut de ce VIN</h3><p class='sm'>Le statut traité ou non traité n'est publié que par le constructeur. Le VIN est copié dans le presse-papier.</p>");
      h = H(h, "<button class='btn' data-act='vinBrand'>🏭 Page rappels ", esc(make || "constructeur"), "</button><button class='btn gh' data-act='vinFill'>🚗 Remplir le sélecteur</button>");
      out.innerHTML = h;
      S.vin = { raw: raw, make: make, model: model, year: yr, fuel: fuel,
        url: RURL[nrm(make).replace(/ /g, "-")] || H("https://www.google.com/search?q=", encodeURIComponent(H(make, " rappel campagne VIN officiel"))) };
    }
    if (make && model && yr) jget(H("https://api.nhtsa.gov/recalls/recallsByVehicle?make=", encodeURIComponent(make), "&model=", encodeURIComponent(model), "&modelYear=", yr), 9000, function (j) { finish((j && j.results) || []); });
    else finish([]);
  });
}

/* ══════════ OBD ══════════ */
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
    a = b[i]; c = b[i + 1]; if (!a && !c) continue;
    o.push(H("PCBU".charAt((a >> 6) & 3), String((a >> 4) & 3), (a & 15).toString(16).toUpperCase(), (c >> 4).toString(16).toUpperCase(), (c & 15).toString(16).toUpperCase()));
  }
  return o;
}
function obdConnect() {
  if (!navigator.bluetooth) { $("obdState").innerHTML = "Web Bluetooth indisponible ici — ouvre l'application dans Chrome Android."; return; }
  $("obdState").innerHTML = "⏳ Sélection de l'adaptateur…";
  navigator.bluetooth.requestDevice({ filters: [{ services: ["0000fff0-0000-1000-8000-00805f9b34fb"] }], optionalServices: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"] })
  .then(function (dev) {
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
          n.addEventListener("characteristicvaluechanged", function (ev) { obdBuf += new TextDecoder().decode(ev.target.value); });
          $("obdState").innerHTML = H("✅ Connecté : ", esc(dev.name || "adaptateur"));
          $("bObdRead").disabled = false;
          obdSend("ATZ", 1200, function () { obdSend("ATE0", 900, function () { obdSend("ATL0", 900, function () { obdSend("ATSP0", 1600, function () {}); }); }); });
        });
      });
    });
  }).catch(function (e) { $("obdState").innerHTML = H("❌ ", esc(e.message || e)); });
}
function obdRead() {
  $("obdState").innerHTML = "⏳ Lecture des défauts…";
  obdSend("03", 2500, function (a) {
    obdSend("07", 2500, function (b) {
      var codes = uniq(decodeDTC(a).concat(decodeDTC(b))), h = "", i, e, j;
      $("obdState").innerHTML = H("✅ ", codes.length, " code(s) lu(s).");
      for (i = 0; i < codes.length; i++) {
        e = null;
        for (j = 0; j < S.base.length; j++) if (has(S.base[j].dtc || [], codes[i])) e = S.base[j];
        h = H(h, "<div class='hit'><b>", codes[i], "</b><p class='sm'>", esc(e ? e.title : "Code absent de la base — recherche élargie conseillée."), "</p></div>");
      }
      $("obdOut").innerHTML = h || "<p class='sm'>Aucun code défaut stocké ou en attente.</p>";
      if (codes.length) {
        $("dtcOn").checked = true; cls($("dtc"), "hide", false); $("dtc").value = codes.join(", ");
        toast(H("✅ ", codes.length, " code(s) injecté(s) dans l'étude de cas."));
      }
    });
  });
}

/* ══════════ SYNC ══════════ */
var AD = {
kvdb: { name: "kvdb.io", keys: true,
  create: function (cb) { req("https://kvdb.io/", 9000, function (e, r) { if (e || !r.ok) { cb(e || H("HTTP ", r.status)); return; } cb(null, trm(r.text).split("/").pop()); }, "POST", ""); },
  read: function (c, cb) { req(H("https://kvdb.io/", c, "/ktf"), 9000, function (e, r) { if (e) { cb(e); return; } if (r.status === 404) { cb(null, null); return; } if (!r.ok) { cb(H("HTTP ", r.status)); return; } try { cb(null, r.text ? JSON.parse(r.text) : null); } catch (x) { cb("réponse illisible"); } }); },
  write: function (c, o, cb) { req(H("https://kvdb.io/", c, "/ktf"), 12000, function (e, r) { cb(e || (r.ok ? null : H("HTTP ", r.status))); }, "PUT", JSON.stringify(o), "text/plain"); },
  putPh: function (c, i, d, cb) { req(H("https://kvdb.io/", c, "/ph_", i), 12000, function (e, r) { cb(e || (r.ok ? null : H("HTTP ", r.status))); }, "PUT", d, "text/plain"); },
  getPh: function (c, i, cb) { req(H("https://kvdb.io/", c, "/ph_", i), 12000, function (e, r) { cb(e || !r.ok ? null : r.text); }); } },
restful: { name: "restful-api.dev", keys: false,
  create: function (cb) { req("https://api.restful-api.dev/objects", 11000, function (e, r) { if (e || !r.ok) { cb(e || H("HTTP ", r.status)); return; } try { cb(null, JSON.parse(r.text).id); } catch (x) { cb("réponse illisible"); } }, "POST", JSON.stringify({ name: "ktf", state: {} }), "application/json"); },
  read: function (c, cb) { req(H("https://api.restful-api.dev/objects/", c), 9000, function (e, r) { if (e) { cb(e); return; } if (!r.ok) { cb(null, null); return; } try { var j = JSON.parse(r.text); cb(null, j.state || null); } catch (x) { cb("réponse illisible"); } }); },
  write: function (c, o, cb) { req(H("https://api.restful-api.dev/objects/", c), 12000, function (e, r) { cb(e || (r.ok ? null : H("HTTP ", r.status))); }, "PUT", JSON.stringify({ name: "ktf", state: o }), "application/json"); } },
jsonblob: { name: "jsonblob.com", keys: false,
  create: function (cb) { req("https://jsonblob.com/api/jsonBlob", 11000, function (e, r) { if (e || !r.ok) { cb(e || H("HTTP ", r.status)); return; } var id = r.xid || (r.loc || "").split("/").pop(); if (!id) { cb("identifiant non exposé"); return; } cb(null, id); }, "POST", "{}", "application/json"); },
  read: function (c, cb) { req(H("https://jsonblob.com/api/jsonBlob/", c), 9000, function (e, r) { if (e) { cb(e); return; } if (!r.ok) { cb(null, null); return; } try { cb(null, JSON.parse(r.text)); } catch (x) { cb("réponse illisible"); } }); },
  write: function (c, o, cb) { req(H("https://jsonblob.com/api/jsonBlob/", c), 12000, function (e, r) { cb(e || (r.ok ? null : H("HTTP ", r.status))); }, "PUT", JSON.stringify(o), "application/json"); } }
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
      A.write(c, { v: 1, ts: Date.now(), entries: S.ov.entries, photos: meta, embedded: embed, look: S.look, revs: S.revs, mail: S.mail }, function (err) {
        var ok = !err;
        $("syState").innerHTML = ok ? H("✅ ", new Date().toLocaleTimeString("fr-FR")) : H("❌ ", esc(err));
        $("syState").className = H("pill ", ok ? "ok" : "bad");
        if (manual) toast(ok ? "📡 Publié — les tiers reçoivent sous 60 secondes." : H("❌ ", esc(err)));
        if (cb) cb(ok);
      });
      return;
    }
    p = list[i]; i++;
    if (A.keys && p.url.indexOf("data:") === 0) { A.putPh(c, p.id, p.url, function () { meta.push({ id: p.id, fault: p.fault, cap: p.cap, ts: p.ts, ref: "key" }); step(); }); return; }
    if (p.url.indexOf("data:") === 0) { if (Object.keys(embed).length < 4) embed[p.id] = p.url; meta.push({ id: p.id, fault: p.fault, cap: p.cap, ts: p.ts, ref: "embed" }); step(); return; }
    meta.push({ id: p.id, fault: p.fault, cap: p.cap, ts: p.ts, ref: "url", url: p.url }); step();
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
        if (st.revs && st.revs.length) { each(st.revs, function (s) { if (!has(S.revs, s)) S.revs.push(s); }); save("revs", S.revs); checkRev(); }
        if (st.mail) S.mail = st.mail;
        chk("sync", "ok", H(A.name, " · reçu ", new Date(st.ts || Date.now()).toLocaleTimeString("fr-FR")));
        fillFilters(); renderResults(); stats(); if (cb) cb(); return;
      }
      m = meta[i]; i++;
      a = S.photos[m.fault] || [];
      for (j = 0; j < a.length; j++) if (a[j].id === m.id) ex = true;
      if (ex) { step(); return; }
      if (m.ref === "key") {
        ca = save(H("ph:", m.id));
        if (ca) { if (!S.photos[m.fault]) S.photos[m.fault] = []; S.photos[m.fault].push({ id: m.id, url: ca, cap: m.cap, ts: m.ts }); step(); return; }
        if (A.getPh) { A.getPh(c, m.id, function (du) { if (du) { save(H("ph:", m.id), du); if (!S.photos[m.fault]) S.photos[m.fault] = []; S.photos[m.fault].push({ id: m.id, url: du, cap: m.cap, ts: m.ts }); } step(); }); return; }
        step(); return;
      }
      url = m.ref === "embed" ? ((st.embedded || {})[m.id] || "") : (m.url || "");
      if (url) { if (!S.photos[m.fault]) S.photos[m.fault] = []; S.photos[m.fault].push({ id: m.id, url: url, cap: m.cap, ts: m.ts }); }
      step();
    }
    step();
  });
}
function applyLook() {
  var op = (S.look.op === undefined || S.look.op === null) ? 55 : S.look.op, i;
  $("wall").style.backgroundImage = S.look.bg ? H("url(", S.look.bg, ")") : "";
  $("wall").style.opacity = op / 100; $("op").value = op; $("opVal").innerHTML = H(op, "%");
  if (S.look.car) { i = new Image(); i.onload = function () { S.carImg = i; }; i.src = S.look.car; } else S.carImg = null;
  save("look", S.look);
}
function checkRev() { var a = save("access"); if (a && has(S.revs, a.sig)) { save("access", null); if (!S.admin) gate("revoque"); } }

/* ══════════ ACCÈS ══════════ */
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
  else if (st === "refus" || st === "revoque") { cls($("gKo"), "hide", false); $("gWhy").innerHTML = st === "revoque" ? "🔒 Ce code a été révoqué par l'administrateur." : "❌ Code invalide ou expiré."; }
  else cls($("gForm"), "hide", false);
}
function showApp() { show("s-app"); cls($("bToAdmin"), "hide", !S.admin); renderHisto(); quotaShow(); renderOutbox(); renderResults(); }
function showAdmin() { show("s-admin"); renderCodes(); renderRevs(); faultPicker(); renderPend(); renderFaults(); paintChk(); }
function codes() { return save("codes") || []; }
function renderCodes() {
  var a = codes(), h = "", i, x, rv, ex;
  if (a.length) {
    h = "<table><tr><th>Prénom</th><th>Expire</th><th>État</th><th></th></tr>";
    for (i = 0; i < a.length; i++) {
      x = a[i]; rv = has(S.revs, x.sig); ex = x.exp < Date.now();
      h = H(h, "<tr><td>", esc(x.name), "</td><td class='sm'>", new Date(x.exp).toLocaleDateString("fr-FR"), "</td><td><span class='tag ", rv ? "crit" : ex ? "" : "ok", "'>", rv ? "révoqué" : ex ? "expiré" : "actif", "</span></td>");
      h = H(h, "<td><button class='btn gh sm' data-act='copyUser' data-i='", i, "'>📋</button><button class='btn rd sm' data-act='revoke' data-i='", i, "' ", rv ? "disabled" : "", ">🚫</button></td></tr>");
    }
    h = H(h, "</table>");
  } else h = "<p class='sm'>Aucun code émis pour l'instant.</p>";
  $("codes").innerHTML = h;
}
function renderRevs() { $("revs").innerHTML = H("<p class='sm'>", S.revs.length, " code(s) révoqué(s).</p>"); }
function renderOutbox() {
  var o = save("outbox") || [], h = "", i;
  for (i = 0; i < o.length; i++) h = H(h, "<div class='hit'><span class='sm'>", new Date(o[i].at).toLocaleString("fr-FR"), "</span><p class='sm'>", esc(o[i].t.slice(0, 160)), "</p></div>");
  $("outbox").innerHTML = h || "<p class='sm'>Aucun message envoyé.</p>";
}
function sendMsg(cp) {
  var t = trm($("msg").value), o;
  if (!t) { toast("Écris ton message."); return; }
  o = save("outbox") || []; o.unshift({ t: t, at: Date.now() }); save("outbox", o.slice(0, 30)); renderOutbox();
  if (cp) copy(t);
  else location.href = H("mailto:", S.mail, "?subject=", encodeURIComponent(H("Message KEV TECH & FIRE — ", S.name)), "&body=", encodeURIComponent(t));
  $("msg").value = "";
}

/* ══════════ MAJ ══════════ */
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
          merge(normList(all)); save("ver", idx.version || ""); save("cache", { ts: Date.now(), entries: S.base.slice(0, 2000) });
          fillFilters(); renderResults(); stats(); chk("repo", "ok", H("MAJ appliquée : ", all.length, " fiches")); toast("⬆️ Base mise à jour.");
        }
        if (cb) cb(); return;
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
  S.busy = true; toast("🛰️ Interrogation de RappelConso…");
  base = "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/rappelconso-v2-gtin-espaces/records";
  function fin() {
    if (out.length) {
      merge(out); save("cache", { ts: Date.now(), entries: S.base.slice(0, 2000) }); save("rcTs", Date.now());
      fillFilters(); renderResults(); stats(); toast(H("🛰️ <b>", out.length, "</b> rappels officiels intégrés à la base."));
    } else toast("⚠️ RappelConso injoignable — la base locale reste disponible.");
    S.busy = false; if (cb) cb();
  }
  function step() {
    var u;
    if (off >= 1000) { fin(); return; }
    u = H(base, "?where=", encodeURIComponent('categorie_produit="automobiles et moyens de déplacement"'), "&limit=100&offset=", off);
    jget(u, 9000, function (j) {
      var res = (j && j.results) || [];
      if (!res.length) { fin(); return; }
      each(res, function (r) {
        var txt = [r.motif_rappel, r.risques_encourus].join(" ");
        var feu = /incendie|feu|flamme|inflamm/i.test(txt);
        var yy = String(r.modeles_ou_references || "").match(/(?:19|20)\d{2}/g) || [], yr = [], i;
        for (i = 0; i < yy.length; i++) yr.push(parseInt(yy[i], 10));
        out.push({
          id: H("rc-", r.numero_fiche || uid()), themes: feu ? ["technique", "incendie"] : ["technique"],
          type: "rappel", source: "rappelconso", make: tc(r.marque_produit || ""), model: r.modeles_ou_references || "",
          engine: "", years: yr.length ? [Math.min.apply(null, yr), Math.max.apply(null, yr)] : null, fuel: "",
          sys: r.sous_categorie_produit || "", dtc: [], sym: [],
          title: String(r.libelle || r.motif_rappel || "Rappel").slice(0, 280), meca: r.motif_rappel || "",
          cons: [r.risques_encourus || ""], ind: [], fire: feu, chain: feu ? txt.slice(0, 200) : "",
          grav: feu ? "critique" : "eleve", url: r.lien_vers_la_fiche_rappel || "", date: String(r.date_publication || "").slice(0, 10)
        });
      });
      off += 100;
      if (off >= (j.total_count || 0)) { fin(); return; }
      setTimeout(step, 90);
    });
  }
  step();
}

/* ══════════ FOND ANIMÉ ══════════ */
var cv = $("scene"), cx = cv.getContext("2d"), W = 0, Ht = 0, stars = [], b1 = [], b2 = [], dash = 0, raf = 0, vis = true;
function resize() {
  var d = Math.min(window.devicePixelRatio || 1, 1.5), i;
  W = window.innerWidth; Ht = window.innerHeight;
  cv.width = Math.max(1, Math.round(W * d)); cv.height = Math.max(1, Math.round(Ht * d));
  cx.setTransform(d, 0, 0, d, 0, 0);
  stars = [];
  for (i = 0; i < 70; i++) stars.push({ x: Math.random() * W, y: Math.random() * Ht * 0.55, r: Math.random() * 1.4 + 0.3, p: Math.random() * 6 });
  function mk(n, h) { var a = [], j; for (j = 0; j < n; j++) a.push({ x: j * (W / n), w: W / n * 0.7, h: h + Math.random() * h }); return a; }
  b1 = mk(14, Ht * 0.16); b2 = mk(20, Ht * 0.1);
}
function accent() { try { return trm(getComputedStyle(document.documentElement).getPropertyValue("--acc")) || "#00e676"; } catch (e) { return "#00e676"; } }
function drawAurora(t) {
  var i, bx, by, rg;
  for (i = 0; i < 3; i++) {
    bx = W * (0.2 + 0.3 * i) + Math.sin(t / 5000 + i * 2) * W * 0.15;
    by = Ht * 0.25 + Math.cos(t / 6000 + i) * Ht * 0.08;
    rg = cx.createRadialGradient(bx, by, 0, bx, by, W * 0.4);
    rg.addColorStop(0, i === 0 ? "rgba(0,229,255,.16)" : i === 1 ? "rgba(139,92,255,.16)" : "rgba(255,122,24,.12)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    cx.fillStyle = rg; cx.fillRect(0, 0, W, Ht);
  }
}
function drawCar(x, y, s, t) {
  var a = accent(), wh = [-88, 92], w, k;
  cx.save(); cx.translate(x, y + Math.sin(t / 180) * 1.6); cx.scale(s, s);
  if (S.carImg) { cx.drawImage(S.carImg, -150, -78, 300, 90); cx.restore(); return; }
  cx.shadowColor = a; cx.shadowBlur = 16; cx.fillStyle = "#0d1330"; cx.strokeStyle = a; cx.lineWidth = 2;
  cx.beginPath(); cx.moveTo(-140, 0); cx.quadraticCurveTo(-130, -30, -80, -36); cx.lineTo(-45, -58);
  cx.quadraticCurveTo(0, -72, 55, -56); cx.lineTo(95, -36); cx.quadraticCurveTo(140, -30, 146, -8);
  cx.lineTo(146, 0); cx.closePath(); cx.fill(); cx.stroke();
  cx.shadowBlur = 0; cx.fillStyle = "rgba(144,202,249,.85)";
  cx.beginPath(); cx.moveTo(-40, -54); cx.lineTo(48, -52); cx.lineTo(78, -38); cx.lineTo(-62, -38); cx.closePath(); cx.fill();
  for (w = 0; w < 2; w++) {
    cx.fillStyle = "#05070f"; cx.beginPath(); cx.arc(wh[w], 2, 20, 0, 6.2832); cx.fill();
    cx.strokeStyle = a; cx.lineWidth = 2; cx.stroke();
    cx.save(); cx.translate(wh[w], 2); cx.rotate(t / 90); cx.strokeStyle = "rgba(255,255,255,.5)";
    for (k = 0; k < 4; k++) { cx.rotate(Math.PI / 2); cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(0, -14); cx.stroke(); }
    cx.restore();
  }
  cx.fillStyle = "rgba(255,241,118,.9)"; cx.fillRect(140, -14, 60, 12);
  cx.fillStyle = "#ff2d55"; cx.fillRect(-146, -16, 6, 8);
  cx.restore();
}
function frame(t) {
  var a = accent(), road = Ht * 0.8, i, x, s, g;
  if (!vis) { raf = 0; return; }
  g = cx.createLinearGradient(0, 0, 0, Ht);
  g.addColorStop(0, "#05081a"); g.addColorStop(0.55, "#141034"); g.addColorStop(1, "#05081a");
  cx.fillStyle = g; cx.fillRect(0, 0, W, Ht);
  drawAurora(t);
  cx.fillStyle = "#fff";
  for (i = 0; i < stars.length; i++) { s = stars[i]; cx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t / 900 + s.p)); cx.fillRect(s.x, s.y, s.r, s.r); }
  cx.globalAlpha = 1; cx.fillStyle = "rgba(10,14,36,.9)";
  for (i = 0; i < b1.length; i++) { x = (b1[i].x - t * 0.008) % W; cx.fillRect(x < 0 ? x + W : x, road - b1[i].h, b1[i].w, b1[i].h); }
  cx.fillStyle = "rgba(16,20,52,.95)";
  for (i = 0; i < b2.length; i++) { x = (b2[i].x - t * 0.02) % W; cx.fillRect(x < 0 ? x + W : x, road - b2[i].h, b2[i].w, b2[i].h); }
  cx.fillStyle = a; cx.globalAlpha = 0.5; cx.fillRect(0, road, W, 2); cx.globalAlpha = 1;
  cx.fillStyle = "#0a0d1c"; cx.fillRect(0, road, W, Ht - road);
  dash = (dash + 6) % 160; cx.fillStyle = "rgba(255,215,64,.8)";
  for (x = -dash; x < W; x += 160) cx.fillRect(x, road + (Ht - road) * 0.5, 70, 5);
  drawCar(W * 0.34, road - 2, Math.min(1, W / 700), t);
  raf = window.requestAnimationFrame(frame);
}
function startLoop() { if (raf) { window.cancelAnimationFrame(raf); raf = 0; } vis = true; if (window.requestAnimationFrame) raf = window.requestAnimationFrame(frame); }
function net() {
  var c = navigator.connection || {}, t = c.type === "wifi" ? "WiFi" : String(c.effectiveType || "").toUpperCase();
  $("pNet").innerHTML = navigator.onLine ? H("📶 ", t || "en ligne") : "📴 hors ligne";
  $("pNet").className = H("pill ", navigator.onLine ? "ok" : "warn");
  chk("net", navigator.onLine ? "ok" : "warn", navigator.onLine ? "en ligne" : "hors ligne — base locale utilisable");
}

/* ══════════ SUGGESTIONS ══════════ */
function prov(kind) {
  if (kind === "make") return function () {
    var c = nrm($("vMake").value), o = [], i;
    for (i = 0; i < BRANDS.length; i++) if (!c || BRANDS[i].indexOf(c) >= 0) o.push({ value: tc(BRANDS[i]), label: tc(BRANDS[i]), hint: H((MODELS[BRANDS[i]] || []).length, " modèles") });
    return o;
  };
  if (kind === "model") return function () {
    var b = nrm($("vMake").value), c = nrm($("vModel").value), l = [], i, k, o = [];
    if (MODELS[b]) l = MODELS[b].slice(0);
    else { for (k in MODELS) { if (!MODELS.hasOwnProperty(k)) continue; if (!b || k.indexOf(b) >= 0) l = l.concat(MODELS[k]); } }
    l = uniq(l);
    for (i = 0; i < l.length; i++) if (!c || l[i].indexOf(c) >= 0) o.push({ value: tc(l[i]), label: tc(l[i]), hint: "" });
    return o;
  };
  if (kind === "engine") return function () {
    var l = enginesFor($("vMake").value, $("vModel").value), c = nrm($("vEngine").value), o = [], i, e;
    for (i = 0; i < l.length; i++) {
      e = l[i]; if (c && nrm(e.m).indexOf(c) < 0) continue;
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
    for (i = 0; i < Math.min(S.base.length, 800); i++) { e = S.base[i]; each(e.dtc || [], function (d) { s[d] = 1; }); if (e.sys) s[e.sys] = 1; }
    for (k in s) { if (!s.hasOwnProperty(k)) continue; if (nrm(k).indexOf(c) >= 0) o.push({ value: k, label: k, hint: "" }); }
    return o.slice(0, 10);
  };
}
function suggest(inp) {
  var p, w, l;
  if (!inp || inp._sg) return;
  inp._sg = true; p = prov(inp.getAttribute("data-sg"));
  w = document.createElement("div"); w.className = "sgw";
  inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
  l = document.createElement("div"); l.className = "sgl"; l.style.display = "none"; w.appendChild(l);
  function open() {
    var it = [], h = "", i;
    try { it = p().slice(0, 12); } catch (e) { it = []; }
    if (!it.length) { l.style.display = "none"; return; }
    for (i = 0; i < it.length; i++) h = H(h, "<div data-i='", i, "'>", esc(it[i].label), it[i].hint ? H(" <span style='color:#93a4d8;font-size:.65rem'>", esc(it[i].hint), "</span>") : "", "</div>");
    l.innerHTML = h; l._i = it; l.style.display = "block";
  }
  inp.addEventListener("focus", open); inp.addEventListener("click", open); inp.addEventListener("input", open);
  l.addEventListener("mousedown", function (ev) {
    var t = ev.target;
    while (t && t !== l && !t.getAttribute("data-i")) t = t.parentNode;
    if (!t || t === l) return;
    ev.preventDefault();
    inp.value = l._i[parseInt(t.getAttribute("data-i"), 10)].value;
    l.style.display = "none"; fire(inp, "change");
  });
  inp.addEventListener("blur", function () { setTimeout(function () { l.style.display = "none"; }, 180); });
}
function feedWords(ta, ch) {
  ta.addEventListener("input", function () {
    var w = nrm(ta.value).split(" "), last = w[w.length - 1] || "", s = {}, i, k, h = "", t;
    if (last.length < 3) { ch.innerHTML = ""; return; }
    for (i = 0; i < Math.min(S.base.length, 600); i++) {
      t = nrm(H(S.base[i].title, " ", S.base[i].sys)).split(" ");
      each(t, function (x) { if (x.indexOf(last) === 0 && x !== last) s[x] = 1; });
    }
    for (k in s) { if (!s.hasOwnProperty(k)) continue; h = H(h, "<button data-act='word' data-w='", esc(k), "' data-t='", ta.id, "'>", esc(k), " ⏎</button>"); }
    ch.innerHTML = h;
  });
}

/* ══════════ ACTIONS ══════════ */
var ACT = {
noop: function () {},
home: function () { save("mode", null); show("s-home"); },
modeAdmin: function () { $("pwd").value = ""; show("s-login"); $("pwd").focus(); },
modeTiers: function () { var a; save("mode", "tiers"); a = save("access"); if (a && !has(S.revs, a.sig)) { S.name = a.name; showApp(); } else gate("form"); },
login: function () { var p = $("pwd").value; $("pwd").value = ""; if (!p) return; if (p === PWD) { S.admin = true; showAdmin(); toast("🛡️ Mode administrateur déverrouillé."); } else toast("❌ Mot de passe incorrect."); },
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
  location.href = H("mailto:", S.mail, "?subject=", encodeURIComponent("Demande de code KEV TECH & FIRE"), "&body=", encodeURIComponent(H("Bonjour,\n\nPrénom : ", p, "\nJe souhaite un code d'accès à l'application.\n\nMerci !")));
  toast("📧 Demande préparée dans ta messagerie.");
},
joinChan: function () { setChan(trm($("gChan").value)); syncPull(); toast(chan() ? "✅ Canal rejoint." : "Canal effacé."); },
quit: function () { S.admin = false; show("s-home"); },
toAdmin: function () { if (S.admin) showAdmin(); },
toApp: function () { showApp(); },
theme: function (t) {
  var b = $("seg").getElementsByTagName("button"), i;
  S.theme = t.getAttribute("data-t"); document.documentElement.setAttribute("data-theme", S.theme);
  for (i = 0; i < b.length; i++) cls(b[i], "on", b[i] === t);
  renderResults();
},
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
pickEng: function (t) { var l = $("cEng")._l || [], e = l[parseInt(t.getAttribute("data-e"), 10)]; if (!e) return; $("vEngine").value = e.m; autoAttr(); },
pickPow: function (t) { $("vPower").value = t.getAttribute("data-p"); },
useVeh: function (t) {
  $("vMake").value = t.getAttribute("data-m"); $("vModel").value = t.getAttribute("data-o");
  $("vEngine").value = ""; $("vPower").value = "";
  renderEng(); renderPow(); renderAttrib();
  try { window.scrollTo(0, 0); } catch (e) {}
  toast("✅ Véhicule chargé dans le sélecteur.");
},
detail: function (t) { openDetail(t.getAttribute("data-k")); },
detailClose: function () { $("mDetail").className = "modal"; },
lb: function (t) { var p = findPhoto(t.getAttribute("data-id")); if (p) lightbox(p.url, p.cap); },
lbUrl: function (t) { lightbox(t.getAttribute("data-u"), t.getAttribute("data-c")); },
lbClose: function () { $("mLb").className = "modal"; },
gal: function (t) {
  var k = t.getAttribute("data-k"), f = null, i, b;
  for (i = 0; i < S.base.length; i++) if (fkey(S.base[i]) === k) f = S.base[i];
  $("mDetail").className = "modal"; showApp();
  b = $("tabsApp").getElementsByTagName("button");
  for (i = 0; i < b.length; i++) if (b[i].getAttribute("data-v") === "photos") { ACT.tabApp(b[i]); break; }
  $("photoOut").innerHTML = ""; if (f) gallery(f);
},
webPhotos: function (t) {
  var b, i; showApp();
  b = $("tabsApp").getElementsByTagName("button");
  for (i = 0; i < b.length; i++) if (b[i].getAttribute("data-v") === "photos") { ACT.tabApp(b[i]); break; }
  $("pq").value = t.getAttribute("data-q"); photoSearch();
},
photoSearch: function () { photoSearch(); },
ctxRun: function () { ctxRun(); },
ctxJson: function () { dl("expertise.json", JSON.stringify(S.report || { vehicule: veh(), contexte: $("ctx").value }, null, 1)); },
studyRun: function () { studyRun(); },
print: function () { window.print(); },
word: function (t) { var ta = $(t.getAttribute("data-t")); if (!ta) return; ta.value = H(ta.value.replace(/[A-Za-z0-9-]+$/, t.getAttribute("data-w")), " "); ta.focus(); fire(ta, "input"); },
obdConnect: function () { obdConnect(); },
obdRead: function () { obdRead(); },
msgSend: function () { sendMsg(false); },
msgCopy: function () { sendMsg(true); },
vinRun: function () { runVin(); },
vinPaste: function () { if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(function (t) { $("vin").value = t.replace(/\s/g, "").slice(0, 17); runVin(); }, function () { toast("Colle le VIN manuellement."); }); else toast("Colle le VIN manuellement dans le champ."); },
vinBrand: function () { if (!S.vin) return; copy(S.vin.raw); window.open(S.vin.url, "_blank", "noopener"); },
vinFill: function () {
  var v; if (!S.vin) return; v = S.vin;
  if (v.make) $("vMake").value = tc(v.make.toLowerCase());
  if (v.model) $("vModel").value = v.model;
  if (v.year) $("vYear").value = v.year;
  if (v.fuel) $("vFuel").value = /electric/i.test(v.fuel) ? "electrique" : /diesel/i.test(v.fuel) ? "diesel" : /hybrid/i.test(v.fuel) ? "hybride" : "essence";
  renderEng(); renderPow(); renderAttrib();
  try { window.scrollTo(0, 0); } catch (e) {}
  toast("✅ Sélecteur véhicule pré-rempli depuis le VIN.");
},
genCode: function () {
  var p = trm($("acName").value), days, pay, pl, sg, code, a;
  if (!p) { toast("Prénom requis."); return; }
  days = Math.max(1, parseInt($("acDays").value, 10) || 365);
  pay = { p: p, n: uid(), exp: Date.now() + days * 86400000 };
  pl = b64u(JSON.stringify(pay)); sg = sig(pl); code = H(pl, ".", sg);
  $("genOut").innerHTML = esc(code); cls($("genOut"), "hide", false);
  a = codes(); a.unshift({ name: p, exp: pay.exp, sig: sg, code: code }); save("codes", a);
  renderCodes(); toast(H("🎟️ Code généré pour ", esc(p), "."));
},
copyGen: function () { copy($("genOut").textContent); },
shareGen: function () { var t = H("Code d'accès KEV TECH & FIRE :\n", $("genOut").textContent); if (navigator.share) navigator.share({ title: "Code d'accès", text: t }).catch(function () { copy(t); }); else copy(t); },
copyUser: function (t) { var a = codes(), x = a[parseInt(t.getAttribute("data-i"), 10)]; if (x) copy(x.code); },
revoke: function (t) { var a = codes(), x = a[parseInt(t.getAttribute("data-i"), 10)]; if (!x) return; if (!has(S.revs, x.sig)) S.revs.push(x.sig); save("revs", S.revs); renderCodes(); renderRevs(); toast("🚫 Code révoqué — publie pour diffuser."); },
pubRevs: function () { syncPush(true); },
dropClick: function () { $("pFile").click(); },
urlAdd: function () { var u = trm($("pUrl").value); if (!u) { toast("Saisis une URL d'image."); return; } compress(u, 1000, 0.72, function (e, d) { if (e) { addPend(u, $("pCap").value || u); toast("ℹ️ URL conservée en lien direct."); } else addPend(d, $("pCap").value || u); $("pUrl").value = ""; }); },
rmPend: function (t) { S.pend.splice(parseInt(t.getAttribute("data-i"), 10), 1); renderPend(); },
attach: function () { attach(); },
cancelEdit: function () { clearForm(); $("fTarget").value = "__new__"; cls($("newForm"), "hide", false); toast("Édition annulée."); },
pubFaults: function () { syncPush(true); },
expFaults: function () { dl("pannes-photos.json", JSON.stringify(S.ov, null, 1)); },
editFault: function (t) {
  var id = t.getAttribute("data-id"), e = null, i, b;
  for (i = 0; i < S.ov.entries.length; i++) if (S.ov.entries[i].id === id) e = S.ov.entries[i];
  if (!e) { toast("Panne introuvable."); return; }
  S.editId = e.id; $("mDetail").className = "modal"; showAdmin();
  b = $("tabsAdm").getElementsByTagName("button");
  for (i = 0; i < b.length; i++) if (b[i].getAttribute("data-a") === "faults") { ACT.tabAdm(b[i]); break; }
  $("fTarget").value = "__new__"; cls($("newForm"), "hide", false);
  $("nfTitle").innerHTML = H("Modifier la panne — ", esc(e.title));
  $("nTitle").value = e.title || ""; $("nMake").value = e.make || ""; $("nModel").value = e.model || "";
  $("nEngine").value = e.engine || ""; $("nPower").value = (e.powers || []).join(",");
  $("nYears").value = e.years ? e.years.join("-") : ""; $("nFuel").value = e.fuel || "";
  $("nSys").value = e.sys || ""; $("nDtc").value = (e.dtc || []).join(",");
  $("nSym").value = (e.sym || []).join(", "); $("nGrav").value = e.grav || "eleve";
  $("nSrc").value = e.url || ""; $("nMeca").value = e.meca || "";
  $("nCons").value = (e.cons || []).join("\n"); $("nInd").value = (e.ind || []).join("\n");
  $("nFire").checked = !!e.fire; $("nChain").value = e.chain || "";
},
delFault: function (t) { delFaults([t.getAttribute("data-id")]); },
moveUp: function (t) { var i = parseInt(t.getAttribute("data-i"), 10), a = S.ov.entries, x; if (i < 1) return; x = a.splice(i, 1)[0]; a.splice(i - 1, 0, x); persist(); renderFaults(); },
moveDown: function (t) { var i = parseInt(t.getAttribute("data-i"), 10), a = S.ov.entries, x; if (i >= a.length - 1) return; x = a.splice(i, 1)[0]; a.splice(i + 1, 0, x); persist(); renderFaults(); },
selOne: function (t) { var id = t.getAttribute("data-id"); if (t.checked) S.sel[id] = 1; else delete S.sel[id]; renderFaults(); },
selAll: function () { each(S.ov.entries, function (e) { S.sel[e.id] = 1; }); renderFaults(); },
selNone: function () { S.sel = {}; renderFaults(); },
bulkDel: function () { var ids = [], k; for (k in S.sel) if (S.sel.hasOwnProperty(k)) ids.push(k); if (!ids.length) { toast("Aucune panne sélectionnée."); return; } delFaults(ids); },
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
syShare: function () { var c = chan(), t; if (!c) { toast("Aucun canal."); return; } t = H("Code canal KEV TECH & FIRE : ", c, "\nÀ coller dans l'application (badge 📡 ou écran d'accès)."); if (navigator.share) navigator.share({ title: "Canal de synchronisation", text: t }).catch(function () { copy(t); }); else copy(t); },
syTest: function () { var c = trm($("syCh").value) || chan(); if (!c) { toast("Renseigne un code canal."); return; } AD[S.be].read(c, function (e, st) { if (e) { toast(H("❌ ", esc(e))); return; } toast(st ? "✅ Canal joignable et alimenté." : "⚠️ Canal joignable mais vide."); }); },
syPub: function () { syncPush(true); },
syPull: function () { syncPull(function () { toast("🔄 Synchronisation effectuée."); }); },
reload: function () { background(true, function () { toast("✅ Base rechargée."); }); },
importSites: function () { importSites(true); },
harvest: function () { harvest(); },
diag: function () { $("mDiag").className = "modal on"; paintChk(); },
diagClose: function () { $("mDiag").className = "modal"; },
goBase: function () {
  var b, i;
  if (S.admin) { showAdmin(); b = $("tabsAdm").getElementsByTagName("button"); for (i = 0; i < b.length; i++) if (b[i].getAttribute("data-a") === "base") { ACT.tabAdm(b[i]); break; } }
  else $("mDiag").className = "modal on";
},
askChan: function () { var c = window.prompt("Code canal de synchronisation :", chan()); if (c === null) return; setChan(trm(c)); syncPull(); },
hardReset: function () { try { localStorage.clear(); } catch (e) {} if (window.caches && caches.keys) caches.keys().then(function (ks) { each(ks, function (k) { caches.delete(k); }); }).catch(function () {}); setTimeout(function () { location.reload(); }, 400); },
errClose: function () { cls($("err"), "hide", true); },
expAll: function () { dl("base-complete.json", JSON.stringify({ version: new Date().toISOString(), entries: S.base, photos: S.ov.photos }, null, 1)); },
saveView: function () { var n = window.prompt("Nom de cette vue :", $("q").value || "Vue"), vs; if (!n) return; vs = save("views") || []; vs.push({ name: n, q: $("q").value, make: $("fMake").value, sys: $("fSys").value, grav: $("fGrav").value, sort: $("fSort").value, theme: S.theme }); save("views", vs.slice(-8)); renderViews(); toast("💾 Vue mémorisée."); },
loadView: function (t) {
  var vs = save("views") || [], v = vs[parseInt(t.getAttribute("data-i"), 10)], b, i;
  if (!v) return;
  $("q").value = v.q || ""; fillFilters();
  $("fMake").value = v.make || ""; $("fSys").value = v.sys || ""; $("fGrav").value = v.grav || ""; $("fSort").value = v.sort || "score";
  S.theme = v.theme || "tous"; document.documentElement.setAttribute("data-theme", S.theme);
  b = $("seg").getElementsByTagName("button");
  for (i = 0; i < b.length; i++) cls(b[i], "on", b[i].getAttribute("data-t") === S.theme);
  renderResults(); toast(H("📁 Vue « ", esc(v.name), " » chargée."));
},
clearViews: function () { save("views", []); renderViews(); toast("🗑️ Vues effacées."); }
};

/* ══════════ IMPORT FICHIER ══════════ */
function doImport(inp) {
  var files = [], i, idx = 0, count = 0;
  if (!S.admin) { toast("Import réservé à l'administrateur."); inp.value = ""; return; }
  for (i = 0; i < inp.files.length; i++) files.push(inp.files[i]);
  function step() {
    var f, fr;
    if (idx >= files.length) { persist(); fillFilters(); renderResults(); renderFaults(); stats(); inp.value = ""; toast(H("📥 Import terminé : ", count, " élément(s) fusionné(s).")); return; }
    f = files[idx]; idx++; fr = new FileReader();
    fr.onload = function () {
      var txt = String(fr.result || ""), j, a, nn, blocks;
      try {
        if (/\.json$/i.test(f.name)) {
          j = JSON.parse(txt); a = isArr(j) ? j : (j.entries || []); nn = normList(a);
          each(nn, function (e) { S.ov.entries.push(e); }); merge(nn); count += nn.length;
          if (j.photos) each(j.photos, function (p) { S.ov.photos.push(p); count++; });
        } else {
          blocks = txt.split(/\n\s*\n/);
          each(blocks, function (x) {
            var e;
            if (x.replace(/\s/g, "").length < 40) return;
            e = { id: H("doc-", uid()), themes: ["technique"], type: "document", source: "import", make: "Multi-marques", model: "Tous", title: H(f.name, " — extrait ", count + 1), meca: x.slice(0, 1800), cons: [], dtc: x.toUpperCase().match(/[PCBU]\d{4}/g) || [], fire: /incendie|feu/i.test(x), grav: "modere", date: new Date().toISOString().slice(0, 10) };
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

/* ══════════ ÉVÉNEMENTS ══════════ */
function bindEvents() {
  document.addEventListener("click", function (ev) {
    var t = upAct(ev.target), n, f;
    if (!t) return;
    n = t.getAttribute("data-act"); f = ACT[n]; if (!f) return;
    if (t.tagName === "A" || n === "dropClick") ev.preventDefault();
    try { f(t, ev); } catch (e) { window.onerror(H(n, ": ", e.message), "app.js", 0, 0, e); }
  }, false);

  document.addEventListener("input", function (ev) {
    var i = ev.target, n, bx, j, dtc, toks, w, h, o;
    if (!i || !i.id) return;
    try {
      if (i.id === "q") renderResults();
      else if (i.id === "fFilter") faultPicker();
      else if (i.id === "op") { $("opVal").innerHTML = H(i.value, "%"); $("wall").style.opacity = i.value / 100; }
      else if (i.id === "ctx") {
        n = nrm(i.value); bx = $("qcm").getElementsByTagName("input");
        for (j = 0; j < bx.length; j++) {
          if (n.indexOf(nrm(bx[j].value).split(" ")[0]) >= 0 && !bx[j].checked) { bx[j].checked = true; cls(bx[j].parentNode, "on", true); }
        }
        dtc = i.value.toUpperCase().match(/[PCBU]\d{4}/g) || [];
        if (dtc.length && !$("dtc").value) { $("dtc").value = uniq(dtc).join(", "); $("dtcOn").checked = true; cls($("dtc"), "hide", false); }
        toks = []; w = n.split(" ");
        for (j = 0; j < w.length; j++) if (w[j].length > 3) toks.push(w[j]);
        h = hyps(veh(), toks, dtc, checkedSym()).slice(0, 3); o = "";
        for (j = 0; j < h.length; j++) o = H(o, "<span class='tag ", h[j].e.fire ? "fire" : "", "'>", esc(String(h[j].e.title).slice(0, 44)), " · ", h[j].s, "</span>");
        $("live").innerHTML = o ? H("<b style='color:#ffc400'>🔎 Corrélations détectées :</b> ", o) : "";
      }
    } catch (e) { window.onerror(H("input: ", e.message), "app.js", 0, 0, e); }
  }, false);

  document.addEventListener("change", function (ev) {
    var i = ev.target, l, ok = false, j;
    if (!i) return;
    try {
      if (i.id === "vMake" || i.id === "vModel") {
        renderEng();
        l = enginesFor($("vMake").value, $("vModel").value);
        for (j = 0; j < l.length; j++) if (nrm(l[j].m) === nrm($("vEngine").value)) ok = true;
        if ($("vEngine").value && !ok) { $("vEngine").value = ""; $("vPower").value = ""; }
        renderPow(); renderAttrib();
      }
      else if (i.id === "vEngine") autoAttr();
      else if (i.id === "fMake" || i.id === "fSys" || i.id === "fGrav" || i.id === "fSort") renderResults();
      else if (i.id === "dtcOn") cls($("dtc"), "hide", !i.checked);
      else if (i.id === "fTarget") cls($("newForm"), "hide", i.value !== "__new__");
      else if (i.id === "syBe") { S.be = i.value; save("be", S.be); }
      else if (i.id === "syAuto") save("auto", i.checked);
      else if (i.id === "pFile" && i.files.length) { intake(i.files, $("pCap").value); i.value = ""; }
      else if (i.id === "bgFile" && i.files[0]) compress(i.files[0], 1600, 0.85, function (e, u) { if (e) { toast(H("❌ ", esc(e))); return; } S.look.bg = u; applyLook(); toast("🎨 Fond appliqué."); });
      else if (i.id === "carFile" && i.files[0]) compress(i.files[0], 900, 0.85, function (e, u) { if (e) { toast(H("❌ ", esc(e))); return; } S.look.car = u; applyLook(); toast("🚗 Véhicule animé appliqué."); });
      else if (i.id === "imp") doImport(i);
      else if (i.type === "checkbox" && inId(i, "qcm")) cls(i.parentNode, "on", i.checked);
    } catch (e) { window.onerror(H("change: ", e.message), "app.js", 0, 0, e); }
  }, false);

  document.addEventListener("keydown", function (ev) {
    var id = ev.target && ev.target.id;
    if (ev.key === "Enter" && id === "pwd") { ev.preventDefault(); ACT.login(); }
    else if (ev.key === "Enter" && id === "vin") { ev.preventDefault(); runVin(); }
    else if (ev.key === "Enter" && id === "pq") { ev.preventDefault(); photoSearch(); }
    else if (ev.key === "Enter" && id === "gCode") { ev.preventDefault(); ACT.gate(); }
    else if (ev.key === "Escape") { $("mLb").className = "modal"; $("mDiag").className = "modal"; $("mDetail").className = "modal"; }
  }, false);

  document.addEventListener("paste", function (ev) {
    var files = [], i, it, f;
    if (!S.admin || !ev.clipboardData || !ev.clipboardData.items) return;
    for (i = 0; i < ev.clipboardData.items.length; i++) { it = ev.clipboardData.items[i]; if (/^image\//.test(it.type)) { f = it.getAsFile(); if (f) files.push(f); } }
    if (!files.length) return;
    ev.preventDefault(); intake(files, "photo collée");
  }, false);

  var dz = $("drop");
  dz.addEventListener("dragenter", function (e) { e.preventDefault(); cls(dz, "on", true); });
  dz.addEventListener("dragover", function (e) { e.preventDefault(); cls(dz, "on", true); });
  dz.addEventListener("dragleave", function (e) { e.preventDefault(); cls(dz, "on", false); });
  dz.addEventListener("drop", function (e) { e.preventDefault(); cls(dz, "on", false); if (e.dataTransfer && e.dataTransfer.files.length) intake(e.dataTransfer.files, $("pCap").value); });

  each(["mLb", "mDiag", "mDetail"], function (id) { $(id).addEventListener("click", function (e) { if (e.target === $(id)) $(id).className = "modal"; }); });

  window.addEventListener("resize", function () { guard(resize, "redimensionnement"); });
  window.addEventListener("online", function () { net(); syncPull(); });
  window.addEventListener("offline", net);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { vis = false; if (raf) { window.cancelAnimationFrame(raf); raf = 0; } }
    else { startLoop(); syncPull(); }
  });
}

/* ══════════ ARRIÈRE-PLAN ══════════ */
function background(force, cb) {
  var c = save("cache");
  if (c && c.entries && c.entries.length) { merge(c.entries); chk("cache", "ok", H(c.entries.length, " fiches restaurées du cache")); }
  else chk("cache", "warn", "cache vide — premier lancement");
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
        save("cache", { ts: Date.now(), entries: S.base.slice(0, 2000) });
        checkUpd(!!force, function () {
          syncPull(function () {
            var rc = save("rcTs") || 0;
            function afterHarvest() {
              if (!save("siteDone") && navigator.onLine) importSites(false, function () { paintChk(); if (cb) cb(); });
              else { paintChk(); if (cb) cb(); }
            }
            if (navigator.onLine && (force || S.base.length < 100 || Date.now() - rc > 604800000)) harvest(afterHarvest);
            else afterHarvest();
          });
        });
      });
    });
  });
}

/* ══════════ DÉMARRAGE ══════════ */
function boot() {
  guard(function () {
    var h = "", i;
    for (i = 0; i < SYMPT.length; i++) h = H(h, "<label><input type='checkbox' value='", esc(SYMPT[i]), "'>", esc(SYMPT[i]), "</label>");
    $("qcm").innerHTML = h;
  }, "constatations");
  guard(function () { $("mail").value = S.mail; $("syBe").value = S.be; $("syCh").value = chan(); $("syAuto").checked = !!save("auto"); }, "champs admin");
  guard(resize, "canvas");
  guard(applyLook, "apparence");
  guard(bindEvents, "événements");
  chk("events", "ok", "contrôles liés par délégation — aucun gestionnaire manquant");
  guard(function () { each(["vMake", "vModel", "vEngine", "vPower", "q"], function (id) { suggest($(id)); }); }, "suggestions");
  guard(function () { feedWords($("ctx"), $("predCtx")); }, "rédaction prédictive");
   guard(function(){
  merge(SEED);
  if(window.KTF_FAULTS&&window.KTF_FAULTS.length)merge(normList(window.KTF_FAULTS));
  merge(S.ov.entries);rebuild();
 },"base");
 guard(function(){
  var n=(window.KTF_FAULTS&&window.KTF_FAULTS.length)||0;
  chk("mega",n?"ok":"warn",n?H(n," pannes documentées (méga base)"):"pannes.js absent");
 },"méga base");
  guard(loadLocalImport, "import local sites");
  guard(fillFilters, "filtres");
  guard(renderEng, "moteurs");
  guard(renderPow, "puissances");
  guard(renderResults, "résultats");
  guard(stats, "statistiques");
  guard(renderHisto, "historique");
  guard(renderOutbox, "messages");
  guard(quotaShow, "quota");
  guard(function () { setChan(chan()); }, "canal");
  guard(net, "réseau");
  chk("boot", "ok", "application autonome chargée — aucun script externe requis");
  chk("seed", "ok", H(SEED.length, " fiches embarquées, fonctionne hors ligne"));
  var st = "ok";
  try { localStorage.setItem("ktf:t", "1"); localStorage.removeItem("ktf:t"); } catch (e) { st = "warn"; }
  chk("store", st, st === "ok" ? "localStorage opérationnel" : "stockage restreint — session en mémoire");
  guard(startLoop, "animation");
  cls($("boot"), "off", true);
  var mode = save("mode"), acc = save("access");
  if (mode === "tiers" && acc && !has(S.revs, acc.sig)) { S.name = acc.name; showApp(); } else show("s-home");
  if (navigator.serviceWorker) navigator.serviceWorker.register("sw.js").then(function () { chk("sw", "ok", "enregistré — mode hors ligne actif"); }, function (e) { chk("sw", "warn", e.message || "enregistrement refusé"); });
  else chk("sw", "warn", "non supporté par ce navigateur");
  paintChk();
  setTimeout(function () { background(false); }, 400);
  setInterval(function () { syncPull(); if (S.admin && save("auto")) syncPush(false); }, 60000);
  window.__APP_OK = true;
}

window.KTF = { state: S, actions: ACT, syncPush: syncPush, syncPull: syncPull, harvest: harvest, importSites: importSites, enginesFor: enginesFor };
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

})();
