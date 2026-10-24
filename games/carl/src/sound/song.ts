// The soundtrack: "A Fly Named Carl" ("There's a Fly in the Room (And It's Winning)", The Bard of
// Bizarre, 1995), a bouncy acoustic comedy song, arranged for the Sound Blaster's OPL2 FM chip as
// Creative Music Files in rhythm mode, with the tricks in games/kit/songFx.ts where they fit:
//   - the singer is a kazoo (a buzzy reed with vibrato), doubled an octave down by its twin
//     (the same patch without the vibrato) in the choruses, so the two beat like a section;
//   - three channels strum a ukulele, each strum spread a hair apart (down strums low to high, up
//     strums high to low) in an island strum: down, down-up, up-down-up;
//   - the bass is the bass drum, pitched (kit/songFx boomPatch): a sine boom that bounces on the
//     root and the fifth, which leaves a melodic channel for Carl himself;
//   - Carl is a buzz: a sawtooth patch with full feedback whose line is a fast arpeggio of close
//     semitones (a one-channel chord, the chiptune trick) that swoops up and away in stepped
//     glides (no pitch bend): a fly going past, the Doppler way;
//   - the "breakdown" is a nature documentary: the organ swells up out of nothing by program
//     changes (crescendo and filter sweep), the tom-toms roll like timpani, the narrator speaks
//     low, and the band stops dead for a dramatic pause before "Carl has seen things";
//   - "in doom... doom" echoes; "I hate Carl" stutters in the lost song;
//   - the last chorus goes up a half step in the game's last level;
//   - a marker at every section (PLAYGAME skips them; tools/songPreview.ts reads them).
//
// The notes come from games/carl/tools/analyze.py run over the recording (which is not in the
// repo): about 133 BPM, D minor (chords on Dm, C, Bb, Gm, Am, F and A), the bars:
//   intro                                    0.0 -   8.5
//   verse 1 "I sat down with my snacks..."   8.5 -  23.0
//   chorus 1 "...there's a fly in the room"  23.0 -  42.8  (the hook sits on G4, "in doom" echoes)
//   verse 2 "I tried the old clap..."       42.8 -  62.7
//   chorus 2 "...living rent-free"          62.7 -  84.4  ("I've named it Carl. I hate Carl." 76.3)
//   bridge "Carl watches me work..."        84.4 - 102.4
//   breakdown (spoken, a documentary)      102.4 - 113.3  ("Carl... has broken time" 109.3)
//   last chorus "...losing the war"        113.3 - 136.1
//   outro "Carl's got the aux cord now"    142.9 - 144.9
import { sbi } from '../../../kit/music';
import { CELESTA, Writer, type Groove } from '../../../kit/song';
import { DRUM, Fx, boomPatch, detuned, sweep } from '../../../kit/songFx';

export const BPM = 133;

// ---- the patches --------------------------------------------------------------------------

