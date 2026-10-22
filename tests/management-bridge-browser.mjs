import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const build=path.resolve('../vendapeixe/build/web');
const now=Math.floor(Date.now()/1000),uid='10000000-0000-4000-8000-000000000701';
const user={id:uid,aud:'authenticated',role:'authenticated',email:'sso-test@example.test',email_confirmed_at:new Date().toISOString(),created_at:new Date().toISOString(),updated_at:new Date().toISOString(),app_metadata:{provider:'google',providers:['google']},user_metadata:{full_name:'Pessoa Teste'},identities:[]};
const token=kind=>[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:uid,aud:'authenticated',role:'authenticated',iat:now,exp:now+3600,email:user.email})).toString('base64url'),kind].join('.');
const sourceSession={access_token:token('source'),refresh_token:'source-private-refresh',token_type:'bearer',expires_in:3600,expires_at:now+3600,user};
const panelSession={...sourceSession,access_token:token('panel'),refresh_token:'independent-panel-refresh'};
let exchanges=0;
try{
 const context=await browser.newContext({viewport:{width:1200,height:1000}});
 const errors=[];
 context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 if(context.routeWebSocket)await context.routeWebSocket(/supabase\.co\/realtime/,()=>{});
 await context.route('**/*.supabase.co/**',async route=>{
  const req=route.request(),url=new URL(req.url());let json;
  if(url.pathname==='/functions/v1/norieco-panel-session'){
   console.log('Bridge: requesting independent panel session');
   assert.equal(req.headers().authorization,'Bearer '+sourceSession.access_token);exchanges++;json={session:panelSession};
  }else if(url.pathname==='/auth/v1/user')json=user;
  else if(url.pathname==='/rest/v1/profiles'){
   const profile={id:uid,name:'Pessoa Teste',email:user.email,tenant_id:'866214a2-5357-4f03-8b4b-c98c8703bfb9',role:'SERVICE',is_active:false,access_status:'pending'};
   json=(req.headers().accept||'').includes('object')?profile:[profile];
  }else if(url.pathname.endsWith('/pdv_trial_status'))json={has_pdv:false,status:'NEW'};
  else if(url.pathname.endsWith('/current_tenant_id')||url.pathname.endsWith('/marketplace_my_profile'))json=null;
  else json=[];
  await route.fulfill({json});
 });
 const serve=async(route,relative)=>{
  const file=path.resolve(build,relative);
  assert.ok(file.startsWith(build+path.sep));
  const ext=path.extname(file);const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.wasm':'application/wasm','.png':'image/png','.ttf':'font/ttf'};
  await route.fulfill({body:await fs.readFile(file),contentType:types[ext]||'application/octet-stream',headers:{'Access-Control-Allow-Origin':'*'}});
 };
 await context.route('https://gestao.norieco.com.br/**',route=>{
  const pathname=new URL(route.request().url()).pathname;
  return serve(route,['/','/inicio','/auth/bridge'].includes(pathname)?'index.html':decodeURIComponent(pathname.slice(1)));
 });
 await context.route('https://www.gstatic.com/flutter-canvaskit/**',route=>{
  const rest=new URL(route.request().url()).pathname.split('/').slice(3).join('/');
  return serve(route,'canvaskit/'+rest);
 });
 const helper=await fs.readFile('src/lib/management-access.mjs','utf8');
 await context.route('https://norieco.com.br/**',async route=>{
  if(new URL(route.request().url()).pathname==='/bridge-helper.mjs')return route.fulfill({body:helper,contentType:'application/javascript'});
  return route.fulfill({contentType:'text/html; charset=utf-8',body:`<meta charset="utf-8"><button id="open">Abrir Gestão</button><p id="result"></p><script type="module">import{connectManagement}from'/bridge-helper.mjs';document.querySelector('button').onclick=()=>connectManagement(async()=>({data:{session:${JSON.stringify(sourceSession)}},error:null})).then(()=>document.querySelector('#result').textContent='Sessão concluída').catch(e=>document.querySelector('#result').textContent=e.message);</script>`});
 });
 const page=await context.newPage();await page.goto('https://norieco.com.br/');
 await page.waitForFunction(()=>typeof document.querySelector('button')?.onclick==='function');
 const [panel]=await Promise.all([page.waitForEvent('popup',{timeout:120000}),page.getByRole('button',{name:'Abrir Gestão'}).click()]);
 console.log('Bridge: panel opened');
 await page.getByText('Sessão concluída').waitFor({timeout:90000}).catch(async e=>{console.log(JSON.stringify({result:await page.locator('#result').innerText(),exchanges,panel:panel.url(),errors}));throw e;});
 assert.equal(exchanges,1);assert.equal(new URL(panel.url()).pathname,'/inicio');assert.equal(new URL(panel.url()).hash,'');
 await panel.locator('flt-semantics-placeholder').evaluate(el=>el.click());
 await panel.getByText('Sua loja, seu painel. 15 dias grátis.',{exact:true}).waitFor({timeout:30000});
 assert.equal(await panel.getByRole('button',{name:'Continuar com Google',exact:true}).count(),0);
 assert.equal(await panel.getByText('CPF',{exact:true}).count(),0);
 const storage=await panel.evaluate(()=>Object.values(localStorage).join(''));
 assert.ok(storage.includes('independent-panel-refresh'));assert.ok(!storage.includes('source-private-refresh'));
 assert.deepEqual(errors,[]);
 await fs.mkdir('test-results',{recursive:true});await panel.screenshot({path:'test-results/management-bridge.png',fullPage:true});
 await context.close();console.log('OK: compiled Flutter receives the existing identity, gets an independent session and opens onboarding without a second login.');
}finally{await browser.close();}
