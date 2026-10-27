// The soundtrack: FM songs for the Sound Blaster. "The Baker's Dozen" is a fife-and-drum march
// of thirteen bars, one more than anybody can march to; every room plays it its own way
// (a music box in the Pantry, a hot band in the Bakehouse, a minuet in the Tea Room, a polka
// in the Brewery, a ticking clock at midnight...), and the title and ending dress it up.
import { INSTRUMENTS, sbi } from '../../../kit/music';
import { tune, v, times } from '../../../kit/tune';

const CHORDS: Record<string, string[]> = {
  G: ['D4', 'G4', 'B4'],
  C: ['E4', 'G4', 'C5'],
  D: ['D4', 'F#4', 'A4'],
  D7: ['D4', 'F#4', 'C5'],
  Em: ['E4', 'G4', 'B4'],
  Am: ['E4', 'A4', 'C5'],
  B7: ['D#4', 'F#4', 'A4'],
};
const ROOT: Record<string, string> = { G: 'G', C: 'C', D: 'D', D7: 'D', Em: 'E', Am: 'A', B7: 'B' };
const FIFTH: Record<string, string> = { G: 'D', C: 'G', D: 'A', E: 'B', A: 'E', B: 'F#' };

function comp(bars: string[], rhythm: string, octave = 0): [string, string, string] {
  const out: [string[], string[], string[]] = [[], [], []];
  for (const ch of bars)
    for (const len of rhythm.split(' ')) {
      if (len.startsWith('r')) for (const v of out) v.push(`r ${len.slice(1) || 'q'}`);
      else CHORDS[ch].forEach((n, i) => out[i].push(`${n.slice(0, -1)}${Number(n.slice(-1)) + octave} ${len}`));
    }
  return out.map((v) => v.join(', ')) as [string, string, string];
}

function bass(bars: string[], style: 'oompah' | 'walk' | 'whole' | 'half'): string {
  return bars
    .map((ch) => {
      const r = ROOT[ch];
      const f = FIFTH[r];
      if (style === 'whole') return `${r}2 w`;
      if (style === 'half') return `${r}2 h, ${f}2 h`;
      if (style === 'walk') return `${r}2 q, ${f}2 q, ${r}3 q, ${f}2 q`;
      return `${r}2 q, r q, ${f}2 q, r q`;
    })
    .join(', ');
}

const FIFE = sbi({
  modChar: 0x22,
  carChar: 0x21,
  modLevel: 0x24,
  carLevel: 0x00,
  modAD: 0x95,
  carAD: 0x84,
  modSR: 0x17,
  carSR: 0x17,
  modWave: 0,
  feedback: 0x0e,
});
const SNARE = sbi({
  modChar: 0x0f,
  carChar: 0x0f,
  modLevel: 0x00,
  carLevel: 0x00,
  modAD: 0xf8,
  carAD: 0xf6,
  modSR: 0x06,
  carSR: 0x07,
  modWave: 3,
  carWave: 3,
  feedback: 0x0e,
});
const HARPSI = sbi({
  modChar: 0x32,
  carChar: 0x16,
  modLevel: 0x87,
  carLevel: 0x00,
  modAD: 0xf1,
  carAD: 0xd2,
  modSR: 0x14,
  carSR: 0x45,
  modWave: 1,
  feedback: 0x08,
});
const TUBA = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x19, carLevel: 0x00, modAD: 0x92, carAD: 0x92, modSR: 0x2a, carSR: 0x2a, feedback: 0x0a });
const CLARINET = sbi({
  modChar: 0x32,
  carChar: 0x21,
  modLevel: 0x1a,
  carLevel: 0x00,
  modAD: 0x82,
  carAD: 0x72,
  modSR: 0x15,
  carSR: 0x16,
  modWave: 0,
  feedback: 0x0e,
});
const TICK = sbi({ modChar: 0x0f, carChar: 0x01, modLevel: 0x00, carLevel: 0x00, modAD: 0xf8, carAD: 0xf9, modSR: 0x07, carSR: 0x08, feedback: 0x0e });
const KAZOO = sbi({
  modChar: 0x21,
  carChar: 0x21,
  modLevel: 0x10,
  carLevel: 0x00,
  modAD: 0xb1,
  carAD: 0xa1,
  modSR: 0x2e,
  carSR: 0x2e,
  modWave: 2,
  carWave: 1,
  feedback: 0x0e,
});
const { piano, bass: BASS, strings, brass, bell, organ, pad, pluck } = INSTRUMENTS;

