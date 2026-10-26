// A file listing a screen at a time, the way Wildcat! and PCBoard paged theirs: the screen
// clears, the area's header shows "Page 1 of 3", as many entries (FILE_ID.DIZ and all) as fit
// above the prompt, and N)ext / P)rev (or Enter) turn the page. Nothing scrolls off the top
// before the caller has seen it, however many files the area grows to.
import { ROWS } from '../text/textScreen';
import type { Term } from './term';

/** Rows the terminal shows above its status bar. */
const SCREEN_ROWS = ROWS - 1;

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

interface PagedListing {
  /** The area's header lines (the same number every time); it gets the page number to show and the mode. */
  header: (page: number, pages: number, extended: boolean) => string[];
  /** Each entry's lines on the extended listing, its whole FILE_ID.DIZ (made again for each page shown, so a * stays current). */
  entries: Lines<string[][]>;
  /** Each entry's one line on the compact listing, when the area has one. */
  compact?: Lines<string[]>;
  /** Lines under the entries (the legend), the same number every time. */
  footer: Lines<string[]>;
}

type Lines<T> = T | (() => T);
const now = <T>(l: Lines<T>): T => (typeof l === 'function' ? (l as () => T)() : l);

/** More extended pages than this and an area opens on its compact list, one line a file. */
const EXTENDED_PAGES = 3;

/**
 * Draws the listing a page at a time, keeping the prompt on the screen below it. An area with
 * a compact list opens on it once the full FILE_ID.DIZ pages would run past EXTENDED_PAGES;
 * E toggles between the two (PCBoard's one-line list and its extended descriptions).
 */
export class Pager {
  page = 0;
  extended: boolean;
  private paged: { full: number[][]; brief: number[][] };

  constructor(
    private t: Term,
    private list: PagedListing,
  ) {
    const room = SCREEN_ROWS - list.header(0, 1, true).length - now(list.footer).length - 2; // the prompt, and the line it moves to
    const full = paginate(
      now(list.entries).map((e) => e.length),
      room,
    );
    const brief = list.compact
      ? paginate(
          now(list.compact).map(() => 1),
          room,
        )
      : full;
    this.paged = { full, brief };
    this.extended = !list.compact || full.length <= EXTENDED_PAGES;
  }

  get pages(): number[][] {
    return this.extended ? this.paged.full : this.paged.brief;
  }

  get count(): number {
    return this.pages.length;
  }

  /** Clears the screen and draws the current page. */
  show(page = this.page): void {
    this.page = Math.max(0, Math.min(this.count - 1, page));
    this.t.clear();
    for (const l of this.list.header(this.page, this.count, this.extended)) this.t.line(l);
    const entries = this.extended || !this.list.compact ? now(this.list.entries) : now(this.list.compact).map((l) => [l]);
    for (const i of this.pages[this.page]) for (const l of entries[i] ?? []) this.t.line(l);
    for (const l of now(this.list.footer)) this.t.line(l);
  }

  /** The page-turning part of the prompt (and the E toggle, where there is a compact list). */
  keys(): string {
    const toggle = this.list.compact ? `|15E|07)${this.extended ? ' short list' : 'xtended'}, ` : '';
    return pageKeys(this.page, this.count) + toggle;
  }

  /**
   * Turns the page for N, P, L (list again), E (the other listing, at the page with the same
   * first file) or Enter (the next page): true when the answer was one of those. Enter on the
   * last page is not (the caller is done).
   */
  turn(answer: string): boolean {
    const last = this.page >= this.count - 1;
    if (answer === 'N' || (answer === '' && !last)) this.show(last ? this.page : this.page + 1);
    else if (answer === 'P') this.show(this.page - 1);
    else if (answer === 'L') this.show();
    else if (answer === 'E' && this.list.compact) {
      const first = this.pages[this.page][0] ?? 0;
      this.extended = !this.extended;
      this.show(
        Math.max(
          0,
          this.pages.findIndex((p) => p.includes(first)),
        ),
      );
    } else return false;
    return true;
  }
}

/** The file a "#", "V#" or "R#" answer asks to read about (1-based), or NaN. */
export const readNumber = (answer: string) => (/^[VR]?\d+$/.test(answer) ? Number(answer.replace(/^[VR]/, '')) : NaN);

/** The day a file went up, made up but always the same for it: MM-DD-YY in its year. */
export function uploadDate(key: string, year = 1995): string {
  let x = 2166136261;
  for (const c of key) x = Math.imul(x ^ c.charCodeAt(0), 16777619) >>> 0;
  const two = (n: number) => String(n).padStart(2, '0');
  return `${two(1 + (x % 12))}-${two(1 + ((x >>> 8) % 28))}-${two(year % 100)}`;
}

/** A FILE_ID.DIZ's first line as a one-line summary: its title, without the [1/1] disk count. */
export const dizSummary = (diz: string[]) => (diz[0] ?? '').replace(/\s*\[\d+\/\d+\]\s*$/, '').trim();

/** "Page 1 of 3" for a header, or nothing when it all fits on one. */
export const pageLabel = (page: number, pages: number) => (pages > 1 ? `Page ${page + 1} of ${pages}` : '');
