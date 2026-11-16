'use client';
import { useState } from 'react';
import { defaultSectionStyle, type SectionStyle } from './sectionStyle';
export default function SectionStyleEditor({value,onChange}:{value?:SectionStyle;onChange:(value:SectionStyle|undefined)=>void}){
 const style=value||defaultSectionStyle;
 const [mode,setMode]=useState<'dark'|'light'>('dark');
 const edit=(patch:Partial<SectionStyle>)=>onChange({...structuredClone(style),...patch});
 return <>
  <p className="field-hint">La estética abarca toda esta sección, incluidos sus bloques. Los estilos predefinidos se adaptan al modo claro y oscuro.</p>
  <label className="field"><span>Fondo y paleta</span><select value={style.skin} onChange={e=>edit({skin:e.target.value as SectionStyle['skin']})}><option value="original">Original de esta sección</option><option value="plain">Fondo de la página</option><option value="soft">Suave</option><option value="accent">Destacado</option><option value="custom">Colores personalizados</option></select></label>
  {style.skin==='custom'&&<div className="section-color-editor"><label className="field"><span>Paleta que querés editar</span><select value={mode} onChange={e=>setMode(e.target.value as 'dark'|'light')}><option value="dark">Modo oscuro</option><option value="light">Modo claro</option></select></label>{([['background','Fondo'],['text','Texto'],['accent','Acento y botones']] as const).map(([key,label])=><label className="field color-field" key={key}><span>{label}</span><input type="color" value={style[mode][key]} onChange={e=>edit({[mode]:{...style[mode],[key]:e.target.value}})}/><code>{style[mode][key]}</code></label>)}<p className="field-hint">Elegí texto y fondo con contraste suficiente. Cada modo conserva su propia paleta.</p></div>}
  <label className="field"><span>Espaciado vertical</span><select value={style.spacing} onChange={e=>edit({spacing:e.target.value as SectionStyle['spacing']})}><option value="original">Original</option><option value="compact">Compacto</option><option value="normal">Medio</option><option value="airy">Amplio</option></select></label>
  <label className="field"><span>Ancho del contenido</span><select value={style.width} onChange={e=>edit({width:e.target.value as SectionStyle['width']})}><option value="original">Original</option><option value="narrow">Angosto</option><option value="wide">Ancho</option></select></label>
  <label className="field"><span>Borde</span><select value={style.border} onChange={e=>edit({border:e.target.value as SectionStyle['border']})}><option value="original">Original</option><option value="none">Sin borde</option><option value="line">Línea alrededor</option></select></label>
  <label className="field"><span>Redondeado de esquinas: {style.radius} px</span><input type="range" min={0} max={40} step={1} value={style.radius} onChange={e=>edit({radius:Number(e.target.value)})}/></label>
  <button className="add" type="button" onClick={()=>onChange(undefined)}>Restaurar estética original</button>
 </>;
}
