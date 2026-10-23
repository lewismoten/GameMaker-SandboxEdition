// PORT.BBL: Someday Harbor and Eventually Falls. The shared town ground with water (the
// harbor, the river, Eventually Pond), cottages, the lighthouse, piers and boats, Professor
// Fiddlesticks' garage with THE CHEZ, Doc Leo's tent, the falls (one side of which you can walk
// straight through), the hermit's nest, and the gates and wares.
import { ALL, BlockBook } from './book';
import { Canvas, mix, clamp01, tnoise, type RGB } from '../art/rgb';
import { tower, shadow, STYLE } from '../art/buildings';
import { grass, water, rock, paintBridge, cobble } from '../art/terrain';
import { townGround, cottage, stall, counter, wares, buyChain, gate, eggBlocks, cutBlocks, signpost, quay } from './town';
import { chez } from './worldFeatures';
import { C, SEQ, BLK } from '../ids';
import { plain } from './autotiles';
import { bridgeName } from '../levels/ground';
import { gateArt } from './gateArt';
import { C as color } from '../art/pal';
import { Pixels } from '../../../kit/pixels';
import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
import { EGG_SHINE_FRAMES, drawEasterEgg } from '../../../kit/easterEgg';

export function portBook(bridges: [number, number][]): BlockBook {
  const book = new BlockBook('port', { [BLK.egg]: 'egg' });
  townGround(book, { water: true });
  for (const [wm, rm] of bridges)
    book.add(
      bridgeName(wm, rm),
      paintBridge(wm, rm, (x, y) => cobble(x, y), quay),
      {},
    );
  book.add('signT', signpost(), {});
  book.add('counter', counter(), { solid: ALL });
  cottage(book, 'cottA', STYLE.thatch, 11);
  cottage(book, 'cottB', STYLE.redTile, 12);
  cottage(book, 'cottC', STYLE.blueSlate, 13);
  // the lighthouse: white, red bands, a lamp room
  cutBlocks(book, 'lighthouse', 1, 3, (cv) => {
    const w: RGB[] = [
      [150, 150, 160],
      [222, 222, 228],
      [255, 255, 255],
    ];
    tower(
      cv,
      10,
      12,
      7,
      42,
      w,
      [
        [120, 30, 26],
        [180, 50, 40],
        [230, 100, 80],
      ],
      11,
    );
    for (const y of [30, 44]) cv.rect(3, y, 14, 4, [190, 50, 40]);
    cv.rect(5.5, 15, 9, 5, [255, 236, 140]);
  });
  // piers: planks over the water (walkable), the long pier's posts
  book.add('pier', pier(false));
  book.add('pierEnd', pier(true));
  cutBlocks(
    book,
    'boat',
    2,
    1,
    (cv) => boat(cv),
    () => true,
    (x, y) => water(x, y, 10),
  );
  // the fog bank at the end of the long pier: the foghorn clears it
  gate(book, 'fog', C.fog, 1, fogBank(), pier(false), true);
  // Professor Fiddlesticks' garage, THE CHEZ inside, and the charge gate at its door
  cutBlocks(
    book,
    'garage',
    3,
    2,
    (cv) => {
      shadow(cv, 2, 3, 56, 36);
      cv.rect(2, 12, 56, 27, (x, y) => mix([150, 120, 96], [196, 170, 140], clamp01(tnoise(x, y, 5, 20, 3) * 0.5 + 0.3 - (y - 12) / 80)));
      cv.poly(
        [
          [0, 14],
          [6, 1],
          [54, 1],
          [60, 14],
        ],
        (_x, y) => mix([90, 90, 100], [60, 60, 70], (y - 1) / 13),
      );
      cv.rect(19, 18, 22, 22, [40, 34, 30]);
      chez(cv, 21, 24, 1);
      for (let y = 18; y < 40; y += 3) cv.rect(19, y, 22, 0.6, [80, 70, 60]);
      cv.rrect(6, 4, 48, 7, 2, [230, 210, 160]);
      for (let k = 0; k < 6; k++) cv.rect(10 + k * 7, 6, 5, 3, [60 + k * 20, 40, 40]);
    },
    (x, y) => !(x === 1 && y === 1),
  );
  gate(book, 'chezgate', C.p2, 1, gateArt.bolt(false), gateArt.bolt(true), true);
  // Doc Leo's tent, and the flap that opens when Reggie is found
  cutBlocks(
    book,
    'tent',
    2,
    2,
    (cv) => {
      shadow(cv, 3, 8, 34, 30);
      cv.poly(
        [
          [2, 38],
          [20, 3],
          [38, 38],
        ],
        (x) => (Math.floor(x / 4) % 2 ? [200, 50, 50] : [246, 230, 120]),
      );
      cv.poly(
        [
          [14, 38],
          [20, 22],
          [26, 38],
        ],
        [40, 24, 30],
      );
      cv.line(20, 3, 20, 0, 0.8, [80, 60, 40]);
      cv.poly(
        [
          [20, 0],
          [26, 1.5],
          [20, 3],
        ],
        [90, 60, 180],
      );
    },
    (x, y) => !(x === 1 && y === 1),
  );
  gate(book, 'tentgate', C.chick, 1, gateArt.chicken(false), gateArt.chicken(true), false);
  // the falls: rock either side, the water between; its left side is a curtain of spray you
  // can walk straight through
  cutBlocks(
    book,
    'falls',
    3,
    3,
    (cv) => {
      cv.shade((x, y) => rock(x, y), 2);
      cv.rect(0, 0, 60, 6, (x, y) => mix(rock(x, y), [40, 36, 34], 0.3));
      cv.rect(6, 0, 34, 60, (x, y) => {
        const streak = tnoise(x * 3, y * 0.2, 5, 20, 7);
        return mix([90, 160, 200], [230, 246, 255], clamp01(streak * 1.2 - 0.1 + (y > 50 ? (y - 50) / 10 : 0)));
      });
      for (let k = 0; k < 9; k++) cv.disc(8 + k * 4, 56 + (k % 2) * 2, 3, [240, 250, 255]);
    },
    (x) => (x === 0 ? false : true),
  );
  // stalls and wares: reeds and tonics in the harbor; a lamp, a feather and tonics at Hattie's
  stall(book, 'stallB', [40, 70, 150]);
  stall(book, 'stallG', [40, 120, 70]);
  buyChain(book, 'tonic', 15, { effect: SEQ.tonic, eamt: 1 }, wares.tonicOne);
  buyChain(book, 'reeds', 10, { effect: SEQ.kazoo, eamt: 10 }, wares.reeds);
  buyChain(book, 'lamp', 40, { effect: C.lamp, eamt: 1, score: 100 }, wares.lamp);
  buyChain(book, 'feather', 100, { effect: 1, eamt: 1 }, wares.feather);
  book.add('bed', counter(wares.bed), { solid: ALL, effect: C.money, eamt: -10, hp: 60, touch: 'bed2' });
  book.add('bed2', counter(wares.bedUsed), { solid: ALL });
  // the hermit's stone: it has more to say to anyone carrying the egg
  gate(book, 'eggstone', C.egg, 1, gateArt.stone(false), gateArt.stone(true), true);
  eggBlocks(book, true);
  // a tin heart in the grass by the lighthouse: a glint crosses it now and then; 100 points
  for (let k = 0; k < SHINE_FRAMES; k++)
    book.add(`tinHeart${k || ''}`, tinHeart(k), { next: `tinHeart${(k + 1) % SHINE_FRAMES || ''}`, ntime: k ? 2 : 50, touch: 'grass', score: 100, dither: 0 });
  // a painted Easter egg in the grass on the far bank of Eventually Pond: a glint crosses it
  // now and then; 50 points, no sound (added last, so no block before it moves)
  for (let k = 0; k < EGG_SHINE_FRAMES; k++)
    book.add(`easterEgg${k || ''}`, easterEgg(k), {
      next: `easterEgg${(k + 1) % EGG_SHINE_FRAMES || ''}`,
      ntime: k ? 2 : 60,
      touch: 'grass',
      score: 50,
      dither: 0,
    });
  void plain;
  return book;
}

