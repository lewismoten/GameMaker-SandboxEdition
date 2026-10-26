// FLATS.BBL: the Dawdle Flats, forty leagues of tidal mud between Dallydale and Far Putoff.
// Wet rippled sand, tide channels, reefs of black rock, and the old stone causeway THE CHEZ
// drives along; where the causeway runs low the tide floods it and drains it again by the clock
// (two blocks that turn into each other after a time), and charging posts top up THE CHEZ.
import { ALL, BlockBook } from './book';
import { addFamily } from './autotiles';
import { Canvas, type RGB, mix, clamp01, tnoise, speck, smooth } from '../art/rgb';
import { cobble, water, rock, paintBridge, type Shader } from '../art/terrain';
import { shadow } from '../art/buildings';
import { paintEgg } from '../art/egg';
import { C, BLK } from '../ids';

/** Rippled wet sand, shining where the water still lies in the ripples. */
export function mud(x: number, y: number): RGB {
  const rip = Math.sin((y + tnoise(x, y, 5, 20, 3) * 4) * ((Math.PI * 2) / 5));
  const n = tnoise(x, y, 5, 20, 4) * 0.5 + tnoise(x, y, 2.5, 20, 5) * 0.3;
  let c = mix([150, 130, 100], [196, 176, 136], clamp01(n + rip * 0.12));
  if (rip > 0.85 && tnoise(x, y, 10, 20, 6) > 0.5) c = mix(c, [180, 210, 220], 0.5);
  if (speck(x, y, 20, 7) > 0.97) c = [236, 226, 210];
  return c;
}

const channel: Shader = (x, y, d) => {
  if (d > 3) return mud(x, y);
  if (d > 0) return mix([120, 104, 80], mud(x, y), d / 3);
  if (d > -1.2) return [190, 220, 220];
  return water(x, y, -d + 2);
};

const causeway: Shader = (x, y, d) => {
  if (d > 2.5) return mud(x, y);
  if (d > 0) return mix([90, 84, 76], mud(x, y), smooth(0, 2.5, d));
  if (-d < 1.5) return [130, 124, 116];
  return cobble(x, y, -0.1);
};

const reef: Shader = (x, y, d, _nx, ny) => {
  const face = clamp01(ny * 1.4 - 0.15) * 6;
  if (d > 0) {
    if (d < face) return mix([60, 56, 60], [30, 28, 34], d / Math.max(1, face));
    return mix(mud(x, y), [60, 60, 70], (1 - smooth(face, face + 3, d)) * 0.5);
  }
  return mix(mix(rock(x, y), [40, 40, 50], 0.5), [90, 120, 80], tnoise(x, y, 2.5, 20, 9) > 0.75 ? 0.4 : 0);
};

const bitsOf = (m: number) => [1, 2, 4, 8].filter((b) => m & b).length;

export function flatsBook(bridges: [number, number][]): BlockBook {
  const book = new BlockBook('flats', { [BLK.egg]: 'egg' });
  const plain = (fn: (x: number, y: number) => RGB) => new Canvas(20, 20).shade(fn, 2);
  book.add('mud', plain(mud));
  book.add(
    'mud1',
    plain((x, y) =>
      speck(Math.floor(x / 3), Math.floor(y / 3), 7, 11) > 0.8 && Math.min(x, y, 20 - x, 20 - y) > 3 ? mix(mud(x, y), [240, 230, 210], 0.6) : mud(x, y),
    ),
  );
  book.add('weed', weed());
  addFamily(book, { layer: 'water', shader: channel, diag: true, rough: 1, seed: 71, attrs: (m) => (bitsOf(m) >= 2 ? { solid: ALL } : {}) });
  addFamily(book, { layer: 'road', shader: causeway, diag: true, rough: 0.4, seed: 73 });
  addFamily(book, { layer: 'rock', shader: reef, rough: 1.6, seed: 75, attrs: (m) => (bitsOf(m) >= 2 ? { solid: ALL } : {}) });
  for (const [wm, rm] of bridges)
    book.add(
      `bridge:${wm}:${rm}`,
      paintBridge(wm, rm, (x, y) => cobble(x, y), channel),
      {},
    );
  // the low causeway: dry for seventeen seconds, then three seconds awash (puddles over the
  // planks: still passable, a warning), then three under water
  const deck = (x: number, y: number): RGB => (y % 4 < 0.7 ? [86, 58, 34] : mix([150, 108, 62], [190, 146, 92], tnoise(x, y, 2.5, 20, 9)));
  book.add('tideDry', plain(deck), { next: 'tideDamp', ntime: 310 });
  book.add(
    'tideDamp',
    plain((x, y) => (tnoise(x, y, 4, 20, 13) > 0.55 ? mix(water(x, y, 6), deck(x, y), 0.45) : deck(x, y))),
    { next: 'tideWet', ntime: 54 },
  );
  book.add(
    'tideWet',
    plain((x, y) => mix(water(x, y, 6), deck(x, y), 0.25)),
    { solid: ALL, next: 'tideDry', ntime: 54 },
  );
  // A tide pole by each low bridge, on the same clock (its frames add up to the bridge's 418
  // ticks, and every block's clock starts with the scene): the water climbs its marks while
  // the bridge is dry, its flag goes red as the puddles come, and the water tops it while the
  // bridge is under. A readable countdown, after the two-ring clocks of 1990s Game-Maker games.
  const POLE_STEPS = 5;
  for (let k = 0; k < POLE_STEPS; k++)
    book.add(`tidePole${k}`, tidePole(k / POLE_STEPS, false), { solid: ALL, next: `tidePole${k + 1 < POLE_STEPS ? k + 1 : 'Warn'}`, ntime: 310 / POLE_STEPS });
  book.add('tidePoleWarn', tidePole(0.85, true), { solid: ALL, next: 'tidePoleUnder', ntime: 54 });
  book.add('tidePoleUnder', tidePole(1, true), { solid: ALL, next: 'tidePole0', ntime: 54 });
  book.add('charger', charger(false), { solid: ALL, hp: 30, score: 50, touch: 'chargerUsed' });
  book.add('chargerUsed', charger(true), { solid: ALL });
  book.add('sign', sign(), { solid: ALL });
  book.add(
    'egg',
    (() => {
      const cv = plain(mud);
      paintEgg(cv, 10, 10, 15);
      return cv;
    })(),
    { obj: 1, effect: C.egg, eamt: 1 },
  );
  return book;
}

