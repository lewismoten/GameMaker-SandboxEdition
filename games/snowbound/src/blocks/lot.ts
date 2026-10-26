// LAVALE.BBL: LaVale Mall's own copy of SNOW.BBL (which is full), with the houses' blocks, which
// the mall never shows, given to more parked cars, so the lot's cars come in the mix of colors
// a 1992 lot had instead of one color a row. Every other level keeps SNOW.BBL as it was.
import type { Pal } from '../art/pal';
import { blockContext, SOLID, type BlockBook } from './book';
import { addGround } from './ground';
import { addThings } from './things';

/** SNOW.BBL blocks LaVale Mall never shows (the houses), whose slots the cars take, in order. */
const SPARE = ['roofL', 'roofM', 'roofR', 'eaveL', 'eaveL2', 'eaveM', 'eaveM2', 'eaveR', 'eaveR2', 'chimney', 'chimney2', 'redWin'];

/** The cars LAVALE.BBL adds (name, ramp, shade, and a two-tone's stripe): none tomato red, THE CHEZ's own. */
const MORE: [string, string, number, [string, number]?][] = [
  ['maroonCar', 'brick', 1],
  ['navyCar', 'jeans', 0],
  ['silverCar', 'gray', 3],
  ['whiteCar', 'gray', 4],
  ['blackCar', 'gray', 0],
  ['twoToneCar', 'wood', 1, ['butter', 3]],
];

/** Every color of parked car in the lot, by block name (L and R halves follow). */
export const CARS = ['blueCar', 'greenCar', 'tanCar', ...MORE.map(([n]) => n)];

/** The copy of `book` (SNOW.BBL, finished) for LaVale Mall, with the extra cars in it. */
export function lotBook(book: BlockBook, pal: Pal): BlockBook {
  const fork = book.fork();
  // the cars are drawn by SNOW.BBL's own painter, on a scratch book, and moved over
  const scratch = blockContext(pal);
  const { car } = addThings(scratch, addGround(scratch));
  const spare = [...SPARE];
  for (const [name, ramp, dark, stripe] of MORE) {
    car(name, ramp, dark, stripe);
    for (const half of ['L', 'R']) fork.swap(spare.shift()!, `${name}${half}`, scratch.book.pics.get(`${name}${half}`)!, { solid: SOLID });
  }
  return fork;
}
