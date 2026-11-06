// Pictures of the lessons (never on the disk), for the progress shots: the walkthrough played on the real engine, and
// from each level the screen with the most fireworks in it, then close-ups of three bursts from rocket to embers.
//   cd web && npx vite-node ../games/fireworks/tools/shots.ts <outDir>
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import type { Walkthrough } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';
import { nightPalette } from '../src/night';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const pal = nightPalette();
/** The colors sparks are drawn in: the bright ramps and the embers (grass, flowers and doors share some). */
const spark = new Set(['red', 'pink', 'green', 'teal', 'gold', 'orange', 'purple', 'blue', 'ember'].flatMap((r) => pal.r(r)));
const sky = new Set(pal.r('sky'));
/** Sparks in a part of the screen: pixels of a spark color with sky on most sides (grass, vines and signs are solid). */
const sparksIn = (px: Uint8Array, x0: number, y0: number, w: number, h: number) => {
  let n = 0;
  for (let y = Math.max(1, y0); y < Math.min(199, y0 + h); y++)
    for (let x = Math.max(1, x0); x < Math.min(319, x0 + w); x++) {
      if (!spark.has(px[y * 320 + x])) continue;
      let open = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (sky.has(px[(y + dy) * 320 + x + dx])) open++;
      if (open >= 5) n++;
    }
  return n;
};
const walk = JSON.parse(readFileSync(new URL('../walkthrough.json', import.meta.url), 'utf8')) as Walkthrough;
const best = new Map<number, { n: number; px: Uint8Array; palette: Uint8Array }>();
/** Frames kept for the close-ups: every 4th frame of level 2. */
const level2: Uint8Array[] = [];
let frame = 0;
/** The brightest the palette has been: lower is a fade. */
let lit = 0;
await replay('fireworks', walk, {
  onFrame: (screen, scene) => {
    frame++;
    // skip the fades between scenes (sparks are counted by color number, which a faded palette keeps): the title comes
    // first, at full brightness, and the levels' palette is within a tenth of it
    const bright = screen.palette.reduce((a, b) => a + b, 0);
    lit = Math.max(lit, bright);
    if ((scene !== 2 && scene !== 3) || bright < lit * 0.9) return;
    // and the level's title card, which covers the sky
    let skyPx = 0;
    for (let i = 0; i < 320 * 130; i++) if (sky.has(screen.pixels[i])) skyPx++;
    if (skyPx < 320 * 130 * 0.6) return;
    const n = sparksIn(screen.pixels, 0, 0, 320, 130);
    if (n > (best.get(scene)?.n ?? 0)) best.set(scene, { n, px: Uint8Array.from(screen.pixels.subarray(0, 64000)), palette: Uint8Array.from(screen.palette) });
    if (scene === 3 && frame % 4 === 0) level2.push(Uint8Array.from(screen.pixels.subarray(0, 64000)));
  },
});
const screenOf = (px: Uint8Array) => {
  const p = new Pixels(320, 200);
  p.px.set(px);
  return p;
};
for (const [scene, b] of best) writePng(join(out, `level${scene - 1}-fullest.png`), screenOf(b.px), b.palette, 2);
// close-ups: three bursts at their fullest, 100 pixels square around them, twelve frames in a row from just before
/** Where a frame's sparks are, on the screen, and how many. */
const centre = (px: Uint8Array) => {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let y = 0; y < 130; y += 2)
    for (let x = 0; x < 320; x += 2) {
      const c = sparksIn(px, x, y, 2, 2);
      sx += c * x;
      sy += c * y;
      n += c;
    }
  return { x: n ? sx / n : 0, y: n ? sy / n : 0, n };
};
// the fullest moments of three different bursts: far apart in time or on the screen
const scored = level2.map((px, i) => ({ i, ...centre(px) })).sort((a, b) => b.n - a.n);
const peaks: typeof scored = [];
for (const s of scored) if (peaks.length < 3 && peaks.every((p) => Math.abs(p.x - s.x) > 60)) peaks.push(s);
peaks
  .sort((a, b) => a.i - b.i)
  .forEach(({ i: at, x, y }, k) => {
    const x0 = Math.max(0, Math.min(220, Math.round(x) - 50));
    const y0 = Math.max(0, Math.min(100, Math.round(y) - 50));
    const strip = new Pixels(12 * 102, 100, 0);
    for (let f = 0; f < 12; f++) {
      const src = level2[Math.min(level2.length - 1, Math.max(0, at - 6 + f * 2))];
      for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) strip.set(f * 102 + x, y, src[(y0 + y) * 320 + x0 + x]);
    }
    writePng(join(out, `level2-closeup-${k + 1}.png`), strip, best.get(3)!.palette, 2); // the palette at the fullest moment (a scene's end fades it)
  });
console.log(`shots in ${out}`);
