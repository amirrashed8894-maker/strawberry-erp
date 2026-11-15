/* الراشد — تكاليف الفراولة ERP — محرك الحساب (بدون واجهة، يتجرب على node) */
(function(g){
'use strict';
/* ===== منسوخ حرفيًا من «تكلفة المجمدات» core.js v1.0.3 (frozen-costs) — نموذج التكلفة المقدرة ===== */
const DEF_SUPPLIES=[['كرتون جينريال 10ك بالهالك',1600],['باليت',334],['كيس',330],['لزق',71],['استرتش',41],['التعبئة بالسيزر',2000],['الورق',500],['زوايا',70],['ستيكر فحص',14],['داتا لوجر',15],['إكراميات',62],['عمولات شراء',840],['فحص / مصاريف أخرى',0]];
const DEF_INPUTS={carton:10,tons:24,usd:52,price:28,waste:0.75,over:10,overPrice:15,truckLoad:5,truckPrice:3500};
function fcDefaults(name){return{name:name,sizeLabel:'حجم 35 فأعلى',inputs:Object.assign({},DEF_INPUTS),supplies:DEF_SUPPLIES.map(function(s){return{name:s[0],v:s[1]}})}}
function parse(x){if(typeof x==='number')return isFinite(x)?x:NaN;
  var s=String(x==null?'':x).trim().replace(/[\u0660-\u0669]/g,function(c){return c.charCodeAt(0)-0x660}).replace(/[\u06F0-\u06F9]/g,function(c){return c.charCodeAt(0)-0x6F0})
    .replace(/\u066B/g,'.').replace(/[\u066C\s\u00A0\u202F]/g,'').replace(/[\u2212\u2013]/g,'-');
  if(s==='')return NaN;
  if(/^[-+]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s))s=s.replace(/,/g,'');
  else if(/^[-+]?\d*,\d+$/.test(s))s=s.replace(',','.');
  if(!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s))return NaN;
  return parseFloat(s)}
function n(x){var v=parse(x);return isFinite(v)?v:0}
function fcCalc(v){
  var I={};for(var k in v.inputs)I[k]=n(v.inputs[k]);
  var net=I.tons*1000,w=I.waste/100,o=I.over/100;
  var den=(1-w)*(1-o);var raw=den>0?net/den:0;
  var wasteKg=raw*w,overKg=(raw-wasteKg)*o;
  var trucks=I.truckLoad>0?Math.ceil(raw/1000/I.truckLoad-1e-9):0;
  var T=I.tons>0?I.tons:0;
  var buy=I.price*1000,wasteC=T?wasteKg*I.price/T:0,overC=T?overKg*(I.price-I.overPrice)/T:0,trans=T?trucks*I.truckPrice/T:0;
  var rawLines=[{name:'شراء الخام (1 طن)',v:buy},{name:'تكلفة الهالك',v:wasteC},{name:'تكلفة '+(v.sizeLabel||'الحجم الكبير')+' (فرق السعر)',v:overC},{name:'نقل الخام',v:trans}];
  var rawT=buy+wasteC+overC+trans;
  var sup=(v.supplies||[]).map(function(s){return{name:s.name,v:n(s.v)}});
  var supT=sup.reduce(function(a,s){return a+s.v},0);
  var total=rawT+supT,usd=I.usd>0?total/I.usd:0;
  return{I:I,net:net,raw:raw,wasteKg:wasteKg,overKg:overKg,trucks:trucks,buy:buy,wasteC:wasteC,overC:overC,trans:trans,rawLines:rawLines,rawT:rawT,sup:sup,supT:supT,total:total,usd:usd,
    kg:total/1000,kgUsd:usd/1000,carton:total/1000*I.carton,cartonUsd:usd/1000*I.carton,cont:total*I.tons,contUsd:usd*I.tons,
    rawPct:total?rawT/total*100:0,supPct:total?supT/total*100:0}
}
/* ===== نهاية المنسوخ ===== */

const STOCK_ITEMS=[['كرتون جينريال 10ك بالهالك','كرتونة'],['باليت','باليت'],['كيس','كيس'],['لزق','بكرة'],['استرتش','بكرة'],['الورق','وحدة'],['زوايا','قطعة'],['ستيكر فحص','ستيكر'],['داتا لوجر','جهاز'],['ستيكر صغير','ستيكر'],['ستيكر كبير 10×10','ستيكر']];
const COST_CATS=['التعبئة بالسيزر','رسوم المصنع / التشغيل','عمالة','تجميد','تخزين مبرد','إكراميات','عمولات شراء','فحص / مصاريف أخرى','أخرى'];
const FACTORIES=['الثلاجة العربية','الحسن','الفجر','بوناتيرا'];
const VARIETIES=['فراولة','بروكلي','قرنبيط','خرشوف'];
const PTYPES={raw:'مورد خام',supply:'مورد مستلزمات',transport:'مورد نقل',service:'مورد خدمات / مصنع',export:'عميل تصدير',farz:'عميل فرزة'};
const COLLS=['settings','factories','varieties','items','parties','purchases','transports','payments','supplyIn','transfers','runs','sales'];

function nowIso(){return new Date().toISOString()}
const SEED_T='2000-01-01T00:00:00.000Z';
function seed(){
  const t=SEED_T,D={};COLLS.forEach(c=>D[c]=[]);
  D.settings.push({id:'main',farzMethod:'credit',cartonKg:10,sackKg:25,usdRate:52,lastBackup:null,changedSince:false,createdAt:t,updatedAt:t});
  FACTORIES.forEach((x,i)=>D.factories.push({id:'fac'+(i+1),name:x,createdAt:t,updatedAt:t}));
  VARIETIES.forEach((x,i)=>{const e=fcDefaults(x);delete e.name;D.varieties.push({id:'var'+(i+1),name:x,est:e,estNeeds:i>0,createdAt:t,updatedAt:t})});
  STOCK_ITEMS.forEach((x,i)=>D.items.push({id:'itm'+(i+1),name:x[0],unit:x[1],refPrice:'',createdAt:t,updatedAt:t}));
  D.parties.push({id:'cus-fussga',type:'export',name:'فوسجا أجروفود لعموم التصدير',nameEn:'FUSSGA AGROFOODS',cr:'18876',tax:'448-166-970',address:'دمنهور',phone:'',open:'',openSide:'d',createdAt:t,updatedAt:t});
  return D}

