import { z } from 'zod';

export const blockKinds = ['text', 'heading', 'button', 'image', 'callout', 'divider'] as const;
export const blockLabels: Record<typeof blockKinds[number], string> = {
  text: 'Texto', heading: 'Título', button: 'Botón', image: 'Imagen', callout: 'Aviso destacado', divider: 'Separador',
};
export const blockSchema = z.object({
  id: z.string().max(60).regex(/^block-[a-z0-9-]+$/),
  kind: z.enum(blockKinds), visible: z.boolean(),
  text: z.string().max(5000),
  url: z.string().max(2000).refine(value => !value || /^https:\/\//i.test(value) && (() => { try { return new URL(value).protocol === 'https:'; } catch { return false; } })(), 'Usá un enlace https:// válido'),
  imageId: z.union([z.literal(''), z.string().regex(/^[a-f0-9]{64}$/)]),
  alt: z.string().max(250), caption: z.string().max(500),
  align: z.enum(['left', 'center', 'right']),
  width: z.enum(['full', 'half']),
  tone: z.enum(['plain', 'accent']),
  newTab: z.boolean(),
});
export const blocksSchema = z.array(blockSchema).max(40).superRefine((blocks, ctx) => {
  if (new Set(blocks.map(block => block.id)).size !== blocks.length)
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Hay bloques duplicados.' });
});
export type ContentBlock = z.infer<typeof blockSchema>;
export function newBlock(kind: ContentBlock['kind']): ContentBlock {
  return { id: `block-${crypto.randomUUID()}`, kind, visible: true, text: '', url: '', imageId: '', alt: '', caption: '', align: 'left', width: 'full', tone: kind === 'callout' ? 'accent' : 'plain', newTab: true };
}
