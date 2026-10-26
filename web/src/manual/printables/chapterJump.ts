// The box viewer's chapter jump (viewer.ts): a Chapters list in its bar for a booklet whose pages
// mark where its chapters open (BookPage.marks), showing the chapter being read as the pages
// turn, and the booklet's contents rows (`data-page`) made into buttons that turn to their page.
import { h } from '../../editor/core/ui';
import type { BookPage } from './manualPages';

/** A chapter in the list: where it opens and how it is named there. */
export interface ChapterStop {
  /** How the address names it: its number ('12', or 'A' for an appendix), 'contents', or '' for the cover. */
  key: string;
  id: string;
  label: string;
  page: number;
}

/** Every chapter a booklet's pages open, in page order, after its cover (none without marks). */
export function chapterStops(book: BookPage[]): ChapterStop[] {
  const stops = book.flatMap((p, page) =>
    (p.marks ?? []).map((m) => ({
      key: m.no || m.id,
      id: m.id,
      label: !m.no ? m.title : /^\d+$/.test(m.no) ? `${m.no}. ${m.title}` : `Appendix ${m.no}. ${m.title}`,
      page,
    })),
  );
  return stops.length && book[0]?.kind === 'cover' && stops[0].page > 0 ? [{ key: '', id: 'cover', label: 'Cover', page: 0 }, ...stops] : stops;
}

/** The chapter asked for (by its number or its id), or undefined. */
export const findStop = (stops: ChapterStop[], key: string | undefined) =>
  key === undefined ? undefined : stops.find((s) => s.key.toLowerCase() === key.toLowerCase() || s.id === key);

/** The chapter being read when `last` is the last page shown: the last one opened by then. */
export const stopAt = (stops: ChapterStop[], last: number) => stops.filter((s) => s.page <= last).at(-1);

/** The bar's Chapters list. `turn` is called with the chosen chapter. */
export function chapterPicker(turn: (stop: ChapterStop) => void) {
  let stops: ChapterStop[] = [];
  const select = h('select', {
    id: 'gmb-chapter',
    class: 'gmb-chapter',
    onchange: () => {
      const stop = stops[Number(select.value)];
      if (stop) turn(stop);
    },
  });
  const el = h('span', { class: 'gmb-chapter-wrap', hidden: true }, h('label', { for: 'gmb-chapter' }, 'Chapters'), select);
  return {
    el,
    /** The booklet shown (no chapters hides the list). */
    use(next: ChapterStop[]) {
      stops = next;
      el.hidden = !stops.length;
      select.replaceChildren(...stops.map((s, i) => h('option', { value: String(i) }, s.label)));
    },
    /** The last page shown, so the list names the chapter being read. */
    showing(last: number) {
      const at = stopAt(stops, last);
      select.selectedIndex = at ? stops.indexOf(at) : -1;
    },
  };
}

/** A page on screen: its contents rows (`tr[data-page]`) become buttons that turn to their page. */
export function linkContents(page: HTMLElement, turnTo: (page: number) => void): void {
  for (const row of page.querySelectorAll<HTMLElement>('tr[data-page]')) {
    const cell = row.querySelector('td');
    const to = Number(row.dataset.page);
    if (!cell || !Number.isFinite(to)) continue;
    const name = (cell.textContent ?? '').replace(/\s+/g, ' ').trim();
    const go = h(
      'button',
      {
        type: 'button',
        class: 'gmb-goto',
        'aria-label': `${name}, page ${to}`,
        onclick: (e: MouseEvent) => {
          e.stopPropagation(); // not a click on the page, which turns it
          turnTo(to);
        },
      },
      ...cell.childNodes,
    );
    cell.replaceChildren(go);
  }
}
