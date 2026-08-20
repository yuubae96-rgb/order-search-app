'use strict';

const SUPABASE_URL = 'https://vnnvuxccazkdzwqjmntz.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xG-tuBgxFGntT1vlbZzuVQ_AZ2Zl8QL';

let supabaseClient = null;
let AUTH_REFRESH_PROMISE = null;

async function getFreshAccessToken(){
  if(!supabaseClient) return null;
  if(!AUTH_REFRESH_PROMISE){
    AUTH_REFRESH_PROMISE = (async ()=>{
      const { data, error } = await supabaseClient.auth.refreshSession();
      if(error || !data?.session?.access_token) return null;
      return data.session.access_token;
    })().finally(()=>{ AUTH_REFRESH_PROMISE = null; });
  }
  return AUTH_REFRESH_PROMISE;
}

async function resilientSupabaseFetch(input, init={}){
  const response = await fetch(input, init);
  const url = typeof input === 'string' ? input : (input?.url || '');
  if(response.status !== 401 || !url.startsWith(SUPABASE_URL + '/rest/v1/')) return response;

  const freshToken = await getFreshAccessToken();
  if(!freshToken) return response;

  const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
  headers.set('Authorization', `Bearer ${freshToken}`);
  return fetch(input, { ...init, headers });
}

supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      fetch: resilientSupabaseFetch
    }
  }
);
window.supabaseClient = supabaseClient;
window.getFreshSupabaseAccessToken = getFreshAccessToken;

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
