'use strict';
(function(){
  function apply(){
    const card=document.getElementById('quoteV2');
    const company=document.getElementById('f_company')?.closest('.field');
    const item=document.getElementById('f_itemName')?.closest('.field');
    if(!card||!company||!item)return false;

    let grid=document.getElementById('quoteNpContextGrid');
    if(!grid){
      grid=document.createElement('div');
      grid.id='quoteNpContextGrid';
      grid.className='quote-np-context-grid';
      const sub=card.querySelector('.quote-v2-sub');
      (sub||card.firstChild).insertAdjacentElement('afterend',grid);
    }
    grid.appendChild(company);
    grid.appendChild(item);

    const title=card.querySelector('.quote-v2-title');
    if(title) title.textContent='数量別のNP単価';
    const sub=card.querySelector('.quote-v2-sub');
    if(sub) sub.textContent='客先・NP番号と、お客様へ提示した数量別単価をまとめて残します。';
    return true;
  }

  function start(){
    if(apply())return;
    let count=0;
    const timer=setInterval(()=>{count++;if(apply()||count>40)clearInterval(timer);},100);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();