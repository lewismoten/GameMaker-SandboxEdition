// Laying out a level: a map builder over a level's block book (blocks by name, or one character
// each from the level's legend), its monsters and its links, at ORIGIN in the 100x100 world.
// Everything outside a level is the level's filler (a solid wall).
import { newMap, reindexMonsters, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { BlockBook } from '../../../snowbound/src/blocks/book';

/** Where a level's map sits in the 100x100 world. */
export const ORIGIN = 2;

export interface LinkSpec {
  /** World blocks. */
  from: [number, number];
  toScene: 'next' | 'won';
}

export class MapBuilder {
  readonly map: GameMap = newMap();
  readonly links: LinkSpec[] = [];
  private monCount = 0;
  constructor(
    readonly book: BlockBook,
    private legend: Record<string, string>,
    filler: string,
  ) {
    this.map.blocks.fill(book.n(filler));
  }

  private block(ch: string): number {
    const name = this.legend[ch];
    if (!name) throw new Error(`Unknown map char "${ch}"`);
    return this.book.n(name);
  }

  /** A block at level coordinates: a legend character, or a block's name. */
  set(x: number, y: number, what: string): this {
    this.map.blocks[(y + ORIGIN) * 100 + x + ORIGIN] = what.length === 1 ? this.block(what) : this.book.n(what);
    return this;
  }

  fill(x: number, y: number, w: number, h: number, what: string): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, what);
    return this;
  }

  /** ASCII rows at (x, y); spaces are left alone. */
  patch(x: number, y: number, rows: string[]): this {
    rows.forEach((row, dy) => [...row].forEach((ch, dx) => ch !== ' ' && this.set(x + dx, y + dy, ch)));
    return this;
  }

  mon(id: number, x: number, y: number): this {
    if (this.monCount >= 200) throw new Error('Too many monsters');
    this.map.monsters[this.monCount++] = { monnum: id, status: 0, xtra: 0, curx: x + ORIGIN, cury: y + ORIGIN, extra: 0 };
    return this;
  }

  link(x: number, y: number, toScene: LinkSpec['toScene'] = 'next'): this {
    this.links.push({ from: [x + ORIGIN, y + ORIGIN], toScene });
    return this;
  }

  build(): GameMap {
    reindexMonsters(this.map);
    return this.map;
  }
}

export interface Level {
  m: MapBuilder;
  /** Where Teddy starts (world blocks). */
  start: [number, number];
  /** The level's size in blocks (for previews). */
  size: [number, number];
}

/** Level coordinates to world blocks. */
export const at = (x: number, y: number): [number, number] => [x + ORIGIN, y + ORIGIN];
