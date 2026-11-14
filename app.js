(function(){
'use strict';
const VER='1.2.2',E=ERP,n=E.n,fm=E.fmt;
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const f0=x=>fm(x,0),f2=x=>fm(x,2),f1=x=>fm(x,1);
const N=x=>'<span class="num">'+x+'</span>';
const today=()=>E.cairoIso();
let D=null,C=null,F=null,UI={buyTab:'raw',accTab:'sup',stockTab:'fin',moreTab:'',flt:{}};
const SUPT=['raw','supply','transport','service'],CUST=['export','farz'];
const NUMK=['gross','tare','disc','price','sacks','sackKg','amount','qty','kg','cartons','farzSacks','cartonKg','farzSackKg','farzTemp','farzExtraKg','rate','open','refPrice','usdRate'];

/* ===== بيانات ===== */
const S=()=>D.settings[0];
const get=(c,id)=>D[c].find(x=>x.id===id);
const name=(c,id)=>{const x=get(c,id);return x?x.name:'—'};
function recompute(){C=E.compute(D)}
function nextNo(c){return D[c].reduce((a,x)=>Math.max(a,n(x.no)),0)+1}
function normalize(o){if(Array.isArray(o))return o.map(normalize);if(o&&typeof o==='object'){const r={};Object.keys(o).forEach(k=>{if(k[0]==='_')return;let v=o[k];
  if(typeof v==='string'&&NUMK.indexOf(k)>=0){const p=E.parse(v);v=v.trim()===''?'':(isFinite(p)?p:v)}r[k]=(k==='est'||k==='inputs')?JSON.parse(JSON.stringify(v)):normalize(v)});return r}return o}
/* ===== سجل التعديلات: كل تعديل على فاتورة/دفعة/كمية بيتسجل «معدل يوم/شهر/سنة ساعة — قديم ← جديد» (داخلي بس، مش بيظهر في أي حاجة للعميل) ===== */
const LOGC=['purchases','transports','payments','supplyIn','transfers','runs','sales'];
const FL={date:'التاريخ',no:'الرقم',supplierId:'المورد',transporterId:'مورد النقل',customerId:'العميل',partyId:'الحساب',varietyId:'الصنف',factoryId:'المصنع',locId:'المخزن',fromId:'من مخزن',toId:'إلى مخزن',plate:'العربية',ticketNo:'تذكرة الميزان',
  gross:'القائم',tare:'الفارغ',disc:'خصم الميزان',price:'السعر',sacks:'الشكاير',sackKg:'وزن الشيكارة',lotNo:'اللوت',amount:'المبلغ',method:'طريقة الدفع',cur:'العملة',rate:'سعر الدولار',dir:'النوع',ref:'المرجع',invNo:'رقم الفاتورة',
  cartons:'الكراتين',cartonKg:'وزن الكرتونة',farzSacks:'شكاير الفرزة',farzSackKg:'وزن شيكارة الفرزة',farzExtraKg:'فرزة سايبة',farzTemp:'سعر الفرزة المؤقت',kind:'نوع البيع',purchaseIds:'الفواتير',runId:'التشغيلة',notes:'الملاحظات',
  yieldBySupplier:'الإنتاج لكل مورد',est:'التقدير',qty:'الكمية',kg:'الكجم',itemId:'الصنف',purchaseId:'الفاتورة',name:'البند'};
const AL={lines:'سطر',inputs:'خام',supplies:'مستلزم',costs:'تكلفة',expenses:'مصروف'};
const VV={method:{transfer:'تحويل',cash:'كاش'},cur:{EGP:'جنيه',USD:'دولار'},dir:{in:'تحصيل',out:'دفعة'},kind:{export:'تصدير',farz:'فرزة'}};
function evShow(k,v){if(v==null||v==='')return '—';if(VV[k])return VV[k][v]||v;if(k==='date')return E.dmy(v);
  if(['supplierId','transporterId','customerId','partyId'].indexOf(k)>=0)return name('parties',v);if(['factoryId','locId','fromId','toId'].indexOf(k)>=0)return name('factories',v);if(k==='varietyId')return name('varieties',v);if(k==='itemId')return name('items',v);
  if(k==='purchaseId'){const x=get('purchases',v);return x?'#'+x.no:'—'}if(k==='runId'){const x=get('runs',v);return x?'#'+x.no:'—'}if(k==='purchaseIds')return (v||[]).map(id=>'#'+((get('purchases',id)||{}).no||'?')).join('+')||'—';
  if(typeof v==='boolean')return v?'أيوه':'لأ';if(typeof v==='string'&&NUMK.indexOf(k)>=0&&isFinite(E.parse(v)))v=E.parse(v);if(typeof v==='number')return fm(v,v%1?2:0);return String(v)}
const same=(a,b)=>{a=a==null?'':a;b=b==null?'':b;if(typeof a!=='object'&&typeof b!=='object')return String(a)===String(b);return JSON.stringify(a)===JSON.stringify(b)};
function diffRec(o,r){const ch=[],skip={id:1,createdAt:1,updatedAt:1,edits:1,deletedAt:1,mode:1,estNeeds:1};
  const keys=[...new Set(Object.keys(o).concat(Object.keys(r)))].filter(k=>!skip[k]&&k[0]!=='_');
  keys.forEach(k=>{const a=o[k],b=r[k];if(same(a,b))return;
    if(AL[k]){const A=a||[],B=b||[];for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i],y=B[i];if(!x){ch.push(AL[k]+' '+(i+1)+' اتضاف');continue}if(!y){ch.push(AL[k]+' '+(i+1)+' اتشال');continue}
      [...new Set(Object.keys(x).concat(Object.keys(y)))].forEach(f=>{if(!same(x[f],y[f]))ch.push(AL[k]+' '+(i+1)+' '+(FL[f]||f)+' '+evShow(f,x[f])+' ← '+evShow(f,y[f]))})}return}
    if(k==='est'){ch.push('التقدير اتعدل');return}if(k==='notes'){ch.push('الملاحظات اتعدلت');return}
    ch.push((FL[k]||k)+' '+evShow(k,a)+' ← '+evShow(k,b))});
  return ch}
function editTxt(e){const d=new Date(e.at);return 'معدل '+E.dmy(E.cairoIso(d))+' '+E.cairoTime(d)+(e.txt?' — '+e.txt:'')}
function editNotes(rec,max){const L=(rec&&rec.edits)||[];return (max?L.slice(-max):L).map(editTxt)}
/* ملاحظات سطر في كشف مورد: الفاتورة/النقلة/الدفعة نفسها كاملة، أما بند تكلفة في تشغيلة أو مصروف على بيع فبس التغييرات اللي تخص البند ده (مايبانش بيانات موردين أو عملاء تانيين) */
function stmtNotes(e,max){const r=refRec(e);if(!r||!r.edits)return [];let L=r.edits;
  if(e.kind==='runCost'||e.kind==='saleExp'){const pre=e.kind==='runCost'?'تكلفة ':'مصروف ';L=L.map(x=>({at:x.at,txt:(x.ch||[]).filter(c=>c.indexOf(pre)===0||c.indexOf('التاريخ ')===0).join('، ')})).filter(x=>x.txt)}
  return (max?L.slice(-max):L).map(editTxt)}
function enote(rec,max){const L=editNotes(rec,max);return L.length?'<div class="enote">'+L.map(esc).join('<br>')+'</div>':''}
async function upsert(c,rec,quiet){const t=new Date().toISOString();rec=normalize(rec);if(!rec.id)rec.id=E.uid();
  if(LOGC.indexOf(c)>=0){const old=get(c,rec.id);if(old){rec.edits=(old.edits||[]).slice();const ch=diffRec(old,rec);if(ch.length)rec.edits.push({at:t,ch,txt:ch.slice(0,8).join('، ')+(ch.length>8?' …(+'+(ch.length-8)+')':'')});if(!rec.edits.length)delete rec.edits}}if(!rec.createdAt)rec.createdAt=t;rec.updatedAt=t;
  const i=D[c].findIndex(x=>x.id===rec.id);if(i>=0)D[c][i]=rec;else D[c].push(rec);
  const s=S();const list=[[c,rec]];if(c!=='settings'||!quiet){s.changedSince=true;s.updatedAt=t;if(c!=='settings')list.push(['settings',s])}
  await Store.putMany(list);recompute();if(!quiet)render();if(window.SYNC)SYNC.kick();return rec}
async function remove(c,id){const rec=get(c,id);ARC=null;D[c]=D[c].filter(x=>x.id!==id);if(rec)await Store.del(c,rec);const s=S();s.changedSince=true;s.updatedAt=new Date().toISOString();await Store.put('settings',s);recompute();render();if(window.SYNC)SYNC.kick()}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2600)}

/* ===== تنسيق ===== */
function partyLabel(p){return p?(p.name+(p.nameEn?' ('+p.nameEn+')':'')):'—'}
function balTxt(b,isCust){if(Math.abs(b)<0.005)return '<span class="num">0.00</span>';return '<span class="num">'+f2(Math.abs(b))+'</span> <small>'+(b>0?'عليه':'له')+'</small>'}
function purchLabel(p){const x=C.P[p.id]||{};return '#'+p.no+' — '+name('parties',p.supplierId)+' — '+E.dmy(p.date)+' — صافي '+f0(x.net||0)+' كجم'}
function runLabel(r){return '#'+r.no+' — '+E.dmy(r.date)+' — '+name('factories',r.factoryId)+' — '+name('varieties',r.varietyId)}
function opt(list,val,ph){return (ph!=null?'<option value="">'+esc(ph)+'</option>':'')+list.map(o=>'<option value="'+esc(o[0])+'"'+(String(o[0])===String(val==null?'':val)?' selected':'')+'>'+esc(o[1])+'</option>').join('')}
const parties=types=>D.parties.filter(p=>types.indexOf(p.type)>=0).sort((a,b)=>a.name.localeCompare(b.name,'ar'));
const facOpts=()=>D.factories.map(f=>[f.id,f.name]),varOpts=()=>D.varieties.map(v=>[v.id,v.name]),itemOpts=()=>D.items.map(i=>[i.id,i.name+' ('+i.unit+')'])

/* ===== الواجهة الرئيسية ===== */
const TABS=[['home','الرئيسية'],['buy','الشراء'],['runs','التشغيل'],['sales','البيع'],['acc','الحسابات'],['more','المزيد']];
function route(){const h=(location.hash||'#/home').slice(2).split('/');return{v:h[0]||'home',id:h[1]||'',x:h[2]||''}}
function render(){if(!D)return;const r=route();const fn=VIEWS[r.v]||VIEWS.home;let h='';try{h=fn(r)}catch(e){console.error(e);h='<div class="card">حصل خطأ في العرض: '+esc(e.message)+'</div>'}
  $('#main').innerHTML=h;const tab=({run:'runs',party:'acc',stock:'more',reports:'more',master:'more',settings:'more',backup:'more',cloud:'more',archive:'more'})[r.v]||r.v;
  $('#nav').innerHTML=TABS.map(t=>'<button data-go="#/'+t[0]+'" class="'+(t[0]===tab?'on':'')+'">'+t[1]+'</button>').join('');
  $('#ver').textContent='v'+VER;syncPill()}
const VIEWS={};
function syncPill(){const el=$('#sync');if(!el||!window.SYNC)return;const s=SYNC.state;let t,c='';
  if(!s.enabled){t='☁ مش مربوط بالسحابة';c='off'}else if(s.syncing){t='☁ بيزامن…'}else if(!s.online){t='☁ أوفلاين'+(s.pending?' · '+s.pending+' مستني':'');c='warn'}
  else if(s.error){t='☁ '+s.error;c='warn'}else if(s.pending){t='☁ '+s.pending+' مستني رفع';c='warn'}else{t='☁ متزامن'+(s.lastSync?' '+E.cairoTime(new Date(s.lastSync)):'');c='ok'}
  el.textContent=t;el.className='syncp '+c}
function farzBox(x,run){if(x.method==='joint'||x.status==='final')return '';
  return '<div class="warnbox"><b>⚠ '+esc(x.farzWarn)+'</b><div>'+esc(x.costLabel)+'.</div><div class="sm">فرزة التشغيلة '+N(f0(x.farz))+' كجم: اتباع منها '+N(f0(x.farzSoldKg))+' كجم'+(x.farzSoldKg>0.005?' بمتوسط صافي '+N(f2(x.farzAvg))+' ج/كجم':'')+'، والباقي '+N(f0(x.farzUnsold))+' كجم '+(x.status==='provisional'?'متسعر مؤقت بـ '+N(f2(x.farzTemp))+' ج/كجم':'مالوش سعر')+'. التكلفة هتبقى نهائية لما الفرزة كلها تتباع.</div>'+
  (run?'<div class="quick q2" style="margin:8px 0 0"><button class="btn sm pri" data-act="farzTemp" data-id="'+run.id+'">'+(x.status==='provisional'?'غيّر السعر المؤقت':'حط سعر مؤقت')+'</button><button class="btn sm" data-act="new" data-k="sale" data-kind="farz">+ بيع فرزة</button></div>':'')+'</div>'}
