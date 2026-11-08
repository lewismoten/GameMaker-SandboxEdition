// Draws the figures of art course 3 ("Palettes") into src/artCourses/figures/. Ramps and the hue-shift pair are drawn here
// with indexed pixels; the swap, the spend and the series bars use real data read from built disks (games/<id>/disk/): one
// scene of a Bard game drawn with each of its four palettes, one level's 256 colors split by who uses them, and the
// average colors in a scene's block sets for each series (numbers from the survey in the course words).
// The disks must be built (`npm run build:games` from the root); GM_GAMES picks another games folder.
// Run from web/: npx vite-node scripts/artCourseFigures3.ts
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { MLEN, parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { C, OUT, pal as kitPal, strip } from './artCourseKit';

const GAMES = process.env.GM_GAMES ?? fileURLToPath(new URL('../../games/', import.meta.url));
const disk = (game: string, file: string): Uint8Array => {
  const dir = `${GAMES}/${game}/disk`;
  const real = readdirSync(dir).find((f) => f.toLowerCase() === file.toLowerCase()) ?? file;
  return new Uint8Array(readFileSync(`${dir}/${real}`));
};

/** The 8x8 font at (x, y), one color. */
function write(p: Pixels, text: string, x: number, y: number, color: number): void {
  [...text].forEach((ch, i) => {
    for (let r = 0; r < 8; r++) {
      const bits = FONT8X8[ch.charCodeAt(0) * 8 + r];
      for (let c = 0; c < 8; c++) if ((bits >> c) & 1) p.set(x + i * 8 + c, y + r, color);
    }
  });
}

// ---- ramps: the kit's color families, dark to light ----
const RAMPS: string[][] = [
  ['g0', 'g1', 'g2', 'g3', 'g4'],
  ['s0', 's1', 's2', 's3'],
  ['k0', 'k1', 'k2', 'k3'],
  ['w0', 'w1', 'w2', 'w3'],
  ['r0', 'r1', 'r2'],
  ['b0', 'b1', 'b2'],
];
function figRamps(): void {
  const chip = 20;
  const out = new Pixels(5 * (chip + 2) - 2, RAMPS.length * (chip + 2) - 2, C.bg);
  RAMPS.forEach((r, y) => r.forEach((n, x) => out.rect(x * (chip + 2), y * (chip + 2), chip, chip, C[n])));
  writePng(`${OUT}pal-ramps.png`, out, kitPal, 3);
}

/** A ball lit from the upper left, shaded with `steps` colors from `ramp` (dark to light). */
function ball(ramp: number[], steps: number): Pixels {
  const p = new Pixels(20, 20, C.sky);
  const use =
    steps === 1 ? [ramp[Math.floor(ramp.length / 2)]] : Array.from({ length: steps }, (_, i) => ramp[Math.round((i * (ramp.length - 1)) / (steps - 1))]);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const dx = x - 9.5;
      const dy = y - 9.5;
      if (dx * dx + dy * dy > 9 * 9) continue;
      const lx = (x - 7) / 11;
      const ly = (y - 7) / 11;
      const light = Math.max(0, Math.min(0.999, 1 - Math.sqrt(lx * lx + ly * ly) * 0.85));
      p.set(x, y, use[Math.min(use.length - 1, Math.floor(light * use.length))]);
    }
  return p;
}
function figBalls(): void {
  const wood = RAMPS[3].map((n) => C[n]);
  const grass = RAMPS[0].map((n) => C[n]);
  const row = (r: number[]): Pixels => strip([ball(r, 1), ball(r, 2), ball(r, 4)], 8);
  const a = row(wood);
  const b = row(grass);
  const out = new Pixels(a.w, a.h * 2 + 8, C.bg);
  out.blit(a, 0, 0);
  out.blit(b, 0, a.h + 8);
  writePng(`${OUT}pal-balls.png`, out, kitPal, 4);
}

