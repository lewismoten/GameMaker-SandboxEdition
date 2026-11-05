// A chapter's Markdown as page elements (the reader of manual/printables/markdownBlocks.ts, made into DOM): headings with anchors, wide
// tables in a box that scrolls on its own, source citations as links to the file on GitHub (citations.ts), and the book's marks
// ([inference], [estimate], [not yet checked in DOSBox] and the cause tags) as small labels.
import { h } from '../editor/core/ui';
import { element, readMarkdown } from '../manual/printables/markdownBlocks';
import { citationHref } from './citations';

const MARKS: Record<string, [string, string]> = {
  'not yet checked in DOSBox': ['pg-verify', 'not yet checked in DOSBox'],
  inference: ['pg-inference', 'inference'],
  estimate: ['pg-estimate', 'estimate'],
};
const TAGS = new Set(['16-bit', '64K', 'VGA', 'PIT', 'file', 'DOS', 'design']);
const MARK_RE = /\[([^\]\n]{2,30})\]/g;

/** A text node with its bracketed marks as labels (and the node itself when it holds none). */
function marked(text: string): Node[] {
  const out: Node[] = [];
  let at = 0;
  for (const m of text.matchAll(MARK_RE)) {
    const mark = MARKS[m[1]];
    const tag = TAGS.has(m[1]);
    if (!mark && !tag) continue;
    if (m.index > at) out.push(document.createTextNode(text.slice(at, m.index)));
    out.push(
      h(
        'span',
        {
          class: mark ? `pg-mark ${mark[0]}` : 'pg-mark pg-tag',
          ...(mark?.[0] === 'pg-inference' ? { title: 'A reading of the source: the reason is a guess' } : {}),
        },
        mark ? mark[1] : m[1],
      ),
    );
    at = m.index + m[0].length;
  }
  if (!out.length) return [document.createTextNode(text)];
  if (at < text.length) out.push(document.createTextNode(text.slice(at)));
  return out;
}

/** Labels for the marks, links for the citations, inside one block. */
function decorate(block: HTMLElement): HTMLElement {
  for (const code of Array.from(block.querySelectorAll('code'))) {
    const href = citationHref(code.textContent ?? '');
    if (href) code.replaceWith(h('a', { href, target: '_blank', rel: 'noopener', class: 'pg-cite' }, code.cloneNode(true)));
  }
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (!n.parentElement?.closest('code, pre')) texts.push(n as Text);
  for (const t of texts) if (t.data.includes('[')) t.replaceWith(...marked(t.data));
  for (const pre of Array.from(block.querySelectorAll('pre'))) pre.tabIndex = 0;
  if (block.tagName === 'PRE') block.tabIndex = 0;
  return block;
}

const HEADS = ['h2', 'h3', 'h4', 'h5'] as const;

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** The chapter's blocks, without its first-level heading (the page draws the title itself). `scope` keeps heading ids apart on a page of several chapters. */
export function chapterElements(markdown: string, scope: string, offset = 0): HTMLElement[] {
  const out: HTMLElement[] = [];
  const seen = new Set<string>();
  for (const s of readMarkdown(markdown)) {
    if (s.title && s.level > 1) {
      let id = `${scope}-${slug(s.title)}`;
      for (let n = 2; seen.has(id); n++) id = `${scope}-${slug(s.title)}-${n}`;
      seen.add(id);
      out.push(h(HEADS[Math.min(s.level + offset, 5) - 2], { id }, s.title));
    }
    for (const b of s.blocks) {
      const el = decorate(element(b));
      out.push(el.tagName === 'TABLE' ? h('div', { class: 'pg-scroll', tabindex: '0', role: 'group', 'aria-label': 'Table (scrolls sideways)' }, el) : el);
    }
  }
  return out;
}
