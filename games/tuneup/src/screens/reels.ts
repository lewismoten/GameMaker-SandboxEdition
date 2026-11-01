// The cartoons (kit's Reel: whole pictures, stored as what changed, faded by palette).
// - The opening, in three parts: Gwinn's night of mischief (the trunk tipped into THE CHEZ's
//   open hood), the morning (the horn honks like a kazoo), and the shrinking trick (Doc Leo and
//   Sir Reginald III shrink away into the engine).
// - The Hat Sting, before each level: Doc Leo taps his hat and pulls out the level's tool, then
//   the cutaway CHEZ shows the parts tuned so far, the last one lit. One reel, a tool apiece.
// - The ending (for now, the engine bay's end): the cutaway with every part so far lit.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Reel } from '@lewismoten/gamemaker-sandbox-tools/kit/reel';
import { centered } from '../../../snowbound/src/art/font';
import { scaleBlit } from '../../../snowbound/src/screens/scenery';
import { GWINN } from '../../../teddy2/src/sprites/gwinn';
import { SP, INK, cutaway, drawChez, drawChicken, drawLeo, garage, nightYard, toolPic, type Tool } from './art';

const c = SP.c;
/** Frames a second: a wait of 5/70 s a frame. */
export const SPEED = 5;

/** A sparkle (a four-point star) at (x, y), `r` long. */
function sparkle(p: Pixels, x: number, y: number, r: number, col = c('yellow', 3)): void {
  for (let i = -r; i <= r; i++) p.set(x + i, y, col).set(x, y + i, col);
  p.set(x, y, c('paint', 3));
}

/** A speech balloon with `s` in it, its tail at (tx, ty). */
function balloon(p: Pixels, x: number, y: number, s: string, tx: number, ty: number): void {
  const w = s.length * 8 + 12;
  p.rect(x, y, w, 16, c('paint', 3)).frame(x, y, w, 16, INK);
  p.line(x + 10, y + 15, tx, ty, INK).line(x + 14, y + 15, tx, ty, INK);
  centered(p, y + 4, s, INK, 1, undefined, x + w / 2);
}

/** The opening: three parts of about four seconds each. */
export function openingReel(): Reel {
  const r = new Reel(SP.pal);
  // 1. night: THE CHEZ in the yard, hood up; Gwinn tips the trunk, the instruments' notes fly in
  const night = nightYard();
  drawChez(night, 60, 70, 4, false);
  night.rect(60, 92, 50, 3, c('red', 3)).line(60, 92, 76, 70, c('red', 2));
  const trunk = (p: Pixels, tip: number) => {
    const x = 220;
    const y = 150 - 26;
    p.rect(x, y + tip, 44, 26 - tip, c('wood', 1))
      .frame(x, y + tip, 44, 26 - tip, INK)
      .rect(x, y + tip + 8, 44, 3, c('gold', 1));
  };
  for (let f = 0; f < 18; f++)
    r.frame(
      night,
      (p) => {
        trunk(p, Math.min(10, f));
        scaleBlit(p, f % 4 < 2 ? GWINN.gwinnRun1 : GWINN.gwinnRun2, 300 - f * 6, 126, 2, true);
        for (let k = 0; k < Math.max(0, f - 4); k++) {
          const t = (f - 4 - k) / 10;
          if (t > 1) continue;
          const nx = Math.round(220 - t * 120);
          const ny = Math.round(130 - Math.sin(t * Math.PI) * 60);
          p.disc(nx, ny, 3, c('yellow', 2)).rect(nx + 2, ny - 8, 1, 8, c('yellow', 2));
        }
      },
      1,
      Math.min(1, (f + 1) / 4),
    );
  // 2. morning: Doc Leo and Sir Reginald come to the car; the horn honks like a kazoo
  const morn = garage(160);
  drawChez(morn, 100, 60, 5);
  for (let f = 0; f < 20; f++)
    r.frame(morn, (p) => {
      const x = Math.min(30, -40 + f * 6);
      drawLeo(p, f < 12 ? `walk${f % 4}` : 'front', x, 160, 2);
      drawChicken(p, x + 34, 160, 1.5, { bob: f % 2 });
      if (f >= 12) balloon(p, 150, 20, 'HONK-ZOO!', 120, 70);
    });
  // 3. the shrinking trick: smaller and smaller, in a swirl of sparkles, into the hood
  for (let f = 0; f < 18; f++)
    r.frame(morn, (p) => {
      const s = f < 6 ? 2 : f < 10 ? 1 : 0;
      if (s) drawLeo(p, 'grin', 40 + (2 - s) * 20, 160, s);
      if (s) drawChicken(p, 74 + (2 - s) * 20, 160, s * 0.75);
      for (let k = 0; k < 8; k++) {
        const a = k * 0.8 + f * 0.5;
        sparkle(p, 70 + Math.round(Math.cos(a) * (40 - f * 2)), 120 + Math.round(Math.sin(a) * (30 - f)), 3);
      }
      if (f >= 12) centered(p, 176, 'THE SHRINKING TRICK!', c('lamp', 4), 1, INK);
    });
  return r.fadeOut(6);
}

/** The Hat Sting before level `level` (1 on): the hat's tool, then the cutaway with `level - 1` parts done. */
export function stingReel(level: number, tool: Tool, name: string): Reel {
  const r = new Reel(SP.pal);
  const bg = garage(170);
  const pic = toolPic(tool);
  // he taps his hat twice
  for (let f = 0; f < 8; f++) r.frame(bg, (p) => drawLeo(p, f % 4 < 2 ? 'hop' : 'front', 130, 170, 3), 1, Math.min(1, (f + 1) / 3));
  // the tool rises out of the hat, sparkling, and grows
  for (let f = 0; f < 14; f++)
    r.frame(bg, (p) => {
      drawLeo(p, 'hop', 130, 170, 3);
      const s = f < 7 ? 1 : 2;
      const y = 40 - f * 2;
      scaleBlit(p, pic, 160 - 16 * s, y - 16 * s + 16, s);
      for (let k = 0; k < 4; k++) sparkle(p, 160 + Math.round(Math.cos(k * 1.6 + f) * 30), y + Math.round(Math.sin(k * 1.6 + f) * 16), 2 + (f % 2));
    });
  for (let f = 0; f < 10; f++)
    r.frame(bg, (p) => {
      drawLeo(p, 'hop', 130, 170, 3);
      scaleBlit(p, pic, 186, 18, 2);
      sparkle(p, 182, 22, 3);
      centered(p, 182, `LEVEL ${level}: ${name}`, c('lamp', 4), 1, INK);
    });
  // the cutaway: what's tuned so far, the newest part blinking
  for (let f = 0; f < 16; f++) r.add(stamp(cutaway(level - 1, level - 2, f % 4 < 2), level > 1 ? 'TUNED SO FAR' : 'THE PARTS TO TUNE'));
  return r.fadeOut(6);
}

/** The ending (for now): every part so far tuned, blinking in turn. */
export function endingReel(parts: number): Reel {
  const r = new Reel(SP.pal);
  for (let f = 0; f < 24; f++) r.add(stamp(cutaway(parts, (f >> 2) % parts, f % 2 === 0), 'THE ENGINE BAY IS TUNED!'), 1, Math.min(1, (f + 1) / 4));
  return r;
}

function stamp(p: Pixels, words: string): Pixels {
  centered(p, 10, words, c('paint', 3), 1, INK);
  return p;
}
