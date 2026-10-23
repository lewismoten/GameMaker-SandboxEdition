// The soundtrack: "Loaf #13 (Left in the Basket)" (The Bard of Bizarre, 1995), a gospel slow
// jam, arranged for the Sound Blaster's OPL2 FM chip as Creative Music Files in rhythm mode,
// with every trick in games/kit/songFx.ts:
//   - the organ swells and opens up under held chords (program changes stepping through copies
//     of one patch with rising levels: a crescendo and a filter sweep CMF has no controller for);
//   - the bass is the bass drum, pitched (a sustaining sine on the rhythm section's own voice),
//     which leaves all six melodic channels for the singer, her twin and a four-part choir;
//   - the choir is pairs of patches that differ only in the vibrato bit, so they beat;
//   - the soloist scoops up into notes and falls off them (stepped glides; no pitch bend);
//   - harp arpeggios spread round the choir's channels ring on their release;
//   - the spoken bridge echoes ("Oh, He did... did..."), "wasted" stutters into the pause;
//   - tuned tom-toms roll like timpani and the cymbal swells into the last chorus, which goes
//     up a half step in the game's last level;
//   - dramatic pauses before "But I'm still bread!" and "I'm still bread.";
//   - a marker at every section (PLAYGAME skips them; tools/songPreview.ts reads them).
//
// The notes come from games/loaf/tools/analyze.py run over the recording (which is not in the
// repo): about 61 BPM felt in slow triplets (the analysis counts the triplet pulse, 122.6), in
// B-flat major, chords on Bb, Eb, F(7), Gm, Cm and Dm. The sung lines, each about two bars:
//   intro                                  0.0 -   6.4
//   verse 1 "They broke five loaves..."    6.4 -  37.7
//   verse 2 "Loaf number thirteen..."     37.7 -  68.2
//   chorus "But I'm still bread!"         68.2 -  98.5  ("bread" belted up on G5, falling to F5)
//   bridge "You think He didn't see me?"  98.5 - 117.8  (spoken; "Nothing's ever wasted" 113.2)
//   verse 3 "I traveled home..."         117.8 - 149.4  ("Mama, look what I've got" 135.9)
//   last chorus "We're still bread!"     149.4 - 180.0
//   outro "So here I rise..."            180.0 - 210.3  ("I'm still bread." hushed, low, 195.9)
import { sbi } from '../../../kit/music';
import { EPIANO, Writer, type Groove } from '../../../kit/song';
import { DRUM, Fx, boomPatch, detuned, leveled, sweep, waved } from '../../../kit/songFx';

export const BPM = 62;

// ---- the patches --------------------------------------------------------------------------

/** The soloist: a warm, breathy voice with vibrato (half-sine modulator). */
const SOUL = sbi({ modChar: 0x61, carChar: 0x61, modLevel: 0x1c, carLevel: 0x00, modAD: 0x63, carAD: 0x74, modSR: 0x15, carSR: 0x16, modWave: 1, feedback: 0x0c });
/** Her twin: the same voice without the vibrato, a hair apart all the time. */
const SOUL2 = detuned(SOUL);
/** The gospel organ: two drawbars heard at once (additive), the upper one with the Leslie's tremolo. */
const ORGAN = sbi({ modChar: 0x21, carChar: 0xa2, modLevel: 0x12, carLevel: 0x0a, modAD: 0xf0, carAD: 0xf0, modSR: 0x0f, carSR: 0x0f, carWave: 1, feedback: 0x03 });
/** The organ swelling from a whisper to full, opening up as it goes (8 steps). */
const SWELL = sweep(ORGAN, 8, { mod: 46, car: 44 }, { mod: 14, car: 8 });
/** Choir "ooh": a slow, soft vowel; its twin beats against it. */
const OOH = sbi({ modChar: 0x61, carChar: 0x21, modLevel: 0x2a, carLevel: 0x00, modAD: 0x52, carAD: 0x53, modSR: 0x14, carSR: 0x15, modWave: 1, feedback: 0x06 });
const OOH2 = detuned(OOH);
/** Choir "aah", brighter, for the shouts (the same voice opened up). */
const AAH = waved(leveled(OOH, { mod: 0x1e }), 2, 0);
const AAH2 = detuned(AAH);
/** The choir humming down to nothing at the very end. */
const HUSH = sweep(OOH, 8, { car: 0 }, { car: 40 });
/** Electric piano for the slow-jam stabs. */
const KEYS = EPIANO;
/** A harp (plucked, ringing long after its key lets go). */
const HARP = sbi({ modChar: 0x02, carChar: 0x01, modLevel: 0x1e, carLevel: 0x00, modAD: 0xf6, carAD: 0xf3, modSR: 0x44, carSR: 0x33, feedback: 0x08 });
/** The bass drum as the bass: a sine boom that holds while the note does. */
const BOOM = boomPatch({ decay: 2, release: 5 });
/** A deep kick for the hits. */
const THUD = boomPatch({ decay: 8, release: 9, growl: 0x18 });
/** Tom-toms tuned like timpani (one operator, so this is the modulator half). */
const TIMP = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x02, carLevel: 0x00, modAD: 0xf5, carAD: 0x00, modSR: 0x35, carSR: 0x00, feedback: 0x00 });
/** A soft rim-click snare and a hushed hi-hat. */
const RIM = sbi({ modChar: 0x02, carChar: 0x00, modLevel: 0x06, carLevel: 0x00, modAD: 0xf8, carAD: 0x00, modSR: 0x08, carSR: 0x00, feedback: 0x00 });
const HAT = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x0a, carLevel: 0x00, modAD: 0xfa, carAD: 0x00, modSR: 0x0a, carSR: 0x00, feedback: 0x00 });
/** A cymbal that can swell (a slow attack). */
const SWISH = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x06, carLevel: 0x00, modAD: 0x94, carAD: 0x00, modSR: 0x05, carSR: 0x00, feedback: 0x00 });

