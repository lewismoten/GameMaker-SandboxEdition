// The parade's sounds (.SND) and its three songs (.CMF), all written for this game on the kit's arranger (kit/song.ts):
//   parade.cmf   "Front of the Parade": a full march in F, 120 beats a minute. Snare-roll intro, two strains with horn
//                after-beats over an oom-pah tuba, a lyrical trio in B-flat, a stomping minor "dogfight" break, and the
//                trio again with cymbals on every bar (the grandioso).
//   marge.cmf    "Banner Tow Boogie": Marge's level, a shuffling boogie in G on reed and piano, walking bass, 24 bars.
//   drumoff.cmf  "Drum-Off": Elm Street, in D minor at exactly the beat meter's tempo (one beat every twelve ticks, 91 a
//                minute). The snare cracks on beat two and the cymbal on beat four, the beats the two kinds of confetti
//                cannon fire on, so the song counts the level for you.
// The sounds are the shared beeps with a rising chime for a card or letter handed over (Game-Maker plays sound 8 when a
// counter goes down).
import type { SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { SPEAKER } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { FLUTE, REED, Writer, vamp, type Groove, type Part } from '@lewismoten/gamemaker-sandbox-tools/kit/song';
import { SND } from '../../kit/starter/ids';
import { buildSounds } from '../../kit/starter/sounds';

export function paradeSounds(): SoundSet {
  const set = buildSounds();
  set.freqs[SND.use] = SPEAKER.arpeggio([1319, 1568, 2093, 2637]); // a chime for each hand-over
  return set;
}

const bars = (s: string): string[] => s.split('|').map((b) => b.trim());

/** Plays one section with its own drum grooves, bar by bar (the last groove repeats). */
function play(w: Writer, part: Omit<Part, 'drums' | 'section'> & { chords: string; tune: string; grooves: Groove[]; drumVel: number }): void {
  const chords = bars(part.chords);
  const tune = bars(part.tune);
  if (chords.length !== tune.length) throw new Error(`${chords.length} bars of chords, ${tune.length} of tune`);
  const at = w.bar;
  w.part({ ...part, section: { chords, tune }, drums: ['none'] });
  tune.forEach((_, i) => w.drums((at + i) * 4, part.grooves[Math.min(i, part.grooves.length - 1)], part.drumVel));
}

// ---- the march

const MARCH = {
  step: { k: 'x...x...', s: '..x...x.', h: 'x.x.x.x.' },
  cadence: { k: 'x...x...', s: 'x.xxx.xx', h: '....x...' },
  roll: { s: 'xxxxxxxxxxxxxxxx', k: 'x.......x.......' },
  hit: { k: 'x...x...', s: '..X...X.', c: 'X.......' },
  fill: { k: 'x...x...', s: '..X.xXXX', t: '......xx' },
  stomp: { k: 'x.x.x.x.', s: '..X...X.', t: 'X.......' },
  grand: { k: 'x...x...', s: '..X...X.', c: 'X...X...' },
} satisfies Record<string, Groove>;

/** Horn after-beats: the chord on every "and". */
const AFTER = 'r e, x e, r e, x e, r e, x e, r e, x e';

export function song(): Uint8Array {
  const w = new Writer(120);
  const brass = {
    lead: INSTRUMENTS.brass,
    second: 'octave' as const,
    secondPatch: FLUTE,
    secondVel: 46,
    bassPatch: INSTRUMENTS.bass,
    bass: 'pump' as const,
    bassVel: 104,
  };
  // the intro: a snare roll under held chords, then a crash
  w.part({
    section: vamp(['F', 'F', 'C7', 'C7'], 'r w'),
    lead: INSTRUMENTS.brass,
    bass: 'whole',
    bassVel: 96,
    comp: 'x w',
    compPatch: INSTRUMENTS.brass,
    compVel: 56,
    drums: ['none'],
  });
  [MARCH.roll, MARCH.roll, MARCH.roll, MARCH.fill].forEach((g, i) => w.drums((w.bar - 4 + i) * 4, g, 92));
  const A = {
    chords: 'F | F | C7 | F | Bb | F | G7 C7 | F',
    tune: 'C5 q, F5 q, A5 q, C6 q | A5 h, F5 q, r q | G5 q, Bb5 e, A5 e, G5 q, E5 q | F5 h., C5 q | D5 q, F5 q, Bb5 q, D6 q | C6 q, A5 q, F5 h | G5 q, A5 e, Bb5 e, A5 q, G5 q | F5 h, r h',
  };
  const B = {
    chords: 'C7 | F | C7 | F | Dm | A7 | Bb C7 | F',
    tune: 'E5 e, F5 e, G5 e, A5 e, Bb5 q, G5 q | A5 q, C6 q, A5 h | E5 e, F5 e, G5 e, A5 e, Bb5 q, C6 q | A5 h., r q | D6 q, C6 e, Bb5 e, A5 q, F5 q | E5 q, C#5 q, E5 q, A5 q | Bb5 q, D6 q, C6 q, E5 q | F5 h, F5 q, r q',
  };
  const trio = {
    chords: 'Bb | Bb | F7 | Bb | Eb | Bb | C7 F7 | Bb',
    tune: 'F5 h, D5 q, F5 q | Bb5 h., r q | C6 q, A5 q, F5 q, A5 q | Bb5 h, D5 h | Eb5 q, G5 q, Bb5 q, Eb6 q | D6 h, Bb5 h | C6 q, Bb5 q, A5 q, C6 q | Bb5 h, r h',
  };
  const dogfight = {
    chords: 'Gm | D7 | Gm | D7 | Gm | Cm | D7 | D7',
    tune: 'G4 e, G4 e, r q, Bb4 e, Bb4 e, r q | A4 e, A4 e, r q, F#4 e, F#4 e, r q | G4 e, G4 e, r q, D5 e, D5 e, r q | C5 e, C5 e, r q, A4 e, A4 e, r q | G5 q, F#5 q, G5 q, A5 q | Bb5 q, A5 q, G5 q, Eb5 q | D5 q, C5 q, Bb4 q, A4 q | D5 h, r h',
  };
  const steps = [MARCH.hit, MARCH.step, MARCH.step, MARCH.cadence, MARCH.step, MARCH.step, MARCH.step, MARCH.fill];
  for (let k = 0; k < 2; k++) play(w, { ...A, ...brass, comp: AFTER, compPatch: INSTRUMENTS.brass, compVel: 50, grooves: steps, drumVel: 94 });
  for (let k = 0; k < 2; k++) play(w, { ...B, ...brass, comp: AFTER, compPatch: INSTRUMENTS.brass, compVel: 54, grooves: steps, drumVel: 98 });
  play(w, {
    ...trio,
    lead: REED,
    second: 'double',
    secondPatch: INSTRUMENTS.brass,
    secondVel: 40,
    bass: 'half',
    bassPatch: INSTRUMENTS.bass,
    bassVel: 90,
    comp: 'x h, x h',
    compPatch: INSTRUMENTS.strings,
    compVel: 40,
    grooves: [MARCH.step],
    drumVel: 70,
  });
  play(w, {
    ...dogfight,
    lead: INSTRUMENTS.brass,
    second: 'double',
    secondPatch: INSTRUMENTS.brass,
    secondVel: 60,
    bass: 'eighths',
    bassPatch: INSTRUMENTS.bass,
    bassVel: 108,
    comp: 'x q, r q, x q, r q',
    compPatch: INSTRUMENTS.brass,
    compVel: 60,
    grooves: [MARCH.stomp, MARCH.stomp, MARCH.stomp, MARCH.fill, MARCH.stomp, MARCH.stomp, MARCH.roll, MARCH.fill],
    drumVel: 104,
  });
  play(w, { ...trio, ...brass, secondVel: 56, comp: AFTER, compPatch: INSTRUMENTS.brass, compVel: 58, grooves: [MARCH.grand], drumVel: 104 });
  return w.cmf();
}

// ---- Marge's boogie

export function margeSong(): Uint8Array {
  const w = new Writer(132);
  const shuffle: Groove = { k: 'x..x..x.', s: '..X...X.', h: 'x.xxx.xx' };
  const turn: Groove = { k: 'x..x....', s: '..X..XxX', h: 'x.xxx...' };
  const riff = 'G4 e, Bb4 e, B4 e, D5 e, E5 e, D5 e, B4 q';
  const riffC = 'C5 e, Eb5 e, E5 e, G5 e, A5 e, G5 e, E5 q';
  const riffD = 'D5 e, F5 e, F#5 e, A5 e, B5 e, A5 e, F#5 q';
  const chords = 'G | G | G | G | C | C | G | G | D7 | C | G | D7';
  const grooves = [...new Array(11).fill(shuffle), turn];
  const band = {
    lead: REED,
    second: 'double' as const,
    secondPatch: INSTRUMENTS.piano,
    secondVel: 44,
    bass: 'walk' as const,
    bassPatch: INSTRUMENTS.bass,
    bassVel: 100,
    comp: 'x q., x e, r q, x q',
    compPatch: INSTRUMENTS.piano,
    compVel: 52,
  };
  play(w, {
    ...band,
    chords,
    tune: [riff, riff, riff, 'G5 h, F5 q, D5 q', riffC, riffC, riff, 'B4 h, r h', riffD, riffC, 'G5 q, D5 q, B4 q, G4 q', 'D5 q, C5 e, B4 e, A4 q, F#4 q'].join(
      ' | ',
    ),
    grooves,
    drumVel: 90,
  });
  play(w, {
    ...band,
    chords,
    tune: 'D6 q, B5 e, G5 e, D6 q, B5 q | D6 e, D6 e, B5 e, G5 e, A5 h | D6 q, B5 e, G5 e, D6 q, B5 q | G5 w | E6 q, C6 e, A5 e, E6 q, C6 q | Eb6 e, E6 e, C6 e, A5 e, G5 h | D6 q, B5 e, G5 e, D6 q, B5 q | G5 h, r h | F#5 e, A5 e, C6 e, D6 e, F#6 q, D6 q | E6 q, C6 q, A5 q, G5 q | G5 q, B5 q, D6 q, G6 q | F#6 q, E6 e, D6 e, C6 q, A5 q',
    grooves,
    drumVel: 96,
  });
  return w.cmf();
}

// ---- the drum-off

export function drumOffSong(): Uint8Array {
  // 18.2 ticks a second and a beat every 12 ticks: 91 beats a minute
  const w = new Writer(91);
  const count: Groove = { k: 'x...x...', s: '..X.....', c: '......X.', h: 'xxxxxxxx' };
  const countFill: Groove = { k: 'x...x...', s: '..X..xxx', c: '......X.', t: '.....x..' };
  const band = {
    lead: INSTRUMENTS.brass,
    second: 'double' as const,
    secondPatch: INSTRUMENTS.brass,
    secondVel: 58,
    bass: 'eighths' as const,
    bassPatch: INSTRUMENTS.bass,
    bassVel: 108,
    comp: 'x e, r e, r q, x e, r e, r q',
    compPatch: INSTRUMENTS.strings,
    compVel: 46,
  };
  const A = {
    chords: 'Dm | Dm | Bb | A7 | Dm | Dm | Gm A7 | Dm',
    tune: 'D5 q, r e, D5 e, F5 q, A5 q | G5 e, F5 e, E5 q, D5 h | Bb4 q, r e, Bb4 e, D5 q, F5 q | E5 h, C#5 h | D5 q, r e, D5 e, F5 q, A5 q | D6 q, C6 e, A5 e, F5 h | G5 q, Bb5 q, A5 q, C#5 q | D5 h, r h',
  };
  const B = {
    chords: 'Dm | Dm | Dm | Dm | Bb | C | A7 | A7',
    tune: 'r w | r w | r w | r w | Bb5 q, r q, Bb5 q, r q | C6 q, r q, C6 q, r q | A5 e, A5 e, A5 e, A5 e, C#6 q, E6 q | A6 h, r h',
  };
  const grooves = [count, count, count, countFill];
  for (const sec of [A, A, B, A]) play(w, { ...band, ...sec, grooves, drumVel: 100 });
  return w.cmf();
}
