// A Book is a block set (.BBL, .MBL or .CBL) built one named block at a time. A block's
// number is the order it was added, so keep the order tidy: maps, monsters and the hero all
// find blocks by name through the book. Names for `touch` and `next` are looked up once
// every block exists (finish()).
import { BACKBL, CHARBL, SOLBOT, SOLLEF, SOLRIG, SOLTOP, emptyBlock, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
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
}

const COUNT = { bbl: BACKBL, mbl: 50, cbl: CHARBL } as const;

export class Book {
  readonly index = new Map<string, number>();
  readonly pics = new Map<string, Pixels>();
  private readonly blocks: Block[];
  private readonly rules: [number, Rules][] = [];

  constructor(private readonly kind: keyof typeof COUNT) {
    this.blocks = Array.from({ length: COUNT[kind] }, (_, i) => emptyBlock(i, kind !== 'bbl'));
  }

  /** Adds block `name` drawn as `pic`; returns its number. */
  add(name: string, pic: Pixels, r: Rules = {}): number {
    const i = this.index.size;
    if (i >= COUNT[this.kind]) throw new Error(`Out of blocks (${name})`);
    if (this.index.has(name)) throw new Error(`Block ${name} twice`);
    this.index.set(name, i);
    this.pics.set(name, pic);
    const b = this.blocks[i];
    b.pixels = Uint8Array.from(pic.px);
    b.solid = r.solid ?? 0;
    b.scorePts = r.score ?? 0;
    b.chHitPt = r.hp ?? 0;
    b.grav = r.grav ?? 0;
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

  /** Whether block number `n` is solid on every side in `mask` (SOLID, say). */
  isSolid(n: number, mask: number): boolean {
    return (this.blocks[n].solid & mask) === mask;
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
