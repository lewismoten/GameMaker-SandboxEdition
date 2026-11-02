// Level 12, Key Change (the motor's gears, under four palettes: blue, green, gold, red). The
// speedometer's gear whines, so Doc Leo shifts it up through four gear rooms, each a scene of its
// own whose phrase is a whole step higher than the last (the pop song's key change). In each room
// two towers of gear teeth come and go on the beat: the lower tooth is up for a beat and a half of
// every two, the upper one the same a beat later, so he hops onto the lower, waits for the upper to
// come round, and hops again (miss, and he only drops back to the floor). Over each tower's wall
// and by the door is a note of the room's phrase (do, mi, sol in its key). The speedometer on the
// wall climbs a quarter of its dial in each room, and the door out opens and shuts on a clock.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { AIR, kit, LEDGE, SOLID, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import type { Pal } from '../art/palette';
import { CTR, MONEY, MON } from '../ids';
import { MapBuilder, at, type Level } from './maps';

/** A beat of Key Change's song in ticks (keySong's tempo). */
export const KEY_BEAT = 16;
/** Ticks a tooth shows rising before it can be stood on. */
const RISE = 3;
/** The speedometer's steps in each room, and the ticks for each. */
const SPEEDO = { steps: 6, ticks: 80 } as const;
/** The door's clock in each room, a four-beat round: open two beats, then one and a half in third gear, one in top gear. */
const DOORS = [2, 2, 1.5, 1].map((open) => ({ shut: (4 - open) * KEY_BEAT, open: open * KEY_BEAT }));

export const GEARS = {
  w: 27,
  floor: 9,
  /** The towers: level x; the lower tooth's row and the upper's. */
  towers: [11, 17],
  low: 6,
  high: 3,
  /** The note pickups: over each tower's ledge, and by the door. */
  notes: [
    [12, 2],
    [18, 2],
    [22, 8],
  ] as [number, number][],
  door: 24,
  exit: 25,
} as const;
/** Each note's kind of change (its pitch: do, mi, sol). */
const NOTE_KINDS = [{ hp: 1 }, { effect: MONEY, eamt: 1 }, { effect: CTR.gears, eamt: 1 }] as const;

/** A tooth's ring: [frame, ticks, standable]. The lower tooth starts up; the upper is a beat behind. */
function toothRing(upper: boolean): { f: 'down' | 'rise' | 'up'; t: number }[] {
  const B = KEY_BEAT;
  const lower = [
    { f: 'up' as const, t: B + B / 2 },
    { f: 'down' as const, t: B / 2 - RISE },
    { f: 'rise' as const, t: RISE },
  ];
  // the upper tooth: up for its last half beat, down, rising, then up a beat
  return upper
    ? [
        { f: 'up', t: B / 2 },
        { f: 'down', t: B / 2 - RISE },
        { f: 'rise', t: RISE },
        { f: 'up', t: B },
      ]
    : lower;
}
/** The frames of a tooth's ring that have just come up (a person hops then). */
export const freshTooth = (upper: boolean) =>
  toothRing(upper).flatMap((r, i, all) => (r.f === 'up' && all[(i + all.length - 1) % all.length].f === 'rise' ? [i] : []));
export const toothName = (upper: boolean, f: number) => `${upper ? 'hi' : 'lo'}${f}`;

