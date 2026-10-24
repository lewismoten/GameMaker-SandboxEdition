// The magazine in hand: pages shown two at a time like an open magazine (one at a time on a
// narrow screen, where the page lets its text run long instead of shrinking it), turned with
// the arrows, the keys or a swipe of the contents menu; a Zoom to read one page at full width;
// and printing a page, a spread or the whole issue on letter paper. Every page is laid out at
// one size, a letter sheet at 96 CSS pixels to the inch, and scaled whole to fit the window,
// so its lines break the same at any window size and in print. Its links open the site's
// games, boxes and pages (goRun.ts). On the web it fills the page at #/magazine; on the desk
// it opens over the desk (openMagazine).
import './mag.css';
import { h } from '../../editor/core/ui';
import type { CatalogEntry } from '../../project/files';
import { setHashParams } from '../../urlState';
import { spreadAt, stepSpread } from '../printables/imposition';
import { buildIssue } from './issue';
import { magContext, magGames } from './games';
import { MAG } from './masthead';
import { renderPage, type RenderEnv } from './render';
import { runGo, type DeskHooks } from './goRun';
import type { Where } from './go';
import type { Issue } from './types';

interface Loaded {
  issue: Issue;
  entries: Map<string, CatalogEntry>;
}

let loading: Promise<Loaded> | undefined;

/**
 * The issue, from the games catalog as the site serves it (games/index.json, which never lists
 * a secret game; games.ts drops any an older dev server still lists).
 */
function loadIssue(): Promise<Loaded> {
  loading ??= fetch('./games/index.json')
    .then((r) => (r.ok ? (r.json() as Promise<CatalogEntry[]>) : []))
    .catch(() => [] as CatalogEntry[])
    .then(async (list) => {
      const games = magGames(list);
      const listed = new Set(games.map((g) => g.id));
      return { issue: await buildIssue(magContext(games)), entries: new Map(list.filter((e) => listed.has(e.id)).map((e) => [e.id, e])) };
    });
  loading.catch(() => (loading = undefined));
  return loading;
}

export interface MagazineOptions {
  where: Where;
  /** The page to open at: its id (go:mag) or its number. */
  start?: string;
  desk?: DeskHooks;
  /** Opened over the page: a Close button and Esc call this. */
  onClose?: () => void;
}

/** The size every page is laid out at: 8.5 x 11 inches at 96 CSS pixels to the inch (as printed). */
const PAGE_W = 816;

/** Below this width the magazine shows one page at a time with its text at reading size. */
const NARROW = 640;
/** At least this wide for two pages side by side. */
const TWO = 900;

