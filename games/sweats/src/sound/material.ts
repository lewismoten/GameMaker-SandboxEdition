// The Shakespeare in Sweatpants score's chords and tunes: chord symbols to pitch classes, and each section's bars (song.ts).

// ---- chords -------------------------------------------------------------------------------

export const PC: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
/** Per quality: the chord's tones (from the root) and the three the comping voices play (thirds, sevenths and a color; the bass has the root). */
export const QUALITY: Record<string, { tones: number[]; comp: number[] }> = {
  '': { tones: [0, 4, 7], comp: [0, 4, 7] },
  m: { tones: [0, 3, 7], comp: [0, 3, 7] },
  '7': { tones: [0, 4, 7, 10], comp: [4, 10, 14] },
  '7b9': { tones: [0, 4, 7, 10, 13], comp: [4, 10, 13] },
  maj7: { tones: [0, 4, 7, 11], comp: [4, 11, 14] },
  m7: { tones: [0, 3, 7, 10], comp: [3, 10, 14] },
  '6': { tones: [0, 4, 7, 9], comp: [4, 9, 14] },
  m6: { tones: [0, 3, 7, 9], comp: [3, 9, 14] },
  m7b5: { tones: [0, 3, 6, 10], comp: [3, 6, 10] },
  dim7: { tones: [0, 3, 6, 9], comp: [3, 6, 9] },
};

export interface Chord {
  pc: number;
  tones: number[];
  comp: number[];
  minor: boolean;
}

