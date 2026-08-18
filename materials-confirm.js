(function(){
'use strict';
const nativeAlert=window.alert.bind(window);
function ensureToast(){let el=document.getElementById('movement-confirm-toast');if(el)return el;el=document.createElement('div');el.id='movement-confirm-toast';el.style.cssText='position:fixed;left:50%;top:28%;transform:translate(-50%,-50%);z-index:99999;min-width:260px;max-width:86vw;background:#fff;border-radius:18px;padding:22px 24px;box-shadow:0 12px 40px rgba(0,0,0,.35);text-align:center;font-size:19px;font-weight:800;color:#111827;display:none;border:1px solid #e5e7eb';document.body.appendChild(el);return el;}
window.alert=function(message){
 if(message!=='入出庫を登録しました')return nativeAlert(message);
 const type=document.getElementById('mv_type')?.value;
 const qty=Number(document.getElementById('mv_qty')?.value||0);
 const matId=document.getElementById('mv_material')?.value;
 let unit='';
 try{const m=(window.materials||[]).find(x=>String(x.id)===String(matId));unit=m?.stock_unit||'';}catch(e){}
 if(!unit){const text=document.getElementById('mv_material')?.selectedOptions?.[0]?.textContent||'';const m=text.match(/\s(枚|巻|缶|kg|個)\）?$/);if(m)unit=m[1];}
 const isIn=type==='in';
 const word=isIn?'入庫':'出庫';
 const color=isIn?'#16794b':'#c62828';
 const bg=isIn?'#ecfdf3':'#fff1f2';
 const el=ensureToast();
 el.style.background=bg;
 el.innerHTML=`<div style="font-size:30px;margin-bottom:7px">✓</div><div><span style="color:${color};font-size:24px">${word}</span></div><div style="margin-top:7px;font-size:22px"><b>${qty.toLocaleString('ja-JP')}${unit}</b> ${word}しました</div>`;
 el.style.display='block';
 clearTimeout(window.__movementToastTimer);
 window.__movementToastTimer=setTimeout(()=>{el.style.display='none';},5000);
};
})();