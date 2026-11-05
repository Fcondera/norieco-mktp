import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try {
 await fs.mkdir('test-results',{recursive:true});
 for(const width of [1440,390,320]) {
  const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.TEST_BASE_URL || 'http://127.0.0.1:5174');
  await page.locator('.eco-site[data-theme=dark]').waitFor();
  await page.locator('.eco-slide.is-active .eco-slide-image').evaluate(image=>image.decode());
  assert.match(await page.locator('.eco-slide.is-active .eco-slide-image').getAttribute('src'),/hero\/nori-estudio/);
  assert.equal(await page.locator('.christmas-ornament').first().evaluate(image=>getComputedStyle(image).animationName),'none');
  await page.getByRole('button',{name:'Acender as luzes'}).click();
  await page.locator('.eco-site[data-theme=light]').waitFor();
  assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.eco-site')).backgroundColor),'rgb(255, 253, 247)');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`test-results/landing-light-${width}.png`,fullPage:true});
  await page.reload();
  await page.locator('.eco-site[data-theme=light]').waitFor();
  await page.getByRole('button',{name:'Apagar as luzes'}).click();
  await page.locator('.eco-site[data-theme=dark]').waitFor();
  assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.eco-site')).backgroundColor),'rgb(11, 33, 25)');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`test-results/landing-dark-${width}.png`,fullPage:true});
  assert.equal(await page.locator('.christmas-ornament').count(),4);
  assert.deepEqual(errors,[]);
  await context.close();
 }
 console.log('OK: light/dark, saved preference, Christmas decorations and no horizontal overflow at 1440/390/320px.');
}finally{await browser.close();}
