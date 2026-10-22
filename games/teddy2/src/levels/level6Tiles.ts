// Level 6's background blocks, the corn maze outside the Fair: tall corn (solid; its top row
// tassels against the sky), the dark rows between the stalks, the floors of the maze's three
// tiers (ledges: hop up through them where a hay bale step gives a boost), hay bale steps,
// the scarecrow at its heart, the farm road in and the Fair's parking lot out, with the
// Ferris wheel standing over the trees.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, speckle } from '../art/draw';
import { Tiles } from './level';
import { c, canvas, cloud, copy, cut, dirt, grassTop, hedge, r, sky, tuft } from '../blocks/tiles';
import { road, sign } from './common';

export const G = 40;
export const bandRow = (y: number) => (y <= 27 ? 0 : y <= 31 ? 1 : y <= 35 ? 2 : 3);
export const skyAt = (y: number) => `sky${bandRow(y)}`;

/** Corn stalks over `base`: green leaves, a few yellow ears. */
function stalks(base: Pixels, seed: number, top: boolean): Pixels {
  const p = copy(base);
  const R = rng(seed);
  for (const x of [2, 7, 12, 17]) {
    const x0 = x + Math.floor(R() * 2);
    p.rect(x0, top ? 6 : 0, 2, top ? 14 : 20, c('green', 1));
    for (let y = top ? 8 : 1; y < 20; y += 5) {
      p.line(x0, y, x0 - 3, y + 3, c('green', 2)).line(x0 + 1, y + 2, x0 + 4, y + 5, c('green', 0));
    }
    if (!top && R() < 0.4) blob(p, x0 + 2, 10 + R() * 6, 1.5, 3, r('yellow'), 1, 3);
    if (top) p.rect(x0 - 1, 2, 4, 4, c('hay', 3)).set(x0, 0, c('hay', 2)).set(x0 + 1, 1, c('hay', 2));
  }
  return p;
}

export function mazeTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  for (let part = 0; part < 3; part++) t.air(`cloud${part}`, cloud(0, part, 13));
  t.wall('grass', grassTop(1));
  t.wall('dirt', dirt(3));
  t.wall('deep', dirt(5, true));
  t.air('tuft', tuft(sky(3), 11));
  t.air('hedgeTop', hedge(true, 21));
  t.wall('hedgeWall', hedge(false, 25));
  t.wall('lot', road(false, 4));
  t.wall('lotLine', (() => {
    const p = road(false, 5);
    p.rect(9, 0, 2, 20, c('paint', 3));
    return p;
  })());

  // The maze. Dark rows between the stalks are the paths.
  const row = (() => {
    const p = new Pixels(20, 20);
    speckle(p, 0, 0, 20, 20, r('leaf'), 0, 1, 31, 0.3);
    for (let x = 1; x < 20; x += 6) p.rect(x, 0, 1, 20, c('green', 0));
    return p;
  })();
  t.air('path', row);
  t.wall('corn', stalks(new Pixels(20, 20, c('leaf', 1)), 32, false));
  t.wall('corn2', stalks(new Pixels(20, 20, c('leaf', 1)), 33, false));
  t.wall('cornTop', stalks(sky(0), 34, true));
  // a tier's floor: trampled dirt between the stalks (a ledge)
  t.ledge(
    'floor',
    (() => {
      const p = copy(row);
      p.rect(0, 0, 20, 5, c('dirt', 3)).rect(0, 0, 20, 1, c('dirt', 4)).rect(0, 5, 20, 1, c('dirt', 1));
      for (let x = 2; x < 20; x += 5) p.set(x, 2, c('dirt', 2));
      return p;
    })(),
  );
  // a hay bale step in a gap in the corn (a ledge), and the gap above it
  t.ledge(
    'step',
    (() => {
      const p = copy(row);
      p.rect(1, 6, 18, 14, c('hay', 2)).rect(1, 6, 18, 2, c('hay', 3));
      p.rect(1, 11, 18, 1, c('wood', 1)).rect(1, 16, 18, 1, c('wood', 1));
      return p;
    })(),
  );
  // a hole in a tier's floor: you can drop through, not climb back
  t.air(
    'drop',
    (() => {
      const p = copy(row);
      p.rect(0, 0, 3, 6, c('dirt', 3)).rect(17, 0, 3, 6, c('dirt', 3));
      return p;
    })(),
  );
  // the scarecrow at the heart of the maze, and a sign at its door
  const crow = canvas(1, 2, () => row);
  crow.rect(9, 10, 2, 30, c('wood', 1)).rect(1, 18, 18, 2, c('wood', 1));
  crow.rect(4, 18, 12, 12, c('red', 1)).rect(6, 30, 8, 4, c('blue', 1));
  blob(crow, 10, 12, 4, 4, r('hay'), 2, 3);
  crow.rect(5, 6, 10, 2, c('ink', 1)).rect(7, 3, 6, 3, c('ink', 1));
  crow.set(8, 12, c('ink', 0)).set(12, 12, c('ink', 0)).rect(9, 14, 3, 1, c('ink', 0));
  const cc = cut(crow);
  t.air('scareTop', cc[0][0]);
  t.air('scareBot', cc[1][0]);
  t.air('signMaze', sign(sky(3), 'MAZE', 'right'));
  t.air('signLost', sign(row, 'LOST?'));
  t.air('signFair', sign(sky(3), 'FAIR', 'right'));

  // The Ferris wheel over the trees past the parking lot (4x4, scenery).
  const fw = canvas(4, 4, (_bx, by) => sky(bandRow(36 + by - 4) + 0));
  fw.ring(40, 40, 34, c('red', 2));
  fw.ring(40, 40, 33, c('red', 1));
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    fw.line(40, 40, 40 + Math.round(Math.cos(a) * 33), 40 + Math.round(Math.sin(a) * 33), c('paint', 3));
    fw.rect(40 + Math.round(Math.cos(a) * 34) - 3, 40 + Math.round(Math.sin(a) * 34), 7, 5, c(['yellow', 'blue', 'green'][k % 3], 2));
  }
  fw.line(40, 40, 22, 80, c('metal', 2)).line(40, 40, 58, 80, c('metal', 2));
  const fc = cut(fw);
  for (let by = 0; by < 4; by++) for (let bx = 0; bx < 4; bx++) t.air(`wheel${bx}${by}`, fc[by][bx]);
  return t;
}
