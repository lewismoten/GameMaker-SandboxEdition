// A town's (or a dungeon's) layout before it becomes a map: ground layers painted on block
// corners, multi-block stamps (houses, stalls, the throne), single blocks (trees, counters,
// gates), people standing where you talk to them, and the links out.
import { CornerMap, N } from '../art/corners';
import type { BlockBook } from '../blocks/book';
import { bridgeName, cellHash, resolveGround } from './ground';
import { newMap, type GameMap } from '../../../../web/src/formats/map';
import type { Talk } from './talk';
import type { LinkSpec } from '../game';

export type Pt = [number, number];

interface Npc {
  /** Monster number in the scene's .MON. */
  mon: number;
  at: Pt;
  /** Talking: walking into them plays this talk and puts Pip back at `back`. */
  talk?: Talk;
  back?: Pt;
}

export class Plan {
  readonly cm: CornerMap;
  readonly stamps: { name: string; x: number; y: number; w: number; h: number }[] = [];
  readonly singles: { name: string; x: number; y: number }[] = [];
  readonly npcs: Npc[] = [];
  readonly links: LinkSpec[] = [];
  /** Named spots for the docs, the bot and the box. */
  readonly spot: Record<string, Pt> = {};

  constructor(
    readonly name: string,
    readonly layers: string[],
  ) {
    this.cm = new CornerMap(layers);
  }

  /** A multi-block picture `${name}:x,y`; the ground under it is cleared of layers. */
  stamp(name: string, x: number, y: number, w: number, h: number, keepGround = false): void {
    this.stamps.push({ name, x, y, w, h });
    if (!keepGround) for (const l of this.layers) for (let yy = y; yy <= y + h; yy++) for (let xx = x; xx <= x + w; xx++) this.cm.setv(l, xx, yy, 0);
  }

  /** One block by name (drawn over whatever the ground is there). */
  put(name: string, x: number, y: number): void {
    this.singles.push({ name, x, y });
  }

  row(name: string, x0: number, x1: number, y: number): void {
    for (let x = x0; x <= x1; x++) this.put(name, x, y);
  }

  col(name: string, x: number, y0: number, y1: number): void {
    for (let y = y0; y <= y1; y++) this.put(name, x, y);
  }

  npc(mon: number, at: Pt, talk?: Talk, back?: Pt): void {
    this.npcs.push({ mon, at, talk, back: back ?? (talk ? [at[0], at[1] + 1] : undefined) });
  }

  link(from: Pt, to: string, at: Pt): void {
    this.links.push({ from, to, at });
  }

  /** The finished map: ground, stamps, singles; `base` picks the plain ground block. */
  build(book: BlockBook, o: { layers: string[]; base: (x: number, y: number) => string; fullVariants?: Record<string, number> }): GameMap {
    const ground = resolveGround(this.cm, book, { layers: o.layers, base: o.base, fullVariants: o.fullVariants });
    const bad = ground.conflicts.filter(([, , l]) => !(l.includes('water') && (l.includes('road') || l.includes('street'))));
    if (bad.length) console.log(`${this.name}: layers meet in ${bad.length} blocks, e.g.`, JSON.stringify(bad.slice(0, 6)));
    const map = newMap();
    map.blocks.set(ground.blocks);
    for (const s of this.stamps)
      for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) map.blocks[(s.y + y) * N + s.x + x] = book.n(`${s.name}:${x},${y}`);
    for (const s of this.singles) map.blocks[s.y * N + s.x] = book.n(s.name);
    void [bridgeName, cellHash];
    return map;
  }
}

/** Every distinct (water, street) corner pair where a street crosses water, for its bridge block. */
export function streetBridges(cm: CornerMap, road = 'street'): [number, number][] {
  const seen = new Map<string, [number, number]>();
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const wm = cm.mask('water', x, y);
      const rm = cm.mask(road, x, y);
      if (wm && rm) seen.set(`${wm}:${rm}`, [wm, rm]);
    }
  return [...seen.values()];
}
