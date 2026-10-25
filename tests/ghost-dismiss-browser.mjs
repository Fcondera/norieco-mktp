import {chromium} from '@playwright/test';import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{for(const width of [1440,390]){const page=await browser.newPage({viewport:{width,height:950},hasTouch:width<600,isMobile:width<600});await page.goto('http://127.0.0.1:5174');
const staticGhost=page.locator('.eco-ghost-hero');await staticGhost.evaluate(el=>el.getAnimations().forEach(a=>a.pause()));await staticGhost.scrollIntoViewIfNeeded();if(width<600)await staticGhost.tap();else await staticGhost.click();assert.equal(await staticGhost.count(),0);
await page.waitForFunction(()=>document.querySelector('.eco-flying-ghost')?.getAnimations().length>0);
const flying=page.locator('.eco-flying-ghost').first();await flying.evaluate(el=>{const a=el.getAnimations()[0];a.pause();a.currentTime=Number(a.effect.getTiming().duration)*.5;});
if(width<600)await flying.tap();else await flying.click();assert.equal(await flying.isHidden(),true);
await page.emulateMedia({reducedMotion:'reduce'});await page.emulateMedia({reducedMotion:'no-preference'});assert.equal(await flying.isHidden(),true);
assert.equal(await page.locator('footer .halloween-toy').count(),1);await page.locator('footer .halloween-toy').scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/footer-ornament-${width}.png`});await page.close();}
console.log('OK: static and flying ghosts dismiss by click/tap and stay dismissed after animation reset; ornament inside footer.');}finally{await browser.close();}
