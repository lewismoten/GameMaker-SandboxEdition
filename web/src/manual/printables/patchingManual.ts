// The Game-Maker box patching booklet: original 1994 prose, verified byte directory and SVG plates.
import '../printables/paper.css';
import { h } from '../../editor/core/ui';
import { bookletPageCount } from './imposition';
import { measurer, type BookPage } from './manualPages';
import { paginate } from './paginate';
import { elementWith, readMarkdown, type Block } from './markdownBlocks';
import type { BoxItem } from './viewer';
import { sheet } from './kit';
import { PATCHING_DIAGRAMS } from './patchingPlates';

const PATCHING_TITLE = 'Player Patching Manual';

/** One block as an element; an offset (the first column of a table) never breaks or hyphenates across lines. */
function patchingElement(block: Block): HTMLElement {
  const el = elementWith(PATCHING_DIAGRAMS)(block);
  for (const cell of el.querySelectorAll<HTMLElement>('tr > :first-child')) cell.style.cssText += 'white-space:nowrap;hyphens:none';
  return el;
}

/** The cover: the product's name, the booklet's, and its byline. */
function patchingManualCover(): HTMLElement {
  return h(
    'div',
    {
      class: 'game-cover',
      style:
        'background:#14304a;color:#fff;display:flex;flex-direction:column;justify-content:center;gap:.6em;padding:12%;text-align:center;font-family:Georgia,serif',
    },
    h('div', { style: 'font-size:.85em;letter-spacing:.2em' }, 'GAME-MAKER 3.0'),
    h('div', { style: 'font-size:1.9em;font-weight:700;line-height:1.1' }, 'Player Patching Manual'),
    h('div', { style: 'font-size:.95em;opacity:.85' }, 'Words, colors, frames and player tuning'),
    h('div', { style: 'font-size:.8em;margin-top:2em;opacity:.8' }, 'Notes by technical staff', h('br'), '1994'),
  );
}

/** The back cover: the product, a line, and the booklet's part number. */
function patchingManualBack(): HTMLElement {
  return h(
    'div',
    { class: 'game-cover tr-back' },
    h('div', { class: 'tr-back-name' }, 'GAME-MAKER 3.0'),
    h('div', { class: 'tr-back-line' }, 'One copy. One change. Check every byte.'),
    h('div', { class: 'tr-back-small' }, 'Player Patching Manual'),
    h('div', { class: 'tr-back-small' }, 'Part No. GM3-PM-94'),
    h('div', { class: 'tr-back-small' }, 'Printed in U.S.A.'),
  );
}

/** A bold setting line and the short table under it travel together, so a page never ends on the line and starts on its table. */
function keepLabelsWithTables(els: HTMLElement[]): HTMLElement[] {
  const label = (e?: HTMLElement) => e?.tagName === 'P' && e.firstElementChild?.tagName === 'STRONG';
  const out: HTMLElement[] = [];
  for (const el of els) {
    const [p1, p2] = [out[out.length - 1], out[out.length - 2]];
    const short = el.tagName === 'TABLE' && el.querySelectorAll('tr').length <= 10;
    if (short && label(p2) && p1?.tagName === 'P') out.splice(-2, 2, h('div', { class: 'pm-setting' }, p2, p1, el));
    else if (short && label(p1)) out.splice(-1, 1, h('div', { class: 'pm-setting' }, p1, el));
    else out.push(el);
  }
  return out;
}

/** The booklet's chapters from its Markdown: the first-level and second-level headings are the cover's, and the rules between chapters are not text. */
export function patchingManualChapters(markdown: string): { head: string; blocks: Block[] }[] {
  return readMarkdown(markdown)
    .filter((s) => s.level >= 3)
    .map((s) => ({
      head: s.title.replace(/^\d+\.\s*/, ''),
      blocks: s.blocks.filter((b) => !(b.tag === 'p' && b.kids.length === 1 && b.kids[0] === '---')),
    }))
    .filter((c) => c.blocks.length);
}

/** The booklet as pages: a cover, the chapters, notes pages to fill the last sheet, a back cover. */
async function patchingManualPages(): Promise<BookPage[]> {
  const markdown = (await import('../../programmersGuide/patching1994.md?raw')).default;
  const host = h('div', { class: 'gmb-measure gmb-pages', 'aria-hidden': 'true' });
  document.body.append(host);
  try {
    const next = measurer(host);
    const pages: BookPage[] = [{ kind: 'cover', body: [patchingManualCover()] }];
    for (const c of patchingManualChapters(markdown))
      for (const body of paginate([h('h2', null, c.head), ...keepLabelsWithTables(c.blocks.map(patchingElement))], next))
        pages.push({ kind: 'text', head: ['GAME-MAKER 3.0', PATCHING_TITLE], body });
    const pads = bookletPageCount(pages.length + 1) - pages.length - 1;
    for (let i = 0; i < pads; i++)
      pages.push({ kind: 'notes', head: ['GAME-MAKER 3.0', 'Notes'], body: [h('h2', null, 'Notes'), h('div', { class: 'mp-ruled' })] });
    pages.push({ kind: 'back', body: [patchingManualBack()] });
    return pages;
  } finally {
    host.remove();
  }
}

/** The booklet as a piece in the Game-Maker box. */
export function patchingManualItem(): BoxItem {
  return {
    id: 'patching',
    title: PATCHING_TITLE,
    note: 'Words, colors, frames and player tuning, stapled',
    icon: '📗',
    pages: patchingManualPages,
    render: async () => [sheet(5.5, 8.5, 'patching-thumb', patchingManualCover())],
  };
}
