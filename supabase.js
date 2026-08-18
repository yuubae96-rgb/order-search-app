'use strict';

const SUPABASE_URL = 'https://vnnvuxccazkdzwqjmntz.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xG-tuBgxFGntT1vlbZzuVQ_AZ2Zl8QL';
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

/* =========================================================
   材料マスター → 見積登録 連携
   既存アプリを壊さないよう、このファイルから画面へ差し込む。
   ========================================================= */
let QUOTE_MATERIALS = [];
let QUOTE_MATERIAL_PRICES = [];
let QUOTE_MATERIAL_SNAPSHOT = null;

function qNum(v){
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function quoteLatestPrice(materialId){
  return QUOTE_MATERIAL_PRICES
    .filter(p => String(p.material_id) === String(materialId))
    .sort((a,b) => {
      const d = String(b.effective_from || '').localeCompare(String(a.effective_from || ''));
      return d || Number(b.id) - Number(a.id);
    })[0] || null;
}

function parsePurchaseDimensions(material){
  if(material.width_mm && material.length_value){
    const lengthMm = material.length_unit === 'm'
      ? qNum(material.length_value) * 1000
      : qNum(material.length_value);
    return { widthMm:qNum(material.width_mm), lengthMm };
  }

  const text = String(material.purchase_form || '');
  let m = text.match(/(\d+(?:\.\d+)?)\s*[×xX]\s*(\d+(?:\.\d+)?)\s*板/);
  if(m) return { widthMm:qNum(m[1]), lengthMm:qNum(m[2]) };

  m = text.match(/幅\s*(\d+(?:\.\d+)?)\s*mm\s*[×xX]\s*(\d+(?:\.\d+)?)\s*m\s*巻/);
  if(m) return { widthMm:qNum(m[1]), lengthMm:qNum(m[2]) * 1000 };

  return null;
}

function materialLabel(m){
  const parts = [m.name];
  if(m.spec && m.spec !== m.name) parts.push(m.spec);
  if(m.thickness_mm != null) parts.push('t' + m.thickness_mm);
  if(m.purchase_form) parts.push(m.purchase_form);
  return parts.join(' / ');
}

function mapMaterialToLegacy(material){
  const name = String(material.name || '');
  const category = String(material.category || '');
  if(name.includes('アルミ') || /^A1\d{3}/.test(String(material.spec || ''))) return 'アルミ';
  if(name.includes('ステンレス') || /^SUS/.test(String(material.spec || ''))) return 'ステンレス';
  if(name.includes('真鍮') || /^C2801/.test(String(material.spec || ''))) return '真鍮';
  if(name.includes('カラーアルマイト') || String(material.surface_finish || '').includes('カラーアルマイト')) return 'カラーアルマイト';
  if(category === '金属板') return 'その他';
  return 'その他';
}

function calculateQuoteMaterialSnapshot(){
  const select = document.getElementById('f_materialMaster');
  const info = document.getElementById('materialMasterInfo');
  if(!select || !select.value){
    QUOTE_MATERIAL_SNAPSHOT = null;
    if(info) info.innerHTML = '材料マスターを使わない場合は、下の材質・板厚を従来どおり入力できます。';
    return;
  }

  const material = QUOTE_MATERIALS.find(m => String(m.id) === String(select.value));
  if(!material) return;
  const price = quoteLatestPrice(material.id);
  const width = qNum(document.getElementById('f_sizeH')?.value);
  const height = qNum(document.getElementById('f_sizeV')?.value);
  const qty = Math.max(1, qNum(document.getElementById('f_quantity')?.value) || 1);
  const dims = parsePurchaseDimensions(material);

  let estimatedCost = null;
  let detail = '';
  if(price && width > 0 && height > 0 && dims && dims.widthMm > 0 && dims.lengthMm > 0){
    const areaRatio = (width * height * qty) / (dims.widthMm * dims.lengthMm);
    if(price.price_basis === 'kg' && qNum(material.unit_weight_kg) > 0){
      const requiredKg = areaRatio * qNum(material.unit_weight_kg);
      estimatedCost = requiredKg * qNum(price.price);
      detail = `必要重量 約${requiredKg.toFixed(3)}kg`;
    }else if(price.price_basis === 'stock_unit' || price.price_basis === 'purchase_unit'){
      estimatedCost = areaRatio * qNum(price.price);
      detail = `購入単位の面積比 約${(areaRatio*100).toFixed(2)}%`;
    }
  }

  QUOTE_MATERIAL_SNAPSHOT = {
    materialId: material.id,
    priceId: price ? price.id : null,
    unitPrice: price ? qNum(price.price) : null,
    estimatedCost: estimatedCost == null ? null : Math.round(estimatedCost)
  };

  if(info){
    const priceText = price
      ? `最新単価：<b>${qNum(price.price).toLocaleString('ja-JP')}円</b> / ${price.price_basis === 'kg' ? 'kg' : material.stock_unit}　適用日 ${price.effective_from}`
      : '<b>単価未登録</b>';
    const costText = estimatedCost == null
      ? 'サイズ・数量・購入寸法などが揃うと材料原価の参考値を表示します。'
      : `材料原価（ロス未加算）：<b>${Math.round(estimatedCost).toLocaleString('ja-JP')}円</b>　${detail}`;
    info.innerHTML = `${priceText}<br>${costText}`;
  }
}

function applyMasterMaterial(){
  const select = document.getElementById('f_materialMaster');
  if(!select || !select.value){
    calculateQuoteMaterialSnapshot();
    return;
  }
  const material = QUOTE_MATERIALS.find(m => String(m.id) === String(select.value));
  if(!material) return;

  const legacy = mapMaterialToLegacy(material);
  const matSelect = document.getElementById('f_material');
  const other = document.getElementById('f_materialOther');
  const thickness = document.getElementById('f_thickness');
  if(matSelect){
    matSelect.value = legacy;
    matSelect.dispatchEvent(new Event('change', {bubbles:true}));
  }
  if(other && legacy === 'その他') other.value = material.name || material.spec || '';
  if(thickness && material.thickness_mm != null) thickness.value = material.thickness_mm;
  calculateQuoteMaterialSnapshot();
}

async function loadQuoteMaterials(){
  const select = document.getElementById('f_materialMaster');
  if(!select) return;
  const { data:{ session } } = await supabaseClient.auth.getSession();
  if(!session){
    select.innerHTML = '<option value="">ログイン後に材料を読み込みます</option>';
    return;
  }

  const [mRes, pRes] = await Promise.all([
    supabaseClient.from('materials').select('*').eq('active', true).order('category').order('name'),
    supabaseClient.from('material_prices').select('*').order('effective_from', {ascending:false})
  ]);
  if(mRes.error || pRes.error){
    console.error(mRes.error || pRes.error);
    select.innerHTML = '<option value="">材料マスターの読込に失敗しました</option>';
    return;
  }
  QUOTE_MATERIALS = mRes.data || [];
  QUOTE_MATERIAL_PRICES = pRes.data || [];
  select.innerHTML = '<option value="">材料マスターを使わない</option>' +
    QUOTE_MATERIALS.map(m => `<option value="${m.id}">${materialLabel(m)}</option>`).join('');
  if(!QUOTE_MATERIALS.length){
    document.getElementById('materialMasterInfo').innerHTML = '材料マスターはまだ0件です。材料・在庫管理で登録すると、ここから選べるようになります。';
  }
}

async function saveQuoteMaterialSnapshot(estimateId){
  if(!QUOTE_MATERIAL_SNAPSHOT || !estimateId) return;
  const s = QUOTE_MATERIAL_SNAPSHOT;
  const { error } = await supabaseClient
    .from('estimates')
    .update({
      material_id: s.materialId,
      material_price_id: s.priceId,
      material_unit_price_snapshot: s.unitPrice,
      material_cost_snapshot: s.estimatedCost
    })
    .eq('id', Number(estimateId));
  if(error) console.error('材料単価スナップショット保存エラー', error);
}

function installQuoteMaterialIntegration(){
  const oldMaterial = document.getElementById('f_material');
  if(!oldMaterial || document.getElementById('f_materialMaster')) return;

  const row = oldMaterial.closest('.row2');
  if(!row) return;
  const box = document.createElement('div');
  box.className = 'field';
  box.style.marginBottom = '12px';
  box.innerHTML = `
    <label>材料マスターから選択<span class="opt">推奨</span></label>
    <select id="f_materialMaster"><option value="">読み込み中...</option></select>
    <div id="materialMasterInfo" style="font-size:12px;line-height:1.65;margin-top:7px;opacity:.78;">材料マスターを読み込んでいます。</div>
  `;
  row.parentNode.insertBefore(box, row);

  document.getElementById('f_materialMaster').addEventListener('change', applyMasterMaterial);
  ['f_sizeV','f_sizeH','f_quantity'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', calculateQuoteMaterialSnapshot);
  });

  // 既存保存処理の直後に、その時点の材料単価を見積へ固定保存する。
  if(typeof StorageAPI !== 'undefined' && !StorageAPI.__materialLinked){
    const originalAdd = StorageAPI.add.bind(StorageAPI);
    StorageAPI.add = async function(order){
      const saved = await originalAdd(order);
      await saveQuoteMaterialSnapshot(saved && saved.id);
      return saved;
    };

    const originalUpdate = StorageAPI.update.bind(StorageAPI);
    StorageAPI.update = async function(id, patch, expectedUpdatedAt){
      const result = await originalUpdate(id, patch, expectedUpdatedAt);
      if(result && !result.conflict) await saveQuoteMaterialSnapshot(id);
      return result;
    };
    StorageAPI.__materialLinked = true;
  }

  loadQuoteMaterials();
}

document.addEventListener('DOMContentLoaded', installQuoteMaterialIntegration);
supabaseClient.auth.onAuthStateChange((_event, session) => {
  if(session) setTimeout(loadQuoteMaterials, 0);
});
