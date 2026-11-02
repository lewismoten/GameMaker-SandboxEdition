// The real tune-up's songs for levels 5-9, each its own tune, key, groove and form, scored for
// one group of the music editor's presets (web/src/audio/oplPresets.ts):
// - The Fan Band (organ group: kazoos, harmonica, accordion): a charleston in B-flat that opens
//   on the main theme as Doc Leo wakes, then a hotter trio in E-flat for the second verse.
// - Brake Dance (the drum kit, with a slap bass): an electro breakbeat in E minor with a break.
// - Hubcaps and Balls (percussion: timpani, woodblock, a snare roll, over mallets): a sly
//   habanera in D minor, a sneaky swing in G minor, then a galop in B-flat for the fast round.
// - Pump Up the Volume (the basses): a house groove in G minor, verse and chorus.
// - Muffled (the voices): a hummed lullaby in F, 6/8, hushed.
import { bars, comp, grid, rep, score, shift } from './score';
import { MOTIF } from './song';
import { FAN_BEAT } from '../levels/fan';
import { BRAKE_BEAT } from '../levels/brake';

// ---- the Fan Band

const FAN_A = ['Bb', 'G7', 'Cm7', 'F7', 'Bb', 'G7', 'Cm7 F7', 'Bb'];
const FAN_B = ['D7', 'D7', 'G7', 'G7', 'C7', 'C7', 'F7', 'F7'];
const COOL_A = bars(
  'F5q. D5e rq Bb4q',
  'B4q D5q F5q. G5e',
  'Eb5q. C5e rq G4q',
  'A4q C5q Eb5h',
  'F5q. D5e rq F5q',
  'G5q F5q D5q B4q',
  'C5q Eb5q A4q C5q',
  'Bb4h. rq',
);
const COOL_B = bars(
  'F#5q. A5e rq F#5q',
  'D5q E5q F#5q A5q',
  'G5q. B5e rq G5q',
  'F5q D5q B4q G4q',
  'E5q. G5e rq E5q',
  'Bb5q G5e E5e C5q rq',
  'F5q A5q C6q A5q',
  'Eb5h C5h',
);
const HOT_A = ['Eb', 'Eb', 'Bb7', 'Bb7', 'Bb7', 'Bb7', 'Eb', 'Eb'];
const HOT_B = ['C7', 'C7', 'Fm', 'Fm', 'F7', 'F7', 'Bb7', 'Bb7'];
const HOT_C = ['Eb', 'Eb7', 'Ab', 'Abm', 'Eb', 'C7', 'F7 Bb7', 'Eb'];
const TRIO_A = bars(
  'Bb4e Eb5e G5e Bb5q G5e Eb5q',
  'C6q Bb5q G5h',
  'Ab5e G5e F5e D5q F5e Ab5q',
  'Bb5q Ab5q F5h',
  'D5e F5e Ab5e Bb5q Ab5e F5q',
  'D5q C5q Bb4h',
  'Eb5e G5e Bb5e Eb6q Bb5e G5q',
  'Eb5h. rq',
);
const TRIO_B = bars(
  'E5e G5e Bb5e C6q Bb5e G5q',
  'E5q C5q G4h',
  'Ab4e C5e F5e Ab5q F5e C5q',
  'Ab5h F5h',
  'A4e C5e Eb5e F5q Eb5e C5q',
  'A4q C5q F5h',
  'D5e F5e Ab5e Bb5q Ab5e F5q',
  'D5h Bb4h',
);
const TRIO_C = bars(
  'Bb4e Eb5e G5e Bb5q G5e Eb5q',
  'Db6q Bb5q G5h',
  'C6e Ab5e Eb5e C5q Eb5e Ab5q',
  'B5q Ab5q Eb5h',
  'G5e Bb5e Eb6e G6q Eb6e Bb5q',
  'G5q E5q C5h',
  'F5e A5e C6e A5e Ab5e F5e D5e Bb4e',
  'Eb5h. rq',
);

/**
 * The Fan Band, verse `verse`: the cool verse opens on the main theme's first two bars (a
 * harmonica waking up, in B-flat), then a charleston on the kazoo, AABA; the hot verse is the
 * trio, a fourth higher, ABAC, the kazoo doubled, the bass walking and the snare busier.
 */
