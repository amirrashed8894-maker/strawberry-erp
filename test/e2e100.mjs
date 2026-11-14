// إدخال سيناريو 100 طن بالكامل من النماذج (زي المستخدم بالظبط) في بروفايل متصفح مؤقت — مفيش سحابة — ومقارنة النتايج بالحساب المستقل (verify100.py)
// + الحالات الحدية: أصفار وسالب، صرف أكتر من الرصيد، بيع أكتر من الإنتاج، أرقام مكررة، تعديل، حذف وأرشيف وترجيع، نسخة واسترجاع، أوفلاين
import { chromium, webkit, devices } from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.mjs';
import fs from 'fs';import { createRequire } from 'module';const require=createRequire(import.meta.url);
const WK=process.env.ENGINE==='webkit',BASE=process.env.BASE||(WK?'http://erp.test/':'http://127.0.0.1:8811/');
const OUT='/workspace/strawberry_erp/test/out100'+(WK?'_webkit':'')+(process.env.BASE?'_live':'');fs.mkdirSync(OUT,{recursive:true});
const SC=JSON.parse(fs.readFileSync('/workspace/strawberry_erp/test/scenario100.json','utf8')).data,V=JSON.parse(fs.readFileSync('/workspace/strawberry_erp/test/out/verify100.json','utf8'));
const res=[];const ok=(n,c,i='')=>{res.push({n,pass:!!c,i});console.log((c?'PASS ':'FAIL ')+n+(i?' — '+i:''))};
const near=(a,b,t=0.01)=>Math.abs(a-b)<=t;
const b=WK?await webkit.launch():await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctxOpt=WK?{...devices['iPhone 13'],locale:'ar-EG',timezoneId:'Africa/Cairo',acceptDownloads:true}:{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'ar-EG',timezoneId:'Africa/Cairo',acceptDownloads:true};
const MT={html:'text/html; charset=utf-8',js:'text/javascript',json:'application/json',webmanifest:'application/manifest+json',png:'image/png',jpg:'image/jpeg'};
const mkCtx=async()=>{const c=await b.newContext(ctxOpt);if(WK&&!process.env.BASE)await c.route('**/*',r=>{const u=new URL(r.request().url());if(c.__off||u.hostname!=='erp.test')return r.abort();const f='/workspace/strawberry_erp'+(u.pathname==='/'?'/index.html':u.pathname);if(fs.existsSync(f))return r.fulfill({status:200,contentType:MT[f.split('.').pop()]||'application/octet-stream',body:fs.readFileSync(f)});return r.fulfill({status:404,body:''})});
  await c.route(/supabase\.co/,r=>r.abort());return c};
const ctx=await mkCtx();const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
p.on('dialog',d=>{(globalThis.__NATIVE=globalThis.__NATIVE||[]).push(d.type()+': '+d.message());d.dismiss()});await p.addInitScript({path:'/workspace/strawberry_erp/test/dlghook.js'});
await p.goto(BASE);await p.waitForFunction(()=>window.__ready);await p.evaluate(async()=>{const s=APP.S();s.bomOn=false;await APP.upsert('settings',s)});// v1.2.4: السيناريو ده بيدخل المستلزمات يدوي — الصرف التلقائي متجرب في e2e124

