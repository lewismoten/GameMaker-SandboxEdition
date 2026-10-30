// Drawing helpers for blocks, sprites and screens, and a named block-set builder.
import { emptyBlock, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

export { textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
export { CLEAR } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
export { shadeAt } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
export { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { bevel as bevelBox } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
export const bevel = (p: Pixels, x: number, y: number, w: number, h: number, ramp: number[], face: number, b = 1) =>
  bevelBox(p, x, y, w, h, ramp, face, b, [2, 1, -2, -1]);
export { outlineInPlace as outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';

export function text(p: Pixels, x: number, y: number, s: string, c: number, scale = 1): Pixels {
  pc.text(p, x, y, s, c, scale);
  return p;
}
export function outlined(p: Pixels, x: number, y: number, s: string, fill: number, edge: number, scale = 1, shadow = 0): Pixels {
  pc.outlined(p, x, y, s, fill, edge, scale, shadow);
  return p;
}
export function centered(p: Pixels, y: number, s: string, fill: number, scale = 1, edge?: number, shadow = 0): Pixels {
  pc.centered(p, y, s, fill, scale, edge, p.w / 2, shadow);
  return p;
}
export { gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';

// ------------------------------------------------------------------ block sets

type BlockProps = Partial<Omit<Block, 'pixels' | 'nextBl' | 'touchBl' | 'birthMon'>> & {
  /** Name of the block this animates into after ntime ticks. */
  next?: string;
  /** Name of the block this becomes when touched. */
  touch?: string;
  /** Name of the monster born by this block every birthTime ticks. */
  birth?: string;
};

/**
 * Collects named 20x20 blocks with their attributes and builds the .bbl/.mbl/.cbl list.
 * Links between blocks (animation, touch) and births are by name, resolved at build().
 */
export class BlockSet {
  readonly names: string[] = [];
  private pics: (Pixels | undefined)[] = [];
  private props: BlockProps[] = [];
  constructor(
    readonly limit: number,
    readonly kind: string,
    /** Turns every picture as the set is built (a side leg's monsters face left). */
    readonly turn?: (p: Pixels) => Pixels,
  ) {}

  /** Blocks the set's `turn` leaves alone (a note-head stays upright in a side leg). */
  private upright = new Set<string>();

  /** Is it a block that `turn` leaves as drawn? */
  isUpright(name: string): boolean {
    return this.upright.has(name);
  }

  /** Adds a block that `turn` leaves as drawn. */
  addUpright(name: string, pic: Pixels, props: BlockProps = {}): number {
    this.upright.add(name);
    return this.add(name, pic, props);
  }

  add(name: string, pic: Pixels, props: BlockProps = {}): number {
    if (this.names.includes(name)) throw new Error(`${this.kind}: block ${name} twice`);
    if (this.names.length >= this.limit) throw new Error(`${this.kind}: more than ${this.limit} blocks (${name})`);
    if (pic.w !== 20 || pic.h !== 20) throw new Error(`${this.kind}: ${name} is not 20x20`);
    this.names.push(name);
    this.pics.push(pic);
    this.props.push(props);
    return this.names.length - 1;
  }

  /** Adds a block at a fixed number, leaving the slots before it empty. */
  addAt(n: number, name: string, pic: Pixels, props: BlockProps = {}): number {
    if (this.names.length > n) throw new Error(`${this.kind}: block ${n} is taken (${name})`);
    while (this.names.length < n) {
      this.names.push(`(empty ${this.names.length})`);
      this.pics.push(undefined);
      this.props.push({});
    }
    return this.add(name, pic, props);
  }

  has(name: string): boolean {
    return this.names.includes(name);
  }

  id(name: string): number {
    const i = this.names.indexOf(name);
    if (i < 0) throw new Error(`${this.kind}: no block ${name}`);
    return i;
  }

  /** The blocks a block leads to: what it animates into and what it becomes when touched. */
  leadsTo(name: string): string[] {
    const { next, touch } = this.props[this.id(name)];
    return [next, touch].filter((n): n is string => !!n);
  }

  pic(name: string): Pixels {
    const pic = this.pics[this.id(name)];
    if (!pic) throw new Error(`${this.kind}: ${name} is an empty slot`);
    return pic;
  }

  build(monsterId?: (name: string) => number, transparentPad = false): Block[] {
    const out: Block[] = [];
    this.names.forEach((name, i) => {
      const pr = this.props[i];
      const pic = this.pics[i];
      if (!pic) return void out.push(emptyBlock(i, transparentPad));
      const b = emptyBlock(i, transparentPad);
      b.pixels = Uint8Array.from((this.turn && !this.upright.has(name) ? this.turn(pic) : pic).px);
      const { next, touch, birth, ...rest } = pr;
      Object.assign(b, rest);
      if (next) b.nextBl = this.id(next);
      if (touch) b.touchBl = this.id(touch);
      if (birth) {
        if (!monsterId) throw new Error(`${this.kind}: ${name} gives birth but no monsters`);
        b.birthMon = monsterId(birth);
      }
      out.push(b);
    });
    while (out.length < this.limit) out.push(emptyBlock(out.length, transparentPad));
    return out;
  }
}
export function micro(p: Pixels, x: number, y: number, s: string, c: number): Pixels {
  drawMicro(p, x, y, s, c);
  return p;
}

import { createMicroText } from '@lewismoten/gamemaker-sandbox-tools/kit/microText';
import { microGlyphs } from '@lewismoten/gamemaker-sandbox-tools/microFont';
import { createPcText } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
const pc = createPcText({ shadowOffsets: [[2, 2]], outlineDistance: (scale) => Math.max(1, scale >> 1), shadowZero: false });
const drawMicro = createMicroText({
  glyphs: microGlyphs("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-.:!/+() ',?$&#µ=><_\\", false),
  fallback: '?',
  trailingGap: true,
  glyphCase: true,
});

export { resampleBlit as scaleBlit, turn45, turn90, turn180, flipX, flipY, rotate } from '@lewismoten/gamemaker-sandbox-tools/kit/transforms';
