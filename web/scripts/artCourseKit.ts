// Shared by the art-course figure scripts: the 6-bit palette, PNG saving and small drawing helpers.
import { fileURLToPath } from 'node:url';
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';

export const OUT = fileURLToPath(new URL('../src/artCourses/figures/', import.meta.url));

// Palette (6-bit components). Ramps: grass 1-5, soil 6-9, stone 10-13, wood 14-17, roof 18-20, sky/ink/misc.
const COLORS: [string, number[]][] = [
  ['bg', [58, 60, 62]],
  ['g0', [8, 26, 8]],
  ['g1', [12, 34, 10]],
  ['g2', [16, 42, 12]],
  ['g3', [22, 50, 16]],
  ['g4', [32, 58, 22]],
  ['s0', [22, 14, 8]],
  ['s1', [30, 20, 12]],
  ['s2', [38, 26, 16]],
  ['s3', [46, 34, 22]],
  ['k0', [24, 24, 28]],
  ['k1', [34, 34, 38]],
  ['k2', [44, 44, 48]],
  ['k3', [54, 54, 58]],
  ['w0', [26, 16, 8]],
  ['w1', [36, 24, 12]],
  ['w2', [46, 32, 16]],
  ['w3', [56, 42, 24]],
  ['r0', [38, 10, 8]],
  ['r1', [50, 16, 12]],
  ['r2', [58, 26, 20]],
  ['sky', [30, 46, 63]],
  ['ink', [6, 6, 10]],
  ['yel', [63, 56, 14]],
  ['wht', [63, 63, 63]],
  ['line', [63, 20, 40]],
  ['b0', [10, 18, 38]],
  ['b1', [16, 28, 50]],
  ['b2', [24, 40, 60]],
  ['sk0', [48, 32, 24]],
  ['sk1', [60, 44, 34]],
  ['j0', [8, 26, 18]],
  ['j1', [12, 38, 26]],
  ['j2', [20, 50, 36]],
];
export const C: Record<string, number> = {};
export const pal = new Uint8Array(768);
COLORS.forEach(([n, rgb], i) => {
  C[n] = i;
  pal.set(rgb, i * 3);
});
export const GRASS = ['g0', 'g1', 'g2', 'g3', 'g4'].map((n) => C[n]);
export const STONE = ['k0', 'k1', 'k2', 'k3'].map((n) => C[n]);

export const save = (name: string, p: Pixels, scale: number) => writePng(`${OUT}${name}.png`, p, pal, scale);

/** Sheets pictures left to right with a gap (background color) between. */
export function strip(parts: Pixels[], gap = 4): Pixels {
  const h = Math.max(...parts.map((p) => p.h));
  const w = parts.reduce((n, p) => n + p.w, 0) + gap * (parts.length - 1);
  const out = new Pixels(w, h, C.bg);
  let x = 0;
  for (const p of parts) {
    out.blit(p, x, 0);
    x += p.w + gap;
  }
  return out;
}

/** A hash that gives the same pixel noise at x and x + 20, so a block's edges meet its neighbors. */
export const hash = (x: number, y: number, seed: number): number => {
  let h = (((x % 20) + 20) % 20) * 374761393 + (((y % 20) + 20) % 20) * 668265263 + seed * 2246822519;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// ---- stone wall: running bond, 10-pixel courses, joints repeat every 20 pixels so any 20-wide cut meets itself ----
export function wall(x0: number, y0: number, w: number, h: number, seed: number, frame: boolean): Pixels {
  const p = new Pixels(w, h);
  const r = rng(seed);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const gx = x0 + x;
      const gy = y0 + y;
      const course = Math.floor(gy / 10);
      const shift = course % 2 ? 10 : 0;
      const jointV = (gx + shift) % 20 === 0;
      const jointH = gy % 10 === 0;
      let c = STONE[1 + (r() < 0.25 ? 1 : 0) + (r() < 0.1 ? -1 : 0)];
      if (jointV || jointH) c = STONE[0];
      else if (gy % 10 === 1 || (gx + shift) % 20 === 1) c = STONE[3];
      p.set(x, y, c);
    }
  if (frame) p.frame(0, 0, w, h, C.ink);
  return p;
}
