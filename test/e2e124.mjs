// v1.2.4: مكونات التعبئة (BOM) — صرف المستلزمات وخدمات الحاوية تلقائي من الكراتين (لكل كرتونة/باليت/حاوية، من مخزن المصنع) + «تلقائي» للقراءة بس + تعديل يدوي/رجوع + المخزن تبع المصنع — بروفايل مؤقت، مفيش سحابة، نوافذ داخلية بس
import { chromium, webkit, devices } from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.mjs';
import fs from 'fs';
const WK=process.env.ENGINE==='webkit',BASE=process.env.BASE||(WK?'http://erp.test/':'http://127.0.0.1:8811/');
const OUT='/workspace/strawberry_erp/test/out124'+(WK?'_webkit':'')+(process.env.BASE?'_live':'');fs.mkdirSync(OUT,{recursive:true});const PV='/workspace/strawberry_erp/previews/v124';fs.mkdirSync(PV,{recursive:true});
const SAVEPV=!WK&&!process.env.BASE;
const res=[];const ok=(n,c,i='')=>{res.push({n,pass:!!c,i});console.log((c?'PASS ':'FAIL ')+n+(i?' — '+String(i).slice(0,220):''))};const near=(a,b,t=0.005)=>Math.abs(a-b)<=t;
const b=WK?await webkit.launch():await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await b.newContext(WK?{...devices['iPhone 13'],locale:'ar-EG',timezoneId:'Africa/Cairo'}:{viewport:{width:390,height:844},deviceScaleFactor:1000/390,isMobile:true,hasTouch:true,locale:'ar-EG',timezoneId:'Africa/Cairo'});
const MT={html:'text/html; charset=utf-8',js:'text/javascript',json:'application/json',webmanifest:'application/manifest+json',png:'image/png',jpg:'image/jpeg',css:'text/css'};
if(WK&&!process.env.BASE)await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='erp.test')return r.abort();const f='/workspace/strawberry_erp'+(u.pathname==='/'?'/index.html':u.pathname);if(fs.existsSync(f))return r.fulfill({status:200,contentType:MT[f.split('.').pop()]||'application/octet-stream',body:fs.readFileSync(f)});return r.fulfill({status:404,body:''})});
await ctx.route(/supabase\.co/,r=>r.abort());
const NATIVE=[];const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>{NATIVE.push(d.type()+': '+d.message());d.dismiss()});
await p.addInitScript({path:'/workspace/strawberry_erp/test/dlghook.js'});
await p.goto(BASE);await p.waitForFunction(()=>window.__ready);ok('مش مربوط بالسحابة',await p.evaluate(()=>!SYNC.state.enabled));ok('النسخة 1.2.4',await p.evaluate(()=>APP.VER)==='1.2.4');
await p.evaluate(()=>location.hash='#/backup');await p.setInputFiles('#restoreFile','/workspace/strawberry_erp/test/scenario100.json');await p.waitForFunction(()=>APP.D.runs.length===4);
await p.evaluate(()=>window.__dlgMode='ui');// من هنا كل النوافذ بتتجرب بالضغط الحقيقي
const S='#sheet ';const fill=async(k,v)=>{await p.fill(S+`input[data-p="${k}"]`,String(v))};const selV=async(k,v)=>{await p.selectOption(S+`select[data-p="${k}"]`,String(v));await p.waitForTimeout(30)};
const btn=async(sel)=>{await p.evaluate(sel=>{const b=document.createElement('button');Object.assign(b.dataset,sel);document.body.appendChild(b);b.click();b.remove()},sel);await p.waitForTimeout(80)};
const trySave=async()=>{await p.click(S+'.shb [data-act="fsave"]');await p.waitForTimeout(180);if(await p.$eval('#dlg',e=>!e.hidden).catch(()=>false))return 'DLG';return (await p.$eval('#sheet',e=>!e.hidden))?await p.textContent('#ferr'):''};
const save=async()=>{const e=await trySave();if(e)throw new Error('save failed '+e)};const close=async()=>{if(await p.$eval('#sheet',e=>!e.hidden))await p.click(S+'.shb [data-act="fclose"]');await p.waitForTimeout(40)};
const dlgKind=()=>p.$eval('#dlg:not([hidden]) .dlgb',e=>e.dataset.kind).catch(()=>'');
const SL=id=>p.evaluate(id=>{const x=APP.C.SL[id];return x?{nCont:x.nCont,tons:x.tons,kg:x.kg,amount:x.amount,rev:x.rev,cogs:x.cogs,invNo:x.invNo,cont:x.cont,lines:x.lines.map(l=>({cont:l.cont,bl:l.bl,tons:l.tons,price:l.price,amount:l.amount,runId:l.runId,kg:l.kg}))}:null},id);const newK=async(k,extra={})=>{await btn(Object.assign({act:'new',k},extra));await p.waitForTimeout(60)};
const editK=async(k,id)=>{await btn({act:'edit',k,id});await p.waitForTimeout(60)};
const SUP=()=>p.evaluate(()=>(APP.F.d.supplies||[]).map(l=>({itemId:l.itemId,qty:l.qty,locId:l.locId,auto:!!l.auto,ovr:!!l.ovr})));
const rowTxt=i=>p.textContent(S+`.sups [data-sa="${i}"]`).catch(()=>'');
const autoIdx=async it=>(await SUP()).findIndex(l=>l.auto&&l.itemId===it);
const bal=(it,loc)=>p.evaluate(([it,loc])=>APP.C.SUP[it].loc[loc]||0,[it,loc]);
const jpg=async(name,sel)=>{if(!SAVEPV)return;await p.evaluate(()=>{document.querySelector('#toast').classList.remove('on');document.activeElement&&document.activeElement.blur()});await p.waitForTimeout(350);
  if(sel){await p.$eval(S+sel,e=>{e.scrollIntoView({block:'start'});document.querySelector('#sheet').scrollTop-=60})}await p.waitForTimeout(80);await p.screenshot({path:PV+'/'+name,type:'jpeg',quality:86})};
