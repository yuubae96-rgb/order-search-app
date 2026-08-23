(function(){
'use strict';
const LFN='https://vnnvuxccazkdzwqjmntz.supabase.co/functions/v1/estimate-notebook2-lower-choice';
function mergeLower(dst,src){
  if(!dst||!src)return;
  const keys=['previous_unit_price_present','detail_sheet_present','sample_present','separate_drawing_present','separate_drawing_kind','order_probability','stock_present'];
  for(const k of keys){ if(src[k]!==undefined) dst[k]=src[k]; }
}
function install(){
  const btn=document.getElementById('analyzeBtn');
  if(!btn||btn.dataset.lowerChoiceWrapped)return false;
  const old=btn.onclick;
  if(typeof old!=='function')return false;
  btn.dataset.lowerChoiceWrapped='1';
  btn.onclick=async function(){
    const f=document.getElementById('file')?.files?.[0];
    let lowerPromise=null;
    if(f){
      try{
        lowerPromise=(async()=>{
          const base64=await file64(f);
          return await api(LFN,{file_name:f.name,mime_type:f.type||'application/octet-stream',base64});
        })();
      }catch(e){ console.warn('lower choice start failed',e); }
    }
    const r=await old.apply(this,arguments);
    if(lowerPromise){
      try{
        const j=await lowerPromise;
        if(window.analyzed?.parsed && j?.parsed){
          mergeLower(window.analyzed.parsed,j.parsed);
          if(typeof fill==='function') fill(window.analyzed.parsed);
        }else if(typeof analyzed!=='undefined' && analyzed?.parsed && j?.parsed){
          mergeLower(analyzed.parsed,j.parsed);
          if(typeof fill==='function') fill(analyzed.parsed);
        }
      }catch(e){ console.warn('lower choice read failed',e); }
    }
    return r;
  };
  return true;
}
if(!install()){
  let n=0;const tm=setInterval(()=>{n++;if(install()||n>30)clearInterval(tm)},200);
}
})();
