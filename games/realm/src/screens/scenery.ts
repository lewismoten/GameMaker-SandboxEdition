// Painting the big pictures: skies, layered hills going blue with distance, stars, the Round
// Tuit glowing like a second sun, castles and towns against the light.
import { Canvas, type RGB, mix, clamp01, tnoise, smooth } from '../art/rgb';
import { rng } from '../../../kit/pixels';
import { FONT8X8 } from '../../../../web/src/gfx/font8x8';

export function sky(cv: Canvas, stops: [number, RGB][]): void {
  cv.shade((_x, y) => {
    const t = y / cv.h;
    for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) return mix(stops[i - 1][1], stops[i][1], smooth(stops[i - 1][0], stops[i][0], t));
    return stops[stops.length - 1][1];
  });
}

export function stars(cv: Canvas, n: number, maxY: number, seed = 1): void {
  const r = rng(seed);
  for (let k = 0; k < n; k++) {
    const x = r() * cv.w;
    const y = r() * maxY;
    const b = 0.3 + r() * 0.7;
    cv.blend(Math.floor(x), Math.floor(y), [255, 250, 230], b * (1 - y / maxY));
    if (b > 0.93) {
      cv.blend(Math.floor(x) + 1, Math.floor(y), [255, 250, 230], 0.4);
      cv.blend(Math.floor(x) - 1, Math.floor(y), [255, 250, 230], 0.4);
      cv.blend(Math.floor(x), Math.floor(y) + 1, [255, 250, 230], 0.4);
      cv.blend(Math.floor(x), Math.floor(y) - 1, [255, 250, 230], 0.4);
    }
  }
}

/** A ridge of hills: its top a sum of waves and noise; lit from `light` (x) a little. */
export function hills(cv: Canvas, base: number, amp: number, col: RGB, seed: number, rim?: RGB, freq = 1): (x: number) => number {
  const top = (x: number) =>
    base -
    amp *
      (0.55 * Math.sin((x / cv.w) * Math.PI * 2 * freq + seed) +
        0.3 * Math.sin((x / cv.w) * Math.PI * 5.3 * freq + seed * 2) +
        0.15 * (tnoise(x, seed * 7, 20, 640, seed) * 2 - 1));
  cv.shade((x, y) => {
    const t = top(x);
    if (y < t) return undefined;
    const d = y - t;
    let c = mix(col, mix(col, [0, 0, 0], 0.3), clamp01(d / 60));
    if (rim && d < 1.5) c = mix(c, rim, 0.6);
    return c;
  }, 2);
  return top;
}

/** The Round Tuit: an oak disc ringed in brass, TUIT carved round it, glowing. */
export function tuit(cv: Canvas, cx: number, cy: number, r: number, glow = 1, broken = 0): void {
  if (glow > 0)
    cv.shade((x, y) => {
      const d = Math.hypot(x - cx, y - cy) / r;
      if (d > 3.2) return undefined;
      const k = glow * clamp01(1.1 - d / 3.2) ** 2;
      return mix(cv.get(Math.max(0, Math.min(cv.w - 1, Math.floor(x))), Math.max(0, Math.min(cv.h - 1, Math.floor(y)))), [255, 230, 150], k * 0.8);
    });
  const wedge = (k: number, off: number) => {
    const a0 = -Math.PI / 2 + (k * Math.PI * 2) / 3;
    const ox = Math.cos(a0 + Math.PI / 3) * off;
    const oy = Math.sin(a0 + Math.PI / 3) * off;
    const inside = (x: number, y: number) => {
      const dx = x - cx - ox;
      const dy = y - cy - oy;
      let a = Math.atan2(dy, dx) - a0;
      while (a < 0) a += Math.PI * 2;
      while (a >= Math.PI * 2) a -= Math.PI * 2;
      return a <= (Math.PI * 2) / 3 + 0.001 ? Math.hypot(dx, dy) - r : 9;
    };
    cv.fillSdf(inside, (x, y) => {
      const dx = x - cx - ox;
      const dy = y - cy - oy;
      const d = Math.hypot(dx, dy) / r;
      // brass rim, oak grain in rings, light from the top left
      if (d > 0.86) return mix([250, 210, 110], [160, 110, 40], clamp01((dx + dy) / (r * 2) + 0.5));
      const ring = Math.sin(d * 26 + tnoise(x, y, 5, 640, 3) * 3) * 0.5 + 0.5;
      const base = mix([196, 136, 70], [140, 90, 44], ring * 0.5 + clamp01((dx + dy) / (r * 2) + 0.3) * 0.5);
      return base;
    });
  };
  for (let k = 0; k < 3; k++) wedge(k, broken * r);
  if (!broken) {
    // the letters, carved round the face
    const word = 'TUIT';
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + ((i - 1.5) * Math.PI) / 5.5;
      const lx = cx + Math.cos(a) * r * 0.58;
      const ly = cy + Math.sin(a) * r * 0.58;
      const s = Math.max(1, r / 22);
      const base = word.charCodeAt(i) * 8;
      for (let row = 0; row < 8; row++)
        for (let b = 0; b < 8; b++) if ((FONT8X8[base + row] >> b) & 1) cv.rect(lx - 4 * s + b * s, ly - 4 * s + row * s, s, s, [90, 54, 24]);
    }
    cv.disc(cx, cy, r * 0.16, [120, 80, 36]);
    cv.disc(cx - r * 0.04, cy - r * 0.04, r * 0.1, [220, 170, 90]);
  }
}

/** A castle in silhouette against the light, with lit windows. */
export function castle(cv: Canvas, x: number, base: number, s: number, col: RGB, lit: RGB): void {
  const tower = (tx: number, w: number, h: number, cone: boolean) => {
    cv.rect(tx, base - h, w, h, col);
    if (cone)
      cv.poly(
        [
          [tx - w * 0.15, base - h],
          [tx + w / 2, base - h - w * 1.3],
          [tx + w * 1.15, base - h],
        ],
        col,
      );
    else for (let k = 0; k < w; k += w / 3) cv.rect(tx + k, base - h - w * 0.25, w / 6, w * 0.25, col);
    cv.rect(tx + w * 0.4, base - h * 0.7, w * 0.2, w * 0.3, lit);
  };
  cv.rect(x, base - 26 * s, 90 * s, 26 * s, col);
  for (let k = 0; k < 90 * s; k += 6 * s) cv.rect(x + k, base - 30 * s, 3 * s, 4 * s, col);
  tower(x - 6 * s, 14 * s, 44 * s, true);
  tower(x + 82 * s, 14 * s, 44 * s, true);
  tower(x + 30 * s, 26 * s, 62 * s, true);
  tower(x + 16 * s, 10 * s, 36 * s, false);
  tower(x + 64 * s, 10 * s, 36 * s, false);
  for (const wx of [10, 24, 62, 74]) cv.rect(x + wx * s, base - 16 * s, 2.5 * s, 4 * s, lit);
  cv.rrect(x + 39 * s, base - 14 * s, 8 * s, 14 * s, 3 * s, mix(col, [0, 0, 0], 0.5));
}

/** A pennant on a pole. */
export function pennant(cv: Canvas, x: number, y: number, len: number, col: RGB, wave = 0): void {
  cv.line(x, y, x, y + len * 1.6, 0.8, [60, 50, 40]);
  cv.poly(
    [
      [x, y],
      [x + len, y + len * 0.2 + Math.sin(wave) * 1.5],
      [x, y + len * 0.45],
    ],
    col,
  );
}