// ---- hue shift: shadows lean cool, lights lean warm, against a ramp that only changes brightness ----
// A local palette: the kit's colors, then two ramps of a tan wall at indices 40..49.
const huePal = kitPal.slice();
const FLAT = [40, 41, 42, 43, 44];
const SHIFT = [45, 46, 47, 48, 49];
const flat: number[][] = [
  [14, 12, 8],
  [26, 23, 15],
  [38, 34, 22],
  [50, 45, 29],
  [62, 56, 37],
];
const shifted: number[][] = [
  [14, 12, 24],
  [26, 22, 22],
  [40, 34, 22],
  [54, 46, 22],
  [63, 58, 26],
];
flat.forEach((c, i) => huePal.set(c, FLAT[i] * 3));
shifted.forEach((c, i) => huePal.set(c, SHIFT[i] * 3));
function figHue(): void {
  const house = (ramp: number[]): Pixels => {
    const p = new Pixels(60, 40, C.sky);
    p.rect(10, 16, 40, 24, ramp[2]).rect(10, 16, 4, 24, ramp[3]).rect(46, 16, 4, 24, ramp[1]).rect(10, 36, 40, 4, ramp[1]);
    p.rect(6, 8, 48, 8, ramp[0])
      .rect(8, 6, 44, 2, ramp[1])
      .rect(8, 8, 44, 2, ramp[3])
      .rect(26, 24, 8, 16, ramp[0])
      .rect(16, 22, 6, 6, ramp[4])
      .rect(38, 22, 6, 6, ramp[4]);
    return p;
  };
  const chips = (ramp: number[]): Pixels => {
    const p = new Pixels(5 * 12, 12, C.bg);
    ramp.forEach((c, i) => p.rect(i * 12, 0, 11, 12, c));
    return p;
  };
  const col = (ramp: number[]): Pixels => {
    const h = house(ramp);
    const c = chips(ramp);
    const out = new Pixels(h.w, h.h + c.h + 6, C.bg);
    out.blit(h, 0, 0).blit(c, 0, h.h + 6);
    return out;
  };
  writePng(`${OUT}pal-hue.png`, strip([col(FLAT), col(SHIFT)], 10), huePal, 4);
}

// ---- real data ----
/** The first adventure scene's map window (16 x 10 cells) with the most different blocks, drawn with `pal`. */
function figSwap(): void {
  const game = parseGame(disk('carl', 'carl.gam'));
  const names = ['couch.pal', 'walls.pal', 'bed.pal', 'aux.pal'];
  const scene = game.scenes.find((s) => s.files[0].toLowerCase() === 'couch.pal')!;
  const blocks = parseBlocks(disk('carl', scene.files[2]), 150);
  const map = parseMap(disk('carl', scene.files[1]));
  let best = { x: 0, y: 0, n: -1 };
  for (let y = 0; y + 10 <= 100; y++)
    for (let x = 0; x + 16 <= MLEN; x++) {
      const seen = new Set<number>();
      for (let j = 0; j < 10; j++) for (let i = 0; i < 16; i++) seen.add(map.blocks[(y + j) * MLEN + x + i]);
      if (seen.size > best.n) best = { x, y, n: seen.size };
    }
  const draw = (): Pixels => {
    const p = new Pixels(320, 200);
    for (let j = 0; j < 10; j++)
      for (let i = 0; i < 16; i++) {
        const b = blocks[map.blocks[(best.y + j) * MLEN + best.x + i]];
        for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(i * 20 + x, j * 20 + y, b.pixels[y * 20 + x]);
      }
    return p;
  };
  const pic = draw();
  // day (couch.pal) and night (bed.pal) side by side: each picture's used colors move into half of one new palette
  const both = new Pixels(320 * 2 + 8, 200, 0);
  const merged = new Uint8Array(768);
  [names[0], names[2]].forEach((n, k) => {
    const src = new Uint8Array(disk('carl', n));
    const map = new Map<number, number>();
    for (const c of pic.px) if (!map.has(c)) map.set(c, 128 * k + map.size + (k === 0 ? 1 : 0));
    map.forEach((to, from) => merged.set(src.subarray(from * 3, from * 3 + 3), to * 3));
    both.blit(
      pic.crop(0, 0, 320, 200).map((_x, _y, c) => map.get(c)!),
      k * 328,
      0,
    );
    console.log('swap colors', n, map.size);
  });
  merged.set([4, 4, 6], 0);
  both.rect(320, 0, 8, 200, 0);
  writePng(`${OUT}pal-swap.png`, both, merged, 2);
  void names;
  console.log('swap window', best, 'distinct blocks', best.n);
}

