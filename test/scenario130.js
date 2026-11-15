// v1.3.0: سيناريو تجريبي لتفصيل التكاليف — من scenario100 (بيانات تجريبية بالكامل): تشغيلات بمستلزمات التشغيل (1.2.5) وفواتير تصدير بالحاويات مع بنود التحميل
const fs=require('fs'),E=require('../core.js');
const J=JSON.parse(fs.readFileSync(__dirname+'/scenario100.json','utf8'));const D=J.data;const b=E.bomOf({});
const runBom=r=>{const ct=E.n(r.cartons)||2380;r.supplies=b.lines.filter(l=>l.stage==='run').map(l=>({itemId:l.itemId,qty:E.bomQty(l,ct,b),locId:r.factoryId,auto:true,bk:l.k}));
  const keep=(r.costs||[]).filter(c=>!/سيزر|التعبئة/.test(c.name));r.costs=b.services.filter(v=>v.stage==='run').map(v=>({name:v.name,amount:E.bomSvc(v,ct,b),partyId:v.toFactory?'SV1':'',auto:true,bk:v.k})).concat(keep)};
D.runs.forEach(runBom);
// مخزون للمستلزمات الجديدة عشان المتوسط المرجح يبقى حقيقي (الستيكر والزوايا والداتا لوجر)
D.supplyIn.push({id:'si130',no:99,date:'2026-11-01',locId:'fac1',partyId:'SP1',lines:[{itemId:'itm10',qty:20000,price:0.22},{itemId:'itm11',qty:9000,price:0.3},{itemId:'itm7',qty:400,price:20},{itemId:'itm9',qty:6,price:240},{itemId:'itm2',qty:120,price:330},{itemId:'itm5',qty:20,price:41}],createdAt:'2026-11-01T06:00:00.000Z',updatedAt:'2026-11-01T06:00:00.000Z'});
D.supplyIn.push({id:'si131',no:100,date:'2026-11-01',locId:'fac2',partyId:'SP1',lines:[{itemId:'itm10',qty:5000,price:0.22},{itemId:'itm11',qty:3000,price:0.3},{itemId:'itm7',qty:200,price:20},{itemId:'itm9',qty:3,price:240},{itemId:'itm2',qty:60,price:330},{itemId:'itm5',qty:10,price:41},{itemId:'itm1',qty:3000,price:16},{itemId:'itm3',qty:3000,price:3.3}],createdAt:'2026-11-01T06:01:00.000Z',updatedAt:'2026-11-01T06:01:00.000Z'});
const ld=(ctn,loc)=>({locId:loc,sup:b.lines.filter(l=>l.stage==='load').map(l=>({k:l.k,itemId:l.itemId,qty:E.bomLoadQty(l,ctn,b),auto:true})),svc:b.services.filter(v=>v.stage==='load').map(v=>({k:v.k,name:v.name,amount:E.bomLoadSvc(v,ctn,b),partyId:'',auto:true}))});
const S=id=>D.sales.find(s=>s.id===id);
const cont=(s,lines)=>{s.cont=true;s.lines=lines.map((l,i)=>Object.assign({cont:l.c,bl:l.bl,tons:l.t,price:l.p,runId:l.r,ld:ld(l.t*100,l.loc||'fac1')},l.alloc?{alloc:l.alloc}:{}))};
cont(S('s2'),[{c:'MSKU1234565',bl:'BL-TEST-01',t:15,p:1.15,r:'r1'}]);
cont(S('s4'),[{c:'MSKU2234566',bl:'BL-TEST-02',t:2.5,p:1.15,r:'r1'},{c:'MSKU3234567',bl:'BL-TEST-02',t:12.6,p:1.15,r:'r2'}]);
cont(S('s6'),[{c:'CMAU4234568',bl:'BL-TEST-03',t:20,p:1.18,r:'r3',loc:'fac2'}]);
cont(S('s7'),[{c:'CMAU5234569',bl:'BL-TEST-04',t:15.8,p:1.16,r:'r3',loc:'fac2',alloc:[{runId:'r3',kg:3800},{runId:'r4',kg:12000}]}]);
J.exportedAt='2026-11-15T12:00:00.000Z';
fs.writeFileSync(__dirname+'/scenario130.json',JSON.stringify(J));
module.exports={J};
if(require.main===module){const C=E.compute(D);const rb=E.runsBreakdown(D,C),sh=E.contSheets(D,C),ct=E.contTotals(sh);
  console.log('runs',rb.runs.length,'T',rb.T.toFixed(3),'net',rb.net.toFixed(2),'sum',rb.sum.toFixed(2),'perTon',rb.perTon.toFixed(2));
  rb.runs.forEach(z=>console.log(' run',z.run.no,'perTon',z.x.perTon.toFixed(2),'sumPerTon',z.P.lines.reduce((a,c)=>a+c.perTon,0).toFixed(2),'diff',z.P.diff.toExponential(2)));
  sh.forEach(z=>console.log(' cont',z.contNo,z.tons,'ctn',z.cartons,'pal',z.pallets,'total',z.total.toFixed(2),'sum',z.sum.toFixed(2),'cogs',z.cogs.toFixed(2),'prodT',z.prodT.toFixed(2),'profit',z.profit.toFixed(0),'saleProfit',C.SL[z.saleId].profit.toFixed(0)));
  console.log('totals',ct.total.toFixed(2),ct.sum.toFixed(2),ct.costTon.toFixed(2));
  console.log(JSON.stringify(sh[0].lines.map(c=>[c.name,+c.qty.toFixed(3),+c.price.toFixed(3),+c.value.toFixed(2)]),null,0));
  console.log(C.warns.length,'warns',JSON.stringify(C.warns.slice(0,5)))}
