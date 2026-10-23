// The soundtrack: "Third Goat from the Left" (The Bard of Bizarre, 1995) arranged for the Sound
// Blaster's OPL2 FM chip as Creative Music Files, in rhythm mode (six melodic voices plus the
// chip's five drums).
//
// The notes come from games/goat/tools/analyze.py run over Lewis's recording (which is not in
// the repo): 120 BPM, downbeat 1.375 s, G major with the blues' F and Bb in the tune, and these
// sections (bars of 2 s from the downbeat; a pickup bar holds the line's first words):
//   intro "Oh Lord again... Yeah!"         0.0 - 15.4   G (Gm color), D7 at the turn
//   verse 1 "I was there that night..."   15.4 - 31.4   G | G | D | D | C | C | D | G
//   verse 2 "The donkey's in paintings..."31.4 - 47.4   G | G | C | D | D | D | C | G
//   chorus x2 "Third goat from the left"  47.4 - 79.4   (G pickup) C | G | G | D | C | D | G | G
//   bridge "The wise men strutted..."     79.4 - 95.4   G | G | D | D | C | C | D | D
//   spoken "Some say history forgets..."  97.4 - 117.4  G | C | G | D | C | C | D | D | Em
//   final chorus "I claim my space!"     119.4 - 145.4  G | C | G | D | G | G | C | D | Am | D | G
//   outro "He sees you..."               145.4 - 172    G | G | G | C | G | Em | D7 | C | G, then "Hey..."
// The melody is the sung line's pitch per word (harmonic salience on the center channel),
// written an octave up for the FM lead and evened out to eighth notes.
import { INSTRUMENTS } from '../../../kit/music';
import { CELESTA, EPIANO, FLUTE, ORGAN, OUD, REED, VOICE, Writer, chordTable, ending, slice, vamp, type Section } from '../../../kit/song';

// ---- the song's material ------------------------------------------------------------------

/** "Third goat from the left - forgotten but true! / I saw it all, from my front-stall pew. / No gifts of gold, no frankincense to give, / Just a bleat of joy and a will to live!" The last bar is the next pickup. */
const CHORUS: Section = {
  chords: ['C', 'G', 'G', 'D', 'C', 'D', 'G', 'G'],
  tune: [
    'G4 h, r e, G4 e, C5 e, G4 e', // left, for-got-ten but
    'G4 e, A4 e, G4 q, D4 e, G4 e, D4 e, D4 e', // true! I saw it all from my
    'B4 q, A4 q, G4 q, G4 q', // front-stall pew. No
    'A4 q, D5 q, A4 h', // gifts of gold,
    'D5 e, C5 e, C5 e, C5 e, A4 q, G4 e, A4 e', // no frank-in-cense to give, just a
    'D5 q, C5 q, A4 q, B4 q', // bleat of joy and a
    'D4 q, G4 q, G4 h', // will to live!
    'r q, r e, G4 e, G4 q, G4 e, E4 e', // Third goat from the
  ],
};

/** "I was there that night in Bethlehem, / Manger-side, behind the lambs. / The stars were bright, the angels loud, / But somehow I got missed in the crowd." The last bar carries the next "Oh, I..." pickup. */
const VERSE1: Section = {
  chords: ['G', 'G', 'D', 'D', 'C', 'C', 'D', 'G'],
  tune: [
    'r e, G4 e, G4 q, G4 q, F4 e, G4 e', // was there that night in Beth-
    'G4 q, D4 q, r q, A#4 q', // -le-hem, man-
    'D5 h., A#4 e, A4 e', // -ger-side, be-hind
    'F4 e, G4 q., r e, G4 e, A4 q', // the lambs. The stars
    'G4 e, C5 q., r e, G4 e, A#4 e, A4 e', // were bright, the an-gels
    'C5 q, r q, C5 q, D5 e, D5 e', // loud, but some-
    'D5 q, D5 e, D5 e, C5 q, G4 e, G4 e', // -how I got missed in the
    'G4 h, r e, G4 q, B4 e', // crowd. I was
  ],
};

