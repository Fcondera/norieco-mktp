import {saasDatabase} from '../../../vendapeixe/supabase/tests/helpers/saas_database.ts';
const assert=(v:unknown,m:string)=>{if(!v)throw Error(m);};
Deno.test('starter: three modules, tenant isolation, public inquiries and no PDV self-upgrade',async()=>{
 const db=await saasDatabase();
 try{
 for(const file of ['202610170001_direct_product_stock.sql','202610170002_paid_direct_stock.sql','202610170003_dining_sale_movement_type.sql','202610170004_supply_inventory_workflow.sql','202610170005_item_codes.sql','202610170006_kitchen_workflow.sql','202610180001_catalog_recipe_availability.sql','202610180002_invalid_legacy_recipe_availability.sql','202610180003_marketplace.sql','202610180004_marketplace_access_audit.sql','202610180005_marketplace_store_validation.sql','202610190001_starter_business_portal.sql'])await db.exec(await Deno.readTextFile(new URL('../../../vendapeixe/supabase/migrations/'+file,import.meta.url)));
 const a='10000000-0000-4000-8000-000000000301',b='10000000-0000-4000-8000-000000000302';
 await db.exec(`insert into auth.users(id,email)values('${a}','starter-a@example.test'),('${b}','starter-b@example.test');`);
 const value=async(sql:string,args:unknown[]=[])=>Object.values((await db.query<Record<string,unknown>>(sql,args)).rows[0])[0];
 const as=async(user:string,role='authenticated')=>{await db.exec(`reset role;set role ${role}`);await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[user,JSON.stringify(user?{sub:user,role}:{role})]);};
 const reject=async(sql:string,args:unknown[]=[])=>{let denied=false;try{await db.query(sql,args);}catch{denied=true;}assert(denied,'Access unexpectedly allowed: '+sql);};
 const category=await value('select id from marketplace_categories limit 1');
 const ids:string[]=[];
 for(const [user,name]of [[a,'Loja A'],[b,'Loja B']]){
  await as(user);await db.query('select marketplace_save_profile($1)',[{full_name:name,whatsapp:'92999990000',city:'Manaus',neighborhood:'Centro',terms:true}]);
  const saved=await value('select starter_save_business(null,$1,false)',[{name,description:'Empresa de testes',email:user===a?'a@example.test':'b@example.test',whatsapp:'92999990000',city:'Manaus',neighborhood:'Centro',address:'Rua local 10',category_id:category}]) as {id:string};ids.push(saved.id);
 }
 const [ba,bb]=ids;const offer='30000000-0000-4000-8000-000000000301';
 await as(a);await db.query('select starter_save_offer($1,$2,false)',[ba,{id:offer,name:'Produto A',description:'Produto de teste',kind:'PRODUCT',price:15}]);
 const dashboard=await value('select starter_dashboard()') as Record<string,unknown>[];
 assert(dashboard.length===1&&dashboard[0].id===ba,'Dashboard mixed businesses');
 assert(dashboard[0].plan_code==='INITIAL','New seller received PDV');
 assert(JSON.stringify(dashboard[0].modules)==='["company","offers","inquiries"]','Unexpected modules');
 await db.query('select starter_request_pdv($1)',[ba]);
 assert(await value('select current_tenant_id()')===null,'Plan request granted tenant');
 await reject('select starter_save_business($1,$2,false)',[ba,{plan_code:'PDV'}]);
 await reject('select starter_save_business($1,$2,false)',[bb,{name:'Hijack'}]);
 await reject('select starter_save_offer($1,$2,false)',[bb,{id:offer,name:'Hijack',description:'Hijack'}]);
 await as(b);await reject('select starter_save_offer($1,$2,false)',[bb,{id:offer,name:'Hijack',description:'Hijack'}]);
 await reject('select starter_request_pdv($1)',[ba]);
 await db.exec('reset role');await db.query("update marketplace_businesses set verification_status='VERIFIED' where id=$1",[ba]);
 const slug=await value('select slug from marketplace_businesses where id=$1',[ba]);
 await as('','anon');await reject('select starter_dashboard()');
 await reject('select * from marketplace_inquiries');
 await db.query('select marketplace_send_inquiry($1,$2,$3,$4,$5)',[slug,offer,'Cliente','92999990001','Quero saber mais']);
 await as(a);const owned=await value('select starter_dashboard()') as any[];assert(owned[0].inquiries.length===1,'Inquiry absent');const inquiry=owned[0].inquiries[0].id;
 await as(b);const other=await value('select starter_dashboard()') as any[];assert(other[0].inquiries.length===0,'Inquiry leaked');await reject('select starter_inquiry_status($1,$2,$3)',[bb,inquiry,'CLOSED']);
 await as(a);await db.query('select starter_inquiry_status($1,$2,$3)',[ba,inquiry,'CONTACTED']);
 await db.query('select starter_save_offer($1,$2,false)',[ba,{id:offer,name:'Produto A',description:'Produto de teste',kind:'PRODUCT',price:15,is_active:false}]);
 await as('','anon');const publicPage=await value('select marketplace_business($1)',[slug]) as any;assert(publicPage.business.services.length===0,'Inactive offer public');assert(!JSON.stringify(publicPage).includes('92999990001'),'Private phone public');
 await db.exec('reset role');assert(await value('select is_active from profiles where id=$1',[a])===false,'Starter activated staff');
 }finally{await db.close();}
});
