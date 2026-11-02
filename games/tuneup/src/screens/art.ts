// What the title, the cards and the cartoons are drawn from (the garage backdrop is garage.ts): Doc Leo and
// the rubber chicken at any size, THE CHEZ (kit/chez.ts) with Teddy riding in the passenger
// seat, the tools that come out of Doc Leo's hat, and the cutaway CHEZ whose parts light up as
// they are tuned. Everything is in the screen palette (palette.ts buildScreenPalette).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { blob, gradient } from '../../../snowbound/src/art/draw';
import { scaleBlit } from '../../../snowbound/src/screens/scenery';
import { text } from '../../../snowbound/src/art/font';
import { chezSide, type ChezInk } from '../../../kit/chez';
import { chicken, type ChickenPose } from '../art/chicken';
import { buildScreenPalette } from '../art/palette';
import { buildCharBlocks } from '../sprites/cast';
import { teddyInWindow } from '../art/chezTeddy';

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
/** The x extent of a picture's lowest drawn row: where its feet are. */
function feet(pic: Pixels): [number, number] {
  for (let y = pic.h - 1; y >= 0; y--) {
    let a = -1;
    let b = -1;
    for (let x = 0; x < pic.w; x++)
      if (pic.get(x, y) !== 255) {
        if (a < 0) a = x;
        b = x;
      }
    if (a >= 0) return [a, b];
  }
  return [0, pic.w - 1];
}
/** A soft shadow on the floor from x0 to x1 with its middle on line y: a dark core, a lighter rim. */
export function shadow(p: Pixels, x0: number, x1: number, y: number, ink: [number, number] = [c('floor', 1), c('floor', 0)]): void {
  const cx = (x0 + x1) / 2;
  const rx = (x1 - x0) / 2 + 0.5;
  const ry = Math.max(2.5, rx / 9);
  for (let dy = -Math.ceil(ry); dy <= Math.ceil(ry); dy++)
    for (let dx = -Math.ceil(rx); dx <= Math.ceil(rx); dx++) {
      const d = (dx / rx) ** 2 + (dy / ry) ** 2;
      const X = Math.round(cx + dx);
      if (d <= 1 && X >= 0 && X < p.w && y + dy >= 0 && y + dy < p.h) p.set(X, y + dy, ink[d < 0.6 ? 1 : 0]);
    }
}
/** Doc Leo scaled `s` times with his feet at (x, y), on a shadow when `ground`. */
export function drawLeo(p: Pixels, pose: string, x: number, y: number, s: number, flip = false, ground = false): void {
  const pic = leoPose(pose);
  if (ground) {
    const [a, b] = feet(flip ? pic.flipX() : pic);
    shadow(p, x + (a - 2) * s, x + (b + 3) * s - 1, y);
  }
  scaleBlit(p, pic, x, y - 40 * s, s, flip);
}
/** The chicken `s` times a block with its feet at (x, y), on a shadow when `ground`. */
export function drawChicken(p: Pixels, x: number, y: number, s: number, o: ChickenPose = {}, flip = false, ground = false): void {
  const pic = chicken(s, o);
  const q = flip ? pic.flipX() : pic;
  if (ground) {
    const [a, b] = feet(q);
    const w = Math.max(b - a, q.w / 3);
    shadow(p, x + (a + b) / 2 - w / 2 - 4, x + (a + b) / 2 + w / 2 + 4, y);
  }
  p.blit(q, x, y - q.h, 255);
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
  if (teddy) teddyInWindow(p, x, y, s);
}

/**
 * THE CHEZ parked facing left with its tires on floor line `floor` (its box's left at x), on a
 * contact shadow: the shadow under the tires and the sill, a little wider than the car.
 */
export function parkChez(p: Pixels, x: number, floor: number, s: number, teddy = true, ink?: [number, number]): void {
  shadow(p, x + Math.round(2 * s), x + Math.round(38 * s), floor - 1, ink);
  drawChez(p, x, floor - Math.round(20 * s), s, teddy);
}

