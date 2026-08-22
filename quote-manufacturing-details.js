'use strict';
(function(){
  const $=id=>document.getElementById(id);
  let mounted=false;

  function addStyles(){
    if($('quoteManufacturingDetailsStyle')) return;
    const s=document.createElement('style');
    s.id='quoteManufacturingDetailsStyle';
    s.textContent=`
      .mfg-details{margin:12px 0 14px}
      .mfg-choice-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
      .mfg-choice-box{border:1px solid #d8dde3;border-radius:10px;padding:11px 12px;background:#f8f9fb}
      .mfg-choice-title{font-weight:900;font-size:13px;margin-bottom:8px}
      .mfg-radio-row{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
      .mfg-radio-row label{display:flex;align-items:center;gap:6px;font-weight:800;font-size:14px;margin:0}
      .mfg-radio-row input{width:22px;height:22px;margin:0}
      .mfg-extra-note{margin-top:12px}
      .mfg-extra-note textarea{min-height:92px;resize:vertical}
      .mfg-details .outsource-wrap{margin:0 0 12px}
      @media(max-width:420px){.mfg-choice-grid{grid-template-columns:1fr}.mfg-radio-row{gap:18px}}
    `;
    document.head.appendChild(s);
  }

  function mount(){
    if(mounted) return true;
    const grid=document.querySelector('.quote-spec-grid');
    if(!grid) return false;
    addStyles();
    const wrap=document.createElement('div');
    wrap.id='mfgDetails';
    wrap.className='mfg-details';
    wrap.innerHTML=`
      <div id="mfgOutsourceSlot"></div>
      <div class="field"><label>色数</label><div style="display:flex;align-items:center;gap:8px"><input type="number" id="f_colorCount" min="0" step="1" placeholder="例 2" style="max-width:180px"><strong>色</strong></div></div>
      <div class="mfg-choice-grid">
        <div class="mfg-choice-box"><div class="mfg-choice-title">支給材</div><div class="mfg-radio-row"><label><input type="radio" name="f_suppliedMaterial" value="false" checked> 無</label><label><input type="radio" name="f_suppliedMaterial" value="true"> 有</label></div></div>
        <div class="mfg-choice-box"><div class="mfg-choice-title">形状</div><div class="mfg-radio-row"><label><input type="radio" name="f_shapeType" value="矩形" checked> 矩形</label><label><input type="radio" name="f_shapeType" value="異形"> 異形</label></div></div>
      </div>
      <div class="field mfg-extra-note"><label>補足情報</label><textarea id="f_supplementalInfo" placeholder="加工条件、注意点、支給材の内容などを記入"></textarea></div>`;
    grid.insertAdjacentElement('afterend',wrap);

    if(window.StorageAPI && !StorageAPI.__manufacturingDetailFields){
      const oldAdd=StorageAPI.add.bind(StorageAPI);
      StorageAPI.add=async function(order){const saved=await oldAdd(order);if(saved?.id)await save(saved.id);return saved;};
      const oldUpdate=StorageAPI.update.bind(StorageAPI);
      StorageAPI.update=async function(id,patch,expected){const r=await oldUpdate(id,patch,expected);if(r&&!r.conflict)await save(id);return r;};
      const oldGetOne=StorageAPI.getOne.bind(StorageAPI);
      StorageAPI.getOne=async function(id){const order=await oldGetOne(id);if(order)await load(id);return order;};
      StorageAPI.__manufacturingDetailFields=true;
    }

    $('orderForm')?.addEventListener('reset',()=>setTimeout(resetFields,0));
    mounted=true;
    relocateOutsource();
    return true;
  }

  function relocateOutsource(){
    const slot=$('mfgOutsourceSlot');
    const outsource=$('outsourceWrap');
    if(slot&&outsource&&outsource.parentElement!==slot) slot.appendChild(outsource);
  }

  function valRadio(name,def=''){
    return document.querySelector(`input[name="${name}"]:checked`)?.value ?? def;
  }
  function setRadio(name,value){
    document.querySelectorAll(`input[name="${name}"]`).forEach(r=>r.checked=String(r.value)===String(value));
  }

  function resetFields(){
    if($('f_colorCount')) $('f_colorCount').value='';
    setRadio('f_suppliedMaterial','false');
    setRadio('f_shapeType','矩形');
    if($('f_supplementalInfo')) $('f_supplementalInfo').value='';
    relocateOutsource();
  }

  async function save(id){
    if(!window.supabaseClient||!id) return;
    const raw=$('f_colorCount')?.value ?? '';
    const payload={
      color_count:raw===''?null:Number(raw),
      supplied_material:valRadio('f_suppliedMaterial','false')==='true',
      shape_type:valRadio('f_shapeType','矩形')||'矩形',
      supplemental_info:$('f_supplementalInfo')?.value.trim()||null
    };
    const {error}=await supabaseClient.from('estimates').update(payload).eq('id',Number(id));
    if(error) console.error('製作条件保存エラー',error);
  }

  async function load(id){
    if(!window.supabaseClient||!id) return;
    const {data,error}=await supabaseClient.from('estimates').select('color_count,supplied_material,shape_type,supplemental_info').eq('id',Number(id)).maybeSingle();
    if(error){console.error('製作条件読込エラー',error);return;}
    if($('f_colorCount')) $('f_colorCount').value=data?.color_count ?? '';
    setRadio('f_suppliedMaterial',data?.supplied_material?'true':'false');
    setRadio('f_shapeType',data?.shape_type||'矩形');
    if($('f_supplementalInfo')) $('f_supplementalInfo').value=data?.supplemental_info||'';
    relocateOutsource();
  }

  function start(){
    if(!mount()){
      let n=0;const t=setInterval(()=>{n++;if(mount()||n>60)clearInterval(t);},100);
    }
    let tries=0;const mover=setInterval(()=>{tries++;relocateOutsource();if($('outsourceWrap')||tries>80)clearInterval(mover);},100);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