function kpi(l,v,s){return '<div class="kpi"><span>'+l+'</span><b>'+v+'</b>'+(s?'<em>'+s+'</em>':'')+'</div>'}
function backupDue(){const s=S();const has=D.purchases.length+D.runs.length+D.sales.length+D.payments.length+D.supplyIn.length>0;if(!has||!s.changedSince)return false;if(!s.lastBackup)return true;return (Date.now()-Date.parse(s.lastBackup))>3*864e5}
VIEWS.home=function(){
  let pay=0,rec=0;D.parties.forEach(p=>{const b=(C.BAL[p.id]||{}).bal||0;if(SUPT.indexOf(p.type)>=0)pay-=b;else rec+=b});
  let stF=0,stZ=0,stV=0;Object.values(C.R).forEach(r=>{stF+=r.stockFin;stZ+=r.stockFarz;stV+=r.stockVal});
  let prof=0,rev=0;Object.values(C.SL).forEach(s=>{prof+=s.profit;rev+=s.rev});
  const runs=D.runs.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')||n(b.no)-n(a.no)).slice(0,5);
  let h='';
  if(backupDue())h+='<div class="notice"><b>خد نسخة احتياطية:</b> البيانات محفوظة على الجهاز ده بس. '+(S().lastBackup?'آخر نسخة '+E.dmy(E.cairoIso(new Date(S().lastBackup))):'لسه ما اتاخدش نسخة')+'. <button class="btn sm" data-act="backup">نسخة الآن</button></div>';
  if(!Store.ok)h+='<div class="notice"><b>تنبيه:</b> المتصفح ده مش سامح بالتخزين، البيانات هتضيع لو قفلت الصفحة.</div>';
  h+='<section class="card sum"><div class="lbl">ملخص الحسابات</div><div class="kpis k2">'+kpi('مستحق للموردين',N(f0(pay))+' ج')+kpi('مستحق على العملاء',N(f0(rec))+' ج')+kpi('مخزون إنتاج نهائي',N(fm(stF/1000,3))+' طن',N(f0(stZ))+' كجم فرزة')+kpi('قيمة المخزون بالتكلفة',N(f0(stV))+' ج')+kpi('إجمالي المبيعات',N(f0(rev))+' ج')+kpi('صافي الربح',N(f0(prof))+' ج')+'</div></section>';
  h+='<div class="quick"><button class="btn pri" data-act="new" data-k="purchase">+ فاتورة خام</button><button class="btn pri" data-act="new" data-k="run">+ تشغيلة</button><button class="btn" data-act="new" data-k="sale">+ بيع</button><button class="btn" data-act="new" data-k="payment">+ دفعة / تحصيل</button></div>';
  const w=warnList();if(w.length)h+='<section class="card"><h2>محتاج مراجعة</h2><ul class="wl">'+w.map(x=>'<li>'+x+'</li>').join('')+'</ul></section>';
  h+='<section class="card"><h2>آخر التشغيلات <small>تكلفة الطن الصادر</small></h2>'+(runs.length?'<div class="list">'+runs.map(runRow).join('')+'</div>':'<div class="empty">لسه مفيش تشغيلات. ابدأ بفاتورة خام وبعدين تشغيلة.</div>')+'</section>';
  h+='<div class="foot">طريقة الفرزة: <b>'+(C.method==='joint'?'توزيع التكلفة بالوزن':'قيمة الفرزة بتتخصم من التكلفة')+'</b> · <a href="#/settings">تغيير</a></div>';
  return h};
function warnList(){const w=[];
  C.warns.forEach(x=>{const it=name('items',x.item);if(x.type==='issue'){const r=get('runs',x.run);w.push('تشغيلة #'+(r?r.no:'')+': صرف '+f0(x.need)+' '+esc(it)+' من '+esc(name('factories',x.loc))+' والرصيد كان '+f0(x.have))}else w.push('تحويل: '+esc(it)+' أكتر من الرصيد ('+f0(x.have)+')')});
  C.unlinkedTrans.forEach(t=>w.push('نقل #'+t.no+' مش مربوط بفاتورة خام ولا تشغيلة — مش داخل في التكلفة'));
  Object.values(C.R).forEach(r=>r.errs.forEach(e=>w.push('تشغيلة #'+r.no+': '+esc(e))));
  Object.values(C.R).forEach(r=>{if(r.farzWarn&&r.method!=='joint')w.push('<b>تشغيلة #'+r.no+': '+esc(r.farzWarn)+'</b> — '+esc(r.costLabel)+' · <a href="#/run/'+r.id+'">افتح</a>')});
  Object.values(C.R).forEach(r=>r.supplies.forEach(s=>{if(s.noPrice)w.push('تشغيلة #'+r.no+': '+esc(s.name)+' مالوش سعر (مفيش فاتورة شراء قبل التشغيلة)')}));
  return w}
function runRow(r){const x=C.R[r.id];return '<button class="row" data-go="#/run/'+r.id+'"><div><b>تشغيلة #'+r.no+'</b> <span class="mut">'+E.dmy(r.date)+' · '+esc(name('factories',r.factoryId))+' · '+esc(name('varieties',r.varietyId))+'</span><div class="mut sm">'+N(f0(x.rawKg))+' كجم خام → '+N(f0(x.cartons))+' كرتونة · '+x.rows.length+' مورد</div></div><div class="amt">'+(x.errs.length?'<span class="mut">ناقص</span>':N(f0(x.perTon))+'<small>ج/طن</small>'+(x.status!=='final'?'<div class="tag">مبدئي</div>':''))+'</div></button>'}

/* ----- الشراء ----- */
VIEWS.buy=function(){const t=UI.buyTab;
  let h=seg('buyTab',[['raw','فواتير الخام'],['trans','النقل'],['sup','شراء مستلزمات'],['tf','تحويل مستلزمات']],t);
  if(t==='raw'){h+=addBtn('purchase','+ فاتورة شراء خام');const L=D.purchases.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')||n(b.no)-n(a.no));
    h+=L.length?'<div class="list">'+L.map(p=>{const x=C.P[p.id];return '<button class="row" data-act="edit" data-k="purchase" data-id="'+p.id+'"><div><b>#'+p.no+' '+esc(name('parties',p.supplierId))+'</b> <span class="mut">'+E.dmy(p.date)+'</span><div class="mut sm">صافي '+N(f0(x.net))+' كجم'+(x.d?' · خصم '+N(f2(x.d))+'%':'')+' · '+N(f2(x.price))+' ج/كجم · '+esc(name('factories',p.factoryId))+' · باقي '+N(f0(x.remain))+' كجم</div>'+enote(p,1)+'</div><div class="amt">'+N(f0(x.amount))+'<small>ج</small></div></button>'}).join('')+'</div>':empty('مفيش فواتير خام.')}
  if(t==='trans'){h+=addBtn('transport','+ نقلة');const L=D.transports.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    h+=L.length?'<div class="list">'+L.map(x=>'<button class="row" data-act="edit" data-k="transport" data-id="'+x.id+'"><div><b>#'+x.no+' '+esc(name('parties',x.transporterId))+'</b> <span class="mut">'+E.dmy(x.date)+'</span><div class="mut sm">'+((x.purchaseIds||[]).length?'فواتير: '+(x.purchaseIds||[]).map(id=>'#'+((get('purchases',id)||{}).no||'?')).join('، '):x.runId?'تشغيلة #'+((get('runs',x.runId)||{}).no||'?'):'مش مربوط')+'</div>'+enote(x,1)+'</div><div class="amt">'+N(f0(n(x.amount)))+'<small>ج</small></div></button>').join('')+'</div>':empty('مفيش نقل.')}
  if(t==='sup'){h+=addBtn('supplyIn','+ فاتورة مستلزمات');const L=D.supplyIn.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    h+=L.length?'<div class="list">'+L.map(x=>'<button class="row" data-act="edit" data-k="supplyIn" data-id="'+x.id+'"><div><b>#'+x.no+' '+esc(name('parties',x.supplierId))+'</b> <span class="mut">'+E.dmy(x.date)+'</span><div class="mut sm">'+esc(name('factories',x.locId))+' · '+(x.lines||[]).length+' صنف</div>'+enote(x,1)+'</div><div class="amt">'+N(f0(C.supplyAmt[x.id]||0))+'<small>ج</small></div></button>').join('')+'</div>':empty('مفيش فواتير مستلزمات.')}
  if(t==='tf'){h+=addBtn('transfer','+ تحويل بين المخازن');const L=D.transfers.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    h+=L.length?'<div class="list">'+L.map(x=>'<button class="row" data-act="edit" data-k="transfer" data-id="'+x.id+'"><div><b>#'+x.no+' '+esc(name('factories',x.fromId))+' ← '+esc(name('factories',x.toId))+'</b><div class="mut sm">'+E.dmy(x.date)+' · '+(x.lines||[]).map(l=>esc(name('items',l.itemId))+' '+f0(n(l.qty))).join('، ')+'</div>'+enote(x,1)+'</div></button>').join('')+'</div>':empty('مفيش تحويلات.')}
  return h};
function seg(key,opts,cur){return '<div class="seg">'+opts.map(o=>'<button data-act="ui" data-k="'+key+'" data-v="'+o[0]+'" class="'+(o[0]===cur?'on':'')+'">'+o[1]+'</button>').join('')+'</div>'}
function addBtn(k,t,extra){return '<button class="btn pri wide add" data-act="new" data-k="'+k+'"'+(extra||'')+'>'+t+'</button>'}
function empty(t){return '<div class="empty">'+t+'</div>'}

/* ----- التشغيلات ----- */
VIEWS.runs=function(){const L=D.runs.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')||n(b.no)-n(a.no));
  return addBtn('run','+ تشغيلة جديدة')+(L.length?'<div class="list">'+L.map(runRow).join('')+'</div>':empty('مفيش تشغيلات.'))};
VIEWS.run=function(r){const run=get('runs',r.id);if(!run)return empty('التشغيلة مش موجودة.');const x=C.R[run.id];
  let h='<div class="vh"><button class="btn sm ghost" data-go="#/runs">رجوع</button><h2>تشغيلة #'+run.no+'</h2><button class="btn sm" data-act="edit" data-k="run" data-id="'+run.id+'">تعديل</button></div>';
  h+='<div class="mut cen">'+E.dmy(run.date)+' · '+esc(name('factories',run.factoryId))+' · '+esc(name('varieties',run.varietyId))+'</div>'+(run.edits&&run.edits.length?'<div class="cen">'+enote(run,2)+'</div>':'');
  if(x.errs.length)h+='<div class="err"><b>التكلفة مش مكتملة:</b><ul>'+x.errs.map(e=>'<li>'+esc(e)+'</li>').join('')+'</ul></div>';
  h+=farzBox(x,run);
  h+='<section class="card sum"><div class="lbl">تكلفة الطن الصادر — كل الموردين · <b>'+esc(x.status==='final'?'نهائي':'مبدئي')+'</b></div><div class="big"><span class="egp num">'+f0(x.perTon)+'<i>ج</i></span>'+(x.cmp&&x.cmp.usd?'<span class="usd num">$'+f2(x.perTon/x.cmp.usd)+'</span>':'')+'</div>'+
    '<div class="kpis">'+kpi('خام داخل',N(f0(x.rawKg))+' كجم')+kpi('إنتاج نهائي',N(f0(x.fin))+' كجم',N(f0(x.cartons))+' كرتونة')+kpi('فرزة',N(f0(x.farz))+' كجم',N(x.farzSacks%1?fm(x.farzSacks,1):f0(x.farzSacks))+' شيكارة')+kpi('هالك',N(f0(x.waste))+' كجم',N(f1(x.yieldWaste))+'%')+kpi('إجمالي التكلفة',N(f0(x.total))+' ج')+kpi(x.method==='joint'?'نصيب الفرزة':'قيمة الفرزة المخصومة',N(f0(x.farzCost))+' ج',x.method==='joint'?'':(x.status==='final'?'بيع فعلي':x.status==='provisional'?'فعلي + مؤقت':'المباع بس'))+'</div><div class="hint">'+esc(x.costLabel)+'</div></section>';
  h+='<section class="card"><h2>تكلفة الطن لكل مورد</h2><div class="tw"><table class="t"><tr><th>المورد</th><th>خام كجم</th><th>نهائي كجم</th><th>التكلفة</th><th>ج/طن صادر</th></tr>'+
    x.rows.map(s=>'<tr><td>'+esc(s.name)+'</td><td class="v">'+f0(s.kg)+'</td><td class="v">'+f0(s.fin)+'</td><td class="v">'+f0(s.finCost)+'</td><td class="v b">'+f0(s.perTon)+'</td></tr>').join('')+
    '<tr class="tt"><td>الإجمالي</td><td class="v">'+f0(x.rawKg)+'</td><td class="v">'+f0(x.fin)+'</td><td class="v">'+f0(x.finCost)+'</td><td class="v b">'+f0(x.perTon)+'</td></tr></table></div>'+
    '<div class="hint">'+(x.bySup?'الإنتاج متسجل لكل مورد.':'الإنتاج والفرزة متوزعين على الموردين بنسبة الخام (مفيش تسجيل لكل مورد).')+' التكاليف المشتركة ('+f0(x.shared)+' ج) متوزعة بنسبة كيلو الخام.</div></section>';
  if(x.cmp){const c=x.cmp;h+='<section class="card"><h2>المقدر والفعلي <small>ج للطن الصادر</small></h2><div class="kpis">'+kpi('المقدر',N(f0(c.eT)))+kpi('الفعلي',N(f0(c.aT)))+kpi('الفرق',N((c.v>0?'+':'')+f0(c.v)),c.eT?N(f1(c.v/c.eT*100)+'%'):'')+'</div>'+
    '<div class="tw"><table class="t"><tr><th>البند</th><th>مقدر</th><th>فعلي</th><th>الفرق</th></tr>'+c.lines.filter(l=>Math.abs(l.a)>0.005||Math.abs(l.e)>0.005).map(l=>'<tr><td>'+esc(l.name)+'</td><td class="v">'+f0(l.e)+'</td><td class="v">'+f0(l.a)+'</td><td class="v b">'+(l.v>0.5?'+':'')+f0(l.v)+'</td></tr>').join('')+'</table></div>'+
    (x.method==='joint'?'<div class="hint">المقارنة دايمًا بطريقة خصم قيمة الفرزة (نفس نموذج تكلفة المجمدات)، عشان كده الفعلي هنا ممكن يختلف عن تكلفة الطن بطريقة التوزيع بالوزن.</div>':'')+'</section>'}
  h+='<section class="card"><h2>المبيعات من التشغيلة</h2><div class="kpis">'+kpi('مباع نهائي',N(f0(x.soldFin))+' كجم')+kpi('باقي نهائي',N(f0(x.stockFin))+' كجم')+kpi('باقي فرزة',N(f0(x.stockFarz))+' كجم')+kpi('إيراد',N(f0(x.sales.rev))+' ج')+kpi('تكلفة المباع',N(f0(x.sales.cogs+x.sales.exp))+' ج')+kpi('ربح',N(f0(x.sales.profit))+' ج')+'</div></section>';
  h+='<div class="actions"><button class="btn pri" data-act="report" data-k="run" data-id="'+run.id+'">تقرير التكلفة PDF</button><button class="btn" data-act="report" data-k="cmp" data-id="'+run.id+'">المقدر والفعلي PDF</button></div>';
  return h};

