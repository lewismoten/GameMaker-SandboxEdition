// The soundtrack: "Cleanse Me, O Loofah, But Leave My Soul" (The Bard of Bizarre, 1995), a goth
// rock song about domestic life, arranged for the Sound Blaster's OPL2 FM chip as Creative Music
// Files in rhythm mode, with the tricks in games/kit/songFx.ts:
//   - the singer is a dark baritone (a vibrato reed on half-sine waves), and in the choruses his
//     twin (the same patch without the vibrato) sings with him, so the two beat like a choir;
//   - the guitars are power chords (root and fifth, no third: neither major nor minor) on two
//     channels whose patch is all feedback, its modulator on a half sine and its carrier on the
//     pulse wave: the closest an FM chip gets to a fuzz pedal. Verses chug (palm-muted eighths
//     on a patch that dies away fast), choruses ring;
//   - a cathedral organ on its own channel swells up out of nothing by program changes (a run
//     of copies of the patch, each a little louder and brighter, under a held chord) and plays
//     the harmony as a fast arpeggio (a one-channel chord, the chiptune trick);
//   - booming toms: the tom-tom's pitch follows its note, so the tribal intro and the fills
//     are tuned toms, and a funeral bell tolls on the organ's channel;
//   - "Scrubbus maximus" drops to half time, the organ alone, before the band comes crashing in;
//   - the last chorus goes up a half step in the shower; a marker at every section (PLAYGAME
//     skips them; tools/songPreview.ts reads them).
//
// The notes come from games/loofah/tools/analyze.py run over the recording (which is not in the
// repo): 89 BPM, F minor with power chords (Fm, C, Db, Ab, Bbm; the C is major, as goth likes
// it), the singing starting on the very first beat. The tunes below are the analysis's sung
// pitches, bar by bar, tidied by ear:
//   verse 1 "She said, don't touch the pink one..."     0.2 -  11.0  (bars 0-3)
//   the band                                            11.0 -  21.7  (bars 4-7)
//   verse 2 "There it hung, innocent..."                21.7 -  40.6  (bars 8-14)
//   verse 3 "It was peach, or coral..."                 40.6 -  59.5  (bars 15-21)
//   chorus 1 "Loofah of Lucifer, you lather my fate"    59.5 -  81.1  (bars 22-29)
//   "Why did I scrub with Satan's puff? ... Rough!"     81.1 -  91.9  (bars 30-33)
//   verse 4 "She warned me, didn't she?"                91.9 - 110.7  (bars 34-40)
//   verse 5 "The mirror steamed a warning sign"        110.7 - 124.2  (bars 41-45)
//   bridge "Scrubbus maximus, demon sponge divine"     124.2 - 143.1  (bars 46-52)
//   chorus 2 "Loofah of Lucifer, why must you judge?"  148.5 - 167.4  (bars 55-61)
//   outro "I'm sleeping alone with a washcloth..."     167.4 - 192.4  (bars 62-70)
import { INSTRUMENTS, sbi } from '../../../kit/music';
import { ORGAN, Writer, type Groove } from '../../../kit/song';
import { DRUM, Fx, detuned, sweep } from '../../../kit/songFx';

export const BPM = 89;

// ---- the patches --------------------------------------------------------------------------

