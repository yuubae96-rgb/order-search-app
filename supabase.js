'use strict';

const SUPABASE_URL = 'https://vnnvuxccazkdzwqjmntz.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xG-tuBgxFGntT1vlbZzuVQ_AZ2Zl8QL';
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
window.supabaseClient = supabaseClient;

function loadCompanyModule(src){
  const s=document.createElement('script');
  s.src=src;
  s.async=false;
  document.head.appendChild(s);
}

loadCompanyModule('nameplate-integration.js?v=20260819-0025');
loadCompanyModule('cost-master.js?v=20260819-0035');
loadCompanyModule('workforce-cost.js?v=20260819-0040');
loadCompanyModule('management-hub.js?v=20260819-0065');
loadCompanyModule('access-control.js?v=20260819-0070');
loadCompanyModule('user-admin.js?v=20260819-0065');
loadCompanyModule('factory-mode.js?v=20260819-0085');
