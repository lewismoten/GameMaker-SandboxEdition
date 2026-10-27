// The finale's gadgets as monster art: a big push button on a wall plate (and lit when
// pushed), the spark of its wire carrying the "go" to what it works, and the things buttons
// open: a door (shut, and swung open), a cabinet's door, a garage door's bottom panel, a
// windsock-style blinking light that says a door is about to close.
import type { Pixels } from '../../../kit/pixels';
import { sprite } from '../art/draw';
import { P } from '../art/pal';

const c = (n: string, k: number) => P.c(n, k);
const K: Record<string, number> = {
  o: c('ink', 0),
  O: c('ink', 1),
  m: c('metal', 1),
  M: c('metal', 3),
  W: c('metal', 4),
  r: c('red', 2),
  R: c('red', 3),
  q: c('red', 1),
  g: c('green', 1),
  G: c('green', 2),
  y: c('yellow', 2),
  Y: c('yellow', 3),
  w: c('fur', 2),
  h: c('wood', 1),
  H: c('wood', 2),
  j: c('wood', 3),
  J: c('wood', 4),
  b: c('blue', 1),
  B: c('blue', 2),
  s: c('stone', 2),
  S: c('stone', 3),
  T: c('stone', 4),
};
const S = (rows: string[], dx?: number, dy?: number) => sprite(rows, K, dx, dy);

/** The push button: a red dome on a steel plate, `lit` when pushed. */
export function button(lit: boolean): Pixels {
  const dome = lit ? 'Y' : 'R';
  const d2 = lit ? 'y' : 'r';
  return S(
    [
      '.oooooooooooo.',
      'oMMMMMMMMMMMMo',
      'oMmm.oooo.mmMo',
      'oMm.o' + dome + dome + dome + dome + 'o.mMo',
      'oMmo' + dome + 'w' + dome + dome + d2 + d2 + 'omMo',
      'oMmo' + dome + dome + d2 + d2 + d2 + 'qomMo',
      'oMmoqqqqqqomMo',
      'oMmm.oooo.mmMo',
      'oMMMMMMMMMMMMo',
      '.oooooooooooo.',
    ],
    undefined,
    5,
  );
}

/** The spark that runs along a button's wire to whatever it works. */
export function zap(k: number): Pixels {
  return S(
    k
      ? ['....Y.....', '...YwY..Y.', '..Y.Y..YwY', '.Y...Y..Y.', 'YwY...Y...', '.Y.....Y..']
      : ['.Y.....Y..', 'YwY...YwY.', '.Y.Y.Y.Y..', '....Y.....', '...YwY....', '....Y.....'],
    undefined,
    7,
  );
}

/** A plain wooden door, shut (it fills its block, so it reads as a wall). */
export function doorShut(): Pixels {
  return S([
    'ohhhhhhhhhhhhhhhhhho',
    'ohjjjjjjjjjjjjjjjjho',
    'ohjhhhhhhhhhhhhhhjho',
    'ohjhJJJJJJJJJJJJhjho',
    'ohjhJjjjjjjjjjjJhjho',
    'ohjhJjjjjjjjjjjJhjho',
    'ohjhJjjjjjjjjjjJhjho',
    'ohjhJJJJJJJJJJJJhjho',
    'ohjhhhhhhhhhhhhhhjho',
    'ohjjjjjjjjjjjjjMMjho',
    'ohjjjjjjjjjjjjMWWMho',
    'ohjhhhhhhhhhhhhMMjho',
    'ohjhJJJJJJJJJJJJhjho',
    'ohjhJjjjjjjjjjjJhjho',
    'ohjhJjjjjjjjjjjJhjho',
    'ohjhJjjjjjjjjjjJhjho',
    'ohjhJJJJJJJJJJJJhjho',
    'ohjhhhhhhhhhhhhhhjho',
    'ohjjjjjjjjjjjjjjjjho',
    'oooooooooooooooooooo',
  ]);
}

/** The same door swung open toward you: just its edge against the frame. */
export function doorOpen(): Pixels {
  return S(
    [
      'ohhho',
      'ojjho',
      'ojjho',
      'oJjho',
      'ojjho',
      'ojjho',
      'ojjho',
      'ojjho',
      'oMjho',
      'MWMho',
      'oMjho',
      'ojjho',
      'ojjho',
      'ojjho',
      'oJjho',
      'ojjho',
      'ojjho',
      'ojjho',
      'ojjho',
      'ooooo',
    ],
    0,
    0,
  );
}

