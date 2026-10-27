// The ? Guides button and its menu, in today's web header, the desk's and the DOS page's: show
// me around this page, keep the guides waiting on this page (remembered per page), watch or
// record the whole tour. Also a tour asked for in the address (#/?tour=all, #/?tour=home&record,
// dos.html?tour=dos). The tour itself is its own download (tourStart.ts), loaded only when one
// starts or the guides wait on the page shown.
import './tourButton.css';
import { h } from '../editor/core/ui';
import { currentRoute, withParams } from '../urlState';
import { CHAPTER_PAGES, guidesOn, onDosPage, pageHere, setGuidesOn, tourRequest } from './tourPages';
import type { PageKey } from './steps';

const tour = () => import('./tourStart');

/** Starts the whole tour (Settings' item, the menu's). */
export const watchWholeTour = (record = false): void => void tour().then((m) => m.startTour('all', { record }));

/** The Settings menu's item for the whole tour. */
export const wholeTourItem = (attrs: Record<string, string> = {}): HTMLElement =>
  h(
    'button',
    { ...attrs, type: 'button', onclick: () => watchWholeTour(), title: 'Teddy and Gwinn show you around the whole site' },
    h('span', { 'aria-hidden': 'true' }, '▶'),
    ' Guided tour',
  );

const hasChapter = (page: PageKey | undefined) => !!page && CHAPTER_PAGES.includes(page);

/**
 * The ? button and its menu (arrow keys, Home and End move through it; Escape closes it).
 * `look`: a class for the button in the bar it sits in (the DOS page's dos-btn).
 */
export function tourButton(look = 'topbar-gear'): HTMLElement {
  watchPages();
  const button = h(
    'button',
    {
      type: 'button',
      class: `${look} tour-btn`,
      'aria-label': 'Guides',
      'aria-haspopup': 'menu',
      'aria-expanded': 'false',
      'aria-controls': 'tour-menu',
      title: 'Guides: a tour of this page by the characters from the games',
    },
    h('span', { 'aria-hidden': 'true' }, '?'),
  );
  const here = h('button', { type: 'button', role: 'menuitem', tabindex: '-1', onclick: () => startHere() }, 'Show me around this page');
  const wait = h(
    'button',
    { type: 'button', role: 'menuitemcheckbox', tabindex: '-1', 'aria-checked': 'false', onclick: () => toggleWait() },
    'Guides wait on this page',
  );
  const whole = h('button', { type: 'button', role: 'menuitem', tabindex: '-1', onclick: () => watchWholeTour() }, 'Watch the whole tour');
  const record = h(
    'button',
    {
      type: 'button',
      role: 'menuitem',
      tabindex: '-1',
      onclick: () => watchWholeTour(true),
      title: 'For screen recordings: no pointer or buttons, a title card for each chapter. Space pauses, Esc ends.',
    },
    'Record the whole tour',
  );
  const items = [here, wait, whole, record];
  const menu = h('div', { id: 'tour-menu', class: 'topbar-menu', role: 'menu', 'aria-label': 'Guides', hidden: true }, ...items);
  const wrap = h('div', { class: 'tour-wrap' }, button, menu);

  const page = pageHere;
  const startHere = () => void tour().then((m) => m.startTour(undefined, { page: page() }));
  const toggleWait = () => {
    const p = page();
    if (!p || !hasChapter(p)) return;
    setGuidesOn(p, !guidesOn(p));
    showWait();
    void dockFor(p);
  };
  const showWait = () => {
    const p = page();
    const can = hasChapter(p);
    here.disabled = wait.disabled = !can;
    here.textContent = can ? 'Show me around this page' : 'No tour for this page yet';
    wait.setAttribute('aria-checked', String(can && guidesOn(p)));
    wait.textContent = `${can && guidesOn(p) ? '☑' : '☐'} Guides wait on this page`;
  };

  const usable = () => items.filter((b) => !b.disabled);
  const isOpen = () => !menu.hidden;
  const focusItem = (i: number) => {
    const list = usable();
    list[(i + list.length) % list.length]?.focus();
  };
  const open = (at: number) => {
    showWait();
    menu.hidden = false;
    // the DOS page's bar scrolls sideways on a phone and would cut it off: placed by the window there (and on the desk's wall)
    if (button.closest('.dos-bar, .desk-bar')) {
      const r = button.getBoundingClientRect();
      menu.style.top = `${r.bottom + 6}px`;
      menu.style.right = `${Math.max(8, innerWidth - r.right)}px`;
    }
    button.setAttribute('aria-expanded', 'true');
    focusItem(at);
  };
  const close = (refocus: boolean) => {
    if (!isOpen()) return;
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (refocus) button.focus();
  };
  button.addEventListener('click', () => (isOpen() ? close(false) : open(0)));
  button.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      open(e.key === 'ArrowDown' ? 0 : -1);
    }
  });
  menu.addEventListener('keydown', (e) => {
    const i = usable().indexOf(document.activeElement as HTMLButtonElement);
    const to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: -1 }[e.key];
    if (to !== undefined) {
      e.preventDefault();
      focusItem(to);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
    } else if (e.key === 'Tab') close(false);
  });
  // the checkbox stays open to show its tick; the others start something
  menu.addEventListener('click', (e) => {
    if ((e.target as Element).closest('[role=menuitem]')) close(false);
  });
  const outside = (e: MouseEvent) => {
    if (!wrap.isConnected) document.removeEventListener('click', outside);
    else if (!wrap.contains(e.target as Node)) close(false);
  };
  document.addEventListener('click', outside);
  return wrap;
}

/** The guides wait on a page they were turned on for, and nowhere else. */
async function dockFor(page: PageKey | undefined): Promise<void> {
  if (page && hasChapter(page) && guidesOn(page)) {
    dockLoaded = true;
    await (await tour()).showDock(page);
  } else if (dockLoaded) (await tour()).hideDock(true);
}
let dockLoaded = false;

let watching = false;

/** Follows the address: a tour it asks for starts, and the guides wait where they were turned on. */
function watchPages(): void {
  if (watching) return;
  watching = true;
  const check = () => {
    const dos = onDosPage();
    const req = tourRequest(location.hash, dos ? location.search : '');
    if (req) {
      // the request leaves the address, so a reload doesn't start it again
      if (dos) {
        const q = new URLSearchParams(location.search);
        for (const k of ['tour', 'record', 'cont']) q.delete(k);
        history.replaceState(history.state, '', `${location.pathname}${q.size ? `?${q}` : ''}${location.hash}`);
      } else
        history.replaceState(
          history.state,
          '',
          `${location.pathname}${location.search}${withParams(currentRoute(), { tour: undefined, record: undefined, cont: undefined })}`,
        );
      void tour().then((m) => m.startTour(req.chapters, { record: req.record, cont: req.cont }));
      return;
    }
    void dockFor(pageHere());
  };
  window.addEventListener('hashchange', check);
  // after the page's first render has begun
  setTimeout(check, 0);
}
