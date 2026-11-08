// The pictures of FIREWORKS: a rocket with a trail of sparks, and the bursts it turns into, drawn from a small
// simulation of sparks. Each spark flies out from the middle, slowed by the air (its distance grows as 1 - e^(-t/tau)),
// burns from white through its color down to an ember, flickers as it dies and goes out. A frame is the sparks at one
// moment; the engine shows the frames in turn, each for a set number of ticks.
//
// A burst of the big kinds is 60x60 pixels, nine monster blocks in a 3x3 square. The monster file has room for 100
// pictures, so the bursts are drawn mirror-symmetric and the engine's mirrors do the rest: a monster's picture can be
// drawn flipped left to right (orientation 4), top to bottom (6) or both (2). A burst that is the same in all four
// quarters ('quad') needs only four of its nine cells drawn; one that falls inside its frames (the willow, whose trails
// droop) is mirrored left to right only ('half') and needs six. A small burst is one block ('none').
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';

const T = 255;

export type Symmetry = 'quad' | 'half' | 'none';

/** One kind of burst: how it is drawn and how long each frame shows. */
export interface BurstKind {
  name: 'ring' | 'peony' | 'willow' | 'pop' | 'popTeal';
  /** Blocks across (and down): 3 for the big ones, 1 for a small one. */
  grid: 1 | 3;
  symmetry: Symmetry;
  /** Ticks each frame shows (about 18 ticks a second). */
  ticks: readonly number[];
  /** The spark settings. */
  sparks: SparkSpec;
}

interface SparkSpec {
  seed: number;
  /** Sparks in one mirrored part (a quarter for 'quad', a half for 'half', the whole for 'none'). */
  count: number;
  /** 'even' spaces them round the circle (a ring); 'fill' scatters them over the whole disc (a peony); 'round' spaces them round with speeds a little apart (a small pop); 'droop' is a willow's. */
  spread: 'even' | 'fill' | 'round' | 'droop';
  /** The farthest a spark gets, in pixels, and how quickly it gets there (ticks). */
  reach: number;
  tau: number;
  /** Pull down inside the frames, pixels a tick a tick ('half' only: the others fall by their path). */
  gravity: number;
  /** Ticks a spark burns, and how many earlier places each draws behind it (each `gap` ticks apart). */
  life: number;
  trail: number;
  gap: number;
  /** The color of each spark, by its number, and what it cools to. */
  colors: readonly string[];
  cools: 'ember' | 'smoke';
  /** An inner ring of gold sparks at this share of the reach (a ring's pistil), or none. */
  pistil?: number;
}

/** The kinds of burst, in the order the monster file holds their pictures. */
export const BURSTS: readonly BurstKind[] = [
  {
    name: 'ring',
    grid: 3,
    symmetry: 'quad',
    ticks: [2, 3, 4, 5, 6, 10],
    sparks: {
      seed: 7,
      count: 12,
      spread: 'even',
      reach: 26,
      tau: 5,
      gravity: 0,
      life: 34,
      trail: 4,
      gap: 1,
      colors: ['red', 'pink'],
      cools: 'ember',
      pistil: 0.42,
    },
  },
  {
    name: 'peony',
    grid: 3,
    symmetry: 'quad',
    ticks: [2, 4, 6, 8, 10],
    sparks: {
      seed: 3,
      count: 26,
      spread: 'fill',
      reach: 27,
      tau: 6,
      gravity: 0,
      life: 36,
      trail: 2,
      gap: 1,
      colors: ['green', 'teal', 'gold'],
      cools: 'smoke',
    },
  },
  {
    name: 'willow',
    grid: 3,
    symmetry: 'half',
    ticks: [3, 6, 9, 12, 16],
    sparks: {
      seed: 11,
      count: 18,
      spread: 'droop',
      reach: 22,
      tau: 7,
      gravity: 0.03,
      life: 50,
      trail: 9,
      gap: 1.5,
      colors: ['gold', 'orange'],
      cools: 'ember',
    },
  },
  {
    name: 'pop',
    grid: 1,
    symmetry: 'none',
    ticks: [2, 3, 3, 4, 5, 8],
    sparks: { seed: 5, count: 14, spread: 'round', reach: 9, tau: 3, gravity: 0, life: 26, trail: 1, gap: 1, colors: ['pink', 'purple'], cools: 'smoke' },
  },
  {
    name: 'popTeal',
    grid: 1,
    symmetry: 'none',
    ticks: [2, 3, 3, 4, 5, 8],
    sparks: { seed: 9, count: 14, spread: 'round', reach: 9, tau: 3, gravity: 0, life: 26, trail: 1, gap: 1, colors: ['teal', 'blue'], cools: 'smoke' },
  },
];

