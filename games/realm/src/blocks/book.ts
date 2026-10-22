// BlockBook: a .BBL built one named block at a time from true-color paintings. A block's
// number is the order it was added in; touch/next links are given by name and resolved in
// finish(), which also picks the scene palette from all the paintings (median cut) and dithers
// every block into it. Some numbers are the same in every block set of the game (the felt egg,
// the gates), so a carried block means the same thing in every scene: reserve() puts a block at
// a fixed number.
import { newBlockSet, type Block } from '../../../../web/src/formats/blocks';
import { Pal, scenePalette } from '../art/pal';
import { Canvas, type RGB } from '../art/rgb';

export interface Attrs {
  solid?: number;
  score?: number;
  hp?: number;
  grav?: number;
  effect?: number;
  eamt?: number;
  birthMon?: number;
  birthTime?: number;
  touch?: string;
  next?: string;
  ntime?: number;
  obj?: number;
  /** Dither amount for this block (sprites on blocks look cleaner with less). */
  dither?: number;
  /** Quantize to the fixed sprite colors only. */
  spritesOnly?: boolean;
}

export const ALL = 15;

export class BlockBook {
  readonly blocks: Block[] = newBlockSet('bbl');
  readonly index = new Map<string, number>();
  readonly paint = new Map<string, Canvas>();
  private attrs = new Map<number, Attrs>();
  private nextFree = 0;
  private reserved = new Set<number>();
  pal?: Pal;

  constructor(
    readonly name: string,
    reserve: Record<number, string> = {},
  ) {
    for (const k of Object.keys(reserve)) this.reserved.add(Number(k));
    this.reservedNames = reserve;
  }
  private reservedNames: Record<number, string>;

  add(name: string, pic: Canvas, a: Attrs = {}): number {
    if (this.index.has(name)) throw new Error(`${this.name}: duplicate block ${name}`);
    let i = Object.entries(this.reservedNames).find(([, n]) => n === name)?.[0] as number | string | undefined;
    if (i === undefined) {
      while (this.reserved.has(this.nextFree)) this.nextFree++;
      i = this.nextFree++;
    } else i = Number(i);
    if (i >= 150) throw new Error(`${this.name}: out of background blocks at ${name}`);
    this.index.set(name, i);
    this.paint.set(name, pic);
    this.attrs.set(i, a);
    return i;
  }

  /** Changes a block's attributes after it was added (a vent's monster, once monsters are numbered). */
  setAttrs(name: string, a: Attrs): void {
    const i = this.n(name);
    this.attrs.set(i, { ...this.attrs.get(i), ...a });
  }

  has(name: string): boolean {
    return this.index.has(name);
  }

  n(name: string): number {
    const i = this.index.get(name);
    if (i === undefined) throw new Error(`${this.name}: no block ${name}`);
    return i;
  }

  get size(): number {
    return this.index.size;
  }

  /** Picks the palette (unless given), dithers every painting and resolves the links. */
  finish(pal?: Pal, tweak?: (c: RGB) => RGB): Block[] {
    for (const [n, i] of Object.entries(this.reservedNames)) if (!this.index.has(i)) throw new Error(`${this.name}: reserved block ${n} (${i}) never added`);
    this.pal = pal ?? scenePalette([...this.paint.values()], tweak);
    for (const [name, i] of this.index) {
      const a = this.attrs.get(i)!;
      const cv = this.paint.get(name)!;
      const b = this.blocks[i];
      b.pixels = this.pal.index(cv, { amount: a.dither ?? 6, spritesOnly: a.spritesOnly });
      b.solid = a.solid ?? 0;
      b.scorePts = a.score ?? 0;
      b.chHitPt = a.hp ?? 0;
      b.grav = a.grav ?? 0;
      b.effect = a.effect ?? 0;
      b.eamt = a.eamt ?? 0;
      b.birthMon = a.birthMon ?? 0;
      b.birthTime = a.birthTime ?? 0;
      b.ntime = a.ntime ?? 0;
      b.obj = a.obj ?? 0;
      if (a.touch) b.touchBl = this.n(a.touch);
      if (a.next) b.nextBl = this.n(a.next);
    }
    return this.blocks;
  }
}
