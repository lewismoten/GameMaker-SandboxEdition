// Four small scenery blocks for the site's achievement badges (art by Claude Sonnet 5.5): a gold goblet and a
// silver two-handled cup with a 3 (both on the fridge's glass shelves), a magazine rolled and tied with a ribbon
// (on the kitchen counter), and a clock dial whose hands glow green (on the bedroom wall). They are plain
// scenery (no solid, score or touch) and sit after every earlier block, so no block moves.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { micro } from '../../../snowbound/src/art/font';
import type { Pal } from '../art/pal';
import type { BlockBook } from './blocks';

/** The backdrops the scenery sits on (the same blocks the rooms use). */
export interface Backdrops {
  /** The fridge's cold inside. */
  cold: Pixels;
  /** The kitchen's tiled backsplash. */
  tiles: Pixels;
  /** The bedroom's wallpaper. */
  wall: Pixels;
}

export function addBadgeBlocks(book: BlockBook, c: Pal['c'], bg: Backdrops): void {
  const K = c('ink', 0);
  const air = { grav: 4 };
  const on = (back: Pixels, draw: (p: Pixels) => void): Pixels => {
    const p = back.crop(0, 0, 20, 20);
    draw(p);
    return p;
  };
  /** A cup's outline-first silhouette: half widths per row, centred between x 9 and 10. */
  const bowl = (p: Pixels, y0: number, hw: number[], fill: (x: number, y: number, x0: number, x1: number) => number): void => {
    hw.forEach((h, i) => p.rect(9 - h - 1, y0 + i, h * 2 + 4, 1, K));
    p.rect(9 - hw[0] - 1, y0 - 1, hw[0] * 2 + 4, 1, K).rect(9 - hw[hw.length - 1], y0 + hw.length, hw[hw.length - 1] * 2 + 2, 1, K);
    hw.forEach((h, i) => {
      for (let x = 10 - h - 1; x <= 9 + h; x++) p.set(x, y0 + i, fill(x, y0 + i, 10 - h - 1, 9 + h));
    });
  };

  // the gold goblet: a tall bowl on a stem and a square foot
  book.add(
    'trophyGold',
    on(bg.cold, (p) => {
      bowl(p, 3, [5, 5, 5, 5, 5, 5, 4, 3, 2], (x, y, x0, x1) =>
        y === 3 ? c('gold', 3) : x <= x0 + 1 ? c('gold', 3) : x >= x1 - 1 ? c('gold', 0) : c('gold', 2),
      );
      p.rect(8, 12, 4, 4, K).rect(9, 12, 2, 4, c('gold', 1));
      p.rect(4, 16, 12, 4, K).rect(5, 17, 10, 2, c('gold', 2)).rect(5, 17, 10, 1, c('gold', 3)).rect(14, 18, 1, 1, c('gold', 0));
      p.set(7, 6, c('white', 2)).set(7, 7, c('white', 2));
    }),
    air,
  );

  // the silver cup: a wide bowl with a handle each side and a 3 on it
  book.add(
    'trophySilver',
    on(bg.cold, (p) => {
      p.ring(3, 8, 3, K).ring(3, 8, 2, c('metal', 2)).ring(16, 8, 3, K).ring(16, 8, 2, c('metal', 2));
      bowl(p, 4, [6, 6, 6, 6, 6, 5, 4, 2], (x, y, x0, x1) =>
        y === 4 ? c('metal', 3) : x <= x0 + 1 ? c('metal', 3) : x >= x1 - 1 ? c('metal', 1) : c('metal', 2),
      );
      micro(p, 8, 6, '3', K);
      p.rect(8, 13, 4, 3, K).rect(9, 13, 2, 3, c('metal', 1));
      p.rect(5, 16, 10, 4, K).rect(6, 17, 8, 2, c('metal', 2)).rect(6, 17, 8, 1, c('metal', 3)).rect(13, 18, 1, 1, c('metal', 1));
    }),
    air,
  );

  // a magazine rolled up, tied with a ribbon bow
  book.add(
    'magRoll',
    on(bg.tiles, (p) => {
      p.rect(2, 10, 17, 10, K).rect(3, 11, 15, 8, c('berry', 2)).rect(3, 11, 15, 1, c('berry', 3)).rect(3, 18, 15, 1, c('berry', 0));
      p.rect(9, 13, 3, 3, c('cream', 3)).rect(9, 13, 3, 1, c('cream', 1));
      p.disc(4, 15, 4, K).disc(4, 15, 3, c('cream', 3)).ring(4, 15, 2, c('cream', 1)).set(4, 15, c('cream', 0));
      p.rect(14, 10, 4, 10, K).rect(15, 10, 2, 10, c('cheese', 2)).rect(15, 10, 1, 10, c('cheese', 3));
      p.rect(8, 4, 6, 6, K).rect(9, 5, 4, 4, c('cheese', 2)).rect(17, 4, 3, 6, K).rect(17, 5, 2, 4, c('cheese', 2));
      p.rect(13, 7, 4, 4, K).rect(14, 8, 2, 2, c('cheese', 3));
    }),
    air,
  );

  // a clock dial whose hands and hour dots glow green in the dark
  book.add(
    'lumeDial',
    on(bg.wall, (p) => {
      p.disc(10, 10, 9, K).disc(10, 10, 8, c('metal', 1)).disc(10, 10, 7, c('ink', 0));
      for (let h = 0; h < 12; h++) {
        const a = (h * Math.PI) / 6;
        const big = h % 3 === 0;
        p.set(Math.round(10 + Math.sin(a) * 6), Math.round(10 - Math.cos(a) * 6), big ? c('green', 4) : c('green', 2));
      }
      p.line(10, 10, 7, 6, c('green', 3)).line(10, 10, 14, 4, c('green', 4));
      p.disc(10, 10, 1, c('green', 4));
    }),
    air,
  );
}
