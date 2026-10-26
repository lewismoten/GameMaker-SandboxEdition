// Stage 3's side leg, "The Waveform", seen from the side (its own palette, s3s.pal, the sound
// card's with green phosphor): the song as an oscilloscope draws it. The ceiling and the floor
// are the wave itself, traced in bright phosphor over the dark screen with its dotted
// graticule, and the equalizer's bars glow dim far behind.
import { Pixels } from '../../../kit/pixels';
import { BlockSet, flipY, shadeAt } from '../art/draw';
import type { Pal } from '../art/pal';
import { addTerrain, type SideArt } from './sideTiles';

/** The ramp this leg adds to the sound card's palette. */
export function waveRamps(p: Pal): void {
  p.ramp('scope', 6, [0, 10, 4], [200, 255, 200], [40, 220, 90]);
  p.ramp('dark', 4, [2, 6, 4], [24, 60, 34]);
}

/** The dark screen with its graticule: a dotted line along the block's top and left edges. */
function screen(p: Pal, v: number): Pixels {
  const t = new Pixels(20, 20).map((x, y) => shadeAt(p.r('dark'), 0, 1, 0.3 + ((x * 7 + y * 3) % 13 === 0 ? 0.3 : 0), x, y));
  for (let i = 0; i < 20; i += 4) t.set(i, 0, p.c('dark', 3)).set(0, i, p.c('dark', 3));
  if (v === 1) t.rect(9, 0, 1, 3, p.c('dark', 3)).rect(0, 9, 3, 1, p.c('dark', 3));
  return t;
}

/** Inside the wave: dark phosphor hatching. */
function inside(p: Pal): Pixels {
  return new Pixels(20, 20).map((x, y) => ((x + y) % 5 === 0 ? p.c('scope', 1) : shadeAt(p.r('dark'), 1, 2, 0.5, x, y)));
}

/** The wave's edge: the bright trace, glowing into the dark. */
function trace(p: Pal): Pixels {
  const t = inside(p);
  t.rect(0, 0, 20, 2, p.c('scope', 5)).rect(0, 2, 20, 1, p.c('scope', 4)).rect(0, 3, 20, 1, p.c('scope', 3));
  return t;
}

export function waveArt(p: Pal): SideArt {
  const floor = (v: number) => screen(p, v);
  const face = (side: 'floor' | 'ceil') => (side === 'floor' ? trace(p) : flipY(trace(p)));
  return { pal: p, floor, edge: (_s, v) => floor(v), floors: 2, edges: 1, face };
}

/** The leg's own blocks: the wave and the equalizer far behind. */
export function waveBlocks(bs: BlockSet, a: SideArt): void {
  const p = a.pal;
  addTerrain(bs, a.floor(0), { cIn: inside(p), cBot: flipY(trace(p)), fIn: inside(p), fTop: trace(p) }, p.c('scope', 5));
  // an equalizer bar far behind: dim segments, the top one lit
  for (const h of [2, 3, 4]) {
    const bar = new Pixels(20, h * 20);
    for (let r = 0; r < h; r++) bar.blit(a.floor(0), 0, r * 20);
    for (let y = 2; y < h * 20; y += 5) bar.rect(5, y, 10, 3, y < 7 ? p.c('red', 0) : y < 22 ? p.c('glow', 0) : p.c('dark', 3));
    for (let r = 0; r < h; r++) bs.add(`eq${h}${r}0`, bar.crop(0, r * 20, 20, 20));
  }
}