/** Builds the viewer in `host`; returns its dispose. */
export function mountMagazine(host: HTMLElement, o: MagazineOptions): () => void {
  let issue: Issue | undefined;
  let entries = new Map<string, CatalogEntry>();
  let at = 0;
  let zoom = false;
  const stage = h('div', { class: 'mag-stage', tabindex: 0, role: 'region', 'aria-label': `${MAG.name}, the pages` });
  const counter = h('span', { class: 'mag-counter', 'aria-live': 'polite' });
  const prev = h('button', { type: 'button', class: 'mag-turn', 'aria-label': 'Previous page', onclick: () => go(-1) }, '◀');
  const next = h('button', { type: 'button', class: 'mag-turn', 'aria-label': 'Next page', onclick: () => go(1) }, '▶');
  const zoomBtn = h(
    'button',
    { type: 'button', class: 'mag-zoom', 'aria-pressed': 'false', title: 'Read one page at full width', onclick: () => setZoom(!zoom) },
    '🔍 Zoom',
  );
  const tocList = h('ul', { class: 'mag-toc-list' });
  const toc = h('details', { class: 'mag-toc' }, h('summary', null, '☰ Contents'), h('nav', { 'aria-label': 'Contents' }, tocList));
  const printMenu = h('div', { class: 'mag-print-menu', hidden: true, role: 'menu' });
  const printBtn = h(
    'button',
    { type: 'button', 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-label': 'Print…', onclick: () => togglePrint() },
    h('span', { 'aria-hidden': 'true' }, '🖨'),
    h('span', { class: 'mag-wide-only', 'aria-hidden': 'true' }, ' Print…'),
  );
  const closeBtn = o.onClose ? h('button', { type: 'button', onclick: () => o.onClose?.() }, 'Close (Esc)') : null;
  const root = h(
    'div',
    { class: `mag-viewer where-${o.where}` },
    h(
      'div',
      { class: 'mag-bar' },
      h('strong', { class: 'mag-bar-title' }, MAG.name),
      toc,
      h('span', { class: 'mag-spacer' }),
      prev,
      counter,
      next,
      zoomBtn,
      h('div', { class: 'mag-print-wrap' }, printBtn, printMenu),
      closeBtn,
    ),
    stage,
  );
  host.append(root);
  stage.append(h('p', { class: 'mag-loading' }, 'Opening the magazine…'));

  const env: RenderEnv = { where: o.where, entry: (id) => entries.get(id) };
  const narrow = () => stage.clientWidth < NARROW;
  const two = () => !zoom && !narrow() && stage.clientWidth >= TWO;
  const pageAt = (key?: string) => {
    if (!issue || !key) return -1;
    const byId = issue.pages.findIndex((pg) => pg.id === key);
    return byId >= 0 ? byId : /^\d+$/.test(key) ? Math.min(issue.pages.length - 1, Math.max(0, Number(key) - 1)) : -1;
  };

  const show = () => {
    if (!issue) return;
    const total = issue.pages.length;
    const isTwo = two();
    const shown = spreadAt(at, total, isTwo);
    at = shown[0];
    // a phone's page lets its text run long at reading size; elsewhere a page is scaled whole,
    // to fit the window or (Zoom) its width
    const flow = narrow();
    root.classList.toggle('flow', flow);
    root.classList.toggle('narrow', flow);
    root.classList.toggle('zoomed', zoom && !flow);
    const availW = stage.clientWidth - 24;
    const availH = stage.clientHeight - 24;
    const pw = flow ? availW : zoom ? Math.min(availW, PAGE_W * 1.5) : Math.max(160, Math.min(availW / (isTwo ? 2 : 1), (availH * 8.5) / 11));
    const spread = h('div', {
      class: `mag-spread${shown.length === 1 && isTwo ? (shown[0] === 0 ? ' alone-right' : ' alone-left') : ''}`,
      style: `--pw:${pw}px;--s:${(pw / PAGE_W).toFixed(4)}`,
    });
    for (const i of shown) spread.append(h('div', { class: 'mag-sheet' }, h('div', { class: 'mag-paper' }, renderPage(issue.pages[i], env).el)));
    stage.replaceChildren(spread);
    stage.scrollTop = 0;
    const [first, last] = [issue.pages[shown[0]], issue.pages[shown.at(-1)!]];
    counter.textContent = narrow()
      ? `${first.folio} / ${total}`
      : first.folio === 1
        ? `Cover · ${total} pages`
        : first.kind === 'back'
          ? 'Back cover'
          : shown.length === 2
            ? `Pages ${first.folio}–${last.folio} of ${total}`
            : `Page ${first.folio} of ${total}`;
    prev.disabled = at === 0;
    next.disabled = shown.at(-1) === total - 1;
    for (const li of tocList.querySelectorAll<HTMLElement>('li'))
      li.querySelector('button')?.setAttribute('aria-current', String(shown.some((i) => issue!.pages[i].section === li.dataset.section)));
    if (o.where === 'web') setHashParams({ page: first.folio === 1 ? undefined : first.folio }, ['magazine']);
  };
  const go = (dir: 1 | -1) => {
    if (!issue) return;
    at = stepSpread(at, issue.pages.length, two(), dir);
    show();
  };
  const turnTo = (key: string) => {
    const i = pageAt(key);
    if (i < 0) return;
    at = i;
    show();
    stage.focus({ preventScroll: true });
  };
  const setZoom = (on: boolean) => {
    zoom = on;
    zoomBtn.setAttribute('aria-pressed', String(on));
    show();
  };

  // ---- printing: a page, the spread in view, or the whole issue, a page to a letter sheet
  // the box viewer's and the manual's print rules (paper.css, booklet.css) hide every other part of
  // the page once they have loaded, so the magazine's sheets carry their classes too
  const printRoot = h('div', { class: 'mag-print gmb-print booklet-print' });
  const print = async (which: 'page' | 'spread' | 'all') => {
    togglePrint(false);
    if (!issue) return;
    const shown = spreadAt(at, issue.pages.length, two());
    const list = which === 'all' ? issue.pages : which === 'page' ? [issue.pages[shown[0]]] : shown.map((i) => issue!.pages[i]);
    const made = list.map((pg) => renderPage(pg, env));
    printRoot.replaceChildren(...made.map((m) => h('div', { class: 'mag-print-sheet' }, m.el)));
    document.body.append(printRoot);
    document.documentElement.classList.add('mag-printing');
    await Promise.all(made.map((m) => m.ready));
    await Promise.all([...printRoot.querySelectorAll('img')].filter((i) => i.src).map((i) => i.decode().catch(() => undefined)));
    window.print();
  };
  const afterPrint = () => {
    document.documentElement.classList.remove('mag-printing');
    printRoot.replaceChildren();
    printRoot.remove();
  };
  window.addEventListener('afterprint', afterPrint);
  const item = (label: string, which: 'page' | 'spread' | 'all') => h('button', { type: 'button', role: 'menuitem', onclick: () => void print(which) }, label);
  printMenu.append(item('This page', 'page'), item('The pages in view', 'spread'), item('The whole issue', 'all'));
  const togglePrint = (open = printMenu.hidden) => {
    printMenu.hidden = !open;
    printBtn.setAttribute('aria-expanded', String(open));
  };

  // ---- links: the ones that open something on top run here; the rest are plain links
  root.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-go]');
    if (!a) return;
    const handled = runGo(a.dataset.go!, { where: o.where, desk: o.desk, entry: (id) => entries.get(id), turnTo, close: () => o.onClose?.() });
    if (handled) e.preventDefault();
    else if (o.onClose && a.target !== '_blank') o.onClose(); // leaving for another page: put the magazine down first
  });
  const onKey = (e: KeyboardEvent) => {
    // only while the magazine has the keys (not a box opened from it)
    if (!root.isConnected || !(root.contains(document.activeElement) || document.activeElement === document.body)) return;
    if (e.key === 'Escape') {
      if (!printMenu.hidden) togglePrint(false);
      else if (toc.open) toc.open = false;
      else if (o.onClose) o.onClose();
      else return;
    } else if (e.key === 'ArrowRight' || (e.key === 'PageDown' && !zoom)) go(1);
    else if (e.key === 'ArrowLeft' || (e.key === 'PageUp' && !zoom)) go(-1);
    else if (e.key === 'Home' && !(e.target instanceof HTMLInputElement)) turnTo('1');
    else if (e.key === 'End') turnTo(String(issue?.pages.length ?? 1));
    else return;
    e.preventDefault();
    if (o.onClose) e.stopImmediatePropagation(); // not for the desk's PC underneath
  };
  window.addEventListener('keydown', onKey, true);
  const onResize = () => show();
  window.addEventListener('resize', onResize);

  void loadIssue().then((l) => {
    if (!root.isConnected) return;
    issue = l.issue;
    entries = l.entries;
    for (const e of [...l.issue.toc, ...l.issue.ads.map((a) => ({ ...a, title: `Ad: ${a.title}` }))])
      tocList.append(
        h(
          'li',
          { dataset: { section: e.section } },
          h('button', { type: 'button', onclick: () => ((toc.open = false), turnTo(e.page)) }, h('span', null, e.title), h('small', null, String(e.folio))),
        ),
      );
    at = Math.max(0, pageAt(o.start));
    show();
  });

  return () => {
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('afterprint', afterPrint);
    afterPrint();
    root.remove();
  };
}

