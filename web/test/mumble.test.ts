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
  it('is audible and never clips', () => {
    const a = mumble(LINE, { gain: 5 });
    const peak = a.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    expect(peak).toBeGreaterThan(0.3);
    expect(peak).toBeLessThanOrEqual(1);
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
