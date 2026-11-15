// تحقيق 1.2.9: هل التحديث (بخدمة الـ SW الحقيقية) بيمسح البيانات المحلية؟ سلسلة 1.2.5→1.2.6→1.2.7→1.2.8(→الجديد) على جهاز مش مربوط
import pw from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.js';
import http from 'http';import fs from 'fs';
const BR=process.env.BR||'chromium';const CHAIN=(process.env.CHAIN||'/tmp/rp125,/tmp/rp126,/tmp/rp127,/tmp/rp128').split(',');
let ROOT=CHAIN[0];const MT={html:'text/html; charset=utf-8',js:'text/javascript',json:'application/json',webmanifest:'application/manifest+json',png:'image/png',jpg:'image/jpeg',css:'text/css'};
const srv=http.createServer((q,r)=>{const u=new URL(q.url,'http://x');const f=ROOT+(u.pathname==='/'?'/index.html':u.pathname);if(fs.existsSync(f)&&fs.statSync(f).isFile()){r.writeHead(200,{'content-type':MT[f.split('.').pop()]||'application/octet-stream','cache-control':'public, max-age=0'});r.end(fs.readFileSync(f))}else{r.writeHead(404);r.end()}});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));const port=srv.address().port,URL0='http://127.0.0.1:'+port+'/';
const res=[];const ok=(n,c,i='')=>{res.push({n,pass:!!c});console.log((c?'PASS ':'FAIL ')+n+(i?' — '+String(i).slice(0,300):''))};
const b=BR==='webkit'?await pw.webkit.launch():await pw.chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:390,height:844},locale:'ar-EG',timezoneId:'Africa/Cairo'});
let U=URL0;if(BR==='webkit'){U='http://erp.test/';await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='erp.test')return r.abort();const f=ROOT+(u.pathname==='/'?'/index.html':u.pathname);if(fs.existsSync(f))return r.fulfill({status:200,body:fs.readFileSync(f),contentType:MT[f.split('.').pop()]||'application/octet-stream'});return r.fulfill({status:404,body:''})})}
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.addInitScript({path:'/workspace/strawberry_erp/test/dlghook.js'});
const counts=()=>p.evaluate(()=>({ver:APP.VER,ok:Store.ok,parties:APP.D.parties.length,purchases:APP.D.purchases.length,mine:APP.D.parties.filter(x=>/^مورد تجربة \d$/.test(x.name)).length,all:APP.D.parties.filter(x=>/مورد تجربة/.test(x.name)).length}));
await p.goto(U);await p.waitForFunction(()=>window.__ready);await p.waitForTimeout(1500);
await p.evaluate(async()=>{for(let i=1;i<=3;i++)await APP.upsert('parties',{name:'مورد تجربة '+i,type:'supplier'},true)});
let c0=await counts();ok('بيانات اتعملت على '+c0.ver,c0.mine===3,JSON.stringify(c0));
for(const dir of CHAIN.slice(1)){ROOT=dir;
  // زي المستخدم: يفتح البرنامج تاني — الـ SW القديم بيعرض القديم الأول وبعدين التحديث بيعمل reload
  await p.reload();await p.waitForFunction(()=>window.__ready);await p.waitForTimeout(4000);
  try{await p.waitForFunction(()=>window.__ready,null,{timeout:8000})}catch(e){}
  await p.reload();await p.waitForFunction(()=>window.__ready,null,{timeout:15000});await p.waitForTimeout(1500);
  const c=await counts();ok('بعد التحديث لـ '+c.ver+' البيانات موجودة',c.mine===3&&c.ok,JSON.stringify(c));
  await p.evaluate(async v=>APP.upsert('parties',{name:'مورد تجربة بعد '+v,type:'supplier'},true),c.ver);}
const last=await counts();ok('سجلات اتضافت في كل نسخة موجودة',last.all===3+CHAIN.length-1,JSON.stringify(last));
ok('مفيش أخطاء جافاسكريبت',!errs.length,errs.join(' | '));
await b.close();srv.close();const f=res.filter(r=>!r.pass).length;console.log(`\n[${BR}] ${res.length-f}/${res.length} PASS`);process.exit(f?1:0);
