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

const STOCK_ITEMS=[['كرتون جينريال 10ك بالهالك','كرتونة'],['باليت','باليت'],['كيس','كيس'],['لزق','بكرة'],['استرتش','بكرة'],['الورق','وحدة'],['زوايا','قطعة'],['ستيكر فحص','ستيكر'],['داتا لوجر','جهاز']];
const COST_CATS=['التعبئة بالسيزر','رسوم المصنع / التشغيل','عمالة','تجميد','تخزين مبرد','إكراميات','عمولات شراء','فحص / مصاريف أخرى','أخرى'];
const FACTORIES=['الثلاجة العربية','الحسن','الفجر','بوناتيرا'];
const VARIETIES=['فراولة','بروكلي','قرنبيط','خرشوف'];
const PTYPES={raw:'مورد خام',supply:'مورد مستلزمات',transport:'مورد نقل',service:'مورد خدمات / مصنع',export:'عميل تصدير',farz:'عميل فرزة'};
const COLLS=['settings','factories','varieties','items','parties','purchases','transports','payments','supplyIn','transfers','runs','sales'];

function nowIso(){return new Date().toISOString()}
function seed(){
  const t=nowIso(),D={};COLLS.forEach(c=>D[c]=[]);
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

function compute(D){
  const S=D.settings[0]||{},method=S.farzMethod==='joint'?'joint':'credit';
  const PT=byId(D.parties),IT=byId(D.items),RN=byId(D.runs);
  /* فواتير الخام */
  const P={};
  D.purchases.forEach(p=>{const gross=n(p.gross),tare=n(p.tare),net=Math.max(gross-tare,0),d=n(p.disc),payKg=net*(1-d/100),price=n(p.price),amount=payKg*price;
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
  D.items.forEach(it=>SUP[it.id]={qty:0,val:0,loc:{},last:0,ref:n(it.refPrice),inQty:0,inVal:0,outQty:0,outVal:0});
  const ev=[];
  D.supplyIn.forEach(s=>{let tot=0;(s.lines||[]).forEach(l=>{const q=n(l.qty),pr=n(l.price);tot+=q*pr;ev.push({k:0,date:s.date,createdAt:s.createdAt,item:l.itemId,q,pr,loc:s.locId})});supplyAmt[s.id]=tot});
  D.transfers.forEach(s=>(s.lines||[]).forEach(l=>ev.push({k:1,date:s.date,createdAt:s.createdAt,item:l.itemId,q:n(l.qty),from:s.fromId,to:s.toId,tid:s.id})));
  D.runs.forEach(r=>(r.supplies||[]).forEach((l,ix)=>ev.push({k:2,date:r.date,createdAt:r.createdAt,item:l.itemId,q:n(l.qty),loc:l.locId||r.factoryId,run:r.id,ix})));
  ev.sort((a,b)=>(a.date||'').localeCompare(b.date||'')||a.k-b.k||(a.createdAt||'').localeCompare(b.createdAt||''));
  const warns=[];
  ev.forEach(e=>{const s=SUP[e.item];if(!s)return;
    if(e.k===0){s.qty+=e.q;s.val+=e.q*e.pr;s.last=e.pr;s.loc[e.loc]=(s.loc[e.loc]||0)+e.q;s.inQty+=e.q;s.inVal+=e.q*e.pr}
    else if(e.k===1){const have=s.loc[e.from]||0;if(have+1e-9<e.q)warns.push({type:'transfer',id:e.tid,item:e.item,need:e.q,have});s.loc[e.from]=have-e.q;s.loc[e.to]=(s.loc[e.to]||0)+e.q}
    else{const have=s.loc[e.loc]||0,avg=s.qty>1e-9?s.val/s.qty:(s.last||s.ref||0),cost=e.q*avg;const short=have+1e-9<e.q;
      if(short)warns.push({type:'issue',run:e.run,item:e.item,need:e.q,have,loc:e.loc});
      s.qty-=e.q;s.val-=cost;if(Math.abs(s.qty)<1e-9){s.qty=0;s.val=0}s.loc[e.loc]=have-e.q;s.outQty+=e.q;s.outVal+=cost;
      (issue[e.run]=issue[e.run]||[])[e.ix]={itemId:e.item,qty:e.q,avg,cost,loc:e.loc,short,noPrice:!(avg>0)}}});
  Object.values(SUP).forEach(s=>{s.avg=s.qty>1e-9?s.val/s.qty:(s.last||s.ref||0)});

  /* التشغيلات */
  const R={};
  D.runs.forEach(r=>{R[r.id]=runCost(r,{P,PT,IT,S,method,issue:issue[r.id]||[],runTrans:runTrans[r.id]||[]})});

  /* المبيعات */
  const SL={},sold={};D.runs.forEach(r=>sold[r.id]={fin:0,farz:0});
  D.sales.forEach(s=>{const x=saleInfo(s,{R,RN,S});SL[s.id]=x;x.lines.forEach(l=>{if(sold[l.runId])sold[l.runId][x.kind==='farz'?'farz':'fin']+=l.kg})});
  Object.keys(R).forEach(id=>{const r=R[id],so=sold[id];r.soldFin=so.fin;r.soldFarz=so.farz;r.stockFin=r.fin-so.fin;r.stockFarz=r.farz-so.farz});
  /* ربحية التشغيلة: إيراد سطورها ناقص تكلفتها ناقص نصيبها من مصروفات البيع */
  Object.values(R).forEach(r=>{r.sales={rev:0,cogs:0,exp:0,profit:0,finRev:0,farzRev:0}});
  Object.values(SL).forEach(x=>x.lines.forEach(l=>{const r=R[l.runId];if(!r)return;const ex=x.rev?x.exp*l.egp/x.rev:(x.lines.length?x.exp/x.lines.length:0);
    r.sales.rev+=l.egp;r.sales.cogs+=l.cogs;r.sales.exp+=ex;r.sales[x.kind==='farz'?'farzRev':'finRev']+=l.egp}));
  Object.values(R).forEach(r=>{r.sales.profit=r.sales.rev-r.sales.cogs-r.sales.exp;r.stockVal=r.stockFin*r.finKgCost+r.stockFarz*r.farzKgCost});

  /* الحسابات */
  const L={};D.parties.forEach(p=>{L[p.id]=[];const o=n(p.open);if(o)L[p.id].push({date:'',ord:0,kind:'open',desc:'رصيد أول المدة',dr:p.openSide==='c'?0:o,cr:p.openSide==='c'?o:0})});
  const post=(pid,e)=>{if(L[pid])L[pid].push(e)};
  D.purchases.forEach(p=>{const x=P[p.id];post(p.supplierId,{date:p.date,createdAt:p.createdAt,kind:'purchase',ref:p.id,no:p.no,desc:'فاتورة خام #'+(p.no||'')+' — صافي '+fmt(x.net,0)+' كجم'+(x.d?' − خصم '+fmt(x.d,2)+'% = '+fmt(x.payKg,1)+' كجم':'')+' × '+fmt(x.price,2),dr:0,cr:x.amount})});
  D.transports.forEach(t=>post(t.transporterId,{date:t.date,createdAt:t.createdAt,kind:'transport',ref:t.id,no:t.no,desc:'نقل #'+(t.no||'')+(t.plate?' — '+t.plate:'')+(t.notes?' — '+t.notes:''),dr:0,cr:n(t.amount)}));
  D.supplyIn.forEach(s=>post(s.supplierId,{date:s.date,createdAt:s.createdAt,kind:'supplyIn',ref:s.id,no:s.no,desc:'فاتورة مستلزمات #'+(s.no||'')+(s.invNo?' (فاتورة المورد '+s.invNo+')':''),dr:0,cr:supplyAmt[s.id]||0}));
  D.runs.forEach(r=>(r.costs||[]).forEach(c=>{if(c.partyId)post(c.partyId,{date:r.date,createdAt:r.createdAt,kind:'runCost',ref:r.id,no:r.no,desc:(c.name||'تكلفة')+' — تشغيلة #'+(r.no||''),dr:0,cr:n(c.amount)})}));
  D.sales.forEach(s=>{const x=SL[s.id];post(s.customerId,{date:s.date,createdAt:s.createdAt,kind:'sale',ref:s.id,no:s.no,desc:(x.kind==='farz'?'بيع فرزة':'بيع تصدير')+' #'+(s.no||'')+(x.cur==='USD'?' — $'+fmt(x.amount,2)+' × '+fmt(x.rate,2):'')+(s.invNo?' — فاتورة '+s.invNo:''),dr:x.rev,cr:0});
    (s.expenses||[]).forEach(e=>{if(e.partyId)post(e.partyId,{date:s.date,createdAt:s.createdAt,kind:'saleExp',ref:s.id,no:s.no,desc:(e.name||'مصروف')+' — بيع #'+(s.no||''),dr:0,cr:n(e.amount)})})});
  D.payments.forEach(p=>{const a=n(p.amount)*(p.cur==='USD'?n(p.rate):1),m=p.method==='transfer'?'تحويل':'كاش';
    post(p.partyId,{date:p.date,createdAt:p.createdAt,kind:'payment',ref:p.id,no:p.no,desc:(p.dir==='in'?'تحصيل ':'دفعة ')+m+(p.cur==='USD'?' $'+fmt(n(p.amount),2)+' × '+fmt(n(p.rate),2):'')+(p.ref?' — مرجع '+p.ref:'')+(p.notes?' — '+p.notes:''),dr:p.dir==='in'?0:a,cr:p.dir==='in'?a:0})});
  const BAL={};Object.keys(L).forEach(id=>{L[id].sort((a,b)=>(a.kind==='open'?-1:0)-(b.kind==='open'?-1:0)||ord(a,b));let b=0,dr=0,cr=0;L[id].forEach(e=>{b+=e.dr-e.cr;dr+=e.dr;cr+=e.cr;e.bal=b});BAL[id]={dr,cr,bal:b}});
  return{P,SUP,issue,R,SL,L,BAL,warns,unlinkedTrans,supplyAmt,method}
}

function runCost(r,c){
  const S=c.S,cartonKg=n(r.cartonKg)||n(S.cartonKg)||10,farzSackKg=n(r.farzSackKg)||n(S.sackKg)||25,fp=n(r.farzPrice);
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
  /* لكل مورد */
  rows.forEach(s=>{s.share=rawKg?s.kg/rawKg:0;s.shared=shared*s.share;s.total=s.rawCost+s.trans+s.shared;
    if(bySup){s.fin=s.cartons*cartonKg;s.farz=s.farzSacks*farzSackKg}else{s.fin=fin*s.share;s.farz=farz*s.share;s.cartons=cartons*s.share;s.farzSacks=farzSacks*s.share}
    s.waste=s.kg-s.fin-s.farz;s.effKg=s.kg?s.rawCost/s.kg:0;s.contractKg=s.kg?s.contract/s.kg:0;
    if(c.method==='joint'){const k=s.fin+s.farz;s.kgCost=k?s.total/k:0;s.finCost=s.kgCost*s.fin;s.farzCost=s.kgCost*s.farz;s.credit=0}
    else{s.credit=s.farz*fp;s.finCost=s.total-s.credit;s.farzCost=s.credit}
    s.perTon=s.fin?s.finCost/s.fin*1000:0;s.yield=s.kg?s.fin/s.kg*100:0});
  const finCost=rows.reduce((a,s)=>a+s.finCost,0),farzCost=rows.reduce((a,s)=>a+s.farzCost,0);
  const perTon=fin?finCost/fin*1000:0,finKgCost=fin?finCost/fin:0,farzKgCost=farz?farzCost/farz:0;
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
      {name:'سعر كيلو الفرزة',a:fp,e:est?est.I.overPrice:0,u:'ج/كجم',d:2},
      {name:'خام لازم لكل طن صادر',a:rawKg/T,e:est&&est.I.tons?est.raw/est.I.tons:0,u:'كجم',d:0}];
    cmp={lines:L,aT,eT,v:aT-eT,drivers,usd:est?est.I.usd:0}}
  return{id:r.id,no:r.no,date:r.date,rows,rawKg,cartons,farzSacks,cartonKg,farzSackKg,fin,farz,waste,yieldFin:rawKg?fin/rawKg*100:0,yieldFarz:rawKg?farz/rawKg*100:0,yieldWaste:rawKg?waste/rawKg*100:0,
    supplies,suppliesT,costs,costsT,runTrans,shared,rawCost,trans,total,finCost,farzCost,perTon,finKgCost,farzKgCost,fp,method:c.method,est,cmp,errs,bySup,
    discSave:rows.reduce((a,s)=>a+s.discSave,0),discKg:rows.reduce((a,s)=>a+s.discKg,0)}
}

function saleInfo(s,c){
  const kind=s.kind==='farz'?'farz':'export',cur=s.cur==='USD'?'USD':'EGP',rate=cur==='USD'?n(s.rate):1;
  const lines=(s.lines||[]).map(l=>{const r=c.R[l.runId],rr=c.RN[l.runId]||{};let kg,amount;
    if(kind==='export'){const ck=r?r.cartonKg:10;kg=n(l.cartons)*ck;amount=kg/1000*n(l.price)}else{kg=n(l.kg);amount=kg*n(l.price)}
    const kc=r?(kind==='farz'?r.farzKgCost:r.finKgCost):0;return{runId:l.runId,runNo:rr.no,cartons:n(l.cartons),kg,price:n(l.price),amount,egp:amount*rate,kgCost:kc,cogs:kg*kc}});
  const amount=lines.reduce((a,l)=>a+l.amount,0),rev=amount*rate,cogs=lines.reduce((a,l)=>a+l.cogs,0);
  const exps=(s.expenses||[]).map(e=>({name:e.name,amount:n(e.amount),partyId:e.partyId||''}));const exp=exps.reduce((a,e)=>a+e.amount,0);
  const kg=lines.reduce((a,l)=>a+l.kg,0),profit=rev-cogs-exp;
  return{id:s.id,no:s.no,date:s.date,customerId:s.customerId,kind,cur,rate,lines,amount,rev,cogs,exps,exp,kg,profit,margin:rev?profit/rev*100:0,perTon:kg?profit/kg*1000:0}
}

function fmt(x,d){x=Math.round((+x||0)*Math.pow(10,d))/Math.pow(10,d)+0;return x.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}

g.ERP={DEF_SUPPLIES,DEF_INPUTS,fcDefaults,fcCalc,parse,n,seed,compute,runCost,saleInfo,dmy,parseDmy,cairoIso,cairoTime,fmt,uid,COLLS,PTYPES,COST_CATS,STOCK_ITEMS,FACTORIES,VARIETIES};
if(typeof module!=='undefined')module.exports=g.ERP;
})(typeof window!=='undefined'?window:globalThis);
