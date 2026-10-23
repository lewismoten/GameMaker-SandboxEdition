// The score: "The Great Dairy Reckoning of 3:17 a.m." (The Bard of Bizarre, 1995). The piece is
// spoken: the recording (tools/analyze.py measured it) has no music bed at all, only the voice,
// its screams and a few sound effects in its second half, with true silence between the lines
// of the first minute. So this is music composed for the game, a melodrama score in D minor for
// the Sound Blaster's OPL2 FM chip (Creative Music Files in rhythm mode), with the tricks in
// games/kit/songFx.ts:
//   - thunder rolls: tuned tom-toms rolling like timpani, the cymbal swelling up under them and
//     the bass drum tuned down to a low D for the crack;
//   - the ominous organ: a pipe organ chord swelling up out of nothing (program changes through
//     copies of one patch with rising levels, under the held chord);
//   - the cow mooing ominously: a reed scooping up and falling away an octave, with a stutter;
//   - the enemy-lover's theme (the cheesecake): a swooning torch song on the choir and its
//     vibrato twin, celesta twinkling over the organ;
//   - tiptoeing at 3:17 a.m.: pizzicato strings and a music box, the bass drum tiptoeing too;
//   - the dash: a frantic galop, oom-pah brass, sixteenth-note runs;
//   - the Devil's tango: a theremin (stepped scoops: CMF has no pitch bend) and its twin, the
//     bandoneon's stabs, the bass drum tuned as the habanera bass, his cackle echoing and
//     stuttering away;
//   - dramatic pauses, and a marker at every section (PLAYGAME skips them; tools/songPreview.ts
//     reads them).
import { sbi } from '../../../kit/music';
import { CELESTA, REED, Writer, type Groove } from '../../../kit/song';
import { DRUM, Fx, boomPatch, detuned, leveled, sweep, waved } from '../../../kit/songFx';

export const BPM = 100;

// ---- the patches --------------------------------------------------------------------------

/** The theremin: a near-pure sine with vibrato, a slow swell into each note. */
const THEREMIN = sbi({ modChar: 0x62, carChar: 0x61, modLevel: 0x2c, carLevel: 0x00, modAD: 0x53, carAD: 0x63, modSR: 0x0f, carSR: 0x07, feedback: 0x04 });
const THEREMIN2 = detuned(THEREMIN);
/** The bandoneon (a reed) and its twin. */
const BANDO = REED;
const BANDO2 = detuned(REED);
/** Pizzicato strings: plucked, short. */
const PIZZ = sbi({ modChar: 0x02, carChar: 0x01, modLevel: 0x1a, carLevel: 0x00, modAD: 0xf8, carAD: 0xf6, modSR: 0x55, carSR: 0x56, feedback: 0x06 });
/** The pipe organ, and its swell (8 steps, opening up out of nothing). */
const ORGAN = sbi({ modChar: 0x21, carChar: 0xa2, modLevel: 0x12, carLevel: 0x0a, modAD: 0xf0, carAD: 0xf0, modSR: 0x0f, carSR: 0x0f, carWave: 1, feedback: 0x03 });
const SWELL = sweep(ORGAN, 8, { mod: 50, car: 46 }, { mod: 10, car: 4 });
/** The choir: "aah", and its twin; the Devil's cackle is the same voice, opened up and short. */
const AAH = sbi({ modChar: 0x61, carChar: 0x21, modLevel: 0x1e, carLevel: 0x00, modAD: 0x62, carAD: 0x63, modSR: 0x14, carSR: 0x15, modWave: 1, feedback: 0x06 });
const AAH2 = detuned(AAH);
const HA = waved(leveled(AAH, { mod: 0x14 }), 2, 0);
const HA2 = detuned(HA);
/** The choir humming down to nothing. */
const HUSH = sweep(AAH, 8, { car: 0 }, { car: 42 });
/** Brass: the oom-pah, the hits, the sad trombone. */
const BRASS = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x16, carLevel: 0x00, modAD: 0x75, carAD: 0x75, modSR: 0x17, carSR: 0x17, feedback: 0x0e });
/** The cow: a nasal reed, low. */
const MOO = sbi({ modChar: 0x31, carChar: 0x21, modLevel: 0x18, carLevel: 0x00, modAD: 0x52, carAD: 0x63, modSR: 0x08, carSR: 0x08, modWave: 1, feedback: 0x0c });
/** The bass drum as the bass; a deep kick for the cracks of thunder. */
const BOOM = boomPatch({ decay: 4, release: 5, growl: 0x1c });
const THUD = boomPatch({ decay: 9, release: 10, growl: 0x14 });
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
  const low = iv.slice(0, 3).map((i) => fold(pc + i + shift, 55)).sort((a, b) => a - b);
  const top = iv[3] === 12 ? low[0] + 12 : fold(pc + iv[3] + shift, 63);
  return [...low, top];
}

