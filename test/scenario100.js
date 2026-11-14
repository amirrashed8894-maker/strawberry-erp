// سيناريو 100 طن خام — بيانات تجريبية بالكامل (كل الأسماء «تجريبي») — للاختبار فقط، مش بيتكتب في أي مساحة عمل حقيقية
const E=require('../core.js');
function build(){const D=E.seed();const t0=Date.parse('2026-11-01T06:00:00.000Z');let k=0;const T=()=>new Date(t0+(k++)*60000).toISOString();
 const P=o=>Object.assign({createdAt:T(),updatedAt:T()},o);
 const fussga=D.parties.find(p=>p.id==='cus-fussga');fussga.open=50000;fussga.openSide='d';
 D.parties.push(
  P({id:'R1',type:'raw',name:'تجريبي مورد خام — الحاج سعيد',disc:2,phone:'01000000001'}),
  P({id:'R2',type:'raw',name:'تجريبي مورد خام — مزرعة النوبارية',disc:3}),
  P({id:'R3',type:'raw',name:'تجريبي مورد خام — الإسماعيلية',disc:1.5,open:20000,openSide:'c'}),
  P({id:'R4',type:'raw',name:'تجريبي مورد خام — البحيرة',disc:2.5}),
  P({id:'R5',type:'raw',name:'تجريبي مورد خام — المنوفية',disc:0}),
  P({id:'T1',type:'transport',name:'تجريبي نقل — المصري'}),P({id:'T2',type:'transport',name:'تجريبي نقل — النجار'}),
  P({id:'SP1',type:'supply',name:'تجريبي مستلزمات — الكرتون'}),P({id:'SP2',type:'supply',name:'تجريبي مستلزمات — البلاستيك'}),
  P({id:'SV1',type:'service',name:'تجريبي خدمات — الثلاجة العربية'}),P({id:'SV2',type:'service',name:'تجريبي خدمات — الحسن'}),
  P({id:'EX2',type:'export',name:'تجريبي عميل تصدير — جلف فريش',nameEn:'TEST GULF FRESH'}),
  P({id:'FZ1',type:'farz',name:'تجريبي عميل فرزة — مصنع العصائر'}),P({id:'FZ2',type:'farz',name:'تجريبي عميل فرزة — مربى الدلتا'}));
 // 12 عربية بسكول = 100,000 كجم صافي
 const TR=[[1,'2026-11-01','R1',14200,5200,2,28,'fac1',360],[2,'2026-11-01','R2',13600,5100,3,27,'fac1',340],[3,'2026-11-02','R3',12300,4800,1.5,29,'fac1',300],
  [4,'2026-11-02','R1',15500,5500,2,28,'fac1',400],[5,'2026-11-03','R4',13000,5000,2.5,26.5,'fac1',320],[6,'2026-11-03','R5',14800,5300,0,30,'fac2',380],
  [7,'2026-11-04','R2',11900,4900,3,27,'fac2',280],[8,'2026-11-04','R3',13700,5200,1.5,29,'fac2',340],[9,'2026-11-04','R4',14100,5100,3,26.5,'fac2',360],
  [10,'2026-11-05','R5',12500,5000,0,30,'fac4',300],[11,'2026-11-05','R1',12000,5000,2,28.5,'fac4',280],[12,'2026-11-05','R2',13600,5100,3,27.5,'fac4',340]];
 TR.forEach(a=>D.purchases.push(P({id:'p'+a[0],no:a[0],date:a[1],supplierId:a[2],varietyId:'var1',factoryId:a[7],plate:'تجريبي '+(1000+a[0]),ticketNo:'BSK-'+(500+a[0]),gross:a[3],tare:a[4],disc:a[5],price:a[6],sacks:a[8],sackKg:25,lotNo:'TEST-2611-'+String(a[0]).padStart(2,'0')})));
 // النقل: 9 نقلات على فواتير + نقلة مشتركة لفاتورتين + نقلة داخلية على تشغيلة 4
 [[1,'2026-11-01','T1',3500,['p1']],[2,'2026-11-01','T1',3500,['p2']],[3,'2026-11-02','T2',3200,['p3']],[4,'2026-11-02','T1',3800,['p4']],[5,'2026-11-03','T2',3200,['p5']],
  [6,'2026-11-03','T1',3600,['p6']],[7,'2026-11-04','T2',3000,['p7']],[8,'2026-11-04','T1',3500,['p8','p9']],[9,'2026-11-04','T2',3300,['p9']],[10,'2026-11-05','T1',6400,['p10','p11']],[11,'2026-11-05','T2',3400,['p12']]]
  .forEach(a=>D.transports.push(P({id:'t'+a[0],no:a[0],date:a[1],transporterId:a[2],amount:a[3],purchaseIds:a[4],plate:'تجريبي سواق '+a[0]})));
 // المستلزمات: itm1 كرتون · itm2 باليت · itm3 كيس · itm4 لزق · itm5 استرتش · itm6 الورق · itm7 زوايا · itm8 ستيكر · itm9 داتا لوجر
 D.supplyIn.push(
  P({id:'si1',no:1,date:'2026-11-01',supplierId:'SP1',locId:'fac1',invNo:'TEST-C-101',lines:[{itemId:'itm1',qty:2000,price:16},{itemId:'itm1',qty:2000,price:16.5},{itemId:'itm6',qty:40,price:350},{itemId:'itm9',qty:20,price:150}]}),
  P({id:'si2',no:2,date:'2026-11-01',supplierId:'SP2',locId:'fac1',invNo:'TEST-P-201',lines:[{itemId:'itm3',qty:4000,price:3.2},{itemId:'itm5',qty:60,price:45},{itemId:'itm4',qty:100,price:25},{itemId:'itm2',qty:50,price:330}]}),
  P({id:'si3',no:3,date:'2026-11-02',supplierId:'SP1',locId:'fac2',invNo:'TEST-C-102',lines:[{itemId:'itm1',qty:2500,price:16.6},{itemId:'itm2',qty:30,price:335}]}),
  P({id:'si4',no:4,date:'2026-11-02',supplierId:'SP2',locId:'fac2',invNo:'TEST-P-202',lines:[{itemId:'itm3',qty:2500,price:3.3},{itemId:'itm5',qty:30,price:46}]}),
  P({id:'si5',no:5,date:'2026-11-03',supplierId:'SP1',locId:'fac3',invNo:'TEST-C-103',lines:[{itemId:'itm1',qty:2000,price:16.8},{itemId:'itm3',qty:2000,price:3.25}]}));
 D.transfers.push(P({id:'tf1',no:1,date:'2026-11-04',fromId:'fac3',toId:'fac4',lines:[{itemId:'itm1',qty:1800},{itemId:'itm3',qty:1800}]}),
  P({id:'tf2',no:2,date:'2026-11-04',fromId:'fac1',toId:'fac4',lines:[{itemId:'itm2',qty:16},{itemId:'itm5',qty:16}]}));
 const est=()=>JSON.parse(JSON.stringify(D.varieties[0].est));
 D.runs.push(
  P({id:'r1',no:1,date:'2026-11-03',factoryId:'fac1',varietyId:'var1',inputs:[{purchaseId:'p1',kg:9000},{purchaseId:'p2',kg:8500},{purchaseId:'p3',kg:7500}],cartons:1750,cartonKg:10,farzSacks:200,farzSackKg:25,farzTemp:'',
   supplies:[{itemId:'itm1',qty:1750,locId:'fac1'},{itemId:'itm3',qty:1750,locId:'fac1'},{itemId:'itm2',qty:18,locId:'fac1'},{itemId:'itm5',qty:18,locId:'fac1'},{itemId:'itm4',qty:25,locId:'fac1'},{itemId:'itm6',qty:18,locId:'fac1'}],
   costs:[{name:'التعبئة بالسيزر',amount:35000,partyId:'SV1'},{name:'تجميد',amount:17500,partyId:'SV1'},{name:'تخزين مبرد',amount:5000,partyId:''}],est:est()}),
  P({id:'r2',no:2,date:'2026-11-04',factoryId:'fac1',varietyId:'var1',inputs:[{purchaseId:'p4',kg:10000},{purchaseId:'p5',kg:8000}],cartons:1260,cartonKg:10,farzSacks:150,farzSackKg:25,farzExtraKg:150,farzTemp:16,
   supplies:[{itemId:'itm1',qty:1260,locId:'fac1'},{itemId:'itm3',qty:1260,locId:'fac1'},{itemId:'itm2',qty:13,locId:'fac1'},{itemId:'itm5',qty:13,locId:'fac1'}],
   costs:[{name:'التعبئة بالسيزر',amount:25200,partyId:'SV1'},{name:'تجميد',amount:12600,partyId:'SV1'}],est:est()}),
  P({id:'r3',no:3,date:'2026-11-05',factoryId:'fac2',varietyId:'var1',yieldBySupplier:true,inputs:[{purchaseId:'p6',kg:9500,cartons:690,farzSacks:70},{purchaseId:'p7',kg:7000,cartons:480,farzSacks:60},{purchaseId:'p8',kg:8500,cartons:600,farzSacks:70},{purchaseId:'p9',kg:9000,cartons:610,farzSacks:80}],cartonKg:10,farzSackKg:25,farzTemp:'',
   supplies:[{itemId:'itm1',qty:2380,locId:'fac2'},{itemId:'itm3',qty:2380,locId:'fac2'},{itemId:'itm2',qty:24,locId:'fac2'},{itemId:'itm5',qty:24,locId:'fac2'}],
   costs:[{name:'التعبئة بالسيزر',amount:47600,partyId:'SV2'},{name:'تجميد',amount:23800,partyId:'SV2'},{name:'فحص / مصاريف أخرى',amount:3000,partyId:''}],est:est()}),
  P({id:'r4',no:4,date:'2026-11-06',factoryId:'fac4',varietyId:'var1',inputs:[{purchaseId:'p10',kg:7500},{purchaseId:'p11',kg:7000},{purchaseId:'p12',kg:8500}],cartons:1610,cartonKg:10,farzSacks:180,farzSackKg:25,farzTemp:15,
   supplies:[{itemId:'itm1',qty:1610,locId:'fac4'},{itemId:'itm3',qty:1610,locId:'fac4'},{itemId:'itm2',qty:16,locId:'fac4'},{itemId:'itm5',qty:16,locId:'fac4'}],
   costs:[{name:'التعبئة بالسيزر',amount:32200,partyId:'SV1'},{name:'تجميد',amount:16100,partyId:'SV1'}],est:est()}));
 D.transports.push(P({id:'t12',no:12,date:'2026-11-06',transporterId:'T2',amount:1500,purchaseIds:[],runId:'r4',notes:'نقل داخلي بوناتيرا'}));
 D.sales.push(
  P({id:'s1',no:1,date:'2026-11-07',kind:'farz',customerId:'FZ1',cur:'EGP',rate:'',invNo:'TEST-F-1',lines:[{runId:'r1',kg:5000,price:18}],expenses:[{name:'نقل فرزة',amount:1000,partyId:'T2'}]}),
  P({id:'s2',no:2,date:'2026-11-08',kind:'export',customerId:'cus-fussga',cur:'USD',rate:50.5,invNo:'TEST-EXP-01',lines:[{runId:'r1',cartons:1500,price:1150}],expenses:[{name:'نقل للميناء',amount:7000,partyId:'T1'},{name:'تخليص',amount:4500,partyId:''}]}),
  P({id:'s3',no:3,date:'2026-11-08',kind:'farz',customerId:'FZ2',cur:'EGP',rate:'',lines:[{runId:'r2',kg:2000,price:17}],expenses:[]}),
  P({id:'s4',no:4,date:'2026-11-09',kind:'export',customerId:'cus-fussga',cur:'USD',rate:50.6,invNo:'TEST-EXP-02',lines:[{runId:'r1',cartons:250,price:1150},{runId:'r2',cartons:1260,price:1150}],expenses:[{name:'نقل للميناء',amount:7500,partyId:'T2'}]}),
  P({id:'s5',no:5,date:'2026-11-09',kind:'farz',customerId:'FZ1',cur:'EGP',rate:'',lines:[{runId:'r3',kg:4000,price:17.5}],expenses:[]}),
  P({id:'s6',no:6,date:'2026-11-10',kind:'export',customerId:'EX2',cur:'USD',rate:50.6,invNo:'TEST-EXP-03',lines:[{runId:'r3',cartons:2000,price:1180}],expenses:[{name:'نقل للميناء',amount:8000,partyId:'T1'}]}),
  P({id:'s7',no:7,date:'2026-11-11',kind:'export',customerId:'cus-fussga',cur:'USD',rate:50.7,invNo:'TEST-EXP-04',lines:[{runId:'r3',cartons:380,price:1160},{runId:'r4',cartons:1200,price:1160}],expenses:[{name:'نقل للميناء',amount:8000,partyId:'T1'}]}));
 const PY=[[1,'2026-11-02','R1','out','transfer',240000,'EGP'],[2,'2026-11-03','R2','out','cash',150000,'EGP'],[3,'2026-11-04','R3','out','transfer',200000,'EGP'],[4,'2026-11-05','R4','out','cash',100000,'EGP'],
  [5,'2026-11-06','R5','out','transfer',510000,'EGP'],[6,'2026-11-06','T1','out','cash',20000,'EGP'],[7,'2026-11-06','T2','out','cash',10000,'EGP'],[8,'2026-11-03','SP1','out','transfer',100000,'EGP'],
  [9,'2026-11-03','SP2','out','cash',15000,'EGP'],[10,'2026-11-07','SV1','out','transfer',100000,'EGP'],[11,'2026-11-10','cus-fussga','in','transfer',20000,'USD',50.6],[12,'2026-11-12','cus-fussga','in','transfer',15000,'USD',50.7],
  [13,'2026-11-12','EX2','in','transfer',23600,'USD',50.6],[14,'2026-11-08','FZ1','in','cash',89000,'EGP'],[15,'2026-11-10','FZ1','in','cash',30000,'EGP'],[16,'2026-11-12','R1','out','cash',50000,'EGP']];
 PY.forEach(a=>D.payments.push(P({id:'y'+a[0],no:a[0],date:a[1],partyId:a[2],dir:a[3],method:a[4],amount:a[5],cur:a[6],rate:a[7]||'',ref:a[4]==='transfer'?'تجريبي TRX-'+a[0]:''})));
 return D}
module.exports={build};
if(require.main===module){const fs=require('fs');const D=build();const out={app:'alrashed-strawberry-erp',version:'test-100t',exportedAt:'2026-11-14T09:00:00.000Z',data:D};
 fs.writeFileSync(__dirname+'/scenario100.json',JSON.stringify(out,null,1));const C=E.compute(D);
 Object.values(C.R).forEach(r=>console.log('run',r.no,'raw',r.rawKg,'fin',r.fin,'farz',r.farz,'waste',r.waste,'total',r.total.toFixed(2),'perTon',r.perTon.toFixed(2),r.status,r.errs));
 console.log('warns',JSON.stringify(C.warns));Object.values(C.SL).forEach(s=>console.log('sale',s.no,s.kind,s.rev.toFixed(2),s.cogs.toFixed(2),s.exp,s.profit.toFixed(2)));
 Object.entries(C.BAL).forEach(([k,b])=>console.log('bal',k,b.bal.toFixed(2)))}
