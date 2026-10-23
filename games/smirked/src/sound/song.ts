// The soundtrack: "I Screamed, She Smirked" (The Bard of Bizarre, 1995), a musical-theater
// character song (a patter number, then a big Broadway chorus) about a haunted house, arranged
// for the Sound Blaster's OPL2 FM chip as Creative Music Files in rhythm mode, with the tricks
// in games/kit/songFx.ts where they fit the joke:
//   - the singer is a trumpet, muted (a plunger "wah") for the patter verses and open in the
//     choruses, where a trombone doubles it an octave down like a pit band's brass;
//   - the haunted house's pipe organ opens every song with the Toccata's mordent (every 1995
//     haunted house had that tape on a loop), and a thunderclap rolls under it (cymbal and toms);
//   - patter verses are stride piano (the bass on one and three, the chord on two and four) and
//     brushes; "I feel heroic... at least till I fled" lands on a brass sting a whole step flat;
//   - "GET DOWN!" stops the band dead for a band hit; the zombie parade is an oompah march in
//     the tuba and the brass;
//   - the werewolf verse creeps on pizzicato (a one-channel celesta arpeggio and a plucked bass)
//     and the werewolf howls (stepped glides on the theremin; no pitch bend);
//   - "E-e-e-exit sign!" stutters, and the last chorus ends on a held chord, a cymbal roll and
//     a band hit; the lost song is a sad trombone (wah, wah, wah, wahhh);
//   - a marker at every section (PLAYGAME skips them; tools/songPreview.ts reads them).
//
// The notes come from games/smirked/tools/analyze.py run over the recording (which is not in
// the repo): 99.9 BPM in 4/4, C major with blue notes (E-flat over C, B-flat), bars of 2.40 s
// from the downbeat at 2.33 s; the chords C, G7, F and B-flat. The sung lines (Whisper's word
// timings):
//   verse 1 "Okay, in my defense..."            0.0 -  14.3  (bars -1..4; sung from the first beat)
//   verse 2 "So I take Lily..."                 18.4 -  29.2  (7-11; "till I fled" on B-flat)
//   verse 3 "Fog machine hisses..."             35.4 -  45.5  (14-17)
//   chorus "She's eight, and I'm afraid"        45.5 -  72.2  (18-28; "GET DOWN!" at 54.8)
//   verse 4 "There's a guy in a werewolf mask"  80.5 -  91.0  (32-36)
//   bridge "Eyes are all watery..."             92.2 - 101.8  (37-41; "You know it's not real, right?" 100.4)
//   breakdown "Then she pats me..."            102.1 - 110.2  (41-44; "Bravery Badge" 107.2)
//   last chorus "She's eight, and I'm ashamed" 110.9 - 131.9  (45-54; "the emergency exit sign" held)
//   outro "So yeah. The date went well."       139.5 - 169.3  (57-69, slowing), then the band out
import { sbi } from '../../../kit/music';
import { Writer, type Groove } from '../../../kit/song';
import { DRUM, Fx, boomPatch, detuned, leveled, sweep } from '../../../kit/songFx';

export const BPM = 100;

// ---- the patches --------------------------------------------------------------------------

