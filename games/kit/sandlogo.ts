// The Sandbox Software logo sting that opens every Sandbox game: gold chrome "SANDBOX"
// over a spaced-out "SOFTWARE", spinning in from the distance above a mirror-polished
// sandstone checkerboard under a sunset sky, then a highlight sweeps across the letters
// trailing a lens flare: the 3D Studio look of 1995. It is ray traced here in software
// (see sdftext.ts), quantized to one 256-color palette (quantize.ts) and written as an
// Autodesk Animator FLI, which carries its own palette, so any game can put it first in
// its title slide show: `sandlogo.fli 0` before the game's own intro.
import { encodeFli } from '../../web/src/formats/fli';
import { DistanceGrid, ExtrudedText, textStrokes } from './sdftext';
import { medianCutPalette, Quantizer } from './quantize';

/** The logo's file name on every disk. */
export const SANDLOGO = 'sandlogo.fli';

const W = 320;
const H = 200;
/** FLI speed: 1/70 s ticks per frame (5 = 14 frames a second). */
const SPEED = 6;
const FLY = 26; // spin in from the distance
const SWEEP = 13; // the highlight crosses the letters
const HOLD = 8; // stand still
const FADE = 7; // fade to black (palette only)
const FADE_IN = 5;

type V = [number, number, number];
const norm = (v: V): V => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const mix = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Piecewise-linear color ramp over stops [position, color]. */
function ramp(stops: [number, V][], t: number): V {
  if (t <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++)
    if (t <= stops[i][0]) return mix(stops[i - 1][1], stops[i][1], (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
  return stops[stops.length - 1][1];
}

// ---- the world ----------------------------------------------------------------------

const FLOOR_Y = -0.8;
const CAM: V = [0, 0.3, -10];
const FOCAL = 470;
const FW = norm([0 - CAM[0], 0.05 - CAM[1], 0 - CAM[2]]);
const RIGHT = norm([FW[2], 0, -FW[0]]);
const UP: V = [FW[1] * RIGHT[2] - FW[2] * RIGHT[1], FW[2] * RIGHT[0] - FW[0] * RIGHT[2], FW[0] * RIGHT[1] - FW[1] * RIGHT[0]];
/** VGA's 320x200 is shown 4:3, so each pixel is 1.2 times taller than wide. */
const ASPECT = 1.2;

function rayDir(sx: number, sy: number): V {
  const u = (sx - W / 2) / FOCAL;
  const v = (-(sy - H / 2) * ASPECT) / FOCAL;
  return norm([FW[0] + RIGHT[0] * u + UP[0] * v, FW[1] + RIGHT[1] * u + UP[1] * v, FW[2] + RIGHT[2] * u + UP[2] * v]);
}

function project(p: V): [number, number] | undefined {
  const d: V = [p[0] - CAM[0], p[1] - CAM[1], p[2] - CAM[2]];
  const z = dot(d, FW);
  if (z < 0.1) return undefined;
  return [W / 2 + (dot(d, RIGHT) * FOCAL) / z, H / 2 - (dot(d, UP) * FOCAL) / z / ASPECT];
}

/** The sunset: gold at the horizon through rose and violet to night. */
function sky(d: V): V {
  return ramp(
    [
      [0, [1.0, 0.66, 0.3]],
      [0.05, [0.93, 0.4, 0.36]],
      [0.14, [0.5, 0.17, 0.4]],
      [0.3, [0.13, 0.06, 0.26]],
      [0.5, [0.02, 0.02, 0.1]],
    ],
    d[1],
  );
}

const SAND_A: V = [0.62, 0.42, 0.26];
const SAND_B: V = [0.2, 0.11, 0.08];
const HAZE: V = [0.75, 0.42, 0.32];

/** The floor at a point: sandstone checkers, hazy toward the horizon. */
function floorColor(x: number, z: number, dist: number): V {
  const c = (Math.floor(x * 0.8) + Math.floor(z * 0.8)) & 1 ? SAND_A : SAND_B;
  return mix(c, HAZE, clamp01(1 - Math.exp(-dist / 28)));
}

/** What the chrome sees in a direction: a bright horizon, warm sky, dark ground. */
function chromeEnv(r: V): V {
  const y = r[1];
  const line = Math.exp(-((y / 0.025) ** 2)) * 0.7;
  const c: V =
    y >= 0
      ? ramp(
          [
            [0, [1.0, 0.9, 0.7]],
            [0.12, [0.7, 0.5, 0.45]],
            [0.35, [0.3, 0.18, 0.3]],
            [0.8, [0.12, 0.08, 0.18]],
          ],
          y,
        )
      : ramp(
          [
            [-0.4, [0.08, 0.05, 0.03]],
            [-0.05, [0.35, 0.2, 0.1]],
            [0, [0.6, 0.4, 0.2]],
          ],
          y,
        );
  return [c[0] + line, c[1] + line, c[2] + line * 0.8];
}

const GOLD: V = [1.0, 0.74, 0.34];
const KEY = norm([-0.55, 0.65, -0.55]);

// ---- the logo -----------------------------------------------------------------------

let solid: ExtrudedText | undefined;
function logo(): ExtrudedText {
  if (!solid) {
    const segs = [...textStrokes('SANDBOX', 1, -0.2, 0.09), ...textStrokes('SOFTWARE', 0.3, -0.72, 0.42)];
    solid = new ExtrudedText(new DistanceGrid(segs, 0.008, 0.25), 0.34, 0.06);
  }
  return solid;
}

interface Pose {
  pos: V;
  yaw: number;
  pitch: number;
  /** Where the highlight band is (object x), or undefined for none. */
  band?: number;
  /** Lens flare strength 0..1. */
  flare: number;
}

/** Rotation (yaw about y, then pitch about x) as rows of a 3x3 matrix, object to world. */
function rotation(yaw: number, pitch: number): number[] {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  // R = Ry * Rx
  return [cy, sy * sp, sy * cp, 0, cp, -sp, -sy, cy * sp, cy * cp];
}
const mul = (m: number[], v: V): V => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];
const mulT = (m: number[], v: V): V => [
  m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
  m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
  m[2] * v[0] + m[5] * v[1] + m[8] * v[2],
];

const easeOut = (t: number) => 1 - (1 - t) ** 3;
const REST_PITCH = 0.03;

function pose(f: number): Pose {
  const g = logo().grid;
  if (f < FLY) {
    const e = easeOut(f / (FLY - 1));
    return { pos: [0, 1.4 * (1 - e), 80 * (1 - e)], yaw: -Math.PI * 3 * (1 - e), pitch: REST_PITCH + 0.5 * (1 - e), flare: 0 };
  }
  const k = Math.min(1, (f - FLY) / (SWEEP - 1));
  const rest: Pose = { pos: [0, 0, 0], yaw: 0, pitch: REST_PITCH, flare: 0 };
  if (f >= FLY + SWEEP) return rest;
  return { ...rest, band: g.x0 - 0.8 + (g.x1 - g.x0 + 2.2) * k, flare: Math.sin(Math.PI * k) ** 2 };
}

/** The shaded gold at an object-space hit, seen along world direction d. */
function shade(text: ExtrudedText, rot: number[], p: V, d: V, band: number | undefined): V {
  const n = mul(rot, text.normal(p[0], p[1], p[2]));
  const vn = dot(d, n);
  const r: V = [d[0] - 2 * vn * n[0], d[1] - 2 * vn * n[1], d[2] - 2 * vn * n[2]];
  const env = chromeEnv(r);
  const diff = Math.max(0, dot(n, KEY));
  const spec = Math.max(0, dot(r, KEY)) ** 40 * 0.9;
  let glow = 0;
  if (band !== undefined) glow = Math.exp(-(((p[0] + 0.55 * p[1] - band) / 0.32) ** 2)) * 1.1;
  const out: V = [0, 0, 0];
  for (let c = 0; c < 3; c++) out[c] = GOLD[c] * (0.08 + 0.3 * diff + 0.85 * env[c]) + spec + glow * (0.55 + 0.45 * GOLD[c]);
  return out;
}

/** The scene without the logo (4x4 samples a pixel), linear RGB 0..1. */
function backdrop(): Float32Array {
  const out = new Float32Array(W * H * 3);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const acc: V = [0, 0, 0];
      for (let s = 0; s < 16; s++) {
        const d = rayDir(x + ((s & 3) + 0.5) / 4, y + ((s >> 2) + 0.5) / 4);
        let c: V;
        if (d[1] < 0) {
          const t = (FLOOR_Y - CAM[1]) / d[1];
          c = floorColor(CAM[0] + d[0] * t, CAM[2] + d[2] * t, t);
        } else c = sky(d);
        acc[0] += c[0] / 16;
        acc[1] += c[1] / 16;
        acc[2] += c[2] / 16;
      }
      out.set(acc, (y * W + x) * 3);
    }
  // a few stars high in the sky
  let seed = 1995;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) >>> 8) / 16777216;
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(rnd() * W);
    const y = Math.floor(rnd() * 70);
    const b = (0.35 + rnd() * 0.65) * clamp01(1 - y / 75);
    const k = (y * W + x) * 3;
    for (let c = 0; c < 3; c++) out[k + c] = Math.min(1, out[k + c] + b * (c === 2 ? 1 : 0.9));
  }
  return out;
}

