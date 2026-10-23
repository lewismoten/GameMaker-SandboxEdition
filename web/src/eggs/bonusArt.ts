// Drawing the two eggs kept apart from the dozen (bonus.ts): a rotten egg (mottled, pitted,
// cracking a little more with every tap, stench rising), the IOU note inside it, the diamond
// heart that note is for (cut with facets, caged in gold filigree, turning: Mystery Robot Joe's
// trophy for the tin heart hunt, tinHearts/trophy.ts), and a pastry egg like a jeweled imperial egg
// (rose glaze, piped icing, gold leaf, a nest of spun sugar, a clockwork baker on top).
// The shells are painted flat and wrapped round the egg shape pixel by pixel, like the felt
// eggs (eggArt.ts), but lit with a sheen and a bump map so icing stands up and cracks sink.
import { EGG_ASPECT, TEX_H, TEX_W } from './eggArt';

export { EGG_ASPECT };

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A covering for the egg: its colors, how high each spot stands, and which spots are gold. */
export interface Shell {
  color: ImageData;
  height?: Float32Array;
  metal?: Uint8Array;
  /** How glossy (0 felt .. 1 mirror glaze) and how tight the highlight. */
  shine: number;
  gloss: number;
  /** How strongly `height` bends the light. */
  bump: number;
}

function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

/** Value noise on a lattice that wraps across (u), so the seam at the back closes. */
function noise(seed: number): (u: number, v: number, fu: number, fv: number) => number {
  const hash = (x: number, y: number) => {
    let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 982451653);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  return (u, v, fu, fv) => {
    const x = u * fu;
    const y = v * fv;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const sx = x - x0;
    const sy = y - y0;
    const ex = sx * sx * (3 - 2 * sx);
    const ey = sy * sy * (3 - 2 * sy);
    const a = hash(((x0 % fu) + fu) % fu, y0);
    const b = hash((((x0 + 1) % fu) + fu) % fu, y0);
    const c = hash(((x0 % fu) + fu) % fu, y0 + 1);
    const d = hash((((x0 + 1) % fu) + fu) % fu, y0 + 1);
    return a + (b - a) * ex + (c - a) * ey + (a - b - c + d) * ex * ey;
  };
}

const fbm = (n: ReturnType<typeof noise>, u: number, v: number, base: number) => {
  let sum = 0;
  let amp = 0.5;
  let f = base;
  for (let o = 0; o < 4; o++) {
    sum += amp * n(u, v, f, Math.round(f / 2) + 1);
    amp *= 0.5;
    f *= 2;
  }
  return sum / 0.9375;
};

/** Draws `draw` three times across so whatever crosses the seam at u = 0 / 1 closes. */
const wrap = (draw: (dx: number) => void) => [-TEX_W, 0, TEX_W].forEach(draw);

const readLayer = (c: HTMLCanvasElement): Float32Array => {
  const d = c.getContext('2d')!.getImageData(0, 0, TEX_W, TEX_H).data;
  const out = new Float32Array(TEX_W * TEX_H);
  for (let i = 0; i < out.length; i++) out[i] = d[i * 4] / 255;
  return out;
};

// ---- the shell, wrapped and lit -----------------------------------------------------------

const radiusAt = (y: number) => 0.76 * Math.sqrt(Math.max(0, 1 - y * y)) * (1 + 0.13 * y);

/** Draws a shell turned by `turn` radians into `box`, through a buffer of at most `res` rows. */
export function drawShell(g: CanvasRenderingContext2D, shell: Shell, turn: number, box: Box, res = 300): void {
  const H = Math.max(16, Math.min(res, Math.round(box.h)));
  const W = Math.max(12, Math.round((H * box.w) / box.h));
  const img = new ImageData(W, H);
  const out = img.data;
  const src = shell.color.data;
  const { height, metal, shine, gloss, bump } = shell;
  const half = H / 2;
  const cx = W / 2;
  const L = [-0.45, -0.55, 0.7];
  const ln = Math.hypot(L[0], L[1], L[2]);
  L[0] /= ln;
  L[1] /= ln;
  L[2] /= ln;
  // the halfway vector to the viewer, for the glaze's highlight
  let Hx = L[0];
  let Hy = L[1];
  let Hz = L[2] + 1;
  const hl = Math.hypot(Hx, Hy, Hz);
  Hx /= hl;
  Hy /= hl;
  Hz /= hl;
  for (let py = 0; py < H; py++) {
    const y = (py + 0.5 - half) / half;
    const R = radiusAt(y);
    if (R <= 0) continue;
    const dR = (radiusAt(y + 0.002) - radiusAt(y - 0.002)) / 0.004;
    const v = Math.min(TEX_H - 1, Math.max(0, Math.floor(((y + 1) / 2) * TEX_H)));
    for (let px = 0; px < W; px++) {
      const x = (px + 0.5 - cx) / half;
      const edge = (R - Math.abs(x)) * half;
      if (edge <= -0.5) continue;
      const xr = Math.min(R, Math.abs(x)) * Math.sign(x);
      const z = Math.sqrt(Math.max(0, R * R - xr * xr));
      let u = (Math.atan2(xr, z) + turn + Math.PI / 2) / (Math.PI * 2);
      u -= Math.floor(u);
      const tu = Math.min(TEX_W - 1, Math.floor(u * TEX_W));
      const t = v * TEX_W + tu;
      let nx = xr / R;
      let ny = -dR;
      let nz = z / R;
      let nl = Math.hypot(nx, ny, nz);
      nx /= nl;
      ny /= nl;
      nz /= nl;
      let hgt = 0;
      if (height) {
        hgt = height[t];
        const du = (height[v * TEX_W + ((tu + 1) % TEX_W)] - height[v * TEX_W + ((tu + TEX_W - 1) % TEX_W)]) * bump;
        const dv = (height[Math.min(TEX_H - 1, v + 1) * TEX_W + tu] - height[Math.max(0, v - 1) * TEX_W + tu]) * bump;
        // along the turn the surface runs (cos φ, 0, -sin φ); down it runs (0, 1, 0)
        const c = z / R;
        const s = xr / R;
        nx -= du * c;
        nz += du * s;
        ny -= dv;
        nl = Math.hypot(nx, ny, nz);
        nx /= nl;
        ny /= nl;
        nz /= nl;
      }
      const d = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
      const sp = Math.pow(Math.max(0, nx * Hx + ny * Hy + nz * Hz), gloss);
      const o = (py * W + px) * 4;
      const r0 = src[t * 4];
      const g0 = src[t * 4 + 1];
      const b0 = src[t * 4 + 2];
      if (metal && metal[t]) {
        // gold leaf: dark where it faces the floor, bright where it catches the room
        const env = 0.35 + 0.65 * Math.max(0, 0.5 - ny * 0.7 + nx * 0.2);
        const k = 0.25 + 0.55 * d + 0.55 * env;
        out[o] = Math.min(255, r0 * k + sp * 255);
        out[o + 1] = Math.min(255, g0 * k + sp * 235);
        out[o + 2] = Math.min(255, b0 * k + sp * 170);
      } else {
        const k = 0.34 + 0.74 * d;
        // piping and raised spots are matte; the glaze between them shines
        const s = sp * shine * (hgt > 0.12 ? 0.3 : 1) * 255;
        const rim = Math.pow(1 - nz, 3) * shine * 40;
        out[o] = Math.min(255, r0 * k + s + rim);
        out[o + 1] = Math.min(255, g0 * k + s + rim);
        out[o + 2] = Math.min(255, b0 * k + s + rim);
      }
      out[o + 3] = Math.max(0, Math.min(1, edge + 0.5)) * 255;
    }
  }
  const buf = canvas(W, H);
  buf.getContext('2d')!.putImageData(img, 0, 0);
  g.save();
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(buf, box.x, box.y, box.w, box.h);
  g.restore();
}

