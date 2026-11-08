// HEAT WAVES' three levels: the sky with two signs, three rows of far hills (rows 4 to 6), and the
// road Kit walks along. Levels 1 and 3 are one screen, 16 blocks by 10, that never scrolls; level 2
// is a long road that scrolls.
//
//   1. The Wobble: every hills block is a ring of 6 pictures, the same picture moved 1, 2, 1, -1, -2
//      and -1 pixels. Left of the rock in the middle every row starts on picture 0, so the three rows
//      sway together, like jelly. Right of it each row starts a picture behind the row under it, so
//      the sway climbs from the ground up, the way hot air wobbles what is behind it.
//   2. The Mirage: the hills wobble as on the right of level 1, and a shiny puddle lies on the road
//      ahead, then another. Each is two monsters that hide (a long jump down, out of sight) when Kit
//      comes within 8 blocks, which is just after the view running on ahead of him shows them.
//   3. Cool Evening: the same hills as still blocks, and the scene loads the evening palette.
// Both sides of the screen are rock walls you can see, so Kit is never stopped by something he can't.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Book, PULL, SOLID } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { MIRAGE } from './monsters';
import { buildPalettes } from './palettes';
import { BAND_W, CLEAR, bandCell, bandPicture, rockCell, stillCell } from './scene';
import { COLS, DOOR_COL, GROUND_ROW, HAZE_ROWS, LAG, LONG, LONG_SIGNS, PUDDLES, ROCK_COLS, ROWS, START, SWAY, SWAY_TICKS } from './view';

export type SignName = 'jelly' | 'rises' | 'puddle' | 'mirage' | 'palette' | 'still';

/** The sign boards' size in blocks: four across, three high, hung on two posts in the sky. */
const SIGN = { w: 4, h: 3 } as const;
/** Where a sign's top-left block is (its posts stand on row 3, above the hills). */
const SIGN_AT = { left: [1, 0], right: [11, 0] } as const;
const SIGN_WORDS: Record<SignName, string> = {
  jelly: 'ALL ROWS SWAY TOGETHER. IT LOOKS LIKE JELLY',
  rises: 'EACH ROW SWAYS AFTER THE ROW UNDER IT, LIKE HOT AIR',
  puddle: 'A PUDDLE ON THE ROAD? WALK UP TO IT',
  mirage: 'A MIRAGE! A MONSTER THAT HIDES WHEN YOU COME NEAR',
  palette: 'SAME PICTURES, COOL COLORS: A NEW PALETTE',
  still: 'NO HEAT TONIGHT: THE HILL BLOCKS STAY STILL',
};

/** A block that turns into another after some ticks (patched into the finished .BBL). */
interface Timed {
  name: string;
  next: string;
  ticks: number;
}

const AIR = { grav: PULL.down };
const keyOf = (p: Pixels): string => p.px.join(',');

/** The block set a level draws with, and the pictures that fill it. */
export class Stage {
  readonly book = new Book('bbl');
  readonly timed: Timed[] = [];
  readonly signs = {} as Record<SignName, Sign>;
  readonly band: Pixels;
  private readonly scratch = new Book('bbl');
  private readonly names = new Map<string, string>();

  constructor(readonly pal: Pal) {
    addStarterBlocks(this.book, pal);
    this.band = bandPicture(pal);
    for (const n of Object.keys(SIGN_WORDS) as SignName[]) this.signs[n] = addSign(this.scratch, pal, n, SIGN_WORDS[n], SIGN.w, SIGN.h);
  }

  /** A block of this picture (the same picture is the same block), solid or air. */
  plain(pic: Pixels, solid = false): string {
    const key = `${solid ? 'S' : 'A'}${keyOf(pic)}`;
    let name = this.names.get(key);
    if (!name) {
      name = `v${this.names.size}`;
      this.names.set(key, name);
      this.book.add(name, pic, solid ? { solid: SOLID } : AIR);
    }
    return name;
  }

  /** The hills at column x of band row r (0 top to 2 bottom), moved `s` pixels. */
  hills(r: number, x: number, s = 0): Pixels {
    return bandCell(this.band, r, x % (BAND_W / 20), s);
  }

