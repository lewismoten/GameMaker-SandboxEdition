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
import { encodeCmf, type CmfEvent } from '../../../../web/src/formats/cmf';
import { INSTRUMENTS, midi, sbi } from '../../../kit/music';

// ---- patches ------------------------------------------------------------------------------

/** A reedy, slightly bleating lead with vibrato (the singer). */
const VOICE = sbi({ modChar: 0x62, carChar: 0x61, modLevel: 0x1d, carLevel: 0x00, modAD: 0x64, carAD: 0x75, modSR: 0x16, carSR: 0x17, feedback: 0x0c });
/** Oboe-ish double reed for verse 1. */
const REED = sbi({ modChar: 0x31, carChar: 0x22, modLevel: 0x1e, carLevel: 0x00, modAD: 0x72, carAD: 0x73, modSR: 0x06, carSR: 0x07, modWave: 1, feedback: 0x0a });
/** Gospel drawbar organ for the comping. */
const ORGAN = sbi({ modChar: 0x22, carChar: 0x21, modLevel: 0x4a, carLevel: 0x05, modAD: 0xf0, carAD: 0xf0, modSR: 0x0f, carSR: 0x0f, feedback: 0x01 });
/** A soft flute for the story pages and the menu. */
const FLUTE = sbi({ modChar: 0x61, carChar: 0x61, modLevel: 0x24, carLevel: 0x00, modAD: 0x54, carAD: 0x75, modSR: 0x06, carSR: 0x06, feedback: 0x0e });
/** Plucked "oud" for the wise men's camel strut. */
const OUD = sbi({ modChar: 0x03, carChar: 0x01, modLevel: 0x16, carLevel: 0x00, modAD: 0xf6, carAD: 0xf4, modSR: 0x44, carSR: 0x45, modWave: 2, feedback: 0x0c });
/** Celesta / music box. */
const CELESTA = sbi({ modChar: 0x05, carChar: 0x01, modLevel: 0x1c, carLevel: 0x00, modAD: 0xf6, carAD: 0xf4, modSR: 0x34, carSR: 0x25, feedback: 0x06 });
/** Electric piano for comping. */
const EPIANO = sbi({ modChar: 0x01, carChar: 0x01, modLevel: 0x55, carLevel: 0x05, modAD: 0xf2, carAD: 0xd3, modSR: 0x63, carSR: 0x74, feedback: 0x08 });
/** A rounder fingered bass. */
const BASS = sbi({ modChar: 0x01, carChar: 0x01, modLevel: 0x16, carLevel: 0x00, modAD: 0xf4, carAD: 0xf4, modSR: 0x26, carSR: 0x36, feedback: 0x0a });

// Rhythm mode drums, instruments 11-15. The bass drum is a whole two-operator voice (FM
// channel 6); the other four are one operator each, read from the SBI's modulator half.
const KICK = sbi({ modChar: 0x01, carChar: 0x01, modLevel: 0x0e, carLevel: 0x00, modAD: 0xf8, carAD: 0xf7, modSR: 0x77, carSR: 0x57, feedback: 0x08 });
const SNARE = sbi({ modChar: 0x02, carChar: 0x00, modLevel: 0x02, carLevel: 0x00, modAD: 0xf7, carAD: 0x00, modSR: 0x07, carSR: 0x00, feedback: 0x00 });
const TOM = sbi({ modChar: 0x02, carChar: 0x00, modLevel: 0x04, carLevel: 0x00, modAD: 0xf7, carAD: 0x00, modSR: 0x37, carSR: 0x00, feedback: 0x00 });
const CYMBAL = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x08, carLevel: 0x00, modAD: 0xf4, carAD: 0x00, modSR: 0x04, carSR: 0x00, feedback: 0x00 });
const HIHAT = sbi({ modChar: 0x01, carChar: 0x00, modLevel: 0x06, carLevel: 0x00, modAD: 0xf9, carAD: 0x00, modSR: 0x09, carSR: 0x00, feedback: 0x00 });

// ---- the song's material ------------------------------------------------------------------