/** The singer: a dark baritone (vibrato on both operators, a half-sine modulator). */
const SINGER = sbi({
  modChar: 0x61,
  carChar: 0x61,
  modLevel: 0x1a,
  carLevel: 0x00,
  modAD: 0x63,
  carAD: 0x74,
  modSR: 0x15,
  carSR: 0x16,
  modWave: 1,
  feedback: 0x0c,
});
/** His twin without the vibrato: the choir. */
const CHOIR = detuned(SINGER);
/** Ringing power chords: full feedback, a half-sine modulator into a pulse-wave carrier (fuzz). */
const FUZZ = sbi({
  modChar: 0x21,
  carChar: 0x21,
  modLevel: 0x0c,
  carLevel: 0x03,
  modAD: 0xf2,
  carAD: 0xf3,
  modSR: 0x2a,
  carSR: 0x1a,
  modWave: 1,
  carWave: 3,
  feedback: 0x0e,
});
/** Palm-muted: the same fuzz, dying away fast. */
const CHUG = sbi({
  modChar: 0x01,
  carChar: 0x01,
  modLevel: 0x0c,
  carLevel: 0x03,
  modAD: 0xf6,
  carAD: 0xf7,
  modSR: 0x58,
  carSR: 0x48,
  modWave: 1,
  carWave: 3,
  feedback: 0x0e,
});
/** A picked bass, eighths. */
const PICK = sbi({ modChar: 0x01, carChar: 0x01, modLevel: 0x14, carLevel: 0x00, modAD: 0xf5, carAD: 0xf4, modSR: 0x36, carSR: 0x36, feedback: 0x0c });
/** The cathedral organ, and its swell from a whisper to full (8 steps). */
const CATHEDRAL = ORGAN;
const SWELL = sweep(CATHEDRAL, 8, { mod: 50, car: 44 }, { mod: 10, car: 5 });
/** A funeral bell. */
const BELL = INSTRUMENTS.bell;
/** Booming toms (long decay, pitch follows the note). */
const BOOMTOM = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x00, carLevel: 0x00, modAD: 0xf4, carAD: 0x00, modSR: 0x26, carSR: 0x00, feedback: 0x00 });

// ---- chords -------------------------------------------------------------------------------

const PC: Record<string, number> = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };

function shape(name: string): { pc: number; iv: number[] } {
  const m = /^([A-G]b?)(m?)$/.exec(name);
  if (!m) throw new Error(`Unknown chord ${name}`);
  return { pc: PC[m[1]], iv: [0, m[2] ? 3 : 4, 7] };
}

const fold = (pc: number, lo: number) => lo + ((pc - lo + 120) % 12);
/** The guitars' power chord: the root (E2..D#3) and its fifth. */
const power = (name: string, shift = 0) => {
  const r = fold(shape(name).pc + shift, 40);
  return [r, r + 7];
};
/** The bass root (E1..D#2). */
const root = (name: string, shift = 0) => fold(shape(name).pc + shift, 28);
/** The organ's chord (the thirds live here), F4 and up. */
const organ = (name: string, shift = 0) => {
  const { pc, iv } = shape(name);
  return iv.map((i) => fold(pc + i + shift, 65)).sort((a, b) => a - b);
};

// ---- the song's material ------------------------------------------------------------------

interface Section {
  name: string;
  /** One chord per bar, or two ("Fm Db": half a bar each). */
  chords: string[];
  /** One bar of the singer per string (4 beats; kit/songFx tones()). */
  tune: string[];
}

/** "She said, 'Don't touch the pink one. It's mine!' / But I, I didn't listen / I thought, it's just a loofah / How wrong I was" */
const VERSE1: Section = {
  name: 'verse 1',
  chords: ['Fm', 'Fm', 'Fm', 'Fm C'],
  tune: [
    'r e, F4 q, G4 q, F4 s, F4 s, Ab4 e, Bb4 e', // She said, don't touch the pink one.
    'r q, F4 q, F4 q., D4 e', // It's mine. But
    'F4 h, Ab4 q., A4 e', // I did-n't lis-ten. I
    'r e, F4 e, r e, G4 s, G4 s, G4 e., Bb4 s, C5 s, C5 s, G4 e', // thought, it's just a loo-fah. How wrong I was.
  ],
};

/** The band between the verses. */
const BAND: Section = { name: 'the band', chords: ['Db', 'C', 'Fm Db', 'C'], tune: ['r w', 'r w', 'r w', 'r w'] };

