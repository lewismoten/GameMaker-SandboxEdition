// BlockBook: SNOW.BBL built one named block at a time. A block's index is the order it was
// added; touch/next links are given by name and resolved in finish(), once every block exists.
// Ctx is what every area's drawing code shares: the book, the palette ramps and a blank tile.
import { newBlockSet, type Block } from '../../../../web/src/formats/blocks';
import { Pixels } from '../../../kit/pixels';
import type { Pal } from '../art/pal';

interface Attrs {
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
}

export class BlockBook {
  readonly blocks: Block[] = newBlockSet('bbl');
  readonly index = new Map<string, number>();
  private links: [number, Attrs][] = [];
  readonly pics = new Map<string, Pixels>();

  add(name: string, pic: Pixels, a: Attrs = {}): number {
    const i = this.index.size;
    if (i >= 150) throw new Error('Out of background blocks');
    if (this.index.has(name)) throw new Error(`Duplicate block ${name}`);
    this.index.set(name, i);
    this.pics.set(name, pic);
    const b = this.blocks[i];
    b.pixels = Uint8Array.from(pic.px);
    b.solid = a.solid ?? 0;
    b.scorePts = a.score ?? 0;
    b.chHitPt = a.hp ?? 0;
    b.grav = a.grav ?? 0;
    b.effect = a.effect ?? 0;
    b.eamt = a.eamt ?? 0;
    b.birthMon = a.birthMon ?? 0;
    b.birthTime = a.birthTime ?? 0;
    b.ntime = a.ntime ?? 0;
    this.links.push([i, a]);
    return i;
  }

  n(name: string): number {
    const i = this.index.get(name);
    if (i === undefined) throw new Error(`No block ${name}`);
    return i;
  }

  /** Resolves touch/next names once every block exists. */
  finish(): Block[] {
    for (const [i, a] of this.links) {
      if (a.touch) this.blocks[i].touchBl = this.n(a.touch);
      if (a.next) this.blocks[i].nextBl = this.n(a.next);
    }
    return this.blocks;
  }
}

export const SOLID = 15;
export const MONEY = 3;

/** What every area module draws with: the book it adds to, palette ramps (R) and colors (c),
 * the snow ramp, and a fresh 20x20 tile (P). */
export interface Ctx {
  book: BlockBook;
  R: Pal['r'];
  c: Pal['c'];
  snow: number[];
  P: () => Pixels;
}

export function blockContext(pal: Pal): Ctx {
  return { book: new BlockBook(), R: pal.r, c: pal.c, snow: pal.r('snow'), P: () => new Pixels(20, 20) };
}
