// بيانات تجريبية ثابتة (كل الأسماء «تجريبي») — نفس السيناريو اللي بيتعمل من الواجهة في e2e
const E=require('../core.js');
function build(){const D=E.seed();const t='2026-11-14T08:00:00.000Z';let k=0;const T=()=>new Date(Date.parse(t)+(k++)*1000).toISOString();
 const P=(o)=>Object.assign({createdAt:T(),updatedAt:t},o);
 D.parties.push(P({id:'sA',type:'raw',name:'تجريبي مورد خام أ',disc:2}),P({id:'sB',type:'raw',name:'تجريبي مورد خام ب',disc:3}),P({id:'tr',type:'transport',name:'تجريبي مورد نقل'}),
  P({id:'sp',type:'supply',name:'تجريبي مورد مستلزمات'}),P({id:'sv',type:'service',name:'تجريبي خدمات الثلاجة'}),P({id:'fz',type:'farz',name:'تجريبي عميل فرزة'}));
 D.purchases.push(P({id:'pA',no:1,date:'2026-11-10',supplierId:'sA',varietyId:'var1',factoryId:'fac1',plate:'تجريبي 123',gross:15000,tare:5000,disc:2,price:28,sacks:400,sackKg:25}),
  P({id:'pB',no:2,date:'2026-11-10',supplierId:'sB',varietyId:'var1',factoryId:'fac1',plate:'تجريبي 456',gross:13000,tare:5000,disc:3,price:30,sacks:320,sackKg:25}));
 D.transports.push(P({id:'t1',no:1,date:'2026-11-10',transporterId:'tr',amount:9000,purchaseIds:['pA','pB']}));
 D.supplyIn.push(P({id:'si1',no:1,date:'2026-11-08',supplierId:'sp',locId:'fac1',lines:[{itemId:'itm1',qty:1500,price:16},{itemId:'itm2',qty:20,price:330},{itemId:'itm5',qty:10,price:45}]}),
  P({id:'si2',no:2,date:'2026-11-09',supplierId:'sp',locId:'fac2',lines:[{itemId:'itm1',qty:500,price:18}]}));
 D.transfers.push(P({id:'tf1',no:1,date:'2026-11-09',fromId:'fac2',toId:'fac1',lines:[{itemId:'itm1',qty:300}]}));
 const est=JSON.parse(JSON.stringify(D.varieties[0].est));
 D.runs.push(P({id:'r1',no:1,date:'2026-11-11',factoryId:'fac1',varietyId:'var1',inputs:[{purchaseId:'pA',kg:10000},{purchaseId:'pB',kg:8000}],cartons:1500,cartonKg:10,farzSacks:80,farzSackKg:25,farzPrice:15,
  supplies:[{itemId:'itm1',qty:1500,locId:'fac1'},{itemId:'itm2',qty:15,locId:'fac1'},{itemId:'itm5',qty:8,locId:'fac1'}],
  costs:[{name:'التعبئة بالسيزر',amount:30000,partyId:'sv'},{name:'تجميد',amount:12000,partyId:'sv'},{name:'تخزين مبرد',amount:3000}],est}));
 D.sales.push(P({id:'s1',no:1,date:'2026-11-12',kind:'export',customerId:'cus-fussga',cur:'USD',rate:50,lines:[{runId:'r1',cartons:1000,price:1100}],expenses:[{name:'نقل للميناء',amount:6000,partyId:'tr'}]}),
  P({id:'s2',no:2,date:'2026-11-12',kind:'farz',customerId:'fz',cur:'EGP',lines:[{runId:'r1',kg:1500,price:18}],expenses:[]}));
 D.payments.push(P({id:'y1',no:1,date:'2026-11-12',partyId:'sA',dir:'out',method:'transfer',amount:200000,ref:'تجريبي TRX1'}),P({id:'y2',no:2,date:'2026-11-12',partyId:'sB',dir:'out',method:'cash',amount:232800}),
  P({id:'y3',no:3,date:'2026-11-12',partyId:'tr',dir:'out',method:'cash',amount:9000}),P({id:'y4',no:4,date:'2026-11-12',partyId:'sp',dir:'out',method:'transfer',amount:20000}),
  P({id:'y5',no:5,date:'2026-11-13',partyId:'cus-fussga',dir:'in',method:'transfer',cur:'USD',rate:50,amount:8000}),P({id:'y6',no:6,date:'2026-11-13',partyId:'fz',dir:'in',method:'cash',amount:27000}));
 return D}
module.exports={build};
if(require.main===module){const C=E.compute(build());const r=C.R.r1;
 console.log('raw',r.rawKg,'fin',r.fin,'farz',r.farz,'waste',r.waste,'supT',r.suppliesT,'shared',r.shared,'total',r.total,'perTon',r.perTon.toFixed(2));
 r.rows.forEach(s=>console.log(s.name,s.kg,s.rawCost,s.trans,s.shared.toFixed(2),s.total.toFixed(2),s.credit.toFixed(2),s.finCost.toFixed(2),s.perTon.toFixed(2),'disc',s.discSave));
 console.log('cmp',r.cmp.aT.toFixed(2),r.cmp.eT.toFixed(2),r.cmp.v.toFixed(2));r.cmp.lines.forEach(l=>console.log(' ',l.name,l.a.toFixed(2),l.e.toFixed(2),l.v.toFixed(2)));
 r.cmp.drivers.forEach(l=>console.log(' d',l.name,l.a.toFixed(3),l.e));
 Object.values(C.SL).forEach(s=>console.log('sale',s.no,s.rev,s.cogs.toFixed(2),s.exp,s.profit.toFixed(2),s.margin.toFixed(2)));
 console.log('run sales',r.sales,'stock',r.stockFin,r.stockFarz,r.stockVal.toFixed(2));
 Object.entries(C.BAL).forEach(([k,b])=>console.log('bal',k,b.dr.toFixed(2),b.cr.toFixed(2),b.bal.toFixed(2)));
 Object.entries(C.SUP).forEach(([k,s])=>s.inQty&&console.log('sup',k,s.qty,s.avg.toFixed(3),JSON.stringify(s.loc)));console.log('warns',C.warns);
}
