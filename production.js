(()=>{
'use strict';
const $=id=>document.getElementById(id),api='https://vnnvuxccazkdzwqjmntz.supabase.co/functions/v1/production-direct';
const status=document.createElement('p');status.className='m';status.setAttribute('role','status');$('emp').after(status);
let busy=false;
async function call(body){const r=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok||data.error)throw Error(data.error||'読み込みに失敗しました');return data}
const processes=['印刷','エッチング','プレス・加工','検品','梱包','その他'];
$('proc').innerHTML=processes.map(x=>`<button type="button" class="pick" data-p="${x}">${x}</button>`).join('');
document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{$('process').value=b.dataset.p;document.querySelectorAll('[data-p]').forEach(x=>x.classList.toggle('on',x===b))});
$('mins').innerHTML=[5,10,15,30].map(x=>`<button type="button" class="pick" data-m="${x}">${x}分</button>`).join('');
document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{$('minutes').value=b.dataset.m;document.querySelectorAll('[data-m]').forEach(x=>x.classList.toggle('on',x===b))});
async function load(){status.textContent='作業者を読み込んでいます…';$('save').disabled=true;try{const {data}=await call({action:'list_employees'});$('emp').replaceChildren(new Option('選択してください',''));data.forEach(e=>$('emp').add(new Option(e.name+'（'+(e.department||'未設定')+'）',e.id)));status.textContent='作業者 '+data.length+'名を読み込みました';$('save').disabled=!data.length}catch(e){status.textContent='社員一覧の読み込みに失敗しました：'+e.message}}
$('save').onclick=async()=>{if(busy)return;const minutes=Number($('minutes').value),quantity=$('qty').value===''?null:Number($('qty').value);if(!$('emp').value||!$('process').value||!Number.isInteger(minutes)||minutes<=0||minutes>1440||quantity!==null&&(!Number.isFinite(quantity)||quantity<0)){status.textContent='作業者・工程を選び、作業時間は1〜1440分の整数、数量は0以上で入力してください。';return}busy=true;$('save').disabled=true;status.textContent='製造実績を登録しています…';try{await call({action:'add_work_log',employee_id:Number($('emp').value),process_name:$('process').value,minutes,quantity,job_ref:$('job').value});status.textContent='製造実績を登録しました';['job','qty','minutes','process'].forEach(id=>$(id).value='');document.querySelectorAll('.pick').forEach(b=>b.classList.remove('on'))}catch(e){status.textContent='登録エラー：'+e.message}finally{busy=false;$('save').disabled=false}};
load();
})();
