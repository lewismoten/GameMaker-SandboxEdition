// The "Made with Game-Maker: Sandbox Edition" opening the web editor offers new games
// (web/src/editor/tools/opening): the site's own look, a floor of glossy blue 20x20
// blocks under a navy sky like its icon, where chunky yellow GAME-MAKER letters drop in one
// at a time and land with hard shadows. "MADE WITH" types in above in the PC's 8x8 font,
// "SANDBOX EDITION" below (SANDBOX in THE SANDBOX BBS's colors, bbsName.ts), a highlight
// sweeps across, a star glints, and it fades to black. About four seconds.
//
// Ray traced like the Sandbox Software sting (sandlogo.ts: raytrace.ts, sdftext.ts,
// quantize.ts), made once, and committed as files the web app ships:
//   web/public/opening/madewith.fli   the animation
//   web/public/opening/madewith.gif   its resting frame, for "Still picture"
//
//   cd web && npx vite-node ../games/kit/madewith.ts          writes both
//   PREVIEW=<folder>                                          also writes frame PNGs there
// The web app never imports this file; it copies the two files into a new game.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { encodeFli } from '../../web/src/formats/fli';
import { encodeGif } from '../../web/src/formats/gif';
import { FONT8X8 } from '../../web/src/gfx/font8x8';
import { DistanceGrid, ExtrudedText, textStrokes } from './sdftext';
import { medianCutPalette, Quantizer } from './quantize';
import { Pixels } from './pixels';
import { writePng } from './png';
import {
  add,
  apply,
  blocked,
  Camera,
  clamp01,
  dot,
  fromAxes,
  Group,
  Hit,
  Lettering,
  Material,
  mix,
  mulM,
  nearest,
  norm,
  placed,
  rotY,
  scale,
  Shape,
  sub,
  Surface,
  V,
} from './raytrace';

const W = 320;
const H = 200;
/** FLI speed: 1/70 s ticks per frame (6 = about 12 frames a second). */
const SPEED = 6;
const FADE_IN = 6;
const MADE_START = 3; // MADE WITH types in, a letter a frame
const DROP_START = 7;
const DROP_STAGGER = 1.5;
const DROP = 7;
const EDITION_START = 24; // SANDBOX EDITION types in, two letters a frame
const SWEEP_START = 30;
const SWEEP = 7;
const SPARKLE = 34;
const HOLD_END = 44;
const FADE = 7;
const FRAMES = HOLD_END + FADE;
/** The frame the still picture is made from: everything in place, no glint. */
const REST = 42;

// ---- the site's colors ------------------------------------------------------------------

const lin = (hex: number): V => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
const NAVY = lin(0x000080);
const BLOCK = lin(0x1d3fbf);
const GOLD: V = [1.0, 0.83, 0.0]; // #ffd400
const WHITE: V = [1, 1, 1];

const cam = new Camera([0, 2.1, -7.2], [0, 0.95, 0], 300);
const SUN = norm([-0.45, 0.8, -0.55]);
const SUN_COLOR: V = [1.0, 0.98, 0.92];
const AMBIENT: V = [0.34, 0.36, 0.46];

/** The navy sky: dark overhead, the icon's blue toward the horizon. */
function sky(d: V): V {
  const y = clamp01(d[1]);
  return mix(mix(BLOCK, [0.3, 0.45, 0.95], 0.35), scale(NAVY, 0.55), clamp01(Math.pow(y * 3.2, 0.7)));
}

/** The floor: 1-unit blocks in the icon's blue, each with a lit top-left bevel and a dark gap. */
function floorColor(x: number, z: number): { color: V; bevel: number } {
  const u = x - Math.floor(x);
  const v = z - Math.floor(z);
  const gap = 0.07;
  if (u < gap || v < gap) return { color: scale(NAVY, 0.7), bevel: 0 };
  const edge = 0.16;
  // the far and left edges catch the light, the near and right ones fall into shade
  const lit = u < gap + edge || v > 1 - edge ? 1 : u > 1 - edge || v < gap + edge ? -1 : 0;
  return { color: lit > 0 ? mix(BLOCK, WHITE, 0.28) : lit < 0 ? scale(BLOCK, 0.62) : BLOCK, bevel: lit };
}

// ---- the letters ---------------------------------------------------------------------

const surface = (color: V, o: Partial<Surface> = {}): Surface => ({ color, kd: 0.9, ks: 0, shine: 10, mirror: 0, ...o });

const PIECES = ['G', 'A', 'M', 'E', '-', 'M', 'A', 'K', 'E', 'R'];
/** World height of a capital, and where the row of letters stands. */
const SIZE = 0.74;
const ROW_Z = 0.2;
const LOGO_ROT = fromAxes(cam.right, [0, 1, 0], norm([cam.fw[0], 0, cam.fw[2]]));

