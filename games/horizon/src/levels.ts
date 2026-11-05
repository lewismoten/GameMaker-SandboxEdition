// TO THE HORIZON's two levels. Each is one screen, 16 blocks by 10, that never scrolls: the
// road is painted in perspective on a 320x200 picture (scene.ts) and cut into blocks, cells
// that come out alike sharing one block. Lami walks along the bottom row, the road's near edge.
//
//   1. Over the Hill: balls roll out from the top of the road and grow as they come. They are
//      born by spawner blocks off the right edge of the screen, where nobody sees them, one
//      chain per lane (kit/road3d.ts), and each ball leaps onto the vanishing point first.
//   2. Coming Closer: no balls. A finish arch stands on the hill and grows in four sizes as the
//      seconds go by (each block of its picture turns into the next after a time), and when it
//      arrives the bars across the door lift and the door is open.
// Both rooms are closed in by hedges you can see, so Lami is never stopped by something she can't.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { spawnChains, type RoadEntry } from '@lewismoten/gamemaker-sandbox-tools/kit/road3d';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Book, PULL, SOLID } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { BALL } from './monsters';
import { drawArch, drawScene } from './scene';
import { COLS, DOOR_COL, GROUND_ROW, HORIZON_ROW, ROWS, SPAWN_COL, START, WIDTH } from './view';

export type SignName = 'road' | 'balls' | 'arch' | 'bar';

/** The sign boards' size in blocks: four across, three high, standing on two posts. */
const SIGN = { w: 4, h: 3 } as const;
/** Where a sign's top-left block is: the lawn on either side of the road. */
const SIGN_AT = { left: [0, 2], right: [12, 2] } as const;
const SIGN_WORDS: Record<SignName, string> = {
  road: 'ONE PICTURE: THE ROAD NARROWS TO A POINT',
  balls: 'BLOCKS OFF SCREEN MAKE BALLS THAT GROW',
  arch: 'AN ARCH GROWS: EACH BLOCK BECOMES THE NEXT',
  bar: 'THE DOOR OPENS WHEN THE ARCH ARRIVES',
};

/** Ticks (18.2 to the second) after the level starts that the arch grows to its next size, and the door opens at the last. */
export const ARCH_AT = [110, 230, 350] as const;
export const OPENS_AT = ARCH_AT[2];
/** Level 1's timetable: [tick, lane, kind]. Lane 0 is the left, 1 the middle, 2 the right. */
export const WAVES: RoadEntry<number>[] = [
  [50, 1, 0],
  [105, 0, 0],
  [160, 2, 0],
  [215, 1, 0],
  [265, 2, 0],
  [310, 0, 0],
  [365, 1, 0],
  [410, 0, 0],
  [455, 2, 0],
  [500, 1, 0],
];

/** A block that turns into another after some ticks, or gives birth to monsters (patched into the finished .BBL). */
interface Timed {
  name: string;
  next?: string;
  ticks?: number;
  birth?: { mon: number; time: number };
}

const AIR = { grav: PULL.down };

/** The pixels of a 20x20 cell of a picture. */
const cellOf = (pic: Pixels, x: number, y: number): Pixels => pic.crop(x * 20, y * 20, 20, 20);
const keyOf = (p: Pixels): string => p.px.join(',');

/** The block set both levels share, and the pictures that fill it. */
class Stage {
  readonly book = new Book('bbl');
  readonly timed: Timed[] = [];
  readonly signs = {} as Record<SignName, Sign>;
  readonly base: Pixels;
  readonly archAt: Pixels[];
  private readonly scratch = new Book('bbl');
  private readonly names = new Map<string, string>();