/** The bass root (B1..A#2). */
const root = (name: string, shift = 0) => fold(shape(name).pc + shift, 35);

// ---- the material -------------------------------------------------------------------------

interface Section {
  name: string;
  /** One chord per bar, or two ("Gm A7": half a bar each). */
  chords: string[];
  /** One bar of the tune per string (4 beats; kit/songFx tones()). */
  tune: string[];
}

/** The enemy-lover (the cheesecake): a swooning torch song. */
const TEMPT: Section = {
  name: 'the enemy-lover',
  chords: ['Dm', 'Bb', 'Gm', 'A7', 'Dm', 'F', 'Gm A7', 'Dm'],
  tune: [
    'A4 h., ~D5 q',
    'F5 q., E5 e, D5 q, F5 q',
    'E5 h., ~Bb4 q',
    'C#5 q, D5 q, E5 h',
    'A4 h., ~D5 q',
    'F5 q., G5 e, A5 q, ~C6 q',
    'Bb5 q, A5 q, G5 q, ~C#5 q',
    'D5 w',
  ],
};

/** Tiptoeing at 3:17 a.m. */
const SNEAK: Section = {
  name: 'tiptoe',
  chords: ['Dm', 'Dm', 'Gm', 'A7', 'Dm', 'Bb', 'Gm A7', 'Dm'],
  tune: [
    'D4 e, r e, F4 e, r e, A4 e, r e, F4 e, r e',
    'D4 e, r e, F4 e, r e, G#4 e, A4 e, r q',
    'G4 e, r e, Bb4 e, r e, D5 e, r e, Bb4 e, r e',
    'A4 e, r e, G4 e, r e, F4 e, E4 e, r q',
    'D4 e, r e, F4 e, r e, A4 e, r e, D5 e, r e',
    'F5 e, r e, D5 e, r e, Bb4 e, r e, F4 e, r e',
    'G4 e, Bb4 e, D5 e, r e, C#5 e, E5 e, A4 e, r e',
    'D5 e, r e, A4 e, r e, D4 q, r q',
  ],
};

/** The dash to the bathroom: a frantic galop. */
const GALOP: Section = {
  name: 'galop',
  chords: ['Dm', 'A7', 'Dm', 'A7', 'Gm', 'Dm', 'A7', 'Dm'],
  tune: [
    'A4 e, D5 e, F5 e, A5 e, G5 e, F5 e, E5 e, D5 e',
    'C#5 e, E5 e, G5 e, A5 e, G5 e, E5 e, C#5 e, A4 e',
    'D5 s, E5 s, F5 s, G5 s, A5 e, A5 e, Bb5 e, A5 e, G5 e, F5 e',
    'E5 s, F5 s, G5 s, A5 s, Bb5 e, A5 e, G5 e, F5 e, E5 e, C#5 e',
    'D5 e, G5 e, Bb5 e, G5 e, D5 e, G5 e, Bb5 e, D6 e',
    'A5 e, F5 e, D5 e, F5 e, A5 e, F5 e, D5 e, A4 e',
    'G4 e, A4 e, Bb4 e, C#5 e, E5 e, G5 e, A5 e, C#6 e',
    'D6 q!, A5 q, D5 q, r q',
  ],
};

