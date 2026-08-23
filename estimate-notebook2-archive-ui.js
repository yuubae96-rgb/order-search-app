(function(){
  const ARFN='https://vnnvuxccazkdzwqjmntz.supabase.co/functions/v1/estimate-notebook2-archive';
  const accept='application/pdf,image/*,.eml,.msg,.doc,.docx,.xls,.xlsx,.txt';
  function isArchive(x){return !!(x&&x.ai_raw_json&&x.ai_raw_json.archive_only===true)}
  async function addMaterialFiles(id){
    const input=document.createElement('input');
    input.type='file'; input.multiple=true; input.accept=accept; input.style.display='none';
    input.onchange=async()=>{
      const fs=[...(input.files||[])]; if(!fs.length){input.remove();return}
      try{
        for(let i=0;i<fs.length;i++){
          const f=fs[i];
          if(f.size>8*1024*1024)throw Error(f.name+' は8MBを超えています');
          await api(AFN,{action:'upload_attachment',id,file_name:f.name,mime_type:f.type||'application/octet-stream',file_kind:'承認資料',base64:await file64(f)});
        }
        alert('必要資料をこの案件に追加しました');
        if(typeof load==='function')await load();
      }catch(e){alert(e.message)}finally{input.remove()}
    };
    document.body.appendChild(input); input.click();
  }
  const oldMaterials=window.materials;
  window.materials=async function(id){
    try{
      const j=await api(AFN,{action:'list_attachments',id}),a=j.items||[];
      if(!a.length)return addMaterialFiles(id);
      if(confirm('この案件には必要資料が'+a.length+'件あります。\n\nOK：さらに資料を追加\nキャンセル：既存資料を見る'))return addMaterialFiles(id);
      return oldMaterials(id);
    }catch(e){alert(e.message)}
  };
  async function changeArchiveStatus(id){
    const x=(typeof items!=='undefined'?items:[]).find(v=>Number(v.id)===Number(id));
    if(!isArchive(x))return;
    const current=x.workflow_status==='過去保管分'?'過去保管分':'申請中';
    const ans=prompt('この原本の区分を選んでください。\n\n1：過去保管分\n2：申請中',current==='過去保管分'?'1':'2');
    if(ans===null)return;
    const status=ans==='1'?'過去保管分':ans==='2'?'申請中':'';
    if(!status)return alert('1 または 2 を入力してください');
    try{await api(ARFN,{action:'update_status',id,workflow_status:status});if(typeof load==='function')await load()}catch(e){alert(e.message)}
  }
  window.changeArchiveStatus=changeArchiveStatus;
  const oldStage=window.stage;
  if(typeof oldStage==='function')window.stage=function(x){if(isArchive(x)&&x.workflow_status==='過去保管分')return['過去保管分','bWait'];return oldStage(x)};
  function statusButtonize(h,x){
    if(!isArchive(x))return h;
    const label=x.workflow_status==='過去保管分'?'過去保管分':'申請中';
    const cls=label==='過去保管分'?'bWait':'bApply';
    const span='<span class="badge '+cls+'">'+label+'</span>';
    const btn='<button class="badge '+cls+'" onclick="event.stopPropagation();changeArchiveStatus('+x.id+')">'+label+'</button>';
    return h.replace(span,btn);
  }
  const prevCompact=window.compact;
  if(typeof prevCompact==='function')window.compact=function(x){return statusButtonize(prevCompact(x),x)};
  const prevDetailed=window.detailed;
  if(typeof prevDetailed==='function')window.detailed=function(x){return statusButtonize(prevDetailed(x),x)};
})();

