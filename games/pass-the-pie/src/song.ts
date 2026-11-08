// PASS THE PIE's five songs, all written for this game and arranged for the OPL2 with the kit's writer (kit/song.ts:
// rhythm mode, six melodic voices and the chip's drums). Each repeats cleanly from its first bar.
//   streetWalk  "Street Walk": bouncy swing in G major (plucked lead, strings, walking bass, shuffle), Rory's streets
//   payback     "Payback": a fight-poster theme in E minor (brass stabs, driving eighth-note bass, march and rock beats), Mr. Plume's streets
//   chase       "Hot Gravy": fast and tense in D minor at 160 (square lead, brass double, crash and rock), the chase and relay levels
//   gobble      "Big Gobble": comic menace in C minor (a low-brass ostinato that climbs, oom-pah organ), the boss
//   longTable   "Long Table": warm F major (piano, then strings for the triumphant bridge, then bells), the ending
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { EPIANO, ORGAN, REED, Writer, type Part, type Section } from '@lewismoten/gamemaker-sandbox-tools/kit/song';

type Band = Omit<Part, 'section' | 'drums'>;

const bars = (s: string): string[] => s.split('|').map((b) => b.trim());
const sec = (chords: string, tune: string): Section => ({ chords: bars(chords), tune: bars(tune) });

/** Plays the parts in order, each as [section, band, drums]; the drum list is one groove per bar (the last repeats). */
function arrange(bpm: number, parts: [Section, Band, string[]][]): Uint8Array {
  const w = new Writer(bpm);
  for (const [section, band, drums] of parts) w.part({ ...band, section, drums });
  return w.cmf();
}

const fill = (g: string): string[] => [g, g, g, g, g, g, g, 'rockFill'];

/** Rory's streets: A A B A, 32 bars at 112 (69 s). */
export const streetWalk = (): Uint8Array => {
  const band: Band = {
    lead: INSTRUMENTS.pluck,
    leadVel: 112,
    second: 'octave',
    secondPatch: INSTRUMENTS.bell,
    secondVel: 38,
    bass: 'walk',
    bassVel: 100,
    comp: 'r e, x e, r q, r e, x e, r q',
    compPatch: INSTRUMENTS.strings,
    compVel: 52,
  };
  const A = sec(
    'G | Em | C | D | G | Em | Am D | G',
    'D5 e, G5 e, B5 q, A5 e, G5 e, D5 q | E5 e, G5 e, B5 q, E6 q, D6 q | C6 q., B5 e, G5 q, E5 q | D5 e, F#5 e, A5 e, C6 e, B5 h | G5 q, B5 e, D6 e, G6 q, D6 q | E6 e, D6 e, B5 e, G5 e, E5 h | A5 q, C6 q, E6 e, D6 e, C6 e, A5 e | G5 h, r h',
  );
  const B = sec(
    'C | G | Am | D | Em | Bm | C D | G',
    'E6 q., D6 e, C6 q, G5 q | B5 e, D6 e, G6 h, r q | A5 q, C6 q, E6 q, A6 q | F#6 e, E6 e, D6 q, A5 h | G5 e, B5 e, E6 q, D6 e, B5 e, G5 q | F#5 q, B5 q, D6 q, F#6 q | E6 q, C6 q, D6 e, C6 e, B5 e, A5 e | G5 h, D5 q, G4 q',
  );
  const swing = fill('shuffle');
  const bridge = ['shuffle', 'shuffle', 'shuffle', 'shuffle', 'rock4', 'rock4', 'rock4', 'rockFill'];
  return arrange(112, [
    [A, band, swing],
    [A, band, swing],
    [B, band, bridge],
    [A, band, swing],
  ]);
};

