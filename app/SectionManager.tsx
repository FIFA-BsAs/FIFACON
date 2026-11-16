'use client';
import { useState } from 'react';
import BlockEditor from './BlockEditor';
import { builtInSections, type PageSection } from './sections';

export default function SectionManager({value,onChange,onEdit,onUpload}:{value:PageSection[];onChange:(next:PageSection[])=>void;onEdit:(kind:string)=>void;onUpload:(sectionId:string,blockId:string,file:File)=>void}){
  const [expanded,setExpanded]=useState<string|null>(null);
  const [removed,setRemoved]=useState<{section:PageSection;index:number}|null>(null);
  const [confirm,setConfirm]=useState<string|null>(null);
  const missing=builtInSections.filter(s=>!value.some(v=>v.kind===s.kind));
  const edit=(id:string,patch:Partial<PageSection>)=>onChange(value.map(s=>s.id===id?{...s,...patch}:s));
  function move(index:number,offset:number){const next=[...value];[next[index],next[index+offset]]=[next[index+offset],next[index]];onChange(next);}
  function remove(index:number){setRemoved({section:structuredClone(value[index]),index});onChange(value.filter((_,i)=>i!==index));setConfirm(null);}
  function restore(){if(!removed || value.length>=25)return;const next=[...value];if(!next.some(s=>s.id===removed.section.id)){next.splice(Math.min(removed.index,next.length),0,removed.section);onChange(next)}setRemoved(null);}
  function duplicate(section:PageSection){const copy=structuredClone(section);copy.id=`custom-${crypto.randomUUID()}`;copy.title=`${section.title.slice(0,242)} (copia)`;copy.navLabel='';const next=[...value];next.splice(value.indexOf(section)+1,0,copy);onChange(next);setExpanded(copy.id);}
  function add(){const section:PageSection={id:`custom-${(crypto.randomUUID?.()||Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join(''))}`,kind:'custom',visible:true,navLabel:'',title:'Nueva sección',body:'',linkUrl:'',linkLabel:'',blocks:[]};onChange([...value,section]);setExpanded(section.id);}
  return <div className="section-manager">
    <p className="field-hint">Ocultá una sección sin perder su contenido, cambiala de lugar o eliminala de la página. Los cambios se aplican al guardar.</p>
    <button type="button" className="add new-section" disabled={value.length>=25} onClick={add}>+ Crear sección desde cero</button>
    {removed&&<div className="section-undo" role="status"><span>Se quitó «{removed.section.title}».</span><button type="button" disabled={value.length>=25} onClick={restore}>Deshacer eliminación</button></div>}
    {value.length===0&&<p className="field-hint">No hay secciones. Creá una nueva o reincorporá alguna de las originales.</p>}
    {value.map((s,index)=><article className={`section-card ${!s.visible?'section-is-hidden':''}`} key={s.id}>
      <div className="section-card-title"><strong>{s.title||'Nueva sección'}</strong><span>{s.visible?'Visible':'Oculta'}</span></div>
      <div className="section-actions">
        <button type="button" aria-pressed={s.visible} onClick={()=>edit(s.id,{visible:!s.visible})}>{s.visible?'Ocultar':'Mostrar'}</button>
        <button type="button" aria-label={`Subir ${s.title}`} disabled={index===0} onClick={()=>move(index,-1)}>↑</button>
        <button type="button" aria-label={`Bajar ${s.title}`} disabled={index===value.length-1} onClick={()=>move(index,1)}>↓</button>
        <button type="button" aria-expanded={expanded===s.id} onClick={()=>setExpanded(expanded===s.id?null:s.id)}>Configurar</button>
        {s.kind==='custom'&&<button type="button" disabled={value.length>=25} onClick={()=>duplicate(s)}>Duplicar sección</button>}
        <button type="button" className="remove-section" onClick={()=>setConfirm(s.id)}>Eliminar</button>
      </div>
      {confirm===s.id&&<div className="section-delete-confirm"><p>¿Eliminar «{s.title}» de la página? Sus bloques adicionales se quitarán; podés deshacerlo antes de cerrar este panel.</p><button type="button" onClick={()=>setConfirm(null)}>Cancelar</button><button type="button" onClick={()=>remove(index)}>Sí, eliminar sección</button></div>}
      {expanded===s.id&&<div className="section-settings">
        {s.kind==='custom'?<>
          <label className="field"><span>Título de la sección</span><input maxLength={250} value={s.title} onChange={e=>edit(s.id,{title:e.target.value})}/></label>
          <label className="field"><span>Texto introductorio (opcional)</span><textarea maxLength={5000} rows={6} placeholder="Escribí el contenido de esta sección…" value={s.body} onChange={e=>edit(s.id,{body:e.target.value})}/></label>
          <label className="field"><span>Enlace del botón (opcional, https://)</span><input type="url" maxLength={2000} value={s.linkUrl} onChange={e=>edit(s.id,{linkUrl:e.target.value})}/></label>
          <label className="field"><span>Texto del botón</span><input maxLength={250} value={s.linkLabel} onChange={e=>edit(s.id,{linkLabel:e.target.value})}/></label>
        </>:<button className="add" type="button" onClick={()=>onEdit(s.kind==='datos'?'informacion':s.kind)}>Editar contenido</button>}
        {s.kind!=='custom'&&<label className="field"><span>Nombre en el editor</span><input maxLength={250} value={s.title} onChange={e=>edit(s.id,{title:e.target.value})}/></label>}
        <label className="field"><span>Nombre en el menú (opcional)</span><input maxLength={40} placeholder="Vacío: no aparece en el menú" value={s.navLabel} onChange={e=>edit(s.id,{navLabel:e.target.value})}/></label>
        {s.kind!=='custom'&&<label className="field"><span>Ubicación de los bloques adicionales</span><select value={s.blocksPosition||'after'} onChange={e=>edit(s.id,{blocksPosition:e.target.value as 'before'|'after'})}><option value="before">Antes del contenido original</option><option value="after">Después del contenido original</option></select></label>}
        <BlockEditor value={s.blocks||[]} onChange={blocks=>edit(s.id,{blocks})} onUpload={(blockId,file)=>onUpload(s.id,blockId,file)}/>
      </div>}
    </article>)}
    {missing.length>0&&<div className="restore-sections"><h3>Reincorporar una sección original</h3><p className="field-hint">Se recupera el contenido original. Para conservar también los bloques adicionales, usá Ocultar en lugar de Eliminar.</p>{missing.map(s=><button type="button" key={s.id} disabled={value.length>=25} onClick={()=>onChange([...value,{...s}])}>+ {s.title}</button>)}</div>}
  </div>;
}
