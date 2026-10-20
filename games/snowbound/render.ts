// Renders part of a level (blocks plus the monsters standing on it) into a picture, for
// the level cards and the box.
import type { Block } from '../../web/src/formats/blocks';
import type { GameMap } from '../../web/src/formats/map';
import type { Monster } from '../../web/src/formats/monster';
import { orientIndex } from '../../web/src/formats/blocks';
import { Pixels } from '../kit/pixels';

export function renderRegion(
  map: GameMap,
  bg: Block[],
  mbl: Block[],
  mons: Monster[],
  x0: number,
  y0: number,
  w: number,
  h: number,
  extra: { pixels: Uint8Array; x: number; y: number }[] = [],
): Pixels {
  const p = new Pixels(w * 20, h * 20);
  for (let by = 0; by < h; by++)
    for (let bx = 0; bx < w; bx++) {
      const b = bg[map.blocks[(y0 + by) * 100 + x0 + bx]];
      for (let i = 0; i < 400; i++) p.px[(by * 20 + Math.floor(i / 20)) * p.w + bx * 20 + (i % 20)] = b.pixels[i];
    }
  const sprite = (pix: Uint8Array, sx: number, sy: number, orient = 0) => {
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const c = pix[orientIndex(orient, x, y)];
        if (c !== 255) p.set(sx + x, sy + y, c);
      }
  };
  for (const pm of map.monsters) {
    if (pm.monnum >= 64) continue;
    const m = mons[pm.monnum];
    const pic = m?.pic[0][0];
    if (pic === undefined || pic >= 100) continue;
    if (pm.curx < x0 || pm.cury < y0 || pm.curx >= x0 + w || pm.cury >= y0 + h) continue;
    sprite(mbl[pic].pixels, (pm.curx - x0) * 20, (pm.cury - y0) * 20);
  }
  for (const e of extra) sprite(e.pixels, (e.x - x0) * 20, (e.y - y0) * 20);
  return p;
}
