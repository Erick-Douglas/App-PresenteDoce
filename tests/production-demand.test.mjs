import test from 'node:test';import assert from 'node:assert/strict';import {productionDemand} from '../src/features/pricing/demand.ts';
test('production scales subrecipes, consolidates ingredients and deducts stock once',()=>{
 const ingredient={id:'i',name:'Farinha',unit:'g',stock_quantity:300,pack_quantity:1000};
 const base={id:'base',product_id:null,recipe:{title:'Massa',yieldCount:'2',salePrice:'0',ingredients:[{ingredientId:'i',name:'Farinha',unit:'g',packQuantity:'1000',packPrice:'4',usedQuantity:'400'}]}};
 const cake={id:'cake',product_id:'p',recipe:{title:'Bolo',yieldCount:'1',salePrice:'20',ingredients:[{recipeId:'base',name:'Massa',unit:'un',packQuantity:'2',packPrice:'1.6',usedQuantity:'1'}]}};
 const result=productionDemand([{product_id:'p',option_key:'',quantity:3,mode:'preorder'},{product_id:'p',option_key:'',quantity:2,mode:'preorder'},{product_id:'p',option_key:'',quantity:9,mode:'ready'}],[cake,base],[ingredient]);
 assert.equal(result.rows[0].required,1000);assert.equal(result.rows[0].toBuy,700);assert.equal(result.rows[0].packages,1);assert.deepEqual(result.missing,[]);
});
test('missing recipes are explicit and circular dependencies fail safely',()=>{
 assert.deepEqual(productionDemand([{product_id:'missing',option_key:'',quantity:1,mode:'preorder'}],[],[]).missing,['missing']);
 const recipe={id:'cycle',product_id:'p',recipe:{title:'X',yieldCount:'1',salePrice:'1',ingredients:[{recipeId:'cycle',name:'X',usedQuantity:'1'}]}};
 assert.throws(()=>productionDemand([{product_id:'p',option_key:'',quantity:1,mode:'preorder'}],[recipe],[]),/circular/);
});
