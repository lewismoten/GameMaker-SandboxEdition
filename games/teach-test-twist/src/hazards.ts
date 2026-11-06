// TEACH, TEST, TWIST's spikes (copied from Watch Your Step, where they are explained): spikes you can
// walk into cost 10 hit points once, then lie flat (the block's "touch" rule). Not solid, so nothing
// holds the hero while it hurts.
//   spikeUp    three stone spikes
//   spikeFlat  what a spike becomes when touched: harmless
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { PULL, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** Hit points a spike takes, once. */
export const SPIKE_HURT = -10;

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
  for (const x of [1, 7, 13])
    p.rect(x, 13, 6, 3, s[3])
      .rect(x, 13, 6, 1, s[4])
      .rect(x + 4, 13, 2, 3, s[2]);
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** Adds the spike blocks to `book`. */
export function addHazards(book: Book, pal: Pal): void {
  const air = { grav: PULL.down };
  book.add('spikeUp', spikes(pal), { ...air, hp: SPIKE_HURT, touch: 'spikeFlat' });
  book.add('spikeFlat', flat(pal), air);
}
