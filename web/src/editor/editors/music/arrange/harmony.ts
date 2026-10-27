// Hearing the harmony in a tune: its key (inferKey) and a chord for each bar or half bar
// (inferChords), for the accompaniment generator. No DOM.
//
// The key is found the Krumhansl-Schmuckler way: how long each pitch class sounds is
// correlated with the major and minor key profiles Carol Krumhansl and Edward Kessler
// measured (Psychological Review 89, 1982); the best of the 24 keys wins. The chords are the
// key's own triads, scored on how well each fits the notes of a stretch (strong beats count
// more), and chosen as a whole with a Viterbi pass so the progression prefers the moves songs
// make (V to I, IV to V) and starts and ends at home. The profile numbers are published data;
// the code is this project's.

/** A note of the tune, in beats from the song's start. */
export interface MelNote {
  start: number;
  len: number;
  key: number;
}

export interface Key {
  /** Pitch class of the home note (0 = C). */
  tonic: number;
  minor: boolean;
  name: string;
}

interface Chord {
  /** Pitch class of the root. */
  root: number;
  quality: 'maj' | 'min' | 'dim';
  /** "C", "Am", "Bdim". */
  name: string;
  /** Roman numeral in the key ("I", "vi", "V"). */
  degree: string;
}

/** One stretch of the song and its chord. */
export interface ChordSpan {
  start: number;
  len: number;
  chord: Chord;
}

const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

export const pitchName = (pc: number): string => NAMES[((pc % 12) + 12) % 12];

/** How long each pitch class sounds. */
function pitchWeights(notes: MelNote[]): number[] {
  const w = new Array(12).fill(0);
  for (const n of notes) w[((n.key % 12) + 12) % 12] += Math.max(0, n.len);
  return w;
}

