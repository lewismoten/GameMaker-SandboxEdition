// honk.fli, the finale's last turn (Watt's talk, after "THE CHEZ pulls up"): outside the Smart
// Home, every window gold, THE CHEZ rolls up the street with Teddy in the front passenger seat
// looking out the door window and Gwinn running alongside, stops at the curb and honks; Doc Leo
// climbs out and waves, everybody else piles in behind, and Joe comes to the gold doorway.
import { chezPicture } from '../../../../kit/chez';
import { lewieCameo, willCameo } from '../../../../kit/cameos';
import { Pixels } from '../../../../kit/pixels';
import { Reel } from '../../../../kit/reel';
import { CLEAR, gradient, scaleBlit } from '../../art/draw';
import { PAL, c, r } from '../../art/pal';
import { carlPicture } from '../../sprites/critters';
import { bard, goat, gwinnRun, teddy } from '../../sprites/friends';
import { loaf, seed } from '../../sprites/guests';
import { joe } from '../../sprites/joe';
import { leo } from '../../sprites/people';
import { H, W, caption, close, lit, stars } from './common';

/** THE CHEZ at 2.5 pixels a unit (100x50), its wheels on the road at y 178, parked at x 26. */
const CAR = { s: 2.5, y: 128, park: 26 };
/** The Smart Home's front door, and the street's sidewalk (feet at y 160). */
const DOOR = { x: 146, y: 98, w: 28, h: 48 };
const WALK = 160;

/** The game's CitiCar colors, as the Smart Home's own block of it. */
const CHEZ_INK = () => ({
  body: [c('red', 1), c('red', 2), c('red', 3)] as [number, number, number],
  trim: c('red', 0),
  glass: [c('blue', 1), c('blue', 3)] as [number, number],
  roof: c('ink', 0),
  tire: c('ink', 1),
  hub: c('stone', 4),
  bumper: c('stone', 3),
  lamp: c('yellow', 3),
  tail: c('red', 3),
  stripe: c('stone', 1),
  pin: c('paper', 4),
  rim: c('paper', 4),
});

/** THE CHEZ facing left (its passenger side, the charge port at the rear), with Teddy in the
 * front passenger seat looking out of the door window: drawn once, only its glass shows him. */
function chezWithTeddy(): Pixels {
  const ink = CHEZ_INK();
  const car = chezPicture(ink, 'left', CAR.s);
  const dog = teddy(true);
  // the door window's glass at the top of the car; Teddy sits where its top is widest, so both
  // ears show whole
  const tx = 50;
  const ty = 8;
  for (let y = 0; y < dog.h; y++)
    for (let x = 0; x < dog.w; x++) {
      const v = dog.get(x, y);
      const under = car.get(tx + x, ty + y);
      if (v !== CLEAR && v >= 0 && ty + y < 24 && (under === ink.glass[0] || under === ink.glass[1])) car.set(tx + x, ty + y, v);
    }
  return car;
}

function smartHome(): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, 120, r('dusk'), 0, 1);
  stars(p, 23, 70);
  // the far trees, dark
  for (let x = 0; x < W; x++) {
    const y = Math.round(118 + Math.sin(x / 17) * 4 + Math.sin(x / 7) * 2);
    p.rect(x, y, 1, 40, c('grass', 0));
  }
  // the house: a wide gable front, every window gold
  const hx = 60;
  const hw = 200;
  for (let y = 18; y < 52; y++) {
    const half = ((y - 18) / 34) * (hw / 2 + 8);
    p.rect(Math.round(160 - half), y, Math.round(half * 2), 1, c('ink', 1));
  }
  p.rect(hx - 8, 50, hw + 16, 3, c('ink', 0));
  p.rect(hx, 53, hw, 95, c('stone', 2));
  for (let y = 57; y < 148; y += 5) p.rect(hx, y, hw, 1, c('stone', 1));
  // the little dish on the roof, its light on
  p.rect(205, 30, 2, 8, c('stone', 3)).disc(204, 27, 4, c('stone', 3)).disc(205, 27, 2, c('stone', 2)).set(201, 22, c('red', 3));
  // the round attic window and the rest, all glowing
  p.disc(160, 36, 7, c('ink', 0)).disc(160, 36, 5, c('gold', 4));
  const window = (x: number, y: number, w: number, h: number) => {
    p.rect(x - 2, y - 2, w + 4, h + 4, c('ink', 0));
    p.rect(x, y, w, h, c('gold', 4)).rect(x + 2, y + 2, w - 4, h - 4, c('gold', 5));
    p.rect(x + Math.floor(w / 2), y, 1, h, c('ink', 0)).rect(x, y + Math.floor(h / 2), w, 1, c('ink', 0));
  };
  for (const x of [76, 120, 176, 220]) window(x, 62, 24, 22);
  for (const x of [76, 220]) window(x, 100, 24, 26);
  // the front door standing open, gold pouring out, and its step
  p.rect(DOOR.x - 3, DOOR.y - 3, DOOR.w + 6, DOOR.h + 3, c('wood', 1));
  p.rect(DOOR.x, DOOR.y, DOOR.w, DOOR.h, c('gold', 5));
  p.rect(DOOR.x, DOOR.y, 3, DOOR.h, c('wood', 2));
  p.rect(DOOR.x - 6, DOOR.y + DOOR.h, DOOR.w + 12, 3, c('stone', 3));
  // the lawn, the gold light lying on it, and the path down to the sidewalk
  p.rect(0, 148, W, 8, c('grass', 1));
  for (let y = 148; y < 156; y++)
    for (let x = 90; x < 230; x++) {
      const d = Math.abs(x - 160) / 70 + (y - 148) / 16;
      if (d < 1 && (x + y) % 2 === 0) p.set(x, y, c('grass', 3));
    }
  p.rect(DOOR.x + 2, 149, DOOR.w - 4, 7, c('gold', 2));
  // the sidewalk and the curb, the street, its middle line
  p.rect(0, 156, W, 6, c('stone', 3)).rect(0, 161, W, 1, c('stone', 4));
  for (let x = 0; x < W; x += 24) p.rect(x, 156, 1, 5, c('stone', 2));
  p.rect(0, 162, W, 20, c('stone', 1));
  for (let x = 6; x < W; x += 30) p.rect(x, 173, 14, 1, c('yellow', 1));
  return p;
}

