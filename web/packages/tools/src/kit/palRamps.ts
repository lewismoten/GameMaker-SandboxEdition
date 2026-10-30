// A built palette with its ramps looked up by name (kit/palette.ts builds it): the colors, a
// ramp, and a shade of a ramp, clamped to its ends.
import { PaletteBuilder } from './palette';

export interface Pal {
  pal: Uint8Array;
  r: (name: string) => number[];
  /** Shade k of a ramp, clamped. */
  c: (name: string, k: number) => number;
}

export function wrap(b: PaletteBuilder): Pal {
  const r = (name: string) => b.get(name);
  return {
    pal: b.pal,
    r,
    c: (name, k) => {
      const ramp = r(name);
      return ramp[Math.max(0, Math.min(ramp.length - 1, k))];
    },
  };
}

/** A palette handle that also exposes its builder for consumer-owned extra ramps. */
export interface PalWithBuilder extends Pal {
  b: PaletteBuilder;
}
export const wrapWithBuilder = (b: PaletteBuilder): PalWithBuilder => ({ ...wrap(b), b });
export type RampSpec = readonly [
  name: string,
  shades: number,
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  mid?: readonly [number, number, number],
  glows?: boolean,
];
export interface RampPaletteOptions {
  designerColors?: boolean;
  overrides?: Readonly<Record<string, readonly [readonly [number, number, number], readonly [number, number, number], (readonly [number, number, number])?]>>;
  transform?: (name: string, color: readonly [number, number, number], glows: boolean) => readonly [number, number, number];
}
/** Build caller-supplied ramps, with optional endpoint transforms and named replacements. */
export function buildRampPalette(ramps: readonly RampSpec[], options: RampPaletteOptions = {}): PalWithBuilder {
  const b = new PaletteBuilder();
  if (options.designerColors !== false) b.designerColors();
  for (const [name, n, from, to, mid, glows] of ramps) {
    const replacement = options.overrides?.[name];
    if (replacement) {
      b.ramp(name, n, ...replacement);
      continue;
    }
    const color = (c: readonly [number, number, number]) => options.transform?.(name, c, !!glows) ?? c;
    b.ramp(name, n, color(from), color(to), mid ? color(mid) : undefined);
  }
  return wrapWithBuilder(b);
}
