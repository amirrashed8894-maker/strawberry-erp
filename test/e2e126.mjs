// v1.2.6: أسعار الزوايا 20 ج والداتا لوجر 240 ج + ترحيل المكونات المحفوظة — بروفايل مؤقت، مفيش سحابة، ومفيش كتابة على مساحة العمل الحقيقية
import { chromium, webkit, devices } from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.mjs';
import fs from 'fs';
const WK=process.env.ENGINE==='webkit',BASE=process.env.BASE||(WK?'http://erp.test/':'http://127.0.0.1:8811/');
const OUT='/workspace/strawberry_erp/test/out126'+(WK?'_webkit':'')+(process.env.BASE?'_live':'');fs.mkdirSync(OUT,{recursive:true});const PV='/workspace/strawberry_erp/previews/v126';fs.mkdirSync(PV,{recursive:true});
const SAVEPV=!WK&&!process.env.BASE;
const res=[];const ok=(n,c,i='')=>{res.push({n,pass:!!c,i});console.log((c?'PASS ':'FAIL ')+n+(i?' — '+String(i).slice(0,240):''))};const near=(a,b,t=0.005)=>Math.abs(a-b)<=t;
const b=WK?await webkit.launch():await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await b.newContext(WK?{...devices['iPhone 13'],locale:'ar-EG',timezoneId:'Africa/Cairo'}:{viewport:{width:390,height:844},deviceScaleFactor:1000/390,isMobile:true,hasTouch:true,locale:'ar-EG',timezoneId:'Africa/Cairo'});
const MT={html:'text/html; charset=utf-8',js:'text/javascript',json:'application/json',webmanifest:'application/manifest+json',png:'image/png',jpg:'image/jpeg',css:'text/css'};
if(WK&&!process.env.BASE)await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='erp.test')return r.abort();const f='/workspace/strawberry_erp'+(u.pathname==='/'?'/index.html':u.pathname);if(fs.existsSync(f))return r.fulfill({status:200,contentType:MT[f.split('.').pop()]||'application/octet-stream',body:fs.readFileSync(f)});return r.fulfill({status:404,body:''})});
await ctx.route(/supabase\.co/,r=>r.abort());
const NATIVE=[];const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>{NATIVE.push(d.type()+': '+d.message());d.dismiss()});
await p.addInitScript({path:'/workspace/strawberry_erp/test/dlghook.js'});
await p.goto(BASE);await p.waitForFunction(()=>window.__ready);
ok('مش مربوط بالسحابة',await p.evaluate(()=>!SYNC.state.enabled));
ok('النسخة 1.2.6+',await p.evaluate(()=>APP.VER)>='1.2.6');
ok('مساحة العمل مش «شركة الراشد للتجارة — تكاليف الفراولة»',await p.evaluate(()=>!((SYNC.state&&SYNC.state.name)||'').includes('الراشد')));

const J=JSON.parse(fs.readFileSync('/workspace/strawberry_erp/test/scenario100.json','utf8'));
const def=JSON.parse(await p.evaluate(()=>JSON.stringify(ERP.DEF_BOM)));
// 1) ترحيل: مكونات محفوظة من غير سعر / بسعر صفر
const J1=JSON.parse(JSON.stringify(J));
J1.data.settings[0].bom={src:def.src,perPal:def.perPal,perCont:def.perCont,lines:def.lines.map(l=>{const x=Object.assign({},l);if(l.k==='cor'||l.k==='dl')delete x.price;return x}),services:def.services};
J1.data.settings[0].bom.lines.find(l=>l.k==='dl').price=0;
fs.writeFileSync('/workspace/strawberry_erp/test/scenario126_legacy.json',JSON.stringify(J1));
await p.evaluate(()=>location.hash='#/backup');await p.setInputFiles('#restoreFile','/workspace/strawberry_erp/test/scenario126_legacy.json');
await p.waitForFunction(()=>APP.D.runs.length===4);
await p.waitForFunction(()=>{const b=(APP.S().bom&&APP.S().bom.lines)||[];const c=b.find(l=>l.k==='cor'),d=b.find(l=>l.k==='dl');return c&&c.price===20&&d&&d.price===240},null,{timeout:8000}).catch(()=>{});
let st=await p.evaluate(()=>{const s=APP.S(),b=s.bom||{},c=(b.lines||[]).find(l=>l.k==='cor')||{},d=(b.lines||[]).find(l=>l.k==='dl')||{};return{cor:c.price,dl:d.price,note:((s.edits||[]).slice(-1)[0]||{}).txt||'',stL:((b.lines||[]).find(l=>l.k==='stL')||{}).price}});
ok('ترحيل: الزوايا 20 والداتا لوجر 240 لو السعر كان فاضي/صفر',st.cor===20&&st.dl===240,JSON.stringify(st));
ok('ترحيل: سعر الستيكر الكبير ما اتلمستش',st.stL===0.3);
ok('ترحيل: ملاحظة خفيفة «ترحيل 1.2.6»',String(st.note).includes('ترحيل 1.2.6')&&st.note.includes('الزوايا')&&st.note.includes('داتا لوجر'),st.note);

