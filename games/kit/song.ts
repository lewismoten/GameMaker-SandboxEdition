// Songs for the Sound Blaster's OPL2 FM chip, written bar by bar as Creative Music Files in
// rhythm mode (six melodic voices plus the chip's five drums): the arrangement writer the Bard
// of Bizarre games share. A game keeps its song's sections (one chord and one bar of tune each,
// from the analysis of its recording, kit/song/analyze.py) and its songs; this keeps the
// patches, the drum grooves and the writer that lays a section out as tune, second voice,
// bass, three comping voices and drums.
import { encodeCmf, type CmfEvent } from '../../web/src/formats/cmf';
import { INSTRUMENTS, midi, sbi } from './music';

// ---- patches ------------------------------------------------------------------------------

/** A reedy, slightly bleating lead with vibrato (the singer). */
export const VOICE = sbi({ modChar: 0x62, carChar: 0x61, modLevel: 0x1d, carLevel: 0x00, modAD: 0x64, carAD: 0x75, modSR: 0x16, carSR: 0x17, feedback: 0x0c });
/** Oboe-ish double reed. */
export const REED = sbi({
  modChar: 0x31,
  carChar: 0x22,
  modLevel: 0x1e,
  carLevel: 0x00,
  modAD: 0x72,
  carAD: 0x73,
  modSR: 0x06,
  carSR: 0x07,
  modWave: 1,
  feedback: 0x0a,
});
/** Gospel drawbar organ for the comping. */
export const ORGAN = sbi({ modChar: 0x22, carChar: 0x21, modLevel: 0x4a, carLevel: 0x05, modAD: 0xf0, carAD: 0xf0, modSR: 0x0f, carSR: 0x0f, feedback: 0x01 });
/** A soft flute. */
export const FLUTE = sbi({ modChar: 0x61, carChar: 0x61, modLevel: 0x24, carLevel: 0x00, modAD: 0x54, carAD: 0x75, modSR: 0x06, carSR: 0x06, feedback: 0x0e });
/** A plucked "oud". */
export const OUD = sbi({
  modChar: 0x03,
  carChar: 0x01,
  modLevel: 0x16,
  carLevel: 0x00,
  modAD: 0xf6,
  carAD: 0xf4,
  modSR: 0x44,
  carSR: 0x45,
  modWave: 2,
  feedback: 0x0c,
});
/** Celesta / music box. */
export const CELESTA = sbi({
  modChar: 0x05,
  carChar: 0x01,
  modLevel: 0x1c,
  carLevel: 0x00,
  modAD: 0xf6,
  carAD: 0xf4,
  modSR: 0x34,
  carSR: 0x25,
  feedback: 0x06,
});
/** Electric piano for comping. */
export const EPIANO = sbi({ modChar: 0x01, carChar: 0x01, modLevel: 0x55, carLevel: 0x05, modAD: 0xf2, carAD: 0xd3, modSR: 0x63, carSR: 0x74, feedback: 0x08 });
/** A rounder fingered bass. */
export const BASS = sbi({ modChar: 0x01, carChar: 0x01, modLevel: 0x16, carLevel: 0x00, modAD: 0xf4, carAD: 0xf4, modSR: 0x26, carSR: 0x36, feedback: 0x0a });

// Rhythm mode drums, instruments 11-15. The bass drum is a whole two-operator voice (FM
// channel 6); the other four are one operator each, read from the SBI's modulator half.
const KICK = sbi({ modChar: 0x01, carChar: 0x01, modLevel: 0x0e, carLevel: 0x00, modAD: 0xf8, carAD: 0xf7, modSR: 0x77, carSR: 0x57, feedback: 0x08 });
const SNARE = sbi({ modChar: 0x02, carChar: 0x00, modLevel: 0x02, carLevel: 0x00, modAD: 0xf7, carAD: 0x00, modSR: 0x07, carSR: 0x00, feedback: 0x00 });
const TOM = sbi({ modChar: 0x02, carChar: 0x00, modLevel: 0x04, carLevel: 0x00, modAD: 0xf7, carAD: 0x00, modSR: 0x37, carSR: 0x00, feedback: 0x00 });
const CYMBAL = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x08, carLevel: 0x00, modAD: 0xf4, carAD: 0x00, modSR: 0x04, carSR: 0x00, feedback: 0x00 });
const HIHAT = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x06, carLevel: 0x00, modAD: 0xf9, carAD: 0x00, modSR: 0x09, carSR: 0x00, feedback: 0x00 });

// ---- sections -----------------------------------------------------------------------------

export interface Section {
  /** One chord per bar, or two ("D A": half a bar each). */
  chords: string[];
  /** One string of notes per bar (4 beats each), "G4 q, r e, ..." as in kit/music. */
  tune: string[];
}

