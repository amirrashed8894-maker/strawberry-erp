/* التقارير — صفحات A4 على ورق الراشد، الملخص الأول وبعدين التفاصيل، ومشاركة PDF */
(function(){
'use strict';
const E=ERP,n=E.n,fm=E.fmt;const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const f0=x=>fm(x,0),f2=x=>fm(x,2),f1=x=>fm(x,1),f3=x=>fm(x,3);
const sg=x=>(x>0.5?'+':'')+f0(x);
const A=()=>window.APP;
let CUR=null;
function td(v,c){return '<td'+(c?' class="'+c+'"':'')+'>'+v+'</td>'}
function tr(cells,c){return '<tr'+(c?' class="'+c+'"':'')+'>'+cells.join('')+'</tr>'}
function th(list){return '<tr>'+list.map(x=>'<th>'+x+'</th>').join('')+'</tr>'}
function boxes(list){return '<div class="rk k'+list.length+'">'+list.map(b=>'<div class="m'+(b[3]?' main':'')+'"><span>'+b[0]+'</span><b class="num">'+b[1]+'</b>'+(b[2]?'<em class="num">'+b[2]+'</em>':'')+'</div>').join('')+'</div>'}
function h3(t){return '<h3>'+t+'</h3>'}
function note(t){return '<div class="rn">'+t+'</div>'}
function T(title,head,rows,foot,cls){return{table:{title,head,rows,foot,cls:cls||''}}}
function H(html){return{html}}
const methodTxt=m=>m==='joint'?'الفرزة: توزيع التكلفة على النهائي والفرزة بالوزن':'الفرزة: صافي بيعها الفعلي بيتخصم من تكلفة التشغيلة';
function farzWarn(x){if(x.method==='joint'||x.status==='final')return null;return H('<div class="rwarn"><b>⚠ '+esc(x.farzWarn)+'</b> — '+esc(x.costLabel)+'. الفرزة '+f0(x.farz)+' كجم: اتباع '+f0(x.farzSoldKg)+' كجم'+(x.farzSoldKg>0.005?' بمتوسط صافي '+f2(x.farzAvg)+' ج/كجم':'')+'، والباقي '+f0(x.farzUnsold)+' كجم '+(x.status==='provisional'?'بسعر مؤقت '+f2(x.farzTemp)+' ج/كجم':'من غير سعر')+'.</div>')}
const balTxt=b=>Math.abs(b)<0.005?'0.00':f2(Math.abs(b))+' '+(b>0?'عليه':'له');
const per=(from,to)=>from||to?('الفترة: '+(from?'من '+E.dmy(from):'من البداية')+' '+(to?'إلى '+E.dmy(to):'إلى اليوم')):'كل الفترات';

const BUILD={};
BUILD.run=function(o){const app=A(),r=app.get('runs',o.id);if(!r)return null;const x=app.C.R[r.id],D=app.D;
  const vname=app.name('varieties',r.varietyId),fac=app.name('factories',r.factoryId),T1=x.fin/1000;
  const b=[];
  if(x.errs.length)b.push(H('<div class="rerr"><b>التكلفة مش مكتملة:</b> '+x.errs.map(esc).join(' — ')+'</div>'));
  const fw=farzWarn(x);if(fw)b.push(fw);
  b.push(H(boxes([['تكلفة الطن الصادر — '+(x.status==='final'?'نهائي':'مبدئي'),f0(x.perTon)+' ج',x.cmp&&x.cmp.usd?'$'+f2(x.perTon/x.cmp.usd)+' (دولار '+f2(x.cmp.usd)+')':'',1],['تكلفة الإنتاج النهائي',f0(x.finCost)+' ج'],['إنتاج نهائي',f0(x.fin)+' كجم',f0(x.cartons)+' كرتونة × '+f2(x.cartonKg)+' كجم'],['خام داخل',f0(x.rawKg)+' كجم',x.rows.length+' مورد']])));
  b.push(T('الإنتاج من الخام',th(['','الخام','إنتاج نهائي','فرزة','هالك (الفرق)']),[tr([td('كجم'),td(f0(x.rawKg),'v'),td(f0(x.fin),'v'),td(f0(x.farz),'v'),td(f0(x.waste),'v')]),tr([td('النسبة من الخام'),td('100%','v'),td(f1(x.yieldFin)+'%','v'),td(f1(x.yieldFarz)+'%','v'),td(f1(x.yieldWaste)+'%','v')])],'','sm'));
  b.push(T('تكلفة الطن الصادر لكل مورد',th(['المورد','خام كجم','سعر التعاقد','خصم الميزان','سعر فعلي/كجم','نهائي كجم','فرزة كجم','التكلفة الكلية',x.method==='joint'?'نصيب الفرزة':'قيمة الفرزة','ج / طن صادر']),
    x.rows.map(s=>tr([td(esc(s.name)),td(f0(s.kg),'v'),td(f2(s.contractKg),'v'),td(s.kg?f2(s.discKg/s.kg*100)+'%':'-','v'),td(f2(s.effKg),'v'),td(f0(s.fin),'v'),td(f0(s.farz),'v'),td(f0(s.total),'v'),td(f0(s.farzCost),'v'),td(f0(s.perTon),'v b')])),
    tr([td('الإجمالي'),td(f0(x.rawKg),'v'),td(x.rawKg?f2(x.rows.reduce((a,s)=>a+s.contract,0)/x.rawKg):'-','v'),td(x.rawKg?f2(x.discKg/x.rawKg*100)+'%':'-','v'),td(x.rawKg?f2(x.rawCost/x.rawKg):'-','v'),td(f0(x.fin),'v'),td(f0(x.farz),'v'),td(f0(x.total),'v'),td(f0(x.farzCost),'v'),td(f0(x.perTon),'v b')],'tt'),'xs'));
  if(x.cmp)b.push(H(boxes([['التكلفة المقدرة للطن',f0(x.cmp.eT)+' ج'],['الفعلية',f0(x.cmp.aT)+' ج'],['الفرق',sg(x.cmp.v)+' ج',x.cmp.eT?f1(x.cmp.v/x.cmp.eT*100)+'%':'']])));
  b.push(H(note(methodTxt(x.method)+(x.method==='joint'?'':' — '+x.costLabel+(x.farz>0?' (قيمة الفرزة '+f0(x.credit)+' ج = '+f2(x.fp)+' ج/كجم في المتوسط)':''))+'. التكاليف المشتركة (مستلزمات + تكاليف تشغيل + نقل على التشغيلة = '+f0(x.shared)+' ج) متوزعة على الموردين بنسبة كيلو الخام. '+(x.bySup?'الإنتاج والفرزة متسجلين لكل مورد.':'الإنتاج والفرزة متوزعين على الموردين بنسبة الخام لأنهم مش متسجلين لكل مورد.')+' خصم الميزان وفّر '+f0(x.discSave)+' ج ('+f0(x.discKg)+' كجم) ومحسوب في سعر الكيلو الفعلي.')));
  /* التفاصيل */
  const rows=[];const line=(nm,v,c)=>rows.push(tr([td(nm),td(f2(v),'v'),td(T1?f0(v/T1):'-','v'),td(x.total?f1(v/x.total*100)+'%':'-','v')],c));
  rows.push(tr([td('شراء الخام'),td(f2(x.rawCost),'v'),td(T1?f0(x.rawCost/T1):'-','v'),td(x.total?f1(x.rawCost/x.total*100)+'%':'','v')],'g'));
  x.rows.forEach(s=>s.purchases.forEach(p=>line('&nbsp;&nbsp;فاتورة #'+p.no+' — '+esc(s.name)+' — '+f0(p.kg)+' كجم × '+f3(p.unit),p.kg*p.unit)));
  line('نقل الخام المحمّل على الفواتير',x.trans,'g');if(x.runTrans)line('نقل على التشغيلة',x.runTrans,'g');
  rows.push(tr([td('مستلزمات مصروفة من المخزن'),td(f2(x.suppliesT),'v'),td(T1?f0(x.suppliesT/T1):'-','v'),td(x.total?f1(x.suppliesT/x.total*100)+'%':'','v')],'g'));
  x.supplies.forEach(s=>line('&nbsp;&nbsp;'+esc(s.name)+' — '+f0(s.qty)+' '+esc(s.unit)+' × '+f3(s.avg)+' ('+esc(app.name('factories',s.loc))+')',s.cost));
  rows.push(tr([td('تكاليف التشغيل'),td(f2(x.costsT),'v'),td(T1?f0(x.costsT/T1):'-','v'),td(x.total?f1(x.costsT/x.total*100)+'%':'','v')],'g'));
  x.costs.forEach(c=>line('&nbsp;&nbsp;'+esc(c.name)+(c.partyId?' — '+esc(app.name('parties',c.partyId)):''),c.amount));
  rows.push(tr([td('إجمالي تكلفة التشغيلة'),td(f2(x.total),'v'),td(T1?f0(x.total/T1):'-','v'),td('100%','v')],'tt'));
  if(x.method==='joint')rows.push(tr([td('− نصيب الفرزة بالوزن ('+f0(x.farz)+' كجم × '+f3(x.farzKgCost)+')'),td(f2(-x.farzCost),'v'),td(T1?f0(-x.farzCost/T1):'-','v'),td('','v')]));
  else{(x.farzSales||[]).forEach(z=>rows.push(tr([td('− فرزة مباعة: بيع #'+z.no+' '+E.dmy(z.date)+' — '+f0(z.kg)+' كجم (صافي '+f2(z.kg?z.net/z.kg:0)+' ج/كجم)'),td(f2(-z.net),'v'),td(T1?f0(-z.net/T1):'-','v'),td('','v')])));
    if(x.farzUnsold>0.005)rows.push(tr([td(x.status==='provisional'?'− فرزة باقية '+f0(x.farzUnsold)+' كجم × سعر مؤقت '+f2(x.farzTemp):'فرزة باقية '+f0(x.farzUnsold)+' كجم — لسه مالهاش سعر (مش مخصومة)'),td(f2(x.status==='provisional'?-x.farzUnsold*x.farzTemp:0),'v'),td(T1&&x.status==='provisional'?f0(-x.farzUnsold*x.farzTemp/T1):'-','v'),td('','v')]))}
  rows.push(tr([td('تكلفة الإنتاج النهائي ('+(x.status==='final'?'نهائي':'مبدئي')+')'),td(f2(x.finCost),'v'),td(f0(x.perTon),'v b'),td('','v')],'tt'));
  b.push(T('تفاصيل التكلفة',th(['البند','المبلغ ج','ج / طن صادر','من الإجمالي']),rows,'','sm'));
  b.push(T('توزيع التكلفة على الموردين',th(['المورد','نسبة الخام','الخام ج','النقل ج','نصيب المشترك ج','الإجمالي ج',x.method==='joint'?'كجم للنهائي':'− الفرزة ج','للنهائي ج']),
    x.rows.map(s=>tr([td(esc(s.name)),td(f1(s.share*100)+'%','v'),td(f0(s.rawCost),'v'),td(f0(s.trans),'v'),td(f0(s.shared),'v'),td(f0(s.total),'v'),td(x.method==='joint'?f0(s.fin):f0(-s.credit),'v'),td(f0(s.finCost),'v b')])),
    tr([td('الإجمالي'),td('100%','v'),td(f0(x.rawCost),'v'),td(f0(x.trans),'v'),td(f0(x.shared),'v'),td(f0(x.total),'v'),td(x.method==='joint'?f0(x.fin):f0(-x.farzCost),'v'),td(f0(x.finCost),'v b')],'tt'),'xs'));
  b.push(T('فواتير الخام الداخلة',th(['الفاتورة','التاريخ','المورد','كجم','سعر','خصم','ج/كجم فعلي','نقل/كجم']),
    x.rows.flatMap(s=>s.purchases.map(p=>tr([td('#'+p.no),td(E.dmy(p.date),'v'),td(esc(s.name)),td(f0(p.kg),'v'),td(f2(p.price),'v'),td(f2(p.d)+'%','v'),td(f3(p.unit),'v'),td(f3(p.transKg),'v')]))),'','xs'));
  if(x.cmp)cmpBlocks(x).forEach(z=>b.push(z));
  b.push(H(boxes([['مباع نهائي',f0(x.soldFin)+' كجم'],['باقي نهائي',f0(x.stockFin)+' كجم'],['باقي فرزة',f0(x.stockFarz)+' كجم'],['ربح المبيعات',f0(x.sales.profit)+' ج']])));
  return{title:'تقرير تكلفة تشغيلة #'+r.no+' — '+esc(vname),meta:E.dmy(r.date)+' · '+esc(fac)+' · '+methodTxt(x.method),blocks:b,file:'run-cost-'+r.no}};
function cmpBlocks(x){const c=x.cmp,b=[];
  b.push(T('المقدر والفعلي — ج للطن الصادر',th(['البند','مقدر','فعلي','الفرق','%']),c.lines.filter(l=>Math.abs(l.a)>0.005||Math.abs(l.e)>0.005).map(l=>tr([td(esc(l.name)),td(f0(l.e),'v'),td(f0(l.a),'v'),td(sg(l.v),'v b'),td(l.e?f1(l.v/l.e*100)+'%':'-','v')])),
    tr([td('إجمالي الطن'),td(f0(c.eT),'v'),td(f0(c.aT),'v'),td(sg(c.v),'v b'),td(c.eT?f1(c.v/c.eT*100)+'%':'-','v')],'tt'),'sm'));
  b.push(T('أسباب الفرق (المؤشرات)',th(['المؤشر','مقدر','فعلي','الفرق']),c.drivers.map(d=>tr([td(d.name),td(fm(d.e,d.d)+' '+d.u,'v'),td(fm(d.a,d.d)+' '+d.u,'v'),td((d.a-d.e>0?'+':'')+fm(d.a-d.e,d.d),'v b')])),'','sm'));
  b.push(H(note('المقارنة على أساس نموذج «تكلفة المجمدات»: شراء الخام = سعر الكيلو الفعلي × 1000، والهالك والفرزة (فرق سعرها) والنقل والمستلزمات كل واحد للطن الصادر. البنود اللي مالهاش تقدير (زي التجميد والتخزين) مقدرها صفر. سعر الفرزة في التقدير تقديري، وفي الفعلي هو صافي البيع لعملاء الفرزة (أو السعر المؤقت للباقي).'+(x.method==='joint'?' تكلفة الطن في التقرير ده بطريقة التوزيع بالوزن، لكن المقارنة بطريقة خصم الفرزة عشان تبقى على نفس أساس التقدير.':''))));
  return b}
BUILD.cmp=function(o){const app=A(),r=app.get('runs',o.id);if(!r)return null;const x=app.C.R[r.id];
  const b=[];const fw=farzWarn(x);if(fw)b.push(fw);if(!x.cmp)b.push(H('<div class="rerr">لازم يبقى فيه خام وإنتاج نهائي عشان المقارنة.</div>'));
  else{b.push(H(boxes([['المقدر للطن',f0(x.cmp.eT)+' ج'],['الفعلي للطن'+(x.status==='final'?'':' (مبدئي)'),f0(x.cmp.aT)+' ج','',1],['الفرق للطن',sg(x.cmp.v)+' ج',x.cmp.eT?f1(x.cmp.v/x.cmp.eT*100)+'%':''],['الفرق على الإنتاج',sg(x.cmp.v*x.fin/1000)+' ج',f3(x.fin/1000)+' طن']])));cmpBlocks(x).forEach(z=>b.push(z));
    b.push(T('لكل مورد',th(['المورد','ج/طن فعلي','الفرق عن المقدر']),x.rows.map(s=>tr([td(esc(s.name)),td(f0(s.perTon),'v'),td(sg(s.perTon-x.cmp.eT),'v b')])),'','sm'))}
  return{title:'المقدر والفعلي — تشغيلة #'+r.no,meta:E.dmy(r.date)+' · '+esc(app.name('factories',r.factoryId))+' · '+esc(app.name('varieties',r.varietyId)),blocks:b,file:'estimate-vs-actual-'+r.no}};
BUILD.profit=function(o){const app=A(),D=app.D,C=app.C;const inP=s=>(!o.from||s.date>=o.from)&&(!o.to||s.date<=o.to);
  const sales=D.sales.filter(inP).sort((a,b)=>(a.date||'').localeCompare(b.date||'')||n(a.no)-n(b.no));
  let rev=0,cogs=0,exp=0;const byC={},byR={};
  sales.forEach(s=>{const x=C.SL[s.id];rev+=x.rev;cogs+=x.cogs;exp+=x.exp;const c=byC[s.customerId]=byC[s.customerId]||{rev:0,cogs:0,exp:0,kg:0,n:0};c.rev+=x.rev;c.cogs+=x.cogs;c.exp+=x.exp;c.kg+=x.kg;c.n++;
    x.lines.forEach(l=>{const r=byR[l.runId]=byR[l.runId]||{rev:0,cogs:0,exp:0,fin:0,farz:0};const ex=x.rev?x.exp*l.egp/x.rev:0;r.rev+=l.egp;r.cogs+=l.cogs;r.exp+=ex;r[x.kind==='farz'?'farz':'fin']+=l.kg})});
  const pr=rev-cogs-exp,b=[];const prov=Object.keys(byR).map(id=>C.R[id]).filter(x=>x&&x.method!=='joint'&&x.status!=='final');
  if(prov.length)b.push(H('<div class="rwarn"><b>⚠ سعر الفرزة لسه ما اتحددش — التكلفة مبدئية</b> في التشغيلات: '+prov.map(x=>'#'+x.no+' ('+esc(x.costLabel)+')').join('، ')+'. الربح هيتغير لما الفرزة تتباع.</div>'));
  b.push(H(boxes([['صافي الربح',f0(pr)+' ج',rev?f1(pr/rev*100)+'% من المبيعات':'',1],['المبيعات',f0(rev)+' ج',sales.length+' عملية'],['تكلفة البضاعة المباعة',f0(cogs)+' ج'],['مصروفات البيع',f0(exp)+' ج']])));
  b.push(T('الربحية لكل عميل',th(['العميل','النوع','العمليات','كجم','المبيعات','التكلفة','المصروفات','الربح','%']),Object.keys(byC).map(id=>{const c=byC[id],p=app.get('parties',id)||{},q=c.rev-c.cogs-c.exp;return tr([td(esc(p.name||'—')),td(E.PTYPES[p.type]||''),td(c.n,'v'),td(f0(c.kg),'v'),td(f0(c.rev),'v'),td(f0(c.cogs),'v'),td(f0(c.exp),'v'),td(f0(q),'v b'),td(c.rev?f1(q/c.rev*100)+'%':'-','v')])}),
    tr([td('الإجمالي'),td(''),td(sales.length,'v'),td(f0(sales.reduce((a,s)=>a+C.SL[s.id].kg,0)),'v'),td(f0(rev),'v'),td(f0(cogs),'v'),td(f0(exp),'v'),td(f0(pr),'v b'),td(rev?f1(pr/rev*100)+'%':'-','v')],'tt'),'xs'));
  b.push(T('الربحية لكل تشغيلة',th(['التشغيلة','ج/طن تكلفة','نهائي مباع كجم','فرزة مباعة كجم','المبيعات','التكلفة','المصروفات','الربح','مخزون باقي (تكلفة)']),Object.keys(byR).map(id=>{const r=byR[id],run=app.get('runs',id)||{},x=C.R[id]||{};return tr([td('#'+(run.no||'?')+' '+E.dmy(run.date)),td(f0(x.perTon||0),'v'),td(f0(r.fin),'v'),td(f0(r.farz),'v'),td(f0(r.rev),'v'),td(f0(r.cogs),'v'),td(f0(r.exp),'v'),td(f0(r.rev-r.cogs-r.exp),'v b'),td(f0(x.stockVal||0),'v')])}),'','xs'));
  b.push(T('الربحية لكل عملية بيع',th(['التاريخ','#','العميل','النوع','كجم','سعر البيع','المبيعات ج','التكلفة','المصروفات','الربح','%']),sales.map(s=>{const x=C.SL[s.id];const pz=x.lines.length===1?(x.cur==='USD'?'$':'')+f2(x.lines[0].price)+(x.kind==='farz'?'/كجم':'/طن'):'متعدد';
    return tr([td(E.dmy(s.date),'v'),td(s.no,'v'),td(esc(app.name('parties',s.customerId))),td(x.kind==='farz'?'فرزة':'تصدير'),td(f0(x.kg),'v'),td(pz,'v'),td(f0(x.rev),'v'),td(f0(x.cogs),'v'),td(f0(x.exp),'v'),td(f0(x.profit),'v b'),td(f1(x.margin)+'%','v')])}),'','xs'));
  const det=[];sales.forEach(s=>{const x=C.SL[s.id];x.lines.forEach(l=>det.push(tr([td('#'+s.no),td('تشغيلة #'+(l.runNo||'?')),td(f0(l.kg),'v'),td(f3(l.kgCost),'v'),td(f0(l.cogs),'v'),td(f0(l.egp),'v')])));x.exps.forEach(e=>det.push(tr([td('#'+s.no),td('مصروف: '+esc(e.name)),td(''),td(''),td(f0(e.amount),'v'),td('')])))});
  b.push(T('تخصيص التكلفة على كل بيع',th(['البيع','من','كجم','تكلفة الكيلو','التكلفة ج','الإيراد ج']),det,'','xs'));
  b.push(H(note('تكلفة البضاعة المباعة = الكمية × تكلفة الكيلو في التشغيلة اللي البيع طالع منها (النهائي بتكلفة الطن الصادر، والفرزة '+(C.method==='joint'?'بنفس تكلفة الكيلو بالوزن':'بمتوسط صافي بيعها، فربح الفرزة الإجمالي صفر لأن قيمتها اتخصمت من تكلفة النهائي')+'). مصروفات البيع متوزعة على سطور البيع بنسبة الإيراد. المبيعات بالدولار متحولة بسعر الدولار المسجل في البيع.')));
  return{title:'تقرير الربحية',meta:per(o.from,o.to)+' · '+methodTxt(C.method),blocks:b,file:'profitability'}};
BUILD.stmt=function(o){const app=A(),p=app.get('parties',o.id);if(!p)return null;const st=app.statement(p.id,o.from,o.to);const b=[];
  b.push(H('<div class="rinfo"><div><b>'+esc(p.name)+'</b>'+(p.nameEn?' — '+esc(p.nameEn):'')+'</div><div>'+E.PTYPES[p.type]+(p.cr?' · سجل تجاري '+esc(p.cr):'')+(p.tax?' · بطاقة ضريبية '+esc(p.tax):'')+(p.address?' · '+esc(p.address):'')+(p.phone?' · '+esc(p.phone):'')+'</div></div>'));
  b.push(H(boxes([['الرصيد',balTxt(st.close)+' ج','',1],['رصيد أول الفترة',balTxt(st.open)],['مدين (عليه)',f2(st.dr)],['دائن (له)',f2(st.cr)]])));
  const rows=[];if(o.from)rows.push(tr([td(''),td('رصيد قبل '+E.dmy(o.from)),td(''),td(''),td(balTxt(st.open),'v')],'g'));
  st.rows.forEach(e=>rows.push(tr([td(E.dmy(e.date),'v'),td(esc(e.desc)),td(e.dr?f2(e.dr):'','v'),td(e.cr?f2(e.cr):'','v'),td(balTxt(e.bal),'v')])));
  b.push(T('الحركات',th(['التاريخ','البيان','مدين','دائن','الرصيد']),rows,tr([td(''),td('الإجمالي'),td(f2(st.dr),'v'),td(f2(st.cr),'v'),td(balTxt(st.close),'v b')],'tt'),'sm st'));
  b.push(H(note('«عليه» = مستحق لشركة الراشد عنده، «له» = مستحق له على شركة الراشد. المبالغ بالجنيه المصري؛ الدولار متحول بالسعر المسجل في كل حركة.')));
  return{title:'كشف حساب — '+esc(p.name),meta:per(o.from,o.to),blocks:b,file:'statement'}};
BUILD.stock=function(){const app=A(),D=app.D,C=app.C,b=[];let F=0,Z=0,V=0;
  const fr=D.runs.filter(r=>C.R[r.id].stockFin>0.005||C.R[r.id].stockFarz>0.005).map(r=>{const x=C.R[r.id];F+=x.stockFin;Z+=x.stockFarz;V+=x.stockVal;return tr([td('#'+r.no+' '+E.dmy(r.date)),td(esc(app.name('varieties',r.varietyId))),td(esc(app.name('factories',r.factoryId))),td(f0(x.stockFin),'v'),td(f0(x.stockFin/x.cartonKg),'v'),td(f0(x.stockFarz),'v'),td(f0(x.perTon),'v'),td(f0(x.stockVal),'v b')])});
  let RV=0;const rr=D.purchases.filter(p=>C.P[p.id].remain>0.5).map(p=>{const x=C.P[p.id];RV+=x.remain*x.costKg;return tr([td('#'+p.no+' '+E.dmy(p.date)),td(esc(app.name('parties',p.supplierId))),td(esc(app.name('factories',p.factoryId))),td(f0(x.remain),'v'),td(f3(x.costKg),'v'),td(f0(x.remain*x.costKg),'v b')])});
  let SV=0;const sr=[];D.items.forEach(it=>{const s=C.SUP[it.id];D.factories.forEach(l=>{const q=s.loc[l.id]||0;if(Math.abs(q)>0.0001){SV+=q*s.avg;sr.push(tr([td(esc(it.name)),td(esc(l.name)),td(f0(q)+' '+esc(it.unit),'v'),td(f3(s.avg),'v'),td(f0(q*s.avg),'v b')]))}})});
  b.push(H(boxes([['إنتاج نهائي',f3(F/1000)+' طن',f0(V)+' ج بالتكلفة',1],['فرزة',f0(Z)+' كجم'],['خام مستني تشغيل',f0(RV)+' ج'],['مستلزمات',f0(SV)+' ج']])));
  b.push(T('الإنتاج النهائي والفرزة لكل تشغيلة ومكان',th(['التشغيلة','الصنف','المكان','نهائي كجم','كراتين','فرزة كجم','ج/طن','القيمة ج']),fr.length?fr:[tr([td('مفيش'),td(''),td(''),td(''),td(''),td(''),td(''),td('')])],'','xs'));
  b.push(T('الخام اللي لسه ما اتشغلش',th(['الفاتورة','المورد','المصنع','باقي كجم','ج/كجم','القيمة ج']),rr.length?rr:[tr([td('مفيش'),td(''),td(''),td(''),td(''),td('')])],'','sm'));
  b.push(T('المستلزمات في كل مخزن',th(['الصنف','المخزن','الكمية','متوسط السعر','القيمة ج']),sr.length?sr:[tr([td('مفيش'),td(''),td(''),td(''),td('')])],'','sm'));
  return{title:'تقرير المخزون',meta:'حتى '+E.dmy(E.cairoIso()),blocks:b,file:'stock'}};

/* ===== تقسيم الصفحات ===== */
function shell(doc){const d=new Date();return '<div class="rp"><img class="bg" src="img/page.jpg" alt=""><div class="ph"><div><h1>'+doc.title+'</h1><div class="meta">'+doc.meta+'</div></div><div class="dt num">'+E.dmy(E.cairoIso(d))+' '+E.cairoTime(d)+'<br><small>بتوقيت القاهرة</small></div></div><div class="pbody"></div>'+
  '<div class="sign"><img src="img/mark.jpg" alt=""><div><b>يعتمد: شركة الراشد للتجارة</b><span>الحسابات والتكاليف</span></div></div><div class="pno"></div></div>'}
async function paginate(doc){const holder=document.createElement('div');holder.className='rhold';document.body.appendChild(holder);
  if(document.fonts&&document.fonts.ready)await document.fonts.ready;
  const pages=[];let body;const np=()=>{holder.insertAdjacentHTML('beforeend',shell(doc));const p=holder.lastElementChild;pages.push(p);body=p.querySelector('.pbody')};
  const over=()=>body.scrollHeight>body.clientHeight+1;np();
  const startT=(t,first)=>{const w=document.createElement('div');w.className='rt';w.innerHTML=(t.title?h3(t.title+(first?'':' (تابع)')):'')+'<table class="'+t.cls+'"><thead>'+t.head+'</thead><tbody></tbody></table>';body.appendChild(w);return w};
  doc.blocks.forEach(b=>{
    if(b.table){const t=b.table;let w=startT(t,true);const tb=()=>w.querySelector('tbody');
      let first=true,onPage=[];
      const addRow=html=>{tb().insertAdjacentHTML('beforeend',html);onPage.push(html);if(over()){tb().lastElementChild.remove();onPage.pop();
        if(onPage.length<2&&body.children.length>1){const keep=onPage;w.remove();np();w=startT(t,first);keep.forEach(h=>tb().insertAdjacentHTML('beforeend',h));onPage=keep.slice()}
        else{np();w=startT(t,false);first=false;onPage=[]}
        tb().insertAdjacentHTML('beforeend',html);onPage.push(html)}};
      if(over()){w.remove();np();w=startT(t,true)}
      t.rows.forEach(addRow);if(t.foot)addRow(t.foot)}
    else{body.insertAdjacentHTML('beforeend',b.html);if(over()&&body.children.length>1){body.lastElementChild.remove();np();body.insertAdjacentHTML('beforeend',b.html)}}});
  pages.forEach((p,i)=>p.querySelector('.pno').textContent='صفحة '+(i+1)+' من '+pages.length+' · v'+A().VER);
  const html=pages.map(p=>p.outerHTML);holder.remove();return html}

async function open(kind,o){const doc=BUILD[kind]&&BUILD[kind](o||{});if(!doc){alert('مفيش بيانات للتقرير');return}
  CUR={doc,kind,o};const pages=await paginate(doc);CUR.pages=pages;
  $('#pages').innerHTML=pages.map(h=>'<div class="pw">'+h+'</div>').join('');$('#rep').hidden=false;document.body.classList.add('modal');fit();$('#rep').scrollTop=0;window.__repReady=pages.length}
function fit(){const w=Math.min(window.innerWidth-16,794),s=w/794;document.querySelectorAll('#pages .pw').forEach(p=>{p.style.width=w+'px';p.style.height=(1123*s)+'px';p.firstElementChild.style.transform='scale('+s+')'})}
window.addEventListener('resize',()=>{if(!$('#rep').hidden)fit()});
function close(){$('#rep').hidden=true;$('#pages').innerHTML='';document.body.classList.remove('modal')}
async function makePdf(){const holder=document.createElement('div');holder.className='rhold';holder.innerHTML=CUR.pages.join('');document.body.appendChild(holder);
  const imgs=[...holder.querySelectorAll('img')];await Promise.all(imgs.map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));
  const pdf=new window.jspdf.jsPDF({unit:'mm',format:'a4',compress:true});const ps=holder.querySelectorAll('.rp');
  for(let i=0;i<ps.length;i++){const c=await html2canvas(ps[i],{scale:2,backgroundColor:'#fff',useCORS:true,logging:false});if(i)pdf.addPage();pdf.addImage(c.toDataURL('image/jpeg',0.9),'JPEG',0,0,210,297)}
  holder.remove();return pdf}
async function share(){$('#busy').hidden=false;try{const pdf=await makePdf();const blob=pdf.output('blob'),nm=CUR.doc.file+'_'+E.dmy(E.cairoIso()).replace(/\//g,'-')+'.pdf';window.__lastPdf={name:nm,size:blob.size,pages:CUR.pages.length};
  const file=(()=>{try{return new File([blob],nm,{type:'application/pdf'})}catch(e){return null}})();$('#busy').hidden=true;
  if(file&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:nm})}catch(e){}return}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=nm;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
  catch(e){$('#busy').hidden=true;alert('ماقدرتش أجهز الـ PDF: '+e)}}
document.addEventListener('click',e=>{const t=e.target.closest('#rClose,#rShare,#rPrint');if(!t)return;if(t.id==='rClose')close();if(t.id==='rShare')share();if(t.id==='rPrint')window.print()});
window.RPT={open,close,makePdf,share,BUILD,paginate};
})();
