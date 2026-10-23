// The dining room the restaurant and the banquet hall share: burgundy damask wallpaper, a wood
// wainscot along the walking row, a parquet floor, the crown molding, tables in white cloths
// (their tops are ledges), chairs, a sconce, a still life, a window; and the speech bubbles the
// rooms murmur in.
import { Pixels, rng } from '../../../../kit/pixels';
import { shadeAt } from '../../../../snowbound/src/art/draw';
import { micro, microWidth } from '../../../../snowbound/src/art/font';
import type { Pal } from '../../art/pal';
import { AIR, BlockBook, GRAV, LEDGE, SOLID, loot, spotlight } from '../../common/blocks';
import { outline, type SpriteBook } from '../../common/sprites';
import { clear, over } from './art';

/** The damask wallpaper. */
export function wallpaper(pal: Pal): Pixels {
  const c = pal.c;
  const p = new Pixels(20, 20);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const dx = Math.abs(((x + 10) % 20) - 10);
      const dy = Math.abs(((y + 10) % 20) - 10);
      const motif = dx + dy === 5 || (dx + dy < 3 && (x + y) % 2 === 0);
      p.set(x, y, motif ? c('wallpaper', 2) : x % 10 === 0 ? c('wallpaper', 0) : c('wallpaper', 1));
    }
  return p;
}

export function diningBlocks(book: BlockBook, pal: Pal): void {
  const { c, r: R } = pal;
  const ink = c('ink', 0);
  const wall = () => wallpaper(pal);
  book.add('wallpaper', wall(), AIR);
  // the walking row: the wainscot under a chair rail
  const wainscot = wall();
  wainscot.rect(0, 7, 20, 2, c('wood', 4)).rect(0, 9, 20, 1, c('wood', 1)).rect(0, 10, 20, 10, c('wood', 2));
  wainscot.frame(2, 12, 16, 7, c('wood', 1)).rect(3, 13, 14, 1, c('wood', 3));
  book.add('wainscot', wainscot, AIR);
  // the parquet floor, and under it
  const parquet = new Pixels(20, 20);
  const r = rng(91);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) parquet.set(x, y, (Math.floor(x / 5) + Math.floor(y / 5)) % 2 ? c('wood', r() < 0.2 ? 2 : 3) : c('wood', r() < 0.2 ? 3 : 2));
  parquet.rect(0, 0, 20, 1, c('wood', 4));
  book.add('parquet', parquet, { solid: SOLID });
  const under = new Pixels(20, 20);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) under.set(x, y, shadeAt(R('wood'), 0, 1, 0.6 - y / 40, x, y));
  book.add('cellar', under, { solid: SOLID });
  // the ceiling and its crown molding
  const crown = new Pixels(20, 20);
  crown.rect(0, 0, 20, 12, c('wallpaper', 0)).rect(0, 12, 20, 3, c('white', 1)).rect(0, 15, 20, 2, c('white', 0)).rect(0, 17, 20, 3, c('white', 1));
  for (let x = 1; x < 20; x += 4) crown.rect(x, 17, 2, 2, c('white', 2));
  book.add('crown', crown, { solid: SOLID });
  // the tables in their white cloths: the top a ledge, the cloth hanging; under, the legs
  const table = (end: 'l' | 'm' | 'r') => {
    const p = wall();
    p.rect(0, 0, 20, 3, c('white', 2)).rect(0, 3, 20, 13, c('white', 1));
    for (let x = 2; x < 20; x += 5) p.rect(x, 4, 1, 12, c('white', 0));
    p.rect(0, 15, 20, 1, c('white', 0));
    if (end === 'l') p.rect(0, 0, 2, 20, c('wallpaper', 1)).rect(1, 0, 1, 16, c('white', 0));
    if (end === 'r') p.rect(18, 0, 2, 20, c('wallpaper', 1)).rect(18, 0, 1, 16, c('white', 0));
    p.rect(end === 'l' ? 4 : 0, 16, end === 'm' ? 20 : 16, 4, c('wallpaper', 0));
    return p;
  };
  book.add('tableL', table('l'), { solid: LEDGE, grav: GRAV.down });
  book.add('tableM', table('m'), { solid: LEDGE, grav: GRAV.down });
  book.add('tableR', table('r'), { solid: LEDGE, grav: GRAV.down });
  const legs = wainscot.crop(0, 0, 20, 20);
  legs
    .rect(0, 0, 20, 4, c('wallpaper', 0))
    .rect(3, 0, 3, 20, c('wood', 1))
    .rect(14, 0, 3, 20, c('wood', 1))
    .rect(4, 0, 1, 20, c('wood', 3))
    .rect(15, 0, 1, 20, c('wood', 3));
  book.add('tableLegs', legs, AIR);
  // a chair pulled out
  const chair = over(wainscot, pal, (p) => {
    p.rect(4, 2, 3, 17, c('wood', 2)).rect(4, 10, 12, 3, c('wood', 3)).rect(14, 13, 2, 6, c('wood', 2)).rect(5, 13, 2, 6, c('wood', 2));
    p.rect(4, 2, 3, 2, c('wood', 4)).rect(5, 5, 1, 4, c('wallpaper', 0));
    p.rect(6, 9, 9, 2, c('wallpaper', 3));
  });
  book.add('chair', chair, AIR);
  // a sconce, a still life of a fruit bowl, a window onto the night (or the dusk)
  const sconce = over(wall(), pal, (p) => {
    p.rect(8, 10, 4, 6, c('gold', 1)).rect(7, 15, 6, 2, c('gold', 2));
    p.rect(6, 4, 8, 6, c('spot', 1)).rect(7, 3, 6, 1, c('spot', 2)).rect(8, 5, 4, 3, c('spot', 2));
  });
  for (const [x, y] of [
    [3, 2],
    [16, 3],
    [2, 17],
    [17, 16],
  ])
    sconce.set(x, y, c('spot', 0));
  book.add('sconce', sconce, AIR);
  const art = over(wall(), pal, (p) => {
    p.rect(2, 3, 16, 14, c('gold', 1)).rect(4, 5, 12, 10, c('teal', 0));
    p.rect(6, 11, 8, 3, c('wood', 3)).disc(8, 10, 2, c('red', 2)).disc(12, 10, 2, c('yellow', 2)).disc(10, 8, 2, c('green', 2)).set(7, 9, c('red', 3));
  });
  book.add('stillLife', art, AIR);
  const window = wall();
  window.rect(2, 1, 16, 18, c('wood', 1));
  for (let y = 3; y < 17; y++) for (let x = 4; x < 16; x++) window.set(x, y, shadeAt(R('sky'), 0, 3, (y - 3) / 14, x, y));
  window.rect(9, 3, 2, 14, c('wood', 1)).rect(4, 9, 12, 2, c('wood', 1)).set(6, 5, c('white', 2)).set(13, 6, c('white', 1));
  window.rect(1, 17, 18, 2, c('white', 1));
  book.add('nightWindow', window, AIR);
  // a pendant lamp hanging from the ceiling on its chain
  const pendant = over(wall(), pal, (p) => {
    p.rect(9, 0, 2, 8, c('gold', 0));
    for (let y = 0; y < 6; y++) p.rect(10 - 3 - y, 8 + y, 6 + y * 2, 1, c('wallpaper', 3));
    p.rect(4, 14, 12, 1, c('gold', 2)).rect(7, 15, 6, 2, c('spot', 1));
  });
  for (const [x, y] of [
    [3, 18],
    [10, 19],
    [16, 18],
  ])
    pendant.set(x, y, c('spot', 0));
  book.add('pendant', pendant, AIR);
  void ink;
  for (const bg of ['wainscot', 'wallpaper']) loot(book, pal, bg);
  spotlight(book, pal, 'wainscot');
}

