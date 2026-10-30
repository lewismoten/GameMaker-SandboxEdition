// Small pieces the games' synthesized sound effects share (kit/sound.ts makes the samples):
// noise through a low-pass, a gate that lets a sound through for a while, an attack-and-decay
// envelope, and a one-pole low-pass on any sound.
import { type Synth } from './sound';
import { rng } from './pixels';

/** White noise through a one-pole low-pass (0..1: how much of the new sample passes). */
export function lowNoise(seed: number, cutoff: number | ((t: number) => number)): Synth {
  const r = rng(seed);
  let y = 0;
  return (t) => {
    const a = typeof cutoff === 'number' ? cutoff : cutoff(t);
    y += a * (r() * 2 - 1 - y);
    return y * (1.4 / Math.sqrt(Math.max(0.05, a)));
  };
}

export const gate =
  (v: Synth, from: number, to: number): Synth =>
  (t) =>
    t >= from && t < to ? v(t) : 0;

export const env = (attack: number, decay: number) => (u: number) => Math.min(1, u / attack) * Math.max(0, 1 - u) ** decay;

/** A one-pole low-pass over a synth (for growly, dull noises). */
export function lowpass(v: Synth, k: number): Synth {
  let y = 0;
  return (t) => (y += (v(t) - y) * k);
}
