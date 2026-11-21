// Isolated browser regression suite. Never writes to Supabase or sends messages.
import {publicConfig,emptySnapshot} from './helpers/platform-fixture.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join(path.dirname(path.dirname(process.execPath)), 'node_modules/playwright'))); }
const origin = process.env.PD_BASE_URL || 'http://127.0.0.1:4173';
const out = path.resolve('node_modules/.cache/pd-review');
fs.mkdirSync(out, { recursive: true });
const evidence = [];
const pass = text => { evidence.push(text); console.log('PASS ' + text); };
const catId = '00000000-0000-4000-a000-000000000001';
const topicId = '00000000-0000-4000-a000-000000000002';
let categories = [
 { id: catId, name: 'Caseirinhos', topics: [{id:topicId,name:'Sem açúcar'}], revision:1, order_mode:'simple', cover:null },
 { id:'00000000-0000-4000-a000-000000000003',name:'Caixas',topics:[],revision:1,order_mode:'simple',cover:null },
];
let products = [
 {id:'qa-original',published:true,version:1,details:{name:'Bolo sem açúcar',description:'Fixture de catálogo',price:10,category:'Caseirinhos',image:'/app-icon-192.png',topicIds:[topicId],tags:['Sem açúcar'],simples:true}},
 {id:'qa-outro',published:true,version:1,details:{name:'Outro bolo',description:'Fixture',price:9,category:'Caseirinhos',image:'/app-icon-192.png',topicIds:[],tags:[],simples:true}},
 {id:'qa-caixa',published:true,version:1,details:{name:'Caixa',description:'Fixture',price:11,category:'Caixas',image:'/app-icon-192.png',topicIds:[],tags:[],simples:true}},
];
const originalRecipe = {id:'00000000-0000-4000-a000-000000000004',product_id:'qa-original',version:1,recipe:{
 title:'Ficha original',yieldCount:'4',salePrice:'10',ingredients:[{name:'Ingrediente',unit:'g',packQuantity:'1000',packPrice:'4',usedQuantity:'250'}]}};
