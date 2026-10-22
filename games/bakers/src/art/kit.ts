// The sprites: Doc Leo (four ways, squawking his rubber chicken), Teddy and Gwinn, the
// kitchen's vermin and hazards, the toy Redcoats, and the twelve ingredients (and the
// thirteenth). Drawn on 20x20 transparent blocks in the fixed ramps, so they look the same
// in every room's light.
import { Pixels } from '../../../kit/pixels';
import { CLEAR, blob, micro, outline, over } from './draw';
import { c } from './pal';

export const blank = () => new Pixels(20, 20, CLEAR);

/** Sprites stacked onto a copy of a base block. */
export function on(base: Pixels, ...sprites: Pixels[]): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  for (const s of sprites) over(p, s);
  return p;
}

const O = () => c('ink', 0);

// ------------------------------------------------------------------ Doc Leo

export type Facing = 'down' | 'up' | 'side';

/**
 * Doc Leo, hobo clown, seen from a little above: a chewed grey fedora, the ash beard and the
 * white mouth, a navy corduroy jacket over a purple shirt and a green tie, red sneakers with
 * the suit, and a yellow rubber chicken on a red dog leash. `step` swings the legs; `squawk`
 * holds the chicken up and squeezes it.
 */
export function docLeo(facing: Facing, step = 0, squawk = false): Pixels {
  const p = blank();
  const ink = O();
  const skin = c('skin', 2);
  const hat = c('grey', 2);
  const hatD = c('grey', 1);
  const jacket = c('blue', 1);
  const jacketL = c('blue', 2);
  const shirt = c('purple', 2);
  const tie = c('green', 3);
  const pants = c('blue', 0);
  const shoe = c('red', 3);
  const a = step ? 1 : 0;
  // shadow
  p.rect(5, 18, 10, 2, c('dark', 0));
  if (facing === 'up') {
    // the back: hat crown, jacket back, no face
    p.rect(5, 1, 10, 7, ink).rect(6, 2, 8, 5, hat).rect(4, 6, 12, 2, ink).rect(5, 6, 10, 1, hatD).rect(6, 4, 8, 1, c('red', 1));
    p.rect(6, 8, 8, 2, ink).rect(7, 8, 6, 2, c('brown', 1));
    p.rect(4, 10, 12, 6, ink).rect(5, 10, 10, 5, jacket).rect(5, 10, 1, 5, jacketL).rect(9, 11, 1, 4, c('blue', 0));
    p.rect(3, 11, 2, 4, jacket).rect(15, 11, 2, 4, jacket);
    p.rect(6, 16, 3, 2 - a, pants).rect(11, 16, 3, 1 + a, pants);
    p.rect(6, 18 - a, 3, 1, shoe).rect(11, 17 + a, 3, 1, shoe);
    return p;
  }
  if (facing === 'side') {
    // facing right (mirrored for left)
    p.rect(6, 1, 9, 6, ink).rect(7, 2, 7, 4, hat).rect(4, 6, 13, 2, ink).rect(5, 6, 11, 1, hatD).rect(7, 4, 7, 1, c('red', 1));
    p.rect(8, 8, 7, 5, ink).rect(9, 8, 5, 4, skin);
    p.rect(9, 10, 5, 2, c('night', 2)).rect(12, 10, 2, 1, c('paper', 4)); // ash beard, white mouth
    p.set(13, 9, c('red', 3)).set(14, 9, c('red', 3)); // the nose
    p.set(11, 8, ink).rect(10, 8, 3, 1, c('brass', 2)); // spectacles
    p.rect(6, 12, 9, 5, ink).rect(7, 12, 7, 4, jacket).rect(7, 12, 1, 4, jacketL).rect(13, 12, 1, 3, shirt).set(13, 13, tie);
    p.rect(7 + a, 16, 3, 2, pants).rect(11 - a, 16, 3, 2, pants);
    p.rect(7 + a, 18, 4, 1, shoe).rect(11 - a, 18, 4, 1, shoe);
    if (squawk) {
      p.rect(14, 9, 2, 4, jacket);
      chicken(p, 15, 4, true);
    } else {
      p.rect(9, 13, 3, 3, jacket);
      p.line(12, 15, 16, 17, c('red', 2));
      chicken(p, 15, 14, false);
    }
    return p;
  }
  // facing down (toward you)
  p.rect(5, 0, 10, 7, ink).rect(6, 1, 8, 5, hat).rect(3, 5, 14, 2, ink).rect(4, 5, 12, 1, hatD).rect(6, 3, 8, 1, c('red', 1));
  p.rect(6, 7, 8, 6, ink).rect(7, 7, 6, 5, skin);
  p.rect(7, 10, 6, 2, c('night', 2)).rect(9, 10, 2, 1, c('paper', 4)); // ash beard, white mouth (turned down)
  p.set(8, 11, c('paper', 4)).set(11, 11, c('paper', 4));
  p.rect(9, 9, 2, 1, c('red', 3)); // the red nose
  p.frame(7, 8, 3, 2, c('brass', 2)).frame(10, 8, 3, 2, c('brass', 2));
  p.set(8, 8, ink).set(11, 8, ink);
  p.rect(4, 12, 12, 5, ink).rect(5, 12, 10, 4, jacket).rect(8, 12, 4, 4, shirt).rect(9, 12, 2, 4, tie).rect(5, 12, 1, 4, jacketL);
  p.rect(6 + a, 16, 3, 2, pants).rect(11 - a, 16, 3, 2, pants);
  p.rect(5 + a, 18, 4, 1, shoe).rect(11 - a, 18, 4, 1, shoe);
  if (squawk) {
    p.rect(15, 8, 2, 5, jacket);
    chicken(p, 14, 2, true);
  } else {
    p.rect(2, 12, 3, 4, jacket).rect(15, 12, 3, 4, jacket);
    p.line(17, 15, 17, 17, c('red', 2));
    chicken(p, 15, 15, false);
  }
  return p;
}

