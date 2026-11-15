// v1.2.9: مفيش أي تحديث أو ترحيل أو سحب يمسح أو يغيّر بيانات المستخدم — مسودات تلقائية، نسخ تلقائية قبل التحديث، تنبيه «على الموبايل ده بس»، رفع فوري، واسترجاع من كل تخزين الجهاز
import pw from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.js';
import http from 'http';import fs from 'fs';
const BR=process.env.BR||'chromium',WK=BR==='webkit';const NEW='/workspace/strawberry_erp',OLD=process.env.OLD||'/tmp/rp128';let ROOT=OLD;
const MT={html:'text/html; charset=utf-8',js:'text/javascript',json:'application/json',webmanifest:'application/manifest+json',png:'image/png',jpg:'image/jpeg',css:'text/css'};
const serve=(u,res)=>{const f=ROOT+(u.pathname==='/'?'/index.html':u.pathname);let body=fs.existsSync(f)&&fs.statSync(f).isFile()?fs.readFileSync(f):null;if(body&&u.pathname==='/sw.js'&&global.SWBUMP)body=Buffer.concat([body,Buffer.from('\n//'+global.SWBUMP)]);return body?{status:200,body,ct:MT[f.split('.').pop()]||'application/octet-stream'}:{status:404,body:''}};
const srv=http.createServer((q,r)=>{const x=serve(new URL(q.url,'http://x'));r.writeHead(x.status,{'content-type':x.ct||'text/plain','cache-control':'no-cache'});r.end(x.body)});await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const BASE=WK?'http://erp.test/':'http://127.0.0.1:'+srv.address().port+'/';
const res=[];const ok=(n,c,i='')=>{res.push({n,pass:!!c});console.log((c?'PASS ':'FAIL ')+n+(i?' — '+String(i).slice(0,300):''))};
const b=WK?await pw.webkit.launch():await pw.chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const RPC=[];let PULL=[];
async function mkctx(){const ctx=await b.newContext({viewport:{width:390,height:844},locale:'ar-EG',timezoneId:'Africa/Cairo'});
  await ctx.route('**/*',r=>{const u=new URL(r.request().url());
    if(u.hostname.endsWith('supabase.co')){const fn=u.pathname.split('/').pop();let body={};try{body=JSON.parse(r.request().postData()||'{}')}catch(e){}RPC.push({fn,at:Date.now(),n:(body.p_rows||[]).length});
      const out=fn==='serp_check'?{ok:true,name:'تجريبي (محاكاة)',last_backup:null}:fn==='serp_pull'?{rows:body.p_since?[]:PULL}:fn==='serp_history'?{rows:[]}:{ok:true};
      return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(out)})}
    if(WK){if(u.hostname!=='erp.test')return r.abort();const x=serve(u);return r.fulfill({status:x.status,body:x.body,contentType:x.ct})}
    return r.continue()});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));await p.addInitScript({path:NEW+'/test/dlghook.js'});return{ctx,p}}
