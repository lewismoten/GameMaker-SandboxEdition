// The soundtrack: "Thread the Needle, Brother Camel" (The Bard of Bizarre, 1995) arranged for
// the Sound Blaster's OPL2 FM chip as Creative Music Files, in rhythm mode (games/kit/song.ts
// writes the bars: tune, second voice, bass, three comping voices and drums).
//
// The notes come from games/needle/tools/analyze.py run over the recording (which is not in
// the repo): 112 BPM. The verses are a slow gospel-blues in C (C, F, G7, with D7 and Am; the
// singer leans on the blue E-flat), the first chorus leans toward G, and after the bridge's
// "squeeze my soul!" the last choruses jump up into B major (B, E, F#, G#m, D#m):
//   intro                                0.0 -   4.9
//   verse 1 "I was mindin' my humps..."  4.9 -  39.3   bars 2-17
//   chorus "He said, 'It's easier...'"  39.3 -  58.7   bars 18-26
//   verse 2 "Now I'm just a camel..."   58.7 - 103.8   bars 27-47
//   bridge "Lord, I got knees..."      103.8 - 121.0   bars 48-55
//   last chorus, in B, "Thread the needle, Brother Camel, squeeze on through!"  121.0 - 140.4
//   "Thread the needle, thread the heart... Even a camel can dream!"          140.4 - 157.6
//   outro "Hump down... thread up... mercy come"                              157.6 - 180.6
// The tune is the sung line's pitch per word (harmonic salience on the center channel, per
// eighth note), evened out to the syllables. Each bar below is written as eighth-note onsets
// ("0:G4 2:E4 ..."): a note lasts until the next one or the bar line.
import { INSTRUMENTS } from '../../../kit/music';
import { CELESTA, EPIANO, FLUTE, ORGAN, OUD, REED, VOICE, Writer, ending, slice, vamp, type Part, type Section } from '../../../kit/song';

const BPM = 112;

/** Lengths in eighths and their names in the note strings, longest first. */
const SPANS: [number, string][] = [
  [8, 'w'],
  [6, 'h.'],
  [4, 'h'],
  [3, 'q.'],
  [2, 'q'],
  [1, 'e'],
];

/**
 * One bar from eighth-note onsets ("0:G4 3:E4", "4:r" for a rest): each note lasts to the next
 * onset or the bar line (past a dotted half, the rest of it is silence).
 */
function bar(onsets: string): string {
  const notes = onsets
    .trim()
    .split(/\s+/)
    .map((t) => t.split(':'))
    .map(([at, note]) => [Number(at), note] as [number, string]);
  const out: string[] = [];
  const fill = (from: number, to: number, note: string) => {
    let left = to - from;
    for (const [len, name] of SPANS)
      while (left >= len) {
        out.push(`${note} ${name}`);
        left -= len;
        note = 'r';
      }
  };
  if (notes[0][0] > 0) fill(0, notes[0][0], 'r');
  notes.forEach(([at, note], i) => {
    const next = i + 1 < notes.length ? notes[i + 1][0] : 8;
    if (next <= at) throw new Error(`Onsets out of order in "${onsets}"`);
    fill(at, next, note);
  });
  return out.join(', ');
}

const sec = (chords: string[], bars: string[]): Section => ({ chords, tune: bars.map(bar) });

// ---- the song's material ------------------------------------------------------------------