interface Piece {
  text: ExtrudedText;
  /** Where its middle sits along the row, in cap heights. */
  x: number;
}

let pieces: Piece[] | undefined;
function logo(): Piece[] {
  if (!pieces) {
    const widths: number[] = [];
    const glyphs = PIECES.map((s) => {
      const segs = textStrokes(s, 1, 0, 0.06).map(([a, b, c, d, r]): [number, number, number, number, number] => [a, b, c, d, r * 1.35]);
      const xs = segs.flatMap(([x0, , x1, , r]) => [x0 - r, x1 + r]);
      widths.push(Math.max(...xs) - Math.min(...xs));
      return segs;
    });
    const gap = 0.16;
    const total = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
    let pen = -total / 2;
    pieces = glyphs.map((segs, i) => {
      const x = pen + widths[i] / 2;
      pen += widths[i] + gap;
      return { text: new ExtrudedText(new DistanceGrid(segs, 0.01, 0.2), 0.5, 0.08), x };
    });
  }
  return pieces;
}

/** Where along the row (world units, across the screen) a point is. */
const across = (p: V) => dot(p, cam.right);

/** Glossy yellow plastic, a shade deeper at the foot; it glows as the sweep passes. */
function pieceMaterial(band: number | undefined): Material {
  return (h: Hit) => {
    const t = clamp01(h.local[1]);
    const c = mix(scale(GOLD, 0.9), mix(GOLD, WHITE, 0.3), t);
    let glow: V | undefined;
    if (band !== undefined) {
      const k = across(h.p) + 0.5 * h.p[1];
      glow = scale(mix(GOLD, WHITE, 0.7), Math.exp(-(((k - band) / 0.4) ** 2)) * 0.85);
    }
    return surface(c, { kd: 0.95, ks: 0.8, shine: 38, mirror: 0.04, glow: add(scale(c, 0.22), glow ?? [0, 0, 0]) });
  };
}

const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** The letters in the air or landed at frame f. */
function letters(f: number, glow = true): { key: string; shape: Shape; landed: boolean }[] {
  const band = glow && f >= SWEEP_START && f < SWEEP_START + SWEEP ? -3.6 + (7.2 * (f - SWEEP_START)) / (SWEEP - 1) : undefined;
  const out: { key: string; shape: Shape; landed: boolean }[] = [];
  logo().forEach((p, i) => {
    const t = (f - (DROP_START + i * DROP_STAGGER)) / DROP;
    if (t <= 0) return;
    const k = Math.min(1, t);
    const e = easeOut(k);
    // falls from above like a block set down in the editor, with one small bounce and a quarter turn
    const bounce = k < 1 ? Math.sin(Math.PI * Math.min(1, k * 1.3)) * (1 - k) * 0.5 : 0;
    const drop = (1 - e) * 4.5 + bounce;
    const rot = mulM(LOGO_ROT, rotY((1 - e) * Math.PI * 0.5));
    const pos = add([0, drop * SIZE, ROW_Z], apply(LOGO_ROT, [p.x * SIZE, 0, 0]));
    out.push({ key: `piece${i}`, shape: new Lettering(p.text, placed(pos, rot, SIZE), pieceMaterial(band)), landed: k >= 1 });
  });
  return out;
}

// ---- tracing ----------------------------------------------------------------------------

function trace(shapes: Shape[], d: V): V {
  const o = cam.eye;
  const h = nearest(shapes, o, d);
  if (!h) {
    if (d[1] >= -1e-4) return sky(d);
    const t = -o[1] / d[1];
    const p = add(o, scale(d, t));
    const lit = blocked(shapes, add(p, [0, 1e-3, 0]), SUN) ? 0 : 1;
    const { color, bevel } = floorColor(p[0], p[2]);
    const diff = SUN[1] * lit;
    const col: V = [0, 1, 2].map((i) => color[i] * (AMBIENT[i] + 0.85 * diff * SUN_COLOR[i])) as V;
    // a glossy floor: a little sky in it, and a glint on the lit bevels
    const shine = mix(col, sky([d[0], -d[1], d[2]]), 0.12);
    const glint = bevel > 0 ? scale(WHITE, 0.06 * lit) : ([0, 0, 0] as V);
    return mix(add(shine, glint), sky([d[0], 0, d[2]]), clamp01(1 - Math.exp(-t / 22)));
  }
  const s = h.shape.material(h);
  const n = h.n;
  const lit = blocked(shapes, add(h.p, scale(n, 2e-3)), SUN) ? 0 : 1;
  const diff = Math.max(0, dot(n, SUN)) * lit;
  const vn = dot(d, n);
  const r: V = [d[0] - 2 * vn * n[0], d[1] - 2 * vn * n[1], d[2] - 2 * vn * n[2]];
  const spec = s.ks ? Math.max(0, dot(r, SUN)) ** s.shine * s.ks * lit : 0;
  const e = s.mirror ? (r[1] >= 0 ? sky(r) : mix(BLOCK, NAVY, 0.4)) : undefined;
  const out: V = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    out[i] = s.color[i] * (AMBIENT[i] + s.kd * diff * SUN_COLOR[i]) + spec;
    if (e) out[i] = out[i] * (1 - s.mirror * 0.5) + e[i] * s.mirror * s.color[i];
    if (s.glow) out[i] += s.glow[i];
  }
  return out;
}

