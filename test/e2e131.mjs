// v1.3.1: تكلفة الحاوية / الفاتورة — تفصيلي + الربحية المفصلة الجديدة. بروفايل مؤقت، السحابة مقفولة، بيانات تجريبية (scenario130) — مفيش كتابة على مساحة العمل الحقيقية
// VIEW=desktop|mobile ، BASE=https://strawberry-erp.onrender.com/ للتجربة على الموقع الحي
import { chromium } from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.mjs';
import fs from 'fs';import {execSync} from 'child_process';
const MOB=process.env.VIEW!=='desktop',BASE=process.env.BASE||'http://127.0.0.1:8811/';
const OUT='/workspace/strawberry_erp/test/out131_'+(MOB?'mobile':'desktop')+(process.env.BASE?'_live':'');fs.mkdirSync(OUT,{recursive:true});
execSync('node /workspace/strawberry_erp/test/scenario130.js >/dev/null');
const res=[];const ok=(n,c,i='')=>{res.push({n,pass:!!c,i});console.log((c?'PASS ':'FAIL ')+n+(i?' — '+String(i).slice(0,300):''))};
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await b.newContext(MOB?{viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,locale:'ar-EG',timezoneId:'Africa/Cairo'}:{viewport:{width:1280,height:900},deviceScaleFactor:2,locale:'ar-EG',timezoneId:'Africa/Cairo'});
await ctx.route(/supabase\.co/,r=>r.abort());
const NATIVE=[];const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>{NATIVE.push(d.type()+': '+d.message());d.dismiss()});
await p.addInitScript({path:'/workspace/strawberry_erp/test/dlghook.js'});
await p.goto(BASE);await p.waitForFunction(()=>window.__ready,null,{timeout:60000});
ok('مش مربوط بالسحابة (بروفايل مؤقت)',await p.evaluate(()=>!SYNC.state.enabled));
const ver=await p.evaluate(()=>APP.VER);ok('النسخة 1.3.1',ver==='1.3.1',ver);
await p.evaluate(()=>location.hash='#/backup');await p.setInputFiles('#restoreFile','/workspace/strawberry_erp/test/scenario130.json');
await p.waitForFunction(()=>APP.D.runs.length===4&&APP.D.sales.filter(s=>s.cont).length===4,null,{timeout:10000});await p.waitForTimeout(300);
const near=(a,b,t=0.01)=>Math.abs(a-b)<=t;
// الأرقام: الأقسام = إجمالي الحاوية، التشغيلات = تفصيل البنود، والربحية الجديدة = القديمة
const R=await p.evaluate(()=>{const D=APP.D,C=APP.C,sh=ERP.contSheets(D,C,{});
  return{sh:sh.map(z=>{const S=RPT.sheetSecs(z);return{c:z.contNo,key:RPT.contKey(z),inv:RPT.invKey(z),total:z.total,S:{runsT:S.runsT,prodT:S.prodT,total:S.total,loadIT:S.loadIT,loadST:S.loadST,expT:S.expT},cogs:z.cogs,load:z.load,exp:z.exp,profit:z.profit,
    runRows:S.runs.map(r=>[r.name,r.qty,r.price,r.value]),loadS:S.loadS.map(c=>c.name),exps:S.exps.map(c=>c.name)}}),
    sl:Object.values(C.SL).reduce((a,x)=>({rev:a.rev+x.rev,profit:a.profit+x.profit,cost:a.cost+x.cogs+x.exp+x.load}),{rev:0,profit:0,cost:0})}});
fs.writeFileSync(OUT+'/numbers.json',JSON.stringify(R,null,1));
R.sh.forEach(z=>{ok('حاوية '+z.c+': مجموع الأقسام = إجمالي التكلفة',near(z.S.total,z.total),z.S.total+' vs '+z.total);ok('حاوية '+z.c+': التشغيلات (FIFO) = تفصيل البنود = التكلفة المخصصة',near(z.S.runsT,z.S.prodT,0.05)&&near(z.S.prodT,z.cogs,0.05),JSON.stringify(z.S)+' cogs '+z.cogs);
  ok('حاوية '+z.c+': تحميل + عمولات = تكلفة التحميل، والمصروفات = نصيبها',near(z.S.loadIT+z.S.loadST,z.load)&&near(z.S.expT,z.exp))});