// ---- chords -------------------------------------------------------------------------------

const PC: Record<string, number> = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };

/** A chord name ("Bb", "Gm", "F7", "Cm", "Ab") as its root pitch class and intervals. */
function shape(name: string): { pc: number; iv: number[] } {
  const m = /^([A-G]b?)(m?)(7?)$/.exec(name);
  if (!m) throw new Error(`Unknown chord ${name}`);
  const third = m[2] ? 3 : 4;
  return { pc: PC[m[1]], iv: m[3] ? [0, third, 7, 10] : [0, third, 7, 12] };
}

/** Folds a pitch class into [lo, lo + 12). */
const fold = (pc: number, lo: number) => lo + ((pc - lo + 120) % 12);

/** Four choir/organ voices, low to high, in F3..E5 (a seventh chord keeps its seventh on top). */
function voicing(name: string, shift = 0): number[] {
  const { pc, iv } = shape(name);
  const low = iv.slice(0, 3).map((i) => fold(pc + i + shift, 55)).sort((a, b) => a - b);
  const top = iv[3] === 12 ? low[0] + 12 : fold(pc + iv[3] + shift, 63);
  return [...low, top];
}

/** The bass root (Bb1..A2). */
const root = (name: string, shift = 0) => fold(shape(name).pc + shift, 34);

// ---- the song's material ------------------------------------------------------------------

interface Section {
  name: string;
  /** One chord per bar, or two ("Gm F": half a bar each). */
  chords: string[];
  /** One bar of the soloist per string (4 beats; kit/songFx tones(), with triplets and slides). */
  tune: string[];
}

const INTRO: Section = {
  name: 'intro',
  chords: ['Bb', 'Eb Bb'],
  tune: ['r w', 'r h, D4 e, G4 e, ~Bb4 q'], // They broke five
};

/** "They broke five loaves for the hungry crowd, / Fish flew like a prayer through the hands of the proud. / They fed the masses with grace and awe— / But me? I stayed behind... with a crust and a flaw." */
const VERSE1: Section = {
  name: 'verse 1',
  chords: ['Bb', 'Eb', 'Gm F', 'Eb Bb', 'Bb Dm', 'Gm Eb', 'Bb F', 'Bb'],
  tune: [
    'C5 q., r e, Bb4 e, C5 e, C5 e, Bb4 e', // loaves for the hun-gry
    'G4 h\\, r q, Bb4 e, Ab4 e', // crowd. Fish flew
    'Bb4 e, C5 s, C5 s, D5 q, D5 e, C5 e, Bb4 e, Bb4 e', // like a prayer through the hands of the
    'G4 q., r e, r q, Bb4 e, G4 e', // proud. They'd fed the
    'D5 q, Bb4 e, Bb4 e, ~D5 q, F4 q', // mas-ses with grace and
    'G4 h\\, r q, Bb4 q', // awe. But
    '~Db5 e, D5 e, r e, D5 e, D5 e, C5 e, Bb4 q', // me? I stayed be-hind
    'A4 e, F4 e, D4 e, C4 e, D4 e, Bb3 e, Bb3 q', // with a crust and a flaw.
  ],
};

