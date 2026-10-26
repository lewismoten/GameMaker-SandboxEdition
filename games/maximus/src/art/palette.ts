// Every Maximus palette has two halves. Colors 0..SHARED_END-1 are the same in all of
// them: Game-Maker's UI colors, the courier, the vehicles, weapons, loot, modules and the
// ten shard colors. The rest are "roles" (sky, soil, foliage, creature hide...) that each
// planet colors its own way, so one block set drawn in role shades becomes an ice world,
// a lava world or a jungle just by loading a different .PAL: palette swapping.
import { PaletteBuilder } from '../../../kit/palette';

export type RGB = [number, number, number];

/** The shared ramps, in order. */
const SHARED: [string, number, RGB, RGB, RGB?][] = [
  ['skin', 4, [96, 52, 36], [250, 196, 160]],
  ['suit', 6, [10, 40, 60], [150, 240, 250], [30, 140, 170]],
  ['trim', 5, [90, 30, 0], [255, 220, 120], [240, 120, 20]],
  ['visor', 4, [0, 60, 90], [210, 255, 255], [40, 200, 240]],
  ['metal', 7, [24, 28, 40], [235, 240, 250], [110, 120, 140]],
  ['flame', 6, [120, 0, 0], [255, 255, 210], [255, 150, 0]],
  ['laser', 4, [0, 90, 20], [220, 255, 200], [60, 240, 60]],
  ['plasma', 4, [90, 0, 90], [255, 210, 255], [240, 60, 220]],
  ['nova', 4, [20, 30, 120], [230, 240, 255], [90, 140, 255]],
  ['gold', 5, [100, 60, 0], [255, 250, 190], [250, 200, 40]],
  ['cash', 4, [0, 70, 30], [200, 255, 210], [40, 210, 100]],
  ['heart', 4, [90, 0, 10], [255, 190, 190], [235, 30, 50]],
  ['jade', 3, [0, 80, 60], [150, 255, 200], [20, 180, 120]],
  ['rose', 3, [110, 20, 60], [255, 200, 230], [240, 90, 160]],
  ['pearl', 3, [120, 120, 140], [255, 255, 255], [210, 205, 225]],
  ['hud', 4, [20, 20, 60], [180, 200, 255], [60, 80, 200]],
];

/** Shard i is drawn in this shared ramp. */
export const SHARD_RAMPS = ['heart', 'trim', 'gold', 'cash', 'jade', 'visor', 'nova', 'plasma', 'rose', 'pearl'];

export interface Role {
  name: string;
  n: number;
}

export interface Theme {
  [role: string]: [RGB, RGB, RGB?];
}

interface Pal {
  pal: Uint8Array;
  /** ramp name → palette indices dark..light */
  ramps: Map<string, number[]>;
  used: number;
}

function sharedBuilder(): PaletteBuilder {
  const p = new PaletteBuilder();
  p.color(0, 0, 0); // 0: black
  p.designerColors(); // 1..9
  p.color(252, 252, 252); // 10 white
  p.color(40, 40, 252); // 11 UI blue (Game-Maker looks for 10,10,63)
  p.color(252, 40, 40); // 12 UI red
  p.color(252, 252, 0); // 13 UI yellow
  p.color(200, 40, 200); // 14 UI purple (text screens)
  p.color(8, 8, 24); // 15 outline navy
  for (const [name, n, a, b, mid] of SHARED) p.ramp(name, n, a, b, mid);
  return p;
}

export const WHITE = 10;
export const OUTLINE = 15;
export const SHARED_END = sharedBuilder().used;

/** The shared ramps (same indices in every palette). */
export const shared: Map<string, number[]> = sharedBuilder().ramps;
export const S = (ramp: string, shade: number): number => {
  const r = shared.get(ramp);
  if (!r) throw new Error(`No shared ramp ${ramp}`);
  return r[Math.max(0, Math.min(r.length - 1, shade))];
};

/** Builds a palette: shared colors, then each role ramp colored by `theme`. */
export function buildPalette(roles: Role[], theme: Theme): Pal {
  const p = sharedBuilder();
  for (const r of roles) {
    const t = theme[r.name];
    if (!t) throw new Error(`Theme has no ${r.name}`);
    p.ramp(r.name, r.n, t[0], t[1], t[2]);
  }
  if (p.used > 255) throw new Error(`Palette uses ${p.used} colors`);
  // 255 stays the sprite "clear" color: keep it a recognizable magenta for editors.
  p.pal.set([63, 0, 63], 255 * 3);
  return { pal: p.pal, ramps: p.ramps, used: p.used };
}

/** Role indices for a role list (identical for every theme of that list). */
export function roleIndex(roles: Role[]): Map<string, number[]> {
  const out = new Map<string, number[]>();
  let i = SHARED_END;
  for (const r of roles) {
    out.set(
      r.name,
      Array.from({ length: r.n }, (_, k) => i + k),
    );
    i += r.n;
  }
  if (i > 255) throw new Error(`Roles need ${i} colors`);
  return out;
}

// ---- color helpers for themes ----

export function hsl(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** A ramp spec from a hue: dark shade, light shade and a saturated middle. */
export function hueRamp(h: number, s = 0.6, dark = 0.1, light = 0.85, hueShift = 20): [RGB, RGB, RGB] {
  return [hsl(h - hueShift, s * 0.9, dark), hsl(h + hueShift, s * 0.7, light), hsl(h, s, (dark + light) / 2)];
}
