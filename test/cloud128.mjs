// v1.2.8 سحابة: الحذف علامة بس، والسجل بيترفع ويتقري من جهاز تاني، والترجيع بيتزامن — مساحة «تجريبي» بس (مش مساحة العمل الحقيقية)
import { chromium } from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.mjs';
import fs from 'fs';
const BASE=process.env.BASE||'http://127.0.0.1:8811/';const NEW='tbajxvopdpprnwlsilkh';
const TK=fs.readFileSync('/workspace/strawberry_erp/.secret/test_key.txt','utf8').trim();
const res=[];const ok=(n,c,i='')=>{res.push({n,pass:!!c});console.log((c?'PASS ':'FAIL ')+n+(i?' — '+String(i).slice(0,240):''))};
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const errs=[];const hosts=new Set();
async function device(){const ctx=await b.newContext({viewport:{width:390,height:844},locale:'ar-EG',timezoneId:'Africa/Cairo'});
  ctx.on('request',r=>{const h=new URL(r.url()).hostname;if(h.endsWith('supabase.co'))hosts.add(h)});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>d.dismiss());await p.addInitScript({path:'/workspace/strawberry_erp/test/dlghook.js'});
  await p.goto(BASE);await p.waitForFunction(()=>window.__ready);
  const j=await p.evaluate(k=>SYNC.join(k),TK);await p.waitForFunction(()=>SYNC.state.enabled&&!SYNC.state.syncing,null,{timeout:30000});
  const nm=await p.evaluate(()=>SYNC.state.name||'');
  if(!j||!nm.startsWith('تجريبي')||nm.includes('الراشد')){console.log('ABORT: مش مساحة الاختبار');process.exit(2)}
  return{ctx,p}}
const sync=p=>p.evaluate(async()=>{await SYNC.run();return SYNC.state.error});
const A=await device(),B=await device();
ok('الجهازين مربوطين بمساحة «تجريبي» بس',true);
const tag='اختبار 1.2.8 '+Date.now().toString(36);
// جهاز A: حساب ودفعة جديدة، تعديلين، حذف
const id=await A.p.evaluate(async tag=>{const pa=await APP.upsert('parties',{type:'raw',name:tag,openSide:'d'},true);
  const y=await APP.upsert('payments',{dir:'out',partyId:pa.id,amount:1000,date:'2026-11-15',method:'cash',cur:'EGP',notes:tag},true);return y.id},tag);
