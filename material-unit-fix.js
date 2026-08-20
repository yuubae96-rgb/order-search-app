(function(){
'use strict';
const UNITS=['枚','巻','缶','kg','個','㎡'];
function label(v){return v==='㎡'?'㎡（平方メートル）':v;}
function fixSelect(select){
  if(!select)return;
  const current=select.value;
  const values=[...select.options].map(o=>o.value).filter(Boolean);
  if(values.length===UNITS.length&&UNITS.every(v=>values.includes(v)))return;
  select.innerHTML='<option value="">選択してください</option>'+UNITS.map(v=>'<option value="'+v+'">'+label(v)+'</option>').join('');
  if(UNITS.includes(current))select.value=current;
}
function attach(select){
  if(!select||select.dataset.unitFix==='1')return;
  select.dataset.unitFix='1';
  fixSelect(select);
  let busy=false;
  new MutationObserver(()=>{
    if(busy)return;
    const values=[...select.options].map(o=>o.value).filter(Boolean);
    if(values.length===UNITS.length&&UNITS.every(v=>values.includes(v)))return;
    busy=true;setTimeout(()=>{fixSelect(select);busy=false;},0);
  }).observe(select,{childList:true});
}
function apply(){
  attach(document.getElementById('miUnit'));
  attach(document.getElementById('mm_stock_unit'));
}
function start(){
  apply();
  new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('change',e=>{
    if(['miCat','miMat','mm_category','mm_material'].includes(e.target?.id))setTimeout(apply,0);
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