// 2) ترحيل: سعر المستخدم المختلف ما بيتلمسش
const J2=JSON.parse(JSON.stringify(J));
J2.data.settings[0].bom={src:def.src,perPal:120,perCont:2400,lines:def.lines.map(l=>{const x=Object.assign({},l);if(l.k==='cor')x.price=15;if(l.k==='dl')x.price=300;return x}),services:def.services};
fs.writeFileSync('/workspace/strawberry_erp/test/scenario126_keep.json',JSON.stringify(J2));
await p.setInputFiles('#restoreFile','/workspace/strawberry_erp/test/scenario126_keep.json');
await p.waitForFunction(()=>APP.D.runs.length===4);
await p.waitForTimeout(200);
st=await p.evaluate(()=>{const s=APP.S(),b=s.bom||{},c=(b.lines||[]).find(l=>l.k==='cor')||{},d=(b.lines||[]).find(l=>l.k==='dl')||{};return{cor:c.price,dl:d.price,edits:s.edits||[]}});
ok('ترحيل: سعر المستخدم (زوايا 15 / داتا لوجر 300) ما اتغيرش',st.cor===15&&st.dl===300,JSON.stringify(st));
ok('ترحيل: مفيش ملاحظة جديدة لما الأسعار مختلفة ومتسجلة',!(st.edits||[]).some(e=>String(e.txt||'').includes('ترحيل 1.2.6')),JSON.stringify(st.edits));

// 3) الإعدادات بالأسعار الافتراضية (من غير مكونات محفوظة = DEF_BOM)
const J3=JSON.parse(JSON.stringify(J));
fs.writeFileSync('/workspace/strawberry_erp/test/scenario126_def.json',JSON.stringify(J3));
await p.setInputFiles('#restoreFile','/workspace/strawberry_erp/test/scenario126_def.json');
await p.waitForFunction(()=>APP.D.runs.length===4);
await p.waitForTimeout(150);
const defP=await p.evaluate(()=>{const b=ERP.bomOf(APP.S());return{cor:b.lines.find(l=>l.k==='cor').price,dl:b.lines.find(l=>l.k==='dl').price,wrote:!!(APP.S().bom),note:((APP.S().edits||[]).slice(-1)[0]||{}).txt||''}});
ok('من غير مكونات محفوظة: الأسعار الافتراضية 20 و 240 بتتنطبق من غير كتابة ترحيل',defP.cor===20&&defP.dl===240&&!defP.wrote&&!String(defP.note).includes('ترحيل 1.2.6'),JSON.stringify(defP));

const S='#sheet ';
const fill=async(k,v)=>{await p.fill(S+`input[data-p="${k}"]`,String(v))};const selV=async(k,v)=>{await p.selectOption(S+`select[data-p="${k}"]`,String(v));await p.waitForTimeout(30)};
const btn=async(sel)=>{await p.evaluate(sel=>{const b=document.createElement('button');Object.assign(b.dataset,sel);document.body.appendChild(b);b.click();b.remove()},sel);await p.waitForTimeout(80)};
const trySave=async()=>{await p.click(S+'.shb [data-act="fsave"]');await p.waitForTimeout(180);if(await p.$eval('#dlg',e=>!e.hidden).catch(()=>false))return 'DLG';return (await p.$eval('#sheet',e=>!e.hidden))?await p.textContent('#ferr'):''};
const save=async()=>{const e=await trySave();if(e)throw new Error('save failed '+e)};
const untoast=()=>p.evaluate(()=>{document.querySelector('#toast').classList.remove('on');document.activeElement&&document.activeElement.blur()}).then(()=>p.waitForTimeout(350));

await p.evaluate(()=>location.hash='#/settings');await p.waitForTimeout(200);
let tx=await p.textContent('body');
const [runSeg,loadSeg]=await p.$$eval('.bom',e=>e.map(x=>x.innerText));
ok('الإعدادات: سعر الزوايا 20 ج وقيمة الحاوية 1,600',loadSeg.includes('زوايا')&&loadSeg.includes('20.00')&&loadSeg.includes('1,600.00'),loadSeg.slice(0,400));
ok('الإعدادات: سعر الداتا لوجر 240 ج للحاوية',loadSeg.includes('داتا لوجر')&&loadSeg.includes('240.00'),loadSeg.slice(0,400));
ok('قيم الحاوية الثابتة لسه: عمولات 20,000 / أوراق 12,000 / إكراميات 1,500 / ستيكر كبير 450',['20,000.00','12,000.00','1,500.00','450.00'].every(v=>loadSeg.includes(v)),loadSeg.slice(0,400));
if(SAVEPV){await untoast();await p.setViewportSize({width:1000,height:2400});await p.waitForTimeout(250);
  const cd=await p.$('.bom-load >> xpath=ancestor::section[1]');
  await cd.screenshot({path:PV+'/bom_settings_prices.jpg',type:'jpeg',quality:86,scale:'css'});
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(200)}

