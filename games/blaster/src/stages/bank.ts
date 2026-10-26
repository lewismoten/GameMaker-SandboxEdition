// Stage 2-D, "The Memory Bank": Memory Lane's side leg. Side-on through the gap between two
// SIMMs, one over the other: DRAM chips stand up from the lower board and hang from the upper
// one, the 6502's stack hangs down and fills toward the floor (slip under before it closes),
// refresh pulses shove the ship up or down, and Leak Slugs come hunting.
import { ramVirus } from '../blocks/ram';
import { BANK_STACK, bankArt, bankBlocks, bankRamps } from '../blocks/bank';
import { S_CURVE, ZIGZAG, diver, heavy, mine, stalker, swooper } from '../characters/enemies';
import { buildPalette } from '../art/pal';
import { MLEN } from '../../../../web/src/formats/map';
import { GATE, sideLeg, sideMites, type Side } from './sideLeg';
import type { Leg } from './stage';

const BEAT = 9;

/** A DRAM chip on the lower board (floor) or hanging from the upper one (ceil), at column c. */
function chip(s: Side, c: number, on: 'floor' | 'ceil'): void {
  const r = on === 'floor' ? s.bottom(c) : s.top(c);
  s.put(c, r, `chip${on === 'floor' ? 'F' : 'C'}00`).put(c + 1, r, `chip${on === 'floor' ? 'F' : 'C'}01`);
}

/** The stack at column c, hanging from the ceiling (the terrain there leaves one row under it). */
function stack(s: Side, c: number): void {
  for (let k = 0; k < BANK_STACK; k++) s.put(c, s.top(c) + k, `stk${k}`);
  if (s.bottom(c) !== s.top(c) + BANK_STACK) throw new Error('The stack must leave one row free');
}

const conga = (s: Side, c: number, r: number, n: number, name: string) => {
  for (let i = 0; i < n; i++) s.mon(c + i, r, name);
};

export function bankLeg(): Leg {
  const pal = buildPalette('ram');
  bankRamps(pal);
  const art = bankArt(pal);
  // heights by stretch: open and roomy, narrowing for the stacks
  const ceil: number[] = [];
  const floor: number[] = [];
  for (let c = 0; c < MLEN; c++) {
    const tight = (c >= 33 && c <= 37) || (c >= 63 && c <= 67);
    const wave = c > 14 && c < GATE - 6 ? Math.round(Math.sin(c / 5) * 0.6 + 0.6) : 0;
    ceil.push(tight ? 2 : 1 + (wave === 1 && c % 2 ? 1 : 0));
    floor.push(tight ? 2 : 1 + (wave === 1 && c % 3 === 0 ? 1 : 0));
  }
  return sideLeg({
    file: 's2s',
    title: 'The Memory Bank',
    card: ['Between two memory sticks.', 'The stack hangs down and', 'fills toward the floor:', 'slip under before it shuts!'],
    seed: 232,
    pal,
    art,
    own: (bs) => bankBlocks(bs, art, BEAT),
    virus: (b) => {
      ramVirus(b, pal);
      sideMites(b, 'mite', 4);
      diver(b, 'bat', { score: 120, speed: 4, dive: 6 });
      swooper(b, 'eyeL', S_CURVE(-1, 5), { pic: 'eye', score: 120 });
      swooper(b, 'eyeR', S_CURVE(1, 5), { pic: 'eye', score: 120 });
      swooper(b, 'eyeZ', ZIGZAG(1, 4), { pic: 'eye', score: 120 });
      stalker(b, 'slug', { hp: 3, speed: 1, score: 300 });
      heavy(b, 'crawler', { hp: 4, score: 350, speed: 2 });
      mine(b, 'cluster', { hp: 2 });
    },
    opts: { turretEvery: 12, seekerEvery: 44, hatchShut: 44, hatchOpen: 30, hatchEvery: 9, fenceOn: 26, fenceOff: 26 },
    ceil,
    floor,
    build: (s) => {
      const mid = (c: number) => (s.top(c) + s.bottom(c)) >> 1;
      s.mon(22, 3, 'bat').mon(24, 6, 'bat');
      chip(s, 26, 'floor');
      chip(s, 29, 'ceil');
      for (const c of [27, 28]) s.pickup(c, mid(c), 'bit');
      stack(s, 35);
      s.pickup(39, mid(39), 'nova');
      s.draft(41, 43, 'U');
      conga(s, 45, 6, 4, 'eyeR');
      s.turret(50, 'ceil');
      chip(s, 52, 'floor');
      s.mon(55, 4, 'slug');
      s.hatch(58, 'floor');
      s.fence(60, 'A');
      stack(s, 65);
      s.pickup(69, mid(69), 'repair');
      s.mon(71, 4, 'crawler');
      s.draft(73, 75, 'D');
      chip(s, 76, 'ceil');
      conga(s, 77, 3, 3, 'eyeZ');
      s.turret(80, 'floor', 'seeker');
      s.mon(82, 6, 'cluster');
      for (const c of [83, 84]) s.pickup(c, mid(c), 'bit');
      s.scatter(
        [
          ['far', 2, 1, 'any'],
          ['lbl', 2, 1, 'any'],
        ],
        14,
      );
    },
    cardView: { c: 28, r: 2 },
  });
}
