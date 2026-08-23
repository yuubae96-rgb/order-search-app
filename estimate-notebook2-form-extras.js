(function(){
  function installNoDocs(){
    const box=document.querySelector('.approvalBox');
    if(!box||document.getElementById('noSupportNeeded'))return;
    const host=document.createElement('label');
    host.style.cssText='display:flex;align-items:center;gap:10px;margin-top:12px;padding:12px;border:2px solid #b9c8d3;border-radius:10px;background:#fff;font-weight:900;color:#24323d';
    host.innerHTML='<input id="noSupportNeeded" type="checkbox" style="width:24px;height:24px;margin:0">今回必要資料無し';
    box.appendChild(host);
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
    ['detail_sheet_present','separate_drawing_present'].forEach(id=>{
      const d=document.querySelector('[data-field="'+id+'"]'),label=d&&d.querySelector('label');if(!label||label.querySelector('.humanCheckWarning'))return;
      const s=document.createElement('span');s.className='humanCheckWarning';s.textContent='人が確認記入！';s.style.cssText='color:#d92d20;font-weight:900;margin-left:10px;font-size:14px;white-space:nowrap';label.appendChild(s);
    });
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
  if(typeof prevFill==='function')window.fill=function(p){const r=prevFill(p);installColorField();installNoDocs();installHumanWarnings();simplifyInputs(p||{});return r};
  const prevCurrent=window.current;
  if(typeof prevCurrent==='function')window.current=function(){const p=prevCurrent();const e=document.getElementById('color_count');p.color_count=e&&e.value!==''?Number(e.value):null;return p};
  const prevReset=window.resetRead;
  if(typeof prevReset==='function')window.resetRead=function(){const r=prevReset();const c=document.getElementById('noSupportNeeded');if(c)c.checked=false;return r};
  installNoDocs();installHumanWarnings();

  const btn=document.getElementById('confirmBtn');
  if(btn){btn.onclick=async()=>{
    let unchecked=[...document.querySelectorAll('[data-field]')].filter(d=>d.style.background&&!d.dataset.checked);if(unchecked.length)return alert('赤い要チェック項目を確認してください');
    let parsed=current();if(parsed.plate_fee_present===null)return alert('原版代の「有」または「無」を選択してください');if(parsed.plate_fee_present&&parsed.plate_fee===null)return alert('原版代「有」の場合は金額を入力してください');
    let due=document.getElementById('approvalDueDate').value;if(!due)return alert('承認希望期限を入力してください');
    const fs=[...document.getElementById('supportFiles').files],noDocs=!!document.getElementById('noSupportNeeded')?.checked;if(!fs.length&&!noDocs)return alert('図面・要求メールなど承認に必要な資料を1つ以上添付するか、「今回必要資料無し」にチェックしてください');
    try{btn.disabled=true;btn.textContent='申請データ登録中…';let j=await api(FN,{action:'confirm',parsed,source_file_path:analyzed.source_file_path,source_file_name:analyzed.source_file_name,ai_raw:analyzed.ai_raw});await api(UFN,{id:j.id,urgency_status:parsed.urgency_status});await api(SFN,{id:j.id,plate_fee_present:parsed.plate_fee_present});
      for(let i=0;i<fs.length;i++){let f=fs[i];if(f.size>8*1024*1024)throw Error(f.name+' は8MBを超えています');btn.textContent='資料アップロード '+(i+1)+'/'+fs.length+'…';await api(AFN,{action:'upload_attachment',id:j.id,file_name:f.name,mime_type:f.type||'application/octet-stream',file_kind:'承認資料',base64:await file64(f)})}
      btn.textContent='申請中…';await api(AFN,{action:'submit_snapshot',id:j.id,approval_due_date:due});alert('見積を申請しました');resetRead();load();
    }catch(e){alert(e.message)}finally{btn.disabled=false;btn.textContent='この内容で申請する'}
  }}
})();
