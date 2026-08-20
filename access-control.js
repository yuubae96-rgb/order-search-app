(function(){
'use strict';

// 会社アプリからはログイン画面を出さず、そのまま利用できるようにする。
function enableNoLogin(){
  if(!window.supabaseClient){setTimeout(enableNoLogin,100);return;}

  // app.js の初期化判定用。実際のDB通信は公開用anonキーで行う。
  try{
    supabaseClient.auth.getSession=async()=>({data:{session:{user:{id:'company-app',email:'company@local'},access_token:'company-app'}},error:null});
    supabaseClient.auth.getUser=async()=>({data:{user:{id:'company-app',email:'company@local'}},error:null});
  }catch(e){console.warn(e)}

  const gate=document.getElementById('authGate');
  if(gate){gate.classList.add('hidden');gate.style.display='none';}

  // app.js が先に「未ログイン」で初期化を止めていた場合は、ここで再初期化する。
  setTimeout(()=>{
    const g=document.getElementById('authGate');
    if(g){g.classList.add('hidden');g.style.display='none';}
    try{if(typeof init==='function')init();}catch(e){console.warn('no-login init',e)}
  },0);
  setTimeout(()=>{
    const g=document.getElementById('authGate');
    if(g){g.classList.add('hidden');g.style.display='none';}
  },300);
}
enableNoLogin();

// 既存の部署別表示制御は、ユーザープロフィールがある場合だけ適用する。
const DEFAULTS={owner:['register','search','analysis','settings','materials'],manager:['register','search','analysis','materials'],factory:['materials'],sales:['register','search','analysis'],office:['register','search','materials'],staff:[]};
function wait(){if(!window.supabaseClient){setTimeout(wait,200);return;}boot();}
async function boot(){
  let user=null;
  try{const r=await supabaseClient.auth.getUser();user=r?.data?.user||null;}catch(e){}
  if(!user||user.id==='company-app')return;
  const {data:profile}=await supabaseClient.from('app_users').select('role,active').eq('user_id',user.id).maybeSingle();
  if(!profile||profile.active===false)return;
  let allowed=DEFAULTS[profile.role]||[];
  if(profile.role!=='owner'){
    const {data:p}=await supabaseClient.from('app_permissions').select('module_key,can_view').eq('user_id',user.id).eq('can_view',true);
    if(p?.length)allowed=[...new Set(p.map(x=>x.module_key))];
  }
  apply(allowed,profile.role);
}
function apply(allowed,role){
  window.companyAllowedModules=allowed;document.documentElement.dataset.companyRole=role;
  const map={register:'register',search:'search',analysis:'analysis',settings:'settings',materials:'materials'};
  document.querySelectorAll('.tab-btn[data-screen]').forEach(b=>{const s=b.dataset.screen;if(map[s]&&!allowed.includes(map[s]))b.style.display='none';});
  document.querySelectorAll('.screen[data-screen]').forEach(s=>{if(map[s.dataset.screen]&&!allowed.includes(map[s.dataset.screen]))s.dataset.accessHidden='1';});
  const params=new URLSearchParams(location.search),factoryEntry=params.get('entry')==='factory';
  if(factoryEntry&&allowed.includes('materials')){setTimeout(()=>{const b=document.querySelector('.tab-btn[data-screen="materials"]');if(b)b.click();},150);}else{
    const active=document.querySelector('.screen.active[data-access-hidden="1"]');if(active){active.classList.remove('active');const first=allowed.map(k=>document.querySelector(`.tab-btn[data-screen="${k}"]`)).find(Boolean);if(first)first.click();}
  }
  if(role!=='owner')document.querySelectorAll('#workforce-cost-root,#cost-master-root,#management-hub-button').forEach(x=>x.style.display='none');
  document.addEventListener('click',e=>{const b=e.target.closest('.tab-btn[data-screen]');if(!b)return;const s=b.dataset.screen;if(map[s]&&!allowed.includes(map[s])){e.preventDefault();e.stopImmediatePropagation();alert('この画面を利用する権限がありません。');}},true);
}
wait();
})();