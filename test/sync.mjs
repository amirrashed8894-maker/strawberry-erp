// اختبار المزامنة بين جهازين (بروفايلين منفصلين) على مساحة العمل التجريبية — الرمز من ملف ومش بيتطبع
import { chromium } from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.mjs';
import fs from 'fs';
const BASE=process.env.BASE||'http://127.0.0.1:8811/';const OUT='/workspace/strawberry_erp/test/out_sync'+(process.env.BASE?'_live':'');fs.mkdirSync(OUT,{recursive:true});
const KEY=fs.readFileSync('/workspace/strawberry_erp/.secret/test_key.txt','utf8').trim();
const res=[];const ok=(n,c,i='')=>{res.push({n,pass:!!c});console.log((c?'PASS ':'FAIL ')+n+(i?' — '+i:''))};
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const mk=async()=>{const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'ar-EG',timezoneId:'Africa/Cairo'});const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(String(e)));p.on('dialog',d=>{(globalThis.__NATIVE=globalThis.__NATIVE||[]).push(d.type()+': '+d.message());d.dismiss()});await p.addInitScript({path:'/workspace/strawberry_erp/test/dlghook.js'});return {ctx,p}};
const A=await mk(),B=await mk();
const tag='تجريبي مزامنة '+Date.now().toString().slice(-5);
const waitSynced=async p=>{await p.waitForFunction(()=>SYNC.state.enabled&&!SYNC.state.syncing&&SYNC.state.pending===0&&SYNC.state.lastSync&&!SYNC.state.error,null,{timeout:30000})};
const syncNow=async p=>{await p.evaluate(()=>SYNC.run());await waitSynced(p)};
const S='#sheet ';
const newParty=async(p,name)=>{await p.evaluate(()=>{const x=document.createElement('button');x.dataset.act='new';x.dataset.k='party';x.dataset.type='farz';document.body.appendChild(x);x.click();x.remove()});await p.waitForTimeout(150);if(await p.$eval('#sheet',e=>e.hidden))console.log('sheet hidden!', await p.evaluate(()=>location.hash));await p.fill(S+'input[data-p="name"]',name,{timeout:5000});await p.click(S+'.shb [data-act="fsave"]');await p.waitForTimeout(250)};
const pid=(p,name)=>p.evaluate(n=>(APP.D.parties.find(x=>x.name===n)||{}).id||null,name);
for(const X of [A,B]){await X.p.goto(BASE);await X.p.waitForFunction(()=>window.__ready);await X.p.evaluate(k=>{location.hash='#join='+k;},KEY);await X.p.reload();await X.p.waitForFunction(()=>window.__ready);await waitSynced(X.p)}
ok('الجهازين اتربطوا بمساحة العمل التجريبية',await A.p.evaluate(()=>SYNC.state.name.startsWith('تجريبي'))&&await B.p.evaluate(()=>SYNC.state.name.startsWith('تجريبي')));
ok('الرمز اتشال من شريط العنوان',!(await A.p.evaluate(()=>location.href)).includes('join='));
// 1) إضافة في A تظهر في B
await newParty(A.p,tag+' أ');await syncNow(A.p);await syncNow(B.p);
ok('حساب اتعمل على جهاز A ظهر على جهاز B',!!(await pid(B.p,tag+' أ')));
// 2) B أوفلاين: إضافة + تعديل → مستني رفع
await B.ctx.setOffline(true);await B.p.waitForTimeout(300);
await newParty(B.p,tag+' ب');
const idA=await pid(B.p,tag+' أ');
await B.p.evaluate(id=>{const x=document.createElement('button');x.dataset.act='edit';x.dataset.k='party';x.dataset.id=id;document.body.appendChild(x);x.click();x.remove()},idA);await B.p.waitForTimeout(100);
await B.p.fill(S+'input[data-p="phone"]','01000000000').catch(()=>{});await B.p.fill(S+'input[data-p="name"]',tag+' أ معدل');await B.p.click(S+'.shb [data-act="fsave"]');await B.p.waitForTimeout(2500);
const stB=await B.p.evaluate(()=>({pending:SYNC.state.pending,pill:document.querySelector('#sync').textContent,online:SYNC.state.online}));
ok('أوفلاين: التعديلات محفوظة على الجهاز ومستنية رفع',stB.pending>=2&&/أوفلاين/.test(stB.pill),JSON.stringify(stB));
await B.p.evaluate(()=>location.hash='#/cloud');await B.p.waitForTimeout(200);await B.p.evaluate(()=>document.querySelector('#toast')?.classList.remove('on'));await B.p.waitForTimeout(250);await B.p.screenshot({path:OUT+'/sync_offline.png'});
await A.p.evaluate(()=>SYNC.run());await A.p.waitForTimeout(1500);
ok('قبل ما B يرجع أونلاين A لسه مايعرفش التعديل',!(await pid(A.p,tag+' ب')));
// 3) B أونلاين → يرفع، A يشوف
await B.ctx.setOffline(false);await B.p.evaluate(()=>window.dispatchEvent(new Event('online')));await waitSynced(B.p);await syncNow(A.p);
ok('بعد رجوع النت: الحساب الجديد من B ظهر على A',!!(await pid(A.p,tag+' ب')));
ok('بعد رجوع النت: التعديل من B ظهر على A',!!(await pid(A.p,tag+' أ معدل'))&&!(await pid(A.p,tag+' أ')));
// 4) حذف في A → يختفي في B ويتأرشف
const idB=await pid(A.p,tag+' ب');
await A.p.evaluate(id=>{const x=document.createElement('button');x.dataset.act='edit';x.dataset.k='party';x.dataset.id=id;document.body.appendChild(x);x.click();x.remove()},idB);await A.p.waitForTimeout(100);
await A.p.click(S+'[data-act="fdel"]');await A.p.waitForTimeout(400);await syncNow(A.p);await syncNow(B.p);
ok('الحذف على A اتنقل لـ B',!(await pid(B.p,tag+' ب')));
ok('المحذوف متأرشف على الجهاز (مش ممسوح)',await B.p.evaluate(async id=>{const t=await Store.tombs();return t.some(x=>x.v&&x.v.id===id||x.id===id)},idB).catch(e=>'err '+e));
fs.writeFileSync(OUT+'/deleted_id.txt',idB);
// 4ب) ترجيع من الأرشيف على B → يرجع على A (الأحدث يكسب الحذف على السحابة)
await B.p.evaluate(()=>location.hash='#/archive');await B.p.waitForFunction(id=>document.querySelector('[data-act="unarc"][data-id="parties:'+id+'"]'),idB,{timeout:10000});
await B.p.click('[data-act="unarc"][data-id="parties:'+idB+'"]');await B.p.waitForTimeout(400);await syncNow(B.p);await syncNow(A.p);
ok('الترجيع من الأرشيف على B ظهر على A',!!(await pid(A.p,tag+' ب')));
await A.p.evaluate(id=>{const x=document.createElement('button');x.dataset.act='edit';x.dataset.k='party';x.dataset.id=id;document.body.appendChild(x);x.click();x.remove()},idB);await A.p.waitForTimeout(100);
await A.p.click(S+'[data-act="fdel"]');await A.p.waitForTimeout(400);await syncNow(A.p);await syncNow(B.p);ok('واتمسح تاني (تنضيف)',!(await pid(B.p,tag+' ب')));
// 5) شاشة الحالة
await A.p.evaluate(()=>location.hash='#/cloud');await A.p.waitForTimeout(300);await A.p.waitForTimeout(800);await waitSynced(A.p);await A.p.waitForTimeout(200);await A.p.evaluate(()=>document.querySelector('#toast')?.classList.remove('on'));await A.p.waitForTimeout(250);await A.p.screenshot({path:OUT+'/sync_status.png'});
await A.p.evaluate(()=>location.hash='#/');await A.p.waitForTimeout(300);await A.p.evaluate(()=>document.querySelector('#toast')?.classList.remove('on'));await A.p.waitForTimeout(250);await A.p.screenshot({path:OUT+'/dash_synced.png'});
ok('مفيش أخطاء جافاسكريبت',!A.p.errs.length&&!B.p.errs.length,[...A.p.errs,...B.p.errs].join(' | '));
await b.close();const f=res.filter(r=>!r.pass).length;console.log(`\n${res.length-f}/${res.length} PASS`);process.exit(f?1:0);
