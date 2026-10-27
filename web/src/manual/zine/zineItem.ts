// NO CARRIER #3, the zine under the desk's toy whistle, as a piece of paper in the box viewer
// (manual/printables/viewer.ts): on screen one quarter-letter leaf at a time (zineLeaf.ts), turned
// with Back and Next, or every leaf in one column to scroll (readView.ts); printed four leaves to a letter sheet, two by two in reading order, with
// dashed lines to cut along and stack. The desk's whistle and the Library open it (openZine).
import { h } from '../../editor/core/ui';
import { sheet, type Sheet } from '../printables/kit';
import type { BoxItem } from '../printables/viewer';
import { ZINE, ZINE_TITLE } from './zinePages';
import { blankLeaf, zineLeaf } from './zineLeaf';
import { unlockAchievement } from '../../achievements';
import type { Reader, ReaderOptions } from '../readView';
import { percentOf, widthAt, type ReadSize } from '../readSize';
import { scrollPages, type ScrollPages } from '../scrollPages';

const TITLE = `${ZINE_TITLE} #3`;

/** The leaves to print, four to a letter sheet. */
function printSheets(): Sheet[] {
  const out: Sheet[] = [];
  for (let at = 0; at < ZINE.length; at += 4) {
    const leaves = [0, 1, 2, 3].map((k) => (at + k < ZINE.length ? zineLeaf(ZINE[at + k], at + k) : blankLeaf()));
    out.push(sheet(8.5, 11, 'zine4', ...leaves.map((l) => l.el)));
  }
  return out;
}

/** The widest Fit width shows a leaf scrolled. */
const SCROLL_MOST = 560;
/** A leaf's width at its printed size: 4.25 inches at 96 CSS pixels an inch. */
const LEAF_PX = 4.25 * 96;

/** One leaf at a time, with Back, Next and where you are; or every leaf in a column (Scroll). */
function turner(o: ReaderOptions): Reader {
  const { root } = o;
  let at = 0;
  let view = o.view;
  let size: ReadSize = o.size;
  const leaves = new Map<number, Sheet>();
  const leafAt = (i: number) => {
    let s = leaves.get(i);
    if (!s) leaves.set(i, (s = zineLeaf(ZINE[i], i)));
    return s;
  };
  const counter = h('span', { 'aria-live': 'polite' });
  const prev = h('button', { type: 'button', onclick: () => go(at - 1) }, '◀ Back');
  const next = h('button', { type: 'button', onclick: () => go(at + 1) }, 'Next ▶');
  const el = h('div', { class: 'zine-turner' });
  const bar = h('div', { class: 'zine-bar' }, prev, counter, next);
  let column: ScrollPages | undefined;
  const reading = (i: number) => {
    at = i;
    counter.textContent = `Page ${at + 1} of ${ZINE.length}`;
    prev.disabled = at === 0;
    next.disabled = at === ZINE.length - 1;
    if (next.disabled) unlockAchievement('zine-read');
  };
  const width = () => widthAt(size, { viewW: root.clientWidth - 56, viewH: root.clientHeight - 100, natural: LEAF_PX, ratio: 5.5 / 4.25, most: SCROLL_MOST });
  const fit = () => {
    column?.resize();
    o.shown(percentOf(width(), LEAF_PX));
  };
  const show = () => {
    el.classList.toggle('scrolled', view === 'scroll');
    if (view === 'pages') {
      column?.dispose();
      column = undefined;
      el.replaceChildren(leafAt(at).el, bar);
      reading(at);
      return;
    }
    if (!column) {
      // fresh leaves for the column: a page let go of far off is drawn again
      column = scrollPages({
        root,
        count: ZINE.length,
        ratio: () => 5.5 / 4.25,
        width,
        page: (i) => zineLeaf(ZINE[i], i).el,
        label: (i) => `Page ${i + 1}`,
        showing: reading,
      });
      el.replaceChildren(column.el, bar);
      fit();
    }
    column.scrollTo(at);
    reading(at);
  };
  const go = (n: number) => {
    at = Math.max(0, Math.min(ZINE.length - 1, n));
    show();
  };
  addEventListener('resize', fit);
  show();
  return {
    el,
    view: (v) => {
      if (v === view) return;
      view = v;
      if (v === 'pages') root.scrollTop = 0;
      show();
    },
    size: (s) => {
      size = s;
      fit();
    },
    step: (dir) => go(at + dir),
    dispose: () => {
      column?.dispose();
      removeEventListener('resize', fit);
    },
  };
}

export function zineItem(): BoxItem {
  return {
    id: 'zine',
    title: TITLE,
    note: `${ZINE.length} quarter-letter pages, four to a sheet`,
    icon: '📠',
    reader: (o) => Promise.resolve(turner(o)),
    render: () => Promise.resolve(printSheets()),
  };
}

/** The zine's cover leaf, for a picture of it (the Library's card). */
export const zineCover = (): Sheet => zineLeaf(ZINE[0], 0);

/** Opens the zine in the box viewer, to read or print; resolves when it is put down. */
export async function openZine(): Promise<void> {
  const { openBox } = await import('../printables/viewer');
  await openBox(TITLE, [], [zineItem()], { trayHeading: 'Under the whistle' });
}
