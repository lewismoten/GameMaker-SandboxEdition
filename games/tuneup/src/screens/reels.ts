// The cartoons (kit's Reel: whole pictures, stored as what changed, faded by palette).
// - The opening, in three parts: Gwinn's night of mischief (the trunk tipped into THE CHEZ's
//   open hood), the morning (the horn honks like a kazoo), and the shrinking trick (Doc Leo and
//   Sir Reginald III shrink away into the engine).
// - The Hat Sting, before each level: Doc Leo taps his hat and pulls out the level's tool, then
//   the cutaway CHEZ shows the parts tuned so far, the last one lit. One reel, a tool apiece.
// - Before the test drive: the un-shrink, Doc Leo and Lady Regina back to full size.
// - The ending: the parade, the balloon CHEZ, and Gwinn bringing back the toolbox.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Reel } from '@lewismoten/gamemaker-sandbox-tools/kit/reel';
import { CHEZ_BODY, CHEZ_WHEELS } from '../../../kit/chez';
import { gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { centered } from '../../../snowbound/src/art/font';
import { scaleBlit } from '../../../snowbound/src/screens/scenery';
import { GWINN } from '../../../teddy2/src/sprites/gwinn';
import { SP, INK, DREAM_PARTS, REAL_PARTS, cutaway, drawChez, drawChicken, drawLeo, garage, nightYard, toolPic, type Tool } from './art';

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
  // the cutaway: what's tuned so far, the newest part blinking (the dream's parts for levels 1-4,
  // the real car's from level 5)
  const real = level >= REAL_FROM;
  const parts = real ? REAL_PARTS : DREAM_PARTS;
  const done = Math.min(parts.length, level - (real ? REAL_FROM : 1));
  for (let f = 0; f < 16; f++) r.add(stamp(cutaway(parts, done, done - 1, f % 4 < 2), done ? 'TUNED SO FAR' : 'THE PARTS TO TUNE'));
  return r.fadeOut(6);
}

/** The first level of the real, electric tune-up (levels before it are the dream). */
export const REAL_FROM = 5;

/** A street on parade day: sky, brick shop fronts, bunting, the crowd at the barrier, the road from `road`. */
function paradeStreet(road = 150, dusk = false): Pixels {
  const p = new Pixels(320, 200, c('sky', 4));
  gradient(p, 0, 0, 320, road, dusk ? [c('navy', 0), c('navy', 1), c('purple', 1), c('orange', 2)] : [c('sky', 3), c('sky', 5), c('sky', 7)], 0, 3);
  for (let x = 0; x < 320; x += 80) {
    const top = 40 + ((x / 80) % 2) * 16;
    p.rect(x + 4, top, 72, road - top, c('brick', 2)).rect(x + 4, top, 72, 4, c('stone', 3));
    for (let wy = top + 12; wy < road - 30; wy += 22)
      for (let wx = x + 12; wx < x + 70; wx += 20) p.rect(wx, wy, 10, 12, c('siding', 2)).frame(wx, wy, 10, 12, c('paint', 3));
  }
  for (let x = 0; x < 320; x += 10) {
    const y = 66 + Math.round(Math.sin((x / 320) * Math.PI) * 10);
    p.line(x, y, x + 10, y, c('ink', 1));
    for (let r = 0; r < 6; r++) p.rect(x + 2 + (r >> 1), y + 1 + r, 6 - r, 1, c((['red', 'yellow', 'blue', 'green'] as const)[(x / 10) % 4], 2));
  }
  for (let x = 4; x < 320; x += 9)
    p.disc(x, road - 14, 3.5, c('skin', 1 + (x % 3))).rect(x - 3, road - 10, 7, 10, c((['blue', 'green', 'purple', 'orange'] as const)[x % 4], 2));
  p.rect(0, road - 6, 320, 3, c('red', 2));
  gradient(p, 0, road, 320, 200 - road, [c('asphalt', 1), c('asphalt', 0)], 0, 2);
  for (let x = 10; x < 320; x += 40) p.rect(x, road + 24, 20, 3, c('paint', 3));
  return p;
}

/** Confetti over a frame: bits of every color, falling a little each frame `f`. */
function confetti(p: Pixels, f: number, n = 40): void {
  let s = 3;
  for (let i = 0; i < n; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const x = s % 320;
    const y = ((s >> 9) % 140) + f * 3;
    p.rect(x, y % 150, 2, 1, c((['red', 'yellow', 'blue', 'green', 'pink'] as const)[i % 5], 3));
  }
}

/** Before the test drive: Doc Leo and Lady Regina pop out of the hood and grow back to full size, in a swirl of sparkles. */
export function unshrinkReel(): Reel {
  const r = new Reel(SP.pal);
  const morn = garage(160);
  drawChez(morn, 100, 60, 5);
  for (let f = 0; f < 18; f++)
    r.frame(
      morn,
      (p) => {
        const s = f < 6 ? 0 : f < 11 ? 1 : 2;
        if (s) drawLeo(p, f < 14 ? 'grin' : 'front', 40 + (2 - s) * 20, 160, s);
        if (s) drawChicken(p, 74 + (2 - s) * 20, 160, s * 0.75, { lady: true, bob: f % 2 });
        for (let k = 0; k < 8; k++) {
          const a = k * 0.8 - f * 0.5;
          sparkle(p, 70 + Math.round(Math.cos(a) * (6 + f * 2)), 120 + Math.round(Math.sin(a) * (4 + f)), 3);
        }
        if (f >= 12) centered(p, 176, 'FULL SIZE AGAIN!', c('lamp', 4), 1, INK);
      },
      1,
      Math.min(1, (f + 1) / 4),
    );
  return r.fadeOut(6);
}