interface Section {
  /** One chord per bar. */
  chords: string[];
  /** One string of notes per bar (4 beats each), "G4 q, r e, ..." as in kit/music. */
  tune: string[];
}

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

// ---- the writer ---------------------------------------------------------------------------

const LEN: Record<string, number> = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };
const tokens = (s: string) => s.split(',').map((t) => t.trim()).filter(Boolean);

/** Notes as [midi or null for a rest, beats]. */
function parse(s: string): [number | null, number][] {
  return tokens(s).map((t) => {
    const m = /^(\S+)\s+([whqes])(\.?)$/.exec(t);
    if (!m) throw new Error(`Bad note "${t}"`);
    return [midi(m[1]), LEN[m[2]] * (m[3] ? 1.5 : 1)];
  });
}

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

type Drum = 'k' | 's' | 't' | 'c' | 'h';
const DRUM_CH: Record<Drum, number> = { k: 11, s: 12, t: 13, c: 14, h: 15 };
/** Drum pitch (sets the OPL channel's frequency): the snare and hi-hat share channel 7, the tom and cymbal channel 8. */
const DRUM_NOTE: Record<Drum, number> = { k: 36, s: 55, t: 48, c: 72, h: 55 };

/** One bar of drums: per drum an 8th-note (8 chars) or 16th-note (16 chars) grid; 'x' hits, 'X' accents, '.' rests. */
type Groove = Partial<Record<Drum, string>>;

const GROOVES: Record<string, Groove> = {
  rock: { k: 'x...x.x.', s: '..X...X.', h: 'xxxxxxxx' },
  rock4: { k: 'x...x.x.', s: '..X...X.', h: 'x.x.x.x.' },
  rockFill: { k: 'x...x...', s: '..X..xXX', t: '......xx', h: 'xxxxx...' },
  crash: { k: 'x...x.x.', s: '..X...X.', c: 'X.......', h: '.xxxxxxx' },
  half: { k: 'x.......', s: '....X...', h: 'x.x.x.x.' },
  soft: { k: 'x.......', h: '..x...x.' },
  shuffle: { k: 'x..x..x.', s: '..X...X.', h: 'x.xxx.xx' },
  camel: { k: 'x.....x.', t: '..x.x..x', s: '....X...', h: 'x.x.x.x.' },
  ride: { k: 'x...x...', s: '....x...', c: 'x.x.x.x.' },
  gospel: { k: 'x..x..x.', s: '..X...X.', h: 'xxxxxxxx', t: '........' },
  none: {},
};

interface Part {
  section: Section;
  /** Melody patch on channel 0 (and the optional double on channel 1). */
  lead: Uint8Array;
  leadVel?: number;
  /** Transpose the whole part (semitones). */
  shift?: number;
  /** Play the tune this much higher than written (12 for the flute and celesta). */
  up?: number;
  /** Channel 1: 'double' the tune an octave under the lead, 'octave' an octave over it, or none. */
  second?: 'double' | 'octave' | 'none';
  secondPatch?: Uint8Array;
  secondVel?: number;
  bass: 'whole' | 'half' | 'pump' | 'walk' | 'eighths';
  bassPatch?: Uint8Array;
  bassVel?: number;
  /** Comping rhythm for one bar: 'x' chord, 'r' rest, each with a length, e.g. 'r e, x e, r e, x e, ...'. */
  comp: string;
  compPatch: Uint8Array;
  compVel?: number;
  /** A groove name per bar (the last one repeats). */
  drums: string[];
  drumVel?: number;
  /** Leave the tune out (bars of band only). */
  noTune?: boolean;
}

class Writer {
  readonly tpb: number;
  readonly events: CmfEvent[] = [];
  readonly instruments: Uint8Array[] = [];
  bar = 0;
  private current: (Uint8Array | undefined)[] = [];

  constructor(bpm: number) {
    this.tpb = Math.round((146 * 60) / bpm);
    // Rhythm mode before any note: channels 0-5 melodic, 11-15 the drums.
    this.events.push({ tick: 0, data: [0xb0, 0x67, 0x01] });
    this.instruments[11] = KICK;
    this.instruments[12] = SNARE;
    this.instruments[13] = TOM;
    this.instruments[14] = CYMBAL;
    this.instruments[15] = HIHAT;
  }

