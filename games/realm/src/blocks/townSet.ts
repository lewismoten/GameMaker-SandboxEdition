// TOWN.BBL: Nowish and Laterburg. The shared town ground, then cottages, the Pony and the
// Royal Library, the Garden Court (walls, towers, the throne, the carpet, the Tuit Table), the
// kennel, the market stalls and their wares, and the gates the quests open.
import { ALL, BlockBook } from './book';
import { addFamily } from './autotiles';
import { Canvas, mix, clamp01, tnoise, type RGB } from '../art/rgb';
import { tower, shadow, STYLE } from '../art/buildings';
import { grass, water } from '../art/terrain';
import { townGround, cottage, hall, stall, counter, wares, buyChain, gate, eggBlocks, cutBlocks, castleWall, signpost } from './town';
import { C, SEQ, BLK, STEEL_SWINGS } from '../ids';
import { plain } from './autotiles';

const bitsOf = (m: number) => [1, 2, 4, 8].filter((b) => m & b).length;
const STONE: RGB[] = [
  [96, 92, 96],
  [154, 150, 150],
  [206, 202, 198],
];
const BLUE: RGB[] = [
  [30, 44, 96],
  [52, 78, 150],
  [110, 146, 210],
];

export function townBook(): BlockBook {
  const book = new BlockBook('town', { [BLK.egg]: 'egg' });
  townGround(book);
  book.add('signT', signpost(), {});
  book.add('crops', crops());
  book.add('well', well(), { solid: ALL });
  book.add('counter', counter(), { solid: ALL });
  cottage(book, 'cottA', STYLE.thatch, 1);
  cottage(book, 'cottB', STYLE.redTile, 2);
  cottage(book, 'cottC', STYLE.blueSlate, 3);
  hall(book, 'inn', STYLE.greenTile, 4, (cv, x, y) => {
    cv.rrect(x - 2, y - 2, 4, 4, 0.8, [230, 200, 120]);
    cv.rect(x + 2, y - 1, 1, 2, [230, 200, 120]);
  });
  hall(book, 'library', STYLE.blueSlate, 5, (cv, x, y) => {
    cv.rect(x - 3, y - 2, 3, 4, [150, 40, 40]);
    cv.rect(x, y - 2, 3, 4, [40, 90, 150]);
  });
  // a pond for Nowish's green, two blocks square
  cutBlocks(book, 'pond', 2, 2, (cv) => {
    cv.ellipse(20, 21, 18, 15, [120, 110, 90]);
    cv.ellipse(20, 21, 16, 13, (x, y) => water(x, y, Math.min(12, 16 - Math.hypot((x - 20) / 1.1, (y - 21) * 1.2))));
    for (const [x, y] of [
      [10, 14],
      [28, 26],
    ])
      cv.ellipse(x, y, 3, 1.6, [70, 140, 60]);
  });
  // the Garden Court
  addFamily(book, { layer: 'wall', shader: castleWall, rough: 0.2, seed: 37, attrs: (m) => (bitsOf(m) >= 1 ? { solid: ALL } : {}) });
  cutBlocks(book, 'ctower', 2, 2, (cv) => tower(cv, 20, 6, 9, 30, STONE, BLUE, 7));
  cutBlocks(
    book,
    'throne',
    1,
    2,
    (cv) => {
      shadow(cv, 2, 2, 16, 34);
      cv.rrect(2, 1, 16, 26, 3, (x, y) => mix([230, 190, 70], [150, 100, 20], clamp01((x - 2) / 20 + (y - 1) / 60)));
      cv.rrect(4, 3, 12, 20, 2, [170, 30, 40]);
      cv.rect(2, 24, 16, 12, (x, y) => mix([200, 160, 50], [130, 86, 20], clamp01((x - 2) / 20 + (y - 24) / 30)));
      cv.rect(4, 25, 12, 5, [190, 40, 50]);
      cv.disc(10, 2.5, 2.2, [255, 230, 120]);
    },
    (_x, y) => (y === 0 ? true : false),
  );
  book.add('carpet', carpet(false));
  book.add('carpetTop', carpet(true));
  // The Tuit Table: walk into a pedestal and it lights if you carry its piece. It takes one
  // from the piece's counter (refused when there's none to take, so it stays dark), gives it
  // straight back, and stays lit.
  for (const [k, cnt] of [
    [1, C.p1],
    [2, C.p2],
    [3, C.p3],
  ] as const) {
    book.add(`ped${k}`, pedestal(k, false), { solid: ALL, effect: cnt, eamt: -1, touch: `ped${k}b` });
    book.add(`ped${k}b`, pedestal(k, true), { solid: ALL, effect: cnt, eamt: 1, touch: `ped${k}c` });
    book.add(`ped${k}c`, pedestal(k, true), { solid: ALL });
  }
  // the royal kennel, and the gate that opens when both hounds have been found
  cutBlocks(book, 'kennel', 2, 2, (cv) => {
    shadow(cv, 3, 6, 34, 30);
    cv.rect(4, 18, 32, 18, (x, y) => mix([170, 110, 60], [120, 76, 40], clamp01((y - 18) / 18 + tnoise(x, y, 2.5, 20, 3) * 0.2)));
    cv.poly(
      [
        [1, 20],
        [20, 4],
        [39, 20],
      ],
      (x, y) => mix([200, 60, 50], [120, 30, 26], clamp01((x - 1) / 40 + (y - 4) / 40)),
    );
    cv.rrect(15, 24, 10, 12, 4, [40, 26, 18]);
    cv.rrect(12, 15, 16, 5, 1, [240, 220, 170]);
    cv.rect(14, 17, 12, 1, [120, 70, 40]);
  }, (x, y) => !(x === 1 && y === 1));
  gate(book, 'kgate', C.dogs, 2, kennelGate(false), kennelGate(true), false);
  gate(book, 'lgate', C.book, 1, rope(false), rope(true), false);
  // the market's wares: walk in once to pay, again to take
  stall(book, 'stallR', [180, 40, 40]);
  stall(book, 'stallG', [40, 120, 70]);
  buyChain(book, 'sword', 80, { effect: SEQ.steel, eamt: STEEL_SWINGS, score: 200 }, wares.sword);
  buyChain(book, 'tonic', 15, { effect: SEQ.tonic, eamt: 1 }, wares.tonicOne);
  book.add('bed', counter(wares.bed), { solid: ALL, effect: C.money, eamt: -10, hp: 150, touch: 'bed2' });
  book.add('bed2', counter(wares.bedUsed), { solid: ALL });
  fountain(book);
  eggBlocks(book, false);
  return book;
}

