// Stage 4-B, "Between Platters": the hard disk's side leg. Side-on through the thin gap
// between two spinning platters: the air they drag round streaks past, read/write arms seek in
// across the gap and out again (pass when they pull back), Skulls loop, Tanks plow through and
// the spin's drafts shove the ship up and down.
import { MLEN } from '../../../../web/src/formats/map';
import { diskVirus } from '../blocks/disk4';
import { plattersArt, plattersBlocks } from '../blocks/platters';
import { SPIN, S_CURVE, diver, heavy, mine, stalker, swooper } from '../characters/enemies';
import { buildPalette } from '../art/pal';
import { GATE, ROWS, sideLeg, sideMites, type Side } from './sideLeg';
import type { Leg } from './stage';
import type { BlockSet } from '../art/draw';
import type { Bestiary } from '../characters/mons';

const ARM_ON = 28;
const ARM_OFF = 26;

/** A read/write arm across band row r from column c (its head) for n columns. */
function arm(s: Side, c: number, r: number, n: number): void {
  s.put(c, r, 'armH');
  for (let k = 1; k < n; k++) s.put(c + k, r, 'armB');
}

const conga = (s: Side, c: number, r: number, n: number, name: string) => {
  for (let i = 0; i < n; i++) s.mon(c + i, r, name);
};

/** What the hard disk's side legs share: their palette, blocks and virus (so their block and monster numbers match). */
export function plattersKit() {
  const pal = buildPalette('disk');
  const art = plattersArt(pal);
  return {
    pal,
    art,
    own: (bs: BlockSet) => plattersBlocks(bs, art, ARM_ON, ARM_OFF),
    virus: (b: Bestiary) => {
      diskVirus(b, pal);
      sideMites(b, 'mite', 5);
      diver(b, 'skull', { score: 160, speed: 5, dive: 8 });
      swooper(b, 'skullL', S_CURVE(-1, 6), { pic: 'skull', score: 160 });
      swooper(b, 'skullO', SPIN(5), { pic: 'skull', score: 170 });
      stalker(b, 'slug', { hp: 4, speed: 1, score: 400 });
      heavy(b, 'tank', { hp: 6, score: 600, speed: 1 });
      mine(b, 'disc', { hp: 3, score: 150 });
    },
    opts: { turretEvery: 10, seekerEvery: 36, hatchShut: 36, hatchOpen: 28, hatchEvery: 8, fenceOn: 24, fenceOff: 22 },
  };
}

/** The air streaks over every bare cell of the row under the upper platter and the row over the lower. */
function streaks(s: Side): void {
  for (let c = 10; c < GATE; c++) for (const r of [s.top(c), s.bottom(c)]) if (s.at(c, r).startsWith('floor') && r >= 0 && r < ROWS) s.put(c, r, 'air0');
}

export function plattersLeg(): Leg {
  // two platters a fixed gap apart, the gap a row narrower where the heads ride
  const ceil: number[] = [];
  const floor: number[] = [];
  for (let c = 0; c < MLEN; c++) {
    const narrow = c > 14 && c < GATE - 6 && Math.floor(c / 9) % 3 === 1;
    ceil.push(narrow ? 2 : 1);
    floor.push(1);
  }
  return sideLeg({
    ...plattersKit(),
    file: 's4s',
    title: 'Between Platters',
    card: ['The gap between two platters', 'spinning at 3600 RPM. The', 'arms seek in and out:', 'cross when they pull back!'],
    seed: 432,
    ceil,
    floor,
    build: (s) => {
      const mid = (c: number) => (s.top(c) + s.bottom(c)) >> 1;
      s.mon(22, 3, 'skull').mon(25, 6, 'skull');
      for (const c of [24, 25]) s.pickup(c, mid(c), 'bit');
      arm(s, 30, 4, 4);
      conga(s, 37, mid(37), 3, 'skullO');
      s.turret(42, 'floor');
      s.pickup(44, mid(44), 'nova');
      arm(s, 47, 3, 3);
      arm(s, 49, 6, 3);
      s.mon(54, mid(54), 'tank');
      s.draft(57, 58, 'D');
      s.hatch(60, 'ceil');
      s.mon(62, 3, 'disc').mon(63, 6, 'disc');
      s.pickup(65, mid(65), 'repair');
      s.mon(67, 5, 'slug');
      arm(s, 70, 5, 4);
      s.turret(75, 'ceil', 'seeker');
      conga(s, 77, 3, 3, 'skullL');
      s.fence(81, 'A');
      for (const c of [83, 84]) s.pickup(c, mid(c), 'bit');
      s.scatter([['hub', 2, 2, 'any']], 5);
      streaks(s);
    },
    cardView: { c: 26, r: 2 },
  });
}

/**
 * Stage 4-D, "The Spindle", before it is flipped to fly left (stages/turned.ts): back between
 * the platters toward the spindle, where the gap pinches in and out, the arms seek in from both
 * platters at once (cross between them when they pull back), Skulls loop and Tanks plow in.
 */
export function spindleBand(): Leg {
  const ceil: number[] = [];
  const floor: number[] = [];
  for (let c = 0; c < MLEN; c++) {
    const pinch = c > 14 && c < GATE - 6 && Math.floor(c / 7) % 3 === 2;
    ceil.push(pinch ? 2 : 1);
    floor.push(pinch && c % 2 ? 2 : 1);
  }
  return sideLeg({
    ...plattersKit(),
    file: 's4l',
    title: 'The Spindle',
    card: [],
    seed: 442,
    ceil,
    floor,
    build: (s) => {
      const mid = (c: number) => (s.top(c) + s.bottom(c)) >> 1;
      conga(s, 21, mid(21), 3, 'skullO');
      for (const c of [25, 26]) s.pickup(c, mid(c), 'bit');
      arm(s, 29, 3, 3);
      arm(s, 30, 6, 3);
      s.mon(35, 3, 'disc').mon(36, 6, 'disc');
      s.turret(39, 'ceil');
      s.pickup(41, mid(41), 'nova');
      s.mon(44, mid(44), 'tank');
      s.draft(47, 48, 'U');
      arm(s, 50, 4, 4);
      s.mon(55, 3, 'skull').mon(56, 6, 'skull');
      s.hatch(58, 'floor');
      s.pickup(61, mid(61), 'repair');
      conga(s, 63, 3, 3, 'skullL');
      arm(s, 67, 3, 3);
      arm(s, 69, 6, 3);
      s.turret(73, 'floor', 'seeker');
      s.draft(75, 76, 'D');
      s.mon(78, mid(78), 'tank');
      s.fence(81, 'B');
      for (const c of [83, 84]) s.pickup(c, mid(c), 'bit');
      s.scatter([['hub', 2, 2, 'any']], 5);
      streaks(s);
    },
    cardView: { c: 26, r: 2 },
  });
}
