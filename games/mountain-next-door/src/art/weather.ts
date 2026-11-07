// Water and weather as 20x20 blocks: the stream, its wobbly stepping stones, rain, fog and the ridge's wind.
// Nothing here is real weather: rain and wind are pictures that change on a clock (a block's "next block"
// and "ticks"), and fog is a picture laid over the sky that thins away.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../../kit/starter/palette';
import { clear, inked } from './land';

/** Stream water: `top` has the surface with a ripple (frame 0 or 1), below it is all water. */
export function water(pal: Pal, top: boolean, frame: number): Pixels {
  const p = clear(pal);
  const w = pal.r('water');
  p.rect(0, top ? 6 : 0, 20, top ? 14 : 20, w[2]);
  if (top) {
    p.rect(0, 6, 20, 2, w[3]);
    for (let x = frame * 5; x < 20; x += 10) p.rect(x, 5, 5, 1, w[4]);
  } else for (let x = (frame * 7) % 20; x < 20; x += 9) p.rect(x, 8 + (x % 3) * 3, 4, 1, w[1]);
  return p;
}

/** A stepping stone: up (stand on it), half under, or under (only ripples show). */
export function stone(pal: Pal, how: 'up' | 'half' | 'under'): Pixels {
  const p = water(pal, true, how === 'up' ? 0 : 1);
  const s = pal.r('stone');
  const w = pal.r('water');
  if (how === 'up') {
    p.disc(10, 7, 8, s[1]).rect(2, 7, 17, 6, s[1]).disc(10, 5, 7, s[2]).rect(5, 1, 10, 2, s[3]);
    p.rect(1, 12, 18, 2, w[4]);
  } else if (how === 'half') {
    p.rect(3, 6, 14, 4, s[1]).rect(5, 5, 10, 2, s[2]);
    p.rect(1, 9, 18, 1, w[4]);
  } else p.ring(10, 7, 6, w[4]).rect(4, 7, 12, 1, w[3]);
  return p;
}

/** The muddy bank and the bed under the stream. */
export function bed(pal: Pal): Pixels {
  const p = clear(pal);
  const w = pal.r('water');
  const s = pal.r('stone');
  p.rect(0, 0, 20, 20, w[1]);
  const rand = rng(9);
  for (let k = 0; k < 9; k++) p.disc(Math.floor(rand() * 20), 12 + Math.floor(rand() * 8), 2, s[1]);
  return p;
}

/** Rain: thin slanted streaks, four frames of one loop (start on a different frame to scatter it). */
export function rain(pal: Pal, frame: number): Pixels {
  const p = clear(pal);
  const c = pal.c('water', 4);
  const c2 = pal.c('white', 2);
  for (const [x0, y0] of [
    [3, 0],
    [13, 7],
    [8, 13],
  ]) {
    const y = (y0 + frame * 5) % 20;
    for (let k = 0; k < 4; k++) p.set((x0 - Math.floor((y + k) / 4) + 20) % 20, (y + k) % 20, k < 2 ? c2 : c);
  }
  return p;
}

/** Fog over the sky: `thick` 3 (white), 2, 1 (thin wisps), drawn in dots so the sky shows through as it thins. */
export function fog(pal: Pal, thick: 1 | 2 | 3, seed: number): Pixels {
  const p = clear(pal);
  const f = pal.r('fog');
  const rand = rng(seed);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const band = Math.sin((x + seed * 3) * 0.35 + y * 0.5) * 0.5 + 0.5;
      const keep = thick === 3 ? 1 : thick === 2 ? (x + y) % 2 === 0 || band > 0.6 : band > 0.75 && (x + y) % 2 === 0;
      if (keep) p.set(x, y, f[Math.min(f.length - 1, 1 + Math.floor(band * 3) + (rand() < 0.1 ? 1 : 0))]);
    }
  return p;
}

/** Fog over something else: the picture `under` seen through fog of `thick`. */
export function fogOver(pal: Pal, under: Pixels, thick: 1 | 2 | 3, seed: number): Pixels {
  const f = fog(pal, thick, seed);
  const sky = skyOf(pal);
  const p = new Pixels(20, 20, sky);
  p.px.set(under.px);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (f.get(x, y) !== sky) p.set(x, y, f.get(x, y));
  return p;
}

/** Wind: curling streaks blowing `dir`, in three frames. */
export function gust(pal: Pal, dir: 1 | -1, frame: number): Pixels {
  const p = clear(pal);
  const c = pal.c('white', 3);
  const c2 = pal.c('fog', 2);
  for (const y of [4, 11, 17]) {
    const x0 = (((y * 3 + frame * 7) % 20) + 20) % 20;
    for (let k = 0; k < 8; k++) p.set(dir > 0 ? (x0 + k) % 20 : (39 - x0 - k) % 20, y + (k === 7 ? -1 : 0), k > 5 ? c : c2);
  }
  return p;
}

/** A plank footbridge over the stream. */
export function footbridge(pal: Pal): Pixels {
  const p = clear(pal);
  const w = pal.r('wood');
  p.rect(0, 0, 20, 6, w[2]).rect(0, 0, 20, 1, w[4]).rect(0, 5, 20, 1, w[0]);
  for (const x of [0, 10]) p.rect(x + 1, 6, 2, 14, w[1]);
  return inked(pal, p);
}
