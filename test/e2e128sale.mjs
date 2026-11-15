// v1.2.8: البيع بيسحب من كل التشغيلات (الأقدم الأول) — بيانات تجريبية (سيناريو 100 طن) في بروفايل مؤقت، السحابة مقفولة
import { chromium } from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.mjs';
import fs from 'fs';
const R='/workspace/strawberry_erp',OLD=process.env.OLD||'/tmp/erp127',PV=R+'/previews/v128';fs.mkdirSync(PV,{recursive:true});
const res=[];const ok=(n,c,i='')=>{res.push({n,pass:!!c});console.log((c?'PASS ':'FAIL ')+n+(i?' — '+String(i).slice(0,300):''))};const near=(a,b,t=0.01)=>Math.abs(a-b)<=t;
const MT={html:'text/html; charset=utf-8',js:'text/javascript',json:'application/json',webmanifest:'application/manifest+json',png:'image/png',jpg:'image/jpeg',css:'text/css'};
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
async function open(root){const ctx=await b.newContext({viewport:{width:1000,height:1400},deviceScaleFactor:1,locale:'ar-EG',timezoneId:'Africa/Cairo',serviceWorkers:'block'});
  await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='erp.test')return r.abort();const f=root+(u.pathname==='/'?'/index.html':u.pathname);if(fs.existsSync(f))return r.fulfill({status:200,body:fs.readFileSync(f),contentType:MT[f.split('.').pop()]||'application/octet-stream'});return r.fulfill({status:404,body:''})});
  const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(String(e)));await p.addInitScript(()=>{window.__saleLegacy=false});await p.addInitScript({path:R+'/test/dlghook.js'});
  await p.goto('http://erp.test/');await p.waitForFunction(()=>window.__ready);
  await p.evaluate(()=>location.hash='#/backup');await p.setInputFiles('#restoreFile',R+'/test/scenario128.json');await p.waitForFunction(()=>APP.D.runs.length>=4&&APP.D.sales.length>=4,null,{timeout:15000});await p.waitForTimeout(800);return p}
