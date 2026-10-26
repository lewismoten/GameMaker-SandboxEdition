// Copying a track and pasting it into another song: notes, velocities, instruments and program
// changes arrive as they were, on the same beats when the songs count beats differently; a full
// song is refused unchanged; drums stay drums when they can; the result is a CMF PLAYGAME plays.
import { describe, expect, it } from 'vitest';
import { song as composeSong, INSTRUMENTS } from '../../../audio/compose';
import { channelNotes, programChanges, setProgramAt, setStartMode, startMode, startProgram, usedChannels } from '../../../formats/cmfEdit';
import { noteEnd, readSong, traceMusic, writeSong, musicOf, type CmfSong } from '../../../formats/cmfSong';
import { copyTrack, isTrackClip, pasteTrack, type Pasted, type TrackClip } from './trackClip';

const make = (bpm: number, voices: { channel: number; instrument?: Uint8Array; notes: string }[]): CmfSong =>
  readSong(
    composeSong(
      bpm,
      voices.map((v) => ({ instrument: INSTRUMENTS.piano, ...v })),
    ),
  );

const notesOf = (s: CmfSong, ch: number) => channelNotes(s, ch).map((n) => [n.on.tick, noteEnd(s, n) - n.on.tick, n.on.a, n.on.b]);
const sbiOf = (s: CmfSong, ch: number) => [...s.instruments[startProgram(s, ch)]];

/** Pastes through JSON, the way the clipboard keeps it. */
function paste(target: CmfSong, clip: TrackClip, taken = usedChannels(target)): Pasted {
  const kept: unknown = JSON.parse(JSON.stringify(clip));
  expect(isTrackClip(kept)).toBe(true);
  const r = pasteTrack(target, kept as TrackClip, taken);
  if ('error' in r) throw new Error(r.error);
  return r;
}

