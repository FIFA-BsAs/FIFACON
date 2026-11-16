import { database, readContent, canEdit } from '../../store';
export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){
 try {const row=await database().prepare('SELECT body, version, updated_at FROM site_content WHERE id = ?').bind('pages-publication').first<{body:string;version:number;updated_at:string}>();
 return row?json({content:JSON.parse(row.body),version:row.version,preparedAt:row.updated_at}):json({error:'Primero prepará una publicación desde el editor.'},404);
 }catch{return json({error:'No se pudo leer la publicación.'},503);}
}
export async function POST(request:Request){
 if(!await canEdit())return json({error:'Necesitás una cuenta editora.'},403);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Origen inválido.'},403);
 let input;try{const text=await request.text();if(text.length>1000)return json({error:'Solicitud demasiado grande.'},413);input=JSON.parse(text);}catch{return json({error:'Solicitud inválida.'},400);}
 if(!Number.isInteger(input?.version))return json({error:'Versión inválida.'},400);
 try {
 // Atomic conditional copy: never publish a concurrent, unseen edit.
 const now=new Date().toISOString();
 const result=await database().prepare("INSERT INTO site_content (id,body,version,updated_at,updated_by) SELECT 'pages-publication',body,version,?,updated_by FROM site_content WHERE id='main' AND version=? ON CONFLICT(id) DO UPDATE SET body=excluded.body,version=excluded.version,updated_at=excluded.updated_at,updated_by=excluded.updated_by").bind(now,input.version).run();
 if(result.meta.changes!==1)return json({error:'Guardá los cambios y cargá la última versión antes de prepararla.'},409);
 return json({version:input.version,preparedAt:now});
 }catch{return json({error:'No pudimos preparar la publicación. Intentá nuevamente.'},503);}
}
