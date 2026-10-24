// A game poster under black light (wallPoster.ts): paper and white ink glow a pale lavender
// (the brighteners in the paper), bright saturated inks glow neon in their own hue, and dull
// or dark colors sink into a violet dark, as a printed poster does under a UV tube.

/** How strongly an ink of this hue fluoresces: fully from magenta round to green, faintly for blue. */
function hueGlow(r: number, g: number, b: number, max: number, min: number): number {
  if (max === min) return 0;
  const d = max - min;
  const h = (max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
  if (h >= 190 && h < 270) return 0.15; // blue
  if (h >= 160 && h < 190) return 0.5; // cyan
  if (h >= 270 && h < 300) return 0.45; // purple
  return 1;
}

/** One color (0..255 each) as it looks under black light. */
export function uvColor(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const light = max / 255;
  const sat = max ? (max - min) / max : 0;
  // the violet dark everything sits in
  const dull = 1 - 0.6 * sat;
  let R = (22 + 30 * light) * dull;
  let G = (8 + 10 * light) * dull;
  let B = (40 + 50 * light) * dull;
  // white paper and pale inks: a soft lavender glow, brightest where it is whitest
  const white = Math.max(0, light - 0.55) * Math.max(0, 1 - sat * 2.5) * 2.2;
  R += 150 * white;
  G += 130 * white;
  B += 215 * white;
  // fluorescent inks: saturated and bright, they glow in their own hue, a little hotter;
  // pinks, reds, oranges, yellows and greens glow, blues and purples hardly do
  const neon = Math.min(1.1, Math.max(0, sat - 0.2) * Math.max(0, light - 0.25) * 4) * hueGlow(r, g, b, max, min);
  if (neon > 0) {
    const k = 255 / max;
    R += r * k * neon;
    G += g * k * neon;
    B += b * k * neon;
  }
  return [Math.min(255, R), Math.min(255, G), Math.min(255, B)].map(Math.round) as [number, number, number];
}

/** A #rrggbb ink as it glows under black light, as a CSS color (a pale lavender for any other color). */
export function uvInk(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#e6dcff';
  const n = parseInt(m[1], 16);
  return `rgb(${uvColor(n >> 16, (n >> 8) & 255, n & 255).join(' ')})`;
}

/** The whole poster under black light: a new canvas the same size. */
export function uvPoster(src: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext('2d');
  const from = src.getContext('2d');
  if (!ctx || !from) return out;
  const img = from.getImageData(0, 0, src.width, src.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const [r, g, b] = uvColor(d[i], d[i + 1], d[i + 2]);
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }
  ctx.putImageData(img, 0, 0);
  return out;
}
