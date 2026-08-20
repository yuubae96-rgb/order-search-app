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

function supplierNames(){
  const names=new Set();
  document.querySelectorAll('#mList .material-meta').forEach(el=>{
    const m=el.innerText.match(/仕入先\s+([^\n]+)/);
    if(m&&m[1].trim())names.add(m[1].trim());
  });
  return [...names].sort((a,b)=>a.localeCompare(b,'ja'));
}
function refreshSupplierChoices(){
  const names=supplierNames();
  const filter=document.getElementById('mSupplierFilter');
  if(filter){
    const current=filter.value;
    filter.innerHTML='<option value="">すべてのサプライヤー</option>'+names.map(n=>`<option value="${n.replace(/"/g,'&quot;')}">${n}</option>`).join('');
    if(names.includes(current))filter.value=current;
  }
  const dl=document.getElementById('mSupplierList');
  if(dl)dl.innerHTML=names.map(n=>`<option value="${n.replace(/"/g,'&quot;')}"></option>`).join('');
}
function applySupplierFilter(){
  const filter=document.getElementById('mSupplierFilter');
  if(!filter)return;
  const supplier=filter.value;
  document.querySelectorAll('#mList .material-list-item').forEach(row=>{
    if(!supplier){row.style.display='';return;}
    const meta=row.querySelector('.material-meta')?.innerText||'';
    row.style.display=meta.includes('仕入先 '+supplier)?'':'none';
  });
}
function setupSupplier(){
  const search=document.getElementById('mSearch');
  if(!search)return false;
  if(!document.getElementById('mSupplierFilter')){
    const field=document.createElement('div');
    field.className='field';
    field.style.marginTop='10px';
    field.innerHTML='<label>サプライヤーで絞り込み</label><select id="mSupplierFilter"><option value="">すべてのサプライヤー</option></select>';
    search.closest('.field')?.after(field);
    field.querySelector('select').addEventListener('change',applySupplierFilter);
  }
  const supplier=document.getElementById('mm_supplier');
  if(supplier&&!document.getElementById('mSupplierList')){
    const dl=document.createElement('datalist');dl.id='mSupplierList';document.body.appendChild(dl);
    supplier.setAttribute('list','mSupplierList');
    supplier.setAttribute('placeholder','登録済みから選択、または新規入力');
  }
  refreshSupplierChoices();
  applySupplierFilter();
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
  const thicknessObserver=new MutationObserver(()=>apply());
  const t=document.getElementById('mm_thickness');if(t)thicknessObserver.observe(t,{childList:true});
  setupSupplier();
  const list=document.getElementById('mList');
  if(list){
    let timer;
    new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{refreshSupplierChoices();applySupplierFilter();},50)}).observe(list,{childList:true,subtree:true});
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();