/** Mr. Plume's streets: A A B A, 32 bars at 140 (55 s). */
export const payback = (): Uint8Array => {
  const band: Band = {
    lead: INSTRUMENTS.brass,
    leadVel: 118,
    second: 'octave',
    secondPatch: INSTRUMENTS.lead,
    secondVel: 48,
    bass: 'eighths',
    bassVel: 112,
    comp: 'x e, r e, x e, x e, r e, x e, r e, x e',
    compPatch: ORGAN,
    compVel: 50,
  };
  const A = sec(
    'Em | Em | C | D | Em | Em | C B | Em',
    'E5 e, r e, E5 e, r e, G5 e, B5 e, r q | E6 q., D6 e, B5 q, G5 q | C6 e, r e, C6 e, r e, E6 e, G6 e, r q | F#6 q, D6 q, A5 h | E5 e, E5 e, G5 e, B5 e, E6 q, G6 q | F#6 e, E6 e, D6 e, B5 e, G5 h | C6 q, E6 q, D#6 q, F#6 q | E6 q, r e, B5 e, E6 h',
  );
  const B = sec(
    'Am | Em | C | B | Am | G | C B | Em',
    'A5 e, C6 e, E6 q, A6 q, E6 q | G6 q., E6 e, B5 h | E6 e, G6 e, C7 q, B6 q, G6 q | F#6 q, D#6 q, B5 q, F#5 q | C6 e, A5 e, C6 e, E6 e, A6 h | G6 e, D6 e, B5 e, D6 e, G6 h | E6 q, G6 q, F#6 e, D#6 e, B5 q | E6 h, r q, B5 q',
  );
  const march = ['crash', 'march', 'march', 'march', 'march', 'march', 'march', 'rockFill'];
  const rock = ['crash', 'rock', 'rock', 'rock', 'crash', 'rock', 'rock', 'rockFill'];
  return arrange(140, [
    [A, band, march],
    [A, band, march],
    [B, band, rock],
    [A, band, march],
  ]);
};

/** The chase and relay levels: A A B A, 32 bars at 160 (48 s). */
export const chase = (): Uint8Array => {
  const band: Band = {
    lead: INSTRUMENTS.lead,
    leadVel: 110,
    second: 'double',
    secondPatch: INSTRUMENTS.brass,
    secondVel: 58,
    bass: 'eighths',
    bassVel: 108,
    comp: 'x e, r e, x e, r e, x e, r e, x e, x e',
    compPatch: INSTRUMENTS.pluck,
    compVel: 58,
  };
  const A = sec(
    'Dm | Dm | A# | C | Dm | Dm | A# A | Dm',
    'D5 e, D5 e, F5 e, A5 e, D6 e, C6 e, A5 e, F5 e | D5 e, F5 e, A5 e, D6 e, F6 q, E6 q | D6 e, D6 e, A#5 e, D6 e, F6 e, D6 e, A#5 q | C6 e, E6 e, G6 e, E6 e, C6 e, G5 e, E5 q | A5 e, A5 e, D6 e, F6 e, A6 e, F6 e, D6 e, A5 e | G5 e, A#5 e, D6 e, A#5 e, G5 q, D5 q | A#5 e, D6 e, F6 e, D6 e, E5 e, A5 e, C#6 e, E6 e | D6 q, A5 q, D6 h',
  );
  const B = sec(
    'Gm | Dm | Gm | A | A# | F | Gm A | Dm',
    'G5 e, A#5 e, D6 e, G6 e, F6 e, D6 e, A#5 e, G5 e | F5 e, A5 e, D6 e, F6 e, A6 q, F6 q | G6 e, F6 e, D6 e, A#5 e, G5 e, A#5 e, D6 q | E6 e, C#6 e, A5 e, E5 e, A5 e, C#6 e, E6 q | D6 e, F6 e, A#6 e, F6 e, D6 q, A#5 q | C6 e, F6 e, A6 e, F6 e, C6 h | D6 q, A#5 q, C#6 q, E6 q | D6 e, D6 e, A5 e, D6 e, F6 h',
  );
  const rock = ['crash', 'rock', 'rock', 'rock', 'rock', 'rock', 'rock', 'rockFill'];
  return arrange(160, [
    [A, band, rock],
    [A, band, rock],
    [B, band, rock],
    [A, band, rock],
  ]);
};