ok('البروفايل مش مربوط بالسحابة',await p.evaluate(()=>!SYNC.state.enabled));
const S='#sheet ';
const dmy=iso=>iso.slice(8,10)+'/'+iso.slice(5,7)+'/'+iso.slice(0,4);
const fill=async(path,v)=>{if(v==null||v==='')return;await p.fill(S+`input[data-p="${path}"]`,String(v))};
const selV=async(path,v)=>{await p.selectOption(S+`select[data-p="${path}"]`,String(v));await p.waitForTimeout(30)};
const fset=async(path,v)=>{await p.click(S+`[data-fset="${path}"][data-v="${v}"]`);await p.waitForTimeout(20)};
const add=async path=>{await p.click(S+`[data-ladd="${path}"]`);await p.waitForTimeout(20)};
const trySave=async()=>{await p.click(S+'.shb [data-act="fsave"]');await p.waitForTimeout(150);const open=await p.$eval('#sheet',e=>!e.hidden);return open?(await p.textContent('#ferr')):''};
const save=async()=>{const e=await trySave();if(e)throw new Error('save failed: '+e)};
const close=async()=>{if(await p.$eval('#sheet',e=>!e.hidden)){await p.click(S+'.shb [data-act="fclose"]');await p.waitForTimeout(40)}};
const newK=async(k,extra={})=>{await p.evaluate(([k,extra])=>{const b=document.createElement('button');b.dataset.act='new';b.dataset.k=k;Object.assign(b.dataset,extra);document.body.appendChild(b);b.click();b.remove()},[k,extra]);await p.waitForTimeout(60)};
const editK=async(k,id)=>{await p.evaluate(([k,id])=>{const b=document.createElement('button');b.dataset.act='edit';b.dataset.k=k;b.dataset.id=id;document.body.appendChild(b);b.click();b.remove()},[k,id]);await p.waitForTimeout(60)};
const ID={};const aid=async(coll,no)=>p.evaluate(([c,no])=>(APP.D[c].find(x=>String(x.no)===String(no))||{}).id,[coll,no]);
const t0=Date.now();
// 1) الحسابات (فوسجا موجودة: نعدل رصيدها الافتتاحي)
await editK('party','cus-fussga');await fill('open',50000);await fset('openSide','d');await save();ID['cus-fussga']='cus-fussga';
for(const x of SC.parties.filter(x=>x.id!=='cus-fussga')){await newK('party',{type:x.type});await selV('type',x.type);await fill('name',x.name);if(x.nameEn)await fill('nameEn',x.nameEn);if(x.phone)await fill('phone',x.phone);
  if(x.type==='raw')await p.fill(S+'input[data-p="disc"]',String(x.disc));if(x.open){await fill('open',x.open);await fset('openSide',x.openSide)}await save();
  ID[x.id]=await p.evaluate(n=>APP.D.parties.find(p=>p.name===n).id,x.name)}
ok('15 حساب (14 تجريبي + فوسجا)',await p.evaluate(()=>APP.D.parties.length)===15);
// 2) وارد المستلزمات والتحويلات
for(const x of SC.supplyIn){await newK('supplyIn');await fill('date',dmy(x.date));await fill('no',x.no);await selV('supplierId',ID[x.supplierId]);await selV('locId',x.locId);await fill('invNo',x.invNo);
  for(let i=0;i<x.lines.length;i++){if(i)await add('lines');await selV(`lines.${i}.itemId`,x.lines[i].itemId);await fill(`lines.${i}.qty`,x.lines[i].qty);await fill(`lines.${i}.price`,x.lines[i].price)}await save()}
for(const x of SC.transfers){await newK('transfer');await fill('date',dmy(x.date));await fill('no',x.no);await selV('fromId',x.fromId);await selV('toId',x.toId);
  for(let i=0;i<x.lines.length;i++){if(i)await add('lines');await selV(`lines.${i}.itemId`,x.lines[i].itemId);await fill(`lines.${i}.qty`,x.lines[i].qty)}await save()}
// 3) 12 عربية بسكول
for(const x of SC.purchases){await newK('purchase');await fill('date',dmy(x.date));await fill('no',x.no);await selV('supplierId',ID[x.supplierId]);await selV('factoryId',x.factoryId);
  const dd=await p.inputValue(S+'input[data-p="disc"]');const def=SC.parties.find(q=>q.id===x.supplierId).disc;if(x.no===1)ok('خصم الميزان بيتحط من المورد ('+def+'%)',dd===String(def));
  await fill('plate',x.plate);await fill('ticketNo',x.ticketNo);await fill('net',x.net);await p.fill(S+'input[data-p="disc"]',String(x.disc));await fill('price',x.price);await fill('sacks',x.sacks);await fill('lotNo',x.lotNo);
  await save();ID[x.id]=await aid('purchases',x.no)}
