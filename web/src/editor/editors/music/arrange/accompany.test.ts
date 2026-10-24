// The generated band stays a CMF PLAYGAME plays: rhythm mode, notes in range, one note at a
// time on each FM voice, only the channels rhythm mode sounds, at most 128 instruments, and
// the tune untouched. A seed gives the same take again; another seed gives another.
import { describe, expect, it } from 'vitest';
import { song as composeSong, INSTRUMENTS } from '../../../../audio/compose';
import { channelNotes, channelSounds, startMode, startProgram } from '../../../../formats/cmfEdit';
import { noteEnd, readSong, traceMusic, writeSong, musicOf, type CmfSong } from '../../../../formats/cmfSong';
import { presetById } from '../../../../audio/oplPresets';
import { accompany, RANGES } from './accompany';
import { copyTune } from './copyTune';
import { STYLES } from './styles';

const TWINKLE = 'C4 q, C4 q, G4 q, G4 q, A4 q, A4 q, G4 h, F4 q, F4 q, E4 q, E4 q, D4 q, D4 q, C4 h';
/** A tune on channel 7 (which rhythm mode silences) with an old bass track on channel 2. */
const source = (): CmfSong =>
  readSong(
    composeSong(120, [
      { channel: 7, instrument: INSTRUMENTS.lead, notes: TWINKLE },
      { channel: 2, instrument: INSTRUMENTS.bass, notes: 'C2 w, F2 w, C2 w, G2 w' },
    ]),
  );

const tuneOf = (s: CmfSong, ch: number) => channelNotes(s, ch).map((n) => [n.on.tick, noteEnd(s, n), n.on.a, n.on.b]);

describe('generate accompaniment', () => {
  for (const style of STYLES)
    it(`writes a ${style.name.toLowerCase()} that PLAYGAME can play`, () => {
      const src = source();
      const before = writeSong(src);
      const r = accompany(src, { melody: 7, style: style.id, seed: 0 });
      // the song given is left alone
      expect(writeSong(src)).toEqual(before);
      const s = readSong(writeSong(r.song));
      expect(startMode(s)).toBe(true);
      expect(r.key.name).toBe('C major');
      // the tune moved to a voice rhythm mode plays, note for note
      expect(r.melody).toBe(0);
      expect(tuneOf(s, 0)).toEqual(tuneOf(src, 7));
      expect(s.instruments.length).toBeLessThanOrEqual(128);
      const channels = new Set(s.notes.map((n) => n.on.ch));
      for (const ch of channels) expect(channelSounds(ch, true)).toBe(true);
      // the first take always has a kick drum
      expect(channels.has(11)).toBe(true);
      for (const ch of channels) {
        const notes = channelNotes(s, ch);
        // one FM voice is one note at a time
        for (let i = 1; i < notes.length; i++) expect(notes[i].on.tick).toBeGreaterThanOrEqual(noteEnd(s, notes[i - 1]));
        if (ch === 0) continue;
        for (const n of notes) {
          expect(n.on.b).toBeGreaterThanOrEqual(1);
          expect(n.on.b).toBeLessThanOrEqual(127);
          expect(noteEnd(s, n)).toBeLessThanOrEqual(s.end.tick);
          if (ch < 11) {
            const [lo, hi] = ch === r.parts[1].ch ? RANGES.bass : RANGES.comp;
            expect(n.on.a).toBeGreaterThanOrEqual(lo);
            expect(n.on.a).toBeLessThanOrEqual(hi);
          }
        }
        // each band channel plays one of the style's preset sounds
        const inst = s.instruments[startProgram(s, ch)];
        const ids =
          ch < 11
            ? [...style.sounds.bass, ...style.sounds.comp]
            : [style.sounds.kick, style.sounds.snare, style.sounds.tom, style.sounds.cymbal, style.sounds.hat];
        expect(
          ids.some((id) =>
            presetById(id)!
              .patch.subarray(0, 11)
              .every((b, k) => b === inst[k]),
          ),
        ).toBe(true);
      }
      // ends on a bar line and plays through PlayIt without hanging
      expect(s.end.tick % (s.ticksPerBeat * style.beatsPerBar)).toBe(0);
      const trace = traceMusic(musicOf(writeSong(s)), s.end.tick * 2 + 10);
      expect(trace.some((t) => t.endsWith('hang'))).toBe(false);
      expect(trace.filter((t) => t.endsWith('restart')).length).toBeGreaterThanOrEqual(1);
    });

  it('every sound a style names is one of the presets', () => {
    for (const s of STYLES)
      for (const id of [...s.sounds.bass, ...s.sounds.comp, s.sounds.kick, s.sounds.snare, s.sounds.tom, s.sounds.cymbal, s.sounds.hat])
        expect(presetById(id), id).toBeDefined();
  });

  it('gives the same take for the same seed and another for a new one', () => {
    const a = writeSong(accompany(source(), { melody: 7, style: 'rock', seed: 3 }).song);
    const b = writeSong(accompany(source(), { melody: 7, style: 'rock', seed: 3 }).song);
    expect(a).toEqual(b);
    const takes = new Set([1, 2, 3, 4, 5, 6].map((seed) => writeSong(accompany(source(), { melody: 7, style: 'rock', seed }).song).join(',')));
    expect(takes.size).toBeGreaterThan(1);
  });

  it('keeps a tune already on a melody voice where it is', () => {
    const src = readSong(composeSong(100, [{ channel: 3, instrument: INSTRUMENTS.lead, notes: TWINKLE }]));
    const r = accompany(src, { melody: 3, style: 'waltz', seed: 0 });
    expect(r.melody).toBe(3);
    expect(tuneOf(r.song, 3)).toEqual(tuneOf(src, 3));
    expect(r.song.end.tick % (r.song.ticksPerBeat * 3)).toBe(0);
  });
});

describe('copy melody to a new song', () => {
  it('keeps only the tune, at the new speed and pitch', () => {
    const src = source();
    const s = copyTune(src, { melody: 7, speed: 0.5, transpose: -3 });
    expect([...new Set(s.notes.map((n) => n.on.ch))]).toEqual([0]);
    const was = channelNotes(src, 7);
    const now = channelNotes(s, 0);
    expect(now).toHaveLength(was.length);
    now.forEach((n, i) => {
      expect(n.on.tick).toBe(was[i].on.tick * 2);
      expect(n.on.a).toBe(was[i].on.a - 3);
    });
    // a beat is still a beat (twice as long)
    expect(s.ticksPerBeat).toBe(src.ticksPerBeat * 2);
    expect(s.end.tick).toBe(src.end.tick * 2);
    // and it sounds as the tune did
    expect(s.instruments[startProgram(s, 0)]).toEqual(src.instruments[startProgram(src, 7)]);
  });

  it('goes twice as fast, and the band follows', () => {
    const src = source();
    const fast = copyTune(src, { melody: 7, speed: 2, transpose: 12 });
    expect(channelNotes(fast, 0)[1].on.tick).toBe(Math.round(channelNotes(src, 7)[1].on.tick / 2));
    expect(channelNotes(fast, 0)[0].on.a).toBe(channelNotes(src, 7)[0].on.a + 12);
    const r = accompany(fast, { melody: 0, style: 'chiptune', seed: 1 });
    expect(r.key.name).toBe('C major');
    expect(r.song.end.tick).toBe(fast.ticksPerBeat * 16);
  });
});