/** The rubber chicken: yellow, limp, orange beak, red comb. Held up (squeezed) or on its leash. */
export function chicken(p: Pixels, x: number, y: number, squeezed: boolean): void {
  const y2 = c('yellow', 3);
  const y1 = c('yellow', 1);
  if (squeezed) {
    p.rect(x, y + 1, 3, 4, y2).rect(x, y + 4, 3, 1, y1).set(x + 1, y, c('red', 3)).set(x + 3, y + 2, c('orange', 2)).set(x + 4, y + 2, c('orange', 2));
    p.set(x + 2, y + 1, O());
    return;
  }
  p.rect(x, y, 4, 2, y2).rect(x, y + 1, 4, 1, y1).set(x + 4, y, c('orange', 2)).set(x + 3, y - 1, c('red', 3)).set(x + 3, y, O());
}

// ------------------------------------------------------------------ the household

/** Teddy the corgi: red-gold, white blaze and chest, ears up (the right one taller). */
export function corgi(step = 0, flip = false): Pixels {
  const p = blank();
  const ink = O();
  const fur = c('corgi', 2);
  const lite = c('corgi', 3);
  const white = c('paper', 4);
  p.rect(4, 18, 13, 2, c('dark', 0));
  p.rect(3, 10, 13, 6, ink).rect(4, 11, 11, 4, fur).rect(4, 11, 11, 1, lite).rect(9, 13, 5, 2, white);
  p.rect(13, 6, 6, 7, ink).rect(14, 7, 4, 5, fur).rect(16, 9, 3, 3, white).set(18, 10, ink).set(15, 8, ink);
  p.rect(13, 2, 2, 5, ink).rect(16, 1, 2, 6, ink).set(13, 3, c('pink', 2)).set(16, 3, c('pink', 2));
  const a = step ? 1 : 0;
  p.rect(5 + a, 16, 2, 3, fur).rect(12 - a, 16, 2, 3, fur).rect(5 + a, 19, 2, 1, white).rect(12 - a, 19, 2, 1, white);
  p.rect(2, 11, 2, 3, lite);
  return flip ? p.flipX() : p;
}