// The Baker's Dozen: thirteen bars in G. The thirteenth is the one people trip on.
const THEME = [
  'G4 e, B4 e, D5 q, D5 e, E5 e, D5 q',
  'C5 e, B4 e, A4 q, B4 e, A4 e, G4 q',
  'G4 e, B4 e, D5 q, G5 e, F#5 e, E5 q',
  'D5 h, r q, D5 e, E5 e',
  'F#5 q, E5 e, D5 e, E5 q, A4 q',
  'D5 q, C5 e, B4 e, C5 q, F#4 q',
  'G4 e, A4 e, B4 e, C5 e, D5 q, B4 q',
  'A4 h., r q',
  'B4 e, C5 e, D5 q, E5 e, F#5 e, G5 q',
  'F#5 e, E5 e, D5 q, C5 e, B4 e, A4 q',
  'G4 q, B4 q, D5 q, G5 q',
  'F#5 e, E5 e, D5 e, C5 e, B4 q, A4 q',
  'G4 h, r h',
].join(', ');
const CH = ['G', 'D', 'G', 'D', 'D', 'D7', 'G', 'D', 'G', 'D', 'G', 'D7', 'G'];
// The B section: the same idea in E minor, for the cellars and the clock
const MINOR = [
  'E4 e, G4 e, B4 q, B4 e, C5 e, B4 q',
  'A4 e, G4 e, F#4 q, G4 e, F#4 e, E4 q',
  'E4 e, G4 e, B4 q, E5 e, D5 e, C5 q',
  'B4 h, r q, B4 e, C5 e',
  'D5 q, C5 e, B4 e, C5 q, F#4 q',
  'B4 q, A4 e, G4 e, A4 q, D#4 q',
  'E4 e, F#4 e, G4 e, A4 e, B4 q, G4 q',
  'F#4 h., r q',
  'G4 e, A4 e, B4 q, C5 e, D5 e, E5 q',
  'D5 e, C5 e, B4 q, A4 e, G4 e, F#4 q',
  'E4 q, G4 q, B4 q, E5 q',
  'D#5 e, C5 e, B4 e, A4 e, G4 q, F#4 q',
  'E4 h, r h',
].join(', ');
const MCH = ['Em', 'B7', 'Em', 'B7', 'Am', 'B7', 'Em', 'B7', 'Em', 'Am', 'Em', 'B7', 'Em'];

const drum = (bars: number, pat = 'C4 e, C4 e, C4 q, C4 e, C4 e, C4 q') => times(bars, pat);

/** Title: fife and drum, with brass. */
export function titleSong(): Uint8Array {
  const [a, b, c] = comp(CH, 'q q q q', -1);
  return tune(120, [
    v(0, FIFE, THEME, 110, 12),
    v(1, brass, a, 55),
    v(2, brass, b, 55),
    v(3, brass, c, 55),
    v(4, BASS, bass(CH, 'oompah'), 110),
    v(5, SNARE, drum(13), 70),
  ]);
}

/** Menu: the march on a music box, waiting for orders. */
export function menuSong(): Uint8Array {
  const [a, b, c] = comp(CH, 'h h', -1);
  return tune(100, [v(0, bell, THEME, 95, 12), v(1, pad, a, 40), v(2, pad, b, 40), v(3, pad, c, 40), v(4, BASS, bass(CH, 'half'), 80)]);
}

/** The storyline: slow strings, in minor, as befits a conspiracy. */
export function storySong(): Uint8Array {
  const [a, b, c] = comp(MCH, 'w', -1);
  return tune(80, [v(0, CLARINET, MINOR, 100), v(1, strings, a, 50), v(2, strings, b, 50), v(3, strings, c, 50), v(4, BASS, bass(MCH, 'whole'), 85)]);
}

