'use strict';
(function(){
  const $=id=>document.getElementById(id);
  function mount(){
    const form=$('orderForm'), note=$('f_note')?.closest('.field');
    if(!form||!note||$('f_outsourceCompany')) return;
    const box=document.createElement('div');
    box.className='quote-outsource-grid';
    box.innerHTML=`<div class="field"><label>外注先</label><input type="text" id="f_outsourceCompany" placeholder="例 ○○工業"></div><div class="field"><label>外注価格（円）</label><input type="number" id="f_outsourcePrice" min="0" step="1" placeholder="例 8500"></div>`;
    note.parentNode.insertBefore(box,note);

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
    form.addEventListener('reset',()=>setTimeout(()=>{$('f_outsourceCompany').value='';$('f_outsourcePrice').value='';},0));
  }
  async function save(id){
    if(!window.supabaseClient||!id)return;
    const company=$('f_outsourceCompany')?.value.trim()||null;
    const raw=$('f_outsourcePrice')?.value;
    const price=raw===''?null:Number(raw);
    const {error}=await supabaseClient.from('estimates').update({outsource_company:company,outsource_price:price}).eq('id',Number(id));
    if(error) console.error('外注情報保存エラー',error);
  }
  async function load(id){
    if(!window.supabaseClient||!id)return;
    const {data,error}=await supabaseClient.from('estimates').select('outsource_company,outsource_price').eq('id',Number(id)).maybeSingle();
    if(error)return console.error('外注情報読込エラー',error);
    if($('f_outsourceCompany'))$('f_outsourceCompany').value=data?.outsource_company||'';
    if($('f_outsourcePrice'))$('f_outsourcePrice').value=data?.outsource_price??'';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();