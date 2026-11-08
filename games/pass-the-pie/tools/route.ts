// The way through PASS THE PIE, as orders for the bot (kit/starter/bot.ts, routeKit.ts): the keys a person would
// press, level by level, with human timing, every acorn a person would see taken and every fight finished.
import type { StarterBot } from '../../kit/starter/bot';
import * as R from '../src/levels/gravy';
import * as L from '../src/levels/lawn';
import * as P from '../src/levels/park';
import * as Y from '../src/levels/yard';
import { MONS } from '../src/monsters';
import { climb, cross, door, leap, leave, meet, must, read, smash, stepUp, through } from './routeKit';

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

/** 2. Payback (Mr. Plume). */
export async function payback(bot: StarterBot): Promise<void> {
  const G = L.GROUND - 1;
  const turkey = [MONS.inflatable];
  const bag = [MONS.bag, MONS.bag + 1, MONS.bag + 2];
  await read(bot, 6, 'flyer');
  await read(bot, 10, 'combo');
  for (const x of L.AT.turkeys) await smash(bot, x, turkey, 1, `the lawn turkey at ${x}`, G);
  await smash(bot, L.AT.bag, bag, 1, 'the kick bag', G);
  // the shed roof: its drone, the spare key
  await climb(bot, L.AT.shedLadder, 9, 'the shed ladder');
  await cross(bot, L.AT.shedLadder + 1, 'onto the shed roof');
  await meet(bot, [MONS.drone], 9, 'the roof drone', 44);
  await cross(bot, L.AT.key + 1, 'the spare key');
  await cross(bot, L.AT.shedRoof[1] + 2, 'off the shed roof');
  await read(bot, 41, 'chat');
  // the swoop: wait for it to come down, then kick
  await cross(bot, L.AT.swoop - 2, 'before the swooping drone');
  await meet(bot, [MONS.droneSwoop], G, 'the swooping drone', 44, 200, 1200);
  for (const x of L.AT.wall) await smash(bot, x, turkey, 1, `the turkey wall at ${x}`, G);
  for (const x of [47, 50, 52]) {
    await cross(bot, x, 'under the acorns');
    await must(bot, bot.jump(), 'up for the acorns');
  }
  await smash(bot, L.AT.bag2, bag, 1, 'the second kick bag', G);
  await meet(bot, [MONS.vacLong], G, 'the vacuum', 50, 200);
  // the crates up to the garage roof, its drone, the gold acorn
  await cross(bot, L.AT.crates[0] - 1, 'the crates');
  await leap(bot, 'right', L.AT.crates[0], 'onto the first crate');
  await leap(bot, 'right', L.AT.crates[1], 'onto the second crate');
  await leap(bot, 'right', L.AT.garageRoof[0] + 1, 'onto the garage roof');
  await meet(bot, [MONS.drone], 12, 'the garage drone', 44);
  await cross(bot, L.AT.gold, 'the gold acorn');
  await cross(bot, L.AT.garageRoof[1] + 2, 'off the garage roof');
  await read(bot, 77, 'gate');
  await door(bot, L.AT.gate, L.AT.exit, 'the garden gate');
}

