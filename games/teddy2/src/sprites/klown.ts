// The people and things that turn up in every level: Doc Leo's red CitiCar, THE CHEZ,
// waiting at each level's end with Doc Leo beside it (its door only opens once Teddy brings
// what Gwinn dropped on that stop), the things she dropped, and Doc Leo's costume pieces
// (for the cartoons). Pockets drove it in the first adventure; he is still in the code.
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

/** Doc Leo's costume pieces: Gwinn scattered them all over town. */
export const PROPS: Record<string, string[]> = {
  // His felt fedora, chewed at the brim (Gwinn again).
  hat: [
    '....oooooo....',
    '...okkOkkko...',
    '...okkkkkko...',
    '...oooooooo...',
    '..okkkkkkkko..',
    'ooOkkkkkkkkOoo',
    'okkkkkkkkkk.oo',
    '.ooooooooo....',
  ],
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
  // The things Gwinn dropped along her way. Her pink collar, the tag still on it.
  collar: ['...ppppp....', '..pP...Pp...', '.pP.....Pp..', '.p.......p..', '.pP.....Pp..', '..pP...Pp...', '...ppppp....', '.....oeo....', '.....oeeo...', '......oo....'],
  // Her pink rope leash, in a tangle.
  leash: ['....pppp......', '..ppPPPPpp....', '.pP......Pp...', 'pP..pppp..Pp..', 'p..pP..Pp..p..', 'pP.p....p.Pp..', '.pPp...pP.p...', '..ppPPPp..p...', '.........pP..m', '.........pPmmm', '..........ppm.'],
  // A corn dog stick, licked clean. She has been at the corn dogs.
  stick: ['.........yyo', '........yyjo', '.......yjjo.', '......yjjo..', '.....hHo....', '....hHo.....', '...hHo......', '..hHo.......', '.hHo........', 'hHo.........'],
  // Her dog show entry card: number 13. (She has entered herself.)
  tag: ['oooooooooooo', 'owwwwwwwwwwo', 'owbbwbbbbwwo', 'owwbwwwwbwwo', 'owwbwwbbbwwo', 'owwbwwwwbwwo', 'owbbbwbbbwwo', 'owwwwwwwwwwo', 'oqqqqqqqqqqo', 'oooooooooooo', '.....rr.....', '....r..r....'],
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
 * Doc Leo's car: a red 1976 CitiCar, the tiny electric wedge (a doorstop on wheels), 2x2
 * blocks [roof L, roof R], [door, back]. It faces right, so it shows its passenger side:
 * a flat back with the charging port low on it, a short flat roof, a steep windshield, then
 * the long flat hood sloping down to the pointed nose, big black bumpers at both ends and
 * small round whitewall wheels. `open` swings the door open (only the lower left block
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
  const shieldX = 18; // the roof ends and the windshield starts
  const cowlX = 25; // the windshield meets the hood
  const cowlY = 17;
  const noseX = 38;
  const noseY = 24;
  const sill = 31;
  const top = (x: number) =>
    x <= shieldX ? roofY + (x < 4 ? 4 - x : 0) : x <= cowlX ? roofY + Math.round(((x - shieldX) * (cowlY - roofY)) / (cowlX - shieldX)) : cowlY + Math.round(((x - cowlX) * (noseY - cowlY)) / (noseX - cowlX));
  for (let x = 2; x <= noseX; x++)
    for (let y = top(x); y <= sill; y++) {
      const edge = y === top(x) || x === 2 || x === noseX || y === sill;
      p.set(x0 + x, y0 + y, edge ? c('red', 0) : y > 26 ? c('red', 1) : c('red', 2));
    }
  // light along the roof and down the hood, and the pinstripe down the side
  for (let x = 4; x < noseX; x++) if (x <= shieldX || x > cowlX) p.set(x0 + x, y0 + top(x) + 1, c('red', 3));
  for (let x = 3; x < noseX - 1; x++) p.set(x0 + x, y0 + 25 - Math.floor(x / 14), c('yellow', 1));
  // windows: the little back quarter window, the door window, the windshield edge-on
  for (let y = roofY + 3; y <= 17; y++) for (let x = 4; x <= 7; x++) p.set(x0 + x, y0 + y, y < 12 ? c('sky', 7) : c('sky', 5));
  for (let y = roofY + 2; y <= 18; y++)
    for (let x = 11; x <= cowlX - 1; x++) if (y >= top(x) + 2) p.set(x0 + x, y0 + y, x - y > 0 ? c('sky', 7) : c('sky', 5));
  // the door: a seam round it and a little handle
  const dx0 = 10;
  const dx1 = 19;
  for (let y = roofY + 1; y <= sill - 1; y++) p.set(x0 + dx0, y0 + y, c('red', 0)).set(x0 + dx1, y0 + y, c('red', 0));
  p.rect(x0 + 17, y0 + 21, 2, 1, c('metal', 3));
  // the charging port, low at the back on this (the passenger) side
  p.rect(x0 + 4, y0 + 19, 3, 3, c('ink', 0)).set(x0 + 5, y0 + 20, c('metal', 3));
  if (open) {
    p.rect(x0 + dx0, y0 + 20, dx1 - dx0 + 1, sill - 20, c('ink', 0));
    p.rect(x0 + 3, y0 + 20, 6, sill - 20, c('red', 2)).frame(x0 + 3, y0 + 20, 6, sill - 20, c('red', 0));
  }
  // the big black bumpers, back and front, a headlight in the nose, a tail light
  p.rect(x0 + 0, y0 + 26, 4, 6, c('ink', 0)).rect(x0 + 0, y0 + 26, 4, 1, c('ink', 1));
  p.rect(x0 + noseX - 2, y0 + 27, 4, 6, c('ink', 0)).rect(x0 + noseX - 2, y0 + 27, 4, 1, c('ink', 1));
  p.rect(x0 + noseX - 3, y0 + 25, 2, 2, c('paint', 3)).set(x0 + noseX - 1, y0 + 26, c('yellow', 3));
  p.rect(x0 + 3, y0 + 23, 1, 2, c('red', 3));
  // small round wheels: black tires, whitewalls, silver hubcaps
  for (const x of [9, 30]) {
    blob(p, x0 + x, y0 + 35, 4.5, 4.5, P.r('ink'), 0, 1);
    p.ring(x0 + x, y0 + 35, 2, c('fur', 1));
    p.rect(x0 + x - 1, y0 + 34, 3, 3, c('metal', 3)).set(x0 + x, y0 + 35, c('metal', 1));
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
