// The outside set (not laid out yet).
import { Pixels } from '../../../../kit/pixels';
import { SOLID } from '../../common/blocks';
import type { Group } from '../types';

export const outside: Group = {
  id: 'outside',
  name: 'outside',
  ramps: [],
  blocks: (book, pal) => {
    book.add('outsideVoid', new Pixels(20, 20, pal.c('ink', 0)), { solid: SOLID });
  },
  sprites: () => {},
  monologues: [],
};