/** The Devil's tango. */
const TANGO: Section = {
  name: 'tango',
  chords: ['Dm', 'Dm', 'A7', 'A7', 'Gm', 'Dm', 'E7 A7', 'Dm'],
  tune: [
    'D5 q., E5 e, F5 e, E5 e, D5 q',
    'A4 h, r e, A4 e, Bb4 e, C#5 e',
    'E5 q., D5 e, C#5 e, D5 e, E5 q',
    'A5 h, r e, A5 e, G5 e, F5 e',
    'G5 q., F5 e, E5 e, D5 e, Bb4 q',
    'A4 q., D5 e, F5 e, A5 e, ~D6 q',
    'C#6 q, Bb5 e, G#5 e, A5 q, G5 e, E5 e',
    '~D5 h!, r h',
  ],
};

/** His cackle: "HA-ha-ha-ha", tumbling down and climbing back up. */
const CACKLE: Section = { name: 'cackle', chords: ['A7', 'Dm'], tune: ['r q, A5 e!, F5 e, D5 e, A4 e, F4 e, D4 e', 'C#4 e, E4 e, A4 e, C#5 e, ~D5 h!'] };

/** The lament: broken, softly. */
const LAMENT: Section = { name: 'lament', chords: ['Dm', 'Gm', 'A7', 'Dm'], tune: ['F4 h, E4 h', 'D4 h, Bb3 h', 'A3 h, C#4 h', 'D4 w'] };

// ---- the band -----------------------------------------------------------------------------

/** Melodic channels: the lead and its twin, then four for the band. */
const LEAD = 0;
const TWIN = 1;
const VOICES = [2, 3, 4, 5];

/** Grooves (16 steps a bar). */
const GROOVE: Record<string, Groove> = {
  tango: { s: '............x..x', h: 'x...x...x...x...' },
  tangoFill: { s: '........x.x.xxxx', h: 'x...x...x.......' },
  tiptoe: { h: '..x...x...x...x.' },
  galop: { s: '..x...x...x...x.', h: 'x.x.x.x.x.x.x.x.' },
  galopFill: { s: '..x...x.x.xxxxxx', h: 'x.x.x.x.........' },
  ballad: { h: 'x.......x.......' },
  none: {},
};

type Comp = 'tango' | 'pizz' | 'celesta' | 'organ' | 'swell' | 'choir' | 'oompah' | 'none';

interface Play {
  comp: Comp;
  /** The lead's patch. */
  lead: Uint8Array;
  twin?: Uint8Array;
  /** The lead: alone, with its twin, or not at all. */
  sing: 'solo' | 'twin' | 'none';
  /** The bass drum's bass line. */
  bass: 'habanera' | 'long' | 'tiptoe' | 'oompah' | 'none';
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
    this.fx.open(LEAD, AAH).open(TWIN, AAH2);
    VOICES.forEach((ch) => this.fx.open(ch, ORGAN));
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
    if (p.comp === 'oompah') patch(BRASS);
    fx.program(LEAD, at0, p.lead).program(TWIN, at0, p.twin ?? detuned(p.lead));
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
          for (let b = 0; b < span; b++) {
            v.slice(0, 3).forEach((n, j) => fx.note(VOICES[j], t + b, b % 2 ? 0.3 : 0.45, n, vel - (b % 2 ? 40 : 28), 0.8));
            if (b === 2 || (span === 2 && b === 1)) fx.note(VOICES[3], t + b + 0.5, 0.25, v[3], vel - 34, 0.8);
          }
        if (p.comp === 'pizz') for (let b = 0; b < span * 2; b++) fx.note(VOICES[b % 4], t + b / 2, 0.3, v[[0, 2, 1, 3][b % 4]], vel - 36 - (b % 2) * 10, 0.5);
        if (p.comp === 'celesta') fx.harp(VOICES, t, span, [v[0] + 12, v[1] + 12, v[2] + 12, v[3] + 12, v[2] + 12, v[1] + 12], 1 / 2, (j) => vel - 42 + (j % 4 === 0 ? 8 : 0));
        if (p.comp === 'organ' || p.comp === 'choir') v.forEach((n, j) => fx.note(VOICES[j], t, span, n, vel - 30 + j * 2, 0.98));
        if (p.comp === 'swell') {
          v.forEach((n, j) => fx.note(VOICES[j], t, span, n, vel - 20, 0.98));
          fx.swell(VOICES, t, span * 0.9, SWELL);
        }
        if (p.comp === 'oompah')
          for (let b = 0; b < span; b++) if (b % 2) v.slice(0, 3).forEach((n, j) => fx.note(VOICES[j], t + b, 0.4, n, vel - 30, 0.7));
            else v.slice(0, 3).forEach((n, j) => fx.note(VOICES[j], t + b + 0.5, 0.3, n, vel - 38, 0.7));
        const r = root(name, shift);
        if (p.bass === 'long') fx.boom(t, span, r, vel);
        if (p.bass === 'tiptoe') for (let h = 0; h < span; h += 2) fx.boom(t + h, 0.4, r, vel - 14);
        if (p.bass === 'oompah') for (let h = 0; h < span; h++) fx.boom(t + h, 0.45, h % 2 ? r + 7 : r, vel - 4);
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