/** "There it hung, innocent, / smug on the silver rack / a mesh of malice, gently drying / waiting to attack / I reached out with my mortal hand / for a scrub, I didn't understand" */
const VERSE2: Section = {
  name: 'verse 2',
  chords: ['Fm', 'C', 'Fm', 'C', 'Db', 'C', 'C'],
  tune: [
    'F4 e, A4 q, C5 h, G4 e', // hung, in-no-cent, smug on
    'r e, G4 q, F4 q, Bb4 e, C5 e, Ab4 e', // the sil-ver rack. A mesh of
    'F4 e, G4 q, Ab4 h, D5 e', // mal-ice gent-ly dry-ing. Wait-
    'r e, G4 e, F4 q., E4 e, C5 q', // -ing to at-tack. I reached out
    'Ab4 q, Ab4 e, Db5 q., G4 q', // with my mor-tal hand
    'r e, G4 q, C5 h, Db5 e', // for a scrub. I
    'Ab4 h, G4 h', // did-n't un-der-stand.
  ],
};

/** The pickup into verse 2: "There it". */
const THERE = 'r q., C5 h, G4 e';

/** "It was peach, or coral, some evil hue / scented faintly like doom and shampoo / I felt it twitch beneath my grip / a thousand sudsy sins on every strip" */
const VERSE3: Section = {
  name: 'verse 3',
  chords: ['Fm C', 'F C', 'C', 'Fm', 'C', 'Bbm', 'Bb'],
  tune: [
    'r q., G4 q., G4 e, F4 e', // It was peach
    'r e, F4 q, C4 h, G4 e', // or cor-al, some
    'G4 e, G4 h, Ab4 q, G4 e', // e-vil hue. Scent-ed
    'F4 e, F4 q., F4 e, Ab4 q.', // faint-ly like doom and sham-poo.
    'r q., G4 q, C5 e, C5 e, G4 e', // I felt it twitch
    'r e, Db5 e, C5 e, D5 h, Bb4 e', // be-neath my grip. A
    'Bb4 e, G4 q, Bb4 e, F4 q, F4 e, F4 e', // thou-sand sud-sy sins on ev-ery strip.
  ],
};

/** "Loofah of Lucifer, you lather my fate / now I'm cursed in the shower, repenting too late / you exfoliated my soul, peeled back my pride / my sins are now citrus... and I cannot hide" */
const CHORUS: Section = {
  name: 'chorus 1',
  chords: ['Fm C', 'C', 'Fm', 'C', 'Db', 'Ab', 'Db', 'C'],
  tune: [
    'r e, F4 q, C4 e, G4 h', // Loo-fah of Lu-ci-fer,
    'r e, C5 q, C5 e, G4 h', // you la-ther my fate.
    'F4 q., C4 e, C4 e, C4 e, Ab4 q', // Now I'm cursed in the show-er,
    'r q, G4 q, G4 h', // re-pent-ing too late.
    'r q, Db5 q, Ab4 q., Ab4 e', // You ex-fo-li-a-ted my
    'Ab4 q, Ab4 e, F4 q, Ab4 q.', // soul, peeled back my pride.
    'r e, Db5 q, Ab4 q, Db5 e, Ab4 e, G4 e', // My sins are now cit-rus,
    'r q, G4 q, G4 e, C5 q.', // and I can-not hide.
  ],
};

/** "Why did I scrub with Satan's puff? / It smelled like grapefruit and betrayal. / Rough!" */
const ROUGH: Section = {
  name: 'rough',
  chords: ['F Db', 'C', 'Fm Db', 'C'],
  tune: [
    'r h., r e, G4 e', // Why
    'r e, C5 e, G4 e, G4 e, G4 e, G4 q.', // did I scrub with Sa-tan's
    'F4 h, r e, Db4 e, Db4 q', // puff? It smelled like
    'F4 q, G4 e, Ab4 e, C5 h', // grape-fruit and be-tray-al. Rough!
  ],
};

