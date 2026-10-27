// Building a 100x100 Game-Maker map in code from ASCII rows: each character names a
// block (and maybe a monster or a named spot) through the level's legend.
import { newMap, reindexMonsters, MLEN, LASTMM, type GameMap } from '../../../../web/src/formats/map';
import type { BlockSet } from '../blocks/blockset';
import type { Bestiary } from '../characters/mons';
import { Pixels } from '../../../kit/pixels';
import { FX } from '../sprites/fx';
import { CTR } from '../ids';

type Cell = string | { tile?: string; mon?: string; mark?: string };
type Legend = Record<string, Cell>;

export class LevelMap {
  readonly map: GameMap = newMap();
  readonly marks = new Map<string, [number, number]>();
  private monCount = 0;

  constructor(
    readonly bs: BlockSet,
    readonly beasts: Bestiary,
    fill: string,
  ) {
    this.map.blocks.fill(bs.id(fill));
  }

  set(x: number, y: number, name: string): this {
    if (x < 0 || y < 0 || x >= 100 || y >= 100) throw new Error(`Off the map: ${x},${y}`);
    this.map.blocks[y * MLEN + x] = this.bs.id(name);
    return this;
  }

  get(x: number, y: number): string {
    return this.bs.names[this.map.blocks[y * MLEN + x]];
  }

  rect(x: number, y: number, w: number, h: number, name: string | ((x: number, y: number) => string)): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, typeof name === 'string' ? name : name(xx, yy));
    return this;
  }

  mon(x: number, y: number, name: string): this {
    if (this.monCount >= LASTMM) throw new Error('Too many monsters');
    this.map.monsters[this.monCount++] = { monnum: this.beasts.id(name), status: 0, xtra: 0, curx: x, cury: y, extra: 0 };
    return this;
  }

  /**
   * A treat lying in front of whatever block is at (x, y): treats are background blocks
   * (so barks and paws fly past them), made on demand for each block they sit on.
   */
  treat(x: number, y: number, kind: 'treat' | 'bone' = 'treat'): this {
    const base = this.get(x, y);
    const name = `${kind}~${base}`;
    if (!this.bs.has(name)) {
      const p = new Pixels(20, 20);
      p.px.set(this.bs.pic(base).px);
      p.blit(FX[`${kind}1`], 0, 0, 255);
      const d = this.bs.def(base);
      if (d.solid) throw new Error(`A ${kind} inside solid ${base} at ${x},${y}`);
      this.bs.add(name, p, {
        ...d,
        ...(kind === 'treat' ? { effect: CTR.treats, eamt: 1, score: 10 } : { hp: 25, score: 50 }),
        touch: base,
        next: undefined,
        ntime: 0,
      });
    }
    return this.set(x, y, name);
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

  /** Stamps ASCII rows with their top-left at (x, y). Spaces are left alone. */
  stamp(x: number, y: number, rows: string[], legend: Legend): this {
    rows.forEach((row, dy) =>
      [...row].forEach((ch, dx) => {
        if (ch === ' ') return;
        const cell = legend[ch];
        if (cell === undefined) throw new Error(`Unknown map character "${ch}" at ${x + dx},${y + dy}`);
        const c = typeof cell === 'string' ? { tile: cell } : cell;
        if (c.tile) this.set(x + dx, y + dy, c.tile);
        if (c.mon) this.mon(x + dx, y + dy, c.mon);
        if (c.mark) this.mark(c.mark, x + dx, y + dy);
      }),
    );
    return this;
  }

  done(): GameMap {
    reindexMonsters(this.map);
    return this.map;
  }
}
