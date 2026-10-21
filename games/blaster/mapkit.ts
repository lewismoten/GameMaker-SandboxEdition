// Building a stage's map in code. A scrolling stage is a strip 16 blocks wide (exactly one
// screen: horizontal scrolling is off) running from the launch pad near the bottom of the
// map to the gate near the top. Positions are (column 0..15, distance in rows from the
// launch pad). A boss arena is one fixed screen, positioned (column, row 0..9).
import { LASTMM, MLEN, MWID, newMap, reindexMonsters, type GameMap } from '../../web/src/formats/map';
import { rng } from '../kit/pixels';
import type { BlockSet } from './src/art/draw';
import type { Bestiary } from './mons';
import type { StageArt } from './tiles';

export const X0 = 2;
export const START_ROW = 94;
export const EXIT_ROW = 6;
/** Rows from the launch pad to the gate. */
export const LENGTH = START_ROW - EXIT_ROW;
export const ARENA_TOP = 45;
export const ARENA_START = { x: X0 + 8, y: ARENA_TOP + 5 };
export const STRIP_START = { x: X0 + 8, y: START_ROW };

export type TurretKind = 'sweep' | 'down' | 'seeker' | 'flak';

export class Grid {
  readonly map: GameMap = newMap();
  private count = 0;
  readonly links: { x: number; y: number }[] = [];
  /** Distance shown on the leg's card. */
  cardAt?: number;
  readonly rnd: () => number;

  constructor(
    readonly bs: BlockSet,
    readonly beasts: Bestiary,
    readonly art: StageArt,
    readonly origin: number,
    readonly dir: 1 | -1,
    seed: number,
  ) {
    this.rnd = rng(seed);
    for (let y = 0; y < MWID; y++)
      for (let x = 0; x < MLEN; x++) {
        const c = x - X0;
        const name = c === 0 ? `edgeL${(y >> 1) % art.edges}` : c === 15 ? `edgeR${(y >> 1) % art.edges}` : this.floorName();
        this.map.blocks[y * MLEN + x] = bs.id(name);
      }
  }

  floorName(): string {
    // mostly plain floor, now and then a detailed one
    const r = this.rnd();
    const n = this.art.floors;
    return `floor${r < 0.8 ? 0 : 1 + Math.floor(this.rnd() * (n - 1))}`;
  }

  y(d: number): number {
    return this.origin + this.dir * d;
  }

  set(c: number, d: number, name: string): this {
    const x = X0 + c;
    const y = this.y(d);
    if (x < 0 || x >= MLEN || y < 0 || y >= MWID) throw new Error(`Off the map: ${c},${d}`);
    this.map.blocks[y * MLEN + x] = this.bs.id(name);
    return this;
  }

  get(c: number, d: number): string {
    return this.bs.names[this.map.blocks[this.y(d) * MLEN + X0 + c]];
  }

  /** Fills w columns by h rows (rows counted in the grid's direction from d). */
  rect(c: number, d: number, w: number, h: number, name: string | ((c: number, d: number) => string)): this {
    for (let dd = d; dd < d + h; dd++) for (let cc = c; cc < c + w; cc++) this.set(cc, dd, typeof name === 'string' ? name : name(cc, dd));
    return this;
  }

  /** A picture made of blocks named `${prefix}${row}${col}` (row 0 at the top of the picture). */
  stamp(c: number, d: number, prefix: string, w: number, h: number): this {
    for (let r = 0; r < h; r++)
      for (let k = 0; k < w; k++) {
        // the top row of the picture is the furthest from the launch pad (strips) or the top (arenas)
        const dd = this.dir === -1 ? d + (h - 1 - r) : d + r;
        this.set(c + k, dd, `${prefix}${r}${k}`);
      }
    return this;
  }

  /** A raised panel w x h (nine-slice "pl"). */
  plate(c: number, d: number, w: number, h: number): this {
    for (let r = 0; r < h; r++)
      for (let k = 0; k < w; k++) {
        const pr = r === 0 ? 0 : r === h - 1 ? 2 : 1;
        const pc = k === 0 ? 0 : k === w - 1 ? 2 : 1;
        const dd = this.dir === -1 ? d + (h - 1 - r) : d + r;
        this.set(c + k, dd, `pl${pr}${pc}`);
      }
    return this;
  }

