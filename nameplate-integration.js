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
    let resizeObserver=null;

    function syncFrameHeight(){
      try{
        const doc=frame.contentDocument;
        if(!doc) return;
        const h=Math.max(
          doc.documentElement ? doc.documentElement.scrollHeight : 0,
          doc.body ? doc.body.scrollHeight : 0,
          scroller.clientHeight
        );
        if(h>0) frame.style.height=h+'px';
      }catch(e){}
    }

    frame.addEventListener('load',()=>{
      syncFrameHeight();
      setTimeout(syncFrameHeight,100);
      setTimeout(syncFrameHeight,500);
      try{
        const doc=frame.contentDocument;
        if(doc && 'ResizeObserver' in window){
          if(resizeObserver) resizeObserver.disconnect();
          resizeObserver=new ResizeObserver(syncFrameHeight);
          resizeObserver.observe(doc.documentElement);
          if(doc.body) resizeObserver.observe(doc.body);
        }
      }catch(e){}
    });

    document.getElementById('openNameplateEstimator').addEventListener('click',()=>{
      if(frame.src==='about:blank' || !frame.src.includes('/nameplate-app/')){
        frame.src='https://yuubae96-rgb.github.io/nameplate-app/index.html?v=20260901-ios-scroll-fix';
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
