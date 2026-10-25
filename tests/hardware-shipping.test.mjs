import test from 'node:test';
import assert from 'node:assert/strict';
import {createShippingHandler, shippingSettings} from '../netlify/lib/hardware-shipping.mjs';
import {hardwareProduct, validHardwarePhotos} from '../src/lib/hardware.mjs';
const address={logradouro:'Praça da Sé',bairro:'Sé',localidade:'São Paulo',uf:'SP'};
const request=(body={cep:'01001000'},headers={})=>new Request('https://norieco.com.br/.netlify/functions/hardware-shipping',{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
const env={HARDWARE_SHIPPING_ENABLED:'true',HARDWARE_ORIGIN_POSTAL_CODE:'01001000',MELHOR_ENVIO_TOKEN:'test-private-token',MELHOR_ENVIO_CONTACT:'support@example.com',HARDWARE_PACKAGES_JSON:JSON.stringify([{width:40,height:40,length:50,weight:8,insurance:1650}]),HARDWARE_FEES_CONFIRMED:'true',HARDWARE_FEES_JSON:'[{"label":"Embalagem","amountCents":1200}]'};
test('Missing merchant origin, package dimensions or explicit enablement never produces a fabricated freight quote',async()=>{
 const handler=createShippingHandler({env:{},fetcher:async()=>Response.json(address)});
 const res=await handler(request());const data=await res.json();assert.equal(res.status,200);assert.equal(data.mode,'manual');assert.equal(data.address.city,'São Paulo');assert.deepEqual(data.options,[]);assert.equal(data.feesConfirmed,false);
 assert.equal(shippingSettings({...env,HARDWARE_PACKAGES_JSON:'[]'}).ready,false);
 assert.equal(shippingSettings({...env,HARDWARE_PACKAGES_JSON:'not-json'}).ready,false);
 assert.equal(shippingSettings({...env,HARDWARE_SHIPPING_ENABLED:'false'}).ready,false);
 assert.equal(shippingSettings({...env,MELHOR_ENVIO_SANDBOX:'true',CONTEXT:'production'}).ready,false);
 assert.equal(shippingSettings({...env,MELHOR_ENVIO_SANDBOX:'true'}).ready,false);
 assert.equal(shippingSettings({...env,HARDWARE_PACKAGES_JSON:'[{"width":40,"height":40,"length":50,"weight":8,"insurance":1}]'}).ready,false);
});
test('Carrier quote uses server package insurance, destination and customized prices; client price is ignored',async()=>{
 const calls=[];const handler=createShippingHandler({env,fetcher:async(url,options)=>{calls.push({url,options});return Response.json(calls.length===1?address:[{id:1,name:'PAC',company:{name:'Correios'},price:'70.00',custom_price:'85.90',delivery_time:5,custom_delivery_time:8},{id:2,name:'Invalid',error:'CEP não atendido'},{id:3,name:'Invalid price',price:'NaN'}]);}});
 const data=await(await handler(request({cep:'01001000',priceCents:1,shipping:0}))).json();assert.equal(data.mode,'quoted');assert.deepEqual(data.options,[{id:'1',name:'PAC',company:'Correios',amountCents:8590,days:8}]);assert.deepEqual(data.fees,[{label:'Embalagem',amountCents:1200}]);assert.equal(data.feesConfirmed,true);
 const body=JSON.parse(calls[1].options.body);assert.equal(body.from.postal_code,env.HARDWARE_ORIGIN_POSTAL_CODE);assert.equal(body.to.postal_code,'01001000');assert.equal(body.volumes[0].insurance,hardwareProduct.priceCents/100);assert.equal(body.volumes[0].weight,8);assert.match(calls[1].options.headers.Authorization,/^Bearer /);assert(!JSON.stringify(data).includes('test-private-token'));
});
test('Provider failure gives manual confirmation without advertising free delivery',async()=>{
 let count=0;const handler=createShippingHandler({env,fetcher:async()=>++count===1?Response.json(address):new Response('',{status:500})});const data=await(await handler(request())).json();assert.equal(data.mode,'manual');assert.deepEqual(data.options,[]);
});
test('Invalid CEP, unknown CEP, oversized input and cross-origin requests are rejected',async()=>{
 let calls=0;const handler=createShippingHandler({env,fetcher:async()=>{calls++;return Response.json({erro:true})}});
 assert.equal((await handler(request({cep:'123'}))).status,400);assert.equal(calls,0);
 assert.equal((await handler(request())).status,422);
 assert.equal((await handler(request({cep:'01001000'},{origin:'https://evil.example'}))).status,403);
 assert.equal((await handler(request({cep:'01001000',padding:'x'.repeat(2000)}))).status,413);
 assert.equal((await handler(new Request('https://norieco.com.br/api',{method:'GET'}))).status,405);
});
test('Photo configuration permits product images but rejects executable URLs and arbitrary local paths',()=>{
 const valid=validHardwarePhotos([{src:'/equipamentos/fotos/kit.webp',alt:'Kit'},{src:'https://cdn.example/kit.jpg',alt:'Monitor'},{src:'javascript:alert(1)',alt:'Invalid'},{src:'/nori-logo-official.png',alt:'Not product photo'},{src:'https://secret:password@example.com/x.jpg',alt:'Credentials'}]);assert.equal(valid.length,2);assert.equal(validHardwarePhotos(null).length,0);
});
