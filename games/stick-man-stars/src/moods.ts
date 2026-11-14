// A level's sky: the shared palette with its sky and grass ramps swapped, and the ground and the brick walls
// dimmed and cooled to match (the block pictures are the same indexes, so the street is the same street at
// dusk, at night and at sunrise). Gold, white and the houses keep their colors, so a star still shines.
import type { Pal } from '../../kit/starter/palette';
import { hidePaper } from './paper';

export type Mood = 'day' | 'dusk' | 'night' | 'dawn';
type RGB = [number, number, number];

/** [sky dark, sky light, sky middle, grass scale, ground scale]. */
const SKIES: Record<Exclude<Mood, 'day'>, [RGB, RGB, RGB, number, number]> = {
  dusk: [[36, 28, 96], [255, 170, 110], [130, 56, 140], 0.75, 0.78],
  night: [[6, 8, 36], [70, 80, 150], [24, 30, 84], 0.45, 0.5],
  dawn: [[130, 150, 235], [255, 226, 236], [250, 170, 190], 0.95, 0.94],
};

/** White notebook paper (paper.ts): the sheet itself, then its blue ruled line, a pale blue crayon stroke and a sheet's shadow. */
const NOTEBOOK: RGB = [250, 250, 244];
const NOTEBOOK_PAPER: RGB[] = [
  [140, 182, 236],
  [226, 232, 250],
  [178, 180, 190],
];
/** The brick drawn in pencil on the sheet: its mortar a pencil line, its faces barely colored in (darkest shade first). */
const PENCIL_BRICK: RGB[] = [
  [96, 96, 108],
  [150, 150, 160],
  [236, 200, 196],
  [244, 214, 208],
  [248, 228, 222],
  [250, 238, 232],
];

/** The palette for `mood` (day is the shared one itself). `paper`: the level is drawn on ruled paper (paper.ts); otherwise the paper ramp is the sky's color. */
export function paletteFor(pal: Pal, mood: Mood, paper = false): Pal {
  if (mood === 'day') return pal;
  const [dark, light, mid, grass, ground] = SKIES[mood];
  const out = new Uint8Array(pal.pal);
  const set = (i: number, [r, g, b]: RGB) => out.set([r >> 2, g >> 2, b >> 2], i * 3);
  const sky = pal.r('sky');
  sky.forEach((idx, k) => {
    const t = k / (sky.length - 1);
    const [a, b, u] = t < 0.5 ? [dark, mid, t * 2] : [mid, light, (t - 0.5) * 2];
    set(idx, a.map((v, j) => Math.round(v + (b[j] - v) * u)) as RGB);
  });
  if (paper) {
    // the night is drawn on white notebook paper: the sky is the sheet, the brick a pencil drawing, and the
    // bushes keep their crayon green (nothing on the sheet is dimmed for the night)
    for (const idx of sky) set(idx, NOTEBOOK);
    pal.r('paper').forEach((idx, k) => set(idx, NOTEBOOK_PAPER[k]));
    pal.r('brick').forEach((idx, k) => set(idx, PENCIL_BRICK[k]));
  } else {
    dimGround(pal, out, grass, ground);
    hidePaper(out, pal.c('sky', 3), pal.r('paper'));
  }
  return { ...pal, pal: out };
}

/** The grass, dirt and brick at night: darker, and a little bluer the darker it gets (moonlight). */
function dimGround(pal: Pal, out: Uint8Array, grass: number, ground: number): void {
  for (const idx of pal.r('grass')) {
    const o = idx * 3;
    out.set([out[o] * grass, out[o + 1] * grass, out[o + 2] * grass].map(Math.round), o);
  }
  // the dirt and the bricks: darker, and a little bluer the darker it gets (moonlight)
  const blue = Math.min(1, ground + (1 - ground) * 0.45);
  for (const idx of [...pal.r('dirt'), ...pal.r('brick')]) {
    const o = idx * 3;
    out.set([out[o] * ground, out[o + 1] * ground, out[o + 2] * blue].map(Math.round), o);
  }
}
