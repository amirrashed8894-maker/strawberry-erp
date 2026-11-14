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
console.log('calc tests OK');
