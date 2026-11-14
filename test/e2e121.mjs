// v1.2.1: كل حاجة تتعدل + ملاحظة «معدل» خفيفة للداخلي وكشوف الموردين، ومن غير أي أثر في اللي بيشوفه العميل — بروفايل مؤقت ومفيش سحابة
import { chromium, webkit, devices } from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.mjs';
import fs from 'fs';import { execSync } from 'child_process';
const WK=process.env.ENGINE==='webkit',BASE=process.env.BASE||(WK?'http://erp.test/':'http://127.0.0.1:8811/');
const OUT='/workspace/strawberry_erp/test/out121'+(WK?'_webkit':'')+(process.env.BASE?'_live':'');fs.mkdirSync(OUT,{recursive:true});const PV='/workspace/strawberry_erp/previews/v121';fs.mkdirSync(PV+'/pdf',{recursive:true});
const res=[];const ok=(n,c,i='')=>{res.push({n,pass:!!c,i});console.log((c?'PASS ':'FAIL ')+n+(i?' — '+String(i).slice(0,160):''))};const near=(a,b,t=0.01)=>Math.abs(a-b)<=t;
const b=WK?await webkit.launch():await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await b.newContext(WK?{...devices['iPhone 13'],locale:'ar-EG',timezoneId:'Africa/Cairo'}:{viewport:{width:390,height:844},deviceScaleFactor:1000/390,isMobile:true,hasTouch:true,locale:'ar-EG',timezoneId:'Africa/Cairo'});
const MT={html:'text/html; charset=utf-8',js:'text/javascript',json:'application/json',webmanifest:'application/manifest+json',png:'image/png',jpg:'image/jpeg'};
if(WK&&!process.env.BASE)await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='erp.test')return r.abort();const f='/workspace/strawberry_erp'+(u.pathname==='/'?'/index.html':u.pathname);if(fs.existsSync(f))return r.fulfill({status:200,contentType:MT[f.split('.').pop()]||'application/octet-stream',body:fs.readFileSync(f)});return r.fulfill({status:404,body:''})});
await ctx.route(/supabase\.co/,r=>r.abort());
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>{(globalThis.__NATIVE=globalThis.__NATIVE||[]).push(d.type()+': '+d.message());d.dismiss()});await p.addInitScript({path:'/workspace/strawberry_erp/test/dlghook.js'});
await p.goto(BASE);await p.waitForFunction(()=>window.__ready);ok('مش مربوط بالسحابة',await p.evaluate(()=>!SYNC.state.enabled));
await p.evaluate(()=>location.hash='#/backup');await p.setInputFiles('#restoreFile','/workspace/strawberry_erp/test/scenario100.json');await p.waitForFunction(()=>APP.D.runs.length===4);
const S='#sheet ';const fill=async(k,v)=>{await p.fill(S+`input[data-p="${k}"]`,String(v))};const selV=async(k,v)=>{await p.selectOption(S+`select[data-p="${k}"]`,String(v));await p.waitForTimeout(30)};
const fset=async(k,v)=>{await p.click(S+`[data-fset="${k}"][data-v="${v}"]`);await p.waitForTimeout(20)};
const edit=async(k,id)=>{await p.evaluate(([k,id])=>{const b=document.createElement('button');b.dataset.act='edit';b.dataset.k=k;b.dataset.id=id;document.body.appendChild(b);b.click();b.remove()},[k,id]);await p.waitForTimeout(60)};
const trySave=async()=>{await p.click(S+'.shb [data-act="fsave"]');await p.waitForTimeout(150);return (await p.$eval('#sheet',e=>!e.hidden))?await p.textContent('#ferr'):''};
const save=async()=>{const e=await trySave();if(e)throw new Error('save failed '+e)};const close=async()=>{if(await p.$eval('#sheet',e=>!e.hidden))await p.click(S+'.shb [data-act="fclose"]');await p.waitForTimeout(40)};
const edits=(c,id)=>p.evaluate(([c,id])=>(APP.get(c,id).edits||[]).map(e=>APP.editNotes({edits:[e]})[0]),[c,id]);
const RX=/^معدل \d{2}\/\d{2}\/\d{4} \d{2}:\d{2} — /;
// حفظ من غير تغيير = مفيش ملاحظة
await edit('purchase','p2');await save();ok('حفظ من غير تغيير مابيضيفش ملاحظة',!(await edits('purchases','p2')).length);
// 1) فاتورة خام: الوزن والسعر والتاريخ والمورد
await edit('purchase','p1');await fill('net',9100);await fill('price',29);await fill('date','02/11/2026');await save();
let e=await edits('purchases','p1');ok('فاتورة خام: الصافي والسعر والتاريخ اتعدلوا واتسجلوا قديم ← جديد',e.length===1&&RX.test(e[0])&&e[0].includes('الصافي 9,000 ← 9,100')&&e[0].includes('السعر 28 ← 29')&&e[0].includes('التاريخ 01/11/2026 ← 02/11/2026'),e[0]);
await edit('purchase','p12');await selV('supplierId','R4');await save();e=await edits('purchases','p12');ok('فاتورة خام: تغيير المورد',e[0]&&e[0].includes('المورد تجريبي مورد خام — مزرعة النوبارية ← تجريبي مورد خام — البحيرة'),e[0]);
// 2) نقل
await edit('transport','t1');await fill('amount',3600);await save();e=await edits('transports','t1');ok('نقل: المبلغ',e[0]&&e[0].includes('المبلغ 3,500 ← 3,600'),e[0]);
await edit('transport','t9');await p.uncheck(S+'input[data-chk="purchaseIds"][value="p9"]');await p.check(S+'input[data-chk="purchaseIds"][value="p8"]');await save();e=await edits('transports','t9');ok('نقل: الفواتير المربوطة',e[0]&&e[0].includes('الفواتير #9 ← #8'),e[0]);
// 3) مستلزمات وتحويل
await edit('supplyIn','si1');await fill('lines.1.qty',2100);await fill('lines.1.price',16.4);await save();e=await edits('supplyIn','si1');ok('شراء مستلزمات: كمية وسعر سطر',e[0]&&e[0].includes('سطر 2 الكمية 2,000 ← 2,100')&&e[0].includes('سطر 2 السعر 16.50 ← 16.40'),e[0]);
await edit('transfer','tf1');await fill('lines.0.qty',1700);await save();e=await edits('transfers','tf1');ok('تحويل: الكمية',e[0]&&e[0].includes('سطر 1 الكمية 1,800 ← 1,700'),e[0]);
// 4) تشغيلة: الإنتاج والصرف والتكاليف
await edit('run','r1');await fill('cartons',1760);await fill('farzSacks',204);await fill('supplies.0.qty',1760);await fill('costs.0.amount',36000);await save();e=await edits('runs','r1');
ok('تشغيلة: الكراتين والفرزة والصرف والتكلفة',e[0]&&['الكراتين 1,750 ← 1,760','شكاير الفرزة 200 ← 204','مستلزم 1 الكمية 1,750 ← 1,760','تكلفة 1 المبلغ 35,000 ← 36,000'].every(x=>e[0].includes(x)),e[0]);
await edit('run','r3');await fill('inputs.0.kg',9400);await fill('inputs.0.cartons',695);await save();e=await edits('runs','r3');ok('تشغيلة: كمية الخام وإنتاج المورد',e[0]&&e[0].includes('خام 1 الكجم 9,500 ← 9,400'),e[0]);
await p.evaluate(()=>{const r=APP.get('runs','r3');const x=document.createElement('button');x.dataset.act='farzTemp';x.dataset.id='r3';document.body.appendChild(x)});
await p.evaluate(()=>window.__dlgPrompt='14');await p.click('[data-act="farzTemp"][data-id="r3"]');await p.waitForTimeout(300);await p.evaluate(()=>window.__dlgPrompt=null);
e=await edits('runs','r3');ok('سعر الفرزة المؤقت من زرار التشغيلة اتسجل',e.length===2&&e[1].includes('سعر الفرزة المؤقت — ← 14'),e[1]);
// 5) مبيعات تصدير وفرزة
await edit('sale','s2');await fill('lines.0.cartons',1490);await fill('lines.0.price',1160);await fill('rate',50.8);await fill('expenses.0.amount',7200);await save();e=await edits('sales','s2');
ok('بيع تصدير: الكراتين والسعر والدولار والمصروف',e[0]&&['سطر 1 الكراتين 1,500 ← 1,490','سطر 1 السعر 1,150 ← 1,160','سعر الدولار 50.50 ← 50.80','مصروف 1 المبلغ 7,000 ← 7,200'].every(x=>e[0].includes(x)),e[0]);
await edit('sale','s1');await fill('lines.0.kg',4900);await fill('lines.0.price',18.5);await save();e=await edits('sales','s1');ok('بيع فرزة: الكمية والسعر',e[0]&&e[0].includes('سطر 1 الكجم 5,000 ← 4,900')&&e[0].includes('سطر 1 السعر 18 ← 18.50'),e[0]);
// 6) دفعات: مورد (طريقة ومبلغ وتاريخ) وعميل بالدولار
await edit('payment','y1');await fill('amount',245000);await fset('method','cash');await fill('date','03/11/2026');await save();e=await edits('payments','y1');
ok('دفعة مورد: المبلغ والطريقة والتاريخ',e[0]&&['المبلغ 240,000 ← 245,000','طريقة الدفع تحويل ← كاش','التاريخ 02/11/2026 ← 03/11/2026'].every(x=>e[0].includes(x)),e[0]);
await edit('payment','y11');await fill('amount',21000);await save();e=await edits('payments','y11');ok('تحصيل عميل بالدولار: المبلغ',e[0]&&e[0].includes('المبلغ 20,000 ← 21,000'),e[0]);
await edit('payment','y14');await selV('partyId','FZ2');await save();e=await edits('payments','y14');ok('تحصيل: تغيير العميل',e[0]&&e[0].includes('الحساب'),e[0]);
// 7) الضوابط فضلت شغالة في التعديل
let er;await edit('sale','s7');await fill('lines.1.cartons',1700);er=await trySave();await close();ok('تعديل بيع لأكتر من المتاح مرفوض',/المتاح/.test(er),er);
await edit('run','r4');await fill('cartons',1100);er=await trySave();await close();ok('تعديل تشغيلة لأقل من المباع مرفوض',/أقل من المباع/.test(er),er);
await edit('payment','y2');await fill('no',3);er=await trySave();await close();ok('تعديل لرقم مكرر مرفوض',/متسجل قبل كده/.test(er),er);
await edit('supplyIn','si3');await fill('lines.0.qty',-5);er=await trySave();await close();ok('تعديل لكمية بالسالب مرفوض',/بالسالب|الكمية/.test(er),er);
await edit('purchase','p4');await fill('net',4000);er=await trySave();await close();ok('تعديل الصافي لأقل من المستخدم في تشغيلة مرفوض',/أقل من المستخدم/.test(er),er);
ok('الرفض مابيسجلش ملاحظة',!(await edits('sales','s7')).length&&!(await edits('runs','r4')).length);
// 8) إعادة الحساب: كل الأرقام بعد التعديلات = الحساب المستقل
const dump=await p.evaluate(()=>{const d={};ERP.COLLS.forEach(c=>d[c]=APP.D[c]);return JSON.stringify({data:d})});fs.writeFileSync(OUT+'/edited.json',dump);
execSync(`python3 /workspace/strawberry_erp/test/verify100.py ${OUT}/edited.json ${OUT}/verify_edited.json`);const V=JSON.parse(fs.readFileSync(OUT+'/verify_edited.json','utf8'));
const C=await p.evaluate(()=>({R:Object.fromEntries(APP.D.runs.map(r=>[r.id,{perTon:APP.C.R[r.id].perTon,total:APP.C.R[r.id].total,bySup:Object.fromEntries(APP.C.R[r.id].rows.map(s=>[s.supplierId,s.perTon]))}])),SL:Object.fromEntries(Object.entries(APP.C.SL).map(([k,x])=>[k,x.profit])),BAL:Object.fromEntries(Object.entries(APP.C.BAL).map(([k,x])=>[k,x.bal]))}));
let bad=[];Object.entries(V.R).forEach(([k,v])=>{if(!near(C.R[k].perTon,v.perTon)||!near(C.R[k].total,v.total))bad.push(k);Object.entries(v.bySup).forEach(([s,x])=>{if(!near(C.R[k].bySup[s],x))bad.push(k+s)})});
Object.entries(V.SL).forEach(([k,v])=>{if(!near(C.SL[k],v.profit))bad.push(k)});Object.entries(V.BAL).forEach(([k,v])=>{if(!near(C.BAL[k],v))bad.push('bal '+k)});
ok('بعد كل التعديلات: تكلفة الطن والربح والأرصدة اتحسبوا من جديد = الحساب المستقل',!bad.length,bad.join(' '));
const base=JSON.parse(fs.readFileSync('/workspace/strawberry_erp/test/out/verify100.json','utf8'));ok('والأرقام اتغيرت فعلًا عن قبل التعديل',!near(base.R.r1.perTon,V.R.r1.perTon)&&!near(base.BAL['cus-fussga'],V.BAL['cus-fussga']));
// 9) العرض في البرنامج
await edit('purchase','p1');await p.waitForTimeout(100);const fn=await p.$eval(S+'.enote',e=>({t:e.textContent,c:getComputedStyle(e).color,w:getComputedStyle(e).fontWeight,s:getComputedStyle(e).fontSize})).catch(()=>null);
ok('ملاحظة التعديل في النموذج بخط خفيف رمادي صغير',fn&&RX.test(fn.t)&&+fn.w<=300&&parseFloat(fn.s)<=11.5&&/138/.test(fn.c),JSON.stringify(fn));
await p.evaluate(()=>{const n=document.querySelector('#sheet .enote');n&&n.scrollIntoView({block:'center'})});await p.waitForTimeout(150);await p.screenshot({path:OUT+'/edited_purchase_form.png'});await close();
await p.evaluate(()=>{UI.buyTab='raw'}).catch(()=>{});await p.evaluate(()=>location.hash='#/buy');await p.waitForTimeout(150);ok('آخر تعديل تحت الفاتورة في القائمة',(await p.$$eval('#main .enote',L=>L.length))>=2);
await p.evaluate(()=>location.hash='#/party/R1');await p.waitForTimeout(150);ok('كشف المورد في البرنامج فيه الملاحظة',(await p.textContent('#main')).includes('معدل '));
for(const id of ['cus-fussga','FZ1','FZ2','EX2']){await p.evaluate(id=>location.hash='#/party/'+id,id);await p.waitForTimeout(120);const t=await p.textContent('#main');ok('كشف العميل '+id+' في البرنامج من غير أي أثر تعديل',!/معدل|←/.test(t)&&!(await p.$('#main .enote')))}
await p.evaluate(()=>location.hash='#/run/r1');await p.waitForTimeout(120);ok('شاشة التشغيلة فيها الملاحظة',(await p.textContent('#main')).includes('معدل '));
// 10) التقارير وPDF
await p.waitForFunction(()=>window.jspdf&&window.html2canvas);
const rep=async(k,o,nm)=>{const r=await p.evaluate(async([k,o])=>{await RPT.open(k,o);const html=document.querySelector('#pages').innerHTML;const txt=document.querySelector('#pages').innerText;const pdf=await RPT.makePdf();
  window.__printed=0;window.print=()=>window.__printed++;document.querySelector('#rPrint').click();const pr=window.__printed;RPT.close();const u=new Uint8Array(pdf.output('arraybuffer'));let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return{html,txt,pr,b64:btoa(s)}},[k,o]);
  if(nm)fs.writeFileSync(PV+'/pdf/'+nm+'.pdf',Buffer.from(r.b64,'base64'));return r};
