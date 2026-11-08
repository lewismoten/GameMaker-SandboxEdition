// THE MOUNTAIN MOVED NEXT DOOR's own look for the blocks every level is built on, drawn over the shared Starter
// blocks of the same names (Book.redraw) so nothing here looks like the Starters' tiles. The style is a trail
// guide's woodcut: hard ink edges, diagonal hatching for shade instead of speckle, earthy strata, and everything
// handmade by a trail crew (log ladders lashed with rope, split-log beams, fieldstone walls, a trailhead arch).
// The signs become routed trail signs: pale letters cut into a dark stained board.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../../kit/starter/book';
import { skyOf, type Pal } from '../../../kit/starter/palette';
import { exitArt, type ExitKind } from './exits';
import { inked } from './land';

/** Diagonal hatching: every `gap` pixels along x + y, color `c`, inside the rectangle. */
export function hatch(p: Pixels, x0: number, y0: number, w: number, h: number, c: number, gap = 4, phase = 0): void {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if ((x + y + phase) % gap === 0) p.set(x, y, c);
}

/** Earth in strata: a lighter band, a darker hatched band, and stones outlined in ink. */
function earth(pal: Pal, seed: number, top = 0, stones = 0): Pixels {
  const d = pal.r('dirt');
  const ink = pal.c('ink', 0);
  const p = new Pixels(20, 20, d[2]);
  const rand = rng(seed);
  const band = top + 4 + Math.floor(rand() * 6);
  p.rect(0, band, 20, 5, d[1]);
  hatch(p, 0, band, 20, 5, d[0], 3, seed);
  hatch(p, 0, top, 20, band - top, d[3], 7, seed);
  for (let i = 0; i < stones; i++) {
    const x = 2 + Math.floor(rand() * 14);
    const y = top + 2 + Math.floor(rand() * (16 - top));
    if (y > 17) continue;
    const s = pal.r('rock');
    p.rect(x, y, 4, 3, s[3])
      .rect(x + 1, y, 2, 1, s[4])
      .rect(x, y + 2, 4, 1, s[1]);
    p.set(x - 1, y + 1, ink)
      .set(x + 4, y + 1, ink)
      .rect(x, y - 1, 4, 1, ink)
      .rect(x, y + 3, 4, 1, ink);
  }
  return p;
}

/** Turf: a thick mat of moss and leaf litter with a wavy inked top edge, roots hanging into the strata below. */
function turf(pal: Pal): Pixels {
  const p = earth(pal, 3, 7);
  const m = pal.r('moss');
  const ink = pal.c('ink', 0);
  // a straight inked top (anything standing on the turf meets it), a flat mat, a sawtooth hem cut into the earth
  for (let x = 0; x < 20; x++) {
    const foot = 6 + (x % 4 < 2 ? 1 : 0);
    for (let y = 1; y < foot; y++) p.set(x, y, y < 3 ? m[4] : m[3]);
    p.set(x, 0, ink).set(x, foot, ink);
    if (x % 4 === 3) p.set(x, 4, m[1]).set(x, 3, m[1]);
  }
  for (let x = 1; x < 20; x += 10) p.set(x, 2, pal.c('orange', 3)).set(x + 1, 2, pal.c('brick', 3));
  return p;
}

/** A fieldstone: rounded, inked, lit from the upper left. */
export function fieldstone(p: Pixels, pal: Pal, x: number, y: number, w: number, h: number): void {
  const s = pal.r('rock');
  const ink = pal.c('ink', 0);
  p.rect(x, y, w, h, s[2])
    .rect(x + 1, y + 1, w - 3, 1, s[4])
    .rect(x + 1, y + 1, 1, h - 3, s[3]);
  hatch(p, x + 2, y + h - 3, w - 3, 2, s[1], 3);
  p.rect(x + 1, y, w - 2, 1, ink)
    .rect(x + 1, y + h - 1, w - 2, 1, ink)
    .rect(x, y + 1, 1, h - 2, ink)
    .rect(x + w - 1, y + 1, 1, h - 2, ink);
}