/** The singer, open: a bright trumpet (a sawtooth-ish buzz from feedback, the modulator's slow bite). */
const TRUMPET = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x18, carLevel: 0x00, modAD: 0x73, carAD: 0x95, modSR: 0x16, carSR: 0x17, feedback: 0x0e });
/** The singer, muted for the patter: darker, shorter. */
const MUTED = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x1f, carLevel: 0x02, modAD: 0x83, carAD: 0xa6, modSR: 0x37, carSR: 0x38, feedback: 0x0c });
/** The trombone an octave under the trumpet in the choruses (its vibrato twin, so the two beat). */
const TROMBONE = detuned(sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x1a, carLevel: 0x00, modAD: 0x62, carAD: 0x84, modSR: 0x15, carSR: 0x16, feedback: 0x0c }));
/** The brass section's stabs and hits (the comping voices in the choruses). */
const BRASS = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x1b, carLevel: 0x04, modAD: 0x85, carAD: 0xa5, modSR: 0x25, carSR: 0x26, feedback: 0x0c });
/** The brass swelling up on a held chord ("I bonded... with the emergency... exit sign"). */
const SWELL = sweep(BRASS, 8, { mod: 34, car: 22 }, { mod: 22, car: 3 });
/** Stride piano: a bright, honky pluck. */
const PIANO = sbi({ modChar: 0x01, carChar: 0x11, modLevel: 0x1c, carLevel: 0x03, modAD: 0xf3, carAD: 0xf2, modSR: 0x44, carSR: 0x55, feedback: 0x0a });
/** The haunted house's pipe organ. */
const PIPES = sbi({ modChar: 0x22, carChar: 0x21, modLevel: 0x16, carLevel: 0x03, modAD: 0xf0, carAD: 0xf0, modSR: 0x0f, carSR: 0x0f, carWave: 1, feedback: 0x08 });
/** Strings for the bridge: a soft-edged pad. */
const STRINGS = sbi({ modChar: 0x61, carChar: 0x61, modLevel: 0x1e, carLevel: 0x04, modAD: 0x53, carAD: 0x63, modSR: 0x06, carSR: 0x07, modWave: 1, feedback: 0x08 });
/** Celesta: the sneaky pizzicato in the werewolf verse and the "mild scares" twinkle. */
const CELESTA = sbi({ modChar: 0x05, carChar: 0x01, modLevel: 0x1c, carLevel: 0x00, modAD: 0xf6, carAD: 0xf4, modSR: 0x34, carSR: 0x25, feedback: 0x06 });
/** The tuba: oompah. */
const TUBA = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x17, carLevel: 0x00, modAD: 0x95, carAD: 0xa6, modSR: 0x26, carSR: 0x27, feedback: 0x08 });
/** The pit's upright bass, plucked. */
const UPRIGHT = sbi({ modChar: 0x01, carChar: 0x01, modLevel: 0x16, carLevel: 0x00, modAD: 0xf4, carAD: 0xf4, modSR: 0x46, carSR: 0x56, feedback: 0x0a });
/** The werewolf (and the very last wolf howl): a pure, wobbling sine. */
const THEREMIN = sbi({ modChar: 0x60, carChar: 0x61, modLevel: 0x3f, carLevel: 0x00, modAD: 0x52, carAD: 0x63, modSR: 0x06, carSR: 0x07, feedback: 0x00 });
/** The sad trombone, quieter and breathy. */
const SADBONE = leveled(TROMBONE, { mod: 30, car: 4 });
const KICK = boomPatch({ decay: 8, release: 8, growl: 0x18 });
/** A brushed snare (soft, noisy) and a ticking hi-hat. */
const SNARE = sbi({ modChar: 0x02, carChar: 0x00, modLevel: 0x04, carLevel: 0x00, modAD: 0xf6, carAD: 0x00, modSR: 0x08, carSR: 0x00, feedback: 0x00 });
const HAT = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x07, carLevel: 0x00, modAD: 0xfa, carAD: 0x00, modSR: 0x09, carSR: 0x00, feedback: 0x00 });
/** Tom-toms, tuned: fills and the thunder. */
const TOM = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x02, carLevel: 0x00, modAD: 0xf6, carAD: 0x00, modSR: 0x36, carSR: 0x00, feedback: 0x00 });
/** A crash that can roll (thunder, the big finish). */
const CRASH = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x05, carLevel: 0x00, modAD: 0xd4, carAD: 0x00, modSR: 0x04, carSR: 0x00, feedback: 0x00 });

