// The bakery's walls, dressed: a band of teal tiles under a wooden chair rail along both
// floors, and up above, shelves of loaves, a clock, framed cakes, copper pans, a menu
// chalkboard, cake boxes, flour on a shelf and round windows. All scenery (air): none of it
// is in Teddy's way.
import { Pixels } from '../../../kit/pixels';
import type { Tiles } from './level';
import type { LevelMap } from './levelmap';
import { c, copy } from '../blocks/tiles';
import { micro } from '../art/draw';

/** Adds the decor's blocks, drawn over the wall's `tiles` picture. */
export function decorTiles(t: Tiles, tiles: Pixels): void {
  // a band of teal tiles under a wooden chair rail, at waist height on both floors
  const band = copy(tiles);
  band.rect(0, 12, 20, 8, c('teal', 2)).rect(0, 16, 20, 1, c('teal', 1));
  for (const [y, x0] of [
    [12, 2],
    [16, 6],
  ])
    for (let x = x0; x < 20; x += 8) band.rect(x, y, 1, 4, c('teal', 1));
  band.rect(0, 9, 20, 3, c('wood', 3)).rect(0, 11, 20, 1, c('wood', 1));
  t.air('band', band);

  // a shelf of loaves
  const shelf = copy(tiles);
  for (const x of [1, 10]) {
    shelf
      .rect(x, 8, 9, 5, c('wood', 3))
      .rect(x + 1, 7, 7, 1, c('wood', 3))
      .rect(x, 12, 9, 1, c('wood', 1));
    for (let k = 0; k < 3; k++) shelf.set(x + 2 + k * 2, 8, c('wood', 1));
  }
  shelf.rect(0, 13, 20, 2, c('wood', 2)).rect(0, 15, 20, 1, c('wood', 0)).rect(3, 15, 2, 3, c('wood', 1)).rect(15, 15, 2, 3, c('wood', 1));
  t.air('shelfBread', shelf);

  // the clock
  const clock = copy(tiles);
  clock.disc(10, 10, 8, c('wood', 1)).disc(10, 10, 7, c('paint', 3));
  for (const [x, y] of [
    [10, 4],
    [16, 10],
    [10, 16],
    [4, 10],
  ])
    clock.set(x, y, c('ink', 0));
  clock.rect(10, 6, 1, 5, c('ink', 0)).rect(10, 10, 4, 1, c('ink', 0));
  t.air('clock', clock);

  // a framed picture of a three-layer cake
  const cake = copy(tiles);
  cake.rect(2, 2, 16, 16, c('gold', 1)).rect(3, 3, 14, 14, c('paint', 3));
  cake.rect(5, 12, 10, 3, c('pink', 2)).rect(6, 9, 8, 3, c('frost', 2)).rect(7, 6, 6, 3, c('pink', 3));
  cake.rect(5, 15, 10, 1, c('stone', 2)).rect(9, 4, 2, 2, c('red', 2));
  t.air('cakePic', cake);

  // copper pans hanging from a rail
  const pans = copy(tiles);
  pans.rect(0, 1, 20, 1, c('metal', 1));
  for (const [x, r] of [
    [5, 4],
    [14, 3],
  ] as const) {
    pans
      .rect(x, 2, 1, 4, c('metal', 2))
      .disc(x, 6 + r, r, c('orange', 1))
      .disc(x, 6 + r, r - 1, c('orange', 2));
    pans.set(x - 1, 5 + r, c('orange', 3));
  }
  t.air('pans', pans);

  // the menu chalkboard, two blocks wide
  const board = new Pixels(40, 20);
  board.blit(tiles, 0, 0).blit(tiles, 20, 0);
  board.rect(1, 2, 38, 15, c('wood', 1)).rect(2, 3, 36, 13, c('green', 0));
  micro(board, 5, 5, 'RYE BUNS', c('paint', 3));
  micro(board, 5, 11, 'ROLLS', c('pink', 3));
  t.air('menuL', board.crop(0, 0, 20, 20));
  t.air('menuR', board.crop(20, 0, 20, 20));

  // cake boxes tied with string, and flour on a shelf
  const boxes = copy(tiles);
  boxes.rect(2, 8, 16, 12, c('frost', 2)).rect(2, 8, 16, 1, c('frost', 1)).rect(9, 8, 2, 12, c('pink', 2));
  boxes.rect(4, 2, 12, 6, c('frost', 2)).rect(9, 2, 2, 6, c('pink', 2)).rect(4, 7, 12, 1, c('frost', 1));
  t.air('cakeBoxes', boxes);
  const flour = copy(tiles);
  for (const x of [2, 11])
    flour
      .rect(x, 5, 7, 9, c('paint', 2))
      .rect(x + 1, 4, 5, 1, c('paint', 2))
      .rect(x + 2, 8, 3, 2, c('stone', 2));
  flour.rect(0, 14, 20, 2, c('wood', 2)).rect(0, 16, 20, 1, c('wood', 0));
  t.air('flourShelf', flour);

  // a round window onto the noon sky
  const win = copy(tiles);
  win.disc(10, 10, 8, c('wood', 1)).disc(10, 10, 6, c('sky', 5));
  win.rect(4, 10, 13, 1, c('wood', 1)).rect(10, 4, 1, 13, c('wood', 1));
  t.air('roundWindow', win);
}

/** Puts the decor on the bakery's walls (the band only where the wall shows). */
export function decorate(m: LevelMap, x0: number, x1: number, shopFloor: number, loftFloor: number): void {
  for (let x = x0; x <= x1; x++) for (const y of [shopFloor - 2, loftFloor - 2]) if (m.get(x, y) === 'tiles') m.set(x, y, 'band');
  const put: [number, number, string][] = [
    // the shop
    [20, 35, 'clock'],
    [23, 35, 'shelfBread'],
    [24, 35, 'shelfBread'],
    [25, 35, 'shelfBread'],
    [28, 35, 'cakePic'],
    [32, 35, 'menuL'],
    [33, 35, 'menuR'],
    [44, 34, 'pans'],
    [45, 34, 'pans'],
    [49, 35, 'cakePic'],
    [59, 35, 'shelfBread'],
    [60, 35, 'shelfBread'],
    [61, 35, 'shelfBread'],
    [65, 35, 'clock'],
    [74, 35, 'cakePic'],
    // the packing loft
    [18, 29, 'roundWindow'],
    [26, 30, 'cakeBoxes'],
    [27, 30, 'cakeBoxes'],
    [33, 29, 'cakePic'],
    [40, 29, 'roundWindow'],
    [48, 29, 'flourShelf'],
    [49, 29, 'flourShelf'],
    [57, 29, 'cakePic'],
    [62, 29, 'roundWindow'],
    [66, 28, 'pans'],
    [67, 28, 'pans'],
  ];
  for (const [x, y, name] of put) if (m.get(x, y) === 'tiles') m.set(x, y, name);
}