/** The singer: a kazoo (a buzzy reed, vibrato on the carrier). */
const KAZOO = sbi({
  modChar: 0x21,
  carChar: 0x61,
  modLevel: 0x12,
  carLevel: 0x00,
  modAD: 0x86,
  carAD: 0x76,
  modSR: 0x15,
  carSR: 0x16,
  modWave: 1,
  feedback: 0x0d,
});
/** Its twin without the vibrato, for the doubling. */
const KAZOO2 = detuned(KAZOO);
/** A ukulele: nylon, plucked, short. */
const UKE = sbi({
  modChar: 0x01,
  carChar: 0x01,
  modLevel: 0x1b,
  carLevel: 0x00,
  modAD: 0xf8,
  carAD: 0xf6,
  modSR: 0x46,
  carSR: 0x56,
  modWave: 2,
  feedback: 0x0a,
});
/** Carl: a fly's buzz (full feedback, a sawtooth, sustained). */
const FLY = sbi({ modChar: 0x21, carChar: 0x61, modLevel: 0x0a, carLevel: 0x04, modAD: 0xf2, carAD: 0xf2, modSR: 0x04, carSR: 0x05, feedback: 0x0f });
/** The narrator (low, warm, with vibrato). */
const NARRATOR = sbi({
  modChar: 0x61,
  carChar: 0x61,
  modLevel: 0x1c,
  carLevel: 0x00,
  modAD: 0x63,
  carAD: 0x74,
  modSR: 0x15,
  carSR: 0x16,
  modWave: 1,
  feedback: 0x0c,
});
/** The documentary's strings-and-organ swell, from a whisper to full (8 steps). */
const PAD = sbi({
  modChar: 0x21,
  carChar: 0xa1,
  modLevel: 0x18,
  carLevel: 0x08,
  modAD: 0xf0,
  carAD: 0xf0,
  modSR: 0x0f,
  carSR: 0x0f,
  carWave: 1,
  feedback: 0x05,
});
const SWELL = sweep(PAD, 8, { mod: 44, car: 44 }, { mod: 16, car: 6 });
/** A music box for the bedroom at night and the wild. */
const BOX = CELESTA;
/** The bass drum as the bass. */
const BOOM = boomPatch({ decay: 4, release: 5 });
/** A deep kick for the hits. */
const THUD = boomPatch({ decay: 8, release: 9, growl: 0x18 });
/** Tom-toms tuned like timpani. */
const TIMP = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x02, carLevel: 0x00, modAD: 0xf5, carAD: 0x00, modSR: 0x35, carSR: 0x00, feedback: 0x00 });
/** A brushy snare and a shaker for the hats. */
const BRUSH = sbi({ modChar: 0x02, carChar: 0x00, modLevel: 0x08, carLevel: 0x00, modAD: 0xf6, carAD: 0x00, modSR: 0x07, carSR: 0x00, feedback: 0x00 });
const SHAKER = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x0c, carLevel: 0x00, modAD: 0xfa, carAD: 0x00, modSR: 0x0a, carSR: 0x00, feedback: 0x00 });
const SWISH = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x06, carLevel: 0x00, modAD: 0x94, carAD: 0x00, modSR: 0x05, carSR: 0x00, feedback: 0x00 });

// ---- chords -------------------------------------------------------------------------------

const PC: Record<string, number> = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };

function shape(name: string): { pc: number; iv: number[] } {
  const m = /^([A-G]b?)(m?)(7?)$/.exec(name);
  if (!m) throw new Error(`Unknown chord ${name}`);
  const third = m[2] ? 3 : 4;
  return { pc: PC[m[1]], iv: m[3] ? [0, third, 7, 10] : [0, third, 7] };
}

const fold = (pc: number, lo: number) => lo + ((pc - lo + 120) % 12);

/** A ukulele's three strummed notes, between G4 and A5 (re-entrant tuning sits high). */
function uke(name: string, shift = 0): number[] {
  const { pc, iv } = shape(name);
  return iv
    .slice(0, 3)
    .map((i) => fold(pc + i + shift, 64))
    .sort((a, b) => a - b);
}

/** The bass root (D2..C#3). */
const root = (name: string, shift = 0) => fold(shape(name).pc + shift, 38);

// ---- the song's material ------------------------------------------------------------------

interface Section {
  name: string;
  /** One chord per bar, or two ("C F": half a bar each). */
  chords: string[];
  /** One bar of the singer per string (4 beats; kit/songFx tones()). */
  tune: string[];
}

const INTRO: Section = {
  name: 'intro',
  chords: ['Dm', 'C', 'Bb', 'A'],
  tune: ['r w', 'r w', 'r w', 'r h, r q, A4 q'], // (I)
};

/** "I sat down with my snacks and my Netflix queue, / Just me and the silence, not a thing to do. / Then came a buzz like a judgmental tune— / Now there's a fly in the room..." */
const VERSE1: Section = {
  name: 'verse 1',
  chords: ['Dm', 'Am', 'Dm', 'Dm Gm', 'C F', 'F Bb', 'Bb Am', 'A'],
  tune: [
    'r e, Bb4 e, D5 q, D5 e, E5 e, F5 q', // sat down with my snacks
    'A4 q, A4 e, A4 e, G4 e, A4 q.', // and my Net-flix queue,
    'r h, r e, Bb4 q.', // Just
    'F4 e, F4 e, A4 e, G4 e, G4 q, C5 q', // me and the si-lence, not
    'D5 e, C5 e, C5 q, r e, A4 q.', // a thing to do.
    'r q, r e, F4 q, D4 q, D4 e', // Then came a
    'F4 e, F4 q., F4 e, D4 e, E4 e, F4 e', // buzz like a judg-men-tal
    'r q, ~A4 h, r q', // tune.
  ],
};