/** "She warned me, didn't she? / She told me, 'that's not for your man grime, babe, seriously' / but I scoffed, and scrubbed my face / and now I feel so out of place" */
const VERSE4: Section = {
  name: 'verse 4',
  chords: ['C Fm', 'C', 'Fm', 'C', 'C', 'C', 'C'],
  tune: [
    'r e, C5 e, G4 q., Ab4 q, G4 e', // She warned me, did-n't she?
    'r q., G4 q, Ab4 q, G4 e', // She told me,
    'r e, G4 e, F4 e, F4 e, F4 e, Ab4 e, G4 q', // that's not for your man grime, babe,
    'r e, C5 q., F4 e, Ab4 e, C5 q', // se-ri-ous-ly. But I scoffed
    'r q, Ab4 e, C5 q, C5 e, G4 q', // and scrubbed my face.
    'r h, C5 e, Db5 e, G4 e, G4 e', // And now I feel
    'r e, G4 h, G4 q, G4 e', // so out of place.
  ],
};

/** "The mirror steamed a warning sign / fogged up and spelled 'You crossed a line' / ... my towel screams, 'YOU MADE IT WORSE!'" */
const VERSE5: Section = {
  name: 'verse 5',
  chords: ['Fm', 'Db', 'C', 'Db', 'C'],
  tune: [
    'r q., F4 q, F4 e, F4 e, G4 e', // The mir-ror steamed a warn-ing
    'r q, F4 q., F4 e, Ab4 e, G4 e', // sign, fogged up and spelled,
    'r e, G4 q, F4 q, C5 e, C5 e, C5 e', // "You crossed a line." Now ev-ery show-er's
    'r e, Ab4 e, G4 e, Db5 e, F4 e, F4 q, G4 e', // ... cursed, my tow-el screams,
    'r e, G4 e, G4 e, C5 h, r e', // "YOU MADE IT WORSE!"
  ],
};

/** "Scrubbus maximus / demon sponge divine / lather my guilt in rosemary brine / from some forest-dark aisle you came / now my ... is your loofah shame" */
const BRIDGE: Section = {
  name: 'bridge',
  chords: ['Fm Db', 'C', 'C F', 'C', 'Db', 'Ab', 'Db C'],
  tune: [
    'r q, F4 q, G4 e, G4 q.', // Scrub-bus max-i-mus,
    'C5 e, C5 q, C5 e, G4 h', // de-mon sponge di-vine,
    'r e, C5 e, C5 q, F4 e, C4 q, C4 e', // la-ther my guilt in rose-ma-ry
    'r q, G4 h, r q', // brine.
    'Ab4 q, Ab4 e, Db5 q, Ab4 e, Ab4 e, F4 e', // From some for-est-dark aisle
    'Ab4 e, Ab4 e, Ab4 h, C5 e, C5 e', // you came. Now my
    'Ab4 e, Ab4 q, C5 e, C5 q, F4 q', // ... is your loo-fah shame.
  ],
};

/** "Loofah of Lucifer, why must you judge? / I just wanted clean pores, now I live in a grudge / you smelled of mango, but you ruined my life / now I'm ... and I lost my wife" */
const CHORUS2: Section = {
  name: 'chorus 2',
  chords: ['Fm', 'C', 'C Fm', 'Db C', 'C', 'Db', 'Ab Fm', 'Db C'],
  tune: [
    'r w', // (the breath before it)
    'r e, C4 q, C4 e, Ab4 h', // Loo-fah of Lu-ci-fer,
    'G4 q, G4 e, G4 q., C5 e, C5 e', // why must you judge? I just
    'Ab4 e, Ab4 q, Ab4 q., C5 e, C5 e', // want-ed clean pores. Now I
    'C5 e, G4 q, G4 e, F4 h', // live in a grudge.
    'Ab4 e, Ab4 q, Db5 q, Ab4 e, Ab4 q', // You smelled of man-go, but
    'G4 q, C5 e, Bb4 q., C5 e, C5 e', // you ru-ined my life. Now I'm
    'Ab4 e, Ab4 e, Ab4 e, Ab4 e, G4 e, G4 q, F4 e', // ... and I lost my wife.
  ],
};

