// The title and cover art, drawn for the game (no cover came with the song): a humble crusty loaf
// in a wicker basket on the hillside by the Sea of Galilee in the warm light of evening, the
// twelve baskets, full, along the grass behind it, the sun low over the water with rays through
// the haze. Painted in true color, a pixel at a time, then
// reduced to one 256-color palette for the FLI (cartoons.ts). `t` (0..1) animates it: the light
// warms and the rays turn, the loaf rises a little and steams, a glint runs over its crust.
import { rng } from '../../../kit/pixels';

export const COVER_W = 320;
export const COVER_H = 200;

type RGB = [number, number, number];

const mixc = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (v: number) => Math.max(0, Math.min(255, v));
const smooth = (e0: number, e1: number, x: number) => {
  const u = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return u * u * (3 - 2 * u);
};

/** A sky gradient through stops [y, color]. */
function stops(y: number, s: [number, RGB][]): RGB {
  for (let i = 1; i < s.length; i++) if (y <= s[i][0]) return mixc(s[i - 1][1], s[i][1], (y - s[i - 1][0]) / (s[i][0] - s[i - 1][0]));
  return s[s.length - 1][1];
}

/** Value noise (smooth, seeded) for textures. */
function noise2(seed: number) {
  const r = rng(seed);
  const g = Array.from({ length: 64 * 64 }, () => r());
  const at = (x: number, y: number) => g[(((y % 64) + 64) % 64) * 64 + (((x % 64) + 64) % 64)];
  return (x: number, y: number) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * fx;
    const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * fx;
    return a + (b - a) * fy;
  };
}

const N1 = noise2(11);
const N2 = noise2(23);
const fbm = (x: number, y: number) => N1(x, y) * 0.6 + N2(x * 2.1, y * 2.1) * 0.3 + N1(x * 4.3 + 7, y * 4.3) * 0.1;

/** The sun, low over the water on the right. */
const SUN = { x: 252, y: 86, r: 13 };
const HORIZON = 98;
/** The hillside's top edge. */
const hill = (x: number) => 112 + ((x - 170) / 170) ** 2 * 14 + Math.sin(x / 23) * 1.5;

/** The twelve baskets on the hillside: x, y of the rim, half width (far ones smaller). */
export const BASKETS: [number, number, number][] = [
  [22, 121, 6],
  [44, 118, 6],
  [66, 116, 7],
  [90, 115, 7],
  [212, 116, 7],
  [236, 118, 8],
  [262, 121, 9],
  [290, 126, 10],
  [16, 140, 10],
  [50, 136, 9],
  [272, 146, 12],
  [306, 150, 12],
];

