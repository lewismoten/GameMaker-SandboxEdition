// Stage 4-D, "Between Platters": the hard disk's side leg. Side-on through the thin gap
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

export function plattersLeg(): Leg {
  const pal = buildPalette('disk');
  const art = plattersArt(pal);
  // two platters a fixed gap apart, the gap a row narrower where the heads ride
  const ceil: number[] = [];
  const floor: number[] = [];
  for (let c = 0; c < MLEN; c++) {
    const narrow = c > 14 && c < GATE - 6 && Math.floor(c / 9) % 3 === 1;
    ceil.push(narrow ? 2 : 1);
    floor.push(1);
  }
  return sideLeg({
    file: 's4s',
    title: 'Between Platters',
    card: ['The gap between two platters', 'spinning at 3600 RPM. The', 'arms seek in and out:', 'cross when they pull back!'],
    seed: 432,
    pal,
    art,
    own: (bs) => plattersBlocks(bs, art, ARM_ON, ARM_OFF),
    virus: (b) => {
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
      // the air streaks over every bare cell of the row under the upper platter and the row over the lower
      for (let c = 10; c < GATE; c++) for (const r of [s.top(c), s.bottom(c)]) if (s.at(c, r).startsWith('floor') && r >= 0 && r < ROWS) s.put(c, r, 'air0');
    },
    cardView: { c: 26, r: 2 },
  });
}
