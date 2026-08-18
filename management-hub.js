(function(){
'use strict';
function wait(){if(!window.supabaseClient){setTimeout(wait,200);return;} boot();}
async function boot(){
 const {data:{user}}=await supabaseClient.auth.getUser(); if(!user)return;
 const {data:profile}=await supabaseClient.from('app_users').select('role,display_name,active').eq('user_id',user.id).maybeSingle();
 window.companyProfile=profile||{role:'staff'};
 if(profile?.role!=='owner'||profile?.active===false)return;
 addOwnerHub();
}
function addOwnerHub(){
 if(document.getElementById('management-hub-button'))return;
 const btn=document.createElement('button'); btn.id='management-hub-button'; btn.type='button'; btn.textContent='経営';
 btn.style.cssText='position:fixed;right:16px;top:max(16px,env(safe-area-inset-top));z-index:9998;background:#111827;color:#fff;border:0;border-radius:999px;padding:10px 16px;font-weight:800;box-shadow:0 4px 16px #0003';
 btn.onclick=openHub; document.body.appendChild(btn);
}
function openHub(){
 let ov=document.getElementById('management-hub-overlay'); if(ov){ov.style.display='block';return;}
 ov=document.createElement('div'); ov.id='management-hub-overlay'; ov.style.cssText='position:fixed;inset:0;z-index:9999;background:#f5f7fa;overflow:auto;padding:calc(18px + env(safe-area-inset-top)) 16px 40px';
 const modules=[['見積','見積登録・検索・分析'],['材料・在庫','材料価格・入出庫・発注'],['原価','材料費・労務費・加工費'],['勤怠・給与','タイムカードから人件費へ'],['営業','顧客・訪問・案件'],['製造','作業時間・工程・実績'],['経営分析','売上・粗利・原価・人件費']];
 ov.innerHTML=`<div style="max-width:760px;margin:auto"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:12px;color:#64748b">OWNER ONLY</div><h1 style="margin:2px 0 18px">経営</h1></div><button id="mh-close" style="border:0;background:#fff;border-radius:10px;padding:10px 14px">閉じる</button></div><div style="background:#111827;color:white;border-radius:18px;padding:18px;margin-bottom:14px"><div style="font-size:13px;opacity:.75">会社全体</div><div style="font-size:20px;font-weight:800;margin-top:5px">各部署のデータをここへ集約します</div><div style="font-size:13px;line-height:1.7;margin-top:8px;opacity:.85">社員には必要な業務画面だけを見せ、経営画面は社長アカウントだけに表示します。</div></div><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">${modules.map(m=>`<div style="background:#fff;border:1px solid #e2e8f0;border-radius:15px;padding:16px"><div style="font-weight:800;font-size:16px">${m[0]}</div><div style="font-size:12px;color:#64748b;margin-top:6px;line-height:1.5">${m[1]}</div></div>`).join('')}</div></div>`;
 document.body.appendChild(ov); ov.querySelector('#mh-close').onclick=()=>ov.style.display='none';
}
wait();
})();