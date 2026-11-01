// Level 9, Muffled (the garage at night, moonlight through the window; Teddy). Gwinn took the
// 8-track tapes to bed, and she's asleep on the moving blanket. Teddy sneaks in to fetch them.
// Squeaky toys lie about: a touch squeaks one (once) and wakes Gwinn a little (the Zzz meter is his
// energy), so he hops them. A blanket corner he tucks back in lets her settle (energy back).
// The way over her is the shelf above her bed; touching Gwinn herself wakes her a lot. The
// tapes sit on a crate past her bed; with them, the door at the end opens. Up on the high shelf
// past her bed, where the rubber egg rolled: the felt egg (in the set's last slot, a number no
// other map shows). The sign that tells how to save is in the next level, The Rain Delay.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { blob } from '../../../snowbound/src/art/draw';
import { GWINN } from '../../../teddy2/src/sprites/gwinn';
import { ZZZ } from '../../../teddy2/src/sprites/teddy';
import { rubberEgg } from '../art/egg';
import { AIR, countedDoor, kit, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import type { Pal } from '../art/palette';
import { CTR, MON } from '../ids';
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
function bounds(p: Pixels): { x: number; y: number; w: number; h: number } {
  let [x0, y0, x1, y1] = [p.w, p.h, -1, -1];
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) if (p.get(x, y) !== 255) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
export const TOYS = [11, 14, 27, 33, 35];
/** Blanket corners to tuck back in (level x, on the floor). */
export const TUCKS = [16, 31];

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
  // Gwinn three times life size, curled up across three blocks of the blanket and two rows (her
  // drawing's own pixels, each one a 3x3 square), feet toward Teddy
  const gwinn = (stir: boolean) => {
    const src = GWINN[stir ? 'gwinn1' : 'gwinnRoll'];
    const b = bounds(src);
    const big = new Pixels(GWINN_W * 20, 40, 0);
    for (let x = 0; x < GWINN_W; x++) big.blit(wall(), x * 20, 0).blit(k.pic('blanket'), x * 20, 20);
    const s = 3;
    scaleBlit(big, src.crop(b.x, b.y, b.w, b.h), Math.round((big.w - b.w * s) / 2), 38 - b.h * s, s, false, 255);
    return big;
  };
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
  // a moonbeam through the window lights a stripe of the wall
  const beam = wall();
  for (let y = 0; y < 20; y++) beam.line(y, y, y + 6, y, c('lamp', 1));
  book.add('beam', beam, AIR);
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
  m.set(6, 2, 'window').fill(7, 3, 1, 6, 'beam');
  m.fill(M.bench[0], floor - 2, M.bench[1] - M.bench[0] + 1, 1, 'b').fill(M.bench[0], floor - 1, M.bench[1] - M.bench[0] + 1, 1, 'bench.legs');
  m.fill(M.shelf[0], 5, M.shelf[1] - M.shelf[0] + 1, 1, 's');
  // her bed under the shelf, and her Zzz
  m.fill(M.bed[0] - 1, floor - 1, M.bed[1] - M.bed[0] + 3, 1, 'B');
  for (let y = 0; y < 2; y++) for (let x = 0; x < GWINN_W; x++) m.set(M.bed[0] + x, floor - 2 + y, `gwinn${x}.${y}`);
  m.set(22, 6, 'zzz0').set(23, 6, 'zzz0.r');
  // the high shelf past her bed, where the egg rolled
  m.fill(M.egg[0], M.egg[1] + 1, 2, 1, 's').set(...M.egg, 'egg');
  TOYS.forEach((x, i) => m.set(x, floor - 1, `toy${i}`));
  for (const x of TUCKS) m.set(x, floor - 1, 'tuck');
  m.set(M.crate, floor - 1, 'c').set(M.crate, floor - 2, 'tapes');
  m.set(M.door, floor - 2, 'door.top').set(M.door, floor - 1, 'door');
  m.fill(w - 1, 0, 1, floor, 'slab');
  m.link(M.exit, floor - 1);
  m.mon(MON.regina, 3, floor - 1);
  return { m, start: at(8, 5), size: [w, 10] };
}
