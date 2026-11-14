// The scenery drawn on the paper (no Starter art): the ground a wobbly pencil line with green crayon scribbled under it
// and brown crayon hatching below that, clouds in pencil outline with a little blue crayon, a bush and a flower as crayon
// doodles. Every level shares them; a level's paper (moods.ts) only changes the sheet behind.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** How far the ground's pencil line wanders up or down across a block (it meets itself at the block's edges). */
const HILL = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, -1, -1, 0];

const hash = (x: number, y: number, k = 7) => (Math.imul(x * 31 + y * 17 + k, 2654435761) >>> 0) % 100;

/** The ground's top block: the pencil line, green crayon scribbled thickly under it and thinning down. */
export function grassTile(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, skyOf(pal));
  for (let x = 0; x < 20; x++) {
    const y0 = 3 + HILL[x];
    p.set(x, y0, c('stone', 0));
    if ((x * 7) % 5 < 2) p.set(x, y0 + 1, c('stone', 2));
    for (let y = y0 + 1; y < 20; y++) {
      const depth = y - y0;
      const strokeAt = (x + y) % 3 === 0;
      if (strokeAt && hash(x, y) < 100 - depth * 4) p.set(x, y, c('grass', hash(x, y, 3) % 3 === 0 ? 2 : depth < 8 ? 3 : 4));
    }
  }
  return p;
}

/** The ground below: slanting brown crayon hatching, broken up, and a few pencil pebbles. */
export function dirtTile(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, skyOf(pal));
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      if ((x - y + 20) % 4 === 0 && hash(x, y, 11) < 62) p.set(x, y, c('dirt', hash(x, y, 5) % 3 === 0 ? 3 : 4));
    }
  for (const [x, y] of [
    [4, 6],
    [14, 13],
  ])
    p.rect(x, y, 3, 1, c('stone', 2))
      .set(x, y + 1, c('stone', 2))
      .set(x + 2, y + 1, c('stone', 2))
      .rect(x, y + 2, 3, 1, c('stone', 2));
  return p;
}

/** A cloud as a pencil outline (two blocks wide), with short strokes of pale blue crayon inside. */
function cloud(pal: Pal): Pixels {
  const { c } = pal;
  const puffs: [number, number, number][] = [
    [10, 11, 5],
    [17, 8, 6],
    [25, 8, 6],
    [31, 11, 5],
  ];
  const shape = (x: number, y: number) => y <= 15 && (puffs.some(([px, py, r]) => (x - px) ** 2 + (y - py) ** 2 <= r * r) || (y >= 11 && x >= 10 && x <= 31));
  const p = new Pixels(40, 20, skyOf(pal));
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 40; x++) {
      if (!shape(x, y)) continue;
      const rim = !shape(x - 1, y) || !shape(x + 1, y) || !shape(x, y - 1) || !shape(x, y + 1);
      if (rim) p.set(x, y, c('stone', 2));
      else if ((x + y) % 6 === 0 && y > 9 && hash(x, y) < 60) p.set(x, y, c('blue', 4));
    }
  return p;
}

/** A bush: a scribbled green blob with a darker crayon outline, drawn quickly. */
function bush(pal: Pal): Pixels {
  const { c } = pal;
  const lobes: [number, number, number][] = [
    [6, 13, 5],
    [11, 10, 6],
    [15, 13, 5],
  ];
  const shape = (x: number, y: number) => y <= 18 && lobes.some(([px, py, r]) => (x - px) ** 2 + (y - py) ** 2 <= r * r);
  const p = new Pixels(20, 20, skyOf(pal));
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      if (!shape(x, y)) continue;
      const rim = !shape(x - 1, y) || !shape(x + 1, y) || !shape(x, y - 1) || !shape(x, y + 1);
      if (rim) p.set(x, y, c('grass', 1));
      else if ((x + y) % 3 === 0 && hash(x, y, 9) < 80) p.set(x, y, c('grass', hash(x, y, 2) % 2 ? 3 : 2));
    }
  return p;
}

/** A flower: a crayon stem with two leaves and a pink blossom around a yellow middle. */
function flower(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, skyOf(pal));
  p.rect(10, 9, 1, 11, c('grass', 1)).rect(11, 11, 1, 8, c('grass', 3));
  p.rect(7, 14, 3, 1, c('grass', 2)).set(6, 13, c('grass', 2)).rect(12, 15, 3, 1, c('grass', 2)).set(15, 14, c('grass', 2));
  for (const [x, y] of [
    [10, 3],
    [7, 6],
    [13, 6],
    [8, 9],
    [12, 9],
  ])
    p.disc(x, y, 2.2, c('pink', 2)).set(x, y, c('pink', 1));
  p.disc(10, 6.5, 2, c('gold', 2));
  return p;
}

/** Adds the ground, clouds, bush and flower, under the names the map letters use (G, D, ( ), b, f). */
export function addPencilScenery(book: Book, pal: Pal): void {
  const air = { grav: PULL.down };
  book.add('grass', grassTile(pal), { solid: SOLID });
  book.add('dirt', dirtTile(pal), { solid: SOLID });
  const k = cloud(pal);
  book.add('cloudL', k.crop(0, 0, 20, 20), air);
  book.add('cloudR', k.crop(20, 0, 20, 20), air);
  book.add('bush', bush(pal), air);
  book.add('flower', flower(pal), air);
}
