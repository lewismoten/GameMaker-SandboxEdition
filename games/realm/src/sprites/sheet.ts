// A sprite block set (.CBL 50 blocks, .MBL 100) built from named paintings, in the fixed sprite
// colors only (art/pal.ts), with 255 as the clear color. Monster blocks also carry what touching
// them does (hit points, a counter), which Game-Maker applies when a monster touches Pip.
import { newBlockSet, type Block } from '../../../../web/src/formats/blocks';
import { fixedPalette } from '../art/pal';
import type { Canvas } from '../art/rgb';

const FIXED = fixedPalette();

interface SpriteAttrs {
  hp?: number;
  effect?: number;
  eamt?: number;
  score?: number;
  solid?: number;
}

export class SpriteSheet {
  readonly blocks: Block[];
  readonly index = new Map<string, number>();
  readonly paint = new Map<string, Canvas>();
  private max: number;

  constructor(readonly kind: 'cbl' | 'mbl') {
    this.blocks = newBlockSet(kind);
    this.max = kind === 'cbl' ? 50 : 100;
  }

  add(name: string, pic: Canvas, a: SpriteAttrs = {}): number {
    if (this.index.has(name)) throw new Error(`${this.kind}: duplicate ${name}`);
    const i = this.index.size;
    if (i >= this.max) throw new Error(`${this.kind}: out of blocks at ${name}`);
    this.index.set(name, i);
    this.paint.set(name, pic);
    const b = this.blocks[i];
    b.pixels = FIXED.index(pic, { amount: 0, spritesOnly: true, clear: 255 });
    b.chHitPt = a.hp ?? 0;
    b.effect = a.effect ?? 0;
    b.eamt = a.eamt ?? 0;
    b.scorePts = a.score ?? 0;
    b.solid = a.solid ?? 0;
    return i;
  }

  n(name: string): number {
    const i = this.index.get(name);
    if (i === undefined) throw new Error(`${this.kind}: no ${name}`);
    return i;
  }

  has(name: string): boolean {
    return this.index.has(name);
  }

  get size(): number {
    return this.index.size;
  }
}