/** Room `room` (0-3): its blocks. */
export function keyBlocks(room: number) {
  return (pal: Pal): Kit => {
    const k = kit(pal);
    baseSet(k, 'engine');
    const { book, c } = k;
    const bay = () => k.pic('bay.ribs');
    // a gear tooth: up, a broad steel tooth to stand on; rising, its tip; down, the rim's slot
    /** A cog of radius `r` at (cx, cy): teeth round a wheel, a hub. */
    const cog = (p: Pixels, cx: number, cy: number, r: number, teeth: number, turn: number, ramp: 'pipe' | 'mach') => {
      for (let a = 0; a < teeth; a++) {
        const ang = turn + (a * Math.PI * 2) / teeth;
        p.disc(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, Math.max(1.5, r / 4), c(ramp, 2));
      }
      p.disc(cx, cy, r, c(ramp, 3))
        .disc(cx, cy, r - 2, c(ramp, 2))
        .disc(cx, cy, r / 3, c(ramp, 4))
        .disc(cx, cy, r / 6, c('shade', 0));
      return p;
    };
    // a gear tooth to stand on: up, a cog turned so a broad tooth sits flat on top; rising, a
    // smaller cog coming round; down, only the axle's collar
    const tooth = (f: 'down' | 'rise' | 'up') => {
      const p = bay();
      p.rect(8, 0, 4, 20, c('mach', 2)).rect(8, 0, 1, 20, c('mach', 4));
      if (f === 'down') return p.rect(5, 8, 10, 4, c('mach', 3)).rect(5, 8, 10, 1, c('mach', 5));
      if (f === 'rise') return cog(p, 10, 12, 5, 6, 0.3, 'pipe');
      cog(p, 10, 11, 7, 8, Math.PI / 8 - Math.PI / 2, 'pipe');
      return p.rect(3, 0, 14, 3, c('pipe', 3)).rect(3, 0, 14, 1, c('pipe', 4));
    };
    for (const upper of [false, true]) {
      const ring = toothRing(upper);
      ring.forEach((r, i) =>
        book.add(toothName(upper, i), tooth(r.f), {
          ...(r.f === 'up' ? { solid: LEDGE } : {}),
          ...AIR,
          ntime: r.t,
          next: toothName(upper, (i + 1) % ring.length),
        }),
      );
    }
    // a big gear behind it all, three blocks square
    const big = cog(new Pixels(60, 60, 0), 30, 30, 22, 14, 0, 'mach');
    for (let y = 0; y < 60; y++) for (let x = 0; x < 60; x++) if (big.get(x, y) === 0) big.set(x, y, bay().get(x % 20, y % 20));
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) book.add(`big${x}.${y}`, big.crop(x * 20, y * 20, 20, 20), AIR);
    // the towers' axles behind the teeth, and the walls the ledges lead over
    const axle = bay();
    axle.rect(8, 0, 4, 20, c('mach', 2)).rect(8, 0, 1, 20, c('mach', 4));
    book.add('axle', axle, AIR);
    // a note of the room's phrase: an eighth note, gold
    NOTE_KINDS.forEach((kind, i) => {
      const p = bay();
      p.disc(8, 14, 3.5, c('lamp', 3)).rect(11, 3, 2, 12, c('lamp', 3)).rect(11, 3, 5, 2, c('lamp', 4)).rect(14, 5, 2, 3, c('lamp', 4));
      p.set(7, 13, c('lamp', 4));
      book.add(`note${i}`, p, { ...AIR, ...kind, score: 50, touch: 'bay.ribs' });
    });
    // the speedometer: a dial two blocks square, its needle climbing a quarter of the way in this
    // room (a chain of blocks on a timer, all four of its blocks in step)
    const dial = (frac: number) => {
      const p = new Pixels(40, 40, 0);
      for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) p.blit(bay(), x * 20, y * 20);
      p.disc(20, 22, 17, c('mach', 0)).disc(20, 22, 15, c('paint', 3));
      for (let i = 0; i <= 8; i++) {
        const a = Math.PI * (1 - i / 8);
        const [x0, y0] = [20 + Math.cos(a) * 14, 22 - Math.sin(a) * 14];
        const [x1, y1] = [20 + Math.cos(a) * 11, 22 - Math.sin(a) * 11];
        p.line(Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1), i >= 7 ? c('red', 2) : c('ink', 0));
      }
      p.rect(5, 23, 30, 14, c('paint', 3)).rect(14, 28, 12, 5, c('ink', 1));
      const a = Math.PI * (1 - frac);
      p.line(20, 22, Math.round(20 + Math.cos(a) * 12), Math.round(22 - Math.sin(a) * 12), c('red', 2));
      p.line(21, 22, Math.round(21 + Math.cos(a) * 12), Math.round(22 - Math.sin(a) * 12), c('red', 1));
      p.disc(20, 22, 2, c('ink', 0));
      return p;
    };
    for (let s = 0; s <= SPEEDO.steps; s++) {
      const pic = dial((room + s / SPEEDO.steps) / 4);
      const more = s < SPEEDO.steps ? { ntime: SPEEDO.ticks } : {};
      for (let y = 0; y < 2; y++)
        for (let x = 0; x < 2; x++)
          book.add(`speedo${s}.${x}.${y}`, pic.crop(x * 20, y * 20, 20, 20), {
            ...AIR,
            ...more,
            ...(s < SPEEDO.steps ? { next: `speedo${s + 1}.${x}.${y}` } : {}),
          });
    }
    // the door out, on a clock: shut (solid), then open
    const door = (open: boolean) => {
      const p = bay();
      if (open) return p.rect(2, 0, 2, 20, c('mach', 3)).rect(16, 0, 2, 20, c('mach', 3));
      p.rect(2, 0, 16, 20, c('mach', 3)).frame(2, 0, 16, 20, c('mach', 0));
      p.disc(10, 10, 5, c('pipe', 2)).disc(10, 10, 2, c('mach', 0));
      return p;
    };
    const lamp = (open: boolean) => {
      const p = bay();
      p.rect(2, 6, 16, 14, c('mach', 3))
        .frame(2, 6, 16, 14, c('mach', 0))
        .disc(10, 12, 3, open ? c('green', 3) : c('red', 2));
      return p;
    };
    const DOOR = DOORS[room];
    book.add('door.shut', door(false), { solid: SOLID, ntime: DOOR.shut, next: 'door.open' });
    book.add('door.open', door(true), { ...AIR, ntime: DOOR.open, next: 'door.shut' });
    book.add('lamp.shut', lamp(false), { ...AIR, ntime: DOOR.shut, next: 'lamp.open' });
    book.add('lamp.open', lamp(true), { ...AIR, ntime: DOOR.open, next: 'lamp.shut' });
    return k;
  };
}

