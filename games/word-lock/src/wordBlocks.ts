// SAY THE WORD's own blocks, added to the Starter block set before the signs:
//   word      a teal speech bubble with lines of writing: touch it and counter 22 goes up by one
//   lock      a green gate with a bubble-shaped mouth: solid, and a touch takes 3 off counter 22.
//             With fewer than 3 the touch is refused and the lock stays shut; with 3 it becomes sky.
//   refund    a gold tray with three chips and an arrow up: not solid; touch it and counter 22
//             goes up by 3, then it is gone. It does not know what was paid. It only gives 3.
//   lockTop   the arch over a lock (passable)
// The refund is not part of the lock. A lock only takes. Leave the refund out and what it took stays taken.
// The hero's counter 22 starts at 1 (a counter shows one less than it holds).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { archPicture } from '../../kit/starter/locks';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** The counter a word adds to, a lock spends and a refund fills again. */
export const WORDS = 22;
/** What a lock takes and a refund gives back. */
export const PRICE = 3;

/** A speech bubble: a dark rim, a pale face, three lines of writing and a tail. */
function wordPicture(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const t = pal.r('teal');
  const ink = pal.c('ink', 0);
  p.rect(1, 3, 18, 12, ink).rect(2, 4, 16, 10, t[3]).rect(2, 4, 16, 1, t[4]);
  p.rect(3, 15, 4, 3, ink).rect(4, 14, 3, 3, t[3]).rect(3, 17, 2, 1, ink);
  p.rect(4, 6, 12, 1, ink).rect(4, 8, 9, 1, ink).rect(4, 10, 11, 1, ink);
  p.set(1, 3, skyOf(pal)).set(18, 3, skyOf(pal)).set(1, 14, skyOf(pal)).set(18, 14, skyOf(pal));
  return p;
}

/** A lock: a stout green door with a round bubble opening that waits for words. */
function lockPicture(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const g = pal.r('green');
  const s = pal.r('stone');
  const t = pal.r('teal');
  p.rect(0, 0, 20, 20, ink).rect(1, 0, 18, 19, g[1]);
  p.rect(1, 0, 18, 1, g[3]).rect(1, 18, 18, 1, g[0]);
  for (const x of [5, 13]) p.rect(x, 1, 1, 17, g[0]).rect(x + 1, 1, 1, 17, g[2]);
  // the plate with the mouth and three notches for the three words it takes
  p.rect(2, 3, 16, 14, ink).rect(3, 4, 14, 12, s[3]).rect(3, 4, 14, 1, s[4]);
  p.disc(9.5, 8.5, 4, ink).disc(9.5, 8.5, 3, t[1]);
  for (const x of [5, 9, 13]) p.rect(x, 13, 3, 2, ink);
  return p;
}

/** A refund tray: a gold tray holding three chips, with an arrow going up out of it. */
function refundPicture(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const y = pal.r('gold');
  const t = pal.r('teal');
  p.rect(1, 12, 18, 6, ink).rect(2, 13, 16, 4, y[3]).rect(2, 13, 16, 1, y[5]).rect(2, 16, 16, 1, y[1]);
  for (const x of [4, 9, 14]) p.rect(x, 9, 4, 4, ink).rect(x + 1, 10, 2, 2, t[3]);
  p.rect(9, 1, 2, 6, ink).rect(10, 2, 1, 5, y[4]);
  p.rect(6, 4, 8, 1, ink).set(7, 3, ink).set(8, 2, ink).set(11, 2, ink).set(12, 3, ink);
  p.rect(7, 4, 6, 1, y[4]);
  return p;
}

/** Adds the word, the lock, its arch and the refund tray to `book` (after addStarterBlocks). */
export function addWordBlocks(book: Book, pal: Pal): void {
  book.add('word', wordPicture(pal), { grav: PULL.down, score: 25, effect: WORDS, eamt: 1, touch: 'sky' });
  book.add('lock', lockPicture(pal), { solid: SOLID, effect: WORDS, eamt: -PRICE, touch: 'sky' });
  book.add('lockTop', archPicture(pal, 'gold'), { grav: PULL.down });
  book.add('refund', refundPicture(pal), { grav: PULL.down, effect: WORDS, eamt: PRICE, touch: 'sky' });
}
