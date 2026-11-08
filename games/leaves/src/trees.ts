// The trees and the ground of LEAVES IN THE WIND. A tree is a crown three blocks wide and three high on a trunk one block
// wide: the crown is drawn whole, as round clumps of leaves lit from the upper left, then cut into its nine blocks. Its
// top row has three more pictures, the same leaves leaning right, sheared so the lean grows toward the top and the join
// with the row below never moves:
//   lean1   a breath of wind (four pixels at the top)
//   lean2   a gust (nine pixels at the top)
// The ground is the Starters' grass with fallen leaves on it, in three patterns so it does not look stamped.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { RAMP, type Kind } from './palette';

/** How far each pose leans the top of the crown, in pixels. */
export const LEAN = { rest: 0, lean1: 4, lean2: 9 } as const;
export type Lean = keyof typeof LEAN;

/** A crown's leaves: [x, y, radius, shade] in its 60x60 picture, many small round bunches in an oval, each lit as if the
 * crown were a ball lit from the upper left (with a little chance in it), darkest first so the lit ones sit on top. */
function bunches(seed: number): [number, number, number, number][] {
  const rand = rng(seed);
  const light = [-0.5, -0.62, 0.6];
  const n = Math.hypot(...light);
  const out: [number, number, number, number][] = [];
  for (let i = 0; i < 230; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand());
    const nx = Math.cos(a) * r;
    const ny = Math.sin(a) * r;
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    const lum = (nx * light[0] + ny * light[1] + nz * light[2]) / n + (rand() - 0.5) * 0.35;
    const shade = lum > 0.88 ? 4 : lum > 0.56 ? 3 : lum > 0.2 ? 2 : 1;
    out.push([30 + nx * 25, 27 + ny * 23, 2 + rand() * 1.6, shade]);
  }
  return out.sort((p, q) => p[3] - q[3]);
}

/** The trunk's colors: dark bark for the maple and the oak, white with dark marks for the birch. */
function bark(pal: Pal, kind: Kind, x: number, y: number): number {
  if (kind === 'birch') {
    const mark = (y * 7 + (x > 9 ? 3 : 0)) % 11 === 0 || ((y * 5) % 13 === 0 && x > 7 && x < 12);
    if (mark) return pal.c('ink', 0);
    return x < 8 ? pal.c('white', 3) : x < 12 ? pal.c('white', 2) : pal.c('white', 1);
  }
  const w = pal.r('wood');
  const groove = (x * 3 + Math.floor(y / 3)) % 5 === 0;
  return groove ? w[0] : x < 8 ? w[2] : x < 12 ? w[1] : w[0];
}

/** The whole crown, 60x60, with the sky behind, leaning `lean` pixels at the top. The trunk shows at the bottom middle. */
export function crownPicture(pal: Pal, kind: Kind, seed: number, lean = 0): Pixels {
  const ramp = pal.r(RAMP[kind]);
  const sky = skyOf(pal);
  const p = new Pixels(60, 60, sky);
  // the trunk and two branches, under the leaves
  for (let y = 34; y < 60; y++) for (let x = 26; x < 34; x++) p.set(x, y, bark(pal, kind, x - 20, y));
  p.line(29, 44, 17, 32, bark(pal, kind, 3, 0)).line(30, 44, 18, 32, bark(pal, kind, 9, 0));
  p.line(31, 42, 43, 30, bark(pal, kind, 9, 0)).line(31, 43, 43, 31, bark(pal, kind, 14, 0));
  const bs = bunches(seed);
  const inside = new Uint8Array(60 * 60);
  for (const [cx, cy, r, shade] of bs)
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        if (x < 0 || y < 0 || x >= 60 || y >= 60 || (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 > r * r) continue;
        // a bunch is lit on its own upper left too: one shade lighter there, one darker at its lower right
        const side = x + 0.5 - cx + (y + 0.5 - cy);
        const s = Math.min(4, Math.max(1, shade + (side < -r * 0.7 ? 1 : side > r * 0.8 ? -1 : 0)));
        p.set(x, y, ramp[s]);
        inside[y * 60 + x] = 1;
      }
  // gaps the sky can't reach from outside are filled with shade, so the crown has no holes (they read as eyes)
  const outside = new Uint8Array(60 * 60);
  const todo: number[] = [];
  for (let i = 0; i < 60; i++) todo.push(i, 59 * 60 + i, i * 60, i * 60 + 59);
  while (todo.length) {
    const k = todo.pop()!;
    if (outside[k] || inside[k]) continue;
    outside[k] = 1;
    const x = k % 60;
    const y = (k - x) / 60;
    if (x > 0) todo.push(k - 1);
    if (x < 59) todo.push(k + 1);
    if (y > 0) todo.push(k - 60);
    if (y < 59) todo.push(k + 60);
  }
  for (let k = 0; k < 60 * 60; k++)
    if (!outside[k] && !inside[k]) {
      inside[k] = 1;
      p.set(k % 60, Math.floor(k / 60), ramp[1]);
    }
  const inCrown = (x: number, y: number) => x >= 0 && y >= 0 && x < 60 && y < 60 && inside[y * 60 + x] === 1;
  // the outline of the whole crown against the sky
  const edge = new Pixels(60, 60).blit(p, 0, 0);
  for (let y = 0; y < 60; y++)
    for (let x = 0; x < 60; x++)
      if (inCrown(x, y) && (!inCrown(x - 1, y) || !inCrown(x + 1, y) || !inCrown(x, y - 1) || !inCrown(x, y + 1))) edge.set(x, y, ramp[0]);
  if (!lean) return edge;
  // the lean: each row of the top block moves right, most at the top, none at the join with the middle row
  const out = new Pixels(60, 60, sky).blit(edge, 0, 0);
  for (let y = 0; y < 20; y++) {
    const dx = Math.round((lean * (20 - y)) / 20);
    for (let x = 0; x < 60; x++) {
      const from = x - dx;
      out.set(x, y, from >= 0 ? edge.get(from, y) : sky);
    }
  }
  return out;
}