/** One frame of the cover as RGB bytes (320x200x3). */
export function coverRgb(t: number): Uint8Array {
  const W = COVER_W;
  const H = COVER_H;
  const img = new Float32Array(W * H * 3);
  const put = (x: number, y: number, c: RGB, a = 1) => {
    if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
    const i = (y * W + x) * 3;
    for (let k = 0; k < 3; k++) img[i + k] = img[i + k] * (1 - a) + c[k] * a;
  };
  const warm = 0.75 + t * 0.25;
  // ---- the sky: deep blue overhead to rose, to gold at the water
  for (let y = 0; y < HORIZON; y++)
    for (let x = 0; x < W; x++) {
      let c = stops(y + (1 - warm) * 10, [
        [0, [34, 36, 92]],
        [36, [96, 64, 120]],
        [64, [214, 112, 108]],
        [86, [255, 176, 96]],
        [HORIZON, [255, 222, 150]],
      ]);
      // clouds: soft streaks lit from below
      const cl = smooth(0.55, 0.8, fbm(x / 40, y / 9 + 3)) * smooth(10, 30, y) * (1 - smooth(70, 90, y));
      c = mixc(c, mixc([200, 120, 140], [255, 200, 150], y / 90), cl * 0.7);
      // the sun and its glow
      const d = Math.hypot(x - SUN.x, (y - SUN.y) * 1.1);
      const glow = Math.exp(-d / 46) * 0.8 + Math.exp(-d / 14) * 0.6;
      c = mixc(c, [255, 236, 180], Math.min(1, glow * warm));
      if (d < SUN.r) c = [255, 248, 220];
      put(x, y, c);
    }
  // ---- the far hills across the sea
  for (let x = 0; x < W; x++) {
    const top = HORIZON - 8 - Math.sin(x / 41) * 5 - Math.sin(x / 13 + 1) * 2 - (x < 120 ? 4 : 0);
    for (let y = Math.floor(top); y < HORIZON; y++) {
      const haze = smooth(0, 1, (x - 140) / 180) * 0.5;
      put(x, y, mixc(mixc([92, 64, 110], [130, 84, 120], (y - top) / 12), [255, 190, 140], haze));
    }
  }
  // ---- the Sea of Galilee, with the sun's road on it
  for (let y = HORIZON; y < 134; y++)
    for (let x = 0; x < W; x++) {
      const depth = (y - HORIZON) / 18;
      let c = mixc([120, 120, 170], [60, 90, 150], depth);
      const road = Math.exp(-(((x - SUN.x) / (10 + depth * 30)) ** 2));
      const wave = N2(x / 3 + t * 6, y * 1.7) > 0.62 ? 1 : 0;
      c = mixc(c, [255, 230, 170], road * (0.3 + wave * 0.6));
      if (wave && road < 0.2 && (x + y) % 3 === 0) c = mixc(c, [180, 190, 220], 0.4);
      put(x, y, c);
    }
  // ---- the hillside: grass in the evening light
  for (let x = 0; x < W; x++)
    for (let y = Math.floor(hill(x)); y < H; y++) {
      const depth = (y - hill(x)) / 90;
      const n = fbm(x / 6, y / 3);
      let c = mixc([150, 160, 64], [44, 76, 36], Math.min(1, depth * 1.4));
      c = mixc(c, [255, 200, 120], Math.max(0, 0.35 - depth) * (0.6 + 0.4 * Math.sin(x / 50)));
      c = mixc(c, [30, 50, 24], n > 0.6 ? 0.3 : 0);
      if (y - hill(x) < 1.5) c = [200, 200, 110];
      put(x, y, c);
    }
  // blades and lilies of the field
  const r = rng(77);
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(r() * W);
    const y = Math.floor(hill(x) + 2 + r() * (H - hill(x)));
    const h = 2 + Math.floor((y - 110) / 18);
    for (let k = 0; k < h; k++) put(x + (k > h / 2 ? 1 : 0), y - k, [70 + r() * 60, 110 + r() * 50, 40], 0.8);
    if (r() < 0.1) put(x, y - h, r() < 0.5 ? [255, 250, 240] : [190, 140, 210]);
  }
  // ---- the twelve baskets on the hillside
  for (const [bx, by, bw] of BASKETS) basket(put, bx, by, bw, bw * 0.9, true, t);
  // ---- the rays: through the haze from the sun
  for (let y = 0; y < 150; y++)
    for (let x = 0; x < W; x++) {
      const a = Math.atan2(y - SUN.y, x - SUN.x);
      const beam = Math.max(0, Math.sin(a * 22 + t * 2.4) * Math.sin(a * 9 - t * 1.1));
      const d = Math.hypot(x - SUN.x, y - SUN.y);
      const s = beam * Math.exp(-d / 220) * 0.18 * warm * smooth(SUN.r, SUN.r + 20, d);
      if (s > 0.01) {
        const i = (y * W + x) * 3;
        img[i] += 255 * s;
        img[i + 1] += 220 * s;
        img[i + 2] += 150 * s;
      }
    }
  // ---- the loaf's own basket in front, and Loaf #13 in it
  const cx = 150;
  basketBack(put, cx, 150, 74, 13);
  loaf(put, cx, 129 - t * 3, 44 + t * 1.5, 30 + t * 3, t);
  basket(put, cx, 150, 74, 50, false, t, true);
  // crumbs on the rim
  for (const [x, y] of [[96, 149], [104, 151], [198, 150], [206, 148]]) for (let k = 0; k < 4; k++) put(x + (k % 2), y + (k >> 1), k ? [240, 210, 150] : [180, 110, 50]);
  // steam, rising
  for (let k = 0; k < 3; k++)
    for (let s = 0; s < 22; s++) {
      const x = Math.round(cx - 18 + k * 18 + Math.sin(s / 3 + k + t * 6) * 3);
      const y = Math.round(84 - t * 6 - s * 1.4 - k * 2);
      put(x, y, [255, 250, 240], 0.25 * (1 - s / 22) * (0.4 + t));
    }
  // ---- a vignette
  const out = new Uint8Array(W * H * 3);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const v = 1 - 0.35 * (((x - 160) / 200) ** 2 + ((y - 100) / 140) ** 2);
      for (let k = 0; k < 3; k++) out[(y * W + x) * 3 + k] = clamp(img[(y * W + x) * 3 + k] * v);
    }
  return out;
}