function correlate(a: number[], b: number[]): number {
  const ma = a.reduce((s, x) => s + x, 0) / a.length;
  const mb = b.reduce((s, x) => s + x, 0) / b.length;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

/** The tune's key (C major when there are no notes). */
export function inferKey(notes: MelNote[]): Key {
  const w = pitchWeights(notes);
  let best: Key = { tonic: 0, minor: false, name: 'C major' };
  let bestR = -Infinity;
  if (!w.some((x) => x > 0)) return best;
  // the last note sounds like home: a little weight toward a key it is the tonic of
  const last = notes.reduce<MelNote | undefined>((a, n) => (!a || n.start >= a.start ? n : a), undefined);
  for (const minor of [false, true]) {
    for (let t = 0; t < 12; t++) {
      const prof = (minor ? MINOR_PROFILE : MAJOR_PROFILE).map((_, i) => (minor ? MINOR_PROFILE : MAJOR_PROFILE)[(i - t + 12) % 12]);
      const r = correlate(w, prof) + (last && last.key % 12 === t ? 0.05 : 0);
      if (r > bestR + 1e-9) {
        bestR = r;
        best = { tonic: t, minor, name: `${NAMES[t]} ${minor ? 'minor' : 'major'}` };
      }
    }
  }
  return best;
}

interface Candidate {
  chord: Chord;
  /** How likely the chord is in any bar. */
  prior: number;
  tones: number[];
}

const make = (tonic: number, step: number, quality: Chord['quality'], degree: string): Chord => {
  const root = (tonic + step) % 12;
  return { root, quality, degree, name: `${NAMES[root]}${quality === 'min' ? 'm' : quality === 'dim' ? 'dim' : ''}` };
};

/** The triads a key's songs use most, with how often. */
function keyChords(key: Key): Candidate[] {
  const t = key.tonic;
  const list: [number, Chord['quality'], string, number][] = key.minor
    ? [
        [0, 'min', 'i', 0.5],
        [5, 'min', 'iv', 0.25],
        [7, 'maj', 'V', 0.3],
        [3, 'maj', 'III', 0.15],
        [8, 'maj', 'VI', 0.15],
        [10, 'maj', 'VII', 0.1],
      ]
    : [
        [0, 'maj', 'I', 0.5],
        [5, 'maj', 'IV', 0.3],
        [7, 'maj', 'V', 0.3],
        [9, 'min', 'vi', 0.15],
        [2, 'min', 'ii', 0.1],
        [4, 'min', 'iii', 0],
      ];
  return list.map(([step, q, deg, prior]) => {
    const chord = make(t, step, q, deg);
    const third = q === 'maj' ? 4 : 3;
    const fifth = q === 'dim' ? 6 : 7;
    return { chord, prior, tones: [chord.root, (chord.root + third) % 12, (chord.root + fifth) % 12] };
  });
}

/** Chord tones of a chord as pitch classes: root, third, fifth. */
export function chordTones(c: Chord): number[] {
  const third = c.quality === 'maj' ? 4 : 3;
  const fifth = c.quality === 'dim' ? 6 : 7;
  return [c.root, (c.root + third) % 12, (c.root + fifth) % 12];
}

/** Weight of a note sounding over [a, b) of a span starting at `from`, by where it starts in the bar. */
function fit(c: Candidate, notes: MelNote[], from: number, to: number, beatsPerBar: number): number {
  let s = 0;
  for (const n of notes) {
    const a = Math.max(from, n.start);
    const b = Math.min(to, n.start + n.len);
    if (b <= a) continue;
    const pos = (((a % beatsPerBar) + beatsPerBar) % beatsPerBar) + 1e-6;
    const strong = pos < 0.01 ? 1.6 : pos % 1 < 0.01 ? 1 : 0.6;
    const pc = ((n.key % 12) + 12) % 12;
    const k = c.tones.indexOf(pc);
    s += (b - a) * strong * (k === 0 ? 1.05 : k > 0 ? 1 : -0.6);
  }
  return s;
}

/** How a progression likes to move from one chord to the next (by degree). */
const MOVES: Record<string, number> = {
  'V>I': 0.5,
  'V>i': 0.5,
  'IV>V': 0.25,
  'iv>V': 0.25,
  'ii>V': 0.3,
  'IV>I': 0.15,
  'vi>IV': 0.15,
  'vi>ii': 0.1,
  'I>IV': 0.1,
  'I>V': 0.1,
  'i>iv': 0.1,
  'VI>VII': 0.2,
  'VII>i': 0.2,
  'III>VI': 0.1,
};

interface InferOptions {
  beatsPerBar: number;
  /** How many beats the song lasts (bars cover it all). */
  beats: number;
  /** Allow a second chord halfway through a 4-beat bar. */
  halves?: boolean;
  /** 0..1: how much random nudging (a different take); 0 gives the best fit. */
  jitter?: number;
  rand?: () => number;
}

/** A chord for each bar (or half bar) of the tune, in the given key. */
export function inferChords(notes: MelNote[], key: Key, o: InferOptions): ChordSpan[] {
  const cands = keyChords(key);
  const bars = Math.max(1, Math.ceil(o.beats / o.beatsPerBar - 1e-6));
  const split = o.halves && o.beatsPerBar % 2 === 0;
  const unit = split ? o.beatsPerBar / 2 : o.beatsPerBar;
  const units = bars * (split ? 2 : 1);
  const rand = o.rand ?? Math.random;
  const jitter = o.jitter ?? 0;
  // Viterbi: score[u][c] the best progression ending on chord c at unit u
  const score: number[][] = [];
  const back: number[][] = [];
  for (let u = 0; u < units; u++) {
    const from = u * unit;
    const firstOfBar = !split || u % 2 === 0;
    const lastUnit = u === units - 1;
    score.push([]);
    back.push([]);
    cands.forEach((c, ci) => {
      let local = fit(c, notes, from, from + unit, o.beatsPerBar) + c.prior * unit * 0.6 + (jitter ? rand() * jitter * unit * 0.6 : 0);
      if (u === 0 && c.chord.degree.toLowerCase() === 'i') local += unit * 0.5;
      if (lastUnit && c.chord.degree.toLowerCase() === 'i') local += unit * 0.6;
      if (u === 0) {
        score[u][ci] = local;
        back[u][ci] = -1;
        return;
      }
      let best = -Infinity;
      let arg = 0;
      cands.forEach((p, pi) => {
        const same = pi === ci;
        // staying inside a bar is natural; changing at a half bar has to earn it
        const move = same ? (firstOfBar ? 0.15 : unit * 0.45) : firstOfBar ? (MOVES[`${p.chord.degree}>${c.chord.degree}`] ?? 0) : -unit * 0.1;
        const v = score[u - 1][pi] + move;
        if (v > best) {
          best = v;
          arg = pi;
        }
      });
      score[u][ci] = best + local;
      back[u][ci] = arg;
    });
  }
  const last = score[units - 1];
  let c = last.indexOf(Math.max(...last));
  const pick: number[] = new Array(units);
  for (let u = units - 1; u >= 0; u--) {
    pick[u] = c;
    c = back[u][c];
  }
  // merge equal neighbors inside a bar
  const out: ChordSpan[] = [];
  pick.forEach((ci, u) => {
    const prev = out[out.length - 1];
    const sameBar = split && u % 2 === 1;
    if (prev && sameBar && prev.chord === cands[ci].chord) prev.len += unit;
    else out.push({ start: u * unit, len: unit, chord: cands[ci].chord });
  });
  return out;
}
