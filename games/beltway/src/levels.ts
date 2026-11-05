// ROUND AND ROUND's two levels. Each is one screen, 16 blocks by 10, that never scrolls. Kit walks
// along the bottom row.
//
//   1. The Road Goes By: Kit stands on the bed of a truck. Behind him the hills, the trees and a rail
//      slide past, each a short ring of blocks: every block turns into the next after a few ticks and the
//      last turns back into the first, so the strip slides forever. Near things slide faster. Nothing
//      moves but the pictures, and the truck never goes anywhere.
//   2. Round the Loop: a car drives round a track in the sky. The car is a monster whose path ends where
//      it began, so it goes round forever, turned a quarter at a time as it climbs. A lamp lights for each
//      lap, and when the third is lit the bars across the door lift. The lamps run on the clock: a block
//      cannot see a car.
// Both rooms are closed in by things you can see (a tail board, a cab, hedges), so Kit is never stopped by something he can't.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Book, PULL, SOLID } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { CAR } from './monsters';
import { drawLoop, drawRoad, lamp, stripAt } from './scene';
import { CAR_AT, COLS, DOOR2_COL, DOOR_COL, GROUND_ROW, HILLS, LAMPS, LAP, LAPS, RAIL, ROWS, START, TILE, TREES, type Strip } from './view';

export type SignName = 'ring' | 'speed' | 'loop' | 'lamps';

/** Where each sign's top-left block is, and its size in blocks (a board on two posts that stand on the row under it). */
const SIGNS: Record<SignName, { at: readonly [number, number]; w: number; h: number; words: string }> = {
  ring: { at: [1, 5], w: 4, h: 3, words: 'THE LAST BLOCK TURNS BACK INTO THE FIRST' },
  speed: { at: [7, 5], w: 4, h: 3, words: 'NEAR THINGS SLIDE FASTER' },
  loop: { at: [1, 6], w: 4, h: 2, words: 'END WHERE YOU START AND IT LOOPS' },
  lamps: { at: [10, 6], w: 3, h: 2, words: 'LAMPS COUNT THE LAPS' },
};

/** Ticks after the scene starts that the third lamp lights and the door opens. */
export const OPENS_AT = LAP * LAPS;

/** A block that turns into another after some ticks (patched into the finished .BBL). */
interface Timed {
  name: string;
  next: string;
  ticks: number;
}

const AIR = { grav: PULL.down };

/** The pixels of a 20x20 cell of a picture. */
const cellOf = (pic: Pixels, x: number, y: number): Pixels => pic.crop(x * 20, y * 20, 20, 20);
const keyOf = (p: Pixels): string => p.px.join(',');

/** The block set one level uses, and the pictures that fill it. */
class Stage {
  readonly book = new Book('bbl');
  readonly timed: Timed[] = [];
  readonly signs = {} as Record<SignName, Sign>;
  private readonly scratch = new Book('bbl');
  private readonly names = new Map<string, string>();

