import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const names=['Restaurantes','Lanches','Bares','Roupas','Mercados','Farmácias','Balneários','Diversão','Pôr do sol','Passeios','Beleza','Serviços','Peixarias','Conveniências'];
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 await fs.mkdir('test-results',{recursive:true});
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));let selected='';
  await page.route('**/rest/v1/rpc/marketplace_categories',r=>r.fulfill({json:names.map((name,i)=>({id:String(i+1),name,icon:'shop'}))}));
  await page.route('**/rest/v1/rpc/marketplace_search',r=>{selected=JSON.parse(r.request().postData()||'{}').p_category;return r.fulfill({json:[]});});
  await page.goto((process.env.TEST_BASE_URL||'http://127.0.0.1:5174')+'/marketplace');
  const tiles=page.getByRole('navigation',{name:'Categorias',exact:true});
  await tiles.getByRole('button',{name:'Restaurantes',exact:true}).waitFor();
  assert.equal(await tiles.locator('button').count(),12);
  assert.equal(await tiles.getByRole('button',{name:'Explorar',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'Ver todas categorias',exact:true}).click();
  await tiles.getByRole('button',{name:'Peixarias',exact:true}).click();
  await page.getByRole('heading',{name:'Peixarias',exact:true}).waitFor();assert.equal(selected,'13');
  assert.equal(await tiles.getByRole('button',{name:'Peixarias',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'Ver menos categorias',exact:true}).click();
  assert.equal(await tiles.getByRole('button',{name:'Peixarias',exact:true}).isVisible(),true,'Collapsed grid hid its selected filter');
  await tiles.getByRole('button',{name:'Explorar',exact:true}).click();
  await page.getByRole('button',{name:'Ver todas categorias',exact:true}).click();
  assert.equal(await tiles.locator('button').count(),15);
  const card=await tiles.getByRole('button',{name:'Conveniências',exact:true}).boundingBox();
  const art=await tiles.getByRole('button',{name:'Conveniências',exact:true}).locator('.mkt-category-art').boundingBox();
  assert(art.width>=40&&art.width<card.width&&art.height>=70);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await tiles.screenshot({path:`test-results/category-tiles-dark-${width}.png`});
  await page.getByRole('button',{name:'Acender as luzes'}).click();
  await page.locator('.marketplace-site[data-theme=light]').waitFor();
  await tiles.screenshot({path:`test-results/category-tiles-light-${width}.png`});
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('OK: category image panels, mobile layout, theme switch, expand/collapse, retained selection and actual filters at 1440/390/320px.');
}finally{await browser.close();}
