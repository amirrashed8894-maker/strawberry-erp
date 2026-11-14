/* طبقة التخزين — IndexedDB على الجهاز. الطبقة دي بس اللي بتلمس التخزين؛ لو اتضاف مزامنة سحابية (Supabase) بعدين
   تتضاف هنا: كل سجل له id ثابت و createdAt/updatedAt، والمحذوف بيتسجل في tomb (id + وقت الحذف) عشان المزامنة تعرف تمسحه. */
(function(g){
'use strict';
const NAME='alrashed-erp',VER=1;let db=null,mem=null;
function req(r){return new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function tx(mode){const t=db.transaction(['rec','tomb'],mode);return{t,rec:t.objectStore('rec'),tomb:t.objectStore('tomb'),done:new Promise((res,rej)=>{t.oncomplete=res;t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})}}
const Store={
  ok:true,
  async init(){if(!g.indexedDB){this.ok=false;mem={};return}
    try{db=await new Promise((res,rej)=>{const q=indexedDB.open(NAME,VER);q.onupgradeneeded=()=>{const d=q.result;if(!d.objectStoreNames.contains('rec'))d.createObjectStore('rec',{keyPath:'k'});if(!d.objectStoreNames.contains('tomb'))d.createObjectStore('tomb',{keyPath:'k'})};q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);q.onblocked=()=>rej(new Error('blocked'))})}
    catch(e){this.ok=false;mem={}}
    try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}},
  async loadAll(colls){const D={};colls.forEach(c=>D[c]=[]);
    if(!db){Object.values(mem).forEach(r=>{if(D[r.c])D[r.c].push(r.v)});return D}
    const x=tx('readonly');const all=await req(x.rec.getAll());all.forEach(r=>{if(D[r.c])D[r.c].push(r.v)});return D},
  async put(c,v){const r={k:c+':'+v.id,c,v:JSON.parse(JSON.stringify(v))};if(!db){mem[r.k]=r;return}const x=tx('readwrite');x.rec.put(r);return x.done},
  async putMany(list){if(!db){list.forEach(([c,v])=>mem[c+':'+v.id]={k:c+':'+v.id,c,v});return}const x=tx('readwrite');list.forEach(([c,v])=>x.rec.put({k:c+':'+v.id,c,v:JSON.parse(JSON.stringify(v))}));return x.done},
  async del(c,id){const k=c+':'+id;if(!db){delete mem[k];return}const x=tx('readwrite');x.rec.delete(k);x.tomb.put({k,c,id,at:new Date().toISOString()});return x.done},
  async replaceAll(D){if(!db){mem={};Object.keys(D).forEach(c=>(D[c]||[]).forEach(v=>mem[c+':'+v.id]={k:c+':'+v.id,c,v}));return}
    const x=tx('readwrite');x.rec.clear();x.tomb.clear();Object.keys(D).forEach(c=>(D[c]||[]).forEach(v=>x.rec.put({k:c+':'+v.id,c,v})));return x.done}
};
g.Store=Store;
})(window);
