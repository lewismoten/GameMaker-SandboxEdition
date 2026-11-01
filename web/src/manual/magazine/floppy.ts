// The cover-mounted floppy of the spring issue (types.ts 'floppy' block): a 3.5" disk taped in a
// clear sleeve to the front cover, as magazines mounted theirs. The disk is the desk disk box's
// own floppy with the game's real printed label (desk/disks/diskLabel.ts), so the picture on it
// comes from the game's files. The whole disk is one link; on the cover it carries a starburst.
import './disc.css';
import './floppy.css';
import { h } from '../../editor/core/ui';
import { printedDiskLabel } from '../../desk/disks/diskLabel';
import type { CatalogEntry } from '../../project/files';
import type { Go } from './go';
import type { Block, Inline } from './types';

type FloppyBlock = Extract<Block, { t: 'floppy' }>;

/** The disk itself: shutter, printed label, write-protect and high-density holes. */
function disk(entry: CatalogEntry | undefined): HTMLElement {
  return h(
    'div',
    { class: 'floppy mag-floppy-disk', style: '--body:#2b3a55;--stripe:#c62828' },
    h('div', { class: 'shutter' }),
    entry ? printedDiskLabel(entry, '© 1993') : h('div', { class: 'label' }),
    h('div', { class: 'wp' }),
    h('div', { class: 'density-hole' }),
    h('div', { class: 'hd' }, 'HD'),
  );
}

/** The disk in its sleeve: a figure with the disk as its link, two strips of tape, and the caption. */
export function floppyFigure(
  b: FloppyBlock,
  entry: CatalogEntry | undefined,
  link: (go: Go, ...kids: (Node | string)[]) => HTMLAnchorElement,
  text: (t: Inline) => Node[],
): HTMLElement {
  const sleeve = h(
    'span',
    { class: 'mag-floppy-sleeve', 'aria-hidden': 'true' },
    disk(entry),
    h('span', { class: 'mag-floppy-flap' }),
    h('i', { class: 'tape t1' }),
    h('i', { class: 'tape t2' }),
  );
  const a = link(b.go, h('span', { class: 'sr-only' }, b.alt), sleeve);
  a.classList.add('mag-floppy-link');
  a.title = b.alt;
  const burst = b.cover ? link(b.cover.page, b.cover.burst) : null;
  burst?.classList.add('mag-disc-burst');
  return h('figure', { class: `mag-floppy${b.cover ? ' on-cover' : ''}` }, a, burst, b.caption ? h('figcaption', null, ...text(b.caption)) : null);
}
