// v1.2.3: فاتورة التصدير بالحاويات — العدد الأول، FR27001، رقم حاوية/بوليصة/طن/سعر الكيلو، كشف العميل مفصل، فاتورة مطبوعة — بروفايل مؤقت ومفيش سحابة، نوافذ داخلية بس
import { chromium, webkit, devices } from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.mjs';
import fs from 'fs';
const WK=process.env.ENGINE==='webkit',BASE=process.env.BASE||(WK?'http://erp.test/':'http://127.0.0.1:8811/');
const OUT='/workspace/strawberry_erp/test/out123'+(WK?'_webkit':'')+(process.env.BASE?'_live':'');fs.mkdirSync(OUT,{recursive:true});const PV='/workspace/strawberry_erp/previews/v123';fs.mkdirSync(PV+'/pdf',{recursive:true});
const SAVEPV=!WK&&!process.env.BASE;
const res=[];const ok=(n,c,i='')=>{res.push({n,pass:!!c,i});console.log((c?'PASS ':'FAIL ')+n+(i?' — '+String(i).slice(0,220):''))};const near=(a,b,t=0.005)=>Math.abs(a-b)<=t;
const b=WK?await webkit.launch():await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await b.newContext(WK?{...devices['iPhone 13'],locale:'ar-EG',timezoneId:'Africa/Cairo'}:{viewport:{width:390,height:844},deviceScaleFactor:1000/390,isMobile:true,hasTouch:true,locale:'ar-EG',timezoneId:'Africa/Cairo'});
const MT={html:'text/html; charset=utf-8',js:'text/javascript',json:'application/json',webmanifest:'application/manifest+json',png:'image/png',jpg:'image/jpeg',css:'text/css'};
if(WK&&!process.env.BASE)await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='erp.test')return r.abort();const f='/workspace/strawberry_erp'+(u.pathname==='/'?'/index.html':u.pathname);if(fs.existsSync(f))return r.fulfill({status:200,contentType:MT[f.split('.').pop()]||'application/octet-stream',body:fs.readFileSync(f)});return r.fulfill({status:404,body:''})});
await ctx.route(/supabase\.co/,r=>r.abort());
const NATIVE=[];const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>{NATIVE.push(d.type()+': '+d.message());d.dismiss()});
await p.addInitScript({path:'/workspace/strawberry_erp/test/dlghook.js'});
await p.goto(BASE);await p.waitForFunction(()=>window.__ready);ok('مش مربوط بالسحابة',await p.evaluate(()=>!SYNC.state.enabled));ok('النسخة 1.2.3+',await p.evaluate(()=>APP.VER)>='1.2.3');
await p.evaluate(()=>location.hash='#/backup');await p.setInputFiles('#restoreFile','/workspace/strawberry_erp/test/scenario100.json');await p.waitForFunction(()=>APP.D.runs.length===4);
await p.evaluate(()=>window.__dlgMode='ui');// من هنا كل النوافذ بتتجرب بالضغط الحقيقي
const S='#sheet ';const fill=async(k,v)=>{await p.fill(S+`input[data-p="${k}"]`,String(v))};const selV=async(k,v)=>{await p.selectOption(S+`select[data-p="${k}"]`,String(v));await p.waitForTimeout(30)};
const btn=async(sel)=>{await p.evaluate(sel=>{const b=document.createElement('button');Object.assign(b.dataset,sel);document.body.appendChild(b);b.click();b.remove()},sel);await p.waitForTimeout(80)};
const trySave=async()=>{await p.click(S+'.shb [data-act="fsave"]');await p.waitForTimeout(180);if(await p.$eval('#dlg',e=>!e.hidden).catch(()=>false))return 'DLG';return (await p.$eval('#sheet',e=>!e.hidden))?await p.textContent('#ferr'):''};
const save=async()=>{const e=await trySave();if(e)throw new Error('save failed '+e)};const close=async()=>{if(await p.$eval('#sheet',e=>!e.hidden))await p.click(S+'.shb [data-act="fclose"]');await p.waitForTimeout(40)};
const dlgKind=()=>p.$eval('#dlg:not([hidden]) .dlgb',e=>e.dataset.kind).catch(()=>'');
const SL=id=>p.evaluate(id=>{const x=APP.C.SL[id];return x?{nCont:x.nCont,tons:x.tons,kg:x.kg,amount:x.amount,rev:x.rev,cogs:x.cogs,invNo:x.invNo,cont:x.cont,lines:x.lines.map(l=>({cont:l.cont,bl:l.bl,tons:l.tons,price:l.price,amount:l.amount,runId:l.runId,kg:l.kg}))}:null},id);
const lastSale=()=>p.evaluate(()=>APP.D.sales.slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''))[0].id);

