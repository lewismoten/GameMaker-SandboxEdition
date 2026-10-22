// The soundtrack: "Where's the Remote?" (The Bard of Bizarre, 1995), a bouncy pop-rock moan
// about the clicker, arranged for the Sound Blaster's OPL2 FM chip as Creative Music Files in
// rhythm mode, with the tricks in games/kit/songFx.ts where they fit the joke:
//   - the singer is a kazoo (two buzzing operators), and in the choruses its vibrato twin
//     doubles it, a hair apart, so the two beat like a gang of kazoos;
//   - "re-MOTE?!" scoops up into its note and "doom" falls off it (stepped glides; no pitch bend);
//   - the title's hook glitches like a tape in a chewed-up VCR: "re-re-re-MOTE" (a stutter);
//   - the VCR whirrs: a filter sweep by program changes under the held chords of the breaks;
//   - in the void between the cushions the bass is the bass drum, pitched (an 808 boom), a
//     one-channel arpeggio twinkles, a theremin wails in semitone steps, and "the void of
//     eternal doom" echoes off into nothing;
//   - the living room ride is a calliope: the organ pumps oom-pah under the last chorus;
//   - a dramatic pause before "But wait - what's this, beneath my thigh?", and a cymbal roll
//     and a band hit as "There you are, you sneaky guy" finds it;
//   - a marker at every section (PLAYGAME skips them; tools/songPreview.ts reads them).
//
// The notes come from games/remote/tools/analyze.py run over the recording (which is not in
// the repo): 120 BPM in 4/4, A minor (A minor, E minor, D minor, C and G; an E major chord's
// G-sharp in the tune), 64 bars from the first downbeat at 0.11 s. The sung lines:
//   intro                                     0.1 -   6.1  (bars 0-2)
//   verse 1 "I sat down with snacks..."        6.1 -  24.1  (3-11; "Where's the re-" at 23.3)
//   chorus 1 "Where's the remote?!"           24.1 -  40.1  (12-19)
//   break                                     40.1 -  46.1  (20-22)
//   verse 2 "I flipped the blanket..."        46.1 -  64.1  (23-31; "Check your hand" 59.8)
//   chorus 2 "Is it playing a game?"          64.1 -  80.1  (32-39; "eternal doom" 79.5)
//   break                                     80.1 -  86.1  (40-42)
//   bridge "I found ten pennies..."           86.1 - 104.1  (43-51; "a tiny raccoon" 94.0)
//   last chorus "My will's worn thin"        104.1 - 122.1  (52-60; "There you are" 114.1)
//   outro                                    122.1 - 128.5  (61-63)
import { sbi } from '../../../kit/music';
import { Writer, type Groove } from '../../../kit/song';
import { DRUM, Fx, boomPatch, detuned, sweep, waved } from '../../../kit/songFx';

export const BPM = 120;

// ---- the patches --------------------------------------------------------------------------

