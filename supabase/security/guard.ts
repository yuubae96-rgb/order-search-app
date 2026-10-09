
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
   const response=await handler(req,info);
   const headers=new Headers(response.headers);
   for(const [k,v] of Object.entries(securityHeaders))if(k!=='Content-Type')headers.set(k,v);
   return new Response(response.body,{status:response.status,headers});
  } catch { return deny(503,'認証の確認に失敗しました'); }
 });
}