/** A speech bubble with a word in it (a whisper, a chuckle, a speech, a cough), bobbing a pixel. */
export function bubble(pal: Pal, word: string, f: number, o: { fill?: string; text?: string; tail?: 'left' | 'right' } = {}): Pixels {
  const c = pal.c;
  const p = clear();
  const y = 4 + f;
  const w = Math.max(10, microWidth(word) + 4);
  const x = 10 - Math.floor(w / 2);
  p.rect(x, y, w, 9, c(o.fill ?? 'white', 2)).rect(x + 1, y - 1, w - 2, 11, c(o.fill ?? 'white', 2));
  const tx = o.tail === 'left' ? x + 2 : x + w - 4;
  p.set(tx, y + 10, c(o.fill ?? 'white', 2)).set(tx + (o.tail === 'left' ? -1 : 1), y + 11, c(o.fill ?? 'white', 2));
  micro(p, x + 2, y + 2, word, c(o.text ?? 'ink', 0));
  return outline(p, c('ink', 0));
}

/** Adds a bubble's two frames to a sprite book. */
export function addBubble(book: SpriteBook, pal: Pal, name: string, word: string, attrs: object, o: Parameters<typeof bubble>[3] = {}): void {
  book.add(`${name}0`, bubble(pal, word, 0, o), attrs);
  book.add(`${name}1`, bubble(pal, word, 1, o), attrs);
}
