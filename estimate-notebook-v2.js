'use strict';

(function(){
  const $=id=>document.getElementById(id);
  let options=[];
  let loadingId=null;

  function today(){const d=new Date();const z=d.getTimezoneOffset();return new Date(d.getTime()-z*60000).toISOString().slice(0,10);}
  function addStyles(){
    const s=document.createElement('style');
    s.textContent=`
      .quote-v2{margin:14px 0;padding:14px;border:2px solid #d8dde3;border-radius:14px;background:#fff}
      .quote-v2-title{font-weight:900;font-size:17px;margin-bottom:5px}.quote-v2-sub{font-size:12px;color:#68707a;margin-bottom:10px}
      .quote-option{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;margin:8px 0;padding:10px;background:#f5f7f9;border-radius:10px;transition:.15s}
      .quote-option label{font-size:11px;font-weight:700}.quote-option input{width:100%;box-sizing:border-box;padding:10px;border:1px solid #cbd1d8;border-radius:8px;font-size:16px}
      .quote-option.is-won{background:#fff0f5;box-shadow:inset 5px 0 #ff5b8d}.quote-option.is-lost{background:#f0fff5;box-shadow:inset 5px 0 #63b780}
      .quote-remove{border:0;background:#eee;border-radius:8px;padding:11px}.quote-add{width:100%;padding:11px;border:1px dashed #8b949e;background:#fff;border-radius:9px;font-weight:800}
      .result-v2{display:block;margin-top:14px;padding-top:14px;border-top:1px solid #ddd}.result-v2 .field{margin-bottom:10px}
      .won-panel{border-left:5px solid #ff5b8d;padding:10px;background:#fff7fa;border-radius:8px}.lost-panel{border-left:5px solid #63b780;padding:10px;background:#f6fff9;border-radius:8px}
      .v2-result-note{font-size:12px;margin:-3px 0 10px;color:#68707a}.v2-status{font-size:12px;font-weight:700;margin-top:8px;min-height:18px}
      .v2-row-total{font-size:11px;color:#59616b;margin-top:4px}
    `;
    document.head.appendChild(s);
  }

  function mount(){
    const amount=$('f_amount'); if(!amount||$('quoteV2'))return;
    const legacyRow=amount.closest('.row2'); if(legacyRow)legacyRow.style.display='none';
    const legacyResult=$('f_result'); if(legacyResult)legacyResult.closest('.field').style.display='none';

    const box=document.createElement('div');box.className='quote-v2';box.id='quoteV2';
    box.innerHTML=`
      <div class="quote-v2-title">数量別の見積単価</div>
      <div class="quote-v2-sub">100枚・200枚・300枚など、提示した条件を全部残します。</div>
      <div id="quoteOptionList"></div>
      <button type="button" class="quote-add" id="quoteAdd">＋ 数量パターンを追加</button>
      <div class="result-v2" id="resultV2">
        <div class="quote-v2-title">その後どうなったか</div>
        <div class="v2-result-note">紙のノートのピンク＝受注、緑＝失注にあたる部分です。</div>
        <div class="field"><label>結果</label><select id="v2_result"><option value="pending">回答待ち</option><option value="won">受注</option><option value="lost">失注</option></select></div>
        <div id="wonFields" class="won-panel" style="display:none"><div class="field"><label>どの数量で受注したか</label><select id="v2_wonOption"><option value="">選択してください</option></select></div></div>
        <div id="lostFields" class="lost-panel" style="display:none"><div class="field"><label>失注理由</label><select id="v2_lostReason"><option value="">選択してください</option><option>価格が高かった</option><option>納期が合わなかった</option><option>他社に決定</option><option>仕様変更・案件中止</option><option>理由不明</option><option>その他</option></select></div></div>
        <div class="field"><label>結果確認日</label><input type="date" id="v2_resultDate"></div>
        <div class="field"><label>結果・失注理由メモ</label><textarea id="v2_resultNote" placeholder="例）他社より単価が高かった。次回は価格再検討。"></textarea></div>
        <div class="v2-status" id="v2Status"></div>
      </div>`;
    legacyRow.parentNode.insertBefore(box,legacyRow);

    $('quoteAdd').onclick=()=>{options.push({quantity:'',unitPrice:''});renderOptions();};
    $('v2_result').onchange=syncResult;
    $('v2_wonOption').onchange=renderOptions;
    options=[{quantity:'',unitPrice:''}];renderOptions();syncResult();

    const form=$('orderForm');
    form.addEventListener('submit',()=>{
      const snapshot={
        editingId:(window.state&&state.editingId)?Number(state.editingId):null,
        company:$('f_company').value.trim(),date:$('f_orderDate').value,item:$('f_itemName').value.trim(),
        opts:options.map(x=>({quantity:x.quantity,unitPrice:x.unitPrice})),result:$('v2_result').value,
        wonIndex:$('v2_wonOption').value,lostReason:$('v2_lostReason').value,resultDate:$('v2_resultDate').value,resultNote:$('v2_resultNote').value
      };
      const valid=snapshot.opts.filter(x=>Number(x.quantity)>0&&Number(x.unitPrice)>=0);
      if(valid.length){amount.value=Number(valid[0].quantity)*Number(valid[0].unitPrice);$('f_quantity').value=valid[0].quantity;}
      if(legacyResult)legacyResult.value=snapshot.result;
      $('v2Status').textContent='保存中…';
      setTimeout(()=>saveSnapshot(snapshot),900);
    },true);

    const obs=new MutationObserver(()=>{
      const id=(window.state&&state.editingId)?Number(state.editingId):null;
      if(id&&id!==loadingId)loadForEstimate(id);
      if(!id&&$('formCardTitle').textContent.includes('新規'))resetV2();
    });
    obs.observe($('formCardTitle'),{childList:true,subtree:true});
  }

  function renderOptions(){
    const list=$('quoteOptionList');if(!list)return;
    const won=Number($('v2_wonOption')&&$('v2_wonOption').value);
    const result=$('v2_result')?$('v2_result').value:'pending';
    list.innerHTML=options.map((o,i)=>{
      const total=(Number(o.quantity)||0)*(Number(o.unitPrice)||0);
      const cls=result==='won'&&String(i)===String(won)?' is-won':'';
      return `<div class="quote-option${cls}" data-i="${i}"><div><label>数量</label><input type="number" min="1" step="1" value="${o.quantity||''}" data-q="${i}" placeholder="例 100"><div class="v2-row-total">${o.quantity?'枚':''}</div></div><div><label>単価（円）</label><input type="number" min="0" step="1" value="${o.unitPrice||''}" data-p="${i}" placeholder="例 240"><div class="v2-row-total">${total?'合計 '+total.toLocaleString()+'円':''}</div></div><button type="button" class="quote-remove" data-r="${i}">×</button></div>`;
    }).join('');
    list.querySelectorAll('[data-q]').forEach(el=>el.oninput=()=>{options[+el.dataset.q].quantity=el.value;refreshWon();renderOptions();});
    list.querySelectorAll('[data-p]').forEach(el=>el.oninput=()=>{options[+el.dataset.p].unitPrice=el.value;refreshWon();renderOptions();});
    list.querySelectorAll('[data-r]').forEach(el=>el.onclick=()=>{if(options.length>1){options.splice(+el.dataset.r,1);renderOptions();refreshWon();}});
    refreshWon(false);
  }

  function refreshWon(preserve=true){
    const sel=$('v2_wonOption');if(!sel)return;
    const old=preserve?sel.value:'';
    sel.innerHTML='<option value="">選択してください</option>'+options.map((o,i)=>o.quantity?`<option value="${i}">${Number(o.quantity).toLocaleString()}枚　@${Number(o.unitPrice||0).toLocaleString()}円</option>`:'').join('');
    if(old!==''&&sel.querySelector(`option[value="${old}"]`))sel.value=old;
  }

  function syncResult(){
    const v=$('v2_result').value;$('wonFields').style.display=v==='won'?'':'none';$('lostFields').style.display=v==='lost'?'':'none';
    if(v!=='won')$('v2_wonOption').value='';
    if(v!=='lost')$('v2_lostReason').value='';
    if(v!=='pending'&&!$('v2_resultDate').value)$('v2_resultDate').value=today();
    renderOptions();
  }

  async function resolveEstimateId(s){
    if(s.editingId)return s.editingId;
    let q=supabaseClient.from('estimates').select('id,created_at').eq('company_name',s.company).eq('estimate_date',s.date).order('created_at',{ascending:false}).limit(5);
    if(s.item)q=q.eq('product_name',s.item);
    const {data,error}=await q;if(error)throw error;return data&&data[0]?Number(data[0].id):null;
  }

  async function saveSnapshot(s){
    try{
      const id=await resolveEstimateId(s);if(!id)throw new Error('登録した見積IDを確認できませんでした');
      const valid=s.opts.filter(x=>Number(x.quantity)>0);
      const selected=s.wonIndex===''?-1:Number(s.wonIndex);
      await supabaseClient.from('estimate_quantity_options').delete().eq('estimate_id',id);
      if(valid.length){
        const rows=valid.map((o,i)=>({estimate_id:id,quantity:Number(o.quantity),unit_price:Number(o.unitPrice)||0,amount:Number(o.quantity)*(Number(o.unitPrice)||0),sort_order:i,is_won:s.result==='won'&&i===selected}));
        const {error}=await supabaseClient.from('estimate_quantity_options').insert(rows);if(error)throw error;
      }
      const won=s.result==='won'&&selected>=0?s.opts[selected]:null;
      const {error}=await supabaseClient.from('estimates').update({won_quantity:won?Number(won.quantity):null,won_unit_price:won?Number(won.unitPrice):null,result_date:s.resultDate||null,lost_reason:s.result==='lost'?(s.lostReason||null):null,result_note:s.resultNote||null}).eq('id',id);if(error)throw error;
      $('v2Status').textContent='✓ 数量別単価と結果を保存しました';
    }catch(e){console.error(e);$('v2Status').textContent='⚠ 数量別単価・結果の保存に失敗しました';}
  }

  async function loadForEstimate(id){
    if(!id||!window.supabaseClient)return;loadingId=id;
    try{
      const [{data:rows},{data:e}]=await Promise.all([
        supabaseClient.from('estimate_quantity_options').select('*').eq('estimate_id',id).order('sort_order'),
        supabaseClient.from('estimates').select('status,quantity,amount,won_quantity,won_unit_price,result_date,lost_reason,result_note').eq('id',id).maybeSingle()
      ]);
      options=(rows&&rows.length)?rows.map(r=>({quantity:r.quantity,unitPrice:r.unit_price,isWon:r.is_won})):[{quantity:e&&e.quantity||'',unitPrice:e&&e.quantity?Math.round(Number(e.amount||0)/Number(e.quantity)):''}];
      renderOptions();refreshWon(false);
      const map={'受注':'won','失注':'lost','回答待ち':'pending'};$('v2_result').value=map[e&&e.status]||'pending';
      $('v2_resultDate').value=e&&e.result_date||'';$('v2_lostReason').value=e&&e.lost_reason||'';$('v2_resultNote').value=e&&e.result_note||'';
      if(rows){const wi=rows.findIndex(r=>r.is_won);if(wi>=0)$('v2_wonOption').value=String(wi);}syncResult();$('v2Status').textContent='';
    }finally{loadingId=null;}
  }

  function resetV2(){options=[{quantity:'',unitPrice:''}];renderOptions();$('v2_result').value='pending';$('v2_wonOption').value='';$('v2_lostReason').value='';$('v2_resultDate').value='';$('v2_resultNote').value='';$('v2Status').textContent='';syncResult();}

  addStyles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();