/** "I'm sleeping alone with a washcloth of shame / while she bathes with her demons and calls me by name / never touch a loofah / never touch the loofah of Lucifer" */
const OUTRO: Section = {
  name: 'outro',
  chords: ['Fm', 'Fm', 'C', 'Db', 'C', 'Fm', 'Fm', 'F Db', 'C'],
  tune: [
    'r h, r e, C4 q, C4 e', // I'm sleep-
    'r e, G4 e, G4 e, Eb4 e, F4 q, Ab4 e, G4 e', // -ing a-lone with a wash-cloth of shame
    'r h, C5 q, G4 e, G4 e', // while she bathes
    'r e, Ab4 e, G4 e, F4 q, Ab4 q, G4 e', // with her de-mons and calls
    'r e, G4 e, E4 e, G4 h, r e', // me by name.
    'r e, F4 q, F4 e, F4 h', // Nev-er touch a loo-fah.
    'r e, F4 q, G4 q, G4 e, F4 q', // Nev-er touch the loo-fah.
    'r w',
    'r w',
  ],
};

// ---- the band -----------------------------------------------------------------------------

const LEAD = 0;
const TWIN = 1;
const BASS = 2;
const GTR = [3, 4];
const ORG = 5;

/** Grooves on a sixteenth grid. */
const GROOVE: Record<string, Groove> = {
  // the backbeat, half time: kick on 1 and 3, the snare on 3
  goth: { k: 'x.......x.......', s: '....X.......X...', h: 'x.x.x.x.x.x.x.x.' },
  drive: { k: 'x.....x.x.x.....', s: '....X.......X...', h: 'xxxxxxxxxxxxxxxx' },
  crash: { k: 'x.....x.x.x.....', s: '....X.......X...', c: 'X...............', h: '..xxxxxxxxxxxxxx' },
  // the tribal toms (the floor tom on every off-beat, a kick under it)
  tribal: { k: 'x.......x.......', t: 'x..x..x.x..x..x.', h: '..x...x...x...x.' },
  half: { k: 'x...............', s: '........X.......', h: 'x...x...x...x...' },
  fill: { k: 'x.......x.......', s: '....X.....x.XxXX', t: '..............xx', h: 'x.x.x.x.x.x.....' },
  hats: { h: 'x...x...x...x...' },
  // a slow heartbeat on the floor tom
  heart: { t: 'x..x............' },
  none: {},
};

