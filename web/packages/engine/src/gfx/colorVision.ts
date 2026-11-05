// Color-vision simulation shared by the palette editor's Color vision check, the badge look-alike
// report and the games' own color checks: the Machado matrices, sRGB <-> linear RGB, CIELAB and the
// CIE76 color difference. Callers keep their own input and output scales (6-bit VGA, 8-bit bytes).
//
// CREDIT: the matrices are the published numbers of Gustavo M. Machado, Manuel M. Oliveira and
// Leandro A. F. Fernandes, "A Physiologically-based Model for Simulation of Color Vision
// Deficiency", IEEE Transactions on Visualization and Computer Graphics 15(6), 2009, Table 1,
// severity 1.0, applied to linear RGB as the paper describes. CIELAB and the 1976 color
// difference are the CIE's published formulas; the sRGB curve is IEC 61966-2-1. See NOTICE.md.

export type Rgb = [number, number, number];
export type Vision = 'protan' | 'deutan' | 'tritan';

/** Machado et al. 2009, Table 1, severity 1.0 (rows give linear R, G, B out). */
export const MACHADO = {
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
} as const;

/** An sRGB value (0..1) as linear light (0..1). */
export const srgbToLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/** Linear light as an sRGB value (0..1), clamped first. */
export function linearToSrgb(l: number): number {
  const c = Math.max(0, Math.min(1, l));
  return c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
}

/** A linear RGB color as the given kind of color vision sees it, each channel clamped to 0..1. */
export function simulateLinear(rgb: Rgb, matrix: readonly number[]): Rgb {
  return [0, 1, 2].map((r) => Math.max(0, Math.min(1, matrix[r * 3] * rgb[0] + matrix[r * 3 + 1] * rgb[1] + matrix[r * 3 + 2] * rgb[2]))) as Rgb;
}

/** Linear RGB to CIELAB (D65 white). */
export function lab([r, g, b]: Rgb): Rgb {
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** CIELAB back to linear RGB (unclamped). */
export function unlab([L, a, b]: Rgb): Rgb {
  const fy = (L + 16) / 116;
  const inv = (t: number) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
  const x = inv(fy + a / 500) * 0.95047;
  const y = inv(fy);
  const z = inv(fy - b / 200) * 1.08883;
  return [3.2406 * x - 1.5372 * y - 0.4986 * z, -0.9689 * x + 1.8758 * y + 0.0415 * z, 0.0557 * x - 0.204 * y + 1.057 * z];
}

/** How far apart two CIELAB colors look (CIE76 delta E: about 2.3 is just noticeable side by side). */
export const deltaELab = (a: Rgb, b: Rgb): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const bytesToLinear = (c: Rgb): Rgb => c.map((x) => srgbToLinear(x / 255)) as Rgb;

/** A color (0-255 per channel) as the given kind of color vision sees it. */
export function simulateBytes(c: Rgb, v: Vision): Rgb {
  return simulateLinear(bytesToLinear(c), MACHADO[v]).map((l) => Math.round(255 * linearToSrgb(l))) as Rgb;
}

/** How far apart two colors (0-255 per channel) look: CIE76 delta E; about 2 is just noticeable, over 25 plainly different. */
export const deltaEBytes = (a: Rgb, b: Rgb): number => deltaELab(lab(bytesToLinear(a)), lab(bytesToLinear(b)));

/** A whole VGA palette (768 bytes of 6-bit values) as the given kind of color vision sees it. */
export function simulatePalette(pal: Uint8Array, v: Vision): Uint8Array {
  const out = new Uint8Array(pal.length);
  for (let i = 0; i < pal.length; i += 3) {
    const [r, g, b] = simulateBytes([0, 1, 2].map((k) => (pal[i + k] << 2) | (pal[i + k] >> 4)) as Rgb, v);
    out.set([r >> 2, g >> 2, b >> 2], i);
  }
  return out;
}
