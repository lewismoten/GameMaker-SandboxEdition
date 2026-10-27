// The Game-Maker 3.0 Owner's Guide for the desk PC, typeset like a 1994 manual. It
// describes this recreation (the desk, its DOS and Game-Maker's text menus) in the voice
// of the original documentation, with specifications from GM_SPECS.TXT. Its pages are
// dosManualFront.ts, dosManualDesign.ts and dosManualBack.ts (with dosManualKit.ts); this file
// binds them into the booklet and opens it.
import { type BookletPage } from './booklet';
import './booklet.css';
import { h } from '../editor/core/ui';
import { isSandboxGame, loadCatalog, type CatalogEntry } from '../project/files';
import { bookletPageCount } from './printables/imposition';
import type { BookPage } from './printables/manualPages';
import type { BoxOptions } from './printables/viewer';
import { sandboxShots, type GameShot } from '../gfx/sandboxShots';
import { TITLE } from './dosManualKit';
import { frontPages } from './dosManualFront';
import { designPages } from './dosManualDesign';
import { backPages } from './dosManualBack';

const pages = (shots: GameShot[]): BookletPage[] => [...frontPages(shots), ...designPages(shots), ...backPages()];

/** The gallery's screenshots: give them a moment to load, and go without them if they can't. */
const galleryShots = () => Promise.race([sandboxShots(), new Promise<GameShot[]>((r) => setTimeout(() => r([]), 4000))]);

/** The guide's pages as the box shows them: index n is the page with n printed at its foot (the copy check's page numbers). */
export async function dosManualPages(): Promise<BookPage[]> {
  return bookPages(pages(await galleryShots()));
}

/**
 * The guide in the box viewer, with the box's other contents (loaded only now: the copy check
 * needs just the pages), open at `start` (a piece's id) or the guide, and at `more.chapter`;
 * `more.address` keeps them in the page address (the Library's).
 */
export async function openDosManual(start?: string, more: Pick<BoxOptions, 'chapter' | 'address'> = {}): Promise<void> {
  const [shots, { openBox }, { gmBoxItems }] = await Promise.all([galleryShots(), import('./printables/viewer'), import('./printables/gmItems')]);
  const family = (await loadCatalog().catch(() => [] as CatalogEntry[])).filter(isSandboxGame);
  return openBox('Game-Maker SE 3.0', bookPages(pages(shots)), gmBoxItems(family), { binding: 'comb', start, ...more });
}

/**
 * Marks where each chapter opens, from the running heads ('3. Designing Games', 'Appendix A.
 * Specifications'), and gives each contents row the page it names, for the box viewer's
 * chapter jump (printables/chapterJump.ts).
 */
function markChapters(book: BookPage[]): void {
  let last = '';
  for (const p of book) {
    const head = p.head?.[1] ?? '';
    if (head === last) continue;
    last = head;
    const m = /^(?:(\d+)|Appendix ([A-Z]))\. (.+)$/.exec(head);
    if (m) p.marks = [{ id: m[1] ?? m[2], no: m[1] ?? m[2], title: m[3] }];
    else if (head === 'Contents') {
      p.marks = [{ id: 'contents', no: '', title: 'Contents' }];
      for (const row of p.body.flatMap((b) => [...b.querySelectorAll<HTMLElement>('tr')])) {
        const page = row.querySelector('td:last-child')?.textContent?.trim() ?? '';
        if (/^\d+$/.test(page)) row.dataset.page = page;
      }
    }
  }
}

/** The guide as a stapled booklet for the box viewer: note pages fill it out to whole folded sheets. */
function bookPages(guide: BookletPage[]): BookPage[] {
  const body = (p: BookletPage) => (Array.isArray(p.body) ? p.body : [p.body]);
  const inside = guide.slice(0, -1).map((p, i): BookPage => ({ kind: i === 0 || p.cover ? 'cover' : 'text', head: p.head, body: body(p) }));
  markChapters(inside);
  const back: BookPage = { kind: 'cover', body: body(guide[guide.length - 1]) };
  const pads = bookletPageCount(guide.length) - guide.length;
  for (let i = 0; i < pads; i++) inside.push({ kind: 'notes', head: [TITLE, 'Notes'], body: [h('h2', null, 'Notes'), h('div', { class: 'mp-ruled' })] });
  return [...inside, back];
}
