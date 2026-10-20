// Background block art shared by the levels: skies, ground, wood, brick, fences, and the
// Klown Car that waits at the end of every level.
import { Pixels, rng } from '../kit/pixels';
import { CLEAR, blob, gradient, over, shadeAt, speckle, sprite } from './draw';
import { P } from './pal';

export const r = (name: string) => P.r(name);
export const c = (name: string, k: number) => P.c(name, k);

/** Sky band k (0 = high, 3 = the horizon): a dithered slice of the 8-shade sky ramp. */
export function sky(k: number): Pixels {
  const p = new Pixels(20, 20);
  if (k === 0) return gradient(p, 0, 0, 20, 20, r('sky'), 0.5, 0.5);
  return gradient(p, 0, 0, 20, 20, r('sky'), k * 2 - 1, k * 2 + 1);
}

/** Part of a puffy cloud over sky band k: part 0 left, 1 middle, 2 right. */
export function cloud(k: number, part: number, seed = 1): Pixels {
  const p = sky(k);
  const R = rng(seed + part * 7);
  const lumps =
    part === 1
      ? [
          [3, 11, 6],
          [10, 8, 7],
          [17, 11, 6],
        ]
      : part === 0
        ? [
            [14, 12, 5],
            [20, 9, 6],
          ]
        : [
            [0, 9, 6],
            [6, 12, 5],
          ];
  for (const [x, y, rad] of lumps) blob(p, x, y + R(), rad + R(), rad - 1, r('cloud'), 0, 2);
  for (let x = 0; x < 20; x++) if (p.get(x, 16) !== p.get(x, 0) && R() < 0.5) p.set(x, 17, c('cloud', 0));
  return p;
}

/** Ground: dirt texture with pebbles; `deep` is darker. */
export function dirt(seed: number, deep = false): Pixels {
  const p = new Pixels(20, 20);
  speckle(p, 0, 0, 20, 20, r('dirt'), deep ? 1 : 2, 1, seed, 0.3);
  const R = rng(seed * 3 + 1);
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(R() * 18);
    const y = Math.floor(R() * 18);
    p.set(x, y, c('dirt', deep ? 2 : 3))
      .set(x + 1, y, c('dirt', 4))
      .set(x, y + 1, c('dirt', 0));
  }
  return p;
}

/** Grass on top of dirt (the walkable ground). */
export function grassTop(seed: number, under?: Pixels): Pixels {
  const p = dirt(seed);
  const R = rng(seed + 50);
  for (let x = 0; x < 20; x++) {
    const h = 4 + Math.floor(R() * 3);
    for (let y = 0; y < h; y++) p.set(x, y, shadeAt(r('grass'), 1, 4, 1 - y / h, x, y));
    p.set(x, h, c('grass', 0));
  }
  // blades poking up are drawn in the air block above by grassTuft; keep the top row lit
  for (let x = 0; x < 20; x += 3) p.set(x + (seed % 3), 0, c('grass', 4));
  return under ? over(under, p) : p;
}

/** A few grass blades and maybe a flower, over another block (the air above the lawn). */
export function tuft(base: Pixels, seed: number, flower?: string): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  const R = rng(seed);
  for (let i = 0; i < 7; i++) {
    const x = Math.floor(R() * 20);
    const h = 1 + Math.floor(R() * 3);
    for (let y = 0; y < h; y++) p.set(x, 19 - y, c('grass', 2 + (y === h - 1 ? 1 : 0)));
  }
  if (flower) {
    const x = 4 + Math.floor(R() * 12);
    p.rect(x, 14, 1, 6, c('grass', 1));
    p.set(x - 1, 13, c(flower, 3))
      .set(x + 1, 13, c(flower, 3))
      .set(x, 12, c(flower, 3))
      .set(x, 14, c(flower, 3))
      .set(x, 13, c('yellow', 3));
  }
  return p;
}

/** Wood planks running horizontally. */
export function planks(seed: number, ramp = 'wood', base = 3): Pixels {
  const p = new Pixels(20, 20);
  const R = rng(seed);
  for (let row = 0; row < 4; row++) {
    const y0 = row * 5;
    speckle(p, 0, y0, 20, 5, r(ramp), base, 1, seed + row, 0.15);
    p.rect(0, y0 + 4, 20, 1, c(ramp, base - 2));
    p.rect(0, y0, 20, 1, c(ramp, Math.min(4, base + 1)));
    const seam = Math.floor(R() * 20);
    p.rect(seam, y0, 1, 5, c(ramp, base - 2));
  }
  return p;
}

