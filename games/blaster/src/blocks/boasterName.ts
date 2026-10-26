// SOUND BOASTER, silkscreened in white across the Sound Boaster's board, as big as the board
// allows (TURBO BUTTON's ad: readable from across the room). Two words on two lines, each
// letter two blocks wide and two tall, so the picture is 14 x 5 blocks: SOUND, a row of
// bare board, BOASTER. Both lines sit on the same 20-pixel grid, so the S and the O of
// SOUND are the same blocks as in BOASTER.
import { Pixels } from '../../../kit/pixels';
import { micro, type BlockSet } from '../art/draw';
import { onFloor, type StageArt } from './tiles';
import { slicesShared } from './boaster3';

/**
 * A bold 5 x 7 capital: '#' a full cell; 'a' 'b' 'c' 'd' a cell rounded at its outer
 * top-left, top-right, bottom-left and bottom-right corner.
 */
const GLYPHS: Record<string, string[]> = {
  S: ['a###b', '#....', '#....', 'c###b', '....#', '....#', 'c###d'],
  O: ['a###b', '#...#', '#...#', '#...#', '#...#', '#...#', 'c###d'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', 'c###d'],
  N: ['#...#', '##..#', '##..#', '#.#.#', '#..##', '#..##', '#...#'],
  D: ['####b', '#...#', '#...#', '#...#', '#...#', '#...#', '####d'],
  B: ['####b', '#...#', '#...#', '####.', '#...#', '#...#', '####d'],
  A: ['a###b', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  R: ['####b', '#...#', '#...#', '####d', '#.#..', '#..#.', '#...#'],
};

/** One cell of a glyph is UW x UH pixels: a letter is 35 x 35. */
const UW = 7;
const UH = 5;

function letter(p: Pixels, x: number, y: number, ch: string, ink: number, shadow: number): void {
  const g = GLYPHS[ch];
  if (!g) throw new Error(`No glyph ${ch}`);
  for (const [dx, dy, c] of [
    [1, 1, shadow],
    [0, 0, ink],
  ])
    g.forEach((row, r) =>
      [...row].forEach((k, col) => {
        if (k === '.') return;
        const x0 = x + dx + col * UW;
        const y0 = y + dy + r * UH;
        for (let yy = 0; yy < UH; yy++)
          for (let xx = 0; xx < UW; xx++) {
            // a rounded corner: inside the quarter ellipse whose middle is the cell's inner corner
            const fx = k === 'a' || k === 'c' ? (UW - 0.5 - xx) / UW : k === 'b' || k === 'd' ? (xx + 0.5) / UW : 0;
            const fy = k === 'a' || k === 'b' ? (UH - 0.5 - yy) / UH : k === 'c' || k === 'd' ? (yy + 0.5) / UH : 0;
            if (fx * fx + fy * fy > 1) continue;
            p.set(x0 + xx, y0 + yy, c);
          }
      }),
    );
}

/** The name on bare board, 14 x 5 blocks. */
function namePicture(a: StageArt): Pixels {
  const p = a.pal;
  const big = onFloor(a, 14, 5);
  const ink = p.c('gray', 7);
  const shadow = p.c('base', 0);
  const line = (word: string, y: number) => {
    const x0 = (14 - word.length * 2) * 10;
    [...word].forEach((ch, i) => letter(big, x0 + i * 40 + 3, y, ch, ink, shadow));
  };
  line('SOUND', 2);
  line('BOASTER', 62);
  return big;
}

/** Adds the name's blocks; returns their names by [row][column], row 0 (SOUND's top) first. */
export function nameTiles(bs: BlockSet, a: StageArt): string[][] {
  return slicesShared(bs, 'nm', namePicture(a));
}

/** The fine print under the name, as in the ad (6 x 1 blocks). */
export function finePrint(bs: BlockSet, a: StageArt): string[] {
  const big = onFloor(a, 6, 1);
  const s = 'OVERCREATIVE LABS - REV. A';
  micro(big, Math.round(60 - s.length * 2), 7, s, a.pal.c('gray', 6));
  return slicesShared(bs, 'fp', big)[0];
}
