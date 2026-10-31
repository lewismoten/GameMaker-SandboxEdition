// Four small scenery blocks for the site's achievement badges (art by Claude Sonnet 5.5), in the tailor's shop: a brass
// compass over a winding route, a folded map with a marked route, a ruler and a triangle, and a pair of glasses over
// three color swatches. Plain scenery (no solid, score or touch) drawn over the lamplit paneling, last in TAILOR.BBL.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../art/pal';
import type { BlockBook } from './common';

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

/** Four blocks: `panel` makes the paneling to draw on. */
export function tailorBadges(book: BlockBook, pal: Pal, panel: () => Pixels, air: { grav: number }): void {
  const { c } = pal;
  const K = c('ink', 0);

  // a brass compass on the table, a winding route under it
  const compass = panel();
  const route: [number, number][] = [
    [0, 17],
    [3, 15],
    [6, 17],
    [9, 16],
    [12, 17],
    [15, 15],
    [19, 16],
  ];
  for (let i = 0; i + 1 < route.length; i++)
    compass
      .line(route[i][0], route[i][1], route[i + 1][0], route[i + 1][1], c('wood', 2))
      .line(route[i][0], route[i][1] + 1, route[i + 1][0], route[i + 1][1] + 1, c('wood', 2));
  compass.rect(17, 14, 3, 1, c('red', 2)).rect(18, 13, 1, 3, c('red', 2));
  compass.disc(10, 8, 8, K).disc(10, 8, 7, c('gold', 2)).disc(10, 8, 5.5, K).disc(10, 8, 4.5, c('white', 2));
  compass.rect(9, 0, 2, 2, c('gold', 3)).rect(9, 15, 2, 1, c('gold', 3)).rect(2, 7, 2, 2, c('gold', 3)).rect(16, 7, 2, 2, c('gold', 3));
  poly(
    compass,
    [
      [10, 3],
      [12, 8],
      [8, 8],
    ],
    c('red', 2),
    K,
  );
  poly(
    compass,
    [
      [10, 13],
      [12, 8],
      [8, 8],
    ],
    c('blue', 2),
    K,
  );
  compass.disc(10, 8, 1, c('gold', 4));
  book.add('compass', compass, air);

  // a folded map, its route marked with an X
  const fold = panel();
  poly(
    fold,
    [
      [1, 3],
      [7, 2],
      [13, 3],
      [19, 2],
      [19, 17],
      [13, 18],
      [7, 17],
      [1, 18],
    ],
    c('cloth', 3),
    K,
  );
  fold.rect(2, 4, 5, 13, c('cloth', 2)).rect(13, 4, 6, 13, c('cloth', 2));
  fold.line(7, 3, 7, 17, c('cloth', 0)).line(13, 4, 13, 17, c('cloth', 0));
  const trail: [number, number][] = [
    [3, 15],
    [6, 11],
    [10, 13],
    [11, 8],
    [15, 9],
    [16, 5],
  ];
  for (let i = 0; i + 1 < trail.length; i++) fold.line(trail[i][0], trail[i][1], trail[i + 1][0], trail[i + 1][1], c('red', 2));
  fold.disc(3, 15, 1, c('blue', 1)).line(15, 4, 17, 6, c('red', 1)).line(17, 4, 15, 6, c('red', 1));
  fold.rect(9, 5, 2, 2, c('leaf', 2));
  book.add('foldMap', fold, air);

  // a ruler and a triangle
  const tools = panel();
  poly(
    tools,
    [
      [2, 1],
      [2, 12],
      [13, 12],
    ],
    c('steel', 3),
    K,
  );
  poly(
    tools,
    [
      [4, 6],
      [4, 10],
      [8, 10],
    ],
    c('steel', 1),
    K,
  );
  tools.rect(1, 13, 18, 6, K).rect(2, 14, 16, 4, c('wood', 4)).rect(2, 14, 16, 1, c('wood', 4));
  for (let x = 3; x < 18; x += 2) tools.rect(x, 14, 1, x % 4 === 3 ? 3 : 2, K);
  book.add('rulerTriangle', tools, air);

  // glasses over three color swatches
  const seen = panel();
  seen.rect(1, 11, 5, 8, K).rect(2, 12, 3, 6, c('red', 2));
  seen.rect(7, 11, 6, 8, K).rect(8, 12, 4, 6, c('blue', 2));
  seen.rect(14, 11, 5, 8, K).rect(15, 12, 3, 6, c('gold', 3));
  seen.disc(5, 5, 5, K).disc(5, 5, 4, c('water', 3)).disc(15, 5, 5, K).disc(15, 5, 4, c('water', 3));
  seen.rect(9, 4, 2, 2, K).line(1, 3, 0, 1, K).line(19, 3, 19, 1, K);
  seen.line(3, 3, 5, 2, c('white', 2)).set(3, 4, c('white', 2)).line(13, 3, 15, 2, c('white', 2)).set(13, 4, c('white', 2));
  book.add('seenGlasses', seen, air);
}
