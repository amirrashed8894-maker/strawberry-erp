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
function T(title,head,rows,foot,cls){return{table:{title,head,rows,foot,cls:cls||''}}}
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
/* ===== التفقيط (المبلغ بالحروف) ===== */
const W1=['','واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة','عشرة','أحد عشر','اثنا عشر','ثلاثة عشر','أربعة عشر','خمسة عشر','ستة عشر','سبعة عشر','ثمانية عشر','تسعة عشر'];
const W10=['','','عشرون','ثلاثون','أربعون','خمسون','ستون','سبعون','ثمانون','تسعون'];
const W100=['','مائة','مائتان','ثلاثمائة','أربعمائة','خمسمائة','ستمائة','سبعمائة','ثمانمائة','تسعمائة'];
function w999(x){const h=Math.floor(x/100),r=x%100,p=[];if(h)p.push(W100[h]);if(r){if(r<20)p.push(W1[r]);else{const u=r%10,t=Math.floor(r/10);p.push(u?W1[u]+' و'+W10[t]:W10[t])}}return p.join(' و')}
function wGroup(x,one,two,few,many){if(x===1)return one;if(x===2)return two;if(x>=3&&x<=10)return w999(x)+' '+few;return w999(x)+' '+many}
function intWords(v){if(v===0)return 'صفر';const G=[[1e9,'مليار','ملياران','مليارات','مليار'],[1e6,'مليون','مليونان','ملايين','مليون'],[1e3,'ألف','ألفان','آلاف','ألف']];const p=[];
  G.forEach(g=>{const q=Math.floor(v/g[0]);if(q){p.push(wGroup(q%1000,g[1],g[2],g[3],g[4]));v-=q*g[0]}});if(v)p.push(w999(v));return p.join(' و')}
function moneyWords(x){x=Math.round(Math.abs(+x||0)*100);const L=Math.floor(x/100),pi=x%100;return 'فقط '+(L||!pi?intWords(L)+' جنيه مصري'+(pi?' و':''):'')+(pi?intWords(pi)+' قرش':'')+' لا غير'}
const KIND={purchase:'فاتورة خام',transport:'نقل',supplyIn:'فاتورة مستلزمات',runCost:'تكلفة تشغيل',sale:'فاتورة بيع',saleExp:'مصروف بيع',payment:'دفعة',open:'رصيد افتتاحي'};
const isCust=t=>t==='export'||t==='farz';
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
  R.push(tr([td(''),td(o.from?E.dmy(o.from):'','v'),td('رصيد افتتاحي'),td(''),td(o.from?'رصيد منقول قبل '+E.dmy(o.from):'رصيد أول المدة'),td(open>0?f2(open):'','v'),td(open<0?f2(-open):'','v'),td(amt(open),'v')],'g'));
  rows.forEach(e=>{bal+=e.dr-e.cr;i++;R.push(tr([td(i,'v c'),td(E.dmy(e.date),'v'),td(esc(e.doc||KIND[e.kind]||'')),td(esc(e.no==null?'':e.no),'v c'),td(esc(e.info||e.desc)),td(e.dr?f2(e.dr):'','v'),td(e.cr?f2(e.cr):'','v'),td(amt(bal),'v')]))});
  b.push(T('الحركات',th(['م','التاريخ','المستند','رقم','البيان','مدين','دائن','الرصيد']),R,tr([td(''),td(''),td('الإجمالي'),td(''),td(rows.length+' حركة + رصيد أول المدة'),td(f2(dr+(open>0?open:0)),'v'),td(f2(cr+(open<0?-open:0)),'v'),td(amt(close),'v b')],'tt'),'sm st'));
  b.push(H(bd('<div class="rwords"><b>الرصيد الختامي بالحروف:</b> '+(Math.abs(close)<0.005?'صفر — الحساب متسدد':moneyWords(close)+' — '+(close>0?(cust?'مستحق لشركة الراشد للتجارة على العميل':'مستحق لشركة الراشد للتجارة عند المورد'):(cust?'مستحق للعميل على شركة الراشد للتجارة':'مستحق للمورد على شركة الراشد للتجارة')))+'</div>')));
  b.push(H(note('مدين = عليه (مستحق لشركة الراشد)، دائن = له (مستحق على شركة الراشد). المبالغ بالجنيه المصري؛ الحركات بالدولار متحولة بالسعر المسجل في كل حركة. التواريخ يوم/شهر/سنة.')));
  return{title:'كشف حساب '+(cust?'عميل':'مورد')+' — '+esc(p.name),meta:per(o.from,o.to),blocks:b,file:'statement-'+(cust?'customer':'supplier')}};

