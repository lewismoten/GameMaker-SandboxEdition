// Drawing helpers for blocks, sprites and screens, and a named block-set builder.
import { emptyBlock, type Block } from '../../../../web/src/formats/blocks';
import { FONT8X8 } from '../../../../web/src/gfx/font8x8';
import { Pixels, dither } from '../../../kit/pixels';

export const CLEAR = 255;

/** ramp shade for level 0..1 between ramp[lo] and ramp[hi], ordered-dithered at (x, y). */
export function shadeAt(ramp: number[], lo: number, hi: number, level: number, x: number, y: number): number {
  const v = lo + Math.max(0, Math.min(1, level)) * (hi - lo);
  const base = Math.floor(v);
  const idx = dither(x, y, v - base) ? base + 1 : base;
  return ramp[Math.max(0, Math.min(ramp.length - 1, idx))];
}

/** A lit ellipsoid (light from the upper left). */
export function blob(p: Pixels, cx: number, cy: number, rx: number, ry: number, ramp: number[], lo = 0, hi = ramp.length - 1, light = 1): Pixels {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      const z = Math.sqrt(1 - d);
      const l = (0.62 * z - 0.42 * nx - 0.52 * ny) * light;
      p.set(x, y, shadeAt(ramp, lo, hi, (l + 0.35) / 1.2, x, y));
    }
  return p;
}

/** A beveled box: light top/left edge, dark bottom/right, face in between. */
export function bevel(p: Pixels, x: number, y: number, w: number, h: number, ramp: number[], face: number, b = 1): Pixels {
  p.rect(x, y, w, h, ramp[face]);
  for (let k = 0; k < b; k++) {
    p.rect(x + k, y + k, w - k * 2, 1, ramp[Math.min(ramp.length - 1, face + 2)]);
    p.rect(x + k, y + k, 1, h - k * 2, ramp[Math.min(ramp.length - 1, face + 1)]);
    p.rect(x + k, y + h - 1 - k, w - k * 2, 1, ramp[Math.max(0, face - 2)]);
    p.rect(x + w - 1 - k, y + k, 1, h - k * 2, ramp[Math.max(0, face - 1)]);
  }
  return p;
}

/** Outlines every opaque pixel of a sprite with color c (on transparent neighbors). */
export function outline(p: Pixels, c: number, transparent = CLEAR): Pixels {
  const src = Uint8Array.from(p.px);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= p.w || y >= p.h ? transparent : src[y * p.w + x]);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      if (at(x, y) !== transparent) continue;
      if (at(x - 1, y) !== transparent || at(x + 1, y) !== transparent || at(x, y - 1) !== transparent || at(x, y + 1) !== transparent) p.set(x, y, c);
    }
  return p;
}

/** ASCII art with a key; '.' and ' ' are transparent. */
export function sprite(rows: string[], key: Record<string, number>, w = 20, h = 20): Pixels {
  const p = new Pixels(w, h, CLEAR);
  const ox = Math.floor((w - Math.max(...rows.map((r) => r.length))) / 2);
  const oy = Math.floor((h - rows.length) / 2);
  return p.draw(ox, oy, rows, key);
}

/** Mirror left to right. */
export function mirror(p: Pixels): Pixels {
  return p.flipX();
}

export function flipY(p: Pixels): Pixels {
  const q = new Pixels(p.w, p.h);
  return q.map((x, y) => p.get(x, p.h - 1 - y));
}

/** Rotate 90 degrees clockwise (square pictures). */
export function rot90(p: Pixels): Pixels {
  const q = new Pixels(p.h, p.w);
  return q.map((x, y) => p.get(y, p.h - 1 - x));
}

/** Copies src scaled up by s (nearest), skipping CLEAR. */
export function scaleBlit(dst: Pixels, src: Pixels, x: number, y: number, s: number, flip = false): Pixels {
  for (let yy = 0; yy < src.h * s; yy++)
    for (let xx = 0; xx < src.w * s; xx++) {
      const sx = Math.floor(xx / s);
      const c = src.get(flip ? src.w - 1 - sx : sx, Math.floor(yy / s));
      if (c !== CLEAR && c >= 0) dst.set(x + xx, y + yy, c);
    }
  return dst;
}

