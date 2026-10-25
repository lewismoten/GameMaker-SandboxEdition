// "Generate accompaniment": keeps one track's tune and writes a band around it, bar by bar:
// the key and chords heard in the tune (harmony.ts), then a bass line, chord comping (three
// voices, or one for an arpeggio) and drums in the chosen style (styles.ts). Each take is
// seeded, so the same seed gives the same band and a new one gives another take.
//
// It stays a plain Creative Music File that PLAYGAME and SBFMDRV play: rhythm mode from the
// start (FM voices 0-5 melodic, the five drums on MIDI channels 11-15), the tune on one of
// channels 0-5, one note at a time per channel, the band's sounds taken from the editor's
// presets and added to the song's instruments (at most 128), each channel's instrument set
// by a program change at tick 0 (so it is loaded again each time the song repeats). Tracks the
// author keeps stay as they are (moved to a free melody voice if rhythm mode would silence
// them), and the band takes only the channels left; a part with no room is left out and said
// so in the take's notes. No DOM.
import { addNote, channelNotes, removeChannel, setStartMode, setStartProgram, startMode, startProgram } from '../../../../formats/cmfEdit';
import { readSong, writeSong, noteEnd, type CmfSong } from '../../../../formats/cmfSong';
import { findPreset, presetById } from '../../../../audio/oplPresets';
import { chordTones, inferChords, inferKey, type ChordSpan, type Key, type MelNote } from './harmony';
import { styleById, type Comp, type Drum, type Groove, type Style, type StyleId } from './styles';

/** Mulberry32 (Tommy Ettinger, public domain): a small seeded random number generator. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface AccompanyOptions {
  /** The channel whose notes are the tune. */
  melody: number;
  style: StyleId;
  /** 0 is the plainest take; any other number gives another take. */
  seed: number;
  /** Channels kept as they are besides the tune; the band goes only on the others. */
  keep?: number[];
}

export interface Accompaniment {
  song: CmfSong;
  key: Key;
  chords: ChordSpan[];
  style: Style;
  /** The tune's channel in the new song (moved to 0 if it was on one rhythm mode silences). */
  melody: number;
  /** What each channel plays, for the summary: `tracks` names them ("Track 2", "Tracks 12–16"). */
  parts: { ch: number; tracks: string; what: string }[];
  /** Parts left out or thinned for want of free channels, in words. */
  short: string[];
}

/** MIDI channels of the five rhythm-mode drums. */
const DRUM_CH: Record<Drum, number> = { k: 11, s: 12, t: 13, c: 14, h: 15 };
const DRUM_NAME: Record<Drum, string> = { k: 'kick', s: 'snare', t: 'tom', c: 'cymbal', h: 'hi-hat' };
/** Drum pitches: the snare and hi-hat share FM channel 7, the tom and cymbal channel 8 (as games/kit/song.ts). */
const DRUM_NOTE: Record<Drum, number> = { k: 36, s: 55, t: 48, c: 72, h: 55 };

/** The ranges the band keeps to (MIDI notes). */
export const RANGES = { bass: [28, 55], comp: [40, 84] } as const;

