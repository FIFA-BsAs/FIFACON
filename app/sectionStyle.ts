import { z } from 'zod';
import type { CSSProperties } from 'react';
const color=z.string().regex(/^#[0-9a-fA-F]{6}$/);
const palette=z.object({background:color,text:color,accent:color});
export const sectionStyleSchema=z.object({
 skin:z.enum(['original','plain','soft','accent','custom']),
 spacing:z.enum(['original','compact','normal','airy']),
 width:z.enum(['original','narrow','wide']),
 border:z.enum(['original','none','line']),
 radius:z.number().int().min(0).max(40),
 dark:palette,light:palette,
});
export type SectionStyle=z.infer<typeof sectionStyleSchema>;
export const defaultSectionStyle:SectionStyle={skin:'original',spacing:'original',width:'original',border:'original',radius:0,dark:{background:'#35366b',text:'#f4f6fa',accent:'#a3e1df'},light:{background:'#dce8f0',text:'#242e50',accent:'#266e78'}};
export function sectionStyleVariables(style?:SectionStyle):CSSProperties|undefined{
 if(!style)return undefined;
 return {'--section-dark-bg':style.dark.background,'--section-dark-text':style.dark.text,'--section-dark-accent':style.dark.accent,'--section-light-bg':style.light.background,'--section-light-text':style.light.text,'--section-light-accent':style.light.accent,'--section-radius':`${style.radius}px`} as CSSProperties;
}
