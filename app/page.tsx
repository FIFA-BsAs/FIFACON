import Conference from './Conference';
import { readContent, canEdit } from './store';
export const dynamic = 'force-dynamic';
export const metadata={title:'FIFACON · Editor privado'};
export default async function Page() {
 if(!await canEdit())return <main className="shell section"><h1>FIFACON · Editor privado</h1><p>Ingresá con una cuenta autorizada para editar y preparar publicaciones.</p><a className="button pale" href="/signin-with-chatgpt?return_to=%2F">Ingresar con ChatGPT ↗</a></main>;
 const record=await readContent();
 return <Conference initial={record.content} initialVersion={record.version} canEdit={true} />;
}
