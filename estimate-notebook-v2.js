'use strict';

(function(){
  const $ = id => document.getElementById(id);
  let options = [];
  let lastLoadedEditId = null;

  function addStyles(){
    const s=document.createElement('style');
    s.textContent=`
      .quote-v2{margin:14px 0;padding:14px;border:2px solid #d8dde3;border-radius:14px;background:#fff}
      .quote-v2-title{font-weight:900;font-size:17px;margin-bottom:5px}.quote-v2-sub{font-size:12px;color:#68707a;margin-bottom:10px}
      .quote-option{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;margin:8px 0;padding:9px;background:#f5f7f9;border-radius:10px}
      .quote-option label{font-size:11px;font-weight:700}.quote-option input{width:100%;box-sizing:border-box;padding:9px;border:1px solid #cbd1d8;border-radius:8px}
      .quote-remove{border:0;background:#eee;border-radius:8px;padding:10px}.quote-add{width:100%;padding:10px;border:1px dashed #8b949e;background:#fff;border-radius:9px;font-weight:700}
      .result-v2{display:block;margin-top:14px;padding-top:14px;border-top:2px solid #ddd}.result-v2 .field{margin-bottom:10px}
      .won-option{outline:3px solid #ff8fb3;background:#fff1f6}.lost-panel{border-left:5px solid #72b884;padding-left:10px}
      .v2-total{font-size:11px;color:#6b7280;margin-top:3px}
      .notebook-v2{margin:12px 0 10px;border-top:1px solid #d9dde3;padding-top:10px}
      .notebook-v2-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px;font-size:12px;font-weight:900;color:#535b66}
      .notebook-v2-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;align-items:center;padding:7px 8px;margin:4px 0;border-radius:8px;background:#f5f6f7;font-size:12px}
      .notebook-v2-row .q{font-weight:900}.notebook-v2-row .p{text-align:right}.notebook-v2-row .a{text-align:right;color:#68707a}
      .notebook-v2-row.won{background:#ffd9e6;box-shadow:inset 5px 0 0 #ff4f88;font-weight:900}
      .notebook-v2-result{margin-top:8px;padding:9px 10px;border-radius:9px;font-size:12px;line-height:1.7}
      .notebook-v2-result.won{background:#fff0f5;border-left:5px solid #ff4f88}.notebook-v2-result.lost{background:#eef9f1;border-left:5px solid #52a96b}.notebook-v2-result.pending{background:#f2f4f6;border-left:5px solid #9aa1aa}
      .notebook-v2-result strong{font-size:13px}.notebook-v2-reason{font-weight:900}.notebook-v2-date{color:#68707a;margin-left:8px}
      .followup-alert{margin-top:8px;padding:8px 10px;border-radius:9px;font-size:12px;font-weight:900}
      .followup-alert.d7{background:#fff7d8;border-left:5px solid #e7b416;color:#725600}
      .followup-alert.d14{background:#ffe5ce;border-left:5px solid #f08b32;color:#7a3b00}
      .followup-alert.d30{background:#ffe0e0;border-left:5px solid #d94343;color:#7e1717}
      .followup-alert.fresh{background:#eef2f5;border-left:5px solid #98a2ad;color:#58616b;font-weight:700}
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
    options=[{quantity:'',unitPrice:''}]; renderOptions(); syncResult();

    const form=$('orderForm');
    form.addEventListener('submit',async()=>{
      const valid=options.filter(x=>Number(x.quantity)>0 && Number(x.unitPrice)>=0);
      if(valid.length){amount.value=Number(valid[0].quantity)*Number(valid[0].unitPrice);$('f_quantity').value=valid[0].quantity;}
      if(result) result.value=$('v2_result').value;
      const context={editingId:(window.state&&state.editingId)?String(state.editingId):null,company:$('f_company').value.trim(),orderDate:$('f_orderDate').value,itemName:$('f_itemName').value.trim(),orderNumber:$('f_orderNumber').value.trim()};
      setTimeout(()=>saveForEstimate(context),850);
    },true);

    const titleObs=new MutationObserver(()=>{
      if(window.state && state.editingId && String(state.editingId)!==lastLoadedEditId){lastLoadedEditId=String(state.editingId);loadForEstimate(state.editingId);}
      if(!window.state || !state.editingId) lastLoadedEditId=null;
    });
    titleObs.observe($('formCardTitle'),{childList:true,subtree:true});
    ['recentList','searchResults'].forEach(id=>{const el=$(id);if(!el)return;new MutationObserver(()=>scheduleDecorate(el)).observe(el,{childList:true,subtree:true});scheduleDecorate(el);});
  }

  function renderOptions(){
    const list=$('quoteOptionList'); if(!list)return;
    list.innerHTML=options.map((o,i)=>`<div class="quote-option" data-i="${i}"><div><label>数量</label><input type="number" min="1" step="1" value="${o.quantity||''}" data-q="${i}" placeholder="例 100"><div class="v2-total">${o.quantity&&o.unitPrice?'合計 '+fmt(Number(o.quantity)*Number(o.unitPrice))+'円':''}</div></div><div><label>単価（円）</label><input type="number" min="0" step="1" value="${o.unitPrice||''}" data-p="${i}" placeholder="例 240"></div><button type="button" class="quote-remove" data-r="${i}">×</button></div>`).join('');
    list.querySelectorAll('[data-q]').forEach(el=>el.oninput=()=>{options[+el.dataset.q].quantity=el.value;renderOptions();});
    list.querySelectorAll('[data-p]').forEach(el=>el.oninput=()=>{options[+el.dataset.p].unitPrice=el.value;renderOptions();});
    list.querySelectorAll('[data-r]').forEach(el=>el.onclick=()=>{if(options.length>1){options.splice(+el.dataset.r,1);renderOptions();}});refreshWon();
  }
  function refreshWon(){const sel=$('v2_wonOption');if(!sel)return;const old=sel.value;sel.innerHTML='<option value="">選択してください</option>'+options.map((o,i)=>o.quantity?`<option value="${i}">${o.quantity}枚 / @${fmt(o.unitPrice||0)}円</option>`:'').join('');sel.value=old;markWonOption();sel.onchange=markWonOption;}
  function markWonOption(){document.querySelectorAll('.quote-option').forEach(x=>x.classList.remove('won-option'));if($('v2_result').value!=='won')return;const i=$('v2_wonOption').value;if(i!=='')document.querySelector(`.quote-option[data-i="${i}"]`)?.classList.add('won-option');}
  function syncResult(){const v=$('v2_result').value;$('wonFields').style.display=v==='won'?'':'none';$('lostFields').style.display=v==='lost'?'':'none';markWonOption();}
  async function findSavedEstimateId(context){if(context.editingId)return context.editingId;let q=supabaseClient.from('estimates').select('id').eq('company_name',context.company).eq('estimate_date',context.orderDate);if(context.orderNumber)q=q.eq('estimate_number',context.orderNumber);if(context.itemName)q=q.eq('product_name',context.itemName);const{data}=await q.order('created_at',{ascending:false}).limit(1).maybeSingle();return data&&data.id?String(data.id):null;}
  async function saveForEstimate(context){
    if(!window.supabaseClient)return;const id=await findSavedEstimateId(context);if(!id)return;
    const valid=options.filter(x=>Number(x.quantity)>0);const selected=$('v2_result').value==='won'?$('v2_wonOption').value:'';const wonSourceIndex=selected===''?-1:Number(selected);const selectedObject=wonSourceIndex>=0?options[wonSourceIndex]:null;
    await supabaseClient.from('estimate_quantity_options').delete().eq('estimate_id',Number(id));
    if(valid.length)await supabaseClient.from('estimate_quantity_options').insert(valid.map((o,i)=>({estimate_id:Number(id),quantity:Number(o.quantity),unit_price:Number(o.unitPrice)||0,amount:Number(o.quantity)*(Number(o.unitPrice)||0),sort_order:i,is_won:!!(selectedObject&&Number(o.quantity)===Number(selectedObject.quantity)&&Number(o.unitPrice||0)===Number(selectedObject.unitPrice||0))})));
    await supabaseClient.from('estimates').update({won_quantity:selectedObject?Number(selectedObject.quantity):null,won_unit_price:selectedObject?Number(selectedObject.unitPrice):null,result_date:$('v2_resultDate').value||null,lost_reason:$('v2_result').value==='lost'?($('v2_lostReason').value||null):null,result_note:$('v2_resultNote').value||null}).eq('id',Number(id));
    setTimeout(()=>{scheduleDecorate($('recentList'));scheduleDecorate($('searchResults'));},300);
  }
  async function loadForEstimate(id){
    if(!id||!window.supabaseClient)return;
    const[{data:rows},{data:e}]=await Promise.all([supabaseClient.from('estimate_quantity_options').select('*').eq('estimate_id',Number(id)).order('sort_order'),supabaseClient.from('estimates').select('status,won_quantity,won_unit_price,result_date,lost_reason,result_note').eq('id',Number(id)).maybeSingle()]);
    options=(rows&&rows.length)?rows.map(r=>({quantity:r.quantity,unitPrice:r.unit_price,isWon:r.is_won})):[{quantity:$('f_quantity').value||'',unitPrice:$('f_quantity').value?Math.round(Number($('f_amount').value||0)/Number($('f_quantity').value)):''}];renderOptions();
    const map={'受注':'won','失注':'lost','回答待ち':'pending'};$('v2_result').value=map[e&&e.status]||'pending';$('v2_resultDate').value=e&&e.result_date||'';$('v2_lostReason').value=e&&e.lost_reason||'';$('v2_resultNote').value=e&&e.result_note||'';if(rows){const wi=rows.findIndex(r=>r.is_won);if(wi>=0)$('v2_wonOption').value=String(wi);}syncResult();
  }

  let decorateTimer=null;
  function scheduleDecorate(container){if(!container)return;clearTimeout(decorateTimer);decorateTimer=setTimeout(()=>decorateCards(container),120);}
  async function decorateCards(container){
    if(!window.supabaseClient||!container)return;
    const cards=[...container.querySelectorAll('.order-card')].filter(c=>!c.dataset.notebookV2);if(!cards.length)return;
    const ids=cards.map(c=>Number(c.dataset.id)).filter(Boolean);if(!ids.length)return;
    const[{data:rows},{data:estimates}]=await Promise.all([supabaseClient.from('estimate_quantity_options').select('*').in('estimate_id',ids).order('sort_order'),supabaseClient.from('estimates').select('id,status,estimate_date,won_quantity,won_unit_price,result_date,lost_reason,result_note').in('id',ids)]);
    const byId={};(rows||[]).forEach(r=>(byId[r.estimate_id]||(byId[r.estimate_id]=[])).push(r));const eById={};(estimates||[]).forEach(e=>eById[e.id]=e);
    cards.forEach(card=>{
      const id=Number(card.dataset.id),qs=byId[id]||[],e=eById[id]||{};const actions=card.querySelector('.actions');const wrap=document.createElement('div');wrap.className='notebook-v2';
      let html='<div class="notebook-v2-head"><span>数量別 見積単価</span><span>結果記録</span></div>';
      if(qs.length)html+=qs.map(q=>`<div class="notebook-v2-row ${q.is_won?'won':''}"><span class="q">${fmt(q.quantity)}枚${q.is_won?'　受注':''}</span><span class="p">@${fmt(q.unit_price)}円</span><span class="a">${fmt(q.amount)}円</span></div>`).join('');else html+='<div class="notebook-v2-row"><span class="q">数量別価格 未登録</span><span></span><span></span></div>';
      const st=e.status==='受注'?'won':e.status==='失注'?'lost':'pending';
      if(st==='won')html+=`<div class="notebook-v2-result won"><strong>受注</strong>${e.won_quantity?`　${fmt(e.won_quantity)}枚 / @${fmt(e.won_unit_price)}円`:''}${e.result_date?`<span class="notebook-v2-date">${fmtDate(e.result_date)}</span>`:''}${e.result_note?`<br>${esc(e.result_note)}`:''}</div>`;
      else if(st==='lost')html+=`<div class="notebook-v2-result lost"><strong>失注</strong>${e.lost_reason?`　<span class="notebook-v2-reason">${esc(e.lost_reason)}</span>`:''}${e.result_date?`<span class="notebook-v2-date">${fmtDate(e.result_date)}</span>`:''}${e.result_note?`<br>${esc(e.result_note)}`:''}</div>`;
      else{const days=daysSince(e.estimate_date);html+='<div class="notebook-v2-result pending"><strong>回答待ち</strong></div>'+followupHtml(days);}
      wrap.innerHTML=html;if(actions)card.insertBefore(wrap,actions);else card.appendChild(wrap);card.dataset.notebookV2='1';
    });
  }
  function daysSince(iso){if(!iso)return 0;const d=new Date(iso+'T00:00:00');const now=new Date();now.setHours(0,0,0,0);return Math.max(0,Math.floor((now-d)/86400000));}
  function followupHtml(days){if(days>=30)return `<div class="followup-alert d30">⚠ ${days}日経過　至急、結果確認</div>`;if(days>=14)return `<div class="followup-alert d14">⚠ ${days}日経過　結果確認してください</div>`;if(days>=7)return `<div class="followup-alert d7">${days}日経過　そろそろ結果確認</div>`;return `<div class="followup-alert fresh">見積提出から ${days}日</div>`;}
  function fmt(v){return Number(v||0).toLocaleString('ja-JP');}
  function fmtDate(v){if(!v)return'';const a=v.split('-');return `${a[0]}/${a[1]}/${a[2]}`;}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  addStyles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();