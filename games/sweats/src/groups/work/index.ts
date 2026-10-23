// NINE TO FIVE: the first set, the monologues of the day job. One block set (WORK.BBL) and one
// monster block set (WORK.MBL) for all of them; each monologue adds its own blocks and sprites
// in its turn (the order is part of the file format: a block's number is the order it was added).
import type { Group } from '../types';
import { cgoat, cgoatBlocks, cgoatSprites } from './cgoat';
import { meeting, meetingBlocks, meetingSprites } from './meeting';
import { WORK_RAMPS, buildOffice } from './office';

export const work: Group = {
  id: 'work',
  name: 'Nine to Five',
  ramps: WORK_RAMPS,
  blocks: (book, pal) => {
    buildOffice(book, pal);
    meetingBlocks(book, pal);
    cgoatBlocks(book, pal);
  },
  sprites: (book, pal) => {
    meetingSprites(book, pal);
    cgoatSprites(book, pal);
  },
  monologues: [meeting, cgoat],
};
