// WORLD.BBL: the overworld of Procrastia. Shores, rivers, forest edges, roads and cliffs are
// autotile families (terrain.ts) laid out on block corners; on top of them sit the towns,
// dungeon mouths, bridges and signposts.
import { ALL, BlockBook } from './book';
import { addFamily } from './autotiles';
import { Canvas } from '../art/rgb';
import { canopy, cliff, forest, grass, road, rock, shore, water } from '../art/terrain';
import { rng } from '../../../kit/pixels';
import { blend } from '../art/textures';

const bitsOf = (m: number) => [1, 2, 4, 8].filter((b) => m & b).length;

export function worldTerrain(book: BlockBook): void {
  book.add('grass', new Canvas(20, 20).shade((x, y) => grass(x, y), 2));
  for (const k of [1, 2, 3]) book.add(`grass${k}`, new Canvas(20, 20).shade((x, y) => grass(x, y, k), 2));
  book.add('flowers', flowerBed(4));
  book.add('tufts', tufts());
  book.add('stones', stones());
  // water: solid where it takes half the block or more (a river is two half blocks wide)
  addFamily(book, { layer: 'water', shader: shore, diag: true, rough: 0.9, attrs: (m) => (bitsOf(m) >= 2 ? { solid: ALL } : {}) });
  for (const k of [1, 2, 3]) book.add(`water:full${k}`, new Canvas(20, 20).shade(blend((x, y) => water(x, y, 20), (x, y) => water(x, y, 20, k)), 2), { solid: ALL });
  addFamily(book, { layer: 'forest', shader: forest, rough: 1.8, seed: 9, attrs: (m) => (bitsOf(m) >= 2 ? { solid: ALL } : {}) });
  for (const k of [1, 2, 3]) book.add(`forest:full${k}`, new Canvas(20, 20).shade((x, y) => canopy(x, y, 99, k), 2), { solid: ALL });
  addFamily(book, { layer: 'road', shader: road, diag: true, rough: 0.8, seed: 13 });
  addFamily(book, { layer: 'rock', shader: cliff, rough: 1.4, seed: 17, attrs: (m) => (bitsOf(m) >= 2 ? { solid: ALL } : {}) });
  for (const k of [1, 2, 3]) book.add(`rock:full${k}`, new Canvas(20, 20).shade((x, y) => rock(x, y, k), 2), { solid: ALL });
  book.add('rock:peak', peak(), { solid: ALL });
  book.add('tree', tree(false), { solid: ALL });
  book.add('pine', tree(true), { solid: ALL });
  book.add('bush', bush(), {});
}

function flowerBed(seed: number): Canvas {
  const cv = new Canvas(20, 20).shade((x, y) => grass(x, y, 2), 2);
  const r = rng(seed);
  const cols: [number, number, number][] = [
    [250, 236, 110],
    [246, 246, 252],
    [236, 104, 136],
    [180, 140, 240],
  ];
  for (let k = 0; k < 7; k++) {
    const x = 4 + r() * 12;
    const y = 4 + r() * 12;
    const c = cols[Math.floor(r() * cols.length)];
    cv.disc(x + 0.4, y + 0.5, 1.3, [50, 90, 36]);
    cv.disc(x, y, 1.2, c);
    cv.disc(x, y, 0.45, [240, 180, 60]);
  }
  return cv;
}

function tufts(): Canvas {
  const cv = new Canvas(20, 20).shade((x, y) => grass(x, y), 2);
  for (const [cx, cy] of [
    [6, 8],
    [13, 13],
    [9, 15],
  ])
    for (let k = -2; k <= 2; k++) cv.line(cx, cy, cx + k * 1.3, cy - 4 + Math.abs(k), 1, [60 + k * 6, 120, 44]);
  return cv;
}

function stones(): Canvas {
  const cv = new Canvas(20, 20).shade((x, y) => grass(x, y), 2);
  cv.ellipse(8.5, 12.5, 4, 2.6, [40, 60, 30]);
  cv.ellipse(8, 11, 3.6, 2.6, (x, y) => rock(x * 2, y * 2));
  cv.ellipse(7.2, 10.2, 1.4, 0.8, [210, 200, 180]);
  cv.ellipse(13.5, 7.5, 2, 1.2, [40, 60, 30]);
  cv.ellipse(13.3, 6.8, 1.8, 1.3, (x, y) => rock(x * 3, y * 3));
  return cv;
}

/** A lone tree in the meadow, round or pine, with its shadow to the bottom right. */
function tree(pine: boolean): Canvas {
  const cv = new Canvas(20, 20).shade((x, y) => grass(x, y, 1), 2);
  cv.ellipse(12.5, 17.5, 7, 2.4, [34, 56, 28]);
  cv.rect(9, 12, 2.4, 6.5, [96, 64, 38]);
  if (pine)
    for (const [y, w] of [
      [1.5, 3.2],
      [5.5, 5.6],
      [9.5, 7.6],
    ])
      cv.poly(
        [
          [10, y],
          [10 + w, y + 6.5],
          [10 - w, y + 6.5],
        ],
        (px, py) => [40 + (16 - px) * 3 - (py - y) * 2, 110 + (16 - px) * 3 - (py - y) * 3, 50],
      );
  else cv.disc(10, 8.5, 7.5, (px, py) => canopy(px * 1.3, py * 1.3, 99, 2).map((v, i) => v + (i === 1 ? 10 : 0) + Math.max(0, 9 - Math.hypot(px - 7, py - 5.5) * 1.6) * 6) as [number, number, number]);
  return cv;
}

function bush(): Canvas {
  const cv = new Canvas(20, 20).shade((x, y) => grass(x, y, 3), 2);
  cv.ellipse(11, 14.5, 7, 2.2, [34, 56, 28]);
  for (const [x, y, r] of [
    [7, 11, 4],
    [12, 10, 4.5],
    [10, 13, 4],
  ])
    cv.disc(x, y, r, (px, py) => canopy(px * 1.5, py * 1.5, 99, 3));
  return cv;
}

function peak(): Canvas {
  const cv = new Canvas(20, 20).shade((x, y) => rock(x, y), 2);
  cv.poly(
    [
      [3, 17],
      [10, 3],
      [17, 17],
    ],
    (x, y) => (x < 10 + (y - 3) * 0.1 ? [178, 166, 146] : [104, 94, 82]),
  );
  cv.poly(
    [
      [7.5, 8],
      [10, 3],
      [12.5, 8],
      [10, 7],
    ],
    [246, 246, 250],
  );
  return cv;
}