/** "I was mindin' my humps by the city gate, / Chewin' my cud, ponderin' fate. / Then came a rich man, all gold and pride, / Said he kept the law - every box he'd tied." (the bar before holds "I") */
const VERSE1A = sec(
  ['C', 'C', 'C', 'C', 'C', 'Am F', 'F G', 'G C'],
  [
    '1:Eb4 2:Eb4 3:Eb4 4:C4 6:G4', // was mind-in' my humps by
    '0:F4 1:A4 2:G4 4:r 6:C5', // the cit-y gate, chew-
    '0:C5 3:C5 4:C5', // -in' my cud,
    '1:G4 3:G4 5:r 7:G4', // pon-der-in' fate. Then
    '0:G4 3:E4 4:E4 5:G4', // came a rich man,
    '1:D4 2:D4 4:C4 7:A4', // all gold and pride, said
    '0:A4 2:C5 3:C5 4:E5', // he kept the law,
    '0:D5 2:D5 3:C5 4:A4 6:r', // ev-ery box he'd tied.
  ],
);
/** "But Jesus looked him square and deep, / Said 'Give it all up if Heaven's what you seek.' / The man walked off with his coins and frown... / And then... Jesus turned around." */
const VERSE1B = sec(
  ['G7', 'Dm', 'C', 'C', 'C', 'C', 'C G7', 'C'],
  [
    '0:A4 3:A4 5:G4 7:A4', // But Je-sus looked him
    '0:D5 2:D5 4:D5 7:G4', // square and deep, said
    '2:C5 3:C5 4:E5 6:A4', // give it all up if
    '0:D5 1:D5 2:F4 3:C4', // Hea-ven's what you seek.
    '0:G4 4:A4 5:G4 7:C5', // The man walked off
    '1:C5 2:C5 3:D5 5:D5 7:C5', // with his coins and frown...
    '2:G4 3:G4 7:D4', // and then... Je-
    '0:D4 2:C4 4:r 7:G4', // -sus turned a-round. He
  ],
);
/** "He said, 'It's easier, child, for a camel to go / Through the eye of a needle, don't you know... / Than for a rich man, clingin' to his stash, / To ride through glory with all that cash.'" */
const CHORUS1 = sec(
  ['C', 'D7', 'Em F', 'Am', 'G', 'Am', 'C F', 'D7 G'],
  [
    '0:G4 2:G4 3:E4 4:G4 6:A4', // said, "It's eas-i-er, child,
    '1:D5 3:D5 4:C5 5:C5', // for a cam-el to go
    '4:C5 6:D5 7:E5', // through the eye
    '0:E5 2:C5 3:A4 4:A4', // of a nee-dle, don't you know...
    '0:G4 1:G4 3:G4 5:D4', // than for a rich man,
    '3:A4 5:G4 6:C5 7:C5', // cling-in' to his stash,
    '2:G4 3:D4 5:D4 7:E4', // to ride through glo-
    '0:E4 1:C4 3:D4 5:D4 6:C4', // -ry with all that cash."
  ],
);
/** "Now I'm just a camel - desert-born, / But I swear I felt myself spiritually torn. / Was He talkin' 'bout *me*?! My double-wide stride? / Do I need to slim down on the spiritual side?!" */
const VERSE2A = sec(
  ['C', 'C G', 'C', 'C', 'C', 'F', 'C', 'C'],
  [
    '0:C4 2:G4 3:A4 4:D5 7:D5', // Now I'm just a cam-el, des-
    '0:C5 2:A4 3:C5 4:C5 5:A4 6:A4', // -ert-born, but I swear I felt my-
    '0:E4 2:E4 3:D4 4:D4 6:D4', // -self spir-i-tu-al-ly torn.
    '3:G4 5:D4 6:D4 7:E4', // Was He talk-in' 'bout
    '0:G4 5:G4 6:G4 7:C5', // me?! My dou-ble-wide
    '0:C5 4:G4 5:A4 6:C5 7:D5', // stride? Do I need to
    '0:Eb5 2:C5 4:C5 5:F4 7:G4', // slim down on the spir-i-
    '0:G4 2:E4 4:r', // -tual side?!
  ],
);
/** "I tried to squint, I tried to kneel, / I asked a tailor what thread feel feels. / Turns out, y'all - ain't no real gate, / He meant an actual needle - I checked real late." */
const VERSE2B = sec(
  ['C', 'F', 'G Am', 'G7', 'C', 'C', 'F', 'C', 'Dm Am', 'Am C', 'F', 'G7'],
  [
    '0:G4 2:G4 3:G4 4:C5', // I tried to squint,
    '0:C5 2:C5 5:G4 7:E4', // I tried to
    '0:C4 5:F4 6:D4 7:A4', // kneel, I asked a
    '0:G4 1:E4 2:D4 3:E4 5:D4 6:C4', // tai-lor what thread feel feels.
    '4:D4 5:G4 7:C5', // I tried to squint,
    '0:C5 3:C5 5:G4 7:G4', // I tried to
    '0:G4 4:G4 6:G4 7:Ab4', // kneel, I asked a
    '0:G4 1:A4 2:A4 3:G4 4:C5 6:C5', // tai-lor what thread feel feels.
    '5:G4 6:E4', // Turns out,
    '0:D4 1:D4 3:E4 5:E4 6:D4', // y'all, ain't no real
    '0:C4 4:G4 6:G4 7:E4', // gate, He meant an
    '0:E4 1:F4 2:E4 3:E4 4:G4 5:F4 6:A4', // ac-tu-al nee-dle, I checked real
  ],
);
/** "...late." and the band into the bridge */
const LATE = sec(['G7 C'], ['0:G4 2:G4 4:r']);
/** "Lord, I got knees that don't even bend! / I ain't never even seen a Singer brand! / But if You call me through that tiny hole, / I'll tuck my humps and squeeze my soul!" */
const BRIDGE = sec(
  ['C', 'C G', 'Am', 'F C', 'F C', 'G', 'Em F', 'G G7'],
  [
    '4:D4 6:C4 7:C4', // Lord, I got
    '0:C4 3:C4 4:G4 5:G4 6:A4', // knees that don't e-ven bend!
    '3:G4 6:Eb4', // I ain't
    '0:Eb4 1:C4 3:A4 5:C5 6:C5 7:A4', // nev-er e-ven seen a Sing-er brand!
    '5:E4 6:A4 7:G4', // But if You
    '0:G4 1:G4 2:E4 3:D4 6:F#4', // call me through that ti-ny hole,
    '7:A4', // I'll
    '0:G4 1:G4 3:G4 4:E4 6:D4 7:C4', // tuck my humps and squeeze my soul!
  ],
);
/** The jump up into B: "Thread the" */
const LEAP = sec(['F#7'], ['0:r 6:B4 7:B4']);
/** "...needle, Brother Camel, squeeze on through! / Leave the baggage and your fancy shoes! / Ain't no saddle rich enough to ride to grace - / So drop that gold and run your race!" (in B) */
const FINAL = sec(
  ['B', 'B', 'E', 'F#', 'B', 'B E', 'G#m', 'E F#'],
  [
    '0:B4 2:B4 3:B4 4:G#4 5:B4 6:B4 7:F#4', // nee-dle, Broth-er Cam-el, squeeze on through!
    '0:F#4 3:F#4 6:B4 7:B4', // Leave the bag-
    '0:B4 2:G#4 3:G#4 4:E4 6:F#4', // -gage and your fan-cy shoes!
    '3:C#4 5:F#4 7:A#4', // Ain't no sad-
    '0:F#4 1:F#4 3:F#4 5:F#4', // -dle rich e-nough to
    '0:G#4 1:F#4 3:B4 7:G#4', // ride to grace, so
    '0:G#4 1:G#4 3:G#4 5:F#4 7:F#4', // drop that gold and run
    '0:G#4 2:G#4 4:r 6:B4', // your race! Thread
  ],
);
/** "Thread the needle, thread the heart, / Let the Spirit pull you apart - / Then stitch you whole with Heaven's seam... / Even a camel can dream!" */
const FINAL2 = sec(
  ['E', 'B', 'F#7', 'D#m', 'G#m', 'B', 'B E', 'E'],
  [
    '1:B4 3:G#4 4:B4 7:D#5', // the nee-dle, thread
    '0:B4 1:F#4 6:D#4 7:F#4', // the heart, let the
    '0:F#4 2:F#4 5:D#4 6:D#4', // Spir-it pull you a-
    '0:D#4 3:F#4 5:D#4 6:D#4', // -part, then stitch you
    '0:D#4 1:G#4 4:D#4 7:F#4', // whole with Hea-ven's seam... E-
    '0:F#4 3:G#4 6:B4', // -ven a
    '0:B4 2:B4 4:B4 7:B4', // cam-el can dream!
    '6:G#4', // yeah.
  ],
);
/** "Hump down... thread up... mercy come..." (fading, the desert wind and a tambourine) */
const OUTRO = sec(['B', 'B', 'E', 'B'], ['0:B4 3:B4 4:B4 6:B4', '7:F#4', '4:B4', '5:F#4 7:B4']);
/** The band's opening: a blues turnaround in C. */
const INTRO = sec(['C', 'G7'], ['0:r', '0:r 6:G4']);

