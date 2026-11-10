// A small house by the path: rain splashes on its roof, the gutter runs into a downspout pipe down the wall whose
// mouth pours a short sheet of rain water into a rain barrel. Drawn whole on one canvas, then cut into blocks;
// the roof's top row and the spout's column are four-frame rings on the rain's clock (rain behind,
// splashes where drops hit the shingles), the walls are plain blocks. Nothing here is solid.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, type Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { RAIN_TICKS, rainTile, streakHeads, type Timed } from './rain';

const CLEAR = 255;
/** Five columns of house and one of spout and barrel; five rows: two of roof, three of wall. */
export const HOUSE = { cols: 6, rows: 5 } as const;
const SPOUT = { x0: 105, x1: 109, top: 68, rim: 83 };

function drawHouse(pal: Pal): Pixels {
  const p = new Pixels(120, 100, CLEAR);
  const c = pal.c.bind(pal);
  // roof: a trapezoid of shingle courses, the ridge at y 6, the eave at y 32
  for (let y = 6; y <= 32; y++) {
    const l = Math.round(14 - ((y - 6) * 14) / 26);
    const r = Math.round(85 + ((y - 6) * 14) / 26);
    const course = Math.floor((y - 6) / 5);
    for (let x = l; x <= r; x++) {
      let col = c('brick', 2);
      if ((y - 6) % 5 === 4) col = c('brick', 1);
      else if ((x + course * 5) % 10 === 0) col = c('brick', 1);
      else if ((y - 6) % 5 === 0) col = c('brick', 3);
      if (x === l || x === r) col = c('brick', 0);
      p.set(x, y, col);
    }
  }
  p.rect(14, 6, 72, 1, c('brick', 4));
  // gutter along the eave, ending in a downspout: a pipe down the wall's right edge, an elbow at the
  // bottom and an outlet mouth over the rain barrel
  p.rect(0, 33, 99, 4, c('stone', 3)).rect(0, 33, 99, 1, c('stone', 4)).rect(0, 36, 99, 1, c('stone', 1));
  const out = c('stone', 0);
  const pipe = (x: number, y: number, w: number, h: number) =>
    p
      .rect(x, y, w, h, out)
      .rect(x + 1, y + 1, w - 2, h - 2, c('white', 2))
      .rect(x + 1, y + 1, 1, h - 2, c('white', 4));
  pipe(94, 32, 7, 7);
  pipe(96, 38, 5, 28);
  for (const by of [46, 58]) p.rect(95, by, 7, 2, out);
  pipe(96, 60, 11, 7);
  p.rect(105, 66, 5, 3, out).rect(106, 66, 3, 2, c('blue', 1));
  // walls: painted boards, trims, a shadow under the gutter, a stone footing
  p.rect(1, 37, 94, 57, c('stone', 3));
  for (let y = 42; y < 94; y += 6) p.rect(1, y, 94, 1, c('stone', 2));
  p.rect(1, 37, 94, 2, c('stone', 1));
  p.rect(1, 37, 2, 57, c('stone', 4)).rect(93, 37, 2, 57, c('stone', 2));
  p.rect(0, 94, 96, 6, c('stone', 1));
  for (let x = 4; x < 96; x += 9) p.rect(x, 94, 1, 6, c('stone', 0));
  // two warm windows (one upright bar, a sill), lit from inside
  for (const wx of [22, 62]) {
    p.rect(wx, 47, 16, 18, c('white', 2));
    p.rect(wx + 2, 49, 5, 14, c('gold', 3)).rect(wx + 9, 49, 5, 14, c('gold', 3));
    // a little light caught on each pane
    for (const px of [wx + 3, wx + 10])
      p.set(px, 50, c('gold', 5))
        .set(px + 1, 51, c('gold', 4))
        .set(px, 51, c('gold', 4));
    p.rect(wx - 2, 65, 20, 2, c('white', 1));
  }
  // the rain barrel: staves, two hoops, a dark rim with water inside
  for (let y = SPOUT.rim; y < 100; y++) {
    const bulge = y > 87 && y < 96 ? 1 : 0;
    for (let x = 100 - bulge; x <= 115 + bulge; x++) p.set(x, y, (x - 100) % 4 === 0 ? c('wood', 1) : c('wood', 2));
  }
  p.rect(100, SPOUT.rim, 16, 1, c('wood', 3)).rect(101, SPOUT.rim + 1, 14, 1, c('blue', 1));
  p.rect(99, 88, 18, 2, c('stone', 1)).rect(99, 96, 18, 2, c('stone', 1));
  return p;
}