/** "The donkey's in paintings, the ox gets praise, / Even pigeons got hymns these days. / But me? I stood there, chewing hay, / A holy birth just feet away." */
const VERSE2: Section = {
  chords: ['G', 'G', 'C', 'D', 'D', 'D', 'C', 'G'],
  tune: [
    'r q, r e, G4 e, G4 q, G4 e, F4 e', // The don-key's in
    'G4 q, G4 q, r q, G4 e, F4 e', // paint-ings, the ox
    'G4 e, C5 q., r q, r e, D5 e', // gets praise, E-
    'D5 e, D5 e, D5 e, D5 q, C5 q, A#4 e', // -ven pi-geons got hymns these
    'A4 h, D5 q, D5 q', // days. But me?
    'G4 e, D4 e, D4 q, C4 e, D4 q.', // I stood there chew-ing hay,
    'r h, D4 e, E4 q.', // a ho-ly
    'G4 q., r e, A4 e, D5 e, D5 q', // birth just feet a-way.
  ],
};

/** "The wise men strutted with camel flair, / I offered Him wool, but no one cared. / I sneezed on Joseph, kicked a pail, / Yet somehow still, I made the tale!" */
const BRIDGE: Section = {
  chords: ['G', 'G', 'D', 'D', 'C', 'C', 'D', 'D'],
  tune: [
    'r q, G4 q, r e, G4 e, G4 e, G4 e', // The wise men strut-ted
    'r e, G4 e, G4 e, A4 e, A#4 h', // with cam-el flair,
    'r q, D5 e, A4 e, A4 e, G4 e, D4 q', // I of-fered Him wool,
    'G4 q, A#4 q, A4 e, G4 q.', // but no one cared.
    'r q, C5 e, E5 q, E5 e, G4 q', // I sneezed on Jo-
    'E4 q, r e, G4 e, F#4 e, E4 q.', // -seph, kicked a pail,
    'r q, D4 q, D4 e, D4 e, D4 q', // yet some-how still,
    'A4 q, A#4 e, G4 e, G4 h', // I made the tale!
  ],
};

/** The spoken section's progression ("Some say history forgets the humble...") with the speaker's pitches as a tune. */
const SPOKEN: Section = {
  chords: ['G', 'C', 'G', 'D', 'C', 'C', 'D', 'D', 'Em', 'G'],
  tune: [
    'r q, G4 h, G4 q', // Some say
    'r e, C5 q, G4 q., G4 e, A#4 e', // his-to-ry for-gets the hum-
    'r e, A#4 q., r e, D5 q.', // -ble. But
    'r q, D5 e, G4 q, C5 e, C5 e, A#4 e', // I saw we were the
    'G4 e, G4 h., r e', // wit-ness sec-tion.
    'r q, E4 h, E4 q', // We smelled
    'E4 e, F#4 q., D4 h', // like re-demp-tion,
    'r q, r e, A4 q, D5 q.', // al-so ma-nure.
    'r h, B4 e, G4 e, G4 q', // And we were
    'G4 w', // there.
  ],
};

/** "Third goat from the left! I claim my space! / In the gospel barnyard of time and grace. / Not all heroes bring myrrh or song, / Some just chew quietly... all night long. / ...all night long." */
const FINAL: Section = {
  chords: ['G', 'C', 'G', 'D', 'G', 'G', 'C', 'D', 'Am', 'D', 'G', 'C', 'G'],
  tune: [
    'G4 q., G4 q., G4 q', // Third goat from
    'E4 e, G4 q., G4 q, A4 q', // the left! I claim
    'B4 e, D5 q., r q, D4 e, E4 e', // my space! In the
    'G4 e, G4 q, G4 e, G4 q, E4 q', // gos-pel barn-yard of
    'E4 e, G4 q, D4 q, D4 q.', // time and grace.
    'r h, r q, B4 e, A4 e', // (fill)
    'G4 h, G4 e, E4 e, E4 e, A4 e', // Not all he-roes bring
    'G4 e, A4 e, G4 h.', // myrrh or song,
    'G4 q., C5 e, B4 q, G4 e, G4 e', // some just chew qui-et-
    'A4 e, A4 h, r e, G4 q', // -ly... all night
    'G4 w', // long.
    'r q, G4 h, B4 q', // All night
    'G4 w', // long.
  ],
};