export const burstKind = (name: BurstKind['name']): BurstKind => BURSTS.find((b) => b.name === name)!;

/** The tick at which each frame is drawn: a little into its showing (the first right after the burst). */
export function sampleTimes(ticks: readonly number[]): number[] {
  let at = 0;
  return ticks.map((d, k) => {
    const t = k === 0 ? 0.6 : at + d / 2;
    at += d;
    return t;
  });
}

interface Spark {
  /** Unit direction and speed share (1 reaches the full reach). */
  dx: number;
  dy: number;
  speed: number;
  ramp: string;
  /** Burns a little longer or shorter than the kind's life. */
  life: number;
  /** A number of its own, for its flicker. */
  id: number;
}

/** The sparks of one mirrored part, then their mirror images. */
function sparksOf(kind: BurstKind): Spark[] {
  const s = kind.sparks;
  // separate streams for where each spark goes, how fast and how long it burns, so none follows another
  const turn = rng(s.seed);
  const pace = rng(s.seed * 31 + 7);
  const burn = rng(s.seed * 57 + 3);
  const span = kind.symmetry === 'quad' ? Math.PI / 2 : kind.symmetry === 'half' ? Math.PI : Math.PI * 2;
  // the part drawn: the top-left quarter (angles 180..270 degrees), the left half (90..270) or all of it
  const from = kind.symmetry === 'quad' ? Math.PI : kind.symmetry === 'half' ? Math.PI / 2 : 0;
  const base: Spark[] = [];
  for (let i = 0; i < s.count; i++) {
    // a willow's strands stay nearly evenly spaced and nearly as long as each other: ragged strands on a burst mirrored
    // left to right read as legs
    const jitter = s.spread === 'even' ? 0 : (turn() - 0.5) * (s.spread === 'round' ? 0.4 : s.spread === 'droop' ? 0.25 : 0.9);
    const a = awayFromMirrors(from + (span * (i + 0.5 + jitter)) / s.count, kind.symmetry);
    let speed = 1;
    if (s.spread === 'fill')
      speed = 0.3 + 0.7 * Math.sqrt(pace()); // spread over the whole disc, a few near the middle
    else if (s.spread === 'droop') speed = 0.85 + pace() * 0.15;
    else if (s.spread === 'round') speed = 0.65 + pace() * 0.35;
    base.push({ dx: Math.cos(a), dy: Math.sin(a), speed, ramp: s.colors[i % s.colors.length], life: s.life * (0.85 + burn() * 0.3), id: i });
  }
  if (s.pistil)
    for (let i = 0; i < Math.max(2, Math.round(s.count / 3)); i++) {
      const a = from + (span * (i + 0.5)) / Math.max(2, Math.round(s.count / 3));
      base.push({ dx: Math.cos(a), dy: Math.sin(a), speed: s.pistil, ramp: 'gold', life: s.life * 0.7, id: 100 + i });
    }
  const out = [...base];
  if (kind.symmetry !== 'none') for (const k of base) out.push({ ...k, dx: -k.dx, id: k.id + 1000 });
  if (kind.symmetry === 'quad') for (const k of [...out]) out.push({ ...k, dy: -k.dy, id: k.id + 2000 });
  return out;
}

/**
 * A spark too near a mirror line would meet its own image there, and sparks straight out to the left meet theirs on
 * the right: either draws a straight bar across the burst. Nudge them off the lines.
 */
