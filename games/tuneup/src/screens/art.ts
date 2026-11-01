// What the title, the cards and the cartoons are drawn from: the garage backdrop, Doc Leo and
// the rubber chicken at any size, THE CHEZ (kit/chez.ts) with Teddy riding in the passenger
// seat, the tools that come out of Doc Leo's hat, and the cutaway CHEZ whose parts light up as
// they are tuned. Everything is in the screen palette (palette.ts buildScreenPalette).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { blob, gradient } from '../../../snowbound/src/art/draw';
import { scaleBlit } from '../../../snowbound/src/screens/scenery';
import { POSES } from '../../../teddy2/src/sprites/teddy';
import { chezSide, type ChezInk } from '../../../kit/chez';
import { chicken, type ChickenPose } from '../art/chicken';
import { buildScreenPalette } from '../art/palette';
import { buildCharBlocks } from '../sprites/cast';

export const SP = buildScreenPalette();
const c = SP.c;
export const INK = c('ink', 0);

const leo = buildCharBlocks();
/** Doc Leo's pose `name` (20x40), as the hero is drawn. */
export const leoPose = (name: string): Pixels => {
  const p = leo.pics.get(`pose.${name}`);
  if (!p) throw new Error(`No Doc Leo pose ${name}`);
  return p;
};
/** Doc Leo scaled `s` times with his feet at (x, y). */
export function drawLeo(p: Pixels, pose: string, x: number, y: number, s: number, flip = false): void {
  scaleBlit(p, leoPose(pose), x, y - 40 * s, s, flip);
}
/** The chicken `s` times a block with its feet at (x, y). */
export function drawChicken(p: Pixels, x: number, y: number, s: number, o: ChickenPose = {}, flip = false): void {
  const pic = chicken(s, o);
  const q = flip ? pic.flipX() : pic;
  p.blit(q, x, y - q.h, 255);
}

/** The garage at dawn: a pegboard wall, a window full of sunrise, the slab floor from `floor`. */
export function garage(floor = 160): Pixels {
  const p = new Pixels(320, 200, c('wall', 3));
  gradient(p, 0, 0, 320, floor, SP.r('wall'), 2, 4);
  for (let y = 8; y < floor - 4; y += 10) for (let x = 6; x < 320; x += 10) p.set(x, y, c('wall', 1));
  // the window: sunrise through it
  p.rect(200, 20, 96, 64, c('mach', 1));
  gradient(p, 204, 24, 88, 56, SP.r('lamp'), 1, 4);
  p.rect(246, 24, 4, 56, c('mach', 1)).rect(204, 50, 88, 4, c('mach', 1));
  gradient(p, 0, floor, 320, 200 - floor, SP.r('floor'), 1, 3);
  p.rect(0, floor, 320, 2, c('floor', 4));
  return p;
}

/** The night yard: dark sky with stars, the fence, the lawn. */
export function nightYard(): Pixels {
  const p = new Pixels(320, 200, c('ink', 0));
  gradient(p, 0, 0, 320, 150, [c('ink', 0), c('navy', 0), c('navy', 1), c('blue', 0)], 0, 3);
  let s = 7;
  for (let i = 0; i < 60; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    p.set(s % 320, (s >> 9) % 110, c('cloud', (s >> 3) % 3));
  }
  p.disc(270, 30, 12, c('cloud', 2)).disc(275, 26, 11, c('navy', 0));
  for (let x = 0; x < 320; x += 12) p.rect(x, 104, 8, 46, c('wood', 0)).rect(x, 104, 8, 2, c('wood', 1));
  p.rect(0, 116, 320, 3, c('wood', 0));
  gradient(p, 0, 150, 320, 50, [c('ink', 0), c('leaf', 0), c('leaf', 1)], 0, 2);
  return p;
}

/** THE CHEZ's inks in the screen palette. */
export const CHEZ_INK: ChezInk = {
  body: [c('red', 1), c('red', 2), c('red', 3)],
  trim: c('red', 0),
  glass: [c('siding', 0), c('sky', 4)],
  roof: c('ink', 0),
  tire: c('ink', 0),
  hub: c('metal', 4),
  rim: c('paint', 3),
  stripe: c('asphalt', 1),
  pin: c('paint', 3),
  bumper: c('ink', 1),
  lamp: c('orange', 3),
  tail: c('red', 3),
  outline: INK,
};

/**
 * THE CHEZ facing left (the passenger side), `s` pixels a unit (40s x 20s), its box's top left
 * at (x, y), Teddy looking out of the door window when `teddy`.
 */