const untoast2=()=>p.evaluate(()=>{document.querySelector('#toast').classList.remove('on');document.activeElement&&document.activeElement.blur()}).then(()=>p.waitForTimeout(350));
const B0={itm9:await bal('itm9','fac1'),itm1:await bal('itm1','fac1'),itm3:await bal('itm3','fac1'),itm2:await bal('itm2','fac1'),itm6:await bal('itm6','fac1')};

const COST=()=>p.evaluate(()=>(APP.F.d.costs||[]).map(c=>({name:c.name,amount:c.amount,auto:!!c.auto,ovr:!!c.ovr,bk:c.bk||'',partyId:c.partyId||''})));
const bkIdx=async k=>p.evaluate(k=>(APP.F.d.supplies||[]).findIndex(l=>l.auto&&l.bk===k),k);
const cIdx=async k=>p.evaluate(k=>(APP.F.d.costs||[]).findIndex(l=>l.auto&&l.bk===k),k);
const commit=async sel=>{await p.$eval(S+sel,e=>e.dispatchEvent(new Event('change',{bubbles:true})));await p.waitForTimeout(80)};
// 1) مكونات التعبئة في الإعدادات
await p.evaluate(()=>location.hash='#/settings');await p.waitForTimeout(150);
let tx=await p.textContent('#app, main, body');
ok('الإعدادات فيها مكونات التعبئة (BOM) والمصدر «حسب أمير 14/11/2026»',tx.includes('مكونات التعبئة')&&tx.includes('حسب أمير 14/11/2026'));
ok('الخدمات للحاوية: عمولات 20,000 + أوراق 12,000 + إكراميات 1,500 + سيزر 48,000 + لزق 1,704',['20,000.00','12,000.00','1,500.00','48,000.00','1,704.00'].every(v=>tx.includes(v)));
ok('الستيكر: صغير 0.22 × 2400 = 528 وكبير 0.30 × 1500 = 450',tx.includes('528.00')&&tx.includes('450.00'));
if(SAVEPV){await untoast2();await p.$eval('.bom',e=>{e.scrollIntoView({block:'start'});window.scrollBy(0,-110)});await p.waitForTimeout(80);await p.screenshot({path:PV+'/bom_settings.jpg',type:'jpeg',quality:86})}
await p.click('button[data-act="bomEdit"]');await p.waitForSelector('#sheet:not([hidden])');
const strI=await p.evaluate(()=>APP.F.d.bom.lines.findIndex(l=>l.k==='str'));await fill(`bom.lines.${strI}.qty`,3);await save();
ok('تعديل المكونات بيتحفظ في الإعدادات (استرتش 3 للحاوية)',await p.evaluate(()=>APP.S().bom.lines.find(l=>l.k==='str').qty)===3);
await p.click('button[data-act="bomEdit"]');await p.waitForSelector('#sheet:not([hidden])');await fill(`bom.lines.${strI}.qty`,2);await save();
// 2) فاتورة خام جديدة عشان التشغيلة
await newK('purchase');await fill('date','14/11/2026');await selV('supplierId','R1');await selV('factoryId','fac1');await fill('plate','تجريبي 1201');await fill('ticketNo','BSK-901');await fill('net',10000);await fill('price',28);await save();
const pid=await p.evaluate(()=>APP.D.purchases.find(x=>x.ticketNo==='BSK-901').id);
// 3) تشغيلة جديدة
await p.evaluate(()=>location.hash='#/runs');await p.waitForTimeout(120);await newK('run');
ok('تشغيلة جديدة = صرف تلقائي',await p.evaluate(()=>APP.F.d.autoSup===true));
let s=await SUP();let cs=await COST();ok('8 سطور مستلزمات تلقائي + 5 بنود خدمات تلقائي',s.filter(l=>l.auto).length===8&&cs.filter(c=>c.auto).length===5,JSON.stringify([s.length,cs.length]));
ok('السطور التلقائي مكتوب عليها «تلقائي» ومن غير خانات ولا ×',(await rowTxt(0)).includes('تلقائي')&&!await p.$(S+'.sups [data-sa] input, '+S+'.sups [data-sa] select, '+S+'.sups [data-sa] .x, '+S+'.costs [data-ca] input'));
await selV('factoryId','fac2');await selV('inputs.0.purchaseId',pid);await fill('inputs.0.kg',9500);
await p.click(S+'input[data-p="cartons"]');await p.keyboard.type('1200');await p.waitForTimeout(120);
ok('الكتابة في الكراتين ما بتضيعش التركيز',await p.evaluate(()=>document.activeElement&&document.activeElement.dataset.p==='cartons'));
s=await p.evaluate(()=>Object.fromEntries(APP.F.d.supplies.filter(l=>l.auto).map(l=>[l.bk,l.qty])));
ok('1200 كرتونة: كرتون/كيس/ستيكر صغير 1200، باليت 10، زوايا 40، ستيكر كبير 750، داتا لوجر 0.5، استرتش 1',s.ctn===1200&&s.bag===1200&&s.stS===1200&&s.pal===10&&s.cor===40&&s.stL===750&&s.dl===0.5&&s.str===1,JSON.stringify(s));
cs=await p.evaluate(()=>Object.fromEntries(APP.F.d.costs.filter(l=>l.auto).map(l=>[l.bk,l.amount])));
ok('الخدمات: لزق 852، سيزر 24,000، عمولات 10,000، أوراق 6,000، إكراميات 750',cs.tape===852&&cs.pack===24000&&cs.comm===10000&&cs.docs===6000&&cs.tips===750,JSON.stringify(cs));
ok('المخزن = مخزن مصنع التشغيلة (الحسن)',(await SUP()).filter(l=>l.auto).every(l=>l.locId==='fac2'));
const i1=await bkIdx('ctn'),i2=await bkIdx('pal'),i4=await bkIdx('cor');
let t=await rowTxt(i1);ok('السطر بيعرض الكمية للأساس والإجمالي والمتاح',t.includes('لكل كرتونة')&&t.includes('1,200')&&t.includes('المتاح 120')&&t.includes('الحسن'),t);
ok('تحذير نقص: ناقص 1,080',t.includes('ناقص 1,080'),t);
t=await rowTxt(await bkIdx('dl'));ok('الحاوية بالكسور: 1 لكل حاوية (2,400 كرتونة) × 0.5 حاوية = 0.5',t.includes('لكل حاوية (2,400 كرتونة)')&&t.includes('0.5 حاوية'),t);
await selV('factoryId','fac1');t=await rowTxt(i1);
ok('تغيير المصنع بينقل مخزن الصرف التلقائي',(await SUP()).filter(l=>l.auto).every(l=>l.locId==='fac1')&&t.includes('الثلاجة العربية')&&t.includes('المتاح '+B0.itm1.toLocaleString('en')),t);
ok('النقص بيتحسب من مخزن المصنع الجديد (ناقص 210)',t.includes('ناقص '+(1200-B0.itm1)),t);
await fill('cartons',900);s=await SUP();t=await rowTxt(i1);
ok('تغيير الكراتين بيحدث السطور لايف (باليت 7.5)',s[i1].qty===900&&s[i2].qty===7.5&&!t.includes('ناقص')&&(await rowTxt(i2)).includes('ناقص'),t);
ok('وبيحدث الخدمات لايف (عمولات 7,500)',(await p.textContent(S+`.costs [data-ca="${await cIdx('comm')}"]`)).includes('7,500.00'));
await jpg('auto_supplies_shortage.jpg','.sups');
await jpg('auto_costs.jpg','.costs');
// تعديل يدوي للباليت + رجوع تلقائي للزوايا
await p.click(S+`.sups [data-act="supOvr"][data-i="${i2}"]`);await p.waitForTimeout(80);
ok('«تعديل يدوي» بيفتح الكمية للكتابة وبيفضل عليه «تلقائي — متعدل يدوي»',!!await p.$(S+`input[data-p="supplies.${i2}.qty"]`)&&(await p.textContent(S+'.sups')).includes('متعدل يدوي'));
await fill(`supplies.${i2}.qty`,3);await fill('cartons',901);await fill('cartons',900);s=await SUP();
ok('السطر المتعدل يدوي ما بيتغيرش مع الكراتين',+s[i2].qty===3&&s[i2].ovr,JSON.stringify(s[i2]));
await p.click(S+`.sups [data-act="supOvr"][data-i="${i4}"]`);await p.waitForTimeout(60);await fill(`supplies.${i4}.qty`,7);
await jpg('auto_supplies_override.jpg','.sups');
await p.click(S+`.sups [data-act="supAuto"][data-i="${i4}"]`);await p.waitForTimeout(60);s=await SUP();
ok('«رجّعه تلقائي» بيرجع الحساب (900/120 × 4 = 30)',s[i4].qty===30&&!s[i4].ovr&&!await p.$(S+`input[data-p="supplies.${i4}.qty"]`));
// الزوايا مالهاش رصيد: نخليها 0 يدوي؟ لأ — نسيبها ونأكد على النقص وقت الحفظ
// تعديل خدمة يدوي
const ct=await cIdx('docs');await p.click(S+`.costs [data-act="costOvr"][data-i="${ct}"]`);await p.waitForTimeout(60);await fill(`costs.${ct}.amount`,5000);
ok('بند خدمة تلقائي بيتعدل يدوي',+(await COST())[ct].amount===5000&&(await COST())[ct].ovr);
// مستلزم يدوي إضافي
await p.click(S+'[data-ladd="supplies"]');await p.waitForTimeout(60);s=await SUP();const im=s.length-1;
ok('«+ مستلزم» لسه موجود ومخزنه الافتراضي مصنع التشغيلة',!s[im].auto&&s[im].locId==='fac1');
await selV(`supplies.${im}.itemId`,'itm6');await fill(`supplies.${im}.qty`,2);
await selV('factoryId','fac2');s=await SUP();ok('السطر اليدوي اللي على مخزن المصنع بيتنقل مع المصنع',s[im].locId==='fac2'&&s.filter(l=>l.auto).every(l=>l.locId==='fac2'));
await selV(`supplies.${im}.locId`,'fac3');await selV('factoryId','fac1');s=await SUP();ok('السطر اليدوي اللي اتغير مخزنه بإيدك ما بيتغيرش',s[im].locId==='fac3');
await selV(`supplies.${im}.locId`,'fac1');
// منع الحساب مرتين: بند يدوي «التعبئة بالسيزر»
await p.click(S+'[data-ladd="costs"]');await p.waitForTimeout(60);let K=await COST();const km=K.length-1;await fill(`costs.${km}.name`,'التعبئة بالسيزر');await commit(`input[data-p="costs.${km}.name"]`);const km2=(await COST()).findIndex(c=>!c.auto&&c.name==='التعبئة بالسيزر');await fill(`costs.${km2}.amount`,18000);
K=await COST();ok('بند يدوي «التعبئة بالسيزر» بيلغي السطر التلقائي (مفيش حساب مرتين)',!K.some(c=>c.auto&&c.bk==='pack')&&K.some(c=>!c.auto&&c.name==='التعبئة بالسيزر')&&(await p.textContent(S+'.costs')).includes('مش هيتحسب تاني'),JSON.stringify(K));
let er=await trySave();if(er==='DLG'){ok('نقص على الحفظ بيسأل بنافذة داخلية',await dlgKind()==='confirm',await p.textContent('#dlg .dlgm'));await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(200);er=await p.$eval('#sheet',e=>!e.hidden)?await p.textContent('#ferr'):''}
ok('التشغيلة اتحفظت',!er,er);
const rid=await p.evaluate(()=>APP.D.runs.slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''))[0].id);
const R=await p.evaluate(id=>APP.D.runs.find(r=>r.id===id),rid);
ok('اتسجل الصرف: 900 كرتون/كيس/ستيكر، 3 باليت (يدوي)، 30 زاوية، 562.5 ستيكر كبير، 0.375 داتا لوجر، 0.75 استرتش + 2 ورق يدوي',JSON.stringify(R.supplies.map(l=>[l.bk||l.itemId,l.qty,l.locId,!!l.ovr]))===JSON.stringify([['ctn',900,'fac1',false],['bag',900,'fac1',false],['stS',900,'fac1',false],['pal',3,'fac1',true],['cor',30,'fac1',false],['stL',562.5,'fac1',false],['dl',0.375,'fac1',false],['str',0.75,'fac1',false],['itm6',2,'fac1',false]]),JSON.stringify(R.supplies.map(l=>[l.bk||l.itemId,l.qty])));
ok('اتسجلت الخدمات: لزق 639، عمولات 7,500، أوراق 5,000 (يدوي)، إكراميات 562.5 + السيزر اليدوي 18,000',JSON.stringify(R.costs.map(c=>[c.bk||c.name,c.amount]))===JSON.stringify([['tape',639],['comm',7500],['docs',5000],['tips',562.5],['التعبئة بالسيزر',18000]]),JSON.stringify(R.costs.map(c=>[c.bk||c.name,c.amount])));
ok('المصدر محفوظ على التشغيلة',R.bomSrc==='حسب أمير 14/11/2026');
ok('مفيش حقول مؤقتة اتحفظت',!('_fac' in R));
ok('المخزن نقص بالصرف التلقائي',await bal('itm1','fac1')===B0.itm1-900&&await bal('itm3','fac1')===B0.itm3-900&&await bal('itm2','fac1')===B0.itm2-3&&await bal('itm6','fac1')===B0.itm6-2&&Math.abs(await bal('itm9','fac1')-(20-0.375))<1e-9);
ok('الستيكر بيتسعر بسعر المكونات لو مفيش شراء (900 × 0.22 = 198)',await p.evaluate(id=>{const l=APP.C.issue[id].find(l=>l&&l.itemId==='itm10');return l&&Math.abs(l.cost-198)<1e-6},rid));
ok('تكلفة التشغيلة شايلة الخدمات التلقائي',await p.evaluate(id=>Math.abs(APP.C.R[id].costsT-(639+7500+5000+562.5+18000))<0.01,rid));
// تقرير التكلفة
await p.waitForFunction(()=>window.jspdf&&window.html2canvas,null,{timeout:30000}).catch(()=>{});
const repR=await p.evaluate(async id=>{await RPT.open('run',{id});const h=document.querySelector('#pages').innerHTML;const pdf=await RPT.makePdf();RPT.close();const u=new Uint8Array(pdf.output('arraybuffer'));let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return{t:h.replace(/<[^>]+>/g,''),b64:btoa(s)}},rid);
if(SAVEPV)fs.writeFileSync(PV+'/run_cost_report.pdf',Buffer.from(repR.b64,'base64'));
ok('تقرير تكلفة التشغيلة فيه مكونات التعبئة والمصدر وطريقة الكسور',repR.t.includes('مكونات التعبئة المحسوبة تلقائي (حسب أمير 14/11/2026)')&&repR.t.includes('بالتناسب')&&repR.t.includes('0.375 حاوية'));
// 4) تعديل تشغيلة محفوظة
await editK('run',rid);t=await rowTxt(0);ok('في التعديل المتاح = الرصيد + اللي التشغيلة صرفته',t.includes('المتاح '+B0.itm1.toLocaleString('en')),t);
await fill('cartons',940);s=await SUP();ok('تعديل الكراتين بيحدث الصرف التلقائي (والمتعدل يدوي ثابت)',s[0].qty===940&&+s[3].qty===3&&s[3].ovr&&Math.abs(s[4].qty-31.333)<1e-9,JSON.stringify(s.slice(0,5)));
er=await trySave();if(er==='DLG'){await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(200)}ok('الحفظ بعد التعديل: المخزن نقص 940',await bal('itm1','fac1')===B0.itm1-940);
ok('سجل التعديل اتكتب (940)',await p.evaluate(id=>JSON.stringify((APP.D.runs.find(r=>r.id===id).edits||[]).slice(-1)).includes('940'),rid));
// 5) تشغيلة قديمة (يدوي): ما تتغيرش لوحدها
const r1=await p.evaluate(()=>JSON.stringify([APP.D.runs.find(r=>r.id==='r1').supplies,APP.D.runs.find(r=>r.id==='r1').costs]));const cur1=()=>p.evaluate(()=>JSON.stringify([APP.F.d.supplies,APP.F.d.costs]));
await editK('run','r1');ok('التشغيلة القديمة بتفتح يدوي زي ما هي',await p.evaluate(()=>!APP.F.d.autoSup)&&await cur1()===r1&&(await p.textContent(S+'.sups')).includes('مسجلة يدوي'));
await fill('cartons',1751).catch(()=>{});ok('تغيير كراتين القديمة ما بيلمسش سطورها',await cur1()===r1);await close();
ok('القديمة ما اتحفظش فيها حاجة',await p.evaluate(()=>JSON.stringify([APP.D.runs.find(r=>r.id==='r1').supplies,APP.D.runs.find(r=>r.id==='r1').costs]))===r1);
await editK('run','r1');await p.click(S+'[data-act="supAutoOn"]');await p.waitForTimeout(100);ok('«احسبها تلقائي» بيأكد بنافذة داخلية',await dlgKind()==='confirm');
await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(120);s=await SUP();K=await COST();
ok('اتحولت: مستلزمات BOM تلقائي من 1750 كرتونة، واليدوي اللي برا المكونات (الورق/لزق) فاضل',s.filter(l=>l.auto).length===8&&s.find(l=>l.auto&&l.itemId==='itm1').qty===1750&&s.filter(l=>!l.auto).map(l=>l.itemId).join(',')==='itm4,itm6',JSON.stringify(s));
ok('اللزق اليدوي من المخزن بيلغي تكلفة اللزق التلقائي، والسيزر اليدوي بيلغي السيزر التلقائي',!K.some(c=>c.auto&&(c.bk==='tape'||c.bk==='pack'))&&K.some(c=>c.auto&&c.bk==='comm'),JSON.stringify(K));
await close();ok('الإلغاء ما بيحفظش التحويل',await p.evaluate(()=>JSON.stringify([APP.D.runs.find(r=>r.id==='r1').supplies,APP.D.runs.find(r=>r.id==='r1').costs]))===r1);
// إيقاف الصرف التلقائي من الإعدادات
await p.evaluate(()=>location.hash='#/settings');await p.waitForTimeout(120);await p.click('input[data-sflag="bomOn"]');await p.waitForTimeout(200);
await newK('run');ok('لو الصرف التلقائي واقف: التشغيلة الجديدة يدوي',await p.evaluate(()=>!APP.F.d.autoSup&&!(APP.F.d.supplies||[]).length));await close();
await p.evaluate(()=>location.hash='#/settings');await p.waitForTimeout(120);await p.click('input[data-sflag="bomOn"]');await p.waitForTimeout(200);ok('ورجع اشتغل',await p.evaluate(()=>APP.S().bomOn===true));
// 6) رصيد افتتاحي لكل أنواع الحسابات (مبلغ + له/عليه + تاريخ + عملة) — قابل للتعديل
await p.evaluate(()=>location.hash='#/acc');await p.waitForTimeout(120);
const TYPES=await p.evaluate(()=>Object.keys(ERP.PTYPES));let allF=true;
for(const ty of TYPES){await newK('party',{type:ty});const has=await p.evaluate(()=>['open','openDate'].every(k=>document.querySelector('#sheet input[data-p="'+k+'"]'))&&!!document.querySelector('#sheet [data-fset="openSide"]')&&!!document.querySelector('#sheet [data-fset="openCur"]'));if(!has)allF=false;await close()}
ok('الرصيد الافتتاحي (مبلغ/عملة/تاريخ/له-عليه) موجود في كل أنواع الحسابات ('+TYPES.length+')',allF&&TYPES.length>=6,TYPES.join(','));
const BAL=id=>p.evaluate(id=>APP.C.BAL[id].bal,id);const r1b=await BAL('R1');
await editK('party','R1');await fill('open',12500);await p.click(S+'[data-fset="openSide"][data-v="c"]');await fill('openDate','31/13/2026');
er=await trySave();ok('تاريخ رصيد غلط مرفوض',/تاريخ الرصيد الافتتاحي/.test(er),er);await fill('openDate','31/10/2026');
await jpg('opening_supplier_form.jpg','[data-fset="openCur"]');await save();
ok('رصيد المورد: 12,500 له بتاريخ 31/10/2026',near(await BAL('R1'),r1b-12500,0.01)&&await p.evaluate(()=>{const e=APP.C.L.R1[0];return e.kind==='open'&&e.date==='2026-10-31'&&e.cr===12500}));
await p.evaluate(()=>location.hash='#/party/R1');await p.waitForTimeout(150);
tx=await p.textContent('.t.st');ok('أول سطر في الكشف = الرصيد الافتتاحي',await p.$eval('.t.st tr:nth-child(2)',e=>e.textContent.includes('رصيد افتتاحي')&&e.textContent.includes('12,500.00')));
await p.fill('[data-flt="R1.from"]','01/11/2026');await p.waitForTimeout(200);
ok('فترة تبدأ بعد تاريخ الرصيد: بيتنقل لرصيد أول الفترة',!(await p.textContent('.t.st')).includes('رصيد افتتاحي')&&(await p.textContent('.t.st')).includes('رصيد منقول')&&await p.evaluate(()=>{const s=APP.statement('R1','2026-11-01','');return Math.abs(s.open+12500)<0.01}));
await p.fill('[data-flt="R1.from"]','01/10/2026');await p.waitForTimeout(200);ok('فترة قبل تاريخ الرصيد: بيظهر كسطر في الفترة',(await p.textContent('.t.st')).includes('رصيد افتتاحي'));
await p.fill('[data-flt="R1.from"]','');await p.fill('[data-flt="R1.to"]','30/10/2026');await p.waitForTimeout(200);ok('فترة بتخلص قبل تاريخ الرصيد: مش ظاهر',await p.evaluate(()=>APP.statement('R1','','2026-10-30').rows.every(e=>e.kind!=='open')));
await p.click('[data-act="fltclear"][data-id="R1"]');await p.waitForTimeout(150);
// تعديل الرصيد ← ملاحظة خفيفة في كشف المورد
await editK('party','R1');await fill('open',13000);await save();
ok('تعديل الرصيد الافتتاحي بيتسجل',await p.evaluate(()=>JSON.stringify(APP.D.parties.find(p=>p.id==='R1').edits||[]).includes('12,500 ← 13,000')));
await p.evaluate(()=>location.hash='#/party/R1');await p.waitForTimeout(150);
ok('ملاحظة خفيفة تحت الرصيد الافتتاحي في كشف المورد',await p.$eval('.t.st tr:nth-child(2)',e=>!!e.querySelector('.enote')&&e.textContent.includes('13,000')));
if(SAVEPV){await untoast2();await p.screenshot({path:PV+'/opening_supplier_statement_app.jpg',type:'jpeg',quality:86})}
await p.waitForFunction(()=>window.jspdf&&window.html2canvas,null,{timeout:30000}).catch(()=>{});
const rep=async(k,o,nm)=>{const r=await p.evaluate(async([k,o])=>{await RPT.open(k,o);const html=document.querySelector('#pages').innerHTML;const pdf=await RPT.makePdf();RPT.close();const u=new Uint8Array(pdf.output('arraybuffer'));let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return{html,b64:btoa(s)}},[k,o]);r.txt=r.html.replace(/<[^>]+>/g,'');
  if(nm&&SAVEPV)fs.writeFileSync(PV+'/'+nm+'.pdf',Buffer.from(r.b64,'base64'));return r};