/** A bevelled box face (crates, garden boxes, pedestals). */
export function boxFace(ramp: string, base: number, seed: number, nails = true): Pixels {
  const p = planks(seed, ramp, base);
  p.frame(0, 0, 20, 20, c(ramp, 0));
  p.rect(1, 1, 18, 1, c(ramp, 4)).rect(1, 1, 1, 18, c(ramp, 4));
  if (nails) p.set(3, 3, c('metal', 1)).set(16, 3, c('metal', 1)).set(3, 16, c('metal', 1)).set(16, 16, c('metal', 1));
  return p;
}

/** Bricks. */
export function bricks(seed: number, ramp = 'brick', mortar = 'stone'): Pixels {
  const p = new Pixels(20, 20, c(mortar, 3));
  const R = rng(seed);
  for (let row = 0; row < 4; row++) {
    const off = row % 2 ? 5 : 0;
    for (let bx = -1; bx < 3; bx++) {
      const x = bx * 10 + off;
      const k = 1 + Math.floor(R() * 3);
      p.rect(x, row * 5, 9, 4, c(ramp, k));
      p.rect(x, row * 5, 9, 1, c(ramp, k + 1));
    }
  }
  return p;
}

/** Clapboard siding (houses). */
export function siding(ramp = 'siding'): Pixels {
  const p = new Pixels(20, 20);
  for (let y = 0; y < 20; y++) {
    const k = y % 5 === 4 ? 0 : y % 5 === 0 ? 3 : 2;
    p.rect(0, y, 20, 1, c(ramp, k));
  }
  return p;
}

/** A window pane over a wall. */
export function windowOn(wall: Pixels, lit = false, curtain = 'red'): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(wall.px);
  p.rect(2, 2, 16, 16, c('paint', 3));
  p.rect(4, 4, 12, 12, lit ? c('glow', 2) : c('sky', 5));
  if (!lit) {
    p.line(5, 13, 10, 5, c('sky', 7)).line(8, 14, 13, 6, c('sky', 7));
  }
  p.rect(9, 4, 2, 12, c('paint', 3)).rect(4, 9, 12, 2, c('paint', 3));
  p.rect(4, 4, 3, 12, c(curtain, 2)).rect(13, 4, 3, 12, c(curtain, 2));
  p.rect(1, 18, 18, 2, c('paint', 1));
  return p;
}

/** A white picket fence board pair over a background (`top` = the pointed tops). */
export function picket(base: Pixels, top: boolean, ramp = 'paint'): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  for (const x0 of [2, 12]) {
    p.rect(x0, top ? 4 : 0, 6, top ? 16 : 20, c(ramp, 3));
    p.rect(x0, top ? 4 : 0, 1, top ? 16 : 20, c(ramp, 2));
    p.rect(x0 + 5, top ? 4 : 0, 1, top ? 16 : 20, c(ramp, 1));
    if (top) {
      p.set(x0 + 2, 2, c(ramp, 3)).set(x0 + 3, 2, c(ramp, 3));
      p.rect(x0 + 1, 3, 4, 1, c(ramp, 3));
    }
  }
  p.rect(0, top ? 8 : 10, 20, 2, c(ramp, 2)).rect(0, top ? 10 : 12, 20, 1, c(ramp, 0));
  return p;
}

/** A tall plank fence (the backyard's): `cap` is the top row. */
export function plankFence(cap: boolean): Pixels {
  const p = new Pixels(20, 20);
  for (let i = 0; i < 4; i++) {
    const x = i * 5;
    p.rect(x, 0, 5, 20, c('wood', 2 + (i % 2)));
    p.rect(x, 0, 1, 20, c('wood', 0));
    if (cap) p.rect(x, 0, 5, 2, c('wood', 4));
  }
  p.rect(0, 6, 20, 2, c('wood', 1)).rect(0, 15, 20, 2, c('wood', 1));
  for (let y = 0; y < 20; y += 4) p.set(2 + (y % 3), y, c('wood', 1));
  return p;
}

/** Dark tunnel dirt (dug-out earth behind the tunnel). */
export function tunnel(seed: number): Pixels {
  const p = new Pixels(20, 20);
  speckle(p, 0, 0, 20, 20, r('dirt'), 0, 1, seed, 0.2);
  const R = rng(seed);
  for (let i = 0; i < 4; i++) p.set(Math.floor(R() * 20), Math.floor(R() * 20), c('dirt', 2));
  return p;
}

/** A treat marker painted on the ground: "X" marks a buried bone. */
export function xMark(base: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  for (let i = 0; i < 6; i++) {
    p.set(7 + i, 1 + i, c('paint', 3)).set(12 - i, 1 + i, c('paint', 3));
  }
  return p;
}

