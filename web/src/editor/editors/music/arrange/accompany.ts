// "Generate accompaniment": keeps one track's tune and writes a band around it, bar by bar:
// the key and chords heard in the tune (harmony.ts), then a bass line, chord comping (three
// voices, or one for an arpeggio) and drums in the chosen style (styles.ts). Each take is
// seeded, so the same seed gives the same band and a new one gives another take.
//
// It stays a plain Creative Music File that PLAYGAME and SBFMDRV play: rhythm mode from the
// start (FM voices 0-5 melodic, the five drums on MIDI channels 11-15), the tune on one of
// channels 0-5, one note at a time per channel, the band's sounds taken from the editor's
// presets and added to the song's instruments (at most 128), each channel's instrument set
// by a program change at tick 0 (so it is loaded again each time the song repeats). No DOM.
import { addNote, channelNotes, removeChannel, setStartMode, setStartProgram, startProgram } from '../../../../formats/cmfEdit';
import { readSong, writeSong, noteEnd, type CmfSong } from '../../../../formats/cmfSong';
import { findPreset, presetById } from '../../../../audio/oplPresets';
import { chordTones, inferChords, inferKey, type ChordSpan, type Key, type MelNote } from './harmony';
import { styleById, type Comp, type Drum, type Groove, type Style, type StyleId } from './styles';

/** Mulberry32 (Tommy Ettinger, public domain): a small seeded random number generator. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface AccompanyOptions {
  /** The channel whose notes are the tune. */
  melody: number;
  style: StyleId;
  /** 0 is the plainest take; any other number gives another take. */
  seed: number;
}

export interface Accompaniment {
  song: CmfSong;
  key: Key;
  chords: ChordSpan[];
  style: Style;
  /** The tune's channel in the new song (moved to 0 if it was on one rhythm mode silences). */
  melody: number;
  /** What each channel plays, for the summary. */
  parts: { ch: number; what: string }[];
}

/** MIDI channels of the five rhythm-mode drums. */
const DRUM_CH: Record<Drum, number> = { k: 11, s: 12, t: 13, c: 14, h: 15 };
/** Drum pitches: the snare and hi-hat share FM channel 7, the tom and cymbal channel 8 (as games/kit/song.ts). */
const DRUM_NOTE: Record<Drum, number> = { k: 36, s: 55, t: 48, c: 72, h: 55 };

/** The ranges the band keeps to (MIDI notes). */
export const RANGES = { bass: [28, 55], comp: [40, 84] } as const;

/** The tune of a channel as notes in beats. */
export function melodyNotes(song: CmfSong, ch: number): MelNote[] {
  const beat = Math.max(1, song.ticksPerBeat || 48);
  return channelNotes(song, ch).map((n) => ({ start: n.on.tick / beat, len: (noteEnd(song, n) - n.on.tick) / beat, key: n.on.a }));
}

/** The index of an instrument with these settings (bytes 0-10), added when the song has none. */
function instrumentFor(song: CmfSong, patch: Uint8Array): number {
  const same = song.instruments.findIndex((i) => i.subarray(0, 11).every((b, k) => b === patch[k]));
  if (same >= 0) return same;
  if (song.instruments.length >= 128) throw new Error('The song already has 128 instruments, as many as a CMF can hold.');
  song.instruments.push(patch.slice(0, 16));
  return song.instruments.length - 1;
}

function patchOf(id: string): Uint8Array {
  const p = presetById(id);
  if (!p) throw new Error(`No preset ${id}`);
  return p.patch;
}

/** Moves a channel's notes and instrument changes to another channel, keeping its sound. */
function moveChannel(song: CmfSong, from: number, to: number): void {
  if (from === to) return;
  const prog = startProgram(song, from);
  for (const n of song.notes)
    if (n.on.ch === from) {
      n.on.ch = to;
      n.on.status = undefined;
      if (n.off) {
        n.off.ch = to;
        n.off.status = undefined;
      }
    }
  for (const e of song.events) if (e.ch === from && e.type !== 'mode') e.ch = to;
  setStartProgram(song, to, prog);
}

/** A copy of a song. */
export const cloneSong = (song: CmfSong): CmfSong => readSong(writeSong(song));

const clampTo = (n: number, [lo, hi]: readonly [number, number]) => {
  while (n < lo) n += 12;
  while (n > hi) n -= 12;
  return n;
};

