// A level's sky: the shared palette with its sky and grass ramps swapped (the block pictures are the same
// indexes, so the street is the same street at dusk, at night and at sunrise).
import type { Pal } from '../../kit/starter/palette';

export type Mood = 'day' | 'dusk' | 'night' | 'dawn';
type RGB = [number, number, number];

/** [sky dark, sky light, sky middle, grass scale]. */
const SKIES: Record<Exclude<Mood, 'day'>, [RGB, RGB, RGB, number]> = {
  dusk: [[36, 28, 96], [255, 170, 110], [130, 56, 140], 0.75],
  night: [[6, 8, 36], [70, 80, 150], [24, 30, 84], 0.45],
  dawn: [[130, 150, 235], [255, 226, 236], [250, 170, 190], 0.95],
};

/** The palette for `mood` (day is the shared one itself). */
export function paletteFor(pal: Pal, mood: Mood): Pal {
  if (mood === 'day') return pal;
  const [dark, light, mid, grass] = SKIES[mood];
  const out = new Uint8Array(pal.pal);
  const set = (i: number, [r, g, b]: RGB) => out.set([r >> 2, g >> 2, b >> 2], i * 3);
  const sky = pal.r('sky');
  sky.forEach((idx, k) => {
    const t = k / (sky.length - 1);
    const [a, b, u] = t < 0.5 ? [dark, mid, t * 2] : [mid, light, (t - 0.5) * 2];
    set(idx, a.map((v, j) => Math.round(v + (b[j] - v) * u)) as RGB);
  });
  for (const idx of pal.r('grass')) {
    const o = idx * 3;
    out.set([out[o] * grass, out[o + 1] * grass, out[o + 2] * grass].map(Math.round), o);
  }
  return { ...pal, pal: out };
}
