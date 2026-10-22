import test from 'node:test';
import assert from 'node:assert/strict';
import {connectManagement,validBridgeMessage,MANAGEMENT_ORIGIN} from '../src/lib/management-access.mjs';
import {publicStoreSlug,storePath} from '../src/lib/store-path.mjs';
test('root store paths keep platform routes reserved',()=>{
 assert.equal(publicStoreSlug('/adegajunior'),'adegajunior');assert.equal(storePath('adegajunior'),'/adegajunior');
 for(const path of ['/marketplace','/auth','/downloads','/empresa','/gestao','/auth/callback','//evil.test'])assert.equal(publicStoreSlug(path),null);
});
test('session transfer requires exact origin, window and nonce, with no secrets in URL',async()=>{
 let listener,url,reads=0;const sent=[];
 const popup={postMessage:(...args)=>sent.push(args)};
 const target={open:u=>{url=u;return popup},addEventListener:(_,fn)=>listener=fn,removeEventListener:()=>listener=null};
 const complete=connectManagement(async()=>{reads++;return{data:{session:{access_token:'secret-jwt',refresh_token:'secret-refresh',user:{id:'user-1'}}},error:null}},target);
 const nonce=new URL(url).searchParams.get('state');
 assert.ok(!url.includes('secret'));assert.equal(new URL(url).origin,MANAGEMENT_ORIGIN);
 const event={origin:MANAGEMENT_ORIGIN,source:popup,data:{type:'norieco-auth-ready',nonce}};
 for(const invalid of [{...event,origin:'https://evil.test'},{...event,source:{}},{...event,data:{...event.data,nonce:'wrong'}}]){assert.equal(validBridgeMessage(invalid,popup,nonce),false);await listener(invalid);}
 assert.equal(reads,0);await listener(event);assert.equal(reads,1);assert.equal(sent[0][1],MANAGEMENT_ORIGIN);assert.equal(sent[0][0].accessToken,'secret-jwt');assert.equal(sent[0][0].userId,'user-1');assert.ok(!JSON.stringify(sent[0][0]).includes('secret-refresh'));
 await listener({...event,data:{type:'norieco-auth-complete',nonce}});await complete;assert.equal(listener,null);
});
