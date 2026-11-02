// A small score writer for Tune-Up's own songs: parts written bar by bar in a short notation,
// chords by name, comping and bass from patterns, and the chip's drum kit from grids, in any
// meter, as a CMF in rhythm mode (six melodic voices, channels 0-5, and the five drums).
//
// Notes: "C5q E5e. F#5s rq C4+E4+G4h" (a chord joins notes with +), bars split by "|". Lengths
// are w h q e s (whole to sixteenth), t (a triplet eighth, a third of a beat) and u (two
// triplet eighths), each optionally dotted. A beat lasts `beat` game ticks (8 CMF ticks each),
// so the song and the blocks that animate on its beat never drift.
import { encodeCmf, type CmfEvent } from '@lewismoten/gamemaker-sandbox-engine/formats/cmf';
import { midi } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { presetById } from '../../../../web/src/audio/oplPresets';

const LEN: Record<string, number> = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25, t: 1 / 3, u: 2 / 3 };
const TOKEN = /^(r|[A-G][#b]?-?\d(?:\+[A-G][#b]?-?\d)*)([whqesut])(\.?)$/;

/** A bar's notes as [MIDI notes (none for a rest), beats]. */
function parseBar(s: string): [number[], number][] {
  return s
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => {
      const m = TOKEN.exec(t);
      if (!m) throw new Error(`Bad note "${t}"`);
      const notes = m[1] === 'r' ? [] : m[1].split('+').map((n) => midi(n)!);
      return [notes, LEN[m[2]] * (m[3] ? 1.5 : 1)];
    });
}

/** Bars of notes joined into one part. */
export const bars = (...parts: string[]) => parts.filter(Boolean).join(' | ');
/** `s` (bars) `n` times over. */
export const rep = (n: number, s: string) => bars(...new Array<string>(n).fill(s));

const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const nameOf = (n: number) => `${NAMES[n % 12]}${Math.floor(n / 12) - 1}`;

/** Every note of `s` moved `semis` semitones. */
export const shift = (s: string, semis: number) => s.replace(/([A-G][#b]?-?\d)(?=[+whqesut])/g, (n) => nameOf(midi(n)! + semis));

// ---- chords --------------------------------------------------------------------------------

const PC: Record<string, number> = {
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
const QUALITY: Record<string, number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  m7b5: [0, 3, 6, 10],
  dim: [0, 3, 6, 9],
  aug: [0, 4, 8],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  '6': [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  '9': [0, 4, 10, 14],
  add9: [0, 4, 7, 14],
};

/** A chord name ("F#m7", "Bb", "Cmaj7", "G7") as its root's pitch class and its intervals. */
function chord(sym: string): { pc: number; iv: number[] } {
  const m = /^([A-G][#b]?)(.*)$/.exec(sym);
  if (!m || !(m[2] in QUALITY)) throw new Error(`Unknown chord ${sym}`);
  return { pc: PC[m[1]], iv: QUALITY[m[2]] };
}

/** `pc` folded into the octave from `lo` up. */
const fold = (pc: number, lo: number) => lo + ((pc - lo + 120) % 12);

/** Three comping tones of `sym` in the octave from `lo` up (a four-note chord drops its fifth). */
export function voicing(sym: string, lo = 'G3'): number[] {
  const { pc, iv } = chord(sym);
  const tones = iv.length > 3 ? [iv[0], iv[1], iv[3]] : iv;
  return tones.map((i) => fold(pc + i, midi(lo)!)).sort((a, b) => a - b);
}

/** Chord tone `deg` of `sym` (0 the root, 1 the third, 2 the fifth, 3 the seventh) from `lo` up. */
export function toneOf(sym: string, deg: number, lo = 'E2'): number {
  const { pc, iv } = chord(sym);
  return fold(pc + (iv[deg] ?? iv[0]), midi(lo)!);
}

/**
 * An accompaniment over `chords` (one entry a bar; "C G" splits a bar evenly): each bar plays
 * `pattern`, whose notes are X (the chord), R (the root), 3, 5, 7 (chord tones), 8 (the root an
 * octave up), - (the fifth below the root) or r (a rest), each with a length ("Rq Xq 5q Xq").
 * A pattern for several bars ("... | ...") takes the bars in turn.
 */
export function comp(chords: string[], meter: number, pattern: string, o: { lo?: string; bass?: string } = {}): string {
  const pats = pattern.split('|').map((p) => p.trim());
  return bars(
    ...chords.map((entry, b) => {
      const names = entry.split(' ');
      const span = meter / names.length;
      let t = 0;
      return pats[b % pats.length]
        .split(/\s+/)
        .map((tok) => {
          const [sym, len] = tok.split(/(?=[whqesut]\.?$)/);
          const at = t;
          t += LEN[len[0]] * (len.endsWith('.') ? 1.5 : 1);
          if (sym === 'r') return tok;
          const c = names[Math.min(names.length - 1, Math.floor(at / span + 1e-6))];
          const lo = o.bass ?? 'E2';
          const notes =
            sym === 'X'
              ? voicing(c, o.lo)
              : [
                  {
                    R: toneOf(c, 0, lo),
                    '3': toneOf(c, 1, lo),
                    '5': toneOf(c, 2, lo),
                    '7': toneOf(c, 3, lo),
                    '8': toneOf(c, 0, lo) + 12,
                    '-': toneOf(c, 2, lo) - 12,
                  }[sym]!,
                ];
          return `${notes.map(nameOf).join('+')}${len}`;
        })
        .join(' ');
    }),
  );
}

// ---- writing ---------------------------------------------------------------------------------

/** A melodic part on channel 0-5: a preset of the music editor, its notes, loudness and shift. */
export interface Part {
  ch: number;
  patch: string;
  notes: string;
  vel?: number;
  shift?: number;
  /** How much of each note sounds before it lets go (0.9). */
  legato?: number;
}
/** A drum of the kit (a preset of its Drum kit group), hit on a grid: "x...x...|x.x.x..." per bar; X accents. */
export interface Drum {
  patch: string;
  grid: string;
  vel?: number;
}

/** A drum grid `n` bars over. */
export const grid = (n: number, bar: string) => new Array<string>(n).fill(bar).join('|');

/** The CMF: `beat` game ticks a beat, `meter` beats a bar; every part and drum the same number of bars. */
export function score(beat: number, meter: number, parts: Part[], drums: Drum[] = []): Uint8Array {
  const tpb = 8 * beat;
  const instruments: Uint8Array[] = [];
  const events: CmfEvent[] = [{ tick: 0, data: [0xb0, 0x67, 0x01] }];
  const at = (beats: number) => Math.round(beats * tpb);
  let total = -1;
  const length = (n: number, what: string) => {
    if (total < 0) total = n;
    else if (Math.abs(total - n) > 1e-6) throw new Error(`${what} lasts ${n} beats, not ${total}`);
  };
  for (const p of parts) {
    if (p.ch > 5) throw new Error('rhythm mode has melodic channels 0-5 only');
    const patch = presetById(p.patch);
    if (!patch) throw new Error(`No preset ${p.patch}`);
    let t = 0;
    p.notes.split('|').forEach((bar, b) => {
      const notes = parseBar(bar);
      const beats = notes.reduce((a, [, l]) => a + l, 0);
      if (Math.abs(beats - meter) > 1e-6) throw new Error(`${p.patch} bar ${b + 1} has ${beats} beats: ${bar}`);
      for (const [ns, len] of notes) {
        ns.forEach((n, k) => {
          const ch = p.ch + k;
          if (ch > 5) throw new Error(`${p.patch}: a chord runs past channel 5`);
          instruments[ch] = patch.patch;
          const on = at(t);
          const off = Math.max(on + 1, Math.min(at(t + len) - 1, on + Math.round(len * tpb * (p.legato ?? 0.9))));
          const note = n + (p.shift ?? 0);
          events.push({ tick: on, data: [0x90 | ch, note, p.vel ?? 100] });
          events.push({ tick: off, data: [0x80 | ch, note, 0] });
        });
        t += len;
      }
    });
    length(t, p.patch);
  }
  for (const d of drums) {
    const preset = presetById(d.patch);
    if (!preset?.drum) throw new Error(`No drum ${d.patch}`);
    const ch = { bd: 11, sd: 12, tom: 13, cy: 14, hh: 15 }[preset.drum];
    instruments[ch] = preset.patch;
    let t = 0;
    for (const bar of d.grid.split('|')) {
      const cells = bar.replace(/\s/g, '');
      const step = meter / cells.length;
      [...cells].forEach((c, i) => {
        if (c === '.') return;
        const on = at(t + i * step);
        const vel = Math.min(127, Math.round((d.vel ?? 90) * (c === 'X' ? 1.2 : c === 'o' ? 0.6 : 1)));
        events.push({ tick: on, data: [0x90 | ch, preset.key, vel] });
        events.push({ tick: on + Math.max(1, Math.round(step * tpb * 0.5)), data: [0x80 | ch, preset.key, 0] });
      });
      t += meter;
    }
    length(t, d.patch);
  }
  // the loop's end, marked by setting channel 1's volume to where it already is (blankSong's way)
  events.push({ tick: at(total), data: [0xb0, 7, 100] });
  const piano = presetById('piano')!.patch;
  for (let c = 0; c < 16; c++) instruments[c] ??= piano;
  return encodeCmf({ instruments, events, ticksPerBeat: tpb });
}
