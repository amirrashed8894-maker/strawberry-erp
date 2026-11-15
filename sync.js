/* المزامنة مع السحابة (Supabase) — أوفلاين أولًا: كل تعديل بيتحفظ على الجهاز الأول، وبعدين بيترفع لما النت يبقى موجود.
   الحماية: رمز ربط سري للجهاز (بيتحفظ مرة واحدة من رابط الربط). من غيره مفيش أي قراءة أو كتابة. */
(function(g){
'use strict';
const CFG=g.ERP_CLOUD||{};
const st={enabled:false,syncing:false,online:navigator.onLine,pending:0,lastSync:null,error:'',name:'',lastBackup:null};
let app=null,key=null,device=null,timer=null,running=null,listeners=[];
function emit(){listeners.forEach(f=>{try{f(st)}catch(e){}})}
async function rpc(fn,body){const r=await fetch(CFG.url+'/rest/v1/rpc/'+fn,{method:'POST',headers:{'apikey':CFG.key,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const t=await r.text();let j=null;try{j=JSON.parse(t)}catch(e){}if(!r.ok){const err=new Error((j&&j.message)||t||('HTTP '+r.status));err.status=r.status;err.code=j&&j.code;throw err}return j}
function pristine(c,v){const S=g.ERP.seed();const s=(S[c]||[]).find(x=>x.id===v.id);if(!s)return false;const strip=o=>{const x=JSON.parse(JSON.stringify(o));delete x.createdAt;delete x.updatedAt;if(c==='settings'){delete x.lastBackup;delete x.changedSince}return JSON.stringify(x)};return strip(s)===strip(v)}
async function run(){if(running)return running;running=(async()=>{
  st.pending=await Store.outCount()+await Store.houtCount();st.online=navigator.onLine;
  if(!key){st.enabled=false;emit();return}st.enabled=true;
  if(!navigator.onLine){st.error='';emit();return}
  st.syncing=true;emit();
  try{
    if(!(await Store.meta('syncInit'))){await Store.enqueueAll((c,v)=>!pristine(c,v));await Store.meta('syncInit',new Date().toISOString())}
    for(let i=0;i<50;i++){const b=await Store.outBatch(200);if(!b.length)break;
      await rpc('serp_push',{p_key:key,p_device:device,p_rows:b.map(o=>({coll:o.c,id:o.v.id,data:o.v,updated_at:o.v.updatedAt,deleted:!!o.deleted}))});await Store.clearOut(b)}
    let since=+(await Store.meta('cursor'))||0,changed=0;
    for(let i=0;i<100;i++){const r=await rpc('serp_pull',{p_key:key,p_since:since,p_limit:1000});const rows=r.rows||[];if(!rows.length)break;
      changed+=await Store.applyRemote(rows);since=rows[rows.length-1].seq;await Store.meta('cursor',since);if(rows.length<1000)break}
    /* v1.2.8: سجل التعديلات بيترفع كمان — بعد السحب عشان النسخ اللي اتغطت بنسخ جهاز تاني تطلع في نفس المزامنة (السيرفر بيتجاهل النسخة لو موجودة قبل كده) */
    for(let i=0;i<50;i++){const h=await Store.houtBatch(200);if(!h.length)break;const L=h.filter(x=>!x.missing);
      if(L.length)await rpc('serp_push_hist',{p_key:key,p_device:device,p_rows:L.map(x=>({coll:x.c,id:x.id,data:x.v,ver_at:x.v.updatedAt||null,deleted:!!x.del,action:x.act,at:x.at,device:x.dev||device}))});
      await Store.clearHout(h.map(x=>x.k))}
    if(changed&&app)await app.reloadFromStore();
    st.lastSync=new Date().toISOString();await Store.meta('lastSync',st.lastSync);st.error='';
    if(!st.name||Math.random()<0.1){const c=await rpc('serp_check',{p_key:key});if(c&&c.ok){st.name=c.name;st.lastBackup=c.last_backup}}
  }catch(e){st.error=e.code==='28000'||/bad key/.test(e.message)?'رمز الربط غلط أو اتلغى':(/Failed to fetch|NetworkError|Load failed/i.test(e.message)?'مفيش اتصال بالسحابة دلوقتي':'خطأ في المزامنة: '+e.message)}
  st.syncing=false;st.pending=await Store.outCount()+await Store.houtCount();emit()})();
  try{await running}finally{running=null}}
function kick(ms){clearTimeout(timer);timer=setTimeout(run,ms==null?1500:ms)}
async function init(a){app=a;device=await Store.meta('deviceId');if(!device){device=(navigator.userAgent.match(/iPhone|iPad|Android|Windows|Mac/)||['جهاز'])[0]+'-'+Math.random().toString(36).slice(2,8);await Store.meta('deviceId',device)}
  key=await Store.meta('deviceKey')||null;st.lastSync=await Store.meta('lastSync')||null;
  const m=/[#&]join=([A-Za-z0-9_\-]{20,})/.exec(location.hash);if(m){history.replaceState(null,'',location.pathname+'#/cloud');await join(m[1],true)}
  window.addEventListener('online',()=>{st.online=true;kick(300)});window.addEventListener('offline',()=>{st.online=false;emit()});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')kick(300)});setInterval(()=>{if(document.visibilityState==='visible')run()},60000);
  emit();run()}
async function join(k,fromLink){k=String(k||'').trim();const m=/join=([A-Za-z0-9_\-]{20,})/.exec(k);if(m)k=m[1];
  if(!/^[A-Za-z0-9_\-]{20,}$/.test(k)){st.error='الرمز مش مظبوط';emit();return false}
  try{const c=await rpc('serp_check',{p_key:k});if(!c||!c.ok){st.error='رمز الربط غلط';emit();return false}st.name=c.name;st.lastBackup=c.last_backup}
  catch(e){if(!fromLink){st.error='لازم نت عشان تتأكد من الرمز أول مرة';emit();return false}}
  key=k;await Store.meta('deviceKey',k);await Store.meta('cursor',0);await Store.meta('syncInit',null);st.error='';emit();await run();return true}
async function unlink(){key=null;await Store.meta('deviceKey',null);st.enabled=false;st.name='';emit()}
/* سجل تسجيل واحد من السحابة (نسخ الأجهزة التانية كمان) */
async function histOf(c,id){if(!key||!navigator.onLine)return null;try{const r=await rpc('serp_history',{p_key:key,p_coll:c,p_id:id});return (r&&r.rows)||[]}catch(e){return null}}
function link(){return key?location.origin+location.pathname+'#join='+key:''}
g.SYNC={init,run,kick,join,unlink,link,history:histOf,state:st,on:f=>listeners.push(f),get enabled(){return !!key}};
})(window);