/** Gwinn (two n's): lean, chocolate brown, amber eyes, floppy ears, pink collar. */
export function gwinn(step = 0, flip = false): Pixels {
  const p = blank();
  const ink = O();
  const fur = c('brown', 2);
  p.rect(3, 18, 14, 2, c('dark', 0));
  p.rect(2, 8, 13, 7, ink).rect(3, 9, 11, 5, fur).rect(3, 9, 11, 1, c('brown', 3)).rect(10, 12, 3, 2, c('paper', 3));
  p.rect(13, 3, 7, 8, ink).rect(14, 4, 5, 6, fur).set(16, 5, c('orange', 3)).rect(18, 7, 2, 2, c('brown', 0));
  p.rect(13, 4, 2, 5, c('brown', 1));
  p.rect(13, 10, 5, 1, c('pink', 2));
  const a = step ? 1 : 0;
  p.rect(4 + a, 15, 2, 4, fur).rect(11 - a, 15, 2, 4, fur);
  p.line(2, 9, 0, 6 + a, fur);
  return flip ? p.flipX() : p;
}

// ------------------------------------------------------------------ vermin and hazards

/** A kitchen mouse, grey, pink ears and a long tail. `scared` sends it off with its ears back. */
export function mouse(step: number, scared = false): Pixels {
  const p = blank();
  const ink = O();
  const fur = scared ? c('grey', 4) : c('grey', 3);
  p.rect(5, 15, 10, 2, c('dark', 0));
  blob(p, 10, 12, 5, 3.5, [c('grey', 1), c('grey', 2), fur, c('grey', 4)], 0, 3);
  p.disc(14, 10, 2.6, fur);
  p.disc(13, 7.5, 1.6, c('pink', 2)).disc(15.5, 8, 1.4, c('pink', 2));
  p.set(15, 10, ink).set(17, 11, c('pink', 1));
  const t = step ? 1 : -1;
  p.line(5, 12, 2, 12 + t, c('pink', 1)).line(2, 12 + t, 1, 10, c('pink', 1));
  if (scared) p.set(13, 6, ink).set(16, 6, ink).set(15, 9, c('paper', 4)).rect(17, 6, 2, 1, c('sky', 3));
  p.set(7 + step, 15, c('pink', 2)).set(12 - step, 15, c('pink', 2));
  return outline(p, ink);
}

/** A rolling pin, end on, rolling (frame turns the grain). */
export function rollingPin(frame: number): Pixels {
  const p = blank();
  p.rect(1, 9, 18, 4, c('dark', 0));
  p.rect(0, 8, 3, 3, c('brown', 1)).rect(17, 8, 3, 3, c('brown', 1));
  blob(p, 10, 9, 7, 4.5, [c('orange', 0), c('orange', 1), c('corgi', 3), c('orange', 3)], 0, 3);
  for (let i = 0; i < 3; i++) p.rect(5 + ((i * 5 + frame * 2) % 11), 6, 1, 7, c('orange', 0));
  return outline(p, O());
}

/** A kitchen knife, spinning point over handle. */
export function knife(frame: number): Pixels {
  const p = blank();
  const steel = c('grey', 5);
  if (frame === 0) {
    p.rect(3, 9, 10, 3, steel).set(13, 10, steel).set(14, 10, steel).rect(3, 9, 10, 1, c('grey', 3));
    p.rect(14, 8, 5, 5, c('brown', 1)).set(16, 10, c('brass', 3));
  } else {
    p.rect(9, 2, 3, 10, steel).set(10, 12, steel).rect(9, 2, 1, 10, c('grey', 3));
    p.rect(8, 12, 5, 6, c('brown', 1)).set(10, 15, c('brass', 3));
  }
  return outline(p, O());
}

/** A toy Redcoat on a wooden base: tall black bearskin, red coat, white crossbelts, musket. */
export function redcoat(step: number, retreat = false): Pixels {
  const p = blank();
  const ink = O();
  p.rect(5, 18, 10, 2, c('dark', 0));
  p.rect(6, 0, 7, 6, ink).rect(7, 1, 5, 5, c('ink', 1));
  p.rect(7, 6, 5, 3, c('skin', 2)).set(8, 7, ink).set(10, 7, ink);
  if (retreat) p.rect(8, 8, 3, 1, ink).set(13, 4, c('sky', 3)).set(14, 5, c('sky', 3));
  p.rect(5, 9, 9, 6, ink).rect(6, 9, 7, 5, c('redcoat', 2)).line(6, 9, 12, 14, c('paper', 4)).line(12, 9, 6, 14, c('paper', 4));
  p.rect(6, 15, 3, 3 - step, c('paper', 3)).rect(10, 15, 3, 2 + step, c('paper', 3));
  p.rect(4, 18, 11, 2, c('brown', 1));
  if (!retreat) p.rect(14, 2, 1, 13, c('brown', 0)).set(14, 1, c('grey', 4));
  else p.rect(1, 5, 1, 10, c('paper', 4)).rect(2, 5, 4, 3, c('paper', 4)); // a white flag
  return outline(p, ink);
}

