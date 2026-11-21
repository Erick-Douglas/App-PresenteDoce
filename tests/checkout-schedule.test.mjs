import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {firstEligibleDate,dateProblem,plusDays} from '../src/features/checkout/schedule.ts';
import {createDatabase,scope} from './helpers/database.mjs';
test('checkout dates skip blocked/full days, preserve ready-day rules and calendar arithmetic',()=>{
 const b=[{day:'2026-11-22',blocked:true,capacity:null,reason:''}],days=[{day:'2026-11-23',available_capacity:1}];
 assert.equal(firstEligibleDate('2026-11-22',false,'2026-11-21',b,days,2),'2026-11-24');
 assert.match(dateProblem('2026-11-22','2026-11-22',false,'2026-11-21',b,days,2),/não recebe/);
 assert.match(dateProblem('2026-11-23','2026-11-22',false,'2026-11-21',b,days,2),/capacidade/);
 assert.equal(firstEligibleDate('2026-11-21',true,'2026-11-21',[{...b[0],day:'2026-11-21'}],[],0),'');
 assert.equal(plusDays('2026-12-31',1),'2027-01-01');
});
test('public availability reflects committed capacity, expires holds and exposes no customer/order details',async()=>{
 const db=await createDatabase();try{
  await scope(db);const day=(await db.query("select (current_date+2)::text d")).rows[0].d;
  const payload={idempotency_key:crypto.randomUUID(),delivery_date:day,fulfillment:'pickup',customer:{name:'Capacity QA',phone:'+351000000000',email:'',address:''},items:[{product_id:'bc-1',quantity:2,mode:'preorder',configuration:{}}]};
  await db.query("update public.catalog_products set details=jsonb_set(details,'{capacityUnits}','1') where id='bc-1'");
  await db.query('select public.create_order_admin($1::jsonb)',[JSON.stringify(payload)]);
  await scope(db,'','11111111-1111-4111-a111-111111111111','anon');let a=(await db.query('select public.storefront_availability() d')).rows[0].d;
  assert.equal(a.days.length,121);assert.equal(a.days.find(d=>d.day===day).available_capacity,6);assert.deepEqual(Object.keys(a).sort(),['blocks','days','stock']);assert.ok(!JSON.stringify(a).includes('Capacity QA'));
  await db.exec("reset role;update public.orders set status='pending',hold_until=now()-interval '1 minute'");await scope(db,'','11111111-1111-4111-a111-111111111111','anon');a=(await db.query('select public.storefront_availability() d')).rows[0].d;assert.equal(a.days.find(d=>d.day===day).available_capacity,8);
  await db.exec("reset role;update public.stores set visible=false");await scope(db,'','11111111-1111-4111-a111-111111111111','anon');assert.deepEqual((await db.query('select public.storefront_availability() d')).rows[0].d,{});
 }finally{await db.close()}
});