/** The falling sheet from the spout: blue water with light streaks moving down five pixels a frame. */
function pour(pal: Pal, p: Pixels, frame: number, oy: number): void {
  for (let gy = Math.max(SPOUT.top, oy); gy < Math.min(SPOUT.rim + 1, oy + 20); gy++)
    for (let x = SPOUT.x0; x <= SPOUT.x1; x++) {
      const edge = x === SPOUT.x0 || x === SPOUT.x1;
      const lane = x === 106 ? 0 : x === 108 ? 10 : 5;
      const glint = (((gy - frame * 5 - lane) % 20) + 20) % 20 < 3;
      p.set(x - 100, gy - oy, glint ? pal.c('white', 3) : edge ? pal.c('blue', 2) : pal.c('blue', 3));
    }
  // where it lands in the barrel, drops jump up on alternate frames
  if (oy + 20 > SPOUT.rim) {
    const y = SPOUT.rim - oy;
    const left = frame % 2 === 0;
    p.set(left ? 3 : 11, y - 2, pal.c('blue', 4)).set(left ? 11 : 3, y - 1, pal.c('blue', 3));
    p.set(left ? 4 : 10, y - 3, pal.c('white', 3)).set(left ? 10 : 4, y - 2, pal.c('blue', 4));
  }
}

/** One cell of the house at one rain frame: rain in the clear sky behind, splashes where drops hit the roof. */
function houseCell(pal: Pal, art: Pixels, col: number, row: number, frame: number, animated: boolean): Pixels {
  const tile = art.crop(col * 20, row * 20, 20, 20);
  const p = animated ? rainTile(pal, frame) : new Pixels(20, 20, pal.c('sky', 3));
  p.blit(tile, 0, 0, CLEAR);
  if (row === 0)
    for (const s of streakHeads(frame)) {
      let top = 0;
      while (top < 20 && tile.get(s.x, top) === CLEAR) top++;
      // a drop whose head went into the shingles this frame: a crown of spray just above them;
      // the frame after, its drops land farther out
      if (top === 0 || top >= 20 || s.y < top || s.y > top + 9) continue;
      const lo = pal.c('blue', s.near ? 3 : 2);
      const hi = pal.c('blue', s.near ? 4 : 2);
      if (s.y <= top + 4) {
        p.set(s.x - 1, top - 1, lo).set(s.x + 1, top - 1, lo);
        if (s.near) p.set(s.x - 2, top - 2, hi).set(s.x + 2, top - 2, hi);
      } else if (s.near) p.set(s.x - 3, top - 1, lo).set(s.x + 3, top - 1, lo);
    }
  if (col === 5) pour(pal, p, frame, row * 20);
  return p;
}

/**
 * Adds the house's blocks: `house.<col><row>` (plain) or `house.<col><row>.<frame>` (rings). The roof's
 * top row, and the spout's column, are rings; the middle roof cells and the walls are shared pictures.
 * Returns the block name to put at each cell (rings without their frame).
 */
export function addHouse(book: Book, pal: Pal, timed: Timed[]): string[][] {
  const art = drawHouse(pal);
  const air = { grav: PULL.down };
  const names: string[][] = [];
  // middle cells that look the same share one block
  const same = (col: number, row: number) => (row <= 1 && col >= 1 && col <= 3 ? 1 : row >= 2 && col === 3 ? 1 : col);
  for (let row = 0; row < HOUSE.rows; row++) {
    names.push([]);
    for (let col = 0; col < HOUSE.cols; col++) {
      const id = `house.${same(col, row)}${row}`;
      names[row].push(id);
      if (col === 5 && row === 0) {
        names[row][col] = 'rain';
        continue;
      }
      if (book.index.has(id) || book.index.has(`${id}.0`)) continue;
      const animated = row === 0 || col === 5;
      if (!animated) {
        book.add(id, houseCell(pal, art, col, row, 0, false), air);
        continue;
      }
      for (let f = 0; f < 4; f++) {
        book.add(`${id}.${f}`, houseCell(pal, art, col, row, f, true), air);
        timed.push({ name: `${id}.${f}`, next: `${id}.${(f + 1) % 4}`, ticks: RAIN_TICKS });
      }
    }
  }
  return names;
}
