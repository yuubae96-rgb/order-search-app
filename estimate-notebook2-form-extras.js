(function(){
  function installNoDocs(){
    const box=document.querySelector('.approvalBox');
    if(!box||document.getElementById('noSupportNeeded'))return;
    const host=document.createElement('label');
    host.style.cssText='display:flex;align-items:center;gap:10px;margin-top:12px;padding:12px;border:2px solid #b9c8d3;border-radius:10px;background:#fff;font-weight:900;color:#24323d';
    host.innerHTML='<input id="noSupportNeeded" type="checkbox" style="width:24px;height:24px;margin:0">今回必要資料無し';
    box.appendChild(host);
  }
  function installDueDateHint(){
    const input=document.getElementById('approvalDueDate');
    if(!input||document.getElementById('approvalDueDateHint'))return;
    const wrap=document.createElement('div');
    wrap.style.cssText='position:relative';
    input.parentNode.insertBefore(wrap,input);
    wrap.appendChild(input);
    const hint=document.createElement('span');
    hint.id='approvalDueDateHint';
    hint.textContent='回答・承認希望の日付を選択';
    hint.style.cssText='position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#a8b1bb;font-size:15px;font-weight:600;pointer-events:none;white-space:nowrap';
    wrap.appendChild(hint);
    const sync=()=>{hint.style.display=input.value?'none':'block'};
    input.addEventListener('input',sync);
    input.addEventListener('change',sync);
    input.addEventListener('focus',sync);
    input.addEventListener('blur',sync);
    sync();
  }
  function installColorField(){
    if(document.getElementById('color_count'))return;
    const color=document.querySelector('[data-field="color_text"]');
    if(!color)return;
    const d=document.createElement('div');d.className='field';d.dataset.field='color_count';
    d.innerHTML='<label>色数（手入力）</label><input id="color_count" type="number" min="1" step="1" placeholder="例：1">';
    d.style.background='#fff5f4';d.style.padding='6px';d.style.borderRadius='9px';
    const b=document.createElement('button');b.className='btn gray';b.type='button';b.textContent='確認済みにする';
    b.onclick=()=>{d.dataset.checked='1';d.style.background='';b.remove()};d.appendChild(b);
    d.querySelector('input').addEventListener('input',()=>{if(d.querySelector('input').value!==''){d.dataset.checked='1';d.style.background='';if(b.isConnected)b.remove()}});
    color.insertAdjacentElement('afterend',d);
  }
  function installHumanWarnings(){
    document.querySelectorAll('.humanCheckWarning').forEach(s=>s.remove());
    const box=document.getElementById('requestSheetExtras')||document.querySelector('.requestSheetBox');
    if(!box)return;
    const heading=[...box.querySelectorAll('h4,h3')].find(h=>h.textContent.includes('依頼票の選択項目'));
    if(!heading)return;
    const s=document.createElement('span');
    s.className='humanCheckWarning';
    s.textContent='人が確認記入！';
    s.style.cssText='color:#d92d20;font-weight:900;margin-left:10px;font-size:14px;white-space:nowrap';
    heading.appendChild(s);
  }
  function simpleSelect(inputId,choices){
    const input=document.getElementById(inputId);if(!input)return;
    input.removeAttribute('list');
    let select=document.getElementById(inputId+'_simpleSelect'),other=document.getElementById(inputId+'_other');
    if(!select){
      select=document.createElement('select');select.id=inputId+'_simpleSelect';select.style.marginBottom='6px';
      select.innerHTML='<option value="">選択してください</option>'+choices.map(v=>'<option value="'+v+'">'+v+'</option>').join('')+'<option value="__other__">その他（自由入力）</option>';
      other=document.createElement('input');other.id=inputId+'_other';other.type='text';other.placeholder='その他を入力';other.style.display='none';
      input.style.display='none';input.insertAdjacentElement('beforebegin',select);select.insertAdjacentElement('afterend',other);
      const sync=()=>{if(select.value==='__other__'){other.style.display='block';input.value=other.value}else{other.style.display='none';input.value=select.value}input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))};
      select.addEventListener('change',sync);other.addEventListener('input',sync);
    }
    const v=String(input.value||'');
    if(!v){select.value='';other.style.display='none';other.value=''}
    else if(choices.includes(v)){select.value=v;other.style.display='none';other.value=''}
    else{select.value='__other__';other.style.display='block';other.value=v}
  }
  function simplifyPlateFee(p){
    const yes=document.getElementById('plateFeeYes'),no=document.getElementById('plateFeeNo'),amount=document.getElementById('plate_fee');if(!yes||!no||!amount)return;
    const plateField=amount.closest('[data-field="plate_fee"]');
    const plateLabel=plateField&&plateField.querySelector('label');
    if(plateLabel)plateLabel.textContent='原版代(確認・手入力)';
    yes.type='radio';no.type='radio';yes.name='plateFeeChoice';no.name='plateFeeChoice';
    const choices=yes.closest('.plateFeeChoices');if(choices){choices.style.gap='8px';choices.querySelectorAll('label').forEach(l=>{l.style.cssText='display:flex;align-items:center;gap:7px;padding:10px 14px;border:2px solid #cfd8df;border-radius:10px;font-size:15px;font-weight:900;background:#fff'})}
    if(p&&p.plate_fee_present===true)yes.checked=true;
    else if(p&&p.plate_fee_present===false)no.checked=true;
    else if(p&&Number(p.plate_fee)>0)yes.checked=true;
    const sync=()=>{amount.disabled=no.checked;if(no.checked)amount.value='';amount.dispatchEvent(new Event('input',{bubbles:true}));amount.dispatchEvent(new Event('change',{bubbles:true}))};
    if(!yes.dataset.simpleBound){yes.dataset.simpleBound=no.dataset.simpleBound='1';yes.addEventListener('change',sync);no.addEventListener('change',sync)}
    sync();
  }
  function simplifyInputs(p){
    simpleSelect('material',['アルミ','ステンレス','真鍮','ケシ銀']);
    simpleSelect('manufacturing_method',['シール','オフセット','シルク','写真シール','シルク(H)','彫刻','新フルカラー(H)','アルマイト','エッチング','新フルカラー','外注']);
    simplifyPlateFee(p||{});
  }
  const prevFill=window.fill;
  if(typeof prevFill==='function')window.fill=function(p){const r=prevFill(p);installColorField();installNoDocs();installDueDateHint();installHumanWarnings();simplifyInputs(p||{});return r};
  const prevCurrent=window.current;
  if(typeof prevCurrent==='function')window.current=function(){const p=prevCurrent();const e=document.getElementById('color_count');p.color_count=e&&e.value!==''?Number(e.value):null;return p};
  const prevReset=window.resetRead;
  if(typeof prevReset==='function')window.resetRead=function(){const r=prevReset();const c=document.getElementById('noSupportNeeded');if(c)c.checked=false;return r};
  installNoDocs();installDueDateHint();installHumanWarnings();

  async function submitWithNoDocsSupport(e){
    if(e){e.preventDefault();e.stopImmediatePropagation();}
    const btn=document.getElementById('confirmBtn');
    let unchecked=[...document.querySelectorAll('[data-field]')].filter(d=>d.style.background&&!d.dataset.checked);if(unchecked.length)return alert('赤い要チェック項目を確認してください');
    let parsed=current();if(parsed.plate_fee_present===null)return alert('原版代の「有」または「無」を選択してください');if(parsed.plate_fee_present&&parsed.plate_fee===null)return alert('原版代「有」の場合は金額を入力してください');
    let due=document.getElementById('approvalDueDate').value;if(!due)return alert('承認希望期限を入力してください');
    const support=document.getElementById('supportFiles');
    const fs=support?[...support.files]:[];
    const noDocsBox=document.getElementById('noSupportNeeded');
    const noDocs=!!(noDocsBox&&noDocsBox.checked);
    if(!fs.length&&!noDocs)return alert('図面・要求メールなど承認に必要な資料を1つ以上添付するか、「今回必要資料無し」にチェックしてください');
    try{btn.disabled=true;btn.textContent='申請データ登録中…';let j=await api(FN,{action:'confirm',parsed,source_file_path:analyzed.source_file_path,source_file_name:analyzed.source_file_name,ai_raw:analyzed.ai_raw});await api(UFN,{id:j.id,urgency_status:parsed.urgency_status});await api(SFN,{id:j.id,plate_fee_present:parsed.plate_fee_present});
      for(let i=0;i<fs.length;i++){let f=fs[i];if(f.size>8*1024*1024)throw Error(f.name+' は8MBを超えています');btn.textContent='資料アップロード '+(i+1)+'/'+fs.length+'…';await api(AFN,{action:'upload_attachment',id:j.id,file_name:f.name,mime_type:f.type||'application/octet-stream',file_kind:'承認資料',base64:await file64(f)})}
      btn.textContent='申請中…';await api(AFN,{action:'submit_snapshot',id:j.id,approval_due_date:due,no_support_needed:noDocs});alert('見積を申請しました');resetRead();load();
    }catch(err){alert(err.message)}finally{btn.disabled=false;btn.textContent='この内容で申請する'}
  }

  const btn=document.getElementById('confirmBtn');
  if(btn){btn.onclick=null;btn.addEventListener('click',submitWithNoDocsSupport,true)}
})();