// ---- the band -----------------------------------------------------------------------------

/** The gospel-blues band: the singer on a reedy lead doubled by organ, organ comping on the offbeats, a walking bass. */
const BAND: Omit<Part, 'section' | 'drums'> = {
  lead: VOICE,
  second: 'double',
  secondPatch: ORGAN,
  secondVel: 55,
  bass: 'walk',
  comp: 'r e, x e, r e, x e, r e, x e, r e, x e',
  compPatch: ORGAN,
  compVel: 60,
};
/** The revival: up in B, the singer doubled an octave up on a bell, clapping. */
const REVIVAL: Omit<Part, 'section' | 'drums'> = { ...BAND, bass: 'pump', second: 'octave', secondPatch: INSTRUMENTS.bell, secondVel: 45 };

const n = (k: number, g: string, last?: string) => [...new Array(k - 1).fill(g), last ?? g];
const clap = (k: number, first = 'crash') => [first, ...new Array(Math.max(0, k - 2)).fill('clap'), 'clapFill'];

// ---- the songs ----------------------------------------------------------------------------

/** Title: the band's leap up into B and the hook ("Thread the needle, Brother Camel, squeeze on through!") to "So drop that gold and run your race!" */
export function titleSong(): Uint8Array {
  const w = new Writer(BPM);
  w.part({ ...REVIVAL, section: vamp(['B', 'F#7']), drums: ['crash', 'clapFill'] });
  w.part({ ...REVIVAL, section: LEAP, drums: ['clap'] });
  w.part({ ...REVIVAL, section: FINAL, drums: clap(8) });
  w.part({ ...REVIVAL, section: ending(slice(FINAL2, 5), bar('0:B4 4:r')), drums: ['clap', 'clap', 'half'] });
  return w.cmf();
}

