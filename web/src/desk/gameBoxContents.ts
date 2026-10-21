// What came in a Sandbox Software game's box, laid out beside it in the box viewer (like the
// Game-Maker box's Owner's Guide and CD, desk/gmBox.ts): the disk set to play right away,
// the manual, a few of the printed extras fanned out (manual/printables, read only) and a
// way to look through all of it.
import './gameBoxContents.css';
import '../manual/printables/paper.css';
import { h } from '../editor/core/ui';
import type { CatalogEntry } from '../project/files';
import { loadDisks, type Disk } from '../retro/disks';
import { boxItems } from '../manual/printables/items';
import { floppyElement, disksIn } from './diskBox';
import { printContext } from './printContext';

let disks: Promise<Disk[]> | undefined;

export interface BoxContentsHooks {
  /** Put disk 1 in drive A: (and play). */
  insert: () => void;
  /** The manual and everything else in the box (manual/gameManual.ts). */
  open: () => void;
}

/** Closes the box viewer this sits in, then does `then`. */
const closeViewerThen = (then: () => void) => () => {
  document.querySelector<HTMLButtonElement>('.box-viewer-bar button:last-child')?.click();
  then();
};

export function sandboxBoxContents(entry: CatalogEntry, front: string | undefined, hooks: BoxContentsHooks): HTMLElement {
  const insert = closeViewerThen(hooks.insert);
  const open = closeViewerThen(hooks.open);

  // the disks: disk 1 in front, the rest of the set fanned behind it
  const diskSet = h('button', { class: 'bc-disks', onclick: insert, title: 'Put disk 1 in drive A: and play' });
  disks ??= loadDisks().catch(() => []);
  void disks.then((all) => {
    const d = all.find((x) => x.id === `cd:${entry.id}`);
    if (!d) return diskSet.remove();
    const n = disksIn(d);
    for (let k = n; k >= 1; k--) {
      const f = floppyElement(d, true, k);
      const back = k - 1;
      f.style.transform = `translate(${back * 9}px, ${-back * 7}px) rotate(${back * 3}deg)`;
      f.style.zIndex = String(n - k);
      diskSet.append(f);
    }
    diskSet.append(h('span', { class: 'bc-label' }, n > 1 ? `▶ Play: ${n} disks, disk 1 goes in A:` : '▶ Play: put the disk in A:'));
  });

  const manual = entry.original?.manual
    ? h(
        'button',
        { class: 'bc-manual', onclick: open, title: 'Read the manual' },
        front ? h('img', { src: front, alt: '' }) : h('b', null, entry.title),
        h('span', { class: 'bc-staples', 'aria-hidden': 'true' }),
        h('span', { class: 'bc-label' }, '📖 Manual'),
      )
    : null;

  // a few of the printed pieces, fanned out like they came out of the box
  const fan = h('button', { class: 'bc-fan', onclick: open, title: 'Look at everything in the box' });
  void printContext(entry).then(async (ctx) => {
    if (!ctx) return fan.remove();
    const items = boxItems(ctx);
    const pick = ['keycard', 'postcard', items[0]?.id, 'newsletter'].filter((id, i, a): id is string => !!id && a.indexOf(id) === i);
    const chosen = pick
      .map((id) => items.find((i) => i.id === id))
      .filter((i) => !!i)
      .slice(0, 3);
    const sheets = await Promise.all(
      chosen.map((i) =>
        i!
          .render()
          .then((s) => s[0])
          .catch(() => undefined),
      ),
    );
    sheets.forEach((s, i) => {
      if (!s) return;
      const piece = h('div', { class: 'bc-piece', style: `--i:${i}` }, s.el);
      fan.append(piece);
    });
  });

  return h(
    'div',
    { class: 'box-contents' },
    h('div', { class: 'bc-left' }, diskSet, manual),
    h('div', { class: 'bc-right' }, fan, h('button', { class: 'bc-all', onclick: open }, 'View everything in the box')),
  );
}