  constructor(
    readonly pal: Pal,
    readonly base: Pixels,
    signNames: SignName[],
  ) {
    addStarterBlocks(this.book, pal);
    for (const n of signNames) this.signs[n] = addSign(this.scratch, pal, n, SIGNS[n].words, SIGNS[n].w, SIGNS[n].h);
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

  /** The base picture's cell as a block. */
  scene(x: number, y: number, solid = false): string {
    return this.plain(cellOf(this.base, x, y), solid);
  }

  /** A starter block (a sign board, a door) drawn over what is behind it: its sky-colored corners show the scene. */
  over(src: Pixels, under: Pixels): Pixels {
    const sky = skyOf(this.pal);
    const out = new Pixels(20, 20, 0);
    out.px.set(under.px);
    return out.map((x, y, c) => (src.get(x, y) !== sky ? src.get(x, y) : c));
  }

  /** The sign `n` stamped on the map. */
  sign(m: StarterMap, n: SignName): void {
    const { at, w } = SIGNS[n];
    const { board, legs } = this.signs[n];
    const put = (src: string, x: number, y: number) => m.set(x, y, this.plain(this.over(this.scratch.pics.get(src)!, cellOf(this.base, x, y))));
    board.forEach((row, dy) => row.forEach((name, dx) => put(name, at[0] + dx, at[1] + dy)));
    put(legs[0], at[0], at[1] + board.length);
    put(legs[1], at[0] + w - 1, at[1] + board.length);
  }

  /** The exit door standing at column `x`, its bottom on row 8, over whatever is behind it; `barred` for a version with two red and white bars. */
  doorPics(x: number, barred: boolean): [Pixels, Pixels] {
    const pics = (['doorTop', 'doorBottom'] as const).map((n, i) => {
      const door = this.book.pics.get(n)!;
      return this.over(barred ? this.barred(door, i === 0) : door, cellOf(this.base, x, GROUND_ROW - 2 + i));
    });
    return [pics[0], pics[1]];
  }

  /** A copy of a door block with two red and white bars across it. */
  private barred(door: Pixels, top: boolean): Pixels {
    const { c } = this.pal;
    const p = new Pixels(20, 20, 0);
    p.px.set(door.px);
    for (const y0 of top ? [4, 12] : [2, 10]) {
      for (let x = 0; x < 20; x++) p.rect(x, y0, 1, 5, Math.floor(x / 4) % 2 ? c('white', 3) : c('red', 2));
      p.rect(0, y0, 20, 1, c('ink', 0)).rect(0, y0 + 4, 20, 1, c('ink', 0));
    }
    return p;
  }

  /** The door at column `x`, open (level 1). */
  door(m: StarterMap, x: number): void {
    const [top, bottom] = this.doorPics(x, false);
    m.set(x, GROUND_ROW - 2, this.plain(top)).set(x, GROUND_ROW - 1, this.plain(bottom));
  }

  /**
   * A sliding strip: a ring of blocks, one per window of the tile, each turning into the window `shift` pixels on after `ntime`
   * ticks and the last back into the first. Returns the first block of each row for each column parity (even, odd): the
   * ring's block a column starts at. Not alike-merged: two windows that look alike still have different next blocks.
   */
  strip(s: Strip): string[][] {
    const n = TILE / s.shift;
    const tile = stripAt(this.pal, s, 0).crop(0, 0, TILE, s.rows.length * 20);
    const wide = new Pixels(TILE * 2, tile.h).blit(tile, 0, 0).blit(tile, TILE, 0);
    const key = `${s.rows[0]}${s.shift}`;
    for (let r = 0; r < s.rows.length; r++)
      for (let m = 0; m < n; m++) {
        const name = `st${key}.${r}.${m}`;
        this.book.add(name, wide.crop(m * s.shift, r * 20, 20, 20), AIR);
        this.timed.push({ name, next: `st${key}.${r}.${(m + 1) % n}`, ticks: s.ntime });
      }
    return s.rows.map((_, r) => [0, 1].map((parity) => `st${key}.${r}.${(parity * 20) / s.shift}`));
  }

  /** A cell that is a different picture at each stage, turning into the next after `times[i]` ticks from the scene's start. */
  chain(stages: { pic: Pixels; solid: boolean }[], times: number[]): string {
    const keys = stages.map((s) => `${s.solid ? 'S' : 'A'}${keyOf(s.pic)}`);
    const make = (i: number): string => {
      if (i === stages.length - 1) return this.plain(stages[i].pic, stages[i].solid);
      const id = `t${i}:${times.slice(i).join(',')}:${keys.slice(i).join('|')}`;
      let name = this.names.get(id);
      if (!name) {
        name = `c${this.names.size}`;
        this.names.set(id, name);
        this.book.add(name, stages[i].pic, stages[i].solid ? { solid: SOLID } : AIR);
        this.timed.push({ name, next: make(i + 1), ticks: times[i] - (i ? times[i - 1] : 0) });
      }
      return name;
    };
    return make(0);
  }
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  /** The level's own block set (bw1.bbl, bw2.bbl): a level has up to 150 blocks. */
  st: Stage;
}

/** A blank grid the size of the screen with Kit's start and the door's marks. */
function marks(doorCol: number): Grid {
  const g = new Grid(COLS, ROWS);
  g.put(START[0], START[1] - 1, 's').put(START[0], START[1], 'S');
  g.put(doorCol, GROUND_ROW - 2, 'e').put(doorCol, GROUND_ROW - 1, 'E');
  return g;
}

/** Level 1: the truck, the sliding strips. */
function roadGoesBy(st: Stage): StarterMap {
  const m = new StarterMap(st.book, marks(DOOR_COL).rows());
  const solidAt = (x: number, y: number) => y === GROUND_ROW || (x === 0 && y >= 4) || (x >= 14 && y >= 4) || (x === DOOR_COL && y >= 4 && y < GROUND_ROW - 2);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) m.set(x, y, st.scene(x, y, solidAt(x, y)));
  // the strips: each column starts at the ring's block for its parity, so neighbors are half a tile apart
  for (const s of [HILLS, TREES, RAIL]) {
    const first = st.strip(s);
    s.rows.forEach((row, r) => {
      for (let x = 0; x < COLS; x++) if (!solidAt(x, row)) m.set(x, row, first[r][x % 2]);
    });
  }
  // the cab's back wall (cols 13 to 15) is painted solid; the door in it is the exit
  st.sign(m, 'ring');
  st.sign(m, 'speed');
  st.door(m, DOOR_COL);
  return m;
}

/** Level 2: the track, the car, the lamps and the barred door. */
function roundTheLoop(st: Stage): StarterMap {
  const m = new StarterMap(st.book, marks(DOOR2_COL).rows());
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) m.set(x, y, st.scene(x, y, y === GROUND_ROW));
  for (const x of [0, COLS - 1]) for (let y = 4; y < GROUND_ROW; y++) m.set(x, y, 'edge');
  st.sign(m, 'loop');
  st.sign(m, 'lamps');
  // the lap lamps: the lamp k is dim until k laps are done, then lit
  LAMPS.forEach(([x, y], k) => {
    const stages = [lamp(st.pal, false), lamp(st.pal, true)].map((pic) => ({ pic, solid: false }));
    m.set(x, y, st.chain(stages, [LAP * (k + 1)]));
  });
  // the door is barred (solid, red and white bars across it) until the third lap is done, then it opens
  const shut = st.doorPics(DOOR2_COL, true);
  const open = st.doorPics(DOOR2_COL, false);
  [0, 1].forEach((i) =>
    m.set(
      DOOR2_COL,
      GROUND_ROW - 2 + i,
      st.chain(
        [
          { pic: shut[i], solid: true },
          { pic: open[i], solid: false },
        ],
        [OPENS_AT],
      ),
    ),
  );
  // the car starts at the bottom of the loop
  m.mon(CAR, CAR_AT[0], CAR_AT[1]);
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
  const pal = buildStarterPalette();
  const one = new Stage(pal, drawRoad(pal), ['ring', 'speed']);
  const two = new Stage(pal, drawLoop(pal), ['loop', 'lamps']);
  const levels: Level[] = [
    { file: 'one', title: 'The Road Goes By', hint: 'The hills slide past.', map: roadGoesBy(one), st: one },
    { file: 'two', title: 'Round the Loop', hint: 'Wait for three laps.', map: roundTheLoop(two), st: two },
  ];
  return { pal, levels };
}
