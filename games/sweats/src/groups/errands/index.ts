// OUT AND ABOUT: the second set, the monologues of errands and evenings out (the grocery
// store's self-checkout, the parking lot's cart return, the restaurant's plates, the banquet).
// One block set (ERRANDS.BBL) and one monster block set (ERRANDS.MBL) for all of them; each
// monologue adds its own blocks and sprites in its turn (a block's number is the order it was
// added).
import type { Group } from '../types';
import { ERRANDS_RAMPS, poofSprites } from './art';
import { cashier, cashierBlocks, cashierSprites } from './cashier';
import { checkout, checkoutBlocks, checkoutSprites } from './checkout';
import { diningBlocks } from './dining';
import { plates, platesBlocks, platesSprites } from './plates';

export const errands: Group = {
  id: 'errands',
  name: 'Out and About',
  ramps: ERRANDS_RAMPS,
  blocks: (book, pal) => {
    checkoutBlocks(book, pal);
    cashierBlocks(book, pal);
    diningBlocks(book, pal);
    platesBlocks(book, pal);
  },
  sprites: (book, pal) => {
    poofSprites(book, pal);
    checkoutSprites(book, pal);
    cashierSprites(book, pal);
    platesSprites(book, pal);
  },
  monologues: [checkout, cashier, plates],
};
