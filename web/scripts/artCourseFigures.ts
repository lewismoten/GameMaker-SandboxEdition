// Draws the figures of art course 1 ("Blocks: cut, repeat, reuse") into src/artCourses/figures/: real indexed 20x20
// Game-Maker blocks made with the same Pixels helpers the games use, written as PNGs through a small 6-bit VGA palette.
// Run from web/: npx vite-node scripts/artCourseFigures.ts
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';

const OUT = fileURLToPath(new URL('../src/artCourses/figures/', import.meta.url));

// Palette (6-bit components). Ramps: grass 1-5, soil 6-9, stone 10-13, wood 14-17, roof 18-20, sky/ink/misc.
const COLORS: [string, number[]][] = [
  ['bg', [58, 60, 62]],
  ['g0', [8, 26, 8]],
  ['g1', [12, 34, 10]],
  ['g2', [16, 42, 12]],
  ['g3', [22, 50, 16]],
  ['g4', [32, 58, 22]],
  ['s0', [22, 14, 8]],
  ['s1', [30, 20, 12]],
  ['s2', [38, 26, 16]],
  ['s3', [46, 34, 22]],
  ['k0', [24, 24, 28]],
  ['k1', [34, 34, 38]],
  ['k2', [44, 44, 48]],
  ['k3', [54, 54, 58]],
  ['w0', [26, 16, 8]],
  ['w1', [36, 24, 12]],
  ['w2', [46, 32, 16]],
  ['w3', [56, 42, 24]],
  ['r0', [38, 10, 8]],
  ['r1', [50, 16, 12]],
  ['r2', [58, 26, 20]],
  ['sky', [30, 46, 63]],
  ['ink', [6, 6, 10]],
  ['yel', [63, 56, 14]],
  ['wht', [63, 63, 63]],
  ['line', [63, 20, 40]],
  ['b0', [10, 18, 38]],
  ['b1', [16, 28, 50]],
  ['b2', [24, 40, 60]],
];
const C: Record<string, number> = {};
const pal = new Uint8Array(768);
COLORS.forEach(([n, rgb], i) => {
  C[n] = i;
  pal.set(rgb, i * 3);
});
const GRASS = ['g0', 'g1', 'g2', 'g3', 'g4'].map((n) => C[n]);
const STONE = ['k0', 'k1', 'k2', 'k3'].map((n) => C[n]);

const save = (name: string, p: Pixels, scale: number) => writePng(`${OUT}${name}.png`, p, pal, scale);

/** Sheets pictures left to right with a gap (background color) between. */
function strip(parts: Pixels[], gap = 4): Pixels {
  const h = Math.max(...parts.map((p) => p.h));
  const w = parts.reduce((n, p) => n + p.w, 0) + gap * (parts.length - 1);
  const out = new Pixels(w, h, C.bg);
  let x = 0;
  for (const p of parts) {
    out.blit(p, x, 0);
    x += p.w + gap;
  }
  return out;
}

/** A hash that gives the same pixel noise at x and x + 20, so a block's edges meet its neighbors. */
const hash = (x: number, y: number, seed: number): number => {
  let h = (((x % 20) + 20) % 20) * 374761393 + (((y % 20) + 20) % 20) * 668265263 + seed * 2246822519;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// ---- grass: the base speckle needs no edge work, only the details (tufts, flowers) change from block to block ----
function grass(seed: number, detail: 'plain' | 'tuft-a' | 'tuft-b' | 'flower'): Pixels {
  const p = new Pixels(20, 20);
  p.map((x, y) => {
    const v = hash(x, y, seed);
    return GRASS[v < 0.1 ? 1 : v < 0.82 ? 2 : 3];
  });
  const tuft = (x: number, y: number) => {
    p.rect(x - 2, y - 3, 1, 3, GRASS[4])
      .rect(x, y - 4, 1, 4, GRASS[4])
      .rect(x + 2, y - 3, 1, 3, GRASS[4]);
    p.rect(x - 1, y - 1, 3, 2, GRASS[0]);
  };
  if (detail === 'tuft-a') tuft(6, 8);
  if (detail === 'tuft-b') tuft(13, 13);
  if (detail === 'flower') {
    p.set(10, 6, C.wht).set(9, 6, C.yel).set(11, 6, C.yel).set(10, 5, C.yel).set(10, 7, C.yel).set(10, 6, C.wht);
  }
  return p;
}

// ---- stone wall: running bond, 10-pixel courses, joints repeat every 20 pixels so any 20-wide cut meets itself ----
function wall(x0: number, y0: number, w: number, h: number, seed: number, frame: boolean): Pixels {
  const p = new Pixels(w, h);
  const r = rng(seed);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const gx = x0 + x;
      const gy = y0 + y;
      const course = Math.floor(gy / 10);
      const shift = course % 2 ? 10 : 0;
      const jointV = (gx + shift) % 20 === 0;
      const jointH = gy % 10 === 0;
      let c = STONE[1 + (r() < 0.25 ? 1 : 0) + (r() < 0.1 ? -1 : 0)];
      if (jointV || jointH) c = STONE[0];
      else if (gy % 10 === 1 || (gx + shift) % 20 === 1) c = STONE[3];
      p.set(x, y, c);
    }
  if (frame) p.frame(0, 0, w, h, C.ink);
  return p;
}

