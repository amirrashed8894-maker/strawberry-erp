// v1.2.5: مستلزمات التشغيل vs التحميل — صرف التحميل لكل حاوية بوحدات كاملة من مخزن مصنع التحميل + الربحية + فاتورة العميل من غير تكاليف داخلية + ترحيل 1.2.4 — بروفايل مؤقت، مفيش سحابة
import { chromium, webkit, devices } from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.mjs';
import fs from 'fs';
const WK=process.env.ENGINE==='webkit',BASE=process.env.BASE||(WK?'http://erp.test/':'http://127.0.0.1:8811/');
const OUT='/workspace/strawberry_erp/test/out125'+(WK?'_webkit':'')+(process.env.BASE?'_live':'');fs.mkdirSync(OUT,{recursive:true});const PV='/workspace/strawberry_erp/previews/v125';fs.mkdirSync(PV,{recursive:true});
const SAVEPV=!WK&&!process.env.BASE;
const res=[];const ok=(n,c,i='')=>{res.push({n,pass:!!c,i});console.log((c?'PASS ':'FAIL ')+n+(i?' — '+String(i).slice(0,220):''))};const near=(a,b,t=0.005)=>Math.abs(a-b)<=t;
const b=WK?await webkit.launch():await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await b.newContext(WK?{...devices['iPhone 13'],locale:'ar-EG',timezoneId:'Africa/Cairo'}:{viewport:{width:390,height:844},deviceScaleFactor:1000/390,isMobile:true,hasTouch:true,locale:'ar-EG',timezoneId:'Africa/Cairo'});
const MT={html:'text/html; charset=utf-8',js:'text/javascript',json:'application/json',webmanifest:'application/manifest+json',png:'image/png',jpg:'image/jpeg',css:'text/css'};
if(WK&&!process.env.BASE)await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='erp.test')return r.abort();const f='/workspace/strawberry_erp'+(u.pathname==='/'?'/index.html':u.pathname);if(fs.existsSync(f))return r.fulfill({status:200,contentType:MT[f.split('.').pop()]||'application/octet-stream',body:fs.readFileSync(f)});return r.fulfill({status:404,body:''})});
await ctx.route(/supabase\.co/,r=>r.abort());
const NATIVE=[];const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>{NATIVE.push(d.type()+': '+d.message());d.dismiss()});
await p.addInitScript({path:'/workspace/strawberry_erp/test/dlghook.js'});
await p.goto(BASE);await p.waitForFunction(()=>window.__ready);ok('مش مربوط بالسحابة',await p.evaluate(()=>!SYNC.state.enabled));ok('النسخة 1.2.4+',await p.evaluate(()=>APP.VER)>='1.2.4');
await p.goto(BASE);await p.waitForFunction(()=>window.__ready);ok('مش مربوط بالسحابة',await p.evaluate(()=>!SYNC.state.enabled));ok('النسخة 1.2.5+',await p.evaluate(()=>APP.VER)>='1.2.5');
// 0) نسخة فيها تشغيلة اتعملت بـ 1.2.4 (صرف تلقائي فيه باليت/داتا لوجر/عمولات) + فاتورة حاويات قديمة من غير تحميل
const J=JSON.parse(fs.readFileSync('/workspace/strawberry_erp/test/scenario100.json','utf8'));const r4=J.data.runs.find(r=>r.id==='r4');r4.autoSup=true;
r4.supplies=(r4.supplies||[]).concat([{itemId:'itm2',qty:13.4,locId:'fac4',auto:true,bk:'pal'},{itemId:'itm9',qty:1,locId:'fac4',auto:true,bk:'dl',ovr:true}]);
r4.costs=(r4.costs||[]).concat([{name:'عمولات',amount:13416.67,auto:true,bk:'comm'},{name:'تكلفة زيادة يدوي',amount:100}]);
const r4man=JSON.stringify([(r4.supplies||[]).filter(l=>!l.auto),(r4.costs||[]).filter(c=>!c.auto)]);
J.data.sales.push({id:'s8',no:8,date:'2026-11-12',kind:'export',cont:true,invNo:'FR27050',customerId:'cus-fussga',cur:'USD',rate:50.8,lines:[{runId:'r4',cont:'MSCU5550001',bl:'BL-OLD',tons:1,price:1.2}],expenses:[],createdAt:'2026-11-12T08:00:00.000Z'});
fs.writeFileSync('/workspace/strawberry_erp/test/scenario125_legacy.json',JSON.stringify(J));
await p.evaluate(()=>location.hash='#/backup');await p.setInputFiles('#restoreFile','/workspace/strawberry_erp/test/scenario125_legacy.json');await p.waitForFunction(()=>APP.D.runs.length===4&&APP.D.sales.length===8);
await p.waitForFunction(()=>{const r=APP.D.runs.find(r=>r.id==='r4');return r&&!(r.supplies||[]).some(l=>l.bk==='pal')},null,{timeout:8000}).catch(()=>{});
let R4=await p.evaluate(()=>APP.D.runs.find(r=>r.id==='r4'));
ok('ترحيل: سطور الباليت/العمولات التلقائي اتشالت من التشغيلة القديمة',!R4.supplies.some(l=>l.bk==='pal'||l.bk==='dl')&&!R4.costs.some(c=>c.bk==='comm'),JSON.stringify([R4.supplies,R4.costs]).slice(0,300));
ok('ترحيل: السطر اللي كان متعدل يدوي (داتا لوجر 1) بقى سطر يدوي بنفس الرقم',R4.supplies.some(l=>!l.auto&&l.itemId==='itm9'&&l.qty===1&&!l.bk));
ok('ترحيل: السطور اليدوي ما اتلمستش',JSON.stringify([R4.supplies.filter(l=>!l.auto&&l.itemId!=='itm9'),R4.costs.filter(c=>!c.auto)])===r4man,JSON.stringify(R4.costs));
ok('ترحيل: اتكتب في سجل التعديل',JSON.stringify((R4.edits||[]).slice(-1)).includes('ترحيل 1.2.5'),JSON.stringify(R4.edits||[]).slice(0,300));
ok('الفاتورة القديمة ما اتغيرتش لوحدها',await p.evaluate(()=>{const s=APP.D.sales.find(s=>s.id==='s8');return !s.autoLoad&&!s.lines[0].ld&&!APP.C.SL.s8.load}));
await p.evaluate(()=>window.__dlgMode='ui');
const S='#sheet ';
const fill=async(k,v)=>{await p.fill(S+`input[data-p="${k}"]`,String(v))};const selV=async(k,v)=>{await p.selectOption(S+`select[data-p="${k}"]`,String(v));await p.waitForTimeout(30)};
const btn=async(sel)=>{await p.evaluate(sel=>{const b=document.createElement('button');Object.assign(b.dataset,sel);document.body.appendChild(b);b.click();b.remove()},sel);await p.waitForTimeout(80)};
const trySave=async()=>{await p.click(S+'.shb [data-act="fsave"]');await p.waitForTimeout(180);if(await p.$eval('#dlg',e=>!e.hidden).catch(()=>false))return 'DLG';return (await p.$eval('#sheet',e=>!e.hidden))?await p.textContent('#ferr'):''};
const save=async()=>{const e=await trySave();if(e)throw new Error('save failed '+e)};const close=async()=>{if(await p.$eval('#sheet',e=>!e.hidden))await p.click(S+'.shb [data-act="fclose"]');await p.waitForTimeout(40)};
const dlgKind=()=>p.$eval('#dlg:not([hidden]) .dlgb',e=>e.dataset.kind).catch(()=>'');
const SL=id=>p.evaluate(id=>{const x=APP.C.SL[id];return x?{nCont:x.nCont,tons:x.tons,kg:x.kg,amount:x.amount,rev:x.rev,cogs:x.cogs,invNo:x.invNo,cont:x.cont,lines:x.lines.map(l=>({cont:l.cont,bl:l.bl,tons:l.tons,price:l.price,amount:l.amount,runId:l.runId,kg:l.kg}))}:null},id);const newK=async(k,extra={})=>{await btn(Object.assign({act:'new',k},extra));await p.waitForTimeout(60)};
const editK=async(k,id)=>{await btn({act:'edit',k,id});await p.waitForTimeout(60)};
const SUP=()=>p.evaluate(()=>(APP.F.d.supplies||[]).map(l=>({itemId:l.itemId,qty:l.qty,locId:l.locId,auto:!!l.auto,ovr:!!l.ovr,bk:l.bk||''})));
const rowTxt=i=>p.textContent(S+`.sups [data-sa="${i}"]`).catch(()=>'');
const autoIdx=async it=>(await SUP()).findIndex(l=>l.auto&&l.itemId===it);
const bal=(it,loc)=>p.evaluate(([it,loc])=>APP.C.SUP[it].loc[loc]||0,[it,loc]);
const jpg=async(name,sel)=>{if(!SAVEPV)return;await p.evaluate(()=>{document.querySelector('#toast').classList.remove('on');document.activeElement&&document.activeElement.blur()});await p.waitForTimeout(350);
  if(sel){await p.$eval(S+sel,e=>{e.scrollIntoView({block:'start'});document.querySelector('#sheet').scrollTop-=60})}await p.waitForTimeout(80);await p.screenshot({path:PV+'/'+name,type:'jpeg',quality:86})};
