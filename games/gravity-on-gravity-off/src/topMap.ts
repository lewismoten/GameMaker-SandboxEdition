// Level 2 drawn as text, like the kit's StarterMap but for the top-down block set (topBlocks.ts): the whole
// 100x100 world is hedge, with the room painted in at the same place the side view's level sits.
//
//   ' ' lawn   G path   X hedge   W wall   = deck   c coin   b shrub   f flower
//   s S the entrance mat (you start on S)   e E the exit step
import { newMap, MLEN, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { Book } from '../../kit/starter/book';
import { ORIGIN, type Exit } from '../../kit/starter/map';
import type { Sign } from '../../kit/starter/sign';

const LEGEND: Record<string, string> = {
  ' ': 'lawn',
  G: 'path',
  X: 'hedge',
  W: 'wall',
  '=': 'deck',
  c: 'coin',
  b: 'shrub',
  f: 'flower',
  s: 'startTop',
  S: 'startBottom',
  e: 'exitTop',
  E: 'exitBottom',
};

export class TopMap {
  readonly map: GameMap = newMap();
  start: [number, number] = [0, 0];
  readonly exits: Exit[] = [];
  readonly width: number;
  readonly height: number;

  constructor(
    private readonly book: Book,
    rows: string[],
  ) {
    this.width = rows[0].length;
    this.height = rows.length;
    this.map.blocks.fill(book.n('hedge'));
    rows.forEach((row, y) => {
      if (row.length !== this.width) throw new Error(`Level row ${y} is ${row.length} wide, not ${this.width}`);
      [...row].forEach((ch, x) => {
        const name = LEGEND[ch];
        if (!name) throw new Error(`Unknown level character "${ch}" at ${x},${y}`);
        this.set(x, y, name);
        if (ch === 'S') this.start = [x + ORIGIN, y + ORIGIN];
        if (ch === 'E') this.exits.push({ from: [x + ORIGIN, y + ORIGIN] });
      });
    });
    if (!this.start[0]) throw new Error('A level needs an entrance (S)');
  }

  set(x: number, y: number, name: string): this {
    this.map.blocks[(y + ORIGIN) * MLEN + x + ORIGIN] = this.book.n(name);
    return this;
  }

  /** A sign with its board's top-left block at level (x, y), and its two posts below. */
  sign(x: number, y: number, s: Sign): this {
    s.board.forEach((row, dy) => row.forEach((name, dx) => this.set(x + dx, y + dy, name)));
    const below = y + s.board.length;
    this.set(x, below, s.legs[0]).set(x + s.board[0].length - 1, below, s.legs[1]);
    return this;
  }

  done(): GameMap {
    return this.map;
  }
}
