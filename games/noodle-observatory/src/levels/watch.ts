// The three scenes you watch unfold (Nell walks along, reads and looks; the way on opens when the scene is done):
//   lensroll  FIRST LENS (dusk, the kitchen): the tin monkey rolls a lens along the counter into the old scope and
//             ticks; then the pasta ring rolls up the wall into the window and frames a cheese-colored moon
//   starview  KITCHEN IN THE STARS (the dark loft, after the nine shutters): three shafts of light come on one by one
//             and the stars they show make a spoon, a fork and a colander
//   bakery    A MOST LOCAL MOON (night, the roof): supper is set; the light in the "moon" brightens, and its glow
//             shows a brick wall and a windowsill around it: the bakery's round window next door. Then the pasta
//             ring rolls along the terrace, catches the tablecloth's loose edge and rolls off with it; the dishes stay
import { Pixels, dither } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { SOLID } from '../../../kit/starter/book';
import type { Pal } from '../../../kit/starter/palette';
import { addSign } from '../../../kit/starter/sign';
import { bricks, cabinet, icon, roundLight, shaft, shelf, table, type Icon } from '../art';
import { addSigns, startBook, type Level, type Timed } from '../level';
import { BLOCK_TICKS, CLOTH_GONE, KITCHEN, LENSROLL, LENS_IN, ROOF, SUPPER } from '../monsters';
import { G, paintRoom, type Place, type Step } from '../place';

/** A doorway's two blocks that stay shut until `ticks`, then swing open (the scene is done). */
export function shutUntil(pal: Pal, book: Place['book'], timed: Timed[], ticks: number): void {
  const bg = book.pics.get('bg')!;
  const open = (top: boolean) => {
    const p = new Pixels(20, 20).blit(bg, 0, 0);
    const k = pal.r('cab');
    p.rect(0, 0, 3, 20, k[2]).rect(17, 0, 3, 20, k[2]);
    if (top) p.rect(0, 0, 20, 3, k[2]).rect(0, 0, 20, 1, k[3]);
    // the door swung back against the frame
    p.rect(14, top ? 3 : 0, 3, top ? 17 : 20, k[1]);
    return p;
  };
  book.add('shutTop', cabinet(pal, 0), { solid: SOLID });
  book.add('shutBot', cabinet(pal, 1), { solid: SOLID });
  book.add('openTop', open(true), { grav: 4 });
  book.add('openBot', open(false), { grav: 4 });
  timed.push({ name: 'shutTop', next: 'openTop', ticks }, { name: 'shutBot', next: 'openBot', ticks });
}

const signs = (keys: [string, number][]): Step[] => keys.map(([key, x]) => ({ t: 'sign', x, key }));

/** Where things are in the first scene (columns and rows). */
export const LENSROLL_AT = {
  width: 44,
  desk: [9, 22],
  toy: 10,
  lens: 11,
  scope: 22,
  deskTop: 6,
  window: [29, 4],
  ring: [30, 9],
  door: 40,
  signs: { monkey: 4, rolled: 24, ring: 31, closer: 35 },
} as const;

