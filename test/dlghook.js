// اختبارات: بيرد تلقائي على نوافذ البرنامج الداخلية (مش نوافذ المتصفح) — __dlgMode: accept | dismiss | ui
window.__dlgLog=[];window.__dlgMode='accept';window.__dlgPrompt=null;
window.__dlgAuto=function(o){window.__dlgLog.push((o.kind||'')+': '+String(o.msg||o.title||'').slice(0,90));const m=window.__dlgMode;if(m==='ui'||o.kind==='new')return undefined;if(o.kind==='perCtn')return window.__dlgPerCtn?window.__dlgPerCtn:null;if(o.kind==='count')return m!=='cancelAll'?{n:String(window.__dlgCount||1),runId:window.__dlgRun||'',price:window.__dlgPrice==null?'':String(window.__dlgPrice)}:null;
  if(o.kind==='alert')return true;if(o.kind==='prompt')return m==='accept'?(window.__dlgPrompt!=null?String(window.__dlgPrompt):String(o.fields&&o.fields[0]&&o.fields[0].val!=null?o.fields[0].val:'')):null;return m==='accept'};
// v1.2.8: الاختبارات القديمة بتختار تشغيلة لكل سطر بيع (التوزيع اليدوي) — بنحوّل أي بيع جديد ليدوي تلقائي إلا لو __saleLegacy=false (اختبار التوزيع التلقائي e2e128sale)
if(window.__saleLegacy===undefined)window.__saleLegacy=true;
document.addEventListener('DOMContentLoaded',()=>{new MutationObserver(()=>{if(!window.__saleLegacy)return;const b=document.querySelector('#sheet [data-act="allocManual"]');if(b&&!b.__c){b.__c=1;b.click()}}).observe(document.documentElement,{childList:true,subtree:true})});
