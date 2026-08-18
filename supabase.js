'use strict';

const SUPABASE_URL = 'https://vnnvuxccazkdzwqjmntz.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xG-tuBgxFGntT1vlbZzuVQ_AZ2Zl8QL';
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
window.supabaseClient = supabaseClient;

function loadAppModule(src){
  const s = document.createElement('script');
  s.src = src;
  s.async = false;
  document.head.appendChild(s);
}

loadAppModule('materials-inline.js?v=20260818-2359');
loadAppModule('quote-material-link.js?v=20260818-2359');
