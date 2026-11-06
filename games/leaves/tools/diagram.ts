// A path drawn as a small picture for the manual and the shots: a grid of blocks (8 pixels each), the monster's path
// as a line from corner to corner, a dot on each corner, the start in a ring and the ground as a strip of grass.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { March } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import type { Pal } from '../../kit/starter/palette';

const CELL = 8;

/** Paths (each with its color), drawn `left` blocks right of the picture's left edge, falling `rows` blocks onto the grass. */
export function pathDiagram(pal: Pal, paths: { march: March[]; color: number; from?: number }[], cols: number, rows: number, left = 1): Pixels {
  const p = new Pixels(cols * CELL + 1, (rows + 1) * CELL + 4, pal.c('sky', 3));
  for (let x = 0; x <= cols; x++) p.rect(x * CELL, 0, 1, (rows + 1) * CELL, pal.c('sky', 4));
  for (let y = 0; y <= rows + 1; y++) p.rect(0, y * CELL, cols * CELL + 1, 1, pal.c('sky', 4));
  p.rect(0, (rows + 1) * CELL, cols * CELL + 1, 4, pal.c('grass', 3));
  const at = (bx: number, by: number): [number, number] => [(bx + 0.5) * CELL, (by + 0.5) * CELL];
  for (const { march, color, from = left } of paths) {
    let [x, y] = at(from, 0);
    p.ring(x, y, 2.2, pal.c('ink', 0));
    for (const c of march.filter((m) => m.pic > 0)) {
      const [nx, ny] = at(from + c.x, c.y);
      p.line(Math.round(x), Math.round(y), Math.round(nx), Math.round(ny), color);
      x = nx;
      y = ny;
      p.rect(Math.round(x) - 1, Math.round(y) - 1, 2, 2, pal.c('ink', 0));
    }
  }
  return p;
}
