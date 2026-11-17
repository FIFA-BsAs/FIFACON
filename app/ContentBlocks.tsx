import { portraitUrl } from './portraitUrl';
import { mathText } from './mathText';
import type { ContentBlock } from './blocks';

export default function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  const visible = blocks.filter(b => b.visible && (b.kind === 'divider' || (b.kind === 'image' ? b.imageId : b.kind === 'button' ? b.text.trim() && b.url : b.text.trim())));
  if (!visible.length) return null;
  return <div className="content-blocks">{visible.map(block => <div key={block.id} className={`content-block block-${block.kind} block-width-${block.width} block-tone-${block.tone}`} style={{ textAlign: block.align }}>
    {block.kind === 'text' && <p className="preserve">{mathText(block.text)}</p>}
    {block.kind === 'heading' && <h3 className="preserve">{mathText(block.text)}</h3>}
    {block.kind === 'callout' && <aside className="preserve">{mathText(block.text)}</aside>}
    {block.kind === 'button' && <a className={`button ${block.tone === 'accent' ? 'pale' : 'block-button-outline'}`} href={block.url} target={block.newTab ? '_blank' : undefined} rel={block.newTab ? 'noopener noreferrer' : undefined}>{mathText(block.text)} <span aria-hidden="true">↗</span></a>}
    {block.kind === 'image' && <figure style={{width:`${block.imageWidth||100}%`,marginInline:block.align==='center'?'auto':block.align==='right'?'auto 0':'0 auto'}}><img style={{height:block.imageHeight||'auto',objectFit:block.imageFit||'contain',objectPosition:`50% ${block.imagePosition??50}%`}} src={portraitUrl(block.imageId)} alt={block.alt} loading="lazy"/>{block.caption && <figcaption>{mathText(block.caption)}</figcaption>}</figure>}
    {block.kind === 'divider' && <hr/>}
  </div>)}</div>;
}
