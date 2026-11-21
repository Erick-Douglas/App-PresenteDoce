import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {pathToFileURL} from 'node:url';
test('compiled Node ESM entry resolves and exposes the gateway handlers',async()=>{
 const base=path.resolve('node_modules/.cache/pd-entry-tests');fs.mkdirSync(base,{recursive:true});const output=fs.mkdtempSync(path.join(base,'run-'));
 execFileSync(process.execPath,['node_modules/typescript/bin/tsc','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022','--lib','es2022,dom','--skipLibCheck','true','--strict','true','--outDir',output,'api/store.ts'],{encoding:'utf8',windowsHide:true});
 fs.writeFileSync(path.join(output,'package.json'),'{"type":"module"}');
 const entry=await import(pathToFileURL(path.join(output,'api/store.js')).href);
 assert.equal(typeof entry.POST,'function');assert.equal(typeof entry.GET,'function');
 const response=await entry.POST(new Request('https://fixture.example.test/api/store',{method:'POST',headers:{origin:'https://untrusted.example.test'},body:'{}'}));assert.equal(response.status,403);
});