interface Play {
  /** The guitars: palm-muted eighths, ringing chords, or out. */
  gtr: 'chug' | 'ring' | 'none';
  /** The singer: alone, with the choir, or not at all. */
  sing: 'solo' | 'choir' | 'none';
  /** The organ: a fast arpeggio of the chord, held chords (arpeggio slow), or out. */
  org: 'arp' | 'hold' | 'none';
  bass: 'eighths' | 'long' | 'none';
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
    this.fx.open(LEAD, SINGER).open(TWIN, CHOIR).open(BASS, PICK);
    GTR.forEach((ch) => this.fx.open(ch, FUZZ));
    this.fx.open(ORG, CATHEDRAL);
    this.fx.open(DRUM.tom, BOOMTOM);
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
    GTR.forEach((ch) => fx.program(ch, at0, p.gtr === 'chug' ? CHUG : FUZZ));
    s.tune.forEach((bar, i) => {
      const at = at0 + i * 4;
      if (p.sing !== 'none') {
        const len = fx.phrase(LEAD, at, bar, vel + 8, shift);
        if (Math.abs(len - 4) > 1e-6) throw new Error(`${s.name} bar ${i + 1} is ${len} beats: ${bar}`);
        if (p.sing === 'choir') fx.phrase(TWIN, at, bar, vel - 12, shift);
      }
      const names = s.chords[i].split(' ');
      names.forEach((name, k) => {
        const span = 4 / names.length;
        const t = at + k * span;
        const pw = power(name, shift);
        if (p.gtr === 'chug') for (let e = 0; e < span; e += 0.5) pw.forEach((n, j) => fx.note(GTR[j], t + e, 0.5, n, vel - 18 + (e % 2 === 0 ? 8 : 0), 0.6));
        if (p.gtr === 'ring') pw.forEach((n, j) => fx.note(GTR[j], t, span, n, vel - 10, 0.96));
        const r = root(name, shift);
        if (p.bass === 'eighths') for (let e = 0; e < span; e += 0.5) fx.note(BASS, t + e, 0.5, r + (e === span - 0.5 && span >= 2 ? 12 : 0), vel - 4, 0.8);
        if (p.bass === 'long') fx.note(BASS, t, span, r, vel, 0.95);
        if (p.org === 'arp') fx.arp(ORG, t, span, organ(name, shift), 1 / 6, vel - 46, 'updown');
        if (p.org === 'hold') fx.arp(ORG, t, span, organ(name, shift), 1 / 2, vel - 40, 'up');
      });
      const name = p.drums[Math.min(i, p.drums.length - 1)];
      const groove = GROOVE[name];
      if (!groove) throw new Error(`No groove ${name}`);
      this.w.drums(at, groove, vel - 14);
    });
    this.bar += s.tune.length;
    return this;
  }

  /** The organ swells up out of nothing under one held chord for `bars` bars (the band waits). */
  swell(chord: string, bars: number, shift = 0): this {
    const fx = this.fx;
    const at = this.bar * 4;
    fx.marker(at, 'the organ');
    fx.program(ORG, at, SWELL[0]);
    fx.note(ORG, at, bars * 4 - 0.25, organ(chord, shift)[0], 100, 1);
    // the guitars' fifths hum under it, on the same swell
    GTR.forEach((ch) => fx.program(ch, at, SWELL[0]));
    power(chord, shift).forEach((n, j) => fx.note(GTR[j], at, bars * 4 - 0.25, n + 12, 80, 1));
    fx.swell([ORG, ...GTR], at, bars * 4 - 1, SWELL);
    fx.program(ORG, at + bars * 4, CATHEDRAL);
    GTR.forEach((ch) => fx.program(ch, at + bars * 4, FUZZ));
    this.bar += bars;
    return this;
  }

  /** The booming toms roll down into the next bar (`beats` long, ending on it). */
  roll(beats = 2, toms = [52, 50, 47, 45, 43, 40]): this {
    const at = this.bar * 4 - beats;
    this.fx.drumRoll(DRUM.tom, at, beats, 1 / 4, 60, 124, toms);
    this.fx.drumRoll(DRUM.cymbal, at, beats, 1 / 2, 30, 90);
    return this;
  }

  /** The funeral bell tolls `times` times from beat `at` on the organ's channel. */
  toll(at: number, times: number, n = 53): this {
    this.fx.program(ORG, at, BELL);
    for (let k = 0; k < times; k++) this.fx.note(ORG, at + k * 2, 2, n, 100, 1);
    this.fx.program(ORG, at + times * 2, CATHEDRAL);
    return this;
  }

  cmf(): Uint8Array {
    if (!Number.isInteger(this.bar)) throw new Error(`The song ends mid-bar (${this.bar})`);
    return this.fx.cmf(this.bar);
  }
}

const drive = (n: number, last = 'fill') => [...new Array(n - 1).fill('drive'), last];
const goth = (n: number, last = 'fill') => [...new Array(n - 1).fill('goth'), last];

/** A verse: the guitars chug, the organ arpeggio. */
const verse = (a: Arranger, s: Section, o: { vel?: number; shift?: number; lite?: boolean } = {}) =>
  a.section(s, {
    gtr: o.lite ? 'ring' : 'chug',
    sing: 'solo',
    org: o.lite ? 'hold' : 'arp',
    bass: o.lite ? 'long' : 'eighths',
    drums: goth(s.tune.length),
    vel: o.vel ?? 98,
    shift: o.shift,
  });