/* ===== تواريخ ===== */
function dmy(iso){if(!iso)return '';const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(iso);return m?m[3]+'/'+m[2]+'/'+m[1]:iso}
function parseDmy(s){s=String(s||'').trim().replace(/[\u0660-\u0669]/g,c=>c.charCodeAt(0)-0x660).replace(/[\u06F0-\u06F9]/g,c=>c.charCodeAt(0)-0x6F0);
  let m=/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(s);if(!m)return null;const d=+m[1],mo=+m[2],y=+m[3];
  const dt=new Date(Date.UTC(y,mo-1,d));if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==mo-1||dt.getUTCDate()!==d)return null;
  return y+'-'+String(mo).padStart(2,'0')+'-'+String(d).padStart(2,'0')}
function cairoIso(d){return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).format(d||new Date())}
function cairoTime(d){return new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Cairo',hour:'2-digit',minute:'2-digit',hour12:false}).format(d||new Date())}

/* ===== الحساب الكامل ===== */
function byId(a){const o={};a.forEach(x=>o[x.id]=x);return o}
function ord(a,b){return (a.date||'').localeCompare(b.date||'')||(a.createdAt||'').localeCompare(b.createdAt||'')}

/* رصيد أول المدة لحساب: مبلغ + له/عليه + تاريخ + عملة (الدولار بيتحول بسعره، والدفتر بالجنيه) */
function openInfo(p){const o=n(p.open);if(!(o>0))return null;const usd=p.openCur==='USD',rate=usd?n(p.openRate):1,egp=o*rate,side=p.openSide==='c'?'c':'d',od=/^\d{4}-\d{2}-\d{2}/.test(p.openDate||'')?p.openDate:'';
  return{amt:o,usd,rate,egp,side,date:od,txt:'رصيد أول المدة'+(od?' في '+dmy(od):'')+(usd?' — $'+fmt(o,2)+' × '+fmt(rate,2):'')+' — '+(side==='c'?'له':'عليه')}}
/* مكونات التعبئة (BOM) للفراولة — حسب أمير 14/11/2026: لكل كرتونة (10 كجم صافي) / لكل باليت (120 كرتونة) / لكل حاوية (2400 كرتونة = 20 باليت).
   اللزق تكلفة لكل كرتونة (71 ج/طن نهائي = 0.71 ج/كرتونة) حسب برنامج تكلفة المجمدات - فراولة، مش كمية مخزن. الخدمات لكل حاوية بتتوزع على الكرتونة في تكلفة التشغيلة. */
const DEF_BOM={src:'حسب أمير 14/11/2026',perPal:120,perCont:2400,lines:[
  {k:'ctn',stage:'run',itemId:'itm1',base:'ctn',qty:1},{k:'bag',stage:'run',itemId:'itm3',base:'ctn',qty:1,note:'كيس أزرق كبير'},{k:'stS',stage:'run',itemId:'itm10',base:'ctn',qty:1,price:0.22,note:'220 ج لكل 1000'},
  {k:'pal',stage:'load',itemId:'itm2',base:'pal',qty:1,note:'باليت خشب'},{k:'cor',stage:'load',itemId:'itm7',base:'pal',qty:4,price:20,note:'20 ج للواحدة'},
  {k:'stL',stage:'load',itemId:'itm11',base:'cont',qty:1500,price:0.3,note:'10×10 — 300 ج لكل 1000'},{k:'dl',stage:'load',itemId:'itm9',base:'cont',qty:1,price:240,note:'240 ج للواحد'},{k:'str',stage:'load',itemId:'itm5',base:'cont',qty:2}],
  services:[{k:'tape',stage:'run',name:'لزق (من تحت ومن فوق)',base:'ctn',amount:0.71,match:'لزق',itemId:'itm4',src:'حسب برنامج تكلفة المجمدات - فراولة (71 ج/طن)'},{k:'pack',stage:'run',name:'التعبئة بالسيزر (رسم تعبئة المصنع)',base:'ctn',amount:20,match:'سيزر|^ *التعبئة',toFactory:true,src:'حسب برنامج تكلفة المجمدات - فراولة (2000 ج/طن) — مصروف منفصل عن العمولات'},{k:'comm',stage:'load',name:'عمولات شراء الخام والتعبئة',base:'cont',amount:20000,match:'عمول'},{k:'docs',stage:'load',name:'أوراق ومستندات',base:'cont',amount:12000,match:'أوراق|اوراق|مستند'},{k:'tips',stage:'load',name:'إكراميات',base:'cont',amount:1500,match:'إكرامي|اكرامي'}]};
const BASE_L={ctn:'لكل كرتونة',pal:'لكل باليت',cont:'لكل حاوية'};
/* v1.2.5: كل بند ليه مرحلة: 'run' = بيتصرف عند التشغيل (بالتناسب مع الكراتين)، 'load' = عند التحميل للعميل (لكل حاوية بوحدات كاملة) */
function bomOf(S){const b0=S&&S.bom;const b=b0&&b0.lines?JSON.parse(JSON.stringify(b0)):JSON.parse(JSON.stringify(DEF_BOM));
  b.lines.forEach(l=>{if(l.stage!=='run'&&l.stage!=='load')l.stage=l.base==='ctn'?'run':'load'});(b.services||(b.services=[])).forEach(v=>{if(v.stage!=='run'&&v.stage!=='load')v.stage=v.base==='ctn'?'run':'load'});return b}
/* v1.2.6: سعر الزوايا 20 ج والداتا لوجر 240 ج في المكونات المحفوظة لو فاضي/صفر — من غير ما نكتب على سعر المستخدم لو مختلف */
function patchBom126(s){
  if(!s||!s.bom||!Array.isArray(s.bom.lines))return {changed:false,s:s,cor:'none',dl:'none',note:'',kept:{}};
  const x=JSON.parse(JSON.stringify(s));
  const one=(key,itemId,price)=>{const l=x.bom.lines.find(l=>l.k===key||l.itemId===itemId);if(!l)return {st:'absent'};
    const raw=l.price,empty=raw==null||String(raw).trim()===''||!(n(raw)>0);
    if(empty){l.price=price;return {st:'set',from:raw}}if(Math.abs(n(raw)-price)<1e-9)return {st:'same',from:n(raw)};return {st:'keep',from:n(raw)}};
  const cor=one('cor','itm7',20),dl=one('dl','itm9',240),changed=cor.st==='set'||dl.st==='set';
  const bits=[];if(cor.st==='set')bits.push('الزوايا 20 ج للواحدة');if(dl.st==='set')bits.push('الداتا لوجر 240 ج للواحد');
  const kept={};if(cor.st==='keep')kept.cor=cor.from;if(dl.st==='keep')kept.dl=dl.from;
  return {changed,s:changed?x:s,cor:cor.st,dl:dl.st,note:bits.length?'ترحيل 1.2.6: '+bits.join('، '):'',kept}}
/* التحميل: وحدات كاملة لكل حاوية — الباليتات = تقريب لفوق (الكراتين ÷ 120)، الزوايا = 4 × الباليتات، والباقي لكل حاوية زي ما هو */
function loadPal(N,b){N=n(N);return N>0?Math.ceil(N/(n(b.perPal)||120)-1e-9):0}
function bomLoadQty(l,N,b){const q=n(l.qty);if(l.base==='pal')return loadPal(N,b)*q;if(l.base==='ctn')return Math.ceil(n(N)*q-1e-9);return q}
function bomLoadSvc(sv,N,b){const a=n(sv.amount);if(sv.base==='pal')return Math.round(a*loadPal(N,b)*100)/100;if(sv.base==='ctn')return Math.round(a*n(N)*100)/100;return a}
/* الكمية لتشغيلة فيها N كرتونة: كسور بالتناسب (مثلاً 900 كرتونة = 7.5 باليت = 0.375 حاوية) ومتقربة لـ 3 أرقام عشرية */
function bomQty(l,N,b){N=n(N);const q=n(l.qty),pp=n(b.perPal)||120,pc=n(b.perCont)||2400;let x;
  if(l.base==='pal')x=N/pp*q;else if(l.base==='cont')x=N/pc*q;else x=N*q;
  return Math.round(x*1000)/1000}
function bomSvc(sv,N,b){const f=sv.base==='ctn'?1:sv.base==='pal'?1/(n(b.perPal)||120):1/(n(b.perCont)||2400);return Math.round(n(sv.amount)*n(N)*f*100)/100}
/* أصناف مستلزمات جديدة في البذور (الستيكر الصغير والكبير) لو البيانات أقدم منها — في الذاكرة بس زي باقي البذور (مابتترفعش غير لو اتعدلت) */
function ensureSeedItems(D){if(!D.items)return 0;const have={};D.items.forEach(i=>have[i.id]=1);let k=0;seed().items.forEach(it=>{if(!have[it.id]&&/^itm1[01]$/.test(it.id)){D.items.push(it);k++}});return k}
function compute(D){
  const S=D.settings[0]||{},method=S.farzMethod==='joint'?'joint':'credit';
  const PT=byId(D.parties),IT=byId(D.items),RN=byId(D.runs);
  /* فواتير الخام */
  const P={};
  D.purchases.forEach(p=>{const net=pNet(p),d=n(p.disc),payKg=net*(1-d/100),price=n(p.price),amount=payKg*price;
    P[p.id]={id:p.id,rec:p,net,payKg,d,price,amount,discKg:net-payKg,discVal:(net-payKg)*price,trans:0,used:0,uses:[],sacks:n(p.sacks),sackKg:n(p.sackKg)||n(S.sackKg)||25}});
  /* النقل: المربوط بفواتير بيتوزع على صافي وزنها، والمربوط بتشغيلة بس بيبقى تكلفة مشتركة للتشغيلة */
  const runTrans={},unlinkedTrans=[];
  D.transports.forEach(t=>{const amt=n(t.amount),ids=(t.purchaseIds||[]).filter(id=>P[id]);
    if(ids.length){const tot=ids.reduce((a,id)=>a+P[id].net,0);ids.forEach(id=>{P[id].trans+=tot?amt*P[id].net/tot:amt/ids.length})}
    else if(t.runId&&RN[t.runId])(runTrans[t.runId]=runTrans[t.runId]||[]).push({t,amt});
    else unlinkedTrans.push(t)});
  Object.values(P).forEach(x=>{x.unit=x.net?x.amount/x.net:0;x.transKg=x.net?x.trans/x.net:0;x.costKg=x.unit+x.transKg});
  D.runs.forEach(r=>(r.inputs||[]).forEach(i=>{const p=P[i.purchaseId];if(p){p.used+=n(i.kg);p.uses.push({runId:r.id,kg:n(i.kg)})}}));
  Object.values(P).forEach(x=>{x.remain=x.net-x.used});

  /* المستلزمات: متوسط مرجح متحرك لكل صنف، والكميات حسب المكان */
  const SUP={},issue={},supplyAmt={};
  const BL=bomOf(S).lines;D.items.forEach(it=>SUP[it.id]={qty:0,val:0,loc:{},last:0,ref:n(it.refPrice)||n((BL.find(l=>l.itemId===it.id)||{}).price),inQty:0,inVal:0,outQty:0,outVal:0});
  const ev=[];
  /* المخزون الافتتاحي لكل صنف ولكل مخزن: كمية + تكلفة الوحدة + تاريخ — بيدخل المتوسط المرجح زي الوارد */
  D.items.forEach(it=>(it.openStock||[]).forEach((l,ix)=>{const q=n(l.qty);if(q>0&&l.locId)ev.push({k:0,o:1,date:l.date||'',createdAt:'',item:it.id,q,pr:n(l.cost),loc:l.locId,open:1})}));
  D.supplyIn.forEach(s=>{let tot=0;(s.lines||[]).forEach(l=>{const q=n(l.qty),pr=n(l.price);tot+=q*pr;ev.push({k:0,date:s.date,createdAt:s.createdAt,item:l.itemId,q,pr,loc:s.locId})});supplyAmt[s.id]=tot});
  D.transfers.forEach(s=>(s.lines||[]).forEach(l=>ev.push({k:1,date:s.date,createdAt:s.createdAt,item:l.itemId,q:n(l.qty),from:s.fromId,to:s.toId,tid:s.id})));
  D.runs.forEach(r=>(r.supplies||[]).forEach((l,ix)=>ev.push({k:2,date:r.date,createdAt:r.createdAt,item:l.itemId,q:n(l.qty),loc:l.locId||r.factoryId,run:r.id,ix})));
  /* مستلزمات التحميل لكل حاوية في فاتورة التصدير — من مخزن مصنع التحميل */
  const loadIss={};D.sales.forEach(s=>{if(s.kind==='farz'||!s.cont)return;(s.lines||[]).forEach((l,li)=>{const ld=l.ld;if(!ld)return;const rr=RN[l.runId]||{};(ld.sup||[]).forEach((x,ix)=>{const q=n(x.qty);if(q>0)ev.push({k:3,date:s.date,createdAt:s.createdAt,item:x.itemId,q,loc:ld.locId||rr.factoryId,sale:s.id,li,ix})})})});
  ev.sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(b.o||0)-(a.o||0)||a.k-b.k||(a.createdAt||'').localeCompare(b.createdAt||''));
  const warns=[];
  ev.forEach(e=>{const s=SUP[e.item];if(!s)return;
    if(e.k===0){s.qty+=e.q;s.val+=e.q*e.pr;if(e.pr>0||!e.open)s.last=e.pr;s.loc[e.loc]=(s.loc[e.loc]||0)+e.q;if(e.open){s.openQty=(s.openQty||0)+e.q;s.openVal=(s.openVal||0)+e.q*e.pr}else{s.inQty+=e.q;s.inVal+=e.q*e.pr}}
    else if(e.k===1){const have=s.loc[e.from]||0;if(have+1e-9<e.q)warns.push({type:'transfer',id:e.tid,item:e.item,need:e.q,have});s.loc[e.from]=have-e.q;s.loc[e.to]=(s.loc[e.to]||0)+e.q}
    else{const have=s.loc[e.loc]||0,avg=s.qty>1e-9?s.val/s.qty:(s.last||s.ref||0),cost=e.q*avg;const short=have+1e-9<e.q;
      if(short)warns.push(e.k===3?{type:'load',sale:e.sale,li:e.li,item:e.item,need:e.q,have,loc:e.loc}:{type:'issue',run:e.run,item:e.item,need:e.q,have,loc:e.loc});
      s.qty-=e.q;s.val-=cost;if(Math.abs(s.qty)<1e-9){s.qty=0;s.val=0}s.loc[e.loc]=have-e.q;s.outQty+=e.q;s.outVal+=cost;
      const rec={itemId:e.item,qty:e.q,avg,cost,loc:e.loc,short,noPrice:!(avg>0)};
      if(e.k===3){const a=loadIss[e.sale]=loadIss[e.sale]||[];(a[e.li]=a[e.li]||[])[e.ix]=rec}else (issue[e.run]=issue[e.run]||[])[e.ix]=rec}});
  Object.values(SUP).forEach(s=>{s.avg=s.qty>1e-9?s.val/s.qty:(s.last||s.ref||0)});

  /* مبيعات الفرزة الفعلية لكل تشغيلة (صافي بعد مصروفات البيع) — ده اللي بيتخصم من التكلفة، مش سعر التقدير */
  const FS={};
  D.sales.forEach(s=>{if(s.kind!=='farz')return;const rate=s.cur==='USD'?n(s.rate):1;const L=[];(s.lines||[]).forEach(l=>{const kg=n(l.kg),rv=kg*n(l.price)*rate,al=allocOf(l);if(!al){L.push({runId:l.runId,kg,rev:rv});return}const t=al.reduce((a,x)=>a+n(x.kg),0);al.forEach(x=>L.push({runId:x.runId,kg:n(x.kg),rev:t?rv*n(x.kg)/t:rv/al.length}))});
    const rev=L.reduce((a,l)=>a+l.rev,0),exp=(s.expenses||[]).reduce((a,e)=>a+n(e.amount),0);
    L.forEach(l=>{const f=FS[l.runId]=FS[l.runId]||{kg:0,rev:0,net:0,sales:[]};const net=l.rev-(rev?exp*l.rev/rev:(L.length?exp/L.length:0));f.kg+=l.kg;f.rev+=l.rev;f.net+=net;f.sales.push({saleId:s.id,no:s.no,date:s.date,kg:l.kg,rev:l.rev,net})})});
  /* التشغيلات */
  const R={};
  D.runs.forEach(r=>{R[r.id]=runCost(r,{P,PT,IT,S,method,issue:issue[r.id]||[],runTrans:runTrans[r.id]||[],farzSold:FS[r.id]})});

  /* المبيعات */
  const SL={},sold={};D.runs.forEach(r=>sold[r.id]={fin:0,farz:0});
  D.sales.forEach(s=>{const x=saleInfo(s,{R,RN,S,loadIss});SL[s.id]=x;x.lines.forEach(l=>l.parts.forEach(q=>{if(sold[q.runId])sold[q.runId][x.kind==='farz'?'farz':'fin']+=q.kg}))});
  Object.keys(R).forEach(id=>{const r=R[id],so=sold[id];r.soldFin=so.fin;r.soldFarz=so.farz;r.stockFin=r.fin-so.fin;r.stockFarz=r.farz-so.farz});
  /* ربحية التشغيلة: إيراد سطورها ناقص تكلفتها ناقص نصيبها من مصروفات البيع */
  Object.values(R).forEach(r=>{r.sales={rev:0,cogs:0,exp:0,load:0,profit:0,finRev:0,farzRev:0}});
  Object.values(SL).forEach(x=>x.lines.forEach(l=>l.parts.forEach(q=>{const r=R[q.runId];if(!r)return;const ex=x.rev?x.exp*q.egp/x.rev:(x.lines.length?x.exp/x.lines.length*q.share:0);
    r.sales.rev+=q.egp;r.sales.cogs+=q.cogs;r.sales.exp+=ex;r.sales.load+=q.load;r.sales[x.kind==='farz'?'farzRev':'finRev']+=q.egp})));
  Object.values(R).forEach(r=>{r.sales.profit=r.sales.rev-r.sales.cogs-r.sales.exp-r.sales.load;r.stockVal=r.stockFin*r.finKgCost+r.stockFarz*r.farzStockKg});

  /* الحسابات */
  const L={};D.parties.forEach(p=>{L[p.id]=[];const oi=openInfo(p);if(oi)L[p.id].push({date:oi.date,ord:0,kind:'open',ref:p.id,doc:'رصيد افتتاحي',info:oi.txt,desc:oi.txt,usd:oi.usd,rate:oi.rate,dr:oi.side==='c'?0:oi.egp,cr:oi.side==='c'?oi.egp:0})});
  const post=(pid,e)=>{if(L[pid])L[pid].push(e)};
  D.purchases.forEach(p=>{const x=P[p.id];post(p.supplierId,{date:p.date,createdAt:p.createdAt,kind:'purchase',doc:'فاتورة خام',info:'صافي الميزان '+fmt(x.net,0)+' كجم'+(x.d?'، خصم '+(+x.d.toFixed(2))+'%، المحاسب عليه '+fmt(x.payKg,x.payKg%1?1:0)+' كجم':'')+'، سعر '+fmt(x.price,2)+' ج'+(p.plate?'، عربية '+p.plate:''),ref:p.id,no:p.no,desc:'فاتورة خام #'+(p.no||'')+' — صافي '+fmt(x.net,0)+' كجم'+(x.d?' − خصم '+fmt(x.d,2)+'% = '+fmt(x.payKg,1)+' كجم':'')+' × '+fmt(x.price,2),dr:0,cr:x.amount})});
  D.transports.forEach(t=>post(t.transporterId,{date:t.date,createdAt:t.createdAt,kind:'transport',doc:'نقل',info:'نقلة'+(t.plate?' — '+t.plate:'')+(t.notes?' — '+t.notes:''),ref:t.id,no:t.no,desc:'نقل #'+(t.no||'')+(t.plate?' — '+t.plate:'')+(t.notes?' — '+t.notes:''),dr:0,cr:n(t.amount)}));
  D.supplyIn.forEach(s=>post(s.supplierId,{date:s.date,createdAt:s.createdAt,kind:'supplyIn',doc:'فاتورة مستلزمات',info:'مستلزمات'+(s.invNo?' — فاتورة المورد '+s.invNo:''),ref:s.id,no:s.no,desc:'فاتورة مستلزمات #'+(s.no||'')+(s.invNo?' (فاتورة المورد '+s.invNo+')':''),dr:0,cr:supplyAmt[s.id]||0}));
  D.runs.forEach(r=>(r.costs||[]).forEach(c=>{if(c.partyId)post(c.partyId,{date:r.date,createdAt:r.createdAt,kind:'runCost',doc:'تكلفة تشغيل',info:(c.name||'تكلفة')+' — تشغيلة #'+(r.no||''),ref:r.id,no:r.no,desc:(c.name||'تكلفة')+' — تشغيلة #'+(r.no||''),dr:0,cr:n(c.amount)})}));
  D.sales.forEach(s=>{const x=SL[s.id];if(x.cont){const $=x.cur==='USD'?'$':'',u=x.cur==='USD'?'':' ج';post(s.customerId,{date:s.date,createdAt:s.createdAt,kind:'sale',doc:'فاتورة بيع تصدير',ref:s.id,no:s.no,inv:x.invNo,info:(x.invNo?'فاتورة '+x.invNo+' — ':'')+contN(x.nCont)+' — '+fmt(x.tons,3)+' طن'+(x.cur==='USD'?' — $'+fmt(x.amount,2)+' × '+fmt(x.rate,2):''),desc:'بيع تصدير #'+(s.no||'')+(x.invNo?' — فاتورة '+x.invNo:'')+' — '+contN(x.nCont),subs:x.lines.map((l,i)=>({i:i+1,cont:l.cont,bl:l.bl,tons:l.tons,price:l.price,amount:l.amount,cur:x.cur,txt:'حاوية '+(l.cont||'—')+(l.bl?' · بوليصة '+l.bl:'')+' · '+fmt(l.tons,3)+' طن · سعر الكيلو '+$+pfmt(l.price)+u+' · القيمة '+$+fmt(l.amount,2)+u})),dr:x.rev,cr:0})}else post(s.customerId,{date:s.date,createdAt:s.createdAt,kind:'sale',doc:x.kind==='farz'?'فاتورة بيع فرزة':'فاتورة بيع تصدير',info:fmt(x.kg,0)+' كجم'+(x.cur==='USD'?' — $'+fmt(x.amount,2)+' × '+fmt(x.rate,2):'')+(s.invNo?' — فاتورة '+s.invNo:''),ref:s.id,no:s.no,desc:(x.kind==='farz'?'بيع فرزة':'بيع تصدير')+' #'+(s.no||'')+(x.cur==='USD'?' — $'+fmt(x.amount,2)+' × '+fmt(x.rate,2):'')+(s.invNo?' — فاتورة '+s.invNo:''),dr:x.rev,cr:0});
    if(x.cont)x.lines.forEach((l,li)=>l.loadSvcs.forEach(v=>{if(v.partyId&&v.amount)post(v.partyId,{date:s.date,createdAt:s.createdAt,kind:'loadSvc',doc:'خدمة تحميل',info:v.name+' — حاوية '+(l.cont||(li+1))+(x.invNo?' — فاتورة '+x.invNo:''),ref:s.id,no:s.no,desc:v.name+' — حاوية '+(l.cont||(li+1)),dr:0,cr:v.amount})}));
    (s.expenses||[]).forEach(e=>{if(e.partyId)post(e.partyId,{date:s.date,createdAt:s.createdAt,kind:'saleExp',doc:'مصروف بيع',info:(e.name||'مصروف')+' — بيع #'+(s.no||''),ref:s.id,no:s.no,desc:(e.name||'مصروف')+' — بيع #'+(s.no||''),dr:0,cr:n(e.amount)})})});
  D.payments.forEach(p=>{const a=n(p.amount)*(p.cur==='USD'?n(p.rate):1),m=p.method==='transfer'?'تحويل':'كاش';
    post(p.partyId,{date:p.date,createdAt:p.createdAt,kind:'payment',doc:(p.dir==='in'?'تحصيل ':'دفعة ')+m,info:[p.cur==='USD'?'$'+fmt(n(p.amount),2)+' × '+fmt(n(p.rate),2):'',p.ref?'مرجع '+p.ref:'',p.notes||''].filter(Boolean).join(' — ')||'—',ref:p.id,no:p.no,desc:(p.dir==='in'?'تحصيل ':'دفعة ')+m+(p.cur==='USD'?' $'+fmt(n(p.amount),2)+' × '+fmt(n(p.rate),2):'')+(p.ref?' — مرجع '+p.ref:'')+(p.notes?' — '+p.notes:''),dr:p.dir==='in'?0:a,cr:p.dir==='in'?a:0})});
  const BAL={};Object.keys(L).forEach(id=>{L[id].sort((a,b)=>(a.kind==='open'?-1:0)-(b.kind==='open'?-1:0)||ord(a,b));let b=0,dr=0,cr=0;L[id].forEach(e=>{b+=e.dr-e.cr;dr+=e.dr;cr+=e.cr;e.bal=b});BAL[id]={dr,cr,bal:b}});
  return{P,SUP,issue,loadIss,R,SL,L,BAL,warns,unlinkedTrans,supplyAmt,method}
}

