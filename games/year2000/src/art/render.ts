// Renders part of a map (blocks plus the monsters standing on it) into a picture, for the
// level cards, the screens and checking the maps.
import type { Block } from '../../../../web/src/formats/blocks';
import type { GameMap } from '../../../../web/src/formats/map';
import type { Monster } from '../../../../web/src/formats/monster';
import { Pixels } from '../../../kit/pixels';

export function renderMap(map: GameMap, bg: Block[], x0: number, y0: number, w: number, h: number, mbl?: Block[], mons?: Monster[]): Pixels {
  const p = new Pixels(w * 20, h * 20);
  for (let by = 0; by < h; by++)
    for (let bx = 0; bx < w; bx++) {
      const b = bg[map.blocks[((y0 + by) % 100) * 100 + ((x0 + bx) % 100)]];
      for (let i = 0; i < 400; i++) p.px[(by * 20 + Math.floor(i / 20)) * p.w + bx * 20 + (i % 20)] = b.pixels[i];
    }
  if (mbl && mons)
    for (const pm of map.monsters) {
      if (pm.monnum >= 64) continue;
      const pic = mons[pm.monnum]?.pic[0][0];
      if (pic === undefined || pic >= 100) continue;
      if (pm.curx < x0 || pm.cury < y0 || pm.curx >= x0 + w || pm.cury >= y0 + h) continue;
      const px = mbl[pic].pixels;
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) {
          const c = px[y * 20 + x];
          if (c !== 255) p.set((pm.curx - x0) * 20 + x, (pm.cury - y0) * 20 + y, c);
        }
    }
  return p;
}