ok('إجمالي الخام على الميزان 100,000 كجم',near(await p.evaluate(()=>Object.values(APP.C.P).reduce((a,x)=>a+x.net,0)),100000));
// 4) النقل على الفواتير
for(const x of SC.transports.filter(t=>t.purchaseIds.length)){await newK('transport');await fill('date',dmy(x.date));await fill('no',x.no);await selV('transporterId',ID[x.transporterId]);await fill('amount',x.amount);await fill('plate',x.plate);
  for(const pid of x.purchaseIds)await p.check(S+`input[data-chk="purchaseIds"][value="${ID[pid]}"]`);await save()}
// 5) التشغيلات
for(const x of SC.runs){await newK('run');await fill('date',dmy(x.date));await fill('no',x.no);await selV('factoryId',x.factoryId);
  if(x.yieldBySupplier){await p.check(S+'input[data-bool="yieldBySupplier"]');await p.waitForTimeout(40)}
  for(let i=0;i<x.inputs.length;i++){const l=x.inputs[i];if(i)await add('inputs');await selV(`inputs.${i}.purchaseId`,ID[l.purchaseId]);await fill(`inputs.${i}.kg`,l.kg);if(x.yieldBySupplier){await fill(`inputs.${i}.cartons`,l.cartons);await fill(`inputs.${i}.farzSacks`,l.farzSacks)}}
  if(!x.yieldBySupplier){await fill('cartons',x.cartons);await fill('farzSacks',x.farzSacks);if(x.farzExtraKg)await fill('farzExtraKg',x.farzExtraKg)}
  await fill('cartonKg',x.cartonKg);await fill('farzSackKg',x.farzSackKg);if(x.farzTemp!=='')await fill('farzTemp',x.farzTemp);
  for(let i=0;i<x.supplies.length;i++){const l=x.supplies[i];await add('supplies');await selV(`supplies.${i}.itemId`,l.itemId);await fill(`supplies.${i}.qty`,l.qty);await selV(`supplies.${i}.locId`,l.locId)}
  for(let i=0;i<x.costs.length;i++){const l=x.costs[i];await add('costs');await fill(`costs.${i}.name`,l.name);await fill(`costs.${i}.amount`,l.amount);if(l.partyId)await selV(`costs.${i}.partyId`,ID[l.partyId])}
  await save();ID[x.id]=await aid('runs',x.no);await p.waitForTimeout(40)}
// نقلة داخلية على تشغيلة 4 (تكلفة مشتركة)
{const x=SC.transports.find(t=>t.runId);await newK('transport');await fill('date',dmy(x.date));await fill('no',x.no);await selV('transporterId',ID[x.transporterId]);await fill('amount',x.amount);await fset('mode','r');await selV('runId',ID[x.runId]);await fill('notes',x.notes);await save()}
// 6) المبيعات (تصدير بالدولار وفرزة بالجنيه)
for(const x of SC.sales){const CT=x.kind!=='farz';if(CT)await p.evaluate(k=>window.__dlgCount=k,x.lines.length);await newK('sale',{kind:x.kind});await fill('date',dmy(x.date));await fill('no',x.no);await selV('customerId',ID[x.customerId]);await fill('invNo',x.invNo);
  if(x.cur==='USD'){await fset('cur','USD');await fill('rate',x.rate)}else await fset('cur','EGP');
  for(let i=0;i<x.lines.length;i++){const l=x.lines[i];if(i&&!CT)await add('lines');await selV(`lines.${i}.runId`,ID[l.runId]);if(!CT){await fill(`lines.${i}.kg`,l.kg);await fill(`lines.${i}.price`,l.price)}else{/* بالحاويات: الكراتين × 10 كجم ÷ 1000 = طن، وسعر الطن ÷ 1000 = سعر الكيلو */await fill(`lines.${i}.cont`,'TEST'+x.no+'C'+(i+1));await fill(`lines.${i}.bl`,'TESTBL'+x.no);await fill(`lines.${i}.tons`,String(l.cartons*10/1000));await fill(`lines.${i}.price`,String(l.price/1000))}}
  for(let i=0;i<x.expenses.length;i++){const l=x.expenses[i];await add('expenses');await fill(`expenses.${i}.name`,l.name);await fill(`expenses.${i}.amount`,l.amount);if(l.partyId)await selV(`expenses.${i}.partyId`,ID[l.partyId])}
  await save();ID[x.id]=await aid('sales',x.no)}