/** A sugar ant, black and shiny. */
export function ant(step: number): Pixels {
  const p = blank();
  const ink = O();
  const body = c('ink', 1);
  p.disc(6, 10, 2.6, body).disc(10, 10, 2, body).disc(14, 10, 2.4, body);
  p.set(5, 9, c('grey', 4)).set(14, 9, c('grey', 4));
  const a = step ? 1 : -1;
  for (const x of [8, 10, 12]) p.line(x, 11, x - 2, 14 + a, body).line(x, 9, x - 2, 6 - a, body);
  p.line(16, 9, 18, 6, body).line(16, 10, 19, 8, body);
  p.rect(13, 3, 3, 2, c('paper', 4)); // carrying a sugar crystal
  return outline(p, ink);
}

/** A ball of oven fire. */
export function fireball(frame: number): Pixels {
  const p = blank();
  blob(p, 10, 10, 6, 6, [c('red', 1), c('red', 3), c('orange', 2), c('orange', 3), c('yellow', 3)], 0, 4);
  p.disc(9 + frame, 9, 2.5, c('yellow', 3));
  p.set(4 + frame * 2, 4, c('orange', 3)).set(15 - frame, 3, c('yellow', 2));
  return p;
}

/** A puff of steam, rising. */
export function steam(frame: number): Pixels {
  const p = blank();
  const ramp = [c('grey', 3), c('grey', 4), c('grey', 5), c('paper', 4)];
  blob(p, 8, 12 - frame, 5, 4, ramp, 0, 3);
  blob(p, 13, 9 - frame, 4, 3.5, ramp, 0, 3);
  blob(p, 10, 6 - frame, 3, 2.5, ramp, 1, 3);
  return p;
}

/** A brewing bubble. */
export function bubble(frame: number): Pixels {
  const p = blank();
  const r = 4 + frame;
  p.ring(10, 10, r, c('foam', 2)).ring(10, 10, r - 1, c('rootbeer', 3));
  p.set(8, 7, c('paper', 4)).set(7, 8, c('paper', 4));
  return p;
}

/** A cork popped from a keg, tumbling. */
export function cork(frame: number): Pixels {
  const p = blank();
  if (frame === 0) p.rect(5, 7, 10, 6, c('brown', 2)).rect(5, 7, 10, 2, c('brown', 3)).set(7, 10, c('brown', 0)).set(11, 11, c('brown', 0));
  else p.rect(7, 5, 6, 10, c('brown', 2)).rect(7, 5, 2, 10, c('brown', 3)).set(10, 8, c('brown', 0)).set(9, 12, c('brown', 0));
  p.set(2, 10, c('foam', 2)).set(1, 8, c('foam', 1));
  return outline(p, O());
}

/** A loose spark from Franklin's kite. */
export function spark(frame: number): Pixels {
  const p = blank();
  const y = c('yellow', 3);
  const w = c('paper', 4);
  const pts = frame ? [10, 2, 7, 9, 12, 10, 8, 18] : [9, 2, 13, 8, 8, 11, 12, 18];
  for (let i = 0; i < pts.length - 2; i += 2) p.line(pts[i], pts[i + 1], pts[i + 2], pts[i + 3], y);
  p.disc(10, 10, 1.5, w);
  return outline(p, c('orange', 1));
}

/** An icicle, falling. */
export function icicle(): Pixels {
  const p = blank();
  for (let y = 2; y < 18; y++) {
    const w = Math.max(1, Math.round((18 - y) / 3));
    p.rect(10 - Math.floor(w / 2), y, w, 1, y < 8 ? c('sky', 4) : c('sky', 3));
  }
  p.set(9, 4, c('paper', 4));
  return outline(p, c('blue', 1));
}