const errs=[];const ready=p=>p.waitForFunction(()=>window.__ready,null,{timeout:20000});
const cnt=p=>p.evaluate(()=>Object.fromEntries(Object.entries(APP.D).map(([c,L])=>[c,L.length])));
// ===== 1) بيانات على 1.2.8 (جهاز مش مربوط) → تحديث لـ 1.2.9 =====
let {ctx,p}=await mkctx();await p.goto(BASE);await ready(p);
await p.evaluate(async()=>{location.hash='#/backup'});await p.setInputFiles('#restoreFile',NEW+'/test/scenario100.json');await p.waitForFunction(()=>APP.D.runs.length>=4,null,{timeout:20000});await p.waitForTimeout(500);
await p.evaluate(async()=>{const f=JSON.parse(JSON.stringify(APP.D.factories[0]));f.name=f.name+' (معدل)';await APP.upsert('factories',f,true)});
const before=await cnt(p);const fac0=await p.evaluate(()=>JSON.stringify(APP.D.factories[0]));
ROOT=NEW;global.SWBUMP='a';await p.reload();await ready(p);await p.waitForTimeout(WK?500:3500);await p.reload();await ready(p);await p.waitForTimeout(800);
ok('اتحدث لـ 1.2.9+',await p.evaluate(()=>APP.VER)>='1.2.9');
ok('كل البيانات موجودة بعد التحديث',JSON.stringify(await cnt(p))===JSON.stringify(before),JSON.stringify(before)+' → '+JSON.stringify(await cnt(p)));
const sn=await p.evaluate(async()=>(await Store.snaps()).map(x=>({r:x.reason,n:x.n})));
ok('نسخة تلقائية على الجهاز اتعملت قبل الترحيل',sn.some(x=>/1\.(2\.9|3\.\d)/.test(x.r)&&x.n>50),JSON.stringify(sn));
ok('طلب التخزين الدايم من المتصفح',await p.evaluate(()=>Store.persisted!==undefined));
ok('تنبيه «محفوظة على الموبايل ده بس» ظاهر (مش مربوط)',await p.evaluate(()=>/على الموبايل ده بس/.test(document.querySelector('#bnr').innerText)));
// ===== 2) البذور ما بتغطيش تسجيل موجود لو الإعدادات ناقصة =====
await p.evaluate(()=>new Promise(r=>{const q=indexedDB.open('alrashed-erp');q.onsuccess=()=>{const t=q.result.transaction('rec','readwrite');t.objectStore('rec').delete('settings:main');t.oncomplete=()=>{q.result.close();r()}}}));
await p.reload();await ready(p);
ok('الإعدادات رجعت والمصنع المعدل ما اتغطاش',await p.evaluate(()=>APP.D.settings.length===1)&&await p.evaluate(()=>JSON.stringify(APP.D.factories[0]))===fac0);
// ===== 3) الكود أقدم من القاعدة (VersionError) — مش بيشتغل فاضي =====
await p.evaluate(()=>new Promise(r=>{Store&&0;const q=indexedDB.open('alrashed-erp');q.onsuccess=()=>{const v=q.result.version;q.result.close();const q2=indexedDB.open('alrashed-erp',v+2);q2.onsuccess=()=>{q2.result.close();r()};q2.onupgradeneeded=()=>{}}}))
.catch(()=>{});
await p.waitForTimeout(2500);await ready(p);await p.waitForTimeout(300);ok('القاعدة اترفعت لنسخة أحدث فعلًا',await p.evaluate(()=>new Promise(r=>{const q=indexedDB.open('alrashed-erp');q.onsuccess=()=>{const v=q.result.version;q.result.close();r(v)}}))>3);
ok('قاعدة بنسخة أحدث: البرنامج فتحها بالبيانات (مش تخزين مؤقت فاضي)',await p.evaluate(()=>Store.ok)&&JSON.stringify(await cnt(p))===JSON.stringify(before),JSON.stringify(await cnt(p)));
// ===== 4) مسودة تلقائية: الكتابة من غير حفظ بترجع بعد reload =====
await p.evaluate(()=>{location.hash='#/home'});await p.waitForTimeout(200);await p.click('[data-act="new"][data-k="purchase"]');await p.waitForSelector('#sheet [data-p="net"]');
await p.fill('#sheet [data-p="plate"]','ط ف ر 123');await p.fill('#sheet [data-p="net"]','4321');await p.waitForTimeout(500);
await p.reload();await ready(p);await p.waitForTimeout(300);
ok('النموذج رجع لوحده بنفس اللي اتكتب بعد reload',await p.evaluate(()=>!!APP.F&&APP.F.d.plate==='ط ف ر 123'&&String(APP.F.d.net)==='4321'),await p.evaluate(()=>APP.F&&JSON.stringify({p:APP.F.d.plate,n:APP.F.d.net})));
await p.fill('#sheet [data-p="price"]','12');const sup=await p.evaluate(()=>APP.D.parties.find(x=>x.type==='raw').id);await p.selectOption('#sheet select[data-p="supplierId"]',sup);await p.waitForTimeout(200);
await p.click('#sheet .shb [data-act="fsave"]');await p.waitForTimeout(600);
ok('الحفظ اشتغل والمسودة اتشالت',await p.evaluate(async()=>!APP.F&&APP.D.purchases.some(x=>x.plate==='ط ف ر 123')&&!(await Store.meta('draft'))));
await p.reload();await ready(p);ok('بعد الحفظ مفيش نموذج بيفتح لوحده',await p.evaluate(()=>!APP.F));
// ===== 5) تحديث البرنامج والنموذج مفتوح: ما بيعملش reload يضيّع الكتابة =====
if(!WK){await p.click('[data-act="new"][data-k="payment"]');await p.waitForSelector('#sheet');await p.evaluate(()=>{window.__mark=7});await p.fill('#sheet [data-p="amount"]','999');await p.waitForTimeout(400);
  global.SWBUMP='b';await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update()});await p.waitForTimeout(3500);
  ok('التحديث نزل والنموذج مفتوح: مفيش reload والكتابة موجودة',await p.evaluate(()=>window.__mark===7&&!!APP.F&&String(APP.F.d.amount)==='999'&&window.__needReload===1));
  await p.click('#sheet .shb [data-act="fclose"]');await p.waitForTimeout(1500);await ready(p);
  ok('بعد قفل النموذج البرنامج عمل reload للنسخة الجديدة',await p.evaluate(()=>window.__mark===undefined));}