  private tick(beats: number): number {
    return Math.round(beats * this.tpb);
  }

  /** A note from beat `at` lasting `len` beats; it lets go a little early so the next one retriggers. */
  note(ch: number, at: number, len: number, n: number, vel: number, legato = 0.9): void {
    const on = this.tick(at);
    const off = Math.max(on + 1, Math.min(this.tick(at + len) - 1, on + Math.round(len * this.tpb * legato)));
    this.events.push({ tick: on, data: [0x90 | ch, n, vel] });
    this.events.push({ tick: off, data: [0x80 | ch, n, 0] });
  }

  /** Plays a note string from beat `at`; returns its length in beats. */
  line(ch: number, at: number, s: string, vel: number, shift = 0, legato = 0.9): number {
    let t = at;
    for (const [n, len] of parse(s)) {
      if (n !== null) this.note(ch, t, len, n + shift, vel, legato);
      t += len;
    }
    return t - at;
  }

  drums(at: number, g: Groove, vel: number): void {
    for (const d of Object.keys(g) as Drum[]) {
      const grid = g[d]!;
      const step = 4 / grid.length;
      [...grid].forEach((c, i) => {
        if (c === '.') return;
        const v = Math.min(127, Math.round(vel * (c === 'X' ? 1.15 : d === 'h' && i % 2 ? 0.8 : 1)));
        this.note(DRUM_CH[d], at + i * step, Math.min(step, 0.5), DRUM_NOTE[d], v, 0.6);
      });
    }
  }

  /** Writes a section's bars: tune, second voice, bass, three comping voices and drums. */
  part(p: Part): this {
    const sec = p.section;
    this.patches(p);
    sec.tune.forEach((bar, i) => {
      const at = (this.bar + i) * 4;
      const beats = parse(bar).reduce((a, [, l]) => a + l, 0);
      if (Math.abs(beats - 4) > 1e-6) throw new Error(`Bar ${i + 1} of a section has ${beats} beats: ${bar}`);
      const shift = p.shift ?? 0;
      if (!p.noTune) {
        const up = p.up ?? 0;
        this.line(0, at, bar, p.leadVel ?? 112, shift + up);
        if (p.second === 'double') this.line(1, at, bar, p.secondVel ?? 70, shift + up - 12);
        if (p.second === 'octave') this.line(1, at, bar, p.secondVel ?? 60, shift + up + 12);
      }
      const ch = sec.chords[i];
      const tones = VOICING[ch].map((n) => midi(n)! + shift);
      const root = ROOT[ch] + shift;
      const fifth = root + 7;
      const bv = p.bassVel ?? 105;
      const bassLine: Record<Part['bass'], [number, number][]> = {
        whole: [[root, 4]],
        half: [[root, 2], [fifth, 2]],
        pump: [[root, 1], [fifth, 1], [root, 1], [fifth, 1]],
        walk: [[root, 1], [root + (ch.endsWith('m') ? 3 : 4), 1], [fifth, 1], [root + 12, 1]],
        eighths: [[root, 0.5], [root, 0.5], [root + 12, 0.5], [root, 0.5], [fifth, 0.5], [root, 0.5], [root + 12, 0.5], [fifth, 0.5]],
      };
      let t = at;
      for (const [n, len] of bassLine[p.bass]) {
        this.note(2, t, len, n, bv, 0.85);
        t += len;
      }
      t = at;
      for (const tok of tokens(p.comp)) {
        const m = /^([xr])\s+([whqes])(\.?)$/.exec(tok);
        if (!m) throw new Error(`Bad comp "${tok}"`);
        const len = LEN[m[2]] * (m[3] ? 1.5 : 1);
        if (m[1] === 'x') tones.forEach((n, k) => this.note(3 + k, t, len, n, p.compVel ?? 70, 0.85));
        t += len;
      }
      const groove = GROOVES[p.drums[Math.min(i, p.drums.length - 1)]];
      this.drums(at, groove, p.drumVel ?? 100);
    });
    this.bar += sec.tune.length;
    return this;
  }

