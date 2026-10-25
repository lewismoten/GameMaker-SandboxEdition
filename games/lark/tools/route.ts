// The way through, scene by scene, as the bot plays it: the library (the storybook, the
// workbench, the little red door), up the road's first lane, the square (Doc Leo), the tower and
// the belfry (three gears, the hammer, the bell), the square at seven (the rope, the winding key,
// Doc Leo's thank-you, out by the swing gate), and east along the road through the field gate.
import { SCENE } from '../src/ids';
import { parkMonsters } from '../src/sprites/critters';
import { at } from '../src/levels/stamp';
import { Bot } from './bot';
import type { GameSim } from './sim';

type Step = (bot: Bot) => Promise<void>;

/** The park's monster numbers (its .MON). */
const MON = parkMonsters;

/** The tower's escapement row (drawing coordinates, levels/clock.ts TOWER_ROWS). */
const ESCAPEMENT_ROW = 9;

const ok = (r: string | undefined, label: string) => {
  if (r) throw new Error(`${label}: ${r}`);
};

/** The library at closing time: the storybook, then the workbench, which leads out to the road. */
export const library: Step = async (bot) => {
  await bot.wait(30);
  const book = at(4, 7);
  await bot.take(book.x, book.y, SCENE.talkBook, 'the storybook');
  await bot.pass(SCENE.library, 'back from the storybook');
  const stool = at(17, 5);
  await bot.take(stool.x, stool.y, SCENE.talkBench, 'the workbench');
  await bot.pass(SCENE.road1, 'out of the little red door');
};

/** The road, up the first lane to the clock. */
export const toClock: Step = async (bot) => {
  const lane = at(10, 1);
  await bot.take(lane.x, lane.y, SCENE.card1, 'the lane to the clock');
  await bot.pass(SCENE.square, 'chapter one');
};

/** The square at 6:59: Doc Leo, then the tower door. */
export const square: Step = async (bot) => {
  const leo = at(6, 6);
  await bot.take(leo.x, leo.y, SCENE.talkLeo, 'Doc Leo');
  await bot.pass(SCENE.square, 'back from Doc Leo');
  const door = at(11, 3);
  await bot.take(door.x, door.y, SCENE.tower, 'the tower door');
};

/** Waits until the bridge at drawing cell (x, y) shows `block` (just turned), up to `max` ticks. */
async function waitFor(bot: Bot, x: number, y: number, block: number, label: string, max = 140): Promise<void> {
  for (let t = 0; t < max; t++) {
    if (bot.showing(x, y) === block) return;
    ok(await bot.tick(), label);
  }
  throw new Error(`${label}: the bridge never came`);
}

/** Up the tower: the floors, the first gear, the escapement (tock, tick, tock), the second gear, the hatch. */
export function tower(ids: { tick: number; tock: number }): Step {
  return async (bot) => {
    await bot.wait(10);
    ok(await bot.walk(3, 'under the first floor'), 'tower');
    ok(await bot.hop('right', 8, 'right', 6), 'up to the first floor');
    ok(await bot.walk(7, 'first floor'), 'tower');
    ok(await bot.hop('right', 8, 'right', 9), 'up to the second floor');
    ok(await bot.walk(10, 'second floor'), 'tower');
    ok(await bot.hop('right', 8, 'right', 12), 'up to the gear floor');
    ok(await bot.walk(16, 'the first gear'), 'tower');
    ok(await bot.walk(18, 'gear floor east'), 'tower');
    ok(await bot.hop('right', 8, 'right', 18), 'up to the ledge');
    ok(await bot.hop('right', 8, 'right', 20), 'up to the next ledge');
    ok(await bot.hop('up', 8), 'up to the top ledge');
    // the escapement: from the ledge onto its east end, then west across tick, tock and tick
    ok(await bot.hop('left', 6, 'left', 18), 'onto the escapement');
    for (const [x, id, name] of [
      [16, ids.tick, 'the east tick'],
      [11, ids.tock, 'the tock'],
      [6, ids.tick, 'the west tick'],
    ] as const) {
      await waitFor(bot, x, ESCAPEMENT_ROW, id, name);
      ok(await bot.walk(x - 2, `across ${name}`), name);
    }
    ok(await bot.walk(2, 'the second gear'), 'tower');
    ok(await bot.hop('right', 8, 'right', 3), 'up to the west floor');
    ok(await bot.walk(4, 'west floor'), 'tower');
    ok(await bot.hop('right', 10, 'right', 7), 'up to the middle floor');
    ok(await bot.walk(9, 'middle floor'), 'tower');
    ok(await bot.hop('right', 8, 'right', 12), 'up to the top floor');
    const r = await bot.walk(22, 'the hatch');
    if (r !== 'link' || bot.sim.scene !== SCENE.belfry) throw new Error(`the hatch: ${r ?? 'no link'}`);
  };
}

/** The belfry: the third gear, the hammer, the bell rope. */
export const belfry: Step = async (bot) => {
  await bot.wait(10);
  ok(await bot.walk(6, 'under the west floor'), 'belfry');
  ok(await bot.hop('left', 8, 'left', 4), 'up to the west floor');
  ok(await bot.walk(3, 'the third gear'), 'belfry');
  ok(await bot.walk(8, 'off the floor'), 'belfry');
  const r = await bot.walk(16, 'the bell rope');
  if (r !== 'link' || bot.sim.scene !== SCENE.bell) throw new Error(`the bell rope: ${r ?? 'no link'}`);
  await bot.pass(SCENE.square7, 'seven bells');
};

