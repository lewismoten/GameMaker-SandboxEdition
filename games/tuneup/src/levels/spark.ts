// Level 2, Spark Plucks (the engine bay, lit blue-white). The spark plugs are harp strings:
// Doc Leo climbs each plug wire (nothing pulls there: Up climbs, Down climbs down) and plucks
// its plug at the top, which rings a note: C, E, G and E, the parade tune's opening. Sparks run
// up the wires in the engine's firing order, 1-3-4-2, on a timetable you can watch: wait for
// your wire's spark to pass, then climb. A spark doesn't hurt, it frizzes his hair (a little
// energy). Each plug's note is its own kind of change (sounds.ts): the first gives energy back,
// the second and fourth count a pluck, the third a tip, so two terminals stand between the
// halves and two at the end.
import { gradient } from '../../../snowbound/src/art/draw';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { CLIMB, countedDoor, kit, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import type { Pal } from '../art/palette';
import { CTR, MON, MONEY } from '../ids';
import { MapBuilder, at, type Level } from './maps';

/** Ticks of the firing order's slot, and the four slots of the cycle. */
export const SLOT = 10;
export const CYCLE = SLOT * 4;
/** The wires, left to right: column, the slot of the firing order it sparks in, ticks it sparks. */
export const WIRES = [
  { x: 5, slot: 0, on: SLOT },
  { x: 12, slot: 3, on: SLOT },
  { x: 21, slot: 1, on: 14 },
  { x: 28, slot: 2, on: 14 },
] as const;
/** The wire's sparking rows (the top row next to the ledge never sparks). */
export const WIRE_TOP = 2;
export const SPARK_ROWS = [3, 4, 5, 6, 7];
export const SPARK = {
  w: 38,
  floor: 8,
  gateA: 17,
  gateB: 33,
  gateC: 35,
  exit: 36,
} as const;
/** Energy a spark takes. */
const FRIZZ = -2;

export function sparkBlocks(pal: Pal): Kit {
  const k = kit(pal);
  baseSet(k, 'engine');
  const { book, c, R } = k;
  // a plug wire: a thick black cable, its highlight; sparking, blue-white crackle all along it
  const wire = (spark: number) => {
    const p = k.pic('bay');
    p.rect(8, 0, 4, 20, c('pipe', 1)).rect(9, 0, 1, 20, c('pipe', 4)).rect(11, 0, 1, 20, c('pipe', 0));
    if (spark) {
      for (let y = 0; y < 20; y += 4) {
        const dx = (y / 4 + spark) % 2 ? 3 : -3;
        p.line(10, y, 10 + dx, y + 2, c('lamp', 4)).line(10 + dx, y + 2, 10, y + 4, c('lamp', 3));
      }
      p.set(10 + (spark % 2 ? 4 : -4), 9, c('lamp', 4)).set(10 - (spark % 2 ? 5 : -5), 15, c('lamp', 2));
    }
    return p;
  };
  book.add('wire.top', wire(0), CLIMB);
  WIRES.forEach((w, i) => {
    const id = `w${i + 1}`;
    const off = CYCLE - w.on;
    // the ring: a lead-in to the wire's slot, then on (it frizzes) and off, round and round
    const pre = w.slot * SLOT;
    if (pre) book.add(`${id}.pre`, wire(0), { ...CLIMB, ntime: pre, next: `${id}.on` });
    book.add(`${id}.on`, wire(1 + i), { ...CLIMB, hp: FRIZZ, ntime: w.on, next: `${id}.off` });
    book.add(`${id}.off`, wire(0), { ...CLIMB, ntime: off, next: `${id}.on` });
  });
  // the plugs: a white insulator on a hex, the boot on top; plucked, it rings and glows
  const plug = (lit: boolean) => {
    const p = k.pic('bay');
    p.rect(8, 14, 4, 6, c('pipe', 1));
    p.rect(5, 10, 10, 4, c('mach', 4)).frame(5, 10, 10, 4, c('mach', 1));
    gradient(p, 7, 2, 6, 8, R('accent'), 1, 4);
    p.rect(6, 0, 8, 3, c('pipe', 2));
    if (lit) {
      for (const [x, y] of [
        [3, 4],
        [16, 4],
        [2, 8],
        [17, 8],
      ])
        p.set(x, y, c('lamp', 4));
      p.rect(9, 3, 2, 6, c('lamp', 4));
    }
    return p;
  };
  // the notes each plug rings: its kind of change (energy up, a pluck, a tip, a pluck)
  const ring = [
    { hp: 1, effect: CTR.plucked, eamt: 1 },
    { effect: CTR.plucked, eamt: 1 },
    { effect: MONEY, eamt: 1 },
    { effect: CTR.plucked, eamt: 1 },
  ];
  ring.forEach((r, i) => book.add(`plug${i + 1}`, plug(false), { ...CLIMB, ...r, score: 50, touch: 'plug.lit' }));
  book.add('plug.lit', plug(true), CLIMB);
  // the terminals: two plucks, a tip, a pluck
  const bolt = (p: Pixels) => p.disc(10, 9, 3, c('lamp', 3)).disc(10, 9, 1.4, c('mach', 0));
  countedDoor(k, 'gate.a', 'bay', CTR.plucked, 2, bolt);
  countedDoor(k, 'gate.b', 'bay', MONEY, 1, bolt);
  countedDoor(k, 'gate.c', 'bay', CTR.plucked, 1, bolt);
  return k;
}

const LEGEND: Record<string, string> = {
  '.': 'bay',
  r: 'bay.ribs',
  o: 'bay.bolts',
  '-': 'bay.pipe',
  '#': 'casting',
  '=': 'casting.top',
  _: 'ledge',
};

export function spark(book: Kit['book']): Level {
  const { w, floor } = SPARK;
  const m = new MapBuilder(book, LEGEND, 'casting');
  m.fill(0, 0, w, floor, '.')
    .fill(0, floor, w, 1, '=')
    .fill(0, floor + 1, w, 1, '#');
  for (let x = 0; x < w; x += 4) m.set(x, 5, 'r');
  m.fill(0, 0, w, 1, '-');
  for (const x of [2, 9, 16, 25, 34]) m.set(x, 3, 'o');
  m.fill(0, 0, 1, floor, '#').fill(w - 1, 0, 1, floor, '#');
  WIRES.forEach((wr, i) => {
    const id = `w${i + 1}`;
    m.set(wr.x, 1, `plug${i + 1}`).set(wr.x, WIRE_TOP, 'wire.top');
    for (const y of SPARK_ROWS) m.set(wr.x, y, wr.slot ? `${id}.pre` : `${id}.on`);
    // the ledge off the top to the right, to walk off and down
    m.fill(wr.x + 1, WIRE_TOP + 1, 3, 1, '_');
  });
  // a casting to hop on the way to the second half
  m.set(9, 7, '#').set(24, 7, '#').set(25, 7, '#').set(25, 6, '#');
  m.set(SPARK.gateA, 6, 'gate.a.top').set(SPARK.gateA, 7, 'gate.a');
  m.set(SPARK.gateB, 6, 'gate.b.top').set(SPARK.gateB, 7, 'gate.b');
  m.set(SPARK.gateC, 6, 'gate.c.top').set(SPARK.gateC, 7, 'gate.c');
  m.link(SPARK.exit, 7);
  // Sir Reginald on the last ledge, at work on the fourth plug's boot
  m.mon(MON.dreamBird, WIRES[3].x + 3, WIRE_TOP);
  // he starts in mid air at (8, 5), so the view (centered on where he starts, and never scrolling
  // up or down) shows the bay from its left wall; he drops to the floor
  // variants here and there so the walls and floors don't repeat
  m.vary('bay', ['bay.bolts'], 11).vary('casting', ['casting.plate'], 7);
  return { m, start: at(8, 5), size: [w, 10] };
}