/* ----- المبيعات ----- */
VIEWS.sales=function(){const L=D.sales.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')||n(b.no)-n(a.no));
  let rev=0,pr=0;L.forEach(s=>{rev+=C.SL[s.id].rev;pr+=C.SL[s.id].profit});
  let h='<div class="quick q2"><button class="btn pri" data-act="new" data-k="sale" data-kind="export">+ بيع تصدير</button><button class="btn pri" data-act="new" data-k="sale" data-kind="farz">+ بيع فرزة</button></div>';
  if(L.length)h+='<div class="kpis k2 card">'+kpi('إجمالي المبيعات',N(f0(rev))+' ج')+kpi('صافي الربح',N(f0(pr))+' ج',rev?N(f1(pr/rev*100)+'%'):'')+'</div>';
  h+=L.length?'<div class="list">'+L.map(s=>{const x=C.SL[s.id];return '<button class="row" data-act="edit" data-k="sale" data-id="'+s.id+'"><div><b>#'+s.no+' '+(x.kind==='farz'?'فرزة':'تصدير')+' — '+esc(name('parties',s.customerId))+'</b> <span class="mut">'+E.dmy(s.date)+'</span><div class="mut sm">'+N(f0(x.kg))+' كجم · '+(x.cur==='USD'?N('$'+f2(x.amount))+' · ':'')+'ربح '+N(f0(x.profit))+' ج ('+N(f1(x.margin))+'%)</div>'+enote(s,1)+'</div><div class="amt">'+N(f0(x.rev))+'<small>ج</small></div></button>'}).join('')+'</div>':empty('مفيش مبيعات.');
  h+='<div class="quick q2"><button class="btn" data-act="report" data-k="profitSum">الربحية — مجمل PDF</button><button class="btn" data-act="report" data-k="profitDet">الربحية — مفصل PDF</button></div>';return h};

/* ----- الحسابات ----- */
VIEWS.acc=function(){const t=UI.accTab;let h=seg('accTab',[['sup','الموردين'],['cus','العملاء']],t);
  const groups=t==='sup'?SUPT:CUST;
  h+='<div class="quick q2"><button class="btn pri" data-act="new" data-k="party" data-type="'+(t==='sup'?'raw':'export')+'">+ '+(t==='sup'?'مورد':'عميل')+' جديد</button><button class="btn" data-act="new" data-k="payment" data-dir="'+(t==='sup'?'out':'in')+'">'+(t==='sup'?'+ دفعة لمورد':'+ تحصيل من عميل')+'</button></div>';
  groups.forEach(g=>{const L=parties([g]);if(!L.length&&g==='service')return;let tot=0;L.forEach(p=>tot+=(C.BAL[p.id]||{}).bal||0);
    h+='<section class="card"><h2>'+E.PTYPES[g]+' <small>'+L.length+' — الرصيد '+balTxt(tot)+'</small></h2>'+(L.length?'<div class="list">'+L.map(p=>{const b=C.BAL[p.id]||{bal:0};return '<button class="row" data-go="#/party/'+p.id+'"><div><b>'+esc(partyLabel(p))+'</b>'+(p.type==='raw'&&n(p.disc)?' <span class="mut sm">خصم ميزان '+N(f2(n(p.disc)))+'%</span>':'')+'</div><div class="amt">'+balTxt(b.bal)+'</div></button>'}).join('')+'</div>':'<div class="empty sm">مفيش.</div>')+'</section>'});
  return h};
VIEWS.party=function(r){const p=get('parties',r.id);if(!p)return empty('الحساب مش موجود.');const fl=UI.flt[p.id]||{};
  const st=statement(p.id,fl.from,fl.to);
  let h='<div class="vh"><button class="btn sm ghost" data-go="#/acc">رجوع</button><h2>'+esc(p.name)+'</h2><button class="btn sm" data-act="edit" data-k="party" data-id="'+p.id+'">تعديل</button></div>';
  h+='<div class="mut cen">'+E.PTYPES[p.type]+(p.nameEn?' · '+esc(p.nameEn):'')+(p.cr?' · س.ت '+esc(p.cr):'')+(p.tax?' · ب.ض '+esc(p.tax):'')+(p.address?' · '+esc(p.address):'')+'</div>';
  h+='<section class="card sum"><div class="kpis">'+kpi('مدين (عليه)',N(f2(st.dr)))+kpi('دائن (له)',N(f2(st.cr)))+kpi('الرصيد',balTxt(st.close))+'</div></section>';
  h+='<div class="flt"><label>من <input data-flt="'+p.id+'.from" value="'+esc(fl.from?E.dmy(fl.from):'')+'" placeholder="يوم/شهر/سنة" inputmode="numeric"></label><label>إلى <input data-flt="'+p.id+'.to" value="'+esc(fl.to?E.dmy(fl.to):'')+'" placeholder="يوم/شهر/سنة" inputmode="numeric"></label><button class="btn sm ghost" data-act="fltclear" data-id="'+p.id+'">الكل</button></div>';
  h+='<div class="quick q2"><button class="btn pri" data-act="new" data-k="payment" data-party="'+p.id+'" data-dir="'+(CUST.indexOf(p.type)>=0?'in':'out')+'">'+(CUST.indexOf(p.type)>=0?'+ تحصيل':'+ دفعة')+'</button><button class="btn" data-act="report" data-k="stmt" data-id="'+p.id+'">كشف حساب PDF</button></div>';
  h+='<section class="card"><div class="tw"><table class="t st"><tr><th>التاريخ</th><th>المستند</th><th>البيان</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr>'+
    (fl.from?'<tr class="g"><td></td><td>رصيد منقول</td><td>قبل '+E.dmy(fl.from)+'</td><td></td><td></td><td class="v">'+balTxt(st.open)+'</td></tr>':'')+
    st.rows.map(e=>'<tr data-act="openref" data-kind="'+e.kind+'" data-id="'+(e.ref||'')+'"><td class="v">'+E.dmy(e.date)+'</td><td>'+esc(e.doc||'')+(e.no!=null&&e.no!==''?' <b class="num">#'+esc(e.no)+'</b>':'')+'</td><td>'+esc(e.info||e.desc)+(SUPT.indexOf(p.type)>=0?(L=>L.length?'<div class="enote">'+L.map(esc).join('<br>')+'</div>':'')(stmtNotes(e,2)):'')+'</td><td class="v">'+(e.dr?f2(e.dr):'')+'</td><td class="v">'+(e.cr?f2(e.cr):'')+'</td><td class="v">'+balTxt(e.bal)+'</td></tr>').join('')+
    '<tr class="tt"><td></td><td></td><td>الإجمالي</td><td class="v">'+f2(st.dr)+'</td><td class="v">'+f2(st.cr)+'</td><td class="v">'+balTxt(st.close)+'</td></tr></table></div>'+(st.rows.length?'':'<div class="empty sm">مفيش حركات في الفترة دي.</div>')+'<div class="hint">«عليه» = مستحق لنا عنده، «له» = مستحق له علينا.</div></section>';
  return h};
const REFC={purchase:'purchases',transport:'transports',supplyIn:'supplyIn',runCost:'runs',saleExp:'sales',payment:'payments',sale:'sales'};
function refRec(e){const c=REFC[e.kind];return c&&e.ref?get(c,e.ref):null}
function statement(pid,from,to){const L=C.L[pid]||[];let open=0;const rows=[];let dr=0,cr=0;
  L.forEach(e=>{const d=e.date||'';if(e.kind!=='open'&&from&&d<from){open+=e.dr-e.cr;return}if(e.kind==='open'&&from){open+=e.dr-e.cr;return}if(to&&d&&d>to)return;rows.push(e)});
  let b=open;const out=rows.map(e=>{b+=e.dr-e.cr;dr+=e.dr;cr+=e.cr;return Object.assign({},e,{bal:b})});return{open,rows:out,dr,cr,close:b}}

/* ----- المزيد ----- */
VIEWS.more=function(){return '<div class="menu">'+[['#/cloud','الحفظ السحابي والأجهزة','المزامنة بين الموبايل والكمبيوتر، والنسخ اليومية'],['#/stock','المخزون','إنتاج نهائي وفرزة لكل تشغيلة، الخام، المستلزمات في كل مخزن'],['#/reports','التقارير','تكلفة التشغيلة، المقدر والفعلي، الربحية، كشوف الحساب، المخزون'],['#/master/factories','المصانع والمخازن','الثلاجة العربية، الحسن، الفجر، بوناتيرا…'],['#/master/varieties','الأصناف والتكلفة المقدرة','فراولة وأي صنف تاني، وأرقام التقدير لكل صنف'],['#/master/items','أصناف المستلزمات','الكرتون، الباليت، الكيس…'],['#/settings','الإعدادات','طريقة الفرزة، وزن الكرتونة والشيكارة، سعر الدولار'],['#/backup','النسخة الاحتياطية','حفظ كل البيانات في ملف واسترجاعها'],['#/archive','الأرشيف (المحذوف)','كل حاجة اتمسحت بتتحفظ هنا، وتقدر ترجّعها']].map(m=>'<button class="row" data-go="'+m[0]+'"><div><b>'+m[1]+'</b><div class="mut sm">'+m[2]+'</div></div><div class="amt">‹</div></button>').join('')+'</div>'};
VIEWS.stock=function(){const t=UI.stockTab;let h='<div class="vh"><button class="btn sm ghost" data-go="#/more">رجوع</button><h2>المخزون</h2><button class="btn sm" data-act="report" data-k="stock">PDF</button></div>';
  h+=seg('stockTab',[['fin','نهائي وفرزة'],['raw','الخام'],['sup','المستلزمات']],t);
  if(t==='fin'){const rows=D.runs.map(r=>({r,x:C.R[r.id]})).filter(o=>o.x.stockFin>0.005||o.x.stockFarz>0.005);
    h+=rows.length?'<section class="card"><div class="tw"><table class="t"><tr><th>التشغيلة</th><th>المكان</th><th>نهائي كجم</th><th>كراتين</th><th>فرزة كجم</th><th>القيمة</th></tr>'+rows.map(o=>'<tr><td>#'+o.r.no+' '+esc(name('varieties',o.r.varietyId))+'</td><td>'+esc(name('factories',o.r.factoryId))+'</td><td class="v">'+f0(o.x.stockFin)+'</td><td class="v">'+f0(o.x.stockFin/o.x.cartonKg)+'</td><td class="v">'+f0(o.x.stockFarz)+'</td><td class="v">'+f0(o.x.stockVal)+'</td></tr>').join('')+'</table></div></section>':empty('مفيش مخزون إنتاج.')}
  if(t==='raw'){const rows=D.purchases.filter(p=>C.P[p.id].remain>0.5);
    h+=rows.length?'<section class="card"><div class="tw"><table class="t"><tr><th>الفاتورة</th><th>المورد</th><th>المصنع</th><th>باقي كجم</th><th>التكلفة</th></tr>'+rows.map(p=>{const x=C.P[p.id];return '<tr><td>#'+p.no+' '+E.dmy(p.date)+'</td><td>'+esc(name('parties',p.supplierId))+'</td><td>'+esc(name('factories',p.factoryId))+'</td><td class="v">'+f0(x.remain)+'</td><td class="v">'+f0(x.remain*x.costKg)+'</td></tr>'}).join('')+'</table></div></section>':empty('مفيش خام مستني تشغيل.')}
  if(t==='sup'){const locs=D.factories;h+='<section class="card"><div class="tw"><table class="t"><tr><th>الصنف</th>'+locs.map(l=>'<th>'+esc(l.name)+'</th>').join('')+'<th>الإجمالي</th><th>متوسط السعر</th></tr>'+D.items.map(it=>{const s=C.SUP[it.id];return '<tr><td>'+esc(it.name)+' <span class="mut sm">'+esc(it.unit)+'</span></td>'+locs.map(l=>'<td class="v">'+((s.loc[l.id]||0)?f0(s.loc[l.id]):'-')+'</td>').join('')+'<td class="v b">'+f0(s.qty)+'</td><td class="v">'+f2(s.avg)+'</td></tr>'}).join('')+'</table></div><div class="hint">المصروف للتشغيلة بيتحسب بالمتوسط المرجح لسعر الشراء وقت الصرف.</div></section>'}
  return h};
VIEWS.reports=function(){const runs=D.runs.slice().sort((a,b)=>n(b.no)-n(a.no));const fl=UI.flt.rep||{};
  const ro=runs.map(r=>[r.id,runLabel(r)]);
  return '<div class="vh"><button class="btn sm ghost" data-go="#/more">رجوع</button><h2>التقارير</h2><span></span></div>'+
  '<section class="card"><h2>تكلفة التشغيلة</h2><div class="f full"><label>التشغيلة</label><select class="sel" id="repRun">'+opt(ro,fl.run||(ro[0]||[])[0])+'</select></div><div class="quick q2"><button class="btn pri" data-act="report" data-k="run" data-from="repRun"'+(ro.length?'':' disabled')+'>تقرير التكلفة</button><button class="btn" data-act="report" data-k="cmp" data-from="repRun"'+(ro.length?'':' disabled')+'>المقدر والفعلي</button></div></section>'+
  '<section class="card"><h2>الربحية</h2><div class="flt"><label>من <input data-flt="rep.from" value="'+esc(fl.from?E.dmy(fl.from):'')+'" placeholder="يوم/شهر/سنة" inputmode="numeric"></label><label>إلى <input data-flt="rep.to" value="'+esc(fl.to?E.dmy(fl.to):'')+'" placeholder="يوم/شهر/سنة" inputmode="numeric"></label></div><div class="quick q2"><button class="btn pri" data-act="report" data-k="profitSum">الربحية — مجمل</button><button class="btn pri" data-act="report" data-k="profitDet">الربحية — مفصل</button></div><div class="hint">المجمل: حسب الشهر والعميل والصنف. المفصل: كل فاتورة بيع وتخصيصها على التشغيلات وتكلفة الطن، وعلامة «مبدئي» لو سعر الفرزة لسه ما اتحددش.</div></section>'+
  '<section class="card"><h2>كشف حساب</h2><div class="f full"><label>الحساب</label><select class="sel" id="repParty">'+opt(D.parties.slice().sort((a,b)=>a.type.localeCompare(b.type)).map(p=>[p.id,E.PTYPES[p.type]+': '+p.name]))+'</select></div><button class="btn pri wide" data-act="report" data-k="stmt" data-from="repParty">كشف الحساب</button><div class="hint">الفترة من نفس خانات «من/إلى» اللي فوق.</div></section>'+
  '<section class="card"><h2>المخزون</h2><button class="btn pri wide" data-act="report" data-k="stock">تقرير المخزون</button></section>'};