// 7) الدفعات والتحصيلات (كاش وتحويل، جنيه ودولار)
for(const x of SC.payments){await newK('payment',{dir:x.dir});await fset('dir',x.dir);await fill('date',dmy(x.date));await fill('no',x.no);await selV('partyId',ID[x.partyId]);await fset('method',x.method);
  if(x.cur==='USD'){await fset('cur','USD');await fill('rate',x.rate)}await fill('amount',x.amount);await fill('ref',x.ref);await save()}
ok('اتدخل كل السيناريو من النماذج في '+Math.round((Date.now()-t0)/1000)+' ث',await p.evaluate(()=>APP.D.payments.length)===16&&await p.evaluate(()=>APP.D.sales.length)===7);
// 8) المقارنة بالحساب المستقل
const C=await p.evaluate(ID=>{const C=APP.C;const R={};APP.D.runs.forEach(r=>{const x=C.R[r.id];R['r'+r.no]={raw:x.rawKg,fin:x.fin,farz:x.farz,waste:x.waste,total:x.total,credit:x.credit,status:x.status,perTon:x.perTon,bySup:Object.fromEntries(x.rows.map(s=>[s.supplierId,s.perTon]))}});
  const SL={};APP.D.sales.forEach(s=>{const x=C.SL[s.id];SL['s'+s.no]={rev:x.rev,cogs:x.cogs,exp:x.exp,profit:x.profit}});const BAL={};Object.entries(ID).forEach(([k,v])=>{if(C.BAL[v])BAL[k]=C.BAL[v].bal});return{R,SL,BAL,warns:C.warns.length}},ID);
const inv=Object.fromEntries(Object.entries(ID));
let bad=[];for(const [k,r] of Object.entries(V.R)){const a=C.R[k];['raw','fin','farz','waste','total','credit','perTon'].forEach(f=>{if(!near(a[f],r[f]))bad.push(k+'.'+f+' '+a[f]+'≠'+r[f])});if(a.status!==r.status)bad.push(k+'.status');
  Object.entries(r.bySup).forEach(([sid,v])=>{if(!near(a.bySup[ID[sid]],v))bad.push(k+'.'+sid+' '+a.bySup[ID[sid]]+'≠'+v)})}