/** The singer as a kazoo: a buzzing, nasal reed (feedback up, a pulse-sine carrier). */
const KAZOO = sbi({ modChar: 0x21, carChar: 0x61, modLevel: 0x16, carLevel: 0x00, modAD: 0x95, carAD: 0x84, modSR: 0x16, carSR: 0x17, modWave: 1, carWave: 3, feedback: 0x0e });
/** Its twin: the vibrato bit flipped, so the two beat like a gang of kazoos. */
const KAZOO2 = detuned(KAZOO);
/** Crunchy rhythm guitar: a short, bright pluck with a bit of growl. */
const GUITAR = sbi({ modChar: 0x01, carChar: 0x01, modLevel: 0x14, carLevel: 0x03, modAD: 0xf4, carAD: 0xf5, modSR: 0x25, carSR: 0x46, modWave: 1, feedback: 0x0e });
/** A combo organ (the VCR's whirr is this, swept). */
const ORGAN = sbi({ modChar: 0x22, carChar: 0x21, modLevel: 0x18, carLevel: 0x06, modAD: 0xf0, carAD: 0xf0, modSR: 0x0f, carSR: 0x0f, carWave: 1, feedback: 0x06 });
/** The VCR whirring up: the organ swept from muffled to bright in 8 steps. */
const WHIRR = sweep(ORGAN, 8, { mod: 50, car: 30 }, { mod: 12, car: 6 });
/** The calliope on the living room ride: a breathy, piping organ. */
const CALLIOPE = waved(sbi({ modChar: 0x62, carChar: 0x21, modLevel: 0x1a, carLevel: 0x04, modAD: 0xf2, carAD: 0xf2, modSR: 0x0f, carSR: 0x0f, feedback: 0x08 }), 2, 1);
/** Fingered bass. */
const BASS = sbi({ modChar: 0x01, carChar: 0x01, modLevel: 0x18, carLevel: 0x00, modAD: 0xf5, carAD: 0xf4, modSR: 0x35, carSR: 0x46, feedback: 0x0a });
/** The theremin in the void: a pure, wobbling sine (vibrato on). */
const THEREMIN = sbi({ modChar: 0x60, carChar: 0x61, modLevel: 0x3f, carLevel: 0x00, modAD: 0x52, carAD: 0x63, modSR: 0x06, carSR: 0x07, feedback: 0x00 });
/** A cold pad for the void (soft attack, half-sine). */
const VOID = sbi({ modChar: 0xa1, carChar: 0x21, modLevel: 0x26, carLevel: 0x02, modAD: 0x42, carAD: 0x43, modSR: 0x05, carSR: 0x06, modWave: 1, feedback: 0x0a });
/** The void's pad dissolving to nothing (8 steps). */
const DISSOLVE = sweep(VOID, 8, { car: 2 }, { car: 40 });
/** The bass drum as an 808 boom in the void. */
const BOOM = boomPatch({ decay: 3, release: 6 });
/** The bass drum as a punchy kick everywhere else. */
const KICK = boomPatch({ decay: 9, release: 9, growl: 0x16 });
/** A tight snare and a ticking hi-hat. */
const SNARE = sbi({ modChar: 0x02, carChar: 0x00, modLevel: 0x00, carLevel: 0x00, modAD: 0xf8, carAD: 0x00, modSR: 0x07, carSR: 0x00, feedback: 0x00 });
const HAT = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x07, carLevel: 0x00, modAD: 0xfa, carAD: 0x00, modSR: 0x09, carSR: 0x00, feedback: 0x00 });
/** Tom-toms, tuned for fills. */
const TOM = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x02, carLevel: 0x00, modAD: 0xf6, carAD: 0x00, modSR: 0x36, carSR: 0x00, feedback: 0x00 });
/** A crash cymbal that can roll. */
const CRASH = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x05, carLevel: 0x00, modAD: 0xd4, carAD: 0x00, modSR: 0x04, carSR: 0x00, feedback: 0x00 });

// ---- chords -------------------------------------------------------------------------------

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** A chord name ("Am", "E", "G7", "C") as its root pitch class and intervals. */
function shape(name: string): { pc: number; iv: number[] } {
  const m = /^([A-G])(m?)(7?)$/.exec(name);
  if (!m) throw new Error(`Unknown chord ${name}`);
  return { pc: PC[m[1]], iv: [0, m[2] ? 3 : 4, m[3] ? 10 : 7] };
}

const fold = (pc: number, lo: number) => lo + ((pc - lo + 120) % 12);

/** Three comping voices, low to high, in G3..F#4. */
function voicing(name: string, shift = 0): number[] {
  const { pc, iv } = shape(name);
  return iv.map((i) => fold(pc + i + shift, 55)).sort((a, b) => a - b);
}

/** The bass root (E1..D#2), and for the boom an octave up. */
const root = (name: string, shift = 0) => fold(shape(name).pc + shift, 40);

// ---- the song's material ------------------------------------------------------------------

interface Section {
  name: string;
  /** One chord per bar, or two ("C Dm": half a bar each). */
  chords: string[];
  /** One bar of the singer per string (4 beats; kit/songFx tones(), with slides). */
  tune: string[];
}

const INTRO: Section = { name: 'intro', chords: ['Am', 'Em', 'Am'], tune: ['r w', 'r w', 'r w'] };

