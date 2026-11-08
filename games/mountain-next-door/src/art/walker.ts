// Old Mossback walking, as monster pictures: a four-by-three mountain cut into eight pieces (the monsters' sky is
// clear instead of blue). It reuses the mountain's own blocks (land.ts), so it always matches the backdrop; the face is
// two worried eyes and a small mouth.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../../kit/starter/palette';
import { peak, rock, slope } from './land';

/** The pieces by name. */
export const WALKER_PIECES = ['mtPeakL', 'mtPeakR', 'mtSlopeL', 'mtSlopeR', 'mtEyeL', 'mtEyeR', 'mtMouth', 'mtRock'] as const;
export type Piece = (typeof WALKER_PIECES)[number];

/** The mountain's cells, [column, row, piece], on a 4 x 3 grid. */
export const WALKER_CELLS: readonly (readonly [number, number, Piece])[] = [
  [1, 0, 'mtPeakL'],
  [2, 0, 'mtPeakR'],
  [0, 1, 'mtSlopeL'],
  [1, 1, 'mtEyeL'],
  [2, 1, 'mtEyeR'],
  [3, 1, 'mtSlopeR'],
  [0, 2, 'mtRock'],
  [1, 2, 'mtMouth'],
  [2, 2, 'mtRock'],
  [3, 2, 'mtRock'],
];

const clearSky = (pal: Pal, p: Pixels): Pixels => {
  const sky = skyOf(pal);
  return p.map((_x, _y, c) => (c === sky ? 255 : c));
};

function eye(pal: Pal, left: boolean): Pixels {
  const p = rock(pal, 3);
  const ink = pal.c('ink', 0);
  const white = pal.c('white', 3);
  p.disc(10, 11, 6, ink)
    .disc(10, 11, 5, white)
    .disc(left ? 12 : 8, 12, 2, ink)
    .set(left ? 13 : 7, 11, white);
  // a brow tipped up in the middle: worried
  for (let k = 0; k < 6; k++) p.set(left ? 4 + k : 15 - k, 5 - Math.floor(k / 2), ink);
  return clearSky(pal, p);
}

function mouth(pal: Pal): Pixels {
  const p = rock(pal, 5);
  const ink = pal.c('ink', 0);
  for (let x = 4; x < 16; x++) p.set(x, 8 + Math.round(1.5 * Math.sin((x - 4) * 1.1)), ink);
  p.set(4, 7, ink).set(15, 9, ink);
  return clearSky(pal, p);
}

/** One piece's picture. */
export function walkerPiece(pal: Pal, piece: Piece): Pixels {
  switch (piece) {
    case 'mtPeakL':
      return clearSky(pal, peak(pal, true));
    case 'mtPeakR':
      return clearSky(pal, peak(pal, false));
    case 'mtSlopeL':
      return clearSky(pal, slope(pal, true, 3));
    case 'mtSlopeR':
      return clearSky(pal, slope(pal, false, 5));
    case 'mtEyeL':
      return eye(pal, true);
    case 'mtEyeR':
      return eye(pal, false);
    case 'mtMouth':
      return mouth(pal);
    case 'mtRock':
      return clearSky(pal, rock(pal, 2));
  }
}
