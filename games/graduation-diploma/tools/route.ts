// The bot's way through the long aisle: along the carpet past the four signs to the lectern, where the diploma is the door out.
import { walkAisle } from '../../kit/starter/graduationTools';
import { LECTERN } from '../src/levels';

export const aisle = walkAisle(
  [
    [8, 'the first sign'],
    [26, 'under the helpers'],
    [44, 'the cheering sign'],
    [62, 'the last sign'],
    [LECTERN - 2, 'the steps of the stage'],
  ],
  LECTERN,
);
