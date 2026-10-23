// Laying out a scene: a map is rows and runs of named blocks (or one-character names from a
// legend), placed ORIGIN blocks in from the corner of Game-Maker's 100x100 world; everything
// outside the scene is the filler block (solid). Links say where they lead by name and the build
// turns them into scene numbers.
import { newMap, reindexMonsters, type GameMap } from '../../../../web/src/formats/map';
import type { BlockBook } from './blocks';

/** Where a scene's map sits in the 100x100 world (the rest is solid). */
export const ORIGIN = 2;

export interface LinkSpec {
  /** World block the link sits on. */
  from: [number, number];
  /** 'next': the scene after this one; or a scene's name (the build resolves it). */
  to: string;
  /** Where the poet lands in the scene it leads to (world blocks), when that scene doesn't say. */
  at?: [number, number];
}

export class MapBuilder {
  readonly map: GameMap = newMap();
  readonly links: LinkSpec[] = [];
  private monCount = 0;
  constructor(
    private book: BlockBook,
    filler: string,
    private legend: Record<string, string> = {},
  ) {
    this.map.blocks.fill(book.n(filler));
  }

  private block(what: string): number {
    if (what.length === 1) {
      const name = this.legend[what];
      if (!name) throw new Error(`Unknown map char "${what}"`);
      return this.book.n(name);
    }
    return this.book.n(what);
  }

  /** Sets a block at scene coordinates (a char from the legend, or a block name). */
  set(x: number, y: number, what: string): this {
    if (x < -ORIGIN || y < -ORIGIN || x + ORIGIN >= 100 || y + ORIGIN >= 100) throw new Error(`Off the map: ${x},${y}`);
    this.map.blocks[(y + ORIGIN) * 100 + x + ORIGIN] = this.block(what);
    return this;
  }

  /** The block at scene coordinates. */
  get(x: number, y: number): number {
    return this.map.blocks[(y + ORIGIN) * 100 + x + ORIGIN];
  }

  fill(x: number, y: number, w: number, h: number, what: string): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, what);
    return this;
  }

  /** A column of `what` from row y0 to y1 (inclusive). */
  col(x: number, y0: number, y1: number, what: string): this {
    return this.fill(x, y0, 1, y1 - y0 + 1, what);
  }

  /** A run of `what` along row y from x0 to x1 (inclusive). */
  row(y: number, x0: number, x1: number, what: string): this {
    return this.fill(x0, y, x1 - x0 + 1, 1, what);
  }

  /** Puts each char of `s` at (x + i, y); spaces are left alone. */
  text(x: number, y: number, s: string): this {
    [...s].forEach((ch, i) => ch !== ' ' && this.set(x + i, y, ch));
    return this;
  }

  /** Rows of legend chars from (x, y) down; spaces are left alone. */
  rows(x: number, y: number, lines: string[]): this {
    lines.forEach((s, i) => this.text(x, y + i, s));
    return this;
  }

  mon(id: number, x: number, y: number): this {
    if (this.monCount >= 200) throw new Error('Too many monsters');
    this.map.monsters[this.monCount++] = { monnum: id, status: 0, xtra: 0, curx: x + ORIGIN, cury: y + ORIGIN, extra: 0 };
    return this;
  }

  link(x: number, y: number, to = 'next', at?: [number, number]): this {
    this.links.push({ from: [x + ORIGIN, y + ORIGIN], to, at: at && [at[0] + ORIGIN, at[1] + ORIGIN] });
    return this;
  }

  build(): GameMap {
    reindexMonsters(this.map);
    return this.map;
  }
}

/** Scene coordinates to world blocks. */
export const at = (x: number, y: number): [number, number] => [x + ORIGIN, y + ORIGIN];