ok('رفع الدفعة', !(await sync(A.p)));
await A.p.evaluate(async id=>{const y=JSON.parse(JSON.stringify(APP.get('payments',id)));y.amount=1500;await APP.upsert('payments',y,true)},id);ok('رفع تعديل 1',!(await sync(A.p)));
// تعديل أوفلاين مرتين (النسخة الوسطانية ما توصلش السيرفر غير من سجل الجهاز)
await A.ctx.setOffline(true);
await A.p.evaluate(async id=>{let y=JSON.parse(JSON.stringify(APP.get('payments',id)));y.amount=1700;await APP.upsert('payments',y,true);y=JSON.parse(JSON.stringify(APP.get('payments',id)));y.amount=1800;await APP.upsert('payments',y,true)},id);
await A.ctx.setOffline(false);await A.p.waitForTimeout(500);ok('رفع بعد الأوفلاين',!(await sync(A.p)));
await A.p.evaluate(()=>location.hash='#/home');
await A.p.evaluate(async id=>{const b=document.createElement('button');b.dataset.act='edit';b.dataset.k='payment';b.dataset.id=id;document.body.appendChild(b);b.click();b.remove()},id);await A.p.waitForTimeout(100);
await A.p.click('#sheet [data-act="fdel"]');await A.p.waitForTimeout(400);ok('رفع الحذف',!(await sync(A.p)));
const ch=await A.p.evaluate(async id=>{const r=await SYNC.history('payments',id);return r},id);
const amts=ch.map(r=>r.data.amount);
ok('السحابة: كل النسخ القديمة محفوظة (1000، 1500، 1700 الأوفلاين، 1800)',[1000,1500,1700,1800].every(a=>amts.includes(a)),amts.join(','));
ok('السحابة: الحذف علامة والبيانات موجودة',await A.p.evaluate(async([id,k])=>{const r=await fetch(ERP_CLOUD.url+'/rest/v1/rpc/serp_pull',{method:'POST',headers:{apikey:ERP_CLOUD.key,'Content-Type':'application/json'},body:JSON.stringify({p_key:k,p_since:0,p_limit:2000})});const j=await r.json();const x=j.rows.find(r=>r.coll==='payments'&&r.id===id);return x&&x.deleted&&x.data&&x.data.amount===1800},[id,TK]));
// محاولة مسح البيانات بحذف فاضي → السيرفر بيرفض
const bad=await A.p.evaluate(async([id,k])=>{const r=await fetch(ERP_CLOUD.url+'/rest/v1/rpc/serp_push',{method:'POST',headers:{apikey:ERP_CLOUD.key,'Content-Type':'application/json'},body:JSON.stringify({p_key:k,p_device:'test',p_rows:[{coll:'payments',id,data:{},updated_at:new Date(Date.now()+86400000).toISOString(),deleted:true},{coll:'payments',id,data:null,updated_at:new Date(Date.now()+86400000).toISOString(),deleted:true}]})});return r.json()},[id,TK]);
ok('serp_push برفض حذف من غير بيانات (skipped)',bad&&bad.written===0&&bad.skipped===2,JSON.stringify(bad));
// مفيش DELETE مباشر بالمفتاح العام
const del=await A.p.evaluate(async()=>{const r=await fetch(ERP_CLOUD.url+'/rest/v1/records?id=eq.x',{method:'DELETE',headers:{apikey:ERP_CLOUD.key,'Content-Profile':'serp','Accept-Profile':'serp'}});const h=await fetch(ERP_CLOUD.url+'/rest/v1/history?select=*',{headers:{apikey:ERP_CLOUD.key,'Accept-Profile':'serp'}});return [r.status,h.status]});
ok('DELETE مباشر وقراية السجل بالمفتاح العام مرفوضين',del[0]>=400&&del[1]>=400,del.join(','));
const fake=await A.p.evaluate(async id=>{const r=await fetch(ERP_CLOUD.url+'/rest/v1/rpc/serp_history',{method:'POST',headers:{apikey:ERP_CLOUD.key,'Content-Type':'application/json'},body:JSON.stringify({p_key:'fake_fake_fake_fake_fake_fake',p_coll:'payments',p_id:id})});return r.status},id);
ok('serp_history برمز مزيف مرفوض',fake>=400,String(fake));
// جهاز B: بيشوف المحذوف في الأرشيف وسجله من السحابة، ويرجّع نسخة 1500
ok('جهاز B: مزامنة',!(await sync(B.p)));
ok('جهاز B: الدفعة في الأرشيف',await B.p.evaluate(async id=>!APP.get('payments',id)&&(await Store.tombs()).some(t=>t.k==='payments:'+id),id));
await B.p.evaluate(id=>location.hash='#/hist/payments/'+id,id);await B.p.waitForFunction(()=>document.querySelectorAll('.hist [data-act="hrest"]').length>=3,null,{timeout:15000});
const rows=await B.p.$$eval('.hist .row',a=>a.map(e=>e.innerText));
ok('جهاز B: شاشة السجل فيها نسخ السحابة',rows.some(t=>t.includes('السحابة'))&&rows.length>=4,rows.length+' | '+rows[0]);
const i1500=await B.p.evaluate(()=>{const H=[...document.querySelectorAll('.hist .row')];return H.findIndex(r=>r.innerText.includes('1,000 ← 1,800')||false)});
const idx=await B.p.evaluate(async id=>{const r=await SYNC.history('payments',id);return null},id);
const target=await B.p.evaluate(()=>{const L=[...document.querySelectorAll('.hist .row')];const k=L.findIndex(r=>/1,500 ← 1,800/.test(r.innerText));return k});
ok('جهاز B: لقى نسخة 1500',target>=0,String(target));
await B.p.click('.hist [data-act="hrest"][data-i="'+target+'"]');await B.p.waitForTimeout(500);
ok('جهاز B: الدفعة رجعت بمبلغ 1500',await B.p.evaluate(id=>{const y=APP.get('payments',id);return y&&y.amount===1500},id));
ok('جهاز B: رفع الترجيع',!(await sync(B.p)));
ok('جهاز A: استلم الترجيع',!(await sync(A.p))&&await A.p.evaluate(id=>{const y=APP.get('payments',id);return y&&y.amount===1500},id));
const ch2=await A.p.evaluate(id=>SYNC.history('payments',id),id);
ok('السحابة: نسخة المحذوف (1800 محذوفة) اتحفظت قبل الترجيع',ch2.some(r=>r.data.amount===1800&&r.deleted),ch2.map(r=>r.data.amount+(r.deleted?'d':'')+':'+r.action+':'+r.src).join(','));
ok('جهاز A: مفيش حاجة مستنية رفع',await A.p.evaluate(async()=>(await Store.outCount())+(await Store.houtCount())===0));
ok('كل الطلبات للمشروع الجديد بس',[...hosts].every(h=>h===NEW+'.supabase.co'),[...hosts].join(','));
ok('مفيش أخطاء جافاسكريبت',!errs.length,errs.join(' | '));
await b.close();const f=res.filter(r=>!r.pass).length;console.log(`\n${res.length-f}/${res.length} PASS`);process.exit(f?1:0);