/** A crown block's name: `${kind}${tree}.${col}${row}`. */
export const crownName = (kind: Kind, tree: number, col: number, row: number) => `${kind}${tree}.${col}${row}`;

/** The trunk block of a kind: bark with the grass behind its foot (`foot`) or the sky. */
export function trunkPicture(pal: Pal, kind: Kind, foot: boolean): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  for (let y = 0; y < 20; y++) for (let x = 6; x < 14; x++) p.set(x, y, bark(pal, kind, x, y));
  if (foot) {
    // roots spread onto the grass
    const w = kind === 'birch' ? pal.c('white', 1) : pal.r('wood')[0];
    p.rect(4, 17, 2, 3, w).rect(14, 17, 2, 3, w).rect(3, 19, 1, 1, w).rect(16, 19, 1, 1, w);
  }
  return p;
}

/** One small fallen leaf on the grass, two or three pixels: a dot of color with a dark side. */
function fallen(p: Pixels, pal: Pal, kind: Kind, x: number, y: number, flip: boolean): void {
  const r = pal.r(RAMP[kind]);
  p.set(x, y, r[3])
    .set(x + (flip ? -1 : 1), y, r[2])
    .set(x, y + 1, r[1]);
}

/** Grass with fallen leaves on it: `v` 0 to 2 are three patterns. It is solid ground, like the Starters' grass. */
export function leafGrassPicture(pal: Pal, grass: Pixels, v: number): Pixels {
  const p = new Pixels(20, 20).blit(grass, 0, 0);
  const rand = rng(70 + v * 11);
  const kinds: Kind[] = ['maple', 'oak', 'birch'];
  for (let i = 0; i < 6; i++) fallen(p, pal, kinds[Math.floor(rand() * 3)], 1 + Math.floor(rand() * 17), Math.floor(rand() * 4), rand() < 0.5);
  return p;
}

/** A tree's crown in each pose, whole (60x60). */
export function crowns(pal: Pal, kind: Kind, seed: number): Record<Lean, Pixels> {
  return { rest: crownPicture(pal, kind, seed), lean1: crownPicture(pal, kind, seed, LEAN.lean1), lean2: crownPicture(pal, kind, seed, LEAN.lean2) };
}

/** One block of a crown picture: column and row 0 to 2. */
export const cell = (crown: Pixels, col: number, row: number): Pixels => crown.crop(col * 20, row * 20, 20, 20);

/** Adds a tree's crown blocks in its upright pose, `crownName(kind, tree, col, row)`, but for the cells in `skip` ("col,row"),
 * which the level adds itself (a branch that drops leaves, or a top block that bends in the gust). */
export function addTree(book: Book, pal: Pal, kind: Kind, tree: number, crown: Pixels, skip: string[] = []): void {
  const air = { grav: PULL.down };
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++) if (!skip.includes(`${col},${row}`)) book.add(crownName(kind, tree, col, row), cell(crown, col, row), air);
  void pal;
}

/** The trunks (one each kind used, with and without a foot) and the leafy grass. */
export function addGround(book: Book, pal: Pal, kinds: readonly Kind[]): void {
  const air = { grav: PULL.down };
  for (const kind of kinds) {
    book.add(`${kind}.trunk`, trunkPicture(pal, kind, false), air);
    book.add(`${kind}.foot`, trunkPicture(pal, kind, true), air);
  }
  const grass = book.pics.get('grass')!;
  for (let v = 0; v < 3; v++) book.add(`leafGrass${v}`, leafGrassPicture(pal, grass, v), { solid: SOLID });
}