/** "Now there's a fly in the room and it's louder than June. / There's a fly in the room and it's got a vendetta, / Dancing through air like it's wearing stilettos. / I swing and I miss, it loops and resumes— / I think this fly has a college degree in doom." */
const CHORUS: Section = {
  name: 'chorus 1',
  chords: ['Bb', 'C', 'Dm', 'Gm', 'C', 'C F', 'Bb A', 'Dm', 'Dm Am', 'Am', 'Bb', 'Dm'],
  tune: [
    'r e, D5 e, D5 e, E5 e, E5 q, E5 e, D5 e', // Now there's a fly in the room and
    'C5 e, E5 e, D5 q, D5 h', // it's loud-er than June.
    'r h, r q, r e, D5 e', // There's
    'G4 e, G4 e, G4 e, F4 e, G4 q, G4 e, F4 e', // a fly in the room and it's
    'G4 e, G4 e, G4 h, F4 e, G4 e', // got a ven-det-ta. Danc-ing
    'F4 e, G4 e, F4 e, G4 q., E4 e, E4 e', // through air like sti-let-tos. I swing
    'F4 e, E4 e, F4 e, E4 e, E4 q, Db4 q', // and I miss, it loops and re-
    'r e, F4 q., ~D4 h', // -sumes.
    'D4 q, D4 e, D4 q, E4 q, D4 e', // I think this fly has
    'r e, E4 e, F4 q, D4 h', // a col-lege de-gree
    'r h, ~D4 h', // in doom...
    'D4 w', // doom.
  ],
};

/** The second chorus: "Yeah, there's a fly in the room, and it's living rent-free, / On my lamp, on my food, on my sanity. / I've named it Carl. I hate Carl. It's true. / But now Carl's the roommate I never meant to choose." */
const CHORUS2: Section = {
  name: 'chorus 2',
  chords: ['Bb', 'C', 'Dm', 'Gm', 'C', 'C F', 'Bb A', 'Dm', 'Dm Am', 'Am', 'Bb', 'Dm'],
  tune: [
    'r e, F4 e, D4 e, G4 e, A4 q, G4 e, F4 e', // Yeah, there's a fly in the room and
    'G4 e, G4 e, A4 e, E4 q., r q', // it's liv-ing rent-free,
    'r e, D4 e, D4 q, Db4 e, Db4 e, E4 q', // On my lamp, on my food,
    'r e, D4 e, D4 e, G4 q, F4 e, E4 q', // on my san-i-ty.
    'r h, D4 e, D4 e, E4 e, F4 e', // I've named it
    'F4 q, r e, A4 e, F4 e, D4 q.', // Carl. I hate Carl.
    'r e, A4 e, A4 h, r q', // It's true.
    'F4 q., A4 e, E4 e, F4 e, G4 e, F4 e', // But now Carl's the room-mate I
    'E4 e, E4 e, D4 e, D4 q., r q', // nev-er meant to choose.
    'r w',
    'r w',
    'r w',
  ],
};

/** "I tried the old clap—missed it by miles. / It landed on the wall, just to flash me a smile. / I grabbed a dish towel, turned ninja real fast, / But that fly did a barrel roll—straight from the past." */
const VERSE2: Section = {
  name: 'verse 2',
  chords: ['Dm', 'Am', 'Dm', 'Dm Gm', 'C F', 'F Bb', 'Bb Am', 'A'],
  tune: [
    'r e, D4 q, Db4 e, E4 e, F4 e, D4 q', // I tried the old clap,
    'r q, A4 e, C5 e, C5 e, A4 q.', // missed it by miles.
    'r e, F4 e, F4 e, D4 e, D4 e, G4 e, G4 e, D4 e', // It land-ed on the wall just to
    'C4 e, G4 e, G4 e, A4 q., r q', // flash me a smile.
    'r e, C5 e, D5 q, D5 e, F4 e, Bb4 q', // I grabbed a dish tow-el,
    'r e, D5 e, C5 e, D5 q, E5 e, A4 q', // turned nin-ja real fast,
    'r e, F4 e, A4 e, D5 e, D5 e, F4 e, F4 e, D4 e', // But that fly did a bar-rel roll
    'F4 e, Db4 e, Db4 e, D4 q., r q', // straight from the past.
  ],
};

