'use strict';
(function(){
  let busy=false;
  async function syncPriceUnits(){
    if(busy||!window.supabaseClient||!document.getElementById('miList')) return;
    busy=true;
    try{
      const {data,error}=await supabaseClient.from('materials').select('id,name,spec,purchase_form,stock_unit').eq('active',true).order('name');
      if(error){console.error('price unit materials load',error);return;}
      const mats=data||[];
      document.querySelectorAll('#miList .mi-item').forEach(row=>{
        const left=row.firstElementChild;
        if(!left)return;
        const text=(left.textContent||'').replace(/\s+/g,' ');
        const m=mats.find(x=>text.includes(x.name)&&(!x.spec||text.includes(x.spec))&&(!x.purchase_form||text.includes(x.purchase_form)));
        if(!m||!m.stock_unit)return;
        const meta=left.querySelector('.mi-meta');
        if(!meta)return;
        const unit=m.stock_unit==='㎡'?'㎡':m.stock_unit;
        meta.childNodes.forEach(node=>{
          if(node.nodeType!==Node.TEXT_NODE)return;
          const t=node.nodeValue||'';
          if(!t.includes('最新単価'))return;
          node.nodeValue=t.replace(/最新単価\s*([\d,]+(?:\.\d+)?)円\s*(?:\/\s*[^\s(]+)?\s*(\([^)]*\))?/,
            function(_,price,date){return '最新単価 '+price+'円 / '+unit+' '+(date||'');});
        });
      });
    } finally {busy=false;}
  }
  function start(){
    if(!window.supabaseClient){setTimeout(start,150);return;}
    setInterval(syncPriceUnits,700);
    document.addEventListener('click',e=>{
      if(e.target.closest('.tab-btn[data-goto="materials"],.mi-tab[data-mi="list"]')) setTimeout(syncPriceUnits,250);
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
