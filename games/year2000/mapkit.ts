// Building 100x100 Game-Maker maps from ASCII: each level is drawn as rows of characters,
// with a legend for blocks, monsters standing on a floor, named spots (starts, booth
// doors) and big pictures (domes, billboards) placed by their top-left corner.
import { newMap, reindexMonsters, MLEN, type GameMap } from '../../web/src/formats/map';
import type { BlockSet } from './src/blocks/book';

export type Cell = string | { tile?: string; mon?: number; mark?: string; big?: string; w?: number; h?: number };
export type Legend = Record<string, Cell>;

export class LevelMap {
  readonly map: GameMap = newMap();
  readonly marks = new Map<string, [number, number]>();
  private monCount = 0;

  constructor(
    readonly set: BlockSet,
    fill: string,
  ) {
    this.map.blocks.fill(set.id(fill));
  }

  set_(x: number, y: number, name: string): this {
    this.map.blocks[y * MLEN + x] = this.set.id(name);
    return this;
  }

  get(x: number, y: number): string {
    return this.set.names[this.map.blocks[y * MLEN + x]];
  }

  rect(x: number, y: number, w: number, h: number, name: string): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set_(xx, yy, name);
    return this;
  }

  mon(x: number, y: number, monnum: number): this {
    if (this.monCount >= 200) throw new Error('Too many monsters');
    this.map.monsters[this.monCount++] = { monnum, status: 0, xtra: 0, curx: x, cury: y, extra: 0 };
    return this;
  }

  get monsters(): number {
    return this.monCount;
  }

  mark(name: string, x: number, y: number): this {
    if (this.marks.has(name)) throw new Error(`Mark ${name} twice`);
    this.marks.set(name, [x, y]);
    return this;
  }

  at(name: string): { x: number; y: number } {
    const p = this.marks.get(name);
    if (!p) throw new Error(`No mark ${name}`);
    return { x: p[0], y: p[1] };
  }

  /** Places a big picture added as name0..name(w*h-1). */
  big(name: string, x: number, y: number, w: number, h: number): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set_(x + i, y + j, `${name}${j * w + i}`);
    return this;
  }

  /** Stamps ASCII rows at (x, y). Spaces are left alone. */
  stamp(x: number, y: number, rows: string[], legend: Legend, floor: string): this {
    const w = rows[0].length;
    rows.forEach((row, i) => {
      if (row.length !== w) throw new Error(`Map row ${i} is ${row.length} wide, not ${w}: ${row}`);
    });
    const at = (cx: number, cy: number) => rows[cy]?.[cx];
    rows.forEach((row, dy) =>
      [...row].forEach((ch, dx) => {
        if (ch === ' ') return;
        const cell = legend[ch];
        if (cell === undefined) throw new Error(`Unknown map character "${ch}" at ${x + dx},${y + dy}`);
        const c = typeof cell === 'string' ? { tile: cell } : cell;
        if (c.big) {
          if (at(dx - 1, dy) === ch || at(dx, dy - 1) === ch) return;
          this.big(c.big, x + dx, y + dy, c.w!, c.h!);
          for (let j = 0; j < c.h!; j++)
            for (let i = 0; i < c.w!; i++)
              if (at(dx + i, dy + j) !== ch) throw new Error(`Big ${c.big} at ${x + dx},${y + dy} is not ${c.w}x${c.h} in the map`);
          return;
        }
        this.set_(x + dx, y + dy, c.tile ?? floor);
        if (c.mon !== undefined) this.mon(x + dx, y + dy, c.mon);
        if (c.mark) this.mark(c.mark, x + dx, y + dy);
      }),
    );
    return this;
  }

  done(): GameMap {
    reindexMonsters(this.map);
    return this.map;
  }

  /** How many map cells hold a block whose name starts with `prefix`. */
  count(prefix: string): number {
    let n = 0;
    for (const b of this.map.blocks) if (this.set.names[b]?.startsWith(prefix)) n++;
    return n;
  }
}
