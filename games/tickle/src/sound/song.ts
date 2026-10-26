// The soundtrack: "Certified Rat Tickler" (The Bard of Bizarre, 1995). No recording came with
// the song, so this is music composed for the game from the lyrics: a villainous tango in D minor
// for the Sound Blaster's OPL2 FM chip, Creative Music Files in rhythm mode, with the tricks in
// games/kit/songFx.ts:
//   - the tune is a theremin (a sine with vibrato that scoops into its notes: stepped glides, as
//     CMF has no pitch bend), doubled by its vibrato twin so the two beat like a mad scientist's
//     one-man choir;
//   - a bandoneon (reed) and its twin play the tango's stabs; pizzicato strings sneak; a celesta
//     twinkles; the pipe organ swells and opens up under held chords (program changes through
//     copies of one patch with rising levels);
//   - the bass is the rhythm section's bass drum, tuned (a sustaining sine), playing the tango's
//     habanera, which leaves all six melodic channels for the tune, its twin and four for the band;
//   - the maniacal laughter ("[ECHO - maniacal laughter]" in the lyrics) is a choir "HA-ha-ha-ha"
//     tumbling down and climbing back up, echoed on the twin's channel, softer each time, its last
//     "HA" stuttering away;
//   - tuned tom-toms roll like timpani into each chorus, and the last chorus goes up a whole step;
//   - the hook sits on the lyric's own rhythm: "I am a CER-ti-fied RAT TICK-ler.";
//   - a marker at every section (PLAYGAME skips them; tools/songPreview.ts reads them).
// If the Bard's recording turns up, kit/song/analyze.py and kit/song/cutclips.py can take this
// over from it, as they did for his other songs.
import { sbi } from '../../../kit/music';
import { CELESTA, REED, Writer, type Groove } from '../../../kit/song';
import { DRUM, Fx, boomPatch, detuned, leveled, sweep, waved } from '../../../kit/songFx';

const BPM = 116;

// ---- the patches --------------------------------------------------------------------------

/** The theremin: a near-pure sine with vibrato, a slow swell into each note. */
const THEREMIN = sbi({ modChar: 0x62, carChar: 0x61, modLevel: 0x2c, carLevel: 0x00, modAD: 0x53, carAD: 0x63, modSR: 0x0f, carSR: 0x07, feedback: 0x04 });
/** Its twin, without the vibrato: the two beat against each other. */
const THEREMIN2 = detuned(THEREMIN);
/** The bandoneon: a reedy squeeze-box. */
const BANDO = REED;
const BANDO2 = detuned(REED);
/** Pizzicato strings: plucked, short. */
const PIZZ = sbi({ modChar: 0x02, carChar: 0x01, modLevel: 0x1a, carLevel: 0x00, modAD: 0xf8, carAD: 0xf6, modSR: 0x55, carSR: 0x56, feedback: 0x06 });
/** The pipe organ in the tower, and its swell (8 steps, opening up). */
const ORGAN = sbi({
  modChar: 0x21,
  carChar: 0xa2,
  modLevel: 0x12,
  carLevel: 0x0a,
  modAD: 0xf0,
  carAD: 0xf0,
  modSR: 0x0f,
  carSR: 0x0f,
  carWave: 1,
  feedback: 0x03,
});
const SWELL = sweep(ORGAN, 8, { mod: 46, car: 40 }, { mod: 10, car: 6 });
/** The choir: "aah", and its twin; the laughing choir is the same voice, opened up and short. */
const AAH = sbi({
  modChar: 0x61,
  carChar: 0x21,
  modLevel: 0x1e,
  carLevel: 0x00,
  modAD: 0x62,
  carAD: 0x63,
  modSR: 0x14,
  carSR: 0x15,
  modWave: 1,
  feedback: 0x06,
});
const AAH2 = detuned(AAH);
const HA = waved(leveled(AAH, { mod: 0x14 }), 2, 0);
const HA2 = detuned(HA);
/** The choir humming down to nothing (the lost song). */
const HUSH = sweep(AAH, 8, { car: 0 }, { car: 40 });
/** Brass for the hits. */
const BRASS = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x16, carLevel: 0x00, modAD: 0x75, carAD: 0x75, modSR: 0x17, carSR: 0x17, feedback: 0x0e });
/** The bass drum as the bass. */
const BOOM = boomPatch({ decay: 4, release: 5, growl: 0x1c });
/** A deep kick for the hits. */
const THUD = boomPatch({ decay: 8, release: 9, growl: 0x18 });
/** Tom-toms tuned like timpani, a snare, a hi-hat and a cymbal that can swell. */
const TIMP = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x02, carLevel: 0x00, modAD: 0xf5, carAD: 0x00, modSR: 0x35, carSR: 0x00, feedback: 0x00 });
const SNARE = sbi({ modChar: 0x02, carChar: 0x00, modLevel: 0x04, carLevel: 0x00, modAD: 0xf8, carAD: 0x00, modSR: 0x08, carSR: 0x00, feedback: 0x00 });
const HAT = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x0a, carLevel: 0x00, modAD: 0xfa, carAD: 0x00, modSR: 0x0a, carSR: 0x00, feedback: 0x00 });
const SWISH = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x06, carLevel: 0x00, modAD: 0x94, carAD: 0x00, modSR: 0x05, carSR: 0x00, feedback: 0x00 });

