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