  mon(c: number, d: number, name: string): this {
    if (this.count >= LASTMM - 70) throw new Error(`Too many placed monsters (keep slots for shots and bullets)`);
    this.map.monsters[this.count++] = { monnum: this.beasts.id(name), status: 0, xtra: 0, curx: X0 + c, cury: this.y(d), extra: 0 };
    return this;
  }

  get placed(): number {
    return this.count;
  }

  /** A turret: the mount block (which makes the bullets) and its armored collar. */
  turret(c: number, d: number, kind: TurretKind = 'sweep'): this {
    this.set(c, d, { sweep: 'turL', down: 'turDown', seeker: 'turS', flak: 'turF' }[kind]);
    return this.mon(c, d, 'ring3');
  }

  /** A virus hatch; with `lid` it has a collar to shoot off (then the wreck plugs it). */
  hatch(c: number, d: number, lid = true): this {
    this.set(c, d, 'hatch');
    return lid ? this.mon(c, d, 'ring3') : this;
  }

  /** A firewall from column c0 to c1 (posts at both ends); phase A or B, or 'on' (always). */
  fence(c0: number, c1: number, d: number, phase: 'A' | 'B' | 'On' = 'A'): this {
    this.set(c0, d, 'postL').set(c1, d, 'postR');
    for (let c = c0 + 1; c < c1; c++) this.set(c, d, `beam${phase}`);
    return this;
  }

  pickup(c: number, d: number, kind: 'nova' | 'repair' | 'life' | 'bit'): this {
    return this.set(c, d, kind);
  }

  current(c0: number, c1: number, d0: number, d1: number, dir: 'L' | 'R'): this {
    for (let d = d0; d <= d1; d++) for (let c = c0; c <= c1; c++) this.set(c, d, dir === 'L' ? 'curL' : 'curR');
    return this;
  }

  /** Link cells: touching any of them leaves the scene. */
  link(c: number, d: number): this {
    this.links.push({ x: X0 + c, y: this.y(d) });
    return this;
  }

  /**
   * Scatters decorations over bare floor: each item is [block or stamp prefix, w, h] (w x h
   * stamps use `${prefix}${row}${col}` blocks; 1 x 1 items name a block). Leaves room
   * around monsters and everything already built.
   */
  sprinkle(items: [string, number, number][], count: number, d0 = 2, d1 = LENGTH - 3): this {
    const busy = new Set<string>();
    for (const m of this.map.monsters) if (m.monnum < 64) for (let dy = -1; dy <= 1; dy++) busy.add(`${m.curx},${m.cury + dy}`);
    for (let placed = 0, tries = 0; placed < count && tries < count * 60; tries++) {
      const [name, w, h] = items[Math.floor(this.rnd() * items.length)];
      const c = 1 + Math.floor(this.rnd() * (15 - w));
      const d = d0 + Math.floor(this.rnd() * (d1 - d0 - h));
      let ok = true;
      for (let r = -1; r <= h && ok; r++)
        for (let k = -1; k <= w && ok; k++) {
          const cc = c + k;
          const dd = d + r;
          if (cc < 1 || cc > 14) continue;
          if (!this.get(cc, dd).startsWith('floor') || busy.has(`${X0 + cc},${this.y(dd)}`)) ok = false;
        }
      if (!ok) continue;
      if (w === 1 && h === 1) this.set(c, d, name);
      else this.stamp(c, d, name, w, h);
      placed++;
    }
    return this;
  }

  done(): GameMap {
    reindexMonsters(this.map);
    return this.map;
  }
}

/** A scrolling strip with the launch pad and the gate. */
export function strip(bs: BlockSet, beasts: Bestiary, art: StageArt, seed: number): Grid {
  const g = new Grid(bs, beasts, art, START_ROW, -1, seed);
  g.set(8, 0, 'launch').set(7, 0, 'launch').set(8, -1, 'launch').set(7, -1, 'launch');
  for (let c = 1; c < 15; c++) g.set(c, LENGTH, `gate${c % 4}`).set(c, LENGTH + 1, `gate${(c + 2) % 4}`);
  for (let c = 0; c < 16; c++) g.link(c, LENGTH);
  return g;
}

export function arena(bs: BlockSet, beasts: Bestiary, art: StageArt, seed: number): Grid {
  return new Grid(bs, beasts, art, ARENA_TOP, 1, seed);
}
