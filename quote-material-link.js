'use strict';

let QUOTE_MATERIALS = [];
let QUOTE_MATERIAL_PRICES = [];
let QUOTE_MATERIAL_SNAPSHOT = null;
let QUOTE_MATERIAL_LOAD_TIMER = null;

function qNum(v){ const n=Number(v); return Number.isFinite(n)?n:0; }
function quoteLatestPrice(materialId){ return QUOTE_MATERIAL_PRICES.filter(p=>String(p.material_id)===String(materialId)).sort((a,b)=>String(b.effective_from||'').localeCompare(String(a.effective_from||''))||Number(b.id)-Number(a.id))[0]||null; }
function parsePurchaseDimensions(material){
  if(material.width_mm&&material.length_value){ return {widthMm:qNum(material.width_mm),lengthMm:material.length_unit==='m'?qNum(material.length_value)*1000:qNum(material.length_value)}; }
  const text=String(material.purchase_form||''); let m=text.match(/(\d+(?:\.\d+)?)\s*[×xX]\s*(\d+(?:\.\d+)?)\s*板/); if(m)return{widthMm:qNum(m[1]),lengthMm:qNum(m[2])};
  m=text.match(/幅\s*(\d+(?:\.\d+)?)\s*mm\s*[×xX]\s*(\d+(?:\.\d+)?)\s*m\s*巻/); if(m)return{widthMm:qNum(m[1]),lengthMm:qNum(m[2])*1000}; return null;
}
function materialLabel(m){ const p=[m.name]; if(m.spec&&m.spec!==m.name)p.push(m.spec); if(m.thickness_mm!=null)p.push('t'+m.thickness_mm); if(m.purchase_form)p.push(m.purchase_form); return p.join(' / '); }
function mapMaterialToLegacy(m){ const name=String(m.name||''),spec=String(m.spec||''); if(name.includes('カラーアルマイト')||String(m.surface_finish||'').includes('カラーアルマイト'))return'カラーアルマイト'; if(name.includes('アルミ')||/^A1\d{3}/.test(spec))return'アルミ'; if(name.includes('ステンレス')||/^SUS/.test(spec))return'ステンレス'; if(name.includes('真鍮')||/^C2801/.test(spec))return'真鍮'; return'その他'; }
function calculateQuoteMaterialSnapshot(){
  const s=document.getElementById('f_materialMaster'),info=document.getElementById('materialMasterInfo'); if(!s||!s.value){QUOTE_MATERIAL_SNAPSHOT=null;if(info)info.innerHTML='材料マスターを使わない場合は、下の材質・板厚を従来どおり入力できます。';return;}
  const m=QUOTE_MATERIALS.find(x=>String(x.id)===String(s.value)); if(!m)return; const p=quoteLatestPrice(m.id),w=qNum(document.getElementById('f_sizeH')?.value),h=qNum(document.getElementById('f_sizeV')?.value),qty=Math.max(1,qNum(document.getElementById('f_quantity')?.value)||1),dims=parsePurchaseDimensions(m); let cost=null,detail='';
  if(p&&w>0&&h>0&&dims?.widthMm>0&&dims?.lengthMm>0){ const ratio=(w*h*qty)/(dims.widthMm*dims.lengthMm); if(p.price_basis==='kg'&&qNum(m.unit_weight_kg)>0){const kg=ratio*qNum(m.unit_weight_kg);cost=kg*qNum(p.price);detail=`必要重量 約${kg.toFixed(3)}kg`;}else{cost=ratio*qNum(p.price);detail=`購入単位の面積比 約${(ratio*100).toFixed(2)}%`;}}
  QUOTE_MATERIAL_SNAPSHOT={materialId:m.id,priceId:p?.id||null,unitPrice:p?qNum(p.price):null,estimatedCost:cost==null?null:Math.round(cost)};
  if(info){const pt=p?`最新単価：<b>${qNum(p.price).toLocaleString('ja-JP')}円</b> / ${p.price_basis==='kg'?'kg':m.stock_unit}　適用日 ${p.effective_from}`:'<b>単価未登録</b>';const ct=cost==null?'サイズ・数量・購入寸法などが揃うと材料原価の参考値を表示します。':`材料原価（ロス未加算）：<b>${Math.round(cost).toLocaleString('ja-JP')}円</b>　${detail}`;info.innerHTML=`${pt}<br>${ct}`;}
}
function applyMasterMaterial(){ const s=document.getElementById('f_materialMaster'); if(!s||!s.value){calculateQuoteMaterialSnapshot();return;} const m=QUOTE_MATERIALS.find(x=>String(x.id)===String(s.value)); if(!m)return; const legacy=mapMaterialToLegacy(m),mat=document.getElementById('f_material'),other=document.getElementById('f_materialOther'),th=document.getElementById('f_thickness'); if(mat){mat.value=legacy;mat.dispatchEvent(new Event('change',{bubbles:true}));} if(other&&legacy==='その他')other.value=m.name||m.spec||''; if(th&&m.thickness_mm!=null)th.value=m.thickness_mm; calculateQuoteMaterialSnapshot(); }

