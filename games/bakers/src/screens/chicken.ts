// The two cartoons round Sir Reginald's interlude (reels, games/kit/reel.ts): on the way in,
// Doc Leo finds the molasses has rolled under the Bakehouse's iron range, does not fit, and
// posts Sir Reginald Cluckington III in after it (SQUEEEZE); on the way out, a jug of molasses
// slides out of the dark, the chicken pops out after it and bounces into Doc Leo's hand.
import { Pixels } from '../../../kit/pixels';
import { Reel } from '../../../kit/reel';
import { ingredient } from '../art/kit';
import { PAL, c } from '../art/pal';
import { reggie, reggieBounce } from '../sprites/chicken';
import { H, W, bigLeo, centered, headline, kitchenWall, micro, scaleBlit } from './art';

const FLOOR = 160;
/** The range: body from x 150 to 304, its skirt ending at GAP_TOP, legs down to the floor. */
const SX = 150;
const SW = 154;
const GAP_TOP = 140;

function say(p: Pixels, lines: string[]): void {
  p.rect(0, 172, W, 28, c('ink', 0));
  lines.forEach((l, i) => centered(p, 174 + i * 12, l, c('paper', 4)));
}

/** Ebenezer's black iron range (1777): burners, a stovepipe, the oven door, and the gap under it. */
function stove(p: Pixels, glow = 0): void {
  const iron = (k: number) => c('grey', k);
  // stovepipe up the wall
  p.rect(SX + 112, 0, 18, 40, iron(1)).rect(SX + 112, 0, 3, 40, iron(2));
  for (const y of [12, 28]) p.rect(SX + 110, y, 22, 3, iron(0));
  // cooktop and body
  p.rect(SX - 4, 36, SW + 8, 8, c('ink', 0)).rect(SX - 3, 37, SW + 6, 5, iron(2));
  p.rect(SX, 44, SW, GAP_TOP - 44, c('ink', 0)).rect(SX + 2, 44, SW - 4, GAP_TOP - 46, iron(1));
  for (const bx of [SX + 30, SX + 80]) p.rect(bx, 32, 30, 4, iron(0)).rect(bx + 4, 30, 22, 2, iron(1));
  // oven door with a brass handle, a firebox with a glow
  p.rect(SX + 12, 54, 74, 60, iron(0)).rect(SX + 14, 56, 70, 56, iron(2)).rect(SX + 20, 62, 58, 2, c('brass', 3));
  p.rect(SX + 98, 60, 44, 40, iron(0)).rect(SX + 100, 62, 40, 36, c('ink', 0));
  for (let i = 0; i < 4; i++) p.rect(SX + 104 + i * 9, 66, 4, 28, glow ? c('orange', 2 + (i % 2)) : c('red', 1));
  micro(p, SX + 20, 120, 'E. BAKER  1777', c('brass', 3));
  // the skirt, the legs and the gap under it all
  p.rect(SX, GAP_TOP - 6, SW, 6, iron(0));
  p.rect(SX, GAP_TOP, SW, FLOOR - GAP_TOP, c('ink', 0));
  p.rect(SX + 2, GAP_TOP, 10, FLOOR - GAP_TOP, iron(1)).rect(SX + SW - 12, GAP_TOP, 10, FLOOR - GAP_TOP, iron(1));
  p.rect(SX - 2, FLOOR - 3, 16, 3, iron(2)).rect(SX + SW - 14, FLOOR - 3, 16, 3, iron(2));
}

function room(): Pixels {
  const p = new Pixels(W, H);
  kitchenWall(p, FLOOR);
  stove(p);
  return p;
}

/** The chicken big: a 20x20 sprite at 3x, its feet at (x, y). */
const big = (p: Pixels, spr: Pixels, x: number, y: number, flip = false, s = 3) => scaleBlit(p, spr, Math.round(x - 10 * s), Math.round(y - 18 * s), s, flip);