// 0) نفضي مخزون للتجربة: نمسح بيع التصدير s6 (عميل تاني) من الشاشة بتأكيد داخلي
await btn({act:'edit',k:'sale',id:'s6'});await p.click(S+'[data-act="fdel"]');await p.waitForTimeout(80);ok('مسح بيع بتأكيد داخل البرنامج',await dlgKind()==='confirm');await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(150);
const stock=await p.evaluate(()=>({r3:APP.C.R.r3.stockFin,r4:APP.C.R.r4.stockFin}));ok('المخزون المتاح للتجربة',near(stock.r3,20000,1)&&near(stock.r4,4100,1),JSON.stringify(stock));

// 1) فاتورة 3 حاويات من زرار «+ بيع تصدير» الحقيقي — بيسأل عن العدد الأول
await p.evaluate(()=>location.hash='#/sales');await p.waitForTimeout(150);await p.click('[data-act="new"][data-k="sale"][data-kind="export"]');await p.waitForTimeout(150);
ok('أول خطوة: «عدد الحاويات في الفاتورة؟»',await dlgKind()==='count'&&(await p.textContent('#dlg h3')).includes('عدد الحاويات في الفاتورة'),await p.textContent('#dlg h3').catch(()=>''));
ok('الفورم لسه ما اتفتحش قبل العدد',await p.$eval('#sheet',e=>e.hidden));
await p.fill('#dlg input[data-dk="n"]','3');await p.selectOption('#dlg select[data-dk="runId"]','r3');await p.fill('#dlg input[data-dk="price"]','1.18');
await p.evaluate(()=>{document.activeElement&&document.activeElement.blur();document.querySelector('#toast').classList.remove('on')});await p.waitForTimeout(350);if(SAVEPV)await p.screenshot({path:OUT+'/count_prompt.png'});
await p.fill('#dlg input[data-dk="n"]','0');await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(60);const e0=await p.textContent('#dlg .dlgerr');
await p.fill('#dlg input[data-dk="n"]','2.5');await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(60);const e1=await p.textContent('#dlg .dlgerr');
ok('العدد لازم صحيح من 1 وطالع (0 و2.5 مرفوضين)',/عدد صحيح/.test(e0)&&/عدد صحيح/.test(e1),e0+' | '+e1);
await p.fill('#dlg input[data-dk="n"]','3');await p.click('#dlg [data-dlg="ok"]');await p.waitForSelector('#sheet:not([hidden])');await p.waitForTimeout(100);
const n3=await p.$$eval(S+'.conts .ln',L=>L.length);ok('اتعمل 3 سطور حاويات',n3===3,n3);
ok('رقم الفاتورة تلقائي FR27001',await p.inputValue(S+'input[data-p="invNo"]')==='FR27001',await p.inputValue(S+'input[data-p="invNo"]'));
ok('التشغيلة والسعر اتحطوا لكل الحاويات',await p.$$eval(S+'select[data-p$=".runId"]',L=>L.every(s=>s.value==='r3'))&&await p.inputValue(S+'input[data-p="lines.2.price"]')==='1.18');
await selV('customerId','cus-fussga');await fill('date','13/11/2026');await fill('rate','50.8');
const C3=[['MSKU7310452','MEDUEG261101',6.5],['MSCU5528190','MEDUEG261101',6.5],['TGHU8841203','MEDUEG261102',6.2]];
for(let i=0;i<3;i++){await fill(`lines.${i}.cont`,C3[i][0]);await fill(`lines.${i}.bl`,C3[i][1]);await fill(`lines.${i}.tons`,C3[i][2])}
ok('قيمة كل حاوية بتظهر وهي بتتكتب (طن × 1000 × سعر الكيلو)',(await p.textContent(S+'[data-cn="0"]')).includes('7,670.00'),await p.textContent(S+'[data-cn="0"]'));
// رقم حاوية متكرر في نفس الفاتورة
await fill('lines.1.cont','msku 7310452');let er=await trySave();ok('رقم حاوية متكرر في نفس الفاتورة مرفوض',/متكرر في الفاتورة/.test(er),er);
await fill('lines.1.cont',C3[1][0]);
// بيع أكتر من المتاح (بالطن ← كجم)
await fill('lines.2.tons',7.1);er=await trySave();ok('أكتر من المتاح بالطن مرفوض (20 طن متاح)',/المتاح 20,000 كجم \(20\.000 طن\)/.test(er),er);await fill('lines.2.tons',6.2);
const untoast=()=>p.evaluate(()=>{const t=document.querySelector('#toast');t.classList.remove('on');document.activeElement&&document.activeElement.blur()});await untoast();await p.waitForTimeout(350);
await p.$eval('#sheet',e=>e.scrollTop=0);await p.waitForTimeout(50);if(SAVEPV)await p.screenshot({path:OUT+'/invoice_entry.png'});
if(SAVEPV){await p.$eval(S+'.conts',e=>{e.scrollIntoView({block:'start'});document.querySelector('#sheet').scrollTop-=70});await p.waitForTimeout(60);await p.screenshot({path:OUT+'/invoice_entry_containers.png'})}
await save();const id1=await lastSale();let x=await SL(id1);
const amt3=(6.5+6.5+6.2)*1000*1.18;
ok('الإجماليات: 3 حاويات، 19.200 طن، $22,656',x.nCont===3&&near(x.tons,19.2)&&near(x.amount,amt3)&&near(x.rev,amt3*50.8),JSON.stringify(x).slice(0,200));
ok('السطر = طن × 1000 × سعر الكيلو',x.lines.every((l,i)=>near(l.amount,C3[i][2]*1000*1.18)&&l.cont===C3[i][0]&&l.bl===C3[i][1]));
ok('المخزون نقص 19,200 كجم',near(await p.evaluate(()=>APP.C.R.r3.stockFin),800,0.01));
ok('التكلفة من تكلفة التشغيلة لكل حاوية',await p.evaluate(id=>{const x=APP.C.SL[id];return x.lines.every(l=>Math.abs(l.cogs-l.kg*APP.C.R.r3.finKgCost)<0.01)},id1));