type Put = (x: number, y: number, c: RGB, a?: number) => void;

/** A wicker basket: its rim an ellipse at (cx, top) `rw` wide each side, `h` tall, woven, lit from the right; full of loaves or not. */
function basket(put: Put, cx: number, top: number, rw: number, h: number, full: boolean, t: number, backless = false): void {
  const rh = Math.max(2, rw * 0.22);
  // the shadow on the grass
  for (let y = 0; y < rh * 1.4; y++) for (let x = -rw * 1.3; x < rw * 1.3; x++) if ((x / (rw * 1.3)) ** 2 + (y / (rh * 1.4)) ** 2 < 1) put(Math.round(cx + x - rw * 0.3), Math.round(top + h + y - rh * 0.4), [30, 40, 20], 0.35);
  for (let y = 0; y < h; y++) {
    const u = y / h;
    const w = rw * (1 - u * 0.2) - (u > 0.85 ? (u - 0.85) * rw * 1.2 : 0);
    for (let x = -Math.floor(w); x <= w; x++) {
      const nx = x / w;
      const lit = 0.55 + nx * 0.35 - u * 0.2;
      // the weave: over-under rows of reed, ribs going down
      const row = Math.floor((y + rh * (1 - nx * nx) * 0.8) / Math.max(2, rw / 9));
      const over = (Math.floor((x + row * 3) / Math.max(2, rw / 6)) + row) % 2;
      const rib = Math.abs(((x + rw) % Math.max(4, rw / 4)) - 1) < 1;
      let c: RGB = over ? [226, 178, 96] : [176, 124, 58];
      if (rib) c = [120, 80, 36];
      c = mixc([60, 36, 16], c, Math.max(0.2, Math.min(1.2, lit)));
      c = mixc(c, [255, 200, 120], Math.max(0, nx) * 0.25 * (0.7 + t * 0.3));
      put(Math.round(cx + x), Math.round(top + y + rh * Math.sqrt(Math.max(0, 1 - nx * nx)) * 0.9), c);
    }
  }
  // the rim, a rolled band
  for (let a = 0; a < Math.PI * 2; a += 0.6 / rw)
    for (let k = 0; k < Math.max(1, rw / 14); k++) {
      const x = Math.round(cx + Math.cos(a) * rw);
      const y = Math.round(top + Math.sin(a) * rh + k);
      const front = Math.sin(a) > 0;
      if (!front && (full || backless)) continue;
      put(x, y, mixc([150, 100, 44], [250, 214, 140], 0.5 + Math.cos(a) * 0.4 + (front ? 0.1 : -0.2)));
    }
  if (full) {
    // loaves heaped in it
    for (let k = -1; k <= 1; k++) dome(put, cx + k * rw * 0.52, top + rh * 0.2, rw * 0.42, rw * 0.32);
    dome(put, cx - rw * 0.2, top - rw * 0.18, rw * 0.36, rw * 0.28);
  }
}

