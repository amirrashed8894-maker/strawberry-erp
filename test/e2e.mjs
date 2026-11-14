// اختبار شامل من الواجهة ببيانات تجريبية (كل الأسماء «تجريبي») — Chrome headless بمقاس موبايل
import { chromium, webkit, devices } from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.mjs';
import fs from 'fs';
const BASE=process.env.BASE||(process.env.ENGINE==='webkit'?'http://erp.test/':'http://127.0.0.1:8811/');const OUT='/workspace/strawberry_erp/test/out'+(process.env.BASE?'_live':'')+(process.env.ENGINE==='webkit'?'_webkit':'');fs.mkdirSync(OUT,{recursive:true});
const res=[];const ok=(n,c,i='')=>{res.push({n,pass:!!c,i});console.log((c?'PASS ':'FAIL ')+n+(i?' — '+i:''))};
const WK=process.env.ENGINE==='webkit';const b=WK?await webkit.launch():await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await b.newContext(WK?{...devices['iPhone 13'],locale:'ar-EG',timezoneId:'Africa/Cairo',acceptDownloads:true}:{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'ar-EG',timezoneId:'Africa/Cairo',acceptDownloads:true});
const MT={html:'text/html; charset=utf-8',js:'text/javascript',json:'application/json',webmanifest:'application/manifest+json',png:'image/png',jpg:'image/jpeg'};
const routeLocal=async c=>{if(!WK)return;await c.route('**/*',r=>{const u=new URL(r.request().url());if(c.__off)return r.abort();const f='/workspace/strawberry_erp'+(u.pathname==='/'?'/index.html':u.pathname);if(fs.existsSync(f))return r.fulfill({status:200,contentType:MT[f.split('.').pop()]||'application/octet-stream',body:fs.readFileSync(f)});return r.fulfill({status:404,body:''})})};
await routeLocal(ctx);
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
let promptAns=null;p.on('dialog',async d=>{if(d.type()==='prompt')await d.accept(promptAns||'');else await d.accept()});
await p.goto(BASE);await p.waitForFunction(()=>window.__ready);
const go=async h=>{await p.evaluate(h=>location.hash=h,h);await p.waitForTimeout(120)};
const S='#sheet ';
const fill=async(path,v)=>{await p.fill(S+`input[data-p="${path}"]`,String(v));};
const sel=async(path,label)=>{await p.selectOption(S+`select[data-p="${path}"]`,{label});await p.waitForTimeout(60)};
const selPart=async(path,part)=>{const v=await p.$eval(S+`select[data-p="${path}"]`,(s,part)=>{const o=[...s.options].find(o=>o.textContent.includes(part));return o?o.value:null},part);if(!v)throw new Error('no option '+part+' in '+path);await p.selectOption(S+`select[data-p="${path}"]`,v);await p.waitForTimeout(60)};
const fset=async(path,v)=>{await p.click(S+`[data-fset="${path}"][data-v="${v}"]`);await p.waitForTimeout(40)};
const add=async path=>{await p.click(S+`[data-ladd="${path}"]`);await p.waitForTimeout(40)};
const save=async()=>{await p.click(S+'.shb [data-act="fsave"]');await p.waitForTimeout(200);const open=await p.$eval('#sheet',e=>!e.hidden);if(open){const t=await p.textContent('#ferr');throw new Error('save failed: '+t)}};
const newK=async(k,extra='')=>{await p.evaluate(([k,extra])=>{const b=document.createElement('button');b.dataset.act='new';b.dataset.k=k;if(extra)Object.assign(b.dataset,JSON.parse(extra));document.body.appendChild(b);b.click();b.remove()},[k,extra]);await p.waitForTimeout(100)};
// 1) الحسابات
await go('#/acc');
const party=async(type,name,disc)=>{await newK('party',JSON.stringify({type}));await sel('type',{raw:'مورد خام',supply:'مورد مستلزمات',transport:'مورد نقل',service:'مورد خدمات / مصنع',farz:'عميل فرزة'}[type]);await fill('name',name);if(disc!=null)await fill('disc',disc);await save()};
await party('raw','تجريبي مورد خام أ',2);await party('raw','تجريبي مورد خام ب',3);await party('transport','تجريبي مورد نقل');await party('supply','تجريبي مورد مستلزمات');await party('service','تجريبي خدمات الثلاجة');await party('farz','تجريبي عميل فرزة');
ok('6 حسابات تجريبية + فوسجا',await p.evaluate(()=>APP.D.parties.length)===7);
// 2) مستلزمات
await newK('supplyIn');await fill('date','08/11/2026');await sel('supplierId','تجريبي مورد مستلزمات');await sel('locId','الثلاجة العربية');
await selPart('lines.0.itemId','كرتون');await fill('lines.0.qty',1500);await fill('lines.0.price',16);
await add('lines');await selPart('lines.1.itemId','باليت');await fill('lines.1.qty',20);await fill('lines.1.price',330);
await add('lines');await selPart('lines.2.itemId','استرتش');await fill('lines.2.qty',10);await fill('lines.2.price',45);await save();
await newK('supplyIn');await fill('date','09/11/2026');await sel('supplierId','تجريبي مورد مستلزمات');await sel('locId','الحسن');await selPart('lines.0.itemId','كرتون');await fill('lines.0.qty',500);await fill('lines.0.price',18);await save();
await newK('transfer');await fill('date','09/11/2026');await sel('fromId','الحسن');await sel('toId','الثلاجة العربية');await selPart('lines.0.itemId','كرتون');await fill('lines.0.qty',300);await save();
// 3) فواتير الخام
await newK('purchase');await fill('date','10/11/2026');await sel('supplierId','تجريبي مورد خام أ');
ok('خصم الميزان الافتراضي من المورد',await p.inputValue(S+'input[data-p="disc"]')==='2');
await fill('plate','تجريبي 123');await fill('gross',15000);await fill('tare',5000);await fill('price',28);await fill('sacks',400);await fill('lotNo','FS-TEST-01');
const sumA=await p.textContent('#fsum');ok('ملخص الفاتورة أ = 274,400',sumA.includes('274,400.00'),sumA.replace(/\s+/g,' ').slice(0,200));await save();
await newK('purchase');await fill('date','10/11/2026');await sel('supplierId','تجريبي مورد خام ب');await fill('plate','تجريبي 456');await fill('gross','١٣٠٠٠');await fill('tare',5000);await fill('price',30);await fill('sacks',320);await save();
ok('أرقام عربية في الوزن القائم',await p.evaluate(()=>APP.D.purchases.find(x=>x.no===2).gross)===13000);
// 4) النقل
await newK('transport');await fill('date','10/11/2026');await sel('transporterId','تجريبي مورد نقل');await fill('amount',9000);
for(const c of await p.$$(S+'input[data-chk="purchaseIds"]'))await c.check();await save();
// 5) التشغيلة
await newK('run');await fill('date','11/11/2026');await sel('factoryId','الثلاجة العربية');
await selPart('inputs.0.purchaseId','تجريبي مورد خام أ');await fill('inputs.0.kg',10000);await add('inputs');await selPart('inputs.1.purchaseId','تجريبي مورد خام ب');await fill('inputs.1.kg',8000);
await fill('cartons',1500);await fill('farzSacks',80);
ok('مفيش سعر فرزة افتراضي من التقدير (السعر المؤقت فاضي)',await p.inputValue(S+'input[data-p="farzTemp"]')==='');
await add('supplies');await selPart('supplies.0.itemId','كرتون');await fill('supplies.0.qty',1500);
await add('supplies');await selPart('supplies.1.itemId','باليت');await fill('supplies.1.qty',15);
await add('supplies');await selPart('supplies.2.itemId','استرتش');await fill('supplies.2.qty',8);
await add('costs');await fill('costs.0.name','التعبئة بالسيزر');await fill('costs.0.amount',30000);await selPart('costs.0.partyId','تجريبي خدمات الثلاجة');
await add('costs');await fill('costs.1.name','تجميد');await fill('costs.1.amount',12000);await selPart('costs.1.partyId','تجريبي خدمات الثلاجة');
await add('costs');await fill('costs.2.name','تخزين مبرد');await fill('costs.2.amount',3000);
// محاولة تخطي الخام المتاح
await fill('inputs.1.kg',8001);await p.click(S+'.shb [data-act="fsave"]');await p.waitForTimeout(150);ok('منع استخدام خام أكتر من الفاتورة',(await p.textContent('#ferr')).includes('المتاح'));
await fill('inputs.1.kg',8000);
await p.evaluate(()=>document.querySelector('#toast')?.classList.remove('on'));await p.waitForTimeout(250);await p.screenshot({path:OUT+'/run_form.png',fullPage:false});
await save();await p.waitForTimeout(200);
await p.evaluate(()=>document.querySelector('#toast')?.classList.remove('on'));await p.waitForTimeout(250);await p.screenshot({path:OUT+'/run_view.png',fullPage:true});
// 6) المبيعات
await newK('sale',JSON.stringify({kind:'export'}));await fill('date','12/11/2026');
ok('فوسجا مختارة تلقائي',(await p.$eval(S+'select[data-p="customerId"]',s=>s.options[s.selectedIndex].text)).includes('فوسجا'));
await fill('rate',50);await selPart('lines.0.runId','#1');await fill('lines.0.cartons',1000);await fill('lines.0.price',1100);
await add('expenses');await fill('expenses.0.name','نقل للميناء');await fill('expenses.0.amount',6000);await selPart('expenses.0.partyId','تجريبي مورد نقل');await save();
await newK('sale',JSON.stringify({kind:'farz'}));await fill('date','12/11/2026');await sel('customerId','تجريبي عميل فرزة');await selPart('lines.0.runId','#1');await fill('lines.0.price',18);await fill('lines.0.kg',2500);await p.click(S+'.shb [data-act="fsave"]');await p.waitForTimeout(150);ok('منع بيع فرزة أكتر من المخزون',(await p.textContent('#ferr')).includes('المتاح 2,000'));
await fill('lines.0.kg',1500);await save();
// 7) الدفعات
const pay=async(dir,party,method,amount,o={})=>{await newK('payment',JSON.stringify({dir}));await fill('date',o.date||'12/11/2026');await selPart('partyId',party);await fset('method',method);if(o.usd){await fset('cur','USD');await fill('rate',o.usd)}await fill('amount',amount);if(o.ref)await fill('ref',o.ref);await save()};
await pay('out','تجريبي مورد خام أ','transfer',200000,{ref:'تجريبي TRX1'});await pay('out','تجريبي مورد خام ب','cash',232800);await pay('out','تجريبي مورد نقل','cash',9000);await pay('out','تجريبي مورد مستلزمات','transfer',20000);
await pay('in','فوسجا','transfer',8000,{usd:50,date:'13/11/2026'});await pay('in','تجريبي عميل فرزة','cash',27000,{date:'13/11/2026'});
// 8) التحقق من الأرقام
const R=await p.evaluate(()=>{const C=APP.C,D=APP.D;const r=C.R[D.runs[0].id];const id=n=>D.parties.find(p=>p.name.includes(n)).id;
  return{perTon:r.perTon,rows:r.rows.map(s=>({n:s.name,perTon:s.perTon,total:s.total,credit:s.credit})),total:r.total,waste:r.waste,sup:r.suppliesT,cmpA:r.cmp.aT,cmpE:r.cmp.eT,
   sales:Object.values(C.SL).map(s=>({no:s.no,rev:s.rev,cogs:s.cogs,exp:s.exp,profit:s.profit})),runProfit:r.sales.profit,stockFin:r.stockFin,stockFarz:r.stockFarz,
   bal:{A:C.BAL[id('خام أ')].bal,B:C.BAL[id('خام ب')].bal,tr:C.BAL[id('نقل')].bal,sp:C.BAL[id('مستلزمات')].bal,sv:C.BAL[id('خدمات')].bal,fz:C.BAL[id('عميل فرزة')].bal,fu:C.BAL[id('فوسجا')].bal},
   cartonsLeft:C.SUP[D.items[0].id].loc}});
