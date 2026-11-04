// A small Markdown reader for a kit's README, for the box's instruction books (phoneBook.ts): headings, paragraphs, bullet and numbered
// lists (with their wrapped lines), pipe tables, fenced code, and inline `code`, **bold**, *italic* and [links] (a book can't click, so
// a link keeps its words only). `readMarkdown` gives a plain tree (so it tests without a page); `element` builds a block as DOM with
// text nodes, never innerHTML. Not general Markdown: nested lists, images and HTML are not read.
import { h } from '../../editor/core/ui';

export type Inline = string | { tag: 'code' | 'strong' | 'em'; kids: Inline[] };
export type Block =
  | { tag: 'p'; kids: Inline[] }
  | { tag: 'pre'; text: string }
  /** `start`: the number an ordered list's first item carries in the Markdown, when it isn't 1 (a list a table split in two). */
  | { tag: 'ul' | 'ol'; items: Inline[][]; start?: number }
  | { tag: 'table'; head: Inline[][]; rows: Inline[][][] };

/** Inline marks inside one line of text: code, bold, italic, links (kept as their words). */
function inline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /`([^`]+)`|\*\*([^*]+)\*\*|(?<![\w*])\*([^\s*][^*]*?)\*(?![\w*])|\[([^\]]+)\]\(([^)]*)\)/g;
  let at = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > at) out.push(text.slice(at, m.index));
    if (m[1] !== undefined) out.push({ tag: 'code', kids: [m[1]] });
    else if (m[2] !== undefined) out.push({ tag: 'strong', kids: inline(m[2]) });
    else if (m[3] !== undefined) out.push({ tag: 'em', kids: inline(m[3]) });
    else out.push(...inline(m[4]));
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

const cells = (line: string): string[] =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, '|'));

const isRule = (line: string) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);
const bullet = /^(\s*)([-*]|\d+\.)\s+(.*)$/;

interface Section {
  /** The heading's text ('' for what comes before the first heading). */
  title: string;
  level: number;
  blocks: Block[];
}

/**
 * The document as sections, one for each heading (with the blocks under it). `columns` keeps only the named columns of
 * every table (by header text), for a table too wide for a page.
 */
export function readMarkdown(source: string, columns?: string[]): Section[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const sections: Section[] = [{ title: '', level: 0, blocks: [] }];
  const add = (b: Block) => sections[sections.length - 1].blocks.push(b);
  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    const heading = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (!line.trim()) i++;
    else if (/^```/.test(line)) {
      const body: string[] = [];
      for (i++; i < lines.length && !/^```/.test(lines[i]); i++) body.push(lines[i]);
      i++;
      add({ tag: 'pre', text: body.join('\n') });
    } else if (heading) {
      sections.push({ title: heading[2].replace(/`/g, ''), level: heading[1].length, blocks: [] });
      i++;
    } else if (line.trim().startsWith('|') && i + 1 < lines.length && isRule(lines[i + 1])) {
      const head = cells(line);
      const keep = columns ? head.map((c, k) => (columns.includes(c) ? k : -1)).filter((k) => k >= 0) : head.map((_, k) => k);
      const rows: string[][] = [];
      for (i += 2; i < lines.length && lines[i].trim().startsWith('|'); i++) rows.push(cells(lines[i]));
      add({ tag: 'table', head: keep.map((k) => inline(head[k])), rows: rows.map((r) => keep.map((k) => inline(r[k] ?? ''))) });
    } else if (bullet.test(line)) {
      const ordered = /\d/.test(bullet.exec(line)![2]);
      const items: string[] = [];
      for (; i < lines.length && lines[i].trim(); i++) {
        const m = bullet.exec(lines[i]);
        if (m && /\d/.test(m[2]) === ordered) items.push(m[3]);
        else if (!m || /^\s+\S/.test(lines[i])) items[items.length - 1] += ` ${lines[i].trim()}`;
        else break;
      }
      const first = ordered ? Number(/\d+/.exec(bullet.exec(line)![2])![0]) : 1;
      add({ tag: ordered ? 'ol' : 'ul', items: items.map(inline), ...(first > 1 ? { start: first } : {}) });
    } else {
      const text: string[] = [];
      for (; i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|\s*\|)/.test(lines[i]) && !bullet.test(lines[i]); i++) text.push(lines[i].trim());
      add({ tag: 'p', kids: inline(text.join(' ')) });
    }
  }
  return sections;
}

const nodes = (kids: Inline[]): Node[] => kids.map((k) => (typeof k === 'string' ? document.createTextNode(k) : h(k.tag, null, ...nodes(k.kids))));

/** One block as an element. */
export function element(b: Block): HTMLElement {
  if (b.tag === 'p') return h('p', null, ...nodes(b.kids));
  if (b.tag === 'pre') return h('pre', null, h('code', null, b.text));
  if (b.tag === 'table')
    return h(
      'table',
      null,
      h('thead', null, h('tr', null, ...b.head.map((c) => h('th', null, ...nodes(c))))),
      h('tbody', null, ...b.rows.map((r) => h('tr', null, ...r.map((c) => h('td', null, ...nodes(c)))))),
    );
  return h(b.tag, b.start ? { start: String(b.start) } : null, ...b.items.map((it) => h('li', null, ...nodes(it))));
}

/** The words of a block, for a test or a filter. */
export function blockText(b: Block): string {
  const flat = (k: Inline[]): string => k.map((x) => (typeof x === 'string' ? x : flat(x.kids))).join('');
  if (b.tag === 'p') return flat(b.kids);
  if (b.tag === 'pre') return b.text;
  if (b.tag === 'table') return [...b.head, ...b.rows.flat()].map(flat).join(' ');
  return b.items.map(flat).join(' ');
}
