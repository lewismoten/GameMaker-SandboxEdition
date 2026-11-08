// The way through PASS THE PIE, as orders for the bot (kit/starter/bot.ts, routeKit.ts): the keys a person would
// press, level by level, with human timing, every acorn a person would see taken and every fight finished.
import type { StarterBot } from '../../kit/starter/bot';
import * as C from '../src/levels/cord';
import * as D from '../src/levels/dojo';
import * as K from '../src/levels/dogs';
import * as B from '../src/levels/gobble';
import * as S from '../src/levels/chase';
import * as R from '../src/levels/gravy';
import * as L from '../src/levels/lawn';
import * as P from '../src/levels/park';
import * as O from '../src/levels/roof';
import * as Y from '../src/levels/yard';
import { BLOWER_HITS, MONS } from '../src/monsters';
import { climb, cross, door, enter, face, leap, leave, meet, monsters, must, read, smash, stepUp, through } from './routeKit';

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
  bot.say(`bar left: ${((R.SECONDS * 18.2 - bot.sim.ticks) / 18.2) | 0} s`);
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

/** Rooftop Potluck (Rory): the fire escape, the napping vacuum for the last step, the dish, the tailwind across the alley. */
export async function rooftopPotluck(bot: StarterBot): Promise<void> {
  const G = O.GROUND - 1;
  await read(bot, 7, 'elevator');
  await cross(bot, 14, 'under the first landing');
  await leap(bot, 'right', 15, 'onto the first landing');
  await read(bot, 15, 'chili');
  await cross(bot, 19, 'along the first landing');
  await leap(bot, 'right', 20, 'onto the second landing');
  await cross(bot, 21, 'along the second landing');
  await leap(bot, 'left', 20, 'onto the third landing');
  await cross(bot, O.AT.gold, 'the gold acorn');
  await cross(bot, 21, 'along the third landing');
  await leap(bot, 'right', 22, 'onto the fourth landing');
  await meet(bot, [MONS.vacQuick], 4, 'the roof vacuum', 100, 300);
  await must(bot, bot.wait(10), 'watching it stall');
  await stepUp(bot, [MONS.fedVac], 'right', 31, 'the stalled vacuum');
  await cross(bot, O.AT.dish + 1, 'the potluck dish');
  await cross(bot, O.AT.wind[0] - 1, 'the edge of the roof');
  await leap(bot, 'right', O.AT.roof2[0] + 3, 'across the alley on the tailwind');
  await read(bot, 55, 'potluck');
  await cross(bot, O.AT.roof2[1], 'along the second roof');
  await climb(bot, O.AT.ladder, 3, 'the ladder');
  await must(bot, bot.climb('down', G, 'down the ladder'), 'down the ladder');
  await door(bot, O.AT.gate, O.AT.exit, 'the gate');
}

/** Sensei's Dojo (Mr. Plume): kick a quick vacuum, stand on it, three tiers up; then the boards and the drones. */
export async function senseisDojo(bot: StarterBot): Promise<void> {
  const G = D.GROUND - 1;
  const bag = [MONS.bag, MONS.bag + 1, MONS.bag + 2];
  await read(bot, 6, 'dojo');
  await smash(bot, D.AT.warmBag, bag, 1, 'the warm-up bag', G);
  await read(bot, 14, 'nap');
  const tier = async (row: number, ledge: readonly number[], what: string, at: number) => {
    await cross(bot, at - 2, `up to ${what}`);
    await meet(bot, [MONS.vacQuick], row, what, 50, 200);
    await must(bot, bot.wait(10), `watching ${what} nap`);
    await stepUp(bot, [MONS.fedVac], 'right', ledge[0] + 6, what);
  };
  await tier(G, D.AT.ledgeA, 'the first vacuum', D.AT.vacA);
  await tier(G - 4, D.AT.ledgeB, 'the second vacuum', D.AT.vacB);
  await cross(bot, D.AT.gold, 'the gold acorn');
  await tier(G - 8, D.AT.ledgeC, 'the third vacuum', D.AT.vacC);
  await cross(bot, D.AT.ledgeC[1], 'along the roof');
  await climb(bot, D.AT.ladder, 4, 'the pagoda ladder');
  await must(bot, bot.climb('down', G, 'down the ladder'), 'down the ladder');
  await read(bot, 52, 'boards');
  for (const x of D.AT.bags) await smash(bot, x, bag, 1, `the board at ${x}`, G);
  await read(bot, 63, 'drones');
  for (const x of D.AT.swoops) {
    await cross(bot, x - 2, 'before a swooping drone');
    await meet(bot, [MONS.droneSwoop], G, 'the swooping drone', 50, 120, 1200);
  }
  await read(bot, D.AT.door - 6, 'door');
  bot.say(`bar left: ${((D.SECONDS * 18.2 - bot.sim.ticks) / 18.2) | 0} s`);
  await cross(bot, D.AT.door + 2, 'through the dojo door');
  await leave(bot, bot.walk(D.AT.exit + 1, 'the exit'), 'the exit');
}

