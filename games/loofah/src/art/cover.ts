// The title and cover art, drawn for the game (no cover came with the song): a gothic bathroom by
// candlelight, black-and-teal tile, a pointed window with the moon in it, and on a polished
// silver rack the loofah of Lucifer, a goofy golden sponge hanging by its cord (the bath monster of its
// sprites): googly eyes looking two ways, a wide smile with a tongue, a fuzzy rim. Steam rises through the candlelight; a mirror's fog drips.
// Painted in true color, a pixel at a time, then reduced to one 256-color palette for the FLI
// (cartoons.ts). `t` (0..1) animates it: the steam drifts up, the candles flicker, the loofah
// sways on its hook, a glint runs along the rack, and its googly eyes look left and right.
import { smooth, noise2 } from '@lewismoten/gamemaker-sandbox-tools/kit/coverPaint';

const COVER_W = 320;
const COVER_H = 200;

type RGB = [number, number, number];

const N1 = noise2(23);
const N2 = noise2(41);
/** Fractal noise: three octaves. */
const fbm = (x: number, y: number) => N1(x, y) * 0.55 + N1(x * 2.1 + 7, y * 2.1) * 0.3 + N2(x * 4.3, y * 4.3 + 3) * 0.15;

/** The rack, the hook, the loofah. */
const RACK = { x0: 96, x1: 224, y: 92 };
const HOOK = { x: 160, y: 98 };
const SPONGE = { rx: 30, ry: 36, drop: 46 };
/** Candles: [x, top y, height]. */
const CANDLES: [number, number, number][] = [
  [28, 150, 30],
  [44, 158, 22],
  [60, 146, 34],
  [262, 152, 28],
  [282, 160, 20],
];

