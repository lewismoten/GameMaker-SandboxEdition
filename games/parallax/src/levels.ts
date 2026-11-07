// PARALLAX's two levels. Each is one screen, 16 blocks by 10, that never scrolls, and Rima
// walks along the path at the bottom while bands of the picture slide left behind her.
//
//   1. Three Speeds: the far hills, the town and the fence slide past at 0.5, 1 and 4 pixels
//      a tick. Each band is a row of one block that is a ring of pictures (see view.ts), so
//      the nearer a band is, the faster it goes, and the screen gets deep.
//   2. Drifting Clouds: the same trick up in the sky: faint wisps far off and a nearer cloud
//      drift at 0.25 and 0.5 pixels a tick over the slow hills. Three suns in the sky fill in
//      one by one, and when the last one fills the bars across the door lift.
// Both rooms are closed in by hedges you can see, so Rima is never stopped by something she can't.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Book, PULL, SOLID } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { CLEAR, backOf, layerOf, stillCell, type BandName } from './scene';
import { CLOUDS, COLS, DOOR_COL, FENCE, GROUND_ROW, HILLS, ROWS, START, TOWN, WIDTH, WISPS, ringSize, type Band } from './view';

export type SignName = 'speeds' | 'ring' | 'sky' | 'suns';

/** The sign boards' size in blocks: four across, three high, hung on two posts. */
const SIGN = { w: 4, h: 3 } as const;
/** Where a sign's top-left block is, either side of the middle (its posts stand on row 3). */
const SIGN_AT = { left: [1, 0], right: [11, 0] } as const;
const SIGN_WORDS: Record<SignName, string> = {
  speeds: 'FAR HILLS CRAWL, THE FENCE RACES',
  ring: 'A BAND IS A RING OF BLOCKS, THE POSTS TOO',
  sky: 'CLOUDS DRIFT AT TWO SPEEDS',
  suns: 'THE DOOR OPENS WHEN THE SUNS FILL',
};

/** Ticks (18.2 to the second) after level 2 starts that the next sun fills; the door opens with the last. */
export const SUN_AT = [100, 200, 300] as const;
export const OPENS_AT = SUN_AT[2];
/** The suns' columns on row 2. */
export const SUN_COLS = [6, 7, 8] as const;

/** A block that turns into another after some ticks (patched into the finished .BBL). */
interface Timed {
  name: string;
  next: string;
  ticks: number;
}

const AIR = { grav: PULL.down };

/** The pixels of a 20x20 cell of a picture. */
const keyOf = (p: Pixels): string => p.px.join(',');

/** Picture k of a ring: `layer` moved `dx` pixels left (wrapping at 20) over its still `back`. */
function shifted(back: Pixels, layer: Pixels, dx: number): Pixels {
  const p = new Pixels(20, 20, 0);
  p.px.set(back.px);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const v = layer.get((x + dx) % 20, y);
      if (v !== CLEAR) p.set(x, y, v);
    }
  return p;
}

/** The block set a level draws with, and the pictures that fill it. */
export class Stage {
  readonly book = new Book('bbl');
  readonly timed: Timed[] = [];
  readonly signs = {} as Record<SignName, Sign>;
  private readonly scratch = new Book('bbl');
  private readonly names = new Map<string, string>();
  /** The bands this level slides, by name (ring() adds them). */
  private readonly sliding = new Map<BandName, Band>();

