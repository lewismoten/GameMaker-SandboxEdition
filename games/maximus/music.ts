// The soundtrack: Sound Blaster FM songs as .CMF files. A tiny arranger turns a chord
// chart and a melody into a band: lead and harmony, a bass line, arpeggios, a pad, and
// OPL2 rhythm-mode drums (bass drum, snare, tom, cymbal, hi-hat on channels 11..15).
import { encodeCmf, type CmfEvent } from '../../web/src/formats/cmf';
import { INSTRUMENTS, midi, sbi } from '../kit/music';

const I = {
  ...INSTRUMENTS,
  synthBass: sbi({
    modChar: 0x21,
    carChar: 0x21,
    modLevel: 0x15,
    carLevel: 0x00,
    modAD: 0xf4,
    carAD: 0xf5,
    modSR: 0x24,
    carSR: 0x34,
    modWave: 1,
    feedback: 0x0c,
  }),
  softLead: sbi({ modChar: 0x22, carChar: 0x21, modLevel: 0x24, carLevel: 0x00, modAD: 0x83, carAD: 0x73, modSR: 0x15, carSR: 0x15, feedback: 0x08 }),
  glass: sbi({ modChar: 0x05, carChar: 0x01, modLevel: 0x1c, carLevel: 0x00, modAD: 0xf6, carAD: 0xf4, modSR: 0x13, carSR: 0x23, modWave: 1, feedback: 0x06 }),
  choir: sbi({ modChar: 0xe2, carChar: 0x61, modLevel: 0x24, carLevel: 0x00, modAD: 0x53, carAD: 0x63, modSR: 0x04, carSR: 0x05, modWave: 0, feedback: 0x0e }),
  flute: sbi({ modChar: 0x61, carChar: 0x61, modLevel: 0x30, carLevel: 0x00, modAD: 0x72, carAD: 0x73, modSR: 0x06, carSR: 0x06, feedback: 0x0e }),
  // rhythm section (single-operator drums read the modulator half)
  kick: sbi({ modChar: 0x00, carChar: 0x00, modLevel: 0x0b, carLevel: 0x00, modAD: 0xa8, carAD: 0xd6, modSR: 0x4c, carSR: 0x4f, feedback: 0x00 }),
  snare: sbi({ modChar: 0x0c, carChar: 0x00, modLevel: 0x00, carLevel: 0x00, modAD: 0xf8, carAD: 0x00, modSR: 0xb5, carSR: 0x00, feedback: 0x00 }),
  tom: sbi({ modChar: 0x04, carChar: 0x00, modLevel: 0x00, carLevel: 0x00, modAD: 0xf7, carAD: 0x00, modSR: 0xb5, carSR: 0x00, feedback: 0x00 }),
  cymbal: sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x02, carLevel: 0x00, modAD: 0xf5, carAD: 0x00, modSR: 0x16, carSR: 0x00, feedback: 0x00 }),
  hat: sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x00, carLevel: 0x00, modAD: 0xf9, carAD: 0x00, modSR: 0xa8, carSR: 0x00, feedback: 0x00 }),
};
type Inst = keyof typeof I;

const CH = { lead: 0, harm: 1, bass: 2, arp: 3, padA: 4, padB: 5, kick: 11, snare: 12, tom: 13, cymbal: 14, hat: 15 } as const;

