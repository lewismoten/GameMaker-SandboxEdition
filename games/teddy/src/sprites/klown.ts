// The Clown Club's people and things that turn up in every level: Doc Leo's red CitiCar
// waiting at each level's end (it only opens for the piece of Doc Leo's costume Teddy
// fetched), Pockets who drives it for him today, and the costume pieces themselves.
import { Pixels } from '../../../kit/pixels';
import { chezSide, type ChezInk } from '../../../kit/chez';
import { CLEAR, blob, over, sprite } from '../art/draw';
import { P } from '../art/pal';
import { canvas, cut } from '../blocks/tiles';

const c = (n: string, k: number) => P.c(n, k);

export const CK: Record<string, number> = {
  o: c('ink', 0),
  O: c('ink', 1),
  w: c('fur', 2),
  W: c('fur', 1),
  r: c('red', 2),
  R: c('red', 3),
  q: c('red', 1),
  y: c('yellow', 2),
  Y: c('yellow', 3),
  j: c('yellow', 1),
  b: c('blue', 2),
  B: c('blue', 3),
  n: c('blue', 1),
  g: c('green', 1),
  G: c('green', 2),
  v: c('purple', 2),
  V: c('purple', 3),
  p: c('pink', 2),
  P: c('pink', 3),
  s: c('skin', 2),
  S: c('skin', 3),
  m: c('metal', 1),
  M: c('metal', 3),
  h: c('wood', 1),
  H: c('wood', 2),
  k: c('stone', 1),
  K: c('stone', 3),
  t: c('corgi', 3),
  e: c('gold', 2),
};

/** Doc Leo's costume pieces: Gwinn scattered them all over town. */
export const PROPS: Record<string, string[]> = {
  // His felt fedora, chewed at the brim (Gwinn again).
  hat: ['....oooooo....', '...okkOkkko...', '...okkkkkko...', '...oooooooo...', '..okkkkkkkko..', 'ooOkkkkkkkkOoo', 'okkkkkkkkkk.oo', '.ooooooooo....'],
  // His green tie, with a little pattern.
  tie: ['.ooooo.', 'oGgGgGo', '.oGGGo.', '..oGo..', '.oGgGo.', '.oGGGo.', 'oGGgGGo', 'oGGGGgo', 'ogGGGGo', 'oGGgGGo', '.oGGGo.', '..oGo..', '...o...'],
  // Red sneakers, white laces, white soles.
  shoes: ['..oooo........', '.oRwRwo.......', '.oRRwRwoooo...', 'oRRRRRRRRRRo..', 'oRRRRRRRRRRRo.', 'owwwwwwwwwwwwo', '.oooooooooooo.'],
  // The rubber chicken in its red harness, lying where Gwinn dropped it, its leash in a loop.
  chicken: [
    '..rr..........',
    '.oYYo.........',
    'eeoYo.........',
    '..rYo.........',
    '..oYYoooo.....',
    '..oYqqYYYo....',
    '...oYqYYYYo...',
    '....oYYYYYoq..',
    '....qoooooo.q.',
    '...q..j..j..q.',
    '....qqq...qq..',
  ],
  // The red nose (on means showtime).
  nose: ['..oooo..', '.oRRRRo.', 'oRwRRRRo', 'oRRRRRRo', 'oRRRRRqo', 'oqRRRqqo', '.oqqqqo.', '..oooo..'],
};

export function propSprite(name: string, dy?: number): Pixels {
  return sprite(PROPS[name], CK, undefined, dy);
}

/** A prop sitting on a background block. */
export function propOn(base: Pixels, name: string): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  return over(p, propSprite(name));
}

/**
 * Doc Leo's car: THE CHEZ, a red 1976½ CitiCar, 2x2 blocks [roof L, roof R], [door, back],
 * drawn from the shared side view (games/kit/chez.ts) stretched up so its roof meets the top
 * blocks and Doc Leo fits in it beside the people. It faces right, so it shows the driver's
 * side: the black roof, the one door window, the racing stripes stepping up over the rear
 * quarter. `open` opens the door (only the lower left block changes, as that is the block
 * Teddy walks into).
 */