/* ===== الربحية ===== */
function profitData(o){const app=A(),D=app.D,C=app.C;const inP=s=>(!o.from||s.date>=o.from)&&(!o.to||s.date<=o.to);
  const sales=D.sales.filter(inP).sort((a,b)=>(a.date||'').localeCompare(b.date||'')||n(a.no)-n(b.no));
  const L=[];sales.forEach(s=>{const x=C.SL[s.id];x.lines.forEach(l=>{const r=C.R[l.runId]||{},run=app.get('runs',l.runId)||{};const ex=x.rev?x.exp*l.egp/x.rev:(x.lines.length?x.exp/x.lines.length:0);
    L.push({s,x,l,r,run,exp:ex,profit:l.egp-l.cogs-ex,variety:app.name('varieties',run.varietyId),prov:r.method!=='joint'&&r.status&&r.status!=='final'})})});
  const tot={rev:0,cogs:0,exp:0,kg:0,fin:0,farz:0,finRev:0,finCost:0};L.forEach(z=>{tot.rev+=z.l.egp;tot.cogs+=z.l.cogs;tot.exp+=z.exp;tot.kg+=z.l.kg;if(z.x.kind==='farz')tot.farz+=z.l.kg;else{tot.fin+=z.l.kg;tot.finRev+=z.l.egp;tot.finCost+=z.l.cogs+z.exp}});tot.profit=tot.rev-tot.cogs-tot.exp;
  const prov=[...new Set(L.filter(z=>z.prov).map(z=>z.l.runId))].map(id=>C.R[id]);return{app,C,sales,L,tot,prov}}
function grp(L,key,label){const m={},order=[];L.forEach(z=>{const k=key(z);if(!m[k]){m[k]={k,label:label(z),rev:0,cogs:0,exp:0,kg:0,ids:new Set(),prov:false};order.push(k)}const g=m[k];g.rev+=z.l.egp;g.cogs+=z.l.cogs;g.exp+=z.exp;g.kg+=z.l.kg;g.ids.add(z.s.id);if(z.prov)g.prov=true});return order.map(k=>m[k])}
const PH=['','الكمية كجم','الإيراد ج','التكلفة المخصصة ج','مصروفات البيع ج','الربح ج','الهامش'];
function gRows(G,tot,first){const rows=G.map(g=>{const q=g.rev-g.cogs-g.exp;return tr([td(esc(g.label)+(g.prov?' <span class="flag">مبدئي</span>':'')+(first==='ops'?' <small>('+g.ids.size+' عملية)</small>':'')),td(f0(g.kg),'v'),td(f0(g.rev),'v'),td(f0(g.cogs),'v'),td(f0(g.exp),'v'),td(f0(q),'v b'),td(g.rev?f1(q/g.rev*100)+'%':'-','v')])});
  return rows}
