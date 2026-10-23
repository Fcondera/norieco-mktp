import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const build=path.resolve('../vendapeixe/build/web');
const stores=Object.fromEntries(['a','b'].map((key,i)=>['loja-'+key,{
 tenant:'20000000-0000-4000-8000-00000000010'+(i+1),name:'Loja '+key.toUpperCase(),
 product:'30000000-0000-4000-8000-00000000010'+(i+1),productName:'Bebida '+key.toUpperCase(),
}]));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 for(const width of [1200,390]){
  const c=await browser.newContext({viewport:{width,height:950}}),p=await c.newPage();
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  if(c.routeWebSocket)await c.routeWebSocket(/supabase\.co\/realtime/,()=>{});
  const serve=async(route,relative)=>{
   const file=path.resolve(build,relative);assert.ok(file.startsWith(build+path.sep));
   const type={'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.wasm':'application/wasm','.png':'image/png','.otf':'font/otf'}[path.extname(file)]||'application/octet-stream';
   try{await route.fulfill({body:await fs.readFile(file),contentType:type,headers:{'access-control-allow-origin':'*'}})}catch{await route.fulfill({status:404,body:''})}
  };
  await c.route('https://norieco.com.br/**',route=>{
   const pathname=new URL(route.request().url()).pathname;
   return serve(route,/^\/loja-[a-z]+\/?$/.test(pathname)?'index.html':pathname.slice(1));
  });
  await c.route('https://www.gstatic.com/flutter-canvaskit/**',route=>serve(route,'canvaskit/'+new URL(route.request().url()).pathname.split('/').slice(3).join('/')));
  await c.route('**/*.supabase.co/**',async route=>{
   const req=route.request(),pathname=new URL(req.url()).pathname,domain=req.headers()['x-catalog-domain'];
   const store=stores[domain?.replace('.norieco.com.br','')];
   if(pathname.endsWith('/public_catalog_settings'))return route.fulfill({json:store?{
    tenant_id:store.tenant,is_default:false,company_name:store.name,business_type:'RESTAURANT',logo_url:'',
    whatsapp:'5592999990000',phone:'5592999990000',pickup_address:'Rua teste',cities:['Manaus'],delivery_state:'AM',catalog_appearance:{},
   }:null});
   assert.ok(store,'Catalog requested data without a valid store context: '+pathname);
   if(pathname.endsWith('/public_catalog_products'))return route.fulfill({json:[{
    id:store.product,name:store.productName,species:'Bebida',price_per_kg:10,sale_mode:'UNIT',
    average_weight_kg:1,available_online_stock_kg:100,online_stock_limit_kg:100,is_available:true,
    is_featured:true,main_image_url:'',short_description:'Produto de teste',preparation_options:[],
   }]});
   if(pathname.endsWith('/home_banners'))return route.fulfill({json:[]});
   throw Error('Unexpected catalog request; no real orders may be created: '+pathname);
  });
  for(const slug of ['loja-a','loja-b']){
   const store=stores[slug];await p.goto('https://norieco.com.br/'+slug);
   await p.locator('flt-semantics-placeholder').waitFor({state:'attached',timeout:90000});await p.locator('flt-semantics-placeholder').evaluate(el=>el.click());
   await p.getByRole('button',{name:'Comprar',exact:true}).first().waitFor({timeout:30000}).catch(async error=>{
    console.log(JSON.stringify({url:p.url(),body:await p.locator('body').innerText(),errors}));
    await p.screenshot({path:'test-results/catalog-failure.png',fullPage:true});throw error;
   });
   assert.equal(new URL(p.url()).pathname,'/'+slug,'Catalog redirected to a subdomain');
   assert.equal(await p.getByRole('button',{name:/Ver carrinho/}).count(),0,'Another store cart leaked');
   await p.mouse.move(width/2,600);await p.mouse.wheel(0,650);
   await p.getByRole('button',{name:'Comprar',exact:true}).first().click();await p.getByRole('button',{name:/Ver carrinho/}).first().waitFor();
   const local=await p.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
   const saved=Object.entries(local).find(([key])=>key.includes('renato_condera_cart:'+store.tenant));
   assert.ok(saved?.[1].includes(store.product),'Cart was not scoped to its tenant');
   assert.equal(await p.locator('link[rel="manifest"]').count(),0,'Shared catalog claimed the whole origin as a PWA');
   assert.equal(await p.evaluate(async()=>navigator.serviceWorker?(await navigator.serviceWorker.getRegistrations()).length:0),0);
  }
  await p.goto('https://norieco.com.br/loja-a');await p.locator('flt-semantics-placeholder').waitFor({state:'attached',timeout:90000});await p.locator('flt-semantics-placeholder').evaluate(el=>el.click());
  await p.getByRole('button',{name:/Ver carrinho/}).first().waitFor({timeout:30000});
  await fs.mkdir('test-results',{recursive:true});await p.screenshot({path:'test-results/path-catalog-'+width+'.png',fullPage:true});
  assert.deepEqual(errors,[]);await c.close();console.log('OK: real Flutter catalog at /slug, two tenant carts, no redirect or origin-wide worker',width);
 }
}finally{await browser.close()}
