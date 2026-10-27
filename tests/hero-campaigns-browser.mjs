import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5174';
const assets=['nori-estudio','nori-assinatura','nori-ofertas'];
try{
 for(const width of [1920,1440,820,701,390,320]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));await page.goto(base);
  const hero=page.locator('.eco-campaign-carousel');assert.equal(await hero.locator('.eco-slide').count(),3);
  for(let index=0;index<3;index++){
   const slide=hero.locator('.eco-slide.is-active');assert.match(await slide.locator('img').getAttribute('src'),new RegExp('/hero/'+assets[index]));await slide.locator('img').evaluate(async image=>{image.loading='eager';await image.decode();});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(index>0){const banner=slide.locator('.eco-campaign-art'),url=new URL(await banner.getAttribute('href'));assert.equal(url.hostname,'wa.me');assert.match(url.searchParams.get('text'),index===1?/1 mês grátis/:/3 meses grátis/);
    const caption=slide.locator('.eco-campaign-caption');assert.equal(await caption.locator('a').isVisible(),width<=700);if(width>700){const frame=await hero.boundingBox(),image=await slide.locator('img').boundingBox();assert(Math.abs(frame.width-image.width)<2);assert(Math.abs(frame.height-image.height)<2);}
   }
   if(width<=700||index===0){const frame=await hero.boundingBox();for(const link of await slide.locator('.eco-slide-actions a:visible').all()){const r=await link.boundingBox();assert(r.x>=0&&r.x+r.width<=width,'CTA overflows viewport');assert(r.y+r.height<=frame.y+frame.height,'CTA clipped by hero');}}
   await hero.screenshot({path:`test-results/hero-campaign-${width}-${index}.png`});
   await slide.locator('a:visible').first().focus();await page.keyboard.press('ArrowRight');
  }
  assert.match(await hero.locator('.eco-slide.is-active img').getAttribute('src'),/nori-estudio/);
  if(width===1440||width===390){const audit=await new AxeBuilder({page}).include('.eco-campaign-carousel').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(audit.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);}
  assert.equal(await hero.locator('.eco-carousel-controls').count(),0);assert.equal(await hero.locator('.eco-carousel-progress').count(),0);assert.deepEqual(errors,[]);await context.close();
 }
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();await page.goto(base);const hero=page.locator('.eco-campaign-carousel');await hero.locator('.eco-carousel-progress').waitFor();const initial=await hero.locator('.eco-slide.is-active img').getAttribute('src');await page.waitForTimeout(6300);assert.notEqual(await hero.locator('.eco-slide.is-active img').getAttribute('src'),initial);
 await hero.locator('.eco-carousel-pause').focus();await page.keyboard.press('Enter');assert.equal(await hero.locator('.eco-carousel-pause').getAttribute('aria-pressed'),'true');assert.equal(await hero.locator('.eco-carousel-progress>span').evaluate(el=>getComputedStyle(el).animationPlayState),'paused');await context.close();
 console.log('OK: all three user banners, full desktop compositions, readable mobile CTAs, WhatsApp offers, keyboard navigation, autoplay, filling progress, accessible pause, reduced motion and WCAG checks at 1920/1440/820/701/390/320px.');
}finally{await browser.close();}