/** "Carl watches me work. Carl joins me in bed. / Carl buzzes near my ear like he's reading my head. / I've opened the window. I've begged him to leave. / But Carl's got ambitions I can't even perceive." */
const BRIDGE: Section = {
  name: 'bridge',
  chords: ['Dm', 'Dm Am', 'Am Bb', 'Bb C', 'Dm', 'Dm Gm', 'Gm Am', 'A'],
  tune: [
    'r q, D4 q, D4 e, E4 e, F4 q', // Carl watch-es me work.
    'r q, D4 q, D4 e, D4 e, E4 q', // Carl joins me in bed.
    'r e, C4 e, D4 e, D4 e, D4 e, E4 e, D4 q', // Carl buzz-es near my ear
    'D4 e, E4 e, G4 e, G4 e, E4 e, D4 q.', // like he's read-ing my head.
    'r e, D4 e, A4 e, A4 e, D5 h', // I've o-pened the win-dow.
    'Bb4 e, D5 e, C5 e, Bb4 e, A4 h', // I've begged him to leave.
    'r q, Db5 e, A4 e, F4 e, E4 q.', // But Carl's got am-bi-tions
    'F4 e, E4 e, D4 e, D4 e, D4 h', // I can't e-ven per-ceive.
  ],
};

/** The breakdown, spoken like a nature documentary's narrator: "Some say flies live 24 hours. / Carl... has broken time. / Carl has seen things." */
const BREAKDOWN: Section = {
  name: 'breakdown',
  chords: ['Dm', 'Dm', 'Am', 'Am', 'Am', 'Dm'],
  tune: [
    'r h, D4 e, G4 e, A4 q', // Some say flies
    'G4 e, A4 q, A4 e, A4 h', // live twen-ty-four hours.
    'r q, A4 h, r q', // Carl...
    'Bb4 e, C5 q, C5 e, C5 h', // has bro-ken time.
    'r w', // (the pause)
    'r e, F4 e, F4 e, A4 e, ~A4 h', // Carl has seen things.
  ],
};

/** The last chorus: "There's a fly in the room and I'm losing the war, / I tried sage, essential oils—now I just mop the floor. / If you come over and see me in gloom, / Just know... I'm sharing my life with a fly in the room." */
const FINAL: Section = {
  name: 'last chorus',
  chords: ['Bb', 'C', 'Dm', 'Gm', 'C', 'C F', 'Bb A', 'Dm', 'Dm'],
  tune: [
    'r e, D5 e, D5 e, E5 e, E5 q, E5 e, D5 e', // There's a fly in the room and I'm
    'E5 e, D5 e, D5 e, A4 q., r q', // los-ing the war.
    'r q, A4 e, E4 e, D4 e, D4 e, F4 q', // I tried sage, es-sen-tial
    'F4 e, F4 e, D4 e, D4 e, E4 e, Db4 e, Db4 e, D4 e', // oils, now I just mop the floor.
    'r e, A4 e, F4 e, A4 e, A4 e, Bb4 e, A4 e, G4 e', // If you come o-ver and see me
    'G4 e, A4 q., r h', // in gloom,
    'r e, F4 q., D4 e, E4 e, E4 e, E4 e', // Just know... I'm shar-ing my
    'Db4 e, D4 e, E4 e, E4 q, E4 e, Db4 e, D4 e', // life with a fly in the
    '~D4 w', // room.
  ],
};

/** The outro, quietly: "Rest in peace, peace and quiet. / Carl's got the aux cord now." */
const OUTRO: Section = {
  name: 'outro',
  chords: ['Dm', 'Bb', 'A', 'Dm'],
  tune: [
    'r e, A4 e, A4 q, F4 e, E4 e, D4 q', // Rest in peace, peace and qui-
    'D4 h, r h', // -et.
    'r e, E4 e, E4 e, E4 e, F4 e, D4 e, D4 q', // Carl's got the aux cord now.
    'r w',
  ],
};

