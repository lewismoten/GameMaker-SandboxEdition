// Night critters (monster block art, facing right): a raccoon in a bandit mask, a skunk and
// the cloud it leaves, an owl swooping, fireflies; and things in Gwinn's way: a rope knot,
// a pile of cardboard boxes, a lump of hard clay.
import { Pixels } from '../../../kit/pixels';
import { blob, sprite } from '../art/draw';
import { P } from '../art/pal';

const c = (n: string, k: number) => P.c(n, k);
const K: Record<string, number> = {
  o: c('ink', 0),
  O: c('ink', 1),
  g: c('stone', 1),
  G: c('stone', 2),
  h: c('stone', 3),
  w: c('fur', 2),
  W: c('paint', 3),
  // the skunk's stripe stays moon-white at night (glow is not darkened by the night light)
  Z: c('glow', 3),
  k: c('ink', 0),
  p: c('pink', 2),
  y: c('yellow', 3),
  Y: c('glow', 3),
  b: c('wood', 1),
  B: c('wood', 3),
  n: c('wood', 4),
  e: c('green', 1),
  E: c('green', 2),
  r: c('hay', 2),
  R: c('hay', 3),
  q: c('hay', 1),
  d: c('dirt', 2),
  D: c('dirt', 3),
  l: c('brick', 1),
  L: c('brick', 2),
};
const S = (rows: string[], dx?: number, dy?: number) => sprite(rows, K, dx, dy);

