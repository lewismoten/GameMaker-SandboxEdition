// Level 6's background blocks, the Klown Klub's hall at noon (where the first adventure's Big
// Show was planned): striped wallpaper and show posters, the plank floor, shelves of costume
// boxes stacked up the wall, the prop cabinet, the high loft under the rafters, Juggles
// practicing up on a shelf, and the back door.
import { Pixels } from '../../../kit/pixels';
import { speckle } from '../art/draw';
import { Tiles } from './level';
import { boxFace, c, copy, r, windowOn } from '../blocks/tiles';
import { floorboards, sign, wallpaper, wideSign } from './common';
import { art } from './parts';
import { juggler } from '../sprites/folks';
import { leoOn } from '../sprites/leo';

export const G = 40;

export function balloonTiles(): Tiles {
  const t = new Tiles();
  const paper = wallpaper('red', 'stripes', 5);
  t.air('paper', paper);
  const paperHi = wallpaper('purple', 'stars', 6, 'yellow');
  t.air('paperHi', paperHi);
  t.wall('floor', floorboards(7));
  t.wall(
    'wall',
    (() => {
      const p = new Pixels(20, 20);
      speckle(p, 0, 0, 20, 20, r('brick'), 1, 2, 9, 0.2);
      for (let y = 4; y < 20; y += 5) p.rect(0, y, 20, 1, c('brick', 0));
      return p;
    })(),
  );
  t.wall(
    'rafter',
    (() => {
      const p = new Pixels(20, 20, c('wood', 1));
      speckle(p, 0, 0, 20, 14, r('wood'), 1, 2, 11, 0.2);
      p.rect(0, 14, 20, 6, c('wood', 0)).rect(0, 14, 20, 1, c('wood', 3));
      return p;
    })(),
  );
  // shelves (stand on them, hop up through them) and costume boxes on them
  const shelf = (base: Pixels) => {
    const p = copy(base);
    p.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 4, 20, 1, c('wood', 0));
    p.rect(3, 5, 2, 6, c('metal', 1)).rect(15, 5, 2, 6, c('metal', 1));
    return p;
  };
  t.ledge('shelf', shelf(paper));
  t.ledge('shelfHi', shelf(paperHi));
  t.ledge(
    'loft',
    (() => {
      const p = new Pixels(20, 20, c('wood', 2));
      speckle(p, 0, 0, 20, 6, r('wood'), 3, 1, 33, 0.2);
      p.rect(0, 0, 20, 1, c('wood', 4)).rect(0, 6, 20, 1, c('wood', 0));
      for (let x = 0; x < 20; x += 5) p.rect(x, 7, 1, 13, c('wood', 1));
      return p;
    })(),
  );
  t.wall(
    'cabinet',
    (() => {
      const p = boxFace('purple', 2, 21);
      p.rect(9, 2, 2, 16, c('purple', 0)).set(7, 10, c('gold', 2)).set(12, 10, c('gold', 2));
      return p;
    })(),
  );
  t.air('box', boxFace('hay', 2, 23, false));
  t.air('boxPink', boxFace('pink', 2, 25, false));
  // a show poster: the Klown Klub's Big Show, with a corgi on it
  art(
    t,
    'poster',
    2,
    2,
    () => paper,
    (p) => {
      p.rect(3, 3, 34, 34, c('paint', 3)).frame(3, 3, 34, 34, c('ink', 0));
      p.rect(5, 5, 30, 8, c('red', 2));
      for (let k = 0; k < 6; k++) p.rect(8 + k * 4, 7, 2, 4, c('paint', 3));
      p.disc(20, 26, 7, c('corgi', 3)).disc(17, 24, 1, c('ink', 0)).disc(23, 24, 1, c('ink', 0));
      p.rect(13, 18, 3, 4, c('corgi', 2)).rect(25, 19, 3, 3, c('corgi', 2));
    },
  );
  // Juggles, practicing pins up on his shelf (two pictures taking turns)
  for (const ph of [0, 1]) {
    const [a, b] = leoOn(juggler(ph), paperHi, paperHi);
    t.air(`juggles${ph}Top`, a, { next: `juggles${1 - ph}Top`, ntime: 7 });
    t.air(`juggles${ph}Bot`, b, { next: `juggles${1 - ph}Bot`, ntime: 7 });
  }
  // the pins in the air over his head (he tosses one across the shaft now and then)
  t.air(
    'pinsUp',
    (() => {
      const p = copy(paperHi);
      for (const [x, y] of [
        [4, 6],
        [10, 2],
        [15, 8],
      ])
        p.rect(x, y, 2, 5, c('paint', 3)).set(x, y + 2, c('red', 2));
      return p;
    })(),
  );
  // windows, bunting under the rafters, and a mirror and costume rack on the floor
  t.air('window', windowOn(paper, false, 'yellow'));
  t.air('windowHi', windowOn(paperHi, false, 'red'));
  t.air(
    'bunting',
    (() => {
      const p = copy(paperHi);
      p.rect(0, 1, 20, 1, c('ink', 1));
      for (let k = 0; k < 4; k++)
        for (let y = 0; y < 6; y++) p.rect(k * 5 + Math.floor(y / 2), 2 + y, 5 - Math.floor(y / 2) * 2, 1, c(['red', 'yellow', 'blue', 'green'][k], 2));
      return p;
    })(),
  );
  art(
    t,
    'rack',
    2,
    2,
    () => paper,
    (p) => {
      p.rect(2, 4, 36, 2, c('metal', 2)).rect(3, 6, 2, 34, c('metal', 1)).rect(35, 6, 2, 34, c('metal', 1));
      for (const [x, col] of [
        [7, 'blue'],
        [14, 'green'],
        [21, 'pink'],
        [28, 'yellow'],
      ] as const)
        p.rect(x, 6, 6, 20, c(col, 2)).rect(x + 2, 6, 2, 3, c('ink', 0));
    },
  );
  art(
    t,
    'mirror',
    1,
    2,
    () => paper,
    (p) => {
      p.rect(2, 2, 16, 34, c('wood', 3)).rect(4, 4, 12, 30, c('sky', 6)).line(6, 30, 13, 8, c('paint', 3));
      for (let k = 0; k < 6; k++) p.disc(3 + (k % 2) * 14, 6 + k * 5, 1, c('glow', 3));
    },
  );
  // the back door
  art(
    t,
    'door',
    1,
    2,
    () => paper,
    (p) => {
      p.rect(1, 2, 18, 38, c('wood', 2)).frame(1, 2, 18, 38, c('ink', 0));
      p.rect(4, 6, 12, 12, c('wood', 3)).rect(4, 22, 12, 14, c('wood', 3)).set(15, 24, c('gold', 3));
    },
  );
  t.clue('balloons', 'balloons', 'paperHi');
  // signs
  const [squawkL, squawkR] = wideSign(paper, 'PIGEONS?\nSPACE');
  t.air('signSquawkL', squawkL);
  t.air('signSquawkR', squawkR);
  const [balL, balR] = wideSign(paper, 'BALLOON\nDOG: 1');
  t.air('signBalloonL', balL);
  t.air('signBalloonR', balR);
  const [pinsL, pinsR] = wideSign(paperHi, 'PINS POP\nBALLOONS!');
  t.air('signPinsL', pinsL);
  t.air('signPinsR', pinsR);
  t.air('signDown', sign(paperHi, 'DOWN', 'down'));
  return t;
}