/** "I sat down with snacks, the couch is a throne, / Netflix is loaded, I'm in the zone. / But fate has struck with cruel delight- / The remote is gone, it vanished from sight." */
const VERSE1: Section = {
  name: 'verse 1',
  chords: ['Em', 'Am', 'Am', 'Am', 'Em', 'Am', 'Am', 'Dm', 'Dm Am'],
  tune: [
    'r h, r q, B4 e, A4 e', // I sat
    'E4 q, A4 e, A4 q, r e, C5 e, G#4 e', // down with snacks, the couch
    'G#4 e, G#4 e, G#4 h, r q', // is a throne.
    'A4 e, A4 e, E4 e, A4 q, r e, r e, C5 e', // Net-flix is load-ed, I'm
    'B4 e, B4 e, E5 h, r e, B4 e', // in the zone. But
    'B4 e, A4 e, r e, D5 q, G4 q, r e', // fate has struck with
    'C5 e, A4 q., r q, D5 e, E5 e', // cruel de-light. The re-
    'F4 e, F4 q, F4 q, r q, D4 e', // -mote is gone, it
    'F4 e, D4 e, E4 q, r e, C5 e, B4 e, A4 e', // van-ished from sight. Where's the re-
  ],
};

/** "Where's the remote?! I just had it here! / Checked the cushions, checked my rear. / Lifted the dog, looked under the cat, / Even asked Alexa where it's at. / This couch is a portal, a Bermuda zone- / Where remotes disappear and dreams are blown." */
const CHORUS1: Section = {
  name: 'chorus 1',
  chords: ['Am', 'Am E', 'E', 'Am', 'C Dm', 'E', 'C Dm', 'Am'],
  tune: [
    '~E5 q., r e, A4 q, C5 e, D5 e', // -MOTE?! I just
    'D5 q, D5 e, D5 q, r e, G#4 e, B4 e', // had it here! Checked the
    'D5 q, C5 e, G4 e, A4 q, r q', // cush-ions, checked my rear.
    'r h, B4 e, C5 e, C5 e, B4 e', // Lift-ed the dog, looked
    'B4 e, B4 e, B4 e, A4 e, A4 s, A4 s, A#4 e, C5 e, C5 e', // un-der the cat. E-ven asked A-lex-
    'G#4 e, F#4 e, B4 e, A4 q., r e, C5 e', // -a where it's at. This
    'C5 e, C5 s, C5 s, C5 e, B4 e, B4 s, A4 s, A4 s, A4 s, A4 q', // couch is a por-tal, a Ber-mu-da zone,
    'A4 s, A4 s, A#4 e, B4 s, B4 s, C5 e, C5 e, B4 e, A4 q', // where re-motes dis-ap-pear and dreams are blown.
  ],
};

/** "I flipped the blanket, I kicked the floor, / Opened the fridge- who knows anymore? / Called my mom just in case she knew, / She said "Check your hand," but nope, not true." */
const VERSE2: Section = {
  name: 'verse 2',
  chords: ['Am', 'Am', 'Am', 'Am', 'Em', 'Dm', 'Am', 'Dm', 'E Am'],
  tune: [
    'r h, r q, A4 q', // I
    'A4 q, A4 e, E4 e, E4 q, r e, E4 e', // flipped the blan-ket, I
    'G#4 q, G#4 e, A4 q., r q', // kicked the floor.
    'E4 e, E4 e, A4 e, E4 e, E4 q, r e, E4 e', // O-pened the fridge, who
    'D4 e, D4 e, D4 e, D4 q, r q, D4 e', // knows a-ny-more? Called
    'D4 e, B4 q, r e, C5 e, A4 e, C5 q', // my mom, just in case
    'E5 e, E5 q, r e, F4 e, F4 e, F4 q', // she knew. She said, "Check
    'D4 e, E4 q., r q, E4 e, E4 e', // your hand," but nope,
    'C5 e, B4 q, r e, r e, C5 e, B4 e, A4 e', // not true. Where's the re-
  ],
};

