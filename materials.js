'use strict';
const $=id=>document.getElementById(id);
const fmt=n=>(Number(n)||0).toLocaleString('ja-JP');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>{const d=new Date();const z=d.getTimezoneOffset();return new Date(d.getTime()-z*60000).toISOString().slice(0,10)};
let materials=[], prices=[], moves=[];

async function currentEmail(){const {data:{user}}=await supabaseClient.auth.getUser();return user?.email||''}
async function requireAuth(){
  const {data:{session}}=await supabaseClient.auth.getSession();
  if(!session){$('materialAuth').innerHTML='この画面はログインが必要です。<br><br><a class="btn btn-primary" href="index.html">見積管理でログイン</a>';return false}
  $('materialAuth').style.display='none';$('materialApp').style.display='block';return true;
}
function latestPriceFor(id){return prices.filter(p=>String(p.material_id)===String(id)).sort((a,b)=>(b.effective_from||'').localeCompare(a.effective_from||'')||Number(b.id)-Number(a.id))[0]||null}
function stockFor(id){
  const rows=moves.filter(x=>String(x.material_id)===String(id)).sort((a,b)=>(a.movement_date||'').localeCompare(b.movement_date||'')||Number(a.id)-Number(b.id));
  let s=0; for(const x of rows){const q=Number(x.quantity)||0;if(x.movement_type==='in')s+=q;else if(x.movement_type==='out')s-=q;else if(x.movement_type==='adjust')s=q} return s;
}
function unitValue(m,p){if(!p)return 0;if(p.price_basis==='kg'&&m.unit_weight_kg)return Number(p.price)*Number(m.unit_weight_kg);return Number(p.price)||0}
async function loadAll(){
  const [a,b,c]=await Promise.all([
    supabaseClient.from('materials').select('*').eq('active',true).order('name'),
    supabaseClient.from('material_prices').select('*').order('effective_from',{ascending:false}),
    supabaseClient.from('inventory_movements').select('*').order('movement_date',{ascending:false}).order('id',{ascending:false})
  ]);
  if(a.error||b.error||c.error){console.error(a.error||b.error||c.error);alert('材料データの読み込みに失敗しました');return}
  materials=a.data||[];prices=b.data||[];moves=c.data||[];renderAll();
}
function renderAll(){renderList();renderSelect();renderHistory();renderSummary()}
function renderSummary(){
  let alerts=0,value=0; for(const m of materials){const s=stockFor(m.id);if(Number(m.reorder_point)>0&&s<=Number(m.reorder_point))alerts++;value+=s*unitValue(m,latestPriceFor(m.id))}
  $('mSumCount').textContent=materials.length;$('mSumAlert').textContent=alerts;$('mSumValue').textContent=fmt(Math.round(value))+'円';
}
function renderList(){
  const q=$('mSearch').value.trim().toLowerCase();const list=materials.filter(m=>[m.name,m.category,m.spec,m.supplier,m.purchase_form].join(' ').toLowerCase().includes(q));
  $('mList').innerHTML=list.length?list.map(m=>{const s=stockFor(m.id),p=latestPriceFor(m.id),alert=Number(m.reorder_point)>0&&s<=Number(m.reorder_point);const spec=[m.category,m.spec,m.thickness_mm?`t${m.thickness_mm}`:'',m.width_mm&&m.length_value?`${m.width_mm}×${m.length_value}${m.length_unit||'mm'}`:'',m.purchase_form].filter(Boolean).join(' / ');return `<div class="material-list-item"><div class="material-top"><div><div class="material-name">${esc(m.name)} ${alert?'<span class="mini-badge alert">発注</span>':''}</div><div class="material-meta">${esc(spec)}${m.supplier?'<br>仕入先 '+esc(m.supplier):''}${m.reorder_point?'<br>発注点 '+esc(m.reorder_point)+' '+esc(m.stock_unit):''}</div>${p?`<div class="material-price">最新単価 ${fmt(p.price)}円 / ${p.price_basis==='kg'?'kg':esc(m.stock_unit)} <span class="material-note">(${esc(p.effective_from)})</span></div>`:'<div class="material-note">単価未登録</div>'}</div><div class="material-stock ${alert?'material-alert':''}">${fmt(s)} ${esc(m.stock_unit)}</div></div></div>`}).join(''):'<div class="empty-state">まだ材料がありません</div>';
}
function renderSelect(){const html=materials.map(m=>`<option value="${m.id}">${esc(m.name)}（在庫 ${fmt(stockFor(m.id))} ${esc(m.stock_unit)}）</option>`).join('');$('mv_material').innerHTML=html||'<option value="">材料を先に登録してください</option>'}
function renderHistory(){
  $('mHistory').innerHTML=moves.length?moves.slice(0,200).map(x=>{const m=materials.find(y=>String(y.id)===String(x.material_id));const lab=x.movement_type==='in'?'入庫':x.movement_type==='out'?'出庫':'棚卸';const sign=x.movement_type==='out'?'-':x.movement_type==='in'?'+':'→ ';return `<div class="history-row"><div>${esc(x.movement_date)}</div><div>${lab}</div><div><b>${esc(m?.name||'削除済み材料')}</b><div class="material-note">${esc(x.destination||'')}${x.memo?' / '+esc(x.memo):''}</div></div><div class="hr-qty"><b>${sign}${fmt(x.quantity)} ${esc(m?.stock_unit||'')}</b></div></div>`}).join(''):'<div class="empty-state">履歴はまだありません</div>';
}

