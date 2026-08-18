'use strict';
const $=id=>document.getElementById(id);
const fmt=n=>(Number(n)||0).toLocaleString('ja-JP');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>{const d=new Date();const z=d.getTimezoneOffset();return new Date(d.getTime()-z*60000).toISOString().slice(0,10)};
let materials=[],prices=[],moves=[];

const CATALOG={
  '金属板':{
    materials:{
      'ステンレス':{specs:['SUS304','SUS430','SUS316','その他'],thickness:['0.3','0.5','0.8','1.0','1.5','2.0','その他'],colors:['銀色'],surface:['なし','梨地','ヘアライン','鏡面','その他'],purchase:['1000×2000板','1000×1000板','500×1000板','その他'],unit:'枚'},
      'アルミニウム':{specs:['A1050P','A1080P','A1070P','A1100P','A1200P','その他'],thickness:['0.1','0.15','0.2','0.3','0.5','0.8','1.0','1.5','2.0','その他'],colors:['銀色','白アルマイト','黒アルマイト','カラーアルマイト','その他'],surface:['なし','梨地','ヘアライン','アルマイト','カラーアルマイト','その他'],purchase:['1000×2000板','1000×1000板','500×1000板','その他'],unit:'枚'},
      '真鍮':{specs:['C2801P','その他'],thickness:['0.3','0.5','0.8','1.0','1.5','その他'],colors:['金色'],surface:['なし','梨地','ヘアライン','その他'],purchase:['1000×2000板','1000×1000板','500×1000板','その他'],unit:'枚'},
      'その他':{specs:['その他'],thickness:['0.1','0.15','0.2','0.3','0.5','0.8','1.0','1.5','2.0','その他'],colors:['その他'],surface:['なし','その他'],purchase:['その他'],unit:'枚'}
    }
  },
  '樹脂板・フィルム':{
    materials:{
      'PET':{specs:['一般PET','ハードコートPET','ルミラー','タフトップ','その他'],thickness:['0.1','0.125','0.188','0.25','その他'],colors:['透明','白','その他'],surface:['なし','ハードコート','その他'],purchase:['シート','ロール','その他'],unit:'枚'},
      'ポリカーボネート':{specs:['一般PC','カーボグラス','ユーピロン','その他'],thickness:['0.18','0.25','0.3','0.5','1.0','その他'],colors:['透明','白','その他'],surface:['なし','マット','シボ','その他'],purchase:['シート','ロール','その他'],unit:'枚'},
      'PVC':{specs:['一般PVC','その他'],thickness:['0.3','0.5','1.0','その他'],colors:['透明','白','その他'],surface:['なし','その他'],purchase:['シート','ロール','その他'],unit:'枚'},
      'アクリル':{specs:['透明','白','乳半','その他'],thickness:['0.5','1.0','1.5','2.0','その他'],colors:['透明','白','乳半','その他'],surface:['なし','その他'],purchase:['1000×2000板','その他'],unit:'枚'},
      'その他':{specs:['その他'],thickness:['0.1','0.125','0.18','0.188','0.25','0.3','0.5','1.0','2.0','その他'],colors:['透明','白','その他'],surface:['なし','その他'],purchase:['その他'],unit:'枚'}
    }
  },
  'シール・ラベル':{
    materials:{
      '上質紙':{specs:['上質紙','その他'],thickness:['その他'],colors:['白','その他'],surface:['なし'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻','その他'],unit:'巻'},
      'アート紙':{specs:['アート紙','その他'],thickness:['その他'],colors:['白','その他'],surface:['なし'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻','その他'],unit:'巻'},
      'ミラーコート紙':{specs:['ミラーコート紙','その他'],thickness:['その他'],colors:['白','その他'],surface:['光沢','その他'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻','その他'],unit:'巻'},
      '白PET':{specs:['白PET','その他'],thickness:['0.025','0.05','その他'],colors:['白'],surface:['なし','マット','その他'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻','その他'],unit:'巻'},
      '透明PET':{specs:['透明PET','その他'],thickness:['0.025','0.05','その他'],colors:['透明'],surface:['なし','マット','その他'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻','その他'],unit:'巻'},
      'PET消銀':{specs:['PET消銀','その他'],thickness:['0.05','その他'],colors:['銀色'],surface:['消銀','その他'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻','その他'],unit:'巻'},
      '発泡PET':{specs:['発泡PET','その他'],thickness:['0.05','その他'],colors:['白','その他'],surface:['なし','その他'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻','その他'],unit:'巻'},
      'ユポ':{specs:['ユポ','その他'],thickness:['0.08','その他'],colors:['白','その他'],surface:['なし','その他'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻','その他'],unit:'巻'},
      '塩ビ白':{specs:['塩ビ白','その他'],thickness:['0.08','その他'],colors:['白'],surface:['なし','その他'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻','その他'],unit:'巻'},
      'その他':{specs:['その他'],thickness:['その他'],colors:['白','透明','銀色','その他'],surface:['なし','その他'],purchase:['その他'],unit:'巻'}
    }
  },
  'ラミネート':{
    materials:{
      'PET透明16μ':{specs:['PET透明16μ'],thickness:['0.016'],colors:['透明'],surface:['艶あり'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻','その他'],unit:'巻'},
      'PET25μ 艶あり':{specs:['PET#25'],thickness:['0.025'],colors:['透明'],surface:['艶あり'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻','その他'],unit:'巻'},
      'PET25μ 艶消し':{specs:['PET#25'],thickness:['0.025'],colors:['透明'],surface:['艶消し'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻','その他'],unit:'巻'},
      'その他':{specs:['その他'],thickness:['その他'],colors:['透明','その他'],surface:['艶あり','艶消し','その他'],purchase:['その他'],unit:'巻'}
    }
  },
  'インキ・溶剤':{
    materials:{
      'シンナー':{specs:['シンナー','洗浄用シンナー','遅乾シンナー','速乾シンナー','その他'],thickness:['-'],colors:['-'],surface:['-'],purchase:['16kg缶','4L缶','1L缶','その他'],unit:'缶'},
      'スクリーンインキ':{specs:['スクリーンインキ','その他'],thickness:['-'],colors:['白','黒','赤','青','黄','緑','銀','その他'],surface:['-'],purchase:['1kg缶','4kg缶','その他'],unit:'缶'},
      'その他':{specs:['その他'],thickness:['-'],colors:['-'],surface:['-'],purchase:['その他'],unit:'個'}
    }
  },
  'その他':{materials:{'その他':{specs:['その他'],thickness:['その他'],colors:['その他'],surface:['その他'],purchase:['その他'],unit:'個'}}}
};
const ADHESIVES=['なし','一般強粘着','強粘着','超強粘着','再剥離','再貼付','冷食用','粗面用','その他'];
const LAMINATES=['なし','PET透明16μ','PET25μ 艶あり','PET25μ 艶消し','その他'];

async function currentEmail(){const {data:{user}}=await supabaseClient.auth.getUser();return user?.email||''}
async function requireAuth(){const {data:{session}}=await supabaseClient.auth.getSession();if(!session){$('materialAuth').innerHTML='この画面はログインが必要です。<br><br><a class="btn btn-primary" href="index.html">見積管理でログイン</a>';return false}$('materialAuth').style.display='none';$('materialApp').style.display='block';return true}
function fillSelect(el,arr,blank='選択してください'){el.innerHTML='<option value="">'+blank+'</option>'+arr.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('')}
function selectedDef(){const c=CATALOG[$('mm_category').value],m=c?.materials?.[$('mm_material').value];return m||null}
function refreshMaterials(){const c=CATALOG[$('mm_category').value];fillSelect($('mm_material'),c?Object.keys(c.materials):[]);refreshMaterialDetails()}
function refreshMaterialDetails(){const d=selectedDef();fillSelect($('mm_spec'),d?.specs||[]);fillSelect($('mm_thickness'),d?.thickness||[]);fillSelect($('mm_color'),d?.colors||[]);fillSelect($('mm_surface'),d?.surface||[]);fillSelect($('mm_purchase_form'),d?.purchase||[]);fillSelect($('mm_stock_unit'),d?[d.unit]:['枚','巻','缶','kg','個']);fillSelect($('mm_adhesive'),ADHESIVES);fillSelect($('mm_laminate'),LAMINATES);if(d){$('mm_stock_unit').value=d.unit}toggleCustoms()}
function toggleCustoms(){const isMat=$('mm_material').value==='その他';$('customMaterialWrap').classList.toggle('show',isMat);$('customSpecWrap').classList.toggle('show',$('mm_spec').value==='その他');$('customThicknessWrap').classList.toggle('show',$('mm_thickness').value==='その他');$('customPurchaseWrap').classList.toggle('show',$('mm_purchase_form').value==='その他')}
function initCatalog(){fillSelect($('mm_category'),Object.keys(CATALOG));fillSelect($('mm_adhesive'),ADHESIVES);fillSelect($('mm_laminate'),LAMINATES);$('mm_category').addEventListener('change',refreshMaterials);$('mm_material').addEventListener('change',refreshMaterialDetails);['mm_spec','mm_thickness','mm_purchase_form'].forEach(id=>$(id).addEventListener('change',toggleCustoms));}
function latestPriceFor(id){return prices.filter(p=>String(p.material_id)===String(id)).sort((a,b)=>(b.effective_from||'').localeCompare(a.effective_from||'')||Number(b.id)-Number(a.id))[0]||null}
function stockFor(id){const rows=moves.filter(x=>String(x.material_id)===String(id)).sort((a,b)=>(a.movement_date||'').localeCompare(b.movement_date||'')||Number(a.id)-Number(b.id));let s=0;for(const x of rows){const q=Number(x.quantity)||0;if(x.movement_type==='in')s+=q;else if(x.movement_type==='out')s-=q;else if(x.movement_type==='adjust')s=q}return s}
function unitValue(m,p){if(!p)return 0;if(p.price_basis==='kg'&&m.unit_weight_kg)return Number(p.price)*Number(m.unit_weight_kg);return Number(p.price)||0}
async function loadAll(){const [a,b,c]=await Promise.all([supabaseClient.from('materials').select('*').eq('active',true).order('name'),supabaseClient.from('material_prices').select('*').order('effective_from',{ascending:false}),supabaseClient.from('inventory_movements').select('*').order('movement_date',{ascending:false}).order('id',{ascending:false})]);if(a.error||b.error||c.error){console.error(a.error||b.error||c.error);alert('材料データの読み込みに失敗しました');return}materials=a.data||[];prices=b.data||[];moves=c.data||[];renderAll()}
function renderAll(){renderList();renderSelect();renderHistory();renderSummary()}
function renderSummary(){let alerts=0,value=0;for(const m of materials){const s=stockFor(m.id);if(Number(m.reorder_point)>0&&s<=Number(m.reorder_point))alerts++;value+=s*unitValue(m,latestPriceFor(m.id))}$('mSumCount').textContent=materials.length;$('mSumAlert').textContent=alerts;$('mSumValue').textContent=fmt(Math.round(value))+'円'}
function renderList(){const q=$('mSearch').value.trim().toLowerCase();const list=materials.filter(m=>[m.name,m.category,m.spec,m.supplier,m.purchase_form,m.surface_finish,m.adhesive_type,m.laminate_type].join(' ').toLowerCase().includes(q));$('mList').innerHTML=list.length?list.map(m=>{const s=stockFor(m.id),p=latestPriceFor(m.id),alert=Number(m.reorder_point)>0&&s<=Number(m.reorder_point);const spec=[m.category,m.spec,m.thickness_mm?`t${m.thickness_mm}`:'',m.color,m.surface_finish,m.adhesive_type&&m.adhesive_type!=='なし'?m.adhesive_type:'',m.laminate_type&&m.laminate_type!=='なし'?m.laminate_type:'',m.purchase_form].filter(Boolean).join(' / ');return `<div class="material-list-item"><div class="material-top"><div><div class="material-name">${esc(m.name)} ${alert?'<span class="mini-badge alert">発注</span>':''}</div><div class="material-meta">${esc(spec)}${m.supplier?'<br>仕入先 '+esc(m.supplier):''}${m.reorder_point?'<br>発注点 '+esc(m.reorder_point)+' '+esc(m.stock_unit):''}</div>${p?`<div class="material-price">最新単価 ${fmt(p.price)}円 / ${p.price_basis==='kg'?'kg':esc(m.stock_unit)} <span class="material-note">(${esc(p.effective_from)})</span></div>`:'<div class="material-note">単価未登録</div>'}</div><div class="material-stock ${alert?'material-alert':''}">${fmt(s)} ${esc(m.stock_unit)}</div></div></div>`}).join(''):'<div class="empty-state">まだ材料がありません</div>'}
function renderSelect(){const html=materials.map(m=>`<option value="${m.id}">${esc(m.name)}（在庫 ${fmt(stockFor(m.id))} ${esc(m.stock_unit)}）</option>`).join('');$('mv_material').innerHTML=html||'<option value="">材料を先に登録してください</option>'}
function renderHistory(){$('mHistory').innerHTML=moves.length?moves.slice(0,200).map(x=>{const m=materials.find(y=>String(y.id)===String(x.material_id));const lab=x.movement_type==='in'?'入庫':x.movement_type==='out'?'出庫':'棚卸';const sign=x.movement_type==='out'?'-':x.movement_type==='in'?'+':'→ ';return `<div class="history-row"><div>${esc(x.movement_date)}</div><div>${lab}</div><div><b>${esc(m?.name||'削除済み材料')}</b><div class="material-note">${esc(x.destination||'')}${x.memo?' / '+esc(x.memo):''}</div></div><div class="hr-qty"><b>${sign}${fmt(x.quantity)} ${esc(m?.stock_unit||'')}</b></div></div>`}).join(''):'<div class="empty-state">履歴はまだありません</div>'}

document.querySelectorAll('.material-tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.material-tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.material-panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('mp-'+b.dataset.tab).classList.add('active')}));
$('mSearch').addEventListener('input',renderList);$('mm_price_date').value=today();$('mv_date').value=today();
$('mm_clear').onclick=()=>{['mm_name_custom','mm_spec_custom','mm_thickness_custom','mm_weight','mm_supplier','mm_reorder','mm_location','mm_initial','mm_price','mm_notes','mm_purchase_custom'].forEach(id=>$(id).value='');$('mm_category').value='';refreshMaterials();$('mm_price_date').value=today()};
$('mm_save').onclick=async()=>{const d=selectedDef(),category=$('mm_category').value,material=$('mm_material').value;if(!category||!material){alert('大分類と材料を選んでください');return}const name=material==='その他'?$('mm_name_custom').value.trim():material;if(!name){alert('材料名を入力してください');return}const spec=$('mm_spec').value==='その他'?$('mm_spec_custom').value.trim():$('mm_spec').value;const thick=$('mm_thickness').value==='その他'?$('mm_thickness_custom').value:$('mm_thickness').value;const purchase=$('mm_purchase_form').value==='その他'?$('mm_purchase_custom').value.trim():$('mm_purchase_form').value;const stockUnit=$('mm_stock_unit').value||d?.unit;if(!stockUnit){alert('在庫単位を選んでください');return}const row={name,category,spec:spec||null,thickness_mm:(thick&&thick!=='-'?Number(thick):null),purchase_form:purchase||null,stock_unit:stockUnit,unit_weight_kg:$('mm_weight').value||null,supplier:$('mm_supplier').value.trim()||null,reorder_point:Number($('mm_reorder').value)||0,storage_location:$('mm_location').value.trim()||null,notes:$('mm_notes').value.trim()||null,surface_finish:$('mm_surface').value||null,adhesive_type:$('mm_adhesive').value||null,laminate_type:$('mm_laminate').value||null,color:$('mm_color').value||null};const {data,error}=await supabaseClient.from('materials').insert(row).select().single();if(error){console.error(error);alert('材料登録に失敗しました');return}const price=Number($('mm_price').value)||0;if(price>0){const {error:e}=await supabaseClient.from('material_prices').insert({material_id:data.id,effective_from:$('mm_price_date').value||today(),price,price_basis:$('mm_price_basis').value,supplier:row.supplier});if(e){console.error(e);alert('材料は登録しましたが単価登録に失敗しました')}}const initial=Number($('mm_initial').value)||0;if(initial!==0){const email=await currentEmail();await supabaseClient.from('inventory_movements').insert({material_id:data.id,movement_date:today(),movement_type:'adjust',quantity:initial,destination:'初期登録',memo:'初期在庫',created_by:email||null})}alert('材料を登録しました');$('mm_clear').click();await loadAll()};
$('mv_save').onclick=async()=>{const materialId=$('mv_material').value,qty=Number($('mv_qty').value);if(!materialId||!Number.isFinite(qty)){alert('材料と数量を入力してください');return}const email=await currentEmail();const row={material_id:Number(materialId),movement_date:$('mv_date').value||today(),movement_type:$('mv_type').value,quantity:qty,destination:$('mv_destination').value.trim()||null,unit_price:Number($('mv_price').value)||null,memo:$('mv_memo').value.trim()||null,created_by:email||null};const {error}=await supabaseClient.from('inventory_movements').insert(row);if(error){console.error(error);alert('登録に失敗しました');return}if(row.movement_type==='in'&&row.unit_price){const m=materials.find(x=>String(x.id)===String(materialId));await supabaseClient.from('material_prices').insert({material_id:Number(materialId),effective_from:row.movement_date,price:row.unit_price,price_basis:'stock_unit',supplier:m?.supplier||null,notes:'入庫時単価'})}alert('入出庫を登録しました');$('mv_qty').value='';$('mv_destination').value='';$('mv_price').value='';$('mv_memo').value='';await loadAll()};

(async()=>{initCatalog();if(await requireAuth())await loadAll()})();