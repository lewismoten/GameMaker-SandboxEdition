// Stage 1-B, "Expansion Slots": the motherboard's side leg. Out from under the chipset and
// along the board edge-on, under the drive cage, past expansion cards standing in their slots,
// tall capacitors and the IDE cable hanging down, to the BIOS chip's corner. It teaches side
// scrolling gently: Up and Down climb and dive, Right speeds ahead, Left brakes, and the
// virus comes from the right.
import { boardVirus } from '../blocks/board';
import { slotsArt, slotsBlocks, slotsRamps } from '../blocks/slots';
import { S_CURVE, ZIGZAG, diver, heavy, mine, swooper } from '../characters/enemies';
import { buildPalette } from '../art/pal';
import { rng } from '../../../kit/pixels';
import { sideLeg, sideMites, wander, type Side } from './sideLeg';
import type { Leg } from './stage';
import type { BlockSet } from '../art/draw';
import type { Bestiary } from '../characters/mons';

/** An expansion card standing h rows tall on the floor at column c. */
function card(s: Side, c: number, h: number): void {
  const b = s.bottom(c);
  s.put(c, b, 'cardB');
  for (let k = 1; k < h - 1; k++) s.put(c, b - k, `cardM${k & 1}`);
  s.put(c, b - h + 1, 'cardT');
}

/** The IDE cable hanging h rows down from the drive cage at column c. */
function cable(s: Side, c: number, h: number): void {
  const t = s.top(c);
  for (let k = 0; k < h - 1; k++) s.put(c, t + k, 'ribM');
  s.put(c, t + h - 1, 'ribE');
}

/** n virus side by side in band row r from column c: they wake one after another. */
function conga(s: Side, c: number, r: number, n: number, name: string): void {
  for (let i = 0; i < n; i++) s.mon(c + i, r, name);
}

/** What the motherboard's side legs share: their palette, blocks and virus (so their block and monster numbers match). */
export function slotsKit() {
  const pal = buildPalette('board');
  slotsRamps(pal);
  const art = slotsArt(pal);
  return {
    pal,
    art,
    own: (bs: BlockSet) => slotsBlocks(bs, art),
    virus: (b: Bestiary) => {
      boardVirus(b, pal);
      sideMites(b, 'mite');
      diver(b, 'biter', { score: 100 });
      swooper(b, 'mothL', S_CURVE(-1), { pic: 'moth' });
      swooper(b, 'mothR', S_CURVE(1), { pic: 'moth' });
      swooper(b, 'mothZ', ZIGZAG(1), { pic: 'moth' });
      heavy(b, 'bomb', { hp: 4, score: 400 });
      heavy(b, 'clawL', { score: 100 });
      heavy(b, 'clawR', { score: 100 });
      mine(b, 'cluster');
    },
    opts: { turretEvery: 14, seekerEvery: 50, hatchShut: 50, hatchOpen: 30, hatchEvery: 10, fenceOn: 30, fenceOff: 30 },
  };
}

/** Scenery: tall capacitors on the board, far cards and vents in the dark behind. */
const SCENERY: [string, number, number, 'floor' | 'ceil' | 'any'][] = [
  ['cap', 1, 2, 'floor'],
  ['far', 1, 4, 'any'],
  ['vent', 2, 1, 'any'],
];

export function slotsLeg(): Leg {
  const r = rng(131);
  const ceil = wander(r, 1, 2, 16, 4);
  const floor = wander(r, 1, 2, 16, 5);
  return sideLeg({
    ...slotsKit(),
    file: 's1s',
    title: 'Expansion Slots',
    card: ['Side-on now: UP and DOWN', 'climb and dive, RIGHT is', 'faster, LEFT brakes.', 'Duck under the cards!'],
    seed: 132,
    ceil,
    floor,
    build: (s) => {
      const mid = (c: number) => (s.top(c) + s.bottom(c)) >> 1;
      s.mon(22, 3, 'biter').mon(25, 6, 'biter');
      for (const c of [24, 25, 26]) s.pickup(c, mid(c), 'bit');
      card(s, 30, 4);
      conga(s, 34, 3, 4, 'mothR');
      cable(s, 40, 3);
      s.turret(43, 'floor');
      card(s, 46, 3);
      s.pickup(47, mid(47) - 1, 'nova');
      s.fence(51, 'A');
      s.mon(54, 2, 'biter').mon(55, 7, 'biter');
      s.hatch(57, 'floor');
      card(s, 60, 4);
      cable(s, 64, 4);
      for (const [c, rr] of [
        [66, 3],
        [68, 6],
        [69, 2],
      ])
        s.mon(c, rr, 'cluster');
      s.mon(72, 3, 'clawL').mon(72, 4, 'bomb').mon(72, 5, 'clawR');
      s.pickup(70, s.bottom(70), 'repair');
      s.turret(75, 'ceil');
      conga(s, 77, 6, 3, 'mothL');
      s.fence(81, 'B');
      for (const c of [83, 84]) s.pickup(c, mid(c), 'bit');
      s.scatter(SCENERY, 16);
    },
    cardView: { c: 26, r: 2 },
  });
}

/**
 * Stage 1-D, "The Drive Cage", before it is flipped to fly left (stages/turned.ts): back along
 * the board's edge under the drive cage, the IDE cable hanging lower and lower, expansion cards
 * in pairs to thread between, a turret under the cage and one on the board, and the bomb with
 * its claws waiting by the last cable.
 */
export function driveCageBand(): Leg {
  const r = rng(141);
  const ceil = wander(r, 1, 2, 16, 4);
  const floor = wander(r, 1, 2, 16, 6);
  return sideLeg({
    ...slotsKit(),
    file: 's1l',
    title: 'The Drive Cage',
    card: [],
    seed: 142,
    ceil,
    floor,
    build: (s) => {
      const mid = (c: number) => (s.top(c) + s.bottom(c)) >> 1;
      s.mon(22, mid(22), 'biter');
      for (const c of [23, 24, 25]) s.pickup(c, mid(c) + 1, 'bit');
      cable(s, 28, 2);
      conga(s, 31, mid(31), 3, 'mothZ');
      card(s, 36, 3);
      cable(s, 37, 2);
      s.pickup(40, mid(40), 'nova');
      s.turret(43, 'ceil');
      s.mon(46, s.bottom(46) - 1, 'biter').mon(47, s.top(47) + 1, 'biter');
      s.fence(50, 'B');
      card(s, 53, 4);
      s.hatch(56, 'ceil');
      cable(s, 59, 3);
      for (const [c, rr] of [
        [61, 2],
        [63, 6],
        [65, 4],
      ])
        s.mon(c, rr, 'cluster');
      s.pickup(64, mid(64), 'repair');
      card(s, 68, 3);
      s.turret(70, 'floor');
      conga(s, 72, s.top(72) + 1, 3, 'mothR');
      cable(s, 76, 4);
      s.mon(78, 4, 'clawL').mon(78, 5, 'bomb').mon(78, 6, 'clawR');
      s.fence(82, 'A');
      for (const c of [84, 85]) s.pickup(c, mid(c), 'bit');
      s.scatter(SCENERY, 14);
    },
    cardView: { c: 34, r: 0 },
  });
}
