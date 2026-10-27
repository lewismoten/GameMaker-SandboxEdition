// The soundtrack: "Mustard Seed Hustle" (The Bard of Bizarre, 1995) arranged for the Sound
// Blaster's OPL2 FM chip as Creative Music Files, in rhythm mode (games/kit/song.ts writes the
// bars: tune, second voice, bass, three comping voices and drums).
//
// The notes come from games/mustard/tools/analyze.py run over the recording (which is not in
// the repo): 95 BPM, A major, chords on A, D, E(7), F#m and Bm. The first verse sits on the
// recording's bar lines; from the chorus on, the chords change two beats later (the song slips
// half a bar at "workin' overtime"), so every section after it starts where its chords do:
//   intro                              0.0 -  9.0   A, the E7 turnaround
//   verse 1 "They told me 'bout..."    9.0 - 29.2   A | E | A | A | A | D | E | A
//   chorus "Oh, it's the mustard..."  29.2 - 49.1   (A D) A | D | F#m | E | D | E7 | E7 | A
//   verse 2 "It don't shout..."       49.1 - 71.8   A | E | E | E | A | D | D A | A
//   chorus again                      71.8 - 92.5
//   bridge "So don't you..."          92.5 - 111.3  E | D | F#m | Bm E7 | A | D | E | A
//   last chorus "Yes, the mustard..."111.3 - 121.5  D | A | Bm | E
//   "Hallelujah, keep the mustard seed hustle alive!"  121.5 - 131.5  D | E | A
// The tune is the sung line's pitch per word (harmonic salience on the center channel, per
// eighth note), evened out to the syllables.
import { INSTRUMENTS } from '../../../kit/music';
import { CELESTA, EPIANO, FLUTE, ORGAN, REED, VOICE, Writer, ending, slice, vamp, type Part, type Section } from '../../../kit/song';

const BPM = 95;

// ---- the song's material ------------------------------------------------------------------

/** "They told me 'bout the mustard seed, so tiny and so small, / The smallest thing in all the land, but it can grow tall. / But here I am, just sittin' still, waitin' for a sign, / While that little seed's been hustlin', workin' overtime!" The bar before it holds "They told me". */
const VERSE1: Section = {
  chords: ['A', 'E', 'A', 'A', 'A', 'D', 'E', 'A'],
  tune: [
    'A4 q, F#4 e, F#4 e, A4 e, F#4 e, A4 e, B4 e', // 'bout the mus-tard seed, so ti-
    'B4 e, B4 e, B4 e, C#5 q., G#4 e, C#5 e', // -ny and so small. The small-
    'E5 e, E5 e, C#5 e, B4 e, A4 e, A4 e, C#5 e, C#5 e', // -est thing in all the land, but it
    'C#5 e, B4 e, A4 q, F#4 e, F#4 e, A4 e, A4 e', // can grow tall. But here I am,
    'r e, C#5 e, C#5 e, C#5 e, r e, A4 q, E4 e', // just sit-tin' still, wait-
    'E4 e, F#4 e, A4 e, B4 e, A4 e, A4 e, B4 e, C#5 e', // -in' for a sign, while that lit-tle
    'C#5 e, C#5 e, C#5 e, G#4 q., r e, B4 e', // seed's been hus-tlin', work-
    'B4 e, A4 s, A4 s, A4 h.', // -in' o-ver-time!
  ],
};

/** "Oh, it's the mustard seed hustle," (the bar before the chorus). */
const PICKUP = 'E5 e, C#5 s, B4 s, A4 e, A4 e, A4 q, A4 e, A4 e';

