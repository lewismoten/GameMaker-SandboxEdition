// Locks and silver keys for the Starters that teach keys and doors (an extra set a game adds
// after addStarterBlocks, so the shared block numbers stay as they are).
//
//   keySilver       a silver key: touch it and counter 21 goes up by one
//   gateTop         the arch over a gate (passable: you walk under it)
//   gate            a gold gate, one block high: solid until you carry a gold key (counter 20).
//                   Touch it with a key and the counter goes down by one and the gate is gone.
//   gateTopSilver, gateSilver   the same for a silver key (counter 21)
//
// The rule is on the block, not in any code: "Effect counter" and "Effect amount" in the
// Blocks tab. A counter from 20 up refuses a touch that would leave it empty, so with no key
// the gate stays shut. Put a gate under a brick wall with a gap of two blocks (the arch over
// the gate) and the hero cannot jump over it. The hero's counter must start at 1 (it shows one
// less): set `ch.meter[SILVER_KEYS] = 1` on the character.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, PULL, SOLID } from './book';
import { KEYS } from './blocks';
import { skyOf, type Pal } from './palette';

/** The counter a silver key adds to. */
export const SILVER_KEYS = KEYS + 1;

export type Ramp = 'gold' | 'white' | 'green';

/** The key's shape in a ramp, with a dark outline so a silver key shows on the sky. */
export function keyPicture(pal: Pal, ramp: Ramp): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const m = pal.r(ramp);
  const hi = m[m.length - 1];
  const ink = pal.c('ink', 0);
  const face = m[ramp === 'gold' ? 4 : 3];
  p.disc(5.5, 9.5, 5.5, ink).disc(5.5, 9.5, 4.5, face).disc(5.5, 9.5, 2.2, ink).disc(5.5, 9.5, 1.4, skyOf(pal));
  p.rect(9, 8, 10, 4, ink).rect(10, 9, 8, 2, face).rect(10, 9, 8, 1, hi);
  p.rect(14, 12, 3, 4, ink).rect(15, 12, 1, 3, face).rect(17, 12, 2, 5, ink).rect(17, 12, 1, 4, face);
  p.set(3, 7, hi).set(4, 6, hi);
  return p;
}

/** The gate: a stout door one block high, a padlock and a key hole. */
export function gatePicture(pal: Pal, body: 'wood' | 'blue', plate: Ramp): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const b = pal.r(body);
  const g = pal.r(plate);
  p.rect(0, 0, 20, 20, ink).rect(1, 0, 18, 19, b[1]);
  p.rect(1, 0, 18, 1, b[3]).rect(1, 18, 18, 1, b[0]);
  for (const x of [5, 13]) p.rect(x, 1, 1, 17, b[0]).rect(x + 1, 1, 1, 17, b[2]);
  // the padlock: a shackle over a plate with a key hole
  p.rect(7, 2, 6, 5, ink).rect(8, 3, 4, 4, b[1]);
  p.rect(5, 7, 10, 9, ink)
    .rect(6, 8, 8, 7, g[3])
    .rect(6, 8, 8, 1, g[g.length - 1])
    .rect(6, 14, 8, 1, g[1]);
  p.disc(10, 10.5, 1.3, ink).rect(9, 11, 2, 3, ink);
  return p;
}

/** The arch over a gate: a stone cap and sides, sky in the middle, a gem of the key's color on top. */
export function archPicture(pal: Pal, trim: Ramp | 'purple'): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const s = pal.r('stone');
  const g = pal.r(trim);
  p.rect(0, 0, 20, 6, ink).rect(1, 0, 18, 5, s[3]).rect(1, 0, 18, 1, s[4]).rect(1, 4, 18, 1, s[1]);
  p.rect(0, 6, 3, 14, ink).rect(0, 6, 2, 14, s[3]);
  p.rect(17, 6, 3, 14, ink).rect(18, 6, 2, 14, s[2]);
  p.rect(7, 0, 6, 6, ink)
    .rect(8, 1, 4, 4, g[3])
    .rect(8, 1, 4, 1, g[g.length - 1]);
  return p;
}

/** Adds the lock blocks to `book` (after addStarterBlocks). */
export function addLockBlocks(book: Book, pal: Pal): void {
  book.add('keySilver', keyPicture(pal, 'white'), { grav: PULL.down, score: 25, effect: SILVER_KEYS, eamt: 1, touch: 'sky' });
  book.add('gateTop', archPicture(pal, 'gold'), { grav: PULL.down });
  book.add('gate', gatePicture(pal, 'wood', 'gold'), { solid: SOLID, effect: KEYS, eamt: -1, touch: 'sky' });
  book.add('gateTopSilver', archPicture(pal, 'white'), { grav: PULL.down });
  book.add('gateSilver', gatePicture(pal, 'blue', 'white'), { solid: SOLID, effect: SILVER_KEYS, eamt: -1, touch: 'sky' });
}