// ---- chords -------------------------------------------------------------------------------

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** A chord name ("C", "G7", "Am", "Bb", "Cdim") as its root pitch class and intervals. */
function shape(name: string): { pc: number; iv: number[] } {
  const m = /^([A-G])(b|#)?(m|dim)?(7?)$/.exec(name);
  if (!m) throw new Error(`Unknown chord ${name}`);
  const pc = (PC[m[1]] + (m[2] === 'b' ? 11 : m[2] === '#' ? 1 : 0)) % 12;
  if (m[3] === 'dim') return { pc, iv: [0, 3, 6] };
  return { pc, iv: [0, m[3] ? 3 : 4, m[4] ? 10 : 7] };
}

const fold = (pc: number, lo: number) => lo + ((pc - lo + 120) % 12);

/** Three comping voices, low to high, in G3..F#4. */
function voicing(name: string, shift = 0): number[] {
  const { pc, iv } = shape(name);
  return iv.map((i) => fold(pc + i + shift, 55)).sort((a, b) => a - b);
}

/** The bass root (E2..D#3). */
const root = (name: string, shift = 0) => fold(shape(name).pc + shift, 40);

// ---- the song's material ------------------------------------------------------------------

interface Section {
  name: string;
  /** One chord per bar, or two ("C G7": half a bar each). */
  chords: string[];
  /** One bar of the singer per string (4 beats; kit/songFx tones(), with slides). */
  tune: string[];
}

/** The haunted house's organ: the Toccata's mordent, then a diminished chord. Two bars. */
const TOCCATA: Section = { name: 'toccata', chords: ['Cm', 'Cdim'], tune: ['r w', 'r w'] };

/** "Okay, in my defense... the sign said "mild scares for all ages!" / And in my double defense- eight is a weird stage. / They believe in unicorns, but not in respect, / And they stare like you're dumb if you flinch or deflect." */
const VERSE1: Section = {
  name: 'verse 1',
  chords: ['C', 'C', 'C', 'F', 'C', 'G7'],
  tune: [
    'A#4 e, C5 q, r e, C5 e, C5 e, G4 e, G4 e', // O-kay, in my de-fense,
    'G4 s, G4 s, G4 e, G4 e, G4 e, G4 e, G4 e, C5 e, C5 e', // the sign said mild scares for all a-ges!
    'C5 e, C5 e, C5 e, D#5 e, ~E5 e, C5 e, C5 q', // And in my dou-ble de-fense-
    'C5 q, D5 e, C5 e, G4 q, G4 q', // eight is a weird stage.
    'G4 e, D#4 s, D#4 s, D#4 e, D#4 s, D#4 s, D#4 q, E4 s, F4 s, F4 s, F4 s', // They be-lieve in u-ni-corns, but not in re-
    'F4 e, F#4 s, F4 s, G4 s, G4 s, G#4 s, G4 s, G4 s, D4 s, G4 e, D#4 s, D#4 s, F4 e', // -spect, and they stare like you're dumb if you flinch or de-flect.
  ],
};

/** "So I take Lily, my girlfriend's kid, / To a haunted house- bonding! That's what we did! / She's got a caramel apple as big as her head, / I feel heroic... at least till I fled." */
const VERSE2: Section = {
  name: 'verse 2',
  chords: ['C', 'C', 'C', 'C', 'G7', 'Bb'],
  tune: [
    'r h, r q, F4 e, F4 e', // So I
    'C4 e, G4 e, G4 q, B4 e, G4 e, G4 e, G4 e', // take Li-ly, my girl-friend's kid,
    'G4 s, F#4 s, G4 e, G4 e, G4 e, C5 e, C5 e, G4 s, G4 s, G4 s, F#4 s', // to a haunt-ed house- bond-ing! That's what we did!
    'G4 s, G4 s, G4 s, G4 s, G4 s, G4 s, G4 e, G4 s, D#4 s, F#4 e, G#4 s, G#4 s, F#4 e', // She's got a car-a-mel ap-ple as big as her head,
    'F4 s, E4 s, D#4 s, E4 s, D#4 q, C4 e, D4 e, D4 e, C#4 e', // I feel he-ro-ic... at least till I
    'D4 h!, r h', // fled.
  ],
};

/** "Fog machine hisses- I scream like a cat! / She just looks up and says, "You okay with that?" / She's got glitter cheeks and a unicorn hood, / While I'm sweating like meat in a microwave... good." */
const VERSE3: Section = {
  name: 'verse 3',
  chords: ['C', 'C', 'C', 'C', 'G7'],
  tune: [
    'r h, r q, G4 e, C5 e', // Fog ma-
    'C5 e, C5 e, C5 e, C5 e, ~D#5 q!, G4 s, G4 s, G4 e', // -chine hiss-es- I SCREAM like a cat!
    'C5 s, C5 s, B4 e, G4 e, C5 s, G4 s, C5 e, C5 s, C5 s, C5 e, ~D5 e', // She just looks up and says, "You o-kay with that?"
    'C5 s, G4 s, C5 s, C5 s, C#5 e, C5 s, C5 s, C5 s, C5 s, C5 e, C5 q', // She's got glit-ter cheeks and a u-ni-corn hood,
    'C5 s, C5 s, D#5 s, D#5 s, D#5 e, D#5 e, C5 s, C5 s, D#5 s, D#5 s, D#5 e, E5 e-', // while I'm sweat-ing like meat in a mi-cro-wave... good.
  ],
};

/** "She's eight, and I'm afraid, / Of papier-mache and a zombie parade. / I tackle a witch, shout "GET DOWN!" on repeat- / Turns out, she was cardboard and very petite. / She strolls like it's Target, I'm wheezing behind, / I am bonding... / With the emergency exit sign." */
const CHORUS: Section = {
  name: 'chorus',
  chords: ['C', 'C G7', 'F', 'C G7', 'G7', 'G7', 'C', 'G7', 'F', 'C G7', 'C'],
  tune: [
    'C5 q, G4 e, G4 e, D#4 e, D#4 e, C4 q', // She's eight, and I'm a-fraid,
    'r h, G4 e, G4 e, G4 e, G4 e', // of pa-pier-ma-
    'F4 q, G4 e, C5 e, C5 e, C5 s, C5 s, C5 q', // -che and a zom-bie pa-rade.
    'r e, C5 s, G4 s, G4 e, G4 e, G4 q, G4 e, G4 e!', // I tack-le a witch, shout GET
    'C5 q!, D#4 e, C4 e, F4 q, r e, F#4 e', // DOWN! on re-peat- Turns
    'G4 e, G4 e, C5 e, G4 e, G4 e, D4 e, G#4 e, G#4 e', // out, she was card-board and ve-ry
    'G4 e, D4 q., r h', // pe-tite.
    'r q, A4 e, G4 q, r e, F4 e, D#4 e', // She strolls like it's
    'C4 e, C4 e, r e, C4 e, F4 e, F4 e, D#4 e, D#4 e', // Tar-get, I'm wheez-ing be-hind,
    'r q, G4 e, C5 e, D5 q, D5 q', // I am bond-ing...
    'r e, G4 e, G4 e, C5 s, C5 s, C5 s, C5 s, G4 e, G4 e, C5 e', // with the e-mer-gen-cy ex-it sign.
  ],
};

/** "There's a guy in a werewolf mask- he growls, I pivot! / I don't run. No, no. I strategically rivet... / Through a wall of fake webs- turns out they're not kind. / Now I'm sneezing like Salem's last witch left behind!" */
const VERSE4: Section = {
  name: 'verse 4',
  chords: ['C', 'C', 'C', 'C', 'F G7'],
  tune: [
    'r h, A#4 e, C5 e, C5 e, C5 s, C5 s', // There's a guy in a
    'C5 e, C5 e, G#4 e, C5 s, G4 s, G4 e, G4 s, G4 s, G4 e, r e', // were-wolf mask- he growls, I piv-ot!
    'B4 s, E5 s, E5 e, A#4 s, C5 s, C5 s, C5 s, C5 s, C5 s, C5 s, C5 s, C5 e, C5 s, B4 s', // I don't run. No, no. I stra-te-gic-'lly ri-vet... through a
    'C5 s, C5 s, C5 e, G4 e, C5 s, C5 s, C5 s, C5 s, C5 e, r e, C5 s, C5 s', // wall of fake webs- turns out they're not kind. Now I'm
    'E5 s, D#5 s, D#5 s, D#5 s, F4 s, F4 s, F4 e, D#4 e, C4 e, C4 q', // sneez-ing like Sa-lem's last witch left be-hind!
  ],
};

/** "My eyes are all watery, my soul's in retreat, / I trip over fog lights and fake demon feet. / And Lily? She's chillin'. Calm as can be- / Looks at me and says, "You know it's not real, right?" / ...merci." */
const BRIDGE: Section = {
  name: 'bridge',
  chords: ['G7', 'G7', 'Am G7', 'G7', 'G7 C'],
  tune: [
    'r q, r e, G4 q, G4 s, G4 s, G4 s, G4 s, G4 e', // My eyes are all wa-ter-y,
    'C5 s, C5 s, C5 s, A#4 s, A#4 q, G4 s, G4 s, G4 s, G4 s, G4 s, F4 s, D4 e', // my soul's in re-treat, I trip o-ver fog lights and
    'C4 s, C4 s, C4 e, B4 e, A#4 s, A#4 s, A#4 e, C#5 s, C#5 s, E5 q', // fake de-mon feet. And Li-ly? She's chil-lin'.
    'G#4 s, A4 s, C#5 e, D#5 s, A4 s, A4 e, G4 s, A4 s, G4 e, D#4 e, G4 e', // Calm as can be- looks at me and says, "You know
    'B4 s, B4 s, A4 e, G4 q, B4 e, C5 e-, G4 s, G4 s, C5 e', // it's not real, right?" ...mer-ci. Then she pats
  ],
};

/** "Then she pats me. *Pats* me. / Like *I* need the juice box and some therapy. / She gets a Bravery Badge from the front desk guy, / I get a souvenir sword..." */
const BREAKDOWN: Section = {
  name: 'breakdown',
  chords: ['C', 'C', 'F', 'G7'],
  tune: [
    'C4 e, F4 e, C4 e, C4 s, C4 s, C4 s, C4 s, A4 s, G4 s, G4 e, C5 e', // me. Pats me. Like I need the juice box and some
    'F4 s, F4 s, G4 s, G4 s, C5 e, F4 e, F4 s, G4 s, G4 e, r e, C5 s, C5 s', // ther-a-py. She gets a Brave-ry Badge from the
    'F4 e, G4 e, r e, G4 s, G4 s, G4 e, F4 s, F4 s, F4 q', // front desk. I get a sou-ve-nir sword...
    'r q, D#4 q, G4 q, G4 e, C5 e', // She's eight, and I'm
  ],
};

/** "She's eight, and I'm ashamed, / Of how many fake ghosts I accidentally maimed. / I was supposed to impress, but I nearly flatlined- / I bonded... / With the emergency... / E-e-e-exit sign!" */
const FINAL: Section = {
  name: 'last chorus',
  chords: ['C F', 'G7', 'Bb', 'Bb F', 'F', 'C', 'G7', 'G7', 'C'],
  tune: [
    'r q, G4 e, G4 q., F4 e, F4 e', // a-shamed, of how
    'G4 s, G4 s, G4 e, G4 q, D#4 e, G4 e, A#4 s, A#4 s, A#4 s, A#4 s', // man-y fake ghosts I ac-ci-den-tal-ly
    'A#4 h, r q, A#4 q', // maimed. I
    'F4 e, A#4 s, F4 s, A#4 e, A#4 e, G#4 h', // was sup-posed to im-press,
    'r q, G#4 e, G#4 e, F4 e, F4 e, F4 e, F4 e\\', // but I near-ly flat-lined-
    'r e, G4 e, C5 e, C5 e, D5 h', // I bond-ed... with
    'r e, D4 e, G4 s, G4 s, G4 s, G4 s, _ h', // the e-mer-gen-cy...
    'G4 s!, G4 s, G4 s, G4 s, G4 q, G4 h', // E-e-e-ex-it
    '~C5 h., r q', // sign!
  ],
};

/** "So yeah. The date went well. / No trauma. Except mine. / Just me... / And my sword... / And the exit sign." Slowing down to nothing. */
const OUTRO: Section = {
  name: 'outro',
  chords: ['C', 'F', 'C', 'F', 'G7', 'C'],
  tune: [
    'G4 e, G4 e, G4 e, G4 e, E4 q, C4 q', // So yeah. The date went well.
    'r e, D4 e, F4 e, F4 e, r e, F4 e, E4 e, D4 e', // No trau-ma. Ex-cept mine.
    'E4 q, G4 q, r h', // Just me...
    'r q, F4 e, F4 e, A4 q, r q', // and my sword...
    'r e, G4 e, G4 e, E5 e, D5 q, C5 q', // and the ex-it sign.
    'C5 w', //
  ],
};

// ---- the band -----------------------------------------------------------------------------

/** Melodic channels: the trumpet and the trombone (or the theremin), the bass, three comping voices. */
const LEAD = 0;
const TWIN = 1;
const BASSCH = 2;
const CHORD = [3, 4, 5];

/** Grooves on a sixteenth grid. */
const GROOVE: Record<string, Groove> = {
  /** Brushes: the snare sweeping on two and four, the hat on the offbeats (patter). */
  brush: { k: 'x.......x.......', s: '....x..x....x..x', h: '..x...x...x...x.' },
  /** The Broadway chorus: kick on one and three, a backbeat, eighth hats. */
  show: { k: 'x.......x.....x.', s: '....X.......X...', h: 'x.x.x.x.x.x.x.x.' },
  push: { k: 'x.....x.x.x.....', s: '....X.......X.xx', h: 'x.x.x.x.x.x.x.x.' },
  fill: { k: 'x.......x.......', s: '....X.....x.XxXX', t: '..........xx..xx', h: 'x.x.x.x.x.x.....' },
  /** The zombie march: oom on one and three, snare rolls. */
  march: { k: 'x.......x.......', s: '....x.xx....x.xx', h: '..x...x...x...x.' },
  /** Creeping: just the hat ticking and a kick now and then. */
  creep: { k: 'x...............', h: '..x...x...x...x.' },
  tick: { h: 'x...x...x...x...' },
  half: { k: 'x...............', s: '........X.......', h: 'x...x...x...x...' },
  none: {},
};

type Comp = 'stride' | 'stab' | 'brass' | 'march' | 'pipes' | 'strings' | 'pizz' | 'swell' | 'none';

interface Play {
  comp: Comp;
  /** The singer: the muted trumpet alone, the open trumpet with the trombone under it, or nobody. */
  sing: 'muted' | 'open' | 'brass' | 'none';
  /** The bass: stride (root, fifth), walking, the tuba's oompah, held, or none. */
  bass: 'stride' | 'walk' | 'tuba' | 'hold' | 'none';
  /** A groove name per bar (the last one repeats). */
  drums: string[];
  vel?: number;
  shift?: number;
}

class Arranger {
  readonly fx: Fx;
  bar = 0;
  constructor(bpm = BPM) {
    const w = new Writer(bpm);
    this.fx = new Fx(w);
    this.fx.open(LEAD, MUTED).open(TWIN, TROMBONE).open(BASSCH, UPRIGHT);
    CHORD.forEach((ch) => this.fx.open(ch, PIANO));
    this.fx.open(DRUM.kick, KICK).open(DRUM.snare, SNARE).open(DRUM.tom, TOM).open(DRUM.cymbal, CRASH).open(DRUM.hat, HAT);
  }

  get w(): Writer {
    return this.fx.w;
  }

  section(s: Section, p: Play): this {
    const fx = this.fx;
    const at0 = this.bar * 4;
    const vel = p.vel ?? 100;
    const shift = p.shift ?? 0;
    fx.marker(at0, s.name);
    const patch = (inst: Uint8Array) => CHORD.forEach((ch) => fx.program(ch, at0, inst));
    if (p.comp === 'stride' || p.comp === 'stab') patch(PIANO);
    if (p.comp === 'brass' || p.comp === 'march') patch(BRASS);
    if (p.comp === 'swell') patch(SWELL[0]);
    if (p.comp === 'pipes') patch(PIPES);
    if (p.comp === 'strings') patch(STRINGS);
    if (p.comp === 'pizz') patch(CELESTA);
    fx.program(BASSCH, at0, p.bass === 'tuba' ? TUBA : UPRIGHT);
    if (p.sing === 'muted') fx.program(LEAD, at0, MUTED);
    if (p.sing === 'open' || p.sing === 'brass') fx.program(LEAD, at0, TRUMPET);
    if (p.sing === 'brass') fx.program(TWIN, at0, TROMBONE);
    s.tune.forEach((bar, i) => {
      const at = at0 + i * 4;
      if (p.sing !== 'none') {
        const len = fx.phrase(LEAD, at, bar, vel + 6, shift, p.sing === 'muted' ? 0.8 : 0.92);
        if (Math.abs(len - 4) > 1e-6) throw new Error(`${s.name} bar ${i + 1} is ${len} beats: ${bar}`);
        if (p.sing === 'brass') fx.phrase(TWIN, at, bar, vel - 14, shift - 12);
      }
      const names = s.chords[i].split(' ');
      names.forEach((name, k) => {
        const t = at + (k * 4) / names.length;
        const span = 4 / names.length;
        const v = voicing(name, shift);
        const r = root(name, shift);
        // the chords
        if (p.comp === 'stride') for (let b = 1; b < span; b += 2) v.forEach((n, j) => fx.note(CHORD[j], t + b, 1, n + 12, vel - 34, 0.45));
        if (p.comp === 'stab') for (let b = 0; b < span; b++) v.forEach((n, j) => fx.note(CHORD[j], t + b, 1, n + 12, vel - (b % 2 ? 30 : 38), 0.4));
        if (p.comp === 'brass') {
          // a hit on the beat, the off-beat push, then held
          v.forEach((n, j) => fx.note(CHORD[j], t, 0.5, n + 12, vel - 22, 0.6));
          v.forEach((n, j) => fx.note(CHORD[j], t + 1.5, span - 1.5, n + 12, vel - 30, 0.9));
        }
        if (p.comp === 'march') for (let b = 0; b < span; b++) v.forEach((n, j) => fx.note(CHORD[j], t + b + 0.5, 0.5, n, vel - 30, 0.5));
        if (p.comp === 'pipes' || p.comp === 'strings') v.forEach((n, j) => fx.note(CHORD[j], t, span, n, vel - 30, 0.98));
        if (p.comp === 'swell') {
          v.forEach((n, j) => fx.note(CHORD[j], t, span, n + 12, vel - 20, 0.98));
          fx.swell(CHORD, t, span * 0.9, SWELL);
        }
        if (p.comp === 'pizz') {
          v.forEach((n, j) => j < 2 && fx.note(CHORD[j], t, span, n, vel - 46, 0.3));
          // the third voice tiptoes up and down the chord on one channel
          fx.arp(CHORD[2], t, span, [v[0] + 12, v[1] + 12, v[2] + 12, v[0] + 24], 0.5, vel - 40, 'updown');
        }
        // the bass
        if (p.bass === 'stride') for (let b = 0; b < span; b += 2) fx.note(BASSCH, t + b, 1, r + (b % 4 ? 7 : 0), vel - 4, 0.6);
        if (p.bass === 'walk') for (let b = 0; b < span; b++) fx.note(BASSCH, t + b, 1, r + [0, 4, 7, 9][b % 4], vel - 6, 0.7);
        if (p.bass === 'tuba') for (let b = 0; b < span; b += 2) fx.note(BASSCH, t + b, 1, r + (b % 4 ? -5 : 0), vel, 0.7);
        if (p.bass === 'hold') fx.note(BASSCH, t, span, r, vel - 10, 0.95);
      });
      const name = p.drums[Math.min(i, p.drums.length - 1)];
      const groove = GROOVE[name];
      if (!groove) throw new Error(`No groove ${name}`);
      if (name !== 'none') this.w.drums(at, groove, vel - 16);
    });
    this.bar += s.tune.length;
    return this;
  }

  /** A tom fill and a cymbal roll up into the next bar (`beats` long, ending on it). */
  roll(beats = 1, toms = [50, 48, 45, 43]): this {
    const at = this.bar * 4 - beats;
    this.fx.drumRoll(DRUM.cymbal, at, beats, 0.25, 30, 110);
    this.fx.drumRoll(DRUM.tom, at, beats, 0.25, 70, 120, toms);
    return this;
  }

  /** A band hit on the downbeat of the next bar: the kick, a crash and the brass stabbing the chord. */
  hit(chord: string, shift = 0): this {
    const at = this.bar * 4;
    CHORD.forEach((ch) => this.fx.program(ch, at, BRASS));
    this.fx.note(DRUM.kick, at, 1, 36, 127);
    this.fx.drumRoll(DRUM.cymbal, at, 0.25, 0.25, 125, 125);
    voicing(chord, shift).forEach((n, j) => this.fx.note(CHORD[j], at, 1, n + 12, 116, 0.9));
    this.fx.note(BASSCH, at, 1, root(chord, shift), 120, 0.8);
    return this;
  }

  /** Beats of silence (a dramatic pause). */
  pause(beats: number): this {
    this.bar += beats / 4;
    return this;
  }

  /** The organ's Toccata (two bars): the mordent, its run down, a diminished chord, thunder under it. */
  toccata(vel = 100): this {
    const at = this.bar * 4;
    this.fx.program(LEAD, at, PIPES);
    this.fx.program(TWIN, at, PIPES);
    this.fx.phrase(LEAD, at, 'G5 s, F5 s, G5 h, r q.', vel);
    this.fx.phrase(TWIN, at, 'G4 s, F4 s, G4 h, r q.', vel - 10);
    this.fx.phrase(LEAD, at + 4, 'F5 s, D#5 s, D5 s, C5 s, B4 h, C5 q', vel - 4);
    this.fx.phrase(TWIN, at + 4, 'F4 s, D#4 s, D4 s, C4 s, B3 h, C4 q', vel - 14);
    this.section(TOCCATA, { comp: 'pipes', sing: 'none', bass: 'hold', drums: ['none'], vel: vel - 8 });
    // thunder: a cymbal roll and the toms tumbling under the diminished chord
    this.fx.drumRoll(DRUM.cymbal, at + 4, 3, 0.25, 40, 100);
    this.fx.drumRoll(DRUM.tom, at + 5, 2, 0.25, 90, 50, [45, 43, 41, 40]);
    return this;
  }

  /** The werewolf's howl on the twin channel (a glide up, a waver, a glide down), from beat `at`. */
  howl(at: number, vel = 96): this {
    this.fx.program(TWIN, at, THEREMIN);
    const top = this.fx.slide(TWIN, at, 64, 76, 4, vel);
    this.fx.note(TWIN, top, 1.5, 76, vel, 1);
    this.fx.slide(TWIN, top + 1.5, 75, 67, 6, vel - 20);
    return this;
  }

  cmf(): Uint8Array {
    if (!Number.isInteger(this.bar)) throw new Error(`The song ends mid-bar (${this.bar})`);
    return this.fx.cmf(this.bar);
  }
}

const slice = (s: Section, from: number, to = s.tune.length): Section => ({ name: s.name, chords: s.chords.slice(from, to), tune: s.tune.slice(from, to) });
const many = (n: number, name: string, last = name) => [...new Array(n - 1).fill(name), last];

function verse(a: Arranger, s: Section, vel = 96): void {
  a.section(s, { comp: 'stride', sing: 'muted', bass: 'stride', drums: many(s.tune.length, 'brush'), vel });
}

function chorus(a: Arranger, s: Section, o: { vel?: number; shift?: number; comp?: Comp } = {}): void {
  a.section(s, { comp: o.comp ?? 'brass', sing: 'brass', bass: 'walk', drums: [...many(s.tune.length - 1, 'show', 'push'), 'fill'], vel: o.vel ?? 106, shift: o.shift });
}

/** Bars of the band alone. */
function vamp(a: Arranger, name: string, chords: string[], comp: Comp = 'stride', drums = 'brush', bass: Play['bass'] = 'stride'): void {
  a.section({ name, chords, tune: chords.map(() => 'r w') }, { comp, sing: 'none', bass, drums: [drums], vel: 96 });
}

/** The chorus with "GET DOWN!": the band stops dead for the hit, then comes back in. */
function bigChorus(a: Arranger, vel = 106): void {
  chorus(a, slice(CHORUS, 0, 4), { vel });
  // "GET DOWN!": the hit on the downbeat
  a.hit('C');
  a.section(slice(CHORUS, 4, 5), { comp: 'none', sing: 'brass', bass: 'none', drums: ['none'], vel: vel + 4 });
  a.roll(0.5, [48, 45]);
  chorus(a, slice(CHORUS, 5), { vel });
}

/** Title: the organ, the thunder, the chorus with "GET DOWN!", and a tag; the werewolf howls. */
export function titleSong(): Uint8Array {
  const a = new Arranger();
  a.toccata();
  a.roll(1).hit('C');
  bigChorus(a);
  a.section({ name: 'tag', chords: ['C', 'C'], tune: ['r h, G4 e, G4 e, C5 e, C5 e', '~C5 h, r h'] }, { comp: 'swell', sing: 'brass', bass: 'hold', drums: ['half', 'none'], vel: 104 });
  a.howl(a.bar * 4 - 3.5, 90);
  return a.cmf();
}

/** Story pages: the organ, then verses 1 and 2 (the brass sting on "fled"). */
export function storySong(): Uint8Array {
  const a = new Arranger();
  a.toccata(94);
  verse(a, VERSE1, 92);
  vamp(a, 'vamp', ['C', 'G7']);
  verse(a, slice(VERSE2, 0, 5), 92);
  a.hit('Bb');
  a.section(slice(VERSE2, 5), { comp: 'none', sing: 'muted', bass: 'none', drums: ['none'], vel: 92 });
  a.section({ name: 'hold', chords: ['C'], tune: ['r w'] }, { comp: 'pipes', sing: 'none', bass: 'hold', drums: ['tick'], vel: 88 });
  return a.cmf();
}

/**
 * The four levels: the verses in the fog hall (patter over stride piano, the organ between),
 * the chorus in the zombie parade (an oompah march between, GET DOWN! stopping the band), the
 * werewolf verse and the bridge in the fake spiderwebs (pizzicato, strings, the howl), and the
 * breakdown and the last chorus by the emergency exit, as big as the pit band gets.
 */
export function levelSongs(): Uint8Array[] {
  const one = new Arranger();
  one.toccata(96);
  verse(one, VERSE1);
  vamp(one, 'vamp', ['C', 'G7']);
  verse(one, slice(VERSE2, 0, 5));
  one.hit('Bb');
  one.section(slice(VERSE2, 5), { comp: 'none', sing: 'muted', bass: 'none', drums: ['none'], vel: 96 });
  vamp(one, 'creep', ['C', 'Cdim'], 'pipes', 'creep', 'hold');
  verse(one, VERSE3);
  vamp(one, 'vamp', ['C', 'G7']);

  const two = new Arranger(104);
  vamp(two, 'zombie march', ['Cm', 'G7', 'Cm', 'G7'], 'march', 'march', 'tuba');
  bigChorus(two);
  vamp(two, 'zombie march', ['Cm', 'G7', 'Cm', 'G7'], 'march', 'march', 'tuba');
  bigChorus(two, 110);
  vamp(two, 'out', ['C', 'G7'], 'stab', 'show', 'walk');

  const three = new Arranger(96);
  vamp(three, 'creep', ['C', 'C'], 'pizz', 'creep', 'stride');
  three.howl(2, 92);
  three.section(VERSE4, { comp: 'pizz', sing: 'muted', bass: 'stride', drums: ['creep'], vel: 96 });
  three.section(BRIDGE, { comp: 'strings', sing: 'open', bass: 'hold', drums: ['tick'], vel: 94 });
  vamp(three, 'creep', ['C', 'Cdim'], 'pizz', 'creep', 'stride');
  three.howl((three.bar - 2) * 4 + 1, 92);

  const four = new Arranger();
  four.section(BREAKDOWN, { comp: 'stride', sing: 'muted', bass: 'stride', drums: ['brush', 'brush', 'brush', 'fill'], vel: 92 });
  finalChorus(four, 108);
  vamp(four, 'exit vamp', ['C', 'F', 'G7', 'C'], 'stab', 'show', 'walk');
  return [one.cmf(), two.cmf(), three.cmf(), four.cmf()];
}

/** The last chorus, as big as it gets: the brass swelling on "with the emergency...", the stutter, a roll and the hit. */
function finalChorus(a: Arranger, vel = 108): void {
  chorus(a, slice(FINAL, 0, 5), { vel });
  a.section(slice(FINAL, 5, 7), { comp: 'swell', sing: 'brass', bass: 'hold', drums: ['tick'], vel: vel - 6 });
  // "E-e-e-exit": the band stutters with the singer, the brass on every sixteenth
  const at = a.bar * 4;
  a.section(slice(FINAL, 7, 8), { comp: 'none', sing: 'brass', bass: 'hold', drums: ['none'], vel });
  voicing('G7').forEach((n, j) => a.fx.stutter(CHORD[j], at, n + 12, 4, 0.25, vel, 0.95));
  a.roll(2);
  a.hit('C');
  a.section(slice(FINAL, 8), { comp: 'swell', sing: 'brass', bass: 'hold', drums: ['none'], vel: vel + 6 });
}

/** Won: the breakdown (the Bravery Badge), the last chorus, the outro; a single wolf howl. Curtain. */
export function wonSong(): Uint8Array {
  const a = new Arranger();
  a.section(slice(BREAKDOWN, 1), { comp: 'stride', sing: 'muted', bass: 'stride', drums: ['brush', 'brush', 'fill'], vel: 94 });
  finalChorus(a, 110);
  a.section(OUTRO, { comp: 'strings', sing: 'muted', bass: 'hold', drums: ['none'], vel: 84 });
  a.howl(a.bar * 4 - 3, 84);
  return a.cmf();
}

/** Lost: "I was supposed to impress, but I nearly flatlined", slow, and the sad trombone. */
export function lostSong(): Uint8Array {
  const a = new Arranger(76);
  a.section(slice(FINAL, 3, 5), { comp: 'strings', sing: 'muted', bass: 'hold', drums: ['tick'], vel: 86 });
  const at = a.bar * 4;
  a.fx.program(TWIN, at, SADBONE);
  a.fx.phrase(TWIN, at, 'D4 q, C#4 q, C4 q, B3 q', 96);
  a.fx.phrase(TWIN, at + 4, 'B3 h\\\\, r h', 96);
  a.section({ name: 'wah wah', chords: ['G7', 'C'], tune: ['r w', 'r w'] }, { comp: 'none', sing: 'none', bass: 'none', drums: ['none', 'half'], vel: 80 });
  return a.cmf();
}

/** The menu: the whole song in order, verse 1 to the outro. */
export function wholeSong(): Uint8Array {
  const a = new Arranger();
  verse(a, VERSE1);
  vamp(a, 'vamp', ['C', 'G7']);
  verse(a, slice(VERSE2, 0, 5));
  a.hit('Bb');
  a.section(slice(VERSE2, 5), { comp: 'none', sing: 'muted', bass: 'none', drums: ['none'], vel: 96 });
  vamp(a, 'vamp', ['C', 'C']);
  verse(a, VERSE3);
  bigChorus(a);
  vamp(a, 'break', ['C', 'G7', 'C']);
  a.section(VERSE4, { comp: 'pizz', sing: 'muted', bass: 'stride', drums: ['creep'], vel: 96 });
  a.section(BRIDGE, { comp: 'strings', sing: 'open', bass: 'hold', drums: ['tick'], vel: 94 });
  a.section(BREAKDOWN, { comp: 'stride', sing: 'muted', bass: 'stride', drums: ['brush', 'brush', 'brush', 'fill'], vel: 92 });
  finalChorus(a);
  vamp(a, 'break', ['C', 'F', 'C']);
  a.section(OUTRO, { comp: 'strings', sing: 'muted', bass: 'hold', drums: ['none'], vel: 84 });
  a.howl(a.bar * 4 - 3, 84);
  return a.cmf();
}

/** Every song, by file name, for the build and the preview. */
export function allSongs(): Record<string, Uint8Array> {
  const levels = levelSongs();
  return { title: titleSong(), story: storySong(), foyer: levels[0], parade: levels[1], webs: levels[2], exit: levels[3], won: wonSong(), lost: lostSong(), menu: wholeSong() };
}

export { voicing, root };
