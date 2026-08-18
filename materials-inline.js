'use strict';

(function(){
  const CATALOG={
    '金属板':{
      'アルミニウム':{specs:['A1050P','A1080P','A1070P','A1100P','A1200P'],thickness:['0.1','0.15','0.2','0.3','0.4','0.5','0.8','1.0','1.5','2.0'],purchase:['1000×2000板','1000×1000板','500×1000板'],unit:'枚'},
      'ステンレス':{specs:['SUS304','SUS430','SUS316'],thickness:['0.1','0.15','0.2','0.3','0.4','0.5','0.8','1.0','1.5','2.0'],purchase:['1000×2000板','1000×1000板','500×1000板'],unit:'枚'},
      '真鍮':{specs:['C2801P'],thickness:['0.1','0.15','0.2','0.3','0.4','0.5','0.8','1.0','1.5','2.0'],purchase:['1000×2000板','1000×1000板','500×1000板'],unit:'枚'}
    },
    '樹脂板・フィルム':{
      'PET':{specs:['一般PET','ハードコートPET','ルミラー'],thickness:['0.1','0.125','0.188','0.25'],purchase:['シート','ロール'],unit:'枚'},
      'ポリカーボネート':{specs:['一般PC','カーボグラス','ユーピロン'],thickness:['0.18','0.25','0.3','0.5','1.0'],purchase:['シート','ロール'],unit:'枚'},
      'PVC':{specs:['一般PVC'],thickness:['0.3','0.5','1.0'],purchase:['シート','ロール'],unit:'枚'},
      'アクリル':{specs:['透明','白','乳半'],thickness:['0.5','1.0','1.5','2.0'],purchase:['1000×2000板'],unit:'枚'}
    },
    'シール・ラベル':{
      '上質紙':{specs:['上質紙'],thickness:['-'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻'],unit:'巻'},
      'アート紙':{specs:['アート紙'],thickness:['-'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻'],unit:'巻'},
      'ミラーコート紙':{specs:['ミラーコート紙'],thickness:['-'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻'],unit:'巻'},
      '白PET':{specs:['白PET'],thickness:['0.025','0.05'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻'],unit:'巻'},
      '透明PET':{specs:['透明PET'],thickness:['0.025','0.05'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻'],unit:'巻'},
      'PET消銀':{specs:['PET消銀'],thickness:['0.05'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻'],unit:'巻'},
      '発泡PET':{specs:['発泡PET'],thickness:['0.05'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻'],unit:'巻'},
      'ユポ':{specs:['ユポ'],thickness:['0.08'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻'],unit:'巻'},
      '塩ビ白':{specs:['塩ビ白'],thickness:['0.08'],purchase:['幅100mm×100m巻','幅150mm×100m巻','幅200mm×100m巻','幅250mm×100m巻','幅300mm×100m巻','幅400mm×100m巻','幅500mm×100m巻','幅600mm×100m巻'],unit:'巻'}
    },
    'インキ・溶剤':{
      'シンナー':{specs:['シンナー','洗浄用シンナー','遅乾シンナー','速乾シンナー'],thickness:['-'],purchase:['16kg缶','4L缶','1L缶'],unit:'缶'},
      'スクリーンインキ':{specs:['スクリーンインキ'],thickness:['-'],purchase:['1kg缶','4kg缶'],unit:'缶'}
    }
  };
  const ADH=['なし','一般強粘着','強粘着','超強粘着','再剥離','再貼付','冷食用','粗面用'];
  const LAM=['なし','PET透明16μ','PET25μ 艶あり','PET25μ 艶消し'];
  let mats=[],prices=[],moves=[];
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>(Number(n)||0).toLocaleString('ja-JP');
  const today=()=>new Date().toISOString().slice(0,10);

  function style(){
    const s=document.createElement('style');
    s.textContent=`
      .tabbar-inner{grid-template-columns:repeat(5,1fr)!important}.tab-btn span{font-size:10px!important}
      .mi-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.mi-tabs{display:flex;gap:8px;overflow:auto;margin-bottom:12px}.mi-tab{border:1px solid var(--line);background:var(--surface-2);border-radius:999px;padding:9px 13px;font-weight:700;white-space:nowrap}.mi-tab.on{background:var(--text);color:var(--surface)}.mi-pane{display:none}.mi-pane.on{display:block}.mi-item{display:grid;grid-template-columns:1fr auto;gap:10px;padding:12px 0;border-bottom:1px solid var(--line)}.mi-stock{font-size:18px;font-weight:900}.mi-alert{color:var(--danger)}.mi-meta{font-size:12px;color:var(--muted);line-height:1.55;margin-top:4px}.mi-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px}.mi-summary .card{margin:0}.mi-summary b{font-size:22px}.mi-summary span{display:block;font-size:11px;color:var(--muted)}
      @media(max-width:700px){.mi-grid{grid-template-columns:1fr}.mi-summary{grid-template-columns:1fr 1fr}.mi-summary .card:last-child{grid-column:1/-1}.tabbar-inner{gap:0!important}.tab-btn{padding-left:2px!important;padding-right:2px!important}}
    `;
    document.head.appendChild(s);
  }
  function opt(a){return '<option value="">選択してください</option>'+a.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('')}
  function stock(id){let s=0;moves.filter(x=>String(x.material_id)===String(id)).slice().sort((a,b)=>(a.movement_date||'').localeCompare(b.movement_date||'')||Number(a.id)-Number(b.id)).forEach(x=>{const q=Number(x.quantity)||0;if(x.movement_type==='in')s+=q;else if(x.movement_type==='out')s-=q;else s=q});return s}
  function latestPrice(id){return prices.filter(x=>String(x.material_id)===String(id)).sort((a,b)=>(b.effective_from||'').localeCompare(a.effective_from||'')||Number(b.id)-Number(a.id))[0]||null}
  function unitValue(m,p){if(!p)return 0;if(p.price_basis==='kg'&&m.unit_weight_kg)return Number(p.price)*Number(m.unit_weight_kg);return Number(p.price)||0}

  function build(){
    if($('screen-materials')) return;
    style();
    const screen=document.createElement('section');screen.className='screen';screen.id='screen-materials';screen.dataset.screen='materials';
    screen.innerHTML=`
      <div class="mi-summary"><div class="card"><span>登録材料</span><b id="miCount">0</b></div><div class="card"><span>発注アラート</span><b id="miAlert">0</b></div><div class="card"><span>概算在庫金額</span><b id="miValue">0円</b></div></div>
      <div class="mi-tabs"><button class="mi-tab on" data-mi="list">在庫一覧</button><button class="mi-tab" data-mi="master">材料登録</button><button class="mi-tab" data-mi="move">入庫・出庫</button><button class="mi-tab" data-mi="history">履歴</button></div>
      <div id="mi-list" class="mi-pane on"><div class="card"><div class="field"><label>材料検索</label><input id="miSearch" placeholder="材料名・規格・仕入先"></div><div id="miList"></div></div></div>
      <div id="mi-master" class="mi-pane"><div class="card"><div class="card-title">材料マスター登録</div><div class="mi-grid">
        <div class="field"><label>大分類</label><select id="miCat"></select></div><div class="field"><label>材料</label><select id="miMat"></select></div>
        <div class="field"><label>規格・グレード</label><select id="miSpec"></select></div><div class="field"><label>厚み</label><select id="miThick"></select></div>
        <div class="field"><label>購入サイズ・形態</label><select id="miPurchase"></select></div><div class="field"><label>在庫単位</label><select id="miUnit"></select></div>
        <div class="field"><label>粘着</label><select id="miAdh"></select></div><div class="field"><label>ラミネート</label><select id="miLam"></select></div>
        <div class="field"><label>1単位重量 kg</label><input id="miWeight" type="number" step="any"></div><div class="field"><label>主な仕入先</label><input id="miSupplier"></div>
        <div class="field"><label>保管場所</label><input id="miLocation"></div><div class="field"><label>現在庫</label><input id="miInitial" type="number" step="any"></div>
        <div class="field"><label>発注点</label><input id="miReorder" type="number" step="any"></div><div class="field"><label>現在の仕入価格</label><input id="miPrice" type="number" step="any"></div>
        <div class="field"><label>価格基準</label><select id="miPriceBasis"><option value="stock_unit">1在庫単位あたり</option><option value="kg">1kgあたり</option><option value="purchase_unit">1購入単位あたり</option></select></div><div class="field"><label>価格適用日</label><input id="miPriceDate" type="date"></div>
      </div><div class="field"><label>備考</label><textarea id="miNotes"></textarea></div><button class="btn btn-primary btn-block" id="miSaveMat">材料を登録</button></div></div>
      <div id="mi-move" class="mi-pane"><div class="card"><div class="card-title">入庫・出庫</div><div class="mi-grid">
        <div class="field"><label>材料</label><select id="miMvMat"></select></div><div class="field"><label>区分</label><select id="miMvType"><option value="in">入庫</option><option value="out">出庫</option><option value="adjust">棚卸調整</option></select></div>
        <div class="field"><label>数量</label><input id="miMvQty" type="number" step="any"></div><div class="field"><label>日付</label><input id="miMvDate" type="date"></div>
        <div class="field"><label>仕入先・払出先</label><input id="miMvDest"></div><div class="field"><label>今回単価</label><input id="miMvPrice" type="number" step="any"></div>
      </div><div class="field"><label>メモ</label><textarea id="miMvMemo"></textarea></div><button class="btn btn-primary btn-block" id="miSaveMove">登録する</button></div></div>
      <div id="mi-history" class="mi-pane"><div class="card"><div class="card-title">入出庫履歴</div><div id="miHistory"></div></div></div>`;
    document.querySelector('main').appendChild(screen);
    const tab=document.createElement('button');tab.className='tab-btn';tab.dataset.goto='materials';tab.innerHTML='<svg viewBox="0 0 24 24"><path d="M4 7h16M6 7V4h12v3M6 11h12v9H6z"/></svg><span>材料・在庫</span>';
    document.querySelector('.tabbar-inner').appendChild(tab);
    tab.addEventListener('click',()=>gotoMaterials());
    document.querySelectorAll('.mi-tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.mi-tab').forEach(x=>x.classList.remove('on'));document.querySelectorAll('.mi-pane').forEach(x=>x.classList.remove('on'));b.classList.add('on');$('mi-'+b.dataset.mi).classList.add('on')}));
    $('miSearch').addEventListener('input',render);
    $('miPriceDate').value=today();$('miMvDate').value=today();
    $('miCat').innerHTML=opt(Object.keys(CATALOG));$('miAdh').innerHTML=opt(ADH);$('miLam').innerHTML=opt(LAM);
    $('miCat').addEventListener('change',refreshMat);$('miMat').addEventListener('change',refreshDef);
    $('miSaveMat').addEventListener('click',saveMaterial);$('miSaveMove').addEventListener('click',saveMove);
  }
  function gotoMaterials(){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.dataset.screen==='materials'));document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.goto==='materials'));const t=$('screenTitle');if(t)t.textContent='材料・在庫';load()}
  function refreshMat(){const c=CATALOG[$('miCat').value]||{};$('miMat').innerHTML=opt(Object.keys(c));refreshDef()}
  function refreshDef(){const d=(CATALOG[$('miCat').value]||{})[$('miMat').value];$('miSpec').innerHTML=opt(d?.specs||[]);$('miThick').innerHTML=opt(d?.thickness||[]);$('miPurchase').innerHTML=opt(d?.purchase||[]);$('miUnit').innerHTML=opt(d?[d.unit]:['枚','巻','缶','kg','個']);if(d)$('miUnit').value=d.unit}
  async function load(){const {data:{session}}=await supabaseClient.auth.getSession();if(!session)return;const [a,b,c]=await Promise.all([supabaseClient.from('materials').select('*').eq('active',true).order('name'),supabaseClient.from('material_prices').select('*').order('effective_from',{ascending:false}),supabaseClient.from('inventory_movements').select('*').order('movement_date',{ascending:false}).order('id',{ascending:false})]);if(a.error||b.error||c.error){console.error(a.error||b.error||c.error);return}mats=a.data||[];prices=b.data||[];moves=c.data||[];render()}
  function render(){if(!$('miList'))return;const q=$('miSearch').value.trim().toLowerCase();const list=mats.filter(m=>[m.name,m.category,m.spec,m.supplier].join(' ').toLowerCase().includes(q));$('miList').innerHTML=list.length?list.map(m=>{const s=stock(m.id),p=latestPrice(m.id),warn=Number(m.reorder_point)>0&&s<=Number(m.reorder_point);return `<div class="mi-item"><div><b>${esc(m.name)}</b><div class="mi-meta">${[m.category,m.spec,m.thickness_mm?('t'+m.thickness_mm):'',m.purchase_form,m.supplier].filter(Boolean).map(esc).join(' / ')}${p?'<br>最新単価 '+fmt(p.price)+'円 ('+esc(p.effective_from)+')':''}</div></div><div class="mi-stock ${warn?'mi-alert':''}">${fmt(s)} ${esc(m.stock_unit)}</div></div>`}).join(''):'<div class="empty-state">まだ材料がありません</div>';$('miCount').textContent=mats.length;$('miAlert').textContent=mats.filter(m=>Number(m.reorder_point)>0&&stock(m.id)<=Number(m.reorder_point)).length;$('miValue').textContent=fmt(Math.round(mats.reduce((z,m)=>z+stock(m.id)*unitValue(m,latestPrice(m.id)),0)))+'円';$('miMvMat').innerHTML=mats.map(m=>`<option value="${m.id}">${esc(m.name)}（${fmt(stock(m.id))} ${esc(m.stock_unit)}）</option>`).join('');$('miHistory').innerHTML=moves.slice(0,150).map(x=>{const m=mats.find(y=>String(y.id)===String(x.material_id));return `<div class="mi-item"><div>${esc(x.movement_date)}　${x.movement_type==='in'?'入庫':x.movement_type==='out'?'出庫':'棚卸'}<div class="mi-meta">${esc(m?.name||'材料')} ${esc(x.destination||'')}</div></div><b>${fmt(x.quantity)} ${esc(m?.stock_unit||'')}</b></div>`}).join('')}
  async function saveMaterial(){const cat=$('miCat').value,name=$('miMat').value,spec=$('miSpec').value,th=$('miThick').value,pur=$('miPurchase').value,unit=$('miUnit').value;if(!cat||!name||!unit){alert('大分類・材料・在庫単位を選んでください');return}const row={name,category:cat,spec:spec||null,thickness_mm:(!th||th==='-')?null:Number(th),purchase_form:pur||null,stock_unit:unit,unit_weight_kg:$('miWeight').value||null,supplier:$('miSupplier').value.trim()||null,reorder_point:Number($('miReorder').value)||0,storage_location:$('miLocation').value.trim()||null,notes:$('miNotes').value.trim()||null,adhesive_type:$('miAdh').value||null,laminate_type:$('miLam').value||null};const {data,error}=await supabaseClient.from('materials').insert(row).select().single();if(error){console.error(error);alert('材料登録に失敗しました');return}const price=Number($('miPrice').value)||0;if(price>0)await supabaseClient.from('material_prices').insert({material_id:data.id,effective_from:$('miPriceDate').value||today(),price,price_basis:$('miPriceBasis').value,supplier:row.supplier});const initial=Number($('miInitial').value)||0;if(initial!==0){const {data:{user}}=await supabaseClient.auth.getUser();await supabaseClient.from('inventory_movements').insert({material_id:data.id,movement_date:today(),movement_type:'adjust',quantity:initial,destination:'初期登録',memo:'初期在庫',created_by:user?.email||null})}alert('材料を登録しました');await load()}
  async function saveMove(){const id=$('miMvMat').value,qty=Number($('miMvQty').value);if(!id||!Number.isFinite(qty)){alert('材料と数量を入力してください');return}const {data:{user}}=await supabaseClient.auth.getUser();const row={material_id:Number(id),movement_date:$('miMvDate').value||today(),movement_type:$('miMvType').value,quantity:qty,destination:$('miMvDest').value.trim()||null,unit_price:Number($('miMvPrice').value)||null,memo:$('miMvMemo').value.trim()||null,created_by:user?.email||null};const {error}=await supabaseClient.from('inventory_movements').insert(row);if(error){console.error(error);alert('登録に失敗しました');return}if(row.movement_type==='in'&&row.unit_price)await supabaseClient.from('material_prices').insert({material_id:row.material_id,effective_from:row.movement_date,price:row.unit_price,price_basis:'stock_unit',notes:'入庫時単価'});alert('登録しました');await load()}

  function start(){if(!window.supabaseClient||!document.querySelector('.tabbar-inner')||!document.querySelector('main')){setTimeout(start,100);return}build()}
  start();
})();