export function fanSong(verse: number): Uint8Array {
  if (verse === 0) {
    const chords = ['Bb', 'Eb Bb', ...FAN_A, ...FAN_A, ...FAN_B, ...FAN_A];
    return score(FAN_BEAT, 4, [
      { ch: 0, patch: 'kazoo', notes: bars('rw', 'rw', COOL_A, COOL_A, COOL_B, COOL_A), vel: 90 },
      { ch: 1, patch: 'harmonica', notes: bars(shift(MOTIF, -2), comp(chords.slice(2), 4, 'rw | rh. 5e 3e | rw | rh 8q 5q')), vel: 60 },
      { ch: 2, patch: 'tonewheel', notes: comp(chords, 4, 'Rq rq 5q rq', { bass: 'F2' }), vel: 85 },
      { ch: 3, patch: 'accordion', notes: comp(chords, 4, 'rq Xq rq Xq', { lo: 'F3' }), vel: 50 },
    ]);
  }
  const chords = [...HOT_A, ...HOT_B, ...HOT_A, ...HOT_C];
  return score(
    FAN_BEAT,
    4,
    [
      { ch: 0, patch: 'kazoo', notes: bars(TRIO_A, TRIO_B, TRIO_A, TRIO_C), vel: 95 },
      { ch: 1, patch: 'kazoo', notes: comp(chords, 4, 'rq 3q rq 5q | rq 5q rq 3e 5e', { bass: 'Bb4' }), vel: 55 },
      { ch: 2, patch: 'tonewheel', notes: comp(chords, 4, 'Rq 3q 5q 3q', { bass: 'F2' }), vel: 90 },
      { ch: 3, patch: 'accordion', notes: comp(chords, 4, 'rq Xe Xe rq Xq', { lo: 'G3' }), vel: 50 },
    ],
    [
      { patch: 'kick-punchy', grid: grid(32, 'x...x...'), vel: 70 },
      { patch: 'snare-tight', grid: grid(32, '..x.xox.'), vel: 60 },
    ],
  );
}

// ---- Brake Dance

const BRAKE_A = ['Em', 'Em', 'C', 'D'];
const BRAKE_B = ['Am', 'Am', 'C', 'B7'];
const HOOK = bars(
  'E5e rs E5s G5e E5e D5e E5e rq',
  'rq B4e D5e E5e G5e A5e B5e',
  'C6q. B5e G5e E5e rq',
  'D5e F#5e A5e D6e rh',
  'E5e rs E5s G5e E5e D5e E5e rq',
  'rq B4e D5e E5e G5e A5e B5e',
  'C6e B5e G5e E5e C5e E5e G5e C6e',
  'A5h F#5h',
);
const CALL = bars('A5e rs A5s C6e A5e rh', 'rq G5e A5e C6e D6e E6q', 'E6e D6e C6e G5e E6e D6e C6e G5e', 'F#5h D#5h');

/** Brake Dance: an electro breakbeat on the drum kit (a clap for the snare), a slap bass, a saw lead's hook, brass stabs, and a four-bar break. */
export function brakeSong(): Uint8Array {
  const chords = [...BRAKE_A, ...BRAKE_A, ...BRAKE_A, ...BRAKE_B, ...BRAKE_B, 'Em', 'Em', 'Em', 'Em', ...BRAKE_A, ...BRAKE_A];
  const kick = 'x.....x...x.....';
  const clap = '....X.......X...';
  const hat = 'x.x.x.x.x.x.x.xx';
  return score(
    BRAKE_BEAT,
    4,
    [
      { ch: 0, patch: 'lead-saw', notes: bars(rep(4, 'rw'), HOOK, CALL, bars(CALL.split('|').slice(0, 3).join('|'), 'B5h. rq'), rep(4, 'rw'), HOOK), vel: 75 },
      {
        ch: 2,
        patch: 'slap-bass',
        notes: bars(comp(chords.slice(0, 20), 4, 'Re Re re 8e re Re 5e re'), rep(4, 'rw'), comp(chords.slice(24), 4, 'Re Re re 8e re Re 5e re')),
        vel: 95,
      },
      {
        ch: 3,
        patch: 'synth-brass',
        notes: bars(rep(4, 'rw'), comp(chords.slice(4, 20), 4, 'rq. Xe rq Xs Xs re'), rep(4, 'rw'), comp(chords.slice(24), 4, 'rq. Xe rq Xs Xs re')),
        vel: 55,
      },
    ],
    [
      {
        patch: 'kick-punchy',
        grid: [grid(20, kick), 'x.x...x.x...x.xx', 'x.....x.x.x.....', 'x.x...x.x...x.xx', 'x...x...x.x.x.x.', grid(8, kick)].join('|'),
        vel: 90,
      },
      {
        patch: 'clap',
        grid: [grid(20, clap), '....X..x....X...', '....X.......X.xx', '....X..x....X...', '..X...X...X.XXXX', grid(8, clap)].join('|'),
        vel: 80,
      },
      { patch: 'hat-closed', grid: [grid(20, hat), grid(4, '................'), grid(8, hat)].join('|'), vel: 45 },
    ],
  );
}