function gFoot(t){return tr([td('الإجمالي'),td(f0(t.kg),'v'),td(f0(t.rev),'v'),td(f0(t.cogs),'v'),td(f0(t.exp),'v'),td(f0(t.profit),'v b'),td(t.rev?f1(t.profit/t.rev*100)+'%':'-','v')],'tt')}
function provWarn(prov){return prov.length?H(bd('<div class="rwarn"><b>⚠ سعر الفرزة لسه ما اتحددش — التكلفة مبدئية</b> في التشغيلات: '+prov.map(x=>'#'+x.no+' ('+esc(x.costLabel)+')').join('، ')+'. السطور المعلّمة «مبدئي» ربحها هيتغير لما الفرزة تتباع أو يتحدد سعرها.</div>')):null}
const MON=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
BUILD.profitSum=function(o){const {app,C,sales,L,tot,prov}=profitData(o);const b=[];const w=provWarn(prov);if(w)b.push(w);
  b.push(H(boxes([['صافي الربح',f0(tot.profit)+' ج',tot.rev?'هامش '+f1(tot.profit/tot.rev*100)+'% من المبيعات':'',1],['المبيعات',f0(tot.rev)+' ج',sales.length+' عملية بيع'],['التكلفة المخصصة',f0(tot.cogs)+' ج','ومصروفات البيع '+f0(tot.exp)+' ج'],['المباع تصدير',f3(tot.fin/1000)+' طن','وفرزة '+f0(tot.farz)+' كجم']])));
  b.push(T('حسب الفترة (الشهر)',th(['الشهر'].concat(PH.slice(1))),gRows(grp(L,z=>(z.s.date||'').slice(0,7),z=>{const m=/^(\d{4})-(\d{2})/.exec(z.s.date||'');return m?MON[+m[2]-1]+' '+m[1]:'—'}),tot),gFoot(tot),'sm'));
  b.push(T('حسب العميل',th(['العميل'].concat(PH.slice(1))),gRows(grp(L,z=>z.s.customerId,z=>{const p=app.get('parties',z.s.customerId)||{};return (p.name||'—')+(p.type==='farz'?' (فرزة)':'')}),tot,'ops'),gFoot(tot),'sm'));
  b.push(T('حسب الصنف',th(['الصنف'].concat(PH.slice(1))),gRows(grp(L,z=>z.variety,z=>z.variety),tot),gFoot(tot),'sm'));
  b.push(T('حسب نوع البيع',th(['النوع'].concat(PH.slice(1))),gRows(grp(L,z=>z.x.kind,z=>z.x.kind==='farz'?'فرزة':'تصدير (إنتاج نهائي)'),tot),gFoot(tot),'sm'));
  const ex=tot.fin?[['متوسط سعر بيع طن التصدير',f0(tot.finRev/tot.fin*1000)+' ج'],['متوسط تكلفة طن التصدير المباع (مع مصروفات البيع)',f0(tot.finCost/tot.fin*1000)+' ج'],['ربح طن التصدير',f0((tot.finRev-tot.finCost)/tot.fin*1000)+' ج']]:[];
  if(ex.length)b.push(T('مؤشرات طن التصدير',th(['المؤشر','القيمة']),ex.map(r=>tr([td(r[0]),td(r[1],'v b')])),'','sm'));
  b.push(H(note('التكلفة المخصصة لكل بيع = الكمية × تكلفة الكيلو في التشغيلة اللي البيع طالع منها (النهائي بتكلفة الطن الصادر، والفرزة '+(C.method==='joint'?'بنفس تكلفة الكيلو بالوزن':'بمتوسط صافي بيعها، فربح الفرزة صفر لأن قيمتها اتخصمت من تكلفة النهائي')+'). مصروفات البيع متوزعة على سطور البيع بنسبة الإيراد. الدولار متحول بالسعر المسجل في كل بيع. التفاصيل في «الربحية — مفصل».')));
  return{title:'تقرير الربحية — مجمل',meta:per(o.from,o.to)+' · '+methodTxt(C.method),blocks:b,file:'profitability-summary'}};