/** "So if you feel missed, overlooked, ignored... / Remember the goat who stood by the Lord. / He sees you. / Even if you're... the third goat from the left." */
const OUTRO: Section = {
  chords: ['G', 'G', 'G', 'C', 'G', 'Em', 'D7', 'C', 'G'],
  tune: [
    'r h, r e, G4 q.', // So
    'D4 q, E4 q, D4 q., B4 e', // if you feel missed, o-
    'A4 e, G4 q, G4 e, G4 h', // -ver-looked, ig-nored...
    'D4 e, E4 e, E4 e, D4 e, C4 q, G4 q', // Re-mem-ber the goat who
    'r e, G4 e, G4 q, A4 e, G4 q.', // stood by the Lord.
    'G4 e, E4 e, E4 h, r q', // He sees you.
    'G4 e, G4 e, D4 q, D4 h', // E-ven if you're...
    'C5 q., A#4 q, G4 q, G4 e', // the third goat from the
    'G4 w', // left.
  ],
};

/** The intro's "Oh Lord again... Yeah!" over the G vamp with its Gm color. */
const INTRO: Section = {
  chords: ['G', 'G', 'G', 'G', 'G', 'C', 'D7', 'G'],
  tune: [
    'r q, r e, G4 e, G4 h', // Oh
    'r q, C5 q, A#4 q, G4 q', // Lord a-gain,
    'A#4 e, A#4 e, G4 h, r e, D4 e', // I guess not. Yet
    'D4 e, F4 q, A#4 e, G4 q, C5 q', // some... Yeah-
    'D5 q, D5 e, G4 e, G4 e, A#4 e, G4 q', // -ay-ay-ay-ay!
    'r w',
    'r h, r e, G5 q.', // Oh,
    'r h, r e, G4 q, B4 e', // I was
  ],
};

// ---- the band -----------------------------------------------------------------------------

/** Chord tones (low to high) around G3-E4, so three FM voices comp without crowding the tune. */
const VOICING: Record<string, string[]> = {
  G: ['G3', 'B3', 'D4'],
  C: ['G3', 'C4', 'E4'],
  D: ['F#3', 'A3', 'D4'],
  D7: ['F#3', 'C4', 'D4'],
  Em: ['G3', 'B3', 'E4'],
  Am: ['A3', 'C4', 'E4'],
  Gm: ['G3', 'A#3', 'D4'],
  Cm: ['G3', 'C4', 'D#4'],
};
/** Bass root and fifth (MIDI) per chord. */
const ROOT: Record<string, number> = { G: 43, C: 48, D: 50, D7: 50, Em: 40, Am: 45, Gm: 43, Cm: 48 };

/** The song's own voicings (kit/song.ts writes the bars). */
const CHORDS = chordTable(VOICING, ROOT);

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

// ---- the songs ----------------------------------------------------------------------------

/** Title: two bars of the band, then the chorus hook twice ("Third goat from the left - forgotten but true!"). */
export function titleSong(): Uint8Array {
  const w = new Writer(120, CHORDS);
  w.part({ ...BAND, section: vamp(['G', 'G'], 'r w'), drums: ['crash', 'rockFill'] });
  w.part({ ...BAND, section: { chords: ['G'], tune: [CHORUS.tune[7]] }, drums: ['rock'] });
  w.part({ ...BAND, section: CHORUS, drums: ['crash', 'rock', 'rock', 'rock', 'rock', 'rock', 'rock', 'rockFill'] });
  w.part({ ...BAND, section: ending(CHORUS, 'r w'), second: 'octave', secondPatch: CELESTA, secondVel: 50, drums: ['crash', 'rock', 'rock', 'rock', 'rock', 'rock', 'rock', 'rockFill'] });
  return w.cmf();
}

/** Menu: the chorus as a gentle instrumental (flute, celesta, soft bass, kick and a whisper of hi-hat). */
export function menuSong(): Uint8Array {
  const w = new Writer(100, CHORDS);
  const soft = { lead: FLUTE, up: 12, leadVel: 100, second: 'double' as const, secondPatch: CELESTA, secondVel: 45, bass: 'half' as const, bassVel: 85, comp: 'x h, x h', compPatch: INSTRUMENTS.pad, compVel: 50, drumVel: 70 };
  w.part({ ...soft, section: { chords: ['G'], tune: [CHORUS.tune[7]] }, drums: ['soft'] });
  w.part({ ...soft, section: CHORUS, drums: ['soft'] });
  w.part({ ...soft, section: ending(CHORUS, 'r w'), second: 'none', comp: 'x e, x e, x e, x e, x e, x e, x e, x e', compPatch: CELESTA, compVel: 40, drums: ['soft'] });
  return w.cmf();
}

