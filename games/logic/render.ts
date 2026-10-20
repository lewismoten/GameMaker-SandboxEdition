// Draws a board the way PLAYGAME shows it (blocks, then the placed parts, then Watt on
// his pad): for previews, the title cards and the screens.
import { orientIndex } from '../../web/src/formats/blocks';
import { MLEN } from '../../web/src/formats/map';
import { Pixels } from '../kit/pixels';
import { CLEAR } from './draw';
import { COLS, OX, OY, ROWS, type Board } from './board';
import type { BlockSet } from './sets';

export function sprite20(src: Pixels, orient: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.px[y * 20 + x] = src.px[orientIndex(orient, x, y)];
  return p;
}

/** The board's 16x10 blocks with its parts; `watt` draws Watt on the pad. */
export function renderBoard(b: Board, tiles: BlockSet, mb: BlockSet, watt?: Pixels, cols = COLS, rows = ROWS): Pixels {
  const p = new Pixels(cols * 20, rows * 20);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) p.blit(tiles.pics[b.map.blocks[(OY + y) * MLEN + OX + x]], x * 20, y * 20);
  const mons = b.mons.build();
  for (const m of b.map.monsters) {
    if (m.monnum >= 64) continue;
    const mon = mons[m.monnum];
    const pic = mb.pics[mon.pic[0][0]];
    if (!pic) continue;
    p.blit(sprite20(pic, mon.march[0][0].orient), (m.curx - OX) * 20, (m.cury - OY) * 20, CLEAR);
  }
  if (watt) p.blit(watt, 8 * 20, 5 * 20, CLEAR);
  return p;
}