fs.writeFileSync(OUT+'/numbers.json',JSON.stringify(R,null,1));
const near=(a,b)=>Math.abs(a-b)<0.01;
ok('تكلفة الطن المبدئية (قبل خصم 500 كجم فرزة باقية) 37,617.33',near(R.perTon,37617.3333),R.perTon);
ok('مورد أ 36,732.00',near(R.rows[0].perTon,36732),R.rows[0].perTon);ok('مورد ب 38,724.00',near(R.rows[1].perTon,38724),R.rows[1].perTon);
ok('إجمالي التكلفة 591,260',near(R.total,591260));ok('المستلزمات 30,060 (كرتون بمتوسط 16.5)',near(R.sup,30060));ok('هالك 1,000',near(R.waste,1000));
ok('المقدر 36,431.54',near(R.cmpE,36431.541));ok('الفرق +1,185.79',near(R.cmpA-R.cmpE,1185.792),R.cmpA-R.cmpE);
ok('ربح بيع فوسجا (مبدئي) 167,826.67',near(R.sales[0].profit,167826.6667));ok('ربح الفرزة صفر (اتخصمت من التكلفة)',near(R.sales[1].profit,0));ok('ربح التشغيلة 167,826.67',near(R.runProfit,167826.6667));
ok('أرصدة',near(R.bal.A,-74400)&&near(R.bal.B,0)&&near(R.bal.tr,-6000)&&near(R.bal.sp,-20050)&&near(R.bal.sv,-42000)&&near(R.bal.fz,0)&&near(R.bal.fu,150000),JSON.stringify(R.bal));
ok('مخزون باقي 5,000 نهائي و500 فرزة',near(R.stockFin,5000)&&near(R.stockFarz,500));
// 8b) تحذير الفرزة
await go('#/run/'+(await p.evaluate(()=>APP.D.runs[0].id)));await p.waitForTimeout(300);
const wtxt=await p.textContent('#main');ok('تحذير «سعر الفرزة لسه ما اتحددش» في شاشة التشغيلة',wtxt.includes('سعر الفرزة لسه ما اتحددش — التكلفة مبدئية')&&wtxt.includes('قبل خصم الفرزة غير المباعة (500 كجم)'));
await p.evaluate(()=>document.querySelector('#toast').classList.remove('on'));await p.evaluate(()=>document.querySelector('#toast')?.classList.remove('on'));await p.waitForTimeout(250);await p.screenshot({path:OUT+'/run_farz_warning.png'});
await go('#/home');ok('التحذير في الرئيسية',(await p.textContent('#main')).includes('سعر الفرزة لسه ما اتحددش'));
await go('#/run/'+(await p.evaluate(()=>APP.D.runs[0].id)));promptAns='15';await p.click('[data-act="farzTemp"]');await p.waitForTimeout(400);promptAns=null;
let T2=await p.evaluate(()=>{const r=APP.C.R[APP.D.runs[0].id];return{st:r.status,perTon:r.perTon,label:r.costLabel}});ok('سعر مؤقت 15 → مبدئي 37,117.33',T2.st==='provisional'&&near(T2.perTon,37117.3333)&&T2.label.includes('مؤقت 15.00'),JSON.stringify(T2));
await p.evaluate(()=>document.querySelector('#toast')?.classList.remove('on'));await p.waitForTimeout(250);await p.screenshot({path:OUT+'/run_farz_provisional.png'});
// 9) العرض والتقارير
await go('#/home');await p.waitForTimeout(200);await p.evaluate(()=>document.querySelector('#toast')?.classList.remove('on'));await p.waitForTimeout(250);await p.screenshot({path:OUT+'/home.png'});
await go('#/acc');await p.evaluate(()=>document.querySelector('#toast')?.classList.remove('on'));await p.waitForTimeout(250);await p.screenshot({path:OUT+'/acc.png',fullPage:true});
const fid=await p.evaluate(()=>APP.D.parties.find(x=>x.id==='cus-fussga').id);await go('#/party/'+fid);await p.evaluate(()=>document.querySelector('#toast')?.classList.remove('on'));await p.waitForTimeout(250);await p.screenshot({path:OUT+'/stmt_fussga.png',fullPage:true});
const rid=await p.evaluate(()=>APP.D.runs[0].id);
const shotRep=async(kind,opt,name)=>{await p.evaluate(([k,o])=>RPT.open(k,o),[kind,opt]);await p.waitForFunction(()=>window.__repReady);const n=await p.evaluate(()=>window.__repReady);
  // صور الصفحات بالحجم الكامل
  const pages=await p.evaluate(()=>RPT.paginate?1:0);
  await p.evaluate(()=>window.__repReady=0);
  const pdf=await p.evaluate(async()=>{const pdf=await RPT.makePdf();const b64=pdf.output('datauristring');return b64});fs.writeFileSync(OUT+'/'+name+'.pdf',Buffer.from(pdf.split(',')[1],'base64'));
  await p.evaluate(()=>RPT.close());return n};