(function(){
  function escReturn(s){return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}
  const style=document.createElement('style');
  style.textContent='.returnReasonInline{margin-top:5px;padding:6px 8px;border-radius:8px;background:#fff1ef;color:#9d2018;font-size:11px;font-weight:900;line-height:1.45;border:1px solid #f0b8b2}.returnTab{border-color:#efb1aa!important;color:#9d2018!important;background:#fff5f4!important}.returnTab.active{background:#9d2018!important;color:#fff!important}';
  document.head.appendChild(style);
  const prevCompact=window.compact;
  if(typeof prevCompact==='function')window.compact=function(x){
    let h=prevCompact(x);
    if(x&&x.workflow_status==='差戻し'){
      const reason=x.approval_note?'<div class="returnReasonInline">社長からの差し戻し理由：'+escReturn(x.approval_note)+'</div>':'<div class="returnReasonInline">社長から差し戻されています。案件を開いて修正してください。</div>';
      h=h.replace('<div class="cSub">'+escReturn(x.person_in_charge||'')+'</div>','<div class="cSub">'+escReturn(x.person_in_charge||'')+'</div>'+reason);
    }
    return h;
  };
  const tabs=document.querySelector('.tabs');
  if(tabs&&!tabs.querySelector('[data-filter="差戻し"]')){
    const apply=tabs.querySelector('[data-filter="申請中"]');
    const b=document.createElement('button');b.className='tab returnTab';b.dataset.filter='差戻し';b.textContent='差戻し';
    if(apply)apply.insertAdjacentElement('afterend',b);else tabs.appendChild(b);
    b.addEventListener('click',function(){
      try{filter='差戻し';document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t===b));render()}catch(e){console.warn(e)}
    });
  }
  const prevMatch=window.match;
  if(typeof prevMatch==='function')window.match=function(x){if(typeof filter!=='undefined'&&filter==='差戻し')return x.workflow_status==='差戻し';return prevMatch(x)};
})();