/** Story pages: the soft intro and verse 1 ("I was there that night in Bethlehem"). */
export function storySong(): Uint8Array {
  const w = new Writer(100, CHORDS);
  const soft = { lead: FLUTE, up: 12, leadVel: 95, second: 'none' as const, bass: 'whole' as const, bassVel: 80, comp: 'x q, x q, x q, x q', compPatch: CELESTA, compVel: 45, drums: ['none'] };
  w.part({ ...soft, section: slice(INTRO, 0, 5), comp: 'x w', compPatch: INSTRUMENTS.pad });
  w.part({ ...soft, section: { chords: ['G', 'G'], tune: ['r w', INTRO.tune[7]] }, comp: 'x w', compPatch: INSTRUMENTS.pad });
  w.part({ ...soft, section: VERSE1, drums: ['soft'], drumVel: 55 });
  w.part({ ...soft, section: ending(VERSE1, 'G4 h, r h'), lead: REED, up: 0, second: 'octave', secondPatch: CELESTA, secondVel: 35, drums: ['soft'], drumVel: 55 });
  return w.cmf();
}

/** The four levels: verse 1, verse 2, the bridge and the spoken section, each its own band. */
export function levelSongs(): Uint8Array[] {
  // Level 1: verse 1 on a reed over electric piano and a straight rock beat.
  const one = new Writer(120, CHORDS);
  const l1 = { lead: REED, second: 'none' as const, bass: 'pump' as const, comp: 'x q, x q, x q, x q', compPatch: EPIANO, compVel: 58 };
  one.part({ ...l1, section: VERSE1, drums: ['rock', 'rock', 'rock', 'rock', 'rock', 'rock', 'rock', 'rockFill'] });
  one.part({ ...l1, section: VERSE1, second: 'double', secondPatch: VOICE, secondVel: 60, drums: ['crash', 'rock', 'rock', 'rock', 'rock', 'rock', 'rock', 'rockFill'] });

  // Level 2: verse 2, brass over organ and a walking bass with a shuffle.
  const two = new Writer(120, CHORDS);
  const l2 = { lead: INSTRUMENTS.brass, second: 'none' as const, bass: 'walk' as const, comp: 'r e, x e, r e, x e, r e, x e, r e, x e', compPatch: ORGAN, compVel: 60 };
  two.part({ ...l2, section: vamp(['G', 'G']), drums: ['shuffle'] });
  two.part({ ...l2, section: VERSE2, drums: ['shuffle', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'rockFill'] });
  two.part({ ...l2, section: VERSE2, lead: VOICE, second: 'octave', secondPatch: INSTRUMENTS.bell, secondVel: 45, drums: ['crash', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'rockFill'] });

  // Level 3: the wise men's strut, a plucked oud over toms, brass stabs.
  const three = new Writer(116, CHORDS);
  const l3 = { lead: OUD, leadVel: 118, second: 'double' as const, secondPatch: INSTRUMENTS.pluck, secondVel: 60, bass: 'eighths' as const, bassVel: 95, comp: 'x e, r e, r q, x e, r e, r q', compPatch: INSTRUMENTS.brass, compVel: 60 };
  three.part({ ...l3, section: vamp(['G', 'G']), drums: ['camel'] });
  three.part({ ...l3, section: BRIDGE, drums: ['camel'] });
  three.part({ ...l3, section: BRIDGE, lead: INSTRUMENTS.lead, shift: 0, drums: ['camel', 'camel', 'camel', 'camel', 'camel', 'camel', 'camel', 'rockFill'] });

  // Level 4: the spoken section as a hymn: celesta tune, strings, ride cymbal.
  const four = new Writer(108, CHORDS);
  const l4 = { lead: CELESTA, up: 12, leadVel: 115, second: 'double' as const, secondPatch: FLUTE, secondVel: 45, bass: 'half' as const, bassVel: 90, comp: 'x h, x h', compPatch: INSTRUMENTS.strings, compVel: 55 };
  four.part({ ...l4, section: SPOKEN, second: 'none', drums: ['half'], drumVel: 80 });
  four.part({ ...l4, section: SPOKEN, lead: FLUTE, secondPatch: CELESTA, drums: ['ride'], drumVel: 80 });

  return [one.cmf(), two.cmf(), three.cmf(), four.cmf()];
}

