// box.bbl: inside the music box, seen from the side by a robot small enough to fit through its
// keyhole, where gravity pulls down. Polished brass and red velvet behind; steel pins to stand on
// (solid on top only); the comb's teeth, which spring down and up by turns (each warns first); the
// notes knocked off the cylinder, to put back; and the crank's socket, which turns once all of
// them are back.
import { SOLTOP } from '../../../../web/src/formats/blocks';
import { Pixels, rng } from '../../../kit/pixels';
import { bevel, shadeAt } from '../art/draw';
import { c, r } from '../art/pal';
import { CTR, NOTES } from '../ids';
import { addKeepsakes } from './keepsakes';
import { BlockSet, GRAV, SOLID } from './sets';

const DOWN = GRAV.s;

/** The inside of the box: the brass cylinder turning behind, pins standing out of it. */
function brass(seed: number): Pixels {
  const p = new Pixels(20, 20);
  p.map((x, y) => shadeAt(r('brass'), 0, 2, 0.5 + 0.4 * Math.sin((x + seed * 7) / 4), x, y));
  const R = rng(seed);
  for (let i = 0; i < 3; i++) p.disc(2 + Math.floor(R() * 16), 2 + Math.floor(R() * 16), 1, c('brass', 3));
  return p;
}

function velvet(seed: number): Pixels {
  const p = new Pixels(20, 20, c('red', 0));
  const R = rng(seed);
  return p.map((_x, _y, v) => (R() < 0.2 ? c('red', 1) : v));
}

function wood(seed: number): Pixels {
  const p = new Pixels(20, 20, c('wood', 2));
  bevel(p, 0, 0, 20, 20, r('wood'), 2);
  const R = rng(seed);
  for (let i = 0; i < 4; i++) p.rect(2, 3 + Math.floor(R() * 14), 16, 1, c('wood', 1));
  return p;
}

/** A steel pin standing out of the cylinder: a ledge to stand on. */
function pin(seed: number): Pixels {
  const p = brass(seed);
  bevel(p, 0, 0, 20, 5, r('stone'), 4);
  p.rect(8, 5, 4, 4, c('stone', 3));
  return p;
}

/** A tooth of the comb: up (steel), quivering (warning, it blurs), or sprung down out of the way. */
function tooth(state: 'up' | 'warn' | 'down', seed: number): Pixels {
  const p = velvet(seed);
  if (state === 'down') {
    p.rect(0, 16, 20, 4, c('stone', 2));
    return p;
  }
  bevel(p, 0, 0, 20, 6, r('stone'), state === 'warn' ? 5 : 4);
  if (state === 'warn') for (let x = 1; x < 20; x += 3) p.set(x, 7, c('stone', 5)).set(x + 1, 8, c('stone', 4));
  return p;
}

/** A note knocked off the cylinder, floating: an eighth note in gold. */
function note(seed: number): Pixels {
  const p = brass(seed);
  p.disc(7, 14, 3, c('gold', 4)).disc(7, 14, 1.5, c('gold', 2));
  p.rect(9, 4, 2, 10, c('gold', 4));
  p.rect(11, 4, 4, 2, c('gold', 4)).rect(13, 6, 2, 2, c('gold', 3));
  return p;
}

/** The crank's socket: still (it wants every note back) or turning. */
function socket(turning: boolean): Pixels {
  const p = turning ? brass(5) : wood(5);
  p.disc(10, 10, 7, c('stone', 2)).disc(10, 10, 5, c('stone', 3));
  if (turning) p.line(10, 10, 15, 6, c('stone', 5)).line(10, 10, 5, 14, c('stone', 5));
  else p.rect(6, 9, 9, 3, c('stone', 1));
  return p;
}

/** The keyhole from inside: shop light through it, the way back out. */
function keyhole(): Pixels {
  const p = velvet(9);
  p.disc(10, 7, 4, c('window', 2)).rect(8, 7, 5, 12, c('window', 2));
  p.disc(10, 7, 2, c('yellow', 3));
  return p;
}

export function boxSet(): BlockSet {
  const s = new BlockSet(150, false);
  s.add('wood', wood(1), { solid: SOLID });
  s.add('air', brass(1), { grav: DOWN });
  s.add('air2', velvet(2), { grav: DOWN });
  s.add('pin', pin(1), { solid: SOLTOP, grav: DOWN });
  // the comb: the A teeth spring down while the B teeth are up, and back
  s.add('toothA', tooth('up', 1), { solid: SOLTOP, grav: DOWN, next: 'toothAwarn', ntime: 30 });
  s.add('toothAwarn', tooth('warn', 1), { solid: SOLTOP, grav: DOWN, next: 'toothAdown', ntime: 12 });
  s.add('toothAdown', tooth('down', 1), { grav: DOWN, next: 'toothA', ntime: 22 });
  s.add('toothBwarn', tooth('warn', 2), { solid: SOLTOP, grav: DOWN, next: 'toothBdown', ntime: 12 });
  s.add('toothBdown', tooth('down', 2), { grav: DOWN, next: 'toothB', ntime: 22 });
  s.add('toothB', tooth('up', 2), { solid: SOLTOP, grav: DOWN, next: 'toothBwarn', ntime: 30 });
  s.add('note', note(3), { grav: DOWN, effect: CTR.task, eamt: 1, score: 50, touch: 'air' });
  s.add('socketTurning', socket(true), { grav: DOWN });
  s.add('socket', socket(false), { solid: SOLID, effect: CTR.task, eamt: -NOTES, touch: 'socketTurning' });
  s.add('keyhole', keyhole(), { grav: DOWN });
  addKeepsakes(s, brass(1), 'air');
  return s;
}
