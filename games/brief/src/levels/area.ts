// An area of the library: one map (100x100 blocks), its block set (.BBL), its monster blocks
// (.MBL) and monsters (.MON), with screen-sized windows stamped onto the map from ASCII rows.
// Scenes never scroll, so PLAYGAME frames each window around the cell Joe enters on: column
// 8, row 5 of the window. Every way into a window lands there. PLAYGAME also keeps the
// character off the screen's top row and left column, so nothing Joe must reach goes there.
import { MLEN, LASTMM, newMap, reindexMonsters, type GameMap } from '../../../../web/src/formats/map';
import { Pixels } from '../../../kit/pixels';
import { c } from '../art/pal';
import { BlockSet, Bestiary, SOLID, type BlockDef, type MonDef } from '../blocks/sets';
import { bookwormEgg, floor, on, shusher, wordSlip } from '../art/kit';
import { CTR, EGG_BLOCK, WORDS_PER_BOOK } from '../ids';

export const WIN_W = 16;
export const WIN_H = 10;
export const ENTRY = { x: 8, y: 5 };

/** A map cell: a block, maybe a monster on it, maybe a named mark. */
export type Cell = string | { tile: string; mon?: string; mark?: string };

/** Word pickups by map character: the value each slip is worth. */
export const WORD_CHARS: Record<string, number> = { '*': 20, '+': 10, '~': 5, o: 1 };

export interface Window {
  ox: number;
  oy: number;
  /** Where Joe enters (map coordinates). */
  entry: { x: number; y: number };
  marks: Map<string, { x: number; y: number }>;
  /** Words lying in this window. */
  words: number;
}

export class Area {
  readonly tiles = new BlockSet(150, false);
  readonly mb = new BlockSet(100, true);
  readonly mons = new Bestiary(this.mb);
  readonly map: GameMap = newMap();
  private placed = 0;

  constructor(readonly file: string) {
    // the felt egg, in its shoebox: the same block in every set, so the inventory shows it
    // wherever Joe carries it (only the Lost and Found has one on its floor)
    const box = on(floor('parquet', 1));
    box.rect(2, 12, 16, 7, c('brown', 1)).rect(3, 12, 14, 2, c('brown', 0)).rect(2, 18, 16, 1, c('brown', 0));
    this.tiles.add('egg', on(box, bookwormEgg()), { obj: true }, EGG_BLOCK);
  }

  /** A background block. */
  tile(name: string, px: Pixels, def: BlockDef = {}): string {
    this.tiles.add(name, px, def);
    return name;
  }

  /** A solid background block. */
  solid(name: string, px: Pixels, def: BlockDef = {}): string {
    return this.tile(name, px, { solid: SOLID, ...def });
  }

  /** A sprite over a background block of this set, solid or not. */
  prop(name: string, base: string, sprite: Pixels, solid = true, def: BlockDef = {}): string {
    return this.tile(name, on(this.tiles.pic(base), sprite), solid ? { solid: SOLID, ...def } : def);
  }

  /**
   * Monster blocks (frames) and the monster. `hazard`: touching it fines Joe a point a tick
   * (score; the shushers and their friends never touch the words he carries).
   */
  monster(name: string, frames: [Pixels, number][], def: Partial<MonDef> & { hazard?: boolean; pickup?: number } = {}): string {
    const pics: [string, number][] = frames.map(([px, t], i) => {
      const pn = `${name}#${i}`;
      const bd: BlockDef = def.hazard ? { score: -1 } : def.pickup ? { effect: CTR.words, eamt: def.pickup, score: def.pickup } : {};
      if (!this.mb.has(pn)) this.mb.add(pn, px, bd);
      return [pn, t];
    });
    const { hazard, pickup, path, ...rest } = def;
    this.mons.add(name, { pics, power: pickup ? 1 : 150, end: 0, ...rest, ...(path ? { path: loop(name, path) } : {}) });
    void hazard;
    return name;
  }

  /**
   * The same monster on another path: its frames are shared. A path is a loop of moves,
   * [dx, dy, speed] each, that ends where it started; then the monster walks it again.
   */
  patrol(base: string, path: [number, number, number][], called?: string): string {
    const name = called ?? `${base}@${path.map((p) => p.join(',')).join(';')}`;
    if (!this.mons.has(name)) {
      const d = this.mons.defs[this.mons.id(base)];
      this.mons.add(name, { ...d, path: loop(name, path) });
    }
    return name;
  }

