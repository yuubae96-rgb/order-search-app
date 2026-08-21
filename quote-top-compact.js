'use strict';
(function(){
  function compactTopFields(){
    const form=document.getElementById('orderForm');
    if(!form)return;
    const date=document.getElementById('f_orderDate')?.closest('.field');
    const staff=document.getElementById('f_staff')?.closest('.field');
    const company=document.getElementById('f_company')?.closest('.field');
    const due=document.getElementById('f_dueDate')?.closest('.field');
    const item=document.getElementById('f_itemName')?.closest('.field');
    if(!date||!staff||!company||!due||!item)return;

    const dateLabel=date.querySelector('label');
    if(dateLabel) dateLabel.innerHTML='見積もり日<span class="req">必須</span>';
    const itemLabel=item.querySelector('label');
    if(itemLabel) itemLabel.textContent='NP番号他';

    let grid=document.getElementById('quoteTopGrid');
    if(!grid){
      grid=document.createElement('div');
      grid.id='quoteTopGrid';
      grid.className='quote-top-grid';
      const anchor=[date,staff,company,due].find(x=>x.parentElement===form) || form.firstElementChild;
      form.insertBefore(grid,anchor);
    }
    [date,staff,company,due].forEach(x=>grid.appendChild(x));
    grid.insertAdjacentElement('afterend',item);
  }
  function run(){setTimeout(compactTopFields,80);setTimeout(compactTopFields,500);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();