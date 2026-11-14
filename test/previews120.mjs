// معاينات v1.2.0 من سيناريو 100 طن (بروفايل مؤقت، مفيش سحابة) → PDF + JPEG
import { chromium } from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.mjs';
import fs from 'fs';
const BASE=process.env.BASE||'http://127.0.0.1:8811/';const OUT='/workspace/strawberry_erp/previews/v120/pdf';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,locale:'ar-EG',timezoneId:'Africa/Cairo'});
await ctx.route(/supabase\.co/,r=>r.abort());
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>d.accept());
await p.goto(BASE);await p.waitForFunction(()=>window.__ready);
await p.evaluate(()=>location.hash='#/backup');await p.waitForTimeout(200);
await p.setInputFiles('#restoreFile','/workspace/strawberry_erp/test/scenario100.json');await p.waitForFunction(()=>APP.D.runs.length===4);
await p.waitForFunction(()=>window.jspdf&&window.html2canvas);
const pdf=async(kind,o,nm)=>{const r=await p.evaluate(async([kind,o])=>{await RPT.open(kind,o);const pdf=await RPT.makePdf();const n=document.querySelectorAll('#pages .rp').length;RPT.close();
  const buf=pdf.output('arraybuffer');let s='';const u=new Uint8Array(buf);for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return {b64:btoa(s),n}},[kind,o]);
  fs.writeFileSync(OUT+'/'+nm+'.pdf',Buffer.from(r.b64,'base64'));console.log(nm,r.n,'pages');return r.n};
const L=JSON.parse(process.env.LIST||'null')||[['stmt',{id:'R1'},'supplier_statement_R1'],['stmt',{id:'cus-fussga'},'customer_statement_fussga'],['profitSum',{},'profitability_summary'],['profitDet',{},'profitability_detailed'],['run',{id:'r3'},'run_cost_run3'],['cmp',{id:'r3'},'estimate_vs_actual_run3'],['stock',{},'stock'],['stmt',{id:'cus-fussga',from:'2026-11-09',to:'2026-11-12'},'customer_statement_fussga_period']];
for(const [k,o,nm] of L)await pdf(k,o,nm);
if(process.env.ALL){const ps=await p.evaluate(()=>APP.D.parties.map(x=>[x.id,x.type]));for(const [id,t] of ps)await pdf('stmt',{id},'stmt_'+t+'_'+id)}
console.log('errors',errs);await b.close();
