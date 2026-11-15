/* طبقة التخزين — IndexedDB على الجهاز (أوفلاين أولًا).
   rec  = السجلات الحالية · out = تعديلات مستنية ترفع للسحابة · tomb = المحذوف (بالبيانات كاملة، مفيش مسح نهائي) · meta = إعدادات الجهاز
   hist = سجل التعديلات (v1.2.8): أي نسخة بتتغير أو تتمسح بتتحفظ هنا كاملة (الوقت + الجهاز) · hout = نسخ السجل المستنية رفع للسحابة
   مفيش أي مسح نهائي لبيانات المستخدم في الملف ده: rec.delete بس في الحذف (بعد ما النسخة تتحفظ في tomb وhist)، وhout/out بيتمسح منهم بعد الرفع بس */
(function(g){
'use strict';
const NAME='alrashed-erp',VER=3;let db=null,mem=null;
const STORES=['rec','tomb','out','meta','hist','hout'];
function req(r){return new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function tx(mode){const t=db.transaction(STORES,mode);const o={t,done:new Promise((res,rej)=>{t.oncomplete=res;t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})};STORES.forEach(s=>o[s]=t.objectStore(s));return o}
const ts=x=>{const v=Date.parse(x||'');return isFinite(v)?v:0};
const clone=v=>JSON.parse(JSON.stringify(v));
function memStore(){return{rec:{},tomb:{},out:{},meta:{},hist:{},hout:{}}}
/* بصمة قصيرة لمحتوى النسخة (عشان مفتاح السجل يبقى ثابت لنفس النسخة على كل الأجهزة) */
function fnv(t){let h=0x811c9dc5;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return h.toString(36)}
/* المقارنة من غير الحقول اللي بتتغير لوحدها (وقت التعديل، وعلامات النسخة الاحتياطية في الإعدادات) */
function core(c,v){const x=clone(v||{});delete x.updatedAt;if(c==='settings'){delete x.changedSince;delete x.lastBackup}return JSON.stringify(x)}
function histEntry(c,v,act,del){const id=v.id,ver=v.updatedAt||'';const k=c+':'+id+'|'+ver+'|'+(del?'d':'')+'|'+fnv(JSON.stringify(v));
  return{k,c,id,v:clone(v),del:!!del,act,at:new Date().toISOString(),dev:Store.dev||''}}
const Store={
  ok:true,
  async init(){if(!g.indexedDB){this.ok=false;this.err='no-idb';mem=memStore();return}
    /* v1.2.9: لو القاعدة على الجهاز أحدث من الكود (ملفات قديمة من الكاش) بنفتحها بنسختها الحالية بدل ما نشتغل من غير تخزين؛ ولو فشلت بنحاول تاني قبل أي حاجة */
    const openAt=v=>new Promise((res,rej)=>{const q=v?indexedDB.open(NAME,v):indexedDB.open(NAME);q.onupgradeneeded=()=>{const d=q.result;STORES.forEach(s=>{if(!d.objectStoreNames.contains(s))d.createObjectStore(s,{keyPath:'k'})})};q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);
      /* v1.2.8: لو نافذة قديمة للبرنامج ماسكة القاعدة، نستنى (مش نشتغل من غير تخزين) ونطلب قفلها */
      q.onblocked=()=>{setTimeout(()=>{if(db)return;const d=document.createElement('div');d.className='notice';d.style.cssText='position:fixed;top:10px;left:10px;right:10px;z-index:99';d.textContent='في نافذة تانية مفتوحة للبرنامج بنسخة قديمة — اقفلها عشان البرنامج يكمل.';document.body.appendChild(d);q.addEventListener('success',()=>d.remove())},1500)}});
    for(let i=0;i<3&&!db;i++){try{db=await openAt(VER)}catch(e){this.err=String(e&&e.name||e);
        if(e&&e.name==='VersionError'){try{db=await openAt(0)}catch(e2){this.err=String(e2&&e2.name||e2)}}
        if(!db)await new Promise(r=>setTimeout(r,700))}}
    if(db){this.err='';db.onversionchange=()=>{try{db.close()}catch(e){}location.reload()};
      /* القاعدة اتفتحت بنسخة أحدث من غير المخازن الجديدة؟ (مستحيل عمليًا) — نشتغل بالمخازن الموجودة بس */
      const miss=STORES.filter(x=>!db.objectStoreNames.contains(x));if(miss.length){this.err='missing:'+miss.join(',');try{db.close()}catch(e){}db=null}}
    if(!db){this.ok=false;mem=memStore()}
    try{let d=await this.meta('deviceId');if(!d){d=(navigator.userAgent.match(/iPhone|iPad|Android|Windows|Mac/)||['جهاز'])[0]+'-'+Math.random().toString(36).slice(2,8);await this.meta('deviceId',d)}this.dev=d}catch(e){}
    await this.persist()},
  /* v1.2.9: نطلب من المتصفح (وخصوصًا آيفون) ما يمسحش تخزين البرنامج لوحده */
  persisted:null,
  async persist(){try{if(!navigator.storage)return null;let p=navigator.storage.persisted?await navigator.storage.persisted():null;if(!p&&navigator.storage.persist)p=await navigator.storage.persist();this.persisted=p;return p}catch(e){return null}},
  /* v1.2.9: نسخة كاملة على الجهاز نفسه (في meta) قبل أي تحديث أو ترحيل أو أول سحب من السحابة — بتتحفظ آخر 30 نسخة */
  async snapshot(reason,ver){const recs=await this.all('rec');if(!recs.length)return null;const at=new Date().toISOString();const k='snap:'+at;
    const v={at,reason:reason||'',ver:ver||'',n:recs.length,rec:recs.map(r=>({c:r.c,v:r.v}))};await this.meta(k,v);
    try{const L=(await this.snaps()).map(x=>x.k);for(const old of L.slice(30)){if(!db)delete mem.meta[old];else{const x=tx('readwrite');x.meta.delete(old);await x.done}}}catch(e){}return k},
  async snaps(){const L=db?await (async()=>{const x=tx('readonly');return req(x.meta.getAll(IDBKeyRange.bound('snap:','snap:\uffff')))})():Object.values(mem.meta).filter(m=>String(m.k).indexOf('snap:')===0);
    return L.map(m=>({k:m.k,at:m.v.at,reason:m.v.reason,ver:m.v.ver,n:m.v.n,rec:m.v.rec})).sort((a,b)=>String(b.at).localeCompare(String(a.at)))},
  /* v1.2.9: إضافة سجل مش موجود بس (استرجاع/بذور) — عمره ما بيغطي سجل موجود */
  async addMissing(list,opt){opt=opt||{};let n=0;const add=[];for(const [c,v] of list){const k=c+':'+v.id;let cur;if(!db)cur=mem.rec[k];else{const x=tx('readonly');cur=await req(x.rec.get(k))}if(!cur){add.push([c,v]);n++}}
    if(add.length)await this.putMany(add,opt);return n},
  /* v1.2.9: فحص كل قواعد البيانات والمخازن على الجهاز ده عن أي تسجيلات (للاسترجاع) */
  async scan(colls){const out=[];const seen={};const take=(src,c,v,extra)=>{if(!v||!v.id||colls.indexOf(c)<0)return;out.push(Object.assign({src,c,v},extra||{}))};
    let names=[NAME];try{if(indexedDB.databases){const L=await indexedDB.databases();L.forEach(d=>{if(d&&d.name&&names.indexOf(d.name)<0)names.push(d.name)})}}catch(e){}
    for(const nm of names){let d2=null;try{d2=nm===NAME&&db?db:await new Promise((res,rej)=>{const q=indexedDB.open(nm);q.onupgradeneeded=()=>{try{q.transaction.abort()}catch(e){}};q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);q.onblocked=()=>rej(new Error('blocked'))})}catch(e){continue}
      for(const sn of Array.from(d2.objectStoreNames)){let rows=[];try{rows=await req(d2.transaction(sn,'readonly').objectStore(sn).getAll())}catch(e){continue}
        rows.forEach(r=>{if(!r||typeof r!=='object')return;
          if(r.c&&r.v&&r.v.id){take(nm+'/'+sn,r.c,r.v,{del:sn==='tomb'||!!r.deleted,at:r.at||''});return}
          if(r.k&&String(r.k).indexOf('snap:')===0&&r.v&&Array.isArray(r.v.rec)){r.v.rec.forEach(x=>take(nm+'/snap '+(r.v.at||''),x.c,x.v));return}
          if(r.v&&r.v.app==='alrashed-strawberry-erp'&&r.v.data)Object.keys(r.v.data).forEach(c=>(r.v.data[c]||[]).forEach(v=>take(nm+'/'+sn,c,v)))})}
      if(d2!==db)try{d2.close()}catch(e){}}
    try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);let j=null;try{j=JSON.parse(localStorage.getItem(k))}catch(e){}if(j&&j.data&&typeof j.data==='object')Object.keys(j.data).forEach(c=>(Array.isArray(j.data[c])?j.data[c]:[]).forEach(v=>take('localStorage/'+k,c,v)))}}catch(e){}
    return{names,rows:out}},
  async all(store){if(!db)return Object.values(mem[store]);const x=tx('readonly');return req(x[store].getAll())},
  async loadAll(colls){const D={};colls.forEach(c=>D[c]=[]);(await this.all('rec')).forEach(r=>{if(D[r.c])D[r.c].push(r.v)});return D},
  /* list = [[coll, record], ...] — opt.noOut: من غير رفع (بذور أو بيانات جاية من السحابة) */
  /* أي نسخة قديمة مختلفة بتتحفظ في hist قبل ما تتغطى */
  async putMany(list,opt){opt=opt||{};const rows=list.map(([c,v])=>({k:c+':'+v.id,c,v:clone(v)}));const act=opt.act||'edit';
    const keep=(cur,r)=>cur&&cur.v&&core(r.c,cur.v)!==core(r.c,r.v)?histEntry(r.c,cur.v,act,false):null;
    if(!db){rows.forEach(r=>{const h=keep(mem.rec[r.k],r);if(h){mem.hist[h.k]=h;mem.hout[h.k]={k:h.k}}mem.rec[r.k]=r;if(!opt.noOut)mem.out[r.k]={k:r.k,c:r.c,v:r.v,deleted:false}});return}
    const x=tx('readwrite');for(const r of rows){const h=keep(await req(x.rec.get(r.k)),r);if(h){x.hist.put(h);x.hout.put({k:h.k})}x.rec.put(r);if(!opt.noOut)x.out.put({k:r.k,c:r.c,v:r.v,deleted:false})}return x.done},
  async put(c,v,opt){return this.putMany([[c,v]],opt)},
  /* حذف = نقل للأرشيف بالبيانات كاملة + تسجيل الحذف للسحابة (مفيش مسح نهائي) */
  async del(c,v){const k=c+':'+v.id,dv=Object.assign(clone(v),{updatedAt:new Date().toISOString(),deletedAt:new Date().toISOString()});
    if(!db){const h=histEntry(c,(mem.rec[k]||{}).v||v,'delete',false);mem.hist[h.k]=h;mem.hout[h.k]={k:h.k};delete mem.rec[k];mem.tomb[k]={k,c,v:dv};mem.out[k]={k,c,v:dv,deleted:true};return}
    const x=tx('readwrite');const cur=await req(x.rec.get(k));const h=histEntry(c,(cur&&cur.v)||v,'delete',false);x.hist.put(h);x.hout.put({k:h.k});
    x.rec.delete(k);x.tomb.put({k,c,v:dv});x.out.put({k,c,v:dv,deleted:true});return x.done},
  async outCount(){if(!db)return Object.keys(mem.out).length;const x=tx('readonly');return req(x.out.count())},
  async outBatch(n){const a=await this.all('out');return a.slice(0,n)},
  /* يمسح من الطابور بس اللي ما اتعدلش بعد ما اترفع */
  async clearOut(list){if(!db){list.forEach(o=>{const cur=mem.out[o.k];if(cur&&cur.v.updatedAt===o.v.updatedAt)delete mem.out[o.k]});return}
    const x=tx('readwrite');for(const o of list){const cur=await req(x.out.get(o.k));if(cur&&cur.v.updatedAt===o.v.updatedAt)x.out.delete(o.k)}return x.done},
  async enqueueAll(filter){const recs=await this.all('rec');const L=recs.filter(r=>!filter||filter(r.c,r.v));if(!db){L.forEach(r=>mem.out[r.k]={k:r.k,c:r.c,v:r.v,deleted:false});return L.length}
    const x=tx('readwrite');L.forEach(r=>x.out.put({k:r.k,c:r.c,v:r.v,deleted:false}));await x.done;return L.length},
  /* بيانات جاية من السحابة: الأحدث يكسب، والتعديل المحلي اللي لسه ما اترفعش ما يتغطاش بنسخة أقدم */
  async applyRemote(rows){let changed=0;if(!rows.length)return 0;
    const apply=(cur,pend,r)=>{const k=r.coll+':'+r.id,rt=ts(r.updated_at);
      if(pend&&ts(pend.v.updatedAt)>=rt)return null;
      if(cur&&ts(cur.v.updatedAt)>=rt)return null;
      return{k,c:r.coll,v:r.data,del:!!r.deleted,dropOut:!!pend}};
    const keep=(cur,pend,a)=>{const loc=(pend&&pend.v)||(cur&&cur.v);if(!loc||core(a.c,loc)===core(a.c,a.v))return null;const h=histEntry(a.c,loc,'remote',!!(pend&&pend.deleted));h.unsent=!!pend;return h};
    if(!db){rows.forEach(r=>{const k=r.coll+':'+r.id,a=apply(mem.rec[k],mem.out[k],r);if(!a)return;const h=keep(mem.rec[k],mem.out[k],a);if(h){mem.hist[h.k]=h;mem.hout[h.k]={k:h.k}}if(a.del){if(mem.rec[k]){delete mem.rec[k];changed++}mem.tomb[k]={k,c:a.c,v:a.v}}else{mem.rec[k]={k,c:a.c,v:a.v};changed++}if(a.dropOut)delete mem.out[k]});return changed}
    const x=tx('readwrite');
    for(const r of rows){const k=r.coll+':'+r.id;const cur=await req(x.rec.get(k)),pend=await req(x.out.get(k));const a=apply(cur,pend,r);if(!a)continue;const h=keep(cur,pend,a);if(h){x.hist.put(h);x.hout.put({k:h.k})}
      if(a.del){if(cur){x.rec.delete(k);changed++}x.tomb.put({k,c:a.c,v:a.v})}else{x.rec.put({k,c:a.c,v:a.v});changed++}if(a.dropOut)x.out.delete(k)}
    await x.done;return changed},
  async meta(k,v){if(arguments.length<2){if(!db)return (mem.meta[k]||{}).v;const x=tx('readonly');const r=await req(x.meta.get(k));return r?r.v:undefined}
    if(!db){mem.meta[k]={k,v};return}const x=tx('readwrite');x.meta.put({k,v});return x.done},
  async tombs(){return this.all('tomb')},
  /* ترجيع من الأرشيف (v1.2.8): نسخة الأرشيف ما بتتمسحش خالص — الأرشيف بيعرض بس اللي مش موجود دلوقتي، والتسجيل بيرجع بـ putMany بتاريخ أحدث */
  async untomb(k){return},
  /* سجل التعديلات لتسجيل واحد (الأحدث الأول) */
  async history(c,id){const pre=c+':'+id+'|';let L;if(!db)L=Object.values(mem.hist).filter(h=>h.k.indexOf(pre)===0);
    else{const x=tx('readonly');L=await req(x.hist.getAll(IDBKeyRange.bound(pre,pre+'\uffff')))}
    return L.sort((a,b)=>String(b.at).localeCompare(String(a.at))||String(b.v.updatedAt||'').localeCompare(String(a.v.updatedAt||'')))},
  async histCount(){if(!db)return Object.keys(mem.hist).length;const x=tx('readonly');return req(x.hist.count())},
  async houtCount(){if(!db)return Object.keys(mem.hout).length;const x=tx('readonly');return req(x.hout.count())},
  async houtBatch(n){let ks;if(!db)ks=Object.keys(mem.hout).slice(0,n);else{const x=tx('readonly');ks=(await req(x.hout.getAll(null,n))).map(o=>o.k)}
    if(!db)return ks.map(k=>mem.hist[k]).filter(Boolean);const x=tx('readonly');const L=[];for(const k of ks){const h=await req(x.hist.get(k));L.push(h||{k,missing:true})}return L},
  /* بعد الرفع: يتشال من طابور الرفع بس — النسخة نفسها بتفضل في hist على الجهاز */
  async clearHout(keys){if(!db){keys.forEach(k=>delete mem.hout[k]);return}const x=tx('readwrite');keys.forEach(k=>x.hout.delete(k));return x.done}
};
g.Store=Store;
})(window);
