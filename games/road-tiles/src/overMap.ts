// A level map built block by block by name: the whole 100x100 world is `fill` (trees), with the level laid in at ORIGIN.
// `put` checks nothing; `sign` stands a sign only on open ground of the ground it was drawn for, so a sign never
// covers a road piece.
import { newMap, MLEN, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { Book } from '../../kit/starter/book';
import { ORIGIN } from '../../kit/starter/map';
import type { Sign } from '../../kit/starter/sign';

export class RoadMap {
  readonly map: GameMap = newMap();
  private readonly cells: string[][];

  constructor(
    private readonly book: Book,
    readonly width: number,
    readonly height: number,
    ground: string,
    fill: string,
  ) {
    this.map.blocks.fill(book.n(fill));
    this.cells = Array.from({ length: height }, () => new Array<string>(width).fill(ground));
    this.cells.forEach((row, y) => row.forEach((name, x) => this.put(x, y, name)));
  }

  at(x: number, y: number): string {
    return this.cells[y][x];
  }

  put(x: number, y: number, name: string): this {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) throw new Error(`${name} at ${x},${y} is off the map`);
    this.cells[y][x] = name;
    this.map.blocks[(y + ORIGIN) * MLEN + x + ORIGIN] = this.book.n(name);
    return this;
  }

  fill(x: number, y: number, w: number, h: number, name: string): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.put(x + i, y + j, name);
    return this;
  }

  /** A sign with its board's top-left block at (x, y) and its two posts below; every block it covers must be `ground`. */
  sign(x: number, y: number, s: Sign, ground: string): this {
    const w = s.board[0].length;
    const h = s.board.length;
    for (let j = 0; j <= h; j++)
      for (let i = 0; i < w; i++) if (this.at(x + i, y + j) !== ground) throw new Error(`Sign at ${x},${y} covers ${this.at(x + i, y + j)} at ${x + i},${y + j}`);
    s.board.forEach((row, dy) => row.forEach((name, dx) => this.put(x + dx, y + dy, name)));
    return this.put(x, y + h, s.legs[0]).put(x + w - 1, y + h, s.legs[1]);
  }

  done(): GameMap {
    return this.map;
  }
}