const c5=R.sh.find(z=>z.c==='CMAU5234569');ok('حاوية من تشغيلتين (FIFO): سطرين 3,800 + 12,000 كجم',c5.runRows.length===2&&near(c5.runRows[0][1],3800)&&near(c5.runRows[1][1],12000),JSON.stringify(c5.runRows));
ok('العمولات والأوراق والإكراميات قسم لوحده',R.sh[0].loadS.length===3,R.sh[0].loadS.join('،'));
// الشاشة: اختيار حاوية وفاتورة
await p.evaluate(()=>location.hash='#/costs');await p.waitForTimeout(300);await p.click('.seg [data-v="cont"]');await p.waitForTimeout(300);
const opts=await p.$$eval('#costSel option',os=>os.map(o=>[o.value,o.textContent]));
ok('قايمة الاختيار: فاتورة TEST-EXP-02 كلها + كل حاوية (6 اختيارات)',opts.length===6&&opts.some(o=>o[0]==='i:TEST-EXP-02'),JSON.stringify(opts));
await p.selectOption('#costSel','c:s2:0');await p.waitForTimeout(300);
let scr=await p.evaluate(()=>({n:document.querySelectorAll('section.csh').length,txt:document.querySelector('#main').innerText,ovf:document.documentElement.scrollWidth<=window.innerWidth+1}));
ok('اختيار حاوية MSKU1234565: ورقة واحدة بالأقسام',scr.n===1&&scr.txt.includes('MSKU1234565')&&['ملخص التكلفة','الفراولة من التشغيلات','تفصيل تكلفة الإنتاج','بنود التحميل','عمولات وأوراق','مصروفات البيع'].every(t=>scr.txt.includes(t)),scr.n);
ok('الشاشة: ✓ ومفيش ⚠ فرق',scr.txt.includes('✓ مجموع الأقسام')&&!scr.txt.includes('⚠ فرق'));
ok('مفيش سكرول أفقي',scr.ovf);
const tot1=await p.evaluate(()=>[...document.querySelectorAll('section.csh .kpi b')][0].innerText);ok('إجمالي التكلفة على الشاشة = الحساب',tot1.replace(/[^\d]/g,'')===String(Math.round(R.sh[0].total)),tot1+' '+R.sh[0].total);
await p.evaluate(()=>{const b=document.querySelector('#bnr');if(b)b.style.display='none';document.querySelector('#nav').style.display='none'});
await (await p.$('section.csh')).screenshot({path:OUT+'/screen_container.png'});
await p.selectOption('#costSel','i:TEST-EXP-02');await p.waitForTimeout(300);
scr=await p.evaluate(()=>({n:document.querySelectorAll('section.csh').length,txt:document.querySelector('#main').innerText,ovf:document.documentElement.scrollWidth<=window.innerWidth+1}));
ok('اختيار فاتورة TEST-EXP-02: إجمالي الفاتورة + ورقة لكل حاوية (2)',scr.n===3&&scr.txt.includes('إجمالي الفاتورة')&&scr.txt.includes('MSKU2234566')&&scr.txt.includes('MSKU3234567'),scr.n);
ok('مفيش سكرول أفقي (فاتورة)',scr.ovf);
await p.screenshot({path:OUT+'/screen_invoice_full.png',fullPage:true});
await p.evaluate(()=>{document.querySelector('#nav').style.display=''});
// PDF حاوية وفاتورة
const pdfInfo=async(name)=>{await p.waitForFunction(()=>window.__repReady>0,null,{timeout:30000});await p.waitForTimeout(200);
  const pg=await p.evaluate(()=>({n:document.querySelectorAll('#pages .pw .rp').length,bg:document.querySelectorAll('#pages .pw .rp img.bg').length,txt:[...document.querySelectorAll('#pages .pw')].map(e=>e.textContent).join('\n'),
    maxCols:Math.max(0,...[...document.querySelectorAll('#pages .pw thead tr')].map(r=>r.children.length)),flow:document.querySelector('#rep').classList.contains('flow'),
    cont:[...document.querySelectorAll('#pages .pw h3')].map(h=>h.textContent).filter(t=>t.includes('(تابع)')),title:document.querySelector('#pages .pw h1').textContent}));
  const pdf=await p.evaluate(async()=>{const d=await RPT.makePdf();return d.output('datauristring')});fs.writeFileSync(OUT+'/'+name+'.pdf',Buffer.from(pdf.split(',')[1],'base64'));
  const np=+execSync(`pdfinfo ${OUT}/${name}.pdf | awk '/Pages/{print $2}'`).toString().trim();return Object.assign(pg,{np})};
await p.evaluate(()=>RPT.open('contCost',{id:'c:s7:0'}));let pg=await pdfInfo('container_CMAU5234569');
ok('PDF حاوية: على ورق الراشد وصفحات PDF = صفحات العرض',pg.n>=1&&pg.bg===pg.n&&pg.np===pg.n,pg.n+' / pdf '+pg.np);
ok('PDF حاوية: يعتمد شركة الراشد، التشغيلتين، والأقسام، ومفيش ⚠',pg.txt.includes('يعتمد: شركة الراشد للتجارة')&&pg.txt.includes('تشغيلة #3')&&pg.txt.includes('تشغيلة #4')&&pg.txt.includes('بنود التحميل')&&!pg.txt.includes('⚠ فرق'),pg.title);
ok('PDF حاوية: أقصى أعمدة ≤ 5',pg.maxCols<=5,pg.maxCols);ok('PDF حاوية: '+pg.n+' صفحة (≤ 3)',pg.n<=3,pg.cont.join('|'));
ok('الموبايل بيفتح «قراءة» والديسكتوب A4',pg.flow===MOB,pg.flow);
if(MOB){const fsz=await p.$eval('.rpf table.cc td',e=>parseFloat(getComputedStyle(e).fontSize));ok('عرض القراءة: خط ≥ 13px',fsz>=13,fsz);
  const ov=await p.evaluate(()=>{const r=document.querySelector('.rpf');return r.scrollWidth<=r.clientWidth+2});ok('عرض القراءة: مفيش سكرول أفقي لجداول الحاوية',ov);
  await p.evaluate(()=>{document.querySelector('#rep').scrollTop=0});await p.screenshot({path:OUT+'/report_flow.png'});
  await p.click('#rMode');await p.waitForTimeout(200);ok('زرار شكل A4',await p.evaluate(()=>!document.querySelector('#rep').classList.contains('flow')&&getComputedStyle(document.querySelector('.pw')).display!=='none'));await p.click('#rMode')}
