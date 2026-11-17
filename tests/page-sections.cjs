const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const cache=new Map();
function load(filename){filename=path.resolve(filename);if(cache.has(filename))return cache.get(filename).exports;const m={exports:{}};cache.set(filename,m);const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;const localRequire=name=>{if(name.startsWith('.')){const base=path.resolve(path.dirname(filename),name);return load(fs.existsSync(base+'.ts')?base+'.ts':base+'.tsx')}return require(name)};new Function('require','module','exports',code)(localRequire,m,m.exports);return m.exports;}
const {initialContent}=load('app/content.ts'),Conference=load('app/Conference.tsx').default;
const render=content=>renderToStaticMarkup(React.createElement(Conference,{initial:content,initialVersion:0,canEdit:false}));
let data=structuredClone(initialContent),html=render(data);
assert(!html.includes('<time>'));assert(!html.includes('Editar página'));assert(html.includes('Pausar partículas'));
data.showScheduleTimes=true;assert(render(data).includes('<time>'));
const empty=structuredClone(initialContent);empty.days=[{label:'Jornada vacía',sessions:[]}];
const emptyHtml=render(empty);assert(emptyHtml.includes('Próxima señal.'));assert(emptyHtml.includes('SIN ACTIVIDADES'));assert(!emptyHtml.includes('<time>'));
assert(html.includes('Cronograma interactivo del congreso'));assert(html.includes('Actividades de la jornada'));
data.pageSections.find(s=>s.kind==='programa').visible=false;data.pageSections=data.pageSections.filter(s=>s.kind!=='expositores');
data.pageSections.find(s=>s.kind==='datos').navLabel='Datos';
data.pageSections.unshift({id:'custom-test',kind:'custom',visible:true,navLabel:'Novedades',title:'<script>hello</script>',body:'Contenido nuevo',linkUrl:'https://example.com',linkLabel:'Más información'});
html=render(data);assert(!html.includes('id="programa"'));assert(!html.includes('href="#programa"'));assert(!html.includes('id="expositores"'));assert(!html.includes('href="#expositores"'));assert(html.includes('&lt;script&gt;hello&lt;/script&gt;'));assert(html.indexOf('id="custom-test"')<html.indexOf('id="inicio"'));
for(const match of html.matchAll(/href="#([^"]+)"/g))assert(html.includes(`id="${match[1]}"`),`Missing anchor ${match[1]}`);
data.pageSections=[];data.particlesEnabled=false;html=render(data);assert(!html.includes('Pausar partículas'));assert(!html.includes('id="inicio"'));
console.log('PASS: hidden schedule times, visitor permissions, section visibility/removal/order, escaped custom content, valid navigation, empty layout, particle setting.');

const physics = structuredClone(initialContent);
physics.about = String.raw`Energía \(E=mc^2\). Entrada: $100 o $200. Error: \(\unknownMacro\).`;
physics.days[0].sessions[0].description = String.raw`\[Z=\sum_n e^{-\beta E_n}\]`;
physics.speakers[0].talk = 'Ondas $k^2$';
physics.faqs[0].answer = '$$x=\\frac{1}{2}$$';
const physicsHtml = render(physics);
assert.equal((physicsHtml.match(/class="formula-inline"/g) || []).length, 2);
assert.equal((physicsHtml.match(/class="formula-block"/g) || []).length, 2);
assert(physicsHtml.includes('<mfrac>'));
assert(physicsHtml.includes('$100 o $200'));
assert(physicsHtml.includes(String.raw`\(\unknownMacro\)`));
console.log('PASS: inline and display equations, editable schedule, speakers, FAQs, prices and invalid TeX.');