const SAMPLES: [number, number][] = [
  [0.375, 0.125],
  [0.875, 0.375],
  [0.125, 0.625],
  [0.625, 0.875],
];

function pixel(shapes: Shape[], x: number, y: number): V {
  const acc: V = [0, 0, 0];
  for (const [sx, sy] of SAMPLES) {
    const c = trace(shapes, cam.ray(x + sx, y + sy));
    for (let i = 0; i < 3; i++) acc[i] += c[i] / 4;
  }
  return acc;
}

/** The screen box a shape and its shadow on the floor can touch. */
function dirtyBox(s: Shape): [number, number, number, number] {
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  for (const c of s.corners())
    for (const q of [c, sub(c, scale(SUN, c[1] / SUN[1]))]) {
      const p = cam.project(q);
      if (!p) return [0, 0, W - 1, H - 1];
      x0 = Math.min(x0, p[0]);
      y0 = Math.min(y0, p[1]);
      x1 = Math.max(x1, p[0]);
      y1 = Math.max(y1, p[1]);
    }
  return [Math.max(0, Math.floor(x0) - 2), Math.max(0, Math.floor(y0) - 2), Math.min(W - 1, Math.ceil(x1) + 2), Math.min(H - 1, Math.ceil(y1) + 2)];
}

let empty: Float32Array | undefined;
/** The bare floor and sky, traced once. */
function backdrop(): Float32Array {
  if (!empty) {
    empty = new Float32Array(W * H * 3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) empty.set(pixel([], x, y), (y * W + x) * 3);
  }
  return empty;
}

/** One frame in linear RGB: the backdrop, with the letters traced where they (and their shadows) can show. */
function renderFrame(f: number): Float32Array {
  const out = backdrop().slice();
  const ls = letters(f);
  if (!ls.length) return out;
  const mask = new Uint8Array(W * H);
  for (const l of ls) {
    const [x0, y0, x1, y1] = dirtyBox(l.shape);
    for (let y = y0; y <= y1; y++) mask.fill(1, y * W + x0, y * W + x1 + 1);
  }
  const shapes = [new Group(ls.map((l) => l.shape))];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) out.set(pixel(shapes, x, y), (y * W + x) * 3);
  if (f >= SPARKLE && f < SPARKLE + 4) {
    const k = [0.6, 1, 0.7, 0.35][f - SPARKLE];
    const last = logo()[PIECES.length - 1];
    const tip = cam.project(add([0, 0.96 * SIZE, ROW_Z - 0.25 * SIZE], apply(LOGO_ROT, [(last.x + 0.3) * SIZE, 0, 0])));
    if (tip) sparkle(out, tip[0], tip[1], k);
  }
  return out;
}

/** A four-point star glint with a soft halo. */
function sparkle(out: Float32Array, cx: number, cy: number, k: number): void {
  const R = 24 * k;
  for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(H - 1, Math.ceil(cy + R)); y++)
    for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(W - 1, Math.ceil(cx + R)); x++) {
      const dx = Math.abs(x + 0.5 - cx);
      const dy = Math.abs(y + 0.5 - cy) * 1.2;
      const r = Math.hypot(dx, dy);
      const arms = Math.max(0, 1 - dy / 1.6) * Math.max(0, 1 - dx / R) ** 2 + Math.max(0, 1 - dx / 1.6) * Math.max(0, 1 - dy / R) ** 2;
      const core = Math.max(0, 1 - r / (5 * k)) ** 2 * 1.2;
      const v = (arms + core) * k;
      const i = (y * W + x) * 3;
      out[i] += v;
      out[i + 1] += v;
      out[i + 2] += v * 0.9;
    }
}

const toBytes = (f: Float32Array): Uint8Array => {
  const out = new Uint8Array(f.length);
  for (let i = 0; i < f.length; i++) out[i] = Math.round(clamp01(f[i]) * 255);
  return out;
};

// ---- the lettering above and below, flat in the PC font ---------------------------------

