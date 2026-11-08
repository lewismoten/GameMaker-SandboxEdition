// BOTH TOGETHER's own background blocks, added to the Starter block set before the signs:
//   wireWE wireNS wireWN wireSE wireWS wireNE   a copper wire, straight or turning (passable, only drawn)
//   box     the spark box: a solid block that gives birth to a spark every few seconds
//   gateOne a stout gate with one lamp-shaped slot: solid, and a touch takes 1 off counter 22. With
//           none to spend the gate stays shut; with one it becomes sky (the same rule as THREE TOKENS)
//   gateTop the arch over the gate (passable)
// Nothing here knows what a spark is: the box only gives birth to monster 3 on a timer, and the gate
// only asks whether its counter can pay. The lit lamp (a monster) is what fills the counter.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { archPicture } from '../../kit/starter/locks';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** The counter the lit lamp adds to and the gate spends. */
export const LIGHTS = 22;
/** Ticks between sparks (a tick is 1/18.2 second). */
export const SPARK_EVERY = 90;
/** The spark's monster number, set on the box once the monster set is known. */
export const SPARK_MON = 3;

type Dir = 'N' | 'S' | 'E' | 'W';

/** A wire reaching from the middle of the block to each side in `dirs`: a dark edge with a copper core. */
function wire(pal: Pal, dirs: Dir[]): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const o = pal.r('orange');
  const arms = (x0: number, y0: number, w: number, h: number, c: number) => p.rect(x0, y0, w, h, c);
  for (const pass of ['edge', 'core'] as const) {
    const grow = pass === 'edge' ? 1 : 0;
    const c = pass === 'edge' ? ink : o[2];
    arms(8 - grow, 8 - grow, 4 + 2 * grow, 4 + 2 * grow, c); // the middle
    for (const d of dirs) {
      if (d === 'W') arms(0, 8 - grow, 10, 4 + 2 * grow, c);
      if (d === 'E') arms(10, 8 - grow, 10, 4 + 2 * grow, c);
      if (d === 'N') arms(8 - grow, 0, 4 + 2 * grow, 10, c);
      if (d === 'S') arms(8 - grow, 10, 4 + 2 * grow, 10, c);
    }
  }
  // a thin bright line along the core, and a dot of solder in each bend
  const hi = o[o.length - 1];
  for (const d of dirs) {
    if (d === 'W') p.rect(0, 9, 8, 1, hi);
    if (d === 'E') p.rect(12, 9, 8, 1, hi);
    if (d === 'N') p.rect(9, 0, 1, 8, hi);
    if (d === 'S') p.rect(9, 12, 1, 8, hi);
  }
  if (dirs.length === 2 && dirs.some((d) => d === 'N' || d === 'S') && dirs.some((d) => d === 'E' || d === 'W')) p.disc(10, 10, 2.5, pal.c('gold', 4));
  return p;
}

/** The spark box: a dark casing with a gold spark in a window and a copper stub on its right. */
function boxPicture(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const s = pal.r('stone');
  const g = pal.r('gold');
  p.rect(0, 0, 20, 20, ink).rect(1, 1, 18, 18, s[2]).rect(1, 1, 18, 1, s[4]).rect(1, 18, 18, 1, s[0]);
  p.rect(4, 4, 11, 12, ink).rect(5, 5, 9, 10, s[0]);
  p.disc(9.5, 9.5, 3.2, g[4]).disc(9.5, 9.5, 1.8, g[5]);
  for (const [x, y] of [
    [9, 5],
    [9, 14],
    [5, 9],
    [14, 9],
  ] as const)
    p.set(x, y, g[3]).set(x + 1, y, g[3]);
  p.rect(15, 8, 5, 4, ink).rect(15, 9, 5, 2, pal.r('orange')[2]);
  return p;
}

/** A gate with one lamp-shaped slot on a stone plate. */
function gatePicture(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const s = pal.r('stone');
  const b = pal.r('blue');
  const g = pal.r('gold');
  p.rect(0, 0, 20, 20, ink).rect(1, 0, 18, 19, b[1]);
  p.rect(1, 0, 18, 1, b[3]).rect(1, 18, 18, 1, b[0]);
  for (const x of [5, 13]) p.rect(x, 1, 1, 17, b[0]).rect(x + 1, 1, 1, 17, b[2]);
  p.rect(2, 4, 16, 11, ink).rect(3, 5, 14, 9, s[3]).rect(3, 5, 14, 1, s[4]);
  // the slot: a round bulb over a short neck, empty and dark inside
  p.disc(9.5, 8.5, 3.4, g[3]).disc(9.5, 8.5, 2.4, ink).rect(8, 11, 4, 2, g[3]).rect(9, 11, 2, 2, ink);
  return p;
}

/** Adds the wire pieces, the spark box and the gate to `book` (after addStarterBlocks). */
export function addGateBlocks(book: Book, pal: Pal): void {
  const air = { grav: PULL.down };
  const pieces: [string, Dir[]][] = [
    ['wireWE', ['W', 'E']],
    ['wireNS', ['N', 'S']],
    ['wireWN', ['W', 'N']],
    ['wireSE', ['S', 'E']],
    ['wireWS', ['W', 'S']],
    ['wireNE', ['N', 'E']],
  ];
  for (const [name, dirs] of pieces) book.add(name, wire(pal, dirs), air);
  book.add('box', boxPicture(pal), { solid: SOLID });
  book.add('gateOne', gatePicture(pal), { solid: SOLID, effect: LIGHTS, eamt: -1, touch: 'sky' });
  book.add('gateArch', archPicture(pal, 'gold'), air);
}

/** The finished block set: the spark box gets its birth rule (it gives birth to a spark every SPARK_EVERY ticks). */
export function finishBlocks(book: Book): Block[] {
  const blocks = book.finish();
  const box = blocks[book.n('box')];
  box.birthMon = SPARK_MON;
  box.birthTime = SPARK_EVERY;
  return blocks;
}
