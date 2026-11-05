// SHOW THE COUNT's own blocks, added to the Starter block set before the signs:
//   bulbOff   a dark bulb in a little socket: touch it and counter 22 goes up by one, and the bulb
//             turns into bulbOn (passable both ways, so Lena walks through)
//   bulbOn    the same bulb lit and glowing. It stays: a row of them is the meter
//   gateFive  a stout gate with five empty slots: solid, and a touch takes 5 off counter 22. With
//             fewer than 5 the touch is refused and the gate stays shut; with 5 it becomes sky.
//   gateSix   the same with six slots, for the exit of level 2
//   meterTop  the arch over a gate (passable)
// Nothing here knows what a meter is: a bulb only adds one to a counter and changes its own
// picture. The count itself can never be printed; the lit bulbs are how it is shown.
// The hero's counter 22 starts at 1 (a counter shows one less than it holds).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { archPicture } from '../../kit/starter/locks';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** The counter a bulb adds to and a gate spends. */
export const COUNT = 22;

/** A bulb in a socket on a short stem: dark glass, or lit gold with a glow. */
function bulbPicture(pal: Pal, lit: boolean): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const s = pal.r('stone');
  const g = pal.r('gold');
  // the socket
  p.rect(6, 13, 8, 6, ink).rect(7, 14, 6, 4, s[2]).rect(7, 14, 6, 1, s[4]);
  // the glass
  p.disc(9.5, 8, 6.5, ink);
  if (lit) {
    p.disc(9.5, 8, 5.5, g[3])
      .disc(9.5, 8, 4, g[4])
      .disc(9.5, 8, 2.2, g[g.length - 1]);
    for (const [x, y] of [
      [9, 0],
      [0, 8],
      [18, 8],
      [2, 2],
      [16, 2],
    ] as const)
      p.set(x, y, g[4]).set(x + 1, y, g[4]);
  } else {
    p.disc(9.5, 8, 5.5, s[2]).disc(9.5, 8, 4, s[3]);
    p.rect(5, 5, 2, 3, s[4]);
  }
  p.rect(8, 12, 4, 2, ink);
  return p;
}

/** A gate with `n` slots (5 or 6) on a stone plate: each slot is a gold-rimmed opening that waits for the count. */
function gatePicture(pal: Pal, n: 5 | 6): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const s = pal.r('stone');
  const b = pal.r('blue');
  const g = pal.r('gold');
  p.rect(0, 0, 20, 20, ink).rect(1, 0, 18, 19, b[1]);
  p.rect(1, 0, 18, 1, b[3]).rect(1, 18, 18, 1, b[0]);
  for (const x of [5, 13]) p.rect(x, 1, 1, 17, b[0]).rect(x + 1, 1, 1, 17, b[2]);
  p.rect(2, 4, 16, 13, ink).rect(3, 5, 14, 11, s[3]).rect(3, 5, 14, 1, s[4]);
  const at: [number, number][] =
    n === 6
      ? [
          [5, 8],
          [10, 8],
          [15, 8],
          [5, 14],
          [10, 14],
          [15, 14],
        ]
      : [
          [5, 8],
          [10, 8],
          [15, 8],
          [7, 14],
          [13, 14],
        ];
  for (const [x, y] of at) p.rect(x - 2, y - 2, 4, 4, g[3]).rect(x - 1, y - 1, 2, 2, ink);
  return p;
}

/** Adds the bulbs and the two gates to `book` (after addStarterBlocks). */
export function addMeterBlocks(book: Book, pal: Pal): void {
  book.add('bulbOff', bulbPicture(pal, false), { grav: PULL.down, effect: COUNT, eamt: 1, touch: 'bulbOn' });
  book.add('bulbOn', bulbPicture(pal, true), { grav: PULL.down });
  book.add('gateFive', gatePicture(pal, 5), { solid: SOLID, effect: COUNT, eamt: -5, touch: 'sky' });
  book.add('gateSix', gatePicture(pal, 6), { solid: SOLID, effect: COUNT, eamt: -6, touch: 'sky' });
  book.add('meterTop', archPicture(pal, 'gold'), { grav: PULL.down });
}
