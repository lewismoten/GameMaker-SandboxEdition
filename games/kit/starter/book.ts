// A Book is a block set (.BBL, .MBL or .CBL) built one named block at a time. A block's
// number is the order it was added, so keep the order tidy: maps, monsters and the hero all
// find blocks by name through the book. Names for `touch` and `next` are looked up once
// every block exists (finish()).
import { BACKBL, BLOCK_COUNTS, CHARBL, SOLBOT, SOLLEF, SOLRIG, SOLTOP, emptyBlock, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

/** Solid on every side. */
export const SOLID = SOLTOP | SOLRIG | SOLBOT | SOLLEF;
/** Solid on top only: stand on it, jump up through it. */
export const LEDGE = SOLTOP;
/** Which way a block pulls (a block's "gravity"): the hero falls through blocks that pull down. */
export const PULL = { none: 0, up: 1, right: 2, down: 4, left: 8 } as const;

/** What a block does. Everything is optional: a plain block is passable, with no pull. */
export interface Rules {
  /** SOLID, LEDGE or a mix of the SOL* bits. */
  solid?: number;
  /** Points for touching it. */
  score?: number;
  /** Hit points it gives (or, below zero, takes) when touched. */
  hp?: number;
  /** PULL.down makes air; a ladder or a wall has none. */
  grav?: number;
  /** The counter it adds to (effect) and by how much (eamt): a key adds to the key counter. */
  effect?: number;
  eamt?: number;
  /** The block it turns into when touched (a coin is gone). */
  touch?: string;
  /** An object: touching does nothing, but the pick-up key takes it into the inventory (and the drop key puts it down again). */
  obj?: boolean;
}

/** How many blocks a Book holds unless asked for more: the Starters' monster sets keep to 50 of the file's 100. */
const COUNT = { bbl: BACKBL, mbl: 50, cbl: CHARBL } as const;

export class Book {
  readonly index = new Map<string, number>();
  readonly pics = new Map<string, Pixels>();
  private readonly blocks: Block[];
  private readonly rules: [number, Rules][] = [];

  /** `size` (at most what the file holds: 150, 100 or 50) is how many blocks the set has room for. */
  constructor(
    kind: keyof typeof COUNT,
    private readonly size: number = COUNT[kind],
  ) {
    if (size > BLOCK_COUNTS[kind]) throw new Error(`A .${kind} holds ${BLOCK_COUNTS[kind]} blocks, not ${size}`);
    this.blocks = Array.from({ length: size }, (_, i) => emptyBlock(i, kind !== 'bbl'));
  }

  /** Adds block `name` drawn as `pic`; returns its number. */
  add(name: string, pic: Pixels, r: Rules = {}): number {
    const i = this.index.size;
    if (i >= this.size) throw new Error(`Out of blocks (${name})`);
    if (this.index.has(name)) throw new Error(`Block ${name} twice`);
    this.index.set(name, i);
    this.pics.set(name, pic);
    const b = this.blocks[i];
    b.pixels = Uint8Array.from(pic.px);
    b.solid = r.solid ?? 0;
    b.scorePts = r.score ?? 0;
    b.chHitPt = r.hp ?? 0;
    b.grav = r.grav ?? 0;
    b.obj = r.obj ? 1 : 0;
    b.effect = r.effect ?? 0;
    b.eamt = r.eamt ?? 0;
    this.rules.push([i, r]);
    return i;
  }

  /** The number of block `name`. */
  n(name: string): number {
    const i = this.index.get(name);
    if (i === undefined) throw new Error(`No block ${name}`);
    return i;
  }

  /** The rules block `name` was added with (a copy). */
  rulesOf(name: string): Rules {
    const r = this.rules.find(([i]) => i === this.n(name));
    return { ...(r?.[1] ?? {}) };
  }

  /** Whether block number `n` is solid on every side in `mask` (SOLID, say). */
  isSolid(n: number, mask: number): boolean {
    return (this.blocks[n].solid & mask) === mask;
  }

  /** Draws block `name` again as `pic`, keeping its number and rules (a game giving a shared block its own look). */
  redraw(name: string, pic: Pixels): void {
    this.pics.set(name, pic);
    this.blocks[this.n(name)].pixels = Uint8Array.from(pic.px);
  }

  has(name: string): boolean {
    return this.index.has(name);
  }

  /** The finished block set, ready for serializeBlocks. */
  finish(): Block[] {
    for (const [i, r] of this.rules) if (r.touch) this.blocks[i].touchBl = this.n(r.touch);
    return this.blocks;
  }
}