// ---- chords -------------------------------------------------------------------------------

const PC: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, Ab: 8, A: 9, Bb: 10, B: 11 };

/** A chord name ("Dm", "A7", "Bb", "Gm") as its root pitch class and intervals. */
function shape(name: string): { pc: number; iv: number[] } {
  const m = /^([A-G][b#]?)(m?)(7?)$/.exec(name);
  if (!m) throw new Error(`Unknown chord ${name}`);
  const third = m[2] ? 3 : 4;
  return { pc: PC[m[1]], iv: m[3] ? [0, third, 7, 10] : [0, third, 7, 12] };
}

/** Folds a pitch class into [lo, lo + 12). */
const fold = (pc: number, lo: number) => lo + ((pc - lo + 120) % 12);

/** Four voices, low to high, in G3..F#5 (a seventh chord keeps its seventh on top). */
function voicing(name: string, shift = 0): number[] {
  const { pc, iv } = shape(name);
  const low = iv
    .slice(0, 3)
    .map((i) => fold(pc + i + shift, 55))
    .sort((a, b) => a - b);
  const top = iv[3] === 12 ? low[0] + 12 : fold(pc + iv[3] + shift, 63);
  return [...low, top];
}

/** The bass root (B1..A#2). */
const root = (name: string, shift = 0) => fold(shape(name).pc + shift, 35);

// ---- the song's material ------------------------------------------------------------------

interface Section {
  name: string;
  /** One chord per bar, or two ("Gm A7": half a bar each). */
  chords: string[];
  /** One bar of the tune per string (4 beats; kit/songFx tones()). */
  tune: string[];
}

/** "I earned a paper in dorsal delight / Two hours of training in how to pin right / No petting. No tail-tugging. There is method in the craft / Pin first or they will never read it as a laugh" */
const VERSE: Section = {
  name: 'verse',
  chords: ['Dm', 'Dm', 'Gm', 'A7', 'Dm', 'Bb', 'Gm A7', 'Dm'],
  tune: [
    'r e, A3 e, D4 e, E4 e, F4 q, E4 e, D4 e', // I earned a pa-per in
    'F4 e, E4 e, A4 e, ~D5 q., r q', // dor-sal de-light.
    'r e, D5 e, C5 e, Bb4 e, A4 q, G4 e, A4 e', // Two hours of train-ing in
    'Bb4 e, A4 e, G4 e, ~C#5 q., r q', // how to pin right.
    'r e, D5 e!, D5 e, r e, D5 e!, C5 e, Bb4 e, A4 e', // No pet-ting. No tail-tug-
    'Bb4 e, r e, A4 e, G4 e, F4 e, G4 e, A4 e, Bb4 e', // -ging. There is me-thod in the
    'A4 q, r e, G4 e, F4 e, E4 e, F4 e, G4 e', // craft. Pin first or they will
    'F4 e, E4 e, C#4 e, E4 e, D4 q, r q', // read it as a laugh.
  ],
};

/** "Fifty kilohertz is bliss. Twenty-two is dread / I choose which register they sing in by the head" */
const PRE: Section = {
  name: 'pre-chorus',
  chords: ['Bb', 'Gm', 'E7', 'A7'],
  tune: [
    'F5 e, F5 e, E5 e, D5 e, E5 e, F5 e, ~G5 q', // Fif-ty ki-lo-hertz is BLISS (way up high)
    'D4 e, D4 e, C#4 e, D4 e, Bb3 h\\', // Twen-ty-two is dread (way down low)
    'r e, A4 e, A4 e, A4 e, B4 e, A4 e, G#4 e, A4 e', // I choose which reg-is-ter they
    'C5 e, B4 e, A4 e, G#4 e, ~E5 q., r e', // sing in by the head.
  ],
};

/** "I am a certified rat tickler. Certificate in hand / No rats yet, but I will answer when fate makes its demand / I will raise a legion squeaking with hysterical morale / And build an empire borne on rodents in a preposterous cabal" */
const CHORUS: Section = {
  name: 'chorus',
  chords: ['Dm', 'Gm', 'C7', 'F A7', 'Dm', 'Gm', 'Bb', 'A7', 'Gm', 'C7', 'Bb A7', 'Dm'],
  tune: [
    'A4 e, D5 e, E5 e, ~F5 q!, E5 e, D5 e, r e', // I am a CER-ti-fied
    'Bb4 q!, ~D5 q!, A4 h', // RAT TICK-ler.
    'r e, G4 e, A4 e, Bb4 e, C5 e, Bb4 e, ~A4 q', // Cer-ti-fi-cate in hand.
    'r q, F4 e, F4 e, ~E4 q, r q', // No rats yet...
    'r e, A4 e, A4 e, A4 e, D5 e, C5 e, Bb4 e, A4 e', // but I will an-swer when fate
    'G4 e, A4 e, Bb4 q, ~A4 h', // makes its de-mand.
    'Bb4 e, Bb4 e, Bb4 e, A4 e, G4 e, A4 e, Bb4 e, C#5 e', // I will raise a le-gion squeak-ing
    'D5 e, E5 e, F5 s, F5 s, E5 e, D5 e, ~C#5 e, D5 q', // with hys-ter-i-cal mo-rale,
    'r e, D4 e, G4 e, A4 e, Bb4 q, A4 e, G4 e', // and build an em-pire borne
    'Bb4 e, A4 e, G4 e, A4 e, ~E4 h', // on ro-dents
    'F4 e, G4 e, A4 e, Bb4 e, C#5 e, D5 e, E5 e, F5 e', // in a pre-pos-ter-ous ca-
    '~D5 h!, r h', // -BAL!
  ],
};

/** The maniacal laughter: "HA-ha-ha-ha-ha-ha", tumbling down an arpeggio and climbing back up. */
const LAUGH: Section = {
  name: 'laughter',
  chords: ['A7', 'Dm'],
  tune: ['r q, A5 e!, F5 e, D5 e, A4 e, F4 e, D4 e', 'C#4 e, E4 e, A4 e, C#5 e, ~D5 h!'],
};

const INTRO: Section = { name: 'intro', chords: ['Dm', 'A7'], tune: ['r w', 'r h, r e, A3 e, D4 e, E4 e'] };

// ---- the band -----------------------------------------------------------------------------

/** Melodic channels: the theremin and its twin, then four for the band. */
const LEAD = 0;
const TWIN = 1;
const VOICES = [2, 3, 4, 5];

/** Grooves (16 steps a bar): the tango's marcato and habanera, a sneak, a march. */
const GROOVE: Record<string, Groove> = {
  tango: { s: '............x..x', h: 'x...x...x...x...' },
  tangoFill: { s: '........x.x.xxxx', h: 'x...x...x.......' },
  sneak: { h: '..x...x...x...x.' },
  march: { s: '..x...x.x.xx..x.', h: 'x.x.x.x.x.x.x.x.' },
  none: {},
};

type Comp = 'tango' | 'pizz' | 'celesta' | 'organ' | 'swell' | 'choir' | 'none';

interface Play {
  comp: Comp;
  /** The theremin: alone, with its twin, or not at all. */
  sing: 'solo' | 'twin' | 'none';
  /** The bass drum's bass line: the tango's habanera, long notes, or none. */
  bass: 'habanera' | 'long' | 'none';
  /** A groove name per bar (the last one repeats). */
  drums: string[];
  vel?: number;
  /** Transpose (semitones). */
  shift?: number;
}

class Arranger {
  readonly fx: Fx;
  bar = 0;
  constructor(bpm = BPM) {
    const w = new Writer(bpm);
    this.fx = new Fx(w);
    this.fx.open(LEAD, THEREMIN).open(TWIN, THEREMIN2);
    VOICES.forEach((ch, k) => this.fx.open(ch, k % 2 ? BANDO2 : BANDO));
    this.fx.open(DRUM.kick, BOOM).open(DRUM.snare, SNARE).open(DRUM.tom, TIMP).open(DRUM.cymbal, SWISH).open(DRUM.hat, HAT);
  }

  get w(): Writer {
    return this.fx.w;
  }

  /** Lays out a section from bar `this.bar` and moves on. */
  section(s: Section, p: Play): this {
    const fx = this.fx;
    const at0 = this.bar * 4;
    const vel = p.vel ?? 100;
    const shift = p.shift ?? 0;
    fx.marker(at0, s.name);
    const patch = (inst: Uint8Array, twin?: Uint8Array) => VOICES.forEach((ch, k) => fx.program(ch, at0, twin && k % 2 ? twin : inst));
    if (p.comp === 'tango') patch(BANDO, BANDO2);
    if (p.comp === 'pizz') patch(PIZZ);
    if (p.comp === 'celesta') patch(CELESTA);
    if (p.comp === 'organ' || p.comp === 'swell') patch(p.comp === 'swell' ? SWELL[0] : ORGAN);
    if (p.comp === 'choir') patch(AAH, AAH2);
    fx.program(LEAD, at0, THEREMIN).program(TWIN, at0, THEREMIN2);
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
        const span = 4 / names.length;
        const v = voicing(name, shift);
        if (p.comp === 'tango')
          // marcato: a stab on every beat, the first and the "and" of three leaning in
          for (let b = 0; b < span; b++) {
            v.slice(0, 3).forEach((n, j) => fx.note(VOICES[j], t + b, b % 2 ? 0.3 : 0.45, n, vel - (b % 2 ? 40 : 28), 0.8));
            if (b === 2 || (span === 2 && b === 1)) fx.note(VOICES[3], t + b + 0.5, 0.25, v[3], vel - 34, 0.8);
          }
        if (p.comp === 'pizz') for (let b = 0; b < span * 2; b++) fx.note(VOICES[b % 4], t + b / 2, 0.4, v[[0, 2, 1, 3][b % 4]], vel - 34 - (b % 2) * 8, 0.6);
        if (p.comp === 'celesta')
          fx.harp(VOICES, t, span, [v[0] + 12, v[1] + 12, v[2] + 12, v[3] + 12, v[2] + 12, v[1] + 12], 1 / 2, (j) => vel - 40 + (j % 4 === 0 ? 8 : 0));
        if (p.comp === 'organ' || p.comp === 'choir') v.forEach((n, j) => fx.note(VOICES[j], t, span, n, vel - 30 + j * 2, 0.98));
        if (p.comp === 'swell') {
          v.forEach((n, j) => fx.note(VOICES[j], t, span, n, vel - 20, 0.98));
          fx.swell(VOICES, t, span * 0.9, SWELL);
        }
        // the bass drum, tuned: the habanera (long, short, then two) or long notes
        const r = root(name, shift);
        if (p.bass === 'long') fx.boom(t, span, r, vel);
        if (p.bass === 'habanera')
          for (let h = 0; h < span; h += 2) {
            fx.boom(t + h, 0.75, r, vel + 4);
            fx.boom(t + h + 0.75, 0.25, r + 7, vel - 16);
            fx.boom(t + h + 1, 0.5, r + 7, vel - 8);
            fx.boom(t + h + 1.5, 0.5, r + 12, vel - 12);
          }
      });
      const groove = GROOVE[p.drums[Math.min(i, p.drums.length - 1)]];
      if (!groove) throw new Error(`No groove in ${s.name}`);
      this.w.drums(at, groove, vel - 22);
    });
    this.bar += s.tune.length;
    return this;
  }

  /** The cymbal swells and the timpani roll up into the next bar (`beats` long). */
  roll(beats = 2, toms = [38, 41, 45, 50]): this {
    const at = this.bar * 4 - beats;
    this.fx.drumRoll(DRUM.cymbal, at, beats, 1 / 4, 30, 120);
    this.fx.drumRoll(DRUM.tom, at, beats, 1 / 4, 50, 120, toms);
    return this;
  }

  /** A band hit on the downbeat of the next bar: the kick, deeper for the one hit, and the cymbal. */
  hit(chord: string, shift = 0): this {
    const at = this.bar * 4;
    this.fx
      .program(DRUM.kick, at, THUD)
      .boom(at, 1, root(chord, shift), 127)
      .program(DRUM.kick, at + 1, BOOM);
    this.fx.drumRoll(DRUM.cymbal, at, 1 / 4, 1 / 4, 120, 120);
    return this;
  }

  /** The maniacal laughter: the choir's HA-ha-ha-ha (brass under it), echoed on the twin's channel, the last HA stuttering. */
  laugh(shift = 0, vel = 104): this {
    const at = this.bar * 4;
    const fx = this.fx;
    fx.marker(at, LAUGH.name);
    fx.program(LEAD, at, HA).program(TWIN, at, HA2);
    VOICES.forEach((ch) => fx.program(ch, at, BRASS));
    LAUGH.tune.forEach((bar, i) => fx.phrase(LEAD, at + i * 4, bar, vel, shift, 0.55));
    fx.echo(TWIN, at, LAUGH.tune[0], vel - 20, 0.5, 1, 0.6, shift);
    fx.stutter(TWIN, at + 6, 62 + shift, 3, 1 / 3, vel - 24);
    LAUGH.chords.forEach((name, i) => {
      const v = voicing(name, shift);
      v.forEach((n, j) => fx.note(VOICES[j], at + i * 4, i ? 3 : 0.5, n, vel - 26, 0.9));
      fx.boom(at + i * 4, i ? 3 : 1, root(name, shift), vel);
    });
    this.w.drums(at, GROOVE.tangoFill, vel - 20);
    this.bar += 2;
    return this;
  }

  /** Bars of silence (everything has let go). */
  pause(beats: number): this {
    this.bar += beats / 4;
    return this;
  }

  cmf(): Uint8Array {
    if (!Number.isInteger(this.bar)) throw new Error(`The song ends mid-bar (${this.bar})`);
    return this.fx.cmf(this.bar);
  }
}