/** 5. The Cord (Rory). */
export async function theCord(bot: StarterBot): Promise<void> {
  const G = C.GROUND - 1;
  await cross(bot, C.AT.rolls + 1, 'the rolls');
  await read(bot, 8, 'cord');
  await meet(bot, [MONS.vacLong], G, 'the curb vacuum', 100, 200);
  await cross(bot, C.AT.ladder - 1, 'past the stalled vacuum');
  await climb(bot, C.AT.ladder, 8, 'the bakery ladder');
  await cross(bot, C.AT.bakery[0] + 2, 'the bakery roof, left');
  await cross(bot, C.AT.bone, 'the bone');
  await cross(bot, C.AT.bakery[1] + 2, 'off the bakery roof');
  await read(bot, 31, 'Biscuit');
  await cross(bot, C.AT.dog - 1, 'Biscuit');
  await must(bot, bot.wait(20), 'giving Biscuit the bone');
  await cross(bot, C.AT.dog + 1, 'past Biscuit');
  await meet(bot, [MONS.vacQuick], G, 'the quick vacuum', 100, 300);
  await must(bot, bot.wait(10), 'watching it stall');
  await stepUp(bot, [MONS.fedVac], 'right', C.AT.awning[0] + 4, 'the stalled vacuum');
  await cross(bot, C.AT.awning[1] + 1, "along the florist's awning");
  await must(bot, bot.land(), 'down from the awning');
  await cross(bot, C.AT.mower - 3, 'up to the mower');
  await meet(bot, [MONS.mower], G, 'the mower', 110, 300);
  await cross(bot, C.AT.storeLadder - 1, 'over the stalled mower');
  await climb(bot, C.AT.storeLadder, 9, 'the hardware store ladder');
  await cross(bot, C.AT.store[0] + 1, 'onto the store roof');
  await meet(bot, [MONS.squirrel], 9, 'the squirrel', 100, 140);
  await cross(bot, C.AT.gold, 'the gold acorn');
  await cross(bot, C.AT.store[1] + 2, 'off the store roof');
  await through(bot, C.AT.gate, 'the town hall kitchen door');
  await read(bot, C.AT.plug + 2, 'plug');
  await leave(bot, bot.walk(C.AT.exit + 1, 'the exit'), 'the exit');
}

