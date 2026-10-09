import { createClient } from "https://esm.sh/@supabase/supabase-js@2.102.0";
const cors={"Access-Control-Allow-Origin":"https://yuubae96-rgb.github.io","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Cache-Control":"no-store","Content-Type":"application/json","Vary":"Origin"};
const out=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers:cors});
Deno.serve(async(req:Request)=>{
if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
if(req.method!=='POST')return out(405,{error:'POSTのみ利用できます'});
try{
const {token,password,check}=await req.json();
if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return out(400,{error:'設定リンクが無効です'});
const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:row,error}=await db.from('owner_password_setup_tokens').select('id,owner_user_id,expires_at,used_at').eq('token_hash',hash).maybeSingle();
if(error||!row||row.used_at||Date.parse(row.expires_at)<=Date.now())return out(400,{error:'このリンクは使用済み、または期限切れです'});
if(check===true)return out(200,{ok:true});
if(typeof password!=='string'||password.length<12||password.length>128)return out(400,{error:'パスワードは12〜128文字で設定してください'});
// Claim before updating; parallel requests cannot reuse the capability.
const claimedAt=new Date().toISOString();
const {data:claimed,error:claimError}=await db.from('owner_password_setup_tokens').update({used_at:claimedAt}).eq('id',row.id).is('used_at',null).gt('expires_at',claimedAt).select('id').maybeSingle();
if(claimError||!claimed)return out(409,{error:'設定中、または使用済みのリンクです'});
let uid=row.owner_user_id;
try{
if(!uid){
const {data,error}=await db.auth.admin.createUser({email:'fuucha96@yahoo.co.jp',password,email_confirm:true,app_metadata:{company_owner:true}});
if(error)throw error;uid=data.user.id;
const {error:storeError}=await db.from('owner_password_setup_tokens').update({owner_user_id:uid}).eq('id',row.id);if(storeError)throw storeError;
}else{const {error}=await db.auth.admin.updateUserById(uid,{password});if(error)throw error;}
const {error:doneError}=await db.rpc('company_security_complete_password',{p_user_id:uid});if(doneError)throw doneError;
return out(200,{ok:true,email:'fuucha96@yahoo.co.jp'});
}catch(e){await db.from('owner_password_setup_tokens').update({used_at:null}).eq('id',row.id).eq('used_at',claimedAt);return out(400,{error:'設定を完了できませんでした。もう一度お試しください。'});}
}catch{return out(500,{error:'設定に失敗しました'});}
});
