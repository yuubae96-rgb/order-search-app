'use strict';
(function(){
  function applyLayout(){
    const box=document.getElementById('quoteV2');
    const company=document.getElementById('f_company')?.closest('.field');
    const np=document.getElementById('f_itemName')?.closest('.field');
    if(!box||!company||!np||box.querySelector('.quote-customer-grid'))return false;

    const grid=document.createElement('div');
    grid.className='quote-customer-grid';
    grid.innerHTML='<div class="quote-customer-title">客先・NP情報</div>';
    grid.appendChild(company);
    grid.appendChild(np);

    const title=box.querySelector('.quote-v2-title');
    if(title){
      title.textContent='数量別のNP単価';
      box.insertBefore(grid,title);
    }else{
      box.prepend(grid);
    }

    const sub=box.querySelector('.quote-v2-sub');
    if(sub)sub.textContent='客先・NP番号と、お客様へ提示した数量・単価をまとめて残します。';
    return true;
  }

  function addCss(){
    const s=document.createElement('style');
    s.textContent=`
      .quote-customer-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px 12px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid #d9dde3}
      .quote-customer-grid .quote-customer-title{grid-column:1/-1;font-size:13px;font-weight:900;color:#535b66;margin-bottom:-2px}
      .quote-customer-grid .field{min-width:0;margin-bottom:0}
      .quote-customer-grid input{width:100%;min-width:0;box-sizing:border-box}
      .quote-customer-grid label{font-size:12px}
    `;
    document.head.appendChild(s);
  }

  function start(){
    addCss();
    if(applyLayout())return;
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(applyLayout()||tries>30)clearInterval(timer);
    },100);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();