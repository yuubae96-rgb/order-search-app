(function(){
'use strict';
// mList を subtree:true で監視すると、表示補正が自分自身の変更を再検知してiPhoneで無限に近い再処理になる。
// この画面では mList 直下の差し替えだけ監視すれば十分なので subtree を無効化する。
if(!window.__inventoryObserverGuard){
 window.__inventoryObserverGuard=true;
 const nativeObserve=MutationObserver.prototype.observe;
 MutationObserver.prototype.observe=function(target,options){
  if(target?.id==='mList'&&options?.subtree){options={...options,subtree:false,characterData:false}}
  return nativeObserve.call(this,target,options);
 };
}

// 旧材料ロジックは材料1件ごとに全入出庫・全単価履歴を filter+sort していた。
// 同じ結果をMapへ1回だけ集計し、一覧描画中はO(1)で返す。
let __moveSig='',__priceSig='',__stockMap=new Map(),__priceMap=new Map();
function rebuildStockCache(){
 const a=(typeof moves!=='undefined'&&Array.isArray(moves))?moves:[];
 const sig=a.length+'|'+(a[0]?.id??'')+'|'+(a[a.length-1]?.id??'');if(sig===__moveSig)return;__moveSig=sig;__stockMap=new Map();
 const rows=[...a].sort((x,y)=>String(x.movement_date||'').localeCompare(String(y.movement_date||''))||Number(x.id)-Number(y.id));
 for(const x of rows){const id=String(x.material_id),q=Number(x.quantity)||0,cur=__stockMap.get(id)||0;if(x.movement_type==='adjust')__stockMap.set(id,q);else if(x.movement_type==='in')__stockMap.set(id,cur+q);else if(x.movement_type==='out')__stockMap.set(id,cur-q)}
}
function rebuildPriceCache(){
 const a=(typeof prices!=='undefined'&&Array.isArray(prices))?prices:[];
 const sig=a.length+'|'+(a[0]?.id??'')+'|'+(a[a.length-1]?.id??'');if(sig===__priceSig)return;__priceSig=sig;__priceMap=new Map();
 for(const p of a){const id=String(p.material_id),old=__priceMap.get(id);if(!old||String(p.effective_from||'')>String(old.effective_from||'')||(String(p.effective_from||'')===String(old.effective_from||'')&&Number(p.id)>Number(old.id)))__priceMap.set(id,p)}
}
try{
 stockFor=function(id){rebuildStockCache();return __stockMap.get(String(id))||0};
 latestPriceFor=function(id){rebuildPriceCache();return __priceMap.get(String(id))||null};
}catch(e){console.warn('inventory fast cache install skipped',e)}

const nativeAlert=window.alert.bind(window);
function ensureToast(){let el=document.getElementById('movement-confirm-toast');if(el)return el;el=document.createElement('div');el.id='movement-confirm-toast';el.style.cssText='position:fixed;left:50%;top:28%;transform:translate(-50%,-50%);z-index:99999;min-width:260px;max-width:86vw;background:#fff;border-radius:18px;padding:22px 24px;box-shadow:0 12px 40px rgba(0,0,0,.35);text-align:center;font-size:19px;font-weight:800;color:#111827;display:none;border:1px solid #e5e7eb';document.body.appendChild(el);return el;}
window.alert=function(message){
 if(message!=='入出庫を登録しました')return nativeAlert(message);
 const type=document.getElementById('mv_type')?.value,qty=Number(document.getElementById('mv_qty')?.value||0),matId=document.getElementById('mv_material')?.value;let unit='';
 try{const m=(typeof materials!=='undefined'?materials:[]).find(x=>String(x.id)===String(matId));unit=m?.stock_unit||''}catch(e){}
 if(!unit){const text=document.getElementById('mv_material')?.selectedOptions?.[0]?.textContent||'',m=text.match(/\s(枚|巻|缶|kg|個|㎡)\）?$/);if(m)unit=m[1]}
 const isIn=type==='in',word=isIn?'入庫':'出庫',color=isIn?'#16794b':'#c62828',bg=isIn?'#ecfdf3':'#fff1f2',el=ensureToast();el.style.background=bg;el.innerHTML=`<div style="font-size:30px;margin-bottom:7px">✓</div><div><span style="color:${color};font-size:24px">${word}</span></div><div style="margin-top:7px;font-size:22px"><b>${qty.toLocaleString('ja-JP')}${unit}</b> ${word}しました</div>`;el.style.display='block';clearTimeout(window.__movementToastTimer);window.__movementToastTimer=setTimeout(()=>{el.style.display='none'},3000);
};
function switchTabNow(button){if(!button?.dataset?.tab)return;const panel=document.getElementById('mp-'+button.dataset.tab);if(!panel)return;document.querySelectorAll('.material-tab').forEach(x=>x.classList.toggle('active',x===button));document.querySelectorAll('.material-panel').forEach(x=>x.classList.toggle('active',x===panel))}
function enableFastTabs(){document.querySelectorAll('.material-tab').forEach(button=>{button.style.touchAction='manipulation';button.style.webkitTapHighlightColor='transparent';if(button.dataset.fastTab==='1')return;button.dataset.fastTab='1';button.addEventListener('pointerdown',()=>switchTabNow(button),{passive:true})})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enableFastTabs,{once:true});else enableFastTabs();
// documentElement全体の常時監視はやめ、タブが後から追加される納品書・棚卸し用に短時間だけ確認する。
setTimeout(enableFastTabs,300);setTimeout(enableFastTabs,1000);setTimeout(enableFastTabs,2500);

if(!document.querySelector('script[data-area-units]')){const s=document.createElement('script');s.dataset.areaUnits='1';s.src='https://yuubae96-rgb.github.io/material-inventory-app/area-units.js?v=20260821-1841';document.head.appendChild(s)}
if(!document.querySelector('script[data-material-similarity-review]')){const s=document.createElement('script');s.dataset.materialSimilarityReview='1';s.src='https://yuubae96-rgb.github.io/order-search-app/material-similarity-review.js?v=20260821-1430';document.head.appendChild(s)}
})();