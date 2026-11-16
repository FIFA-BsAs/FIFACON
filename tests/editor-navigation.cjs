const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function loader(react=React){const cache=new Map();function load(filename){filename=path.resolve(filename);if(cache.has(filename))return cache.get(filename).exports;const m={exports:{}};cache.set(filename,m);const result=ts.transpileModule(fs.readFileSync(filename,'utf8'),{reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});assert.equal(result.diagnostics?.length||0,0,filename+' must parse');const req=name=>{if(name==='react')return react;if(name.startsWith('.')){const base=path.resolve(path.dirname(filename),name);return load(fs.existsSync(base+'.ts')?base+'.ts':base+'.tsx')}return require(name)};new Function('require','module','exports',result.outputText)(req,m,m.exports);return m.exports;}return load;}
const load=loader(),{initialContent,contentSchema}=load('app/content.ts');
const {editorTree,nodePath,resolveEditorPath,sectionCopy,sharedCopy,appearanceCopy,activityCopy,scopeCopy}=load('app/editorTree.ts');
const {copyKeys}=load('app/pageCopy.ts'),{newBlock}=load('app/blocks.ts');
const Workspace=load('app/EditorWorkspace.tsx').default;
const data=structuredClone(initialContent);
data.pageSections[0].visible=false;
data.pageSections[2].blocks=[{...newBlock('text'),text:'Prueba de bloque'}];
data.pageSections.push({id:'custom-tree',kind:'custom',visible:true,title:'Sección propia',navLabel:'',body:'Texto propio',linkLabel:'',linkUrl:'',blocks:[]});
const tree=editorTree(data),walk=node=>[node,...(node.children||[]).flatMap(walk)],nodes=walk(tree);
assert.equal(new Set(nodes.map(n=>n.id)).size,nodes.length);
assert.deepEqual(nodePath(tree,'section/programa/session/0/1').map(n=>n.label),['Página completa','Secciones de la página','Programa','Jornadas y actividades','Jornada 01','Charla estelar']);
assert(nodePath(tree,'section/portada')[2].hidden);
assert.equal(resolveEditorPath(tree,'section/custom-tree/block/missing').at(-1).id,'section/custom-tree');
assert.equal(resolveEditorPath(tree,'section/deleted/content').at(-1).id,'page');
const allCopy=[...Object.values(sectionCopy).flat(),...sharedCopy,...appearanceCopy,...activityCopy,...scopeCopy];
assert.deepEqual([...allCopy].sort(),[...copyKeys].sort(),'every existing text setting has exactly one editor location');
for(const node of nodes){const html=renderToStaticMarkup(React.createElement(Workspace,{data,initialSelection:node.id,disabled:false,update:()=>{},uploadSpeaker:()=>{},uploadBlock:()=>{}}));assert(html.includes('Ruta de edición'));assert(html.includes('Árbol de edición'));assert(html.includes('aria-current="page"'));assert(!html.includes('editor-sections'));}
const render=id=>renderToStaticMarkup(React.createElement(Workspace,{data,initialSelection:id,disabled:false,update:()=>{},uploadSpeaker:()=>{},uploadBlock:()=>{}}));
assert(render('general/typography').includes('Vista previa de la combinación tipográfica'));
assert(render('section/programa/session/0/1').includes('Título de la actividad'));
assert(!render('section/programa/session/0/1').includes('Nombre y apellido'));
assert(render('section/expositores/speaker/0').includes('Nombre y apellido'));
assert(render('section/custom-tree/content').includes('Texto propio'));
assert(render('section/encuentro/block/'+data.pageSections[2].blocks[0].id).includes('Texto del bloque'));
assert(render('section/encuentro/blocks').includes('Editar este bloque'));
assert(!render('section/encuentro/blocks').includes('Eliminar bloque'));

// Exercise the workspace's event handlers with persistent React hook state and real content validation.
let slots=[],cursor=0;
const mockReact={...React,useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value}]},useRef(){return {current:null}},useEffect(){}};
const interactive=loader(mockReact),InteractiveWorkspace=interactive('app/EditorWorkspace.tsx').default;
let draft=structuredClone(data),view;
global.requestAnimationFrame=fn=>{fn();return 0};
function rerender(){cursor=0;view=InteractiveWorkspace({data:draft,initialSelection:'page',disabled:false,update:fn=>{draft=structuredClone(draft);fn(draft)},uploadSpeaker:()=>{},uploadBlock:()=>{}});return view;}
function elements(node){if(node===null||node===undefined||typeof node==='boolean')return [];if(Array.isArray(node))return node.flatMap(elements);if(typeof node!=='object')return [];return [node,...elements(node.props?.children)];}
const find=predicate=>{const node=elements(view).find(predicate);assert(node,'expected editor control');return node;};
const text=node=>typeof node==='string'?node:Array.isArray(node)?node.map(text).join(''):node?.props?text(node.props.children):'';
function go(id){find(n=>n.type?.name==='EditorTree').props.onSelect(id);rerender();}
function click(label){find(n=>n.type==='button'&&text(n)===label).props.onClick();rerender();}
rerender();go('section/programa/session/0/0');find(n=>n.type?.name==='Input'&&n.props.label==='Título de la actividad').props.onChange('Actividad editada');rerender();click('↓ Bajar actividad');assert.equal(draft.days[0].sessions[1].title,'Actividad editada');assert.equal(slots[0],'section/programa/session/0/1');
go('general/identity');find(n=>n.type?.name==='Input'&&n.props.label==='Nombre del congreso').props.onChange('FIFA CON actualizado');rerender();go('section/programa/session/0/1');assert.equal(find(n=>n.type?.name==='Input'&&n.props.label==='Título de la actividad').props.value,'Actividad editada');assert.equal(draft.name,'FIFA CON actualizado');
go('sections');click('+ Crear sección');const created=draft.pageSections.at(-1);assert.equal(slots[0],`section/${created.id}/content`);
go(`section/${created.id}/settings`);find(n=>n.type?.name==='Check').props.onChange(false);rerender();assert.equal(draft.pageSections.at(-1).visible,false);find(n=>n.type?.name==='DeleteAction').props.onDelete();rerender();assert(!draft.pageSections.some(s=>s.id===created.id));click('Deshacer eliminación');assert(draft.pageSections.some(s=>s.id===created.id));
go('section/programa/days');click('+ Agregar jornada');const lastDay=draft.days.length-1;click('+ Agregar actividad');assert.equal(slots[0],`section/programa/session/${lastDay}/0`);
go('section/expositores/speakers');click('+ Agregar expositor/a');assert.equal(slots[0],`section/expositores/speaker/${draft.speakers.length-1}`);
go('section/informacion/faqs');click('+ Agregar pregunta');assert.equal(slots[0],`section/informacion/faq/${draft.faqs.length-1}`);
assert(contentSchema.safeParse(draft).success);
console.log(`PASS: ${nodes.length} editor destinations render; hierarchy, breadcrumbs, hidden sections, full text coverage, focused forms, retained drafts, reordered selected items, creation, deletion and undo.`);
