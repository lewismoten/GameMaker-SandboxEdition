// The cartoons (kit's Reel: whole pictures, stored as what changed, faded by palette).
// - The opening, in four parts: Gwinn's night of mischief (the toolbox buried, the instrument
//   trunk tipped into THE CHEZ), the morning (the horn honks like a kazoo), the shrinking trick,
//   and Sir Reginald III dozing off on the workbench into his dream (levels 1-4).
// - The Hat Sting, before each level: Doc Leo taps his hat and pulls out the level's tool, then
//   the cutaway CHEZ shows the parts tuned so far, the last one lit. One reel, a tool apiece.
// - Before the test drive: the un-shrink, Doc Leo and Lady Regina back to full size.
// - The ending: the parade, the balloon CHEZ, and Gwinn bringing back the toolbox.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Reel } from '@lewismoten/gamemaker-sandbox-tools/kit/reel';
import { CHEZ_BODY, CHEZ_WHEELS } from '../../../kit/chez';
import { gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { centered, text, textWidth } from '../../../snowbound/src/art/font';
import { scaleBlit } from '../../../snowbound/src/screens/scenery';
import { GWINN } from '../../../teddy2/src/sprites/gwinn';
import {
  SP,
  INK,
  DREAM_PARTS,
  REAL_PARTS,
  clownNoses,
  cutaway,
  noseless,
  drawChez,
  dreamFrame,
  parkChez,
  drawChicken,
  drawLeo,
  nightYard,
  toolPic,
  type Tool,
} from './art';
import { garage as garageWall } from './garage';

const c = SP.c;
/** The garage for a cartoon: its gradients dither in cells 4 wide (the FLI stores runs, not speckle). */
const garage = (floor?: number) => garageWall(floor, 4);
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

/** Frames a caption of `words` needs on screen to be read: about 3 s, and a quarter second a word. */
export function readFrames(...words: string[]): number {
  const n = words.join(' ').split(/\s+/).filter(Boolean).length;
  return Math.ceil(((3 + 0.25 * n) * 70) / SPEED);
}

/** Caption lines centered near the bottom of a frame. */
function caption(p: Pixels, lines: string[], y = 200 - lines.length * 11 - 6): void {
  lines.forEach((s, i) => {
    centered(p, y + i * 11, noseless(s), c('lamp', 4), 1, INK);
    clownNoses(p, Math.round(160 - textWidth(s) / 2), y + i * 11, s);
  });
}

/** One of the Clown Club's instruments, `k` 0-2 (a kazoo, a tambourine, a little horn), centered on (x, y). */
function instrument(p: Pixels, k: number, x: number, y: number): void {
  if (k === 0)
    p.rect(x - 7, y - 2, 12, 5, c('orange', 2))
      .rect(x + 5, y - 1, 3, 3, c('orange', 3))
      .rect(x - 2, y - 4, 3, 2, c('metal', 3))
      .frame(x - 7, y - 2, 12, 5, INK);
  else if (k === 1) {
    p.disc(x, y, 7, INK).disc(x, y, 6, c('wood', 2)).disc(x, y, 4, c('paint', 3));
    for (let a = 0; a < 6; a++) p.rect(x + Math.round(Math.cos(a) * 6) - 1, y + Math.round(Math.sin(a) * 6) - 1, 2, 2, c('gold', 3));
  } else {
    p.rect(x - 8, y - 1, 9, 3, c('gold', 2)).line(x + 1, y - 5, x + 1, y + 5, INK);
    for (let i = 0; i < 6; i++) p.rect(x + 1 + i, y - 1 - Math.round(i * 0.7), 1, 3 + Math.round(i * 1.4), c('gold', 3));
  }
}

/**
 * The opening, in four parts. Night: Gwinn buries the toolbox, then tips the Clown Club's
 * instrument trunk into THE CHEZ through its open door window. Morning: Doc Leo comes in with
 * Sir Reginald on his leash, and the horn honks like a kazoo. The shrinking trick. Then, on the
 * workbench, Sir Reginald dozes off, and the dream (levels 1-4) closes round him in cloud.
 */
export function openingReel(): Reel {
  const r = new Reel(SP.pal);
  // 1. night: THE CHEZ in the yard (no hood: what matters is under its bench seat)
  const night = nightYard();
  parkChez(night, 40, 158, 4, false, [c('leaf', 0), c('ink', 0)]);
  const hole = 268;
  const dig = (p: Pixels, f: number, sunk: number) => {
    // the toolbox sinks into its hole: the lawn in front of it stays
    p.disc(hole, 152, 15, c('dirt', 0));
    toolbox(p, hole - 14, 130 + sunk, 2);
    for (let y = 153; y < 200; y++) for (let x = hole - 16; x <= hole + 16; x++) p.set(x, y, night.get(x, y));
    p.rect(hole - 15, 151, 31, 2, c('dirt', 0));
    p.disc(hole + 26, 152, 6 + Math.min(4, f / 3), c('dirt', 1)).disc(hole + 24, 149, 3 + Math.min(3, f / 4), c('dirt', 2));
    scaleBlit(p, f % 4 < 2 ? GWINN.gwinnRun1 : GWINN.gwinnRun2, hole + 8, 124, 2, true);
    if (f % 2) p.rect(hole + 40 + (f % 3) * 3, 132 - (f % 4) * 3, 2, 2, c('dirt', 2)).rect(hole + 46, 128 + (f % 3) * 2, 2, 2, c('dirt', 1));
  };
  for (let f = 0; f < 16; f++) r.frame(night, (p) => dig(p, f, f), 1, Math.min(1, (f + 1) / 4));
  const buried = ['GWINN BURIES THE TOOLBOX...'];
  r.frame(night, (p) => (dig(p, 16, 22), caption(p, buried)), readFrames(...buried));
  // she noses the trunk over: the instruments tumble out and in through the door window
  const tipped = ["...AND TIPS THE CLOWN CLUB'S", 'INSTRUMENTS INTO THE CAR.'];
  const trunk = (p: Pixels, tip: number) => {
    const x = 204;
    const y = 150 - 26;
    p.rect(x, y + tip, 44, 26 - tip, c('wood', 1))
      .frame(x, y + tip, 44, 26 - tip, INK)
      .rect(x, y + tip + 8, 44, 3, c('gold', 1));
  };
  const mound = (p: Pixels) => p.disc(hole, 154, 12, c('dirt', 1)).disc(hole - 2, 151, 7, c('dirt', 2));
  for (let f = 0; f < 28; f++)
    r.frame(
      night,
      (p) => {
        mound(p);
        trunk(p, Math.min(10, f));
        scaleBlit(p, f % 4 < 2 ? GWINN.gwinnRun1 : GWINN.gwinnRun2, Math.max(244, 280 - f * 6), 126, 2, true);
        for (let k = 0; k < 3; k++) {
          const t = (f - 6 - k * 5) / 8;
          if (t < 0 || t > 1) continue;
          instrument(p, k, Math.round(224 - t * 74), Math.round(124 - Math.sin(t * Math.PI) * 50 - t * 6));
        }
        if (f >= 24) caption(p, tipped);
      },
      f === 27 ? readFrames(...tipped) : 1,
    );
  // 2. morning: Doc Leo comes in with Sir Reginald on his leash; the horn honks like a kazoo
  const morn = garage(160);
  parkChez(morn, 100, 170, 5);
  const honk = ['THE HORN HONKS LIKE A KAZOO!'];
  const walk = (p: Pixels, x: number, pose: string) => {
    drawLeo(p, pose, x, 170, 2, false, true);
    drawChicken(p, x - 34, 170, 1.25, {}, false, true);
    p.line(x + 22, 148, x - 14, 157, c('red', 2));
  };
  for (let f = 0; f < 14; f++) r.frame(morn, (p) => walk(p, -10 + f * 4, `walk${f % 4}`));
  r.frame(morn, (p) => (walk(p, 46, 'front'), balloon(p, 150, 20, 'HONK-ZOO!', 126, 124), caption(p, honk)), readFrames('HONK-ZOO!', ...honk));
  // 3. the shrinking trick: smaller and smaller, in a swirl of sparkles
  const trick = ['THE SHRINKING TRICK!'];
  for (let f = 0; f < 14; f++)
    r.frame(
      morn,
      (p) => {
        const s = f < 6 ? 2 : f < 10 ? 1 : 0;
        if (s) drawLeo(p, 'grin', 46 + (2 - s) * 20, 170, s, false, true);
        if (s) drawChicken(p, 12 + (2 - s) * 20, 170, s * 0.62, {}, false, true);
        for (let k = 0; k < 8; k++) {
          const a = k * 0.8 + f * 0.5;
          sparkle(p, 70 + Math.round(Math.cos(a) * (40 - f * 2)), 130 + Math.round(Math.sin(a) * (30 - f)), 3);
        }
        if (f === 13) caption(p, trick);
      },
      f === 13 ? readFrames(...trick) : 1,
    );
  // 4. tiny on the workbench, Sir Reginald dozes off, and the dream closes round him
  const doze = ['SIR REGINALD DOZES OFF', 'ON THE WORKBENCH, AND DREAMS...'];
  const bench = (p: Pixels, f: number) => {
    drawLeo(p, 'front', 20, 124, 1);
    drawChicken(p, 44, 124, 0.75, { peck: true });
    for (let i = 0; i < 3; i++) if (f > i * 3) text(p, 60 + i * 7, 112 - i * 9 - (f % 3), 'z', c('paint', 3), 1);
  };
  for (let f = 0; f < 10; f++) r.frame(morn, (p) => bench(p, f));
  r.frame(morn, (p) => (bench(p, 10), caption(p, doze)), readFrames(...doze));
  r.frame(morn, (p) => (bench(p, 11), dreamFrame(p, [52, 112]), caption(p, doze)), 12);
  return r.fadeOut(6);
}

/** The Hat Sting before level `level` (1 on): the hat's tool, then the cutaway with `level - 1` parts done. */
export function stingReel(level: number, tool: Tool, name: string): Reel {
  const r = new Reel(SP.pal);
  const bg = garage(170);
  const pic = toolPic(tool);
  // he taps his hat twice
  // levels 1-4 are Sir Reginald's dream: every picture of theirs is framed in cloud
  const dream = level < REAL_FROM;
  const framed = (draw: (p: Pixels) => void) => (p: Pixels) => {
    draw(p);
    if (dream) dreamFrame(p);
  };
  for (let f = 0; f < 8; f++)
    r.frame(
      bg,
      framed((p) => drawLeo(p, f % 4 < 2 ? 'hop' : 'front', 130, 170, 3)),
      1,
      Math.min(1, (f + 1) / 3),
    );
  // the tool rises out of the hat, sparkling, and grows
  for (let f = 0; f < 14; f++)
    r.frame(
      bg,
      framed((p) => {
        drawLeo(p, 'hop', 130, 170, 3);
        const s = f < 7 ? 1 : 2;
        const y = 40 - f * 2;
        scaleBlit(p, pic, 160 - 16 * s, y - 16 * s + 16, s);
        for (let k = 0; k < 4; k++) sparkle(p, 160 + Math.round(Math.cos(k * 1.6 + f) * 30), y + Math.round(Math.sin(k * 1.6 + f) * 16), 2 + (f % 2));
      }),
    );
  // the level's name, held long enough to read
  const title = `LEVEL ${level}: ${name}`;
  r.frame(
    bg,
    framed((p) => {
      drawLeo(p, 'hop', 130, 170, 3);
      scaleBlit(p, pic, 186, 18, 2);
      sparkle(p, 182, 22, 3);
      centered(p, 182, title, c('lamp', 4), 1, INK);
    }),
    readFrames(title),
  );
  // the cutaway: what's tuned so far, the newest part blinking (the dream's parts for levels 1-4,
  // the real car's from level 5)
  const real = level >= REAL_FROM;
  const parts = real ? REAL_PARTS : DREAM_PARTS;
  const done = Math.min(parts.length, level - (real ? REAL_FROM : 1));
  const words = done ? (dream ? 'IN THE DREAM: TUNED SO FAR' : 'TUNED SO FAR') : dream ? "THE DREAM'S PARTS TO TUNE" : 'THE PARTS TO TUNE';
  const blinks = Math.ceil(readFrames(words) / 4) * 4;
  for (let f = 0; f < blinks; f++) {
    const p = stamp(cutaway(parts, done, done - 1, f % 4 < 2), words);
    if (dream) dreamFrame(p);
    r.add(p);
  }
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

/** Before the test drive: Doc Leo and Lady Regina pop out from under the seat and grow back to full size, in a swirl of sparkles. */
export function unshrinkReel(): Reel {
  const r = new Reel(SP.pal);
  const morn = garage(160);
  parkChez(morn, 100, 170, 5);
  for (let f = 0; f < 18; f++)
    r.frame(
      morn,
      (p) => {
        const s = f < 6 ? 0 : f < 11 ? 1 : 2;
        if (s) drawLeo(p, f < 14 ? 'grin' : 'front', 40 + (2 - s) * 20, 170, s, false, true);
        if (s) drawChicken(p, 74 + (2 - s) * 20, 170, s * 0.75, { lady: true, bob: f % 2 }, false, true);
        for (let k = 0; k < 8; k++) {
          const a = k * 0.8 - f * 0.5;
          sparkle(p, 70 + Math.round(Math.cos(a) * (6 + f * 2)), 130 + Math.round(Math.sin(a) * (4 + f)), 3);
        }
        if (f >= 12) centered(p, 176, 'FULL SIZE AGAIN!', c('lamp', 4), 1, INK);
      },
      f === 17 ? readFrames('FULL SIZE AGAIN!') : 1,
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
  // 1. the parade: the car rolls in from the right, the band behind, confetti falling; then it
  // holds while the band plays on (a cartoon's moves at half speed, its moments held: Lewis
  // found the first cut far too fast to follow)
  const street = paradeStreet();
  for (let f = 0; f < 22 + 30; f++)
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
      f < 22 ? 2 : 1,
      Math.min(1, (f + 1) / 4),
    );
  // 2. the balloon CHEZ: Doc Leo twists red balloons along the car's own outline (the shared
  // side view's body, games/kit/chez.ts), one sausage at a time, then the white wheels
  const show = garage(160);
  const S3 = 3;
  const ox = 120;
  const oy = 106;
  const pts = CHEZ_BODY.map(([x, y]) => [ox + (40 - x) * S3, oy + y * S3] as const);
  for (let f = 0; f < 22; f++)
    r.frame(
      show,
      (p) => {
        drawLeo(p, f % 4 < 2 ? 'grin' : 'front', 50, 170, 2, false, true);
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
      },
      f === 21 ? readFrames('TA-DA!') : 2,
    );
  // 3. Gwinn brings back the toolbox; everyone by the car, the last chord
  const yard = garage(160);
  parkChez(yard, 90, 170, 5);
  // the confetti keeps falling while the words are read
  // Gwinn trots in with the toolbox (at half speed), a beat to see it, then the words held
  // long enough to read and a moment more before the fade
  const arrive = 9;
  const beat = 14;
  for (let f = 0; f < arrive + beat + readFrames('TUNED UP!') + 14; f++)
    r.frame(
      yard,
      (p) => {
        const t = f - arrive - beat;
        drawLeo(p, 'front', 30, 170, 2, false, true);
        drawChicken(p, 200, 75, 1.25, { lady: true, squawk: t > 4 });
        const gx = Math.max(262, 330 - f * 8);
        scaleBlit(p, f < arrive && f % 4 < 2 ? GWINN.gwinnRun2 : GWINN.gwinnRun1, gx, 128, 2, true);
        toolbox(p, gx - 8, 150, 2);
        if (t >= 0) centered(p, 10, 'TUNED UP!', c('lamp', 4), 2, INK);
        if (t >= 4) confetti(p, t - 4, 24);
      },
      f < arrive ? 2 : 1,
    );
  return r.fadeOut(8);
}

function stamp(p: Pixels, words: string): Pixels {
  centered(p, 10, words, c('paint', 3), 1, INK);
  return p;
}
