'use strict';
(function(){
  function apply(){
    const nav=document.querySelector('.tabbar-inner');
    if(nav){
      nav.querySelectorAll('[data-goto="materials"], a[href*="materials"], button').forEach(el=>{
        const text=(el.textContent||'').replace(/\s+/g,'');
        if(el.dataset?.goto==='materials' || text.includes('材料・在庫')) el.remove();
      });
      nav.style.setProperty('grid-template-columns','repeat(4,minmax(0,1fr))','important');
    }
    const materialScreen=document.getElementById('screen-materials');
    if(materialScreen?.classList.contains('active')){
      materialScreen.classList.remove('active');
      document.getElementById('screen-register')?.classList.add('active');
    }
  }
  function start(){
    apply();
    [50,150,300,600,1200,2000].forEach(ms=>setTimeout(apply,ms));
    const obs=new MutationObserver(apply);
    obs.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();