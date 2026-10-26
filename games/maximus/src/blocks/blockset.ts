// A named background block set (.BBL): blocks are added by name and refer to each other
// by name (animation chains, what they turn into when touched), then resolved to the
// 150 numbered slots Game-Maker uses.
import { Pixels } from '../../../kit/pixels';
import { BACKBL, emptyBlock, type Block } from '../../../../web/src/formats/blocks';
import { CLEAR } from '../art/draw';

interface BlockProps extends Partial<Omit<Block, 'pixels' | 'nextBl' | 'touchBl'>> {
  /** Block this one becomes after `ntime` ticks (by name). */
  next?: string;
  /** Block this one becomes when touched (by name). */
  touch?: string;
}

export const SOLID = 15;
export const TOP = 1;
/** Gravity bits */
export const G = { none: 0, up: 1, right: 2, down: 4, left: 8 } as const;

export class SetBuilder {
  readonly blocks: Block[] = Array.from({ length: BACKBL }, (_, i) => emptyBlock(i));
  readonly pics: (Pixels | undefined)[] = new Array(BACKBL).fill(undefined);
  private names = new Map<string, number>();
  private links: { i: number; next?: string; touch?: string }[] = [];
  private cursor = 0;
  readonly used = new Set<number>();
  /** Slots only explicit `at` adds may use (the shared egg/shard/module range, 129..149). */
  readonly reserved = new Set<number>(Array.from({ length: 21 }, (_, k) => 129 + k));

  constructor(
    readonly name: string,
    readonly defaultGrav: number = G.down,
  ) {
    for (const b of this.blocks) b.grav = defaultGrav;
  }

  /** Adds at the next free slot below the shared range (or at `at`). */
  add(name: string, p: Pixels, props: BlockProps = {}, at?: number): number {
    if (this.names.has(name)) throw new Error(`${this.name}: duplicate block ${name}`);
    let i = at;
    if (i === undefined) {
      while (this.used.has(this.cursor) || this.reserved.has(this.cursor)) this.cursor++;
      i = this.cursor;
    }
    if (i >= BACKBL) throw new Error(`${this.name}: out of blocks adding ${name} (${[...this.names.keys()].length} named)`);
    if (this.used.has(i)) throw new Error(`${this.name}: slot ${i} taken (${name})`);
    this.used.add(i);
    this.names.set(name, i);
    const { next, touch, ...rest } = props;
    const b = this.blocks[i];
    // Background blocks are opaque: clear pixels become black.
    b.pixels.set(p.px.map((c) => (c === CLEAR ? 0 : c)));
    Object.assign(b, { grav: this.defaultGrav }, rest);
    this.pics[i] = p;
    this.links.push({ i, next, touch });
    return i;
  }

  /** Gives the slot of block `old` (which nothing may point to) to a new block. */
  swap(old: string, name: string, p: Pixels, props: BlockProps = {}): number {
    const i = this.id(old);
    if (this.links.some((l) => l.next === old || l.touch === old)) throw new Error(`${this.name}: ${old} is still pointed to`);
    this.names.delete(old);
    this.used.delete(i);
    this.links = this.links.filter((l) => l.i !== i);
    Object.assign(this.blocks[i], emptyBlock(i));
    return this.add(name, p, props, i);
  }

  id(name: string): number {
    const i = this.names.get(name);
    if (i === undefined) throw new Error(`${this.name}: no block ${name}`);
    return i;
  }

  has(name: string): boolean {
    return this.names.has(name);
  }

  pic(name: string): Pixels {
    return this.pics[this.id(name)]!;
  }

  /** All names starting with a prefix, in slot order. */
  family(prefix: string): number[] {
    return [...this.names.entries()].filter(([n]) => n === prefix || n.startsWith(prefix + ':')).map(([, i]) => i);
  }

  resolve(): Block[] {
    for (const { i, next, touch } of this.links) {
      if (next) this.blocks[i].nextBl = this.id(next);
      if (touch) this.blocks[i].touchBl = this.id(touch);
    }
    return this.blocks;
  }

  get count(): number {
    return this.used.size;
  }

  names_(): Map<string, number> {
    return this.names;
  }
}

/** Copies a picture and draws a sprite over it. */
export function over(bg: Pixels, fg: Pixels, dx = 0, dy = 0): Pixels {
  const p = new Pixels(bg.w, bg.h);
  p.px.set(bg.px);
  return p.blit(fg, dx, dy, CLEAR);
}

/** A block from a per-pixel function. */
export function tex(fn: (x: number, y: number) => number): Pixels {
  return new Pixels(20, 20).map((x, y) => fn(x, y));
}