function crops(): Canvas {
  const cv = plain((x, y) => mix([110, 80, 50], [140, 104, 66], tnoise(x, y, 5, 20, 3)));
  for (let r = 0; r < 4; r++) {
    cv.rect(0, r * 5 + 3.4, 20, 1, [86, 60, 36]);
    for (let k = 0; k < 4; k++) {
      const x = k * 5 + 2.5;
      const y = r * 5 + 2.5;
      cv.disc(x, y, 1.9, [60, 140, 60]);
      cv.disc(x - 0.5, y - 0.5, 0.9, [130, 200, 90]);
    }
  }
  return cv;
}

function well(): Canvas {
  const cv = plain((x, y) => grass(x, y));
  shadow(cv, 3, 5, 14, 13);
  cv.ellipse(10, 13, 7, 4.5, [130, 126, 120]);
  cv.ellipse(10, 12.5, 5, 3, [20, 34, 60]);
  cv.rect(3, 4, 1.6, 10, [100, 70, 40]).rect(15.4, 4, 1.6, 10, [100, 70, 40]);
  cv.poly(
    [
      [1.5, 5],
      [10, 0.5],
      [18.5, 5],
    ],
    [160, 70, 50],
  );
  cv.line(4, 7, 16, 7, 0.7, [80, 60, 40]);
  return cv;
}