// ---- the band -----------------------------------------------------------------------------

const LEAD = 0;
const TWIN = 1;
const STRUM = [2, 3, 4];
/** Carl's own channel: the buzz (and the music box). */
const CARL = 5;

/** Grooves on a sixteenth grid: a brush backbeat and a shaker. */
const GROOVE: Record<string, Groove> = {
  bounce: { s: '....X.......X...', h: 'x.xxx.xxx.xxx.xx' },
  push: { s: '....X.......X.x.', h: 'x.xxx.xxx.xxx.xx' },
  fill: { s: '....X.....x.XxXX', h: 'x.xxx.xxx.......' },
  shaker: { h: 'x.x.x.x.x.x.x.x.' },
  none: {},
};

interface Play {
  /** How the uke plays: an island strum, plucked on the beat, or rests. */
  uke: 'strum' | 'pluck' | 'none';
  /** The singer: alone, doubled by its twin an octave down, or not at all. */
  sing: 'solo' | 'double' | 'none';
  bass: 'bounce' | 'long' | 'none';
  /** A groove name per bar (the last one repeats). */
  drums: string[];
  vel?: number;
  shift?: number;
  /** Carl buzzes in the gaps (bars where the singer rests). */
  buzz?: boolean;
  /** Strum on the off-beats only (down, up, up, up): fewer notes, for the long menu song. */
  lite?: boolean;
  /** The singer's patch for this section (the narrator for the breakdown). */
  voice?: Uint8Array;
  /** Beats into the section where the band stops dead (the singer may go on). */
  cut?: number;
}

/** The island strum: [beat, down?] for one bar (down, down-up, up-down-up). */
const STRUM_AT: [number, boolean][] = [
  [0, true],
  [1, true],
  [1.5, false],
  [2.5, false],
  [3, true],
  [3.5, false],
];

const STRUM_LITE: [number, boolean][] = [
  [0, true],
  [1.5, false],
  [2.5, false],
  [3.5, false],
];

class Arranger {
  readonly fx: Fx;
  bar = 0;
  constructor(bpm = BPM) {
    const w = new Writer(bpm);
    this.fx = new Fx(w);
    this.fx.open(LEAD, KAZOO).open(TWIN, KAZOO2);
    STRUM.forEach((ch) => this.fx.open(ch, UKE));
    this.fx.open(CARL, FLY);
    this.fx.open(DRUM.kick, BOOM).open(DRUM.snare, BRUSH).open(DRUM.tom, TIMP).open(DRUM.cymbal, SWISH).open(DRUM.hat, SHAKER);
  }

  get w(): Writer {
    return this.fx.w;
  }

  /** Carl flies by: a buzz of close semitones (a one-channel arpeggio) that swoops up and away. */
  flyBy(at: number, beats: number, base = 62, vel = 70): this {
    const fx = this.fx;
    fx.program(CARL, at, FLY);
    const rise = Math.max(0.5, beats * 0.4);
    fx.arp(CARL, at, rise, [base, base + 1, base, base + 2], 1 / 12, vel, 'updown');
    // the Doppler: up as he comes close, then down and away
    const t = fx.slide(CARL, at + rise, base + 2, base + 7, 2, vel + 10);
    fx.slide(CARL, t, base + 6, base - 5, 3, vel - 10);
    return this;
  }