/** The Dog Park (Mr. Plume): three dogs, three bones, each stretch its own way to the bone. */
export async function dogPark(bot: StarterBot): Promise<void> {
  const G = K.GROUND - 1;
  const bag = [MONS.bag, MONS.bag + 1, MONS.bag + 2];
  await read(bot, 6, 'park');
  for (const x of K.AT.turkeys) await smash(bot, x, [MONS.inflatable], 1, `the lawn turkey at ${x}`, G);
  await smash(bot, K.AT.bag, bag, 1, 'the kick bag', G);
  await climb(bot, K.AT.oak, G - 5, 'the oak');
  await cross(bot, K.AT.bone1, 'the first bone');
  await climb(bot, K.AT.oak, G - 5, 'the trunk again');
  await must(bot, bot.climb('down', G, 'down the oak'), 'down the oak');
  await read(bot, K.AT.dog1 - 4, 'dog 1');
  await through(bot, K.AT.dog1, 'dog 1');
  await cross(bot, K.AT.vac - 2, 'up to the vacuum');
  await meet(bot, [MONS.vacQuick], G, 'the park vacuum', 50, 200);
  await must(bot, bot.wait(10), 'watching it nap');
  await stepUp(bot, [MONS.fedVac], 'right', K.AT.ledge[0] + 3, 'the napping vacuum');
  await cross(bot, K.AT.ledgeDrone - 2, 'up to the ledge drone');
  await meet(bot, [MONS.drone], G - 4, 'the ledge drone', 44, 320);
  await cross(bot, K.AT.bone2, 'the second bone');
  await cross(bot, K.AT.ledge[1] + 2, 'off the ledge');
  await must(bot, bot.land(), 'down from the ledge');
  await cross(bot, K.AT.swoop - 2, 'before the swooping drone');
  await meet(bot, [MONS.droneSwoop], G, 'the swooping drone', 50, 120, 1200);
  await read(bot, K.AT.dog2 - 4, 'dog 2');
  await through(bot, K.AT.dog2, 'dog 2');
  await climb(bot, K.AT.shedLadder, 9, 'the shed ladder');
  await cross(bot, K.AT.shedLadder + 1, 'onto the shed roof');
  await meet(bot, [MONS.drone], 9, 'the shed drone', 44, 320);
  await cross(bot, K.AT.gold, 'the gold acorn');
  await cross(bot, K.AT.bone3, 'the third bone');
  await cross(bot, K.AT.shed[1] + 1, 'off the shed roof');
  await must(bot, bot.land(), 'down from the shed');
  for (const x of K.AT.wall) await smash(bot, x, [MONS.inflatable], 1, `the turkey at ${x}`, G);
  await read(bot, K.AT.dog3 - 4, 'dog 3');
  await through(bot, K.AT.dog3, 'dog 3');
  await read(bot, K.AT.exit - 5, 'end');
  await leave(bot, bot.walk(K.AT.exit + 1, 'the exit'), 'the exit');
}

/** How far behind Mr. Plume the loose balloon is, in pixels. */
function lead(bot: StarterBot): number {
  const c = monsters(bot, [MONS.chaser + 1, MONS.chaser + 3]);
  return c.length ? bot.px.x - Math.max(...c.map((m) => m.x)) : Infinity;
}

/** 6. Main Street (Mr. Plume): the chase. */
export async function mainStreet(bot: StarterBot): Promise<void> {
  const G = S.GROUND - 1;
  const turkey = [MONS.inflatable];
  const bag = [MONS.bag, MONS.bag + 1, MONS.bag + 2];
  const note = (where: string) => bot.say(`${where}: lead ${lead(bot)} px`);
  await must(bot, bot.wait(18), 'a look back');
  await smash(bot, S.AT.turkeys[0], turkey, 1, 'the first turkey', G);
  note('first turkey');
  await cross(bot, S.AT.crates[0] - 1, 'the crates');
  await leap(bot, 'right', S.AT.crates[0], 'onto a crate');
  await leap(bot, 'right', 20, 'up the crates');
  await leap(bot, 'right', 23, 'off the crates');
  note('crates');
  await smash(bot, S.AT.bags[0], bag, 1, 'a kick bag', G);
  for (const x of [33, 34]) await smash(bot, x, turkey, 1, `the turkey at ${x}`, G);
  note('turkey wall');
  await cross(bot, S.AT.awning[0] - 2, 'before the awning');
  await leap(bot, 'right', S.AT.awning[0] + 1, 'onto the awning');
  await cross(bot, S.AT.awning[1] + 2, 'over the quick vacuum');
  note('awning');
  await smash(bot, S.AT.bags[1], bag, 1, 'a kick bag', G);
  await cross(bot, S.AT.stairs[0] - 1, 'the crate stairs');
  for (const x of S.AT.stairs) await leap(bot, 'right', x, 'up a crate');
  await leap(bot, 'right', 61, 'off the stairs');
  note('stairs');
  for (const x of [62, 63]) await smash(bot, x, turkey, 1, `the turkey at ${x}`, G);
  await smash(bot, S.AT.bags[2], bag, 1, 'the last kick bag', G);
  note('last bag');
  await leave(bot, bot.walk(S.AT.exit + 1, 'the end of Main Street'), 'the end of Main Street');
}