/** 3. Gravy Relay (Rory): against the bar. */
export async function gravyRelay(bot: StarterBot): Promise<void> {
  const G = R.GROUND - 1;
  await cross(bot, R.AT.gravy + 1, 'the gravy');
  await read(bot, 9, 'bar');
  // over the first vacuum on the counter, up to the cabinet, the cider, down
  await cross(bot, R.AT.counter[0] - 2, 'before the counter');
  await leap(bot, 'right', R.AT.counter[0] + 1, 'onto the counter');
  await cross(bot, R.AT.counter[1] - 2, 'along the counter');
  await leap(bot, 'right', R.AT.cabinet[0] + 3, 'up to the cabinet');
  await cross(bot, R.AT.cabinet[1] + 1, 'along the cabinet');
  await must(bot, bot.land(), 'down from the cabinet');
  await cross(bot, R.AT.gateA - 1, "Aunt Marjorie's door");
  await must(bot, bot.wait(10), "at Aunt Marjorie's door");
  await cross(bot, R.AT.gateA + 2, "through Aunt Marjorie's door");
  // the quick vacuum, fed, is the step up to the cranberry sauce
  await meet(bot, [MONS.vacQuick], G, 'the quick vacuum', 100, 300);
  await must(bot, bot.wait(10), 'watching it stall');
  await stepUp(bot, [MONS.fedVac], 'right', R.AT.highShelf[0] + 6, 'the stalled vacuum');
  await cross(bot, R.AT.highShelf[1] - 1, 'the cranberry sauce');
  await leap(bot, 'right', R.AT.counter2[0] + 2, 'over to the next counter');
  await cross(bot, R.AT.counter2[1] - 1, 'along the counter');
  await cross(bot, R.AT.gateB - 1, "Mr. Okafor's door");
  await must(bot, bot.wait(10), "at Mr. Okafor's door");
  await cross(bot, R.AT.gateB + 2, "through Mr. Okafor's door");
  // the mower fed from the doorway, the ledge, the top cabinet's gold acorn, the dining room
  await meet(bot, [MONS.mower], G, 'the mower', 110, 300);
  await leap(bot, 'right', R.AT.ledge[0] + 2, 'onto the ledge');
  await cross(bot, R.AT.ledge[1], 'along the ledge');
  await cross(bot, R.AT.ladder - 1, 'off the ledge');
  await climb(bot, R.AT.ladder, 7, 'the ladder to the top cabinet');
  await cross(bot, R.AT.gold, 'the gold acorn');
  await climb(bot, R.AT.ladder, 7, 'the ladder again');
  await must(bot, bot.climb('down', G, 'down the ladder'), 'down the ladder');
  bot.say(`bar left: ${(((R.SECONDS * 18.2 - bot.sim.ticks) / 18.2) | 0)} s`);
  await read(bot, 76, 'dinner');
  await leave(bot, bot.walk(R.AT.exit + 1, 'the exit'), 'the dining room');
}

/** Rises on a column of warm air at `x` until he stops going up, then steps `dir` to column `to`. */
async function ride(bot: StarterBot, x: number, to: number, what: string): Promise<void> {
  const RIGHT = 77;
  bot.sim.press(RIGHT);
  for (let t = 0; t < 200 && bot.px.x < x * 20; t++) await must(bot, bot.tick(), `into ${what}`);
  bot.sim.release(RIGHT);
  let top = bot.px.y;
  for (let t = 0; t < 160; t++) {
    await must(bot, bot.tick(), `riding ${what}`);
    if (bot.px.y < top) top = bot.px.y;
    else if (t > 30) break;
  }
  bot.say(`rode ${what} up to ${bot.px.y}`);
  await must(bot, bot.walk(to, `off ${what}`), `off ${what}`);
}

/** 4. Windy Park (Mr. Plume). */
export async function windyPark(bot: StarterBot): Promise<void> {
  const G = P.GROUND - 1;
  await read(bot, 6, 'crew');
  await cross(bot, P.AT.drone - 2, 'up to the drone');
  await meet(bot, [MONS.drone], G, 'the park drone', 44, 320);
  await read(bot, 17, 'tailwind');
  await smash(bot, P.AT.bag, [MONS.bag, MONS.bag + 1, MONS.bag + 2], 1, 'the kick bag', G);
  await cross(bot, P.AT.wind[0] - 1, 'up to the wind');
  await leap(bot, 'right', P.AT.pond[1] + 2, 'over the pond on the wind');
  for (const x of P.AT.turkeys) await smash(bot, x, [MONS.inflatable], 1, `the lawn turkey at ${x}`, G);
  await read(bot, 38, 'warm air');
  await ride(bot, P.AT.lift, P.AT.roof[0] + 1, 'the warm air');
  await smash(bot, P.AT.roofBag, [MONS.bag, MONS.bag + 1, MONS.bag + 2], 1, 'the bag on the roof', 3);
  await cross(bot, P.AT.roof[1] - 1, 'the casserole');
  await climb(bot, P.AT.ladder, 3, 'the bandstand ladder');
  await must(bot, bot.climb('down', G, 'down the ladder'), 'down the ladder');
  for (const x of P.AT.swoops) {
    await cross(bot, x - 2, 'before a swooping drone');
    await meet(bot, [MONS.droneSwoop], G, 'the swooping drone', 50, 120, 1200);
  }
  await cross(bot, 68, 'the cider');
  await through(bot, P.AT.gate, 'the crew tent');
  await cross(bot, P.AT.highDrone - 2, 'up to the tent drone');
  await meet(bot, [MONS.droneHigh], G, 'the tent drone', 70, 260);
  await ride(bot, P.AT.lift2, P.AT.gold, 'the second grate');
  await cross(bot, P.AT.ledge[1] + 1, 'off the ledge');
  await leave(bot, bot.walk(P.AT.exit + 1, 'the exit'), 'the exit');
}

export const LEVELS = [pumpkinYard, payback, gravyRelay, windyPark];
