// The way through PASS THE PIE, as orders for the bot (kit/starter/bot.ts, routeKit.ts): the keys a person would
// press, level by level, with human timing, every acorn a person would see taken and every fight finished.
import type { StarterBot } from '../../kit/starter/bot';
import * as Y from '../src/levels/yard';
import { MONS } from '../src/monsters';
import { climb, cross, door, leap, meet, must, read, stepUp } from './routeKit';

/** Hit points the whole walkthrough may lose (a person is allowed a few bumps). */
export const BUMP_BUDGET = 60;

/** 1. Pumpkin Yard (Rory). */
export async function pumpkinYard(bot: StarterBot): Promise<void> {
  const G = Y.GROUND;
  await cross(bot, Y.AT.pie + 1, 'the pie');
  await read(bot, 13, 'oven');
  // the low oak: up the trunk to the low branch, its acorns, then the high branch and over to the porch roof
  await climb(bot, Y.AT.lowOak, G - 5, 'the low oak');
  await cross(bot, 23, 'the low branch');
  await cross(bot, 17, 'the low branch, back');
  await climb(bot, Y.AT.lowOak, G - 9, 'the trunk');
  await cross(bot, 18, 'the high branch, left');
  await cross(bot, 25, 'the high branch');
  await leap(bot, 'right', 30, 'onto the porch roof');
  await cross(bot, Y.AT.roof[1], 'along the roof');
  await cross(bot, Y.AT.roof[1] + 1, 'off the roof');
  await must(bot, bot.land(), 'down from the roof');
  await read(bot, 44, 'mower');
  // the mower: a roll as it comes, then up onto it and the branch over its stretch
  await meet(bot, [MONS.mower], G - 1, 'the mower', 110, 300);
  await must(bot, bot.wait(12), 'watching the mower stall');
  await stepUp(bot, [MONS.fedMower], 'right', 50, 'the mower');
  await cross(bot, Y.AT.stepBranch[1] + 1, 'the branch over the mower');
  // the big oak: up to its branches, the gold acorn at the top, then out over the hedge
  await climb(bot, Y.AT.bigOak, 7, 'the big oak');
  await climb(bot, Y.AT.bigOak, 3, 'the top of the big oak');
  await cross(bot, 64, 'the gold acorn');
  await cross(bot, 57, 'the top branch, left');
  await climb(bot, Y.AT.bigOak, 3, 'the trunk again');
  await must(bot, bot.climb('down', 7, 'down to the middle branch'), 'down the big oak');
  await cross(bot, 53, 'the middle branch, left');
  await cross(bot, 68, 'the branch over the hedge');
  await cross(bot, Y.AT.hedge[1], 'along the top of the hedge');
  await cross(bot, Y.AT.hedge[1] + 2, 'off the hedge');
  // the hedge's far side is only leaves: in, the stash, out
  await cross(bot, Y.AT.hedge[0] + 1, 'into the hedge');
  await cross(bot, 76, 'out of the hedge');
  await read(bot, 77, 'pie door');
  await door(bot, Y.AT.gate, Y.AT.exit, "Mrs. Pettigrew's gate");
}

export const LEVELS = [pumpkinYard];
