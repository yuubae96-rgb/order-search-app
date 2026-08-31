'use strict';

const SUPABASE_URL = 'https://vnnvuxccazkdzwqjmntz.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xG-tuBgxFGntT1vlbZzuVQ_AZ2Zl8QL';
const SECURE_AUTH_MODE = new URLSearchParams(location.search).get('secure') === '1';

// 移行期間は通常URLを止めず、?secure=1 のときだけ本物のログインを必須にする。
// 一度本物のSupabase Authでログインした端末はセッションを保持し、通常URLでも
// その実セッションを優先して使う。未移行端末だけ従来のanon通信へフォールバックする。
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

const realAuth = {
  getSession: supabaseClient.auth.getSession.bind(supabaseClient.auth),
  getUser: supabaseClient.auth.getUser.bind(supabaseClient.auth),
  onAuthStateChange: supabaseClient.auth.onAuthStateChange.bind(supabaseClient.auth),
  signOut: supabaseClient.auth.signOut.bind(supabaseClient.auth)
};

const NO_LOGIN_SESSION = {
  user: { id: 'no-login', email: 'ログイン不要' },
  access_token: null,
  refresh_token: null
};

async function getRealSession(){
  try {
    const r = await realAuth.getSession();
    if (r?.data?.session) window.__companyRealAuthActive = true;
    return r;
  } catch (e) {
    return { data: { session: null }, error: e };
  }
}

supabaseClient.auth.getSession = async () => {
  const r = await getRealSession();
  if (r?.data?.session) return r;
  if (SECURE_AUTH_MODE) return r;
  return { data: { session: NO_LOGIN_SESSION }, error: null };
};

supabaseClient.auth.getUser = async () => {
  const s = await getRealSession();
  if (s?.data?.session) {
    const r = await realAuth.getUser();
    if (!r?.error && r?.data?.user) window.__companyRealAuthActive = true;
    return r;
  }
  if (SECURE_AUTH_MODE) return { data: { user: null }, error: null };
  return { data: { user: NO_LOGIN_SESSION.user }, error: null };
};

supabaseClient.auth.onAuthStateChange = SECURE_AUTH_MODE
  ? realAuth.onAuthStateChange
  : (() => ({ data: { subscription: { unsubscribe(){} } } }));

supabaseClient.auth.signOut = async (...args) => {
  const s = await getRealSession();
  if (s?.data?.session || SECURE_AUTH_MODE) {
    window.__companyRealAuthActive = false;
    return realAuth.signOut(...args);
  }
  return { error: null };
};

window.getFreshSupabaseAccessToken = async () => {
  const r = await getRealSession();
  return r?.data?.session?.access_token || SUPABASE_PUBLISHABLE_KEY;
};
window.invalidateExpiredSupabaseSession = async () => null;
window.companySecureAuthMode = SECURE_AUTH_MODE;

function loadCompanyModule(src){
  return new Promise(resolve=>{
    const s=document.createElement('script');
    s.src=src;
    s.async=true;
    s.onload=resolve;
    s.onerror=resolve;
    document.head.appendChild(s);
  });
}

// 起動直後は銘板見積の入口だけを読み込む。
// ここで他モジュールを同時に起動しないことで、iPhone Safariの描画競合を避ける。
loadCompanyModule('nameplate-integration.js?v=20260901-light');

const deferredCompanyModules = [
  'quote-manufacturing-details.js?v=20260822-1035',
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
];

let deferredStarted=false;
async function loadDeferredCompanyModules(){
  if(deferredStarted) return;
  deferredStarted=true;
  for(const src of deferredCompanyModules){
    await loadCompanyModule(src);
    await new Promise(r=>setTimeout(r,120));
  }
}

// 最初の数秒は見積入力と銘板自動見積にCPU・描画を譲る。
// 後続機能は一気読みせず順番に読み込む。
function scheduleDeferredCompanyModules(){
  setTimeout(loadDeferredCompanyModules,8000);
}

if(document.readyState==='complete') scheduleDeferredCompanyModules();
else window.addEventListener('load',scheduleDeferredCompanyModules,{once:true});
