// The see-saws' timing and their tilting plank, shared by the park and the Teddy Course. Each
// end is a monster on a path (one end goes up as the other comes down), and the plank on the
// fulcrum is a monster that only changes pictures, tilting in step with the ends: both run on
// the same cycle from the scene's first tick, so they never drift apart.
import { POWER } from '../ids';
import type { Bestiary } from '../characters/mons';
import { Pixels } from '../../../kit/pixels';
import { c } from '../blocks/tiles';

/** How far a see-saw's end travels, in blocks. */
export const SEESAW_RISE = 3;

/**
 * An end that starts low: it leaves the bottom slowly (time to step on), swings up fast, eases
 * off the top (a hop from it lands on the next end as that one sinks), and swings back down
 * fast. One cycle is 54 ticks (3 s), so the end is back at its step within 2 s, whenever Teddy
 * gets there.
 */
export const SAW_UP: [number, number, number][] = [
  [0, -1, 1],
  [0, -SEESAW_RISE, 4],
  [0, -SEESAW_RISE + 1, 2],
  [0, 0, 4],
];
/** The other end, starting high: always the mirror of SAW_UP. */
export const SAW_DOWN: [number, number, number][] = SAW_UP.map(([x, y, s]) => [x, -y, s]);

/** Ticks a segment takes: `speed` pixels a tick, then a tick at the corner to turn. */
const segTicks = (from: number, to: number, speed: number) => Math.ceil((Math.abs(to - from) * 20) / speed) + 1;

/** Ticks in one swing of SAW_UP. */
const CYCLE = SAW_UP.reduce((sum, [, y, speed], i, list) => sum + segTicks(i ? list[i - 1][1] : 0, y, speed), 0);

/** How high a SAW_UP end is (0..SEESAW_RISE blocks) at tick t of its cycle. */
function upHeight(t: number): number {
  let from = 0;
  for (const [, y, speed] of SAW_UP) {
    const ticks = segTicks(from, y, speed);
    if (t < ticks - 1) return -(from + ((y - from) * (t + 1)) / (ticks - 1));
    if (t < ticks) return -y;
    t -= ticks;
    from = y;
  }
  return -from;
}

/** Plank tilts: 0 is the right side all the way up, 4 the left side all the way up. */
const TILTS = 5;

/**
 * The plank on a fulcrum, `w` blocks wide, cut into one-block pictures `${name}${tilt}_${bx}`.
 * It pivots at the middle of its width, 7 pixels down (just over the fulcrum's peak).
 */
function plankPics(b: Bestiary, name: string, w: number): void {
  const wood = [c('wood', 3), c('wood', 2), c('wood', 1)];
  const half = w * 10;
  const reach = w === 1 ? 6 : 7;
  for (let k = 0; k < TILTS; k++) {
    // k = 0: right end up (negative y to the right)
    const slope = ((k - (TILTS - 1) / 2) / ((TILTS - 1) / 2)) * (reach / half);
    for (let bx = 0; bx < w; bx++) {
      const p = new Pixels(20, 20, 255);
      for (let x = 0; x < 20; x++) {
        const gx = bx * 20 + x + 0.5 - half;
        const y = Math.round(7 + gx * slope);
        for (let d = 0; d < 3; d++) if (y + d >= 0 && y + d < 20) p.set(x, y + d, wood[d]);
      }
      // the bolt at the pivot
      if (w === 1 || bx === w / 2) p.set(w === 1 ? 10 : 0, 8, c('metal', 3));
      b.pic(`${name}${k}_${bx}`, p);
    }
  }
}

/**
 * The plank monsters for a see-saw whose LEFT end runs SAW_UP (`leftUp`) or SAW_DOWN, named
 * `${name}_${bx}` for each of its `w` blocks (place them on the fulcrum blocks, left to right).
 */
export function seesawPlank(b: Bestiary, name: string, w: number, leftUp: boolean): void {
  plankPics(b, name, w);
  // the tilt at each tick, then the same tilt run together into one picture's time
  const runs: [number, number][] = [];
  for (let t = 0; t < CYCLE; t++) {
    const h = upHeight(t) / SEESAW_RISE; // 0 low .. 1 high
    const left = leftUp ? h : 1 - h;
    const k = Math.round(left * (TILTS - 1));
    if (runs.length && runs[runs.length - 1][0] === k) runs[runs.length - 1][1]++;
    else runs.push([k, 1]);
  }
  for (let bx = 0; bx < w; bx++) b.add(`${name}_${bx}`, { pics: runs.map(([k, n]) => [`${name}${k}_${bx}`, n] as [string, number]), power: POWER.friend });
}
