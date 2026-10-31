// Six small scenery blocks for the site's achievement badges (art by Claude Sonnet 5.5): in the house a school
// backpack with a game controller sticking out, a labeled DOS disk in its sleeve on a desk, a landscape phone with
// left and right arrows and a portrait phone with up and down arrows; in the yard a taped shipping box with little
// paper-plane wings and a boxy mail jeep with a letter in its window. They are plain scenery (no solid, score or
// touch), drawn over the wallpaper, wainscot, siding and sky, and sit last in HOUSE.BBL and YARD.BBL so no block moves.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { micro } from '../../../snowbound/src/art/font';
import type { Pal } from '../art/pal';
import { AIR, type BlockBook } from './common';

/** A filled polygon (even-odd scanlines), then its outline. */
function poly(p: Pixels, pts: [number, number][], fill: number, edge: number): void {
  for (let y = 0; y < 20; y++) {
    const xs: number[] = [];
    pts.forEach(([x0, y0], i) => {
      const [x1, y1] = pts[(i + 1) % pts.length];
      if (y0 === y1 || y < Math.min(y0, y1) || y >= Math.max(y0, y1)) return;
      xs.push(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0));
    });
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) p.rect(Math.round(xs[i]), y, Math.round(xs[i + 1]) - Math.round(xs[i]) + 1, 1, fill);
  }
  pts.forEach(([x0, y0], i) => {
    const [x1, y1] = pts[(i + 1) % pts.length];
    p.line(x0, y0, x1, y1, edge);
  });
}

/** Four blocks for the house: `paper` and `panel` make the wallpaper and the wainscot to draw on. */
export function houseBadges(book: BlockBook, pal: Pal, bg: { paper: () => Pixels; panel: () => Pixels }): void {
  const { c } = pal;
  const K = c('ink', 0);

  // a school backpack, a game controller poking out of the top
  const pack = bg.panel();
  // the controller first: a wide body with two grips, a d-pad and two buttons
  pack.rect(1, 0, 18, 8, K).rect(2, 1, 16, 5, c('white', 2)).rect(2, 1, 16, 1, c('white', 3));
  pack.rect(2, 6, 4, 2, c('white', 1)).rect(14, 6, 4, 2, c('white', 1));
  pack.rect(4, 3, 5, 1, K).rect(6, 2, 1, 3, K);
  pack.disc(13, 4, 1, c('red', 2)).disc(16, 3, 1, c('led', 0)).set(10, 3, c('gray', 1)).set(10, 4, c('gray', 1));
  // the bag: body, flap, front pocket and zip
  pack.rect(3, 8, 14, 12, K).rect(4, 9, 12, 10, c('shirt', 1)).rect(4, 9, 12, 3, c('shirt', 2)).rect(4, 12, 12, 1, K);
  pack.rect(5, 14, 10, 5, K).rect(6, 15, 8, 3, c('red', 1)).rect(6, 15, 8, 1, c('red', 2));
  pack.line(7, 16, 12, 16, c('gold', 2)).rect(9, 10, 2, 1, c('gold', 3));
  pack.rect(2, 11, 1, 6, K).rect(17, 11, 1, 6, K);
  book.add('packPad', pack, AIR);

  // a DOS disk half out of its sleeve, on the desk
  const dos = bg.paper();
  dos.rect(0, 17, 20, 3, K).rect(0, 18, 20, 2, c('wood', 3)).rect(0, 18, 20, 1, c('wood', 4));
  dos.rect(5, 1, 11, 11, K).rect(6, 2, 9, 9, c('gray', 0)).ring(10, 6, 2, c('steel', 1)).disc(10, 6, 1, K);
  dos.rect(7, 2, 5, 2, c('white', 3)).line(7, 2, 11, 2, c('white', 2));
  dos.rect(3, 8, 15, 10, K).rect(4, 9, 13, 8, c('white', 3)).rect(4, 16, 13, 1, c('gray', 3));
  dos.rect(7, 9, 7, 1, K).rect(6, 10, 9, 1, c('white', 1));
  dos.rect(4, 11, 13, 1, c('red', 2)).rect(4, 12, 13, 4, c('white', 3));
  micro(dos, 5, 12, 'DOS', c('shirt', 0));
  book.add('dosDisk', dos, AIR);

  // a phone on its side with left and right arrows
  const wide = bg.paper();
  wide.rect(0, 4, 20, 12, K).rect(1, 5, 18, 10, c('gray', 1)).rect(1, 5, 18, 1, c('gray', 2));
  wide.rect(3, 6, 14, 8, K).rect(4, 7, 12, 6, c('screen', 0));
  wide.set(2, 9, c('gray', 3)).rect(18, 9, 1, 2, c('gray', 3));
  poly(
    wide,
    [
      [4, 10],
      [7, 7],
      [7, 12],
    ],
    c('white', 3),
    c('white', 3),
  );
  poly(
    wide,
    [
      [15, 10],
      [12, 7],
      [12, 12],
    ],
    c('white', 3),
    c('white', 3),
  );
  wide.rect(9, 9, 2, 2, c('led', 0));
  book.add('phoneWide', wide, AIR);

  // a phone standing up with up and down arrows
  const tall = bg.paper();
  tall.rect(4, 0, 12, 20, K).rect(5, 1, 10, 18, c('gray', 1)).rect(5, 1, 1, 18, c('gray', 2));
  tall.rect(6, 3, 8, 12, K).rect(7, 4, 6, 10, c('screen', 0));
  tall.rect(9, 1, 2, 1, c('gray', 3)).disc(10, 17, 1, c('gray', 3));
  poly(
    tall,
    [
      [10, 4],
      [7, 7],
      [13, 7],
    ],
    c('white', 3),
    c('white', 3),
  );
  poly(
    tall,
    [
      [10, 13],
      [7, 10],
      [13, 10],
    ],
    c('white', 3),
    c('white', 3),
  );
  book.add('phoneTall', tall, AIR);
}