/** Story pages: verse 1, slow and soulful (a flute over electric piano; brushes in the second half). */
export function storySong(): Uint8Array {
  const w = new Writer(96);
  const soft: Omit<Part, 'section' | 'drums'> = {
    lead: FLUTE,
    up: 12,
    leadVel: 95,
    second: 'none',
    bass: 'whole',
    bassVel: 80,
    comp: 'x q, x q, x q, x q',
    compPatch: EPIANO,
    compVel: 48,
  };
  w.part({ ...soft, section: INTRO, comp: 'x w', compPatch: INSTRUMENTS.pad, drums: ['none'] });
  w.part({ ...soft, section: VERSE1A, drums: ['none'] });
  w.part({ ...soft, section: ending(VERSE1B, bar('0:D4 2:C4 4:r')), drums: ['soft'], drumVel: 55 });
  return w.cmf();
}

/**
 * The four levels: verse 1 as a shuffle (the city gate), the first chorus on an oud over a
 * camel-gait groove (the desert road), verse 2 on a plucked celesta (the tailor's shop), and
 * the bridge leaping up into the last chorus, a full revival (the eye of the needle).
 */
export function levelSongs(): Uint8Array[] {
  const one = new Writer(BPM);
  const l1: Omit<Part, 'section' | 'drums'> = {
    ...BAND,
    lead: REED,
    second: 'none',
    comp: 'r e, x e, r e, x e, r e, x e, r e, x e',
    compPatch: EPIANO,
    compVel: 58,
  };
  one.part({ ...l1, section: INTRO, drums: ['shuffle', 'rockFill'] });
  one.part({ ...l1, section: VERSE1A, drums: n(8, 'shuffle', 'rockFill') });
  one.part({ ...l1, section: VERSE1B, lead: VOICE, second: 'double', secondPatch: ORGAN, drums: n(8, 'shuffle', 'rockFill') });

  const two = new Writer(BPM);
  const l2: Omit<Part, 'section' | 'drums'> = {
    lead: OUD,
    leadVel: 118,
    second: 'double',
    secondPatch: INSTRUMENTS.pluck,
    secondVel: 60,
    bass: 'eighths',
    bassVel: 95,
    comp: 'x e, r e, r q, x e, r e, r q',
    compPatch: INSTRUMENTS.brass,
    compVel: 58,
  };
  two.part({ ...l2, section: vamp(['C', 'G7']), drums: ['camel'] });
  two.part({ ...l2, section: CHORUS1, drums: ['camel'] });
  two.part({ ...l2, section: CHORUS1, lead: VOICE, secondPatch: OUD, drums: n(8, 'camel', 'rockFill') });

  const three = new Writer(BPM);
  const l3: Omit<Part, 'section' | 'drums'> = {
    lead: CELESTA,
    up: 12,
    leadVel: 110,
    second: 'double',
    secondPatch: INSTRUMENTS.pluck,
    secondVel: 60,
    bass: 'walk',
    bassVel: 92,
    comp: 'r q, x q, r q, x q',
    compPatch: EPIANO,
    compVel: 52,
  };
  three.part({ ...l3, section: vamp(['C', 'C']), drums: ['half', 'rockFill'] });
  three.part({ ...l3, section: VERSE2A, drums: n(8, 'shuffle', 'rockFill') });
  three.part({ ...l3, section: VERSE2B, lead: REED, up: 0, drums: n(12, 'shuffle', 'rockFill') });
  three.part({ ...l3, section: LATE, drums: ['rockFill'] });

  const four = new Writer(BPM);
  four.part({ ...BAND, section: BRIDGE, drums: n(8, 'gospel', 'rockFill') });
  four.part({ ...REVIVAL, section: LEAP, drums: ['clapFill'] });
  four.part({ ...REVIVAL, section: FINAL, drums: clap(8) });
  four.part({ ...REVIVAL, section: FINAL2, lead: INSTRUMENTS.lead, drums: clap(8) });
  return [one.cmf(), two.cmf(), three.cmf(), four.cmf()];
}

