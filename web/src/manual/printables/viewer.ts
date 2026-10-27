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
import { chapterPicker, chapterStops, findStop, linkContents, stopAt, type ChapterStop } from './chapterJump';
import { readView, viewToggle, type Reader, type ReaderOptions, type ReadView } from '../readView';
import { percentOf, pinchZoom, readSize, sizeControl, widthAt, zoomKey, type ReadSize, type Room } from '../readSize';
import { scrollPages, type ScrollPages } from '../scrollPages';

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
  /** Its own on-screen view, built without rendering every sheet (`render` is then only for printing). */
  live?(): Promise<HTMLElement>;
  /** Like `live`, a view of its own that reads a page at a time or scrolled (readView.ts), in `root`. */
  reader?(o: ReaderOptions): Promise<Reader>;
  /** Shows the red film button. */
  redFilm?: boolean;
  /**
   * A booklet of its own (a second manual): shown, turned and printed page by page like the
   * manual. `render` then gives only its cover, for the box's list of pieces.
   */
  pages?(): Promise<BookPage[]>;
  /** The chapter (a BookPage.marks id) to open the booklet at, asked each time it is first shown. */
  openAt?(): string | undefined;
}

type PrintMode = 'item' | 'booklet' | 'all';

/** A page address that keeps the piece open and its chapter (the Library's ?gm=ultimate&ch=12). */
export interface BoxAddress {
  /**
   * The piece or the chapter shown changed: `chapter` is its number ('12', 'A', 'contents'),
   * undefined on a cover or outside a booklet's chapters; `jump` when the reader chose it (a new
   * history entry, so Back returns), not when paging into it.
   */
  moved(piece: string, chapter: string | undefined, jump: boolean): void;
  /** Hands over how to turn the open box to a piece and chapter (Back and Forward), and close it. */
  attach(turn: (piece: string, chapter?: string) => void, close: () => void): void;
}

export interface BoxOptions {
  /** How the manual is bound: two staples in the fold (a shareware booklet), or a plastic comb. */
  binding?: 'staples' | 'comb';
  /** The tray's heading (a box's contents by default; a folder of maps has no manual). */
  trayHeading?: string;
  /** The piece to open at, by id ('manual' or a BoxItem's): the Library's card for it. The first otherwise. */
  start?: string;
  /** The chapter of `start`'s booklet to open at, by its number ('12', 'A') or id. */
  chapter?: string;
  address?: BoxAddress;
}

const COMB_HOW = 'two pages a side, printed on both sides (flip on the short edge): fold the stack, or cut it and bind it';
const STAPLE_HOW = 'two pages a side, printed on both sides (flip on the short edge): fold the stack, staple the fold';
/** A book's pages in reading order, for the screen: the booklet's imposed order is for folding. */
const READ_HOW = 'every page in reading order: choose Save as PDF in the print dialog';

/** Gap between the pages of a comb-bound spread, as a fraction of a page's width. */
const COMB_GAP = 0.07;

/** The widest Fit width shows a page in the Scroll view, so its lines stay a reading length. */
const SCROLL_MOST = 860;
/** A booklet page's width at its printed size: 5.5 inches at 96 CSS pixels an inch. */
const PAGE_PX = PAGE_W * 96;

