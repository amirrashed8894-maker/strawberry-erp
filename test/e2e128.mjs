// v1.2.8: مفيش مسح نهائي + سجل التعديلات وترجيع أي نسخة — بروفايل مؤقت، السحابة مقفولة، مفيش كتابة على مساحة العمل الحقيقية
import { chromium } from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.mjs';
import fs from 'fs';
const R='/workspace/strawberry_erp',BASE=process.env.BASE||'http://127.0.0.1:8811/';const PV=R+'/previews/v128';fs.mkdirSync(PV,{recursive:true});
const res=[];const ok=(n,c,i='')=>{res.push({n,pass:!!c});console.log((c?'PASS ':'FAIL ')+n+(i?' — '+String(i).slice(0,240):''))};
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:1000,height:900},deviceScaleFactor:1,locale:'ar-EG',timezoneId:'Africa/Cairo'});
await ctx.route(/supabase\.co/,r=>r.abort());
const NATIVE=[];const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>{NATIVE.push(d.type());d.dismiss()});
await p.addInitScript({path:R+'/test/dlghook.js'});
await p.goto(BASE);await p.waitForFunction(()=>window.__ready);
ok('النسخة 1.2.8',await p.evaluate(()=>APP.VER)==='1.2.9');
ok('مش مربوط بالسحابة (ولا بمساحة العمل الحقيقية)',await p.evaluate(()=>!SYNC.state.enabled&&!(SYNC.state.name||'').includes('الراشد')));
const S='#sheet ';
const editK=async(k,id)=>{await p.evaluate(([k,id])=>{const b=document.createElement('button');b.dataset.act='edit';b.dataset.k=k;b.dataset.id=id;document.body.appendChild(b);b.click();b.remove()},[k,id]);await p.waitForTimeout(80)};
const hist=(c,id)=>p.evaluate(([c,id])=>Store.history(c,id),[c,id]);
const calcSig=()=>p.evaluate(()=>{const C=APP.C;const strip=o=>JSON.parse(JSON.stringify(o,(k,v)=>k==='edits'||k==='updatedAt'||k==='createdAt'?undefined:v));return JSON.stringify(strip(C))});
// بيانات تجريبية: سيناريو 100 طن (من الملف، مش بيانات حقيقية)
await p.evaluate(()=>location.hash='#/backup');await p.setInputFiles('#restoreFile',R+'/test/scenario100.json');
await p.waitForFunction(()=>APP.D.runs.length>=4&&APP.D.purchases.length>5,null,{timeout:15000});
await p.waitForTimeout(500);
const sig0=await calcSig();
// 1) تعديل فاتورة خام مرتين → نسختين قديمتين في السجل
const pu=await p.evaluate(()=>{const x=APP.D.purchases.slice().sort((a,b)=>a.no-b.no)[0];return{id:x.id,price:x.price,no:x.no}});
const h0=(await hist('purchases',pu.id)).length;
await editK('purchase',pu.id);await p.fill(S+'input[data-p="price"]',String(+pu.price+1));await p.click(S+'.shb [data-act="fsave"]');await p.waitForTimeout(300);
let H=await hist('purchases',pu.id);
ok('تعديل 1: النسخة القديمة اتحفظت في السجل',H.length===h0+1&&H[0].v.price==pu.price&&H[0].act==='edit',JSON.stringify(H.map(x=>x.v.price)));
ok('السجل فيه الوقت والجهاز',H[0].at&&!isNaN(Date.parse(H[0].at))&&/-[a-z0-9]{6}$/.test(H[0].dev||''),H[0].dev);
await editK('purchase',pu.id);await p.fill(S+'input[data-p="price"]',String(+pu.price+2));await p.click(S+'.shb [data-act="fsave"]');await p.waitForTimeout(300);
H=await hist('purchases',pu.id);ok('تعديل 2: نسختين قديمتين',H.length===h0+2,JSON.stringify(H.map(x=>x.v.price)));
ok('الحساب اتغير مع السعر (طبيعي)',(await calcSig())!==sig0);
ok('هوامش «معدل» القديمة لسه شغالة',await p.evaluate(id=>(APP.get('purchases',id).edits||[]).length>=2,pu.id));
// 2) شاشة سجل التعديلات من زرار النموذج
await editK('purchase',pu.id);ok('زرار «سجل التعديلات» في النموذج',await p.$(S+'[data-act="fhist"]')!=null);
await p.click(S+'[data-act="fhist"]');await p.waitForFunction(()=>document.querySelectorAll('.hist [data-act="hrest"]').length>=2,null,{timeout:5000});
const rows=await p.$$eval('.hist .row',a=>a.map(e=>e.innerText));
ok('الشاشة بتعرض النسخ القديمة بالوقت والجهاز والفرق',rows.length===h0+2&&rows.every(t=>/نسخة \d{2}\/\d{2}\/\d{4}/.test(t)&&t.includes('الجهاز'))&&rows.some(t=>t.includes('الفرق عن الحالية')),rows[0]);
await p.evaluate(()=>document.getElementById('toast').classList.remove('on'));await p.waitForTimeout(350);await p.screenshot({path:PV+'/edit_history_view.jpg',type:'jpeg',quality:86,fullPage:false});
// ترجيع النسخة الأصلية (الأقدم)
const oldest=await p.evaluate(()=>{const L=[...document.querySelectorAll('.hist [data-act="hrest"]')];return +L[L.length-1].dataset.i});
await p.click('.hist [data-act="hrest"][data-i="'+oldest+'"]');await p.waitForTimeout(500);
const now=await p.evaluate(id=>APP.get('purchases',id),pu.id);
ok('ترجيع: السعر رجع للأصل',now.price==pu.price,now.price);
H=await hist('purchases',pu.id);ok('ترجيع: النسخة اللي اتغطت اتحفظت كمان',H.length===h0+3&&H.some(x=>x.v.price==+pu.price+2),JSON.stringify(H.map(x=>x.v.price)));
ok('ترجيع: ملاحظة «ترجيع نسخة» في هوامش التعديل',(now.edits||[]).slice(-1)[0].txt.includes('ترجيع نسخة'));
await p.waitForTimeout(300);ok('الحسابات رجعت زي ما كانت بالظبط بعد الترجيع',(await calcSig())===sig0);
// 3) حذف = أرشيف، والترجيع ما بيمسحش نسخة الأرشيف
const py=await p.evaluate(()=>APP.D.payments[0].id);
await editK('payment',py);await p.click(S+'[data-act="fdel"]');await p.waitForTimeout(400);
let st=await p.evaluate(async id=>({live:!!APP.get('payments',id),tomb:(await Store.tombs()).some(t=>t.k==='payments:'+id),h:(await Store.history('payments',id)).map(x=>x.act),out:(await Store.all('out')).some(o=>o.k==='payments:'+id&&o.deleted)}),py);
ok('حذف: اتشال من القوائم واتنقل للأرشيف',!st.live&&st.tomb,JSON.stringify(st));
ok('حذف: نسخة «اتمسحت» في السجل وعلامة حذف للسحابة (مش مسح)',st.h.includes('delete')&&st.out,JSON.stringify(st));
await p.evaluate(()=>location.hash='#/archive');await p.waitForFunction(()=>document.querySelector('[data-act="unarc"]'),null,{timeout:5000});
const arcTxt=await p.textContent('#main');
ok('الأرشيف: مفيش «حذف نهائي» ولا «تفريغ»',!/حذف نهائي|تفريغ|إفراغ|امسح نهائي/.test(arcTxt)&&arcTxt.includes('مفيش مسح نهائي'),arcTxt.slice(0,200));
ok('الأرشيف: زرار «السجل» لكل محذوف',await p.$('.arc a[href],.arc [data-go^="#/hist/payments/"]')!=null);
await p.evaluate(()=>document.getElementById('toast').classList.remove('on'));await p.waitForTimeout(350);await p.screenshot({path:PV+'/archive_no_permanent_delete.jpg',type:'jpeg',quality:86,fullPage:false});
await p.click('[data-act="unarc"][data-id="payments:'+py+'"]');await p.waitForTimeout(500);
st=await p.evaluate(async id=>({live:!!APP.get('payments',id),tomb:(await Store.tombs()).some(t=>t.k==='payments:'+id)}),py);
ok('ترجيع من الأرشيف: رجع، ونسخة الأرشيف ما اتمسحتش',st.live&&st.tomb,JSON.stringify(st));
await p.evaluate(()=>location.hash='#/archive');await p.waitForTimeout(300);
ok('الأرشيف ما بيعرضش اللي اترجع',!(await p.$('[data-act="unarc"][data-id="payments:'+py+'"]')));
// 4) الإعدادات: تغيير حقيقي بيتسجل، وعلامات النسخة الاحتياطية لوحدها لأ
const sh0=(await hist('settings','main')).length;
await p.evaluate(async()=>{const x=JSON.parse(JSON.stringify(APP.D.purchases[1]));x.notes=(x.notes||'')+' اختبار';await APP.upsert('purchases',x)});await p.waitForTimeout(200);
ok('تعديل عادي ما بيملاش سجل الإعدادات بعلامة changedSince',(await hist('settings','main')).length===sh0);
await p.evaluate(async()=>{const s=JSON.parse(JSON.stringify(APP.S()));s.usdRate=+s.usdRate+1;await APP.upsert('settings',s)});await p.waitForTimeout(200);
ok('تعديل سعر الدولار في الإعدادات اتسجل',(await hist('settings','main')).length===sh0+1);
await p.evaluate(()=>location.hash='#/settings');await p.waitForTimeout(200);ok('زرار «سجل التعديلات» في الإعدادات',await p.$('[data-go="#/hist/settings/main"]')!=null);
// 5) استرجاع من ملف: الحالي بيتأرشف وسجله بيتحفظ
const before=await p.evaluate(()=>Store.histCount());
await p.evaluate(()=>location.hash='#/backup');await p.setInputFiles('#restoreFile',R+'/test/scenario100.json');await p.waitForTimeout(1500);
const after=await p.evaluate(()=>Store.histCount());
ok('استرجاع من ملف: النسخ اللي اتغطت اتحفظت في السجل',after>before,before+' → '+after);
ok('استرجاع من ملف: الحسابات زي الأصل',(await calcSig())===sig0);
// 6) بعد إعادة التحميل السجل لسه موجود (IndexedDB)
await p.reload();await p.waitForFunction(()=>window.__ready);
ok('السجل باقي بعد إعادة فتح البرنامج',(await hist('purchases',pu.id)).length>=h0+3);
// 7) الكود: مفيش أي مسار مسح نهائي
const code={db:fs.readFileSync(R+'/db.js','utf8'),app:fs.readFileSync(R+'/app.js','utf8'),sync:fs.readFileSync(R+'/sync.js','utf8')};
ok('مفيش deleteDatabase أو clear() في الكود',!/deleteDatabase|\.clear\(/.test(code.db+code.app+code.sync));
ok('db.js: الحذف من rec بس جوه del (بعد الأرشيف والسجل)',(code.db.match(/x\.rec\.delete\(/g)||[]).length===2&&!/x\.(tomb|hist)\.delete\(/.test(code.db));
ok('untomb مبقاش بيمسح',/async untomb\(k\)\{return\}/.test(code.db));
ok('مفيش نوافذ متصفح',!NATIVE.length,NATIVE.join(','));
ok('مفيش أخطاء جافاسكريبت',!errs.length,errs.join(' | '));
await b.close();const f=res.filter(r=>!r.pass).length;console.log(`\n${res.length-f}/${res.length} PASS`);process.exit(f?1:0);
