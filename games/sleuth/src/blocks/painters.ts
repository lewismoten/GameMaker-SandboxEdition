// Painters for the Paragon's background blocks, seen from above: floors (planks, carpet,
// marble, rugs, flagstones), walls and sconces, the painted backdrop, doorways and closed
// doors with their name plates, notes and chalkboards on the walls, and furniture.
import { Pixels, rng } from '../../../kit/pixels';
import { SOLID, type BlockDef } from './blockset';
import { blob, micro, microC, microWidth, pool, shadeAt, speckle } from '../art/draw';
import { c, ramp as r } from '../art/pal';

export const T = (fill = 0) => new Pixels(20, 20, fill);
export const clone = (p: Pixels) => {
  const q = T();
  q.px.set(p.px);
  return q;
};

// ---------------------------------------------------------------- floors

/** Planks running left to right, 5 pixels wide, ends staggered. */
function planks(lo: number, hi: number, seed: number, rampName = 'wood'): Pixels {
  const p = T();
  const R = rng(seed);
  const w = r(rampName);
  for (let row = 0; row < 4; row++) {
    const cut = Math.floor(R() * 16) + 2;
    const base = lo + Math.floor(R() * (hi - lo + 1));
    for (let y = row * 5; y < row * 5 + 5; y++)
      for (let x = 0; x < 20; x++) {
        let k = base;
        if (y === row * 5) k = lo - 1;
        else if ((x * 7 + y * 3 + seed) % 11 === 0) k = base + 1;
        else if ((x * 5 + y + seed) % 13 === 0) k = base - 1;
        if (x === cut && y !== row * 5) k = lo - 1;
        p.set(x, y, w[Math.max(0, Math.min(w.length - 1, k))]);
      }
  }
  return p;
}

export const boards = (seed = 1) => planks(2, 3, seed);
export const stageBoards = (seed = 2) => planks(5, 6, seed);
export const pitBoards = (seed = 3) => planks(1, 1, seed);

export function carpet(seed = 0): Pixels {
  const p = speckle(T(), 0, 0, 20, 20, r('velvet'), 2, 1, 40 + seed, 0.15);
  // a gold lattice, the Paragon's pattern
  for (let i = 0; i < 20; i++) {
    const a = (i + seed * 5) % 20;
    if (i % 2 === 0) p.set(a, i, c('velvet', 3)).set(19 - a, i, c('velvet', 3));
  }
  p.set(9, 9, c('gold', 1)).set(10, 10, c('gold', 1)).set(9, 10, c('gold', 0)).set(10, 9, c('gold', 0));
  return p;
}

export function marble(): Pixels {
  const p = T();
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const light = x < 10 === y < 10;
      const vein = Math.abs(Math.sin((x + y * 0.6) * 0.7) * 3) < 0.25;
      p.set(x, y, light ? c('tile', vein ? 2 : 4) : c('black', vein ? 2 : 1));
    }
  return p;
}

export function rug(base = 'plum'): Pixels {
  const p = T(c(base, 1));
  for (let i = 0; i < 20; i++) {
    p.set(i, 1, c(base, 2)).set(i, 18, c(base, 2));
    p.set(1, i, c(base, 2)).set(18, i, c(base, 2));
  }
  for (let y = 3; y < 17; y++) for (let x = 3; x < 17; x++) if ((x + y) % 4 === 0 || (x - y + 40) % 4 === 0) p.set(x, y, c(base, 2));
  p.disc(10, 10, 2, c('gold', 1));
  return p;
}

export function flagstones(seed = 5): Pixels {
  const p = speckle(T(), 0, 0, 20, 20, r('gray'), 2, 1, seed, 0.2);
  for (let x = 0; x < 20; x++) p.set(x, 9, c('gray', 0)).set(x, 19, c('gray', 0));
  for (let y = 0; y < 9; y++) p.set(seed % 2 ? 6 : 13, y, c('gray', 0));
  for (let y = 10; y < 19; y++) p.set(seed % 2 ? 15 : 4, y, c('gray', 0));
  return p;
}

// ---------------------------------------------------------------- walls

