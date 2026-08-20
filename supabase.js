'use strict';

const SUPABASE_URL = 'https://vnnvuxccazkdzwqjmntz.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xG-tuBgxFGntT1vlbZzuVQ_AZ2Zl8QL';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
window.supabaseClient = supabaseClient;

let INVALIDATING_SESSION = null;
async function invalidateExpiredSupabaseSession(){
  if(!INVALIDATING_SESSION){
    INVALIDATING_SESSION = (async()=>{
      try{
        await supabaseClient.auth.signOut({ scope:'local' });
      }catch(e){
        console.warn('古いログイン情報の破棄に失敗', e);
      }
      if(typeof window.showAuthGate === 'function'){
        window.showAuthGate('ログインの有効期限が切れました。もう一度ログインしてください。');
      }else if(typeof showAuthGate === 'function'){
        showAuthGate('ログインの有効期限が切れました。もう一度ログインしてください。');
      }
      return null;
    })().finally(()=>{ INVALIDATING_SESSION = null; });
  }
  return INVALIDATING_SESSION;
}

// 旧コードとの互換用。401を受けたら無効なセッションを延命せず破棄する。
window.getFreshSupabaseAccessToken = invalidateExpiredSupabaseSession;
window.invalidateExpiredSupabaseSession = invalidateExpiredSupabaseSession;

function loadCompanyModule(src){const s=document.createElement('script');s.src=src;s.async=false;document.head.appendChild(s);}
loadCompanyModule('nameplate-integration.js?v=20260819-0025');
loadCompanyModule('cost-master.js?v=20260819-0035');
loadCompanyModule('workforce-cost.js?v=20260819-0040');
loadCompanyModule('management-hub.js?v=20260819-0130');
loadCompanyModule('access-control.js?v=20260819-0070');
loadCompanyModule('user-admin.js?v=20260819-0120');
loadCompanyModule('factory-mode.js?v=20260819-0085');
loadCompanyModule('stock-alerts.js?v=20260819-0090');
loadCompanyModule('price-link.js?v=20260819-0095');
loadCompanyModule('management-summary.js?v=20260819-0095');
loadCompanyModule('office-summary.js?v=20260819-0100');
loadCompanyModule('sales-summary.js?v=20260819-0110');
loadCompanyModule('production-summary.js?v=20260819-0110');
loadCompanyModule('materials-patch.js?v=20260819-0135');
loadCompanyModule('material-auth-stop.js?v=20260821-0358');
