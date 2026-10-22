// The title and cover art, drawn for the game (no cover came with the song): Carl the fly sitting
// on the floor lamp's shade with a smug grin, the living room behind him (mint daisy wallpaper,
// the wainscot, the burnt-orange couch), a bowl of popcorn on the coffee table and a dish towel
// snapping at him... and missing. Painted in true color, a pixel at a time, then reduced to one
// 256-color palette for the FLI (cartoons.ts). `t` (0..1) animates it: the towel swings in from
// the right and misses, Carl's wings blur, the lamp warms up.
import { rng } from '../../../kit/pixels';

export const COVER_W = 320;
export const COVER_H = 200;

type RGB = [number, number, number];
type Put = (x: number, y: number, c: RGB, a?: number) => void;

const mixc = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (v: number) => Math.max(0, Math.min(255, v));
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
const N1 = noise2(7);

/** Where Carl sits: the middle of his head. */
export const CARL = { x: 204, y: 86 };
/** The lamp shade: its top and bottom edges (y) and half widths. */
const SHADE = { top: 128, bottom: 174, topW: 30, botW: 54, x: 204 };
const RAIL = 128;
const FLOOR = 186;

/** A filled ellipse (rotated by `tilt`), lit by `shade(nx, ny, z)`. */
function ellipse(put: Put, cx: number, cy: number, rx: number, ry: number, tilt: number, color: (nx: number, ny: number, z: number) => RGB, alpha = 1): void {
  const R = Math.max(rx, ry) + 1;
  for (let y = Math.floor(cy - R); y <= cy + R; y++)
    for (let x = Math.floor(cx - R); x <= cx + R; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const u = (dx * Math.cos(tilt) + dy * Math.sin(tilt)) / rx;
      const v = (-dx * Math.sin(tilt) + dy * Math.cos(tilt)) / ry;
      const d = u * u + v * v;
      if (d > 1) continue;
      put(x, y, color(u, v, Math.sqrt(1 - d)), alpha);
    }
}

