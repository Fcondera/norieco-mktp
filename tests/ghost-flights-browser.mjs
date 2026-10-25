import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try {
 for(const width of [1440,390,320]) {
  const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'no-preference'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.TEST_BASE_URL || 'http://127.0.0.1:5174');
  await page.waitForFunction(()=>document.querySelector('.eco-flying-ghost')?.getAnimations().length>0);
  const path=await page.locator('.eco-flying-ghost').first().evaluate(ghost=>{
   const a=ghost.getAnimations()[0];a.pause();const duration=a.effect.getTiming().duration;
   a.currentTime=duration*.25;const before=ghost.getBoundingClientRect().x;
   a.currentTime=duration*.75;const after=ghost.getBoundingClientRect().x;
   return {before,after,duration,frames:a.effect.getKeyframes().map(k=>k.transform)};
  });
  assert(Math.abs(path.after-path.before)>width*.4,'Ghost did not cross the viewport');
  assert(path.duration>=13000&&path.duration<=31000);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.getByRole('button',{name:'Acender as luzes'}).click();
  await page.locator('.eco-site[data-theme=light]').waitFor();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  assert.equal(await page.locator('.eco-flying-ghost').first().evaluate(g=>g.getAnimations()[0].playState),'paused');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
  assert.equal(await page.locator('.eco-flying-ghost').first().evaluate(g=>g.getAnimations()[0].playState),'running');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.querySelector('.eco-flying-ghost')?.getAnimations().length===0);
  assert.equal(await page.locator('.eco-ghost-flights').evaluate(e=>getComputedStyle(e).display),'none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.waitForFunction(()=>document.querySelector('.eco-flying-ghost')?.getAnimations().length>0);
  const next=await page.locator('.eco-flying-ghost').first().evaluate(g=>g.getAnimations()[0].effect.getKeyframes().map(k=>k.transform));
  assert.notDeepEqual(path.frames,next,'A new flight should get a fresh random path');
  await page.locator('.eco-header').getByRole('link',{name:'Marketplace',exact:true}).click();
  assert.equal(await page.locator('.eco-site').count(),0);
  await page.locator('.marketplace-site .eco-ghost-flights').waitFor();
  await page.locator('.marketplace-footer').getByRole('link',{name:'Termos de uso',exact:true}).click();
  assert.equal(await page.locator('.eco-ghost-flights').count(),0);
  assert.deepEqual(errors,[]);
  await context.close();
 }
 console.log('OK: full-screen ghost crossings, random paths, click-through, no overflow, background pause, reduced motion and route cleanup at 1440/390/320px.');
}finally{await browser.close();}
