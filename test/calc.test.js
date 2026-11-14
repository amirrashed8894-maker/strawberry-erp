const E=require('../core.js'),{build}=require('./scenario.js'),assert=require('assert');
const near=(a,b,m)=>assert.ok(Math.abs(a-b)<0.01,m+': '+a+' != '+b);
near(E.fcCalc(E.fcDefaults('x')).total,36431.541,'تقدير الفراولة من تكلفة المجمدات (15 ج للفرزة تقدير بس)');
// 1) فرزة مباع منها 1,500 كجم × 18 والباقي 500 كجم من غير سعر → مبدئي قبل خصم الباقي
let C=E.compute(build()),r=C.R.r1;
assert.equal(r.status,'noprice');assert.ok(r.farzWarn.includes('لسه ما اتحددش'));near(r.credit,27000,'خصم المباع فعليًا');near(r.farzUnsold,500,'فرزة باقية');
near(r.perTon,(591260-27000)/15,'الطن المبدئي');near(r.rows[0].perTon,(321100-15000)/(15000*10/18/1000),'مورد أ مبدئي');
near(r.cmp.aT,r.perTon,'المقارنة = الطن');near(C.SL.s2.profit,0,'ربح الفرزة صفر (منتج ثانوي)');
near(C.SL.s1.profit,550000-10000*(591260-27000)/15000-6000,'ربح فوسجا مبدئي');near(C.BAL['cus-fussga'].bal,150000,'رصيد فوسجا');near(C.BAL.sA.bal,-74400,'رصيد أ');
near(r.stockVal,5000*(591260-27000)/15000,'مخزون الفرزة الباقي بصفر لحد ما يتسعر');
// 2) سعر مؤقت 15 للباقي
let D=build();D.runs[0].farzTemp=15;C=E.compute(D);r=C.R.r1;assert.equal(r.status,'provisional');assert.ok(r.costLabel.includes('مؤقت 15.00'));near(r.perTon,(591260-27000-500*15)/15,'مبدئي بسعر مؤقت');
// 3) بيع الباقي 500 × 16 → نهائي (السعر المؤقت يتجاهل)
D.sales.push({id:'s3',no:3,date:'2026-11-13',kind:'farz',customerId:'fz',cur:'EGP',lines:[{runId:'r1',kg:500,price:16}],expenses:[{name:'نقل',amount:500}],createdAt:'z'});
C=E.compute(D);r=C.R.r1;assert.equal(r.status,'final');assert.equal(r.costLabel,'نهائي');near(r.credit,27000+8000-500,'صافي كل مبيعات الفرزة');near(r.perTon,(591260-34500)/15,'نهائي');
near(r.rows[0].perTon,(321100-34500*10/18)/(15000*10/18/1000),'أ نهائي');near(C.SL.s3.profit+C.SL.s2.profit,0,'مجموع ربح الفرزة صفر (كل بيع بمتوسط الصافي)');assert.equal(r.farzWarn,'');
// 4) التوزيع بالوزن مش محتاج سعر فرزة
D=build();D.settings[0].farzMethod='joint';C=E.compute(D);r=C.R.r1;assert.equal(r.status,'final');near(r.perTon,591260/17,'بالوزن');near(C.SL.s2.cogs,1500*591260/17000,'تكلفة الفرزة المباعة');
// 5) إنتاج متسجل لكل مورد
D=build();D.runs[0].yieldBySupplier=true;D.runs[0].inputs[0].cartons=850;D.runs[0].inputs[0].farzSacks=40;D.runs[0].inputs[1].cartons=650;D.runs[0].inputs[1].farzSacks=40;D.runs[0].farzTemp=15;
C=E.compute(D);r=C.R.r1;near(r.rows[0].fin,8500,'نهائي أ');near(r.rows[0].perTon,(321100-34500/2)/8.5,'أ بإنتاج فعلي');
// 6) نقل على التشغيلة
D=build();D.transports.push({id:'t2',no:2,date:'2026-11-11',transporterId:'tr',amount:1800,purchaseIds:[],runId:'r1',createdAt:'z'});C=E.compute(D);near(C.R.r1.shared,76860,'نقل مشترك');
// 7) البذور بتاريخ ثابت
assert.ok(E.seed().parties.every(p=>p.updatedAt===E.SEED_T));
assert.equal(E.parseDmy('٠٥/١١/٢٠٢٦'),'2026-11-05');assert.equal(E.parseDmy('31/02/2026'),null);assert.equal(E.dmy('2026-11-14'),'14/11/2026');

