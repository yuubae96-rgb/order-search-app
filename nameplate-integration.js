'use strict';

(function(){
  function waitForApp(){
    const form=document.getElementById('orderForm');
    if(!form){setTimeout(waitForApp,100);return;}
    if(document.getElementById('nameplateEstimatorLauncher')) return;

    const style=document.createElement('style');
    style.textContent=`
      #nameplateEstimatorLauncher{margin:0 0 14px 0}
      .np-estimator-btn{width:100%;min-height:52px;border:1px solid #c58a35;background:#fff7e8;color:#8a5a15;border-radius:12px;font-weight:800;font-size:16px;font-family:inherit}
      .np-overlay{position:fixed;inset:0;background:#f4f6f8;z-index:99999;display:none;flex-direction:column;overflow:hidden}
      .np-overlay.on{display:flex}
      .np-head{height:58px;flex:0 0 58px;background:#171c24;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 14px;padding-top:env(safe-area-inset-top)}
      .np-head b{font-size:16px}.np-close{border:0;background:transparent;color:#fff;font-size:30px;line-height:1;width:44px;height:44px}
      .np-scroll{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;background:#fff;overscroll-behavior:contain}
      .np-frame{display:block;border:0;width:100%;height:1200px;background:#fff;overflow:hidden}
    `;
    document.head.appendChild(style);

    const launcher=document.createElement('div');
    launcher.id='nameplateEstimatorLauncher';
    launcher.innerHTML='<button type="button" class="np-estimator-btn" id="openNameplateEstimator">銘板の自動見積を開く</button>';

    const firstField=form.firstElementChild;
    form.insertBefore(launcher,firstField);

    const overlay=document.createElement('div');
    overlay.className='np-overlay';
    overlay.id='nameplateEstimatorOverlay';
    overlay.innerHTML=`<div class="np-head"><b>銘板自動見積・単価設定</b><button type="button" class="np-close" id="closeNameplateEstimator">×</button></div><div class="np-scroll" id="nameplateEstimatorScroll"><iframe class="np-frame" id="nameplateEstimatorFrame" src="about:blank" scrolling="no"></iframe></div>`;
    document.body.appendChild(overlay);

    const frame=document.getElementById('nameplateEstimatorFrame');
    const scroller=document.getElementById('nameplateEstimatorScroll');
    let heightTimer=0;

    function applyRequestedPriceSettings(){
      try{
        const key='meiban-price-settings';
        const raw=localStorage.getItem(key);
        if(!raw) return;
        const settings=JSON.parse(raw);
        let changed=false;

        if(settings.platePrice!==9500){
          settings.platePrice=9500;
          changed=true;
        }

        if(Array.isArray(settings.materials)){
          const aluminum=settings.materials.find(m=>m && m.name==='アルミ');
          if(aluminum && Array.isArray(aluminum.thicknesses)){
            const exists=aluminum.thicknesses.some(t=>Math.abs(Number(t.mm)-0.15)<0.000001);
            if(!exists){
              aluminum.thicknesses.push({mm:0.15,price:0.15});
              aluminum.thicknesses.sort((a,b)=>Number(a.mm)-Number(b.mm));
              changed=true;
            }
          }
        }

        if(changed) localStorage.setItem(key,JSON.stringify(settings));
      }catch(e){}
    }

    function syncFrameHeight(){
      try{
        const doc=frame.contentDocument;
        if(!doc) return;
        const h=Math.max(
          doc.documentElement ? doc.documentElement.scrollHeight : 0,
          doc.body ? doc.body.scrollHeight : 0,
          scroller.clientHeight
        );
        if(h>0 && Math.abs(frame.offsetHeight-h)>2) frame.style.height=h+'px';
      }catch(e){}
    }

    function scheduleHeightSync(delay){
      clearTimeout(heightTimer);
      heightTimer=setTimeout(syncFrameHeight,delay || 80);
    }

    frame.addEventListener('load',()=>{
      syncFrameHeight();
      scheduleHeightSync(120);
      setTimeout(syncFrameHeight,500);
      try{
        const doc=frame.contentDocument;
        if(doc){
          doc.addEventListener('click',()=>scheduleHeightSync(60),{passive:true});
          doc.addEventListener('change',()=>scheduleHeightSync(60),{passive:true});
          doc.addEventListener('input',()=>scheduleHeightSync(120),{passive:true});
        }
      }catch(e){}
    });

    document.getElementById('openNameplateEstimator').addEventListener('click',()=>{
      applyRequestedPriceSettings();
      if(frame.src==='about:blank' || !frame.src.includes('/nameplate-app/')){
        frame.src='https://yuubae96-rgb.github.io/nameplate-app/index.html?v=20260901-price-015';
      }
      overlay.classList.add('on');
      document.body.style.overflow='hidden';
      scroller.scrollTop=0;
      requestAnimationFrame(syncFrameHeight);
    });

    document.getElementById('closeNameplateEstimator').addEventListener('click',()=>{
      overlay.classList.remove('on');
      document.body.style.overflow='';
    });
  }
  waitForApp();
})();
