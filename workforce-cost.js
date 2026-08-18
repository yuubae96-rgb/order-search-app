(function(){
'use strict';
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function money(v){return '¥'+Number(v||0).toLocaleString('ja-JP',{maximumFractionDigits:0});}
function wait(){if(!window.supabaseClient){setTimeout(wait,200);return;} init();}
function init(){
 const settings=document.querySelector('[data-panel="settings"],#panel-settings,.settings-panel');
 if(!settings||document.getElementById('workforce-cost-root')){if(!settings)setTimeout(init,500);return;}
 const root=document.createElement('section'); root.id='workforce-cost-root'; root.className='card';
 root.innerHTML=`<h2>勤怠・給与・労務原価</h2><p style="font-size:13px;color:#64748b;line-height:1.7">タイムカード → 勤務時間 → 給与 → 会社負担人件費 → 製造原価へつなぐ土台です。</p>
 <div style="display:grid;gap:10px"><button type="button" id="wc-emp" class="primary">従業員登録</button><button type="button" id="wc-att">勤怠登録</button><button type="button" id="wc-calc">月次労務費を計算</button></div>
 <div id="wc-status" style="margin-top:12px;font-size:13px"></div><div id="wc-summary" style="margin-top:12px"></div>`;
 settings.prepend(root);
 root.querySelector('#wc-emp').onclick=addEmployee; root.querySelector('#wc-att').onclick=addAttendance; root.querySelector('#wc-calc').onclick=calcMonth;
 renderSummary();
}
async function addEmployee(){
 const name=prompt('氏名'); if(!name)return; const department=prompt('部門（例：製造、事務）','製造')||'製造'; const hourly=Number(prompt('基準時給（円）','0')||0); const burden=Number(prompt('会社負担率％（社会保険等。後で変更可）','0')||0)/100;
 const {error}=await supabaseClient.from('employees').insert({name,department,hourly_base:hourly,company_burden_rate:burden}); alert(error?'登録エラー：'+error.message:'従業員を登録しました'); renderSummary();
}
async function addAttendance(){
 const {data:emps,error}=await supabaseClient.from('employees').select('id,name,department').eq('active',true).order('name'); if(error||!emps?.length){alert('先に従業員を登録してください');return;}
 const names=emps.map((e,i)=>`${i+1}: ${e.name}（${e.department||''}）`).join('\n'); const n=Number(prompt('従業員番号を選んでください\n'+names)); const e=emps[n-1]; if(!e)return;
 const d=prompt('勤務日 YYYY-MM-DD',new Date().toISOString().slice(0,10)); if(!d)return; const cin=prompt('出勤 HH:MM','08:30'); const cout=prompt('退勤 HH:MM','17:00'); const br=Number(prompt('休憩 分','60')||0);
 const mins=(t)=>{const [h,m]=String(t).split(':').map(Number);return h*60+m}; const total=Math.max(0,mins(cout)-mins(cin)-br); const regular=Math.min(total,480), overtime=Math.max(0,total-480);
 const {error:er}=await supabaseClient.from('attendance_records').upsert({employee_id:e.id,work_date:d,clock_in:cin,clock_out:cout,break_minutes:br,regular_minutes:regular,overtime_minutes:overtime,source:'manual',confirmed:true},{onConflict:'employee_id,work_date'}); alert(er?'登録エラー：'+er.message:`勤怠を登録しました（実働 ${Math.floor(total/60)}時間${total%60}分）`); renderSummary();
}
async function calcMonth(){
 const ym=prompt('計算する月 YYYY-MM',new Date().toISOString().slice(0,7)); if(!ym)return; const start=ym+'-01'; const end=new Date(Number(ym.slice(0,4)),Number(ym.slice(5,7)),0).toISOString().slice(0,10);
 const {data:emps}=await supabaseClient.from('employees').select('*').eq('active',true); const {data:atts}=await supabaseClient.from('attendance_records').select('*').gte('work_date',start).lte('work_date',end).eq('confirmed',true);
 if(!emps?.length){alert('従業員が未登録です');return;}
 for(const e of emps){const a=(atts||[]).filter(x=>x.employee_id===e.id); const reg=a.reduce((s,x)=>s+x.regular_minutes,0), ot=a.reduce((s,x)=>s+x.overtime_minutes,0); const rate=Number(e.hourly_base||0); const base=reg/60*rate; const overtime=ot/60*rate*1.25; const gross=base+overtime; const social=gross*Number(e.company_burden_rate||0); const total=gross+social; const hours=(reg+ot)/60; await supabaseClient.from('payroll_monthly').upsert({employee_id:e.id,payroll_month:start,regular_minutes:reg,overtime_minutes:ot,base_pay:base,overtime_pay:overtime,gross_pay:gross,employer_social_cost:social,total_company_cost:total,effective_hourly_cost:hours?total/hours:0,calculated_at:new Date().toISOString()},{onConflict:'employee_id,payroll_month'});}
 alert('月次労務費を計算しました。※現在は基本時給＋時間外1.25倍＋会社負担率の簡易計算です。実際の給与計算ルールは後で接続します。'); renderSummary(ym);
}
async function renderSummary(ym){
 const box=document.getElementById('wc-summary'); if(!box)return; const month=ym||new Date().toISOString().slice(0,7); const start=month+'-01'; const {data:rows}=await supabaseClient.from('payroll_monthly').select('*,employees(name,department)').eq('payroll_month',start).order('id');
 if(!rows?.length){box.innerHTML='<div style="color:#64748b;font-size:13px">'+esc(month)+' の労務費計算はまだありません。</div>';return;}
 const total=rows.reduce((s,r)=>s+Number(r.total_company_cost||0),0); box.innerHTML=`<div style="font-weight:800;margin-bottom:8px">${esc(month)} 会社負担人件費：${money(total)}</div>`+rows.map(r=>`<div style="padding:8px 0;border-top:1px solid #e5e7eb;font-size:13px">${esc(r.employees?.name||'')}　${money(r.total_company_cost)}　実効 ${money(r.effective_hourly_cost)}/h</div>`).join('');
}
wait();
})();