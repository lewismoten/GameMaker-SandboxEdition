// Tests: Editing Sound Blaster samples (audio/sampleEdit.ts).
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { applyEffect, cut, fadeIn, fadeOut, gain, inSpan, normalize, resample, reverse, splice, spanOf, tidy, trim } from '../src/audio/sampleEdit';
import { classifyProfile, classifySound, profileSound } from '../src/audio/soundProfile';
import { decodeVoc, encodeVoc } from '../src/formats/voc';

const RATE = 11025;
const seq = (n: number) => Float32Array.from({ length: n }, (_, i) => i / n);
const sine = (hz: number | ((t: number) => number), seconds: number, env: (t: number) => number = () => 0.8) => {
  let phase = 0;
  return Float32Array.from({ length: Math.round(seconds * RATE) }, (_, i) => {
    const t = i / RATE;
    phase += (2 * Math.PI * (typeof hz === 'number' ? hz : hz(t))) / RATE;
    return Math.sin(phase) * env(t);
  });
};
const noise = (seconds: number, seed = 7) => {
  let a = seed;
  return Float32Array.from({ length: Math.round(seconds * RATE) }, (_, i) => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return ((a / 4294967296) * 2 - 1) * Math.exp((-i / RATE) * 3);
  });
};

describe('sample editing', () => {
  it('trims, cuts and splices spans', () => {
    const s = seq(10);
    expect([...trim(s, { start: 2, end: 5 })]).toEqual([...s.slice(2, 5)]);
    expect(cut(s, { start: 2, end: 5 }).length).toBe(7);
    expect(cut(s, { start: 5, end: 2 })[2]).toBeCloseTo(0.5);
    expect(splice(s, 3, new Float32Array([9, 9]), 1).length).toBe(11);
    expect(splice(s, 3, new Float32Array([9, 9]), 1)[4]).toBe(9);
    // an empty span means the whole sound
    expect(spanOf(s, { start: 4, end: 4 })).toEqual({ start: 0, end: 10 });
  });

  it('fades, scales and reverses only inside the span', () => {
    const s = new Float32Array(10).fill(0.5);
    const f = inSpan(s, { start: 0, end: 5 }, fadeIn);
    expect(f[0]).toBe(0);
    expect(f[4]).toBeCloseTo(0.5);
    expect(f[9]).toBe(0.5);
    expect(fadeOut(s)[9]).toBe(0);
    expect(gain(s, 4)[0]).toBe(1);
    expect(Math.max(...normalize(s, 0.9))).toBeCloseTo(0.9);
    expect([...reverse(seq(4))]).toEqual([0.75, 0.5, 0.25, 0]);
    expect(s[0]).toBe(0.5); // inputs are never changed
  });

  it('changes speed like a tape', () => {
    expect(resample(seq(100), 2).length).toBe(50);
    expect(resample(seq(100), 0.5).length).toBe(200);
    expect(resample(seq(100), 2)[10]).toBeCloseTo(0.2);
  });

  it('applies the period effects', () => {
    const s = sine(300, 0.5);
    expect(applyEffect(s, 'chipmunk', RATE).length).toBeLessThan(s.length);
    expect(applyEffect(s, 'deep', RATE).length).toBeGreaterThan(s.length);
    expect(applyEffect(s, 'echo', RATE).length).toBeGreaterThan(s.length);
    expect(applyEffect(s, 'robot', RATE).length).toBe(s.length);
    expect(Math.max(...applyEffect(s, 'radio', RATE))).toBeLessThanOrEqual(0.6);
    expect(tidy(new Float32Array([0, 0, 0.5, 0.25, 0, 0]), RATE).length).toBeGreaterThan(0);
  });

  it('survives a trip through an 8-bit .VOC', () => {
    const s = sine(440, 0.2);
    const back = decodeVoc(encodeVoc(s, RATE)).samples;
    expect(back.length).toBe(s.length);
    expect(Math.abs(back[100] - s[100])).toBeLessThan(0.02);
  });
});

describe('sound groups', () => {
  it('sorts made-up sounds by their shape', () => {
    expect(classifySound(sine(880, 0.1), RATE)).toBe('blip');
    expect(classifySound(noise(0.8), RATE)).toBe('boom');
    expect(
      classifySound(
        sine((t) => 2000 * 2 ** (-t * 5), 0.6),
        RATE,
      ),
    ).toBe('zap');
    expect(classifySound(sine(440, 1), RATE)).toBe('tone');
    expect(classifySound(sine(440, 4), RATE)).toBe('long');
  });

  it('is deterministic', () => {
    const s = noise(0.5, 3);
    expect(profileSound(s, RATE)).toEqual(profileSound(s.slice(), RATE));
  });

  it('separates voices from sweeps by how clean the sweep is', () => {
    const base = {
      seconds: 1,
      peak: 1,
      zcr: 1500,
      zcrSpread: 0.6,
      periodicity: 0.65,
      pitch: 120,
      pitchSlope: -1,
      pitchSteady: 0.8,
      bursts: 3,
      sustain: 0.3,
      peakAt: 0.4,
    };
    expect(classifyProfile(base)).toBe('voice');
    expect(classifyProfile({ ...base, pitch: 800, zcrSpread: 0.2 })).toBe('zap');
  });

  const gameware = resolve(__dirname, '../../cd/gameware');
  it.skipIf(!existsSync(gameware))('sorts some CD sounds as a person would', () => {
    const group = (f: string) => {
      const v = decodeVoc(new Uint8Array(readFileSync(resolve(gameware, f))));
      return classifySound(v.samples, v.sampleRate);
    };
    expect(group('rings5/laser.voc')).toBe('zap');
    expect(group('nebula/bang.voc')).toBe('boom');
    expect(group('outerlim/ok.voc')).toBe('voice');
    expect(group('nebula/bebeep.voc')).toBe('tone');
    expect(group('glub/pop.voc')).toBe('blip');
    expect(group('zark/explod.voc')).toBe('long');
  });
});