/** "Loaf number thirteen, left in the shade, / I was whole and fluffy, but just... never made the grade. / Watched my brothers pass from hand to hand, / While I sat lonely in a wicker wasteland." */
const VERSE2: Section = {
  name: 'verse 2',
  chords: ['Bb', 'Bb Eb', 'Eb', 'F Gm', 'Gm F7', 'Eb', 'Dm Bb', 'Gm F'],
  tune: [
    'r q, Bb4 e, G4 e, Bb4 e, Bb4 e, ~D5 q', // Loaf num-ber thir-teen,
    'D5 e, D5 e, D5 e, C5 q., r q', // left in the shade.
    'G4 e, G4 e, C5 q, C5 e, C5 e, r q', // I was whole and fluf-fy,
    'G4 e, G4 q, G4 e, F4 e, G4 e, ~Bb4 q', // but just... nev-er made the grade.
    'F4 q, G4 e, D4 e, D4 q, D4 e, C4 e', // Watched my bro-thers pass from
    'C4 e, Bb3 e, Bb3 q, r q, G4 e, D4 e', // hand to hand. While I
    'D4 q, D4 e, D4 e, C4 e, G4 e, C5 e, C5 e', // sat lone-ly in a wick-er
    'Bb4 q, ~C5 q\\, r h', // waste-land. (and the band stops dead)
  ],
};

/** "But I'm still bread! Don't count me out! / Still risen with purpose, I have no doubt. / Not every miracle's seen in the light— / Some crumbs are holy in the silence of night." */
const CHORUS: Section = {
  name: 'chorus',
  chords: ['Bb', 'Bb F7', 'Eb F7', 'Bb', 'Eb', 'Bb F7', 'Gm Cm', 'F F7'],
  tune: [
    'Bb4 e, D5 e, F5 e, ~~G5 q., F5 q\\', // But I'm still BREAD!
    'F5 e!, Eb5 e, D5 e, ~Eb5 h, r e', // Don't count me out!
    'Eb4 e, C4 e, Bb3 e, Eb4 e, F4 q, F4 e, D5 e', // Still ri-sen with pur-pose, I
    'C5 e, D5 e, Bb4 h.', // have no doubt.
    'G4 e, G4 e, F4 e, F4 s, D4 s, D4 e, Eb4 q.', // Not ev-ery mir-a-cle's seen
    'D4 e, C4 e, D4 h, r e, C4 e', // in the light. Some
    'C5 e, D5 e, ~C5 q, A4 e, F4 e, G4 e, F4 e', // crumbs are ho-ly in the si-lence
    'D4 e, ~Bb4 q., r h', // of night.
  ],
};

/** The last chorus: "We're still bread! Don't toss us aside! / Broken or waiting, there's grace where we hide. / From baskets and corners, He still makes a feast— / Even for loaves that were passed by the least." */
const FINAL: Section = {
  name: 'last chorus',
  chords: ['Bb', 'F F7', 'Eb Bb', 'Bb', 'Eb', 'Bb Dm', 'Gm Cm', 'F Bb'],
  tune: [
    'Bb4 e, ~D5 e, F5 e, ~~G5 q., F5 q\\', // We're still BREAD!
    'F5 e!, Eb5 e, D5 e, ~Eb5 h, r e', // Don't toss us a-side!
    'Eb4 e, C4 e, Bb3 e, Eb4 e, F4 q, F4 e, D5 e', // Bro-ken or wait-ing, there's
    'C5 e, D5 e, Bb4 h.', // grace where we hide.
    'G4 e, G4 e, F4 e, F4 s, D4 s, D4 e, Eb4 q.', // From bas-kets and cor-ners,
    'D4 e, C4 e, D4 h, r e, C4 e', // He still makes a feast. E-
    'C5 e, D5 e, ~C5 q, A4 e, F4 e, G4 e, F4 e', // -ven for loaves that were passed
    'D4 e, ~Bb4 q., r h', // by the least.
  ],
};

