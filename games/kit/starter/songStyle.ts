// The Starters' music, a sound per group: each group of Starters (web/src/project/starter.ts STARTER_GROUPS) has its own
// band (the lead's instrument, a bass line, a comping rhythm and patch, a drum groove and a tempo range), and each game
// brings its own tune in two eight-bar sections, A and B, played in a form such as AABA, so a loop runs 16 to 32 bars
// before it repeats. It writes the .CMF with the kit's arranger (kit/song.ts Writer: rhythm mode, six melodic voices and
// the chip's drums). Bars are written with "|" between them, as in tune: 'C5 q, E5 q, G5 h | ...' and chords 'C | Am | F G'
// (two chords in a bar share it). Everything here was written for this project.
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { CELESTA, EPIANO, FLUTE, OUD, REED, VOICE, Writer, type Groove, type Part } from '@lewismoten/gamemaker-sandbox-tools/kit/song';

/** The patches a Starter's tune may ask for by name. */
export const LEADS = {
  piano: INSTRUMENTS.piano,
  bell: INSTRUMENTS.bell,
  square: INSTRUMENTS.lead,
  brass: INSTRUMENTS.brass,
  organ: INSTRUMENTS.organ,
  strings: INSTRUMENTS.strings,
  pluck: INSTRUMENTS.pluck,
  flute: FLUTE,
  reed: REED,
  oud: OUD,
  celesta: CELESTA,
  epiano: EPIANO,
  voice: VOICE,
};
type Lead = keyof typeof LEADS;

/** One group's band. */
interface Style {
  /** The lead a tune gets when it names none. */
  lead: Lead;
  /** Channel 1: the tune doubled an octave under or over, on its own patch. */
  second?: { kind: 'double' | 'octave'; patch: Lead; vel: number };
  bass: Part['bass'];
  bassVel?: number;
  /** One bar of comping for A and for B (B may differ). */
  comp: [string, string];
  compPatch: Lead;
  compVel: number;
  /** Drum grooves per bar of a section (the last repeats), for A and B; null for no drums. */
  drums: [Groove[], Groove[]] | null;
  drumVel?: number;
  form: string;
}

