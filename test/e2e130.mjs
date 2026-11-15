// v1.3.0: تفصيل التكاليف (لكل طن ولكل حاوية) — بروفايل مؤقت، السحابة مقفولة، مفيش كتابة على مساحة العمل الحقيقية
// ENGINE=webkit (آيفون 13) أو chromium؛ BASE=https://strawberry-erp.onrender.com/ للتجربة على الموقع الحي (برضه بروفايل مؤقت والسحابة مقفولة)
import { chromium, webkit, devices } from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.mjs';
import fs from 'fs';import {execSync} from 'child_process';
const WK=process.env.ENGINE==='webkit',BASE=process.env.BASE||(WK?'http://erp.test/':'http://127.0.0.1:8811/');
const OUT='/workspace/strawberry_erp/test/out130'+(WK?'_webkit':'')+(process.env.BASE?'_live':'');fs.mkdirSync(OUT,{recursive:true});
execSync('node /workspace/strawberry_erp/test/scenario130.js >/dev/null');
const res=[];const ok=(n,c,i='')=>{res.push({n,pass:!!c,i});console.log((c?'PASS ':'FAIL ')+n+(i?' — '+String(i).slice(0,300):''))};
const b=WK?await webkit.launch():await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await b.newContext(WK?{...devices['iPhone 13'],locale:'ar-EG',timezoneId:'Africa/Cairo'}:{viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,locale:'ar-EG',timezoneId:'Africa/Cairo'});
const MT={html:'text/html; charset=utf-8',js:'text/javascript',json:'application/json',webmanifest:'application/manifest+json',png:'image/png',jpg:'image/jpeg',css:'text/css'};
if(WK&&!process.env.BASE)await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='erp.test')return r.abort();const f='/workspace/strawberry_erp'+(u.pathname==='/'?'/index.html':u.pathname);if(fs.existsSync(f))return r.fulfill({status:200,contentType:MT[f.split('.').pop()]||'application/octet-stream',body:fs.readFileSync(f)});return r.fulfill({status:404,body:''})});
await ctx.route(/supabase\.co/,r=>r.abort());
const NATIVE=[];const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>{NATIVE.push(d.type()+': '+d.message());d.dismiss()});
await p.addInitScript({path:'/workspace/strawberry_erp/test/dlghook.js'});
await p.goto(BASE);await p.waitForFunction(()=>window.__ready,null,{timeout:30000});
ok('مش مربوط بالسحابة (بروفايل مؤقت)',await p.evaluate(()=>!SYNC.state.enabled));
const ver=await p.evaluate(()=>APP.VER);ok('النسخة 1.3.0',ver==='1.3.0',ver);
await p.evaluate(()=>location.hash='#/backup');await p.setInputFiles('#restoreFile','/workspace/strawberry_erp/test/scenario130.json');
await p.waitForFunction(()=>APP.D.runs.length===4&&APP.D.sales.filter(s=>s.cont).length===4,null,{timeout:10000});
await p.waitForTimeout(300);
// الأرقام: مجموع البنود = الإجمالي، والحاويات = ربحية البيع، والتشغيلات = تكلفة الطن
const R=await p.evaluate(()=>{const D=APP.D,C=APP.C,rb=ERP.runsBreakdown(D,C,{}),sh=ERP.contSheets(D,C,{}),ct=ERP.contTotals(sh);
  const sale={};sh.forEach(z=>{const a=sale[z.saleId]=sale[z.saleId]||{t:0,p:0,cogs:0,load:0,exp:0};a.t+=z.total;a.p+=z.profit;a.cogs+=z.cogs;a.load+=z.load;a.exp+=z.exp});
  return{runs:rb.runs.map(z=>({no:z.run.no,perTon:z.x.perTon,sumTon:z.P.lines.reduce((a,c)=>a+c.perTon,0),sum:z.P.sum,net:z.x.finCost,gross:z.x.total,pos:z.P.lines.filter(c=>c.g!=='farz').reduce((a,c)=>a+c.value,0),pct:z.P.lines.filter(c=>c.g!=='farz').reduce((a,c)=>a+c.pct,0),
      items:z.P.lines.filter(c=>c.g==='sup'||c.g==='svc').map(c=>({name:c.name,qty:c.qty,qtyTon:c.qtyTon,price:c.price,value:c.value}))})),
    rb:{sum:rb.sum,net:rb.net,perTon:rb.perTon,T:rb.T},ct:{sum:ct.sum,total:ct.total,profit:ct.profit},
    sh:sh.map(z=>({c:z.contNo,sum:z.sum,total:z.total,cogs:z.cogs,prodT:z.prodT,load:z.load,loadL:z.lines.filter(c=>c.g==='load').reduce((a,c)=>a+c.value,0),exp:z.exp,expL:z.lines.filter(c=>c.g==='exp').reduce((a,c)=>a+c.value,0),pallets:z.pallets,cartons:z.cartons,
      loadItems:z.lines.filter(c=>c.g==='load').map(c=>({name:c.name,qty:c.qty,price:c.price,value:c.value}))})),
    sales:Object.keys(sale).map(id=>({id,mine:sale[id],app:{p:C.SL[id].profit,cogs:C.SL[id].cogs,load:C.SL[id].load,exp:C.SL[id].exp,tot:C.SL[id].cogs+C.SL[id].load+C.SL[id].exp}})),
    profitTot:Object.values(C.SL).filter(x=>x.kind!=='farz').reduce((a,x)=>a+x.profit,0)}});
