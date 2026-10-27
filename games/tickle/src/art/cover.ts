// The title and cover art, drawn for the game (no cover came with the song): Doc Leo in his lab
// coat behind the lab bench at midnight, arms up in a maniacal laugh, a freshly tickled rat
// giggling on the bench in front of him and more coming, the bat detector's needle swinging up
// from 22 kHz (dread) to 50 kHz (joy), a Tesla coil crackling on the right, flasks glowing on
// the left and the storm in the arched window, the lightning flashing. Painted in true color a
// pixel at a time (the sprites stamped in, three times their size), then reduced to one
// 256-color palette for the FLI (cartoons.ts). Frame k of n animates it.
import { rng, type Pixels } from '../../../kit/pixels';
import { mixc, clamp, noise2 } from '../../../kit/coverPaint';

const COVER_W = 320;
const COVER_H = 200;

type RGB = [number, number, number];

const N1 = noise2(31);
const N2 = noise2(47);
const fbm = (x: number, y: number) => N1(x, y) * 0.6 + N2(x * 2.1, y * 2.1) * 0.3 + N1(x * 4.3 + 7, y * 4.3) * 0.1;

/** The cast, as pictures and the palette they are drawn in (6-bit VGA). */
interface CoverCast {
  leo: (pose: string) => Pixels;
  mons: Map<string, Pixels>;
  pal: Uint8Array;
}

/** Where things stand. */
const BENCH = 150;
const WINDOW = { x: 196, y: 14, w: 76, h: 104 };
const COIL = { x: 292, y: 64 };
const METER = { x: 246, y: 112 };

