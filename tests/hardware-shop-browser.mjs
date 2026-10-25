import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5174';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const quote={cep:'01001000',address:{street:'Praça da Sé',district:'Sé',city:'São Paulo',state:'SP'},fees:[],feesConfirmed:false,options:[],mode:'manual',message:'A equipe confirma o frete e o prazo para este CEP antes do pagamento.',expiresAt:new Date(Date.now()+15*60*1000).toISOString()};
try{
 await fs.mkdir('test-results',{recursive:true});
 for(const width of [1440,820,390,320]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/equipamentos/pdv-completo.json',r=>r.fulfill({json:{photos:[]}}));
  await page.route('**/.netlify/functions/hardware-shipping',async r=>{const cep=JSON.parse(r.request().postData()).cep;await r.fulfill(cep==='99999999'?{status:422,json:{error:'CEP não encontrado. Confira o número informado.'}}:{json:quote});});
  await page.goto(base+'/');
  const card=page.locator('.hw-offer-card');assert.equal(await card.getAttribute('href'),'/equipamentos/pdv-completo');
  await card.click();await page.waitForURL('**/equipamentos/pdv-completo');assert.equal(await page.locator('.hw-product-grid').count(),1);assert.equal(await page.locator('.hw-overview-panel .hw-product-description').count(),1);assert.match(await page.locator('h1').textContent(),/Intel E7400/);assert.match(await page.locator('#ficha-kit').textContent(),/8.900 g/);assert.match(await page.locator('#ficha-kit').textContent(),/3 meses/);assert.match(await page.locator('.hw-price').textContent(),/1\.650,00/);
  assert.equal(await page.locator('.hw-thumbnails button').count(),5);await page.getByRole('button',{name:'Impressora',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Impressora',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'Adicionar ao carrinho',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Remover do carrinho',exact:true}).getAttribute('aria-pressed'),'true');await page.getByRole('button',{name:'Remover do carrinho',exact:true}).click();
  for(const theme of ['dark','light']){
   if(theme==='light')await page.locator('.eco-light-switch').click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`product overflows at ${width}`);
   await page.screenshot({path:`test-results/hardware-product-${theme}-${width}.png`,fullPage:true});
   const themeAudit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(themeAudit.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],theme);
  }
  let audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(audit.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);
  await page.getByRole('textbox',{name:'CEP de entrega',exact:true}).fill('99999999');await page.getByRole('button',{name:'Consultar',exact:true}).click();await page.getByRole('alert').waitFor();
  await page.getByRole('textbox',{name:'CEP de entrega',exact:true}).fill('01001000');await page.getByRole('button',{name:'Consultar',exact:true}).click();await page.getByRole('status').waitFor();
  assert.match(await page.locator('.hw-shipping-result').textContent(),/São Paulo/);
  await page.getByRole('link',{name:/Comprar agora/}).click();await page.waitForURL('**/equipamentos/pdv-completo/checkout?cep=01001000');assert.equal(await page.getByRole('textbox',{name:'CEP de entrega',exact:true}).inputValue(),'01001-000');
  await page.getByLabel('Nome completo',{exact:true}).fill('Cliente de Teste');await page.getByLabel('E-mail',{exact:true}).fill('cliente@example.com');await page.getByLabel('WhatsApp com DDD',{exact:true}).fill('11999999999');
  await page.getByRole('button',{name:'Consultar',exact:true}).click();await page.getByRole('status').waitFor();assert.equal(await page.getByLabel('Rua ou avenida',{exact:true}).inputValue(),'Praça da Sé');
  await page.getByLabel('Número',{exact:true}).fill('123');await page.getByRole('button',{name:/Revisar pedido/}).click();
  await page.getByRole('heading',{name:'Confira antes de continuar.'}).waitFor();assert.equal(await page.getByRole('button',{name:/Solicitar compra pelo WhatsApp/}).isDisabled(),true);
  assert.match(await page.locator('.hw-order-summary').textContent(),/A confirmar/);assert.match(await page.locator('.hw-summary-total').textContent(),/Valor do kit/);
  await page.getByRole('checkbox',{name:/Autorizo o contato/}).check();const send=page.getByRole('link',{name:/Solicitar compra pelo WhatsApp/}),url=new URL(await send.getAttribute('href'));assert.equal(url.hostname,'wa.me');assert.match(url.searchParams.get('text'),/cliente@example.com/);assert.match(url.searchParams.get('text'),/1\.650,00/);assert.match(url.searchParams.get('text'),/a confirmar/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`checkout overflows at ${width}`);
  await page.screenshot({path:`test-results/hardware-checkout-review-${width}.png`,fullPage:true});
  audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(audit.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);
  await page.getByRole('button',{name:'Editar meus dados'}).click();await page.getByRole('textbox',{name:'CEP de entrega',exact:true}).fill('02002000');assert.equal(await page.locator('.hw-shipping-result').count(),0);assert.equal(await page.getByLabel('Rua ou avenida',{exact:true}).inputValue(),'');
  assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(k=>localStorage.getItem(k)?.includes('cliente@example.com'))),false);
  assert.deepEqual(errors,[]);await context.close();
 }
 // Real carrier pricing must be chosen and all fee lines retained in the summary.
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
 await page.route('**/equipamentos/pdv-completo.json',r=>r.fulfill({json:{photos:[]}}));
 await page.route('**/.netlify/functions/hardware-shipping',r=>r.fulfill({json:{...quote,mode:'quoted',feesConfirmed:true,fees:[{label:'Embalagem',amountCents:1000}],options:[{id:'1',name:'PAC',company:'Correios',amountCents:8500,days:8}]}}));
 await page.goto(base+'/equipamentos/pdv-completo/checkout');await page.getByRole('textbox',{name:'CEP de entrega',exact:true}).fill('01001000');await page.getByRole('button',{name:'Consultar',exact:true}).click();await page.getByRole('radio').check();assert.match(await page.locator('.hw-summary-total').textContent(),/Total previsto/);assert.match(await page.locator('.hw-summary-total').textContent(),/1\.745,00/);await context.close();
 const realContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),realPage=await realContext.newPage();
 await realPage.goto(base+'/equipamentos/pdv-completo');await realPage.locator('.hw-gallery-main img').waitFor();await realPage.locator('.hw-gallery-main img').evaluate(image=>image.decode());
 const config=await realPage.evaluate(async()=>fetch('/equipamentos/pdv-completo.json').then(r=>r.json()));assert.equal(await realPage.locator('.hw-thumbnails button').count(),config.photos.length);
 await realPage.locator('.hw-thumbnails button').last().click();await realPage.locator('.hw-gallery-main img').evaluate(image=>image.decode());assert.equal(await realPage.locator('.hw-gallery-main img').getAttribute('src'),config.photos.at(-1).src);
 assert(!await realPage.locator('main').textContent().then(text=>text.includes('Intel Core i3')));await realContext.close();
 console.log('OK: landing card → product LP → checkout, real photos and placeholders, current E7400 specs, cart, CEP validation, manual/carrier totals, review consent, WhatsApp summary, stale CEP invalidation, no PII storage, accessibility and no overflow at 1440/820/390/320px.');
}finally{await browser.close();}
