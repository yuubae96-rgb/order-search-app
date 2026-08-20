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
let materialUnits=new Map();
async function loadMaterialUnits(){
  if(!window.supabaseClient)return;
  try{
    const {data,error}=await window.supabaseClient.from('materials').select('id,category,stock_unit');
    if(error)return;
    materialUnits=new Map((data||[]).map(m=>[String(m.id),m.category==='シール・ラベル'?'㎡':(m.stock_unit||'')]));
    fixInventoryDisplay();
  }catch(_e){}
}
function fixInventoryDisplay(){
  document.querySelectorAll('#miList .mi-item').forEach(row=>{
    const btn=row.querySelector('.mi-delete-btn[data-id]');
    if(!btn)return;
    const unit=materialUnits.get(String(btn.dataset.id));
    if(!unit)return;
    const stock=row.querySelector('.mi-stock');
    if(stock)stock.textContent=stock.textContent.replace(/\s*(枚|巻|缶|kg|個|㎡)\s*$/,' '+unit);
    const meta=row.querySelector('.mi-meta');
    if(meta&&/最新単価\s*[\d,]+円/.test(meta.textContent)){
      const nodes=[...meta.childNodes];
      nodes.forEach(n=>{
        if(n.nodeType===Node.TEXT_NODE&&/最新単価\s*[\d,]+円/.test(n.textContent)){
          n.textContent=n.textContent.replace(/(最新単価\s*[\d,]+円)(?:\s*\/\s*(?:枚|巻|缶|kg|個|㎡))?(\s*\()/,'$1 / '+unit+'$2');
        }
      });
    }
  });
}
function apply(){
  attach(document.getElementById('miUnit'));
  attach(document.getElementById('mm_stock_unit'));
  fixInventoryDisplay();
}
function start(){
  apply();
  loadMaterialUnits();
  let timer=null;
  new MutationObserver(()=>{
    apply();
    clearTimeout(timer);
    timer=setTimeout(loadMaterialUnits,100);
  }).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('change',e=>{
    if(['miCat','miMat','mm_category','mm_material'].includes(e.target?.id))setTimeout(apply,0);
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