function runCost(r,c){
  const S=c.S,cartonKg=n(r.cartonKg)||n(S.cartonKg)||10,farzSackKg=n(r.farzSackKg)||n(S.sackKg)||25;
  const tempRaw=String(r.farzTemp==null?'':r.farzTemp).trim(),temp=tempRaw===''||!isFinite(parse(tempRaw))?null:parse(tempRaw);
  const fsd=c.farzSold||{kg:0,rev:0,net:0,sales:[]};
  const errs=[];
  /* تجميع المدخلات حسب المورد */
  const sup={},order=[];
  (r.inputs||[]).forEach((i,ix)=>{const p=c.P[i.purchaseId];if(!p){errs.push('سطر خام '+(ix+1)+': الفاتورة مش موجودة');return}
    const sid=p.rec.supplierId,kg=n(i.kg);if(!(kg>0))errs.push('سطر خام '+(ix+1)+': الكمية لازم أكبر من صفر');
    if(!sup[sid]){sup[sid]={supplierId:sid,name:(c.PT[sid]||{}).name||'؟',kg:0,rawCost:0,trans:0,discSave:0,discKg:0,contract:0,cartons:0,farzSacks:0,purchases:[]};order.push(sid)}
    const s=sup[sid];s.kg+=kg;s.rawCost+=kg*p.unit;s.trans+=kg*p.transKg;s.discSave+=kg*p.price*p.d/100;s.discKg+=kg*p.d/100;s.contract+=kg*p.price;
    s.cartons+=n(i.cartons);s.farzSacks+=n(i.farzSacks);s.purchases.push({purchaseId:p.id,no:p.rec.no,date:p.rec.date,kg,unit:p.unit,transKg:p.transKg,price:p.price,d:p.d})});
  const rows=order.map(k=>sup[k]);
  const rawKg=rows.reduce((a,s)=>a+s.kg,0);
  const bySup=!!r.yieldBySupplier;
  let cartons,farzSacks;
  if(bySup){cartons=rows.reduce((a,s)=>a+s.cartons,0);farzSacks=rows.reduce((a,s)=>a+s.farzSacks,0)}else{cartons=n(r.cartons);farzSacks=n(r.farzSacks)}
  const fin=cartons*cartonKg,farz=farzSacks*farzSackKg+(bySup?0:n(r.farzExtraKg)),waste=rawKg-fin-farz;
  if(rawKg>0&&waste<-1e-6)errs.push('الإنتاج النهائي + الفرزة ('+fmt(fin+farz,0)+' كجم) أكبر من الخام الداخل ('+fmt(rawKg,0)+' كجم)');
  if(!(fin>0))errs.push('مفيش إنتاج نهائي (عدد الكراتين صفر)');
  /* التكاليف المشتركة */
  const supplies=(c.issue||[]).filter(Boolean).map(x=>Object.assign({},x,{name:(c.IT[x.itemId]||{}).name||'؟',unit:(c.IT[x.itemId]||{}).unit||''}));
  const suppliesT=supplies.reduce((a,x)=>a+x.cost,0);
  const costs=(r.costs||[]).map(x=>({name:x.name||'أخرى',amount:n(x.amount),partyId:x.partyId||''}));
  const costsT=costs.reduce((a,x)=>a+x.amount,0);
  const runTrans=(c.runTrans||[]).reduce((a,x)=>a+x.amt,0);
  const shared=suppliesT+costsT+runTrans;
  const rawCost=rows.reduce((a,s)=>a+s.rawCost,0),trans=rows.reduce((a,s)=>a+s.trans,0),total=rawCost+trans+shared;
  /* قيمة الفرزة: المباع بسعر البيع الفعلي، والباقي بسعر مؤقت لو المستخدم كتبه، وإلا من غير قيمة (التكلفة مبدئية) */
  const farzSoldKg=fsd.kg,farzUnsold=Math.max(farz-fsd.kg,0),farzAvg=fsd.kg?fsd.net/fsd.kg:0;let credit=0,status='final';
  if(c.method==='joint'){status='final'}
  else if(farz<=0.005){credit=0;status='final'}
  else if(farzUnsold<=0.005){credit=fsd.net;status='final'}
  else if(temp!=null){credit=fsd.net+farzUnsold*temp;status='provisional'}
  else{credit=fsd.net;status='noprice'}
  const fp=farz>0?credit/farz:0;
  /* لكل مورد */
  rows.forEach(s=>{s.share=rawKg?s.kg/rawKg:0;s.shared=shared*s.share;s.total=s.rawCost+s.trans+s.shared;
    if(bySup){s.fin=s.cartons*cartonKg;s.farz=s.farzSacks*farzSackKg}else{s.fin=fin*s.share;s.farz=farz*s.share;s.cartons=cartons*s.share;s.farzSacks=farzSacks*s.share}
    s.waste=s.kg-s.fin-s.farz;s.effKg=s.kg?s.rawCost/s.kg:0;s.contractKg=s.kg?s.contract/s.kg:0;
    if(c.method==='joint'){const k=s.fin+s.farz;s.kgCost=k?s.total/k:0;s.finCost=s.kgCost*s.fin;s.farzCost=s.kgCost*s.farz;s.credit=0}
    else{s.credit=farz>0?credit*s.farz/farz:0;s.finCost=s.total-s.credit;s.farzCost=s.credit}
    s.perTon=s.fin?s.finCost/s.fin*1000:0;s.yield=s.kg?s.fin/s.kg*100:0});
  const finCost=rows.reduce((a,s)=>a+s.finCost,0),farzCost=rows.reduce((a,s)=>a+s.farzCost,0);
  const perTon=fin?finCost/fin*1000:0,finKgCost=fin?finCost/fin:0;
  /* تكلفة كيلو الفرزة المباعة = صافي بيعها (ربح الفرزة صفر بطريقة المنتج الثانوي)، والمخزون الباقي بالسعر المؤقت أو صفر */
  const farzKgCost=c.method==='joint'?(farz?farzCost/farz:0):farzAvg,farzStockKg=c.method==='joint'?farzKgCost:(temp!=null?temp:0);
  const costLabel=status==='final'?'نهائي':status==='provisional'?'مبدئي (سعر فرزة مؤقت '+fmt(temp,2)+' ج/كجم لـ '+fmt(farzUnsold,0)+' كجم)':(farzSoldKg>0.005?'مبدئي — قبل خصم الفرزة غير المباعة ('+fmt(farzUnsold,0)+' كجم)':'مبدئي — قبل خصم الفرزة ('+fmt(farz,0)+' كجم)');
  const farzWarn=status==='final'?'':'سعر الفرزة لسه ما اتحددش — التكلفة مبدئية';
  /* المقارنة بالمقدر — على أساس المنتج الثانوي (نفس نموذج تكلفة المجمدات) */
  const est=r.est?fcCalc(r.est):null;let cmp=null;
  if(fin>0&&rawKg>0){const T=fin/1000,pb=rawCost/rawKg;const L=[];
    const lbl=est?est.rawLines[2].name:'تكلفة الفرزة (فرق السعر)';
    L.push({name:'شراء الخام (1 طن)',a:pb*1000,e:est?est.buy:0,raw:1});
    L.push({name:'تكلفة الهالك',a:Math.max(waste,0)*pb/T,e:est?est.wasteC:0,raw:1});
    L.push({name:lbl,a:farz*(pb-fp)/T,e:est?est.overC:0,raw:1});
    L.push({name:'نقل الخام',a:(trans+runTrans)/T,e:est?est.trans:0,raw:1});
    const m={};const add=(nm,a)=>{m[nm]=(m[nm]||0)+a};
    supplies.forEach(x=>add(x.name,x.cost/T));costs.forEach(x=>add(x.name,x.amount/T));
    const eS=est?est.sup:[];const seen={};
    eS.forEach(x=>{seen[x.name]=1;L.push({name:x.name,a:m[x.name]||0,e:x.v})});
    Object.keys(m).forEach(k=>{if(!seen[k])L.push({name:k,a:m[k],e:0})});
    L.forEach(x=>x.v=x.a-x.e);
    const aT=L.reduce((s,x)=>s+x.a,0),eT=est?est.total:0;
    const drivers=[
      {name:'سعر كيلو الخام الفعلي بعد الخصم',a:pb,e:est?est.I.price:0,u:'ج/كجم',d:2},
      {name:'نسبة الهالك من الخام',a:waste/rawKg*100,e:est?est.I.waste:0,u:'%',d:2},
      {name:'نسبة الفرزة من الخام بعد الهالك',a:(rawKg-waste)>0?farz/(rawKg-waste)*100:0,e:est?est.I.over:0,u:'%',d:2},
      {name:'سعر كيلو الفرزة (فعلي/مؤقت)',a:fp,e:est?est.I.overPrice:0,u:'ج/كجم',d:2},
      {name:'خام لازم لكل طن صادر',a:rawKg/T,e:est&&est.I.tons?est.raw/est.I.tons:0,u:'كجم',d:0}];
    cmp={lines:L,aT,eT,v:aT-eT,drivers,usd:est?est.I.usd:0}}
  return{id:r.id,no:r.no,date:r.date,rows,rawKg,cartons,farzSacks,cartonKg,farzSackKg,fin,farz,waste,yieldFin:rawKg?fin/rawKg*100:0,yieldFarz:rawKg?farz/rawKg*100:0,yieldWaste:rawKg?waste/rawKg*100:0,
    supplies,suppliesT,costs,costsT,runTrans,shared,rawCost,trans,total,finCost,farzCost,perTon,finKgCost,farzKgCost,farzStockKg,fp,method:c.method,est,cmp,errs,bySup,
    status,costLabel,farzWarn,credit,farzTemp:temp,farzSoldKg,farzUnsold,farzAvg,farzSoldRev:fsd.rev,farzSoldNet:fsd.net,farzSales:fsd.sales,
    discSave:rows.reduce((a,s)=>a+s.discSave,0),discKg:rows.reduce((a,s)=>a+s.discKg,0)}
}

