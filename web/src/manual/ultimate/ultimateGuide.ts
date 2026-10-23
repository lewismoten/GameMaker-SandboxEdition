// The Ultimate Owner's Guide: the Game-Maker SE box's advanced manual, a stapled booklet of
// power-user tips (chapters in chapters*.ts, order and page sums in plan.ts) with a black and
// gold cover. It is one more piece in the box (gmItems.ts), opened beside the Owner's Guide in
// the box viewer, and the web guide's Ultimate Guide page opens it the same way.
import './ultimateGuide.css';
import { h } from '../../editor/core/ui';
import type { BookPage } from '../printables/manualPages';
import { measurer } from '../printables/manualPages';
import { paginate } from '../printables/paginate';
import { sheet } from '../printables/kit';
import type { BoxItem } from '../printables/viewer';
import { CHAPTERS, ULTIMATE_TITLE, chapterStarts, planBook } from './plan';
import { fillFigures } from './ultimateFigures';

/** The front cover: black and gold, for the designer who has read the first guide twice. */
export function ultimateCover(): HTMLElement {
  return h(
    'div',
    { class: 'ug-cover' },
    h('div', { class: 'ug-band' }, h('span', null, 'GAME-MAKER 3.0'), h('span', null, 'SANDBOX EDITION')),
    h('div', { class: 'ug-blocks', 'aria-hidden': 'true' }, ...Array.from({ length: 16 }, (_, i) => h('i', { class: `ug-b${(i * 7) % 5}` }))),
    h(
      'h1',
      { class: 'ug-name' },
      h('span', { class: 'ug-the' }, 'The '),
      h('span', { class: 'ug-ultimate' }, 'Ultimate'),
      h('span', { class: 'ug-owners' }, ' Owner’s Guide'),
    ),
    h('p', { class: 'ug-for' }, 'For Advanced Designers'),
    h('ul', { class: 'ug-topics' }, ...['Palette magic', 'Blocks that think', 'Voice and FM music', 'Demos and play-testing'].map((t) => h('li', null, t))),
    h('p', { class: 'ug-foot' }, 'Tips and tricks from the makers of the Sandbox games', h('br'), 'Not an RSD publication'),
  );
}

function backCover(): HTMLElement {
  return h(
    'div',
    { class: 'ug-cover ug-back' },
    h('p', { class: 'ug-back-quote' }, '“You finished the Owner’s Guide. Now make the game nobody thought Game-Maker could make.”'),
    h('ul', { class: 'ug-back-list' }, ...CHAPTERS.map((c) => h('li', null, c.title))),
    h(
      'p',
      { class: 'ug-back-small' },
      'GAME-MAKER 3.0 by Recreational Software Designs. This guide comes with Game-Maker: Sandbox Edition and describes the way PLAYGAME really plays a game. It is not an RSD publication.',
    ),
    h('p', { class: 'ug-back-small' }, 'Printed in U.S.A.'),
  );
}

function contents(starts: number[]): HTMLElement[] {
  return [
    h('h1', null, 'Contents'),
    h(
      'table',
      { class: 'ug-toc' },
      h('tr', null, h('th', null, 'Chapter'), h('th', null, 'Page')),
      ...CHAPTERS.map((c, i) => h('tr', null, h('td', null, c.title), h('td', null, String(starts[i])))),
    ),
    h(
      'div',
      { class: 'note' },
      h('strong', null, 'Who this is for.'),
      ' You have read the Owner’s Guide, built a level or two and want more. Everything here is how PLAYGAME really behaves, tested on the games in the Sandbox catalog. Dip in anywhere; each chapter stands on its own.',
    ),
  ];
}

/** The guide's pages are set a little tighter than the Owner's Guide: a power user's reference. */
const PAGE_CLASS = 'ug-page';

const notesPage = (): HTMLElement[] => [h('h2', null, 'Notes'), h('div', { class: 'mp-ruled' })];

/** Every page of the guide, laid out in the real page styles (needs a document to measure in). */
export async function ultimatePages(): Promise<BookPage[]> {
  const host = h('div', { class: 'gmb-measure gmb-pages', 'aria-hidden': 'true' });
  document.body.append(host);
  try {
    // the chapters flow on one after another; each opening is marked with its chapter
    // (a chapter marked newPage starts a fresh run of pages)
    const runs: HTMLElement[][] = [[]];
    for (const [i, c] of CHAPTERS.entries()) {
      const el = document.createElement('div');
      el.innerHTML = c.html;
      await fillFigures(el);
      el.querySelector<HTMLElement>('.ug-open')?.setAttribute('data-ch', String(i));
      if (c.newPage && runs[runs.length - 1].length) runs.push([]);
      runs[runs.length - 1].push(...([...el.children] as HTMLElement[]));
    }
    const next = measurer(host, PAGE_CLASS);
    const text = runs.flatMap((blocks) => paginate(blocks, next));
    const opens = text.map((page) => page.flatMap((b) => (b.dataset.ch ? [Number(b.dataset.ch)] : [])));
    const starts = chapterStarts(opens, CHAPTERS.length);
    const plan = planBook(text.length);
    const head = (h2: string): [string, string] => [ULTIMATE_TITLE, h2];
    // a page's running head names the last chapter begun by the end of it
    let ch = 0;
    return [
      { kind: 'cover', body: [ultimateCover()] },
      { kind: 'text', head: head('Contents'), body: contents(starts), cls: PAGE_CLASS },
      ...text.map((body, i): BookPage => {
        ch = opens[i].at(-1) ?? ch;
        return { kind: 'text', head: head(CHAPTERS[ch].head), body, cls: PAGE_CLASS };
      }),
      ...Array.from({ length: plan.notes }, (): BookPage => ({ kind: 'notes', head: head('Notes'), body: notesPage() })),
      { kind: 'cover', body: [backCover()] },
    ];
  } finally {
    host.remove();
  }
}

/** The guide as a piece in the Game-Maker box. */
export function ultimateItem(): BoxItem {
  return {
    id: 'ultimate',
    title: ULTIMATE_TITLE,
    note: 'Advanced tips and tricks, stapled',
    icon: '📒',
    pages: ultimatePages,
    render: async () => [sheet(5.5, 8.5, 'ug-thumb', ultimateCover())],
  };
}