/** The screen box a world-space box covers (undefined = all of it). */
function screenBox(corners: V[]): [number, number, number, number] {
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  for (const c of corners) {
    const p = project(c);
    if (!p) return [0, 0, W - 1, H - 1];
    x0 = Math.min(x0, p[0]);
    y0 = Math.min(y0, p[1]);
    x1 = Math.max(x1, p[0]);
    y1 = Math.max(y1, p[1]);
  }
  return [Math.max(0, Math.floor(x0) - 1), Math.max(0, Math.floor(y0) - 1), Math.min(W - 1, Math.ceil(x1) + 1), Math.min(H - 1, Math.ceil(y1) + 1)];
}

/** Traces the logo along a world ray; returns its color or undefined on a miss. */
function traceLogo(text: ExtrudedText, rot: number[], pos: V, o: V, d: V, band: number | undefined): V | undefined {
  const lo = mulT(rot, [o[0] - pos[0], o[1] - pos[1], o[2] - pos[2]]);
  const ld = mulT(rot, d);
  const t = text.trace(lo[0], lo[1], lo[2], ld[0], ld[1], ld[2]);
  if (t < 0) return undefined;
  return shade(text, rot, [lo[0] + ld[0] * t, lo[1] + ld[1] * t, lo[2] + ld[2] * t], d, band);
}

