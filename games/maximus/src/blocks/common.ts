// What every Maximus block set shares: R(role) looks up a color ramp by role name in the
// scene half of the palette (so one set of blocks fits any planet's palette), and
// PICKUP_FX says what each pickup block does to the courier's counters when touched.
import { MONEY, SEQ } from '../ids';
import type { PickupId } from './items';
import { roleIndex } from '../art/palette';
import { ROLES } from '../art/roles';

export const RI = roleIndex(ROLES);
export const R = (name: string) => {
  const r = RI.get(name);
  if (!r) throw new Error(`no role ${name}`);
  return r;
};

/**
 * Pickup effects, shared by every planet set. Weapons are ammunition the Game-Maker way:
 * counters 5 and up belong to the character sequence with the same number, a sequence runs
 * only while its counter is above zero and each run uses one up, so a pickup that adds to
 * counter SEQ.plasma is a clip of plasma shots. (Counter 1 is lives, MONEY is money.)
 */
export const PICKUP_FX: Record<PickupId, { effect?: number; eamt?: number; scorePts?: number; chHitPt?: number }> = {
  credit: { effect: MONEY, eamt: 5, scorePts: 10 },
  gem: { scorePts: 250 },
  heart: { chHitPt: 25 },
  oneup: { effect: 1, eamt: 1, scorePts: 100 },
  plasma: { effect: SEQ.plasma, eamt: 10 },
  nova: { effect: SEQ.nova, eamt: 2 },
  shield: { effect: SEQ.shield, eamt: 2 },
  mines: { effect: SEQ.mine, eamt: 4 },
  medkit: { effect: SEQ.medkit, eamt: 1 },
  flak: { effect: SEQ.flak, eamt: 8 },
};
