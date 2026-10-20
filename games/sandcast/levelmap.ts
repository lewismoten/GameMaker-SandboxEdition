// Building 100x100 Game-Maker maps in code: rectangles, rings, ASCII stamps, monsters,
// and named spots (start points and doorways) for the scene links.
import { newMap, reindexMonsters, MLEN, type GameMap } from '../../web/src/formats/map';
import { rng } from '../kit/pixels';
import { BG } from './bblocks';

export type Cell = string | { tile?: string; mon?: number; mark?: string };
export type Legend = Record<string, Cell>;

const SAND_MIX = ['sand0', 'sand0', 'sand0', 'sand3', 'sand3', 'sand1', 'sand2'];

export class LevelMap {
  readonly map: GameMap = newMap();
  readonly marks = new Map<string, [number, number]>();
  private monCount = 0;
  private r: () => number;

  constructor(fill: string, seed: number) {
    this.r = rng(seed);
    this.map.blocks.fill(this.id(fill));
  }

  /** Block number; "sand" picks a random sand texture so the floor doesn't look tiled. */
  id(name: string): number {
    if (name === 'sand') return BG.id(SAND_MIX[Math.floor(this.r() * SAND_MIX.length)]);
    if (name === 'patio') return BG.id(this.r() > 0.5 ? 'patio' : 'patio2');
    return BG.id(name);
  }

  set(x: number, y: number, name: string): this {
    this.map.blocks[y * MLEN + x] = this.id(name);
    return this;
  }

  get(x: number, y: number): string {
    return BG.names[this.map.blocks[y * MLEN + x]];
  }

  rect(x: number, y: number, w: number, h: number, name: string): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, name);
    return this;
  }

  /** A hollow rectangle `t` blocks thick. */
  ring(x: number, y: number, w: number, h: number, name: string, t = 1): this {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) if (xx < x + t || yy < y + t || xx >= x + w - t || yy >= y + h - t) this.set(xx, yy, name);
    return this;
  }

  mon(x: number, y: number, monnum: number): this {
    if (this.monCount >= 200) throw new Error('Too many monsters');
    this.map.monsters[this.monCount++] = { monnum, status: 0, xtra: 0, curx: x, cury: y, extra: 0 };
    return this;
  }

  mark(name: string, x: number, y: number): this {
    this.marks.set(name, [x, y]);
    return this;
  }

  at(name: string): { x: number; y: number } {
    const p = this.marks.get(name);
    if (!p) throw new Error(`No mark ${name}`);
    return { x: p[0], y: p[1] };
  }

  /** Stamps ASCII rows at (x, y). Spaces are left alone; unknown characters are errors. */
  stamp(x: number, y: number, rows: string[], legend: Legend): this {
    rows.forEach((row, dy) =>
      [...row].forEach((ch, dx) => {
        if (ch === ' ') return;
        const cell = legend[ch];
        if (cell === undefined) throw new Error(`Unknown map character "${ch}" at ${x + dx},${y + dy}`);
        const c = typeof cell === 'string' ? { tile: cell } : cell;
        if (c.tile) this.set(x + dx, y + dy, c.tile);
        if (c.mon !== undefined) this.mon(x + dx, y + dy, c.mon);
        if (c.mark) this.mark(c.mark, x + dx, y + dy);
      }),
    );
    return this;
  }

  /** Overhead sandcastle: merlons along the top, brick walls, a courtyard inside. */
  castle(x: number, y: number, w: number, h: number, floor = 'court'): this {
    this.rect(x, y, w, h, floor);
    this.ring(x, y, w, h, 'wall');
    this.rect(x, y, w, 1, 'merlon');
    return this;
  }

  done(): GameMap {
    reindexMonsters(this.map);
    return this.map;
  }
}

/** The common legend; levels add their own characters. */
export const LEGEND: Legend = {
  '.': 'sand',
  ',': 'damp',
  _: 'court',
  G: 'grass',
  '=': 'boardH',
  '|': 'boardV',
  '+': 'post',
  D: 'dune',
  o: 'pile',
  '*': 'shell',
  $: 'starfish',
  h: 'popsicle',
  L: 'juice',
  w: 'balloon',
  A: 'anthill',
  F: 'found',
  '#': 'wall',
  M: 'merlon',
  T: 'tower',
  P: 'gate',
  '~': 'water',
  z: 'ford',
  b: 'bridge0',
  '>': 'flow_right',
  '<': 'flow_left',
  '^': 'flow_up',
  v: 'flow_down',
  H: 'hoseH',
  I: 'hoseV',
  N: 'nozzle',
  p: 'puddle',
  e: 'outline',
  a: 'toyA',
  B: 'toyB',
  c: 'toyC',
  '[': 'truckL',
  ']': 'truckR',
  Q: 'pail',
  d: 'duck',
  x: 'burr',
  C: 'chest',
  W: 'earth',
  R: 'roots',
  k: 'crack',
  n: 'nest',
  r: 'rootDoor',
  '%': 'acorn',
  l: 'glow',
  m: 'mushroom',
  g: 'goldShell',
};