/** A red toolbox (the one Gwinn buried), `s` pixels a unit, its top left at (x, y). */
function toolbox(p: Pixels, x: number, y: number, s: number): void {
  p.rect(x, y + 3 * s, 14 * s, 7 * s, c('red', 2)).frame(x, y + 3 * s, 14 * s, 7 * s, INK);
  p.rect(x, y + 3 * s, 14 * s, s, c('red', 3))
    .rect(x + 4 * s, y, 6 * s, s, INK)
    .rect(x + 4 * s, y, s, 3 * s, INK)
    .rect(x + 9 * s, y, s, 3 * s, INK);
  p.rect(x + 2 * s, y + 9 * s, 10 * s, s, c('dirt', 2));
}

/**
 * The ending, in three parts: THE CHEZ leads the parade past the crowd in a storm of confetti;
 * Doc Leo twists a balloon animal of THE CHEZ; and Gwinn trots in with the toolbox she buried,
 * by the real car with Teddy in the window and Lady Regina on the roof, on the last chord.
 */
export function endingReel(): Reel {
  const r = new Reel(SP.pal);
  // 1. the parade: the car rolls in from the right, the band behind, confetti falling
  const street = paradeStreet();
  for (let f = 0; f < 22; f++)
    r.frame(
      street,
      (p) => {
        const x = Math.max(110, 330 - f * 14);
        drawChez(p, x, 112, 2.5);
        for (let k = 0; k < 4; k++) {
          const bx = x + 110 + k * 26;
          if (bx < 320) {
            p.rect(bx, 136, 12, 18, c('red', 2)).rect(bx, 136, 12, 3, c('paint', 3));
            p.disc(bx + 6, 131, 4, c('skin', 2))
              .rect(bx + 2, 122, 9, 6, INK)
              .rect(bx + 6, 118, 1, 4, c('yellow', 3));
            p.ring(bx + 10, 142 + (f % 2), 4, c('gold', 2));
          }
        }
        confetti(p, f);
      },
      1,
      Math.min(1, (f + 1) / 4),
    );
  // 2. the balloon CHEZ: Doc Leo twists red balloons along the car's own outline (the shared
  // side view's body, games/kit/chez.ts), one sausage at a time, then the white wheels
  const show = garage(160);
  const S3 = 3;
  const ox = 120;
  const oy = 92;
  const pts = CHEZ_BODY.map(([x, y]) => [ox + (40 - x) * S3, oy + y * S3] as const);
  for (let f = 0; f < 22; f++)
    r.frame(show, (p) => {
      drawLeo(p, f % 4 < 2 ? 'grin' : 'front', 50, 160, 2);
      const n = Math.min(pts.length, Math.floor(f / 2));
      for (let i = 0; i < n; i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[(i + 1) % pts.length];
        const len = Math.max(1, Math.hypot(x1 - x0, y1 - y0));
        for (let t = 0; t <= len; t += 2) p.disc(x0 + ((x1 - x0) * t) / len, y0 + ((y1 - y0) * t) / len, 4, c('red', 2));
        p.disc(x0, y0, 2, c('red', 0)).set(Math.round(x0) + 2, Math.round(y0) - 2, c('paint', 3));
      }
      if (n >= pts.length)
        for (const wx of CHEZ_WHEELS) p.disc(ox + (40 - wx) * S3, oy + 18 * S3, 8, c('paint', 3)).ring(ox + (40 - wx) * S3, oy + 18 * S3, 8, c('metal', 2));
      if (f >= 18) balloon(p, 150, 24, 'TA-DA!', 180, 80);
    });
  // 3. Gwinn brings back the toolbox; everyone by the car, the last chord
  const yard = garage(160);
  drawChez(yard, 90, 60, 5);
  for (let f = 0; f < 24; f++)
    r.frame(yard, (p) => {
      drawLeo(p, 'front', 30, 160, 2);
      drawChicken(p, 150, 62, 1.25, { lady: true, squawk: f > 16 });
      const gx = Math.max(262, 330 - f * 8);
      scaleBlit(p, f % 4 < 2 ? GWINN.gwinnRun1 : GWINN.gwinnRun2, gx, 128, 2, true);
      toolbox(p, gx - 8, 150, 2);
      if (f >= 12) centered(p, 10, 'TUNED UP!', c('lamp', 4), 2, INK);
      if (f >= 16) confetti(p, f - 16, 24);
    });
  return r.fadeOut(8);
}

function stamp(p: Pixels, words: string): Pixels {
  centered(p, 10, words, c('paint', 3), 1, INK);
  return p;
}