await p.waitForFunction(()=>window.html2canvas&&window.jspdf);
for(const [k,o,nm] of [['run',{id:rid},'run_cost'],['cmp',{id:rid},'estimate_vs_actual'],['profit',{},'profitability'],['stmt',{id:fid},'statement_fussga'],['stock',{},'stock']]){const n=await shotRep(k,o,nm);ok('تقرير '+nm+' اتعمل ('+n+' صفحة)',n>0)}
// 9b) بيع باقي الفرزة → نهائي
await newK('sale',JSON.stringify({kind:'farz'}));await fill('date','13/11/2026');await sel('customerId','تجريبي عميل فرزة');await selPart('lines.0.runId','#1');await fill('lines.0.kg',500);await fill('lines.0.price',16);await save();
T2=await p.evaluate(()=>{const r=APP.C.R[APP.D.runs[0].id];return{st:r.status,perTon:r.perTon,label:r.costLabel,a:r.rows[0].perTon,b:r.rows[1].perTon,fu:Object.values(APP.C.SL)[0].profit}});
ok('بعد بيع كل الفرزة → نهائي 37,084.00 (السعر المؤقت اتجاهل)',T2.st==='final'&&near(T2.perTon,37084)&&T2.label==='نهائي',JSON.stringify(T2));
ok('نهائي لكل مورد: أ 36,198.67 · ب 38,190.67',near(T2.a,36198.6667)&&near(T2.b,38190.6667));ok('ربح فوسجا النهائي 173,160',near(T2.fu,550000-10000*37.084-6000),T2.fu);
await go('#/run/'+(await p.evaluate(()=>APP.D.runs[0].id)));ok('التحذير اختفى بعد البيع',!(await p.textContent('#main')).includes('لسه ما اتحددش'));
await p.evaluate(([k,o])=>RPT.open(k,o),['run',{id:rid}]);await p.waitForFunction(()=>window.__repReady);{const pdf=await p.evaluate(async()=>(await RPT.makePdf()).output('datauristring'));fs.writeFileSync(OUT+'/run_cost_final.pdf',Buffer.from(pdf.split(',')[1],'base64'))}await p.evaluate(()=>RPT.close());
// 10) التخزين بعد إعادة التحميل
await p.reload();await p.waitForFunction(()=>window.__ready);ok('البيانات باقية بعد إعادة الفتح (IndexedDB)',await p.evaluate(()=>APP.D.runs.length===1&&APP.D.sales.length===3&&APP.D.payments.length===6));
// 11) نسخة احتياطية واسترجاع
await go('#/backup');const [dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-act="backup"]')]);const bp=OUT+'/backup_test.json';await dl.saveAs(bp);
const bj=JSON.parse(fs.readFileSync(bp,'utf8'));ok('ملف النسخة فيه كل البيانات',bj.app==='alrashed-strawberry-erp'&&bj.data.runs.length===1&&bj.data.purchases.length===2,dl.suggestedFilename());
const ctx2=await b.newContext(WK?{...devices['iPhone 13'],locale:'ar-EG',timezoneId:'Africa/Cairo'}:{viewport:{width:390,height:844},locale:'ar-EG',timezoneId:'Africa/Cairo'});await routeLocal(ctx2);const p2=await ctx2.newPage();p2.on('dialog',d=>d.accept());
await p2.goto(BASE+'#/backup');await p2.waitForFunction(()=>window.__ready);ok('جهاز جديد يبدأ بالأساسيات بس',await p2.evaluate(()=>APP.D.runs.length===0&&APP.D.parties.length===1&&APP.D.factories.length===4&&APP.D.items.length===9&&APP.D.varieties.length===4));
await p2.setInputFiles('#restoreFile',bp);await p2.waitForTimeout(800);ok('الاسترجاع رجّع نفس الأرقام',await p2.evaluate(()=>Math.abs(APP.C.R[APP.D.runs[0].id].perTon-37084)<0.01));
// 12) تغيير طريقة الفرزة (توزيع بالوزن) ثم الرجوع
await go('#/settings');await p.check('input[value="joint"]');await p.waitForTimeout(200);const J=await p.evaluate(()=>{const r=APP.C.R[APP.D.runs[0].id];return{perTon:r.perTon,farzKg:r.farzKgCost,rows:r.rows.map(s=>s.perTon)}});
ok('طريقة التوزيع بالوزن: 591,260/17,000 = 34.78 ج/كجم',near(J.perTon,591260/17000*1000)&&near(J.farzKg,591260/17000),JSON.stringify(J));
fs.writeFileSync(OUT+'/joint.json',JSON.stringify(J));
await p.check('input[value="credit"]');await p.waitForTimeout(150);
// 13) أوفلاين
if(!WK){await p.waitForTimeout(800);await ctx.setOffline(true);await p.reload();await p.waitForFunction(()=>window.__ready,{timeout:10000}).catch(()=>{});ok('يفتح من غير نت',await p.evaluate(()=>!!window.__ready).catch(()=>false));await ctx.setOffline(false);}
ok('مفيش أخطاء JavaScript',errs.length===0,errs.join(' | '));
fs.writeFileSync(OUT+'/results.json',JSON.stringify(res,null,1));console.log(res.filter(r=>r.pass).length+'/'+res.length);
await b.close();
