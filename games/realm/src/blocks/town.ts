// TOWN.BBL (Nowish and Laterburg) and PORT.BBL (Someday Harbor and Eventually Falls): cobbled
// streets that curve and run diagonally, stone-edged canals and ponds, clipped hedges and the
// castle's walls as autotile families; cottages, stalls, the throne, the shops' wares and the
// quest gates as painted blocks.
import { ALL, BlockBook, type Attrs } from './book';
import { addFamily, plain } from './autotiles';
import { Canvas, type RGB, mix, clamp01, tnoise, speck } from '../art/rgb';
import { house, tower, shadow, STYLE, type HouseStyle } from '../art/buildings';
import { canopy, cobble, grass, street, water, shapeSdf, TL, TR, type Shader } from '../art/terrain';
import { eggBlock, nestBlock } from '../art/egg';
import { blend } from '../art/textures';
import { C, SEQ, BLK, STEEL_SWINGS } from '../ids';
import { chez } from './worldFeatures';
import { smooth } from '../art/rgb';

const bitsOf = (m: number) => [1, 2, 4, 8].filter((b) => m & b).length;

/** Stone-edged water: canals, the fountain basin, the harbor's quay. */
export const quay: Shader = (x, y, d) => {
  if (d > 3.2) return grass(x, y);
  if (d > 2.4) return [92, 86, 80];
  if (d > 0) {
    const slab = Math.floor((x + y * 0.3) / 5) % 2;
    return mix([188, 180, 166], [160, 152, 140], slab * 0.5 + tnoise(x, y, 2.5, 20, 3) * 0.3);
  }
  if (d > -1.2) return [40, 52, 60];
  return water(x, y, -d + 3);
};

/** Clipped hedges: a dense leafy box with a lit top edge and a shadow at its foot. */
export const hedge: Shader = (x, y, d, nx, ny) => {
  if (d > 0) {
    const sh = clamp01(ny * 1.2 + nx * 0.3) * (1 - smooth(0, 4, d));
    return mix(grass(x, y), [24, 46, 24], sh * 0.7);
  }
  const top = clamp01(-ny) * (1 - smooth(0, 2.5, -d));
  return mix(mix(canopy(x * 1.6, y * 1.6), [40, 90, 40], 0.25), [130, 180, 80], top * 0.6);
};

/** Castle walls: a flagged walkway on top, a coursed stone face where the wall looks south. */
export const castleWall: Shader = (x, y, d, nx, ny) => {
  const face = clamp01(ny * 1.4 - 0.15);
  const faceH = 9 * face;
  void nx;
  if (d > 0) {
    if (d < faceH) {
      const row = Math.floor(y / 3);
      const col = Math.floor((x + (row % 2) * 2.5) / 5);
      const mortar = y % 3 < 0.6 || (x + (row % 2) * 2.5) % 5 < 0.6;
      const t = d / Math.max(1, faceH);
      const c = mix([168, 160, 150], [110, 104, 100], t + speck(col, row, 23, 5) * 0.2);
      return mortar ? mix(c, [70, 66, 64], 0.6) : c;
    }
    const sh = (1 - smooth(faceH, faceH + 4, d)) * Math.max(face, 0.25);
    return mix(grass(x, y), [30, 40, 28], sh * 0.6);
  }
  // the walkway: big flags, a parapet lip at the edge
  if (-d < 1.6) return [214, 206, 194];
  const fx = x % 10;
  const fy = y % 10;
  const c = mix([150, 144, 136], [184, 176, 166], tnoise(Math.floor(x / 10) * 10, Math.floor(y / 10) * 10, 10, 20, 7));
  return fx < 0.6 || fy < 0.6 ? mix(c, [90, 86, 82], 0.6) : c;
};

/** The shared ground and families both town block sets start with. */
export function townGround(book: BlockBook, o: { water?: boolean } = {}): void {
  book.add('grass', plain((x, y) => grass(x, y)));
  for (const k of [1, 2, 3]) book.add(`grass${k}`, plain((x, y) => grass(x, y, k)));
  addFamily(book, { layer: 'street', shader: street, diag: true, rough: 0.5, seed: 31 });
  if (o.water) addFamily(book, { layer: 'water', shader: quay, rough: 0.3, seed: 33, attrs: (m) => (bitsOf(m) >= 2 ? { solid: ALL } : {}) });
  addFamily(book, { layer: 'hedge', shader: hedge, rough: 1.3, seed: 35, attrs: (m) => (bitsOf(m) >= 2 ? { solid: ALL } : {}) });
  book.add('flowers', flowerBox());
  book.add('tree', tree(false), { solid: ALL });
  book.add('pine', tree(true), { solid: ALL });
  book.add('fenceH', fence('h'), { solid: ALL });
  book.add('fenceV', fence('v'), { solid: ALL });
  book.add('sign', signpost(), { solid: ALL });
  book.add('barrels', barrels(), { solid: ALL });
}