const ROOT: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** "Am7", "F#", "Bb", "Dsus4" → semitones from C of root and intervals. */
function chord(name: string): { root: number; tones: number[] } {
  const m = /^([A-G])([#b]?)(.*)$/.exec(name);
  if (!m) throw new Error(`chord ${name}`);
  const root = ROOT[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const q = m[3];
  const minor = /^m(?!aj)/.test(q);
  let tones = minor ? [0, 3, 7] : [0, 4, 7];
  if (q.includes('sus4')) tones = [0, 5, 7];
  if (q.includes('sus2')) tones = [0, 2, 7];
  if (q.includes('dim')) tones = [0, 3, 6];
  if (q.includes('maj7')) tones.push(11);
  else if (q.includes('7')) tones.push(10);
  if (q.includes('add9')) tones.push(14);
  return { root, tones };
}

export type Style =
  'heroic' | 'calm' | 'drive' | 'flow' | 'glass' | 'dark' | 'march' | 'storm' | 'tense' | 'folk' | 'aqua' | 'machine' | 'race' | 'boss' | 'triumph' | 'lament';

export interface SongSpec {
  name: string;
  bpm: number;
  /** Chords, one per bar (4 beats), "|" separated; ":" splits a bar into two halves. */
  chart: string;
  /** Melody in kit note syntax (C5 q, ...), may be shorter than the chart (it repeats). */
  melody: string;
  harmony?: string;
  style: Style;
  lead?: Inst;
  pad?: Inst;
  arp?: Inst;
  bass?: Inst;
  /** Base octave for the bass (MIDI note of C). */
  bassC?: number;
  /** Repeat the chart this many times (melody too). */
  repeat?: number;
}

const LEN: Record<string, number> = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25, t: 1 / 3 };

function parseLine(notes: string): { at: number; len: number; notes: number[] }[] {
  const out: { at: number; len: number; notes: number[] }[] = [];
  let t = 0;
  for (const raw of notes
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)) {
    const m = /^(.+?)\s+([whqest])(\.?)$/.exec(raw);
    if (!m) throw new Error(`Bad note "${raw}"`);
    const len = LEN[m[2]] * (m[3] ? 1.5 : 1);
    const names = m[1].replace(/[[\]]/g, ' ').trim().split(/\s+/);
    const ns = names.map((n) => midi(n)).filter((n): n is number => n !== null);
    out.push({ at: t, len, notes: ns });
    t += len;
  }
  return out;
}

export function arrange(spec: SongSpec): Uint8Array {
  const tpb = Math.round((146 * 60) / spec.bpm);
  const events: CmfEvent[] = [];
  const on = (ch: number, note: number, beat: number, len: number, vel = 100) => {
    if (note < 12 || note > 115) return;
    events.push({ tick: beat * tpb, data: [0x90 | ch, note, vel] });
    events.push({ tick: (beat + len * 0.9) * tpb, data: [0x80 | ch, note, 0] });
  };
  const bars = spec.chart
    .split('|')
    .map((b) => b.trim())
    .filter(Boolean);
  const reps = spec.repeat ?? 2;
  const total = bars.length * 4 * reps;
  // rhythm mode on
  events.push({ tick: 0, data: [0xb0, 0x67, 1] });
  // lead and harmony repeat over the whole song
  for (const [line, ch] of [
    [spec.melody, CH.lead],
    [spec.harmony, CH.harm],
  ] as const) {
    if (!line) continue;
    const parsed = parseLine(line);
    const len = parsed.reduce((n, p) => Math.max(n, p.at + p.len), 0);
    for (let base = 0; base < total; base += len)
      for (const p of parsed)
        if (base + p.at < total) for (const n of p.notes) on(ch, n, base + p.at, Math.min(p.len, total - base - p.at), ch === CH.lead ? 110 : 85);
  }
  const s = spec.style;
  const bassC = spec.bassC ?? 36;
  for (let rep = 0; rep < reps; rep++)
    bars.forEach((bar, bi) => {
      const halves = bar.split(':').map((c) => c.trim());
      const beat0 = (rep * bars.length + bi) * 4;
      halves.forEach((name, hi) => {
        const c = chord(name);
        const at = beat0 + hi * (4 / halves.length);
        const span = 4 / halves.length;
        const root = bassC + c.root;
        const fifth = root + 7;
        // bass
        if (s === 'drive' || s === 'race' || s === 'storm' || s === 'boss' || s === 'machine')
          for (let k = 0; k < span * 2; k++) on(CH.bass, k % 4 === 3 ? fifth : root, at + k * 0.5, 0.5, 105);
        else if (s === 'march' || s === 'heroic' || s === 'triumph') for (let k = 0; k < span; k++) on(CH.bass, k % 2 ? fifth : root, at + k, 1, 105);
        else if (s === 'flow' || s === 'aqua') [0, 1.5, 3].filter((b) => b < span).forEach((b, k) => on(CH.bass, k === 1 ? fifth : root, at + b, 1.5, 95));
        else if (s === 'folk') [0, 2].filter((b) => b < span).forEach((b, k) => on(CH.bass, k ? fifth - 12 : root, at + b, 2, 95));
        else on(CH.bass, root, at, span, 90);
        // pad: two voices of the chord, held
        const padC = 60 + c.root - (c.root > 5 ? 12 : 0);
        on(CH.padA, padC + c.tones[1], at, span, 70);
        on(CH.padB, padC + c.tones[2], at, span, 70);
        // arpeggio
        const arpNotes = [...c.tones, 12].map((t) => padC + 12 + t);
        const step = s === 'calm' || s === 'lament' || s === 'dark' ? 1 : s === 'glass' || s === 'aqua' || s === 'race' || s === 'machine' ? 0.25 : 0.5;
        if (s !== 'march' && s !== 'boss')
          for (let k = 0; k * step < span; k++) {
            const idx = s === 'glass' ? [0, 2, 1, 3, 2, 1][k % 6] : s === 'machine' ? [0, 0, 2, 0][k % 4] : k % arpNotes.length;
            on(CH.arp, arpNotes[idx % arpNotes.length], at + k * step, step, 75);
          }
      });
      // drums
      const quiet = s === 'calm' || s === 'lament' || s === 'glass' || s === 'dark';
      for (let b = 0; b < 4; b++) {
        const t = beat0 + b;
        if (s === 'calm' || s === 'lament') {
          if (b === 0) on(CH.cymbal, 72, t, 1, 50);
          continue;
        }
        if (s === 'dark') {
          if (b === 0 || b === 2.5) on(CH.tom, 43, t, 1, 90);
          if (b === 3) on(CH.hat, 60, t + 0.5, 0.5, 60);
          continue;
        }
        if (s === 'glass') {
          on(CH.hat, 60, t + 0.5, 0.25, 60);
          if (b === 0) on(CH.kick, 36, t, 1, 90);
          continue;
        }
        const kick = s === 'boss' || s === 'storm' || s === 'race' ? true : b === 0 || b === 2 || (s === 'drive' && b === 3);
        if (kick) on(CH.kick, 36, t, 0.5, 120);
        if (b === 1 || b === 3) on(CH.snare, 60, t, 0.5, 110);
        on(CH.hat, 60, t, 0.25, 80);
        if (!quiet) on(CH.hat, 60, t + 0.5, 0.25, 70);
        if (s === 'march' && b === 3) on(CH.snare, 60, t + 0.5, 0.25, 90);
        if ((s === 'heroic' || s === 'triumph' || s === 'boss') && bi % 4 === 3 && b >= 2) on(CH.tom, b === 2 ? 48 : 43, t + 0.5, 0.5, 100);
      }
      if (bi % 4 === 0 && !quiet) on(CH.cymbal, 72, beat0, 2, 90);
    });
  const instruments: Uint8Array[] = new Array(16);
  instruments[CH.lead] = I[spec.lead ?? 'lead'];
  instruments[CH.harm] = I[spec.lead === 'brass' ? 'strings' : 'softLead'];
  instruments[CH.bass] = I[spec.bass ?? (spec.style === 'drive' || spec.style === 'race' || spec.style === 'machine' ? 'synthBass' : 'bass')];
  instruments[CH.arp] = I[spec.arp ?? (spec.style === 'glass' ? 'glass' : spec.style === 'folk' ? 'pluck' : 'bell')];
  instruments[CH.padA] = I[spec.pad ?? 'pad'];
  instruments[CH.padB] = I[spec.pad ?? 'pad'];
  instruments[6] = I.piano;
  instruments[7] = I.piano;
  instruments[8] = I.piano;
  instruments[9] = I.piano;
  instruments[10] = I.piano;
  instruments[CH.kick] = I.kick;
  instruments[CH.snare] = I.snare;
  instruments[CH.tom] = I.tom;
  instruments[CH.cymbal] = I.cymbal;
  instruments[CH.hat] = I.hat;
  return encodeCmf({ instruments, events, ticksPerBeat: tpb });
}

/** The fourteen songs of the Hundred Worlds. */
export const SONGS: SongSpec[] = [
  {
    name: 'title',
    bpm: 128,
    style: 'heroic',
    lead: 'brass',
    chart: 'Dm | Bb | C | A | Dm | Bb | Gm | A',
    melody:
      'D5 q., A4 e, D5 q, E5 q, F5 h, E5 q, D5 q, E5 q., C5 e, E5 q, G5 q, A5 w, A5 q., F5 e, D5 q, F5 q, Bb5 h, A5 q, G5 q, G5 q, F5 e, E5 e, D5 q, E5 q, C#5 w',
    harmony: 'A4 h, F4 h, F4 h, G4 h, G4 h, E4 h, E4 w, F4 h, A4 h, D4 h, F4 h, Bb4 h, D5 h, E4 w',
  },
  {
    name: 'story',
    bpm: 84,
    style: 'calm',
    lead: 'flute',
    pad: 'strings',
    chart: 'Fmaj7 | Em7 | Dm7 | Cadd9 | Fmaj7 | Em7 | Dm7 | G',
    melody: 'A5 h, G5 q, E5 q, G5 h., r q, F5 h, E5 q, D5 q, E5 w, A5 h, C6 q, B5 q, G5 h., E5 q, F5 q, E5 q, D5 q, B4 q, D5 w',
  },
  {
    name: 'galaxy',
    bpm: 96,
    style: 'glass',
    lead: 'softLead',
    pad: 'choir',
    chart: 'Em | Cmaj7 | G | D | Em | Cmaj7 | Am7 | B7',
    melody: 'B4 h, E5 h, G5 h., F#5 q, E5 h, D5 h, A4 w, B4 h, E5 h, G5 q, A5 q, B5 h, A5 h, G5 q, F#5 q, D#5 w',
  },
  {
    name: 'cradle',
    bpm: 112,
    style: 'folk',
    lead: 'flute',
    chart: 'G | C | G | D | Em | C | G:D | G',
    melody: 'D5 q, G5 q, B5 q, A5 q, G5 h, E5 q, G5 q, D5 h., B4 q, A4 h, D5 h, E5 q, D5 q, B4 q, G4 q, C5 h, E5 h, D5 q, B4 q, A4 q, B4 q, G4 w',
  },
  {
    name: 'ember',
    bpm: 140,
    style: 'drive',
    lead: 'lead',
    chart: 'Am | Am | F | G | Am | Am | F | E',
    melody:
      'A4 e, A4 e, C5 e, A4 e, E5 q, D5 e, C5 e, B4 e, B4 e, C5 e, D5 e, E5 h, F5 e, E5 e, D5 e, C5 e, D5 q, B4 q, G4 e, A4 e, B4 e, D5 e, C5 q, B4 q, A4 e, A4 e, C5 e, A4 e, E5 q, A5 q, G5 e, F5 e, E5 e, D5 e, C5 q, D5 q, E5 h., r q, G#4 q, B4 q, E5 h',
  },
  {
    name: 'shallows',
    bpm: 100,
    style: 'aqua',
    lead: 'softLead',
    pad: 'choir',
    chart: 'Dmaj7 | Bm7 | Gmaj7 | A | Dmaj7 | Bm7 | Em7 | A7',
    melody: 'F#5 q., E5 e, D5 q, A4 q, B4 h, D5 h, E5 q., D5 e, B4 q, G4 q, A4 w, F#5 q., G5 e, A5 q, F#5 q, D5 h, B4 h, G5 q, F#5 q, E5 q, D5 q, E5 w',
  },
  {
    name: 'glass',
    bpm: 108,
    style: 'glass',
    lead: 'glass',
    chart: 'C#m | A | E | B | C#m | A | F#m | G#',
    melody: 'G#5 q, E5 q, C#5 q, E5 q, A5 h, G#5 h, E5 q, B4 q, E5 q, G#5 q, F#5 w, G#5 q, B5 q, C#6 q, B5 q, A5 h, E5 h, F#5 q, A5 q, G#5 q, F#5 q, D#5 w',
  },
  {
    name: 'black',
    bpm: 76,
    style: 'dark',
    lead: 'choir',
    pad: 'strings',
    chart: 'Cm | Ab | Fm | G | Cm | Ab | Db | G',
    melody: 'G4 h., Ab4 q, G4 h, Eb4 h, F4 h., G4 q, D4 w, G4 h, C5 h, Bb4 q, Ab4 q, G4 h, F4 h, Ab4 h, B3 w',
  },
  {
    name: 'ocean',
    bpm: 92,
    style: 'aqua',
    lead: 'flute',
    pad: 'choir',
    chart: 'Am7 | Fmaj7 | Cmaj7 | G | Am7 | Fmaj7 | Dm7 | E7',
    melody: 'E5 h, A5 h, G5 q, E5 q, C5 h, D5 q, E5 q, G5 q, A5 q, B5 w, C6 h, B5 q, A5 q, G5 h, E5 h, F5 q, E5 q, D5 q, C5 q, B4 w',
  },
  {
    name: 'station',
    bpm: 118,
    style: 'machine',
    lead: 'organ',
    chart: 'Em | Em | C | D | Em | Em | Am | B',
    melody:
      'E5 e, r e, E5 e, G5 e, r e, E5 e, D5 q, B4 e, r e, B4 e, D5 e, E5 h, C5 e, r e, C5 e, E5 e, G5 q, F#5 q, D5 e, E5 e, F#5 e, A5 e, F#5 q, D5 q, E5 e, r e, E5 e, G5 e, B5 q, A5 q, G5 e, F#5 e, E5 e, D5 e, E5 h, C5 q, E5 q, A5 h, B4 q, D#5 q, F#5 h',
  },
  {
    name: 'rover',
    bpm: 152,
    style: 'race',
    lead: 'lead',
    chart: 'E | D | A | E | E | D | A | B',
    melody: 'B4 e, E5 e, G#5 e, B5 e, A5 q, G#5 q, F#5 e, E5 e, D5 e, F#5 e, A5 h, C#5 e, E5 e, A5 e, C#6 e, B5 q, A5 q, G#5 e, F#5 e, E5 e, F#5 e, G#5 h',
  },
  {
    name: 'storm',
    bpm: 160,
    style: 'storm',
    lead: 'lead',
    chart: 'Bm | G | Em | F# | Bm | G | C | F#',
    melody: 'B4 e, D5 e, F#5 e, B5 e, A5 e, F#5 e, D5 q, G5 e, F#5 e, E5 e, D5 e, B4 h, E5 e, G5 e, B5 e, E5 e, F#5 q, A#4 q, B4 e, C#5 e, D5 e, E5 e, F#5 h',
  },
  {
    name: 'boss',
    bpm: 150,
    style: 'boss',
    lead: 'brass',
    chart: 'Dm | Dm:C | Bb | A | Dm | Dm:C | Bb:C | A7',
    melody:
      'D5 q, D5 e, E5 e, F5 q, D5 q, A5 q., G5 e, F5 q, E5 q, F5 q, D5 q, Bb4 q, D5 q, C#5 h, A4 h, D5 q, F5 e, A5 e, D6 q, C6 q, Bb5 q, A5 q, G5 q, F5 q, E5 q, F5 e, G5 e, A5 q, C#5 q, E5 h, A5 h',
  },
  {
    name: 'triumph',
    bpm: 120,
    style: 'triumph',
    lead: 'brass',
    chart: 'C | G/B | Am | F | C | F | G | C',
    melody: 'G4 q, C5 q, E5 q, G5 q, G5 h, F5 q, D5 q, E5 h, C5 q, A4 q, F5 h, A5 h, G5 q., E5 e, C5 q, E5 q, F5 h, A5 q, F5 q, D5 q, E5 q, F5 q, D5 q, C5 w',
  },
  {
    name: 'lament',
    bpm: 70,
    style: 'lament',
    lead: 'flute',
    pad: 'strings',
    chart: 'Am | F | Dm | E | Am | F | Dm:E | Am',
    melody: 'E5 h, A4 h, C5 h., B4 q, A4 h, F4 h, G#4 w, E5 h, F5 q, E5 q, D5 h, C5 h, B4 q, C5 q, D5 q, B4 q, A4 w',
  },
];

export function buildSongs(): Map<string, Uint8Array> {
  const out = new Map<string, Uint8Array>();
  for (const s of SONGS) out.set(`${s.name}.cmf`, arrange({ ...s, chart: s.chart.replace(/\/[A-G]#?b?/g, '') }));
  return out;
}

export { CH };
