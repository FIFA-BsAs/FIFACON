import React from 'react';
import {createRoot} from 'react-dom/client';
import Conference from '../app/Conference';
import {contentSchema} from '../app/content';
import '../app/globals.css';
import 'katex/dist/katex.min.css';
(globalThis as typeof globalThis & {FIFACON_STATIC?:boolean}).FIFACON_STATIC=true;
fetch('./content.json').then(r=>{if(!r.ok)throw new Error();return r.json() as Promise<{content:unknown;version:number}>}).then(record=>{
 const content=contentSchema.parse(record.content);
 document.title=content.copy.tabTitle;
 const description=document.createElement('meta');description.name='description';description.content=content.copy.siteDescription;document.head.appendChild(description);
 createRoot(document.getElementById('root')!).render(<Conference initial={content} initialVersion={record.version} canEdit={false} staticMode/>);
}).catch(()=>{document.getElementById('root')!.textContent='No se pudo cargar la página. Probá recargar.'});