// ---- figure builders ----
function figCut(): void {
  // A small house drawn as one 60x40 picture, then shown cut into its six blocks.
  const big = new Pixels(60, 40, C.sky);
  big.rect(0, 30, 60, 10, GRASS[2]);
  big.rect(8, 16, 44, 18, C.w2).rect(8, 16, 44, 2, C.w1).rect(8, 32, 44, 2, C.w0);
  for (let y = 0; y < 3; y++) big.rect(8, 20 + y * 6, 44, 1, C.w1);
  for (let i = 0; i < 12; i++) big.rect(4 + i * 2, 15 - Math.min(i, 11 - i) * 1, 52 - i * 4 > 0 ? 52 - i * 4 : 0, 1, C.r1);
  big.rect(26, 22, 8, 12, C.w0).rect(27, 23, 6, 10, C.w1).set(31, 28, C.yel);
  big.rect(13, 21, 7, 6, C.sky).frame(12, 20, 9, 8, C.w3).rect(16, 21, 1, 6, C.w3).rect(13, 24, 7, 1, C.w3);
  big.rect(40, 21, 7, 6, C.sky).frame(39, 20, 9, 8, C.w3).rect(43, 21, 1, 6, C.w3).rect(40, 24, 7, 1, C.w3);
  const pieces: Pixels[] = [];
  const gridded = new Pixels(60, 40);
  gridded.blit(big, 0, 0);
  for (let y = 0; y < 40; y += 20) for (let x = 0; x < 60; x += 20) pieces.push(big.crop(x, y, 20, 20));
  for (let x = 0; x < 60; x += 20) gridded.rect(x, 0, 1, 40, C.line);
  for (let y = 0; y < 40; y += 20) gridded.rect(0, y, 60, 1, C.line);
  const apart = new Pixels(3 * 24, 2 * 24, C.bg);
  pieces.forEach((q, i) => apart.blit(q, (i % 3) * 24, Math.floor(i / 3) * 24));
  save('cut-whole', strip([big, gridded], 8), 4);
  save('cut-apart', apart, 4);
}

function figSeam(): void {
  const make = (bevel: boolean): Pixels => {
    const t = new Pixels(20, 20).map((x, y) => GRASS[2 + (hash(x, y, 3) < 0.3 ? 1 : 0)]);
    if (bevel) {
      t.rect(0, 0, 20, 1, GRASS[4]).rect(0, 0, 1, 20, GRASS[4]).rect(0, 19, 20, 1, GRASS[0]).rect(19, 0, 1, 20, GRASS[0]);
    }
    return t;
  };
  const field = (t: Pixels): Pixels => {
    const f = new Pixels(100, 60);
    for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) f.blit(t, x * 20, y * 20);
    return f;
  };
  save('seam-bad-good', strip([field(make(true)), field(make(false))], 8), 3);
  save('seam-block-bad', make(true), 8);
  save('seam-block-good', make(false), 8);
}

function figGroup(): void {
  const field = (g: Pixels): Pixels => {
    const f = new Pixels(120, 80, C.bg);
    for (let y = 0; y < 2; y++) for (let x = 0; x < 3; x++) f.blit(g, x * 40, y * 40);
    return f;
  };
  // Four blocks cut one by one, each framed as if alone, against one 40x40 picture cut into four.
  const bad = new Pixels(40, 40);
  for (let i = 0; i < 4; i++) bad.blit(wall((i % 2) * 20, Math.floor(i / 2) * 20, 20, 20, 5 + i, true), (i % 2) * 20, Math.floor(i / 2) * 20);
  const good = wall(0, 0, 40, 40, 11, false);
  save('group-bad-good', strip([field(bad), field(good)], 8), 3);
}

