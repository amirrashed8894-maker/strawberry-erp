import { chromium } from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.mjs';
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'ar-EG',timezoneId:'Africa/Cairo'});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://127.0.0.1:8811/');await p.waitForFunction(()=>window.__ready);
await p.screenshot({path:'/tmp/erp_home.png'});
for(const h of ['#/buy','#/runs','#/sales','#/acc','#/more','#/stock','#/reports','#/master/varieties','#/master/items','#/settings','#/backup','#/archive','#/cloud']){await p.evaluate(h=>location.hash=h,h);await p.waitForTimeout(150)}
console.log('errors',errs);await b.close();