  constructor(readonly pal: Pal) {
    addStarterBlocks(this.book, pal);
    this.base = drawScene(pal);
    this.archAt = [0, 1, 2, 3].map((s) => drawArch(pal, this.base.crop(0, 0, 320, 200), s));
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

  /** The base picture's cell, as the block that is in the map there (the ground row is solid). */
  scene(x: number, y: number): string {
    return this.plain(cellOf(this.base, x, y), y === GROUND_ROW);
  }

  /** A starter block (a sign board, a door) drawn over what is behind it: its sky-colored corners show the scene. */
  over(src: Pixels, under: Pixels): Pixels {
    const sky = skyOf(this.pal);
    const out = new Pixels(20, 20, 0);
    out.px.set(under.px);
    return out.map((x, y, c) => (src.get(x, y) !== sky ? src.get(x, y) : c));
  }

  /** The sign `n` stamped on the map with its top-left block at (x, y), and its posts under it. */
  sign(m: StarterMap, n: SignName, at: readonly [number, number]): void {
    const { board, legs } = this.signs[n];
    const put = (src: string, x: number, y: number) => m.set(x, y, this.plain(this.over(this.scratch.pics.get(src)!, cellOf(this.base, x, y))));
    board.forEach((row, dy) => row.forEach((name, dx) => put(name, at[0] + dx, at[1] + dy)));
    put(legs[0], at[0], at[1] + board.length);
    put(legs[1], at[0] + SIGN.w - 1, at[1] + board.length);
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

  /** The exit door standing on the road at column `x`, its bottom on row 8. */
  door(m: StarterMap, x: number): void {
    const top = this.book.pics.get('doorTop')!;
    const bottom = this.book.pics.get('doorBottom')!;
    m.set(x, GROUND_ROW - 2, this.plain(this.over(top, cellOf(this.base, x, GROUND_ROW - 2))));
    m.set(x, GROUND_ROW - 1, this.plain(this.over(bottom, cellOf(this.base, x, GROUND_ROW - 1))));
  }

  /**
   * A cell that is a different picture at each of four stages, turning into the next after ARCH_AT[s]
   * (minus the last change). Cells that end up the same share blocks; a cell that never changes is a plain block.
   */
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
        this.timed.push({ name, next: make(i + 1), ticks: ARCH_AT[i] - (i ? ARCH_AT[i - 1] : 0) });
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
  /** The level's own block set (hz1.bbl, hz2.bbl): a level has up to 150 blocks, and the picture, its signs and its timers need most of them. */
  st: Stage;
}

/** The scenery's blocks on every cell of the screen, the hedges at both sides, Lami's start and the door. */
function paint(st: Stage, g: Grid): StarterMap {
  g.put(START[0], START[1] - 1, 's').put(START[0], START[1], 'S');
  g.put(DOOR_COL, GROUND_ROW - 2, 'e').put(DOOR_COL, GROUND_ROW - 1, 'E');
  const m = new StarterMap(st.book, g.rows());
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) m.set(x, y, st.scene(x, y));
  // hedges close the room in at both sides, from row 4 down to the road (the road's own bottom row runs under them)
  for (const x of [0, COLS - 1]) for (let y = 4; y < GROUND_ROW; y++) m.set(x, y, 'edge');
  return m;
}

/** A blank grid wide enough for the screen and the spawners beyond its right edge. */
const blank = (): Grid => new Grid(WIDTH, ROWS);

/** Level 1: the hill, the road, the balls. */
function overTheHill(st: Stage): StarterMap {
  const m = paint(st, blank());
  st.sign(m, 'road', SIGN_AT.left);
  st.sign(m, 'balls', SIGN_AT.right);
  st.door(m, DOOR_COL);
  // the spawner chains, one per lane, off the right edge on the vanishing point's row
  const blankPic = new Pixels(20, 20, skyOf(st.pal));
  st.book.add('spawnEnd', blankPic, AIR);
  for (const chain of spawnChains(WAVES, [0, 1, 2], 'spawn')) {
    for (const b of chain.blocks) {
      st.book.add(b.name, blankPic, AIR);
      st.timed.push({ name: b.name, next: b.next === chain.end ? 'spawnEnd' : b.next, ticks: b.ntime, birth: { mon: BALL + chain.lane, time: b.birthTime } });
    }
    m.set(SPAWN_COL + chain.lane, HORIZON_ROW, chain.first);
  }
  return m;
}

/** Level 2: the arch grows, the bar lifts. */
function comingCloser(st: Stage): StarterMap {
  const m = paint(st, blank());
  st.sign(m, 'arch', SIGN_AT.left);
  st.sign(m, 'bar', SIGN_AT.right);
  // the arch's cells: columns 6 to 10, rows 2 to 4, each changing through the four sizes
  for (let y = 2; y <= 4; y++) for (let x = 6; x <= 10; x++) m.set(x, y, st.chain(st.archAt.map((p) => ({ pic: cellOf(p, x, y), solid: false }))));
  // the door is barred (solid, red and white bars across it) until the arch has arrived, then it opens
  for (const [y, name] of [
    [GROUND_ROW - 2, 'doorTop'],
    [GROUND_ROW - 1, 'doorBottom'],
  ] as const) {
    const under = cellOf(st.base, DOOR_COL, y);
    const open = st.over(st.book.pics.get(name)!, under);
    const shut = st.over(st.barred(st.book.pics.get(name)!, name === 'doorTop'), under);
    m.set(DOOR_COL, y, st.chain([shut, shut, shut, open].map((pic, i) => ({ pic, solid: i < 3 }))));
  }
  return m;
}
/** The finished block set: the book's, with each timed block given its next block, its ticks and its births. */
export function finishBlocks(st: Pick<Stage, 'book' | 'timed'>): Block[] {
  const blocks = st.book.finish();
  for (const t of st.timed) {
    const b = blocks[st.book.n(t.name)];
    if (t.next) b.nextBl = st.book.n(t.next);
    if (t.ticks) b.ntime = t.ticks;
    if (t.birth) {
      b.birthMon = t.birth.mon;
      b.birthTime = t.birth.time;
    }
  }
  return blocks;
}

/** The levels in order. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'horizon');
  const one = new Stage(pal);
  const two = new Stage(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Over the Hill', hint: 'Balls come out of the hill.', map: overTheHill(one), st: one },
    { file: 'two', title: 'Coming Closer', hint: 'Wait for the arch.', map: comingCloser(two), st: two },
  ];
  return { pal, levels };
}
