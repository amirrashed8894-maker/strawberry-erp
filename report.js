/* التقارير — صفحات A4 على ورق الراشد، الملخص الأول وبعدين التفاصيل، ومشاركة PDF */
(function(){
'use strict';
const E=ERP,n=E.n,fm=E.fmt;const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const f0=x=>fm(x,0),f2=x=>fm(x,2),f1=x=>fm(x,1),f3=x=>fm(x,3);
const sg=x=>(x>0.5?'+':'')+f0(x);
const A=()=>window.APP;
let CUR=null;
/* عزل الأرقام عن النص العربي عشان «2.00%» و«$1,150» مايتقلبوش */
const bd=h=>String(h==null?'':h).replace(/(<[^>]*>|&[#\w]+;)|(\$?[0-9A-Za-z][0-9A-Za-z,.\/\-_]*%?)/g,(m,tag,num)=>tag?tag:'<bdi>'+num+'</bdi>');
function td(v,c){return '<td'+(c?' class="'+c+'"':'')+'>'+bd(v)+'</td>'}
function tdc(v,span,c){return '<td colspan="'+span+'"'+(c?' class="'+c+'"':'')+'>'+bd(v)+'</td>'}
function tr(cells,c){return '<tr'+(c?' class="'+c+'"':'')+'>'+cells.join('')+'</tr>'}
function th(list){return '<tr>'+list.map(x=>'<th>'+x+'</th>').join('')+'</tr>'}
function boxes(list){return '<div class="rk k'+list.length+'">'+list.map(b=>'<div class="m'+(b[3]?' main':'')+'"><span>'+bd(b[0])+'</span><b class="num">'+bd(b[1])+'</b>'+(b[2]?'<em class="num">'+bd(b[2])+'</em>':'')+'</div>').join('')+'</div>'}
function h3(t){return '<h3>'+t+'</h3>'}
function note(t){return '<div class="rn">'+bd(t)+'</div>'}
function T(title,head,rows,foot,cls,pre){return{table:{title,head,rows,foot,cls:cls||'',pre:pre||''}}}
function H(html){return{html}}
const methodTxt=m=>m==='joint'?'الفرزة: توزيع التكلفة على النهائي والفرزة بالوزن':'الفرزة: صافي بيعها الفعلي بيتخصم من تكلفة التشغيلة';
function farzWarn(x){if(x.method==='joint'||x.status==='final')return null;return H(bd('<div class="rwarn"><b>⚠ '+esc(x.farzWarn)+'</b> — '+esc(x.costLabel)+'. الفرزة '+f0(x.farz)+' كجم: اتباع '+f0(x.farzSoldKg)+' كجم'+(x.farzSoldKg>0.005?' بمتوسط صافي '+f2(x.farzAvg)+' ج/كجم':'')+'، والباقي '+f0(x.farzUnsold)+' كجم '+(x.status==='provisional'?'بسعر مؤقت '+f2(x.farzTemp)+' ج/كجم':'من غير سعر')+'.</div>'))}
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
  x.supplies.forEach(s=>line('&nbsp;&nbsp;'+esc(s.name)+' — '+(s.qty%1?fm(s.qty,3).replace(/0+$/,'').replace(/\.$/,''):fm(s.qty,0))+' '+esc(s.unit)+' × '+f3(s.avg)+' ('+esc(app.name('factories',s.loc))+')',s.cost));
  rows.push(tr([td('تكاليف التشغيل'),td(f2(x.costsT),'v'),td(T1?f0(x.costsT/T1):'-','v'),td(x.total?f1(x.costsT/x.total*100)+'%':'','v')],'g'));
  x.costs.forEach(c=>line('&nbsp;&nbsp;'+esc(c.name)+(c.partyId?' — '+esc(app.name('parties',c.partyId)):''),c.amount));
  rows.push(tr([td('إجمالي تكلفة التشغيلة'),td(f2(x.total),'v'),td(T1?f0(x.total/T1):'-','v'),td('100%','v')],'tt'));
  if(x.method==='joint')rows.push(tr([td('− نصيب الفرزة بالوزن ('+f0(x.farz)+' كجم × '+f3(x.farzKgCost)+')'),td(f2(-x.farzCost),'v'),td(T1?f0(-x.farzCost/T1):'-','v'),td('','v')]));
  else{(x.farzSales||[]).forEach(z=>rows.push(tr([td('− فرزة مباعة: بيع #'+z.no+' '+E.dmy(z.date)+' — '+f0(z.kg)+' كجم (صافي '+f2(z.kg?z.net/z.kg:0)+' ج/كجم)'),td(f2(-z.net),'v'),td(T1?f0(-z.net/T1):'-','v'),td('','v')])));
    if(x.farzUnsold>0.005)rows.push(tr([td(x.status==='provisional'?'− فرزة باقية '+f0(x.farzUnsold)+' كجم × سعر مؤقت '+f2(x.farzTemp):'فرزة باقية '+f0(x.farzUnsold)+' كجم — لسه مالهاش سعر (مش مخصومة)'),td(f2(x.status==='provisional'?-x.farzUnsold*x.farzTemp:0),'v'),td(T1&&x.status==='provisional'?f0(-x.farzUnsold*x.farzTemp/T1):'-','v'),td('','v')]))}
  rows.push(tr([td('تكلفة الإنتاج النهائي ('+(x.status==='final'?'نهائي':'مبدئي')+')'),td(f2(x.finCost),'v'),td(f0(x.perTon),'v b'),td('','v')],'tt'));
  b.push(T('تفاصيل التكلفة',th(['البند','المبلغ ج','ج / طن صادر','من الإجمالي']),rows,'','sm'));
  if(r.autoSup&&((r.supplies||[]).some(l=>l.auto)||(r.costs||[]).some(c=>c.auto))){const bo=E.bomOf(app.S()),N=x.cartons,pp=+bo.perPal||120,pc=+bo.perCont||2400,iss=app.C.issue[r.id]||[];
    const bt=base=>base==='pal'?'لكل باليت — '+fm(N/pp,3)+' باليت':base==='cont'?'لكل حاوية — '+fm(N/pc,3)+' حاوية':'لكل كرتونة — '+f0(N)+' كرتونة';const BR=[];let tS=0,tC=0;
    (r.supplies||[]).forEach((l,i)=>{if(!l.auto)return;const bl=bo.lines.find(z=>z.k===l.bk)||{},it=app.get('items',l.itemId)||{},is=iss[i]||{};tS+=is.cost||0;BR.push(tr([td(esc(it.name||'')+(l.ovr?' (متعدل يدوي)':'')),td(bt(bl.base)),td(fm(+l.qty,(+l.qty)%1?3:0)+' '+esc(it.unit||''),'v'),td(f3(is.avg||0),'v'),td(f2(is.cost||0),'v')]))});
    (r.costs||[]).forEach(c=>{if(!c.auto)return;const sv=bo.services.find(z=>z.k===c.bk)||{};tC+=+c.amount||0;BR.push(tr([td(esc(c.name)+(c.ovr?' (متعدل يدوي)':'')+(c.partyId?' — '+esc(app.name('parties',c.partyId)):'')),td(bt(sv.base)),td(sv.amount!=null?f2(+sv.amount)+' ج':'','v'),td(''),td(f2(+c.amount||0),'v')]))});
    b.push(T('مكونات التعبئة المحسوبة تلقائي ('+esc(r.bomSrc||bo.src||'')+')',th(['البند','الأساس','الكمية / السعر','متوسط الوحدة','التكلفة ج']),BR,tr([td('الإجمالي'),td(''),td(''),td(''),td(f2(tS+tC),'v b')],'tt'),'xs'));
    b.push(H(note('مستلزمات التشغيل = الكمية لكل كرتونة × '+f0(N)+' كرتونة، متسعرة بمتوسط المخزن وقت الصرف، وخدمات التشغيل (اللزق ورسم تعبئة المصنع) على الكرتونة. الباليتات والزوايا والستيكر الكبير والداتا لوجر والاسترتش وخدمات الحاوية (عمولات، أوراق، إكراميات) مش في تكلفة التشغيلة — بتتصرف عند التحميل لكل حاوية وبتدخل ربحية البيع.')))}
  b.push(T('توزيع التكلفة على الموردين',th(['المورد','نسبة الخام','الخام ج','النقل ج','نصيب المشترك ج','الإجمالي ج',x.method==='joint'?'كجم للنهائي':'− الفرزة ج','للنهائي ج']),
    x.rows.map(s=>tr([td(esc(s.name)),td(f1(s.share*100)+'%','v'),td(f0(s.rawCost),'v'),td(f0(s.trans),'v'),td(f0(s.shared),'v'),td(f0(s.total),'v'),td(x.method==='joint'?f0(s.fin):f0(-s.credit),'v'),td(f0(s.finCost),'v b')])),
    tr([td('الإجمالي'),td('100%','v'),td(f0(x.rawCost),'v'),td(f0(x.trans),'v'),td(f0(x.shared),'v'),td(f0(x.total),'v'),td(x.method==='joint'?f0(x.fin):f0(-x.farzCost),'v'),td(f0(x.finCost),'v b')],'tt'),'xs'));
  b.push(T('فواتير الخام الداخلة',th(['الفاتورة','التاريخ','المورد','كجم','سعر','خصم','ج/كجم فعلي','نقل/كجم']),
    x.rows.flatMap(s=>s.purchases.map(p=>tr([td('#'+p.no),td(E.dmy(p.date),'v'),td(esc(s.name)),td(f0(p.kg),'v'),td(f2(p.price),'v'),td(f2(p.d)+'%','v'),td(f3(p.unit),'v'),td(f3(p.transKg),'v')]))),'','xs'));
  if(x.cmp)cmpBlocks(x).forEach(z=>b.push(z));
  {const E2=[];const addE=(lbl,rec)=>{A().editNotes(rec).forEach(t=>E2.push(lbl+': '+t))};addE('التشغيلة #'+r.no,r);
   x.rows.forEach(s=>s.purchases.forEach(q=>addE('فاتورة خام #'+q.no,app.get('purchases',q.purchaseId))));
   D.transports.filter(t=>t.runId===r.id||(t.purchaseIds||[]).some(id=>x.rows.some(s=>s.purchases.some(q=>q.purchaseId===id)))).forEach(t=>addE('نقل #'+t.no,t));
   if(E2.length)b.push(H('<h3>سجل التعديلات</h3><div class="enote">'+E2.map(esc).join('<br>')+'</div>'))}
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
/* ===== التفقيط (المبلغ بالحروف) ===== */
const W1=['','واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة','عشرة','أحد عشر','اثنا عشر','ثلاثة عشر','أربعة عشر','خمسة عشر','ستة عشر','سبعة عشر','ثمانية عشر','تسعة عشر'];
const W10=['','','عشرون','ثلاثون','أربعون','خمسون','ستون','سبعون','ثمانون','تسعون'];
const W100=['','مائة','مائتان','ثلاثمائة','أربعمائة','خمسمائة','ستمائة','سبعمائة','ثمانمائة','تسعمائة'];
function w999(x){const h=Math.floor(x/100),r=x%100,p=[];if(h)p.push(W100[h]);if(r){if(r<20)p.push(W1[r]);else{const u=r%10,t=Math.floor(r/10);p.push(u?W1[u]+' و'+W10[t]:W10[t])}}return p.join(' و')}
function wGroup(x,one,two,few,many){if(x===1)return one;if(x===2)return two;if(x>=3&&x<=10)return w999(x)+' '+few;return w999(x)+' '+many}
function intWords(v){if(v===0)return 'صفر';const G=[[1e9,'مليار','ملياران','مليارات','مليار'],[1e6,'مليون','مليونان','ملايين','مليون'],[1e3,'ألف','ألفان','آلاف','ألف']];const p=[];
  G.forEach(g=>{const q=Math.floor(v/g[0]);if(q){p.push(wGroup(q%1000,g[1],g[2],g[3],g[4]));v-=q*g[0]}});if(v)p.push(w999(v));return p.join(' و')}
function moneyWords(x,cur){x=Math.round(Math.abs(+x||0)*100);const L=Math.floor(x/100),pi=x%100;const u=cur==='USD'?[' دولار أمريكي',' سنت']:[' جنيه مصري',' قرش'];return 'فقط '+(L||!pi?intWords(L)+u[0]+(pi?' و':''):'')+(pi?intWords(pi)+u[1]:'')+' لا غير'}
const KIND={purchase:'فاتورة خام',transport:'نقل',supplyIn:'فاتورة مستلزمات',runCost:'تكلفة تشغيل',sale:'فاتورة بيع',saleExp:'مصروف بيع',payment:'دفعة',open:'رصيد افتتاحي',loadSvc:'خدمة تحميل'};
const isCust=t=>t==='export'||t==='farz';
/* ملاحظة التعديل الخفيفة — للتقارير الداخلية وكشوف الموردين بس، أبدًا في أي حاجة للعميل */
function enote(rec,max){const L=A().editNotes(rec,max);return L.length?'<div class="enote">'+L.map(esc).join('<br>')+'</div>':''}
function infoGrid(cells){return '<table class="rgrid"><tbody>'+cells.filter(c=>c&&c[1]!=null&&c[1]!=='').reduce((a,c,i,L)=>{if(i%2===0)a.push('<tr><th>'+c[0]+'</th><td>'+c[1]+'</td>'+(L[i+1]?'<th>'+L[i+1][0]+'</th><td>'+L[i+1][1]+'</td>':'<th></th><td></td>')+'</tr>');return a},[]).join('')+'</tbody></table>'}

/* ===== كشف الحساب ===== */
BUILD.stmt=function(o){const app=A(),p=app.get('parties',o.id);if(!p)return null;const st=app.statement(p.id,o.from,o.to);const b=[];const cust=isCust(p.type);
  const openRow=st.rows.filter(e=>e.kind==='open'),rows=st.rows.filter(e=>e.kind!=='open');
  const open=st.open+openRow.reduce((a,e)=>a+e.dr-e.cr,0);let dr=0,cr=0;rows.forEach(e=>{dr+=e.dr;cr+=e.cr});const close=open+dr-cr;
  const side=v=>Math.abs(v)<0.005?'':v>0?'عليه':'له';const amt=v=>f2(Math.abs(v))+(Math.abs(v)<0.005?'':' '+side(v));
  b.push(H(infoGrid([['اسم الحساب','<b>'+esc(p.name)+'</b>'],['نوع الحساب',E.PTYPES[p.type]],p.nameEn?['الاسم بالإنجليزي',esc(p.nameEn)]:null,['الفترة',per(o.from,o.to).replace('الفترة: ','')],
    p.cr?['سجل تجاري',esc(p.cr)]:null,p.tax?['بطاقة ضريبية',esc(p.tax)]:null,p.address?['العنوان',esc(p.address)]:null,p.phone?['التليفون',esc(p.phone)]:null,['عملة الكشف','جنيه مصري'],['عدد الحركات',String(rows.length)],['تاريخ الإصدار',E.dmy(E.cairoIso())]])));
  b.push(H(boxes([['الرصيد الختامي'+(o.to?' في '+E.dmy(o.to):''),f2(Math.abs(close))+' ج',Math.abs(close)<0.005?'متسدد':(close>0?'عليه — '+(cust?'مستحق لنا على العميل':'مستحق لنا عند المورد'):'له — '+(cust?'مستحق للعميل علينا':'مستحق للمورد علينا')),1],['رصيد أول المدة',amt(open)],['مدين خلال الفترة',f2(dr)],['دائن خلال الفترة',f2(cr)]])));
  const R=[];let bal=open,i=0;
  const oe=openRow[0]||(o.from?null:(app.C.L[p.id]||[]).find(e=>e.kind==='open')),on=oe&&!cust?app.stmtNotes(oe,2):[];
  R.push(tr([td(''),td(o.from?E.dmy(o.from):(oe&&oe.date?E.dmy(oe.date):''),'v'),td('رصيد افتتاحي'),td(''),td((o.from?'رصيد منقول قبل '+E.dmy(o.from)+(openRow[0]?' + '+esc(openRow[0].info):''):(oe?esc(oe.info):'رصيد أول المدة'))+(on.length?'<div class="enote">'+on.map(esc).join('<br>')+'</div>':'')),td(open>0?f2(open):'','v'),td(open<0?f2(-open):'','v'),td(amt(open),'v')],'g'));
  rows.forEach(e=>{bal+=e.dr-e.cr;i++;R.push(tr([td(i,'v c'),td(E.dmy(e.date),'v'),td(esc(e.doc||KIND[e.kind]||'')),td(esc(e.no==null?'':e.no),'v c'),td(esc(e.info||e.desc)+(cust?'':(L=>L.length?'<div class="enote">'+L.map(esc).join('<br>')+'</div>':'')(app.stmtNotes(e,2)))),td(e.dr?f2(e.dr):'','v'),td(e.cr?f2(e.cr):'','v'),td(amt(bal),'v')]));(e.subs||[]).forEach(z=>R.push(tr([td(''),tdc(esc(z.i+'. '+z.txt),4,'d'),td(''),td(''),td('')],'sub')))});
  b.push(T('الحركات',th(['م','التاريخ','المستند','رقم','البيان','مدين','دائن','الرصيد']),R,tr([td(''),td(''),td('الإجمالي'),td(''),td(rows.length+' حركة + رصيد أول المدة'),td(f2(dr+(open>0?open:0)),'v'),td(f2(cr+(open<0?-open:0)),'v'),td(amt(close),'v b')],'tt'),'sm st'));
  b.push(H(bd('<div class="rwords"><b>الرصيد الختامي بالحروف:</b> '+(Math.abs(close)<0.005?'صفر — الحساب متسدد':moneyWords(close)+' — '+(close>0?(cust?'مستحق لشركة الراشد للتجارة على العميل':'مستحق لشركة الراشد للتجارة عند المورد'):(cust?'مستحق للعميل على شركة الراشد للتجارة':'مستحق للمورد على شركة الراشد للتجارة')))+'</div>')));
  b.push(H(note('مدين = عليه (مستحق لشركة الراشد)، دائن = له (مستحق على شركة الراشد). المبالغ بالجنيه المصري؛ الحركات بالدولار متحولة بالسعر المسجل في كل حركة. التواريخ يوم/شهر/سنة.')));
  return{title:'كشف حساب '+(cust?'عميل':'مورد')+' — '+esc(p.name),meta:per(o.from,o.to),blocks:b,file:'statement-'+(cust?'customer':'supplier')}};

/* ===== فاتورة البيع (للعميل) — من غير أي إشارة لتعديل، ولا تكلفة ولا تشغيلات ===== */
BUILD.inv=function(o){const app=A(),s=app.get('sales',o.id);if(!s)return null;const x=app.C.SL[s.id];if(!x)return null;const p=app.get('parties',s.customerId)||{};const b=[];
  const usd=x.cur==='USD',$=usd?'$':'',u=usd?'':' ج',money=v=>$+f2(v)+u,pr=v=>$+E.pfmt(v)+u;const inv=x.invNo||('#'+s.no);
  b.push(H(infoGrid([['رقم الفاتورة','<b>'+esc(inv)+'</b>'],['التاريخ',E.dmy(s.date)],['العميل','<b>'+esc(p.name||'—')+'</b>'],p.nameEn?['Customer',esc(p.nameEn)]:null,p.address?['العنوان',esc(p.address)]:null,p.cr?['سجل تجاري',esc(p.cr)]:null,p.tax?['بطاقة ضريبية',esc(p.tax)]:null,
    ['العملة',usd?'دولار أمريكي (USD)':'جنيه مصري'],x.cont?['عدد الحاويات',String(x.nCont)]:null,['إجمالي الكمية',x.kind==='export'?f3(x.tons)+' طن ('+f0(x.kg)+' كجم)':f0(x.kg)+' كجم']])));
  b.push(H(boxes([['إجمالي الفاتورة',money(x.amount),usd&&x.rate?'المعادل بالجنيه '+f2(x.rev)+' ج — سعر الدولار '+f2(x.rate):'',1],x.cont?['عدد الحاويات',String(x.nCont)]:['عدد السطور',String(x.lines.length)],['إجمالي الكمية',x.kind==='export'?f3(x.tons)+' طن':f0(x.kg)+' كجم'],['التاريخ',E.dmy(s.date)]])));
  let head,rows,foot;
  if(x.cont){head=th(['م','رقم الحاوية','رقم البوليصة','الكمية (طن)','الكمية (كجم)','سعر الكيلو','القيمة']);
    rows=x.lines.map((l,i)=>tr([td(i+1,'v c'),td(esc(l.cont||'—'),'c'),td(esc(l.bl||'—'),'c'),td(f3(l.tons),'v'),td(f0(l.kg),'v'),td(pr(l.price),'v'),td(money(l.amount),'v')]));
    foot=tr([td(''),td('الإجمالي — '+E.contN(x.nCont)),td(''),td(f3(x.tons),'v b'),td(f0(x.kg),'v'),td(''),td(money(x.amount),'v b')],'tt')}
  else if(x.kind==='export'){head=th(['م','البيان','كراتين','الكمية (كجم)','سعر الطن','القيمة']);
    rows=x.lines.map((l,i)=>tr([td(i+1,'v c'),td('إنتاج فراولة مجمدة'),td(f0(l.cartons),'v'),td(f0(l.kg),'v'),td(money(l.price),'v'),td(money(l.amount),'v')]));
    foot=tr([td(''),td('الإجمالي'),td(f0(x.lines.reduce((a,l)=>a+l.cartons,0)),'v'),td(f0(x.kg),'v b'),td(''),td(money(x.amount),'v b')],'tt')}
  else{head=th(['م','البيان','الكمية (كجم)','سعر الكيلو','القيمة']);
    rows=x.lines.map((l,i)=>tr([td(i+1,'v c'),td('فرزة فراولة'),td(f0(l.kg),'v'),td(pr(l.price),'v'),td(money(l.amount),'v')]));
    foot=tr([td(''),td('الإجمالي'),td(f0(x.kg),'v b'),td(''),td(money(x.amount),'v b')],'tt')}
  b.push(T(x.cont?'الحاويات':'البيان',head,rows,foot,'sm inv'));
  b.push(H(bd('<div class="rwords"><b>إجمالي الفاتورة بالحروف:</b> '+moneyWords(x.amount,x.cur)+'</div>')));
  b.push(H(note((x.cont?'الكمية بالطن (1 طن = 1000 كجم) والسعر للكيلو؛ القيمة = الطن × 1000 × سعر الكيلو. ':'')+'التواريخ يوم/شهر/سنة.')));
  return{title:(x.kind==='farz'?'فاتورة بيع فرزة':'فاتورة بيع تصدير')+' — '+esc(inv),meta:esc(p.name||'')+' · '+E.dmy(s.date),blocks:b,file:'invoice-'+String(inv).replace(/[^A-Za-z0-9_-]/g,'')}};

/* ===== الربحية ===== */
function profitData(o){const app=A(),D=app.D,C=app.C;const inP=s=>(!o.from||s.date>=o.from)&&(!o.to||s.date<=o.to);
  const sales=D.sales.filter(inP).sort((a,b)=>(a.date||'').localeCompare(b.date||'')||n(a.no)-n(b.no));
  const L=[];sales.forEach(s=>{const x=C.SL[s.id];x.lines.forEach((l0,li)=>(l0.parts||[l0]).forEach(q=>{/* v1.2.8: كل جزء من التوزيع على التشغيلات سطر لوحده بتكلفة تشغيلته */const l=l0.parts?Object.assign({},l0,q):l0;const r=C.R[l.runId]||{},run=app.get('runs',l.runId)||{};const ex=x.rev?x.exp*l.egp/x.rev:(x.lines.length?x.exp/x.lines.length*(q.share==null?1:q.share):0);
    L.push({s,x,l,r,run,li,exp:ex,load:l.load||0,profit:l.egp-l.cogs-ex-(l.load||0),variety:app.name('varieties',run.varietyId),prov:r.method!=='joint'&&r.status&&r.status!=='final'})}))});
  const tot=totOf(L);
  const prov=[...new Set(L.filter(z=>z.prov).map(z=>z.l.runId))].map(id=>C.R[id]);return{app,C,sales,L,tot,prov}}
function totOf(L){const tot={rev:0,cogs:0,exp:0,load:0,kg:0,fin:0,farz:0,finRev:0,finCost:0,finLoad:0};L.forEach(z=>{tot.rev+=z.l.egp;tot.cogs+=z.l.cogs;tot.exp+=z.exp;tot.load+=z.load;tot.kg+=z.l.kg;if(z.x.kind==='farz')tot.farz+=z.l.kg;else{tot.fin+=z.l.kg;tot.finRev+=z.l.egp;tot.finCost+=z.l.cogs+z.exp+z.load;tot.finLoad+=z.load}});tot.profit=tot.rev-tot.cogs-tot.exp-tot.load;return tot}
function grp(L,key,label){const m={},order=[];L.forEach(z=>{const k=key(z);if(!m[k]){m[k]={k,label:label(z),rev:0,cogs:0,exp:0,load:0,kg:0,ids:new Set(),prov:false};order.push(k)}const g=m[k];g.rev+=z.l.egp;g.cogs+=z.l.cogs;g.exp+=z.exp;g.load+=z.load;g.kg+=z.l.kg;g.ids.add(z.s.id);if(z.prov)g.prov=true});return order.map(k=>m[k])}
const PH=['','الكمية كجم','الإيراد ج','التكلفة المخصصة ج','مصروفات البيع ج','تكلفة التحميل ج','الربح ج','الهامش'];
function gRows(G,tot,first){const rows=G.map(g=>{const q=g.rev-g.cogs-g.exp-g.load;return tr([td(esc(g.label)+(g.prov?' <span class="flag">مبدئي</span>':'')+(first==='ops'?' <small>('+g.ids.size+' عملية)</small>':'')),td(f0(g.kg),'v'),td(f0(g.rev),'v'),td(f0(g.cogs),'v'),td(f0(g.exp),'v'),td(f0(g.load),'v'),td(f0(q),'v b'),td(g.rev?f1(q/g.rev*100)+'%':'-','v')])});
  return rows}
function gFoot(t){return tr([td('الإجمالي'),td(f0(t.kg),'v'),td(f0(t.rev),'v'),td(f0(t.cogs),'v'),td(f0(t.exp),'v'),td(f0(t.load),'v'),td(f0(t.profit),'v b'),td(t.rev?f1(t.profit/t.rev*100)+'%':'-','v')],'tt')}
function provWarn(prov){return prov.length?H(bd('<div class="rwarn"><b>⚠ سعر الفرزة لسه ما اتحددش — التكلفة مبدئية</b> في التشغيلات: '+prov.map(x=>'#'+x.no+' ('+esc(x.costLabel)+')').join('، ')+'. السطور المعلّمة «مبدئي» ربحها هيتغير لما الفرزة تتباع أو يتحدد سعرها.</div>')):null}
const MON=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
BUILD.profitSum=function(o){const {app,C,sales,L,tot,prov}=profitData(o);const b=[];const w=provWarn(prov);if(w)b.push(w);
  b.push(H(boxes([['صافي الربح',f0(tot.profit)+' ج',tot.rev?'هامش '+f1(tot.profit/tot.rev*100)+'% من المبيعات':'',1],['المبيعات',f0(tot.rev)+' ج',sales.length+' عملية بيع'],['التكلفة المخصصة',f0(tot.cogs)+' ج','ومصروفات البيع '+f0(tot.exp)+' ج'+(tot.load?' وتكلفة التحميل '+f0(tot.load)+' ج':'')],['المباع تصدير',f3(tot.fin/1000)+' طن','وفرزة '+f0(tot.farz)+' كجم']])));
  b.push(T('حسب الفترة (الشهر)',th(['الشهر'].concat(PH.slice(1))),gRows(grp(L,z=>(z.s.date||'').slice(0,7),z=>{const m=/^(\d{4})-(\d{2})/.exec(z.s.date||'');return m?MON[+m[2]-1]+' '+m[1]:'—'}),tot),gFoot(tot),'sm'));
  b.push(T('حسب العميل',th(['العميل'].concat(PH.slice(1))),gRows(grp(L,z=>z.s.customerId,z=>{const p=app.get('parties',z.s.customerId)||{};return (p.name||'—')+(p.type==='farz'?' (فرزة)':'')}),tot,'ops'),gFoot(tot),'sm'));
  b.push(T('حسب الصنف',th(['الصنف'].concat(PH.slice(1))),gRows(grp(L,z=>z.variety,z=>z.variety),tot),gFoot(tot),'sm'));
  b.push(T('حسب نوع البيع',th(['النوع'].concat(PH.slice(1))),gRows(grp(L,z=>z.x.kind,z=>z.x.kind==='farz'?'فرزة':'تصدير (إنتاج نهائي)'),tot),gFoot(tot),'sm'));
  const ex=tot.fin?[['متوسط سعر بيع طن التصدير',f0(tot.finRev/tot.fin*1000)+' ج'],['متوسط تكلفة طن التصدير المباع (مع مصروفات البيع والتحميل)',f0(tot.finCost/tot.fin*1000)+' ج'],['منها تكلفة التحميل للطن',f0(tot.finLoad/tot.fin*1000)+' ج'],['ربح طن التصدير',f0((tot.finRev-tot.finCost)/tot.fin*1000)+' ج']]:[];
  if(ex.length)b.push(T('مؤشرات طن التصدير',th(['المؤشر','القيمة']),ex.map(r=>tr([td(r[0]),td(r[1],'v b')])),'','sm'));
  b.push(H(note('التكلفة المخصصة لكل بيع = الكمية × تكلفة الكيلو في التشغيلة اللي البيع طالع منها (النهائي بتكلفة الطن الصادر، والفرزة '+(C.method==='joint'?'بنفس تكلفة الكيلو بالوزن':'بمتوسط صافي بيعها، فربح الفرزة صفر لأن قيمتها اتخصمت من تكلفة النهائي')+'). مصروفات البيع متوزعة على سطور البيع بنسبة الإيراد، وتكلفة التحميل (مستلزمات وخدمات الحاوية) على الحاوية بتاعتها. الدولار متحول بالسعر المسجل في كل بيع. التفاصيل في «الربحية — مفصل».')));
  return{title:'تقرير الربحية — مجمل',meta:per(o.from,o.to)+' · '+methodTxt(C.method),blocks:b,file:'profitability-summary'}};
BUILD.profit=BUILD.profitSum;
BUILD.profitDet=function(o){const pd=profitData(o),{app,C}=pd,D=app.D;let sel=o.id&&o.id!=='all'?String(o.id):'all';
  const shAll=E.contSheets(D,C,o);let sh=selPick(shAll,sel);if(sel!=='all'&&!sh.length){sel='all';sh=shAll}
  let L=pd.L,sales=pd.sales;
  if(sel!=='all'){const ok=new Set(sh.map(z=>z.saleId+':'+z.li));L=L.filter(z=>ok.has(z.s.id+':'+z.li));const ids=new Set(L.map(z=>z.s.id));sales=sales.filter(s=>ids.has(s.id))}
  const tot=totOf(L),prov=[...new Set(L.filter(z=>z.prov).map(z=>z.l.runId))].map(id=>C.R[id]);
  const b=[];const w=provWarn(prov);if(w)b.push(w);
  b.push(H(boxes([['صافي الربح',f0(tot.profit)+' ج',tot.rev?'هامش '+f1(tot.profit/tot.rev*100)+'%':'',1],['المبيعات',f0(tot.rev)+' ج',sales.length+' عملية · '+f3(tot.kg/1000)+' طن'],['التكلفة الكلية',f0(tot.cogs+tot.exp+tot.load)+' ج','إنتاج '+f0(tot.cogs)+' ج'],['التحميل ومصروفات البيع',f0(tot.load+tot.exp)+' ج','تحميل '+f0(tot.load)+' · مصروفات '+f0(tot.exp)]])));
  /* جدول واحد بسيط: الفاتورة وتحتها حاوياتها — 6 أعمدة */
  const R=[],cst=z=>z.l.cogs+z.exp+z.load;
  sales.forEach(s=>{const x=C.SL[s.id],cu=app.get('parties',s.customerId)||{};const zs=L.filter(z=>z.s.id===s.id);const m={},ord=[];
    zs.forEach(z=>{let a=m[z.li];if(!a){a=m[z.li]={li:z.li,l:z.l,kg:0,rev:0,cost:0,runs:[],prov:false};ord.push(z.li)}a.kg+=z.l.kg;a.rev+=z.l.egp;a.cost+=cst(z);a.runs.push('#'+esc(z.run.no||'?'));if(z.prov)a.prov=true});
    const st={kg:0,rev:0,cost:0};zs.forEach(z=>{st.kg+=z.l.kg;st.rev+=z.l.egp;st.cost+=cst(z)});const any=zs.some(z=>z.prov);
    const lbl='<b>'+(x.invNo?'فاتورة '+esc(x.invNo):'بيع #'+esc(s.no))+'</b> · '+E.dmy(s.date)+' · '+esc(cu.name||'—')+' · '+(x.kind==='farz'?'فرزة':x.cont?'تصدير — '+E.contN(x.nCont):'تصدير')+(x.cur==='USD'?' · $ × '+f2(x.rate):'')+(any?' <span class="flag">مبدئي</span>':'');
    const lineLbl=a=>(x.cont?'حاوية '+esc(a.l.cont||'—'):x.kind==='farz'?'فرزة':'تصدير '+f0(a.l.cartons)+' كرتونة')+' · تشغيلة '+a.runs.join(' + ')+(a.prov?' <span class="flag">مبدئي</span>':'');
    const vals=(v,cls)=>[td(f3(v.kg/1000),'v'),td(f0(v.rev),'v'),td(f0(v.cost),'v'),td(f0(v.rev-v.cost),'v b'),td(v.rev?f1((v.rev-v.cost)/v.rev*100)+'%':'-','v')];
    if(ord.length===1){R.push(tr([td(lbl+'<br>'+lineLbl(m[ord[0]]))].concat(vals(st)),'g1'))}
    else{R.push(tr([td(lbl)].concat(vals(st)),'g'));ord.forEach(li=>R.push(tr([td(lineLbl(m[li]),'ind')].concat(vals(m[li])))))}});
  b.push(T('الربحية لكل فاتورة وحاوية',th(['الفاتورة / الحاوية','طن','الإيراد ج','التكلفة الكلية ج','الربح ج','%']),R,tr([td('الإجمالي — '+sales.length+' عملية'),td(f3(tot.kg/1000),'v'),td(f0(tot.rev),'v'),td(f0(tot.cogs+tot.exp+tot.load),'v'),td(f0(tot.profit),'v b'),td(tot.rev?f1(tot.profit/tot.rev*100)+'%':'-','v')],'tt'),'sm pd2'));
  b.push(H(note('التكلفة الكلية = تكلفة الإنتاج المخصصة (الكمية × تكلفة كيلو التشغيلة) + تكلفة التحميل + نصيبها من مصروفات البيع (بنسبة الإيراد). الدولار بالسعر المسجل في كل بيع. تفصيل كل حاوية بالبنود في الصفحات اللي بعد كده.')));
  const byR={};L.forEach(z=>{const r=byR[z.l.runId]=byR[z.l.runId]||{rev:0,cogs:0,exp:0,fin:0,farz:0};r.rev+=z.l.egp;r.cogs+=z.l.cogs;r.exp+=z.exp+z.load;r[z.x.kind==='farz'?'farz':'fin']+=z.l.kg});
  b.push(Tk('ملخص لكل تشغيلة',th(['التشغيلة','تكلفة الطن ج','نهائي مباع كجم','فرزة مباعة كجم','الإيراد ج','التكلفة الكلية ج','الربح ج']),Object.keys(byR).map(id=>{const r=byR[id],run=app.get('runs',id)||{},x=C.R[id]||{};const pv=x.method!=='joint'&&x.status!=='final';
    return tr([td('<b>#'+esc(run.no||'?')+'</b> '+E.dmy(run.date)+(pv?' <span class="flag">مبدئي</span>':'')+(x.stockVal>0.5?'<br>باقي بالمخزن: '+f0(x.stockVal)+' ج':'')),td(f0(x.perTon||0),'v'),td(f0(r.fin),'v'),td(f0(r.farz),'v'),td(f0(r.rev),'v'),td(f0(r.cogs+r.exp),'v'),td(f0(r.rev-r.cogs-r.exp),'v b')])}),'','sm'));
  b.push(H(note('«مبدئي» = التشغيلة لسه فيها فرزة ما اتباعتش (بسعر مؤقت أو من غير سعر)، فتكلفة الطن والربح ممكن يتغيروا. تكلفة الطن = تكلفة كيلو التشغيلة × 1000. «باقي بالمخزن» = قيمة الإنتاج اللي لسه ما اتباعش بالتكلفة.')));
  /* ورقة تفصيلية لكل حاوية في الاختيار */
  const G=sel!=='all'&&String(sel).startsWith('i:')&&sh.length>1;if(G){b.push({brk:1});invBlocks(sh,app).forEach(x=>b.push(x))}
  sh.forEach(z=>{b.push({brk:1});sheetBlocks(z,app).forEach(x=>b.push(x))});
  const lbl=selLabel(shAll,app,sel);
  return{title:'تقرير الربحية — مفصل',meta:(lbl?esc(lbl)+' · ':'')+per(o.from,o.to)+' · '+methodTxt(C.method),blocks:b,file:'profitability-detailed'}};
/* ===== v1.3.0: تفصيل التكاليف — لكل طن ولكل حاوية ===== */
const GN={};E.PART_G.forEach(g=>GN[g[0]]=g[1]);
const qf=(q,u)=>q?fm(q,Math.abs(q-Math.round(q))>1e-6?(Math.abs(q)<10?3:1):0)+(u?' '+esc(u):''):'';
const pf=v=>v?(Math.abs(v)<10?E.pfmt(Math.abs(v)):f2(Math.abs(v))):'';
/* جدول المكونات: مجموعة ← بنود ← إجمالي قبل الفرزة ← الفرزة ← الصافي */
function partRows(lines,o){o=o||{};const R=[];const byG={};lines.forEach(c=>(byG[c.g]=byG[c.g]||[]).push(c));const T=o.T||0;
  const row=(c)=>tr([td(esc(c.name)+(c.noPrice?' <span class="flag">من غير سعر</span>':'')),td(qf(c.qty,c.unit),'v'),td(c.qty&&T?qf(c.qtyTon,''):'','v'),td(c.qty?pf(c.price):'','v'),td(f0(c.value),'v'),td(f0(c.perTon),'v b'),td(f1(c.pct)+'%','v')]);
  const sub=(lbl,v,base,cls)=>tr([td(lbl),td(''),td(''),td(''),td(f0(v),'v'),td(T?f0(v/T):'','v b'),td(base?f1(v/base*100)+'%':'','v')],cls||'st2');
  const pre=['raw','trans','sup','svc','oth'];let gross=0;
  pre.forEach(g=>{const L=byG[g];if(!L)return;const v=L.reduce((a,c)=>a+c.value,0);gross+=v;if(L.length===1&&g!=='sup'){R.push(row(L[0]).replace('<tr>','<tr class="g">'));return}R.push('<tr class="g">'+tdc('<b>'+GN[g]+'</b>',4)+td(f0(v),'v')+td(T?f0(v/T):'','v')+td(o.base?f1(v/o.base*100)+'%':'','v')+'</tr>');L.forEach(c=>R.push(row(c)))});
  const hasF=byG.farz,hasL=byG.load||byG.exp;
  if(hasF||hasL)R.push(sub('إجمالي تكلفة التشغيل (قبل الفرزة)',gross,o.base,'st2'));
  let net=gross;if(hasF){byG.farz.forEach(c=>{R.push(row(c));net+=c.value});R.push(sub('تكلفة الإنتاج النهائي',net,o.base,'st2'))}
  ['load','exp'].forEach(g=>{const L=byG[g];if(!L)return;const v=L.reduce((a,c)=>a+c.value,0);net+=v;if(L.length===1){R.push(row(L[0]).replace('<tr>','<tr class="g">'));return}R.push('<tr class="g">'+tdc('<b>'+GN[g]+'</b>',4)+td(f0(v),'v')+td(T?f0(v/T):'','v')+td(o.base?f1(v/o.base*100)+'%':'','v')+'</tr>');L.forEach(c=>R.push(row(c)))});
  return{R,net}}
const PHD=th(['البند','الكمية','كمية / طن','سعر الوحدة ج','القيمة ج','ج / طن','%']);
function chk(sum,total){return Math.abs(sum-total)<0.5?'✓ مجموع البنود = الإجمالي ('+f2(total)+' ج)':'⚠ فرق '+f2(sum-total)+' ج بين مجموع البنود والإجمالي'}
/* ===== v1.3.1: تكلفة الحاوية / الفاتورة — تفصيلي: اختيار حاوية أو فاتورة، ملخص الأول وبعدين أقسام بترتيب الشغل.
   عرض بس — كل الأرقام من contSheets (نفس 1.3.0)، مفيش أي معادلة اتغيرت ===== */
function invKey(z){return 'i:'+(z.invNo?z.invNo:'#'+z.saleId)}
function contKey(z){return 'c:'+z.saleId+':'+z.li}
function contName(z){return z.contNo||(z.cont?'حاوية '+(z.li+1):'سطر '+(z.li+1))}
function selGroups(sh,app){const m={},L=[];sh.forEach(z=>{const k=invKey(z);let g=m[k];if(!g){g=m[k]={key:k,invNo:z.invNo||('بيع #'+z.no),date:z.date,customerId:z.customerId,cust:(app.get('parties',z.customerId)||{}).name||'—',conts:[]};L.push(g)}g.conts.push(z)});return L}
function selPick(sh,key){if(!key||key==='all')return sh.slice();if(String(key).startsWith('i:'))return sh.filter(z=>invKey(z)===key);return sh.filter(z=>contKey(z)===key)}
function selDefault(sh,app){const G=selGroups(sh,app);if(!G.length)return '';const g=G[G.length-1];return g.conts.length>1?g.key:contKey(g.conts[0])}
function selOptions(sh,app,cur,withAll){const G=selGroups(sh,app);let h=withAll?'<option value="all"'+(!cur||cur==='all'?' selected':'')+'>كل الفواتير والحاويات ('+sh.length+')</option>':'';
  G.slice().reverse().forEach(g=>{h+='<optgroup label="'+esc('فاتورة '+g.invNo+' · '+E.dmy(g.date)+' · '+g.cust)+'">';
    if(g.conts.length>1)h+='<option value="'+esc(g.key)+'"'+(cur===g.key?' selected':'')+'>الفاتورة '+esc(g.invNo)+' كلها — '+E.contN(g.conts.length)+' · '+E.dmy(g.date)+'</option>';
    g.conts.forEach(z=>{const k=contKey(z);h+='<option value="'+esc(k)+'"'+(cur===k?' selected':'')+'>'+esc(contName(z))+' — '+f3(z.tons)+' طن · '+esc(g.invNo)+' · '+E.dmy(z.date)+'</option>'});h+='</optgroup>'});return h}
function selLabel(sh,app,key){if(!key||key==='all')return '';const L=selPick(sh,key);if(!L.length)return '';return String(key).startsWith('i:')?'فاتورة '+(L[0].invNo||('بيع #'+L[0].no)):contName(L[0])+' — فاتورة '+(L[0].invNo||('بيع #'+L[0].no))}
const SEC_PROD=[['raw','الخام ونقله',['raw','trans']],['sup','مستلزمات التشغيل (كرتون، كيس، لزق، ستيكر صغير)',['sup']],['svc','رسوم التعبئة وخدمات المصنع',['svc']],['oth','تكاليف تشغيل أخرى',['oth']],['farz','الفرزة',['farz']]];
function sheetSecs(z){const sum=L=>L.reduce((a,c)=>a+c.value,0);
  const runs=z.runs.map(r=>({name:'تشغيلة #'+(r.no||'?')+(r.date?' — '+E.dmy(r.date):''),qty:r.kg,unit:'كجم',price:r.kgCost,value:r.kg*r.kgCost}));
  const prod=SEC_PROD.map(s=>({k:s[0],title:s[1],rows:z.lines.filter(c=>s[2].includes(c.g))})).filter(s=>s.rows.length).map(s=>Object.assign(s,{total:sum(s.rows)}));
  const ld=z.lines.filter(c=>c.g==='load'),loadI=ld.filter(c=>String(c.k).indexOf('L:')===0),loadS=ld.filter(c=>String(c.k).indexOf('L:')!==0),exps=z.lines.filter(c=>c.g==='exp');
  const prodT=prod.reduce((a,s)=>a+s.total,0),runsT=sum(runs),loadIT=sum(loadI),loadST=sum(loadS),expT=sum(exps);
  return{T:z.tons,runs,runsT,prod,prodT,loadI,loadIT,loadS,loadST,exps,expT,total:prodT+loadIT+loadST+expT}}
function sheetChk(z,S){const m=[];if(Math.abs(S.runsT-S.prodT)>=0.5)m.push('⚠ فرق '+f2(S.runsT-S.prodT)+' ج بين التشغيلات وتفصيل البنود');if(Math.abs(S.total-z.total)>=0.5)m.push('⚠ فرق '+f2(S.total-z.total)+' ج بين مجموع الأقسام وإجمالي الحاوية');return m.length?m.join(' — '):'✓ مجموع الأقسام = إجمالي تكلفة الحاوية ('+f2(z.total)+' ج)، والتشغيلات = تفصيل البنود'}
/* PDF */
const CH=th(['البند','الكمية','سعر الوحدة ج','القيمة ج','ج / طن']);
function cRow(c,T,cls){return tr([td(esc(c.name)+(c.noPrice?' <span class="flag">من غير سعر</span>':'')),td(c.qty?qf(Math.abs(c.qty),c.unit):'—','v'),td(c.qty?pf(c.price):'—','v'),td(f0(c.value),'v'),td(T?f0(c.value/T):'','v')],cls)}
function cSub(lbl,v,T,cls){return tr([td(lbl),td(''),td(''),td(f0(v),'v b'),td(T?f0(v/T):'','v b')],cls||'tt')}
function Tk(title,head,rows,foot,cls,pre){const x=T(title,head,rows,foot,cls,pre);x.table.keep=1;return x}
function sheetBlocks(z,app){const S=sheetSecs(z),Tn=S.T,cu=app.get('parties',z.customerId)||{},usd=z.cur==='USD',b=[];let no=0;const nx=()=>(++no)+') ';
  const pre='<div class="chd"><b>'+esc(z.cont?'حاوية ':'')+esc(contName(z))+'</b>'+(z.prov?' <span class="flag">مبدئي</span>':'')+'<span>فاتورة '+esc(z.invNo||('بيع #'+z.no))+' · '+E.dmy(z.date)+' · '+esc(cu.name||'—')+'</span></div>'+
    infoGrid([['البوليصة',esc(z.bl||'—')],['مخزن التحميل',esc(app.name('factories',z.loc))||'—'],['سعر البيع',bd((usd?'$':'')+E.pfmt(z.price)+(usd?' للكجم × سعر '+f2(z.rate):' ج للكجم'))],['الباليتات',bd(f0(z.pallets)+' باليت')]])+
    boxes([['إجمالي تكلفة الحاوية',f0(z.total)+' ج',f0(z.costTon)+' ج/طن · '+f2(z.costKg)+' ج/كجم',1],['الكمية الصافية',f3(z.tons)+' طن',f0(z.cartons)+' كرتونة'],['قيمة البيع',f0(z.rev)+' ج',usd?'$'+f2(z.amount)+' × '+f2(z.rate):''],['الربح'+(z.prov?' (مبدئي)':''),f0(z.profit)+' ج','هامش '+f1(z.margin)+'%']]);
  const sr=[['تكلفة الإنتاج',S.prodT],['بنود التحميل',S.loadIT],['عمولات وأوراق وإكراميات',S.loadST],['مصروفات البيع والشحن',S.expT]].filter(r=>Math.abs(r[1])>0.005).map(r=>tr([td(r[0]),td(f0(r[1]),'v'),td(Tn?f0(r[1]/Tn):'','v'),td(z.kg?f2(r[1]/z.kg):'','v')]));
  sr.push(tr([td('إجمالي تكلفة الحاوية'),td(f0(z.total),'v b'),td(f0(z.costTon),'v b'),td(f2(z.costKg),'v b')],'tt'));
  sr.push(tr([td('قيمة البيع'+(usd?' ($'+f2(z.amount)+' × '+f2(z.rate)+')':'')),td(f0(z.rev),'v'),td(Tn?f0(z.rev/Tn):'','v'),td(z.kg?f2(z.rev/z.kg):'','v')]));
  b.push(Tk('ملخص تكلفة الحاوية',th(['البند','القيمة ج','ج / طن','ج / كجم']),sr,tr([td('الربح'+(z.prov?' <span class="flag">مبدئي</span>':'')+' — هامش '+f1(z.margin)+'%'),td(f0(z.profit),'v b'),td(Tn?f0(z.profit/Tn):'','v b'),td(z.kg?f2(z.profit/z.kg):'','v b')],'tt'),'sm cc cx',pre));
  b.push(Tk(nx()+'الفراولة من التشغيلات (الوارد أولًا يصرف أولًا)',th(['التشغيلة','الكمية','تكلفة الكيلو ج','القيمة ج','ج / طن']),S.runs.map(c=>cRow(c,Tn)),cSub('تكلفة الإنتاج المخصصة للحاوية',S.runsT,Tn),'sm cc'));
  const R=[];S.prod.forEach(s=>{R.push('<tr class="g">'+tdc('<b>'+esc(s.title)+'</b>',5)+'</tr>');s.rows.forEach(c=>R.push(cRow(c,Tn)));if(s.rows.length>1)R.push(cSub('إجمالي '+esc(s.title.replace(/ \(.*\)$/,'')),s.total,Tn,'st2'))});
  if(R.length)b.push(Tk(nx()+'تفصيل تكلفة الإنتاج حسب البند',CH,R,cSub('= تكلفة الإنتاج (نفس إجمالي القسم 1)',S.prodT,Tn),'sm cc'));
  if(S.loadI.length)b.push(Tk(nx()+'بنود التحميل (باليت، زوايا، ستيكر كبير، داتا لوجر، استرتش)',CH,S.loadI.map(c=>cRow(c,Tn)),cSub('إجمالي بنود التحميل',S.loadIT,Tn),'sm cc'));
  if(S.loadS.length)b.push(Tk(nx()+'عمولات وأوراق وإكراميات الحاوية',CH,S.loadS.map(c=>cRow(c,Tn)),cSub('إجمالي العمولات والأوراق والإكراميات',S.loadST,Tn),'sm cc'));
  if(S.exps.length)b.push(Tk(nx()+'مصروفات البيع والشحن (نصيب الحاوية من مصروفات الفاتورة)',CH,S.exps.map(c=>cRow(c,Tn)),cSub('إجمالي مصروفات البيع',S.expT,Tn),'sm cc'));
  b.push(H(note(sheetChk(z,S)+'. ج/طن = القيمة ÷ '+f3(Tn)+' طن صافي الحاوية. سعر المستلزمات = المتوسط المرجح وقت الصرف.')));
  return b}
function invAgg(L){const a={kg:0,tons:0,cartons:0,pallets:0,total:0,rev:0,amount:0,profit:0,prov:false};L.forEach(z=>{a.kg+=z.kg;a.tons+=z.tons;a.cartons+=z.cartons;a.pallets+=z.pallets;a.total+=z.total;a.rev+=z.rev;a.amount+=z.amount;a.profit+=z.profit;if(z.prov)a.prov=true});a.costTon=a.tons?a.total/a.tons:0;a.margin=a.rev?a.profit/a.rev*100:0;return a}
function invBlocks(L,app){const z0=L[0],a=invAgg(L),cu=app.get('parties',z0.customerId)||{},usd=z0.cur==='USD';
  const pre='<div class="chd"><b>فاتورة '+esc(z0.invNo||('بيع #'+z0.no))+'</b>'+(a.prov?' <span class="flag">مبدئي</span>':'')+'<span>'+E.dmy(z0.date)+' · '+esc(cu.name||'—')+' · '+E.contN(L.length)+'</span></div>'+
    boxes([['إجمالي تكلفة الفاتورة',f0(a.total)+' ج',f0(a.costTon)+' ج/طن',1],['الكمية الصافية',f3(a.tons)+' طن',f0(a.cartons)+' كرتونة · '+f0(a.pallets)+' باليت'],['قيمة البيع',f0(a.rev)+' ج',usd?'$'+f2(a.amount):''],['الربح'+(a.prov?' (مبدئي)':''),f0(a.profit)+' ج','هامش '+f1(a.margin)+'%']]);
  return [Tk('حاويات الفاتورة',th(['الحاوية','طن','إجمالي التكلفة ج','ج / طن','الربح ج']),L.map(z=>tr([td(esc(contName(z))+(z.prov?' <span class="flag">مبدئي</span>':'')),td(f3(z.tons),'v'),td(f0(z.total),'v'),td(f0(z.costTon),'v'),td(f0(z.profit),'v')])),
    tr([td('إجمالي الفاتورة'),td(f3(a.tons),'v b'),td(f0(a.total),'v b'),td(f0(a.costTon),'v b'),td(f0(a.profit),'v b')],'tt'),'sm cc',pre),H(note('تفصيل كل حاوية في الصفحات اللي بعد كده (كل حاوية في صفحة جديدة). مصروفات الفاتورة متوزعة على حاوياتها بنسبة قيمة البيع.'))]}
BUILD.contCost=function(o){const app=A(),D=app.D,C=app.C,sh=E.contSheets(D,C,o);if(!sh.length)return null;let key=o.id&&o.id!=='all'?String(o.id):selDefault(sh,app);let L=selPick(sh,key);if(!L.length){key=selDefault(sh,app);L=selPick(sh,key)}
  const inv=key.startsWith('i:')&&L.length>1;const b=[];if(inv)invBlocks(L,app).forEach(x=>b.push(x));
  L.forEach((z,i)=>{if(inv||i)b.push({brk:1});sheetBlocks(z,app).forEach(x=>b.push(x))});
  const lbl=selLabel(sh,app,key);
  return{title:inv?'تكلفة الفاتورة — تفصيلي لكل حاوية':'تكلفة الحاوية — تفصيلي',meta:esc(lbl)+' · '+methodTxt(C.method),blocks:b,file:'container-cost-'+String((L[0].invNo||'')+(inv?'':'-'+(L[0].contNo||L[0].li))).replace(/[^A-Za-z0-9_-]/g,'')}};
/* الشاشة (آيفون): نفس الأقسام، جدول 3 أعمدة — البند (وتحته الكمية × السعر) | القيمة | ج/طن */
function sheetHtml(z,app){const N=x=>'<span class="num">'+x+'</span>';const S=sheetSecs(z),Tn=S.T,cu=app.get('parties',z.customerId)||{},usd=z.cur==='USD';let no=0;const nx=()=>(++no)+') ';
  const row=(c,cls)=>'<tr'+(cls?' class="'+cls+'"':'')+'><td>'+esc(c.name)+(c.noPrice?' <span class="tag">من غير سعر</span>':'')+(c.qty?'<div class="cq">'+N(qf(Math.abs(c.qty),''))+' '+esc(c.unit||'')+' × '+N(pf(c.price))+' ج</div>':'')+'</td><td class="v">'+N(f0(c.value))+'</td><td class="v">'+N(Tn?f0(c.value/Tn):'')+'</td></tr>';
  const sub=(l,v,cls)=>'<tr class="'+(cls||'tt')+'"><td>'+l+'</td><td class="v">'+N(f0(v))+'</td><td class="v">'+N(Tn?f0(v/Tn):'')+'</td></tr>';
  const tbl=(title,rows,foot)=>'<h3 class="sech">'+title+'</h3><div class="tw"><table class="t cb cc"><tr><th>البند</th><th>القيمة ج</th><th>ج/طن</th></tr>'+rows.join('')+(foot||'')+'</table></div>';
  let h='<section class="card csh"><h2>'+esc(z.cont?'حاوية ':'')+esc(contName(z))+(z.prov?' <span class="tag">مبدئي</span>':'')+'</h2><div class="sm mut">فاتورة '+esc(z.invNo||('بيع #'+z.no))+' · '+E.dmy(z.date)+' · '+esc(cu.name||'—')+'</div>';
  h+='<div class="kpis k2 cs4">'+[['إجمالي التكلفة',N(f0(z.total))+' <small>ج</small>',N(f0(z.costTon))+' ج/طن · '+N(f2(z.costKg))+' ج/كجم'],['الكمية الصافية',N(f3(z.tons))+' <small>طن</small>',N(f0(z.cartons))+' كرتونة · '+N(f0(z.pallets))+' باليت'],['قيمة البيع',N(f0(z.rev))+' <small>ج</small>',usd?N('$'+f2(z.amount)+' × '+f2(z.rate)):''],['الربح'+(z.prov?' (مبدئي)':''),N(f0(z.profit))+' <small>ج</small>','هامش '+N(f1(z.margin)+'%')]].map(k=>'<div class="kpi"><span>'+k[0]+'</span><b>'+k[1]+'</b>'+(k[2]?'<em>'+k[2]+'</em>':'')+'</div>').join('')+'</div>';
  h+='<div class="ci">'+[['البوليصة',esc(z.bl||'—')],['مخزن التحميل',esc(app.name('factories',z.loc))||'—'],['سعر البيع',N((usd?'$':'')+E.pfmt(z.price))+(usd?' للكجم × '+N(f2(z.rate)):' ج للكجم')],['التشغيلات',z.runs.map(r=>N('#'+esc(r.no||'?'))).join(' + ')]].map(c=>'<div><span>'+c[0]+'</span><b>'+c[1]+'</b></div>').join('')+'</div>';
  const sr=[['تكلفة الإنتاج',S.prodT],['بنود التحميل',S.loadIT],['عمولات وأوراق وإكراميات',S.loadST],['مصروفات البيع والشحن',S.expT]].filter(r=>Math.abs(r[1])>0.005).map(r=>'<tr><td>'+r[0]+'</td><td class="v">'+N(f0(r[1]))+'</td><td class="v">'+N(Tn?f0(r[1]/Tn):'')+'</td></tr>');
  h+=tbl('ملخص التكلفة',sr,sub('إجمالي تكلفة الحاوية',z.total)+'<tr><td>قيمة البيع</td><td class="v">'+N(f0(z.rev))+'</td><td class="v">'+N(Tn?f0(z.rev/Tn):'')+'</td></tr>'+sub('الربح ('+N(f1(z.margin)+'%')+')',z.profit));
  h+=tbl(nx()+'الفراولة من التشغيلات',S.runs.map(c=>row(c)),sub('تكلفة الإنتاج المخصصة',S.runsT));
  const R=[];S.prod.forEach(s=>{R.push('<tr class="g"><td colspan="3"><b>'+esc(s.title)+'</b></td></tr>');s.rows.forEach(c=>R.push(row(c)));if(s.rows.length>1)R.push(sub('إجمالي '+esc(s.title.replace(/ \(.*\)$/,'')),s.total,'st2'))});
  if(R.length)h+=tbl(nx()+'تفصيل تكلفة الإنتاج',R,sub('= تكلفة الإنتاج (نفس القسم 1)',S.prodT));
  if(S.loadI.length)h+=tbl(nx()+'بنود التحميل',S.loadI.map(c=>row(c)),sub('إجمالي بنود التحميل',S.loadIT));
  if(S.loadS.length)h+=tbl(nx()+'عمولات وأوراق وإكراميات',S.loadS.map(c=>row(c)),sub('الإجمالي',S.loadST));
  if(S.exps.length)h+=tbl(nx()+'مصروفات البيع والشحن',S.exps.map(c=>row(c)),sub('الإجمالي',S.expT));
  const ck=sheetChk(z,S);h+=ck.charAt(0)==='✓'?'<div class="hint">'+bd(ck)+'</div>':'<div class="warnbox">'+bd(ck)+'</div>';
  return h+'</section>'}
function invHtml(L,app){const N=x=>'<span class="num">'+x+'</span>';const z0=L[0],a=invAgg(L),cu=app.get('parties',z0.customerId)||{};
  return '<section class="card csh"><h2>فاتورة '+esc(z0.invNo||('بيع #'+z0.no))+(a.prov?' <span class="tag">مبدئي</span>':'')+'</h2><div class="sm mut">'+E.dmy(z0.date)+' · '+esc(cu.name||'—')+' · '+E.contN(L.length)+'</div>'+
    '<div class="kpis k2 cs4">'+[['إجمالي التكلفة',N(f0(a.total))+' <small>ج</small>',N(f0(a.costTon))+' ج/طن'],['الكمية الصافية',N(f3(a.tons))+' <small>طن</small>',N(f0(a.cartons))+' كرتونة'],['قيمة البيع',N(f0(a.rev))+' <small>ج</small>',''],['الربح',N(f0(a.profit))+' <small>ج</small>','هامش '+N(f1(a.margin)+'%')]].map(k=>'<div class="kpi"><span>'+k[0]+'</span><b>'+k[1]+'</b>'+(k[2]?'<em>'+k[2]+'</em>':'')+'</div>').join('')+'</div>'+
    '<div class="tw"><table class="t cb cc"><tr><th>الحاوية</th><th>التكلفة ج</th><th>الربح ج</th></tr>'+L.map(z=>'<tr><td>'+esc(contName(z))+'<div class="cq">'+N(f3(z.tons))+' طن · '+N(f0(z.costTon))+' ج/طن</div></td><td class="v">'+N(f0(z.total))+'</td><td class="v">'+N(f0(z.profit))+'</td></tr>').join('')+
    '<tr class="tt"><td>إجمالي الفاتورة</td><td class="v">'+N(f0(a.total))+'</td><td class="v">'+N(f0(a.profit))+'</td></tr></table></div><div class="hint">تفصيل كل حاوية تحت. مصروفات الفاتورة متوزعة على حاوياتها بنسبة قيمة البيع.</div></section>'}
BUILD.costDet=function(o){const app=A(),D=app.D,C=app.C;const rb=E.runsBreakdown(D,C,o),sh=E.contSheets(D,C,o),ct=E.contTotals(sh);if(!rb.runs.length&&!sh.length)return null;const b=[];
  if(rb.prov||sh.some(z=>z.prov))b.push(H(bd('<div class="rwarn"><b>⚠ فيه تشغيلات تكلفتها مبدئية</b> (فرزة لسه ما اتباعتش أو من غير سعر) — الأرقام المعلّمة «مبدئي» هتتغير لما الفرزة تتباع أو يتحدد سعرها.</div>')));
  b.push(H(boxes([['متوسط تكلفة الطن الصادر (إنتاج)',f0(rb.perTon)+' ج',f3(rb.T)+' طن نهائي من '+rb.runs.length+' تشغيلة',1],['تكلفة الطن المباع تصدير شامل التحميل والمصروفات',sh.length?f0(ct.costTon)+' ج':'—',sh.length?f3(ct.T)+' طن في '+sh.length+' '+(sh.some(z=>z.cont)?'حاوية':'سطر'):''],['ربح الطن المباع',sh.length&&ct.T?f0(ct.profit/ct.T)+' ج':'—',sh.length?'هامش '+f1(ct.margin)+'%':''],['إجمالي تكلفة الإنتاج',f0(rb.net)+' ج','خام '+f0(rb.rawKg)+' كجم']])));
  if(rb.runs.length){const pr=partRows(rb.lines,{T:rb.T,base:rb.gross});b.push(T('تكلفة الطن الصادر لكل مكوّن — كل التشغيلات (مرجّح بالأطنان)',PHD,pr.R,tr([td('تكلفة الطن الصادر'),td(f0(rb.fin)+' كجم','v'),td(''),td(''),td(f0(rb.net),'v b'),td(f0(rb.perTon),'v b'),td('')],'tt'),'xs cd'));
    b.push(H(note(chk(rb.sum,rb.net)+'. «كمية / طن» = الكمية ÷ أطنان الإنتاج النهائي، و«%» من إجمالي تكلفة التشغيل قبل خصم الفرزة. سعر المستلزمات = المتوسط المرجح في المخزن وقت الصرف (أو سعر المكونات لو مفيش تكلفة شراء).')))}
  if(sh.length){b.push(T('ملخص تكلفة كل حاوية',th(['الحاوية / الفاتورة','طن','تكلفة الإنتاج ج','التحميل والمصروفات ج','إجمالي التكلفة ج','ج / طن','الربح ج']),
    sh.map(z=>tr([td('<b>'+esc(contName(z))+'</b>'+(z.prov?' <span class="flag">مبدئي</span>':'')+'<br>'+esc(z.invNo||('#'+z.no))+' · تشغيلة '+z.runs.map(r=>'#'+esc(r.no||'?')).join('+')),td(f3(z.tons),'v'),td(f0(z.cogs),'v'),td(f0(z.load+z.exp),'v'),td(f0(z.total),'v b'),td(f0(z.costTon),'v'),td(f0(z.profit),'v b')])),
    tr([td('الإجمالي — '+sh.length),td(f3(ct.T),'v'),td(f0(sh.reduce((a,z)=>a+z.cogs,0)),'v'),td(f0(sh.reduce((a,z)=>a+z.load+z.exp,0)),'v'),td(f0(ct.total),'v b'),td(f0(ct.costTon),'v'),td(f0(ct.profit),'v b')],'tt'),'sm'));
    const pt=partRows(ct.lines,{T:ct.T,base:ct.total});b.push(T('تكلفة الطن المباع تصدير لكل مكوّن — شامل التحميل ومصروفات البيع',PHD,pt.R,tr([td('إجمالي تكلفة الطن المباع'),td(f3(ct.T)+' طن','v'),td(''),td(''),td(f0(ct.total),'v b'),td(f0(ct.costTon),'v b'),td('')],'tt'),'xs cd'));
    b.push(H(note(chk(ct.sum,ct.total)+'. «%» هنا من إجمالي تكلفة الحاويات.')))}
  b.push(H(note('تكلفة الإنتاج للحاوية = نصيبها من كل بند في التشغيلة بنسبة الكيلوهات (كيلو الحاوية ÷ إنتاج التشغيلة النهائي). بنود التحميل بالكمية الفعلية المصروفة للحاوية × متوسط سعرها، والخدمات بمبلغها. مصروفات البيع متوزعة على حاويات الفاتورة بنسبة الإيراد. الدولار بالسعر المسجل في كل بيع.')));
  rb.runs.forEach(z=>{const r=z.run,x=z.x;const pr=partRows(z.P.lines,{T:z.P.T,base:x.total});
    b.push(T('تشغيلة #'+esc(r.no)+' — '+E.dmy(r.date)+' · '+esc(app.name('factories',r.factoryId))+' · '+esc(app.name('varieties',r.varietyId))+' · '+f3(x.fin/1000)+' طن نهائي ('+f0(x.cartons)+' كرتونة) من '+f0(x.rawKg)+' كجم خام'+(x.method!=='joint'&&x.status!=='final'?' · مبدئي':''),PHD,pr.R,tr([td('تكلفة الطن الصادر'),td(f0(x.fin)+' كجم','v'),td(''),td(''),td(f0(x.finCost),'v b'),td(f0(x.perTon),'v b'),td('')],'tt'),'xs cd'))});
  sh.forEach(z=>{b.push({brk:1});sheetBlocks(z,app).forEach(x=>b.push(x))});
  return{title:'تفصيل التكاليف — لكل طن ولكل حاوية',meta:per(o.from,o.to)+' · '+methodTxt(C.method),blocks:b,file:'cost-breakdown'}};
BUILD.stock=function(){const app=A(),D=app.D,C=app.C,b=[];let F=0,Z=0,V=0;
  const fr=D.runs.filter(r=>C.R[r.id].stockFin>0.005||C.R[r.id].stockFarz>0.005).map(r=>{const x=C.R[r.id];F+=x.stockFin;Z+=x.stockFarz;V+=x.stockVal;return tr([td('#'+r.no+' '+E.dmy(r.date)),td(esc(app.name('varieties',r.varietyId))),td(esc(app.name('factories',r.factoryId))),td(f0(x.stockFin),'v'),td(f0(x.stockFin/x.cartonKg),'v'),td(f0(x.stockFarz),'v'),td(f0(x.perTon),'v'),td(f0(x.stockVal),'v b')])});
  let RV=0;const rr=D.purchases.filter(p=>C.P[p.id].remain>0.5).map(p=>{const x=C.P[p.id];RV+=x.remain*x.costKg;return tr([td('#'+p.no+' '+E.dmy(p.date)),td(esc(app.name('parties',p.supplierId))),td(esc(app.name('factories',p.factoryId))),td(f0(x.remain),'v'),td(f3(x.costKg),'v'),td(f0(x.remain*x.costKg),'v b')])});
  let SV=0;const sr=[];D.items.forEach(it=>{const s=C.SUP[it.id];D.factories.forEach(l=>{const q=s.loc[l.id]||0;if(Math.abs(q)>0.0001){SV+=q*s.avg;sr.push(tr([td(esc(it.name)),td(esc(l.name)),td(fm(q,q%1?3:0)+' '+esc(it.unit),'v'),td(f3(s.avg),'v'),td(f0(q*s.avg),'v b')]))}})});
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
  const startT=(t,first)=>{const w=document.createElement('div');w.className='rt';w.innerHTML=(first&&t.pre?t.pre:'')+(t.title?h3(t.title+(first?'':' (تابع)')):'')+'<table class="'+t.cls+'"><thead>'+t.head+'</thead><tbody></tbody></table>';body.appendChild(w);return w};
  doc.blocks.forEach(b=>{
    if(b.brk){if(body.children.length)np();return}
    if(b.table){const t=b.table;let w=startT(t,true);const tb=()=>w.lastElementChild.querySelector('tbody');
      let first=true,onPage=[];
      const addRow=html=>{tb().insertAdjacentHTML('beforeend',html);onPage.push(html);if(over()){tb().lastElementChild.remove();onPage.pop();
        if(onPage.length<2&&body.children.length>1){const keep=onPage;w.remove();np();w=startT(t,first);keep.forEach(h=>tb().insertAdjacentHTML('beforeend',h));onPage=keep.slice()}
        else{np();w=startT(t,false);first=false;onPage=[]}
        tb().insertAdjacentHTML('beforeend',html);onPage.push(html)}};
      if(over()){w.remove();np();w=startT(t,true)}
      if(t.keep){/* v1.3.1: القسم كله مع بعض — لو مايكفيش في باقي الصفحة يروح صفحة جديدة، ولو أطول من صفحة يتقسم عادي */const all=t.rows.concat(t.foot?[t.foot]:[]).join('');tb().insertAdjacentHTML('beforeend',all);if(!over())return;
        if(body.children.length>1&&t.rows.length<=8){w.remove();np();w=startT(t,true);tb().insertAdjacentHTML('beforeend',all);if(!over())return}tb().innerHTML=''}
      t.rows.forEach(addRow);if(t.foot)addRow(t.foot)}
    else{body.insertAdjacentHTML('beforeend',b.html);if(over()&&body.children.length>1){body.lastElementChild.remove();np();body.insertAdjacentHTML('beforeend',b.html)}}});
  pages.forEach((p,i)=>p.querySelector('.pno').textContent='صفحة '+(i+1)+' من '+pages.length+' · v'+A().VER);
  const html=pages.map(p=>p.outerHTML);holder.remove();return html}

async function open(kind,o){const doc=BUILD[kind]&&BUILD[kind](o||{});if(!doc){(window.say||alert)('مفيش بيانات للتقرير');return}
  CUR={doc,kind,o};const pages=await paginate(doc);CUR.pages=pages;
  $('#pages').innerHTML=flowHtml(doc)+pages.map(h=>'<div class="pw">'+h+'</div>').join('');setMode();$('#rep').hidden=false;document.body.classList.add('modal');fit();$('#rep').scrollTop=0;window.__repReady=pages.length}
/* v1.3.1: على الموبايل التقرير بيتعرض «قراءة» بخط كبير (نفس الأقسام من غير تصغير A4)، وزرار يحوّل لشكل A4؛ الطباعة والـ PDF دايمًا A4 */
function flowHtml(doc){const d=new Date();let h='<div class="rp rpf"><div class="fh"><h1>'+doc.title+'</h1><div class="meta">'+doc.meta+'</div><div class="dt num">'+E.dmy(E.cairoIso(d))+' '+E.cairoTime(d)+' بتوقيت القاهرة</div></div>';
  doc.blocks.forEach(b=>{if(b.brk){h+='<hr class="rbrk">';return}if(b.table){const t=b.table;h+='<div class="rt">'+(t.pre||'')+(t.title?h3(t.title):'')+'<div class="tsc"><table class="'+t.cls+'"><thead>'+t.head+'</thead><tbody>'+t.rows.join('')+(t.foot||'')+'</tbody></table></div></div>'}else h+=b.html});
  return h+'<div class="fsign"><img src="img/mark.jpg" alt=""><div><b>يعتمد: شركة الراشد للتجارة</b><span>الحسابات والتكاليف · v'+A().VER+'</span></div></div></div>'}
let MODE=null;function setMode(){const narrow=window.innerWidth<700;const m=MODE||(narrow?'flow':'a4');$('#rep').classList.toggle('flow',m==='flow');const b=$('#rMode');if(b){b.hidden=!narrow;b.textContent=m==='flow'?'شكل A4':'قراءة'}}
function fit(){const w=Math.min(window.innerWidth-16,794),s=w/794;document.querySelectorAll('#pages .pw').forEach(p=>{p.style.width=w+'px';p.style.height=(1123*s)+'px';p.firstElementChild.style.transform='scale('+s+')'})}
window.addEventListener('resize',()=>{if(!$('#rep').hidden)fit()});
function close(){$('#rep').hidden=true;$('#pages').innerHTML='';if($('#sheet').hidden)document.body.classList.remove('modal')}
async function makePdf(){const holder=document.createElement('div');holder.className='rhold';holder.innerHTML=CUR.pages.join('');document.body.appendChild(holder);
  const imgs=[...holder.querySelectorAll('img')];await Promise.all(imgs.map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));
  const pdf=new window.jspdf.jsPDF({unit:'mm',format:'a4',compress:true});const ps=holder.querySelectorAll('.rp');
  for(let i=0;i<ps.length;i++){const c=await html2canvas(ps[i],{scale:2,backgroundColor:'#fff',useCORS:true,logging:false});if(i)pdf.addPage();pdf.addImage(c.toDataURL('image/jpeg',0.9),'JPEG',0,0,210,297)}
  holder.remove();return pdf}
async function share(){$('#busy').hidden=false;try{const pdf=await makePdf();const blob=pdf.output('blob'),nm=CUR.doc.file+'_'+E.dmy(E.cairoIso()).replace(/\//g,'-')+'.pdf';window.__lastPdf={name:nm,size:blob.size,pages:CUR.pages.length};
  const file=(()=>{try{return new File([blob],nm,{type:'application/pdf'})}catch(e){return null}})();$('#busy').hidden=true;
  if(file&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:nm})}catch(e){}return}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=nm;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
  catch(e){$('#busy').hidden=true;(window.say||alert)('ماقدرتش أجهز الـ PDF: '+e)}}
document.addEventListener('click',e=>{const t=e.target.closest('#rClose,#rShare,#rPrint,#rMode');if(!t)return;if(t.id==='rMode'){MODE=$('#rep').classList.contains('flow')?'a4':'flow';setMode();fit();$('#rep').scrollTop=0}if(t.id==='rClose')close();if(t.id==='rShare')share();if(t.id==='rPrint')window.print()});
window.RPT={open,close,makePdf,share,BUILD,paginate,moneyWords,sheetSecs,selOptions,selPick,selDefault,selGroups,sheetHtml,invHtml,contKey,invKey};
})();
