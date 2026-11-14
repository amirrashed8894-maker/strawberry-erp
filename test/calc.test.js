const E=require('../core.js'),{build}=require('./scenario.js'),assert=require('assert');
const near=(a,b,m)=>assert.ok(Math.abs(a-b)<0.01,m+': '+a+' != '+b);
let C=E.compute(build()),r=C.R.r1;
near(E.fcCalc(E.fcDefaults('x')).total,36431.541,'تقدير الفراولة من تكلفة المجمدات');
near(r.perTon,561260/15,'الطن الإجمالي');near(r.rows[0].perTon,36532,'مورد أ');near(r.rows[1].perTon,38524,'مورد ب');
near(r.cmp.aT,r.perTon,'المقارنة = الطن بطريقة الخصم');
near(C.SL.s1.profit,550000-10000*561260/15000-6000,'ربح فوسجا');near(C.SL.s2.profit,4500,'ربح الفرزة');
near(C.BAL['cus-fussga'].bal,150000,'رصيد فوسجا');near(C.BAL.sA.bal,-74400,'رصيد أ');near(C.BAL.sv.bal,-42000,'رصيد الخدمات');
// التوزيع بالوزن
let D=build();D.settings[0].farzMethod='joint';C=E.compute(D);r=C.R.r1;near(r.perTon,591260/17,'بالوزن');near(r.farzKgCost,591260/17000,'كيلو الفرزة بالوزن');near(C.SL.s2.cogs,1500*591260/17000,'تكلفة الفرزة المباعة');
// الإنتاج متسجل لكل مورد
D=build();Object.assign(D.runs[0],{yieldBySupplier:true});D.runs[0].inputs[0].cartons=850;D.runs[0].inputs[0].farzSacks=40;D.runs[0].inputs[1].cartons=650;D.runs[0].inputs[1].farzSacks=40;
C=E.compute(D);r=C.R.r1;near(r.fin,15000,'إجمالي النهائي');near(r.rows[0].fin,8500,'نهائي أ');
near(r.rows[0].perTon,(321100-1000*15)/8.5,'أ بإنتاج فعلي');near(r.rows[1].perTon,(270160-1000*15)/6.5,'ب بإنتاج فعلي');
// نقل على التشغيلة بس
D=build();D.transports.push({id:'t2',no:2,date:'2026-11-11',transporterId:'tr',amount:1800,purchaseIds:[],runId:'r1',createdAt:'z'});C=E.compute(D);r=C.R.r1;near(r.shared,75060+1800,'نقل مشترك');near(r.rows[0].shared,(75060+1800)*10/18,'نصيب أ');
// تواريخ
assert.equal(E.parseDmy('٠٥/١١/٢٠٢٦'),'2026-11-05');assert.equal(E.parseDmy('31/02/2026'),null);assert.equal(E.dmy('2026-11-14'),'14/11/2026');
console.log('calc tests OK');