// 8) سيناريو 100 طن: core.js = الحساب المستقل (test/verify100.py)
{const {execSync}=require('child_process');require('fs').writeFileSync(__dirname+'/scenario100.json',JSON.stringify({app:'alrashed-strawberry-erp',version:'test-100t',exportedAt:'2026-11-14T09:00:00.000Z',data:require('./scenario100.js').build()},null,1));
 execSync('python3 '+__dirname+'/verify100.py');const V=JSON.parse(require('fs').readFileSync(__dirname+'/out/verify100.json','utf8'));
 const C=E.compute(require('./scenario100.js').build());let n=0;
 Object.entries(V.R).forEach(([id,v])=>{const r=C.R[id];['raw','fin','farz','waste','rawCost','trans','shared','total','credit','finCost','perTon'].forEach(f=>{near(r[f==='raw'?'rawKg':f],v[f],id+'.'+f);n++});assert.equal(r.status,v.status);
   Object.entries(v.bySup).forEach(([s,x])=>{near(r.rows.find(q=>q.supplierId===s).perTon,x,id+'.'+s);n++})});
 Object.entries(V.SL).forEach(([id,v])=>['rev','cogs','exp','profit'].forEach(f=>{near(C.SL[id][f],v[f],id+'.'+f);n++}));
 Object.entries(V.BAL).forEach(([id,v])=>{near(C.BAL[id].bal,v,'bal '+id);n++});
 const tot=Object.values(C.R).reduce((a,r)=>{a.raw+=r.rawKg;a.fin+=r.fin;a.fc+=r.finCost;return a},{raw:0,fin:0,fc:0});near(tot.raw,100000,'100 طن');near(tot.fin,70000,'70 طن صادر');near(tot.fc/tot.fin*1000,V.tot.perTon,'متوسط الطن');
 assert.equal(C.warns.length,0);console.log('100t scenario: '+n+' numbers match the independent calculation');}
// 9) المبلغ بالحروف
{global.window={addEventListener(){}};global.document={addEventListener(){},querySelector(){}};global.ERP=E;require('../report.js');const w=window.RPT.moneyWords;
 assert.equal(w(150000),'فقط مائة وخمسون ألف جنيه مصري لا غير');assert.equal(w(2000),'فقط ألفان جنيه مصري لا غير');assert.equal(w(1234567.89),'فقط مليون ومائتان وأربعة وثلاثون ألف وخمسمائة وسبعة وستون جنيه مصري وتسعة وثمانون قرش لا غير');assert.equal(w(0.5),'فقط خمسون قرش لا غير')}

/* v1.2.3: ميزان بالصافي — الفواتير القديمة (قائم/فارغ) بتتحول لصافي = القائم − الفارغ ونفس الأرقام بالظبط */
{const leg=JSON.parse(require('fs').readFileSync(__dirname+'/scenario100_legacy.json','utf8')).data,net=JSON.parse(require('fs').readFileSync(__dirname+'/scenario100.json','utf8')).data;
 const sig=C=>JSON.stringify([Object.values(C.P).map(x=>[x.net,x.payKg,x.amount,x.trans]),Object.values(C.R).map(r=>[r.perTon,r.finKgCost,r.stockVal]),Object.keys(C.L).sort().map(k=>C.L[k].reduce((a,e)=>a+e.dr-e.cr,0).toFixed(4))]);
 const before=sig(E.compute(leg));assert.equal(before,sig(E.compute(net)),'legacy gross/tare = net');
 const k=E.migrate(leg);assert.equal(k,12);assert.ok(leg.purchases.every(p=>!('gross' in p)&&!('tare' in p)&&p.net>0));assert.equal(sig(E.compute(leg)),before,'after migrate same');
 assert.equal(E.migrate(leg),0,'idempotent');assert.equal(E.pNet({gross:5000,tare:6000}),0);assert.equal(E.pNet({net:'7,500'}),7500);
 /* فاتورة الحاويات: طن × 1000 × سعر الكيلو */
 const d2=JSON.parse(JSON.stringify(net));d2.sales.push({id:'cx',no:99,date:'2026-11-14',kind:'export',cont:true,invNo:'FR27001',customerId:'cus-fussga',cur:'USD',rate:50,lines:[{runId:'r4',cont:'A1',bl:'B1',tons:1.5,price:1.2},{runId:'r4',cont:'A2',bl:'',tons:'0.25',price:'1.2'}],expenses:[{name:'نولون',amount:700,partyId:'T1'}]});
 const C2=E.compute(d2),x=C2.SL.cx;assert.ok(Math.abs(x.kg-1750)<1e-9&&Math.abs(x.amount-2100)<1e-9&&Math.abs(x.rev-105000)<1e-6&&x.nCont===2&&x.invNo==='FR27001');
 assert.ok(Math.abs(C2.R.r4.stockFin-(E.compute(net).R.r4.stockFin-1750))<1e-6);const e=C2.L['cus-fussga'].find(e=>e.ref==='cx');assert.equal(e.subs.length,2);assert.equal(C2.L.T1.filter(e=>e.ref==='cx'&&e.kind==='saleExp').length,1,'expense posted on container sale');assert.ok(Math.abs(x.exp-700)<1e-9);assert.ok(/A1 · بوليصة B1 · 1\.500 طن · سعر الكيلو \$1\.20 · القيمة \$1,800\.00/.test(e.subs[0].txt),e.subs[0].txt);
 assert.equal(E.contN(1),'حاوية واحدة');assert.equal(E.contN(2),'حاويتين');assert.equal(E.contN(3),'3 حاويات');assert.equal(E.contN(25),'25 حاوية');assert.equal(E.contN(103),'103 حاويات')}
