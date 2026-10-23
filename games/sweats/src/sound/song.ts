// The score of "Shakespeare in Sweatpants" (The Bard of Bizarre, 1995): coffee-house jazz for
// open-mic night at The Hive, written for the Sound Blaster's OPL2 FM chip as Creative Music Files
// in rhythm mode (six melodic voices: the lead, its twin, an upright bass and three comping
// voices; the chip's five drums: kick, snare or brushes, tom, ride and hi-hat). Plain CMF events
// only (note on/off, program change, the rhythm switch and the markers PLAYGAME skips), with
// the tricks of games/kit/songFx.ts: swung eighths (every note, chord and cymbal is placed on a
// swing grid), walking bass lines that lead chromatically into the next chord, comping that
// voice-leads its chords, block-voiced shout choruses (the section plays chord tones under
// every note of the lead), rolled Rhodes chords, the pipe organ swelling (program changes
// through copies of one patch), stepped scoops and falls (CMF has no pitch bend), timpani
// rolls on the tuned tom, and the occasional sound gag (the office chair's squeak, the
// self-checkout's beeps, the bee buzzing round The Hive).
//
// Four of the songs come from the monologues' Riffusion music beds, measured by
// tools/analyze.py (games/kit/song/analyze.py: tempo by spectral-flux autocorrelation, key by
// Krumhansl-Schmuckler, chords per bar against templates):
//   office  <- "The Office Chair That Tried to Kill Me": 139.6 BPM, A minor, the bed sitting on
//              G7 with Am, F, Bb and C round it (cool jazz in A minor at 140, Bb7 the twist);
//   home    <- "Shelter Me Gently, You Wounded Beast": 122.6 BPM, G major, Am - D7 - G with C,
//              Bm and Em (a ii-V-I lounge ballad in G, the bed's tempo felt in half time);
//   epic    <- "How the Cat Won the Pizza War": 178.2 BPM, D minor, vamping Bb - C7 with Am, Gm
//              and Dm (mock-heroic noir in D minor at half the bed's tempo, 89);
//   triumph <- "Wore All the Weird Socks": 179.4 BPM, D major, A7 and Bm the most, G, F#m, Em
//              and a borrowed C (the big band shout chorus in D at the bed's tempo).
// The rest is composed: the Sweatpants Stroll (the main theme: title, menu, story, The Hive,
// the curtain call), the self-checkout bossa nova, the swing for going outside, the bebop
// chase, the torch blues, the bee's buzz, the beatnik snap and the last-call waltz.
import { sbi, INSTRUMENTS } from '../../../kit/music';
import { BASS as UPRIGHT, CELESTA, EPIANO, FLUTE, Writer } from '../../../kit/song';
import { DRUM, Fx, detuned, sweep, tones } from '../../../kit/songFx';

/** The level songs a monologue may name, and the songs of the title, menu, story, endings and intermissions. */
export const LEVEL_SONGS = ['office', 'shop', 'home', 'outside', 'epic', 'chase', 'blues', 'triumph'] as const;
export const SCREEN_SONGS = ['title', 'menu', 'story', 'won', 'lost', 'hive', 'inter1', 'inter2', 'inter3', 'finale'] as const;
export type SongName = (typeof LEVEL_SONGS)[number] | (typeof SCREEN_SONGS)[number];

// ---- the patches --------------------------------------------------------------------------

/** Vibraphone: a near-sine bar with a faint fourth partial, the motor's tremolo, ringing down. */
const VIBES = sbi({ modChar: 0x04, carChar: 0x81, modLevel: 0x28, carLevel: 0x00, modAD: 0xf6, carAD: 0xf3, modSR: 0x36, carSR: 0x24, feedback: 0x02 });
/** Harmon-muted trumpet: thin, nasal, a little buzz (half-sine modulator). */
const MUTE = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x1a, carLevel: 0x00, modAD: 0x95, carAD: 0x86, modSR: 0x17, carSR: 0x18, modWave: 1, feedback: 0x0c });
/** Open brass: trumpets for the shouts, trombones under them. */
const BRASS = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x16, carLevel: 0x00, modAD: 0x75, carAD: 0x75, modSR: 0x17, carSR: 0x17, feedback: 0x0e });
/** Tenor sax: breathy reed with vibrato. */
const TENOR = sbi({ modChar: 0x31, carChar: 0x61, modLevel: 0x1c, carLevel: 0x00, modAD: 0x75, carAD: 0x76, modSR: 0x15, carSR: 0x16, modWave: 1, feedback: 0x0a });
/** Clarinet: the modulator an octave up, so only the odd harmonics sound. */
const CLARINET = sbi({ modChar: 0x22, carChar: 0x61, modLevel: 0x1e, carLevel: 0x00, modAD: 0xb4, carAD: 0xa5, modSR: 0x06, carSR: 0x07, feedback: 0x08 });
/** Nylon-string guitar for the bossa nova. */
const GUITAR = sbi({ modChar: 0x03, carChar: 0x01, modLevel: 0x1e, carLevel: 0x00, modAD: 0xf4, carAD: 0xf3, modSR: 0x55, carSR: 0x45, feedback: 0x0a });
/** The piano trio's piano, the Rhodes, the strings. */
const PIANO = INSTRUMENTS.piano;
const RHODES = EPIANO;
const STRINGS = INSTRUMENTS.strings;
/** The pipe organ (two drawbars at once, the upper one trembling), and its swell out of nothing. */
const PIPE = sbi({ modChar: 0x21, carChar: 0xa2, modLevel: 0x12, carLevel: 0x0a, modAD: 0xf0, carAD: 0xf0, modSR: 0x0f, carSR: 0x0f, carWave: 1, feedback: 0x03 });
const SWELL = sweep(PIPE, 8, { mod: 48, car: 44 }, { mod: 12, car: 6 });