const tango = (n: number) => [...new Array(n - 1).fill('tango'), 'tangoFill'];

/** The intro: the organ swells out of nothing, a timpani roll, and the laughter. */
function intro(a: Arranger): void {
  a.section(INTRO, { comp: 'swell', sing: 'solo', bass: 'long', drums: ['none', 'sneak'], vel: 92 });
  a.roll(2).hit('Dm');
}

function chorus(a: Arranger, o: { shift?: number; vel?: number; drums?: string[] } = {}): void {
  a.section(CHORUS, { comp: 'choir', sing: 'twin', bass: 'habanera', drums: o.drums ?? tango(12), vel: o.vel ?? 106, shift: o.shift });
}

/** Title: the swell, the roll, the laughter, then the chorus and the laughter again. */
function titleSong(): Uint8Array {
  const a = new Arranger();
  intro(a);
  a.laugh();
  chorus(a);
  a.laugh();
  return a.cmf();
}

/** Story pages: the verse sneaking along on pizzicato strings, then the pre-chorus on celesta. */
function storySong(): Uint8Array {
  const a = new Arranger(104);
  a.section(VERSE, { comp: 'pizz', sing: 'solo', bass: 'long', drums: ['sneak'], vel: 92 });
  a.section(PRE, { comp: 'celesta', sing: 'twin', bass: 'long', drums: ['none'], vel: 92 });
  return a.cmf();
}