/* v1.2.4: رصيد افتتاحي لأي حساب (مبلغ/له-عليه/تاريخ/عملة) + مخزون افتتاحي للمستلزمات (كمية/تكلفة/تاريخ لكل مخزن) */
{const base=JSON.parse(require('fs').readFileSync(__dirname+'/scenario100.json','utf8')).data;const C0=E.compute(base),n0=b=>+(b.parties.find(p=>p.id==='cus-fussga').open||0);
 const d=JSON.parse(JSON.stringify(base));const R1=d.parties.find(p=>p.id==='R1');Object.assign(R1,{open:12500,openSide:'c',openDate:'2026-10-31',openCur:'EGP'});
 const cu=d.parties.find(p=>p.id==='cus-fussga');Object.assign(cu,{open:1000,openSide:'d',openCur:'USD',openRate:50,openDate:''});
 const C1=E.compute(d);const o=C1.L.R1[0];assert.equal(o.kind,'open');assert.equal(o.date,'2026-10-31');assert.equal(o.cr,12500);assert.ok(o.info.includes('31/10/2026')&&o.info.includes('له'));
 near(C1.BAL.R1.bal,C0.BAL.R1.bal-12500,'opening credit');const oc=C1.L['cus-fussga'][0];assert.equal(oc.dr,50000);assert.ok(oc.info.includes('$1,000.00 × 50.00'));near(C1.BAL['cus-fussga'].bal,C0.BAL['cus-fussga'].bal-n0(base)+50000,'USD opening ×rate');
 assert.equal(E.compute(Object.assign({},d,{parties:d.parties.map(p=>p.id==='R1'?Object.assign({},p,{open:''}):p)})).L.R1.filter(e=>e.kind==='open').length,0,'empty opening → no row');
 /* المخزون الافتتاحي: بيزود الرصيد ويدخل المتوسط المرجح اللي بيتصرف بيه */
 const d3=JSON.parse(JSON.stringify(base));const it=d3.items.find(i=>i.id==='itm7');it.openStock=[{locId:'fac1',qty:100,cost:2,date:''},{locId:'fac2',qty:50,cost:5,date:'2026-11-01'}];
 d3.runs.find(r=>r.id==='r2').supplies.push({itemId:'itm7',qty:40,locId:'fac1'});const C3=E.compute(d3);const s=C3.SUP.itm7;
 assert.equal(s.loc.fac1,60);assert.equal(s.loc.fac2,50);assert.equal(s.openQty,150);near(s.openVal,450,'opening value');
 const iss=C3.issue.r2.find(l=>l&&l.itemId==='itm7');near(iss.avg,3,'avg includes both openings (100×2+50×5)/150');near(iss.cost,120,'issue cost');assert.ok(!iss.short);
 assert.ok(!C3.warns.some(w=>w.item==='itm7'),'no shortage with opening stock');
 const C4=E.compute(Object.assign({},d3,{items:d3.items.map(i=>i.id==='itm7'?Object.assign({},i,{openStock:[]}):i)}));assert.ok(C4.warns.some(w=>w.type==='issue'&&w.item==='itm7'),'without opening → shortage')}
console.log('calc tests OK');