/** Gwinn running at one and a half times (no box of valentines in her mouth this time), at `x`. */
function gwinn(p: Pixels, x: number, k: number): void {
  const g = gwinnRun(k % 2);
  g.rect(0, 11, 4, 4, CLEAR);
  const y0 = 151 - (k % 2 ? 2 : 0);
  for (let y = 0; y < 30; y++)
    for (let xx = 0; xx < 30; xx++) {
      const v = g.get(Math.floor(xx / 1.5), Math.floor(y / 1.5));
      if (v !== CLEAR && v >= 0) p.set(x + xx, y0 + y, v);
    }
}

/** The friends who pile in behind, at scale 2: where each stands, and when it comes. */
const CROWD: { pic: (k: number) => Pixels; x: number; y: number; at: number }[] = [
  { pic: (k) => bard(k % 2), x: 182, y: WALK - 52, at: 0 },
  { pic: () => goat(1), x: 222, y: WALK - 52, at: 3 },
  { pic: () => willCameo(PAL.pal, { face: 'front', mood: 'swoon', arms: 'heart' }), x: 262, y: WALK - 52, at: 6 },
  { pic: () => lewieCameo(PAL.pal, 'down0'), x: 200, y: WALK - 40, at: 9 },
  { pic: () => loaf('joy'), x: 240, y: WALK - 40, at: 12 },
  { pic: () => seed('joy', 'sprout'), x: 280, y: WALK - 40, at: 15 },
];

/** The crowd `k` frames after it starts: each friend hops in from the right to its place. */
function crowd(p: Pixels, k: number): void {
  for (const f of CROWD) {
    const t = k - f.at;
    if (t < 0) continue;
    const x = Math.max(f.x, W + 4 - t * 14);
    const hop = x > f.x ? (t % 2) * 3 : 0;
    scaleBlit(p, f.pic(k), x, f.y - hop, 2);
  }
  // Carl buzzes in over them all
  if (k >= 4) scaleBlit(p, carlPicture(k % 2), Math.max(250, W + 10 - (k - 4) * 12), 66 + (k % 3), 2);
}

/** "Honk" marks off the nose, on alternate frames. */
function honk(p: Pixels, x: number, k: number): void {
  if (k % 2) return;
  for (const [dx, dy] of [
    [-6, -4],
    [-8, 0],
    [-6, 4],
  ])
    p.line(x, 160 + dy / 2, x + dx * 2, 160 + dy * 2, c('paper', 4));
}

export function honkFli(): Uint8Array {
  const bg = smartHome();
  const car = chezWithTeddy();
  const reel = new Reel(lit('lamp'));
  const chez = (p: Pixels, x: number) => p.blit(car, x, CAR.y, 255);
  for (let k = 1; k <= 8; k++) reel.frame(bg, () => {}, 1, k / 8);
  // up the street from the right, Gwinn running alongside
  const DRIVE = 22;
  for (let k = 0; k <= DRIVE; k++) {
    const ease = 1 - (1 - k / DRIVE) ** 2;
    const x = Math.round(W + 10 - ease * (W + 10 - CAR.park));
    reel.frame(bg, (p) => {
      chez(p, x);
      gwinn(p, x - 28, k);
      if (k > 6) caption(p, 'THE CHEZ PULLS UP.');
    });
  }
  // at the curb: a honk, and Doc Leo climbs out of the far side and comes round the back, waving
  const nose = CAR.park + 6;
  for (let k = 0; k < 10; k++)
    reel.frame(bg, (p) => {
      chez(p, CAR.park);
      gwinn(p, CAR.park - 28, k);
      honk(p, nose, k);
      caption(p, 'HONK! HONK!');
    });
  const leoAt = (p: Pixels, x: number, wave: boolean) => scaleBlit(p, leo(wave, true), x, WALK - 40, 2);
  for (let k = 0; k <= 6; k++)
    reel.frame(bg, (p) => {
      leoAt(p, 76 + k * 6, k > 3);
      chez(p, CAR.park);
      gwinn(p, CAR.park - 28, k);
      caption(p, 'HONK! HONK!');
    });
  // everybody else piles in behind
  for (let k = 0; k < 24; k++)
    reel.frame(bg, (p) => {
      crowd(p, k);
      leoAt(p, 112, k % 4 < 2);
      chez(p, CAR.park);
      gwinn(p, CAR.park - 28, k);
      caption(p, 'EVERYBODY JOE HELPED CAME TO SEE.');
    });
  // and Joe comes to the gold doorway
  for (let k = 0; k < 10; k++)
    reel.frame(bg, (p) => {
      scaleBlit(p, joe('down', 0, k % 6 === 5 ? 'blink' : 'glad'), DOOR.x - 6, DOOR.y + 6, 2);
      crowd(p, 24 + k);
      leoAt(p, 112, k % 4 < 2);
      chez(p, CAR.park);
      gwinn(p, CAR.park - 28, k);
      caption(p, 'EVERYBODY JOE HELPED CAME TO SEE.');
    });
  return close(reel);
}