// ---- Hubcaps and Balls

const CUPS_A = ['Dm', 'A7', 'A7', 'Dm', 'Dm', 'A7', 'Gm A7', 'Dm'];
const CUPS_B = ['F', 'C7', 'C7', 'F', 'Gm', 'Dm', 'E7', 'A7'];
const HABANERA_A = bars(
  'A5q. Bb5e A5q F5q',
  'E5q. F5e E5q C#5q',
  'G5e F5e E5e D5e C#5e D5e E5q',
  'D5h. rq',
  'A5q. Bb5e A5q D6q',
  'C#6q. D6e E6q A5q',
  'Bb5e A5e G5e F5e E5e F5e G5e E5e',
  'D5h. rq',
);
const HABANERA_B = bars(
  'C6q. A5e F5q A5q',
  'Bb5q. G5e E5q C5q',
  'D5e E5e G5e Bb5e A5e G5e E5q',
  'F5h. rq',
  'D6q. Bb5e G5q D5q',
  'F5q. A5e D6h',
  'G#5e B5e D6e E6e D6e B5e G#5q',
  'A5h C#6h',
);
const CREEP = ['Gm', 'Gm', 'Cm', 'D7', 'Gm', 'Eb7', 'D7', 'Gm'];
const CREEP_B = ['Eb', 'Eb', 'Cm', 'Cm', 'Am7b5', 'D7', 'Gm', 'D7'];
const SNEAK_A = bars(
  'rq D5u Eb5t E5u F5t G5q',
  'Bb5h. G5q',
  'rq Eb5u D5t C5u Bb4t G4q',
  'A4h F#4h',
  'rq D5u Eb5t E5u F5t G5q',
  'Db6h Bb5u G5t Eb5q',
  'D5u F#5t A5u C6t F#5u A5t D5q',
  'G4h. rq',
);
const SNEAK_B = bars(
  'G5u Bb5t Eb6h.',
  'D6u C6t Bb5u G5t Eb5h',
  'rq Eb5u G5t C6u Eb6t D6q',
  'C6h. G5q',
  'rq C6u A5t Eb5u C5t A4q',
  'F#5h. A5q',
  'Bb5u A5t G5u F#5t G5h',
  'D5h rh',
);
const GALOP = ['Bb', 'F7', 'F7', 'Bb', 'Bb', 'F7', 'F7', 'Bb'];
const GALOP_B = ['Eb', 'Bb', 'F7', 'Bb', 'Eb', 'Bb', 'C7', 'F7'];
const GALOP_A1 = bars(
  'F#5e A5e F#5e A5e D6q A5q',
  'G5e A5e G5e A5e E6q C#6q',
  'A5e G5e F#5e E5e C#5e E5e A5q',
  'D6q A5q F#5q D5q',
  'F#5e A5e F#5e A5e D6q A5q',
  'G5e A5e G5e A5e C#6q E6q',
  'G6e E6e C#6e A5e G5e E5e C#5q',
  'D5q F#5q D6q rq',
);
const GALOP_B1 = bars(
  'B5q. D6e B5q G5q',
  'A5q. D6e A5q F#5q',
  'G5e F#5e E5e G5e C#6q A5q',
  'F#5h D5h',
  'B5q. D6e G6q B5q',
  'A5q. F#5e D6q A5q',
  'G#5e B5e D6e E6e G#6q E6q',
  'A5h. rq',
);
/** A snare roll into the reveal: quiet sixteenths, the last one hit. */
const ROLL = 'oooooooooooooooX';