/** The PC's 8x8 font, optionally scaled. */
export function text(p: Pixels, x: number, y: number, s: string, c: number, scale = 1): Pixels {
  [...s].forEach((ch, i) => {
    const code = ch.charCodeAt(0) & 255;
    for (let row = 0; row < 8; row++) {
      const bits = FONT8X8[code * 8 + row];
      for (let col = 0; col < 8; col++) if (bits & (1 << col)) p.rect(x + (i * 8 + col) * scale, y + row * scale, scale, scale, c);
    }
  });
  return p;
}

export const textWidth = (s: string, scale = 1) => s.length * 8 * scale;

/** Text with a 1-pixel (scaled) outline / drop shadow. */
export function outlined(p: Pixels, x: number, y: number, s: string, fill: number, edge: number, scale = 1, shadow = 0): Pixels {
  if (shadow) text(p, x + scale * 2, y + scale * 2, s, shadow, scale);
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
  ])
    text(p, x + dx * Math.max(1, scale >> 1), y + dy * Math.max(1, scale >> 1), s, edge, scale);
  return text(p, x, y, s, fill, scale);
}

export function centered(p: Pixels, y: number, s: string, fill: number, scale = 1, edge?: number, shadow = 0): Pixels {
  const x = Math.round((p.w - textWidth(s, scale)) / 2);
  return edge === undefined ? text(p, x, y, s, fill, scale) : outlined(p, x, y, s, fill, edge, scale, shadow);
}

/** Vertical gradient across ramp shades lo..hi. */
export function gradient(p: Pixels, x: number, y: number, w: number, h: number, ramp: number[], lo: number, hi: number): Pixels {
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) p.set(x + xx, y + yy, shadeAt(ramp, lo, hi, yy / Math.max(1, h - 1), x + xx, y + yy));
  return p;
}

// ------------------------------------------------------------------ block sets

export type BlockProps = Partial<Omit<Block, 'pixels' | 'nextBl' | 'touchBl' | 'birthMon'>> & {
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
  ) {}

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
      b.pixels = Uint8Array.from(pic.px);
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

/** A 3x5 font for tiny signs and chip markings. */
const MICRO: Record<string, string> = {
  A: '010101111101101',
  B: '110101110101110',
  C: '011100100100011',
  D: '110101101101110',
  E: '111100110100111',
  F: '111100110100100',
  G: '011100101101011',
  H: '101101111101101',
  I: '111010010010111',
  J: '001001001101010',
  K: '101101110101101',
  L: '100100100100111',
  M: '101111111101101',
  N: '110101101101101',
  O: '010101101101010',
  P: '110101110100100',
  Q: '010101101110011',
  R: '110101110101101',
  S: '011100010001110',
  T: '111010010010010',
  U: '101101101101111',
  V: '101101101101010',
  W: '101101111111101',
  X: '101101010101101',
  Y: '101101010010010',
  Z: '111001010100111',
  '0': '111101101101111',
  '1': '010110010010111',
  '2': '110001010100111',
  '3': '110001010001110',
  '4': '101101111001001',
  '5': '111100110001110',
  '6': '011100111101111',
  '7': '111001010010010',
  '8': '111101111101111',
  '9': '111101111001110',
  '-': '000000111000000',
  '.': '000000000000010',
  ':': '000010000010000',
  '!': '010010010000010',
  '/': '001001010100100',
  '+': '000010111010000',
  '(': '010100100100010',
  ')': '010001001001010',
  ' ': '000000000000000',
  "'": '010010000000000',
  ',': '000000000010100',
  '?': '110001010000010',
  $: '011110010011110',
  '&': '010101010101011',
  '#': '101111101111101',
  '\u00b5': '000101101111100',
  '=': '000111000111000',
  '>': '100010001010100',
  '<': '001010100010001',
  _: '000000000000111',
};

export function micro(p: Pixels, x: number, y: number, s: string, c: number): Pixels {
  [...s].forEach((ch, i) => {
    const g = MICRO[ch] ?? MICRO[ch.toUpperCase()] ?? MICRO['?'];
    for (let k = 0; k < 15; k++) if (g[k] === '1') p.set(x + i * 4 + (k % 3), y + Math.floor(k / 3), c);
  });
  return p;
}
