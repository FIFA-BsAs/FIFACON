import { renderToString } from 'katex';
import type { ReactNode } from 'react';

// Keep ordinary prices literal. Single-dollar math needs content against both delimiters.
const formulas = /(?<!\\)(?:\\\(([\s\S]*?)(?<!\\)\\\)|\\\[([\s\S]*?)(?<!\\)\\\]|\$\$([\s\S]*?)(?<!\\)\$\$|\$(?![\s$])((?:\\.|[^$\n])+?)(?<![\s\\])\$(?![\d$]))/g;

export function mathText(source?: string): ReactNode {
  if (!source) return source;
  const parts: ReactNode[] = [];
  let end = 0;
  for (const match of source.matchAll(formulas)) {
    const start = match.index!;
    parts.push(source.slice(end, start));
    const displayMode = match[2] !== undefined || match[3] !== undefined;
    const tex = match[1] ?? match[2] ?? match[3] ?? match[4];
    try {
      const markup = renderToString(tex, {
        displayMode, output: 'mathml', trust: false, throwOnError: true,
        maxExpand: 500, maxSize: 10,
      });
      parts.push(<span key={start} className={displayMode ? 'formula-block' : 'formula-inline'}
        dangerouslySetInnerHTML={{ __html: markup }} />);
    } catch {
      parts.push(match[0]);
    }
    end = start + match[0].length;
  }
  if (!parts.length) return source;
  parts.push(source.slice(end));
  return parts;
}