/** "...movin' slow but sure. / Faith in the smallest things, that's the only cure! / When life feels like a mountain, and you're feelin' beat, / Remember the mustard seed's got the greatest feet!" The last bar is the next line's pickup. */
const CHORUS: Section = {
  chords: ['A', 'D', 'F#m', 'E', 'D', 'E7', 'E7', 'A'],
  tune: [
    'r q, C#5 e, C#5 e, C#5 e, C#5 e, E5 q', // mo-vin' slow but sure.
    'r q., D5 e, D5 e, D5 e, D5 e, C#5 e', // Faith in the small-est
    'B4 q, r e, B4 e, A4 e, B4 e, B4 e, C#5 e', // things, that's the on-ly cure.
    'r e, B4 e, B4 e, C#5 e, B4 e, B4 e, B4 e, B4 e', // When life feels like a moun-tain,
    'r q, A4 e, A4 e, D5 q, D5 e, C#5 e', // and you're feel-in' beat,
    'C#5 q, E5 e, B4 e, B4 e, B4 e, B4 e, A4 e', // re-mem-ber the mus-tard
    'A4 e, G#4 e, C#5 e, C#5 e, C#5 e, A4 q.', // seed's got the great-est feet!
    'A4 h, r q, r e, E4 e', // It
  ],
};

/** "It don't shout, it don't brag, it don't make a fuss, / Just quietly pushin' roots deep down in the dust. / While we're lookin' for miracles, big and loud and grand, / That mustard seed's growin' strong in the palm of God's hand." */
const VERSE2: Section = {
  chords: ['A', 'E', 'E', 'E', 'A', 'D', 'D A', 'A'],
  tune: [
    'A4 e, A4 q, F#4 e, A4 e, F#4 q, r e', // don't shout, it don't brag,
    'A4 e, B4 e, B4 e, B4 e, C#5 q, r q', // it don't make a fuss,
    'G#4 e, C#5 e, C#5 e, B4 e, A4 e, A4 e, F#4 q', // just qui-et-ly push-in' roots
    'G#4 e, F#4 e, E4 e, E4 e, F#4 h', // deep down in the dust.
    'F#4 e, A4 e, A4 e, C#5 e, C#5 e, C#5 e, B4 e, A4 e', // While we're look-in' for mir-a-cles,
    'D5 q, D5 e, D5 e, B4 e, A4 q.', // big and loud and grand,
    'B4 e, B4 e, B4 e, C#5 e, C#5 e, A4 e, F#4 q', // that mus-tard seed's grow-in' strong
    'F#4 e, F#4 e, A4 e, E4 e, C#5 e, B4 e, A4 q', // in the palm of God's hand.
  ],
};

/** "So don't you underestimate the little, the small, / That tiny seed's got power to conquer it all. / Keep on hustlin', keep the faith alive, / Even mustard seeds gotta thrive!" The last bar holds "Yes, the mus-". */
const BRIDGE: Section = {
  chords: ['E', 'D', 'F#m', 'Bm E7', 'A', 'D', 'E', 'A'],
  tune: [
    'A4 e, C#5 e, E5 e, E5 e, E5 e, C#5 e, B4 e, A4 e', // So don't you un-der-es-ti-mate
    'A4 q, r e, A4 e, E4 e, C#5 e, B4 q', // the lit-tle, the small,
    'r q, A4 e, F#4 e, F#4 e, F#4 e, F#4 e, F#4 e', // that ti-ny seed's got pow-
    'F#4 e, D4 e, E4 e, E4 e, r e, E4 e, C#5 q', // -er to con-quer it all!
    'r e, E4 e, F#4 e, A4 e, A4 q, E4 q', // Keep on hus-tlin', keep
    'E4 e, E4 e, F#4 e, B4 q., r e, F#4 e', // the faith a-live, E-
    'A4 e, A4 e, A4 e, B4 q., B4 e, C#5 e', // -ven mus-tard seeds got-ta
    'A4 h, F#4 e, r e, E4 e, E4 e', // thrive! Yes, the mus-
  ],
};

/** "...the mustard seed hustle's what we need to see, / Tiny faith can move mountains, just wait and believe!" */
const LAST: Section = {
  chords: ['D', 'A', 'Bm', 'E'],
  tune: [
    'E4 e, A4 q, A4 e, B4 e, C#5 e, C#5 q', // -tard seed hus-tle's what we
    'C#5 q, A4 e, E4 h, r e', // need to see,
    'C#5 e, C#5 e, D5 q, D5 e, D5 e, D5 e, C#5 e', // ti-ny faith can move moun-tains,
    'r e, B4 e, B4 q, E5 e, C#5 e, B4 q', // just wait and be-lieve!
  ],
};