/** Writes the accompaniment around the tune; the song given is not changed. */
export function accompany(src: CmfSong, o: AccompanyOptions): Accompaniment {
  const style = styleById(o.style);
  const rand = seededRandom(o.seed * 7919 + 17);
  const pick = <T>(list: T[]): T => (o.seed === 0 ? list[0] : list[Math.floor(rand() * list.length)]);
  const song = cloneSong(src);
  const beat = Math.max(1, song.ticksPerBeat || 48);
  const tick = (beats: number) => Math.round(beats * beat);

  // only the tune stays, on a channel rhythm mode plays
  for (let c = 0; c < 16; c++) if (c !== o.melody) removeChannel(song, c);
  song.events = song.events.filter((e) => e.type !== 'mode' && !(e.type === 'raw' && e.ch !== o.melody));
  const melody = o.melody <= 5 ? o.melody : 0;
  moveChannel(song, o.melody, melody);
  setStartMode(song, true);

  const tune = melodyNotes(song, melody);
  const key = inferKey(tune);
  const lastBeat = Math.max(
    tune.reduce((a, n) => Math.max(a, n.start + n.len), 0),
    song.end.tick / beat,
    1,
  );
  const bars = Math.max(1, Math.ceil(lastBeat / style.beatsPerBar - 1e-3));
  const beats = bars * style.beatsPerBar;
  const chords = inferChords(tune, key, { beatsPerBar: style.beatsPerBar, beats, halves: style.halves, jitter: o.seed === 0 ? 0 : 0.35, rand });

  // the band sits under the tune
  const sorted = tune.map((n) => n.key).sort((a, b) => a - b);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 72;
  const compLow = median >= 67 ? 52 : 45;
  const bassLow = compLow - 16;

  const free = [0, 1, 2, 3, 4, 5].filter((c) => c !== melody);
  const bassCh = free[0];
  const comp: Comp = pick(style.comp);
  const compChs = 'arp' in comp ? [free[1]] : free.slice(1, 4);
  const bassLine = pick(style.bass);
  const grooves = style.grooves.length ? [pick(style.grooves)] : [];
  const sounds = style.sounds;
  setStartProgram(song, bassCh, instrumentFor(song, patchOf(pick(sounds.bass))));
  const compSound = pick(sounds.comp);
  for (const c of compChs) setStartProgram(song, c, instrumentFor(song, patchOf(compSound)));
  const drumSounds: Record<Drum, string> = { k: sounds.kick, s: sounds.snare, t: sounds.tom, c: sounds.cymbal, h: sounds.hat };
  for (const d of Object.keys(DRUM_CH) as Drum[]) setStartProgram(song, DRUM_CH[d], instrumentFor(song, patchOf(drumSounds[d])));

  /** A note on a channel that lets go just before `at + len`, so the next one retriggers. */
  const note = (ch: number, at: number, len: number, n: number, vel: number, legato = 0.9) => {
    const on = tick(at);
    const off = Math.max(on + 1, Math.min(tick(at + len) - 1, on + Math.round(len * beat * legato)));
    addNote(song, ch, n, on, off - on, vel);
  };
  const chordAt = (b: number) => chords.find((s) => b >= s.start - 1e-6 && b < s.start + s.len - 1e-6) ?? chords[chords.length - 1];
  const nextChord = (b: number) => chords.find((s) => s.start > b + 1e-6) ?? chords[0];

  // ---- bass ----
  for (let bar = 0; bar < bars; bar++) {
    const at = bar * style.beatsPerBar;
    for (const [t, len, which] of bassLine) {
      const b = at + t;
      if (b >= beats - 1e-6) break;
      const span = chordAt(b);
      const end = Math.min(b + len, span.start + span.len, beats);
      const [r, third, fifth] = chordTones(span.chord);
      const root = bassLow + ((r - bassLow + 120) % 12);
      let n = root;
      if (which === '5') n = root + ((fifth - r + 12) % 12);
      else if (which === '3') n = root + ((third - r + 12) % 12);
      else if (which === '8') n = root + 12;
      else if (which === 'A') {
        const next = bassLow + ((nextChord(b).chord.root - bassLow + 120) % 12);
        n = next + (next > root ? -1 : 1);
      }
      note(bassCh, b, end - b, clampTo(n, RANGES.bass), style.vel.bass, 0.85);
    }
  }

  // ---- comping ----
  const voicing = (s: ChordSpan) =>
    chordTones(s.chord)
      .map((pc) => compLow + ((pc - compLow + 120) % 12))
      .sort((a, b) => a - b);
  for (let bar = 0; bar < bars; bar++) {
    const at = bar * style.beatsPerBar;
    if ('arp' in comp) {
      // up and down the chord, one channel
      const steps = Math.round(style.beatsPerBar / comp.arp);
      for (let k = 0; k < steps; k++) {
        const b = at + k * comp.arp;
        const v = voicing(chordAt(b));
        const order = [v[0], v[1], v[2], v[0] + 12 <= RANGES.comp[1] ? v[0] + 12 : v[1]];
        note(compChs[0], b, comp.arp, clampTo(order[k % order.length], RANGES.comp), style.vel.comp, 0.8);
      }
      continue;
    }
    for (const [t, len] of comp.hits) {
      const b = at + t;
      const span = chordAt(b);
      // a chord stops where the next one starts
      const end = Math.min(b + len, span.start + span.len, beats);
      voicing(span).forEach((n, k) => note(compChs[k], b, end - b, clampTo(n, RANGES.comp), style.vel.comp, 0.85));
    }
  }

  // ---- drums ----
  for (let bar = 0; bar < bars && grooves.length; bar++) {
    const at = bar * style.beatsPerBar;
    const fill = style.fill && (bar === bars - 1 || bar % 4 === 3) && bars > 1;
    const g: Groove = { ...(fill ? style.fill : grooves[0]) };
    if (style.crash && bar === 0) g.c = 'X' + '.'.repeat((g.k ?? '........').length - 1);
    for (const d of Object.keys(g) as Drum[]) {
      const grid = g[d]!;
      const step = style.beatsPerBar / grid.length;
      [...grid].forEach((c, i) => {
        if (c === '.') return;
        const v = Math.min(127, Math.round(style.vel.drums * (c === 'X' ? 1.15 : d === 'h' && i % 2 ? 0.8 : 1)));
        note(DRUM_CH[d], at + i * step, Math.min(step, 0.5), DRUM_NOTE[d], v, 0.6);
      });
    }
  }

  song.end.tick = tick(beats);
  const parts = [
    { ch: melody, what: 'the tune' },
    { ch: bassCh, what: `bass (${presetName(song, bassCh)})` },
    ...compChs.map((ch) => ({ ch, what: `${'arp' in comp ? 'arpeggio' : 'chords'} (${presetName(song, ch)})` })),
    ...(grooves.length ? [{ ch: 11, what: 'drums' }] : []),
  ];
  return { song, key, chords, style, melody, parts };
}

function presetName(song: CmfSong, ch: number): string {
  const p = startProgram(song, ch);
  const inst = song.instruments[p];
  return (inst && findPreset(inst)?.name) || `instrument ${p + 1}`;
}
