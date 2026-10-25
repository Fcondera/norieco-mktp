import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5174';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 for(const width of [1440,820,390,320]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);const section=page.locator('#solucoes');await section.scrollIntoViewIfNeeded();
  assert.equal(await section.locator('article').count(),3);assert.equal(await section.locator('.ecosystem-pos,.ecosystem-phone,.ecosystem-map').count(),3);
  const links=section.locator('.eco-product-link');assert.equal(await links.count(),3);
  for(const [index,product] of [[0,'o Nori Gest\u00e3o'],[1,'o cat\u00e1logo online']]){const href=new URL(await links.nth(index).getAttribute('href'));assert.equal(href.hostname,'wa.me');assert.equal(href.searchParams.get('text'),`Ol\u00e1! Quero conhecer ${product}.`);}
  assert.equal(await links.nth(2).getAttribute('href'),'/marketplace');
  for(const theme of ['dark','light']){
   if(theme==='light')await page.locator('.eco-light-switch').click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   const cards=await section.locator('article').evaluateAll(items=>items.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}}));
   if(width>700){assert(Math.max(...cards.map(c=>c.y))-Math.min(...cards.map(c=>c.y))<1);assert(Math.max(...cards.map(c=>c.h))-Math.min(...cards.map(c=>c.h))<1);
    const endpoints=await section.locator('.ecosystem-connections').evaluate(el=>{const r=el.getBoundingClientRect();return [184,572,960].map(x=>r.left+x/1144*r.width)});
    cards.forEach((card,i)=>assert(Math.abs(card.x+card.w/2-endpoints[i])<2,'Connection misses card center'));
    assert.equal(await section.locator('.ecosystem-connections').isVisible(),true);
   }else{assert(cards[1].y>cards[0].y+cards[0].h);assert(cards[2].y>cards[1].y+cards[1].h);assert.equal(await section.locator('.ecosystem-connections').isVisible(),false);}
   assert.equal(await section.locator('.ecosystem-float').first().evaluate(el=>getComputedStyle(el).animationName),'none');
   await section.screenshot({path:`test-results/ecosystem-verified-${theme}-${width}.png`});
  }
  const audit=await new AxeBuilder({page}).include('#solucoes').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
  if(width===1440){await page.emulateMedia({reducedMotion:'no-preference'});const card=section.locator('article').first();await card.scrollIntoViewIfNeeded();await page.waitForTimeout(1000);const r=await card.boundingBox();await page.mouse.move(r.x+r.width*.85,r.y+r.height*.25);await page.waitForTimeout(450);assert.notEqual(await card.locator('.ecosystem-perspective').evaluate(el=>getComputedStyle(el).transform),'matrix(1, 0, 0, 1, 0, 0)');assert.notEqual(await card.locator('.ecosystem-float').evaluate(el=>getComputedStyle(el).animationName),'none');
   await page.mouse.move(0,0);assert.equal(await card.evaluate(el=>el.style.getPropertyValue('--tilt-y')),'0deg');
   const path=section.locator('.ecosystem-signal').first();const a=await path.evaluate(el=>getComputedStyle(el).strokeDashoffset);await page.waitForTimeout(300);assert.notEqual(await path.evaluate(el=>getComputedStyle(el).strokeDashoffset),a);
   await links.first().focus();assert.equal(await links.first().evaluate(el=>el===document.activeElement),true);
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('OK: 3D illustrations, themes, CTA destinations, connection geometry, desktop/tablet/mobile, hover/reset, signals, keyboard, reduced motion and WCAG checks.');
}finally{await browser.close();}
