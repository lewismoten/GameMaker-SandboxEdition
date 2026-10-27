// The title and cover art, drawn for the game (no cover came with the song): a haunted house's
// facade on an October night. A crooked Victorian house with a tower stands under a full moon,
// its windows glowing orange and green, fog spilling out of the open front door over the lawn,
// the foam tombstones and the jack-o'-lanterns. In front, on the right, you: a grown man in
// your best flannel shirt, terrified, eyes wide and mouth open, holding the $12 foam sword up
// in both shaking hands. On the left, calm as can be, Lily: eight, in a lavender unicorn hoodie
// with a rainbow mane and a white horn, glitter on her cheeks, a caramel apple as big as her
// head, smirking at you. Painted in true color, a pixel at a time, then reduced to one
// 256-color palette for the FLI (cartoons.ts). `t` (0..1) animates it: bats cross the moon,
// the windows flicker, lightning flashes, the sword shakes, and Lily's smirk grows.
import { rng } from '../../../kit/pixels';

const COVER_W = 320;
const COVER_H = 200;

type RGB = [number, number, number];

const mixc = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (v: number) => Math.max(0, Math.min(255, v));

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
const N1 = noise2(61);
const N2 = noise2(73);

/** Where the moon is. */
const MOON = { x: 262, y: 44, r: 24 };

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
  const rect = (x0: number, y0: number, w: number, h: number, c: RGB | ((x: number, y: number) => RGB | undefined)) => {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(H, y0 + h); y++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) {
        const col = typeof c === 'function' ? c(x, y) : c;
        if (col) put(x, y, col);
      }
  };
  const ellipse = (cx: number, cy: number, rx: number, ry: number, c: (nx: number, ny: number, x: number, y: number) => RGB | undefined) => {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        if (nx * nx + ny * ny > 1) continue;
        const col = c(nx, ny, x, y);
        if (col) put(x, y, col);
      }
  };
  /** A filled polygon (even-odd). */
  const poly = (pts: [number, number][], c: (x: number, y: number) => RGB | undefined) => {
    const ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[(i + 1) % pts.length];
        if (y0 === y1) continue;
        if (y + 0.5 >= Math.min(y0, y1) && y + 0.5 < Math.max(y0, y1)) xs.push(x0 + ((y + 0.5 - y0) / (y1 - y0)) * (x1 - x0));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) {
          const col = c(x, y);
          if (col) put(x, y, col);
        }
    }
  };
  const shade = (base: RGB, nx: number, ny: number, k = 1): RGB => {
    const z = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    const l = 0.55 + (0.5 * z - 0.25 * nx - 0.35 * ny) * 0.6 * k;
    return [clamp(base[0] * l), clamp(base[1] * l), clamp(base[2] * l)];
  };
  const line = (x0: number, y0: number, x1: number, y1: number, c: RGB, w = 1) => {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      const y = y0 + ((y1 - y0) * i) / n;
      for (let dy = 0; dy < w; dy++) for (let dx = 0; dx < w; dx++) put(x + dx - (w - 1) / 2, y + dy - (w - 1) / 2, c);
    }
  };

  const flash = t > 0.52 && t < 0.6 ? 1 - Math.abs(t - 0.56) / 0.04 : 0;

  // ---- the sky: deep violet to indigo at the horizon, stars, a full moon
  rect(0, 0, W, 150, (x, y) => {
    const base = mixc([18, 10, 44], [70, 40, 110], y / 150);
    const n = N1(x / 30 + t * 2, y / 14) * 30;
    const sky: RGB = [base[0] + n * 0.3, base[1] + n * 0.2, base[2] + n * 0.5];
    return mixc(sky, [220, 220, 255], flash * 0.55);
  });
  const sr = rng(9);
  for (let k = 0; k < 70; k++) {
    const x = sr() * W;
    const y = sr() * 110;
    put(x, y, [255, 255, 230], 0.4 + sr() * 0.6);
  }
  // the moon and its glow
  for (let y = 0; y < 120; y++)
    for (let x = 180; x < W; x++) {
      const d = Math.hypot(x - MOON.x, y - MOON.y);
      if (d > MOON.r && d < MOON.r + 40) put(x, y, [255, 250, 210], (1 - (d - MOON.r) / 40) * 0.25);
    }
  ellipse(MOON.x, MOON.y, MOON.r, MOON.r, (nx, ny, x, y) => {
    const crater = N2(x / 6, y / 6) > 0.62 ? 0.82 : 1;
    const l = (0.85 + 0.15 * (1 - Math.hypot(nx + 0.3, ny + 0.3))) * crater;
    return [clamp(250 * l), clamp(244 * l), clamp(200 * l)];
  });
  // clouds drifting across the moon
  for (let k = 0; k < 3; k++) {
    const cx = ((k * 130 + t * 60) % 400) - 40;
    const cy = 30 + k * 26;
    ellipse(cx, cy, 46, 7, (nx) => mixc([60, 44, 100], [120, 100, 160], 0.5 + nx * 0.3));
  }

  // ---- the haunted house: a crooked Victorian with a tower
  const WALL: RGB = [62, 48, 72];
  const WALL_LIGHT: RGB = [96, 76, 110];
  const ROOF: RGB = [34, 24, 44];
  const siding = (x: number, y: number): RGB => {
    const board = y % 5 === 0 ? 0.75 : 1;
    const n = N2(x / 3, y / 2) * 18;
    const lit = x > 150 ? 1.1 : 1;
    return mixc([(WALL[0] - n) * board * lit, (WALL[1] - n) * board * lit, (WALL[2] - n) * board * lit], [200, 200, 255], flash * 0.35);
  };
  // the main house
  poly(
    [
      [52, 150],
      [52, 92],
      [196, 88],
      [196, 150],
    ],
    siding,
  );
  // its roof, steep, a little crooked
  poly(
    [
      [44, 94],
      [122, 50],
      [204, 90],
    ],
    (x, y) => mixc([ROOF[0] + (y % 4 === 0 ? 10 : 0), ROOF[1], ROOF[2] + (x % 6 === 0 ? 8 : 0)], [200, 200, 255], flash * 0.3),
  );
  // the tower on the left with its witch's-hat roof
  poly(
    [
      [60, 150],
      [60, 64],
      [94, 62],
      [94, 150],
    ],
    siding,
  );
  poly(
    [
      [54, 66],
      [77, 18],
      [100, 64],
    ],
    (_x, y) => mixc([ROOF[0] + (y % 5 === 0 ? 12 : 0), ROOF[1], ROOF[2] + 4], [200, 200, 255], flash * 0.3),
  );
  line(77, 18, 77, 10, [40, 30, 40], 1);
  line(74, 12, 80, 12, [40, 30, 40], 1);
  // a dormer on the right
  poly(
    [
      [146, 82],
      [162, 64],
      [178, 80],
    ],
    () => ROOF,
  );
  rect(152, 76, 20, 14, siding);
  // trim
  line(52, 92, 196, 88, WALL_LIGHT, 2);
  line(60, 64, 94, 62, WALL_LIGHT, 1);
  // the windows: some glow orange, one green, one dark with a silhouette; they flicker
  const flick = (k: number) => 0.75 + 0.25 * Math.sin(t * 40 + k * 2.1) * Math.sin(t * 17 + k);
  const window = (x: number, y: number, w: number, h: number, glow: RGB, k: number, boarded = false) => {
    rect(x - 2, y - 2, w + 4, h + 4, [30, 22, 36]);
    const f = flick(k);
    rect(x, y, w, h, (_xx, yy) => mixc([20, 12, 20], glow, f * (0.8 + 0.2 * ((yy - y) / h))));
    rect(x + w / 2 - 0.5, y, 1, h, [30, 22, 36]);
    rect(x, y + h / 2 - 0.5, w, 1, [30, 22, 36]);
    if (boarded) {
      line(x - 2, y + 2, x + w + 2, y + h - 3, [120, 84, 50], 2);
      line(x - 2, y + h - 2, x + w + 2, y + 3, [110, 76, 44], 2);
    }
    // the glow on the siding round it
    for (let yy = y - 8; yy < y + h + 8; yy++)
      for (let xx = x - 8; xx < x + w + 8; xx++) {
        const dx = Math.max(x - xx, 0, xx - (x + w));
        const dy = Math.max(y - yy, 0, yy - (y + h));
        const d = Math.hypot(dx, dy);
        if (d > 0 && d < 8) put(xx, yy, glow, (1 - d / 8) * 0.18 * f);
      }
  };
  const ORANGE: RGB = [255, 170, 60];
  const GREEN: RGB = [120, 255, 120];
  window(68, 76, 18, 22, ORANGE, 0);
  window(70, 110, 14, 18, GREEN, 1);
  window(110, 100, 18, 20, ORANGE, 2, true);
  window(158, 100, 18, 20, ORANGE, 3);
  window(157, 78, 10, 10, GREEN, 4);
  window(118, 66, 10, 12, ORANGE, 5);
  // a ghost's silhouette in the upstairs window
  ellipse(77, 85, 4, 5, () => [40, 20, 20]);
  // the front porch, its steps and the open door with fog spilling out
  rect(98, 120, 50, 4, [40, 30, 44]);
  for (const x of [100, 145]) rect(x, 106, 3, 18, [90, 70, 90]);
  rect(98, 104, 50, 3, ROOF);
  rect(113, 106, 20, 22, (_x, y) => mixc([10, 30, 20], [110, 240, 140], 0.25 + 0.4 * flick(7) * ((y - 106) / 22)));
  for (let k = 0; k < 3; k++) rect(104 - k * 3, 128 + k * 4, 38 + k * 6, 4, [70, 58, 70]);
  // the sign on the porch
  rect(100, 92, 46, 9, [130, 96, 60]);
  rect(101, 93, 44, 7, [180, 140, 90]);

  // ---- the lawn: dark grass, foam tombstones, jack-o'-lanterns, a picket fence
  rect(0, 140, W, 60, (x, y) => {
    const n = N1(x / 4, y / 3) * 24;
    return mixc([20 + n * 0.3, 40 + n, 30 + n * 0.4], [140, 160, 200], flash * 0.2);
  });
  for (let x = 0; x < W; x += 9) {
    if (x > 95 && x < 150) continue;
    rect(x, 132, 5, 14, [150, 140, 150]);
    poly(
      [
        [x, 132],
        [x + 2.5, 128],
        [x + 5, 132],
      ],
      () => [150, 140, 150],
    );
  }
  rect(0, 136, 96, 2, [130, 120, 130]);
  rect(150, 136, W - 150, 2, [130, 120, 130]);
  const tomb = (x: number, y: number, s: number, tilt: number) => {
    ellipse(x, y, 9 * s, 8 * s, (nx, ny) => (ny < 0.3 ? shade([150, 150, 160], nx, ny) : undefined));
    poly(
      [
        [x - 9 * s, y],
        [x + 9 * s, y + tilt],
        [x + 9 * s, y + 20 * s + tilt],
        [x - 9 * s, y + 20 * s],
      ],
      (xx) => (xx > x + 6 * s ? [100, 100, 112] : [140, 140, 152]),
    );
    rect(x - 4 * s, y + 4 * s, 8 * s, 1, [80, 80, 90]);
    rect(x - 4 * s, y + 8 * s, 8 * s, 1, [80, 80, 90]);
  };
  tomb(30, 150, 0.9, 1);
  tomb(176, 146, 0.7, -1);
  tomb(296, 152, 1, 2);
  const jack = (x: number, y: number, s: number, k: number) => {
    ellipse(x, y, 9 * s, 7 * s, (nx, ny) => shade([240, 120, 20], nx, ny));
    rect(x - 1, y - 9 * s, 2, 3 * s, [60, 110, 40]);
    const f = flick(10 + k);
    const lit: RGB = [255, 230 * f, 90 * f];
    poly(
      [
        [x - 5 * s, y - 2 * s],
        [x - 2 * s, y - 2 * s],
        [x - 3.5 * s, y - 4.5 * s],
      ],
      () => lit,
    );
    poly(
      [
        [x + 2 * s, y - 2 * s],
        [x + 5 * s, y - 2 * s],
        [x + 3.5 * s, y - 4.5 * s],
      ],
      () => lit,
    );
    rect(x - 5 * s, y + 1 * s, 10 * s, 2 * s, lit);
  };
  jack(150, 160, 0.9, 0);
  jack(12, 176, 1.1, 1);

  // ---- the fog: rolling out of the door and over the lawn
  for (let y = 120; y < H; y++)
    for (let x = 0; x < W; x++) {
      const n = N2(x / 24 - t * 3, y / 8) * N1(x / 11 + t * 2, y / 5);
      const fromDoor = Math.max(0, 1 - Math.hypot((x - 123) / 140, (y - 140) / 40));
      const a = Math.min(0.75, n * 1.2 * (0.35 + fromDoor) * ((y - 120) / 80 + 0.3));
      if (a > 0.05) put(x, y, [200, 240, 210], a);
    }

  // ---- bats crossing the moon
  for (let k = 0; k < 4; k++) {
    const u = (t * 0.9 + k * 0.27) % 1;
    const bx = 330 - u * 200 - k * 10;
    const by = 50 + Math.sin(u * 9 + k) * 12 + k * 7;
    const flap = Math.sin(t * 60 + k * 2) > 0 ? -3 : 2;
    const s = 1 + (k % 2) * 0.4;
    ellipse(bx, by, 2 * s, 1.6 * s, () => [10, 6, 14]);
    poly(
      [
        [bx - 1, by],
        [bx - 9 * s, by + flap * s],
        [bx - 5 * s, by + 2],
        [bx - 2, by + 1],
      ],
      () => [10, 6, 14],
    );
    poly(
      [
        [bx + 1, by],
        [bx + 9 * s, by + flap * s],
        [bx + 5 * s, by + 2],
        [bx + 2, by + 1],
      ],
      () => [10, 6, 14],
    );
  }

  // ---- Lily, on the left: calm as can be
  {
    const lx = 52;
    const ly = 150;
    const HOOD: RGB = [190, 160, 236];
    const HOOD_DARK: RGB = [120, 90, 170];
    // her legs and sneakers
    rect(lx - 8, ly + 26, 6, 14, [120, 90, 170]);
    rect(lx + 2, ly + 26, 6, 14, [120, 90, 170]);
    ellipse(lx - 5, ly + 41, 6, 3, () => [250, 250, 250]);
    ellipse(lx + 5, ly + 41, 6, 3, () => [250, 250, 250]);
    // the hoodie
    poly(
      [
        [lx - 15, ly + 28],
        [lx - 12, ly - 2],
        [lx + 12, ly - 2],
        [lx + 15, ly + 28],
      ],
      (x, y) => (x < lx - 6 ? mixc(HOOD_DARK, HOOD, (y - ly) / 40 + 0.3) : HOOD),
    );
    rect(lx - 1, ly, 2, 26, HOOD_DARK);
    // a pocket and a little unicorn patch
    rect(lx - 9, ly + 14, 18, 8, [170, 140, 220]);
    ellipse(lx, ly + 6, 3, 3, () => [255, 255, 255]);
    // the hood up, the rainbow mane down the back, the horn
    ellipse(lx, ly - 14, 15, 15, (nx, ny) => shade(HOOD, nx, ny));
    const RB: RGB[] = [
      [240, 70, 80],
      [255, 160, 60],
      [255, 230, 80],
      [100, 210, 110],
      [90, 150, 255],
      [170, 110, 240],
    ];
    for (let k = 0; k < 6; k++) ellipse(lx + 13 + k * 0.5, ly - 22 + k * 5, 3.5, 3.5, () => RB[k]);
    poly(
      [
        [lx - 3, ly - 27],
        [lx + 3, ly - 27],
        [lx + 1, ly - 46],
      ],
      (x, y) => ((y + x) % 4 < 2 ? [255, 255, 255] : [255, 220, 120]),
    );
    // ears
    poly(
      [
        [lx - 12, ly - 24],
        [lx - 6, ly - 28],
        [lx - 13, ly - 34],
      ],
      () => HOOD,
    );
    poly(
      [
        [lx + 6, ly - 28],
        [lx + 11, ly - 24],
        [lx + 10, ly - 34],
      ],
      () => HOOD,
    );
    // her face in the hood
    ellipse(lx, ly - 12, 10, 10, (nx, ny) => shade([250, 206, 168], nx, ny, 0.6));
    // pigtails
    ellipse(lx - 12, ly - 6, 3, 6, () => [150, 90, 50]);
    ellipse(lx + 12, ly - 6, 3, 6, () => [150, 90, 50]);
    // eyes: half-lidded, looking over at you, one brow up
    const smirk = Math.min(1, t * 1.6);
    for (const ex of [lx - 4, lx + 4]) {
      rect(ex - 2, ly - 14, 4, 2, [40, 30, 30]);
      rect(ex - 2, ly - 15, 4, 1, [230, 180, 150]);
      put(ex + 1, ly - 13, [255, 255, 255]);
    }
    line(lx + 2, ly - 19 - smirk * 2, lx + 7, ly - 18, [120, 70, 40], 1);
    line(lx - 7, ly - 17, lx - 2, ly - 17, [120, 70, 40], 1);
    // the smirk: one corner up
    line(lx - 3, ly - 7, lx + 2, ly - 7, [150, 60, 60], 1);
    line(lx + 2, ly - 7, lx + 4, ly - 8 - smirk, [150, 60, 60], 1);
    // glitter on her cheeks
    const gr = rng(77);
    for (let k = 0; k < 10; k++) put(lx + (k < 5 ? -7 : 5) + gr() * 4, ly - 11 + gr() * 4, k % 2 ? [255, 240, 120] : [255, 180, 255]);
    // her arm and the caramel apple, as big as her head
    rect(lx + 12, ly + 2, 10, 5, HOOD);
    ellipse(lx + 24, ly + 4, 3, 3, () => [250, 206, 168]);
    line(lx + 24, ly + 2, lx + 25, ly - 12, [210, 180, 130], 2);
    ellipse(lx + 26, ly - 24, 14, 13, (nx, ny) => {
      if (ny > 0.05 + Math.sin(nx * 9) * 0.12) return shade([220, 140, 50], nx, ny);
      return shade([200, 30, 30], nx, ny);
    });
    put(lx + 21, ly - 32, [255, 255, 255]);
    put(lx + 22, ly - 31, [255, 200, 200]);
    // a bite out of it
    ellipse(lx + 37, ly - 26, 4, 5, (nx, ny) => shade([250, 240, 200], nx, ny, 0.3));
  }

  // ---- you, on the right: terrified, the foam sword up in both shaking hands
  {
    const shake = Math.sin(t * 90) * 1.6;
    const mx = 238 + shake * 0.4;
    const my = 120;
    const FL: RGB = [190, 40, 46];
    const FL_DARK: RGB = [110, 18, 26];
    const NAVY: RGB = [40, 52, 110];
    // khakis and sneakers, knees knocking
    poly(
      [
        [mx - 18, my + 46],
        [mx - 2, my + 46],
        [mx - 1 + shake, my + 70],
        [mx - 14, my + 80],
        [mx - 20, my + 80],
      ],
      () => [214, 190, 140],
    );
    poly(
      [
        [mx + 2, my + 46],
        [mx + 18, my + 46],
        [mx + 20, my + 80],
        [mx + 14, my + 80],
        [mx + 1 - shake, my + 70],
      ],
      () => [196, 172, 124],
    );
    ellipse(mx - 15, my + 80, 9, 4, () => [230, 230, 236]);
    ellipse(mx + 16, my + 80, 9, 4, () => [230, 230, 236]);
    // the flannel shirt
    poly(
      [
        [mx - 24, my + 48],
        [mx - 22, my + 4],
        [mx + 22, my + 4],
        [mx + 24, my + 48],
      ],
      (x, y) => {
        const lineV = (x - mx + 100) % 8 < 2;
        const lineH = (y - my + 100) % 8 < 2;
        const base = x > mx + 10 ? FL_DARK : FL;
        return lineV && lineH ? [20, 24, 60] : lineV || lineH ? mixc(base, NAVY, 0.6) : base;
      },
    );
    rect(mx - 24, my + 44, 48, 4, [60, 40, 26]);
    rect(mx - 2, my + 44, 5, 4, [230, 190, 80]);
    // the collar and the neck
    rect(mx - 5, my, 10, 6, [240, 196, 160]);
    poly(
      [
        [mx - 8, my + 4],
        [mx, my + 12],
        [mx - 2, my + 4],
      ],
      () => FL_DARK,
    );
    poly(
      [
        [mx + 8, my + 4],
        [mx, my + 12],
        [mx + 2, my + 4],
      ],
      () => FL_DARK,
    );
    // the head: wide eyes, eyebrows up, mouth open in a scream, sweat flying
    ellipse(mx, my - 14, 15, 17, (nx, ny) => shade([248, 200, 160], nx, ny, 0.7));
    ellipse(mx, my - 26, 15, 9, (nx, ny) => (ny < 0.2 ? shade([110, 70, 40], nx, ny) : undefined));
    for (const k of [-1, 1]) {
      ellipse(mx + k * 6, my - 17, 4.5, 5.5, () => [255, 255, 255]);
      ellipse(mx + k * 6 + shake * 0.3, my - 16, 1.6, 1.6, () => [20, 20, 30]);
      line(mx + k * 3, my - 25, mx + k * 10, my - 28, [90, 56, 30], 2);
    }
    ellipse(mx, my - 3, 6, 7, (_nx, ny) => (ny > 0.4 ? [200, 60, 70] : [60, 16, 24]));
    rect(mx - 5, my - 9, 10, 2, [255, 255, 255]);
    for (const [dx, dy] of [
      [-17, -20],
      [18, -24],
      [20, -12],
    ]) {
      ellipse(mx + dx + shake, my + dy, 1.6, 2.4, () => [170, 220, 255]);
    }
    // arms out to the left, both fists on the sword's grip, the blade held up at the house
    const gx = mx - 30 + shake;
    const gy = my + 12;
    poly(
      [
        [mx - 20, my + 6],
        [mx - 14, my + 14],
        [gx + 4, gy + 6],
        [gx, gy - 2],
      ],
      () => FL,
    );
    poly(
      [
        [mx + 20, my + 8],
        [mx + 22, my + 18],
        [gx + 10, gy + 8],
        [gx + 8, gy],
      ],
      () => FL_DARK,
    );
    ellipse(gx, gy, 5, 5, (nx, ny) => shade([248, 200, 160], nx, ny));
    ellipse(gx + 7, gy + 3, 5, 5, (nx, ny) => shade([248, 200, 160], nx, ny));
    // the foam sword: gray blade pointed up and away, yellow crossguard, the price tag still on
    const ang = -2.05 + shake * 0.02;
    const bx = gx - 3;
    const by = gy - 5;
    for (let k = 0; k < 62; k++) {
      const x = bx + Math.cos(ang) * k;
      const y = by + Math.sin(ang) * k;
      const w = k > 56 ? (62 - k) / 2 : 3;
      for (let j = -w; j <= w; j++) put(x - Math.sin(ang) * j, y + Math.cos(ang) * j, j > 1 ? [150, 156, 170] : [214, 220, 232]);
    }
    line(bx - 8, by - 3, bx + 8, by + 4, [250, 210, 60], 3);
    rect(bx + 1, by + 2, 4, 8, [200, 40, 40]);
    // the $12 tag dangling off the guard
    line(bx - 6, by - 2, bx - 10, by + 6, [255, 255, 255], 1);
    rect(bx - 18, by + 6, 13, 7, [250, 246, 220]);
    rect(bx - 16, by + 8, 2, 3, [40, 120, 40]);
    rect(bx - 13, by + 8, 1, 3, [40, 120, 40]);
    rect(bx - 11, by + 8, 3, 3, [40, 120, 40]);
    // motion lines: the shaking
    for (let k = 0; k < 3; k++) {
      line(mx - 34, my - 20 + k * 8, mx - 29, my - 22 + k * 8, [255, 255, 255], 1);
      line(mx + 30, my - 20 + k * 8, mx + 35, my - 22 + k * 8, [255, 255, 255], 1);
    }
  }

  // a vignette
  const out = new Uint8Array(W * H * 3);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const v = 1 - Math.max(0, Math.hypot((x - 160) / 200, (y - 100) / 130) - 0.65) * 0.9;
      for (let k = 0; k < 3; k++) out[(y * W + x) * 3 + k] = clamp(img[(y * W + x) * 3 + k] * v);
    }
  return out;
}
