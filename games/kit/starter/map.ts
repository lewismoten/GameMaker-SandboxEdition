// A level drawn as text. Each character of the rows is one block, so the level looks like
// the map you see in the editor's Map tab:
//
//   ' ' sky        G grass     D dirt     B brick    = plank (stand on it, jump up through it)
//   H ladder       c coin      k key      ^ spikes   b bush     f flower    ( ) a cloud
//   s S the entrance (top, bottom): you start in it    e E the exit door (top, bottom)
//   g gumdrop      z buzzer    n shelly   X sky you can't walk through
//
// Signs are stamped on top with sign(): the board's top-left block, the words' name.
// Around the level the world is 100x100 blocks: the sky and the ground carry on past its
// edges (and a wall of air keeps you inside), so the screen never shows the end of the map.
import { newMap, reindexMonsters, MLEN, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { SOLID, type Book } from './book';
import { MON } from './ids';
import type { Sign } from './sign';

/** Where a level's top-left block sits in the 100x100 world. */
export const ORIGIN = 10;

const LEGEND: Record<string, string> = {
  ' ': 'sky',
  G: 'grass',
  D: 'dirt',
  B: 'brick',
  '=': 'plank',
  H: 'ladder',
  c: 'coin',
  k: 'key',
  '^': 'spikes',
  b: 'bush',
  f: 'flower',
  '(': 'cloudL',
  ')': 'cloudR',
  s: 'doorwayTop',
  S: 'doorwayBottom',
  e: 'doorTop',
  E: 'doorBottom',
  X: 'edge',
  g: 'sky',
  z: 'sky',
  n: 'sky',
};
const MONS: Record<string, number> = { g: MON.gumdrop, z: MON.buzzer, n: MON.shelly };

/** A level's link to the next scene: where you touch it (world blocks). */
export interface Exit {
  from: [number, number];
}

export class StarterMap {
  readonly map: GameMap = newMap();
  /** The hero's starting block (his feet), in world blocks: the entrance. */
  start: [number, number] = [0, 0];
  /** The exit doors (their bottom blocks), in world blocks. */
  readonly exits: Exit[] = [];
  readonly width: number;
  readonly height: number;
  private monsters = 0;

  constructor(
    private readonly book: Book,
    rows: string[],
  ) {
    this.width = rows[0].length;
    this.height = rows.length;
    rows.forEach((row, y) => {
      if (row.length !== this.width) throw new Error(`Level row ${y} is ${row.length} wide, not ${this.width}`);
    });
    const dirt = book.n('dirt');
    const edge = book.n('edge');
    for (let y = 0; y < MLEN; y++) for (let x = 0; x < MLEN; x++) this.map.blocks[y * MLEN + x] = y < ORIGIN + this.height ? edge : dirt;
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const name = LEGEND[ch];
        if (!name) throw new Error(`Unknown level character "${ch}" at ${x},${y}`);
        this.set(x, y, name);
        if (ch in MONS) this.mon(MONS[ch], x, y);
        if (ch === 'S') this.start = [x + ORIGIN, y + ORIGIN];
        if (ch === 'E') this.exits.push({ from: [x + ORIGIN, y + ORIGIN] });
      }),
    );
    if (!this.start[0]) throw new Error('A level needs an entrance (S)');
  }

  /** Puts block `name` at level coordinates. */
  set(x: number, y: number, name: string): this {
    this.map.blocks[(y + ORIGIN) * MLEN + x + ORIGIN] = this.book.n(name);
    return this;
  }

  /** A monster, standing on level block (x, y). */
  mon(monnum: number, x: number, y: number): this {
    if (this.monsters >= 200) throw new Error('Too many monsters');
    this.map.monsters[this.monsters++] = { monnum, status: 0, xtra: 0, curx: x + ORIGIN, cury: y + ORIGIN, extra: 0 };
    return this;
  }

  /** A sign with its board's top-left block at level (x, y), and its two posts below. */
  sign(x: number, y: number, s: Sign): this {
    s.board.forEach((row, dy) => row.forEach((name, dx) => this.set(x + dx, y + dy, name)));
    const w = s.board[0].length;
    const below = y + s.board.length;
    this.set(x, below, s.legs[0]).set(x + w - 1, below, s.legs[1]);
    return this;
  }

  /** The finished map: the ground and the walls carry on past the level's edges. */
  done(): GameMap {
    const at = (x: number, y: number) => y * MLEN + x;
    const edge = this.book.n('edge');
    for (let y = ORIGIN; y < ORIGIN + this.height; y++) {
      const left = this.map.blocks[at(ORIGIN, y)];
      const right = this.map.blocks[at(ORIGIN + this.width - 1, y)];
      for (let x = 0; x < ORIGIN; x++) this.map.blocks[at(x, y)] = this.solidOf(left) ? left : edge;
      for (let x = ORIGIN + this.width; x < MLEN; x++) this.map.blocks[at(x, y)] = this.solidOf(right) ? right : edge;
    }
    reindexMonsters(this.map);
    return this.map;
  }

  private solidOf(block: number): boolean {
    return this.book.isSolid(block, SOLID);
  }
}