  /** Lays out a section from bar `this.bar` and moves on. */
  section(s: Section, p: Play): this {
    const fx = this.fx;
    const at0 = this.bar * 4;
    const vel = p.vel ?? 100;
    const shift = p.shift ?? 0;
    fx.marker(at0, s.name);
    fx.program(LEAD, at0, p.voice ?? KAZOO);
    s.tune.forEach((bar, i) => {
      const at = at0 + i * 4;
      const names = s.chords[i].split(' ');
      if (p.sing !== 'none') {
        const len = fx.phrase(LEAD, at, bar, vel + 6, shift);
        if (Math.abs(len - 4) > 1e-6) throw new Error(`${s.name} bar ${i + 1} is ${len} beats: ${bar}`);
        if (p.sing === 'double') fx.phrase(TWIN, at, bar, vel - 14, shift - 12);
      }
      const cut = at0 + (p.cut ?? Infinity);
      // Carl buzzes through a bar the singer leaves (almost) empty
      if (p.buzz && /^r (w|h, r)/.test(bar) && at + 1 < cut) this.flyBy(at + 1, 2.5, 62 + ((i * 5) % 7), vel - 30);
      names.forEach((name, k) => {
        const t = at + (k * 4) / names.length;
        if (t >= cut) return;
        const span = Math.min(4 / names.length, cut - t);
        const v = uke(name, shift);
        if (p.uke === 'strum')
          for (const [b, down] of p.lite ? STRUM_LITE : STRUM_AT) {
            if (b < k * span || b >= (k + 1) * span) continue;
            const st = at + b;
            if (st >= cut) continue;
            const order = down ? v : [...v].reverse();
            order.forEach((n, j) => fx.note(STRUM[j], st + j / 24, 0.45 - j / 24, n, vel - (down ? 28 : 38) + j * 2, 0.95));
          }
        if (p.uke === 'pluck') v.forEach((n, j) => fx.note(STRUM[j], t + j / 6, span - j / 6, n + (j === 2 ? 12 : 0), vel - 34, 0.98));
        const r = root(name, shift);
        if (p.bass === 'long') fx.boom(t, span, r, vel);
        if (p.bass === 'bounce') {
          fx.boom(t, Math.min(span, 1), r, vel + 6);
          if (span >= 2) fx.boom(t + 1.5, 0.5, r + 7, vel - 16).boom(t + span - 1, 1, r + (span > 2 ? 7 : 12), vel - 10);
        }
      });
      const name = p.drums[Math.min(i, p.drums.length - 1)];
      const groove = GROOVE[name];
      if (!groove) throw new Error(`No groove ${name}`);
      const steps = Math.max(0, Math.min(16, Math.round((cut - at) * 4)));
      const cutGroove: Groove = Object.fromEntries(Object.entries(groove).map(([d, grid]) => [d, grid!.slice(0, steps).padEnd(16, '.')]));
      if (steps > 0) this.w.drums(at, cutGroove, vel - 22);
    });
    this.bar += s.tune.length;
    return this;
  }

  /** The cymbal swells and the timpani roll up into the next bar (`beats` long, ending on it). */
  roll(beats = 2, toms = [45, 48, 50, 52]): this {
    const at = this.bar * 4 - beats;
    this.fx.drumRoll(DRUM.cymbal, at, beats, 1 / 4, 30, 110);
    this.fx.drumRoll(DRUM.tom, at, beats, 1 / 4, 50, 120, toms);
    return this;
  }

  /** A band hit on the downbeat of the next bar. */
  hit(chord: string, shift = 0): this {
    const at = this.bar * 4;
    this.fx
      .program(DRUM.kick, at, THUD)
      .boom(at, 1, root(chord, shift), 127)
      .program(DRUM.kick, at + 1, BOOM);
    this.fx.drumRoll(DRUM.cymbal, at, 1 / 4, 1 / 4, 120, 120);
    return this;
  }

  cmf(): Uint8Array {
    if (!Number.isInteger(this.bar)) throw new Error(`The song ends mid-bar (${this.bar})`);
    return this.fx.cmf(this.bar);
  }
}

const bounce = (n: number, last = 'fill') => [...new Array(n - 1).fill('bounce'), last];

/** The intro: the uke strums in, and Carl flies by twice. */
function intro(a: Arranger, sing = true): void {
  const at = a.bar * 4;
  a.section(INTRO, { uke: 'strum', sing: sing ? 'solo' : 'none', bass: 'bounce', drums: ['shaker', 'shaker', 'bounce', 'fill'], vel: 96 });
  a.flyBy(at + 1, 2.5, 62, 74).flyBy(at + 9, 2.5, 66, 78);
}

