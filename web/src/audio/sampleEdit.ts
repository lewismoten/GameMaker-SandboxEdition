// Editing a digital sound (mono samples, -1..1): the cut/trim/fade/volume tools of the
// sample editor and the period effects (robot, chipmunk, deep, radio, echo) of the sound
// maker. Every function is pure: it returns new samples and leaves its input alone.

/** A range of samples [start, end). */
export interface Span {
  start: number;
  end: number;
}

export const clamp1 = (v: number): number => (v > 1 ? 1 : v < -1 ? -1 : v);

/** The span limited to the sound, start <= end; the whole sound when empty or missing. */
export function spanOf(s: Float32Array, span?: Span): Span {
  if (!span) return { start: 0, end: s.length };
  const a = Math.max(0, Math.min(s.length, Math.round(Math.min(span.start, span.end))));
  const b = Math.max(0, Math.min(s.length, Math.round(Math.max(span.start, span.end))));
  return b > a ? { start: a, end: b } : { start: 0, end: s.length };
}

function concat(...parts: Float32Array[]): Float32Array {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** Applies fn to the span only; the rest is kept. fn may change the span's length. */
export function inSpan(s: Float32Array, span: Span | undefined, fn: (part: Float32Array) => Float32Array): Float32Array {
  const { start, end } = spanOf(s, span);
  return concat(s.subarray(0, start), fn(s.slice(start, end)), s.subarray(end));
}

/** Keeps only the span. */
export function trim(s: Float32Array, span: Span): Float32Array {
  const { start, end } = spanOf(s, span);
  return s.slice(start, end);
}

/** Removes the span. */
export function cut(s: Float32Array, span: Span): Float32Array {
  const { start, end } = spanOf(s, span);
  return concat(s.subarray(0, start), s.subarray(end));
}

/** Puts other at position at (replacing `replace` samples there). */
export function splice(s: Float32Array, at: number, other: Float32Array, replace = 0): Float32Array {
  const a = Math.max(0, Math.min(s.length, Math.round(at)));
  return concat(s.subarray(0, a), other, s.subarray(Math.min(s.length, a + Math.max(0, replace))));
}

export function silence(seconds: number, rate: number): Float32Array {
  return new Float32Array(Math.max(0, Math.round(seconds * rate)));
}

export function fadeIn(s: Float32Array): Float32Array {
  const n = s.length;
  return s.map((v, i) => v * (n > 1 ? i / (n - 1) : 1));
}

export function fadeOut(s: Float32Array): Float32Array {
  const n = s.length;
  return s.map((v, i) => v * (n > 1 ? 1 - i / (n - 1) : 1));
}

export function gain(s: Float32Array, g: number): Float32Array {
  return s.map((v) => clamp1(v * g));
}

export function peakOf(s: Float32Array): number {
  let p = 0;
  for (const v of s) p = Math.max(p, Math.abs(v));
  return p;
}

/** Scales the loudest point to `to` (90% by default). */
export function normalize(s: Float32Array, to = 0.9): Float32Array {
  const p = peakOf(s);
  return p ? gain(s, to / p) : s.slice();
}

export function reverse(s: Float32Array): Float32Array {
  return s.slice().reverse();
}

/**
 * Plays faster (factor > 1: shorter and higher) or slower (longer and deeper), like
 * changing the speed of a tape. Linear interpolation.
 */
export function resample(s: Float32Array, factor: number): Float32Array {
  if (!(factor > 0)) return s.slice();
  const n = Math.max(1, Math.floor(s.length / factor));
  const out = new Float32Array(s.length ? n : 0);
  for (let i = 0; i < out.length; i++) {
    const x = i * factor;
    const a = Math.floor(x);
    const f = x - a;
    out[i] = (s[a] ?? 0) * (1 - f) + (s[Math.min(s.length - 1, a + 1)] ?? 0) * f;
  }
  return out;
}

/** Cuts the quiet ends (below 6% of the peak) and scales the loudest point to 90%. */
export function tidy(s: Float32Array, rate: number): Float32Array {
  const peak = peakOf(s);
  if (!peak) return s;
  const gate = peak * 0.06;
  let a = 0;
  let b = s.length;
  while (a < b && Math.abs(s[a]) < gate) a++;
  while (b > a && Math.abs(s[b - 1]) < gate) b--;
  a = Math.max(0, a - Math.round(rate * 0.02));
  b = Math.min(s.length, b + Math.round(rate * 0.05));
  const out = s.slice(a, b);
  for (let i = 0; i < out.length; i++) out[i] = (out[i] / peak) * 0.9;
  return out;
}

export type Effect = 'none' | 'robot' | 'chipmunk' | 'deep' | 'radio' | 'echo';
export const EFFECTS: [Effect, string][] = [
  ['none', 'Plain'],
  ['robot', 'Robot'],
  ['chipmunk', 'Chipmunk'],
  ['deep', 'Deep'],
  ['radio', 'Radio'],
  ['echo', 'Echo'],
];

/** The period effects. `rate` is the sound's sample rate. */
export function applyEffect(s: Float32Array, e: Effect, rate: number): Float32Array {
  switch (e) {
    case 'robot':
      return s.map((v, i) => v * Math.sign(Math.sin((2 * Math.PI * 70 * i) / rate)));
    case 'chipmunk':
      return Float32Array.from({ length: Math.floor(s.length / 1.6) }, (_, i) => s[Math.floor(i * 1.6)]);
    case 'deep':
      return Float32Array.from({ length: Math.floor(s.length * 1.45) }, (_, i) => s[Math.floor(i / 1.45)]);
    case 'radio': {
      // band-limited and crunchy
      let lp = 0;
      let hp = 0;
      return s.map((v) => {
        lp += (v - lp) * 0.45;
        hp = lp - (lp - hp) * 0.08;
        return Math.max(-0.6, Math.min(0.6, (lp - hp) * 2.2));
      });
    }
    case 'echo': {
      const d = Math.floor(rate * 0.18);
      const out = new Float32Array(s.length + d * 3);
      out.set(s);
      for (let i = d; i < out.length; i++) out[i] = clamp1(out[i] + out[i - d] * 0.45);
      return out;
    }
    default:
      return s.slice();
  }
}