export function wallTop(): Pixels {
  const p = speckle(T(), 0, 0, 20, 20, r('panel'), 0, 1, 9, 0.12);
  return p;
}

/** A paneled wall seen face on: molding, an inset panel and a baseboard. */
export function wallFace(seed = 0): Pixels {
  const p = T(c('panel', 3));
  for (let x = 0; x < 20; x++) {
    p.set(x, 0, c('panel', 1)).set(x, 1, c('gold', 1)).set(x, 2, c('panel', 4));
    p.set(x, 17, c('panel', 1)).set(x, 18, c('panel', 2)).set(x, 19, c('black', 0));
  }
  p.frame(3, 5, 14, 10, c('panel', 2));
  for (let y = 6; y < 14; y++) p.set(4, y, c('panel', 4));
  for (let x = 4; x < 16; x++) p.set(x, 6, c('panel', 4));
  if (seed % 2) p.set(10, 9, c('panel', 2));
  return p;
}

export function sconce(): Pixels {
  const p = wallFace();
  pool(p, 10, 8, 7, 6, r('glow'), 0, 2);
  p.rect(9, 9, 2, 5, c('gold', 2)).rect(8, 13, 4, 1, c('gold', 3));
  blob(p, 10, 7, 2, 3, r('glow'), 2, 4);
  return p;
}

/** A stone wall face (under the stage). */
export function stoneFace(): Pixels {
  const p = T(c('gray', 3));
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const row = Math.floor(y / 5);
      const edge = y % 5 === 4 || (x + (row % 2) * 5) % 10 === 9;
      p.set(x, y, edge ? c('gray', 1) : shadeAt(r('gray'), 2, 4, ((x * 13 + y * 7) % 10) / 10, x, y));
    }
  return p;
}

export function legs(): Pixels {
  const p = T();
  for (let x = 0; x < 20; x++) for (let y = 0; y < 20; y++) p.set(x, y, c('black', [0, 1, 2, 1, 0][x % 5]));
  return p;
}

/** The painted castle backdrop: 3 blocks wide, a moonlit tower and battlements. */
export function backdrop(part: number): Pixels {
  const big = new Pixels(60, 20);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 60; x++) big.set(x, y, shadeAt(r('navy'), 0, 2, y / 20, x, y));
  blob(big, 46, 6, 4, 4, r('paper'), 3, 5);
  big.disc(48, 5, 3, c('navy', 1));
  const R = rng(4);
  for (let i = 0; i < 14; i++) big.set(Math.floor(R() * 60), Math.floor(R() * 10), c('paper', 5));
  // battlements and a tower
  for (let x = 0; x < 60; x++) {
    const h = 13 + (x % 8 < 4 ? -2 : 0);
    for (let y = h; y < 20; y++) big.set(x, y, c('black', 1));
  }
  big.rect(18, 3, 10, 17, c('black', 1));
  for (let x = 17; x < 29; x += 3) big.rect(x, 1, 2, 2, c('black', 1));
  big.rect(22, 7, 2, 3, c('glow', 2));
  big.rect(38, 15, 2, 2, c('glow', 1));
  return big.crop(part * 20, 0, 20, 20);
}

// ---------------------------------------------------------------- doors & signs

/** A doorway in a wall (seen from above): the floor through it, posts, a name plate. */
export function doorway(label: string, floor = boards(4)): Pixels {
  const p = clone(floor);
  p.rect(0, 0, 3, 20, c('panel', 1)).rect(17, 0, 3, 20, c('panel', 1));
  p.rect(0, 0, 3, 1, c('gold', 1)).rect(17, 0, 3, 1, c('gold', 1));
  // the door leaf swung open against the left post
  p.rect(3, 1, 2, 16, c('panel', 4));
  p.set(4, 9, c('gold', 3));
  if (label) {
    const w = Math.max(9, label.length * 4 + 1);
    const x0 = 10 - Math.floor(w / 2);
    p.rect(x0, 1, w, 7, c('paper', 4)).frame(x0, 1, w, 7, c('gold', 1));
    microC(p, 10, 2, label, c('black', 0));
  }
  return p;
}

