'use strict';

(function installMaterialAuthStop(){
  if(typeof window.supabaseClient==='undefined' || typeof loadQuoteMaterials!=='function'){
    setTimeout(installMaterialAuthStop,50);
    return;
  }

  try{
    if(typeof QUOTE_MATERIAL_LOAD_TIMER!=='undefined' && QUOTE_MATERIAL_LOAD_TIMER){
      clearTimeout(QUOTE_MATERIAL_LOAD_TIMER);
      QUOTE_MATERIAL_LOAD_TIMER=null;
    }
  }catch(_e){}

  let safeLoadPromise=null;

  loadQuoteMaterials=async function(force=false){
    const nameEl=document.getElementById('f_materialName');
    if(!nameEl || !window.supabaseClient) return;
    if(safeLoadPromise) return safeLoadPromise;
    try{
      if(!force && typeof QUOTE_MATERIALS!=='undefined' && QUOTE_MATERIALS.length) return;
    }catch(_e){}

    safeLoadPromise=(async()=>{
      nameEl.innerHTML='<option value="">材料マスターを読み込み中...</option>';
      nameEl.disabled=true;

      // getSession() は端末内の古い情報も返すため、getUser() でサーバー側に有効性を確認する。
      const {data:userData,error:userError}=await supabaseClient.auth.getUser();
      if(userError || !userData?.user){
        nameEl.innerHTML='<option value="">再ログインしてください</option>';
        if(typeof window.invalidateExpiredSupabaseSession==='function'){
          await window.invalidateExpiredSupabaseSession();
        }
        return;
      }

      const [mr,pr]=await Promise.all([
        supabaseClient.from('materials').select('*').eq('active',true).order('name').order('spec').order('thickness_mm'),
        supabaseClient.from('material_prices').select('*').order('effective_from',{ascending:false})
      ]);
      const err=mr.error||pr.error;
      if(err){
        console.error('材料マスター読込エラー',err);
        if(err.status===401 || err.code==='PGRST301' || /jwt|token|unauthorized/i.test(String(err.message||''))){
          nameEl.innerHTML='<option value="">再ログインしてください</option>';
          if(typeof window.invalidateExpiredSupabaseSession==='function'){
            await window.invalidateExpiredSupabaseSession();
          }
        }else{
          nameEl.innerHTML='<option value="">材料マスターの読込に失敗しました</option>';
        }
        return;
      }

      QUOTE_MATERIALS=mr.data||[];
      QUOTE_MATERIAL_PRICES=pr.data||[];
      renderMaterialPicker();
    })().catch(async err=>{
      console.error('材料マスター読込例外',err);
      nameEl.innerHTML='<option value="">再ログインしてください</option>';
      if(typeof window.invalidateExpiredSupabaseSession==='function'){
        await window.invalidateExpiredSupabaseSession();
      }
    }).finally(()=>{safeLoadPromise=null;});

    return safeLoadPromise;
  };

  // 旧コードが予約済みの自動リトライをもう一度止める。
  setTimeout(()=>{
    try{
      if(typeof QUOTE_MATERIAL_LOAD_TIMER!=='undefined' && QUOTE_MATERIAL_LOAD_TIMER){
        clearTimeout(QUOTE_MATERIAL_LOAD_TIMER);
        QUOTE_MATERIAL_LOAD_TIMER=null;
      }
    }catch(_e){}
  },100);
})();