// 2) فاتورة حاوية واحدة: FR27002 + رقم حاوية موجود في فاتورة تانية بيسأل
await btn({act:'new',k:'sale',kind:'export'});ok('بيسأل عن العدد تاني',await dlgKind()==='count');await p.fill('#dlg input[data-dk="n"]','1');await p.click('#dlg [data-dlg="ok"]');await p.waitForSelector('#sheet:not([hidden])');
ok('السيريال اللي بعده FR27002',await p.inputValue(S+'input[data-p="invNo"]')==='FR27002');
await selV('customerId','cus-fussga');await fill('date','14/11/2026');await fill('rate','50.8');await selV('lines.0.runId','r3');await fill('lines.0.cont','TGHU8841203');await fill('lines.0.bl','MEDUEG261103');await fill('lines.0.tons','0.8');await fill('lines.0.price','1.2');
er=await trySave();ok('رقم حاوية موجود في فاتورة تانية: تحذير داخلي',er==='DLG'&&/FR27001/.test(await p.textContent('#dlg .dlgm')),await p.textContent('#dlg .dlgm').catch(()=>er));
await p.click('#dlg [data-dlg="no"]');await p.waitForTimeout(80);ok('«رجوع» مايحفظش',await p.$eval('#sheet',e=>!e.hidden));
await fill('lines.0.cont','CAIU2209817');await fill('invNo','FR27001');er=await trySave();ok('رقم فاتورة مكرر مرفوض',/FR27001 متسجل قبل كده/.test(er),er);
await fill('invNo','FR27002');await save();const id2=await lastSale();x=await SL(id2);ok('فاتورة حاوية واحدة: 0.800 طن × $1.20',x.nCont===1&&near(x.amount,960)&&x.invNo==='FR27002');