(function(){
  if(parent===window)return;
  const OFN='https://vnnvuxccazkdzwqjmntz.supabase.co/functions/v1/estimate-notebook2-operators';
  const pd=parent.document;
  const owner=()=>{try{return parent.getCurrentOperator&&parent.getCurrentOperator()?.name==='承認(社長)'}catch(e){return false}};
  const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const jp=v=>{try{return new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch(e){return v}};
  async function historyApi(body){body=Object.assign({},body,{actor_name:owner()?'承認(社長)':''});const r=await fetch(OFN,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw Error(j.error||'処理失敗');return j}
  const historyNav=()=>[...pd.querySelectorAll('.nav')].find(x=>x.dataset.pane==='history');
  function syncPermission(){const n=historyNav();if(n)n.classList.toggle('locked',!owner());const pane=pd.getElementById('history');if(pane&&!owner()&&pane.classList.contains('active')){try{parent.showPane('app')}catch(e){}}}
  const nav=historyNav();if(nav&&!nav.dataset.ownerOnlyBound){nav.dataset.ownerOnlyBound='1';nav.addEventListener('click',e=>{if(owner())return;e.preventDefault();e.stopImmediatePropagation();alert('操作履歴は「承認(社長)」のみ閲覧できます。')},true)}
  async function loadOwnerLogs(){if(!owner())return alert('操作履歴は「承認(社長)」のみ閲覧できます。');const logs=pd.getElementById('logs');if(!logs)return;try{const j=await historyApi({action:'list_logs',limit:500}),a=j.items||[];logs.innerHTML=a.length?a.map(x=>{const e=x.estimate_notebook2||{},target=[e.company_name,e.product_name].filter(Boolean).join(' / ');return '<div class="log"><div class="row"><div class="grow"><div class="time">'+jp(x.created_at)+'　'+esc(x.operator_name)+'</div><div class="action">'+esc(x.action)+'</div>'+(target?'<div class="target">'+esc(target)+'</div>':'')+(x.details?'<div class="role">'+esc(x.details)+'</div>':'')+'</div><button class="btn red historyDeleteOne" data-log-id="'+x.id+'" type="button">削除</button></div></div>'}).join(''):'<div class="empty">まだ履歴はありません。</div>';logs.querySelectorAll('.historyDeleteOne').forEach(b=>b.onclick=async()=>{if(!confirm('この操作履歴を1件削除しますか？'))return;try{await historyApi({action:'delete_log',id:Number(b.dataset.logId)});await loadOwnerLogs()}catch(e){alert(e.message)}})}catch(e){logs.textContent=e.message}}
  function installBulk(){const history=pd.getElementById('history');if(!history)return;const row=history.querySelector('.card .row');if(!row||pd.getElementById('deleteAllLogs'))return;const b=pd.createElement('button');b.id='deleteAllLogs';b.type='button';b.className='btn red';b.textContent='履歴を一括削除';b.onclick=async()=>{if(!owner())return alert('操作履歴の削除は「承認(社長)」のみ実行できます。');if(!confirm('操作履歴をすべて削除しますか？\nこの操作は元に戻せません。'))return;try{await historyApi({action:'delete_all_logs'});await loadOwnerLogs();alert('操作履歴をすべて削除しました')}catch(e){alert(e.message)}};row.appendChild(b);const reload=pd.getElementById('reloadLogs');if(reload)reload.onclick=loadOwnerLogs}
  try{parent.loadLogs=loadOwnerLogs}catch(e){}
  installBulk();syncPermission();setInterval(()=>{installBulk();syncPermission()},600);
})();