export function levelLensroll(pal: Pal): Level {
  const A = LENSROLL_AT;
  const { book, timed } = startBook(pal, 'cupboard');
  const bg = book.pics.get('bg')!;
  // the back counter (scenery: Nell walks in front of it) and the old scope at its end
  book.add('deskTop', shelf(pal, bg), { grav: 4 });
  book.add('deskFront', cabinet(pal, 1), { grav: 4 });
  const scope = (lens: boolean) => {
    const p = new Pixels(20, 20).blit(bg, 0, 0);
    const k = pal.r('steel');
    p.line(10, 12, 5, 19, k[1]).line(10, 12, 15, 19, k[1]).line(10, 12, 10, 19, k[0]);
    p.line(3, 9, 17, 3, k[2]).line(3, 10, 17, 4, k[2]).line(3, 11, 17, 5, k[1]);
    p.rect(15, 1, 4, 6, lens ? pal.c('glass', 3) : pal.c('ink', 1)).rect(15, 1, 4, 1, k[4]);
    return p;
  };
  book.add('scope0', scope(false), { grav: 4 });
  book.add('scope1', scope(true), { grav: 4 });
  timed.push({ name: 'scope0', next: 'scope1', ticks: LENS_IN });
  shutUntil(pal, book, timed, LENSROLL.open);
  const s = addSigns(book, pal, {
    monkey: ['MONKEY DAY! THE TIN MONKEY IS ALL WOUND UP.', 4, 3],
    rolled: ['IT ROLLED A LENS INTO THE SCOPE!', 4, 2],
    ring: ['THE RING ROLLED UP THE WALL?', 4, 2],
    closer: ['THAT MOON NEEDS A CLOSER LOOK.', 4, 2],
  });
  const m = paintRoom(book, A.width, [], { windows: [[A.window[0], A.window[1], true]], lamps: [[15, 2]] }, false, s);
  for (let x = A.desk[0]; x <= A.desk[1]; x++) {
    m.set(x, A.deskTop, 'deskTop');
    for (let y = A.deskTop + 1; y < G; y++) m.set(x, y, 'deskFront');
  }
  m.set(A.scope, A.deskTop - 1, 'scope0');
  for (const [k, x] of Object.entries(A.signs)) m.sign(x, G - 1 - s[k].board.length, s[k]);
  m.set(A.door, G - 2, 'shutTop').set(A.door, G - 1, 'shutBot');
  m.mon(KITCHEN.toy, A.toy, A.deskTop - 1).mon(KITCHEN.lens, A.lens, A.deskTop - 1);
  m.mon(KITCHEN.cue, A.toy + LENSROLL.roll - 1, A.deskTop - 2);
  m.mon(KITCHEN.ring, A.ring[0], A.ring[1]);
  return {
    file: 'lensroll',
    title: 'First Lens',
    hint: 'Watch the tin monkey.',
    look: 'dusk',
    map: m,
    book,
    timed,
    mon: 'kitchen',
    song: 'theme',
    hero: 'nell',
    plan: signs(Object.entries(A.signs)),
    watch: true,
  };
}

/** The loft scene's clock: each shape of stars lights up, then the way on opens. */
export const STARVIEW = { spoon: 240, fork: 440, col: 640, open: 840 } as const;
export const STARVIEW_AT = {
  width: 50,
  shapes: { spoon: [13, 4, 2, 4], fork: [22, 4, 2, 4], col: [32, 4, 3, 3] } as Record<'spoon' | 'fork' | 'col', [number, number, number, number]>,
  shafts: { spoon: 11, fork: 20, col: 30 },
  door: 46,
  signs: { set: 3, spoon: 16, fork: 25, col: 36, drawer: 41 },
} as const;

/** A shape drawn in stars on the dark: points of light and a faint dotted line between them. */
function constellation(pal: Pal, shape: 'spoon' | 'fork' | 'col', w: number, h: number, bg: Pixels): Pixels {
  const p = new Pixels(w * 20, h * 20);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.blit(bg, x * 20, y * 20);
  const star = (x: number, y: number) =>
    p
      .rect(x - 1, y, 3, 1, pal.c('warm', 3))
      .rect(x, y - 1, 1, 3, pal.c('warm', 3))
      .set(x, y, pal.c('white', 3));
  const pts: [number, number][] = [];
  if (shape === 'spoon') {
    for (let k = 0; k < 8; k++) pts.push([20 + Math.cos((k / 8) * Math.PI * 2) * 11, 16 + Math.sin((k / 8) * Math.PI * 2) * 13]);
    pts.push([20, 38], [21, 52], [22, 66], [23, 76]);
  } else if (shape === 'fork') {
    for (const x of [10, 16, 24, 30]) pts.push([x, 4], [x, 14]);
    pts.push([20, 24], [20, 40], [20, 56], [20, 74]);
  } else {
    for (let k = 0; k < 10; k++) {
      const a = Math.PI * (k / 9);
      pts.push([30 + Math.cos(a) * 24, 22 + Math.sin(a) * 22]);
    }
    pts.push([4, 22], [56, 22], [22, 30], [30, 34], [38, 30]);
  }
  // the faint line, dot by dot, then the stars over it
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    if (Math.hypot(x1 - x0, y1 - y0) > 18) continue;
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3);
    for (let k = 1; k < n; k++) p.set(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), pal.c('warm', 1));
  }
  for (const [x, y] of pts) star(Math.round(x), Math.round(y));
  return p;
}