// 3) فاتورة 25 حاوية لعميل تاني (من غير حد أقصى)
await btn({act:'new',k:'sale',kind:'export'});await p.fill('#dlg input[data-dk="n"]','25');await p.selectOption('#dlg select[data-dk="runId"]','r4');await p.fill('#dlg input[data-dk="price"]','1.165');await p.click('#dlg [data-dlg="ok"]');await p.waitForSelector('#sheet:not([hidden])');
ok('اتعمل 25 سطر',await p.$$eval(S+'.conts .ln',L=>L.length)===25);ok('FR27003',await p.inputValue(S+'input[data-p="invNo"]')==='FR27003');
await selV('customerId','EX2');await fill('date','14/11/2026');await fill('rate','50.8');
for(let i=0;i<25;i++){await fill(`lines.${i}.cont`,'TEST'+String(1000000+i*7));await fill(`lines.${i}.bl`,'TESTBL'+(100+Math.floor(i/5)));await fill(`lines.${i}.tons`,'0.15')}
await save();const id3=await lastSale();x=await SL(id3);ok('25 حاوية: 3.750 طن، الإجمالي $4,368.75',x.nCont===25&&near(x.tons,3.75)&&near(x.amount,3.75*1000*1.165),JSON.stringify({n:x.nCont,t:x.tons,a:x.amount}));
// إضافة حاويات لفاتورة موجودة بزرار «+ عدد حاويات…»
await btn({act:'edit',k:'sale',id:id3});await p.click(S+'[data-act="addConts"]');await p.waitForTimeout(80);ok('«+ عدد حاويات…» بيسأل جوه البرنامج',await dlgKind()==='count');await p.fill('#dlg input[data-dk="n"]','2');await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(120);
ok('بقوا 27 حاوية والتشغيلة/السعر اتنسخوا',await p.$$eval(S+'.conts .ln',L=>L.length)===27&&await p.inputValue(S+'input[data-p="lines.26.price"]')==='1.165');
er=await trySave();ok('حاوية من غير رقم مرفوضة',/حاوية 26: اكتب رقم الحاوية/.test(er)&&/حاوية 27: الكمية/.test(er),er);await close();

// 4) تعديل فاتورة 3 حاويات: تغيير كمية + إضافة حاوية + مسح حاوية
await btn({act:'edit',k:'sale',id:id1});await fill('lines.1.tons','6.4');await p.click(S+'.conts [data-ladd="lines"]');await p.waitForTimeout(60);
await fill('lines.3.cont','CMAU4471020');await fill('lines.3.bl','MEDUEG261102');await fill('lines.3.tons','0.5');
ok('الحاوية الجديدة واخدة التشغيلة والسعر من اللي قبلها',await p.$eval(S+'select[data-p="lines.3.runId"]',e=>e.value)==='r3'&&await p.inputValue(S+'input[data-p="lines.3.price"]')==='1.18');
await p.click(S+'[data-ldel="lines.2"]');await p.waitForTimeout(60);await save();x=await SL(id1);
ok('بعد التعديل: 3 حاويات (6.5 + 6.4 + 0.5 = 13.400 طن)',x.nCont===3&&near(x.tons,13.4)&&near(x.amount,13.4*1180)&&x.lines.map(l=>l.cont).join()==='MSKU7310452,MSCU5528190,CMAU4471020',JSON.stringify(x.lines.map(l=>l.cont)));
const ed=await p.evaluate(id=>APP.editNotes(APP.get('sales',id),3),id1);ok('التعديل متسجل داخلي (سجل التعديلات)',ed.length===1&&/الطن 6\.5 ← 6\.4|6\.500|6\.4/.test(ed[0]),ed.join(' | '));
// تعديل السيريال يدوي بيكمل منه
await btn({act:'edit',k:'sale',id:id2});await fill('invNo','FR27010');await save();await btn({act:'new',k:'sale',kind:'export'});await p.fill('#dlg input[data-dk="n"]','1');await p.click('#dlg [data-dlg="ok"]');await p.waitForSelector('#sheet:not([hidden])');
ok('بعد تعديل رقم لـ FR27010 الجديد FR27011',await p.inputValue(S+'input[data-p="invNo"]')==='FR27011');await close();
// بيع فرزة مايسألش عن حاويات
await btn({act:'new',k:'sale',kind:'farz'});ok('بيع الفرزة من غير سؤال الحاويات',!(await dlgKind())&&await p.$eval('#sheet',e=>!e.hidden)&&!!(await p.$(S+'input[data-p="lines.0.kg"]')));await close();
// الفواتير القديمة بالكراتين لسه شغالة
await btn({act:'edit',k:'sale',id:'s2'});ok('فاتورة قديمة بالكراتين بتفتح زي ما هي',!!(await p.$(S+'input[data-p="lines.0.cartons"]'))&&!(await p.$(S+'.conts')));await close();
// تغيير نوع البيع جوه الفورم
await btn({act:'new',k:'sale',kind:'farz'});await p.click(S+'[data-fset="kind"][data-v="export"]');await p.waitForTimeout(60);ok('التحويل لتصدير جوه الفورم بيعمل حاوية وسيريال',!!(await p.$(S+'.conts'))&&/^FR270\d\d$/.test(await p.inputValue(S+'input[data-p="invNo"]')));
await p.click(S+'[data-fset="kind"][data-v="farz"]');await p.waitForTimeout(60);ok('ورجوعه لفرزة بيشيل السيريال',await p.inputValue(S+'input[data-p="invNo"]')===''&&!(await p.$(S+'.conts')));await close();

