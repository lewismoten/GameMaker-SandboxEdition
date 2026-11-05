// THE GIANT's two bosses, each drawn once as a 40 by 40 picture and cut into four 20 by 20 parts
// (top left, top right, bottom left, bottom right), because a monster is one block and a big boss
// is several monsters standing together. The cuts run along the middle, so side by side the four
// parts read as one picture; with a part gone the others keep their own edges.
//   Rocky, level 1: a round stone fellow with a moss tuft, big brows and a flat, grumpy mouth.
//   Beep, level 2: a teal tin robot with a bulb on a wire, square eyes and a grille for a mouth.
// Both come in a plain picture and a "tone": cracked (after a first hit) or red (the hurt blink; Beep's red
// picture is cracked too, since it blinks after the hit that cracked her).
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { bevel, blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Pal } from '../../kit/starter/palette';

const T = 255;
export type Tone = 'plain' | 'red' | 'cracked';
/** The four parts in the order everything uses: top left, top right, bottom left, bottom right. */
export const PARTS = ['tl', 'tr', 'bl', 'br'] as const;
const CORNER: Record<(typeof PARTS)[number], [number, number]> = { tl: [0, 0], tr: [20, 0], bl: [0, 20], br: [20, 20] };

/** The four 20 by 20 parts of a 40 by 40 picture. */
export function cutParts(big: Pixels): Record<(typeof PARTS)[number], Pixels> {
  const out = {} as Record<(typeof PARTS)[number], Pixels>;
  for (const k of PARTS) out[k] = big.crop(CORNER[k][0], CORNER[k][1], 20, 20);
  return out;
}

/** A jagged crack from (x, y) going down and to the side, in ink. */
function crack(p: Pixels, pal: Pal, x: number, y: number, steps: number[]): void {
  let cx = x;
  let cy = y;
  for (const dx of steps) {
    p.line(cx, cy, cx + dx, cy + 2, pal.c('ink', 0));
    cx += dx;
    cy += 2;
  }
}

/** Rocky at wiggle `frame` (0 or 1): fists and moss sway, and she squints on frame 1. */
export function drawGolem(pal: Pal, frame: 0 | 1, tone: Tone): Pixels {
  const { c, r } = pal;
  const p = new Pixels(40, 40, T);
  const ramp = tone === 'red' ? r('red') : r('stone');
  const w = frame;
  // the fists first, behind the body
  blob(p, 4, 29 - w, 4.2, 4.6, ramp, 0, 4);
  blob(p, 35, 29 - w, 4.2, 4.6, ramp, 0, 4);
  // the body and head, two stone lumps
  blob(p, 20, 30, 15, 8.4, ramp, 0, 4);
  blob(p, 20, 15, 15, 11.6, ramp, 0, 4);
  // a lighter belly patch
  blob(p, 20, 32, 7, 4.4, tone === 'red' ? r('pink') : r('white'), 0, 3);
  // moss on top, swaying a pixel
  blob(p, 13 + w, 4, 3.2, 2.6, r('grass'), 1, 5);
  blob(p, 20, 3, 3.6, 2.8, r('grass'), 1, 5);
  blob(p, 27 - w, 4, 3.2, 2.6, r('grass'), 1, 5);
  // big round eyes, or a squint
  for (const x of [13, 27]) {
    if (frame && tone !== 'red') {
      p.line(x - 3, 15, x + 3, 15, c('ink', 0)).line(x - 3, 16, x + 3, 16, c('ink', 0));
    } else {
      p.disc(x, 15, 4.1, c('white', 3))
        .disc(x, 15, 1.7, c('ink', 0))
        .set(x - 1, 14, c('white', 3));
    }
  }
  // brows slanting in and down, a grumpy look
  p.line(8, 8, 16, 11, c('ink', 0)).line(8, 9, 16, 12, c('ink', 0));
  p.line(31, 8, 23, 11, c('ink', 0)).line(31, 9, 23, 12, c('ink', 0));
  // rosy cheeks and a flat mouth with the corners turned down a little
  p.disc(8, 21, 1.8, c('pink', 2)).disc(31, 21, 1.8, c('pink', 2));
  p.line(15, 23, 24, 23, c('ink', 0)).set(14, 24, c('ink', 0)).set(25, 24, c('ink', 0));
  if (tone === 'cracked') {
    crack(p, pal, 22, 3, [-1, 1, -1]);
    crack(p, pal, 33, 25, [-1, -1, 1, -1]);
  }
  return outline(p, c('ink', 0), { transparent: T });
}

/** Beep at wiggle `frame`: the bulb on the wire brightens and the eyes look a pixel to one side. */
export function drawRobot(pal: Pal, frame: 0 | 1, tone: Tone): Pixels {
  const { c, r } = pal;
  const p = new Pixels(40, 40, T);
  const ramp = tone === 'red' ? r('red') : r('teal');
  const dim = frame ? 0 : 1;
  // the wire and the bulb
  p.line(20, 5, 20, 8, c('ink', 1));
  p.disc(20, 4, 2.4, frame ? c('gold', 5) : c('gold', 3));
  // the arms, then the head, neck and body
  bevel(p, 1, 24, 5, 12, ramp, 2, 1);
  bevel(p, 34, 24, 5, 12, ramp, 2, 1);
  bevel(p, 6, 9, 28, 14, ramp, 2, 2);
  bevel(p, 16, 23, 8, 3, r('stone'), 2, 1);
  bevel(p, 7, 26, 26, 12, ramp, 2, 2);
  // two square eyes, white with a dark square that looks to one side, and flat brows
  for (const x of [11, 24]) {
    p.rect(x, 12, 6, 6, c('white', 3)).rect(x + 1 + frame, 13, 3, 4, c('ink', 0));
  }
  p.line(11, 10, 16, 10, c('ink', 0)).line(24, 10, 29, 10, c('ink', 0));
  // a grille for a mouth
  p.rect(13, 19, 14, 3, c('ink', 0));
  for (let x = 15; x <= 25; x += 3) p.line(x, 19, x, 21, c('stone', 3));
  // a chest panel with three round lights
  p.rect(12, 29, 16, 6, c('ink', 1));
  p.disc(16, 32, 1.6, c('gold', 4))
    .disc(20, 32, 1.6, c('pink', 2))
    .disc(24, 32, 1.6, c('white', 3 - dim));
  if (tone !== 'plain') {
    crack(p, pal, 12, 9, [1, -1, 1, -1, 1]);
    crack(p, pal, 30, 27, [-1, 1, -1, 1]);
    p.rect(8, 33, 3, 2, c('ink', 1)); // a chip of paint gone
  }
  return outline(p, c('ink', 0), { transparent: T });
}
