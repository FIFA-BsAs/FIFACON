import { env } from 'cloudflare:workers';
import { getChatGPTUser } from './chatgpt-auth';
import { initialContent, contentSchema, type Content } from './content';
export function database(){if(!env.DB)throw new Error('Base de datos no disponible');return env.DB;}
export async function canEdit():Promise<boolean> {
 const user = await getChatGPTUser();
 const email = user?.email?.trim().toLowerCase();
 if (!email) return false;
 const originalEditors = (env.EDITOR_EMAILS || '').split(',').map(value => value.trim().toLowerCase());
 if (originalEditors.includes(email)) return true;
 const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email));
 const key = 'EDITOR_GRANT_' + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2,'0')).join('');
 return (env as unknown as Record<string, unknown>)[key] === '1';
}
export async function readContent():Promise<{content:Content;version:number}>{
 const row=await database().prepare('SELECT body, version FROM site_content WHERE id = ?').bind('main').first<{body:string;version:number}>();
 return row?{content:contentSchema.parse(JSON.parse(row.body)),version:row.version}:{content:initialContent,version:0};
}
