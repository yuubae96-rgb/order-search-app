(function(){
  function installNoDocs(){
    const box=document.querySelector('.approvalBox');
    if(!box||document.getElementById('noSupportNeeded'))return;
    const host=document.createElement('label');
    host.style.cssText='display:flex;align-items:center;gap:10px;margin-top:12px;padding:12px;border:2px solid #b9c8d3;border-radius:10px;background:#fff;font-weight:900;color:#24323d';
    host.innerHTML='<input id="noSupportNeeded" type="checkbox" style="width:24px;height:24px;margin:0">今回必要資料無し';
    box.appendChild(host);
  }
  function installColorField(p){
    if(document.getElementById('color_count')){
      const e=document.getElementById('color_count');
      e.value=p&&p.color_count!=null?p.color_count:'';
      return;
    }
    const color=document.querySelector('[data-field="color_text"]');
    if(!color)return;
    const d=document.createElement('div');
    d.className='field';
    d.dataset.field='color_count';
    const v=p&&p.color_count!=null?p.color_count:'';
    d.innerHTML='<label>色数</label><input id="color_count" type="number" min="1" step="1" placeholder="例：1" value="'+String(v).replace(/"/g,'&quot;')+'">';
    if(v===''||v==null){
      d.style.background='#fff5f4';d.style.padding='6px';d.style.borderRadius='9px';
      const b=document.createElement('button');b.className='btn gray';b.type='button';b.textContent='確認済みにする';
      b.onclick=()=>{d.dataset.checked='1';d.style.background='';b.remove()};d.appendChild(b);
      d.querySelector('input').addEventListener('input',()=>{if(d.querySelector('input').value!==''){d.dataset.checked='1';d.style.background='';b.remove()}});
    }
    color.insertAdjacentElement('afterend',d);
  }
  const prevFill=window.fill;
  if(typeof prevFill==='function')window.fill=function(p){const r=prevFill(p);installColorField(p||{});installNoDocs();return r};
  const prevCurrent=window.current;
  if(typeof prevCurrent==='function')window.current=function(){const p=prevCurrent();const e=document.getElementById('color_count');p.color_count=e&&e.value!==''?Number(e.value):null;return p};
  const prevReset=window.resetRead;
  if(typeof prevReset==='function')window.resetRead=function(){const r=prevReset();const c=document.getElementById('noSupportNeeded');if(c)c.checked=false;return r};
  installNoDocs();

  const btn=document.getElementById('confirmBtn');
  if(btn){
    btn.onclick=async()=>{
      let unchecked=[...document.querySelectorAll('[data-field]')].filter(d=>d.style.background&&!d.dataset.checked);
      if(unchecked.length)return alert('赤い要チェック項目を確認してください');
      let parsed=current();
      if(parsed.plate_fee_present===null)return alert('原版代の「有」または「無」を選択してください');
      if(parsed.plate_fee_present&&parsed.plate_fee===null)return alert('原版代「有」の場合は金額を入力してください');
      let due=document.getElementById('approvalDueDate').value;if(!due)return alert('承認希望期限を入力してください');
      const fs=[...document.getElementById('supportFiles').files];
      const noDocs=!!document.getElementById('noSupportNeeded')?.checked;
      if(!fs.length&&!noDocs)return alert('図面・要求メールなど承認に必要な資料を1つ以上添付するか、「今回必要資料無し」にチェックしてください');
      try{
        btn.disabled=true;btn.textContent='申請データ登録中…';
        let j=await api(FN,{action:'confirm',parsed,source_file_path:analyzed.source_file_path,source_file_name:analyzed.source_file_name,ai_raw:analyzed.ai_raw});
        await api(UFN,{id:j.id,urgency_status:parsed.urgency_status});
        await api(SFN,{id:j.id,plate_fee_present:parsed.plate_fee_present});
        if(fs.length){
          for(let i=0;i<fs.length;i++){
            let f=fs[i];if(f.size>8*1024*1024)throw Error(f.name+' は8MBを超えています');
            btn.textContent='資料アップロード '+(i+1)+'/'+fs.length+'…';
            await api(AFN,{action:'upload_attachment',id:j.id,file_name:f.name,mime_type:f.type||'application/octet-stream',file_kind:'承認資料',base64:await file64(f)});
          }
        }
        btn.textContent='申請中…';
        await api(AFN,{action:'submit_snapshot',id:j.id,approval_due_date:due});
        alert('見積を申請しました');resetRead();load();
      }catch(e){alert(e.message)}finally{btn.disabled=false;btn.textContent='この内容で申請する'}
    };
  }

  const LFN='https://vnnvuxccazkdzwqjmntz.supabase.co/functions/v1/estimate-notebook2-lower-choice';
  const analyzeBtn=document.getElementById('analyzeBtn');
  if(analyzeBtn&&typeof analyzeBtn.onclick==='function'&&!analyzeBtn.dataset.lowerFinalWrapped){
    const oldAnalyze=analyzeBtn.onclick;
    analyzeBtn.dataset.lowerFinalWrapped='1';
    analyzeBtn.onclick=async function(){
      const f=document.getElementById('file')?.files?.[0];
      let lowerPromise=null;
      if(f){
        lowerPromise=(async()=>{
          const base64=await file64(f);
          return await api(LFN,{file_name:f.name,mime_type:f.type||'application/octet-stream',base64});
        })();
      }
      const r=await oldAnalyze.apply(this,arguments);
      if(lowerPromise&&typeof analyzed!=='undefined'&&analyzed?.parsed&&!document.getElementById('reviewCard')?.classList.contains('hidden')){
        const progress=document.getElementById('progress');
        try{
          if(progress){progress.innerHTML='<div class="aiProgressBox"><div class="aiProgressMain">下段の丸印を最終確認中…</div><div class="aiProgressTime">以前の単価・詳細別紙・サンプル・受注確率・在庫などを確認しています</div><div class="aiProgressBar"><span style="width:92%"></span></div></div>';progress.classList.remove('hidden')}
          const j=await lowerPromise;
          const q=j&&j.parsed?j.parsed:{};
          const keys=['previous_unit_price_present','detail_sheet_present','sample_present','separate_drawing_present','separate_drawing_kind','order_probability','stock_present'];
          for(const k of keys){
            if(q[k]!==null&&q[k]!==undefined&&q[k]!==''){
              analyzed.parsed[k]=q[k];
              if(Array.isArray(analyzed.parsed.uncertain_fields))analyzed.parsed.uncertain_fields=analyzed.parsed.uncertain_fields.filter(x=>x!==k);
            }
          }
          fill(analyzed.parsed);
        }catch(e){console.warn('lower choice confirmation failed',e)}finally{if(progress)progress.classList.add('hidden')}
      }
      return r;
    };
  }
})();
