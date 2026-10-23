// The open game box on the table: the stapled manual and the paper that came with it, listed
// in a "What's in the box" tray. Each piece can be read on screen and printed.
import './paper.css';
import { h } from '../../editor/core/ui';
import { centerSpread, spreadAt, stepSpread, bookletSheets } from './imposition';
import { PAGE_H, PAGE_W, pageElement, type BookPage } from './manualPages';
import type { Sheet } from './kit';
import { RedFilm, RedLens } from './redFilm';
import { decorateBbsName } from '../../retro/bbs/bbsName';
import { crispShots, enlarge, isShot, zoomOpen } from './crisp';

/** A thing in the box. */
export interface BoxItem {
  id: string;
  title: string;
  note?: string;
  icon: string;
  promised?: boolean;
  /** Fresh sheets every call (the screen and each print get their own copies). */
  render(): Promise<Sheet[]>;
  /** A special on-screen presentation (e.g. a fold-out that unfolds). */
  screen?(sheets: Sheet[]): HTMLElement;
  /** Shows the red film button. */
  redFilm?: boolean;
  /**
   * A booklet of its own (a second manual): shown, turned and printed page by page like the
   * manual. `render` then gives only its cover, for the box's list of pieces.
   */
  pages?(): Promise<BookPage[]>;
}

type PrintMode = 'item' | 'booklet' | 'all';

export interface BoxOptions {
  /** How the manual is bound: two staples in the fold (a shareware booklet), or a plastic comb. */
  binding?: 'staples' | 'comb';
}

const COMB_HOW = 'two pages a side: fold the stack, or cut it and bind it';
const STAPLE_HOW = 'two pages a side: fold the stack, staple the fold';

/** Gap between the pages of a comb-bound spread, as a fraction of a page's width. */
const COMB_GAP = 0.07;

