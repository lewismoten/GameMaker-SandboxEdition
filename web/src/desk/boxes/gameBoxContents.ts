// What came in a Sandbox Software game's box, laid out beside it in the box viewer (like the
// Game-Maker box's Owner's Guide and CD, desk/boxes/gmBox.ts): the disk set to play right away,
// the manual (its own cover, manual/printables/manualCover.ts) and, on the right, the printed
// extras listed as the Game-Maker box lists its inserts (boxList.ts), each opening the manual's
// box at that piece.
import '../../manual/printables/paper.css';
import './gameBoxContents.css';
import { h } from '../../editor/core/ui';
import { warmPack, type CatalogEntry } from '../../project/files';
import { CATALOG_CHANGED } from '../../project/catalogWatch';
import { loadDisks, type Disk } from '../../retro/dos/disks';
import { boxItems } from '../../manual/printables/items';
import { floppyElement, disksIn } from '../disks/diskBox';
import { printContext } from './printContext';
import { boxList } from './boxList';
import { manualCover } from '../../manual/printables/manualCover';
import '../../manual/booklet.css';

let disks: Promise<Disk[]> | undefined;
// a secret game revealed or hidden again: its disks come or go
if (typeof window !== 'undefined') window.addEventListener(CATALOG_CHANGED, () => (disks = undefined));

interface BoxContentsHooks {
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

export function sandboxBoxContents(entry: CatalogEntry, _front: string | undefined, hooks: BoxContentsHooks): HTMLElement {
  const insert = closeViewerThen(hooks.insert);
  const open = closeViewerThen(hooks.open);
  // its paper (the world map, the key card…) reads many of the game's files: all in one go
  warmPack(entry);

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

  // the manual, closed: its own cover (not the box front), the whole page in view
  const manual = entry.original?.manual
    ? h(
        'button',
        { class: 'bc-manual', onclick: open, title: 'Read the manual' },
        h('span', { class: 'mpage mp-cover cover' }, h('span', { class: 'mpage-in' }, manualCover(entry).el)),
        h('span', { class: 'bc-staples', 'aria-hidden': 'true' }),
        h('span', { class: 'bc-label' }, '📖 Manual'),
      )
    : null;

  // the printed pieces, as the manual's box lists them
  const items = printContext(entry).then((ctx) => (ctx ? boxItems(ctx) : []));

  return h(
    'div',
    { class: 'box-contents' },
    h('div', { class: 'bc-left' }, diskSet, manual),
    entry.original?.manual ? boxList({ label: `What’s in the ${entry.title} box`, items, open, class: 'bc-list' }) : null,
  );
}