export function stoveInFli(): Uint8Array {
  const reel = new Reel(PAL.pal);
  const bg = room();
  const leo = (p: Pixels, up: boolean) => bigLeo(p, 40, FLOOR - 102, 1.6, up);
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  leo(first, false);
  say(first, ['The molasses rolled under the stove.', 'In 1777. It is still rolling.']);
  reel.fadeIn(first, 8).add(first, 22);
  reel.frame(bg, (p) => {
    leo(p, false);
    // Doc Leo's hat would fit. Doc Leo would not.
    p.rect(SX + 14, GAP_TOP + 4, 40, 1, c('red', 3));
    say(p, ['Doc Leo will not fit under there.', '']);
  }, 18);
  reel.frame(bg, (p) => {
    leo(p, true);
    headline(p, 20, '!', 3, c('yellow', 3), c('red', 2), 128);
    say(p, ['Sir Reginald Cluckington III', 'will.']);
  }, 20);
  // the toss: up out of Doc Leo's hand and down to the gap
  const from = { x: 112, y: 64 };
  const to = { x: SX + 40, y: FLOOR - 2 };
  for (let t = 0; t <= 12; t++) {
    const u = t / 12;
    const x = from.x + (to.x - from.x) * u;
    const y = from.y + (to.y - from.y) * u - Math.sin(Math.PI * u) * 50;
    reel.frame(bg, (p) => {
      leo(p, false);
      big(p, reggie('side', t % 2, 'flap'), x, y);
      say(p, ['Sir Reginald Cluckington III', 'will.']);
    });
  }
  // squeeze in: flat, under the skirt, and gone
  for (let t = 0; t < 14; t++) {
    reel.frame(bg, (p) => {
      leo(p, false);
      const x = to.x + t * 6;
      big(p, reggieBounce(false), x, FLOOR + 2);
      // the skirt and legs drawn back over him as he goes under
      p.rect(SX, GAP_TOP - 6, SW, 6, c('grey', 0)).rect(SX + 2, GAP_TOP, 10, FLOOR - GAP_TOP, c('grey', 1));
      if (t < 10) headline(p, 4, 'SQUEEEZE', 2, c('yellow', 3), c('red', 2), 200);
      say(p, ['In he goes.', '']);
    });
  }
  reel.frame(bg, (p) => {
    leo(p, false);
    // two little eyes in the dark
    p.rect(SX + 70, GAP_TOP + 8, 2, 2, c('yellow', 4)).rect(SX + 76, GAP_TOP + 8, 2, 2, c('yellow', 4));
    say(p, ['In he goes.', '']);
  }, 14);
  reel.fadeOut(8);
  return reel.fli(5);
}

export function stoveOutFli(): Uint8Array {
  const reel = new Reel(PAL.pal);
  const bg = room();
  const leo = (p: Pixels, up: boolean) => bigLeo(p, 40, FLOOR - 102, 1.6, up);
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  leo(first, false);
  say(first, ['A long minute under the stove...', '']);
  reel.fadeIn(first, 8).add(first, 12);
  const jug = ingredient(4, 0);
  // the jug slides out first, very slowly (it is molasses)
  for (let t = 0; t < 12; t++) {
    reel.frame(bg, (p) => {
      leo(p, false);
      big(p, jug, SX + 60 - t * 4, FLOOR + 2, false, 2);
      p.rect(SX, GAP_TOP - 6, SW, 6, c('grey', 0));
      say(p, ['A long minute under the stove...', '']);
    });
  }
  // and out pops the chicken, bouncing
  const hops = [
    { x: SX + 20, y: FLOOR + 1, s: 'squash' },
    { x: SX - 4, y: FLOOR - 30, s: 'stretch' },
    { x: SX - 20, y: FLOOR - 50, s: 'stretch' },
    { x: SX - 34, y: FLOOR - 30, s: 'stretch' },
    { x: SX - 44, y: FLOOR + 1, s: 'squash' },
    { x: SX - 52, y: FLOOR - 24, s: 'stretch' },
    { x: SX - 58, y: FLOOR - 34, s: 'stretch' },
    { x: SX - 62, y: FLOOR - 20, s: 'stretch' },
    { x: SX - 64, y: FLOOR + 1, s: 'squash' },
  ];
  hops.forEach((h, i) => {
    reel.frame(bg, (p) => {
      leo(p, false);
      big(p, jug, SX + 12, FLOOR + 2, false, 2);
      big(p, h.s === 'squash' ? reggieBounce(false) : reggieBounce(true), h.x, h.y);
      headline(p, 8, 'SQUEAK!', 3, c('yellow', 3), c('red', 2), 220);
      say(p, ['Sir Reginald Cluckington III,', 'with the molasses.']);
    }, i % 4 === 0 ? 3 : 2);
  });
  reel.frame(bg, (p) => {
    leo(p, true);
    big(p, jug, 100, FLOOR + 2, false, 2);
    say(p, ['Not bad for a chicken.', 'Squeak.']);
  }, 26);
  reel.fadeOut(8);
  return reel.fli(5);
}
