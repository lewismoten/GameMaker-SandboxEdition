// Writing a game's songs in note strings (kit/music.ts): a voice, joining and repeating bars,
// and song() after checking every voice lasts the same number of beats, so a loop stays in step.
import { song, type Voice } from './music';

export const LEN: Record<string, number> = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25, t: 1 / 3 };

export const beatsOf = (notes: string) =>
  notes
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .reduce((n, t) => n + LEN[t.endsWith('.') ? t.slice(-2, -1) : t.slice(-1)] * (t.endsWith('.') ? 1.5 : 1), 0);

export function tune(bpm: number, voices: Voice[]): Uint8Array {
  const beats = voices.map((x) => beatsOf(x.notes));
  if (beats.some((b) => Math.abs(b - beats[0]) > 1e-6)) throw new Error(`Voices differ in length: ${beats.join(' ')}`);
  return song(bpm, voices);
}

export const v = (channel: number, instrument: Uint8Array, notes: string, velocity = 100, transpose = 0): Voice => ({
  channel,
  instrument,
  notes,
  velocity,
  transpose,
});

export const join = (...parts: string[]) => parts.filter(Boolean).join(', ');

export const times = (n: number, s: string) => Array(n).fill(s).join(', ');
