'use strict';
(function(){
  const $=id=>document.getElementById(id);
  let mounted=false;
  let suppliers=[];

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  function addStyles(){
    if(document.getElementById('quoteOutsourceStyle')) return;
    const s=document.createElement('style');
    s.id='quoteOutsourceStyle';
    s.textContent=`
      .outsource-wrap{margin:10px 0 12px;padding:12px;border:1px solid #d8dde3;border-radius:10px;background:#f8f9fb}
      .outsource-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
      .outsource-title{font-weight:900;font-size:13px}.outsource-checks{display:flex;gap:14px;align-items:center}
      .outsource-checks label{display:flex;align-items:center;gap:5px;font-weight:800;font-size:13px;margin:0}.outsource-checks input{width:22px;height:22px;margin:0}
      .outsource-detail{display:none;margin-top:12px}.outsource-detail.show{display:block}
      .outsource-row{display:grid;grid-template-columns:34px minmax(0,1.35fr) minmax(0,.9fr);gap:8px;align-items:end;margin-top:9px}
      .outsource-no{font-weight:900;font-size:12px;padding-bottom:13px;text-align:center}.outsource-row .field{margin:0;min-width:0}.outsource-row select,.outsource-row input{width:100%;min-width:0;box-sizing:border-box}
      .outsource-help{font-size:11px;color:#68707a;margin-top:8px}
      .outsource-master-card{margin-top:14px}.outsource-master-add{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin:10px 0}
      .outsource-master-add input{width:100%;box-sizing:border-box}.outsource-master-add button{padding:0 18px;border:0;border-radius:9px;background:#b77b31;color:white;font-weight:800}
      .outsource-master-item{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 0;border-top:1px solid #e4e7eb}
      .outsource-master-item button{border:0;background:#eee;border-radius:8px;padding:7px 10px}
      @media(max-width:420px){.outsource-row{grid-template-columns:28px minmax(0,1.2fr) minmax(0,.8fr);gap:6px}.outsource-row label{font-size:11px}.outsource-row select,.outsource-row input{font-size:16px}}
    `;
    document.head.appendChild(s);
  }

  function supplierOptions(selected=''){
    return '<option value="">外注先を選択</option>'+suppliers.map(s=>`<option value="${s.id}" ${String(s.id)===String(selected)?'selected':''}>${esc(s.name)}</option>`).join('');
  }

  function quoteRows(){
    return [0,1,2].map(i=>`<div class="outsource-row"><div class="outsource-no">${i+1}</div><div class="field"><label>外注先</label><select id="f_outsourceSupplier${i}">${supplierOptions()}</select></div><div class="field"><label>外注料（円）</label><input type="number" id="f_outsourcePrice${i}" min="0" step="1" placeholder="例 8500"></div></div>`).join('');
  }

  async function loadSuppliers(){
    if(!window.supabaseClient)return;
    const {data,error}=await supabaseClient.from('outsource_suppliers').select('id,name,active').eq('active',true).order('name');
    if(error){console.error('外注先マスター読込エラー',error);return;}
    suppliers=data||[];
    [0,1,2].forEach(i=>{
      const sel=$(`f_outsourceSupplier${i}`); if(!sel)return;
      const old=sel.value; sel.innerHTML=supplierOptions(old);
    });
    renderMaster();
  }

  function mountSettings(){
    const screen=$('screen-settings'); if(!screen||$('outsourceMasterCard'))return;
    const card=document.createElement('div');card.className='card outsource-master-card';card.id='outsourceMasterCard';
    card.innerHTML=`<div class="card-title">外注先マスター</div><div style="font-size:12px;color:#68707a">よく使う外注先を登録すると、見積入力でプルダウン選択できます。</div><div class="outsource-master-add"><input type="text" id="outsourceMasterName" placeholder="外注先名"><button type="button" id="outsourceMasterAddBtn">追加</button></div><div id="outsourceMasterList"></div>`;
    screen.appendChild(card);
    $('outsourceMasterAddBtn').onclick=addSupplier;
  }

  async function addSupplier(){
    const input=$('outsourceMasterName'); const name=input?.value.trim(); if(!name||!window.supabaseClient)return;
    const {error}=await supabaseClient.from('outsource_suppliers').insert({name});
    if(error){alert(error.code==='23505'?'同じ外注先がすでに登録されています。':'外注先を登録できませんでした。');return;}
    input.value=''; await loadSuppliers();
  }

  function renderMaster(){
    const list=$('outsourceMasterList'); if(!list)return;
    list.innerHTML=suppliers.length?suppliers.map(s=>`<div class="outsource-master-item"><strong>${esc(s.name)}</strong><button type="button" data-outsource-delete="${s.id}">削除</button></div>`).join(''):'<div style="font-size:12px;color:#68707a;padding:10px 0">外注先はまだ登録されていません。</div>';
    list.querySelectorAll('[data-outsource-delete]').forEach(btn=>btn.onclick=async()=>{
      if(!confirm('この外注先を一覧から削除しますか？'))return;
      await supabaseClient.from('outsource_suppliers').update({active:false}).eq('id',Number(btn.dataset.outsourceDelete));
      await loadSuppliers();
    });
  }

  function mount(){
    if(mounted) return true;
    const resultSelect=$('v2_result'); const resultField=resultSelect?.closest('.field');
    if(!resultField) return false;
    addStyles(); mountSettings();
    const wrap=document.createElement('div');wrap.className='outsource-wrap';wrap.id='outsourceWrap';
    wrap.innerHTML=`<div class="outsource-head"><div class="outsource-title">外注</div><div class="outsource-checks"><label><input type="checkbox" id="f_outsourceNo" checked> 無</label><label><input type="checkbox" id="f_outsourceYes"> 有</label></div></div><div class="outsource-detail" id="outsourceDetail">${quoteRows()}<div class="outsource-help">相見積もりの場合は最大3社まで登録できます。</div></div>`;
    resultField.insertAdjacentElement('afterend',wrap);
    $('f_outsourceYes').addEventListener('change',()=>setUsed($('f_outsourceYes').checked));
    $('f_outsourceNo').addEventListener('change',()=>setUsed(!$('f_outsourceNo').checked));
    setUsed(false);

    if(window.StorageAPI && !StorageAPI.__outsourceFields){
      const oldAdd=StorageAPI.add.bind(StorageAPI);
      StorageAPI.add=async function(order){const saved=await oldAdd(order);if(saved?.id)await save(saved.id);return saved;};
      const oldUpdate=StorageAPI.update.bind(StorageAPI);
      StorageAPI.update=async function(id,patch,expected){const r=await oldUpdate(id,patch,expected);if(r&&!r.conflict)await save(id);return r;};
      const oldGetOne=StorageAPI.getOne.bind(StorageAPI);
      StorageAPI.getOne=async function(id){const order=await oldGetOne(id);if(order)await load(id);return order;};
      StorageAPI.__outsourceFields=true;
    }
    $('orderForm')?.addEventListener('reset',()=>setTimeout(resetRows,0));
    mounted=true; loadSuppliers(); return true;
  }

  function setUsed(used){
    const yes=$('f_outsourceYes'),no=$('f_outsourceNo'),detail=$('outsourceDetail'); if(!yes||!no||!detail)return;
    yes.checked=!!used;no.checked=!used;detail.classList.toggle('show',!!used);if(!used)resetRows(false);
  }

  function resetRows(resetUsed=true){
    if(resetUsed)setUsed(false);
    [0,1,2].forEach(i=>{if($(`f_outsourceSupplier${i}`))$(`f_outsourceSupplier${i}`).value='';if($(`f_outsourcePrice${i}`))$(`f_outsourcePrice${i}`).value='';});
  }

  async function save(id){
    if(!window.supabaseClient||!id||!$('f_outsourceYes'))return;
    const used=$('f_outsourceYes').checked;
    const rows=used?[0,1,2].map((i)=>{const sel=$(`f_outsourceSupplier${i}`);const sid=sel?.value;const supplier=suppliers.find(s=>String(s.id)===String(sid));const raw=$(`f_outsourcePrice${i}`)?.value;return sid&&supplier?{estimate_id:Number(id),supplier_id:Number(sid),supplier_name:supplier.name,quoted_price:raw===''?null:Number(raw),sort_order:i}:null;}).filter(Boolean):[];
    await supabaseClient.from('estimate_outsource_quotes').delete().eq('estimate_id',Number(id));
    if(rows.length){const {error:qErr}=await supabaseClient.from('estimate_outsource_quotes').insert(rows);if(qErr)console.error('外注相見積保存エラー',qErr);}
    const first=rows[0]||null;
    const {error}=await supabaseClient.from('estimates').update({outsource_used:used,outsource_company:first?.supplier_name||null,outsource_price:first?.quoted_price??null}).eq('id',Number(id));
    if(error)console.error('外注情報保存エラー',error);
  }

  async function load(id){
    if(!window.supabaseClient||!id)return;
    await loadSuppliers();
    const [{data:e},{data:rows,error}]=await Promise.all([
      supabaseClient.from('estimates').select('outsource_used').eq('id',Number(id)).maybeSingle(),
      supabaseClient.from('estimate_outsource_quotes').select('supplier_id,supplier_name,quoted_price,sort_order').eq('estimate_id',Number(id)).order('sort_order')
    ]);
    if(error)console.error('外注相見積読込エラー',error);
    setUsed(!!e?.outsource_used); resetRows(false);
    (rows||[]).slice(0,3).forEach((r,i)=>{const sel=$(`f_outsourceSupplier${i}`);if(sel)sel.value=String(r.supplier_id||'');const p=$(`f_outsourcePrice${i}`);if(p)p.value=r.quoted_price??'';});
  }

  function start(){mountSettings();if(mount())return;let n=0;const t=setInterval(()=>{n++;mountSettings();if(mount()||n>50)clearInterval(t);},100);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();