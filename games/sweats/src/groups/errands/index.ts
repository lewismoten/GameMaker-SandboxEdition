// The errands set (not laid out yet).
import { Pixels } from '../../../../kit/pixels';
import { SOLID } from '../../common/blocks';
import type { Group } from '../types';

export const errands: Group = {
  id: 'errands',
  name: 'errands',
  ramps: [],
  blocks: (book, pal) => {
    book.add('errandsVoid', new Pixels(20, 20, pal.c('ink', 0)), { solid: SOLID });
  },
  sprites: () => {},
  monologues: [],
};