/** One frame of the cover as RGB bytes (320x200x3): frame k of n. */
export function coverRgb(cast: CoverCast, k: number, n: number): Uint8Array {
  const W = COVER_W;
  const H = COVER_H;
  const t = n > 1 ? k / (n - 1) : 1;
  const flash = k === Math.floor(n * 0.4) || k === Math.floor(n * 0.4) + 2;
  const img = new Float32Array(W * H * 3);
  const put = (x: number, y: number, c: RGB, a = 1) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
    const i = (y * W + x) * 3;
    for (let j = 0; j < 3; j++) img[i + j] = img[i + j] * (1 - a) + c[j] * a;
  };
  const glow = (cx: number, cy: number, r: number, c: RGB, power: number) => {
    for (let y = Math.max(0, cy - r * 3); y < Math.min(H, cy + r * 3); y++)
      for (let x = Math.max(0, cx - r * 3); x < Math.min(W, cx + r * 3); x++) {
        const g = Math.exp(-Math.hypot(x - cx, y - cy) / r) * power;
        const i = (Math.round(y) * W + Math.round(x)) * 3;
        for (let j = 0; j < 3; j++) img[i + j] += c[j] * g;
      }
  };
  // ---- the wall: big dark tiles, damp and old
  for (let y = 0; y < BENCH; y++)
    for (let x = 0; x < W; x++) {
      const n0 = fbm(x / 18, y / 18);
      let c = mixc([22, 18, 40], [52, 44, 78], 0.3 + n0 * 0.5 - y / 400);
      if (x % 24 === 0 || y % 24 === 0) c = mixc(c, [10, 8, 20], 0.7);
      put(x, y, c);
    }
  // ---- the arched window: the storm, the rain, the lightning
  for (let y = WINDOW.y; y < WINDOW.y + WINDOW.h; y++)
    for (let x = WINDOW.x; x < WINDOW.x + WINDOW.w; x++) {
      const cx = WINDOW.x + WINDOW.w / 2;
      const top = WINDOW.y + WINDOW.w / 2;
      if (y < top && ((x - cx) / (WINDOW.w / 2)) ** 2 + ((y - top) / (WINDOW.w / 2)) ** 2 > 1) continue;
      const cloud = fbm(x / 14 + t * 2, y / 9);
      let c = mixc([30, 20, 60], [110, 80, 150], cloud);
      if (flash) c = mixc(c, [230, 230, 255], 0.75);
      if ((x * 3 + y * 7 + k * 5) % 23 === 0) c = mixc(c, [190, 200, 240], 0.5);
      put(x, y, c);
    }
  if (flash) {
    let x = WINDOW.x + 46;
    const r = rng(k + 3);
    for (let y = WINDOW.y + 10; y < WINDOW.y + WINDOW.h - 4; y += 4) {
      const nx = x + (r() - 0.5) * 10;
      for (let s = 0; s <= 4; s++) put(x + (nx - x) * (s / 4), y + s, [255, 255, 255]);
      x = nx;
    }
  }
  // the mullions and the sill
  for (let y = WINDOW.y; y < WINDOW.y + WINDOW.h; y++) for (let d = -1; d <= 1; d++) put(WINDOW.x + WINDOW.w / 2 + d, y, [60, 50, 70]);
  for (let x = WINDOW.x; x < WINDOW.x + WINDOW.w; x++) for (let d = 0; d < 2; d++) put(x, WINDOW.y + 66 + d, [60, 50, 70]);
  for (let x = WINDOW.x - 6; x < WINDOW.x + WINDOW.w + 6; x++)
    for (let d = 0; d < 5; d++) put(x, WINDOW.y + WINDOW.h + d, mixc([90, 80, 100], [40, 34, 50], d / 5));
  if (flash) glow(WINDOW.x + 38, WINDOW.y + 50, 40, [120, 120, 150], 0.5);
  // ---- shelves of glowing flasks on the left
  for (let x = 6; x < 120; x++) for (let d = 0; d < 4; d++) put(x, 72 + d, mixc([110, 70, 40], [50, 30, 16], d / 4));
  const flasks: [number, RGB][] = [
    [16, [90, 255, 120]],
    [36, [120, 180, 255]],
    [56, [255, 120, 200]],
    [78, [90, 255, 120]],
    [100, [255, 220, 90]],
  ];
  flasks.forEach(([fx, col], i) => {
    for (let y = 46; y < 72; y++) {
      const w = y < 56 ? 2.5 : 2.5 + (y - 56) * 0.5;
      for (let x = -w; x <= w; x++)
        put(fx + x, y, y > 58 ? mixc(col, [20, 20, 30], 0.2 + 0.2 * Math.sin((x + y + k * 2 + i) / 2)) : [170, 200, 220], y > 58 ? 1 : 0.5);
    }
    glow(fx, 64, 8, col, 0.25);
    for (let b = 0; b < 3; b++) put(fx + ((b * 2 + k) % 5) - 2, 44 - ((k * 3 + b * 5 + i) % 12), mixc(col, [255, 255, 255], 0.4));
  });
  // ---- Doc Leo, behind the bench, laughing
  stamp(put, cast.leo(k % 2 ? 'laugh1' : 'laugh0'), cast.pal, 52, 52 + (k % 2), 3);
  // ---- the Tesla coil on the right, crackling
  for (let y = COIL.y; y < BENCH; y++) for (let x = -5; x <= 5; x++) put(COIL.x + x, y, (y + k) % 6 < 3 ? [200, 130, 60] : [120, 70, 30]);
  for (let y = -8; y <= 8; y++)
    for (let x = -14; x <= 14; x++)
      if ((x / 14) ** 2 + (y / 8) ** 2 <= 1) put(COIL.x + x, COIL.y + y, mixc([120, 130, 150], [240, 245, 255], 0.5 - y / 16 + x / 40));
  glow(COIL.x, COIL.y, 14, [80, 120, 255], 0.5);
  const arcs = rng(k * 13 + 1);
  for (let a = 0; a < 4; a++) {
    let x = COIL.x;
    let y = COIL.y;
    const dir = arcs() * Math.PI * 2;
    for (let s = 0; s < 10; s++) {
      const nx = x + Math.cos(dir) * 5 + (arcs() - 0.5) * 6;
      const ny = y + Math.sin(dir) * 5 + (arcs() - 0.5) * 6;
      for (let q = 0; q <= 5; q++) put(x + (nx - x) * (q / 5), y + (ny - y) * (q / 5), [220, 235, 255]);
      x = nx;
      y = ny;
    }
  }
  // ---- the bench: a thick wooden top, its front in shadow
  for (let y = BENCH; y < H; y++)
    for (let x = 0; x < W; x++) {
      const grain = fbm(x / 30, y / 2);
      const c = y < BENCH + 6 ? mixc([170, 110, 60], [220, 160, 100], grain) : mixc([70, 40, 24], [110, 66, 36], grain * 0.8 - (y - BENCH) / 120);
      put(x, y, c);
    }
  // ---- the bat detector: a box with a dial, the needle swinging from 22 up to 50
  for (let y = METER.y; y < BENCH; y++) for (let x = METER.x - 26; x < METER.x + 26; x++) put(x, y, y === METER.y ? [150, 160, 170] : [70, 76, 90]);
  for (let a = Math.PI; a <= Math.PI * 2; a += 0.02)
    for (let r = 12; r < 18; r++) put(METER.x + Math.cos(a) * r, METER.y + 30 + Math.sin(a) * r, a < Math.PI * 1.5 ? [90, 140, 255] : [255, 90, 90]);
  for (let y = METER.y + 8; y < METER.y + 32; y++)
    for (let x = METER.x - 20; x < METER.x + 20; x++) if (Math.hypot(x - METER.x, y - METER.y - 30) < 12) put(x, y, [230, 225, 200]);
  const needle = Math.PI * (1.15 + 0.7 * Math.min(1, t * 1.4));
  for (let r = 0; r < 17; r++) put(METER.x + Math.cos(needle) * r, METER.y + 30 + Math.sin(needle) * r, [20, 20, 20]);
  glow(METER.x + 18, METER.y + 6, 3, t > 0.6 ? [255, 60, 60] : [60, 120, 255], 0.8);
  // ---- the rats on the bench: the tickled one giggling, more on their way
  const rat = (name: string, x: number, y: number, s: number, flip = false) => stamp(put, cast.mons.get(name)!, cast.pal, x, y, s, flip);
  rat(k % 2 ? 'lab.giggle1' : 'lab.giggle0', 132, BENCH - 54, 3);
  rat(k % 3 === 0 ? 'lab.pinned1' : 'lab.pinned0', 14, BENCH - 30, 2);
  rat(k % 2 ? 'wild.off1' : 'wild.off0', 182 - Math.round(t * 14), BENCH - 40, 2, true);
  rat('lab.rat0', 214 - Math.round(t * 20), BENCH - 38, 2, true);
  // chirps at 50 kHz from the giggling rat
  for (let c = 0; c < 4; c++) {
    const cx = 196 + c * 6 + (k % 2) * 2;
    const cy = 92 - c * 5 - (k % 3);
    for (let s = 0; s < 4; s++) put(cx + s, cy - s, [255, 230, 120], 0.9);
  }
  // ---- a vignette
  const out = new Uint8Array(W * H * 3);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const v = 1 - 0.4 * (((x - 160) / 200) ** 2 + ((y - 100) / 140) ** 2);
      for (let j = 0; j < 3; j++) out[(y * W + x) * 3 + j] = clamp(img[(y * W + x) * 3 + j] * v);
    }
  return out;
}

type Put = (x: number, y: number, c: RGB, a?: number) => void;

/** A sprite (indexed, 255 clear) stamped at (x, y), `s` times its size, in its palette's colors. */
function stamp(put: Put, p: Pixels, pal: Uint8Array, x: number, y: number, s: number, flip = false): void {
  for (let yy = 0; yy < p.h; yy++)
    for (let xx = 0; xx < p.w; xx++) {
      const v = p.get(flip ? p.w - 1 - xx : xx, yy);
      if (v === 255) continue;
      const c: RGB = [pal[v * 3] * 4.05, pal[v * 3 + 1] * 4.05, pal[v * 3 + 2] * 4.05];
      for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) put(x + xx * s + dx, y + yy * s + dy, c);
    }
}