// ---- the rotten egg -----------------------------------------------------------------------

let rottenBase: { color: ImageData; height: Float32Array } | undefined;

function rottenBaseLayers() {
  if (rottenBase) return rottenBase;
  const n1 = noise(31);
  const n2 = noise(77);
  const n3 = noise(5);
  const rand = rng(1776);
  const color = new ImageData(TEX_W, TEX_H);
  const height = new Float32Array(TEX_W * TEX_H);
  const mix = (a: number[], b: number[], t: number) => a.map((x, i) => x + (b[i] - x) * Math.max(0, Math.min(1, t)));
  const grey = [146, 150, 124];
  const olive = [98, 110, 70];
  const sick = [186, 176, 104];
  const brown = [104, 82, 50];
  const bile = [70, 92, 48];
  for (let y = 0; y < TEX_H; y++) {
    const v = y / TEX_H;
    for (let x = 0; x < TEX_W; x++) {
      const u = x / TEX_W;
      const a = fbm(n1, u, v, 6);
      const b = fbm(n2, u, v, 4);
      const fine = n3(u, v, 96, 48);
      let c = mix(grey, olive, (a - 0.38) * 3);
      c = mix(c, sick, (b - 0.6) * 4);
      c = mix(c, brown, (0.36 - b) * 4);
      // what settled at the bottom
      c = mix(c, bile, (v - 0.72) * 2.6 + (a - 0.5));
      const grain = (fine - 0.5) * 22;
      let pit = 0;
      if (rand() < 0.0035) pit = 1;
      const i = (y * TEX_W + x) * 4;
      color.data[i] = c[0] + grain - pit * 60;
      color.data[i + 1] = c[1] + grain - pit * 60;
      color.data[i + 2] = c[2] + grain - pit * 50;
      color.data[i + 3] = 255;
      height[y * TEX_W + x] = a * 0.35 + fine * 0.12 - pit * 0.4;
    }
  }
  rottenBase = { color, height };
  return rottenBase;
}

type Crack = { pts: [number, number][]; branches: [number, number][][] };
let cracks: Crack[] | undefined;

function crackPaths(): Crack[] {
  if (cracks) return cracks;
  const rand = rng(1313);
  cracks = [];
  for (let k = 0; k < 13; k++) {
    // the first cracks start on the side that faces you
    const u0 = k < 4 ? TEX_W * (0.18 + rand() * 0.14) : rand() * TEX_W;
    let x = u0;
    let y = TEX_H * (0.22 + rand() * 0.55);
    let a = rand() * Math.PI * 2;
    const pts: [number, number][] = [[x, y]];
    const branches: [number, number][][] = [];
    const steps = 7 + Math.floor(rand() * 6);
    for (let s = 0; s < steps; s++) {
      // eggshell cracks run straight, then turn sharply
      a += (rand() - 0.5) * 1.7;
      const len = 9 + rand() * 10;
      x += Math.cos(a) * len * 1.3;
      y = Math.max(TEX_H * 0.08, Math.min(TEX_H * 0.94, y + Math.sin(a) * len));
      pts.push([x, y]);
      if (rand() < 0.13) {
        let bx = x;
        let by = y;
        let ba = a + (rand() < 0.5 ? 1 : -1) * (0.6 + rand() * 0.8);
        const br: [number, number][] = [[bx, by]];
        for (let j = 0; j < 2 + rand() * 2; j++) {
          ba += (rand() - 0.5) * 1.4;
          const l = 4 + rand() * 7;
          bx += Math.cos(ba) * l * 1.3;
          by += Math.sin(ba) * l;
          br.push([bx, by]);
        }
        branches.push(br);
      }
    }
    cracks.push({ pts, branches });
  }
  return cracks;
}

const rottenCache = new Map<number, Shell>();

/** The rotten egg after `taps` taps (0 .. 13): more cracks each time, flakes off near the end. */
export function rottenShell(taps: number): Shell {
  const stage = Math.max(0, Math.min(13, Math.floor(taps)));
  const hit = rottenCache.get(stage);
  if (hit) return hit;
  const base = rottenBaseLayers();
  const col = canvas(TEX_W, TEX_H);
  const cg = col.getContext('2d')!;
  cg.putImageData(base.color, 0, 0);
  const dent = canvas(TEX_W, TEX_H);
  const dg = dent.getContext('2d')!;
  dg.fillStyle = '#000';
  dg.fillRect(0, 0, TEX_W, TEX_H);
  const rand = rng(99);
  const all = crackPaths();
  const path = (g: CanvasRenderingContext2D, pts: [number, number][], upto: number, dx: number) => {
    const n = Math.max(2, Math.round(pts.length * upto));
    g.beginPath();
    pts.slice(0, n).forEach(([x, y], i) => (i ? g.lineTo(x + dx, y) : g.moveTo(x + dx, y)));
  };
  for (let k = 0; k < Math.min(stage, all.length); k++) {
    // a crack runs on a little further with every tap after it opened
    const grow = Math.min(1, 0.35 + (stage - k) * 0.22);
    const { pts, branches } = all[k];
    const w = 1.1 + Math.min(1.6, (stage - k) * 0.16);
    wrap((dx) => {
      cg.lineJoin = dg.lineJoin = 'round';
      cg.lineCap = dg.lineCap = 'round';
      // a chipped light edge under the dark line
      cg.strokeStyle = 'rgba(226, 222, 190, 0.5)';
      cg.lineWidth = w + 1.2;
      cg.save();
      cg.translate(0.8, 1);
      path(cg, pts, grow, dx);
      cg.stroke();
      cg.restore();
      cg.strokeStyle = '#1b1d12';
      cg.lineWidth = w;
      path(cg, pts, grow, dx);
      cg.stroke();
      dg.strokeStyle = '#fff';
      dg.lineWidth = w + 1;
      path(dg, pts, grow, dx);
      dg.stroke();
      if (grow > 0.7)
        for (const br of branches) {
          cg.lineWidth = w * 0.6;
          path(cg, br, 1, dx);
          cg.stroke();
          dg.lineWidth = w * 0.6 + 0.8;
          path(dg, br, 1, dx);
          dg.stroke();
        }
    });
  }
  // near the end, flakes of shell fall away: dark inside, and something glinting in there
  if (stage >= 8) {
    const flakes = (stage - 7) * 3;
    const r2 = rng(4242);
    for (let f = 0; f < flakes; f++) {
      const c = all[f % all.length];
      const [px, py] = c.pts[Math.floor(r2() * c.pts.length)];
      const r = 4 + r2() * 6 + (stage - 8) * 0.8;
      const pts: [number, number][] = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + r2();
        const rr = r * (0.55 + r2() * 0.6);
        pts.push([px + Math.cos(a) * rr * 1.3, py + Math.sin(a) * rr]);
      }
      wrap((dx) => {
        cg.fillStyle = '#16180f';
        path(cg, [...pts, pts[0]], 1, dx);
        cg.fill();
        cg.strokeStyle = 'rgba(214, 208, 170, 0.6)';
        cg.lineWidth = 1;
        cg.stroke();
        dg.fillStyle = '#fff';
        path(dg, [...pts, pts[0]], 1, dx);
        dg.fill();
        if (rand() < 0.7) {
          cg.fillStyle = ['#ffffff', '#ffe7f0', '#d8f0ff'][f % 3];
          cg.fillRect(px + dx - 0.5, py - 0.5, 1.6, 1.6);
        }
      });
    }
  }
  const sunk = readLayer(dent);
  const height = new Float32Array(base.height.length);
  for (let i = 0; i < height.length; i++) height[i] = base.height[i] - sunk[i] * 0.55;
  const shell: Shell = { color: cg.getImageData(0, 0, TEX_W, TEX_H), height, shine: 0.16, gloss: 10, bump: 1.6 };
  rottenCache.set(stage, shell);
  return shell;
}

