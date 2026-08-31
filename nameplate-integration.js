'use strict';

(function(){
  function waitForApp(){
    const form=document.getElementById('orderForm');
    if(!form){setTimeout(waitForApp,50);return;}
    if(document.getElementById('nameplateEstimatorLauncher')) return;

    const style=document.createElement('style');
    style.textContent=`
      #nameplateEstimatorLauncher{margin:0 0 14px 0}
      .np-estimator-btn{width:100%;min-height:52px;border:1px solid #c58a35;background:#fff7e8;color:#8a5a15;border-radius:12px;font-weight:800;font-size:16px;font-family:inherit;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
      .np-overlay{position:fixed;inset:0;background:#f4f6f8;z-index:99999;display:none;flex-direction:column}
      .np-overlay.on{display:flex}
      .np-head{height:58px;flex:0 0 58px;background:#171c24;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 14px;padding-top:env(safe-area-inset-top)}
      .np-head b{font-size:16px}.np-close{border:0;background:transparent;color:#fff;font-size:30px;line-height:1;width:44px;height:44px;touch-action:manipulation}
      .np-frame-wrap{position:relative;flex:1;background:#fff;min-height:0}
      .np-frame{border:0;width:100%;height:100%;display:block;background:#fff}
      .np-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#fff;color:#667085;font-size:14px;z-index:1;pointer-events:none}
      .np-loading.done{display:none}
    `;
    document.head.appendChild(style);

    // 同一GitHub Pagesホスト内なので、先に接続・ページ取得を始める。
    const preload=document.createElement('link');
    preload.rel='prefetch';
    preload.href='/nameplate-app/index.html?v=20260901-fast2';
    document.head.appendChild(preload);

    const launcher=document.createElement('div');
    launcher.id='nameplateEstimatorLauncher';
    launcher.innerHTML='<button type="button" class="np-estimator-btn" id="openNameplateEstimator">銘板の自動見積を開く</button>';
    form.insertBefore(launcher,form.firstElementChild);

    const overlay=document.createElement('div');
    overlay.className='np-overlay';
    overlay.id='nameplateEstimatorOverlay';
    overlay.innerHTML=`<div class="np-head"><b>銘板自動見積・単価設定</b><button type="button" class="np-close" id="closeNameplateEstimator">×</button></div><div class="np-frame-wrap"><div class="np-loading" id="nameplateEstimatorLoading">読み込み中…</div><iframe class="np-frame" id="nameplateEstimatorFrame" src="about:blank"></iframe></div>`;
    document.body.appendChild(overlay);

    const frame=document.getElementById('nameplateEstimatorFrame');
    const loading=document.getElementById('nameplateEstimatorLoading');
    const estimatorUrl='/nameplate-app/index.html?v=20260901-fast2';
    let loaded=false;

    frame.addEventListener('load',()=>{
      if(frame.src && frame.src!=='about:blank'){
        loaded=true;
        loading.classList.add('done');
      }
    });

    // idle待ちをやめ、ボタンが作られた瞬間からiframe本体を読み込む。
    // これで開く操作より前にHTML/CSS/JSの解析まで進めておく。
    frame.src=estimatorUrl;

    document.getElementById('openNameplateEstimator').addEventListener('click',()=>{
      overlay.classList.add('on');
      document.body.style.overflow='hidden';
      if(!loaded) loading.classList.remove('done');
    });

    document.getElementById('closeNameplateEstimator').addEventListener('click',()=>{
      overlay.classList.remove('on');
      document.body.style.overflow='';
    });
  }
  waitForApp();
})();
