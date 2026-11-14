/* ============================================================================
   KDB — moteur relationnel de croisement dynamique  v2026.14
   db-core.js (KDB_RAW) + db-faults.js (KDB_FAULTS_RAW)
   Cascade marque → modèle → code moteur → puissance → pannes / rappels
   ========================================================================== */
(function () {
"use strict";

function nrm(s){s=(s==null?"":String(s)).toLowerCase();try{s=s.normalize("NFD").replace(/[\u0300-\u036f]/g,"");}catch(e){}return s.replace(/[^a-z0-9]+/g," ").replace(/^ +| +$/g,"");}
function trm(s){return String(s==null?"":s).replace(/^ +| +$/g,"");}
function arr(a){return Object.prototype.toString.call(a)==="[object Array]";}
function each(a,f){var i;if(!a)return;for(i=0;i<a.length;i++)f(a[i],i);}
function has(a,v){return a.indexOf(v)>=0;}
function uniq(a){var o=[],i;for(i=0;i<a.length;i++)if(!has(o,a[i]))o.push(a[i]);return o;}
function splitList(s){var o=[],a=String(s||"").split(/[,;]/),i,t;for(i=0;i<a.length;i++){t=trm(a[i]);if(t)o.push(t);}return o;}
function nums(s){var m=String(s||"").match(/\d{1,4}/g)||[],o=[],i,n;for(i=0;i<m.length;i++){n=parseInt(m[i],10);if(!isNaN(n))o.push(n);}return o;}
function range(s){var n=nums(s);if(!n.length)return null;return[Math.min.apply(null,n),Math.max.apply(null,n)];}
function years(s){var m=String(s||"").match(/(?:19|20)\d{2}/g)||[],o=[],i;for(i=0;i<m.length;i++)o.push(parseInt(m[i],10));if(!o.length)return null;return[Math.min.apply(null,o),Math.max.apply(null,o)];}
function inRange(v,r){return !!(v&&r&&v>=r[0]&&v<=r[1]);}
function hash(s){var h=2166136261,i;s=String(s);for(i=0;i<s.length;i++){h=h^s.charCodeAt(i);h=(h*16777619)>>>0;}return("00000000"+h.toString(36)).slice(-8);}
function fuelName(c){if(c==="d")return"diesel";if(c==="h")return"hybride";if(c==="el")return"electrique";return"essence";}
function fuelGuess(t){t=nrm(t);if(/electri|electric|kwh|bev|e tron|etron|e tech|zoe|leaf|ioniq|ev6|ev9|id 3|id 4|id 5|id 7|taycan|mach e|blade|lfp/.test(t))return"electrique";if(/hybrid|hybride|phev|hev|e power|dm i|erev|t8|4xe/.test(t))return"hybride";if(/diesel|tdi|hdi|dci|crdi|cdti|multijet|jtd|d 4d|d4d|skyactiv d|cdi|crd|tdci|durat|ecoblue|duratorq|cummins|duramax/.test(t))return"diesel";return"essence";}
function ccGuess(t){var m=String(t||"").match(/(\d[.,]\d)/);if(m)return Math.round(parseFloat(m[1].replace(",","."))*1000);m=String(t||"").match(/\b(1[0-9]{3}|2[0-9]{3}|3[0-9]{3}|4[0-9]{3}|5[0-9]{3}|6[0-9]{3})\b/);if(m)return parseInt(m[1],10);return 0;}

var K={ready:false,brands:[],models:[],engines:[],versions:[],faults:[],
 B:{},M:{},E:{},V:{},F:{},
 modelsByBrand:{},versionsByModel:{},versionsByModelEngine:{},enginesByModel:{},
 faultsByEngine:{},faultsByModel:{},faultsByBrand:{},engineBrands:{},
 systems:{},stats:{},dyn:{faults:[],vehicles:[]}};

function parseLines(txt,cb){var lines=String(txt||"").split("\n"),i,p;for(i=0;i<lines.length;i++){p=lines[i].split("|");if(p.length>=2)cb(p,i);}}
function faultKind(f){var t=nrm(H(f.title," ",f.source," ",f.sys));if(/rappel|campagne|recall|campaign|securite/.test(t))return"recall";return"panne";}
function H(){var s="",i,a;for(i=0;i<arguments.length;i++){a=arguments[i];if(a!=null)s+=String(a);}return s;}

function build(){
 var raw=window.KDB_RAW||{},seenM={};
 parseLines(raw.B,function(p){var b={id:p[0],name:p[1],alias:p[2]||"",group:p[3]||"",country:p[4]||""};b._n=nrm(b.name+" "+b.alias);K.brands.push(b);K.B[b.id]=b;});
 parseLines(raw.M,function(p){var id=p[0];if(seenM[id])id=id+"_"+hash(p.join("|"));seenM[p[0]]=id;var m={id:id,brandId:p[1],name:p[2],alias:p[3]||"",start:parseInt(p[4],10)||0,end:parseInt(p[5],10)||2027};m._n=nrm(m.name+" "+m.alias);m.brand=K.B[m.brandId]||null;K.models.push(m);K.M[m.id]=m;if(!K.modelsByBrand[m.brandId])K.modelsByBrand[m.brandId]=[];K.modelsByBrand[m.brandId].push(m);});
 parseLines(raw.E,function(p){var e={id:p[0],code:p[1],designation:p[2],cc:parseInt(p[3],10)||0,fuel:fuelName(p[4]),arch:p[5]||"",dist:p[6]||"",inj:p[7]||""};e._n=nrm(e.code+" "+e.designation+" "+e.arch+" "+e.dist+" "+e.inj);K.engines.push(e);K.E[e.id]=e;});
 parseLines(raw.V,function(p){var modelId=p[0],engineId=p[1],chs=nums(p[2]),start=parseInt(p[3],10)||0,end=parseInt(p[4],10)||2027,i,v,k;if(!K.M[modelId]||!K.E[engineId])return;for(i=0;i<chs.length;i++){v={id:modelId+"_"+engineId+"_"+chs[i],modelId:modelId,engineId:engineId,ch:chs[i],kw:Math.round(chs[i]/1.35962),start:start,end:end};v.model=K.M[modelId];v.engine=K.E[engineId];v.brand=v.model.brand;K.versions.push(v);K.V[v.id]=v;if(!K.versionsByModel[modelId])K.versionsByModel[modelId]=[];K.versionsByModel[modelId].push(v);k=modelId+"|"+engineId;if(!K.versionsByModelEngine[k])K.versionsByModelEngine[k]=[];K.versionsByModelEngine[k].push(v);if(!K.enginesByModel[modelId])K.enginesByModel[modelId]={};K.enginesByModel[modelId][engineId]=true;if(!K.engineBrands[engineId])K.engineBrands[engineId]={};K.engineBrands[engineId][v.model.brandId]=true;}});
 each(window.KDB_FAULTS_RAW||[],function(line){var p=String(line).split("|"),f;if(p.length<17)return;f={id:p[0],title:p[1],sys:p[2],grav:p[3],fire:p[4]==="1",targets:{E:splitList(p[5]),M:splitList(p[6]),B:splitList(p[7]),P:range(p[8]),Y:years(p[9])},dtc:splitList(p[10]),sym:splitList(p[11]),meca:p[12],cons:splitList(p[13]),ind:splitList(p[14]),chain:p[15],source:p[16]||"base-kevin"};f.kind=faultKind(f);f._h=nrm([f.title,f.sys,f.meca,f.cons.join(" "),f.sym.join(" "),f.dtc.join(" "),f.ind.join(" "),f.chain].join(" "));indexFault(f);K.faults.push(f);K.F[f.id]=f;if(f.sys)K.systems[f.sys]=1;});
 K.ready=true;computeStats();
}
function indexFault(f){each(f.targets.E,function(id){if(!K.faultsByEngine[id])K.faultsByEngine[id]=[];K.faultsByEngine[id].push(f);});each(f.targets.M,function(id){if(!K.faultsByModel[id])K.faultsByModel[id]=[];K.faultsByModel[id].push(f);});each(f.targets.B,function(id){if(!K.faultsByBrand[id])K.faultsByBrand[id]=[];K.faultsByBrand[id].push(f);});}
function computeStats(){var rec=0,i;for(i=0;i<K.faults.length;i++)if(K.faults[i].kind==="recall")rec++;K.stats={brands:K.brands.length,models:K.models.length,engines:K.engines.length,versions:K.versions.length,faults:K.faults.length,fire:K.faults.filter(function(f){return f.fire;}).length,recalls:rec,systems:Object.keys(K.systems).length};}

function getBrands(q){q=nrm(q);var o=[],i,b,n;for(i=0;i<K.brands.length;i++){b=K.brands[i];if(q&&b._n.indexOf(q)<0)continue;n=(K.modelsByBrand[b.id]||[]).length;o.push({id:b.id,name:b.name,alias:b.alias,group:b.group,country:b.country,models:n});}o.sort(function(a,b2){return a.name.localeCompare(b2.name);});return o;}
function getModels(brandId,q){q=nrm(q);var list=brandId?(K.modelsByBrand[brandId]||[]):K.models,o=[],i,m,n;for(i=0;i<list.length;i++){m=list[i];if(q&&m._n.indexOf(q)<0)continue;n=(K.versionsByModel[m.id]||[]).length;o.push({id:m.id,brandId:m.brandId,name:m.name,alias:m.alias,start:m.start,end:m.end,versions:n,brand:m.brand?m.brand.name:""});}o.sort(function(a,b2){return a.name.localeCompare(b2.name);});return o;}
function getEngines(brandId,modelId,q){q=nrm(q);var vs=modelId?(K.versionsByModel[modelId]||[]):[],map={},i,v,e,o=[],k;for(i=0;i<vs.length;i++){v=vs[i];if(brandId&&v.model.brandId!==brandId)continue;if(!map[v.engineId])map[v.engineId]={engine:v.engine,powers:{},years:[v.start,v.end],versions:0};map[v.engineId].powers[v.ch]=1;map[v.engineId].years[0]=Math.min(map[v.engineId].years[0],v.start);map[v.engineId].years[1]=Math.max(map[v.engineId].years[1],v.end);map[v.engineId].versions++;}for(k in map){if(!map.hasOwnProperty(k))continue;e=map[k].engine;if(q&&e._n.indexOf(q)<0)continue;o.push({id:e.id,code:e.code,designation:e.designation,cc:e.cc,fuel:e.fuel,arch:e.arch,dist:e.dist,inj:e.inj,powers:Object.keys(map[k].powers).map(Number).sort(function(a,b2){return a-b2;}),years:map[k].years,versions:map[k].versions});}o.sort(function(a,b2){return a.designation.localeCompare(b2.designation);});return o;}
function getPowers(brandId,modelId,engineId){var vs=K.versionsByModelEngine[modelId+"|"+engineId]||[],s={},i,o=[],k;for(i=0;i<vs.length;i++){if(brandId&&vs[i].model.brandId!==brandId)continue;s[vs[i].ch]=1;}for(k in s)if(s.hasOwnProperty(k))o.push(parseInt(k,10));o.sort(function(a,b2){return a-b2;});return o;}
function getVersions(sel){var vs=K.versions,o=[],i,v;for(i=0;i<vs.length;i++){v=vs[i];if(sel.brandId&&v.model.brandId!==sel.brandId)continue;if(sel.modelId&&v.modelId!==sel.modelId)continue;if(sel.engineId&&v.engineId!==sel.engineId)continue;if(sel.ch&&v.ch!==sel.ch)continue;if(sel.year&&!inRange(sel.year,[v.start,v.end]))continue;o.push(v);}return o;}

function resolveBrand(text){var q=nrm(text),i,b;if(!q)return null;for(i=0;i<K.brands.length;i++){b=K.brands[i];if(nrm(b.name)===q)return b;}for(i=0;i<K.brands.length;i++){b=K.brands[i];if(b._n.indexOf(q)>=0||q.indexOf(nrm(b.name))>=0)return b;}return null;}
function resolveModel(brandId,text){var q=nrm(text),list=brandId?(K.modelsByBrand[brandId]||[]):K.models,i,m;if(!q)return null;for(i=0;i<list.length;i++){m=list[i];if(nrm(m.name)===q)return m;}for(i=0;i<list.length;i++){m=list[i];if(m._n.indexOf(q)>=0||q.indexOf(nrm(m.name))>=0)return m;}return null;}
function resolveEngine(modelId,text){var q=nrm(text),es=getEngines(null,modelId,null),i,e;if(!q)return null;for(i=0;i<es.length;i++){e=es[i];if(nrm(e.code)===q||nrm(e.designation)===q)return e;}for(i=0;i<es.length;i++){e=es[i];if(nrm(e.code+" "+e.designation).indexOf(q)>=0||q.indexOf(nrm(e.designation))>=0)return e;}return null;}
function resolvePower(brandId,modelId,engineId,ch){var ps=getPowers(brandId,modelId,engineId),i,best=null,d,bd=1e9;ch=parseInt(ch,10)||0;if(!ch)return null;for(i=0;i<ps.length;i++){if(ps[i]===ch)return ps[i];d=Math.abs(ps[i]-ch);if(d<bd){bd=d;best=ps[i];}}return bd<=15?best:null;}
function resolveVehicle(v){var b=resolveBrand(v.make||v.brand||""),m=b?resolveModel(b.id,v.model||""):null,e=m?resolveEngine(m.id,v.engine||""):null,ch=e?resolvePower(b.id,m.id,e.id,v.power||v.ch):null;return{brand:b,model:m,engine:e,ch:ch,year:parseInt(v.year,10)||0,fuel:v.fuel||(e?e.fuel:""),versions:m?getVersions({brandId:b?b.id:null,modelId:m.id,engineId:e?e.id:null,ch:ch,year:parseInt(v.year,10)||0}):[]};}

function faultMatchesBrand(f,bid){var i,m;if(!bid)return true;if(has(f.targets.B,bid))return true;for(i=0;i<f.targets.M.length;i++){m=K.M[f.targets.M[i]];if(m&&m.brandId===bid)return true;}for(i=0;i<f.targets.E.length;i++){if(K.engineBrands[f.targets.E[i]]&&K.engineBrands[f.targets.E[i]][bid])return true;}return !f.targets.B.length&&!f.targets.M.length&&!f.targets.E.length;}
function candidateFaults(sel){var set={},out=[],i,f;function add(list){each(list||[],function(x){if(!set[x.id]){set[x.id]=1;out.push(x);}});}if(sel.engine&&sel.engine.id)add(K.faultsByEngine[sel.engine.id]);if(sel.model&&sel.model.id)add(K.faultsByModel[sel.model.id]);if(sel.brand&&sel.brand.id)add(K.faultsByBrand[sel.brand.id]);if(!out.length)out=K.faults.slice(0);else{for(i=0;i<K.faults.length;i++){f=K.faults[i];if(!f.targets.E.length&&!f.targets.M.length&&!f.targets.B.length)add([f]);}}return out;}
function scoreFault(f,sel,q){var s=0,why=[],i,toks=nrm(q||"").split(" "),t,brandId=sel.brand?sel.brand.id:null,modelId=sel.model?sel.model.id:null,engineId=sel.engine?sel.engine.id:null,ch=sel.ch||0,year=sel.year||0;
 if(engineId&&has(f.targets.E,engineId)){s+=14;why.push("code moteur exact");}
 if(modelId&&has(f.targets.M,modelId)){s+=10;why.push("modèle exact");}
 if(brandId&&has(f.targets.B,brandId)){s+=5;why.push("marque exacte");}
 if(ch&&f.targets.P&&inRange(ch,f.targets.P)){s+=5;why.push("puissance dans plage");}
 if(year&&f.targets.Y&&inRange(year,f.targets.Y)){s+=4;why.push("millésime dans plage");}
 if(sel.dtc&&sel.dtc.length)for(i=0;i<sel.dtc.length;i++)if(has(f.dtc,sel.dtc[i])){s+=9;why.push("DTC "+sel.dtc[i]);}
 if(sel.sym&&sel.sym.length)for(i=0;i<sel.sym.length;i++)if(f._h.indexOf(nrm(sel.sym[i]))>=0){s+=3;why.push("symptôme "+sel.sym[i]);}
 for(i=0;i<toks.length;i++){t=toks[i];if(t.length<3)continue;if(nrm(f.title).indexOf(t)>=0)s+=3;else if(f._h.indexOf(t)>=0)s+=1;}
 if(f.fire)s+=1;if(f.grav==="critique")s+=1;if(f.kind==="recall")s+=2;
 return{fault:f,score:s,why:uniq(why)};}
function gravRank(f){return f.grav==="critique"?3:f.grav==="eleve"?2:1;}
function searchFaults(opt){opt=opt||{};var sel={brand:opt.brand||null,model:opt.model||null,engine:opt.engine||null,ch:opt.ch||0,year:opt.year||0,dtc:opt.dtc||[],sym:opt.sym||[]},list=candidateFaults(sel),out=[],i,r,f;
 for(i=0;i<list.length;i++){f=list[i];
  if(opt.filterBrandId&&!faultMatchesBrand(f,opt.filterBrandId))continue;
  if(opt.theme==="incendie"&&!f.fire)continue;
  if(opt.sys&&nrm(f.sys)!==nrm(opt.sys))continue;
  if(opt.grav&&f.grav!==opt.grav)continue;
  if(opt.quick==="fire"&&!f.fire)continue;
  if(opt.quick==="dtc"&&!f.dtc.length)continue;
  if(opt.quick==="mega"&&f.source!=="base-kevin")continue;
  if(opt.quick==="recall"&&f.kind!=="recall")continue;
  r=scoreFault(f,sel,opt.text);if(opt.text&&r.score<=0)continue;out.push(r);}
 out.sort(function(a,b){if(opt.sort==="grav")return gravRank(b.fault)-gravRank(a.fault)||b.score-a.score;if(opt.sort==="az")return a.fault.title.localeCompare(b.fault.title);return b.score-a.score||gravRank(b.fault)-gravRank(a.fault);});
 return out;}
function searchVehicles(q){q=nrm(q);if(!q)return[];var toks=q.split(" "),out=[],i,j,m,b,s,t;for(i=0;i<K.models.length;i++){m=K.models[i];b=m.brand;s=0;for(j=0;j<toks.length;j++){t=toks[j];if(t.length<2)continue;if(b&&nrm(b.name).indexOf(t)>=0)s+=4;if(m._n.indexOf(t)>=0)s+=5;}if(s>=5)out.push({score:s,model:m,brand:b,engines:getEngines(b?b.id:null,m.id,null)});}out.sort(function(a,b2){return b2.score-a.score;});return out.slice(0,8);}

function addFaults(list){var added=0;each(list||[],function(f){if(!f||!f.id||!f.title)return;if(K.F[f.id]){K.F[f.id]=f;return;}f.targets=f.targets||{E:[],M:[],B:[],P:null,Y:null};f.dtc=f.dtc||[];f.sym=f.sym||[];f.cons=f.cons||[];f.ind=f.ind||[];f.kind=f.kind||faultKind(f);f._h=nrm([f.title,f.sys,f.meca,f.cons.join(" "),f.sym.join(" "),f.dtc.join(" "),f.ind.join(" "),f.chain].join(" "));indexFault(f);K.faults.push(f);K.F[f.id]=f;if(f.sys)K.systems[f.sys]=1;added++;});computeStats();return added;}

function addVehicleRow(o,source){
 var make=o.make||o.marque||o.brand||"",model=o.model||o.modele||"",engine=o.engine||o.motorisation||o.moteur||o.version||"",ch=nums(o.power||o.puissance||o.puissance_ch||o.ch||o.cv),i,b,m,e,vid,added=0;
 if(!make||!model)return 0;
 b=resolveBrand(make);
 if(!b){b={id:"X"+hash(make).slice(0,6).toUpperCase(),name:trm(make),alias:"",group:source||"externe",country:""};b._n=nrm(b.name);K.brands.push(b);K.B[b.id]=b;added++;}
 m=resolveModel(b.id,model);
 if(!m){m={id:b.id+"_X"+hash(model).slice(0,6).toUpperCase(),brandId:b.id,name:trm(model),alias:"",start:1990,end:2027};m._n=nrm(m.name);m.brand=b;K.models.push(m);K.M[m.id]=m;if(!K.modelsByBrand[b.id])K.modelsByBrand[b.id]=[];K.modelsByBrand[b.id].push(m);added++;}
 if(engine||ch.length){
  e=resolveEngine(m.id,engine);
  if(!e){e={id:"X"+hash(H(make,model,engine)).slice(0,8).toUpperCase(),code:trm(engine)||"EXT",designation:trm(engine)||"Motorisation externe",cc:ccGuess(o.cylindree||o.cc||engine),fuel:o.fuel||o.energie||fuelGuess(engine),arch:"",dist:"",inj:""};e._n=nrm(e.code+" "+e.designation);K.engines.push(e);K.E[e.id]=e;added++;}
  if(!ch.length)ch=[0];
  for(i=0;i<ch.length;i++){vid=m.id+"_"+e.id+"_"+ch[i];if(K.V[vid])continue;var v={id:vid,modelId:m.id,engineId:e.id,ch:ch[i],kw:Math.round(ch[i]/1.35962),start:parseInt(o.start||o.debut,10)||1990,end:parseInt(o.end||o.fin,10)||2027};v.model=m;v.engine=e;v.brand=b;K.versions.push(v);K.V[vid]=v;if(!K.versionsByModel[m.id])K.versionsByModel[m.id]=[];K.versionsByModel[m.id].push(v);var k=m.id+"|"+e.id;if(!K.versionsByModelEngine[k])K.versionsByModelEngine[k]=[];K.versionsByModelEngine[k].push(v);if(!K.enginesByModel[m.id])K.enginesByModel[m.id]={};K.enginesByModel[m.id][e.id]=true;if(!K.engineBrands[e.id])K.engineBrands[e.id]={};K.engineBrands[e.id][b.id]=true;added++;}
 }
 return added;
}

function externalFault(o,source){
 var title=o.title||o.defaut||o.titre||o.panne||o.libelle||o.nom||o.label||"",raw="",fire,b,m,e;
 if(!title)return null;
 try{raw=JSON.stringify(o);}catch(x){}
 fire=o.fire===true||o.risque_feu===true||/incendie|feu|flamme|inflamm/i.test(raw);
 b=resolveBrand(o.make||o.marque||"");m=b?resolveModel(b.id,o.model||o.modele||""):null;e=m?resolveEngine(m.id,o.engine||o.motorisation||""):null;
 return{id:o.id||("ext-"+hash(H(source,title,o.make||o.marque||"",o.model||o.modele||"",o.engine||o.motorisation||""))),title:String(title).slice(0,300),sys:o.sys||o.systeme||o.organe||o.component||"",grav:o.grav||o.gravite||(fire?"critique":"eleve"),fire:fire,kind:(o.type==="rappel"||o.campagne||/rappel|campagne|recall/i.test(H(title,source)))?"recall":"panne",targets:{E:e?[e.id]:[],M:m?[m.id]:[],B:b?[b.id]:[],P:range(o.powers||o.puissance||o.puissance_ch),Y:years(o.years||o.annees||o.annee)},dtc:splitList(o.dtc||o.codes||o.code),sym:splitList(o.sym||o.symptomes||o.symptoms),meca:o.meca||o.mecanisme||o.description||o.cause||o.motif_rappel||"",cons:splitList(o.cons||o.consequences||o.risques_encourus||o.risques),ind:splitList(o.ind||o.indices||o.preuves),chain:o.chain||o.chaine_feu||(fire?"Défaut documenté → mécanisme → risque incendie":""),source:source||"externe"};
}
function ingestExternal(data,source){
 var out={faults:0,vehicles:0},seen={};
 function walk(n){var i,f,v,key;if(!n)return;if(arr(n)){for(i=0;i<n.length;i++)walk(n[i]);return;}if(typeof n!=="object")return;
  f=externalFault(n,source);if(f&&!K.F[f.id]){addFaults([f]);K.dyn.faults.push(f);out.faults++;}
  v=addVehicleRow(n,source);if(v){K.dyn.vehicles.push(n);out.vehicles+=v;}
  for(key in n){if(!n.hasOwnProperty(key))continue;if(n[key]&&typeof n[key]==="object")walk(n[key]);}}
 walk(data);computeStats();return out;
}
function serializeDynamic(){return K.dyn;}
function loadDynamic(d){if(!d)return;each(d.faults||[],function(f){if(!K.F[f.id])addFaults([f]);});each(d.vehicles||[],function(v){addVehicleRow(v,"local");});K.dyn=d;computeStats();}
function integrity(){var checked=0,orphans=0,i,f;for(i=0;i<K.faults.length;i++){f=K.faults[i];each(f.targets.E,function(id){checked++;if(!K.E[id])orphans++;});each(f.targets.M,function(id){checked++;if(!K.M[id])orphans++;});each(f.targets.B,function(id){checked++;if(!K.B[id])orphans++;});}return{checked:checked,orphans:orphans};}

build();

window.KDB={ready:K.ready,stats:function(){return K.stats;},brands:getBrands,models:getModels,engines:getEngines,powers:getPowers,versions:getVersions,resolveBrand:resolveBrand,resolveModel:resolveModel,resolveEngine:resolveEngine,resolvePower:resolvePower,resolveVehicle:resolveVehicle,faults:searchFaults,searchVehicles:searchVehicles,systems:function(){return Object.keys(K.systems).sort();},addFaults:addFaults,ingestExternal:ingestExternal,allFaults:function(){return K.faults;},faultById:function(id){return K.F[id]||null;},brandById:function(id){return K.B[id]||null;},modelById:function(id){return K.M[id]||null;},engineById:function(id){return K.E[id]||null;},integrity:integrity,serializeDynamic:serializeDynamic,loadDynamic:loadDynamic};
})();