export function klownCar(base: (bx: number, by: number) => Pixels, open: boolean): Pixels[][] {
  const p = canvas(2, 2, base);
  citiCar(p, 0, 0, open);
  return cut(p);
}

/** THE CHEZ in this game's colors. */
export const CHEZ: ChezInk = {
  body: [c('red', 1), c('red', 2), c('red', 3)],
  trim: c('red', 0),
  glass: [c('blue', 1), c('sky', 6)],
  roof: c('ink', 0),
  tire: c('ink', 0),
  hub: c('metal', 4),
  rim: c('paint', 3),
  bumper: c('ink', 1),
  lamp: c('gold', 1),
  tail: c('red', 3),
  stripe: c('ink', 1),
  pin: c('paint', 3),
  chrome: c('metal', 4),
};
/** How much taller than true it is drawn, to fill its two rows of blocks. */
const TALL = 1.6;

/** Draws the CitiCar into a 40x40 area at (x0, y0) (also used, scaled, in the cartoons). */
export function citiCar(p: Pixels, x0: number, y0: number, open = false): void {
  const top = 40 - Math.round(20 * TALL);
  chezSide(p, x0, y0 + top, CHEZ, 'right', 1, TALL);
  if (open) {
    // the door open: the dark inside and the edge of the seat (the left block's half of it)
    const y = (v: number) => y0 + top + Math.round(v * TALL);
    p.rect(x0 + 14, y(8.6), 6, y(17.8) - y(8.6), c('ink', 0));
    p.rect(x0 + 14, y(11.5), 6, 2, c('red', 0));
  }
}

/** Pockets, driving Doc Leo's CitiCar today: [head, body] over a background. */
export function pockets(base: (by: number) => Pixels, wave = false): Pixels[] {
  const p = canvas(1, 2, (_, by) => base(by));
  const fig = sprite(
    [
      '......oooo..........',
      '.....oOOOOo.........',
      '.....oOOOOo.y.......',
      '...ooooooooooy......',
      '....owwwwwwo........',
      '...owwbwwbwwo.......',
      '...owwwRRwwwo.......',
      '..oPwwRRRRwwPo......',
      '...owrwwwwrwo.......',
      '...owwrrrrwwo.......',
      '....owwwwwwo........',
      '.....ooRRoo.........',
      wave ? '..oooGgGgGgoo.oSo...' : '..oooGgGgGgoooo.....',
      wave ? '.oGGGGgGgGGGGoSo....' : '.oGGGGgGgGGGGGo.....',
      wave ? 'oGGoGGgGgGGooGo.....' : 'oGGoGGgGgGGoGGo.....',
      'oGo.GGgGgGG.oGo.....',
      'oSo.GGgGgGG.oSo.....',
      '.o.oYYYYYYYYo.o.....',
      '...oYoooooooYo......',
      '...oYYYYYYYYYo......',
      '..obbbbbbbbbbbo.....',
      '..obbbboobbbbbo.....',
      '..obbbbooobbbbo.....',
      '..oBBBBoobbbbbo.....',
      '..obbbboobbbbbo.....',
      '..obbbbo.obbbbo.....',
      '..obbbbo.obbbbo.....',
      '.oooooo..ooooooo....',
      'oRRRRRRo.oRRRRRRo...',
      'oRRRRRRRooRRRRRRRo..',
      '.ooooooo..oooooooo..',
    ],
    CK,
    2,
    9,
    20,
    40,
  );
  over(p, fig);
  return [p.crop(0, 0, 20, 20), p.crop(0, 20, 20, 20)];
}

/** A thought bubble showing the costume piece Pockets is waiting for. */
export function wantBubble(base: Pixels, name: string): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  blob(p, 10, 8, 9, 7, [c('fur', 1), c('fur', 2), c('fur', 2)], 0, 2, 0.4);
  p.set(3, 17, c('fur', 2)).set(2, 19, c('fur', 2)).set(4, 16, c('fur', 2));
  const icon = sprite(PROPS[name], CK, undefined, undefined, 20, 16);
  over(p, icon, 0, 0);
  return p;
}

export { CLEAR };