export function openBox(title: string, pages: BookPage[], items: BoxItem[], options: BoxOptions = {}): Promise<void> {
  const comb = options.binding === 'comb';
  const trayHeading = options.trayHeading ?? 'What’s in the box';
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
    let stops: ChapterStop[] = [];
    let told: string | undefined; // the piece and chapter last given to the address
    const tell = (chapter: string | undefined, jump = false) => {
      const key = `${current}|${chapter ?? ''}`;
      if (key === told) return;
      told = key;
      options.address?.moved(current, chapter, jump);
    };
    const picker = chapterPicker((s) => turnTo(s.page, true));
    // to a page of the booklet shown (a chapter chosen, a contents row): Back comes back
    const turnTo = (page: number, jump: boolean) => {
      if (!isBook()) return;
      at = Math.max(0, Math.min(total - 1, page));
      showManual(jump);
    };
    const isBook = (id = current) => id === 'manual' || !!items.find((i) => i.id === id)?.pages;
    const openBook = (id: string, p: BookPage[], bound: boolean) => {
      marks.set(bookId, at);
      book = p;
      bookId = id;
      bookComb = bound;
      total = p.length;
      stapled = centerSpread(total);
      at = marks.get(id) ?? 0;
      stops = chapterStops(p);
      picker.use(stops);
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
    let view = readView();
    const toggle = viewToggle(view, (v) => setView(v));
    // the size chosen (kept per browser), else each view's own: a whole page turned, the width scrolled
    let chosen = readSize();
    const sizeNow = (): ReadSize => chosen ?? (view === 'pages' ? 'page' : 'width');
    const sizes = sizeControl(sizeNow(), (s) => ((chosen = s), resized()));
    let percent = 100;
    const shownAt = (p: number) => sizes.shown((percent = p));
    const two = () => view === 'pages' && stage.clientWidth >= 760;

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
    const where = (shown: number[]) =>
      shown[0] === 0
        ? `Cover · ${total - 2} pages`
        : shown[0] === total - 1
          ? 'Back cover'
          : `Page ${shown.join('–')} of ${total - 2}${!bookComb && shown.length === 2 && shown[0] === stapled[0] ? ' · center' : ''}`;
    // ---- the manual scrolled: every page in one column (scrollPages.ts)
    let column: (ScrollPages & { of: BookPage[] }) | undefined;
    const dropColumn = () => {
      if (!column) return;
      column.dispose();
      stage.scrollTop = 0;
      column = undefined;
      stage.classList.remove('gmb-scrolling');
    };
    // a scrolled page's room: the stage less its padding, and less the page number and the nav for a whole page
    const scrollRoom = (): Room => ({
      viewW: stage.clientWidth - 24,
      viewH: stage.clientHeight - 100,
      natural: PAGE_PX,
      ratio: PAGE_H / PAGE_W,
      most: SCROLL_MOST,
    });
    const scrollWidth = () => widthAt(sizeNow(), scrollRoom());
    const fitColumn = () => {
      column?.resize();
      shownAt(percentOf(scrollWidth(), PAGE_PX));
    };
    // the page most in view, as the pages turned would show it
    const reading = (i: number, jump = false) => {
      at = i;
      counter.textContent = where([i]);
      picker.showing(i);
      tell(stopAt(stops, i)?.key || undefined, jump);
    };
    const showScroll = (jump: boolean) => {
      if (column?.of !== book) {
        dropColumn();
        const of = book;
        const last = of.length - 1;
        column = Object.assign(
          scrollPages({
            root: stage,
            count: of.length,
            ratio: () => PAGE_H / PAGE_W,
            width: scrollWidth,
            page: (i) => {
              const el = pageElement(of[i], i);
              linkContents(el, (to) => turnTo(to, true));
              crispShots(el);
              return el;
            },
            label: (i) => (i === 0 ? 'Cover' : i === last ? 'Back cover' : `Page ${i}`),
            showing: (i) => reading(i),
          }),
          { of },
        );
        column.el.classList.add('gmb-pages');
        stage.classList.add('gmb-scrolling');
        stage.replaceChildren(column.el, nav);
        fitColumn();
      }
      column.scrollTo(at);
      reading(at, jump);
    };
    const showManual = (jump = false) => {
      if (view === 'scroll') return showScroll(jump);
      dropColumn();
      const isTwo = two();
      const shown = spreadAt(at, total, isTwo);
      at = shown[0];
      const availW = stage.clientWidth - 24;
      const availH = stage.clientHeight - 64;
      const gap = bookComb ? COMB_GAP * (isTwo ? 1 : 0.5) : 0;
      const across = availW / ((isTwo ? 2 : 1) + gap + (bookComb ? (isTwo ? 0.06 : 0.12) : 0));
      const size = sizeNow();
      const pw = Math.max(120, size === 'page' ? Math.min(across, (availH * PAGE_W) / PAGE_H) : size === 'width' ? across : (PAGE_PX * size) / 100);
      shownAt(percentOf(pw, PAGE_PX));
      spread.style.setProperty('--pw', `${pw}px`);
      spread.replaceChildren(
        ...shown.map((i, k) => {
          const el = pageElement(book[i], i);
          if (shown.length === 2) el.classList.add(k === 0 ? 'left' : 'right');
          else if (isTwo) el.classList.add(i === 0 ? 'right' : 'left');
          el.addEventListener('click', () => go(shown.length === 2 && k === 0 ? -1 : 1));
          linkContents(el, (to) => turnTo(to, true));
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
      counter.textContent = where(shown);
      stage.replaceChildren(spread, nav);
      crispShots(spread);
      picker.showing(shown[shown.length - 1]);
      tell(stopAt(stops, shown[shown.length - 1])?.key || undefined, jump);
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
    // a piece with a reader of its own (the zine, the Level Maps)
    let reader: Reader | undefined;
    const dropReader = () => {
      reader?.dispose?.();
      reader = undefined;
    };
    const showReader = async (item: BoxItem) => {
      stage.replaceChildren(h('p', { class: 'gmb-loading' }, 'Unfolding…'));
      const r = await item.reader!({ view, size: chosen ?? 'width', root: stage, shown: shownAt });
      if (current !== item.id) return r.dispose?.();
      reader = r;
      shownSheets = [];
      stage.replaceChildren(r.el);
      stage.scrollTop = 0;
    };
    const setView = (v: ReadView) => {
      view = v;
      sizes.set(sizeNow());
      sizeShown();
      if (isBook()) showManual();
      else reader?.view(v);
    };
    // the size list: for a booklet either way, and for a piece of its own only scrolled
    const sizeShown = () => {
      const item = items.find((i) => i.id === current);
      sizes.el.hidden = !(isBook() || (item?.reader && view === 'scroll'));
    };
    const resized = () => {
      if (column) fitColumn();
      else if (isBook()) showManual();
      else reader?.size?.(sizeNow());
    };
    const showItem = async (item: BoxItem) => {
      stage.replaceChildren(h('p', { class: 'gmb-loading' }, 'Unfolding…'));
      if (item.live) {
        const view = await item.live();
        if (current !== item.id) return;
        shownSheets = [];
        stage.replaceChildren(view);
        stage.scrollTop = 0;
        return;
      }
      const sheets = await item.render();
      if (current !== item.id) return;
      shownSheets = sheets;
      const wrap = item.screen ? item.screen(sheets) : h('div', { class: 'gmb-sheets' }, ...sheets.map((s) => s.el));
      decorateBbsName(wrap);
      stage.replaceChildren(wrap);
      stage.scrollTop = 0;
      fitSheets();
    };

    // the chapter the box was opened at (options.chapter), or turned to by the address, for its piece
    let wanted = options.start !== undefined && options.chapter ? { piece: options.start, chapter: options.chapter } : undefined;
    const asked = (piece: string) => {
      const w = wanted?.piece === piece ? wanted.chapter : undefined;
      wanted = undefined;
      return w;
    };
    const select = (id: string) => {
      current = id;
      for (const li of tray.children) {
        const on = (li as HTMLElement).dataset.id === id;
        li.classList.toggle('on', on);
        li.querySelector('button')?.setAttribute('aria-current', String(on));
      }
      const item = items.find((i) => i.id === id);
      dropColumn();
      dropReader();
      toggle.el.hidden = !(id === 'manual' || item?.pages || item?.reader);
      sizeShown();
      if (!item?.pages && id !== 'manual') (picker.use([]), tell(undefined));
      filmBtn.hidden = !item?.redFilm;
      if (!item?.redFilm) (film.hide(), lens.hide());
      bookletBtn.firstChild!.textContent = item?.pages ? 'Print booklet: this one' : 'Print booklet: the manual';
      bookletBtn.lastChild!.textContent = !item?.pages && comb ? COMB_HOW : STAPLE_HOW;
      pieceLabel();
      if (id === 'manual') {
        openBook('manual', pages, comb);
        const page = findStop(stops, asked('manual'))?.page;
        if (page !== undefined) at = page;
        showManual();
      } else if (item?.pages) void showBooklet(item);
      else if (item?.reader) void showReader(item);
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
      // turned straight to a chapter (a level check's guide link), else where it was left
      const anchor = item.openAt?.() ?? asked(item.id);
      openBook(item.id, p, false);
      const page = findStop(stops, anchor)?.page;
      if (page !== undefined) at = page; // after openBook, which keeps the page it is open at when it is already open
      showManual();
    };

    // page counts are the numbered pages, as the page turner counts them (the covers aren't numbered)
    const entries: { id: string; title: string; note?: string; icon: string; promised?: boolean }[] = [
      { id: 'manual', title: 'Manual', note: `${pages.length - 2} pages, ${comb ? 'comb-bound' : 'stapled'}`, icon: '📖' },
      ...items,
    ].filter((it) => it.id !== 'manual' || pages.length); // no pages: a folder of extras, no manual
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
        if (mode === 'all' && pages.length) out.push(...manualSingle());
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

    const bookletBtn = h('button', { onclick: () => void print('booklet') }, 'Print booklet: the manual', h('small', null, comb ? COMB_HOW : STAPLE_HOW));
    // a book shown: its pages one after another, to read on screen (a PDF), not folded
    const pieceBtn = h('button', { onclick: () => void print('item') }, 'This piece', h('small', null, ''));
    const pieceLabel = () => {
      const book = isBook();
      pieceBtn.firstChild!.textContent = book ? 'Read on screen' : 'This piece';
      pieceBtn.lastChild!.textContent = book ? READ_HOW : '';
    };
    const menu = h(
      'div',
      { class: 'gmb-print-menu', hidden: true },
      pieceBtn,
      bookletBtn,
      h('button', { onclick: () => void print('all') }, pages.length ? 'Everything in the box' : 'Everything here'),
    );

    // ---- the frame: a modal box; the page under it can't be reached until it closes
    const opener = document.activeElement as HTMLElement | null;
    const shut: HTMLElement[] = [];
    const close = () => {
      dropColumn();
      dropReader();
      for (const el of shut) el.inert = false;
      opener?.focus({ preventScroll: true });
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', onResize);
      unpinch();
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
      if (!sizes.el.hidden && zoomKey(e, sizes, view === 'pages' ? 'page' : 'width')) return;
      const turn = (dir: 1 | -1) => (reader?.step ? reader.step(dir) : go(dir));
      if (e.key === 'ArrowRight') turn(1);
      else if (e.key === 'ArrowLeft') turn(-1);
      else if ((e.key === 'PageDown' || e.key === 'PageUp') && column) stage.scrollBy({ top: (e.key === 'PageDown' ? 0.9 : -0.9) * stage.clientHeight });
      else if (e.key === 'PageDown') turn(1);
      else if (e.key === 'PageUp') turn(-1);
      else if (e.key === 'Home') ((at = 0), isBook() && showManual());
      else if (e.key === 'End' && column) ((at = total - 1), showManual());
      else if (e.key === 'Escape') menu.hidden ? close() : (menu.hidden = true);
      else if ((e.key === 'Enter' || e.key === ' ') && isShot(e.target)) enlarge(e.target);
      else return;
      e.preventDefault();
    };
    // a phone's address bar showing and hiding resizes the window: the Scroll view only refits
    const onResize = () => (column ? fitColumn() : isBook() ? showManual() : fitSheets());
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onResize);
    const unpinch = pinchZoom(
      stage,
      sizes,
      () => percent,
      () => (sizes.el.hidden ? undefined : (column?.el ?? (isBook() ? spread : ((stage.firstElementChild as HTMLElement | null) ?? undefined)))),
    );

    const overlay = h(
      'div',
      { class: 'gmb', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h(
        'div',
        { class: 'gmb-bar' },
        h('strong', null, title),
        h('span', { class: 'gmb-spacer' }),
        toggle.el,
        sizes.el,
        picker.el,
        filmBtn,
        h('div', { class: 'gmb-print-wrap' }, h('button', { onclick: () => (menu.hidden = !menu.hidden), 'aria-haspopup': 'menu' }, '🖨 Print…'), menu),
        h('button', { onclick: close }, 'Close (Esc)'),
      ),
      h('div', { class: 'gmb-main' }, h('nav', { class: 'gmb-tray', 'aria-label': trayHeading }, h('h2', null, trayHeading), tray), stage),
    );
    film.mount(overlay);
    lens.mount(overlay);
    for (const el of document.body.children)
      if (el instanceof HTMLElement && !el.inert) {
        el.inert = true;
        shut.push(el);
      }
    document.body.append(overlay, printRoot);
    if (!pages.length) bookletBtn.hidden = true;
    const first = pages.length ? 'manual' : (items[0]?.id ?? 'manual');
    select(entries.some((e) => e.id === options.start) ? options.start! : first);
    options.address?.attach((piece, chapter) => {
      if (!entries.some((e) => e.id === piece)) return;
      told = `${piece}|${chapter ?? ''}`; // the address already says so
      if (piece !== current) {
        wanted = chapter ? { piece, chapter } : undefined;
        select(piece);
        return;
      }
      const page = isBook() ? (findStop(stops, chapter)?.page ?? (chapter ? undefined : 0)) : undefined;
      if (page !== undefined) turnTo(page, false);
    }, close);
    const picked = tray.querySelector<HTMLElement>('li.on button') ?? tray.querySelector<HTMLElement>('button');
    picked?.focus({ preventScroll: true });
    picked?.scrollIntoView({ block: 'nearest' });
  });
}