const untoast2=()=>p.evaluate(()=>{document.querySelector('#toast').classList.remove('on');document.activeElement&&document.activeElement.blur()}).then(()=>p.waitForTimeout(350));

const COST=()=>p.evaluate(()=>(APP.F.d.costs||[]).map(c=>({name:c.name,amount:c.amount,auto:!!c.auto,ovr:!!c.ovr,bk:c.bk||'',partyId:c.partyId||''})));
const bkIdx=async k=>p.evaluate(k=>(APP.F.d.supplies||[]).findIndex(l=>l.auto&&l.bk===k),k);
const cIdx=async k=>p.evaluate(k=>(APP.F.d.costs||[]).findIndex(l=>l.auto&&l.bk===k),k);
const commit=async sel=>{await p.$eval(S+sel,e=>e.dispatchEvent(new Event('change',{bubbles:true})));await p.waitForTimeout(80)};
const B0={};for(const it of ['itm1','itm2','itm3','itm5','itm7','itm9','itm10','itm11'])B0[it]=await bal(it,'fac1');
// 1) الإعدادات: المكونات متقسمة «عند التشغيل» / «عند التحميل»
await p.evaluate(()=>location.hash='#/settings');await p.waitForTimeout(150);let tx=await p.textContent('body');
ok('الإعدادات: مجموعتين «عند التشغيل» و«عند التحميل»',tx.includes('عند التشغيل')&&tx.includes('عند التحميل'));
const [runSeg,loadSeg]=await p.$$eval('.bom',e=>e.map(x=>x.innerText));
ok('عند التشغيل: كرتون/كيس/ستيكر صغير/لزق/رسم تعبئة المصنع',['كرتون','كيس','ستيكر صغير','لزق','سيزر'].every(w=>runSeg.includes(w))&&!runSeg.includes('باليت')&&!runSeg.includes('أوراق ومستندات')&&!runSeg.includes('داتا لوجر'),runSeg.slice(0,300));
ok('عند التحميل: باليت/زوايا/ستيكر كبير/داتا لوجر/استرتش/عمولات/أوراق/إكراميات',['باليت','زوايا','ستيكر كبير','داتا لوجر','استرتش','عمول','أوراق','إكرامي'].every(w=>loadSeg.includes(w)),loadSeg.slice(0,300));
ok('قيم الحاوية: عمولات 20,000 / أوراق 12,000 / إكراميات 1,500 / سيزر 48,000 / لزق 1,704',['20,000.00','12,000.00','1,500.00','48,000.00','1,704.00'].every(v=>tx.includes(v)));
if(SAVEPV){await untoast2();await p.$eval('.bom',e=>{e.scrollIntoView({block:'start'});window.scrollBy(0,-110)});await p.waitForTimeout(80);await p.screenshot({path:PV+'/bom_settings_grouped_mobile.jpg',type:'jpeg',quality:86});
  await p.setViewportSize({width:1000,height:2400});await p.waitForTimeout(250);const cd=await p.$('.bom >> xpath=ancestor::section[1]');await cd.screenshot({path:PV+'/bom_settings_grouped.jpg',type:'jpeg',quality:86,scale:'css'});await p.setViewportSize({width:390,height:844});await p.waitForTimeout(200)}
