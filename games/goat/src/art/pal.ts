// The colors: one set of named ramps shared by every block and sprite, and a palette per
// place. The block art never changes between levels; the .PAL does, so the same stones are
// blue under the stars in the field, lamp-lit in town, silver at the caravan and gold in
// the stable. Lamps, the star and the manger's glow keep their own light everywhere.
import { PaletteBuilder } from '../../../kit/palette';

type RGB = [number, number, number];
export type Light = 'field' | 'town' | 'camp' | 'stable' | 'day';

/** [name, shades, dark, light, mid?, glows?] */
const RAMPS: [string, number, RGB, RGB, RGB?, boolean?][] = [
  ['ink', 2, [16, 10, 20], [44, 34, 52]],
  ['grass', 5, [22, 44, 20], [150, 176, 92]],
  ['dirt', 5, [62, 42, 26], [196, 160, 112]],
  ['sand', 5, [120, 92, 54], [248, 226, 170]],
  ['stone', 5, [58, 54, 52], [208, 200, 182]],
  ['brick', 5, [92, 52, 30], [232, 184, 124]],
  ['wood', 5, [44, 26, 14], [176, 124, 74]],
  ['hay', 5, [120, 84, 20], [252, 226, 120]],
  ['goat', 6, [52, 50, 56], [252, 250, 246], [170, 164, 160]],
  ['horn', 3, [96, 72, 44], [222, 200, 156]],
  ['wool', 4, [176, 166, 140], [255, 252, 236]],
  ['camel', 4, [104, 66, 30], [226, 176, 112]],
  ['donkey', 4, [56, 50, 50], [176, 166, 158]],
  ['ox', 4, [58, 30, 16], [176, 112, 64]],
  ['blue', 4, [20, 30, 84], [96, 136, 220]],
  ['red', 4, [84, 14, 18], [226, 74, 60]],
  ['purple', 4, [52, 20, 70], [176, 104, 210]],
  ['skin', 3, [128, 76, 48], [238, 186, 140]],
  ['olive', 4, [24, 46, 30], [124, 150, 96]],
  ['thorn', 3, [40, 30, 22], [118, 96, 62]],
  ['water', 4, [20, 46, 92], [128, 184, 226]],
  ['cloth', 4, [150, 140, 120], [252, 248, 236]],
  ['pink', 3, [150, 70, 80], [252, 176, 176]],
  ['gold', 4, [150, 96, 10], [255, 238, 120], undefined, true],
  ['glow', 4, [176, 104, 30], [255, 250, 210], undefined, true],
  ['star', 3, [200, 190, 120], [255, 255, 255], undefined, true],
  ['grey', 6, [0, 0, 0], [255, 255, 255]],
];

/**
 * Each place's light: every ramp times `mul` plus `add`, then `scale` on a few ramps, so the
 * floor sits a step away from the animals on it: the moonlit meadow a little darker under a
 * brighter moon, the town's cobbles darker than the crowd, the caravan's sand paler than the
 * camels and the goat.
 */
const LIGHT: Record<Light, { mul: RGB; add: RGB; scale?: Record<string, number> }> = {
  field: { mul: [0.66, 0.74, 1], add: [10, 14, 38], scale: { grass: 0.78 } },
  town: { mul: [0.82, 0.7, 0.66], add: [20, 8, 10], scale: { stone: 0.78 } },
  camp: { mul: [0.68, 0.7, 0.9], add: [12, 12, 30], scale: { sand: 1.14 } },
  stable: { mul: [1, 0.86, 0.66], add: [18, 10, 0], scale: { dirt: 0.82 } },
  day: { mul: [1, 1, 1], add: [0, 0, 0] },
};

export interface Pal {
  pal: Uint8Array;
  r: (name: string) => number[];
  /** Shade k of a ramp, clamped. */
  c: (name: string, k: number) => number;
}

function wrap(b: PaletteBuilder): Pal {
  const r = (name: string) => b.get(name);
  return {
    pal: b.pal,
    r,
    c: (name, k) => {
      const ramp = r(name);
      return ramp[Math.max(0, Math.min(ramp.length - 1, k))];
    },
  };
}

/** The level palettes: every ramp in the same place, lit for the place. */
export function buildPalette(light: Light): Pal {
  const b = new PaletteBuilder();
  b.designerColors();
  const t = LIGHT[light];
  for (const [name, n, from, to, mid, glows] of RAMPS) {
    const k = t.scale?.[name] ?? 1;
    const f = (c: RGB): RGB => (glows ? c : (c.map((v, i) => Math.min(255, Math.round((v * t.mul[i] + t.add[i]) * k))) as RGB));
    b.ramp(name, n, f(from), f(to), mid ? f(mid) : undefined);
  }
  // The Bard of Bizarre is a white chicken with an orange beak. His feathers take the place's
  // light without its color (the same brightness on every channel), so the stable's gold
  // doesn't turn him straw yellow; his beak and feet take the light as everything else does.
  // These come after every shared ramp, so no other color moves.
  const grey = (c: RGB): RGB =>
    c.map((v) => Math.min(255, Math.round((v * (t.mul[0] + t.mul[1] + t.mul[2])) / 3 + (t.add[0] + t.add[1] + t.add[2]) / 3))) as RGB;
  b.ramp('feather', 4, grey([150, 146, 140]), grey([252, 252, 248]));
  const lit = (c: RGB): RGB => c.map((v, i) => Math.min(255, Math.round(v * t.mul[i] + t.add[i]))) as RGB;
  b.ramp('beak', 3, lit([176, 72, 10]), lit([250, 156, 40]));
  return wrap(b);
}

/** The same ramps (by day) plus skies, parchment and inks for the 320x200 screens. */
export function buildScreenPalette(): Pal & { b: PaletteBuilder } {
  const b = new PaletteBuilder();
  b.designerColors();
  for (const [name, n, from, to, mid] of RAMPS) b.ramp(name, n, from, to, mid);
  b.ramp('night', 10, [6, 6, 22], [60, 52, 120], [24, 22, 66]);
  b.ramp('dusk', 12, [30, 22, 70], [252, 196, 120], [176, 92, 110]);
  b.ramp('parch', 5, [150, 118, 76], [250, 236, 200]);
  b.ramp('brown', 3, [40, 22, 10], [110, 66, 30]);
  // Display_File writes in the color nearest (50,10,50)*4 and "MORE..." nearest (63,10,10)*4.
  b.ramp('plum', 2, [120, 20, 110], [200, 40, 200]);
  b.ramp('menublue', 2, [20, 20, 140], [40, 40, 252]);
  b.ramp('hot', 1, [252, 40, 40], [252, 40, 40]);
  return { ...wrap(b), b };
}
