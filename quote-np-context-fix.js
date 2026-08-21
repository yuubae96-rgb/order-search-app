'use strict';
(function(){
  let applying=false;
  function apply(){
    if(applying)return false;
    const card=document.getElementById('quoteV2');
    const date=document.getElementById('f_orderDate')?.closest('.field');
    const staff=document.getElementById('f_staff')?.closest('.field');
    const company=document.getElementById('f_company')?.closest('.field');
    const item=document.getElementById('f_itemName')?.closest('.field');
    if(!card||!date||!staff||!company||!item)return false;
    applying=true;
    try{
      let grid=document.getElementById('quoteNpContextGrid');
      if(!grid){
        grid=document.createElement('div');
        grid.id='quoteNpContextGrid';
        grid.className='quote-np-context-grid';
        const sub=card.querySelector('.quote-v2-sub');
        if(sub) sub.insertAdjacentElement('afterend',grid);
        else card.insertBefore(grid,card.firstChild?.nextSibling||null);
      }
      [date,staff,company,item].forEach(field=>{if(field.parentElement!==grid)grid.appendChild(field);});

      const dateLabel=date.querySelector('label');
      if(dateLabel)dateLabel.innerHTML='見積日<span class="req">必須</span>';
      const companyLabel=company.querySelector('label');
      if(companyLabel)companyLabel.innerHTML='客先名<span class="req">必須</span>';
      const itemLabel=item.querySelector('label');
      if(itemLabel)itemLabel.textContent='NP番号他';
      const staffLabel=staff.querySelector('label');
      if(staffLabel)staffLabel.textContent='担当者';

      const title=card.querySelector('.quote-v2-title');
      if(title)title.textContent='数量別のNP単価';
      const sub=card.querySelector('.quote-v2-sub');
      if(sub)sub.textContent='見積日・担当者・客先・NP番号と、数量別単価をまとめて残します。';
      return true;
    }finally{applying=false;}
  }
  function start(){
    apply();
    [100,300,600,1000,1600].forEach(ms=>setTimeout(apply,ms));
    const form=document.getElementById('orderForm');
    if(form){
      const obs=new MutationObserver(()=>{if(!applying)setTimeout(apply,0);});
      obs.observe(form,{childList:true,subtree:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();