// ---------------------------------------------------------------- small things

function flowerBox(): Canvas {
  const cv = plain((x, y) => grass(x, y, 2));
  const cols: RGB[] = [
    [240, 90, 120],
    [250, 220, 90],
    [246, 246, 250],
    [170, 120, 240],
  ];
  for (let k = 0; k < 9; k++) {
    const x = 3 + (k % 3) * 6 + ((k * 7) % 3);
    const y = 4 + Math.floor(k / 3) * 5 + ((k * 5) % 2);
    cv.disc(x + 0.4, y + 0.6, 1.5, [40, 80, 30]);
    cv.disc(x, y, 1.4, cols[k % 4]);
    cv.disc(x, y, 0.5, [250, 200, 60]);
  }
  return cv;
}

function tree(pine: boolean): Canvas {
  const cv = plain((x, y) => grass(x, y));
  cv.ellipse(12, 17.5, 7, 2.2, [30, 50, 26]);
  cv.rect(9, 12, 2.4, 6, [96, 64, 38]);
  if (pine) {
    for (const [y, w] of [
      [2, 3],
      [6, 5.5],
      [10, 7.5],
    ])
      cv.poly(
        [
          [10, y],
          [10 + w, y + 6],
          [10 - w, y + 6],
        ],
        (px, py) => mix([60, 130, 70], [20, 60, 34], clamp01((px - 6) / 10 + (py - y) / 14)),
      );
  } else
    cv.disc(10, 8.5, 7.5, (px, py) => {
      const l = clamp01(1 - Math.hypot(px - 7, py - 5.5) / 10);
      const leaf = tnoise(px, py, 2.5, 20, 77) * 0.3;
      return mix([26, 64, 30], [112, 170, 70], clamp01(l + leaf - 0.1));
    });
  return cv;
}

function fence(dir: 'h' | 'v'): Canvas {
  const cv = plain((x, y) => grass(x, y));
  const wood: RGB = [150, 104, 60];
  if (dir === 'h') {
    cv.rect(0, 8, 20, 2, wood).rect(0, 13, 20, 2, wood);
    for (const x of [2, 12]) cv.rect(x, 5, 2.5, 12, mix(wood, [255, 255, 255], 0.1)).rect(x + 2.5, 6, 0.8, 12, [60, 40, 24]);
  } else {
    cv.rect(8, 0, 2, 20, wood).rect(12, 0, 2, 20, wood);
    for (const y of [3, 13]) cv.rect(7, y, 8, 3, mix(wood, [255, 255, 255], 0.1));
  }
  return cv;
}

export function signpost(): Canvas {
  const cv = plain((x, y) => grass(x, y));
  cv.rect(9, 9, 2, 10, [96, 64, 38]);
  shadow(cv, 2, 4, 16, 7);
  cv.rrect(2, 3, 16, 7, 1.5, [190, 150, 96]);
  for (let k = 0; k < 3; k++) cv.rect(4, 5 + k * 1.6, 12 - k * 3, 0.7, [90, 60, 36]);
  return cv;
}

function barrels(): Canvas {
  const cv = plain((x, y) => grass(x, y));
  for (const [x, y] of [
    [6, 9],
    [14, 12],
  ]) {
    cv.ellipse(x + 1, y + 6, 5, 2, [30, 40, 26]);
    cv.rect(x - 4.5, y - 4, 9, 10, (px) => mix([110, 70, 36], [170, 120, 66], clamp01(1 - Math.abs(px - x) / 5)));
    cv.ellipse(x, y - 4, 4.5, 1.8, [130, 90, 50]);
    cv.rect(x - 4.5, y - 1, 9, 1, [60, 60, 66]).rect(x - 4.5, y + 3, 9, 1, [60, 60, 66]);
  }
  return cv;
}