/** A garage door's bottom panel: ribbed steel with a handle and a rubber seal. */
export function garagePanel(): Pixels {
  return S([
    'TTTTTTTTTTTTTTTTTTTT',
    'SSSSSSSSSSSSSSSSSSSS',
    'ssssssssssssssssssss',
    'SSSSSSSSSSSSSSSSSSSS',
    'TTTTTTTTTTTTTTTTTTTT',
    'SSSSSSSSSSSSSSSSSSSS',
    'ssssssssssssssssssss',
    'SSSSSSSSSSSSSSSSSSSS',
    'TTTTTTTTTTTTTTTTTTTT',
    'SSSSSSSSoooooSSSSSSS',
    'sssssssoMMMMMossssss',
    'SSSSSSSSoooooSSSSSSS',
    'TTTTTTTTTTTTTTTTTTTT',
    'SSSSSSSSSSSSSSSSSSSS',
    'ssssssssssssssssssss',
    'SSSSSSSSSSSSSSSSSSSS',
    'mmmmmmmmmmmmmmmmmmmm',
    'oooooooooooooooooooo',
    'oOoOoOoOoOoOoOoOoOoO',
    'oooooooooooooooooooo',
  ]);
}

/** The panel coming down (half of it showing). */
export function garagePanelHalf(): Pixels {
  return S(
    [
      'TTTTTTTTTTTTTTTTTTTT',
      'SSSSSSSSSSSSSSSSSSSS',
      'ssssssssssssssssssss',
      'SSSSSSSSoooooSSSSSSS',
      'sssssssoMMMMMossssss',
      'SSSSSSSSoooooSSSSSSS',
      'TTTTTTTTTTTTTTTTTTTT',
      'mmmmmmmmmmmmmmmmmmmm',
      'oooooooooooooooooooo',
      'oOoOoOoOoOoOoOoOoOoO',
      'oooooooooooooooooooo',
    ],
    0,
    0,
  );
}

/** A cabinet door with a little round knob. */
export function cabinetDoor(): Pixels {
  return S([
    'oooooooooooooooooo',
    'obbbbbbbbbbbbbbbbo',
    'obBBBBBBBBBBBBBBbo',
    'obBbbbbbbbbbbbBBbo',
    'obBbbbbbbbbbbbBBbo',
    'obBbbbbbbbbbbbBBbo',
    'obBbbbbbbbbbbbBBbo',
    'obBbbbbbbbbbbbBMbo',
    'obBbbbbbbbbbbbMWMo',
    'obBbbbbbbbbbbbBMbo',
    'obBbbbbbbbbbbbBBbo',
    'obBbbbbbbbbbbbBBbo',
    'obBbbbbbbbbbbbBBbo',
    'obBbbbbbbbbbbbBBbo',
    'obBBBBBBBBBBBBBBbo',
    'obbbbbbbbbbbbbbbbo',
    'oooooooooooooooooo',
  ]);
}

/** The cabinet's door swung open (its edge on the left). */
export function cabinetOpen(): Pixels {
  return S(['ooo', 'obo', 'oBo', 'oBo', 'oBo', 'oBo', 'oBo', 'oMo', 'oWo', 'oMo', 'oBo', 'oBo', 'oBo', 'oBo', 'oBo', 'obo', 'ooo'], 1);
}

/** A see-saw's end: the plank's last stretch with its red handle, standing on its top edge. */
export function seesawEnd(flip = false): Pixels {
  const rows = [
    'oooooooooooooooooooo',
    'oJJJJJJJJJJJJJJJJJJo',
    'ojjjjjjjjjjjjjjjjjjo',
    'ohhhhhhhhhhhhhhhhhho',
    'oooooooooooooooooooo',
    '....oRRo....oRRo....',
    '....oqqo....oqqo....',
    '....oqqooooooqqo....',
    '....oqqqqqqqqqqo....',
    '.....oooooooooo.....',
  ];
  return sprite(flip ? rows.map((r) => [...r].reverse().join('')) : rows, K, 0, 0);
}
