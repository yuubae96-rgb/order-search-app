import { createClient } from "https://esm.sh/@supabase/supabase-js@2.102.0";
const headers={"Access-Control-Allow-Origin":"https://yuubae96-rgb.github.io","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const out=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers});
Deno.serve(async(req:Request)=>{if(req.method==='OPTIONS')return new Response('ok',{headers});if(req.method!=='POST')return out(405,{error:'POSTのみ利用できます'});try{
const {email,current_password,password}=await req.json();if(email!=='fuucha96@yahoo.co.jp'||typeof current_password!=='string'||typeof password!=='string'||password.length<12||password.length>128)return out(400,{error:'入力内容を確認してください'});
const url=Deno.env.get('SUPABASE_URL')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const login=await fetch(url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:service,'Content-Type':'application/json'},body:JSON.stringify({email,password:current_password})});const session=await login.json();
if(!login.ok||!session.user?.email_confirmed_at||session.user?.is_anonymous)return out(401,{error:'現在のパスワードを確認してください'});
const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
if(url.includes('vnnvuxccazkdzwqjmntz')){const {data:p}=await db.from('app_users').select('role,active').eq('user_id',session.user.id).maybeSingle();if(!p?.active||p.role!=='owner')return out(403,{error:'社長アカウントで操作してください'});}
const {error}=await db.auth.admin.updateUserById(session.user.id,{password});if(error)return out(400,{error:'パスワードを変更できませんでした'});
const {error:done}=await db.rpc('company_security_complete_password',{p_user_id:session.user.id});if(done)return out(500,{error:'設定の記録に失敗しました'});return out(200,{ok:true});
}catch{return out(500,{error:'変更に失敗しました'});}});