/** Won: the final chorus ("Third goat from the left! I claim my space!") into the outro's cadence ("He sees you... the third goat from the left"). */
export function wonSong(): Uint8Array {
  const w = new Writer(120, CHORDS);
  w.part({ ...BAND, section: FINAL, drums: ['crash', 'gospel', 'gospel', 'gospel', 'gospel', 'rockFill', 'crash', 'gospel', 'gospel', 'gospel', 'half', 'half', 'half'] });
  w.part({ ...BAND, section: slice(OUTRO, 5), comp: 'x w', compPatch: INSTRUMENTS.strings, bass: 'whole', drums: ['half', 'half', 'half', 'crash'] });
  w.part({ ...BAND, section: vamp(['G']), comp: 'x w', compPatch: INSTRUMENTS.strings, bass: 'whole', drums: ['none'] });
  return w.cmf();
}

/** Lost: the hook, slow and in G minor, falling away. */
export function lostSong(): Uint8Array {
  const w = new Writer(84, CHORDS);
  w.part({
    section: { chords: ['Gm', 'Cm', 'D7', 'Gm'], tune: ['r q, G4 q, G4 q, D#4 q', 'G4 h., F4 q', 'D#4 q, D4 q, C4 q, A3 q', 'G3 w'] },
    lead: FLUTE,
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

/** Credits: the whole song in order, intro to "Hey...". */
export function creditsSong(): Uint8Array {
  const w = new Writer(120, CHORDS);
  const band = { ...BAND, comp: 'x h, x h', bass: 'half' as const };
  const r8 = (last = 'rockFill', first = 'rock4') => [first, 'rock4', 'rock4', 'rock4', 'rock4', 'rock4', 'rock4', last];
  w.part({ ...band, section: INTRO, lead: VOICE, comp: 'x w', compPatch: INSTRUMENTS.pad, bass: 'whole', second: 'none', drums: ['none', 'none', 'none', 'none', 'half', 'half', 'half', 'rockFill'] });
  w.part({ ...band, section: VERSE1, lead: REED, second: 'none', comp: 'x q, x q, x q, x q', compPatch: EPIANO, drums: r8() });
  w.part({ ...band, section: ending(VERSE2, CHORUS.tune[7]), lead: INSTRUMENTS.brass, second: 'none', bass: 'walk', drums: r8() });
  w.part({ ...band, section: CHORUS, drums: r8('rockFill', 'crash') });
  w.part({ ...band, section: ending(CHORUS, 'r h, r q, r e, G4 e'), second: 'octave', secondPatch: CELESTA, secondVel: 50, drums: r8('rockFill', 'crash') });
  w.part({ ...band, section: BRIDGE, lead: OUD, second: 'none', bass: 'eighths', comp: 'x e, r e, r q, x e, r e, r q', compPatch: INSTRUMENTS.brass, drums: ['camel'] });
  w.part({ ...band, section: vamp(['G', 'G']), comp: 'x w', compPatch: INSTRUMENTS.strings, bass: 'whole', drums: ['half', 'rockFill'] });
  w.part({ ...band, section: SPOKEN, lead: CELESTA, up: 12, second: 'none', bass: 'half', comp: 'x h, x h', compPatch: INSTRUMENTS.strings, drums: ['ride'] });
  w.part({ ...band, section: FINAL, drums: ['crash', 'rock4', 'rock4', 'rock4', 'rock4', 'rockFill', 'crash', 'rock4', 'rock4', 'rock4', 'half', 'half', 'half'] });
  w.part({ ...band, section: OUTRO, lead: VOICE, second: 'none', comp: 'x h, x h', compPatch: INSTRUMENTS.strings, bass: 'half', drums: ['half'] });
  w.part({ ...band, section: { chords: ['G', 'G'], tune: ['r h, B4 h', 'G4 h, r h'] }, lead: VOICE, second: 'none', comp: 'x w', compPatch: INSTRUMENTS.pad, bass: 'whole', drums: ['none', 'crash'] }); // Hey...
  return w.cmf();
}
