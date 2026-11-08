// "Technical Reference and Limits", a 1994 booklet in the Game-Maker box (gmItems.ts): how big a Game-Maker game can be, and why, in the
// voice of the boxed product (no source lines, no bugs). Its words are programmersGuide/booklet1994.md, read as Markdown
// (markdownBlocks.ts), with its diagrams drawn by techRefDiagrams.ts, and flowed onto the manual's own booklet pages (paginate.ts). The numbers are the Programmer's Guide's appendix.
import '../printables/paper.css';
import { h } from '../../editor/core/ui';
import { bookletPageCount } from './imposition';
import { measurer, type BookPage } from './manualPages';
import { paginate } from './paginate';
import { elementWith, readMarkdown, type Block, type Diagrams } from './markdownBlocks';
import type { BoxItem } from './viewer';
import { sheet } from './kit';
import { TECHREF_DIAGRAMS } from './techRefDiagrams';

const TECHREF_TITLE = 'Technical Reference and Limits';

/** The cover: the product's name, the booklet's, and its byline. */
function techRefCover(): HTMLElement {
  return h(
    'div',
    {
      class: 'game-cover',
      style:
        'background:#14304a;color:#fff;display:flex;flex-direction:column;justify-content:center;gap:.6em;padding:12%;text-align:center;font-family:Georgia,serif',
    },
    h('div', { style: 'font-size:.85em;letter-spacing:.2em' }, 'GAME-MAKER 3.0'),
    h('div', { style: 'font-size:1.9em;font-weight:700;line-height:1.1' }, 'Technical Reference and Limits'),
    h('div', { style: 'font-size:.95em;opacity:.85' }, 'Architecture, file layouts and limits'),
    h('div', { style: 'font-size:.8em;margin-top:2em;opacity:.8' }, 'Notes by technical staff', h('br'), '1994'),
  );
}

/** The back cover: the product, a line, and the booklet's part number. */
function techRefBack(): HTMLElement {
  return h(
    'div',
    { class: 'game-cover tr-back' },
    h('div', { class: 'tr-back-name' }, 'GAME-MAKER 3.0'),
    h('div', { class: 'tr-back-line' }, 'Plan the game. Then build it.'),
    h('div', { class: 'tr-back-small' }, 'Technical Reference and Limits'),
    h('div', { class: 'tr-back-small' }, 'Part No. GM3-TR-94'),
    h('div', { class: 'tr-back-small' }, 'Printed in U.S.A.'),
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

/** The booklet's diagrams with consecutive figure numbers, in the order the Markdown places them. */
function numberedDiagrams(markdown: string): Diagrams {
  const out: Diagrams = {};
  let n = 0;
  for (const m of markdown.matchAll(/^\[diagram: (\w+)\]\s*$/gm)) {
    const draw = TECHREF_DIAGRAMS[m[1]];
    if (!draw) continue;
    const num = ++n;
    out[m[1]] = () => {
      const el = draw();
      const cap = el.querySelector('figcaption');
      if (cap) cap.textContent = `Figure ${num}. ${cap.textContent}`;
      return el;
    };
  }
  return out;
}

/** The booklet as pages: a cover, the chapters, notes pages to fill the last sheet, a back cover. */
async function techRefPages(): Promise<BookPage[]> {
  const markdown = (await import('../../programmersGuide/booklet1994.md?raw')).default;
  const host = h('div', { class: 'gmb-measure gmb-pages', 'aria-hidden': 'true' });
  document.body.append(host);
  try {
    const next = measurer(host);
    const chapters: BookPage[] = [];
    const starts: { title: string; page: number }[] = [];
    const diagrams = numberedDiagrams(markdown);
    for (const c of techRefChapters(markdown)) {
      starts.push({ title: c.head, page: chapters.length + 1 });
      for (const body of paginate([h('h2', null, c.head), ...c.blocks.map(elementWith(diagrams))], next))
        chapters.push({ kind: 'text', head: ['GAME-MAKER 3.0', TECHREF_TITLE], body });
    }
    // Fixed column widths keep pagination independent of the number of digits in a folio.
    const cell = 'padding:.12em .3em;border-bottom:1px dotted currentColor';
    const contents = (offset: number) =>
      paginate(
        [
          h('h2', null, 'Contents'),
          h(
            'table',
            { style: 'table-layout:fixed;width:100%;font-size:.78em;line-height:1.15' },
            h('thead', null, h('tr', null, h('th', { scope: 'col', style: 'width:88%' }, 'Chapter'), h('th', { scope: 'col', style: 'width:12%' }, 'Page'))),
            h(
              'tbody',
              null,
              ...starts.map((c) =>
                h('tr', null, h('td', { style: cell }, c.title), h('td', { style: `${cell};text-align:right;white-space:nowrap` }, String(c.page + offset))),
              ),
            ),
          ),
        ],
        next,
      );
    const count = contents(0).length;
    const pages: BookPage[] = [
      { kind: 'cover', body: [techRefCover()] },
      ...contents(count).map((body): BookPage => ({ kind: 'text', head: ['GAME-MAKER 3.0', 'Contents'], body })),
      ...chapters,
    ];
    const pads = bookletPageCount(pages.length + 1) - pages.length - 1;
    for (let i = 0; i < pads; i++)
      pages.push({ kind: 'notes', head: ['GAME-MAKER 3.0', 'Notes'], body: [h('h2', null, 'Notes'), h('div', { class: 'mp-ruled' })] });
    pages.push({ kind: 'back', body: [techRefBack()] });
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
    note: 'Architecture, file layouts and limits, stapled',
    icon: '📗',
    pages: techRefPages,
    render: async () => [sheet(5.5, 8.5, 'techref-thumb', techRefCover())],
  };
}