/** The tune of a channel as notes in beats. */
function melodyNotes(song: CmfSong, ch: number): MelNote[] {
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

  // only the tune and the kept tracks stay, each on a channel rhythm mode plays
  const wasRhythm = startMode(src);
  const kept = [...new Set(o.keep ?? [])].filter((c) => c !== o.melody && c >= 0 && c < 16 && channelNotes(src, c).length).sort((a, b) => a - b);
  const stays = new Set([o.melody, ...kept]);
  for (let c = 0; c < 16; c++) if (!stays.has(c)) removeChannel(song, c);
  song.events = song.events.filter((e) => e.type !== 'mode' && !(e.type === 'raw' && !stays.has(e.ch)));
  // a kept drum track (rhythm mode already on) stays a drum; any other track needs one of voices 0-5
  const keptDrums = kept.filter((c) => wasRhythm && c >= 11);
  const keptVoices = kept.filter((c) => !keptDrums.includes(c));
  const voiceOf = new Map<number, number>();
  const taken = new Set([o.melody, ...keptVoices].filter((c) => c <= 5));
  const freeVoices = () => [0, 1, 2, 3, 4, 5].filter((c) => !taken.has(c));
  for (const c of [o.melody, ...keptVoices]) {
    if (c <= 5) {
      voiceOf.set(c, c);
      continue;
    }
    const to = freeVoices()[0];
    if (to === undefined)
      throw new Error(`Rhythm mode plays only 6 melody tracks (1–6), and the tune and the kept tracks need ${keptVoices.length + 1}. Keep fewer tracks.`);
    taken.add(to);
    voiceOf.set(c, to);
  }
  for (const [from, to] of voiceOf) moveChannel(song, from, to);
  const melody = voiceOf.get(o.melody)!;
  setStartMode(song, true);

  const tune = melodyNotes(song, melody);
  const key = inferKey(tune);
  const lastBeat = Math.max(
    tune.reduce((a, n) => Math.max(a, n.start + n.len), 0),
    keptEnd(song, melody) / beat,
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

  // the band takes the voices left: the bass first, then the chords (three voices, or one to arpeggiate)
  const free = freeVoices();
  const short: string[] = [];
  const whyFull = kept.length ? 'the tune and the tracks you kept fill tracks 1–6' : 'the tune fills them';
  const bassCh: number | undefined = free[0];
  const comp: Comp = pick(style.comp);
  const compChs = 'arp' in comp ? free.slice(1, 2) : free.slice(1, 4);
  if (bassCh === undefined) short.push(`No bass: ${whyFull}.`);
  if (!compChs.length) short.push(`No ${'arp' in comp ? 'arpeggio' : 'chords'}: no melody track is left for them (${whyFull}).`);
  else if (!('arp' in comp) && compChs.length < 3)
    short.push(
      `Chords on ${compChs.length} track${compChs.length > 1 ? 's' : ''}, not 3: the ${compChs.length > 1 ? 'top note is' : 'top two notes are'} left out. Keep fewer tracks for full chords.`,
    );
  const bassLine = pick(style.bass);
  const grooves = style.grooves.length ? [pick(style.grooves)] : [];
  const drums = (Object.keys(DRUM_CH) as Drum[]).filter((d) => !keptDrums.includes(DRUM_CH[d]));
  if (grooves.length && drums.length < 5)
    short.push(
      drums.length
        ? `No ${(Object.keys(DRUM_CH) as Drum[])
            .filter((d) => !drums.includes(d))
            .map((d) => DRUM_NAME[d])
            .join(' or ')} drum: that track is kept.`
        : 'No drums: all five drum tracks are kept.',
    );
  const sounds = style.sounds;
  if (bassCh !== undefined) setStartProgram(song, bassCh, instrumentFor(song, patchOf(pick(sounds.bass))));
  const compSound = pick(sounds.comp);
  for (const c of compChs) setStartProgram(song, c, instrumentFor(song, patchOf(compSound)));
  const drumSounds: Record<Drum, string> = { k: sounds.kick, s: sounds.snare, t: sounds.tom, c: sounds.cymbal, h: sounds.hat };
  if (grooves.length) for (const d of drums) setStartProgram(song, DRUM_CH[d], instrumentFor(song, patchOf(drumSounds[d])));

  /** A note on a channel that lets go just before `at + len`, so the next one retriggers. */
  const note = (ch: number, at: number, len: number, n: number, vel: number, legato = 0.9) => {
    const on = tick(at);
    const off = Math.max(on + 1, Math.min(tick(at + len) - 1, on + Math.round(len * beat * legato)));
    addNote(song, ch, n, on, off - on, vel);
  };
  const chordAt = (b: number) => chords.find((s) => b >= s.start - 1e-6 && b < s.start + s.len - 1e-6) ?? chords[chords.length - 1];
  const nextChord = (b: number) => chords.find((s) => s.start > b + 1e-6) ?? chords[0];

  // ---- bass ----
  for (let bar = 0; bar < bars && bassCh !== undefined; bar++) {
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
  for (let bar = 0; bar < bars && compChs.length; bar++) {
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
      voicing(span)
        .slice(0, compChs.length)
        .forEach((n, k) => note(compChs[k], b, end - b, clampTo(n, RANGES.comp), style.vel.comp, 0.85));
    }
  }

  // ---- drums ----
  for (let bar = 0; bar < bars && grooves.length; bar++) {
    const at = bar * style.beatsPerBar;
    const fill = style.fill && (bar === bars - 1 || bar % 4 === 3) && bars > 1;
    const g: Groove = { ...(fill ? style.fill : grooves[0]) };
    if (style.crash && bar === 0) g.c = 'X' + '.'.repeat((g.k ?? '........').length - 1);
    for (const d of (Object.keys(g) as Drum[]).filter((x) => drums.includes(x))) {
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
  const one = (ch: number) => `Track ${ch + 1}`;
  const keptPart = (from: number) => {
    const to = voiceOf.get(from) ?? from;
    return { ch: to, tracks: one(to), what: to === from ? 'kept as it was' : `kept as it was (moved from track ${from + 1}, which rhythm mode silences)` };
  };
  const parts = [
    { ch: melody, tracks: one(melody), what: 'the tune' },
    ...(bassCh === undefined ? [] : [{ ch: bassCh, tracks: one(bassCh), what: `bass (${presetName(song, bassCh)})` }]),
    ...compChs.map((ch) => ({ ch, tracks: one(ch), what: `${'arp' in comp ? 'arpeggio' : 'chords'} (${presetName(song, ch)})` })),
    ...kept.map(keptPart),
    ...(grooves.length && drums.length
      ? [
          {
            ch: DRUM_CH[drums[0]],
            tracks: drums.length === 5 ? 'Tracks 12–16' : `Track${drums.length > 1 ? 's' : ''} ${drums.map((d) => DRUM_CH[d] + 1).join(', ')}`,
            what: 'drums',
          },
        ]
      : []),
  ].sort((a, b) => a.ch - b.ch);
  return { song, key, chords, style, melody, parts, short };
}

/** Where the last note of the kept tracks lets go (they may run past the tune). */
function keptEnd(song: CmfSong, melody: number): number {
  return song.notes.reduce((a, n) => (n.on.ch === melody ? a : Math.max(a, noteEnd(song, n))), 0);
}

function presetName(song: CmfSong, ch: number): string {
  const p = startProgram(song, ch);
  const inst = song.instruments[p];
  return (inst && findPreset(inst)?.name) || `instrument ${p + 1}`;
}
