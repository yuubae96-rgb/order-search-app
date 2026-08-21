'use strict';
(function(){
  let applying=false;

  function ensureCalendarButton(dateField){
    const input=dateField.querySelector('#f_orderDate');
    if(!input)return;
    input.type='date';
    let wrap=dateField.querySelector('.np-date-wrap');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.className='np-date-wrap';
      input.parentNode.insertBefore(wrap,input);
      wrap.appendChild(input);
    }
    if(!wrap.querySelector('.np-calendar-btn')){
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='np-calendar-btn';
      btn.setAttribute('aria-label','カレンダーから見積日を選ぶ');
      btn.textContent='📅';
      btn.addEventListener('click',()=>{
        try{ if(typeof input.showPicker==='function') input.showPicker(); else { input.focus(); input.click(); } }
        catch(e){ input.focus(); input.click(); }
      });
      wrap.appendChild(btn);
    }
  }

  function apply(){
    if(applying)return false;
    const form=document.getElementById('orderForm');
    const card=document.getElementById('quoteV2');
    const date=document.getElementById('f_orderDate')?.closest('.field');
    const staff=document.getElementById('f_staff')?.closest('.field');
    const company=document.getElementById('f_company')?.closest('.field');
    const item=document.getElementById('f_itemName')?.closest('.field');
    const due=document.getElementById('f_dueDate')?.closest('.field');
    const specGrid=document.querySelector('#orderForm .quote-spec-grid');
    const materialOther=document.getElementById('materialOtherField');
    if(!form||!card||!date||!staff||!company||!item||!due||!specGrid)return false;
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
      date.className='field np-date-field';
      staff.className='field np-staff-field';
      company.className='field np-company-field';
      item.className='field np-item-field';

      // NP番号他の直下へ、材質・板厚・縦・横をまとめて移動
      specGrid.classList.add('np-spec-grid');
      if(specGrid.parentElement!==card || specGrid.previousElementSibling!==grid){
        grid.insertAdjacentElement('afterend',specGrid);
      }
      // 「その他」材質を選んだ時の自由入力欄も仕様欄の直下へ追従
      if(materialOther && materialOther.parentElement!==card){
        specGrid.insertAdjacentElement('afterend',materialOther);
      } else if(materialOther && materialOther.previousElementSibling!==specGrid){
        specGrid.insertAdjacentElement('afterend',materialOther);
      }

      if(card.contains(due)) card.insertAdjacentElement('beforebegin',due);
      due.classList.add('np-due-field');

      const dateLabel=date.querySelector('label');
      if(dateLabel)dateLabel.innerHTML='見積日<span class="req">必須</span>';
      const staffLabel=staff.querySelector('label');
      if(staffLabel)staffLabel.textContent='担当者';
      const companyLabel=company.querySelector('label');
      if(companyLabel)companyLabel.innerHTML='客先名<span class="req">必須</span>';
      const itemLabel=item.querySelector('label');
      if(itemLabel)itemLabel.textContent='NP番号他';

      ensureCalendarButton(date);

      const title=card.querySelector('.quote-v2-title');
      if(title)title.textContent='数量別のNP単価';
      const sub=card.querySelector('.quote-v2-sub');
      if(sub)sub.textContent='見積日・担当者・客先・NP番号・仕様と、数量別単価をまとめて残します。';
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