VIEWS.master=function(r){const k=r.id;const T={factories:['المصانع والمخازن','factory','+ مصنع / مخزن'],varieties:['الأصناف والتكلفة المقدرة','variety','+ صنف'],items:['أصناف المستلزمات','item','+ صنف مستلزمات']}[k];if(!T)return '';
  let h='<div class="vh"><button class="btn sm ghost" data-go="#/more">رجوع</button><h2>'+T[0]+'</h2><span></span></div>'+addBtn(T[1],T[2]);
  h+='<div class="list">'+D[k].map(x=>{let s='';if(k==='varieties'){const e=E.fcCalc(x.est);s='التكلفة المقدرة '+N(f0(e.total))+' ج/طن'+(x.estNeeds?' · <b>منسوخة من الفراولة، محتاجة أرقامك</b>':'')}if(k==='items'){const st=C.SUP[x.id];s='الوحدة: '+esc(x.unit)+' · الرصيد '+N(f0(st.qty))+' · متوسط '+N(f2(st.avg))+' ج'}
    return '<button class="row" data-act="edit" data-k="'+T[1]+'" data-id="'+x.id+'"><div><b>'+esc(x.name)+'</b><div class="mut sm">'+s+'</div></div><div class="amt">‹</div></button>'}).join('')+'</div>';
  if(k==='items')h+='<div class="hint">الأصناف دي هي مستلزمات المخزن من «تكلفة المجمدات». بنود الخدمة (التعبئة بالسيزر، إكراميات، عمولات شراء، فحص) بتتسجل كتكاليف تشغيل في التشغيلة.</div>';
  return h};
VIEWS.settings=function(){const s=S();return '<div class="vh"><button class="btn sm ghost" data-go="#/more">رجوع</button><h2>الإعدادات</h2><span></span></div>'+
  '<section class="card"><h2>معاملة الفرزة في التكلفة</h2>'+
  '<label class="radio"><input type="radio" name="fm" data-set="farzMethod" value="credit"'+(s.farzMethod!=='joint'?' checked':'')+'><div><b>(أ) خصم قيمة الفرزة من تكلفة التشغيلة — الافتراضي</b><div class="mut sm">الفرزة منتج ثانوي: كل التكلفة على الإنتاج النهائي، وبنخصم منها صافي البيع الفعلي للفرزة لعملاء الفرزة. الفرزة اللي لسه ما اتباعتش مالهاش سعر — التكلفة بتفضل «مبدئية» لحد ما تتباع، أو تحط لها سعر مؤقت في التشغيلة. سعر الفرزة في التقدير (15 ج) للتقدير بس.</div></div></label>'+
  '<label class="radio"><input type="radio" name="fm" data-set="farzMethod" value="joint"'+(s.farzMethod==='joint'?' checked':'')+'><div><b>(ب) توزيع التكلفة على النهائي والفرزة بالوزن</b><div class="mut sm">كيلو الفرزة وكيلو النهائي بنفس التكلفة، والهالك محمّل على الاتنين.</div></div></label></section>'+
  '<section class="card"><h2>القيم الافتراضية</h2><div class="grid">'+
  ['cartonKg|وزن الكرتونة الصافي|كجم','sackKg|وزن الشيكارة|كجم','usdRate|سعر الدولار الافتراضي|ج'].map(x=>{const a=x.split('|');return '<div class="f"><label>'+a[1]+'</label><div class="in"><input inputmode="decimal" data-sset="'+a[0]+'" value="'+esc(s[a[0]])+'"><span class="u">'+a[2]+'</span></div></div>'}).join('')+'</div></section>'+
  '<div class="foot">الإصدار '+VER+' · '+(window.SYNC&&SYNC.state.enabled?'البيانات على الجهاز ومتزامنة مع السحابة':'البيانات على الجهاز ده بس (مش مربوط بالسحابة)')+'</div>'};
VIEWS.cloud=function(){const s=SYNC.state;let h='<div class="vh"><button class="btn sm ghost" data-go="#/more">رجوع</button><h2>الحفظ السحابي</h2><span></span></div>';
  if(!s.enabled){h+='<section class="card"><p><b>الجهاز ده مش مربوط بالسحابة.</b> البيانات محفوظة عليه بس. افتح «رابط الربط» اللي وصلك (مرة واحدة على كل جهاز)، أو الصق الرابط/الرمز هنا:</p><div class="f full"><div class="in"><input class="txt" id="joinCode" placeholder="الصق رابط الربط أو الرمز" autocomplete="off"></div></div><button class="btn pri wide" data-act="syncJoin">ربط الجهاز</button>'+(s.error?'<div class="err">'+esc(s.error)+'</div>':'')+'</section>';return h}
  h+='<section class="card sum"><div class="kpis k2">'+kpi('الحالة',s.syncing?'بيزامن…':!s.online?'أوفلاين':s.error?'فيه مشكلة':s.pending?'مستني رفع':'متزامن')+kpi('آخر مزامنة',s.lastSync?N(E.dmy(E.cairoIso(new Date(s.lastSync)))+' '+E.cairoTime(new Date(s.lastSync))):'—')+kpi('تعديلات مستنية رفع',N(s.pending))+kpi('آخر نسخة يومية',s.lastBackup?N(E.dmy(E.cairoIso(new Date(s.lastBackup)))):'لسه')+'</div>'+(s.error?'<div class="err">'+esc(s.error)+'</div>':'')+'<div class="hint">مساحة العمل: '+esc(s.name||'')+' · الأوقات بتوقيت القاهرة</div></section>';
  h+='<div class="quick q2"><button class="btn pri" data-act="syncNow">زامن دلوقتي</button><button class="btn" data-act="syncLink">ربط جهاز تاني</button></div>';
  h+='<section class="card"><h2>إزاي بيشتغل</h2><ul class="wl"><li>كل تعديل بيتحفظ على الجهاز فورًا، حتى من غير نت، وبيترفع أول ما النت يرجع.</li><li>الموبايل والكمبيوتر المربوطين بيشوفوا نفس البيانات.</li><li>مفيش حاجة بتتمسح نهائي: المحذوف بيتأرشف، وكل تعديل متسجل في سجل التغييرات على السحابة.</li><li>الدخول برابط ربط سري لكل جهاز (من غير باسورد). خلي الرابط معاك بس — اللي معاه الرابط يقدر يشوف ويعدّل.</li><li>نسخة كاملة (JSON + إكسيل) كل يوم 11 بالليل بتوقيت القاهرة على السحابة.</li></ul></section>';
  h+='<button class="btn ghost wide" data-act="syncUnlink">فصل الجهاز ده</button>';return h};
VIEWS.backup=function(){const s=S();return '<div class="vh"><button class="btn sm ghost" data-go="#/more">رجوع</button><h2>النسخة الاحتياطية</h2><span></span></div>'+
  '<section class="card"><p>البيانات بتتحفظ على الجهاز وبتترفع على السحابة أول بأول (لو الجهاز مربوط)، والسحابة بتعمل نسخة كاملة كل يوم الساعة 11 بالليل بتوقيت القاهرة. وتقدر كمان تاخد نسخة في ملف بإيدك هنا.</p>'+
  '<div class="mut">آخر نسخة: '+(s.lastBackup?E.dmy(E.cairoIso(new Date(s.lastBackup)))+' '+E.cairoTime(new Date(s.lastBackup))+' (القاهرة)':'لسه')+'</div>'+
  '<div class="quick q2"><button class="btn pri" data-act="backup">حفظ نسخة (JSON)</button><button class="btn" data-act="restore">استرجاع من ملف</button></div><input type="file" id="restoreFile" accept="application/json,.json" hidden>'+
  '<div class="hint">الاسترجاع بيمسح البيانات الحالية على الجهاز ويحط بيانات الملف مكانها.</div></section>'+
  '<section class="card"><h2>الأعداد</h2><div class="mut">'+[['purchases','فواتير خام'],['transports','نقل'],['supplyIn','فواتير مستلزمات'],['runs','تشغيلات'],['sales','مبيعات'],['payments','دفعات وتحصيلات'],['parties','حسابات']].map(x=>x[1]+' '+D[x[0]].length).join(' · ')+'</div></section>'};

const ARC_K={purchases:['purchase','فاتورة خام'],transports:['transport','نقل'],payments:['payment','دفعة / تحصيل'],supplyIn:['supplyIn','فاتورة مستلزمات'],transfers:['transfer','تحويل مستلزمات'],runs:['run','تشغيلة'],sales:['sale','بيع'],parties:['party','حساب'],factories:['factory','مصنع / مخزن'],varieties:['variety','صنف'],items:['item','صنف مستلزمات']};
let ARC=null;
async function loadArc(){const live={};E.COLLS.forEach(c=>D[c].forEach(v=>live[c+':'+v.id]=1));const t=await Store.tombs();ARC=t.filter(x=>ARC_K[x.c]&&!live[x.k]).sort((a,b)=>String(b.v.deletedAt||b.v.updatedAt||'').localeCompare(String(a.v.deletedAt||a.v.updatedAt||'')));if(route().v==='archive'&&!F)render()}
function arcLabel(x){const v=x.v,k=ARC_K[x.c][1];let s=k+(v.no!=null&&v.no!==''?' #'+v.no:'')+(v.name?' — '+v.name:'');
  if(v.supplierId||v.customerId||v.partyId||v.transporterId)s+=' — '+name('parties',v.supplierId||v.customerId||v.partyId||v.transporterId);if(v.date)s+=' — '+E.dmy(v.date);if(v.amount)s+=' — '+f2(n(v.amount))+(v.cur==='USD'?' $':' ج');return s}
VIEWS.archive=function(){let h='<div class="vh"><button class="btn sm ghost" data-go="#/more">رجوع</button><h2>الأرشيف</h2><span></span></div>';
  if(!ARC){loadArc();return h+empty('بيحمّل…')}
  h+='<div class="hint">أي حاجة بتتمسح بتتنقل هنا ببياناتها كاملة (ومع السحابة كمان). «ترجيع» بيرجعها زي ما كانت.</div>';
  return h+(ARC.length?'<div class="list arc">'+ARC.map(x=>'<div class="row"><div><b>'+esc(arcLabel(x))+'</b><div class="mut sm">اتمسح '+(x.v.deletedAt?E.dmy(E.cairoIso(new Date(x.v.deletedAt)))+' '+E.cairoTime(new Date(x.v.deletedAt)):'')+'</div></div><button class="btn sm" data-act="unarc" data-id="'+esc(x.k)+'">ترجيع</button></div>').join('')+'</div>':empty('الأرشيف فاضي.'))};
async function unArchive(k){const x=(ARC||[]).find(a=>a.k===k);if(!x)return;const v=JSON.parse(JSON.stringify(x.v));delete v.deletedAt;
  if(get(x.c,v.id)){toast('موجود بالفعل');return}
  if(D[x.c].some(o=>o.no!=null&&o.no!==''&&String(o.no)===String(v.no))&&['purchases','transports','payments','supplyIn','transfers','runs','sales'].indexOf(x.c)>=0){v.no=nextNo(x.c);toast('الرقم كان مستخدم — اتغير لـ '+v.no)}
  if(!await ask('ترجّع «'+arcLabel(x)+'»؟'))return;await Store.untomb(k);ARC=null;await upsert(x.c,v);loadArc();toast('اترجّع من الأرشيف')}

/* ===== محرك النماذج ===== */
function getP(o,p){return p.split('.').reduce((a,k)=>a==null?a:a[k],o)}
function setP(o,p,v){const ks=p.split('.');let a=o;for(let i=0;i<ks.length-1;i++){if(a[ks[i]]==null)a[ks[i]]=/^\d+$/.test(ks[i+1])?[]:{};a=a[ks[i]]}a[ks[ks.length-1]]=v}
function fi(label,p,o){o=o||{};const v=getP(F.d,p);let val=v==null?'':v;if(o.date)val=String(val).charAt(0)==='!'?String(val).slice(1):E.dmy(val);
  return '<div class="f'+(o.full?' full':'')+'"><label>'+label+'</label><div class="in'+(o.bad?' bad':'')+'"><input '+(o.date?'data-date="1" inputmode="numeric" placeholder="يوم/شهر/سنة" ':o.txt?'class="txt" ':'inputmode="decimal" ')+'data-p="'+p+'" value="'+esc(val)+'"'+(o.rr?' data-rr="1"':'')+(o.list?' list="'+o.list+'"':'')+'>'+(o.u?'<span class="u">'+o.u+'</span>':'')+'</div>'+(o.hint?'<div class="hint">'+o.hint+'</div>':'')+'</div>'}
