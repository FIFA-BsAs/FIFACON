'use client';
import { useEffect, useState } from 'react';
import { nodePath, type EditorNode } from './editorTree';
export default function EditorTree({root,selected,onSelect}:{root:EditorNode;selected:string;onSelect:(id:string)=>void}){
 const [expanded,setExpanded]=useState<Set<string>>(()=>new Set(['page',...nodePath(root,selected).map(n=>n.id)]));
 useEffect(()=>{setExpanded(previous=>new Set([...previous,...nodePath(root,selected).map(n=>n.id)]));},[selected]);
 const render=(node:EditorNode)=>{
  const hasChildren=Boolean(node.children?.length),open=expanded.has(node.id);
  return <li key={node.id} className={node.hidden?'editor-node-hidden':undefined}>
   <div className={`editor-node ${selected===node.id?'is-selected':''}`}>
    {hasChildren?<button type="button" className="tree-disclosure" aria-label={`${open?'Contraer':'Expandir'} ${node.label}`} aria-expanded={open} aria-controls={`tree-${node.id}`} onClick={()=>setExpanded(previous=>{const next=new Set(previous);if(open)next.delete(node.id);else next.add(node.id);return next;})}>{open?'▾':'▸'}</button>:<span className="tree-leaf" aria-hidden="true">·</span>}
    <button type="button" className="tree-label" aria-current={selected===node.id?'page':undefined} onClick={()=>onSelect(node.id)}><span>{node.label}</span>{node.hidden&&<small>Oculto</small>}</button>
   </div>
   {hasChildren&&<ul id={`tree-${node.id}`} hidden={!open}>{node.children!.map(render)}</ul>}
  </li>;
 };
 return <nav className="editor-tree" aria-label="Árbol de edición"><p className="editor-tree-caption">ESTRUCTURA DE LA PÁGINA</p><ul>{render(root)}</ul></nav>;
}
