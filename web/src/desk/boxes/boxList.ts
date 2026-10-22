// "In the box": the paper that came in a box, listed beside it in the box viewer, each piece with
// a small picture of itself, opening the box's contents viewer (manual/printables/viewer.ts) at
// that piece. The Game-Maker box (gmBox.ts) and every Sandbox game's box (gameBoxContents.ts)
// share it. On a phone the list folds away behind its "Everything in the box" button.
import './boxList.css';
import { h } from '../../editor/core/ui';
import type { BoxItem } from '../../manual/printables/viewer';

/** The pictures: THUMB_W x THUMB_H, each piece laid out LAYOUT pixels wide and shrunk to fit. */
const THUMB_W = 54;
const THUMB_H = 40;
const LAYOUT = 432;

/**
 * Opens the box's contents viewer (through `open`) and turns to one piece in its tray, once the
 * tray is there (a manual can take a few seconds to lay out).
 */
export function showInBox(open: () => void, id: string): void {
  open();
  const pick = () => {
    const b = document.querySelector<HTMLButtonElement>(`.gmb-tray-list li[data-id="${CSS.escape(id)}"] button`);
    b?.click();
    b?.focus({ preventScroll: true });
    return !!b;
  };
  if (pick()) return;
  const watch = new MutationObserver(() => pick() && watch.disconnect());
  watch.observe(document.body, { childList: true });
  setTimeout(() => watch.disconnect(), 30_000);
}

export interface BoxListOptions {
  /** The landmark's name, e.g. "What’s in the Game-Maker box". */
  label: string;
  /** The pieces to list (the ones laid out beside the box already left out). */
  items: Promise<BoxItem[]>;
  /** Opens the box's contents viewer. */
  open: () => void;
  class?: string;
}

/** The "In the box" panel: a button per piece, its picture coming in when ready, and one for everything. */
export function boxList(o: BoxListOptions): HTMLElement {
  const list = h('ul', { class: 'box-list-items' });
  void o.items.then(async (items) => {
    for (const item of items)
      list.append(
        h(
          'li',
          { dataset: { id: item.id } },
          h(
            'button',
            { class: 'box-list-item', onclick: () => showInBox(o.open, item.id), title: `Look at the ${item.title.toLowerCase()}` },
            h('span', { class: 'box-list-thumb', 'aria-hidden': 'true' }, item.icon),
            h('span', { class: 'box-list-name' }, item.title, item.note ? h('small', null, item.note) : null),
          ),
        ),
      );
    // the pictures, one at a time so the box keeps turning smoothly; none once the box is put away
    let shown = false;
    for (const [i, item] of items.entries()) {
      if (list.isConnected) shown = true;
      else if (shown) return;
      const sheets = await item.render().catch(() => []);
      const first = sheets[0];
      const thumb = list.children[i]?.querySelector('.box-list-thumb');
      if (!first || !thumb) continue;
      // laid out at a readable size and shrunk, so pieces sized in pixels look as they do full size
      first.el.style.width = `${LAYOUT}px`;
      first.el.inert = true; // a picture of the piece: nothing in it to reach
      const tall = (THUMB_W * first.h) / first.w;
      const shrunk = h('span', { class: 'box-list-shrunk', style: `transform: scale(${THUMB_W / LAYOUT}); top: ${Math.max(0, (THUMB_H - tall) / 2)}px` }, first.el);
      thumb.replaceChildren(shrunk);
    }
  });
  return h(
    'nav',
    { class: `box-list${o.class ? ` ${o.class}` : ''}`, 'aria-label': o.label },
    h('h2', null, 'In the box'),
    list,
    h('button', { class: 'box-list-all', onclick: o.open }, 'Everything in the box'),
  );
}
