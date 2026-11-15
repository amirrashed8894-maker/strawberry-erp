// دليل: الكود القديم (≤1.2.8) لو القاعدة على الجهاز أحدث منه أو اتعطل الفتح، بيشتغل بتخزين مؤقت فاضي في صمت تقريبًا
import pw from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.js';import fs from 'fs';
const MT={html:'text/html; charset=utf-8',js:'text/javascript',json:'application/json'};let ROOT='/tmp/rp128';
const b=await pw.chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const ctx=await b.newContext({serviceWorkers:'block'});
await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='erp.test')return r.abort();const f=ROOT+(u.pathname==='/'?'/index.html':u.pathname);if(fs.existsSync(f))return r.fulfill({status:200,body:fs.readFileSync(f),contentType:MT[f.split('.').pop()]||'application/octet-stream'});return r.fulfill({status:404,body:''})});
const p=await ctx.newPage();await p.addInitScript({path:'/workspace/strawberry_erp/test/dlghook.js'});await p.goto('http://erp.test/');await p.waitForFunction(()=>window.__ready);
await p.evaluate(async()=>{for(let i=0;i<3;i++)await APP.upsert('parties',{name:'مورد '+i,type:'raw'},true)});
for(const old of ['/tmp/rp127','/tmp/rp125']){ROOT=old;await p.reload();await p.waitForFunction(()=>window.__ready);
console.log(old,'VER',await p.evaluate(()=>APP.VER),'Store.ok',await p.evaluate(()=>Store.ok),'parties shown',await p.evaluate(()=>APP.D.parties.length),'(المفروض 4)');
await p.evaluate(async()=>APP.upsert('parties',{name:'اتكتب في النسخة القديمة',type:'raw'},true));}
ROOT='/tmp/rp128';await p.reload();await p.waitForFunction(()=>window.__ready);
console.log('back on 1.2.8 parties',await p.evaluate(()=>APP.D.parties.map(x=>x.name).join(' | ')));await b.close();
