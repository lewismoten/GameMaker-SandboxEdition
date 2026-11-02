// Level 9, Muffled (the garage at night, moonlight through the window; Teddy). Gwinn took the
// 8-track tapes to bed, and she's asleep on the moving blanket. Teddy sneaks in to fetch them.
// Squeaky toys lie about: a touch squeaks one (once) and wakes Gwinn a little (the Zzz meter is his
// energy), so he hops them. A blanket corner he tucks back in lets her settle (energy back).
// The way over her is the shelf above her bed; touching Gwinn herself wakes her a lot. The
// tapes sit on a crate past her bed; with them, the door at the end opens. Up on the high shelf
// past her bed: the felt egg (in the set's last slot, a number no other map shows). Sir Reginald
// is still Sir Reginald here; his egg comes after this level (banter.ts EGG). The sign that tells how to save is in the next level, The Rain Delay.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline, scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { blob } from '../../../snowbound/src/art/draw';
import { text } from '../../../snowbound/src/art/font';
import { ZZZ } from '../../../teddy2/src/sprites/teddy';
import { rubberEgg } from '../art/egg';
import { AIR, countedDoor, kit, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import type { Pal } from '../art/palette';
import { CTR, MON } from '../ids';
import { decorate } from './decor';
import { MapBuilder, at, type Level } from './maps';

/** The egg's block number (about.json "egg" and web/src/eggs/eggs.ts carry it too). */
export const EGG_BLOCK = 149;
export const MUFFLED = {
  w: 44,
  floor: 9,
  /** Gwinn's bed on the blanket: [first x, last x] on the floor. */
  bed: [21, 23] as [number, number],
  bench: [17, 19] as [number, number],
  shelf: [20, 25] as [number, number],
  crate: 30,
  egg: [27, 2] as [number, number],
  door: 40,
  exit: 41,
} as const;
/** Squeaky toys on the floor (level x). */
/** Gwinn's width in blocks, across the bed. */
const GWINN_W = 3;
/** The box round a sprite's own pixels (255 is clear). */
/** Gwinn lying asleep on her side (60x40, clear 255), her head to the left; `stir`: head up, an eye open. */
function sleepingGwinn(pal: Pal, stir: boolean): Pixels {
  const c = pal.c;
  const ink = c('ink', 0);
  const fur = pal.r('gwinn');
  const p = new Pixels(60, 40, 255);
  const hy = stir ? 23 : 28;
  // the thin tail, curled round the back
  p.line(50, 31, 55, 28, c('gwinn', 1)).line(55, 28, 56, 24, c('gwinn', 1)).line(51, 32, 56, 29, c('gwinn', 2));
  // the body and the haunch, the far legs tucked under
  blob(p, 33, 30, 17, 7.5, fur, 1, 3);
  blob(p, 44, 28, 8, 8, fur, 1, 3);
  // the hind paw out in front of the haunch, and the front paws under her chin
  p.rect(38, 35, 12, 3, c('gwinn', 2)).rect(38, 35, 12, 1, c('gwinn', 3));
  p.rect(5, 35, 14, 3, c('gwinn', 2)).rect(5, 35, 14, 1, c('gwinn', 3)).set(9, 37, c('gwinn', 1)).set(14, 37, c('gwinn', 1));
  // the white chest
  blob(p, 22, 33, 3, 2.6, pal.r('fur'), 1, 3);
  // the head: round, a muzzle out to the left, the floppy ear hanging
  blob(p, 15, hy, 7, 6, fur, 1, 3);
  blob(p, 8, hy + 2, 5, 3.4, fur, 1, 3);
  p.rect(3, hy + 1, 2, 2, ink);
  for (const [y, r] of [
    [hy + 1, 3.4],
    [hy + 4, 3],
  ])
    p.disc(18, y, r + 1, ink);
  p.disc(18, hy + 1, 2.4, c('gwinn', 1))
    .disc(18, hy + 4, 2, c('gwinn', 1))
    .set(17, hy, c('gwinn', 2));
  if (stir) {
    p.rect(11, hy - 1, 2, 2, c('fur', 2)).set(12, hy, ink);
    p.rect(6, hy + 5, 2, 2, c('tongue', 1));
  } else p.line(11, hy - 1, 14, hy - 1, ink).set(10, hy - 2, ink);
  // the pink collar and its yellow tag
  for (let y = hy - 2; y < hy + 7; y++) p.rect(22, y, 2, 1, c('pink', 2));
  p.rect(22, hy + 7, 2, 2, c('yellow', 3));
  return outline(p, ink);
}

function bounds(p: Pixels): { x: number; y: number; w: number; h: number } {
  let [x0, y0, x1, y1] = [p.w, p.h, -1, -1];
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) if (p.get(x, y) !== 255) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
export const TOYS = [11, 14, 27, 33, 35];
/** Blanket corners to tuck back in (level x, on the floor). */
export const TUCKS = [16, 31];

/** The moonbeam: from under the window (its top-left cell) down to the floor, drifting right
 * `drift` pixels as it falls; `blocks` lists the cells (in the beam's own grid) it lights. */
const BEAM = {
  x: 6,
  y: 3,
  w: 5,
  h: 6,
  drift: 56,
  blocks(): [number, number][] {
    const out: [number, number][] = [];
    for (let by = 0; by < this.h; by++)
      for (let bx = 0; bx < this.w; bx++) {
        let hit = false;
        for (let y = by * 20; y < by * 20 + 20 && !hit; y++) {
          const t = y / (this.h * 20);
          const cx = 10 + t * this.drift;
          const half = 7 + t * 6;
          hit = cx + half > bx * 20 && cx - half < bx * 20 + 20;
        }
        if (hit) out.push([bx, by]);
      }
    return out;
  },
};

export function muffledBlocks(pal: Pal): Kit {
  const k = kit(pal);
  baseSet(k, 'garage');
  const { book, c, R } = k;
  const wall = () => k.pic('wall');
  // a squeaky toy: a rubber bone, a ball or a ring; squeaked, it bulges and lets out a "!"
  const toy = (kind: number, squeaked: boolean) => {
    const p = wall();
    const ramp = [R('accent'), R('pipe'), R('lamp')][kind % 3];
    const s = squeaked ? 1.25 : 1;
    if (kind % 3 === 0) {
      blob(p, 6, 15, 3 * s, 3 * s, ramp, 0, 3);
      blob(p, 14, 15, 3 * s, 3 * s, ramp, 0, 3);
      p.rect(6, 14, 8, 3, ramp[2]);
    } else if (kind % 3 === 1) blob(p, 10, 15, 4.5 * s, 4.5 * s, ramp, 0, 3);
    else {
      p.ring(10, 15, 4 * s, ramp[2]).ring(10, 15, 3 * s, ramp[3]);
    }
    if (squeaked) p.rect(15, 2, 2, 6, c('paint', 3)).rect(15, 10, 2, 2, c('paint', 3));
    return p;
  };
  TOYS.forEach((_, i) => {
    // (squeaked once, it stays squashed and quiet: a block's timer can't be one cell's alone)
    book.add(`toy${i}`, toy(i, false), { ...AIR, hp: -3, touch: `toy${i}.sq` });
    book.add(`toy${i}.sq`, toy(i, true), AIR);
  });
  // a corner of the moving blanket, flipped up; tucked back in, it's gone (Gwinn settles)
  const corner = wall();
  corner.rect(2, 12, 16, 8, c('accent', 1));
  for (let x = 3; x < 18; x += 3) corner.rect(x, 13, 1, 6, c('accent', 2));
  corner.line(12, 12, 18, 6, c('accent', 2)).line(13, 12, 18, 7, c('accent', 2));
  book.add('tuck', corner, { ...AIR, hp: 3, score: 25, touch: 'wall' });
  // Gwinn's bed: the blanket, and Gwinn asleep on it (her picture across the bed's middle)
  const blanket = wall();
  blanket.rect(0, 12, 20, 8, c('accent', 1));
  for (let x = 1; x < 20; x += 3) blanket.rect(x, 13, 1, 7, c('accent', 2));
  book.add('blanket', blanket, AIR);
  // Gwinn asleep across three blocks of the blanket and two rows, drawn at full size: the
  // trilogy's brown rescue (floppy ears, white chest, pink collar and its yellow tag, a thin
  // tail), lying on her side with her chin on her paws; stirred, her head comes up, one eye open
  const gwinn = (stir: boolean) => {
    const big = new Pixels(GWINN_W * 20, 40, 0);
    for (let x = 0; x < GWINN_W; x++) big.blit(wall(), x * 20, 0).blit(k.pic('blanket'), x * 20, 20);
    big.blit(sleepingGwinn(pal, stir), 0, 0, 255);
    return big;
  };
  // on the wall over her bed, her certificate from the dog show: FIRST PLACE, for SITTING (a
  // whole three seconds), with its blue ribbon; two blocks by two
  const cert = new Pixels(40, 40, 0);
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) cert.blit(wall(), x * 20, y * 20);
  cert.rect(2, 4, 36, 30, c('wood', 2)).rect(4, 6, 32, 26, c('paint', 3)).frame(5, 7, 30, 24, c('lamp', 3));
  text(cert, 8, 9, '1ST', c('ink', 0));
  text(cert, 8, 19, 'SIT', c('ink', 0));
  // the blue rosette and its two tails
  cert.line(32, 31, 30, 38, c('blue', 1)).line(33, 31, 31, 38, c('blue', 1)).line(34, 31, 36, 38, c('blue', 1)).line(35, 31, 37, 38, c('blue', 1));
  cert.disc(34, 28, 4.5, c('blue', 2)).disc(34, 28, 2.5, c('blue', 3)).disc(34, 28, 1.2, c('yellow', 3));
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) book.add(`cert${x}.${y}`, cert.crop(x * 20, y * 20, 20, 20), AIR);
  // touching Gwinn herself wakes her a lot (each block of her stirs on its own touch; only her body
  // wakes her, not the air round her ears in the row above)
  const [sleeping, stirred] = [gwinn(false), gwinn(true)];
  for (let y = 0; y < 2; y++)
    for (let x = 0; x < GWINN_W; x++) {
      book.add(`gwinn${x}.${y}`, sleeping.crop(x * 20, y * 20, 20, 20), { ...AIR, ...(y ? { hp: -8 } : {}), touch: `gwinn${x}.${y}.stir` });
      book.add(`gwinn${x}.${y}.stir`, stirred.crop(x * 20, y * 20, 20, 20), AIR);
    }
  // her Zzz, twice size, drifting up and to the right across two blocks
  const zb = bounds(ZZZ);
  // (in moonlight white, so they read on the night wall)
  const zzz = ZZZ.crop(zb.x, zb.y, zb.w, zb.h);
  for (let y = 0; y < zzz.h; y++) for (let x = 0; x < zzz.w; x++) if (zzz.get(x, y) !== 255) zzz.set(x, y, c('lamp', 4));
  for (let f = 0; f < 4; f++) {
    const big = new Pixels(40, 20, 0);
    big.blit(wall(), 0, 0).blit(wall(), 20, 0);
    scaleBlit(big, zzz, 4 + f * 3, 6 - f * 2, 2, false, 255);
    book.add(`zzz${f}`, big.crop(0, 0, 20, 20), { ...AIR, ntime: 9, next: `zzz${(f + 1) % 4}` });
    book.add(`zzz${f}.r`, big.crop(20, 0, 20, 20), { ...AIR, ntime: 9, next: `zzz${(f + 1) % 4}.r` });
  }
  // the tapes: a stack of 8-tracks on the crate; fetched, the crate's top is bare
  const tapes = wall();
  for (let i = 0; i < 3; i++) {
    const y = 14 - i * 5;
    tapes.rect(3, y, 14, 5, c('ink', 1)).rect(4, y + 1, 9, 3, [c('lamp', 3), c('accent', 3), c('pipe', 3)][i]);
  }
  book.add('tapes', tapes, { ...AIR, effect: CTR.tapes, eamt: 1, score: 200, touch: 'wall' });
  // one moonbeam from the window down to the floor: the pegboard lit in a dithered shaft that
  // widens and fades as it falls (a block for each cell it crosses)
  const lit = BEAM.blocks();
  const shaft = new Pixels(BEAM.w * 20, BEAM.h * 20);
  for (let by = 0; by < BEAM.h; by++) for (let bx = 0; bx < BEAM.w; bx++) shaft.blit(wall(), bx * 20, by * 20);
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  shaft.map((x, y, col) => {
    const t = y / (BEAM.h * 20);
    const dx = Math.abs(x - (10 + t * BEAM.drift));
    const half = 7 + t * 6;
    if (dx >= half) return col;
    const density = (0.6 - 0.4 * t) * (dx > half - 3 ? 0.45 : 1);
    return bayer[(y % 4) * 4 + (x % 4)] / 16 < density ? c('wall', 5) : col;
  });
  for (const [bx, by] of lit) book.add(`beam${bx}.${by}`, shaft.crop(bx * 20, by * 20, 20, 20), AIR);
  countedDoor(k, 'door', 'wall', CTR.tapes, 1, (p: Pixels) => {
    p.rect(6, 9, 8, 6, c('ink', 1)).rect(7, 10, 5, 3, c('lamp', 3));
  });
  // the felt egg, in the last slot
  while (book.index.size < EGG_BLOCK) book.add(`spare${book.index.size}`, new Pixels(20, 20, 0));
  book.add('egg', rubberEgg(wall()), { ...AIR, obj: 1, score: 500, touch: 'wall' });
  return k;
}