/** A chorus: the choir, ringing chords, the full kit. */
const chorus = (a: Arranger, s: Section, o: { vel?: number; shift?: number; lite?: boolean } = {}) =>
  a.section(s, {
    gtr: 'ring',
    sing: 'choir',
    org: 'hold',
    bass: o.lite ? 'long' : 'eighths',
    drums: ['crash', ...(o.lite ? goth : drive)(s.tune.length - 1)],
    vel: o.vel ?? 106,
    shift: o.shift,
  });
/** The menu plays the whole song, so it is written lighter (a CMF must fit in 20 KB). */
const LITE = { lite: true } as const;
/** The tribal intro: toms and organ, the bell. */
function intro(a: Arranger, bars = 2): void {
  const at = a.bar * 4;
  a.section(
    { name: 'intro', chords: new Array(bars).fill('Fm'), tune: new Array(bars).fill('r w') },
    { gtr: 'none', sing: 'none', org: 'hold', bass: 'long', drums: ['tribal'], vel: 96 },
  );
  a.toll(at, 2);
}
/** Verse 2 with its pickup ("There it") in the bar before it. */
const there = (b: Section): Section => ({ ...b, tune: [...b.tune.slice(0, -1), THERE] });

/** Title: the toms and the bell, the organ swells, then "Loofah of Lucifer" with the whole band. */
export function titleSong(): Uint8Array {
  const a = new Arranger();
  intro(a);
  a.swell('Fm', 2).roll(2);
  chorus(a, CHORUS);
  a.section(
    { name: 'tag', chords: ['Fm', 'Fm'], tune: ['r w', 'r w'] },
    { gtr: 'ring', sing: 'none', org: 'none', bass: 'long', drums: ['crash', 'none'], vel: 100 },
  );
  return a.cmf();
}

/** Story pages: verse 1, hushed, the organ and the bell. */
export function storySong(): Uint8Array {
  const a = new Arranger(84);
  a.section(VERSE1, { gtr: 'none', sing: 'solo', org: 'hold', bass: 'long', drums: ['hats'], vel: 92 });
  a.section(BAND, { gtr: 'ring', sing: 'none', org: 'arp', bass: 'long', drums: ['half', 'half', 'half', 'fill'], vel: 92 });
  a.toll(0, 1);
  return a.cmf();
}

/** The four acts. */
export function levelSongs(): Uint8Array[] {
  // the bathroom: the band, verses 2 and 3, chorus 1
  const one = new Arranger();
  intro(one);
  one.section(there(BAND), { gtr: 'chug', sing: 'solo', org: 'arp', bass: 'eighths', drums: goth(4), vel: 98 });
  verse(one, VERSE2);
  verse(one, VERSE3);
  one.roll(1);
  chorus(one, CHORUS);
  // the forest-dark aisle: the bridge's second half, verse 4, chorus 2, the tribal toms
  const two = new Arranger();
  intro(two, 4);
  verse(two, VERSE4);
  verse(two, { ...BRIDGE, name: 'the aisle', chords: BRIDGE.chords.slice(4), tune: BRIDGE.tune.slice(4) });
  two.roll(1);
  chorus(two, CHORUS2);
  // home in the dark: verse 5, "why did I scrub", chorus 1, hushed
  const three = new Arranger(86);
  three.section(VERSE1, { gtr: 'none', sing: 'solo', org: 'hold', bass: 'long', drums: ['hats'], vel: 90 });
  verse(three, VERSE5, { vel: 94 });
  three.section(ROUGH, { gtr: 'ring', sing: 'solo', org: 'arp', bass: 'eighths', drums: goth(4), vel: 96 });
  chorus(three, CHORUS, { vel: 100 });
  // Scrubbus Maximus: the organ alone, the bridge crashing in, chorus 1 and then up a half step
  const four = new Arranger();
  four.swell('Fm', 2);
  four.section(
    { ...BRIDGE, name: 'scrubbus', chords: BRIDGE.chords.slice(0, 2), tune: BRIDGE.tune.slice(0, 2) },
    { gtr: 'none', sing: 'solo', org: 'hold', bass: 'long', drums: ['half'], vel: 100 },
  );
  four.roll(1);
  four.section(
    { ...BRIDGE, name: 'brine', chords: BRIDGE.chords.slice(2), tune: BRIDGE.tune.slice(2) },
    { gtr: 'ring', sing: 'choir', org: 'arp', bass: 'eighths', drums: ['crash', ...drive(4)], vel: 108 },
  );
  chorus(four, CHORUS, { vel: 110 });
  four.roll(1, [54, 52, 49, 47]);
  chorus(four, CHORUS, { vel: 114, shift: 1 });
  return [one.cmf(), two.cmf(), three.cmf(), four.cmf()];
}