// Grooves: per drum (k kick, s snare, t tom, c cymbal, h hi-hat) an 8th-note or 16th-note grid; 'x' hits, 'X' accents.
const G = {
  steps: { k: 'x...x...', h: '..x...x.' },
  stepsEnd: { k: 'x...x...', s: '......xx', h: '..x.....' },
  run: { k: 'x..x..x.', s: '..X...X.', h: 'xxxxxxxx' },
  runCrash: { k: 'x..x..x.', s: '..X...X.', c: 'X.......', h: '.xxxxxxx' },
  runFill: { k: 'x..x....', s: '..X..xXX', t: '......xx', h: 'xxxxx...' },
  drift: { k: 'x.......', h: '....x...' },
  shuffle: { k: 'x..x..x.', s: '..X...X.', h: 'x.xxx.xx' },
  shuffleEnd: { k: 'x..x....', s: '..X..XxX', h: 'x.xxx...' },
  stomp: { k: 'x.x.x.x.', s: '..X...X.', h: 'x.x.x.x.' },
  stompCrash: { k: 'x.x.x.x.', s: '..X...X.', c: 'X.......', t: '.......x' },
  stompFill: { k: 'x.x.x...', s: '..X.....', t: '....xxxx' },
  tick: { k: 'x.......x.......', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx' },
  tickEnd: { k: 'x.......x.......', s: '....x.......xxxx', h: 'xxxxxxxxxxxx....' },
  ride: { k: 'x.....x.', s: '....x...', c: 'x.xx.xx.' },
  rideEnd: { k: 'x.....x.', s: '....x.xx', c: 'x.xx....' },
  calypso: { k: 'x..x..x.', t: '...x..x.', s: '....X...', h: 'x.x.x.x.' },
  calypsoEnd: { k: 'x..x..x.', t: '.....xxx', s: '....X...', h: 'x.x.....' },
  show: { k: 'x...x.x.', s: '..X...X.', h: 'x.x.x.x.' },
  showCrash: { k: 'x...x.x.', s: '..X...X.', c: 'X.......', h: '..x.x.x.' },
  showFill: { k: 'x...x...', s: '..X.XXXX', t: '........' },
};
const bars = (n: number, g: Groove, last: Groove) => [...Array(n - 1).fill(g), last] as Groove[];

/** The groups' bands, by a short name for each group. */
export const STYLES = {
  /** The Basics: a sunny little march. Piano over an oom-pah pluck, a root-and-fifth bass, a light kick. */
  basics: {
    lead: 'piano',
    bass: 'half',
    comp: ['r q, x q, r q, x q', 'x q, x q, r q, x q'],
    compPatch: 'pluck',
    compVel: 58,
    drums: [bars(8, G.steps, G.stepsEnd), bars(8, G.steps, G.stepsEnd)],
    drumVel: 78,
    form: 'AABA',
  },
  /** Moving and Pushing: a running chip tune. A square lead with its octave above, a bass in eighths, a busy beat. */
  moving: {
    lead: 'square',
    second: { kind: 'octave', patch: 'square', vel: 40 },
    bass: 'eighths',
    bassVel: 96,
    comp: ['x e, r e, r e, x e, r e, x e, r q', 'x q, r e, x e, r q, x q'],
    compPatch: 'pluck',
    compVel: 52,
    drums: [
      [G.runCrash, ...bars(7, G.run, G.runFill)],
      [G.runCrash, ...bars(7, G.run, G.runFill)],
    ],
    form: 'AABB',
  },
  /** Worlds That Push Back: floating. A flute with a bell an octave up, a held pad, a whole-note bass, a slow pulse. */
  worlds: {
    lead: 'flute',
    second: { kind: 'octave', patch: 'bell', vel: 34 },
    bass: 'whole',
    comp: ['x w', 'x h, x h'],
    compPatch: 'strings',
    compVel: 46,
    drums: [bars(8, G.drift, G.drift), bars(8, G.drift, G.drift)],
    drumVel: 70,
    form: 'AABA',
  },
  /** Changing Your Hero: swing. A reed or brass lead over a walking bass, electric piano on the off-beats, a shuffle. */
  hero: {
    lead: 'reed',
    bass: 'walk',
    bassVel: 98,
    comp: ['r q, x e., r s, r q, x q', 'r e, x e, r q, r e, x e, r q'],
    compPatch: 'epiano',
    compVel: 56,
    drums: [bars(8, G.shuffle, G.shuffleEnd), bars(8, G.shuffle, G.shuffleEnd)],
    drumVel: 88,
    form: 'AABA',
  },
  /** Foes and Bosses: minor and driving. Organ or brass doubled an octave down, a pumping bass, strings, a stomp. */
  foes: {
    lead: 'organ',
    second: { kind: 'double', patch: 'brass', vel: 52 },
    bass: 'pump',
    bassVel: 104,
    comp: ['x h, x h', 'x q, x q, x q, x q'],
    compPatch: 'strings',
    compVel: 50,
    drums: [
      [G.stompCrash, ...bars(7, G.stomp, G.stompFill)],
      [G.stompCrash, ...bars(7, G.stomp, G.stompFill)],
    ],
    drumVel: 96,
    form: 'AABA',
  },
  /** Telling a Story: a storybook. A music box over soft strings and a gentle bass, no drums. */
  story: {
    lead: 'celesta',
    second: { kind: 'double', patch: 'flute', vel: 40 },
    bass: 'half',
    bassVel: 84,
    comp: ['x h, x h', 'x q, x q, x q, x q'],
    compPatch: 'strings',
    compVel: 40,
    drums: null,
    form: 'ABAB',
  },
  /** Putting It Together: clockwork. Piano with a bell above, a walking bass, a pluck on every off-beat, a ticking hat. */
  together: {
    lead: 'piano',
    second: { kind: 'octave', patch: 'bell', vel: 36 },
    bass: 'walk',
    bassVel: 96,
    comp: ['r e, x e, r e, x e, r e, x e, r e, x e', 'r e, x e, r e, x e, r e, x e, r e, x e'],
    compPatch: 'pluck',
    compVel: 50,
    drums: [bars(8, G.tick, G.tickEnd), bars(8, G.tick, G.tickEnd)],
    drumVel: 74,
    form: 'AABA',
  },
  /** Wiring and Puzzles: puzzle jazz. Electric piano, a walking bass, an organ that holds, a ride cymbal. */
  wiring: {
    lead: 'epiano',
    bass: 'walk',
    bassVel: 94,
    comp: ['x q., x e, r h', 'r q, x h, r q'],
    compPatch: 'organ',
    compVel: 40,
    drums: [bars(8, G.ride, G.rideEnd), bars(8, G.ride, G.rideEnd)],
    drumVel: 80,
    form: 'AABA',
  },
  /** Bigger Worlds: an outdoor calypso. A plucked oud or reed lead, a pumping bass, three-three-two chords, toms. */
  bigger: {
    lead: 'oud',
    bass: 'pump',
    bassVel: 96,
    comp: ['x q., x q., x q', 'r e, x q, x q, x e, x q'],
    compPatch: 'piano',
    compVel: 50,
    drums: [bars(8, G.calypso, G.calypsoEnd), bars(8, G.calypso, G.calypsoEnd)],
    drumVel: 86,
    form: 'AABB',
  },
  /** Drawing with Blocks: a painted sky. A bell and a celesta an octave apart over a held pad, no drums, slow. */
  drawing: {
    lead: 'bell',
    second: { kind: 'octave', patch: 'celesta', vel: 32 },
    bass: 'whole',
    bassVel: 80,
    comp: ['x w', 'x h, x h'],
    compPatch: 'strings',
    compVel: 42,
    drums: null,
    form: 'ABAB',
  },
  /** Showcase Tricks: showtime. Brass doubled below, a pumping bass, string stabs, a crash on every section. */
  showcase: {
    lead: 'brass',
    second: { kind: 'double', patch: 'brass', vel: 50 },
    bass: 'pump',
    bassVel: 100,
    comp: ['x q., x e, r q, x q', 'x q, r e, x e, r e, x e, x q'],
    compPatch: 'strings',
    compVel: 50,
    drums: [
      [G.showCrash, ...bars(7, G.show, G.showFill)],
      [G.showCrash, ...bars(7, G.show, G.showFill)],
    ],
    drumVel: 92,
    form: 'AABA',
  },
} satisfies Record<string, Style>;

/** A game's own tune: its tempo and its two sections. */
export interface StarterTune {
  bpm: number;
  /** The lead's patch, when not the group's. */
  lead?: Lead;
  /** Each section: eight bars of chords and of tune, '|' between bars. */
  A: { chords: string; tune: string };
  B: { chords: string; tune: string };
  /** The order of the sections, when not the group's (e.g. 'AB', 'AABA'). */
  form?: string;
}

const split = (s: string) => s.split('|').map((b) => b.trim());

/** The song as a .CMF: the tune played by its group's band, in its form, ending on the bar line so it loops in time. */
export function starterSong(group: keyof typeof STYLES, t: StarterTune): Uint8Array {
  const st: Style = STYLES[group];
  const w = new Writer(t.bpm);
  const sections = { A: t.A, B: t.B };
  for (const name of t.form ?? st.form) {
    const which = name === 'A' ? 0 : 1;
    const sec = sections[name as 'A' | 'B'];
    const tune = split(sec.tune);
    const chords = split(sec.chords);
    if (tune.length !== chords.length) throw new Error(`Section ${name}: ${tune.length} bars of tune, ${chords.length} of chords`);
    const at = w.bar;
    w.part({
      section: { chords, tune },
      lead: LEADS[t.lead ?? st.lead],
      second: st.second?.kind ?? 'none',
      secondPatch: st.second ? LEADS[st.second.patch] : undefined,
      secondVel: st.second?.vel,
      bass: st.bass,
      bassVel: st.bassVel,
      comp: st.comp[which],
      compPatch: LEADS[st.compPatch],
      compVel: st.compVel,
      drums: ['none'],
    });
    const grooves = st.drums?.[which];
    if (grooves) tune.forEach((_, i) => w.drums((at + i) * 4, grooves[Math.min(i, grooves.length - 1)], st.drumVel ?? 90));
  }
  return w.cmf();
}