/** The spoken bridge: "You think He didn't see me? / Oh, He did. / He gathered me up—twelve baskets full. / Leftovers, they said... But to Him? / Nothing's ever wasted." */
const BRIDGE: Section = {
  name: 'bridge',
  chords: ['Bb', 'Bb Eb', 'F7', 'Bb', 'Eb', 'Eb', 'Bb', 'Bb'],
  tune: [
    'r e, Bb4 e, F4 e, Bb4 e, D5 e, Bb4 e, F4 q', // You think He did-n't see me?
    'r q, C4 e, D4 e, C4 q, r q', // Oh, He did.
    'G4 e, Bb4 e, Bb4 e, F4 e, D4 q, C4 q', // He ga-thered me up, twelve
    'D4 e, D4 e, Bb4 q, r h', // bas-kets full.
    'C5 e, C5 e, Bb4 q, r e, Eb5 e, Bb4 e, C5 e', // Left-o-vers, they said... But to Him?
    'r h, D5 e, C5 e, Bb4 e, D5 e', // Noth-ing's ev-er
    '~D5 h., r q', // wast-ed.
    'r w', // (and the pause)
  ],
};

/** "I traveled home in the hands of a child, / Wrapped in cloth, with a face that smiled. / She whispered, 'Mama, look what I've got...' / And suddenly, I mattered a whole awful lot." */
const VERSE3: Section = {
  name: 'verse 3',
  chords: ['Dm Gm', 'F7 Bb', 'Bb', 'F7', 'Gm F', 'Eb', 'Dm Bb', 'Gm F7'],
  tune: [
    'Bb4 e, D5 e, Bb4 e, Bb4 q., F4 e, Bb4 e', // I tra-veled home in the
    'C5 e, Bb4 e, C5 e, G4 h, r e', // hands of a child.
    'G4 e, C5 e, C5 q, F4 e, C4 e, r q', // Wrapped in cloth, with a
    'D4 e, D4 e, Bb4 h, r q', // face that smiled.
    'C5 e, D5 e, Bb4 e, r e, ~D5 q, Bb4 q', // She whis-pered, "Ma-ma,
    'C5 e, F4 e, D4 e, Bb4 q., r q', // look what I've got..."
    'Bb4 e, Bb4 e, Bb4 e, r e, Bb4 e, F4 e, C4 e, F4 e', // And sud-den-ly, I mat-tered a
    'F4 e, D4 e, D4 e, ~Bb4 q., r q', // whole aw-ful lot.
  ],
};

/** "So here I rise, not famous... but fed. / The Savior saw me. / I'm still bread." */
const OUTRO: Section = {
  name: 'outro',
  chords: ['Bb Eb', 'Eb Bb', 'Bb F', 'F Eb', 'Bb', 'Bb'],
  tune: [
    'F4 e, F4 e, F4 e, ~G4 q., r q', // So here I rise,
    'Bb4 e, ~D5 q, Bb4 q., r q', // not fa-mous...
    'Bb4 q, Bb4 h, r q', // but fed.
    'C5 e, C5 e, Bb4 e, Bb4 q., r q', // The Sa-vior saw me.
    'r q, D4 e, C4 e, Bb3 h', // I'm still bread.
    'r w',
  ],
};

// ---- the band -----------------------------------------------------------------------------

/** Melodic channels: the soloist and her twin, then four for the choir, organ, keys or harp. */
const LEAD = 0;
const TWIN = 1;
const VOICES = [2, 3, 4, 5];

/** The slow jam's grooves on a triplet grid (12 steps a bar): snare on 2 and 4, the hats rolling. */
const GROOVE: Record<string, Groove> = {
  jam: { s: '...X.....X..', h: 'x.xx.xx.xx.x' },
  ghost: { s: '...X....xX..', h: 'x.xx.xx.xx.x' },
  hush: { h: 'x..x..x..x..' },
  lift: { s: '...X.....X.x', h: 'xxxxxxxxxxxx' },
  none: {},
};

type Comp = 'organ' | 'swell' | 'choir' | 'shout' | 'keys' | 'harp' | 'none';

