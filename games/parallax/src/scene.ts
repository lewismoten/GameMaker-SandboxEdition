// PARALLAX's pictures, drawn on 20x20 cells: the still scenery (sky, lawn, path) and each
// band's layer. A layer is drawn on transparent so one picture can be slid over its back; it is
// drawn to repeat every 20 pixels, so its right edge meets its left and the ring has no seam.
//   layerOf(pal, name)     one band's moving layer (hills, town, fence, wisps, clouds)
//   backOf(pal, name)      what that band's row looks like with nothing in it
//   stillCell(pal, y)      a cell of the still scenery (rows 0-2 sky, 6-8 lawn, 9 path)
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';
import { GROUND_ROW } from './view';

export const CLEAR = 255;

export type BandName = 'hills' | 'town' | 'fence' | 'wisps' | 'clouds';

/** A smooth hump that comes round every 20 pixels. */
const wave = (x: number, mid: number, amp: number, at: number): number => mid - amp * Math.cos((2 * Math.PI * (x - at)) / 20);

/** The row of sky each cell sits in: three flat bands, lighter toward the horizon. */
const skyShade = (row: number): number => (row < 2 ? 2 : row < 3 ? 3 : 4);

/** What a band's row shows behind its moving layer. */
export function backOf(pal: Pal, name: BandName): Pixels {
  const { c } = pal;
  switch (name) {
    case 'wisps':
      return new Pixels(20, 20, c('sky', 2));
    case 'clouds':
      return new Pixels(20, 20, c('sky', 2));
    case 'hills':
      return new Pixels(20, 20, c('sky', 4));
    default:
      return new Pixels(20, 20, c('grass', 3));
  }
}

/** The moving layer of a band, on transparent. */
export function layerOf(pal: Pal, name: BandName): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, CLEAR);
  if (name === 'hills') {
    // a hazy blue hill far back and a nearer green one in front; both fill to the bottom of the cell
    for (let x = 0; x < 20; x++) {
      const back = Math.round(wave(x, 8, 4, 4));
      const front = Math.round(wave(x, 13, 3, 14));
      for (let y = back; y < 20; y++) p.set(x, y, y === back ? c('blue', 4) : c('blue', 3));
      for (let y = front; y < 20; y++) p.set(x, y, y === front ? c('grass', 4) : c('grass', 3));
    }
    return p;
  }
  if (name === 'town') {
    // a little house with a lit window and a round tree, on the lawn
    for (let y = 3; y < 8; y++) p.rect(7 - (y - 3), y, 1 + 2 * (y - 3), 1, c('brick', y === 3 ? 3 : 2));
    p.rect(3, 8, 9, 9, c('parch', 3)).rect(3, 8, 9, 1, c('parch', 2));
    p.rect(9, 2, 2, 3, c('brick', 1));
    p.rect(5, 10, 2, 2, c('gold', 4)).rect(9, 11, 2, 6, c('wood', 2));
    p.rect(16, 12, 1, 5, c('wood', 1));
    p.disc(16.5, 10, 3.2, c('green', 2)).disc(15.5, 9, 2, c('green', 3));
    return p;
  }
  if (name === 'fence') {
    // pickets at uneven gaps and one fat post, so no gap repeats inside the cell (a regular fence would seem to crawl the wrong way at this speed)
    for (const [x, w] of [
      [0, 3],
      [5, 3],
      [10, 3],
      [14, 2],
    ] as const) {
      p.rect(x, 5, w, 14, c('white', 3))
        .rect(x, 5, 1, 14, c('white', 1))
        .rect(x + w - 1, 5, 1, 14, c('white', 2));
      p.rect(x, 4, w, 1, c('ink', 1));
    }
    p.rect(17, 2, 3, 17, c('wood', 3)).rect(17, 2, 1, 17, c('wood', 4)).rect(19, 2, 1, 17, c('wood', 1));
    p.rect(0, 8, 20, 2, c('wood', 2)).rect(0, 14, 20, 2, c('wood', 2));
    return p;
  }
  if (name === 'wisps') {
    // two thin streaks of high cloud
    p.rect(2, 8, 9, 2, c('white', 2)).rect(4, 6, 5, 2, c('white', 3)).rect(13, 14, 6, 2, c('white', 2));
    return p;
  }
  // clouds: one round cloud and a smaller puff
  for (const [x, y, r] of [
    [6, 10, 4],
    [10, 8, 5],
    [14, 11, 4],
    [10, 12, 5],
  ] as const)
    p.disc(x, y, r, c('white', 2));
  for (const [x, y, r] of [
    [6, 9, 2.5],
    [10, 7, 3.5],
    [14, 10, 2.5],
  ] as const)
    p.disc(x, y, r, c('white', 3));
  p.rect(2, 14, 17, 3, c('white', 1)).rect(3, 14, 14, 1, c('white', 2));
  return p;
}

/** A still cell of the screen: sky in three flat bands, the lawn in stripes, the path on the ground row. */
export function stillCell(pal: Pal, y: number): Pixels {
  const { c } = pal;
  if (y < 3) return new Pixels(20, 20, c('sky', skyShade(y)));
  if (y === GROUND_ROW) {
    const p = new Pixels(20, 20, c('dirt', 4));
    p.rect(0, 0, 20, 3, c('grass', 3)).rect(0, 3, 20, 1, c('dirt', 3)).rect(0, 12, 20, 1, c('dirt', 3));
    return p;
  }
  // the lawn, in level stripes (a stripe looks the same moving or still)
  const p = new Pixels(20, 20, c('grass', 3));
  p.rect(0, 0, 20, 2, c('grass', 2)).rect(0, 10, 20, 2, c('grass', 2));
  return p;
}