function fs(label,p,opts,o){o=o||{};return '<div class="f'+(o.full?' full':'')+'"><label>'+label+'</label><select class="sel" data-p="'+p+'" data-rr="1"'+(o.newType?' data-new="'+o.newType+'"':'')+'>'+opt(opts,getP(F.d,p),o.ph==null?'— اختار —':o.ph)+(o.newType?'<option value="__new">+ جديد…</option>':'')+'</select>'+(o.hint?'<div class="hint">'+o.hint+'</div>':'')+'</div>'}
function fseg(label,p,opts,o){const v=getP(F.d,p);return '<div class="f'+((o||{}).half?'':' full')+'"><label>'+label+'</label><div class="seg in2">'+opts.map(x=>'<button type="button" data-fset="'+p+'" data-v="'+x[0]+'" class="'+(String(v)===String(x[0])?'on':'')+'">'+x[1]+'</button>').join('')+'</div></div>'}
function sec(t){return '<div class="sec">'+t+'</div>'}
function openForm(spec){F=spec;F.d=JSON.parse(JSON.stringify(spec.rec));F.isNew=!spec.rec.id;drawForm();$('#sheet').hidden=false;document.body.classList.add('modal');$('#sheet').scrollTop=0}
function closeForm(){const st=F&&F.staleRender;F=null;if(st)setTimeout(render,0);$('#sheet').hidden=true;$('#sheet').innerHTML='';document.body.classList.remove('modal')}
function drawForm(){const sc=$('#sheet').scrollTop;$('#sheet').innerHTML='<div class="sh"><div class="shb"><button class="btn sm ghost" data-act="fclose">إلغاء</button><h2>'+F.title+'</h2><button class="btn sm pri" data-act="fsave">حفظ</button></div>'+
  '<div class="shc"><div class="grid">'+F.body(F.d)+(!F.isNew&&LOGC.indexOf(F.coll)>=0&&F.d.edits&&F.d.edits.length?'<div class="f full">'+enote(F.d)+'</div>':'')+'</div><div id="fsum">'+(F.summary?F.summary(F.d):'')+'</div><div id="ferr"></div>'+
  '<div class="actions a2"><button class="btn pri" data-act="fsave">حفظ</button>'+(!F.isNew&&F.del?'<button class="btn danger" data-act="fdel">حذف</button>':'<button class="btn ghost" data-act="fclose">إلغاء</button>')+'</div></div></div>';$('#sheet').scrollTop=sc}
function liveSum(){if(F&&F.summary)$('#fsum').innerHTML=F.summary(F.d);$('#ferr').innerHTML=''}
function dateOk(v){return /^\d{4}-\d{2}-\d{2}$/.test(v||'')}
function lineBox(title,arrP,cols,tpl,addTxt){const L=getP(F.d,arrP)||[];return '<div class="f full lines"><label>'+title+'</label>'+L.map((l,i)=>'<div class="ln">'+cols(l,i,arrP+'.'+i)+'<button type="button" class="x" data-ldel="'+arrP+'.'+i+'" aria-label="حذف">×</button></div>').join('')+'<button type="button" class="btn ghost wide" data-ladd="'+arrP+'" data-tpl=\''+esc(JSON.stringify(tpl))+'\'>'+addTxt+'</button></div>'}
function lsel(p,opts,ph,o){return '<select class="sel" data-p="'+p+'" data-rr="1"'+(o&&o.newType?' data-new="'+o.newType+'"':'')+'>'+opt(opts,getP(F.d,p),ph||'— اختار —')+(o&&o.newType?'<option value="__new">+ جديد…</option>':'')+'</select>'}
function lin(p,ph,o){o=o||{};const v=getP(F.d,p);return '<label class="li"><span>'+ph+'</span><input '+(o.txt?'class="txt" ':'inputmode="decimal" ')+'data-p="'+p+'" value="'+esc(v==null?'':v)+'"'+(o.list?' list="'+o.list+'"':'')+(o.rr?' data-rr="1"':'')+'></label>'}
function sumBox(rows){return '<div class="fsum">'+rows.filter(Boolean).map(r=>'<div class="'+(r[2]||'')+'"><span>'+r[0]+'</span><b class="num">'+r[1]+'</b></div>').join('')+'</div>'}
function tmpCompute(c,rec){const D2={};E.COLLS.forEach(k=>D2[k]=D[k]);D2[c]=D[c].filter(x=>x.id!==rec.id).concat([Object.assign({},rec,{id:rec.id||'__draft',createdAt:rec.createdAt||'9999'})]);return{C:E.compute(D2),id:rec.id||'__draft'}}

/* ----- النماذج ----- */
const FORMS={};
FORMS.purchase=function(rec){const s=S();rec=rec||{date:today(),no:nextNo('purchases'),varietyId:(D.varieties[0]||{}).id,factoryId:(D.factories[0]||{}).id,sackKg:s.sackKg||25,disc:''};
  return{title:rec.id?'فاتورة خام #'+rec.no:'فاتورة شراء خام',coll:'purchases',rec,del:true,
  body:d=>fi('التاريخ','date',{date:1})+fi('رقم الفاتورة','no',{})+fs('المورد','supplierId',parties(['raw']).map(p=>[p.id,p.name]),{full:1,newType:'raw'})+fs('الصنف','varietyId',varOpts(),{newType:'variety'})+fs('المصنع (رايح فين)','factoryId',facOpts(),{newType:'factory'})+
    sec('ميزان البسكول')+fi('رقم العربية','plate',{txt:1})+fi('رقم تذكرة الميزان','ticketNo',{txt:1})+fi('الوزن القائم','gross',{u:'كجم'})+fi('الفارغ','tare',{u:'كجم'})+fi('خصم الميزان المتفق عليه','disc',{u:'%',hint:'الافتراضي من حساب المورد، وتقدر تغيره للفاتورة دي'})+fi('سعر الكيلو','price',{u:'ج/كجم'})+
    sec('الشكاير')+fi('عدد الشكاير','sacks',{})+fi('وزن الشيكارة','sackKg',{u:'كجم'})+fi('رقم لوت المورد / الجودة','lotNo',{txt:1,hint:'مثلًا FS-2611-01 — للربط مع برنامج الجودة'})+fi('ملاحظات','notes',{txt:1}),
  summary:d=>{const net=Math.max(n(d.gross)-n(d.tare),0),dd=n(d.disc),pk=net*(1-dd/100),amt=pk*n(d.price);const x=d.id&&C.P[d.id];
    return sumBox([['الصافي على الميزان',f0(net)+' كجم'],dd?['خصم '+f2(dd)+'% = '+f1(net-pk)+' كجم','قيمته '+f2((net-pk)*n(d.price))+' ج']:null,['الوزن المحاسب عليه',f1(pk)+' كجم'],['قيمة الفاتورة',f2(amt)+' ج','big'],
      n(d.sacks)?['متوسط الشيكارة',f2(net/n(d.sacks))+' كجم (المسجل '+f2(n(d.sackKg))+')']:null,x&&x.trans?['نقل محمّل على الفاتورة',f2(x.trans)+' ج']:null,x?['المستخدم في تشغيلات',f0(x.used)+' كجم — باقي '+f0(net-x.used)]:null])},
  validate:d=>{const e=[];if(!dateOk(d.date))e.push('التاريخ مكتوب غلط (يوم/شهر/سنة)');if(!d.supplierId)e.push('اختار المورد');if(!d.varietyId)e.push('اختار الصنف');if(!d.factoryId)e.push('اختار المصنع');
    const net=n(d.gross)-n(d.tare);if(!(n(d.gross)>0))e.push('الوزن القائم لازم أكبر من صفر');if(!(net>0))e.push('الفارغ لازم أقل من القائم');if(n(d.disc)<0||n(d.disc)>=100)e.push('خصم الميزان من 0 لأقل من 100%');if(!(n(d.price)>0))e.push('سعر الكيلو لازم أكبر من صفر');
    ['gross','tare','disc','price','sacks','sackKg'].forEach(k=>{if(String(d[k]==null?'':d[k]).trim()!==''&&!isFinite(E.parse(d[k])))e.push('رقم مكتوب غلط في خانة '+k)});
    if(d.id&&C.P[d.id]&&C.P[d.id].used>net+1e-6)e.push('الصافي أقل من المستخدم في التشغيلات ('+f0(C.P[d.id].used)+' كجم)');
    if(d.id&&C.P[d.id]&&C.P[d.id].uses.some(u=>{const r=get('runs',u.runId);return r&&r.varietyId!==d.varietyId}))e.push('الفاتورة داخلة في تشغيلة صنف تاني — مينفعش تغير الصنف');return e},
  onChange:(d,p)=>{if(p==='supplierId'){const sp=get('parties',d.supplierId);if(sp&&sp.disc!=null&&sp.disc!=='')d.disc=sp.disc}},
  canDel:d=>{const x=C.P[d.id];if(x&&x.used>0)return 'الفاتورة داخلة في تشغيلة، شيلها من التشغيلة الأول';if(D.transports.some(t=>(t.purchaseIds||[]).indexOf(d.id)>=0))return 'الفاتورة مربوطة بنقلة، عدّل النقلة الأول';return ''}}};
FORMS.transport=function(rec){rec=rec||{date:today(),no:nextNo('transports'),purchaseIds:[],mode:'p'};if(!rec.mode)rec.mode=rec.runId&&!(rec.purchaseIds||[]).length?'r':'p';
  return{title:rec.id?'نقل #'+rec.no:'نقلة جديدة',coll:'transports',rec,del:true,
  body:d=>{const sel=d.purchaseIds||[];const srt=D.purchases.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));const ps=srt.slice(0,60).concat(srt.slice(60).filter(p=>sel.indexOf(p.id)>=0));
    return fi('التاريخ','date',{date:1})+fi('رقم','no',{})+fs('مورد النقل','transporterId',parties(['transport']).map(p=>[p.id,p.name]),{full:1,newType:'transport'})+fi('المبلغ','amount',{u:'ج'})+fi('رقم العربية / السواق','plate',{txt:1})+
    fseg('النقلة دي تتحمل على','mode',[['p','فواتير خام'],['r','تشغيلة (تكلفة مشتركة)']])+
    (d.mode==='r'?fs('التشغيلة','runId',D.runs.map(r=>[r.id,runLabel(r)]),{full:1}):'<div class="f full"><label>الفواتير (المبلغ بيتوزع على صافي وزنها)</label><div class="checks">'+(ps.length?ps.map(p=>'<label class="chk"><input type="checkbox" data-chk="purchaseIds" value="'+p.id+'"'+((d.purchaseIds||[]).indexOf(p.id)>=0?' checked':'')+'> '+esc(purchLabel(p))+'</label>').join(''):'<div class="mut">مفيش فواتير خام.</div>')+'</div></div>')+fi('ملاحظات','notes',{txt:1,full:1})},
  summary:d=>{if(d.mode==='r')return sumBox([['تكلفة مشتركة على التشغيلة',f2(n(d.amount))+' ج']]);const ids=d.purchaseIds||[];const tot=ids.reduce((a,id)=>a+((C.P[id]||{}).net||0),0);
    return sumBox(ids.map(id=>{const p=get('purchases',id),x=C.P[id];return p?['#'+p.no+' '+name('parties',p.supplierId),f2(tot?n(d.amount)*x.net/tot:0)+' ج = '+f3(tot?n(d.amount)/tot:0)+' ج/كجم']:null}))},
  validate:d=>{const e=[];if(!dateOk(d.date))e.push('التاريخ مكتوب غلط');if(!d.transporterId)e.push('اختار مورد النقل');if(!(n(d.amount)>0))e.push('المبلغ لازم أكبر من صفر');
    if(d.mode==='r'&&!d.runId)e.push('اختار التشغيلة');if(d.mode!=='r'&&!(d.purchaseIds||[]).length)e.push('اختار فاتورة خام واحدة على الأقل');return e},
  prep:d=>{if(d.mode==='r')d.purchaseIds=[];else d.runId='';return d}}};
function f3(x){return fm(x,3)}
FORMS.payment=function(rec,o){o=o||{};rec=rec||{date:today(),no:nextNo('payments'),dir:o.dir||'out',method:'transfer',cur:'EGP',rate:S().usdRate,partyId:o.party||''};
  return{title:rec.id?(rec.dir==='in'?'تحصيل #':'دفعة #')+rec.no:'دفعة / تحصيل',coll:'payments',rec,del:true,
  body:d=>{const L=d.dir==='in'?parties(CUST).concat(parties(SUPT)):parties(SUPT).concat(parties(CUST));
    return fseg('النوع','dir',[['out','دفعة لمورد'],['in','تحصيل من عميل']])+fi('التاريخ','date',{date:1})+fi('رقم','no',{})+fs(d.dir==='in'?'العميل':'المورد','partyId',L.map(p=>[p.id,E.PTYPES[p.type]+': '+p.name]),{full:1})+
    fseg('طريقة الدفع','method',[['transfer','تحويل بنكي'],['cash','كاش']])+fseg('العملة','cur',[['EGP','جنيه'],['USD','دولار']],{half:1})+(d.cur==='USD'?fi('سعر الدولار','rate',{u:'ج'}):'')+fi('المبلغ','amount',{u:d.cur==='USD'?'$':'ج'})+fi('رقم التحويل / المرجع','ref',{txt:1})+fi('ملاحظات','notes',{txt:1,full:1})},
  summary:d=>{if(!d.partyId)return '';const b=(C.BAL[d.partyId]||{bal:0}).bal;let old=0;if(d.id){const x=get('payments',d.id);if(x)old=(x.dir==='in'?1:-1)*n(x.amount)*(x.cur==='USD'?n(x.rate):1)}
    const before=b+old,a=n(d.amount)*(d.cur==='USD'?n(d.rate):1),after=before+(d.dir==='in'?-a:a);
    return sumBox([d.cur==='USD'?['بالجنيه',f2(a)+' ج']:null,['الرصيد قبل',balTxt(before)],['الرصيد بعد',balTxt(after),'big']])},
  validate:d=>{const e=[];if(!dateOk(d.date))e.push('التاريخ مكتوب غلط');if(!d.partyId)e.push('اختار الحساب');if(!(n(d.amount)>0))e.push('المبلغ لازم أكبر من صفر');if(d.cur==='USD'&&!(n(d.rate)>0))e.push('اكتب سعر الدولار');return e}}};
