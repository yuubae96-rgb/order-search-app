import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.102.0';
const origin='https://yuubae96-rgb.github.io';
const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':origin}});
const productionDepartment=(value:unknown)=>!value||/^(製造|工場|2F(シルク|シール|ネーマ|オフセット)|シルク|シール|ネーマ|オフセット)/.test(String(value).normalize('NFKC'));
const processes=['印刷','エッチング','プレス・加工','検品','梱包','その他'];
securityServe(async (req:Request)=>{
 if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return response({error:'許可されていない接続元です'},403);
 if(req.method!=='POST')return response({error:'POST only'},405);
 try{
  const body=await req.json();
  if(!['list_employees','add_work_log'].includes(body.action))return response({error:'不明な操作です'},400);
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const {data:employees,error:employeeError}=await db.from('employees').select('id,name,department').eq('active',true).order('name');
  if(employeeError)throw employeeError;
  const eligible=(employees||[]).filter(e=>productionDepartment(e.department));
  if(body.action==='list_employees')return response({data:eligible});
  const employeeId=Number(body.employee_id),minutes=Number(body.minutes),quantity=body.quantity==null||body.quantity===''?null:Number(body.quantity);
  if(!Number.isSafeInteger(employeeId)||!eligible.some(e=>e.id===employeeId))return response({error:'作業者を選び直してください'},400);
  if(!processes.includes(body.process_name)||!Number.isSafeInteger(minutes)||minutes<=0||minutes>1440||quantity!==null&&(!Number.isFinite(quantity)||quantity<0))return response({error:'工程・作業時間・数量を確認してください'},400);
  const workDate=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date());
  const {data,error}=await db.from('work_logs').insert({employee_id:employeeId,work_date:workDate,job_ref:String(body.job_ref||'').trim().slice(0,200)||null,process_name:body.process_name,minutes,quantity}).select('id').single();
  if(error)throw error;
  return response({ok:true,id:data.id});
 }catch(e){return response({error:e instanceof Error?e.message:String((e as {message?:string})?.message||e)},500)}
});
const SECURITY_ROLES=["owner","office","manager","factory","sales","staff"];


const SECURITY_MODULES=["production"];
const SECURITY_RESOURCE="production-direct";


function securityServe(handler: (req: Request, info?: any) => Response | Promise<Response>) {
 const securityHeaders = {'Access-Control-Allow-Origin':'https://yuubae96-rgb.github.io','Access-Control-Allow-Headers':'authorization, apikey, x-client-info, content-type, x-video-upload-url','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Cache-Control':'no-store','Vary':'Origin','Content-Type':'application/json'};
 const deny=(status:number,error:string)=>new Response(JSON.stringify({error}),{status,headers:securityHeaders});
 Deno.serve(async (req:Request, info:any) => {
  if(req.method==='OPTIONS')return new Response('ok',{headers:securityHeaders});
  try {
   const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
   const base=Deno.env.get('SUPABASE_URL')||'';
   const bearer=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
   if(service && bearer===service)return await handler(req,info);
   if(!bearer || bearer.startsWith('sb_'))return deny(401,'ログインが必要です');
   const ur=await fetch(base+'/auth/v1/user',{headers:{apikey:service,Authorization:'Bearer '+bearer}});
   if(!ur.ok)return deny(401,'ログインし直してください');
   const user=await ur.json();
   if(!user.id || !user.email_confirmed_at || user.is_anonymous)return deny(403,'利用権限がありません');
   const pr=await fetch(base+'/rest/v1/app_users?user_id=eq.'+encodeURIComponent(user.id)+'&select=role,active',{headers:{apikey:service,Authorization:'Bearer '+service}});
   if(!pr.ok)return deny(503,'権限の確認に失敗しました');
   const profiles=await pr.json(),p=profiles[0];
   if(!p?.active || !SECURITY_ROLES.includes(p.role))return deny(403,'利用権限がありません');
   let editing=req.method!=='GET';
   try { const body=await req.clone().json();if(['list','get','list_employees','get_payroll_rules','list_operators','status','get_status','history','search'].includes(String(body.action||'')))editing=false; } catch {}
   const permissionResponse=await fetch(base+'/rest/v1/app_permissions?user_id=eq.'+encodeURIComponent(user.id)+'&select=module_key,can_view,can_edit',{headers:{apikey:service,Authorization:'Bearer '+service}});
   if(!permissionResponse.ok)return deny(503,'権限の確認に失敗しました');
   const permissions=await permissionResponse.json();
   const allowed=p.role==='owner'||permissions.some((a:any)=>(editing?SECURITY_MODULES.slice(0,1):SECURITY_MODULES).includes(a.module_key)&&a.can_view&&(!editing||a.can_edit));
   const audit=await fetch(base+'/rest/v1/rpc/company_security_record_request',{method:'POST',headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'},body:JSON.stringify({p_actor:user.id,p_resource:SECURITY_RESOURCE,p_result:allowed?200:403})});
   if(!audit.ok)return deny(503,'利用記録を保存できません');
   if(!allowed)return deny(403,'この業務の利用権限がありません');
   const response=await handler(req,info);
   const headers=new Headers(response.headers);
   for(const [k,v] of Object.entries(securityHeaders))if(k!=='Content-Type')headers.set(k,v);
   return new Response(response.body,{status:response.status,headers});
  } catch { return deny(503,'認証の確認に失敗しました'); }
 });
}