/** "Where's the remote?! Is it playing a game? / Does it sneak away and change its name? / I just wanna binge my cooking show, / But now I'm screaming, moving slow. / It's like it grew legs and left the room- / Straight into the void of eternal doom." */
const CHORUS2: Section = {
  name: 'chorus 2',
  chords: ['Am', 'G', 'G', 'Am', 'Am', 'Em', 'Am', 'Em'],
  tune: [
    '~E5 q., r e, D5 q, D5 e, D5 e', // -MOTE?! Is it
    'D5 e, D5 e, E5 e, G#4 q., B4 e, C5 e', // play-ing a game? Does it
    'D5 e, D5 e, D5 e, D5 e, B4 e, A4 e, A4 q', // sneak a-way and change its name?
    'r q, r e, B4 e, C5 e, C5 e, C5 q', // I just wan-na binge
    'A4 e, B4 e, C5 e, C5 q, B4 e, B4 e, B4 e', // my cook-ing show. But now I'm
    'B4 e, B4 e, D5 e, D5 e, B4 q, B4 e, C5 e', // scream-ing, mov-ing slow. It's like
    'B4 e, D5 e, D5 e, C5 e, B4 e, B4 e, A4 q', // it grew legs and left the room,
    'B4 s, B4 s, B4 s, B4 s, C5 e, A4 e, C5 s, C5 s, C5 s, A4 s, A4 q\\\\', // straight in-to the void of e-ter-nal doom.
  ],
};

/** "I found ten pennies, three pens, a spoon, / A sock from Christmas, a tiny raccoon (??) / But no clicker, no buttons, no guide- / Just existential panic on the living room ride." */
const BRIDGE: Section = {
  name: 'bridge',
  chords: ['Am', 'Am', 'Em', 'Am', 'Em', 'Dm E', 'C Am', 'Am', 'Am'],
  tune: [
    'r h, A4 q, r e, A4 e', // I found
    'r e, A4 q, G#4 e, G#4 e, r e, F#4 q', // ten pen-nies, three
    'G#4 q, r e, G4 e, A4 q, A4 e, A4 e', // pens, a spoon, a sock
    'r q, r e, E4 e, E4 e, E4 e, r q', // from Christ-mas,
    'E4 e, E4 e, E4 e, D4 e, D4 q, B4 e, B4 e', // a ti-ny rac-coon. But no
    'B4 e, B4 q, C5 e, A4 e, A4 q, A4 e', // click-er, no but-tons, no
    'F4 h, r e, F4 e, E4 e, E4 e', // guide. Just ex-is-
    'E4 e, E4 e, F4 e, F4 e, E4 e, E4 e, B4 e, B4 e', // -ten-tial pan-ic on the liv-ing
    'B4 e, A4 q., r e, D5 e, D5 e, E5 e', // room ride. Where's the re-
  ],
};

/** "Where's the remote?! My will's worn thin. / I might just *stand up* and press "Play" again. / But wait- what's this, beneath my thigh? / There you are, you sneaky guy. / Next time I'll tape you to my chest- / You're the worst, but also the best." */
const FINAL: Section = {
  name: 'last chorus',
  chords: ['Am', 'Am', 'Am', 'Am', 'G7 Dm', 'Em', 'Am G', 'Em', 'Am'],
  tune: [
    '~E5 q., r e, r q, r e, D5 e', // -MOTE?! My
    'B4 e, B4 e, B4 q, r e, D5 e, D5 e, B4 e', // will's worn thin. I might just
    'D5 e!, D5 e!, B4 e, C5 e, C5 q, B4 e, B4 e', // STAND UP and press "Play" a-
    'B4 q, r q, r q, r e, G4 e', // -gain. But
    'C5 q, G4 e, E4 e, B4 e, B4 e, B4 e, B4 e', // wait, what's this, be-neath my thigh?
    'F#4 e, F#4 e, E4 q, C5 e, B4 s, B4 s, B4 q', // There you are, you snea-ky guy.
    'r e, B4 e, B4 e, B4 e, C5 e, E5 e, E5 e, E5 e', // Next time I'll tape you to my
    'E5 q, E5 e, E5 e, E5 q, B4 e, B4 e', // chest. You're the worst, but al-
    'B4 e, B4 e, A4 h, r q', // -so the best.
  ],
};

