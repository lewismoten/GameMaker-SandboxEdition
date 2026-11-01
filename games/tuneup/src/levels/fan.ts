// Level 5, The Fan Band (the motor's vent to the defroster flap; cool teal, then hot amber over
// the same blocks). THE CHEZ's motor warms the air, and a vent carries it up to a flap under the
// windshield. The vent is full of little fans, each with a kazoo, and Doc Leo switches each one
// on (Space, reaching up under it) to join the band. Warm air rises up the columns in pulses on
// the beat (half a beat pushing up, half a beat still, so he rises a step at a time and can step
// off at the top). Two verses, a scene each; the second is hotter, its columns out of step with
// each other. When every fan in a verse plays, the flap opens.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { AIR, countedDoor, GRAV, kit, SOLID, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import type { Pal } from '../art/palette';
import { CTR, MON } from '../ids';
import { MapBuilder, at, type Level } from './maps';

/** A beat of the song in ticks (fanSong's tempo): a column pushes half of it, rests half. */
export const FAN_BEAT = 10;
/** The rows: the ceiling, the ledges, the floor (Doc Leo stands two blocks over a floor). */
export const FAN_ROW = { ceiling: 0, cap: 1, high: 2, ledge: 5, low: 6, floor: 9 } as const;

export interface FanVerse {
  file: string;
  w: number;
  /** The warm-air columns: level x and the half-beat each starts on (0 or 1). */
  columns: { x: number; phase: 0 | 1 }[];
  /** The ledges to stand on at the top: [first x, last x]. */
  ledges: [number, number][];
  /** The fans: [x, y] (y is FAN_ROW.high, over a ledge, or FAN_ROW.low, over the floor). */
  fans: [number, number][];
  /** Tool chests on the floor to hop (x). */
  chests: number[];
  exit: number;
}

export const FAN_VERSES: FanVerse[] = [
  {
    file: 'fan1',
    w: 30,
    columns: [
      { x: 6, phase: 0 },
      { x: 17, phase: 0 },
    ],
    ledges: [
      [7, 12],
      [18, 24],
    ],
    fans: [
      [3, FAN_ROW.low],
      [9, FAN_ROW.high],
      [12, FAN_ROW.high],
      [14, FAN_ROW.low],
      [20, FAN_ROW.high],
      [24, FAN_ROW.high],
    ],
    chests: [15],
    exit: 27,
  },
  {
    file: 'fan2',
    w: 36,
    columns: [
      { x: 5, phase: 0 },
      { x: 14, phase: 1 },
      { x: 25, phase: 0 },
    ],
    ledges: [
      [6, 12],
      [15, 20],
      [26, 31],
    ],
    fans: [
      [2, FAN_ROW.low],
      [8, FAN_ROW.high],
      [11, FAN_ROW.high],
      [18, FAN_ROW.high],
      [22, FAN_ROW.low],
      [28, FAN_ROW.high],
      [31, FAN_ROW.high],
    ],
    chests: [23],
    exit: 33,
  },
];

export function fanBlocks(v: FanVerse) {
  return (pal: Pal): Kit => {
    const k = kit(pal);
    baseSet(k, 'engine');
    const { book, c } = k;
    // the vent's slats behind everything
    const vent = k.pic('bay');
    for (let y = 2; y < 20; y += 6) vent.rect(0, y, 20, 2, c('wall', 2)).rect(0, y + 2, 20, 1, c('wall', 0));
    book.add('vent', vent, AIR);
    // a column of warm air: wavy rising lines, pushing up for half a beat, then still
    const column = (push: boolean, f: number) => {
      const p = k.pic('vent');
      p.rect(3, 0, 14, 20, c('accent', push ? 1 : 0));
      for (const x of [6, 10, 14]) for (let y = 0; y < 20; y += 2) p.set(x + Math.round(Math.sin((y + f * 5 + x) / 3)), y, c('accent', push ? 4 : 2));
      if (push) p.rect(8, (20 - f * 6) % 20, 4, 2, c('lamp', 4));
      return p;
    };
    const half = FAN_BEAT / 2;
    book.add('air.up', column(true, 0), { grav: GRAV.up, ntime: half, next: 'air.rest' });
    book.add('air.rest', column(false, 1), { grav: GRAV.none, ntime: half, next: 'air.up' });
    // the cap over a column: solid, a grille
    const cap = k.pic('casting');
    for (let x = 3; x < 18; x += 3) cap.rect(x, 12, 2, 8, c('shade', 0));
    book.add('cap', cap, { solid: SOLID });
    // a fan: off (still, a kazoo hanging silent), on (spinning, the kazoo buzzing)
    const fan = (on: boolean, f: number) => {
      const p = k.pic('vent');
      p.disc(10, 9, 8, c('mach', 1)).disc(10, 9, 7, c('mach', 3));
      const a = f * 0.8 + (on ? 0 : 0.3);
      for (let b = 0; b < 3; b++) {
        const ang = a + (b * Math.PI * 2) / 3;
        p.line(10, 9, 10 + Math.round(Math.cos(ang) * 6), 9 + Math.round(Math.sin(ang) * 6), on ? c('lamp', 4) : c('mach', 5));
      }
      p.disc(10, 9, 1.5, c('mach', 0));
      // its kazoo
      p.rect(13, 16, 6, 3, on ? c('accent', 3) : c('accent', 1)).rect(15, 15, 2, 1, c('mach', 4));
      if (on && f % 2) p.set(19, 14, c('lamp', 4)).set(18, 12, c('lamp', 4));
      return p;
    };
    book.add('fan', fan(false, 0), { ...AIR, effect: CTR.fans, eamt: 1, score: 50, touch: 'fan.on0' });
    for (let f = 0; f < 3; f++) book.add(`fan.on${f}`, fan(true, f), { ...AIR, ntime: 2, next: `fan.on${(f + 1) % 3}` });
    // the ledges' metal brackets come from the base set; the floor's top
    book.add('chest', k.pic('casting.top'), { solid: SOLID });
    // the flap at the end: shut until every fan plays
    countedDoor(k, 'flap', 'vent', CTR.fans, v.fans.length, (p: Pixels) => {
      p.disc(10, 10, 4, c('accent', 3)).rect(9, 6, 2, 8, c('mach', 0));
    });
    return k;
  };
}

export function fan(v: FanVerse) {
  return (book: Kit['book']): Level => {
    const { w } = v;
    const R = FAN_ROW;
    const m = new MapBuilder(book, { '.': 'vent', '=': 'casting.top', '#': 'casting', l: 'ledge' }, 'casting');
    m.fill(0, 0, w, R.floor, '.').fill(0, R.floor, w, 1, '=').fill(0, R.ceiling, w, 1, '#');
    for (const col of v.columns) {
      for (let y = R.cap + 1; y < R.floor; y++) m.set(col.x, y, col.phase ? 'air.rest' : 'air.up');
      m.set(col.x, R.cap, 'cap');
    }
    for (const [a, b] of v.ledges) m.fill(a, R.ledge, b - a + 1, 1, 'l');
    for (const [x, y] of v.fans) m.set(x, y, 'fan');
    for (const x of v.chests) m.set(x, R.floor - 1, 'chest');
    m.set(v.exit, R.floor - 2, 'flap.top').set(v.exit, R.floor - 1, 'flap');
    m.fill(w - 1, 0, 1, R.floor, '#');
    m.link(v.exit + 1, R.floor - 1);
    m.mon(MON.reggie, 1, R.floor - 1);
    return { m, start: at(8, 5), size: [w, 10] };
  };
}
