// Level 1's background blocks, Doc Leo's garage at dawn: the laundry room off the kitchen
// (wallpaper, the washer and dryer), the door to the garage, the garage itself (cinder walls,
// a pegboard of tools, the workbench with the key cabinet, shelves up to a loft, the mower and
// a bicycle, boxes), the roll-up garage door with its warning light, and outside on the
// driveway, THE CHEZ at its charger with Doc Leo.
import { Pixels } from '../../../kit/pixels';
import { blob, speckle } from '../art/draw';
import { Tiles } from './level';
import { boxFace, c, cloud, copy, dirt, grassTop, hedge, r, sky, tuft, windowOn } from '../blocks/tiles';
import { bandAt, road, sign, wallpaper, wideSign } from './common';
import { art } from './parts';

/** The ground floor's floor row (Teddy walks on row 39). */
export const G = 40;
/** The ceiling's row; the roof is above it. */
export const CEIL = 32;

/** Bare cinder blocks (the garage's walls). */
function cinder(seed: number): Pixels {
  const p = new Pixels(20, 20, c('stone', 1));
  for (let row = 0; row < 2; row++)
    for (let bx = -1; bx < 2; bx++) {
      const x = bx * 20 + (row % 2) * 10;
      speckle(p, x + 1, row * 10 + 1, 18, 8, r('stone'), 2, 1, seed + row + bx, 0.2);
    }
  return p;
}

/** Concrete floor (solid): a lit top edge and an expansion seam. */
function concrete(seed: number): Pixels {
  const p = new Pixels(20, 20);
  speckle(p, 0, 0, 20, 20, r('stone'), 2, 1, seed, 0.15);
  p.rect(0, 0, 20, 2, c('stone', 4)).rect(0, 2, 20, 1, c('stone', 1));
  if (seed % 3 === 0) p.rect(10, 0, 1, 20, c('stone', 0));
  return p;
}

/** Pegboard: brown board with holes and a tool or two hanging on it. */
function pegboard(tool: number): Pixels {
  const p = new Pixels(20, 20, c('wood', 2));
  for (let y = 2; y < 20; y += 4) for (let x = 2; x < 20; x += 4) p.set(x, y, c('wood', 0));
  if (tool === 1) p.rect(4, 3, 2, 12, c('metal', 2)).rect(2, 3, 6, 3, c('metal', 1)); // a hammer
  if (tool === 2) p.rect(12, 4, 1, 10, c('metal', 3)).rect(11, 13, 3, 5, c('red', 2)); // a screwdriver
  if (tool === 3) {
    // a coil of orange cord
    blob(p, 10, 10, 6, 6, r('orange'), 1, 3);
    blob(p, 10, 10, 3, 3, [c('wood', 2)], 0, 0);
  }
  if (tool === 4) p.rect(3, 6, 14, 2, c('metal', 2)).rect(15, 4, 3, 6, c('metal', 1)); // a wrench
  return p;
}

