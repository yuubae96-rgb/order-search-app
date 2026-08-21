'use strict';
(function(){
  function compactTopFields(){
    const form=document.getElementById('orderForm');
    if(!form)return;
    const date=document.getElementById('f_orderDate')?.closest('.field');
    const staff=document.getElementById('f_staff')?.closest('.field');
    const due=document.getElementById('f_dueDate')?.closest('.field');
    if(!date||!staff||!due)return;

    const dateLabel=date.querySelector('label');
    if(dateLabel) dateLabel.innerHTML='見積もり日<span class="req">必須</span>';

    let grid=document.getElementById('quoteTopGrid');
    if(!grid){
      grid=document.createElement('div');
      grid.id='quoteTopGrid';
      grid.className='quote-top-grid';
      const anchor=[date,staff,due].find(x=>x.parentElement===form) || form.firstElementChild;
      form.insertBefore(grid,anchor);
    }

    // 上部は見積日・担当者・納期だけ。客先名とNP番号は数量別NP単価カード側で管理する。
    [date,staff,due].forEach(x=>grid.appendChild(x));
  }
  function run(){setTimeout(compactTopFields,80);setTimeout(compactTopFields,500);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();