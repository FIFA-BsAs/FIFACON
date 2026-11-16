import {mkdir,writeFile,copyFile,rm} from 'node:fs/promises';
const origin='https://fifacon.electatoll.chatgpt.site';
const response=await fetch(origin+'/api/publication',{redirect:'error'});
if(!response.ok)throw new Error('Primero prepará la publicación desde el editor de FIFACON. HTTP '+response.status);
const record=await response.json();
if(!record.content||!Number.isInteger(record.version))throw new Error('Publicación inválida');
const output=new URL('../static-site/generated/',import.meta.url);
await rm(output,{recursive:true,force:true});await mkdir(new URL('portraits/',output),{recursive:true});
const ids=new Set();
for(const speaker of record.content.speakers||[])if(speaker.photo)ids.add(speaker.photo.id);
for(const section of record.content.pageSections||[])for(const block of section.blocks||[])if(block.imageId)ids.add(block.imageId);
for(const id of ids){
 if(!/^[a-f0-9]{64}$/.test(id))throw new Error('Imagen inválida');
 const r=await fetch(origin+'/api/portraits?id='+id,{redirect:'error'});
 if(!r.ok||!r.headers.get('content-type')?.startsWith('image/jpeg'))throw new Error('Falta una imagen: '+id);
 const bytes=new Uint8Array(await r.arrayBuffer());if(bytes.length>2097152)throw new Error('Imagen demasiado grande');
 await writeFile(new URL('portraits/'+id+'.jpg',output),bytes);
}
await writeFile(new URL('content.json',output),JSON.stringify(record));
await copyFile(new URL('../public/favicon.svg',import.meta.url),new URL('favicon.svg',output));
await writeFile(new URL('.nojekyll',output),'');
console.log('Publicación preparada:',record.version,'Imágenes:',ids.size);