await p.click('button[data-act="bomEdit"]');await p.waitForSelector('#sheet:not([hidden])');
ok('فورم المكونات متقسم بمرحلة لكل سطر',(await p.textContent('#sheet')).includes('عند التحميل')&&!!await p.$(S+'select[data-p$=".stage"]'));
const strI=await p.evaluate(()=>APP.F.d.bom.lines.findIndex(l=>l.k==='str'));
ok('مرحلة الاسترتش «عند التحميل» وتتعدل',await p.$eval(S+`select[data-p="bom.lines.${strI}.stage"]`,e=>e.value)==='load');
await close();
// 2) تشغيلة جديدة 2,400 كرتونة: مستلزمات التشغيل بس
await newK('purchase');await fill('date','14/11/2026');await selV('supplierId','R1');await selV('factoryId','fac1');await fill('plate','تجريبي 1251');await fill('ticketNo','BSK-951');await fill('net',26000);await fill('price',28);await save();
const pid=await p.evaluate(()=>APP.D.purchases.find(x=>x.ticketNo==='BSK-951').id);
await p.evaluate(()=>location.hash='#/runs');await p.waitForTimeout(120);await newK('run');
await selV('factoryId','fac1');await selV('inputs.0.purchaseId',pid);await fill('inputs.0.kg',25000);await fill('cartons',2400);
let s=await SUP();let cs=await COST();
ok('التشغيلة: كرتون/كيس/ستيكر صغير 2,400 بس — مفيش باليت ولا زوايا ولا داتا لوجر',JSON.stringify(s.filter(l=>l.auto).map(l=>[l.bk,l.qty]))===JSON.stringify([['ctn',2400],['bag',2400],['stS',2400]]),JSON.stringify(s));
ok('التشغيلة: لزق 1,704 + رسم تعبئة المصنع 48,000 بس',JSON.stringify(cs.filter(c=>c.auto).map(c=>[c.bk,c.amount]))===JSON.stringify([['tape',1704],['pack',48000]]),JSON.stringify(cs));
ok('رسم التعبئة على حساب المصنع',cs.find(c=>c.bk==='pack').partyId!=='' );
ok('ملاحظة إن الباقي بيتصرف عند التحميل',(await p.textContent(S+'.sups')).includes('عند التحميل'));
await jpg('run_stage_auto.jpg','.sups');
let er=await trySave();if(er==='DLG'){await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(200);er=await p.$eval('#sheet',e=>!e.hidden)?await p.textContent('#ferr'):''}
ok('التشغيلة اتحفظت',!er,er);
const rid=await p.evaluate(()=>APP.D.runs.slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''))[0].id);
const RC=await p.evaluate(id=>({costsT:APP.C.R[id].costsT,stock:APP.C.R[id].stockFin,no:APP.D.runs.find(r=>r.id===id).no,suppT:APP.C.R[id].suppT}),rid);
ok('تكلفة التشغيلة فيها خدمات التشغيل بس (49,704)',near(RC.costsT,49704,0.01),JSON.stringify(RC));
ok('الباليتات والداتا لوجر ما اتصرفوش في التشغيلة',await bal('itm2','fac1')===B0.itm2&&await bal('itm9','fac1')===B0.itm9);
// 3) فاتورة حاوية: صرف التحميل تلقائي بوحدات كاملة
await btn({act:'new',k:'sale',kind:'export'});ok('بيسأل عن عدد الحاويات',await dlgKind()==='count');await p.fill('#dlg input[data-dk="n"]','1');await p.click('#dlg [data-dlg="ok"]');await p.waitForSelector('#sheet:not([hidden])');
ok('الفاتورة الجديدة = تحميل تلقائي',await p.evaluate(()=>APP.F.d.autoLoad===true));
await selV('customerId','cus-fussga');await fill('date','14/11/2026');await fill('rate','50.8');await selV('lines.0.runId',rid);await fill('lines.0.cont','TGHU2400001');await fill('lines.0.bl','MEDU2400001');await fill('lines.0.tons','24');await fill('lines.0.price','1.2');
const LD=()=>p.evaluate(()=>JSON.parse(JSON.stringify(APP.F.d.lines.map(l=>l.ld))));
let ld=(await LD())[0];
ok('مستلزمات التحميل: باليت 20 (⌈2400÷120⌉)، زوايا 80، ستيكر كبير 1,500، داتا لوجر 1، استرتش 2',JSON.stringify(ld.sup.map(x=>[x.k,x.qty]))===JSON.stringify([['pal',20],['cor',80],['stL',1500],['dl',1],['str',2]]),JSON.stringify(ld.sup));
ok('خدمات التحميل: عمولات 20,000 / أوراق 12,000 / إكراميات 1,500',JSON.stringify(ld.svc.map(x=>[x.k,x.amount]))===JSON.stringify([['comm',20000],['docs',12000],['tips',1500]]),JSON.stringify(ld.svc));
ok('مخزن التحميل الافتراضي = مصنع التشغيلة',ld.locId==='fac1');
let lt=await p.textContent(S+'.ldb');ok('السطور مكتوب عليها «تلقائي» والطريقة والمتاح',lt.includes('تلقائي')&&lt.includes('⌈')&&lt.includes('المتاح')&&lt.includes('مش بيظهر للعميل'),lt.slice(0,300));
ok('تحذير نقص (الباليت المتاح 3)',lt.includes('ناقص 17'),lt.slice(0,400));
await fill('lines.0.tons','12.05');ld=(await LD())[0];ok('1,205 كرتونة = 11 باليت (تقريب لفوق) والباقي كامل للحاوية',ld.sup.find(x=>x.k==='pal').qty===11&&ld.sup.find(x=>x.k==='cor').qty===44&&ld.sup.find(x=>x.k==='stL').qty===1500&&ld.svc.find(x=>x.k==='comm').amount===20000,JSON.stringify(ld.sup));
await fill('lines.0.tons','24');
await selV('lines.0.ld.locId','fac2');ld=(await LD())[0];ok('تغيير مخزن التحميل للحاوية',ld.locId==='fac2'&&ld.locSet===true);lt=await p.textContent(S+'.ldb');ok('المتاح بيتحسب من المخزن الجديد (الحسن: باليت 6 → ناقص 14)',lt.includes('ناقص 14'),lt.slice(0,300));
await selV('lines.0.ld.locId','fac1');
// تعديل يدوي + رجوع
const sj=k=>ld.sup.findIndex(x=>x.k===k),vj=k=>ld.svc.findIndex(x=>x.k===k);
await p.click(S+`[data-act="ldOvr"][data-li="0"][data-t="sup"][data-j="${sj('str')}"]`);await p.waitForTimeout(60);await fill(`lines.0.ld.sup.${sj('str')}.qty`,3);
ld=(await LD())[0];ok('تعديل يدوي للاسترتش (3)',+ld.sup[sj('str')].qty===3&&ld.sup[sj('str')].ovr);
await p.click(S+`[data-act="ldOvr"][data-li="0"][data-t="svc"][data-j="${vj('docs')}"]`);await p.waitForTimeout(60);await fill(`lines.0.ld.svc.${vj('docs')}.amount`,9000);
await p.click(S+`[data-act="ldOvr"][data-li="0"][data-t="sup"][data-j="${sj('cor')}"]`);await p.waitForTimeout(60);await fill(`lines.0.ld.sup.${sj('cor')}.qty`,5);
await p.click(S+`[data-act="ldAuto"][data-li="0"][data-t="sup"][data-j="${sj('cor')}"]`);await p.waitForTimeout(60);ld=(await LD())[0];ok('«رجّعه تلقائي» بيرجع الزوايا 80',ld.sup[sj('cor')].qty===80&&!ld.sup[sj('cor')].ovr);
// مصروف يدوي «إكراميات» بيلغي الإكراميات التلقائي
await p.click(S+'[data-ladd="expenses"]');await p.waitForTimeout(60);await fill('expenses.0.name','إكراميات التحميل');await commit('input[data-p="expenses.0.name"]');await p.waitForTimeout(80);await fill('expenses.0.amount',1000);
ld=(await LD())[0];ok('مصروف بيع «إكراميات» بيلغي الإكراميات التلقائي (مفيش حساب مرتين)',!ld.svc.some(x=>x.k==='tips')&&(await p.textContent(S+'.ldb')).includes('مش هيتحسب تاني'),JSON.stringify(ld.svc));
ok('ملخص الفاتورة فيه تكلفة التحميل',(await p.textContent('#fsum')).includes('تكلفة التحميل'));
await jpg('container_loading_auto.jpg','.ldb');
er=await trySave();let dm='';if(er==='DLG'){dm=await p.textContent('#dlg .dlgm');ok('نقص مستلزمات التحميل بيسأل بنافذة داخلية',await dlgKind()==='confirm'&&dm.includes('باليت'),dm);await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(200);er=await p.$eval('#sheet',e=>!e.hidden)?await p.textContent('#ferr'):''}else ok('نقص مستلزمات التحميل بيسأل بنافذة داخلية',false,er);
ok('الفاتورة اتحفظت',!er,er);
const sid=await p.evaluate(()=>APP.D.sales.slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''))[0].id);
const SV=await p.evaluate(id=>{const s=APP.D.sales.find(s=>s.id===id);return{ld:s.lines[0].ld,autoLoad:s.autoLoad}},sid);
ok('اتحفظ: 20 باليت، 80 زاوية، 1,500 ستيكر، 1 داتا لوجر، 3 استرتش (يدوي) + عمولات 20,000، أوراق 9,000 (يدوي)',JSON.stringify(SV.ld.sup.map(x=>[x.k,x.qty,!!x.ovr]))===JSON.stringify([['pal',20,false],['cor',80,false],['stL',1500,false],['dl',1,false],['str',3,true]])&&JSON.stringify(SV.ld.svc.map(x=>[x.k,x.amount]))===JSON.stringify([['comm',20000],['docs',9000]]),JSON.stringify(SV.ld));
ok('المخزن نقص من مخزن التحميل',await bal('itm2','fac1')===B0.itm2-20&&await bal('itm9','fac1')===B0.itm9-1&&await bal('itm5','fac1')===B0.itm5-3&&await bal('itm11','fac1')===(B0.itm11||0)-1500);
const X=await p.evaluate(id=>{const x=APP.C.SL[id];return{rev:x.rev,cogs:x.cogs,exp:x.exp,load:x.load,loadSup:x.loadSup,loadSvc:x.loadSvc,profit:x.profit,lines:x.lines.map(l=>({load:l.load,items:l.loadItems}))}},sid);
ok('ربح البيع = الإيراد − التكلفة − المصروفات − التحميل',near(X.profit,X.rev-X.cogs-X.exp-X.load,0.01)&&near(X.loadSvc,29000,0.01)&&X.loadSup>450,JSON.stringify(X).slice(0,300));
ok('الستيكر الكبير بسعر المكونات (1,500 × 0.30 = 450)',X.lines[0].items.some(q=>q.itemId==='itm11'&&near(q.cost,450,0.001)),JSON.stringify(X.lines[0].items));
ok('تكلفة التشغيلة ما اتغيرتش بالتحميل',await p.evaluate(([id,c])=>Math.abs(APP.C.R[id].costsT-c)<0.01,[rid,RC.costsT]));
ok('العمولة اتسجلت على حساب الخدمات لو له حساب، والعميل ما عليهوش غير الإيراد',await p.evaluate(id=>{const L=APP.C.L['cus-fussga']||[];return !L.some(e=>e.kind==='loadSvc')&&Math.abs(L.find(e=>e.ref===id).dr-APP.C.SL[id].rev)<0.01},sid));
// سجل التعديل
await editK('sale',sid);ld=(await LD())[0];
await p.click(S+`[data-act="ldAuto"][data-li="0"][data-t="sup"][data-j="${sj('str')}"]`);await p.waitForTimeout(60);ld=(await LD())[0];ok('في التعديل: «رجّعه تلقائي» للاسترتش = 2',ld.sup.find(x=>x.k==='str').qty===2);
er=await trySave();if(er==='DLG'){await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(200)}
const ed=await p.evaluate(id=>JSON.stringify((APP.D.sales.find(s=>s.id===id).edits||[]).slice(-1)),sid);ok('سجل التعديل: «حاوية 1 تحميل … استرتش 3 ← 2»',ed.includes('تحميل')&&ed.includes('استرتش'),ed);
ok('المخزن رجع استرتش 1',await bal('itm5','fac1')===B0.itm5-2);
// 4) فاتورة قديمة: زرار «احسب التحميل تلقائي»
const s8=await p.evaluate(()=>JSON.stringify(APP.D.sales.find(s=>s.id==='s8')));
await editK('sale','s8');ok('الفاتورة القديمة بتفتح من غير تحميل وفيها زرار «احسب التحميل تلقائي»',!await p.$(S+'.ldb')&&!!await p.$(S+'[data-act="loadAutoOn"]'));
await p.click(S+'[data-act="loadAutoOn"]');await p.waitForTimeout(100);ok('الزرار بيأكد بنافذة داخلية',await dlgKind()==='confirm');await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(120);
ld=(await LD())[0];ok('اتحسب: 100 كرتونة → زوايا 4 (باليت 1) + ستيكر كبير 1,500 + 3 خدمات كاملة، من مخزن بوناتيرا (الباليت/الاسترتش/الداتا لوجر متصرفين يدوي في التشغيلة القديمة فمش بيتكرروا)',ld&&ld.locId==='fac4'&&JSON.stringify(ld.sup.map(x=>[x.k,x.qty]))===JSON.stringify([['cor',4],['stL',1500]])&&ld.svc.length===3,JSON.stringify(ld));
ok('الداتا لوجر متسجل يدوي في التشغيلة بعد الترحيل → مش بيتصرف تاني',(await p.textContent(S+'.ldb')).includes('متصرف يدوي في تشغيلة'));
await close();ok('الإلغاء ما بيغيرش الفاتورة القديمة',await p.evaluate(()=>JSON.stringify(APP.D.sales.find(s=>s.id==='s8')))===s8);
// 5) تقارير
await p.waitForFunction(()=>window.jspdf&&window.html2canvas,null,{timeout:30000}).catch(()=>{});
const rep=async(k,o,nm)=>{const r=await p.evaluate(async([k,o])=>{await RPT.open(k,o);const html=document.querySelector('#pages').innerHTML;const txt=document.querySelector('#pages').innerText;const pdf=await RPT.makePdf();RPT.close();const u=new Uint8Array(pdf.output('arraybuffer'));let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return{html,txt,b64:btoa(s)}},[k,o]);
  if(nm&&SAVEPV)fs.writeFileSync(PV+'/'+nm+'.pdf',Buffer.from(r.b64,'base64'));return r};
