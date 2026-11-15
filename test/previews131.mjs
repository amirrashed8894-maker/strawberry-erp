// v1.3.1: صور معاينة بالبيانات التجريبية (scenario130) — بروفايل مؤقت والسحابة مقفولة
import { chromium } from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.mjs';
import fs from 'fs';import {execSync} from 'child_process';
const OUT='/workspace/strawberry_erp/previews/v131';fs.mkdirSync(OUT,{recursive:true});execSync('node /workspace/strawberry_erp/test/scenario130.js >/dev/null');
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const LBL='<div style="position:absolute;top:150px;left:50px;z-index:5;border:2px solid #111;border-radius:6px;padding:2px 10px;font:800 13px Cairo,sans-serif;background:#fff">بيانات تجريبية — TEST DATA</div>';
async function setup(o){const ctx=await b.newContext(o);await ctx.route(/supabase\.co/,r=>r.abort());const p=await ctx.newPage();await p.addInitScript({path:'/workspace/strawberry_erp/test/dlghook.js'});
  await p.goto('http://127.0.0.1:8811/');await p.waitForFunction(()=>window.__ready,null,{timeout:60000});await p.evaluate(()=>location.hash='#/backup');
  await p.setInputFiles('#restoreFile','/workspace/strawberry_erp/test/scenario130.json');await p.waitForFunction(()=>APP.D.sales.filter(s=>s.cont).length===4);await p.waitForTimeout(4000);return p}
// 1) A4: صفحة 1 لحاوية من تشغيلتين
let p=await setup({viewport:{width:1280,height:1000},deviceScaleFactor:2,locale:'ar-EG',timezoneId:'Africa/Cairo'});
await p.evaluate(()=>RPT.open('contCost',{id:'c:s7:0'}));await p.waitForFunction(()=>window.__repReady>0);await p.waitForTimeout(500);
await p.evaluate(l=>{document.querySelectorAll('#pages .pw .rp').forEach(r=>r.insertAdjacentHTML('beforeend',l))},LBL);
await p.evaluate(()=>{document.querySelector('.repbar').style.display='none'});await (await p.$('#pages .pw')).screenshot({path:'/tmp/v131/a4_1.png'});
// 2) موبايل: فاتورة بحاويتين
p=await setup({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,locale:'ar-EG',timezoneId:'Africa/Cairo'});
await p.evaluate(()=>location.hash='#/costs');await p.waitForTimeout(300);await p.click('.seg [data-v="cont"]');await p.waitForTimeout(300);await p.selectOption('#costSel','i:TEST-EXP-02');await p.waitForTimeout(400);
await p.evaluate(()=>{const b=document.querySelector('#bnr');if(b)b.style.display='none';document.querySelector('#nav').style.display='none';document.querySelector('#main').insertAdjacentHTML('afterbegin','<div style="border:2px solid #111;border-radius:8px;padding:4px 10px;margin:6px 0;font-weight:800;text-align:center">بيانات تجريبية — TEST DATA</div>')});
await p.screenshot({path:'/tmp/v131/mob_inv.png',fullPage:true});
await b.close();
execSync(`python3 -c "
from PIL import Image
a=Image.open('/tmp/v131/a4_1.png').convert('RGB');a=a.resize((1000,round(a.size[1]*1000/a.size[0])),Image.LANCZOS);a.save('${OUT}/container_cost_a4_page1.jpg',quality=88)
m=Image.open('/tmp/v131/mob_inv.png').convert('RGB');m=m.resize((1000,round(m.size[1]*1000/m.size[0])),Image.LANCZOS);m=m.crop((0,0,1000,min(m.size[1],3600)));m.save('${OUT}/invoice_two_containers_mobile.jpg',quality=85)
print(a.size,m.size)"`,{stdio:'inherit'});