/** One frame of the cover as RGB bytes (320x200x3). */
export function coverRgb(t: number): Uint8Array {
  const W = COVER_W;
  const H = COVER_H;
  const img = new Float32Array(W * H * 3);
  const put = (x: number, y: number, c: RGB, a = 1) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
    const i = (y * W + x) * 3;
    for (let k = 0; k < 3; k++) img[i + k] = img[i + k] * (1 - a) + c[k] * a;
  };
  const add = (x: number, y: number, c: RGB, a: number) => {
    if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
    const i = (y * W + x) * 3;
    for (let k = 0; k < 3; k++) img[i + k] = Math.min(255, img[i + k] + c[k] * a);
  };
  const flick = (k: number) => 0.85 + 0.15 * Math.sin(t * 23 + k * 2.1) * Math.sin(t * 9 + k);
  /** Candlelight at a point: warm, falling off with distance from every flame. */
  const warm = (x: number, y: number) => CANDLES.reduce((s, [cx, cy], k) => s + flick(k) * Math.exp(-Math.hypot(x - cx, (y - cy + 6) * 1.1) / 46), 0);
  const lit = (c: RGB, x: number, y: number, moon = 0): RGB => {
    const w = Math.min(1.4, warm(x, y));
    return [c[0] * (0.28 + w * 0.9) + w * 40 + moon * 20, c[1] * (0.26 + w * 0.6) + w * 14 + moon * 26, c[2] * (0.36 + w * 0.35) + moon * 46];
  };

  // ---- the wall: black and teal tile, the moonlight from the window falling across it
  for (let y = 0; y < 168; y++)
    for (let x = 0; x < W; x++) {
      const grout = x % 18 === 0 || y % 18 === 0;
      const check = (Math.floor(x / 18) + Math.floor(y / 18)) % 2;
      const base: RGB = grout ? [8, 8, 12] : check ? [22, 52, 58] : [12, 18, 24];
      const shine = grout ? 0 : smooth(0.6, 1, N2(x / 9, y / 9)) * 10;
      const moon = Math.max(0, 1 - Math.hypot(x - 64, y - 54) / 90) * 0.5;
      put(x, y, lit([base[0] + shine, base[1] + shine, base[2] + shine], x, y, moon));
    }
  // a band of gothic trim under the ceiling
  for (let y = 0; y < 8; y++) for (let x = 0; x < W; x++) put(x, y, lit(y === 7 ? [120, 90, 40] : [40, 20, 46], x, y));
  for (let x = 6; x < W; x += 14) for (let y = 8; y < 12; y++) put(x, y, lit([120, 90, 40], x, y));

  // ---- the window: a pointed arch, the moon behind frosted glass
  const win = { cx: 64, top: 22, w: 26, h: 64 };
  for (let y = win.top - 4; y < win.top + win.h + 4; y++)
    for (let x = win.cx - win.w - 4; x <= win.cx + win.w + 4; x++) {
      const dy = y - win.top;
      const dx = Math.abs(x - win.cx);
      // the arch: two circles meeting in a point
      const inArch = (pad: number) =>
        dy > win.w ? dx <= win.w + pad && dy < win.h + pad : Math.hypot(dx + win.w * 0.6, dy - win.w) <= win.w * 1.6 + pad && dy >= -pad;
      if (!inArch(4)) continue;
      if (!inArch(0)) {
        put(x, y, lit([60, 44, 60], x, y));
        continue;
      }
      const moon = Math.hypot(x - 74, y - 44) < 13 ? 1 : Math.exp(-Math.hypot(x - 74, y - 44) / 18) * 0.6;
      const frost = fbm(x / 6, y / 6);
      let c: RGB = [20 + moon * 200 + frost * 30, 24 + moon * 200 + frost * 36, 50 + moon * 190 + frost * 50];
      if (dx === 0 || (dy > 12 && (dy - 12) % 18 === 0)) c = [40, 30, 44];
      put(x, y, c);
    }

  // ---- the mirror on the right: fogged, the fog dripping
  const mir = { x0: 236, x1: 300, y0: 30, y1: 104 };
  for (let y = mir.y0 - 4; y < mir.y1 + 4; y++)
    for (let x = mir.x0 - 4; x < mir.x1 + 4; x++) {
      if (x < mir.x0 || x >= mir.x1 || y < mir.y0 || y >= mir.y1) {
        put(x, y, lit([130, 96, 40], x, y));
        continue;
      }
      const fog = fbm(x / 10, y / 10 - t * 0.4);
      const drip = (x * 7) % 11 === 0 && y > mir.y0 + 30 + ((x * 13) % 30) ? 0.5 : 0;
      put(x, y, lit([90 + fog * 80 - drip * 60, 100 + fog * 80 - drip * 60, 110 + fog * 80 - drip * 50], x, y, 0.2));
    }

  // ---- the floor: black and white tile, in perspective, reflecting the candles
  for (let y = 168; y < H; y++)
    for (let x = 0; x < W; x++) {
      const d = (y - 166) / 34;
      const u = Math.floor((x - 160) / (14 + d * 20) + 100);
      const v = Math.floor((y - 168) / (4 + d * 6));
      const c: RGB = (u + v) % 2 ? [190, 186, 180] : [16, 14, 20];
      put(x, y, lit(c, x, y));
    }

  // ---- the silver rack: a chrome bar on two brackets, a glint running along it
  const glint = RACK.x0 + (RACK.x1 - RACK.x0) * ((t * 1.3) % 1);
  for (let x = RACK.x0; x <= RACK.x1; x++)
    for (let y = RACK.y - 3; y <= RACK.y + 3; y++) {
      const k = (y - RACK.y + 3) / 6;
      const chrome = 120 + Math.cos(k * Math.PI) * 90 + Math.exp(-((x - glint) ** 2) / 30) * 120;
      put(x, y, [chrome, chrome * 1.02, chrome * 1.08]);
    }
  for (const bx of [RACK.x0 + 4, RACK.x1 - 4])
    for (let y = RACK.y - 14; y < RACK.y + 3; y++)
      for (let x = bx - 3; x <= bx + 3; x++) put(x, y, [150 - Math.abs(x - bx) * 20, 152 - Math.abs(x - bx) * 20, 160 - Math.abs(x - bx) * 18]);
  // the hook
  for (let a = 0; a < Math.PI * 1.4; a += 0.05) put(HOOK.x + Math.sin(a) * 5, HOOK.y + 4 - Math.cos(a) * 5, [210, 214, 224]);

  // ---- the loofah of Lucifer, swaying on its cord
  const sway = Math.sin(t * Math.PI * 2) * 0.06;
  const sx = HOOK.x + Math.sin(sway) * SPONGE.drop;
  const sy = HOOK.y + Math.cos(sway) * SPONGE.drop + 6;
  // the cord
  for (let k = 0; k <= 30; k++) {
    const u = k / 30;
    put(HOOK.x + (sx - HOOK.x) * u + Math.sin(u * Math.PI) * 3, HOOK.y + 8 + (sy - SPONGE.ry - HOOK.y - 6) * u, [230, 210, 170]);
  }
  for (let y = Math.floor(sy - SPONGE.ry - 10); y <= sy + SPONGE.ry + 2; y++)
    for (let x = Math.floor(sx - SPONGE.rx - 4); x <= sx + SPONGE.rx + 4; x++) {
      const dx = (x - sx) / SPONGE.rx;
      const dy = (y - sy) / SPONGE.ry;
      const r = dx * dx + dy * dy;
      if (r > 1) continue;
      // a net of mesh: ridges where the noise crosses a band
      const m = fbm(x / 9 + 9, y / 9) * 4;
      const ridge = Math.min(Math.abs(Math.sin((x - sx) * 0.42 + m)), Math.abs(Math.sin((y - sy) * 0.36 - m * 0.8 + (x - sx) * 0.12))) < 0.22 ? 1 : 0;
      const shade = Math.sqrt(1 - r) * (0.75 + 0.35 * (-dx * 0.5 - dy * 0.6));
      const coral: RGB = ridge ? [180 * shade + 30, 100 * shade + 10, 10 * shade + 8] : [255 * shade + 20, 205 * shade + 14, 72 * shade + 10];
      const w = Math.min(1.2, warm(x, y));
      put(x, y, [coral[0] * (0.95 + w * 0.2), coral[1] * (0.95 + w * 0.15), coral[2] * (0.95 + w * 0.1)]);
      // candlelight warms its edge
      add(x, y, [255, 140, 60], (1 - Math.sqrt(1 - r)) * 0.25 * warm(x, y));
    }
  // the face, as in its sprites: goofy googly eyes looking two ways, a wide wobbly smile with a tongue
  const look = Math.round(Math.sin(t * Math.PI * 2) * 2);
  for (const side of [-1, 1]) {
    const ex = sx + side * 10;
    const ey = sy - 7;
    for (let y = -6; y <= 6; y++)
      for (let x = -7; x <= 7; x++) {
        const e = (x / 7) ** 2 + (y / 6) ** 2;
        if (e > 1) continue;
        put(ex + x, ey + y, e > 0.72 ? [60, 40, 20] : [255, 252, 240]);
      }
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 9) put(ex + x - side * look, ey + y + 1, [30, 20, 16]);
    put(ex - side * look - 1, ey - 1, [255, 255, 255]);
  }
  // the smile: up at both corners, and a pink tongue
  for (let x = -15; x <= 15; x++) {
    const y = sy + 15 - Math.round(x * x * 0.03);
    put(sx + x, y, [60, 24, 16]);
    put(sx + x, y + 1, [60, 24, 16]);
  }
  for (let y = 0; y < 5; y++) for (let x = -4; x <= 4; x++) if ((x / 4) ** 2 + (y / 5) ** 2 <= 1) put(sx + 3 + x, sy + 17 + y, [240, 90, 110]);
  for (const side of [-1, 1]) for (let y = -2; y <= 2; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 6) add(sx + side * 21 + x, sy + 8 + y, [255, 120, 120], 0.35);

  // ---- candles on the shelves, their flames, their glow
  for (const [x0, x1, y] of [
    [18, 72, 180],
    [252, 296, 180],
  ])
    for (let x = x0; x <= x1; x++) for (let yy = y; yy < y + 4; yy++) put(x, yy, lit(yy === y ? [140, 100, 70] : [80, 50, 30], x, yy));
  CANDLES.forEach(([cx, top, h], k) => {
    for (let y = top; y < top + h; y++)
      for (let x = cx - 4; x <= cx + 4; x++) put(x, y, lit([220 - Math.abs(x - cx) * 10, 200 - Math.abs(x - cx) * 12, 170 - Math.abs(x - cx) * 12], x, y));
    // wax running down
    for (let y = top; y < top + 6; y++) put(cx - 3, y, [250, 240, 210]);
    const f = flick(k);
    for (let y = -12; y < 0; y++)
      for (let x = -4; x <= 4; x++) {
        const w = 3.2 * Math.sin(((y + 12) / 12) * Math.PI * 0.9) * f;
        if (Math.abs(x - Math.sin(t * 20 + k + y * 0.3) * 0.8) > w) continue;
        const core = 1 - Math.abs(x) / Math.max(1, w);
        put(cx + x, top + y, [255, 180 + core * 70, 60 + core * 150]);
      }
    for (let y = -40; y < 30; y++) for (let x = -40; x < 40; x++) add(cx + x, top - 6 + y, [255, 150, 60], 0.18 * f * Math.exp(-Math.hypot(x, y) / 12));
  });

  // ---- steam rising through it all
  for (let y = 40; y < 190; y++)
    for (let x = 0; x < W; x++) {
      const s = fbm(x / 26, y / 18 + t * 1.6) - 0.45 + (y > 120 ? (y - 120) / 260 : 0);
      if (s <= 0) continue;
      const near = Math.hypot((x - sx) / SPONGE.rx, (y - sy) / SPONGE.ry) < 1.1 ? 0.35 : 1;
      const a = Math.min(0.45, s * 1.4) * near;
      const i = (y * W + x) * 3;
      const w = Math.min(1, warm(x, y));
      for (let k = 0; k < 3; k++) img[i + k] = img[i + k] * (1 - a) + [210 + w * 40, 200 + w * 20, 214 - w * 20][k] * a * (0.55 + 0.4 * w);
    }

  const out = new Uint8Array(W * H * 3);
  for (let i = 0; i < out.length; i++) out[i] = Math.max(0, Math.min(255, Math.round(img[i])));
  return out;
}
