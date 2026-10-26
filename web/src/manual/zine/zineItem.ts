// NO CARRIER #3, the zine under the desk's toy whistle, as a piece of paper in the box viewer
// (manual/printables/viewer.ts): on screen one quarter-letter leaf at a time (zineLeaf.ts), turned
// with Back and Next; printed four leaves to a letter sheet, two by two in reading order, with
// dashed lines to cut along and stack. The desk's whistle and the Library open it (openZine).
import { h } from '../../editor/core/ui';
import { sheet, type Sheet } from '../printables/kit';
import type { BoxItem } from '../printables/viewer';
import { ZINE, ZINE_TITLE } from './zinePages';
import { blankLeaf, zineLeaf } from './zineLeaf';
import { unlockAchievement } from '../../achievements';

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

/** One leaf at a time, with Back, Next and where you are. */
function turner(): HTMLElement {
  let at = 0;
  const leaves = new Map<number, Sheet>();
  const leafAt = (i: number) => {
    let s = leaves.get(i);
    if (!s) leaves.set(i, (s = zineLeaf(ZINE[i], i)));
    return s;
  };
  const counter = h('span', { 'aria-live': 'polite' });
  const prev = h('button', { type: 'button', onclick: () => go(at - 1) }, '◀ Back');
  const next = h('button', { type: 'button', onclick: () => go(at + 1) }, 'Next ▶');
  const view = h('div', { class: 'zine-turner' });
  const bar = h('div', { class: 'zine-bar' }, prev, counter, next);
  const go = (n: number) => {
    at = Math.max(0, Math.min(ZINE.length - 1, n));
    view.replaceChildren(leafAt(at).el, bar);
    counter.textContent = `Page ${at + 1} of ${ZINE.length}`;
    prev.disabled = at === 0;
    next.disabled = at === ZINE.length - 1;
    if (next.disabled) unlockAchievement('zine-read');
  };
  go(0);
  return view;
}

export function zineItem(): BoxItem {
  return {
    id: 'zine',
    title: TITLE,
    note: `${ZINE.length} quarter-letter pages, four to a sheet`,
    icon: '📠',
    live: () => Promise.resolve(turner()),
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
