// Level 10, The Rain Delay (the cab in a rainstorm, gray-blue). The radio has to wait: it's
// pouring, and Doc Leo crosses the windshield along the cowl under the glass while the wipers keep
// time like a metronome. Each wiper is a blade that sweeps through its column on the beat (a ring
// of blocks, the blade stinging only while it stands upright in the column: a wet slap costs a
// little energy, never a life). Between the blades are dry spots where raindrops collect; each drop
// rings a steel tongue drum, a note of D major by the kind of change it makes. The first three
// wipers sweep every 2 beats, the next three every 3, and the last three in a tricky 5/4: two
// beats, then three. No monsters. The save sign stands by the start, the level after the felt egg.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { saveSignBlocks } from '../../../kit/saveSign';
import { AIR, kit, SOLID, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import type { Pal } from '../art/palette';
import { CTR, MONEY, MON } from '../ids';
import { MapBuilder, at, type Level } from './maps';

/** A beat of the rain's song in ticks (rainSong's tempo). */
export const RAIN_BEAT = 12;
/** A blade's sweep through its column: tilting in, upright (it stings), tilting out; ticks each. */
const SWEEP = { in: 2, on: 4, out: 2 } as const;
const SWEEP_TICKS = SWEEP.in + SWEEP.on + SWEEP.out;

export interface WiperSection {
  /** Its blocks are named for it. */
  name: string;
  /** Wiper columns (level x). */
  wipers: number[];
  /** The beats each sweep starts on, in a bar of `bar` beats. */
  sweeps: number[];
  bar: number;
}

export const SECTIONS: WiperSection[] = [
  { name: 'two', wipers: [12, 15, 18], sweeps: [0], bar: 2 },
  { name: 'three', wipers: [22, 25, 28], sweeps: [0], bar: 3 },
  { name: 'five', wipers: [32, 35, 38], sweeps: [0, 2], bar: 5 },
];
export const RAIN = { w: 46, floor: 9, sign: 3, exit: 43 } as const;
/** The rows a blade is drawn in (it stings on the bottom two, where Doc Leo is). */
const BLADE_ROWS = [5, 6, 7, 8];
/** Raindrops on the dry spots (level x, on the cowl), and the note each rings (by its kind of change). */
export const DROPS = [13, 16, 19, 23, 26, 29, 33, 36, 39];
const DROP_KINDS = [{ hp: 1 }, { effect: MONEY, eamt: 1 }, { effect: CTR.drops, eamt: 1 }, { score: 10 }] as const;

/** The ring of one section's blade in one row: [block name, picture's tilt or null when parked, ticks, stings]. */
function bladeRing(s: WiperSection): { tilt: number | null; ticks: number; stings: boolean }[] {
  const ring: { tilt: number | null; ticks: number; stings: boolean }[] = [];
  const total = s.bar * RAIN_BEAT;
  s.sweeps.forEach((beat, i) => {
    const start = beat * RAIN_BEAT;
    const next = i + 1 < s.sweeps.length ? s.sweeps[i + 1] * RAIN_BEAT : total;
    ring.push({ tilt: -1, ticks: SWEEP.in, stings: false }, { tilt: 0, ticks: SWEEP.on, stings: true }, { tilt: 1, ticks: SWEEP.out, stings: false });
    ring.push({ tilt: null, ticks: next - start - SWEEP_TICKS, stings: false });
  });
  return ring;
}

/** The block name of a section's blade in row `row`, frame `f`. */
export const bladeName = (s: WiperSection, row: number, f: number) => `${s.name}.${row}.${f}`;
/** The frames of a section's ring just after its blade has gone by (a person crosses then). */
export const parkedFrames = (s: WiperSection) => bladeRing(s).flatMap((r, f) => (r.tilt === null ? [f] : []));
/** The bottom row a blade is drawn in (where it stings Doc Leo's feet). */
export const BLADE_FOOT = BLADE_ROWS[BLADE_ROWS.length - 1];

export function rainBlocks(pal: Pal): Kit {
  const k = kit(pal);
  baseSet(k, 'cab');
  const { book, c, R } = k;
  // the windshield, one gradient from the dark roof down to the lighter glass over the cowl,
  // a row of blocks each; the blurry lights of the street beyond on a few
  const sheet = gradient(new Pixels(20, RAIN.floor * 20, 0), 0, 0, 20, RAIN.floor * 20, R('wall'), 0, 3);
  for (let y = 1; y < RAIN.floor; y++) book.add(`sky${y}`, sheet.crop(0, y * 20, 20, 20), AIR);
  const glass = (row = BLADE_FOOT) => k.pic(`sky${row}`);
  for (const [i, ramp] of (['lamp', 'accent', 'lamp'] as const).entries()) {
    const p = glass(4 + i);
    p.disc(6 + i * 4, 10, 4, c(ramp, 1))
      .disc(6 + i * 4, 10, 2.5, c(ramp, 2))
      .disc(15 - i * 3, 6 + i * 3, 2, c(ramp, 1));
    book.add(`lights${i}`, p, AIR);
  }
  // the roof liner along the top
  const roof = k.P(c('shade', 1));
  roof.rect(0, 16, 20, 4, c('shade', 3)).rect(0, 19, 20, 1, c('mach', 2));
  book.add('roof', roof, { solid: SOLID });
  // the cowl under the glass: the dash's top, wet, with the wipers' pivots
  const cowl = k.pic('dash');
  cowl.rect(0, 0, 20, 1, c('lamp', 3));
  for (let x = 3; x < 20; x += 7) cowl.set(x, 1, c('lamp', 4));
  book.add('cowl', cowl, { solid: SOLID });
  // rain running down the glass: a few streaks, falling (three frames), on every row
  for (let y = 1; y < RAIN.floor; y++)
    for (let f = 0; f < 3; f++) {
      const p = glass(y);
      for (const [x, y] of [
        [3, 2],
        [11, 9],
        [16, 4],
      ])
        p.rect(x, (y + f * 7) % 20, 1, 4, c('lamp', 2)).set(x, (y + f * 7 + 4) % 20, c('lamp', 4));
      book.add(`streak${y}.${f}`, p, { ...AIR, ntime: 3, next: `streak${y}.${(f + 1) % 3}` });
    }
  // the blades: an arm from the pivot below the cowl, tilting in, upright, tilting out; the
  // rubber edge black, the arm steel; drawn whole and cut into the blade's rows
  const blade = (tilt: number | null) => {
    const h = BLADE_ROWS.length * 20;
    const p = new Pixels(20, h, 0);
    BLADE_ROWS.forEach((row, y) => p.blit(glass(row), 0, y * 20));
    if (tilt === null) {
      // parked: the glass just wiped, a clear sheen where the blade went by
      for (let y = 2; y < h; y += 5) p.rect(9, y, 2, 2, c('lamp', 3));
      return p;
    }
    const top = 10 + tilt * 9;
    // the arm (steel), then the blade along it (black rubber in a steel holder)
    for (let d = 0; d < 2; d++) p.line(10 + d, h, top + 3 + d, 2, c('mach', 4 - d * 2));
    for (let d = 0; d < 3; d++) p.line(top - 2 + d, 2, 10 - 2 + d - tilt * 2, h - 4, d === 2 ? c('mach', 3) : c('ink', d));
    p.disc(10, h - 2, 2.5, c('mach', 2));
    if (tilt === 0) for (let y = 8; y < h; y += 9) p.set(14, y, c('lamp', 4)).set(5, y + 3, c('lamp', 4));
    return p;
  };
  for (const s of SECTIONS) {
    const ring = bladeRing(s);
    ring.forEach((r, f) => {
      const pic = blade(r.tilt);
      BLADE_ROWS.forEach((row, i) => {
        const stings = r.stings && row >= RAIN.floor - 2;
        book.add(bladeName(s, row, f), pic.crop(0, i * 20, 20, 20), {
          ...AIR,
          ...(stings ? { hp: -2 } : {}),
          ntime: r.ticks,
          next: bladeName(s, row, (f + 1) % ring.length),
        });
      });
    });
  }
  // a raindrop on the cowl: a bead of water that rings when Doc Leo walks through it
  DROP_KINDS.forEach((kind, i) => {
    const p = glass();
    p.disc(10, 13, 5, c('pipe', 1)).disc(10, 12, 4, c('pipe', 3)).disc(9, 11, 1.5, c('lamp', 4));
    for (let y = 4; y < 9; y++) p.rect(10 - Math.floor((y - 4) / 2), y, 1 + Math.floor((y - 4) / 2) * 2, 1, c('pipe', 3));
    book.add(`drop${i}`, p, { ...AIR, ...kind, touch: 'glass' });
  });
  const s = saveSignBlocks(pal.pal, { board: [glass(RAIN.floor - 2), glass(RAIN.floor - 2)], posts: [glass(), glass()] });
  book.add('sign.l', s.board[0], AIR);
  book.add('sign.r', s.board[1], AIR);
  book.add('post.l', s.posts![0], AIR);
  book.add('post.r', s.posts![1], AIR);
  return k;
}

export function rain(book: Kit['book']): Level {
  const { w, floor } = RAIN;
  const m = new MapBuilder(book, { '=': 'cowl', '#': 'roof', '|': 'pillar' }, 'dash');
  for (let y = 1; y < floor; y++) m.fill(0, y, w, 1, `sky${y}`);
  m.fill(0, floor, w, 1, '=').fill(0, 0, w, 1, '#');
  // the A-pillars at either end; rain streaks here and there
  m.fill(0, 1, 1, floor - 1, '|').fill(w - 1, 1, 1, floor - 1, '|');
  for (let x = 2; x < w - 2; x += 2) {
    const y = 1 + ((x * 7) % 6);
    m.set(x, y, `streak${y}.${x % 3}`);
  }
  for (const x of [5, 14, 21, 30, 37]) m.set(x, 4 + (x % 3), `lights${x % 3}`);
  for (const s of SECTIONS) for (const x of s.wipers) BLADE_ROWS.forEach((row) => m.set(x, row, bladeName(s, row, 0)));
  DROPS.forEach((x, i) => m.set(x, floor - 1, `drop${i % DROP_KINDS.length}`));
  m.set(RAIN.sign, floor - 2, 'sign.l')
    .set(RAIN.sign + 1, floor - 2, 'sign.r')
    .set(RAIN.sign, floor - 1, 'post.l')
    .set(RAIN.sign + 1, floor - 1, 'post.r');
  m.link(RAIN.exit, floor - 1);
  m.mon(MON.regina, 6, floor - 1);
  return { m, start: at(8, 5), size: [w, 10] };
}