(function(){
  if(parent===window)return;
  const OFN='https://vnnvuxccazkdzwqjmntz.supabase.co/functions/v1/estimate-notebook2-operators';
  const pd=parent.document;
  const owner=()=>{try{const p=parent.getCurrentOperator&&parent.getCurrentOperator();if(p&&String(p.name||'').trim()==='承認(社長)')return true;return String(pd.getElementById('whoBtn')?.textContent||'').trim().startsWith('承認(社長)')}catch(e){return false}};
  const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const jp=v=>{try{return new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch(e){return v}};
  async function hist(body){body=Object.assign({},body,{actor_name:owner()?'承認(社長)':''});const r=await fetch(OFN,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw Error(j.error||'処理失敗');return j}
  function selectedIds(){return [...pd.querySelectorAll('.historySelect:checked')].map(x=>Number(x.value)).filter(Boolean)}
  async function deleteOne(id){if(!owner())return alert('操作履歴の削除は社長のみ実行できます。');if(!confirm('この操作履歴を1件削除しますか？'))return;try{await hist({action:'delete_log',id});await loadSelectableLogs()}catch(e){alert(e.message)}}
  async function deleteSelected(){if(!owner())return alert('操作履歴の削除は社長のみ実行できます。');const ids=selectedIds();if(!ids.length)return alert('削除する履歴にチェックを入れてください');if(!confirm(ids.length+'件の選択した履歴を削除しますか？\nチェックしていない履歴は残ります。'))return;const btn=pd.getElementById('deleteAllLogs');try{if(btn){btn.disabled=true;btn.textContent='削除中…'}for(const id of ids)await hist({action:'delete_log',id});await loadSelectableLogs();alert(ids.length+'件の履歴を削除しました')}catch(e){alert(e.message)}finally{if(btn){btn.disabled=false;btn.textContent='選択した履歴を削除'}}}
  async function loadSelectableLogs(){const logs=pd.getElementById('logs');if(!logs||!owner())return;try{const j=await hist({action:'list_logs',limit:500}),a=j.items||[];logs.innerHTML=a.length?a.map(x=>{const e=x.estimate_notebook2||{},target=[e.company_name,e.product_name].filter(Boolean).join(' / ');return '<div class="log"><div class="row" style="align-items:flex-start"><label style="padding:8px 8px 0 0;display:flex;align-items:center"><input class="historySelect" type="checkbox" value="'+x.id+'" style="width:22px;height:22px"></label><div class="grow"><div class="time">'+jp(x.created_at)+'　'+esc(x.operator_name)+'</div><div class="action">'+esc(x.action)+'</div>'+(target?'<div class="target">'+esc(target)+'</div>':'')+(x.details?'<div class="role">'+esc(x.details)+'</div>':'')+'</div><button class="btn red historyDeleteOne" data-log-id="'+x.id+'" type="button">削除</button></div></div>'}).join(''):'<div class="empty">まだ履歴はありません。</div>';logs.querySelectorAll('.historyDeleteOne').forEach(b=>b.onclick=()=>deleteOne(Number(b.dataset.logId)));installControls()}catch(e){logs.textContent=e.message}}
  function installControls(){const history=pd.getElementById('history');if(!history||!owner())return;const row=history.querySelector('.card .row');if(!row)return;let all=pd.getElementById('historySelectAll');if(!all){all=pd.createElement('button');all.id='historySelectAll';all.type='button';all.className='btn gray';all.textContent='全選択';all.onclick=()=>{const cs=[...pd.querySelectorAll('.historySelect')];const next=cs.some(c=>!c.checked);cs.forEach(c=>c.checked=next);all.textContent=next?'選択解除':'全選択'};const reload=pd.getElementById('reloadLogs');if(reload)reload.insertAdjacentElement('afterend',all);else row.appendChild(all)}let b=pd.getElementById('deleteAllLogs');if(b){b.textContent='選択した履歴を削除';b.onclick=deleteSelected;b.style.display='inline-block'}const reload=pd.getElementById('reloadLogs');if(reload)reload.onclick=loadSelectableLogs}
  function hook(){if(!owner())return;installControls();const nav=[...pd.querySelectorAll('.nav')].find(x=>x.dataset.pane==='history');if(nav&&!nav.dataset.selectHistoryHook){nav.dataset.selectHistoryHook='1';nav.addEventListener('click',()=>setTimeout(loadSelectableLogs,80))}const pane=pd.getElementById('history');if(pane&&pane.classList.contains('active')){const logs=pd.getElementById('logs');if(logs&&!logs.querySelector('.historySelect')&&logs.querySelector('.log'))loadSelectableLogs()}}
  setInterval(hook,500);setTimeout(hook,100);
})();

(function(){
  function owner(){
    try{
      const p=parent&&parent!==window&&typeof parent.getCurrentOperator==='function'?parent.getCurrentOperator():null;
      if(p&&String(p.name||'').trim()==='承認(社長)')return true;
      return String(parent?.document?.getElementById('whoBtn')?.textContent||'').trim().startsWith('承認(社長)');
    }catch(e){return false}
  }
  const prevDetailed=window.detailed;
  if(typeof prevDetailed==='function')window.detailed=function(x){
    let h=prevDetailed(x);
    if(!owner())h=h.replace(/<button class="btn danger"[^>]*>削除<\/button>/g,'');
    return h;
  };
  const prevDel=window.del;
  if(typeof prevDel==='function')window.del=async function(){
    if(!owner())return alert('案件の削除は「承認(社長)」のみ実行できます。');
    return prevDel.apply(this,arguments);
  };
  function sync(){
    if(owner())return;
    document.querySelectorAll('button.btn.danger').forEach(b=>{
      if((b.getAttribute('onclick')||'').includes('del('))b.remove();
    });
  }
  setInterval(sync,400);setTimeout(sync,50);
})();

(function(){
  const h=[...document.querySelectorAll('h3')].find(x=>x.textContent.trim()==='③ 見積保管庫');
  if(h)h.textContent='③ 見積保管庫(見積りノート)';
})();