/** The tools Doc Leo's hat gives, a 32x32 picture each on clear. */
export type Tool =
  'cables' | 'plug' | 'roll' | 'oilcan' | 'kazoo' | 'bone' | 'hubcap' | 'pump' | 'tape' | 'wiper' | 'horn' | 'gear' | 'radio' | 'key' | 'baton';
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
  } else if (t === 'kazoo') {
    // a kazoo: a tapered tube with the round buzzer on top
    p.rect(3, 13, 24, 8, c('red', 2)).rect(3, 13, 24, 2, c('red', 3)).rect(27, 14, 3, 6, c('red', 1));
    p.disc(16, 11, 4, c('metal', 3)).disc(16, 11, 2, c('metal', 1));
  } else if (t === 'bone') {
    // a dog biscuit shaped like a bone: Teddy's turn
    for (const [x, y] of [
      [6, 10],
      [6, 20],
      [26, 10],
      [26, 20],
    ])
      p.disc(x, y, 5, c('wood', 3));
    p.rect(6, 11, 20, 9, c('wood', 3)).rect(8, 13, 16, 2, c('wood', 4));
  } else if (t === 'hubcap') {
    // a hubcap, and the little ball beside it
    p.disc(14, 18, 12, c('metal', 2)).disc(14, 18, 9, c('metal', 4)).disc(14, 18, 3, c('metal', 1));
    p.disc(28, 27, 3.5, c('yellow', 3)).set(27, 26, c('paint', 3));
  } else if (t === 'pump') {
    // a balloon pump: a long barrel, the handle up top, a twisted balloon on the nozzle
    p.rect(4, 2, 12, 3, c('wood', 2)).rect(9, 5, 2, 6, c('metal', 4));
    p.rect(6, 11, 8, 18, c('blue', 2)).rect(6, 11, 2, 18, c('blue', 3)).rect(9, 29, 2, 3, c('metal', 2));
    blob(p, 23, 20, 6, 4, SP.r('orange'), 0, 2);
    blob(p, 27, 12, 3, 5, SP.r('orange'), 0, 2);
  } else if (t === 'wiper') {
    // a wiper blade: the steel arm, the black rubber edge, a drop flying off it
    p.line(4, 28, 26, 4, c('metal', 4)).line(5, 28, 27, 4, c('metal', 2));
    p.line(20, 2, 30, 14, c('ink', 0)).line(19, 3, 29, 15, c('asphalt', 1)).line(21, 2, 31, 13, c('metal', 3));
    p.disc(4, 28, 3, c('metal', 1));
    blob(p, 9, 8, 1.6, 2.4, SP.r('water'), 0, 3);
  } else if (t === 'horn') {
    // a clown's bulb horn: the red rubber bulb, the brass bell
    p.disc(7, 16, 6, c('red', 2)).disc(6, 14, 2.5, c('red', 3));
    p.rect(12, 14, 8, 4, c('gold', 1)).rect(12, 14, 8, 1, c('gold', 2));
    for (let x = 20; x < 30; x++) {
      const r = 2 + (x - 20) * 1.1;
      p.rect(x, Math.round(16 - r), 1, Math.round(r * 2), c('gold', x % 3 === 0 ? 2 : 1));
    }
    p.rect(29, 4, 2, 24, c('gold', 2));
  } else if (t === 'gear') {
    // a gear: teeth round a wheel, a hub, the speedometer's little worm gear beside it
    for (let a = 0; a < 10; a++) {
      const ang = (a * Math.PI * 2) / 10;
      p.disc(14 + Math.cos(ang) * 10, 16 + Math.sin(ang) * 10, 2.6, c('metal', 2));
    }
    p.disc(14, 16, 10, c('metal', 3)).disc(14, 16, 7, c('metal', 2)).disc(14, 16, 3, c('metal', 4)).disc(14, 16, 1.5, INK);
    p.rect(26, 4, 4, 24, c('gold', 2));
    for (let y = 5; y < 28; y += 3) p.rect(26, y, 4, 1, c('gold', 0));
  } else if (t === 'radio') {
    // a car radio: the faceplate, the dial and its needle, two knobs, the 8-track's slot
    p.rect(1, 8, 30, 18, c('asphalt', 0)).rect(2, 9, 28, 16, c('asphalt', 1));
    p.rect(8, 11, 16, 6, c('glow', 3)).rect(15, 11, 1, 6, c('red', 2));
    for (let x = 9; x < 24; x += 3) p.set(x, 15, INK);
    p.disc(5, 14, 2.5, c('metal', 3)).disc(27, 14, 2.5, c('metal', 3));
    p.rect(8, 20, 16, 3, INK).rect(9, 21, 14, 1, c('asphalt', 0));
  } else if (t === 'key') {
    // the car key on a ring with a little rubber chicken fob
    p.ring(9, 10, 6, c('metal', 3)).ring(9, 10, 5, c('metal', 1));
    p.rect(13, 13, 6, 8, c('metal', 4)).frame(13, 13, 6, 8, c('metal', 1)).disc(16, 16, 1.2, c('metal', 1));
    p.rect(15, 21, 3, 9, c('metal', 3));
    for (const y of [23, 26]) p.rect(18, y, 2, 2, c('metal', 3));
    p.disc(6, 22, 3.5, c('rubber', 2)).disc(4, 18, 1.8, c('rubber', 2)).set(3, 17, c('nose', 1)).set(2, 18, c('cheese', 1));
  } else if (t === 'baton') {
    // a drum major's baton: a striped shaft, a white ball at each end, a tassel
    for (let i = 0; i < 22; i++) p.rect(5 + i, 25 - i, 2, 2, i % 6 < 3 ? c('red', 2) : c('paint', 3));
    p.disc(5, 26, 3.5, c('paint', 3)).disc(27, 4, 2.5, c('paint', 3));
    p.line(27, 6, 29, 12, c('gold', 2)).line(26, 6, 26, 12, c('gold', 1));
  } else if (t === 'tape') {
    // an 8-track tape: a chunky cartridge, its label, the tape showing at the end
    p.rect(2, 6, 28, 20, c('ink', 1)).rect(4, 8, 24, 10, c('yellow', 3)).rect(4, 20, 24, 4, c('asphalt', 1));
    for (let x = 6; x < 26; x += 4) p.rect(x, 11, 2, 4, c('red', 2));
    p.rect(26, 20, 4, 4, c('wood', 1));
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

/** A part on the cutaway: its label and its spot on a scale-6 CHEZ (240x120, its box at 40,30). */
export interface Part {
  label: string;
  x: number;
  y: number;
}
/** The dream's parts (levels 1-4): a gas engine THE CHEZ never had (the battery, under the seat, is real). */
export const DREAM_PARTS: Part[] = [
  { label: 'BATTERY', x: 176, y: 116 },
  { label: 'PLUGS', x: 84, y: 98 },
  { label: 'TIMING', x: 108, y: 112 },
  { label: 'OIL', x: 96, y: 136 },
];
/** The real tune-up's parts (level 5 on), in the order they're tuned. */
export const REAL_PARTS: Part[] = [
  { label: 'AIR FLAP', x: 150, y: 78 },
  { label: 'BRAKE LAMP', x: 232, y: 106 },
  { label: 'ANTENNA', x: 124, y: 62 },
  { label: 'TIRES', x: 93, y: 130 },
  { label: '8-TRACK', x: 182, y: 96 },
  { label: 'WIPER', x: 136, y: 70 },
  { label: 'HORN', x: 52, y: 120 },
  { label: 'SPEEDO', x: 206, y: 128 },
  { label: 'RADIO', x: 160, y: 98 },
];

/**
 * The cutaway CHEZ: the car seen from the side, its parts as lamps, the first `done` lit green
 * but part `blink`, lit gold when `on`; a legend of the parts along the bottom (two rows when
 * there are more than four).
 */
export function cutaway(parts: Part[], done: number, blink = -1, on = true): Pixels {
  const p = new Pixels(320, 200, c('navy', 0));
  // blueprint paper: a grid
  for (let y = 0; y < 200; y += 10) p.rect(0, y, 320, 1, c('navy', 1));
  for (let x = 0; x < 320; x += 10) p.rect(x, 0, 1, 200, c('navy', 1));
  chezSide(p, 40, 30, { ...CHEZ_INK, outline: c('paint', 3) }, 'left', 6);
  const perRow = parts.length > 4 ? 3 : 4;
  const rows = Math.ceil(parts.length / perRow);
  parts.forEach((part, i) => {
    const lit = i === blink ? 'gold' : i < done ? 'green' : '';
    const col = lit === 'green' ? c('green', 2) : lit === 'gold' && on ? c('yellow', 3) : c('asphalt', 1);
    p.disc(part.x, part.y, 7, INK).disc(part.x, part.y, 5, col);
    if (lit) p.rect(part.x - 2, part.y - 2, 2, 2, c('paint', 3));
    // the legend along the bottom: each part's name, lit as its lamp is
    const lx = 16 + (i % perRow) * (perRow === 3 ? 102 : 76);
    const ly = 196 - (rows - Math.floor(i / perRow)) * 12;
    p.disc(lx + 4, ly + 4, 4, INK).disc(lx + 4, ly + 4, 3, col);
    text(p, lx + 12, ly, part.label, lit ? col : c('navy', 2));
  });
  return p;
}

/**
 * Sir Reginald's dream (levels 1-4) framed as one: puffs of cloud all round the edges of a
 * picture, like a thought balloon, and when `trail` gives a sleeper's head, three bubbles
 * rising from it toward the corner. Without `top`, a title bar is the top edge.
 */
export function dreamFrame(p: Pixels, trail?: [number, number], top = true): void {
  const puff = (x: number, y: number, r: number) =>
    p
      .disc(x, y, r + 1, c('lilac', 2))
      .disc(x, y, r, c('cloud', 1))
      .disc(x - r / 3, y - r / 3, r / 2, c('cloud', 2));
  for (let x = 0; x <= 320; x += 16) {
    if (top) puff(x, -3, (x / 16) % 2 ? 7 : 9);
    puff(x + 8, 203, (x / 16) % 2 ? 9 : 7);
  }
  for (let y = 16; y < 190; y += 16) {
    puff(0, y, (y / 16) % 2 ? 8 : 6);
    puff(319, y + 8, (y / 16) % 2 ? 6 : 8);
  }
  if (trail) [2, 3, 4].forEach((r, i) => puff(trail[0] + 8 + i * 9, trail[1] - 8 - i * 11, r));
}