/** The dark inside of the front basket, behind the loaf. */
function basketBack(put: Put, cx: number, top: number, rw: number, rh: number): void {
  for (let y = -rh; y <= rh; y++)
    for (let x = -rw; x <= rw; x++) if ((x / rw) ** 2 + (y / rh) ** 2 <= 1) put(cx + x, top + y, mixc([40, 24, 12], [110, 70, 30], (y + rh) / (2 * rh)));
  // the back of the rim
  for (let a = Math.PI; a < Math.PI * 2; a += 0.4 / rw) for (let k = 0; k < 4; k++) put(Math.round(cx + Math.cos(a) * rw), Math.round(top + Math.sin(a) * rh) + k - 1, mixc([110, 70, 30], [230, 180, 100], 0.5 + Math.cos(a) * 0.4));
}

/** A small loaf in a far basket: a lit dome. */
function dome(put: Put, cx: number, cy: number, rx: number, ry: number): void {
  for (let y = -ry; y <= 0.4 * ry; y++)
    for (let x = -rx; x <= rx; x++) {
      const d = (x / rx) ** 2 + (y / ry) ** 2;
      if (d > 1) continue;
      const lit = 0.5 + (x / rx) * 0.35 - (y / ry) * 0.3;
      put(Math.round(cx + x), Math.round(cy + y), mixc([110, 50, 16], [250, 196, 110], Math.max(0, Math.min(1, lit))));
    }
}

/** Loaf #13: a round crusty boule with three score marks, floured, a gentle sleepy face, the sun on its right side. */
function loaf(put: Put, cx: number, cy: number, rx: number, ry: number, t: number): void {
  const flour = noise2(5);
  for (let y = Math.floor(-ry); y <= ry; y++)
    for (let x = Math.floor(-rx); x <= rx; x++) {
      const nx = x / rx;
      const ny = y / ry;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      const z = Math.sqrt(1 - d);
      // light from the upper right (the sun) and a warm fill from the left
      const lit = Math.max(0, 0.55 * z + 0.45 * nx - 0.35 * ny);
      let c = mixc([92, 40, 12], [214, 132, 52], Math.min(1, lit * 1.2));
      c = mixc(c, [255, 222, 150], Math.max(0, lit - 0.7) * 2);
      // the crust's blistered texture
      const n = fbm((x + 50) / 3, (y + 50) / 3);
      c = mixc(c, [70, 30, 8], n > 0.62 ? 0.35 : 0);
      // three score marks across the top: pale crumb with a dark lip
      for (const sx of [-0.45, 0, 0.45]) {
        const u = nx - sx - ny * 0.35;
        if (ny < -0.2 && ny > -0.95 && Math.abs(u) < 0.045) c = mixc([214, 160, 100], [246, 214, 160], z);
        else if (ny < -0.2 && ny > -0.95 && u > 0.045 && u < 0.09) c = mixc(c, [60, 26, 6], 0.6);
      }
      // flour dust on top
      if (ny < -0.2 && flour(x / 2 + 30, y / 2 + 30) > 0.7) c = mixc(c, [255, 246, 230], 0.6);
      // a rim of sunlight on the right edge
      if (d > 0.82 && nx > 0.2) c = mixc(c, [255, 210, 140], 0.6);
      // a glint running over the crust
      const g = Math.exp(-(((nx - (t * 2 - 1)) * 6) ** 2) - ((ny + 0.5) * 4) ** 2);
      c = mixc(c, [255, 255, 240], g * 0.8);
      put(Math.round(cx + x), Math.round(cy + y), c);
    }
  // the face: two closed, contented eyes and a small smile (it is still bread)
  const ink: RGB = [50, 20, 6];
  for (const ex of [-0.33, 0.3]) for (let k = -3; k <= 3; k++) put(Math.round(cx + ex * rx + k), Math.round(cy + 0.12 * ry + Math.abs(k) * 0.5 - 1), ink);
  for (let k = -5; k <= 5; k++) put(Math.round(cx + k), Math.round(cy + 0.42 * ry - Math.abs(k) * 0.35 + 1.5), ink);
  for (const ex of [-0.55, 0.52]) for (let k = 0; k < 6; k++) put(Math.round(cx + ex * rx + (k % 3)), Math.round(cy + 0.3 * ry + (k >> 1)), [235, 120, 90], 0.5);
}
