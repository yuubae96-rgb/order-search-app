'use strict';

(function installNoLoginMaterialLoader(){
  if(typeof window.supabaseClient==='undefined'||typeof loadQuoteMaterials!=='function'){
    setTimeout(installNoLoginMaterialLoader,50);
    return;
  }

  try{
    if(typeof QUOTE_MATERIAL_LOAD_TIMER!=='undefined'&&QUOTE_MATERIAL_LOAD_TIMER){
      clearTimeout(QUOTE_MATERIAL_LOAD_TIMER);
      QUOTE_MATERIAL_LOAD_TIMER=null;
    }
  }catch(_e){}

  let safeLoadPromise=null;

  loadQuoteMaterials=async function(force=false){
    const nameEl=document.getElementById('f_materialName');
    if(!nameEl||!window.supabaseClient)return;
    if(safeLoadPromise)return safeLoadPromise;
    try{
      if(!force&&typeof QUOTE_MATERIALS!=='undefined'&&QUOTE_MATERIALS.length)return;
    }catch(_e){}

    safeLoadPromise=(async()=>{
      nameEl.innerHTML='<option value="">材料マスターを読み込み中...</option>';
      nameEl.disabled=true;

      const [mr,pr]=await Promise.all([
        supabaseClient.from('materials').select('*').eq('active',true).order('name').order('spec').order('thickness_mm'),
        supabaseClient.from('material_prices').select('*').order('effective_from',{ascending:false})
      ]);

      const err=mr.error||pr.error;
      if(err){
        console.error('材料マスター読込エラー',err);
        nameEl.innerHTML='<option value="">材料マスターの読込に失敗しました</option>';
        return;
      }

      QUOTE_MATERIALS=mr.data||[];
      QUOTE_MATERIAL_PRICES=pr.data||[];
      renderMaterialPicker();
    })().catch(err=>{
      console.error('材料マスター読込例外',err);
      nameEl.innerHTML='<option value="">材料マスターの読込に失敗しました</option>';
    }).finally(()=>{safeLoadPromise=null;});

    return safeLoadPromise;
  };

  // ?secure=1 では本物のログイン画面を絶対に隠さない。
  if(window.companySecureAuthMode){
    return;
  }

  // 移行中の通常URLだけは従来どおりログイン画面を隠し、業務を止めない。
  const hideLoginUI=()=>{
    const gate=document.getElementById('authGate');
    if(gate){
      gate.classList.add('hidden');
      gate.style.display='none';
    }
    const cloudEmail=document.getElementById('cloudUserEmail');
    if(cloudEmail){
      const card=cloudEmail.closest('.card');
      if(card)card.style.display='none';
    }
  };
  hideLoginUI();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hideLoginUI);

  setTimeout(async()=>{
    hideLoginUI();
    try{
      if(typeof reloadOrders==='function')await reloadOrders();
      if(typeof renderRecentList==='function')renderRecentList();
      if(typeof renderSearchResults==='function')renderSearchResults();
      if(typeof renderSettings==='function')renderSettings();
      if(typeof gotoScreen==='function')gotoScreen('register');
      await loadQuoteMaterials(true);
    }catch(e){
      console.error('ログイン不要モード初期化エラー',e);
    }
  },500);
})();