export function levelStarview(pal: Pal): Level {
  const A = STARVIEW_AT;
  const { book, timed } = startBook(pal, 'loft', { lean: true });
  const bg = book.pics.get('bg')!;
  shutUntil(pal, book, timed, STARVIEW.open);
  // each shape: dark tiles that light up together, and its shaft of light brightening
  const shaftPic = (k: number) => shaft(pal, bg, k);
  for (const name of ['spoon', 'fork', 'col'] as const) {
    const [, , w, h] = A.shapes[name];
    const lit = constellation(pal, name, w, h, bg);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        book.add(`${name}${x}${y}`, bg, { grav: 4 });
        book.add(`${name}${x}${y}L`, lit.crop(x * 20, y * 20, 20, 20), { grav: 4 });
        timed.push({ name: `${name}${x}${y}`, next: `${name}${x}${y}L`, ticks: STARVIEW[name] });
      }
    book.add(`sh.${name}`, shaftPic(0), { grav: 4 });
    book.add(`sh.${name}L`, shaftPic(2), { grav: 4 });
    timed.push({ name: `sh.${name}`, next: `sh.${name}L`, ticks: STARVIEW[name] });
  }
  const s = addSigns(book, pal, {
    set: ['NINE SHUTTERS SET. NOW LOOK UP!', 4, 2],
    spoon: ['A SPOON...', 4, 2],
    fork: ['A FORK...', 4, 2],
    col: ['AND A COLANDER?', 4, 2],
    drawer: ['THE STARS LOOK LIKE THE KITCHEN DRAWER.', 4, 3],
  });
  const m = paintRoom(book, A.width, [], {}, false, s);
  for (const name of ['spoon', 'fork', 'col'] as const) {
    const [x0, y0, w, h] = A.shapes[name];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) m.set(x0 + x, y0 + y, `${name}${x}${y}`);
    const sx = A.shafts[name];
    m.set(sx, 0, 'shutO');
    for (let y = 1; y < G; y++) m.set(sx, y, `sh.${name}`);
  }
  for (const [k, x] of Object.entries(A.signs)) m.sign(x, G - 1 - s[k].board.length, s[k]);
  m.set(A.door, G - 2, 'shutTop').set(A.door, G - 1, 'shutBot');
  return {
    file: 'starview',
    title: 'Kitchen in the Stars',
    hint: 'Look up.',
    look: 'dark',
    map: m,
    book,
    timed,
    mon: 'kitchen',
    song: 'glass',
    hero: 'nell',
    plan: signs(Object.entries(A.signs)),
    watch: true,
  };
}

/** The last scene's clock and places. */
export const BAKERY = { reveal: 360 } as const;
export const BAKERY_AT = {
  width: 46,
  table: [16, 21],
  moon: [26, 4],
  ring: 21 - SUPPER.toTable,
  door: 42,
  signs: { set: 3, look: 8, sill: 23, bakery: 30 },
} as const;

/** The glow around the window once its light is up: dim bricks, brighter near the window, dithered into the night. */
function bakeryPatch(pal: Pal, bg: Pixels): Pixels {
  const p = new Pixels(80, 80);
  const brick = bricks(pal, true);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) p.blit(brick, x * 20, y * 20);
  const warm = pal.r('warm');
  const slate = pal.r('slate');
  for (let y = 0; y < 80; y++)
    for (let x = 0; x < 80; x++) {
      const d = Math.hypot(x - 39.5, y - 39.5);
      if (d > 38 || (d > 30 && !dither(x, y, (38 - d) / 8))) p.set(x, y, bg.get(x % 20, y % 20));
      else if (d < 24 && p.get(x, y) === slate[1]) p.set(x, y, slate[2]);
      else if (d < 20 && p.get(x, y) === slate[0]) p.set(x, y, warm[0]);
    }
  // the windowsill under the round window
  p.rect(18, 57, 44, 4, pal.c('stone', 4)).rect(18, 61, 44, 2, pal.c('stone', 1));
  return p;
}