  /** Thunder: the timpani roll and the cymbal swell up into the next bar, then the crack (a low D, the cymbal) on its downbeat. */
  thunder(beats = 4, vel = 120): this {
    const at = this.bar * 4 - beats;
    this.fx.drumRoll(DRUM.cymbal, at, beats, 1 / 4, 20, vel);
    this.fx.drumRoll(DRUM.tom, at, beats, 1 / 6, 40, vel, [38, 38, 41, 38]);
    const hit = this.bar * 4;
    this.fx.program(DRUM.kick, hit, THUD).boom(hit, 2, 26, 127).program(DRUM.kick, hit + 2, BOOM);
    this.fx.drumRoll(DRUM.cymbal, hit, 1 / 4, 1 / 4, 127, 127);
    return this;
  }

  /** The ominous organ: a chord swelling up out of nothing for `bars` bars (and the thunder's low D under it). */
  ominous(chord = 'Dm', bars = 2, vel = 104): this {
    const fx = this.fx;
    const at = this.bar * 4;
    fx.marker(at, 'ominous organ');
    VOICES.forEach((ch) => fx.program(ch, at, SWELL[0]));
    voicing(chord).forEach((n, j) => fx.note(VOICES[j], at, bars * 4, n - 12 + (j === 3 ? 12 : 0), vel, 0.98));
    fx.swell(VOICES, at, bars * 4 * 0.85, SWELL);
    fx.boom(at, bars * 4, root(chord) - 12 + 12, vel);
    this.bar += bars;
    return this;
  }

  /** Somewhere, a cow moos ominously: a low reed scooping up and falling away, a stutter after it. */
  moo(vel = 110): this {
    const fx = this.fx;
    const at = this.bar * 4;
    fx.marker(at, 'moo');
    fx.program(LEAD, at, MOO).program(TWIN, at, detuned(MOO));
    fx.phrase(LEAD, at, '~~F3 h., D3 q\\\\\\\\', vel);
    fx.phrase(TWIN, at, '~~F3 h., D3 q\\\\\\\\', vel - 20, -12);
    fx.stutter(TWIN, at + 4.5, 50, 3, 1 / 3, vel - 30);
    this.bar += 2;
    return this;
  }

