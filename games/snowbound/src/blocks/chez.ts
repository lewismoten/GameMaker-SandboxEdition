// THE CHEZ, the CitiCar, parked in the LaVale Mall lot with the other buried cars (two blocks,
// rear then front, as solid as theirs): the snow on its roof and hood, drifts round its wheels.
// Added last, so no other block's number moves.
import { chezSide } from '../../../kit/chez';
import { Pixels } from '../../../kit/pixels';
import { blob } from '../art/draw';
import { Ctx, SOLID } from './book';
import type { addGround } from './ground';

export function addChez(k: Ctx, { lot }: ReturnType<typeof addGround>) {
  const { book, R, c, snow } = k;
  const p = new Pixels(40, 20);
  p.blit(lot(51), 0, 0).blit(lot(51), 20, 0);
  chezSide(p, 0, 0, {
    body: [c('coat', 1), c('coat', 2), c('coat', 3)],
    trim: c('coat', 0),
    glass: [c('ice', 1), c('ice', 3)],
    roof: c('ink', 1),
    tire: c('ink', 0),
    hub: c('snow', 3),
    rim: c('snow', 6),
    pin: c('snow', 6),
    stripe: c('ink', 1),
    bumper: c('ink', 1),
    lamp: c('glow', 3),
    tail: c('orange', 2),
    outline: c('ink', 0),
  });
  // snow on the roof and the hood, and drifted up against the wheels
  blob(p, 12.5, 1.5, 6, 1.4, snow, 3, 6);
  blob(p, 31, 10, 6, 1.4, snow, 3, 6);
  blob(p, 3, 19, 4, 1.5, snow, 3, 5);
  blob(p, 20, 19, 5, 1.5, snow, 3, 5);
  blob(p, 38, 19, 3, 1.5, snow, 3, 5);
  for (let x = 0; x < 2; x++) blob(p, 9 + x * 22, 19.5, 2.5, 1, R('ink'), 0, 1);
  book.add('chezL', p.crop(0, 0, 20, 20), { solid: SOLID });
  book.add('chezR', p.crop(20, 0, 20, 20), { solid: SOLID });
}