function weed(): Canvas {
  const cv = new Canvas(20, 20).shade(mud, 2);
  for (let k = 0; k < 6; k++) cv.line(4 + k * 2.5, 15, 3 + k * 2.6 + (k % 2 ? 2 : -2), 6 + (k % 3), 1, mix([40, 90, 50], [90, 130, 60], k / 6));
  cv.ellipse(14, 6, 2, 1.3, [230, 220, 200]);
  return cv;
}

/** A charging post: "1 mile per hour of charge", a red cord, a lightning bolt. */
function charger(used: boolean): Canvas {
  const cv = new Canvas(20, 20).shade(mud, 2);
  shadow(cv, 6, 3, 8, 15);
  cv.rrect(6, 2, 8, 16, 1.5, used ? [110, 110, 120] : [60, 140, 90]);
  cv.rect(7.5, 4, 5, 5, used ? [40, 40, 44] : [220, 250, 220]);
  cv.poly(
    [
      [10.5, 4.5],
      [8.5, 7],
      [10, 7],
      [9, 9],
      [11.5, 6],
      [10, 6],
    ],
    used ? [90, 90, 90] : [240, 200, 40],
  );
  cv.line(13, 12, 17, 17, 0.8, [190, 40, 30]);
  return cv;
}

/** A striped tide pole in a pool of its own: water up to `level` (0 to 1) of its five marks, and
 * a flag on top, white while the bridge is dry and red once the tide is coming. */
function tidePole(level: number, red: boolean): Canvas {
  const cv = new Canvas(20, 20).shade(mud, 2);
  // the pool at the pole's foot, and the water up the pole
  const top = 18 - level * 14;
  cv.ellipse(10, 17.5, 7, 2.2, water(10, 18, 4));
  cv.rect(8, 4, 4, 15, [226, 218, 196]);
  for (let k = 0; k < 5; k++) cv.rect(8, 6 + k * 2.6, 4, 1.1, [60, 50, 44]);
  if (level > 0) cv.rect(5, top, 10, 18.5 - top, (x, y) => mix(water(x, y, 6), [150, 200, 220], y < top + 1 ? 0.5 : 0));
  cv.rect(9.5, 0.5, 1, 4, [90, 60, 36]);
  cv.poly(
    [
      [10.5, 0.5],
      [16, 2],
      [10.5, 3.5],
    ],
    red ? [210, 40, 30] : [240, 240, 236],
  );
  return cv;
}

function sign(): Canvas {
  const cv = new Canvas(20, 20).shade(mud, 2);
  cv.rect(9, 8, 2, 11, [90, 60, 36]);
  cv.rrect(1, 2, 18, 8, 1.5, [196, 160, 104]);
  for (let k = 0; k < 3; k++) cv.rect(3, 4 + k * 2, 14 - k * 4, 0.8, [90, 60, 36]);
  return cv;
}