interface Play {
  /** How the four voices play the chords. */
  comp: Comp;
  /** The soloist: alone, with her twin, or not at all (the band alone). */
  sing: 'solo' | 'twin' | 'none';
  /** The bass drum's bass line. */
  bass: 'long' | 'jam' | 'none';
  /** A groove name per bar (the last one repeats). */
  drums: string[];
  vel?: number;
  /** Transpose (semitones). */
  shift?: number;
  /** Bars to leave out of the singing (the band plays on). */
  rest?: number[];
  /** Beats into the section where the band stops dead (a dramatic pause; the singer may go on). */
  cut?: number;
}

class Arranger {
  readonly fx: Fx;
  bar = 0;
  constructor(bpm = BPM) {
    const w = new Writer(bpm);
    this.fx = new Fx(w);
    this.fx.open(LEAD, SOUL).open(TWIN, SOUL2);
    VOICES.forEach((ch) => this.fx.open(ch, ORGAN));
    this.fx.open(DRUM.kick, BOOM).open(DRUM.snare, RIM).open(DRUM.tom, TIMP).open(DRUM.cymbal, SWISH).open(DRUM.hat, HAT);
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
    if (p.comp === 'organ' || p.comp === 'swell') patch(p.comp === 'swell' ? SWELL[0] : ORGAN);
    if (p.comp === 'choir') patch(OOH, OOH2);
    if (p.comp === 'shout') patch(AAH, AAH2);
    if (p.comp === 'keys') patch(KEYS);
    if (p.comp === 'harp') patch(HARP);
    if (p.sing === 'twin') fx.program(TWIN, at0, SOUL2);
    s.tune.forEach((bar, i) => {
      const at = at0 + i * 4;
      const names = s.chords[i].split(' ');
      // the soloist (and her twin, a hair apart)
      if (p.sing !== 'none' && !p.rest?.includes(i)) {
        const len = fx.phrase(LEAD, at, bar, vel + 8, shift);
        if (Math.abs(len - 4) > 1e-6) throw new Error(`${s.name} bar ${i + 1} is ${len} beats: ${bar}`);
        if (p.sing === 'twin') fx.phrase(TWIN, at, bar, vel - 6, shift);
      }
      const cut = at0 + (p.cut ?? Infinity);
      names.forEach((name, k) => {
        const t = at + (k * 4) / names.length;
        if (t >= cut) return;
        const span = Math.min(4 / names.length, cut - t);
        const v = voicing(name, shift);
        // the comping
        if (p.comp === 'organ' || p.comp === 'choir' || p.comp === 'shout') v.forEach((n, j) => fx.note(VOICES[j], t, span, n, vel - 30 + j * 2, 0.98));
        if (p.comp === 'swell') {
          v.forEach((n, j) => fx.note(VOICES[j], t, span, n, vel - 20, 0.98));
          fx.swell(VOICES, t, span * 0.9, SWELL);
        }
        if (p.comp === 'keys')
          // slow-jam stabs on the last triplet of each beat, and the chord on the beat
          for (let b = 0; b < span; b++) {
            v.slice(0, 3).forEach((n, j) => fx.note(VOICES[j], t + b, 1 / 3, n, vel - 36, 0.9));
            if (b % 2 === 1) v.slice(0, 3).forEach((n, j) => fx.note(VOICES[j], t + b + 2 / 3, 1 / 3, n, vel - 44, 0.9));
          }
        if (p.comp === 'harp') fx.harp(VOICES, t, span, [v[0], v[1], v[2], v[3], v[2] + 12, v[3]], 1 / 3, (j) => vel - 40 + (j % 3 === 0 ? 8 : 0));
        // the bass drum, tuned to the root
        const r = root(name, shift);
        if (p.bass === 'long') fx.boom(t, span, r, vel);
        if (p.bass === 'jam') {
          fx.boom(t, Math.min(span, 1.5), r, vel + 6);
          if (span >= 2) fx.boom(t + span - 2 / 3, 2 / 3, r + (k === names.length - 1 && i === s.tune.length - 1 ? 7 : 12), vel - 14);
        }
      });
      const name = p.drums[Math.min(i, p.drums.length - 1)];
      const groove = GROOVE[name];
      if (!groove) throw new Error(`No groove ${name}`);
      // past the cut, the drums are silent too
      const steps = Math.max(0, Math.min(12, Math.round((cut - at) * 3)));
      const cutGroove: Groove = Object.fromEntries(Object.entries(groove).map(([d, grid]) => [d, grid!.slice(0, steps).padEnd(12, '.')]));
      if (steps > 0) this.w.drums(at, cutGroove, vel - 18);
    });
    this.bar += s.tune.length;
    return this;
  }