const OUTRO: Section = { name: 'outro', chords: ['Am', 'Em', 'Am'], tune: ['r w', 'r w', 'r w'] };

// ---- the band -----------------------------------------------------------------------------

/** Melodic channels: the kazoo and its twin (or the glockenspiel), the bass, three for the chords. */
const LEAD = 0;
const TWIN = 1;
const BASSCH = 2;
const CHORD = [3, 4, 5];

/** Grooves on a sixteenth grid. */
const GROOVE: Record<string, Groove> = {
  rock: { k: 'x.....x.x.......', s: '....X.......X...', h: 'x.x.x.x.x.x.x.x.' },
  push: { k: 'x.....x.x.x.....', s: '....X.......X..x', h: 'x.x.x.x.x.x.x.x.' },
  fill: { k: 'x.......x.......', s: '....X.....x.XxXX', t: '..........xx..xx', h: 'x.x.x.x.x.x.....' },
  half: { k: 'x...............', s: '........X.......', h: 'x...x...x...x...' },
  tick: { h: 'x...x...x...x...' },
  pump: { k: 'x.......x.......', s: '....x.......x...', h: '..x...x...x...x.' },
  boom: { s: '........X.......', h: '..x...x...x...x.' },
  none: {},
};

type Comp = 'chug' | 'stab' | 'skank' | 'organ' | 'whirr' | 'pump' | 'void' | 'none';

interface Play {
  comp: Comp;
  /** The kazoo: alone, doubled by its twin, or not at all. */
  sing: 'solo' | 'twin' | 'none';
  /** The bass: eighths on the root, a walking pulse, the 808 boom, or none. */
  bass: 'eighths' | 'walk' | 'boom' | 'oompah' | 'none';
  /** A groove name per bar (the last one repeats). */
  drums: string[];
  vel?: number;
  shift?: number;
  /** Beats into the section where the band stops dead (the singer may go on). */
  cut?: number;
}