/** Stamps an ASCII sprite (with its own key) onto a copy of a base block. */
export function stampOn(base: Pixels, rows: string[], key: Record<string, number>, dx?: number, dy?: number): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  return over(p, sprite(rows, key, dx, dy));
}

/** Cuts a big drawing into 20x20 blocks: returns [row][col]. */
export function cut(big: Pixels): Pixels[][] {
  const out: Pixels[][] = [];
  for (let y = 0; y < big.h; y += 20) {
    const row: Pixels[] = [];
    for (let x = 0; x < big.w; x += 20) row.push(big.crop(x, y, 20, 20));
    out.push(row);
  }
  return out;
}

/** A big drawing area filled with one background block repeated (for multi-block art). */
export function canvas(wide: number, high: number, base: Pixels | ((bx: number, by: number) => Pixels)): Pixels {
  const p = new Pixels(wide * 20, high * 20);
  for (let by = 0; by < high; by++) for (let bx = 0; bx < wide; bx++) p.blit(typeof base === 'function' ? base(bx, by) : base, bx * 20, by * 20);
  return p;
}

export { CLEAR };

/** Hedge leaves: `top` puts the bushy top edge over the horizon sky. */
export function hedge(top: boolean, seed: number, base?: Pixels): Pixels {
  const p = top ? (base ? copy(base) : sky(3)) : new Pixels(20, 20, c('leaf', 1));
  const R = rng(seed);
  for (let i = 0; i < 9; i++) blob(p, R() * 20, (top ? 12 : 4) + R() * 10, 4 + R() * 3, 4 + R() * 2, r('leaf'), 0, 3, 0.8);
  return p;
}

/** Tree leaves over a background block. */
export function leaves(seed: number, base: Pixels): Pixels {
  const p = copy(base);
  const R = rng(seed);
  for (let i = 0; i < 8; i++) blob(p, R() * 20, R() * 20, 4 + R() * 3, 3 + R() * 3, r('leaf'), 0, 3, 0.9);
  for (let i = 0; i < 6; i++) p.set(Math.floor(R() * 20), Math.floor(R() * 20), c('grass', 3));
  return p;
}

/** A tree trunk over a background block. */
export function trunk(base: Pixels): Pixels {
  const p = copy(base);
  for (let y = 0; y < 20; y++) for (let x = 5; x < 15; x++) p.set(x, y, shadeAt(r('wood'), 0, 2, (x - 5) / 10 + ((y * 7 + x) % 5 === 0 ? 0.3 : 0), x, y));
  return p;
}

/** A branch to stand on, over a background block. */
export function branch(base: Pixels): Pixels {
  const p = copy(base);
  p.rect(0, 0, 20, 5, c('wood', 2)).rect(0, 0, 20, 1, c('wood', 3)).rect(0, 4, 20, 1, c('wood', 0));
  p.set(6, 5, c('wood', 1)).set(14, 5, c('wood', 1));
  return p;
}

/** A copy of a block picture. */
export function copy(base: Pixels): Pixels {
  const p = new Pixels(base.w, base.h);
  p.px.set(base.px);
  return p;
}

/** Things buried in the dirt, for the screenful of ground under Teddy's feet. */
export function buried(kind: 'rock' | 'roots' | 'fossil' | 'ball' | 'worm', seed: number, deep = false): Pixels {
  const p = dirt(seed, deep);
  if (kind === 'rock') {
    blob(p, 8, 10, 6, 4, r('stone'), 0, 3);
    blob(p, 15, 14, 3, 2, r('stone'), 0, 2);
  } else if (kind === 'roots') {
    p.line(4, 0, 7, 8, c('wood', 1)).line(7, 8, 5, 15, c('wood', 1)).line(7, 8, 13, 13, c('wood', 1)).line(13, 13, 17, 19, c('wood', 0));
    p.line(12, 0, 13, 6, c('wood', 1));
  } else if (kind === 'fossil') {
    p.rect(4, 9, 12, 2, c('stone', 4));
    blob(p, 4, 9, 2, 2, r('stone'), 3, 4);
    blob(p, 4, 11, 2, 2, r('stone'), 3, 4);
    blob(p, 16, 9, 2, 2, r('stone'), 3, 4);
    blob(p, 16, 11, 2, 2, r('stone'), 3, 4);
  } else if (kind === 'ball') {
    blob(p, 10, 10, 4, 4, r('red'), 0, 3);
    p.line(7, 8, 13, 12, c('paint', 3));
  } else {
    for (let i = 0; i < 9; i++)
      p.set(5 + i, 10 + Math.round(Math.sin(i / 1.5) * 2), c('pink', 1)).set(5 + i, 11 + Math.round(Math.sin(i / 1.5) * 2), c('pink', 0));
  }
  return p;
}
