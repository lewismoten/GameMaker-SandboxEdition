// The home set (not laid out yet).
import { Pixels } from '../../../../kit/pixels';
import { SOLID } from '../../common/blocks';
import type { Group } from '../types';

export const home: Group = {
  id: 'home',
  name: 'home',
  ramps: [],
  blocks: (book, pal) => {
    book.add('homeVoid', new Pixels(20, 20, pal.c('ink', 0)), { solid: SOLID });
  },
  sprites: () => {},
  monologues: [],
};