let R5=await rep('stmt',{id:'R1'},'opening_supplier_statement');
ok('كشف المورد PDF: أول سطر رصيد أول المدة بتاريخه + ملاحظة خفيفة',/رصيد أول المدة في 31\/10\/2026/.test(R5.txt)&&R5.html.includes('enote')&&R5.html.includes('13,000.00'));
R5=await rep('stmt',{id:'R1',from:'2026-11-01'});ok('كشف المورد PDF لفترة بعد الرصيد: متجمع في الرصيد المنقول',R5.txt.includes('رصيد منقول قبل 01/11/2026')&&!/رصيد أول المدة في/.test(R5.txt));
// عميل بالدولار
const cb=await BAL('cus-fussga'),co=await p.evaluate(()=>+APP.D.parties.find(p=>p.id==='cus-fussga').open||0);
await editK('party','cus-fussga');await p.click(S+'[data-fset="openCur"][data-v="USD"]');await fill('open',1000);await p.fill(S+'input[data-p="openRate"]','');
er=await trySave();ok('رصيد بالدولار من غير سعر مرفوض',/سعر الدولار/.test(er),er);
await fill('openRate',50.8);await fill('openDate','30/10/2026');await p.click(S+'[data-fset="openSide"][data-v="d"]');
ok('معاينة لايف: $1,000.00 × 50.80 = 50,800.00 ج',(await p.textContent('#fsum')).includes('50,800.00'));
await jpg('opening_customer_form.jpg','[data-fset="openCur"]');await save();
ok('رصيد العميل بالدولار × السعر عليه',near(await BAL('cus-fussga'),cb-co+50800,0.01));
await editK('party','cus-fussga');await fill('openRate',51);await save();
R5=await rep('stmt',{id:'cus-fussga'},'opening_customer_statement');
ok('كشف العميل: الرصيد الافتتاحي أول سطر بالدولار والسعر',/رصيد أول المدة في 30\/10\/2026 — \$1,000\.00 × 51\.00/.test(R5.txt));
ok('كشف العميل مفيهوش أي علامة تعديل',!R5.html.includes('enote')&&!R5.html.includes('معدل'));
await p.evaluate(()=>location.hash='#/party/cus-fussga');await p.waitForTimeout(150);ok('كشف العميل في البرنامج من غير علامة تعديل',!(await p.$('.t.st .enote')));
if(SAVEPV){await untoast2();await p.screenshot({path:PV+'/opening_customer_statement_app.jpg',type:'jpeg',quality:86})}
await p.click('.t.st tr[data-kind="open"]');await p.waitForTimeout(120);ok('الضغط على سطر الرصيد بيفتح الحساب للتعديل',await p.evaluate(()=>APP.F&&APP.F.coll==='parties'&&APP.F.d.id==='cus-fussga'));await close();
// 7) المخزون الافتتاحي للمستلزمات
await p.evaluate(()=>{location.hash='#/stock'});await p.waitForTimeout(100);await p.click('[data-act="ui"][data-k="stockTab"][data-v="sup"]');await p.waitForTimeout(120);
ok('شاشة المخزون فيها «المخزون الافتتاحي»',(await p.textContent('#app, main, body')).includes('المخزون الافتتاحي'));
await p.selectOption('select[data-act-sel="osItem"]','itm8');await p.waitForSelector('#sheet:not([hidden])');await p.waitForTimeout(120);
ok('اختيار الصنف بيفتح فورمه وسطر رصيد افتتاحي جاهز',await p.evaluate(()=>APP.F.coll==='items'&&APP.F.d.id==='itm8'&&APP.F.d.openStock.length===1));
await selV('openStock.0.locId','fac1');await fill('openStock.0.qty',100);await fill('openStock.0.cost',2);
await p.click(S+'[data-ladd="openStock"]');await p.waitForTimeout(50);await selV('openStock.1.locId','fac2');await fill('openStock.1.qty',50);await fill('openStock.1.cost',5);await fill('openStock.1.date','99/99/2026');
er=await trySave();ok('تاريخ مخزون افتتاحي غلط مرفوض',/التاريخ غلط/.test(er),er);await fill('openStock.1.date','01/11/2026');
await jpg('opening_stock_form.jpg','.lines');await save();
ok('المخزون الافتتاحي بيدخل الرصيد لكل مخزن',await bal('itm8','fac1')===100&&await bal('itm8','fac2')===50);
ok('وبيدخل متوسط التكلفة ((100×2+50×5)/150 = 3)',await p.evaluate(()=>Math.abs(APP.C.SUP.itm8.avg-3)<1e-9));
await editK('item','itm8');await fill('openStock.0.cost',2.5);await save();
ok('تعديل المخزون الافتتاحي بيتسجل',await p.evaluate(()=>JSON.stringify(APP.D.items.find(i=>i.id==='itm8').edits||[]).includes('رصيد افتتاحي 1 تكلفة الوحدة 2 ← 2.5')));
await p.evaluate(()=>{location.hash='#/more';});await p.waitForTimeout(60);await p.evaluate(()=>{location.hash='#/stock'});await p.waitForTimeout(150);
const st=await p.textContent('body');ok('جدول المخزون الافتتاحي: الكمية والتكلفة والقيمة والتاريخ + ملاحظة التعديل',st.includes('ستيكر فحص')&&st.includes('500.00')&&st.includes('01/11/2026')&&st.includes('أول المدة')&&!!await p.$('.os ~ .enote, .card .enote'));
// صرف من المخزون الافتتاحي في تشغيلة بتكلفته
await editK('run','r2');await p.click(S+'[data-ladd="supplies"]');await p.waitForTimeout(50);const k7=(await SUP()).length-1;await selV(`supplies.${k7}.itemId`,'itm8');await fill(`supplies.${k7}.qty`,40);await selV(`supplies.${k7}.locId`,'fac1');
er=await trySave();if(er==='DLG'){await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(150)}
ok('الصرف من المخزون الافتتاحي بالمتوسط (40 × 2.8333)',await p.evaluate(()=>{const l=(APP.C.issue.r2||[]).find(l=>l&&l.itemId==='itm8');return l&&Math.abs(l.avg-(100*2.5+50*5)/150)<1e-9&&!l.short})&&await bal('itm8','fac1')===60);
if(SAVEPV){await p.evaluate(()=>{location.hash='#/stock'});await p.waitForTimeout(200);await untoast2();const c=await p.$$('section.card');await c[c.length-1].scrollIntoViewIfNeeded();await p.evaluate(()=>window.scrollBy(0,-120));await p.waitForTimeout(100);await p.screenshot({path:PV+'/opening_stock_screen.jpg',type:'jpeg',quality:86})}
// 8) أمان
ok('مفيش نوافذ متصفح (alert/confirm/prompt)',NATIVE.length===0,NATIVE.join(' | '));
ok('مفيش أخطاء جافاسكريبت',errs.length===0,errs.join(' | '));
ok('لسه مش مربوط بالسحابة',await p.evaluate(()=>!SYNC.state.enabled));
const pass=res.filter(r=>r.pass).length;console.log(`\n${pass}/${res.length} passed`);fs.writeFileSync(OUT+'/results.json',JSON.stringify(res,null,1));
await b.close();process.exit(pass===res.length?0:1);