  /** Puts each melodic channel's patch in place for a part: the first part's are the file's instruments 0-5; later changes add an instrument and a program change. */
  private patches(p: Part): void {
    const want: [number, Uint8Array][] = [
      [0, p.lead],
      [1, p.secondPatch ?? p.lead],
      [2, p.bassPatch ?? BASS],
      [3, p.compPatch],
      [4, p.compPatch],
      [5, p.compPatch],
    ];
    for (const [c, inst] of want) {
      if (this.current[c] === inst) continue;
      if (this.current[c] === undefined) this.instruments[c] = inst;
      else {
        let k = this.instruments.indexOf(inst, 16);
        if (k < 0) {
          k = Math.max(16, this.instruments.length);
          this.instruments[k] = inst;
        }
        this.events.push({ tick: this.tick(this.bar * 4), data: [0xc0 | c, k] });
      }
      this.current[c] = inst;
    }
  }

  /** The .CMF: ends exactly on the bar line, so PLAYGAME's restart keeps time. */
  cmf(): Uint8Array {
    const end = this.tick(this.bar * 4);
    // Back to the opening patches, as PLAYGAME's restart doesn't reload them.
    for (let c = 0; c < 6; c++) if (this.current[c] !== this.instruments[c]) this.events.push({ tick: end, data: [0xc0 | c, c] });
    this.events.push({ tick: end, data: [0xb0, 0x67, 0x01] });
    for (let c = 0; c < 16; c++) this.instruments[c] ??= INSTRUMENTS.piano;
    return encodeCmf({ instruments: this.instruments, events: this.events, ticksPerBeat: this.tpb });
  }
}

/** Bars of one section, sliced (e.g. the chorus without its pickup). */
const slice = (s: Section, from: number, to = s.tune.length): Section => ({ chords: s.chords.slice(from, to), tune: s.tune.slice(from, to) });
/** A section with its last bar's tune replaced (to change the pickup into the next part). */
const ending = (s: Section, last: string): Section => ({ chords: s.chords, tune: [...s.tune.slice(0, -1), last] });
const vamp = (chords: string[], tune = 'r w'): Section => ({ chords, tune: chords.map(() => tune) });

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
  const w = new Writer(120);
  w.part({ ...BAND, section: vamp(['G', 'G'], 'r w'), drums: ['crash', 'rockFill'] });
  w.part({ ...BAND, section: { chords: ['G'], tune: [CHORUS.tune[7]] }, drums: ['rock'] });
  w.part({ ...BAND, section: CHORUS, drums: ['crash', 'rock', 'rock', 'rock', 'rock', 'rock', 'rock', 'rockFill'] });
  w.part({ ...BAND, section: ending(CHORUS, 'r w'), second: 'octave', secondPatch: CELESTA, secondVel: 50, drums: ['crash', 'rock', 'rock', 'rock', 'rock', 'rock', 'rock', 'rockFill'] });
  return w.cmf();
}

/** Menu: the chorus as a gentle instrumental (flute, celesta, soft bass, kick and a whisper of hi-hat). */
export function menuSong(): Uint8Array {
  const w = new Writer(100);
  const soft = { lead: FLUTE, up: 12, leadVel: 100, second: 'double' as const, secondPatch: CELESTA, secondVel: 45, bass: 'half' as const, bassVel: 85, comp: 'x h, x h', compPatch: INSTRUMENTS.pad, compVel: 50, drumVel: 70 };
  w.part({ ...soft, section: { chords: ['G'], tune: [CHORUS.tune[7]] }, drums: ['soft'] });
  w.part({ ...soft, section: CHORUS, drums: ['soft'] });
  w.part({ ...soft, section: ending(CHORUS, 'r w'), second: 'none', comp: 'x e, x e, x e, x e, x e, x e, x e, x e', compPatch: CELESTA, compVel: 40, drums: ['soft'] });
  return w.cmf();
}

