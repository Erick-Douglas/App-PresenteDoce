import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join(path.dirname(path.dirname(process.execPath)),'node_modules/playwright')));}
const base=process.env.PD_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({executablePath:process.env.PD_CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true});
const checks=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:900},reducedMotion:'reduce'});
 const check=async label=>{
  await page.waitForTimeout(550);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' overflow');
  const bad=await page.evaluate(()=>Array.from(document.querySelectorAll('input:not([type=hidden]),select,textarea,dialog[open]')).filter(el=>{
   const r=el.getBoundingClientRect();return r.width&&r.height&&(r.left < -1||r.right>innerWidth+1);
  }).map(el=>el.tagName));
  assert.deepEqual(bad,[],label);checks.push(label);
 };
 for(const width of [320,390,768,1024,1440,1920]){
  await page.setViewportSize({width,height:900});await page.goto(base);await page.getByRole('article').nth(1).waitFor();
  await page.getByRole('button',{name:/^Adicionar ao carrinho /}).first().click();
  await page.getByRole('button',{name:/Ver carrinho/}).click();await check(width+' carrinho');
  if(width===390)await page.screenshot({path:'node_modules/.cache/pd-review/cart-390.png'});
  await page.goto(base);await page.getByRole('article').first().getByRole('heading').getByRole('button').click();
  await page.getByRole('button',{name:'Voltar',exact:true}).waitFor();await check(width+' produto');
  await page.goto(base);await page.getByRole('button',{name:'Abrir menu',exact:true}).click();await page.getByRole('dialog',{name:'Menu',exact:true}).getByRole('button',{name:'Entrar',exact:true}).click();
  await page.getByLabel('E-mail',{exact:true}).waitFor();await check(width+' login');
 }
 await page.goto(base+'/lojas/nao-existe-pd-qa');await page.getByRole('heading',{name:'Não foi possível abrir a loja',exact:true}).waitFor();assert.equal(await page.getByRole('article').count(),0);checks.push('unknown store refuses pilot fallback');
 await page.goto(base+'/criar-loja');await page.getByRole('heading',{name:'Sua loja, em breve',exact:true}).waitFor();assert.equal(await page.locator('input[type=email]').count(),0);checks.push('commercial signup disabled by default');
 fs.writeFileSync('node_modules/.cache/pd-review/public-layout.json',JSON.stringify({environment:'public catalog read only; no login or checkout submission',checks},null,2));
 console.log('PASS '+checks.length+' public layouts, unknown store and commercial gate checks');
}finally{await browser.close();}
