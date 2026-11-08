// THE GIANT's tunnel ceiling: the bottom row of brick over the tunnel. Its two courses line up with
// the Starter brick above (same 9 x 4 bricks, same mortar, half a brick's offset each course): the
// top one lit from above like the wall, the next lit from below, from the open tunnel. Under them a
// soldier course (bricks stood on end, as over a real doorway) is lit from below too, brightest at
// the bottom, and ends on a lit mortar edge. Everything repeats every 5 or 10 pixels across, so
// blocks side by side show no seam.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { SOLID, type Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';

/** Adds the `ceiling` block to `book`. */
export function addCeiling(book: Book, pal: Pal): void {
  const b = pal.r('brick');
  const p = new Pixels(20, 20, pal.c('parch', 2));
  for (let row = 0; row < 2; row++) {
    for (let k = -1; k < 3; k++) {
      const x = k * 10 + (row % 2) * 5;
      for (let yy = 0; yy < 4; yy++)
        for (let xx = 0; xx < 9; xx++) {
          const px = x + xx;
          if (px < 0 || px > 19) continue;
          p.set(px, row * 5 + yy, shade(b, row, xx, yy));
        }
    }
  }
  // the soldier course: 4 x 9 bricks on end
  for (let x = 0; x < 20; x += 5)
    for (let yy = 0; yy < 9; yy++)
      for (let xx = 0; xx < 4; xx++) {
        const c = yy === 0 ? b[1] : yy === 8 ? b[5] : yy >= 6 || xx === 3 ? b[3] : b[2];
        p.set(x + xx, 10 + yy, c);
      }
  // the ceiling's bottom edge: the mortar line the tunnel's light falls on
  p.rect(0, 19, 20, 1, pal.c('parch', 3));
  book.add('ceiling', p, { solid: SOLID });
}

/** A brick pixel's shade: course 0 as the wall above (light on top), course 1 lit from below. */
function shade(b: number[], row: number, xx: number, yy: number): number {
  if (row === 0) return yy === 0 ? b[4] : yy === 3 ? b[1] : xx === 0 ? b[3] : b[2];
  if (yy === 3) return b[4];
  if (yy === 0) return b[1];
  return xx === 8 ? b[3] : b[2];
}