function awayFromMirrors(a: number, sym: Symmetry): number {
  if (sym === 'none') return a;
  const lines = [Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  const near = 0.14;
  for (const l of lines) if (Math.abs(a - l) < near) return a < l ? l - near : l + near;
  return a;
}

/** A spark's place at `t` ticks, from the middle, in pixels. */
function placeAt(kind: BurstKind, k: Spark, t: number): [number, number] {
  const s = kind.sparks;
  const d = s.reach * k.speed * (1 - Math.exp(-Math.max(0, t) / s.tau));
  const fall = Math.max(0, t - s.tau);
  return [k.dx * d, k.dy * d + 0.5 * s.gravity * fall * fall];
}

/** The color of a spark `f` of the way through its life (0 to 1); `dim` steps it down for its trail. Undefined: out. */
function colorAt(pal: Pal, kind: BurstKind, k: Spark, f: number, dim: number): number | undefined {
  if (f >= 1) return undefined;
  const ramp = pal.r(k.ramp);
  const top = ramp.length - 1;
  // hot white at first, then the color from its brightest shade down, then an ember or smoke
  const steps: number[] = [pal.c('white', 3), ...ramp.slice().reverse().slice(0, Math.max(2, top)), ...pal.r(kind.sparks.cools).slice().reverse()];
  const at = (f < 0.06 ? 0 : 1 + Math.floor(((f - 0.06) / 0.94) ** 2.2 * (steps.length - 1))) + dim;
  return at < steps.length ? steps[at] : undefined;
}

/** Whether a spark is lit in frame `frame`: late in its life it misses some frames (it flickers). */
function lit(k: Spark, f: number, frame: number): boolean {
  if (f < 0.55) return true;
  const h = Math.sin(k.id * 12.9898 + frame * 78.233) * 43758.5453;
  return h - Math.floor(h) > (f - 0.55) * 1.1;
}

/** The whole burst at `t` ticks after it went off: a (grid*20)-pixel square, clear where there is nothing. */
export function burstPicture(pal: Pal, kind: BurstKind, t: number, frame: number): Pixels {
  const size = kind.grid * 20;
  const mid = size / 2 - 0.5;
  const p = new Pixels(size, size, T);
  const s = kind.sparks;
  const sparks = sparksOf(kind);
  // a small white core in the first moment only (a burst is a small flash, never the whole sky)
  if (t < 1.5 && kind.grid === 3) p.ring(mid, mid, 4.5, pal.c('gold', 4)).disc(mid, mid, 3, pal.c('gold', 5)).disc(mid, mid, 2, pal.c('white', 3));
  else if (t < 1.5)
    p.disc(mid, mid, 1.2, pal.c('white', 3))
      .set(mid, mid - 2, pal.c('gold', 4))
      .set(mid, mid + 2, pal.c('gold', 4))
      .set(mid - 2, mid, pal.c('gold', 4))
      .set(mid + 2, mid, pal.c('gold', 4));
  // trails first, dimmer and dimmer behind each spark, then the sparks over them
  for (let back = s.trail; back >= 0; back--)
    for (const k of sparks) {
      const at = t - back * s.gap;
      if (at < 0) continue;
      // a willow's trail starts a little way out: tails all reaching back to the middle draw a ring there
      if (back > 0 && s.spread === 'droop' && at < s.tau) continue;
      const f = t / k.life;
      if (!lit(k, f, frame)) continue;
      const c = colorAt(pal, kind, k, f, back === 0 ? 0 : 1 + Math.floor(back / 2));
      if (c === undefined) continue;
      const [x, y] = placeAt(kind, k, at);
      p.set(mid + x, mid + y, c);
      // a spark that is still hot is a short streak: the head, and a softer pixel beside it on the way out from the middle
      if (back === 0 && f < 0.45 && kind.grid === 3) {
        const soft = colorAt(pal, kind, k, f, 1) ?? c;
        const d = Math.hypot(x, y) || 1;
        const sx = Math.round(mid + x - x / d);
        const sy = Math.round(mid + y - y / d);
        if (p.get(sx, sy) === T) p.set(sx, sy, soft);
        p.set(mid + x, mid + y, c);
      }
    }
  return symmetric(p, kind.symmetry);
}

/** Copies the drawn part onto its mirror images, so the picture is exactly what the engine's mirrors will show. */
function symmetric(p: Pixels, sym: Symmetry): Pixels {
  if (sym === 'none') return p;
  const n = p.w;
  for (let y = 0; y < n; y++) for (let x = n / 2; x < n; x++) p.px[y * n + x] = p.px[y * n + (n - 1 - x)];
  if (sym === 'quad') for (let y = n / 2; y < n; y++) for (let x = 0; x < n; x++) p.px[y * n + x] = p.px[(n - 1 - y) * n + x];
  return p;
}

/** The rocket: a bright head with a trail of sparks below it, `frame` 0 or 1 (the sparks change, so it fizzes). */
export function rocketPicture(pal: Pal, frame: number): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  const rand = rng(41 + frame * 17);
  // the trail: a thin hot line just under the head, then sparks scattering wider as they fall behind
  for (let y = 11; y < 20; y++) {
    const age = (y - 11) / 9;
    if (y < 15) p.set(9.5 - (y % 2) * 0, y, age < 0.3 ? c('gold', 5) : c('orange', 3));
    for (let i = 0; i < 2; i++) {
      if (rand() > 0.75 - age * 0.25) continue;
      const x = 9.5 + (rand() - 0.5) * (1 + age * 6);
      p.set(x, y, age < 0.4 ? c('gold', 4) : age < 0.75 ? c('orange', 2) : c('ember', 1));
    }
  }
  // the head: a little shell, white hot on top
  p.rect(9, 8, 2, 3, c('gold', 5)).set(9, 8, c('white', 3)).set(10, 8, c('white', 3));
  p.set(frame ? 8 : 11, 10, c('gold', 3));
  return p;
}