// Rhythm mode drums (one operator each but the kick: the modulator half of the SBI).
const KICK = sbi({ modChar: 0x01, carChar: 0x01, modLevel: 0x0e, carLevel: 0x00, modAD: 0xf8, carAD: 0xf7, modSR: 0x77, carSR: 0x57, feedback: 0x08 });
const SNARE = sbi({ modChar: 0x02, carChar: 0x00, modLevel: 0x04, carLevel: 0x00, modAD: 0xf8, carAD: 0x00, modSR: 0x08, carSR: 0x00, feedback: 0x00 });
/** Brushes on the snare: a slow attack, a swish. */
const BRUSH = sbi({ modChar: 0x02, carChar: 0x00, modLevel: 0x0a, carLevel: 0x00, modAD: 0x95, carAD: 0x00, modSR: 0x05, carSR: 0x00, feedback: 0x00 });
/** The cross-stick of the bossa nova. */
const RIM = sbi({ modChar: 0x02, carChar: 0x00, modLevel: 0x06, carLevel: 0x00, modAD: 0xfb, carAD: 0x00, modSR: 0x0b, carSR: 0x00, feedback: 0x00 });
const TIMP = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x02, carLevel: 0x00, modAD: 0xf5, carAD: 0x00, modSR: 0x35, carSR: 0x00, feedback: 0x00 });
const BONGO = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x04, carLevel: 0x00, modAD: 0xf8, carAD: 0x00, modSR: 0x58, carSR: 0x00, feedback: 0x00 });
const RIDE = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x0a, carLevel: 0x00, modAD: 0xf5, carAD: 0x00, modSR: 0x05, carSR: 0x00, feedback: 0x00 });
const CRASH = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x04, carLevel: 0x00, modAD: 0xf3, carAD: 0x00, modSR: 0x03, carSR: 0x00, feedback: 0x00 });
/** The hi-hat's foot chick (and the beatniks' finger snaps). */
const HAT = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x0a, carLevel: 0x00, modAD: 0xfa, carAD: 0x00, modSR: 0x0a, carSR: 0x00, feedback: 0x00 });

// ---- chords -------------------------------------------------------------------------------

