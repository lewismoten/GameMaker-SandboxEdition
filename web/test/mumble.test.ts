import { describe, expect, it } from 'vitest';
import { decodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
import { MUMBLE_VOICES, mumble, mumbleSeconds, mumbleVoc, syllablesFromText, type Syllable } from '@lewismoten/gamemaker-sandbox-tools/kit/mumble';

const LINE: Syllable[] = [
  ['e', 210, 260, 0.2, 0.03],
  ['o', 300, 230, 0.4],
];

describe('mumble', () => {
  it('is deterministic and as long as the syllables say', () => {
    const a = mumble(LINE);
    expect(a).toEqual(mumble(LINE));
    expect(a.length).toBe(Math.round(mumbleSeconds(LINE) * 11025));
  });
  it('keeps a zero-duration syllable silent and voices the next one', () => {
    const samples = mumble([
      ['a', 220, 220, 0, 0.01],
      ['e', 220, 220, 0.02],
    ]);
    expect(samples.every(Number.isFinite)).toBe(true);
    expect(samples.slice(0, 111).every((v) => v === 0)).toBe(true);
    expect(samples.slice(111).some((v) => Math.abs(v) > 0.1)).toBe(true);
  });
  it('is audible and never clips', () => {
    const a = mumble(LINE, { gain: 5 });
    const peak = a.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    expect(peak).toBeGreaterThan(0.3);
    expect(peak).toBeLessThanOrEqual(1);
  });
  it('advances through a long line with linear syllable reads', () => {
    function readsFor(count: number) {
      let reads = 0;
      const syllables = Array.from({ length: count }, (): Syllable => ['a', 220, 220, 0.01]);
      const line = new Proxy(syllables, {
        get(target, key, receiver) {
          if (typeof key === 'string' && /^\d+$/.test(key)) reads++;
          return Reflect.get(target, key, receiver);
        },
      });
      mumble(line, { rate: 1000 });
      return reads;
    }
    expect(readsFor(100)).toBeLessThanOrEqual(2 * readsFor(50) + 1);
  });
  it('preserves every sample across a pitch glide, rest, and vowel change', () => {
    const samples = mumble(
      [
        ['e', 210, 260, 0.005, 0.002],
        ['o', 300, 230, 0.005],
      ],
      { rate: 1000, gain: 0.15 },
    );
    expect([...samples]).toEqual([
      -0, 0.2314930111169815, -0.21449042856693268, 0.08155672997236252, -0.08286377787590027, 2.972455614980163e-12, 0, -0, -0.009045562706887722,
      0.2069433033466339, 0.0337638296186924, -0.040238749235868454,
    ]);
  });
  it('makes a valid .VOC', () => {
    const voc = mumbleVoc(LINE);
    expect(new TextDecoder().decode(voc.slice(0, 19))).toBe('Creative Voice File');
    const back = decodeVoc(voc);
    expect(back.sampleRate).toBeGreaterThan(10000);
    expect(back.samples.length).toBe(mumble(LINE).length);
  });
});

describe('syllablesFromText', () => {
  it('says the same line the same way, and another seed differently', () => {
    const a = syllablesFromText('Hello there, friend!');
    expect(a).toEqual(syllablesFromText('Hello there, friend!'));
    expect(a).not.toEqual(syllablesFromText('Hello there, friend!', { seed: 2 }));
  });
  it('takes vowels from the letters and gives silent words a sound', () => {
    expect(syllablesFromText('hello').map((s) => s[0])).toEqual(['e', 'o']);
    expect(syllablesFromText('shh')).toHaveLength(1);
    expect(syllablesFromText('')).toEqual([]);
  });
  it('voices differ: deep is lower and slower than small', () => {
    const deep = mumbleSeconds(syllablesFromText('good morning', MUMBLE_VOICES.deep));
    const small = mumbleSeconds(syllablesFromText('good morning', MUMBLE_VOICES.small));
    expect(deep).toBeGreaterThan(small);
    const hz = (v: keyof typeof MUMBLE_VOICES) => syllablesFromText('good morning', MUMBLE_VOICES[v])[0][1];
    expect(hz('deep')).toBeLessThan(hz('small'));
  });
  it('renders to a sane .VOC', () => {
    const line = syllablesFromText('Welcome to the show. Are you ready?', MUMBLE_VOICES.bright);
    const samples = mumble(line);
    expect(samples.length / 11025).toBeGreaterThan(1);
    expect(samples.every((v) => Math.abs(v) <= 1)).toBe(true);
  });
});