/** Opens the magazine over the page (the desk); resolves when it is put down. */
export function openMagazine(o: Omit<MagazineOptions, 'onClose'>): Promise<void> {
  return new Promise((resolve) => {
    const opener = document.activeElement as HTMLElement | null;
    const shut: HTMLElement[] = [];
    const overlay = h('div', { class: 'mag-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': `${MAG.name} magazine` });
    let dispose = () => {};
    let open = true;
    const close = () => {
      if (!open) return;
      open = false;
      dispose();
      overlay.remove();
      for (const el of shut) el.inert = false;
      opener?.focus({ preventScroll: true });
      resolve();
    };
    for (const el of document.body.children)
      if (el instanceof HTMLElement && !el.inert) {
        el.inert = true;
        shut.push(el);
      }
    document.body.append(overlay);
    dispose = mountMagazine(overlay, { ...o, onClose: close });
    overlay.querySelector<HTMLElement>('.mag-stage')?.focus({ preventScroll: true });
  });
}

/** The web's #/magazine page: the viewer filling the page, at ?page=<n>. Returns its dispose. */
export function renderMagazinePage(el: HTMLElement, start?: string): () => void {
  el.replaceChildren();
  const main = h('main', { class: 'mag-main', 'aria-label': `${MAG.name} magazine` }, h('h1', { class: 'mag-sr' }, `${MAG.name}: ${MAG.tagline}`));
  el.append(main);
  return mountMagazine(main, { where: 'web', start });
}
