// Teddy's Lay-an-Egg Egg is no egg shape at all: three chubby little felt sausages in browns,
// piled across and on each other, with a cartoon whiff of odor rising off it. Each sausage is
// a chain of overlapping felt balls along a gentle curve, splatted into a depth buffer and lit
// like the eggs (eggArt.ts), so it turns with them in the viewer and sits on the shelf beside
// them. Under black light it takes the same glowing covering the eggs do (eggUv.ts), cast
// onto it from its middle.
import { TEX_H, TEX_W, type EggBox } from './eggArt';

type V3 = [number, number, number];
interface Ball {
  x: number;
  y: number;
  z: number;
  r: number;
  log: number;
  /** How far along its sausage, 0..1. */
  s: number;
}

// in units of half the box's height, y down, the box's middle at 0; the pile sits low so its
// whiff has the top of the box
const LOGS: { a: V3; b: V3; c: V3; r: number; rgb: V3 }[] = [
  // two lying across each other on the ground
  { a: [-0.54, 0.7, -0.16], b: [-0.05, 0.78, 0.26], c: [0.52, 0.68, 0.1], r: 0.24, rgb: [122, 74, 40] },
  { a: [-0.26, 0.72, 0.48], b: [0.1, 0.7, 0.02], c: [0.34, 0.74, -0.46], r: 0.23, rgb: [104, 62, 33] },
  // and a shorter one on top, its end tipped up
  { a: [-0.36, 0.32, 0.06], b: [0.02, 0.4, -0.12], c: [0.32, 0.16, 0.02], r: 0.21, rgb: [140, 88, 50] },
];

const BALLS: Ball[] = LOGS.flatMap((l, log) => {
  const at = (t: number) => [0, 1, 2].map((k) => (1 - t) ** 2 * l.a[k] + 2 * t * (1 - t) * l.b[k] + t * t * l.c[k]) as V3;
  const n = 26;
  return Array.from({ length: n + 1 }, (_, i) => {
    const s = i / n;
    const [x, y, z] = at(s);
    // chubby in the middle, rounded at the ends
    const r = l.r * (1 - 0.22 * (2 * s - 1) ** 4) * (1 + 0.04 * Math.sin(s * Math.PI * 5 + log));
    return { x, y, z, r, log, s };
  });
});

// each ball's neighbors on the other sausages, for the shading where they touch
const NEAR = BALLS.map((p) => BALLS.filter((q) => q.log !== p.log && Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) < p.r + q.r + 0.12));

const hash = (x: number, y: number, z: number) => {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
};

/**
 * Draws the pile turned by `turn` radians into a w x h box at (x, y), through an offscreen
 * buffer of at most `res` rows. With `tex` (a covering from eggUv.ts) it shows that covering's
 * colors in place of its own browns.
 */
