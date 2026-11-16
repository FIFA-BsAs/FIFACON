'use client';
import { portraitUrl } from './portraitUrl';
import type { Content } from './content';
export type Speaker = Content['speakers'][number];

export function SpeakerPortrait({speaker}:{speaker:Speaker}) {
  const {photo} = speaker;
  if (!photo) return null;
  return <img className="speaker-photo" src={portraitUrl(photo.id)} alt={photo.alt}
    style={{objectPosition:photo.x+'% '+photo.y+'%', transform:'scale('+photo.zoom+')', transformOrigin:photo.x+'% '+photo.y+'%'}} />;
}

export async function uploadPortrait(file:File): Promise<string> {
  if (file.size > 20 * 1024 * 1024) throw new Error('Elegí una imagen de hasta 20 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try { await image.decode(); } catch { throw new Error('No se pudo leer la foto. Probá con JPG, PNG o WebP.'); }
    const scale = Math.min(1, 1400 / Math.max(image.naturalWidth,image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1,Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1,Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo preparar la imagen.');
    ctx.fillStyle='#edf1f2';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(image,0,0,canvas.width,canvas.height);
    const blob = await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',.85));
    if (!blob) throw new Error('No se pudo preparar la foto.');
    const response = await fetch('/api/portraits',{method:'POST',headers:{'Content-Type':'image/jpeg'},body:blob});
    const result = await response.json() as {id?:string; error?:string};
    if (!response.ok || !result.id) throw new Error(result.error || 'No se pudo subir la foto.');
    return result.id;
  } finally { URL.revokeObjectURL(url); }
}
