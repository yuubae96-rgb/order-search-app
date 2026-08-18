'use strict';

const SUPABASE_URL = 'https://vnnvuxccazkdzwqjmntz.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xG-tuBgxFGntT1vlbZzuVQ_AZ2Zl8QL';
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
window.supabaseClient = supabaseClient;

const nameplateIntegrationScript = document.createElement('script');
nameplateIntegrationScript.src = 'nameplate-integration.js?v=20260819-0025';
nameplateIntegrationScript.async = false;
document.head.appendChild(nameplateIntegrationScript);
