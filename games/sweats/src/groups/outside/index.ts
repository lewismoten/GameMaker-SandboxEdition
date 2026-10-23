// INTO THE WILD: the last set, the monologues of venturing out (the receipt and the wind, the ants
// of the fixer-upper, the haunted house of mild scares, the umbrella's odyssey). One block set
// (OUTSIDE.BBL) and one monster block set (OUTSIDE.MBL) for all of them; the street comes first,
// then each monologue's own blocks and sprites in its turn (a block's number is the order it was
// added).
import type { Group } from '../types';
import { outside as outsideMono, outsideBlocks, outsideSprites } from './outside';
import { ants, antsBlocks, antsSprites } from './ants';
import { OUTSIDE_RAMPS, buildStreet, streetSprites } from './street';

export const outside: Group = {
  id: 'outside',
  name: 'Into the Wild',
  ramps: OUTSIDE_RAMPS,
  blocks: (book, pal) => {
    buildStreet(book, pal);
    outsideBlocks(book, pal);
    antsBlocks(book, pal);
  },
  sprites: (book, pal) => {
    streetSprites(book, pal);
    outsideSprites(book, pal);
    antsSprites(book, pal);
  },
  monologues: [outsideMono, ants],
};
