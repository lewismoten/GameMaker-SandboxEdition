// "Copy melody to a new song": one track's tune as a song of its own, faster or slower and
// optionally transposed (a slow version for a sad scene, a fast one for a chase), ready for
// the accompaniment generator. No DOM.
import { removeChannel, scaleTime, setStartProgram, startProgram } from '../../../../formats/cmfEdit';
import type { CmfSong } from '../../../../formats/cmfSong';
import { cloneSong } from './accompany';

interface CopyTuneOptions {
  /** The channel whose notes are the tune. */
  melody: number;
  /** How fast against the original: 2 is twice as fast, 0.5 half as fast. */
  speed: number;
  /** Semitones up (or down when negative). */
  transpose: number;
}

/** Keeps a note inside MIDI's range by octaves. */
const inRange = (n: number) => {
  while (n > 127) n -= 12;
  while (n < 0) n += 12;
  return n;
};

/** A new song holding only the tune (on channel 0, with its instrument), at the new speed and pitch. */
export function copyTune(src: CmfSong, o: CopyTuneOptions): CmfSong {
  const speed = Math.max(0.1, Math.min(10, Number.isFinite(o.speed) ? o.speed : 1));
  const shift = Math.round(o.transpose) || 0;
  const song = cloneSong(src);
  const prog = startProgram(song, o.melody);
  for (let c = 0; c < 16; c++) if (c !== o.melody) removeChannel(song, c);
  // only the notes and instrument changes: controllers PlayIt ignores and mode switches go
  song.events = song.events.filter((e) => e.type === 'program' && e.ch === o.melody);
  song.leadIn = 0;
  song.leadInBytes = undefined;
  for (const n of song.notes) {
    n.on.ch = 0;
    n.on.a = inRange(n.on.a + shift);
    n.on.status = undefined;
    if (n.off) {
      n.off.ch = 0;
      n.off.a = n.on.a;
      n.off.status = undefined;
    }
  }
  for (const e of song.events) e.ch = 0;
  setStartProgram(song, 0, prog);
  // a beat stays a beat: the beat length stretches with the notes
  scaleTime(song, 1 / speed);
  return song;
}
