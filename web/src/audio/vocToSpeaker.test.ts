// A .voc's samples as PC speaker steps: synthetic tones come out at their pitch, silence as 0,
// a slide keeps its direction, noise is not mistaken for a clean tone, and timing fits.
import { describe, expect, it } from 'vitest';
import { NUMFREQ } from '../formats/sound';
import { SPEAKER_STEP, findPitch, vocToSpeaker, zeroCrossingPitch } from './vocToSpeaker';

const RATE = 11025;
const tone = (f: number, seconds: number, rate = RATE, wave: 'sine' | 'square' = 'sine', amp = 0.8) =>
  Float32Array.from({ length: Math.round(seconds * rate) }, (_, i) => {
    const s = Math.sin((2 * Math.PI * f * i) / rate);
    return amp * (wave === 'sine' ? s : Math.sign(s));
  });
const near = (got: number, want: number, cents = 30) => expect(Math.abs(1200 * Math.log2(got / want))).toBeLessThan(cents);

describe('findPitch', () => {
  it.each([110, 220, 440, 880, 1500, 3000])('finds a %i Hz sine', (f) => {
    const p = findPitch(tone(f, 0.03), RATE);
    near(p.freq, f);
    expect(p.clarity).toBeGreaterThan(0.9);
  });

  it('finds the fundamental of a square wave, not an overtone', () => {
    near(findPitch(tone(300, 0.03, 22050, 'square'), 22050).freq, 300);
  });

  it('sees noise as unclear', () => {
    let seed = 7;
    const noise = Float32Array.from({ length: 400 }, () => ((seed = (seed * 16807) % 2147483647), seed / 2147483647 - 0.5));
    expect(findPitch(noise, RATE).clarity).toBeLessThan(0.6);
  });
});

describe('zeroCrossingPitch', () => {
  it('is near the pitch of a tone', () => near(zeroCrossingPitch(tone(500, 0.05), RATE), 500, 60));
});

describe('vocToSpeaker', () => {
  it('turns a steady tone into steady steps', () => {
    const steps = vocToSpeaker(tone(440, NUMFREQ * SPEAKER_STEP), RATE, 'start');
    expect(steps).toHaveLength(NUMFREQ);
    for (const s of steps) near(s, 440);
  });

  it('is silent where the sound is, and after it ends', () => {
    const half = Math.round((NUMFREQ / 2) * SPEAKER_STEP * RATE);
    const x = new Float32Array(Math.round(NUMFREQ * SPEAKER_STEP * RATE));
    x.set(tone(660, (NUMFREQ / 2) * SPEAKER_STEP).subarray(0, half));
    const steps = vocToSpeaker(x, RATE, 'start');
    for (let i = 0; i < 16; i++) near(steps[i], 660);
    for (let i = 20; i < NUMFREQ; i++) expect(steps[i]).toBe(0);
    expect([...vocToSpeaker(tone(660, 0.05), RATE, 'start').slice(10)].every((v) => v === 0)).toBe(true);
  });

  it('fits a long sound into 36 steps when asked, keeping its pitch', () => {
    const x = new Float32Array(RATE); // one second: 500 Hz, then 1000 Hz
    x.set(tone(500, 0.5));
    x.set(tone(1000, 0.5), RATE / 2);
    const whole = vocToSpeaker(x, RATE, 'whole');
    near(whole[5], 500);
    near(whole[30], 1000);
    const start = vocToSpeaker(x, RATE, 'start');
    near(start[30], 500); // the first quarter second only
  });

  it('follows a rising slide', () => {
    const n = Math.round(NUMFREQ * SPEAKER_STEP * RATE);
    let ph = 0;
    const x = Float32Array.from({ length: n }, (_, i) => {
      ph += (2 * Math.PI * (300 + (900 * i) / n)) / RATE;
      return 0.7 * Math.sin(ph);
    });
    const steps = vocToSpeaker(x, RATE, 'start');
    expect(steps[30]).toBeGreaterThan(steps[5] * 1.8);
  });

  it('keeps noise on (it hops) rather than dropping it', () => {
    let seed = 3;
    const noise = Float32Array.from({ length: RATE / 4 }, () => ((seed = (seed * 16807) % 2147483647), (seed / 2147483647 - 0.5) * 1.6));
    const steps = vocToSpeaker(noise, RATE, 'start');
    expect(steps.filter((v) => v > 0).length).toBeGreaterThan(30);
    expect(new Set(steps).size).toBeGreaterThan(10);
  });

  it('is empty for an empty sound', () => expect([...vocToSpeaker(new Float32Array(0), RATE)]).toEqual(new Array(NUMFREQ).fill(0)));
});
