(function(){
'use strict';
function wait(){if(!window.supabaseClient){setTimeout(wait,250);return;}setInterval(render,2500);}
async function render(){const hub=document.getElementById('management-hub-overlay');if(!hub||hub.style.display==='none'||document.getElementById('owner-system-flow'))return;const modules=hub.querySelector('[data-mh-index]')?.parentElement;if(!modules)return;const box=document.createElement('div');box.id='owner-system-flow';box.style.cssText='background:#111827;color:#fff;border-radius:16px;padding:15px;margin:16px 0';box.innerHTML='<div style="font-size:12px;opacity:.7">会社データ連携</div><div style="font-weight:900;margin:5px 0 8px">材料 → 在庫 → 原価 → 見積 → 経営</div><div style="font-size:12px;line-height:1.7;opacity:.85">勤怠 → 給与 → 労務原価 → 製品原価 → 見積・利益<br>営業 → 見積 → 受注 → 売上・利益</div><div style="font-size:11px;margin-top:9px;opacity:.65">現在：材料・在庫・価格履歴・勤怠/給与・見積・権限管理の基盤を接続済み。製造実績・受注売上は次段階で実データ接続。</div>';modules.parentNode.insertBefore(box,modules);}
wait();
})();