/** Palette entries kept for the flat lettering: black, white, then S A N D B O X's colors. */
const CGA: [number, number, number][] = [
  [255, 85, 85],
  [255, 255, 85],
  [85, 255, 85],
  [85, 255, 255],
  [85, 85, 255],
  [255, 85, 255],
  [170, 85, 0],
];
const FLAT: [number, number, number][] = [[0, 0, 0], [255, 255, 255], ...CGA];
const INK_BLACK = 0;
const INK_WHITE = 1;

/** Draws one line of 8x8 text, `s` pixels a dot, centered on cx, with a black outline and drop shadow; `shown` letters only. */
function flatText(px: Uint8Array, text: string, cx: number, y: number, s: number, ink: (i: number) => number, shown: number): void {
  const x0 = Math.round(cx - (text.length * 8 * s) / 2);
  const dots: [number, number, number][] = [];
  for (let i = 0; i < Math.min(shown, text.length); i++) {
    const g = text.charCodeAt(i) * 8;
    for (let gy = 0; gy < 8; gy++) for (let gx = 0; gx < 8; gx++) if (FONT8X8[g + gy] & (1 << gx)) dots.push([x0 + (i * 8 + gx) * s, y + gy * s, ink(i)]);
  }
  const put = (x: number, yy: number, size: number, c: number) => {
    for (let a = Math.max(0, yy); a < Math.min(H, yy + size); a++) for (let b = Math.max(0, x); b < Math.min(W, x + size); b++) px[a * W + b] = c;
  };
  for (const [x, yy] of dots) put(x + 1, yy + 1, s + s, INK_BLACK); // shadow
  for (const [x, yy] of dots) put(x - 1, yy - 1, s + 2, INK_BLACK); // outline
  for (const [x, yy, c] of dots) put(x, yy, s, c);
}

const MADE = 'MADE WITH';
const EDITION = 'SANDBOX EDITION';

function drawFlat(px: Uint8Array, f: number): Uint8Array {
  if (f >= MADE_START) flatText(px, MADE, 160, 26, 2, () => INK_WHITE, f - MADE_START + 1);
  if (f >= EDITION_START) flatText(px, EDITION, 160, 150, 2, (i) => (i < 7 ? 2 + i : INK_WHITE), (f - EDITION_START + 1) * 2);
  return px;
}

// ---- the files --------------------------------------------------------------------------

interface MadeWith {
  frames: Uint8Array[];
  palettes: Uint8Array[];
  palette: Uint8Array;
}

let made: MadeWith | undefined;

/** Every frame as 320x200 indexed pixels, with a palette each (the fades). */
function madeWithFrames(): MadeWith {
  if (made) return made;
  const rgb: Uint8Array[] = [];
  for (let f = 0; f < FRAMES; f++) rgb.push(toBytes(renderFrame(f)));
  const palette = medianCutPalette(rgb, FLAT);
  const q = new Quantizer(palette, 5);
  const frames = rgb.map((c, f) => drawFlat(q.apply(c, W, H), f));
  const palettes = frames.map((_, f) => {
    const k = f < FADE_IN ? (f + 1) / (FADE_IN + 1) : f >= FRAMES - FADE ? (FRAMES - 1 - f) / FADE : 1;
    return palette.map((v) => Math.round(v * k));
  });
  made = { frames, palettes, palette };
  return made;
}

/** MADEWITH.FLI: its own palette, delta frames. */
function madeWithFli(): Uint8Array {
  const { frames, palettes, palette } = madeWithFrames();
  return encodeFli(frames, palette, { speed: SPEED, palettes, runs: true });
}

/** MADEWITH.GIF: the resting frame at full light. */
function madeWithGif(): Uint8Array {
  const { frames, palette } = madeWithFrames();
  return encodeGif({ width: W, height: H, pixels: frames[REST], palette });
}

{
  const out = join(import.meta.dirname, '../../web/public/opening');
  mkdirSync(out, { recursive: true });
  const t0 = Date.now();
  const fli = madeWithFli();
  writeFileSync(join(out, 'madewith.fli'), fli);
  writeFileSync(join(out, 'madewith.gif'), madeWithGif());
  console.log(`madewith.fli ${fli.length} bytes, ${FRAMES} frames (${((FRAMES * SPEED) / 70).toFixed(1)} s), in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  const preview = process.env.PREVIEW;
  if (preview) {
    mkdirSync(preview, { recursive: true });
    const { frames, palettes } = madeWithFrames();
    frames.forEach((px, f) => {
      if (f % 3 && f !== REST) return;
      const p = new Pixels(W, H);
      p.px.set(px);
      writePng(join(preview, `madewith-${String(f).padStart(2, '0')}.png`), p, palettes[f], 2);
    });
  }
}
