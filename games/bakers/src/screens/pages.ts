// Text screens: PLAYGAME shows .TXT pages 31 characters wide and 16 lines a page (MORE...
// between pages). Lines are wrapped to 30: a line of exactly 31 leaves its line break for the
// next read, which shows as an extra blank line.
export const COLS = 30;
export const PAGE = 16;

/** Wraps paragraphs to `width` columns; lines starting with spaces keep their indent. */
export function wrap(text: string, width = COLS): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    if (para.trim() === '') {
      out.push('');
      continue;
    }
    const indent = /^ */.exec(para)![0];
    let line = '';
    for (const word of para.trim().split(/\s+/)) {
      const next = line ? `${line} ${word}` : `${indent}${word}`;
      if (next.length > width && line) {
        out.push(line);
        line = `${indent}${word}`;
      } else line = next;
    }
    out.push(line);
  }
  for (const l of out) if (l.length > width) throw new Error(`Line too long: "${l}"`);
  return out;
}

/** Hand-made pages: each part is one page of at most 16 lines. */
export function page(parts: string[]): string {
  const lines: string[] = [];
  for (const part of parts) {
    const p = wrap(part);
    if (p.length > PAGE) throw new Error(`Page too long:\n${p.join('\n')}`);
    while (lines.length % PAGE) lines.push('');
    lines.push(...p);
  }
  return lines.join('\n') + '\n';
}