export function chord(name: string): Chord {
  const m = /^([A-G][b#]?)(.*)$/.exec(name);
  const q = m && QUALITY[m[2]];
  if (!m || !q) throw new Error(`Unknown chord ${name}`);
  return { pc: PC[m[1]], tones: q.tones, comp: q.comp, minor: q.tones[1] === 3 };
}

/** Folds a pitch class into [lo, lo + 12). */
export const fold = (pc: number, lo: number) => lo + ((((pc - lo) % 12) + 12) % 12);
/** Whether MIDI note n is one of the chord's tones (or colors). */
export const inChord = (c: Chord, n: number) => [...c.tones, ...c.comp].some((i) => (c.pc + i - n) % 12 === 0);

// ---- the material -------------------------------------------------------------------------

export interface Sec {
  name: string;
  /** One chord per bar, or several ("Am7 G7": half a bar each). */
  chords: string[];
  /** One bar of the tune per string (kit/songFx tones(): "~" scoops, "\" falls, "!" accents). */
  tune: string[];
  /** Beats a bar (4, or 3 for the waltz). */
  bpb?: number;
}

export const slice = (s: Sec, from: number, to = s.tune.length): Sec => ({ ...s, chords: s.chords.slice(from, to), tune: s.tune.slice(from, to) });

/** The Sweatpants Stroll, the main theme: a sly medium swing in F (the poet sauntering on in his ruff). */
export const STROLL: Sec = {
  name: 'stroll',
  chords: ['Fmaj7 D7', 'Gm7 C7', 'Am7 D7', 'Gm7 C7', 'Fmaj7 F7', 'Bbmaj7 Bbm6', 'Am7 D7', 'Gm7 C7'],
  tune: [
    'A4 e, C5 e, F5 e, A5 e, _ q, F#5 q',
    'G5 q., F5 e, E5 q, C5 q',
    'r e, A4 e, C5 e, E5 e, _ q, F#5 q',
    'F5 e, E5 e, D5 e, Bb4 e, ~C5 h',
    'A4 e, C5 e, F5 e, A5 e, _ q, Eb5 q',
    'D5 q., F5 e, Db5 q, Bb4 q',
    'A4 q, C5 e, E5 e, ~F#5 q, A5 q',
    'G5 e, F5 e, E5 e, D5 e, C5 q\\, r q',
  ],
};

/** Office: cool jazz in A minor (the office chair's bed: 139.6 BPM, G7 most of the time, Bb7 the twist). */
export const OFFICE: Sec = {
  name: 'office',
  chords: ['Am7', 'G7', 'Fmaj7', 'G7', 'Am7', 'Bb7', 'Fmaj7 G7', 'Am7 E7', 'Fmaj7', 'G7', 'Cmaj7', 'Am7', 'Fmaj7', 'Bb7', 'Am7 G7', 'Am7 E7'],
  tune: [
    'A4 q, C5 e, E5 e, G5 q., E5 e',
    'F5 e, D5 e, B4 q, r h',
    'r e, A4 e, C5 e, E5 e, ~G5 q, E5 q',
    'D5 h., r q',
    'A4 q, C5 e, E5 e, A5 q, G5 e, E5 e',
    'F5 e, D5 e, Ab5 q, ~F5 h',
    'E5 q, C5 e, A4 e, B4 q, D5 q',
    'C5 h, B4 q, G#4 q',
    'r q, A5 e, G5 e, E5 e, C5 e, A4 q',
    'B4 e, D5 e, F5 e, A5 e, ~G5 h',
    'E5 q., D5 e, C5 e, B4 e, G4 q',
    'A4 h, r e, C5 e, E5 e, G5 e',
    'A5 q., G5 e, E5 q, C5 q',
    'D5 q, F5 q, Ab5 q, ~Bb5 q',
    'A5 q., E5 e, D5 q, B4 q',
    'A4 h\\, r q, E5 q',
  ],
};

/** Shop: the self-checkout's bossa nova in F (its last bar left for the beeps). */
export const SHOP: Sec = {
  name: 'shop',
  chords: ['Fmaj7', 'Fmaj7', 'G7', 'G7', 'Gm7', 'C7', 'Fmaj7', 'C7', 'Bbmaj7', 'Eb7', 'Am7', 'D7', 'Gm7', 'C7', 'Fmaj7', 'Gm7 C7'],
  tune: [
    'E5 q., C5 e, _ q, A4 q',
    'r e, A4 e, C5 e, E5 e, _ e, G5 e, F5 q',
    'F5 q., D5 e, _ q, B4 q',
    'r e, B4 e, D5 e, F5 e, _ e, A5 e, G5 q',
    'Bb5 q., A5 e, _ e, G5 e, F5 q',
    'E5 q., D5 e, _ e, C5 e, Bb4 q',
    'A4 h., r q',
    'r e, C5 e, E5 e, G5 e, Bb5 e, G5 e, E5 q',
    'D6 q., C6 e, _ e, A5 e, F5 q',
    'G5 q., F5 e, _ e, Db5 e, Eb5 q',
    'C6 q., A5 e, _ e, G5 e, E5 q',
    'F#5 q., E5 e, _ e, C5 e, A4 q',
    'Bb4 q, D5 q, F5 q, A5 q',
    'G5 q., E5 e, _ e, C5 e, Bb4 q',
    'A4 w',
    'r w',
  ],
};

/** Home: the lounge ballad in G (the umbrella's bed: 122.6 BPM, Am - D7 - G, played in half time). */
export const HOME: Sec = {
  name: 'home',
  chords: ['Gmaj7', 'Em7', 'Am7', 'D7', 'Bm7', 'E7', 'Am7', 'D7', 'Gmaj7', 'G7', 'Cmaj7', 'Cm6', 'Bm7', 'E7', 'Am7 D7', 'G6 D7'],
  tune: [
    'B4 h, ~D5 q, F#5 q',
    'G5 h., E5 q',
    'C5 q., B4 e, A4 q, E5 q',
    'D5 w',
    'D5 q., C#5 e, D5 q, F#5 q',
    'G#5 h, E5 q, D5 q',
    'C5 q, E5 q, A5 q., G5 e',
    'F#5 h, r q, A4 q',
    'B4 q., C5 e, D5 q, G5 q',
    'F5 h., D5 q',
    'E5 q, G5 q, B5 q., A5 e',
    'G5 h, Eb5 h',
    'D5 q., E5 e, F#5 q, D5 q',
    'B4 h, ~G#5 q, E5 q',
    'A4 q., C5 e, F#5 q, ~A5 q',
    'G5 h, r q, A4 q',
  ],
};

/** Outside: medium-up swing in Bb, AABA (A twice here; the bridge is BRIDGE). */
export const OUTSIDE: Sec = {
  name: 'outside',
  chords: ['Bb G7', 'Cm7 F7', 'Bb G7', 'Cm7 F7', 'Fm7 Bb7', 'Eb Ab7', 'Dm7 G7', 'Cm7 F7'],
  tune: [
    'D5 e, F5 e, G5 e, Bb5 e, _ q, G5 q',
    'A5 e, G5 e, Eb5 e, C5 e, A4 q, r q',
    'D5 e, F5 e, G5 e, Bb5 e, _ q, B5 q',
    'C6 e, Bb5 e, G5 e, Eb5 e, F5 q, r q',
    'Ab5 q, F5 e, Ab5 e, _ q, D5 q',
    'G5 q, Eb5 e, G5 e, Gb5 q, Eb5 q',
    'F5 e, E5 e, D5 e, C5 e, B4 q, D5 q',
    'C5 h, r q, D5 q',
  ],
};
export const BRIDGE: Sec = {
  name: 'bridge',
  chords: ['D7', 'D7', 'G7', 'G7', 'C7', 'C7', 'F7', 'F7'],
  tune: [
    'F#5 q, A5 q, C6 e, A5 e, F#5 q',
    'D5 h, r h',
    'B4 q, D5 q, F5 e, D5 e, B4 q',
    'G4 h, r h',
    'E5 q, G5 q, Bb5 e, G5 e, E5 q',
    'C5 h, r h',
    'A4 q, C5 q, Eb5 e, C5 e, A4 q',
    'F4 q, A4 q, C5 q, Eb5 q',
  ],
};

/** Epic: mock-heroic noir in D minor (the pizza war's bed: 178.2 BPM, Bb - C7 with Am, Gm, Dm; at half tempo). */
export const EPIC: Sec = {
  name: 'epic',
  chords: ['Dm', 'Bb C7', 'Am', 'Dm', 'Gm', 'Bb C7', 'A7', 'Dm'],
  tune: [
    'D5 q.!, A4 e, D5 t, E5 t, F5 t, A5 q',
    'Bb5 q., A5 e, G5 q, ~E5 q',
    'C6 h, A5 q., E5 e',
    'F5 q, E5 e, D5 e, A4 h',
    'G5 q., G5 e, Bb5 t, A5 t, G5 t, D6 q',
    'D6 q, C6 e, Bb5 e, C6 h',
    'C#6 q., A5 e, E5 q, G5 q',
    'D6 h.!, r q',
  ],
};

/** Chase: a bebop blues in F, all eighth notes. */
export const CHASE: Sec = {
  name: 'chase',
  chords: ['F7', 'Bb7', 'F7', 'Cm7 F7', 'Bb7', 'Bdim7', 'F7', 'Am7 D7', 'Gm7', 'C7', 'F7 D7', 'Gm7 C7'],
  tune: [
    'r e, C5 e, D5 e, Eb5 e, E5 e, F5 e, A5 e, C6 e',
    'Bb5 e, Ab5 e, F5 e, D5 e, Db5 e, D5 e, r q',
    'C5 e, F5 e, A5 e, C6 e, B5 e, Bb5 e, A5 e, F5 e',
    'G5 e, Eb5 e, C5 e, Bb4 e, A4 e, C5 e, Eb5 e, Gb5 e',
    'F5 q, D5 e, F5 e, Ab5 e, G5 e, F5 e, D5 e',
    'Ab5 e, F5 e, D5 e, B4 e, D5 q, r q',
    'C5 e, A4 e, C5 e, F5 e, A5 e, G5 e, F5 e, E5 e',
    'Eb5 e, D5 e, C5 e, A4 e, F#4 e, A4 e, C5 e, Eb5 e',
    'D5 e, F5 e, Bb5 e, A5 e, G5 e, D5 e, F5 e, E5 e',
    'E5 e, G5 e, Bb5 e, Db6 e, C6 e, Bb5 e, G5 e, E5 e',
    'F5 q, C5 e, A4 e, F#5 q, D5 e, C5 e',
    'Bb4 e, D5 e, G5 e, F5 e, E5 e, C5 e, Bb4 e, G4 e',
  ],
};

/** Blues: a slow minor torch blues in C, every phrase scooped into and fallen off. */
export const BLUES: Sec = {
  name: 'blues',
  chords: ['Cm', 'Cm', 'Cm', 'Cm7', 'Fm', 'Fm', 'Cm', 'Cm', 'Ab7', 'G7', 'Cm Ab7', 'Cm G7'],
  tune: [
    '~G4 q, C5 e, Eb5 e, G5 q\\\\, r q',
    'F5 e, Eb5 e, C5 q, r h',
    '~G4 q, C5 e, Eb5 e, Bb5 q\\\\, G5 q',
    'F5 e, Eb5 e, C5 e, Bb4 e, C5 h',
    '~Ab4 q, C5 e, F5 e, Ab5 q\\\\, r q',
    'G5 e, F5 e, Eb5 e, C5 e, Ab4 h',
    '~Eb5 q, C5 e, Bb4 e, G4 h',
    'r h, r e, G4 e, Bb4 e, B4 e',
    'C5 q, Eb5 q, Gb5 h\\\\\\',
    'F5 q, D5 q, B4 h',
    'C5 q, Eb5 q, ~Gb5 q, Eb5 q',
    'C5 h, r q, G4 q',
  ],
};

/** Triumph: the shout chorus in D (the socks' bed: 179.4 BPM, A7 and Bm, G, F#m, Em, a borrowed C). */
export const TRIUMPH: Sec = {
  name: 'triumph',
  chords: ['D', 'Bm7', 'G', 'A7', 'F#m7', 'Bm7', 'Em7', 'A7', 'D', 'Bm7', 'G', 'C7', 'Bm7', 'E7', 'Em7 A7', 'D A7'],
  tune: [
    'r e, F#5 e!, A5 e, D6 e!, _ q, B5 e, A5 e',
    'F#5 q!, D5 q, r e, A5 e!, _ q',
    'B5 e, A5 e, G5 e, B5 e!, _ q, D6 q\\',
    'C#6 e!, B5 e, A5 e, G5 e, E5 q!, r q',
    'r e, A5 e!, _ e, A5 e, C#6 q!, A5 q',
    'D6 q!, B5 e, A5 e, F#5 q, D5 q',
    'E5 e, G5 e, B5 e, D6 e!, _ q, C#6 q',
    'A5 h\\\\, r h',
    'r e, F#5 e!, A5 e, D6 e!, _ q, B5 e, A5 e',
    'F#5 q!, D5 q, r e, A5 e!, _ q',
    'B5 e, A5 e, G5 e, D6 e!, _ q, E6 q',
    'E6 q!, C6 q, Bb5 e!, G5 e, E5 q',
    'D6 q., B5 e, F#5 q, A5 q',
    'G#5 q., B5 e, D6 q, ~E6 q!',
    'D6 e, B5 e, G5 e, E5 e, C#6 q!, A5 q',
    'D6 q!, r q, r e, A5 e!, C#6 e, E6 e!',
  ],
};

/** The bee round The Hive: a bossa in C, each phrase starting on a buzzing trill. */
export const BUZZ: Sec = {
  name: 'buzz',
  chords: ['Cmaj7', 'Am7', 'Dm7', 'G7', 'Em7', 'A7', 'Dm7', 'G7'],
  tune: [
    'E5 s, F5 s, E5 s, F5 s, E5 q, G5 q, B5 q',
    'A5 h, r e, G5 e, E5 e, C5 e',
    'F5 s, G5 s, F5 s, G5 s, F5 q, A5 q, C6 q',
    'B5 h, r e, A5 e, F5 e, D5 e',
    'G5 s, A5 s, G5 s, A5 s, G5 q, E5 q, B4 q',
    'C#5 q., E5 e, G5 q, A5 q',
    'F5 q, D5 e, F5 e, A5 q, C6 q',
    'B5 q, G5 e, F5 e, D5 q, r q',
  ],
};

/** The beatnik snap: a modal vamp on Dm7 (finger snaps on two and four, bongos, the bass's call and the band's answer). */
export const SNAP: Sec = {
  name: 'snap',
  chords: ['Dm7', 'Dm7', 'Dm7', 'Dm7', 'Dm7', 'Dm7', 'Dm7', 'Dm7'],
  tune: ['A5 q., G5 e, E5 q, D5 q', 'r w', 'C5 e, D5 e, F5 e, A5 e, ~C6 q, A5 q', 'r w', 'A5 q., G5 e, E5 q, D5 q', 'r h, F5 q, E5 q', 'D5 e, F5 e, A5 e, C6 e, B5 q, G5 q', 'A5 w'],
};

/** Last call: a wistful jazz waltz in A minor. */
export const WALTZ: Sec = {
  name: 'waltz',
  bpb: 3,
  chords: ['Am7', 'Am7', 'Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Bm7b5', 'E7', 'Am7', 'Am7', 'Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Bm7b5 E7', 'Am7'],
  tune: ['E5 h, A5 q', 'G5 h.', 'F5 h, D5 q', 'B4 h.', 'G5 q, E5 q, C5 q', 'A5 h, F5 q', 'D5 q, F5 q, A5 q', 'G#5 h.', 'A5 h, E5 q', 'C6 h, B5 q', 'A5 q, F5 q, D5 q', 'B4 h, D5 q', 'G5 h, E5 q', 'A5 q, C6 q, A5 q', 'F5 q, D5 q, B4 e, G#4 e', 'A4 h.'],
};
