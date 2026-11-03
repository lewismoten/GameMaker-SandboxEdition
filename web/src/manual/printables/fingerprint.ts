// Fingerprints drawn from a seed: ridge lines from a pattern (whorl, spiral, arch, tented
// arch, left or right loop), a ridge count and a seed that bends the lines a little and
// breaks them up, so a print always comes out the same and no two suspects share one.
// The pure part (`ridgeCoverage`) is a number per point; `printMask` fills a grid with it.
// A "lifted" print (the one from the dagger) is a suspect's print turned, shifted and smudged.
import { mulberry32 } from '../../seededRandom';

export type PrintPattern = 'whorl' | 'spiral' | 'arch' | 'tented' | 'loop-l' | 'loop-r';

export interface PrintSpec {
  pattern: PrintPattern;
  seed: number;
  /** Ridges across the print's width. */
  ridges: number;
}

/** How a print was lifted: turned (degrees), shifted (fractions of its width) and smudged by `seed`. */
export interface Lift {
  turn: number;
  shift: [number, number];
  seed: number;
}

/** Smooth wobble from a few seeded waves: -1..1. */
function waves(seed: number, n: number): (x: number, y: number) => number {
  const rnd = mulberry32(seed);
  const w = Array.from({ length: n }, () => ({ a: 2 + rnd() * 5, b: 2 + rnd() * 5, p: rnd() * 6.283, s: rnd() < 0.5 ? -1 : 1 }));
  return (x, y) => w.reduce((t, k) => t + Math.sin(k.a * x + k.s * k.b * y + k.p), 0) / n;
}

const smooth = (lo: number, hi: number, v: number): number => {
  const t = Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
};

/** The ridge phase at (x, y), in -1..1 of the print's frame: whole numbers are ridge centers. */
function phase(spec: PrintSpec, x: number, y: number): number {
  const period = 2 / spec.ridges;
  switch (spec.pattern) {
    case 'whorl':
      return Math.hypot(x, y * 1.08) / period;
    case 'spiral':
      return Math.hypot(x, y) / period + (Math.atan2(y, x) / (2 * Math.PI)) * 2;
    case 'arch':
      return (y + 0.45 * x * x) / period;
    case 'tented':
      return (y + 0.55 * Math.sqrt(x * x + 0.012)) / period;
    case 'loop-l':
    case 'loop-r': {
      // nested U-turns opening downward, leaning to one side
      const c = spec.pattern === 'loop-l' ? -0.3 : 0.3;
      const u = x + c * y;
      return Math.hypot(u, Math.min(y + 0.1, 0) * 1.25) / period;
    }
  }
}

/**
 * How much ink the print puts at (x, y), 0..1, with x and y in -1..1 across the print. `lift`
 * maps a lifted print's point back to the original, then adds smudge gaps.
 */
export function ridgeCoverage(spec: PrintSpec, x: number, y: number, lift?: Lift): number {
  let px = x;
  let py = y;
  if (lift) {
    const t = (-lift.turn * Math.PI) / 180;
    const sx = x - lift.shift[0];
    const sy = y - lift.shift[1];
    px = sx * Math.cos(t) - sy * Math.sin(t);
    py = sx * Math.sin(t) + sy * Math.cos(t);
  }
  const bend = BEND(spec.seed);
  const f = phase(spec, px + 0.05 * bend(px * 0.9, py * 0.9), py + 0.05 * bend(py * 0.9 + 3, px * 0.9));
  // ridges: soft-edged, a little thinner where the finger pressed less
  const press = 0.9 + 0.12 * bend(px * 1.7 + 9, py * 1.7);
  let ink = smooth(-0.12, 0.12, Math.sin(2 * Math.PI * f) * press + 0.1);
  // the pad's oval, ragged at its rim
  const r = Math.hypot(px * 1.02, py * 0.97) + 0.04 * bend(px * 3, py * 3 + 5);
  ink *= 1 - smooth(0.9, 0.97, r);
  if (lift) {
    // a lifted print is patchy: powder missed here and there
    const gap = LIFT_GAPS(lift.seed)(px * 1.3, py * 1.3);
    ink *= smooth(-0.55, -0.3, gap);
  }
  return ink;
}

const bends = new Map<number, (x: number, y: number) => number>();
const BEND = (seed: number) => {
  let w = bends.get(seed);
  if (!w) bends.set(seed, (w = waves(seed, 4)));
  return w;
};
const LIFT_GAPS = (seed: number) => BEND(seed * 7 + 1);

/** The ink at each point of an n by n grid, row by row (0..1). */
export function printMask(spec: PrintSpec, n: number, lift?: Lift): Float32Array {
  const out = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) out[j * n + i] = ridgeCoverage(spec, ((i + 0.5) / n) * 2 - 1, ((j + 0.5) / n) * 2 - 1, lift);
  return out;
}