/** One frame of the cover as RGB bytes (320x200x3). */
export function coverRgb(t: number): Uint8Array {
  const W = COVER_W;
  const H = COVER_H;
  const img = new Float32Array(W * H * 3);
  const put: Put = (x, y, c, a = 1) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
    const i = (y * W + x) * 3;
    for (let k = 0; k < 3; k++) img[i + k] = img[i + k] * (1 - a) + c[k] * a;
  };
  const glow = 0.6 + t * 0.4;

  // ---- the wall: mint wallpaper with cream daisies, the wainscot, the shag
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let c: RGB;
      if (y < RAIL) {
        c = mixc([150, 196, 172], [196, 232, 206], 0.5 + 0.3 * Math.sin(x / 90) - y / 400);
        if (x % 26 < 2) c = mixc(c, [120, 168, 144], 0.5);
        // daisies, a little soft (far away)
        const u = ((x + (Math.floor(y / 32) % 2) * 13) % 26) - 13;
        const v = (y % 32) - 16;
        const d = Math.hypot(u, v);
        if (d < 2) c = [214, 170, 70];
        else if (d < 6 && Math.round(Math.atan2(v, u) * 2.5) % 2 === 0) c = mixc(c, [250, 246, 226], 0.8);
      } else if (y < FLOOR) {
        const board = Math.floor(x / 14);
        c = mixc([96, 56, 28], [160, 108, 60], 0.45 + (board % 3) * 0.12 + N1(x / 4, y / 30) * 0.2);
        if (x % 14 === 0) c = [62, 34, 18];
        if (y < RAIL + 5) c = mixc([200, 150, 96], [120, 74, 38], (y - RAIL) / 5);
      } else {
        c = mixc([70, 44, 24], [150, 104, 62], N1(x / 1.5, y / 1.5));
      }
      put(x, y, c);
    }
  // the lamp's warm light on the wall
  for (let y = 0; y < FLOOR; y++)
    for (let x = 0; x < W; x++) {
      const d = Math.hypot((x - SHADE.x) / 1.4, y - 170);
      const a = Math.exp(-d / 70) * 0.55 * glow;
      if (a > 0.01) put(x, y, [255, 214, 140], a);
      const up = Math.exp(-Math.hypot((x - SHADE.x) / 1.2, y - 110) / 40) * 0.35 * glow * (y < SHADE.top ? 1 : 0);
      if (up > 0.01) put(x, y, [255, 236, 180], up);
    }

  // ---- the couch on the left: its arm and back, burnt-orange corduroy
  for (let y = 112; y < FLOOR; y++)
    for (let x = 0; x < 120; x++) {
      const back = y > 112 + Math.max(0, (x - 70) * 0.9) && x < 112;
      if (!back) continue;
      const lit = 0.5 + 0.4 * Math.sin((y - 112) / 60) - (x < 8 ? 0.2 : 0);
      let c = mixc([110, 40, 12], [240, 140, 60], Math.max(0, Math.min(1, lit)));
      if (x % 5 === 0) c = mixc(c, [80, 26, 6], 0.5);
      put(x, y, c);
    }
  // the arm: a rounded roll on the front of the couch
  for (let y = 124; y < FLOOR; y++)
    for (let x = 84; x < 126; x++) {
      const nx = (x - 105) / 21;
      const top = 124 + (1 - Math.sqrt(Math.max(0, 1 - nx * nx))) * 14;
      if (y < top) continue;
      let c = mixc([110, 40, 12], [250, 160, 80], Math.max(0, Math.min(1, 0.55 - nx * 0.35 - (y - top < 6 ? -0.25 : 0) - (y - 124) / 160)));
      if ((x - 84) % 5 === 0) c = mixc(c, [90, 30, 8], 0.4);
      put(x, y, c);
    }
  // ---- the coffee table and the popcorn, in front
  for (let y = 168; y < H; y++) for (let x = 0; x < 150; x++) put(x, y, y < 172 ? [220, 170, 110] : mixc([150, 96, 50], [96, 56, 26], (y - 172) / 28));
  ellipse(put, 70, 162, 30, 8, 0, () => [250, 250, 244]);
  for (let y = 162; y < 180; y++) {
    const w = 30 - (y - 162) * 0.8;
    for (let x = -w; x <= w; x++) put(70 + x, y, Math.floor((x + 40) / 7) % 2 ? [220, 40, 40] : [250, 246, 240]);
  }
  const pr = rng(31);
  for (let i = 0; i < 70; i++) {
    const x = 44 + pr() * 52;
    const y = 150 + pr() * 14 - Math.max(0, 14 - Math.abs(x - 70) * 0.5);
    ellipse(put, x, y, 3.4, 2.8, 0, (_nx, ny, z) => mixc([226, 200, 140], [255, 252, 236], z * 0.7 - ny * 0.3 + 0.2));
    if (pr() < 0.3) put(x + 1, y + 1, [230, 180, 60]);
  }

  // ---- the floor lamp: pole, shade (glowing), Carl on top
  for (let y = SHADE.bottom; y < FLOOR + 4; y++) for (let x = -2; x <= 2; x++) put(SHADE.x + x, y, mixc([120, 126, 136], [230, 236, 244], (x + 2) / 4));
  ellipse(put, SHADE.x, FLOOR + 6, 20, 5, 0, (nx) => mixc([90, 96, 106], [200, 206, 214], 0.5 - nx * 0.3));
  for (let y = SHADE.top; y <= SHADE.bottom; y++) {
    const u = (y - SHADE.top) / (SHADE.bottom - SHADE.top);
    const w = SHADE.topW + (SHADE.botW - SHADE.topW) * u;
    for (let x = -w; x <= w; x++) {
      const nx = x / w;
      let c = mixc([236, 210, 150], [255, 246, 214], 0.5 + u * 0.4 * glow - Math.abs(nx) * 0.3);
      if (Math.abs(nx) > 0.92) c = mixc(c, [190, 150, 90], 0.5);
      if ((Math.round(x + u * 8) % 9 === 0 && u > 0.1) || y === SHADE.bottom) c = mixc(c, [214, 170, 90], 0.4);
      put(SHADE.x + x, y, c);
    }
  }
  // the top rim, where Carl sits
  ellipse(put, SHADE.x, SHADE.top, SHADE.topW, 4, 0, (_nx, ny) => (ny < 0 ? [255, 236, 170] : [200, 160, 100]));

  // ---- Carl
  carl(put, CARL.x, CARL.y, t);

  // ---- the dish towel: swings in from the right... and misses
  towel(put, t);

  // ---- a vignette
  const out = new Uint8Array(W * H * 3);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const v = 1 - 0.3 * (((x - 180) / 220) ** 2 + ((y - 100) / 150) ** 2);
      for (let k = 0; k < 3; k++) out[(y * W + x) * 3 + k] = clamp(img[(y * W + x) * 3 + k] * v);
    }
  return out;
}

