// Stage 4's side leg, "Between Platters", seen from the side (its own palette, s4s.pal, the
// hard disk's): flying the thin gap between two spinning platters, the lower one's mirror edge
// underfoot, the upper one's overhead, the spindle motor's housing beyond them. The air the
// platters drag round streaks past in a ring of pictures, faster than the screen scrolls, so
// the gap looks as fast as it is. Read/write arms seek in and out across the gap.
import { Pixels } from '../../../kit/pixels';
import { BlockSet, bevel, flipX, flipY, micro, shadeAt } from '../art/draw';
import type { Pal } from '../art/pal';
import { HURT } from '../characters/sharedMonsters';
import { addTerrain, type SideArt } from './sideTiles';

/** How many pictures the air streaks' ring has (4 pixels a step: a block every 5). */
const STREAK_STEPS = 5;

/** The dark inside of the drive between the platters. */
function dark(p: Pal, v: number): Pixels {
  return new Pixels(20, 20).map((x, y) => shadeAt(p.r('deep'), 0, 2, 0.3 + ((x * 3 + y * 7 + v) % 19 === 0 ? 0.3 : 0), x, y));
}

/** A platter's edge, seen side-on: a mirror band over the hub's shadow. */
function platterTop(p: Pal): Pixels {
  const t = new Pixels(20, 20).map((x, y) => shadeAt(p.r('deep'), 1, 3, 0.5 - y * 0.01, x, y));
  for (let y = 0; y < 7; y++) for (let x = 0; x < 20; x++) t.set(x, y, shadeAt(p.r('base'), 3, 7, 1 - Math.abs(y - 2) / 4, x, y));
  t.rect(0, 7, 20, 1, p.c('base', 1));
  return t;
}

function housing(p: Pal): Pixels {
  return new Pixels(20, 20).map((x, y) => shadeAt(p.r('deep'), 1, 3, 0.45 + (x % 10 === 0 ? 0.2 : 0), x, y));
}

export function plattersArt(p: Pal): SideArt {
  const floor = (v: number) => dark(p, v);
  const face = (side: 'floor' | 'ceil') => (side === 'floor' ? platterTop(p) : flipY(platterTop(p)));
  return { pal: p, floor, edge: (_s, v) => floor(v), floors: 2, edges: 1, face };
}

/**
 * A read/write arm's head or a piece of its beam, reaching in from the right (`mirror`: from the
 * left, for the leg flown leftward, its R/W still reading the right way round).
 */
export function armPic(a: SideArt, head: boolean, mirror = false): Pixels {
  const p = a.pal;
  let t = a.floor(0).crop(0, 0, 20, 20);
  bevel(t, 0, 7, 20, 6, p.r('steel'), 3, 1);
  if (head) {
    t.rect(0, 5, 8, 10, p.c('deep', 1));
    bevel(t, 1, 6, 6, 8, p.r('trim'), 3, 1);
  }
  if (mirror) t = flipX(t);
  if (head) micro(t, mirror ? 0 : 9, 1, 'R/W', p.c('steel', 5));
  return t;
}

/** The leg's own blocks: the platters, the air streaks' ring, the seeking arms. */
export function plattersBlocks(bs: BlockSet, a: SideArt, armOn: number, armOff: number): void {
  const p = a.pal;
  const back = a.floor(0);
  addTerrain(bs, back, { cIn: housing(p), cBot: flipY(platterTop(p)), fIn: housing(p), fTop: platterTop(p) }, p.c('base', 7));

  // the air streaks: one picture 20 pixels wide that repeats, shifted 4 pixels left a step
  const streak = (x: number, y: number) => (y === 9 && (x < 9 || (x > 12 && x < 16))) || (y === 13 && x > 4 && x < 14);
  for (let k = 0; k < STREAK_STEPS; k++) {
    const t = back.crop(0, 0, 20, 20);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (streak((x + k * 4) % 20, y)) t.set(x, y, p.c('deep', 4));
    bs.add(`air${k}`, t, { next: `air${(k + 1) % STREAK_STEPS}`, ntime: 1 });
  }

  // a read/write arm reaching in from the right: its head (left end) and its beam; out of the
  // gap (only the backdrop) for armOff ticks, then in, burning like a firewall, for armOn
  const arm = (head: boolean) => armPic(a, head);
  const gone = back.crop(0, 0, 20, 20);
  for (let x = 0; x < 20; x += 5) gone.set(x, 10, p.c('deep', 3));
  bs.add('armGap', gone);
  bs.add('armH', arm(true), { next: 'armH1', ntime: armOn, chHitPt: HURT.hazard, touch: 'armGap' });
  bs.add('armH1', gone.crop(0, 0, 20, 20), { next: 'armH', ntime: armOff });
  bs.add('armB', arm(false), { next: 'armB1', ntime: armOn, chHitPt: HURT.hazard, touch: 'armGap' });
  bs.add('armB1', gone.crop(0, 0, 20, 20), { next: 'armB', ntime: armOff });
  // the spindle's hub, far behind, a little lighter than the dark
  const hub = new Pixels(40, 40);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) hub.blit(back, c * 20, r * 20);
  for (let y = 0; y < 40; y++)
    for (let x = 0; x < 40; x++) {
      const d = Math.hypot(x - 19.5, y - 19.5);
      if (d < 17) hub.set(x, y, shadeAt(p.r('deep'), 1, 3, 0.4 + (d < 6 ? 0.4 : 0) + (Math.round(d) % 4 === 0 ? 0.15 : 0), x, y));
    }
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) bs.add(`hub${r}${c}`, hub.crop(c * 20, r * 20, 20, 20));
}