const PC: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
/** Per quality: the chord's tones (from the root) and the three the comping voices play (thirds, sevenths and a color; the bass has the root). */
const QUALITY: Record<string, { tones: number[]; comp: number[] }> = {
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

interface Chord {
  pc: number;
  tones: number[];
  comp: number[];
  minor: boolean;
}

function chord(name: string): Chord {
  const m = /^([A-G][b#]?)(.*)$/.exec(name);
  const q = m && QUALITY[m[2]];
  if (!m || !q) throw new Error(`Unknown chord ${name}`);
  return { pc: PC[m[1]], tones: q.tones, comp: q.comp, minor: q.tones[1] === 3 };
}

/** Folds a pitch class into [lo, lo + 12). */
const fold = (pc: number, lo: number) => lo + ((((pc - lo) % 12) + 12) % 12);
/** Whether MIDI note n is one of the chord's tones (or colors). */
const inChord = (c: Chord, n: number) => [...c.tones, ...c.comp].some((i) => (c.pc + i - n) % 12 === 0);

// ---- the material -------------------------------------------------------------------------

interface Sec {
  name: string;
  /** One chord per bar, or several ("Am7 G7": half a bar each). */
  chords: string[];
  /** One bar of the tune per string (kit/songFx tones(): "~" scoops, "\" falls, "!" accents). */
  tune: string[];
  /** Beats a bar (4, or 3 for the waltz). */
  bpb?: number;
}

const slice = (s: Sec, from: number, to = s.tune.length): Sec => ({ ...s, chords: s.chords.slice(from, to), tune: s.tune.slice(from, to) });

/** The Sweatpants Stroll, the main theme: a sly medium swing in F (the poet sauntering on in his ruff). */
const STROLL: Sec = {
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
const OFFICE: Sec = {
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
const SHOP: Sec = {
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
const HOME: Sec = {
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
const OUTSIDE: Sec = {
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
const BRIDGE: Sec = {
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
const EPIC: Sec = {
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
const CHASE: Sec = {
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
const BLUES: Sec = {
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
const TRIUMPH: Sec = {
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
const BUZZ: Sec = {
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
const SNAP: Sec = {
  name: 'snap',
  chords: ['Dm7', 'Dm7', 'Dm7', 'Dm7', 'Dm7', 'Dm7', 'Dm7', 'Dm7'],
  tune: ['A5 q., G5 e, E5 q, D5 q', 'r w', 'C5 e, D5 e, F5 e, A5 e, ~C6 q, A5 q', 'r w', 'A5 q., G5 e, E5 q, D5 q', 'r h, F5 q, E5 q', 'D5 e, F5 e, A5 e, C6 e, B5 q, G5 q', 'A5 w'],
};

/** Last call: a wistful jazz waltz in A minor. */
const WALTZ: Sec = {
  name: 'waltz',
  bpb: 3,
  chords: ['Am7', 'Am7', 'Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Bm7b5', 'E7', 'Am7', 'Am7', 'Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Bm7b5 E7', 'Am7'],
  tune: ['E5 h, A5 q', 'G5 h.', 'F5 h, D5 q', 'B4 h.', 'G5 q, E5 q, C5 q', 'A5 h, F5 q', 'D5 q, F5 q, A5 q', 'G#5 h.', 'A5 h, E5 q', 'C6 h, B5 q', 'A5 q, F5 q, D5 q', 'B4 h, D5 q', 'G5 h, E5 q', 'A5 q, C6 q, A5 q', 'F5 q, D5 q, B4 e, G#4 e', 'A4 h.'],
};

// ---- the band -----------------------------------------------------------------------------

const LEAD = 0;
const TWIN = 1;
const BASSCH = 2;
const COMP = [3, 4, 5];

type Bass = 'walk' | 'two' | 'bossa' | 'pedal' | 'riff' | 'stop' | 'none';
type Comp = 'charleston' | 'red' | 'pad' | 'swell' | 'roll' | 'bossa' | 'waltz' | 'shout' | 'blues' | 'sowhat' | 'stop' | 'none';
type Drums = 'ride' | 'bebop' | 'brush' | 'bossa' | 'shout' | 'march' | 'noir' | 'waltz' | 'shuffle' | 'snap' | 'stop' | 'none';

interface Style {
  lead: Uint8Array;
  /** The second voice: an octave over or under the lead, a chord tone under it, or the lead's vibrato twin. */
  twin?: 'octave' | 'below' | 'harm' | 'unison' | 'none';
  twinPatch?: Uint8Array;
  bass: Bass;
  comp: Comp;
  compPatch: Uint8Array;
  drums: Drums;
  /** Where the offbeat eighth falls (0.5 straight, 0.667 a triplet). */
  swing?: number;
  /** Each written beat lasts this many (2: half time). */
  stretch?: number;
  vel?: number;
  shift?: number;
  /** Play the lead this much higher than written. */
  up?: number;
  noTune?: boolean;
  /** A drum fill in the section's last bar (default true). */
  fill?: boolean;
  /** A crash on the section's first beat. */
  crash?: boolean;
  /** Sound gags and the like, from the section's first beat. */
  extra?: (a: Arranger, at: number) => void;
}

interface Note {
  at: number;
  len: number;
  n: number;
  vel: number;
  scoop: number;
  fall: number;
  accent: boolean;
}

class Arranger {
  readonly fx: Fx;
  /** Where the next section starts (beats). */
  beat = 0;
  private prev = [57, 60, 64];
  private warpFrom = 0;
  private swingAt = 0.5;

  constructor(readonly bpm: number) {
    this.fx = new Fx(new Writer(bpm));
    this.fx.open(LEAD, VIBES).open(TWIN, VIBES).open(BASSCH, UPRIGHT);
    COMP.forEach((c) => this.fx.open(c, PIANO));
    this.fx.open(DRUM.kick, KICK).open(DRUM.snare, SNARE).open(DRUM.tom, TIMP).open(DRUM.cymbal, RIDE).open(DRUM.hat, HAT);
  }

  /** Straight beats to swung ones (the offbeat eighth of every beat moves later). */
  warp(t: number): number {
    const rel = t - this.warpFrom;
    const b = Math.floor(rel + 1e-9);
    const u = rel - b;
    const s = this.swingAt;
    return this.warpFrom + b + (u < 0.5 ? u * 2 * s : s + (u - 0.5) * 2 * (1 - s));
  }

  /** A note from straight beat `at` lasting `len`, both swung. */
  hit(ch: number, at: number, len: number, n: number, vel: number, legato = 0.88): void {
    const a = this.warp(at);
    this.fx.note(ch, a, Math.max(1 / this.fx.w.tpb, this.warp(at + len) - a), n, vel, legato);
  }

  drum(ch: number, at: number, vel: number, n?: number): void {
    const a = this.warp(at);
    const note = n ?? { [DRUM.kick]: 36, [DRUM.snare]: 55, [DRUM.tom]: 48, [DRUM.cymbal]: 72, [DRUM.hat]: 55 }[ch]!;
    this.fx.note(ch, a, 0.25, note, vel, 0.6);
  }

  /** A crash on the ride's channel: the crash patch for one hit, then the ride again. */
  crash(at: number, vel = 120): void {
    this.fx.program(DRUM.cymbal, at, CRASH);
    this.drum(DRUM.cymbal, at, vel);
    this.fx.program(DRUM.cymbal, at + 0.75, RIDE);
  }

  /** Three comping voices near the last chord (the closest inversion), `shift` semitones moved. */
  voice(name: string, shift = 0): number[] {
    const c = chord(name);
    const pcs = c.comp.map((i) => (((c.pc + i + shift) % 12) + 12) % 12);
    let best: number[] = [];
    let cost = Infinity;
    for (let lo = 50; lo <= 62; lo++) {
      if (!pcs.includes(lo % 12)) continue;
      const v = [lo];
      for (let k = 1; k < 3; k++) {
        let n = v[k - 1] + 1;
        while (!pcs.includes(n % 12) || v.some((x) => x % 12 === n % 12)) n++;
        v.push(n);
      }
      const d = v.reduce((a, n, k) => a + Math.abs(n - this.prev[k]), 0);
      if (d < cost) {
        cost = d;
        best = v;
      }
    }
    this.prev = best;
    return best;
  }

  /** Lays a section out from `this.beat` and moves on. */
  section(sec: Sec, st: Style): this {
    const fx = this.fx;
    const at0 = this.beat;
    const bpb = sec.bpb ?? 4;
    const str = st.stretch ?? 1;
    const barLen = bpb * str;
    const total = sec.tune.length * barLen;
    const vel = st.vel ?? 100;
    const shift = st.shift ?? 0;
    this.warpFrom = at0;
    this.swingAt = st.swing ?? 0.5;
    fx.marker(at0, sec.name);
    fx.program(LEAD, at0, st.lead).program(TWIN, at0, st.twinPatch ?? (st.twin === 'unison' ? detuned(st.lead) : st.lead));
    COMP.forEach((c) => fx.program(c, at0, st.comp === 'swell' ? SWELL[0] : st.compPatch));
    fx.program(DRUM.snare, at0, ['brush', 'waltz', 'shuffle', 'noir'].includes(st.drums) ? BRUSH : st.drums === 'bossa' ? RIM : SNARE);
    fx.program(DRUM.tom, at0, st.drums === 'snap' ? BONGO : TIMP);

    // the chords, each with its start and length
    const chords: { name: string; at: number; span: number }[] = [];
    sec.chords.forEach((c, i) => {
      const names = c.split(' ');
      names.forEach((name, k) => chords.push({ name, at: at0 + i * barLen + (k * barLen) / names.length, span: barLen / names.length }));
    });
    const chordAt = (t: number) => chord([...chords].reverse().find((c) => c.at <= t + 1e-6)!.name);

    // the tune
    const notes: Note[] = [];
    sec.tune.forEach((bar, i) => {
      const ts = tones(bar);
      const beats = ts.reduce((a, t) => a + t.beats, 0);
      if (Math.abs(beats - bpb) > 1e-6) throw new Error(`${sec.name} bar ${i + 1} has ${beats} beats: ${bar}`);
      let t = at0 + i * barLen;
      for (const tone of ts) {
        const len = tone.beats * str;
        if (tone.tie && notes.length) {
          const last = notes[notes.length - 1];
          last.len += len;
          last.fall = tone.fall || last.fall;
        } else if (tone.n !== null) notes.push({ at: t, len, n: tone.n + shift + (st.up ?? 0), vel: vel + 8 + tone.accent, scoop: tone.scoop, fall: tone.fall, accent: tone.accent > 0 });
        t += len;
      }
    });
    if (!st.noTune) {
      this.play(LEAD, notes, 0);
      if (st.twin === 'octave') this.play(TWIN, notes.map((n) => ({ ...n, n: n.n + 12, vel: n.vel - 30, scoop: 0, fall: 0 })), 0);
      if (st.twin === 'below') this.play(TWIN, notes.map((n) => ({ ...n, n: n.n - 12, vel: n.vel - 16 })), 0);
      if (st.twin === 'unison') this.play(TWIN, notes.map((n) => ({ ...n, vel: n.vel - 14 })), 0);
      if (st.twin === 'harm')
        this.play(
          TWIN,
          notes.map((n) => {
            const c = chordAt(n.at);
            let m = n.n - 3;
            while (m > n.n - 10 && !inChord(c, m)) m--;
            return { ...n, n: m > n.n - 10 ? m : n.n - 12, vel: n.vel - 22, scoop: 0 };
          }),
          0,
        );
    }

    // the bass and the held or rolled chords, chord by chord
    chords.forEach((c, i) => {
      const next = chord(chords[(i + 1) % chords.length].name);
      this.bass(st.bass, c.name, c.at, c.span, next, i, vel, shift);
      const v = this.voice(c.name, shift);
      if (st.comp === 'pad' || st.comp === 'swell') v.forEach((n, k) => fx.note(COMP[k], c.at, c.span, n, vel - 34 + k * 3, 0.97));
      if (st.comp === 'swell') fx.swell(COMP, c.at, c.span * 0.85, SWELL);
      if (st.comp === 'roll')
        for (let h = 0; h < c.span - 1e-6; h += Math.min(c.span, 4)) {
          const len = Math.min(c.span - h, 4);
          fx.harp(COMP, c.at + h, len, v, len / 3, (k) => vel - 36 + k * 4 - (h ? 8 : 0));
        }
    });

    // comping that follows a rhythm, bar by bar (the chord under each hit)
    const rhythm: Record<string, [number, number, number?, number?][][]> = {
      charleston: [[[0, 1], [1.5, 0.5]], [[0, 1], [1.5, 1.5, 2]]],
      red: [[[1, 0.6], [2.5, 1]], [[0.5, 1], [2.5, 1]]],
      bossa: [[[0, 0.75], [1, 0.75], [2.5, 0.75], [3.5, 0.5]], [[0.5, 0.75], [2, 1.5]]],
      waltz: [[[1, 0.6], [2, 0.6]]],
      blues: [[[0, 1], [1.5, 0.5], [2, 1], [3.5, 0.5]]],
      sowhat: [[], [[1.5, 0.5, 1.5, 0], [2, 1.5, 2, -2]]],
      stop: [[[0, 0.5]]],
    };
    const realBars = Math.round(total / bpb);
    for (let j = 0; j < realBars; j++) {
      const at = at0 + j * bpb;
      const pats = rhythm[st.comp];
      if (pats) {
        const many = chords.filter((c) => c.at >= at - 1e-6 && c.at < at + bpb - 1e-6).length > 1;
        const pat = st.comp === 'bossa' || st.comp === 'sowhat' ? pats[j % 2] : pats[many && pats[1] ? 1 : 0];
        for (const [off, len, look, dv] of pat) {
          const name = [...chords].reverse().find((c) => c.at <= at + (look ?? off) + 1e-6)!.name;
          const v = this.voice(name, shift);
          v.forEach((n, k) => this.hit(COMP[k], at + off, len, n + (dv ?? 0), vel - 44 + k * 3 + (off === 0 ? 6 : 0), 0.85));
        }
      }
      const accents = notes.filter((n) => n.accent && n.at >= at - 1e-6 && n.at < at + bpb - 1e-6).map((n) => n.at - at);
      this.drumBar(st.drums, at, bpb, j, j === realBars - 1 && st.fill !== false, j === 0 && !!st.crash, accents, vel, chordAt(at));
    }

    // the shout: the section plays chord tones under every note of the lead (block voicing)
    if (st.comp === 'shout')
      for (const n of notes) {
        const c = chordAt(n.at);
        const under: number[] = [];
        for (let m = n.n - 2; m > n.n - 13 && under.length < 3; m--) if (inChord(c, m) && m % 12 !== n.n % 12 && !under.some((u) => u - m < 2)) under.push(m);
        under.forEach((m, k) => this.hit(COMP[k], n.at, n.len, m, vel - 26 - k * 3 + (n.accent ? 8 : 0), 0.8));
      }

    st.extra?.(this, at0);
    this.beat += total;
    return this;
  }

  /** Plays notes on a channel: swung, scooped up into, fallen off. */
  private play(ch: number, notes: Note[], shift: number): void {
    const fx = this.fx;
    const tick = 1 / fx.w.tpb;
    for (const t of notes) {
      const n = t.n + shift;
      const start = this.warp(t.at);
      const end = this.warp(t.at + t.len);
      let s = start;
      if (t.scoop) s = fx.slide(ch, start, n - t.scoop, n - 1, 2, t.vel - 12);
      const fallBeats = t.fall * 2 * tick;
      const body = Math.max(tick, (end - start) * 0.92 - (s - start) - fallBeats);
      if (t.fall) {
        fx.note(ch, s, body + tick, n, t.vel, 1);
        fx.slide(ch, s + body + tick, n - 1, n - t.fall, 2, t.vel - 20);
      } else fx.note(ch, s, end - s, n, t.vel, 0.9);
    }
  }

  /** The bass under one chord: walking (leading by a half step or a fifth into the next chord), two-feel, bossa, held, the beatnik riff or stop-time. */
  private bass(kind: Bass, name: string, at: number, span: number, next: Chord, k: number, vel: number, shift: number): void {
    const c = chord(name);
    const r = fold(c.pc + shift, 33);
    const third = c.minor ? 3 : 4;
    const fifth = c.tones.includes(6) ? 6 : 7;
    const nr = fold(next.pc + shift, 33);
    const approach = [nr - 1, nr + 1, nr + 7 > 50 ? nr - 5 : nr + 7][k % 3];
    const v = vel - 8;
    const put = (t: number, len: number, n: number, vv = v) => this.hit(BASSCH, at + t, len, n, vv, 0.86);
    if (kind === 'walk') {
      const steps = Math.max(1, Math.floor(span + 1e-6));
      const pools = [
        [third, fifth, 12, fifth],
        [2, third, fifth, 9],
        [12, 10, fifth, third],
        [fifth, 9, 12, 10],
      ];
      const pool = pools[k % 4];
      for (let q = 0; q < steps; q++) {
        const n = q === 0 ? r : q === steps - 1 ? approach : r + pool[(q - 1) % pool.length];
        put(q, q === steps - 1 ? span - q : 1, n, q === 0 ? v + 6 : v);
      }
    }
    if (kind === 'two') {
      const halves = Math.max(1, Math.floor(span / 2 + 1e-6));
      const seq = [r, r + fifth, r + 12, approach];
      for (let h = 0; h < halves; h++) put(h * 2, h === halves - 1 ? span - h * 2 : 2, halves > 1 && h === halves - 1 ? approach : seq[h % 3]);
    }
    if (kind === 'bossa')
      for (let h = 0; h < span - 1e-6; h += 2) {
        put(h, 1.5, r);
        put(h + 1.5, 0.5, r + 7, v - 10);
      }
    if (kind === 'pedal') put(0, span, r);
    if (kind === 'stop') put(0, 0.9, r, v + 8);
    if (kind === 'riff')
      for (let h = 0; h < span - 1e-6; h += 4) {
        if (Math.round((at + h - this.warpFrom) / 4) % 2) {
          put(h, 3.5, r);
          continue;
        }
        put(h, 1, r);
        put(h + 1.5, 0.5, r);
        put(h + 2, 0.5, r + 3);
        put(h + 2.5, 0.5, r + 5);
        put(h + 3, 0.5, r + 7);
        put(h + 3.5, 0.5, r + 10);
      }
  }

  /** One bar of drums (`accents`: where the lead's accents fall, for the shout's kicks). */
  private drumBar(kind: Drums, at: number, _bpb: number, j: number, fill: boolean, crash: boolean, accents: number[], vel: number, c: Chord): void {
    const d = (ch: number, t: number, v: number, n?: number) => this.drum(ch, at + t, Math.round((v * vel) / 100), n);
    const ride = (v: number, skip = crash) => [0, 1, 1.5, 2, 3, 3.5].forEach((t, i) => (skip && t === 0 ? 0 : d(DRUM.cymbal, t, [v, v + 4, v - 26, v, v + 4, v - 26][i])));
    if (crash) this.crash(at, Math.round((122 * vel) / 100));
    const timp = fold(c.pc, 38);
    switch (kind) {
      case 'ride':
      case 'bebop':
        ride(kind === 'ride' ? 76 : 70);
        d(DRUM.hat, 1, 62);
        d(DRUM.hat, 3, 62);
        [0, 2].forEach((t) => d(DRUM.kick, t, 28));
        if (kind === 'bebop') {
          [[1.5], [0.5, 2.5], [3.5], [1.5, 3]][j % 4].forEach((t) => d(DRUM.snare, t, 48));
          if (j % 4 === 3) d(DRUM.kick, 3.5, 78);
        } else if (j % 2) d(DRUM.snare, 2.5, 34);
        if (fill) {
          [2, 2.5, 3, 3.5].forEach((t, i) => d(DRUM.snare, t, 50 + i * 10));
          d(DRUM.tom, 3.5, 70);
          d(DRUM.kick, 3.5, 70);
        }
        break;
      case 'brush':
        for (let t = 0; t < 4; t += 0.5) d(DRUM.snare, t, t === 1 || t === 3 ? 62 : 32);
        d(DRUM.hat, 1, 50);
        d(DRUM.hat, 3, 50);
        d(DRUM.kick, 0, 30);
        if (j % 2 === 0) d(DRUM.cymbal, 0, 40);
        break;
      case 'waltz':
        [0, 1, 1.5, 2].forEach((t, i) => d(DRUM.cymbal, t, [64, 60, 38, 60][i]));
        d(DRUM.hat, 1, 46);
        d(DRUM.hat, 2, 46);
        d(DRUM.kick, 0, 30);
        d(DRUM.snare, 2, j % 2 ? 40 : 28);
        if (fill) [1.5, 2, 2.5].forEach((t, i) => d(DRUM.snare, t, 44 + i * 10));
        break;
      case 'bossa':
        (j % 2 ? [1, 2.5] : [0, 1.5, 3]).forEach((t) => d(DRUM.snare, t, 64));
        for (let t = 0; t < 4; t += 0.5) d(DRUM.hat, t, t % 1 ? 34 : 46);
        [0, 1.5, 2, 3.5].forEach((t, i) => d(DRUM.kick, t, i % 2 ? 40 : 58));
        break;
      case 'shout':
        ride(86);
        d(DRUM.hat, 1, 66);
        d(DRUM.hat, 3, 66);
        d(DRUM.kick, 0, 50);
        d(DRUM.kick, 2, 44);
        accents.forEach((t) => {
          d(DRUM.snare, t, 92);
          if (t > 0) d(DRUM.kick, t, 80);
        });
        if (fill) [3, 3.25, 3.5, 3.75].forEach((t, i) => d(DRUM.snare, t, 60 + i * 12));
        break;
      case 'march':
        [0, 1, 2, 3].forEach((t) => d(DRUM.snare, t, t % 2 ? 56 : 70));
        d(DRUM.snare, 3.5, 50);
        d(DRUM.snare, 3.75, 58);
        d(DRUM.kick, 0, 92);
        d(DRUM.kick, 2, 80);
        d(DRUM.tom, 0, 84, timp);
        d(DRUM.tom, 2, 70, timp + 7 > 52 ? timp - 5 : timp + 7);
        if (fill) for (let t = 2; t < 4 - 1e-6; t += 1 / 6) d(DRUM.tom, t, 50 + (t - 2) * 30, timp);
        break;
      case 'noir':
        ride(54);
        d(DRUM.hat, 1, 46);
        d(DRUM.hat, 3, 46);
        if (j % 2 === 0) d(DRUM.tom, 0, 58, 41);
        else d(DRUM.snare, 3, 44);
        break;
      case 'shuffle':
        for (let t = 0; t < 4; t += 0.5) d(DRUM.cymbal, t, t % 1 ? 44 : 64);
        d(DRUM.snare, 1, 64);
        d(DRUM.snare, 3, 64);
        d(DRUM.hat, 1, 50);
        d(DRUM.hat, 3, 50);
        d(DRUM.kick, 0, 44);
        d(DRUM.kick, 2, 38);
        if (fill) {
          d(DRUM.snare, 3.5, 60);
          d(DRUM.tom, 3.5, 60, 43);
        }
        break;
      case 'snap':
        d(DRUM.hat, 1, 104);
        d(DRUM.hat, 3, 104);
        [0, 0.5, 1.5, 2, 2.5, 3.5].forEach((t, i) => d(DRUM.tom, t, [64, 44, 50, 60, 44, 50][i], [69, 62, 62, 69, 62, 62][i]));
        d(DRUM.kick, 0, 36);
        break;
      case 'stop':
        d(DRUM.kick, 0, 96);
        d(DRUM.snare, 0, 80);
        d(DRUM.hat, 1, 60);
        d(DRUM.hat, 3, 60);
        if (fill) [2, 2.5, 3, 3.5].forEach((t, i) => d(DRUM.snare, t, 56 + i * 12));
        break;
      case 'none':
        break;
    }
  }

  /** A timpani roll (the tom tuned to `n`) and the ride's swish swelling over `beats` up to the next section. */
  roll(n: number, beats: number, vel = 116): this {
    const at = this.beat - beats;
    this.fx.drumRoll(DRUM.tom, at, beats, 1 / 6, 30, vel, [n]);
    this.fx.drumRoll(DRUM.cymbal, at, beats, 1 / 4, 16, vel - 30);
    return this;
  }

  /** Bars of silence (a dramatic pause). */
  pause(bars: number): this {
    this.beat += bars * 4;
    return this;
  }

  cmf(): Uint8Array {
    const bars = this.beat / 4;
    if (!Number.isInteger(bars)) throw new Error(`The song ends mid-bar (${bars})`);
    return this.fx.cmf(bars);
  }
}

// ---- the gags -----------------------------------------------------------------------------

/** The office chair squeaks: a high slide up and a stutter, on the twin's channel (a vibes patch for once). */
const squeak = (bars: number[]) => (a: Arranger, at: number) => {
  for (const b of bars) {
    const t = at + b * 4 + 2;
    a.fx.program(TWIN, t, CELESTA);
    const end = a.fx.slide(TWIN, t, 86, 90, 2, 70);
    a.fx.stutter(TWIN, end, 89, 3, 1 / 6, 64);
  }
};

/** The self-checkout: beep, beep, and the low bonk of the unexpected item in the bagging area. */
const beeps = (bar: number) => (a: Arranger, at: number) => {
  const t = at + bar * 4;
  a.fx.program(TWIN, t, CELESTA);
  a.fx.note(TWIN, t, 0.4, 88, 96).note(TWIN, t + 0.5, 0.4, 88, 96).note(TWIN, t + 1.5, 1.2, 64, 104);
  a.fx.note(TWIN, t + 3, 0.4, 88, 80);
};

/** The bee: a fast buzzing trill flying off over the band. */
const bee = (bar: number) => (a: Arranger, at: number) => {
  const t = at + bar * 4;
  for (let k = 0; k < 16; k++) a.fx.note(TWIN, t + k / 8, 1 / 8, k % 2 ? 78 : 79 + Math.floor(k / 4), 60 - k * 2, 0.9);
};

/** The fanfare: the timpani rolling up out of nothing, then the brass's "ta-ta-ta TAAA" with a crash. */
function fanfare(a: Arranger, key: string, pick: string, land: string): void {
  const r = PC[key];
  a.section({ name: 'fanfare', chords: [key, key], tune: ['r w', `${pick} t!, ${pick} t!, ${pick} t!, ${land} h.!`] }, { lead: BRASS, twin: 'below', twinPatch: BRASS, comp: 'shout', compPatch: BRASS, bass: 'pedal', drums: 'none', fill: false });
  a.fx.drumRoll(DRUM.tom, a.beat - 8, 4, 1 / 6, 24, 112, [fold(r, 38)]);
  a.fx.drumRoll(DRUM.cymbal, a.beat - 8, 4, 1 / 4, 12, 90);
  a.crash(a.beat - 3, 124);
  a.fx.note(DRUM.kick, a.beat - 3, 0.5, 36, 110);
  a.fx.note(DRUM.tom, a.beat - 3, 0.5, fold(r, 38), 110);
}

/** The sad trombone: wah, wah, wah, wahhh (the last one wobbling). */
function trombone(a: Arranger): void {
  a.section({ name: 'wah wah', chords: ['Cm', 'Cm'], tune: ['G4 q, F#4 q, F4 q, ~E4 q', 'E4 h., _ q\\\\\\'] }, { lead: BRASS, twin: 'below', twinPatch: BRASS, comp: 'none', compPatch: RHODES, bass: 'none', drums: 'none', fill: false, vel: 104 });
  a.fx.note(BASSCH, a.beat - 8, 3, 43, 90).note(BASSCH, a.beat - 5, 4.5, 40, 96);
}

/** The bows: three big chords, the cymbal and the timpani on each. */
function bows(a: Arranger, sec: Sec): void {
  a.section(sec, { lead: BRASS, twin: 'below', twinPatch: BRASS, comp: 'shout', compPatch: BRASS, bass: 'stop', drums: 'none', fill: false, vel: 112 });
  const at = a.beat - 8;
  for (const t of [0, 2, 4]) {
    a.crash(at + t, 122);
    a.fx.note(DRUM.kick, at + t, 0.5, 36, 110);
  }
  a.roll(41, 2, 110);
}

// ---- the songs ----------------------------------------------------------------------------

const swing = 0.64;

/** Office (A Totally Normal Meeting and the rest of the workday): the head on muted trumpet with brushes, the chair squeaking in its rests; then the vibes with the trumpet a chord tone under them. */
function office(): Uint8Array {
  const a = new Arranger(140);
  a.section(OFFICE, { lead: MUTE, comp: 'charleston', compPatch: PIANO, bass: 'walk', drums: 'brush', swing, extra: squeak([3, 11]) });
  a.section(OFFICE, { lead: VIBES, twin: 'harm', twinPatch: MUTE, comp: 'red', compPatch: PIANO, bass: 'walk', drums: 'ride', swing });
  return a.cmf();
}

/** Shop (the self-checkout): bossa nova, flute and nylon guitar, the beeps in the last bar; then vibes with the flute over them. */
function shop(): Uint8Array {
  const a = new Arranger(136);
  a.section(SHOP, { lead: FLUTE, up: 0, comp: 'bossa', compPatch: GUITAR, bass: 'bossa', drums: 'bossa', extra: beeps(15) });
  a.section(SHOP, { lead: VIBES, twin: 'harm', twinPatch: FLUTE, comp: 'bossa', compPatch: GUITAR, bass: 'bossa', drums: 'bossa', extra: beeps(15) });
  return a.cmf();
}

/** Home (the stolen blanket): the ballad in half time on tenor sax, brushes, rolled Rhodes chords; the vibes join a chord tone under it. */
function home(): Uint8Array {
  const a = new Arranger(122.64);
  a.section(slice(HOME, 0, 8), { lead: TENOR, comp: 'roll', compPatch: RHODES, bass: 'two', drums: 'brush', stretch: 2, swing: 0.6, vel: 96 });
  a.section(slice(HOME, 8), { lead: TENOR, twin: 'harm', twinPatch: VIBES, comp: 'roll', compPatch: RHODES, bass: 'two', drums: 'brush', stretch: 2, swing: 0.6, vel: 98 });
  return a.cmf();
}

/** Outside: swing, AABA (clarinet; clarinet and tenor; the bridge on muted trumpet; clarinet with the brass under it). */
function outside(): Uint8Array {
  const a = new Arranger(168);
  const s = 0.62;
  a.section(OUTSIDE, { lead: CLARINET, comp: 'charleston', compPatch: PIANO, bass: 'walk', drums: 'ride', swing: s });
  a.section(OUTSIDE, { lead: CLARINET, twin: 'below', twinPatch: TENOR, comp: 'charleston', compPatch: PIANO, bass: 'walk', drums: 'ride', swing: s });
  a.section(BRIDGE, { lead: MUTE, comp: 'red', compPatch: PIANO, bass: 'walk', drums: 'ride', swing: s });
  a.section(OUTSIDE, { lead: CLARINET, twin: 'harm', twinPatch: BRASS, comp: 'charleston', compPatch: PIANO, bass: 'walk', drums: 'ride', swing: s, crash: true });
  return a.cmf();
}

/** Epic: noir first (muted trumpet, strings, a soft ride and the low tom), then pompous (brass and trombones, the pipe organ swelling, a march, the timpani). */
function epic(): Uint8Array {
  const a = new Arranger(89.09);
  a.section({ name: 'storm', chords: ['Dm'], tune: ['r w'] }, { lead: MUTE, comp: 'swell', compPatch: PIPE, bass: 'pedal', drums: 'none', fill: false, vel: 90 });
  a.roll(38, 4, 100);
  a.section(EPIC, { lead: MUTE, comp: 'pad', compPatch: STRINGS, bass: 'two', drums: 'noir', swing: 0.6, vel: 94 });
  a.section(EPIC, { lead: BRASS, twin: 'below', twinPatch: BRASS, comp: 'swell', compPatch: PIPE, bass: 'pedal', drums: 'march', crash: true, vel: 108 });
  return a.cmf();
}

/** Chase: bebop at 216, trumpet and tenor in octaves; the vibes; then stop-time and the head again. */
function chase(): Uint8Array {
  const a = new Arranger(216);
  const s = 0.58;
  a.section(CHASE, { lead: BRASS, twin: 'below', twinPatch: TENOR, comp: 'red', compPatch: PIANO, bass: 'walk', drums: 'bebop', swing: s });
  a.section(CHASE, { lead: VIBES, comp: 'charleston', compPatch: PIANO, bass: 'walk', drums: 'bebop', swing: s });
  a.section(slice(CHASE, 0, 4), { lead: BRASS, twin: 'below', twinPatch: TENOR, comp: 'stop', compPatch: BRASS, bass: 'stop', drums: 'stop', swing: s, crash: true });
  a.section(slice(CHASE, 4), { lead: BRASS, twin: 'below', twinPatch: TENOR, comp: 'red', compPatch: PIANO, bass: 'walk', drums: 'bebop', swing: s });
  return a.cmf();
}

/** Blues (the coffee goat): the slow torch blues, tenor sax first, then the muted trumpet with the tenor under it. */
function blues(): Uint8Array {
  const a = new Arranger(66);
  a.section(BLUES, { lead: TENOR, comp: 'blues', compPatch: RHODES, bass: 'walk', drums: 'shuffle', swing: 0.667, vel: 96 });
  a.section(BLUES, { lead: MUTE, twin: 'harm', twinPatch: TENOR, comp: 'blues', compPatch: RHODES, bass: 'walk', drums: 'shuffle', swing: 0.667, vel: 98 });
  return a.cmf();
}

/** Triumph: the shout chorus, trumpets over the saxes' block chords with the drums kicking every accent; then the clarinet on top. */
function triumph(): Uint8Array {
  const a = new Arranger(179.44);
  a.section(TRIUMPH, { lead: BRASS, comp: 'shout', compPatch: TENOR, bass: 'walk', drums: 'shout', swing: 0.6, crash: true, vel: 104 });
  a.section(TRIUMPH, { lead: CLARINET, up: 12, twin: 'below', twinPatch: BRASS, comp: 'shout', compPatch: BRASS, bass: 'walk', drums: 'shout', swing: 0.6, crash: true, vel: 104 });
  return a.cmf();
}

const strollMute: Style = { lead: MUTE, comp: 'red', compPatch: PIANO, bass: 'walk', drums: 'snap', swing };
const strollVibes: Style = { lead: VIBES, twin: 'harm', twinPatch: MUTE, comp: 'charleston', compPatch: PIANO, bass: 'walk', drums: 'ride', swing };

/** Title: the fanfare, then the Sweatpants Stroll (muted trumpet and the finger snaps; the vibes). */
function title(): Uint8Array {
  const a = new Arranger(120);
  fanfare(a, 'F', 'C5', 'F5');
  a.section(STROLL, strollMute);
  a.section(STROLL, strollVibes);
  return a.cmf();
}

/** Story: the Stroll as a ballad on the vibes, then the home ballad's first half on tenor. */
function story(): Uint8Array {
  const a = new Arranger(96);
  a.section(STROLL, { lead: VIBES, comp: 'roll', compPatch: RHODES, bass: 'two', drums: 'brush', swing: 0.6, vel: 92 });
  a.section(slice(HOME, 0, 8), { lead: TENOR, comp: 'roll', compPatch: RHODES, bass: 'two', drums: 'brush', swing: 0.6, vel: 92 });
  return a.cmf();
}

/** Won: the fanfare and the shout chorus, the clarinet over the brass for the last eight. */
function won(): Uint8Array {
  const a = new Arranger(179.44);
  fanfare(a, 'D', 'A4', 'D5');
  a.section(TRIUMPH, { lead: BRASS, comp: 'shout', compPatch: TENOR, bass: 'walk', drums: 'shout', swing: 0.6, crash: true, vel: 106 });
  a.section(slice(TRIUMPH, 8), { lead: CLARINET, up: 12, twin: 'below', twinPatch: BRASS, comp: 'shout', compPatch: BRASS, bass: 'walk', drums: 'shout', swing: 0.6, vel: 106 });
  return a.cmf();
}

/** Lost: the sad trombone, then the torch blues on muted trumpet. */
function lost(): Uint8Array {
  const a = new Arranger(66);
  trombone(a);
  a.section(BLUES, { lead: MUTE, comp: 'blues', compPatch: RHODES, bass: 'walk', drums: 'shuffle', swing: 0.667, vel: 92 });
  return a.cmf();
}

/** The Hive: the bee's bossa (flute, then vibes and flute), the bee buzzing off, then the Stroll as a bossa in C. */
function hive(): Uint8Array {
  const a = new Arranger(120);
  a.section(BUZZ, { lead: FLUTE, comp: 'bossa', compPatch: GUITAR, bass: 'bossa', drums: 'bossa', extra: bee(7) });
  a.section(BUZZ, { lead: VIBES, twin: 'harm', twinPatch: FLUTE, comp: 'bossa', compPatch: GUITAR, bass: 'bossa', drums: 'bossa' });
  a.section(STROLL, { lead: FLUTE, comp: 'bossa', compPatch: GUITAR, bass: 'bossa', drums: 'bossa', shift: -5, up: 12, extra: bee(7) });
  return a.cmf();
}

/** Intermission 1, cool: the beatnik snap, AABA (flute; vibes; up a half step with both; flute). */
function inter1(): Uint8Array {
  const a = new Arranger(132);
  const st: Style = { lead: FLUTE, comp: 'sowhat', compPatch: PIANO, bass: 'riff', drums: 'snap', swing };
  a.section(SNAP, st);
  a.section(SNAP, { ...st, lead: VIBES });
  a.section(SNAP, { ...st, shift: 1, twin: 'harm', twinPatch: VIBES });
  a.section(SNAP, st);
  return a.cmf();
}

/** Intermission 2, mellow: the home ballad on muted trumpet, piano rolls and brushes. */
function inter2(): Uint8Array {
  const a = new Arranger(72);
  a.section(HOME, { lead: MUTE, comp: 'roll', compPatch: PIANO, bass: 'two', drums: 'brush', swing: 0.6, vel: 94 });
  return a.cmf();
}

/** Intermission 3, wistful: the last-call waltz (vibes, then the flute with the vibes under it). */
function inter3(): Uint8Array {
  const a = new Arranger(132);
  a.section(WALTZ, { lead: VIBES, comp: 'waltz', compPatch: PIANO, bass: 'walk', drums: 'waltz', swing: 0.6 });
  a.section(WALTZ, { lead: FLUTE, twin: 'harm', twinPatch: VIBES, comp: 'waltz', compPatch: PIANO, bass: 'walk', drums: 'waltz', swing: 0.6 });
  return a.cmf();
}

/** The curtain call: the fanfare, the Stroll for big band (twice), the shout chorus, the bows. */
function finale(): Uint8Array {
  const a = new Arranger(160);
  fanfare(a, 'F', 'C5', 'F5');
  a.section(STROLL, { lead: BRASS, comp: 'shout', compPatch: TENOR, bass: 'walk', drums: 'shout', swing: 0.62, crash: true, vel: 104 });
  a.section(STROLL, { lead: CLARINET, up: 12, twin: 'below', twinPatch: BRASS, comp: 'shout', compPatch: BRASS, bass: 'walk', drums: 'shout', swing: 0.62, vel: 104 });
  a.section(TRIUMPH, { lead: BRASS, comp: 'shout', compPatch: TENOR, bass: 'walk', drums: 'shout', swing: 0.62, crash: true, vel: 106 });
  bows(a, { name: 'bows', chords: ['D', 'A7 D'], tune: ['D6 q!, r q, D6 q!, r q', 'C#6 q!, r q, D6 h!'] });
  return a.cmf();
}

/** The menu: the whole score at one tempo (132), each song's head in turn. */
function menu(): Uint8Array {
  const a = new Arranger(132);
  a.section(STROLL, strollMute);
  a.section(slice(OFFICE, 0, 8), { lead: MUTE, comp: 'charleston', compPatch: PIANO, bass: 'walk', drums: 'brush', swing, extra: squeak([3]) });
  a.section(slice(SHOP, 0, 8), { lead: FLUTE, comp: 'bossa', compPatch: GUITAR, bass: 'bossa', drums: 'bossa' });
  a.section(slice(HOME, 0, 4), { lead: TENOR, comp: 'roll', compPatch: RHODES, bass: 'two', drums: 'brush', stretch: 2, swing: 0.6, vel: 96 });
  a.section(OUTSIDE, { lead: CLARINET, comp: 'charleston', compPatch: PIANO, bass: 'walk', drums: 'ride', swing: 0.62 });
  a.section(EPIC, { lead: BRASS, twin: 'below', twinPatch: BRASS, comp: 'swell', compPatch: PIPE, bass: 'pedal', drums: 'march', crash: true, vel: 106 });
  a.section(CHASE, { lead: BRASS, comp: 'red', compPatch: PIANO, bass: 'walk', drums: 'ride', swing: 0.6 });
  a.section(BLUES, { lead: TENOR, comp: 'blues', compPatch: RHODES, bass: 'walk', drums: 'shuffle', swing: 0.667, vel: 96 });
  a.section(slice(TRIUMPH, 8), { lead: BRASS, comp: 'shout', compPatch: TENOR, bass: 'walk', drums: 'shout', swing: 0.6, crash: true, vel: 104 });
  return a.cmf();
}

const SONGS: Record<SongName, () => Uint8Array> = { office, shop, home, outside, epic, chase, blues, triumph, title, menu, story, won, lost, hive, inter1, inter2, inter3, finale };

export function buildSongs(): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  for (const n of [...LEVEL_SONGS, ...SCREEN_SONGS]) out[n] = SONGS[n]();
  return out;
}
