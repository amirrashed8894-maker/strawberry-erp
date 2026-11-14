// اختبارات: بيرد تلقائي على نوافذ البرنامج الداخلية (مش نوافذ المتصفح) — __dlgMode: accept | dismiss | ui
window.__dlgLog=[];window.__dlgMode='accept';window.__dlgPrompt=null;
window.__dlgAuto=function(o){window.__dlgLog.push((o.kind||'')+': '+String(o.msg||o.title||'').slice(0,90));const m=window.__dlgMode;if(m==='ui'||o.kind==='new')return undefined;
  if(o.kind==='alert')return true;if(o.kind==='prompt')return m==='accept'?(window.__dlgPrompt!=null?String(window.__dlgPrompt):String(o.fields&&o.fields[0]&&o.fields[0].val!=null?o.fields[0].val:'')):null;return m==='accept'};