/** A puff of stench, painted once: many soft blobs of sickly green. */
export function stinkPuff(seed: number): HTMLCanvasElement {
  const c = canvas(128, 128);
  const g = c.getContext('2d')!;
  const rand = rng(seed * 7919 + 3);
  const tints = ['164, 196, 92', '128, 170, 72', '196, 206, 120', '98, 140, 60', '176, 186, 96'];
  for (let i = 0; i < 46; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.pow(rand(), 0.7) * 24;
    const x = 64 + Math.cos(a) * d * 1.1;
    const y = 64 + Math.sin(a) * d * 0.85;
    const r = 10 + rand() * 24;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    const t = tints[Math.floor(rand() * tints.length)];
    const al = 0.06 + rand() * 0.1;
    grd.addColorStop(0, `rgba(${t}, ${al})`);
    grd.addColorStop(0.6, `rgba(${t}, ${al * 0.5})`);
    grd.addColorStop(1, `rgba(${t}, 0)`);
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

/** A few shards of rotten shell lying where they fell, around a spot on the floor. */
export function drawRestingShards(g: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  const rand = rng(1301);
  for (let i = 0; i < 9; i++) {
    const side = i % 2 ? 1 : -1;
    const x = cx + side * size * (0.28 + rand() * 0.5);
    const y = cy + (rand() - 0.4) * size * 0.1;
    const r = size * (0.05 + rand() * 0.06);
    g.save();
    g.translate(x, y);
    g.rotate((rand() - 0.5) * 1.4);
    // a curved bit of shell: outside mottled, the inner edge pale
    const grd = g.createLinearGradient(0, -r, 0, r * 0.5);
    grd.addColorStop(0, '#9aa07e');
    grd.addColorStop(1, '#5d6744');
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(-r, 0);
    g.quadraticCurveTo(-r * 0.4, -r * (0.7 + rand() * 0.5), r * (0.6 + rand() * 0.5), -r * 0.2);
    g.lineTo(r * 0.7, r * 0.15);
    g.quadraticCurveTo(0, -r * 0.2, -r, 0);
    g.fill();
    g.strokeStyle = 'rgba(222, 216, 182, 0.7)';
    g.lineWidth = Math.max(0.6, size * 0.006);
    g.stroke();
    g.restore();
  }
}

// ---- the diamond heart --------------------------------------------------------------------

type V3 = [number, number, number];
interface Face {
  pts: V3[];
  table?: boolean;
}

const HEART_N = 32;
let heartMesh: { faces: Face[]; girdle: V3[]; scrolls: V3[][]; beads: V3[]; bail: V3[] } | undefined;

function heartOutline(): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < HEART_N; i++) {
    const t = (i / HEART_N) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push([x / 17, (y + 2) / 17]);
  }
  return pts;
}

function buildHeart() {
  if (heartMesh) return heartMesh;
  const out = heartOutline();
  const girdle: V3[] = out.map(([x, y]) => [x, y, 0]);
  const mid = (i: number, k: number, z: number): V3 => {
    const a = out[i];
    const b = out[(i + 1) % HEART_N];
    return [((a[0] + b[0]) / 2) * k, ((a[1] + b[1]) / 2) * k + 0.04 * (1 - k), z];
  };
  // the crown: star facets from the girdle up to a ring, then kites up to the table
  const crown = out.map((_, i) => mid(i, 0.8, 0.12));
  const table: V3[] = out.map(([x, y]) => [x * 0.5, y * 0.5 + 0.02, 0.21]);
  const pav = out.map((_, i) => mid(i, 0.5, -0.26));
  const culet: V3 = [0, 0.1, -0.4];
  const faces: Face[] = [];
  for (let i = 0; i < HEART_N; i++) {
    const j = (i + 1) % HEART_N;
    const p = (i + HEART_N - 1) % HEART_N;
    faces.push({ pts: [girdle[i], girdle[j], crown[i]] });
    faces.push({ pts: [crown[p], girdle[i], crown[i]] });
    faces.push({ pts: [crown[p], crown[i], table[i]] });
    faces.push({ pts: [table[i], crown[i], table[j]] });
    faces.push({ pts: [girdle[j], girdle[i], pav[i]] });
    faces.push({ pts: [girdle[i], pav[p], pav[i]] });
    faces.push({ pts: [pav[i], pav[p], culet] });
  }
  faces.push({ pts: [...table], table: true });
  // gold scrolls round the outside, in the heart's own plane, and a bead at each
  const scrolls: V3[][] = [];
  const beads: V3[] = [];
  for (let i = 2; i < HEART_N; i += 4) {
    const [x, y] = out[i];
    const [ax, ay] = out[(i + HEART_N - 1) % HEART_N];
    const [bx, by] = out[(i + 1) % HEART_N];
    let tx = bx - ax;
    let ty = by - ay;
    const tl = Math.hypot(tx, ty);
    tx /= tl;
    ty /= tl;
    // outward: the tangent turned a quarter (the outline runs clockwise on screen)
    const ox = ty;
    const oy = -tx;
    beads.push([x + ox * 0.06, y + oy * 0.06, 0]);
    for (const side of [1, -1]) {
      const pts: V3[] = [];
      for (let k = 0; k <= 18; k++) {
        const a = (k / 18) * Math.PI * 1.6;
        const r = 0.085 * (1 - k / 26);
        const cxs = 0.13;
        const ca = Math.cos(a) * r;
        const sa = Math.sin(a) * r * side;
        pts.push([x + ox * (cxs - ca) + tx * (sa + side * 0.05), y + oy * (cxs - ca) + ty * (sa + side * 0.05), 0]);
      }
      scrolls.push(pts);
    }
  }
  const bail: V3[] = [];
  for (let k = 0; k <= 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    bail.push([Math.cos(a) * 0.075, out[0][1] - 0.13 + Math.sin(a) * 0.075, 0]);
  }
  heartMesh = { faces, girdle, scrolls, beads, bail };
  return heartMesh;
}

/**
 * The diamond heart, turned by `turn` about its upright axis, `size` across, centered at
 * (cx, cy). `time` (seconds) makes the sparkles twinkle; pass a fixed time to hold them still.
 */