class Arranger {
  readonly fx: Fx;
  bar = 0;
  constructor(bpm = BPM, voidKick = false) {
    const w = new Writer(bpm);
    this.fx = new Fx(w);
    this.fx.open(LEAD, KAZOO).open(TWIN, KAZOO2).open(BASSCH, BASS);
    CHORD.forEach((ch) => this.fx.open(ch, GUITAR));
    this.fx.open(DRUM.kick, voidKick ? BOOM : KICK).open(DRUM.snare, SNARE).open(DRUM.tom, TOM).open(DRUM.cymbal, CRASH).open(DRUM.hat, HAT);
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
    if (p.comp === 'chug' || p.comp === 'stab' || p.comp === 'skank') patch(GUITAR);
    if (p.comp === 'organ' || p.comp === 'whirr') patch(p.comp === 'whirr' ? WHIRR[0] : ORGAN);
    if (p.comp === 'pump') patch(CALLIOPE);
    if (p.comp === 'void') patch(VOID);
    if (p.sing !== 'none') fx.program(LEAD, at0, KAZOO);
    if (p.sing === 'twin') fx.program(TWIN, at0, KAZOO2);
    if (p.bass === 'boom') fx.program(DRUM.kick, at0, BOOM);
    else fx.program(DRUM.kick, at0, KICK);
    const cut = at0 + (p.cut ?? Infinity);
    s.tune.forEach((bar, i) => {
      const at = at0 + i * 4;
      if (p.sing !== 'none') {
        const len = fx.phrase(LEAD, at, bar, vel + 6, shift);
        if (Math.abs(len - 4) > 1e-6) throw new Error(`${s.name} bar ${i + 1} is ${len} beats: ${bar}`);
        if (p.sing === 'twin') fx.phrase(TWIN, at, bar, vel - 10, shift);
      }
      const names = s.chords[i].split(' ');
      names.forEach((name, k) => {
        const t = at + (k * 4) / names.length;
        if (t >= cut) return;
        const span = Math.min(4 / names.length, cut - t);
        const v = voicing(name, shift);
        const r = root(name, shift);
        // the chords
        if (p.comp === 'chug') for (let e = 0; e < span; e += 0.5) v.forEach((n, j) => fx.note(CHORD[j], t + e, 0.5, n, vel - (e % 1 ? 40 : 30), 0.6));
        if (p.comp === 'stab') for (let b = 0; b < span; b++) v.forEach((n, j) => fx.note(CHORD[j], t + b, 1, n, vel - 30, 0.45));
        if (p.comp === 'skank') for (let b = 0; b < span; b++) v.forEach((n, j) => fx.note(CHORD[j], t + b + 0.5, 0.5, n + 12, vel - 34, 0.5));
        if (p.comp === 'organ') v.forEach((n, j) => fx.note(CHORD[j], t, span, n, vel - 36, 0.98));
        if (p.comp === 'whirr') {
          v.forEach((n, j) => fx.note(CHORD[j], t, span, n, vel - 26, 0.98));
          fx.swell(CHORD, t, span * 0.9, WHIRR);
        }
        if (p.comp === 'pump') for (let b = 0; b < span; b++) v.forEach((n, j) => fx.note(CHORD[j], t + b + 0.5, 0.5, n + 12, vel - 30, 0.7));
        if (p.comp === 'void') {
          v.forEach((n, j) => j < 2 && fx.note(CHORD[j], t, span, n, vel - 30, 0.98));
          // the third voice twinkles the chord on one channel (the chiptune arpeggio)
          fx.arp(CHORD[2], t, span, [v[0] + 12, v[1] + 12, v[2] + 12, v[0] + 24], 0.25, vel - 44, 'updown');
        }
        // the bass
        if (p.bass === 'eighths') for (let e = 0; e < span; e += 0.5) fx.note(BASSCH, t + e, 0.5, r + (e === 1.5 ? 12 : 0), vel - (e % 1 ? 10 : 0), 0.8);
        if (p.bass === 'walk') for (let b = 0; b < span; b++) fx.note(BASSCH, t + b, 1, r + [0, 7, 12, 7][b % 4], vel - 4, 0.8);
        if (p.bass === 'oompah') for (let b = 0; b < span; b++) fx.note(BASSCH, t + b, 0.5, r + (b % 2 ? 7 : 0), vel, 0.8);
        if (p.bass === 'boom') fx.boom(t, span, r + 12, vel);
      });
      const name = p.drums[Math.min(i, p.drums.length - 1)];
      const groove = GROOVE[name];
      if (!groove) throw new Error(`No groove ${name}`);
      const steps = Math.max(0, Math.min(16, Math.round((cut - at) * 4)));
      const cutGroove: Groove = Object.fromEntries(Object.entries(groove).map(([d, grid]) => [d, grid!.slice(0, steps).padEnd(16, '.')]));
      // the 808's channel is the bass: no kick under it
      if (p.bass === 'boom') delete cutGroove.k;
      if (steps > 0) this.w.drums(at, cutGroove, vel - 14);
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

  /** A band hit on the downbeat of the next bar: the kick, a crash and the chord stabbed. */
  hit(chord: string, shift = 0): this {
    const at = this.bar * 4;
    this.fx.note(DRUM.kick, at, 1, 36, 127);
    this.fx.drumRoll(DRUM.cymbal, at, 0.25, 0.25, 125, 125);
    voicing(chord, shift).forEach((n, j) => this.fx.note(CHORD[j], at, 0.5, n + 12, 110, 0.9));
    return this;
  }

  /** Beats of silence (a dramatic pause). */
  pause(beats: number): this {
    this.bar += beats / 4;
    return this;
  }

  cmf(): Uint8Array {
    if (!Number.isInteger(this.bar)) throw new Error(`The song ends mid-bar (${this.bar})`);
    return this.fx.cmf(this.bar);
  }
}

const rock = (n: number, last = 'fill') => [...new Array(n - 1).fill('rock'), last];

/** The intro: the VCR whirrs up under Am - Em - Am, the hats ticking like its clock. */
function intro(a: Arranger, comp: Comp = 'whirr'): void {
  a.section(INTRO, { comp, sing: 'none', bass: 'walk', drums: ['tick', 'tick', 'fill'], vel: 96 });
}

function verse(a: Arranger, s: Section, vel = 98): void {
  a.section(s, { comp: 'skank', sing: 'solo', bass: 'walk', drums: rock(s.tune.length), vel });
}

function chorus(a: Arranger, s: Section, o: { vel?: number; shift?: number; comp?: Comp; sing?: Play['sing'] } = {}): void {
  a.section(s, { comp: o.comp ?? 'chug', sing: o.sing ?? 'twin', bass: 'eighths', drums: [...rock(s.tune.length - 1, 'push'), 'fill'], vel: o.vel ?? 106, shift: o.shift });
}

/** A break: the VCR whirrs (or the organ just holds), the band vamps. */
function vamp(a: Arranger, name: string, bars: number, comp: Comp = 'whirr'): void {
  a.section({ name, chords: new Array(bars).fill('Am'), tune: new Array(bars).fill('r w') }, { comp, sing: 'none', bass: 'eighths', drums: rock(bars), vel: 96 });
}

/** The void: the bridge over the 808 boom, the arpeggio twinkling, a theremin wailing. */
function bridge(a: Arranger, vel = 96): void {
  const at = a.bar * 4;
  a.section(BRIDGE, { comp: 'void', sing: 'solo', bass: 'boom', drums: ['boom'], vel });
  // the theremin glides up and down between the lines (semitone steps on the twin's channel)
  a.fx.program(TWIN, at, THEREMIN);
  for (const [beat, from, to] of [[1, 57, 69], [12.5, 69, 62], [17, 64, 76], [26, 76, 64]] as const) a.fx.slide(TWIN, at + beat, from, to, 6, vel - 24);
}

/** Title: the VCR whirrs, the hook glitches "re-re-re-MOTE?!", and the first chorus. */
export function titleSong(): Uint8Array {
  const a = new Arranger();
  vamp(a, 'whirr', 2);
  // the tape chews: "where's the re- re- re-" stuttering into the downbeat
  const at = a.bar * 4 - 2;
  a.fx.phrase(LEAD, at, 'C5 e, B4 e', 110);
  a.fx.stutter(LEAD, at + 1, 69, 4, 0.25, 112, 0.85);
  a.roll(1).hit('Am');
  chorus(a, CHORUS1);
  a.section({ name: 'tag', chords: ['Am', 'Am'], tune: ['r h, C5 e, B4 e, A4 e, ~E5 e', 'E5 q, r q, r h'] }, { comp: 'organ', sing: 'twin', bass: 'eighths', drums: ['half', 'none'], vel: 100 });
  return a.cmf();
}

/** Story pages: the intro and verse 1. */
export function storySong(): Uint8Array {
  const a = new Arranger();
  intro(a);
  verse(a, VERSE1, 94);
  a.section({ name: 'hold', chords: ['Am'], tune: ['~E5 q., r e, r h'] }, { comp: 'organ', sing: 'solo', bass: 'walk', drums: ['half'], vel: 94 });
  return a.cmf();
}

/**
 * The four levels: verse 1 and the first chorus in the living room, verse 2 and the second
 * chorus in the kitchen, the bridge in the void between the cushions (and the second chorus's
 * "void of eternal doom" echoing), and the last chorus on the living room ride, on a calliope.
 */
export function levelSongs(): Uint8Array[] {
  const one = new Arranger();
  intro(one);
  verse(one, VERSE1);
  chorus(one, CHORUS1);
  vamp(one, 'break', 3);

  const two = new Arranger();
  verse(two, VERSE2);
  chorus(two, CHORUS2);
  vamp(two, 'break', 3);

  const three = new Arranger(112, true);
  bridge(three);
  three.section(CHORUS2, { comp: 'void', sing: 'twin', bass: 'boom', drums: ['boom'], vel: 96 });
  // "...the void of eternal doom" echoing away, and the pad dissolving
  const doom = (three.bar - 1) * 4;
  three.fx.echo(TWIN, doom, CHORUS2.tune[7], 80, 1, 3, 0.55);
  three.section({ name: 'nothing', chords: ['Am', 'Am'], tune: ['r w', 'r w'] }, { comp: 'void', sing: 'none', bass: 'boom', drums: ['none'], vel: 84 });
  three.fx.swell(CHORD, (three.bar - 2) * 4, 7.5, DISSOLVE);

  const four = new Arranger(126);
  four.section(slice(FINAL, 0, 4), { comp: 'pump', sing: 'twin', bass: 'oompah', drums: ['pump'], vel: 104 });
  four.section(slice(FINAL, 4), { comp: 'pump', sing: 'twin', bass: 'oompah', drums: ['pump', 'pump', 'pump', 'pump', 'fill'], vel: 108 });
  four.roll(1).hit('Am');
  four.section(CHORUS1, { comp: 'pump', sing: 'twin', bass: 'oompah', drums: [...new Array(7).fill('pump'), 'fill'], vel: 106 });
  return [one.cmf(), two.cmf(), three.cmf(), four.cmf()];
}

const slice = (s: Section, from: number, to = s.tune.length): Section => ({ name: s.name, chords: s.chords.slice(from, to), tune: s.tune.slice(from, to) });

/** Won: "My will's worn thin...", the dramatic pause, "But wait - what's this, beneath my thigh?", found, the outro. */
export function wonSong(): Uint8Array {
  const a = new Arranger();
  a.section({ name: 'pickup', chords: ['Am'], tune: ['r h, r e, D5 e, D5 e, E5 e'] }, { comp: 'organ', sing: 'solo', bass: 'walk', drums: ['fill'], vel: 100 });
  chorus(a, slice(FINAL, 0, 4), { vel: 104 });
  a.pause(4);
  a.section(slice(FINAL, 4, 5), { comp: 'organ', sing: 'solo', bass: 'none', drums: ['tick'], vel: 92 });
  a.roll(1).hit('Em');
  chorus(a, slice(FINAL, 5), { vel: 112 });
  a.section(OUTRO, { comp: 'chug', sing: 'none', bass: 'eighths', drums: ['rock', 'rock', 'half'], vel: 100 });
  return a.cmf();
}

/** Lost: "The remote is gone, it vanished from sight." slow and alone. */
export function lostSong(): Uint8Array {
  const a = new Arranger(84);
  a.section({ name: 'gone', chords: ['Am', 'Dm', 'Dm Am'], tune: ['r h, r e, D5 e, E5 e, r e', VERSE1.tune[7], 'F4 e, D4 e, E4 q, r h'] }, { comp: 'organ', sing: 'solo', bass: 'walk', drums: ['none'], vel: 86 });
  a.section({ name: 'doom', chords: ['Am'], tune: ['A4 h\\\\, r h'] }, { comp: 'whirr', sing: 'solo', bass: 'walk', drums: ['tick'], vel: 80 });
  a.fx.swell(CHORD, (a.bar - 1) * 4, 3.5, DISSOLVE);
  return a.cmf();
}

/** The menu: the whole song in order, intro to outro. */
export function wholeSong(): Uint8Array {
  const a = new Arranger();
  intro(a, 'organ');
  verse(a, VERSE1);
  chorus(a, CHORUS1, { comp: 'stab' });
  vamp(a, 'break', 3, 'organ');
  verse(a, VERSE2);
  chorus(a, CHORUS2, { comp: 'stab', sing: 'solo' });
  vamp(a, 'break', 3, 'organ');
  bridge(a);
  a.fx.program(TWIN, a.bar * 4, KAZOO2);
  chorus(a, slice(FINAL, 0, 4), { comp: 'stab' });
  a.pause(4);
  a.section(slice(FINAL, 4, 5), { comp: 'organ', sing: 'solo', bass: 'none', drums: ['tick'], vel: 92 });
  a.roll(1).hit('Em');
  chorus(a, slice(FINAL, 5), { vel: 110, comp: 'stab' });
  a.section(OUTRO, { comp: 'chug', sing: 'none', bass: 'eighths', drums: ['rock', 'rock', 'half'], vel: 100 });
  return a.cmf();
}

/** Every song, by file name, for the build and the preview. */
export function allSongs(): Record<string, Uint8Array> {
  const levels = levelSongs();
  return { title: titleSong(), story: storySong(), den: levels[0], kitchen: levels[1], void: levels[2], ride: levels[3], won: wonSong(), lost: lostSong(), menu: wholeSong() };
}

export { voicing, root };
