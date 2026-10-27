// The title and cover art, drawn for the game (no cover came with the songs): a marble portico
// under a late-afternoon Roman sky, two fluted columns, laurel garlands swung between them, a
// checkered marble floor, and in the middle, on its pedestal, a laughing marble bust in a laurel
// wreath, its head thrown back. Painted in true color, a pixel at a time (lit ellipsoids, veined
// marble from value noise), then reduced to one 256-color palette for the FLI (cartoons.ts).
// `t` (0..1) animates it: a sunbeam sweeps the floor, laurel leaves drift down, doves cross the
// sky, and the bust, stone-faced at first, cracks up: its eyes close and its mouth falls open.
import { rng } from '../../../kit/pixels';

const COVER_W = 320;
const COVER_H = 200;

type RGB = [number, number, number];

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
const N1 = noise2(31);
const N2 = noise2(57);
const fbm = (x: number, y: number) => N1(x, y) * 0.55 + N1(x * 2.1 + 7, y * 2.1) * 0.3 + N2(x * 4.3, y * 4.3 + 3) * 0.15;
/** Marble: warm white with gray veins (where the noise turns). */
const marble = (x: number, y: number, light: number): RGB => {
  const v = Math.abs(Math.sin((x * 0.06 + y * 0.03 + fbm(x * 0.05, y * 0.05) * 6) * 1.3));
  const vein = 0.55 + 0.45 * smooth(0.0, 0.07, v);
  const base: RGB = [236, 228, 214];
  const veinC: RGB = [176, 170, 176];
  const c = base.map((b, i) => b * vein + veinC[i] * (1 - vein)) as RGB;
  return c.map((k) => Math.max(0, Math.min(255, k * light))) as RGB;
};

