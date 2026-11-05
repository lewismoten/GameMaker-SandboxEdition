// "Technical Reference and Limits", a 1994 booklet in the Game-Maker box (gmItems.ts): how big a Game-Maker game can be, and why, in the
// voice of the boxed product (no source lines, no bugs). Its words are programmersGuide/booklet1994.md, read as Markdown
// (markdownBlocks.ts) and flowed onto the manual's own booklet pages (paginate.ts). The numbers are the Programmer's Guide's appendix.
import '../printables/paper.css';
import { h } from '../../editor/core/ui';
import { bookletPageCount } from './imposition';
import { measurer, type BookPage } from './manualPages';
import { paginate } from './paginate';
import { element, readMarkdown, type Block } from './markdownBlocks';
import type { BoxItem } from './viewer';
import { sheet } from './kit';

export const TECHREF_TITLE = 'Technical Reference and Limits';

/** The cover: the product's name, the booklet's, and its byline. */
export function techRefCover(): HTMLElement {
  return h(
    'div',
    {
      class: 'game-cover',
      style:
        'background:#14304a;color:#fff;display:flex;flex-direction:column;justify-content:center;gap:.6em;padding:12%;text-align:center;font-family:Georgia,serif',
    },
    h('div', { style: 'font-size:.85em;letter-spacing:.2em' }, 'GAME-MAKER 3.0'),
    h('div', { style: 'font-size:1.9em;font-weight:700;line-height:1.1' }, 'Technical Reference and Limits'),
    h('div', { style: 'font-size:.95em;opacity:.85' }, 'How big a game can be, and why'),
    h('div', { style: 'font-size:.8em;margin-top:2em;opacity:.8' }, 'Notes by technical staff', h('br'), '1994'),
  );
}

/** The booklet's chapters from its Markdown: the first-level and second-level headings are the cover's, and the rules between chapters are not text. */
export function techRefChapters(markdown: string): { head: string; blocks: Block[] }[] {
  return readMarkdown(markdown)
    .filter((s) => s.level >= 3)
    .map((s) => ({
      head: s.title.replace(/^\d+\.\s*/, ''),
      blocks: s.blocks.filter((b) => !(b.tag === 'p' && b.kids.length === 1 && b.kids[0] === '---')),
    }))
    .filter((c) => c.blocks.length);
}

/** The booklet as pages: a cover, the chapters, notes pages to fill the last sheet, a back cover. */
export async function techRefPages(): Promise<BookPage[]> {
  const markdown = (await import('../../programmersGuide/booklet1994.md?raw')).default;
  const host = h('div', { class: 'gmb-measure gmb-pages', 'aria-hidden': 'true' });
  document.body.append(host);
  try {
    const next = measurer(host);
    const pages: BookPage[] = [{ kind: 'cover', body: [techRefCover()] }];
    for (const c of techRefChapters(markdown))
      for (const body of paginate([h('h2', null, c.head), ...c.blocks.map(element)], next))
        pages.push({ kind: 'text', head: ['GAME-MAKER 3.0', TECHREF_TITLE], body });
    const pads = bookletPageCount(pages.length + 1) - pages.length - 1;
    for (let i = 0; i < pads; i++)
      pages.push({ kind: 'notes', head: ['GAME-MAKER 3.0', 'Notes'], body: [h('h2', null, 'Notes'), h('div', { class: 'mp-ruled' })] });
    pages.push({ kind: 'back', body: [h('div', { class: 'game-cover', style: 'background:#14304a' })] });
    return pages;
  } finally {
    host.remove();
  }
}

/** The booklet as a piece in the Game-Maker box. */
export function techRefItem(): BoxItem {
  return {
    id: 'techref',
    title: TECHREF_TITLE,
    note: 'Limits and file sizes, stapled',
    icon: '📗',
    pages: techRefPages,
    render: async () => [sheet(5.5, 8.5, 'techref-thumb', techRefCover())],
  };
}
