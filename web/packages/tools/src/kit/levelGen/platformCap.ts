// What a hero can cross, measured with the reach model on small made-up grids (so it is always what
// `reachFrom` would prove): the widest gap he clears at each height difference, and the highest step.
// The platform generator keeps to a share of these (the difficulty). No DOM.
import { newArea, SKY, WALL, type Area } from './grid';
import type { HeroPhysics } from './jumpModel';
import { reachFrom } from './platformReach';

export interface Capability {
  /** The highest step up he can jump onto (cells), with no gap. */
  maxRise: number;
  /** The widest gap he clears on level ground (cells). */
  maxGap: number;
  /** `gapAt[r]`: the widest gap he clears to ground r cells higher (r from 0 to maxRise); 0 where none. */
  gapAt: number[];
}

const H = 26,
  FLOOR_ROW = 18;

/** A flat start of 10 columns, a gap of `gap` columns (pits all the way down), then ground `rise` rows higher; true when he stands on the far side. */
function crosses(p: HeroPhysics, gap: number, rise: number): boolean {
  const W = 10 + gap + 8;
  const a: Area = newArea(W, H, SKY);
  const col = (x: number, top: number) => {
    for (let y = top; y < H; y++) a.cells[y * W + x] = WALL;
  };
  for (let x = 0; x < 10; x++) col(x, FLOOR_ROW);
  for (let x = 10 + gap; x < W; x++) col(x, FLOOR_ROW - rise);
  const goal = 10 + gap + 4 + (FLOOR_ROW - rise - 1) * W;
  return reachFrom(a, p, 5 + (FLOOR_ROW - 1) * W, true, goal).stood[goal] === 1;
}

const cache = new WeakMap<HeroPhysics, Capability>();

/** What the hero can cross; remembered per physics object. */
export function capability(p: HeroPhysics): Capability {
  const known = cache.get(p);
  if (known) return known;
  let maxRise = 0;
  while (maxRise < 10 && crosses(p, 0, maxRise + 1)) maxRise++;
  const gapAt: number[] = [];
  for (let r = 0; r <= maxRise; r++) {
    let g = 0;
    while (g < 14 && crosses(p, g + 1, r)) g++;
    gapAt.push(g);
  }
  const c = { maxRise, maxGap: gapAt[0], gapAt };
  cache.set(p, c);
  return c;
}