/** The two columns: [center x, radius]. */
const COLUMNS: [number, number][] = [
  [42, 22],
  [278, 22],
];
const FLOOR = 150;
const BUST = { x: 160, y: 98 };

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
  const laugh = smooth(0.35, 0.75, t);

  // ---- the sky: deep blue to gold, a few clouds lit from below
  for (let y = 0; y < FLOOR; y++)
    for (let x = 0; x < W; x++) {
      const u = y / FLOOR;
      const sky: RGB = [40 + u * 200, 70 + u * 140, 150 + u * 20];
      const cl = smooth(0.55, 0.8, fbm(x * 0.012 + t * 0.4, y * 0.03)) * smooth(0.1, 0.35, u) * (1 - smooth(0.6, 0.9, u));
      put(x, y, [sky[0] + cl * 60, sky[1] + cl * 50, sky[2] + cl * 30]);
    }
  // the hills of Rome and a far dome, hazy
  for (let x = 0; x < W; x++) {
    const h = 128 + Math.sin(x / 31) * 6 + Math.sin(x / 13 + 2) * 3;
    for (let y = Math.floor(h); y < FLOOR; y++) put(x, y, [150, 140, 150], 0.7);
    const d = Math.hypot(x - 214, 0);
    if (d < 14) for (let y = Math.floor(126 - Math.sqrt(196 - d * d) * 0.8); y < 128; y++) put(x, y, [170, 150, 160], 0.8);
  }
  // doves crossing the sky
  for (let k = 0; k < 3; k++) {
    const dx = ((t * 260 + k * 90) % 360) - 20;
    const dy = 30 + k * 14 + Math.sin(t * 20 + k) * 3;
    const flap = Math.sin(t * 60 + k * 2) > 0 ? -2 : 1;
    for (let s = -4; s <= 4; s++) put(dx + s, dy + (Math.abs(s) > 1 ? flap : 0), [250, 250, 245]);
  }

  // ---- the floor: checkered marble running back, a sunbeam sweeping across it
  const beam = 40 + t * 240;
  for (let y = FLOOR; y < H; y++)
    for (let x = 0; x < W; x++) {
      const depth = (y - FLOOR + 6) / 56;
      const u = (x - 160) / (depth * 60) + 100;
      const v = (y - FLOOR) / (depth * 14 + 4);
      const dark = (Math.floor(u) + Math.floor(v)) % 2;
      const sun = 0.82 + 0.35 * Math.exp(-(((x - beam) / 30) ** 2));
      const c = dark ? ([90, 74, 70] as RGB) : marble(x, y, 1);
      put(x, y, c.map((k) => Math.min(255, k * sun * (0.75 + depth * 0.25))) as RGB);
    }

  // ---- the entablature across the top (left plain for the title) and its cornice
  for (let y = 0; y < 34; y++)
    for (let x = 0; x < W; x++) {
      const shade = y < 4 ? 1.05 : y > 30 ? 0.62 : 0.9 - (y % 9 === 8 ? 0.15 : 0);
      put(x, y, marble(x, y, shade));
    }
  for (let x = 0; x < W; x += 12)
    for (let y = 34; y < 39; y++) (put(x + 3, y, marble(x, y, 0.8)), put(x + 4, y, marble(x, y, 0.85)), put(x + 5, y, marble(x, y, 0.7)));

  // ---- the columns: fluted, lit from the left
  for (const [cx, r] of COLUMNS) {
    for (let y = 34; y < FLOOR + 8; y++)
      for (let x = cx - r - 4; x <= cx + r + 4; x++) {
        const capital = y < 46;
        const base = y > FLOOR - 4;
        const rr = capital || base ? r + 4 : r;
        const nx = (x - cx) / rr;
        if (Math.abs(nx) > 1) continue;
        const z = Math.sqrt(1 - nx * nx);
        const flute = capital || base ? 1 : 0.86 + 0.14 * Math.abs(Math.cos(nx * Math.PI * 4));
        const light = (0.45 + 0.6 * Math.max(0, 0.5 * z - 0.6 * nx)) * flute;
        put(x, y, marble(x * 0.7, y, light));
      }
    // the capital's scrolls (volutes)
    for (const s of [-1, 1])
      for (let a = 0; a < Math.PI * 3; a += 0.05) {
        const rad = 6 - a * 0.6;
        put(cx + s * (r + 2) + Math.cos(a) * rad, 42 + Math.sin(a) * rad, [120, 110, 110]);
      }
  }

  // ---- laurel garlands swung between the columns, and leaves drifting down
  const leaf = (x: number, y: number, ang: number, shade: number) => {
    for (let s = -3; s <= 3; s++)
      for (let w = -1; w <= 1; w++)
        if (Math.abs(w) <= 1 - Math.abs(s) / 4)
          put(x + Math.cos(ang) * s - Math.sin(ang) * w, y + Math.sin(ang) * s + Math.cos(ang) * w, [40 * shade, 120 * shade, 50 * shade]);
  };
  for (const [x0, x1] of [
    [64, 132],
    [188, 256],
  ]) {
    for (let k = 0; k <= 24; k++) {
      const u = k / 24;
      const x = x0 + (x1 - x0) * u;
      const y = 44 + Math.sin(u * Math.PI) * 22;
      leaf(x, y, u * 6 + k, 0.9 + (k % 3) * 0.12);
      leaf(x + 2, y + 3, -u * 5 - k, 0.7);
    }
    for (const x of [x0, x1]) for (let k = 0; k < 4; k++) leaf(x + Math.sin(k) * 3, 48 + k * 5, k * 1.4, 1);
  }
  const fall = rng(91);
  for (let k = 0; k < 9; k++) {
    const fx = fall() * W;
    const fy = ((fall() * 160 + t * 150 * (0.6 + fall() * 0.6)) % 150) + 40;
    leaf(fx + Math.sin(fy / 9) * 6, fy, fy / 8 + k, 1.1);
  }

  // ---- the pedestal
  for (let y = 132; y < FLOOR + 14; y++)
    for (let x = BUST.x - 34; x <= BUST.x + 34; x++) {
      const top = y < 137;
      const half = top ? 34 : y > FLOOR + 8 ? 34 : 28;
      if (Math.abs(x - BUST.x) > half) continue;
      const light = 0.55 + 0.45 * smooth(BUST.x + half, BUST.x - half, x) * (top ? 1.1 : 0.9);
      put(x, y, marble(x, y + 40, light));
    }
  // RISI, cut into it
  const letters: Record<string, string[]> = {
    R: ['###.', '#..#', '###.', '#.#.', '#..#'],
    I: ['###', '.#.', '.#.', '.#.', '###'],
    S: ['.###', '#...', '.##.', '...#', '###.'],
  };
  let lx = BUST.x - 20;
  for (const ch of 'RISI') {
    const g = letters[ch];
    g.forEach((row, ry) =>
      [...row].forEach(
        (cc, rx) =>
          cc === '#' &&
          (put(lx + rx * 2, 142 + ry * 2, [90, 80, 80]),
          put(lx + rx * 2 + 1, 142 + ry * 2, [90, 80, 80]),
          put(lx + rx * 2, 143 + ry * 2, [120, 110, 110]),
          put(lx + rx * 2 + 1, 143 + ry * 2, [120, 110, 110])),
      ),
    );
    lx += g[0].length * 2 + 4;
  }

  // ---- the bust: draped shoulders, a short neck, the head thrown back as it laughs
  const tilt = laugh * 0.22;
  const shade = (nx: number, ny: number, nz: number) => Math.max(0.3, Math.min(1.18, 0.38 + 0.78 * (-0.55 * nx - 0.45 * ny + 0.7 * nz)));
  /** A little lit ball of marble (a curl of hair or beard). */
  const ball = (cx: number, cy: number, r: number, k = 1) => {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const nx = (x + 0.5 - cx) / r;
        const ny = (y + 0.5 - cy) / r;
        const d = nx * nx + ny * ny;
        if (d > 1) continue;
        put(x, y, marble(x, y, shade(nx, ny, Math.sqrt(1 - d)) * k));
      }
  };
  // shoulders and chest with the drape's folds
  for (let y = 102; y < 133; y++)
    for (let x = BUST.x - 46; x <= BUST.x + 46; x++) {
      const nx = (x - BUST.x) / 46;
      const ny = (y - 124) / 22;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      const nz = Math.sqrt(1 - d);
      const fold = 0.86 + 0.14 * Math.sin((x - BUST.x) * 0.28 - (y - 102) * 0.42);
      put(x, y, marble(x, y, shade(nx, ny, nz) * fold));
    }
  // the head's place, tipped back by the laugh
  const hx = BUST.x;
  const hy = 80 - laugh * 3;
  const rot = (dx: number, dy: number): [number, number] => [hx + dx * Math.cos(tilt) - dy * Math.sin(tilt), hy + dx * Math.sin(tilt) + dy * Math.cos(tilt)];
  const back = (x: number, y: number): [number, number] => {
    const dx = x - hx;
    const dy = y - hy;
    return [dx * Math.cos(tilt) + dy * Math.sin(tilt), -dx * Math.sin(tilt) + dy * Math.cos(tilt)];
  };
  // the neck
  for (let y = hy + 14; y < 108; y++)
    for (let x = BUST.x - 10; x <= BUST.x + 10; x++) {
      const nx = (x - BUST.x) / 10;
      put(x, y, marble(x, y, shade(nx, 0.2, Math.sqrt(Math.max(0, 1 - nx * nx))) * 0.82));
    }
  // ears
  for (const sx of [-1, 1]) {
    const [ex, ey] = rot(sx * 18, 2);
    ball(ex, ey, 4.4, 0.9);
  }
  // the head: wide at the cheeks, narrowing to the chin
  for (let y = hy - 30; y < hy + 30; y++)
    for (let x = hx - 28; x <= hx + 28; x++) {
      const [dx, dy] = back(x, y);
      const ny = dy / 24;
      const rx = 18 * (1 - 0.3 * Math.max(0, ny) ** 2);
      const nx = dx / rx;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      put(x, y, marble(x, y, shade(nx, ny, Math.sqrt(1 - d))));
    }
  // curls of hair over the top of the head, and the short beard along the jaw
  for (let k = 0; k < 15; k++) {
    const a = Math.PI * (1.08 + (k / 14) * 0.84);
    const [cx, cy] = rot(Math.cos(a) * 17, Math.sin(a) * 21 - 2);
    ball(cx, cy, 4, 0.95);
  }
  for (let k = 0; k < 9; k++) {
    const a = Math.PI * (0.15 + (k / 8) * 0.7);
    const [cx, cy] = rot(Math.cos(a) * 15, 8 + Math.sin(a) * 15);
    ball(cx, cy, 3.4, 0.9);
  }
  // the face (dots in the head's own frame)
  const dot = (dx: number, dy: number, c: RGB, a = 1) => {
    const [x, y] = rot(dx, dy);
    put(x, y, c, a);
  };
  const line = (x0: number, y0: number, x1: number, y1: number, c: RGB, a = 1) => {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let k = 0; k <= n; k++) dot(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, c, a);
  };
  const dark: RGB = [120, 108, 110];
  const deep: RGB = [52, 40, 46];
  for (const s of [-1, 1]) {
    // brows: drawn together and stern, then lifted with the laugh
    line(s * 3, -8 + (1 - laugh) * 2, s * 12, -9 - laugh * 3, dark);
    line(s * 3, -7 + (1 - laugh) * 2, s * 12, -8 - laugh * 3, dark, 0.6);
    // eyes: open, blank and stern; then screwed shut in two happy arcs
    if (laugh < 0.5) {
      line(s * 4, -3, s * 11, -3, dark);
      for (let k = 5; k <= 10; k++) dot(s * k, -2, deep, 0.7);
    } else for (let k = 0; k <= 8; k++) dot(s * (4 + k), -2 - Math.sin((k / 8) * Math.PI) * 2.4, deep);
    // cheeks bunched up, laugh lines
    if (laugh > 0.4) line(s * 10, 5, s * 13, 11, dark, laugh * 0.8);
  }
  // the nose: lit on the left, shadowed on the right, two nostrils
  for (let k = -3; k <= 7; k++) (dot(2, k, [150, 140, 140], 0.5), dot(3, k, [130, 120, 124], 0.5));
  dot(-2, 8, deep);
  dot(3, 8, deep);
  // the mouth: a hard line, then wide open (a row of teeth, the dark inside)
  const open = laugh * 10;
  for (let k = -10; k <= 10; k++) {
    const curve = k * k * 0.035;
    if (open < 1.5) dot(k * 0.7, 13, deep);
    else {
      const top = 12 - curve;
      const bot = 12 + open * (1 - (k * k) / 110) - curve;
      for (let y = top; y <= bot; y += 0.5) dot(k, y, y < top + 2 ? [236, 230, 224] : deep);
    }
  }
  // the laurel wreath round the head
  for (let k = 0; k < 20; k++) {
    const a = Math.PI * (1.02 + (k / 19) * 0.96);
    const [x, y] = rot(Math.cos(a) * 20, Math.sin(a) * 15 - 5);
    leaf(x, y, a + 1.2 + tilt, 0.8 + (k % 2) * 0.3);
  }
  // laugh lines rising from the bust as it laughs
  if (laugh > 0.6)
    for (let k = 0; k < 3; k++) {
      const a = -Math.PI / 2 + (k - 1) * 0.6;
      const r0 = 38 + ((t * 200) % 10);
      for (let s2 = 0; s2 < 6; s2++) put(hx + Math.cos(a) * (r0 + s2), hy - 10 + Math.sin(a) * (r0 + s2), [255, 236, 150]);
    }

  const out = new Uint8Array(W * H * 3);
  for (let i = 0; i < out.length; i++) out[i] = Math.max(0, Math.min(255, Math.round(img[i])));
  return out;
}
