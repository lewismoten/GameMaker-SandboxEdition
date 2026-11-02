// The dream's end, a scene played on the map (nobody steers it): Sir Reginald Cluckington III
// floats down the clogged oil pipe, a close-up of the limp rubber chicken bobbing on the oil (he
// is rubber; he floats). The pipe streams past him in layers at different speeds, so the scene
// moves though the screen never scrolls: the dream's clouds crawl, the haze and its drifting
// notes drift, the pipe's straps go by fast, and the oil's ripples and bubbles rush under him.
// Each layer is a ring of blocks that shifts its picture left a few pixels a frame (a layer that
// repeats every two blocks is two rings, a cell's own by its column). The hero is nobody
// (heroes.ts: a clear block, no keys), held where he starts by a block of the chicken's that pulls
// nowhere: that one block's bobbing is spelled out frame by frame for the swim's length (the
// rest loop), and then it goes on as the others do, pulling down, so he drops through the oil into
// the link and Doc Leo's card wakes the bird up.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { chicken } from '../art/chicken';
import { AIR, GRAV, kit, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import type { Pal } from '../art/palette';
import { MapBuilder, at, type Level } from './maps';

/** The rows (clouds, haze, the pipe's top wall, the air in it, the oil's top and depth, its bottom wall), and ticks before the drop. */
export const SWIM = { cloud: [0, 9], haze: [1, 8], top: 2, air: [3, 4], surface: 5, oil: 6, bottom: 7, hold: 200, w: 16 } as const;
/** Where nobody waits (the screen's middle, under the chicken's beak) and drops out. */
const HELD = 8;
/** The chicken's close-up: 4x3 blocks, top left. */
const BIRD = { x: 5, y: 3, w: 4, h: 3 } as const;
/** The chicken's bob: pixels down, frame by frame, and the ticks a frame (the swim is whole bobs). */
const BOB = [1, 2, 3, 2];
const BOB_TICKS = 10;

export function swimBlocks(pal: Pal): Kit {
  const k = kit(pal);
  baseSet(k, 'engine');
  const { book, c, R } = k;
  /** The dream's glow, a gradient down `w` pixels wide from shade `a` to `b` of the lamp. */
  const glow = (w: number, a: number, b: number) => gradient(new Pixels(w, 20, 0), 0, 0, w, 20, R('lamp'), a, b);
  /**
   * A layer streaming left: `tile` (whole blocks wide, repeating) shifted `shift` pixels a frame,
   * a frame every `ntime` ticks; a ring per column of the tile, named `${name}${column}.${frame}`.
   */
  const stream = (name: string, tile: Pixels, shift: number, ntime: number) => {
    const n = tile.w / 20;
    const frames = tile.w / shift;
    const wide = new Pixels(tile.w * 2, 20).blit(tile, 0, 0).blit(tile, tile.w, 0);
    for (let j = 0; j < n; j++)
      for (let f = 0; f < frames; f++)
        book.add(`${name}${j}.${f}`, wide.crop((j * 20 + f * shift) % tile.w, 0, 20, 20), { ...AIR, ntime, next: `${name}${j}.${(f + 1) % frames}` });
  };
  // far: the dream's clouds, soft scallops at the top and bottom of the screen, crawling
  const cloud = (top: boolean) => {
    const p = top ? glow(20, 2, 1) : glow(20, 1, 2);
    for (let x = 0; x < 20; x += 10) p.disc(x + 5, top ? 3 : 17, 7, c('lamp', 4)).disc(x + 5, top ? 3 : 17, 5, c('paint', 3));
    return p;
  };
  stream('cloud.top', cloud(true), 4, 12);
  stream('cloud.bottom', cloud(false), 4, 12);
  // middle: the haze, a thinner row of scallops; over the pipe, dreamy notes drifting in it
  const haze = (top: boolean, w: number) => {
    const p = top ? glow(w, 1, 0) : glow(w, 0, 1);
    for (let x = 0; x < w; x += 10)
      p.disc(x + 5, top ? 1 : 19, 8, c('lamp', 1))
        .disc(x + 5, top ? 0 : 20, 6, c('lamp', 2))
        .disc(x + 5, top ? -1 : 21, 4, c('lamp', 3));
    return p;
  };
  const notes = haze(true, 40);
  // an eighth note and a star, faint in the glow
  notes.disc(9, 14, 2.4, c('lamp', 4)).rect(11, 6, 1, 8, c('lamp', 4)).rect(12, 7, 2, 1, c('lamp', 4)).rect(13, 8, 1, 2, c('lamp', 4));
  notes.set(31, 12, c('paint', 3)).set(30, 12, c('lamp', 4)).set(32, 12, c('lamp', 4)).set(31, 11, c('lamp', 4)).set(31, 13, c('lamp', 4));
  stream('haze.top', notes, 5, 5);
  stream('haze.bottom', haze(false, 20), 4, 4);
  // near: the pipe's top wall, glass with a strap holding it up every other block, going by fast
  const wall = (w: number) => {
    const p = glow(w, 0, 0);
    p.rect(0, 14, w, 6, c('pipe', 1)).rect(0, 14, w, 1, c('pipe', 4)).rect(0, 19, w, 1, c('mach', 6));
    return p;
  };
  const strap = wall(40);
  strap.rect(8, 0, 4, 14, c('mach', 2)).rect(8, 0, 1, 14, c('mach', 4)).rect(6, 12, 8, 2, c('mach', 3));
  stream('strap', strap, 5, 2);
  // the bottom wall is plain all along, so it needs no stream
  book.add('bottom', glow(20, 0, 0).rect(0, 0, 20, 6, c('pipe', 1)).rect(0, 5, 20, 1, c('pipe', 4)).rect(0, 0, 20, 1, c('mach', 6)), AIR);
  // the air in the pipe over the oil: dim, still (the chicken's blocks sit in it), and a Zzz rising
  const air = () => gradient(new Pixels(20, 20, 0), 0, 0, 20, 20, R('pipe'), 1, 0);
  book.add('air', air(), AIR);
  for (let f = 0; f < 4; f++) {
    const p = air();
    const y = 11 - f * 3;
    const x = 4 + f * 2;
    p.rect(x, y, 8, 2, c('paint', 3)).rect(x, y + 6, 8, 2, c('paint', 3));
    for (let i = 0; i < 4; i++) p.rect(x + 6 - i * 2, y + 2 + i, 2, 1, c('paint', 3));
    book.add(`z${f}`, p, { ...AIR, ntime: 8, next: `z${(f + 1) % 4}` });
  }
  // the oil: its rippling top over the air, and its depth with bubbles rushing by
  const SURF = 8;
  const surface = () => {
    const p = air();
    p.rect(0, SURF, 20, 16, c('pipe', 2));
    for (let x = 0; x < 20; x++) p.set(x, SURF + Math.round(Math.sin((x * Math.PI) / 5)), c('pipe', 3)).set(x, SURF + 6, c('pipe', 3));
    return p;
  };
  const rip = surface();
  for (let x = 0; x < 20; x += 5) rip.rect(x + 1, SURF + 3, 2, 1, c('pipe', 4));
  stream('surface', rip, 4, 3);
  const depth = new Pixels(20, 20, c('pipe', 2)).rect(0, 12, 20, 1, c('pipe', 1));
  depth.ring(6, 12, 1.6, c('paint', 3)).ring(15, 5, 1.2, c('paint', 3)).set(11, 16, c('paint', 3)).set(2, 4, c('paint', 3));
  stream('depth', depth, 4, 2);
  // the close-up: Sir Reginald, limp on his belly, legs trailing, bobbing on the oil (his belly
  // under it), with a ring of froth where he meets it
  const W = BIRD.w * 20;
  const H = BIRD.h * 20;
  const line = H - 20 + SURF + 2;
  const frames = BOB.map((dy, f) => {
    const p = new Pixels(W, H);
    for (let x = 0; x < BIRD.w; x++) for (let y = 0; y < BIRD.h; y++) p.blit(y === BIRD.h - 1 ? surface() : air(), x * 20, y * 20);
    const bird = chicken(4, { bob: f >> 1 });
    const top = dy - 21;
    p.blit(bird, 0, top, 255);
    for (let y = line; y < H; y++)
      for (let x = 0; x < W; x++) {
        const px = bird.get(x, y - top);
        if (px >= 0 && px !== 255) p.set(x, y, c('pipe', y === line ? 4 : 2));
      }
    for (let x = 2; x < W - 2; x += 3) p.set(x + (f % 2), line - 1, c('paint', 3));
    return p;
  });
  const cell = (f: number, q: number) => frames[f].crop((q % BIRD.w) * 20, Math.floor(q / BIRD.w) * 20, 20, 20);
  for (let q = 0; q < BIRD.w * BIRD.h; q++)
    BOB.forEach((_, f) => book.add(`bird${q}.${f}`, cell(f, q), { ...AIR, ntime: BOB_TICKS, next: `bird${q}.${(f + 1) % BOB.length}` }));
  // the block nobody waits in: the same bobbing, pulling nowhere, for the whole swim; then its ring
  const heldQ = (5 - BIRD.y) * BIRD.w + (HELD - BIRD.x);
  const spelled = SWIM.hold / BOB_TICKS;
  for (let i = 0; i < spelled; i++)
    book.add(`held${i}`, cell(i % BOB.length, heldQ), { grav: GRAV.none, ntime: BOB_TICKS, next: i + 1 < spelled ? `held${i + 1}` : `bird${heldQ}.0` });
  return k;
}

export function swim(book: Kit['book']): Level {
  const { w } = SWIM;
  const m = new MapBuilder(book, { '.': 'air' }, 'casting');
  m.fill(0, 0, w, 10, '.');
  // every streaming layer: each cell starts its column's ring at its first frame
  const row = (y: number, name: string, n = 1) => {
    for (let x = 0; x < w; x++) m.set(x, y, `${name}${x % n}.0`);
  };
  row(SWIM.cloud[0], 'cloud.top');
  row(SWIM.cloud[1], 'cloud.bottom');
  row(SWIM.haze[0], 'haze.top', 2);
  row(SWIM.haze[1], 'haze.bottom');
  row(SWIM.top, 'strap', 2);
  row(SWIM.surface, 'surface');
  row(SWIM.oil, 'depth');
  m.fill(0, SWIM.bottom, w, 1, 'bottom');
  m.set(2, SWIM.air[0], 'z0').set(12, SWIM.air[1], 'z2');
  for (let q = 0; q < BIRD.w * BIRD.h; q++) m.set(BIRD.x + (q % BIRD.w), BIRD.y + Math.floor(q / BIRD.w), `bird${q}.0`);
  // nobody starts in the screen's middle, held by the chicken's block there till the swim is over
  m.set(HELD, 5, 'held0');
  m.link(HELD, 8).link(HELD, 9);
  return { m, start: at(HELD, 5), size: [w, 10] };
}
