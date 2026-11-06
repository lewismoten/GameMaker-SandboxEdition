// An explicit timer-masked custom PC can hold the sequencer; the built-in presets must not.
// The chip keeps sounding during an explicit hold and the song resumes where it was.
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadSong } from '@lewismoten/gamemaker-sandbox-engine/audio/cmfLoad';
import { musicHoldMs, SPEED_PRESETS, vocStallMs } from '@lewismoten/gamemaker-sandbox-engine/engine/slowPc';

interface Processor {
  port: { onmessage: (e: { data: unknown }) => void };
  process(i: Float32Array[][], o: Float32Array[][]): boolean;
}
let Ctor: new () => Processor;
const RATE = 22050;
const g = globalThis as Record<string, unknown>;

beforeAll(async () => {
  g.sampleRate = RATE;
  g.AudioWorkletProcessor = class {
    port = { onmessage: (_e: { data: unknown }) => {} };
  };
  g.registerProcessor = (_n: string, c: new () => Processor) => (Ctor = c);
  await import('../../packages/engine/src/audio/music.worklet');
});
afterAll(() => {
  delete g.sampleRate;
  delete g.AudioWorkletProcessor;
  delete g.registerProcessor;
});

const song = loadSong(new Uint8Array(readFileSync(new URL('../../../cd/gameware/glub/gmsong1.cmf', import.meta.url))))!;

/** `seconds` of the worklet's output, with `hold` ms posted after `holdAt` seconds. */
function render(seconds: number, hold?: { at: number; ms: number }): Float32Array {
  const p = new Ctor();
  p.port.onmessage({ data: { type: 'load', music: song.music.slice(), instruments: song.instruments } });
  const out = new Float32Array(Math.round(seconds * RATE));
  for (let i = 0; i < out.length; i += 128) {
    if (hold && i <= hold.at * RATE && hold.at * RATE < i + 128) p.port.onmessage({ data: { type: 'hold', ms: hold.ms } });
    const block = new Float32Array(128);
    p.process([], [[block]]);
    out.set(block.subarray(0, Math.min(128, out.length - i)), i);
  }
  return out;
}
const rms = (a: Float32Array) => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);

describe('music worklet hold', () => {
  let plain: Float32Array;
  let held: Float32Array;
  beforeAll(() => {
    plain = render(4);
    held = render(4, { at: 1, ms: 500 });
  });

  it.each(['ps1', '286', '386', '486'] as const)('%s disk reads leave the sequencer and rendered FM identical to uninterrupted playback', (preset) => {
    const pc = SPEED_PRESETS[preset];
    const ms = musicHoldMs(pc, vocStallMs(pc, 60000));
    const duringRead = render(4, { at: 1, ms });
    // Compare the actual worklet + CmfPlayer + OPL PCM, not just nonzero sustained notes.
    expect(duringRead.every((sample, i) => sample === plain[i])).toBe(true);
  });

  it('plays the same as before up to the hold', () => {
    expect(held.subarray(0, RATE)).toEqual(plain.subarray(0, RATE));
  });

  it('keeps sounding the notes it had while the song stands still', () => {
    expect(rms(held.subarray(RATE + 1000, RATE * 1.5))).toBeGreaterThan(0.001);
  });

  it('goes on from where it stopped, half a second late', () => {
    // the loudness every 10 ms after the hold, against the plain song shifted by each lag
    const env = (a: Float32Array, from: number) => Array.from({ length: 100 }, (_, k) => rms(a.subarray(from + k * 220, from + (k + 1) * 220)));
    const after = env(held, Math.round(RATE * 2));
    let best = { lag: -1, err: Infinity };
    for (let lag = 0; lag <= 80; lag++) {
      const p = env(plain, Math.round(RATE * 2) - lag * 220);
      const err = p.reduce((s, v, k) => s + Math.abs(v - after[k]), 0);
      if (err < best.err) best = { lag, err };
    }
    expect(best.lag * 10).toBeGreaterThanOrEqual(490);
    expect(best.lag * 10).toBeLessThanOrEqual(520);
  });
});