/** Carl: the big red compound eyes, the smug grin, a metallic body, legs on the lamp's rim, wings a blur. */
function carl(put: Put, cx: number, cy: number, t: number): void {
  const ink: RGB = [16, 14, 20];
  // wings: translucent, back and up, flicking (a blur)
  const flick = Math.sin(t * Math.PI * 9) * 0.25;
  for (const s of [-1, 1]) {
    for (const k of [0, 1])
      ellipse(
        put,
        cx + s * (30 + k * 2),
        cy + 2 - k * 6,
        26,
        10,
        s * (-0.5 - flick - k * 0.25),
        (nx, ny) => (Math.abs(ny) > 0.85 || Math.abs(nx) > 0.9 ? [150, 176, 196] : mixc([210, 230, 246], [255, 255, 255], (nx + 1) / 2)),
        k ? 0.22 : 0.4,
      );
    for (let k = 0; k < 24; k += 1) put(cx + s * (10 + k), cy + 2 - k * 0.45 - flick * k * 0.6, [150, 176, 196], 0.5);
  }
  // legs down to the rim, one pair crossed
  for (const [x0, x1] of [
    [-10, -20],
    [-4, -8],
    [4, 10],
    [10, 22],
  ])
    for (let k = 0; k <= 20; k++) {
      const u = k / 20;
      put(cx + x0 + (x1 - x0) * u + Math.sin(u * 3) * 2, cy + 26 + u * 16, ink);
    }
  // the abdomen behind, the thorax, the head
  const metal = (nx: number, ny: number, z: number): RGB => {
    const lit = 0.25 + z * 0.5 - nx * 0.15 - ny * 0.25;
    let c = mixc([14, 18, 26], [60, 100, 110], Math.max(0, Math.min(1, lit)));
    if (z > 0.75 && nx < 0 && ny < 0) c = mixc(c, [150, 210, 200], 0.6);
    return c;
  };
  ellipse(put, cx, cy + 30, 15, 13, 0, (nx, ny, z) => {
    const c = metal(nx, ny, z);
    return Math.round((ny + 1) * 3) % 2 ? mixc(c, [120, 150, 160], 0.25) : c;
  });
  ellipse(put, cx, cy + 16, 17, 12, 0, metal);
  for (let k = -12; k <= 12; k += 1) put(cx + k, cy + 6 + Math.abs(k) * 0.08, [40, 60, 70], 0.4);
  ellipse(put, cx, cy, 22, 15, 0, metal);
  // the eyes: big, red, faceted, with a shine
  for (const s of [-1, 1])
    ellipse(put, cx + s * 12, cy - 4, 13, 13, 0, (nx, ny, z) => {
      let c = mixc([90, 6, 10], [250, 70, 50], Math.max(0, 0.2 + z * 0.7 - ny * 0.2 - nx * s * 0.1));
      const hx = Math.round((nx + 1) * 9);
      const hy = Math.round((ny + 1) * 9 + (hx % 2) * 0.5);
      if ((hx + hy) % 3 === 0) c = mixc(c, [60, 0, 6], 0.25);
      if (Math.hypot(nx + 0.35, ny + 0.4) < 0.22) c = [255, 240, 230];
      // half-lidded: smug
      if (ny < -0.35) c = mixc([30, 44, 50], [70, 100, 110], z);
      if (Math.abs(ny + 0.35) < 0.08) c = ink;
      return c;
    });
  // the grin: a smirk, up on the right, teeth showing
  for (let k = -11; k <= 11; k++) {
    const y = cy + 9 + Math.max(0, 4 - Math.abs(k) * 0.3) * (k < 0 ? 0.6 : 1) - (k > 4 ? (k - 4) * 0.7 : 0);
    put(cx + k, y, ink);
    put(cx + k, y + 1, ink);
    if (k > -9 && k < 9) put(cx + k, y - 1.5, [250, 248, 240]);
  }
  // antennae and a few bristles
  for (const s of [-1, 1]) for (let k = 0; k < 6; k++) put(cx + s * (4 + k * 0.8), cy - 15 - k, ink);
  for (const [x, y] of [
    [-16, 10],
    [16, 12],
    [-13, 22],
    [14, 24],
  ])
    put(cx + x, cy + y, [150, 180, 190]);
}

/** The dish towel, twisted, whipping in from the right at t ~ 0.5 and gone by the end, with a "miss" swoosh. */
function towel(put: Put, t: number): void {
  if (t > 0.92) return;
  const sweep = smooth(0.15, 0.85, t);
  const ox = 360 - sweep * 300;
  const oy = 20 + Math.sin(sweep * Math.PI) * 40;
  for (let k = 0; k < 60; k++) {
    const u = k / 60;
    const x = ox + u * 70;
    const y = oy - u * 30 + Math.sin(u * 7 + t * 6) * 6;
    const w = 7 - u * 4;
    for (let dy = -w; dy <= w; dy++) {
      const check = (Math.floor((k + 60) / 5) + Math.floor((dy + 10) / 3)) % 2;
      put(x, y + dy, check ? [230, 40, 40] : [250, 246, 240]);
    }
  }
  // the swoosh where it missed Carl
  if (t > 0.45)
    for (let a = 0; a < 2.4; a += 0.02) {
      const r = 46 + a * 4;
      put(CARL.x + Math.cos(a + 3.6) * r, CARL.y + Math.sin(a + 3.6) * r * 0.6, [255, 255, 255], 0.7 * (1 - (t - 0.45) / 0.5));
    }
}