/** A bottle cap flicked off the bottling line. */
export function flyingCap(frame: number): Pixels {
  const p = blank();
  if (frame === 0) {
    p.disc(10, 10, 5, c('red', 3));
    for (let a = 0; a < 12; a++) p.set(10 + Math.cos(a / 1.9) * 6, 10 + Math.sin(a / 1.9) * 6, c('red', 2));
    p.disc(10, 10, 2.5, c('paper', 4)).set(9, 9, c('red', 2));
  } else p.rect(4, 9, 12, 3, c('red', 3)).rect(4, 9, 12, 1, c('red', 4));
  return outline(p, O());
}

/** The rubber chicken's squawk: a wave of noise, in the direction Doc Leo faces. */
export function squawkWave(frame: number): Pixels {
  const p = blank();
  const col = frame ? c('yellow', 3) : c('paper', 4);
  for (let r = 4; r < 10; r += 3) p.ring(4, 10, r + frame, col);
  micro(p, 9, 2, 'SQ', c('orange', 2));
  return p;
}

/** A kazoo blast: a zigzag going out one way. */
export function kazooWave(frame: number): Pixels {
  const p = blank();
  const col = frame ? c('pink', 3) : c('purple', 3);
  for (let i = 0; i < 4; i++) p.line(2 + i * 4, frame ? 6 : 14, 4 + i * 4, frame ? 14 : 6, col).line(4 + i * 4, frame ? 14 : 6, 6 + i * 4, frame ? 6 : 14, col);
  return p;
}

// ------------------------------------------------------------------ things to pick up

/** A bottle cap: 50 points, the Kitchen's small change. */
export function cap(): Pixels {
  const p = blank();
  p.disc(10, 12, 5, c('dark', 0));
  p.disc(10, 10, 5, c('brass', 2));
  for (let a = 0; a < 14; a++) p.set(10 + Math.cos(a / 2.23) * 5.5, 10 + Math.sin(a / 2.23) * 5.5, c('brass', 1));
  p.disc(10, 10, 3, c('brass', 3)).set(9, 9, c('paper', 4));
  micro(p, 9, 8, 'R', c('rootbeer', 1));
  return p;
}

/** A root beer float: hit points. */
export function float(): Pixels {
  const p = blank();
  p.rect(5, 17, 10, 2, c('dark', 0));
  p.rect(6, 6, 8, 11, c('glass', 3)).rect(7, 8, 6, 8, c('rootbeer', 2)).rect(7, 8, 1, 8, c('rootbeer', 3));
  blob(p, 10, 6, 5, 3, [c('foam', 0), c('foam', 1), c('foam', 2)], 0, 2);
  p.rect(12, 0, 1, 7, c('red', 3)).rect(12, 0, 3, 1, c('red', 3));
  p.disc(8, 3, 1.4, c('red', 3)); // a cherry
  return outline(p, O());
}

/** A slice of Grandma Baker's pie: a life. */
export function pie(): Pixels {
  const p = blank();
  p.rect(3, 15, 15, 2, c('dark', 0));
  for (let y = 6; y < 15; y++) {
    const w = Math.round((y - 5) * 1.6);
    p.rect(10 - Math.floor(w / 2), y, w, 1, c('red', 2));
  }
  p.rect(3, 13, 14, 3, c('orange', 2)).rect(3, 13, 14, 1, c('orange', 3));
  p.line(10, 6, 4, 13, c('orange', 3)).line(10, 6, 16, 13, c('orange', 3));
  p.set(9, 10, c('red', 4)).set(11, 12, c('red', 4));
  return outline(p, O());
}

/** A wooden spoon, well gnawed and still sticky: the kitchen's latches take one each. */
export function spoon(): Pixels {
  const p = blank();
  p.rect(3, 14, 15, 2, c('dark', 0));
  blob(p, 5, 10, 3.5, 2.6, [c('wood', 1), c('wood', 2), c('wood', 3), c('wood', 4)], 0, 3);
  p.rect(8, 9, 10, 2, c('wood', 3)).rect(8, 9, 10, 1, c('wood', 4)).set(17, 10, c('wood', 1));
  p.set(15, 10, c('wood', 1)).set(13, 9, c('wood', 2)); // tooth marks (Teddy)
  return outline(p, O());
}