/** Bars of one section, sliced (e.g. the chorus without its pickup). */
export const slice = (s: Section, from: number, to = s.tune.length): Section => ({ chords: s.chords.slice(from, to), tune: s.tune.slice(from, to) });
/** A section with its last bar's tune replaced (to change the pickup into the next part). */
export const ending = (s: Section, last: string): Section => ({ chords: s.chords, tune: [...s.tune.slice(0, -1), last] });
/** Bars of band alone, one per chord. */
export const vamp = (chords: string[], tune = 'r w'): Section => ({ chords, tune: chords.map(() => tune) });

const LEN: Record<string, number> = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };
const tokens = (s: string) =>
  s
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

/** Notes as [midi or null for a rest, beats]. */
function parse(s: string): [number | null, number][] {
  return tokens(s).map((t) => {
    const m = /^(\S+)\s+([whqes])(\.?)$/.exec(t);
    if (!m) throw new Error(`Bad note "${t}"`);
    return [midi(m[1]), LEN[m[2]] * (m[3] ? 1.5 : 1)];
  });
}

// ---- chords -------------------------------------------------------------------------------

const PITCH: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

/** A chord name ("A", "F#m", "E7", "Bm") as its root's pitch class and its intervals (a seventh replaces the fifth). */
function chordShape(name: string): { pc: number; iv: number[] } {
  const m = /^([A-G][#b]?)(m?)(7?)$/.exec(name);
  if (!m) throw new Error(`Unknown chord ${name}`);
  const third = m[2] ? 3 : 4;
  return { pc: PITCH[m[1]], iv: m[3] ? [0, third, 10] : [0, third, 7] };
}

/** How the band voices chords: three comping tones (MIDI, low to high) and the bass root. */
interface ChordBook {
  voicing: (chord: string) => number[];
  root: (chord: string) => number;
}

/** Chord tones folded into G3..F#4 (so three FM voices comp under the tune), the bass root in E2..D#3. */
const CLOSE_CHORDS: ChordBook = {
  voicing: (chord) => {
    const { pc, iv } = chordShape(chord);
    return iv.map((i) => 55 + ((pc + i - 55 + 120) % 12)).sort((a, b) => a - b);
  },
  root: (chord) => 40 + ((chordShape(chord).pc - 40 + 120) % 12),
};

/** A chord book from tables of note names and bass roots (a song's own hand-picked voicings). */
export function chordTable(voicing: Record<string, string[]>, root: Record<string, number>): ChordBook {
  return {
    voicing: (c) => {
      if (!voicing[c]) throw new Error(`No voicing for ${c}`);
      return voicing[c].map((n) => midi(n)!);
    },
    root: (c) => root[c],
  };
}

// ---- drums --------------------------------------------------------------------------------

type Drum = 'k' | 's' | 't' | 'c' | 'h';
const DRUM_CH: Record<Drum, number> = { k: 11, s: 12, t: 13, c: 14, h: 15 };
/** Drum pitch (sets the OPL channel's frequency): the snare and hi-hat share channel 7, the tom and cymbal channel 8. */
const DRUM_NOTE: Record<Drum, number> = { k: 36, s: 55, t: 48, c: 72, h: 55 };

/** One bar of drums: per drum an 8th-note (8 chars) or 16th-note (16 chars) grid; 'x' hits, 'X' accents, '.' rests. */
export type Groove = Partial<Record<Drum, string>>;

const GROOVES: Record<string, Groove> = {
  rock: { k: 'x...x.x.', s: '..X...X.', h: 'xxxxxxxx' },
  rock4: { k: 'x...x.x.', s: '..X...X.', h: 'x.x.x.x.' },
  rockFill: { k: 'x...x...', s: '..X..xXX', t: '......xx', h: 'xxxxx...' },
  crash: { k: 'x...x.x.', s: '..X...X.', c: 'X.......', h: '.xxxxxxx' },
  half: { k: 'x.......', s: '....X...', h: 'x.x.x.x.' },
  soft: { k: 'x.......', h: '..x...x.' },
  shuffle: { k: 'x..x..x.', s: '..X...X.', h: 'x.xxx.xx' },
  camel: { k: 'x.....x.', t: '..x.x..x', s: '....X...', h: 'x.x.x.x.' },
  ride: { k: 'x...x...', s: '....x...', c: 'x.x.x.x.' },
  gospel: { k: 'x..x..x.', s: '..X...X.', h: 'xxxxxxxx', t: '........' },
  // a clap-along gospel two-step (snare on 2 and 4 with a ghost before 4), sixteenth hats
  clap: { k: 'x.......x.x.....', s: '....X.......X...', h: 'x.x.x.x.x.x.x.x.' },
  clapFill: { k: 'x.......x.......', s: '....X.....x.XxXX', t: '..............xx', h: 'x.x.x.x.x.x.....' },
  // a hop: the kick bounces ahead of the beat
  hop: { k: 'x..x...xx..x....', s: '....X.......X...', h: 'x.xxx.x.x.xxx.x.' },
  march: { k: 'x...x...', s: '..x...x.', t: 'x.....xx', h: 'x.x.x.x.' },
  none: {},
};

// ---- the writer ---------------------------------------------------------------------------

export interface Part {
  section: Section;
  /** Melody patch on channel 0 (and the optional double on channel 1). */
  lead: Uint8Array;
  leadVel?: number;
  /** Transpose the whole part (semitones). */
  shift?: number;
  /** Play the tune this much higher than written (12 for the flute and celesta). */
  up?: number;
  /** Channel 1: 'double' the tune an octave under the lead, 'octave' an octave over it, or none. */
  second?: 'double' | 'octave' | 'none';
  secondPatch?: Uint8Array;
  secondVel?: number;
  bass: 'whole' | 'half' | 'pump' | 'walk' | 'eighths';
  bassPatch?: Uint8Array;
  bassVel?: number;
  /** Comping rhythm for one bar: 'x' chord, 'r' rest, each with a length, e.g. 'r e, x e, r e, x e, ...'. */
  comp: string;
  compPatch: Uint8Array;
  compVel?: number;
  /** A groove name per bar (the last one repeats). */
  drums: string[];
  drumVel?: number;
  /** Leave the tune out (bars of band only). */
  noTune?: boolean;
}

export class Writer {
  readonly tpb: number;
  readonly events: CmfEvent[] = [];
  readonly instruments: Uint8Array[] = [];
  bar = 0;
  private current: (Uint8Array | undefined)[] = [];

  constructor(
    bpm: number,
    private chords: ChordBook = CLOSE_CHORDS,
  ) {
    this.tpb = Math.round((146 * 60) / bpm);
    // Rhythm mode before any note: channels 0-5 melodic, 11-15 the drums.
    this.events.push({ tick: 0, data: [0xb0, 0x67, 0x01] });
    this.instruments[11] = KICK;
    this.instruments[12] = SNARE;
    this.instruments[13] = TOM;
    this.instruments[14] = CYMBAL;
    this.instruments[15] = HIHAT;
  }

  private tick(beats: number): number {
    return Math.round(beats * this.tpb);
  }

  /** A note from beat `at` lasting `len` beats; it lets go a little early so the next one retriggers. */
  note(ch: number, at: number, len: number, n: number, vel: number, legato = 0.9): void {
    const on = this.tick(at);
    const off = Math.max(on + 1, Math.min(this.tick(at + len) - 1, on + Math.round(len * this.tpb * legato)));
    this.events.push({ tick: on, data: [0x90 | ch, n, vel] });
    this.events.push({ tick: off, data: [0x80 | ch, n, 0] });
  }

  /** Plays a note string from beat `at`; returns its length in beats. */
  line(ch: number, at: number, s: string, vel: number, shift = 0, legato = 0.9): number {
    let t = at;
    for (const [n, len] of parse(s)) {
      if (n !== null) this.note(ch, t, len, n + shift, vel, legato);
      t += len;
    }
    return t - at;
  }

  drums(at: number, g: Groove, vel: number): void {
    for (const d of Object.keys(g) as Drum[]) {
      const grid = g[d]!;
      const step = 4 / grid.length;
      [...grid].forEach((c, i) => {
        if (c === '.') return;
        const v = Math.min(127, Math.round(vel * (c === 'X' ? 1.15 : d === 'h' && i % 2 ? 0.8 : 1)));
        this.note(DRUM_CH[d], at + i * step, Math.min(step, 0.5), DRUM_NOTE[d], v, 0.6);
      });
    }
  }

  /** The bass for `beats` beats from `at` under one chord. */
  private bassLine(p: Part, ch: string, at: number, beats: number): void {
    const root = this.chords.root(ch) + (p.shift ?? 0);
    const fifth = root + 7;
    const lines: Record<Part['bass'], [number, number][]> = {
      whole: [[root, 4]],
      half: [
        [root, 2],
        [fifth, 2],
      ],
      pump: [
        [root, 1],
        [fifth, 1],
        [root, 1],
        [fifth, 1],
      ],
      walk: [
        [root, 1],
        [root + (ch.endsWith('m') ? 3 : 4), 1],
        [fifth, 1],
        [root + 12, 1],
      ],
      eighths: [
        [root, 0.5],
        [root, 0.5],
        [root + 12, 0.5],
        [root, 0.5],
        [fifth, 0.5],
        [root, 0.5],
        [root + 12, 0.5],
        [fifth, 0.5],
      ],
    };
    let t = at;
    for (const [n, len] of lines[p.bass]) {
      if (t >= at + beats - 1e-6) break;
      this.note(2, t, Math.min(len, at + beats - t), n, p.bassVel ?? 105, 0.85);
      t += len;
    }
  }

  /** Writes a section's bars: tune, second voice, bass, three comping voices and drums. */
  part(p: Part): this {
    const sec = p.section;
    this.patches(p);
    sec.tune.forEach((bar, i) => {
      const at = (this.bar + i) * 4;
      const beats = parse(bar).reduce((a, [, l]) => a + l, 0);
      if (Math.abs(beats - 4) > 1e-6) throw new Error(`Bar ${i + 1} of a section has ${beats} beats: ${bar}`);
      const shift = p.shift ?? 0;
      if (!p.noTune) {
        const up = p.up ?? 0;
        this.line(0, at, bar, p.leadVel ?? 112, shift + up);
        if (p.second === 'double') this.line(1, at, bar, p.secondVel ?? 70, shift + up - 12);
        if (p.second === 'octave') this.line(1, at, bar, p.secondVel ?? 60, shift + up + 12);
      }
      const names = sec.chords[i].split(' ');
      const span = 4 / names.length;
      const chordAt = (beat: number) => names[Math.min(names.length - 1, Math.floor((beat - at) / span + 1e-6))];
      names.forEach((ch, k) => this.bassLine(p, ch, at + k * span, span));
      let t = at;
      for (const tok of tokens(p.comp)) {
        const m = /^([xr])\s+([whqes])(\.?)$/.exec(tok);
        if (!m) throw new Error(`Bad comp "${tok}"`);
        const len = LEN[m[2]] * (m[3] ? 1.5 : 1);
        if (m[1] === 'x' && names.length === 1) this.chords.voicing(names[0]).forEach((n, k) => this.note(3 + k, t, len, n + shift, p.compVel ?? 70, 0.85));
        else if (m[1] === 'x') {
          const ch = chordAt(t);
          // a long chord stops where the next chord of the bar starts
          const end = Math.min(t + len, at + (names.indexOf(ch) + 1) * span);
          this.chords.voicing(ch).forEach((n, k) => this.note(3 + k, t, end - t, n + shift, p.compVel ?? 70, 0.85));
          if (end < t + len) {
            const next = chordAt(end);
            this.chords.voicing(next).forEach((n, k) => this.note(3 + k, end, t + len - end, n + shift, p.compVel ?? 70, 0.85));
          }
        }
        t += len;
      }
      const groove = GROOVES[p.drums[Math.min(i, p.drums.length - 1)]];
      if (!groove) throw new Error(`No groove ${p.drums[Math.min(i, p.drums.length - 1)]}`);
      this.drums(at, groove, p.drumVel ?? 100);
    });
    this.bar += sec.tune.length;
    return this;
  }

  /** Puts each melodic channel's patch in place for a part: the first part's are the file's instruments 0-5; later changes add an instrument and a program change. */
  private patches(p: Part): void {
    const want: [number, Uint8Array][] = [
      [0, p.lead],
      [1, p.secondPatch ?? p.lead],
      [2, p.bassPatch ?? BASS],
      [3, p.compPatch],
      [4, p.compPatch],
      [5, p.compPatch],
    ];
    for (const [c, inst] of want) {
      if (this.current[c] === inst) continue;
      if (this.current[c] === undefined) this.instruments[c] = inst;
      else {
        let k = this.instruments.indexOf(inst, 16);
        if (k < 0) {
          k = Math.max(16, this.instruments.length);
          this.instruments[k] = inst;
        }
        this.events.push({ tick: this.tick(this.bar * 4), data: [0xc0 | c, k] });
      }
      this.current[c] = inst;
    }
  }

  /** The .CMF: ends exactly on the bar line, so PLAYGAME's restart keeps time. */
  cmf(): Uint8Array {
    const end = this.tick(this.bar * 4);
    // Back to the opening patches, as PLAYGAME's restart doesn't reload them.
    for (let c = 0; c < 6; c++) if (this.current[c] !== this.instruments[c]) this.events.push({ tick: end, data: [0xc0 | c, c] });
    this.events.push({ tick: end, data: [0xb0, 0x67, 0x01] });
    for (let c = 0; c < 16; c++) this.instruments[c] ??= INSTRUMENTS.piano;
    return encodeCmf({ instruments: this.instruments, events: this.events, ticksPerBeat: this.tpb });
  }
}