export function garageTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  for (let part = 0; part < 3; part++) t.air(`cloud${part}`, cloud(1, part, 5));
  t.wall('grass', grassTop(2));
  t.wall('dirt', dirt(4));
  t.wall('deep', dirt(6, true));
  t.wall('drive', road(false, 9));
  t.air('tuft', tuft(sky(3), 13, 'yellow'));
  t.air('hedgeTop', hedge(true, 23, sky(bandAt(29, G))));
  t.wall('hedgeWall', hedge(false, 27));

  // The roof (a low gable seen end-on is too big: a plain shingled slope) and the ceiling.
  const shingles = (k: number) => {
    const p = new Pixels(20, 20);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, (y + (x >> 2)) % 5 === 4 ? c('roof', 0) : c('roof', y % 5 < 2 ? 3 : 2));
    if (k) p.rect(0, 0, 20, 2, c('roof', 3));
    return p;
  };
  t.wall('roofTop', shingles(1));
  t.wall('roof', shingles(0));
  const beam = (() => {
    const p = new Pixels(20, 20, c('wood', 1));
    speckle(p, 0, 0, 20, 14, r('wood'), 2, 1, 31, 0.2);
    p.rect(0, 14, 20, 6, c('wood', 0)).rect(0, 14, 20, 1, c('wood', 3));
    return p;
  })();
  t.wall('ceiling', beam);

  // The laundry room.
  const laundry = wallpaper('teal', 'diamonds', 4);
  t.air('laundry', laundry);
  t.air('laundryWin', windowOn(laundry, false, 'yellow'));
  art(
    t,
    'washer',
    2,
    1,
    () => laundry,
    (p) => {
      for (const x0 of [1, 21]) {
        p.rect(x0, 2, 18, 18, c('paint', 3)).frame(x0, 2, 18, 18, c('ink', 0));
        p.rect(x0 + 1, 3, 16, 3, c('paint', 2));
        p.disc(x0 + 9, 13, 5, c('ink', 0)).disc(x0 + 9, 13, 4, x0 < 10 ? c('water', 2) : c('stone', 2));
        p.set(x0 + 3, 4, c('red', 3)).set(x0 + 6, 4, c('green', 3));
      }
    },
  );
  const tile = new Pixels(20, 20, c('stone', 3));
  for (let k = 0; k < 20; k += 10) tile.rect(0, k, 20, 1, c('stone', 2)).rect(k, 0, 1, 20, c('stone', 2));
  tile.rect(0, 0, 20, 2, c('stone', 4));
  t.wall('tileFloor', tile);

  // The garage: walls, pegboard, the floor.
  const wall = cinder(17);
  t.air('cinder', wall);
  t.air('garageWin', windowOn(wall, false, 'blue'));
  for (let k = 0; k < 5; k++) t.air(`peg${k}`, pegboard(k));
  t.wall('floor0', concrete(3));
  t.wall('floor1', concrete(4));

  // The door from the laundry room into the garage: the frame over it, the dark doorway behind.
  const frameTop = copy(laundry);
  frameTop.rect(0, 14, 20, 6, c('wood', 2)).rect(0, 14, 20, 1, c('wood', 4)).rect(0, 19, 20, 1, c('wood', 0));
  t.wall('doorTop', frameTop);
  // the wall between the laundry room and the garage (and the house's outside wall)
  const partition = copy(laundry);
  partition.rect(0, 0, 4, 20, c('paint', 2)).rect(16, 0, 4, 20, c('stone', 2)).rect(4, 0, 12, 20, c('paint', 1));
  t.wall('partition', partition);
  const doorway = new Pixels(20, 20, c('ink', 1));
  doorway.rect(0, 0, 2, 20, c('wood', 2)).rect(18, 0, 2, 20, c('wood', 2));
  t.air('doorway', doorway);

  // The workbench (stand on its top), its legs, and the key cabinet standing on it.
  const bench = (k: number) => {
    const p = copy(wall);
    p.rect(0, 0, 20, 5, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 4, 20, 1, c('wood', 0));
    p.rect(k === 0 ? 2 : 15, 5, 3, 15, c('wood', 1));
    return p;
  };
  t.ledge('benchL', bench(0));
  t.ledge('benchR', bench(2));
  t.ledge(
    'bench',
    (() => {
      const p = copy(wall);
      p.rect(0, 0, 20, 5, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 4, 20, 1, c('wood', 0));
      p.rect(2, 9, 16, 2, c('wood', 1));
      // a vise on the front edge
      p.rect(8, 5, 5, 3, c('metal', 1));
      return p;
    })(),
  );
  t.air(
    'benchLegs',
    (() => {
      const p = copy(wall);
      p.rect(2, 0, 3, 20, c('wood', 1)).rect(15, 0, 3, 20, c('wood', 1)).rect(2, 9, 16, 2, c('wood', 1));
      return p;
    })(),
  );
  const cabinet = (() => {
    const p = copy(wall);
    p.rect(1, 2, 18, 18, c('blue', 0)).frame(1, 2, 18, 18, c('ink', 0));
    p.rect(3, 9, 14, 1, c('blue', 1));
    return p;
  })();
  t.air('cabinet', cabinet);
  t.clue('keys', 'keys', 'cabinet');

  // Shelves up to the loft (stand on them, hop up through them), with paint cans on them.
  const shelf = (cans: boolean) => {
    const p = copy(wall);
    if (cans)
      for (const [x, col] of [
        [2, 'red'],
        [9, 'blue'],
      ] as const) {
        p.rect(x, 6, 7, 8, c(col, 2))
          .rect(x, 6, 7, 1, c('metal', 3))
          .rect(x + 1, 9, 5, 3, c('paint', 3));
      }
    p.rect(0, 14, 20, 3, c('wood', 3)).rect(0, 14, 20, 1, c('wood', 4)).rect(0, 17, 20, 1, c('wood', 0));
    p.rect(2, 17, 2, 3, c('metal', 1)).rect(16, 17, 2, 3, c('metal', 1));
    return p;
  };
  t.ledge('shelf', shelf(false));
  t.ledge('shelfCans', shelf(true));
  t.ledge(
    'loft',
    (() => {
      const p = new Pixels(20, 20, c('wood', 2));
      speckle(p, 0, 0, 20, 6, r('wood'), 3, 1, 33, 0.2);
      p.rect(0, 0, 20, 1, c('wood', 4)).rect(0, 6, 20, 1, c('wood', 0));
      for (let x = 0; x < 20; x += 5) p.rect(x, 7, 1, 13, c('wood', 1));
      return p;
    })(),
  );
  t.wall('box', boxFace('hay', 2, 41));
  t.wall('boxDark', boxFace('wood', 2, 43));

  // The mower and the bicycle (scenery).
  art(
    t,
    'mower',
    2,
    1,
    () => wall,
    (p) => {
      p.rect(4, 10, 26, 6, c('green', 1)).rect(4, 10, 26, 1, c('green', 2));
      p.line(28, 10, 36, 0, c('metal', 1)).rect(34, 0, 5, 2, c('ink', 0));
      p.disc(8, 17, 3, c('ink', 0)).disc(26, 17, 3, c('ink', 0));
    },
  );
  art(
    t,
    'bike',
    2,
    2,
    () => wall,
    (p) => {
      for (const x of [9, 31]) {
        p.disc(x, 30, 8, c('ink', 0)).disc(x, 30, 6, wall.get(5, 5));
        p.line(x, 30, x, 24, c('metal', 2));
      }
      p.line(9, 30, 20, 20, c('red', 2)).line(20, 20, 31, 30, c('red', 2)).line(20, 20, 29, 18, c('red', 2)).line(14, 30, 20, 20, c('red', 2));
      p.rect(16, 17, 6, 2, c('ink', 0)).rect(27, 14, 2, 5, c('metal', 2)).rect(25, 14, 6, 1, c('ink', 0));
    },
  );

  // The roll-up garage door: panels above the bottom one (a monster), the track, the light.
  const panel = (() => {
    const p = new Pixels(20, 20);
    for (let y = 0; y < 20; y++) p.rect(0, y, 20, 1, c('stone', y % 5 === 0 ? 4 : y % 5 === 4 ? 2 : 3));
    p.rect(0, 0, 1, 20, c('stone', 1)).rect(19, 0, 1, 20, c('stone', 1));
    return p;
  })();
  t.wall('gdoor', panel);
  // where the bottom panel goes up and down: the morning light outside
  const gap = new Pixels(20, 20);
  gap.px.set(sky(3).px);
  gap.rect(0, 0, 20, 2, c('stone', 1)).rect(0, 0, 1, 20, c('stone', 1)).rect(19, 0, 1, 20, c('stone', 1));
  t.air('gdoorGap', gap);
  // the warning light over the door, blinking all the time (the door is automatic)
  const light = (on: boolean) => {
    const p = copy(wall);
    p.rect(5, 4, 10, 14, c('paint', 3)).frame(5, 4, 10, 14, c('ink', 0));
    p.disc(10, 9, 3, on ? c('yellow', 3) : c('red', 1));
    if (on) p.set(10, 8, c('fur', 2));
    p.rect(7, 14, 6, 2, c('ink', 1));
    return p;
  };
  t.air('lightOn', light(true), { next: 'lightOff', ntime: 6 });
  t.air('lightOff', light(false), { next: 'lightOn', ntime: 6 });

  // Outside: the charger on its post by the driveway.
  art(
    t,
    'charger',
    1,
    2,
    () => sky(3),
    (p) => {
      p.rect(8, 6, 4, 34, c('metal', 1));
      p.rect(4, 6, 12, 14, c('paint', 3)).frame(4, 6, 12, 14, c('ink', 0));
      p.rect(6, 9, 8, 3, c('green', 2)).set(7, 15, c('green', 3)).set(10, 15, c('green', 3));
      p.line(14, 20, 18, 26, c('ink', 0)).line(18, 26, 20, 28, c('ink', 0));
    },
  );

  // Signs.
  const [woofL, woofR] = wideSign(laundry, 'WOOF\nSPACE');
  t.air('signWoofL', woofL);
  t.air('signWoofR', woofR);
  const [fiveL, fiveR] = wideSign(laundry, 'HIGH FIVE\n(KEY 1)');
  t.air('signFiveL', fiveL);
  t.air('signFiveR', fiveR);
  const [hurryL, hurryR] = wideSign(wall, 'PUSH IT,\nTHEN RUN!');
  t.air('signHurryL', hurryL);
  t.air('signHurryR', hurryR);
  t.air('signKeys', sign(wall, 'KEYS', 'up'));
  t.air('signSniff', sign(laundry, 'S', 'down'));
  return t;
}
