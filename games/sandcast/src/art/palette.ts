// Sandcastle Knight's palette: a backyard sandbox in golds, tans and ochres, with hose
// water blues, grass edging, toy colors, and the 16 ANSI colors of a BBS screen. The same
// blocks are re-lit for other scenes by tinting this palette (the tunnels underground, the
// hose-soaked moat, and the patio at sunset where Gwinn naps).
import { PaletteBuilder } from '../../../kit/palette';

const pb = new PaletteBuilder();
// Index 0 is black: the screen border and fades use it.
pb.color(0, 0, 0);

export const SAND = pb.ramp('sand', 10, [96, 60, 24], [255, 240, 190], [222, 182, 112]);
export const OCHRE = pb.ramp('ochre', 7, [58, 34, 14], [200, 146, 78], [140, 92, 40]);
export const WATER = pb.ramp('water', 10, [8, 18, 64], [236, 252, 255], [44, 120, 200]);
export const GRASS = pb.ramp('grass', 7, [16, 48, 12], [168, 222, 96], [64, 140, 40]);
export const WOOD = pb.ramp('wood', 7, [54, 28, 12], [226, 176, 112], [148, 92, 48]);
export const RED = pb.ramp('red', 7, [64, 8, 10], [255, 168, 150], [214, 40, 32]);
export const YELLOW = pb.ramp('yellow', 5, [128, 88, 0], [255, 246, 120], [244, 200, 24]);
export const STEEL = pb.ramp('steel', 8, [26, 28, 40], [250, 252, 255], [124, 132, 156]);
export const TABBY = pb.ramp('tabby', 8, [70, 30, 8], [255, 222, 170], [232, 122, 40]);
export const PINK = pb.ramp('pink', 4, [140, 50, 74], [255, 196, 210], [240, 120, 150]);
export const BEETLE = pb.ramp('beetle', 6, [12, 22, 30], [130, 236, 200], [30, 120, 110]);
export const PURPLE = pb.ramp('purple', 5, [36, 12, 52], [214, 160, 255], [124, 60, 180]);
export const GRAY = pb.ramp('gray', 6, [40, 40, 44], [220, 220, 224]);

// The 16 colors of an ANSI BBS screen (CGA order: black, blue, green, cyan, red,
// magenta, brown, light gray, dark gray, light blue, light green, light cyan, light red,
// light magenta, yellow, white).
export const ANSI: number[] = [
  [0, 0, 0],
  [0, 0, 170],
  [0, 170, 0],
  [0, 170, 170],
  [170, 0, 0],
  [170, 0, 170],
  [170, 85, 0],
  [170, 170, 170],
  [85, 85, 85],
  [85, 85, 255],
  [85, 255, 85],
  [85, 255, 255],
  [255, 85, 85],
  [255, 85, 255],
  [255, 255, 85],
  [255, 255, 255],
].map(([r, g, b]) => pb.color(r, g, b));

pb.designerColors();
// Game-Maker writes story and instruction text in the color nearest (50, 10, 50) (6-bit).
pb.color(202, 42, 202);

/** The daylight palette (6-bit VGA components). */
export const DAY = pb.pal.slice();

/** A tinted copy of the palette: each component scaled, then lifted, then clamped. */
function tint(pal: Uint8Array, mul: [number, number, number], add: [number, number, number] = [0, 0, 0], keep: number[] = []): Uint8Array {
  const out = pal.slice();
  for (let i = 1; i < 256; i++) {
    if (keep.includes(i)) continue;
    for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.max(0, Math.min(63, Math.round(pal[i * 3 + c] * mul[c] + add[c])));
  }
  return out;
}

/** Underground: dim, cool and a little green, as if lit by glowworms. */
export const BURROW = tint(DAY, [0.66, 0.58, 0.6], [1, 1, 3]);
/** The patio at sunset: warm orange light, long purple shadows. */
export const DUSK = tint(DAY, [1.0, 0.72, 0.62], [3, 0, 4]);
/** The Hosewater Moat: the hose has soaked everything, so the sand is darker and cooler. */
export const MOAT = tint(DAY, [0.84, 0.92, 1.0], [0, 1, 4]);
