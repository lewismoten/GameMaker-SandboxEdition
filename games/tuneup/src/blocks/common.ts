// What every level's block set shares: a fresh book and palette helpers, the block kinds
// (solid, a ledge to stand on, which way the air pulls), a counted door that opens for enough,
// and the five base sets the levels draw on (sets.ts). A level's .BBL is its base set's blocks
// in the same slots, then the level's own: one look, recolored by each scene's .PAL.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { BlockBook, SOLID } from '../../../snowbound/src/blocks/book';
import type { Pal } from '../art/palette';

export { BlockBook, SOLID };
/** Solid on top only: stand on it, hop up through it. */
export const LEDGE = 1;
export const GRAV = { none: 0, up: 1, right: 2, down: 4, left: 8 } as const;
/** Open air: everything falls. */
export const AIR = { grav: GRAV.down } as const;
/** A wire or a ladder: nothing pulls, so Up climbs and Down climbs down. */
export const CLIMB = { grav: GRAV.none } as const;

export interface Kit {
  book: BlockBook;
  pal: Pal;
  c: Pal['c'];
  R: Pal['r'];
  /** A fresh 20x20 picture filled with `fill`. */
  P: (fill?: number) => Pixels;
  /** A copy of a block's picture already in the book. */
  pic: (name: string) => Pixels;
}

export function kit(pal: Pal): Kit {
  const book = new BlockBook();
  const pic = (name: string) => {
    const p = book.pics.get(name);
    if (!p) throw new Error(`No block ${name}`);
    return new Pixels(20, 20).blit(p, 0, 0);
  };
  return { book, pal, c: pal.c, R: pal.r, P: (fill = 0) => new Pixels(20, 20, fill), pic };
}

/**
 * A counted door: `name` is shut and solid, and opens (into `name.open`, over `back`) for a
 * touch only when counter `ctr` holds `need` (a touch that would leave it empty is refused).
 * `badge` draws what it waits for on the shut door.
 */
export function countedDoor(k: Kit, name: string, back: string, ctr: number, need: number, badge: (p: Pixels) => void, openBadge?: (p: Pixels) => void): void {
  const { c } = k;
  const shut = k.pic(back);
  shut.rect(2, 0, 16, 20, c('mach', 3)).frame(2, 0, 16, 20, c('mach', 0));
  for (let y = 3; y < 20; y += 5) shut.rect(4, y, 12, 1, c('mach', 2));
  badge(shut);
  const open = k.pic(back);
  open.rect(2, 0, 2, 20, c('mach', 2)).rect(16, 0, 2, 20, c('mach', 2));
  openBadge?.(open);
  k.book.add(name, shut, { solid: SOLID, effect: ctr, eamt: -need, touch: `${name}.open` });
  k.book.add(`${name}.open`, open, AIR);
  // the door's top half (Doc Leo is two blocks tall): its frame and a lamp; never in the way
  const top = k.pic(back);
  top.rect(2, 4, 16, 16, c('mach', 3)).frame(2, 4, 16, 16, c('mach', 0)).rect(2, 2, 16, 2, c('mach', 1));
  top.rect(8, 8, 4, 4, c('lamp', 3)).frame(8, 8, 4, 4, c('mach', 0));
  k.book.add(`${name}.top`, top, AIR);
}
