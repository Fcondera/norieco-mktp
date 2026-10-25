import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 for(const width of [1440,390,320]){
  const mobile=width<600;
  const context=await browser.newContext({viewport:{width,height:950},hasTouch:mobile,isMobile:mobile});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/rest/v1/rpc/marketplace_categories',r=>r.fulfill({json:[]}));
  await page.route('**/rest/v1/rpc/marketplace_search',r=>r.fulfill({json:[]}));
  for(const path of ['/','/marketplace']){
   await page.goto('http://127.0.0.1:5174'+path);const toy=page.locator('.halloween-toy');await toy.scrollIntoViewIfNeeded();
   assert.equal(await toy.getAttribute('aria-pressed'),'false');
   if(mobile){await toy.tap();}else{await toy.hover();}
   await page.waitForTimeout(1000);assert.equal(await toy.getAttribute('aria-pressed'),'true');
   assert.equal(await toy.locator('.halloween-toy-interior').evaluate(el=>getComputedStyle(el).opacity),'1');
   await toy.screenshot({path:`test-results/toy-${path==='/'?'lp':'marketplace'}-${width}.png`});
   if(mobile){await toy.tap();}else{await page.mouse.move(0,0);}
   assert.equal(await toy.getAttribute('aria-pressed'),'false');
   await toy.focus();await page.keyboard.press('Enter');assert.equal(await toy.getAttribute('aria-pressed'),'true');
   await page.keyboard.press('Escape');assert.equal(await toy.getAttribute('aria-pressed'),'false');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${path} overflows at ${width}`);
   await page.emulateMedia({reducedMotion:'reduce'});
   assert.equal(await toy.locator('.halloween-toy-pumpkin').evaluate(el=>getComputedStyle(el).animationName),'none');
   await page.emulateMedia({reducedMotion:'no-preference'});
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('OK: LP and marketplace hover, touch open/close, keyboard, reduced motion, no overflow at 1440/390/320px.');
}finally{await browser.close();}
