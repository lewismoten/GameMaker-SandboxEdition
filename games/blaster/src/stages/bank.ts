// Stage 2-B, "The Memory Bank": Memory Lane's side leg. Side-on through the gap between two
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
import type { BlockSet } from '../art/draw';
import type { Bestiary } from '../characters/mons';
import { saveSignBlocks } from '../../../kit/saveSign';

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

/** What Memory Lane's side legs share: their palette, blocks and virus (so their block and monster numbers match). */
export function bankKit() {
  const pal = buildPalette('ram');
  bankRamps(pal);
  const art = bankArt(pal);
  return {
    pal,
    art,
    own: (bs: BlockSet) => {
      bankBlocks(bs, art, BEAT);
      // the save sign (kit/saveSign.ts), its board alone over the backdrop: nothing to stand it on
      const [l, r] = saveSignBlocks(pal.pal, { board: [art.floor(0), art.floor(0)] }).board;
      bs.add('saveL', l);
      bs.add('saveR', r);
    },
    virus: (b: Bestiary) => {
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
  };
}

const SCENERY: [string, number, number, 'floor' | 'ceil' | 'any'][] = [
  ['far', 2, 1, 'any'],
  ['lbl', 2, 1, 'any'],
];

/** The save sign's cell: on bare backdrop in sight of the launch rail. */
export const SAVE_SIGN = { c: 12, r: 2 };

export function bankLeg(): Leg {
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
    ...bankKit(),
    file: 's2s',
    title: 'The Memory Bank',
    card: ['Between two memory sticks.', 'The stack hangs down and', 'fills toward the floor:', 'slip under before it shuts!'],
    seed: 232,
    ceil,
    floor,
    build: (s) => {
      const mid = (c: number) => (s.top(c) + s.bottom(c)) >> 1;
      // the save sign, before the scenery so nothing lands on it
      s.put(SAVE_SIGN.c, SAVE_SIGN.r, 'saveL').put(SAVE_SIGN.c + 1, SAVE_SIGN.r, 'saveR');
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
      s.scatter(SCENERY, 14);
    },
    cardView: { c: 28, r: 2 },
  });
}

/**
 * Stage 2-D, "Stack Overflow", before it is flipped to fly left (stages/turned.ts): back
 * between the sticks, where three stacks hang down to slip under, one after another, refresh
 * pulses shove up and down between them, and crawlers and bats come at the ship.
 */
export function overflowBand(): Leg {
  const ceil: number[] = [];
  const floor: number[] = [];
  const tight = (c: number) => [28, 50, 72].some((k) => c >= k - 2 && c <= k + 2);
  for (let c = 0; c < MLEN; c++) {
    const wave = c > 14 && c < GATE - 6 ? Math.round(Math.cos(c / 4) * 0.6 + 0.6) : 0;
    ceil.push(tight(c) ? 2 : 1 + (wave === 1 && c % 3 === 0 ? 1 : 0));
    floor.push(tight(c) ? 2 : 1 + (wave === 1 && c % 2 ? 1 : 0));
  }
  return sideLeg({
    ...bankKit(),
    file: 's2l',
    title: 'Stack Overflow',
    card: [],
    seed: 242,
    ceil,
    floor,
    build: (s) => {
      const mid = (c: number) => (s.top(c) + s.bottom(c)) >> 1;
      s.mon(21, 6, 'bat').mon(23, 3, 'bat');
      chip(s, 24, 'ceil');
      s.pickup(25, mid(25) + 1, 'bit');
      stack(s, 28);
      s.draft(32, 33, 'D');
      conga(s, 34, 3, 3, 'eyeL');
      chip(s, 38, 'floor');
      s.pickup(40, mid(40), 'nova');
      s.hatch(43, 'ceil');
      s.mon(46, 4, 'crawler');
      stack(s, 50);
      s.draft(54, 55, 'U');
      s.turret(57, 'floor');
      for (const [c, r] of [
        [59, 3],
        [61, 6],
      ])
        s.mon(c, r, 'cluster');
      s.fence(63, 'B');
      s.pickup(66, mid(66), 'repair');
      conga(s, 67, 6, 3, 'eyeZ');
      stack(s, 72);
      chip(s, 76, 'floor');
      s.turret(78, 'ceil', 'seeker');
      s.mon(80, 3, 'bat').mon(81, 6, 'bat');
      for (const c of [83, 84]) s.pickup(c, mid(c), 'bit');
      s.scatter(SCENERY, 12);
    },
    cardView: { c: 22, r: 2 },
  });
}