let RR=await rep('run',{id:rid},'run_cost_report');ok('تقرير تكلفة التشغيلة: مكونات التشغيل بس، والتحميل بيتحسب في فاتورة البيع',RR.txt.includes('لزق')&&RR.txt.includes('بتتصرف عند التحميل')&&!RR.txt.includes('عمولات شراء الخام')&&!RR.txt.includes('باليت خشب'),RR.txt.slice(RR.txt.indexOf('مكونات'),RR.txt.indexOf('مكونات')+300));
RR=await rep('profitDet',{},'profitability_detailed');ok('الربحية التفصيلي: عمود «تكلفة التحميل» وسطر تحميل تحت الحاوية',RR.txt.includes('تكلفة التحميل')&&RR.txt.includes('TGHU2400001')&&/باليت/.test(RR.txt),RR.txt.slice(0,200));
RR=await rep('profitSum',{},'profitability_summary');ok('الربحية الملخص: تكلفة التحميل',RR.txt.includes('تكلفة التحميل'));
const bad=['تحميل','عمول','باليت','داتا لوجر','استرتش','إكرامي','زوايا','أوراق'];
RR=await rep('inv',{id:sid},'customer_invoice');ok('فاتورة العميل: مفيش أي تكلفة داخلية (تحميل/عمولات/باليت…)',!bad.some(w=>RR.txt.includes(w))&&RR.txt.includes('TGHU2400001'),bad.filter(w=>RR.txt.includes(w)).join());
ok('فاتورة العميل من غير علامات تعديل',!RR.html.includes('enote')&&!RR.html.includes('معدل'));
RR=await rep('stmt',{id:'cus-fussga'},'customer_statement');ok('كشف حساب العميل: مفيش تكاليف داخلية',!bad.some(w=>RR.txt.includes(w))&&!RR.html.includes('enote'),bad.filter(w=>RR.txt.includes(w)).join());
// 6) أمان
ok('مفيش نوافذ متصفح (alert/confirm/prompt)',NATIVE.length===0,NATIVE.join(' | '));
ok('مفيش أخطاء جافاسكريبت',errs.length===0,errs.join(' | '));
ok('لسه مش مربوط بالسحابة',await p.evaluate(()=>!SYNC.state.enabled));
const pass=res.filter(r=>r.pass).length;console.log(`\n${pass}/${res.length} passed`);fs.writeFileSync(OUT+'/results.json',JSON.stringify(res,null,1));
await b.close();process.exit(pass===res.length?0:1);