export function keyRoom(book: Kit['book']): Level {
  const { w, floor } = GEARS;
  const m = new MapBuilder(book, { '.': 'bay.ribs', '=': 'casting.top', '#': 'casting', l: 'ledge' }, 'casting');
  m.fill(0, 0, w, floor, '.').fill(0, floor, w, 1, '=').fill(0, 0, w, 1, '#');
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) m.set(2 + x, 2 + y, `speedo0.${x}.${y}`);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) m.set(2 + x, 5 + y, `big${x}.${y}`);
  for (const x of GEARS.towers) {
    m.fill(x, GEARS.high + 1, 1, GEARS.low - GEARS.high - 1, 'axle').fill(x, GEARS.low + 1, 1, floor - GEARS.low - 1, 'axle');
    m.set(x, GEARS.low, toothName(false, 0)).set(x, GEARS.high, toothName(true, 0));
    // the ledge off the top, then a wall it leads over
    m.fill(x + 1, GEARS.high, 2, 1, 'l').fill(x + 3, GEARS.high, 1, floor - GEARS.high, '#');
  }
  GEARS.notes.forEach(([x, y], i) => m.set(x, y, `note${i}`));
  m.set(GEARS.door, floor - 2, 'lamp.shut').set(GEARS.door, floor - 1, 'door.shut');
  m.fill(w - 1, 0, 1, floor, '#');
  m.link(GEARS.exit, floor - 1);
  m.mon(MON.regina, 5, floor - 1);
  // variants here and there so the walls and floors don't repeat
  m.vary('bay.ribs', ['bay.bolts'], 13).vary('casting', ['casting.plate'], 7);
  return { m, start: at(8, 5), size: [w, 10] };
}