/**
 * Hubcaps and Balls, round `round` (0-2): the magician's three tunes, each over timpani and a
 * woodblock with a snare roll for every reveal. A sly habanera on the xylophone, a sneaky swing
 * on the marimba, and a galop on the glockenspiel for the fast round.
 */
export function cupsSong(round: number): Uint8Array {
  if (round === 0) {
    const chords = [...CUPS_A, ...CUPS_A, ...CUPS_B, ...CUPS_A];
    return score(
      11,
      4,
      [
        { ch: 0, patch: 'xylophone', notes: bars(HABANERA_A, HABANERA_A, HABANERA_B, HABANERA_A), vel: 115 },
        { ch: 1, patch: 'woodblock', notes: rep(32, 'C5e. C5s rq C5e. C5s rq'), vel: 75 },
        { ch: 2, patch: 'timpani', notes: comp(chords, 4, 'Re. Rs 5e Re Re. Rs 5e Re', { bass: 'A2' }), vel: 70 },
        { ch: 3, patch: 'marimba', notes: comp(chords, 4, 'rq Xq rq Xq', { lo: 'F3' }), vel: 45 },
      ],
      [{ patch: 'snare-tight', grid: grid(4, rep(7, '................').replace(/ \| /g, '|') + '|' + ROLL), vel: 55 }],
    );
  }
  if (round === 1) {
    const chords = [...CREEP, ...CREEP, ...CREEP_B, ...CREEP];
    return score(
      11,
      4,
      [
        { ch: 0, patch: 'marimba', notes: bars(SNEAK_A, SNEAK_A, SNEAK_B, SNEAK_A), vel: 115 },
        { ch: 1, patch: 'cowbell', notes: rep(32, 'rq C5u C5t rq C5q'), vel: 55 },
        { ch: 2, patch: 'timpani', notes: comp(chords, 4, 'Rq 5q 8q 5q', { bass: 'A2' }), vel: 65 },
        { ch: 3, patch: 'vibraphone', notes: comp(chords, 4, 'ru Xt rq ru Xt rq', { lo: 'F3' }), vel: 40 },
      ],
      [
        { patch: 'hat-pedal', grid: grid(32, '...x.....x..'), vel: 45 },
        { patch: 'snare-tight', grid: grid(4, rep(7, '................').replace(/ \| /g, '|') + '|' + ROLL), vel: 50 },
      ],
    );
  }
  const chords = [...GALOP, ...GALOP, ...GALOP_B, ...GALOP];
  return score(
    8,
    4,
    [
      { ch: 0, patch: 'glockenspiel', notes: shift(bars(GALOP_A1, GALOP_A1, GALOP_B1, GALOP_A1), -4), vel: 80 },
      { ch: 1, patch: 'woodblock', notes: rep(32, 'C5e C5e C5e C5e C5e C5e C5q'), vel: 40 },
      { ch: 2, patch: 'timpani', notes: comp(chords, 4, 'Rq 5q Rq 5q', { bass: 'A2' }), vel: 90 },
      { ch: 3, patch: 'xylophone', notes: comp(chords, 4, 'rq Xq rq Xq', { lo: 'A3' }), vel: 45 },
    ],
    [
      { patch: 'snare-tight', grid: grid(4, rep(7, '..x...x.').replace(/ \| /g, '|') + '|' + ROLL), vel: 60 },
      { patch: 'kick-punchy', grid: grid(32, 'x...x...'), vel: 65 },
    ],
  );
}

// ---- Pump Up the Volume