/** The boss: A B A B (the bridge builds each time), 32 bars at 104 (74 s). */
export const gobble = (): Uint8Array => {
  const tuba: Band = {
    lead: INSTRUMENTS.brass,
    leadVel: 118,
    second: 'octave',
    secondPatch: REED,
    secondVel: 45,
    bass: 'half',
    bassVel: 110,
    comp: 'x q, r q, x q, r q',
    compPatch: ORGAN,
    compVel: 55,
  };
  const A = sec(
    'Cm | Cm | G# | G | Cm | Fm | G7 | Cm',
    'C3 q, C3 e, C3 e, D#3 q, C3 q | C3 q, G3 q, F#3 q, G3 q | G#3 q, G#3 e, G#3 e, C4 q, G#3 q | G3 q, G3 e, G3 e, B3 q, D4 q | C3 q, C3 e, C3 e, D#3 q, G3 q | F3 q, F3 e, F3 e, G#3 q, C4 q | D4 e, C4 e, B3 e, G3 e, D4 e, C4 e, B3 e, G3 e | C3 h, r h',
  );
  const B = sec(
    'Cm | G# | Fm | G | Cm | G# | Fm G | Cm',
    'C4 e, D#4 e, G4 e, D#4 e, C4 e, D#4 e, G4 q | G#3 e, C4 e, D#4 e, C4 e, G#3 e, C4 e, D#4 q | F4 e, G#4 e, C5 e, G#4 e, F4 e, G#4 e, C5 q | G4 e, B4 e, D5 e, B4 e, G4 q, D5 q | C5 q, D#5 q, G5 q, D#5 q | G#4 q, C5 q, D#5 q, G#5 q | F5 e, F5 e, G#5 e, F5 e, G5 e, G5 e, B5 e, D6 e | C5 q, C4 q, C3 h',
  );
  const march = ['crash', 'march', 'march', 'march', 'march', 'march', 'march', 'rockFill'];
  const drive = ['crash', 'rock', 'rock', 'rock', 'crash', 'rock', 'rock', 'rockFill'];
  return arrange(104, [
    [A, tuba, march],
    [B, { ...tuba, bass: 'eighths', leadVel: 122 }, drive],
    [A, tuba, march],
    [B, { ...tuba, bass: 'eighths', leadVel: 126 }, drive],
  ]);
};

/** The ending: A (piano), B (strings, triumphant), A (bells, cozy); 24 bars at 84 (69 s). */
export const longTable = (): Uint8Array => {
  const warm: Band = {
    lead: INSTRUMENTS.piano,
    leadVel: 105,
    second: 'octave',
    secondPatch: INSTRUMENTS.bell,
    secondVel: 40,
    bass: 'half',
    bassVel: 90,
    comp: 'x h, x h',
    compPatch: EPIANO,
    compVel: 48,
  };
  const A = sec(
    'F | Dm | A# | C | F | Am | A# C | F',
    'A5 q, C6 q, F6 q., E6 e | D6 q, A5 q, F5 h | D6 q., C6 e, A#5 q, D6 q | C6 h, G5 q, E5 q | A5 q, C6 q, F6 q, A6 q | G6 q., F6 e, E6 q, C6 q | D6 q, F6 q, E6 q, G5 q | F6 h., r q',
  );
  const B = sec(
    'A# | C | Dm | Am | A# | C | Dm C | F',
    'D6 q, F6 q, A#6 h | A6 q, G6 q, E6 h | F6 q., A6 e, D7 h | C7 q, A6 q, E6 h | A#6 q, A6 q, G6 q, F6 q | G6 e, E6 e, C6 q, E6 q, G6 q | F6 q, D6 q, E6 e, D6 e, C6 q | F6 h, C6 q, F5 q',
  );
  const soft = ['soft', 'soft', 'soft', 'soft', 'half', 'half', 'half', 'half'];
  const lift = ['crash', 'half', 'half', 'half', 'half', 'half', 'half', 'rockFill'];
  const triumph: Band = {
    ...warm,
    lead: INSTRUMENTS.strings,
    leadVel: 112,
    secondPatch: INSTRUMENTS.brass,
    secondVel: 45,
    bass: 'pump',
    comp: 'x q, x q, x q, x q',
    compPatch: INSTRUMENTS.strings,
  };
  const cozy: Band = { ...warm, lead: INSTRUMENTS.bell, leadVel: 100, secondPatch: INSTRUMENTS.pluck, secondVel: 35, bassVel: 75, compVel: 40 };
  return arrange(84, [
    [A, warm, soft],
    [B, triumph, lift],
    [A, cozy, ['none']],
  ]);
};