/** A dry-stone wall (the level's edges, the library's walls): three courses of fieldstones. */
function stoneWall(pal: Pal, seed: number): Pixels {
  const p = new Pixels(20, 20, pal.c('ink', 0));
  const rand = rng(seed);
  for (let row = 0; row < 3; row++) {
    let x = row % 2 ? -4 : 0;
    while (x < 20) {
      const w = 7 + Math.floor(rand() * 4);
      fieldstone(p, pal, x, row * 7 - 1, w, 7);
      x += w;
    }
  }
  return p;
}

/** A trail ladder: two barked log poles with rungs lashed on with rope. */
export function logLadder(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const w = pal.r('wood');
  const ink = pal.c('ink', 0);
  for (const x of [2, 15]) {
    p.rect(x, 0, 4, 20, w[1])
      .rect(x + 1, 0, 1, 20, w[3])
      .rect(x, 0, 1, 20, ink)
      .rect(x + 3, 0, 1, 20, ink);
    for (let y = 2; y < 20; y += 7) p.set(x + 2, y, w[0]).set(x + 2, y + 1, w[0]);
  }
  for (const y of [4, 14]) {
    p.rect(6, y, 9, 3, w[2])
      .rect(6, y, 9, 1, w[4])
      .rect(6, y + 3, 9, 1, ink);
    const rope = pal.c('parch', 3);
    for (const x of [5, 14]) p.rect(x, y - 1, 2, 5, rope).set(x, y + 1, pal.c('parch', 1));
  }
  return p;
}

/** The top of a trail ladder, standing on the floor it climbs to: the poles rise from the cell's foot and end in rounded, inked caps, one rung lashed between. */
export function logLadderTop(pal: Pal): Pixels {
  const p = logLadder(pal);
  const sky = skyOf(pal);
  const w = pal.r('wood');
  const ink = pal.c('ink', 0);
  p.rect(0, 0, 20, 8, sky);
  for (const x of [2, 15])
    p.rect(x + 1, 6, 2, 2, w[3])
      .rect(x, 7, 1, 1, ink)
      .rect(x + 3, 7, 1, 1, ink)
      .rect(x + 1, 5, 2, 1, ink);
  return p;
}

/** A split-log beam to stand on, bark below and the pale split face on top. */
function logBeam(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const w = pal.r('wood');
  const ink = pal.c('ink', 0);
  p.rect(0, 0, 20, 3, w[4]).rect(0, 3, 20, 5, w[1]);
  hatch(p, 0, 3, 20, 5, w[0], 3);
  p.rect(0, 8, 20, 1, ink).rect(0, 0, 20, 1, pal.c('parch', 4));
  for (let x = 3; x < 20; x += 7) p.set(x, 1, w[2]).set(x + 1, 1, w[2]);
  return p;
}

/** A flat, inked cloud with a hatched underside, two blocks wide. */
function inkCloud(pal: Pal): Pixels {
  const p = new Pixels(40, 20, skyOf(pal));
  const sky = skyOf(pal);
  const hi = pal.c('white', 3);
  const lo = pal.c('fog', 1);
  for (const [x, y, r] of [
    [11, 11, 6],
    [20, 8, 8],
    [29, 11, 6],
  ])
    p.disc(x, y, r, hi);
  p.rect(5, 11, 30, 5, hi);
  for (let y = 11; y < 16; y++) for (let x = 5; x < 35; x++) if (p.get(x, y) === hi && (x + y) % 3 === 0) p.set(x, y, lo);
  p.rect(5, 15, 30, 1, lo);
  return inked(pal, p).map((_x, y, c) => (y > 16 && c !== sky ? sky : c));
}

/** A juniper shrub: a dark rounded mass with inked edges and frosty berries. */
function juniper(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const m = pal.r('moss');
  p.disc(10, 13, 7, m[1]).disc(6, 15, 4, m[1]).disc(14, 15, 4, m[1]).rect(3, 15, 14, 5, m[1]);
  hatch(p, 3, 8, 15, 12, m[0], 3);
  p.disc(8, 11, 2, m[2]);
  for (const [x, y] of [
    [7, 14],
    [12, 12],
    [14, 16],
    [9, 17],
  ])
    p.set(x, y, pal.c('blue', 4));
  return inked(pal, p);
}