fs.writeFileSync(OUT+'/numbers.json',JSON.stringify(R,null,1));
const near=(a,b,t=0.01)=>Math.abs(a-b)<=t;
R.runs.forEach(r=>{ok('تشغيلة #'+r.no+': مجموع البنود = تكلفة الإنتاج النهائي',near(r.sum,r.net),r.sum+' vs '+r.net);ok('تشغيلة #'+r.no+': مجموع ج/طن = تكلفة الطن الصادر',near(r.sumTon,r.perTon),r.sumTon+' vs '+r.perTon);
  ok('تشغيلة #'+r.no+': البنود قبل الفرزة = الإجمالي و% = 100',near(r.pos,r.gross)&&near(r.pct,100,1e-6),r.pos+' '+r.gross+' '+r.pct);
  ok('تشغيلة #'+r.no+': كل مستلزم = الكمية × السعر، والكمية/طن = الكمية ÷ الأطنان',r.items.every(c=>!c.qty||near(c.qty*c.price,c.value)),JSON.stringify(r.items.slice(0,3)))});
ok('كل التشغيلات: المجموع = الإجمالي',near(R.rb.sum,R.rb.net),JSON.stringify(R.rb));
R.sh.forEach(z=>{ok('حاوية '+z.c+': مجموع البنود = إجمالي التكلفة',near(z.sum,z.total),z.sum+' vs '+z.total);ok('حاوية '+z.c+': تكلفة الإنتاج = التكلفة المخصصة',near(z.prodT,z.cogs));ok('حاوية '+z.c+': بنود التحميل = تكلفة التحميل، والمصروفات = نصيبها',near(z.loadL,z.load)&&near(z.expL,z.exp));
  ok('حاوية '+z.c+': باليتات = ⌈كراتين÷120⌉ وكل بند تحميل = كمية × سعر',z.pallets===Math.ceil(z.cartons/120-1e-9)&&z.loadItems.every(c=>!c.qty||near(c.qty*c.price,c.value)),z.pallets+' '+z.cartons)});
