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

  // a little wind-up robot turning the crank of a film projector
  const robot = panel();
  robot.rect(8, 10, 10, 7, K).rect(9, 11, 8, 5, c('gray', 3)).rect(9, 11, 8, 1, c('gray', 4)).rect(18, 12, 2, 4, K).rect(18, 13, 1, 2, c('water', 3));
  robot.disc(11, 6, 3.4, K).disc(11, 6, 2.4, c('steel', 2)).disc(11, 6, 0.8, K).disc(16, 6, 3.4, K).disc(16, 6, 2.4, c('steel', 2)).disc(16, 6, 0.8, K);
  robot.rect(10, 16, 2, 2, K).rect(15, 16, 2, 2, K);
  robot
    .rect(1, 3, 6, 5, K)
    .rect(2, 4, 4, 3, c('steel', 3))
    .rect(2, 5, 1, 1, c('seed', 1))
    .rect(5, 5, 1, 1, c('seed', 1))
    .line(4, 3, 4, 2, K)
    .rect(3, 0, 3, 2, c('red', 2));
  robot.rect(1, 9, 6, 7, K).rect(2, 10, 4, 5, c('gray', 3)).rect(3, 11, 2, 2, c('red', 2));
  robot.rect(1, 16, 2, 3, K).rect(5, 16, 2, 3, K).rect(0, 18, 3, 1, K).rect(4, 18, 3, 1, K);
  robot.line(7, 12, 9, 13, K).line(7, 13, 9, 14, K).ring(9, 14, 2, c('seed', 2)).set(9, 12, c('seed', 2));
  book.add('robotCrank', robot, air);

  // a ringing rotary phone with a short itemized bill slip beside it
  const bill = panel();
  bill.rect(0, 12, 13, 7, K).rect(1, 13, 11, 5, c('red', 2)).rect(1, 13, 11, 1, c('red', 3));
  bill.rect(0, 8, 13, 4, K).rect(1, 9, 11, 2, c('red', 3)).rect(0, 7, 3, 2, K).rect(10, 7, 3, 2, K);
  bill.disc(6, 15, 3.4, K).disc(6, 15, 2.5, c('white', 2)).disc(6, 15, 0.7, K);
  bill.line(1, 5, 3, 3, c('seed', 2)).line(0, 3, 2, 1, c('seed', 2)).line(12, 5, 10, 3, c('seed', 2)).line(13, 3, 11, 1, c('seed', 2));
  bill.rect(14, 1, 6, 13, K).rect(15, 2, 4, 11, c('white', 2));
  for (const y of [4, 6, 8]) bill.rect(15, y, 3, 1, K).set(18, y, c('gray', 2));
  bill.rect(15, 11, 4, 1, c('red', 2)).set(15, 13, K).set(17, 13, K).set(19, 13, K);
  book.add('phoneBill', bill, air);
}
