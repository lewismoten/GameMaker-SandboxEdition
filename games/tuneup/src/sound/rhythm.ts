// A song in the OPL2's rhythm mode: six melodic voices (channels 0-5) and the chip's five drums
// (MIDI channels 11-15: bass drum, snare, tom, cymbal, hi-hat), each drum a preset from the
// music editor's drum kit. CMF controller 0x67 turns rhythm mode on before the first note.
// The snare and hi-hat share an FM channel, and so do the tom and cymbal: two drums that share
// one sound together but can't each have their own pitch.
import { encodeCmf, type CmfEvent } from '@lewismoten/gamemaker-sandbox-engine/formats/cmf';
import { INSTRUMENTS, midi, type Voice } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { LEN } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

/** A drum's part: its MIDI channel (11-15), its preset's patch, and its hits as notes ("C2 q, r q"). */
export interface DrumPart {
  channel: 11 | 12 | 13 | 14 | 15;
  instrument: Uint8Array;
  notes: string;
  velocity?: number;
}

/** Beats in a note string. */
const beatsOf = (notes: string) =>
  notes
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .reduce((n, t) => n + LEN[t.endsWith('.') ? t.slice(-2, -1) : t.slice(-1)] * (t.endsWith('.') ? 1.5 : 1), 0);

/** Writes the song; every voice and drum must last the same number of beats. */
export function rhythmTune(bpm: number, voices: Voice[], drums: DrumPart[]): Uint8Array {
  const all = [...voices, ...drums];
  const beats = all.map((x) => beatsOf(x.notes));
  if (beats.some((b) => Math.abs(b - beats[0]) > 1e-6)) throw new Error(`Voices differ in length: ${beats.join(' ')}`);
  if (voices.some((x) => x.channel > 5)) throw new Error('rhythm mode has melodic channels 0-5 only');
  const tpb = Math.round((146 * 60) / bpm);
  const instruments: Uint8Array[] = [];
  const events: CmfEvent[] = [{ tick: 0, data: [0xb0, 0x67, 0x01] }];
  for (const x of all) {
    instruments[x.channel] = x.instrument;
    let t = 0;
    for (const raw of x.notes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)) {
      const m = /^(.+?)\s+([whqest])(\.?)$/.exec(raw);
      if (!m) throw new Error(`Bad note "${raw}"`);
      const len = LEN[m[2]] * (m[3] ? 1.5 : 1) * tpb;
      m[1]
        .replace(/[[\]]/g, ' ')
        .trim()
        .split(/\s+/)
        .forEach((name, k) => {
          const n = midi(name);
          if (n === null) return;
          const ch = x.channel + k;
          if (k > 0) instruments[ch] ??= x.instrument;
          const note = n + ('transpose' in x ? (x.transpose ?? 0) : 0);
          events.push({ tick: Math.round(t), data: [0x90 | ch, note, x.velocity ?? 100] });
          events.push({ tick: Math.round(t + len * (x.channel > 10 ? 0.5 : 0.92)), data: [0x80 | ch, note, 0] });
        });
      t += len;
    }
  }
  // the loop's end, marked by setting channel 1's volume to where it already is (blankSong's way)
  events.push({ tick: Math.round(beats[0] * tpb), data: [0xb0, 7, 100] });
  for (let c = 0; c < 16; c++) instruments[c] ??= INSTRUMENTS.piano;
  return encodeCmf({ instruments, events, ticksPerBeat: tpb });
}