/** Each room's version of the march. */
export function roomSong(id: string): Uint8Array {
  switch (id) {
    case 'pantry': {
      const [a, b, c] = comp(CH, 'r q. e q', -1);
      return tune(108, [v(0, bell, THEME, 95, 12), v(1, pluck, a, 45), v(2, pluck, b, 45), v(3, pluck, c, 45), v(4, BASS, bass(CH, 'walk'), 85)]);
    }
    case 'larder': {
      const [a, b, c] = comp(MCH, 'q. e h', -1);
      return tune(96, [v(0, CLARINET, MINOR, 100), v(1, organ, a, 40), v(2, organ, b, 40), v(3, organ, c, 40), v(4, BASS, bass(MCH, 'half'), 90)]);
    }
    case 'parlor': {
      const [a, b, c] = comp(CH, 're e re e re e re e', -1);
      return tune(112, [v(0, HARPSI, THEME, 100), v(1, HARPSI, a, 45), v(2, HARPSI, b, 45), v(3, HARPSI, c, 45), v(4, BASS, bass(CH, 'walk'), 80)]);
    }
    case 'bakery': {
      const [a, b, c] = comp(CH, 're e re e re e re e', -1);
      return tune(144, [
        v(0, brass, THEME, 110, 2),
        v(1, piano, a, 55, 2),
        v(2, piano, b, 55, 2),
        v(3, piano, c, 55, 2),
        v(4, BASS, bass(CH, 'walk'), 110, 2),
        v(5, SNARE, drum(13, 'C4 q, C4 q, C4 q, C4 q'), 55),
      ]);
    }
    case 'cellar': {
      const [a, b, c] = comp(MCH, 'w', -1);
      return tune(76, [v(0, bell, MINOR, 95, 12), v(1, pad, a, 50), v(2, pad, b, 50), v(3, pad, c, 50), v(4, BASS, bass(MCH, 'whole'), 80)]);
    }
    case 'tearoom': {
      const [a, b, c] = comp(CH, 'q q q q', -1);
      return tune(100, [
        v(0, HARPSI, THEME, 100, 5),
        v(1, strings, a, 45, 5),
        v(2, strings, b, 45, 5),
        v(3, strings, c, 45, 5),
        v(4, BASS, bass(CH, 'half'), 80, 5),
      ]);
    }
    case 'sugar': {
      const [a, b, c] = comp(CH, 're e re e re e re e', -1);
      return tune(132, [v(0, pluck, THEME, 105, 14), v(1, bell, a, 40, 12), v(2, bell, b, 40, 12), v(3, bell, c, 40, 12), v(4, BASS, bass(CH, 'oompah'), 100)]);
    }
    case 'brewery': {
      const [a, b, c] = comp(CH, 'r q r q', -1);
      return tune(138, [v(0, CLARINET, THEME, 105), v(1, organ, a, 50), v(2, organ, b, 50), v(3, organ, c, 50), v(4, TUBA, bass(CH, 'oompah'), 120)]);
    }
    case 'clock': {
      const [a, b, c] = comp(MCH, 'h h', -1);
      return tune(90, [
        v(0, HARPSI, MINOR, 95),
        v(1, pad, a, 45),
        v(2, pad, b, 45),
        v(3, pad, c, 45),
        v(4, BASS, bass(MCH, 'half'), 85),
        v(5, TICK, times(13, 'C5 q, G4 q, C5 q, G4 q'), 55),
      ]);
    }
    case 'bottling': {
      const [a, b, c] = comp(CH, 're e re e re e re e', -1);
      return tune(126, [
        v(0, KAZOO, THEME, 100),
        v(1, pluck, a, 50),
        v(2, pluck, b, 50),
        v(3, pluck, c, 50),
        v(4, BASS, bass(CH, 'walk'), 100),
        v(5, TICK, times(13, 'C4 e, C4 e, C4 e, C4 e, C4 e, C4 e, C4 e, C4 e'), 40),
      ]);
    }
    case 'loft': {
      const [a, b, c] = comp(MCH, 'w', -1);
      return tune(100, [
        v(0, organ, MINOR, 100),
        v(1, strings, a, 55),
        v(2, strings, b, 55),
        v(3, strings, c, 55),
        v(4, BASS, bass(MCH, 'walk'), 100),
        v(5, SNARE, drum(13, 'C4 s, C4 s, C4 s, C4 s, r q, r h'), 55),
      ]);
    }
    case 'cistern': {
      const [a, b, c] = comp(MCH, 'r q. e q', -1);
      return tune(84, [v(0, bell, MINOR, 90, 12), v(1, pad, a, 45), v(2, pad, b, 45), v(3, pad, c, 45), v(4, BASS, bass(MCH, 'whole'), 80)]);
    }
    case 'vault': {
      const [a, b, c] = comp(MCH, 'q q q q', -1);
      return tune(104, [
        v(0, brass, MINOR, 105),
        v(1, strings, a, 55),
        v(2, strings, b, 55),
        v(3, strings, c, 55),
        v(4, TUBA, bass(MCH, 'oompah'), 115),
        v(5, SNARE, drum(13), 65),
      ]);
    }
    default: {
      // the hidey-hole: a lone fife, 1777
      const [a, b, c] = comp(CH, 'w', -1);
      return tune(96, [v(0, FIFE, THEME, 100, 12), v(1, pad, a, 30), v(2, pad, b, 30), v(3, pad, c, 30), v(4, SNARE, drum(13, 'r h, C4 e, C4 e, C4 q'), 50)]);
    }
  }
}

/** The ending: a fanfare, then the march in full, with everybody. */
export function wonSong(): Uint8Array {
  const fan = 'D5 e, D5 e, D5 e, G5 e, B5 q, D6 q, C6 e, C6 e, C6 e, E6 e, D6 h';
  const ch = ['G', 'C', ...CH, 'G'];
  const [a, b, c] = comp(ch, 'q q q q', -1);
  return tune(120, [
    v(0, FIFE, `${fan}, ${THEME}, G5 w`, 110, 12),
    v(1, brass, a, 60),
    v(2, brass, b, 60),
    v(3, brass, c, 60),
    v(4, TUBA, bass(ch, 'oompah'), 115),
    v(5, SNARE, drum(16), 70),
  ]);
}

/** Lost: the march, gone flat. */
export function lostSong(): Uint8Array {
  const mel = 'B4 h, G4 q, E4 q, F#4 h., r q, D#4 w, E4 w';
  const ch = ['Em', 'B7', 'B7', 'Em'];
  const [a, b, c] = comp(ch, 'w', -1);
  return tune(66, [v(0, KAZOO, mel, 100), v(1, pad, a, 50), v(2, pad, b, 50), v(3, pad, c, 50), v(4, BASS, bass(ch, 'whole'), 85)]);
}

export const ROOM_SONGS = [
  'pantry',
  'larder',
  'parlor',
  'bakery',
  'cellar',
  'tearoom',
  'sugar',
  'brewery',
  'clock',
  'bottling',
  'loft',
  'cistern',
  'vault',
  'hidey',
];
