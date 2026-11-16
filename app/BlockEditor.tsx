'use client';
import { useState } from 'react';
import { blockKinds, blockLabels, newBlock, type ContentBlock } from './blocks';

export default function BlockEditor({value,onChange,onUpload,selectedId,onSelect}:{value:ContentBlock[];onChange:(blocks:ContentBlock[])=>void;onUpload:(blockId:string,file:File)=>void;selectedId?:string;onSelect?:(id:string|null)=>void}) {
  const [expanded,setExpanded]=useState<string|null>(null);
  const [removed,setRemoved]=useState<{block:ContentBlock;index:number}|null>(null);
  const edit=(id:string,patch:Partial<ContentBlock>)=>onChange(value.map(b=>b.id===id?{...b,...patch}:b));
  function add(kind:ContentBlock['kind']){const block=newBlock(kind);onChange([...value,block]);setExpanded(block.id);onSelect?.(block.id);}
  function move(index:number,offset:number){const next=[...value];[next[index],next[index+offset]]=[next[index+offset],next[index]];onChange(next);}
  function duplicate(block:ContentBlock,index:number){const copy={...structuredClone(block),id:newBlock(block.kind).id};const next=[...value];next.splice(index+1,0,copy);onChange(next);setExpanded(copy.id);onSelect?.(copy.id);}
  return <div className="block-editor">
    {!selectedId&&<h3>Bloques de contenido</h3>}<p className="field-hint">Combiná hasta 40 bloques. Se muestran en este orden; dos bloques de media fila quedan lado a lado en pantallas grandes.</p>
    {!selectedId&&<div className="block-palette">{blockKinds.map(kind=><button type="button" key={kind} disabled={value.length>=40} onClick={()=>add(kind)}>+ {blockLabels[kind]}</button>)}</div>}
    {removed&&<div className="section-undo" role="status"><span>Bloque eliminado.</span><button type="button" disabled={value.length>=40} onClick={()=>{const next=[...value];next.splice(Math.min(removed.index,next.length),0,removed.block);onChange(next);setRemoved(null)}}>Deshacer</button></div>}
    {value.map((block,index)=>selectedId&&selectedId!==block.id?null:<div className={`block-edit-card ${!block.visible?'section-is-hidden':''}`} key={block.id}>
      <div className="section-card-title"><strong>{index+1}. {blockLabels[block.kind]}</strong><span>{block.visible?'Visible':'Oculto'}</span></div>
      {!selectedId&&block.text&&<p className="block-excerpt">{block.text.slice(0,75)}</p>}
      {onSelect&&!selectedId?<button type="button" className="editor-open-item" onClick={()=>onSelect(block.id)}>Editar este bloque →</button>:<div className="section-actions">
        {!onSelect&&<button type="button" aria-expanded={expanded===block.id} onClick={()=>setExpanded(expanded===block.id?null:block.id)}>Editar bloque</button>}
        <button type="button" aria-pressed={block.visible} onClick={()=>edit(block.id,{visible:!block.visible})}>{block.visible?'Ocultar bloque':'Mostrar bloque'}</button>
        <button type="button" aria-label={`Subir bloque ${index+1}`} disabled={index===0} onClick={()=>move(index,-1)}>↑</button>
        <button type="button" aria-label={`Bajar bloque ${index+1}`} disabled={index===value.length-1} onClick={()=>move(index,1)}>↓</button>
        <button type="button" disabled={value.length>=40} onClick={()=>duplicate(block,index)}>Duplicar bloque</button>
        <button type="button" onClick={()=>{setRemoved({block:structuredClone(block),index});onChange(value.filter(b=>b.id!==block.id));onSelect?.(null)}}>Eliminar bloque</button>
      </div>}
      {(selectedId===block.id||(!onSelect&&expanded===block.id))&&<div className="block-fields">
        {['text','heading','callout','button'].includes(block.kind)&&<label className="field"><span>{block.kind==='button'?'Texto del botón':'Texto del bloque'}</span><textarea rows={block.kind==='button'?2:4} maxLength={5000} value={block.text} onChange={e=>edit(block.id,{text:e.target.value})}/></label>}
        {block.kind==='button'&&<><label className="field"><span>Enlace del botón (https://)</span><input type="url" maxLength={2000} value={block.url} onChange={e=>edit(block.id,{url:e.target.value})}/></label><label className="setting-check"><input type="checkbox" checked={block.newTab} onChange={e=>edit(block.id,{newTab:e.target.checked})}/>Abrir en una pestaña nueva</label>{(!block.url||!block.text.trim())&&<p className="field-hint">Completá texto y enlace para que el botón aparezca.</p>}</>}
        {block.kind==='image'&&<>
          <label className="field"><span>{block.imageId?'Reemplazar imagen':'Subir imagen'}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)onUpload(block.id,file)}}/></label>
          {block.imageId&&<img className="block-image-preview" src={`/api/portraits?id=${block.imageId}`} alt={block.alt}/>}
          <label className="field"><span>Descripción de la imagen (accesibilidad)</span><input maxLength={250} value={block.alt} onChange={e=>edit(block.id,{alt:e.target.value})}/></label>
          <label className="field"><span>Pie de imagen o crédito</span><input maxLength={500} value={block.caption} onChange={e=>edit(block.id,{caption:e.target.value})}/></label>
        </>}
        <div className="block-options">
          <label className="field"><span>Ancho</span><select value={block.width} onChange={e=>edit(block.id,{width:e.target.value as ContentBlock['width']})}><option value="full">Fila completa</option><option value="half">Media fila</option></select></label>
          {block.kind!=='divider'&&<label className="field"><span>Alineación</span><select value={block.align} onChange={e=>edit(block.id,{align:e.target.value as ContentBlock['align']})}><option value="left">Izquierda</option><option value="center">Centro</option><option value="right">Derecha</option></select></label>}
          {!['image','divider'].includes(block.kind)&&<label className="field"><span>Estilo</span><select value={block.tone} onChange={e=>edit(block.id,{tone:e.target.value as ContentBlock['tone']})}><option value="plain">Simple</option><option value="accent">Destacado</option></select></label>}
        </div>
      </div>}
    </div>)}
  </div>;
}
