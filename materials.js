'use strict';
const $=id=>document.getElementById(id);
const fmt=n=>(Number(n)||0).toLocaleString('ja-JP');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>{const d=new Date();const z=d.getTimezoneOffset();return new Date(d.getTime()-z*60000).toISOString().slice(0,10)};
let materials=[],prices=[],moves=[];

const MATERIAL_PRESETS={
  '金属板':[
    {name:'アルミ A1050',spec:['A1050'],unit:'枚',form:'板'},
    {name:'アルミ A1100',spec:['A1100'],unit:'枚',form:'板'},
    {name:'ステンレス SUS304',spec:['SUS304','SUS304 2B','SUS304 HL'],unit:'枚',form:'板'},
    {name:'ステンレス SUS430',spec:['SUS430'],unit:'枚',form:'板'},
    {name:'真鍮 C2801',spec:['C2801'],unit:'枚',form:'板'},
    {name:'カラーアルマイト',spec:['黒','赤','青','金','銀','その他'],unit:'枚',form:'板'},
    {name:'その他',spec:['その他'],unit:'枚',form:'板'}
  ],
  '樹脂板':[
    {name:'アクリル',spec:['透明','白','黒','その他'],unit:'枚',form:'板'},
    {name:'塩ビ板',spec:['白','透明','その他'],unit:'枚',form:'板'},
    {name:'ポリカーボネート',spec:['透明','白','その他'],unit:'枚',form:'板'},
    {name:'その他',spec:['その他'],unit:'枚',form:'板'}
  ],
  'シール・ラベル':[
    {name:'上質紙',spec:['上質紙55','上質紙70','上質紙90'],unit:'巻',form:'100m巻'},
    {name:'アート紙',spec:['アート紙'],unit:'巻',form:'100m巻'},
    {name:'ミラーコート紙',spec:['ミラーコート紙'],unit:'巻',form:'100m巻'},
    {name:'白PET',spec:['白PET 25μ','白PET 50μ'],unit:'巻',form:'100m巻'},
    {name:'透明PET',spec:['透明PET 25μ','透明PET 50μ'],unit:'巻',form:'100m巻'},
    {name:'PET消銀',spec:['PET消銀 50μ'],unit:'巻',form:'100m巻'},
    {name:'発泡PET',spec:['発泡PET 50μ'],unit:'巻',form:'100m巻'},
    {name:'ユポ',spec:['ユポ 80μ'],unit:'巻',form:'100m巻'},
    {name:'塩ビ白',spec:['塩ビ白 80μ'],unit:'巻',form:'100m巻'},
    {name:'その他',spec:['その他'],unit:'巻',form:'100m巻'}
  ],
  'ラミネート':[
    {name:'PET透明ラミ',spec:['PET透明 16μ','PET透明 25μ 艶あり','PET透明 25μ 艶消し'],unit:'巻',form:'100m巻'},
    {name:'その他',spec:['その他'],unit:'巻',form:'100m巻'}
  ],
  'インキ・溶剤':[
    {name:'シンナー',spec:['標準シンナー','遅乾シンナー','速乾シンナー','その他'],unit:'缶',form:'16kg缶'},
    {name:'スクリーンインキ',spec:['黒','白','赤','青','黄','その他'],unit:'缶',form:'1kg缶'},
    {name:'洗浄溶剤',spec:['標準','その他'],unit:'缶',form:'16kg缶'},
    {name:'その他',spec:['その他'],unit:'缶',form:'16kg缶'}
  ],
  'その他':[{name:'その他',spec:['その他'],unit:'個',form:'その他'}]
};

