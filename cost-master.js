'use strict';

(function(){
  const LABELS={
    labor_direct:'直接労務費',
    labor_indirect:'間接労務費',
    process:'加工費',
    overhead:'間接経費',
    external:'外注費'
  };
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=()=>new Date().toISOString().slice(0,10);
  let items=[],rates=[];

  function latestRate(id){
    return rates.filter(r=>String(r.cost_item_id)===String(id))
      .sort((a,b)=>(b.effective_from||'').localeCompare(a.effective_from||'')||Number(b.id)-Number(a.id))[0]||null;
  }

  function build(){
    if($('costMasterCard')) return;
    const settings=$('screen-settings');
    if(!settings) return;

    const card=document.createElement('div');
    card.className='card';
    card.id='costMasterCard';
    card.innerHTML=`
      <div class="card-title">原価マスター</div>
      <div class="card-sub" style="margin-bottom:12px;">工場作業者・事務員・加工費など、会社全体で使う基準原価を管理します。単価は履歴として残ります。</div>
      <div id="costMasterList"></div>
      <div class="card-title" style="margin-top:18px;">原価項目を追加</div>
      <div class="row2">
        <div class="field"><label>分類</label><select id="costNewCategory"><option value="labor_direct">直接労務費</option><option value="labor_indirect">間接労務費</option><option value="process">加工費</option><option value="overhead">間接経費</option><option value="external">外注費</option></select></div>
        <div class="field"><label>項目名</label><input id="costNewName" placeholder="例）レーザー加工"></div>
      </div>
      <div class="row2">
        <div class="field"><label>単位</label><select id="costNewUnit"><option>円/時間</option><option>円/分</option><option>円/個</option><option>円/枚</option><option>円/回</option><option>円</option></select></div>
        <div class="field"><label>初期単価</label><input id="costNewRate" type="number" step="any" placeholder="0"></div>
      </div>
      <div class="field"><label>適用開始日</label><input id="costNewDate" type="date"></div>
      <button class="btn btn-primary btn-block" id="costAddBtn">原価項目を追加</button>
    `;
    settings.insertBefore(card,settings.firstChild);
    $('costNewDate').value=today();
    $('costAddBtn').addEventListener('click',addItem);
  }

  async function load(){
    if(!window.supabaseClient) return;
    const {data:{session}}=await supabaseClient.auth.getSession();
    if(!session) return;
    const [a,b]=await Promise.all([
      supabaseClient.from('cost_items').select('*').eq('active',true).order('category').order('name'),
      supabaseClient.from('cost_rate_history').select('*').order('effective_from',{ascending:false})
    ]);
    if(a.error||b.error){console.error(a.error||b.error);return;}
    items=a.data||[];rates=b.data||[];render();
  }

  function render(){
    const box=$('costMasterList'); if(!box) return;
    box.innerHTML=items.length?items.map(item=>{
      const r=latestRate(item.id);
      return `<div class="settings-row" style="align-items:flex-end;gap:10px;">
        <div style="flex:1;min-width:0;">
          <div class="t">${esc(item.name)}</div>
          <div class="d">${esc(LABELS[item.category]||item.category)} / ${esc(item.unit)}${r?` / 現在 ${Number(r.rate).toLocaleString('ja-JP')}円（${esc(r.effective_from)}〜）`:' / 単価未設定'}</div>
        </div>
        <div style="width:132px;">
          <input type="number" step="any" id="costRate_${item.id}" placeholder="新単価" style="width:100%;margin-bottom:6px;">
          <input type="date" id="costDate_${item.id}" value="${today()}" style="width:100%;margin-bottom:6px;">
          <button class="btn btn-secondary btn-sm" data-cost-save="${item.id}" style="width:100%;">単価更新</button>
        </div>
      </div>`;
    }).join(''):'<div class="info-box">まだ原価項目がありません</div>';
    box.querySelectorAll('[data-cost-save]').forEach(btn=>btn.addEventListener('click',()=>saveRate(btn.dataset.costSave)));
  }

  async function saveRate(id){
    const rate=Number($(`costRate_${id}`).value);
    const date=$(`costDate_${id}`).value||today();
    if(!Number.isFinite(rate)||rate<0){alert('新しい単価を入力してください');return;}
    const {error}=await supabaseClient.from('cost_rate_history').upsert({cost_item_id:Number(id),effective_from:date,rate},{onConflict:'cost_item_id,effective_from'});
    if(error){console.error(error);alert('単価更新に失敗しました');return;}
    alert('原価単価を更新しました');
    await load();
  }

  async function addItem(){
    const category=$('costNewCategory').value;
    const name=$('costNewName').value.trim();
    const unit=$('costNewUnit').value;
    const rate=Number($('costNewRate').value);
    const date=$('costNewDate').value||today();
    if(!name){alert('項目名を入力してください');return;}
    const {data,error}=await supabaseClient.from('cost_items').insert({category,name,unit}).select().single();
    if(error){console.error(error);alert('原価項目の追加に失敗しました');return;}
    if(Number.isFinite(rate)&&rate>=0&&$('costNewRate').value!==''){
      const rr=await supabaseClient.from('cost_rate_history').insert({cost_item_id:data.id,effective_from:date,rate});
      if(rr.error) console.error(rr.error);
    }
    $('costNewName').value='';$('costNewRate').value='';
    alert('原価項目を追加しました');
    await load();
  }

  function start(){
    if(!window.supabaseClient||!$('screen-settings')){setTimeout(start,100);return;}
    build();
    load();
    document.querySelectorAll('.tab-btn[data-goto="settings"]').forEach(b=>b.addEventListener('click',()=>setTimeout(load,0)));
  }
  start();
})();
