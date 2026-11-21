import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase,scope } from './helpers/database.mjs';
import crypto from 'node:crypto';
const pilot='11111111-1111-4111-a111-111111111111',a='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',b='bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbc';
test('transactional platform: prices, stock, capacity, finance, tenants and recipe links',async t=>{
 const db=await createDatabase();let order,ingredient,recipe,child,otherStore;
 const rejected=async action=>{await assert.rejects(action);};
 const rpc=async(name,payload)=> (await db.query('select public.'+name+'($1::jsonb) d',[JSON.stringify(payload)])).rows[0].d;
 const day=(await db.query("select (current_date+2)::text d")).rows[0].d;
 const payload={idempotency_key:crypto.randomUUID(),delivery_date:day,fulfillment:'pickup',customer:{name:'Cliente de teste',phone:'+351000000000',email:'',address:''},items:[{product_id:'bt-1',variant:'Pequeno (1,5kg)',quantity:2,mode:'preorder',configuration:{massa:'Red Velvet',recheio1:'Morango',recheio2:'Brigadeiro Tradicional'}}]};
 try{
 await scope(db);
 await t.test('commercial signup is also disabled at the database boundary',async()=>{
  await rejected(()=>db.query("select public.create_store('Ainda fechado','ainda-fechado')"));
  await db.exec('reset role;update presente_doce_private.platform_config set onboarding_enabled=true where singleton');await scope(db);
 });
 await t.test('cake prices and extras are calculated from catalog and settings',async()=>{
  order=await rpc('create_order_admin',payload);assert.equal(order.total_cents,8980);assert.equal(order.deposit_cents,4490);
  assert.equal((await rpc('create_order_admin',payload)).id,order.id);
  await rejected(()=>rpc('create_order_admin',{...payload,items:[{...payload.items[0],quantity:3}]}));
 });
 await t.test('daily capacity counts completed production and rejects excess',async()=>{
  await rejected(()=>rpc('create_order_admin',{...payload,idempotency_key:crypto.randomUUID(),items:[{...payload.items[0],quantity:7}]}));
 });
 await t.test('ledger prevents duplicate receipts, overpayment and excess refunds',async()=>{
  const receipt={idempotency_key:crypto.randomUUID(),order_id:order.id,type:'receipt',amount_cents:4490,description:'Sinal',method:'Teste'};
  await rpc('record_finance',receipt);await rpc('record_finance',receipt);
  await rpc('record_finance',{...receipt,idempotency_key:crypto.randomUUID()});
  await rejected(()=>rpc('record_finance',{...receipt,idempotency_key:crypto.randomUUID(),amount_cents:1}));
  await rpc('record_finance',{...receipt,idempotency_key:crypto.randomUUID(),type:'refund',amount_cents:1000});
  await rejected(()=>rpc('record_finance',{...receipt,idempotency_key:crypto.randomUUID(),type:'refund',amount_cents:9000}));
  assert.equal((await db.query('select count(*)::int n from public.finance_entries')).rows[0].n,3);
 });
 await t.test('state transitions preserve production capacity',async()=>{
  for(const state of ['production','ready','completed'])order=(await db.query('select public.change_order_status($1,$2,$3) d',[order.id,order.version,state])).rows[0].d;
  await rejected(()=>rpc('create_order_admin',{...payload,idempotency_key:crypto.randomUUID(),items:[{...payload.items[0],quantity:7}]}));
  await rejected(()=>db.query("select public.change_order_status($1,$2,'canceled')",[order.id,order.version]));
 });
 await t.test('ingredient and subrecipe links recalculate while preventing cycles',async()=>{
  ingredient=(await db.query("insert into public.ingredients(name,unit,pack_quantity,pack_price_cents) values('Farinha QA','g',1000,400) returning id")).rows[0].id;
  const r={title:'Massa QA',yieldCount:'2',salePrice:'10',ingredients:[{ingredientId:ingredient,name:'Farinha QA',unit:'g',packQuantity:'1000',packPrice:'4',usedQuantity:'250'}]};
  recipe=(await db.query('insert into public.pricing_recipes(recipe) values($1::jsonb) returning id',[JSON.stringify(r)])).rows[0].id;
  child=(await db.query('insert into public.pricing_recipes(recipe) values($1::jsonb) returning id',[JSON.stringify({title:'Bolo QA',yieldCount:'1',salePrice:'20',ingredients:[{recipeId:recipe,name:'Massa QA',unit:'un',packQuantity:'2',packPrice:'1',usedQuantity:'2'}]})])).rows[0].id;
  await db.query('update public.ingredients set pack_price_cents=800 where id=$1',[ingredient]);
  const updated=(await db.query('select recipe from public.pricing_recipes where id=$1',[child])).rows[0].recipe;
  assert.equal(Number(updated.ingredients[0].packPrice),2);
  await rejected(()=>db.query('update public.pricing_recipes set recipe=$1::jsonb where id=$2',[JSON.stringify({...r,ingredients:[{recipeId:child,name:'Bolo QA',unit:'un',packQuantity:'1',packPrice:'2',usedQuantity:'1'}]}),recipe]));
  await rejected(()=>db.query('delete from public.pricing_recipes where id=$1',[recipe]));
  await rejected(()=>db.query("update public.ingredients set unit='ml' where id=$1",[ingredient]));
 });
 await t.test('new store, CRM and sensitive tables remain isolated',async()=>{
  await db.exec("reset role;insert into auth.users values('"+b+"','b@example.test')");
  await scope(db,b);otherStore=(await db.query("select public.create_store('Loja B','teste-loja-b') id")).rows[0].id;
  await scope(db,b,otherStore);
  const snapshot=(await db.query('select public.operations_snapshot() d')).rows[0].d;
  assert.equal(snapshot.orders.length,0);assert.equal(snapshot.customers.length,0);assert.equal(snapshot.finance.length,0);
  await rejected(()=>rpc('record_finance',{idempotency_key:crypto.randomUUID(),order_id:order.id,type:'receipt',amount_cents:1,description:'Invasão'}));
  await rejected(()=>db.query('insert into public.pricing_recipes(recipe) values($1::jsonb)',[JSON.stringify({title:'X',yieldCount:'1',salePrice:'10',ingredients:[{ingredientId:ingredient,name:'X',unit:'g',packQuantity:'1',packPrice:'1',usedQuantity:'1'}]})]));
  await scope(db,b,pilot);await rejected(()=>db.query('select public.operations_snapshot()'));
  assert.equal((await db.query('select * from public.pricing_recipes')).rows.length,0);
 });
 await t.test('storage is scoped and expired plans preserve reading while refusing writes',async()=>{
  await scope(db,b,otherStore);
  await db.query("insert into storage.objects(bucket_id,name) values('catalog-images',$1)",[otherStore+'/'+crypto.randomUUID()+'.webp']);
  await rejected(()=>db.query("insert into storage.objects(bucket_id,name) values('catalog-images',$1)",[pilot+'/'+crypto.randomUUID()+'.webp']));
  const config=(await db.query('select public.operations_snapshot() d')).rows[0].d;
  await db.query('select public.save_store_settings($1,$2::jsonb,$3::jsonb)',[config.settings.version,JSON.stringify(config.store),JSON.stringify({...config.settings.settings,whatsapp:'+351000000000'})]);
  await rejected(()=>db.query('select public.save_store_settings($1,$2::jsonb,$3::jsonb)',[config.settings.version+1,JSON.stringify({...config.store,primary_color:'#ffffff'}),JSON.stringify({...config.settings.settings,whatsapp:'+351000000000'})]));
  await db.exec("reset role");await db.query("update public.store_entitlements set status='canceled' where store_id=$1",[otherStore]);
  await scope(db,b,otherStore);assert.equal((await db.query('select public.operations_snapshot() d')).rows[0].d.store.id,otherStore);
  await rejected(()=>db.query("insert into public.customers(name,phone) values('X','123456789')"));
  await rejected(()=>db.query("select public.adjust_stock('x','',1,'Teste',$1)",[crypto.randomUUID()]));
 });
 await t.test('unverified accounts cannot create a store',async()=>{
  const unverified='dddddddd-dddd-4ddd-addd-dddddddddddd';
  await db.exec("reset role");await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,null)',[unverified,'unverified@example.test']);
  await scope(db,unverified);await rejected(()=>db.query("select public.create_store('Sem verificar','sem-verificar')"));
 });
 await t.test('anonymous users cannot read CRM, finance or call management',async()=>{
  await scope(db,'',pilot,'anon');
  for(const table of ['customers','orders','finance_entries','ingredients'])await rejected(()=>db.query('select * from public.'+table));
  await rejected(()=>db.query('select public.operations_snapshot()'));
  await rejected(()=>rpc('create_order_admin',payload));
 });
 await t.test('ready stock is reserved once and cancel releases once',async()=>{
  await scope(db,a,pilot);await db.exec(`update public.catalog_products set details=details||'{"saleModes":["ready","preorder"]}'::jsonb where id='bc-1'`);
  const key=crypto.randomUUID();await db.query("select public.adjust_stock('bc-1','',1,'QA',$1)",[key]);await db.query("select public.adjust_stock('bc-1','',1,'QA',$1)",[key]);
  const current=(await db.query('select current_date::text d')).rows[0].d;
  const p={...payload,idempotency_key:crypto.randomUUID(),delivery_date:current,items:[{product_id:'bc-1',variant:'',quantity:1,mode:'ready',configuration:{}}]};
  const o=await rpc('create_order_admin',p);assert.equal(o.total_cents,1200);
  await rejected(()=>rpc('create_order_admin',{...p,idempotency_key:crypto.randomUUID()}));
  await db.query("select public.change_order_status($1,$2,'canceled')",[o.id,o.version]);
  const next=(await db.query("select * from public.product_stock where product_id='bc-1'")).rows[0];assert.equal(next.available,1);
 });
 await t.test('temporary public reservations cannot receive deposits before confirmation',async()=>{
  await db.exec("reset role;update public.store_settings set settings=jsonb_set(settings,'{whatsapp}','\"+351000000000\"'::jsonb)");
  await scope(db,'',pilot,'service_role');
  const current=(await db.query('select current_date::text d')).rows[0].d;
  const p={...payload,idempotency_key:crypto.randomUUID(),delivery_date:current,items:[{product_id:'bc-1',variant:'',quantity:1,mode:'ready',configuration:{}}]};
  const pending=(await db.query('select public.checkout_order($1,$2::jsonb,$3) d',[pilot,JSON.stringify(p),'fixture-client'])).rows[0].d;
  await scope(db,a,pilot);await rejected(()=>db.query("select public.change_order_status($1,null,'confirmed')",[pending.id]));const receipt={idempotency_key:crypto.randomUUID(),order_id:pending.id,type:'receipt',amount_cents:600,description:'Sinal QA'};
  await rejected(()=>rpc('record_finance',receipt));
  await db.query("select public.change_order_status($1,$2,'confirmed')",[pending.id,pending.version]);
  await rpc('record_finance',receipt);
 });
 await t.test('unknown delivery fee must be agreed before confirmation',async()=>{
  const o=await rpc('create_order_admin',{...payload,idempotency_key:crypto.randomUUID(),kind:'quote',fulfillment:'delivery',customer:{...payload.customer,address:'Morada QA'}});
  assert.equal(o.delivery_pending,true);
  await rejected(()=>db.query("select public.change_order_status($1,$2,'confirmed')",[o.id,o.version]));
  const saved=(await db.query('select public.set_delivery_fee($1,$2,500) d',[o.id,o.version])).rows[0].d;
  assert.equal(saved.total_cents,9480);assert.equal(saved.deposit_cents,4740);
  await db.query("select public.change_order_status($1,$2,'confirmed')",[saved.id,saved.version]);
 });
 }finally{await db.close();}
});