FORMS.supplyIn=function(rec){rec=rec||{date:today(),no:nextNo('supplyIn'),locId:(D.factories[0]||{}).id,lines:[{itemId:'',qty:'',price:''}]};
  return{title:rec.id?'فاتورة مستلزمات #'+rec.no:'شراء مستلزمات',coll:'supplyIn',rec,del:true,
  body:d=>fi('التاريخ','date',{date:1})+fi('رقم','no',{})+fs('مورد المستلزمات','supplierId',parties(['supply']).map(p=>[p.id,p.name]),{full:1,newType:'supply'})+fs('المخزن (المكان)','locId',facOpts(),{newType:'factory'})+fi('رقم فاتورة المورد','invNo',{txt:1})+
    lineBox('الأصناف','lines',(l,i,p)=>lsel(p+'.itemId',itemOpts(),'الصنف',{newType:'item'})+lin(p+'.qty','الكمية')+lin(p+'.price','سعر الوحدة')+'<span class="lt num">'+f2(n(l.qty)*n(l.price))+'</span>',{itemId:'',qty:'',price:''},'+ صنف')+fi('ملاحظات','notes',{txt:1,full:1}),
  summary:d=>sumBox([['إجمالي الفاتورة',f2((d.lines||[]).reduce((a,l)=>a+n(l.qty)*n(l.price),0))+' ج','big']]),
  validate:d=>{const e=[];if(!dateOk(d.date))e.push('التاريخ مكتوب غلط');if(!d.supplierId)e.push('اختار المورد');if(!d.locId)e.push('اختار المخزن');if(!(d.lines||[]).length)e.push('ضيف صنف');
    (d.lines||[]).forEach((l,i)=>{if(!l.itemId)e.push('سطر '+(i+1)+': اختار الصنف');if(!(n(l.qty)>0))e.push('سطر '+(i+1)+': الكمية');if(!(n(l.price)>=0)||String(l.price).trim()==='')e.push('سطر '+(i+1)+': السعر')});return e}}};
FORMS.transfer=function(rec){rec=rec||{date:today(),no:nextNo('transfers'),lines:[{itemId:'',qty:''}]};
  return{title:rec.id?'تحويل #'+rec.no:'تحويل مستلزمات',coll:'transfers',rec,del:true,
  body:d=>fi('التاريخ','date',{date:1})+fi('رقم','no',{})+fs('من مخزن','fromId',facOpts(),{newType:'factory'})+fs('إلى مخزن','toId',facOpts(),{newType:'factory'})+
    lineBox('الأصناف','lines',(l,i,p)=>lsel(p+'.itemId',itemOpts(),'الصنف',{newType:'item'})+lin(p+'.qty','الكمية')+'<span class="lt">الرصيد '+N(f0(l.itemId&&d.fromId?(C.SUP[l.itemId].loc[d.fromId]||0):0))+'</span>',{itemId:'',qty:''},'+ صنف'),
  validate:d=>{const e=[];if(!dateOk(d.date))e.push('التاريخ مكتوب غلط');if(!d.fromId||!d.toId)e.push('اختار المخزنين');if(d.fromId&&d.fromId===d.toId)e.push('المخزنين لازم يختلفوا');
    (d.lines||[]).forEach((l,i)=>{if(!l.itemId)e.push('سطر '+(i+1)+': اختار الصنف');if(!(n(l.qty)>0))e.push('سطر '+(i+1)+': الكمية')});return e},
  confirm:d=>{const t=tmpCompute('transfers',d);const w=t.C.warns.filter(x=>x.type==='transfer'&&x.id===t.id);return w.length?'الرصيد مش كفاية في مخزن '+name('factories',d.fromId)+':\n'+w.map(x=>'• '+name('items',x.item)+': محتاج '+f0(x.need)+' والموجود '+f0(x.have)).join('\n')+'\nتحفظ برضه؟ (هيظهر في «محتاج مراجعة»)':''}}};
function estFields(pre){const v=getP(F.d,pre)||{};const L=esc(v.sizeLabel||'الفرزة');
  return sec('أرقام التقدير (من تكلفة المجمدات)')+fi('سعر كيلو الخام','%.inputs.price'.replace('%',pre),{u:'ج/كجم'})+fi('نسبة الهالك',pre+'.inputs.waste',{u:'%'})+fi('اسم الحجم/الفرزة',pre+'.sizeLabel',{txt:1})+fi('نسبة '+L,pre+'.inputs.over',{u:'%'})+fi('سعر كيلو '+L,pre+'.inputs.overPrice',{u:'ج/كجم'})+
  fi('صافي الحاوية',pre+'.inputs.tons',{u:'طن'})+fi('وزن الكرتونة',pre+'.inputs.carton',{u:'كجم'})+fi('حمولة النقلة',pre+'.inputs.truckLoad',{u:'طن'})+fi('سعر النقلة',pre+'.inputs.truckPrice',{u:'ج'})+fi('سعر الدولار',pre+'.inputs.usd',{u:'ج'})+
  lineBox('مستلزمات وبنود التقدير (ج للطن الصادر)',pre+'.supplies',(l,i,p)=>lin(p+'.name','البند',{txt:1})+lin(p+'.v','ج/طن'),{name:'',v:''},'+ بند')}
function estSum(v){if(!v)return null;const r=E.fcCalc(v);return ['التكلفة المقدرة للطن',f0(r.total)+' ج','big']}
FORMS.run=function(rec){const s=S();if(!rec){const v=D.varieties[0];rec={date:today(),no:nextNo('runs'),factoryId:(D.factories[0]||{}).id,varietyId:v&&v.id,inputs:[{purchaseId:'',kg:''}],cartonKg:s.cartonKg||10,farzSackKg:s.sackKg||25,
    farzTemp:'',supplies:[],costs:[],est:v?JSON.parse(JSON.stringify(v.est)):null}}
  return{title:rec.id?'تشغيلة #'+rec.no:'تشغيلة جديدة',coll:'runs',rec,del:true,
  body:d=>{const avail=D.purchases.filter(p=>(C.P[p.id].remain>0.5||(d.inputs||[]).some(i=>i.purchaseId===p.id))&&(!d.varietyId||p.varietyId===d.varietyId)).map(p=>[p.id,purchLabel(p)+' — باقي '+f0(C.P[p.id].remain+((get('runs',d.id)||{inputs:[]}).inputs||[]).filter(i=>i.purchaseId===p.id).reduce((a,i)=>a+n(i.kg),0))]);
    const by=!!d.yieldBySupplier;
    return fi('التاريخ','date',{date:1})+fi('رقم التشغيلة','no',{})+fs('المصنع','factoryId',facOpts(),{newType:'factory'})+fs('الصنف','varietyId',varOpts(),{newType:'variety'})+
    sec('الخام الداخل (من فواتير الشراء)')+'<label class="chk full"><input type="checkbox" data-bool="yieldBySupplier"'+(by?' checked':'')+'> الإنتاج متسجل لكل مورد لوحده (كراتين وشكاير فرزة لكل سطر)</label>'+
    lineBox('','inputs',(l,i,p)=>lsel(p+'.purchaseId',avail,'الفاتورة')+lin(p+'.kg','كجم خام')+(by?lin(p+'.cartons','كراتين')+lin(p+'.farzSacks','شكاير فرزة'):''),{purchaseId:'',kg:''},'+ سطر خام')+
    sec('الإنتاج')+(by?'':fi('عدد الكراتين','cartons',{}))+fi('وزن الكرتونة الصافي','cartonKg',{u:'كجم'})+(by?'':fi('شكاير الفرزة','farzSacks',{}))+fi('وزن شيكارة الفرزة','farzSackKg',{u:'كجم'})+(by?'':fi('فرزة سايبة (مش في شكاير)','farzExtraKg',{u:'كجم'}))+
    fi('سعر فرزة مؤقت (اختياري)','farzTemp',{u:'ج/كجم',hint:S().farzMethod==='joint'?'مش محتاجه بطريقة التوزيع بالوزن':farzHint(d)})+
    sec('المستلزمات المصروفة من المخزن')+lineBox('','supplies',(l,i,p)=>lsel(p+'.itemId',itemOpts(),'الصنف',{newType:'item'})+lin(p+'.qty','الكمية')+lsel(p+'.locId',facOpts(),'المخزن',{newType:'factory'})+'<span class="lt">رصيد '+N(f0(l.itemId?(C.SUP[l.itemId].loc[l.locId||d.factoryId]||0):0))+' · '+N(f2(l.itemId?C.SUP[l.itemId].avg:0))+' ج</span>',{itemId:'',qty:'',locId:d.factoryId||''},'+ مستلزم')+
    sec('تكاليف التشغيل')+lineBox('','costs',(l,i,p)=>lin(p+'.name','البند',{txt:1,list:'costCats'})+lin(p+'.amount','المبلغ ج')+lsel(p+'.partyId',parties(['service','transport','supply','raw']).map(x=>[x.id,x.name]),'على حساب (اختياري)',{newType:'service'}),{name:'',amount:'',partyId:''},'+ بند تكلفة')+
    '<details class="full est"'+(F.openEst?' open':'')+'><summary data-act="toggleEst">التكلفة المقدرة للتشغيلة دي (تتعدل) — '+(d.est?f0(E.fcCalc(d.est).total)+' ج/طن':'')+'</summary><div class="grid">'+(d.est?estFields('est'):'')+'<button type="button" class="btn ghost wide full" data-act="estReset">رجّع تقدير الصنف</button></div></details>'+
    fi('ملاحظات','notes',{txt:1,full:1})},
  summary:d=>{const t=tmpCompute('runs',d),x=t.C.R[t.id];if(!x)return '';
    return sumBox([['خام داخل',f0(x.rawKg)+' كجم'],['نهائي',f0(x.fin)+' كجم ('+f1(x.yieldFin)+'%)'],['فرزة',f0(x.farz)+' كجم ('+f1(x.yieldFarz)+'%)'],['هالك (الفرق)',f0(x.waste)+' كجم ('+f1(x.yieldWaste)+'%)'],['إجمالي التكلفة',f0(x.total)+' ج'],
      ['تكلفة الطن الصادر',x.fin>0?f0(x.perTon)+' ج':'—','big']].concat(x.rows.map(s=>['• '+esc(s.name),f0(s.perTon)+' ج/طن'])).concat([x.cmp?['المقدر / الفرق',f0(x.cmp.eT)+' / '+(x.cmp.v>0?'+':'')+f0(x.cmp.v)]:null]))},
  validate:d=>{const e=[];if(!dateOk(d.date))e.push('التاريخ مكتوب غلط');if(!d.factoryId)e.push('اختار المصنع');if(!d.varietyId)e.push('اختار الصنف');
    const use={};(d.inputs||[]).forEach((l,i)=>{if(!l.purchaseId)e.push('سطر خام '+(i+1)+': اختار الفاتورة');if(!(n(l.kg)>0))e.push('سطر خام '+(i+1)+': الكمية');use[l.purchaseId]=(use[l.purchaseId]||0)+n(l.kg)});
    if(!(d.inputs||[]).length)e.push('ضيف الخام الداخل');
    const old={};const orec=d.id&&get('runs',d.id);if(orec)(orec.inputs||[]).forEach(i=>old[i.purchaseId]=(old[i.purchaseId]||0)+n(i.kg));
    Object.keys(use).forEach(pid=>{const x=C.P[pid];if(!x)return;const av=x.remain+(old[pid]||0);if(use[pid]>av+1e-6)e.push('فاتورة #'+get('purchases',pid).no+': المتاح '+f0(av)+' كجم بس')});
    (d.supplies||[]).forEach((l,i)=>{if(!l.itemId)e.push('مستلزم '+(i+1)+': اختار الصنف');if(!(n(l.qty)>0))e.push('مستلزم '+(i+1)+': الكمية')});
    (d.costs||[]).forEach((l,i)=>{if(!(n(l.amount)>0))e.push('بند تكلفة '+(i+1)+': المبلغ')});
    if(!(n(d.cartonKg)>0))e.push('وزن الكرتونة لازم أكبر من صفر');if(!(n(d.farzSackKg)>0))e.push('وزن شيكارة الفرزة لازم أكبر من صفر');
    const t=tmpCompute('runs',d),x=t.C.R[t.id];x.errs.forEach(m=>{if(!/الفاتورة مش موجودة|الكمية لازم/.test(m))e.push(m)});
    if(d.id&&C.R[d.id]){const o=C.R[d.id];if(x.fin+1e-6<o.soldFin)e.push('الإنتاج النهائي ('+f0(x.fin)+' كجم) أقل من المباع منه ('+f0(o.soldFin)+' كجم) — عدّل المبيعات الأول');if(x.farz+1e-6<o.soldFarz)e.push('الفرزة ('+f0(x.farz)+' كجم) أقل من المباع منها ('+f0(o.soldFarz)+' كجم)')}if(String(d.farzTemp==null?'':d.farzTemp).trim()!==''&&!(E.parse(d.farzTemp)>=0))e.push('السعر المؤقت مكتوب غلط');return e},
  confirm:d=>{const t=tmpCompute('runs',d);const w=t.C.warns.filter(x=>x.type==='issue'&&x.run===t.id);return w.length?'المستلزمات المصروفة أكتر من الرصيد:\n'+w.map(x=>'• '+name('items',x.item)+' من '+name('factories',x.loc)+': محتاج '+f0(x.need)+' والموجود '+f0(x.have)).join('\n')+'\nتحفظ برضه؟ (هيظهر في «محتاج مراجعة» لحد ما تسجل فاتورة الشراء أو التحويل)':''},
  onChange:(d,p)=>{if(p==='varietyId'){const v=get('varieties',d.varietyId);if(v)ask('تحط التكلفة المقدرة بتاعة '+v.name+'؟').then(ok=>{if(ok&&F&&F.d===d&&d.varietyId===v.id){d.est=JSON.parse(JSON.stringify(v.est));drawForm()}})}
    if(p==='factoryId')(d.supplies||[]).forEach(l=>{if(!l.locId)l.locId=d.factoryId})},
  canDel:d=>{if(D.sales.some(s=>(s.lines||[]).some(l=>l.runId===d.id)))return 'فيه مبيعات من التشغيلة دي، امسحها الأول';if(D.transports.some(t=>t.runId===d.id&&!(t.purchaseIds||[]).length))return 'فيه نقلة مربوطة بالتشغيلة';return ''},
  after:rec=>{location.hash='#/run/'+rec.id}}};