function allocOf(l){return Array.isArray(l.alloc)&&l.alloc.length?l.alloc:null}
function saleInfo(s,c){
  const kind=s.kind==='farz'?'farz':'export',cur=s.cur==='USD'?'USD':'EGP',rate=cur==='USD'?n(s.rate):1,cont=kind==='export'&&!!s.cont;
  const lines=(s.lines||[]).map((l,li)=>{const r=c.R[l.runId],rr=c.RN[l.runId]||{};let kg,amount;
    if(cont){kg=n(l.tons)*1000;amount=kg*n(l.price)}else if(kind==='export'){const ck=r?r.cartonKg:10;kg=n(l.cartons)*ck;amount=kg/1000*n(l.price)}else{kg=n(l.kg);amount=kg*n(l.price)}
    const kc=r?(kind==='farz'?r.farzKgCost:r.finKgCost):0;const LI=(c.loadIss&&c.loadIss[s.id]&&c.loadIss[s.id][li])||[];const ld=cont&&l.ld?l.ld:null;
    const loadSup=ld?LI.reduce((a,z)=>a+(z?z.cost:0),0):0,loadSvc=ld?(ld.svc||[]).reduce((a,z)=>a+n(z.amount),0):0;
    /* v1.2.8: توزيع السطر على أكتر من تشغيلة (alloc) — كل جزء بتكلفة تشغيلته؛ السطر من غير توزيع = جزء واحد بنفس الحساب القديم */
    const al=allocOf(l);let parts,cogs;
    if(!al){parts=[{runId:l.runId,runNo:rr.no,kg,kgCost:kc,cogs:kg*kc,share:1}];cogs=kg*kc}
    else{const t=al.reduce((a,x)=>a+n(x.kg),0);parts=al.map(x=>{const ra=c.R[x.runId],k=n(x.kg),kca=ra?(kind==='farz'?ra.farzKgCost:ra.finKgCost):0;return{runId:x.runId,runNo:(c.RN[x.runId]||{}).no,kg:k,kgCost:kca,cogs:k*kca,share:t?k/t:1/al.length}});cogs=parts.reduce((a,q)=>a+q.cogs,0)}
    parts.forEach(q=>{q.amount=amount*q.share;q.egp=amount*rate*q.share;q.loadSup=loadSup*q.share;q.loadSvc=loadSvc*q.share;q.load=(loadSup+loadSvc)*q.share;q.tons=q.kg/1000;const ra=c.R[q.runId];q.cartons=cont?(ra&&ra.cartonKg?q.kg/ra.cartonKg:0):(al?0:n(l.cartons))});
    return{parts,alloc:!!al,loadSup,loadSvc,load:loadSup+loadSvc,loadItems:ld?(ld.sup||[]).map((z,ix)=>Object.assign({k:z.k,auto:!!z.auto,ovr:!!z.ovr},LI[ix]||{itemId:z.itemId,qty:n(z.qty),cost:0})):[],loadSvcs:ld?(ld.svc||[]).map(z=>({k:z.k,name:z.name,amount:n(z.amount),partyId:z.partyId||'',auto:!!z.auto,ovr:!!z.ovr})):[],loadLoc:ld?(ld.locId||rr.factoryId||''):'',runId:l.runId,runNo:rr.no,cartons:cont?(r&&r.cartonKg?kg/r.cartonKg:0):n(l.cartons),kg,tons:kg/1000,cont:cont?String(l.cont||'').trim():'',bl:cont?String(l.bl||'').trim():'',price:n(l.price),amount,egp:amount*rate,kgCost:al?(kg?cogs/kg:0):kc,cogs}});
  const amount=lines.reduce((a,l)=>a+l.amount,0),rev=amount*rate,cogs=lines.reduce((a,l)=>a+l.cogs,0);
  const exps=(s.expenses||[]).map(e=>({name:e.name,amount:n(e.amount),partyId:e.partyId||''}));const exp=exps.reduce((a,e)=>a+e.amount,0);
  const kg=lines.reduce((a,l)=>a+l.kg,0),load=lines.reduce((a,l)=>a+l.load,0),loadSup=lines.reduce((a,l)=>a+l.loadSup,0),loadSvc=lines.reduce((a,l)=>a+l.loadSvc,0),profit=rev-cogs-exp-load;
  return{id:s.id,no:s.no,invNo:String(s.invNo||'').trim(),date:s.date,customerId:s.customerId,kind,cur,rate,cont,nCont:cont?lines.length:0,tons:kg/1000,lines,amount,rev,cogs,exps,exp,load,loadSup,loadSvc,kg,profit,margin:rev?profit/rev*100:0,perTon:kg?profit/kg*1000:0}
}

