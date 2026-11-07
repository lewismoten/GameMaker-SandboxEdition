// PASS THE PIE's two cartoons, as Autodesk Animator FLI files drawn in code (Reel): the intro (Grandma's oven goes
// KA-CLUNK and Rory volunteers) and the ending (the long table: everyone says what they are thankful for in a speech
// bubble, then the oven goes DING). 320x200, the base palette, a fade at each end. An FLI is silent; PLAYGAME plays
// all of it before the next key is read.
import { encodeFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { centered, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Reel } from '@lewismoten/gamemaker-sandbox-tools/kit/reel';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { heroPicture } from '../../kit/starter/hero';
import type { Pal } from '../../kit/starter/palette';
import { buildRoryBlocks } from './rory';

const W = 320;
const H = 200;
const SPEED = 6;

type Who = 'grandma' | 'rory' | 'pettigrew' | 'okafor' | 'kid' | 'tanaka' | 'dog' | 'turkey';

/** A diner: body and head, drawn from the waist up with the head's center at (x, y). */
function figure(p: Pixels, pal: Pal, who: Who, x: number, y: number, mouth = false): void {
  const { c, r } = pal;
  const ink = c('ink', 0);
  const skin = who === 'okafor' || who === 'tanaka' ? r('dirt') : r('skin');
  const coat: Record<Who, number[]> = {
    grandma: r('purple'),
    rory: r('green'),
    pettigrew: r('orange'),
    okafor: r('blue'),
    kid: r('red'),
    tanaka: r('teal'),
    dog: r('dirt'),
    turkey: r('dirt'),
  };
  if (who === 'dog') {
    blob(p, x, y + 18, 13, 14, r('dirt'), 1, 4);
    blob(p, x, y, 12, 11, r('dirt'), 1, 4);
    p.rect(x - 15, y - 8, 6, 14, c('dirt', 0)).rect(x + 9, y - 8, 6, 14, c('dirt', 0));
    p.disc(x - 4, y - 2, 1.5, ink)
      .disc(x + 4, y - 2, 1.5, ink)
      .rect(x - 3, y + 3, 6, 4, c('dirt', 3))
      .rect(x - 1, y + 3, 2, 2, ink);
    if (mouth) p.rect(x - 2, y + 7, 4, 4, c('red', 3));
    return;
  }
  if (who === 'turkey') {
    // a friendly turkey: a round brown body with a fan of feathers behind
    for (let i = -3; i <= 3; i++)
      blob(
        p,
        x + i * 7,
        y - 6 + Math.abs(i) * 2,
        5,
        14,
        [c('red', 2), c('orange', 3), c('gold', 3), c('green', 2), c('blue', 2), c('red', 1), c('orange', 2)],
        1,
        4,
      );
    blob(p, x, y + 18, 14, 14, r('dirt'), 1, 4);
    blob(p, x, y + 2, 8, 9, r('dirt'), 1, 4);
    p.disc(x - 3, y, 1.5, c('white', 3))
      .disc(x + 3, y, 1.5, c('white', 3))
      .set(x - 3, y, ink)
      .set(x + 3, y, ink);
    p.rect(x - 2, y + 3, 4, 4, c('gold', 3)).rect(x - 1, y + 7, 2, 6, c('red', 3));
    return;
  }
  blob(p, x, y + 24, 20, 20, coat[who], 1, 4);
  blob(p, x, y, 11, 12, skin, 0, 3);
  const hair = who === 'grandma' ? r('white') : who === 'rory' ? r('hair') : who === 'okafor' ? r('ink') : who === 'tanaka' ? r('ink') : r('hair');
  p.rect(x - 11, y - 12, 22, 7, hair[2]);
  if (who === 'grandma') {
    blob(p, x, y - 16, 6, 5, hair, 1, 2); // a bun
    p.ring(x - 5, y - 1, 3, ink).ring(x + 5, y - 1, 3, ink); // glasses
  }
  if (who === 'rory') {
    p.rect(x - 12, y - 14, 24, 8, c('gold', 3))
      .rect(x - 12, y - 8, 24, 3, c('gold', 4))
      .disc(x, y - 16, 3, c('white', 3)); // the cap
    p.rect(x - 14, y - 6, 4, 10, c('gold', 3)).rect(x + 10, y - 6, 4, 10, c('gold', 3)); // its ear flaps
    for (let i = 0; i < 18; i += 6) p.rect(x - 8 + i, y + 11, 4, 5, c('red', 3)); // the scarf
  }
  if (who === 'pettigrew') p.rect(x - 11, y - 12, 22, 4, c('white', 3));
  if (who === 'kid') p.rect(x - 11, y - 14, 22, 6, c('red', 3)).rect(x - 11, y - 9, 26, 2, c('red', 3));
  if (who === 'okafor') p.rect(x - 6, y + 5, 12, 2, c('ink', 1)); // a mustache
  if (who === 'tanaka') p.rect(x - 11, y - 12, 4, 20, hair[2]).rect(x + 7, y - 12, 4, 20, hair[2]);
  if (who !== 'grandma') p.disc(x - 4, y - 1, 1.2, ink).disc(x + 4, y - 1, 1.2, ink);
  else p.disc(x - 5, y - 1, 0.8, ink).disc(x + 5, y - 1, 0.8, ink);
  if (mouth) p.rect(x - 3, y + 5, 6, 4, c('red', 3));
  else p.rect(x - 3, y + 6, 6, 1, c('red', 2));
}

/** A speech bubble with its tail pointing down at (tx, ty): `lines` of text inside a white bubble. */
function bubble(p: Pixels, pal: Pal, lines: string[], tx: number, top: number): void {
  const w = Math.max(...lines.map((l) => textWidth(l))) + 14;
  const h = lines.length * 10 + 8;
  let x = Math.max(4, Math.min(W - w - 4, tx - w / 2));
  x = Math.round(x);
  p.rect(x + 2, top, w - 4, h, pal.c('white', 3))
    .rect(x, top + 2, w, h - 4, pal.c('white', 3))
    .rect(x + 1, top + 1, w - 2, h - 2, pal.c('white', 3));
  p.rect(x + 2, top, w - 4, 1, pal.c('ink', 0))
    .rect(x + 2, top + h - 1, w - 4, 1, pal.c('ink', 0))
    .rect(x, top + 2, 1, h - 4, pal.c('ink', 0))
    .rect(x + w - 1, top + 2, 1, h - 4, pal.c('ink', 0));
  p.set(x + 1, top + 1, pal.c('ink', 0))
    .set(x + w - 2, top + 1, pal.c('ink', 0))
    .set(x + 1, top + h - 2, pal.c('ink', 0))
    .set(x + w - 2, top + h - 2, pal.c('ink', 0));
  for (let i = 0; i < 6; i++)
    p.rect(tx - 5 + Math.floor(i / 2), top + h + i - 1, 10 - i, 1, pal.c('white', 3)).set(tx - 5 + Math.floor(i / 2), top + h + i - 1, pal.c('ink', 0));
  lines.forEach((l, i) => text(p, x + 7, top + 5 + i * 10, l, pal.c('ink', 0)));
}

/** The kitchen wall and floor. */
function kitchen(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(W, H);
  for (let y = 0; y < 130; y++) p.rect(0, y, W, 1, c('parch', y < 90 ? 3 : 2));
  for (let y = 130; y < H; y++) p.rect(0, y, W, 1, c('wood', (y >> 4) % 2 ? 2 : 3));
  for (let x = 20; x < W; x += 70)
    p.rect(x, 24, 40, 40, c('wood', 3))
      .rect(x + 3, 27, 34, 34, c('sky', 4))
      .rect(x + 19, 27, 2, 34, c('wood', 3))
      .rect(x + 3, 43, 34, 2, c('wood', 3));
  p.rect(0, 126, W, 6, c('wood', 1));
  return p;
}

function oven(p: Pixels, pal: Pal, x: number, y: number, lit: boolean, shake = 0): void {
  const { c } = pal;
  p.rect(x + shake, y, 70, 70, c('stone', 2))
    .rect(x + shake, y, 70, 3, c('stone', 4))
    .frame(x + shake, y, 70, 70, c('ink', 0));
  p.rect(x + 8 + shake, y + 20, 54, 38, c('ink', 1)).rect(x + 10 + shake, y + 22, 50, 34, lit ? c('orange', 3) : c('stone', 0));
  if (lit) p.rect(x + 10 + shake, y + 22, 50, 6, c('gold', 4));
  for (let i = 0; i < 3; i++) p.disc(x + 14 + i * 20 + shake, y + 10, 3, i === 1 && lit ? c('green', 3) : c('red', 3));
}

function smoke(p: Pixels, pal: Pal, x: number, y: number, t: number): void {
  for (let i = 0; i < 5; i++) p.disc(x + Math.round(Math.sin((t + i * 3) / 3) * 5) + i * 2, y - i * 11 - (t % 4), 4 + i, pal.c('stone', 1 + (i % 2) * 2));
}

/** INTRO.FLI: the oven goes KA-CLUNK; Rory volunteers. */
export function introFli(pal: Pal): Uint8Array {
  const reel = new Reel(pal.pal);
  const bg = kitchen(pal);
  const rory = heroPicture(buildRoryBlocks(pal), 'stand.top', 'stand');
  const cheer = heroPicture(buildRoryBlocks(pal), 'cheer2.top', 'cheer');
  const scene = (f: number, said: string[] | null, who: 'g' | 'r', clunk: boolean, rx: number, up = false) =>
    reel.frame(
      bg,
      (p) => {
        oven(p, pal, 228, 62, false, clunk ? (f % 2 ? 3 : -3) : 0);
        if (clunk) smoke(p, pal, 262, 62, f);
        figure(p, pal, 'grandma', 80, 100, !!said && who === 'g');
        scaleBlit(p, up ? cheer : rory, rx, 88, 2);
        if (clunk) centered(p, 8, 'KA-CLUNK!', pal.c('red', 3), 2, pal.c('ink', 0), W / 2, pal.c('ink', 0));
        if (said) bubble(p, pal, said, who === 'g' ? 80 : rx + 20, said.length > 2 ? 4 : 18);
      },
      1,
    );
  reel.fadeIn(bg, 3);
  for (let f = 0; f < 14; f++) scene(f, null, 'g', true, 140);
  for (let f = 0; f < 22; f++) scene(f, ['THE OVEN IS BROKEN!', 'AND THE WHOLE TOWN', 'IS COMING TO DINNER.'], 'g', false, 140);
  for (let f = 0; f < 16; f++) scene(f, ['DISHES CAN COOK AT', 'EVERY HOUSE...'], 'g', false, 140 + Math.min(f, 6));
  for (let f = 0; f < 22; f++) scene(f, ['I WILL CARRY IT ALL', 'TO THE LONG TABLE!'], 'r', false, 146, f > 4 && f % 8 < 4);
  reel.fadeOut(4);
  return encodeFli(reel.frames, pal.pal, { speed: SPEED, palettes: reel.palettes, runs: true, noLoopFrame: true });
}

/** The long table's backdrop: a banner, a window, the table with plates and a cloth. */
function hall(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(W, H);
  for (let y = 0; y < 150; y++) p.rect(0, y, W, 1, c('brick', y < 100 ? 2 : 1));
  for (let x = 0; x < W; x += 24) p.rect(x, 0, 1, 100, c('brick', 0));
  for (let y = 150; y < H; y++) p.rect(0, y, W, 1, c('wood', 1));
  p.rect(60, 12, 200, 14, c('gold', 3)).frame(60, 12, 200, 14, c('ink', 0));
  centered(p, 15, 'TOWN HALL DINNER', c('red', 1), 1);
  return p;
}

function table(p: Pixels, pal: Pal): void {
  const { c } = pal;
  p.rect(6, 122, 308, 44, c('white', 3)).rect(6, 122, 308, 3, c('white', 4)).frame(6, 122, 308, 44, c('ink', 0));
  for (const x of [24, 62, 100, 138, 176, 214, 252, 290]) p.disc(x, 140, 8, c('white', 2)).ring(x, 140, 8, c('stone', 2)).disc(x, 140, 4, c('white', 3));
  for (const [x, col] of [
    [44, 'orange'],
    [120, 'blue'],
    [196, 'red'],
    [272, 'green'],
  ] as const)
    p.rect(x, 150, 14, 8, c(col, 3)).rect(x, 150, 14, 2, c(col, 4)).frame(x, 150, 14, 8, c('ink', 0));
}

const SPEAKERS: { who: Who; x: number; lines: string[] }[] = [
  { who: 'grandma', x: 40, lines: ['I AM THANKFUL FOR A', 'BIG KITCHEN AND A', 'SMALL SCREWDRIVER.'] },
  { who: 'pettigrew', x: 78, lines: ['THE PIE ARRIVED WITH', 'ALL OF ITS PIE.', 'I AM THANKFUL.'] },
  { who: 'okafor', x: 116, lines: ['THE GRAVY STAYED IN', 'THE BOAT. MOSTLY.'] },
  { who: 'kid', x: 154, lines: ['I CAUGHT THE BALL.', 'WHAT BALL? THANKS!'] },
  { who: 'tanaka', x: 192, lines: ['BERRIES! I AM STILL', 'FINDING THEM.'] },
  { who: 'dog', x: 230, lines: ['BORK!', '(THANKS FOR THE BONE.)'] },
  { who: 'turkey', x: 268, lines: ['GOBBLE! I AM ON', 'THE GUEST LIST!'] },
  { who: 'rory', x: 296, lines: ['I AM THANKFUL', 'FOR SNEAKERS.'] },
];

/** ENDING.FLI: the table; each guest says what they are thankful for, then the oven goes DING. */
export function endingFli(pal: Pal): Uint8Array {
  const reel = new Reel(pal.pal);
  const bg = hall(pal);
  const frame = (speaking: number, ding: boolean, hold: number) =>
    reel.frame(
      bg,
      (p) => {
        SPEAKERS.forEach((s, i) => figure(p, pal, s.who, s.x, 98, i === speaking));
        table(p, pal);
        if (speaking >= 0) bubble(p, pal, SPEAKERS[speaking].lines, SPEAKERS[speaking].x, 36);
        if (ding) bubble(p, pal, ['DING! THE OVEN WORKS.', 'DESSERT IS READY!'], 40, 36);
      },
      hold,
    );
  reel.fadeIn(bg, 3);
  frame(-1, false, 10);
  SPEAKERS.forEach((_s, i) => frame(i, false, 26));
  frame(-1, false, 6);
  frame(-1, true, 34);
  reel.fadeOut(4);
  return encodeFli(reel.frames, pal.pal, { speed: SPEED, palettes: reel.palettes, runs: true, noLoopFrame: true });
}
