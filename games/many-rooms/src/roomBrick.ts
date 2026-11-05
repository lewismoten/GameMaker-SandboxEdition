// The four room colors: a laid brick like the Starters' brick block, in the red, blue, green or gold ramp, solid.
// A room's ceiling and side walls are its color, so you can tell the rooms of one map apart at a glance.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { SOLID, type Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';

/** The room colors, by the ramp that paints them. */
export const ROOM_COLORS = ['red', 'blue', 'green', 'gold'] as const;
export type RoomColor = (typeof ROOM_COLORS)[number];

/** The name of a color's brick block. */
export const wallOf = (color: RoomColor): string => `wall.${color}`;

/** Adds the four colored bricks to `book`. */
export function addRoomBricks(book: Book, pal: Pal): void {
  for (const color of ROOM_COLORS) {
    const b = pal.r(color);
    const mortar = pal.c('parch', 2);
    const p = new Pixels(20, 20, mortar);
    for (let row = 0; row < 4; row++) {
      for (let k = -1; k < 3; k++) {
        const x = k * 10 + (row % 2) * 5;
        for (let yy = 0; yy < 4; yy++)
          for (let xx = 0; xx < 9; xx++) {
            const px = x + xx;
            if (px < 0 || px > 19) continue;
            p.set(px, row * 5 + yy, yy === 0 ? b[4] : yy === 3 ? b[1] : xx === 0 ? b[3] : b[2]);
          }
      }
    }
    book.add(wallOf(color), p, { solid: SOLID });
  }
}