  /** His cackle: the choir's HA-ha-ha-ha (brass under it), echoed on the twin's channel, the last HA stuttering. */
  cackle(shift = 0, vel = 104): this {
    const at = this.bar * 4;
    const fx = this.fx;
    fx.marker(at, CACKLE.name);
    fx.program(LEAD, at, HA).program(TWIN, at, HA2);
    VOICES.forEach((ch) => fx.program(ch, at, BRASS));
    CACKLE.tune.forEach((bar, i) => fx.phrase(LEAD, at + i * 4, bar, vel, shift, 0.55));
    fx.echo(TWIN, at, CACKLE.tune[0], vel - 20, 0.5, 1, 0.6, shift);
    fx.stutter(TWIN, at + 6, 62 + shift, 3, 1 / 3, vel - 24);
    CACKLE.chords.forEach((name, i) => {
      voicing(name, shift).forEach((n, j) => fx.note(VOICES[j], at + i * 4, i ? 3 : 0.5, n, vel - 26, 0.9));
      fx.boom(at + i * 4, i ? 3 : 1, root(name, shift), vel);
    });
    this.w.drums(at, GROOVE.tangoFill, vel - 20);
    this.bar += 2;
    return this;
  }

  /** The sad trombone: wah, wah, wah, wahhh. */
  trombone(vel = 104): this {
    const at = this.bar * 4;
    const fx = this.fx;
    fx.marker(at, 'wah wah');
    fx.program(LEAD, at, BRASS).program(TWIN, at, detuned(BRASS));
    fx.phrase(LEAD, at, 'A3 q, G#3 q, G3 q, ~F#3 q', vel);
    fx.phrase(LEAD, at + 4, 'F#3 h., _ q\\\\\\', vel - 6);
    fx.phrase(TWIN, at, 'A3 q, G#3 q, G3 q, ~F#3 q', vel - 16, 12);
    fx.boom(at, 3, 33, vel - 10).boom(at + 3, 5, 30, vel);
    this.bar += 2;
    return this;
  }