/** One level's 256 entries as a 16 x 16 grid per user: background blocks, monsters, hero. Unused entries stay empty. */
function figSpend(): void {
  const palBytes = new Uint8Array(disk('pass-the-pie', 'yard.pal'));
  const sets = [
    ['bbl', 'yard.bbl', 150],
    ['mbl', 'pass.mbl', 100],
    ['cbl', 'rory.cbl', 50],
  ] as const;
  const used = sets.map(([, f, n]) => {
    const u = new Set<number>();
    for (const b of parseBlocks(disk('pass-the-pie', f), n)) for (const px of b.pixels) if (px !== 255) u.add(px);
    return u;
  });
  const all = new Set<number>(used.flatMap((u) => [...u]));
  const free = [...Array(256).keys()].filter((c) => !all.has(c));
  const gray = free[0];
  const dark = free[1];
  const p2 = palBytes.slice();
  p2.set([14, 14, 16], gray * 3);
  p2.set([4, 4, 6], dark * 3);
  const grid = (u: Set<number>): Pixels => {
    const g = new Pixels(16 * 8 + 1, 16 * 8 + 1, dark);
    for (let c = 0; c < 256; c++) g.rect((c % 16) * 8 + 1, Math.floor(c / 16) * 8 + 1, 7, 7, u.has(c) ? c : gray);
    return g;
  };
  const both = (a: Set<number>, b: Set<number>): number => [...a].filter((c) => b.has(c)).length;
  console.log('pass-the-pie yard used: bg', used[0].size, 'monsters', used[1].size, 'hero', used[2].size, 'all', all.size);
  console.log('shared bg+monsters', both(used[0], used[1]), 'bg+hero', both(used[0], used[2]), 'monsters+hero', both(used[1], used[2]));
  const top = strip(used.map(grid), 8);
  const out = new Pixels(top.w, top.h + 12, dark);
  out.blit(top, 0, 0);
  ['BLOCKS', 'MONSTERS', 'HERO'].forEach((t, i) => write(out, t, i * (129 + 8), top.h + 3, 255));
  p2.set([60, 60, 60], 255 * 3);
  writePng(`${OUT}pal-spend.png`, out, p2, 3);
}

/** Average colors in a scene's block sets, per series (survey numbers, 2026-11-08). */
function figSeries(): void {
  const rows: [string, number][] = [
    ['GAMEWARE', 160],
    ['SHAREWARE', 112],
    ['BIZARRE', 111],
    ['SANDBOX', 106],
    ['SPECIAL', 84],
    ['STARTERS', 78],
  ];
  const out = new Pixels(80 + 256 + 4 + 28, rows.length * 14 + 4, C.bg);
  rows.forEach(([name, n], i) => {
    write(out, name, 0, i * 14 + 3, C.ink);
    out.rect(80, i * 14 + 1, n, 11, C.g2).rect(80, i * 14 + 1, n, 2, C.g3);
    write(out, String(n), 80 + n + 4, i * 14 + 3, C.ink);
  });
  out.rect(80 + 255, 0, 1, out.h, C.line);
  writePng(`${OUT}pal-series.png`, out, kitPal, 3);
}

figRamps();
figBalls();
figHue();
figSwap();
figSpend();
figSeries();