ok('تكلفة الطن لكل تشغيلة ولكل مورد = الحساب المستقل',!bad.length,bad.slice(0,5).join(' | '));
bad=[];for(const [k,s] of Object.entries(V.SL)){const a=C.SL[k];['rev','cogs','exp','profit'].forEach(f=>{if(!near(a[f],s[f]))bad.push(k+'.'+f)})}ok('إيراد وتكلفة وربح كل بيع = الحساب المستقل',!bad.length,bad.join(' '));
bad=[];for(const [k,v] of Object.entries(V.BAL)){if(!near(C.BAL[k],v))bad.push(k+' '+C.BAL[k]+'≠'+v)}ok('أرصدة كل الموردين والعملاء = الحساب المستقل',!bad.length,bad.join(' | '));
ok('مفيش تحذيرات مخزون',C.warns===0);
const statuses=Object.values(C.R).map(r=>r.status).join(',');ok('حالات الفرزة: مباعة كلها / سعر مؤقت / من غير سعر',statuses==='final,provisional,noprice,provisional',statuses);
fs.writeFileSync(OUT+'/numbers100.json',JSON.stringify(C,null,1));
const base=JSON.stringify(C);
// 9) الحالات الحدية
const errOf=async fnFill=>{await fnFill();const e=await trySave();await close();return e};
let e=await errOf(async()=>{await newK('purchase');await fill('no',99);await selV('supplierId',ID.R1);await fill('net',0);await fill('price',28)});ok('فاتورة خام بوزن صفر مرفوضة',/الوزن الصافي/.test(e),e.slice(0,80));
e=await errOf(async()=>{await newK('purchase');await fill('no',99);await selV('supplierId',ID.R1);await fill('net',-1000);await fill('price',28)});ok('وزن صافي بالسالب مرفوض',/بالسالب|الوزن الصافي/.test(e));
e=await errOf(async()=>{await newK('purchase');await fill('no',99);await selV('supplierId',ID.R1);await fill('net',5000);await fill('price',-28)});ok('سعر بالسالب مرفوض',/بالسالب|سعر الكيلو/.test(e));
e=await errOf(async()=>{await newK('purchase');await fill('no',99);await selV('supplierId',ID.R1);await fill('net',5000);await p.fill(S+'input[data-p="disc"]','100');await fill('price',28)});ok('خصم ميزان 100% مرفوض',/خصم الميزان/.test(e));
e=await errOf(async()=>{await newK('purchase');await fill('no',5);await selV('supplierId',ID.R1);await fill('net',5000);await fill('price',28)});ok('رقم فاتورة مكرر مرفوض',/متسجل قبل كده/.test(e),e.slice(0,90));
e=await errOf(async()=>{await newK('sale',{kind:'export'});await fill('no',50);await selV('customerId','cus-fussga');await fset('cur','USD');await fill('rate',50);await selV('lines.0.runId',ID.r4);await fill('lines.0.cont','TEST-X1');await fill('lines.0.tons',5);await fill('lines.0.price',1.15)});ok('بيع أكتر من المتاح (5 طن والمتاح 4.1) مرفوض',/المتاح 4,100/.test(e),e.slice(0,90));
e=await errOf(async()=>{await newK('sale',{kind:'farz'});await fill('no',50);await selV('customerId',ID.FZ2);await selV('lines.0.runId',ID.r1).catch(()=>{});});ok('تشغيلة فرزتها خلصت مش ظاهرة في بيع الفرزة',/اختار التشغيلة|سطر 1/.test(e));
e=await errOf(async()=>{await newK('sale',{kind:'farz'});await fill('no',50);await selV('customerId',ID.FZ2);await selV('lines.0.runId',ID.r3);await fill('lines.0.kg',0);await fill('lines.0.price',17)});ok('كمية صفر مرفوضة',/الكمية/.test(e));
e=await errOf(async()=>{await newK('payment',{dir:'out'});await fill('no',50);await selV('partyId',ID.R2);await fill('amount',0)});ok('دفعة بصفر مرفوضة',/المبلغ/.test(e));
e=await errOf(async()=>{await newK('payment',{dir:'out'});await fill('no',1);await selV('partyId',ID.R2);await fill('amount',100)});ok('رقم دفعة مكرر مرفوض',/متسجل قبل كده/.test(e));
e=await errOf(async()=>{await newK('party',{type:'raw'});await fill('name','تجريبي سالب');await fill('open',-500)});ok('رصيد افتتاحي بالسالب مرفوض',/بالسالب/.test(e));
e=await errOf(async()=>{await newK('supplyIn');await fill('no',50);await selV('supplierId',ID.SP1);await selV('lines.0.itemId','itm1');await fill('lines.0.qty',-10);await fill('lines.0.price',16)});ok('كمية مستلزمات بالسالب مرفوضة',/الكمية|بالسالب/.test(e));
e=await errOf(async()=>{await editK('run',ID.r1);await fill('cartons',1600)});ok('تقليل كراتين تشغيلة أقل من المباع مرفوض',/أقل من المباع/.test(e),e.slice(0,90));
e=await errOf(async()=>{await editK('run',ID.r2);await fill('cartons',2000)});ok('إنتاج أكبر من الخام مرفوض',/أكبر من الخام/.test(e));
// صرف أكتر من الرصيد: لازم يسأل، ولو رفضت مايتحفظش
const nr=await p.evaluate(()=>APP.D.runs.length);
await newK('run');await fill('no',5);await selV('factoryId','fac3');await selV('inputs.0.purchaseId',ID.p1).catch(()=>{});
const avail=await p.$$eval(S+'select[data-p="inputs.0.purchaseId"] option',L=>L.length);ok('مفيش خام متاح للتشغيل بعد ما الـ 100 طن اتشغلوا',avail<=1);await close();
// نضيف عربية صغيرة عشان نجرب الصرف الزايد
await newK('purchase');await fill('date','07/11/2026');await fill('no',13);await selV('supplierId',ID.R5);await selV('factoryId','fac3');await fill('net',1000);await fill('price',30);await save();
await newK('run');await fill('date','07/11/2026');await fill('no',5);await selV('factoryId','fac3');await selV('inputs.0.purchaseId',await aid('purchases',13));await fill('inputs.0.kg',1000);await fill('cartons',70);await fill('farzSacks',8);
await add('supplies');await selV('supplies.0.itemId','itm1');await fill('supplies.0.qty',500);await selV('supplies.0.locId','fac3');
await p.evaluate(()=>{__dlgMode='dismiss';__dlgLog=[]});let er=await trySave();const lastDialog=await p.evaluate(()=>__dlgLog.slice(-1)[0]||'');ok('صرف 500 كرتونة من الفجر (الرصيد 200) بيسأل الأول',/الرصيد مش كفاية|أكتر من الرصيد/.test(lastDialog),lastDialog.slice(0,80));
ok('ولو رفضت مايتحفظش',await p.evaluate(()=>APP.D.runs.length)===nr&&await p.$eval('#sheet',e=>!e.hidden));
await p.evaluate(()=>__dlgMode='accept');await save();ok('ولو وافقت بيتحفظ ويظهر في «محتاج مراجعة»',await p.evaluate(()=>APP.C.warns.some(w=>w.type==='issue')));
// حذف ← أرشيف ← ترجيع
const r5=await aid('runs',5);await editK('run',r5);await p.click(S+'[data-act="fdel"]');await p.waitForTimeout(300);
ok('التشغيلة اتمسحت',!(await p.evaluate(id=>!!APP.get('runs',id),r5)));
await p.evaluate(()=>location.hash='#/archive');await p.waitForFunction(()=>document.querySelector('[data-act="unarc"]'),null,{timeout:5000});
ok('المحذوف ظاهر في الأرشيف',(await p.textContent('#main')).includes('تشغيلة #5'));
await p.screenshot({path:OUT+'/archive.png'});
await p.click('[data-act="unarc"][data-id="runs:'+r5+'"]');await p.waitForTimeout(400);
ok('ترجيع من الأرشيف رجّع التشغيلة بنفس البيانات',await p.evaluate(id=>{const r=APP.get('runs',id);return !!r&&r.supplies.length===1&&APP.C.R[id].fin===700},r5));
ok('واختفت من الأرشيف',!(await p.textContent('#main')).includes('تشغيلة #5'));
// ننضف: نمسح التشغيلة 5 والفاتورة 13 ونتأكد إن الأرقام رجعت زي ما كانت
await editK('run',r5);await p.click(S+'[data-act="fdel"]');await p.waitForTimeout(250);await editK('purchase',await aid('purchases',13));await p.click(S+'[data-act="fdel"]');await p.waitForTimeout(250);
// تعديل: سعر فاتورة 1 من 28 لـ 29 وبعدين نرجعه
const before=await p.evaluate(id=>APP.C.R[id].perTon,ID.r1);await editK('purchase',ID.p1);await fill('price',29);await save();
const after=await p.evaluate(id=>APP.C.R[id].perTon,ID.r1);const exp1=9000*0.98*1/17500*1000;
ok('تعديل سعر الفاتورة غيّر تكلفة الطن بالظبط (+'+exp1.toFixed(2)+')',near(after-before,exp1),String(after-before));
await editK('purchase',ID.p1);await fill('price',28);await save();
// حذف دفعة ← أرشيف ← ترجيع
const y16=await aid('payments',16);await editK('payment',y16);await p.click(S+'[data-act="fdel"]');await p.waitForTimeout(250);
ok('حذف دفعة 50,000 غيّر رصيد المورد',near(await p.evaluate(id=>APP.C.BAL[id].bal,ID.R1),V.BAL.R1-50000));
await p.evaluate(()=>location.hash='#/archive');await p.waitForFunction(()=>document.querySelector('[data-act="unarc"]'));await p.click('[data-act="unarc"][data-id="payments:'+y16+'"]');await p.waitForTimeout(300);
ok('ترجيع الدفعة رجّع الرصيد',near(await p.evaluate(id=>APP.C.BAL[id].bal,ID.R1),V.BAL.R1));
const C2=await p.evaluate(ID=>{const C=APP.C;return APP.D.runs.map(r=>C.R[r.id].perTon).concat(Object.values(ID).map(v=>(C.BAL[v]||{}).bal||0))},ID);
ok('بعد كل التعديلات والحذف والترجيع الأرقام رجعت زي الأول',JSON.stringify(C2.map(x=>x.toFixed(4)))===JSON.stringify(JSON.parse(base)&&(()=>{const B=JSON.parse(base);return Object.values(B.R).map(r=>r.perTon).concat(Object.keys(ID).map(k=>B.BAL[k]||0))})().map(x=>x.toFixed(4))));
// 10) نسخة احتياطية JSON واسترجاعها على جهاز جديد
await p.evaluate(()=>location.hash='#/backup');await p.waitForTimeout(150);
let file=OUT+'/backup100.json';
if(!WK){const [dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-act="backup"]')]);await dl.saveAs(file)}
else{const j=await p.evaluate(()=>{const d={};ERP.COLLS.forEach(c=>d[c]=APP.D[c]);return JSON.stringify({app:'alrashed-strawberry-erp',version:APP.VER,exportedAt:new Date().toISOString(),data:d})});fs.writeFileSync(file,j)}
ok('ملف النسخة فيه كل الحركات',(()=>{const j=JSON.parse(fs.readFileSync(file,'utf8'));return j.data.purchases.length===12&&j.data.runs.length===4&&j.data.sales.length===7&&j.data.payments.length===16})());
const ctx2=await mkCtx();const p2=await ctx2.newPage();p2.on('dialog',d=>{(globalThis.__NATIVE=globalThis.__NATIVE||[]).push(d.type()+': '+d.message());d.dismiss()});await p2.addInitScript({path:'/workspace/strawberry_erp/test/dlghook.js'});await p2.goto(BASE);await p2.waitForFunction(()=>window.__ready);
await p2.evaluate(()=>location.hash='#/backup');await p2.setInputFiles('#restoreFile',file);await p2.waitForFunction(()=>APP.D.runs.length===4);
const C3=await p2.evaluate(()=>APP.D.runs.map(r=>APP.C.R[r.id].perTon.toFixed(4)).join(','));ok('الاسترجاع على جهاز جديد طلّع نفس تكلفة الطن',C3===await p.evaluate(()=>APP.D.runs.map(r=>APP.C.R[r.id].perTon.toFixed(4)).join(',')),C3);
await ctx2.close();
// 11) أوفلاين: البرنامج يفتح من غير نت والبيانات موجودة، والتعديل بيتحفظ
await p.evaluate(()=>location.hash='#/home');await p.waitForTimeout(800);
if(WK)ctx.__off=true;await ctx.setOffline(true);await p.reload().catch(()=>{});await p.waitForFunction(()=>window.__ready,null,{timeout:15000}).catch(()=>{});
const offOk=await p.evaluate(()=>window.__ready&&APP.D.runs.length===4).catch(()=>false);ok('يفتح من غير نت بكل البيانات',offOk);
if(offOk){await newK('party',{type:'farz'});await fill('name','تجريبي أوفلاين');await save();await p.reload().catch(()=>{});await p.waitForFunction(()=>window.__ready,null,{timeout:15000}).catch(()=>{});
  ok('التعديل أوفلاين اتحفظ بعد إعادة الفتح',await p.evaluate(()=>APP.D.parties.some(x=>x.name==='تجريبي أوفلاين')).catch(()=>false))}
if(WK)ctx.__off=false;await ctx.setOffline(false);
ok('مفيش أخطاء JavaScript',!errs.length,errs.slice(0,4).join(' | '));
await b.close();const f=res.filter(r=>!r.pass).length;console.log(`\n${res.length-f}/${res.length} PASS`);fs.writeFileSync(OUT+'/results100.json',JSON.stringify(res,null,1));process.exit(f?1:0);