// ---------------------------------------------------------------- multi-block things

/** Paints a w x h picture over grass and cuts it into blocks `${name}:${x},${y}`; `solid` picks the solid blocks. */
export function cutBlocks(book: BlockBook, name: string, w: number, h: number, paint: (cv: Canvas) => void, solid: (x: number, y: number) => boolean | Attrs = () => true, base?: (x: number, y: number) => RGB): void {
  const cv = new Canvas(w * 20, h * 20).shade(base ?? ((x, y) => grass(x, y)), 2);
  paint(cv);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const s = solid(x, y);
      book.add(`${name}:${x},${y}`, cv.crop(x * 20, y * 20, 20, 20), typeof s === 'object' ? s : s ? { solid: ALL } : {});
    }
}

/** A cottage two blocks square. */
export function cottage(book: BlockBook, name: string, st: HouseStyle, seed: number): void {
  cutBlocks(book, name, 2, 2, (cv) => house(cv, 2, 4, 36, 35, st, seed));
}

/** A big house three blocks square with a sign hanging by the door. */
export function hall(book: BlockBook, name: string, st: HouseStyle, seed: number, sign?: (cv: Canvas, x: number, y: number) => void): void {
  cutBlocks(book, name, 3, 3, (cv) => {
    const { door } = house(cv, 2, 4, 56, 55, { ...st, windows: 2 }, seed);
    if (sign) {
      cv.line(door[0] + 8, 36, door[0] + 14, 36, 0.8, [60, 40, 24]);
      cv.rrect(door[0] + 8, 37, 9, 7, 1, [214, 190, 140]);
      sign(cv, door[0] + 12.5, 40.5);
    }
  }, (x, y) => !(x === 1 && y === 2));
}

/** A market stall: a striped awning over a counter; the wares go on separate counter blocks. */
export function stall(book: BlockBook, name: string, stripe: RGB): void {
  cutBlocks(
    book,
    name,
    2,
    1,
    (cv) => {
      shadow(cv, 1, 2, 38, 16, 0.4);
      cv.rect(2, 2, 2, 16, [110, 76, 44]).rect(36, 2, 2, 16, [110, 76, 44]);
      cv.poly(
        [
          [0, 3],
          [40, 3],
          [38, 12],
          [2, 12],
        ],
        (x, y) => (Math.floor(x / 5) % 2 ? mix(stripe, [0, 0, 0], (y - 3) / 30) : mix([246, 240, 226], [200, 190, 170], (y - 3) / 10)),
      );
      for (let x = 2; x < 38; x += 5) cv.disc(x + 2.5, 12.5, 2.5, Math.floor(x / 5) % 2 ? stripe : [240, 234, 220]);
    },
    () => true,
  );
}

/** A counter-top block with something on it (painted by `ware`). */
export function counter(ware?: (cv: Canvas) => void): Canvas {
  const cv = plain((x, y) => grass(x, y));
  shadow(cv, 0, 5, 20, 14, 0.35);
  cv.rect(0, 4, 20, 9, (x, y) => mix([196, 150, 96], [150, 106, 62], clamp01((y - 4) / 9 + tnoise(x, y, 2.5, 20, 41) * 0.2)));
  cv.rect(0, 13, 20, 6, (_x, y) => mix([120, 80, 46], [86, 56, 32], (y - 13) / 6));
  cv.rect(0, 12.5, 20, 0.8, [230, 196, 140]);
  ware?.(cv);
  return cv;
}

