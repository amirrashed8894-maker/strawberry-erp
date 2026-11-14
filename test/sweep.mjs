// يضغط على كل زرار في كل شاشة (ببيانات سيناريو 100 طن من ملف نسخة، في بروفايل متصفح مؤقت — مفيش ربط بالسحابة)
// ENGINE=webkit|chromium  W=390|1280
import { chromium, webkit } from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.mjs';
import fs from 'fs';
const WK=process.env.ENGINE==='webkit',W=+(process.env.W||390),BASE=process.env.BASE||(WK?'http://erp.test/':'http://127.0.0.1:8811/');
const OUT='/workspace/strawberry_erp/test/out_sweep/'+(WK?'webkit':'chromium')+'_'+W+(process.env.BASE?'_live':'');fs.mkdirSync(OUT,{recursive:true});
const res=[];const ok=(n,c,i='')=>{res.push({n,pass:!!c,i});if(!c||process.env.V)console.log((c?'PASS ':'FAIL ')+n+(i?' — '+i:''))};
const b=WK?await webkit.launch():await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const mob=W<700;
const ctx=await b.newContext({viewport:{width:W,height:mob?844:900},deviceScaleFactor:mob?2:1,isMobile:mob&&!WK,hasTouch:mob,locale:'ar-EG',timezoneId:'Africa/Cairo',acceptDownloads:true});
const MT={html:'text/html; charset=utf-8',js:'text/javascript',json:'application/json',webmanifest:'application/manifest+json',png:'image/png',jpg:'image/jpeg',woff2:'font/woff2'};
if(WK&&!process.env.BASE)await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='erp.test')return r.abort();const f='/workspace/strawberry_erp'+(u.pathname==='/'?'/index.html':u.pathname);if(fs.existsSync(f))return r.fulfill({status:200,contentType:MT[f.split('.').pop()]||'application/octet-stream',body:fs.readFileSync(f)});return r.fulfill({status:404,body:''})});
// مفيش أي طلب للسحابة في الاختبار ده
await ctx.route(/supabase\.co/,r=>r.abort());
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::ERR/.test(m.text()))errs.push(m.text())});
p.on('dialog',d=>{(globalThis.__NATIVE=globalThis.__NATIVE||[]).push(d.type()+': '+d.message());d.dismiss()});await p.addInitScript({path:'/workspace/strawberry_erp/test/dlghook.js'});await p.addInitScript(()=>{window.__dlgMode='dismiss'});
await p.goto(BASE);await p.waitForFunction(()=>window.__ready);
ok('مش مربوط بالسحابة',await p.evaluate(()=>!SYNC.state.enabled));
await p.evaluate(()=>location.hash='#/backup');await p.waitForTimeout(200);await p.evaluate(()=>__dlgMode='accept');
await p.setInputFiles('#restoreFile','/workspace/strawberry_erp/test/scenario100.json');await p.waitForFunction(()=>APP.D.runs.length===4,null,{timeout:10000});await p.evaluate(()=>__dlgMode='dismiss');
ok('اتحمل سيناريو 100 طن',await p.evaluate(()=>APP.D.purchases.length)===12);
const ROUTES=['#/home','#/buy','#/runs','#/run/r1','#/run/r2','#/run/r3','#/run/r4','#/sales','#/acc','#/party/cus-fussga','#/party/R1','#/party/FZ1','#/more','#/stock','#/reports','#/master/factories','#/master/varieties','#/master/items','#/settings','#/backup','#/cloud','#/archive'];
const TABS={'#/buy':['buyTab',['raw','trans','sup','tf']],'#/acc':['accTab',['sup','cus']],'#/stock':['stockTab',['fin','raw','sup']]};
let clicks=0,reports=0,forms=0;
const shot=async nm=>{await p.evaluate(()=>document.querySelector('#toast')?.classList.remove('on'));await p.screenshot({path:OUT+'/'+nm+'.png',fullPage:false})};
async function sweepView(h,tag){
  const n=await p.$$eval('#main [data-act],#main [data-go]',L=>L.length);
  for(let i=0;i<n;i++){
    await p.evaluate(h=>{if(location.hash!==h)location.hash=h},h);await p.waitForTimeout(60);
    const info=await p.evaluate(i=>{const L=[...document.querySelectorAll('#main [data-act],#main [data-go]')];const el=L[i];if(!el)return null;return {act:el.dataset.act||'',go:el.dataset.go||'',k:el.dataset.k||'',dis:el.disabled,txt:(el.textContent||'').trim().slice(0,40)}},i);
    if(!info||info.dis)continue;
    if(['syncUnlink','syncJoin','restore','syncNow','syncLink'].includes(info.act))continue; // أزرار السحابة/الاسترجاع ليها اختبار منفصل
    const before=errs.length;
    await p.evaluate(i=>{const L=[...document.querySelectorAll('#main [data-act],#main [data-go]')];L[i].click()},i);clicks++;
    await p.waitForTimeout(info.act==='report'?50:120);
    if(info.act==='report'){try{await p.waitForFunction(()=>window.__repReady>0&&!document.querySelector('#rep').hidden,null,{timeout:15000});reports++;
        const pg=await p.evaluate(()=>window.__repReady);ok(tag+' تقرير '+info.k+' ('+pg+' ص)',pg>0);
        await p.evaluate(()=>{window.__repReady=0;document.querySelector('#rClose').click()})}catch(e){ok(tag+' تقرير '+info.k+' «'+info.txt+'»',false,String(e).slice(0,120))}}
    const sheet=await p.$eval('#sheet',e=>!e.hidden);
    if(sheet){forms++;const t=await p.textContent('#sheet h2');ok(tag+' نموذج «'+t+'» اتفتح',!!t);await p.click('#sheet .shb [data-act="fclose"]');await p.waitForTimeout(60)}
    if(errs.length>before)ok(tag+' زرار «'+info.txt+'» من غير أخطاء',false,errs.slice(before).join(' | '));
  }
}
for(const h of ROUTES){await p.evaluate(h=>location.hash=h,h);await p.waitForTimeout(150);
  const txt=await p.textContent('#main');ok(h+' بيعرض',!/حصل خطأ في العرض/.test(txt),txt.slice(0,100));
  const tabs=TABS[h];if(tabs){for(const v of tabs[1]){await p.evaluate(([k,v])=>{const x=document.querySelector(`[data-act="ui"][data-k="${k}"][data-v="${v}"]`);x&&x.click()},[tabs[0],v]);await p.waitForTimeout(80);await shot(h.replace(/[#\/]/g,'_')+'_'+v);await sweepView(h,h+'/'+v)}}
  else{await shot(h.replace(/[#\/]/g,'_'));await sweepView(h,h)}}
// مشاركة PDF وطباعة من شاشة التقرير
for(const [k,o] of [['stmt',{id:'R1'}],['profitDet',{}]]){await p.evaluate(([k,o])=>{window.__printed=0;window.print=()=>{window.__printed++};return RPT.open(k,o)},[k,o]);await p.waitForFunction(()=>window.__repReady>0);
  await p.waitForFunction(()=>window.jspdf&&window.html2canvas);
  const [dl]=await Promise.all([p.waitForEvent('download',{timeout:60000}).catch(()=>null),p.click('#rShare')]);ok('زرار «مشاركة PDF» في '+k+' طلّع ملف PDF',dl&&/\.pdf$/.test(dl.suggestedFilename()),dl?dl.suggestedFilename():'no download');
  await p.click('#rPrint');ok('زرار «طباعة» في '+k+' شغال',await p.evaluate(()=>window.__printed===1));await p.click('#rClose');await p.waitForTimeout(80)}
// كل نماذج الإضافة: حفظ فاضي لازم يطلع أخطاء ومايحفظش
for(const k of ['purchase','transport','payment','supplyIn','transfer','run','sale','party','factory','variety','item']){
  const cnt=await p.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(APP.D).map(([k,v])=>[k,v.length]))));
  await p.evaluate(k=>{const x=document.createElement('button');x.dataset.act='new';x.dataset.k=k;document.body.appendChild(x);x.click();x.remove()},k);await p.waitForTimeout(100);
  // فضّي كل الخانات
  await p.$$eval('#sheet input[data-p]',L=>L.forEach(i=>{if(!/date|no$/.test(i.dataset.p)){i.value='';i.dispatchEvent(new Event('input',{bubbles:true}))}}));await p.waitForTimeout(60);
  await p.click('#sheet .shb [data-act="fsave"]');await p.waitForTimeout(150);
  const still=await p.$eval('#sheet',e=>!e.hidden),er=await p.textContent('#ferr');
  const cnt2=await p.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(APP.D).map(([k,v])=>[k,v.length]))));
  ok('نموذج '+k+' فاضي مايتحفظش',still&&/مينفعش/.test(er)&&cnt===cnt2,er.slice(0,120));if(still)await p.click('#sheet .shb [data-act="fclose"]');await p.waitForTimeout(60)}
ok('مفيش أخطاء جافاسكريبت',!errs.length,errs.slice(0,5).join(' | '));
ok('مفيش أي طلب اتبعت للسحابة',await p.evaluate(()=>!SYNC.state.enabled));
ok('مفيش نوافذ متصفح (prompt/confirm/alert) — كله جوه البرنامج',!(globalThis.__NATIVE||[]).length,(globalThis.__NATIVE||[]).join(' | '));const dialogs=await p.evaluate(()=>__dlgLog);ok('نوافذ البرنامج اشتغلت (حذف/استرجاع…)',dialogs.length>0,dialogs.length);
fs.writeFileSync(OUT+'/sweep.json',JSON.stringify({res,clicks,reports,forms,dialogs},null,1));
await b.close();const f=res.filter(r=>!r.pass).length;console.log(`${WK?'webkit':'chromium'} ${W}px: ${res.length-f}/${res.length} PASS · ${clicks} ضغطة · ${reports} تقرير · ${forms} نموذج`);process.exit(f?1:0);
