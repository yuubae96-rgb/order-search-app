(function(){
'use strict';
if(window.__materialSimilarityReviewInstalled)return;
window.__materialSimilarityReviewInstalled=true;
const AI_FN='https://vnnvuxccazkdzwqjmntz.supabase.co/functions/v1/delivery-note-ai';
const nativeFetch=window.fetch.bind(window);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function askSame(data){
 return new Promise(resolve=>{
  document.getElementById('material-similarity-modal')?.remove();
  const c=data.similar_candidate||{},n=data.incoming||{};
  const wrap=document.createElement('div');wrap.id='material-similarity-modal';wrap.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.48);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box';
  wrap.innerHTML=`<div style="width:min(520px,100%);max-height:88vh;overflow:auto;background:#fff;border-radius:20px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.35);color:#111827"><div style="font-size:22px;font-weight:900;margin-bottom:6px">これは同じ材料ですか？</div><div style="font-size:13px;color:#6b7280;margin-bottom:14px">似た材料がすでに登録されています。勝手には統合しません。</div><div style="border:2px solid #2563eb;border-radius:14px;padding:12px;margin-bottom:10px"><div style="font-size:12px;color:#2563eb;font-weight:800">今回読み取った材料</div><div style="font-size:17px;font-weight:900;margin-top:3px">${esc(n.name)}</div><div style="font-size:13px;margin-top:4px">規格：${esc(n.spec||'未設定')}　単位：${esc(n.unit||'')}</div><div style="font-size:12px;color:#6b7280;margin-top:3px">仕入先：${esc(n.supplier||'')}</div></div><div style="border:2px solid #16a34a;border-radius:14px;padding:12px;margin-bottom:14px"><div style="font-size:12px;color:#15803d;font-weight:800">すでに登録されている材料</div><div style="font-size:17px;font-weight:900;margin-top:3px">${esc(c.name)}</div><div style="font-size:13px;margin-top:4px">規格：${esc(c.spec||'未設定')}　単位：${esc(c.stock_unit||'')}</div><div style="font-size:12px;color:#6b7280;margin-top:3px">仕入先：${esc(c.supplier||'')}</div></div><button data-act="same" style="width:100%;border:0;border-radius:12px;padding:14px;background:#15803d;color:#fff;font-size:16px;font-weight:900;margin-bottom:9px">同じ材料 → 既存にまとめる</button><button data-act="different" style="width:100%;border:2px solid #2563eb;border-radius:12px;padding:13px;background:#fff;color:#1d4ed8;font-size:16px;font-weight:900;margin-bottom:9px">別の材料 → 分けて登録</button><button data-act="cancel" style="width:100%;border:0;border-radius:12px;padding:12px;background:#e5e7eb;color:#374151;font-weight:800">いったん登録しない</button></div>`;
  document.body.appendChild(wrap);
  wrap.querySelector('[data-act="same"]').onclick=()=>{wrap.remove();resolve('same')};
  wrap.querySelector('[data-act="different"]').onclick=()=>{wrap.remove();resolve('different')};
  wrap.querySelector('[data-act="cancel"]').onclick=()=>{wrap.remove();resolve('cancel')};
 });
}
window.fetch=async function(input,init){
 const url=typeof input==='string'?input:(input&&input.url)||'';
 if(url!==AI_FN||String(init?.method||'GET').toUpperCase()!=='POST'||!init?.body)return nativeFetch(input,init);
 let body;try{body=JSON.parse(init.body)}catch{return nativeFetch(input,init)}
 if(body.action!=='confirm'||body.merge_target_id||body.force_new)return nativeFetch(input,init);
 const first=await nativeFetch(input,init);
 if(first.status!==409)return first;
 let data;try{data=await first.clone().json()}catch{return first}
 if(data?.error!=='similar_material_found'||!data.similar_candidate)return first;
 const choice=await askSame(data);
 if(choice==='cancel'){
  return new Response(JSON.stringify({error:'登録をキャンセルしました'}),{status:400,headers:{'Content-Type':'application/json'}});
 }
 const next={...body};
 if(choice==='same')next.merge_target_id=data.similar_candidate.id;
 else next.force_new=true;
 return nativeFetch(url,{...init,body:JSON.stringify(next)});
};
})();