function farzHint(d){if(!d.id)return 'الفرزة بتتخصم من التكلفة بسعر البيع الفعلي لعملاء الفرزة. لحد ما تتباع، تقدر تكتب هنا سعر مؤقت (التكلفة هتفضل «مبدئي»)، أو تسيبه فاضي.';const x=C.R[d.id];if(!x)return '';
  return 'اتباع '+f0(x.farzSoldKg)+' كجم من '+f0(x.farz)+(x.farzSoldKg>0.005?' بمتوسط صافي '+f2(x.farzAvg)+' ج/كجم':'')+'. السعر المؤقت بيتطبق بس على الباقي ('+f0(x.farzUnsold)+' كجم)، وبيتجاهل لما الفرزة كلها تتباع.'}
FORMS.sale=function(rec,o){o=o||{};rec=rec||{date:today(),no:nextNo('sales'),kind:o.kind||'export',cur:(o.kind||'export')==='export'?'USD':'EGP',rate:S().usdRate,customerId:(o.kind||'export')==='export'?((parties(['export'])[0]||{}).id||''):'',lines:[{runId:'',cartons:'',kg:'',price:''}],expenses:[]};
  return{title:rec.id?'بيع #'+rec.no:'بيع جديد',coll:'sales',rec,del:true,
  body:d=>{const ex=d.kind!=='farz';const cs=parties([ex?'export':'farz']);const runs=D.runs.filter(r=>{const x=C.R[r.id];return (ex?x.stockFin:x.stockFarz)>0.005||(d.lines||[]).some(l=>l.runId===r.id)}).map(r=>{const x=C.R[r.id];return [r.id,runLabel(r)+' — متاح '+(ex?f0(x.stockFin/x.cartonKg)+' كرتونة':f0(x.stockFarz)+' كجم')]});
    return fseg('نوع البيع','kind',[['export','تصدير (إنتاج نهائي)'],['farz','فرزة']])+fi('التاريخ','date',{date:1})+fi('رقم','no',{})+fs('العميل','customerId',cs.map(p=>[p.id,p.name]),{full:1,newType:ex?'export':'farz'})+fi('رقم الفاتورة / الحاوية','invNo',{txt:1})+
    fseg('العملة','cur',[['EGP','جنيه'],['USD','دولار']],{half:1})+(d.cur==='USD'?fi('سعر الدولار','rate',{u:'ج'}):'')+
    lineBox(ex?'الكميات (كراتين من تشغيلة)':'الكميات (كيلو فرزة من تشغيلة)','lines',(l,i,p)=>lsel(p+'.runId',runs,'التشغيلة')+(ex?lin(p+'.cartons','كراتين'):lin(p+'.kg','كجم'))+lin(p+'.price',ex?'السعر/طن ('+(d.cur==='USD'?'$':'ج')+')':'السعر/كجم ('+(d.cur==='USD'?'$':'ج')+')'),{runId:'',cartons:'',kg:'',price:''},'+ سطر')+
    lineBox('مصروفات على البيع ده (نولون، تخليص، نقل…) بالجنيه','expenses',(l,i,p)=>lin(p+'.name','البند',{txt:1})+lin(p+'.amount','المبلغ ج')+lsel(p+'.partyId',parties(['transport','service','supply']).map(x=>[x.id,x.name]),'على حساب (اختياري)',{newType:'service'}),{name:'',amount:'',partyId:''},'+ مصروف')+fi('ملاحظات','notes',{txt:1,full:1})},
  summary:d=>{const t=tmpCompute('sales',d),x=t.C.SL[t.id];if(!x)return '';return sumBox([['الكمية',f0(x.kg)+' كجم'+(x.kind==='export'?' = '+f3(x.kg/1000)+' طن':'')],x.cur==='USD'?['القيمة بالدولار','$'+f2(x.amount)]:null,['الإيراد بالجنيه',f2(x.rev)+' ج'],['تكلفة البضاعة (من تكلفة التشغيلة)',f2(x.cogs)+' ج'],x.exp?['مصروفات البيع',f2(x.exp)+' ج']:null,['صافي الربح',f2(x.profit)+' ج ('+f1(x.margin)+'%)','big']])},
  validate:d=>{const e=[];if(!dateOk(d.date))e.push('التاريخ مكتوب غلط');if(!d.customerId)e.push('اختار العميل');if(d.cur==='USD'&&!(n(d.rate)>0))e.push('اكتب سعر الدولار');if(!(d.lines||[]).length)e.push('ضيف سطر');
    const ex=d.kind!=='farz',use={};(d.lines||[]).forEach((l,i)=>{if(!l.runId)e.push('سطر '+(i+1)+': اختار التشغيلة');const q=ex?n(l.cartons):n(l.kg);if(!(q>0))e.push('سطر '+(i+1)+': الكمية');if(!(n(l.price)>0))e.push('سطر '+(i+1)+': السعر');
      const r=C.R[l.runId];if(r)use[l.runId]=(use[l.runId]||0)+(ex?q*r.cartonKg:q)});
    const old={};const o2=d.id&&get('sales',d.id);if(o2&&(o2.kind!=='farz')===ex)(C.SL[o2.id].lines).forEach(l=>old[l.runId]=(old[l.runId]||0)+l.kg);
    Object.keys(use).forEach(id=>{const r=C.R[id];const av=(ex?r.stockFin:r.stockFarz)+(old[id]||0);if(use[id]>av+1e-6)e.push('تشغيلة #'+r.no+': المتاح '+f0(av)+' كجم بس')});
    (d.expenses||[]).forEach((l,i)=>{if(!(n(l.amount)>0))e.push('مصروف '+(i+1)+': المبلغ')});return e},
  onChange:(d,p)=>{if(p==='kind'){d.customerId='';d.lines=[{runId:'',cartons:'',kg:'',price:''}];d.cur=d.kind==='farz'?'EGP':'USD';if(d.kind!=='farz')d.customerId=(parties(['export'])[0]||{}).id||''}}}};
FORMS.party=function(rec,o){o=o||{};rec=rec||{type:o.type||'raw',name:'',openSide:'d'};
  return{title:rec.id?rec.name:'حساب جديد',coll:'parties',rec,del:true,
  body:d=>fs('النوع','type',Object.keys(E.PTYPES).map(k=>[k,E.PTYPES[k]]),{full:1,ph:''})+fi('الاسم','name',{txt:1,full:1})+fi('الاسم بالإنجليزي','nameEn',{txt:1})+fi('التليفون','phone',{txt:1})+(d.type==='raw'?fi('خصم الميزان الافتراضي','disc',{u:'%',hint:'بيتحط تلقائي في فواتير المورد ده'}):'')+
    fi('العنوان','address',{txt:1})+fi('سجل تجاري','cr',{txt:1})+fi('بطاقة ضريبية','tax',{txt:1})+sec('رصيد أول المدة (لو فيه)')+fi('المبلغ','open',{u:'ج'})+fseg('الرصيد','openSide',[['d','عليه (مستحق لنا)'],['c','له (مستحق علينا)']])+fi('ملاحظات','notes',{txt:1,full:1}),
  validate:d=>{const e=[];if(!String(d.name||'').trim())e.push('اكتب الاسم');if(d.type==='raw'&&(n(d.disc)<0||n(d.disc)>=100))e.push('الخصم من 0 لأقل من 100%');return e},
  canDel:d=>(C.L[d.id]||[]).some(e=>e.kind!=='open')?'الحساب عليه حركات، مينفعش يتمسح':'',after:rec=>{if(F&&F.ret)return;}}};
FORMS.factory=function(rec){rec=rec||{name:''};return{title:rec.id?rec.name:'مصنع / مخزن جديد',coll:'factories',rec,del:true,
  body:d=>fi('الاسم','name',{txt:1,full:1})+fi('العنوان / ملاحظات','notes',{txt:1,full:1}),validate:d=>String(d.name||'').trim()?[]:['اكتب الاسم'],
  canDel:d=>[D.purchases.some(x=>x.factoryId===d.id),D.runs.some(x=>x.factoryId===d.id||(x.supplies||[]).some(l=>l.locId===d.id)),D.supplyIn.some(x=>x.locId===d.id),D.transfers.some(x=>x.fromId===d.id||x.toId===d.id)].some(Boolean)?'المكان مستخدم في حركات':''}};
FORMS.variety=function(rec){rec=rec||{name:'',est:(()=>{const e=E.fcDefaults('');delete e.name;return e})(),estNeeds:true};return{title:rec.id?rec.name:'صنف جديد',coll:'varieties',rec,del:true,
  body:d=>fi('اسم الصنف','name',{txt:1,full:1})+(d.estNeeds?'<div class="notice full">أرقام التقدير دي منسوخة من الفراولة كبداية — عدّلها بأرقام الصنف. <label class="chk"><input type="checkbox" data-bool="estOk"> الأرقام اتحدثت</label></div>':'')+estFields('est'),
  summary:d=>sumBox([estSum(d.est)]),validate:d=>String(d.name||'').trim()?[]:['اكتب الاسم'],prep:d=>{if(d.estOk){d.estNeeds=false}delete d.estOk;return d},
  canDel:d=>D.purchases.some(x=>x.varietyId===d.id)||D.runs.some(x=>x.varietyId===d.id)?'الصنف مستخدم':''}};
FORMS.item=function(rec){rec=rec||{name:'',unit:'وحدة',refPrice:''};return{title:rec.id?rec.name:'صنف مستلزمات جديد',coll:'items',rec,del:true,
  body:d=>fi('الاسم','name',{txt:1,full:1})+fi('الوحدة','unit',{txt:1})+fi('سعر مرجعي','refPrice',{u:'ج',hint:'بيستخدم بس لو اتصرف قبل أي فاتورة شراء'}),validate:d=>String(d.name||'').trim()?[]:['اكتب الاسم'],
  canDel:d=>D.supplyIn.some(x=>(x.lines||[]).some(l=>l.itemId===d.id))||D.runs.some(x=>(x.supplies||[]).some(l=>l.itemId===d.id))||D.transfers.some(x=>(x.lines||[]).some(l=>l.itemId===d.id))?'الصنف عليه حركات':''}};
const KMAP={purchase:'purchases',transport:'transports',payment:'payments',supplyIn:'supplyIn',transfer:'transfers',run:'runs',sale:'sales',party:'parties',factory:'factories',variety:'varieties',item:'items'};
function openK(k,id,o){const rec=id?JSON.parse(JSON.stringify(get(KMAP[k],id))):null;openForm(FORMS[k](rec,o))}
const NUMBERED=['purchases','transports','payments','supplyIn','transfers','runs','sales'];
function commonErrs(d){const e=[];if(NUMBERED.indexOf(F.coll)>=0){const no=String(d.no==null?'':d.no).trim();if(!no)e.push('اكتب الرقم');else if(D[F.coll].some(x=>x.id!==d.id&&String(x.no==null?'':x.no).trim()===no))e.push('الرقم '+no+' متسجل قبل كده — كل رقم لازم يبقى مرة واحدة (الرقم المقترح '+nextNo(F.coll)+')')}
  const neg=[];(function walk(o,pth){if(Array.isArray(o))o.forEach((v,i)=>walk(v,pth+'.'+i));else if(o&&typeof o==='object')Object.keys(o).forEach(k=>{if(k==='est')return;walk(o[k],pth?pth+'.'+k:k)});else{const k=pth.split('.').pop();if(NUMK.indexOf(k)>=0&&String(o==null?'':o).trim()!==''){const v=E.parse(o);if(!isFinite(v))neg.push('رقم مكتوب غلط: «'+o+'»');else if(v<0)neg.push('مينفعش رقم بالسالب: «'+o+'»')}}})(d,'');
  return e.concat([...new Set(neg)])}
async function saveForm(){let d=JSON.parse(JSON.stringify(F.d));const errs=commonErrs(d).concat(F.validate?F.validate(d):[]);
  if(errs.length){$('#ferr').innerHTML='<div class="err"><b>مينفعش يتحفظ لحد ما تصلح:</b><ul>'+errs.map(e=>'<li>'+esc(e)+'</li>').join('')+'</ul></div>';$('#ferr').scrollIntoView({block:'center'});return}
  if(F.confirm){const m=F.confirm(d);if(m&&!await ask(m,{ok:'احفظ برضه',cancel:'رجوع'}))return}
  if(F.prep)d=F.prep(d);delete d.mode;const after=F.after,coll=F.coll;const rec=await upsert(coll,d,true);closeForm();render();toast('اتحفظ');if(after)after(rec)}
async function delForm(){const why=F.canDel?F.canDel(F.d):'';if(why){await say(why);return}if(!await ask('تمسح «'+F.title+'»؟ هيتنقل للأرشيف (المزيد ← الأرشيف) وتقدر ترجّعه.'))return;const c=F.coll,id=F.d.id;closeForm();await remove(c,id);toast('اتمسح')}
/* ===== نوافذ داخل البرنامج (من غير prompt/confirm/alert — آيفون بيمنعهم أحياناً) ===== */
function dlg(o){if(typeof window.__dlgAuto==='function'){const r=window.__dlgAuto(o);if(r!==undefined)return Promise.resolve(r)}
  return new Promise(res=>{let w=document.getElementById('dlg');if(!w){w=document.createElement('div');w.id='dlg';document.body.appendChild(w)}
    const fl=o.fields||[],no=()=>o.kind==='confirm'?false:null;
    w.innerHTML='<div class="dlgb" role="dialog" aria-modal="true" data-kind="'+esc(o.kind||'')+'">'+(o.title?'<h3>'+esc(o.title)+'</h3>':'')+(o.msg?'<div class="dlgm">'+esc(o.msg).replace(/\n/g,'<br>')+'</div>':'')+
      fl.map(f=>'<label class="dlgf">'+(f.label?'<span>'+esc(f.label)+'</span>':'')+(f.opts?'<select data-dk="'+f.k+'">'+f.opts.map(x=>'<option value="'+esc(x[0])+'"'+(String(x[0])===String(f.val==null?'':f.val)?' selected':'')+'>'+esc(x[1])+'</option>').join('')+'</select>':
        '<input data-dk="'+f.k+'"'+(f.num?' inputmode="'+(f.int?'numeric':'decimal')+'" dir="ltr"':'')+(f.ro?' readonly':'')+(f.ph?' placeholder="'+esc(f.ph)+'"':'')+' value="'+esc(f.val==null?'':f.val)+'" autocomplete="off">')+(f.hint?'<small>'+esc(f.hint)+'</small>':'')+'</label>').join('')+
      '<div class="dlgerr"></div><div class="dlga">'+(o.cancel===false?'':'<button type="button" class="btn ghost" data-dlg="no">'+esc(o.cancel||'إلغاء')+'</button>')+'<button type="button" class="btn pri" data-dlg="ok">'+esc(o.ok||'تمام')+'</button></div></div>';
    w.hidden=false;document.body.classList.add('dlgon');
    const vals=()=>{const v={};w.querySelectorAll('[data-dk]').forEach(e=>v[e.dataset.dk]=e.value);return v};
    const done=r=>{w.hidden=true;w.innerHTML='';w.onclick=null;w.onkeydown=null;document.body.classList.remove('dlgon');res(r)};
    w.onclick=e=>{e.stopPropagation();const b=e.target.closest('[data-dlg]');if(!b){if(e.target===w&&o.cancel!==false)done(no());return}
      if(b.dataset.dlg==='no')return done(no());if(!fl.length)return done(true);const v=vals();const er=o.check?o.check(v):'';if(er){w.querySelector('.dlgerr').textContent=er;return}done(v)};
    w.onkeydown=e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();w.querySelector('[data-dlg="ok"]').click()}else if(e.key==='Escape'&&o.cancel!==false)done(no())};
    const f=w.querySelector('input:not([readonly]),select');if(f&&o.focus!==false)setTimeout(()=>{try{f.focus();if(f.select)f.select()}catch(x){}},30)})}
