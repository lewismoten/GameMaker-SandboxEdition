// The monsters every level shares, at the same numbers in every .MON: the sequel's (what
// Teddy's and Gwinn's tricks send out, treats, bones, tickets, buried things), and the
// finale's two new heroes' (THE CHEZ's honk, Doc Leo's squawk and his balloon dog).
import { commonMonsters as sequel } from '../../../teddy2/src/characters/sharedMonsters';
import { MON, POWER } from '../ids';
import type { Bestiary } from './mons';
import { FX3 } from '../sprites/fx3';

export function commonMonsters(b: Bestiary): void {
  sequel(b);
  for (const [name, px] of Object.entries(FX3)) b.pic(name, px, name.startsWith('balloon') ? { solid: 15 } : {});
  // THE CHEZ's honk rolls ahead down the road like a bark.
  b.add(
    'honk',
    {
      pics: [
        ['honk1', 2],
        ['honk2', 2],
      ],
      power: POWER.honk,
      towards: 9,
      end: 10,
      thru: true,
    },
    MON.honk,
  );
  // The rubber chicken's squawk, the same along the ground ahead of Doc Leo.
  b.add(
    'squawk',
    {
      pics: [
        ['squawk1', 3],
        ['squawk2', 3],
      ],
      power: POWER.squawk,
      towards: 8,
      end: 10,
      thru: true,
    },
    MON.squawk,
  );
  // The balloon dog: born in the ground under Doc Leo's shoes, it rises six blocks (lifting
  // him, as it is solid), bobs a moment at the top (time to step off), and pops.
  b.add(
    'balloon',
    {
      pics: [
        ['balloon1', 4],
        ['balloon2', 4],
      ],
      power: POWER.ride,
      path: [
        [0, -6, 2],
        [0, -6, 1],
        [0, -5, 1],
        [0, -6, 1],
      ],
      end: -1,
      becomes: 'balloonPop',
    },
    MON.balloon,
  );
  b.add(
    'balloonPop',
    {
      pics: [
        ['pop1', 3],
        ['pop2', 3],
      ],
      power: 0,
      end: 6,
    },
    MON.balloonPop,
  );
}