const {newBlock}=load('app/blocks.ts');
const modular=structuredClone(initialContent);
const blocks=[
 {...newBlock('heading'),text:'Título modular'},
 {...newBlock('text'),text:String.raw`Fórmula \(E=mc^2\) y <script>invisible()</script>`,width:'half'},
 {...newBlock('button'),text:'Consultar convocatoria',url:'https://example.com/convocatoria',width:'half'},
 {...newBlock('image'),imageId:'a'.repeat(64),alt:'Imagen del encuentro',caption:'Crédito de la imagen'},
 {...newBlock('callout'),text:'Aviso importante',tone:'accent'},
 newBlock('divider'),
 {...newBlock('text'),text:'SECRETO OCULTO',visible:false},
 {...newBlock('button'),text:'ENLACE INCOMPLETO'},
];
modular.pageSections[0].blocks=blocks;modular.pageSections[0].blocksPosition='before';
let modularHtml=render(modular);
assert(modularHtml.indexOf('Título modular')<modularHtml.indexOf('hero-grain'));
assert(modularHtml.includes('class="formula-inline"'));
assert(modularHtml.includes('&lt;script&gt;invisible()&lt;/script&gt;'));
assert(modularHtml.includes('href="https://example.com/convocatoria" target="_blank" rel="noopener noreferrer"'));
assert(modularHtml.includes('alt="Imagen del encuentro"'));assert(modularHtml.includes('Crédito de la imagen'));
assert(modularHtml.includes('Aviso importante'));assert(modularHtml.includes('<hr'));
assert(!modularHtml.includes('SECRETO OCULTO'));assert(!modularHtml.includes('ENLACE INCOMPLETO'));
modular.pageSections[0].blocksPosition='after';modularHtml=render(modular);
assert(modularHtml.indexOf('Título modular')>modularHtml.indexOf('hero-grain'));
modular.pageSections[0].visible=false;assert(!render(modular).includes('Título modular'));
modular.pageSections.push({id:'custom-blocks',kind:'custom',visible:true,navLabel:'Bloques',title:'Sección modular',body:'',linkUrl:'',linkLabel:'',blocks});
assert(render(modular).includes('Título modular'));
assert(modularHtml.includes('photon-toggle floating-theme'));assert(modularHtml.includes('Cambiar a modo claro'));
console.log('PASS: all block types, before/after placement, section and block visibility, TeX, escaped HTML, image references, incomplete buttons, custom sections and persistent theme control.');

const {defaultSectionStyle}=load('app/sectionStyle.ts');
for(const kind of ['portada','datos','encuentro','programa','expositores','participar','informacion','custom']){
 for(const position of ['before','after']){
  const fixture=structuredClone(initialContent);
  if(kind==='custom')fixture.pageSections.push({id:'custom-nested',kind,visible:true,navLabel:'',title:'Sección',body:'',linkUrl:'',linkLabel:''});
  const target=fixture.pageSections.find(s=>s.kind===kind);
  target.blocks=[{...newBlock('button'),text:'BOTON_DENTRO',url:'https://example.com'}];target.blocksPosition=position;
  target.appearance={...structuredClone(defaultSectionStyle),skin:'custom',radius:12};
  const output=render(fixture),anchor=kind==='portada'?'inicio':target.id;
  const start=output.indexOf(`id="${anchor}"`),end=output.indexOf('</section>',start);
  assert(start>=0&&end>start);
  assert(output.slice(start,end).includes('BOTON_DENTRO'),`${kind} ${position}: block must be inside section`);
  assert(output.slice(start,end).includes('--section-dark-bg:#35366b'));
  assert(output.includes('data-skin="custom"'));
 }
}
console.log('PASS: blocks stay inside each section in both positions, with shared theme-aware appearance.');

const layoutData=structuredClone(initialContent);
layoutData.instagramUrl='https://instagram.com/example';layoutData.email='contact@example.com';
layoutData.pageSections.push({id:'custom-auto',kind:'custom',visible:true,navLabel:'',title:'Nueva sección automática',body:'',linkUrl:'',linkLabel:'',layout:'columns3',blockGap:40,blocks:[{...newBlock('image'),imageId:'a'.repeat(64),width:'third',imageWidth:60,imageHeight:240,imageFit:'cover'}]});
const layoutHtml=render(layoutData);
assert(layoutHtml.includes('href="#custom-auto"'));assert(layoutHtml.includes('Nueva sección automática'));
assert(layoutHtml.includes('href="https://instagram.com/example"'));assert(layoutHtml.includes('href="mailto:contact@example.com"'));
assert(layoutHtml.includes('data-layout="columns3"'));assert(layoutHtml.includes('--block-gap:40px'));assert(layoutHtml.includes('object-fit:cover'));assert(layoutHtml.includes('height:240px'));
const {contentSchema}=load('app/content.ts');assert(contentSchema.safeParse(layoutData).success);
layoutData.pageSections.at(-1).visible=false;assert(!render(layoutData).includes('href="#custom-auto"'));
console.log('PASS: automatic section navigation, social links, layout and image settings survive schema validation.');
