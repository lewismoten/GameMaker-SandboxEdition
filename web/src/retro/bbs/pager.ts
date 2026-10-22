// A file listing a screen at a time, the way Wildcat! and PCBoard paged theirs: the screen
// clears, the area's header shows "Page 1 of 3", as many entries (FILE_ID.DIZ and all) as fit
// above the prompt, and N)ext / P)rev (or Enter) turn the page. Nothing scrolls off the top
// before the caller has seen it, however many files the area grows to.
import { attr, COLS, ROWS } from '../text/textScreen';
import type { Term } from './term';

/** Rows the terminal shows above its status bar. */
export const SCREEN_ROWS = ROWS - 1;

/**
 * Entries (by their heights in rows) into pages of at most `room` rows, in order. An entry
 * taller than a whole page gets one to itself. Always at least one page.
 */
export function paginate(heights: number[], room: number): number[][] {
  const pages: number[][] = [[]];
  let used = 0;
  heights.forEach((h, i) => {
    const page = pages[pages.length - 1];
    if (page.length && used + h > room) {
      pages.push([i]);
      used = h;
    } else {
      page.push(i);
      used += h;
    }
  });
  return pages;
}

/** "N)ext P)rev" for the prompt, as far as there are pages that way. */
export function pageKeys(page: number, pages: number): string {
  const keys = [page < pages - 1 ? '|15N|07)ext' : '', page > 0 ? '|15P|07)rev' : ''].filter(Boolean);
  return keys.length ? `${keys.join(' ')}, ` : '';
}

export interface PagedListing {
  /** The area's header lines; it gets the page number to show. */
  header: (page: number, pages: number) => string[];
  /** Each entry's lines on the listing. */
  entries: string[][];
  /** Lines under the entries (the legend). */
  footer: string[];
}

/** Draws the listing a page at a time, keeping the prompt on the screen below it. */
export class Pager {
  page = 0;
  readonly pages: number[][];

  constructor(
    private t: Term,
    private list: PagedListing,
  ) {
    const room = SCREEN_ROWS - list.header(0, 1).length - list.footer.length - 2; // the prompt, and the line it moves to
    this.pages = paginate(
      list.entries.map((e) => e.length),
      room,
    );
  }

  get count(): number {
    return this.pages.length;
  }

  /** Which page the entry (0-based) is on. */
  pageOf(entry: number): number {
    return Math.max(0, this.pages.findIndex((p) => p.includes(entry)));
  }

  /** Clears the screen and draws the current page. */
  show(page = this.page): void {
    this.page = Math.max(0, Math.min(this.count - 1, page));
    const s = this.t.screenRef;
    s.fill(0, 0, COLS - 1, SCREEN_ROWS - 1, attr(7, 0));
    s.cursorX = 0;
    s.cursorY = 0;
    for (const l of this.list.header(this.page, this.count)) this.t.line(l);
    for (const i of this.pages[this.page]) for (const l of this.list.entries[i]) this.t.line(l);
    for (const l of this.list.footer) this.t.line(l);
  }

  /** The page-turning part of the prompt. */
  keys(): string {
    return pageKeys(this.page, this.count);
  }

  /**
   * Turns the page for N, P, L (list again) or Enter (the next page): true when the answer
   * was one of those. Enter on the last page is not (the caller is done).
   */
  turn(answer: string): boolean {
    const last = this.page >= this.count - 1;
    if (answer === 'N' || (answer === '' && !last)) this.show(last ? this.page : this.page + 1);
    else if (answer === 'P') this.show(this.page - 1);
    else if (answer === 'L') this.show();
    else return false;
    return true;
  }
}

/** "Page 1 of 3" for a header, or nothing when it all fits on one. */
export const pageLabel = (page: number, pages: number) => (pages > 1 ? `Page ${page + 1} of ${pages}` : '');
