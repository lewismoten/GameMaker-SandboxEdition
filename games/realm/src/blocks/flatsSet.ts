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
  book.add('mud1', plain((x, y) => (speck(Math.floor(x / 3), Math.floor(y / 3), 7, 11) > 0.8 && Math.min(x, y, 20 - x, 20 - y) > 3 ? mix(mud(x, y), [240, 230, 210], 0.6) : mud(x, y))));
  book.add('weed', weed());
  addFamily(book, { layer: 'water', shader: channel, diag: true, rough: 1, seed: 71, attrs: (m) => (bitsOf(m) >= 2 ? { solid: ALL } : {}) });
  addFamily(book, { layer: 'road', shader: causeway, diag: true, rough: 0.4, seed: 73 });
  addFamily(book, { layer: 'rock', shader: reef, rough: 1.6, seed: 75, attrs: (m) => (bitsOf(m) >= 2 ? { solid: ALL } : {}) });
  for (const [wm, rm] of bridges) book.add(`bridge:${wm}:${rm}`, paintBridge(wm, rm, (x, y) => cobble(x, y), channel), {});
  // the low causeway: dry for twenty seconds, under water for eight
  const deck = (x: number, y: number): RGB => (y % 4 < 0.7 ? [86, 58, 34] : mix([150, 108, 62], [190, 146, 92], tnoise(x, y, 2.5, 20, 9)));
  book.add('tideDry', plain(deck), { next: 'tideWet', ntime: 364 });
  book.add('tideWet', plain((x, y) => mix(water(x, y, 6), deck(x, y), 0.25)), { solid: ALL, next: 'tideDry', ntime: 146 });
  book.add('charger', charger(false), { solid: ALL, hp: 60, score: 50, touch: 'chargerUsed' });
  book.add('chargerUsed', charger(true), { solid: ALL });
  book.add('sign', sign(), { solid: ALL });
  book.add('egg', (() => {
    const cv = plain(mud);
    paintEgg(cv, 10, 10, 15);
    return cv;
  })(), { obj: 1, effect: C.egg, eamt: 1 });
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

function sign(): Canvas {
  const cv = new Canvas(20, 20).shade(mud, 2);
  cv.rect(9, 8, 2, 11, [90, 60, 36]);
  cv.rrect(1, 2, 18, 8, 1.5, [196, 160, 104]);
  for (let k = 0; k < 3; k++) cv.rect(3, 4 + k * 2, 14 - k * 4, 0.8, [90, 60, 36]);
  return cv;
}
