import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try {
 await fs.mkdir('test-results',{recursive:true});
 for(const width of [1440,390,320]) {
  const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/rest/v1/rpc/marketplace_categories',r=>r.fulfill({json:[]}));
  await page.route('**/rest/v1/rpc/marketplace_search',r=>r.fulfill({json:[]}));
  await page.goto(process.env.TEST_BASE_URL || 'http://127.0.0.1:5174');
  await page.getByRole('button',{name:'Acender as luzes'}).click();
  await page.locator('.eco-header').getByRole('link',{name:'Marketplace',exact:true}).click();
  await page.locator('.marketplace-site[data-theme=light]').waitFor();
  const art=page.locator('.mkt-hero .intro-art img');await art.evaluate(i=>i.decode());
  assert((await art.boundingBox()).height>180,'Seasonal illustration should be prominent');
  assert.equal(await page.locator('.mkt-home .eyebrow').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const boxes=await Promise.all(['.brand','.header-search','.city-button','.eco-light-switch','.header-login','.cart-top'].map(s=>page.locator('.header '+s).boundingBox()));
  for(let a=0;a<boxes.length;a++)for(let b=a+1;b<boxes.length;b++){const x=boxes[a],y=boxes[b];assert(!x||!y||x.x+x.width<=y.x+.5||y.x+y.width<=x.x+.5||x.y+x.height<=y.y+.5||y.y+y.height<=x.y+.5,'Header controls overlap');}
  await page.screenshot({path:`test-results/marketplace-light-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:'Apagar as luzes'}).click();
  await page.locator('.marketplace-site[data-theme=dark]').waitFor();
  await page.reload();await page.locator('.marketplace-site[data-theme=dark]').waitFor();
  await page.locator('.city-button').click();
  await page.locator('.city-picker input').fill('Manaus');
  await page.locator('.city-picker').getByRole('button',{name:'Aplicar',exact:true}).click();
  assert.match(await page.locator('.city-button').innerText(),/Manaus/);
  await page.screenshot({path:`test-results/marketplace-dark-${width}.png`,fullPage:true});
  await page.locator('.marketplace-footer').getByRole('link',{name:'Termos de uso',exact:true}).click();
  await page.locator('.marketplace-site[data-theme=dark]').waitFor();
  assert.equal(await page.locator('.eco-ghost-flights').count(),0);
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('OK: shared landing/marketplace theme, day/night persistence, 3D hero, clean headings, city picker and no header overlap at 1440/390/320px.');
}finally{await browser.close();}
