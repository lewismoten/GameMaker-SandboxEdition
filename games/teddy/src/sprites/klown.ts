// The Klown Klub's people and things that turn up in every level: Doc Leo's red CitiCar
// waiting at each level's end (it only opens for the piece of Doc Leo's costume Teddy
// fetched), Pockets who drives it for him today, and the costume pieces themselves.
import { Pixels } from '../../../kit/pixels';
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

/**
 * Doc Leo's car: a red 1976 CitiCar, the tiny electric wedge (a doorstop on wheels), 2x2
 * blocks [roof L, roof R], [door, back]. It faces right: a flat back, a flat roof, then
 * one long slope from the roof down over the windshield to the pointed nose, with big
 * black bumpers at both ends. `open` swings the door open (only the lower left block
 * changes, as that is the block Teddy walks into).
 */
export function klownCar(base: (bx: number, by: number) => Pixels, open: boolean): Pixels[][] {
  const p = canvas(2, 2, base);
  citiCar(p, 0, 0, open);
  return cut(p);
}

/** Draws the CitiCar into a 40x40 area at (x0, y0) (also used, scaled, in the cartoons). */
export function citiCar(p: Pixels, x0: number, y0: number, open = false): void {
  const roofY = 7;
  const slopeX = 17; // where the roof ends and the wedge begins
  const noseX = 38;
  const sill = 31;
  const top = (x: number) => (x <= slopeX ? roofY : roofY + Math.round(((x - slopeX) * (25 - roofY)) / (noseX - slopeX)));
  for (let x = 2; x <= noseX; x++) {
    for (let y = top(x); y <= sill; y++) {
      const edge = y === top(x) || x === 2 || x === noseX || y === sill;
      const shade = edge ? c('red', 0) : y > 25 ? c('red', 1) : x < 5 ? c('red', 1) : c('red', 2);
      p.set(x0 + x, y0 + y, shade);
    }
  }
  // a highlight along the roof and down the wedge
  for (let x = 4; x < noseX - 1; x++) p.set(x0 + x, y0 + top(x) + 1, c('red', 3));
  // windows: the back side window, the door window, and the windshield along the slope
  for (let y = roofY + 3; y <= 18; y++) for (let x = 4; x <= 8; x++) p.set(x0 + x, y0 + y, y < 12 ? c('sky', 7) : c('sky', 5));
  for (let y = roofY + 3; y <= 18; y++) for (let x = 11; x <= 24; x++) if (y >= top(x) + 3) p.set(x0 + x, y0 + y, x - y > 2 ? c('sky', 7) : c('sky', 5));
  // the door: a seam round it and a little handle
  const dx0 = 10;
  const dx1 = 19;
  for (let y = roofY + 2; y <= sill - 1; y++) p.set(x0 + dx0, y0 + y, c('red', 0)).set(x0 + dx1, y0 + y, c('red', 0));
  p.rect(x0 + dx0, y0 + sill - 1, dx1 - dx0 + 1, 1, c('red', 0));
  p.rect(x0 + 16, y0 + 21, 2, 1, c('metal', 3));
  if (open) {
    p.rect(x0 + dx0, y0 + 20, dx1 - dx0 + 1, sill - 20, c('ink', 0));
    p.rect(x0 + 3, y0 + 20, 6, sill - 20, c('red', 2)).frame(x0 + 3, y0 + 20, 6, sill - 20, c('red', 0));
  }
  // the big black bumpers, front and back, and a headlight in the nose
  p.rect(x0 + 0, y0 + 26, 4, 6, c('ink', 0)).rect(x0 + 0, y0 + 26, 4, 1, c('ink', 1));
  p.rect(x0 + noseX - 2, y0 + 27, 4, 6, c('ink', 0)).rect(x0 + noseX - 2, y0 + 27, 4, 1, c('ink', 1));
  p.rect(x0 + noseX - 4, y0 + 23, 2, 2, c('yellow', 3));
  p.rect(x0 + 3, y0 + 23, 1, 2, c('red', 3));
  // small wheels with silver hubcaps
  for (const x of [9, 30]) {
    blob(p, x0 + x, y0 + 35, 4, 4, P.r('ink'), 0, 1);
    p.rect(x0 + x - 1, y0 + 34, 3, 3, c('metal', 3));
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