  /** Bars of silence (a dramatic pause). */
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
const galop = (n: number) => [...new Array(n - 1).fill('galop'), 'galopFill'];

/** The overture: thunder, the ominous organ, the cow, then the enemy-lover's theme on the choir. */
function overture(a: Arranger): void {
  a.pause(4).thunder(4);
  a.ominous('Dm', 2);
  a.moo();
  a.pause(4);
  a.section(TEMPT, { comp: 'celesta', lead: AAH, twin: AAH2, sing: 'twin', bass: 'long', drums: ['ballad'], vel: 100 });
  a.thunder(2, 110);
}

/** Title: the overture. */
export function titleSong(): Uint8Array {
  const a = new Arranger(84);
  overture(a);
  a.ominous('Dm', 1, 96);
  return a.cmf();
}

/** Story pages: the enemy-lover's theme, slow, on the organ, and the cow. */
export function storySong(): Uint8Array {
  const a = new Arranger(72);
  a.section(TEMPT, { comp: 'organ', lead: REED, sing: 'solo', bass: 'long', drums: ['none'], vel: 90 });
  a.moo(100);
  return a.cmf();
}

/**
 * The four acts: tiptoeing on pizzicato and a music box (the thunder now and then); the
 * enemy-lover's theme, swooning, the cow mooing; the galop; the Devil's tango, his cackle, the
 * tango again a whole step up.
 */
export function levelSongs(): Record<'sneak' | 'fridge' | 'dash' | 'hell', Uint8Array> {
  const sneak = new Arranger(96);
  sneak.section(SNEAK, { comp: 'pizz', lead: CELESTA, sing: 'solo', bass: 'tiptoe', drums: ['tiptoe'], vel: 92 });
  sneak.section(SNEAK, { comp: 'celesta', lead: PIZZ, sing: 'solo', bass: 'tiptoe', drums: ['tiptoe'], vel: 90 });
  sneak.pause(4).thunder(4, 100);
  sneak.section(SNEAK, { comp: 'organ', lead: CELESTA, sing: 'twin', bass: 'tiptoe', drums: ['tiptoe'], vel: 92 });

  const fridge = new Arranger(80);
  fridge.ominous('Dm', 1, 96);
  fridge.section(TEMPT, { comp: 'celesta', lead: AAH, twin: AAH2, sing: 'twin', bass: 'long', drums: ['ballad'], vel: 100 });
  fridge.moo();
  fridge.section(TEMPT, { comp: 'swell', lead: THEREMIN, twin: THEREMIN2, sing: 'twin', bass: 'long', drums: ['ballad'], vel: 102 });
  fridge.thunder(2, 110).pause(4);

  const dash = new Arranger(168);
  dash.section(GALOP, { comp: 'oompah', lead: BRASS, sing: 'solo', bass: 'oompah', drums: galop(8), vel: 104 });
  dash.section(GALOP, { comp: 'oompah', lead: REED, sing: 'twin', bass: 'oompah', drums: galop(8), vel: 106 });
  dash.thunder(2, 112);
  dash.section(GALOP, { comp: 'organ', lead: BRASS, sing: 'twin', bass: 'oompah', drums: galop(8), vel: 108, shift: 2 });

  const hell = new Arranger(112);
  hell.pause(4).thunder(2, 116);
  hell.cackle();
  hell.section(TANGO, { comp: 'tango', lead: THEREMIN, twin: THEREMIN2, sing: 'solo', bass: 'habanera', drums: tango(8), vel: 102 });
  hell.section(TANGO, { comp: 'swell', lead: THEREMIN, twin: THEREMIN2, sing: 'twin', bass: 'habanera', drums: tango(8), vel: 104 });
  hell.cackle();
  hell.section(TANGO, { comp: 'tango', lead: BANDO, twin: BANDO2, sing: 'twin', bass: 'habanera', drums: tango(8), vel: 110, shift: 2 });
  hell.cackle(2, 110);
  return { sneak: sneak.cmf(), fridge: fridge.cmf(), dash: dash.cmf(), hell: hell.cmf() };
}

/** Won: the tango in triumph, a dramatic pause, the thunder, then the lament humming away to nothing. */
export function wonSong(): Uint8Array {
  const a = new Arranger(112);
  a.section(TANGO, { comp: 'choir', lead: BRASS, sing: 'twin', bass: 'habanera', drums: tango(8), vel: 110, shift: 2 });
  a.pause(4).thunder(4, 120);
  const at = a.bar * 4;
  a.section(LAMENT, { comp: 'choir', lead: CELESTA, sing: 'solo', bass: 'long', drums: ['none'], vel: 84 });
  a.fx.swell(VOICES, at + 8, 7.5, HUSH);
  return a.cmf();
}

/** Lost: the sad trombone, and the cow. */
export function lostSong(): Uint8Array {
  const a = new Arranger(76);
  a.trombone();
  a.moo(96);
  a.pause(4);
  return a.cmf();
}

/** The menu: the whole score in order. */
export function wholeSong(): Uint8Array {
  const a = new Arranger(96);
  a.pause(4).thunder(4);
  a.ominous('Dm', 2);
  a.section(SNEAK, { comp: 'pizz', lead: CELESTA, sing: 'solo', bass: 'tiptoe', drums: ['tiptoe'], vel: 92 });
  a.moo();
  a.section(TEMPT, { comp: 'celesta', lead: AAH, twin: AAH2, sing: 'twin', bass: 'long', drums: ['ballad'], vel: 100 });
  a.thunder(2, 112);
  a.section(GALOP, { comp: 'oompah', lead: BRASS, sing: 'solo', bass: 'oompah', drums: galop(8), vel: 104 });
  a.thunder(2, 116);
  a.cackle();
  a.section(TANGO, { comp: 'tango', lead: THEREMIN, twin: THEREMIN2, sing: 'twin', bass: 'habanera', drums: tango(8), vel: 104 });
  a.cackle();
  a.section(LAMENT, { comp: 'choir', lead: CELESTA, sing: 'solo', bass: 'long', drums: ['none'], vel: 84 });
  return a.cmf();
}

/** Every song, by file name, for the build and the preview. */
export function allSongs(): Record<string, Uint8Array> {
  const levels = levelSongs();
  return { title: titleSong(), story: storySong(), ...levels, won: wonSong(), lost: lostSong(), menu: wholeSong() };
}

export { voicing, root };