/** "Hallelujah, keep the mustard seed hustle alive!" */
const HALLELUJAH: Section = {
  chords: ['D', 'E', 'A', 'A'],
  tune: [
    'A4 e, B4 e, C#5 e, E5 q., r q', // Hal-le-lu-jah,
    'E4 e, F#4 e, A4 e, A4 e, A4 e, B4 e, C#5 e, C#5 e', // keep the mus-tard seed hus-tle a-
    'E5 q., C#5 e, A4 h', // -live!
    'r w',
  ],
};

/** The band's opening: the hook on the horns over the E7 turnaround, and "They told me". */
const INTRO: Section = {
  chords: ['E7 A', 'A', 'A', 'A'],
  tune: [PICKUP, 'r q, C#5 e, C#5 e, C#5 e, C#5 e, E5 q', 'r w', 'r h, A4 e, r e, A4 e, A4 e'],
};

/** The pickup bar into a chorus, on the chord that leads there. */
const pickup = (chord: string): Section => ({ chords: [chord], tune: [PICKUP] });

// ---- the band -----------------------------------------------------------------------------

/** The gospel band: the singer on a reedy lead doubled by organ, organ comping on the offbeats, a pumping bass. */
const BAND = {
  lead: VOICE,
  second: 'double' as const,
  secondPatch: ORGAN,
  secondVel: 55,
  bass: 'pump' as const,
  comp: 'r e, x e, r e, x e, r e, x e, r e, x e',
  compPatch: ORGAN,
  compVel: 62,
};

const clap = (n: number, last = 'clapFill', first = 'clap') => [first, ...new Array(Math.max(0, n - 2)).fill('clap'), last];
const hop = (n: number, last = 'rockFill') => [...new Array(n - 1).fill('hop'), last];

// ---- the songs ----------------------------------------------------------------------------

/** Title: the band's two bars, then the chorus hook ("Oh, it's the mustard seed hustle, movin' slow but sure!") with a celesta on top. */
export function titleSong(): Uint8Array {
  const w = new Writer(BPM);
  w.part({ ...BAND, section: vamp(['E7 A', 'A'], 'r w'), drums: ['crash', 'clapFill'] });
  w.part({ ...BAND, section: pickup('A D'), drums: ['clap'] });
  w.part({ ...BAND, section: CHORUS, drums: clap(8, 'clapFill', 'crash') });
  w.part({ ...BAND, section: ending(pickup('E'), PICKUP), second: 'octave', secondPatch: CELESTA, secondVel: 50, drums: ['clap'] });
  w.part({ ...BAND, section: ending(CHORUS, 'A4 h, r h'), second: 'octave', secondPatch: CELESTA, secondVel: 50, drums: clap(8, 'clapFill', 'crash') });
  return w.cmf();
}

/** Story pages: verse 1, soft (flute over a music box, no drums until the second half). */
export function storySong(): Uint8Array {
  const w = new Writer(84);
  const soft: Omit<Part, 'section' | 'drums'> = {
    lead: FLUTE,
    up: 12,
    leadVel: 95,
    second: 'none',
    bass: 'whole',
    bassVel: 80,
    comp: 'x q, x q, x q, x q',
    compPatch: CELESTA,
    compVel: 45,
  };
  w.part({ ...soft, section: slice(INTRO, 3), comp: 'x w', compPatch: INSTRUMENTS.pad, drums: ['none'] });
  w.part({ ...soft, section: slice(VERSE1, 0, 4), drums: ['none'] });
  w.part({ ...soft, section: ending(slice(VERSE1, 4), 'B4 e, A4 s, A4 s, A4 q, r h'), drums: ['soft'], drumVel: 55 });
  return w.cmf();
}

