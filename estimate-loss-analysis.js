'use strict';

(function(){
  const $=id=>document.getElementById(id);
  function style(){
    const s=document.createElement('style');
    s.textContent=`
      .loss-analysis-card{margin-top:12px}.loss-analysis-summary{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:10px 0 14px}
      .loss-kpi{padding:12px;border-radius:10px;background:#f4f6f8}.loss-kpi .n{font-size:23px;font-weight:900}.loss-kpi .l{font-size:11px;color:#68707a}
      .loss-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #e5e7eb}
      .loss-row:last-child{border-bottom:0}.loss-name{font-weight:900;font-size:13px}.loss-bar{height:8px;background:#e9edf1;border-radius:99px;overflow:hidden;margin-top:6px}.loss-fill{height:100%;background:currentColor}.loss-count{font-weight:900;font-size:16px}.loss-percent{font-size:11px;color:#68707a;text-align:right}
      .loss-company{margin-top:16px}.loss-company-item{padding:10px 0;border-bottom:1px solid #e5e7eb}.loss-company-item:last-child{border-bottom:0}.loss-company-name{font-weight:900}.loss-company-meta{font-size:12px;color:#68707a;margin-top:3px}
    `;document.head.appendChild(s);
  }
  async function ensureCard(){
    const screen=$('screen-analysis'); if(!screen||$('lossAnalysisCard'))return;
    const card=document.createElement('div');card.className='card loss-analysis-card';card.id='lossAnalysisCard';
    card.innerHTML='<div class="card-title">失注理由の分析</div><div class="card-sub">紙ノートに書いていた「価格が高い」などを自動集計します</div><div id="lossAnalysisBody">読み込み中...</div><div class="loss-company"><div class="card-title">失注の多い会社</div><div id="lossCompanyBody"></div></div>';
    const companyCard=$('companyStatusList')?.closest('.card');
    if(companyCard) companyCard.parentNode.insertBefore(card,companyCard); else screen.appendChild(card);
  }
  async function render(){
    await ensureCard(); if(!$('lossAnalysisBody')||!window.supabaseClient)return;
    const {data,error}=await supabaseClient.from('estimates').select('company_name,lost_reason,result_note,status').eq('status','失注');
    if(error){$('lossAnalysisBody').textContent='失注理由を読み込めませんでした';return;}
    const rows=data||[]; const total=rows.length; const reasonMap={}; const companyMap={}; let reasonKnown=0;
    rows.forEach(r=>{
      const reason=(r.lost_reason||'理由未登録').trim()||'理由未登録';
      reasonMap[reason]=(reasonMap[reason]||0)+1; if(reason!=='理由未登録')reasonKnown++;
      const c=(r.company_name||'会社名未登録').trim()||'会社名未登録'; companyMap[c]=(companyMap[c]||0)+1;
    });
    const reasons=Object.entries(reasonMap).sort((a,b)=>b[1]-a[1]); const max=reasons[0]?.[1]||1;
    $('lossAnalysisBody').innerHTML=`<div class="loss-analysis-summary"><div class="loss-kpi"><div class="n">${total}</div><div class="l">失注件数</div></div><div class="loss-kpi"><div class="n">${total?Math.round(reasonKnown/total*100):0}%</div><div class="l">失注理由の入力率</div></div></div>`+
      (reasons.length?reasons.map(([name,count])=>`<div class="loss-row"><div><div class="loss-name">${esc(name)}</div><div class="loss-bar"><div class="loss-fill" style="width:${Math.round(count/max*100)}%"></div></div></div><div><div class="loss-count">${count}件</div><div class="loss-percent">${total?Math.round(count/total*100):0}%</div></div></div>`).join(''):'<div class="empty-state">まだ失注データがありません</div>');
    const companies=Object.entries(companyMap).sort((a,b)=>b[1]-a[1]).slice(0,10);
    $('lossCompanyBody').innerHTML=companies.length?companies.map(([c,n])=>`<div class="loss-company-item"><div class="loss-company-name">${esc(c)}</div><div class="loss-company-meta">失注 ${n}件</div></div>`).join(''):'<div class="empty-state">まだ失注データがありません</div>';
  }
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function mount(){style();ensureCard();document.querySelectorAll('.tab-btn[data-goto="analysis"]').forEach(b=>b.addEventListener('click',()=>setTimeout(render,200)));const s=$('screen-analysis');if(s)new MutationObserver(()=>{if(s.classList.contains('active'))setTimeout(render,120)}).observe(s,{attributes:true,attributeFilter:['class']});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();