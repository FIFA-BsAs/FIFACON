export function portraitUrl(id:string){
 const base=(globalThis as typeof globalThis & {FIFACON_STATIC?:boolean}).FIFACON_STATIC;
 return base ? `./portraits/${id}.jpg` : `/api/portraits?id=${id}`;
}