  /**
   * The wobbling hills at column x of band row r, starting on picture `start` of the ring: the ring's 6 blocks
   * `w${r}${col}.0` to `.5` turn into each other in turn, every SWAY_TICKS ticks. A cell whose 6 pictures are all
   * the same (only sky) is a plain block.
   */
  wobble(r: number, x: number, start: number): string {
    const col = x % (BAND_W / 20);
    const pics = SWAY.map((s) => this.hills(r, col, s));
    if (pics.every((p) => keyOf(p) === keyOf(pics[0]))) return this.plain(pics[0]);
    const base = `w${r}${col}`;
    if (!this.book.has(`${base}.0`))
      pics.forEach((p, f) => {
        this.book.add(`${base}.${f}`, p, AIR);
        this.timed.push({ name: `${base}.${f}`, next: `${base}.${(f + 1) % SWAY.length}`, ticks: SWAY_TICKS });
      });
    return `${base}.${((start % SWAY.length) + SWAY.length) % SWAY.length}`;
  }

  /** What is drawn at (x, y) before a sign, a door or a rock goes over it: the hills at rest, or the still scenery. */
  under(x: number, y: number): Pixels {
    const r = HAZE_ROWS.indexOf(y as (typeof HAZE_ROWS)[number]);
    return r >= 0 ? this.hills(r, x) : stillCell(this.pal, y, x);
  }

  /** A picture drawn over what is behind it: its `clear` color shows the scene. */
  over(src: Pixels, under: Pixels, clear = skyOf(this.pal)): Pixels {
    const out = new Pixels(20, 20, 0);
    out.px.set(under.px);
    return out.map((x, y, c) => (src.get(x, y) !== clear ? src.get(x, y) : c));
  }

  /** The sign `n` stamped on the map with its top-left block at (x, y), and its posts under it. */
  sign(m: StarterMap, n: SignName, at: readonly [number, number]): void {
    const { board, legs } = this.signs[n];
    const put = (src: string, x: number, y: number) => m.set(x, y, this.plain(this.over(this.scratch.pics.get(src)!, this.under(x, y))));
    board.forEach((row, dy) => row.forEach((name, dx) => put(name, at[0] + dx, at[1] + dy)));
    put(legs[0], at[0], at[1] + board.length);
    put(legs[1], at[0] + SIGN.w - 1, at[1] + board.length);
  }

  /** The exit door standing on the road at column `x`, its bottom on row 8. */
  door(m: StarterMap, x: number): void {
    for (const [y, name] of [
      [GROUND_ROW - 2, 'doorTop'],
      [GROUND_ROW - 1, 'doorBottom'],
    ] as const)
      m.set(x, y, this.plain(this.over(this.book.pics.get(name)!, this.under(x, y))));
  }

  /** Level 1's near rock, two blocks wide, rows 4 to 8: a small butte in front of the hills (its sides slope out to the foot), which Kit walks in front of. */
  middleRock(m: StarterMap): void {
    const [x0] = ROCK_COLS;
    const pic = new Pixels(40, 100, CLEAR);
    for (let y = 0; y < 100; y++) {
      const inset = Math.round(9 - y * 0.08);
      const row = rockCell(this.pal, 4 + Math.floor(y / 20), false).crop(0, y % 20, 20, 1);
      for (let x = inset; x < 40 - inset; x++) pic.set(x, y, row.get(x % 20, 0));
      pic.rect(40 - inset - 5, y, 4, 1, this.pal.c('rock', 0)); // the shady side
      pic.set(inset, y, this.pal.c('rock', 2));
    }
    pic.rect(9, 0, 22, 2, this.pal.c('rock', 3)).rect(9, 2, 22, 1, this.pal.c('rock', 2));
    for (let dy = 0; dy < 5; dy++)
      for (let dx = 0; dx < 2; dx++) m.set(x0 + dx, 4 + dy, this.plain(this.over(pic.crop(dx * 20, dy * 20, 20, 20), this.under(x0 + dx, 4 + dy), CLEAR)));
  }
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  /** The palette file the level's scene loads. */
  palette: 'hot.pal' | 'cool.pal';
  map: StarterMap;
  /** The level's own block set (hw1.bbl ...). */
  st: Stage;
  /** The level scrolls (level 2's long road). */
  scrolls: boolean;
}

