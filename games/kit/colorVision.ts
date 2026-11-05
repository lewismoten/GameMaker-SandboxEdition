// Color-vision simulation for checking a game's colors: how a picture looks to a player who
// sees red and green alike (protanopia, deuteranopia) or blue and yellow alike (tritanopia).
// Used by games/colors and available to any game's checks. It is for looking and measuring;
// no game ships it.
//
// CREDIT: the matrices are from Machado, Oliveira and Fernandes, "A Physiologically-based Model
// for Simulation of Color Vision Deficiency", IEEE Transactions on Visualization and Computer
// Graphics 15(6), 2009 (severity 1.0). The numbers are published data; this file applies them
// to linear RGB (sRGB decoded, multiplied, encoded again), the way the paper describes.

export type Rgb = [number, number, number];
export type Vision = 'protan' | 'deutan' | 'tritan';

const M: Record<Vision, number[]> = {
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deutan: [0.367322, 0.860646, -0.228014, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
};

const toLinear = (v: number): number => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const toByte = (l: number): number => {
  const c = Math.min(1, Math.max(0, l));
  return Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055));
};

/** A color (0-255 per channel) as the given kind of color vision sees it. */
export function simulate(c: Rgb, v: Vision): Rgb {
  const m = M[v];
  const [r, g, b] = c.map(toLinear);
  return [0, 1, 2].map((i) => toByte(m[i * 3] * r + m[i * 3 + 1] * g + m[i * 3 + 2] * b)) as Rgb;
}

/** Relative luminance, 0 (black) to 1 (white). */
export function luminance(c: Rgb): number {
  const [r, g, b] = c.map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** How far apart two colors look (CIE76 delta E in Lab; about 2 is just noticeable, over 25 is plainly different). */
export function deltaE(a: Rgb, b: Rgb): number {
  const lab = (c: Rgb): Rgb => {
    const [r, g, bl] = c.map(toLinear);
    const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    const x = f((0.4124 * r + 0.3576 * g + 0.1805 * bl) / 0.95047);
    const y = f(0.2126 * r + 0.7152 * g + 0.0722 * bl);
    const z = f((0.0193 * r + 0.1192 * g + 0.9505 * bl) / 1.08883);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  };
  const [l1, a1, b1] = lab(a);
  const [l2, a2, b2] = lab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/** A whole VGA palette (768 bytes of 6-bit values) as the given kind of color vision sees it. */
export function simulatePalette(pal: Uint8Array, v: Vision): Uint8Array {
  const out = new Uint8Array(pal.length);
  for (let i = 0; i < pal.length; i += 3) {
    const [r, g, b] = simulate([0, 1, 2].map((k) => (pal[i + k] << 2) | (pal[i + k] >> 4)) as Rgb, v);
    out.set([r >> 2, g >> 2, b >> 2], i);
  }
  return out;
}
