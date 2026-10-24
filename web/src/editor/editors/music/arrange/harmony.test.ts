// The key and chords heard in known tunes.
import { describe, expect, it } from 'vitest';
import { inferChords, inferKey, type MelNote } from './harmony';

/** Notes by name ("C4 1, E4 1, G4 2"): MIDI and length in beats, played one after another. */
function tune(text: string): MelNote[] {
  const pcs: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let t = 0;
  return text.split(',').map((s) => {
    const [name, len] = s.trim().split(/\s+/);
    const m = /^([A-G])([#b]?)(\d)$/.exec(name)!;
    const key = 12 * (Number(m[3]) + 1) + pcs[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    const n = { start: t, len: Number(len), key };
    t += n.len;
    return n;
  });
}

const names = (notes: MelNote[], beatsPerBar = 4, halves = false) => {
  const key = inferKey(notes);
  const beats = notes.reduce((a, n) => Math.max(a, n.start + n.len), 0);
  return inferChords(notes, key, { beatsPerBar, beats, halves }).map((s) => s.chord.name);
};

describe('the key of a tune', () => {
  it('hears C major in its scale', () => {
    expect(inferKey(tune('C4 1, D4 1, E4 1, F4 1, G4 1, A4 1, B4 1, C5 2')).name).toBe('C major');
  });
  it('hears A minor with its raised seventh', () => {
    expect(inferKey(tune('A3 1, B3 1, C4 1, D4 1, E4 1, F4 1, G#4 1, A4 2, E4 1, C4 1, A3 2')).name).toBe('A minor');
  });
  it('hears G major in Twinkle, Twinkle moved up a fifth', () => {
    const tw = tune('G4 1, G4 1, D5 1, D5 1, E5 1, E5 1, D5 2, C5 1, C5 1, B4 1, B4 1, A4 1, A4 1, G4 2');
    expect(inferKey(tw).name).toBe('G major');
  });
  it('is C major with no notes', () => {
    expect(inferKey([]).name).toBe('C major');
  });
});

describe('the chords of a tune', () => {
  it('names the chord each bar spells out', () => {
    // C, F, G, Am, then home: one arpeggio a bar
    const t = tune('C4 1, E4 1, G4 1, C5 1, F4 1, A4 1, C5 1, A4 1, G4 1, B4 1, D5 1, B4 1, A4 1, C5 1, E5 1, C5 1, C4 1, E4 1, G4 2');
    expect(names(t)).toEqual(['C', 'F', 'G', 'Am', 'C']);
  });
  it('splits Twinkle, Twinkle at the half bar where its harmony moves', () => {
    const t = tune('C4 1, C4 1, G4 1, G4 1, A4 1, A4 1, G4 2, F4 1, F4 1, E4 1, E4 1, D4 1, D4 1, C4 2');
    const key = inferKey(t);
    const spans = inferChords(t, key, { beatsPerBar: 4, beats: 16, halves: true });
    expect(spans.map((s) => s.chord.degree)).toEqual(['I', 'IV', 'I', 'IV', 'I', 'V', 'I']);
    expect(spans.map((s) => s.start)).toEqual([0, 4, 6, 8, 10, 12, 14]);
  });
  it('hears a waltz in three', () => {
    // G major: G, C, D, G (one bar of three beats each)
    const t = tune('G4 1, B4 1, D5 1, C5 1, E5 1, G4 1, D5 1, F#4 1, A4 1, G4 3');
    expect(names(t, 3)).toEqual(['G', 'C', 'D', 'G']);
  });
  it('fills bars with no notes from the bars around them', () => {
    const t = tune('C4 1, E4 1, G4 2');
    const key = inferKey(t);
    const spans = inferChords(t, key, { beatsPerBar: 4, beats: 12 });
    expect(spans).toHaveLength(3);
    expect(spans.every((s) => s.chord.degree === 'I')).toBe(true);
  });
  it('gives the same chords without jitter, and a valid progression with it', () => {
    const t = tune('E4 1, D4 1, C4 1, D4 1, E4 1, E4 1, E4 2, D4 1, D4 1, D4 2, E4 1, G4 1, G4 2');
    const key = inferKey(t);
    const a = inferChords(t, key, { beatsPerBar: 4, beats: 16 });
    const b = inferChords(t, key, { beatsPerBar: 4, beats: 16 });
    expect(a).toEqual(b);
    let r = 1;
    const rand = () => (r = (r * 16807) % 2147483647) / 2147483647;
    const c = inferChords(t, key, { beatsPerBar: 4, beats: 16, jitter: 1, rand });
    expect(c.reduce((n, s) => n + s.len, 0)).toBe(16);
  });
});