/**
 * The four levels: the verse and the pre-chorus in the classroom; the verse again into the chorus
 * in the lab; the verse on pizzicato in the sewers, low and sneaky, into the chorus; the march up
 * the tower, the chorus twice, the second time up a whole step.
 */
function levelSongs(): Record<'course' | 'lab' | 'sewer' | 'tower', Uint8Array> {
  const course = new Arranger();
  course.section(VERSE, { comp: 'tango', sing: 'solo', bass: 'habanera', drums: tango(8), vel: 98 });
  course.section(PRE, { comp: 'celesta', sing: 'twin', bass: 'long', drums: ['sneak'], vel: 96 });
  course.section(VERSE, { comp: 'pizz', sing: 'twin', bass: 'habanera', drums: ['sneak'], vel: 94 });

  const lab = new Arranger();
  lab.section(VERSE, { comp: 'tango', sing: 'solo', bass: 'habanera', drums: tango(8), vel: 100 });
  lab.section(PRE, { comp: 'organ', sing: 'twin', bass: 'long', drums: ['sneak'], vel: 98 });
  lab.roll(2).hit('Dm');
  chorus(lab);

  const sewer = new Arranger(100);
  sewer.section(VERSE, { comp: 'pizz', sing: 'solo', bass: 'habanera', drums: ['sneak'], vel: 96, shift: -12 });
  sewer.laugh(-12, 96);
  chorus(sewer, { vel: 100, drums: ['sneak'] });

  const tower = new Arranger(120);
  tower.section(PRE, { comp: 'organ', sing: 'twin', bass: 'long', drums: ['march'], vel: 104 });
  tower.roll(2).hit('Dm');
  chorus(tower, { drums: ['march'] });
  tower.laugh();
  tower.roll(2, [40, 43, 47, 52]).hit('Em');
  chorus(tower, { shift: 2, vel: 114, drums: ['march'] });
  tower.laugh(2, 112);
  return { course: course.cmf(), lab: lab.cmf(), sewer: sewer.cmf(), tower: tower.cmf() };
}

