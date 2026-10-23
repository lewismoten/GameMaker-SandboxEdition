// .pal files: 256 VGA DAC entries of 3 bytes (red, green, blue), each 0..63.

export const PALETTE_SIZE = 256 * 3;

export type Palette = Uint8Array; // length 768, 6-bit components

export function parsePalette(bytes: Uint8Array): Palette {
  const pal = new Uint8Array(PALETTE_SIZE);
  pal.set(bytes.subarray(0, PALETTE_SIZE));
  return pal;
}

export function serializePalette(pal: Palette): Uint8Array {
  return pal.slice(0, PALETTE_SIZE);
}

/** Expands 6-bit VGA components to packed 0xAABBGGRR values for ImageData/Uint32Array. */
export function paletteToRGBA(pal: Palette): Uint32Array {
  const out = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    out[i] = (0xff << 24) | (vga8(pal[i * 3 + 2]) << 16) | (vga8(pal[i * 3 + 1]) << 8) | vga8(pal[i * 3]);
  }
  return out;
}

export function vga8(v: number): number {
  const c = v & 63;
  return (c << 2) | (c >> 4);
}

export function paletteCss(pal: Palette, index: number): string {
  return `rgb(${vga8(pal[index * 3])},${vga8(pal[index * 3 + 1])},${vga8(pal[index * 3 + 2])})`;
}

/**
 * Port of RGBdata::Match: the palette index whose color is closest to (r,g,b)
 * (6-bit components), by squared distance; first match wins ties.
 */
export function matchColor(pal: Palette, r: number, g: number, b: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < 256; i++) {
    const dr = (pal[i * 3] & 63) - r;
    const dg = (pal[i * 3 + 1] & 63) - g;
    const db = (pal[i * 3 + 2] & 63) - b;
    const d = dr * dr + dg * dg + db * db;
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

/** Default palette GameMaker editors start with: a rainbow ramp plus greys (port of RainbowCols-ish). */
export function defaultPalette(): Palette {
  const pal = new Uint8Array(PALETTE_SIZE);
  // 16 greys
  for (let i = 0; i < 16; i++) pal.set([i * 4 + 3, i * 4 + 3, i * 4 + 3], i * 3);
  // 6x6x6 color cube
  let i = 16;
  for (let r = 0; r < 6; r++)
    for (let g = 0; g < 6; g++) for (let b = 0; b < 6; b++) pal.set([Math.round((r * 63) / 5), Math.round((g * 63) / 5), Math.round((b * 63) / 5)], i++ * 3);
  // remaining: hue ramp
  for (; i < 255; i++) {
    const h = ((i - 232) / 23) * 6;
    const [r, g, b] = hsv(h, 1, 1);
    pal.set([r, g, b], i * 3);
  }
  // 255 is the transparent color in sprites; keep it a recognizable magenta.
  pal.set([63, 0, 63], 255 * 3);
  return pal;
}

function hsv(h: number, s: number, v: number): [number, number, number] {
  const f = (n: number) => {
    const k = (n + h) % 6;
    return Math.round(63 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))));
  };
  return [f(5), f(3), f(1)];
}