  /** The cymbal swells and the timpani roll up into the next bar (`beats` long, ending on it). */
  roll(beats = 2, toms = [41, 43, 46, 48]): this {
    const at = this.bar * 4 - beats;
    this.fx.drumRoll(DRUM.cymbal, at, beats, 1 / 6, 30, 120);
    this.fx.drumRoll(DRUM.tom, at, beats, 1 / 6, 50, 120, toms);
    return this;
  }

  /** A band hit on the downbeat of the next bar (the kick and the choir). */
  hit(chord: string, shift = 0): this {
    const at = this.bar * 4;
    // the bass drum changes patch for the one hit (a deeper thud), then goes back to the bass
    this.fx.program(DRUM.kick, at, THUD).boom(at, 1, root(chord, shift), 127).program(DRUM.kick, at + 1, BOOM);
    this.fx.drumRoll(DRUM.cymbal, at, 1 / 3, 1 / 3, 120, 120);
    return this;
  }

  /** Bars of silence (a dramatic pause: everything has let go). */
  pause(beats: number): this {
    this.bar += beats / 4;
    return this;
  }

  cmf(): Uint8Array {
    if (!Number.isInteger(this.bar)) throw new Error(`The song ends mid-bar (${this.bar})`);
    return this.fx.cmf(this.bar);
  }
}

// The verse's soloist sings across a pickup, and the pickup bar of a section is held in the bar before.

const jam = (n: number, last = 'jam') => [...new Array(n - 1).fill('jam'), last];

/** The two-bar intro: the organ swells up out of nothing, the timpani roll in. */
function intro(a: Arranger, sing = true): void {
  a.section(INTRO, { comp: 'swell', sing: sing ? 'solo' : 'none', bass: 'long', drums: ['none', 'hush'], vel: 92 });
}

/** The chorus with the full choir, after the pause; the soloist and her twin. */
function chorus(a: Arranger, s: Section, o: { shift?: number; vel?: number } = {}): void {
  a.section(s, { comp: 'shout', sing: 'twin', bass: 'jam', drums: [...jam(7), 'lift'], vel: o.vel ?? 108, shift: o.shift });
}

/** Title: the organ swells up, a timpani roll, a pause... "But I'm still bread!" with the whole choir. */
export function titleSong(): Uint8Array {
  const a = new Arranger();
  intro(a, false);
  a.roll(2).hit('Bb');
  chorus(a, CHORUS);
  a.section({ name: 'tag', chords: ['Bb', 'Bb'], tune: ['r q, D4 e, C4 e, ~Bb3 h', 'r w'] }, { comp: 'swell', sing: 'solo', bass: 'long', drums: ['hush', 'none'], vel: 86 });
  return a.cmf();
}

/** Story pages: verse 1, the soloist bluesy over a harp and a hush of hats. */
export function storySong(): Uint8Array {
  const a = new Arranger(58);
  intro(a);
  a.section(VERSE1, { comp: 'harp', sing: 'solo', bass: 'long', drums: ['none', 'none', 'hush'], vel: 92 });
  return a.cmf();
}

/**
 * The four levels: verses 1 and 2 on the hillside, verse 2 into the chorus in the wicker
 * wasteland, the bridge and the chorus under the stars (twelve baskets full), and verse 3 into
 * the last chorus on the way home, the second time up a half step.
 */
export function levelSongs(): Uint8Array[] {
  const one = new Arranger();
  intro(one);
  one.section(VERSE1, { comp: 'keys', sing: 'solo', bass: 'jam', drums: jam(8), vel: 100 });
  one.section(VERSE2, { comp: 'organ', sing: 'solo', bass: 'jam', drums: jam(8, 'ghost'), vel: 100, cut: 30 });

  const two = new Arranger();
  two.section(VERSE2, { comp: 'keys', sing: 'solo', bass: 'jam', drums: jam(8), vel: 100, cut: 30 });
  two.hit('Bb');
  chorus(two, CHORUS);

  const three = new Arranger(58);
  three.section(BRIDGE, { comp: 'swell', sing: 'solo', bass: 'long', drums: ['hush', 'hush', 'hush', 'hush', 'hush', 'none'], vel: 90, cut: 28 });
  // "Oh, He did... did...", and "wasted... wasted..." into the pause
  const b = (three.bar - BRIDGE.tune.length) * 4;
  three.fx.echo(TWIN, b + 4, BRIDGE.tune[1], 70, 1.5, 2, 0.6);
  three.fx.stutter(TWIN, b + 27, 74, 4, 2 / 3, 70);
  three.roll(1.5).hit('Bb');
  chorus(three, CHORUS, { vel: 100 });

  const four = new Arranger();
  four.section(VERSE3, { comp: 'harp', sing: 'solo', bass: 'long', drums: ['hush', 'hush', 'jam'], vel: 96 });
  four.roll(2).hit('Bb');
  chorus(four, FINAL);
  four.roll(1.5, [43, 46, 48, 50]).hit('Bb', 1);
  chorus(four, FINAL, { shift: 1, vel: 116 });
  return [one.cmf(), two.cmf(), three.cmf(), four.cmf()];
}