  constructor(readonly pal: Pal) {
    addStarterBlocks(this.book, pal);
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

  /** A band at rest (picture 0): what the row looks like when it is not sliding, and what a sign is drawn over. */
  at(name: BandName, k = 0, band?: Band): Pixels {
    return shifted(backOf(this.pal, name), layerOf(this.pal, name), k * (band?.shift ?? 0));
  }

  /** The band as a ring of blocks `${name}0` ... that turn into each other in turn; the map uses `${name}0`. */
  ring(name: BandName, band: Band): string {
    const n = ringSize(band);
    if (!Number.isInteger(n)) throw new Error(`${name}: a ${band.shift} px step never comes back round in 20 px`);
    this.sliding.set(name, band);
    for (let k = 0; k < n; k++) {
      this.book.add(`${name}${k}`, this.at(name, k, band), AIR);
      this.timed.push({ name: `${name}${k}`, next: `${name}${(k + 1) % n}`, ticks: band.ticks });
    }
    return `${name}0`;
  }

  /** The still cell at (x, y) with nothing sliding there. */
  still(y: number): Pixels {
    return stillCell(this.pal, y);
  }

  /** What is drawn at (x, y) before a sign or door goes over it. */
  under(y: number, bands: Partial<Record<number, BandName>>): Pixels {
    const b = bands[y];
    return b ? this.at(b) : this.still(y);
  }

  /** A starter block (a sign board, a door) drawn over what is behind it: its sky-colored corners show the scene. */
  over(src: Pixels, under: Pixels): Pixels {
    const sky = skyOf(this.pal);
    const out = new Pixels(20, 20, 0);
    out.px.set(under.px);
    return out.map((x, y, c) => (src.get(x, y) !== sky ? src.get(x, y) : c));
  }

  /**
   * `src` (a sign post) over a sliding band, as a ring of its own that keeps step with the band's:
   * the same number of pictures, the same wait, and it starts with the band, so the band slides
   * on behind the post instead of standing still there. Both legs of both signs share it.
   */
  private ringOver(src: string, name: BandName, band: Band): string {
    const pre = `${src}~${name}`;
    if (!this.book.has(`${pre}0`)) {
      const n = ringSize(band);
      for (let k = 0; k < n; k++) {
        this.book.add(`${pre}${k}`, this.over(this.scratch.pics.get(src)!, this.at(name, k, band)), AIR);
        this.timed.push({ name: `${pre}${k}`, next: `${pre}${(k + 1) % n}`, ticks: band.ticks });
      }
    }
    return `${pre}0`;
  }

  /**
   * The sign `n` stamped on the map with its top-left block at (x, y), and its posts under it.
   * A post on a sliding band is a ring that slides with it (ringOver). The board stays one
   * picture: only a 1-pixel rim of it shows what is behind, and a ring for each of its cells
   * would cost more blocks than a level may have.
   */
  sign(m: StarterMap, n: SignName, at: readonly [number, number], bands: Partial<Record<number, BandName>>): void {
    const { board, legs } = this.signs[n];
    const put = (src: string, x: number, y: number) => m.set(x, y, this.plain(this.over(this.scratch.pics.get(src)!, this.under(y, bands))));
    const post = (src: string, x: number, y: number) => {
      const b = bands[y];
      const band = b && this.sliding.get(b);
      if (b && band) m.set(x, y, this.ringOver(src, b, band));
      else put(src, x, y);
    };
    board.forEach((row, dy) => row.forEach((name, dx) => put(name, at[0] + dx, at[1] + dy)));
    post(legs[0], at[0], at[1] + board.length);
    post(legs[1], at[0] + SIGN.w - 1, at[1] + board.length);
  }

  /** A copy of a door block with two red and white bars across it. */
  barred(door: Pixels, top: boolean): Pixels {
    const { c } = this.pal;
    const p = new Pixels(20, 20, 0);
    p.px.set(door.px);
    for (const y0 of top ? [4, 12] : [2, 10]) {
      for (let x = 0; x < 20; x++) p.rect(x, y0, 1, 5, Math.floor(x / 4) % 2 ? c('white', 3) : c('red', 2));
      p.rect(0, y0, 20, 1, c('ink', 0)).rect(0, y0 + 4, 20, 1, c('ink', 0));
    }
    return p;
  }

  /** The exit door standing on the lawn at column `x`, its bottom on row 8. */
  door(m: StarterMap, x: number): void {
    const top = this.book.pics.get('doorTop')!;
    const bottom = this.book.pics.get('doorBottom')!;
    m.set(x, GROUND_ROW - 2, this.plain(this.over(top, this.still(GROUND_ROW - 2))));
    m.set(x, GROUND_ROW - 1, this.plain(this.over(bottom, this.still(GROUND_ROW - 1))));
  }

  /** A cell that is a different picture at each stage, turning into the next after SUN_AT[s] (minus the last change). Cells that end up the same share blocks. */
  chain(stages: { pic: Pixels; solid: boolean }[]): string {
    const keys = stages.map((s) => `${s.solid ? 'S' : 'A'}${keyOf(s.pic)}`);
    const make = (i: number): string => {
      const rest = keys.slice(i);
      if (rest.every((k) => k === rest[0])) return this.plain(stages[i].pic, stages[i].solid);
      const id = `t${i}:${rest.join('|')}`;
      let name = this.names.get(id);
      if (!name) {
        name = `c${this.names.size}`;
        this.names.set(id, name);
        this.book.add(name, stages[i].pic, stages[i].solid ? { solid: SOLID } : AIR);
        this.timed.push({ name, next: make(i + 1), ticks: SUN_AT[i] - (i ? SUN_AT[i - 1] : 0) });
      }
      return name;
    };
    return make(0);
  }

  /** A sun in the sky, empty (just a ring) or full. */
  sun(full: boolean): Pixels {
    const { c } = this.pal;
    const p = new Pixels(20, 20, c('sky', 3));
    p.disc(9.5, 10, 6.5, c('gold', 2));
    p.disc(9.5, 10, 5, full ? c('gold', 3) : c('sky', 3));
    if (full) {
      p.disc(8, 8.5, 2.2, c('gold', 5));
      for (const [x, y] of [
        [9, 1],
        [9, 17],
        [1, 9],
        [17, 9],
        [3, 3],
        [15, 3],
        [3, 15],
        [15, 15],
      ] as const)
        p.rect(x, y, 2, 2, c('gold', 3));
    }
    return p;
  }
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  /** The level's own block set (px1.bbl, px2.bbl). */
  st: Stage;
}

/** The still scenery on every cell of the screen, the hedges at both sides, Rima's start and the door. */
function paint(st: Stage, resting: Partial<Record<number, BandName>>): StarterMap {
  const g = new Grid(WIDTH, ROWS);
  g.put(START[0], START[1] - 1, 's').put(START[0], START[1], 'S');
  g.put(DOOR_COL, GROUND_ROW - 2, 'e').put(DOOR_COL, GROUND_ROW - 1, 'E');
  const m = new StarterMap(st.book, g.rows());
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) m.set(x, y, st.plain(st.under(y, resting), y === GROUND_ROW));
  // hedges close the room in at both sides, from row 4 down to the path (the path's own row runs under them)
  for (const x of [0, COLS - 1]) for (let y = 4; y < GROUND_ROW; y++) m.set(x, y, 'edge');
  return m;
}

