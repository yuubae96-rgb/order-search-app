'use strict';

(function(){
  const $ = id => document.getElementById(id);
  let options = [];

  function addStyles(){
    const s=document.createElement('style');
    s.textContent=`
      .quote-v2{margin:14px 0;padding:14px;border:2px solid #d8dde3;border-radius:14px;background:#fff}
      .quote-v2-title{font-weight:900;font-size:17px;margin-bottom:5px}.quote-v2-sub{font-size:12px;color:#68707a;margin-bottom:10px}
      .quote-option{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;margin:8px 0;padding:9px;background:#f5f7f9;border-radius:10px}
      .quote-option label{font-size:11px;font-weight:700}.quote-option input{width:100%;box-sizing:border-box;padding:9px;border:1px solid #cbd1d8;border-radius:8px}
      .quote-remove{border:0;background:#eee;border-radius:8px;padding:10px}.quote-add{width:100%;padding:10px;border:1px dashed #8b949e;background:#fff;border-radius:9px;font-weight:700}
      .result-v2{display:none;margin-top:12px;padding-top:12px;border-top:1px solid #ddd}.result-v2.show{display:block}
      .result-v2 .field{margin-bottom:10px}.won-option{outline:3px solid #ff8fb3;background:#fff1f6}.lost-panel{border-left:5px solid #72b884;padding-left:10px}
    `;
    document.head.appendChild(s);
  }

  function mount(){
    const amount=$('f_amount'); if(!amount) return;
    const row=amount.closest('.row2');
    if(row) row.style.display='none';
    const result=$('f_result'); if(result) result.closest('.field').style.display='none';

    const box=document.createElement('div'); box.className='quote-v2'; box.id='quoteV2';
    box.innerHTML=`<div class="quote-v2-title">数量別の見積単価</div><div class="quote-v2-sub">お客様へ提示した数量・単価をすべて残します。</div><div id="quoteOptionList"></div><button type="button" class="quote-add" id="quoteAdd">＋ 数量パターンを追加</button>
      <div class="result-v2" id="resultV2"><div class="quote-v2-title">見積結果</div>
      <div class="field"><label>結果</label><select id="v2_result"><option value="pending">回答待ち</option><option value="won">受注</option><option value="lost">失注</option></select></div>
      <div id="wonFields" style="display:none"><div class="field"><label>受注した数量</label><select id="v2_wonOption"><option value="">選択してください</option></select></div></div>
      <div id="lostFields" class="lost-panel" style="display:none"><div class="field"><label>失注理由</label><select id="v2_lostReason"><option value="">選択してください</option><option>価格が高かった</option><option>納期が合わなかった</option><option>他社に決定</option><option>仕様変更・案件中止</option><option>理由不明</option><option>その他</option></select></div></div>
      <div class="field"><label>結果確認日</label><input type="date" id="v2_resultDate"></div><div class="field"><label>結果メモ</label><textarea id="v2_resultNote" placeholder="失注理由の詳細、競合情報など"></textarea></div></div>`;
    row.parentNode.insertBefore(box,row);
    $('quoteAdd').onclick=()=>{options.push({quantity:'',unitPrice:''});renderOptions();};
    $('v2_result').onchange=syncResult;
    options=[{quantity:'',unitPrice:''}]; renderOptions();

    const form=$('orderForm');
    form.addEventListener('submit',async()=>{
      const valid=options.filter(x=>Number(x.quantity)>0 && Number(x.unitPrice)>=0);
      if(valid.length){
        amount.value=Number(valid[0].quantity)*Number(valid[0].unitPrice);
        $('f_quantity').value=valid[0].quantity;
      }
      if(result) result.value=$('v2_result').value;
      setTimeout(saveForCurrentEstimate,700);
    },true);

    const obs=new MutationObserver(()=>{
      if(window.state && state.editingId) loadForEstimate(state.editingId);
    });
    obs.observe($('formCardTitle'),{childList:true,subtree:true});
  }

  function renderOptions(){
    const list=$('quoteOptionList'); if(!list)return;
    list.innerHTML=options.map((o,i)=>`<div class="quote-option" data-i="${i}"><div><label>数量</label><input type="number" min="1" step="1" value="${o.quantity||''}" data-q="${i}" placeholder="例 100"></div><div><label>単価（円）</label><input type="number" min="0" step="1" value="${o.unitPrice||''}" data-p="${i}" placeholder="例 240"></div><button type="button" class="quote-remove" data-r="${i}">×</button></div>`).join('');
    list.querySelectorAll('[data-q]').forEach(el=>el.oninput=()=>{options[+el.dataset.q].quantity=el.value;refreshWon();});
    list.querySelectorAll('[data-p]').forEach(el=>el.oninput=()=>{options[+el.dataset.p].unitPrice=el.value;refreshWon();});
    list.querySelectorAll('[data-r]').forEach(el=>el.onclick=()=>{if(options.length>1){options.splice(+el.dataset.r,1);renderOptions();}});
    refreshWon();
  }
  function refreshWon(){
    const sel=$('v2_wonOption'); if(!sel)return;
    const old=sel.value; sel.innerHTML='<option value="">選択してください</option>'+options.map((o,i)=>o.quantity?`<option value="${i}">${o.quantity}枚 / @${Number(o.unitPrice||0).toLocaleString()}円</option>`:'').join(''); sel.value=old;
  }
  function syncResult(){
    const v=$('v2_result').value; $('resultV2').classList.add('show'); $('wonFields').style.display=v==='won'?'':'none'; $('lostFields').style.display=v==='lost'?'':'none';
  }
  async function saveForCurrentEstimate(){
    if(!window.supabaseClient) return;
    let id=(window.state&&state.editingId)?state.editingId:null;
    if(!id){const {data}=await supabaseClient.from('estimates').select('id').order('created_at',{ascending:false}).limit(1).maybeSingle();id=data&&data.id;}
    if(!id)return;
    const valid=options.filter(x=>Number(x.quantity)>0);
    const wonIndex=$('v2_result').value==='won'?Number($('v2_wonOption').value):-1;
    await supabaseClient.from('estimate_quantity_options').delete().eq('estimate_id',Number(id));
    if(valid.length) await supabaseClient.from('estimate_quantity_options').insert(valid.map((o,i)=>({estimate_id:Number(id),quantity:Number(o.quantity),unit_price:Number(o.unitPrice)||0,amount:Number(o.quantity)*(Number(o.unitPrice)||0),sort_order:i,is_won:i===wonIndex})));
    const won=wonIndex>=0&&options[wonIndex]?options[wonIndex]:null;
    await supabaseClient.from('estimates').update({won_quantity:won?Number(won.quantity):null,won_unit_price:won?Number(won.unitPrice):null,result_date:$('v2_resultDate').value||null,lost_reason:$('v2_result').value==='lost'?($('v2_lostReason').value||null):null,result_note:$('v2_resultNote').value||null}).eq('id',Number(id));
  }
  async function loadForEstimate(id){
    if(!id||!window.supabaseClient)return;
    const [{data:rows},{data:e}]=await Promise.all([supabaseClient.from('estimate_quantity_options').select('*').eq('estimate_id',Number(id)).order('sort_order'),supabaseClient.from('estimates').select('status,won_quantity,won_unit_price,result_date,lost_reason,result_note').eq('id',Number(id)).maybeSingle()]);
    options=(rows&&rows.length)?rows.map(r=>({quantity:r.quantity,unitPrice:r.unit_price,isWon:r.is_won})):[{quantity:$('f_quantity').value||'',unitPrice:$('f_quantity').value?Math.round(Number($('f_amount').value||0)/Number($('f_quantity').value)):''}]; renderOptions();
    const map={'受注':'won','失注':'lost','回答待ち':'pending'}; $('v2_result').value=map[e&&e.status]||'pending'; $('v2_resultDate').value=e&&e.result_date||''; $('v2_lostReason').value=e&&e.lost_reason||''; $('v2_resultNote').value=e&&e.result_note||'';
    if(rows){const wi=rows.findIndex(r=>r.is_won); if(wi>=0)$('v2_wonOption').value=String(wi);} syncResult();
  }
  addStyles(); if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();