function ask(msg,o){return dlg(Object.assign({kind:'confirm',title:'تأكيد',msg,ok:'أيوه',cancel:'لأ'},o||{}))}
function say(msg){return dlg({kind:'alert',title:'تنبيه',msg,cancel:false,ok:'تمام'})}
function askText(title,def,o){o=o||{};return dlg(Object.assign({kind:'prompt',title,fields:[{k:'v',label:o.label||'',val:def,num:o.num,ro:o.ro,hint:o.hint}]},o)).then(r=>r==null||r===false?null:(typeof r==='string'?r:r.v))}
window.say=say;window.ask=ask;
const QN={factory:['factories','مصنع / مخزن جديد'],variety:['varieties','صنف جديد'],item:['items','صنف مستلزمات جديد']};
async function quickNew(type,sel){const path=sel.dataset.p;sel.value=getP(F.d,path)||'';const q=QN[type];const isP=!q;
  const coll=isP?'parties':q[0],title=isP?(E.PTYPES[type]||'حساب')+' جديد':q[1];
  const fields=[{k:'name',label:'الاسم'}].concat(isP?[{k:'phone',label:'التليفون (اختياري)',num:1}]:type==='item'?[{k:'unit',label:'الوحدة',val:'وحدة'},{k:'refPrice',label:'سعر مرجعي (اختياري)',num:1}]:[]);
  const v=await dlg({kind:'new',type,title,fields,ok:'حفظ واختيار',check:x=>{if(!String(x.name||'').trim())return 'اكتب الاسم';if(x.refPrice&&!(E.parse(x.refPrice)>=0))return 'السعر مكتوب غلط';return ''}});
  if(!v||!F)return;const nm=String(v.name).trim();
  const ex=D[coll].find(x=>String(x.name||'').trim()===nm&&(!isP||x.type===type));
  let id;if(ex){id=ex.id;toast('«'+nm+'» موجود قبل كده — اتختار')}else{let rec;
    if(isP)rec={type,name:nm,phone:String(v.phone||'').trim(),openSide:'d'};
    else if(type==='variety'){const e=E.fcDefaults('');delete e.name;rec={name:nm,est:e,estNeeds:true}}
    else if(type==='item')rec={name:nm,unit:String(v.unit||'').trim()||'وحدة',refPrice:v.refPrice||''};else rec={name:nm,notes:''};
    id=(await upsert(coll,rec,true)).id;toast('اتضاف «'+nm+'» واتختار')}
  if(!F)return;setP(F.d,path,id);if(F.onChange)F.onChange(F.d,path);drawForm()}

/* ===== النسخة الاحتياطية ===== */
async function doBackup(){const s=S();const at=new Date().toISOString();const data={};E.COLLS.forEach(c=>data[c]=D[c]);
  const out={app:'alrashed-strawberry-erp',version:VER,exportedAt:at,data:JSON.parse(JSON.stringify(data))};out.data.settings[0].lastBackup=at;out.data.settings[0].changedSince=false;
  const blob=new Blob([JSON.stringify(out,null,1)],{type:'application/json'}),nm='alrashed-erp-backup-'+E.dmy(E.cairoIso()).replace(/\//g,'-')+'.json';
  const file=(()=>{try{return new File([blob],nm,{type:'application/json'})}catch(e){return null}})();
  s.lastBackup=at;s.changedSince=false;await upsert('settings',s,true);render();window.__lastBackup={name:nm,size:blob.size};
  if(file&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:nm});return}catch(e){if(e&&e.name==='AbortError')return}}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=nm;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);toast('النسخة اتحفظت: '+nm)}
async function doRestore(file){let j;try{j=JSON.parse(await file.text())}catch(e){await say('الملف مش نسخة صالحة');return}
  if(!j||j.app!=='alrashed-strawberry-erp'||!j.data||!Array.isArray(j.data.settings)){await say('الملف ده مش نسخة من البرنامج ده');return}
  if(!await ask('البيانات الحالية هتتحط مكانها نسخة '+E.dmy(E.cairoIso(new Date(j.exportedAt)))+' (الحالي بيتأرشف ومش بيتمسح نهائي). تكمل؟'))return;
  const t=new Date().toISOString(),keep={};E.COLLS.forEach(c=>(Array.isArray(j.data[c])?j.data[c]:[]).forEach(v=>keep[c+':'+v.id]=1));
  for(const c of E.COLLS)for(const v of D[c].slice())if(!keep[c+':'+v.id])await Store.del(c,v);
  const list=[];E.COLLS.forEach(c=>(Array.isArray(j.data[c])?j.data[c]:[]).forEach(v=>list.push([c,Object.assign({},v,{updatedAt:t})])));
  if(!list.some(x=>x[0]==='settings'))list.push(['settings',Object.assign(E.seed().settings[0],{updatedAt:t})]);
  await Store.putMany(list);await reloadFromStore();if(window.SYNC)SYNC.kick(200);toast('اتسترجعت النسخة')}
async function reloadFromStore(){ARC=null;D=await Store.loadAll(E.COLLS);if(!D.settings.length){const sd=E.seed();D.settings=sd.settings}recompute();if(F){F.staleRender=true;return}render()}

/* ===== الأحداث ===== */
document.addEventListener('click',async e=>{const t=e.target.closest('[data-go],[data-act],[data-fset],[data-ladd],[data-ldel]');if(!t)return;
  if(t.dataset.go){location.hash=t.dataset.go;return}
  if(t.dataset.fset){setP(F.d,t.dataset.fset,t.dataset.v);if(F.onChange)F.onChange(F.d,t.dataset.fset);drawForm();return}
  if(t.dataset.ladd){const a=getP(F.d,t.dataset.ladd)||[];a.push(JSON.parse(t.dataset.tpl));setP(F.d,t.dataset.ladd,a);drawForm();return}
  if(t.dataset.ldel){const p=t.dataset.ldel.split('.'),i=+p.pop(),a=getP(F.d,p.join('.'));a.splice(i,1);drawForm();return}
  const a=t.dataset.act;
  if(a==='ui'){UI[t.dataset.k]=t.dataset.v;render()}
  else if(a==='new')openK(t.dataset.k,null,{dir:t.dataset.dir,party:t.dataset.party,type:t.dataset.type,kind:t.dataset.kind});
  else if(a==='edit')openK(t.dataset.k,t.dataset.id);
  else if(a==='fclose')closeForm();else if(a==='fsave')saveForm();else if(a==='fdel')delForm();
  else if(a==='toggleEst'){F.openEst=!F.openEst}
  else if(a==='estReset'){const v=get('varieties',F.d.varietyId);if(v){F.d.est=JSON.parse(JSON.stringify(v.est));F.openEst=true;drawForm()}}
  else if(a==='farzTemp'){const r=get('runs',t.dataset.id);if(!r)return;const v=await askText('سعر الفرزة المؤقت',r.farzTemp==null?'':r.farzTemp,{label:'للكيلو (ج) — للكمية اللي لسه ما اتباعتش. سيبه فاضي عشان تشيله',num:1,ok:'حفظ',check:x=>{const q=String(x.v==null?'':x.v).trim();return q!==''&&!(E.parse(q)>=0)?'الرقم مش مظبوط':''}});if(v===null)return;const p=E.parse(v);const nr=JSON.parse(JSON.stringify(r));nr.farzTemp=v.trim()===''?'':p;await upsert('runs',nr);toast(v.trim()===''?'اتشال السعر المؤقت':'اتحفظ السعر المؤقت')}
  else if(a==='syncNow'){SYNC.run()}
  else if(a==='syncLink'){const l=SYNC.link();if(!l)return;try{if(navigator.share){await navigator.share({title:'ربط جهاز — تكاليف الفراولة',text:l});return}}catch(x){if(x&&x.name==='AbortError')return}try{await navigator.clipboard.writeText(l);toast('الرابط اتنسخ')}catch(x){askText('انسخ الرابط ده',l,{ro:1,cancel:false,ok:'تمام'})}}
  else if(a==='syncJoin'){const v=$('#joinCode').value;const ok=await SYNC.join(v);if(ok){toast('الجهاز اتربط');render()}else render()}
  else if(a==='syncUnlink'){if(await ask('تفصل الجهاز ده عن السحابة؟ البيانات هتفضل على الجهاز بس مش هتتزامن.')){await SYNC.unlink();render()}}
  else if(a==='unarc')unArchive(t.dataset.id);
  else if(a==='backup')doBackup();else if(a==='restore')$('#restoreFile').click();
  else if(a==='fltclear'){delete UI.flt[t.dataset.id];render()}
  else if(a==='openref'){const k={purchase:'purchase',transport:'transport',supplyIn:'supplyIn',payment:'payment',sale:'sale',saleExp:'sale'}[t.dataset.kind];if(k&&t.dataset.id)openK(k,t.dataset.id);else if(t.dataset.kind==='runCost')location.hash='#/run/'+t.dataset.id}
  else if(a==='report'){let id=t.dataset.id;if(t.dataset.from)id=$('#'+t.dataset.from).value;const fl=UI.flt.rep||{};
    if(t.dataset.k==='stmt'){const pf=UI.flt[id]||{};RPT.open('stmt',{id,from:pf.from||fl.from,to:pf.to||fl.to})}else RPT.open(t.dataset.k,{id,from:fl.from,to:fl.to})}
});
document.addEventListener('input',e=>{const el=e.target;
  if(el.dataset.flt){const [k,f]=el.dataset.flt.split('.');const v=E.parseDmy(el.value);UI.flt[k]=UI.flt[k]||{};if(v||el.value.trim()===''){UI.flt[k][f]=v||'';if(!el.closest('#sheet')){const pos=el.selectionStart,sel='[data-flt="'+el.dataset.flt+'"]';render();const ne=$(sel);if(ne){ne.focus();try{ne.setSelectionRange(pos,pos)}catch(x){}}}}return}
  if(el.dataset.sset){const v=E.parse(el.value);if(isFinite(v)&&v>0){S()[el.dataset.sset]=v;upsert('settings',S(),true)}return}
  if(!F||!el.dataset.p||el.tagName==='SELECT')return;
  if(el.dataset.date){const v=E.parseDmy(el.value);setP(F.d,el.dataset.p,v||('!'+el.value))}else setP(F.d,el.dataset.p,el.value);
  if(F.onChange)F.onChange(F.d,el.dataset.p);if(el.dataset.rr)drawForm();else liveSum()});
document.addEventListener('change',async e=>{const el=e.target;
  if(el.id==='restoreFile'&&el.files[0]){await doRestore(el.files[0]);el.value='';return}
  if(el.dataset.set){S()[el.dataset.set]=el.value;await upsert('settings',S());toast('اتغيرت طريقة الفرزة');return}
  if(!F)return;
  if(el.tagName==='SELECT'&&el.dataset.p){if(el.value==='__new'){quickNew(el.dataset.new,el);return}setP(F.d,el.dataset.p,el.value);if(F.onChange)F.onChange(F.d,el.dataset.p);drawForm();return}
  if(el.dataset.chk){const a=getP(F.d,el.dataset.chk)||[];const i=a.indexOf(el.value);if(el.checked&&i<0)a.push(el.value);if(!el.checked&&i>=0)a.splice(i,1);setP(F.d,el.dataset.chk,a);liveSum();return}
  if(el.dataset.bool){setP(F.d,el.dataset.bool,el.checked);drawForm()}});
document.addEventListener('toggle',e=>{if(F&&e.target.classList&&e.target.classList.contains('est'))F.openEst=e.target.open},true);
window.addEventListener('hashchange',()=>{window.scrollTo(0,0);if(route().v==='archive')ARC=null;render()});

/* ===== البداية ===== */
async function start(){await Store.init();let d=await Store.loadAll(E.COLLS);
  if(!d.settings.length){d=E.seed();const list=[];E.COLLS.forEach(c=>d[c].forEach(v=>list.push([c,v])));await Store.putMany(list,{noOut:true})}
  D=d;recompute();render();document.body.classList.add('ready');window.__ready=true;
  if(window.SYNC&&!start.done){start.done=1;SYNC.on(()=>{syncPill();if(route().v==='cloud'&&!F&&!(document.activeElement&&document.activeElement.id==='joinCode'))render()});await SYNC.init(window.APP)}}
window.APP={get F(){return F},editNotes,refRec,stmtNotes,reloadFromStore,get D(){return D},get C(){return C},S,get,name,statement,partyLabel,runLabel,balTxt,VER,esc,f0,f2,f1,f3,N,reload:start,upsert};
start();
})();
