import katex from 'katex';
import { memo, useMemo } from 'react';

type Segment = { type: 'text'; value: string } | { type: 'math'; value: string; display: boolean };

/** Split text on $...$ (inline) and $$...$$ (display); "\$" is a literal dollar sign. */
export function parseMath(input: string): Segment[] {
  const out: Segment[] = [];
  let buf = '';
  let i = 0;
  while (i < input.length) {
    if (input[i] === '\\' && input[i + 1] === '$') {
      buf += '$';
      i += 2;
      continue;
    }
    if (input[i] === '$') {
      const display = input[i + 1] === '$';
      const delim = display ? '$$' : '$';
      const end = input.indexOf(delim, i + delim.length);
      if (end === -1) {
        buf += input.slice(i);
        break;
      }
      if (buf) out.push({ type: 'text', value: buf });
      buf = '';
      out.push({ type: 'math', value: input.slice(i + delim.length, end), display });
      i = end + delim.length;
      continue;
    }
    buf += input[i++];
  }
  if (buf) out.push({ type: 'text', value: buf });
  return out;
}

function renderTex(tex: string, display: boolean): string {
  return katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'htmlAndMathml' });
}

/** `roomy` renders inline math in display style so fractions in worked steps stay legible. */
export const MathText = memo(function MathText({ text, className, roomy }: { text: string; className?: string; roomy?: boolean }) {
  const parts = useMemo(() => parseMath(text), [text]);
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.type === 'text' ? (
          <span key={i}>{p.value}</span>
        ) : (
          <span key={i} className={p.display ? 'math-display' : 'math-inline'} dangerouslySetInnerHTML={{ __html: renderTex(roomy && !p.display ? `\\displaystyle ${p.value}` : p.value, p.display) }} />
        ),
      )}
    </span>
  );
});

/** Render a raw TeX string (no $ delimiters). */
export function Tex({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = useMemo(() => renderTex(tex, display), [tex, display]);
  return <span className={display ? 'math-display' : 'math-inline'} dangerouslySetInnerHTML={{ __html: html }} />;
}
