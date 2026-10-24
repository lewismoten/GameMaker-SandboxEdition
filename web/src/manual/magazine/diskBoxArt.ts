// The DISK-O-DECK for its hardware ad (sections/hardware.ts), drawn the way the desk draws its
// disk box (desk.ts refreshDisks, desk.css .disk-box): a beige tray with its smoked lid standing
// open at the back, two compartments of 3½" disks in rows (each row behind a little higher,
// smaller and darker), an index card between them, GAMES and MY DISKS on label-maker tape, and
// the round lock in the front wall. Its key lies beside it. A picture only.
import './diskBoxArt.css';
import { h } from '../../editor/core/ui';

/** Disks front to back, [body, label band]: the games on the left, your own on the right. */
const GAMES: [string, string][] = [
  ['#1d4f9c', '#f2c230'],
  ['#d9381e', '#1b1b1b'],
  ['#2f8f3a', '#f2c230'],
  ['#e0b020', '#1d4f9c'],
  ['#6a3ea1', '#e0b020'],
];
const MINE: [string, string][] = [
  ['#2b2b2b', '#1565c0'],
  ['#e8e4d8', '#d9381e'],
  ['#2b2b2b', '#2f8f3a'],
];

/** A row seen from the front and a little above, as the desk stacks them. */
const row = (i: number) => ({ bottom: 8 + i * 10, scale: 1 - i * 0.035, dim: 1 - i * 0.07 });

function stack(colors: [string, string][], x0: number, tabAt = -1): HTMLElement[] {
  return colors
    .map(([c, band], i) => ({ c, band, i, ...row(i) }))
    .reverse()
    .flatMap(({ c, band, i, bottom, scale, dim }) => {
      const disk = h('span', { class: 'mag-dbx-disk', style: `--x:${x0};--b:${bottom};--s:${scale};--dim:${dim};--c:${c};--band:${band}` });
      if (i !== tabAt) return [disk];
      const t = row(i + 0.5);
      return [h('span', { class: 'mag-dbx-tab', style: `--x:${x0};--b:${t.bottom};--s:${t.scale};--dim:${t.dim}` }), disk];
    });
}

export function diskBoxArt(alt: string): HTMLElement {
  return h(
    'div',
    { class: 'mag-dbx', role: 'img', 'aria-label': alt },
    h(
      'span',
      { class: 'mag-dbx-box' },
      h('span', { class: 'mag-dbx-lid' }),
      h('span', { class: 'mag-dbx-back' }),
      h('span', { class: 'mag-dbx-div' }),
      ...stack(GAMES, 17, 2),
      ...stack(MINE, 99),
      h('span', { class: 'mag-dbx-side l' }),
      h('span', { class: 'mag-dbx-side r' }),
      h(
        'span',
        { class: 'mag-dbx-front' },
        h('span', { class: 'mag-dbx-dymo l' }, 'GAMES'),
        h('span', { class: 'mag-dbx-lock' }),
        h('span', { class: 'mag-dbx-dymo r' }, 'MY DISKS'),
      ),
    ),
    h('span', { class: 'mag-dbx-key' }),
  );
}