// معاينة الطباعة (print to PDF من كروم)
const prn=await p.pdf({format:'A4',printBackground:true,preferCSSPageSize:true});fs.writeFileSync(OUT+'/print_container.pdf',prn);
const npr=+execSync(`pdfinfo ${OUT}/print_container.pdf | awk '/Pages/{print $2}'`).toString().trim();ok('معاينة الطباعة: نفس عدد الصفحات A4',npr===pg.n,npr+' vs '+pg.n);
await p.click('#rClose');
await p.evaluate(()=>RPT.open('contCost',{id:'i:TEST-EXP-02'}));pg=await pdfInfo('invoice_TEST-EXP-02');
ok('PDF فاتورة بحاويتين: ملخص الفاتورة + ورقتين',pg.txt.includes('حاويات الفاتورة')&&pg.txt.includes('MSKU2234566')&&pg.txt.includes('MSKU3234567')&&(pg.txt.match(/ملخص تكلفة الحاوية/g)||[]).length===2,pg.n+' صفحة');
ok('PDF فاتورة: مفيش ⚠ فرق وأعمدة ≤ 5',!pg.txt.includes('⚠ فرق')&&pg.maxCols<=5,pg.maxCols);
await p.click('#rClose');
// الربحية المفصلة: الكل وفاتورة
await p.evaluate(()=>RPT.open('profitDet',{id:'all'}));pg=await pdfInfo('profit_detailed_all');
ok('المفصل (الكل): مفيش جدول أكتر من 7 أعمدة (كان 10)',pg.maxCols<=7,pg.maxCols);
ok('المفصل: مفيش سطور التحميل المحشورة',!pg.txt.includes('تكلفة التحميل —'),'');
const pr=await p.evaluate(()=>{const tt=[...document.querySelectorAll('#pages .pw table.pd2 tr.tt')].pop();return tt?[...tt.children].map(c=>c.textContent):[]});
ok('المفصل: الإجمالي = ربحية كل المبيعات (الإيراد والتكلفة والربح)',pr.length&&+pr[2].replace(/,/g,'')===Math.round(R.sl.rev)&&+pr[3].replace(/,/g,'')===Math.round(R.sl.cost)&&+pr[4].replace(/,/g,'')===Math.round(R.sl.profit),pr.join(' | ')+' vs '+JSON.stringify(R.sl));
ok('المفصل: ملخص لكل تشغيلة وورقة لكل حاوية (5)',pg.txt.includes('ملخص لكل تشغيلة')&&(pg.txt.match(/ملخص تكلفة الحاوية/g)||[]).length===5,pg.n+' صفحة');
await p.click('#rClose');
await p.evaluate(()=>RPT.open('profitDet',{id:'i:TEST-EXP-02'}));pg=await pdfInfo('profit_detailed_TEST-EXP-02');
const s4=await p.evaluate(()=>{const x=APP.C.SL.s4;return{rev:x.rev,profit:x.profit}});
const pr2=await p.evaluate(()=>{const tt=[...document.querySelectorAll('#pages .pw table.pd2 tr.tt')].pop();return [...tt.children].map(c=>c.textContent)});
ok('المفصل لفاتورة TEST-EXP-02: الإجمالي = ربح الفاتورة',+pr2[2].replace(/,/g,'')===Math.round(s4.rev)&&+pr2[4].replace(/,/g,'')===Math.round(s4.profit),pr2.join('|')+' '+JSON.stringify(s4));
ok('المفصل لفاتورة: فيه الحاويتين بس',pg.txt.includes('MSKU2234566')&&pg.txt.includes('MSKU3234567')&&!pg.txt.includes('MSKU1234565'),pg.title);
await p.click('#rClose');
// التقارير: الاختيار موجود
await p.evaluate(()=>location.hash='#/reports');await p.waitForTimeout(250);
ok('شاشة التقارير: اختيار الحاوية/الفاتورة للمفصل',(await p.$$eval('#repSel option',o=>o.length))===7);
ok('مفيش نوافذ متصفح',NATIVE.length===0,NATIVE.join(' | '));ok('مفيش أخطاء جافاسكريبت',errs.length===0,errs.join(' | '));
ok('لسه مش مربوط بالسحابة',await p.evaluate(()=>!SYNC.state.enabled));
const pass=res.filter(r=>r.pass).length;console.log(`\n${pass}/${res.length} passed`);fs.writeFileSync(OUT+'/results.json',JSON.stringify(res,null,1));
await b.close();process.exit(pass===res.length?0:1);
