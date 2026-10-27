// Text screens: PLAYGAME shows .TXT pages 31 characters wide and 16 lines a page (MORE...
// between pages). Lines are wrapped to 30: a line of exactly 31 leaves its line break for the
// next read, which shows as an extra blank line.
import type { Story } from '../stories';

const COLS = 30;
export const PAGE = 16;

/** Wraps paragraphs to `width` columns; lines starting with spaces keep their indent; THE CHEZ stays on one line. */
export function wrap(text: string, width = COLS): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    if (para.trim() === '') {
      out.push('');
      continue;
    }
    const indent = /^ */.exec(para)![0];
    let line = '';
    for (const glued of para
      .trim()
      .replace(/\b(THE|The) (CHEZ|Chez)\b/g, '$1\u00a0$2')
      .split(/[^\S\u00a0]+/)) {
      const word = glued.replace(/\u00a0/g, ' ');
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

/** Flows lines onto 16-line pages; a page never starts with a blank line. */
function flow(lines: string[]): string[][] {
  const pages: string[][] = [[]];
  for (const l of lines) {
    let cur = pages[pages.length - 1];
    if (cur.length === PAGE) pages.push((cur = []));
    if (!l && cur.length === 0) continue;
    cur.push(l);
  }
  return pages;
}

/** The heading every story page 1 opens with. */
function storyHeading(s: Story): string[] {
  return [...wrap(s.title.toUpperCase()), 'by Lewis Moten', ...wrap(`${s.date}, ${s.week}`), ...wrap(`Topic: ${s.topic}`), ''];
}

/**
 * A story as text pages: its heading and every word of it, on two or three pages. When the
 * blank lines between verses would push it onto a fourth page, blank lines are taken out
 * (never words) from the longest run of short verse lines first, until it fits.
 */
export function storyPages(s: Story, max = 3): string[][] {
  const head = storyHeading(s);
  const body = wrap(s.text);
  let pages = flow([...head, ...body]);
  const blanks = body.map((l, i) => (l === '' ? i : -1)).filter((i) => i >= 0);
  while (pages.length > max && blanks.length) {
    body.splice(blanks.pop()!, 1);
    pages = flow([...head, ...body]);
  }
  if (pages.length > max) throw new Error(`${s.title} needs ${pages.length} pages`);
  const words = (t: string) => t.split(/\s+/).filter(Boolean).join(' ');
  if (words(pages.flat().join(' ')) !== words([...head, s.text].join(' '))) throw new Error(`${s.title}: words lost in paging`);
  return pages;
}

/** Pages as one .TXT file's text: 16 lines a page. */
export function joinPages(pages: string[][]): string {
  const lines: string[] = [];
  for (const p of pages) {
    if (p.length > PAGE) throw new Error('Page too long');
    lines.push(...p);
    while (lines.length % PAGE) lines.push('');
  }
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines.join('\n') + '\n';
}
