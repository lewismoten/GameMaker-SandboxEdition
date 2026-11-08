// The archway's brick: the same laid brick as the Starters' brick block, a shade darker and not
// solid, so the hero walks in under the arch between its pillars like walking into a doorway.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';

/** Adds block `archBrick` to `book`: brick in the background, nothing to stop the hero. */
export function addArchBrick(book: Book, pal: Pal): void {
  const b = pal.r('brick');
  const p = new Pixels(20, 20, b[0]);
  for (let row = 0; row < 4; row++) {
    for (let k = -1; k < 3; k++) {
      const x = k * 10 + (row % 2) * 5;
      for (let yy = 0; yy < 4; yy++)
        for (let xx = 0; xx < 9; xx++) {
          const px = x + xx;
          if (px < 0 || px > 19) continue;
          p.set(px, row * 5 + yy, yy === 0 ? b[3] : yy === 3 ? b[0] : xx === 0 ? b[2] : b[1]);
        }
    }
  }
  book.add('archBrick', p);
}
