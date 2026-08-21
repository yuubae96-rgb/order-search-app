'use strict';
(function(){
  const $=id=>document.getElementById(id);
  let mounted=false;

  function addStyles(){
    if(document.getElementById('quoteOutsourceStyle')) return;
    const s=document.createElement('style');
    s.id='quoteOutsourceStyle';
    s.textContent=`
      .outsource-wrap{margin:10px 0 12px;padding:12px;border:1px solid #d8dde3;border-radius:10px;background:#f8f9fb}
      .outsource-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
      .outsource-title{font-weight:900;font-size:13px}
      .outsource-checks{display:flex;gap:14px;align-items:center}
      .outsource-checks label{display:flex;align-items:center;gap:5px;font-weight:800;font-size:13px;margin:0}
      .outsource-checks input{width:22px;height:22px;margin:0}
      .outsource-detail{display:none;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin-top:12px}
      .outsource-detail.show{display:grid}
      .outsource-detail .field{margin:0;min-width:0}
      .outsource-detail input{width:100%;min-width:0;box-sizing:border-box}
      @media(max-width:420px){.outsource-detail{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
    `;
    document.head.appendChild(s);
  }

  function mount(){
    if(mounted) return true;
    const resultSelect=$('v2_result');
    const resultField=resultSelect?.closest('.field');
    if(!resultField) return false;

    addStyles();
    const wrap=document.createElement('div');
    wrap.className='outsource-wrap';
    wrap.id='outsourceWrap';
    wrap.innerHTML=`
      <div class="outsource-head">
        <div class="outsource-title">外注</div>
        <div class="outsource-checks">
          <label><input type="checkbox" id="f_outsourceNo" checked> 無</label>
          <label><input type="checkbox" id="f_outsourceYes"> 有</label>
        </div>
      </div>
      <div class="outsource-detail" id="outsourceDetail">
        <div class="field"><label>外注先</label><input type="text" id="f_outsourceCompany" placeholder="例 ○○工業"></div>
        <div class="field"><label>外注料（円）</label><input type="number" id="f_outsourcePrice" min="0" step="1" placeholder="例 8500"></div>
      </div>`;
    resultField.insertAdjacentElement('afterend',wrap);

    $('f_outsourceYes').addEventListener('change',()=>setUsed($('f_outsourceYes').checked));
    $('f_outsourceNo').addEventListener('change',()=>setUsed(!$('f_outsourceNo').checked));
    setUsed(false);

    if(window.StorageAPI && !StorageAPI.__outsourceFields){
      const oldAdd=StorageAPI.add.bind(StorageAPI);
      StorageAPI.add=async function(order){
        const saved=await oldAdd(order);
        if(saved?.id) await save(saved.id);
        return saved;
      };
      const oldUpdate=StorageAPI.update.bind(StorageAPI);
      StorageAPI.update=async function(id,patch,expected){
        const r=await oldUpdate(id,patch,expected);
        if(r && !r.conflict) await save(id);
        return r;
      };
      const oldGetOne=StorageAPI.getOne.bind(StorageAPI);
      StorageAPI.getOne=async function(id){
        const order=await oldGetOne(id);
        if(order) await load(id);
        return order;
      };
      StorageAPI.__outsourceFields=true;
    }

    $('orderForm')?.addEventListener('reset',()=>setTimeout(()=>{
      setUsed(false);
      $('f_outsourceCompany').value='';
      $('f_outsourcePrice').value='';
    },0));

    mounted=true;
    return true;
  }

  function setUsed(used){
    const yes=$('f_outsourceYes'),no=$('f_outsourceNo'),detail=$('outsourceDetail');
    if(!yes||!no||!detail)return;
    yes.checked=!!used;
    no.checked=!used;
    detail.classList.toggle('show',!!used);
    if(!used){
      $('f_outsourceCompany').value='';
      $('f_outsourcePrice').value='';
    }
  }

  async function save(id){
    if(!window.supabaseClient||!id||!$('f_outsourceYes'))return;
    const used=$('f_outsourceYes').checked;
    const company=used?($('f_outsourceCompany')?.value.trim()||null):null;
    const raw=$('f_outsourcePrice')?.value;
    const price=used&&raw!==''?Number(raw):null;
    const {error}=await supabaseClient.from('estimates').update({outsource_used:used,outsource_company:company,outsource_price:price}).eq('id',Number(id));
    if(error) console.error('外注情報保存エラー',error);
  }

  async function load(id){
    if(!window.supabaseClient||!id)return;
    const {data,error}=await supabaseClient.from('estimates').select('outsource_used,outsource_company,outsource_price').eq('id',Number(id)).maybeSingle();
    if(error)return console.error('外注情報読込エラー',error);
    setUsed(!!data?.outsource_used);
    if($('f_outsourceCompany'))$('f_outsourceCompany').value=data?.outsource_company||'';
    if($('f_outsourcePrice'))$('f_outsourcePrice').value=data?.outsource_price??'';
  }

  function start(){
    if(mount())return;
    let n=0;
    const t=setInterval(()=>{n++;if(mount()||n>50)clearInterval(t);},100);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();