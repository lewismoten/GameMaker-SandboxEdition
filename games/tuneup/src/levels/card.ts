// Level 13, Sound Check (the Drum kit): inside the bandstand's sound card, where the drum kit
// lives. The FM chip plays its five drums on three channels, and here the drum channels are
// doors: the bass drum's room is open, but the snare and the hi-hat share a channel, and so
// do the tom and the cymbal, so of each pair only one door is open at a time, a bar each
// (rings of blocks on the song's bar; the song plays the snare in the bars its door is open
// and the hats in the others, the toms and the cymbal the same). Fifteen drums to find, and
// it all plays in three layers at once: the FM band (the song, in rhythm mode), the chord
// chips on the speaker (sound slots with no .VOC play on the PC speaker even with a Sound
// Blaster), and a choir .VOC for every drum found. The way out opens when all fifteen are found.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { iconPic } from '../art/icons';
import type { Pal } from '../art/pal';
import { door, kit, pickups, SOLID, GRAV, type Kit } from '../blocks/common';
import { MapBuilder, at, type Level } from './maps';

const W = 48;
/** The song's bar in ticks (a beat of 8): each door of a pair is open for one, then shut for one. */
export const CARD_BAR = 32;
/** The channel doors (level x): [the drum whose door it is, column, open in the first bar?]. */
export const CHANNEL_DOORS: [string, number, boolean][] = [
  ['snare-tight', 10, true],
  ['hat-closed', 21, false],
  ['tom-mid', 30, true],
  ['crash', 39, false],
];
/** Where each drum lies: [id, x, y]. */
export const DRUMS_AT: [string, number, number][] = [
  ['kick-punchy', 3, 8],
  ['kick-boomy', 7, 7],
  ['snare-tight', 12, 8],
  ['snare-fat', 14, 6],
  ['clap', 17, 8],
  ['rimshot', 19, 7],
  ['hat-closed', 23, 8],
  ['hat-open', 25, 6],
  ['hat-pedal', 28, 8],
  ['tom-low', 32, 8],
  ['tom-mid', 34, 6],
  ['tom-high', 35, 5],
  ['timpani-tom', 37, 8],
  ['crash', 42, 8],
  ['ride', 44, 7],
];
export const KIT_FINDS = DRUMS_AT.map(([id]) => id);
/** Chips on the board (solid, to climb): [column, height in blocks]. */
const CHIPS: [number, number][] = [
  [7, 1],
  [13, 1],
  [14, 2],
  [19, 1],
  [24, 1],
  [25, 2],
  [33, 1],
  [34, 2],
  [35, 3],
  [44, 1],
];
/** The chord chips Teddy walks through, each a speaker chord: [column, row, chord 0..3]. */
export const CHORD_CHIPS: [number, number, number][] = [
  [5, 8, 0],
  [16, 8, 1],
  [27, 8, 2],
  [41, 8, 3],
];