/** Story pages: the soft intro and verse 1 ("I was there that night in Bethlehem"). */
export function storySong(): Uint8Array {
  const w = new Writer(100);
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
  const one = new Writer(120);
  const l1 = { lead: REED, second: 'none' as const, bass: 'pump' as const, comp: 'x q, x q, x q, x q', compPatch: EPIANO, compVel: 58 };
  one.part({ ...l1, section: VERSE1, drums: ['rock', 'rock', 'rock', 'rock', 'rock', 'rock', 'rock', 'rockFill'] });
  one.part({ ...l1, section: VERSE1, second: 'double', secondPatch: VOICE, secondVel: 60, drums: ['crash', 'rock', 'rock', 'rock', 'rock', 'rock', 'rock', 'rockFill'] });

  // Level 2: verse 2, brass over organ and a walking bass with a shuffle.
  const two = new Writer(120);
  const l2 = { lead: INSTRUMENTS.brass, second: 'none' as const, bass: 'walk' as const, comp: 'r e, x e, r e, x e, r e, x e, r e, x e', compPatch: ORGAN, compVel: 60 };
  two.part({ ...l2, section: vamp(['G', 'G']), drums: ['shuffle'] });
  two.part({ ...l2, section: VERSE2, drums: ['shuffle', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'rockFill'] });
  two.part({ ...l2, section: VERSE2, lead: VOICE, second: 'octave', secondPatch: INSTRUMENTS.bell, secondVel: 45, drums: ['crash', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'shuffle', 'rockFill'] });

  // Level 3: the wise men's strut, a plucked oud over toms, brass stabs.
  const three = new Writer(116);
  const l3 = { lead: OUD, leadVel: 118, second: 'double' as const, secondPatch: INSTRUMENTS.pluck, secondVel: 60, bass: 'eighths' as const, bassVel: 95, comp: 'x e, r e, r q, x e, r e, r q', compPatch: INSTRUMENTS.brass, compVel: 60 };
  three.part({ ...l3, section: vamp(['G', 'G']), drums: ['camel'] });
  three.part({ ...l3, section: BRIDGE, drums: ['camel'] });
  three.part({ ...l3, section: BRIDGE, lead: INSTRUMENTS.lead, shift: 0, drums: ['camel', 'camel', 'camel', 'camel', 'camel', 'camel', 'camel', 'rockFill'] });

  // Level 4: the spoken section as a hymn: celesta tune, strings, ride cymbal.
  const four = new Writer(108);
  const l4 = { lead: CELESTA, up: 12, leadVel: 115, second: 'double' as const, secondPatch: FLUTE, secondVel: 45, bass: 'half' as const, bassVel: 90, comp: 'x h, x h', compPatch: INSTRUMENTS.strings, compVel: 55 };
  four.part({ ...l4, section: SPOKEN, second: 'none', drums: ['half'], drumVel: 80 });
  four.part({ ...l4, section: SPOKEN, lead: FLUTE, secondPatch: CELESTA, drums: ['ride'], drumVel: 80 });

  return [one.cmf(), two.cmf(), three.cmf(), four.cmf()];
}

/** Won: the final chorus ("Third goat from the left! I claim my space!") into the outro's cadence ("He sees you... the third goat from the left"). */
export function wonSong(): Uint8Array {
  const w = new Writer(120);
  w.part({ ...BAND, section: FINAL, drums: ['crash', 'gospel', 'gospel', 'gospel', 'gospel', 'rockFill', 'crash', 'gospel', 'gospel', 'gospel', 'half', 'half', 'half'] });
  w.part({ ...BAND, section: slice(OUTRO, 5), comp: 'x w', compPatch: INSTRUMENTS.strings, bass: 'whole', drums: ['half', 'half', 'half', 'crash'] });
  w.part({ ...BAND, section: vamp(['G']), comp: 'x w', compPatch: INSTRUMENTS.strings, bass: 'whole', drums: ['none'] });
  return w.cmf();
}

/** Lost: the hook, slow and in G minor, falling away. */
export function lostSong(): Uint8Array {
  const w = new Writer(84);
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
  const w = new Writer(120);
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