/**
 * The four levels: verse 1 (the seed hops out of its mound), verse 2 (deep down in the dust),
 * the bridge and the last chorus (tiny faith can move mountains), and the chorus as a gospel
 * shout (up the tree to the palm of God's hand).
 */
export function levelSongs(): Uint8Array[] {
  // Level 1: verse 1 on a reed over electric piano and a bouncing kick.
  const one = new Writer(BPM);
  const l1: Omit<Part, 'section' | 'drums'> = { lead: REED, second: 'none', bass: 'pump', comp: 'x q, x q, x q, x q', compPatch: EPIANO, compVel: 58 };
  one.part({ ...l1, section: vamp(['A', 'A']), drums: ['hop', 'rockFill'] });
  one.part({ ...l1, section: { chords: ['A'], tune: [INTRO.tune[3]] }, drums: ['hop'] });
  one.part({ ...l1, section: VERSE1, drums: hop(8) });
  one.part({ ...l1, section: pickup('A D'), drums: ['hop'] });
  one.part({ ...l1, section: ending(CHORUS, 'A4 h, r h'), lead: VOICE, second: 'octave', secondPatch: INSTRUMENTS.bell, secondVel: 40, drums: hop(8) });

  // Level 2: verse 2 down in the dust: a low clarinet-ish reed, walking bass, a shuffle.
  const two = new Writer(BPM);
  const l2: Omit<Part, 'section' | 'drums'> = {
    lead: REED,
    leadVel: 115,
    second: 'double',
    secondPatch: INSTRUMENTS.pluck,
    secondVel: 55,
    bass: 'walk',
    comp: 'r e, x e, r e, x e, r e, x e, r e, x e',
    compPatch: ORGAN,
    compVel: 55,
  };
  two.part({ ...l2, section: vamp(['A', 'E']), drums: ['shuffle', 'rockFill'] });
  two.part({ ...l2, section: { chords: ['A'], tune: [CHORUS.tune[7]] }, drums: ['shuffle'] });
  two.part({ ...l2, section: VERSE2, drums: ['shuffle', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'rockFill'] });
  two.part({ ...l2, section: { chords: ['E'], tune: [CHORUS.tune[7]] }, drums: ['shuffle'] });
  two.part({
    ...l2,
    section: ending(VERSE2, 'F#4 e, F#4 e, A4 e, E4 e, C#5 e, B4 e, A4 q'),
    lead: INSTRUMENTS.brass,
    second: 'none',
    drums: ['crash', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'rockFill'],
  });

  // Level 3: the mountain: the bridge and the last chorus as a march, brass and strings.
  const three = new Writer(BPM);
  const l3: Omit<Part, 'section' | 'drums'> = {
    lead: INSTRUMENTS.brass,
    leadVel: 118,
    second: 'double',
    secondPatch: INSTRUMENTS.strings,
    secondVel: 55,
    bass: 'half',
    bassVel: 100,
    comp: 'x q, r q, x q, r q',
    compPatch: INSTRUMENTS.strings,
    compVel: 55,
  };
  three.part({ ...l3, section: vamp(['E', 'E']), drums: ['march'] });
  three.part({ ...l3, section: BRIDGE, drums: ['march', 'march', 'march', 'rockFill', 'march', 'march', 'march', 'rockFill'] });
  three.part({ ...l3, section: LAST, lead: VOICE, drums: ['crash', 'march', 'march', 'rockFill'] });
  three.part({ ...l3, section: { chords: ['A', 'A'], tune: ['A4 w', 'r w'] }, lead: VOICE, drums: ['half', 'rockFill'] });

  // Level 4: the chorus as a gospel shout: organ, claps, the singer doubled by a bell.
  const four = new Writer(BPM);
  four.part({ ...BAND, section: vamp(['A', 'A']), drums: ['clap', 'clapFill'] });
  four.part({ ...BAND, section: pickup('A D'), drums: ['clap'] });
  four.part({ ...BAND, section: ending(CHORUS, 'A4 h, r h'), drums: clap(8) });
  four.part({ ...BAND, section: pickup('E'), lead: INSTRUMENTS.lead, drums: ['clap'] });
  four.part({
    ...BAND,
    section: ending(CHORUS, 'A4 h, r h'),
    lead: INSTRUMENTS.lead,
    second: 'octave',
    secondPatch: INSTRUMENTS.bell,
    secondVel: 45,
    drums: clap(8, 'clapFill', 'crash'),
  });
  return [one.cmf(), two.cmf(), three.cmf(), four.cmf()];
}

