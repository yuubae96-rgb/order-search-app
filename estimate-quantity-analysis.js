'use strict';

(function(){
  const $=id=>document.getElementById(id);

  function addStyles(){
    const s=document.createElement('style');
    s.textContent=`
      .qty-analysis-card{margin-top:14px}
      .qty-analysis-sub{font-size:12px;color:#68707a;margin:4px 0 12px}
      .qty-analysis-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:12px}
      .qty-stat{padding:12px;border-radius:10px;background:#f5f7f9;text-align:center}
      .qty-stat .n{font-size:22px;font-weight:900}.qty-stat .l{font-size:11px;color:#68707a;margin-top:3px}
      .qty-row{display:grid;grid-template-columns:86px 1fr 58px;gap:8px;align-items:center;padding:9px 0;border-bottom:1px solid #eceff2;font-size:12px}
      .qty-row:last-child{border-bottom:0}.qty-label{font-weight:900}.qty-bar{height:12px;background:#eef1f4;border-radius:999px;overflow:hidden}.qty-bar>span{display:block;height:100%;background:#ff8fb3}.qty-rate{text-align:right;font-weight:900}
      .qty-detail{font-size:11px;color:#68707a;margin-top:2px}
      .qty-empty{padding:18px;text-align:center;color:#7b8490;font-size:12px}
    `;
    document.head.appendChild(s);
  }

  function mount(){
    const analysis=$('screen-analysis'); if(!analysis)return;
    const card=document.createElement('div');
    card.className='card qty-analysis-card';
    card.innerHTML=`<div class="card-title">数量別の受注傾向</div><div class="qty-analysis-sub">お客様へ提示した数量のうち、どの数量帯で受注しやすいかを集計します。</div><div id="qtyAnalysisBody"><div class="qty-empty">集計中...</div></div>`;
    const first=analysis.querySelector('.card');
    if(first&&first.parentNode) first.parentNode.insertBefore(card,first.nextSibling); else analysis.appendChild(card);

    const obs=new MutationObserver(()=>{ if(analysis.classList.contains('active')) render(); });
    obs.observe(analysis,{attributes:true,attributeFilter:['class']});
    document.querySelectorAll('[data-goto="analysis"]').forEach(b=>b.addEventListener('click',()=>setTimeout(render,100)));
    setTimeout(render,700);
  }

  async function render(){
    const body=$('qtyAnalysisBody'); if(!body||!window.supabaseClient)return;
    const [{data:opts,error:oe},{data:ests,error:ee}]=await Promise.all([
      supabaseClient.from('estimate_quantity_options').select('estimate_id,quantity,is_won'),
      supabaseClient.from('estimates').select('id,status')
    ]);
    if(oe||ee){body.innerHTML='<div class="qty-empty">数量別分析を読み込めませんでした</div>';return;}

    const status={}; (ests||[]).forEach(e=>status[e.id]=e.status);
    const rows=(opts||[]).filter(o=>Number(o.quantity)>0);
    if(!rows.length){body.innerHTML='<div class="qty-empty">数量別見積データがまだありません</div>';return;}

    const buckets=[
      {label:'～99枚',min:1,max:99},{label:'100～199枚',min:100,max:199},{label:'200～299枚',min:200,max:299},
      {label:'300～499枚',min:300,max:499},{label:'500～999枚',min:500,max:999},{label:'1000枚～',min:1000,max:Infinity}
    ];
    buckets.forEach(b=>{b.offered=0;b.won=0;b.closed=0;});

    rows.forEach(r=>{
      const q=Number(r.quantity); const b=buckets.find(x=>q>=x.min&&q<=x.max); if(!b)return;
      b.offered++;
      const st=status[r.estimate_id];
      if(st==='受注'||st==='失注') b.closed++;
      if(r.is_won) b.won++;
    });

    const totalWon=rows.filter(r=>r.is_won).length;
    const offeredQuotes=new Set(rows.map(r=>r.estimate_id)).size;
    const wonQuotes=new Set(rows.filter(r=>r.is_won).map(r=>r.estimate_id)).size;
    const top=buckets.slice().sort((a,b)=>b.won-a.won)[0];
    const maxRate=Math.max(1,...buckets.map(b=>b.closed?Math.round(b.won/b.closed*100):0));

    let html=`<div class="qty-analysis-grid"><div class="qty-stat"><div class="n">${offeredQuotes}</div><div class="l">数量別見積の案件数</div></div><div class="qty-stat"><div class="n">${wonQuotes}</div><div class="l">数量確定した受注件数</div></div><div class="qty-stat"><div class="n">${top&&top.won?top.label:'—'}</div><div class="l">受注が最も多い数量帯</div></div><div class="qty-stat"><div class="n">${totalWon}</div><div class="l">受注数量の記録数</div></div></div>`;
    html+=buckets.map(b=>{
      const rate=b.closed?Math.round(b.won/b.closed*100):0;
      const width=Math.round(rate/maxRate*100);
      return `<div class="qty-row"><div><div class="qty-label">${b.label}</div><div class="qty-detail">提示 ${b.offered}件 / 結果確定 ${b.closed}件 / 受注 ${b.won}件</div></div><div class="qty-bar"><span style="width:${width}%"></span></div><div class="qty-rate">${b.closed?rate+'%':'—'}</div></div>`;
    }).join('');
    body.innerHTML=html;
  }

  addStyles();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();