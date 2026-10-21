// A paper manual viewer: two-page spreads (one page on narrow screens), flipping with
// arrows/clicks, and printing every page.
import './booklet.css';
import { h } from '../editor/core/ui';
import { decorateBbsName } from '../retro/bbs/bbsName';

export interface BookletPage {
  /** Page content (inside the margins). */
  body: HTMLElement | HTMLElement[];
  cover?: boolean;
  /** Running head text for this page (book title / chapter). */
  head?: [string, string];
}

function pageElement(p: BookletPage, index: number): HTMLElement {
  const inner = h('div', { class: 'mpage-in' });
  if (p.head) inner.append(h('div', { class: 'runhead' }, h('span', null, p.head[0]), h('span', null, p.head[1])));
  inner.append(...(Array.isArray(p.body) ? p.body : [p.body]));
  if (!p.cover) inner.append(h('div', { class: 'folio' }, String(index)));
  decorateBbsName(inner);
  return h('section', { class: `mpage ${p.cover ? 'cover' : ''}` }, inner);
}

export function openBooklet(pages: BookletPage[], title: string): Promise<void> {
  return new Promise((resolve) => {
    const spread = h('div', { class: 'booklet-spread', 'aria-live': 'polite' });
    const counter = h('span');
    let at = 0; // index of the left (or only) page
    const two = () => window.innerWidth >= 900;

    const show = () => {
      const perSpread = two() ? 2 : 1;
      // The cover stands alone; after it, spreads are (1,2), (3,4)…
      if (perSpread === 2 && at > 0 && at % 2 === 0) at -= 1;
      const shown = at === 0 ? [0] : perSpread === 2 ? [at, at + 1].filter((i) => i < pages.length) : [at];
      spread.replaceChildren(
        ...shown.map((i, k) => {
          const el = pageElement(pages[i], i);
          if (shown.length === 2) el.classList.add(k === 0 ? 'left' : 'right');
          el.addEventListener('click', () => go(k === 0 && shown.length === 2 ? -1 : 1));
          return el;
        }),
      );
      spread.style.setProperty('--pages', String(shown.length));
      counter.textContent = at === 0 ? `Cover · ${pages.length - 1} pages` : `Page ${shown.join('–')} of ${pages.length - 1}`;
    };
    const go = (dir: number) => {
      const step = two() ? (at === 0 ? 1 : 2) : 1;
      at = Math.max(0, Math.min(pages.length - 1, dir > 0 ? at + step : at - (two() && at === 1 ? 1 : step)));
      show();
    };
    const close = () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', show);
      overlay.remove();
      printCopy.remove();
      resolve();
    };
    const onKey = (e: KeyboardEvent) => {
      e.stopImmediatePropagation(); // not for the PC underneath
      if (e.key === 'ArrowRight' || e.key === 'PageDown') go(1);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(-1);
      else if (e.key === 'Home') (at = 0), show();
      else if (e.key === 'Escape') close();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', show);

    const printCopy = h('div', { class: 'booklet-print', 'aria-hidden': 'true' }, ...pages.map((p, i) => pageElement(p, i)));
    const overlay = h(
      'div',
      { class: 'booklet', role: 'dialog', 'aria-label': title },
      spread,
      h(
        'div',
        { class: 'booklet-controls' },
        h('button', { onclick: () => go(-1), 'aria-label': 'Previous page' }, '◀'),
        counter,
        h('button', { onclick: () => go(1), 'aria-label': 'Next page' }, '▶'),
        h('button', { onclick: () => window.print() }, 'Print'),
        h('button', { onclick: close }, 'Close (Esc)'),
      ),
    );
    document.body.append(overlay, printCopy);
    show();
  });
}
