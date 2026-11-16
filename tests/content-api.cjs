const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const ts=require('typescript');
const sqlite=new DatabaseSync(':memory:');
sqlite.exec(fs.readFileSync('drizzle/0000_gray_killraven.sql','utf8'));
const DB = {
 prepare(sql) {
  const statement = sqlite.prepare(sql);
  return {
   bind(...values) {
    return {
     async first() { return statement.get(...values) || null; },
     async run() { const result = statement.run(...values); return {meta:{changes:Number(result.changes)}}; }
    };
   }
  };
 }
};
let identity=null;
const cache=new Map();
function load(filename){filename=path.resolve(filename);if(cache.has(filename))return cache.get(filename).exports;const m={exports:{}};cache.set(filename,m);const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const localRequire=name=>{if(name==='cloudflare:workers')return {env:{DB,EDITOR_EMAILS:'editor@example.test'}};if(name==='next/headers')return {headers:async()=>new Headers(identity?{'oai-authenticated-user-id':identity.id,'oai-authenticated-user-email':identity.email}:{})};if(name==='next/navigation')return {redirect:()=>{throw new Error('Unexpected redirect')}};if(name.startsWith('.'))return load(path.resolve(path.dirname(filename),name)+'.ts');return require(name)};
 new Function('require','module','exports',code)(localRequire,m,m.exports);return m.exports;
}
(async()=>{
 const api=load('app/api/content/route.ts'),{initialContent,contentSchema}=load('app/content.ts');
 const legacy=structuredClone(initialContent);delete legacy.typography;delete legacy.pageSections;delete legacy.showScheduleTimes;delete legacy.particlesEnabled;
 const migrated=contentSchema.parse(legacy);assert.equal(migrated.showScheduleTimes,false);assert.equal(migrated.particlesEnabled,true);assert.equal(migrated.pageSections.length,7);assert.deepEqual(migrated.days,legacy.days);
 assert.deepEqual(contentSchema.parse(legacy).typography,{headings:'original',body:'original',labels:'original'});
 assert.equal((await api.GET()).status,403);
 const payload={content:structuredClone(initialContent),version:0};
 const put=(data=payload,origin='https://congress.test')=>api.PUT(new Request('https://congress.test/api/content',{method:'PUT',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(data)}));
 assert.equal((await put()).status,403);
 identity={id:'unlisted-id',email:'unlisted@example.test'};assert.equal((await put()).status,403);
 identity={id:'editor-site-id',email:'editor@example.test'};
 assert.equal((await put(payload,'https://other.test')).status,403);
 assert.equal((await put(null)).status,400);
 const bad=structuredClone(payload);bad.content.registrationUrl='javascript:alert(1)';assert.equal((await put(bad)).status,400);
 bad.content.registrationUrl='https://';assert.equal((await put(bad)).status,400);
 const invalidFont=structuredClone(payload);invalidFont.content.typography.body='unknown-font';assert.equal((await put(invalidFont)).status,400);
 payload.content.typography={headings:'palatino',body:'palatino',labels:'courier'};
 payload.content.venue='Sede de prueba';
 const duplicate=structuredClone(payload);duplicate.content.pageSections.push(duplicate.content.pageSections[0]);assert.equal((await put(duplicate)).status,400);
 const custom={id:'custom-test',kind:'custom',visible:true,navLabel:'Novedades',title:'Novedades',body:'Texto nuevo',linkUrl:'https://example.com',linkLabel:'Ver más'};
 const invalidLink=structuredClone(payload);invalidLink.content.pageSections.push({...custom,linkUrl:'javascript:alert(1)'});assert.equal((await put(invalidLink)).status,400);
 payload.content.pageSections=payload.content.pageSections.filter(s=>s.kind!=='expositores').reverse();
 payload.content.pageSections.find(s=>s.kind==='encuentro').visible=false;payload.content.pageSections.unshift(custom);
 payload.content.showScheduleTimes=true;payload.content.particlesEnabled=false;
 const {newBlock}=load('app/blocks.ts');
 payload.content.pageSections[0].blocks=[{...newBlock('text'),text:'Bloque persistente',width:'half'}, {...newBlock('button'),text:'Abrir',url:'https://example.com'}, {...newBlock('image'),imageId:'a'.repeat(64),alt:'Prueba'}];
 payload.content.pageSections[0].blocksPosition='before';
 const invalidBlock=structuredClone(payload);invalidBlock.content.pageSections[0].blocks[1].url='javascript:alert(1)';assert.equal((await put(invalidBlock)).status,400);
 const duplicateBlock=structuredClone(payload);duplicateBlock.content.pageSections[0].blocks.push(duplicateBlock.content.pageSections[0].blocks[0]);assert.equal((await put(duplicateBlock)).status,400);
 const invalidImage=structuredClone(payload);invalidImage.content.pageSections[0].blocks[2].imageId='../private';assert.equal((await put(invalidImage)).status,400);
 const tooMany=structuredClone(payload);tooMany.content.pageSections[0].blocks=Array.from({length:41},()=>newBlock('text'));assert.equal((await put(tooMany)).status,400);
 const {defaultSectionStyle}=load('app/sectionStyle.ts');
 payload.content.pageSections[0].appearance={...structuredClone(defaultSectionStyle),skin:'custom',radius:18};
 const invalidStyle=structuredClone(payload);invalidStyle.content.pageSections[0].appearance.dark.background='url(https://example.com)';assert.equal((await put(invalidStyle)).status,400);
 const saved=await put();assert.equal(saved.status,200);assert.equal((await saved.json()).version,1);
 const read=await (await api.GET()).json();assert.equal(read.content.venue,'Sede de prueba');assert.equal(read.version,1);assert.deepEqual(read.content.pageSections,payload.content.pageSections);assert.equal(read.content.showScheduleTimes,true);assert.equal(read.content.particlesEnabled,false);assert.deepEqual(read.content.typography,payload.content.typography);
 assert.equal((await put()).status,409);
 const concurrent={content:structuredClone(initialContent),version:1};
 const responses=await Promise.all([put(concurrent),put(concurrent)]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
 const row=sqlite.prepare('SELECT updated_by FROM site_content').get();assert.equal(row.updated_by,'editor-site-id');
 const publication=load('app/api/publication/route.ts');
 const post=(version,origin='https://congress.test')=>publication.POST(new Request('https://congress.test/api/publication',{method:'POST',headers:{Origin:origin},body:JSON.stringify({version})}));
 assert.equal((await publication.GET()).status,404);
 identity=null;assert.equal((await post(2)).status,403);
 identity={id:'editor-site-id',email:'editor@example.test'};
 assert.equal((await post(2,'https://evil.test')).status,403);
 assert.equal((await post(1)).status,409);
 assert.equal((await post(2)).status,200);
 const frozen=await (await publication.GET()).json();assert.equal(frozen.version,2);
 const updated=structuredClone(initialContent);updated.venue='Borrador privado';
 assert.equal((await put({content:updated,version:2})).status,200);
 assert.deepEqual(await (await publication.GET()).json(),frozen);
 assert.equal((await post(3)).status,200);
 assert.equal((await (await publication.GET()).json()).content.venue,'Borrador privado');
 identity=null;assert.equal((await api.GET()).status,403);
 console.log('PASS: publication authorization, origin, stale version rejection, atomic snapshot, draft isolation, explicit republish.');
 console.log('PASS: authorization, origin checks, malformed input, URL validation, persistent read-back, stale writes, simultaneous writes, stable author ID, legacy content defaults, font validation and persistence.');
})().catch(e=>{console.error(e);process.exitCode=1});
