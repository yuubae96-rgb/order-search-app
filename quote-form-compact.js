'use strict';
(function(){
 function compact(){
  const form=document.getElementById('orderForm'); if(!form)return;
  const ids=['f_orderDate','f_staff','f_dueDate'];
  const fields=ids.map(id=>document.getElementById(id)?.closest('.field'));
  if(fields.some(x=>!x))return;
  let grid=document.getElementById('quoteTopGrid');
  if(!grid){grid=document.createElement('div');grid.id='quoteTopGrid';grid.className='quote-top-grid';fields[0].parentNode.insertBefore(grid,fields[0]);}
  fields.forEach(f=>grid.appendChild(f));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(compact,50));else setTimeout(compact,50);
})();