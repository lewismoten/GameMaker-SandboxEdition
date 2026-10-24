// A felt egg on a pad: charcoal felt crossed with lime-green circuit traces in backstitch,
// a little red felt bug with six French-knot legs, and a ribbon of white chip pins around
// its waist. Drawn only in the shared ramps, so it looks the same in every stage.
import { Pixels, rng } from '../../../kit/pixels';
import type { Pal } from '../art/pal';

/** The block number it has in every stage's block set (the last one: nothing else is there). */
export const EGG_BLOCK = 149;

/** Half the egg's width on row y (0 outside), a little narrower at the top. */
function halfWidth(y: number): number {
  const t = (y + 0.5 - 10.2) / 8.4;
  if (Math.abs(t) >= 1) return 0;
  return 6.1 * Math.sqrt(1 - t * t) * (1 + 0.2 * t);
}

export function eggPic(p: Pal, under: Pixels): Pixels {
  const t = new Pixels(20, 20);
  t.px.set(under.px);
  const r = rng(77);
  const inside = (x: number, y: number) => Math.abs(x + 0.5 - 9.75) < halfWidth(y);
  // a soft shadow on the pad
  for (let x = 4; x < 17; x++) t.set(x, 19, p.c('ink', 0));
  // the felt: charcoal, fuzzy, lit from the upper left
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      if (!inside(x, y)) continue;
      const hw = halfWidth(y);
      const nx = (x + 0.5 - 9.75) / Math.max(1, hw);
      const ny = (y - 10.2) / 8.4;
      const light = 0.5 - nx * 0.35 - ny * 0.3 + (r() - 0.5) * 0.5;
      t.set(x, y, p.c('grey', light > 0.75 ? 3 : light > 0.4 ? 2 : 1));
    }
  // the outline, in black thread
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      if (inside(x, y)) continue;
      if (inside(x - 1, y) || inside(x + 1, y) || inside(x, y - 1) || inside(x, y + 1)) t.set(x, y, p.c('ink', 0));
    }
  // circuit traces in lime backstitch (every other pixel a stitch), ending in vias
  const stitch = (pts: [number, number][]) => pts.forEach(([x, y], i) => inside(x, y) && t.set(x, y, p.c('slime', i % 2 ? 2 : 4)));
  const via = (x: number, y: number) => inside(x, y) && t.set(x, y, p.c('slime', 5));
  stitch([
    [6, 4],
    [7, 4],
    [8, 4],
    [8, 5],
    [8, 6],
    [9, 6],
    [10, 6],
    [11, 6],
  ]);
  via(5, 4);
  via(12, 6);
  stitch([
    [13, 3],
    [13, 4],
    [13, 5],
  ]);
  via(13, 2);
  stitch([
    [4, 9],
    [5, 9],
    [6, 9],
    [6, 10],
  ]);
  via(3, 9);
  stitch([
    [11, 15],
    [12, 15],
    [13, 15],
    [13, 14],
    [14, 14],
  ]);
  via(10, 15);
  via(15, 14);
  stitch([
    [6, 15],
    [6, 16],
    [7, 16],
    [8, 16],
  ]);
  via(9, 17);
  // the ribbon of chip pins around the waist
  for (let x = 0; x < 20; x++) {
    if (!inside(x, 12)) continue;
    t.set(x, 12, p.c('grey', 1));
    if (x % 2 === 0) t.set(x, 12, p.c('grey', 7)).set(x, 11, p.c('grey', 5));
  }
  // the felt bug: red body, dark head, six French-knot legs
  t.rect(9, 8, 3, 3, p.c('red', 2)).set(9, 8, p.c('red', 3)).set(10, 8, p.c('red', 1)).set(10, 9, p.c('red', 1)).set(10, 10, p.c('red', 1));
  t.set(10, 7, p.c('ink', 0)).set(9, 6, p.c('ink', 0)).set(11, 6, p.c('ink', 0));
  for (const [x, y] of [
    [8, 8],
    [8, 9],
    [8, 10],
    [12, 8],
    [12, 9],
    [12, 10],
  ])
    t.set(x, y, p.c('slime', 5));
  return t;
}