export function levelBakery(pal: Pal): Level {
  const A = BAKERY_AT;
  const { book, timed } = startBook(pal, 'roof', { lean: true });
  const bg = book.pics.get('bg')!;
  shutUntil(pal, book, timed, SUPPER.open);
  // the table: clothed and laid, then bare and still laid when the cloth has gone
  const top = (cloth: boolean) => {
    const p = cloth
      ? table(pal, bg, 'top')
      : new Pixels(20, 20).blit(bg, 0, 0).rect(0, 8, 20, 4, pal.c('wood', 3)).rect(0, 8, 20, 1, pal.c('wood', 4)).rect(0, 12, 20, 1, pal.c('wood', 0));
    const things: Icon[] = ['plate', 'cup'];
    const sm = new Pixels(20, 20, 255);
    icon(pal, sm, things[0], 7, 7, 'thing');
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (sm.get(x, y) !== 255 && y < 9) p.set(x, y + (cloth ? -2 : 1), sm.get(x, y));
    p.rect(14, cloth ? 1 : 4, 3, 4, pal.c('teal', 3)).rect(14, cloth ? 1 : 4, 3, 1, pal.c('teal', 4));
    return p;
  };
  book.add('tblC', top(true), { grav: 4 });
  book.add('tblB', top(false), { grav: 4 });
  book.add('tblLeg', table(pal, bg, 'leg'), { grav: 4 });
  timed.push({ name: 'tblC', next: 'tblB', ticks: CLOTH_GONE });
  // the moon, and the window it turns out to be, in the middle of the glow
  const patch = bakeryPatch(pal, bg);
  for (let q = 0; q < 4; q++) {
    const x = q % 2;
    const y = q >> 1;
    const win = roundLight(pal, patch.crop((1 + x) * 20, (1 + y) * 20, 20, 20), q as 0 | 1 | 2 | 3, true);
    book.add(`rw${q}`, win, { grav: 4 });
    timed.push({ name: `moon${q}`, next: `rw${q}`, ticks: BAKERY.reveal });
  }
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++) {
      if ((x === 1 || x === 2) && (y === 1 || y === 2)) continue;
      book.add(`hid${x}${y}`, bg, { grav: 4 });
      book.add(`bak${x}${y}`, patch.crop(x * 20, y * 20, 20, 20), { grav: 4 });
      timed.push({ name: `hid${x}${y}`, next: `bak${x}${y}`, ticks: BAKERY.reveal });
    }
  const s = addSigns(book, pal, {
    set: ['SUPPER IS SET, RIGHT BY THE BEST VIEW.', 4, 3],
    look: ['NOW, ONE MORE LOOK AT THE MOON.', 4, 2],
  });
  // the two signs that would give it away stay blank until the light is up
  for (const [k, text] of [
    ['sill', 'THE MOON HAS A SILL!'],
    ['bakery', "IT IS THE BAKERY'S ROUND WINDOW!"],
  ] as const) {
    const words = addSign(book, pal, k, text, 4, 2);
    const blank = addSign(book, pal, `${k}0`, '. . .', 4, 2);
    words.board.flat().forEach((n, i) => timed.push({ name: blank.board.flat()[i], next: n, ticks: BAKERY.reveal + 20 }));
    s[k] = blank;
  }
  addSigns(book, pal, {});
  const m = paintRoom(book, A.width, [], {}, true, s);
  for (let x = A.table[0]; x <= A.table[1]; x++) m.set(x, G - 2, 'tblC');
  m.set(A.table[0], G - 1, 'tblLeg').set(A.table[1], G - 1, 'tblLeg');
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++) {
      const at = [A.moon[0] - 1 + x, A.moon[1] - 1 + y] as const;
      if ((x === 1 || x === 2) && (y === 1 || y === 2)) m.set(at[0], at[1], `moon${(y - 1) * 2 + (x - 1)}`);
      else m.set(at[0], at[1], `hid${x}${y}`);
    }
  for (const [k, x] of Object.entries(A.signs)) m.sign(x, G - 1 - s[k].board.length, s[k]);
  m.set(A.door, G - 2, 'shutTop').set(A.door, G - 1, 'shutBot');
  for (let x = A.table[0]; x < A.table[1]; x++) m.mon(ROOF.skirt, x, G - 1);
  m.mon(ROOF.skirt + 2, A.table[1], G - 1);
  m.mon(ROOF.ring, A.ring, G - 1);
  void BLOCK_TICKS;
  return {
    file: 'bakery',
    title: 'A Most Local Moon',
    hint: 'One more look at the moon.',
    look: 'reveal',
    map: m,
    book,
    timed,
    mon: 'roof',
    song: 'supper',
    hero: 'nell',
    plan: signs(Object.entries(A.signs)),
    watch: true,
  };
}