// 4) تشغيلة جديدة من غير مستلزمات تحميل يدوي، وبعدين فاتورة حاوية كاملة
await p.evaluate(()=>{window.__dlgMode='accept';window.__dlgCount=1});
await btn({act:'new',k:'purchase'});await p.waitForSelector('#sheet:not([hidden])');
await fill('date','14/11/2026');await selV('supplierId','R1');await selV('factoryId','fac1');await fill('plate','تجريبي 1261');await fill('ticketNo','BSK-1261');await fill('net',26000);await fill('price',28);await save();
const pid=await p.evaluate(()=>APP.D.purchases.find(x=>x.ticketNo==='BSK-1261').id);
ok('اتحفظت فاتورة خام تجريبية',!!pid,pid);
await p.evaluate(()=>location.hash='#/runs');await p.waitForTimeout(120);
await btn({act:'new',k:'run'});await p.waitForSelector('#sheet:not([hidden])');
await selV('factoryId','fac1');await selV('inputs.0.purchaseId',pid);await fill('inputs.0.kg',25000);await fill('cartons',2400);
let er=await trySave();if(er==='DLG'){await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(200);er=await p.$eval('#sheet',e=>!e.hidden)?await p.textContent('#ferr'):''}
ok('التشغيلة التجريبية اتحفظت',!er,er);
const rid=await p.evaluate(()=>APP.D.runs.slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''))[0].id);
await btn({act:'new',k:'sale',kind:'export'});await p.waitForSelector('#sheet:not([hidden])');
ok('فاتورة تصدير اتفتحت بحاوية واحدة',await p.evaluate(()=>!!(APP.F&&APP.F.d&&APP.F.d.cont&&APP.F.d.lines&&APP.F.d.lines.length===1)));
await selV('customerId','cus-fussga');await fill('date','14/11/2026');await fill('rate','50.8');await selV('lines.0.runId',rid);await fill('lines.0.cont','TGHU1260001');await fill('lines.0.bl','MEDU1260001');await fill('lines.0.tons','24');await fill('lines.0.price','1.2');
const LD=()=>p.evaluate(()=>JSON.parse(JSON.stringify(APP.F.d.lines.map(l=>l.ld))));
let ld=(await LD())[0];
ok('مستلزمات التحميل للحاوية الكاملة: 20 باليت، 80 زاوية، 1500 ستيكر، 1 داتا لوجر، 2 استرتش',JSON.stringify(ld.sup.map(x=>[x.k,x.qty]))===JSON.stringify([['pal',20],['cor',80],['stL',1500],['dl',1],['str',2]]),JSON.stringify(ld.sup));
const SUM=await p.evaluate(()=>{const t=APP.C,tmp=document.getElementById('fsum');return{txt:tmp?tmp.innerText:'',load:null}});
let costs=await p.evaluate(()=>{
  const d=JSON.parse(JSON.stringify(APP.F.d));
  const D=APP.D,copy={};ERP.COLLS.forEach(c=>copy[c]=D[c].slice());
  copy.sales=copy.sales.concat([Object.assign({id:'__tmp126'},d)]);
  const C=ERP.compute(copy),x=C.SL.__tmp126,LI=(C.loadIss.__tmp126&&C.loadIss.__tmp126[0])||[];
  return {load:x.load,loadSup:x.loadSup,loadSvc:x.loadSvc,items:LI.map(z=>z&&{itemId:z.itemId,qty:z.qty,avg:z.avg,cost:z.cost,noPrice:z.noPrice})};
});
const it=id=>costs.items.find(z=>z&&z.itemId===id);
ok('الزوايا: 80 × 20 = 1,600 (مفيش شراء مخزن)',it('itm7')&&near(it('itm7').cost,1600)&&near(it('itm7').avg,20),JSON.stringify(it('itm7')));
ok('الداتا لوجر: متوسط المخزن (150) مش 240 لأن فيه توريد',it('itm9')&&near(it('itm9').avg,150)&&near(it('itm9').cost,150),JSON.stringify(it('itm9')));
ok('الستيكر الكبير: 1,500 × 0.30 = 450',it('itm11')&&near(it('itm11').cost,450),JSON.stringify(it('itm11')));
ok('الباليت والاسترتش من متوسط المخزن',it('itm2')&&it('itm2').avg>0&&it('itm5')&&it('itm5').avg>0,JSON.stringify({pal:it('itm2'),str:it('itm5')}));
ok('خدمات التحميل 33,500 (عمولات+أوراق+إكراميات)',near(costs.loadSvc,33500),JSON.stringify(costs));
ok('ملخص الفاتورة فيه تكلفة التحميل',(await p.textContent('#fsum')).includes('تكلفة التحميل'));
if(SAVEPV){await untoast();await p.setViewportSize({width:1000,height:2200});await p.waitForTimeout(250);
  await p.$eval('#sheet .ldb',e=>{e.scrollIntoView({block:'start'});document.querySelector('#sheet').scrollTop-=40});
  await p.waitForTimeout(80);
  const box=await p.$('#sheet .ldb');
  const sum=await p.$('#fsum');
  // combined shot of loading box + summary via a clip around the sheet column
  const r1=await box.boundingBox(),r2=await sum.boundingBox();
  const x=Math.min(r1.x,r2.x),y=Math.min(r1.y,r2.y),w=Math.max(r1.x+r1.width,r2.x+r2.width)-x,h=Math.max(r1.y+r1.height,r2.y+r2.height)-y;
  await p.screenshot({path:PV+'/container_loading_cost.jpg',type:'jpeg',quality:86,clip:{x:Math.max(0,x-12),y:Math.max(0,y-12),width:Math.min(1000,w+24),height:h+24}});
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(200)}