/** Asters: a late purple wildflower on a wiry stem. */
function aster(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const m = pal.r('moss');
  p.rect(9, 9, 1, 11, m[1]).rect(6, 13, 3, 1, m[1]).rect(10, 15, 3, 1, m[1]);
  for (const [cx, cy] of [
    [9, 7],
    [5, 12],
    [13, 14],
  ]) {
    for (const [dx, dy] of [
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
      [-1, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
    ])
      p.set(cx + dx, cy + dy, pal.c('purple', 3));
    p.set(cx, cy, pal.c('gold', 4));
  }
  return inked(pal, p);
}

/** The way in: a trailhead arch of two posts and a crossbeam, a lantern hanging from it, 20 x 40. */
function trailhead(pal: Pal): Pixels {
  const p = new Pixels(20, 40, skyOf(pal));
  const w = pal.r('wood');
  const g = pal.r('gold');
  for (const x of [1, 16]) p.rect(x, 3, 3, 37, w[1]).rect(x, 3, 1, 37, w[3]);
  p.rect(0, 2, 20, 4, w[2]).rect(0, 2, 20, 1, w[4]);
  hatch(p, 0, 3, 20, 3, w[0], 3);
  p.rect(9, 6, 1, 4, pal.c('ink', 0)).rect(7, 10, 5, 6, g[2]).rect(8, 11, 3, 4, g[5]).rect(7, 10, 5, 1, w[0]);
  return inked(pal, p);
}

/** Recolors a sign block as a routed trail sign: the cream face turns to stained wood with its grain gouged in, and the ink letters to pale cuts. */
function routed(pal: Pal, pic: Pixels): Pixels {
  const parch = pal.r('parch');
  const wood = pal.r('wood');
  const ink = pal.c('ink', 0);
  const to = new Map<number, number>([
    [parch[3], wood[1]],
    [parch[4], wood[2]],
    [parch[2], wood[0]],
    [ink, pal.c('parch', 4)],
  ]);
  const out = pic.map((_x, _y, c) => to.get(c) ?? c);
  // the board's grain, gouged in long dashes wherever the face is clear of the letters by a pixel all round
  const face = wood[1];
  const clear = (x: number, y: number) => {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) if (out.get(Math.min(19, Math.max(0, x + dx)), Math.min(19, Math.max(0, y + dy))) !== face) return false;
    return true;
  };
  const grain: [number, number][] = [];
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (y % 6 === 3 && (x + y * 3) % 11 > 1 && clear(x, y)) grain.push([x, y]);
  for (const [x, y] of grain) out.set(x, y, wood[0]);
  return out;
}

/** Gives a block set the game's own look: the shared blocks drawn again, the way out drawn for its place (exits.ts), the signs routed. */
export function restyle(book: Book, pal: Pal, exit: ExitKind = 'cairn'): void {
  book.redraw('grass', turf(pal));
  book.redraw('dirt', earth(pal, 7));
  book.redraw('edge', stoneWall(pal, 1));
  book.redraw('brick', stoneWall(pal, 2));
  book.redraw('ladder', logLadder(pal));
  book.redraw('plank', logBeam(pal));
  const cloud = inkCloud(pal);
  book.redraw('cloudL', cloud.crop(0, 0, 20, 20));
  book.redraw('cloudR', cloud.crop(20, 0, 20, 20));
  book.redraw('bush', juniper(pal));
  book.redraw('flower', aster(pal));
  const [exitTop, exitBottom] = exitArt(pal, exit);
  book.redraw('doorTop', exitTop);
  book.redraw('doorBottom', exitBottom);
  const arch = trailhead(pal);
  book.redraw('doorwayTop', arch.crop(0, 0, 20, 20));
  book.redraw('doorwayBottom', arch.crop(0, 20, 20, 20));
  for (const name of book.index.keys()) if (/^sign\./.test(name)) book.redraw(name, routed(pal, book.pics.get(name) as Pixels));
}
