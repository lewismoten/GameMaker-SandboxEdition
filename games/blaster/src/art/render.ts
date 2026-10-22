// Drawing a region of a map with its blocks and monsters (for the level cards, the box
// screenshots and previews).
import { CLEAR as TRANSPARENT } from './draw';
import type { Block } from '../../../../web/src/formats/blocks';
import { LASTMON, type Monster } from '../../../../web/src/formats/monster';
import { MLEN, MWID, type GameMap } from '../../../../web/src/formats/map';
import { Pixels } from '../../../kit/pixels';

export function renderRegion(map: GameMap, bbl: Block[], mbl: Block[], mon: Monster[], x0: number, y0: number, w: number, h: number): Pixels {
  const p = new Pixels(w * 20, h * 20);
  for (let r = 0; r < h; r++)
    for (let c = 0; c < w; c++) {
      const b = bbl[map.blocks[((y0 + r + MWID) % MWID) * MLEN + ((x0 + c + MLEN) % MLEN)]];
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(c * 20 + x, r * 20 + y, b.pixels[y * 20 + x]);
    }
  for (const m of map.monsters) {
    if (m.monnum >= LASTMON) continue;
    const c = m.curx - x0;
    const r = m.cury - y0;
    if (c < 0 || r < 0 || c >= w || r >= h) continue;
    const pic = mon[m.monnum]?.pic[0][0];
    if (pic === undefined || pic >= 100) continue;
    const px = mbl[pic].pixels;
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (px[y * 20 + x] !== TRANSPARENT) p.set(c * 20 + x, r * 20 + y, px[y * 20 + x]);
  }
  return p;
}
