// Map building helpers: a wrapping 100x100 grid of block numbers plus placed monsters,
// and the reachability check (flood fill over cells a two-block-tall courier fits in).
import { LASTMM, MLEN, MWID, newMap, reindexMonsters, type GameMap } from '../../web/src/formats/map';
import type { Block } from '../../web/src/formats/blocks';
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../../web/src/formats/blocks';

export const W = MLEN;
export const H = MWID;
export const wx = (x: number) => ((x % W) + W) % W;
export const wy = (y: number) => ((y % H) + H) % H;

export class Grid {
  readonly cells = new Uint8Array(W * H);
  readonly monsters: { mon: number; x: number; y: number }[] = [];
  /** Cells that must not be overwritten by later decoration. */
  readonly locked = new Uint8Array(W * H);

  get(x: number, y: number): number {
    return this.cells[wy(y) * W + wx(x)];
  }
  set(x: number, y: number, b: number, lock = false): void {
    const i = wy(y) * W + wx(x);
    if (this.locked[i] && !lock) return;
    this.cells[i] = b;
    if (lock) this.locked[i] = 1;
  }
  isLocked(x: number, y: number): boolean {
    return this.locked[wy(y) * W + wx(x)] === 1;
  }
  fill(x: number, y: number, w: number, h: number, b: number, lock = false): void {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, b, lock);
  }
  monsterAt(x: number, y: number): boolean {
    return this.monsters.some((m) => m.x === wx(x) && m.y === wy(y));
  }
  place(mon: number, x: number, y: number): boolean {
    if (this.monsters.length >= LASTMM || this.monsterAt(x, y)) return false;
    this.monsters.push({ mon, x: wx(x), y: wy(y) });
    return true;
  }
  toMap(): GameMap {
    const m = newMap();
    m.blocks.set(this.cells);
    this.monsters.forEach((p, i) => {
      m.monsters[i] = { monnum: p.mon, status: 0, xtra: 0, curx: p.x, cury: p.y, extra: 0 };
    });
    reindexMonsters(m);
    return m;
  }
}

/** Is a block something the courier can be inside (not solid on all sides that matter)? */
export function open(b: Block): boolean {
  return (b.solid & (SOLLEF | SOLRIG | SOLBOT)) === 0 || b.solid === SOLTOP;
}

/**
 * Flood fill from (sx, sy) over cells where a two-block-tall body fits (the cell and the
 * one above open). `pass` can declare conditionally open blocks (doors, force fields).
 * The courier can fly (jet hops), so any connected open space counts.
 */
export function reachable(g: Grid, bbl: Block[], sx: number, sy: number, opts: { tall?: boolean; pass?: (b: number) => boolean } = {}): Uint8Array {
  const tall = opts.tall ?? true;
  const ok = (x: number, y: number) => {
    const b = g.get(x, y);
    if (opts.pass?.(b)) return true;
    return open(bbl[b]);
  };
  const fits = (x: number, y: number) => ok(x, y) && (!tall || ok(x, y - 1));
  const seen = new Uint8Array(W * H);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    x = wx(x);
    y = wy(y);
    const i = y * W + x;
    if (seen[i] || !fits(x, y)) return;
    seen[i] = 1;
    stack.push(i);
  };
  push(sx, sy);
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % W;
    const y = Math.floor(i / W);
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  return seen;
}

/** Periodic smooth noise over x (wraps every W columns). */
export function wave1d(seed: number, amps: [number, number][]): (x: number) => number {
  const phases = amps.map((_, i) => ((seed * 9301 + i * 49297) % 233280) / 233280);
  return (x) => amps.reduce((s, [freq, amp], i) => s + amp * Math.sin((2 * Math.PI * (x * freq)) / W + phases[i] * Math.PI * 2), 0);
}