// 5) كشف حساب العميل: البيان مفصل، والرصيد صح، ومن غير أي أثر للتعديل
await p.waitForFunction(()=>window.jspdf&&window.html2canvas);
const rep=async(k,o,nm)=>{const r=await p.evaluate(async([k,o])=>{await RPT.open(k,o);const html=document.querySelector('#pages').innerHTML;const txt=document.querySelector('#pages').innerText;const pages=document.querySelectorAll('#pages .rp').length;const pdf=await RPT.makePdf();
  window.__printed=0;window.print=()=>window.__printed++;document.querySelector('#rPrint').click();const pr=window.__printed;RPT.close();const u=new Uint8Array(pdf.output('arraybuffer'));let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return{html,txt,pr,pages,b64:btoa(s)}},[k,o]);
  if(nm&&!WK)fs.writeFileSync(PV+'/pdf/'+nm+'.pdf',Buffer.from(r.b64,'base64'));return r};
const NOEDIT=r=>!/معدل|←/.test(r.txt)&&!r.html.includes('enote');
let r=await rep('stmt',{id:'cus-fussga'},'customer_statement_fussga_containers');
ok('كشف فوسجا فيه كل حاوية برقمها وبوليصتها وطنها وسعر الكيلو',['MSKU7310452','MSCU5528190','CMAU4471020','MEDUEG261101','MEDUEG261102','CAIU2209817','MEDUEG261103'].every(c=>r.txt.includes(c))&&r.txt.includes('6.400 طن')&&/1\.18/.test(r.txt)&&r.txt.includes('FR27001')&&r.txt.includes('FR27010'),'');
ok('سطور الحاويات تحت سطر الفاتورة',(r.html.match(/class="sub"/g)||[]).length===4);
ok('كشف العميل من غير أي إشارة للتعديل',NOEDIT(r));
const st=await p.evaluate(()=>{const s=APP.statement('cus-fussga');const e=s.rows.find(e=>e.inv==='FR27001');let b=s.open;let okb=true;s.rows.forEach(x=>{b+=x.dr-x.cr;if(Math.abs(b-x.bal)>0.005)okb=false});return{dr:e&&e.dr,okb,close:s.close}});
ok('المدين = قيمة الفاتورة بالجنيه والرصيد الجاري صح',near(st.dr,13.4*1180*50.8,0.01)&&st.okb,JSON.stringify(st));
ok('الطباعة شغالة',r.pr===1);
r=await rep('stmt',{id:'EX2'},'customer_statement_EX2_25_containers');ok('كشف عميل تاني فيه 25 حاوية',(r.html.match(/class="sub"/g)||[]).length===25&&r.txt.includes('TEST1000168')&&NOEDIT(r),r.pages+' صفحة');
// في الشاشة كمان
await p.evaluate(()=>location.hash='#/party/cus-fussga');await p.waitForTimeout(150);const scr=await p.textContent('#main');ok('كشف الشاشة فيه تفاصيل الحاويات ومن غير «معدل»',scr.includes('MSKU7310452')&&scr.includes('بوليصة MEDUEG261101')&&!/معدل/.test(scr));
if(SAVEPV){await untoast();await p.waitForTimeout(350);await p.$eval('.t.st .subs',e=>{e.scrollIntoView({block:'center'})});await p.waitForTimeout(60);await p.screenshot({path:OUT+'/statement_in_app.png'})}