BUILD.profit=BUILD.profitSum;
BUILD.profitDet=function(o){const {app,C,sales,L,tot,prov}=profitData(o);const b=[];const w=provWarn(prov);if(w)b.push(w);
  b.push(H(boxes([['صافي الربح',f0(tot.profit)+' ج',tot.rev?'هامش '+f1(tot.profit/tot.rev*100)+'%':'',1],['المبيعات',f0(tot.rev)+' ج',sales.length+' عملية'],['التكلفة المخصصة',f0(tot.cogs)+' ج'],['مصروفات البيع',f0(tot.exp)+' ج']])));
  const R=[];sales.forEach(s=>{const x=C.SL[s.id],cu=app.get('parties',s.customerId)||{};const zs=L.filter(z=>z.s.id===s.id);const any=zs.some(z=>z.prov);
    R.push('<tr class="g">'+tdc('<b>بيع #'+esc(s.no)+' — '+E.dmy(s.date)+'</b> · '+esc(cu.name||'—')+' · '+(x.kind==='farz'?'فرزة (السعر للكيلو)':'تصدير (السعر للطن)')+(s.invNo?' · فاتورة '+esc(s.invNo):'')+(x.cur==='USD'?' · بالدولار: $'+f2(x.amount)+' × سعر '+f2(x.rate):' · بالجنيه'),9)+'</tr>');
    zs.forEach(z=>{const l=z.l,run=z.run;const q=f0(l.kg);
      R.push(tr([td('تشغيلة #'+esc(run.no||'?')+' '+E.dmy(run.date)+' · '+esc(app.name('factories',run.factoryId))+(x.kind==='farz'?'':' · '+f0(l.cartons)+' كرتونة')+(z.prov?' <span class="flag">مبدئي</span>':'')),td(q,'v'),td((x.cur==='USD'?'$':'')+f2(l.price),'v'),td(f0(l.egp),'v'),td(f0(l.kgCost*1000),'v'),td(f0(l.cogs),'v'),td(f0(z.exp),'v'),td(f0(z.profit),'v b'),td(l.egp?f1(z.profit/l.egp*100)+'%':'-','v')]))});
    R.push(tr([td('إجمالي البيع #'+esc(s.no)+(any?' <span class="flag">مبدئي</span>':'')),td(f0(x.kg),'v'),td(''),td(f0(x.rev),'v'),td(x.kg?f0(x.cogs/x.kg*1000):'-','v'),td(f0(x.cogs),'v'),td(f0(x.exp),'v'),td(f0(x.profit),'v b'),td(f1(x.margin)+'%','v')],'st2'))});
  b.push(T('الربحية لكل فاتورة بيع وتخصيصها على التشغيلات',th(['البيع / التشغيلة','الكمية كجم','سعر البيع','الإيراد ج','تكلفة الطن ج','التكلفة المخصصة ج','مصروفات البيع ج','الربح ج','%']),R,tr([td('الإجمالي — '+sales.length+' عملية'),td(f0(tot.kg),'v'),td(''),td(f0(tot.rev),'v'),td(tot.kg?f0(tot.cogs/tot.kg*1000):'-','v'),td(f0(tot.cogs),'v'),td(f0(tot.exp),'v'),td(f0(tot.profit),'v b'),td(tot.rev?f1(tot.profit/tot.rev*100)+'%':'-','v')],'tt'),'xs pd'));
  const byR={};L.forEach(z=>{const r=byR[z.l.runId]=byR[z.l.runId]||{rev:0,cogs:0,exp:0,fin:0,farz:0};r.rev+=z.l.egp;r.cogs+=z.l.cogs;r.exp+=z.exp;r[z.x.kind==='farz'?'farz':'fin']+=z.l.kg});
  b.push(T('ملخص لكل تشغيلة',th(['التشغيلة','الحالة','ج/طن تكلفة','نهائي مباع كجم','فرزة مباعة كجم','الإيراد ج','التكلفة ج','المصروفات ج','الربح ج','مخزون باقي (تكلفة) ج']),Object.keys(byR).map(id=>{const r=byR[id],run=app.get('runs',id)||{},x=C.R[id]||{};const pv=x.method!=='joint'&&x.status!=='final';
    return tr([td('#'+esc(run.no||'?')+' '+E.dmy(run.date)),td(pv?'<span class="flag">مبدئي</span>':'نهائي'),td(f0(x.perTon||0),'v'),td(f0(r.fin),'v'),td(f0(r.farz),'v'),td(f0(r.rev),'v'),td(f0(r.cogs),'v'),td(f0(r.exp),'v'),td(f0(r.rev-r.cogs-r.exp),'v b'),td(f0(x.stockVal||0),'v')])}),'','xs'));
  b.push(H(note('«مبدئي» = التشغيلة لسه فيها فرزة ما اتباعتش (بسعر مؤقت أو من غير سعر)، فتكلفة الطن والربح ممكن يتغيروا. تكلفة الطن = تكلفة كيلو التشغيلة × 1000 (للفرزة: متوسط صافي بيعها). مصروفات البيع متوزعة على سطور البيع بنسبة الإيراد.')));
  return{title:'تقرير الربحية — مفصل',meta:per(o.from,o.to)+' · '+methodTxt(C.method),blocks:b,file:'profitability-detailed'}};
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
window.RPT={open,close,makePdf,share,BUILD,paginate,moneyWords};
})();
