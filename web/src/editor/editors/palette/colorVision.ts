// A palette as other eyes see it: in grayscale (lightness only, the WCAG relative luminance the
// Level check uses) and with the three common color-vision differences, simulated with the
// severity-1.0 matrices of Machado, Oliveira and Fernandes, "A Physiologically-based Model for
// Simulation of Color Vision Deficiency", IEEE TVCG 15(6), 2009 (NOTICE.md), applied in linear
// RGB. Also each view's CIELAB colors, to measure how far apart two colors look (CIE76 ΔE).
import type { Palette } from '../../../formats/palette';
import { luminance } from '../../check/sceneData';

export type View = 'normal' | 'gray' | 'protan' | 'deutan' | 'tritan';

export const VIEWS: { id: View; name: string; about: string }[] = [
  { id: 'normal', name: 'Normal', about: 'The palette as it is' },
  { id: 'gray', name: 'Grayscale', about: 'Lightness only, as on a gray screen or a black-and-white printout' },
  { id: 'protan', name: 'Protanopia', about: 'Reds look darker, and red and green look alike' },
  { id: 'deutan', name: 'Deuteranopia', about: 'Red and green look alike (the most common)' },
  { id: 'tritan', name: 'Tritanopia', about: 'Blue and green look alike, and so do yellow and pink' },
];

/** Machado et al. 2009, Table 1, severity 1.0 (rows give linear R, G, B out). */
const MACHADO: Record<'protan' | 'deutan' | 'tritan', number[]> = {
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
};

type RGB = [number, number, number];

/** A 6-bit VGA component (0..63) as linear light (0..1). */
const toLinear = (v: number) => {
  const c = (v & 63) / 63;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
/** Linear light (0..1) as an sRGB value (0..1). */
const toSrgb = (l: number) => {
  const c = Math.max(0, Math.min(1, l));
  return c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
};

/** Palette color `i` in linear RGB as `view` sees it. */
export function seen(pal: Palette, i: number, view: View): RGB {
  if (view === 'gray') {
    const y = luminance(pal, i);
    return [y, y, y];
  }
  const rgb: RGB = [toLinear(pal[i * 3]), toLinear(pal[i * 3 + 1]), toLinear(pal[i * 3 + 2])];
  if (view === 'normal') return rgb;
  const m = MACHADO[view];
  const out = [0, 1, 2].map((r) => Math.max(0, Math.min(1, m[r * 3] * rgb[0] + m[r * 3 + 1] * rgb[1] + m[r * 3 + 2] * rgb[2])));
  return out as RGB;
}

/** The whole palette as `view` sees it, as ordinary 6-bit palette data (for drawing). */
export function simulate(pal: Palette, view: View): Palette {
  const out = new Uint8Array(768);
  for (let i = 0; i < 256; i++) seen(pal, i, view).forEach((l, c) => (out[i * 3 + c] = Math.round(toSrgb(l) * 63)));
  return out;
}

/** Linear RGB to CIELAB (D65 white). */
export function lab([r, g, b]: RGB): RGB {
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** CIELAB back to linear RGB (unclamped). */
export function unlab([L, a, b]: RGB): RGB {
  const fy = (L + 16) / 116;
  const inv = (t: number) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
  const x = inv(fy + a / 500) * 0.95047;
  const y = inv(fy);
  const z = inv(fy - b / 200) * 1.08883;
  return [3.2406 * x - 1.5372 * y - 0.4986 * z, -0.9689 * x + 1.8758 * y + 0.0415 * z, 0.0557 * x - 0.204 * y + 1.057 * z];
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