export function openBox(title: string, pages: BookPage[], items: BoxItem[], options: BoxOptions = {}): Promise<void> {
  const comb = options.binding === 'comb';
  return new Promise((resolve) => {
    let current = 'manual';
    let at = 0;
    // the booklet on the stage: the manual, or a booklet in the box (BoxItem.pages)
    let book = pages;
    let bookId = 'manual';
    let bookComb = comb;
    let total = pages.length;
    let stapled = centerSpread(total);
    const marks = new Map<string, number>(); // the page each booklet was left open at
    const booklets = new Map<string, Promise<BookPage[]>>();
    const isBook = (id = current) => id === 'manual' || !!items.find((i) => i.id === id)?.pages;
    const openBook = (id: string, p: BookPage[], bound: boolean) => {
      marks.set(bookId, at);
      book = p;
      bookId = id;
      bookComb = bound;
      total = p.length;
      stapled = centerSpread(total);
      at = marks.get(id) ?? 0;
    };
    // the stage scrolls a tall piece: focusable, so the keyboard can scroll it too
    const stage = h('div', { class: 'gmb-stage', tabindex: 0, role: 'region', 'aria-label': 'The piece shown' });
    const tray = h('ul', { class: 'gmb-tray-list' });
    const counter = h('span', { class: 'gmb-counter' });
    const filmBtn = h(
      'button',
      { class: 'gmb-film-btn', onclick: () => film.toggle(), title: 'A whole sheet of red film to drag over the page (or just point at an answer)' },
      '🟥 Red film',
    );
    const film = new RedFilm();
    // over a page with hidden answers the pointer carries a circle of red film
    const lens = new RedLens();
    lens.follow(stage, () => !!items.find((i) => i.id === current)?.redFilm);
    const two = () => stage.clientWidth >= 760;

    // ---- the manual
    const spread = h('div', { class: 'gmb-spread gmb-pages' });
    let turned: 1 | -1 | 0 = 0;
    const nav = h(
      'div',
      { class: 'gmb-nav' },
      h('button', { onclick: () => go(-1), 'aria-label': 'Previous page' }, '◀'),
      counter,
      h('button', { onclick: () => go(1), 'aria-label': 'Next page' }, '▶'),
    );
    const showManual = () => {
      const isTwo = two();
      const shown = spreadAt(at, total, isTwo);
      at = shown[0];
      const availW = stage.clientWidth - 24;
      const availH = stage.clientHeight - 64;
      const gap = bookComb ? COMB_GAP * (isTwo ? 1 : 0.5) : 0;
      const pw = Math.max(120, Math.min(availW / ((isTwo ? 2 : 1) + gap + (bookComb ? (isTwo ? 0.06 : 0.12) : 0)), (availH * PAGE_W) / PAGE_H));
      spread.style.setProperty('--pw', `${pw}px`);
      spread.replaceChildren(
        ...shown.map((i, k) => {
          const el = pageElement(book[i], i);
          if (shown.length === 2) el.classList.add(k === 0 ? 'left' : 'right');
          else if (isTwo) el.classList.add(i === 0 ? 'right' : 'left');
          el.addEventListener('click', () => go(shown.length === 2 && k === 0 ? -1 : 1));
          return el;
        }),
      );
      spread.classList.toggle('one', shown.length === 1 && isTwo);
      spread.classList.toggle('alone-right', shown.length === 1 && isTwo && shown[0] === 0);
      spread.classList.toggle('comb', bookComb);
      delete spread.dataset.comb;
      if (bookComb) {
        // the comb runs along the bound edge: between the pages, or beside a page shown alone
        const side = shown.length === 2 ? 'mid' : shown[0] % 2 === 0 ? 'start' : 'end'; // even pages are right-hand pages
        spread.dataset.comb = side;
        spread.style.setProperty('--gap', side === 'mid' ? `${pw * gap}px` : '0px');
        // the page block: thicker on whichever side more pages lie
        const read = total > 1 ? shown[0] / (total - 1) : 0;
        const thick = Math.min(18, Math.max(5, pw * 0.035));
        spread.style.setProperty('--lt', `${thick * read}px`);
        spread.style.setProperty('--rt', `${thick * (1 - read)}px`);
        spread.append(
          h('i', { class: 'gmb-comb', 'aria-hidden': 'true' }),
          h('i', { class: 'gmb-edge l', 'aria-hidden': 'true' }),
          h('i', { class: 'gmb-edge r', 'aria-hidden': 'true' }),
        );
        if (turned) {
          const page = spread.querySelectorAll('.mpage')[turned === 1 && shown.length === 2 ? 0 : shown.length - 1] as HTMLElement | undefined;
          page?.classList.add(turned === 1 ? 'turn-in-next' : 'turn-in-prev');
        }
        turned = 0;
      } else if (shown.length === 2 && shown[0] === stapled[0]) spread.append(h('i', { class: 'gmb-staple top' }), h('i', { class: 'gmb-staple bottom' }));
      counter.textContent =
        shown[0] === 0
          ? `Cover · ${total - 2} pages`
          : shown[0] === total - 1
            ? 'Back cover'
            : `Page ${shown.join('–')} of ${total - 2}${!bookComb && shown[0] === stapled[0] ? ' · center' : ''}`;
      stage.replaceChildren(spread, nav);
      crispShots(spread);
    };
    const go = (dir: 1 | -1) => {
      if (!isBook()) return;
      const was = at;
      at = stepSpread(at, total, two(), dir);
      if (at !== was) turned = dir;
      showManual();
    };

    // ---- everything else
    let shownSheets: Sheet[] = [];
    const fitSheets = () => {
      const maxW = Math.min(stage.clientWidth - 32, 980);
      const maxH = stage.clientHeight - 32;
      for (const s of shownSheets) s.el.style.width = `${Math.max(140, Math.min(maxW, maxH > 200 ? (maxH * s.w) / s.h : maxW))}px`;
    };
    const showItem = async (item: BoxItem) => {
      stage.replaceChildren(h('p', { class: 'gmb-loading' }, 'Unfolding…'));
      const sheets = await item.render();
      if (current !== item.id) return;
      shownSheets = sheets;
      const wrap = item.screen ? item.screen(sheets) : h('div', { class: 'gmb-sheets' }, ...sheets.map((s) => s.el));
      decorateBbsName(wrap);
      stage.replaceChildren(wrap);
      stage.scrollTop = 0;
      fitSheets();
    };

    const select = (id: string) => {
      current = id;
      for (const li of tray.children) {
        const on = (li as HTMLElement).dataset.id === id;
        li.classList.toggle('on', on);
        li.querySelector('button')?.setAttribute('aria-current', String(on));
      }
      const item = items.find((i) => i.id === id);
      filmBtn.hidden = !item?.redFilm;
      if (!item?.redFilm) (film.hide(), lens.hide());
      bookletBtn.firstChild!.textContent = item?.pages ? 'This booklet, two pages a side' : 'Manual as a booklet';
      bookletBtn.lastChild!.textContent = !item?.pages && comb ? COMB_HOW : STAPLE_HOW;
      if (id === 'manual') {
        openBook('manual', pages, comb);
        showManual();
      } else if (item?.pages) void showBooklet(item);
      else if (item) void showItem(item);
    };
    const bookletOf = (item: BoxItem) => {
      let p = booklets.get(item.id);
      if (!p) booklets.set(item.id, (p = item.pages!()));
      return p;
    };
    const showBooklet = async (item: BoxItem) => {
      stage.replaceChildren(h('p', { class: 'gmb-loading' }, 'Opening…'));
      const p = await bookletOf(item);
      if (current !== item.id) return;
      openBook(item.id, p, false);
      showManual();
    };

    // page counts are the numbered pages, as the page turner counts them (the covers aren't numbered)
    const entries: { id: string; title: string; note?: string; icon: string; promised?: boolean }[] = [
      { id: 'manual', title: 'Manual', note: `${pages.length - 2} pages, ${comb ? 'comb-bound' : 'stapled'}`, icon: '📖' },
      ...items,
    ];
    for (const it of entries)
      tray.append(
        h(
          'li',
          { dataset: { id: it.id } },
          h(
            'button',
            { onclick: () => select(it.id), title: it.note ?? it.title },
            h('span', { class: 'gmb-icon', 'aria-hidden': 'true' }, it.icon),
            h('span', { class: 'gmb-item-name' }, it.title, it.note ? h('small', null, it.note) : null),
            it.promised ? h('span', { class: 'gmb-seal', title: 'Promised to registered players: here it is' }, 'REG') : null,
          ),
        ),
      );

    // ---- printing
    const printRoot = h('div', { class: 'booklet-print gmb-print gmb-pages' });
    const sheetPage = (s: Sheet) => {
      const land = s.w > s.h;
      const [pw, ph] = land ? [11, 8.5] : [8.5, 11];
      const small = s.w < pw - 1 || s.h < ph - 1;
      const scale = Math.min(1, (pw - 0.5) / s.w, (ph - 0.5) / s.h);
      s.el.style.width = `${s.w * scale}in`;
      return h('div', { class: `pp-print-page ${land ? 'land' : ''}` }, small ? h('div', { class: 'pp-cut' }, s.el) : s.el);
    };
    const manualSingle = (of = pages) =>
      of.map((p, i) => {
        const el = pageElement(p, i);
        return h('div', { class: 'pp-print-page' }, el);
      });
    const manualBooklet = (of = pages) =>
      bookletSheets(of.length).flatMap((s) =>
        [s.front, s.back].map((pair) => h('div', { class: 'pp-print-page land booklet-side' }, ...pair.map((i) => pageElement(of[i], i)))),
      );
    const print = async (mode: PrintMode) => {
      menu.hidden = true;
      const out: HTMLElement[] = [];
      // the booklet on the stage (the manual unless a booklet in the box is open)
      const shownBook = isBook() ? book : pages;
      if (mode === 'booklet') out.push(...manualBooklet(shownBook));
      else if (mode === 'item' && isBook()) out.push(...manualSingle(book));
      else {
        const list = mode === 'all' ? items : items.filter((i) => i.id === current);
        if (mode === 'all') out.push(...manualSingle());
        for (const it of list)
          if (it.pages) out.push(...manualSingle(await bookletOf(it)));
          else for (const s of await it.render()) out.push(sheetPage(s));
      }
      printRoot.replaceChildren(...out);
      document.documentElement.classList.add('gmb-printing');
      await Promise.all([...printRoot.querySelectorAll('img')].map((i) => i.decode().catch(() => undefined)));
      window.print();
    };
    // the browser's own Print command prints the manual, page by page
    const afterPrint = () => {
      document.documentElement.classList.remove('gmb-printing');
      printRoot.replaceChildren(...manualSingle());
    };
    printRoot.replaceChildren(...manualSingle());
    window.addEventListener('afterprint', afterPrint);

    const bookletBtn = h('button', { onclick: () => void print('booklet') }, 'Manual as a booklet', h('small', null, comb ? COMB_HOW : STAPLE_HOW));
    const menu = h(
      'div',
      { class: 'gmb-print-menu', hidden: true },
      h('button', { onclick: () => void print('item') }, 'This piece'),
      bookletBtn,
      h('button', { onclick: () => void print('all') }, 'Everything in the box'),
    );

    // ---- the frame: a modal box; the page under it can't be reached until it closes
    const opener = document.activeElement as HTMLElement | null;
    const shut: HTMLElement[] = [];
    const close = () => {
      for (const el of shut) el.inert = false;
      opener?.focus({ preventScroll: true });
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('afterprint', afterPrint);
      afterPrint();
      film.hide();
      overlay.remove();
      printRoot.remove();
      resolve();
    };
    const onKey = (e: KeyboardEvent) => {
      if (zoomOpen()) return; // an enlarged screen shot takes the keys
      e.stopImmediatePropagation(); // not for the PC underneath
      if (e.key === 'ArrowRight' || e.key === 'PageDown') go(1);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(-1);
      else if (e.key === 'Home') ((at = 0), isBook() && showManual());
      else if (e.key === 'Escape') menu.hidden ? close() : (menu.hidden = true);
      else if ((e.key === 'Enter' || e.key === ' ') && isShot(e.target)) enlarge(e.target);
      else return;
      e.preventDefault();
    };
    const onResize = () => (isBook() ? showManual() : fitSheets());
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onResize);

    const overlay = h(
      'div',
      { class: 'gmb', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h(
        'div',
        { class: 'gmb-bar' },
        h('strong', null, title),
        h('span', { class: 'gmb-spacer' }),
        filmBtn,
        h('div', { class: 'gmb-print-wrap' }, h('button', { onclick: () => (menu.hidden = !menu.hidden), 'aria-haspopup': 'menu' }, '🖨 Print…'), menu),
        h('button', { onclick: close }, 'Close (Esc)'),
      ),
      h('div', { class: 'gmb-main' }, h('nav', { class: 'gmb-tray', 'aria-label': 'What’s in the box' }, h('h2', null, 'What’s in the box'), tray), stage),
    );
    film.mount(overlay);
    lens.mount(overlay);
    for (const el of document.body.children)
      if (el instanceof HTMLElement && !el.inert) {
        el.inert = true;
        shut.push(el);
      }
    document.body.append(overlay, printRoot);
    select('manual');
    tray.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
  });
}