const sig=(p,f)=>p.evaluate(j=>JSON.stringify(ERP.compute(JSON.parse(j).data),(k,v)=>k==='parts'||k==='alloc'?undefined:v),fs.readFileSync(R+'/test/'+f,'utf8'));
// 0) الحسابات على البيانات الموجودة زي 1.2.7 بالظبط
const po=await open(OLD),p=await open(R);
ok('1.2.7 و1.2.8',(await po.evaluate(()=>APP.VER))==='1.2.7'&&(await p.evaluate(()=>APP.VER))>='1.2.9');
for(const f of ['scenario100.json','scenario128.json'])ok('كل الحسابات على البيانات الموجودة زي 1.2.7 بالظبط — '+f,(await sig(po,f))===(await sig(p,f)));
await po.context().close();
const st=await p.evaluate(()=>APP.D.runs.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')||a.no-b.no).map(r=>({id:r.id,no:r.no,date:r.date,av:APP.C.R[r.id].stockFin,kc:APP.C.R[r.id].finKgCost})));
const withStock=st.filter(r=>r.av>1),tot=withStock.reduce((a,r)=>a+r.av,0),mx=Math.max(...withStock.map(r=>r.av));
console.log('runs',JSON.stringify(st.map(r=>[r.no,r.date,Math.round(r.av),+r.kc.toFixed(3)])));
ok('السيناريو فيه أكتر من تشغيلة عليها مخزون',withStock.length>=2,withStock.length);
const S='#sheet ';const salesN=await p.evaluate(()=>APP.D.sales.length);
const oldSales=await p.evaluate(()=>JSON.stringify(APP.D.sales));
// 1) بيع تصدير جديد: حاوية واحدة بكمية أكبر من أي تشغيلة لوحدها وأقل من الإجمالي
const need=Math.floor((mx+Math.min(tot-mx,4000)-1)/100)/10;// طن
const tons=Math.min(need,Math.floor(tot/100)/10);
await p.evaluate(()=>{window.__dlgCount=1;window.__dlgRun='';window.__dlgPrice=2.1;location.hash='#/sales'});await p.waitForTimeout(200);
await p.click('[data-act="new"][data-k="sale"][data-kind="export"]');await p.waitForSelector(S+'input[data-p="lines.0.tons"]');
ok('بيع جديد: التوزيع تلقائي ومفيش اختيار تشغيلة واحدة',await p.evaluate(()=>APP.F.d.autoAlloc===true)&&!(await p.$(S+'select[data-p="lines.0.runId"]'))&&!!(await p.$(S+'[data-al="0"]')));
await p.fill(S+'input[data-p="lines.0.cont"]','TEST1280001');await p.fill(S+'input[data-p="lines.0.bl"]','BLTEST128');
await p.fill(S+'input[data-p="lines.0.tons"]',String(tons));await p.waitForTimeout(250);
const al=await p.evaluate(()=>APP.F.d.lines[0].alloc);
let rest=tons*1000;const exp=[];for(const r of withStock){if(rest<=1e-6)break;const k=Math.min(r.av,rest);exp.push([r.id,Math.round(k*1000)/1000]);rest-=k}
ok('التوزيع FIFO: الأقدم الأول وكل تشغيلة لحد مخزونها',JSON.stringify(al.map(a=>[a.runId,a.kg]))===JSON.stringify(exp)&&al.length>=2,JSON.stringify(al));
const brk=await p.textContent(S+'.albk');ok('جدول التوزيع ظاهر (التشغيلة، الكمية، التكلفة)',brk.includes('توزيع الكمية على التشغيلات')&&brk.includes('تكلفة البضاعة')&&exp.every(e=>brk.includes('#'+st.find(r=>r.id===e[0]).no)));
await p.evaluate(()=>document.getElementById('toast').classList.remove('on'));await p.waitForTimeout(500);
fs.mkdirSync(R+'/test/out128',{recursive:true});
await (await p.$('#sheet .shb')).screenshot({path:R+'/test/out128/pv_a.png'});await (await p.$('#sheet .alb')).screenshot({path:R+'/test/out128/pv_b.png'});
await p.evaluate(()=>{const c=document.querySelector('#sheet .conts .ln');c.dataset.keep=1});await p.evaluate(()=>{const ln=document.querySelector('#sheet .conts .ln');[...ln.children].forEach((e,i)=>{if(i>6&&!e.classList.contains('x'))e.style.display='none'})});
await (await p.$('#sheet .conts')).screenshot({path:R+'/test/out128/pv_c.png'});
await p.evaluate(()=>{const ln=document.querySelector('#sheet .conts .ln');[...ln.children].forEach(e=>e.style.display='')});
await (await p.$('#sheet #fsum')).screenshot({path:R+'/test/out128/pv_d.png'});
await p.click(S+'.shb [data-act="fsave"]');await p.waitForTimeout(500);
ok('اتحفظ من غير منع',await p.evaluate(()=>!APP.F)&&(await p.evaluate(()=>APP.D.sales.length))===salesN+1,await p.evaluate(()=>APP.F?document.querySelector('#ferr').innerText:''));
const sv=await p.evaluate(()=>{const s=APP.D.sales.slice().sort((a,b)=>b.no-a.no)[0];return{s,x:APP.C.SL[s.id]}});
const cogs=exp.reduce((a,[id,k])=>a+k*st.find(r=>r.id===id).kc,0);
ok('تكلفة البضاعة = مجموع (كمية كل جزء × تكلفة كيلو تشغيلته)',near(sv.x.cogs,cogs),sv.x.cogs+' vs '+cogs);
ok('الربح = الإيراد − البضاعة − المصروفات − التحميل',near(sv.x.profit,sv.x.rev-sv.x.cogs-sv.x.exp-sv.x.load));
ok('المحفوظ: alloc + runId أول تشغيلة',sv.s.lines[0].runId===exp[0][0]&&sv.s.lines[0].alloc.length===exp.length&&sv.s.autoAlloc===true);
const st2=await p.evaluate(()=>Object.fromEntries(APP.D.runs.map(r=>[r.id,APP.C.R[r.id].stockFin])));
ok('مخزون كل تشغيلة نقص بجزءها بس',exp.every(([id,k])=>near(st2[id],st.find(r=>r.id===id).av-k,0.01))&&st.filter(r=>!exp.some(e=>e[0]===r.id)).every(r=>near(st2[r.id],r.av,0.01)));
// تكلفة التحميل زي ما لو الحاوية من التشغيلة الأولى بس (الحساب ما اتغيرش)
const loadSingle=await p.evaluate(id=>{const s=JSON.parse(JSON.stringify(APP.D.sales.find(x=>x.id===id)));delete s.lines[0].alloc;const D2={};ERP.COLLS.forEach(k=>D2[k]=APP.D[k]);D2.sales=APP.D.sales.map(x=>x.id===id?s:x);const C2=ERP.compute(D2);return C2.SL[id].load},sv.s.id);
ok('تكلفة التحميل ما اتغيرتش بالتوزيع',near(sv.x.load,loadSingle)&&sv.x.load>0,sv.x.load+' / '+loadSingle);
// ربحية التشغيلات: مجموع الأجزاء = البيع
const rs=await p.evaluate(()=>Object.values(APP.C.R).reduce((a,r)=>({rev:a.rev+r.sales.rev,cogs:a.cogs+r.sales.cogs,load:a.load+r.sales.load}),{rev:0,cogs:0,load:0}));
const sl=await p.evaluate(()=>Object.values(APP.C.SL).reduce((a,x)=>({rev:a.rev+x.rev,cogs:a.cogs+x.cogs,load:a.load+x.load}),{rev:0,cogs:0,load:0}));
ok('ربحية التشغيلات بتجمع لنفس إجمالي المبيعات',near(rs.rev,sl.rev,0.05)&&near(rs.cogs,sl.cogs,0.05)&&near(rs.load,sl.load,0.05),JSON.stringify([rs,sl]));
// 2) أكبر من كل المتاح → منع برسالة الإجمالي
const left=await p.evaluate(()=>Object.values(APP.C.R).reduce((a,r)=>a+Math.max(0,r.stockFin),0));
await p.evaluate(()=>{window.__dlgCount=1;window.__dlgRun='';location.hash='#/sales'});await p.waitForTimeout(150);
await p.click('[data-act="new"][data-k="sale"][data-kind="export"]');await p.waitForSelector(S+'input[data-p="lines.0.tons"]');
await p.fill(S+'input[data-p="lines.0.cont"]','TEST1280002');await p.fill(S+'input[data-p="lines.0.tons"]',String(Math.ceil(left/1000)+5));await p.click(S+'.shb [data-act="fsave"]');await p.waitForTimeout(300);
const er=await p.textContent('#ferr');
ok('أكتر من الإجمالي: اتمنع وقال المتاح في كل التشغيلات',er.includes('المتاح في كل التشغيلات')&&!er.includes('تشغيلة #'),er.slice(0,200));
await p.click(S+'[data-act="fclose"]');await p.waitForTimeout(150);
// 3) تعديل التوزيع يدوي
await p.evaluate(id=>{const b=document.createElement('button');b.dataset.act='edit';b.dataset.k='sale';b.dataset.id=id;document.body.appendChild(b);b.click();b.remove()},sv.s.id);await p.waitForTimeout(200);
ok('فتح بيع محفوظ ما بيغيرش توزيعه',await p.evaluate(a=>JSON.stringify(APP.F.d.lines[0].alloc)===a,JSON.stringify(sv.s.lines[0].alloc)));
await p.click(S+'[data-act="allocManual"]');await p.waitForSelector(S+'input[data-p="lines.0.alloc.0.kg"]');
const L=exp.length-1,k0=exp[0][1],k1=exp[L][1];await p.fill(S+'input[data-p="lines.0.alloc.0.kg"]',String(k0-500));await p.click(S+'.shb [data-act="fsave"]');await p.waitForTimeout(300);
ok('يدوي: مجموع التوزيع لازم يساوي الكمية',(await p.textContent('#ferr')).includes('لازم يبقوا زي بعض'));
await p.fill(S+'input[data-p="lines.0.alloc.'+L+'.kg"]',String(k1+500));await p.waitForTimeout(100);await p.click(S+'.shb [data-act="fsave"]');await p.waitForTimeout(400);
const sv2=await p.evaluate(id=>({s:APP.get('sales',id),x:APP.C.SL[id]}),sv.s.id);
const ferr=await p.evaluate(()=>APP.F?document.querySelector('#ferr').innerText:'');ok('يدوي: اتحفظ بالتوزيع الجديد'+(ferr?' ('+ferr+')':''),!sv2.s.autoAlloc&&sv2.s.lines[0].alloc[0].kg===k0-500&&sv2.s.lines[0].alloc[L].kg===k1+500,JSON.stringify(sv2.s.lines[0].alloc));
const c2=exp.reduce((a,[id,k],j)=>a+(j===0?k-500:j===L?k+500:k)*st.find(r=>r.id===id).kc,0);
ok('يدوي: التكلفة بالتوزيع الجديد',near(sv2.x.cogs,c2),sv2.x.cogs+' vs '+c2);
const hs=await p.evaluate(id=>Store.history('sales',id),sv.s.id);ok('تعديل التوزيع اتسجل في سجل التعديلات',hs.length>=1&&((sv2.s.edits||[]).slice(-1)[0]||{txt:''}).txt.includes('التوزيع على التشغيلات'),((sv2.s.edits||[]).slice(-1)[0]||{}).txt);
// 4) المبيعات القديمة: فتح وحفظ من غير تغيير ما بيضيفش توزيع
const s1=JSON.parse(oldSales).find(x=>x.kind!=='farz')||JSON.parse(oldSales)[0];
await p.evaluate(id=>{const b=document.createElement('button');b.dataset.act='edit';b.dataset.k='sale';b.dataset.id=id;document.body.appendChild(b);b.click();b.remove()},s1.id);await p.waitForTimeout(200);
ok('بيع قديم: بيفتح يدوي بتشغيلته المحفوظة',await p.evaluate(()=>!APP.F.d.autoAlloc)&&!!(await p.$(S+'select[data-p="lines.0.runId"]')));
await p.click(S+'.shb [data-act="fsave"]');await p.waitForTimeout(400);
ok('بيع قديم: بعد الحفظ نفس السطور والتشغيلات',await p.evaluate(([id,L])=>{const s=APP.get('sales',id);return JSON.stringify(s.lines.map(l=>[l.runId,l.alloc]))===L},[s1.id,JSON.stringify(s1.lines.map(l=>[l.runId,undefined]))]));
// 5) بيع فرزة تلقائي
const fz=await p.evaluate(()=>APP.D.runs.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')||a.no-b.no).map(r=>({id:r.id,av:APP.C.R[r.id].stockFarz,kc:APP.C.R[r.id].farzKgCost})).filter(r=>r.av>1));
if(fz.length){const q=Math.floor(Math.min(fz.reduce((a,r)=>a+r.av,0),fz[0].av+300));
  await p.evaluate(()=>location.hash='#/sales');await p.waitForTimeout(150);await p.click('[data-act="new"][data-k="sale"][data-kind="farz"]');await p.waitForSelector(S+'input[data-p="lines.0.kg"]');
  await p.evaluate(()=>{const s=document.querySelector('#sheet select[data-p="customerId"]');const o=[...s.options].find(o=>o.value&&o.value!=='__new');s.value=o.value;s.dispatchEvent(new Event('change',{bubbles:true}))});await p.waitForTimeout(150);
  await p.fill(S+'input[data-p="lines.0.kg"]',String(q));await p.fill(S+'input[data-p="lines.0.price"]','12');await p.click(S+'.shb [data-act="fsave"]');await p.waitForTimeout(400);
  const fs2=await p.evaluate(()=>{const s=APP.D.sales.slice().sort((a,b)=>b.no-a.no)[0];return{s,x:APP.C.SL[s.id],err:APP.F?document.querySelector('#ferr').innerText:''}});
  ok('فرزة: اتوزعت FIFO واتحفظت',fs2.s.kind==='farz'&&(fs2.s.lines[0].alloc||[]).length===(q>fz[0].av?2:1)&&fs2.s.lines[0].alloc[0].runId===fz[0].id,JSON.stringify(fs2.s.lines[0].alloc)+fs2.err)}
else ok('فرزة: مفيش مخزون فرزة في السيناريو (متخطي)',true);
// 6) التقارير بتشتغل
for(const k of ['profitSum','profitDet']){const r=await p.evaluate(async k=>{try{const b=document.createElement('button');b.dataset.act='report';b.dataset.k=k;document.body.appendChild(b);b.click();b.remove();await new Promise(r=>setTimeout(r,800));return document.querySelector('#rep')&&!document.querySelector('#rep').hidden}catch(e){return String(e)}},k);ok('تقرير '+k+' بيفتح',r===true,String(r));await p.evaluate(()=>{const c=document.querySelector('#rep [data-act="rclose"],#rep [data-act="repclose"]');if(c)c.click();else location.hash='#/sales'});await p.waitForTimeout(200)}
ok('مفيش أخطاء جافاسكريبت',!p.errs.length,p.errs.join(' | '));
await b.close();const f=res.filter(r=>!r.pass).length;console.log(`\n${res.length-f}/${res.length} PASS`);process.exit(f?1:0);