/** Won: "Thread the needle, thread the heart... Even a camel can dream!" and the outro, "Hump down... thread up... mercy come." */
export function wonSong(): Uint8Array {
  const w = new Writer(BPM);
  w.part({ ...REVIVAL, section: sec(['F#7'], ['0:r 7:B4']), drums: ['clapFill'] });
  w.part({ ...REVIVAL, section: FINAL2, drums: clap(8) });
  w.part({
    ...REVIVAL,
    section: OUTRO,
    lead: FLUTE,
    up: 12,
    second: 'none',
    comp: 'x w',
    compPatch: INSTRUMENTS.strings,
    drums: ['soft', 'soft', 'soft', 'none'],
    drumVel: 60,
  });
  return w.cmf();
}

/** Lost: "Even a camel can dream," slow, in B minor, kneeling in the sand. */
export function lostSong(): Uint8Array {
  const w = new Writer(76);
  w.part({
    section: sec(['Bm', 'Em', 'F#7', 'Bm'], ['0:F#4 3:G4 6:B4', '0:B4 2:B4 4:B4', '0:A#4 2:F#4 4:C#4', '0:B3']),
    lead: FLUTE,
    up: 12,
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

/** The menu: the whole song in order, intro to "mercy come". */
export function wholeSong(): Uint8Array {
  const w = new Writer(BPM);
  // lighter comping in the verses so the whole song fits a .CMF under 20,000 bytes
  const verse: Omit<Part, 'section' | 'drums'> = { ...BAND, second: 'none', comp: 'r q, x q, r q, x q' };
  w.part({
    ...BAND,
    section: INTRO,
    lead: INSTRUMENTS.brass,
    second: 'none',
    comp: 'x w',
    compPatch: INSTRUMENTS.pad,
    bass: 'whole',
    drums: ['crash', 'rockFill'],
  });
  w.part({ ...verse, section: VERSE1A, lead: REED, drums: n(8, 'shuffle', 'rockFill') });
  w.part({ ...verse, section: VERSE1B, drums: n(8, 'shuffle', 'rockFill') });
  w.part({ ...BAND, section: CHORUS1, drums: clap(8) });
  w.part({ ...BAND, section: vamp(['C']), drums: ['clapFill'] });
  w.part({ ...verse, section: VERSE2A, lead: REED, drums: n(8, 'shuffle', 'rockFill') });
  w.part({ ...verse, section: VERSE2B, drums: n(12, 'shuffle', 'rockFill') });
  w.part({ ...BAND, section: LATE, drums: ['rockFill'] });
  w.part({
    ...BAND,
    section: BRIDGE,
    lead: INSTRUMENTS.brass,
    second: 'none',
    bass: 'half',
    comp: 'x q, r q, x q, r q',
    compPatch: INSTRUMENTS.strings,
    drums: n(8, 'march', 'rockFill'),
  });
  w.part({ ...REVIVAL, section: LEAP, drums: ['clapFill'] });
  w.part({ ...REVIVAL, section: FINAL, drums: clap(8) });
  w.part({ ...REVIVAL, section: FINAL2, drums: clap(8) });
  w.part({
    ...REVIVAL,
    section: OUTRO,
    lead: FLUTE,
    up: 12,
    second: 'none',
    comp: 'x w',
    compPatch: INSTRUMENTS.strings,
    drums: ['soft', 'soft', 'soft', 'none'],
    drumVel: 60,
  });
  return w.cmf();
}