function carpet(top: boolean): Canvas {
  const cv = plain((x, y) => grass(x, y));
  cv.rect(4, top ? 4 : 0, 12, top ? 16 : 20, (x, y) => (x < 5 || x > 15 ? [230, 190, 80] : mix([180, 30, 40], [140, 20, 30], tnoise(x, y, 2.5, 20, 5) * 0.5)));
  if (top) cv.rect(4, 3, 12, 1.5, [230, 190, 80]);
  return cv;
}

function pedestal(k: number, lit: boolean): Canvas {
  const cv = plain((x, y) => grass(x, y));
  shadow(cv, 4, 8, 12, 11);
  cv.rect(5, 9, 10, 10, (x) => mix([210, 206, 200], [130, 126, 124], clamp01((x - 5) / 10)));
  cv.rect(3.5, 7, 13, 3, [230, 226, 220]);
  if (lit) {
    cv.disc(10, 5, 5.5, [255, 236, 150]);
    // a third of the Tuit: a wooden disc wedge with a letter on it
    const a0 = (k - 1) * ((Math.PI * 2) / 3) - Math.PI / 2;
    cv.poly(
      [
        [10, 6],
        [10 + Math.cos(a0) * 5, 6 + Math.sin(a0) * 5],
        [10 + Math.cos(a0 + 1) * 5, 6 + Math.sin(a0 + 1) * 5],
        [10 + Math.cos(a0 + 2.09) * 5, 6 + Math.sin(a0 + 2.09) * 5],
      ],
      [176, 120, 60],
    );
  } else cv.ellipse(10, 7.5, 4, 1.4, [90, 86, 84]);
  return cv;
}

function kennelGate(open: boolean): Canvas {
  const cv = plain((x, y) => grass(x, y));
  cv.rect(0, 3, 2, 16, [110, 76, 44]).rect(18, 3, 2, 16, [110, 76, 44]);
  if (!open) for (let x = 3; x < 18; x += 3) cv.rect(x, 4, 1.5, 14, [150, 104, 60]);
  if (!open) cv.rect(2, 9, 16, 1.5, [150, 104, 60]);
  return cv;
}

function rope(open: boolean): Canvas {
  const cv = plain((x, y) => grass(x, y));
  for (const x of [2, 17]) {
    cv.rect(x - 1, 6, 2.5, 12, [220, 190, 80]);
    cv.disc(x + 0.2, 5.5, 1.8, [240, 210, 110]);
  }
  if (!open) cv.line(2, 8, 17, 8, 1.2, [170, 30, 40]).line(2, 8, 9.5, 11, 1.2, [170, 30, 40]).line(9.5, 11, 17, 8, 1.2, [170, 30, 40]);
  return cv;
}

/** The plaza fountain: a round stone basin, two blocks square, a spout in the middle. */
export function fountain(book: BlockBook): void {
  cutBlocks(book, 'fountain', 2, 2, (cv) => {
    shadow(cv, 3, 5, 36, 33, 0.35);
    cv.ellipse(20, 22, 18, 15, (x, y) => mix([214, 208, 198], [150, 144, 138], clamp01((x - 2) / 40 + (y - 7) / 60)));
    cv.ellipse(20, 22, 14.5, 11.5, (x, y) => water(x, y, 8));
    cv.ellipse(20, 23, 4, 3, [180, 174, 166]);
    cv.rect(18.5, 10, 3, 13, [200, 194, 186]);
    cv.disc(20, 9, 3, [220, 214, 206]);
    for (const dx of [-5, 5]) cv.line(20, 8, 20 + dx, 17, 0.8, [200, 236, 250]);
    cv.ellipse(20, 6, 2, 1.5, [230, 246, 255]);
  });
}

export { STONE, BLUE };
