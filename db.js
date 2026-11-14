/* طبقة التخزين — IndexedDB على الجهاز (أوفلاين أولًا).
   rec  = السجلات الحالية · out = تعديلات مستنية ترفع للسحابة · tomb = المحذوف (بالبيانات كاملة، مفيش مسح نهائي) · meta = إعدادات الجهاز */
(function(g){
'use strict';
const NAME='alrashed-erp',VER=2;let db=null,mem=null;
const STORES=['rec','tomb','out','meta'];
function req(r){return new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function tx(mode){const t=db.transaction(STORES,mode);const o={t,done:new Promise((res,rej)=>{t.oncomplete=res;t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})};STORES.forEach(s=>o[s]=t.objectStore(s));return o}
const ts=x=>{const v=Date.parse(x||'');return isFinite(v)?v:0};
const clone=v=>JSON.parse(JSON.stringify(v));
function memStore(){return{rec:{},tomb:{},out:{},meta:{}}}
const Store={
  ok:true,
  async init(){if(!g.indexedDB){this.ok=false;mem=memStore();return}
    try{db=await new Promise((res,rej)=>{const q=indexedDB.open(NAME,VER);q.onupgradeneeded=()=>{const d=q.result;STORES.forEach(s=>{if(!d.objectStoreNames.contains(s))d.createObjectStore(s,{keyPath:'k'})})};q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);q.onblocked=()=>rej(new Error('blocked'))})}
    catch(e){this.ok=false;mem=memStore()}
    try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}},
  async all(store){if(!db)return Object.values(mem[store]);const x=tx('readonly');return req(x[store].getAll())},
  async loadAll(colls){const D={};colls.forEach(c=>D[c]=[]);(await this.all('rec')).forEach(r=>{if(D[r.c])D[r.c].push(r.v)});return D},
  /* list = [[coll, record], ...] — opt.noOut: من غير رفع (بذور أو بيانات جاية من السحابة) */
  async putMany(list,opt){opt=opt||{};const rows=list.map(([c,v])=>({k:c+':'+v.id,c,v:clone(v)}));
    if(!db){rows.forEach(r=>{mem.rec[r.k]=r;if(!opt.noOut)mem.out[r.k]={k:r.k,c:r.c,v:r.v,deleted:false}});return}
    const x=tx('readwrite');rows.forEach(r=>{x.rec.put(r);if(!opt.noOut)x.out.put({k:r.k,c:r.c,v:r.v,deleted:false})});return x.done},
  async put(c,v,opt){return this.putMany([[c,v]],opt)},
  /* حذف = نقل للأرشيف بالبيانات كاملة + تسجيل الحذف للسحابة (مفيش مسح نهائي) */
  async del(c,v){const k=c+':'+v.id,dv=Object.assign(clone(v),{updatedAt:new Date().toISOString(),deletedAt:new Date().toISOString()});
    if(!db){delete mem.rec[k];mem.tomb[k]={k,c,v:dv};mem.out[k]={k,c,v:dv,deleted:true};return}
    const x=tx('readwrite');x.rec.delete(k);x.tomb.put({k,c,v:dv});x.out.put({k,c,v:dv,deleted:true});return x.done},
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
    if(!db){rows.forEach(r=>{const k=r.coll+':'+r.id,a=apply(mem.rec[k],mem.out[k],r);if(!a)return;if(a.del){if(mem.rec[k]){delete mem.rec[k];changed++}mem.tomb[k]={k,c:a.c,v:a.v}}else{mem.rec[k]={k,c:a.c,v:a.v};changed++}if(a.dropOut)delete mem.out[k]});return changed}
    const x=tx('readwrite');
    for(const r of rows){const k=r.coll+':'+r.id;const cur=await req(x.rec.get(k)),pend=await req(x.out.get(k));const a=apply(cur,pend,r);if(!a)continue;
      if(a.del){if(cur){x.rec.delete(k);changed++}x.tomb.put({k,c:a.c,v:a.v})}else{x.rec.put({k,c:a.c,v:a.v});changed++}if(a.dropOut)x.out.delete(k)}
    await x.done;return changed},
  async meta(k,v){if(arguments.length<2){if(!db)return (mem.meta[k]||{}).v;const x=tx('readonly');const r=await req(x.meta.get(k));return r?r.v:undefined}
    if(!db){mem.meta[k]={k,v};return}const x=tx('readwrite');x.meta.put({k,v});return x.done},
  async tombs(){return this.all('tomb')},
  /* ترجيع من الأرشيف: يتشال من الأرشيف بس (التسجيل نفسه بيرجع بـ putMany بتاريخ تعديل أحدث، فبيكسب الحذف على السحابة) */
  async untomb(k){if(!db){delete mem.tomb[k];return}const x=tx('readwrite');x.tomb.delete(k);return x.done}
};
g.Store=Store;
})(window);
