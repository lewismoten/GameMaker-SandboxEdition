// How the site's documents are read (the box viewer, the zine, TURBO BUTTON): a page at a time
// (Pages) or every page stacked in one scrolling column (Scroll, scrollPages.ts). A phone reads
// in Scroll unless told otherwise and a larger screen in Pages; the visitor's choice is kept per
// browser. viewToggle is the Pages | Scroll pair in a viewer's bar.
import './readView.css';
import { h } from '../editor/core/ui';
import { holdNow, type Hold } from '../phoneScreen';
import type { ReadSize } from './readSize';

export type ReadView = 'pages' | 'scroll';

const KEY = 'gm-read-view';

/** The view a screen reads in when the visitor hasn't chosen: Scroll on a phone. */
export function viewFor(saved: string | null | undefined, hold: Hold): ReadView {
  if (saved === 'pages' || saved === 'scroll') return saved;
  return hold === 'off' ? 'pages' : 'scroll';
}

/** The view to open a document in. */
export function readView(): ReadView {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    /* no storage (a private window): the default */
  }
  return viewFor(saved, holdNow());
}

function rememberView(view: ReadView): void {
  try {
    localStorage.setItem(KEY, view);
  } catch {
    /* no storage: chosen for this document only */
  }
}

/** The Pages | Scroll pair. `pick` hears the visitor's choice (already remembered). */
export function viewToggle(start: ReadView, pick: (view: ReadView) => void): { el: HTMLElement; set(view: ReadView): void } {
  let view = start;
  const button = (v: ReadView, label: string, title: string) =>
    h(
      'button',
      {
        type: 'button',
        class: 'rv-choice',
        title,
        'aria-pressed': String(v === view),
        onclick: () => {
          if (v === view) return;
          set(v);
          rememberView(v);
          pick(v);
        },
      },
      label,
    );
  const pages = button('pages', 'Pages', 'One page at a time, turned with Back and Next');
  const scroll = button('scroll', 'Scroll', 'Every page in one column to scroll through');
  const set = (v: ReadView) => {
    view = v;
    pages.setAttribute('aria-pressed', String(v === 'pages'));
    scroll.setAttribute('aria-pressed', String(v === 'scroll'));
  };
  return { el: h('span', { class: 'rv-toggle', role: 'group', 'aria-label': 'Read as' }, pages, scroll), set };
}

/** How a piece's own view is opened (the box viewer's BoxItem.reader). */
export interface ReaderOptions {
  view: ReadView;
  /** The size scrolled pages are shown at (readSize.ts). */
  size: ReadSize;
  /** The scrolling stage the view sits in. */
  root: HTMLElement;
  /** The percent of its printed size the page in view is shown at, for the size control. */
  shown(percent: number): void;
}

/** A piece's own on-screen view that reads both ways (the box viewer's BoxItem.reader). */
export interface Reader {
  el: HTMLElement;
  /** Switches the view, keeping the page being read. */
  view(view: ReadView): void;
  /** Shows the scrolled pages at another size, keeping the page being read. */
  size?(size: ReadSize): void;
  /** Back or Next (the arrow keys). */
  step?(dir: 1 | -1): void;
  dispose?(): void;
}