export function drawHeart(g: CanvasRenderingContext2D, cx: number, cy: number, size: number, turn: number, time: number): void {
  const mesh = buildHeart();
  const tilt = -0.22;
  const ct = Math.cos(turn);
  const st = Math.sin(turn);
  const cxl = Math.cos(tilt);
  const sxl = Math.sin(tilt);
  const s = size / 2;
  const view = (p: V3): V3 => {
    const x = p[0] * ct + p[2] * st;
    const z0 = -p[0] * st + p[2] * ct;
    const y = p[1] * cxl - z0 * sxl;
    const z = p[1] * sxl + z0 * cxl;
    return [x, y, z];
  };
  const proj = (v: V3): [number, number] => {
    const f = 4 / (4 - v[2]);
    return [cx + v[0] * f * s, cy + v[1] * f * s];
  };
  type Drawn = { scr: [number, number][]; n: V3; z: number; table?: boolean };
  const drawn: Drawn[] = mesh.faces.map((f) => {
    const vs = f.pts.map(view);
    const a = vs[0];
    const b = vs[1];
    const c = vs[2];
    const ux = b[0] - a[0],
      uy = b[1] - a[1],
      uz = b[2] - a[2];
    const wx = c[0] - a[0],
      wy = c[1] - a[1],
      wz = c[2] - a[2];
    let n: V3 = [uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx];
    const nl = Math.hypot(...n) || 1;
    n = [n[0] / nl, n[1] / nl, n[2] / nl];
    // outward: away from the heart's middle
    const m = vs.reduce<V3>((acc, p) => [acc[0] + p[0] / vs.length, acc[1] + p[1] / vs.length, acc[2] + p[2] / vs.length], [0, 0, 0]);
    const c0 = view([0, 0.05, 0]);
    if (n[0] * (m[0] - c0[0]) + n[1] * (m[1] - c0[1]) + n[2] * (m[2] - c0[2]) < 0) n = [-n[0], -n[1], -n[2]];
    return { scr: vs.map(proj), n, z: m[2], table: f.table };
  });
  const fill = (d: Drawn) => {
    g.beginPath();
    d.scr.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
  };
  // gold behind and in front of the stone, split at the heart's plane
  const gold = (front: boolean) => {
    const line = (pts: V3[], w: number, closed = false) => {
      const vs = pts.map(view);
      const runs: [number, number][][] = [];
      let run: [number, number][] | undefined;
      for (let i = 0; i < vs.length - (closed ? 0 : 1); i++) {
        const a = vs[i];
        const b = vs[(i + 1) % vs.length];
        if (a[2] + b[2] >= 0 !== front) {
          run = undefined;
          continue;
        }
        if (!run) runs.push((run = [proj(a)]));
        run.push(proj(b));
      }
      for (const [col, k] of [
        ['#7a5414', 1],
        ['#d9a63c', 0.62],
        ['#fff0b8', 0.22],
      ] as const) {
        g.strokeStyle = col;
        g.lineWidth = Math.max(0.6, w * k);
        for (const r of runs) {
          g.beginPath();
          r.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
          g.stroke();
        }
      }
    };
    g.lineCap = 'round';
    g.lineJoin = 'round';
    line(
      mesh.girdle.map(([x, y, z]) => [x * 1.025, y * 1.025, z] as V3),
      size * 0.04,
      true,
    );
    for (const sc of mesh.scrolls) line(sc, size * 0.016);
    line(mesh.bail, size * 0.022, true);
    for (const b of mesh.beads) {
      const v = view(b);
      if (v[2] >= 0 !== front) continue;
      const [x, y] = proj(v);
      const r = size * 0.022;
      const grd = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
      grd.addColorStop(0, '#fff6cf');
      grd.addColorStop(0.5, '#e0b048');
      grd.addColorStop(1, '#6e4a10');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  };
  g.save();
  gold(false);
  // the far facets, seen through the stone (and through the table): hard light and dark, with fire
  const glints: [number, number, number][] = [];
  drawn.forEach((d, i) => {
    if (d.n[2] > 0) return;
    const [nx, ny] = d.n;
    const b = Math.pow(0.5 + 0.5 * Math.sin(nx * 9 + ny * 6 + turn * 1.5 + i * 0.7), 3);
    const [fr, fg, fb] = hsl(((((nx + ny) * 0.8 + turn * 0.2 + i * 0.13) % 1) + 1) % 1, 0.85, 0.62);
    const r = Math.round(40 + 215 * b * 0.75 + fr * 0.25 * b);
    const gg = Math.round(50 + 205 * b * 0.75 + fg * 0.25 * b);
    const bb = Math.round(80 + 175 * b * 0.75 + fb * 0.25 * b);
    fill(d);
    g.fillStyle = `rgba(${r}, ${gg}, ${bb}, 0.85)`;
    g.fill();
  });
  // looking down through the table: the pavilion's facets, folded back on themselves
  const kaleidoscope = (t: Drawn) => {
    const mx = t.scr.reduce((a, p) => a + p[0], 0) / t.scr.length;
    const my = t.scr.reduce((a, p) => a + p[1], 0) / t.scr.length;
    g.save();
    fill(t);
    g.clip();
    g.fillStyle = 'rgb(40, 44, 70)';
    g.fill();
    drawn.forEach((d, i) => {
      if (d.table || d.n[2] > 0) return;
      const b = Math.pow(0.5 + 0.5 * Math.sin(i * 2.1 + turn * 3), 4);
      const [fr, fg, fb] = hsl((i * 0.071 + turn * 0.1) % 1, 0.9, 0.62);
      const k = 0.25 * (1 - b);
      g.fillStyle = `rgb(${Math.round((50 + 205 * b) * (1 - k) + fr * k)}, ${Math.round((54 + 200 * b) * (1 - k) + fg * k)}, ${Math.round((80 + 175 * b) * (1 - k) + fb * k)})`;
      g.beginPath();
      d.scr.forEach(([x, y], j) => {
        // turned half round and drawn smaller, as a reflection would be
        const px = mx - (x - mx) * 0.62;
        const py = my - (y - my) * 0.62;
        if (j) g.lineTo(px, py);
        else g.moveTo(px, py);
      });
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      g.lineWidth = Math.max(0.5, size * 0.003);
      g.stroke();
    });
    g.restore();
    fill(t);
    g.fillStyle = 'rgba(255, 236, 244, 0.12)';
    g.fill();
    g.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    g.lineWidth = Math.max(0.5, size * 0.005);
    g.stroke();
  };
  // the near facets: a studio's bright strips and dark gaps, a blush of rose, a little fire
  for (const d of drawn.filter((d) => d.n[2] > 0).sort((a, b) => a.z - b.z)) {
    if (d.table) {
      kaleidoscope(d);
      continue;
    }
    const [nx, ny, nz] = d.n;
    const rx = 2 * nz * nx;
    const ry = 2 * nz * ny;
    let env = ry < -0.3 ? 0.92 : 0.5 + 0.5 * Math.sin(rx * 8 + ry * 4 + 1.3 + turn * 0.5);
    env = Math.max(0, Math.min(1, env));
    const b = 0.15 + 0.85 * Math.pow(env, 1.6);
    const hue = (((nx * 1.7 + ny * 2.3 + turn * 0.25) % 1) + 1) % 1;
    const fire = 0.28 * (1 - b * 0.5);
    const [fr, fg, fb] = hsl(hue, 0.9, 0.6);
    const lo = [44, 46, 74];
    const hi = [255, 236, 244];
    const mixc = (k: number) => Math.round((lo[k] + (hi[k] - lo[k]) * b) * (1 - fire) + [fr, fg, fb][k] * fire);
    fill(d);
    g.fillStyle = `rgba(${mixc(0)}, ${mixc(1)}, ${mixc(2)}, ${d.table ? 0.28 : 0.8})`;
    g.fill();
    g.strokeStyle = `rgba(255, 255, 255, ${0.2 + b * 0.35})`;
    g.lineWidth = Math.max(0.5, size * 0.004);
    g.stroke();
    if (b > 0.85 && !d.table) glints.push([d.scr[0][0], d.scr[0][1], b]);
  }
  gold(true);
  // sparkles: a few of the brightest corners twinkle in turn
  g.globalCompositeOperation = 'lighter';
  glints.slice(0, 7).forEach(([x, y], i) => {
    const tw = Math.pow(Math.max(0, Math.sin(time * 2.6 + i * 1.9)), 6);
    if (tw < 0.05) return;
    star(g, x, y, size * 0.09 * tw, tw);
  });
  g.restore();
}

function star(g: CanvasRenderingContext2D, x: number, y: number, r: number, a: number): void {
  const grd = g.createRadialGradient(x, y, 0, x, y, r * 0.5);
  grd.addColorStop(0, `rgba(255, 255, 255, ${a})`);
  grd.addColorStop(1, 'rgba(255, 255, 255, 0)');
  g.fillStyle = grd;
  g.beginPath();
  g.arc(x, y, r * 0.5, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = `rgba(255, 255, 255, ${a * 0.9})`;
  g.lineWidth = Math.max(0.6, r * 0.05);
  g.beginPath();
  g.moveTo(x - r, y);
  g.lineTo(x + r, y);
  g.moveTo(x, y - r);
  g.lineTo(x, y + r);
  g.stroke();
}

function hsl(h: number, s: number, l: number): [number, number, number] {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

// ---- the pastry egg -----------------------------------------------------------------------

let pastry: Shell | undefined;

/** The pastry egg's covering: rose glaze, white piping, gold leaf and a baked foot. */
export function pastryShell(): Shell {
  if (pastry) return pastry;
  const layers = { color: canvas(TEX_W, TEX_H), height: canvas(TEX_W, TEX_H), metal: canvas(TEX_W, TEX_H) };
  const C = layers.color.getContext('2d')!;
  const Hh = layers.height.getContext('2d')!;
  const M = layers.metal.getContext('2d')!;
  Hh.fillStyle = M.fillStyle = '#000';
  Hh.fillRect(0, 0, TEX_W, TEX_H);
  M.fillRect(0, 0, TEX_W, TEX_H);
  const rand = rng(1313);
  const V = (f: number) => TEX_H * f;
  // the glaze: rose, a touch deeper toward the foot, engine-turned like enamel
  const bg = C.createLinearGradient(0, 0, 0, TEX_H);
  bg.addColorStop(0, '#f7c6d2');
  bg.addColorStop(0.6, '#eda5b8');
  bg.addColorStop(1, '#de8ea4');
  C.fillStyle = bg;
  C.fillRect(0, 0, TEX_W, TEX_H);
  C.strokeStyle = 'rgba(160, 50, 90, 0.09)';
  C.lineWidth = 1;
  for (let k = 0; k < 90; k++) {
    C.beginPath();
    for (let x = 0; x <= TEX_W; x += 4) C.lineTo(x, k * 3 + Math.sin((x / TEX_W) * Math.PI * 24 + k * 0.6) * 3);
    C.stroke();
  }
  const piped = (draw: (g: CanvasRenderingContext2D) => void, w: number) =>
    wrap((dx) => {
      for (const g of [C, Hh]) {
        g.save();
        g.translate(dx, 0);
        g.lineCap = g.lineJoin = 'round';
        if (g === C) {
          g.strokeStyle = 'rgba(150, 70, 90, 0.35)';
          g.lineWidth = w + 1.5;
          g.save();
          g.translate(0.6, 1.2);
          draw(g);
          g.stroke();
          g.restore();
          g.strokeStyle = '#fff6ee';
          g.lineWidth = w;
          draw(g);
          g.stroke();
        } else {
          g.strokeStyle = '#555';
          g.lineWidth = w;
          draw(g);
          g.stroke();
          g.strokeStyle = '#bbb';
          g.lineWidth = w * 0.55;
          draw(g);
          g.stroke();
        }
        g.restore();
      }
    });
  const pearl = (x: number, y: number, r: number) =>
    wrap((dx) => {
      const px = x + dx;
      const c = C.createRadialGradient(px - r * 0.4, y - r * 0.4, 0, px, y, r * 1.3);
      c.addColorStop(0, '#ffffff');
      c.addColorStop(0.7, '#f6ece4');
      c.addColorStop(1, '#c99aa4');
      C.fillStyle = c;
      C.beginPath();
      C.ellipse(px, y, r * 1.3, r, 0, 0, Math.PI * 2);
      C.fill();
      const hgt = Hh.createRadialGradient(px, y, 0, px, y, r * 1.3);
      hgt.addColorStop(0, '#fff');
      hgt.addColorStop(1, '#000');
      Hh.fillStyle = hgt;
      Hh.beginPath();
      Hh.ellipse(px, y, r * 1.3, r, 0, 0, Math.PI * 2);
      Hh.fill();
    });
  const goldBand = (y0: number, y1: number) => {
    const grd = C.createLinearGradient(0, y0, 0, y1);
    grd.addColorStop(0, '#f6d77a');
    grd.addColorStop(0.5, '#d4a23a');
    grd.addColorStop(1, '#b98422');
    C.fillStyle = grd;
    C.fillRect(0, y0, TEX_W, y1 - y0);
    // the leaf's creases
    C.strokeStyle = 'rgba(120, 80, 10, 0.35)';
    C.lineWidth = 0.8;
    for (let x = 0; x < TEX_W; x += 7 + rand() * 9) {
      C.beginPath();
      C.moveTo(x, y0);
      C.lineTo(x + (rand() - 0.5) * 8, y1);
      C.stroke();
    }
    M.fillStyle = '#fff';
    M.fillRect(0, y0, TEX_W, y1 - y0);
    Hh.fillStyle = '#333';
    Hh.fillRect(0, y0, TEX_W, y1 - y0);
  };
  // the crown ring and the waist, in gold leaf
  goldBand(V(0.1), V(0.135));
  goldBand(V(0.53), V(0.575));
  // pearls along each band
  for (let x = 4; x < TEX_W; x += 10) {
    pearl(x, V(0.158), 3.2);
    pearl(x + 5, V(0.512), 2.8);
    pearl(x, V(0.594), 2.8);
    pearl(x + 5, V(0.865), 3);
  }
  // swags hanging from the crown, a rosette where each pair meets
  const swags = 8;
  for (let k = 0; k < swags; k++) {
    const x0 = (k / swags) * TEX_W;
    const x1 = ((k + 1) / swags) * TEX_W;
    piped((g) => {
      g.beginPath();
      g.moveTo(x0, V(0.19));
      g.quadraticCurveTo((x0 + x1) / 2, V(0.44), x1, V(0.19));
    }, 3.2);
    piped((g) => {
      g.beginPath();
      g.moveTo(x0 + 8, V(0.2));
      g.quadraticCurveTo((x0 + x1) / 2, V(0.36), x1 - 8, V(0.2));
    }, 2);
    // a pearl drop under each swag
    pearl((x0 + x1) / 2, V(0.34) + 2, 2.6);
    pearl((x0 + x1) / 2, V(0.38) + 2, 2.2);
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * Math.PI * 2;
      pearl(x0 + Math.cos(a) * 5.2, V(0.2) + Math.sin(a) * 4, 2.2);
    }
    pearl(x0, V(0.2), 2);
  }
  // the trellis below the waist
  const top = V(0.62);
  const bottom = V(0.84);
  for (let x = -64; x < TEX_W + 64; x += 21.33) {
    piped((g) => {
      g.beginPath();
      g.moveTo(x, top);
      g.lineTo(x + (bottom - top) * 1.3, bottom);
      g.moveTo(x, top);
      g.lineTo(x - (bottom - top) * 1.3, bottom);
    }, 1.8);
  }
  for (let x = 0; x < TEX_W; x += 21.33) pearl(x, (top + bottom) / 2, 1.8);
  // the foot, where the glaze stops: baked pastry
  const crust = V(0.9);
  for (let y = Math.floor(crust); y < TEX_H; y++)
    for (let x = 0; x < TEX_W; x += 2) {
      const t = rand();
      C.fillStyle = t < 0.1 ? '#8a5522' : t < 0.4 ? '#c98a43' : '#d9a05a';
      C.fillRect(x, y, 2, 1);
    }
  Hh.fillStyle = '#1a1a1a';
  Hh.fillRect(0, crust, TEX_W, TEX_H - crust);
  // a drip edge of glaze over the crust
  C.fillStyle = '#de8ea4';
  for (let x = 0; x < TEX_W; x += 6) {
    const d = 2 + rand() * 7;
    C.beginPath();
    C.ellipse(x + 3, crust, 3.5, d, 0, 0, Math.PI * 2);
    C.fill();
  }
  // flecks of edible gold leaf, wherever they landed
  for (let f = 0; f < 90; f++) {
    const x = rand() * TEX_W;
    const y = V(0.22 + rand() * 0.62);
    const r = 1.5 + rand() * 3.5;
    const pts: [number, number][] = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + rand();
      pts.push([x + Math.cos(a) * r * (0.5 + rand()) * 1.3, y + Math.sin(a) * r * (0.5 + rand())]);
    }
    wrap((dx) => {
      for (const [g, col] of [
        [C, rand() < 0.5 ? '#e8bf55' : '#f4d98a'],
        [M, '#fff'],
      ] as const) {
        g.fillStyle = col;
        g.beginPath();
        pts.forEach(([px, py], i) => (i ? g.lineTo(px + dx, py) : g.moveTo(px + dx, py)));
        g.fill();
      }
    });
  }
  const metalF = readLayer(layers.metal);
  const metal = new Uint8Array(metalF.length);
  for (let i = 0; i < metal.length; i++) metal[i] = metalF[i] > 0.5 ? 1 : 0;
  pastry = { color: C.getImageData(0, 0, TEX_W, TEX_H), height: readLayer(layers.height), metal, shine: 0.85, gloss: 40, bump: 2.4 };
  return pastry;
}

type Thread = { rx: number; dy: number; tilt: number; a0: number; sweep: number; color: string; w: number; shine: boolean };
let nest: { cup: Thread[]; foot: { a: number; bend: number; color: string; w: number }[]; ring: Thread[] } | undefined;

function sugarThreads() {
  if (nest) return nest;
  const rand = rng(2024);
  const amber = () => `hsla(${28 + rand() * 14}, ${82 + rand() * 16}%, ${32 + rand() * 26}%, ${0.25 + rand() * 0.4})`;
  const thread = (rx0: number, rx1: number): Thread => ({
    rx: rx0 + rand() * (rx1 - rx0),
    dy: (rand() - 0.5) * 0.5,
    tilt: (rand() - 0.5) * 0.25,
    a0: rand() * Math.PI * 2,
    sweep: 1.2 + rand() * 3.6,
    color: amber(),
    w: 0.6 + rand() * 1.1,
    shine: rand() < 0.35,
  });
  nest = {
    cup: Array.from({ length: 120 }, () => thread(0.82, 1.14)),
    foot: Array.from({ length: 70 }, () => ({ a: rand() * Math.PI * 2, bend: (rand() - 0.5) * 0.6, color: amber(), w: 0.6 + rand() * 0.9 })),
    ring: Array.from({ length: 40 }, () => thread(0.5, 0.7)),
  };
  return nest;
}

/**
 * The spun-sugar holder round an egg in `box`: `part` 'back' is drawn before the egg, 'front'
 * after it. It turns with the egg.
 */
export function drawSugarNest(g: CanvasRenderingContext2D, box: Box, turn: number, part: 'back' | 'front'): void {
  const n = sugarThreads();
  const cx = box.x + box.w / 2;
  const cupY = box.y + box.h * 0.82;
  const R = box.w * 0.5;
  const squash = 0.26;
  const k = box.h / 300;
  const front = part === 'front';
  g.save();
  g.lineCap = 'round';
  const ellipse = (t: Thread, y0: number, R0: number) => {
    const pts: [number, number, boolean][] = [];
    const steps = Math.ceil(t.sweep * 10);
    for (let i = 0; i <= steps; i++) {
      const a = t.a0 + turn + (i / steps) * t.sweep;
      const x = Math.cos(a) * R0 * t.rx;
      const y = Math.sin(a) * R0 * t.rx * squash;
      // tilted a little out of true, as spun sugar is
      pts.push([cx + x, y0 + y + x * t.tilt + t.dy * R0 * 0.25, Math.sin(a) > 0]);
    }
    for (const pass of [0, 1]) {
      if (pass && !t.shine) break;
      g.strokeStyle = pass ? 'rgba(255, 244, 210, 0.75)' : t.color;
      g.lineWidth = Math.max(0.4, (pass ? 0.4 : t.w) * Math.min(1.2, k));
      g.beginPath();
      let pen = false;
      for (const [x, y, isFront] of pts) {
        if (isFront !== front) {
          pen = false;
          continue;
        }
        if (pen) g.lineTo(x, y);
        else g.moveTo(x, y);
        pen = true;
      }
      g.stroke();
    }
  };
  // the foot: threads flaring down from under the cup to a ring on the table
  const footY = box.y + box.h * 1.03;
  for (const f of n.foot) {
    const a = f.a + turn;
    const isFront = Math.sin(a) > 0;
    if (isFront !== front) continue;
    const x0 = cx + Math.cos(a) * R * 0.42;
    const y0 = cupY + Math.sin(a) * R * 0.42 * squash + R * 0.16;
    const x1 = cx + Math.cos(a + f.bend) * R * 0.62;
    const y1 = footY + Math.sin(a + f.bend) * R * 0.62 * squash;
    g.strokeStyle = f.color;
    g.lineWidth = Math.max(0.4, f.w * Math.min(1.2, k));
    g.beginPath();
    g.moveTo(x0, y0);
    g.quadraticCurveTo(cx + Math.cos(a) * R * 0.3, (y0 + y1) / 2 + R * 0.05, x1, y1);
    g.stroke();
  }
  for (const t of n.ring) ellipse(t, footY, R);
  for (const t of n.cup) ellipse(t, cupY, R);
  g.restore();
}

/**
 * The clockwork baker standing on a gold disc at (x, y) (the egg's crown), `s` tall,
 * turned `a` radians (0 faces you).
 */
export function drawBaker(g: CanvasRenderingContext2D, x: number, y: number, s: number, a: number): void {
  const sa = Math.sin(a);
  const ca = Math.cos(a);
  // a point on the figure: `side` along its shoulders, `fwd` the way it faces
  const at = (side: number, fwd: number, up: number): [number, number, number] => [x + (side * ca + fwd * sa) * s, y - up * s, -side * sa + fwd * ca];
  g.save();
  // the turntable
  const disc = g.createLinearGradient(x - s * 0.3, 0, x + s * 0.3, 0);
  disc.addColorStop(0, '#fff0b0');
  disc.addColorStop(0.45, '#d6a23c');
  disc.addColorStop(1, '#7a5214');
  g.fillStyle = '#6e4a10';
  g.beginPath();
  g.ellipse(x, y + s * 0.03, s * 0.3, s * 0.08, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = disc;
  g.beginPath();
  g.ellipse(x, y, s * 0.3, s * 0.08, 0, 0, Math.PI * 2);
  g.fill();
  type Part = { z: number; draw: () => void };
  const parts: Part[] = [];
  const limb = (p0: [number, number, number], p1: [number, number, number], w: number, color: string) =>
    parts.push({
      z: (p0[2] + p1[2]) / 2,
      draw: () => {
        g.strokeStyle = color;
        g.lineWidth = w * s;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(p0[0], p0[1]);
        g.lineTo(p1[0], p1[1]);
        g.stroke();
      },
    });
  // legs in checked trousers
  for (const side of [-0.07, 0.07]) limb(at(side, 0, 0.02), at(side, 0, 0.24), 0.075, '#3b3550');
  // arms out front, holding a rolling pin
  for (const side of [-1, 1]) limb(at(side * 0.15, 0, 0.5), at(side * 0.11, 0.17, 0.38), 0.065, '#f5f2ea');
  const pinA = at(-0.24, 0.19, 0.38);
  const pinB = at(0.24, 0.19, 0.38);
  limb(pinA, pinB, 0.07, '#b0773a');
  limb(at(-0.3, 0.19, 0.38), pinA, 0.03, '#7a4c1e');
  limb(pinB, at(0.3, 0.19, 0.38), 0.03, '#7a4c1e');
  // the wind-up key in its back
  const key = at(0, -0.17, 0.42);
  parts.push({
    z: key[2],
    draw: () => {
      g.strokeStyle = '#b8862b';
      g.lineWidth = 0.025 * s;
      const [kx, ky] = key;
      const [bx] = at(0, -0.1, 0.42);
      g.beginPath();
      g.moveTo(bx, ky);
      g.lineTo(kx, ky);
      g.stroke();
      g.fillStyle = '#e0b04a';
      for (const d of [-1, 1]) {
        g.beginPath();
        g.ellipse(kx + (kx - bx) * 0.2, ky + d * 0.045 * s, Math.max(0.5, Math.abs(ca) * 0.045 * s + 0.01 * s), 0.04 * s, 0, 0, Math.PI * 2);
        g.fill();
      }
    },
  });
  // the body: a baker's white jacket, lit from the left
  parts.push({
    z: 0,
    draw: () => {
      const jacket = g.createLinearGradient(x - s * 0.18, 0, x + s * 0.18, 0);
      jacket.addColorStop(0, '#ffffff');
      jacket.addColorStop(0.6, '#e6e1d6');
      jacket.addColorStop(1, '#a9a396');
      g.fillStyle = jacket;
      g.beginPath();
      g.ellipse(x, y - s * 0.4, s * 0.17, s * 0.19, 0, 0, Math.PI * 2);
      g.fill();
      if (ca > 0) {
        // two rows of gold buttons, and the apron
        g.globalAlpha = Math.min(1, ca * 2);
        g.fillStyle = '#f1e7cf';
        g.beginPath();
        const ax = x + sa * 0.06 * s;
        g.moveTo(ax - 0.1 * s * ca, y - 0.36 * s);
        g.lineTo(ax + 0.1 * s * ca, y - 0.36 * s);
        g.lineTo(ax + 0.13 * s * ca, y - 0.2 * s);
        g.lineTo(ax - 0.13 * s * ca, y - 0.2 * s);
        g.fill();
        g.fillStyle = '#d4a23a';
        for (const side of [-0.05, 0.05])
          for (const up of [0.46, 0.53]) {
            const [bx, by] = at(side, 0.16, up);
            g.beginPath();
            g.arc(bx, by, 0.016 * s, 0, Math.PI * 2);
            g.fill();
          }
        g.globalAlpha = 1;
      }
    },
  });
  // the head, its mustache, and a tall pleated toque
  parts.push({
    z: 0.01,
    draw: () => {
      const hx = x;
      const hy = y - s * 0.68;
      const face = g.createRadialGradient(hx - s * 0.04, hy - s * 0.04, 0, hx, hy, s * 0.12);
      face.addColorStop(0, '#fbe0c2');
      face.addColorStop(1, '#d9a37a');
      g.fillStyle = face;
      g.beginPath();
      g.arc(hx, hy, s * 0.11, 0, Math.PI * 2);
      g.fill();
      if (ca > 0.05) {
        g.globalAlpha = Math.min(1, ca * 2);
        g.fillStyle = '#2a1a10';
        for (const side of [-0.04, 0.04]) {
          const [ex, ey] = at(side, 0.1, 0.7);
          g.beginPath();
          g.arc(ex, ey, 0.014 * s, 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = '#e88c8c';
        for (const side of [-0.065, 0.065]) {
          const [ex, ey] = at(side, 0.09, 0.655);
          g.beginPath();
          g.arc(ex, ey, 0.02 * s, 0, Math.PI * 2);
          g.fill();
        }
        // a curled mustache
        g.strokeStyle = '#4a2c18';
        g.lineWidth = 0.022 * s;
        const [m0x, m0y] = at(-0.055, 0.1, 0.64);
        const [m1x, m1y] = at(0, 0.11, 0.645);
        const [m2x, m2y] = at(0.055, 0.1, 0.64);
        g.beginPath();
        g.moveTo(m0x, m0y - 0.015 * s);
        g.quadraticCurveTo((m0x + m1x) / 2, m1y + 0.012 * s, m1x, m1y);
        g.quadraticCurveTo((m1x + m2x) / 2, m1y + 0.012 * s, m2x, m2y - 0.015 * s);
        g.stroke();
        g.globalAlpha = 1;
      }
      const hat = g.createLinearGradient(hx - s * 0.12, 0, hx + s * 0.12, 0);
      hat.addColorStop(0, '#ffffff');
      hat.addColorStop(1, '#bdb8ad');
      g.fillStyle = hat;
      g.fillRect(hx - s * 0.09, hy - s * 0.2, s * 0.18, s * 0.11);
      for (const [dx, dy, r] of [
        [-0.07, -0.25, 0.07],
        [0.07, -0.25, 0.07],
        [0, -0.29, 0.085],
      ] as const) {
        g.beginPath();
        g.arc(hx + dx * s, hy + dy * s, r * s, 0, Math.PI * 2);
        g.fill();
      }
      // pleats that turn with it
      g.strokeStyle = 'rgba(120, 112, 100, 0.5)';
      g.lineWidth = 0.008 * s;
      for (let p = 0; p < 6; p++) {
        const ang = a + (p / 6) * Math.PI * 2;
        if (Math.cos(ang) < 0) continue;
        const px = hx + Math.sin(ang) * s * 0.09;
        g.beginPath();
        g.moveTo(px, hy - s * 0.09);
        g.lineTo(px, hy - s * 0.2);
        g.stroke();
      }
    },
  });
  for (const p of parts.sort((p, q) => p.z - q.z)) p.draw();
  g.restore();
}

/** The pastry egg on its sugar holder with the baker on top, all in `box` (the egg's own box). */
export function drawPastryEgg(g: CanvasRenderingContext2D, box: Box, turn: number, bakerTurn: number, res = 300): void {
  drawSugarNest(g, box, turn, 'back');
  drawShell(g, pastryShell(), turn, box, res);
  drawSugarNest(g, box, turn, 'front');
  drawBaker(g, box.x + box.w / 2, box.y + box.h * 0.025, box.h * 0.3, bakerTurn);
}

/**
 * The little glass cake stand beside the shadow box, `w` x `h`, holding whichever of
 * 'rotten', 'iou' (the rotten egg tapped open) and 'pastry' have been found (left to right); the rotten egg cracked by
 * `taps` taps (0 .. 12).
 */
export function drawCakeStand(g: CanvasRenderingContext2D, w: number, h: number, items: ('rotten' | 'iou' | 'pastry')[], taps = 0): void {
  const plateY = h * 0.7;
  const cx = w / 2;
  // the foot and stem, pressed glass
  const glass = (fill: string) => {
    g.fillStyle = fill;
    g.fill();
    g.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    g.lineWidth = Math.max(0.6, w * 0.012);
    g.stroke();
  };
  g.beginPath();
  g.ellipse(cx, h * 0.94, w * 0.24, h * 0.04, 0, 0, Math.PI * 2);
  glass('rgba(200, 226, 240, 0.45)');
  g.beginPath();
  g.moveTo(cx - w * 0.05, plateY);
  g.quadraticCurveTo(cx - w * 0.02, h * 0.82, cx - w * 0.09, h * 0.93);
  g.lineTo(cx + w * 0.09, h * 0.93);
  g.quadraticCurveTo(cx + w * 0.02, h * 0.82, cx + w * 0.05, plateY);
  glass('rgba(200, 226, 240, 0.4)');
  // the plate's underside, then what stands on it, then its rim
  g.beginPath();
  g.ellipse(cx, plateY, w * 0.47, h * 0.06, 0, 0, Math.PI * 2);
  glass('rgba(210, 232, 244, 0.42)');
  const n = Math.max(1, items.length);
  items.forEach((item, i) => {
    const ex = n === 1 ? cx : w * (0.3 + (0.4 * i) / (n - 1));
    if (item === 'iou') {
      // the note propped against a shard of its shell
      const s = Math.min(w * 0.42, h * 0.62);
      drawRestingShards(g, ex, plateY - h * 0.01, s * 0.7);
      drawIouNote(g, ex, plateY - s * 0.36, s, 0.35);
      return;
    }
    const eh = item === 'pastry' ? (plateY - h * 0.04) / 1.34 : Math.min(h * 0.44, (w * 0.34) / EGG_ASPECT);
    const ew = eh * EGG_ASPECT;
    const box = { x: ex - ew / 2, y: item === 'pastry' ? plateY - eh * 1.04 : plateY - eh * 0.98, w: ew, h: eh };
    if (item === 'pastry') drawPastryEgg(g, box, 0.2, 0.5, Math.max(40, Math.round(eh * 2)));
    else drawShell(g, rottenShell(taps), 0.4, box, Math.max(40, Math.round(eh * 2)));
  });
  g.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  g.lineWidth = Math.max(0.6, w * 0.014);
  g.beginPath();
  g.ellipse(cx, plateY, w * 0.47, h * 0.06, 0, 0.1, Math.PI - 0.1);
  g.stroke();
}

// ---- the IOU in the rotten egg -------------------------------------------------------------

/**
 * What the rotten egg holds now: a little folded note on yellowed onionskin, "IOU one (1)
 * diamond heart", signed by Mystery Robot Joe with a rivet. `size` is its width, centered at
 * (cx, cy); `turn` swings it about its upright axis (its back is plain paper and the rivet).
 */
export function drawIouNote(g: CanvasRenderingContext2D, cx: number, cy: number, size: number, turn: number): void {
  const w = size;
  const h = size * 0.64;
  const c = Math.cos(turn);
  const sx = Math.max(0.06, Math.abs(c));
  const front = c >= 0;
  g.save();
  g.translate(cx, cy);
  g.rotate(-0.06);
  g.scale(sx, 1);
  // the paper, a little tented along its fold, and its shadow side
  const paper = g.createLinearGradient(0, -h / 2, 0, h / 2);
  paper.addColorStop(0, front ? '#f3e7bf' : '#e6d7a8');
  paper.addColorStop(0.5, front ? '#eadba9' : '#dccb97');
  paper.addColorStop(1, front ? '#e2cf96' : '#d3c08a');
  g.fillStyle = paper;
  g.beginPath();
  g.moveTo(-w / 2, -h / 2 + h * 0.02);
  g.lineTo(w / 2, -h / 2);
  g.lineTo(w / 2 - w * 0.01, h / 2);
  g.lineTo(-w / 2 + w * 0.012, h / 2 - h * 0.015);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(120, 96, 40, 0.55)';
  g.lineWidth = Math.max(0.6, w * 0.006);
  g.stroke();
  // the fold across the middle, and a stain where the egg sat on it
  g.strokeStyle = 'rgba(140, 116, 60, 0.45)';
  g.beginPath();
  g.moveTo(-w / 2, 0);
  g.lineTo(w / 2, -h * 0.01);
  g.stroke();
  const stain = g.createRadialGradient(w * 0.3, h * 0.22, 0, w * 0.3, h * 0.22, w * 0.18);
  stain.addColorStop(0, 'rgba(130, 150, 70, 0.28)');
  stain.addColorStop(1, 'rgba(130, 150, 70, 0)');
  g.fillStyle = stain;
  g.fillRect(-w / 2, -h / 2, w, h);
  // the rivet it is signed with: tin, with a highlight
  const rivet = (x: number, y: number, r: number) => {
    const t = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    t.addColorStop(0, '#f4f6f8');
    t.addColorStop(0.5, '#a9b0b8');
    t.addColorStop(1, '#5d646c');
    g.fillStyle = t;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  };
  if (!front) {
    rivet(0, 0, w * 0.045);
    g.restore();
    return;
  }
  // the writing: a careful robot's hand
  g.fillStyle = '#2b2a4a';
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.font = `bold ${Math.round(h * 0.3)}px Georgia, 'Times New Roman', serif`;
  g.fillText('IOU', 0, -h * 0.12);
  g.font = `italic ${Math.max(6, Math.round(h * 0.12))}px Georgia, 'Times New Roman', serif`;
  g.fillText('one (1) diamond heart', 0, h * 0.12);
  g.fillText('ask for it back: Joe', -w * 0.04, h * 0.33);
  rivet(w * 0.38, h * 0.3, w * 0.035);
  g.restore();
}
