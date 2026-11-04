// WATCH YOUR STEP's hazard blocks, added to the Starter block set after the signs:
//   spikeUp   spikes you can walk into: 10 hit points once, then they lie flat
//   spikeFlat what a spike becomes when touched: harmless (the "touch" rule, as a coin goes)
//   waterTop, water   a pool: touching it takes more hit points than the hero has, which costs a life
// None of them is solid, so nothing holds the hero while it hurts. The kit's own spikes block is
// solid and keeps hurting; these two-step spikes are the gentle kind.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { PULL, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** Hit points a spike takes, once. */
export const SPIKE_HURT = -10;
/** Hit points a pool takes: far more than the hero has, so the touch is a lost life. */
export const POOL_HURT = -200;

function spikes(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const s = pal.r('stone');
  p.rect(0, 16, 20, 4, s[1]).rect(0, 16, 20, 1, s[3]);
  for (const x of [1, 7, 13]) {
    for (let y = 0; y < 16; y++) {
      const half = Math.ceil(((y + 1) / 16) * 3);
      p.rect(x + 3 - half, y, half * 2, 1, y < 4 ? s[4] : s[3]);
    }
    for (let y = 0; y < 16; y++) p.set(x + 3 + Math.ceil(((y + 1) / 16) * 3) - 1, y, s[2]);
  }
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** The same three spikes, bent over flat and blunt. */
function flat(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const s = pal.r('stone');
  p.rect(0, 16, 20, 4, s[1]).rect(0, 16, 20, 1, s[3]);
  for (const x of [1, 7, 13]) {
    p.rect(x, 13, 6, 3, s[3])
      .rect(x, 13, 6, 1, s[4])
      .rect(x + 4, 13, 2, 3, s[2]);
  }
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** A pool cell: the top one shows the surface (waves and a glint) under a little sky, the deep one is plain. */
function pool(pal: Pal, top: boolean): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const b = pal.r('blue');
  const y0 = top ? 4 : 0;
  p.rect(0, y0, 20, 20 - y0, b[2]);
  if (top) {
    p.rect(0, y0, 20, 2, b[4]);
    for (const x of [1, 6, 11, 16]) p.rect(x, y0 - 1, 3, 1, b[4]).rect(x + 1, y0 - 2, 1, 1, b[4]);
    for (const x of [3, 12]) p.rect(x, y0 + 4, 3, 1, b[4]);
  } else {
    for (const [x, y] of [
      [4, 4],
      [13, 9],
      [8, 15],
    ] as const)
      p.rect(x, y, 3, 1, b[3]);
    p.rect(0, 17, 20, 3, b[1]);
  }
  return p;
}

/** Adds the hazard blocks to `book` (call after the signs). */
export function addHazards(book: Book, pal: Pal): void {
  const air = { grav: PULL.down };
  book.add('spikeUp', spikes(pal), { ...air, hp: SPIKE_HURT, touch: 'spikeFlat' });
  book.add('spikeFlat', flat(pal), air);
  book.add('waterTop', pool(pal, true), { ...air, hp: POOL_HURT });
  book.add('water', pool(pal, false), { ...air, hp: POOL_HURT });
}