/** The painted Easter egg (kit/easterEgg.ts) in the fixed sprite colors, on the grass. */
function easterEgg(frame: number): Canvas {
  const cv = plain((x, y) => grass(x, y));
  const cols: RGB[] = [
    color('outline'),
    color('purple', 1),
    color('purple', 2),
    color('purple', 3),
    color('gold', 2),
    color('gold', 3),
    color('white', 0),
    color('white', 1),
  ];
  const p = drawEasterEgg(new Pixels(20, 20, 255), { ink: 0, shell: [1, 2, 3], paint: [4, 5], accent: 6, white: 7 }, 'stars', frame);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (p.get(x, y) !== 255) cv.blend(x, y, cols[p.get(x, y)]);
  return cv;
}

/** The tin heart (kit/tinHeart.ts) in the fixed sprite colors, on the grass. */
function tinHeart(frame: number): Canvas {
  const cv = plain((x, y) => grass(x, y));
  const cols: RGB[] = [color('outline'), color('steel', 1), color('steel', 2), color('steel', 3), color('white', 1), color('steel', 0)];
  const p = drawTinHeart(new Pixels(20, 20, 255), { ink: 0, tin: [1, 2, 3], white: 4, dark: 5 }, frame);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (p.get(x, y) !== 255) cv.blend(x, y, cols[p.get(x, y)]);
  return cv;
}

function pier(end: boolean): Canvas {
  const cv = new Canvas(20, 20).shade((x, y) => water(x, y, 10), 2);
  cv.rect(3, 0, 14, 20, (x, y) => {
    const board = y % 4;
    const c = mix([150, 108, 62], [190, 146, 92], tnoise(x, y, 2.5, 20, 9));
    return board < 0.7 ? [86, 58, 34] : c;
  });
  for (const y of end ? [2, 16] : [8]) {
    cv.disc(3, y, 1.8, [90, 60, 36]);
    cv.disc(17, y, 1.8, [90, 60, 36]);
  }
  return cv;
}

function boat(cv: Canvas): void {
  cv.ellipse(20, 12, 17, 6, [30, 50, 70]);
  cv.ellipse(20, 10, 16, 5.5, (x) => mix([180, 90, 50], [120, 60, 30], clamp01((x - 4) / 32)));
  cv.ellipse(20, 9, 13, 3.5, [200, 170, 120]);
  cv.rect(19, -6, 1.4, 16, [90, 60, 36]);
}

function fogBank(): Canvas {
  const cv = pier(false);
  return cv.shade((x, y) => {
    const n = tnoise(x, y, 5, 20, 41) * 0.6 + tnoise(x, y, 2.5, 20, 42) * 0.4;
    return mix([200, 210, 220], [250, 252, 255], n);
  }, 1);
}

export { grass };