/* ميزان البسكول بالصافي: الفواتير القديمة (قائم/فارغ) صافيها = القائم − الفارغ */
function pNet(p){return p.net!=null&&String(p.net).trim()!==''?Math.max(n(p.net),0):Math.max(n(p.gross)-n(p.tare),0)}
function migrate(D){let k=0;(D.purchases||[]).forEach(p=>{if((p.net==null||String(p.net).trim()==='')&&(p.gross!=null||p.tare!=null)){p.net=Math.max(n(p.gross)-n(p.tare),0);k++}if('gross' in p||'tare' in p){delete p.gross;delete p.tare}});return k}
function contN(k){k=+k||0;return k===1?'حاوية واحدة':k===2?'حاويتين':(k%100>=3&&k%100<=10)?k+' حاويات':k+' حاوية'}
function pfmt(x){x=+x||0;return fmt(x,Math.abs(Math.round(x*1000)-Math.round(x*100)*10)>0?3:2)}
function fmt(x,d){x=Math.round((+x||0)*Math.pow(10,d))/Math.pow(10,d)+0;return x.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}

g.ERP={loadPal,bomLoadQty,bomLoadSvc,ensureSeedItems,DEF_BOM,BASE_L,bomOf,patchBom126,bomQty,bomSvc,openInfo,SEED_T,DEF_SUPPLIES,DEF_INPUTS,fcDefaults,fcCalc,parse,n,seed,compute,runCost,saleInfo,dmy,parseDmy,cairoIso,cairoTime,fmt,pfmt,contN,pNet,migrate,uid,COLLS,PTYPES,COST_CATS,STOCK_ITEMS,FACTORIES,VARIETIES};
if(typeof module!=='undefined')module.exports=g.ERP;
})(typeof window!=='undefined'?window:globalThis);
