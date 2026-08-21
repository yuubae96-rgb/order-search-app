'use strict';

(function(){
  const $=id=>document.getElementById(id);
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function fmt(v){return Number(v||0).toLocaleString('ja-JP');}
  function daysSince(iso){if(!iso)return 0;const d=new Date(iso+'T00:00:00');const now=new Date();now.setHours(0,0,0,0);return Math.max(0,Math.floor((now-d)/86400000));}
  function level(days){if(days>=30)return'd30';if(days>=14)return'd14';if(days>=7)return'd7';return'fresh';}
  function label(days){if(days>=30)return`⚠ ${days}日経過`;if(days>=14)return`⚠ ${days}日経過`;if(days>=7)return`${days}日経過`;return`${days}日`}
  function addStyles(){
    const s=document.createElement('style');
    s.textContent=`
      .followup-card{margin-bottom:14px}.followup-title{font-size:18px;font-weight:900;margin-bottom:4px}.followup-sub{font-size:12px;color:#6a737d;margin-bottom:12px}
      .followup-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px}.followup-summary div{padding:9px 5px;border-radius:9px;background:#f3f5f7;text-align:center}.followup-summary b{display:block;font-size:18px}.followup-summary span{font-size:10px;color:#68707a}
      .followup-item{display:grid;grid-template-columns:72px 1fr auto;gap:9px;align-items:center;padding:10px 0;border-top:1px solid #e2e5e9}.followup-item:first-child{border-top:0}
      .followup-age{padding:7px 5px;border-radius:8px;text-align:center;font-size:11px;font-weight:900}.followup-age.fresh{background:#eef2f5;color:#5e6872}.followup-age.d7{background:#fff4c7;color:#725600}.followup-age.d14{background:#ffe0c2;color:#7a3b00}.followup-age.d30{background:#ffd9d9;color:#8a1818}
      .followup-company{font-weight:900;font-size:14px}.followup-meta{font-size:11px;color:#68707a;margin-top:2px;line-height:1.5}.followup-open{border:1px solid #aab1b9;background:#fff;border-radius:8px;padding:8px 10px;font-weight:800;white-space:nowrap}
      .followup-empty{padding:18px 8px;text-align:center;color:#68707a}.followup-more{text-align:center;font-size:11px;color:#68707a;padding-top:8px}
    `;
    document.head.appendChild(s);
  }
  async function load(){
    if(!window.supabaseClient)return;
    const host=$('followupList'); if(!host)return;
    const {data,error}=await supabaseClient.from('estimates').select('id,estimate_date,company_name,product_name,estimate_number,person_in_charge,amount,status').eq('status','回答待ち').order('estimate_date',{ascending:true});
    if(error){host.innerHTML='<div class="followup-empty">結果確認リストを読み込めませんでした</div>';return;}
    const rows=data||[];
    const c7=rows.filter(r=>daysSince(r.estimate_date)>=7).length,c14=rows.filter(r=>daysSince(r.estimate_date)>=14).length,c30=rows.filter(r=>daysSince(r.estimate_date)>=30).length;
    $('followupTotal').textContent=rows.length;$('followup7').textContent=c7;$('followup14').textContent=c14;$('followup30').textContent=c30;
    if(!rows.length){host.innerHTML='<div class="followup-empty">回答待ちの見積はありません</div>';return;}
    const show=rows.slice(0,20);
    host.innerHTML=show.map(r=>{const d=daysSince(r.estimate_date);return `<div class="followup-item" data-id="${r.id}"><div class="followup-age ${level(d)}">${label(d)}</div><div><div class="followup-company">${esc(r.company_name)}</div><div class="followup-meta">${esc(r.product_name||'品名未入力')}${r.estimate_number?' / No.'+esc(r.estimate_number):''}${r.person_in_charge?' / 担当 '+esc(r.person_in_charge):''}<br>${esc(r.estimate_date||'')} / ${fmt(r.amount)}円</div></div><button type="button" class="followup-open">開く</button></div>`}).join('')+(rows.length>20?`<div class="followup-more">古い順に20件表示 / 全${rows.length}件</div>`:'');
    host.querySelectorAll('.followup-open').forEach(btn=>btn.onclick=()=>openEstimate(btn.closest('.followup-item').dataset.id));
  }
  function openEstimate(id){
    const searchBtn=document.querySelector('.tab-btn[data-goto="search"]');if(searchBtn)searchBtn.click();
    setTimeout(()=>{
      const card=document.querySelector(`#searchResults .order-card[data-id="${id}"]`);
      const edit=card&&card.querySelector('[data-action="edit"]');
      if(edit){edit.click();return;}
      const resultChip=document.querySelector('#resultChips .chip[data-result="pending"]');if(resultChip)resultChip.click();
      setTimeout(()=>{const c=document.querySelector(`#searchResults .order-card[data-id="${id}"]`);const e=c&&c.querySelector('[data-action="edit"]');if(e)e.click();},180);
    },180);
  }
  function mount(){
    const screen=$('screen-search');if(!screen)return;
    const card=document.createElement('div');card.className='card followup-card';card.innerHTML=`<div class="followup-title">結果確認リスト</div><div class="followup-sub">回答待ちを古い順に表示。長く止まっている見積から確認できます。</div><div class="followup-summary"><div><b id="followupTotal">0</b><span>回答待ち</span></div><div><b id="followup7">0</b><span>7日以上</span></div><div><b id="followup14">0</b><span>14日以上</span></div><div><b id="followup30">0</b><span>30日以上</span></div></div><div id="followupList"></div>`;
    screen.insertBefore(card,screen.firstChild);
    const nav=document.querySelector('.tab-btn[data-goto="search"]');if(nav)nav.addEventListener('click',()=>setTimeout(load,150));
    const results=$('searchResults');if(results)new MutationObserver(()=>{clearTimeout(mount._t);mount._t=setTimeout(load,250)}).observe(results,{childList:true});
    load();
  }
  addStyles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();