function figReuse(): void {
  const brick = wall(0, 0, 20, 20, 21, false);
  const flipped = brick.flipX();
  const recolored = new Pixels(20, 20).map((x, y) => {
    const c = brick.get(x, y);
    const i = STONE.indexOf(c);
    return i < 0 ? c : [C.b0, C.b1, C.b2, C.sky][i];
  });
  const shifted = new Pixels(20, 20).map((x, y) => brick.get((x + 10) % 20, y));
  save('reuse-four', strip([brick, flipped, recolored, shifted], 4), 6);
}

function figSign(): void {
  const board = new Pixels(20, 20, C.sky);
  board.rect(0, 6, 20, 14, C.w2).rect(0, 6, 20, 1, C.w3).rect(0, 19, 20, 1, C.w0);
  for (let x = 2; x < 18; x += 4) board.rect(x, 10, 3, 1, C.ink).rect(x, 14, 3, 1, C.ink);
  const post = new Pixels(20, 20, C.sky);
  post.rect(8, 0, 4, 20, C.w1).rect(8, 0, 1, 20, C.w2).rect(11, 0, 1, 20, C.w0);
  post.rect(0, 17, 20, 3, GRASS[2]);
  const ground = new Pixels(20, 20, C.sky).rect(0, 17, 20, 3, GRASS[2]);
  // Two posts drawn off-center (left / right) cost two blocks and two boards; one centered post costs one.
  const postL = new Pixels(20, 20, C.sky);
  postL.rect(1, 0, 4, 20, C.w1).rect(0, 17, 20, 3, GRASS[2]);
  const postR = new Pixels(20, 20, C.sky);
  postR.rect(15, 0, 4, 20, C.w1).rect(0, 17, 20, 3, GRASS[2]);
  const row = (a: Pixels, b: Pixels, c: Pixels, d: Pixels, e: Pixels): Pixels => {
    const f = new Pixels(100, 40, C.sky);
    [a, b, c, d, e].forEach((q, i) => f.blit(q, i * 20, 0));
    return f;
  };
  // Top row is the sign boards; bottom row holds the posts. Same sign, two ways.
  const twoPosts = new Pixels(100, 40, C.sky);
  [board, board, board, board, board].forEach((q, i) => twoPosts.blit(q, i * 20, 0));
  [postL, ground, ground, ground, postR].forEach((q, i) => twoPosts.blit(q, i * 20, 20));
  const onePost = new Pixels(100, 40, C.sky);
  [board, board, board, board, board].forEach((q, i) => onePost.blit(q, i * 20, 0));
  [post, ground, ground, ground, post].forEach((q, i) => onePost.blit(q, i * 20, 20));
  void row;
  save('sign-two-and-one', strip([twoPosts, onePost], 8), 3);
}

function figGrass(): void {
  const A = grass(1, 'plain');
  const A2 = grass(2, 'plain');
  const B = grass(3, 'tuft-a');
  const Cc = grass(4, 'tuft-b');
  const D = grass(5, 'flower');
  const same = grass(1, 'tuft-a');
  const W = 8;
  const H = 5;
  const bad = new Pixels(W * 20, H * 20);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) bad.blit(same, x * 20, y * 20);
  // Variants: mostly plain, sparse details, never two details touching (a crowded block reads as a pattern again).
  const r = rng(77);
  const kind: number[][] = [];
  const good = new Pixels(W * 20, H * 20);
  const sets = [A, A2, B, Cc, D];
  for (let y = 0; y < H; y++) {
    kind.push([]);
    for (let x = 0; x < W; x++) {
      let k = r() < 0.5 ? 0 : 1;
      const v = r();
      const left = x > 0 ? kind[y][x - 1] : 0;
      const up = y > 0 ? kind[y - 1][x] : 0;
      if (v < 0.32 && left < 2 && up < 2) k = 2 + Math.floor(r() * 3);
      kind[y].push(k);
      good.blit(sets[k], x * 20, y * 20);
    }
  }
  save('grass-bad-good', strip([bad, good], 8), 2);
  save('grass-set', strip([A, A2, B, Cc, D], 4), 4);
}

mkdirSync(OUT, { recursive: true });
figCut();
figSeam();
figGroup();
figReuse();
figSign();
figGrass();
console.log('figures written to', OUT);