// ===== 6) استرجاع: قاعدة قديمة تانية على الجهاز فيها تسجيلات مش موجودة =====
const exist=await p.evaluate(()=>JSON.stringify(APP.D.parties[0]));
await p.evaluate(()=>new Promise(r=>{const q=indexedDB.open('erp-old-copy',1);q.onupgradeneeded=()=>q.result.createObjectStore('rec',{keyPath:'k'});q.onsuccess=()=>{const t=q.result.transaction('rec','readwrite');const s=t.objectStore('rec');
  ['محمد سعيد (اختبار)','مورد قديم 2'].forEach((n,i)=>s.put({k:'parties:old'+i,c:'parties',v:{id:'old'+i,name:n,type:'raw',updatedAt:'2026-11-10T10:00:00.000Z'}}));
  const p0=JSON.parse(JSON.stringify(APP.D.parties[0]));p0.name='اسم قديم';p0.updatedAt='2020-01-01T00:00:00.000Z';s.put({k:'parties:'+p0.id,c:'parties',v:p0});t.oncomplete=()=>{q.result.close();r()}}}));
await p.evaluate(()=>{location.hash='#/recover'});await p.waitForFunction(()=>/تسجيلات مش موجودة دلوقتي/.test(document.body.innerText),null,{timeout:10000});
const hasIdbList=await p.evaluate(()=>!!indexedDB.databases);
if(hasIdbList){ok('شاشة الاسترجاع لقت التسجيلين الناقصين',await p.evaluate(()=>/تسجيلات مش موجودة دلوقتي: 2/.test(document.body.innerText)),await p.evaluate(()=>document.body.innerText.slice(0,400)));
  await p.click('[data-act="rcvAll"]');await p.waitForTimeout(800);
  ok('اترجعوا والموجود ما اتلمسش',await p.evaluate(()=>APP.D.parties.some(x=>x.name==='محمد سعيد (اختبار)')&&APP.D.parties.some(x=>x.name==='مورد قديم 2'))&&await p.evaluate(()=>JSON.stringify(APP.D.parties[0]))===exist);}
else ok('المتصفح ده مفيهوش indexedDB.databases — الشاشة بتفحص القاعدة الأساسية والنسخ التلقائية بس',true);
// ===== 7) جهاز مربوط وسحابة فاضية: ولا حاجة بتتمسح، وكل حفظ بيترفع فورًا =====
const c1=await cnt(p);PULL=[];await p.evaluate(()=>SYNC.join('TESTKEY_aaaaaaaaaaaaaaaaaaaa'));await p.waitForTimeout(1500);
ok('مربوط بسحابة فاضية: البيانات زي ما هي',JSON.stringify(await cnt(p))===JSON.stringify(c1));
ok('البيانات المحلية اترفعت للسحابة الفاضية',RPC.filter(x=>x.fn==='serp_push').reduce((a,x)=>a+x.n,0)>50);
ok('التنبيه اختفى بعد الربط',await p.evaluate(()=>!/على الموبايل ده بس/.test(document.querySelector('#bnr').innerText)));
const t0=Date.now();const np=RPC.length;await p.evaluate(async()=>{await APP.upsert('parties',{name:'مورد فوري',type:'raw'},true)});await p.waitForTimeout(900);
const pushed=RPC.slice(np).find(x=>x.fn==='serp_push');ok('الحفظ اترفع للسحابة في أقل من ثانية',pushed&&pushed.at-t0<900,pushed&&(pushed.at-t0)+'ms');
// سحب فيه نسخة قديمة/حذف أقدم من المحلي: ما بيغيرش حاجة
const pid=await p.evaluate(()=>APP.D.parties.find(x=>x.name==='مورد فوري').id);
PULL=[{coll:'parties',id:pid,data:{id:pid,name:'قديم',type:'raw',updatedAt:'2020-01-01T00:00:00.000Z'},updated_at:'2020-01-01T00:00:00.000Z',deleted:true,seq:5}];
await p.evaluate(async()=>{await Store.meta('cursor@tbajxvopdpprnwlsilkh.supabase.co',0);await SYNC.run()});await p.waitForTimeout(500);
ok('سحب حذف أقدم من المحلي ما مسحش التسجيل',await p.evaluate(id=>APP.D.parties.some(x=>x.id===id&&x.name==='مورد فوري'),pid));
ok('نسخة تلقائية قبل أول سحب',await p.evaluate(async()=>(await Store.snaps()).some(x=>/أول سحب/.test(x.reason))));
ok('مفيش أخطاء جافاسكريبت',!errs.length,errs.join(' | '));
await b.close();srv.close();const f=res.filter(r=>!r.pass).length;console.log(`\n[${BR}] ${res.length-f}/${res.length} PASS`);process.exit(f?1:0);