/** Two blocks for the yard: `sky` is the open air both stand in. */
export function yardBadges(book: BlockBook, pal: Pal, bg: { sky: () => Pixels }): void {
  const { c } = pal;
  const K = c('ink', 0);

  // a taped shipping box with little paper-plane wings
  const box = bg.sky();
  poly(
    box,
    [
      [0, 3],
      [8, 9],
      [8, 13],
      [3, 9],
    ],
    c('white', 3),
    K,
  );
  poly(
    box,
    [
      [19, 3],
      [11, 9],
      [11, 13],
      [16, 9],
    ],
    c('white', 3),
    K,
  );
  box.line(1, 4, 7, 9, c('gray', 3)).line(18, 4, 12, 9, c('gray', 3));
  box.rect(2, 11, 16, 8, K).rect(3, 12, 14, 6, c('wood', 3)).rect(3, 12, 14, 1, c('wood', 4));
  box.rect(2, 11, 16, 2, K).rect(3, 12, 14, 1, c('ochre', 1)).rect(9, 11, 3, 8, K).rect(10, 11, 1, 8, c('sand', 2));
  box.rect(4, 15, 3, 2, c('white', 3)).line(4, 16, 6, 16, c('gray', 2)).rect(3, 17, 14, 1, c('wood', 1));
  book.add('parcelWings', box, AIR);

  // a boxy mail jeep at the curb, a letter in the window
  const jeep = bg.sky();
  jeep.rect(0, 17, 20, 3, c('gray', 2)).rect(0, 17, 20, 1, c('gray', 3));
  jeep.rect(1, 5, 18, 11, K).rect(2, 6, 16, 8, c('white', 3)).rect(2, 6, 16, 1, c('white', 3));
  jeep.rect(1, 4, 14, 2, K).rect(2, 5, 12, 1, c('white', 2));
  jeep.rect(2, 12, 16, 3, c('shirt', 2)).rect(2, 14, 16, 1, c('shirt', 1));
  jeep.rect(3, 6, 11, 5, K).rect(4, 7, 9, 3, c('screen', 3));
  jeep.rect(5, 7, 6, 3, K).rect(6, 8, 4, 1, c('white', 3)).rect(6, 8, 4, 2, c('white', 3)).line(6, 8, 8, 9, c('red', 1)).line(10, 8, 8, 9, c('red', 1));
  jeep.rect(15, 6, 3, 4, K).rect(16, 7, 1, 2, c('screen', 2)).rect(18, 12, 2, 3, c('gold', 2));
  jeep.disc(5, 16, 3, K).disc(5, 16, 1, c('steel', 2)).disc(15, 16, 3, K).disc(15, 16, 1, c('steel', 2));
  jeep.rect(0, 14, 2, 2, c('steel', 1));
  book.add('mailJeep', jeep, AIR);
}
