// A short, plain name for a color ("dark red", "light blue-green"), for people who would rather
// read a color than guess it. Works on a VGA palette color (6-bit components) or 8-bit bytes.
// Pure: no DOM.
import type { Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';

/** Hue bands in degrees: each name holds from its start up to the next one's. */
const HUES: [number, string][] = [
  [345, 'red'],
  [15, 'orange'],
  [45, 'yellow'],
  [70, 'yellow-green'],
  [95, 'green'],
  [165, 'blue-green'],
  [200, 'blue'],
  [255, 'purple'],
  [295, 'magenta'],
];

function hueName(h: number): string {
  let name = 'red'; // 345 up to 15 wraps round zero
  for (const [from, n] of HUES) if (from < 345 && h >= from && h < 345) name = n;
  return name;
}

/** The name of a color given as 0-255 red, green and blue. */
export function colorName(r: number, g: number, b: number): string {
  const R = r / 255,
    G = g / 255,
    B = b / 255;
  const max = Math.max(R, G, B),
    min = Math.min(R, G, B);
  const l = (max + min) / 2,
    d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (l < 0.08) return 'black';
  if (l > 0.94) return 'white';
  if (s < 0.12) return l < 0.3 ? 'dark gray' : l > 0.7 ? 'light gray' : 'gray';
  let h = 0;
  if (max === R) h = ((G - B) / d) % 6;
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  h = (h * 60 + 360) % 360;
  let name = hueName(h);
  // dark orange or dark yellow reads as brown; light red reads as pink
  if ((name === 'orange' || name === 'yellow') && l < 0.4) return l < 0.2 ? 'dark brown' : 'brown';
  if (name === 'red' && l > 0.72) return 'pink';
  const weak = s < 0.3 ? 'grayish ' : '';
  name = weak + name;
  return l < 0.28 ? `dark ${name}` : l > 0.7 ? `light ${name}` : name;
}

/** The name of palette color `i` (6-bit components). */
export function paletteColorName(pal: Palette, i: number): string {
  const c = (k: number) => Math.round((pal[i * 3 + k] * 255) / 63);
  return colorName(c(0), c(1), c(2));
}
