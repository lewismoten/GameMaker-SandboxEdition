// The four data bus rides, one before each of stages 2 to 5: where the bus goes, how long the
// ride is, and its timetable (what comes over the horizon in which lane, tick by tick, from
// the moment the scene starts, 18.2 ticks a second). Every block's clock starts with the
// scene, so the timetable is exact: busBlocks.ts turns each lane's entries into a chain of
// spawner blocks (kit/road3d.ts), and a lost ship plays the ride again from the top.
//
// The sign counts the bus cycles left down to 1, a cycle every CYCLE ticks, then flashes 0,
// when the way into the chip opens over the middle lane. A hazard born at tick T is on the
// ship's row from about T + 22 to T + 36, so a lane it is in is no place to be then.
import type { RoadEntry } from '../../../kit/road3d';

/** Hazards: an interrupt, a stray bit, and the next stage's own virus. Prizes: good data, a repair. */
export type Kind = 'irq' | 'bits' | 'foe' | 'byte' | 'fix';
export const KINDS: readonly Kind[] = ['irq', 'bits', 'foe', 'byte', 'fix'];
export const HAZARD = (k: Kind) => k === 'irq' || k === 'bits' || k === 'foe';

/** Ticks per bus cycle on the sign. */
export const CYCLE = 100;

export interface Ride {
  /** The stage the bus leads to. */
  n: number;
  /** File name base: bus2 ... bus5. */
  file: string;
  title: string;
  /** The destination, on the sign and the card. */
  dest: string;
  /** The cycles on the sign at the start (the ride takes cycles x CYCLE ticks). */
  cycles: number;
  waves: RoadEntry<Kind>[];
  card: string[];
}

/** When the way out opens (the sign reads 0). */
export const openAt = (r: Ride) => r.cycles * CYCLE;

/** The first beat's tick: the scene has just started. */
const FIRST = 24;

/** A timetable: a beat every `spacing` ticks, each 'left middle right' of kinds, '.' for nothing. */
function every(spacing: number, rows: string[]): RoadEntry<Kind>[] {
  const out: RoadEntry<Kind>[] = [];
  for (const [i, row] of rows.entries()) {
    const tick = FIRST + i * spacing;
    const lanes = row.split(' ');
    if (lanes.length !== 3) throw new Error(`bus beat ${tick}: "${row}" is not three lanes`);
    lanes.forEach((k, lane) => {
      if (k === '.') return;
      if (!KINDS.includes(k as Kind)) throw new Error(`bus beat ${tick}: no kind ${k}`);
      out.push([tick, lane, k as Kind]);
    });
  }
  return out;
}

export const RIDES: Ride[] = [
  {
    n: 2,
    file: 'bus2',
    title: 'The Memory Bus',
    dest: 'MEMORY',
    cycles: 6,
    // one hazard at a time for a while, then two
    waves: every(44, [
      '. byte .',
      'irq . .',
      '. . irq',
      '. irq byte',
      'foe . .',
      '. foe .',
      'irq . foe',
      'byte irq .',
      '. . foe',
      'foe irq fix',
      '. . irq',
      'irq . .',
    ]),
    card: ['Ride the bus to memory.', 'LEFT and RIGHT change lanes.', 'Dodge interrupts and bats,', 'grab good bytes. No guns!'],
  },
  {
    n: 3,
    file: 'bus3',
    title: 'The ISA Bus',
    dest: 'SOUND',
    cycles: 7,
    waves: every(40, [
      '. byte .',
      '. . byte',
      'irq . .',
      '. foe .',
      '. . bits',
      'foe irq .',
      '. bits byte',
      'bits . irq',
      '. foe .',
      'irq . foe',
      'byte irq bits',
      '. . foe',
      'foe irq .',
      '. bits .',
      'irq . .',
      '. . bits',
    ]),
    card: ['Out the expansion slot to', 'the sound card. Note-heads', 'and stray bits ride it too.', 'Keep to the open lane!'],
  },
  {
    n: 4,
    file: 'bus4',
    title: 'The IDE Bus',
    dest: 'DISK',
    cycles: 8,
    waves: every(38, [
      '. byte .',
      'byte . byte',
      'foe . .',
      '. . foe',
      'irq foe .',
      '. . bits',
      'bits . irq',
      '. irq foe',
      'foe . .',
      '. bits fix',
      'irq . irq',
      '. foe .',
      'foe bits .',
      '. . irq',
      'bits irq .',
      'byte . foe',
      'irq foe .',
      '. . bits',
      'foe . irq',
      'irq . .',
    ]),
    card: ['The IDE bus to the hard', 'disk. Skulls come two at a', 'time now: find the lane', 'they leave open.'],
  },
  {
    n: 5,
    file: 'bus5',
    title: 'The Local Bus',
    dest: 'CPU',
    cycles: 9,
    waves: every(35, [
      '. byte .',
      'irq . .',
      '. foe .',
      '. . irq',
      'foe irq .',
      '. . bits',
      'bits . foe',
      '. irq .',
      'irq . foe',
      '. foe bits',
      'fix . .',
      'foe irq .',
      '. . irq',
      'irq foe .',
      '. . foe',
      'bits . irq',
      '. foe .',
      'foe . bits',
      '. irq foe',
      'irq . .',
      '. foe irq',
      '. irq foe',
      'foe . .',
      'irq . .',
    ]),
    card: ['The fastest bus in the', 'box, straight to the CPU.', 'Opcodes and interrupts', 'every half a second!'],
  },
];
