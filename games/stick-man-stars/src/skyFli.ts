// The cartoons between levels: the same hill the title shows, and the sky changing from one level's palette
// to the next while Stick Man waves. The change is a palette animation (cheap in an .FLI): night to dawn, the
// stars fade out as the sun comes up; dawn to day, the sun climbs; day to dusk, the sun sets and the first
// star comes out. The stars are one color (gold 5), so a fade is one palette entry changing.
import { encodeFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { scene } from '../../kit/starter/screens';

export type SunMove = 'rise' | 'climb' | 'set';
const FRAMES = 36;
const SPEED = 4;
const SUN_X = 250;

/** The sun's height in frame `f`: below the hills at the start of a rise, up high on a climb, down again on a set. */
function sunY(move: SunMove, t: number): number {
  if (move === 'rise') return 150 - t * 90;
  if (move === 'climb') return 60 - t * 25;
  return 35 + t * 115;
}

/** A cartoon from `fromPal` to `toPal` (both 768-byte VGA palettes of the same indexes). `hero` is Stick Man's picture (20x40). */
export function skyFli(
  pal: Pal,
  book: Book,
  hero: Pixels,
  fromPal: Uint8Array,
  toPal: Uint8Array,
  move: SunMove,
  stars: 'fade-out' | 'fade-in' | 'none',
): Uint8Array {
  const base = scene(pal, book, 160);
  scaleBlit(base, hero, 150, 80, 2);
  const sky = new Set(pal.r('sky'));
  const rand = rng(5);
  const points: [number, number][] = [];
  while (points.length < 44) {
    const x = Math.floor(rand() * 320);
    const y = Math.floor(rand() * 100);
    if (sky.has(base.get(x, y))) points.push([x, y]);
  }
  const starIdx = pal.c('gold', 5);
  const sunIdx = pal.c('gold', 4);
  const glowIdx = pal.c('gold', 3);
  const frames: Uint8Array[] = [];
  const palettes: Uint8Array[] = [];
  for (let f = 0; f < FRAMES; f++) {
    const t = f / (FRAMES - 1);
    const p = new Pixels(320, 200);
    p.px.set(base.px);
    const y = sunY(move, t);
    for (let py = 0; py < 160; py++)
      for (let px = 0; px < 320; px++) {
        if (!sky.has(base.get(px, py))) continue;
        const d = Math.hypot(px - SUN_X, py - y);
        if (d < 14) p.set(px, py, sunIdx);
        else if (d < 19 && move !== 'rise') p.set(px, py, glowIdx);
      }
    if (stars !== 'none') for (const [x, yy] of points) if (sky.has(p.get(x, yy))) p.rect(x, yy, 2, 2, starIdx);
    frames.push(Uint8Array.from(p.px));
    const mixed = fromPal.map((v, i) => Math.round(v + (toPal[i] - v) * t));
    // the stars: white at full strength, melting into the sky as they fade out (or out of it as they fade in)
    const k = stars === 'fade-out' ? 1 - Math.min(1, t * 1.6) : stars === 'fade-in' ? Math.max(0, t * 1.6 - 0.6) : 0;
    const s = pal.c('sky', 1) * 3;
    for (let c = 0; c < 3; c++) mixed[starIdx * 3 + c] = Math.round(mixed[s + c] + (60 - mixed[s + c]) * k);
    palettes.push(mixed);
  }
  return encodeFli(frames, palettes[0], { speed: SPEED, palettes, runs: true, noLoopFrame: true });
}
