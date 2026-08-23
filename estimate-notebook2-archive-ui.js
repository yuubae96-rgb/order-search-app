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