/** Won: the last chorus ("Tiny faith can move mountains, just wait and believe!") into "Hallelujah, keep the mustard seed hustle alive!" */
export function wonSong(): Uint8Array {
  const w = new Writer(BPM);
  w.part({ ...BAND, section: { chords: ['A'], tune: [BRIDGE.tune[7]] }, drums: ['clapFill'] });
  w.part({ ...BAND, section: LAST, drums: ['crash', 'clap', 'clap', 'clapFill'] });
  w.part({ ...BAND, section: HALLELUJAH, comp: 'x h, x h', compPatch: INSTRUMENTS.strings, drums: ['crash', 'clap', 'half', 'none'] });
  return w.cmf();
}

/** Lost: the hook, slow, in A minor, sinking back into the dirt. */
export function lostSong(): Uint8Array {
  const w = new Writer(72);
  w.part({
    section: { chords: ['Am', 'Dm', 'E7', 'Am'], tune: ['r q, C5 e, C5 e, C5 e, C5 e, E5 q', 'D5 h., C5 q', 'B4 q, A4 q, G#4 q, E4 q', 'A4 w'] },
    lead: FLUTE,
    up: 0,
    leadVel: 95,
    second: 'none',
    bass: 'whole',
    bassVel: 80,
    comp: 'x w',
    compPatch: INSTRUMENTS.strings,
    compVel: 55,
    drums: ['none', 'none', 'none', 'soft'],
    drumVel: 60,
  });
  return w.cmf();
}

/** The menu: the whole song in order, intro to "Hallelujah". */
export function wholeSong(): Uint8Array {
  const w = new Writer(BPM);
  w.part({
    ...BAND,
    section: INTRO,
    lead: INSTRUMENTS.brass,
    second: 'none',
    comp: 'x w',
    compPatch: INSTRUMENTS.pad,
    bass: 'whole',
    drums: ['crash', 'half', 'half', 'clapFill'],
  });
  w.part({ ...BAND, section: VERSE1, lead: REED, second: 'none', comp: 'x q, x q, x q, x q', compPatch: EPIANO, drums: hop(8) });
  w.part({ ...BAND, section: pickup('A D'), drums: ['clap'] });
  w.part({ ...BAND, section: CHORUS, drums: clap(8, 'clapFill', 'crash') });
  w.part({
    ...BAND,
    section: VERSE2,
    lead: REED,
    second: 'none',
    bass: 'walk',
    drums: ['shuffle', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'rockFill'],
  });
  w.part({ ...BAND, section: pickup('E'), drums: ['clap'] });
  w.part({ ...BAND, section: ending(CHORUS, 'A4 h, r h'), second: 'octave', secondPatch: CELESTA, secondVel: 50, drums: clap(8, 'clapFill', 'crash') });
  w.part({
    ...BAND,
    section: BRIDGE,
    lead: INSTRUMENTS.brass,
    second: 'none',
    bass: 'half',
    comp: 'x q, r q, x q, r q',
    compPatch: INSTRUMENTS.strings,
    drums: ['march', 'march', 'march', 'rockFill', 'march', 'march', 'march', 'rockFill'],
  });
  w.part({ ...BAND, section: LAST, drums: ['crash', 'clap', 'clap', 'clapFill'] });
  w.part({ ...BAND, section: HALLELUJAH, comp: 'x h, x h', compPatch: INSTRUMENTS.strings, drums: ['crash', 'clap', 'half', 'none'] });
  return w.cmf();
}