/** The still scenery on every cell, the rock walls at the left and at `wall`, Kit's start and the door. */
function paint(st: Stage, width = COLS, wall = COLS - 1, door = DOOR_COL): StarterMap {
  const g = new Grid(width, ROWS);
  g.put(START[0], START[1] - 1, 's').put(START[0], START[1], 'S');
  g.put(door, GROUND_ROW - 2, 'e').put(door, GROUND_ROW - 1, 'E');
  const m = new StarterMap(st.book, g.rows());
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < width; x++) m.set(x, y, st.plain(st.under(x, y), y === GROUND_ROW));
  // rock walls close the road in at both ends, from the hills down to the road
  for (const x of [0, wall]) for (let y = 4; y < GROUND_ROW; y++) m.set(x, y, st.plain(rockCell(st.pal, y, y === 4), true));
  st.door(m, door);
  return m;
}

/** Lays the wobbling hills on columns `from` to `to`; `startOf(r)` is the picture band row r starts on. */
function lay(st: Stage, m: StarterMap, from: number, to: number, startOf: (r: number) => number): void {
  for (let x = from; x <= to; x++) HAZE_ROWS.forEach((y, r) => m.set(x, y, st.wobble(r, x, startOf(r))));
}

/** The rippling start: the bottom row on picture 0, each row above LAG pictures behind the one under it. */
const rising = (r: number): number => -LAG * (HAZE_ROWS.length - 1 - r);

/** Level 1: the same wobble, laid two ways. */
function theWobble(st: Stage): StarterMap {
  const m = paint(st);
  lay(st, m, 1, ROCK_COLS[0] - 1, () => 0);
  lay(st, m, ROCK_COLS[1] + 1, COLS - 2, rising);
  st.middleRock(m);
  st.sign(m, 'jelly', SIGN_AT.left);
  st.sign(m, 'rises', SIGN_AT.right);
  return m;
}

/** Level 2: a long road, rising wobble all the way along, and two puddles on the road ahead. */
function theMirage(st: Stage): StarterMap {
  const m = paint(st, LONG.width, LONG.wall, LONG.door);
  lay(st, m, 1, LONG.wall - 1, rising);
  lay(st, m, LONG.wall + 1, LONG.width - 1, rising);
  st.sign(m, 'puddle', [LONG_SIGNS.puddle, 0]);
  st.sign(m, 'mirage', [LONG_SIGNS.mirage, 0]);
  for (const x of PUDDLES) m.mon(MIRAGE, x, GROUND_ROW - 1).mon(MIRAGE + 1, x + 1, GROUND_ROW - 1);
  return m;
}

/** Level 3: the hills at rest, in the evening palette. */
function coolEvening(st: Stage): StarterMap {
  const m = paint(st);
  st.sign(m, 'palette', SIGN_AT.left);
  st.sign(m, 'still', SIGN_AT.right);
  return m;
}

/** The finished block set: the book's, with each timed block given its next block and its ticks. */
export function finishBlocks(st: Pick<Stage, 'book' | 'timed'>): Block[] {
  const blocks = st.book.finish();
  for (const t of st.timed) {
    const b = blocks[st.book.n(t.name)];
    b.nextBl = st.book.n(t.next);
    b.ntime = t.ticks;
  }
  return blocks;
}

/** The levels in order, and the two palettes. */
export function buildLevels(): { pal: Pal; hot: Uint8Array; cool: Uint8Array; levels: Level[] } {
  const { pal, hot, cool } = buildPalettes();
  const [one, two, three] = [new Stage(pal), new Stage(pal), new Stage(pal)];
  const levels: Level[] = [
    { file: 'one', title: 'The Wobble', hint: 'Hot air makes the hills sway.', palette: 'hot.pal', map: theWobble(one), st: one, scrolls: false },
    { file: 'two', title: 'The Mirage', hint: 'Is that water on the road?', palette: 'hot.pal', map: theMirage(two), st: two, scrolls: true },
    { file: 'three', title: 'Cool Evening', hint: 'The heat is gone.', palette: 'cool.pal', map: coolEvening(three), st: three, scrolls: false },
  ];
  return { pal, hot, cool, levels };
}