export function drawChez(p: Pixels, x: number, y: number, s: number, teddy = true): void {
  chezSide(p, x, y, CHEZ_INK, 'left', s);
  if (!teddy) return;
  // Teddy in the front passenger seat, his head in the door window, looking out
  const head = POSES.front.crop(2, 0, 16, 11);
  const k = Math.max(1, Math.round(s / 2.5));
  scaleBlit(p, head, x + Math.round(s * 15.5) - 8 * k, y + Math.round(s * 5.2) - 2 * k, k);
}

/** The tools Doc Leo's hat gives, a 32x32 picture each on clear. */
export type Tool = 'cables' | 'plug' | 'roll' | 'oilcan';
export function toolPic(t: Tool): Pixels {
  const p = new Pixels(32, 32, 255);
  if (t === 'cables') {
    // jumper cables: a red and a black clamp, their cables looping
    for (let r = 8; r <= 10; r++) p.ring(16, 18, r, r === 9 ? c('red', 2) : c('red', 1));
    for (let r = 5; r <= 6; r++) p.ring(16, 18, r, c('asphalt', 1));
    p.rect(2, 4, 10, 4, c('red', 2)).rect(2, 9, 10, 3, c('red', 1)).rect(20, 4, 10, 4, c('asphalt', 1)).rect(20, 9, 10, 3, c('asphalt', 0));
  } else if (t === 'plug') {
    // a spark plug: the boot, the white insulator, the hex, the threads, the gap's spark
    p.rect(13, 0, 6, 5, c('ink', 1));
    gradient(p, 12, 5, 8, 12, SP.r('paint'), 1, 3);
    p.rect(9, 17, 14, 5, c('metal', 3)).frame(9, 17, 14, 5, c('metal', 0));
    for (let y = 22; y < 29; y += 2) p.rect(12, y, 8, 1, c('metal', 4)).rect(12, y + 1, 8, 1, c('metal', 1));
    p.rect(15, 29, 2, 2, c('metal', 2)).set(19, 30, c('spark', 3)).set(20, 29, c('spark', 2));
  } else if (t === 'roll') {
    // a player-piano roll: a paper scroll punched with notes, wooden ends
    p.rect(2, 8, 4, 18, c('wood', 2)).rect(26, 8, 4, 18, c('wood', 2));
    p.rect(6, 10, 20, 14, c('paint', 3)).frame(6, 10, 20, 14, c('paint', 1));
    for (const [x, y] of [
      [8, 12],
      [12, 16],
      [16, 13],
      [20, 19],
      [23, 15],
      [10, 20],
    ])
      p.rect(x, y, 2, 1, INK);
  } else {
    // an oil can: a round body, a long spout, a thumb pump, a drop at the tip
    blob(p, 13, 22, 9, 7, SP.r('gold'), 0, 2);
    p.rect(6, 26, 14, 2, c('gold', 0));
    p.line(19, 17, 29, 6, c('gold', 1)).line(20, 17, 30, 6, c('gold', 2));
    p.rect(10, 13, 6, 3, c('metal', 2));
    blob(p, 30, 9, 1.4, 2, SP.r('cheese'), 0, 2);
  }
  return outline(p, INK);
}

/** The cutaway's parts, in the order they're tuned: label and spot on a scale-6 CHEZ (240x120). */
export const PARTS: { label: string; x: number; y: number }[] = [
  { label: 'BATTERY', x: 196, y: 84 },
  { label: 'PLUGS', x: 174, y: 64 },
  { label: 'TIMING', x: 150, y: 74 },
  { label: 'OIL', x: 126, y: 98 },
];

/** The cutaway CHEZ: the car seen from the side, its parts as lamps, the first `done` lit green but part `blink`, lit gold when `on`. */
export function cutaway(done: number, blink = -1, on = true): Pixels {
  const p = new Pixels(320, 200, c('navy', 0));
  // blueprint paper: a grid
  for (let y = 0; y < 200; y += 10) p.rect(0, y, 320, 1, c('navy', 1));
  for (let x = 0; x < 320; x += 10) p.rect(x, 0, 1, 200, c('navy', 1));
  chezSide(p, 40, 30, { ...CHEZ_INK, outline: c('paint', 3) }, 'left', 6);
  PARTS.forEach((part, i) => {
    const lit = i === blink ? 'gold' : i < done ? 'green' : '';
    const col = lit === 'green' ? c('green', 2) : lit === 'gold' && on ? c('yellow', 3) : c('asphalt', 1);
    p.disc(part.x, part.y, 7, INK).disc(part.x, part.y, 5, col);
    if (lit) p.rect(part.x - 2, part.y - 2, 2, 2, c('paint', 3));
  });
  return p;
}
