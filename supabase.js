'use strict';

const SUPABASE_URL = 'https://vnnvuxccazkdzwqjmntz.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xG-tuBgxFGntT1vlbZzuVQ_AZ2Zl8QL';
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
window.supabaseClient=supabaseClient;
window.companySecureAuthMode=true;
window.getFreshSupabaseAccessToken=async()=>{const s=await window.securityRequireSession('vnnvuxccazkdzwqjmntz');return s.access_token;};
window.invalidateExpiredSupabaseSession=async()=>supabaseClient.auth.signOut();
function loadCompanyModule(src){
  const s=document.createElement('script');
  s.src=src;
  s.async=false;
  document.head.appendChild(s);
}

// 見積画面で実際に必要なものだけ起動時に読み込む。
// iPhone Safari で時間経過後に白画面化する症状が出たため、
// 管理・材料・集計系の会社モジュールはこの画面では自動読込しない。
loadCompanyModule('nameplate-integration.js?v=20260901-stable1');
loadCompanyModule('quote-manufacturing-details.js?v=20260822-1035');

// 他画面から明示的に必要になった場合だけ呼べるよう入口は残す。
window.loadOptionalCompanyModules = function(){
  if (window.__optionalCompanyModulesLoaded) return;
  window.__optionalCompanyModulesLoaded = true;
  [
    'cost-master.js?v=20260819-0035',
    'workforce-cost.js?v=20260819-0040',
    'management-hub.js?v=20260819-0130',
    'factory-mode.js?v=20260819-0085',
    'stock-alerts.js?v=20260819-0090',
    'price-link.js?v=20260819-0095',
    'management-summary.js?v=20260819-0095',
    'office-summary.js?v=20260819-0100',
    'sales-summary.js?v=20260819-0110',
    'production-summary.js?v=20260819-0110',
    'materials-patch.js?v=20260819-0135',
    'material-auth-stop.js?v=20260821-0405',
    'material-unit-fix.js?v=20260821-0826',
    'material-delete.js?v=20260821-0802'
  ].forEach(loadCompanyModule);
};