export function cardBlocks(pal: Pal): Kit {
  const k = kit(pal);
  const { book, c, P } = k;
  const air = { grav: GRAV.down };
  // the circuit board: green, copper traces, solder pads
  const board = () => {
    const p = P(c('green', 0));
    p.rect(0, 5, 20, 1, c('gold', 0)).rect(14, 5, 1, 15, c('gold', 0)).rect(4, 13, 10, 1, c('gold', 0));
    return p.disc(14, 5, 1.4, c('metal', 3)).disc(4, 13, 1.4, c('metal', 3));
  };
  book.add('board', board(), air);
  // the card's edge: gold contacts (the floor), and the bracket overhead
  book.add('edge', P(c('green', 0)).rect(0, 0, 20, 2, c('green', 1)).rect(2, 3, 6, 17, c('gold', 2)).rect(12, 3, 6, 17, c('gold', 2)), { solid: SOLID });
  book.add('bracket', P(c('metal', 2)).rect(0, 14, 20, 6, c('metal', 1)).rect(0, 0, 20, 2, c('metal', 3)).disc(10, 8, 2, c('ink', 0)), { solid: SOLID });
  // a chip: black, with silver legs (stand on it); the FM chip's wall between the rooms
  book.add(
    'chip',
    P(c('green', 0))
      .rect(2, 2, 16, 16, c('ink', 0))
      .rect(2, 2, 16, 1, c('ink', 1))
      .rect(0, 4, 2, 2, c('metal', 3))
      .rect(18, 4, 2, 2, c('metal', 3))
      .rect(0, 12, 2, 2, c('metal', 3))
      .rect(18, 12, 2, 2, c('metal', 3)),
    {
      solid: SOLID,
    },
  );
  book.add(
    'wall',
    P(c('ink', 0)).rect(0, 0, 2, 20, c('ink', 1)).rect(18, 0, 2, 20, c('ink', 1)).rect(8, 4, 4, 1, c('metal', 2)).rect(8, 15, 4, 1, c('metal', 2)),
    { solid: SOLID },
  );
  // each channel door: the drum's picture on its lintel, lit while its door is open; the
  // door a gate of copper bars (shut, solid) or lifted (open)
  for (const [id, , first] of CHANNEL_DOORS) {
    const lintel = (lit: boolean) => {
      const p = iconPic(id, P(c('ink', 0)).rect(0, 0, 20, 20, lit ? c('fam-kit', 2) : c('ink', 1)));
      return lit ? p.frame(0, 0, 20, 20, c('glow', 3)) : p;
    };
    const gate = (open: boolean) => {
      const p = board();
      if (open) return p.rect(0, 0, 20, 3, c('gold', 1));
      for (let x = 2; x < 20; x += 4) p.rect(x, 0, 2, 20, c('gold', 1)).rect(x, 0, 1, 20, c('gold', 2));
      return p;
    };
    const ring = first ? [true, false] : [false, true];
    ring.forEach((open, j) => {
      book.add(`lintel-${id}.${j}`, lintel(open), { solid: SOLID, ntime: CARD_BAR, next: `lintel-${id}.${1 - j}` });
      book.add(`gate-${id}.${j}`, gate(open), { ...(open ? air : { solid: SOLID }), ntime: CARD_BAR, next: `gate-${id}.${1 - j}` });
    });
  }
  // the chord chips: a little speaker chip that plays a chord on the PC speaker (slots 5, 6, 0, 2)
  const chordChip = (played: boolean, color: number) => {
    const p = board().rect(5, 6, 10, 10, c('ink', 0)).rect(5, 6, 10, 1, c('ink', 1));
    p.disc(10, 11, 3, played ? c('ink', 1) : color).disc(10, 11, 1, c('ink', 0));
    return p;
  };
  const rings = [{ score: 10 }, { score: -1 }, { hp: 1 }, { effect: 3, eamt: 1 }];
  const colors = [c('red', 2), c('blue', 2), c('yellow', 2), c('purple', 2)];
  rings.forEach((r, i) => book.add(`chord${i}`, chordChip(false, colors[i]), { ...air, ...r, touch: 'chord.played' }));
  book.add('chord.played', chordChip(true, 0), air);
  pickups(k, KIT_FINDS, 'board');
  door(k, board(), KIT_FINDS.length, (p: Pixels) => {
    // a drumstick pair over the way out
    p.line(5, 4, 15, 11, c('wood', 4)).line(15, 4, 5, 11, c('wood', 4));
  });
  return k;
}

export function card(book: Kit['book']): Level {
  const m = new MapBuilder(book, { '.': 'board', _: 'edge', '=': 'bracket', C: 'chip', '#': 'wall' }, 'bracket');
  m.fill(0, 0, W, 1, '=').fill(0, 1, W, 8, '.').fill(0, 9, W, 1, '_');
  // the channel doors, each in a wall of the FM chip up to the bracket
  for (const [id, x] of CHANNEL_DOORS) m.fill(x, 1, 1, 6, '#').set(x, 7, `lintel-${id}.0`).set(x, 8, `gate-${id}.0`);
  for (const [x, h] of CHIPS) for (let y = 9 - h; y < 9; y++) m.set(x, y, 'C');
  for (const [x, y, i] of CHORD_CHIPS) m.set(x, y, `chord${i}`);
  for (const [id, x, y] of DRUMS_AT) m.set(x, y, `pick-${id}`);
  m.set(46, 8, 'door').set(46, 7, 'door.top').set(47, 8, 'door.open').fill(46, 1, 1, 6, '#');
  m.link(47, 8);
  // row 5: the view (which never scrolls up or down) sits square on the level; Teddy drops to the board's edge
  return { m, start: at(1, 5), size: [W, 10] };
}
