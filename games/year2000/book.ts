// Named block sets: blocks are added by name with their attributes, and the names are
// resolved into Game-Maker block numbers when the set is built.
import { emptyBlock, type Block } from '../../web/src/formats/blocks';
import type { Pixels } from '../kit/pixels';

/** Block attributes by name; next/touch refer to other blocks by name. */
export interface BlockDef {
  solid?: number;
  score?: number;
  hp?: number;
  next?: string;
  ntime?: number;
  touch?: string;
  grav?: number;
  obj?: boolean;
  effect?: number;
  eamt?: number;
  birthMon?: number;
  birthTime?: number;
}

export const SOLID = 15;

export class BlockSet {
  readonly names: string[] = [];
  readonly pics: Pixels[] = [];
  private defs: BlockDef[] = [];
  constructor(
    readonly count: number,
    readonly transparent: boolean,
  ) {}

  add(name: string, px: Pixels, def: BlockDef = {}): number {
    if (this.names.includes(name)) throw new Error(`Block ${name} twice`);
    if (this.names.length >= this.count) throw new Error(`Too many blocks (${name})`);
    if (px.w !== 20 || px.h !== 20) throw new Error(`Block ${name} is ${px.w}x${px.h}`);
    this.names.push(name);
    this.pics.push(px);
    this.defs.push(def);
    return this.names.length - 1;
  }

  id(name: string): number {
    const i = this.names.indexOf(name);
    if (i < 0) throw new Error(`No block ${name}`);
    return i;
  }

  has(name: string): boolean {
    return this.names.includes(name);
  }

  pic(name: string): Pixels {
    return this.pics[this.id(name)];
  }

  def(name: string): BlockDef {
    return this.defs[this.id(name)];
  }

  build(): Block[] {
    return Array.from({ length: this.count }, (_, i) => {
      const b = emptyBlock(i, this.transparent);
      const p = this.pics[i];
      const d = this.defs[i];
      if (!p || !d) return b;
      b.pixels = Uint8Array.from(p.px);
      b.solid = d.solid ?? 0;
      b.scorePts = d.score ?? 0;
      b.chHitPt = d.hp ?? 0;
      b.nextBl = d.next ? this.id(d.next) : i;
      b.ntime = d.ntime ?? 0;
      b.touchBl = d.touch ? this.id(d.touch) : i;
      b.grav = d.grav ?? 0;
      b.obj = d.obj ? 1 : 0;
      b.effect = d.effect ?? 0;
      b.eamt = d.eamt ?? 0;
      b.birthMon = d.birthMon ?? 64;
      b.birthTime = d.birthTime ?? 0;
      return b;
    });
  }
}