let recipes = [structuredClone(originalRecipe)], recipeWrites=0, priceWrites=0, failUpload=false, revoked=false;
const state=structuredClone(emptySnapshot);
const images=new Map(), uploadBuffers=[];
const presentation={home_title:'Seja bem-vindo!',home_description:'Confeitaria artesanal',admin_name:'Gabriela',about_text:'Confeitaria artesanal.',revision:1};
async function isolate(context) {
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(!url.hostname.endsWith('.supabase.co')) {
   if(url.origin===origin||url.protocol==='data:'||url.protocol==='blob:')return route.continue();
   return route.abort();
  }
  const method=request.method(),p=url.pathname,admin=!!request.headers().authorization;
  const body=()=>request.postDataJSON();
  const ok=(value,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
  if(p==='/rest/v1/rpc/storefront_config')return ok(publicConfig);
  if(p==='/rest/v1/rpc/storefront_availability')return ok({stock:state.stock,blocks:state.blocks});
  if(p==='/rest/v1/rpc/operations_snapshot')return ok(state);
  if(p==='/functions/v1/store-api'){
   const {action,payload:data}=body();
   if(action==='product.save'){
    if(data.version===null){const row={id:data.id,details:data.details,published:data.published,version:1};products.push(row);return ok(row);}
    const row=products.find(r=>r.id===data.id&&r.version===data.version);if(!row)return ok({error:'Conflito'},409);
    if(row.details.price!==data.details.price)priceWrites++;
    Object.assign(row,{details:data.details,published:data.published,version:row.version+1});return ok(row);
   }

   if(action==='customer.save'||action==='ingredient.save'){
    const records=action==='customer.save'?state.customers:state.ingredients;let item=records.find(r=>r.id===data.id);
    if(item)Object.assign(item,data.data,{version:item.version+1});else{item={...data.data,id:crypto.randomUUID(),version:1,archived:false};records.push(item);}return ok(item);
   }
   if(action==='stock.adjust'){let stock=state.stock.find(r=>r.product_id===data.product_id&&r.option_key===data.option);if(!stock){stock={product_id:data.product_id,option_key:data.option,available:0};state.stock.push(stock);}stock.available+=data.delta;return ok(stock.available);}
   if(action==='order.create'){
    const id=crypto.randomUUID(),total=data.items.reduce((sum,i)=>sum+products.find(p=>p.id===i.product_id).details.price*i.quantity*100,0);
    const item={...data,id,reference:1,version:1,customer_snapshot:data.customer,customer_id:state.customers[0]?.id,status:data.kind==='quote'?'draft':'confirmed',total_cents:total,deposit_cents:Math.round(total/2),delivery_cents:0,delivery_pending:false,deposit_percent:50,currency:'EUR',capacity_units:1,created_at:new Date().toISOString()};
    state.orders.push(item);for(const i of data.items)state.items.push({...i,id:crypto.randomUUID(),order_id:id,option_key:i.variant,unit_cents:products.find(p=>p.id===i.product_id).details.price*100,unit_cost_cents:null,snapshot:{name:products.find(p=>p.id===i.product_id).details.name}});
    return ok(item);
   }
   if(action==='finance.record'){const entry={...data,id:crypto.randomUUID()};state.finance.push(entry);return ok(entry);}
   if(action==='calendar.save'){state.blocks=state.blocks.filter(b=>b.day!==data.day);state.blocks.push(data);return ok(data);}
   if(action==='settings.save'){Object.assign(state.store,data.store);state.settings={settings:data.settings,version:state.settings.version+1};Object.assign(publicConfig,{store:state.store,settings:data.settings});return ok(state.settings);}
   if(action==='order.status'){const o=state.orders.find(o=>o.id===data.id);Object.assign(o,{status:data.status,version:o.version+1});return ok(o);}
   throw Error('Unhandled action '+action);
  }
  if(p==='/auth/v1/token')return revoked?ok({error:'invalid_grant'},400):ok({access_token:'isolated-qa-token',refresh_token:'isolated-qa-refresh',expires_in:3600});
  if(p==='/auth/v1/logout')return ok({});
  if(p==='/rest/v1/rpc/is_catalog_admin')return ok(admin);
  if(p==='/rest/v1/store_presentation')return ok([presentation]);
  if(p==='/rest/v1/catalog_categories')return ok(categories);
  if(p==='/rest/v1/rpc/catalog_category_details')return ok(categories);
  if(p==='/rest/v1/rpc/save_catalog_category') {
   const data=body(),category=categories.find(c=>c.id===data.p_id);assert.equal(category.revision,data.p_revision);
   const old=category.name;Object.assign(category,{name:data.p_name,topics:data.p_topics,revision:category.revision+1});
   products=products.map(row=>row.details.category===old?{...row,version:row.version+1,details:{...row.details,category:category.name,
    topicIds:(row.details.topicIds||[]).filter(id=>category.topics.some(t=>t.id===id)),
    tags:category.topics.filter(t=>row.details.topicIds?.includes(t.id)).map(t=>t.name)}}:row);return ok(null);
  }
  if(p==='/rest/v1/catalog_products') {
   const id=url.searchParams.get('id')?.slice(3),version=Number(url.searchParams.get('version')?.slice(3));
   if(method==='GET')return ok(products.filter(row=>(admin||row.published)&&(!id||row.id===id)));
   const data=body();
   if(method==='POST') {const row={...data,version:1};products.push(row);return ok([row]);}
   if(method==='PATCH') {
    const row=products.find(row=>row.id===id&&row.version===version);if(!row)return ok([]);
    if(row.details.price!==data.details.price)priceWrites++;
    Object.assign(row,data,{version:row.version+1});return ok([row]);
   }
  }
  if(p==='/rest/v1/pricing_recipes') {
   if(method==='GET')return ok(recipes);
   recipeWrites++;const data=body();
   if(method==='POST'){const row={...data,version:1};recipes.push(row);return ok([row]);}
   const row=recipes.find(row=>row.id===url.searchParams.get('id')?.slice(3)&&row.version===Number(url.searchParams.get('version')?.slice(3)));
   if(!row)return ok([]);Object.assign(row,data,{version:row.version+1});return ok([row]);
  }
  if(p.startsWith('/storage/v1/object/catalog-images/')) {
   if(failUpload){failUpload=false;return ok({message:'Fixture upload failure'},503);}
   const key=p.split('/catalog-images/')[1],buffer=request.postDataBuffer();uploadBuffers.push(buffer);images.set(key,buffer);return ok({Key:key});
  }
  if(p.startsWith('/storage/v1/object/public/catalog-images/')) {
   const buffer=images.get(p.split('/catalog-images/')[1]);return buffer?route.fulfill({status:200,contentType:'image/webp',body:buffer}):ok({},404);
  }
  throw Error('Unhandled isolated API: '+method+' '+p);
 });
}
const browser=await chromium.launch({executablePath:process.env.PD_CHROME_PATH || (process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true});
let context;
try{
 context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await isolate(context);
 const page=await context.newPage();page.setDefaultTimeout(15000);
 const pageErrors=[];page.on('pageerror',error=>{pageErrors.push(error.message);console.log('PAGE_ERROR '+error.message);});
 const menu=async label=>{if(!await page.getByRole('button',{name:'Abrir menu',exact:true}).count())await page.getByRole('button',{name:'Voltar à vitrine',exact:true}).click();await page.getByRole('button',{name:'Abrir menu',exact:true}).click();await page.getByRole('dialog',{name:'Menu',exact:true}).getByRole('button',{name:label,exact:true}).click();};
 const login=async remember=>{await menu('Entrar');await page.getByLabel('E-mail',{exact:true}).fill('fixture@example.test');await page.getByLabel('Senha',{exact:true}).fill('isolated-fixture');
 await page.getByLabel('Manter sessão iniciada',{exact:true}).setChecked(remember);await page.getByRole('button',{name:'Entrar com e-mail',exact:true}).click();await page.getByRole('heading',{name:'Olá, Gabriela!'}).waitFor();};
 const png=async color=>Buffer.from(await page.evaluate(color=>{const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,32,32);return c.toDataURL('image/png').split(',')[1];},color),'base64');
 await page.goto(origin);await page.getByRole('article').nth(2).waitFor();await login(true);
 await menu('Precificação');await page.getByLabel('Ficha guardada',{exact:true}).selectOption(originalRecipe.id);
 await page.getByRole('button',{name:'Limpar rascunho local',exact:true}).click();
 assert.equal(await page.getByLabel('Ficha guardada',{exact:true}).inputValue(),'');
 assert.equal(await page.getByLabel('Produto do catálogo',{exact:true}).inputValue(),'');
 await page.getByRole('button',{name:'Guardar ficha',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(recipeWrites,0);
 await page.getByLabel('Ficha guardada',{exact:true}).selectOption(originalRecipe.id);
 assert.equal(await page.getByLabel('Rendimento da receita',{exact:true}).inputValue(),'4');
 assert.deepEqual(recipes[0],originalRecipe);
 await page.getByLabel('Preço de venda por unidade (€)',{exact:true}).fill('12');
 await page.getByRole('button',{name:'Calcular receita',exact:true}).click();
 await page.getByRole('button',{name:'Aplicar preço ao produto',exact:true}).click();assert.equal(priceWrites,0);
 await page.getByRole('button',{name:'Confirmar preço',exact:true}).click();await page.getByText('Preço atualizado no catálogo.',{exact:true}).waitFor();
 assert.equal(priceWrites,1);assert.equal(products[0].details.price,12);
 await page.getByRole('button',{name:'Guardar ficha',exact:true}).click();await page.getByText('Ficha guardada na conta da confeitaria.',{exact:true}).waitFor();
 assert.equal(recipes[0].recipe.salePrice,'12');
 pass('pricing: clear draft preserves original, incomplete save blocked, valid price requires confirmation');
 await menu('Novo produto');
 await page.getByLabel('Nome',{exact:true}).fill('QA fotografia');
 await page.getByLabel('Descrição',{exact:true}).fill('Produto fictício');
 await page.getByLabel('Preço',{exact:true}).fill('5');
 await page.getByLabel('Sem açúcar',{exact:true}).check();
 const red=await png('#ff0000'),blue=await png('#0000ff');
 await page.locator('input[type=file]').setInputFiles({name:'vermelha.png',mimeType:'image/png',buffer:red});
 await page.locator('input[type=file]').setInputFiles({name:'grande.png',mimeType:'image/png',buffer:Buffer.alloc(21*1024*1024)});
 await page.getByText(/A fotografia anterior foi mantida/).waitFor();
 assert.ok((await page.getByText(/Selecionada:/).innerText()).includes('vermelha.png'));
 await page.locator('input[type=file]').setInputFiles([]);
 assert.equal(await page.getByLabel('Nome',{exact:true}).inputValue(),'QA fotografia');
 await page.getByRole('button',{name:'Guardar produto',exact:true}).click();
 await page.getByRole('status').filter({hasText:'Rascunho guardado.'}).waitFor();
 const created=products.find(row=>row.details.name==='QA fotografia');assert.ok(created);
 assert.deepEqual(created.details.topicIds,[topicId]);
 const colorOf=async buffer=>page.evaluate(async base64=>{const im=new Image();im.src='data:image/webp;base64,'+base64;await im.decode();const c=document.createElement('canvas');c.width=c.height=1;c.getContext('2d').drawImage(im,0,0,1,1);return Array.from(c.getContext('2d').getImageData(0,0,1,1).data);},buffer.toString('base64'));
 const redPixel=await colorOf(uploadBuffers.at(-1));assert.ok(redPixel[0]>200&&redPixel[2]<50);
 await menu('Gerir catálogo');await page.getByRole('button',{name:'Editar produto QA fotografia',exact:true}).click();
 await page.getByLabel('Nome',{exact:true}).waitFor();assert.equal(await page.getByLabel('Sem açúcar',{exact:true}).isChecked(),true);
 await page.getByRole('button',{name:'Gerir tópicos',exact:true}).click();
 await page.getByRole('button',{name:'Adicionar tópico',exact:true}).click();
 await page.getByLabel('Nome do tópico',{exact:true}).fill('Sem lactose');
 await page.getByRole('button',{name:'Confirmar tópico',exact:true}).click();
 await page.getByRole('button',{name:'Guardar alterações',exact:true}).click();
 await page.getByLabel('Sem lactose',{exact:true}).waitFor();
 assert.equal(await page.getByLabel('Sem lactose',{exact:true}).isChecked(),true);
 await page.getByLabel('Mostrar no catálogo público',{exact:true}).check();
 await page.locator('input[type=file]').setInputFiles({name:'azul.png',mimeType:'image/png',buffer:blue});failUpload=true;
 await page.getByRole('button',{name:'Guardar produto',exact:true}).click();await page.getByRole('alert').waitFor();
 assert.equal(await page.getByLabel('Nome',{exact:true}).inputValue(),'QA fotografia');
 await page.getByRole('button',{name:'Guardar produto',exact:true}).click();await page.getByRole('heading',{name:'Gerir catálogo',exact:true}).waitFor();
 const bluePixel=await colorOf(uploadBuffers.at(-1));assert.ok(bluePixel[2]>200&&bluePixel[0]<50);
 pass('photo: valid → oversized → cancel keeps original upload; reopen, replace, failure and retry preserve form and pixels');
 await menu('Início');await page.getByRole('group',{name:'Filtrar por categoria'}).getByRole('button',{name:'Caseirinhos',exact:true}).click();
 await page.getByRole('group',{name:'Filtrar por tópico'}).getByRole('button',{name:'Sem açúcar',exact:true}).click();
 assert.equal(await page.getByRole('article').count(),2);
 await page.getByRole('group',{name:'Filtrar por tópico'}).getByRole('button',{name:'Todos os tópicos',exact:true}).click();assert.equal(await page.getByRole('article').count(),3);
 await page.getByRole('group',{name:'Filtrar por tópico'}).getByRole('button',{name:'Sem lactose',exact:true}).click();assert.equal(await page.getByRole('article').count(),1);
 pass('topics: association persists on reopen; public category/topic filters select the associated products');

 await menu('Clientes');await page.getByRole('button',{name:'Novo cliente',exact:true}).click();
 await page.getByLabel('Nome',{exact:true}).fill('Cliente QA');
 await page.getByLabel('Telefone',{exact:true}).fill('+351900000000');
 await page.getByLabel('E-mail',{exact:true}).fill('qa@example.test');
 await page.getByRole('button',{name:'Guardar',exact:true}).click();await page.getByRole('button',{name:/Cliente QA/}).waitFor();assert.equal(state.customers.length,1);
 await menu('Ingredientes');await page.getByRole('button',{name:'Novo ingrediente',exact:true}).click();
 await page.getByLabel('Ingrediente',{exact:true}).fill('Farinha QA');
 await page.getByLabel('Quantidade na embalagem',{exact:true}).fill('1000');
 await page.getByLabel('Preço da embalagem (EUR)',{exact:true}).fill('4');
 await page.getByRole('button',{name:'Guardar',exact:true}).click();await page.getByRole('button',{name:/Farinha QA/}).waitFor();assert.equal(state.ingredients[0].pack_price_cents,400);
 await menu('Encomendas');await page.getByRole('button',{name:'Nova encomenda',exact:true}).click();
 await page.getByLabel('Cliente existente',{exact:true}).selectOption(state.customers[0].id);
 await page.getByLabel('Produto',{exact:true}).selectOption('qa-original');
 await page.getByLabel('Data',{exact:true}).fill('2026-12-20');
 await page.getByRole('button',{name:'Guardar encomenda',exact:true}).click();await page.getByRole('button',{name:/#1 · Cliente QA/}).waitFor();assert.equal(state.orders.length,1);assert.equal(state.orders[0].total_cents,1200);
 await menu('Financeiro');await page.getByLabel('Encomenda',{exact:true}).selectOption(state.orders[0].id);
 await page.getByLabel(/Confirmei que este valor/).check();
 await page.getByRole('button',{name:'Confirmar movimento',exact:true}).click();
 await page.getByText('Recebimento de encomenda',{exact:true}).waitFor();assert.equal(state.finance[0].amount_cents,600);
 await menu('Pronta entrega');await page.getByLabel('Produto e opção',{exact:true}).selectOption(JSON.stringify(['qa-original','']));
 await page.getByLabel('Quantidade',{exact:true}).fill('3');await page.getByLabel('Motivo',{exact:true}).fill('Produção de teste');
 await page.getByRole('button',{name:'Confirmar ajuste',exact:true}).click();await page.getByText('3 un.',{exact:true}).waitFor();assert.equal(state.stock[0].available,3);
 await menu('Agenda e produção');await page.getByLabel('Capacidade especial (vazio usa o padrão)',{exact:true}).fill('5');
 await page.getByRole('button',{name:'Guardar disponibilidade',exact:true}).click();await page.getByText('Guardado.',{exact:true}).waitFor();assert.equal(state.blocks[0].capacity,5);
 await menu('Início');await menu('Pré-visualizar como cliente');
 assert.equal(await page.getByRole('button',{name:/^Editar produto /}).count(),0);
 await page.getByRole('button',{name:'Voltar à gestão',exact:true}).last().click();await page.getByRole('heading',{name:'Olá, Gabriela!'}).waitFor();
 pass('modules: customer, ingredient, manual order, deposit, stock and capacity save; client preview hides management controls');
 const viewChecks=[];

 const layout=async label=>{
 await page.waitForTimeout(550);
 const bad=await page.evaluate(()=>Array.from(document.querySelectorAll('input:not([type=hidden]),textarea,select,.admin-actions button,.ui-glass-panel')).filter(el=>{
  const b=el.getBoundingClientRect();return b.width>0&&b.height>0&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&(b.left < -1||b.right>innerWidth+1);
 }).map(el=>el.tagName+':'+(el.getAttribute('aria-label')||el.getAttribute('name')||el.textContent.slice(0,30))));
 assert.deepEqual(bad,[],label);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' page overflow');
 };
 for(const width of [320,390,768,1024,1440,1920]){
  await page.setViewportSize({width,height:900});
  for(const label of ['Início','Todas as categorias','Sobre nós','Favoritos','Contactos','Gerir catálogo','Novo produto','Precificação','Textos da loja','Visão geral','Encomendas','Agenda e produção','Financeiro','Clientes','Pronta entrega','Ingredientes','Configurações da loja']){
   await menu(label);await layout(width+' '+label);if(width===390&&['Visão geral','Encomendas','Agenda e produção','Financeiro','Clientes','Configurações da loja'].includes(label))await page.screenshot({path:path.join(out,label.replaceAll(' ','-')+'-390.png'),fullPage:true});viewChecks.push(width+' '+label);
  }
  await menu('Gerir catálogo');await page.getByRole('button',{name:'Editar categoria Caseirinhos',exact:true}).first().click();await page.getByRole('heading',{name:'Editar categoria',exact:true}).waitFor();await layout(width+' Editar categoria');
 }
 pass('responsive: '+viewChecks.length+' page/viewport checks plus six category editors at 320–1920 px');
 await menu('Início');const remembered=await context.storageState();
 const reopened=await browser.newContext({storageState:remembered});await isolate(reopened);const again=await reopened.newPage();await again.goto(origin);await again.getByRole('heading',{name:'Olá, Gabriela!'}).waitFor();await reopened.close();
 await menu('Sair da conta');await page.getByRole('heading',{name:'Seja bem-vindo!'}).waitFor();
 await login(false);assert.equal(await page.evaluate(()=>localStorage.getItem('presente-doce:catalog-session:v1')),null);await page.reload();await page.getByRole('heading',{name:'Olá, Gabriela!'}).waitFor();
 const empty=await browser.newContext();await isolate(empty);const anonymous=await empty.newPage();await anonymous.goto(origin);await anonymous.getByRole('heading',{name:'Seja bem-vindo!'}).waitFor();await empty.close();
 revoked=true;await page.reload();await page.getByText('A sessão terminou. Entre novamente.',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>sessionStorage.getItem('presente-doce:catalog-session:v1')),null);
 pass('session UI: remembered reopening, temporary reload/new context, logout and revoked refresh');
 assert.deepEqual(pageErrors,[]);
 fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify({environment:'isolated API fixture; no live Supabase writes',checks:evidence,viewChecks},null,2));
}finally{await context?.close();await browser.close();}
