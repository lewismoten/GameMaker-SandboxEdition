// SOUNDS AND MUSIC's blocks, added to the Starter block set after the signs. Each one makes a
// different sound when Kit touches it, because each changes a different counter (the engine
// plays one sound per counter, see code/GM/PLAYGAME.C DoBlockTouchChar):
//   coin      (the Starter kit's) 10 points: the score sound
//   bag       a money bag: counter 3 (money) goes up by one: the money sound
//   heart     10 hit points back: the help sound
//   spikeUp   10 hit points taken: Kit's hurt move plays its own sound (spikeFlat is what it becomes)
// None is solid, so nothing holds the hero while a sound plays.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { PULL, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { MONEY } from './hero';

/** Hit points a spike takes, once. */
export const SPIKE_HURT = -10;
/** Hit points a heart gives back. */
export const HEART_HEAL = 10;

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

/** A money bag: a plump gold sack tied at the neck, with a bright coin-shaped patch. */
function bag(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const o = pal.r('orange');
  const g = pal.r('gold');
  const ink = pal.c('ink', 0);
  const key: Record<string, number> = { o: o[3], O: o[4], d: o[2], D: o[1], g: g[4], G: g[5], t: g[2], w: pal.c('white', 3), i: ink };
  p.draw(
    3,
    2,
    [
      '..ddOOdd........',
      '...dDDd.........',
      '....dd..........',
      '...tggt.........',
      '..ooOOoood......',
      '.oOOOOoooood....',
      'oOOOOooooooood..',
      'oOOooggggoooood.',
      'oOooogGGGgooood.',
      'oooooggGggoooodd',
      'ooooogGGGgoooodd',
      'doooooggggooodd.',
      '.dooooooooooodd.',
      '..dddddddddddd..',
    ],
    key,
  );
  return outline(p, ink, { transparent: skyOf(pal) });
}

/** Adds the spike, heart and bag blocks to `book` (call after the signs). */
export function addPickups(book: Book, pal: Pal): void {
  const air = { grav: PULL.down };
  book.add('spikeUp', spikes(pal), { ...air, hp: SPIKE_HURT, touch: 'spikeFlat' });
  book.add('spikeFlat', flat(pal), air);
  book.add('heart', heart(pal), { ...air, hp: HEART_HEAL, touch: 'sky' });
  book.add('bag', bag(pal), { ...air, effect: MONEY, eamt: 1, touch: 'sky' });
}
