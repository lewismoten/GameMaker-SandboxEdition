// The sound effect maker's synthesizer and presets: length, pitch, determinism, the PC speaker
// steps, cleaning saved settings, and that every preset makes a short, audible, valid .VOC.
import { describe, expect, it } from 'vitest';
import { SFX_RATE, cleanParams, defaultParams, renderSfx, seconds, speakerSteps, MAX_SECONDS } from './sfxSynth';
import { PRESETS, SLOT_PRESET, mutate, randomParams } from './sfxPresets';
import { decodeVoc, encodeVoc } from '../formats/voc';
import { NUMFREQ } from '../formats/sound';

function seeded(seed: number): () => number {
  let a = seed;
  return () => ((a = (a * 16807) % 2147483647) - 1) / 2147483646;
}

/** Zero crossings upward per second: the pitch of a plain wave. */
function pitchOf(s: Float32Array, from = 0, to = s.length): number {
  let n = 0;
  for (let i = from + 1; i < to; i++) if (s[i - 1] < 0 && s[i] >= 0) n++;
  return (n * SFX_RATE) / (to - from);
}

const peak = (s: Float32Array) => s.reduce((m, v) => Math.max(m, Math.abs(v)), 0);

describe('renderSfx', () => {
  it('lasts the attack, hold and decay', () => {
    const p = { ...defaultParams(), attack: 0.1, hold: 0.2, decay: 0.3 };
    expect(seconds(p)).toBeCloseTo(0.6);
    expect(renderSfx(p).length).toBe(Math.round(0.6 * SFX_RATE));
    expect(seconds({ ...p, hold: 1, decay: 2, attack: 0.5 })).toBe(MAX_SECONDS);
  });

  it('plays the pitch asked for', () => {
    const s = renderSfx({ ...defaultParams(), wave: 'sine', pitch: 440, hold: 0.5, decay: 0.1 });
    expect(pitchOf(s, 0, Math.round(0.5 * SFX_RATE))).toBeGreaterThan(430);
    expect(pitchOf(s, 0, Math.round(0.5 * SFX_RATE))).toBeLessThan(450);
  });

  it('slides up an octave a second, and jumps', () => {
    const slide = renderSfx({ ...defaultParams(), wave: 'square', pitch: 300, slide: 1, hold: 1, decay: 0.01 });
    const late = pitchOf(slide, Math.round(0.9 * SFX_RATE), SFX_RATE);
    expect(late / 300).toBeGreaterThan(1.75);
    const jump = renderSfx({ ...defaultParams(), wave: 'square', pitch: 300, jump: 12, jumpAt: 0.1, hold: 0.4, decay: 0.01 });
    expect(pitchOf(jump, 0, Math.round(0.1 * SFX_RATE))).toBeLessThan(330);
    expect(pitchOf(jump, Math.round(0.15 * SFX_RATE), Math.round(0.4 * SFX_RATE))).toBeGreaterThan(560);
  });

  it('fades in and out, within -1..1, at its volume', () => {
    const s = renderSfx({ ...defaultParams(), attack: 0.1, hold: 0.1, decay: 0.2, volume: 0.5 });
    expect(Math.abs(s[0])).toBeLessThan(0.01);
    expect(peak(s)).toBeLessThanOrEqual(0.5);
    expect(peak(s)).toBeGreaterThan(0.45);
    expect(Math.abs(s[s.length - 1])).toBeLessThan(0.01);
  });

  it('makes the same sound from the same settings, and other noise from another seed', () => {
    const p = { ...defaultParams(), wave: 'noise' as const };
    expect(renderSfx(p)).toEqual(renderSfx(p));
    expect(renderSfx({ ...p, seed: 2 })).not.toEqual(renderSfx(p));
  });
});

describe('speakerSteps', () => {
  it('gives the 36 steps, silent once the sound has died away', () => {
    const steps = speakerSteps({ ...defaultParams(), pitch: 500, hold: 0.05, decay: 0.05 });
    expect(steps.length).toBe(NUMFREQ);
    expect(steps[0]).toBe(500);
    expect(steps[NUMFREQ - 1]).toBe(0);
  });

  it('follows the slide', () => {
    const steps = speakerSteps({ ...defaultParams(), pitch: 200, slide: 2, hold: 0.5 });
    expect(steps[20]).toBeGreaterThan(steps[0]);
  });
});

describe('cleanParams', () => {
  it('keeps known settings within range and fills in the rest', () => {
    const p = cleanParams({ wave: 'saw', pitch: 1e9, slide: -2, nonsense: 1, decay: 'long' });
    expect(p.wave).toBe('saw');
    expect(p.pitch).toBe(4000);
    expect(p.slide).toBe(-2);
    expect(p.decay).toBe(defaultParams().decay);
    expect(cleanParams(null)).toEqual(defaultParams());
    expect(cleanParams({ wave: 'kazoo' }).wave).toBe('square');
  });
});

describe('presets', () => {
  it('each makes a short, audible sound that survives a .VOC round trip', () => {
    const rnd = seeded(7);
    for (const preset of PRESETS) {
      for (let k = 0; k < 5; k++) {
        const p = preset.make(rnd);
        expect(cleanParams(p), preset.id).toEqual(p);
        const s = renderSfx(p);
        expect(seconds(p), preset.id).toBeLessThan(1.6);
        expect(peak(s), preset.id).toBeGreaterThan(0.2);
        const back = decodeVoc(encodeVoc(s, SFX_RATE));
        // the card's time constant rounds 11025 Hz to 10989
        expect(Math.abs(back.sampleRate - SFX_RATE)).toBeLessThan(60);
        expect(back.samples.length).toBe(s.length);
      }
    }
  });

  it('starts each of the sound set’s nine game slots from a preset that exists', () => {
    expect(SLOT_PRESET.length).toBe(9);
    for (const id of SLOT_PRESET) expect(PRESETS.some((p) => p.id === id)).toBe(true);
  });

  it('random and mutated settings stay valid and keep the wave', () => {
    const rnd = seeded(3);
    for (let i = 0; i < 20; i++) {
      const p = randomParams(rnd);
      expect(cleanParams(p)).toEqual(p);
      expect(seconds(p)).toBeLessThanOrEqual(1.2 + 1e-9);
      const m = mutate(p, rnd);
      expect(m.wave).toBe(p.wave);
      expect(cleanParams(m)).toEqual(m);
    }
  });
});