/** One frame in linear RGB 0..1 over the backdrop. */
function renderFrame(base: Float32Array, ps: Pose): Float32Array {
  const text = logo();
  const g = text.grid;
  const out = base.slice();
  const rot = rotation(ps.yaw, ps.pitch);
  const box: V[] = [];
  for (const x of [g.x0, g.x1])
    for (const y of [g.y0, g.y1]) for (const z of [-text.half, text.half]) box.push(mul(rot, [x, y, z]).map((v, i) => v + ps.pos[i]) as V);
  // the letters, with their silhouettes antialiased: a pixel whose 2x2 corner samples
  // disagree gets 16 samples
  const [bx0, by0, bx1, by1] = screenBox(box);
  const sample = (sx: number, sy: number) => traceLogo(text, rot, ps.pos, CAM, rayDir(sx, sy), ps.band);
  for (let y = by0; y <= by1; y++)
    for (let x = bx0; x <= bx1; x++) {
      const k = (y * W + x) * 3;
      const corners = [sample(x + 0.25, y + 0.25), sample(x + 0.75, y + 0.25), sample(x + 0.25, y + 0.75), sample(x + 0.75, y + 0.75)];
      const hits = corners.filter((c) => c).length;
      if (!hits) continue;
      let acc: V = [0, 0, 0];
      const add = (c: V) => (acc = [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]]);
      if (hits === 4) for (const c of corners) add(c!);
      else for (let s = 0; s < 16; s++) add(sample(x + ((s & 3) + 0.5) / 4, y + ((s >> 2) + 0.5) / 4) ?? [out[k], out[k + 1], out[k + 2]]);
      const n = hits === 4 ? 4 : 16;
      for (let c = 0; c < 3; c++) out[k + c] = acc[c] / n;
    }
  // its reflection in the polished floor: the same box mirrored under the floor
  const mirrored = box.map(([x, y, z]) => [x, 2 * FLOOR_Y - y, z] as V);
  const [rx0, ry0, rx1, ry1] = screenBox(mirrored);
  for (let y = ry0; y <= ry1; y++)
    for (let x = rx0; x <= rx1; x++) {
      const d = rayDir(x + 0.5, y + 0.5);
      if (d[1] >= 0) continue;
      const t = (FLOOR_Y - CAM[1]) / d[1];
      const hitPt: V = [CAM[0] + d[0] * t, FLOOR_Y, CAM[2] + d[2] * t];
      const c = traceLogo(text, rot, ps.pos, hitPt, [d[0], -d[1], d[2]], ps.band);
      if (!c) continue;
      const k = (y * W + x) * 3;
      // only floor pixels the letters themselves don't cover
      if (out[k] !== base[k] || out[k + 1] !== base[k + 1] || out[k + 2] !== base[k + 2]) continue;
      const m = 0.42 * clamp01(1 - (t - 9) / 40);
      for (let ch = 0; ch < 3; ch++) out[k + ch] = out[k + ch] * (1 - m) + c[ch] * m;
    }
  if (ps.flare > 0.01 && ps.band !== undefined) flare(out, ps, rot);
  return out;
}