export function muffled(book: Kit['book']): Level {
  const M = MUFFLED;
  const { w, floor } = M;
  const m = new MapBuilder(book, { '.': 'wall', '=': 'floor', b: 'bench', s: 'shelf', B: 'blanket', c: 'chest', t: 'tire' }, 'slab');
  m.fill(0, 0, w, floor, '.').fill(0, floor, w, 1, '=');
  // the pegboard's variants, here and there, then the window and its moonbeam over them
  for (let y = 0; y < floor; y++)
    for (let x = 0; x < w - 1; x++) {
      // a panel's join runs the wall's height; a hook here and there
      if (x % 9 === 4) m.set(x, y, 'wall.seam');
      else if ((x * 7 + y * 13) % 19 === 11 && y > 1) m.set(x, y, 'wall.hook');
    }
  m.set(6, 2, 'window');
  for (const [bx, by] of BEAM.blocks()) m.set(BEAM.x + bx, BEAM.y + by, `beam${bx}.${by}`);
  m.fill(M.bench[0], floor - 2, M.bench[1] - M.bench[0] + 1, 1, 'b').fill(M.bench[0], floor - 1, M.bench[1] - M.bench[0] + 1, 1, 'bench.legs');
  m.fill(M.shelf[0], 5, M.shelf[1] - M.shelf[0] + 1, 1, 's');
  // her bed under the shelf, and her Zzz
  m.fill(M.bed[0] - 1, floor - 1, M.bed[1] - M.bed[0] + 3, 1, 'B');
  for (let y = 0; y < 2; y++) for (let x = 0; x < GWINN_W; x++) m.set(M.bed[0] + x, floor - 2 + y, `gwinn${x}.${y}`);
  m.set(22, 6, 'zzz0').set(23, 6, 'zzz0.r');
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) m.set(21 + x, 2 + y, `cert${x}.${y}`);
  // the high shelf past her bed, where the egg rolled
  m.fill(M.egg[0], M.egg[1] + 1, 2, 1, 's').set(...M.egg, 'egg');
  TOYS.forEach((x, i) => m.set(x, floor - 1, `toy${i}`));
  for (const x of TUCKS) m.set(x, floor - 1, 'tuck');
  m.set(M.crate, floor - 1, 'c').set(M.crate, floor - 2, 'tapes');
  m.set(M.door, floor - 2, 'door.top').set(M.door, floor - 1, 'door');
  m.fill(w - 1, 0, 1, floor, 'slab');
  m.link(M.exit, floor - 1);
  m.mon(MON.reggie, 3, floor - 1);
  decorate(m, [
    ['light', 12, 0],
    ['light', 26, 0],
    ['light', 38, 0],
    ['board', 2, 4],
    ['board', 14, 3],
    ['board', 30, 3],
    ['board', 38, 4],
    ['charger', 1, 6],
  ]);
  // variants here and there so the walls and floors don't repeat
  m.vary('floor', ['floor.drip'], 9).vary('slab', ['slab.crack'], 9);
  return { m, start: at(8, 5), size: [w, 10] };
}
