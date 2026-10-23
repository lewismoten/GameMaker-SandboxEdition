// The title art, drawn for the game (no cover came with the piece): a dark kitchen at 3:17 a.m.,
// the fridge standing open and pouring its cold glow across the floor, a slice of New York
// cheesecake on a porcelain plate on the top shelf, glowing gold like a cursed artifact, the
// microwave's clock reading 3:17, rain and lightning at the window, and the man in the doorway,
// shirtless and sweating, lit by the fridge, the back of his hand to his forehead. Painted in
// true color, a pixel at a time, then reduced to one 256-color palette for the FLI
// (cartoons.ts). `t` (0..1) animates it: the door swings wider and the glow grows, the aura
// turns and pulses, the clock's colon blinks, and lightning flashes once.
import { rng } from '../../../kit/pixels';

export const COVER_W = 320;
export const COVER_H = 200;

type RGB = [number, number, number];

const mixc = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const smooth = (e0: number, e1: number, x: number) => {
  const u = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return u * u * (3 - 2 * u);
};

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
const N1 = noise2(17);

/** The fridge: its body, and the inside (the glow). */
const FRIDGE = { x0: 178, x1: 262, y0: 26, y1: 172 };
const INSIDE = { x0: 184, x1: 256, y0: 32, y1: 166 };
/** The cheesecake on the top shelf. */
const CAKE = { x: 220, y: 70 };
/** Where the light pours from. */
const GLOW = { x: 220, y: 100 };

