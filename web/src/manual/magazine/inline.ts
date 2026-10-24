// The magazine's inline markup, read into runs (no DOM): **bold**, *italic* and
// [label](go:target) links. Anything else is plain text.
import type { Go } from './go';

export type Run = { text: string; b?: boolean; i?: boolean; go?: Go };

const TOKEN = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((go:[^)\s]+)\)/g;

/** 'See **Teddy** in [the park](go:play/teddy)' → runs. Bold and italic don't nest links. */
export function runs(text: string): Run[] {
  const out: Run[] = [];
  let at = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > at) out.push({ text: text.slice(at, m.index) });
    if (m[1] !== undefined) out.push({ text: m[1], b: true });
    else if (m[2] !== undefined) out.push({ text: m[2], i: true });
    else out.push({ text: m[3], go: m[4] as Go });
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push({ text: text.slice(at) });
  return out;
}

/** The words a reader sees (the markup taken out). */
export const plain = (text: string): string =>
  runs(text)
    .map((r) => r.text)
    .join('');

/** Every go: link in a piece of inline text. */
export const linksIn = (text: string): Go[] => runs(text).flatMap((r) => (r.go ? [r.go] : []));
