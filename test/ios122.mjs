// v1.2.2: «+ جديد» في كل قائمة + كل التأكيدات جوه البرنامج (من غير prompt/confirm/alert) — محاكاة آيفون، بروفايل مؤقت ومفيش سحابة
import { chromium, webkit, devices } from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.mjs';
import fs from 'fs';
const WK=(process.env.ENGINE||'webkit')==='webkit',BASE=process.env.BASE||(WK?'http://erp.test/':'http://127.0.0.1:8811/');
const OUT='/workspace/strawberry_erp/test/out122'+(WK?'_webkit':'')+(process.env.BASE?'_live':'');fs.mkdirSync(OUT,{recursive:true});
const res=[];const ok=(n,c,i='')=>{res.push({n,pass:!!c,i});console.log((c?'PASS ':'FAIL ')+n+(i?' — '+String(i).slice(0,200):''))};
const b=WK?await webkit.launch():await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await b.newContext(WK?{...devices['iPhone 13'],locale:'ar-EG',timezoneId:'Africa/Cairo'}:{viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'ar-EG',timezoneId:'Africa/Cairo'});
const MT={html:'text/html; charset=utf-8',js:'text/javascript',json:'application/json',webmanifest:'application/manifest+json',png:'image/png',jpg:'image/jpeg',css:'text/css'};
if(WK&&!process.env.BASE)await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='erp.test')return r.abort();const f='/workspace/strawberry_erp'+(u.pathname==='/'?'/index.html':u.pathname);if(fs.existsSync(f))return r.fulfill({status:200,contentType:MT[f.split('.').pop()]||'application/octet-stream',body:fs.readFileSync(f)});return r.fulfill({status:404,body:''})});
await ctx.route(/supabase\.co/,r=>r.abort());
// أي نافذة متصفح (prompt/confirm/alert) = فشل؛ آيفون ممكن يمنعها. بنرفضها عشان نتأكد إن البرنامج مش معتمد عليها.
const NATIVE=[];const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>{NATIVE.push(d.type()+': '+d.message());d.dismiss()});
await p.addInitScript(()=>{window.__nativeCalls=[];['prompt','confirm','alert'].forEach(k=>{const o=window[k];window[k]=function(){window.__nativeCalls.push(k);return o.apply(window,arguments)}})});
await p.goto(BASE);await p.waitForFunction(()=>window.__ready);ok('مش مربوط بالسحابة',await p.evaluate(()=>!SYNC.state.enabled));
ok('النسخة 1.2.2',await p.evaluate(()=>APP.VER||document.body.innerText.includes('1.2.2')),await p.evaluate(()=>APP.VER));
const S='#sheet ';
const open=async(k,kind)=>{await p.evaluate(([k,kind])=>{const b=document.createElement('button');b.dataset.act='new';b.dataset.k=k;if(kind)b.dataset.kind=kind;document.body.appendChild(b);b.click();b.remove()},[k,kind]);await p.waitForSelector('#sheet:not([hidden])');await p.waitForTimeout(60)};
const close=async()=>{if(await p.$eval('#sheet',e=>!e.hidden))await p.click(S+'.shb [data-act="fclose"]');await p.waitForTimeout(40)};
const dlgOn=()=>p.$eval('#dlg',e=>!e.hidden).catch(()=>false);
const COLL={raw:'parties',transport:'parties',supply:'parties',export:'parties',farz:'parties',service:'parties',factory:'factories',variety:'varieties',item:'items'};
let seq=0,shot=0;
async function newVia(path,{cancel=false,name}={}){
  const sel=S+`select[data-p="${path}"]`;const type=await p.$eval(sel,e=>e.dataset.new);const before=await p.$eval(sel,e=>e.value);
  // البيانات المكتوبة قبل كده لازم تفضل
  const mark='ملاحظة '+(++seq);const hasNotes=!!(await p.$(S+'input[data-p="notes"]'));if(hasNotes){await p.fill(S+'input[data-p="notes"]',mark)}
  await p.selectOption(sel,'__new');await p.waitForTimeout(120);
  const shown=await dlgOn();const title=shown?await p.textContent('#dlg h3'):'';
  if(!shown)return {type,shown,ok:false};
  if(shot<1){await p.screenshot({path:OUT+'/quick_new_dialog.png'});shot++}
  if(cancel){await p.click('#dlg [data-dlg="no"]');await p.waitForTimeout(80);return {type,shown,title,after:await p.$eval(sel,e=>e.value),before,closed:!(await dlgOn())}}
  // من غير اسم: رسالة جوه النافذة ومفيش حفظ
  await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(60);const emptyErr=await p.textContent('#dlg .dlgerr').catch(()=>'');
  const nm=name||('تجريبي '+type+' '+seq);await p.fill('#dlg input[data-dk="name"]',nm);await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(150);
  const id=await p.evaluate(([c,nm,t])=>{const x=APP.D[c].find(r=>r.name===nm&&(c!=='parties'||r.type===t));return x?x.id:''},[COLL[type],nm,type]);
  const val=await p.$eval(sel,e=>e.value).catch(()=>'');const fd=await p.evaluate(pp=>{let o=APP.F?APP.F.d:null;return o?pp.split('.').reduce((a,k)=>a==null?a:a[k],o):null},path).catch(()=>null);
  const notes=hasNotes?await p.inputValue(S+'input[data-p="notes"]'):mark;
  let follow='';if(await dlgOn()){follow=await p.textContent('#dlg .dlgm').catch(()=>'');if(/التكلفة المقدرة/.test(follow)){await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(100)}}
  return {type,shown,title,emptyErr,id,val,fd,follow,notesKept:notes===mark,closed:!(await dlgOn()),sheetOpen:await p.$eval('#sheet',e=>!e.hidden)}}
