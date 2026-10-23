// Scenery bigger than a block: a picture drawn whole, then cut into 20x20 blocks named
// `<name>.<col>.<row>`, so a sign or a machine reads as one thing on the map.
import { Pixels } from '../../../kit/pixels';
import type { BlockBook } from './blocks';
import type { MapBuilder } from '../levels/maps';

/**
 * Cuts `pic` (w x h blocks) into blocks over the backdrop `bg` (its own pixels show wherever
 * the picture has `clear`). `attrs(col, row)` gives each block's attributes.
 */
export function addPicture(
  book: BlockBook,
  name: string,
  pic: Pixels,
  bg: Pixels | ((col: number, row: number) => Pixels),
  attrs: (col: number, row: number) => object,
  clear = 255,
): void {
  const cols = Math.ceil(pic.w / 20);
  const rows = Math.ceil(pic.h / 20);
  for (let r = 0; r < rows; r++)
    for (let col = 0; col < cols; col++) {
      const back = typeof bg === 'function' ? bg(col, r) : bg;
      const p = back.crop(0, 0, 20, 20);
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) {
          const v = pic.get(col * 20 + x, r * 20 + y);
          if (v >= 0 && v !== clear) p.set(x, y, v);
        }
      book.add(`${name}.${col}.${r}`, p, attrs(col, r));
    }
}

/** Places a cut picture's blocks with its top-left at (x, y). */
export function placePicture(m: MapBuilder, name: string, x: number, y: number, cols: number, rows: number): void {
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) m.set(x + c, y + r, `${name}.${c}.${r}`);
}
