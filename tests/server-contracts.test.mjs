import test from 'node:test';
import assert from 'node:assert/strict';
import {handleRequest} from '../supabase/functions/store-api/handler.ts';
const env={url:'https://fixture.supabase.co',serviceKey:'test-only-key'};
const store='11111111-1111-4111-a111-111111111111';
const req=(body,token='',origin='https://presente-doce.vercel.app')=>new Request('https://fixture/api',{method:'POST',headers:{'Content-Type':'application/json',origin,...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
test('server refuses cross-site origin, malformed requests and oversized body',async()=>{
 const noFetch=async()=>{throw Error('must not contact provider');};
 assert.equal((await handleRequest(req({},'','https://evil.example'),env,noFetch)).status,403);
 assert.equal((await handleRequest(req(null),env,noFetch)).status,400);
 const big=new Request('https://fixture/api',{method:'POST',body:'x'.repeat(70000)});assert.equal((await handleRequest(big,env,noFetch)).status,413);
});
test('server rejects an unauthenticated admin action before performing writes',async()=>{
 let calls=0;const response=await handleRequest(req({store_id:store,action:'finance.record',payload:{}}),env,async()=>{calls++;return Response.json({});});
 assert.equal(response.status,401);assert.equal(calls,0);
});
test('server verifies user and store membership before admin payload execution',async()=>{
 let writes=0;const fetcher=async url=>{if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'fixture'});if(String(url).includes('is_catalog_admin'))return Response.json(false);writes++;return Response.json({});};
 const response=await handleRequest(req({store_id:store,action:'stock.adjust',payload:{}},'fixture-user'),env,fetcher);
 assert.equal(response.status,403);assert.equal(writes,0);
});
test('checkout rejects a browser supplied price and never calls the database',async()=>{
 const body={store_id:store,action:'checkout',payload:{idempotency_key:crypto.randomUUID(),customer:{name:'QA',phone:'+351900000000'},delivery_date:'2026-12-20',fulfillment:'pickup',items:[{product_id:'bc-1',quantity:1,mode:'preorder',price:0.01}]}};
 let calls=0;const response=await handleRequest(req(body),env,async()=>{calls++;return Response.json({});});assert.equal(response.status,400);assert.equal(calls,0);
});
test('checkout rate limit returns 429 without creating an order',async()=>{
 const body={store_id:store,action:'checkout',payload:{idempotency_key:crypto.randomUUID(),customer:{name:'QA',phone:'+351900000000'},delivery_date:'2026-12-20',fulfillment:'pickup',items:[{product_id:'bc-1',quantity:1,mode:'preorder'}]}};
 const routes=[];const response=await handleRequest(req(body),env,async url=>{routes.push(String(url));return Response.json(false);});assert.equal(response.status,429);assert.equal(routes.length,1);assert.ok(routes[0].endsWith('consume_checkout_limit'));
});

test('admin product writes keep the verified user JWT and store scope',async()=>{
 const payload={id:'qa',version:1,published:true,details:{name:'QA',description:'Fixture',price:12,category:'QA',image:'/products/bc-1.jpg'}};
 const calls=[];const fetcher=async(url,options)=>{calls.push({url:String(url),options});if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'verified'});if(String(url).endsWith('/is_catalog_admin'))return Response.json(true);return Response.json([{...payload,version:2}]);};
 const response=await handleRequest(req({store_id:store,action:'product.save',payload},'verified-user'),env,fetcher);
 assert.equal(response.status,200);const write=calls.at(-1);assert.equal(write.options.headers.Authorization,'Bearer verified-user');assert.equal(write.options.headers['x-store-id'],store);assert.ok(write.url.includes('version=eq.1'));
});
test('unknown actions and invalid admin amounts cannot reach a write',async()=>{
 let writes=0;const fetcher=async url=>{if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'verified'});if(String(url).endsWith('/is_catalog_admin'))return Response.json(true);writes++;return Response.json({});};
 assert.equal((await handleRequest(req({store_id:store,action:'toString',payload:{}},'verified-user'),env,fetcher)).status,400);
 assert.equal((await handleRequest(req({store_id:store,action:'finance.record',payload:{type:'receipt',amount_cents:-1}},'verified-user'),env,fetcher)).status,400);assert.equal(writes,0);
});