document.querySelectorAll('.material-tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.material-tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.material-panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('mp-'+b.dataset.tab).classList.add('active')}));
$('mSearch').addEventListener('input',renderList);
$('mm_price_date').value=today();$('mv_date').value=today();
$('mm_clear').onclick=()=>{['mm_name','mm_category','mm_spec','mm_thickness','mm_width','mm_length','mm_purchase_form','mm_stock_unit','mm_weight','mm_supplier','mm_reorder','mm_location','mm_initial','mm_price','mm_notes'].forEach(id=>$(id).value='');$('mm_price_date').value=today()};
$('mm_save').onclick=async()=>{
  const name=$('mm_name').value.trim(),stockUnit=$('mm_stock_unit').value.trim();if(!name||!stockUnit){alert('材料名と在庫単位は必須です');return}
  const row={name,category:$('mm_category').value.trim()||null,spec:$('mm_spec').value.trim()||null,thickness_mm:$('mm_thickness').value||null,width_mm:$('mm_width').value||null,length_value:$('mm_length').value||null,length_unit:$('mm_length_unit').value,purchase_form:$('mm_purchase_form').value.trim()||null,stock_unit:stockUnit,unit_weight_kg:$('mm_weight').value||null,supplier:$('mm_supplier').value.trim()||null,reorder_point:Number($('mm_reorder').value)||0,storage_location:$('mm_location').value.trim()||null,notes:$('mm_notes').value.trim()||null};
  const {data,error}=await supabaseClient.from('materials').insert(row).select().single();if(error){console.error(error);alert('材料登録に失敗しました');return}
  const price=Number($('mm_price').value)||0;if(price>0){const {error:e}=await supabaseClient.from('material_prices').insert({material_id:data.id,effective_from:$('mm_price_date').value||today(),price,price_basis:$('mm_price_basis').value,supplier:row.supplier});if(e){console.error(e);alert('材料は登録しましたが単価登録に失敗しました')}}
  const initial=Number($('mm_initial').value)||0;if(initial!==0){const email=await currentEmail();const {error:e}=await supabaseClient.from('inventory_movements').insert({material_id:data.id,movement_date:today(),movement_type:'adjust',quantity:initial,destination:'初期登録',memo:'初期在庫',created_by:email||null});if(e)console.error(e)}
  alert('材料を登録しました');$('mm_clear').click();await loadAll();
};
$('mv_save').onclick=async()=>{
  const materialId=$('mv_material').value,qty=Number($('mv_qty').value);if(!materialId||!Number.isFinite(qty)){alert('材料と数量を入力してください');return}
  const email=await currentEmail();const row={material_id:Number(materialId),movement_date:$('mv_date').value||today(),movement_type:$('mv_type').value,quantity:qty,destination:$('mv_destination').value.trim()||null,unit_price:Number($('mv_price').value)||null,memo:$('mv_memo').value.trim()||null,created_by:email||null};
  const {error}=await supabaseClient.from('inventory_movements').insert(row);if(error){console.error(error);alert('登録に失敗しました');return}
  if(row.movement_type==='in'&&row.unit_price){const m=materials.find(x=>String(x.id)===String(materialId));await supabaseClient.from('material_prices').insert({material_id:Number(materialId),effective_from:row.movement_date,price:row.unit_price,price_basis:'stock_unit',supplier:m?.supplier||null,notes:'入庫時単価'})}
  alert('入出庫を登録しました');$('mv_qty').value='';$('mv_destination').value='';$('mv_price').value='';$('mv_memo').value='';await loadAll();
};

(async()=>{if(await requireAuth())await loadAll()})();