/** A chorus, the singer doubled, the full band, the doom echoing at the end. */
function chorus(a: Arranger, s: Section, o: { shift?: number; vel?: number; lite?: boolean } = {}): void {
  const at = a.bar * 4;
  a.section(s, { uke: 'strum', sing: 'double', bass: 'bounce', drums: bounce(s.tune.length), vel: o.vel ?? 104, shift: o.shift, buzz: true, lite: o.lite });
  // "in doom... doom... doom" (the first chorus's tag)
  if (s === CHORUS) a.fx.echo(TWIN, at + 40, 'r h, D4 h', 70, 1, 2, 0.6, o.shift ?? 0);
}

/** The documentary: the swell rises, the timpani roll, the narrator, the pause. */
function breakdown(a: Arranger, cutBeforeSeen = true): void {
  const at = a.bar * 4;
  STRUM.forEach((ch) => a.fx.program(ch, at, SWELL[0]));
  a.section(BREAKDOWN, { uke: 'none', sing: 'solo', bass: 'long', drums: ['none'], vel: 92, voice: NARRATOR, cut: cutBeforeSeen ? 16 : undefined });
  // the strings swell under "Some say flies live twenty-four hours" and "Carl... has broken time"
  [55, 57, 62].forEach((n, j) => a.fx.note(STRUM[j], at, 15.5, n, 70, 1));
  a.fx.swell(STRUM, at, 14, SWELL);
  a.fx.drumRoll(DRUM.tom, at + 12, 3.5, 1 / 4, 40, 118, [45, 45, 47, 45]);
  // a music box twinkles over "Carl has seen things", after the pause
  a.fx.program(CARL, at + 20, BOX);
  a.fx.arp(CARL, at + 20, 4, [74, 77, 81, 86], 1 / 4, 60, 'updown');
  STRUM.forEach((ch) => a.fx.program(ch, at + 24, UKE));
  a.fx.program(CARL, at + 24, FLY);
}

/** Title: the intro, Carl flies by, "There's a fly in the room" with the whole band. */
export function titleSong(): Uint8Array {
  const a = new Arranger();
  intro(a, false);
  a.section(
    { name: 'hook', chords: CHORUS.chords.slice(2, 8), tune: CHORUS.tune.slice(2, 8) },
    { uke: 'strum', sing: 'double', bass: 'bounce', drums: bounce(6), vel: 104 },
  );
  a.hit('Dm');
  a.section({ name: 'tag', chords: ['Dm', 'Dm'], tune: ['r w', 'r w'] }, { uke: 'none', sing: 'none', bass: 'none', drums: ['none'], vel: 90 });
  a.flyBy((a.bar - 2) * 4 + 1, 4, 64, 84);
  return a.cmf();
}

/** Story pages: verse 1, gently: the uke plucked, a shaker, Carl buzzing in. */
export function storySong(): Uint8Array {
  const a = new Arranger(126);
  intro(a);
  a.section(VERSE1, { uke: 'pluck', sing: 'solo', bass: 'long', drums: ['shaker'], vel: 92, buzz: true });
  return a.cmf();
}

/** The six levels. */
export function levelSongs(): Uint8Array[] {
  // the couch: the intro, verse 1, chorus 1
  const one = new Arranger();
  intro(one);
  one.section(VERSE1, { uke: 'strum', sing: 'solo', bass: 'bounce', drums: bounce(8), vel: 100, buzz: true });
  chorus(one, CHORUS);
  // the walls: verse 2 into chorus 2
  const two = new Arranger();
  two.section(VERSE2, { uke: 'strum', sing: 'solo', bass: 'bounce', drums: bounce(8), vel: 100, buzz: true });
  chorus(two, CHORUS2);
  // the bed: the bridge by night (the music box, a shaker), chorus 2 hushed
  const three = new Arranger(124);
  three.fx.program(CARL, 0, BOX);
  three.section(BRIDGE, { uke: 'pluck', sing: 'solo', bass: 'long', drums: ['shaker'], vel: 88 });
  for (let b = 0; b < 8; b++)
    three.fx.arp(
      CARL,
      b * 4 + 2,
      2,
      uke(BRIDGE.chords[b].split(' ').pop()!).map((n) => n + 12),
      1 / 2,
      52,
      'up',
    );
  three.fx.program(CARL, three.bar * 4, FLY);
  chorus(three, CHORUS2, { vel: 92 });
  // the window: the bridge's second half and chorus 1, bright
  const four = new Arranger();
  four.section(
    { name: 'the window', chords: BRIDGE.chords.slice(4), tune: BRIDGE.tune.slice(4) },
    { uke: 'strum', sing: 'solo', bass: 'bounce', drums: bounce(4), vel: 100 },
  );
  four.roll(1).hit('Bb');
  chorus(four, CHORUS);
  // the wild: the documentary, Carl buzzing, the documentary again
  const five = new Arranger(120);
  breakdown(five);
  five.section(
    { name: 'the wild', chords: ['Dm', 'C', 'Bb', 'A', 'Dm', 'C', 'Bb', 'A'], tune: new Array(8).fill('r w') },
    { uke: 'pluck', sing: 'none', bass: 'long', drums: ['shaker'], vel: 92, buzz: true },
  );
  breakdown(five, false);
  // the aux cord: the last chorus, then up a half step, and the outro
  const six = new Arranger();
  chorus(six, FINAL);
  six.roll(1, [47, 50, 52, 54]).hit('Bb', 1);
  chorus(six, FINAL, { shift: 1, vel: 112 });
  six.section(OUTRO, { uke: 'pluck', sing: 'solo', bass: 'long', drums: ['none'], vel: 84, shift: 1 });
  return [one.cmf(), two.cmf(), three.cmf(), four.cmf(), five.cmf(), six.cmf()];
}

