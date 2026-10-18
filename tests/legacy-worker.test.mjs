import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
test('migração do worker preserva cache novo, autenticação e dados do cliente',async()=>{
 const events={},removed=[],navigated=[];let retired=false;
 const pages=['https://norieco.com.br/','https://norieco.com.br/auth/callback?code=private'].map(url=>({url,navigate:async value=>navigated.push(value)}));
 const self={addEventListener:(name,fn)=>events[name]=fn,skipWaiting:()=>{},registration:{unregister:async()=>{retired=true}},clients:{claim:async()=>{},matchAll:async()=>pages}};
 vm.runInNewContext(await fs.readFile(new URL('../public/reset-legacy-worker.js',import.meta.url),'utf8'),{self,URL,caches:{keys:async()=>['flutter-app-cache','flutter-temp-cache','norieco-assets'],delete:async name=>removed.push(name)}});
 let promise;events.activate({waitUntil:p=>promise=p});await promise;
 assert.deepEqual(removed,['flutter-app-cache','flutter-temp-cache']);assert.deepEqual(navigated,['https://norieco.com.br/']);assert.equal(retired,true);
});
