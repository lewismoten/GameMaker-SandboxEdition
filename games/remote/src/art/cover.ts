// The title and cover art, drawn for the game (no cover came with the song): a 1995 living room
// at night. The dusty-rose floral couch sits square in the middle, and between its cushions a
// purple Bermuda swirl turns, sucking in everything that was ever lost in a couch: the big grey
// remote, tumbling, a sock, pennies, a pen, a spoon, a tiny raccoon peeking out. The console TV
// snows static on the left with the VCR blinking 12:00 on top of it; the lamp glows on the
// right, the cat sits on the couch's arm unimpressed, and Teddy peeks round the end. Painted in
// true color, a pixel at a time, then reduced to one 256-color palette for the FLI
// (cartoons.ts). `t` (0..1) animates it: the swirl turns, the remote tumbles in, the VCR blinks.
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
const N1 = noise2(31);
const N2 = noise2(47);

/** Where the swirl is: between the middle seat cushions. */
const SWIRL = { x: 160, y: 140 };

const ROSE: RGB = [196, 120, 136];
const ROSE_DARK: RGB = [110, 50, 70];
const ROSE_LIGHT: RGB = [236, 178, 186];
const TEAL: RGB = [70, 170, 150];

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
  const get = (x: number, y: number): RGB => {
    const i = (Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))) * 3;
    return [img[i], img[i + 1], img[i + 2]];
  };
  const rect = (x0: number, y0: number, w: number, h: number, c: RGB | ((x: number, y: number) => RGB)) => {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(H, y0 + h); y++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) put(x, y, typeof c === 'function' ? c(x, y) : c);
  };
  /** A rounded box shaded from the light at the upper right. */
  const box = (
    x0: number,
    y0: number,
    w: number,
    h: number,
    r: number,
    base: RGB,
    o: { light?: RGB; dark?: RGB; tex?: (x: number, y: number) => RGB | undefined } = {},
  ) => {
    for (let y = Math.floor(y0); y < y0 + h; y++)
      for (let x = Math.floor(x0); x < x0 + w; x++) {
        const dx = Math.max(x0 + r - x, 0, x - (x0 + w - 1 - r));
        const dy = Math.max(y0 + r - y, 0, y - (y0 + h - 1 - r));
        if (dx * dx + dy * dy > r * r) continue;
        const u = (x - x0) / w;
        const v = (y - y0) / h;
        let c = base;
        if (o.light && v < 0.25) c = mixc(o.light, base, v / 0.25);
        if (o.dark && v > 0.7) c = mixc(base, o.dark, (v - 0.7) / 0.3);
        if (o.dark && u < 0.06) c = mixc(o.dark, c, u / 0.06);
        const tex = o.tex?.(x, y);
        put(x, y, tex ?? c);
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
  const shade = (base: RGB, nx: number, ny: number, k = 1): RGB => {
    const z = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    const l = 0.55 + (0.5 * z + 0.25 * nx - 0.35 * ny) * 0.6 * k;
    return [clamp(base[0] * l), clamp(base[1] * l), clamp(base[2] * l)];
  };

  // ---- the wall: cream wallpaper with stripes and little flowers, wood paneling below
  rect(0, 0, W, 112, (x, y) => {
    const stripe = x % 16 < 2;
    const flower = x % 16 === 9 && y % 18 === 6;
    const n = N1(x / 9, y / 9) * 14;
    const base: RGB = stripe ? [214, 200, 168] : [232, 222, 194];
    // the room is dim; the lamp lights it later
    const dim = 0.55 + (y / 112) * 0.1;
    const c: RGB = flower ? [120, 70, 90] : [base[0] - n, base[1] - n, base[2] - n];
    return [c[0] * dim, c[1] * dim, c[2] * (dim + 0.04)];
  });
  rect(0, 0, W, 6, [110, 70, 40]);
  rect(0, 112, W, 46, (x, y) => {
    const grain = N2(x / 3, y / 18) * 40;
    const seam = x % 32 === 0;
    const c: RGB = seam ? [60, 34, 18] : [150 - grain, 92 - grain * 0.6, 50 - grain * 0.3];
    const dim = 0.6;
    return [c[0] * dim, c[1] * dim, c[2] * dim];
  });
  rect(0, 110, W, 3, [90, 56, 30]);
  // ---- the carpet
  rect(0, 158, W, 42, (x, y) => {
    const n = N1(x / 2, y / 2) * 22;
    return [160 - n, 140 - n, 108 - n * 0.8];
  });

  // ---- the window, the night outside (left of center, behind the TV)
  box(40, 22, 60, 56, 2, [80, 50, 30]);
  rect(44, 26, 52, 48, (_x, y) => mixc([10, 12, 40], [40, 40, 90], (y - 26) / 48));
  rect(68, 26, 3, 48, [80, 50, 30]);
  rect(44, 48, 52, 3, [80, 50, 30]);
  for (const [x, y] of [
    [50, 32],
    [86, 30],
    [60, 60],
    [90, 64],
    [76, 40],
  ])
    put(x, y, [255, 255, 230]);
  ellipse(84, 36, 5, 5, () => [240, 236, 200]);
  for (let y = 18; y < 84; y++) {
    rect(30, y, 14 + Math.sin(y / 5) * 2, 1, [150, 30, 44]);
    rect(96 - Math.sin(y / 5) * 2, y, 14 + Math.sin(y / 5) * 2, 1, [150, 30, 44]);
  }
  // Teddy's portrait
  box(200, 26, 34, 40, 1, [190, 150, 40]);
  rect(204, 30, 26, 32, [40, 90, 80]);
  ellipse(217, 50, 10, 9, (nx, ny) => shade([230, 140, 60], nx, ny));
  for (let k = 0; k < 7; k++) rect(209 + k * 0.3, 36 + k, 6 - k * 0.8, 1, [220, 130, 50]);
  for (let k = 0; k < 7; k++) rect(219 + k * 0.5, 36 + k, 6 - k * 0.8, 1, [220, 130, 50]);
  put(213, 48, [20, 20, 20]);
  put(221, 48, [20, 20, 20]);
  put(217, 55, [20, 20, 20]);

  // ---- the console TV on the left, snowing static, the VCR on top blinking 12:00
  box(6, 104, 92, 66, 3, [120, 74, 40], { light: [170, 110, 60], dark: [70, 40, 20] });
  box(12, 110, 62, 50, 6, [40, 40, 46]);
  const flick = Math.floor(t * 9);
  ellipse(43, 135, 28, 22, (nx, ny, x, y) => {
    const r = rng(x * 131 + y * 17 + flick * 977)();
    const v = 140 + r * 115 - (nx * nx + ny * ny) * 70;
    return [v * 0.8, v * 0.9, clamp(v * 1.05)];
  });
  for (const ky of [120, 140]) ellipse(86, ky, 4, 4, (nx, ny) => shade([150, 150, 156], nx, ny));
  for (let y = 150; y < 162; y += 3) rect(80, y, 13, 1, [60, 36, 18]);
  box(14, 90, 76, 14, 1, [30, 30, 34], { light: [80, 80, 88] });
  rect(58, 94, 26, 7, [8, 8, 8]);
  if (t * 6 - Math.floor(t * 6) < 0.6) {
    // "12:00", seven-segment, green
    const seg = (x: number, w: number) => rect(x, 96, w, 3, [90, 255, 110]);
    seg(60, 1);
    seg(63, 3);
    rect(67, 96, 1, 1, [90, 255, 110]);
    rect(67, 98, 1, 1, [90, 255, 110]);
    seg(70, 3);
    seg(75, 3);
  }
  rect(20, 95, 30, 4, [12, 12, 14]);

  // ---- the lamp on its end table, right
  box(262, 128, 48, 36, 2, [130, 82, 44], { light: [180, 120, 70], dark: [80, 46, 24] });
  rect(282, 96, 6, 32, [180, 160, 110]);
  for (let y = 62; y < 98; y++) {
    const w = 14 + (y - 62) * 0.5;
    rect(285 - w, y, w * 2, 1, mixc([255, 236, 170], [240, 190, 110], (y - 62) / 36));
  }
  // its glow on the wall
  for (let y = 0; y < 160; y++)
    for (let x = 200; x < W; x++) {
      const d = Math.hypot(x - 285, (y - 90) * 1.2);
      const a = Math.max(0, 1 - d / 110) * 0.35;
      if (a > 0) {
        const c = get(x, y);
        put(x, y, [clamp(c[0] + 90 * a), clamp(c[1] + 70 * a), clamp(c[2] + 20 * a)]);
      }
    }

  // ---- the couch: dusty rose, teal flowers
  const fabric =
    (base: RGB) =>
    (x: number, y: number): RGB | undefined => {
      const flower = (x % 14 === 5 && y % 12 === 4) || (x % 14 === 12 && y % 12 === 10);
      if (flower) return TEAL;
      const petal = ((x % 14 === 4 || x % 14 === 6) && y % 12 === 4) || (x % 14 === 5 && (y % 12 === 3 || y % 12 === 5));
      if (petal) return [120, 200, 180];
      const n = N2(x / 4, y / 4) * 18;
      return [base[0] - n, base[1] - n, base[2] - n];
    };
  // the back
  box(70, 92, 180, 50, 10, ROSE, {
    light: ROSE_LIGHT,
    dark: ROSE_DARK,
    tex: (x, y) => (y < 132 ? fabric(mixc(ROSE_LIGHT, ROSE, Math.min(1, (y - 92) / 20)))(x, y) : undefined),
  });
  // the seat cushions
  for (const [x0, w] of [
    [86, 50],
    [138, 44],
    [184, 50],
  ] as const)
    box(x0, 132, w, 26, 5, ROSE, {
      light: ROSE_LIGHT,
      dark: ROSE_DARK,
      tex: (x, y) => (y < 150 ? fabric(mixc(ROSE_LIGHT, ROSE, Math.min(1, (y - 132) / 14)))(x, y) : undefined),
    });
  // the arms
  box(58, 108, 30, 60, 10, ROSE, { light: ROSE_LIGHT, dark: ROSE_DARK, tex: (x, y) => (y < 150 ? fabric(ROSE)(x, y) : undefined) });
  box(232, 108, 30, 60, 10, ROSE, { light: ROSE_LIGHT, dark: ROSE_DARK, tex: (x, y) => (y < 150 ? fabric(ROSE)(x, y) : undefined) });
  rect(70, 158, 180, 10, ROSE_DARK);
  for (const x of [76, 240]) rect(x, 168, 6, 6, [70, 40, 20]);

  // ---- the Bermuda swirl between the cushions
  const spin = t * Math.PI * 2;
  ellipse(SWIRL.x, SWIRL.y + 4, 30, 15, (nx, ny) => {
    const d = Math.sqrt(nx * nx + ny * ny);
    const a = Math.atan2(ny, nx);
    const arm = Math.sin(a * 3 + d * 9 - spin * 2);
    const glow = 1 - d;
    const base: RGB = mixc([40, 10, 80], [210, 140, 255], Math.max(0, arm * 0.5 + 0.5) * glow + glow * 0.4);
    return [clamp(base[0] + glow * 60), clamp(base[1] + glow * 30), clamp(base[2] + glow * 40)];
  });
  // sparkles flying in
  const sr = rng(5);
  for (let k = 0; k < 40; k++) {
    const a0 = sr() * Math.PI * 2;
    const r0 = 30 + sr() * 70;
    const u = (sr() + t) % 1;
    const rr = r0 * (1 - u);
    const a = a0 + u * 3;
    put(SWIRL.x + Math.cos(a) * rr * 1.4, SWIRL.y + Math.sin(a) * rr * 0.6, [255, 230, 255], 1 - u * 0.5);
  }
  // ---- lost things spiraling in: a sock, pennies, a pen, a spoon
  const orbit = (k: number, r0: number) => {
    const u = (t + k * 0.23) % 1;
    const a = k * 1.9 + u * 4;
    const rr = r0 * (1 - u * 0.75);
    return { x: SWIRL.x + Math.cos(a) * rr * 1.5, y: SWIRL.y - 6 + Math.sin(a) * rr * 0.55, s: 1 - u * 0.6 };
  };
  {
    const o = orbit(0, 60);
    for (let y = -6; y < 6; y++) rect(o.x - 3 * o.s, o.y + y * o.s, 6 * o.s, 1, [240, 240, 240]);
    rect(o.x - 3 * o.s, o.y + 4 * o.s, 9 * o.s, 4 * o.s, [240, 240, 240]);
    rect(o.x - 3 * o.s, o.y - 6 * o.s, 6 * o.s, 2, [200, 40, 40]);
  }
  for (const k of [1, 3, 5]) {
    const o = orbit(k, 50 + k * 4);
    ellipse(o.x, o.y, 4 * o.s + 1, 4 * o.s + 1, (nx, ny) => shade([230, 130, 70], nx, ny));
  }
  {
    const o = orbit(2, 70);
    for (let k = 0; k < 16 * o.s; k++) put(o.x + k, o.y - k * 0.4, [40, 80, 200]);
    for (let k = 0; k < 16 * o.s; k++) put(o.x + k, o.y - k * 0.4 + 1, [70, 110, 230]);
  }
  {
    const o = orbit(4, 64);
    ellipse(o.x, o.y, 4 * o.s + 1, 3 * o.s + 1, (nx, ny) => shade([210, 214, 226], nx, ny));
    for (let k = 0; k < 14 * o.s; k++) put(o.x + 3 + k, o.y + 2 + k * 0.3, [200, 204, 220]);
  }
  // the tiny raccoon peeking out of the swirl
  ellipse(SWIRL.x + 18, SWIRL.y + 2, 6, 5, (nx, ny) => shade([150, 150, 160], nx, ny));
  rect(SWIRL.x + 13, SWIRL.y + 1, 11, 3, [30, 30, 34]);
  put(SWIRL.x + 15, SWIRL.y + 2, [255, 255, 255]);
  put(SWIRL.x + 21, SWIRL.y + 2, [255, 255, 255]);
  put(SWIRL.x + 14, SWIRL.y - 4, [90, 90, 96]);
  put(SWIRL.x + 22, SWIRL.y - 4, [90, 90, 96]);

  // ---- the remote: a big chunky grey 1995 clicker, tumbling into the swirl
  {
    const u = t;
    const cx = 236 - u * 64;
    const cy = 60 + u * 60;
    const ang = -0.6 + u * 4.5;
    const s = 1.25 - u * 0.55;
    const len = 34 * s;
    const wid = 11 * s;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    for (let y = Math.floor(cy - len); y <= cy + len; y++)
      for (let x = Math.floor(cx - len); x <= cx + len; x++) {
        const lx = (x - cx) * ca + (y - cy) * sa;
        const ly = -(x - cx) * sa + (y - cy) * ca;
        if (Math.abs(lx) > len / 2 || Math.abs(ly) > wid / 2) continue;
        const edge = Math.abs(ly) > wid / 2 - 1.2 || Math.abs(lx) > len / 2 - 1.2;
        let c: RGB = edge ? [70, 70, 78] : [130, 132, 140];
        // the buttons: a red power button, a grid of rubber keys, the big channel rocker
        const bx = (lx + len / 2) / len;
        const by = (ly + wid / 2) / wid;
        if (bx > 0.08 && bx < 0.2 && by > 0.3 && by < 0.7) c = [220, 40, 40];
        else if (bx > 0.3 && bx < 0.7 && Math.floor(bx * 18) % 2 === 0 && Math.floor(by * 5) % 2 === 1) c = [210, 210, 214];
        else if (bx > 0.76 && bx < 0.92 && by > 0.2 && by < 0.8) c = [60, 60, 200];
        put(x, y, c);
      }
    // motion lines
    for (let k = 0; k < 3; k++) for (let j = 0; j < 10; j++) put(cx + 22 + j * 1.5 + k * 3, cy - 18 - j * 0.9 + k * 6, [255, 255, 255], 0.5);
  }

  // ---- the cat on the right arm, unimpressed; Teddy peeking round the left arm
  ellipse(248, 98, 13, 9, (nx, ny) => shade([150, 150, 156], nx, ny));
  ellipse(250, 84, 8, 7, (nx, ny) => shade([160, 160, 166], nx, ny));
  for (const ex of [244, 256]) {
    for (let k = 0; k < 6; k++) rect(ex - 3 + k * 0.5, 74 + k, 7 - k, 1, [150, 150, 156]);
  }
  rect(245, 84, 3, 1, [40, 120, 40]);
  rect(253, 84, 3, 1, [40, 120, 40]);
  put(250, 88, [240, 150, 170]);
  for (let k = 0; k < 18; k++) put(236 - Math.sin(k / 3) * 3, 100 - k, [140, 140, 146]);
  // Teddy, on the carpet in front of the couch, looking up at the swirl
  {
    const tx = 112;
    const ty = 182;
    ellipse(tx - 14, ty + 4, 16, 7, (nx, ny) => shade([235, 140, 60], nx, ny));
    ellipse(tx, ty, 10, 9, (nx, ny) => shade([235, 140, 60], nx, ny));
    rect(tx - 2, ty - 8, 4, 16, [250, 248, 240]);
    for (let k = 0; k < 8; k++) rect(tx - 9 + k * 0.3, ty - 15 + k, 5 - k * 0.5, 1, [230, 130, 50]);
    for (let k = 0; k < 8; k++) rect(tx + 4 + k * 0.2, ty - 15 + k, 5 - k * 0.5, 1, [230, 130, 50]);
    put(tx - 5, ty - 2, [20, 20, 20]);
    put(tx + 4, ty - 2, [20, 20, 20]);
    rect(tx - 1, ty + 3, 3, 2, [20, 20, 20]);
    rect(tx - 1, ty + 6, 3, 3, [240, 120, 150]);
  }

  // a gentle vignette
  const out = new Uint8Array(W * H * 3);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const v = 1 - Math.max(0, Math.hypot((x - 160) / 200, (y - 110) / 140) - 0.6) * 0.8;
      for (let k = 0; k < 3; k++) out[(y * W + x) * 3 + k] = clamp(img[(y * W + x) * 3 + k] * v);
    }
  return out;
}