/** 7. Big Gobble (Mr. Plume): the boss, against the bar. */
export async function bigGobble(bot: StarterBot): Promise<void> {
  const G = B.GROUND - 1;
  const stake = [MONS.stake, MONS.stake + 1, MONS.stake + 2];
  await read(bot, 9, 'hall doors');
  await cross(bot, B.AT.drone - 2, 'up to the drone');
  await meet(bot, [MONS.drone], G, 'the street drone', 60, 260);
  await smash(bot, B.AT.turkey, [MONS.inflatable], 1, 'a lawn turkey', G);
  // Big Gobble's little balloons: stand and kick them as they drift in, until the next one is a while off
  await cross(bot, B.AT.gobble - 6, 'facing Big Gobble');
  let popped = 0;
  for (let t = 0; t < 700 && popped < 3; t++) {
    const me = bot.px.x;
    if (process.env.DEBUG_SMASH && t % 50 === 0) bot.say(`balloons t${t} me ${me}: ${JSON.stringify(monsters(bot, [MONS.gobblet]))}`);
    const near = monsters(bot, [MONS.gobblet]).filter((m) => m.x > me && m.x - me <= 56 && m.y >= G - 1);
    if (near.length) {
      const score = bot.sim.ci.score;
      await face(bot, 'right');
      await enter(bot);
      if (bot.sim.ci.score > score) popped++;
    } else await must(bot, bot.tick(), 'waiting for a balloon');
  }
  bot.say(`popped ${popped} balloons, hit points ${bot.sim.ci.hitpts}`);
  await read(bot, B.AT.stake1 - 3, 'stakes');
  await smash(bot, B.AT.stake1, stake, 1, 'the first stake', G);
  await climb(bot, B.AT.ladder, 11, 'the parade stand');
  await smash(bot, B.AT.stake2, stake, 1, 'the second stake', 11);
  await cross(bot, B.AT.ledge[1], 'along the stand');
  await cross(bot, B.AT.ledge[1] + 2, 'off the stand');
  await smash(bot, B.AT.stake3, stake, 1, 'the third stake', G);
  await cross(bot, B.AT.swoop - 2, 'before the dropping drone');
  await meet(bot, [MONS.droneSwoop], G, 'the dropping drone', 50, 120, 1200);
  await smash(
    bot,
    B.AT.blower,
    Array.from({ length: BLOWER_HITS }, (_, i) => MONS.blower + i),
    3,
    'the blower',
    G,
  );
  await cross(bot, B.AT.guard - 2, 'up to the guard drone');
  await meet(bot, [MONS.drone], G, 'the guard drone', 60, 260);
  bot.say(`bar left: ${((B.SECONDS * 18.2 - bot.sim.ticks) / 18.2) | 0} s`);
  await cross(bot, B.AT.hall + 2, 'into the town hall');
  await read(bot, B.AT.exit - 4, 'long table');
  await leave(bot, bot.walk(B.AT.exit + 1, 'the long table'), 'the long table');
}

export const LEVELS = [pumpkinYard, payback, gravyRelay, windyPark, rooftopPotluck, senseisDojo, theCord, dogPark, mainStreet, bigGobble];
