// Final Curtain's colors: one set of named ramps shared by every block, sprite and screen.
// The art never changes between scenes; the .PAL does. The Paragon at 10:30 PM has its
// house lights on; at 2 AM only the ghost light (and a watchman's lantern) still burn, so the
// night palette dims every ramp toward blue except the ones that give off light.
import { PaletteBuilder } from '../../../kit/palette';
import { matchColor } from '../../../../web/src/formats/palette';

type RGB = [number, number, number];
type Light = 'house' | 'night' | 'dawn';

/** [name, shades, dark, light, mid?, gives off light?] */
const RAMPS: [string, number, RGB, RGB, RGB?, boolean?][] = [
  ['grey', 8, [24, 24, 30], [214, 214, 220]],
  ['wood', 8, [52, 30, 16], [214, 160, 98]],
  ['panel', 6, [26, 12, 10], [120, 64, 42]],
  ['velvet', 8, [44, 4, 10], [232, 52, 60], [150, 14, 26]],
  ['gold', 6, [96, 62, 8], [255, 232, 120]],
  ['tile', 5, [110, 100, 92], [236, 228, 210]],
  ['paper', 6, [150, 128, 92], [255, 250, 232]],
  ['skin', 6, [96, 54, 36], [255, 218, 188]],
  ['black', 3, [14, 12, 16], [56, 52, 60]],
  ['blonde', 3, [150, 110, 40], [250, 226, 140]],
  ['auburn', 3, [90, 26, 12], [200, 90, 40]],
  ['tan', 5, [92, 70, 40], [222, 196, 140]],
  ['navy', 5, [12, 16, 40], [90, 110, 170]],
  ['green', 5, [8, 40, 24], [100, 200, 130]],
  ['plum', 4, [40, 12, 40], [170, 90, 160]],
  ['teal', 4, [8, 44, 50], [90, 180, 180]],
  ['rain', 6, [8, 10, 26], [120, 140, 190]],
  ['brick', 4, [60, 22, 18], [170, 84, 64]],
  ['glow', 5, [190, 90, 20], [255, 250, 200], [255, 190, 70], true],
  ['ghost', 4, [120, 150, 190], [250, 252, 255], undefined, true],
  ['eyes', 2, [200, 20, 10], [255, 200, 60], undefined, true],
  ['neon', 3, [230, 30, 60], [255, 210, 120], [255, 90, 70], true],
];

/** The inks PLAYGAME looks for (it picks the palette color nearest to each). */
const INKS: [string, RGB][] = [
  ['red', [228, 40, 40]], // "MORE...", "Top Ten Scores", "Hit any key" (nearest 63,10,10)
  ['blue', [56, 72, 252]], // menu, scores, F2 status (nearest 10,10,63)
  ['yellow', [252, 236, 40]], // save/load names (nearest 63,63,0)
  ['purple', [176, 30, 160]], // text screens (nearest 50,10,50)
  ['white', [255, 255, 255]],
];

const LIGHT: Record<Light, { mul: RGB; add: RGB }> = {
  house: { mul: [1, 1, 1], add: [0, 0, 0] },
  night: { mul: [0.4, 0.44, 0.64], add: [6, 8, 22] },
  dawn: { mul: [1.0, 0.86, 0.84], add: [20, 8, 18] },
};

interface Pal {
  pal: Uint8Array;
  r: (name: string) => number[];
  /** Shade k of a ramp, clamped. */
  c: (name: string, k: number) => number;
  /** An ink by name. */
  ink: (name: string) => number;
}

export function buildPalette(light: Light = 'house'): Pal {
  const b = new PaletteBuilder();
  // Index 0 is black: the border PLAYGAME paints, and the dark under the stage.
  b.color(0, 0, 0);
  const inks = new Map<string, number>();
  for (const [name, c] of INKS) inks.set(name, b.color(...c));
  b.designerColors();
  const t = LIGHT[light];
  for (const [name, n, from, to, mid, glows] of RAMPS) {
    const lit = (c: RGB): RGB => (glows ? c : (c.map((v, i) => Math.max(0, Math.min(255, Math.round(v * t.mul[i] + t.add[i])))) as RGB));
    b.ramp(name, n, lit(from), lit(to), mid ? lit(mid) : undefined);
  }
  const r = (name: string) => b.get(name);
  const p: Pal = {
    pal: b.pal,
    r,
    c: (name, k) => {
      const ramp = r(name);
      return ramp[Math.max(0, Math.min(ramp.length - 1, k))];
    },
    ink: (name) => inks.get(name)!,
  };
  checkInks(p);
  return p;
}

/** PLAYGAME's text must land on our inks, or menus and text screens go unreadable. */
function checkInks(p: Pal): void {
  const want: [string, RGB][] = [
    ['red', [63, 10, 10]],
    ['blue', [10, 10, 63]],
    ['yellow', [63, 63, 0]],
    ['purple', [50, 10, 50]],
  ];
  for (const [name, [r, g, b]] of want) {
    const got = matchColor(p.pal, r, g, b);
    if (got !== p.ink(name)) throw new Error(`Palette: PLAYGAME's ${name} lands on color ${got}, not the ${name} ink`);
  }
}

/** Index layout is the same in every palette, so any of them names the colors. */
export const P = buildPalette('house');
export const c = (name: string, k: number) => P.c(name, k);
export const ramp = (name: string) => P.r(name);
export const ink = (name: string) => P.ink(name);
