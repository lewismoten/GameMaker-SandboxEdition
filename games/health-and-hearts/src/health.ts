// HEALTH AND HEARTS' blocks, added to the Starter block set after the signs:
//   spikeUp   spikes you can walk into: 10 hit points once, then they lie flat
//   spikeFlat what a spike becomes when touched: harmless (the "touch" rule, as a coin goes)
//   heart     touch it and 10 hit points come back (a block's "hit points" rule, here above zero); it is gone
//   oneUp     Lian's own face: touch it and the lives counter goes up by one (effect 1, amount 1); it is gone
// None is solid, so nothing holds the hero while it hurts or heals.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { PULL, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** Hit points a spike takes, once. */
export const SPIKE_HURT = -10;
/** Hit points a heart gives back. */
export const HEART_HEAL = 10;
/** The counter a face adds to: lives. */
const LIVES = 1;

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

/** A plump red heart with a bright upper left and a darker lower right. */
function heart(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const r = pal.r('red');
  const key: Record<string, number> = { r: r[3], R: r[4], d: r[2], D: r[1], w: pal.c('white', 3) };
  p.draw(
    2,
    3,
    [
      '..RRRR....rrrr..',
      '.RRwwRr..rrrrrr.',
      'RRwRRrrrrrrrrrrd',
      'RRRRrrrrrrrrrrrd',
      'RRrrrrrrrrrrrrdd',
      'rrrrrrrrrrrrrrdd',
      '.rrrrrrrrrrrrdd.',
      '..rrrrrrrrrrdd..',
      '...rrrrrrrrdd...',
      '....rrrrrrdd....',
      '.....rrrrdd.....',
      '......rrdd......',
      '.......DD.......',
    ],
    key,
  );
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** Lian's face in his teal beanie, a smile and a bit of orange hood: a spare life. */
function face(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const t = pal.r('teal');
  const s = pal.r('skin');
  const o = pal.r('orange');
  const ink = pal.c('ink', 0);
  const key: Record<string, number> = { t: t[3], T: t[4], d: t[2], s: s[3], S: s[2], o: o[3], i: ink, w: pal.c('white', 3) };
  p.draw(
    2,
    2,
    [
      '....tttttttt....',
      '...tTTTtttttt...',
      '..tTTtttttttdd..',
      '..tttttttttttd..',
      '..dddddddddddd..',
      '..ssssssssssss..',
      '..sswisssswiss..',
      '..ssiissssiiss..',
      '..ssssssssssSS..',
      '..sSsssssssSsS..',
      '...ssiiiiiiss...',
      '....ssssssSS....',
      '...oooooooooo...',
      '..oooooooooooo..',
    ],
    key,
  );
  return outline(p, ink, { transparent: skyOf(pal) });
}

/** Adds the spike, heart and face blocks to `book` (call after the signs). */
export function addHealth(book: Book, pal: Pal): void {
  const air = { grav: PULL.down };
  book.add('spikeUp', spikes(pal), { ...air, hp: SPIKE_HURT, touch: 'spikeFlat' });
  book.add('spikeFlat', flat(pal), air);
  book.add('heart', heart(pal), { ...air, hp: HEART_HEAL, touch: 'sky' });
  book.add('oneUp', face(pal), { ...air, effect: LIVES, eamt: 1, touch: 'sky' });
}
