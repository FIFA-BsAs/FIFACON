import type { Content } from './content';
import { blockLabels } from './blocks';
import { copyKeys, copyFields, type CopyKey } from './pageCopy';
import type { SectionKind } from './sections';

export type EditorNode = {id:string;label:string;description?:string;hidden?:boolean;children?:EditorNode[]};
export const sectionCopy: Record<SectionKind,CopyKey[]> = {
 portada:['soon','heroButton','explore'],datos:['when','where','mode'],
 encuentro:['aboutLabel','studentsA','studentsB'],
 programa:['agendaLabel'],expositores:['speakersLabel','speakersTitle','speakerMark'],
 participar:['joinLabel','pending'],informacion:['infoLabel','infoTitle','map','contact','noEmail','faq'],custom:[],
};
export const appearanceCopy:CopyKey[]=['on','off','pause','resume'];
export const sharedCopy:CopyKey[]=['tabTitle','siteDescription','suffix','menu','login','back','flyer','heroFoot','customMark','customTitle','customLink'];
export const scopeCopy=copyKeys.filter(key=>copyFields[key][0]==='Osciloscopio · display');
export const activityCopy=copyKeys.filter(key=>copyFields[key][0]==='Cronograma · actividades');
export function editorTree(data:Content):EditorNode {
 return {id:'page',label:'Página completa',description:'Organizá el sitio desde lo general hasta cada elemento.',children:[
  {id:'general',label:'Configuración general',description:'Cambios compartidos por toda la página.',children:[
   {id:'general/identity',label:'Identidad y datos del encuentro',description:'Nombre, lema, fecha y ubicación usados en varias secciones.'},
   {id:'general/typography',label:'Tipografía',description:'Fuentes de títulos, textos y etiquetas de toda la página.'},
   {id:'general/appearance',label:'Tema y animación',description:'Botón claro/oscuro y partículas de la página.'},
   {id:'general/copy',label:'Encabezado, pie y textos generales',description:'Navegación, pestaña del navegador y textos compartidos.'},
  ]},
  {id:'sections',label:'Secciones de la página',description:'Creá secciones y organizá el orden en que se ven.',children:data.pageSections.map(section=>{
   const prefix=`section/${section.id}`;
   const children:EditorNode[]=[{id:`${prefix}/style`,label:'Estética',description:'Fondo, colores, espaciado, ancho y bordes de esta sección.'},{id:`${prefix}/settings`,label:'Visibilidad, orden y menú',description:'Controlá dónde aparece esta sección.'},{id:`${prefix}/content`,label:'Contenido y textos',description:'Editá el contenido propio de esta sección.'}];
   if(section.kind==='programa'){
    children.push({id:`${prefix}/scope`,label:'Osciloscopio',description:'Textos del marco y del display.'});
    children.push({id:`${prefix}/activity-copy`,label:'Etiquetas del programa',description:'Botones, contadores y mensajes del cronograma.'});
    children.push({id:`${prefix}/days`,label:'Jornadas y actividades',description:'Elegí una jornada para organizar sus actividades.',children:data.days.map((day,i)=>({id:`${prefix}/day/${i}`,label:day.label||`Jornada ${i+1}`,children:day.sessions.map((session,j)=>({id:`${prefix}/session/${i}/${j}`,label:session.title||`Actividad ${j+1}`}))}))});
   }
   if(section.kind==='expositores')children.push({id:`${prefix}/speakers`,label:'Expositores',description:'Cada persona tiene su ficha, foto y charla.',children:data.speakers.map((speaker,i)=>({id:`${prefix}/speaker/${i}`,label:speaker.name||`Expositor/a ${i+1}`}))});
   if(section.kind==='informacion')children.push({id:`${prefix}/faqs`,label:'Preguntas frecuentes',description:'Editá cada pregunta y su respuesta.',children:data.faqs.map((faq,i)=>({id:`${prefix}/faq/${i}`,label:faq.question||`Pregunta ${i+1}`}))});
   children.push({id:`${prefix}/blocks`,label:'Bloques adicionales',description:'Agregá texto, botones, imágenes y otros elementos.',children:(section.blocks||[]).map((block,i)=>({id:`${prefix}/block/${block.id}`,label:`${i+1}. ${blockLabels[block.kind]}${block.text?` · ${block.text.slice(0,38)}`:''}`,hidden:!block.visible}))});
   return {id:prefix,label:section.title||'Nueva sección',hidden:!section.visible,description:section.visible?'Esta sección es visible en la página.':'Esta sección está oculta; podés editarla y volver a mostrarla.',children};
  })},
 ]};
}
export function nodePath(root:EditorNode,id:string):EditorNode[]{
 if(root.id===id)return [root];
 for(const child of root.children||[]){const path=nodePath(child,id);if(path.length)return [root,...path];}
 return [];
}
export function resolveEditorPath(root:EditorNode,id:string):EditorNode[]{
 let path=nodePath(root,id);
 while(!path.length&&id.includes('/')){id=id.slice(0,id.lastIndexOf('/'));path=nodePath(root,id);}
 return path.length?path:[root];
}
