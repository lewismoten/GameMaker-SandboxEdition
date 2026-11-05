// STRONGER KEYS' own blocks, added to the Starter block set before the signs. Every key and every
// door uses the same counter, KEYS (counter 20):
//   key_bronze, key_silver, key_gold   touch one and the counter goes up by 1, 2 or 3 (the teeth on the key)
//   gate_bronze, gate_silver, gate_gold   a solid door that takes 1, 2 or 3 off the counter (the slots on its plate)
//   arch_bronze, arch_silver, arch_gold   the arch over each door (passable)
// Nothing here knows what a "stronger" key is: a bigger key only adds a bigger number, and a door
// only asks whether the counter can pay its price. A counter from 20 up refuses a touch that would
// leave it empty (PLAYGAME.C DoBlockTouchChar), so a door refuses until the counter holds its price
// plus one, then takes the price and nothing more. The hero's counter starts at 1 (shown as none).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { KEYS } from '../../kit/starter/blocks';
import { skyOf, type Pal } from '../../kit/starter/palette';

export type Grade = 'bronze' | 'silver' | 'gold';
export const GRADES: Grade[] = ['bronze', 'silver', 'gold'];
/** What each grade is worth: the key's teeth, the door's price. */
export const WORTH: Record<Grade, number> = { bronze: 1, silver: 2, gold: 3 };
const RAMP: Record<Grade, 'wood' | 'white' | 'gold'> = { bronze: 'wood', silver: 'white', gold: 'gold' };
const BODY: Record<Grade, 'dirt' | 'blue' | 'brick'> = { bronze: 'dirt', silver: 'blue', gold: 'brick' };

/** A key with one, two or three teeth hanging from its shaft, in the grade's metal, outlined so it shows on the sky. */
function keyPicture(pal: Pal, grade: Grade): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const m = pal.r(RAMP[grade]);
  const hi = m[m.length - 1];
  const ink = pal.c('ink', 0);
  const face = m[grade === 'gold' ? 4 : 3];
  p.disc(5.5, 9.5, 5.5, ink).disc(5.5, 9.5, 4.5, face).disc(5.5, 9.5, 2.2, ink).disc(5.5, 9.5, 1.4, skyOf(pal));
  p.rect(9, 8, 10, 4, ink).rect(10, 9, 8, 2, face).rect(10, 9, 8, 1, hi);
  for (let i = 0; i < WORTH[grade]; i++) {
    const x = 16 - i * 3;
    p.rect(x - 1, 12, 4, 5, ink).rect(x, 12, 2, 4, face).rect(x, 12, 1, 3, hi);
  }
  p.set(3, 7, hi).set(4, 6, hi);
  return p;
}

/** The door: a stout door one block high, a plate in the grade's metal with one, two or three slots. */
function gatePicture(pal: Pal, grade: Grade): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const b = pal.r(BODY[grade]);
  const g = pal.r(RAMP[grade]);
  p.rect(0, 0, 20, 20, ink).rect(1, 0, 18, 19, b[1]);
  p.rect(1, 0, 18, 1, b[3]).rect(1, 18, 18, 1, b[0]);
  for (const x of [5, 13]) p.rect(x, 1, 1, 17, b[0]).rect(x + 1, 1, 1, 17, b[2]);
  p.rect(4, 4, 12, 12, ink)
    .rect(5, 5, 10, 10, g[3])
    .rect(5, 5, 10, 1, g[g.length - 1])
    .rect(5, 14, 10, 1, g[1]);
  const at = { 1: [9], 2: [7, 11], 3: [6, 9, 12] }[WORTH[grade]] ?? [];
  for (const x of at) p.rect(x, 7, 2, 5, ink);
  return p;
}

/** The arch over a door: a stone cap and sides, sky in the middle, a gem in the grade's metal. */
function archPicture(pal: Pal, grade: Grade): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const s = pal.r('stone');
  const g = pal.r(RAMP[grade]);
  p.rect(0, 0, 20, 6, ink).rect(1, 0, 18, 5, s[3]).rect(1, 0, 18, 1, s[4]).rect(1, 4, 18, 1, s[1]);
  p.rect(0, 6, 3, 14, ink).rect(0, 6, 2, 14, s[3]);
  p.rect(17, 6, 3, 14, ink).rect(18, 6, 2, 14, s[2]);
  p.rect(7, 0, 6, 6, ink)
    .rect(8, 1, 4, 4, g[3])
    .rect(8, 1, 4, 1, g[g.length - 1]);
  return p;
}

/** Adds the three keys, the three doors and their arches to `book` (after addStarterBlocks). */
export function addLadderBlocks(book: Book, pal: Pal): void {
  for (const grade of GRADES) {
    const n = WORTH[grade];
    book.add(`key_${grade}`, keyPicture(pal, grade), { grav: PULL.down, score: 25, effect: KEYS, eamt: n, touch: 'sky' });
    book.add(`arch_${grade}`, archPicture(pal, grade), { grav: PULL.down });
    book.add(`gate_${grade}`, gatePicture(pal, grade), { solid: SOLID, effect: KEYS, eamt: -n, touch: 'sky' });
  }
}