/** Won: the last chorus and the outro, "Carl's got the aux cord now", and Carl flies off. */
export function wonSong(): Uint8Array {
  const a = new Arranger();
  a.section({ name: 'pickup', chords: ['A'], tune: ['r w'] }, { uke: 'strum', sing: 'none', bass: 'bounce', drums: ['fill'], vel: 100 });
  a.flyBy(1, 2.5, 64, 80);
  a.hit('Bb');
  chorus(a, FINAL, { vel: 110 });
  const at = a.bar * 4;
  a.section(OUTRO, { uke: 'pluck', sing: 'solo', bass: 'long', drums: ['none'], vel: 86 });
  a.flyBy(at + 13, 3, 66, 86);
  return a.cmf();
}

/** Lost: "I've named it Carl. I hate Carl.", slow and alone, the last "Carl" stuttering, and Carl buzzes off laughing. */
export function lostSong(): Uint8Array {
  const a = new Arranger(100);
  a.section(
    { name: 'i hate carl', chords: ['C', 'C F', 'Bb A', 'Dm'], tune: [CHORUS2.tune[4], CHORUS2.tune[5], CHORUS2.tune[6], 'r w'] },
    { uke: 'pluck', sing: 'solo', bass: 'long', drums: ['none'], vel: 84 },
  );
  a.fx.stutter(TWIN, 8, 62, 4, 0.5, 64);
  a.flyBy(12.5, 3, 64, 76);
  return a.cmf();
}

/** The menu: the whole song in order, intro to "Carl's got the aux cord now." */
export function wholeSong(): Uint8Array {
  const a = new Arranger();
  intro(a);
  a.section(VERSE1, { uke: 'strum', sing: 'solo', bass: 'bounce', drums: bounce(8), vel: 98, buzz: true, lite: true });
  chorus(a, CHORUS, { lite: true });
  a.section(VERSE2, { uke: 'strum', sing: 'solo', bass: 'bounce', drums: bounce(8), vel: 98, buzz: true, lite: true });
  chorus(a, CHORUS2, { lite: true });
  a.section(BRIDGE, { uke: 'pluck', sing: 'solo', bass: 'long', drums: ['shaker'], vel: 92 });
  breakdown(a);
  a.hit('Bb');
  chorus(a, FINAL, { vel: 110, lite: true });
  a.section(OUTRO, { uke: 'pluck', sing: 'solo', bass: 'long', drums: ['none'], vel: 84 });
  return a.cmf();
}

/** Every song, by file name, for the build and the preview. */
export function allSongs(): Record<string, Uint8Array> {
  const levels = levelSongs();
  return {
    title: titleSong(),
    story: storySong(),
    couch: levels[0],
    walls: levels[1],
    bed: levels[2],
    window: levels[3],
    wild: levels[4],
    aux: levels[5],
    won: wonSong(),
    lost: lostSong(),
    menu: wholeSong(),
  };
}