const PUMP_V = ['Gm', 'Gm', 'Eb', 'F', 'Gm', 'Gm', 'Eb', 'F'];
const PUMP_C = ['Cm', 'Gm', 'Eb', 'F', 'Cm', 'Gm', 'Eb', 'F'];
const PUMP_VERSE = bars(
  'G4e rs G4s Bb4e G4e D5q C5q',
  'Bb4e A4e G4q rh',
  'G4e rs G4s Bb4e G4e Eb5q D5q',
  'C5e Bb4e A4e F4e rh',
  'G4e rs G4s Bb4e D5e G5q F5q',
  'D5e C5e Bb4q rh',
  'Eb5q D5q C5q Bb4q',
  'A4h C5h',
);
const PUMP_CHORUS = bars(
  'Eb5q. Eb5e Eb5e G5e Eb5q',
  'D5h. rq',
  'Eb5q. Eb5e Eb5e G5e Bb5q',
  'A5h. rq',
  'C6q. Bb5e G5e Eb5e C5q',
  'D5q. Bb4e G4h',
  'G5e F5e Eb5e D5e C5q Eb5q',
  'D5h F5h',
);

/** Pump Up the Volume: a house groove in G minor for the basses (a fretless sings the tune, a punch bass pumps the off-beats, a slap bass answers), four on the floor. */
export function pumpSong(): Uint8Array {
  const chords = [...PUMP_V, ...PUMP_C, ...PUMP_V, ...PUMP_C];
  return score(
    9,
    4,
    [
      { ch: 0, patch: 'fretless', notes: bars(PUMP_VERSE, PUMP_CHORUS, PUMP_VERSE, PUMP_CHORUS), vel: 95, shift: 12 },
      { ch: 1, patch: 'slap-bass', notes: comp(chords, 4, 'rh 8e 5e 3e Re | rw', { bass: 'G3' }), vel: 70 },
      { ch: 2, patch: 'punch-bass', notes: comp(chords, 4, 're Re re Re re Re re 8e', { bass: 'E2' }), vel: 95 },
      { ch: 3, patch: 'finger-bass', notes: comp(chords, 4, 'rq Xe re rq. Xe', { lo: 'G3' }), vel: 45 },
    ],
    [
      { patch: 'kick-punchy', grid: grid(32, 'x...x...x...x...'), vel: 90 },
      { patch: 'clap', grid: grid(32, '....X.......X...'), vel: 70 },
      { patch: 'hat-open', grid: grid(32, '..x...x...x...x.'), vel: 45 },
    ],
  );
}

// ---- Muffled

const HUSH_A = ['F', 'C', 'Dm', 'Bb', 'F', 'Gm C', 'F', 'F'];
const HUSH_B = ['Bb', 'F', 'Gm', 'C', 'Am', 'Dm', 'Gm C', 'F'];
const LULLABY_A = bars('C5h A4q C5h F5q', 'E5h. D5h C5q', 'D5h F5q A5h F5q', 'D5h. rh.', 'C5h A4q C5h F5q', 'G5h F5q E5h D5q', 'C5h. A4h.', 'F4h. rh.');
const LULLABY_B = bars('D5h F5q Bb5h.', 'A5h G5q F5h.', 'G5h Bb5q G5h.', 'E5h. rh.', 'E5h A5q C6h.', 'A5h F5q D5h.', 'Bb4h D5q E5h G5q', 'F5h. rh.');

/** Muffled: a hushed lullaby in 6/8 (an eighth a beat), hummed on "ooh" over soft "aah" chords, the choir's low hum snoring under it. */
export function muffledSong(): Uint8Array {
  const chords = [...HUSH_A, ...HUSH_A, ...HUSH_B, ...HUSH_A];
  return score(7, 6, [
    { ch: 0, patch: 'ooh', notes: bars(LULLABY_A, LULLABY_A, LULLABY_B, LULLABY_A), vel: 70 },
    { ch: 1, patch: 'choir', notes: comp(chords, 6, 'Rh. rh.', { bass: 'F2' }), vel: 35 },
    { ch: 2, patch: 'soprano', notes: comp(chords, 6, 'rw rh | rh. 5h. | rw rh | 3h. rh.', { bass: 'C6' }), vel: 25 },
    { ch: 3, patch: 'aah', notes: comp(chords, 6, 'Xh. Xh.', { lo: 'F3' }), vel: 30, legato: 0.97 },
  ]);
}