// 5) مساحة من غير توريد للداتا لوجر: التكلفة 240
const J4=JSON.parse(JSON.stringify(J));
J4.data.supplyIn=(J4.data.supplyIn||[]).map(s=>({...s,lines:(s.lines||[]).filter(l=>l.itemId!=='itm9')}));
fs.writeFileSync('/workspace/strawberry_erp/test/scenario126_nolog.json',JSON.stringify(J4));
await p.evaluate(()=>location.hash='#/backup');
if(await p.$eval('#sheet',e=>!e.hidden).catch(()=>false))await p.click(S+'.shb [data-act="fclose"]');
await p.waitForTimeout(80);
await p.setInputFiles('#restoreFile','/workspace/strawberry_erp/test/scenario126_nolog.json');
await p.waitForFunction(()=>APP.D.runs.length===4);
await p.waitForTimeout(150);
const noDl=await p.evaluate(()=>{
  const b=ERP.bomOf(APP.S());
  const d=JSON.parse(JSON.stringify(APP.D));
  const sup=b.lines.filter(l=>l.stage==='load').map(l=>({k:l.k,itemId:l.itemId,qty:ERP.bomLoadQty(l,2400,b),auto:true}));
  const svc=b.services.filter(v=>v.stage==='load').map(v=>({k:v.k,name:v.name,amount:ERP.bomLoadSvc(v,2400,b),auto:true}));
  d.sales=d.sales.concat([{id:'s126',no:99,date:'2026-11-14',kind:'export',cont:true,autoLoad:true,invNo:'FR27999',customerId:'cus-fussga',cur:'USD',rate:50,lines:[{runId:'r4',cont:'X1',bl:'B',tons:24,price:1.2,ld:{locId:'fac1',sup,svc}}],expenses:[]}]);
  const C=ERP.compute(d),LI=C.loadIss.s126[0],by=id=>LI.find(z=>z&&z.itemId===id);
  return {cor:by('itm7'),dl:by('itm9'),stL:by('itm11'),pal:by('itm2'),str:by('itm5'),load:C.SL.s126.load,loadSup:C.SL.s126.loadSup,loadSvc:C.SL.s126.loadSvc};
});
ok('من غير توريد داتا لوجر: 1 × 240',noDl.dl&&near(noDl.dl.cost,240)&&near(noDl.dl.avg,240),JSON.stringify(noDl.dl));
ok('الزوايا لسه 1,600 والداتا لوجر 240 والستيكر 450 والخدمات 33,500',near(noDl.cor.cost,1600)&&near(noDl.dl.cost,240)&&near(noDl.stL.cost,450)&&near(noDl.loadSvc,33500),JSON.stringify({load:noDl.load,loadSup:noDl.loadSup,loadSvc:noDl.loadSvc,pal:noDl.pal,str:noDl.str}));

ok('مفيش نوافذ متصفح (alert/confirm/prompt)',NATIVE.length===0,NATIVE.join(' | '));
ok('مفيش أخطاء جافاسكريبت',errs.length===0,errs.join(' | '));
ok('لسه مش مربوط بالسحابة',await p.evaluate(()=>!SYNC.state.enabled));
const pass=res.filter(r=>r.pass).length;console.log(`\n${pass}/${res.length} passed`);fs.writeFileSync(OUT+'/results.json',JSON.stringify(res,null,1));
await b.close();process.exit(pass===res.length?0:1);