  /** The shusher every area has. */
  addShusher(): void {
    this.monster('shh', [[shusher(0), 9], [shusher(1), 9]], { hazard: true });
  }

  /**
   * A word slip lying on a floor: a background block (monsters fight, and every shusher
   * outranks a word, so words are never monsters), worth `v` words and as many points.
   * Picked up, it leaves the bare floor.
   */
  wordOn(v: number, under: string): string {
    const name = `w${v}~${under}`;
    if (!this.tiles.has(name)) this.tile(name, on(this.tiles.pic(under), wordSlip(v, 0)), { effect: CTR.words, eamt: v, score: v, touch: under });
    return name;
  }

  monAt(x: number, y: number, name: string): void {
    if (this.placed >= LASTMM) throw new Error(`${this.file}: too many monsters`);
    this.map.monsters[this.placed++] = { monnum: this.mons.id(name), status: 0, xtra: 0, curx: x, cury: y, extra: 0 };
  }

  set(x: number, y: number, name: string): void {
    this.map.blocks[y * MLEN + x] = this.tiles.id(name);
  }

  get(x: number, y: number): string {
    return this.tiles.names[this.map.blocks[y * MLEN + x]];
  }

  /**
   * Stamps a 16x10 window with its top-left at (ox, oy). `under` is the floor beneath word
   * slips and the other monsters; '@' marks the entry (it must be column 8, row 5).
   */
  window(ox: number, oy: number, rows: string[], legend: Record<string, Cell>, under: string): Window {
    if (rows.length !== WIN_H || rows.some((r) => r.length !== WIN_W)) throw new Error(`${this.file} window at ${ox},${oy}: must be ${WIN_W}x${WIN_H}`);
    if (rows[ENTRY.y][ENTRY.x] !== '@') throw new Error(`${this.file} window at ${ox},${oy}: Joe enters at column 8, row 5 ('@')`);
    const marks = new Map<string, { x: number; y: number }>();
    let words = 0;
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const mx = ox + x;
        const my = oy + y;
        if (ch === '@') {
          this.set(mx, my, under);
          marks.set('entry', { x: mx, y: my });
          return;
        }
        if (ch in WORD_CHARS) {
          this.set(mx, my, this.wordOn(WORD_CHARS[ch], under));
          words += WORD_CHARS[ch];
          return;
        }
        const cell = legend[ch];
        if (cell === undefined) throw new Error(`${this.file}: unknown map character "${ch}" at ${x},${y}`);
        const cc = typeof cell === 'string' ? { tile: cell } : cell;
        this.set(mx, my, cc.tile === '.' ? under : cc.tile);
        if (cc.mon) this.monAt(mx, my, cc.mon);
        if (cc.mark) {
          if (x === 0 || y === 0) throw new Error(`${this.file}: ${cc.mark} at ${x},${y} is where Joe can't reach`);
          if (marks.has(cc.mark)) throw new Error(`${this.file}: mark ${cc.mark} twice`);
          marks.set(cc.mark, { x: mx, y: my });
        }
      }),
    );
    return { ox, oy, entry: { x: ox + ENTRY.x, y: oy + ENTRY.y }, marks, words };
  }

  done(): GameMap {
    reindexMonsters(this.map);
    return this.map;
  }
}

/**
 * A patrol written as moves (each relative to the last corner) as Game-Maker stores it:
 * corners as offsets from the start. The moves must come back to the start, because when a
 * march starts over its first corner is measured from wherever the monster is.
 */
function loop(name: string, moves: [number, number, number, number?][]): [number, number, number, number?][] {
  let x = 0;
  let y = 0;
  const out = moves.map(([dx, dy, speed, o]): [number, number, number, number?] => {
    x += dx;
    y += dy;
    return [x, y, speed, o];
  });
  if (x || y) throw new Error(`${name}: its patrol does not come back to where it started`);
  if (out.length > 10) throw new Error(`${name}: more than 10 corners`);
  return out;
}

/** Checks a book window holds exactly a hundred words. */
export function checkWords(file: string, w: Window): void {
  if (w.words !== WORDS_PER_BOOK) throw new Error(`${file} window at ${w.ox}: ${w.words} words, not ${WORDS_PER_BOOK}`);
}