function presetForSelection(){
  const cat=$('mm_category').value;
  return (MATERIAL_PRESETS[cat]||[]).find(x=>x.name===$('mm_name').value)||null;
}
function refreshMaterialNames(){
  const cat=$('mm_category').value;
  const list=MATERIAL_PRESETS[cat]||[];
  $('mm_name').innerHTML=list.map(x=>`<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('');
  refreshSpecs();
}
function refreshSpecs(){
  const p=presetForSelection();
  const specs=p?.spec||['その他'];
  $('mm_spec').innerHTML=specs.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
  const isOther=$('mm_name').value==='その他';
  $('mm_name_other_wrap').classList.toggle('hidden',!isOther);
  const specOther=$('mm_spec').value==='その他';
  $('mm_spec_other_wrap').classList.toggle('hidden',!specOther);
  if(p){$('mm_stock_unit').value=p.unit;$('mm_purchase_form').value=p.form}
  if($('mm_category').value==='シール・ラベル'||$('mm_category').value==='ラミネート'){
    if(!$('mm_size_preset').value)$('mm_size_preset').value='roll300';
  }
  applySizePreset();
}
function applySizePreset(){
  const v=$('mm_size_preset').value;
  let w='',l='',u='mm';
  if(v.includes('x')){[w,l]=v.split('x');u='mm'}
  else if(v.startsWith('roll')){w=v.replace('roll','');l='100';u='m'}
  const other=v==='other';
  $('mm_size_other_wrap').classList.toggle('hidden',!other);
  $('mm_length_wrap').classList.toggle('hidden',!other);
  $('mm_length_unit_wrap').classList.toggle('hidden',!other);
  if(!other){$('mm_width').value=w;$('mm_length').value=l;$('mm_length_unit').value=u}
}
function materialNameValue(){return $('mm_name').value==='その他'?$('mm_name_other').value.trim():$('mm_name').value}
function specValue(){return $('mm_spec').value==='その他'?$('mm_spec_other').value.trim():$('mm_spec').value}

async function currentEmail(){const {data:{user}}=await supabaseClient.auth.getUser();return user?.email||''}
async function requireAuth(){const {data:{session}}=await supabaseClient.auth.getSession();if(!session){$('materialAuth').innerHTML='この画面はログインが必要です。<br><br><a class="btn btn-primary" href="index.html">見積管理でログイン</a>';return false}$('materialAuth').style.display='none';$('materialApp').style.display='block';return true}
function latestPriceFor(id){return prices.filter(p=>String(p.material_id)===String(id)).sort((a,b)=>(b.effective_from||'').localeCompare(a.effective_from||'')||Number(b.id)-Number(a.id))[0]||null}
function stockFor(id){const rows=moves.filter(x=>String(x.material_id)===String(id)).sort((a,b)=>(a.movement_date||'').localeCompare(b.movement_date||'')||Number(a.id)-Number(b.id));let s=0;for(const x of rows){const q=Number(x.quantity)||0;if(x.movement_type==='in')s+=q;else if(x.movement_type==='out')s-=q;else if(x.movement_type==='adjust')s=q}return s}
function unitValue(m,p){if(!p)return 0;if(p.price_basis==='kg'&&m.unit_weight_kg)return Number(p.price)*Number(m.unit_weight_kg);return Number(p.price)||0}
async function loadAll(){const [a,b,c]=await Promise.all([supabaseClient.from('materials').select('*').eq('active',true).order('name'),supabaseClient.from('material_prices').select('*').order('effective_from',{ascending:false}),supabaseClient.from('inventory_movements').select('*').order('movement_date',{ascending:false}).order('id',{ascending:false})]);if(a.error||b.error||c.error){console.error(a.error||b.error||c.error);alert('材料データの読み込みに失敗しました');return}materials=a.data||[];prices=b.data||[];moves=c.data||[];renderAll()}
function renderAll(){renderList();renderSelect();renderHistory();renderSummary()}
function renderSummary(){let alerts=0,value=0;for(const m of materials){const s=stockFor(m.id);if(Number(m.reorder_point)>0&&s<=Number(m.reorder_point))alerts++;value+=s*unitValue(m,latestPriceFor(m.id))}$('mSumCount').textContent=materials.length;$('mSumAlert').textContent=alerts;$('mSumValue').textContent=fmt(Math.round(value))+'円'}
function renderList(){const q=$('mSearch').value.trim().toLowerCase();const list=materials.filter(m=>[m.name,m.category,m.spec,m.supplier,m.purchase_form].join(' ').toLowerCase().includes(q));$('mList').innerHTML=list.length?list.map(m=>{const s=stockFor(m.id),p=latestPriceFor(m.id),alert=Number(m.reorder_point)>0&&s<=Number(m.reorder_point);const spec=[m.category,m.spec,m.thickness_mm?`t${m.thickness_mm}`:'',m.width_mm&&m.length_value?`${m.width_mm}×${m.length_value}${m.length_unit||'mm'}`:'',m.purchase_form].filter(Boolean).join(' / ');return `<div class="material-list-item"><div class="material-top"><div><div class="material-name">${esc(m.name)} ${alert?'<span class="mini-badge alert">発注</span>':''}</div><div class="material-meta">${esc(spec)}${m.supplier?'<br>仕入先 '+esc(m.supplier):''}${m.reorder_point?'<br>発注点 '+esc(m.reorder_point)+' '+esc(m.stock_unit):''}</div>${p?`<div class="material-price">最新単価 ${fmt(p.price)}円 / ${p.price_basis==='kg'?'kg':esc(m.stock_unit)} <span class="material-note">(${esc(p.effective_from)})</span></div>`:'<div class="material-note">単価未登録</div>'}</div><div class="material-stock ${alert?'material-alert':''}">${fmt(s)} ${esc(m.stock_unit)}</div></div></div>`}).join(''):'<div class="empty-state">まだ材料がありません</div>'}
function renderSelect(){const html=materials.map(m=>`<option value="${m.id}">${esc(m.name)}（在庫 ${fmt(stockFor(m.id))} ${esc(m.stock_unit)}）</option>`).join('');$('mv_material').innerHTML=html||'<option value="">材料を先に登録してください</option>'}
function renderHistory(){$('mHistory').innerHTML=moves.length?moves.slice(0,200).map(x=>{const m=materials.find(y=>String(y.id)===String(x.material_id));const lab=x.movement_type==='in'?'入庫':x.movement_type==='out'?'出庫':'棚卸';const sign=x.movement_type==='out'?'-':x.movement_type==='in'?'+':'→ ';return `<div class="history-row"><div>${esc(x.movement_date)}</div><div>${lab}</div><div><b>${esc(m?.name||'削除済み材料')}</b><div class="material-note">${esc(x.destination||'')}${x.memo?' / '+esc(x.memo):''}</div></div><div class="hr-qty"><b>${sign}${fmt(x.quantity)} ${esc(m?.stock_unit||'')}</b></div></div>`}).join(''):'<div class="empty-state">履歴はまだありません</div>'}

document.querySelectorAll('.material-tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.material-tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.material-panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('mp-'+b.dataset.tab).classList.add('active')}));
$('mSearch').addEventListener('input',renderList);
$('mm_category').addEventListener('change',refreshMaterialNames);
$('mm_name').addEventListener('change',refreshSpecs);
$('mm_spec').addEventListener('change',()=>$('mm_spec_other_wrap').classList.toggle('hidden',$('mm_spec').value!=='その他'));
$('mm_size_preset').addEventListener('change',applySizePreset);
$('mm_price_date').value=today();$('mv_date').value=today();refreshMaterialNames();
$('mm_clear').onclick=()=>{$('mm_category').value='金属板';refreshMaterialNames();$('mm_name_other').value='';$('mm_spec_other').value='';$('mm_size_preset').value='';applySizePreset();['mm_weight','mm_supplier','mm_location','mm_initial','mm_price','mm_notes'].forEach(id=>$(id).value='');$('mm_reorder').value='0';$('mm_price_date').value=today()};
$('mm_save').onclick=async()=>{const name=materialNameValue(),stockUnit=$('mm_stock_unit').value;if(!name||!stockUnit){alert('材料名と在庫単位は必須です');return}const row={name,category:$('mm_category').value||null,spec:specValue()||null,thickness_mm:$('mm_thickness').value||null,width_mm:$('mm_width').value||null,length_value:$('mm_length').value||null,length_unit:$('mm_length_unit').value,purchase_form:$('mm_purchase_form').value||null,stock_unit:stockUnit,unit_weight_kg:$('mm_weight').value||null,supplier:$('mm_supplier').value.trim()||null,reorder_point:Number($('mm_reorder').value)||0,storage_location:$('mm_location').value.trim()||null,notes:$('mm_notes').value.trim()||null};const {data,error}=await supabaseClient.from('materials').insert(row).select().single();if(error){console.error(error);alert('材料登録に失敗しました');return}const price=Number($('mm_price').value)||0;if(price>0){const {error:e}=await supabaseClient.from('material_prices').insert({material_id:data.id,effective_from:$('mm_price_date').value||today(),price,price_basis:$('mm_price_basis').value,supplier:row.supplier});if(e){console.error(e);alert('材料は登録しましたが単価登録に失敗しました')}}const initial=Number($('mm_initial').value)||0;if(initial!==0){const email=await currentEmail();const {error:e}=await supabaseClient.from('inventory_movements').insert({material_id:data.id,movement_date:today(),movement_type:'adjust',quantity:initial,destination:'初期登録',memo:'初期在庫',created_by:email||null});if(e)console.error(e)}alert('材料を登録しました');$('mm_clear').click();await loadAll()};
$('mv_save').onclick=async()=>{const materialId=$('mv_material').value,qty=Number($('mv_qty').value);if(!materialId||!Number.isFinite(qty)){alert('材料と数量を入力してください');return}const email=await currentEmail();const row={material_id:Number(materialId),movement_date:$('mv_date').value||today(),movement_type:$('mv_type').value,quantity:qty,destination:$('mv_destination').value.trim()||null,unit_price:Number($('mv_price').value)||null,memo:$('mv_memo').value.trim()||null,created_by:email||null};const {error}=await supabaseClient.from('inventory_movements').insert(row);if(error){console.error(error);alert('登録に失敗しました');return}if(row.movement_type==='in'&&row.unit_price){const m=materials.find(x=>String(x.id)===String(materialId));await supabaseClient.from('material_prices').insert({material_id:Number(materialId),effective_from:row.movement_date,price:row.unit_price,price_basis:'stock_unit',supplier:m?.supplier||null,notes:'入庫時単価'})}alert('入出庫を登録しました');$('mv_qty').value='';$('mv_destination').value='';$('mv_price').value='';$('mv_memo').value='';await loadAll()};
(async()=>{if(await requireAuth())await loadAll()})();