export const NIGHT: Record<string, Pixels> = {
  raccoon1: S([
    '..........oo.oo.....',
    '.........oGGoGGo....',
    '.........oGGGGGGo...',
    '........okkwGGwkko..',
    '.o.o....okokGGokkGo.',
    'oGhGo...oGGGGGGGGok.',
    'ohGhGo...oGGwwwGo...',
    '.oGhGooooGGGGGGo....',
    '..ohGGGGGGGGGGGo....',
    '..oGGGGGGGGGGGGo....',
    '...oGGGGGGGGGGo.....',
    '...ogo..ogo.ogo.....',
    '...ogo..ogo..ogo....',
  ]),
  raccoon2: S([
    '..........oo.oo.....',
    '.........oGGoGGo....',
    '.........oGGGGGGo...',
    '........okkwGGwkko..',
    'o.o.....okokGGokkGo.',
    'GhGo....oGGGGGGGGok.',
    'hGhGo....oGGwwwGo...',
    'oGhGGoooooGGGGGo....',
    '.ohGGGGGGGGGGGGo....',
    '..oGGGGGGGGGGGGo....',
    '...oGGGGGGGGGGo.....',
    '..ogo...ogo..ogo....',
    '..ogo....ogo.ogo....',
  ]),
  raccoonRun: S([
    '.........oo.oo......',
    '........oGGoGGo.....',
    '.o.o...okkwGGwkko...',
    'oGhGooooGGGGGGGGok..',
    '.ohGGGGGGGGGGGGo....',
    '..oGGGGGGGGGGGo.....',
    '.ogo...........ogo..',
    'ogo.............ogo.',
  ]),
  skunk1: S([
    '..ooo...............',
    '.oZZZo..............',
    'oOZZZOo.............',
    'oOOZZOOo............',
    '.oOOZZOOo....oo.oo..',
    '..oOOZZOOo..oOOoOOo.',
    '...oOOZZOOooOOZZOOOo',
    '....oOOOOOOOOOZZOOko',
    '....oOOOOOOOOOOOOOo.',
    '.....oOOOOOOOOOOOo..',
    '.....oko..oko.oko...',
  ]),
  skunk2: S([
    '.ooo................',
    'oZZZo...............',
    'OZZZOo..............',
    'oOZZOOo.............',
    '.oOOZZOo.....oo.oo..',
    '..oOOZZOo...oOOoOOo.',
    '...oOOZZOOooOOZZOOOo',
    '....oOOOOOOOOOZZOOko',
    '....oOOOOOOOOOOOOOo.',
    '.....oOOOOOOOOOOOo..',
    '....oko..oko..oko...',
  ]),
  owl1: S(
    [
      '....hhhhhhh.....',
      '...hbbBBBbbh....',
      '..hbYoBoYobh....',
      '..hbbbyybbbh....',
      '.hbbBbbbbBbbh...',
      'hbBbbBbbbBbbbh..',
      '.hhhhbbbbbhhhh..',
      '.....hyhyh......',
    ],
    undefined,
    1,
  ),
  owl2: S(
    ['hh.........hh...', 'hbh..hhh..hbh...', '.hbbhbBBhbbh....', '..hbbYyYbbh.....', '...hbbbbbh......', '....hbbbh.......', '.....hyh........'],
    undefined,
    1,
  ),
  firefly1: S(['..Y..', '.YyY.', '..Y..'], 8, 9),
  firefly2: S(['.....', '..y..', '.....'], 8, 9),
  boxes: S([
    '....oooooooooooo....',
    '....oBBBBBBBBBBo....',
    '....oBBBnnBBBBBo....',
    '....oooooooooooo....',
    '.oooooooo.oooooooo..',
    '.oBBBBBBo.oBBBBBBo..',
    '.oBBnnBBo.oBBBnBBo..',
    '.oBBBBBBo.oBBBBBBo..',
    '.oooooooo.oooooooo..',
    'oooooooooooooooooooo',
    'oBBBBBBBBoBBBBBBBBBo',
    'oBBnBBBBBoBBBBnnBBBo',
    'oBBBBBBBBoBBBBBBBBBo',
    'oBBBBBBBBoBBBBBBBBBo',
    'oooooooooooooooooooo',
  ]),
  boxesDown: S(['..........oooooo....', 'oooooooo..oBBBBo....', 'oBBBBBBoooooooooooo.', 'oBBnBBBBBoBBBBBBBBBo', 'oooooooooooooooooooo']),
  rope: S(['qqqqqqqqqqqqqqqqqqqq', 'rRrRrRrRrRrRrRrRrRrR', 'qqqqqqqqqqqqqqqqqqqq'], 0, 8),
  ropeKnot: (() => {
    const p = S(['qqqqqqqqqqqqqqqqqqqq', 'rRrRrRrRrRrRrRrRrRrR', 'qqqqqqqqqqqqqqqqqqqq'], 0, 8);
    blob(p, 10, 9, 4, 4, [c('hay', 1), c('hay', 2), c('hay', 3)], 0, 2);
    p.line(8, 12, 6, 18, c('hay', 1)).line(12, 12, 14, 18, c('hay', 1));
    return p;
  })(),
  ropeChewed: S(['qqqqqq........qqqqqq', 'rRrRr..........RrRrR', 'qqqq............qqqq', '.....r.......q......', '......q.....r.......'], 0, 8),
  clay: (() => {
    const p = new Pixels(20, 20, 255);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) p.set(x, y, (x * 7 + y * 13) % 5 === 0 ? c('brick', 0) : (x + y * 3) % 7 === 0 ? c('brick', 2) : c('brick', 1));
    p.rect(0, 0, 20, 2, c('grass', 1));
    return p;
  })(),
  stink1: (() => {
    const p = new Pixels(20, 20, 255);
    for (const [x, y, r] of [
      [6, 12, 5],
      [13, 10, 5],
      [10, 6, 4],
    ])
      blob(p, x, y, r, r, [c('green', 0), c('green', 1)], 0, 1, 0.4);
    return p;
  })(),
  stink2: (() => {
    const p = new Pixels(20, 20, 255);
    for (const [x, y, r] of [
      [5, 10, 4],
      [14, 12, 5],
      [9, 5, 4],
    ])
      blob(p, x, y, r, r, [c('green', 0), c('green', 1)], 0, 1, 0.4);
    return p;
  })(),
};