// 6) فاتورة البيع المطبوعة
r=await rep('inv',{id:id1},'invoice_FR27001');
ok('الفاتورة: الرقم والعميل وكل الحاويات والإجماليات',r.txt.includes('FR27001')&&r.txt.includes('فوسجا')&&['MSKU7310452','MSCU5528190','CMAU4471020'].every(c=>r.txt.includes(c))&&r.txt.includes('13.400')&&r.txt.includes('15,812.00')&&r.txt.includes('3 حاويات'),'');
ok('الإجمالي بالحروف بالدولار',/فقط خمسة عشر ألف.*دولار أمريكي/.test(r.txt),(r.txt.match(/فقط[^\n]*/)||[''])[0]);
ok('يعتمد: شركة الراشد للتجارة واللوجو',r.txt.includes('يعتمد: شركة الراشد للتجارة')&&r.html.includes('img/mark.jpg')&&r.html.includes('img/page.jpg'));
ok('الفاتورة من غير تعديل ولا تكلفة ولا تشغيلات',NOEDIT(r)&&!/تشغيلة|تكلفة|ربح|مصروف/.test(r.txt));ok('طباعة الفاتورة',r.pr===1);
r=await rep('inv',{id:id3},'invoice_FR27003_25_containers');ok('فاتورة 25 حاوية: كلها موجودة والعنوان بيتكرر لو صفحتين',['TEST1000000','TEST1000168'].every(c=>r.txt.includes(c))&&r.txt.includes('25 حاوية')&&r.txt.includes('3.750')&&NOEDIT(r),r.pages+' صفحة');
r=await rep('inv',{id:'s1'});ok('فاتورة فرزة بتطبع كمان',r.txt.includes('فاتورة بيع فرزة')&&NOEDIT(r));
// الزرار من جوه الفورم
await btn({act:'edit',k:'sale',id:id1});await p.click(S+'[data-act="report"][data-k="inv"]');await p.waitForFunction(()=>window.__repReady>0&&!document.querySelector('#rep').hidden);ok('زرار «فاتورة البيع PDF» في الفورم',(await p.textContent('#pages')).includes('FR27001'));
await p.click('#rClose');await p.waitForTimeout(80);ok('قفل الفاتورة بيرجع للفورم',await p.$eval('#sheet',e=>!e.hidden));await close();

// 7) الربحية بتقرا الهيكل الجديد
r=await rep('profitDet',{},'profitability_detailed_containers');ok('الربحية المفصلة فيها الحاويات',r.txt.includes('حاوية MSKU7310452')&&r.txt.includes('3 حاويات')&&/1\.18\/كجم/.test(r.txt));
const pt=await p.evaluate(()=>{let rev=0,c=0,e=0;APP.D.sales.forEach(s=>{const x=APP.C.SL[s.id];rev+=x.rev;c+=x.cogs;e+=x.exp});return{rev,profit:rev-c-e}});
r=await rep('profitSum',{},'profitability_summary_containers');ok('الربحية المجملة = مجموع الفواتير',r.txt.includes(APP_f0(pt.profit))&&r.txt.includes(APP_f0(pt.rev)),JSON.stringify(pt));
function APP_f0(v){return Math.round(v).toLocaleString('en-US')}
r=await rep('run',{id:'r3'});ok('تقرير تكلفة التشغيلة شغال',r.pages>0);r=await rep('stock',{});ok('تقرير المخزون شغال',r.pages>0);

