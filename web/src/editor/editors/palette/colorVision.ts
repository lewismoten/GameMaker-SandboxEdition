// A palette as other eyes see it: in grayscale (lightness only, the WCAG relative luminance the
// Level check uses) and with the three common color-vision differences, simulated with the
// severity-1.0 matrices of Machado, Oliveira and Fernandes, "A Physiologically-based Model for
// Simulation of Color Vision Deficiency", IEEE TVCG 15(6), 2009 (NOTICE.md), applied in linear
// RGB. Also each view's CIELAB colors, to measure how far apart two colors look (CIE76 ΔE).
import type { Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { luminance } from '../../check/sceneData';
import { MACHADO, lab, linearToSrgb, simulateLinear, srgbToLinear, unlab, type Rgb } from '@lewismoten/gamemaker-sandbox-engine/gfx/colorVision';

export { lab, unlab };

export type View = 'normal' | 'gray' | 'protan' | 'deutan' | 'tritan';

export const VIEWS: { id: View; name: string; about: string }[] = [
  { id: 'normal', name: 'Normal', about: 'The palette as it is' },
  { id: 'gray', name: 'Grayscale', about: 'Lightness only, as on a gray screen or a black-and-white printout' },
  { id: 'protan', name: 'Protanopia', about: 'Reds look darker, and red and green look alike' },
  { id: 'deutan', name: 'Deuteranopia', about: 'Red and green look alike (the most common)' },
  { id: 'tritan', name: 'Tritanopia', about: 'Blue and green look alike, and so do yellow and pink' },
];

type RGB = Rgb;

/** A 6-bit VGA component (0..63) as linear light (0..1). */
const toLinear = (v: number) => srgbToLinear((v & 63) / 63);
const toSrgb = linearToSrgb;

/** Palette color `i` in linear RGB as `view` sees it. */
export function seen(pal: Palette, i: number, view: View): RGB {
  if (view === 'gray') {
    const y = luminance(pal, i);
    return [y, y, y];
  }
  const rgb: RGB = [toLinear(pal[i * 3]), toLinear(pal[i * 3 + 1]), toLinear(pal[i * 3 + 2])];
  if (view === 'normal') return rgb;
  return simulateLinear(rgb, MACHADO[view]);
}

/** The whole palette as `view` sees it, as ordinary 6-bit palette data (for drawing). */
export function simulate(pal: Palette, view: View): Palette {
  const out = new Uint8Array(768);
  for (let i = 0; i < 256; i++) seen(pal, i, view).forEach((l, c) => (out[i * 3 + c] = Math.round(toSrgb(l) * 63)));
  return out;
}

/** Every color of the palette in CIELAB as `view` sees it (L, a, b per color). */
export function labs(pal: Palette, view: View): Float64Array {
  const out = new Float64Array(768);
  for (let i = 0; i < 256; i++) out.set(lab(seen(pal, i, view)), i * 3);
  return out;
}

/** How far apart two colors look (CIE76 ΔE: about 2.3 is just noticeable side by side). */
export const deltaE = (l: Float64Array, i: number, j: number) => Math.hypot(l[i * 3] - l[j * 3], l[i * 3 + 1] - l[j * 3 + 1], l[i * 3 + 2] - l[j * 3 + 2]);

/** A color with its CIELAB lightness moved by `dL`, hue and colorfulness kept as far as VGA allows. */
export function relightColor(pal: Palette, i: number, dL: number): RGB {
  const [L, a, b] = lab(seen(pal, i, 'normal'));
  return unlab([Math.max(0, Math.min(100, L + dL)), a, b]).map((l) => Math.round(toSrgb(l) * 63)) as RGB;
}
