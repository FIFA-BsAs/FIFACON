import {env} from 'cloudflare:workers';
import {canEdit} from '../../store';
export const dynamic='force-dynamic';
const limit=10*1024*1024;
const fail=(error:string,status:number)=>Response.json({error},{status});
export async function POST(request:Request){
 if(!await canEdit())return fail('Necesitás una cuenta editora.',403);
 if(request.headers.get('origin')!==new URL(request.url).origin)return fail('Origen inválido.',403);
 if(!env.BUCKET)return fail('Almacenamiento no disponible.',503);
 if(Number(request.headers.get('content-length'))>limit)return fail('El máximo es 10 MB.',413);
 const reader=request.body?.getReader();if(!reader)return fail('Falta el archivo.',400);
 const chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();return fail('El máximo es 10 MB.',413);}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 const prefix=new TextDecoder().decode(bytes.slice(0,12));
 const ext=prefix.startsWith('%PDF-')?'pdf':bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'jpg':bytes.slice(0,8).join(',')==='137,80,78,71,13,10,26,10'?'png':prefix.startsWith('RIFF')&&prefix.slice(8,12)==='WEBP'?'webp':null;
 if(!ext)return fail('Elegí un PDF, JPG, PNG o WebP válido.',415);
 const mime={pdf:'application/pdf',jpg:'image/jpeg',png:'image/png',webp:'image/webp'}[ext];
 const id=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
 await env.BUCKET.put(`flyers/${id}.${ext}`,bytes,{httpMetadata:{contentType:mime}});
 return Response.json({id,ext},{status:201});
}
export async function GET(request:Request){
 const file=new URL(request.url).searchParams.get('file')||'';
 if(!/^[a-f0-9]{64}\.(pdf|jpg|png|webp)$/.test(file))return new Response(null,{status:404});
 if(!env.BUCKET)return new Response(null,{status:503});
 const object=await env.BUCKET.get('flyers/'+file);if(!object)return new Response(null,{status:404});
 return new Response(object.body,{headers:{'Content-Type':object.httpMetadata?.contentType||'application/octet-stream','Content-Disposition':'inline','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=31536000, immutable'}});
}