/** A closed door: solid leaf, brass knob, a plate. */
export function closedDoor(label: string, color = 'panel'): Pixels {
  const p = T(c(color, 3));
  p.rect(0, 0, 2, 20, c('panel', 1)).rect(18, 0, 2, 20, c('panel', 1));
  p.frame(4, 9, 12, 9, c(color, 2));
  p.set(15, 12, c('gold', 4)).set(15, 13, c('gold', 2));
  if (label) {
    const w = Math.max(9, label.length * 4 + 1);
    const x0 = 10 - Math.floor(w / 2);
    p.rect(x0, 1, w, 7, c('paper', 4)).frame(x0, 1, w, 7, c('gold', 1));
    microC(p, 10, 2, label, c('black', 0));
  }
  return p;
}

/** Five 3x5 letters take 19 of a block's 20 pixels: a note or board with such a line runs edge to edge. */
const wide = (lines: string[]) => lines.some((l) => microWidth(l) > 16);

/** A paper note pinned on a wall face, three short lines of writing. */
export function wallNote(lines: string[], paper = 'paper', inkName = 'black'): Pixels {
  const p = wallFace();
  if (wide(lines)) p.rect(0, 2, 20, 17, c(paper, 4)).rect(0, 2, 20, 1, c(paper, 2)).rect(0, 18, 20, 1, c(paper, 2));
  else p.rect(1, 2, 18, 17, c(paper, 4)).frame(1, 2, 18, 17, c(paper, 2));
  p.set(10, 2, c('velvet', 4));
  lines.forEach((l, i) => micro(p, microWidth(l) > 16 ? 1 : 2, 4 + i * 5, l, c(inkName, 0)));
  return p;
}

/** A chalkboard on the wall with chalk writing. */
export function chalkboard(lines: string[]): Pixels {
  const p = wallFace();
  p.rect(0, 2, 20, 17, c('wood', 1)).rect(wide(lines) ? 0 : 1, 3, wide(lines) ? 20 : 18, 15, c('green', 0));
  lines.forEach((l, i) => micro(p, microWidth(l) > 16 ? 1 : 2, 4 + i * 5, l, c('paper', 4)));
  return p;
}

// ---------------------------------------------------------------- furniture

/** A theater seat from above: the back at the top, the cushion, arms. */
export function seat(): Pixels {
  const p = carpet(1);
  p.rect(1, 2, 18, 6, c('velvet', 1)).rect(2, 3, 16, 4, c('velvet', 3));
  p.rect(2, 8, 16, 9, c('velvet', 4)).rect(3, 9, 14, 6, c('velvet', 5));
  p.rect(0, 4, 2, 13, c('wood', 1)).rect(18, 4, 2, 13, c('wood', 1));
  p.rect(0, 4, 2, 1, c('gold', 2)).rect(18, 4, 2, 1, c('gold', 2));
  return p;
}

export function rail(): Pixels {
  const p = carpet(2);
  p.rect(0, 0, 20, 7, c('wood', 0));
  p.rect(0, 7, 20, 2, c('gold', 3)).rect(0, 9, 20, 1, c('gold', 1));
  p.rect(4, 7, 2, 8, c('gold', 2)).rect(14, 7, 2, 8, c('gold', 2));
  return p;
}

export function footlight(bright: number): Pixels {
  const p = stageBoards(7);
  p.rect(0, 12, 20, 8, c('black', 1)).rect(0, 12, 20, 1, c('gold', 2));
  for (const x of [5, 15]) {
    pool(p, x, 10, 6 + bright, 6, r('glow'), 0, 1 + bright);
    blob(p, x, 13, 3, 2, r('glow'), 1 + bright, 3 + bright);
  }
  return p;
}

export const on = (base: Pixels, draw: (p: Pixels) => void) => {
  const p = clone(base);
  draw(p);
  return p;
};

/** Solid on every side. */
export const S = { solid: SOLID };

/** Adds a named block to the theater's set (see blockset.ts). */
export type Add = (name: string, p: Pixels, d?: BlockDef) => number;