/** The kazoo (carried, it plays K): Doc Leo's instrument of choice. */
export function kazoo(): Pixels {
  const p = blank();
  p.rect(2, 14, 16, 2, c('dark', 0));
  p.rect(3, 9, 13, 4, c('red', 3)).rect(3, 9, 13, 1, c('red', 4)).rect(14, 8, 4, 6, c('red', 2));
  p.rect(8, 6, 3, 3, c('grey', 4)).rect(8, 6, 3, 1, c('grey', 5));
  return outline(p, O());
}

/** Ebenezer's tricorn (carried, it plays T: a salute). */
export function tricorn(): Pixels {
  const p = blank();
  p.rect(2, 14, 16, 2, c('dark', 0));
  p.rect(2, 9, 16, 4, c('ink', 1)).rect(5, 6, 10, 4, c('ink', 1)).set(2, 8, c('ink', 1)).set(17, 8, c('ink', 1));
  p.rect(2, 12, 16, 1, c('brass', 2)).disc(14, 10, 1.4, c('paper', 4));
  return outline(p, O());
}

/** The rubber chicken as an inventory item (F2 shows it). */
export function chickenItem(): Pixels {
  const p = blank();
  p.rect(4, 8, 11, 6, c('yellow', 3)).rect(4, 12, 11, 2, c('yellow', 1)).rect(14, 5, 3, 4, c('yellow', 3));
  p.set(15, 4, c('red', 3)).set(16, 4, c('red', 3)).rect(17, 6, 2, 1, c('orange', 2)).set(15, 6, O());
  p.rect(2, 10, 2, 2, c('yellow', 2)).line(6, 14, 6, 17, c('orange', 2)).line(11, 14, 11, 17, c('orange', 2));
  p.line(3, 16, 0, 18, c('red', 2));
  return outline(p, O());
}

// ------------------------------------------------------------------ the ingredients

export const INGREDIENT_NAMES = [
  'Sassafras Root',
  'Wintergreen',
  'Nutmeg',
  'Molasses',
  'Vanilla Bean',
  'Boston Harbor Tea',
  'Cane Sugar',
  'Yeast (Gerald)',
  'Cloves',
  'Licorice Root',
  'Bottled Lightning',
  'Twice-Boiled Water',
  'The Thirteenth',
] as const;

