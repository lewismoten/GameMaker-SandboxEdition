// Teddy's character blocks (TEDDY.CBL) and the monster blocks (THINGS.MBL). Teddy, Gwinn and
// the Clown Club are the trilogy's own drawings (games/teddy2, games/teddy3), in the same colors.
// New here: the wind-up toy drummer who marches the shop floor (bump him and he knocks Teddy
// back a little), and the sparkle an instrument leaves when it is picked up.
import { SOLBOT, SOLLEF, SOLRIG } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { blob } from '../../../snowbound/src/art/draw';
import { makeBook, T } from '../../../snowbound/src/sprites/kidArt';
import { POSES } from '../../../teddy2/src/sprites/teddy';
import { GWINN } from '../../../teddy2/src/sprites/gwinn';
import { P } from '../art/pal';

const c = P.c;
const ink = c('ink', 0);

/** Teddy, one block tall, facing right (left is the same picture mirrored by the frame). */
export function buildCharBlocks() {
  const book = makeBook('cbl');
  for (const pose of ['stand', 'walk1', 'walk2', 'hop', 'sit', 'reach', 'bark', 'hurt', 'dead', 'back', 'frontBeg'] as const) {
    const pic = POSES[pose];
    if (!pic) throw new Error(`No Teddy pose ${pose}`);
    book.add(pose, pic);
  }
  return book;
}

/** A wind-up toy drummer, marching to the right: a drum at his belly, sticks up and down, a key in his back. */
function drummer(f: number): Pixels {
  const p = new Pixels(20, 20, T);
  // legs, stepping
  p.rect(7 + f, 15, 2, 4, c('blue', 0)).rect(11 - f, 15, 2, 4, c('blue', 0));
  p.rect(6 + f, 19, 3, 1, ink).rect(10 - f, 19, 3, 1, ink);
  // red coat with gold buttons
  blob(p, 10, 10, 4, 5, P.r('red'), 0, 3);
  p.set(10, 8, c('gold', 2)).set(10, 11, c('gold', 2));
  // tall hat and a round face, smiling
  p.rect(7, 0, 6, 4, c('blue', 1)).rect(7, 3, 6, 1, c('gold', 2));
  blob(p, 10, 5.5, 2.6, 2.2, P.r('skin'), 1, 3);
  p.set(11, 5, ink).set(10, 7, c('red', 1)).set(11, 7, c('red', 1));
  // the wind-up key in his back
  p.rect(3, 9, 3, 1, c('metal', 3)).rect(2, 8, 1, 3, c('metal', 3));
  // the drum, and a stick tapping it
  blob(p, 14, 13, 3.4, 2.4, P.r('paint'), 1, 3);
  p.rect(11, 12, 7, 1, c('red', 2)).rect(11, 14, 7, 1, c('red', 2));
  if (f) p.line(16, 12, 19, 8, c('wood', 3));
  else p.line(15, 11, 18, 5, c('wood', 3));
  return outline(p, ink);
}

/** The sparkle an instrument leaves: a four-pointed star, big then small. */
function sparkle(k: number): Pixels {
  const p = new Pixels(20, 20, T);
  const r = k ? 4 : 7;
  for (let i = -r; i <= r; i++) p.set(10 + i, 10, c('gold', 2)).set(10, 10 + i, c('gold', 2));
  p.rect(9, 9, 3, 3, c('yellow', 3)).set(10, 10, c('cloud', 2));
  return p;
}

export function buildMonsterBlocks() {
  const book = makeBook('mbl');
  // the drummer pushes back from the sides and below, and stings a little to bump into
  const bump = { chHitPt: -4, solid: SOLBOT | SOLLEF | SOLRIG };
  book.add('drummer0', drummer(0), bump);
  book.add('drummer1', drummer(1), bump);
  book.add('sparkle0', sparkle(0));
  book.add('sparkle1', sparkle(1));
  book.add('gwinn1', GWINN.gwinnRun1);
  book.add('gwinn2', GWINN.gwinnRun2);
  return book;
}