/** Lays a ring along a whole row. */
const slide = (st: Stage, m: StarterMap, name: BandName, band: Band): void => {
  const first = st.ring(name, band);
  for (let x = 0; x < COLS; x++) if (!(band.row >= 4 && (x === 0 || x === COLS - 1))) m.set(x, band.row, first);
};

/** Level 1: three bands, three speeds. */
function threeSpeeds(st: Stage): StarterMap {
  const here = { 3: 'hills', 4: 'town', 5: 'fence' } as const;
  const m = paint(st, here);
  slide(st, m, 'hills', HILLS);
  slide(st, m, 'town', TOWN);
  slide(st, m, 'fence', FENCE);
  st.sign(m, 'speeds', SIGN_AT.left, here);
  st.sign(m, 'ring', SIGN_AT.right, here);
  st.door(m, DOOR_COL);
  return m;
}

/** Level 2: clouds at two speeds over the slow hills, three suns, a barred door. */
function driftingClouds(st: Stage): StarterMap {
  const here = { 3: 'hills', 4: 'town', 5: 'fence' } as const;
  const m = paint(st, here); // the town and the fence stand still in this level
  slide(st, m, 'wisps', WISPS);
  slide(st, m, 'clouds', CLOUDS);
  slide(st, m, 'hills', HILLS);
  st.sign(m, 'sky', SIGN_AT.left, { 0: 'wisps', 1: 'clouds', ...here });
  st.sign(m, 'suns', SIGN_AT.right, { 0: 'wisps', 1: 'clouds', ...here });
  // the suns: each fills at its time
  SUN_COLS.forEach((x, i) => m.set(x, 2, st.chain([0, 1, 2, 3].map((s) => ({ pic: st.sun(s > i), solid: false })))));
  // the door is barred (solid, red and white bars across it) until the last sun is full, then it opens
  for (const [y, name] of [
    [GROUND_ROW - 2, 'doorTop'],
    [GROUND_ROW - 1, 'doorBottom'],
  ] as const) {
    const under = st.still(y);
    const open = st.over(st.book.pics.get(name)!, under);
    const shut = st.over(st.barred(st.book.pics.get(name)!, name === 'doorTop'), under);
    m.set(DOOR_COL, y, st.chain([shut, shut, shut, open].map((pic, i) => ({ pic, solid: i < 3 }))));
  }
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

/** The levels in order. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'parallax');
  const one = new Stage(pal);
  const two = new Stage(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Three Speeds', hint: 'Far is slow. Near is fast.', map: threeSpeeds(one), st: one },
    { file: 'two', title: 'Drifting Clouds', hint: 'Wait for the suns.', map: driftingClouds(two), st: two },
  ];
  return { pal, levels };
}