export function drawPile(g: CanvasRenderingContext2D, turn: number, box: EggBox, res = 300, tex?: ImageData): void {
  const H = Math.max(16, Math.min(res, Math.round(box.h)));
  const W = Math.max(12, Math.round((H * box.w) / box.h));
  const half = H / 2;
  const cx = W / 2;
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  const turned = BALLS.map((b) => ({ ...b, x: b.x * cos + b.z * sin, z: -b.x * sin + b.z * cos }));
  const depth = new Float32Array(W * H).fill(-Infinity);
  const who = new Int32Array(W * H).fill(-1);
  const edge = new Float32Array(W * H).fill(-1);
  turned.forEach((b, i) => {
    const x0 = Math.max(0, Math.floor(cx + (b.x - b.r) * half) - 1);
    const x1 = Math.min(W - 1, Math.ceil(cx + (b.x + b.r) * half) + 1);
    const y0 = Math.max(0, Math.floor(half + (b.y - b.r) * half) - 1);
    const y1 = Math.min(H - 1, Math.ceil(half + (b.y + b.r) * half) + 1);
    for (let py = y0; py <= y1; py++)
      for (let px = x0; px <= x1; px++) {
        const dx = (px + 0.5 - cx) / half - b.x;
        const dy = (py + 0.5 - half) / half - b.y;
        const d2 = dx * dx + dy * dy;
        const o = py * W + px;
        edge[o] = Math.max(edge[o], (b.r - Math.sqrt(d2)) * half);
        if (d2 >= b.r * b.r) continue;
        const z = b.z + Math.sqrt(b.r * b.r - d2);
        if (z > depth[o]) {
          depth[o] = z;
          who[o] = i;
        }
      }
  });
  const img = new ImageData(W, H);
  const out = img.data;
  const L = [-0.45, -0.55, 0.7];
  const ln = Math.hypot(L[0], L[1], L[2]);
  for (let o = 0; o < W * H; o++) {
    const i = who[o];
    if (i < 0 && edge[o] <= -0.5) continue;
    // the rim's half-covered pixels take the nearest ball's color
    const b = turned[i >= 0 ? i : 0];
    const X = ((o % W) + 0.5 - cx) / half;
    const Y = (Math.floor(o / W) + 0.5 - half) / half;
    const Z = i >= 0 ? depth[o] : b.z;
    const nx = (X - b.x) / b.r;
    const ny = (Y - b.y) / b.r;
    const nz = Math.max(0, (Z - b.z) / b.r);
    const d = Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / ln);
    let shade = 0.38 + 0.72 * d + 0.12 * Math.pow(1 - nz, 3);
    // the point back in the pile's own turn, so its fibers and stitches turn with it
    const ox = X * cos - Z * sin;
    const oz = X * sin + Z * cos;
    // darker where it rests on another sausage, with a running stitch along the join
    let gap = 1;
    for (const q of NEAR[i >= 0 ? i : 0]) gap = Math.min(gap, Math.hypot(ox - q.x, Y - q.y, oz - q.z) - q.r);
    let rgb: number[] = LOGS[b.log].rgb;
    if (tex) {
      const u = (Math.atan2(ox, oz) / (Math.PI * 2) + 1.25) % 1;
      const ti = (Math.min(TEX_H - 1, Math.max(0, Math.floor(((Y + 1) / 2) * TEX_H))) * TEX_W + Math.min(TEX_W - 1, Math.floor(u * TEX_W))) * 4;
      rgb = [tex.data[ti], tex.data[ti + 1], tex.data[ti + 2]];
    } else if (gap > 0.025 && gap < 0.055 && (ox * 9 + oz * 9 + Y * 9) % 1 < 0.55 && (ox * 9 + oz * 9 + Y * 9) % 1 > 0) rgb = [214, 168, 112];
    if (gap < 0.09) shade *= 0.62 + 0.38 * Math.max(0, gap / 0.09);
    // felt: a fuzz of lighter and darker fibers
    shade *= 0.92 + 0.16 * hash(Math.round(ox * 70 + Y * 23), Math.round(Y * 70 - oz * 19), Math.round(oz * 70 + ox * 17));
    const p = o * 4;
    out[p] = Math.min(255, rgb[0] * shade);
    out[p + 1] = Math.min(255, rgb[1] * shade);
    out[p + 2] = Math.min(255, rgb[2] * shade);
    out[p + 3] = Math.max(0, Math.min(1, edge[o] + 0.5)) * 255;
  }
  const buf = document.createElement('canvas');
  buf.width = W;
  buf.height = H;
  buf.getContext('2d')!.putImageData(img, 0, 0);
  g.save();
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(buf, box.x, box.y, box.w, box.h);
  g.restore();
}

/**
 * The whiff off the top of the pile in the same box: three wavy green-gray lines of yarn
 * drifting up and fading, over and over, `time` seconds in. Without a time they hold still.
 */
export function drawOdor(g: CanvasRenderingContext2D, box: EggBox, time?: number): void {
  const half = box.h / 2;
  const cx = box.x + box.w / 2;
  const base = box.y + half * 0.85; // just over the top sausage
  g.save();
  g.lineCap = 'round';
  g.lineWidth = Math.max(1, box.h * 0.035);
  for (let k = 0; k < 3; k++) {
    const p = time === undefined ? 0.42 + k * 0.08 : (time * 0.3 + k / 3) % 1;
    const x = cx + (k - 1) * box.w * 0.26;
    const bottom = base - p * half * 0.55;
    const len = half * 0.5;
    g.strokeStyle = `rgba(128, 156, 92, ${(Math.sin(Math.PI * p) * 0.9).toFixed(3)})`;
    g.beginPath();
    for (let j = 0; j <= 16; j++) {
      const f = j / 16;
      const wave = Math.sin(f * Math.PI * 3 + k * 2 + (time ?? 0) * 2) * box.w * 0.05;
      j ? g.lineTo(x + wave, bottom - f * len) : g.moveTo(x + wave, bottom - f * len);
    }
    g.stroke();
  }
  g.restore();
}
