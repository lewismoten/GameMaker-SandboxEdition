// A map drawn as text, like the kit's StarterMap, for a top-down block set: the whole 100x100 world is `fill`
// (wall, or trees), with the level painted in at ORIGIN. Each character is one block, by the legend a level gives.
import { newMap, MLEN, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { Book } from '../../kit/starter/book';
import { ORIGIN } from '../../kit/starter/map';
import type { Sign } from '../../kit/starter/sign';

export class OverMap {
  readonly map: GameMap = newMap();
  readonly width: number;
  readonly height: number;

  constructor(
    private readonly book: Book,
    rows: string[],
    legend: Record<string, string>,
    fill: string,
  ) {
    this.width = rows[0].length;
    this.height = rows.length;
    this.map.blocks.fill(book.n(fill));
    rows.forEach((row, y) => {
      if (row.length !== this.width) throw new Error(`Level row ${y} is ${row.length} wide, not ${this.width}`);
      [...row].forEach((ch, x) => {
        const name = legend[ch];
        if (!name) throw new Error(`Unknown level character "${ch}" at ${x},${y}`);
        this.set(x, y, name);
      });
    });
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
