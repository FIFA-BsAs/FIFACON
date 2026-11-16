import { env } from 'cloudflare:workers';
import { canEdit } from '../../store';

export const dynamic = 'force-dynamic';
const maxBytes = 2 * 1024 * 1024;
const keyPattern = /^[a-f0-9]{64}$/;
const fail = (error:string, status:number) => Response.json({error}, {status});

export async function POST(request:Request) {
  if (!await canEdit()) return fail('Necesitás una cuenta editora.', 403);
  if (request.headers.get('origin') !== new URL(request.url).origin) return fail('Origen inválido.', 403);
  if (request.headers.get('content-type') !== 'image/jpeg') return fail('Formato de imagen inválido.', 415);
  if (!env.BUCKET) return fail('El almacenamiento de fotos no está disponible.', 503);
  if (Number(request.headers.get('content-length')) > maxBytes) return fail('La foto es demasiado grande.', 413);
  const reader = request.body?.getReader();
  if (!reader) return fail('Falta la foto.', 400);
  const chunks:Uint8Array[] = [];
  let size = 0;
  while (true) {
    const {value,done} = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxBytes) { await reader.cancel(); return fail('La foto es demasiado grande.', 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
  if (size < 4 || bytes[0] !== 255 || bytes[1] !== 216 || bytes[size-2] !== 255 || bytes[size-1] !== 217)
    return fail('La foto está dañada.', 400);
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const id = Array.from(hash, n=>n.toString(16).padStart(2,'0')).join('');
  await env.BUCKET.put('portraits/' + id, bytes, {httpMetadata:{contentType:'image/jpeg'}});
  return Response.json({id}, {status:201});
}

export async function GET(request:Request) {
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!keyPattern.test(id)) return new Response(null, {status:404});
  if (!env.BUCKET) return new Response(null, {status:503});
  const object = await env.BUCKET.get('portraits/' + id);
  if (!object) return new Response(null, {status:404});
  return new Response(object.body, {headers:{'Content-Type':'image/jpeg','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=31536000, immutable'}});
}