describe('copy and paste a track', () => {
  it('round-trips notes, velocities, instrument and program changes', () => {
    const src = make(120, [
      { channel: 0, notes: 'C4 q, E4 q' },
      { channel: 2, instrument: INSTRUMENTS.bass, notes: 'C2 h, G2 q, F2 q' },
    ]);
    channelNotes(src, 2)[1].on.b = 64;
    // a second instrument part way through
    src.instruments.push(INSTRUMENTS.lead);
    setProgramAt(src, 2, channelNotes(src, 2)[2].on.tick, src.instruments.length - 1);
    const clip = copyTrack(src, 2, 'title.cmf', 'Bass');
    const dst = make(120, [{ channel: 0, notes: 'G4 w' }]);
    const r = paste(dst, clip);
    expect(r.ch).toBe(1);
    expect(r.scale).toBe(1);
    expect(notesOf(dst, 1)).toEqual(notesOf(src, 2));
    expect(sbiOf(dst, 1)).toEqual(sbiOf(src, 2));
    const later = programChanges(dst, 1).at(-1)!;
    expect(later.tick).toBe(channelNotes(src, 2)[2].on.tick);
    expect([...dst.instruments[later.a]]).toEqual([...INSTRUMENTS.lead]);
    // the song already there is unchanged
    expect(notesOf(dst, 0)).toEqual(notesOf(make(120, [{ channel: 0, notes: 'G4 w' }]), 0));

    // it saves as a CMF PLAYGAME plays the same way
    const bytes = writeSong(dst);
    const back = readSong(bytes);
    expect(back.clockTicks).toBe(146);
    expect(notesOf(back, 1)).toEqual(notesOf(src, 2));
    expect(sbiOf(back, 1)).toEqual(sbiOf(src, 2));
    const trace = traceMusic(musicOf(bytes), 2000, true);
    const once = trace.slice(
      0,
      trace.findIndex((t) => t.endsWith(':restart')),
    );
    expect(once.filter((t) => /:on 1 /.test(t)).length).toBe(3);
    expect(trace.some((t) => t.includes('hang'))).toBe(false);
  });

  it('rescales the timing to land on the same beats', () => {
    // 120 bpm: 73 ticks a beat; 60 bpm: 146
    const src = make(120, [{ channel: 0, notes: 'C4 q, D4 h, E4 q' }]);
    const dst = make(60, [{ channel: 0, notes: 'C3 w' }]);
    const r = paste(dst, copyTrack(src, 0, 'a.cmf', 'Piano'));
    expect(r.scale).toBe(2);
    const beat = (s: CmfSong) => s.ticksPerBeat;
    const inBeats = (s: CmfSong, ch: number) =>
      notesOf(s, ch).map(([t, len, key]) => [Math.round((t / beat(s)) * 100), Math.round((len / beat(s)) * 100), key]);
    expect(inBeats(dst, 1)).toEqual(inBeats(src, 0));
  });

  it('refuses a song with no free track and leaves it alone', () => {
    const voices = Array.from({ length: 9 }, (_, c) => ({ channel: c, notes: 'C4 q' }));
    const dst = make(120, voices);
    const before = writeSong(dst);
    const r = pasteTrack(dst, copyTrack(make(120, [{ channel: 0, notes: 'E4 q' }]), 0, 'a.cmf', 'Piano'), usedChannels(dst));
    expect('error' in r && r.error).toMatch(/no free track/);
    expect(writeSong(dst)).toEqual(before);
  });

  it('keeps a drum on its drum channel, and turns on the drum kit when that costs nothing', () => {
    const src = make(120, [{ channel: 12, notes: 'D3 q, D3 q' }]);
    setStartMode(src, true);
    const clip = copyTrack(src, 12, 'beat.cmf', 'Snare drum');
    expect(clip.drum).toBe(12);

    const kit = make(120, [{ channel: 0, notes: 'C4 w' }]);
    setStartMode(kit, true);
    expect(paste(kit, clip).ch).toBe(12);
    // a second snare has nowhere to go
    expect(pasteTrack(kit, clip, usedChannels(kit))).toEqual({ error: expect.stringMatching(/already has a snare drum/) as string });

    const melody = make(120, [{ channel: 0, notes: 'C4 w' }]);
    const r = paste(melody, clip);
    expect(r).toMatchObject({ ch: 12, drumKitOn: true });
    expect(startMode(melody)).toBe(true);
    expect(startMode(readSong(writeSong(melody)))).toBe(true);

    // tracks 7-9 in use: the drum kit would silence them, so the drum comes in as a melody track
    const busy = make(120, [{ channel: 7, notes: 'C4 w' }]);
    const m = paste(busy, clip);
    expect(m).toMatchObject({ ch: 0, drumAsMelody: true });
    expect(startMode(busy)).toBe(false);
    expect(notesOf(busy, 0)).toEqual(notesOf(src, 12));
  });

  it('puts a melody track into a drum-kit song on a melody voice', () => {
    const dst = make(120, [{ channel: 11, notes: 'C3 q' }]);
    setStartMode(dst, true);
    const taken = [0, 1, 2, 3, 4, 11];
    const r = paste(dst, copyTrack(make(120, [{ channel: 3, notes: 'E4 q' }]), 3, 'a.cmf', 'Piano'), taken);
    expect(r.ch).toBe(5);
    const full = [...taken, 5];
    expect(pasteTrack(dst, copyTrack(make(120, [{ channel: 3, notes: 'E4 q' }]), 3, 'a.cmf', 'Piano'), full)).toEqual({
      error: expect.stringMatching(/6 melody tracks/) as string,
    });
  });

  it('rejects a clip that is not one', () => {
    expect(isTrackClip(null)).toBe(false);
    expect(isTrackClip({ v: 1, from: 'a.cmf', name: 'x', ticksPerBeat: 48, ch: 0, notes: [], programs: [[0, 1]], instruments: [], raw: [] })).toBe(false);
  });
});
