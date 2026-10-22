// Draws a window of an area's map (blocks, then monsters in their first frame) the way
// PLAYGAME shows it: for previews, title cards and screens.
import { MLEN } from '../../../../web/src/formats/map';
import { Pixels } from '../../../kit/pixels';
import { CLEAR } from './draw';
import type { Area } from '../levels/area';

export function renderWindow(a: Area, ox: number, oy: number, w = 16, h = 10, joe?: { pic: Pixels; x: number; y: number }): Pixels {
  const p = new Pixels(w * 20, h * 20);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const b = a.map.blocks[(oy + y) * MLEN + ox + x];
      const pic = a.tiles.pics[b];
      if (pic) p.blit(pic, x * 20, y * 20);
    }
  for (const m of a.map.monsters) {
    if (m.monnum >= 64) continue;
    const x = m.curx - ox;
    const y = m.cury - oy;
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const def = a.mons.defs[m.monnum];
    p.blit(a.mb.pic(def.pics[0][0]), x * 20, y * 20, CLEAR);
  }
  if (joe) p.blit(joe.pic, (joe.x - ox) * 20, (joe.y - oy) * 20, CLEAR);
  return p;
}
