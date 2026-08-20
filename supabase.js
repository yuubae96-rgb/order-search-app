'use strict';

const SUPABASE_URL = 'https://vnnvuxccazkdzwqjmntz.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xG-tuBgxFGntT1vlbZzuVQ_AZ2Zl8QL';

// ログイン機能は使わない。過去の期限切れJWTが残っていると401になるため、
// このSupabaseプロジェクトの認証情報を起動時に削除する。
(function clearLegacyAuthStorage(){
  const projectRef='vnnvuxccazkdzwqjmntz';
  [window.localStorage,window.sessionStorage].forEach(storage=>{
    try{
      for(let i=storage.length-1;i>=0;i--){
        const key=storage.key(i)||'';
        if(key.includes(projectRef)&&/auth|token/i.test(key)) storage.removeItem(key);
      }
    }catch(_e){}
  });
})();

const supabaseClient=window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth:{
      persistSession:false,
      autoRefreshToken:false,
      detectSessionInUrl:false
    }
  }
);
window.supabaseClient=supabaseClient;

// 既存app.jsとの互換用。画面上はログイン済み扱いにするが、
// access_tokenは持たせないためREST通信はpublishable key（anon）で行う。
const NO_LOGIN_SESSION={
  user:{id:'no-login',email:'ログイン不要'},
  access_token:null,
  refresh_token:null
};

supabaseClient.auth.getSession=async()=>({data:{session:NO_LOGIN_SESSION},error:null});
supabaseClient.auth.getUser=async()=>({data:{user:NO_LOGIN_SESSION.user},error:null});
supabaseClient.auth.onAuthStateChange=()=>({data:{subscription:{unsubscribe(){}}}});
supabaseClient.auth.signOut=async()=>({error:null});

// 旧コード互換。認証更新は行わず匿名キーを使う。
window.getFreshSupabaseAccessToken=async()=>SUPABASE_PUBLISHABLE_KEY;
window.invalidateExpiredSupabaseSession=async()=>null;

function loadCompanyModule(src){const s=document.createElement('script');s.src=src;s.async=false;document.head.appendChild(s);}
loadCompanyModule('nameplate-integration.js?v=20260819-0025');
loadCompanyModule('cost-master.js?v=20260819-0035');
loadCompanyModule('workforce-cost.js?v=20260819-0040');
loadCompanyModule('management-hub.js?v=20260819-0130');
// ログイン・ユーザー権限管理は使用しない。
loadCompanyModule('factory-mode.js?v=20260819-0085');
loadCompanyModule('stock-alerts.js?v=20260819-0090');
loadCompanyModule('price-link.js?v=20260819-0095');
loadCompanyModule('management-summary.js?v=20260819-0095');
loadCompanyModule('office-summary.js?v=20260819-0100');
loadCompanyModule('sales-summary.js?v=20260819-0110');
loadCompanyModule('production-summary.js?v=20260819-0110');
loadCompanyModule('materials-patch.js?v=20260819-0135');
