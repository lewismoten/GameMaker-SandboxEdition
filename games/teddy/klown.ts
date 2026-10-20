// The Klown Klub's people and things that turn up in every level: the Klown Car waiting
// at each level's end (it only opens for the piece of Doc Leo's costume Teddy fetched),
// its driver Pockets, and the costume pieces themselves.
import { Pixels } from '../kit/pixels';
import { CLEAR, blob, over, sprite } from './draw';
import { P } from './pal';
import { canvas, cut } from './tiles';

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

/** Doc Leo's costume pieces, Gwin scattered them all over town. */
export const PROPS: Record<string, string[]> = {
  // Doc Leo's battered top hat with a daisy.
  hat: [
    '....oooooo....',
    '...oOOOOOOo...',
    '...oOOOOOOo.G.',
    '...oOOOOOOoGYG',
    '...oqqqqqqo.G.',
    '...oOOOOOOo...',
    'oooOOOOOOOOooo',
    'oOOOOOOOOOOOOo',
    '.oooooooooooo.',
  ],
  // A polka-dot bow tie.
  tie: ['oo........oo', 'oRRo....oRRo', 'oRwRo..oRwRo', 'oRRRRooRRRwo', 'oRwRRrrRRRRo', 'oRRRRooRwRRo', 'oRRwo..oRRRo', 'oRRo....oRwo', 'oo........oo'],
  // Enormous red clown shoes.
  shoes: ['....ooo.......', '...oRRRo......', '..oRRRRRooo...', '.oRRwRRRRRRoo.', 'oRRRRRRRRRRRRo', 'oqqqqqqqqqqqqo', '.oooooooooooo.'],
  // A bulb horn: honk!
  horn: ['.oo...........', 'oRRo.....ooooo', 'oRRRooooooyYYo', 'oRRRRoyyyyyyYo', 'oRRRooooooyyYo', 'oRRo.....ooooo', '.oo...........'],
  // The red nose.
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

/** The Klown Car: 2x2 blocks [roof L, roof R], [door, back]. `open` swings the door. */
export function klownCar(base: (bx: number, by: number) => Pixels, open: boolean): Pixels[][] {
  const p = canvas(2, 2, base);
  // body: a yellow bubble with blue dots
  blob(p, 20, 24, 19, 14, P.r('yellow'), 0, 3);
  for (const [x, y] of [
    [8, 20],
    [16, 30],
    [27, 22],
    [33, 31],
    [22, 15],
    [12, 30],
  ])
    p.rect(x, y, 3, 3, c('blue', 2)).set(x, y, c('blue', 3));
  // windshield and a flower on the antenna
  blob(p, 26, 15, 7, 5, P.r('sky'), 4, 7);
  p.line(34, 12, 37, 2, c('metal', 1));
  blob(p, 37, 2, 2, 2, P.r('pink'), 1, 3);
  p.set(37, 2, c('yellow', 3));
  // bumpers and wheels
  p.rect(0, 30, 3, 3, c('metal', 3)).rect(37, 30, 3, 3, c('metal', 3));
  for (const x of [9, 31]) {
    blob(p, x, 34, 5, 5, P.r('ink'), 0, 1);
    p.rect(x - 1, 33, 3, 3, c('metal', 3));
  }
  // the door
  if (open) {
    p.rect(4, 17, 13, 15, c('ink', 0));
    p.rect(1, 17, 3, 15, c('red', 2));
  } else {
    p.rect(4, 17, 13, 15, c('red', 2));
    p.frame(4, 17, 13, 15, c('red', 0));
    p.rect(13, 24, 2, 2, c('yellow', 3));
    // a little "star" sticker
    p.set(9, 21, c('yellow', 3)).set(8, 22, c('yellow', 3)).set(9, 22, c('yellow', 3)).set(10, 22, c('yellow', 3)).set(9, 23, c('yellow', 3));
  }
  return cut(p);
}

/** Pockets, the Klown Car driver: [head, body] over a background. */
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