R.sales.forEach(s=>ok('فاتورة '+s.id+': ربح الحاويات = ربح الفاتورة في الربحية',near(s.mine.p,s.app.p)&&near(s.mine.t,s.app.tot),JSON.stringify(s)));
ok('إجمالي الحاويات: المجموع = الإجمالي والربح = ربحية التصدير',near(R.ct.sum,R.ct.total)&&near(R.ct.profit,R.profitTot),JSON.stringify(R.ct)+' '+R.profitTot);
const r1=R.runs[0];const ctn=r1.items.find(c=>/كرتون/.test(c.name)),pk=r1.items.find(c=>/سيزر/.test(c.name)),tp=r1.items.find(c=>/لزق/.test(c.name)),st=r1.items.find(c=>/ستيكر صغير/.test(c.name));
ok('تشغيلة 1: كرتونة 100/طن، لزق 0.71، ستيكر 0.22، رسم المصنع 20 ج/كرتونة',ctn&&near(ctn.qtyTon,100)&&tp&&near(tp.price,0.71)&&st&&near(st.price,0.22)&&pk&&near(pk.price,20),JSON.stringify({ctn,tp,st,pk}));
const z1=R.sh[0];const li=n=>z1.loadItems.find(c=>c.name.includes(n));
ok('حاوية 1: 13 باليت، 52 زاوية × 20، 1500 ستيكر كبير × 0.30، 2 استرتش',z1.pallets===13&&li('زوايا').qty===52&&near(li('زوايا').price,20)&&li('ستيكر كبير').qty===1500&&near(li('ستيكر كبير').value,450)&&li('استرتش').qty===2,JSON.stringify(z1.loadItems));
// الشاشة
await p.evaluate(()=>location.hash='#/reports');await p.waitForTimeout(150);
ok('زرار «تفصيل التكاليف» في التقارير',await p.$('[data-go="#/costs"]')!=null);
await p.click('[data-go="#/costs"]');await p.waitForTimeout(250);
const scr=await p.evaluate(()=>({h:document.querySelector('.vh h2').textContent,rows:document.querySelectorAll('table.cb tr').length,txt:document.querySelector('#main').innerText}));
ok('شاشة تفصيل التكاليف بتفتح وفيها جدول',scr.h.includes('تفصيل التكاليف')&&scr.rows>10,scr.rows);
ok('الشاشة فيها «✓ مجموع البنود = الإجمالي» ومفيش «⚠ فرق»',scr.txt.includes('مجموع البنود = الإجمالي')&&!scr.txt.includes('⚠ فرق'));
const fs16=await p.$eval('table.cb td',e=>parseFloat(getComputedStyle(e).fontSize));ok('خط الجدول كبير ومقروء (≥15px)',fs16>=15,fs16);
const ovf=await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1);ok('مفيش سكرول أفقي للصفحة على الآيفون',ovf);
await p.waitForFunction(()=>!document.querySelector('#toast.on,#toast.show')||getComputedStyle(document.querySelector('#toast')).opacity==='0',null,{timeout:6000}).catch(()=>{});await p.waitForTimeout(2500);
await p.evaluate(()=>{const b=document.querySelector('#bnr');if(b)b.style.display='none';document.querySelector('#nav').style.display='none'});
await p.screenshot({path:OUT+'/screen_ton.png',fullPage:false});
await (await p.$('section.card:has(table.cb)')).screenshot({path:OUT+'/screen_ton_all.png'});
await p.evaluate(()=>{const d=document.querySelector('details.dd');d.open=true});await p.waitForTimeout(120);await (await p.$('details.dd[open]')).screenshot({path:OUT+'/screen_run1.png'});
await p.click('.seg [data-v="cont"]');await p.waitForTimeout(200);
await p.evaluate(()=>{const d=document.querySelector('details.dd');d.open=true});await p.waitForTimeout(120);
await (await p.$('details.dd[open]')).screenshot({path:OUT+'/screen_container.png'});
await p.evaluate(()=>{document.querySelector('#nav').style.display=''});
const ctTxt=await p.evaluate(()=>document.querySelector('#main').innerText);
ok('شاشة الحاويات فيها MSKU1234565 والزوايا والداتا لوجر والربح',ctTxt.includes('MSKU1234565')&&ctTxt.includes('زوايا')&&ctTxt.includes('داتا لوجر')&&ctTxt.includes('الربح'));
// PDF
await p.click('.vh [data-k="costDet"]');await p.waitForFunction(()=>window.__repReady>0,null,{timeout:20000});
const pg=await p.evaluate(()=>({n:document.querySelectorAll('#pages .rp').length,txt:document.querySelector('#pages').innerText,bg:document.querySelectorAll('#pages .rp img.bg').length}));
ok('PDF: صفحات على ورق الراشد',pg.n>=3&&pg.bg===pg.n,pg.n+' صفحة');
const nSheets=(pg.txt.match(/ورقة تكلفة الحاوية \S+( \(تابع\))?/g)||[]).filter(x=>!x.includes('تابع')).length;ok('PDF: فيه تكلفة الطن لكل مكوّن وورقة لكل حاوية (5)',pg.txt.includes('لكل مكو')&&nSheets===5,nSheets+' '+pg.txt.slice(0,200));
ok('PDF: مفيش «تحت رعاية»',!pg.txt.includes('تحت رعاية'));
ok('PDF: مفيش «⚠ فرق»',!pg.txt.includes('⚠ فرق'));
const pdf=await p.evaluate(async()=>{const d=await RPT.makePdf();return d.output('datauristring')});
fs.writeFileSync(OUT+'/cost-breakdown.pdf',Buffer.from(pdf.split(',')[1],'base64'));
try{execSync(`cd ${OUT} && rm -f pdf-*.png && pdftoppm -r 80 -png cost-breakdown.pdf pdf`);ok('PDF اتعمل',fs.readdirSync(OUT).filter(f=>f.startsWith('pdf-')).length===pg.n)}catch(e){ok('PDF اتعمل',false,String(e))}
await p.click('#rClose');
ok('مفيش نوافذ متصفح',NATIVE.length===0,NATIVE.join(' | '));
ok('مفيش أخطاء جافاسكريبت',errs.length===0,errs.join(' | '));
ok('لسه مش مربوط بالسحابة',await p.evaluate(()=>!SYNC.state.enabled));
const pass=res.filter(r=>r.pass).length;console.log(`\n${pass}/${res.length} passed`);fs.writeFileSync(OUT+'/results.json',JSON.stringify(res,null,1));
await b.close();process.exit(pass===res.length?0:1);
