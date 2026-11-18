const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
let allowed=true;const objects=new Map();const env={BUCKET:{put:async(k,b,m)=>objects.set(k,{body:b,...m}),get:async k=>objects.get(k)}};
const m={exports:{}};
new Function('require','module','exports',ts.transpileModule(fs.readFileSync('app/api/flyers/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(n=>n==='cloudflare:workers'?{env}:{canEdit:async()=>allowed},m,m.exports);
const post=(body,origin='https://example.com')=>m.exports.POST(new Request('https://example.com/api/flyers',{method:'POST',headers:{origin},body}));
(async()=>{
 allowed=false;assert.equal((await post('%PDF-1.7 test')).status,403);allowed=true;
 assert.equal((await post('%PDF-1.7 test','https://other.test')).status,403);
 assert.equal((await post('<html>not a flyer</html>')).status,415);
 assert.equal((await post(new Uint8Array(10485761))).status,413);
 const response=await post('%PDF-1.7 test');assert.equal(response.status,201);const file=await response.json();assert.equal(file.ext,'pdf');
 const get=await m.exports.GET(new Request(`https://example.com/api/flyers?file=${file.id}.pdf`));assert.equal(get.status,200);assert.equal(get.headers.get('Content-Disposition'),'inline');assert.equal(await get.text(),'%PDF-1.7 test');
 assert.equal((await m.exports.GET(new Request('https://example.com/api/flyers?file=../secret'))).status,404);
 console.log('PASS: flyer authorization, origin, size, file signature, upload/readback and inline delivery.');
})().catch(e=>{console.error(e);process.exit(1)});