/** The square at seven: the rope, the key, Doc Leo, out by the swing gate, and down the lane. */
export const square7: Step = async (bot) => {
  const rope = at(6, 8);
  ok(await bot.goto(rope.x, rope.y, 'the rope'), 'square7');
  const key = at(7, 6);
  ok(await bot.goto(key.x, key.y, 'the winding key'), 'square7');
  ok(await bot.tap('space'), 'picking up the key');
  const leo = at(6, 6);
  await bot.take(leo.x, leo.y, SCENE.talkLeo7, 'Doc Leo at seven');
  await bot.pass(SCENE.square7, "Doc Leo's thank-you");
  const swing = at(7, 8);
  ok(await bot.goto(swing.x, swing.y, 'the swing gate'), 'square7');
  const exit = at(11, 12);
  await bot.take(exit.x, exit.y, SCENE.road1, 'down the lane');
};

/** Chapter 2: Teddy at the gate, the lawn's valentines, Gwinn, the arch, Teddy's thank-you, out. */
export const park: Step = async (bot) => {
  const lane = at(19, 1);
  await bot.take(lane.x, lane.y, SCENE.card2, 'the lane to the park');
  await bot.pass(SCENE.park, 'chapter two');
  const teddy = at(13, 16);
  await bot.take(teddy.x, teddy.y, SCENE.talkTeddy, 'Teddy at the gate');
  await bot.pass(SCENE.park, 'back from Teddy');
  await bot.chase(MON.valentine, 'valentine');
  await bot.chase(MON.gwinn, 'Gwinn');
  const gate = (x: number, y: number) => (cx: number, cy: number) => cx === x && cy === y;
  for (const [x, y, label] of [
    [14, 4, 'the arch'],
    [14, 3, "Teddy's rope"],
    [15, 1, "Teddy's valentine"],
  ] as const) {
    const c = at(x, y);
    ok(await bot.goto(c.x, c.y, label, gate(c.x, c.y)), label);
  }
  ok(await bot.tap('space'), "picking up Teddy's valentine");
  const teddy2 = at(14, 1);
  await bot.take(teddy2.x, teddy2.y, SCENE.talkTeddy2, "Teddy's party");
  await bot.pass(SCENE.park, "Teddy's thank-you");
  const swing = at(15, 3);
  ok(await bot.goto(swing.x, swing.y, 'the swing gate'), 'park');
  const exit = at(15, 19);
  await bot.take(exit.x, exit.y, SCENE.road1, 'out of the park');
};

/** Chapter 3: across the parade for the drumsticks, the drum, the Bard's thank-you, and north to the road. */
export const street: Step = async (bot) => {
  const lane = at(27, 1);
  await bot.take(lane.x, lane.y, SCENE.card3, 'the lane to Main Street');
  await bot.pass(SCENE.street, 'chapter three');
  const careful = true;
  for (const [x, y, label] of [
    [4, 9, 'the first drumstick'],
    [17, 6, 'the second drumstick'],
  ] as const) {
    const c = at(x, y);
    ok(await bot.goto(c.x, c.y, label, undefined, careful), label);
  }
  const gate = (x: number, y: number) => (cx: number, cy: number) => cx === x && cy === y;
  for (const [x, y, label] of [
    [5, 4, 'the bass drum'],
    [5, 3, "the Bard's rope"],
    [6, 1, "the Bard's drumstick"],
  ] as const) {
    const c = at(x, y);
    ok(await bot.goto(c.x, c.y, label, gate(c.x, c.y)), label);
  }
  ok(await bot.tap('space'), "picking up the Bard's drumstick");
  const bardAt = at(5, 1);
  await bot.take(bardAt.x, bardAt.y, SCENE.talkBard, 'the Bard');
  await bot.pass(SCENE.street, "the Bard's thank-you");
  const swing = at(6, 3);
  ok(await bot.goto(swing.x, swing.y, 'the swing gate'), 'street');
  const exit = at(16, 0);
  await bot.take(exit.x, exit.y, SCENE.road1, 'back to the road');
};

/** The road east, through the field gate and over the hill. */
export const onward: Step = async (bot) => {
  const gate = at(33, 12);
  const end = at(34, 12);
  const r = await bot.goto(end.x, end.y, 'the road on', (x, y) => x === gate.x && y === gate.y);
  if (r !== 'link' || bot.sim.scene !== SCENE.over) throw new Error(`the road on: ${r ?? 'no link'}`);
  for (let i = 0; i < 4 && !bot.sim.ended; i++) await bot.tick();
  if (bot.sim.ended !== 'won') throw new Error('over the hill: the game did not end');
};

export async function playThrough(sim: GameSim, ids: { tick: number; tock: number }): Promise<Bot> {
  const bot = new Bot(sim);
  try {
    for (const step of [library, toClock, square, tower(ids), belfry, square7, park, street, onward]) await step(bot);
  } catch (e) {
    console.error((process.env.BOT_LOG ? bot.log : bot.log.slice(-30)).join('\n'));
    throw e;
  }
  return bot;
}