let r=await rep('stmt',{id:'R1'},'supplier_statement_R1_edited');ok('كشف مورد خام PDF فيه «معدل» بخط خفيف',r.txt.includes('معدل ')&&r.html.includes('class="enote"'));
r=await rep('stmt',{id:'T1'},'supplier_statement_T1_edited');ok('كشف مورد نقل فيه تعديل النقلة',r.txt.includes('المبلغ 3,500'));
ok('وكشف مورد النقل مابيكشفش بيانات العميل من تعديل البيع',!/الكراتين|سعر الدولار|العميل/.test(r.txt.split('الحركات')[1]||''),'');
r=await rep('stmt',{id:'SP1'});ok('كشف مورد مستلزمات فيه الملاحظة',r.txt.includes('معدل '));
r=await rep('stmt',{id:'SV1'});ok('كشف مورد خدمات: بند التكلفة المعدل بس',r.txt.includes('تكلفة 1 المبلغ 35,000')&&!r.txt.includes('الكراتين 1,750'));
for(const id of ['cus-fussga','FZ1','FZ2','EX2']){r=await rep('stmt',{id},id==='cus-fussga'?'customer_statement_fussga_edited':null);ok('كشف العميل '+id+' PDF وطباعة من غير أي أثر تعديل',!/معدل|←/.test(r.txt)&&!r.html.includes('enote')&&r.pr===1)}
r=await rep('run',{id:'r1'},'run_cost_run1_edited');ok('تقرير تكلفة التشغيلة فيه سجل التعديلات',r.txt.includes('سجل التعديلات')&&r.txt.includes('فاتورة خام #1: معدل'));
r=await rep('profitDet',{},'profitability_detailed_edited');ok('الربحية المفصلة (داخلي) فيها ملاحظة البيع',r.txt.includes('معدل '));
// معاينات
await p.evaluate(()=>location.hash='#/party/R1');await p.waitForTimeout(200);
fs.copyFileSync(OUT+'/edited_purchase_form.png','/tmp/v121_form.png');
ok('مفيش أخطاء جافاسكريبت',!errs.length,errs.join(' | '));
await b.close();const f=res.filter(x=>!x.pass).length;console.log(`\n${res.length-f}/${res.length} PASS`);fs.writeFileSync(OUT+'/results121.json',JSON.stringify(res,null,1));process.exit(f?1:0);