/** Seven-segment digits for the microwave's clock. */
const SEG: Record<string, string> = { '3': 'abcdg', '1': 'bc', '7': 'abc' };

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
  const open = 0.55 + t * 0.45;
  const flash = Math.exp(-(((t - 0.62) / 0.05) ** 2));
  // the fridge's glow on everything: cold blue-white, falling off with distance
  const glowAt = (x: number, y: number) => open * (Math.exp(-Math.hypot((x - GLOW.x) * 0.8, (y - GLOW.y) * 1.1) / 70) * 0.9 + (x < GLOW.x && y > 150 ? 0.25 * smooth(0, 1, (x - 40) / 150) : 0));
  const lit = (c: RGB, x: number, y: number, k = 1): RGB => {
    const g = glowAt(x, y) * k;
    return [c[0] * (0.35 + g * 0.8) + g * 40, c[1] * (0.38 + g * 0.9) + g * 60, c[2] * (0.5 + g) + g * 90];
  };

  // ---- the kitchen wall: deep blue tile in the dark
  for (let y = 0; y < 150; y++)
    for (let x = 0; x < W; x++) {
      const tile = x % 16 === 0 || y % 16 === 0;
      put(x, y, lit(tile ? [26, 30, 52] : [40, 46, 76], x, y));
    }
  // ---- the window: rain, the night, the lightning
  const win = { x0: 26, x1: 96, y0: 18, y1: 78 };
  for (let y = win.y0; y < win.y1; y++)
    for (let x = win.x0; x < win.x1; x++) {
      let c: RGB = mixc([10, 12, 34], [40, 50, 90], (y - win.y0) / 60);
      if (N1(x / 3, y / 1.2 + t * 30) > 0.78) c = mixc(c, [120, 140, 190], 0.4);
      c = mixc(c, [230, 230, 255], flash * 0.85);
      put(x, y, c);
    }
  if (flash > 0.3) {
    // the bolt
    let bx = 70;
    for (let y = win.y0; y < win.y1 - 10; y++) {
      bx += Math.sin(y * 1.7) * 2 + (y % 9 === 0 ? -4 : 0);
      for (let w = -1; w <= 1; w++) put(bx + w, y, [255, 255, 240], flash);
    }
  }
  for (let x = win.x0 - 3; x < win.x1 + 3; x++) for (const y of [win.y0 - 3, win.y0 - 2, win.y1, win.y1 + 1, (win.y0 + win.y1) / 2]) put(x, y, lit([120, 90, 60], x, y));
  for (let y = win.y0 - 3; y < win.y1 + 2; y++) for (const x of [win.x0 - 3, win.x0 - 2, win.x1, win.x1 + 1, (win.x0 + win.x1) / 2]) put(x, y, lit([120, 90, 60], x, y));

  // ---- the floor: checkered linoleum catching the light
  for (let y = 150; y < H; y++)
    for (let x = 0; x < W; x++) {
      const u = Math.floor((x - 160) / (14 + (y - 150) * 0.6) + 100);
      const v = Math.floor((y - 150) / (4 + (y - 150) * 0.12));
      const base: RGB = (u + v) % 2 ? [190, 190, 196] : [30, 30, 40];
      put(x, y, lit(base, x, y, 1.2));
    }
  // ---- the counter on the left, the microwave and its clock
  for (let y = 112; y < 150; y++) for (let x = 0; x < 160; x++) put(x, y, lit(y < 117 ? [150, 150, 160] : [96, 66, 40], x, y));
  for (let y = 117; y < 150; y += 12) for (let x = 0; x < 160; x++) put(x, y, lit([60, 40, 24], x, y));
  const mw = { x0: 104, x1: 158, y0: 84, y1: 112 };
  for (let y = mw.y0; y < mw.y1; y++) for (let x = mw.x0; x < mw.x1; x++) put(x, y, lit(x > 142 ? [70, 70, 80] : [36, 36, 44], x, y));
  {
    const digits = ['3', ':', '1', '7'];
    let dx = 112;
    for (const d of digits) {
      if (d === ':') {
        if (t * 9 - Math.floor(t * 9) < 0.5) for (const yy of [94, 100]) for (let k = 0; k < 2; k++) put(dx, yy + k, [255, 60, 40]);
        dx += 4;
        continue;
      }
      const segs = SEG[d];
      const on = (s: string) => segs.includes(s);
      const seg = (x0: number, y0: number, x1: number, y1: number) => {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(dx + x, y, [255, 50, 30]);
      };
      if (on('a')) seg(1, 91, 5, 91);
      if (on('b')) seg(6, 92, 6, 97);
      if (on('c')) seg(6, 99, 6, 104);
      if (on('d')) seg(1, 105, 5, 105);
      if (on('g')) seg(1, 98, 5, 98);
      dx += 9;
    }
    // the clock's red glow
    for (let y = 86; y < 110; y++) for (let x = 108; x < 150; x++) add(x, y, [80, 6, 0], 0.15 * Math.exp(-Math.hypot(x - 128, y - 98) / 14));
  }

  // ---- the fridge: the enamel body
  for (let y = FRIDGE.y0; y < FRIDGE.y1; y++)
    for (let x = FRIDGE.x0; x < FRIDGE.x1; x++) {
      const shade = 0.5 + (x - FRIDGE.x0) / 200;
      put(x, y, lit([200 * shade, 204 * shade, 214 * shade], x, y, 0.5));
    }
  // the inside, glowing
  for (let y = INSIDE.y0; y < INSIDE.y1; y++)
    for (let x = INSIDE.x0; x < INSIDE.x1; x++) {
      const d = Math.hypot(x - 220, (y - 40) * 0.8) / 120;
      put(x, y, mixc([255, 255, 255], [150, 200, 236], Math.min(1, d + (1 - open) * 0.6)));
    }
  // shelves, and the things on them (dark shapes against the light)
  for (const sy of [86, 118, 146]) for (let x = INSIDE.x0; x < INSIDE.x1; x++) (put(x, sy, [200, 220, 240]), put(x, sy + 1, [120, 150, 180]));
  const box = (x0: number, y0: number, w: number, h: number, c: RGB) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) put(x, y, c);
  };
  box(190, 96, 12, 22, [230, 236, 250]);
  box(190, 103, 12, 7, [60, 90, 170]);
  box(206, 104, 9, 14, [180, 120, 40]);
  box(232, 100, 16, 18, [240, 220, 120]);
  box(236, 126, 14, 20, [220, 220, 230]);
  box(196, 132, 24, 14, [150, 200, 120]);
  box(186, 150, 68, 16, [210, 230, 236]);
  // the bulb
  for (let y = 33; y < 40; y++) for (let x = 214; x < 226; x++) put(x, y, [255, 255, 230]);
  // ---- the cheesecake, glowing like a cursed artifact: aura rays first
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2 + t * 1.2;
    const len = 34 + (k % 2) * 14 + Math.sin(t * 9 + k) * 4;
    for (let r = 10; r < len; r++) {
      const x = Math.round(CAKE.x + Math.cos(a) * r);
      const y = Math.round(CAKE.y + Math.sin(a) * r * 0.75);
      put(x, y, [255, 176, 40], (1 - r / len) * 0.75 * (0.75 + 0.25 * Math.sin(t * 12)));
    }
  }
  for (let y = CAKE.y - 30; y < CAKE.y + 30; y++) for (let x = CAKE.x - 40; x < CAKE.x + 40; x++) put(x, y, [255, 200, 90], 0.6 * Math.exp(-Math.hypot(x - CAKE.x, (y - CAKE.y) * 1.3) / 16));
  // the plate
  for (let x = CAKE.x - 18; x <= CAKE.x + 18; x++) for (let y = CAKE.y + 10; y < CAKE.y + 14; y++) if (((x - CAKE.x) / 18) ** 2 + ((y - CAKE.y - 12) / 2.5) ** 2 <= 1) put(x, y, y < CAKE.y + 12 ? [255, 255, 255] : [190, 196, 210]);
  // the wedge: graham crust under, cream, a glaze of strawberry on top
  for (let y = CAKE.y - 6; y < CAKE.y + 11; y++)
    for (let x = CAKE.x - 14; x < CAKE.x + 14; x++) {
      const u = (x - (CAKE.x - 14)) / 28;
      const top = CAKE.y - 6 + Math.round(u * 4);
      if (y < top) continue;
      let c: RGB = y > CAKE.y + 6 ? [190, 130, 70] : mixc([255, 246, 220], [236, 214, 170], u);
      if (y < top + 2) c = [210, 40, 60];
      if (y > CAKE.y + 6 && (x + y) % 3 === 0) c = [150, 96, 50];
      put(x, y, c);
    }
  for (let a = 0; a < 6.3; a += 0.2) for (let r = 0; r < 3.4; r += 0.5) put(CAKE.x - 4 + Math.cos(a) * r, CAKE.y - 9 + Math.sin(a) * r, r < 1.5 ? [255, 120, 140] : [200, 20, 50]);
  // a sparkle
  const sp = Math.abs(Math.sin(t * Math.PI * 3));
  for (let k = -5; k <= 5; k++) (add(CAKE.x + 8 + k, CAKE.y - 10, [255, 255, 220], sp * (1 - Math.abs(k) / 6)), add(CAKE.x + 8, CAKE.y - 10 + k, [255, 255, 220], sp * (1 - Math.abs(k) / 6)));

  // ---- the door, swung open toward us on the right (its shelves glowing)
  const dw = Math.round(34 + open * 22);
  for (let x = FRIDGE.x1; x < FRIDGE.x1 + dw && x < W; x++) {
    const u = (x - FRIDGE.x1) / dw;
    const y0 = FRIDGE.y0 - u * 14;
    const y1 = FRIDGE.y1 + u * 18;
    for (let y = Math.floor(y0); y < y1; y++) {
      let c: RGB = mixc([220, 236, 250], [150, 180, 210], u);
      const rel = (y - y0) / (y1 - y0);
      if ([0.3, 0.55, 0.8].some((s) => Math.abs(rel - s) < 0.012)) c = [255, 255, 255];
      if (Math.abs(rel - 0.42) < 0.06 && u > 0.2 && u < 0.5) c = [240, 190, 30];
      if (Math.abs(rel - 0.68) < 0.07 && u > 0.5 && u < 0.75) c = [200, 30, 30];
      put(x, y, c);
    }
  }
  // ---- the light spilling across the floor toward the doorway
  for (let y = 150; y < H; y++)
    for (let x = 0; x < W; x++) {
      const spread = (y - 150) * 2.4 + 50;
      const inBeam = x > FRIDGE.x0 - spread * 1.6 && x < FRIDGE.x1 + spread * 0.3;
      if (inBeam) add(x, y, [130, 170, 210], 0.28 * open);
    }

  // ---- the man in the doorway: shirtless, sweating, the back of his hand to his forehead
  const man = { x: 66, y: 186 };
  const body = (x: number, y: number): RGB | null => {
    const dx = x - man.x;
    const dy = y - man.y;
    // legs (pajama pants)
    if (dy > -44 && dy <= 0 && Math.abs(dx) < 14 && !(Math.abs(dx) < 2 && dy > -30)) return (Math.floor((x + 400) / 3) % 2 ? [40, 60, 130] : [70, 100, 180]) as RGB;
    // the belly and chest
    if (((dx + 1) / 18) ** 2 + ((dy + 62) / 22) ** 2 <= 1) return [214, 150, 112];
    // the head
    if ((dx / 11) ** 2 + ((dy + 98) / 12) ** 2 <= 1) return dy < -104 || (dx < -6 && dy < -94) ? [130, 120, 112] : [220, 160, 120];
    // the arm up to the forehead (on the far side, toward the fridge)
    if (dx > 8 && dx < 22 && dy > -96 && dy < -70 && Math.abs(dy + 70 - (dx - 8) * -1.9) < 5) return [214, 150, 112];
    if (dx > 2 && dx < 14 && dy > -106 && dy < -96 && Math.abs(dy + 101) < 3) return [214, 150, 112];
    // the other arm, hanging
    if (dx < -14 && dx > -22 && dy > -76 && dy < -40) return [200, 140, 100];
    return null;
  };
  for (let y = 70; y < H; y++)
    for (let x = 30; x < 110; x++) {
      const c = body(x, y);
      if (!c) continue;
      // lit from the right by the fridge, dark on his near side
      const rim = smooth(0.3, 1, (x - man.x + 20) / 40);
      put(x, y, mixc([c[0] * 0.18, c[1] * 0.18, c[2] * 0.26], [c[0] * 0.95 + 20, c[1] + 30, c[2] + 50], rim * open));
    }
  // his glasses catching the light, and the sweat
  for (const gx of [70, 76]) for (let k = 0; k < 3; k++) put(gx + k, 88, [230, 240, 255]);
  const r = rng(9);
  for (let i = 0; i < 9; i++) {
    const sx = man.x - 14 + r() * 32;
    const sy = man.y - 110 + r() * 60 + ((t * 40 + i * 7) % 12);
    put(sx, sy, [200, 230, 255]);
    put(sx, sy + 1, [150, 200, 240]);
  }

  // the lightning lights the whole room for a moment
  if (flash > 0.05) for (let i = 0; i < W * H; i++) for (let k = 0; k < 3; k++) img[i * 3 + k] += (Math.min(255, img[i * 3 + k]) * 0.2 + [30, 34, 60][k]) * flash;

  const out = new Uint8Array(W * H * 3);
  for (let i = 0; i < out.length; i++) out[i] = Math.max(0, Math.min(255, Math.round(img[i])));
  return out;
}