/** Ingredient n (1..13) as a 20x20 sprite with a soft golden glow behind it. */
export function ingredient(n: number, frame = 0): Pixels {
  const p = blank();
  const ink = O();
  const glow = frame ? c('yellow', 3) : c('yellow', 2);
  for (let a = 0; a < 16; a++) p.set(10 + Math.cos(a / 2.55) * 9, 10 + Math.sin(a / 2.55) * 9, glow);
  const q = blank();
  switch (n) {
    case 1: // sassafras: a gnarled root under mitten-shaped leaves
      q.line(10, 9, 10, 15, c('brown', 2)).line(10, 15, 6, 17, c('brown', 2)).line(10, 15, 14, 17, c('brown', 1)).line(10, 13, 7, 14, c('brown', 1));
      q.disc(7, 6, 2.6, c('green', 2)).disc(13, 6, 2.6, c('green', 3)).disc(15, 4, 1.4, c('green', 3)).disc(10, 4, 2, c('green', 2));
      break;
    case 2: // wintergreen: glossy leaves, red berries
      q.disc(7, 9, 3.4, c('green', 1)).disc(13, 8, 3.4, c('green', 2)).disc(10, 12, 3, c('green', 1));
      q.line(6, 8, 9, 11, c('green', 3)).disc(9, 14, 1.6, c('red', 3)).disc(12, 15, 1.6, c('red', 3)).disc(11, 13, 1.2, c('red', 2));
      break;
    case 3: // nutmeg: a brown seed with a grater
      blob(q, 8, 11, 4, 5, [c('brown', 0), c('brown', 1), c('brown', 2), c('brown', 3)], 0, 3);
      q.line(6, 9, 10, 13, c('brown', 0)).rect(12, 4, 5, 12, c('grey', 4)).frame(12, 4, 5, 12, c('grey', 2));
      for (let y = 6; y < 15; y += 2) q.set(14, y, c('grey', 1));
      break;
    case 4: // molasses: a stoneware jug
      blob(q, 10, 12, 6, 5, [c('rootbeer', 0), c('rootbeer', 1), c('paper', 2), c('paper', 3)], 0, 3);
      q.rect(8, 4, 4, 4, c('paper', 2)).rect(8, 3, 4, 1, c('brown', 2)).ring(14, 8, 2, c('paper', 2));
      micro(q, 5, 11, 'MOL', c('rootbeer', 0));
      break;
    case 5: // vanilla: a dark pod and a pale orchid
      q.line(4, 16, 15, 6, c('rootbeer', 0)).line(5, 16, 16, 6, c('rootbeer', 1));
      q.disc(13, 13, 2.4, c('paper', 4)).disc(11, 14, 1.6, c('paper', 3)).disc(15, 14, 1.6, c('paper', 3)).set(13, 13, c('yellow', 2));
      break;
    case 6: // tea: a tea chest, stencilled
      q.rect(4, 6, 12, 10, c('brown', 2)).rect(4, 6, 12, 2, c('brown', 3)).frame(4, 6, 12, 10, c('brown', 0));
      micro(q, 5, 10, 'TEA', c('ink', 0));
      q.line(4, 16, 16, 6, c('sky', 3)); // a wet stripe: it has been in the harbor
      break;
    case 7: // cane sugar: a sugar loaf in blue paper
      for (let y = 3; y < 17; y++) {
        const w = Math.round((y - 2) * 0.7) + 1;
        q.rect(10 - Math.floor(w / 2), y, w, 1, y < 9 ? c('paper', 4) : c('blue', 2));
      }
      q.rect(5, 12, 10, 1, c('blue', 3)).line(7, 16, 13, 12, c('red', 2));
      break;
    case 8: // yeast: Gerald, a crock of starter with eyes
      q.rect(5, 7, 10, 10, c('paper', 2)).rect(5, 7, 10, 1, c('paper', 3)).rect(6, 4, 8, 4, c('foam', 1));
      q.disc(8, 5, 1.2, c('paper', 4)).disc(12, 5, 1.2, c('paper', 4)).set(8, 5, ink).set(12, 5, ink);
      micro(q, 6, 11, 'GER', c('rootbeer', 1));
      break;
    case 9: // cloves: a little bunch
      for (const [x, y] of [
        [6, 6],
        [10, 5],
        [14, 7],
        [8, 11],
        [12, 11],
        [10, 15],
      ]) {
        q.line(x, y, x, y + 4, c('rootbeer', 1)).disc(x, y, 1.6, c('rootbeer', 2)).set(x, y - 1, c('rootbeer', 3));
      }
      break;
    case 10: // licorice: twisted black sticks
      for (const x of [6, 10, 14]) for (let y = 3; y < 17; y++) q.set(x + ((y >> 1) % 2), y, y % 3 ? c('ink', 1) : c('purple', 0));
      q.rect(5, 9, 11, 1, c('brass', 2));
      break;
    case 11: // bottled lightning: a Leyden jar with a bolt in it
      q.rect(5, 6, 10, 11, c('glass', 3)).rect(5, 12, 10, 5, c('grey', 4)).rect(9, 2, 2, 5, c('brass', 3)).disc(10, 2, 1.5, c('brass', 4));
      q.line(10, 6, 8, 10, c('yellow', 3)).line(8, 10, 12, 10, c('yellow', 3)).line(12, 10, 9, 15, c('yellow', 3));
      break;
    case 12: // water, boiled twice: a pail, steaming
      q.rect(5, 8, 10, 8, c('grey', 3)).rect(5, 8, 10, 1, c('grey', 5)).rect(6, 9, 8, 2, c('sky', 3)).ring(10, 8, 5, c('grey', 2));
      q.line(7, 6, 6, 3, c('paper', 4)).line(12, 6, 13, 3, c('paper', 4));
      micro(q, 7, 12, 'X2', c('ink', 0));
      break;
    default: // the thirteenth: a rolled recipe card under a wax seal
      q.rect(4, 6, 12, 9, c('paper', 4)).rect(3, 6, 2, 9, c('paper', 2)).rect(15, 6, 2, 9, c('paper', 2));
      for (let y = 8; y < 14; y += 2) q.rect(6, y, 8, 1, c('sky', 3));
      q.disc(10, 13, 3, c('red', 2)).disc(10, 13, 2, c('red', 3));
      micro(q, 7, 11, 'XIII', c('red', 4));
      break;
  }
  return over(p, outline(q, ink));
}