/** A 1995 lens flare: a hot core, a long horizontal streak, a halo and a line of ghosts. */
function flare(out: Float32Array, ps: Pose, rot: number[]): void {
  const g = logo().grid;
  // the glint rides the top edge of SANDBOX where the highlight is
  const top = 0.78;
  const local: V = [Math.max(g.x0, Math.min(g.x1, ps.band! - 0.55 * top)), top, -logo().half];
  const at = project(mul(rot, local).map((v, i) => v + ps.pos[i]) as V);
  if (!at) return;
  const [fx, fy] = at;
  const I = ps.flare;
  const ghosts: [number, number, V][] = [
    [-0.35, 9, [0.3, 0.9, 0.5]],
    [-0.7, 16, [0.6, 0.35, 0.9]],
    [0.45, 6, [1.0, 0.6, 0.3]],
    [-1.25, 24, [0.35, 0.55, 1.0]],
  ];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - fx;
      const dy = (y + 0.5 - fy) * ASPECT;
      const r2 = dx * dx + dy * dy;
      // every part fades to exactly nothing, so the flare only touches the pixels it lights
      const r = Math.sqrt(r2);
      const core = Math.exp(-r2 / 18) * 1.4;
      const halo = Math.max(0, 1 - r / 34) ** 2 * 0.4;
      const streak = Math.abs(dy) < 3 && Math.abs(dx) < 150 ? (1 - Math.abs(dy) / 3) ** 2 * (1 - Math.abs(dx) / 150) ** 2 * 0.9 : 0;
      const spike = Math.abs(dx) < 2 && Math.abs(dy) < 40 ? (1 - Math.abs(dx) / 2) * (1 - Math.abs(dy) / 40) ** 2 * 0.6 : 0;
      const k = (y * W + x) * 3;
      const add: V = [
        (core + halo) * 1.0 + (streak + spike) * 0.75,
        (core + halo * 0.8) * 0.95 + (streak + spike) * 0.85,
        core * 0.85 + halo * 0.5 + (streak + spike),
      ];
      for (const [pos, rad, tint] of ghosts) {
        const gx = W / 2 + (fx - W / 2) * pos;
        const gy = H / 2 + (fy - H / 2) * pos;
        const gr = Math.hypot(x + 0.5 - gx, (y + 0.5 - gy) * ASPECT);
        const a = clamp01((rad - gr) / 1.5) * (0.12 + 0.1 * (gr / rad) ** 3);
        for (let c = 0; c < 3; c++) add[c] += tint[c] * a;
      }
      for (let c = 0; c < 3; c++) out[k + c] += add[c] * I;
    }
}

const toBytes = (f: Float32Array): Uint8Array => {
  const out = new Uint8Array(f.length);
  for (let i = 0; i < f.length; i++) out[i] = Math.round(clamp01(f[i]) * 255);
  return out;
};

export interface LogoFrames {
  frames: Uint8Array[];
  /** A palette per frame (the fades). */
  palettes: Uint8Array[];
  palette: Uint8Array;
  speed: number;
}

let cached: LogoFrames | undefined;

/** Every frame of the sting as 320x200 indexed pixels, with their palettes. */
export function sandLogoFrames(): LogoFrames {
  if (cached) return cached;
  const base = backdrop();
  const unique: Uint8Array[] = [];
  for (let f = 0; f < FLY + SWEEP; f++) unique.push(toBytes(renderFrame(base, pose(f))));
  const palette = medianCutPalette(unique);
  const q = new Quantizer(palette, 4);
  const indexed = unique.map((rgb) => q.apply(rgb, W, H));
  const last = indexed[indexed.length - 1];
  const frames = [...indexed, ...new Array(HOLD + FADE).fill(last)];
  const palettes = frames.map((_, f) => {
    const k = f < FADE_IN ? (f + 1) / (FADE_IN + 1) : f >= frames.length - FADE ? (frames.length - 1 - f) / FADE : 1;
    return palette.map((v) => Math.round(v * k));
  });
  cached = { frames, palettes, palette, speed: SPEED };
  return cached;
}

let fli: Uint8Array | undefined;

/** SANDLOGO.FLI: the sting as an Autodesk Animator FLI (its own palette, delta frames). */
export function sandLogoFli(): Uint8Array {
  if (!fli) {
    const { frames, palettes, palette, speed } = sandLogoFrames();
    fli = encodeFli(frames, palette, { speed, palettes });
  }
  return fli;
}