/** Won: chorus 2 with the choir, and "Never touch the loofah", the bell tolling the end. */
export function wonSong(): Uint8Array {
  const a = new Arranger();
  a.section({ name: 'pickup', chords: ['C'], tune: ['r w'] }, { gtr: 'ring', sing: 'none', org: 'hold', bass: 'eighths', drums: ['fill'], vel: 100 });
  chorus(a, CHORUS2, { vel: 108 });
  const at = a.bar * 4;
  a.section(
    { ...OUTRO, name: 'never', chords: OUTRO.chords.slice(5), tune: OUTRO.tune.slice(5) },
    { gtr: 'ring', sing: 'choir', org: 'hold', bass: 'long', drums: ['goth', 'goth', 'crash', 'none'], vel: 100 },
  );
  a.toll(at + 12, 2);
  return a.cmf();
}

/** Lost: "I'm sleeping alone with a washcloth of shame", slow, the organ and the bell. */
export function lostSong(): Uint8Array {
  const a = new Arranger(76);
  a.section(
    { ...OUTRO, name: 'alone', chords: OUTRO.chords.slice(0, 5), tune: OUTRO.tune.slice(0, 5) },
    { gtr: 'none', sing: 'solo', org: 'hold', bass: 'long', drums: ['heart'], vel: 88 },
  );
  a.toll((a.bar - 1) * 4, 2, 41);
  return a.cmf();
}

/** The menu: the whole song in order, "She said" to "Never touch the loofah". */
export function wholeSong(): Uint8Array {
  const a = new Arranger();
  a.section(VERSE1, { gtr: 'none', sing: 'solo', org: 'hold', bass: 'long', drums: ['hats', 'hats', 'goth', 'fill'], vel: 94 });
  a.section(there(BAND), { gtr: 'ring', sing: 'solo', org: 'hold', bass: 'long', drums: goth(4), vel: 98 });
  verse(a, VERSE2, LITE);
  verse(a, VERSE3, LITE);
  chorus(a, CHORUS, LITE);
  a.section(ROUGH, { gtr: 'ring', sing: 'solo', org: 'hold', bass: 'long', drums: goth(4), vel: 100 });
  verse(a, VERSE4, LITE);
  verse(a, VERSE5, LITE);
  a.section(BRIDGE, { gtr: 'ring', sing: 'choir', org: 'hold', bass: 'long', drums: ['half', 'half', 'crash', ...goth(4)], vel: 104 });
  a.swell('Fm', 1);
  chorus(a, CHORUS2, { vel: 106, lite: true });
  a.section(OUTRO, {
    gtr: 'ring',
    sing: 'solo',
    org: 'hold',
    bass: 'long',
    drums: ['goth', 'goth', 'goth', 'goth', 'goth', 'goth', 'goth', 'crash', 'none'],
    vel: 96,
  });
  a.toll((a.bar - 2) * 4, 3, 41);
  return a.cmf();
}

/** Every song, by file name, for the build and the preview. */
export function allSongs(): Record<string, Uint8Array> {
  const levels = levelSongs();
  return {
    title: titleSong(),
    story: storySong(),
    bath: levels[0],
    aisle: levels[1],
    home: levels[2],
    shower: levels[3],
    won: wonSong(),
    lost: lostSong(),
    menu: wholeSong(),
  };
}
