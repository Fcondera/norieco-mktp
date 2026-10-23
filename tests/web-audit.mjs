import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';

const origin=process.env.AUDIT_BASE_URL||'https://norieco.com.br';
const routes=['/','/marketplace','/marketplace/loja/adega-asvluth','/marketplace/ajuda','/marketplace/conta/compras','/marketplace/entrar','/marketplace/privacidade','/marketplace/loja/audit-missing-store'];
if(!process.argv.includes('--react-only'))routes.push('/adega-asvluth','/renato-pescados','https://gestao.norieco.com.br/inicio');
const results=[];
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'});
  for(const route of routes){
   if(width===320&&(route==='/renato-pescados'||route.startsWith('https://')))continue;
   const page=await context.newPage(),errors=[],failedRequests=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('requestfailed',r=>{if(!r.failure()?.errorText?.includes('ERR_ABORTED'))failedRequests.push({url:r.url(),error:r.failure()?.errorText})});
   const url=route.startsWith('https://')?route:origin+route;
   try{
    await page.addInitScript(()=>{
     window.__noriVitals={lcp:0,cls:0};
     try{new PerformanceObserver(list=>{for(const e of list.getEntries())window.__noriVitals.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true})}catch{}
     try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__noriVitals.cls+=e.value}).observe({type:'layout-shift',buffered:true})}catch{}
    });
    const response=await page.goto(url,{timeout:60000});
    await page.waitForLoadState('networkidle',{timeout:10000}).catch(()=>{});
    const flutter=page.locator('flt-semantics-placeholder');
    if(await flutter.count()){
     await flutter.evaluate(el=>el.click());
     await page.getByRole('button',{name:/Google|Comprar|Esgotado/}).first().waitFor({timeout:60000});
    }else await page.locator('main').first().waitFor({timeout:30000});
    const accessibility=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']).exclude('#nl-badge-frame').analyze();
    const metrics=await page.evaluate(()=>({title:document.title,overflow:document.documentElement.scrollWidth>innerWidth+1,
     h1:document.querySelectorAll('h1').length,main:document.querySelectorAll('main,[role="main"]').length,
     brokenImages:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src),
     vitals:window.__noriVitals,resources:performance.getEntriesByType('resource').reduce((s,e)=>s+(e.transferSize||0),0),
     links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(h=>/undefined|null|javascript:/i.test(h)),
    }));
    const row={route,width,status:response.status(),...metrics,errors,failedRequests,
     violations:accessibility.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary,html:n.html}))}))};
    results.push(row);console.log(JSON.stringify({route,width,status:row.status,overflow:row.overflow,errors:errors.length,violations:row.violations.map(v=>v.id+':'+v.nodes.length),lcp:Math.round(metrics.vitals.lcp),cls:metrics.vitals.cls}));
   }catch(error){results.push({route,width,error:error.message,errors,failedRequests});console.log(JSON.stringify({route,width,error:error.message}));}
   await page.close();
  }
  await context.close();
 }
}finally{await browser.close()}
await fs.mkdir('test-results',{recursive:true});
const tag=process.env.AUDIT_REPORT_TAG||'latest';
await fs.writeFile('test-results/web-audit-'+tag+'.json',JSON.stringify(results,null,2));
if(process.argv.includes('--strict')&&results.some(r=>r.error||r.overflow||r.errors?.length||r.violations?.some(v=>['critical','serious'].includes(v.impact))))process.exitCode=1;