export const wares = {
  sword: (cv: Canvas) => {
    cv.line(4, 10, 16, 5, 1.3, [210, 216, 230]);
    cv.line(5, 10.5, 15, 6.2, 0.5, [255, 255, 255]);
    cv.line(4.5, 7.5, 6, 12, 1.2, [220, 180, 60]);
    cv.line(2, 11.5, 4.5, 10, 1.4, [110, 70, 40]);
  },
  tonic: (cv: Canvas) => {
    for (const x of [5, 10, 15]) {
      cv.rrect(x - 2, 4, 4, 6, 1.5, [60, 170, 160]);
      cv.rect(x - 0.8, 2, 1.6, 2.4, [150, 100, 60]);
      cv.rect(x - 1.2, 5, 0.8, 3, [200, 250, 240]);
    }
  },
  tonicOne: (cv: Canvas) => {
    cv.rrect(8, 3, 4, 7, 1.5, [60, 170, 160]);
    cv.rect(9.2, 1, 1.6, 2.4, [150, 100, 60]);
    cv.rect(8.8, 4, 0.8, 3, [200, 250, 240]);
  },
  lamp: (cv: Canvas) => {
    cv.rrect(7, 3, 6, 7, 1, [180, 130, 40]);
    cv.rect(8, 4.5, 4, 4, [255, 230, 120]);
    cv.line(8, 3, 10, 1, 0.6, [80, 60, 30]).line(12, 3, 10, 1, 0.6, [80, 60, 30]);
  },
  feather: (cv: Canvas) => {
    cv.line(5, 10, 15, 2, 0.6, [200, 160, 60]);
    for (let k = 0; k < 8; k++) cv.line(6 + k * 1.2, 9 - k, 4 + k * 1.2, 5 - k * 0.8, 1, mix([255, 120, 40], [255, 230, 120], k / 8));
  },
  reeds: (cv: Canvas) => {
    for (let k = 0; k < 4; k++) cv.line(4 + k * 3, 10, 6 + k * 3, 3, 1, [230, 200, 120]);
    cv.rect(3, 7, 14, 1.2, [180, 40, 40]);
  },
  sold: (cv: Canvas) => {
    cv.rrect(4, 4, 12, 6, 1, [240, 230, 200]);
    cv.line(6, 7, 14, 7, 1, [190, 40, 30]);
  },
  bed: (cv: Canvas) => {
    cv.rrect(2, 3, 16, 9, 2, [230, 226, 214]);
    cv.rrect(3, 3.5, 5, 3, 1, [255, 255, 255]);
    cv.rect(2, 7, 16, 5, [170, 50, 50]);
  },
  bedUsed: (cv: Canvas) => {
    cv.rrect(2, 3, 16, 9, 2, [230, 226, 214]);
    cv.rect(2, 6, 16, 6, (x, y) => mix([170, 50, 50], [120, 30, 30], (Math.sin(x + y) + 1) / 2));
  },
};

/** A shop's buy chain as counter blocks: pay at `name`, collect at `name`+'2', then the empty counter. */
export function buyChain(book: BlockBook, name: string, price: number, give: Attrs, ware: (cv: Canvas) => void, after: (cv: Canvas) => void = wares.sold): void {
  book.add(name, counter(ware), { solid: ALL, effect: C.money, eamt: -price, touch: `${name}2` });
  book.add(`${name}2`, counter(ware), { solid: ALL, ...give, touch: `${name}3` });
  book.add(`${name}3`, counter(after), { solid: ALL });
}

/**
 * A gate that asks "do you have more than k?": `name` takes k (Game-Maker refuses the touch,
 * and the gate stays shut, when the counter can't pay), turns into `name`+'2' which gives k
 * straight back as Pip steps through (or keeps it when `keep` is false), then plain `open`.
 */
export function gate(book: BlockBook, name: string, counterNo: number, k: number, shut: Canvas, open: Canvas, giveBack = true, extra: Attrs = {}): void {
  book.add(name, shut, { solid: ALL, effect: counterNo, eamt: -k, touch: `${name}2` });
  book.add(`${name}2`, open, giveBack ? { effect: counterNo, eamt: k, touch: `${name}3`, ...extra } : { touch: `${name}3`, ...extra });
  book.add(`${name}3`, open, {});
}

/** The felt egg (block 149 in every set) and, where it hides, the nest it comes and goes in. */
export function eggBlocks(book: BlockBook, withNest: boolean): void {
  const ground = (x: number, y: number) => grass(x, y);
  if (!withNest) {
    book.add('egg', eggBlock(ground), { obj: 1, effect: C.egg, eamt: 1 });
    return;
  }
  // The nest shows the egg for four seconds in every twenty-four: a block that changes into
  // block 149 after a time and back again. Pick it up (Enter) while it is there.
  book.add('nest', nestBlock(ground), { next: 'egg', ntime: 364 });
  book.add('egg', eggBlock(ground), { obj: 1, effect: C.egg, eamt: 1, next: 'nest', ntime: 73, touch: 'nestEmpty' });
  book.add('nestEmpty', nestBlock(ground), {});
}

export { cobble, tower, STYLE, speck, shapeSdf, TL, TR, chez, SEQ, BLK, STEEL_SWINGS, blend };
