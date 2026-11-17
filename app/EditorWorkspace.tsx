'use client';
import { useRef, useState, type ReactNode } from 'react';
import type { Content } from './content';
import { builtInSections, type PageSection } from './sections';
import { copyFields, type CopyKey } from './pageCopy';
import { appearanceCopy, sharedCopy, scopeCopy, activityCopy, sectionCopy, editorTree, resolveEditorPath, type EditorNode } from './editorTree';
import EditorTree from './EditorTree';
import SectionStyleEditor from './SectionStyleEditor';
import TypographyEditor from './TypographyEditor';
import BlockEditor from './BlockEditor';
import { SpeakerPortrait, type Speaker } from './SpeakerPortrait';

type Props={data:Content;initialSelection:string;disabled:boolean;update:(fn:(next:Content)=>void)=>void;uploadSpeaker:(index:number,file:File)=>void;uploadBlock:(sectionId:string,blockId:string,file:File)=>void};
function Input({label,value,onChange,multiline=false,max=250,type='text'}:{label:string;value:string;onChange:(v:string)=>void;multiline?:boolean;max?:number;type?:string}){
 return <label className="field"><span>{label}</span>{multiline?<textarea rows={4} maxLength={max} value={value} onChange={e=>onChange(e.target.value)}/>:<input type={type} maxLength={max} value={value} onChange={e=>onChange(e.target.value)}/>}</label>;
}
function Check({label,value,onChange}:{label:string;value:boolean;onChange:(v:boolean)=>void}){return <label className="setting-check"><input type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)}/><span>{label}</span></label>;}
function DeleteAction({label,onDelete}:{label:string;onDelete:()=>void}){
 const [confirm,setConfirm]=useState(false);
 return confirm?<div className="section-delete-confirm"><p>¿Eliminar {label}?</p><button type="button" onClick={()=>setConfirm(false)}>Cancelar</button><button type="button" onClick={()=>{onDelete();setConfirm(false)}}>Sí, eliminar</button></div>:<button type="button" className="editor-delete" onClick={()=>setConfirm(true)}>Eliminar {label}</button>;
}
export default function EditorWorkspace({data,initialSelection,disabled,update,uploadSpeaker,uploadBlock}:Props){
 const [selection,setSelection]=useState(initialSelection),[showTree,setShowTree]=useState(false);
 const [removed,setRemoved]=useState<{section:PageSection;index:number}|null>(null);
 const contentRef=useRef<HTMLDivElement>(null),headingRef=useRef<HTMLHeadingElement>(null);
 const root=editorTree(data),path=resolveEditorPath(root,selection),current=path[path.length-1],id=current.id;
 const route=id.split('/'),section=data.pageSections.find(s=>s.id===route[1]),prefix=section?`section/${section.id}`:'';
 function go(next:string){setSelection(next);setShowTree(false);contentRef.current?.scrollTo({top:0});requestAnimationFrame(()=>headingRef.current?.focus());}
 function set<K extends keyof Content>(key:K,value:Content[K]){update(next=>{next[key]=value})}
 function field(key:keyof Content,label:string,multiline=false,type='text'){return <Input key={key} label={label} value={String(data[key]??'')} multiline={multiline} max={multiline?5000:type==='url'?2000:250} type={type} onChange={v=>set(key,v as never)}/>}
 function copyFieldsEditor(keys:CopyKey[]){return <div className="editor-copy-fields">{keys.map(key=><Input key={key} label={copyFields[key][1]} value={data.copy[key]} multiline max={500} onChange={value=>update(next=>{next.copy[key]=value})}/>)}</div>}
 function patchSection(patch:Partial<PageSection>){if(section)update(next=>{const target=next.pageSections.find(s=>s.id===section.id);if(target)Object.assign(target,patch)})}
 function cards(nodes:EditorNode[]){return <div className="editor-destinations">{nodes.map(node=><button type="button" key={node.id} onClick={()=>go(node.id)}><strong>{node.label}<span aria-hidden="true"> →</span></strong>{node.description&&<span>{node.description}</span>}{node.hidden&&<small>Oculta</small>}</button>)}</div>}
 function addSection(){const s:PageSection={id:`custom-${crypto.randomUUID()}`,kind:'custom',title:'Nueva sección',navLabel:'',visible:true,body:'',linkUrl:'',linkLabel:'',blocks:[]};set('pageSections',[...data.pageSections,s]);go(`section/${s.id}/content`)}
 function moveSection(offset:number){if(!section)return;const index=data.pageSections.findIndex(s=>s.id===section.id);const next=[...data.pageSections];[next[index],next[index+offset]]=[next[index+offset],next[index]];set('pageSections',next)}
 function moveItem(kind:'days'|'speakers'|'faqs',index:number,offset:number){update(next=>{const list=next[kind];[list[index],list[index+offset]]=[list[index+offset],list[index]];});go(`${prefix}/${kind==='days'?'day':kind==='speakers'?'speaker':'faq'}/${index+offset}`)}
 const itemIndex=Number(route[3]),sessionIndex=Number(route[4]);
 const day=data.days[itemIndex],speaker=data.speakers[itemIndex],faq=data.faqs[itemIndex];
 const speakerChange=(patch:Partial<Speaker>)=>update(next=>Object.assign(next.speakers[itemIndex],patch));
 let body:ReactNode=null;
 if(id==='page'||id==='general'||id===prefix)body=cards(current.children||[]);
 if(id==='general/identity')body=<>{field('name','Nombre del congreso')}{field('tagline','Lema')}{field('date','Fecha del encuentro')}{field('venue','Sede')}{field('address','Dirección')}{field('modality','Modalidad')}{field('instagramUrl','Instagram (https://)',false,'url')}{field('email','Correo del encabezado',false,'email')}<p className="field-hint">Estos datos se comparten entre portada, encabezado, pie e información del encuentro.</p></>;
 if(id==='general/typography')body=<TypographyEditor value={data.typography} onChange={value=>set('typography',value)}/>;
 if(id==='general/appearance')body=<><Check label="Activar partículas suaves" value={data.particlesEnabled} onChange={value=>set('particlesEnabled',value)}/>{copyFieldsEditor(appearanceCopy)}</>;
 if(id==='general/copy')body=copyFieldsEditor(sharedCopy);
 if(id==='sections')body=<>
  <button type="button" className="add" disabled={data.pageSections.length>=25} onClick={addSection}>+ Crear sección</button>
  <p className="field-hint">El árbol conserva el orden de la página. Entrá en una sección para moverla, ocultarla o editar sus elementos.</p>
  {cards(current.children||[])}
  {builtInSections.some(s=>!data.pageSections.some(v=>v.kind===s.kind))&&<details className="edit-session"><summary>Recuperar secciones originales</summary><p className="field-hint">Recupera su contenido original. Los bloques eliminados solo se recuperan con Deshacer.</p>{builtInSections.filter(s=>!data.pageSections.some(v=>v.kind===s.kind)).map(s=><button type="button" className="add" key={s.id} disabled={data.pageSections.length>=25} onClick={()=>{set('pageSections',[...data.pageSections,structuredClone(s)]);go(`section/${s.id}`)}}>+ {s.title}</button>)}</details>}
 </>;
 if(section&&route[2]==='settings'){
  const index=data.pageSections.indexOf(section);
  body=<><Check label="Mostrar esta sección en la página" value={section.visible} onChange={visible=>patchSection({visible})}/><Input label="Nombre de la sección en el editor" value={section.title} onChange={title=>patchSection({title})}/><Input label="Nombre en el menú público" max={40} value={section.navLabel} onChange={navLabel=>patchSection({navLabel})}/><p className="field-hint">Vacío: usa el título de la sección. Todas las secciones visibles aparecen automáticamente en el menú.</p>
   <div className="editor-context-actions"><button type="button" disabled={index===0} onClick={()=>moveSection(-1)}>↑ Subir sección</button><button type="button" disabled={index===data.pageSections.length-1} onClick={()=>moveSection(1)}>↓ Bajar sección</button></div>
   {section.kind==='custom'&&<button type="button" className="add" disabled={data.pageSections.length>=25} onClick={()=>{const s={...structuredClone(section),id:`custom-${crypto.randomUUID()}`,title:`${section.title.slice(0,242)} (copia)`,navLabel:''};const next=[...data.pageSections];next.splice(index+1,0,s);set('pageSections',next);go(`section/${s.id}`)}}>Duplicar sección</button>}
   <DeleteAction key={id} label="esta sección y sus bloques" onDelete={()=>{setRemoved({section:structuredClone(section),index});set('pageSections',data.pageSections.filter(s=>s.id!==section.id));go('sections')}}/>
  </>;
 }
 if(section&&route[2]==='style')body=<><SectionStyleEditor key={section.id} value={section.appearance} onChange={appearance=>patchSection({appearance})}/><h4>Disposición del contenido</h4><label className="field"><span>Texto y botones originales</span><select value={section.nativeLayout||'original'} onChange={e=>patchSection({nativeLayout:e.target.value as PageSection['nativeLayout']})}><option value="original">Original</option><option value="stack">Apilados</option><option value="columns">Dos columnas</option></select></label></>;
 if(section&&route[2]==='content')body=<>
  {section.kind==='custom'&&<><Input label="Título de la sección" value={section.title} onChange={title=>patchSection({title})}/><Input label="Texto introductorio" multiline max={5000} value={section.body} onChange={body=>patchSection({body})}/><Input label="Enlace del botón introductorio (https://)" type="url" max={2000} value={section.linkUrl} onChange={linkUrl=>patchSection({linkUrl})}/><Input label="Texto del botón introductorio" value={section.linkLabel} onChange={linkLabel=>patchSection({linkLabel})}/></>}
  {section.kind==='portada'&&<><Check label="Mostrar el nombre como texto en lugar del logo" value={data.textLogo} onChange={value=>set('textLogo',value)}/>{field('edition','Edición')}{field('headline','Presentación breve',true)}{field('activities','Actividades destacadas')}</>}
  {section.kind==='datos'&&<p className="editor-scope-note">La fecha, sede y modalidad están en <button type="button" onClick={()=>go('general/identity')}>Configuración general → Identidad y datos</button>. Aquí podés cambiar sus etiquetas.</p>}
  {section.kind==='encuentro'&&<>{field('aboutTitle','Título')}{field('about','Descripción del encuentro',true)}</>}
  {section.kind==='programa'&&<>{field('agendaTitle','Título del programa')}{field('agendaNote','Aviso sobre el programa')}<Check label="Mostrar horarios del programa" value={data.showScheduleTimes} onChange={value=>set('showScheduleTimes',value)}/></>}
  {section.kind==='expositores'&&field('speakersNote','Aviso sobre expositores')}
  {section.kind==='participar'&&<>{field('registrationTitle','Título')}{field('registrationText','Información de inscripción',true)}{field('registrationUrl','Enlace al formulario (https://)',false,'url')}{field('registrationLabel','Texto del botón')}</>}
  {section.kind==='informacion'&&<><p className="editor-scope-note">La sede y dirección están en <button type="button" onClick={()=>go('general/identity')}>Identidad y datos del encuentro</button>.</p>{field('mapUrl','Enlace al mapa (https://)',false,'url')}{field('email','Correo de contacto',false,'email')}</>}
  {copyFieldsEditor(sectionCopy[section.kind])}
 </>;
 if(section&&route[2]==='scope')body=<>
  <h4 className="editor-subheading">Marco del osciloscopio</h4>
  {([['brand','Marca'],['model','Modelo'],['header','Leyenda superior'],['footerLeft','Leyenda inferior izquierda'],['footerRight','Leyenda inferior derecha'],['channels','Título de jornadas'],['activities','Título de actividades']] as const).map(([key,label])=><Input key={key} label={label} value={data.scopeFrame[key]} onChange={value=>update(next=>{next.scopeFrame[key]=value})}/>)}
  <p className="field-hint">{'{canales}'} muestra automáticamente la cantidad de jornadas.</p><h4 className="editor-subheading">Display</h4>{copyFieldsEditor(scopeCopy)}
 </>;
 if(section&&route[2]==='activity-copy')body=copyFieldsEditor(activityCopy);
 if(section&&route[2]==='days')body=<>{cards(current.children||[])}<button type="button" className="add" disabled={data.days.length>=10} onClick={()=>{set('days',[...data.days,{label:`Jornada ${data.days.length+1}`,sessions:[]}]);go(`${prefix}/day/${data.days.length}`)}}>+ Agregar jornada</button></>;
 if(section&&route[2]==='day'&&day)body=<>
  <Input label="Nombre de la jornada" value={day.label} onChange={value=>update(next=>{next.days[itemIndex].label=value})}/>
  <div className="editor-context-actions"><button type="button" disabled={itemIndex===0} onClick={()=>moveItem('days',itemIndex,-1)}>↑ Subir jornada</button><button type="button" disabled={itemIndex===data.days.length-1} onClick={()=>moveItem('days',itemIndex,1)}>↓ Bajar jornada</button></div>
  <h4 className="editor-subheading">Actividades de esta jornada</h4>{cards(current.children||[])}
  <button type="button" className="add" disabled={day.sessions.length>=40} onClick={()=>{update(next=>{next.days[itemIndex].sessions.push({time:'',title:'Nueva actividad',description:'',type:''})});go(`${prefix}/session/${itemIndex}/${day.sessions.length}`)}}>+ Agregar actividad</button>
  {data.days.length>1&&<DeleteAction key={id} label="esta jornada" onDelete={()=>{update(next=>{next.days.splice(itemIndex,1)});go(`${prefix}/days`)}}/>}
 </>;
 if(section&&route[2]==='session'&&day?.sessions[sessionIndex]){
  const session=day.sessions[sessionIndex];
  body=<>{([['time','Horario'],['title','Título de la actividad'],['description','Descripción'],['type','Tipo de actividad']] as const).map(([key,label])=><Input key={key} label={label} value={session[key]} multiline={key==='description'} max={key==='description'?5000:250} onChange={value=>update(next=>{next.days[itemIndex].sessions[sessionIndex][key]=value})}/>)}
   <div className="editor-context-actions">{([-1,1] as const).map(offset=><button type="button" key={offset} disabled={offset<0?sessionIndex===0:sessionIndex===day.sessions.length-1} onClick={()=>{update(next=>{const list=next.days[itemIndex].sessions;[list[sessionIndex],list[sessionIndex+offset]]=[list[sessionIndex+offset],list[sessionIndex]]});go(`${prefix}/session/${itemIndex}/${sessionIndex+offset}`)}}>{offset<0?'↑ Subir actividad':'↓ Bajar actividad'}</button>)}</div>
   <DeleteAction key={id} label="esta actividad" onDelete={()=>{update(next=>{next.days[itemIndex].sessions.splice(sessionIndex,1)});go(`${prefix}/day/${itemIndex}`)}}/>
  </>;
 }
 if(section&&route[2]==='speakers')body=<>{cards(current.children||[])}<button type="button" className="add" disabled={data.speakers.length>=30} onClick={()=>{set('speakers',[...data.speakers,{name:'Nuevo/a expositor/a',affiliation:'',talk:''}]);go(`${prefix}/speaker/${data.speakers.length}`)}}>+ Agregar expositor/a</button></>;
 if(section&&route[2]==='speaker'&&speaker)body=<>
  <Input label="Nombre y apellido" value={speaker.name} onChange={name=>speakerChange({name})}/><Input label="Institución o área de trabajo" value={speaker.affiliation} onChange={affiliation=>speakerChange({affiliation})}/><Input label="Título de la charla" multiline max={5000} value={speaker.talk} onChange={talk=>speakerChange({talk})}/><Input label="Biografía" multiline max={5000} value={speaker.bio||''} onChange={bio=>speakerChange({bio})}/><Input label="Resumen de la charla" multiline max={5000} value={speaker.abstract||''} onChange={abstract=>speakerChange({abstract})}/>
  <label className="field"><span>Alineación del texto</span><select value={speaker.align||'left'} onChange={e=>speakerChange({align:e.target.value as Speaker['align']})}><option value="left">Izquierda</option><option value="center">Centro</option><option value="right">Derecha</option></select></label>
  <h4 className="editor-subheading">Foto y encuadre</h4><label className="field"><span>{speaker.photo?'Reemplazar foto':'Subir foto'}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)uploadSpeaker(itemIndex,file)}}/></label>
  {speaker.photo&&<><div className="speaker-art has-portrait portrait-preview"><SpeakerPortrait speaker={speaker}/></div>{([['x','Posición horizontal',0,100,1],['y','Posición vertical',0,100,1],['zoom','Zoom',1,3,.05]] as const).map(([key,label,min,max,step])=><label className="field" key={key}><span>{label}</span><input type="range" min={min} max={max} step={step} value={speaker.photo![key]} onChange={e=>speakerChange({photo:{...speaker.photo!,[key]:Number(e.target.value)}})}/></label>)}<Input label="Descripción de la foto" value={speaker.photo.alt} onChange={alt=>speakerChange({photo:{...speaker.photo!,alt}})}/><Input label="Pie de foto o crédito" value={speaker.caption||''} onChange={caption=>speakerChange({caption})}/><button type="button" className="add" onClick={()=>speakerChange({photo:undefined,caption:''})}>Quitar foto</button></>}
  <div className="editor-context-actions"><button type="button" disabled={itemIndex===0} onClick={()=>moveItem('speakers',itemIndex,-1)}>↑ Subir expositor/a</button><button type="button" disabled={itemIndex===data.speakers.length-1} onClick={()=>moveItem('speakers',itemIndex,1)}>↓ Bajar expositor/a</button></div>
  <DeleteAction key={id} label="este expositor/a" onDelete={()=>{update(next=>{next.speakers.splice(itemIndex,1)});go(`${prefix}/speakers`)}}/>
 </>;
 if(section&&route[2]==='faqs')body=<>{cards(current.children||[])}<button type="button" className="add" disabled={data.faqs.length>=20} onClick={()=>{set('faqs',[...data.faqs,{question:'Nueva pregunta',answer:''}]);go(`${prefix}/faq/${data.faqs.length}`)}}>+ Agregar pregunta</button></>;
 if(section&&route[2]==='faq'&&faq)body=<><Input label="Pregunta" value={faq.question} onChange={question=>update(next=>{next.faqs[itemIndex].question=question})}/><Input label="Respuesta" multiline max={5000} value={faq.answer} onChange={answer=>update(next=>{next.faqs[itemIndex].answer=answer})}/><div className="editor-context-actions"><button type="button" disabled={itemIndex===0} onClick={()=>moveItem('faqs',itemIndex,-1)}>↑ Subir pregunta</button><button type="button" disabled={itemIndex===data.faqs.length-1} onClick={()=>moveItem('faqs',itemIndex,1)}>↓ Bajar pregunta</button></div><DeleteAction key={id} label="esta pregunta" onDelete={()=>{update(next=>{next.faqs.splice(itemIndex,1)});go(`${prefix}/faqs`)}}/></>;
 if(section&&['blocks','block'].includes(route[2]))body=<>
  <label className="field"><span>Disposición de bloques</span><select value={section.layout||'original'} onChange={e=>patchSection({layout:e.target.value as PageSection['layout']})}><option value="original">Ancho de cada bloque</option><option value="stack">Una columna</option><option value="columns2">Dos columnas</option><option value="columns3">Tres columnas</option></select></label><label className="field"><span>Separación entre bloques: {section.blockGap??24} px</span><input type="range" min="0" max="120" value={section.blockGap??24} onChange={e=>patchSection({blockGap:Number(e.target.value)})}/></label>{route[2]==='blocks'&&section.kind!=='custom' &&<label className="field"><span>Ubicación de los bloques</span><select value={section.blocksPosition||'after'} onChange={e=>patchSection({blocksPosition:e.target.value as 'before'|'after'})}><option value="before">Antes del contenido original</option><option value="after">Después del contenido original</option></select></label>}
  <BlockEditor key={section.id} value={section.blocks||[]} selectedId={route[2]==='block'?route[3]:undefined} onSelect={blockId=>go(blockId?`${prefix}/block/${blockId}`:`${prefix}/blocks`)} onChange={blocks=>patchSection({blocks})} onUpload={(blockId,file)=>uploadBlock(section.id,blockId,file)}/>
 </>;
 return <div className={`editor-workspace ${showTree?'show-editor-tree':''}`}>
  <div className="editor-mobile-switch"><button type="button" aria-expanded={showTree} onClick={()=>setShowTree(!showTree)}>{showTree?'Volver al contenido':'Ver árbol de la página'}</button><span>{current.label}</span></div>
  <fieldset className="editor-navigation" disabled={disabled}><EditorTree root={root} selected={id} onSelect={go}/></fieldset>
  <div className="editor-detail" ref={contentRef}>
   <nav className="editor-breadcrumbs" aria-label="Ruta de edición"><ol>{path.map((node,index)=><li key={node.id}>{index===path.length-1?<span aria-current="page">{node.label}</span>:<button type="button" disabled={disabled} onClick={()=>go(node.id)}>{node.label}</button>}</li>)}</ol></nav>
   <div className="editor-detail-heading"><span className="editor-scope-badge">{id==='page'?'TODA LA PÁGINA':path.some(n=>n.id==='general')?'CONFIGURACIÓN GENERAL':section?`SECCIÓN${!section.visible?' OCULTA':''}`:'ESTRUCTURA'}</span><h3 tabIndex={-1} ref={headingRef}>{current.label}</h3>{current.description&&<p>{current.description}</p>}</div>
   {removed&&<div className="section-undo" role="status"><span>Se eliminó «{removed.section.title}».</span><button type="button" disabled={disabled||data.pageSections.length>=25||data.pageSections.some(s=>s.id===removed.section.id)} onClick={()=>{const next=[...data.pageSections];next.splice(Math.min(removed.index,next.length),0,removed.section);set('pageSections',next);go(`section/${removed.section.id}`);setRemoved(null)}}>Deshacer eliminación</button></div>}
   <fieldset className="editor-fields focused-fields" disabled={disabled}>{body}</fieldset>
   <details className="editor-writing-help"><summary>Cómo escribir fórmulas</summary><p>Usá <code>{String.raw`\(E=mc^2\)`}</code> dentro del texto o <code>{String.raw`\[E=mc^2\]`}</code> en un renglón aparte.</p></details>
  </div>
 </div>;
}
