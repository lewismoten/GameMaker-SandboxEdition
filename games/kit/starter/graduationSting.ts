// The graduations' sting (GRADSTNG.FLI), about 3 seconds before a graduation's title: two drapes in the stage's
// color part to show COMMENCEMENT and CLASS OF 1994 in gold on the academic band, then mortarboards are tossed
// up and fall while a gold seal on its ribbons pops in. No sound: a slide list plays an FLI silently.
import { encodeFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { centered } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Graduation } from './graduationConfig';
import { accentOf, band, goldLetters, mortarboard, seal } from './graduationScreens';
import { buildStarterPalette } from './palette';

/** The sting's file name on a graduation's disk. */
export const GRADUATION_STING = 'gradstng.fli';

const W = 320;
const H = 200;
const FRAMES = 40;
const FADE = 2;
const OPEN = 14;
/** FLI speed in 1/70 s: 5 is 14 frames a second. */
const SPEED = 5;
/** Where each tossed mortarboard rises from and when (x, first frame). */
const TOSSES: [number, number][] = [
  [50, 14],
  [265, 15],
  [100, 17],
  [220, 18],
  [125, 20],
];

const cached = new Map<string, Uint8Array>();

/** GRADSTNG.FLI as an Autodesk Animator FLI in the Starters' palette (delta frames, a fade at each end). */
export function graduationStingFli(cfg: Graduation): Uint8Array {
  const hit = cached.get(cfg.id);
  if (hit) return hit;
  const pal = buildStarterPalette(undefined, cfg.id);
  const a = pal.r(accentOf(cfg));
  const base = band(pal, cfg);
  const frames: Uint8Array[] = [];
  for (let f = 0; f < FRAMES; f++) {
    const p = new Pixels(W, H);
    p.px.set(base.px);
    centered(p, 14, 'SANDBOX SOFTWARE PRESENTS', pal.c('gold', 5));
    goldLetters(p, pal, 60, 'COMMENCEMENT', 3);
    goldLetters(p, pal, 96, 'CLASS OF 1994', 2);
    if (f >= 22) seal(p, pal, 160, 140 + Math.max(0, 26 - f) * 4, accentOf(cfg));
    // the drapes part from the middle, a gold fringe on each inner edge
    const half = Math.round((W / 2 - 8) * Math.max(0, 1 - f / OPEN));
    if (half > 0) {
      const edge = 8 + half;
      p.rect(8, 8, half, H - 16, a[2]).rect(W - edge, 8, half, H - 16, a[2]);
      for (let x = 8; x < edge; x += 12) p.rect(x, 8, 2, H - 16, a[3]).rect(W - x - 2, 8, 2, H - 16, a[3]);
      p.rect(edge - 3, 8, 3, H - 16, pal.c('gold', 4)).rect(W - edge, 8, 3, H - 16, pal.c('gold', 4));
    }
    // caps thrown up, hanging at the top of the arc, then falling back
    for (const [x, start] of TOSSES) {
      const t = f - start;
      if (t < 0 || t > 20) continue;
      const y = 180 - Math.round(4 * 60 * (t / 20) * (1 - t / 20));
      if (y < 8) continue;
      mortarboard(p, pal, x, y);
    }
    frames.push(p.px);
  }
  const palettes = frames.map((_, f) => {
    const k = f < FADE ? (f + 1) / (FADE + 1) : f >= FRAMES - FADE ? (FRAMES - 1 - f + 0.5) / (FADE + 0.5) : 1;
    return pal.pal.map((v) => Math.round(v * k));
  });
  const fli = encodeFli(frames, pal.pal, { speed: SPEED, palettes, runs: true, noLoopFrame: true });
  cached.set(cfg.id, fli);
  return fli;
}
