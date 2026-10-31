// Nine small scenery blocks for the site's achievement badges (art by Claude Sonnet 5.5): a keyboard with a big
// Enter, a modem with three rising bars, a plug with a spark, a game pad, a mouse on its pad, a camcorder with two
// reels, a disk going into a drive, a CD half out of its sleeve and a tape marked SAVE. Plain scenery lying on the
// living room carpet and the kitchen's linoleum: nothing here is solid or scores or hurts. Added last, so the
// earlier blocks keep their numbers.
import { micro } from '../../../snowbound/src/art/font';
import type { Pal } from '../art/pal';
import type { BlockBook } from './blocks';

export function addBadgeBlocks(book: BlockBook, pal: Pal): void {
  const { c } = pal;
  const ink = c('ink', 0);
  const floor = (name: 'carpet2' | 'lino') => book.pics.get(name)!.crop(0, 0, 20, 20);

  // a beige keyboard on the carpet: rows of keys and a tall Enter
  {
    const p = floor('carpet2');
    p.rect(1, 4, 18, 12, c('wall', 3)).rect(1, 15, 18, 1, c('wall', 0)).rect(1, 4, 18, 1, c('white', 2)).rect(0, 5, 1, 10, c('wall', 1));
    for (const y of [6, 9, 12]) for (let x = 2; x < 13; x += 3) p.rect(x, y, 2, 2, c('white', 1)).rect(x, y + 2, 2, 1, c('wall', 1));
    p.rect(14, 6, 4, 7, c('red', 2)).rect(14, 6, 4, 1, c('red', 3)).rect(14, 12, 4, 1, c('red', 0)).rect(17, 7, 1, 5, c('red', 1)); // the oversized Enter
    p.rect(3, 14, 9, 1, c('white', 0));
    book.add('keyboard', p);
  }

  // a modem: a dark box with three bars rising on its front
  {
    const p = floor('lino');
    p.rect(2, 4, 16, 13, c('crt', 1)).rect(2, 4, 16, 3, c('crt', 3)).rect(2, 16, 16, 1, ink).rect(1, 6, 1, 10, c('crt', 0));
    p.rect(4, 8, 12, 7, ink);
    p.rect(5, 12, 2, 2, c('led', 1)).rect(9, 10, 2, 4, c('led', 1)).rect(13, 8, 2, 6, c('led', 1));
    p.rect(5, 14, 10, 1, c('led', 0));
    p.set(15, 5, c('led', 1)).set(13, 5, c('red', 3));
    book.add('modem', p);
  }

  // a chunky plug with a spark jumping off its prongs; the cord trails down
  {
    const p = floor('carpet2');
    p.rect(9, 12, 2, 8, ink).rect(10, 12, 1, 8, c('ink', 1));
    p.rect(5, 7, 10, 6, c('white', 1))
      .rect(5, 7, 10, 1, c('white', 2))
      .rect(5, 12, 10, 1, c('white', 0))
      .rect(14, 8, 1, 4, c('white', 0))
      .rect(7, 9, 6, 2, c('white', 0));
    p.rect(7, 3, 2, 4, c('silver', 2)).rect(11, 3, 2, 4, c('silver', 2)).rect(7, 3, 1, 4, c('silver', 1));
    p.disc(10, 3, 2, c('lamp', 2)).set(10, 3, c('lamp', 2));
    for (const [x0, y0, x1, y1] of [
      [10, 0, 10, 1],
      [6, 1, 7, 2],
      [14, 1, 13, 2],
      [3, 3, 5, 3],
      [16, 3, 15, 3],
    ] as const)
      p.line(x0, y0, x1, y1, c('lamp', 1));
    book.add('plug', p);
  }

  // a game pad: a chunky plus on the left, two round buttons on the right
  {
    const p = floor('carpet2');
    p.rect(2, 5, 16, 10, c('crt', 1)).rect(1, 7, 18, 6, c('crt', 1)).rect(2, 5, 16, 1, c('crt', 3)).rect(2, 14, 16, 1, ink);
    p.rect(3, 9, 6, 2, ink).rect(5, 7, 2, 6, ink).rect(5, 7, 2, 1, c('crt', 2)); // the plus
    p.disc(13, 11, 1.5, c('red', 2)).disc(16, 9, 1.5, c('yellow', 1)).set(13, 10, c('red', 3));
    p.rect(9, 10, 2, 1, c('crt', 3));
    book.add('gamepad', p);
  }

  // a square mouse pad with a beige mouse sitting on it, its cord going up
  {
    const p = floor('carpet2');
    p.rect(2, 4, 16, 13, c('blue', 1)).rect(2, 16, 16, 1, c('blue', 0)).rect(2, 4, 16, 1, c('blue', 2)).rect(17, 5, 1, 11, c('blue', 0));
    p.line(8, 9, 8, 5, c('wall', 2)).line(7, 5, 7, 2, c('wall', 2));
    p.rect(6, 9, 6, 7, c('wall', 3)).rect(6, 9, 6, 1, c('white', 2)).rect(6, 15, 6, 1, c('wall', 1)).rect(11, 10, 1, 5, c('wall', 1));
    p.rect(6, 9, 3, 3, c('wall', 2)).rect(9, 9, 3, 3, c('wall', 3)).set(8, 11, ink).set(8, 10, ink).rect(9, 12, 1, 1, c('wall', 1));
    book.add('mousepad', p);
  }

  // a camcorder on the floor: two round reels on top and a lens at the front
  {
    const p = floor('carpet2');
    p.disc(5.5, 5.5, 4, ink).disc(13.5, 5.5, 4, ink).disc(5.5, 5.5, 3, c('silver', 2)).disc(13.5, 5.5, 3, c('silver', 2));
    p.rect(5, 5, 2, 2, ink).rect(13, 5, 2, 2, ink).line(3, 3, 4, 2, c('white', 2)).line(11, 3, 12, 2, c('white', 2));
    p.rect(2, 9, 14, 8, c('crt', 1)).rect(2, 9, 14, 1, c('crt', 3)).rect(2, 16, 14, 1, ink);
    p.rect(15, 10, 4, 6, ink).rect(16, 11, 2, 4, c('blue', 1)).set(16, 11, c('white', 2));
    p.rect(4, 11, 4, 3, ink).set(11, 11, c('red', 3)).set(12, 11, c('red', 3));
    book.add('camcorder', p);
  }

  // a floppy disk sliding into a drive, a gold arrow pointing the way
  {
    const p = floor('lino');
    p.rect(9, 4, 10, 13, c('wall', 2)).rect(9, 4, 10, 1, c('wall', 3)).rect(9, 16, 10, 1, c('wall', 0)).rect(10, 8, 8, 2, ink).rect(16, 13, 2, 2, c('led', 1));
    p.rect(1, 7, 11, 10, c('blue', 1)).rect(1, 7, 11, 1, c('blue', 2)).rect(1, 16, 11, 1, c('blue', 0)).rect(7, 7, 4, 4, c('silver', 2)).rect(9, 8, 1, 2, ink);
    p.rect(2, 11, 6, 5, c('white', 2)).rect(3, 13, 4, 1, c('red', 1));
    p.rect(1, 2, 6, 2, c('gold', 1))
      .line(7, 0, 9, 2, c('gold', 1))
      .line(7, 5, 9, 3, c('gold', 1))
      .rect(7, 1, 3, 4, c('gold', 1))
      .rect(10, 2, 1, 2, c('gold', 1));
    book.add('diskDrive', p);
  }

  // a shiny disc half out of its paper sleeve
  {
    const p = floor('carpet2');
    p.disc(11, 8, 7, c('silver', 2)).disc(11, 8, 5, c('silver', 1)).disc(11, 8, 2, c('white', 2)).disc(11, 8, 1, ink);
    p.line(7, 4, 13, 3, c('white', 2)).line(15, 7, 16, 10, c('white', 2)).line(6, 6, 8, 4, c('blue', 2));
    p.rect(2, 9, 16, 9, c('wall', 3)).rect(2, 9, 16, 1, c('white', 2)).rect(2, 17, 16, 1, c('wall', 0)).rect(17, 10, 1, 7, c('wall', 1));
    p.rect(4, 13, 9, 1, c('wall', 1)).rect(4, 15, 6, 1, c('wall', 1));
    book.add('discSleeve', p);
  }

  // a tape cassette with SAVE on its label
  {
    const p = floor('carpet2');
    p.rect(1, 4, 18, 13, c('blue', 1)).rect(1, 4, 18, 1, c('blue', 3)).rect(1, 16, 18, 1, c('blue', 0)).rect(18, 5, 1, 11, c('blue', 0));
    p.rect(3, 5, 14, 6, c('white', 2));
    micro(p, 3, 6, 'SAVE', c('red', 1));
    p.rect(3, 9, 14, 1, c('red', 2));
    p.rect(4, 12, 12, 3, ink).disc(7, 13, 1, c('white', 2)).disc(13, 13, 1, c('white', 2)).rect(8, 13, 4, 1, c('copper', 1));
    book.add('saveTape', p);
  }
}