/** Won: the last chorus and the hush: "So here I rise, not famous... but fed. The Savior saw me. I'm still bread." */
export function wonSong(): Uint8Array {
  const a = new Arranger();
  a.section({ name: 'pickup', chords: ['F7'], tune: ['r h, r q, r e, Bb4 e'] }, { comp: 'organ', sing: 'solo', bass: 'long', drums: ['hush'], vel: 96 });
  a.roll(2).hit('Bb');
  chorus(a, FINAL, { vel: 112 });
  outro(a);
  return a.cmf();
}

/** The outro: the choir hums under the soloist, a pause, "I'm still bread.", and the hum dies away. */
function outro(a: Arranger): void {
  const at = a.bar * 4;
  a.section(OUTRO, { comp: 'choir', sing: 'solo', bass: 'long', drums: ['hush', 'hush', 'hush', 'none'], vel: 88 });
  a.fx.swell(VOICES, at + 16, 8, HUSH);
}

/** Lost: "Loaf number thirteen, left in the shade", slow and alone, then "...bread... bread". */
export function lostSong(): Uint8Array {
  const a = new Arranger(52);
  a.section({ name: 'left in the shade', chords: ['Gm', 'Eb', 'Cm', 'F7'], tune: VERSE2.tune.slice(0, 4) }, { comp: 'harp', sing: 'solo', bass: 'long', drums: ['none'], vel: 84 });
  a.section({ name: 'still', chords: ['Bb', 'Bb'], tune: ['r q, D4 e, C4 e, Bb3 h', 'r w'] }, { comp: 'choir', sing: 'solo', bass: 'long', drums: ['none'], vel: 80 });
  a.fx.stutter(TWIN, (a.bar - 1) * 4, 58, 4, 2 / 3, 60);
  a.fx.swell(VOICES, (a.bar - 1) * 4, 3.5, HUSH);
  return a.cmf();
}

/** The menu: the whole song in order, intro to the last "I'm still bread." */
export function wholeSong(): Uint8Array {
  const a = new Arranger();
  intro(a);
  a.section(VERSE1, { comp: 'keys', sing: 'solo', bass: 'jam', drums: jam(8), vel: 98 });
  a.section(VERSE2, { comp: 'organ', sing: 'solo', bass: 'jam', drums: jam(8), vel: 98, cut: 30 });
  a.hit('Bb');
  chorus(a, CHORUS);
  a.section(BRIDGE, { comp: 'swell', sing: 'solo', bass: 'long', drums: ['hush', 'hush', 'hush', 'hush', 'hush', 'none'], vel: 88, cut: 28 });
  const b = (a.bar - BRIDGE.tune.length) * 4;
  a.fx.echo(TWIN, b + 4, BRIDGE.tune[1], 70, 1.5, 2, 0.6);
  a.fx.stutter(TWIN, b + 27, 74, 4, 2 / 3, 70);
  a.section(VERSE3, { comp: 'harp', sing: 'solo', bass: 'long', drums: ['hush', 'hush', 'jam'], vel: 94 });
  a.roll(2).hit('Bb');
  chorus(a, FINAL, { vel: 112 });
  outro(a);
  return a.cmf();
}

/** Every song, by file name, for the build and the preview. */
export function allSongs(): Record<string, Uint8Array> {
  const levels = levelSongs();
  return { title: titleSong(), story: storySong(), hill: levels[0], wicker: levels[1], baskets: levels[2], home: levels[3], won: wonSong(), lost: lostSong(), menu: wholeSong() };
}

export { voicing, root };