const FORMS=[['purchase'],['transport'],['supplyIn'],['transfer'],['run'],['sale','export'],['sale','farz']];
let total=0;
for(const [k,kind] of FORMS){await open(k,kind);
  // ضيف سطر في كل قائمة سطور عشان نجرب القوائم اللي جوه السطور كمان
  for(const a of await p.$$eval(S+'[data-ladd]',L=>L.filter(x=>x.offsetParent&&!x.dataset.ladd.startsWith('est.')).map(x=>x.dataset.ladd)))await p.click(S+`[data-ladd="${a}"]`),await p.waitForTimeout(40);
  const paths=await p.$$eval(S+'select[data-new]',L=>L.map(e=>e.dataset.p));
  for(const path of paths){const r=await newVia(path);total++;
    ok(`${k}${kind?'/'+kind:''} — «+ جديد» في ${path} (${r.type}) بيفتح نافذة ويضيف ويختار`,r.shown&&r.id&&r.val===r.id&&r.fd===r.id&&r.closed&&r.sheetOpen&&r.notesKept&&/اكتب الاسم/.test(r.emptyErr||''),JSON.stringify(r))}
  await close()}
ok('جربنا كل قوائم «+ جديد» (حساب/مصنع/صنف/مستلزم)',total>=14,total);
// إلغاء: القائمة بترجع زي ما كانت ومفيش حاجة اتضافت
await open('purchase');const cnt=await p.evaluate(()=>APP.D.parties.length);const r0=await newVia('supplierId',{cancel:true});
ok('إلغاء النافذة بيرجّع القائمة ومايضيفش',r0.shown&&r0.closed&&r0.after===r0.before&&r0.after!=='__new'&&await p.evaluate(()=>APP.D.parties.length)===cnt,JSON.stringify(r0));
// اسم موجود: بيختار الموجود من غير تكرار
const ex=await p.evaluate(()=>APP.D.parties.find(x=>x.type==='raw').name);const r1=await newVia('supplierId',{name:ex});
ok('اسم موجود بيتختار من غير ما يتكرر',r1.val&&await p.evaluate(nm=>APP.D.parties.filter(x=>x.type==='raw'&&x.name===nm).length,ex)===1,JSON.stringify(r1));
// فاتورة كاملة بمورد جديد بعد ما البيانات اتكتبت
await p.fill(S+'input[data-p="gross"]','5200');await p.fill(S+'input[data-p="tare"]','200');await p.fill(S+'input[data-p="price"]','28');
const r2=await newVia('supplierId',{name:'تجريبي مورد من الآيفون'});
ok('الأرقام المكتوبة فضلت بعد إضافة مورد جديد',await p.inputValue(S+'input[data-p="gross"]')==='5200'&&await p.inputValue(S+'input[data-p="price"]')==='28',JSON.stringify(r2));
await p.click(S+'.shb [data-act="fsave"]');await p.waitForTimeout(200);
const pu=await p.evaluate(id=>APP.D.purchases.find(x=>x.supplierId===id),r2.id);ok('الفاتورة اتحفظت على المورد الجديد',!!pu&&!(await p.$eval('#sheet',e=>!e.hidden)),await p.textContent('#ferr').catch(()=>''));
// حذف: نافذة تأكيد داخلية — لأ مايمسحش، أيوه يمسح
await p.evaluate(id=>{const b=document.createElement('button');b.dataset.act='edit';b.dataset.k='purchase';b.dataset.id=id;document.body.appendChild(b);b.click();b.remove()},pu.id);await p.waitForTimeout(80);
await p.click(S+'[data-act="fdel"]');await p.waitForTimeout(80);const dk=await p.$eval('#dlg .dlgb',e=>e.dataset.kind).catch(()=>'');await p.screenshot({path:OUT+'/confirm_dialog.png'});
await p.click('#dlg [data-dlg="no"]');await p.waitForTimeout(80);ok('تأكيد الحذف جوه البرنامج — «لأ» مايمسحش',dk==='confirm'&&await p.evaluate(id=>!!APP.get('purchases',id),pu.id));
await p.click(S+'[data-act="fdel"]');await p.waitForTimeout(80);await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(150);ok('«أيوه» بيمسح (للأرشيف)',await p.evaluate(id=>!APP.get('purchases',id),pu.id));
// حساب عليه حركات مينفعش يتمسح: رسالة داخلية
await p.evaluate(()=>location.hash='#/archive');await p.waitForTimeout(150);
const ua=await p.$('[data-act="unarc"]');if(ua){await ua.click();await p.waitForTimeout(80);const k2=await p.$eval('#dlg .dlgb',e=>e.dataset.kind).catch(()=>'');await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(150);ok('الترجيع من الأرشيف بنافذة داخلية',k2==='confirm'&&await p.evaluate(id=>!!APP.get('purchases',id),pu.id))}else ok('زرار الترجيع موجود',false);
// استرجاع نسخة: تأكيد داخلي
await p.evaluate(()=>location.hash='#/backup');await p.waitForTimeout(150);await p.setInputFiles('#restoreFile','/workspace/strawberry_erp/test/scenario100.json');await p.waitForTimeout(200);
const rk=await p.$eval('#dlg .dlgb',e=>e.dataset.kind).catch(()=>'');await p.click('#dlg [data-dlg="ok"]');await p.waitForFunction(()=>APP.D.runs.length===4,null,{timeout:10000}).catch(()=>{});
ok('استرجاع النسخة بتأكيد داخلي',rk==='confirm'&&await p.evaluate(()=>APP.D.runs.length===4));
// سعر الفرزة المؤقت: نافذة إدخال داخلية + رقم غلط بيطلع رسالة
await p.evaluate(()=>location.hash='#/run/r3');await p.waitForTimeout(200);await p.click('[data-act="farzTemp"][data-id="r3"]');await p.waitForTimeout(80);
const pk=await p.$eval('#dlg .dlgb',e=>e.dataset.kind).catch(()=>'');await p.fill('#dlg input[data-dk="v"]','abc');await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(60);const pe=await p.textContent('#dlg .dlgerr').catch(()=>'');
await p.fill('#dlg input[data-dk="v"]','14');await p.click('#dlg [data-dlg="ok"]');await p.waitForTimeout(200);
ok('سعر الفرزة المؤقت بنافذة داخلية',pk==='prompt'&&/مش مظبوط/.test(pe)&&await p.evaluate(()=>APP.get('runs','r3').farzTemp)===14,pe);
// صرف أكتر من الرصيد: التحذير داخلي
// تشغيلة: تغيير الصنف بيسأل جوه البرنامج
await p.evaluate(()=>{const b=document.createElement('button');b.dataset.act='edit';b.dataset.k='run';b.dataset.id='r4';document.body.appendChild(b);b.click();b.remove()});await p.waitForTimeout(80);
const vs=await p.$$eval(S+'select[data-p="varietyId"] option',L=>L.map(o=>o.value).filter(v=>v&&v!=='__new'));const cur=await p.$eval(S+'select[data-p="varietyId"]',e=>e.value);const other=vs.find(v=>v!==cur);
if(other){await p.selectOption(S+'select[data-p="varietyId"]',other);await p.waitForTimeout(100);ok('تغيير صنف التشغيلة بيسأل بنافذة داخلية',await p.$eval('#dlg .dlgb',e=>e.dataset.kind).catch(()=>'')==='confirm');await p.click('#dlg [data-dlg="no"]');await p.waitForTimeout(60)}
await close();
// زرار التقرير من غير بيانات
ok('مفيش ولا نافذة متصفح اتفتحت',!NATIVE.length&&!(await p.evaluate(()=>window.__nativeCalls.length)),NATIVE.join(' | ')+' '+await p.evaluate(()=>window.__nativeCalls.join(',')));
ok('مفيش أخطاء جافاسكريبت',!errs.length,errs.slice(0,4).join(' | '));
ok('مفيش طلب للسحابة',await p.evaluate(()=>!SYNC.state.enabled));
await b.close();const f=res.filter(r=>!r.pass).length;console.log(`${WK?'webkit':'chromium'}: ${res.length-f}/${res.length} PASS`);process.exit(f?1:0);