async function loadQuoteMaterials(){
  const s=document.getElementById('f_materialMaster');
  if(!s || !window.supabaseClient) return;

  if(QUOTE_MATERIAL_LOAD_TIMER){ clearTimeout(QUOTE_MATERIAL_LOAD_TIMER); QUOTE_MATERIAL_LOAD_TIMER=null; }
  s.innerHTML='<option value="">材料マスターを読み込み中...</option>';

  try{
    // セッション復元と材料読込の競合を避けるため、先に「ログイン有無」で止めず
    // Supabaseへ直接問い合わせる。ログイン復元後なら自動的にJWTが付きます。
    const [mr,pr]=await Promise.all([
      supabaseClient.from('materials').select('*').eq('active',true).order('category').order('name'),
      supabaseClient.from('material_prices').select('*').order('effective_from',{ascending:false})
    ]);

    if(mr.error||pr.error){
      const err=mr.error||pr.error;
      console.error('材料マスター読込エラー',err);
      const {data:{session}}=await supabaseClient.auth.getSession();
      if(!session){
        s.innerHTML='<option value="">ログイン確認中...</option>';
        QUOTE_MATERIAL_LOAD_TIMER=setTimeout(loadQuoteMaterials,700);
      }else{
        s.innerHTML='<option value="">材料マスターの読込に失敗しました</option>';
      }
      return;
    }

    QUOTE_MATERIALS=mr.data||[];
    QUOTE_MATERIAL_PRICES=pr.data||[];
    s.innerHTML='<option value="">材料マスターを使わない</option>'+QUOTE_MATERIALS.map(m=>`<option value="${m.id}">${materialLabel(m)}</option>`).join('');
    const info=document.getElementById('materialMasterInfo');
    if(!QUOTE_MATERIALS.length&&info)info.innerHTML='材料マスターはまだ0件です。材料・在庫で登録すると、ここから選べるようになります。';
    else if(info)info.innerHTML='材料マスターから選ぶと、材質・板厚と登録済み単価を自動で反映します。';
  }catch(err){
    console.error('材料マスター読込例外',err);
    s.innerHTML='<option value="">材料マスターを再読み込み中...</option>';
    QUOTE_MATERIAL_LOAD_TIMER=setTimeout(loadQuoteMaterials,1000);
  }
}

async function saveQuoteMaterialSnapshot(id){ if(!QUOTE_MATERIAL_SNAPSHOT||!id)return;const s=QUOTE_MATERIAL_SNAPSHOT;const {error}=await supabaseClient.from('estimates').update({material_id:s.materialId,material_price_id:s.priceId,material_unit_price_snapshot:s.unitPrice,material_cost_snapshot:s.estimatedCost}).eq('id',Number(id));if(error)console.error('材料単価スナップショット保存エラー',error); }
function installQuoteMaterialIntegration(){ const old=document.getElementById('f_material');if(!old||document.getElementById('f_materialMaster'))return;const row=old.closest('.row2');if(!row)return;const box=document.createElement('div');box.className='field';box.style.marginBottom='12px';box.innerHTML='<label>材料マスターから選択<span class="opt">推奨</span></label><select id="f_materialMaster"><option value="">読み込み中...</option></select><div id="materialMasterInfo" style="font-size:12px;line-height:1.65;margin-top:7px;opacity:.78;">材料マスターを読み込んでいます。</div>';row.parentNode.insertBefore(box,row);document.getElementById('f_materialMaster').addEventListener('change',applyMasterMaterial);['f_sizeV','f_sizeH','f_quantity'].forEach(id=>document.getElementById(id)?.addEventListener('input',calculateQuoteMaterialSnapshot));if(typeof StorageAPI!=='undefined'&&!StorageAPI.__materialLinked){const add=StorageAPI.add.bind(StorageAPI);StorageAPI.add=async function(o){const saved=await add(o);await saveQuoteMaterialSnapshot(saved&&saved.id);return saved;};const upd=StorageAPI.update.bind(StorageAPI);StorageAPI.update=async function(id,p,e){const r=await upd(id,p,e);if(r&&!r.conflict)await saveQuoteMaterialSnapshot(id);return r;};StorageAPI.__materialLinked=true;}loadQuoteMaterials(); }
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installQuoteMaterialIntegration);else setTimeout(installQuoteMaterialIntegration,0);

// INITIAL_SESSION / SIGNED_IN / TOKEN_REFRESHED のどれでも再読込する。
supabaseClient.auth.onAuthStateChange((_e,s)=>{ if(s) setTimeout(loadQuoteMaterials,50); });
window.addEventListener('pageshow',()=>setTimeout(loadQuoteMaterials,100));
document.addEventListener('visibilitychange',()=>{ if(!document.hidden)setTimeout(loadQuoteMaterials,100); });
