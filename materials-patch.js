(function(){
'use strict';
const METAL_THICKNESS=['0.1','0.15','0.2','0.3','0.4','0.5','0.8','1.0','1.5','2.0','その他'];
function fill(el,values){
  if(!el)return;
  const current=el.value;
  el.innerHTML='<option value="">選択してください</option>'+values.map(v=>`<option value="${v}">${v}</option>`).join('');
  if(values.includes(current))el.value=current;
}
function apply(){
  const category=document.getElementById('mm_category');
  const material=document.getElementById('mm_material');
  const thickness=document.getElementById('mm_thickness');
  const adhesive=document.getElementById('mm_adhesive');
  const laminate=document.getElementById('mm_laminate');
  if(!category||!material||!thickness)return false;
  const isMetal=category.value==='金属板';
  if(isMetal){
    const existing=[...thickness.options].map(o=>o.value).filter(Boolean);
    if(!METAL_THICKNESS.every(v=>existing.includes(v))) fill(thickness,METAL_THICKNESS);
    if(adhesive){adhesive.value='なし';const f=adhesive.closest('.field');if(f)f.style.display='none';}
    if(laminate){laminate.value='なし';const f=laminate.closest('.field');if(f)f.style.display='none';}
  }else{
    if(adhesive){const f=adhesive.closest('.field');if(f)f.style.display='';}
    if(laminate){const f=laminate.closest('.field');if(f)f.style.display='';}
  }
  return true;
}
function start(){
  if(!apply()){setTimeout(start,200);return;}
  ['mm_category','mm_material'].forEach(id=>{
    const el=document.getElementById(id);
    if(el&&!el.dataset.metalPatch){
      el.dataset.metalPatch='1';
      el.addEventListener('change',()=>setTimeout(apply,0));
    }
  });
  const observer=new MutationObserver(()=>apply());
  const t=document.getElementById('mm_thickness');if(t)observer.observe(t,{childList:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();