/** Won: "a laughing carpet bowing under my command": the last chorus up a step, the laughter, a big swell. */
function wonSong(): Uint8Array {
  const a = new Arranger();
  a.section({ name: 'pickup', chords: ['B7'], tune: ['r h, r e, B3 e, E4 e, F#4 e'] }, { comp: 'swell', sing: 'solo', bass: 'long', drums: ['none'], vel: 96 });
  a.roll(2, [40, 43, 47, 52]).hit('Em');
  chorus(a, { shift: 2, vel: 112 });
  a.laugh(2, 114);
  a.section(
    { name: 'all because', chords: ['Em', 'Em'], tune: ['B4 e, A4 e, G4 e, F#4 e, ~E5 h', 'r w'] },
    { comp: 'swell', sing: 'twin', bass: 'long', drums: ['none'], vel: 100 },
  );
  return a.cmf();
}

/** Lost: "Twenty-two is dread": the pre-chorus slow and alone, the choir humming away to nothing. */
function lostSong(): Uint8Array {
  const a = new Arranger(76);
  a.section(PRE, { comp: 'choir', sing: 'solo', bass: 'long', drums: ['none'], vel: 84 });
  a.fx.swell(VOICES, (a.bar - 2) * 4, 7.5, HUSH);
  a.fx.stutter(TWIN, (a.bar - 1) * 4, 50, 4, 2 / 3, 60);
  return a.cmf();
}

/** The menu: the whole song in order. */
function wholeSong(): Uint8Array {
  const a = new Arranger();
  intro(a);
  a.laugh();
  a.section(VERSE, { comp: 'tango', sing: 'solo', bass: 'habanera', drums: tango(8), vel: 98 });
  a.section(PRE, { comp: 'celesta', sing: 'twin', bass: 'long', drums: ['sneak'], vel: 96 });
  a.roll(2).hit('Dm');
  chorus(a);
  a.laugh();
  a.section(VERSE, { comp: 'pizz', sing: 'solo', bass: 'habanera', drums: ['sneak'], vel: 96 });
  a.section(PRE, { comp: 'organ', sing: 'twin', bass: 'long', drums: ['sneak'], vel: 98 });
  a.roll(2, [40, 43, 47, 52]).hit('Em');
  chorus(a, { shift: 2, vel: 112 });
  a.laugh(2, 114);
  return a.cmf();
}

/** Every song, by file name, for the build and the preview. */
export function allSongs(): Record<string, Uint8Array> {
  const levels = levelSongs();
  return { title: titleSong(), story: storySong(), ...levels, won: wonSong(), lost: lostSong(), menu: wholeSong() };
}