// 8) ميزان البسكول بالصافي: نسخة قديمة فيها قائم وفارغ بتتحول لصافي ونفس الأرقام
const sig=()=>p.evaluate(()=>JSON.stringify([Object.values(APP.C.P).map(x=>[x.net,Math.round(x.amount*100)]),Object.keys(APP.C.L).sort().map(k=>Math.round(APP.C.L[k].reduce((a,e)=>a+e.dr-e.cr,0)*100))]));
await p.evaluate(()=>location.hash='#/backup');await p.waitForTimeout(100);await p.setInputFiles('#restoreFile','/workspace/strawberry_erp/test/scenario100.json');await p.waitForTimeout(200);await p.click('#dlg [data-dlg="ok"]');await p.waitForFunction(()=>APP.D.sales.length===7,null,{timeout:10000});const sNet=await sig();
await p.setInputFiles('#restoreFile','/workspace/strawberry_erp/test/scenario100_legacy.json');await p.waitForTimeout(200);await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(600);
ok('نسخة قديمة (قائم/فارغ) اتحولت لصافي = القائم − الفارغ',await p.evaluate(()=>APP.D.purchases.length===12&&APP.D.purchases.every(x=>x.net>0&&!('gross' in x)&&!('tare' in x))&&APP.get('purchases','p1').net===9000));
ok('ونفس الأرقام بالظبط (قيم الفواتير وكل الأرصدة)',await sig()===sNet);
await btn({act:'edit',k:'purchase',id:'p1'});ok('الفورم فيه «الوزن الصافي (كجم)» بس من غير قائم وفارغ',await p.inputValue(S+'input[data-p="net"]')==='9000'&&!(await p.$(S+'input[data-p="gross"]'))&&!(await p.$(S+'input[data-p="tare"]'))&&(await p.textContent('#sheet')).includes('الوزن الصافي (كجم)')&&!(await p.textContent('#sheet')).includes('القائم'));
ok('رقم العربية وتذكرة الميزان لسه موجودين',!!(await p.$(S+'input[data-p="plate"]'))&&!!(await p.$(S+'input[data-p="ticketNo"]')));
ok('الخصم على الصافي: 9,000 × (1 − 2%) = 8,820',(await p.textContent('#fsum')).includes('8,820.0'),await p.textContent('#fsum'));
if(SAVEPV){await p.$eval(S+'input[data-p="plate"]',e=>{e.scrollIntoView({block:'start'});document.querySelector('#sheet').scrollTop-=110});await p.evaluate(()=>document.querySelector('#toast').classList.remove('on'));await p.waitForTimeout(350);await p.screenshot({path:OUT+'/purchase_net.png'})}
await save();ok('الحفظ من غير تغيير مابيسجلش تعديل',await p.evaluate(()=>!(APP.get('purchases','p1').edits||[]).length));
await btn({act:'edit',k:'purchase',id:'p1'});await fill('net','9100');await save();ok('تعديل الصافي بيتسجل «الصافي 9,000 ← 9,100»',(await p.evaluate(()=>APP.editNotes(APP.get('purchases','p1'),1)[0]||'')).includes('الصافي 9,000 ← 9,100'));
r=await rep('stmt',{id:'R1'},'supplier_statement_R1_net');ok('كشف المورد بيعرض صافي الميزان ومفيش قائم/فارغ',r.txt.includes('صافي الميزان 9,100 كجم')&&!/القائم|الفارغ/.test(r.txt));
r=await rep('run',{id:'r1'},'run_cost_r1_net');ok('تقرير تكلفة التشغيلة من غير قائم/فارغ',!/القائم|الفارغ/.test(r.txt)&&r.pages>0);
const bj=await p.evaluate(async()=>{let got=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{got=b;return o.call(URL,b)};document.querySelector('[data-act="backup"]')?.click();await new Promise(r=>setTimeout(r,500));URL.createObjectURL=o;return got?await got.text():''});
ok('النسخة الاحتياطية فيها net ومفيش gross/tare',bj.includes('"net"')&&!bj.includes('"gross"')&&!bj.includes('"tare"'),bj.length);
ok('مفيش ولا نافذة متصفح',!NATIVE.length,NATIVE.join(' | '));ok('مفيش أخطاء جافاسكريبت',!errs.length,errs.slice(0,4).join(' | '));ok('مفيش طلب للسحابة',await p.evaluate(()=>!SYNC.state.enabled));
await b.close();const f=res.filter(r=>!r.pass).length;console.log(`${WK?'webkit':'chromium'}: ${res.length-f}/${res.length} PASS`);process.exit(f?1:0);
